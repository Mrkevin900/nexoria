// Lecture/écriture des fichiers du site directement dans le dépôt GitHub.
// Chaque modification = un commit → GitHub Pages republie le site (~1 min).
// En parallèle, l'API du bot sert la version en mémoire tout de suite.

const API = 'https://api.github.com';
const LIVE_PATH = 'data/live.json';
const PROJECTS_PATH = 'data/projects.json';

export const EMPTY_LIVE = () => ({
  _info: 'Fichier écrit automatiquement par le bot Discord NEXORIA. Ne pas modifier à la main pendant que le bot tourne.',
  updatedAt: null,
  news: [],
  projects: {},
  bosses: {}
});

export function createStore({ token, owner, repo, branch = 'main' }) {
  if (!token || !owner || !repo) throw new Error('GITHUB_TOKEN, GITHUB_OWNER et GITHUB_REPO sont obligatoires.');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'nexoria-bot'
  };
  const url = (path) => `${API}/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;

  let live = EMPTY_LIVE();
  let projects = { projects: [] };
  let projectsAt = 0;
  let queue = Promise.resolve();

  async function getFile(path) {
    const r = await fetch(`${url(path)}?ref=${encodeURIComponent(branch)}`, { headers });
    if (r.status === 404) return { text: null, sha: null };
    if (!r.ok) throw new Error(`GitHub GET ${path} : ${r.status} ${await r.text()}`);
    const j = await r.json();
    return { text: Buffer.from(j.content, 'base64').toString('utf8'), sha: j.sha };
  }

  async function putFile(path, buffer, message, sha) {
    const body = { message, content: buffer.toString('base64'), branch };
    if (sha) body.sha = sha;
    const r = await fetch(url(path), { method: 'PUT', headers, body: JSON.stringify(body) });
    return r;
  }

  // Les écritures passent une par une (file d'attente) pour éviter les conflits.
  function serial(fn) {
    const p = queue.then(fn, fn);
    queue = p.catch(() => {});
    return p;
  }

  return {
    get live() { return live; },

    async load() {
      const { text } = await getFile(LIVE_PATH);
      live = text ? { ...EMPTY_LIVE(), ...JSON.parse(text) } : EMPTY_LIVE();
      await this.projects(true);
      return live;
    },

    // Contenu de base du site (projects.json), mis en cache 5 min.
    async projects(force = false) {
      if (force || Date.now() - projectsAt > 5 * 60_000) {
        try {
          const { text } = await getFile(PROJECTS_PATH);
          if (text) projects = JSON.parse(text);
          projectsAt = Date.now();
        } catch (e) { console.error('[store] projects.json :', e.message); }
      }
      return projects.projects || [];
    },

    // mutate(data) modifie l'objet ; en cas de conflit on relit et on réessaie.
    update(message, mutate) {
      return serial(async () => {
        for (let attempt = 0; attempt < 4; attempt++) {
          const { text, sha } = await getFile(LIVE_PATH);
          const data = text ? { ...EMPTY_LIVE(), ...JSON.parse(text) } : EMPTY_LIVE();
          const result = await mutate(data);
          data.updatedAt = new Date().toISOString();
          const r = await putFile(LIVE_PATH, Buffer.from(JSON.stringify(data, null, 2) + '\n'), `[bot] ${message}`, sha);
          if (r.ok) { live = data; return result; }
          if (r.status === 409 || r.status === 422) continue;
          throw new Error(`GitHub PUT live.json : ${r.status} ${await r.text()}`);
        }
        throw new Error('Conflit GitHub persistant, réessaie dans un instant.');
      });
    },

    // Envoie une image (ex : pièce jointe Discord) dans le dépôt et renvoie son chemin relatif.
    uploadAsset(path, buffer, message) {
      return serial(async () => {
        const { sha } = await getFile(path).catch(() => ({ sha: null }));
        const r = await putFile(path, buffer, `[bot] ${message}`, sha);
        if (!r.ok) throw new Error(`GitHub upload ${path} : ${r.status} ${await r.text()}`);
        return path;
      });
    },

    async deleteAsset(path, message) {
      return serial(async () => {
        const { sha } = await getFile(path);
        if (!sha) return;
        await fetch(url(path), { method: 'DELETE', headers, body: JSON.stringify({ message: `[bot] ${message}`, sha, branch }) });
      });
    }
  };
}
