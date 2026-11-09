/* NEXORIA — rendu partagé entre le site public et Nexus Studio :
   affiches projets, badges de statut, cadenas, et LOGO AUTO dans le style du logo NX
   (lettres noires brillantes, contour autocollant blanc, yeux qui suivent la souris, langue tirée). */
(function () {
  'use strict';
  var d = document;
  var NX = window.NX = window.NX || {};

  NX.STATE = {
    dev: { label: 'En développement' },
    done: { label: 'Terminé' },
    pause: { label: 'En pause' }
  };

  function el(tag, cls, txt) { var n = d.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function id(x) { return x; }
  function img(src, alt, cls) { var i = el('img', cls); i.src = src; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async'; return i; }
  function escAttr(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  NX.el = el; NX.img = img;

  /* ---------- logo auto façon NX ---------- */
  var N = 0;
  var MAXL = NX.MAX_LETTERS = 5;
  function initials(p) {
    if (p.monogram) return String(p.monogram).trim().slice(0, MAXL);
    var w = String(p.name || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/);
    return (w[0] || '?').charAt(0);
  }
  NX.initials = initials;

  NX.logoSVG = function (text, accent) {
    var t = String(text || '?').toUpperCase().slice(0, MAXL), n = t.length || 1, k = 'nxl' + (++N);
    var acc = /^#[0-9a-f]{3,8}$/i.test(accent || '') ? accent : '#c7c7d1';
    var fs = [0, 130, 112, 92, 78, 66][n];
    var tl = n === 1 ? '' : ' textLength="' + [0, 0, 178, 192, 200, 206][n] + '" lengthAdjust="spacingAndGlyphs"';
    var T = '<text x="110" y="118" text-anchor="middle" font-family="Sora,Figtree,system-ui,sans-serif" font-weight="800" font-size="' + fs + '"' + tl + ' transform="skewX(-9) translate(14 0)"';
    var L = escAttr(t);
    var dx = [0, 19, 27, 31, 34, 36][n], e = [0, 11, 13.5, 12.5, 12, 11.5][n], cx = 110;
    var delay = (Math.random() * 4).toFixed(2);
    /* pas de filtre SVG (trop coûteux à repeindre) : l'ombre est faite en CSS sur le conteneur */
    return '<svg class="nxl-svg" viewBox="0 0 220 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Logo ' + L + '">' +
      '<defs>' +
      '<linearGradient id="' + k + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6a76"/><stop offset=".34" stop-color="#202027"/><stop offset=".62" stop-color="#09090c"/><stop offset="1" stop-color="#26262e"/></linearGradient>' +
      '<linearGradient id="' + k + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".28" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<g>' +
      T + ' fill="#fff" stroke="#fff" stroke-width="20" stroke-linejoin="round">' + L + '</text>' +
      T + ' fill="#0b0b0e" stroke="#0b0b0e" stroke-width="8" stroke-linejoin="round">' + L + '</text>' +
      T + ' fill="url(#' + k + 'f)">' + L + '</text>' +
      T + ' fill="none" stroke="' + acc + '" stroke-opacity=".6" stroke-width="1.8">' + L + '</text>' +
      T + ' fill="url(#' + k + 's)">' + L + '</text>' +
      // marques de colère
      '<g transform="translate(184 6) rotate(18)" class="nxl-zap"><path d="M0 0h9l-4 24h-6z" fill="#0b0b0e" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M14 4h9l-6 20h-6z" fill="#0b0b0e" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g>' +
      '<path d="M200 46l5 8 9-1-6 7 3 9-8-5-8 5 3-9-6-7 9 1z" fill="' + acc + '" stroke="#0b0b0e" stroke-width="2.5" stroke-linejoin="round" class="nxl-zap" transform="scale(.8) translate(46 6)"/>' +
      '</g>' +
      // visage
      '<g class="nxl-face">' +
      '<g transform="translate(' + (cx - dx) + ' 72) rotate(9)"><g class="nxl-blink" style="animation-delay:' + delay + 's">' +
      '<ellipse rx="' + (e * 1.18) + '" ry="' + (e * .82) + '" fill="#fff" stroke="#0b0b0e" stroke-width="3.5"/>' +
      '<g class="nxl-p"><circle r="' + (e * .4) + '" cy="' + (e * .12) + '" fill="#0b0b0e"/></g>' +
      '<path d="M' + (-e * 1.5) + ' ' + (-e * 1.3) + 'L' + (e * 1.5) + ' ' + (-e * 1.3) + 'L' + (e * 1.5) + ' ' + (-e * .02) + 'L' + (-e * 1.5) + ' ' + (-e * .62) + 'Z" fill="#0b0b0e"/>' +
      '</g></g>' +
      '<g transform="translate(' + (cx + dx + 2) + ' 69)"><g class="nxl-blink" style="animation-delay:' + delay + 's">' +
      '<ellipse rx="' + e + '" ry="' + (e * 1.08) + '" fill="#fff" stroke="#0b0b0e" stroke-width="3.5"/>' +
      '<g class="nxl-p"><circle r="' + (e * .44) + '" fill="#0b0b0e"/><circle r="' + (e * .14) + '" cx="' + (-e * .16) + '" cy="' + (-e * .16) + '" fill="#fff"/></g>' +
      '</g></g>' +
      '<path d="M' + (cx - dx - 4) + ' 93Q' + (cx + 2) + ' 108 ' + (cx + dx + 8) + ' 88" fill="none" stroke="#0b0b0e" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M' + (cx - dx - 4) + ' 93Q' + (cx + 2) + ' 108 ' + (cx + dx + 8) + ' 88" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      '<g transform="translate(' + (cx + 6) + ' 99) rotate(-10)"><g class="nxl-t">' +
      '<path d="M-12 0C-13 17-7 31 3 31C14 31 19 17 14-3Z" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>' +
      '<path d="M-12 0C-13 17-7 31 3 31C14 31 19 17 14-3Z" fill="#e5596b" stroke="#0b0b0e" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M-7 5C-7 14-3 22 4 23" fill="none" stroke="#ff9aa6" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M2 3L3 17" stroke="#a52a43" stroke-width="2.6" stroke-linecap="round"/>' +
      '</g></g>' +
      '</g></svg>';
  };

  NX.logoEl = function (p, cls) {
    var w = el('div', 'nxl ' + (cls || ''));
    w.setAttribute('aria-hidden', 'true');
    w.innerHTML = NX.logoSVG(initials(p), p.accent);
    return w;
  };

  /* yeux qui suivent le pointeur (léger : un seul écouteur, une image par frame) */
  var watching = false;
  NX.watchEyes = function () {
    if (watching || !window.matchMedia || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    watching = true;
    /* ~25 images/s max, seulement les logos visibles, et seulement si le regard change vraiment */
    var px = -1, py = -1, lx = -99, ly = -99, timer = 0, last = 0;
    function upd() {
      timer = 0; last = performance.now();
      if (Math.abs(px - lx) + Math.abs(py - ly) < 6) return;
      lx = px; ly = py;
      var L = d.querySelectorAll('.nxl-svg'), H = window.innerHeight, W = window.innerWidth, rs = [];
      for (var i = 0; i < L.length; i++) rs.push(L[i].getBoundingClientRect());
      for (i = 0; i < L.length; i++) {
        var r = rs[i];
        if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W || !r.width) continue;
        var cx = r.left + r.width / 2, cy = r.top + r.height * .48, dx = px - cx, dy = py - cy, m = Math.max(Math.hypot(dx, dy), 1);
        var f = Math.min(m / 260, 1), ex = (dx / m * f).toFixed(2), ey = (dy / m * f).toFixed(2), s = L[i];
        if (s._ex === ex && s._ey === ey) continue;
        s._ex = ex; s._ey = ey;
        s.style.setProperty('--ex', ex); s.style.setProperty('--ey', ey);
      }
    }
    d.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY;
      if (!timer) timer = setTimeout(function () { requestAnimationFrame(upd); }, Math.max(0, 40 - (performance.now() - last)));
    }, { passive: true });
  };

  /* ---------- cadenas ---------- */
  var lockN = 0;
  NX.lockSvg = function () {
    var k = 'lk' + (++lockN);
    return '<svg class="lock" viewBox="0 0 84 100" aria-hidden="true"><defs>' +
      '<linearGradient id="' + k + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6ff"/><stop offset=".45" stop-color="#b9c2ea"/><stop offset="1" stop-color="#5b648f"/></linearGradient>' +
      '<linearGradient id="' + k + 's" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e97c2"/><stop offset=".5" stop-color="#f4f6ff"/><stop offset="1" stop-color="#7a83ad"/></linearGradient>' +
      '<clipPath id="' + k + 'c"><rect x="6" y="42" width="72" height="54" rx="14"/></clipPath></defs>' +
      '<path class="shackle" d="M22 46V30a20 20 0 0 1 40 0v16" fill="none" stroke="url(#' + k + 's)" stroke-width="9" stroke-linecap="round"/>' +
      '<rect x="6" y="42" width="72" height="54" rx="14" fill="url(#' + k + 'b)"/>' +
      '<rect x="6" y="42" width="72" height="54" rx="14" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>' +
      '<g clip-path="url(#' + k + 'c)"><rect class="glint" x="20" y="36" width="14" height="70" fill="#fff" opacity="0" transform="skewX(-20)"/></g>' +
      '<circle cx="42" cy="64" r="7" fill="#1e2340"/><path d="M39 66h6l-1 14h-4z" fill="#1e2340"/></svg>';
  };
  NX.MINI_LOCK = '<svg class="r-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  NX.stateBadge = function (p) {
    var st = NX.STATE[p.state] ? p.state : 'dev';
    var s = el('span', 'state ' + st);
    if (st === 'pause') s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
    s.appendChild(d.createTextNode(NX.STATE[st].label));
    return s;
  };

  NX.secretBadge = function () {
    var s = el('span', 'state secret');
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M2 2l20 20"/></svg>';
    s.appendChild(d.createTextNode('Confidentiel'));
    return s;
  };

  NX.byLine = function (p, team, resolve) {
    resolve = resolve || id; team = team || {};
    var w = el('div', 'by');
    (p.authors || []).forEach(function (a) { var t = team[a]; if (t && t.photo) w.appendChild(img(resolve(t.photo), '')); });
    var names = (p.authors || []).map(function (a) { return team[a] ? team[a].name : a; });
    w.appendChild(el('span', '', names.length ? 'Par ' + names.join(' & ') : 'NEXORIA'));
    return w;
  };

  NX.paint = function (n, p) { if (p.accent) n.style.setProperty('--acc', p.accent); if (p.bg) n.style.setProperty('--pbg', p.bg); };

  NX.art = function (p, cls, resolve) {
    resolve = resolve || id;
    if (p.holo) { var h = el('div', 'holo ' + (cls || '')); h.setAttribute('aria-hidden', 'true'); h.innerHTML = '<i></i><i></i><i></i><i></i>'; return h; }
    if (p.logo) return img(resolve(p.logo), 'Logo ' + p.name, (cls || 'p-art') + (p.logoRounded ? ' round' : ''));
    return NX.logoEl(p, cls);
  };

  /* petite icône carrée (tableau d'avancement, listes) */
  NX.icon = function (p, resolve) {
    resolve = resolve || id;
    var ic = el('span', 'r-ico');
    if (p.logo) ic.appendChild(img(resolve(p.logo), ''));
    else ic.appendChild(NX.logoEl(p, 'mini'));
    return ic;
  };

  /* affiche projet — même rendu sur le site et dans le studio */
  NX.poster = function (p, o) {
    o = o || {};
    var resolve = o.resolve || id;
    var st = NX.STATE[p.state] ? p.state : 'dev';
    var sec = !!p.secret;
    var a = el(o.tag || 'a', 'poster' + (o.big ? ' big' : '') + (st === 'pause' ? ' locked' : '') + (sec ? ' secret' : ''));
    if (o.href) a.href = o.href;
    NX.paint(a, p);
    a.setAttribute('aria-label', p.name + ' — ' + NX.STATE[st].label);
    if (p.banner) a.appendChild(img(resolve(p.banner), '', 'p-ban'));
    a.appendChild(NX.art(p, p.logo ? 'p-art' : 'p-art', resolve));
    var top = el('div', 'p-top'), badges = el('div', 'p-badges'); badges.appendChild(NX.stateBadge(p)); if (sec) badges.appendChild(NX.secretBadge()); top.appendChild(badges); a.appendChild(top);
    if (sec) a.appendChild(el('div', 'secret-stamp', 'Confidentiel'));
    if (st === 'pause' && !sec) {
      var lb = el('div', 'lockbox'); lb.innerHTML = '<span style="position:relative;display:block"><i class="lock-ring"></i>' + NX.lockSvg() + '</span>';
      lb.appendChild(el('small', '', 'Bientôt de retour')); a.appendChild(lb);
    }
    if (p.tag) a.appendChild(el('span', 'tag', p.tag));
    a.appendChild(el('h3', '', p.name || 'Sans nom'));
    if (p.short) a.appendChild(el('p', '', p.short));
    var f = el('div', 'p-foot');
    f.appendChild(el('span', 'go', sec ? 'Voir le teaser →' : st === 'pause' ? 'Voir le projet' : 'Découvrir →'));
    f.appendChild(NX.byLine(p, o.team, resolve));
    a.appendChild(f);
    return a;
  };
})();
