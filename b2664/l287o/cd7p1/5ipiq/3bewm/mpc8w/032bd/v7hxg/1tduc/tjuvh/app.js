/* OS lernen — App: Router, Fortschritt, Podcast-Player, Lerntext, Quiz, Gamification */
(function () {
  'use strict';
  var O = window.OSTEP, VIS = window.OSTEP_VIS, TIMING = window.OSTEP_TIMING || {};
  var app = document.getElementById('app');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(s) { s = Math.max(0, s || 0); return Math.floor(s / 60) + ':' + pad(Math.floor(s % 60)); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { r = r || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function kid(n) { return 'k' + pad(n); }
  /* Mini-Markdown: ```code```, `code`, **fett**, Absätze */
  function md(s) {
    s = String(s || '');
    var parts = s.split('```'), out = '';
    parts.forEach(function (p, i) {
      if (i % 2) { out += '<pre>' + esc(p.replace(/^\w*\n/, '').replace(/\n$/, '')) + '</pre>'; return; }
      out += p.split(/\n{2,}/).map(function (para) {
        if (!para.trim()) return '';
        return '<p>' + esc(para).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*\s][^*]*)\*/g, '<i>$1</i>').replace(/\n/g, '<br>') + '</p>';
      }).join('');
    });
    return out;
  }

  /* ================= Speicher ================= */
  var KEY = 'ostep-lernen-v1';
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  S = Object.assign({ voice: 'thorsten', xp: 0, q: {}, listen: {}, badges: {}, days: {}, answered: 0, correct: 0, tests: 0, perfect: 0, bestCombo: 0, goal: 100, last: null, sound: true }, S || {});
  var VOICES = [['thorsten', 'Thorsten', '🧔', 'männlich, warm'], ['karlsson', 'Karlsson', '👨', 'männlich, sachlich'], ['kerstin', 'Kerstin', '👩', 'weiblich, ruhig'], ['ramona', 'Ramona', '👩‍🦰', 'weiblich, klar'], ['eva', 'Eva', '👱‍♀️', 'weiblich, hell'], ['geraet', 'Gerätestimme', '📱', 'Sprachausgabe deines Handys']];
  function voiceInfo(id) { return VOICES.filter(function (v) { return v[0] === id; })[0] || VOICES[0]; }
  function tmOf(voice, key) { return voice === 'geraet' ? null : (TIMING[voice] || {})[key] || null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayXp() { return S.days[today()] || 0; }
  function streak() {
    var n = 0, d = new Date();
    if (!S.days[today()]) d.setDate(d.getDate() - 1);
    for (;;) { var k = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); if (!S.days[k]) break; n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function lvlInfo(xp) { var l = 1, need = 120, x = xp; while (x >= need) { x -= need; l++; need = 120 + (l - 1) * 60; } return { lvl: l, cur: x, need: need }; }
  function addXp(n, el) {
    if (n <= 0) return;
    var before = lvlInfo(S.xp).lvl;
    S.xp += n; S.days[today()] = dayXp() + n; save();
    if (el) floatXp('+' + n + ' XP', el);
    var after = lvlInfo(S.xp).lvl;
    if (after > before) setTimeout(function () { levelUp(after); }, 500);
    checkBadges();
  }

  /* ================= Fragenpool ================= */
  var poolCache = {};
  function pool(n, tid) {
    var key = n + '-' + tid; if (poolCache[key]) return poolCache[key];
    var ch = O.chapters[n], t = ch.topics.filter(function (x) { return x.id === tid; })[0], items = [];
    (t.q || []).forEach(function (q, i) { items.push({ id: key + '-q' + i, n: n, t: tid, q: q[0], a: q[1], e: q[2], s: q[3] || 0, m: q[4] || '' }); });
    if (t.st && t.st.T.length >= 3 && t.st.F.length >= 3) {
      var cnt = t.st.n || Math.min(18, Math.min(t.st.T.length, t.st.F.length) * 3);
      for (var v = 0; v < cnt; v++) {
        var r = rng(hash(key + 'st' + v)), neg = v % 3 === 2;
        var T = shuffle(t.st.T.slice(), r), F = shuffle(t.st.F.slice(), r), item;
        if (!neg) {
          var tr = T[0], fs = F.slice(0, 3);
          item = { q: 'Welche Aussage zum Thema „' + t.st.about + '“ ist **richtig**?', a: [tr[0]].concat(fs.map(function (f) { return f[0]; })),
            e: '✔ ' + tr[0] + '\n\nDie anderen Aussagen sind falsch:\n' + fs.map(function (f) { return '✘ „' + f[0] + '“ – ' + f[1]; }).join('\n'), s: tr[1] || 0, m: '' };
        } else {
          var fl = F[0], ts = T.slice(0, 3);
          item = { q: 'Welche Aussage zum Thema „' + t.st.about + '“ ist **falsch**?', a: [fl[0]].concat(ts.map(function (x) { return x[0]; })),
            e: '✘ Falsch ist: „' + fl[0] + '“\n\nRichtig wäre: ' + fl[1], s: fl[2] || 0, m: '' };
        }
        item.id = key + '-s' + v; item.n = n; item.t = tid; items.push(item);
      }
    }
    (t.gen || []).forEach(function (g, gi) {
      for (var v = 0; v < (g.n || 5); v++) {
        var r = rng(hash(key + 'g' + gi + '-' + v)), x;
        try { x = g.f(r, v); } catch (e) { continue; }
        items.push({ id: key + '-g' + gi + '-' + v, n: n, t: tid, q: x.q, a: x.a, e: x.e, s: x.s || 0, m: x.m || '' });
      }
    });
    return (poolCache[key] = items);
  }
  function box(id) { var r = S.q[id]; return r ? r.b : -1; }
  function mastery(n, tid) {
    var p = pool(n, tid); if (!p.length) return 0;
    var sum = 0; p.forEach(function (it) { var b = box(it.id); if (b > 0) sum += Math.min(b, 3) / 3; });
    return sum / p.length;
  }
  function listenOf(n, tid) { return S.listen[n + '-' + tid] || 0; }
  function chapterProgress(n) {
    var ch = O.chapters[n]; if (!ch) return 0;
    var s = 0; ch.topics.forEach(function (t) { s += mastery(n, t.id) * .8 + Math.min(1, listenOf(n, t.id) / .9) * .2; });
    return s / ch.topics.length;
  }
  function seenCount(n, tid) { return pool(n, tid).filter(function (it) { return box(it.id) >= 0; }).length; }
  /* Auswahl: erst Ungesehenes, dann Falsches, dann Wackeliges – so kommt jede Frage einmal dran */
  function pick(items, k) {
    var now = Date.now();
    var scored = items.map(function (it) {
      var r = S.q[it.id], tier = !r ? 0 : r.b === 0 ? 1 : r.b === 1 ? 2 : r.b === 2 ? 3 : 4;
      var recent = r && now - r.t < 10 * 60 * 1000 ? 2 : 0;
      return { it: it, s: tier + recent + Math.random() * .9 };
    });
    scored.sort(function (a, b) { return a.s - b.s; });
    return scored.slice(0, k).map(function (x) { return x.it; });
  }

  /* ================= Sound, Konfetti, Toast ================= */
  var AC = null;
  function audioCtx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state !== 'running') AC.resume(); return AC; }
  function tone(f, t0, d, type, vol) { var c = audioCtx(); if (!c) return; var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, c.currentTime + t0); g.gain.exponentialRampToValueAtTime(vol || .12, c.currentTime + t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + t0 + d); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + d + .05); }
  function sfx(name, combo) {
    if (!S.sound) return;
    if (name === 'ok') { var b = 660 * Math.pow(1.06, Math.min(combo || 0, 10)); tone(b, 0, .12, 'triangle', .12); tone(b * 1.5, .08, .2, 'triangle', .11); }
    else if (name === 'bad') { tone(220, 0, .18, 'square', .05); tone(165, .12, .25, 'square', .05); }
    else if (name === 'win') { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * .09, .3, 'triangle', .12); }); }
    else if (name === 'lvl') { [392, 523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(f, i * .07, .35, 'triangle', .11); }); }
    else if (name === 'tap') tone(900, 0, .04, 'sine', .05);
  }
  var toastT;
  function toast(msg, ms) { var t = $('#toast'); t.innerHTML = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 2600); }
  function floatXp(txt, el) {
    var r = el.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'xp-float'; d.textContent = txt; d.style.left = (r.left + r.width / 2 - 30) + 'px'; d.style.top = (r.top) + 'px';
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1000);
  }
  var cf = $('#confetti'), cfx = cf.getContext('2d'), parts = [], cfRun = false;
  function confetti(n) {
    cf.width = innerWidth * (devicePixelRatio || 1); cf.height = innerHeight * (devicePixelRatio || 1);
    var cols = ['#7c5cff', '#ff5fa2', '#ffb347', '#4cc9ff', '#2fd17c', '#ffd166'];
    for (var i = 0; i < (n || 120); i++) parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 15 - 4, r: Math.random() * 6, c: cols[i % 6], s: 4 + Math.random() * 5, life: 1 });
    if (!cfRun) { cfRun = true; requestAnimationFrame(cfLoop); }
  }
  function cfLoop() {
    var d = devicePixelRatio || 1; cfx.setTransform(d, 0, 0, d, 0, 0); cfx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < innerHeight + 20; });
    parts.forEach(function (p) { p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += .15; p.life -= .006; cfx.save(); cfx.translate(p.x, p.y); cfx.rotate(p.r); cfx.globalAlpha = Math.min(1, p.life * 2); cfx.fillStyle = p.c; cfx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cfx.restore(); });
    if (parts.length) requestAnimationFrame(cfLoop); else { cfRun = false; cfx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function levelUp(l) {
    sfx('lvl'); confetti(180);
    var d = document.createElement('div'); d.className = 'levelup';
    d.innerHTML = '<div class="box"><div style="font-weight:900;color:#ffd166;letter-spacing:.15em;font-size:13px">LEVEL UP</div><div class="lv grad-text">' + l + '</div><p style="color:#d8d5f5;margin:10px 0 18px">Stark! Du bist jetzt auf Level ' + l + '.</p><button class="btn main block">Weiter so 🚀</button></div>';
    document.body.appendChild(d); d.querySelector('button').onclick = function () { d.remove(); };
  }

  /* ================= Abzeichen ================= */
  var BADGES = [
    ['first', '🌱', 'Erste Schritte', 'Erste richtige Antwort', function () { return S.correct >= 1; }],
    ['test1', '📝', 'Testpilot', 'Ersten Test abgeschlossen', function () { return S.tests >= 1; }],
    ['perfect', '💯', 'Fehlerfrei', 'Einen Test ohne Fehler', function () { return S.perfect >= 1; }],
    ['combo10', '⚡', 'Combo-König', '10 richtige am Stück', function () { return S.bestCombo >= 10; }],
    ['streak3', '🔥', 'Dranbleiber', '3 Tage Serie', function () { return streak() >= 3; }],
    ['streak7', '🌋', 'Wochen-Held', '7 Tage Serie', function () { return streak() >= 7; }],
    ['q100', '🧠', 'Hundert', '100 Fragen beantwortet', function () { return S.answered >= 100; }],
    ['q500', '🏋️', 'Fleißig', '500 Fragen beantwortet', function () { return S.answered >= 500; }],
    ['q1000', '🦾', 'Unaufhaltsam', '1000 Fragen beantwortet', function () { return S.answered >= 1000; }],
    ['pod1', '🎧', 'Zuhörer', 'Ersten Podcast gehört', function () { return Object.keys(S.listen).some(function (k) { return S.listen[k] >= .9; }); }],
    ['pod10', '📻', 'Podcast-Fan', '10 Podcasts gehört', function () { return Object.keys(S.listen).filter(function (k) { return S.listen[k] >= .9; }).length >= 10; }],
    ['lvl5', '⭐', 'Level 5', 'Level 5 erreicht', function () { return lvlInfo(S.xp).lvl >= 5; }],
    ['lvl10', '🌟', 'Level 10', 'Level 10 erreicht', function () { return lvlInfo(S.xp).lvl >= 10; }],
    ['ch1', '👑', 'Kapitel-Meister', 'Ein Kapitel zu 90 % gemeistert', function () { return O.meta.some(function (m) { return O.chapters[m.n] && chapterProgress(m.n) >= .9; }); }],
    ['cpu', '🖥️', 'CPU-Profi', 'Kapitel 4–8 zu 80 %', function () { return [4, 5, 6, 7, 8].every(function (n) { return O.chapters[n] && chapterProgress(n) >= .8; }); }],
    ['mem', '💾', 'Speicher-Profi', 'Kapitel 13–21 zu 80 %', function () { return [13, 14, 15, 17, 18, 19, 20, 21].every(function (n) { return O.chapters[n] && chapterProgress(n) >= .8; }); }],
    ['night', '🦉', 'Nachteule', 'Nach 23 Uhr gelernt', function () { return !!S.flagNight; }],
    ['early', '🌅', 'Frühaufsteher', 'Vor 7 Uhr gelernt', function () { return !!S.flagEarly; }]
  ];
  function checkBadges() {
    var h = new Date().getHours(); if (h >= 23) S.flagNight = 1; if (h < 7) S.flagEarly = 1;
    BADGES.forEach(function (b) {
      if (!S.badges[b[0]] && b[4]()) { S.badges[b[0]] = Date.now(); save(); setTimeout(function () { toast(b[1] + ' Abzeichen freigeschaltet: <b>' + b[2] + '</b>', 3200); sfx('win'); }, 900); }
    });
  }

  /* ================= Bausteine ================= */
  function ring(pct, size, stroke, color, label) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '"><circle class="bg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (color || 'url(#rg)') + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - Math.min(1, pct)) + '"/></svg><b>' + (label === undefined ? Math.round(pct * 100) + '%' : label) + '</b></div>';
  }
  function topBar() {
    var L = lvlInfo(S.xp), st = streak();
    return '<div class="top"><div class="lvl"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="5"/><circle cx="26" cy="26" r="22" fill="none" stroke="#ffd166" stroke-width="5" stroke-linecap="round" stroke-dasharray="138.2" stroke-dashoffset="' + 138.2 * (1 - L.cur / L.need) + '"/></svg><b>' + L.lvl + '</b></div>' +
      '<div class="top-mid"><small>Level ' + L.lvl + ' · ' + L.cur + ' / ' + L.need + ' XP</small><div class="xpbar"><i style="width:' + (L.cur / L.need * 100) + '%"></i></div></div>' +
      '<span class="chip fire ' + (st ? 'on' : '') + '">🔥 ' + st + '</span><span class="chip">⚡ ' + S.xp + '</span></div>';
  }
  function chapterRow(m) {
    var has = !!O.chapters[m.n], pr = has ? chapterProgress(m.n) : 0;
    return '<a class="ch ' + (has ? '' : 'locked') + '" href="' + (has ? '#/k/' + m.n : 'javascript:void 0') + '"><div class="num" style="background:' + m.color + '">' + m.n + '</div><div class="meta"><b>' + esc(m.title) + '</b><small>' + esc(m.short) + '</small></div>' +
      (has ? (pr >= .9 ? '<span class="crown">👑</span>' : '') + ring(pr, 46, 5, m.color) : '<small style="color:var(--faint)">folgt</small>') + '</a>';
  }
  function recommend() {
    /* nächstes sinnvolles Thema: erst hören, dann üben */
    for (var i = 0; i < O.meta.length; i++) {
      var n = O.meta[i].n, ch = O.chapters[n]; if (!ch) continue;
      for (var j = 0; j < ch.topics.length; j++) {
        var t = ch.topics[j];
        if (listenOf(n, t.id) < .9) return { n: n, t: t, mode: 'lernen', label: '🎧 Podcast hören' };
        if (mastery(n, t.id) < .67) return { n: n, t: t, mode: 'quiz', label: '🎯 Quiz üben' };
      }
    }
    return null;
  }

  /* ================= Ansichten ================= */
  function viewHome() {
    var g = Math.min(1, dayXp() / S.goal), rec = recommend(), h = new Date().getHours();
    var hi = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
    var html = topBar() +
      '<div class="hero"><div class="row"><h1>' + hi + '! 👋</h1><p>' + (dayXp() >= S.goal ? 'Tagesziel geschafft – stark! Jede weitere Frage festigt dein Wissen.' : 'Noch ' + (S.goal - dayXp()) + ' XP bis zu deinem Tagesziel.') + '</p></div>' +
      '<div class="goal">' + ring(g, 70, 8, '#ffd166', Math.round(g * 100) + '%') + '<div style="flex:1">' +
      (rec ? '<div style="font-size:13px;color:#d8d5f5;font-weight:700">Als Nächstes · Kapitel ' + rec.n + '</div><div style="font-weight:900;font-size:17px;margin:2px 0 10px">' + esc(rec.t.title) + '</div><a class="btn main block" href="#/k/' + rec.n + '/' + rec.mode + '/' + rec.t.id + '">' + rec.label + '</a>'
        : '<div style="font-weight:900">Alles gemeistert! 🏆</div>') + '</div></div></div>';
    var started = O.meta.filter(function (m) { return O.chapters[m.n] && chapterProgress(m.n) > 0; });
    if (started.length) html += '<div class="sec-title"><h2>Weitermachen</h2></div><div class="chapters">' + started.slice(0, 4).map(chapterRow).join('') + '</div>';
    html += '<div class="sec-title"><h2>Alle Kapitel</h2><small>' + O.meta.length + ' Kapitel</small></div>' + chapterList();
    app.innerHTML = html;
  }
  function chapterList() {
    var html = '', part = '';
    O.meta.forEach(function (m) { if (m.part !== part) { part = m.part; html += (html ? '</div>' : '') + '<div class="part-label">' + esc(part) + '</div><div class="chapters">'; } html += chapterRow(m); });
    html += '</div><div class="part-label">Demnächst</div><div class="chapters">' + O.soon.map(function (s) { return '<div class="ch locked"><div class="num" style="background:#3a3f6b">' + s.n + '</div><div class="meta"><b>' + esc(s.title) + '</b><small>wird ergänzt</small></div></div>'; }).join('') + '</div>';
    return html;
  }
  function viewChapters() { app.innerHTML = topBar() + '<div class="sec-title"><h2>Kapitel</h2></div>' + chapterList(); }
  function viewChapter(n, tab) {
    var ch = O.chapters[n], m = O.meta.filter(function (x) { return x.n === +n; })[0];
    if (!ch) { app.innerHTML = '<div class="empty">Kapitel nicht gefunden.</div>'; return; }
    tab = tab || sessionStorage.getItem('ostep-tab') || 'lernen';
    var pr = chapterProgress(n);
    var html = '<a class="back" href="#/">‹ Übersicht</a>' +
      '<div class="hero" style="background:linear-gradient(140deg,' + m.color + '55,#1a1e38 70%)"><div class="row" style="display:flex;gap:14px;align-items:center"><div style="flex:1"><div style="font-size:13px;font-weight:900;color:#d8d5f5;letter-spacing:.1em">KAPITEL ' + n + '</div><h1>' + esc(m.title) + '</h1><p>' + esc(m.short) + '</p></div>' + ring(pr, 78, 8, '#ffd166') + '</div></div>' +
      '<div class="seg"><button data-tab="lernen" class="' + (tab === 'lernen' ? 'on' : '') + '">🎧 Lernen</button><button data-tab="quiz" class="' + (tab === 'quiz' ? 'on' : '') + '">🎯 Quiz</button></div><div class="topics">';
    ch.topics.forEach(function (t, i) {
      var ma = mastery(n, t.id), li = listenOf(n, t.id), dur = (tmOf(S.voice, kid(n) + '-' + t.id) || tmOf('thorsten', kid(n) + '-' + t.id) || {}).d;
      if (tab === 'lernen') html += '<a class="topic" href="#/k/' + n + '/lernen/' + t.id + '"><div class="ic">' + t.icon + '</div><div class="meta"><b>' + esc(t.title) + '</b><small>' + (dur ? '🎧 ' + fmt(dur) + ' · ' : '') + t.segs.length + ' Abschnitte' + (li >= .9 ? ' · ✓ gehört' : '') + '</small><div class="mini-bar listen"><i style="width:' + Math.min(100, li * 100) + '%"></i></div></div><span style="font-size:22px">' + (li >= .9 ? '✅' : '▶️') + '</span></a>';
      else html += '<a class="topic" href="#/k/' + n + '/quiz/' + t.id + '"><div class="ic">' + t.icon + '</div><div class="meta"><b>' + esc(t.title) + '</b><small>' + Math.round(ma * 100) + ' % gemeistert · ' + seenCount(n, t.id) + '/' + pool(n, t.id).length + ' Fragen gesehen</small><div class="mini-bar"><i style="width:' + ma * 100 + '%"></i></div></div><span style="font-size:22px">' + (ma >= .9 ? '👑' : '🎯') + '</span></a>';
    });
    html += '</div>';
    if (tab === 'quiz') {
      var tot = ch.topics.reduce(function (a, t) { return a + pool(n, t.id).length; }, 0);
      html += '<a class="big-quiz" href="#/k/' + n + '/quiz/alle"><div class="ic">🏆</div><div style="flex:1"><b style="font-size:17px">Großes Kapitel-Quiz</b><div style="color:#d8d5f5;font-size:13px;font-weight:600">20 Fragen aus allen ' + tot + ' Fragen des Kapitels</div></div><span style="font-size:22px">›</span></a>';
    } else html += '<p style="color:var(--dim);font-size:13px;text-align:center;margin-top:16px">Tipp: Erst den Podcast hören, dann im Quiz festigen. 🎧 → 🎯</p>';
    app.innerHTML = html;
    $$('.seg button').forEach(function (b) { b.onclick = function () { sessionStorage.setItem('ostep-tab', b.dataset.tab); sfx('tap'); viewChapter(n, b.dataset.tab); }; });
  }
  function viewBadges() {
    var L = lvlInfo(S.xp), got = BADGES.filter(function (b) { return S.badges[b[0]]; }).length;
    var html = topBar() + '<div class="stat-grid"><div><b>' + L.lvl + '</b><small>Level</small></div><div><b>' + streak() + '🔥</b><small>Tage Serie</small></div><div><b>' + (S.answered ? Math.round(S.correct / S.answered * 100) : 0) + '%</b><small>Trefferquote</small></div><div><b>' + S.answered + '</b><small>Antworten</small></div><div><b>' + S.tests + '</b><small>Tests</small></div><div><b>' + S.bestCombo + '</b><small>beste Combo</small></div></div>' +
      '<div class="sec-title"><h2>Abzeichen</h2><small>' + got + ' / ' + BADGES.length + '</small></div><div class="badges">' +
      BADGES.map(function (b) { return '<div class="badge ' + (S.badges[b[0]] ? '' : 'off') + '"><div class="e">' + b[1] + '</div><b>' + b[2] + '</b><small>' + b[3] + '</small></div>'; }).join('') + '</div>' +
      '<div class="sec-title"><h2>Einstellungen</h2></div><div class="card" style="display:grid;gap:10px">' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Tagesziel <select id="goal" style="font:inherit;background:var(--card2);color:var(--text);border:1px solid var(--line2);border-radius:10px;padding:6px 8px">' + [50, 100, 200, 300].map(function (g) { return '<option ' + (S.goal === g ? 'selected' : '') + ' value="' + g + '">' + g + ' XP</option>'; }).join('') + '</select></label>' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Podcast-Stimme <select id="vc" style="font:inherit;background:var(--card2);color:var(--text);border:1px solid var(--line2);border-radius:10px;padding:6px 8px">' + VOICES.map(function (v) { return '<option ' + (S.voice === v[0] ? 'selected' : '') + ' value="' + v[0] + '">' + v[2] + ' ' + v[1] + '</option>'; }).join('') + '</select></label>' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Soundeffekte <input type="checkbox" id="snd" ' + (S.sound ? 'checked' : '') + ' style="width:22px;height:22px;accent-color:#ff5fa2"></label></div>';
    app.innerHTML = html;
    $('#goal').onchange = function () { S.goal = +this.value; save(); };
    $('#snd').onchange = function () { S.sound = this.checked; save(); };
    $('#vc').onchange = function () { S.voice = this.value; save(); toast('🗣️ Stimme: ' + voiceInfo(S.voice)[1]); };
  }

  /* ================= Podcast-Player ================= */
  var P = null;
  function stopPlayer() {
    if (!P) return;
    if (P.audio) { P.audio.pause(); P.audio.src = ''; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    cancelAnimationFrame(P.raf); P = null;
    document.body.classList.remove('immersive');
  }
  function viewLearn(n, tid, startSeg) {
    var ch = O.chapters[n], t = ch && ch.topics.filter(function (x) { return x.id === tid; })[0];
    if (!t) return viewChapter(n);
    var tm = tmOf(S.voice, kid(n) + '-' + tid);
    document.body.classList.add('immersive');
    var idx = ch.topics.indexOf(t), next = ch.topics[idx + 1];
    app.innerHTML = '<a class="back" href="#/k/' + n + '">‹ Kapitel ' + n + '</a><div class="player">' +
      '<div class="stage-wrap"><div class="stage"><svg class="vis" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet"></svg></div><div class="subs" id="cap"></div></div>' +
      '<div class="ptitle"><small>Kapitel ' + n + ' · Thema ' + (idx + 1) + '/' + ch.topics.length + '</small><h1>' + t.icon + ' ' + esc(t.title) + '</h1><div class="segnow" id="segh"></div></div>' +
      (tm || S.voice === 'geraet' ? '' : '<div class="audio-missing">🔈 Für diese Stimme fehlt die Aufnahme noch – es wird die Sprachausgabe deines Geräts verwendet.</div>') +
      '<div class="scrub"><input type="range" id="seek" min="0" max="1000" value="0" aria-label="Position"><div class="times"><span id="tcur">0:00</span><span id="ttot">' + (tm ? fmt(tm.d) : '') + '</span></div></div>' +
      '<div class="controls"><button class="c" id="back15">−15</button><button class="c play" id="play" aria-label="Abspielen">▶</button><button class="c" id="fwd15">+15</button></div>' +
      '<div class="prow"><button class="btn sm" id="voice">' + voiceInfo(S.voice)[2] + ' ' + voiceInfo(S.voice)[1] + '</button><button class="btn sm" id="speed">1×</button><button class="btn sm" id="text">📄 Text</button><a class="btn sm" href="#/k/' + n + '/quiz/' + tid + '">🎯 Quiz</a>' + (next ? '<a class="btn sm" href="#/k/' + n + '/lernen/' + next.id + '">Weiter ›</a>' : '') + '</div>' +
      '<div class="segs" id="segs">' + t.segs.map(function (s, i) { return '<button data-i="' + i + '">' + (i + 1) + '. ' + esc(s.h) + '</button>'; }).join('') + '</div></div>' +
      '<div class="sheet" id="sheet"><div class="panel"><div class="grab"></div><div class="article" id="art"></div></div></div>';
    var svg = $('.vis'), segh = $('#segh'), cap = $('#cap'), seek = $('#seek'), playB = $('#play');
    P = { n: n, t: t, tm: tm, cur: 0, segP: 0, speed: 1, playing: false, seeking: false, startT: performance.now() };
    var key = n + '-' + tid;
    if (tm) {
      var au = new Audio(); au.preload = 'metadata'; au.src = 'audio/' + S.voice + '/' + kid(n) + '-' + tid + '.m4a?v=' + (tm.v || 1);
      if (startSeg) { au.addEventListener('loadedmetadata', function () { au.currentTime = tm.s[startSeg] || 0; au.play().catch(function () {}); }, { once: true }); }
      P.audio = au;
      au.addEventListener('play', function () { P.playing = true; playB.textContent = '❚❚'; });
      au.addEventListener('pause', function () { P.playing = false; playB.textContent = '▶'; });
      au.addEventListener('ended', function () { markListened(key, 1); toast('🎧 Thema fertig gehört! +30 XP'); });
      au.addEventListener('loadedmetadata', function () { $('#ttot').textContent = fmt(au.duration); });
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'Kapitel ' + n + ' · ' + O.meta.filter(function (x) { return x.n === +n; })[0].title, album: 'OS lernen' });
        navigator.mediaSession.setActionHandler('play', function () { au.play(); });
        navigator.mediaSession.setActionHandler('pause', function () { au.pause(); });
        navigator.mediaSession.setActionHandler('seekbackward', function () { au.currentTime = Math.max(0, au.currentTime - 15); });
        navigator.mediaSession.setActionHandler('seekforward', function () { au.currentTime = Math.min(au.duration, au.currentTime + 15); });
      }
    }
    function segAt(time) { var st = tm.s, i = 0; while (i < st.length - 1 && time >= st[i + 1]) i++; return i; }
    function curTime() { return P.audio ? P.audio.currentTime : 0; }
    function frame() {
      if (!P) return;
      var time, i, p;
      if (tm) {
        time = curTime(); i = segAt(time);
        var s0 = tm.s[i], s1 = i + 1 < tm.s.length ? tm.s[i + 1] : tm.d; p = (time - s0) / Math.max(.1, s1 - s0);
        if (!P.seeking) seek.value = Math.round(time / tm.d * 1000);
        $('#tcur').textContent = fmt(time);
        if (P.playing) markListened(key, time / tm.d);
      } else { i = P.cur; p = P.segP; }
      if (i !== P.shownSeg) {
        P.shownSeg = i; segh.textContent = (i + 1) + ' · ' + t.segs[i].h;
        $$('#segs button').forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); });
        var b = $('#segs button[data-i="' + i + '"]'); if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        P.sents = sentences(t.segs[i].t); P.sentShown = -1;
        $$('#art section').forEach(function (sct, k) { sct.classList.toggle('now', k === i); });
      }
      if (P.sents && P.sents.list.length) {
        var target = Math.max(0, Math.min(1, p)) * P.sents.total, si = 0;
        while (si < P.sents.list.length - 1 && P.sents.cum[si + 1] <= target) si++;
        if (si !== P.sentShown) { P.sentShown = si; cap.textContent = P.sents.list[si]; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
      }
      VIS.render(svg, t.segs[i].v || { type: 'points', items: [['💡', t.segs[i].h]] }, p, (performance.now() - P.startT) / 1000);
      P.raf = requestAnimationFrame(frame);
    }
    /* Fallback ohne Audiodatei: Sprachausgabe des Geräts */
    function speakFrom(i) {
      if (!window.speechSynthesis) { toast('Keine Sprachausgabe verfügbar'); return; }
      speechSynthesis.cancel(); P.cur = i; P.segP = 0;
      var u = new SpeechSynthesisUtterance(spoken(t.segs[i])); u.lang = 'de-DE'; u.rate = P.speed;
      var de = speechSynthesis.getVoices().filter(function (v) { return /^de/i.test(v.lang); }); if (de.length) u.voice = de[0];
      var len = u.text.length, st = performance.now();
      u.onboundary = function (e) { if (e.charIndex) P.segP = e.charIndex / len; };
      u.onend = function () { if (!P || !P.playing) return; if (i + 1 < t.segs.length) speakFrom(i + 1); else { P.playing = false; playB.textContent = '▶'; markListened(key, 1); } };
      P.playing = true; playB.textContent = '❚❚';
      markListened(key, (i + 1) / t.segs.length * .99);
      speechSynthesis.speak(u);
      var tick = function () { if (P && P.playing && P.cur === i && P.segP < .98) { P.segP = Math.min(.98, Math.max(P.segP, (performance.now() - st) / (len * 62 / P.speed))); requestAnimationFrame(tick); } };
      tick();
    }
    playB.onclick = function () {
      sfx('tap');
      if (tm) { if (P.audio.paused) P.audio.play().catch(function () { toast('Tippe nochmal auf ▶'); }); else P.audio.pause(); }
      else { if (P.playing) { P.playing = false; speechSynthesis.cancel(); playB.textContent = '▶'; } else speakFrom(P.cur); }
    };
    $('#back15').onclick = function () { if (tm) P.audio.currentTime = Math.max(0, P.audio.currentTime - 15); else speakFrom(Math.max(0, P.cur - 1)); };
    $('#fwd15').onclick = function () { if (tm) P.audio.currentTime = Math.min(tm.d, P.audio.currentTime + 15); else speakFrom(Math.min(t.segs.length - 1, P.cur + 1)); };
    seek.addEventListener('input', function () { P.seeking = true; if (tm) $('#tcur').textContent = fmt(seek.value / 1000 * tm.d); });
    seek.addEventListener('change', function () { P.seeking = false; if (tm) P.audio.currentTime = seek.value / 1000 * tm.d; else speakFrom(Math.floor(seek.value / 1000 * t.segs.length)); });
    var speeds = [1, 1.25, 1.5, 1.75, 2, .75];
    $('#speed').onclick = function () { P.speed = speeds[(speeds.indexOf(P.speed) + 1) % speeds.length]; this.textContent = P.speed + '×'; if (P.audio) { P.audio.playbackRate = P.speed; } };
    $$('#segs button').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; if (tm) { P.audio.currentTime = tm.s[i] + .01; if (P.audio.paused) P.audio.play(); } else speakFrom(i); }; });
    $('#voice').onclick = function () {
      var cur = P.shownSeg || 0;
      openSheetHtml('<h1 style="font-size:20px">🗣️ Stimme wählen</h1><p class="lead">Wer soll dir den Podcast vorlesen?</p><div style="display:grid;gap:8px">' + VOICES.map(function (v) {
        return '<button class="topic" data-v="' + v[0] + '" style="text-align:left;' + (v[0] === S.voice ? 'border-color:#ff5fa2;background:rgba(255,95,162,.12)' : '') + '"><div class="ic">' + v[2] + '</div><div class="meta"><b>' + v[1] + '</b><small>' + v[3] + '</small></div>' + (v[0] === S.voice ? '✓' : '') + '</button>';
      }).join('') + '</div>', function (box) {
        $$('[data-v]', box).forEach(function (b) { b.onclick = function () { S.voice = b.dataset.v; save(); sfx('tap'); closeSheets(); stopPlayer(); viewLearn(n, tid, cur); }; });
      });
    };
    $('#art').innerHTML = articleHtml(n, t, -1, '');
    $('#text').onclick = function () { $('#sheet').classList.add('on'); var now = $('#art section.now'); if (now) setTimeout(function () { now.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 300); };
    $('#sheet').onclick = function (e) { if (e.target.id === 'sheet') this.classList.remove('on'); };
    P.raf = requestAnimationFrame(frame);
  }
  function sentences(s) {
    s = String(s).replace(/```[\s\S]*?```/g, ' ').replace(/[`*]/g, '').replace(/\s+/g, ' ').trim();
    var list = s.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [s], merged = [];
    list.forEach(function (x) { x = x.trim(); if (!x) return; if (merged.length && (merged[merged.length - 1].length < 28 || /\b(z|d|u|bzw|ca|Nr)\.$/.test(merged[merged.length - 1]))) merged[merged.length - 1] += ' ' + x; else merged.push(x); });
    var cum = [], tot = 0; merged.forEach(function (x) { cum.push(tot); tot += x.length + 12; });
    return { list: merged, cum: cum, total: tot };
  }
  function openSheetHtml(html, bind) {
    var d = document.createElement('div'); d.className = 'sheet on voice-sheet';
    d.innerHTML = '<div class="panel"><div class="grab"></div><div class="article">' + html + '</div></div>';
    document.body.appendChild(d);
    d.onclick = function (e) { if (e.target === d) d.remove(); };
    if (bind) bind(d);
  }
  function closeSheets() { $$('.voice-sheet').forEach(function (x) { x.remove(); }); }
  function firstSentence(s) { s = String(s).replace(/```[\s\S]*?```/g, '').replace(/[`*]/g, ''); var m = s.match(/^(.{20,160}?[.!?:])(\s|$)/); return m ? m[1] : s.slice(0, 150); }
  function spoken(seg) { return String(seg.say || seg.t).replace(/```[\s\S]*?```/g, ' ').replace(/[`*]/g, '').replace(/\(\)/g, ''); }
  function markListened(key, f) {
    var before = S.listen[key] || 0;
    if (f > before) {
      S.listen[key] = Math.min(1, f);
      if (before < .9 && f >= .9) { addXp(30, $('#play')); confetti(80); sfx('win'); }
      if (Math.floor(f * 20) !== Math.floor(before * 20)) save();
    }
  }

  /* ================= Lerntext ================= */
  function articleHtml(n, t, target, mark) {
    return '<h1>' + t.icon + ' ' + esc(t.title) + '</h1><p class="lead">Kapitel ' + n + ' · ' + esc(t.sum || '') + '</p>' +
      t.segs.map(function (s, i) {
        var body = md(s.t);
        if (i === target && mark) { var re = new RegExp('(' + mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i'); body = body.replace(re, '<mark>$1</mark>'); }
        return '<section id="s' + i + '" class="' + (i === target ? 'target' : '') + '"><h3>' + (i + 1) + '. ' + esc(s.h) + '</h3>' + body + (s.keys ? '<div class="keys">' + s.keys.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>' : '') + '</section>';
      }).join('');
  }
  function viewText(n, tid, seg, mark) {
    var ch = O.chapters[n], t = ch && ch.topics.filter(function (x) { return x.id === tid; })[0];
    if (!t) return viewChapter(n);
    app.innerHTML = '<a class="back" href="#/k/' + n + '">‹ Kapitel ' + n + '</a><div class="article">' + articleHtml(n, t, seg, mark) + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:18px"><a class="btn main" style="flex:1" href="#/k/' + n + '/lernen/' + tid + '">🎧 Podcast</a><a class="btn" style="flex:1" href="#/k/' + n + '/quiz/' + tid + '">🎯 Quiz</a></div>';
    var el = document.getElementById('s' + seg);
    if (el) setTimeout(function () { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 250);
  }

  /* ================= Quiz ================= */
  var Q = null;
  function viewQuiz(n, tid) {
    var ch = O.chapters[n]; if (!ch) return;
    var items, title;
    if (tid === 'alle') { items = []; ch.topics.forEach(function (t) { items = items.concat(pool(n, t.id)); }); items = pick(items, 20); title = 'Kapitel-Quiz'; }
    else { var t = ch.topics.filter(function (x) { return x.id === tid; })[0]; if (!t) return; items = pick(pool(n, tid), 15); title = t.title; }
    items = items.map(function (it) { var order = shuffle(it.a.map(function (_, i) { return i; })); return Object.assign({}, it, { order: order }); });
    Q = { n: n, tid: tid, title: title, items: items, i: 0, ok: 0, combo: 0, maxCombo: 0, xp: 0, wrong: [], masteryBefore: tid === 'alle' ? chapterProgress(n) : mastery(n, tid) };
    document.body.classList.add('immersive');
    renderQ();
  }
  function renderQ() {
    var it = Q.items[Q.i], ch = O.chapters[Q.n], t = ch.topics.filter(function (x) { return x.id === it.t; })[0];
    var isNew = box(it.id) < 0;
    app.innerHTML = '<div class="qtop"><a class="x" href="#/k/' + Q.n + '" aria-label="Beenden">✕</a><div class="qprog"><i style="width:' + (Q.i / Q.items.length * 100) + '%"></i></div><div class="combo" id="combo">' + (Q.combo >= 2 ? '🔥×' + Q.combo : '') + '</div></div>' +
      '<div class="qcard"><div class="qmeta"><span>' + (Q.i + 1) + ' / ' + Q.items.length + ' · ' + esc(t.title) + '</span><span>' + (isNew ? '✨ neu' : box(it.id) === 0 ? '↻ Wiederholung' : '') + '</span></div>' +
      '<div class="qtext">' + md(it.q) + '</div><div class="opts">' +
      it.order.map(function (ai, k) { return '<button class="opt" data-a="' + ai + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + md(it.a[ai]).replace(/^<p>|<\/p>$/g, '') + '</span></button>'; }).join('') +
      '</div></div><div class="fb" id="fb"></div>';
    $$('.opt').forEach(function (b) { b.onclick = function () { answer(+b.dataset.a, b); }; });
  }
  function answer(ai, btn) {
    var it = Q.items[Q.i], right = ai === 0;
    $$('.opt').forEach(function (b) { b.disabled = true; var a = +b.dataset.a; if (a === 0) b.classList.add('right'); else if (b === btn) b.classList.add('wrong'); else b.classList.add('dim'); });
    var r = S.q[it.id] || { b: 0, n: 0, c: 0, t: 0 };
    r.n++; r.t = Date.now();
    S.answered++;
    var gain = 0;
    if (right) {
      r.b = Math.min(5, (S.q[it.id] ? r.b : 0) + 1); r.c++; S.correct++;
      Q.ok++; Q.combo++; Q.maxCombo = Math.max(Q.maxCombo, Q.combo); S.bestCombo = Math.max(S.bestCombo, Q.combo);
      gain = 10 + Math.min(Q.combo - 1, 5) * 2;
      sfx('ok', Q.combo);
      if (Q.combo === 5 || Q.combo === 10 || Q.combo === 15) { confetti(60); toast('🔥 ' + Q.combo + 'er-Combo! Bonus-XP!'); }
    } else { r.b = 0; Q.combo = 0; Q.wrong.push(it); sfx('bad'); if (navigator.vibrate) navigator.vibrate(60); }
    S.q[it.id] = r; save();
    if (gain) { Q.xp += gain; addXp(gain, btn); }
    var c = $('#combo'); c.textContent = Q.combo >= 2 ? '🔥×' + Q.combo : ''; c.classList.remove('pop'); void c.offsetWidth; if (Q.combo >= 2) c.classList.add('pop');
    var praise = ['Richtig!', 'Super!', 'Stark!', 'Genau so!', 'Perfekt!', 'Klasse!', 'Volltreffer!'], comfort = ['Nicht ganz.', 'Knapp daneben.', 'Fast!', 'Das sitzt beim nächsten Mal.'];
    var fb = $('#fb');
    fb.className = 'fb ' + (right ? 'good' : 'bad');
    fb.innerHTML = '<div class="inner"><h3>' + (right ? '✅ ' + praise[Math.floor(Math.random() * praise.length)] + (gain ? ' <span style="color:#ffd166;font-size:15px">+' + gain + ' XP</span>' : '') : '💡 ' + comfort[Math.floor(Math.random() * comfort.length)]) + '</h3>' +
      (right ? '' : '<div style="font-weight:800;margin-top:6px">Richtig ist: <span style="color:#7ff0b2">' + md(it.a[0]).replace(/^<p>|<\/p>$/g, '') + '</span></div>') +
      '<div class="ex">' + md(it.e) + '</div><div class="row"><button class="info" id="info" title="Im Lerntext nachlesen">i</button><button class="btn ' + (right ? 'ok' : 'main') + ' block" id="next">' + (Q.i + 1 < Q.items.length ? 'Weiter' : 'Auswertung') + '</button></div></div>';
    requestAnimationFrame(function () { fb.classList.add('on'); });
    $('#info').onclick = function () {
      var url = location.href.split('#')[0] + '#/k/' + it.n + '/text/' + it.t + '/' + (it.s || 0) + (it.m ? '?m=' + encodeURIComponent(it.m) : '');
      window.open(url, '_blank');
    };
    $('#next').onclick = function () { Q.i++; if (Q.i < Q.items.length) renderQ(); else result(); };
  }
  function result() {
    var total = Q.items.length, pct = Q.ok / total, perfect = Q.ok === total;
    var bonus = 20 + (perfect ? 50 : 0);
    S.tests++; if (perfect) S.perfect++; save();
    addXp(bonus);
    var after = Q.tid === 'alle' ? chapterProgress(Q.n) : mastery(Q.n, Q.tid);
    var emoji = perfect ? '🏆' : pct >= .8 ? '🎉' : pct >= .6 ? '💪' : pct >= .4 ? '📈' : '🌱';
    var msg = perfect ? 'Fehlerfrei! Das ist Meisterklasse.' : pct >= .8 ? 'Richtig stark – fast alles sitzt!' : pct >= .6 ? 'Gute Basis! Die Wiederholungen bringen dich auf 100 %.' : pct >= .4 ? 'Du kommst voran. Hör dir den Podcast nochmal an!' : 'Jeder Anfang zählt – die falschen Fragen kommen gezielt wieder.';
    sfx('win'); confetti(perfect ? 240 : pct >= .6 ? 120 : 40);
    app.innerHTML = '<div class="result"><div class="big">' + emoji + '</div><h1>' + Q.ok + ' von ' + total + ' richtig</h1><p style="color:var(--dim)">' + msg + '</p>' +
      '<div class="stat-grid"><div><b style="color:#ffd166">+' + (Q.xp + bonus) + '</b><small>XP</small></div><div><b>🔥' + Q.maxCombo + '</b><small>beste Combo</small></div><div><b>' + Math.round(after * 100) + '%</b><small>Fortschritt ' + (after > Q.masteryBefore ? '▲' + Math.round((after - Q.masteryBefore) * 100) : '') + '</small></div></div>' +
      '<div style="display:grid;gap:10px"><a class="btn main block" href="#/k/' + Q.n + '/quiz/' + Q.tid + '?r=' + Date.now() + '">Nochmal 15 Fragen ↻</a><a class="btn block" href="#/k/' + Q.n + '">Zurück zum Kapitel</a></div>' +
      (Q.wrong.length ? '<div class="sec-title"><h2>Zum Wiederholen</h2><small>' + Q.wrong.length + '</small></div><div class="review">' + Q.wrong.map(function (it) {
        return '<div class="r"><b>' + md(it.q).replace(/<\/?p>/g, ' ') + '</b><div class="ans">✔ ' + md(it.a[0]).replace(/<\/?p>/g, '') + '</div><div style="margin-top:6px;color:var(--dim)">' + md(it.e).replace(/<\/?p>/g, ' ') + '</div><a class="btn sm" style="margin-top:8px" target="_blank" href="#/k/' + it.n + '/text/' + it.t + '/' + (it.s || 0) + (it.m ? '?m=' + encodeURIComponent(it.m) : '') + '">ℹ︎ Nachlesen</a></div>';
      }).join('') + '</div>' : '') + '</div>';
    checkBadges();
  }

  /* ================= Router ================= */
  function route() {
    stopPlayer(); closeSheets(); window.scrollTo(0, 0);
    var h = location.hash.replace(/^#/, '') || '/', qs = '', qi = h.indexOf('?');
    if (qi >= 0) { qs = h.slice(qi + 1); h = h.slice(0, qi); }
    var params = {}; qs.split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); params[p[0]] = decodeURIComponent(p[1] || ''); });
    var p = h.split('/').filter(Boolean);
    document.body.classList.remove('immersive');
    $$('.tabbar a').forEach(function (a) { a.classList.toggle('on', (p[0] || 'home') === a.dataset.tab || (!p[0] && a.dataset.tab === 'home')); });
    if (!p.length) viewHome();
    else if (p[0] === 'kapitel') viewChapters();
    else if (p[0] === 'erfolge') viewBadges();
    else if (p[0] === 'k' && p.length === 2) viewChapter(+p[1]);
    else if (p[0] === 'k' && p[2] === 'lernen') viewLearn(+p[1], p[3]);
    else if (p[0] === 'k' && p[2] === 'text') viewText(+p[1], p[3], +(p[4] || 0), params.m || '');
    else if (p[0] === 'k' && p[2] === 'quiz') viewQuiz(+p[1], p[3]);
    else viewHome();
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('touchstart', function () { audioCtx(); }, { once: true, passive: true });
  document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#ff5fa2"/></linearGradient></defs></svg>');
  window.OSTEP_APP = { pool: pool };
  route();
})();
