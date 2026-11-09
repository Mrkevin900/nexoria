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

  /* rendu partagé avec Nexus Studio : assets/js/nx-render.js */
  var NX = window.NX;
  var lockSvg = NX.lockSvg, MINI_LOCK = NX.MINI_LOCK, stateBadge = NX.stateBadge;
  function byLine(p) { return NX.byLine(p, TEAM); }
  function art(p, cls) { return NX.art(p, cls); }

  /* ---------- affiche projet ---------- */
  function poster(p, big) { return NX.poster(p, { big: big, href: link(p), team: TEAM }); }

  /* ---------- accueil ---------- */
  function renderHome() {
    var P = DATA.projects;
    // raccourcis
    var hc = d.getElementById('hero-chips');
    P.filter(function (p) { return p.state === 'dev' && !p.secret; }).slice(0, 5).forEach(function (p) {
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
        a.appendChild(NX.icon(p));
        var t = el('span', 'r-txt'); t.appendChild(el('b', '', p.name));
        var sub = p.statusNote || p.tag; if (p.secret) sub = 'Confidentiel' + (p.tag ? ' · ' + p.tag : ''); if (p.version) sub = 'v' + p.version.replace(/^v/i, '') + ' · ' + sub;
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
    DATA.projects.filter(function (p) { return !p.secret; }).forEach(function (p) {
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
    var list = [['all', 'Tout', null]].concat(DATA.projects.filter(function (p) { return !p.secret && (p.gallery || []).length || (p.videos || []).length; })
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
    ['NEXORIA', 'Qu’est-ce que NEXORIA ?', 'Une structure indépendante qui rassemble des projets numériques et créatifs : serveurs Garry’s Mod, applications Windows, bots Discord, sites web et outils communautaires.'],
    ['NEXORIA', 'Qui a fondé et dirige NEXORIA ?', 'MRkevin est le fondateur de NEXORIA et pilote la majorité des développements techniques. Junior en est le cofondateur : il a développé le Panel HG et co-développe Black Clover RP et Solo Leveling RP.'],
    ['NEXORIA', 'Quelle est la philosophie de la structure ?', '« Plusieurs projets. Plusieurs univers. Une seule vision. » Chaque projet possède son identité visuelle et son univers propre, avec une exigence de finition et de performance poussée au maximum.'],
    ['Projets', 'Quels projets sont actuellement actifs ?', '__DEV__'],
    ['Black Clover', 'Qu’est-ce que Black Clover RP ?', 'Le serveur roleplay Garry’s Mod phare de NEXORIA, pensé pour accueillir plus de 100 joueurs simultanés. Les joueurs incarnent des mages, reçoivent leur grimoire d’affinité, rejoignent une compagnie et affrontent 8 boss majeurs.'],
    ['Black Clover', 'Comment fonctionne le système de grimoires et de magie ?', 'Chaque joueur débloque des sorts uniques selon son affinité (Vent, Feu, Espace, Ténèbres...), progresse dans les rangs de sa compagnie et peut participer aux raids épiques de guildes.'],
    ['Serveurs', 'Pourquoi Solo Leveling RP est-il en pause ?', 'Solo Leveling RP a été le premier serveur fondateur de NEXORIA. Il est actuellement mis en pause avec ses acquis sécurisés afin que l’équipe concentre toutes ses forces sur Black Clover RP. Il sera réactivé ultérieurement.'],
    ['Nexus Studio', 'Qu’est-ce que Nexus Studio ?', 'Nexus Studio est le centre de pilotage privé de NEXORIA. Il permet à MRkevin et Junior de suivre l’état des projets en temps réel, échanger des notes de conception, gérer les images et déployer les mises à jour en un clic.'],
    ['Nexus Studio', 'Qui a accès à Nexus Studio ?', 'L’accès est strictement réservé au fondateur MRkevin et au cofondateur Junior par code d’accès sécurisé (PIN). Les changements validés dans le Studio sont ensuite synchronisés pour toute la communauté.'],
    ['Académie', 'Qu’est-ce que l’Académie Nexoria ?', 'L’Académie Nexoria est une plateforme complète d’apprentissage dédiée à la création sur Source Engine : Mapping (Hammer & Blender), Programmation (GLua / Luau) et Effets visuels (VFX).'],
    ['Académie', 'Quand l’Académie Nexoria sera-t-elle disponible ?', 'Le projet est actuellement confidentiel et en cours d’élaboration par MRkevin et Junior. Un teaser interactif ainsi que le guide complet de mapping débutant sont déjà consultables en avant-première sur le site.'],
    ['Panel HG', 'À quoi sert le Panel HG ?', 'Développé par Junior, le Panel HG sert à coordonner les hauts gradés du serveur Black Clover : gestion des effectifs, compagnies, candidatures, combats d’arène, planning d’événements et promotions.'],
    ['Panel HG', 'Qui peut accéder au Panel HG ?', 'Seuls les hauts gradés autorisés : Grand Chevalier-Mage, Vice-Capitaine, Capitaine, Responsable serveur et Fondateurs. Les permissions sont directement contrôlées et chiffrées par le panel.'],
    ['Applications', 'Où télécharger Dino App et AddonForge ?', 'Dino App et AddonForge sont actuellement en phases de test restreint et d’optimisation. Les installateurs officiels vérifiés seront mis à disposition sur le Discord NEXORIA lors de leur sortie publique.'],
    ['Communauté', 'Comment rejoindre la communauté ou proposer son aide ?', 'Rejoins le Discord officiel NEXORIA grâce aux boutons présents sur la page. C’est le lieu d’échange central pour tester les projets en avant-première, voter les fonctionnalités et discuter avec MRkevin et Junior.']
  ];
  function renderFaq() {
    var dev = DATA.projects.filter(function (p) { return p.state === 'dev'; }).map(function (p) { return p.name; });
    var done = DATA.projects.filter(function (p) { return p.state === 'done'; }).map(function (p) { return p.name; });
    var pause = DATA.projects.filter(function (p) { return p.state === 'pause'; }).map(function (p) { return p.name; });

    if (DATA.site && Array.isArray(DATA.site.faq) && DATA.site.faq.length) FAQ = DATA.site.faq.map(function (x) { return [x.cat || 'NEXORIA', x.q || '', x.auto ? '__DEV__' : (x.a || '')]; });
    var box = d.getElementById('faq-list');
    var searchInput = d.getElementById('faq-search');
    var activeCategory = 'Tout';
    var activeQuery = '';

    box.innerHTML = '';
    var items = [];

    FAQ.forEach(function (q) {
      var det = el('details', 'faq');
      det.dataset.c = q[0];
      det.dataset.q = q[1].toLowerCase();
      det.dataset.a = q[2].toLowerCase();

      var s = el('summary');
      var sp = el('span');
      sp.appendChild(el('em', 'fc', q[0]));
      sp.appendChild(d.createTextNode(q[1]));
      s.appendChild(sp);
      det.appendChild(s);

      var ans = q[2];
      if (ans === '__DEV__') {
        ans = 'En cours : ' + dev.join(', ') + '. Terminé : ' + (done.join(', ') || 'aucun') + '. En pause : ' + (pause.join(', ') || 'aucun') + '.';
      }
      det.appendChild(el('p', '', ans));
      box.appendChild(det);
      items.push(det);
    });

    function applyFilter() {
      items.forEach(function (x) {
        var matchCat = activeCategory === 'Tout' || x.dataset.c === activeCategory;
        var matchQuery = !activeQuery || x.dataset.q.indexOf(activeQuery) !== -1 || x.dataset.a.indexOf(activeQuery) !== -1;
        x.hidden = !(matchCat && matchQuery);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        activeQuery = this.value.trim().toLowerCase();
        applyFilter();
      });
    }

    var cats = ['Tout'].concat(FAQ.map(function (q) { return q[0]; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    chips(d.getElementById('faq-filters'), cats.map(function (c) { return [c, c]; }), function (c) {
      activeCategory = c;
      applyFilter();
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
    if (p.secret) bd.appendChild(NX.secretBadge());
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
    if (p.secret) {
      var sp = el('div', 'secretpanel');
      sp.innerHTML = '<div class="sp-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg></div>';
      var spt = el('div'); spt.appendChild(el('h3', '', 'Projet confidentiel')); spt.appendChild(el('p', '', p.secretNote || 'On travaille dessus en secret. Plus d’infos bientôt — garde un œil sur le Discord NEXORIA !'));
      sp.appendChild(spt); top.appendChild(sp);
    }
    VP.appendChild(top);
    if (p.secret) { d.title = p.name + ' — NEXORIA'; return; }

    if (p.id === 'academie-nexoria') {
      var actA = el('div', 'wrap');
      var btnA = el('a', 'btn main', 'Consulter le Teaser & le Guide Mapping →');
      btnA.href = 'academie/index.html'; btnA.target = '_blank';
      actA.appendChild(btnA);
      actA.style.margin = '1.2rem 0 2rem';
      VP.appendChild(actA);
    }
    if (p.id === 'nexoria-studio') {
      var actS = el('div', 'wrap');
      var btnS = el('a', 'btn main', 'Accéder à Nexus Studio (🔒 Espace Direction) →');
      btnS.href = 'studio.html';
      actS.appendChild(btnS);
      actS.style.margin = '1.2rem 0 2rem';
      VP.appendChild(actS);
    }

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
  function bindDiscord(url) {
    d.querySelectorAll('[data-discord]').forEach(function (a) {
      if (okUrl(url)) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    });
  }
  bindDiscord(CFG.discordInvite);

  /* ---------- textes du site modifiables depuis Nexus Studio (DATA.site) ---------- */
  function rich(n, txt) { // **gras** autorisé, tout le reste est échappé
    n.textContent = '';
    String(txt).split(/\*\*(.+?)\*\*/).forEach(function (part, i) { n.appendChild(i % 2 ? el('b', '', part) : d.createTextNode(part)); });
  }
  function applySite(S) {
    if (!S) return;
    var H = S.hero || {}, hero = d.querySelector('.hero');
    if (H.kicker) hero.querySelector('.kicker').textContent = H.kicker;
    if (H.title) hero.querySelector('h1').textContent = H.title;
    if (H.slogan) hero.querySelector('.slogan').textContent = H.slogan;
    if (H.lead) rich(hero.querySelector('.hero-txt > .lead'), H.lead);
    var hb = hero.querySelectorAll('.btns a');
    ['btn1', 'btn2', 'btn3'].forEach(function (k, i) { if (H[k] && hb[i]) hb[i].textContent = H[k]; });
    if (Array.isArray(S.sections)) {
      S.sections.forEach(function (x) {
        var sec = d.getElementById(x.id); if (!sec || sec.parentNode !== VH) return;
        var h2 = sec.querySelector('h2'), ld = sec.querySelector('.wrap > .lead, .cta .lead');
        if (x.title && h2) h2.textContent = x.title;
        if (x.lead && ld) rich(ld, x.lead);
        sec.hidden = !!x.hidden;
        var nl = d.querySelector('#menu a[href="#' + x.id + '"]'); if (nl) nl.parentNode.hidden = !!x.hidden;
        VH.appendChild(sec);
      });
    }
    if (Array.isArray(S.vision) && S.vision.length) {
      var cols = d.querySelector('#vision .cols'); cols.innerHTML = '';
      S.vision.forEach(function (v) {
        var b = el('div', 'box'); var ic = el('span', 'ico', v.icon || '◆'); ic.setAttribute('aria-hidden', 'true');
        b.appendChild(ic); b.appendChild(el('h3', '', v.title || '')); var p = el('p'); rich(p, v.text || ''); b.appendChild(p); cols.appendChild(b);
      });
    }
    if (S.footer) { var fs = d.querySelector('footer .wrap > span'); if (fs) rich(fs, S.footer); }
    if (S.discord) bindDiscord(S.discord);
  }

  /* Aperçu privé (?apercu) : Nexus Studio dépose le brouillon dans IndexedDB, visible seulement sur cet appareil. */
  function previewData() {
    return new Promise(function (ok) {
      if (!/[?&]apercu\b/.test(location.search) || !window.indexedDB) return ok(null);
      try {
        var q = indexedDB.open('nx-studio', 1);
        q.onupgradeneeded = function () { q.result.createObjectStore('kv'); };
        q.onerror = function () { ok(null); };
        q.onsuccess = function () {
          try {
            var g = q.result.transaction('kv').objectStore('kv').get('preview');
            g.onsuccess = function () { ok(g.result || null); }; g.onerror = function () { ok(null); };
          } catch (e) { ok(null); }
        };
      } catch (e) { ok(null); }
    });
  }
  function start(json, preview) {
    DATA = json;
    DATA.team.forEach(function (t) { TEAM[t.id] = t; });
    DATA.projects.forEach(function (p) { BY[p.id] = p; });
    if (preview) {
      var b = el('div', 'preview-bar');
      b.innerHTML = '<b>Aperçu privé</b><span>Brouillon de Nexus Studio — pas encore publié, visible uniquement sur cet appareil.</span>';
      var x = el('a', 'btn sm', 'Retour au studio'); x.href = 'studio.html'; b.appendChild(x);
      d.body.insertBefore(b, d.body.firstChild);
    }
    try { applySite(DATA.site); } catch (e) { console.warn('Textes du site', e); }
    renderHome();
    window.addEventListener('hashchange', route);
    route();
    NX.watchEyes();
  }
  previewData().then(function (pv) {
    if (pv && pv.projects && pv.team) return start(pv, true);
    return fetch('data/projects.json', { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(res.status); return res.json();
    }).then(function (json) { start(json, false); });
  }).catch(function (e) {
    d.getElementById('posters').innerHTML = '<p class="note">Impossible de charger les projets (' + e.message + '). Ouvre le site via un serveur web, pas en double-cliquant sur le fichier.</p>';
  });
})();
