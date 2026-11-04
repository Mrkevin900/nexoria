// Commandes slash du bot NEXORIA.
import {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags,
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder
} from 'discord.js';
import { randomUUID } from 'node:crypto';

const ADMIN = PermissionFlagsBits.ManageGuild;
const STEP_STATUS = [
  { name: 'Terminé', value: 'termine' },
  { name: 'En cours', value: 'en-cours' },
  { name: 'À venir', value: 'a-venir' }
];
const BOSS_STATUS = [
  { name: 'En conception', value: 'conception' },
  { name: 'En développement', value: 'developpement' },
  { name: 'Disponible en jeu', value: 'disponible' },
  { name: 'Vaincu', value: 'vaincu' }
];
const MAX_IMAGE = 8 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/* Définitions                                                         */
/* ------------------------------------------------------------------ */
const projet = (o, required = true) => o.setName('projet').setDescription('Projet NEXORIA').setRequired(required).setAutocomplete(true);

export const definitions = [
  new SlashCommandBuilder().setName('annonce').setDescription('Publier une actualité sur le site (et sur Discord)')
    .setDefaultMemberPermissions(ADMIN)
    .addStringOption((o) => projet(o, false))
    .addAttachmentOption((o) => o.setName('image').setDescription('Image de l’annonce (optionnel)'))
    .addBooleanOption((o) => o.setName('discord').setDescription('Poster aussi dans le salon d’annonces (oui par défaut)')),

  new SlashCommandBuilder().setName('actu-supprimer').setDescription('Retirer une actualité du site')
    .setDefaultMemberPermissions(ADMIN)
    .addStringOption((o) => o.setName('actu').setDescription('Actualité à retirer').setRequired(true).setAutocomplete(true)),

  new SlashCommandBuilder().setName('avancement').setDescription('Mettre à jour l’avancement d’un projet sur le site')
    .setDefaultMemberPermissions(ADMIN)
    .addSubcommand((s) => s.setName('etape').setDescription('Créer ou modifier une étape de la feuille de route')
      .addStringOption((o) => projet(o))
      .addStringOption((o) => o.setName('etape').setDescription('Nom de l’étape').setRequired(true).setAutocomplete(true).setMaxLength(80))
      .addStringOption((o) => o.setName('statut').setDescription('Statut').setRequired(true).addChoices(...STEP_STATUS))
      .addIntegerOption((o) => o.setName('pourcentage').setDescription('Progression de l’étape (si en cours)').setMinValue(0).setMaxValue(100)))
    .addSubcommand((s) => s.setName('global').setDescription('Fixer le pourcentage global du projet')
      .addStringOption((o) => projet(o))
      .addIntegerOption((o) => o.setName('pourcentage').setDescription('0 à 100 (mets -1 pour le calcul automatique)').setRequired(true).setMinValue(-1).setMaxValue(100)))
    .addSubcommand((s) => s.setName('infos').setDescription('Changer le statut, la version ou l’adresse du serveur')
      .addStringOption((o) => projet(o))
      .addStringOption((o) => o.setName('statut').setDescription('Ex : En développement, Bêta, Disponible').setMaxLength(40))
      .addStringOption((o) => o.setName('version').setDescription('Ex : 1.7').setMaxLength(20))
      .addStringOption((o) => o.setName('adresse').setDescription('Adresse du serveur de jeu, ex : 51.75.12.34:27015').setMaxLength(80))
      .addAttachmentOption((o) => o.setName('banniere').setDescription('Nouvelle bannière du projet')))
    .addSubcommand((s) => s.setName('retirer-etape').setDescription('Retirer une étape ajoutée depuis Discord')
      .addStringOption((o) => projet(o))
      .addStringOption((o) => o.setName('etape').setDescription('Étape').setRequired(true).setAutocomplete(true))),

  new SlashCommandBuilder().setName('boss').setDescription('Gérer les boss affichés sur le site')
    .setDefaultMemberPermissions(ADMIN)
    .addSubcommand((s) => bossOptions(s.setName('ajouter').setDescription('Ajouter un boss')
      .addStringOption((o) => projet(o))
      .addStringOption((o) => o.setName('nom').setDescription('Nom du boss').setRequired(true).setMaxLength(60))))
    .addSubcommand((s) => bossOptions(s.setName('modifier').setDescription('Modifier un boss')
      .addStringOption((o) => projet(o))
      .addStringOption((o) => o.setName('boss').setDescription('Boss à modifier').setRequired(true).setAutocomplete(true))
      .addStringOption((o) => o.setName('nom').setDescription('Nouveau nom').setMaxLength(60))))
    .addSubcommand((s) => s.setName('supprimer').setDescription('Supprimer un boss')
      .addStringOption((o) => projet(o))
      .addStringOption((o) => o.setName('boss').setDescription('Boss à supprimer').setRequired(true).setAutocomplete(true))),

  new SlashCommandBuilder().setName('statut').setDescription('Voir le statut des serveurs de jeu NEXORIA'),
  new SlashCommandBuilder().setName('site').setDescription('Lien du site officiel NEXORIA')
].map((c) => c.toJSON());

function bossOptions(s) {
  return s
    .addStringOption((o) => o.setName('description').setDescription('Courte description').setMaxLength(300))
    .addStringOption((o) => o.setName('statut').setDescription('Statut du boss').addChoices(...BOSS_STATUS))
    .addIntegerOption((o) => o.setName('progression').setDescription('Avancement du développement (%)').setMinValue(0).setMaxValue(100))
    .addIntegerOption((o) => o.setName('difficulte').setDescription('Difficulté de 1 à 5').setMinValue(1).setMaxValue(5))
    .addAttachmentOption((o) => o.setName('image').setDescription('Image du boss'))
    .addBooleanOption((o) => o.setName('mystere').setDescription('Cacher le nom et afficher l’image en silhouette'));
}

/* ------------------------------------------------------------------ */
/* Outils                                                              */
/* ------------------------------------------------------------------ */
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const ephemeral = { flags: MessageFlags.Ephemeral };

async function findProject(ctx, id, { required = true } = {}) {
  if (!id) { if (required) throw new UserError('Choisis un projet.'); return null; }
  const list = await ctx.store.projects();
  const p = list.find((x) => same(x.id, id) || same(x.name, id));
  if (!p) throw new UserError(`Projet inconnu : « ${id} ». Ajoute-le d’abord dans data/projects.json.`);
  return p;
}

// Télécharge une pièce jointe Discord et la range dans le dépôt du site
// (les liens Discord expirent, ceux du dépôt non).
export async function saveImage(ctx, att, folder) {
  if (!att) return null;
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(att.contentType || '')) throw new UserError('L’image doit être en PNG, JPG, WEBP ou GIF.');
  if (att.size > MAX_IMAGE) throw new UserError('Image trop lourde (8 Mo maximum).');
  const r = await fetch(att.url);
  if (!r.ok) throw new Error(`Téléchargement de l’image impossible (${r.status})`);
  const buf = Buffer.from(await r.arrayBuffer());
  const ext = att.contentType.split('/')[1].replace('jpeg', 'jpg');
  const path = `assets/uploads/${folder}/${Date.now()}-${slug(att.name.replace(/\.\w+$/, ''))}.${ext}`;
  return ctx.store.uploadAsset(path, buf, `image ${path}`);
}

export class UserError extends Error {}

function siteLink(ctx, hash = '') {
  return ctx.siteUrl ? ctx.siteUrl.replace(/\/?$/, '/') + hash : null;
}
function okMsg(ctx, text, hash) {
  const l = siteLink(ctx, hash);
  return `✅ ${text}${l ? `\nVisible sur ${l} d’ici environ une minute.` : ''}`;
}

/* ------------------------------------------------------------------ */
/* Autocomplétion                                                      */
/* ------------------------------------------------------------------ */
export async function autocomplete(ctx, i) {
  const focused = i.options.getFocused(true);
  const q = String(focused.value || '').toLowerCase();
  let choices = [];
  const live = ctx.store.live;

  if (focused.name === 'projet') {
    choices = (await ctx.store.projects()).map((p) => ({ name: p.name, value: p.id }));
  } else if (focused.name === 'actu') {
    choices = (live.news || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((n) => ({ name: `${n.title}`.slice(0, 100), value: n.id }));
  } else if (focused.name === 'boss') {
    const pid = i.options.getString('projet');
    const p = (await ctx.store.projects()).find((x) => x.id === pid);
    const liveList = (live.bosses || {})[pid] || [];
    const names = new Map();
    for (const b of (Array.isArray(p?.bosses) ? p.bosses : [])) names.set(b.name.toLowerCase(), b.name);
    for (const b of liveList) {
      if (b.baseName) names.delete(b.baseName.toLowerCase());
      if (b.removed) names.delete(b.name.toLowerCase()); else names.set(b.name.toLowerCase(), b.name);
    }
    choices = [...names.values()].map((n) => ({ name: n.slice(0, 100), value: n.slice(0, 100) }));
  } else if (focused.name === 'etape') {
    const pid = i.options.getString('projet');
    const p = (await ctx.store.projects()).find((x) => x.id === pid);
    const names = new Set([...(p?.roadmap || []).map((s) => s.name), ...(((live.projects || {})[pid] || {}).roadmap || []).map((s) => s.name)]);
    choices = [...names].map((n) => ({ name: n.slice(0, 100), value: n.slice(0, 100) }));
    if (q && !choices.some((c) => c.name.toLowerCase() === q)) choices.unshift({ name: `➕ Nouvelle étape : ${focused.value}`.slice(0, 100), value: String(focused.value).slice(0, 100) });
  }
  await i.respond(choices.filter((c) => c.name.toLowerCase().includes(q) || c.value.toLowerCase().includes(q)).slice(0, 25));
}

/* ------------------------------------------------------------------ */
/* Exécution                                                           */
/* ------------------------------------------------------------------ */
const pendingNews = new Map(); // options de /annonce en attente du formulaire

export async function execute(ctx, i) {
  switch (i.commandName) {
    case 'annonce': return annonce(ctx, i);
    case 'actu-supprimer': return actuSupprimer(ctx, i);
    case 'avancement': return avancement(ctx, i);
    case 'boss': return boss(ctx, i);
    case 'statut': return statut(ctx, i);
    case 'site': {
      const l = siteLink(ctx);
      return i.reply(l ? `🌐 Site officiel NEXORIA : ${l}` : 'Le site n’est pas encore configuré (SITE_URL).');
    }
  }
}

/* /annonce → ouvre un formulaire (permet un texte sur plusieurs lignes) */
async function annonce(ctx, i) {
  const pid = i.options.getString('projet');
  if (pid) await findProject(ctx, pid);
  const key = randomUUID().slice(0, 8);
  pendingNews.set(key, { projet: pid, image: i.options.getAttachment('image'), discord: i.options.getBoolean('discord') ?? true });
  setTimeout(() => pendingNews.delete(key), 15 * 60_000);

  const modal = new ModalBuilder().setCustomId(`annonce:${key}`).setTitle('Nouvelle annonce NEXORIA').addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('titre').setLabel('Titre').setStyle(TextInputStyle.Short).setMaxLength(120).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('texte').setLabel('Texte').setStyle(TextInputStyle.Paragraph).setMaxLength(3000).setRequired(true))
  );
  await i.showModal(modal);
}

export async function modalSubmit(ctx, i) {
  const [kind, key] = i.customId.split(':');
  if (kind !== 'annonce') return;
  const opts = pendingNews.get(key);
  if (!opts) return i.reply({ content: 'Formulaire expiré, relance /annonce.', ...ephemeral });
  pendingNews.delete(key);
  await i.deferReply(ephemeral);

  const title = i.fields.getTextInputValue('titre').trim();
  const text = i.fields.getTextInputValue('texte').trim();
  const project = opts.projet ? await findProject(ctx, opts.projet) : null;
  const image = await saveImage(ctx, opts.image, 'news');
  const item = {
    id: `n-${Date.now().toString(36)}`,
    title, text,
    project: project?.id || null,
    image,
    author: i.member?.displayName || i.user.username,
    date: new Date().toISOString()
  };

  // Publication dans le salon d'annonces Discord (optionnel)
  if (opts.discord && ctx.announceChannelId) {
    try {
      const ch = await i.client.channels.fetch(ctx.announceChannelId);
      const embed = new EmbedBuilder().setTitle(title).setDescription(text).setColor(project?.accent ? parseInt(project.accent.slice(1), 16) : 0xe11d2e)
        .setAuthor({ name: project ? `${project.name} · NEXORIA` : 'NEXORIA' }).setTimestamp(new Date(item.date));
      const link = siteLink(ctx, '#actualites');
      if (link) embed.setURL(link);
      const files = [];
      if (opts.image) { embed.setImage(`attachment://${opts.image.name}`); files.push({ attachment: opts.image.url, name: opts.image.name }); }
      const msg = await ch.send({ embeds: [embed], files });
      item.discordMessageId = msg.id;
    } catch (e) { console.error('[annonce] envoi Discord :', e.message); }
  }

  await ctx.store.update(`actu : ${title}`, (data) => { data.news = [item, ...(data.news || [])].slice(0, 100); });
  await i.editReply(okMsg(ctx, `Annonce « ${title} » publiée.`, '#actualites'));
}

async function actuSupprimer(ctx, i) {
  await i.deferReply(ephemeral);
  const id = i.options.getString('actu');
  const removed = await ctx.store.update('suppression actu', (data) => {
    const n = (data.news || []).find((x) => x.id === id);
    data.news = (data.news || []).filter((x) => x.id !== id);
    return n;
  });
  if (!removed) return i.editReply('Actualité introuvable.');
  if (removed.image?.startsWith('assets/uploads/')) await ctx.store.deleteAsset(removed.image, 'image actu supprimée').catch(() => {});
  await i.editReply(okMsg(ctx, `Actualité « ${removed.title} » retirée du site.`));
}

/* Copie un message du salon d'annonces vers le site (appelé depuis index.js) */
export async function mirrorMessage(ctx, msg, { edit = false } = {}) {
  const content = (msg.content || '').trim();
  if (!content && !msg.attachments.size) return;
  const lines = content.split('\n');
  const clean = (s) => s.replace(/[*_~`#>]+/g, '').replace(/<@[!&]?\d+>|@everyone|@here/g, '').trim();
  const title = clean(lines[0] || '').slice(0, 120) || 'Annonce';
  const text = clean(lines.slice(1).join('\n')).slice(0, 3000);
  const projects = await ctx.store.projects();
  const project = projects.find((p) => content.toLowerCase().includes(p.name.toLowerCase()) || content.toLowerCase().includes(p.id));
  const att = msg.attachments.find((a) => /^image\//.test(a.contentType || ''));
  let image = null;
  if (att && !edit) { try { image = await saveImage(ctx, att, 'news'); } catch (e) { console.error('[mirror] image :', e.message); } }

  await ctx.store.update(`${edit ? 'maj' : 'actu'} Discord : ${title}`, (data) => {
    data.news = data.news || [];
    const existing = data.news.find((n) => n.discordMessageId === msg.id);
    if (existing) { Object.assign(existing, { title, text, project: project?.id || existing.project }); return; }
    if (edit) return;
    data.news.unshift({
      id: `d-${msg.id}`, title, text, project: project?.id || null, image,
      author: msg.member?.displayName || msg.author.username,
      date: msg.createdAt.toISOString(), discordMessageId: msg.id
    });
    data.news = data.news.slice(0, 100);
  });
}

export async function unmirrorMessage(ctx, id) {
  if (!(ctx.store.live.news || []).some((n) => n.discordMessageId === id)) return;
  await ctx.store.update('actu Discord supprimée', (data) => { data.news = (data.news || []).filter((n) => n.discordMessageId !== id); });
}

/* /avancement */
async function avancement(ctx, i) {
  await i.deferReply(ephemeral);
  const sub = i.options.getSubcommand();
  const p = await findProject(ctx, i.options.getString('projet'));
  const ov = (data) => { data.projects = data.projects || {}; return (data.projects[p.id] = data.projects[p.id] || {}); };

  if (sub === 'etape') {
    const name = i.options.getString('etape').trim();
    const status = i.options.getString('statut');
    const progress = i.options.getInteger('pourcentage');
    await ctx.store.update(`${p.name} : étape « ${name} »`, (data) => {
      const o = ov(data); o.roadmap = o.roadmap || [];
      let s = o.roadmap.find((x) => same(x.name, name));
      if (!s) { s = { name }; o.roadmap.push(s); }
      s.status = status;
      if (progress != null) s.progress = progress; else delete s.progress;
    });
    return i.editReply(okMsg(ctx, `${p.name} — étape « ${name} » : ${STEP_STATUS.find((x) => x.value === status).name}${progress != null ? ` (${progress} %)` : ''}.`, `#${p.id}`));
  }

  if (sub === 'global') {
    const v = i.options.getInteger('pourcentage');
    await ctx.store.update(`${p.name} : avancement global`, (data) => { const o = ov(data); if (v < 0) delete o.progress; else o.progress = v; });
    return i.editReply(okMsg(ctx, v < 0 ? `${p.name} : avancement calculé automatiquement.` : `${p.name} : avancement global à ${v} %.`, `#${p.id}`));
  }

  if (sub === 'infos') {
    const status = i.options.getString('statut');
    const version = i.options.getString('version');
    const address = i.options.getString('adresse');
    const banner = await saveImage(ctx, i.options.getAttachment('banniere'), `projects/${p.id}`);
    if (!status && !version && !address && !banner) return i.editReply('Rien à changer : remplis au moins une option.');
    await ctx.store.update(`${p.name} : infos`, (data) => {
      const o = ov(data);
      if (status) o.status = status;
      if (version) o.version = version;
      if (address) o.address = address.trim();
      if (banner) o.banner = banner;
    });
    if (address) ctx.refreshServers?.();
    return i.editReply(okMsg(ctx, `${p.name} mis à jour.`, `#${p.id}`));
  }

  if (sub === 'retirer-etape') {
    const name = i.options.getString('etape');
    const found = await ctx.store.update(`${p.name} : retrait étape`, (data) => {
      const o = ov(data); const before = (o.roadmap || []).length;
      o.roadmap = (o.roadmap || []).filter((x) => !same(x.name, name));
      return before !== o.roadmap.length;
    });
    return i.editReply(found ? okMsg(ctx, `Étape « ${name} » retirée.`, `#${p.id}`)
      : 'Cette étape vient de data/projects.json : modifie-la avec /avancement etape ou directement dans le fichier.');
  }
}

/* /boss */
async function boss(ctx, i) {
  await i.deferReply(ephemeral);
  const sub = i.options.getSubcommand();
  const p = await findProject(ctx, i.options.getString('projet'));

  // Boss écrits dans data/projects.json : le bot ne peut pas modifier ce fichier,
  // il enregistre donc une surcouche dans live.json (même nom, ou baseName si renommé).
  const staticBoss = (name) => (Array.isArray(p.bosses) ? p.bosses : []).find((b) => same(b.name, name));

  if (sub === 'supprimer') {
    const id = i.options.getString('boss');
    const removed = await ctx.store.update(`${p.name} : boss supprimé`, (data) => {
      const list = ((data.bosses = data.bosses || {})[p.id] = data.bosses[p.id] || []);
      const b = list.find((x) => x.id === id || same(x.name, id));
      const base = staticBoss(b?.baseName || b?.name || id);
      if (base) {
        if (b) { b.removed = true; return b; }
        const r = { name: base.name, removed: true };
        list.push(r);
        return r;
      }
      if (!b) return null;
      data.bosses[p.id] = list.filter((x) => x !== b);
      return b;
    });
    if (!removed) return i.editReply('Boss introuvable.');
    if (removed.image?.startsWith('assets/uploads/')) await ctx.store.deleteAsset(removed.image, 'image boss supprimée').catch(() => {});
    return i.editReply(okMsg(ctx, `Boss « ${removed.name} » supprimé.`, `#${p.id}`));
  }

  const fields = {};
  const set = (k, v) => { if (v != null) fields[k] = v; };
  set('name', i.options.getString('nom')?.trim());
  set('description', i.options.getString('description')?.trim());
  set('status', i.options.getString('statut'));
  set('progress', i.options.getInteger('progression'));
  set('difficulty', i.options.getInteger('difficulte'));
  set('hidden', i.options.getBoolean('mystere'));
  const image = await saveImage(ctx, i.options.getAttachment('image'), `bosses/${p.id}`);
  if (image) fields.image = image;

  if (sub === 'ajouter') {
    const b = await ctx.store.update(`${p.name} : nouveau boss ${fields.name}`, (data) => {
      const list = ((data.bosses = data.bosses || {})[p.id] = data.bosses[p.id] || []);
      if (list.some((x) => same(x.name, fields.name) && !x.removed) || staticBoss(fields.name)) throw new UserError(`Un boss « ${fields.name} » existe déjà. Utilise /boss modifier.`);
      const nb = { id: `b-${slug(fields.name)}-${Date.now().toString(36).slice(-4)}`, status: 'conception', ...fields };
      list.push(nb);
      return nb;
    });
    return i.editReply(okMsg(ctx, `Boss « ${b.name} » ajouté à ${p.name}.`, `#${p.id}`));
  }

  if (sub === 'modifier') {
    if (!Object.keys(fields).length) return i.editReply('Rien à changer : remplis au moins une option.');
    const id = i.options.getString('boss');
    const b = await ctx.store.update(`${p.name} : boss modifié`, (data) => {
      const list = ((data.bosses = data.bosses || {})[p.id] = data.bosses[p.id] || []);
      let x = list.find((y) => y.id === id || same(y.name, id));
      if (!x) {
        const base = staticBoss(id);
        if (!base) throw new UserError('Boss introuvable.');
        x = { id: `b-${slug(base.name)}`, name: base.name, baseName: base.name };
        list.push(x);
      }
      Object.assign(x, fields);
      delete x.removed;
      return x;
    });
    return i.editReply(okMsg(ctx, `Boss « ${b.name} » mis à jour.`, `#${p.id}`));
  }
}

/* /statut */
async function statut(ctx, i) {
  const servers = ctx.getServers();
  const projects = await ctx.store.projects();
  const ids = Object.keys(servers);
  if (!ids.length) return i.reply({ content: 'Aucun serveur de jeu configuré pour l’instant (utilise /avancement infos … adresse).', ...ephemeral });
  const embed = new EmbedBuilder().setTitle('Serveurs NEXORIA').setColor(0xe11d2e);
  for (const id of ids) {
    const s = servers[id];
    const name = projects.find((p) => p.id === id)?.name || id;
    embed.addFields({
      name: `${s.online ? '🟢' : '🔴'} ${name}`,
      value: s.online ? `${s.players}/${s.maxPlayers} joueurs · ${s.map}\n\`${s.address}\`` : `Hors ligne\n\`${s.address}\``
    });
  }
  const l = siteLink(ctx);
  if (l) embed.setURL(l);
  await i.reply({ embeds: [embed] });
}
