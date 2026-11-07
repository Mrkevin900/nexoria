/* NEXORIA — rendu du site à partir de data/projects.json (accueil + pages projet). */
(function () {
  'use strict';
  var d = document, r = d.documentElement;
  var CFG = window.NEXORIA_CONFIG || {};
  var DATA = null, BY = {}, TEAM = {};
  var STATE = {
    dev: { label: 'En développement', color: 'var(--dev)' },
    done: { label: 'Terminé', color: 'var(--done)' },
    pause: { label: 'En pause', color: 'var(--pause)' }
  };
  var RM = { termine: 'Terminé', 'en-cours': 'En cours', 'a-venir': 'À venir', pause: 'En pause' };

  /* ---------- outils ---------- */
  function el(tag, cls, txt) { var n = d.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function img(src, alt, cls) { var i = el('img', cls); i.src = src; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async'; return i; }
  function link(p) { return '#/projet/' + p.id; }
  function okUrl(u) { return typeof u === 'string' && /^https:\/\//.test(u); }
  function paint(n, p) { n.style.setProperty('--acc', p.accent); n.style.setProperty('--pbg', p.bg); }

  /* cadenas : identifiants uniques par instance (sinon les dégradés disparaissent quand une copie est masquée) */
  var lockN = 0;
  function lockSvg() {
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
  }
  var MINI_LOCK = '<svg class="r-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function stateBadge(p) {
    var s = el('span', 'state ' + p.state);
    if (p.state === 'pause') s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
    s.appendChild(d.createTextNode(STATE[p.state].label));
    return s;
  }
  function byLine(p) {
    var w = el('div', 'by');
    (p.authors || []).forEach(function (a) { var t = TEAM[a]; if (t) w.appendChild(img(t.photo, '')); });
    var names = (p.authors || []).map(function (a) { return TEAM[a] ? TEAM[a].name : a; });
    w.appendChild(el('span', '', 'Par ' + names.join(' & ')));
    return w;
  }
  function art(p, cls) {
    if (p.holo) { var h = el('div', 'holo ' + (cls || '')); h.setAttribute('aria-hidden', 'true'); h.innerHTML = '<i></i><i></i><i></i><i></i>'; return h; }
    if (p.logo) return img(p.logo, 'Logo ' + p.name, (cls || 'p-art') + (p.logoRounded ? ' round' : ''));
    var m = el('div', 'mono ' + (cls || ''), p.monogram || p.name.charAt(0)); m.setAttribute('aria-hidden', 'true'); return m;
  }

  /* ---------- affiche projet ---------- */
  function poster(p, big) {
    var a = el('a', 'poster' + (big ? ' big' : '') + (p.state === 'pause' ? ' locked' : ''));
    a.href = link(p); paint(a, p);
    a.setAttribute('aria-label', p.name + ' — ' + STATE[p.state].label);
    if (p.banner) a.appendChild(img(p.banner, '', 'p-ban'));
    var ar = art(p, p.logo ? 'p-art' : ''); a.appendChild(ar);
    var top = el('div', 'p-top'); top.appendChild(stateBadge(p)); a.appendChild(top);
    if (p.state === 'pause') {
      var lb = el('div', 'lockbox'); lb.innerHTML = '<span style="position:relative;display:block"><i class="lock-ring"></i>' + lockSvg() + '</span>';
      lb.appendChild(el('small', '', 'Bientôt de retour')); a.appendChild(lb);
    }
    a.appendChild(el('span', 'tag', p.tag));
    a.appendChild(el('h3', '', p.name));
    a.appendChild(el('p', '', p.short));
    var f = el('div', 'p-foot');
    f.appendChild(el('span', 'go', p.state === 'pause' ? 'Voir le projet' : 'Découvrir →'));
    f.appendChild(byLine(p));
    a.appendChild(f);
    return a;
  }

  /* ---------- accueil ---------- */
  function renderHome() {
    var P = DATA.projects;
    // raccourcis
    var hc = d.getElementById('hero-chips');
    P.filter(function (p) { return p.state === 'dev'; }).slice(0, 5).forEach(function (p) {
      var c = el('a', 'chip'); c.href = link(p); c.style.setProperty('--c', p.accent);
      c.appendChild(el('i')); c.appendChild(d.createTextNode(p.name)); hc.appendChild(c);
    });
    // chiffres
    var n = { dev: 0, done: 0, pause: 0 }; P.forEach(function (p) { n[p.state]++; });
    var st = d.getElementById('stats');
    [['', P.length, 'Projets'], ['s-dev', n.dev, 'En développement'], ['s-done', n.done, 'Terminés'], ['s-pause', n.pause, 'En pause']].forEach(function (x) {
      var w = el('div', x[0]); var dd = el('dd', '', '0'); dd.dataset.count = x[1];
      w.appendChild(dd); w.appendChild(el('dt', '', x[2])); st.appendChild(w);
    });
    // projets + filtres
    var filters = [['all', 'Tous'], ['dev', 'En développement'], ['done', 'Terminés'], ['pause', 'En pause']]
      .concat(DATA.categories.map(function (c) { return ['cat:' + c.id, c.name]; }));
    var box = d.getElementById('posters');
    function show(f) {
      box.innerHTML = '';
      var L = P.filter(function (p) { return f === 'all' || p.state === f || 'cat:' + p.category === f; });
      L.forEach(function (p, i) { box.appendChild(poster(p, f === 'all' && i === 0)); });
      d.dispatchEvent(new Event('nx:rendered'));
    }
    chips(d.getElementById('proj-filters'), filters.map(function (f) {
      var count = P.filter(function (p) { return f[0] === 'all' || p.state === f[0] || 'cat:' + p.category === f[0]; }).length;
      return [f[0], f[1], count];
    }), show);
    show('all');
    renderTeam(); renderBoard(); renderGallery(); renderFaq();
  }

  function chips(box, list, cb) {
    list.forEach(function (c, i) {
      var b = el('button', 'chip' + (i ? '' : ' on')); b.type = 'button';
      b.setAttribute('aria-pressed', i ? 'false' : 'true');
      if (c[3]) { b.style.setProperty('--c', c[3]); b.appendChild(el('i')); }
      b.appendChild(d.createTextNode(c[1]));
      if (c[2] != null) b.appendChild(el('span', 'n', String(c[2])));
      b.onclick = function () {
        [].forEach.call(box.children, function (y) { y.classList.remove('on'); y.setAttribute('aria-pressed', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); cb(c[0]);
      };
      box.appendChild(b);
    });
  }

  function renderTeam() {
    var box = d.getElementById('team');
    DATA.team.forEach(function (t) {
      var own = DATA.projects.filter(function (p) { return (p.authors || []).indexOf(t.id) > -1; });
      var a = el('article', 'person' + (t.id === 'kevin' ? ' founder' : ''));
      var ring = el('div', 'ring'); ring.appendChild(img(t.photo, 'Avatar de ' + t.name)); a.appendChild(ring);
      var h = el('h3', '', t.name); if (t.alias) h.appendChild(el('span', 'alias', ' · ' + t.alias)); a.appendChild(h);
      a.appendChild(el('span', 'role', t.role));
      a.appendChild(el('p', '', t.bio));
      var c = el('span', 'count', String(own.length)); c.appendChild(el('small', '', own.length > 1 ? 'projets' : 'projet')); a.appendChild(c);
      var m = el('div', 'mini');
      own.forEach(function (p) { var l = el('a', '', p.name); l.href = link(p); l.style.setProperty('--c', p.accent); m.appendChild(l); });
      a.appendChild(m);
      box.appendChild(a);
    });
  }

  function renderBoard() {
    var box = d.getElementById('board');
    ['dev', 'done', 'pause'].forEach(function (s) {
      var L = DATA.projects.filter(function (p) { return p.state === s; });
      var col = el('div', 'col ' + s);
      var h = el('h3'); h.appendChild(el('span', 'dot')); h.appendChild(d.createTextNode(STATE[s].label)); h.appendChild(el('b', '', String(L.length)));
      col.appendChild(h);
      L.forEach(function (p) {
        var a = el('a', 'row'); a.href = link(p); paint(a, p);
        var ic = el('span', 'r-ico');
        if (p.logo) ic.appendChild(img(p.logo, '')); else ic.textContent = p.monogram || p.name.charAt(0);
        a.appendChild(ic);
        var t = el('span', 'r-txt'); t.appendChild(el('b', '', p.name));
        var sub = p.statusNote || p.tag; if (p.version) sub = 'v' + p.version.replace(/^v/i, '') + ' · ' + sub;
        t.appendChild(el('small', '', sub));
        if (typeof p.progress === 'number') { var bar = el('div', 'bar'); var i = el('i'); i.dataset.w = p.progress; bar.appendChild(i); t.appendChild(bar); }
        a.appendChild(t);
        if (s === 'pause') a.insertAdjacentHTML('beforeend', MINI_LOCK);
        else if (typeof p.progress === 'number') a.appendChild(el('small', '', p.progress + ' %'));
        col.appendChild(a);
      });
      box.appendChild(col);
    });
  }

  /* ---------- galerie ---------- */
  var MEDIA = [];
  function renderGallery() {
    DATA.projects.forEach(function (p) {
      (p.videos || []).forEach(function (v) { MEDIA.push({ p: p, k: 'vid', src: v.src, poster: v.poster, t: v.title }); });
      (p.gallery || []).forEach(function (g) { MEDIA.push({ p: p, k: 'img', src: g.src, t: g.alt, icon: g.icon, ex: g.example }); });
    });
    var grid = d.getElementById('mg'), more = d.getElementById('gal-more'), cur = [], shown = 0, STEP = 16;
    function draw(f) {
      grid.innerHTML = ''; shown = 0;
      cur = MEDIA.filter(function (m) { return f === 'all' || m.p.id === f; });
      if (f === 'all') cur = cur.filter(function (m) { return !m.icon; });
      page();
    }
    function page() {
      cur.slice(shown, shown + STEP).forEach(function (m, j) { grid.appendChild(tile(m, cur, shown + j)); });
      shown = Math.min(shown + STEP, cur.length);
      more.hidden = shown >= cur.length;
      d.dispatchEvent(new Event('nx:rendered'));
    }
    more.onclick = page;
    var list = [['all', 'Tout', null]].concat(DATA.projects.filter(function (p) { return (p.gallery || []).length || (p.videos || []).length; })
      .map(function (p) { return [p.id, p.name, null, p.accent]; }));
    chips(d.getElementById('gal-filters'), list, draw);
    draw('all');
  }
  function tile(m, list, i, small) {
    var b = el('button', 'box mt' + (m.k === 'vid' ? ' vd' : '') + (m.tall ? ' tall' : '')); b.type = 'button'; paint(b, m.p);
    var w = el('span', 'm-img');
    w.appendChild(img(m.k === 'vid' ? m.poster : m.src, m.t, m.icon ? 'icon' : ''));
    if (m.ex) w.appendChild(el('span', 'ex', 'Exemple'));
    b.appendChild(w);
    var c = el('span', 'm-cap', m.t); if (!small) c.appendChild(el('small', '', m.p.name)); b.appendChild(c);
    b.onclick = function () { openViewer(list, i); };
    return b;
  }

  /* ---------- visionneuse ---------- */
  var V = d.getElementById('viewer'), VS = d.getElementById('v-stage'), VC = d.getElementById('v-cap'), VL = [], VI = 0;
  function openViewer(list, i) {
    VL = list; VI = i; vshow();
    if (V.showModal) { if (!V.open) V.showModal(); } else V.setAttribute('open', '');
  }
  function vshow() {
    VI = (VI + VL.length) % VL.length; var m = VL[VI]; VS.innerHTML = '';
    var n;
    if (m.k === 'vid') { n = el('video'); n.controls = true; n.playsInline = true; n.preload = 'metadata'; n.poster = m.poster; n.src = m.src; }
    else { n = el('img'); n.src = m.src; n.alt = m.t; }
    VS.appendChild(n);
    VC.textContent = m.t + ' — ' + m.p.name + (m.ex ? ' (image d’exemple)' : '') + '   ·   ' + (VI + 1) + ' / ' + VL.length;
    V.querySelectorAll('.v-nav').forEach(function (b) { b.hidden = VL.length < 2; });
  }
  function vclose() { VS.innerHTML = ''; if (V.close) V.close(); else V.removeAttribute('open'); }
  V.querySelector('.v-close').onclick = vclose;
  V.querySelector('.v-prev').onclick = function () { VI--; vshow(); };
  V.querySelector('.v-next').onclick = function () { VI++; vshow(); };
  V.addEventListener('click', function (e) { if (e.target === V || e.target === VS) vclose(); });
  V.addEventListener('close', function () { VS.innerHTML = ''; });
  d.addEventListener('keydown', function (e) {
    if (!V.open) return;
    if (e.key === 'ArrowLeft') { VI--; vshow(); } if (e.key === 'ArrowRight') { VI++; vshow(); }
  });

  /* ---------- FAQ ---------- */
  var FAQ = [
    ['NEXORIA', 'Qu’est-ce que NEXORIA ?', 'Une structure indépendante qui rassemble des projets numériques : serveurs Garry’s Mod, applications Windows, bots Discord, sites et outils.'],
    ['NEXORIA', 'Qui a fondé NEXORIA ?', 'MRkevin est le fondateur de NEXORIA. Junior est le cofondateur. MRkevin développe la plupart des projets ; Junior a créé le Panel HG et travaille avec MRkevin sur Black Clover RP et Solo Leveling RP.'],
    ['Projets', 'Quels projets sont en développement ?', '__DEV__'],
    ['Projets', 'Pourquoi Solo Leveling RP est-il en pause ?', 'C’était le premier serveur de NEXORIA. Il est mis en pause pour que l’équipe se concentre sur Black Clover RP ; il reviendra plus tard.'],
    ['Black Clover', 'Qu’est-ce que Black Clover RP ?', 'Le grand serveur roleplay de mages de NEXORIA sur Garry’s Mod, pensé pour plus de 100 joueurs. C’est un projet de fans, sans affiliation officielle avec les ayants droit de Black Clover.'],
    ['Panel HG', 'À quoi sert le Panel HG ?', 'À gérer et coordonner les hauts gradés du serveur Black Clover : effectifs, grades, compagnies, candidatures, combats, événements, décisions, planning et promotions.'],
    ['Panel HG', 'Qui peut accéder au Panel HG ?', 'Les hauts gradés autorisés : Grand Chevalier-Mage, Vice-Capitaine, Capitaine, Responsable serveur et Fondateur. Les permissions sont vérifiées par le panel lui-même, pas par ce site.'],
    ['Dino App', 'Où télécharger Dino App ?', 'Dino App est en test restreint. Aucun lien de téléchargement n’est publié tant que le lien officiel n’a pas été vérifié.'],
    ['Communauté', 'Comment rejoindre la communauté ?', 'Rejoins le Discord NEXORIA avec le bouton en bas de la page : annonces, avant-premières et tests des projets s’y passent.']
  ];
  function renderFaq() {
    var dev = DATA.projects.filter(function (p) { return p.state === 'dev'; }).map(function (p) { return p.name; });
    var box = d.getElementById('faq-list'), items = [];
    FAQ.forEach(function (q) {
      var det = el('details', 'faq'); det.dataset.c = q[0];
      var s = el('summary'); var sp = el('span'); sp.appendChild(el('em', 'fc', q[0])); sp.appendChild(d.createTextNode(q[1])); s.appendChild(sp); det.appendChild(s);
      var done = DATA.projects.filter(function (p) { return p.state === 'done'; }).map(function (p) { return p.name; });
      var pause = DATA.projects.filter(function (p) { return p.state === 'pause'; }).map(function (p) { return p.name; });
      det.appendChild(el('p', '', q[2] === '__DEV__' ? 'Presque tout : ' + dev.join(', ') + '. Terminé : ' + (done.join(', ') || 'aucun') + '. En pause : ' + (pause.join(', ') || 'aucun') + '.' : q[2]));
      box.appendChild(det); items.push(det);
    });
    var cats = ['Tout'].concat(FAQ.map(function (q) { return q[0]; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    chips(d.getElementById('faq-filters'), cats.map(function (c) { return [c, c]; }), function (c) {
      items.forEach(function (x) { x.hidden = !(c === 'Tout' || x.dataset.c === c); });
    });
  }

  /* ---------- page projet ---------- */
  var VP = d.getElementById('view-project'), VH = d.getElementById('view-home');
  function section(title, lead) {
    var s = el('section', 'psec'), w = el('div', 'wrap');
    w.appendChild(el('h2', '', title)); if (lead) w.appendChild(el('p', 'lead', lead));
    s.appendChild(w); return { s: s, w: w };
  }
  function renderProject(p) {
    VP.innerHTML = ''; paint(VP, p);
    VP.className = p.state === 'pause' ? 'is-paused' : '';
    d.dispatchEvent(new CustomEvent('nx:accent', { detail: p.accent }));
    // en-tête
    var hero = el('header', 'phero'); paint(hero, p);
    if (p.banner) { var bi = img(p.banner, '', 'ph-ban' + (p.bannerIsCapture ? ' shot' : '')); bi.loading = 'eager'; hero.appendChild(bi); }
    var w = el('div', 'wrap'), L = el('div');
    var bk = el('a', 'back', '← Tous les projets'); bk.href = '#projets'; L.appendChild(bk);
    var bd = el('div', 'ph-badges'); bd.appendChild(stateBadge(p)); bd.appendChild(el('span', 'badge-solid', p.tag));
    if (p.version) bd.appendChild(el('span', 'badge-solid', 'Version ' + p.version)); L.appendChild(bd);
    L.appendChild(el('h1', '', p.name));
    L.appendChild(el('p', 'lead', p.description));
    L.appendChild(byLine(p));
    if (p.authorsNote) L.appendChild(el('p', 'lead', p.authorsNote)).style.fontSize = '.92rem';
    w.appendChild(L);
    w.appendChild(art(p, 'ph-art'));
    hero.appendChild(w); VP.appendChild(hero);

    // chiffres clés + avancement
    var top = el('div', 'wrap');
    if (p.facts && p.facts.length) {
      var fx = el('div', 'facts');
      p.facts.forEach(function (f) { var x = el('div'); x.appendChild(el('small', '', f.label)); x.appendChild(el('b', '', f.value)); fx.appendChild(x); });
      top.appendChild(fx);
    }
    if (typeof p.progress === 'number') {
      var pc = el('div', 'progress-card'), pt = el('div', 'pc-top');
      pt.appendChild(el('span', '', 'Avancement global')); pt.appendChild(el('b', '', p.progress + ' %')); pc.appendChild(pt);
      var bar = el('div', 'bar'), bi2 = el('i'); bi2.dataset.w = p.progress; bar.appendChild(bi2); pc.appendChild(bar);
      if (p.progressNote) pc.appendChild(el('small', '', p.progressNote));
      top.appendChild(pc);
    }
    if (p.state === 'pause') {
      var lp = el('div', 'lockpanel');
      lp.innerHTML = '<div class="lp-lock"><i class="lock-ring"></i>' + lockSvg() + '</div>';
      var lt = el('div'); lt.appendChild(el('h3', '', 'Projet en pause')); lt.appendChild(el('p', '', p.pauseNote || 'Ce projet est en pause. Il reviendra plus tard.'));
      lp.appendChild(lt); top.appendChild(lp);
    }
    if (p.restricted) {
      var rs = el('div', 'restricted');
      rs.innerHTML = '<svg viewBox="0 0 34 40" aria-hidden="true"><path d="M17 1 L33 7 V19 C33 29 26 36 17 39 C8 36 1 29 1 19 V7 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 20l4 4 8-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
      var rt = el('div'); rt.appendChild(el('h3', '', 'Espace HG — accès réservé')); rt.appendChild(el('p', '', p.restricted));
      var rb = el('button', 'btn acc', okUrl(CFG.panelHgUrl) ? 'Accéder à l’espace HG' : 'Lien bientôt disponible'); rb.type = 'button';
      if (okUrl(CFG.panelHgUrl)) rb.onclick = function () { window.open(CFG.panelHgUrl, '_blank', 'noopener'); }; else rb.disabled = true;
      rt.appendChild(rb); rs.appendChild(rt); top.appendChild(rs);
    }
    VP.appendChild(top);

    // fonctionnalités
    if (p.features && p.features.length) {
      var F = section(p.state === 'pause' ? 'Ce qui a déjà été construit' : 'Ce que propose ' + p.name);
      var g = el('div', 'feat');
      p.features.forEach(function (f, i) {
        var b = el('div', 'box'); b.appendChild(el('span', 'num', String(i + 1).padStart(2, '0')));
        b.appendChild(el('h3', '', f.title)); if (f.text) b.appendChild(el('p', '', f.text));
        if (f.items && f.items.length) { var u = el('ul'); f.items.forEach(function (t) { u.appendChild(el('li', '', t)); }); b.appendChild(u); }
        g.appendChild(b);
      });
      F.w.appendChild(g); VP.appendChild(F.s);
    }
    // boss
    if (p.bosses && p.bosses.length) {
      var B = section(p.bossesTitle || 'Les boss', p.bossesIntro);
      var bg = el('div', 'bosses');
      p.bosses.forEach(function (x) {
        var c = el('article', 'boss'), im = el('div', 'b-img');
        if (x.image) im.appendChild(img(x.image, x.name)); else im.appendChild(el('span', 'b-sil', x.rank || x.name.charAt(0)));
        if (x.rank) im.appendChild(el('span', 'rank', x.rank));
        c.appendChild(im);
        var body = el('div', 'b-body'); body.appendChild(el('small', '', x.title)); body.appendChild(el('h3', '', x.name)); body.appendChild(el('p', '', x.description));
        var sk = el('div', 'skulls'); sk.setAttribute('aria-label', 'Difficulté ' + (x.difficulty || 0) + ' sur 5');
        for (var i = 1; i <= 5; i++) sk.appendChild(el('i', i <= (x.difficulty || 0) ? 'on' : ''));
        sk.appendChild(el('span', '', 'Difficulté')); body.appendChild(sk);
        c.appendChild(body); bg.appendChild(c);
      });
      B.w.appendChild(bg); VP.appendChild(B.s);
    }
    // vidéos
    if (p.videos && p.videos.length) {
      var Vd = section('Vidéos');
      var vg = el('div', 'videos');
      p.videos.forEach(function (v) {
        var f = el('figure', v.vertical ? 'vertical' : ''), vi = el('video');
        vi.controls = true; vi.preload = 'none'; vi.playsInline = true; vi.poster = v.poster || ''; vi.src = v.src;
        f.appendChild(vi); f.appendChild(el('figcaption', '', v.title)); vg.appendChild(f);
      });
      Vd.w.appendChild(vg); VP.appendChild(Vd.s);
    }
    // galerie
    if (p.gallery && p.gallery.length) {
      var hasEx = p.gallery.some(function (g) { return g.example; });
      var G = section(p.galleryTitle || 'Galerie', hasEx ? 'Images d’exemple en attendant les vraies captures.' : '');
      var gg = el('div', 'pgal');
      var list = p.gallery.map(function (g) { return { p: p, k: 'img', src: g.src, t: g.alt, icon: g.icon, ex: g.example, tall: g.tall }; });
      list.forEach(function (m, i) { gg.appendChild(tile(m, list, i, true)); });
      G.w.appendChild(gg); VP.appendChild(G.s);
    }
    // feuille de route
    if (p.roadmap && p.roadmap.length) {
      var R = section('Feuille de route');
      var tl = el('div', 'tl');
      p.roadmap.forEach(function (x) {
        var it = el('div', 'tli ' + x.status); it.appendChild(el('b', '', x.name)); it.appendChild(el('span', 'st', RM[x.status] || x.status));
        if (typeof x.progress === 'number') { var br = el('div', 'bar'), bi3 = el('i'); bi3.dataset.w = x.progress; br.appendChild(bi3); it.appendChild(br); }
        tl.appendChild(it);
      });
      R.w.appendChild(tl); VP.appendChild(R.s);
    }
    // projets liés
    var rel = (p.related || []).map(function (id) { return BY[id]; }).filter(Boolean);
    if (rel.length) {
      var Rl = section('Projets liés'); var rg = el('div', 'related');
      rel.forEach(function (q) { rg.appendChild(poster(q)); }); Rl.w.appendChild(rg); VP.appendChild(Rl.s);
    }
    if (p.note) { var nw = el('div', 'wrap'); nw.appendChild(el('p', 'note', p.note)); nw.style.paddingBottom = '3rem'; VP.appendChild(nw); }
    d.title = p.name + ' — NEXORIA';
  }

  /* ---------- routeur ---------- */
  function route() {
    var h = location.hash, m = h.match(/^#\/projet\/([\w-]+)/);
    if (m && BY[m[1]]) {
      VH.hidden = true; VP.hidden = false; renderProject(BY[m[1]]);
      d.querySelectorAll('.nav ul a.act').forEach(function (a) { a.classList.remove('act'); });
      window.scrollTo(0, 0);
    } else {
      var wasProject = !VP.hidden;
      VP.hidden = true; VH.hidden = false; VP.innerHTML = '';
      d.title = 'NEXORIA — Plusieurs projets. Plusieurs univers. Une seule vision.';
      d.dispatchEvent(new CustomEvent('nx:accent', { detail: null }));
      var t = h.length > 1 ? d.getElementById(h.slice(1)) : null;
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: wasProject ? 'auto' : 'smooth' }); }, wasProject ? 30 : 0);
      else if (wasProject) window.scrollTo(0, 0);
    }
    d.dispatchEvent(new Event('nx:rendered'));
  }

  /* ---------- démarrage ---------- */
  d.querySelectorAll('[data-discord]').forEach(function (a) {
    if (okUrl(CFG.discordInvite)) { a.href = CFG.discordInvite; a.target = '_blank'; a.rel = 'noopener'; }
  });
  fetch('data/projects.json', { cache: 'no-cache' }).then(function (res) {
    if (!res.ok) throw new Error(res.status); return res.json();
  }).then(function (json) {
    DATA = json;
    DATA.team.forEach(function (t) { TEAM[t.id] = t; });
    DATA.projects.forEach(function (p) { BY[p.id] = p; });
    renderHome();
    window.addEventListener('hashchange', route);
    route();
  }).catch(function (e) {
    d.getElementById('posters').innerHTML = '<p class="note">Impossible de charger les projets (' + e.message + '). Ouvre le site via un serveur web, pas en double-cliquant sur le fichier.</p>';
  });
})();
