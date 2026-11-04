/* NEXORIA — données, pages et interactions.
   Sources (par priorité) :
   1. API du bot Discord (config.js → botApi) : données en direct
   2. data/live.json : dernière sauvegarde écrite par le bot sur GitHub
   3. data/projects.json : contenu de base
   Pages : accueil (#/ ou #section) et une page par projet (#/id-du-projet). */
(function () {
  'use strict';
  var CFG = window.NEXORIA_CONFIG || {};
  var d = document, root = d.documentElement;
  var $ = function (id) { return d.getElementById(id); };
  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var STEP_LABEL = { 'termine': 'Terminé', 'en-cours': 'En cours', 'a-venir': 'À venir' };
  var BOSS_LABEL = { conception: 'En conception', developpement: 'En développement', disponible: 'Disponible', vaincu: 'Vaincu' };

  /* ---------- outils ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // N'accepte que les liens http(s) et les chemins relatifs du site.
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w\-./]+$/.test(u) && u.indexOf('..') === -1) return u;
    return '';
  }
  function color(c) { return /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#e8e6ef'; }
  function pct(n) { if (n == null || n === '') return null; n = Number(n); return isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null; }
  function fmtDate(iso) { var t = new Date(iso); return isNaN(t) ? '' : t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function fetchJson(url, ms) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctl && setTimeout(function () { ctl.abort(); }, ms || 6000);
    return fetch(url, { cache: 'no-store', signal: ctl && ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function youtubeId(u) { var m = String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/); return m ? m[1] : null; }
  function same(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); }
  function logoHtml(p, cls) {
    var u = safeUrl(p.logo);
    if (u) return '<img class="' + cls + (p.logoRounded ? ' r' : '') + '" src="' + esc(u) + '" alt="" width="300" height="300" loading="lazy">';
    return '<span class="' + cls + ' mono" aria-hidden="true">' + esc(p.monogram || p.name.charAt(0)) + '</span>';
  }

  /* ---------- couleur active ---------- */
  function setAccent(c) {
    if (c) { root.classList.remove('neutral'); root.style.setProperty('--acc', color(c)); }
    else { root.classList.add('neutral'); root.style.removeProperty('--acc'); }
    d.dispatchEvent(new CustomEvent('nx:accent', { detail: c || null }));
  }

  /* ---------- chargement ---------- */
  var state = null;
  var base = fetchJson('data/projects.json?v=' + Date.now());
  var staticLive = fetchJson('data/live.json?v=' + Date.now()).catch(function () { return {}; });
  var api = CFG.botApi
    ? fetchJson(CFG.botApi.replace(/\/$/, '') + '/api/live', 7000).catch(function () { return null; })
    : Promise.resolve(null);
  // On attend le bot 1,5 s au plus (il peut dormir chez l'hébergeur gratuit), puis on complète quand il répond.
  var quickApi = Promise.race([api, new Promise(function (ok) { setTimeout(function () { ok(undefined); }, 1500); })]);

  Promise.all([base, staticLive, quickApi]).then(function (r) {
    state = { base: r[0], live: r[1] || {}, api: null };
    if (r[2]) useApi(r[2]);
    build();
    route(true);
    if (r[2] === undefined) api.then(function (a) {
      if (!a) return;
      useApi(a); build();
      if (current) renderProject(current, true); // rafraîchit la page projet sans la recharger
    });
  }).catch(function (e) {
    console.error(e);
    $('posters').innerHTML = '<div class="empty">Impossible de charger les projets. En local, lance le petit serveur (voir README).</div>';
  });

  function useApi(a) {
    state.api = a;
    if (a.live && (!state.live.updatedAt || (a.live.updatedAt && new Date(a.live.updatedAt) >= new Date(state.live.updatedAt)))) state.live = a.live;
  }

  /* ---------- fusion des données ---------- */
  var projects = [], byId = {};
  function build() {
    var live = state.live || {};
    projects = (state.base.projects || []).map(function (p) {
      var o = (live.projects || {})[p.id] || {};
      var q = Object.assign({}, p);
      ['status', 'version', 'progress', 'banner'].forEach(function (k) { if (o[k] != null && o[k] !== '') q[k] = o[k]; });
      if (o.address && q.server) q.server = Object.assign({}, q.server, { address: o.address });
      // Étapes : celles du bot remplacent celles du même nom, les nouvelles s'ajoutent.
      var road = (p.roadmap || []).map(function (s) { return Object.assign({}, s); });
      (o.roadmap || []).forEach(function (s) {
        var hit = road.filter(function (x) { return same(x.name, s.name); })[0];
        if (hit) Object.assign(hit, s); else road.push(s);
      });
      q.roadmap = road;
      // Boss : ceux du fichier + ceux du bot (même nom = mise à jour, removed = retiré).
      var bosses = (Array.isArray(p.bosses) ? p.bosses : []).map(function (b) { return Object.assign({}, b); });
      ((live.bosses || {})[p.id] || []).forEach(function (b) {
        var hit = bosses.filter(function (x) { return same(x.name, b.name) || (b.baseName && same(x.name, b.baseName)); })[0];
        if (hit) Object.assign(hit, b); else bosses.push(b);
      });
      q.bossList = bosses.filter(function (b) { return !b.removed; });
      q.videos = (p.videos || []).concat(o.videos || []);
      q.gallery = (p.gallery || []).concat(o.gallery || []);
      q.liveServer = state.api && state.api.servers ? state.api.servers[p.id] : null;
      q.pc = color(p.accent);
      return q;
    });
    byId = {};
    projects.forEach(function (p) { byId[p.id] = p; });

    renderHome();
    if (state.live.updatedAt) $('updated').textContent = 'Dernière mise à jour via Discord : ' + fmtDate(state.live.updatedAt);
  }

  /* ================================================================= */
  /* ACCUEIL                                                            */
  /* ================================================================= */
  var catFilter = 'all';
  function renderHome() {
    $('st-projects').textContent = projects.length;
    renderPlanets();
    renderCats();
    renderPosters();
    renderMedia();
    renderNews();
    renderTeam();
    renderLive();
    d.dispatchEvent(new Event('nx:rendered'));
  }

  function posterHtml(p) {
    var prog = pct(p.progress);
    var meta = [];
    if (p.version) meta.push('v' + String(p.version).replace(/^v/i, ''));
    if (p.bossList.length) meta.push(p.bossList.length + ' ' + (p.bossesTitle === 'Bestiaire' ? 'monstres' : 'boss'));
    if (p.videos.length) meta.push(p.videos.length + ' vidéo' + (p.videos.length > 1 ? 's' : ''));
    if (p.gallery.length) meta.push(p.gallery.length + ' images');
    return '<a class="poster" href="#/' + esc(p.id) + '" data-acc="' + esc(p.pc) + '" style="--pc:' + esc(p.pc) + ';background:' + esc(p.bg || '#111') + '">' +
      (safeUrl(p.banner) ? '<img class="pban" src="' + esc(safeUrl(p.banner)) + '" alt="" loading="lazy">' : '') +
      logoHtml(p, 'pimg') +
      '<span class="tag">' + esc(p.tag) + '</span>' +
      '<h3>' + esc(p.name) + '</h3><p>' + esc(p.short) + '</p>' +
      (meta.length ? '<div class="meta">' + meta.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>' : '') +
      (prog != null ? '<div class="bar" title="Avancement ' + prog + ' %"><i style="width:' + prog + '%"></i></div>' : '') +
      '<span class="go">Voir le projet</span></a>';
  }

  function renderCats() {
    var cats = [{ id: 'all', name: 'Tous' }].concat(state.base.categories || []);
    $('cat-filters').innerHTML = cats.map(function (c) {
      var n = c.id === 'all' ? projects.length : projects.filter(function (p) { return p.category === c.id; }).length;
      return n ? '<button type="button" role="tab" data-c="' + esc(c.id) + '" aria-selected="' + (catFilter === c.id) + '">' + esc(c.name) + ' <small>' + n + '</small></button>' : '';
    }).join('');
    $('cat-filters').onclick = function (e) {
      var b = e.target.closest('button[data-c]'); if (!b) return;
      catFilter = b.getAttribute('data-c'); renderCats(); renderPosters(); d.dispatchEvent(new Event('nx:rendered'));
    };
  }
  function renderPosters() {
    var list = projects.filter(function (p) { return catFilter === 'all' || p.category === catFilter; });
    $('posters').innerHTML = list.map(posterHtml).join('');
  }

  /* --- univers 3D : les projets en orbite autour du noyau --- */
  var orbit = { items: [], t: 0, raf: 0, hover: false };
  function renderPlanets() {
    var box = $('planets');
    box.innerHTML = projects.map(function (p) {
      var u = safeUrl(p.logo);
      return '<a class="planet" href="#/' + esc(p.id) + '" data-acc="' + esc(p.pc) + '" data-name="' + esc(p.name) + '" style="--pc:' + esc(p.pc) + '" aria-label="' + esc(p.name) + '">' +
        (u ? '<img src="' + esc(u) + '" alt="">' : esc(p.monogram || p.name.charAt(0))) + '</a>';
    }).join('');
    orbit.items = [].slice.call(box.children);
    if (!orbit.raf) spin();
  }
  function spin() {
    var uni = $('universe');
    function frame() {
      orbit.raf = requestAnimationFrame(frame);
      if ($('view-home').hidden) return;
      var w = uni.clientWidth; if (!w) return;
      if (!orbit.hover && !reduced) orbit.t += 0.0022;
      var n = orbit.items.length, R = w * 0.44, s = Math.max(40, w * 0.12);
      orbit.items.forEach(function (el, i) {
        var a = orbit.t + i / n * Math.PI * 2;
        var x = Math.cos(a) * R, y = Math.sin(a) * R * 0.3;
        var depth = (Math.sin(a) + 1) / 2;                 // 0 = derrière, 1 = devant
        var k = 0.58 + depth * 0.52;
        el.style.setProperty('--s', s + 'px');
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')';
        el.style.zIndex = depth > 0.5 ? 5 : 1;
        el.style.opacity = (0.45 + depth * 0.55).toFixed(2);
        el.style.filter = depth < 0.35 ? 'blur(1px)' : '';
      });
    }
    frame();
    uni.addEventListener('pointerover', function (e) {
      var pl = e.target.closest('.planet'); if (!pl) return;
      orbit.hover = true; $('u-label').textContent = pl.getAttribute('data-name');
    });
    uni.addEventListener('pointerout', function (e) {
      if (e.target.closest('.planet') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.planet'))) { orbit.hover = false; $('u-label').textContent = ''; }
    });
  }

  /* --- vidéos de tous les projets --- */
  var allMedia = [];
  function renderMedia() {
    allMedia = [];
    projects.forEach(function (p) {
      p.videos.forEach(function (v) { allMedia.push({ p: p, v: v }); });
    });
    if (!allMedia.length) { $('medias').hidden = true; return; }
    $('medias').hidden = false;
    $('media-row').innerHTML = allMedia.map(function (m, i) {
      var yt = youtubeId(m.v.src), poster = safeUrl(m.v.poster) || (yt ? 'https://i.ytimg.com/vi/' + yt + '/hqdefault.jpg' : '');
      return '<button type="button" class="mcard" data-media="' + i + '" data-acc="' + esc(m.p.pc) + '" style="--pc:' + esc(m.p.pc) + '">' +
        '<span class="thumb">' + (poster ? '<img src="' + esc(poster) + '" alt="" loading="lazy">' : '') + '<span class="play" aria-hidden="true"></span></span>' +
        '<span class="bd"><span class="ptag">' + esc(m.p.name) + '</span><b>' + esc(m.v.title || 'Vidéo') + '</b></span></button>';
    }).join('');
    $('media-row').onclick = function (e) {
      var b = e.target.closest('[data-media]'); if (!b) return;
      var i = +b.getAttribute('data-media');
      openViewer(allMedia.map(function (m) { return videoItem(m.v, m.p.name); }), i);
    };
  }

  /* --- actualités --- */
  var newsFilter = 'all', newsShown = 6;
  function renderNews() {
    var news = (state.live.news || []).slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var used = {};
    news.forEach(function (n) { if (n.project && byId[n.project]) used[n.project] = 1; });
    var tabs = [['all', 'Tout']].concat(Object.keys(used).map(function (id) { return [id, byId[id].name]; }));
    $('news-filters').innerHTML = tabs.length > 1 ? tabs.map(function (t) {
      return '<button type="button" role="tab" data-f="' + esc(t[0]) + '" aria-selected="' + (newsFilter === t[0]) + '">' + esc(t[1]) + '</button>';
    }).join('') : '';
    var list = news.filter(function (n) { return newsFilter === 'all' || n.project === newsFilter; });
    $('news').innerHTML = list.length ? newsHtml(list.slice(0, newsShown)) + (list.length > newsShown ? '<div class="more"><button class="btn sm" type="button" id="news-more">Voir plus</button></div>' : '')
      : '<div class="empty">Aucune actualité pour le moment. Les annonces publiées sur le Discord NEXORIA apparaîtront ici automatiquement.</div>';
    var more = $('news-more');
    if (more) more.onclick = function () { newsShown += 6; renderNews(); };
    $('news-filters').onclick = function (e) {
      var b = e.target.closest('button[data-f]'); if (!b) return;
      newsFilter = b.getAttribute('data-f'); newsShown = 6; renderNews();
    };
  }
  function newsHtml(list) {
    return list.map(function (n) {
      var p = byId[n.project], img = safeUrl(n.image);
      return '<article class="post"' + (p ? ' style="--pc:' + esc(p.pc) + '"' : '') + '>' +
        (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '') +
        '<div class="bd"><div class="meta"><span class="ptag">' + esc(p ? p.name : 'NEXORIA') + '</span><time datetime="' + esc(n.date) + '">' + fmtDate(n.date) + '</time>' +
        (n.author ? '<span>par ' + esc(n.author) + '</span>' : '') + '</div>' +
        '<h3>' + esc(n.title) + '</h3><p>' + esc(n.text) + '</p></div></article>';
    }).join('');
  }

  function renderTeam() {
    $('team').innerHTML = (state.base.team || []).map(function (m, i) {
      return '<article class="person"><div class="ring"><img src="' + esc(safeUrl(m.photo)) + '" alt="Photo de ' + esc(m.name) + '" width="150" height="150" loading="lazy"></div>' +
        '<h3>' + esc(m.name) + (m.alias ? '<span class="alias">' + esc(m.alias) + '</span>' : '') + '</h3>' +
        '<span class="role' + (i ? ' co' : '') + '">' + esc(m.role) + '</span>' +
        (m.bio ? '<p>' + esc(m.bio) + '</p>' : '') + '</article>';
    }).join('');
  }

  function renderLive() {
    var a = state.api, dc = a && a.discord;
    var invite = safeUrl((dc && dc.invite) || CFG.discordInvite);
    d.querySelectorAll('[data-discord]').forEach(function (el) {
      if (invite) { el.href = invite; el.target = '_blank'; el.rel = 'noopener'; }
    });
    if (!dc) {
      if (invite) $('lc-text').textContent = 'Le serveur est ouvert : rejoins-nous ! Les statistiques en direct apparaîtront quand le bot NEXORIA sera en ligne.';
      return;
    }
    var mem = Number(dc.members || 0).toLocaleString('fr-FR'), onl = Number(dc.online || 0).toLocaleString('fr-FR');
    $('st-members').textContent = mem;
    $('st-online').innerHTML = '<span class="dot on"></span>' + onl;
    $('live-card').innerHTML = '<div class="live-head">' + (safeUrl(dc.icon) ? '<img src="' + esc(safeUrl(dc.icon)) + '" alt="">' : '<span class="dot on"></span>') + '<b>' + esc(dc.name || 'NEXORIA') + '</b></div>' +
      '<p>Connecté en direct au Discord via le bot NEXORIA.</p>' +
      '<div class="live-nums"><div><b>' + mem + '</b><small>membres</small></div><div><b>' + onl + '</b><small>en ligne</small></div></div>';
  }

  /* ================================================================= */
  /* PAGE PROJET                                                        */
  /* ================================================================= */
  var current = null;
  function renderProject(id, keepScroll) {
    var p = byId[id]; if (!p) return false;
    current = id;
    var y = window.scrollY;
    var tabs = [['apercu', 'Aperçu']];
    var s = '';

    // --- en-tête ---
    var prog = progressOf(p);
    var kpis = '';
    if (prog != null) kpis += '<div class="kpi"><span class="ring-p" style="--p:' + prog + '"></span><span><b>' + prog + ' %</b><small>avancement</small></span></div>';
    if (p.version) kpis += '<div class="kpi"><span class="ic">v</span><span><b>' + esc(String(p.version).replace(/^v/i, '')) + '</b><small>version</small></span></div>';
    if (p.bossList.length) kpis += '<div class="kpi"><span class="ic">☠</span><span><b>' + p.bossList.length + '</b><small>' + (p.bossesTitle === 'Bestiaire' ? 'monstres' : 'boss') + '</small></span></div>';
    if (p.videos.length + p.gallery.length) kpis += '<div class="kpi"><span class="ic">▶</span><span><b>' + (p.videos.length + p.gallery.length) + '</b><small>médias</small></span></div>';

    var head = '<section class="phero">' +
      (safeUrl(p.banner) ? '<img class="phero-bg" src="' + esc(safeUrl(p.banner)) + '" alt="">' : '') +
      '<div class="wrap"><a class="back" href="#projets">← Tous les projets</a>' +
      '<div class="phead"><div><div class="badges"><span class="badge">' + esc(p.tag) + '</span>' +
      (p.status ? '<span class="badge">' + esc(p.status) + '</span>' : '') + '</div>' +
      '<h1>' + esc(p.name) + '</h1><p class="lead">' + esc(p.description) + '</p>' +
      linksHtml(p.links) + (kpis ? '<div class="kpis">' + kpis + '</div>' : '') + '</div>' +
      logoHtml(p, 'plogo') + '</div></div></section>';

    // --- aperçu ---
    s += '<section class="psec" id="p-apercu"><div class="wrap"><h2>Aperçu</h2>';
    if (p.server) s += serverHtml(p);
    if (p.features && p.features.length) {
      s += '<div class="feat">' + p.features.map(function (f) {
        return '<div class="box"><h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p>' +
          (f.items && f.items.length ? '<ul>' + f.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      }).join('') + '</div>';
    }
    if (p.note) s += '<p class="note">' + esc(p.note) + '</p>';
    s += '</div></section>';

    // --- boss ---
    if (p.bossList.length || Array.isArray(p.bosses)) {
      tabs.push(['boss', p.bossesTitle || 'Boss']);
      s += '<section class="psec" id="p-boss"><div class="wrap"><h2>' + esc(p.bossesTitle || 'Boss') + '</h2>' +
        (p.bossesIntro ? '<p class="lead">' + esc(p.bossesIntro) + '</p>' : '') + bossesHtml(p) + '</div></section>';
    }

    // --- avancement ---
    if (p.roadmap.length || prog != null) {
      tabs.push(['avancement', 'Avancement']);
      s += '<section class="psec" id="p-avancement"><div class="wrap"><h2>Avancement</h2>' + roadmapHtml(p, prog) + '</div></section>';
    }

    // --- vidéos ---
    if (p.videos.length) {
      tabs.push(['videos', 'Vidéos']);
      s += '<section class="psec" id="p-videos"><div class="wrap"><h2>Vidéos</h2><div class="videos">' + p.videos.map(videoHtml).join('') + '</div></div></section>';
    }

    // --- galerie ---
    if (p.gallery.length) {
      tabs.push(['galerie', 'Galerie']);
      var big = p.gallery.filter(function (g) { return !g.icon; }), icons = p.gallery.filter(function (g) { return g.icon; });
      s += '<section class="psec" id="p-galerie"><div class="wrap"><h2>' + esc(p.galleryTitle || 'Galerie') + '</h2>' +
        (big.length ? '<div class="gallery">' + big.map(galleryItem).join('') + '</div>' : '') +
        (icons.length ? (big.length ? '<p class="sub-h">Icônes</p>' : '') + '<div class="gallery icons">' + icons.map(galleryItem).join('') + '</div>' : '') +
        '</div></section>';
    }

    // --- actualités du projet ---
    var pnews = (state.live.news || []).filter(function (n) { return n.project === p.id; }).sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    if (pnews.length) {
      tabs.push(['actus', 'Actualités']);
      s += '<section class="psec" id="p-actus"><div class="wrap"><h2>Actualités</h2><div class="news">' + newsHtml(pnews.slice(0, 6)) + '</div></div></section>';
    }

    // --- projets liés + navigation ---
    var rel = (p.related || []).map(function (r) { return byId[r]; }).filter(Boolean);
    var idx = projects.indexOf(p), prev = projects[(idx - 1 + projects.length) % projects.length], next = projects[(idx + 1) % projects.length];
    s += '<section class="psec"><div class="wrap">' +
      (rel.length ? '<h2>Projets liés</h2><div class="related">' + rel.map(posterHtml).join('') + '</div><div style="height:2.5rem"></div>' : '') +
      '<div class="pnav"><a href="#/' + esc(prev.id) + '" style="--pc:' + esc(prev.pc) + '"><small>← Projet précédent</small><b>' + esc(prev.name) + '</b></a>' +
      '<a class="next" href="#/' + esc(next.id) + '" style="--pc:' + esc(next.pc) + '"><small>Projet suivant →</small><b>' + esc(next.name) + '</b></a></div></div></section>';

    var nav = tabs.length > 1 ? '<nav class="ptabs" aria-label="Sections du projet"><div class="wrap">' + tabs.map(function (t) {
      return '<a href="#p-' + t[0] + '" data-sec="p-' + t[0] + '">' + esc(t[1]) + '</a>';
    }).join('') + '</div></nav>' : '';

    var view = $('view-project');
    view.innerHTML = head + nav + s;
    view.className = keepScroll ? '' : 'view-in';
    view.gallery = p.gallery.map(function (g) { return { type: 'img', src: safeUrl(g.src || g), caption: g.alt || p.name }; });
    view.videos = p.videos.map(function (v) { return videoItem(v, p.name); });
    d.title = p.name + ' — NEXORIA';
    if (keepScroll) window.scrollTo(0, y);
    spyTabs();
    d.dispatchEvent(new Event('nx:rendered'));
    return true;
  }

  function progressOf(p) {
    var g = pct(p.progress);
    if (g != null || !p.roadmap.length) return g;
    var sum = p.roadmap.reduce(function (a, s) { return a + (s.status === 'termine' ? 100 : (pct(s.progress) || 0)); }, 0);
    return Math.round(sum / p.roadmap.length);
  }

  function linksHtml(links) {
    if (!links || !links.length) return '';
    return '<div class="btns">' + links.map(function (l, i) {
      var u = safeUrl(l.url);
      return u ? '<a class="btn' + (i ? '' : ' main') + '" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>' : '';
    }).join('') + '</div>';
  }

  function serverHtml(p) {
    var sv = p.server, ls = p.liveServer;
    var addr = (ls && ls.address) || sv.address || '';
    var status = ls ? (ls.online ? '<span class="dot on"></span>En ligne' : '<span class="dot off"></span>Hors ligne')
      : '<span class="dot"></span>' + (addr ? 'Statut indisponible' : 'Ouverture à venir');
    var h = '<div class="server">' +
      '<div><small>Serveur ' + esc(sv.game) + '</small><b>' + status + '</b></div>' +
      '<div><small>Joueurs</small><b>' + (ls && ls.online ? esc(ls.players) + ' / ' + esc(ls.maxPlayers) : '—') + '</b></div>' +
      '<div><small>Carte</small><b>' + (ls && ls.online && ls.map ? esc(ls.map) : '—') + '</b></div>' +
      '<div><small>Adresse de connexion</small><b>' + (addr ? esc(addr) + '<button class="copy" type="button" data-copy="' + esc(addr) + '">Copier</button>' : 'Annoncée sur le Discord') + '</b></div></div>';
    if (addr && ls && ls.online) h += '<div class="btns"><a class="btn main" href="steam://connect/' + esc(addr) + '">Rejoindre le serveur</a></div>';
    return h;
  }

  function bossesHtml(p) {
    var list = p.bossList;
    if (!list.length) return '<div class="empty">Les boss de ' + esc(p.name) + ' n’ont pas encore été révélés. Ils apparaîtront ici dès leur annonce sur le Discord.</div>';
    return '<div class="bosses">' + list.map(function (b) {
      var st = BOSS_LABEL[b.status] ? b.status : 'conception';
      var prog = pct(b.progress);
      var diff = Math.max(0, Math.min(5, Number(b.difficulty) || 0));
      var img = safeUrl(b.image);
      var visual = img ? '<img src="' + esc(img) + '" alt="' + (b.hidden ? 'Boss mystère' : esc(b.name)) + '" loading="lazy">'
        : (b.rank ? '<span class="rank">' + esc(b.rank) + '</span>' : '<span class="qmark">?</span>');
      return '<article class="boss' + (b.hidden ? ' hidden-boss' : '') + (img && !b.hidden && diff >= 5 ? ' featured' : '') + '">' +
        (img ? '<button type="button" class="bimg" data-zoom="' + esc(img) + '" data-cap="' + esc(b.hidden ? '???' : b.name) + '" style="border:0;padding:0;cursor:zoom-in;width:100%">' + visual + '</button>' : '<div class="bimg">' + visual + '</div>') +
        '<div class="bd"><div class="row"><span class="bstat ' + st + '">' + BOSS_LABEL[st] + '</span>' +
        (diff ? '<span class="pips" title="Difficulté ' + diff + ' sur 5"><span class="sr">Difficulté ' + diff + ' sur 5</span>' + [1, 2, 3, 4, 5].map(function (k) { return '<i' + (k <= diff ? ' class="on"' : '') + '></i>'; }).join('') + '</span>' : '') + '</div>' +
        '<h3>' + (b.hidden ? '???' : esc(b.name)) + '</h3>' +
        (b.title && !b.hidden ? '<span class="btitle">' + esc(b.title) + '</span>' : '') +
        (b.description && !b.hidden ? '<p>' + esc(b.description) + '</p>' : '') +
        (prog != null && st !== 'disponible' && st !== 'vaincu' ? '<div class="row"><span>Développement</span><span>' + prog + ' %</span></div><div class="hpbar"><i style="width:' + prog + '%"></i></div>' : '') +
        '</div></article>';
    }).join('') + '</div>';
  }

  function roadmapHtml(p, glob) {
    var h = '';
    if (glob != null) h += '<div class="global"><div class="pbar"><i style="width:' + glob + '%"></i></div><b>' + glob + ' %</b></div>';
    if (p.progressNote) h += '<p class="pnote">' + esc(p.progressNote) + '</p>';
    h += '<div class="road">' + p.roadmap.map(function (s, i) {
      var st = STEP_LABEL[s.status] ? s.status : 'a-venir';
      var pr = pct(s.progress);
      return '<div class="step ' + st + '"><span class="ic">' + (st === 'termine' ? '✓' : i + 1) + '</span><b>' + esc(s.name) + '</b>' +
        '<span class="st">' + STEP_LABEL[st] + (st === 'en-cours' && pr != null ? ' · ' + pr + ' %' : '') + '</span>' +
        (st === 'en-cours' && pr != null ? '<div class="pbar"><i style="width:' + pr + '%"></i></div>' : '') + '</div>';
    }).join('') + '</div>';
    return h;
  }

  function videoItem(v, pname) {
    var yt = youtubeId(v.src);
    return yt ? { type: 'youtube', src: yt, caption: (pname ? pname + ' — ' : '') + (v.title || '') }
      : { type: 'video', src: safeUrl(v.src), poster: safeUrl(v.poster), caption: (pname ? pname + ' — ' : '') + (v.title || '') };
  }
  function videoHtml(v) {
    var yt = youtubeId(v.src);
    var cap = v.title ? '<figcaption>' + esc(v.title) + '</figcaption>' : '';
    if (yt) return '<figure><iframe src="https://www.youtube-nocookie.com/embed/' + yt + '" title="' + esc(v.title || 'Vidéo') + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>' + cap + '</figure>';
    var src = safeUrl(v.src); if (!src) return '';
    return '<figure' + (v.vertical ? ' class="vertical"' : '') + '><video controls preload="none" playsinline' + (safeUrl(v.poster) ? ' poster="' + esc(safeUrl(v.poster)) + '"' : '') + ' src="' + esc(src) + '">Ton navigateur ne peut pas lire cette vidéo.</video>' + cap + '</figure>';
  }
  function galleryItem(g) {
    var u = safeUrl(g.src || g); if (!u) return '';
    return '<button type="button" class="' + (g.icon ? 'ic' : g.tall ? 'tall' : '') + '" data-gal="' + esc(u) + '"><img src="' + esc(u) + '" alt="' + esc(g.alt || '') + '" loading="lazy">' +
      (g.alt ? '<span class="gcap">' + esc(g.alt) + '</span>' : '') + '</button>';
  }

  /* --- onglets de la page projet --- */
  var tabObs = null;
  function spyTabs() {
    if (tabObs) tabObs.disconnect();
    var links = d.querySelectorAll('.ptabs a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    tabObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('act', a.getAttribute('data-sec') === e.target.id); });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    d.querySelectorAll('#view-project .psec[id]').forEach(function (s) { tabObs.observe(s); });
  }

  /* ================================================================= */
  /* NAVIGATION                                                         */
  /* ================================================================= */
  function route(first) {
    if (!state) return;
    var h = decodeURIComponent(location.hash || '');
    var m = h.match(/^#\/([\w-]+)/);
    var home = $('view-home'), proj = $('view-project');
    if (m && byId[m[1]]) {
      home.hidden = true; proj.hidden = false;
      setAccent(byId[m[1]].pc);
      renderProject(m[1]);
      window.scrollTo(0, 0);
      return;
    }
    current = null;
    var wasProject = !proj.hidden;
    proj.hidden = true; proj.innerHTML = ''; home.hidden = false;
    d.title = 'NEXORIA — Plusieurs projets. Plusieurs univers. Une seule vision.';
    setAccent(null);
    if (wasProject) { home.classList.remove('view-in'); void home.offsetWidth; home.classList.add('view-in'); }
    var target = h.length > 1 && h.charAt(1) !== '/' ? d.getElementById(h.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: first || wasProject ? 'auto' : 'smooth' });
    else if (!first) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function (e) {
    // Les onglets d'une page projet sont des ancres internes : on ne quitte pas la page.
    var h = location.hash;
    if (/^#p-/.test(h) && current) {
      var el = d.getElementById(h.slice(1));
      if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', '#/' + current);
      return;
    }
    route(false);
  });

  // Survol d'une carte de l'accueil : la page prend la couleur du projet.
  d.addEventListener('pointerover', function (e) {
    if ($('view-home').hidden) return;
    var el = e.target.closest && e.target.closest('[data-acc]');
    if (el) setAccent(el.getAttribute('data-acc'));
  });
  d.addEventListener('pointerout', function (e) {
    if ($('view-home').hidden) return;
    var el = e.target.closest && e.target.closest('[data-acc]');
    if (el && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-acc]'))) setAccent(null);
  });

  /* ================================================================= */
  /* VISIONNEUSE (images et vidéos)                                     */
  /* ================================================================= */
  var viewer = $('viewer'), vList = [], vIdx = 0;
  function openViewer(list, i) {
    if (!list.length) return;
    vList = list; vIdx = i || 0;
    showItem();
    if (typeof viewer.showModal === 'function') viewer.showModal(); else viewer.setAttribute('open', '');
  }
  function showItem() {
    var it = vList[vIdx], st = $('v-stage');
    if (it.type === 'img') st.innerHTML = '<img src="' + esc(it.src) + '" alt="' + esc(it.caption || '') + '">';
    else if (it.type === 'youtube') st.innerHTML = '<iframe style="width:min(100%,1100px);aspect-ratio:16/9;border:0;border-radius:12px" src="https://www.youtube-nocookie.com/embed/' + esc(it.src) + '?autoplay=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="' + esc(it.caption) + '"></iframe>';
    else st.innerHTML = '<video controls autoplay playsinline' + (it.poster ? ' poster="' + esc(it.poster) + '"' : '') + ' src="' + esc(it.src) + '"></video>';
    $('v-cap').textContent = (it.caption || '') + (vList.length > 1 ? '  ·  ' + (vIdx + 1) + ' / ' + vList.length : '');
    viewer.querySelector('.v-prev').hidden = viewer.querySelector('.v-next').hidden = vList.length < 2;
  }
  function step(n) { vIdx = (vIdx + n + vList.length) % vList.length; showItem(); }
  function closeViewer() { $('v-stage').innerHTML = ''; if (viewer.open) viewer.close(); }
  viewer.querySelector('.v-close').onclick = closeViewer;
  viewer.querySelector('.v-prev').onclick = function () { step(-1); };
  viewer.querySelector('.v-next').onclick = function () { step(1); };
  viewer.addEventListener('close', function () { $('v-stage').innerHTML = ''; });
  viewer.addEventListener('click', function (e) { if (e.target === viewer || e.target.id === 'v-stage') closeViewer(); });
  viewer.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  d.addEventListener('click', function (e) {
    var g = e.target.closest('[data-gal]');
    if (g) {
      var list = $('view-project').gallery || [];
      var i = list.map(function (x) { return x.src; }).indexOf(g.getAttribute('data-gal'));
      openViewer(list, Math.max(0, i));
      return;
    }
    var z = e.target.closest('[data-zoom]');
    if (z) { openViewer([{ type: 'img', src: z.getAttribute('data-zoom'), caption: z.getAttribute('data-cap') || '' }], 0); return; }
    var c = e.target.closest('[data-copy]');
    if (c) {
      var v = c.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () {
        c.textContent = 'Copié !'; setTimeout(function () { c.textContent = 'Copier'; }, 1500);
      }).catch(function () { window.prompt('Adresse du serveur :', v); });
    }
  });

  setAccent(null);
})();
