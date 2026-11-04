/* NEXORIA — effets visuels : thème, menu, particules, parallaxe, apparitions, curseur. */
(function () {
  'use strict';
  var r = document.documentElement, d = document;
  var m = d.getElementById('menu'), b = d.querySelector('.burger'), tt = d.getElementById('tt');
  function mq(q) { return window.matchMedia(q).matches; }
  var red = mq('(prefers-reduced-motion:reduce)'), fine = mq('(hover:hover) and (pointer:fine)'), small = mq('(max-width:760px)') || !fine;

  /* thème + couleur des particules (suit la couleur du projet actif) */
  var col = '232,230,239', accHex = null;
  function hexRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h.slice(0, 6), 16);
    return isNaN(n) ? null : [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }
  function pc() {
    var light = r.getAttribute('data-theme') === 'light';
    col = (accHex && hexRgb(accHex)) || (light ? '42,40,51' : '232,230,239');
  }
  d.addEventListener('nx:accent', function (e) { accHex = e.detail; pc(); });
  function lab() { tt.setAttribute('aria-label', r.getAttribute('data-theme') === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'); }
  pc(); lab();
  tt.addEventListener('click', function () {
    var n = r.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (!red) r.classList.add('tta');
    r.setAttribute('data-theme', n);
    try { localStorage.setItem('nx-theme', n); } catch (e) {}
    lab(); pc();
    setTimeout(function () { r.classList.remove('tta'); }, 700);
  });

  /* menu mobile */
  b.addEventListener('click', function () { var o = m.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
  m.addEventListener('click', function (e) { if (e.target.tagName === 'A') { m.classList.remove('open'); b.setAttribute('aria-expanded', false); } });

  /* hero : particules + parallaxe + titre 3D */
  var hero = d.querySelector('.hero'), h1 = hero.querySelector('h1');
  var lay = [].slice.call(hero.querySelectorAll('.layer[data-p]')), cv = d.getElementById('pc'), g = cv.getContext('2d');
  var W = 0, H = 0, ps = [], tx = 0, ty = 0, mx = 0, my = 0, sy = 0, vis = true, run = false;
  function init() {
    var k = Math.min(window.devicePixelRatio || 1, 1.5);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * k; cv.height = H * k; g.setTransform(k, 0, 0, k, 0, 0);
    ps = [];
    for (var i = 0; i < (small ? 26 : 70); i++) ps.push({ x: Math.random() * W, y: Math.random() * H, z: .2 + Math.random() * .8, v: .15 + Math.random() * .4 });
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
    if (!vis) { run = false; return; }
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

  /* barre de progression du défilement */
  var pg = d.getElementById('pg');
  function sc() { sy = window.scrollY; var h = d.documentElement.scrollHeight - window.innerHeight; pg.style.transform = 'scaleX(' + (h > 0 ? Math.min(sy / h, 1) : 0) + ')'; }
  window.addEventListener('scroll', sc, { passive: true }); sc();

  /* curseur + boutons magnétiques (souris uniquement) */
  if (fine && !red) {
    var c = d.createElement('div'); c.className = 'cur'; c.setAttribute('aria-hidden', 'true'); d.body.appendChild(c);
    var ax = 0, ay = 0, gx = 0, gy = 0;
    d.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY; c.style.opacity = 1;
      c.classList.toggle('big', !!e.target.closest('a,button,video,iframe,.poster,.boss,.planet'));
      var el = e.target.closest('.btn,.tt');
      if (el) { var q = el.getBoundingClientRect(); el.style.setProperty('--bx', ((e.clientX - q.left - q.width / 2) * .2).toFixed(1) + 'px'); el.style.setProperty('--by', ((e.clientY - q.top - q.height / 2) * .2).toFixed(1) + 'px'); }
    });
    d.addEventListener('pointerout', function (e) { var el = e.target.closest && e.target.closest('.btn,.tt'); if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--bx', '0px'); el.style.setProperty('--by', '0px'); } });
    r.addEventListener('mouseleave', function () { c.style.opacity = 0; });
    (function mv() { ax += (gx - ax) * .2; ay += (gy - ay) * .2; c.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0)'; requestAnimationFrame(mv); })();
  }

  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) go(); }).observe(hero);

  /* apparitions au défilement + effet 3D sur les cartes (relancé à chaque rendu des données) */
  var io = red ? null : new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var x = e.target; x.classList.add('in'); io.unobserve(x);
      setTimeout(function () { x.classList.remove('rv', 'in'); x.style.transitionDelay = ''; }, 1400);
    });
  }, { threshold: .1 });
  function prepare() {
    if (io) d.querySelectorAll('section:not(.hero):not(.phero) h2,.poster,.box,.person,.boss,.post,.step,.server>div,.videos figure,.cta,.mcard,.gallery button').forEach(function (x, i) {
      if (x.dataset.rv) return;
      x.dataset.rv = 1; x.classList.add('rv'); x.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(x);
    });
    if (fine && !red) d.querySelectorAll('.poster,.person,.boss').forEach(function (el) {
      if (el.dataset.tilt) return;
      el.dataset.tilt = 1; el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var q = el.getBoundingClientRect(), px = (e.clientX - q.left) / q.width, py = (e.clientY - q.top) / q.height;
        el.style.setProperty('--ry', ((px - .5) * 10).toFixed(2)); el.style.setProperty('--rx', ((.5 - py) * 10).toFixed(2));
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', 0); el.style.setProperty('--ry', 0); });
    });
  }
  prepare();
  d.addEventListener('nx:rendered', prepare);

  /* lien actif dans le menu */
  var ls = d.querySelectorAll('.nav ul a');
  var so = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) ls.forEach(function (a) { a.classList.toggle('act', a.getAttribute('href') === '#' + e.target.id); }); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  d.querySelectorAll('#view-home section[id]').forEach(function (s) { so.observe(s); });
})();
