/* =========================================================
   NEXUS STUDIO — QG privé de NEXORIA
   - Accès : un code par administrateur. Le code n'est écrit nulle part : il sert de clé
     (PBKDF2 → AES-256-GCM) pour ouvrir le coffre chiffré data/studio.vault.json.
   - Le coffre contient tout ce qui est privé : brouillon du site, projets cachés, idées,
     discussions, images pas encore publiées et le jeton GitHub de publication.
   - « Publier » écrit data/projects.json (+ images) sur GitHub : le site public se met à jour.
   ========================================================= */
(function () {
  'use strict';
  var d = document, W = window, NX = W.NX, CFG = W.NEXORIA_CONFIG || {};
  var REPO = CFG.repo || 'Mrkevin900/nexoria', BRANCH = CFG.branch || 'main';
  var VAULT = 'data/studio.vault.json', DATA = 'data/projects.json';
  var USERS = { kevin: { name: 'MRkevin', role: 'Fondateur' }, junior: { name: 'Junior', role: 'Cofondateur' } };
  var PREFS = {}; try { PREFS = JSON.parse(localStorage.getItem('nx-prefs') || '{}'); } catch (e) {}
  var RED = W.matchMedia('(prefers-reduced-motion:reduce)').matches || PREFS.anim === false || PREFS.reduce;
  var FINE = W.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var CODE_AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  /* =========================================================
     OUTILS
     ========================================================= */
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function h(tag, a) {
    var parts = tag.split('.'), n = d.createElement(parts[0] || 'div'), kids = [].slice.call(arguments, 2);
    if (parts.length > 1) n.className = parts.slice(1).join(' ');
    if (a != null && (typeof a !== 'object' || a instanceof Node || Array.isArray(a))) { kids.unshift(a); a = null; }
    if (a) Object.keys(a).forEach(function (k) {
      var v = a[k]; if (v == null || v === false) return;
      if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else if (k === 'class') n.className += (n.className ? ' ' : '') + v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'data') Object.keys(v).forEach(function (x) { n.dataset[x] = v[x]; });
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') n[k] = v;
      else n.setAttribute(k, v === true ? '' : v);
    });
    append(n, kids);
    return n;
  }
  function append(n, kids) {
    (function walk(list) {
      list.forEach(function (k) {
        if (k == null || k === false) return;
        if (Array.isArray(k)) return walk(k);
        n.appendChild(k instanceof Node ? k : d.createTextNode(String(k)));
      });
    })(kids);
    return n;
  }
  function uid() { var a = new Uint8Array(6); crypto.getRandomValues(a); return Date.now().toString(36) + [].map.call(a, function (x) { return (x % 36).toString(36); }).join(''); }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function debounce(fn, ms) { var t; var f = function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; f.flush = function () { clearTimeout(t); fn(); }; return f; }
  function slug(s) { return String(s || 'projet').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'projet'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ago(t) {
    var s = (Date.now() - t) / 1000;
    if (s < 45) return 'à l’instant'; if (s < 3600) return 'il y a ' + Math.round(s / 60) + ' min';
    if (s < 86400) return 'il y a ' + Math.round(s / 3600) + ' h'; if (s < 604800) return 'il y a ' + Math.round(s / 86400) + ' j';
    return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  function hhmm(t) { return new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  function dayLabel(t) {
    var a = new Date(t), b = new Date(), y = new Date(Date.now() - 864e5);
    if (a.toDateString() === b.toDateString()) return 'Aujourd’hui';
    if (a.toDateString() === y.toDateString()) return 'Hier';
    return a.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function hexOk(c) { return /^#[0-9a-f]{6}$/i.test(c || ''); }
  function mix(a, b, t) {
    if (!hexOk(a)) a = '#888888'; if (!hexOk(b)) b = '#000000';
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round(((x >> 16) & 255) * (1 - t) + ((y >> 16) & 255) * t), g = Math.round(((x >> 8) & 255) * (1 - t) + ((y >> 8) & 255) * t), bl = Math.round((x & 255) * (1 - t) + (y & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  function hash(str) { var h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); }
  function greet() { var hr = new Date().getHours(); return hr < 6 ? 'Bonne nuit' : hr < 12 ? 'Bonjour' : hr < 18 ? 'Salut' : 'Bonsoir'; }

  /* icônes (traits) */
  var IC = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    fire: '<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6-4-9-1.5 2-2 3-3 3 0-2-1-4-3-7-1 4-4 6-4 11 0 5 3 9 7 9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M18.5 4.5l2 2"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    skull: '<circle cx="12" cy="10" r="7"/><path d="M9 21v-4M15 21v-4M9 10h.01M15 10h.01"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
  };
  var DISCORD = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.7zM8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.6 8 10.6s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/></svg>';
  function ico(n) { return h('span.si', { html: n === 'discord' ? DISCORD : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>' }); }
  function ibtn(n, title, fn, cls) { return h('button' + (cls ? '.' + cls : ''), { type: 'button', title: title, 'aria-label': title, onclick: function (e) { e.stopPropagation(); fn(e); } }, ico(n)); }

  /* ---------- notifications ---------- */
  function toast(msg, kind, o) {
    o = o || {};
    var box = $('#toasts'), t = h('div.toast.' + (kind || 'ok'), { role: 'status', style: '--t:' + (o.ms || 3600) + 'ms' }, ico(kind === 'err' ? 'alert' : kind === 'warn' ? 'alert' : kind === 'info' ? 'sparkle' : 'check'), h('span', msg));
    if (o.action) t.appendChild(h('button.btn.sm', { type: 'button', style: 'margin-left:auto;padding:.35rem .7rem', onclick: function () { o.action.fn(); kill(); } }, o.action.label));
    box.appendChild(t);
    var timer = setTimeout(kill, o.ms || 3600);
    function kill() { clearTimeout(timer); t.classList.add('out'); setTimeout(function () { t.remove(); }, 340); }
    return kill;
  }

  /* ---------- fenêtres ---------- */
  var MODALS = 0;
  function modal(o) {
    MODALS++;
    var m = h('div.s-modal' + (o.wide ? '.wide' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title });
    var box = h('div.mbox');
    if (o.title) box.appendChild(h('h3', o.title));
    if (o.text) box.appendChild(h('p', o.text));
    if (o.body) append(box, [o.body]);
    if (o.closable !== false) box.appendChild(h('button.m-x', { type: 'button', 'aria-label': 'Fermer', onclick: close }, ico('x')));
    var act = h('div.m-act');
    (o.actions || []).forEach(function (a) { act.appendChild(h('button.btn' + (a.cls ? '.' + a.cls : ''), { type: 'button', onclick: function () { a.fn && a.fn(close); } }, a.icon && ico(a.icon), a.label)); });
    if (o.actions && o.actions.length) box.appendChild(act);
    m.appendChild(box);
    m.addEventListener('pointerdown', function (e) { if (e.target === m && o.closable !== false) close(); });
    function onKey(e) { if (e.key === 'Escape' && o.closable !== false && m === $$('.s-modal').pop()) { e.stopPropagation(); close(); } }
    d.addEventListener('keydown', onKey, true);
    d.body.appendChild(m);
    var f = box.querySelector('input,textarea,select'); if (f && o.focus !== false) setTimeout(function () { f.focus(); }, 60);
    var closed = false;
    function close() {
      if (closed) return; closed = true; MODALS--;
      d.removeEventListener('keydown', onKey, true);
      m.classList.add('out'); setTimeout(function () { m.remove(); }, 260);
      o.onClose && o.onClose();
    }
    return { el: m, box: box, close: close, act: act };
  }
  function ask(title, text, okLabel, danger) {
    return new Promise(function (ok) {
      var done = false;
      modal({ title: title, text: text, onClose: function () { if (!done) ok(false); }, actions: [
        { label: 'Annuler', fn: function (c) { c(); } },
        { label: okLabel || 'Confirmer', cls: danger ? 'danger' : 'main', fn: function (c) { done = true; ok(true); c(); } }
      ] });
    });
  }

  /* =========================================================
     CHIFFREMENT
     ========================================================= */
  var enc = new TextEncoder(), dec = new TextDecoder();
  function b64(u8) { var s = '', c = 0x8000; for (var i = 0; i < u8.length; i += c) s += String.fromCharCode.apply(null, u8.subarray(i, i + c)); return btoa(s); }
  function unb64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function rnd(n) { return crypto.getRandomValues(new Uint8Array(n)); }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function fmtCode(c) { return normCode(c).replace(/(.{4})(?=.)/g, '$1-'); }
  function genCode() { var out = '', b = new Uint8Array(1); while (out.length < 12) { crypto.getRandomValues(b); if (b[0] < 248) out += CODE_AL[b[0] % 31]; } return fmtCode(out); }
  function kek(code, salt, iter) {
    return crypto.subtle.importKey('raw', enc.encode(normCode(code)), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function unwrapKey(env, user, code) {
    var s = env.keys && env.keys[user]; if (!s) return Promise.reject(new Error('nokey'));
    return kek(code, unb64(s.salt), env.kdf.iter).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(s.iv) }, k, unb64(s.ct)); }).then(function (r) { return new Uint8Array(r); });
  }
  function wrapKey(raw, code, iter) {
    var salt = rnd(16), iv = rnd(12);
    return kek(code, salt, iter).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, raw); }).then(function (ct) { return { salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) }; });
  }
  function seal(key, obj) { var iv = rnd(12); return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(JSON.stringify(obj))).then(function (ct) { return { iv: b64(iv), ct: b64(new Uint8Array(ct)) }; }); }
  function unseal(key, box) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct)).then(function (pt) { return JSON.parse(dec.decode(pt)); }); }

  /* ---------- stockage local (IndexedDB, chiffré) ---------- */
  var idb = (function () {
    var p = null, mem = {};
    function db() {
      if (!p) p = new Promise(function (ok, ko) {
        if (!W.indexedDB) return ko(new Error('noidb'));
        var q = indexedDB.open('nx-studio', 1);
        q.onupgradeneeded = function () { q.result.createObjectStore('kv'); };
        q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ko(q.error); };
      });
      return p;
    }
    return {
      get: function (k) { return db().then(function (b) { return new Promise(function (ok, ko) { var r = b.transaction('kv').objectStore('kv').get(k); r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ko(r.error); }; }); }).catch(function () { return mem[k]; }); },
      set: function (k, v) { return db().then(function (b) { return new Promise(function (ok, ko) { var t = b.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = function () { ok(); }; t.onerror = function () { ko(t.error); }; }); }).catch(function () { mem[k] = v; }); },
      del: function (k) { return db().then(function (b) { return new Promise(function (ok) { var t = b.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = function () { ok(); }; t.onerror = function () { ok(); }; }); }).catch(function () { delete mem[k]; }); }
    };
  })();

  /* =========================================================
     GITHUB
     ========================================================= */
  function token() { return S.priv && S.priv.settings && S.priv.settings.token || ''; }
  function GhErr(status, msg) { var e = new Error(msg || ('GitHub ' + status)); e.status = status; return e; }
  function gh(path, o, tok) {
    o = o || {};
    var headers = { Accept: o.raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', Authorization: 'Bearer ' + (tok || token()), 'X-GitHub-Api-Version': '2022-11-28' };
    if (o.body) headers['Content-Type'] = 'application/json';
    return fetch('https://api.github.com' + path, { method: o.method || 'GET', headers: headers, body: o.body ? JSON.stringify(o.body) : undefined, cache: 'no-store' }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw GhErr(r.status, j.message); });
      if (o.raw) return r.text();
      return r.status === 204 ? null : r.json();
    });
  }
  function ghRaw(path) { return gh('/repos/' + REPO + '/contents/' + path + '?ref=' + BRANCH + '&t=' + Date.now(), { raw: true }); }
  function ghMsg(e) {
    if (!e) return 'Erreur inconnue';
    if (e.status === 401) return 'Jeton GitHub refusé (invalide ou expiré). Remets-en un dans Réglages.';
    if (e.status === 403) return 'Le jeton n’a pas le droit d’écrire. Il faut la permission « Contents : Read and write ».';
    if (e.status === 404) return 'Dépôt introuvable : le jeton doit avoir accès à ' + REPO + '.';
    if (e.status === 409 || e.status === 422) return 'Conflit avec une autre publication. Réessaie.';
    if (e.name === 'TypeError') return 'Pas de connexion internet ou GitHub injoignable.';
    return e.message || String(e);
  }
  /* un seul commit pour plusieurs fichiers (API Git Data) */
  function commit(files, message) {
    var R = '/repos/' + REPO;
    return Promise.all(files.map(function (f) {
      return gh(R + '/git/blobs', { method: 'POST', body: f.b64 != null ? { content: f.b64, encoding: 'base64' } : { content: f.text, encoding: 'utf-8' } }).then(function (b) { return { path: f.path, mode: '100644', type: 'blob', sha: b.sha }; });
    })).then(function (tree) {
      var tries = 0;
      function attempt() {
        var base;
        return gh(R + '/git/ref/heads/' + BRANCH).then(function (ref) { base = ref.object.sha; return gh(R + '/git/commits/' + base); })
          .then(function (c) { return gh(R + '/git/trees', { method: 'POST', body: { base_tree: c.tree.sha, tree: tree } }); })
          .then(function (t) { return gh(R + '/git/commits', { method: 'POST', body: { message: message, tree: t.sha, parents: [base] } }); })
          .then(function (nc) { return gh(R + '/git/refs/heads/' + BRANCH, { method: 'PATCH', body: { sha: nc.sha } }).then(function () { return nc; }); })
          .catch(function (e) { if ((e.status === 422 || e.status === 409) && ++tries < 4) return new Promise(function (ok) { setTimeout(ok, 600 * tries); }).then(attempt); throw e; });
      }
      return attempt();
    });
  }

  /* =========================================================
     ÉTAT
     ========================================================= */
  var S = { user: null, raw: null, key: null, env: null, baseRev: 0, priv: null, live: null, dirty: false, keysChanged: false, busy: false, recent: {}, view: 'qg', pview: 'posters', pfilter: 'all', q: '', iq: '', noteCh: 'general', publicTeam: [], anim: true };
  var E = null; /* éditeur ouvert */

  function site() { return S.priv.draft; }
  function proj(id) { return site().projects.find(function (p) { return p.id === id; }); }
  function member(id) {
    var t = (S.priv && site().team || S.publicTeam || []).find(function (x) { return x.id === id; });
    return t || { id: id, name: (USERS[id] || {}).name || id, photo: 'assets/img/favicon.png' };
  }
  function avatar(id) { return resolve(member(id).photo || 'assets/img/favicon.png'); }
  function resolve(src) {
    if (!src) return '';
    if (src.indexOf('nxf:') === 0) return (S.priv && S.priv.files[src.slice(4)]) || '';
    return S.recent[src] || src;
  }
  function teamMap() { var m = {}; site().team.forEach(function (t) { m[t.id] = t; }); return m; }
  function catName(id) { var c = site().categories.find(function (x) { return x.id === id; }); return c ? c.name : 'Sans catégorie'; }

  function normalizePriv(p) {
    p = p || {};
    p.ideas = Array.isArray(p.ideas) ? p.ideas : [];
    p.notes = p.notes && typeof p.notes === 'object' ? p.notes : {};
    p.files = p.files && typeof p.files === 'object' ? p.files : {};
    p.tomb = p.tomb && typeof p.tomb === 'object' ? p.tomb : {};
    p.settings = p.settings && typeof p.settings === 'object' ? p.settings : {};
    p.activity = Array.isArray(p.activity) ? p.activity : [];
    return p;
  }
  function normalizeDraft() {
    var s = site();
    s.team = Array.isArray(s.team) ? s.team : [];
    s.categories = Array.isArray(s.categories) ? s.categories : [];
    s.projects = (Array.isArray(s.projects) ? s.projects : []).filter(function (p) { return p && p.id; });
    s.projects.forEach(function (p) { if (!NX.STATE[p.state]) p.state = 'dev'; if (!p.name) p.name = 'Sans nom'; });
    Object.keys(USERS).forEach(function (u) { if (!s.team.some(function (t) { return t.id === u; })) s.team.push({ id: u, name: USERS[u].name, role: USERS[u].role, bio: '', photo: 'assets/img/favicon.png' }); });
  }

  /* ---------- version publique ---------- */
  var PRIV_KEYS = { hidden: 1, _u: 1, _by: 1, _c: 1, _cu: 1, _su: 1, _ou: 1, codename: 1, secretHide: 1 };
  function clean(v) {
    if (Array.isArray(v)) { var a = v.map(clean).filter(function (x) { return x !== undefined; }); return a.length ? a : undefined; }
    if (v && typeof v === 'object') { var o = {}, n = 0; Object.keys(v).forEach(function (k) { if (PRIV_KEYS[k]) return; var c = clean(v[k]); if (c !== undefined) { o[k] = c; n++; } }); return n ? o : undefined; }
    if (v === '' || v === null || v === undefined || v === false) return undefined;
    return v;
  }
  function sortKeys(v) { if (Array.isArray(v)) return v.map(sortKeys); if (v && typeof v === 'object') { var o = {}; Object.keys(v).sort().forEach(function (k) { o[k] = sortKeys(v[k]); }); return o; } return v; }
  function canon(v) { return JSON.stringify(sortKeys(clean(v)) || null); }
  /* projet confidentiel avec nom de code : son vrai identifiant n'apparaît pas sur le site */
  function pubId(p) { return p.secret && p.codename ? 'confidentiel-' + hash(p.id).slice(0, 6) : p.id; }
  var SECRET_KEEP = { id: 1, name: 1, category: 1, tag: 1, accent: 1, bg: 1, logo: 1, banner: 1, bannerIsCapture: 1, logoRounded: 1, holo: 1, state: 1, authors: 1, short: 1, description: 1, progress: 1, progressNote: 1, version: 1, monogram: 1, secret: 1, secretNote: 1, statusNote: 1 };
  function pubProject(p, ids) {
    var c = clean(p) || {};
    c.id = pubId(p);
    if (!p.secret) delete c.secretNote;
    if (p.secret) {
      Object.keys(c).forEach(function (k) { if (!SECRET_KEEP[k]) delete c[k]; });
      if (p.codename) c.name = p.codename;
      if (p.secretHide) { delete c.logo; delete c.banner; delete c.holo; delete c.bannerIsCapture; delete c.logoRounded; c.monogram = '?'; }
      c.secret = true;
    } else if (c.related && ids) {
      c.related = c.related.filter(function (id) { return ids[id]; }).map(function (id) { return ids[id]; });
      if (!c.related.length) delete c.related;
    }
    return c;
  }
  function publicSite() {
    var s = site(), pub = s.projects.filter(function (p) { return !p.hidden; }), ids = {};
    pub.forEach(function (p) { ids[p.id] = pubId(p); });
    var out = { _info: s._info || 'Contenu du site NEXORIA, géré depuis Nexus Studio.' };
    if (s.site) { var sc = clean(s.site); if (sc) out.site = sc; }
    out.team = s.team.map(function (t) { return clean(t) || {}; });
    out.categories = s.categories.map(function (c) { return clean(c) || {}; });
    out.projects = pub.map(function (p) { return pubProject(p, ids); });
    return out;
  }
  function diffs() {
    var pub = publicSite(), live = S.live || { projects: [], team: [], categories: [] }, L = {}, P = {}, out = [];
    (live.projects || []).forEach(function (p) { L[p.id] = p; });
    pub.projects.forEach(function (p) { P[p.id] = p; if (!L[p.id]) out.push({ k: 'add', p: p }); else if (canon(L[p.id]) !== canon(p)) out.push({ k: 'mod', p: p }); });
    (live.projects || []).forEach(function (p) { if (!P[p.id]) out.push({ k: 'del', p: proj(p.id) || p, still: !!proj(p.id) }); });
    var a = pub.projects.map(function (p) { return p.id; }).filter(function (id) { return L[id]; }).join();
    var b = (live.projects || []).map(function (p) { return p.id; }).filter(function (id) { return P[id]; }).join();
    if (a !== b) out.push({ k: 'ord' });
    if (canon(pub.team) !== canon(live.team) || canon(pub.categories) !== canon(live.categories)) out.push({ k: 'team' });
    if (canon(pub.site) !== canon(live.site)) out.push({ k: 'site' });
    return out;
  }

  /* ---------- fusion (quand Kevin et Junior travaillent en même temps) ---------- */
  function mergeList(theirs, mine, tomb) {
    theirs = theirs || []; mine = mine || []; tomb = tomb || {};
    var T = {}, M = {}, out = [], seen = {};
    theirs.forEach(function (x) { T[x.id] = x; }); mine.forEach(function (x) { M[x.id] = x; });
    function pick(id) { var a = T[id], b = M[id], x = !a ? b : !b ? a : ((b._u || 0) >= (a._u || 0) ? b : a); return tomb[id] && tomb[id] >= (x._u || 0) ? null : x; }
    mine.forEach(function (x) { seen[x.id] = 1; var v = pick(x.id); if (v) out.push(v); });
    theirs.forEach(function (x, i) {
      if (seen[x.id]) return; seen[x.id] = 1; var v = pick(x.id); if (!v) return;
      var prev = theirs[i - 1], j = prev ? out.findIndex(function (y) { return y.id === prev.id; }) : -1;
      out.splice(j + 1, 0, v);
    });
    return out;
  }
  function mergePriv(theirs, mine) {
    theirs = normalizePriv(theirs); mine = normalizePriv(mine);
    var tomb = {}, out = Object.assign({}, theirs, mine);
    Object.keys(theirs.tomb).concat(Object.keys(mine.tomb)).forEach(function (k) { tomb[k] = Math.max(theirs.tomb[k] || 0, mine.tomb[k] || 0); });
    out.tomb = tomb;
    out.ideas = mergeList(theirs.ideas, mine.ideas, tomb);
    out.notes = {};
    Object.keys(theirs.notes).concat(Object.keys(mine.notes)).forEach(function (ch) { out.notes[ch] = mergeList(theirs.notes[ch], mine.notes[ch], tomb).sort(function (a, b) { return a.at - b.at; }); });
    out.files = Object.assign({}, theirs.files, mine.files);
    out.activity = mergeList(theirs.activity, mine.activity, {}).sort(function (a, b) { return b.at - a.at; }).slice(0, 150);
    out.settings = (mine.settings._u || 0) >= (theirs.settings._u || 0) ? mine.settings : theirs.settings;
    if (theirs.draft && mine.draft) {
      var dd = Object.assign({}, theirs.draft, mine.draft);
      dd.projects = mergeList(theirs.draft.projects, mine.draft.projects, tomb);
      dd.team = mergeList(theirs.draft.team, mine.draft.team, {});
      dd.categories = (mine.draft._cu || 0) >= (theirs.draft._cu || 0) ? mine.draft.categories : theirs.draft.categories;
      dd.site = (mine.draft._su || 0) >= (theirs.draft._su || 0) ? mine.draft.site : theirs.draft.site;
      out.draft = dd;
    } else out.draft = mine.draft || theirs.draft;
    if ((theirs.pubAt || 0) > (mine.pubAt || 0)) { out.pubAt = theirs.pubAt; out.draftBase = theirs.draftBase; out.draftPub = theirs.draftPub; }
    return out;
  }

  /* ---------- modifications & sauvegarde locale ---------- */
  function log(text) { S.priv.activity.unshift({ id: uid(), at: Date.now(), by: S.user, text: text }); S.priv.activity.length = Math.min(S.priv.activity.length, 150); }
  /* sauvegarde locale chiffrée — les images sont rangées à part et ne sont re-chiffrées que si elles changent
     (sinon chaque frappe au clavier re-chiffrait des Mo d'images = lag) */
  var filesSig = null;
  var saveLocal = debounce(function () {
    if (!S.key || !S.priv) return;
    var rest = Object.assign({}, S.priv); delete rest.files;
    var jobs = [seal(S.key, rest).then(function (box) { return idb.set('work:' + S.user, { rev: S.baseRev, dirty: S.dirty, box: box, keys: S.env.keys, keysChanged: S.keysChanged, split: true }); })];
    var sig = Object.keys(S.priv.files).join(',');
    if (sig !== filesSig) { filesSig = sig; jobs.push(seal(S.key, S.priv.files).then(function (fb) { return idb.set('files:' + S.user, fb); })); }
    Promise.all(jobs).catch(function (e) { filesSig = null; console.warn('Sauvegarde locale impossible', e); });
  }, 900);
  var autoSync = debounce(function () {
    if (!S.dirty || !token() || S.priv.settings.auto === false) return;
    if (S.busy || E || MODALS || D) return autoSync();
    sync(false, true);
  }, 15000);
  function touch() {
    S.dirty = true; S.ver = (S.ver || 0) + 1; S.priv.updatedAt = Date.now();
    saveLocal(); chrome(); autoSync();
  }
  W.addEventListener('pagehide', function () { if (S.key) saveLocal.flush(); });

  /* =========================================================
     EFFETS : particules, parallaxe, curseur, inclinaison 3D, compteurs, explosion
     ========================================================= */
  var bgRun = false, resumeBg = function () {};
  function fxBackground() {
    var cv = $('#pc'), layers = $$('.s-bg .layer[data-p]');
    if (!cv || RED) return;
    var g = cv.getContext('2d'), Wd = 0, Ht = 0, ps = [], mx = 0, my = 0, tx = 0, ty = 0;
    function init() {
      var k = 1; Wd = innerWidth; Ht = innerHeight;
      cv.width = Wd * k; cv.height = Ht * k; g.setTransform(k, 0, 0, k, 0, 0);
      var N = PREFS.perf ? 0 : (Wd < 760 ? 16 : 34); ps = [];
      for (var i = 0; i < N; i++) ps.push({ x: Math.random() * Wd, y: Math.random() * Ht, z: .2 + Math.random() * .8, v: .1 + Math.random() * .35 });
    }
    function tick() {
      mx += (tx - mx) * .05; my += (ty - my) * .05;
      g.clearRect(0, 0, Wd, Ht);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i]; p.y -= p.v * p.z; if (p.y < -10) { p.y = Ht + 10; p.x = Math.random() * Wd; }
        var x = p.x - mx * p.z * 30, y = p.y - my * p.z * 30, s = p.z * 2;
        g.fillStyle = 'rgba(232,230,239,' + (p.z * .1) + ')'; g.beginPath(); g.arc(x, y, s * 4, 0, 6.283); g.fill();
        g.fillStyle = 'rgba(232,230,239,' + (.2 + p.z * .5) + ')'; g.beginPath(); g.arc(x, y, s, 0, 6.283); g.fill();
      }
      layers.forEach(function (l) { var k = +l.dataset.p; l.style.transform = 'translate3d(' + (-mx * k * 40) + 'px,' + (-my * k * 40) + 'px,0)'; });
      var ge = $('#gEmb'); if (ge && !$('#gate').hidden) { ge.style.setProperty('--gx', mx.toFixed(3)); ge.style.setProperty('--gy', my.toFixed(3)); }
      if (E || d.hidden) { bgRun = false; return; } /* en pause pendant l'édition : tout le processeur pour toi */
      requestAnimationFrame(tick);
    }
    init(); bgRun = true; tick();
    resumeBg = function () { if (!bgRun && !RED) { bgRun = true; requestAnimationFrame(tick); } };
    d.addEventListener('visibilitychange', function () { if (!d.hidden) resumeBg(); });
    var rt; W.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(init, 200); });
    d.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  }
  function fxCursor() {
    if (!FINE || RED || PREFS.cursor === false) return;
    d.documentElement.classList.add('cc');
    var c = h('div.cur', { 'aria-hidden': 'true' }), dot = h('div.cdot', { 'aria-hidden': 'true' });
    d.body.appendChild(c); d.body.appendChild(dot);
    var ax = -100, ay = -100, gx = -100, gy = -100;
    d.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY; c.style.opacity = 1; dot.style.opacity = 1;
      dot.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
      c.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,.poster,.idea,.row,.mi,[role=button],label')));
      var el = e.target.closest && e.target.closest('.btn');
      if (el) { var q = el.getBoundingClientRect(); el.style.setProperty('--bx', ((e.clientX - q.left - q.width / 2) * .15).toFixed(1) + 'px'); el.style.setProperty('--by', ((e.clientY - q.top - q.height / 2) * .15).toFixed(1) + 'px'); }
    }, { passive: true });
    d.addEventListener('pointerout', function (e) { var el = e.target.closest && e.target.closest('.btn'); if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--bx', '0px'); el.style.setProperty('--by', '0px'); } });
    d.addEventListener('pointerdown', function (e) {
      c.classList.add('dn');
      var rp = h('i.rip', { style: 'left:' + e.clientX + 'px;top:' + e.clientY + 'px' }); d.body.appendChild(rp); setTimeout(function () { rp.remove(); }, 650);
    });
    d.addEventListener('pointerup', function () { c.classList.remove('dn'); });
    d.documentElement.addEventListener('mouseleave', function () { c.style.opacity = 0; dot.style.opacity = 0; });
    var moving = false;
    function mv() { ax += (gx - ax) * .22; ay += (gy - ay) * .22; c.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0)'; if (Math.abs(gx - ax) + Math.abs(gy - ay) > .4) requestAnimationFrame(mv); else moving = false; }
    d.addEventListener('pointermove', function () { if (!moving) { moving = true; requestAnimationFrame(mv); } }, { passive: true });
  }
  function tilt(el, k) {
    if (!FINE || RED) return el;
    k = k || 10; el.classList.add('tilt');
    el.addEventListener('pointermove', function (e) {
      if (D) return;
      var q = el.getBoundingClientRect(), px = (e.clientX - q.left) / q.width, py = (e.clientY - q.top) / q.height;
      el.style.setProperty('--ry', ((px - .5) * k).toFixed(2)); el.style.setProperty('--rx', ((.5 - py) * k).toFixed(2));
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', 0); el.style.setProperty('--ry', 0); });
    return el;
  }
  function countUp(el, to) {
    if (RED) { el.textContent = to; return; }
    var t0 = performance.now();
    (function f(t) { var k = Math.min((t - t0) / 1100, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  function burst(colors) {
    if (RED) return;
    var cv = h('canvas.burst'), g = cv.getContext('2d'), k = Math.min(W.devicePixelRatio || 1, 2);
    cv.width = innerWidth * k; cv.height = innerHeight * k; g.scale(k, k); d.body.appendChild(cv);
    var P = [], cx = innerWidth / 2, cy = innerHeight * .42;
    colors = colors || ['#ffffff', '#c7c7d1', '#e8e8ee', '#8d8d98'];
    for (var i = 0; i < 160; i++) { var a = Math.random() * 6.283, v = 4 + Math.random() * 10; P.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, r: 2 + Math.random() * 4, c: colors[i % colors.length], s: Math.random() * 6.283, w: (Math.random() - .5) * .4 }); }
    var t0 = performance.now();
    (function f(t) {
      var life = (t - t0) / 1800; g.clearRect(0, 0, innerWidth, innerHeight);
      P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .28; p.vx *= .985; p.s += p.w; g.save(); g.translate(p.x, p.y); g.rotate(p.s); g.globalAlpha = Math.max(0, 1 - life); g.fillStyle = p.c; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); });
      if (life < 1) requestAnimationFrame(f); else cv.remove();
    })(t0);
  }
  d.addEventListener('animationend', function (e) { if (e.target.classList && e.target.classList.contains('ap')) e.target.classList.remove('ap'); });

  /* =========================================================
     GLISSER-DÉPOSER (souris + tactile, animations FLIP)
     ========================================================= */
  var D = null, justDragged = 0;
  function sortable(cont, o) {
    cont.dataset.sg = o.group || ('g' + uid());
    cont._so = o;
    cont.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || D) return;
      var item = e.target.closest(o.items);
      if (!item || item.parentElement !== cont) return;
      if (o.handle) { if (!e.target.closest(o.handle)) return; }
      else if (e.target.closest('button,input,textarea,select,a[href],label,[data-nodrag]')) return;
      pend(e, item, cont);
    });
  }
  function pend(e, item, cont) {
    var sx = e.clientX, sy = e.clientY, touchy = e.pointerType === 'touch' && !cont._so.handle, timer = null, live = true;
    function end() { live = false; clearTimeout(timer); W.removeEventListener('pointermove', mv); W.removeEventListener('pointerup', end); W.removeEventListener('pointercancel', end); }
    function mv(ev) {
      var dist = Math.hypot(ev.clientX - sx, ev.clientY - sy);
      if (touchy) { if (dist > 10) end(); return; }
      if (dist > 6) { end(); begin(ev, item, cont, sx, sy); }
    }
    if (touchy) timer = setTimeout(function () { if (!live) return; end(); if (navigator.vibrate) navigator.vibrate(12); begin(e, item, cont, sx, sy); }, 330);
    W.addEventListener('pointermove', mv); W.addEventListener('pointerup', end); W.addEventListener('pointercancel', end);
  }
  function noTouch(e) { if (D && e.cancelable) e.preventDefault(); }
  function begin(e, item, cont, sx, sy) {
    var r = item.getBoundingClientRect(), g = item.cloneNode(true);
    g.classList.remove('ap', 'tilt'); g.classList.add('s-ghost'); g.removeAttribute('id');
    g.style.left = r.left + 'px'; g.style.top = r.top + 'px'; g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
    d.body.appendChild(g);
    requestAnimationFrame(function () { g.style.transform = 'scale(1.05) rotate(-1.5deg)'; });
    item.classList.add('s-ph');
    d.documentElement.classList.add('s-drag');
    D = { item: item, g: g, from: cont, cur: cont, ox: sx - r.left, oy: sy - r.top, x: e.clientX, y: e.clientY, lx: e.clientX, rot: 0, t: 0, fromNext: item.nextElementSibling, o: cont._so };
    cont.classList.add('s-over');
    W.addEventListener('pointermove', dmove, { passive: false }); W.addEventListener('pointerup', dend); W.addEventListener('pointercancel', dend);
    d.addEventListener('touchmove', noTouch, { passive: false });
    (function loop() {
      if (!D) return;
      var edge = 80, dy = 0, sc = D.o.scroller ? cont.closest(D.o.scroller) : null;
      var top = sc ? sc.getBoundingClientRect().top : 0, bot = sc ? sc.getBoundingClientRect().bottom : innerHeight;
      if (D.y < top + edge) dy = -(top + edge - D.y) * .35; else if (D.y > bot - edge) dy = (D.y - bot + edge) * .35;
      if (dy) { if (sc) sc.scrollTop += dy; else W.scrollBy(0, dy); place(); }
      requestAnimationFrame(loop);
    })();
  }
  function dmove(e) {
    if (!D) return;
    if (e.cancelable) e.preventDefault();
    D.x = e.clientX; D.y = e.clientY;
    D.g.style.left = (D.x - D.ox) + 'px'; D.g.style.top = (D.y - D.oy) + 'px';
    var vx = D.x - D.lx; D.lx = D.x; D.rot += (clamp(vx * .8, -12, 12) - D.rot) * .35;
    D.g.style.transform = 'scale(1.05) rotate(' + D.rot.toFixed(2) + 'deg)';
    place();
  }
  function place() {
    var now = performance.now(); if (now < D.t) return;
    var under = d.elementFromPoint(D.x, D.y), cont = under && under.closest('[data-sg]');
    if (cont && cont.dataset.sg !== D.from.dataset.sg) cont = null;
    if (!cont) return;
    if (cont !== D.cur) { D.cur.classList.remove('s-over'); cont.classList.add('s-over'); D.cur = cont; }
    var o = cont._so, before = null;
    var sibs = [].filter.call(cont.children, function (c) { return c !== D.item && c.matches(o.items); });
    for (var i = 0; i < sibs.length; i++) {
      var r = sibs[i].getBoundingClientRect();
      if (o.grid) { if (D.y < r.top || (D.y <= r.bottom && D.x < r.left + r.width / 2)) { before = sibs[i]; break; } }
      else if (D.y < r.top + r.height / 2) { before = sibs[i]; break; }
    }
    if (!before && o.end) before = cont.querySelector(o.end);
    if (D.item.parentElement === cont && before === D.item.nextElementSibling) return;
    var item = D.item;
    flip([D.from, cont, item.parentElement], function () { cont.insertBefore(item, before); });
    D.t = now + 110;
  }
  function flip(conts, fn) {
    var els = [];
    conts.filter(function (c, i, a) { return c && a.indexOf(c) === i; }).forEach(function (c) { els = els.concat([].slice.call(c.children)); });
    var first = els.map(function (x) { return x.getBoundingClientRect(); });
    fn();
    if (RED) return;
    els.forEach(function (x, i) {
      var a = first[i], b = x.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) x.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }
  function dend() {
    if (!D) return;
    var item = D.item, g = D.g, from = D.from, cont = item.parentElement, o = cont._so || D.o;
    W.removeEventListener('pointermove', dmove); W.removeEventListener('pointerup', dend); W.removeEventListener('pointercancel', dend);
    d.removeEventListener('touchmove', noTouch);
    $$('.s-over').forEach(function (x) { x.classList.remove('s-over'); });
    var moved = !(cont === from && item.nextElementSibling === D.fromNext);
    var r = item.getBoundingClientRect();
    g.style.transition = 'left .34s cubic-bezier(.2,.8,.2,1),top .34s cubic-bezier(.2,.8,.2,1),transform .34s,opacity .34s';
    g.style.left = r.left + 'px'; g.style.top = r.top + 'px'; g.style.transform = 'none';
    D = null; justDragged = Date.now();
    setTimeout(function () {
      g.remove(); item.classList.remove('s-ph'); d.documentElement.classList.remove('s-drag');
      if (!RED) item.animate([{ transform: 'scale(.96)' }, { transform: 'scale(1.03)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
      if (moved && o.onEnd) o.onEnd({ item: item, from: from, to: cont });
    }, RED ? 0 : 340);
  }
  d.addEventListener('click', function (e) { if (Date.now() - justDragged < 400) { e.stopPropagation(); e.preventDefault(); } }, true);
  d.addEventListener('contextmenu', function (e) { if (D) e.preventDefault(); });
  function neighbours(item, sel) {
    var p = item.previousElementSibling, n = item.nextElementSibling;
    while (p && !p.matches(sel)) p = p.previousElementSibling;
    while (n && !n.matches(sel)) n = n.nextElementSibling;
    return { prev: p && p.dataset.id, next: n && n.dataset.id };
  }
  function moveRel(arr, id, prevId, nextId) {
    var i = arr.findIndex(function (x) { return x.id === id; }); if (i < 0) return;
    var x = arr.splice(i, 1)[0], j = -1;
    if (nextId) j = arr.findIndex(function (y) { return y.id === nextId; });
    if (j < 0 && prevId) { j = arr.findIndex(function (y) { return y.id === prevId; }); if (j >= 0) j++; }
    if (j < 0) j = arr.length;
    arr.splice(j, 0, x);
  }

  /* =========================================================
     IMAGES
     ========================================================= */
  function readURL(f) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = ko; r.readAsDataURL(f); }); }
  function imgFile(file, max, square) {
    if (!/^image\//.test(file.type)) return Promise.reject(new Error('Ce fichier n’est pas une image.'));
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      if (file.size > 4e6) return Promise.reject(new Error('Image trop lourde (4 Mo max).'));
      return readURL(file);
    }
    return createImageBitmap(file).then(function (bmp) {
      var w = bmp.width, hh = bmp.height, sx = 0, sy = 0, sw = w, sh = hh;
      if (square) { var m = Math.min(w, hh); sx = (w - m) / 2; sy = (hh - m) / 2; sw = sh = w = hh = m; }
      var k = Math.min(1, (max || 1600) / Math.max(w, hh)), cw = Math.round(w * k), ch = Math.round(hh * k);
      var c = d.createElement('canvas'); c.width = cw; c.height = ch;
      c.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, cw, ch);
      var url = c.toDataURL('image/webp', .86);
      if (url.indexOf('data:image/webp') !== 0) url = c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', .88);
      return url;
    });
  }
  function addFile(url) { var id = uid(); S.priv.files[id] = url; return 'nxf:' + id; }
  function pickFiles(multiple, accept) {
    return new Promise(function (ok) {
      var i = h('input', { type: 'file', accept: accept || 'image/*', style: 'display:none' }); if (multiple) i.multiple = true;
      i.addEventListener('change', function () { ok([].slice.call(i.files || [])); i.remove(); });
      d.body.appendChild(i); i.click();
    });
  }
  function hasFiles(e) { return e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') > -1; }
  W.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  W.addEventListener('drop', function (e) { if (hasFiles(e)) e.preventDefault(); });
  function dropTarget(el, onFiles) {
    var n = 0;
    el.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; e.preventDefault(); n++; el.classList.add('over'); });
    el.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
    el.addEventListener('dragleave', function () { if (--n <= 0) { n = 0; el.classList.remove('over'); } });
    el.addEventListener('drop', function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); n = 0; el.classList.remove('over'); onFiles([].slice.call(e.dataTransfer.files)); });
  }
  /* champ image unique (logo, bannière, photo…) */
  function imgField(obj, key, o) {
    var box = h('div.f');
    function draw() {
      box.innerHTML = '';
      if (o.label) box.appendChild(h('label', o.label));
      var src = obj[key], z;
      if (src) {
        z = h('div.dz.has' + (o.logo ? '.logo' : ''), { role: 'button', tabindex: '0', title: 'Cliquer ou déposer une image pour remplacer' }, NX.img(resolve(src), ''),
          h('div.dz-act', ibtn('upload', 'Remplacer', pick), ibtn('trash', 'Retirer', function () { delete obj[key]; o.ch(); draw(); o.after && o.after(); })));
        if (o.pbg) z.style.setProperty('--pbg', o.pbg());
      } else {
        z = h('div.dz', { role: 'button', tabindex: '0' }, ico('upload'), h('b', o.empty || 'Dépose une image ici'), h('small', 'ou clique pour choisir · PNG, JPG, WebP, SVG, GIF'));
      }
      z.addEventListener('click', function (e) { if (!e.target.closest('.dz-act')) pick(); });
      z.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      dropTarget(z, function (fs) { load(fs[0], z); });
      box.appendChild(z);
      if (o.path !== false && !(src && src.indexOf('nxf:') === 0)) {
        var p = h('input.in', { placeholder: 'ou chemin dans le site / lien https://', value: src || '', style: 'font-size:.82rem;padding:.5rem .75rem' });
        p.addEventListener('change', function () { if (p.value.trim()) obj[key] = p.value.trim(); else delete obj[key]; o.ch(); draw(); o.after && o.after(); });
        box.appendChild(p);
      } else if (src) box.appendChild(h('small.hint', '🔒 Image importée — reste privée jusqu’à la publication.'));
      if (o.hint) box.appendChild(h('small.hint', o.hint));
    }
    function pick() { pickFiles(false).then(function (fs) { if (fs[0]) load(fs[0], box.querySelector('.dz')); }); }
    function load(f, z) {
      if (!f) return; z && z.classList.add('busy');
      imgFile(f, o.max || 1600, o.square).then(function (url) { obj[key] = addFile(url); o.ch(); draw(); o.after && o.after(); toast('Image ajoutée', 'ok'); })
        .catch(function (e) { z && z.classList.remove('busy'); toast(e.message || 'Image illisible', 'err'); });
    }
    draw();
    return box;
  }

  /* =========================================================
     PORTAIL D'ACCÈS
     ========================================================= */
  var fails = 0, lockUntil = 0, who = null, codeUI = null;
  function readSession() { try { return JSON.parse(sessionStorage.getItem('nxs') || localStorage.getItem('nxs') || 'null'); } catch (e) { return null; } }
  function clearSession() { try { sessionStorage.removeItem('nxs'); localStorage.removeItem('nxs'); } catch (e) {} }
  function fetchJSON(url) { return fetch(url + (url.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }

  /* un seul vrai champ (fiable : frappe rapide, collage, remplissage auto, mobile), affiché en 12 cases */
  function buildCode(box, onChange, onFull) {
    box.innerHTML = ''; var cells = [], show = false, last = '';
    var inp = h('input.code-real', { id: 'c0', type: 'password', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', maxlength: '20', 'aria-label': 'Code d’accès (12 caractères)' });
    for (var i = 0; i < 12; i++) {
      if (i && i % 4 === 0) box.appendChild(h('span.sep', { 'aria-hidden': 'true' }));
      var c = h('span.cbox', { 'aria-hidden': 'true' }); cells.push(c); box.appendChild(c);
    }
    box.appendChild(inp);
    function draw() {
      var v = last, focused = d.activeElement === inp;
      cells.forEach(function (c, i) {
        var ch = v[i] || '';
        if ((c.dataset.v || '') !== ch) { c.dataset.v = ch; c.classList.toggle('f', !!ch); if (ch && !RED) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } }
        c.textContent = ch ? (show ? ch : '•') : '';
        c.classList.toggle('cur', focused && i === Math.min(v.length, 11));
      });
    }
    inp.addEventListener('input', function () {
      var v = normCode(inp.value).slice(0, 12);
      if (inp.value !== v) inp.value = v;
      last = v; draw(); onChange(v);
      if (v.length === 12) onFull(v);
    });
    inp.addEventListener('focus', draw); inp.addEventListener('blur', draw);
    inp.addEventListener('keyup', draw);
    box.addEventListener('click', function () { inp.focus(); });
    draw();
    return {
      clear: function () { inp.value = ''; last = ''; inp.focus(); draw(); onChange(''); },
      focus: function () { inp.focus(); },
      value: function () { return last; },
      disable: function (b) { inp.disabled = b; },
      reveal: function (b) { show = b; draw(); }
    };
  }

  function showGate() {
    var g = $('#gate'); g.hidden = false;
    var wbox = $('#who'); wbox.innerHTML = '';
    Object.keys(USERS).forEach(function (u) {
      var t = (S.publicTeam || []).find(function (x) { return x.id === u; }) || {};
      var b = h('button', { type: 'button', 'aria-pressed': 'false', data: { u: u }, onclick: function () { pickWho(u); } },
        h('div.ring', NX.img(t.photo || 'assets/img/favicon.png', '')), h('b', USERS[u].name), h('small', USERS[u].role));
      wbox.appendChild(b);
    });
    codeUI = buildCode($('#code'), function (c) { $('#gCount').textContent = c.length + ' / 12'; if (c.length) { $('#gMsg').textContent = ''; $('#gMsg').className = 'g-msg'; } }, function () { submitCode(); });
    $('#gForm').onsubmit = function (e) { e.preventDefault(); submitCode(); };
    var cnt = $('#gCount');
    if (!$('#gShow')) cnt.parentNode.insertBefore(h('button.btn.sm.ghost', { id: 'gShow', type: 'button', style: 'padding:.3rem .7rem', 'aria-pressed': 'false', onclick: function () {
      var show = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', String(show)); this.lastChild.textContent = show ? 'Masquer' : 'Afficher';
      codeUI.reveal(show);
    } }, ico('eye'), h('span', 'Afficher')), cnt);
    var last = null; try { last = localStorage.getItem('nxs-last'); } catch (e) {}
    if (last && USERS[last]) pickWho(last);
  }
  function pickWho(u) {
    who = u;
    $$('#who button').forEach(function (b) { var on = b.dataset.u === u; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('#gName').textContent = USERS[u].name;
    var f = $('#gForm'); f.hidden = false;
    codeUI.clear();
  }
  var unlocking = false;
  function submitCode() {
    if (unlocking || !who) return;
    var code = codeUI.value(), msg = $('#gMsg'), btn = $('#gBtn'), g = $('#gate');
    if (Date.now() < lockUntil) { msg.textContent = 'Trop d’essais. Réessaie dans ' + Math.ceil((lockUntil - Date.now()) / 1000) + ' s.'; return; }
    if (code.length < 12) { msg.textContent = 'Le code fait 12 caractères.'; g.classList.remove('err'); void g.offsetWidth; g.classList.add('err'); return; }
    unlocking = true; codeUI.disable(true);
    btn.innerHTML = ''; append(btn, [h('span.spin'), 'Déchiffrement du coffre…']);
    var envP = S.env ? Promise.resolve(S.env) : fetchJSON(VAULT);
    envP.then(function (env) {
      S.env = env;
      return unwrapKey(env, who, code).then(function (raw) { return { raw: raw, env: env }; }, function () { throw new Error('badcode'); });
    }).then(function (r) {
      fails = 0;
      try { localStorage.setItem('nxs-last', who); } catch (e) {}
      msg.className = 'g-msg ok'; msg.textContent = 'Accès autorisé. Bienvenue ' + USERS[who].name + ' !';
      g.classList.add('ok');
      if (!RED) { d.body.appendChild(h('i.wave')); d.body.appendChild(h('i.wave.w2')); setTimeout(function () { $$('.wave').forEach(function (x) { x.remove(); }); }, 1400); }
      return Promise.all([enter(who, r.raw, r.env, $('#gRemember').checked), new Promise(function (ok) { setTimeout(ok, RED ? 0 : 750); })]);
    }).then(function () {
      showApp();
    }).catch(function (e) {
      unlocking = false; codeUI.disable(false);
      btn.textContent = 'Déverrouiller le studio';
      g.classList.remove('err', 'ok'); void g.offsetWidth;
      if (e.message === 'badcode') {
        fails++; g.classList.add('err');
        if (fails >= 5) { lockUntil = Date.now() + 30000; fails = 0; msg.textContent = 'Code incorrect 5 fois. Patiente 30 secondes.'; }
        else msg.textContent = 'Code incorrect. Vérifie bien ton code (' + (5 - fails) + ' essai' + (5 - fails > 1 ? 's' : '') + ' avant pause).';
        codeUI.clear();
      } else { console.error(e); msg.textContent = 'Impossible d’ouvrir le coffre (' + (e.message || e) + '). Recharge la page.'; }
    });
  }

  /* entrée dans le studio : déchiffrement, reprise du travail local, fusion */
  function enter(user, raw, env, remember) {
    S.user = user; S.raw = raw; S.env = env;
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']).then(function (key) {
      S.key = key;
      try { var sess = JSON.stringify({ user: user, k: b64(raw) }); sessionStorage.setItem('nxs', sess); if (remember) localStorage.setItem('nxs', sess); } catch (e) {}
      return Promise.all([unseal(key, env.data), idb.get('work:' + user), fetchJSON(DATA).catch(function () { return null; })]);
    }).then(function (r) {
      var remote = normalizePriv(r[0]), loc = r[1], live = r[2];
      var p = Promise.resolve(remote), dirty = false, base = env.rev;
      /* la copie locale est plus récente que celle servie par GitHub Pages (qui a ~1 min de retard) ou contient du travail non envoyé */
      if (loc && loc.box && (loc.dirty || (loc.rev || 0) > (env.rev || 0))) {
        p = Promise.all([unseal(S.key, loc.box), loc.split ? idb.get('files:' + user).then(function (fb) { return fb ? unseal(S.key, fb) : {}; }).catch(function () { return {}; }) : null]).then(function (rr) {
          var mine = rr[0]; if (loc.split) mine.files = Object.assign({}, remote.files, rr[1] || {});
          dirty = !!loc.dirty;
          if ((loc.rev || 0) >= (env.rev || 0)) {
            if (loc.keys) { S.env.keys = loc.keys; S.keysChanged = !!loc.keysChanged; }
            base = loc.rev; return normalizePriv(mine);
          }
          if (loc.keysChanged && loc.keys && loc.keys[user]) { S.env.keys = Object.assign({}, env.keys); S.env.keys[user] = loc.keys[user]; S.keysChanged = true; }
          S.mergedNotice = true; return mergePriv(remote, mine);
        }).catch(function () { dirty = false; base = env.rev; return remote; });
      }
      return p.then(function (priv) {
        S.priv = normalizePriv(priv); S.baseRev = base; S.dirty = dirty;
        S.live = live || { team: [], categories: [], projects: [] };
        /* version publiée la plus fraîche (GitHub Pages peut avoir une minute de retard) */
        S.liveFresh = false;
        return token() ? ghRaw(DATA).then(function (t) { S.live = JSON.parse(t); S.liveFresh = true; }).catch(function () {}) : null;
      }).then(function () {
        if (!S.priv.draft) { S.priv.draft = clone(S.live); S.priv.draftBase = hash(canon(S.live)); S.priv.draftPub = hash(canon(publicSite())); }
        normalizeDraft();
        checkExternal();
      });
    });
  }
  /* le site a été modifié hors du studio (ex. commit manuel) */
  function checkExternal() {
    S.external = false;
    if (!S.live || !S.live.projects || !S.live.projects.length) return;
    var liveH = hash(canon(S.live));
    if (S.priv.draftBase === liveH) return;
    /* publication toute récente : GitHub Pages sert peut-être encore l'ancienne version */
    if (!S.liveFresh && Date.now() - (S.priv.pubAt || 0) < 600000) return;
    if (hash(canon(publicSite())) === S.priv.draftPub || !S.priv.draftPub) adoptLive(); else S.external = true;
  }
  function adoptLive() {
    /* on garde les projets privés et la version complète des confidentiels (le site n'en a qu'un teaser) */
    var s = site(), keep = s.projects.filter(function (p) { return p.hidden || p.secret; }), byPub = {};
    keep.forEach(function (p) { if (!p.hidden) byPub[pubId(p)] = p; });
    var fresh = clone(S.live), used = {};
    s._info = fresh._info; s.team = fresh.team; s.categories = fresh.categories; s.site = fresh.site;
    s.projects = fresh.projects.map(function (lp) { var k = byPub[lp.id]; if (k) { used[k.id] = 1; return k; } return lp; })
      .concat(keep.filter(function (p) { return !used[p.id]; }));
    S.priv.draftBase = hash(canon(S.live)); S.priv.draftPub = hash(canon(publicSite()));
    normalizeDraft(); S.external = false;
  }

  /* =========================================================
     CHROME : navigation, statut, menu
     ========================================================= */
  var VIEWS = [
    { id: 'qg', name: 'QG', icon: 'home' },
    { id: 'projets', name: 'Projets', icon: 'grid' },
    { id: 'idees', name: 'Idées', icon: 'bulb' },
    { id: 'notes', name: 'Discussions', icon: 'chat' },
    { id: 'site', name: 'Site', icon: 'globe' },
    { id: 'equipe', name: 'Équipe', icon: 'users' },
    { id: 'reglages', name: 'Réglages', icon: 'gear' }
  ];
  function showApp() {
    $('#gate').hidden = true; $('#app').hidden = false; d.body.classList.remove('locked');
    buildChrome();
    var v = (location.hash || '').slice(1);
    go(VIEWS.some(function (x) { return x.id === v; }) ? v : 'qg', true);
    NX.watchEyes();
    if (S.mergedNotice) { toast('Tes modifications locales ont été fusionnées avec la dernière sauvegarde.', 'info', { ms: 6000 }); S.mergedNotice = false; }
    if (token()) setTimeout(function () { pull(true); }, 400);
    setInterval(function () { if (!d.hidden) pull(false); }, 60000);
    W.addEventListener('focus', function () { pull(false); });
  }
  function buildChrome() {
    var tabs = $('#tabs');
    VIEWS.forEach(function (v) {
      tabs.appendChild(h('button.s-tab', { type: 'button', data: { v: v.id }, onclick: function () { go(v.id); } }, ico(v.icon), h('span.lbl', v.name), h('span.cnt', { hidden: true })));
    });
    W.addEventListener('resize', moveInd);
    W.addEventListener('hashchange', function () { var v = location.hash.slice(1); if (v !== S.view && VIEWS.some(function (x) { return x.id === v; })) go(v); });
    chrome();
  }
  function moveInd() {
    var on = $('.s-tab.on'), ind = $('#ind'); if (!on) return;
    ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px';
  }
  /* barre du haut : construite une seule fois, puis seulement mise à jour (plus de reconstruction à chaque frappe) */
  var CH = null, diffCache = { v: -1, d: [] };
  function cachedDiffs() { if (diffCache.v !== S.ver) { diffCache = { v: S.ver, d: diffs() }; } return diffCache.d; }
  function buildRight() {
    var right = $('#right'); right.innerHTML = '';
    CH = {};
    CH.sync = h('button.sync', { type: 'button', onclick: function () { if (S.dirty) sync(false); } }, h('i'), CH.syncL = h('span.lbl'));
    CH.pub = h('button.btn.main', { type: 'button', onclick: function () { sync(true); } }, ico('rocket'), h('span.lbl', 'Publier'), CH.badge = h('span.badge', { hidden: true }));
    right.appendChild(CH.sync);
    right.appendChild(h('button.btn.prev-btn', { type: 'button', title: 'Voir le site avec tes modifications (sur cet appareil seulement)', onclick: preview }, ico('eye'), h('span.lbl', 'Aperçu')));
    right.appendChild(CH.pub);
    CH.dc = h('a.btn.dc', { href: CFG.discordInvite || '#', target: '_blank', rel: 'noopener', title: 'Discord NEXORIA' }, ico('discord'), h('span.lbl', 'Discord'));
    right.appendChild(CH.dc);
    var menu = h('div.menu', { hidden: true },
      h('div.m-who', CH.av2 = NX.img(avatar(S.user), ''), h('div', CH.name = h('b', member(S.user).name), h('small', USERS[S.user].role + ' · connecté'))),
      h('a', { href: 'index.html', target: '_blank', rel: 'noopener' }, ico('globe'), 'Voir le site public'),
      h('button', { type: 'button', onclick: function () { go('reglages'); menu.hidden = true; } }, ico('key'), 'Mon code & GitHub'),
      h('button', { type: 'button', onclick: function () { go('equipe'); menu.hidden = true; } }, ico('image'), 'Changer ma photo'),
      h('button', { type: 'button', onclick: logout }, ico('logout'), 'Verrouiller le studio'));
    right.appendChild(h('div', { style: 'position:relative' }, h('button.me', { type: 'button', 'aria-label': 'Mon compte', onclick: function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; } }, CH.av = NX.img(avatar(S.user), '')), menu));
  }
  var chrome = debounce(function () {
    if (!S.priv) return;
    if (!CH) buildRight();
    var df = cachedDiffs(), ideas = S.priv.ideas.filter(function (i) { return i.col !== 'archive'; }).length;
    var counts = { projets: site().projects.length, idees: ideas, notes: unreadTotal() };
    $$('.s-tab').forEach(function (b) {
      var c = b.querySelector('.cnt'), n = counts[b.dataset.v];
      c.hidden = !n; c.textContent = n || ''; c.classList.toggle('hot', b.dataset.v === 'notes' && n > 0);
    });
    CH.sync.className = 'sync' + (S.busy ? ' busy' : S.dirty ? ' dirty' : '');
    CH.sync.title = S.dirty ? 'Changements pas encore envoyés sur GitHub — cliquer pour sauvegarder' : 'Tout est sauvegardé dans le coffre privé';
    CH.syncL.textContent = S.busy ? 'Synchronisation…' : S.dirty ? 'Non sauvegardé' : 'Synchronisé';
    CH.badge.hidden = !df.length; CH.badge.textContent = String(df.length);
    CH.pub.title = df.length ? df.length + ' changement(s) à mettre en ligne' : 'Le site public est à jour';
    var dc = (site().site && site().site.discord) || CFG.discordInvite; CH.dc.hidden = !dc; if (dc) CH.dc.href = dc;
    var av = avatar(S.user); if (CH.av.getAttribute('src') !== av) { CH.av.src = av; CH.av2.src = av; }
    CH.name.textContent = member(S.user).name;
    moveInd();
  }, 200);
  d.addEventListener('click', function (e) { var m = $('.menu'); if (m && !m.hidden && !e.target.closest('.menu')) m.hidden = true; });
  function logout() {
    var go2 = function () { clearSession(); location.hash = ''; location.reload(); };
    if (S.dirty && token()) { sync(false).then(go2); } else go2();
  }
  function go(v, first) {
    if (E) closeEditor();
    S.view = v; S.anim = true;
    if (location.hash.slice(1) !== v) history.replaceState(null, '', '#' + v);
    $$('.s-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
    $$('.s-view').forEach(function (s) { s.classList.toggle('on', s.id === 'v-' + v); });
    moveInd(); render();
    if (!first) W.scrollTo({ top: 0, behavior: RED ? 'auto' : 'smooth' });
    var tab = $('.s-tab.on'); if (tab && tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function render() {
    var el = $('#v-' + S.view); if (!el) return;
    el.innerHTML = '';
    ({ qg: vQG, projets: vProjects, idees: vIdeas, notes: vNotes, site: vSite, equipe: vTeam, reglages: vSettings })[S.view](el);
    S.anim = false;
    chrome();
  }
  function ap(el, i) { if (S.anim && !RED) { el.classList.add('ap'); el.style.setProperty('--i', i || 0); } return el; }
  function head(title, lead, right, priv) {
    return h('div.s-head', h('div', priv ? h('span.priv', ico('lock'), priv) : null, h('h2', { style: priv ? 'margin-top:.6rem' : null }, title), lead ? h('p.lead', lead) : null), right || null);
  }

  /* =========================================================
     VUE : QG
     ========================================================= */
  function vQG(el) {
    var me = member(S.user), s = site(), df = diffs();
    var ideasReady = S.priv.ideas.filter(function (i) { return i.col === 'pret'; });
    var n = { pub: 0, dev: 0, done: 0, pause: 0, priv: 0 };
    s.projects.forEach(function (p) { if (p.hidden) n.priv++; else { n.pub++; n[p.state]++; } });
    var nIdeas = S.priv.ideas.filter(function (i) { return i.col !== 'archive'; }).length;

    if (S.external) el.appendChild(h('div.banner', ico('alert'), h('span', 'Le site en ligne a été modifié en dehors du studio depuis ta dernière publication.'),
      h('div.btns', h('button.btn', { type: 'button', onclick: function () { adoptLive(); touch(); render(); toast('Brouillon remplacé par la version en ligne (tes projets privés sont gardés).', 'ok'); } }, 'Reprendre la version en ligne'),
        h('button.btn.ghost', { type: 'button', onclick: function () { S.priv.draftBase = hash(canon(S.live)); S.external = false; touch(); render(); } }, 'Garder mon brouillon'))));

    var emb = NX.img('assets/img/nexoria-logo.png', '', 'qg-emb');
    var sum = df.length ? df.length + ' changement' + (df.length > 1 ? 's' : '') + ' attend' + (df.length > 1 ? 'ent' : '') + ' d’être publié' + (df.length > 1 ? 's' : '') + ' sur le site.' : 'Le site public est à jour avec ton brouillon.';
    var hero = h('div.qg-hero', h('div.ring', NX.img(avatar(S.user), '')),
      h('div', h('p.kicker', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + USERS[S.user].role),
        h('h1', greet() + ' ' + me.name + ' 👋'),
        h('p', sum + ' ' + (nIdeas ? nIdeas + ' idée' + (nIdeas > 1 ? 's' : '') + ' dans le coffre privé.' : 'Aucune idée en stock — lance-toi !')),
        h('div.btns', h('button.btn.main', { type: 'button', onclick: function () { sync(true); } }, ico('rocket'), 'Publier le site'),
          h('button.btn', { type: 'button', onclick: newProject }, ico('plus'), 'Nouveau projet'),
          h('button.btn', { type: 'button', onclick: function () { go('idees'); setTimeout(function () { var i = $('.qadd input'); i && i.focus(); }, 200); } }, ico('bulb'), 'Noter une idée'))),
      emb);
    hero.addEventListener('pointermove', function (e) { var q = hero.getBoundingClientRect(); emb.style.setProperty('--ry', ((e.clientX - q.left) / q.width - .5) * 30); emb.style.setProperty('--rx', (.5 - (e.clientY - q.top) / q.height) * 20); });
    el.appendChild(ap(hero, 0));

    var st = h('dl.stats');
    [['', n.pub, 'En ligne', 'projets'], ['s-dev', n.dev, 'En développement', 'projets'], ['s-done', n.done, 'Terminés', 'projets'], ['s-pause', n.pause, 'En pause', 'projets'], ['s-priv', n.priv, 'Projets privés', 'projets'], ['s-idea', nIdeas, 'Idées', 'idees']].forEach(function (x) {
      var dd = h('dd', '0'), w = h('div.' + (x[0] || 'x'), { role: 'button', tabindex: '0', onclick: function () { if (x[3] === 'projets') S.pfilter = x[0] === 's-priv' ? 'priv' : x[0] === 's-dev' ? 'dev' : x[0] === 's-done' ? 'done' : x[0] === 's-pause' ? 'pause' : 'all'; go(x[3]); } }, dd, h('dt', x[2]));
      st.appendChild(w); setTimeout(function () { countUp(dd, x[1]); }, 250);
    });
    el.appendChild(ap(h('div.qg-stats', st), 1));

    var left = h('div', { style: 'display:grid;gap:1.2rem' }), right = h('div', { style: 'display:grid;gap:1.2rem' });
    var pubP = h('div.panel', h('h3', ico('rocket'), 'À publier sur le site', df.length ? h('button.btn.sm.main.r', { type: 'button', onclick: function () { sync(true); } }, 'Tout publier') : null));
    if (!df.length) pubP.appendChild(h('div.ok-line', ico('check'), 'Rien à publier : le site en ligne correspond à ton brouillon.'));
    df.forEach(function (c) {
      var lab = { add: 'Nouveau', mod: 'Modifié', del: c.still ? 'Passé en privé' : 'Supprimé', ord: 'Ordre', team: 'Équipe', site: 'Textes' }[c.k];
      var row = h('div.chg', { onclick: function () { if (c.p && proj(c.p.id)) openEditor(c.p.id); else go(c.k === 'team' ? 'equipe' : c.k === 'site' ? 'site' : 'projets'); } });
      if (c.p) { NX.paint(row, c.p); row.appendChild(NX.icon(c.p, resolve)); row.appendChild(h('div', h('b', c.p.name), h('small', c.k === 'del' ? 'Ne sera plus visible sur le site' : (c.p.tag || catName(c.p.category))))); }
      else row.appendChild(h('div', h('b', c.k === 'ord' ? 'Ordre des projets' : c.k === 'site' ? 'Textes & sections du site' : 'Équipe & catégories'), h('small', c.k === 'ord' ? 'Les affiches ont été réorganisées' : c.k === 'site' ? 'Accueil, FAQ, vision, pied de page…' : 'Profils ou catégories modifiés')));
      row.appendChild(h('span.k.' + (c.k === 'team' || c.k === 'site' ? 'mod' : c.k), lab));
      pubP.appendChild(row);
    });
    left.appendChild(ap(pubP, 2));

    var ip = h('div.panel', h('h3', ico('bulb'), 'Idées prêtes à lancer', h('button.btn.sm.r', { type: 'button', onclick: function () { go('idees'); } }, 'Tableau des idées')));
    if (!ideasReady.length) ip.appendChild(h('p', { style: 'color:var(--muted);margin:0' }, 'Glisse une idée dans la colonne « Prêt à lancer » pour la retrouver ici.'));
    else { var g = h('div.qg-cards'); ideasReady.slice(0, 6).forEach(function (i) { g.appendChild(h('div.mini-idea', { style: '--ic:' + (i.color || '#c7c7d1'), onclick: function () { editIdea(i); } }, h('b', i.title), h('small', member(i.by).name + ' · ' + ago(i.at)))); }); ip.appendChild(g); }
    left.appendChild(ap(ip, 3));

    var fp = h('div.panel', h('h3', ico('list'), 'Activité récente')), feed = h('div.feed');
    S.priv.activity.slice(0, 30).forEach(function (a) { feed.appendChild(h('div.fi', NX.img(avatar(a.by), ''), h('div', h('p', h('b', member(a.by).name + ' '), a.text), h('small', ago(a.at))))); });
    if (!S.priv.activity.length) feed.appendChild(h('p', { style: 'color:var(--muted)' }, 'Pas encore d’activité.'));
    fp.appendChild(feed); right.appendChild(ap(fp, 2));

    var last = [];
    Object.keys(S.priv.notes).forEach(function (ch) { (S.priv.notes[ch] || []).forEach(function (m) { last.push({ ch: ch, m: m }); }); });
    last.sort(function (a, b) { return b.m.at - a.m.at; });
    var np = h('div.panel', h('h3', ico('chat'), 'Derniers messages', h('button.btn.sm.r', { type: 'button', onclick: function () { go('notes'); } }, 'Ouvrir')));
    if (!last.length) np.appendChild(h('p', { style: 'color:var(--muted);margin:0' }, 'Aucun message. Laisse une note à ' + (S.user === 'kevin' ? 'Junior' : 'MRkevin') + ' dans Discussions.'));
    last.slice(0, 4).forEach(function (x) {
      np.appendChild(h('div.fi', { style: 'cursor:pointer', onclick: function () { S.noteCh = x.ch; go('notes'); } }, NX.img(avatar(x.m.by), ''), h('div', h('p', x.m.text.length > 120 ? x.m.text.slice(0, 120) + '…' : x.m.text), h('small', (x.ch === 'general' ? 'Général' : (proj(x.ch) || { name: 'Projet supprimé' }).name) + ' · ' + ago(x.m.at)))));
    });
    right.appendChild(ap(np, 3));
    el.appendChild(h('div.qg-grid', left, right));
  }

  /* =========================================================
     VUE : PROJETS (affiches + tableau, glisser-déposer)
     ========================================================= */
  function filtered() {
    var q = S.q.trim().toLowerCase();
    return site().projects.filter(function (p) {
      var f = S.pfilter, ok = f === 'all' || (f === 'priv' ? p.hidden : f === 'secret' ? p.secret && !p.hidden : f === 'pub' ? !p.hidden : p.state === f);
      return ok && (!q || [p.name, p.tag, p.short, p.description, catName(p.category)].join(' ').toLowerCase().indexOf(q) > -1);
    });
  }
  function vProjects(el) {
    var s = site(), all = s.projects;
    var cnt = function (f) { return all.filter(function (p) { return f === 'all' || (f === 'priv' ? p.hidden : f === 'secret' ? p.secret && !p.hidden : p.state === f); }).length; };
    el.appendChild(ap(head('Projets', 'Glisse les affiches pour changer l’ordre du site. Clique pour tout modifier. Les projets privés restent dans le coffre et ne sont jamais publiés.',
      h('button.btn.main', { type: 'button', onclick: newProject }, ico('plus'), 'Nouveau projet')), 0));
    var chips = h('div.chips', { role: 'group', 'aria-label': 'Filtrer' });
    [['all', 'Tous'], ['dev', 'En développement'], ['done', 'Terminés'], ['pause', 'En pause'], ['secret', 'Confidentiels'], ['priv', 'Privés']].forEach(function (f) {
      chips.appendChild(h('button.chip' + (S.pfilter === f[0] ? '.on' : ''), { type: 'button', 'aria-pressed': S.pfilter === f[0] ? 'true' : 'false', onclick: function () { S.pfilter = f[0]; render(); } },
        f[0] === 'priv' ? ico('lock') : f[0] === 'secret' ? ico('eyeoff') : null, f[1], h('span.n', String(cnt(f[0])))));
    });
    var search = h('input', { type: 'search', placeholder: 'Rechercher un projet…', value: S.q, 'aria-label': 'Rechercher un projet' });
    search.addEventListener('input', debounce(function () { S.q = search.value; drawList(); }, 120));
    var seg = h('div.seg', h('button' + (S.pview === 'posters' ? '.on' : ''), { type: 'button', onclick: function () { S.pview = 'posters'; render(); } }, ico('grid'), 'Affiches'),
      h('button' + (S.pview === 'board' ? '.on' : ''), { type: 'button', onclick: function () { S.pview = 'board'; render(); } }, ico('columns'), 'Avancement'));
    el.appendChild(ap(h('div.tbar', chips, h('div.tbar-r', h('label.s-search', ico('search'), search), seg)), 1));
    el.appendChild(ap(h('p.hint-line', ico('grip'), S.pview === 'posters' ? 'Astuce : maintiens et glisse une affiche pour la déplacer · la première affiche publique est mise en avant sur le site.' : 'Glisse un projet dans une autre colonne pour changer son statut.'), 2));
    var box = h('div'); el.appendChild(box);
    function drawList() { box.innerHTML = ''; (S.pview === 'board' ? drawBoard : drawPosters)(box); }
    drawList();
  }
  function drawPosters(box) {
    var list = filtered(), tm = teamMap(), firstPub = site().projects.find(function (p) { return !p.hidden; });
    var grid = h('div.posters.s-posters');
    list.forEach(function (p, i) {
      var po = NX.poster(p, { tag: 'div', big: S.pfilter === 'all' && !S.q && firstPub && p.id === firstPub.id, team: tm, resolve: resolve });
      po.dataset.id = p.id; po.tabIndex = 0; po.setAttribute('role', 'button');
      if (p.hidden) { po.classList.add('is-priv'); po.appendChild(h('span.ribbon', ico('lock'), 'Privé · non publié')); }
      else if (p.secret) { po.classList.add('is-sec'); po.appendChild(h('span.ribbon.sec', ico('eyeoff'), 'Confidentiel · teaser en ligne')); }
      var tools = h('div.pt',
        ibtn('edit', 'Modifier', function () { openEditor(p.id); }),
        ibtn(p.hidden ? 'eye' : 'eyeoff', p.hidden ? 'Rendre public (au prochain « Publier »)' : 'Passer en privé (retiré du site)', function () { toggleHidden(p); }),
        ibtn('copy', 'Dupliquer', function () { duplicate(p); }),
        ibtn('trash', 'Supprimer', function () { removeProject(p); }, 'del'));
      po.querySelector('.p-top').appendChild(tools);
      po.addEventListener('click', function (e) { if (!e.target.closest('.pt')) openEditor(p.id); });
      po.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target === po) openEditor(p.id); });
      tilt(po); grid.appendChild(ap(po, i + 2));
    });
    var add = h('button.add-card', { type: 'button', onclick: newProject }, h('span.plus', ico('plus')), h('b', 'Nouveau projet'), h('span', 'Créé en privé — publie-le quand il est prêt'));
    grid.appendChild(ap(add, list.length + 2));
    sortable(grid, { items: '.poster', grid: true, end: '.add-card', group: 'posters', onEnd: function (ev) {
      var nb = neighbours(ev.item, '.poster'); moveRel(site().projects, ev.item.dataset.id, nb.prev, nb.next);
      var p = proj(ev.item.dataset.id); p._u = Date.now(); site()._ou = Date.now();
      log('a réorganisé les projets'); touch(); toast('Ordre mis à jour', 'ok'); render();
    } });
    if (!list.length && (S.q || S.pfilter !== 'all')) box.appendChild(h('div.empty', NX.logoEl({ name: '?', monogram: '?', accent: '#c7c7d1' }), h('b', 'Aucun projet ne correspond'), h('span', 'Change de filtre ou de recherche.')));
    box.appendChild(grid);
  }
  function drawBoard(box) {
    var list = filtered(), board = h('div.s-board');
    ['dev', 'done', 'pause'].forEach(function (st, ci) {
      var L = list.filter(function (p) { return p.state === st; });
      var col = h('div.col.' + st), dl = h('div.dl', { data: { st: st } });
      col.appendChild(h('h3', h('span.dot'), NX.STATE[st].label, h('b', String(L.length))));
      L.forEach(function (p) {
        var a = h('div.row', { data: { id: p.id }, role: 'button', tabindex: '0', onclick: function () { openEditor(p.id); } });
        NX.paint(a, p); a.appendChild(NX.icon(p, resolve));
        var t = h('span.r-txt', h('b', p.name), h('small', p.hidden ? 'Privé · ' + (p.tag || '') : (p.statusNote || p.tag || catName(p.category))));
        if (typeof p.progress === 'number') { var bar = h('div.bar'), i = h('i', { style: 'width:' + p.progress + '%' }); bar.appendChild(i); t.appendChild(bar); }
        a.appendChild(t);
        if (p.hidden) a.appendChild(ico('lock')).classList.add('pv');
        else if (typeof p.progress === 'number') a.appendChild(h('small', p.progress + ' %'));
        dl.appendChild(a);
      });
      col.appendChild(dl); board.appendChild(ap(col, ci + 2));
      sortable(dl, { items: '.row', group: 'board', onEnd: function (ev) {
        var p = proj(ev.item.dataset.id), ns = ev.to.dataset.st, nb = neighbours(ev.item, '.row');
        moveRel(site().projects, p.id, nb.prev, nb.next);
        if (p.state !== ns) { p.state = ns; log('a passé « ' + p.name + ' » en ' + NX.STATE[ns].label.toLowerCase()); toast(p.name + ' → ' + NX.STATE[ns].label, 'ok'); }
        p._u = Date.now(); touch(); render();
      } });
    });
    box.appendChild(board);
  }
  function blankProject(name) {
    var s = site(), id = slug(name), k = 2;
    while (proj(id)) id = slug(name) + '-' + k++;
    var acc = ['#e5525f', '#38bdf8', '#22d97f', '#f59e0b', '#8b5cf6', '#f43f5e', '#22d3ee'][Math.floor(Math.random() * 7)];
    return { id: id, name: name, category: (s.categories[0] || {}).id || 'jeux', tag: '', accent: acc, bg: bgPresets(acc)[0][1], state: 'dev', authors: [S.user], version: '0.1', short: '', description: '', galleryTitle: 'Galerie', hidden: true, _u: Date.now(), _by: S.user };
  }
  function newProject() {
    var p = blankProject('Nouveau projet');
    site().projects.unshift(p); log('a créé le projet privé « ' + p.name + ' »'); touch();
    if (S.view !== 'projets') go('projets'); else render();
    openEditor(p.id, true);
  }
  function toggleHidden(p) {
    p.hidden = !p.hidden; p._u = Date.now();
    log(p.hidden ? 'a passé « ' + p.name + ' » en privé' : 'a rendu « ' + p.name + ' » public');
    touch(); render();
    toast(p.hidden ? p.name + ' est privé : il sera retiré du site à la prochaine publication.' : p.name + ' sera visible sur le site après « Publier ».', p.hidden ? 'info' : 'ok', { ms: 4500 });
  }
  function duplicate(p) {
    var c = clone(p), base = blankProject(p.name + ' copie');
    c.id = base.id; c.name = p.name + ' (copie)'; c.hidden = true; c._u = Date.now(); c._by = S.user;
    var arr = site().projects; arr.splice(arr.indexOf(p) + 1, 0, c);
    log('a dupliqué « ' + p.name + ' »'); touch(); render(); toast('Copie privée créée', 'ok');
  }
  function removeProject(p, then) {
    ask('Supprimer « ' + p.name + ' » ?', p.hidden ? 'Ce projet privé sera supprimé du coffre.' : 'Il disparaîtra du site à la prochaine publication. Tu peux annuler juste après.', 'Supprimer', true).then(function (ok) {
      if (!ok) return;
      var arr = site().projects, i = arr.indexOf(p); if (i < 0) return;
      arr.splice(i, 1); S.priv.tomb[p.id] = Date.now(); log('a supprimé « ' + p.name + ' »'); touch();
      then && then(); render();
      toast('« ' + p.name + ' » supprimé', 'warn', { ms: 7000, action: { label: 'Annuler', fn: function () { delete S.priv.tomb[p.id]; p._u = Date.now(); arr.splice(Math.min(i, arr.length), 0, p); touch(); render(); toast('Projet restauré', 'ok'); } } });
    });
  }

  /* =========================================================
     ÉDITEUR DE PROJET
     ========================================================= */
  var SWATCH = ['#e3a73b', '#e5525f', '#f43f5e', '#f97316', '#f59e0b', '#22d97f', '#4caf6a', '#22d3ee', '#38bdf8', '#3b82f6', '#5b8cff', '#8b5cf6', '#e5e7eb'];
  function bgPresets(acc) {
    var a = hexOk(acc) ? acc : '#c7c7d1', dk = mix(a, '#000000', .86), dk2 = mix(a, '#000000', .92);
    return [
      ['Lueur', 'radial-gradient(60% 50% at 75% 25%,' + a + '44,transparent 70%),linear-gradient(160deg,' + dk + ',#07070a 60%,' + dk2 + ')'],
      ['Aube', 'radial-gradient(70% 60% at 80% 20%,' + a + '55,transparent 70%),radial-gradient(40% 40% at 10% 90%,' + a + '22,transparent 70%),linear-gradient(160deg,' + dk + ',#07070a 60%)'],
      ['Néon', 'radial-gradient(60% 50% at 75% 70%,' + a + '66,transparent 70%),linear-gradient(160deg,#0b0b10,#050507 60%,' + dk + ')'],
      ['Profond', 'linear-gradient(160deg,' + dk + ',#08080b 55%,' + dk2 + ')'],
      ['Argent', 'radial-gradient(70% 60% at 75% 20%,rgba(255,255,255,.16),transparent 70%),linear-gradient(160deg,#16161b,#07070a)']
    ];
  }
  function fld(label, input, hint) { return h('div.f', label ? h('label', label) : null, input, hint ? h('small.hint', hint) : null); }
  function tIn(obj, key, ch, o) {
    o = o || {};
    var el = h(o.area ? 'textarea.in' : 'input.in', { placeholder: o.ph || '', rows: o.rows || null, maxlength: o.max || null, type: o.type || null, min: o.min, max: o.maxv });
    el.value = obj[key] == null ? '' : obj[key];
    el.addEventListener('input', function () {
      var v = el.value;
      if (o.num) v = v === '' ? undefined : clamp(Number(v), o.min || 0, o.maxv || 100);
      if (v === '' || v == null || (typeof v === 'number' && isNaN(v))) delete obj[key]; else obj[key] = v;
      ch(); o.on && o.on(v);
    });
    return el;
  }
  function pick(opts, val, onPick) {
    var w = h('div.pick', { role: 'group' });
    opts.forEach(function (o) {
      var b = h('button' + (o.v === val ? '.on' : ''), { type: 'button', 'aria-pressed': o.v === val ? 'true' : 'false', style: o.c ? '--c:' + o.c : null, onclick: function () {
        $$('button', w).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); onPick(o.v);
      } }, o.c ? h('i') : null, o.img ? NX.img(o.img, '') : null, o.icon ? ico(o.icon) : null, o.l);
      w.appendChild(b);
    });
    return w;
  }
  function sw(label, on, fn) {
    var i = h('input', { type: 'checkbox', checked: !!on });
    i.addEventListener('change', function () { fn(i.checked); });
    return h('label.sw', i, h('i'), label);
  }
  function listEd(arr, row, make, ch, addLabel) {
    var box = h('div.le'), wrap = h('div.fgrid');
    function draw() {
      box.innerHTML = '';
      arr.forEach(function (it) {
        var r = h('div.le-row', h('button.grip', { type: 'button', title: 'Glisser pour réordonner', 'aria-label': 'Déplacer' }, ico('grip')), row(it),
          h('button.le-del', { type: 'button', title: 'Supprimer', 'aria-label': 'Supprimer', onclick: function () { arr.splice(arr.indexOf(it), 1); ch(); var a = r.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(30px)' }], { duration: 220 }); a.onfinish = draw; } }, ico('trash')));
        r._it = it; box.appendChild(r);
      });
    }
    draw();
    sortable(box, { items: '.le-row', handle: '.grip', scroller: '.ed-f', onEnd: function () { var o = [].map.call(box.children, function (r) { return r._it; }); arr.length = 0; [].push.apply(arr, o); ch(); } });
    wrap.appendChild(box);
    wrap.appendChild(h('button.btn.sm.le-add', { type: 'button', onclick: function () { arr.push(make()); ch(); draw(); var l = box.lastElementChild; if (l) { l.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 300 }); var f = l.querySelector('input,textarea'); f && f.focus(); } } }, ico('plus'), addLabel));
    return wrap;
  }

  function openEditor(id, isNew) {
    var p = proj(id); if (!p) return;
    if (E) closeEditor(true);
    var snap = clone(p);
    var wrap = h('div.ed-wrap', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Modifier ' + p.name });
    var ed = h('div.ed'); wrap.appendChild(ed);
    E = { p: p, snap: snap, wrap: wrap, isNew: isNew };
    NX.paint(ed, p);
    var icoBox = h('span'), title = h('h2'), saved = h('small', ico('check'), 'Enregistré automatiquement');
    var prevPane = h('aside.ed-p', { 'aria-label': 'Aperçu en direct' });
    var hd = h('div.ed-h', icoBox, h('div.t', title, saved),
      h('button.btn.ed-pv-btn', { type: 'button', onclick: function () { prevPane.classList.toggle('show'); } }, ico('eye'), 'Aperçu'),
      h('button.btn.hide-m', { type: 'button', title: 'Annuler toutes les modifications faites depuis l’ouverture', onclick: function () {
        ask('Annuler les modifications ?', 'Le projet revient à son état d’avant l’ouverture de l’éditeur.', 'Revenir en arrière').then(function (ok) {
          if (!ok) return; Object.keys(p).forEach(function (k) { delete p[k]; }); Object.assign(p, clone(snap)); p._u = Date.now(); touch(); var id2 = p.id; closeEditor(true); openEditor(id2); toast('Modifications annulées', 'ok');
        });
      } }, ico('undo'), 'Annuler'),
      h('button.btn.hide-m', { type: 'button', onclick: function () { preview('#/projet/' + p.id); } }, ico('globe'), 'Voir la page'),
      h('button.ed-x', { type: 'button', 'aria-label': 'Fermer l’éditeur', onclick: function () { closeEditor(); } }, ico('x')));
    ed.appendChild(hd);
    var nav = h('nav.ed-nav', { 'aria-label': 'Sections' }), form = h('div.ed-f');
    ed.appendChild(h('div.ed-b', nav, form, prevPane));
    E.form = form; E.prev = prevPane;

    function ch() { p._u = Date.now(); touch(); headUpd(); schedulePrev(); saved.animate && !RED && saved.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 400 }); }
    E.ch = ch;
    function headUpd() { icoBox.innerHTML = ''; icoBox.appendChild(NX.icon(p, resolve)); title.textContent = p.name || 'Sans nom'; NX.paint(ed, p); }
    headUpd();
    var schedulePrev = debounce(drawPrev, 260);
    function drawPrev() {
      prevPane.innerHTML = '';
      prevPane.appendChild(h('p.lab', 'Affiche sur l’accueil'));
      var po = NX.poster(p.secret && !p.hidden ? pubProject(p) : p, { tag: 'div', team: teamMap(), resolve: resolve });
      if (p.hidden) po.appendChild(h('span.ribbon', ico('lock'), 'Privé'));
      else if (p.secret) prevPane.appendChild(h('p.hint', { style: 'margin:0 0 .6rem' }, '👁 Ce que le public voit : un teaser flouté' + (p.codename ? ', sous le nom « ' + p.codename + ' »' : '') + '.'));
      prevPane.appendChild(tilt(po));
      prevPane.appendChild(h('p.lab', 'Haut de la page projet'));
      prevPane.appendChild(miniHero(p.secret && !p.hidden ? pubProject(p) : p));
      prevPane.appendChild(h('button.btn', { type: 'button', onclick: function () { preview('#/projet/' + p.id); } }, ico('eye'), 'Aperçu complet de la page'));
    }
    drawPrev();

    var SECS = [];
    function sec(id, name, icon, build, cls) {
      var s = h('section.ed-s' + (cls ? '.' + cls : ''), { id: 'es-' + id });
      function fill() { s.innerHTML = ''; s.appendChild(h('h3', h('span.n', String(SECS.indexOf(id) + 1)), name)); append(s, [build()]); }
      SECS.push(id); fill(); s._fill = fill;
      nav.appendChild(h('a', { href: '#es-' + id, data: { s: id }, onclick: function (e) { e.preventDefault(); s.scrollIntoView({ behavior: RED ? 'auto' : 'smooth', block: 'start' }); } }, ico(icon), name));
      form.appendChild(s); return s;
    }
    var tm = site().team;

    sec('id', 'Identité', 'flag', function () {
      var name = tIn(p, 'name', ch, { ph: 'Nom du projet', max: 60 });
      var cat = h('select.in'); site().categories.forEach(function (c) { cat.appendChild(h('option', { value: c.id, selected: c.id === p.category }, c.name)); });
      cat.addEventListener('change', function () { p.category = cat.value; ch(); });
      return [
        h('div.frow', fld('Nom', name), fld('Petite étiquette', tIn(p, 'tag', ch, { ph: 'Ex. Serveur Garry’s Mod · Roleplay', max: 60 }))),
        h('div.frow', fld('Catégorie', cat), fld('Version', tIn(p, 'version', ch, { ph: 'Ex. 1.0', max: 16 }))),
        fld('Statut', pick([{ v: 'dev', l: 'En développement', c: '#38bdf8' }, { v: 'done', l: 'Terminé', c: '#10b981' }, { v: 'pause', l: 'En pause', c: '#fbbf24' }], p.state, function (v) { p.state = v; ch(); })),
        visField(p, ch),
        fld('Qui travaille dessus', (function () {
          var w = h('div.pick');
          tm.forEach(function (t) {
            var on = (p.authors || []).indexOf(t.id) > -1;
            var b = h('button' + (on ? '.on' : ''), { type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: function () {
              p.authors = p.authors || []; var i = p.authors.indexOf(t.id);
              if (i > -1) p.authors.splice(i, 1); else p.authors.push(t.id);
              b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0 ? 'true' : 'false'); ch();
            } }, NX.img(resolve(t.photo), ''), t.name);
            w.appendChild(b);
          });
          return w;
        })()),
        fld('Note sur l’équipe', tIn(p, 'authorsNote', ch, { ph: 'Ex. Junior gère les interfaces, MRkevin le code serveur…' }))
      ];
    });

    var visSec = sec('vis', 'Couleurs & visuels', 'image', function () {
      var col = h('input', { type: 'color', value: hexOk(p.accent) ? p.accent : '#c7c7d1', 'aria-label': 'Couleur personnalisée' });
      function setAcc(c) {
        var old = bgPresets(p.accent).map(function (x) { return x[1]; }).indexOf(p.bg);
        p.accent = c; if (old > -1) p.bg = bgPresets(c)[old][1];
        ch(); visSec._fill();
      }
      col.addEventListener('change', function () { setAcc(col.value); });
      var sws = h('div.swatches'); SWATCH.forEach(function (c) { sws.appendChild(h('button' + (c === p.accent ? '.on' : ''), { type: 'button', style: '--c:' + c, title: c, 'aria-label': 'Couleur ' + c, onclick: function () { setAcc(c); } })); });
      sws.appendChild(col);
      var bgs = h('div.bgs');
      bgPresets(p.accent).forEach(function (b) { bgs.appendChild(h('button' + (b[1] === p.bg ? '.on' : ''), { type: 'button', style: '--b:' + b[1], onclick: function () { p.bg = b[1]; ch(); visSec._fill(); } }, b[0])); });
      var mode = p.holo ? 'holo' : p.logo ? 'img' : 'auto', logoBox = h('div.fgrid');
      function drawLogo() {
        logoBox.innerHTML = '';
        if (mode === 'auto') {
          var big = h('div', { style: 'display:grid;grid-template-columns:minmax(0,220px) 1fr;gap:1rem;align-items:center;padding:1rem;border-radius:16px;border:1px solid var(--line);background:' + (p.bg || '#111') });
          var lg = NX.logoEl(p); big.appendChild(lg);
          var mono = tIn(p, 'monogram', ch, { ph: (p.name || '?').charAt(0).toUpperCase(), max: NX.MAX_LETTERS, on: function () { lg.innerHTML = NX.logoSVG(NX.initials(p), p.accent); } });
          mono.style.textTransform = 'uppercase';
          big.appendChild(fld('Lettres du logo (1 à ' + NX.MAX_LETTERS + ')', mono, 'Vide = première lettre du nom. Style NX : lettres noires, contour blanc, yeux qui suivent la souris et langue tirée.'));
          logoBox.appendChild(big);
        } else if (mode === 'img') {
          logoBox.appendChild(imgField(p, 'logo', { ch: ch, logo: true, max: 900, empty: 'Dépose le logo du projet', pbg: function () { return p.bg; }, after: function () { if (!p.logo) { mode = 'auto'; visSec._fill(); } } }));
          logoBox.appendChild(sw('Coins arrondis (icône d’application)', p.logoRounded, function (v) { if (v) p.logoRounded = true; else delete p.logoRounded; ch(); }));
        } else logoBox.appendChild(h('p.hint', 'Écran holographique animé (comme le Panel HG).'));
      }
      drawLogo();
      return [
        fld('Couleur du projet', sws),
        fld('Fond de l’affiche', bgs, 'Les fonds suivent la couleur choisie.'),
        fld('Logo', pick([{ v: 'auto', l: 'Logo auto NX', icon: 'sparkle' }, { v: 'img', l: 'Image', icon: 'image' }, { v: 'holo', l: 'Écran holo', icon: 'columns' }], mode, function (v) {
          mode = v; if (v === 'auto') { delete p.logo; delete p.holo; } else if (v === 'holo') { p.holo = true; } else { delete p.holo; } ch(); drawLogo();
        })),
        logoBox,
        imgField(p, 'banner', { label: 'Bannière (image de fond)', ch: ch, max: 1920, empty: 'Dépose une bannière ou une capture', hint: 'Affichée en fond de l’affiche et en haut de la page projet.' }),
        sw('La bannière est une capture d’écran (floutée en fond)', p.bannerIsCapture, function (v) { if (v) p.bannerIsCapture = true; else delete p.bannerIsCapture; ch(); }),
        h('details', h('summary', { style: 'cursor:pointer;color:var(--muted);font-size:.85rem' }, 'Fond personnalisé (CSS avancé)'), tIn(p, 'bg', ch, { area: true, rows: 2 }))
      ];
    });

    sec('txt', 'Présentation', 'edit', function () {
      var cnt = h('span', (p.short || '').length + ' / 140');
      return [
        fld(h('span', 'Phrase d’accroche (sur l’affiche) ', cnt), tIn(p, 'short', ch, { max: 140, ph: 'Une phrase qui donne envie…', on: function (v) { cnt.textContent = (v || '').length + ' / 140'; } })),
        fld('Description complète', tIn(p, 'description', ch, { area: true, rows: 5, ph: 'Présente le projet : univers, but, public…' })),
        fld('Petite ligne d’état (tableau d’avancement)', tIn(p, 'statusNote', ch, { ph: 'Ex. Bêta fermée en cours' }))
      ];
    });

    var avSec = sec('av', 'Avancement', 'chart', function () {
      var has = typeof p.progress === 'number', out = [];
      out.push(sw('Afficher une barre d’avancement', has, function (v) { if (v) p.progress = p.progress || 10; else delete p.progress; ch(); avSec._fill(); }));
      if (has) {
        var val = h('b', p.progress + ' %'), r = h('input.in', { type: 'range', min: '0', max: '100', value: String(p.progress), style: '--v:' + p.progress + '%', 'aria-label': 'Avancement' });
        r.addEventListener('input', function () { p.progress = +r.value; val.textContent = r.value + ' %'; r.style.setProperty('--v', r.value + '%'); ch(); });
        out.push(fld(h('span', 'Avancement global ', val), r));
        out.push(fld('Note sous la barre', tIn(p, 'progressNote', ch, { ph: 'Ex. 32 étapes sur 115 terminées' })));
      }
      out.push(fld('Message si le projet est en pause', tIn(p, 'pauseNote', ch, { area: true, rows: 2, ph: 'Ce projet est en pause. Il reviendra plus tard.' })));
      return out;
    });

    sec('feat', 'Fonctionnalités', 'star', function () {
      p.features = p.features || [];
      return listEd(p.features, function (f) {
        var items = h('textarea.in', { rows: 3, placeholder: 'Un point par ligne' }); items.value = (f.items || []).join('\n');
        items.addEventListener('input', function () { var a = items.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); if (a.length) f.items = a; else delete f.items; ch(); });
        return h('div.fgrid', { style: 'gap:.6rem' }, tIn(f, 'title', ch, { ph: 'Titre de la fonctionnalité' }), tIn(f, 'text', ch, { area: true, rows: 2, ph: 'Description courte' }), items);
      }, function () { return { title: '' }; }, ch, 'Ajouter une fonctionnalité');
    });

    sec('facts', 'Chiffres clés', 'list', function () {
      p.facts = p.facts || [];
      return [h('p.hint', 'Les 4 cases affichées sous le titre de la page projet.'), listEd(p.facts, function (f) {
        return h('div.frow', tIn(f, 'label', ch, { ph: 'Ex. Joueurs' }), tIn(f, 'value', ch, { ph: 'Ex. 100+' }));
      }, function () { return { label: '', value: '' }; }, ch, 'Ajouter un chiffre')];
    });

    sec('road', 'Feuille de route', 'flag', function () {
      p.roadmap = p.roadmap || [];
      return listEd(p.roadmap, function (r) {
        var st = h('select.in'); [['termine', 'Terminé'], ['en-cours', 'En cours'], ['a-venir', 'À venir'], ['pause', 'En pause']].forEach(function (o) { st.appendChild(h('option', { value: o[0], selected: r.status === o[0] }, o[1])); });
        st.addEventListener('change', function () { r.status = st.value; ch(); });
        return h('div.fgrid', { style: 'gap:.6rem' }, tIn(r, 'name', ch, { ph: 'Étape' }), h('div.frow', st, tIn(r, 'progress', ch, { type: 'number', num: true, min: 0, maxv: 100, ph: '% (optionnel)' })));
      }, function () { return { name: '', status: 'a-venir' }; }, ch, 'Ajouter une étape');
    });

    var mSec = sec('media', 'Galerie & vidéos', 'image', function () {
      p.gallery = p.gallery || [];
      var grid = h('div.mg2');
      function drawG() {
        grid.innerHTML = '';
        p.gallery.forEach(function (g) {
          var cap = h('input', { placeholder: 'Légende…', value: g.alt || '', 'aria-label': 'Légende' });
          cap.addEventListener('input', function () { if (cap.value) g.alt = cap.value; else delete g.alt; ch(); });
          var flags = h('div.flags');
          [['example', 'Exemple'], ['icon', 'Icône'], ['tall', 'Haute']].forEach(function (f) {
            var b = h('button' + (g[f[0]] ? '.on' : ''), { type: 'button', title: f[0] === 'example' ? 'Marquée « Exemple » sur le site' : f[0] === 'icon' ? 'Affichée en entier (objets, icônes)' : 'Format portrait', onclick: function () { if (g[f[0]]) delete g[f[0]]; else g[f[0]] = true; b.classList.toggle('on'); it.classList.toggle('icon', !!g.icon); ch(); } }, f[1]);
            flags.appendChild(b);
          });
          var it = h('div.mi' + (g.icon ? '.icon' : ''), h('div.im', NX.img(resolve(g.src), g.alt || '')),
            h('div.mbar', ibtn('image', 'Utiliser en bannière', function () { p.banner = g.src; ch(); visSec._fill(); toast('Bannière mise à jour', 'ok'); }),
              ibtn('sparkle', 'Utiliser comme logo', function () { p.logo = g.src; delete p.holo; ch(); visSec._fill(); toast('Logo mis à jour', 'ok'); }),
              ibtn('trash', 'Retirer', function () { p.gallery.splice(p.gallery.indexOf(g), 1); ch(); var a = it.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.85)' }], { duration: 220 }); a.onfinish = drawG; })),
            cap, flags);
          it._g = g; grid.appendChild(it);
        });
      }
      drawG();
      sortable(grid, { items: '.mi', grid: true, scroller: '.ed-f', onEnd: function () { p.gallery = [].map.call(grid.children, function (x) { return x._g; }); ch(); } });
      var dz = h('div.dz', { role: 'button', tabindex: '0' }, ico('upload'), h('b', 'Dépose plusieurs images d’un coup'), h('small', 'ou clique · compressées automatiquement · réordonne en glissant'));
      function addMany(fs) {
        dz.classList.add('busy');
        fs.reduce(function (pr, f) { return pr.then(function () { return imgFile(f, 1600).then(function (url) { p.gallery.push({ src: addFile(url), alt: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') }); }).catch(function (e) { toast(f.name + ' : ' + e.message, 'err'); }); }); }, Promise.resolve())
          .then(function () { dz.classList.remove('busy'); ch(); drawG(); toast(fs.length + ' image' + (fs.length > 1 ? 's' : '') + ' ajoutée' + (fs.length > 1 ? 's' : ''), 'ok'); });
      }
      dz.addEventListener('click', function () { pickFiles(true).then(function (fs) { if (fs.length) addMany(fs); }); });
      dz.addEventListener('keydown', function (e) { if (e.key === 'Enter') dz.click(); });
      dropTarget(dz, addMany);
      p.videos = p.videos || [];
      return [
        fld('Titre de la galerie', tIn(p, 'galleryTitle', ch, { ph: 'Galerie' })),
        dz, grid,
        h('div.f', h('label', 'Vidéos'), h('small.hint', 'Mets la vidéo dans le dépôt (ex. assets/projects/' + p.id + '/video.mp4) puis indique son chemin ici.'),
          listEd(p.videos, function (v) {
            return h('div.fgrid', { style: 'gap:.6rem' }, tIn(v, 'title', ch, { ph: 'Titre' }), h('div.frow', tIn(v, 'src', ch, { ph: 'Chemin de la vidéo (.mp4)' }), tIn(v, 'poster', ch, { ph: 'Image d’attente (optionnel)' })),
              sw('Format vertical (9:16)', v.vertical, function (b) { if (b) v.vertical = true; else delete v.vertical; ch(); }));
          }, function () { return { title: '', src: '' }; }, ch, 'Ajouter une vidéo'))
      ];
    });
    void mSec;

    sec('boss', 'Boss & personnages', 'skull', function () {
      p.bosses = p.bosses || [];
      return [
        h('div.frow', fld('Titre de la section', tIn(p, 'bossesTitle', ch, { ph: 'Les boss' })), fld('Introduction', tIn(p, 'bossesIntro', ch, { ph: 'Optionnel' }))),
        listEd(p.bosses, function (b) {
          var df = h('div.diff', { role: 'group', 'aria-label': 'Difficulté' });
          function drawD() { df.innerHTML = ''; for (var i = 1; i <= 5; i++) (function (i) { df.appendChild(h('button' + (i <= (b.difficulty || 0) ? '.on' : ''), { type: 'button', 'aria-label': 'Difficulté ' + i, onclick: function () { b.difficulty = i; ch(); drawD(); } })); })(i); }
          drawD();
          return h('div.fgrid', { style: 'gap:.6rem' }, h('div.frow', tIn(b, 'name', ch, { ph: 'Nom' }), tIn(b, 'title', ch, { ph: 'Sous-titre' })),
            tIn(b, 'description', ch, { area: true, rows: 2, ph: 'Description' }),
            h('div.frow', fld('Difficulté', df), fld('Rang (lettre)', tIn(b, 'rank', ch, { ph: 'S', max: 3 }))),
            imgField(b, 'image', { ch: ch, max: 1200, empty: 'Image du boss', path: false }));
        }, function () { return { name: '', difficulty: 3 }; }, ch, 'Ajouter un boss')
      ];
    });

    sec('more', 'Liens & infos', 'link', function () {
      var rel = h('div.pick');
      site().projects.forEach(function (q) {
        if (q.id === p.id) return;
        var on = (p.related || []).indexOf(q.id) > -1;
        var b = h('button' + (on ? '.on' : ''), { type: 'button', style: '--c:' + (q.accent || '#888'), onclick: function () {
          p.related = p.related || []; var i = p.related.indexOf(q.id); if (i > -1) p.related.splice(i, 1); else p.related.push(q.id); b.classList.toggle('on', i < 0); ch();
        } }, h('i'), q.name, q.hidden ? ' 🔒' : '');
        rel.appendChild(b);
      });
      return [fld('Projets liés (en bas de la page)', rel, 'Les projets privés ne sont pas montrés tant qu’ils restent privés.'),
        fld('Note de bas de page', tIn(p, 'note', ch, { area: true, rows: 2, ph: 'Ex. projet de fans, sans affiliation officielle…' })),
        fld('Encadré « accès réservé »', tIn(p, 'restricted', ch, { area: true, rows: 2, ph: 'Optionnel : texte d’un espace réservé (comme le Panel HG)' }))];
    });

    sec('zone', 'Zone sensible', 'alert', function () {
      var idIn = h('input.in', { value: p.id, disabled: !p.hidden, 'aria-label': 'Identifiant' });
      idIn.addEventListener('change', function () {
        var n = slug(idIn.value); if (!n || n === p.id) { idIn.value = p.id; return; }
        if (proj(n)) { toast('Cet identifiant existe déjà', 'err'); idIn.value = p.id; return; }
        var old = p.id; site().projects.forEach(function (q) { if (q.related) q.related = q.related.map(function (x) { return x === old ? n : x; }); });
        if (S.priv.notes[old]) { S.priv.notes[n] = S.priv.notes[old]; delete S.priv.notes[old]; }
        p.id = n; idIn.value = n; ch(); toast('Identifiant changé', 'ok');
      });
      return [fld('Identifiant (adresse de la page : #/projet/' + p.id + ')', idIn, p.hidden ? 'Modifiable tant que le projet est privé.' : 'Bloqué pour un projet public (sinon les liens partagés casseraient).'),
        h('div.row-btns', h('button.btn', { type: 'button', onclick: function () { duplicate(p); closeEditor(); } }, ico('copy'), 'Dupliquer'),
          h('button.btn.danger', { type: 'button', onclick: function () { removeProject(p, function () { closeEditor(true); }); } }, ico('trash'), 'Supprimer le projet'))];
    }, 'danger');

    /* section active dans le menu */
    if ('IntersectionObserver' in W) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) $$('a', nav).forEach(function (a) { a.classList.toggle('on', a.dataset.s === e.target.id.slice(3)); }); }); }, { root: form, rootMargin: '-10% 0px -70% 0px' });
      $$('.ed-s', form).forEach(function (s) { io.observe(s); });
      E.io = io;
    }
    wrap.addEventListener('pointerdown', function (e) { if (e.target === wrap) closeEditor(); });
    d.body.appendChild(wrap);
    d.body.style.overflow = 'hidden';
    if (isNew) setTimeout(function () { var n = $('#es-id input', form); if (n) { n.focus(); n.select(); } }, 350);
  }
  /* visibilité : public / confidentiel (teaser publié) / privé (jamais publié) */
  function visMode(p) { return p.hidden ? 'priv' : p.secret ? 'secret' : 'pub'; }
  function visField(p, ch) {
    var box = h('div.f'), extra = h('div');
    function drawExtra() {
      extra.innerHTML = '';
      var m = visMode(p);
      if (m === 'priv') extra.appendChild(h('small.hint', '🔒 Reste dans le coffre chiffré : seuls MRkevin et Junior le voient. Rien n’est envoyé sur le site.'));
      else if (m === 'pub') extra.appendChild(h('small.hint', '🌐 Visible par tout le monde après « Publier ».'));
      else {
        var cn = tIn(p, 'codename', ch, { ph: 'Ex. Projet Ω, Opération K…', max: 40 });
        extra.appendChild(h('div.vis-box',
          h('small.hint', '👁 Publié sur le site, mais en ', h('b', 'mode teaser'), ' : affiche floutée avec un tampon « Confidentiel ». Le public ne voit que le nom (ou le nom de code), l’accroche, la description, le statut et l’avancement. Fonctionnalités, galerie, boss, feuille de route et vidéos restent privés.'),
          h('div.frow', fld('Nom de code (optionnel)', cn, 'Si rempli, le vrai nom n’apparaît nulle part sur le site.'),
            fld('Message du teaser', tIn(p, 'secretNote', ch, { ph: 'On travaille dessus en secret… plus d’infos bientôt !', max: 200 }))),
          sw('Cacher aussi le logo et la bannière (logo « ? » à la place)', p.secretHide, function (v) { if (v) p.secretHide = true; else delete p.secretHide; ch(); })));
      }
    }
    box.appendChild(h('label', 'Visibilité'));
    box.appendChild(pick([{ v: 'pub', l: 'Public', icon: 'globe' }, { v: 'secret', l: 'Confidentiel — teaser publié', icon: 'eyeoff' }, { v: 'priv', l: 'Privé — jamais publié', icon: 'lock' }], visMode(p), function (v) {
      delete p.hidden; delete p.secret;
      if (v === 'priv') p.hidden = true; else if (v === 'secret') p.secret = true;
      ch(); drawExtra();
    }));
    box.appendChild(extra); drawExtra();
    return box;
  }
  function miniHero(p) {
    var hero = h('header.phero'); NX.paint(hero, p);
    if (p.banner) hero.appendChild(NX.img(resolve(p.banner), '', 'ph-ban' + (p.bannerIsCapture ? ' shot' : '')));
    var L = h('div', h('span.back', '← Tous les projets'));
    var bd = h('div.ph-badges', NX.stateBadge(p)); if (p.secret) bd.appendChild(NX.secretBadge()); if (p.tag) bd.appendChild(h('span.badge-solid', p.tag)); if (p.version) bd.appendChild(h('span.badge-solid', 'Version ' + p.version));
    L.appendChild(bd); L.appendChild(h('h1', p.name || 'Sans nom'));
    if (p.description) L.appendChild(h('p.lead', p.description.length > 260 ? p.description.slice(0, 260) + '…' : p.description));
    L.appendChild(NX.byLine(p, teamMap(), resolve));
    hero.appendChild(h('div.wrap', L, NX.art(p, 'ph-art', resolve)));
    return h('div.mh', h('div.mh-in', hero));
  }
  function closeEditor(instant) {
    if (!E) return;
    var w = E.wrap; E.io && E.io.disconnect(); E = null;
    d.body.style.overflow = ''; resumeBg();
    if (instant || RED) w.remove(); else { w.classList.add('out'); setTimeout(function () { w.remove(); }, 340); }
    render();
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && E && !MODALS && !D) closeEditor(); });

  /* =========================================================
     VUE : IDÉES (privées, jamais publiées)
     ========================================================= */
  var ICOLS = [
    { id: 'brut', name: 'Idées en vrac', icon: 'bulb' },
    { id: 'etude', name: 'À creuser', icon: 'search' },
    { id: 'pret', name: 'Prêt à lancer', icon: 'rocket' },
    { id: 'archive', name: 'Mises de côté', icon: 'lock' }
  ];
  function vIdeas(el) {
    var search = h('input', { type: 'search', placeholder: 'Rechercher une idée…', value: S.iq, 'aria-label': 'Rechercher une idée' });
    search.addEventListener('input', debounce(function () { S.iq = search.value; drawB(); }, 120));
    el.appendChild(ap(head('Boîte à idées', 'Les projets qu’on pourrait lancer plus tard. Glisse les cartes d’une colonne à l’autre, vote avec 🔥, et transforme une idée en projet privé quand elle est mûre.',
      h('label.s-search', ico('search'), search), 'Privé · jamais publié sur le site'), 0));
    var box = h('div'); el.appendChild(box);
    function drawB() {
      box.innerHTML = '';
      var q = S.iq.trim().toLowerCase(), board = h('div.ideas');
      ICOLS.forEach(function (c, ci) {
        var L = S.priv.ideas.filter(function (i) { return (i.col || 'brut') === c.id && (!q || [i.title, i.text, (i.tags || []).join(' ')].join(' ').toLowerCase().indexOf(q) > -1); });
        var col = h('div.icol.' + c.id), drop = h('div.idrop', { data: { col: c.id } });
        col.appendChild(h('h3', ico(c.icon), c.name, h('b', String(L.length))));
        if (c.id !== 'archive') {
          var qi = h('input', { placeholder: c.id === 'brut' ? 'Une idée ? Écris-la ici…' : 'Ajouter ici…', 'aria-label': 'Nouvelle idée dans ' + c.name, maxlength: 90 });
          var addI = function () {
            var t = qi.value.trim(); if (!t) return;
            var it = { id: uid(), title: t, text: '', tags: [], color: SWATCH[Math.floor(Math.random() * SWATCH.length)], col: c.id, by: S.user, at: Date.now(), _u: Date.now(), fire: {} };
            S.priv.ideas.unshift(it); log('a noté une idée : « ' + t + ' »'); touch(); qi.value = '';
            var card = ideaCard(it), hint = drop.querySelector('p.hint'); if (hint) hint.remove();
            drop.insertBefore(card, drop.firstChild);
            if (!RED) card.animate([{ opacity: 0, transform: 'translateY(-14px) scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,1.3,.4,1)' });
            col.querySelector('h3 b').textContent = String(+col.querySelector('h3 b').textContent + 1);
          };
          qi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addI(); } });
          col.appendChild(h('div.qadd', qi, h('button', { type: 'button', 'aria-label': 'Ajouter', onclick: addI }, ico('plus'))));
        }
        L.forEach(function (i) { drop.appendChild(ideaCard(i)); });
        if (!L.length) drop.appendChild(h('p.hint', { style: 'text-align:center;padding:1.4rem .5rem;color:var(--muted);font-size:.85rem', data: { nodrag: '1' } }, c.id === 'archive' ? 'Glisse ici les idées abandonnées.' : 'Dépose une idée ici'));
        col.appendChild(drop); board.appendChild(ap(col, ci + 1));
        sortable(drop, { items: '.idea', group: 'ideas', onEnd: function (ev) {
          var it = S.priv.ideas.find(function (x) { return x.id === ev.item.dataset.id; }), nb = neighbours(ev.item, '.idea');
          moveRel(S.priv.ideas, it.id, nb.prev, nb.next);
          var nc = ev.to.dataset.col;
          if (it.col !== nc) { it.col = nc; log('a déplacé l’idée « ' + it.title + ' » dans « ' + ICOLS.find(function (x) { return x.id === nc; }).name + ' »'); if (nc === 'pret') burstSmall(ev.item); }
          it._u = Date.now(); touch(); drawB();
        } });
      });
      box.appendChild(board);
    }
    drawB();
  }
  function burstSmall(el) {
    if (RED) return; var r = el.getBoundingClientRect();
    for (var i = 0; i < 14; i++) {
      var s = h('i', { style: 'position:fixed;z-index:400;pointer-events:none;width:7px;height:7px;border-radius:50%;background:' + ['#22d97f', '#fff', '#c7c7d1'][i % 3] + ';left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + 20) + 'px' });
      d.body.appendChild(s);
      var a = Math.random() * 6.283, v = 40 + Math.random() * 70;
      s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * v + 'px,' + (Math.sin(a) * v - 30) + 'px) scale(.2)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = (function (x) { return function () { x.remove(); }; })(s);
    }
  }
  function ideaCard(i) {
    var fires = Object.keys(i.fire || {}).filter(function (k) { return i.fire[k]; }), mine = !!(i.fire && i.fire[S.user]);
    var card = h('div.idea', { data: { id: i.id }, style: '--ic:' + (i.color || '#c7c7d1'), role: 'button', tabindex: '0', onclick: function () { editIdea(i); }, onkeydown: function (e) { if (e.key === 'Enter') editIdea(i); } });
    if (i.image) card.appendChild(h('div.thumb', NX.img(resolve(i.image), '')));
    card.appendChild(h('h4', i.title));
    if (i.text) card.appendChild(h('p', i.text));
    if (i.tags && i.tags.length) card.appendChild(h('div.tags', i.tags.map(function (t) { return h('span.tagp', '#' + t); })));
    if (i.project && proj(i.project)) card.appendChild(h('span.linked', ico('check'), 'Devenu le projet « ' + proj(i.project).name + ' »'));
    var fb = h('button.fire' + (mine ? '.on' : ''), { type: 'button', title: mine ? 'Retirer mon 🔥' : 'J’adore cette idée', onclick: function (e) {
      e.stopPropagation(); i.fire = i.fire || {}; i.fire[S.user] = !i.fire[S.user]; i._u = Date.now(); touch();
      var n = Object.keys(i.fire).filter(function (k) { return i.fire[k]; }).length; fb.classList.toggle('on', !!i.fire[S.user]); fb.lastChild.textContent = String(n);
      if (i.fire[S.user] && !RED) fb.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.4) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(.2,1.6,.4,1)' });
    } }, ico('fire'), h('span', String(fires.length)));
    card.appendChild(h('div.meta', NX.img(avatar(i.by), ''), h('small', member(i.by).name + ' · ' + ago(i.at)), fb));
    return card;
  }
  function editIdea(i) {
    function ch() { i._u = Date.now(); touch(); }
    var tags = h('input.in', { value: (i.tags || []).join(', '), placeholder: 'rp, gmod, bot…' });
    tags.addEventListener('input', function () { i.tags = tags.value.split(',').map(function (t) { return t.trim().replace(/^#/, ''); }).filter(Boolean); ch(); });
    var sws = h('div.swatches');
    SWATCH.forEach(function (c) { var b = h('button' + (c === i.color ? '.on' : ''), { type: 'button', style: '--c:' + c, 'aria-label': 'Couleur ' + c, onclick: function () { i.color = c; $$('button', sws).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); ch(); } }); sws.appendChild(b); });
    var body = h('div.fgrid', { style: 'margin-top:1rem' },
      fld('Titre', tIn(i, 'title', ch, { max: 90 })),
      fld('Détails', tIn(i, 'text', ch, { area: true, rows: 5, ph: 'Le concept, pourquoi c’est cool, ce qu’il faudrait…' })),
      h('div.frow', fld('Mots-clés (séparés par des virgules)', tags), fld('Couleur', sws)),
      fld('Colonne', pick(ICOLS.map(function (c) { return { v: c.id, l: c.name, icon: c.icon }; }), i.col || 'brut', function (v) { i.col = v; ch(); })),
      imgField(i, 'image', { label: 'Image d’inspiration (optionnel)', ch: ch, max: 1200, path: false }),
      h('p.hint', 'Proposée par ' + member(i.by).name + ' · ' + ago(i.at) + ' · 🔒 visible seulement par MRkevin et Junior'));
    modal({ title: 'Idée', body: body, wide: true, onClose: function () { if (!i.title || !i.title.trim()) i.title = 'Idée sans titre'; if (S.view === 'idees' || S.view === 'qg') render(); }, actions: [
      { label: 'Supprimer', icon: 'trash', cls: 'danger', fn: function (c) { ask('Supprimer cette idée ?', '« ' + i.title + ' » sera supprimée.', 'Supprimer', true).then(function (ok) { if (!ok) return; var k = S.priv.ideas.indexOf(i); S.priv.ideas.splice(k, 1); S.priv.tomb[i.id] = Date.now(); touch(); c(); toast('Idée supprimée', 'warn', { ms: 6000, action: { label: 'Annuler', fn: function () { delete S.priv.tomb[i.id]; i._u = Date.now(); S.priv.ideas.splice(k, 0, i); touch(); render(); } } }); }); } },
      { label: i.project && proj(i.project) ? 'Ouvrir le projet' : 'Lancer en projet privé', icon: 'rocket', cls: 'main', fn: function (c) {
        if (i.project && proj(i.project)) { c(); go('projets'); openEditor(i.project); return; }
        var p = blankProject(i.title || 'Nouveau projet');
        p.name = i.title || 'Nouveau projet'; p.description = i.text || ''; p.short = (i.text || '').split(/[.!?\n]/)[0].slice(0, 140);
        if (hexOk(i.color)) { p.accent = i.color; p.bg = bgPresets(i.color)[0][1]; }
        if (i.image) { p.banner = i.image; p.gallery = [{ src: i.image, alt: i.title }]; }
        site().projects.unshift(p); i.project = p.id; i.col = 'pret'; i._u = Date.now();
        log('a lancé l’idée « ' + i.title + ' » en projet privé'); touch(); c(); burst(); go('projets'); openEditor(p.id);
      } }
    ] });
  }

  /* =========================================================
     VUE : DISCUSSIONS
     ========================================================= */
  function seen() { try { return JSON.parse(localStorage.getItem('nxs-seen-' + S.user) || '{}'); } catch (e) { return {}; } }
  function markSeen(ch) { var s = seen(); s[ch] = Date.now(); try { localStorage.setItem('nxs-seen-' + S.user, JSON.stringify(s)); } catch (e) {} }
  function unread(ch) { var t = seen()[ch] || 0; return (S.priv.notes[ch] || []).filter(function (m) { return m.by !== S.user && m.at > t; }).length; }
  function unreadTotal() { return Object.keys(S.priv.notes).reduce(function (a, ch) { return a + unread(ch); }, 0); }
  function vNotes(el) {
    var other = S.user === 'kevin' ? 'Junior' : 'MRkevin';
    el.appendChild(ap(head('Discussions', 'Notes et échanges entre MRkevin et Junior, par projet. ' + (token() ? 'Les messages partent tout seuls vers ' + other + ' (sauvegarde auto).' : 'Connecte GitHub dans Réglages pour que ' + other + ' reçoive tes messages.'), null, 'Privé · chiffré'), 0));
    var chs = [{ id: 'general', name: 'Général', sub: 'Tout ce qui concerne NEXORIA' }].concat(site().projects.map(function (p) { return { id: p.id, name: p.name, p: p, sub: p.hidden ? 'Projet privé' : NX.STATE[p.state].label }; }));
    if (!chs.some(function (c) { return c.id === S.noteCh; })) S.noteCh = 'general';
    var list = h('div.nlist'), thread = h('div.thread'), box = h('div.notes', list, thread);
    chs.forEach(function (c, i) {
      if (i === 1) list.appendChild(h('div.lab', 'Projets'));
      var n = unread(c.id), msgs = S.priv.notes[c.id] || [], last = msgs[msgs.length - 1];
      var ic = c.p ? NX.icon(c.p, resolve) : h('span.r-ico', ico('chat'));
      var b = h('button.nitem' + (c.id === S.noteCh ? '.on' : ''), { type: 'button', onclick: function () { S.noteCh = c.id; render(); } }, ic,
        h('span.t', h('b', c.name), h('small', last ? (member(last.by).name + ' : ' + last.text) : c.sub)), n ? h('span.n', String(n)) : null);
      if (c.p) NX.paint(b, c.p);
      list.appendChild(b);
    });
    var cur = chs.find(function (c) { return c.id === S.noteCh; });
    var th = h('div.th-h', cur.p ? NX.icon(cur.p, resolve) : h('span.r-ico', { style: 'width:40px;height:40px;border-radius:12px;display:grid;place-items:center;border:1px solid var(--line)' }, ico('chat')), h('div', h('h3', cur.name), h('small', cur.sub)));
    if (cur.p) { NX.paint(th, cur.p); th.appendChild(h('button.btn.sm', { type: 'button', style: 'margin-left:auto', onclick: function () { openEditor(cur.id); } }, ico('edit'), 'Ouvrir le projet')); }
    var msgs = h('div.msgs', { role: 'log', 'aria-live': 'polite' });
    function drawMsgs() {
      msgs.innerHTML = '';
      var L = S.priv.notes[S.noteCh] || [], lastDay = '';
      if (!L.length) msgs.appendChild(h('div.empty', NX.logoEl({ name: 'N', monogram: cur.p ? NX.initials(cur.p) : 'N', accent: cur.p ? cur.p.accent : '#c7c7d1' }), h('b', 'Pas encore de message'), h('span', 'Écris la première note pour ' + other + '.')));
      L.forEach(function (m) {
        var dl = dayLabel(m.at); if (dl !== lastDay) { msgs.appendChild(h('div.day', dl)); lastDay = dl; }
        var me = m.by === S.user;
        var bub = h('div.bub', h('p', m.text), h('small', (me ? 'Toi' : member(m.by).name) + ' · ' + hhmm(m.at)));
        if (me) bub.appendChild(h('button.x', { type: 'button', 'aria-label': 'Supprimer le message', onclick: function () { var arr = S.priv.notes[S.noteCh]; arr.splice(arr.indexOf(m), 1); S.priv.tomb[m.id] = Date.now(); touch(); drawMsgs(); } }, ico('x')));
        msgs.appendChild(h('div.msg' + (me ? '.me' : ''), NX.img(avatar(m.by), ''), bub));
      });
      requestAnimationFrame(function () { msgs.scrollTop = msgs.scrollHeight; });
    }
    drawMsgs(); markSeen(S.noteCh);
    var ta = h('textarea', { rows: 1, placeholder: 'Écrire à ' + other + '… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)', 'aria-label': 'Message' });
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'; }
    function send() {
      var t = ta.value.trim(); if (!t) return;
      (S.priv.notes[S.noteCh] = S.priv.notes[S.noteCh] || []).push({ id: uid(), by: S.user, at: Date.now(), text: t, _u: Date.now() });
      ta.value = ''; grow(); touch(); drawMsgs(); markSeen(S.noteCh);
    }
    ta.addEventListener('input', grow);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    append(thread, [th, msgs, h('div.composer', ta, h('button.btn.main', { type: 'button', onclick: send, 'aria-label': 'Envoyer' }, ico('send'), h('span.lbl', 'Envoyer')))]);
    el.appendChild(ap(box, 1));
    setTimeout(function () { if (FINE) ta.focus(); }, 300);
  }

  /* =========================================================
     VUE : ÉQUIPE & SITE
     ========================================================= */
  function vTeam(el) {
    el.appendChild(ap(head('Équipe', 'Les profils affichés dans « La direction de NEXORIA » et sur les affiches. Mets ta photo Discord pour qu’elle apparaisse partout.',
      h('button.btn', { type: 'button', onclick: function () {
        var id = 'membre-' + uid().slice(-5); site().team.push({ id: id, name: 'Nouveau membre', role: 'Équipe', bio: '', photo: 'assets/img/favicon.png', _u: Date.now() });
        site()._cu = Date.now(); log('a ajouté un membre à l’équipe'); touch(); render();
      } }, ico('plus'), 'Ajouter un membre')), 0));
    var grid = h('div.teamed');
    site().team.forEach(function (t, i) {
      function ch() { t._u = Date.now(); touch(); }
      var av = h('button.av-up', { type: 'button', title: 'Changer la photo' }, h('div.ring', NX.img(resolve(t.photo), '')), h('span.ov', ico('upload'), 'Changer'));
      function setPhoto(f) { if (!f) return; imgFile(f, 400, true).then(function (url) { t.photo = addFile(url); ch(); render(); toast('Photo mise à jour — publie pour l’afficher sur le site.', 'ok'); }).catch(function (e) { toast(e.message, 'err'); }); }
      av.addEventListener('click', function () { pickFiles(false).then(function (fs) { setPhoto(fs[0]); }); });
      dropTarget(av, function (fs) { setPhoto(fs[0]); });
      var card = h('div.panel.tcard', av, h('div.fgrid',
        h('div.frow', fld('Pseudo', tIn(t, 'name', ch, { max: 30 })), fld('Alias', tIn(t, 'alias', ch, { max: 40, ph: 'Optionnel' }))),
        fld('Rôle', tIn(t, 'role', ch, { max: 30 })),
        fld('Présentation', tIn(t, 'bio', ch, { area: true, rows: 3 })),
        h('small.hint', t.id === S.user ? '💡 Astuce : sur Discord, clic droit sur ta photo → « Copier l’image » ou télécharge-la, puis dépose-la sur le cercle.' : 'Profil de ' + t.name + '.'),
        USERS[t.id] ? null : h('button.btn.sm.danger', { type: 'button', style: 'justify-self:start', onclick: function () {
          ask('Retirer ' + t.name + ' ?', 'Il disparaîtra de l’équipe et des affiches des projets.', 'Retirer', true).then(function (ok) {
            if (!ok) return; var tm = site().team; tm.splice(tm.indexOf(t), 1);
            site().projects.forEach(function (p) { if (p.authors) p.authors = p.authors.filter(function (a) { return a !== t.id; }); });
            S.priv.tomb[t.id] = Date.now(); touch(); render();
          });
        } }, ico('trash'), 'Retirer de l’équipe')));
      grid.appendChild(ap(card, i + 1));
    });
    el.appendChild(grid);
  }
  function catsPanel() {
    var cats = site().categories;
    function cch() { site()._cu = Date.now(); touch(); }
    var cp = h('div.panel.cats', h('h3', ico('grid'), 'Catégories de projets'),
      h('p.hint', { style: 'margin:0' }, 'Elles servent de filtres sur l’accueil. Glisse pour réordonner.'));
    var box = h('div.le');
    function drawC() {
      box.innerHTML = '';
      cats.forEach(function (c) {
        var used = site().projects.filter(function (p) { return p.category === c.id; }).length;
        var r = h('div.le-row', h('button.grip', { type: 'button', 'aria-label': 'Déplacer' }, ico('grip')), tIn(c, 'name', cch, { max: 40 }), h('span.cnt', used + ' projet' + (used > 1 ? 's' : '')),
          h('button.le-del', { type: 'button', title: used ? 'Utilisée par des projets' : 'Supprimer', disabled: !!used, onclick: function () { cats.splice(cats.indexOf(c), 1); cch(); drawC(); } }, ico('trash')));
        r._c = c; box.appendChild(r);
      });
    }
    drawC();
    sortable(box, { items: '.le-row', handle: '.grip', onEnd: function () { var o = [].map.call(box.children, function (r) { return r._c; }); cats.length = 0; [].push.apply(cats, o); cch(); } });
    cp.appendChild(box);
    cp.appendChild(h('button.btn.sm', { type: 'button', style: 'justify-self:start', onclick: function () { var id = slug('categorie'), k = 2; while (cats.some(function (c) { return c.id === id; })) id = 'categorie-' + k++; cats.push({ id: id, name: 'Nouvelle catégorie' }); cch(); drawC(); var l = box.lastElementChild.querySelector('input'); l.focus(); l.select(); } }, ico('plus'), 'Ajouter une catégorie'));
    return cp;
  }

  /* =========================================================
     VUE : SITE (textes de l'accueil, sections, vision, FAQ, contact)
     ========================================================= */
  var SEC_NAMES = { projets: 'Projets', vision: 'Vision', direction: 'Direction', avancement: 'Avancement', galerie: 'Galerie', faq: 'FAQ', contact: 'Contact' };
  var DEFAULT_SITE = {
    hero: { kicker: 'Structure indépendante · Fondateur MRkevin · Cofondateur Junior', title: 'NEXORIA', slogan: 'Plusieurs projets. Plusieurs univers. Une seule vision.', lead: 'Un écosystème qui réunit des serveurs de jeu, des applications, des bots Discord et des outils — fondé par **MRkevin**, cofondé par **Junior**.', btn1: 'Explorer les projets', btn2: 'Découvrir NEXORIA', btn3: 'Rejoindre le Discord' },
    sections: [
      { id: 'projets', title: 'Nos projets', lead: 'Chaque projet a sa propre identité, sa couleur et son univers. Clique sur une affiche pour tout voir : vidéos, images, boss, avancement.' },
      { id: 'vision', title: 'Notre vision', lead: 'NEXORIA développe des projets variés sous une marque commune, chacun avec son identité propre — et pousse chaque contenu à fond.' },
      { id: 'direction', title: 'La direction de NEXORIA', lead: 'NEXORIA a été fondée par MRkevin, à l’origine de la structure. Junior en est le cofondateur et participe à sa direction et à son développement.' },
      { id: 'avancement', title: 'Où en est chaque projet', lead: 'En développement, terminés ou en pause : l’état réel de tous les projets NEXORIA.' },
      { id: 'galerie', title: 'Galerie', lead: 'Vidéos, captures et illustrations des projets. Les images marquées « Exemple » montrent à quoi ressemble l’outil en attendant les vraies captures.' },
      { id: 'faq', title: 'Foire Aux Questions', lead: 'Tout ce que tu dois savoir sur la structure NEXORIA, nos serveurs de jeu, Nexus Studio et nos futurs projets.' },
      { id: 'contact', title: 'Rejoins la communauté', lead: 'Annonces, avant-premières, tests des projets et échanges avec l’équipe : tout se passe sur le Discord NEXORIA.' }
    ],
    vision: [
      { icon: '◆', title: 'Qui sommes-nous ?', text: 'Une structure indépendante qui rassemble des projets numériques, communautaires et créatifs, du serveur de jeu à l’application Windows.' },
      { icon: '◇', title: 'Notre organisation', text: 'Fondateur : MRkevin. Cofondateur : Junior. MRkevin développe la plupart des projets ; Junior a créé le Panel HG et travaille avec lui sur Black Clover RP et Solo Leveling RP.' },
      { icon: '✦', title: 'Nos domaines', text: 'Serveurs Garry’s Mod, applications Windows, bots Discord, sites web, outils de développement et interfaces RP.' }
    ],
    faq: [
      { cat: 'NEXORIA', q: 'Qu’est-ce que NEXORIA ?', a: 'Une structure indépendante qui rassemble des projets numériques et créatifs : serveurs Garry’s Mod, applications Windows, bots Discord, sites web et outils communautaires.' },
      { cat: 'NEXORIA', q: 'Qui a fondé et dirige NEXORIA ?', a: 'MRkevin est le fondateur de NEXORIA et pilote la majorité des développements techniques. Junior en est le cofondateur : il a développé le Panel HG et co-développe Black Clover RP et Solo Leveling RP.' },
      { cat: 'NEXORIA', q: 'Quelle est la philosophie de la structure ?', a: '« Plusieurs projets. Plusieurs univers. Une seule vision. » Chaque projet possède son identité visuelle et son univers propre, avec une exigence de finition et de performance poussée au maximum.' },
      { cat: 'Projets', q: 'Quels projets sont actuellement actifs ?', a: '', auto: true },
      { cat: 'Black Clover', q: 'Qu’est-ce que Black Clover RP ?', a: 'Le serveur roleplay Garry’s Mod phare de NEXORIA, pensé pour accueillir plus de 100 joueurs simultanés. Les joueurs incarnent des mages, reçoivent leur grimoire d’affinité, rejoignent une compagnie et affrontent 8 boss majeurs.' },
      { cat: 'Black Clover', q: 'Comment fonctionne le système de grimoires et de magie ?', a: 'Chaque joueur débloque des sorts uniques selon son affinité (Vent, Feu, Espace, Ténèbres...), progresse dans les rangs de sa compagnie et peut participer aux raids épiques de guildes.' },
      { cat: 'Serveurs', q: 'Pourquoi Solo Leveling RP est-il en pause ?', a: 'Solo Leveling RP a été le premier serveur fondateur de NEXORIA. Il est actuellement mis en pause avec ses acquis sécurisés afin que l’équipe concentre toutes ses forces sur Black Clover RP. Il sera réactivé ultérieurement.' },
      { cat: 'Nexus Studio', q: 'Qu’est-ce que Nexus Studio ?', a: 'Nexus Studio est le centre de pilotage privé de NEXORIA. Il permet à MRkevin et Junior de suivre l’état des projets en temps réel, échanger des notes de conception, gérer les images et déployer les mises à jour en un clic.' },
      { cat: 'Nexus Studio', q: 'Qui a accès à Nexus Studio ?', a: 'L’accès est strictement réservé au fondateur MRkevin et au cofondateur Junior, chacun avec son propre code d’accès. Les changements validés dans le Studio sont ensuite publiés pour toute la communauté.' },
      { cat: 'Académie', q: 'Qu’est-ce que l’Académie Nexoria ?', a: 'L’Académie Nexoria est une plateforme complète d’apprentissage dédiée à la création sur Source Engine : Mapping (Hammer & Blender), Programmation (GLua / Luau) et Effets visuels (VFX).' },
      { cat: 'Académie', q: 'Quand l’Académie Nexoria sera-t-elle disponible ?', a: 'Le projet est actuellement confidentiel et en cours d’élaboration par MRkevin et Junior. Un teaser interactif ainsi que le guide complet de mapping débutant sont déjà consultables en avant-première sur le site.' },
      { cat: 'Panel HG', q: 'À quoi sert le Panel HG ?', a: 'Développé par Junior, le Panel HG sert à coordonner les hauts gradés du serveur Black Clover : gestion des effectifs, compagnies, candidatures, combats d’arène, planning d’événements et promotions.' },
      { cat: 'Panel HG', q: 'Qui peut accéder au Panel HG ?', a: 'Seuls les hauts gradés autorisés : Grand Chevalier-Mage, Vice-Capitaine, Capitaine, Responsable serveur et Fondateurs. Les permissions sont directement contrôlées et chiffrées par le panel.' },
      { cat: 'Applications', q: 'Où télécharger Dino App et AddonForge ?', a: 'Dino App et AddonForge sont actuellement en phases de test restreint et d’optimisation. Les installateurs officiels vérifiés seront mis à disposition sur le Discord NEXORIA lors de leur sortie publique.' },
      { cat: 'Communauté', q: 'Comment rejoindre la communauté ou proposer son aide ?', a: 'Rejoins le Discord officiel NEXORIA grâce aux boutons présents sur la page. C’est le lieu d’échange central pour tester les projets en avant-première, voter les fonctionnalités et discuter avec MRkevin et Junior.' }
    ],
    footer: '**NEXORIA** — structure indépendante. Fondateur : MRkevin · Cofondateur : Junior.',
    discord: ''
  };
  function vSite(el) {
    var cfg = site().site ? site().site : clone(DEFAULT_SITE);
    /* complète une config partielle avec les valeurs d'origine */
    Object.keys(DEFAULT_SITE).forEach(function (k) { if (cfg[k] == null) cfg[k] = clone(DEFAULT_SITE[k]); });
    cfg.hero = Object.assign({}, DEFAULT_SITE.hero, cfg.hero);
    DEFAULT_SITE.sections.forEach(function (d0) { if (!cfg.sections.some(function (x) { return x.id === d0.id; })) cfg.sections.push(clone(d0)); });
    function sch() { site().site = cfg; site()._su = Date.now(); touch(); drawMini(); }

    el.appendChild(ap(head('Textes du site', 'Tout ce qui est écrit sur l’accueil : titre, slogan, sections (ordre, titres, affichées ou non), vision, FAQ, pied de page. Mets **du texte** entre deux étoiles doubles pour le mettre en gras.',
      h('div.row-btns', h('button.btn', { type: 'button', onclick: preview }, ico('eye'), 'Aperçu du site'),
        h('button.btn.ghost', { type: 'button', onclick: function () { ask('Remettre les textes d’origine ?', 'Tous les textes de l’accueil, la FAQ et l’ordre des sections reviennent à leur version de départ.', 'Remettre').then(function (ok) { if (!ok) return; delete site().site; site()._su = Date.now(); touch(); render(); toast('Textes d’origine remis', 'ok'); }); } }, ico('undo'), 'Textes d’origine'))), 0));

    var grid = h('div.site-grid');
    var mini = h('div.mini-hero');
    function drawMini() {
      mini.innerHTML = '';
      var H = cfg.hero, lead = h('p');
      String(H.lead || '').split(/\*\*(.+?)\*\*/).forEach(function (part, i) { lead.appendChild(i % 2 ? h('b', part) : d.createTextNode(part)); });
      append(mini, [NX.img('assets/img/nexoria-logo.png', ''), h('p.kicker', H.kicker), h('h1', H.title), h('p.sl', H.slogan), lead, h('div.btns', h('span.btn.main', H.btn1), h('span.btn', H.btn2), h('span.btn', H.btn3))]);
    }
    drawMini();
    var H = cfg.hero;
    grid.appendChild(ap(h('div.panel', h('h3', ico('home'), 'Haut de l’accueil'), mini,
      fld('Petite ligne au-dessus du titre', tIn(H, 'kicker', sch, { max: 120 })),
      h('div.frow', fld('Grand titre', tIn(H, 'title', sch, { max: 24 })), fld('Slogan', tIn(H, 'slogan', sch, { max: 120 }))),
      fld('Texte de présentation', tIn(H, 'lead', sch, { area: true, rows: 3 })),
      h('div.frow.three', fld('Bouton 1', tIn(H, 'btn1', sch, { max: 40 })), fld('Bouton 2', tIn(H, 'btn2', sch, { max: 40 })), fld('Bouton 3 (Discord)', tIn(H, 'btn3', sch, { max: 40 })))), 1));

    /* sections : ordre, titres, affichage */
    var secBox = h('div.le.secs');
    function drawSecs() {
      secBox.innerHTML = '';
      cfg.sections.forEach(function (x) {
        var r = h('div.le-row' + (x.hidden ? '.off' : ''), h('button.grip', { type: 'button', 'aria-label': 'Déplacer la section' }, ico('grip')),
          h('div.fgrid', { style: 'gap:.5rem' },
            h('div.sname', SEC_NAMES[x.id] || x.id, sw('Affichée', !x.hidden, function (v) { if (v) delete x.hidden; else x.hidden = true; r.classList.toggle('off', !v); sch(); })),
            tIn(x, 'title', sch, { ph: 'Titre', max: 80 }), tIn(x, 'lead', sch, { area: true, rows: 2, ph: 'Texte d’introduction' })), h('span'));
        r._x = x; secBox.appendChild(r);
      });
    }
    drawSecs();
    sortable(secBox, { items: '.le-row', handle: '.grip', onEnd: function () { cfg.sections = [].map.call(secBox.children, function (r) { return r._x; }); sch(); } });
    grid.appendChild(ap(h('div.panel', h('h3', ico('columns'), 'Sections de l’accueil'), h('p.hint', { style: 'margin:0' }, 'Glisse pour changer l’ordre sur la page. Décoche « Affichée » pour cacher une section (et son lien dans le menu).'), secBox), 2));

    grid.appendChild(ap(h('div.panel', h('h3', ico('sparkle'), 'Notre vision (encadrés)'),
      listEd(cfg.vision, function (v) { return h('div.fgrid', { style: 'gap:.5rem' }, h('div', { style: 'display:grid;grid-template-columns:70px 1fr;gap:.5rem' }, tIn(v, 'icon', sch, { ph: '◆', max: 3 }), tIn(v, 'title', sch, { ph: 'Titre' })), tIn(v, 'text', sch, { area: true, rows: 2, ph: 'Texte' })); },
        function () { return { icon: '✦', title: '', text: '' }; }, sch, 'Ajouter un encadré')), 3));

    grid.appendChild(ap(h('div.panel', h('h3', ico('chat'), 'Foire aux questions'),
      h('p.hint', { style: 'margin:0' }, 'La catégorie sert de filtre. « Réponse auto » affiche toute seule la liste des projets en cours / terminés / en pause.'),
      listEd(cfg.faq, function (q) {
        var a = tIn(q, 'a', sch, { area: true, rows: 3, ph: 'Réponse' }); a.disabled = !!q.auto;
        return h('div.fgrid', { style: 'gap:.5rem' }, h('div', { style: 'display:grid;grid-template-columns:150px 1fr;gap:.5rem' }, tIn(q, 'cat', sch, { ph: 'Catégorie', max: 30 }), tIn(q, 'q', sch, { ph: 'Question' })), a,
          sw('Réponse auto (liste des projets)', q.auto, function (v) { if (v) q.auto = true; else delete q.auto; a.disabled = v; sch(); }));
      }, function () { return { cat: 'NEXORIA', q: '', a: '' }; }, sch, 'Ajouter une question')), 4));

    grid.appendChild(ap(h('div.panel', h('h3', ico('link'), 'Contact & pied de page'),
      fld('Lien d’invitation Discord', tIn(cfg, 'discord', sch, { ph: CFG.discordInvite || 'https://discord.gg/…' }), 'Vide = lien par défaut (' + (CFG.discordInvite || 'aucun') + ').'),
      fld('Texte du pied de page', tIn(cfg, 'footer', sch, { max: 200 }))), 5));
    grid.appendChild(ap(catsPanel(), 6));
    el.appendChild(grid);
  }

  /* =========================================================
     VUE : RÉGLAGES
     ========================================================= */
  function vSettings(el) {
    el.appendChild(ap(head('Réglages', 'Ton code d’accès, la connexion GitHub pour publier, les sauvegardes et les effets.'), 0));
    var grid = h('div.set-grid');

    var cp = h('div.panel', h('h3', ico('key'), 'Mon code d’accès'),
      h('p', 'Ton code n’est écrit nulle part dans le site : c’est la clé qui déchiffre le coffre. Personne ne peut le retrouver, pas même en lisant le code source. Si tu le perds, ' + (S.user === 'kevin' ? 'Junior' : 'MRkevin') + ' peut toujours entrer avec le sien.'),
      S.keysChanged ? h('div.status-row.off', h('i'), 'Nouveau code enregistré ici — il sera actif partout après la prochaine sauvegarde.') : null,
      h('button.btn', { type: 'button', onclick: changeCode }, ico('refresh'), 'Changer mon code'));
    grid.appendChild(ap(cp, 1));

    var tok = token();
    var gp = h('div.panel', h('h3', ico('github'), 'Publication sur GitHub'),
      h('div.status-row' + (tok ? '.on' : '.off'), h('i'), tok ? 'Connecté à ' + REPO + ' — publication et sauvegarde actives.' : 'Pas connecté : tes changements restent sur cet appareil.'),
      tok ? h('div.fgrid',
        sw('Sauvegarde automatique (les idées et messages partent tout seuls)', S.priv.settings.auto !== false, function (v) { S.priv.settings.auto = v; S.priv.settings._u = Date.now(); touch(); }),
        h('div.row-btns', h('button.btn', { type: 'button', onclick: function () { testToken(tok).then(function (m) { toast(m, 'ok'); }, function (e) { toast(ghMsg(e), 'err', { ms: 6000 }); }); } }, ico('check'), 'Tester la connexion'),
          h('button.btn', { type: 'button', onclick: function () { askToken(); } }, ico('key'), 'Changer de jeton'),
          h('button.btn.danger', { type: 'button', onclick: function () { ask('Déconnecter GitHub ?', 'Le jeton sera retiré du coffre (pour toi et ' + (S.user === 'kevin' ? 'Junior' : 'MRkevin') + ').', 'Déconnecter', true).then(function (ok) { if (!ok) return; S.priv.settings.token = ''; S.priv.settings._u = Date.now(); touch(); render(); }); } }, 'Déconnecter')))
        : h('button.btn.main', { type: 'button', onclick: function () { askToken(); } }, ico('github'), 'Connecter GitHub'));
    grid.appendChild(ap(gp, 2));

    var bp = h('div.panel', h('h3', ico('download'), 'Sauvegardes & fichiers'),
      h('p', 'Télécharge les fichiers du site pour les envoyer à la main sur GitHub, ou garde une copie de secours du coffre (toujours chiffré).'),
      h('div.row-btns', h('button.btn', { type: 'button', onclick: function () { download('projects.json', JSON.stringify(publicSite(), null, 2) + '\n'); } }, ico('download'), 'projects.json'),
        h('button.btn', { type: 'button', onclick: function () { sealedEnv().then(function (env) { download('studio.vault.json', JSON.stringify(env, null, 1) + '\n'); }); } }, ico('lock'), 'Coffre chiffré'),
        h('button.btn', { type: 'button', onclick: preview }, ico('eye'), 'Aperçu du site')));
    grid.appendChild(ap(bp, 3));

    var ep = h('div.panel', h('h3', ico('sparkle'), 'Effets & appareil'),
      h('div.fgrid',
        sw('Animations et effets 3D', PREFS.anim !== false, function (v) { setPref('anim', v); }),
        sw('Curseur personnalisé', PREFS.cursor !== false, function (v) { setPref('cursor', v); }),
        sw('Mode performance (moins de particules)', !!PREFS.perf, function (v) { setPref('perf', v); }),
        h('small.hint', 'Mêmes réglages que sur le site. Rechargement nécessaire.'),
        h('div.row-btns', h('button.btn', { type: 'button', onclick: logout }, ico('logout'), 'Verrouiller le studio'),
          h('button.btn.danger', { type: 'button', onclick: function () { ask('Oublier cet appareil ?', 'Supprime la session et le brouillon local de cet appareil. Ce qui n’a pas été sauvegardé sur GitHub sera perdu.', 'Oublier', true).then(function (ok) { if (!ok) return; Promise.all([idb.del('work:' + S.user), idb.del('files:' + S.user)]).then(function () { clearSession(); location.reload(); }); }); } }, 'Oublier cet appareil'))));
    grid.appendChild(ap(ep, 4));
    el.appendChild(grid);
  }
  function setPref(k, v) { PREFS[k] = v; try { localStorage.setItem('nx-prefs', JSON.stringify(PREFS)); } catch (e) {} toast('Réglage enregistré — recharge la page pour l’appliquer.', 'info', { action: { label: 'Recharger', fn: function () { location.reload(); } } }); }
  function download(name, text) {
    var a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
    d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function sealedEnv() { return seal(S.key, S.priv).then(function (data) { return Object.assign({}, S.env, { rev: Date.now(), data: data }); }); }

  function changeCode() {
    var code = genCode(), big = h('div.bigcode', h('span', code)), ok = h('input', { type: 'checkbox' });
    var custom = h('input.in', { placeholder: 'Ou écris ton propre code (12 lettres/chiffres)', maxlength: 14, style: 'text-transform:uppercase;font-family:JetBrains Mono,monospace' });
    custom.addEventListener('input', function () { var n = normCode(custom.value); if (n.length === 12) { code = fmtCode(n); big.firstChild.textContent = code; } });
    var m = modal({ title: 'Changer mon code', body: h('div.fgrid', { style: 'margin-top:.8rem' },
      h('p', { style: 'color:var(--muted);margin:0' }, 'Voici ton nouveau code. Note-le dans un endroit sûr (gestionnaire de mots de passe, papier caché…). Il ne sera plus jamais affiché.'),
      big,
      h('div.row-btns', h('button.btn.sm', { type: 'button', onclick: function () { code = genCode(); big.firstChild.textContent = code; custom.value = ''; } }, ico('refresh'), 'Générer un autre'),
        h('button.btn.sm', { type: 'button', onclick: function () { navigator.clipboard && navigator.clipboard.writeText(code).then(function () { toast('Code copié', 'ok'); }); } }, ico('copy'), 'Copier')),
      custom,
      h('label.sw', ok, h('i'), 'Je l’ai bien noté')),
      actions: [{ label: 'Annuler', fn: function (c) { c(); } }, { label: 'Activer ce code', cls: 'main', fn: function (c) {
        if (!ok.checked) { toast('Coche « Je l’ai bien noté » d’abord', 'warn'); return; }
        var n = normCode(code); if (n.length !== 12) { toast('Le code doit faire 12 caractères', 'err'); return; }
        wrapKey(S.raw, n, S.env.kdf.iter).then(function (slot) {
          S.env.keys = Object.assign({}, S.env.keys); S.env.keys[S.user] = slot; S.keysChanged = true;
          log('a changé son code d’accès'); touch(); c(); render();
          if (token()) sync(false); else toast('Code changé sur cet appareil. Connecte GitHub pour l’activer partout.', 'warn', { ms: 6000 });
        });
      } }] });
    void m;
  }
  function testToken(tok) {
    return gh('/repos/' + REPO, {}, tok).then(function (r) {
      if (r.permissions && r.permissions.push === false) throw GhErr(403);
      return 'Connexion OK : accès à ' + r.full_name + '.';
    });
  }
  function askToken(thenPublish) {
    var inp = h('input.in', { type: 'password', placeholder: 'github_pat_…', autocomplete: 'off', spellcheck: 'false' }), msg = h('p.g-msg', { style: 'text-align:left' });
    var body = h('div.fgrid', { style: 'margin-top:.8rem' },
      h('p', { style: 'color:var(--muted);margin:0' }, 'Pour publier, le studio a besoin d’un jeton GitHub qui peut écrire dans ' + REPO + '. Il est rangé chiffré dans le coffre : ' + (S.user === 'kevin' ? 'Junior' : 'MRkevin') + ' pourra publier aussi, sans le voir.'),
      h('ol.steps',
        h('li', 'Ouvre ', h('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener' }, 'github.com → Nouveau jeton (fine-grained)'), ' (connecté au compte ', h('b', REPO.split('/')[0]), ').'),
        h('li', 'Nom : ', h('code', 'Nexus Studio'), ' · Expiration : ', h('b', '1 an'), '.'),
        h('li', 'Repository access : ', h('b', 'Only select repositories'), ' → ', h('code', REPO), '.'),
        h('li', 'Permissions → Repository → ', h('b', 'Contents : Read and write'), '.'),
        h('li', 'Clique ', h('b', 'Generate token'), ', copie-le et colle-le ici.')),
      fld('Jeton GitHub', inp), msg);
    modal({ title: 'Connecter GitHub', body: body, wide: true, actions: [
      { label: 'Pas maintenant', fn: function (c) { c(); } },
      { label: 'Connecter', icon: 'github', cls: 'main', fn: function (c) {
        var t = inp.value.trim(); if (!t) { msg.textContent = 'Colle le jeton d’abord.'; return; }
        msg.className = 'g-msg ok'; msg.textContent = 'Vérification…';
        testToken(t).then(function () {
          S.priv.settings.token = t; S.priv.settings._u = Date.now(); log('a connecté GitHub au studio'); touch(); c(); toast('GitHub connecté !', 'ok'); render();
          sync(!!thenPublish);
        }, function (e) { msg.className = 'g-msg'; msg.textContent = ghMsg(e); });
      } }
    ] });
  }

  /* =========================================================
     SAUVEGARDE / PUBLICATION
     ========================================================= */
  function refsIn(v, out) { if (typeof v === 'string') { if (v.indexOf('nxf:') === 0) out[v.slice(4)] = 1; } else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { refsIn(v[k], out); }); return out; }
  function gcFiles() { var used = refsIn(site(), refsIn(S.priv.ideas, {})); Object.keys(S.priv.files).forEach(function (id) { if (!used[id]) delete S.priv.files[id]; }); }
  function materialize(files) {
    var s = site(), done = {}, EXT = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
    function conv(ref, dir) {
      if (typeof ref !== 'string' || ref.indexOf('nxf:') !== 0) return ref;
      var id = ref.slice(4); if (done[id]) return done[id];
      var data = S.priv.files[id]; if (!data) return '';
      var m = /^data:([^;,]+)[;,]/.exec(data), path = dir + '/' + id + '.' + (EXT[m && m[1]] || 'png');
      files.push({ path: path, b64: data.slice(data.indexOf(',') + 1) }); S.recent[path] = data; done[id] = path; return path;
    }
    s.projects.forEach(function (p) {
      if (p.hidden) return;
      var dir = 'assets/projects/' + pubId(p);
      /* confidentiel : seules les images réellement montrées dans le teaser sont envoyées */
      if (p.secret) { if (!p.secretHide) ['logo', 'banner'].forEach(function (k) { if (p[k]) p[k] = conv(p[k], dir); }); return; }
      ['logo', 'banner'].forEach(function (k) { if (p[k]) p[k] = conv(p[k], dir); });
      (p.gallery || []).forEach(function (g) { g.src = conv(g.src, dir); });
      (p.bosses || []).forEach(function (b) { if (b.image) b.image = conv(b.image, dir); });
      (p.videos || []).forEach(function (v) { if (v.poster) v.poster = conv(v.poster, dir); });
    });
    s.team.forEach(function (t) { if (t.photo) t.photo = conv(t.photo, 'assets/img/team'); });
    return publicSite();
  }
  function progress(title, steps) {
    var list = h('div.prog-steps'), bar = h('i'), rows = steps.map(function (s, i) { var r = h('div.ps', h('span.dot', String(i + 1)), h('span', s), h('small')); list.appendChild(r); return r; });
    var extra = h('div');
    var m = modal({ title: title, body: h('div', list, h('div.pbar', bar), extra), closable: false });
    var cur = -1;
    return {
      step: function (i, note) {
        if (cur > -1 && rows[cur]) { rows[cur].className = 'ps ok'; rows[cur].querySelector('.dot').innerHTML = ''; rows[cur].querySelector('.dot').appendChild(ico('check')); }
        cur = i; if (rows[i]) { rows[i].className = 'ps run'; var dt = rows[i].querySelector('.dot'); dt.innerHTML = ''; dt.appendChild(h('span.spin')); if (note) rows[i].querySelector('small').textContent = note; }
        bar.style.width = (i / steps.length * 100) + '%';
      },
      note: function (t) { if (rows[cur]) rows[cur].querySelector('small').textContent = t; },
      done: function (head2, text) {
        if (rows[cur]) rows[cur].querySelector('small').textContent = '';
        this.step(steps.length); bar.style.width = '100%';
        extra.innerHTML = ''; extra.appendChild(h('div.done-burst', NX.img('assets/img/nexoria-logo.png', ''), h('b', { style: 'font:800 1.3rem var(--hf)' }, head2), h('p', { style: 'color:var(--muted);margin:0' }, text)));
        m.act.innerHTML = ''; m.box.appendChild(m.act);
        m.act.appendChild(h('button.btn', { type: 'button', onclick: function () { W.open('index.html', '_blank', 'noopener'); } }, ico('globe'), 'Voir le site'));
        m.act.appendChild(h('button.btn.main', { type: 'button', onclick: m.close }, 'Super !'));
        burst();
      },
      fail: function (text) {
        if (rows[cur]) { rows[cur].className = 'ps ko'; var dt = rows[cur].querySelector('.dot'); dt.innerHTML = ''; dt.appendChild(ico('x')); }
        extra.innerHTML = ''; extra.appendChild(h('div.banner', { style: 'margin:1rem 0 0' }, ico('alert'), h('span', text)));
        m.act.innerHTML = ''; m.box.appendChild(m.act);
        m.act.appendChild(h('button.btn', { type: 'button', onclick: m.close }, 'Fermer'));
      },
      close: m.close
    };
  }
  function sync(publish, silent) {
    if (S.busy) return Promise.resolve(false);
    if (!token()) { if (!silent) askToken(publish); return Promise.resolve(false); }
    if (publish && !silent && !diffs().length && !S.dirty) { toast('Le site est déjà à jour ✨', 'ok'); return Promise.resolve(true); }
    S.busy = true; chrome();
    var steps = publish ? ['Récupération de la dernière version', 'Préparation des images', 'Chiffrement du coffre privé', 'Envoi sur GitHub', 'Mise en ligne du site'] : ['Récupération de la dernière version', 'Chiffrement du coffre privé', 'Envoi sur GitHub'];
    var pm = silent ? { step: function () {}, note: function () {}, done: function () {}, fail: function () {} } : progress(publish ? 'Publication du site' : 'Sauvegarde privée', steps);
    var files = [], pubJson = null, env;
    pm.step(0);
    return ghRaw(VAULT).then(function (txt) {
      var renv = JSON.parse(txt);
      if (renv.rev && renv.rev !== S.baseRev) {
        if (silent && (E || MODALS)) throw Object.assign(new Error('later'), { later: true });
        return unseal(S.key, renv.data).then(function (rp) {
          S.priv = mergePriv(rp, S.priv);
          if (!S.keysChanged) S.env.keys = renv.keys; else { var k = Object.assign({}, renv.keys); k[S.user] = S.env.keys[S.user]; S.env.keys = k; }
          S.env.kdf = renv.kdf;
          if (!silent) pm.note('Fusionné avec les changements de ' + (S.user === 'kevin' ? 'Junior' : 'MRkevin'));
        });
      }
    }).then(function () {
      if (publish) {
        pm.step(1);
        pubJson = materialize(files);
        pm.note(files.length ? files.length + ' image' + (files.length > 1 ? 's' : '') : 'Aucune nouvelle image');
        S.priv.pubAt = Date.now(); S.priv.draftBase = hash(canon(pubJson)); S.priv.draftPub = S.priv.draftBase;
        log('a publié le site');
      }
      pm.step(publish ? 2 : 1);
      gcFiles();
      S.priv.updatedAt = Date.now(); S.priv.updatedBy = S.user;
      return seal(S.key, S.priv);
    }).then(function (data) {
      env = Object.assign({}, S.env, { rev: Date.now(), data: data });
      files.push({ path: VAULT, text: JSON.stringify(env, null, 1) + '\n' });
      if (publish) files.push({ path: DATA, text: JSON.stringify(pubJson, null, 2) + '\n' });
      pm.step(publish ? 3 : 2);
      return commit(files, publish ? 'Nexus Studio · publication du site par ' + USERS[S.user].name : 'Nexus Studio · sauvegarde privée (' + USERS[S.user].name + ')');
    }).then(function () {
      S.env = env; S.baseRev = env.rev; S.dirty = false; S.keysChanged = false; S.external = false;
      if (publish) { S.live = pubJson; S.liveFresh = true; }
      S.ver = (S.ver || 0) + 1;
      saveLocal(); saveLocal.flush();
      if (!publish) { pm.done('Coffre sauvegardé', 'Tes idées, messages et brouillons sont à l’abri et partagés avec ' + (S.user === 'kevin' ? 'Junior' : 'MRkevin') + '.'); return; }
      pm.step(4, 'GitHub Pages reconstruit le site…');
      return waitLive(pubJson, pm).then(function (ok) {
        pm.done(ok ? 'Le site est en ligne !' : 'Publication envoyée', ok ? 'Tout le monde voit maintenant la nouvelle version de NEXORIA.' : 'GitHub met un peu plus de temps que d’habitude : le site sera à jour d’ici quelques minutes.');
      });
    }).then(function () { S.busy = false; render(); return true; }, function (e) {
      S.busy = false;
      if (e && e.later) { autoSync(); chrome(); return false; }
      console.error(e);
      if (silent) { chrome(); return false; }
      pm.fail(ghMsg(e)); chrome(); return false;
    });
  }
  function waitLive(pubJson, pm) {
    var want = canon(pubJson), t0 = Date.now();
    return new Promise(function (ok) {
      (function poll() {
        var s = Math.round((Date.now() - t0) / 1000);
        pm.note('En attente de GitHub Pages… ' + s + ' s');
        fetchJSON(DATA).then(function (j) { if (canon(j) === want) return ok(true); next(); }, next);
        function next() { if (Date.now() - t0 > 240000) return ok(false); setTimeout(poll, 5000); }
      })();
    });
  }
  /* récupère les changements de l'autre admin */
  function pull(announce) {
    if (!token() || S.busy || E || MODALS || D) return;
    ghRaw(VAULT).then(function (txt) {
      var renv = JSON.parse(txt);
      if (!renv.rev || renv.rev === S.baseRev) return;
      return unseal(S.key, renv.data).then(function (rp) {
        if (S.busy || E || MODALS || D) return;
        var by = rp.updatedBy;
        S.priv = S.dirty ? mergePriv(rp, S.priv) : normalizePriv(rp);
        if (!S.keysChanged) S.env.keys = renv.keys;
        S.env.kdf = renv.kdf; S.baseRev = renv.rev;
        return ghRaw(DATA).then(function (t) { try { S.live = JSON.parse(t); S.liveFresh = true; } catch (e) {} }, function () {}).then(function () {
          S.ver = (S.ver || 0) + 1; normalizeDraft(); checkExternal(); saveLocal(); render();
          if (by && by !== S.user) toast(USERS[by].name + ' a fait des changements — le studio est à jour.', 'info', { ms: 5000 });
        });
      });
    }).catch(function (e) { if (announce) console.warn('Synchronisation impossible', e); });
  }

  /* aperçu privé du site (IndexedDB partagée avec index.html sur cet appareil) */
  function preview(hashPart) {
    var pub = JSON.parse(JSON.stringify(publicSite(), function (k, v) { return typeof v === 'string' && v.indexOf('nxf:') === 0 ? resolve(v) : (typeof v === 'string' && S.recent[v]) ? S.recent[v] : v; }));
    idb.set('preview', pub).then(function () { W.open('index.html?apercu' + (typeof hashPart === 'string' ? hashPart : ''), '_blank', 'noopener'); });
  }

  /* =========================================================
     DÉMARRAGE
     ========================================================= */
  function boot() {
    fxBackground(); fxCursor();
    var bootEl = $('#boot');
    function ready() { bootEl.classList.add('out'); setTimeout(function () { bootEl.remove(); }, 600); }
    if (!W.crypto || !crypto.subtle) {
      ready(); showGate(); $('#gMsg').textContent = 'Ce navigateur ne permet pas le déchiffrement (ouvre le studio en https).'; return;
    }
    var teamP = fetchJSON(DATA).then(function (j) { S.publicTeam = j.team || []; }).catch(function () {});
    var sess = readSession();
    var tryS = !sess ? Promise.reject() : fetchJSON(VAULT).then(function (env) { S.env = env; return enter(sess.user, unb64(sess.k), env, false); });
    Promise.all([tryS.then(function () { return true; }, function () { if (sess) clearSession(); S.user = null; S.priv = null; return false; }), teamP]).then(function (r) {
      setTimeout(function () {
        ready();
        if (r[0]) showApp(); else showGate();
      }, RED ? 0 : 650);
    });
  }
  boot();
})();
