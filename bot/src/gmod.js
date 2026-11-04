// Interroge un serveur Source (Garry's Mod) avec le protocole A2S_INFO (UDP).
// Le site ne peut pas faire d'UDP : c'est le bot qui le fait et le partage via son API.
import dgram from 'node:dgram';

const HEADER = Buffer.from([0xff, 0xff, 0xff, 0xff]);
const QUERY = Buffer.concat([HEADER, Buffer.from('TSource Engine Query\0', 'latin1')]);

export function parseAddress(addr) {
  const m = String(addr || '').trim().match(/^([\w.-]+)(?::(\d{1,5}))?$/);
  if (!m) return null;
  return { host: m[1], port: Number(m[2] || 27015) };
}

export function queryServer(address, timeout = 3000) {
  const target = parseAddress(address);
  if (!target) return Promise.reject(new Error('Adresse invalide'));
  return new Promise((resolve, reject) => {
    const sock = dgram.createSocket('udp4');
    const timer = setTimeout(() => { sock.close(); reject(new Error('Délai dépassé')); }, timeout);
    const done = (err, val) => { clearTimeout(timer); try { sock.close(); } catch {} err ? reject(err) : resolve(val); };

    sock.on('error', (e) => done(e));
    sock.on('message', (msg) => {
      try {
        if (msg.readInt32LE(0) !== -1) return;
        const type = msg[4];
        if (type === 0x41) { // challenge : on renvoie la requête avec le code reçu
          sock.send(Buffer.concat([QUERY, msg.subarray(5, 9)]), target.port, target.host);
          return;
        }
        if (type !== 0x49) return;
        let o = 6; // saute l'en-tête + l'octet "protocol"
        const str = () => { const end = msg.indexOf(0, o); const s = msg.toString('utf8', o, end); o = end + 1; return s; };
        const name = str(), map = str(), folder = str(), game = str();
        o += 2; // app id
        const players = msg[o++], maxPlayers = msg[o++], bots = msg[o++];
        done(null, { online: true, name, map, folder, game, players: Math.max(0, players - bots), maxPlayers, bots });
      } catch (e) { done(e); }
    });
    sock.send(QUERY, target.port, target.host);
  });
}
