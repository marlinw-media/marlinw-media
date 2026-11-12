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
  var VOICES = [['thorsten', 'Thorsten', '🧔', 'männlich, warm'], ['karlsson', 'Karlsson', '👨', 'männlich, sachlich'], ['kerstin', 'Kerstin', '👩', 'weiblich, ruhig'], ['ramona', 'Ramona', '👩‍🦰', 'weiblich, klar'], ['eva', 'Eva', '👱‍♀️', 'weiblich, hell'], (TIMING.ki ? ['ki', 'KI-Stimme', '✨', 'neu & natürlich – bisher Kapitel 18 und 19'] : ['geraet', 'Gerätestimme', '📱', 'Sprachausgabe deines Handys'])];
  if (TIMING.ki && S.voice === 'geraet') S.voice = 'ki';
  function voiceInfo(id) { return VOICES.filter(function (v) { return v[0] === id; })[0] || VOICES[0]; }
  function tmOf(voice, key) { return voice === 'geraet' ? null : (TIMING[voice] || {})[key] || null; }
  var GAP = (function () { var l = S.lastVisit; S.lastVisit = Date.now(); return l ? Math.floor((Date.now() - l) / 864e5) : 0; })();
  function addTime(n, tid, kind, sec) {
    if (!(sec > 0)) return;
    S.time = S.time || {}; S.dayTime = S.dayTime || {};
    var k = n + '-' + tid, r = S.time[k] = S.time[k] || { l: 0, q: 0 };
    r[kind] = (r[kind] || 0) + sec; S.dayTime[today()] = (S.dayTime[today()] || 0) + sec;
  }
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
    var dBefore = dayXp();
    S.xp += n; S.days[today()] = dayXp() + n; save();
    if (!dBefore) setTimeout(syncPush, 50);
    if (dBefore < S.goal && dayXp() >= S.goal && S.goalShown !== today()) { S.goalShown = today(); save(); setTimeout(function () { cheer({ kicker: 'TAGESZIEL', title: 'Tagesziel geschafft! 🎯', text: (streak() >= 2 ? '🔥 ' + streak() + ' Tage in Folge! ' : '') + 'Alles, was du jetzt noch machst, ist Bonus fürs Gehirn.', mood: 'strong', btn: 'Noch ein bisschen 💪' }); }, 1300); }
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
    var EX = (O.ex || {})[key] || [];
    (t.q || []).forEach(function (q, i) { var x = EX[i]; items.push({ id: key + '-q' + i + (q[5] ? '-' + q[5] : ''), n: n, t: tid, q: q[0], a: q[1], e: x ? x[0] : q[2], w: x ? x[1] : null, s: q[3] || 0, m: q[4] || '' }); });
    if (t.st && t.st.T.length >= 3 && t.st.F.length >= 3) {
      var cnt = t.st.n || Math.min(18, Math.min(t.st.T.length, t.st.F.length) * 3);
      for (var v = 0; v < cnt; v++) {
        var r = rng(hash(key + 'st' + v)), neg = v % 3 === 2;
        var T = shuffle(t.st.T.slice(), r), F = shuffle(t.st.F.slice(), r), item;
        if (!neg) {
          var tr = T[0], fs = F.slice(0, 3);
          item = { q: 'Welche Aussage zum Thema „' + t.st.about + '“ ist **richtig**?', a: [tr[0]].concat(fs.map(function (f) { return f[0]; })),
            e: '✔ ' + tr[0] + '\n\nDie anderen Aussagen sind falsch:\n' + fs.map(function (f) { return '✘ „' + f[0] + '“ – ' + f[1]; }).join('\n'), s: tr[1] || 0, m: '', wr: {} };
          fs.forEach(function (f) { item.wr[f[0]] = 'Diese Aussage ist falsch: ' + f[1]; });
        } else {
          var fl = F[0], ts = T.slice(0, 3);
          item = { q: 'Welche Aussage zum Thema „' + t.st.about + '“ ist **falsch**?', a: [fl[0]].concat(ts.map(function (x) { return x[0]; })),
            e: '✘ Falsch ist: „' + fl[0] + '“\n\nRichtig wäre: ' + fl[1], s: fl[2] || 0, m: '', wr: {} };
          ts.forEach(function (x) { item.wr[x[0]] = 'Diese Aussage **stimmt** – gesucht war aber die **falsche** Aussage.'; });
        }
        item.id = key + '-s' + v; item.n = n; item.t = tid; items.push(item);
      }
    }
    (t.gen || []).forEach(function (g, gi) {
      for (var v = 0; v < (g.n || 5); v++) {
        var r = rng(hash(key + 'g' + gi + '-' + v)), x;
        try { x = g.f(r, v); } catch (e) { continue; }
        var it0 = { id: key + '-g' + gi + '-' + v, n: n, t: tid, q: x.q, a: x.a, e: x.e, wr: x.wr || null, s: x.s || 0, m: x.m || '' };
        if (x.num != null) { it0.num = x.num; it0.unit = x.unit || ''; it0.hint = x.hint || ''; it0.a = [fmtNum(x.num) + (x.unit ? ' ' + x.unit : '')]; }
        items.push(it0);
      }
    });
    return (poolCache[key] = items);
  }
  function fmtNum(x) { var s = String(Math.round(x * 1000) / 1000).replace('.', ','); return /^\d{5,}$/.test(s) ? s.replace(/\B(?=(\d{3})+$)/g, '.') : s; }
  function parseNum(s) {
    s = String(s).trim().replace(/[\s'’%]/g, '');
    if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16);
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
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
  /* Auswahl (gilt für Themen-Tests und das große Kapitel-Quiz):
     - Vorrang: noch nie gefragte UND zuletzt falsch beantwortete Fragen (gleichberechtigt, zufällig gemischt)
     - richtig beantwortete Fragen nur selten: pro Platz 10 % Chance, höchstens 10 % des Tests
     - nur wenn keine offenen Fragen mehr übrig sind, wird mit gefestigten Fragen aufgefüllt */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function pick(items, k) {
    var now = Date.now(), open = [], known = [];
    items.forEach(function (it) {
      var r = S.q[it.id];
      if (!r || r.b === 0) open.push({ it: it, s: Math.random() + (r && now - r.t < 3 * 60 * 1000 ? .6 : 0) });
      else known.push({ it: it, s: r.b + Math.random() * 1.5 - Math.min(1, (now - r.t) / (3 * 864e5)) });
    });
    open.sort(function (a, b) { return a.s - b.s; });
    known.sort(function (a, b) { return a.s - b.s; });
    /* höchstens 2 Varianten derselben Rechenaufgabe bzw. Aussagen-Frage pro Test */
    var fam = {}, famOf = function (id) { var m = id.match(/^(.*-(?:g\d+|s))(?:-?\d+)$/); return m ? m[1] : id; };
    var spread = function (list) { var a = [], b = []; list.forEach(function (x) { var f = famOf(x.it.id); if ((fam[f] || 0) < 2) { fam[f] = (fam[f] || 0) + 1; a.push(x); } else b.push(x); }); return a.concat(b); };
    open = spread(open); known = spread(known);
    var cap = Math.max(1, Math.floor(k * .1)), nKnown = 0;
    for (var i = 0; i < k; i++) if (nKnown < cap && Math.random() < .1) nKnown++;
    nKnown = Math.min(nKnown, known.length);
    var nOpen = Math.min(open.length, k - nKnown);
    nKnown = Math.min(known.length, k - nOpen);   // auffüllen, falls nicht genug offene Fragen da sind
    return shuffle(open.slice(0, nOpen).concat(known.slice(0, nKnown)).map(function (x) { return x.it; }));
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
  /* ================= Motivation: Maskottchen „Chippy“ ================= */
  function chippy(mood, size) {
    size = size || 64; mood = mood || 'happy';
    var eyes = mood === 'sleep' ? '<path d="M21 31 q4 3 8 0 M35 31 q4 3 8 0" stroke="#1a1040" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      : mood === 'cool' ? '<rect x="17" y="26" width="14" height="8" rx="3" fill="#11112a"/><rect x="33" y="26" width="14" height="8" rx="3" fill="#11112a"/><path d="M31 29 h2" stroke="#11112a" stroke-width="2"/>'
      : '<circle cx="25" cy="30" r="4.2" fill="#fff"/><circle cx="39" cy="30" r="4.2" fill="#fff"/><circle cx="26" cy="31" r="2.2" fill="#1a1040"/><circle cx="40" cy="31" r="2.2" fill="#1a1040"/>';
    var mouth = mood === 'think' ? '<path d="M26 42 h12" stroke="#1a1040" stroke-width="2.6" stroke-linecap="round"/>'
      : mood === 'sleep' ? '<circle cx="32" cy="42" r="2.4" fill="#1a1040"/>'
      : mood === 'wow' ? '<ellipse cx="32" cy="42" rx="4" ry="5" fill="#1a1040"/>'
      : '<path d="M24 39 q8 8 16 0" stroke="#1a1040" stroke-width="2.8" fill="#ff8fb8" stroke-linecap="round"/>';
    var extra = mood === 'party' ? '<path d="M24 12 L32 -6 L40 12 z" fill="#ffd166" stroke="#ff5fa2" stroke-width="2"/><circle cx="32" cy="-6" r="3" fill="#ff5fa2"/>'
      : mood === 'strong' ? '<path d="M8 36 q-8 -10 2 -16" stroke="#ffb347" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M56 36 q8 -10 -2 -16" stroke="#ffb347" stroke-width="5" fill="none" stroke-linecap="round"/>'
      : mood === 'think' ? '<circle cx="54" cy="10" r="3" fill="#c9c3ff"/><circle cx="60" cy="2" r="4.5" fill="#c9c3ff"/>'
      : mood === 'sleep' ? '<text x="48" y="10" font-size="12" font-weight="900" fill="#c9c3ff">z</text><text x="55" y="2" font-size="9" font-weight="900" fill="#c9c3ff">z</text>' : '';
    var pins = ''; for (var i = 0; i < 4; i++) { var o = 16 + i * 10.7; pins += '<rect x="' + o + '" y="2" width="4" height="7" rx="1.5" fill="#b9a8ff"/><rect x="' + o + '" y="55" width="4" height="7" rx="1.5" fill="#b9a8ff"/><rect x="2" y="' + o + '" width="7" height="4" rx="1.5" fill="#b9a8ff"/><rect x="55" y="' + o + '" width="7" height="4" rx="1.5" fill="#b9a8ff"/>'; }
    return '<svg class="chippy ' + mood + '" width="' + size + '" height="' + size + '" viewBox="-6 -14 76 80" aria-hidden="true">' + pins +
      '<rect x="8" y="8" width="48" height="48" rx="12" fill="url(#chipg)" stroke="#d9d0ff" stroke-width="1.5"/>' +
      '<circle cx="18" cy="38" r="3.4" fill="#ff8fb8" opacity=".55"/><circle cx="46" cy="38" r="3.4" fill="#ff8fb8" opacity=".55"/>' + eyes + mouth + extra + '</svg>';
  }
  var pepT = 0, pepLast = 0;
  function pep(msg, mood, force) {
    var now = Date.now(); if (!force && now - pepLast < 4500) return; pepLast = now;
    var el = $('#pep'); if (!el) { el = document.createElement('div'); el.id = 'pep'; document.body.appendChild(el); }
    el.innerHTML = chippy(mood || 'happy', 46) + '<div>' + msg + '</div>';
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(pepT); pepT = setTimeout(function () { el.classList.remove('on'); }, 3600);
    el.onclick = function () { el.classList.remove('on'); };
  }
  function cheer(o) {
    sfx('lvl'); confetti(o.confetti || 140);
    var d = document.createElement('div'); d.className = 'levelup';
    d.innerHTML = '<div class="box cheer">' + chippy(o.mood || 'party', 96) + '<div style="font-weight:900;color:#ffd166;letter-spacing:.15em;font-size:13px;margin-top:6px">' + (o.kicker || 'MEILENSTEIN') + '</div><h2 style="font-size:24px;font-weight:900;margin:6px 0">' + o.title + '</h2><p style="color:#d8d5f5;margin:0 0 14px">' + o.text + '</p>' +
      (o.progress != null ? '<div class="xpbar" style="height:12px;margin:0 0 16px;width:100%"><i style="width:0%"></i></div>' : '') + '<button class="btn main block">' + (o.btn || 'Weiter so 🚀') + '</button></div>';
    document.body.appendChild(d);
    if (o.progress != null) setTimeout(function () { var i = d.querySelector('.xpbar i'); if (i) i.style.width = Math.round(o.progress * 100) + '%'; }, 120);
    d.querySelector('button').onclick = function () { d.remove(); };
  }
  function rnd(a) { var l = a.filter(function (x) { return S.name || x.indexOf('{n}') < 0; }); var x = l[Math.floor(Math.random() * l.length)] || a[0]; return x.replace(/\{n\}/g, esc(S.name || '')); }
  var MOT = {
    combo: { 3: ['3 richtig in Folge – du bist warm! 🔥', 'Hattrick! Weiter so ⚡'], 5: ['5er-Combo! Dein Gehirn cached gerade alles 🧠', '{n} ist on fire! 5 in Folge 🔥', 'Fünf am Stück – TLB-Hit-Rate: 100 % 😎'], 8: ['8 in Folge! Du bist schneller als ein TLB-Hit ⚡'], 10: ['10er-Combo!! Professor-Level erreicht 🎓', '{n}, das ist Wahnsinn – 10 am Stück! 🎓'], 15: ['15 am Stück – das ist Kernel-Modus! 👑'] },
    wrong: ['{n}, kein Problem – genau aus Fehlern lernt man am meisten 💡', 'Kopf hoch, {n}! Beim nächsten Mal sitzt die 💪', 'Fehler sind nur Page Faults – danach sitzt es im Speicher 💾', 'Kein Stress – falsche Fragen kommen gezielt wieder, bis sie sitzen 💪', 'Durchatmen. Lies die Erklärung – genau so lernt man 🌱', 'Auch Prozessoren brauchen manchmal einen Retry ↺'],
    half: ['Halbzeit! {ok} von {cnt} richtig – zieh durch! 🏃', 'Die Hälfte ist geschafft – {ok} Treffer bisher 💪', 'Halbzeit, {n}! {ok} von {cnt} richtig 🔥'],
    listened: ['Stark, {n}! Thema gehört – jetzt im Quiz festigen 🎯', 'Thema gehört! 🎧 Jetzt im Quiz festigen – so bleibt es hängen.', 'Podcast geschafft! Ein kurzes Quiz macht daraus echtes Wissen 🎯'],
    home: ['{n}, heute schon gelernt? Chippy wartet auf dich 😊', 'Schön, dass du da bist, {n}! 10 Minuten machen den Unterschied 🚀', 'Jede Frage heute ist ein Punkt weniger Prüfungsstress 📚', 'Kleine Schritte, großer Fortschritt – 10 Minuten reichen heute 🚀', 'Du lernst nicht für die Prüfung, du lernst, wie Computer wirklich denken 🧠', 'Der beste Zeitpunkt zu lernen war gestern. Der zweitbeste ist jetzt ⏰', 'Wiederholung schlägt Talent – und du wiederholst gerade 💪', 'Ein Kapitel nach dem anderen – genau wie ein Scheduler 😉']
  };
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
    d.innerHTML = '<div class="box cheer">' + chippy('party', 88) + '<div style="font-weight:900;color:#ffd166;letter-spacing:.15em;font-size:13px">LEVEL UP</div><div class="lv grad-text">' + l + '</div><p style="color:#d8d5f5;margin:10px 0 18px">Stark' + (S.name ? ', ' + esc(S.name) : '') + '! Du bist jetzt auf Level ' + l + '.</p><button class="btn main block">Weiter so 🚀</button></div>';
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
      '<div class="hero"><div class="row"><h1>' + hi + (S.name ? ', ' + esc(S.name) : '') + '! 👋</h1><p>' + (dayXp() >= S.goal ? 'Tagesziel geschafft – stark! Jede weitere Frage festigt dein Wissen.' : 'Noch ' + (S.goal - dayXp()) + ' XP bis zu deinem Tagesziel.') + '</p></div>' +
      '<div class="goal">' + ring(g, 70, 8, '#ffd166', Math.round(g * 100) + '%') + '<div style="flex:1">' +
      (rec ? '<div style="font-size:13px;color:#d8d5f5;font-weight:700">Als Nächstes · Kapitel ' + rec.n + '</div><div style="font-weight:900;font-size:17px;margin:2px 0 10px">' + esc(rec.t.title) + '</div><a class="btn main block" href="#/k/' + rec.n + '/' + rec.mode + '/' + rec.t.id + '">' + rec.label + '</a>'
        : '<div style="font-weight:900">Alles gemeistert! 🏆</div>') + '</div></div></div>' + motCard();
    var started = O.meta.filter(function (m) { return O.chapters[m.n] && chapterProgress(m.n) > 0; });
    if (started.length) html += '<div class="sec-title"><h2>Weitermachen</h2></div><div class="chapters">' + started.slice(0, 4).map(chapterRow).join('') + '</div>';
    html += '<div class="sec-title"><h2>Alle Kapitel</h2><small>' + O.meta.length + ' Kapitel</small></div>' + chapterList();
    app.innerHTML = html;
  }
  function motCard() {
    var st = streak(), msg, mood = 'happy', allOpen = 0, best = null;
    O.meta.forEach(function (m) { var ch = O.chapters[m.n]; if (!ch || !chapterProgress(m.n)) return; ch.topics.forEach(function (t) { var c = pool(m.n, t.id).filter(function (it) { var r = S.q[it.id]; return r && r.b === 0; }).length; allOpen += c; if (c && (!best || c > best.c)) best = { n: m.n, t: t, c: c }; }); });
    var ci = S.cal ? calInfo() : null;
    if (ci && ci.state !== 'aktiv' || ci && ci.left <= 5) { msg = '📅 Deine Kalender-Erinnerungen ' + (ci.state === 'abgelaufen' ? 'sind abgelaufen' : ci.state === 'geaendert' ? 'haben noch die alten Zeiten' : 'laufen in ' + ci.left + ' Tag' + (ci.left === 1 ? '' : 'en') + ' aus') + ' – <a href="#/profil/erinnerungen" style="color:#ffd166;text-decoration:underline">jetzt erneuern</a>'; mood = 'wow'; }
    else if (GAP >= 3) { msg = 'Willkommen zurück' + (S.name ? ', ' + esc(S.name) : '') + '! 👋 ' + GAP + ' Tage Pause – eine kurze Runde bringt dich sofort wieder rein.'; mood = 'wow'; }
    else if (st >= 2 && dayXp() < S.goal) { msg = '🔥 <b>' + st + ' Tage</b> in Folge – lass die Serie heute nicht reißen!'; mood = 'strong'; }
    else if (st >= 2) { msg = '🔥 <b>' + st + ' Tage</b> Streak und Tagesziel erreicht – du bist eine Lernmaschine!'; mood = 'cool'; }
    else if (best) { msg = '<b>' + best.c + '</b> Fragen in „' + esc(best.t.title) + '“ warten auf eine zweite Chance – die schaffst du jetzt!'; mood = 'strong'; }
    else msg = rnd(MOT.home);
    var acc = S.answered ? Math.round(S.correct / S.answered * 100) : 0;
    return '<div class="motcard home">' + chippy(mood, 62) + '<div><div>' + msg + '</div>' +
      (S.answered ? '<div class="motstats"><span>✅ ' + S.correct + ' richtig</span><span>🎯 ' + acc + ' % Treffer</span>' + (allOpen ? '<span>↻ ' + allOpen + ' zu wiederholen</span>' : '') + '</div>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + (best ? '<a class="btn sm" href="#/k/' + best.n + '/quiz/' + best.t.id + '">Fehler wiederholen ↻</a>' : '') + (S.rem ? '' : '<a class="btn sm" href="#/profil/erinnerungen">🔔 Erinnerungen</a>') + '</div></div></div>';
  }
  function chapterList() {
    var html = '', part = '';
    O.meta.forEach(function (m) { if (m.part !== part) { part = m.part; html += (html ? '</div>' : '') + '<div class="part-label">' + esc(part) + '</div><div class="chapters">'; } html += chapterRow(m); });
    html += '</div>' + (O.soon.length ? '<div class="part-label">Demnächst</div><div class="chapters">' : '<div>') + O.soon.map(function (s) { return '<div class="ch locked"><div class="num" style="background:#3a3f6b">' + s.n + '</div><div class="meta"><b>' + esc(s.title) + '</b><small>wird ergänzt</small></div></div>'; }).join('') + '</div>';
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
      '<div class="seg' + (TERMS(n) ? ' three' : '') + '"><button data-tab="lernen" class="' + (tab === 'lernen' ? 'on' : '') + '">🎧 Lernen</button>' + (TERMS(n) ? '<button data-tab="begriffe" class="' + (tab === 'begriffe' ? 'on' : '') + '">📖 Begriffe</button>' : '') + '<button data-tab="quiz" class="' + (tab === 'quiz' ? 'on' : '') + '">🎯 Quiz</button></div><div class="topics">';
    if ((tab === 'begriffe' && !TERMS(n)) || tab === 'merken') tab = 'lernen';
    if (tab !== 'begriffe') ch.topics.forEach(function (t, i) {
      var ma = mastery(n, t.id), li = listenOf(n, t.id), dur = (tmOf(S.voice, kid(n) + '-' + t.id) || tmOf('thorsten', kid(n) + '-' + t.id) || {}).d;
      if (tab === 'lernen') html += '<a class="topic" href="#/k/' + n + '/lernen/' + t.id + '"><div class="ic">' + t.icon + '</div><div class="meta"><b>' + esc(t.title) + '</b><small>' + (dur ? '🎧 ' + fmt(dur) + ' · ' : '') + t.segs.length + ' Abschnitte' + (li >= .9 ? ' · ✓ gehört' : '') + '</small><div class="mini-bar listen"><i style="width:' + Math.min(100, li * 100) + '%"></i></div></div><span style="font-size:22px">' + (li >= .9 ? '✅' : '▶️') + '</span></a>';
      else html += '<a class="topic" href="#/k/' + n + '/quiz/' + t.id + '"><div class="ic">' + t.icon + '</div><div class="meta"><b>' + esc(t.title) + '</b><small>' + Math.round(ma * 100) + ' % gemeistert · ' + seenCount(n, t.id) + '/' + pool(n, t.id).length + ' Fragen gesehen</small><div class="mini-bar"><i style="width:' + ma * 100 + '%"></i></div></div><span style="font-size:22px">' + (ma >= .9 ? '👑' : '🎯') + '</span></a>';
    });
    html += '</div>';
    if (tab === 'begriffe') html += termCards(n);
    if (tab === 'lernen' && MERK(n)) html += '<a class="big-quiz merk-btn" href="#/k/' + n + '/merken"><div class="ic">💡</div><div style="flex:1"><b style="font-size:17px">Merksätze des Kapitels</b><div style="color:#d8d5f5;font-size:13px;font-weight:600">' + MERK(n).length + ' wichtige Merksätze mit Erklärung – ideal nach dem Lernen</div></div><span style="font-size:22px">›</span></a>';
    if (tab === 'quiz') {
      var tot = ch.topics.reduce(function (a, t) { return a + pool(n, t.id).length; }, 0);
      html += '<a class="big-quiz" href="#/k/' + n + '/quiz/alle"><div class="ic">🏆</div><div style="flex:1"><b style="font-size:17px">Großes Kapitel-Quiz</b><div style="color:#d8d5f5;font-size:13px;font-weight:600">20 Fragen aus allen ' + tot + ' Fragen des Kapitels</div></div><span style="font-size:22px">›</span></a>';
    } else if (tab === 'lernen') html += '<p style="color:var(--dim);font-size:13px;text-align:center;margin-top:16px">Tipp: Erst den Podcast hören, dann im Quiz festigen. 🎧 → 🎯</p>';
    app.innerHTML = html;
    $$('.seg button').forEach(function (b) { b.onclick = function () { sessionStorage.setItem('ostep-tab', b.dataset.tab); sfx('tap'); viewChapter(n, b.dataset.tab); }; });
    if (tab === 'begriffe') animateTerms(n);
  }
  /* ---------- Fachbegriffe: Grafik in Endlosschleife (wie ein GIF) + Text ---------- */
  function MERK(n) { return (O.merk || {})[n] || null; }
  function viewMerk(n) {
    if (!MERK(n)) { viewChapter(n); return; }
    var m = O.meta.filter(function (x) { return x.n === +n; })[0];
    app.innerHTML = '<a class="back" href="#/k/' + n + '">‹ Kapitel ' + n + '</a><h1 style="font-size:24px;font-weight:900;margin:4px 2px 4px">💡 Merksätze</h1><div style="color:#c9c3ff;font-weight:800;margin:0 2px 10px">Kapitel ' + n + ' · ' + esc(m ? m.title : '') + '</div>' + merkCards(n);
    animateSvgs($$('.merk svg.vis'), function (s) { return MERK(n)[+s.dataset.m][4]; });
  }
  function merkCards(n) {
    var ch = O.chapters[n];
    return '<p class="merk-lead">Die wichtigsten Merksätze aus Kapitel ' + n + ' – ideal zum Wiederholen nach dem Lernen. Tippe auf einen Satz für die Erklärung.</p><div class="merks">' + MERK(n).map(function (m, i) {
      var t = ch.topics.filter(function (x) { return x.id === m[2]; })[0];
      return '<details class="merk"' + (i === 0 ? ' open' : '') + '><summary><span class="mn">' + (i + 1) + '</span><span class="ms">' + md(m[0]).replace(/^<p>|<\/p>$/g, '') + '</span></summary>' +
        '<div class="mx">' + (m[4] ? '<div class="mstage"><svg class="vis" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" data-m="' + i + '"></svg></div>' : '') + md(m[1]) + '<a class="tlink" href="#/k/' + n + '/text/' + m[2] + '/' + (m[3] || 0) + '">📄 ' + esc(t ? t.title : 'Lerntext') + ' nachlesen ›</a></div></details>';
    }).join('') + '</div>';
  }
  function TERMS(n) { return (O.terms || {})[n] || null; }
  var TERM_RAF = 0, TERM_OBS = null;
  function stopTerms() { cancelAnimationFrame(TERM_RAF); TERM_RAF = 0; if (TERM_OBS) { TERM_OBS.disconnect(); TERM_OBS = null; } }
  function termCards(n) {
    return '<div class="terms">' + TERMS(n).map(function (x, i) {
      return '<article class="term" id="term-' + i + '"><div class="tstage"><svg class="vis" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" data-i="' + i + '"></svg></div>' +
        '<div class="tbody"><h3>' + esc(x.t) + '</h3><small>' + esc(x.d) + '</small><div class="ttext">' + md(x.e) + '</div>' +
        '<a class="tlink" href="#/k/' + n + '/text/' + x.k + '/' + (x.s || 0) + '">📄 Im Lerntext nachlesen ›</a></div></article>';
    }).join('') + '</div>';
  }
  function animateTerms(n) { var list = TERMS(n); animateSvgs($$('.term svg.vis'), function (s) { return list[+s.dataset.i].v; }); }
  /* Grafiken in Endlosschleife abspielen (wie ein GIF), nur solange sichtbar */
  function animateSvgs(svgs, getV) {
    stopTerms();
    var vis = [], t0 = performance.now();
    svgs.forEach(function (s, k) { s.dataset.k = k; vis[k] = false; OSTEP_VIS.render(s, getV(s), 1, 0); });
    if ('IntersectionObserver' in window) {
      TERM_OBS = new IntersectionObserver(function (es) { es.forEach(function (e) { vis[+e.target.dataset.k] = e.isIntersecting; }); }, { rootMargin: '60px' });
      svgs.forEach(function (s) { TERM_OBS.observe(s); });
    } else svgs.forEach(function (s, k) { vis[k] = true; });
    var LOOP = 6200, PLAY = 4300, last = 0;
    (function frame(now) {
      TERM_RAF = requestAnimationFrame(frame);
      if (now - last < 33) return; last = now;
      var tt = (now - t0) % LOOP, p = Math.min(1, tt / PLAY);
      svgs.forEach(function (s, k) { if (vis[k]) OSTEP_VIS.render(s, getV(s), p, (now - t0) / 1000); });
    })(t0);
  }
  function fmtDur(sec) { sec = Math.round(sec || 0); if (sec < 60) return sec + ' s'; var m = Math.round(sec / 60); if (m < 60) return m + ' Min.'; return Math.floor(m / 60) + ' Std. ' + (m % 60) + ' Min.'; }
  function topicStats(n, t) {
    var tm = (S.time || {})[n + '-' + t.id] || { l: 0, q: 0 }, pl = pool(n, t.id), seen = 0, ans = 0, cor = 0;
    pl.forEach(function (it) { var r = S.q[it.id]; if (r) { seen++; ans += r.n || 0; cor += r.c || 0; } });
    return { l: tm.l || 0, q: tm.q || 0, tot: (tm.l || 0) + (tm.q || 0), seen: seen, size: pl.length, acc: ans ? cor / ans : null, ma: mastery(n, t.id) };
  }
  function profHead() {
    var L = lvlInfo(S.xp);
    return '<div class="profhead">' + chippy(streak() >= 3 ? 'cool' : 'happy', 74) + '<div style="flex:1;min-width:0"><div class="pname">' + (S.name ? esc(S.name) : 'Dein Profil') + '</div><div class="psub">Level ' + L.lvl + ' · ' + S.xp + ' XP · 🔥 ' + streak() + ' Tage</div><div class="xpbar"><i style="width:' + Math.round(L.cur / L.need * 100) + '%"></i></div></div></div>';
  }
  function viewProfile(sub) {
    var back = '<a class="back" href="#/profil">‹ Profil</a>';
    if (sub === 'erfolge') { app.innerHTML = back + badgesHtml(); return; }
    if (sub === 'erinnerungen') { app.innerHTML = back + remSection(); bindRem(); return; }
    if (sub === 'einstellungen') { app.innerHTML = back + settingsHtml(); bindSettings(); return; }
    if (sub === 'stats') { app.innerHTML = back + statsHtml(); return; }
    if (sub === 'noten') { app.innerHTML = back + gradesHtml(); return; }
    var tot = 0, today0 = (S.dayTime || {})[today()] || 0; Object.keys(S.time || {}).forEach(function (k) { tot += (S.time[k].l || 0) + (S.time[k].q || 0); });
    var got = BADGES.filter(function (b) { return S.badges[b[0]]; }).length;
    app.innerHTML = topBar() + profHead() +
      '<div class="card namecard"><label for="pname">Wie dürfen Chippy und die Erinnerungen dich nennen?</label><div class="numrow" style="padding:2px 12px"><input id="pname" type="text" maxlength="24" autocomplete="given-name" placeholder="Dein Vorname" value="' + esc(S.name || '') + '"><button class="btn sm main" id="psave">Speichern</button></div></div>' +
      '<div class="stat-grid"><div><b>' + fmtDur(today0) + '</b><small>heute gelernt</small></div><div><b>' + fmtDur(tot) + '</b><small>gesamt</small></div><div><b>' + (S.answered ? Math.round(S.correct / S.answered * 100) : 0) + '%</b><small>Trefferquote</small></div></div>' +
      gradeCard() +
      '<div class="menu">' +
      '<a href="#/profil/noten"><span>🎓</span><div><b>Noten & Quiz-Übersicht</b><small>alle 20-Fragen-Quizze und deine Gesamtnote</small></div>›</a>' +
      '<a href="#/profil/stats"><span>📊</span><div><b>Fortschritt & Analytics</b><small>Lernzeit, Noten, Zeit pro Thema und Kapitel</small></div>›</a>' +
      '<a href="#/profil/erfolge"><span>🏆</span><div><b>Erfolge</b><small>' + got + ' von ' + BADGES.length + ' Abzeichen</small></div>›</a>' +
      '<a href="#/profil/erinnerungen"><span>🔔</span><div><b>Erinnerungen</b><small>Lernzeiten, Streak-Warnung, Kalender</small></div>›</a>' +
      '<a href="#/profil/einstellungen"><span>⚙️</span><div><b>Einstellungen</b><small>Tagesziel, Stimme, Töne</small></div>›</a></div>';
    $('#psave').onclick = function () { var v = $('#pname').value.trim().slice(0, 24); S.name = v || null; save(); sfx('win'); toast(v ? '👋 Hallo ' + esc(v) + '! Chippy merkt sich deinen Namen.' : 'Name entfernt'); viewProfile(); };
    $('#pname').onkeydown = function (e) { if (e.key === 'Enter') $('#psave').click(); };
  }
  function chQuizzes() { return (S.hist || []).filter(function (h) { return h.tid === 'alle'; }); }
  function gnum(h) { return parseFloat(grade(h.ok / h.total).replace(',', '.')); }
  function overall() { var q = chQuizzes(); if (!q.length) return null; var g = q.reduce(function (a, h) { return a + gnum(h); }, 0) / q.length; return { g: g, n: q.length, pct: q.reduce(function (a, h) { return a + h.ok / h.total; }, 0) / q.length }; }
  function gcolor(g) { return g <= 1.7 ? '#7ff0b2' : g <= 2.7 ? '#ffd166' : g <= 4 ? '#ffb347' : '#ff8a95'; }
  function gradeCard() {
    var o = overall();
    return '<a class="gradecard" href="#/profil/noten"><div><small>🎓 Gesamtnote</small><b class="gv" style="color:' + (o ? gcolor(o.g) : 'var(--dim)') + '">' + (o ? o.g.toFixed(1).replace('.', ',') : '–') + '</b></div><div style="flex:1;font-size:13.5px;font-weight:700;color:#d8d5f5">' +
      (o ? 'Durchschnitt aus <b>' + o.n + '</b> Kapitelquiz' + (o.n === 1 ? '' : 'zen') + ' · Ø ' + Math.round(o.pct * 100) + ' % richtig' : 'Mach ein großes 20-Fragen-Kapitelquiz, um deine erste Note zu bekommen.') + '</div><span>›</span></a>';
  }
  function gradesHtml() {
    var q = chQuizzes().slice().reverse(), o = overall();
    var html = '<h1 style="font-size:24px;font-weight:900;margin:4px 2px 10px">🎓 Noten</h1>' + gradeCard().replace('<a class="gradecard" href="#/profil/noten">', '<div class="gradecard">').replace(/<span>›<\/span><\/a>$/, '</div>');
    if (!q.length) return html + '<div class="empty">Noch keine Kapitelquizze. Im Kapitel unter 🎯 Quiz → „Großes Kapitel-Quiz“ starten.</div>';
    var by = {}; chQuizzes().forEach(function (h) { (by[h.n] = by[h.n] || []).push(h); });
    html += '<div class="sec-title"><h2>Pro Kapitel</h2></div><div class="card" style="display:grid;gap:8px">' + Object.keys(by).sort(function (a, b) { return a - b; }).map(function (n) {
      var l = by[n], g = l.reduce(function (a, h) { return a + gnum(h); }, 0) / l.length, best = Math.min.apply(null, l.map(gnum)), m = O.meta.filter(function (x) { return x.n === +n; })[0];
      return '<div class="grow"><div class="num" style="background:' + (m ? m.color : '#7c5cff') + '">' + n + '</div><div style="flex:1;min-width:0"><b>' + esc(m ? m.title : 'Kapitel ' + n) + '</b><small>' + l.length + '× angetreten · beste Note ' + String(best.toFixed(1)).replace('.', ',') + '</small></div><b style="font-size:20px;color:' + gcolor(g) + '">' + g.toFixed(1).replace('.', ',') + '</b></div>';
    }).join('') + '</div><div class="sec-title"><h2>Alle Quizze</h2><small>' + q.length + '</small></div><div class="card" style="display:grid;gap:8px">' + q.map(function (h) {
      var d = new Date(h.d), g = grade(h.ok / h.total);
      return '<div class="grow"><div style="flex:1;min-width:0"><b>Kapitel ' + h.n + '</b><small>' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' · ' + h.ok + '/' + h.total + ' · ' + Math.round(h.ok / h.total * 100) + ' %' + (h.sec ? ' · ' + fmtDur(h.sec) : '') + '</small></div><b style="font-size:20px;color:' + gcolor(parseFloat(g.replace(',', '.'))) + '">' + g + '</b></div>';
    }).join('') + '</div>';
    return html;
  }
  function badgesHtml() {
    var got = BADGES.filter(function (b) { return S.badges[b[0]]; }).length;
    return '<div class="sec-title"><h2>🏆 Erfolge</h2><small>' + got + ' / ' + BADGES.length + '</small></div><div class="badges">' +
      BADGES.map(function (b) { return '<div class="badge ' + (S.badges[b[0]] ? '' : 'off') + '"><div class="e">' + b[1] + '</div><b>' + b[2] + '</b><small>' + b[3] + '</small></div>'; }).join('') + '</div>';
  }
  function statsHtml() {
    var days = [], max = 1, d0 = new Date();
    for (var i = 13; i >= 0; i--) { var d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - i), k = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), v = (S.dayTime || {})[k] || 0; days.push([d, v, (S.days || {})[k] || 0]); max = Math.max(max, v); }
    var week = days.slice(7).reduce(function (a, x) { return a + x[1]; }, 0), hist = S.hist || [], chq = hist.filter(function (h) { return h.tid === 'alle'; });
    var ov = overall(), avgGrade = ov ? ov.g : null;
    var avgTest = hist.length ? hist.reduce(function (a, h) { return a + (h.sec || 0); }, 0) / hist.length : 0;
    var html = '<h1 style="font-size:24px;font-weight:900;margin:4px 2px 10px">📊 Fortschritt & Analytics</h1>' +
      '<div class="stat-grid"><div><b>' + fmtDur(week) + '</b><small>letzte 7 Tage</small></div><div><b>' + fmtDur(week / 7) + '</b><small>Ø pro Tag</small></div><div><b>' + (avgGrade ? avgGrade.toFixed(1).replace('.', ',') : '–') + '</b><small>Gesamtnote</small></div></div>' +
      '<div class="stat-grid"><div><b>' + S.tests + '</b><small>Tests</small></div><div><b>' + fmtDur(avgTest) + '</b><small>Ø Dauer pro Test</small></div><div><b>' + S.answered + '</b><small>Fragen beantwortet</small></div></div>' +
      '<div class="card"><div style="font-weight:900;margin-bottom:8px">Lernzeit der letzten 14 Tage</div><div class="daybars">' + days.map(function (x) {
        return '<div><i style="height:' + Math.max(2, Math.round(x[1] / max * 100)) + '%" class="' + (x[1] ? 'on' : '') + '"></i><small>' + 'SMDMDFS'[x[0].getDay()] + '</small></div>';
      }).join('') + '</div><div style="font-size:12px;color:var(--faint);margin-top:6px">Gemessen wird Podcast-Hören und Quiz-Zeit (seit diesem Update).</div></div>' +
      '<div class="sec-title"><h2>Pro Kapitel</h2></div>';
    O.meta.forEach(function (m) {
      var ch = O.chapters[m.n]; if (!ch) return;
      var ts = ch.topics.map(function (t) { return [t, topicStats(m.n, t)]; }), tot = ts.reduce(function (a, x) { return a + x[1].tot; }, 0), act = ts.filter(function (x) { return x[1].tot > 0; });
      var mq = chq.filter(function (h) { return h.n === m.n; }).pop(), pr = chapterProgress(m.n);
      if (!tot && !pr) return;
      html += '<details class="kstat"><summary><div class="num" style="background:' + m.color + '">' + m.n + '</div><div style="flex:1;min-width:0"><b>' + esc(m.title) + '</b><small>' + Math.round(pr * 100) + ' % · ' + fmtDur(tot) + (act.length ? ' · Ø ' + fmtDur(tot / act.length) + ' pro Thema' : '') + (mq ? ' · letzte Note ' + grade(mq.ok / mq.total) : '') + '</small><div class="mini-bar"><i style="width:' + Math.round(pr * 100) + '%"></i></div></div></summary>' +
        ts.map(function (x) {
          var st = x[1];
          return '<div class="tstat"><div><b>' + x[0].icon + ' ' + esc(x[0].title) + '</b><small>🎧 ' + fmtDur(st.l) + ' · 🎯 ' + fmtDur(st.q) + ' · ' + st.seen + '/' + st.size + ' Fragen gesehen' + (st.acc != null ? ' · ' + Math.round(st.acc * 100) + ' % richtig' : '') + '</small></div><span>' + Math.round(st.ma * 100) + '%</span></div>';
        }).join('') + '</details>';
    });
    return html;
  }
  function settingsHtml() {
    var sel = 'style="font:inherit;background:var(--card2);color:var(--text);border:1px solid var(--line2);border-radius:10px;padding:6px 8px"';
    return '<div class="sec-title"><h2>⚙️ Einstellungen</h2></div><div class="card" style="display:grid;gap:12px">' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Tagesziel <select id="goal" ' + sel + '>' + [50, 100, 200, 300].map(function (g) { return '<option value="' + g + '"' + (S.goal === g ? ' selected' : '') + '>' + g + ' XP</option>'; }).join('') + '</select></label>' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Podcast-Stimme <select id="vc" ' + sel + '>' + VOICES.map(function (v) { return '<option value="' + v[0] + '"' + (S.voice === v[0] ? ' selected' : '') + '>' + v[2] + ' ' + v[1] + '</option>'; }).join('') + '</select></label>' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Soundeffekte <input type="checkbox" id="snd" ' + (S.sound ? 'checked' : '') + ' style="width:22px;height:22px;accent-color:#ff5fa2"></label></div>';
  }
  function bindSettings() {
    $('#goal').onchange = function () { S.goal = +this.value; save(); };
    $('#snd').onchange = function () { S.sound = this.checked; save(); };
    $('#vc').onchange = function () { S.voice = this.value; save(); toast('🗣️ Stimme: ' + voiceInfo(S.voice)[1]); };
  }
  function viewBadges() {
    var L = lvlInfo(S.xp), got = BADGES.filter(function (b) { return S.badges[b[0]]; }).length;
    var html = topBar() + '<div class="stat-grid"><div><b>' + L.lvl + '</b><small>Level</small></div><div><b>' + streak() + '🔥</b><small>Tage Serie</small></div><div><b>' + (S.answered ? Math.round(S.correct / S.answered * 100) : 0) + '%</b><small>Trefferquote</small></div><div><b>' + S.answered + '</b><small>Antworten</small></div><div><b>' + S.tests + '</b><small>Tests</small></div><div><b>' + S.bestCombo + '</b><small>beste Combo</small></div></div>' +
      '<div class="sec-title"><h2>Abzeichen</h2><small>' + got + ' / ' + BADGES.length + '</small></div><div class="badges">' +
      BADGES.map(function (b) { return '<div class="badge ' + (S.badges[b[0]] ? '' : 'off') + '"><div class="e">' + b[1] + '</div><b>' + b[2] + '</b><small>' + b[3] + '</small></div>'; }).join('') + '</div>' +
      '<div class="sec-title"><h2>Einstellungen</h2></div><div class="card" style="display:grid;gap:10px">' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Tagesziel <select id="goal" style="font:inherit;background:var(--card2);color:var(--text);border:1px solid var(--line2);border-radius:10px;padding:6px 8px">' + [50, 100, 200, 300].map(function (g) { return '<option ' + (S.goal === g ? 'selected' : '') + ' value="' + g + '">' + g + ' XP</option>'; }).join('') + '</select></label>' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Podcast-Stimme <select id="vc" style="font:inherit;background:var(--card2);color:var(--text);border:1px solid var(--line2);border-radius:10px;padding:6px 8px">' + VOICES.map(function (v) { return '<option ' + (S.voice === v[0] ? 'selected' : '') + ' value="' + v[0] + '">' + v[2] + ' ' + v[1] + '</option>'; }).join('') + '</select></label>' +
      '<label style="display:flex;justify-content:space-between;align-items:center;font-weight:700">Soundeffekte <input type="checkbox" id="snd" ' + (S.sound ? 'checked' : '') + ' style="width:22px;height:22px;accent-color:#ff5fa2"></label></div>' + remSection();
    app.innerHTML = html;
    bindRem();
    $('#goal').onchange = function () { S.goal = +this.value; save(); };
    $('#snd').onchange = function () { S.sound = this.checked; save(); };
    $('#vc').onchange = function () { S.voice = this.value; save(); toast('🗣️ Stimme: ' + voiceInfo(S.voice)[1]); };
  }

  /* ================= Erinnerungen (Kalender + Benachrichtigungen) ================= */
  var REM_SLOTS = [['morgens', '🌅 Morgens', '07:30'], ['mittags', '🥪 Mittags', '12:30'], ['abends', '🌆 Abends', '18:30'], ['nachts', '🦉 Late Night', '22:30']];
  var REM_TXT = {
    morgens: ['☀️ Guten Morgen, {n}! Zeit für 5 schnelle Fragen', '☕ Kaffee + 5 Fragen = perfekter Start in den Tag', '🌅 Guten Morgen! Dein Gehirn ist jetzt am frischesten – nutz es', '🧠 Morgenrunde: Ein Podcast-Thema zum Wachwerden?', '🚀 Wer morgens lernt, hat abends frei', '🐦 Der frühe Vogel cached den Wurm – 10 Minuten OS?', '☀️ Neuer Tag, neue XP. Chippy wartet schon!', '📚 5 Minuten jetzt sparen dir 5 Stunden vor der Prüfung'],
    mittags: ['🥪 {n}, Mittagspause? Ein Podcast-Thema passt genau rein', '🥪 Mittagspause? Ein Podcast-Thema passt genau rein', '🍝 Nudeln + Paging = perfekte Kombi', '⏸️ Kurze Pause vom Alltag: 5 Fragen, dann weiter', '🎧 Ohren frei? Ein Thema hören, während du isst', '⚡ Mittags-Boost: Ein schneller Quiz-Sprint!', '🧩 Halbzeit des Tages – Zeit für ein bisschen Kernel-Wissen'],
    abends: ['🌆 {n}, Feierabend-Runde: 10 Minuten OS, dann Serie', '🌆 Feierabend-Runde: 10 Minuten OS, dann Serie', '🔥 Halte deine Streak am Leben – eine Runde reicht', '🎯 Deine falschen Fragen warten auf Revanche', '🧠 Abends gelernt, über Nacht gespeichert – Schlaf ist dein Cache', '📈 Ein Quiz heute = Fortschritt, den du morgen spürst', '🎮 Level-Up in Reichweite? Schau mal rein!'],
    nachts: ['🦉 {n}, noch wach? Late-Night-Lernsession gefällig?', '🦉 Late-Night-Lernsession? 10 Minuten, dann ab ins Bett', '🌙 Noch wach? Ein Podcast zum Einschlafen über TLBs', '⭐ Nachteulen-Bonus: Eine letzte Runde Fragen?', '😴 Kurz lernen, dann schlafen – dein Gehirn sortiert über Nacht', '🌌 Kernel-Modus aktiviert: Late Night Learning'],
    streak: ['🔥 {n}, deine Streak ist in Gefahr! 5 Fragen retten sie', '🥺 {n}, Chippy vermisst dich – eine kleine Runde für die Streak?', '🔥 Deine Streak ist in Gefahr! Noch nicht gelernt? 5 Fragen retten sie', '😱 Chippy macht sich Sorgen um deine Streak – schnell eine Runde!', '⏳ Der Tag ist fast vorbei – lass deine Serie nicht reißen', '🚨 Streak-Alarm! Nur ein paar Fragen bis Mitternacht', '🥺 Chippy vermisst dich. Eine kleine Runde für die Streak?']
  };
  function remCfg() {
    var r = S.rem || {}; REM_SLOTS.forEach(function (x) { if (!r[x[0]]) r[x[0]] = { on: x[0] === 'abends', t: x[2] }; });
    if (!r.streak) r.streak = { on: true, t: '21:00' };
    S.rem = r; return r;
  }
  function remSection() {
    var r = remCfg(), inp = 'style="font:inherit;font-weight:800;background:var(--card2);color:var(--text);border:1px solid var(--line2);border-radius:10px;padding:6px 8px"';
    var row = function (key, label, cfg, sub) {
      return '<div class="remrow"><label class="remlab"><input type="checkbox" data-rk="' + key + '" ' + (cfg.on ? 'checked' : '') + '><span><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label><input type="time" data-rt="' + key + '" value="' + cfg.t + '" ' + inp + '></div>';
    };
    return '<div class="sec-title"><h2>🔔 Erinnerungen</h2></div><div class="card" style="display:grid;gap:12px">' +
      '<div style="display:flex;gap:10px;align-items:center">' + chippy('happy', 48) + '<div style="font-size:14px;color:#d8d5f5;font-weight:700">Wann lernst du am liebsten? Chippy erinnert dich – jeden Tag mit einem neuen Spruch.</div></div>' +
      REM_SLOTS.map(function (x) { return row(x[0], x[1], r[x[0]]); }).join('') +
      row('streak', '🔥 Streak-Warnung', r.streak, 'abends, falls du heute noch nicht gelernt hast') +
      '<div id="calstate" class="calstate"></div>' +
      '<button class="btn main block" id="remcal"></button>' +
      '<a id="calshare" class="calshare" href="javascript:void 0">Kalender öffnet sich nicht? Datei teilen / in „Dateien“ sichern ›</a>' +
      '<div style="font-size:12.5px;color:var(--dim);line-height:1.5">So geht\'s: Tippen → im Kalender-Fenster <b>„Alle hinzufügen“</b>. Die Erinnerungen kommen dann als normale iPhone-Mitteilung mit Weckalarm – jeden Tag mit neuem Spruch. Tipp: Lege in der Kalender-App einen eigenen Kalender „OS lernen“ an und wähle ihn beim Hinzufügen – dann kannst du alles mit einem Tipp wieder löschen.</div></div>';
  }
  function icsEsc(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function icsDate(d, hm) { var p = hm.split(':'); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(+p[0]) + pad(+p[1]) + '00'; }
  var CAL_DAYS = 60;
  function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dparse(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function calInfo() {
    var cfg = JSON.stringify(remCfg()) + '|' + (S.name || ''), c = S.cal, t0 = dparse(today());
    if (!c) return { state: 'neu', cfg: cfg, start: t0 };
    var until = dparse(c.until), left = Math.round((until - t0) / 864e5);
    if (c.cfg !== cfg) return { state: 'geaendert', cfg: cfg, start: t0, left: left, until: until };
    if (left < 0) return { state: 'abgelaufen', cfg: cfg, start: t0, left: left, until: until };
    return { state: 'aktiv', cfg: cfg, start: new Date(until.getFullYear(), until.getMonth(), until.getDate() + 1), left: left, until: until };
  }
  function calState() {
    var ci = calInfo(), el = $('#calstate'), b = $('#remcal'); if (!el) return;
    var dd = function (d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; };
    if (ci.state === 'neu') { el.innerHTML = 'Noch nicht im Kalender.'; b.textContent = '📅 In Apple Kalender eintragen'; }
    else if (ci.state === 'geaendert') { el.innerHTML = '⚠️ Du hast Zeiten oder Namen geändert. Lösch in der Kalender-App die alten „OS lernen“-Termine (bzw. den Kalender „OS lernen“) und trag die neuen ein.'; el.className = 'calstate warn'; b.textContent = '📅 Neue Zeiten eintragen'; return; }
    else if (ci.state === 'abgelaufen') { el.innerHTML = '⏰ Deine Kalender-Erinnerungen sind abgelaufen.'; el.className = 'calstate warn'; b.textContent = '📅 Wieder eintragen (' + CAL_DAYS + ' Tage)'; return; }
    else { el.innerHTML = '✅ Im Kalender bis <b>' + dd(ci.until) + '</b> (noch ' + ci.left + ' Tage).' + (ci.left <= 7 ? ' Zeit zum Verlängern!' : ''); b.textContent = '📅 Um ' + CAL_DAYS + ' Tage verlängern'; }
    el.className = 'calstate' + (ci.state === 'aktiv' && ci.left <= 7 ? ' warn' : '');
  }
  function buildIcs(start) {
    var r = remCfg(), url = location.href.split('#')[0].split('?')[0], now = new Date(), stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''), ev = [];
    var slots = REM_SLOTS.map(function (x) { return x[0]; }).concat(['streak']), lastK = null;
    slots.forEach(function (k) { if (r[k] && r[k].on && k !== 'streak') lastK = k; });
    for (var day = 0; day < CAL_DAYS; day++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + day), isToday = dkey(d) === today();
      slots.forEach(function (k, si) {
        var c = r[k]; if (!c || !c.on) return;
        var hm = c.t.split(':'); if (isToday && (+hm[0] * 60 + +hm[1]) <= now.getHours() * 60 + now.getMinutes()) return;
        var seed = Math.floor(d.getTime() / 864e5), cand = REM_TXT[k].filter(function (x) { return S.name || x.indexOf('{n}') < 0; }), txt = cand[(seed + si * 3) % cand.length].replace(/\{n\}/g, S.name || '');
        if (day === CAL_DAYS - 1 && k === (lastK || 'streak')) txt = '📅 ' + (S.name ? S.name + ', l' : 'L') + 'etzte Lern-Erinnerung! Öffne OS lernen → Profil → Erinnerungen → „Verlängern“';
        var end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +hm[0], +hm[1] + 15);
        ev.push(['BEGIN:VEVENT', 'UID:ostep-' + k + '-' + icsDate(d, c.t) + '@os-lernen', 'DTSTAMP:' + stamp, 'DTSTART:' + icsDate(d, c.t), 'DTEND:' + icsDate(end, pad(end.getHours()) + ':' + pad(end.getMinutes())),
          'SUMMARY:' + icsEsc(txt), 'DESCRIPTION:' + icsEsc((k === 'streak' ? 'Falls du heute noch nicht gelernt hast: Schon 5 Fragen halten deine Streak am Leben.\n\n' : 'Zeit für eine kurze Lernrunde in OS lernen.\n\n') + url), 'URL:' + url,
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(txt), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n'));
      });
    }
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OS lernen//Lernzeiten//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:OS lernen'].concat(ev).concat(['END:VCALENDAR']).join('\r\n');
  }
  function bindRem() {
    $$('[data-rk]').forEach(function (c) { c.onchange = function () { remCfg()[c.dataset.rk].on = c.checked; save(); syncPush(); calState(); }; });
    $$('[data-rt]').forEach(function (c) { c.onchange = function () { if (c.value) { remCfg()[c.dataset.rt].t = c.value; save(); syncPush(); calState(); } }; });
    var make = function () {
      var ci = calInfo(), ics = buildIcs(ci.start), n = (ics.match(/BEGIN:VEVENT/g) || []).length;
      if (!n) { toast('Bitte mindestens eine Lernzeit einschalten.'); return null; }
      var until = new Date(ci.start.getFullYear(), ci.start.getMonth(), ci.start.getDate() + CAL_DAYS - 1);
      return { ics: ics, n: n, done: function () { S.cal = { until: dkey(until), cfg: ci.cfg }; save(); calState(); } };
    };
    $('#remcal').onclick = function () {
      var m = make(); if (!m) return;
      var url = URL.createObjectURL(new Blob([m.ics], { type: 'text/calendar;charset=utf-8' }));
      var w = /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? window.open(url, '_blank') : null;
      if (!w) { var a = document.createElement('a'); a.href = url; a.download = 'os-lernen-lernzeiten.ics'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 1000); }
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      m.done(); sfx('win');
      toast('📅 ' + m.n + ' Erinnerungen – jetzt „Alle hinzufügen“ tippen', 4200);
    };
    $('#calshare').onclick = function () {
      var m = make(); if (!m) return;
      var file; try { file = new File([m.ics], 'os-lernen-lernzeiten.ics', { type: 'text/calendar' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'OS lernen – Lernzeiten' }).then(m.done).catch(function () {});
      else { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([m.ics], { type: 'text/calendar' })); a.download = 'os-lernen-lernzeiten.ics'; document.body.appendChild(a); a.click(); m.done(); setTimeout(function () { a.remove(); }, 1000); }
    };
    calState();
  }
  /* Push-Benachrichtigungen: brauchen einen kleinen Server (PUSH_API). Ist keiner eingerichtet, erklärt die App das. */
  var PUSH_API = window.OSTEP_PUSH_API || '';
  function standalone() { return window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  function pushInfo(msg) {
    var el = $('#rempushinfo'); if (!el) return;
    if (msg) { el.innerHTML = msg; return; }
    if (S.pushOn) el.innerHTML = '✅ Push ist aktiv. Änderungen an den Zeiten werden automatisch übernommen.';
    else if (!PUSH_API) el.innerHTML = 'Echte Push-Nachrichten (inkl. „Streak in Gefahr“ nur, wenn du heute noch nicht gelernt hast) werden gerade eingerichtet. Bis dahin: Kalender-Erinnerungen nutzen.';
    else if (!standalone()) el.innerHTML = 'Push funktioniert auf dem iPhone nur in der App vom Home-Bildschirm: Teilen → „Zum Home-Bildschirm“, dann dort aktivieren.';
    else el.innerHTML = 'Tippe oben, um Benachrichtigungen zu erlauben.';
  }
  function b64u(s) { var p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function enablePush() {
    if (!PUSH_API) { pushInfo(); toast('Push wird noch eingerichtet – nutze solange den Kalender 📅'); return; }
    if (!standalone()) { pushInfo(); return; }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { pushInfo('Dieses Gerät unterstützt keine Web-Push-Nachrichten (iOS 16.4 oder neuer nötig).'); return; }
    Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') { pushInfo('Benachrichtigungen wurden nicht erlaubt. Ändern kannst du das in den iOS-Einstellungen → Mitteilungen.'); return; }
      return navigator.serviceWorker.register('sw.js').then(function (reg) { return navigator.serviceWorker.ready.then(function () { return reg; }); }).then(function (reg) {
        return fetch(PUSH_API + '/key').then(function (r) { return r.text(); }).then(function (key) { return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(key.trim()) }); });
      }).then(function (sub) { S.pushSub = sub.toJSON(); S.pushOn = true; save(); return syncPush(); }).then(function () { pushInfo(); toast('🔔 Erinnerungen aktiv!'); sfx('win'); });
    }).catch(function (e) { pushInfo('Das hat nicht geklappt: ' + esc(e && e.message || e)); });
  }
  function syncPush() {
    if (!PUSH_API || !S.pushOn || !S.pushSub) return Promise.resolve();
    var body = { sub: S.pushSub, rem: remCfg(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, lastDay: S.days[today()] ? today() : null, streak: streak() };
    return fetch(PUSH_API + '/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {});
  }

  /* ================= Podcast-Player ================= */
  var P = null;
  function stopPlayer() {
    if (!P) return;
    if (P.acc && P.tn) { addTime(P.tn[0], P.tn[1], 'l', P.acc); P.acc = 0; save(); }
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
      (tm ? '' : '<div class="audio-missing">🔈 ' + (S.voice === 'ki' ? 'Die KI-Stimme gibt es bisher nur für Kapitel 18 und 19 – hier liest die Sprachausgabe deines Geräts.' : 'Für diese Stimme fehlt die Aufnahme noch – es wird die Sprachausgabe deines Geräts verwendet.') + '</div>') +
      '<div class="scrub"><input type="range" id="seek" min="0" max="1000" value="0" aria-label="Position"><div class="times"><span id="tcur">0:00</span><span id="ttot">' + (tm ? fmt(tm.d) : '') + '</span></div></div>' +
      '<div class="controls"><button class="c" id="back15">−15</button><button class="c play" id="play" aria-label="Abspielen">▶</button><button class="c" id="fwd15">+15</button></div>' +
      '<div class="prow' + (next ? '' : ' four') + '"><button class="btn sm tile" id="voice"><i>' + voiceInfo(S.voice)[2] + '</i><span>' + voiceInfo(S.voice)[1] + '</span></button><button class="btn sm tile" id="speed"><i>⏩</i><span>1×</span></button><button class="btn sm tile" id="text"><i>📄</i><span>Text</span></button><a class="btn sm tile" href="#/k/' + n + '/quiz/' + tid + '"><i>🎯</i><span>Quiz</span></a>' + (next ? '<a class="btn sm tile" href="#/k/' + n + '/lernen/' + next.id + '"><i>⏭️</i><span>Weiter</span></a>' : '') + '</div>' +
      '<div class="segs" id="segs">' + t.segs.map(function (s, i) { return '<button data-i="' + i + '">' + (i + 1) + '. ' + esc(s.h) + '</button>'; }).join('') + '</div></div>' +
      '<div class="sheet" id="sheet"><div class="panel"><div class="grab"></div><div class="article" id="art"></div></div></div>';
    var svg = $('.vis'), segh = $('#segh'), cap = $('#cap'), seek = $('#seek'), playB = $('#play');
    P = { n: n, t: t, tm: tm, cur: 0, segP: 0, speed: 1, playing: false, seeking: false, startT: performance.now(), tn: [n, tid], acc: 0, lt: 0 };
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
      var time, i, p, nowT = performance.now();
      if (P.playing && P.lt) { P.acc += Math.min(1, (nowT - P.lt) / 1000); if (P.acc >= 15) { addTime(P.tn[0], P.tn[1], 'l', P.acc); P.acc = 0; save(); } }
      P.lt = nowT;
      if (tm) {
        time = curTime(); i = segAt(time);
        var s0 = tm.s[i], s1 = i + 1 < tm.s.length ? tm.s[i + 1] : tm.d; p = (time - s0) / Math.max(.1, s1 - s0);
        if (!P.seeking) { seek.value = Math.round(time / tm.d * 1000); seek.style.setProperty('--fill', (time / tm.d * 100) + '%'); }
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
    $('#speed').onclick = function () { P.speed = speeds[(speeds.indexOf(P.speed) + 1) % speeds.length]; this.querySelector('span').textContent = P.speed + '×'; if (P.audio) { P.audio.playbackRate = P.speed; } };
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
    // lange Sätze für Untertitel in Häppchen (≤ 90 Zeichen) teilen – passt in zwei Zeilen
    var MAXC = 90, parts = [];
    merged.forEach(function (x) {
      if (x.length <= MAXC) { parts.push(x); return; }
      var bits = x.split(/([,;:–]\s+)/), cur = '';
      var pieces = []; for (var i = 0; i < bits.length; i += 2) pieces.push(bits[i] + (bits[i + 1] || ''));
      var words = [];
      pieces.forEach(function (pc) { if (pc.length > MAXC) words = words.concat(pc.split(' ').map(function (w) { return w + ' '; })); else words.push(pc); });
      words.forEach(function (w) { if (cur && (cur + w).trim().length > MAXC) { parts.push(cur.trim()); cur = ''; } cur += w; });
      if (cur.trim()) parts.push(cur.trim());
    });
    merged = parts;
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
      if (before < .9 && f >= .9) { addXp(30, $('#play')); confetti(80); sfx('win'); pep(rnd(MOT.listened), 'cool', true); }
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
    Q.qStart = Date.now();
    var it = Q.items[Q.i], ch = O.chapters[Q.n], t = ch.topics.filter(function (x) { return x.id === it.t; })[0];
    var isNew = box(it.id) < 0;
    app.innerHTML = '<div class="qtop"><a class="x" href="#/k/' + Q.n + '" aria-label="Beenden">✕</a><div class="qprog"><i style="width:' + (Q.i / Q.items.length * 100) + '%"></i></div><div class="combo" id="combo">' + (Q.combo >= 2 ? '🔥×' + Q.combo : '') + '</div></div>' +
      '<div class="qcard"><div class="qmeta"><span>' + (Q.i + 1) + ' / ' + Q.items.length + ' · ' + esc(t.title) + '</span><span>' + (isNew ? '✨ neu' : box(it.id) === 0 ? '↻ Wiederholung' : '') + '</span></div>' +
      '<div class="qtext">' + md(it.q) + '</div>' + (it.num != null ?
      '<div class="numq"><div class="numhint">⌨️ Antwort eintippen · <b>' + esc(it.hint || 'Zahl') + '</b></div><div class="numrow"><input id="numin" type="text" inputmode="decimal" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Zahl eingeben"><span class="unit">' + esc(it.unit || '') + '</span></div><button class="btn main block" id="numok">Prüfen</button></div></div><div class="fb" id="fb"></div>' :
      '<div class="opts">' +
      it.order.map(function (ai, k) { return '<button class="opt" data-a="' + ai + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + md(it.a[ai]).replace(/^<p>|<\/p>$/g, '') + '</span></button>'; }).join('') +
      '</div></div><div class="fb" id="fb"></div>');
    $$('.opt').forEach(function (b) { b.onclick = function () { answer(+b.dataset.a, b); }; });
    if (it.num != null) {
      var inp = $('#numin'), ok = $('#numok');
      var go = function () {
        var v = parseNum(inp.value);
        if (isNaN(v)) { inp.classList.add('err'); toast('Bitte eine Zahl eingeben – ' + (it.hint || '')); return; }
        inp.blur(); inp.disabled = true; ok.disabled = true;
        var right = Math.abs(v - it.num) <= (it.tol || 0) + 1e-9;
        it.given = String(v); it.a = [it.a[0], fmtNum(v) + (it.unit ? ' ' + it.unit : '')];
        inp.classList.add(right ? 'right' : 'wrong');
        answer(right ? 0 : 1, ok);
      };
      ok.onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); }; inp.oninput = function () { inp.classList.remove('err'); };
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 350);
    }
  }
  function answer(ai, btn) {
    var it = Q.items[Q.i], right = ai === 0;
    $$('.opt').forEach(function (b) { b.disabled = true; var a = +b.dataset.a; if (a === 0) b.classList.add('right'); else if (b === btn) b.classList.add('wrong'); else b.classList.add('dim'); });
    var r = S.q[it.id] || { b: 0, n: 0, c: 0, t: 0 };
    r.n++; r.t = Date.now();
    var qsec = Math.min(180, (Date.now() - (Q.qStart || Date.now())) / 1000); Q.sec = (Q.sec || 0) + qsec; addTime(it.n, it.t, 'q', qsec);
    S.answered++;
    var gain = 0;
    if (right) {
      r.b = Math.min(5, (S.q[it.id] ? r.b : 0) + 1); r.c++; S.correct++;
      Q.ok++; Q.combo++; Q.maxCombo = Math.max(Q.maxCombo, Q.combo); S.bestCombo = Math.max(S.bestCombo, Q.combo);
      gain = 10 + Math.min(Q.combo - 1, 5) * 2;
      sfx('ok', Q.combo);
      Q.wrongRow = 0;
      if (MOT.combo[Q.combo]) { if (Q.combo >= 5) confetti(60); pep(rnd(MOT.combo[Q.combo]), Q.combo >= 8 ? 'cool' : 'party', true); }
    } else { r.b = 0; Q.combo = 0; Q.wrong.push(it); sfx('bad'); if (navigator.vibrate) navigator.vibrate(60); Q.wrongRow = (Q.wrongRow || 0) + 1; if (Q.wrongRow === 2 || Q.wrongRow === 4) pep(rnd(MOT.wrong), 'think', true); }
    if (Q.i + 1 === Math.ceil(Q.items.length / 2) && Q.items.length >= 10) setTimeout(function () { pep(rnd(MOT.half).replace('{ok}', Q.ok).replace('{cnt}', Q.i + 1), Q.ok >= (Q.i + 1) * .7 ? 'cool' : 'strong'); }, 900);
    S.q[it.id] = r; save();
    if (gain) { Q.xp += gain; addXp(gain, btn); }
    var c = $('#combo'); c.textContent = Q.combo >= 2 ? '🔥×' + Q.combo : ''; c.classList.remove('pop'); void c.offsetWidth; if (Q.combo >= 2) c.classList.add('pop');
    var praise = ['Richtig!', 'Super!', 'Stark!', 'Genau so!', 'Perfekt!', 'Klasse!', 'Volltreffer!'], comfort = ['Nicht ganz.', 'Knapp daneben.', 'Fast!', 'Das sitzt beim nächsten Mal.'];
    var fb = $('#fb'), reason = right ? '' : (it.w ? it.w[ai - 1] : (it.wr && (it.wr[it.a[ai]] || it.wr[it.given]))) || '';
    fb.className = 'fb ' + (right ? 'good' : 'bad');
    fb.innerHTML = '<div class="inner"><h3>' + (right ? '✅ ' + praise[Math.floor(Math.random() * praise.length)] + (gain ? ' <span style="color:#ffd166;font-size:15px">+' + gain + ' XP</span>' : '') : '💡 ' + comfort[Math.floor(Math.random() * comfort.length)]) + '</h3>' +
      (right ? '<div class="why ok"><b>✔ Warum das stimmt</b></div>' : '<div class="why bad"><b>✘ Deine Antwort:</b> ' + md(it.a[ai]).replace(/^<p>|<\/p>$/g, '') + (reason ? '<div class="reason">' + md(reason).replace(/^<p>|<\/p>$/g, '') + '</div>' : '') + '</div><div class="why ok"><b>✔ Richtig ist:</b> ' + md(it.a[0]).replace(/^<p>|<\/p>$/g, '') + '</div><div class="why"><b>Erklärung</b></div>') +
      '<div class="ex">' + md(it.e) + '</div><div class="row"><button class="info" id="info" title="Im Lerntext nachlesen">i</button><button class="btn ' + (right ? 'ok' : 'main') + ' block" id="next">' + (Q.i + 1 < Q.items.length ? 'Weiter' : 'Auswertung') + '</button></div></div>';
    requestAnimationFrame(function () { fb.classList.add('on'); });
    $('#info').onclick = function () {
      var url = location.href.split('#')[0] + '#/k/' + it.n + '/text/' + it.t + '/' + (it.s || 0) + (it.m ? '?m=' + encodeURIComponent(it.m) : '');
      window.open(url, '_blank');
    };
    $('#next').onclick = function () { Q.i++; if (Q.i < Q.items.length) renderQ(); else result(); };
  }
  function grade(pct) {
    var t = [[.95, '1,0'], [.9, '1,3'], [.85, '1,7'], [.8, '2,0'], [.75, '2,3'], [.7, '2,7'], [.65, '3,0'], [.6, '3,3'], [.55, '3,7'], [.5, '4,0']];
    for (var i = 0; i < t.length; i++) if (pct >= t[i][0] - 1e-9) return t[i][1];
    return '5,0';
  }
  function result() {
    var total = Q.items.length, pct = Q.ok / total, perfect = Q.ok === total;
    var bonus = 20 + (perfect ? 50 : 0);
    S.tests++; if (perfect) S.perfect++;
    (S.hist = S.hist || []).push({ d: Date.now(), n: Q.n, tid: Q.tid, ok: Q.ok, total: total, sec: Math.round(Q.sec || 0) }); if (S.hist.length > 400) S.hist = S.hist.slice(-400);
    save();
    addXp(bonus);
    var after = Q.tid === 'alle' ? chapterProgress(Q.n) : mastery(Q.n, Q.tid);
    var openList = Q.tid === 'alle' ? O.chapters[Q.n].topics.reduce(function (a, t) { return a.concat(pool(Q.n, t.id)); }, []) : pool(Q.n, Q.tid);
    var openN = openList.filter(function (it) { var r = S.q[it.id]; return !r || r.b === 0; }).length;
    var ms = [.25, .5, .75, 1].filter(function (m) { return Q.masteryBefore < m && after >= m; }).pop();
    if (ms) setTimeout(function () { cheer({ title: ms === 1 ? 'Komplett gemeistert! 👑' : Math.round(ms * 100) + ' % gemeistert!', text: ms === 1 ? 'Du hast ' + (Q.tid === 'alle' ? 'das ganze Kapitel' : 'dieses Thema') + ' gemeistert. Respekt!' : 'Schon ' + Math.round(ms * 100) + ' % ' + (Q.tid === 'alle' ? 'von Kapitel ' + Q.n : 'dieses Themas') + ' sitzen. Noch ' + openN + ' offene Fragen bis zum Ziel.', progress: after, mood: ms === 1 ? 'cool' : 'party' }); }, 1200);
    var emoji = perfect ? '🏆' : pct >= .8 ? '🎉' : pct >= .6 ? '💪' : pct >= .4 ? '📈' : '🌱';
    var msg = perfect ? 'Fehlerfrei! Das ist Meisterklasse.' : pct >= .8 ? 'Richtig stark – fast alles sitzt!' : pct >= .6 ? 'Gute Basis! Die Wiederholungen bringen dich auf 100 %.' : pct >= .4 ? 'Du kommst voran. Hör dir den Podcast nochmal an!' : 'Jeder Anfang zählt – die falschen Fragen kommen gezielt wieder.';
    sfx('win'); confetti(perfect ? 240 : pct >= .6 ? 120 : 40);
    var gr = grade(pct), gcol = pct >= .85 ? '#7ff0b2' : pct >= .65 ? '#ffd166' : pct >= .5 ? '#ffb347' : '#ff8a95';
    app.innerHTML = '<div class="result"><div class="big">' + emoji + '</div><h1>' + Q.ok + ' von ' + total + ' richtig</h1>' +
      (Q.tid === 'alle' ? '<div class="gradebox"><div><small>Deine Note</small><b style="color:' + gcol + '">' + gr + '</b></div><div><small>richtig</small><b>' + Math.round(pct * 100) + ' %</b></div><div><small>Zeit</small><b>' + fmt(Q.sec || 0) + '</b></div></div><div style="font-size:12px;color:var(--faint);margin-top:-4px">Notenschlüssel wie an Unis üblich: ab 50 % bestanden (4,0), ab 95 % 1,0</div>' : '<div style="font-weight:800;color:#c9c3ff">' + Math.round(pct * 100) + ' % richtig · ' + fmt(Q.sec || 0) + ' Min.</div>') + '<p style="color:var(--dim)">' + msg + '</p>' +
      '<div class="motcard">' + chippy(pct >= .8 ? 'party' : pct >= .5 ? 'strong' : 'think', 54) + '<div>' + (openN ? 'Noch <b>' + openN + '</b> offene oder falsche Fragen ' + (Q.tid === 'alle' ? 'im Kapitel' : 'in diesem Thema') + ' – jede Runde werden es weniger!' : 'Keine offenen Fragen mehr – jetzt nur noch auffrischen! 🏆') + '</div></div>' +
      '<div class="stat-grid"><div><b style="color:#ffd166">+' + (Q.xp + bonus) + '</b><small>XP</small></div><div><b>🔥' + Q.maxCombo + '</b><small>beste Combo</small></div><div><b>' + Math.round(after * 100) + '%</b><small>Fortschritt ' + (after > Q.masteryBefore ? '▲' + Math.round((after - Q.masteryBefore) * 100) : '') + '</small></div></div>' +
      '<div style="display:grid;gap:10px"><a class="btn main block" href="#/k/' + Q.n + '/quiz/' + Q.tid + '?r=' + Date.now() + '">Nochmal ' + total + ' Fragen ↻</a><a class="btn block" href="#/k/' + Q.n + '">Zurück zum Kapitel</a></div>' +
      (Q.wrong.length ? '<div class="sec-title"><h2>Zum Wiederholen</h2><small>' + Q.wrong.length + '</small></div><div class="review">' + Q.wrong.map(function (it) {
        return '<div class="r"><b>' + md(it.q).replace(/<\/?p>/g, ' ') + '</b><div class="ans">✔ ' + md(it.a[0]).replace(/<\/?p>/g, '') + '</div><div style="margin-top:6px;color:var(--dim)">' + md(it.e).replace(/<\/?p>/g, ' ') + '</div><a class="btn sm" style="margin-top:8px" target="_blank" href="#/k/' + it.n + '/text/' + it.t + '/' + (it.s || 0) + (it.m ? '?m=' + encodeURIComponent(it.m) : '') + '">ℹ︎ Nachlesen</a></div>';
      }).join('') + '</div>' : '') + '</div>';
    checkBadges();
  }

  /* ================= Router ================= */
  function route() {
    stopPlayer(); stopTerms(); closeSheets(); window.scrollTo(0, 0);
    var h = location.hash.replace(/^#/, '') || '/', qs = '', qi = h.indexOf('?');
    if (qi >= 0) { qs = h.slice(qi + 1); h = h.slice(0, qi); }
    var params = {}; qs.split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); params[p[0]] = decodeURIComponent(p[1] || ''); });
    var p = h.split('/').filter(Boolean);
    document.body.classList.remove('immersive');
    $$('.tabbar a').forEach(function (a) { a.classList.toggle('on', (p[0] || 'home') === a.dataset.tab || (!p[0] && a.dataset.tab === 'home')); });
    if (!p.length) viewHome();
    else if (p[0] === 'kapitel') viewChapters();
    else if (p[0] === 'erfolge') viewProfile('erfolge');
    else if (p[0] === 'profil') viewProfile(p[1]);
    else if (p[0] === 'k' && p.length === 2) viewChapter(+p[1]);
    else if (p[0] === 'k' && p[2] === 'lernen') viewLearn(+p[1], p[3]);
    else if (p[0] === 'k' && p[2] === 'text') viewText(+p[1], p[3], +(p[4] || 0), params.m || '');
    else if (p[0] === 'k' && p[2] === 'quiz') viewQuiz(+p[1], p[3]);
    else if (p[0] === 'k' && p[2] === 'merken') viewMerk(+p[1]);
    else viewHome();
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('touchstart', function () { audioCtx(); }, { once: true, passive: true });
  document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#ff5fa2"/></linearGradient><linearGradient id="chipg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a48bff"/><stop offset="1" stop-color="#6a4cf0"/></linearGradient></defs></svg>');
  window.OSTEP_APP = { pool: pool };
  route();
})();
