/* NEXORIA — effets : thème, menu, préférences, particules, parallaxe, apparitions, cartes 3D, curseur, compteurs. */
(function () {
  'use strict';
  var r = document.documentElement, d = document;
  function mq(q) { return window.matchMedia(q).matches; }
  var P = { anim: true, cursor: true, perf: false, reduce: false };
  try { Object.assign(P, JSON.parse(localStorage.getItem('nx-prefs') || '{}')); } catch (e) {}
  var red = mq('(prefers-reduced-motion:reduce)') || P.reduce || !P.anim;
  var fine = mq('(hover:hover) and (pointer:fine)') && !P.perf;
  var small = mq('(max-width:760px)') || !fine;

  /* écran de chargement : retiré quoi qu'il arrive (au cas où l'animation CSS ne se joue pas) */
  setTimeout(function () { var l = d.querySelector('.loader'); if (l) l.remove(); }, 1600);

  /* ---------- thème ---------- */
  var tt = d.getElementById('tt'), col = '232,230,239', acc = null;
  function hexRgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h.slice(0, 6), 16); return isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(','); }
  function pc() { var light = r.getAttribute('data-theme') === 'light'; col = (acc && hexRgb(acc)) || (light ? '42,40,51' : '232,230,239'); }
  function lab() { tt.setAttribute('aria-label', r.getAttribute('data-theme') === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'); }
  d.addEventListener('nx:accent', function (e) { acc = e.detail; pc(); });
  pc(); lab();
  tt.addEventListener('click', function () {
    var n = r.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (!red) r.classList.add('tta');
    r.setAttribute('data-theme', n);
    try { localStorage.setItem('nx-theme', n); } catch (e) {}
    lab(); pc(); setTimeout(function () { r.classList.remove('tta'); }, 700);
  });

  /* ---------- menu mobile ---------- */
  var m = d.getElementById('menu'), b = d.querySelector('.burger');
  b.addEventListener('click', function () { var o = m.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
  m.addEventListener('click', function (e) { if (e.target.tagName === 'A') { m.classList.remove('open'); b.setAttribute('aria-expanded', false); } });

  /* ---------- préférences ---------- */
  var pp = d.getElementById('pp'), pb = d.getElementById('pb');
  pb.addEventListener('click', function () { pp.hidden = !pp.hidden; pb.setAttribute('aria-expanded', !pp.hidden); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pp.hidden) { pp.hidden = true; pb.setAttribute('aria-expanded', false); pb.focus(); } });
  d.addEventListener('click', function (e) { if (!pp.hidden && !pp.contains(e.target) && !pb.contains(e.target)) { pp.hidden = true; pb.setAttribute('aria-expanded', false); } });
  pp.querySelectorAll('input').forEach(function (i) {
    i.checked = !!P[i.dataset.k];
    i.addEventListener('change', function () { P[i.dataset.k] = i.checked; try { localStorage.setItem('nx-prefs', JSON.stringify(P)); } catch (e) {} location.reload(); });
  });

  /* ---------- hero : particules, parallaxe, titre 3D ---------- */
  var hero = d.querySelector('.hero'), h1 = hero.querySelector('h1');
  var lay = [].slice.call(hero.querySelectorAll('.layer[data-p]')), cv = d.getElementById('pc'), g = cv.getContext('2d');
  var W = 0, H = 0, ps = [], tx = 0, ty = 0, mx = 0, my = 0, sy = 0, vis = true, run = false;
  function init() {
    var k = Math.min(window.devicePixelRatio || 1, 1.5);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * k; cv.height = H * k; g.setTransform(k, 0, 0, k, 0, 0);
    ps = []; var N = P.perf ? 0 : (small ? 26 : 70);
    for (var i = 0; i < N; i++) ps.push({ x: Math.random() * W, y: Math.random() * H, z: .2 + Math.random() * .8, v: .15 + Math.random() * .4 });
  }
  function draw(adv) {
    g.clearRect(0, 0, W, H);
    ps.forEach(function (p) {
      if (adv) { p.y -= p.v * p.z; if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } }
      var x = p.x - mx * p.z * 40, y = p.y - my * p.z * 40 - sy * p.z * .15, s = p.z * 2.2;
      g.fillStyle = 'rgba(' + col + ',' + (p.z * .15) + ')'; g.beginPath(); g.arc(x, y, s * 4, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(' + col + ',' + (.3 + p.z * .6) + ')'; g.beginPath(); g.arc(x, y, s, 0, 6.283); g.fill();
    });
  }
  function tick() {
    if (!vis || hero.offsetParent === null) { run = false; return; }
    mx += (tx - mx) * .06; my += (ty - my) * .06;
    lay.forEach(function (l) { var p = +l.dataset.p; l.style.transform = 'translate3d(' + (-mx * p * 40) + 'px,' + (-my * p * 40 + sy * p * .25) + 'px,0)'; });
    if (fine) { h1.style.setProperty('--hx', mx.toFixed(3)); h1.style.setProperty('--hy', my.toFixed(3)); }
    draw(1); requestAnimationFrame(tick);
  }
  function go() { if (!run && !red) { run = true; tick(); } }
  init(); if (red) draw(0); else go();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { init(); if (red) draw(0); }, 200); });
  hero.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var q = hero.getBoundingClientRect(); tx = (e.clientX - q.left) / q.width * 2 - 1; ty = (e.clientY - q.top) / q.height * 2 - 1;
  });
  hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });

  /* ---------- défilement : barre, nav, bouton haut ---------- */
  var pg = d.getElementById('pg'), nav = d.querySelector('header.nav'), up = d.getElementById('up');
  function sc() {
    sy = window.scrollY; var h = r.scrollHeight - window.innerHeight;
    pg.style.transform = 'scaleX(' + (h > 0 ? Math.min(sy / h, 1) : 0) + ')';
    nav.classList.toggle('sc', sy > 20); up.hidden = sy < 700;
  }
  window.addEventListener('scroll', sc, { passive: true }); sc();
  up.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: red ? 'auto' : 'smooth' }); });

  /* ---------- curseur personnalisé + boutons magnétiques ---------- */
  if (fine && !red && P.cursor) {
    r.classList.add('cc');
    var c = d.createElement('div'), dot = d.createElement('div');
    c.className = 'cur'; dot.className = 'cdot'; c.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
    d.body.appendChild(c); d.body.appendChild(dot);
    var ax = 0, ay = 0, gx = -100, gy = -100;
    d.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY; c.style.opacity = 1; dot.style.opacity = 1;
      dot.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
      c.classList.toggle('big', !!e.target.closest('a,button,video,summary,.poster,.boss,.mt'));
      var el = e.target.closest('.btn,.tt');
      if (el) { var q = el.getBoundingClientRect(); el.style.setProperty('--bx', ((e.clientX - q.left - q.width / 2) * .2).toFixed(1) + 'px'); el.style.setProperty('--by', ((e.clientY - q.top - q.height / 2) * .2).toFixed(1) + 'px'); }
    });
    d.addEventListener('pointerout', function (e) { var el = e.target.closest && e.target.closest('.btn,.tt'); if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--bx', '0px'); el.style.setProperty('--by', '0px'); } });
    d.addEventListener('pointerdown', function (e) {
      c.classList.add('dn');
      var rp = d.createElement('i'); rp.className = 'rip'; rp.style.left = e.clientX + 'px'; rp.style.top = e.clientY + 'px';
      d.body.appendChild(rp); setTimeout(function () { rp.remove(); }, 650);
    });
    d.addEventListener('pointerup', function () { c.classList.remove('dn'); });
    r.addEventListener('mouseleave', function () { c.style.opacity = 0; dot.style.opacity = 0; });
    (function mv() { ax += (gx - ax) * .2; ay += (gy - ay) * .2; c.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0)'; requestAnimationFrame(mv); })();
  }

  /* ---------- compteurs & barres ---------- */
  function count(el) {
    var to = +el.dataset.count; if (red) { el.textContent = to; return; }
    var t0 = performance.now();
    (function f(t) { var k = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  function fill(i) { i.style.width = i.dataset.w + '%'; }

  if (!('IntersectionObserver' in window)) {
    d.addEventListener('nx:rendered', function () { d.querySelectorAll('[data-count]').forEach(function (x) { x.textContent = x.dataset.count; }); d.querySelectorAll('.bar i[data-w]').forEach(fill); });
    return;
  }
  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) go(); }).observe(hero);
  d.addEventListener('nx:rendered', function () { if (hero.offsetParent !== null) { init(); go(); } });

  /* ---------- apparitions + cartes 3D (relancé à chaque rendu) ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var x = e.target; io.unobserve(x);
      if (x.dataset.count) { count(x); return; }
      if (x.dataset.w) { fill(x); return; }
      x.classList.add('in');
      setTimeout(function () { x.classList.remove('rv', 'in'); x.style.transitionDelay = ''; }, 1400);
    });
  }, { threshold: .12 });
  function prepare() {
    d.querySelectorAll('[data-count]:not([data-seen]),.bar i[data-w]:not([data-seen])').forEach(function (x) { x.dataset.seen = 1; io.observe(x); });
    if (!red) d.querySelectorAll('section:not(.hero) h2,.poster,.box,.person,.boss,.col,.cta,.videos figure,.tli,.facts div,.lockpanel,.restricted,.progress-card').forEach(function (x, i) {
      if (x.dataset.rv) return;
      x.dataset.rv = 1; x.classList.add('rv'); x.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(x);
    });
    if (fine && !red) d.querySelectorAll('.poster,.person,.boss').forEach(function (el) {
      if (el.dataset.tilt) return;
      el.dataset.tilt = 1; el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var q = el.getBoundingClientRect(), px = (e.clientX - q.left) / q.width, py = (e.clientY - q.top) / q.height;
        el.style.setProperty('--ry', ((px - .5) * 10).toFixed(2)); el.style.setProperty('--rx', ((.5 - py) * 10).toFixed(2));
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', 0); el.style.setProperty('--ry', 0); });
    });
  }
  prepare();
  d.addEventListener('nx:rendered', prepare);

  /* ---------- lien actif dans le menu ---------- */
  var ls = d.querySelectorAll('.nav ul a');
  var so = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) ls.forEach(function (a) { a.classList.toggle('act', a.getAttribute('href') === '#' + e.target.id); }); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  d.querySelectorAll('#view-home section[id]').forEach(function (s) { so.observe(s); });
})();
