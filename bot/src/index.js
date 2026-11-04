// Bot Discord NEXORIA — point d'entrée.
// Relie le Discord au site GitHub Pages :
//   • les commandes écrivent dans data/live.json du dépôt GitHub (le site se met à jour tout seul)
//   • l'API /api/live donne au site les stats Discord + le statut du serveur Gmod en direct
import { Client, GatewayIntentBits, Partials, Events, REST, Routes, ActivityType, MessageFlags } from 'discord.js';
import { createStore } from './store.js';
import { queryServer } from './gmod.js';
import { startApi } from './api.js';
import { definitions, execute, autocomplete, modalSubmit, mirrorMessage, unmirrorMessage, UserError } from './commands.js';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch { /* pas de .env : variables de l'hébergeur */ }

const env = process.env;
for (const k of ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO']) {
  if (!env[k]) { console.error(`❌ Variable manquante : ${k} (voir bot/.env.example)`); process.exit(1); }
}

const store = createStore({ token: env.GITHUB_TOKEN, owner: env.GITHUB_OWNER, repo: env.GITHUB_REPO, branch: env.GITHUB_BRANCH || 'main' });
const mirror = Boolean(env.ANNOUNCE_CHANNEL_ID);

const intents = [GatewayIntentBits.Guilds];
if (mirror) intents.push(GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent);
const client = new Client({ intents, partials: [Partials.Message] });

/* ---------- état en direct ---------- */
let discord = null;          // { name, icon, members, online, invite }
let servers = {};            // { [projectId]: { online, players, maxPlayers, map, address } }

async function refreshDiscord() {
  try {
    const g = await client.guilds.fetch({ guild: env.DISCORD_GUILD_ID, withCounts: true, force: true });
    discord = {
      name: g.name,
      icon: g.iconURL({ size: 128, extension: 'png' }),
      members: g.approximateMemberCount ?? g.memberCount,
      online: g.approximatePresenceCount ?? null,
      invite: env.DISCORD_INVITE || null
    };
  } catch (e) { console.error('[discord] stats :', e.message); }
}

async function refreshServers() {
  const projects = await store.projects();
  const live = store.live.projects || {};
  const next = {};
  await Promise.all(projects.filter((p) => p.server).map(async (p) => {
    const address = live[p.id]?.address || p.server.address;
    if (!address) return;
    try { next[p.id] = { address, ...(await queryServer(address)), checkedAt: new Date().toISOString() }; }
    catch { next[p.id] = { address, online: false, checkedAt: new Date().toISOString() }; }
  }));
  servers = next;
  const total = Object.values(servers).reduce((a, s) => a + (s.players || 0), 0);
  client.user?.setActivity(Object.keys(servers).length ? `${total} joueur(s) en ligne` : 'nexoria', { type: ActivityType.Watching });
}

const ctx = {
  store,
  siteUrl: env.SITE_URL || '',
  announceChannelId: env.ANNOUNCE_CHANNEL_ID || null,
  getServers: () => servers,
  refreshServers: () => refreshServers().catch(() => {})
};

/* ---------- Discord ---------- */
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Connecté en tant que ${c.user.tag}`);
  const rest = new REST().setToken(env.DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), { body: definitions });
  console.log(`✅ ${definitions.length} commandes enregistrées`);
  await refreshDiscord();
  await refreshServers().catch((e) => console.error('[gmod]', e.message));
  setInterval(refreshDiscord, 5 * 60_000);
  setInterval(() => refreshServers().catch((e) => console.error('[gmod]', e.message)), 60_000);
});

client.on(Events.InteractionCreate, async (i) => {
  try {
    if (i.isAutocomplete()) return await autocomplete(ctx, i);
    if (i.isModalSubmit()) return await modalSubmit(ctx, i);
    if (i.isChatInputCommand()) return await execute(ctx, i);
  } catch (e) {
    if (!(e instanceof UserError)) console.error(`[${i.commandName || i.customId}]`, e);
    const content = e instanceof UserError ? `⚠️ ${e.message}` : '❌ Une erreur est survenue (voir les logs du bot).';
    if (i.isAutocomplete()) return;
    if (i.deferred || i.replied) await i.editReply({ content }).catch(() => {});
    else await i.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
  }
});

if (mirror) {
  const fromAnnounce = (m) => m.channelId === env.ANNOUNCE_CHANNEL_ID && !m.author?.bot;
  client.on(Events.MessageCreate, (m) => { if (fromAnnounce(m)) mirrorMessage(ctx, m).catch((e) => console.error('[mirror]', e.message)); });
  client.on(Events.MessageUpdate, async (_old, m) => {
    if (m.partial) m = await m.fetch().catch(() => null);
    if (m && fromAnnounce(m)) mirrorMessage(ctx, m, { edit: true }).catch((e) => console.error('[mirror]', e.message));
  });
  client.on(Events.MessageDelete, (m) => { if (m.channelId === env.ANNOUNCE_CHANNEL_ID) unmirrorMessage(ctx, m.id).catch((e) => console.error('[mirror]', e.message)); });
}

/* ---------- API pour le site ---------- */
startApi({
  port: Number(env.PORT) || 3000,
  siteUrl: env.SITE_URL,
  getPayload: async () => ({ ok: true, discord, servers, live: store.live, at: new Date().toISOString() })
});

await store.load().catch((e) => console.error('[store] chargement :', e.message));
await client.login(env.DISCORD_TOKEN);
