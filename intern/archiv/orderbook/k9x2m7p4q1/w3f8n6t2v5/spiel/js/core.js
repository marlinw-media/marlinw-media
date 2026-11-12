/* Pets — Kern: Canvas, Eingabe, Audio, Speicher, Partikel, Kamera, Szenen, UI */
(function () {
  'use strict';
  var G = window.G = {};
  var $ = G.$ = function (id) { return document.getElementById(id); };

  /* ================= Hilfsfunktionen ================= */
  G.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  G.lerp = function (a, b, t) { return a + (b - a) * t; };
  G.rand = function (a, b) { return a + Math.random() * (b - a); };
  G.randi = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  G.pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };
  G.dist = function (ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); };
  G.easeOutBack = function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  G.easeInOut = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  G.easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  G.damp = function (a, b, lambda, dt) { return G.lerp(a, b, 1 - Math.exp(-lambda * dt)); };
  /* beschleunigt o.vx/o.vy gleichmäßig auf die Zielgeschwindigkeit zu */
  G.approach = function (o, tx, ty, accel, dt) {
    var dx = tx - o.vx, dy = ty - o.vy, d = Math.hypot(dx, dy), m = accel * dt;
    if (d <= m || d < 1e-4) { o.vx = tx; o.vy = ty; } else { o.vx += dx / d * m; o.vy += dy / d * m; }
  };
  G.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  G.distToSeg = function (px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    var t = l2 ? G.clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  };
  G.fmtTime = function (s) { s = Math.max(0, s); var m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); };
  G.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  /* glatte, geschlossene Kurve durch Punkte (Catmull-Rom → Bézier) */
  G.smoothPath = function (ctx, pts, closed) {
    var n = pts.length; if (n < 2) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
      ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
    }
    if (closed) ctx.closePath();
  };
  G.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  G.makeCanvas = function (w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

  /* ================= Canvas & adaptive Qualität ================= */
  var canvas = $('game');
  var ctx = G.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  var DPR_CAP = [1, 1.35, 1.75, 2.25];
  G.quality = (window.devicePixelRatio || 1) >= 2 ? 3 : 2;
  try { var qs = localStorage.getItem('mw-pets-q'); if (qs !== null) G.quality = G.clamp(+qs, 0, 3); } catch (e) {}
  G.fx = 1;
  function resize() {
    var vv = window.visualViewport;
    G.W = Math.round(vv ? vv.width : innerWidth);
    G.H = Math.round(vv ? vv.height : innerHeight);
    G.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP[G.quality]);
    G.fx = [0.45, 0.7, 1, 1][G.quality];
    canvas.width = Math.round(G.W * G.dpr);
    canvas.height = Math.round(G.H * G.dpr);
    ctx.imageSmoothingEnabled = true;
    if (G.scene && G.scene.resize) G.scene.resize();
    G.placeJoystickRest();
  }
  G.resize = resize;
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 250); });
  /* iOS: Pinch- und Doppeltipp-Zoom unterbinden */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.card')) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* Bildrate beobachten: ruckelt es dauerhaft, wird die Auflösung stufenweise reduziert */
  var perf = { acc: 0, n: 0, slow: 0 };
  function watchPerf(dtMs) {
    if (G.transition || document.hidden) return;
    perf.acc += dtMs; perf.n++;
    if (perf.acc < 2500) return;
    var avg = perf.acc / perf.n; perf.acc = 0; perf.n = 0;
    if (avg > 24 && G.quality > 0) {
      perf.slow++;
      if (perf.slow >= 2) { perf.slow = 0; G.quality--; try { localStorage.setItem('mw-pets-q', G.quality); } catch (e) {} resize(); }
    } else perf.slow = 0;
  }

  /* ================= Speicherstand ================= */
  var SAVE_KEY = 'mw-pets-v2';
  var defaults = {
    v: 2, name: 'Bello', bones: 0, seenIntro: false,
    stats: { love: 75, hunger: 75, water: 75, fur: 80, energy: 80, t: Date.now() },
    resting: false,
    owned: ['collar-red'], wear: { collar: 'collar-red', hat: null, face: null },
    best: {}, plays: {},
    quests: null,
    settings: { music: true, sfx: true, haptics: true }
  };
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
    if (!s) {
      s = JSON.parse(JSON.stringify(defaults));
      try {
        var old = JSON.parse(localStorage.getItem('mw-pet-stats'));
        if (old) ['love', 'hunger', 'water', 'fur'].forEach(function (k) { if (typeof old[k] === 'number') s.stats[k] = old[k]; });
        s.bones = parseInt(localStorage.getItem('mw-pet-bones'), 10) || 0;
      } catch (e) {}
    }
    var d = JSON.parse(JSON.stringify(defaults));
    for (var k in d) if (s[k] === undefined) s[k] = d[k];
    for (var k2 in d.stats) if (s.stats[k2] === undefined) s.stats[k2] = d.stats[k2];
    for (var k3 in d.settings) if (s.settings[k3] === undefined) s.settings[k3] = d.settings[k3];
    return s;
  }
  G.data = load();
  var saveT = null;
  G.persist = function (now) {
    clearTimeout(saveT);
    var doIt = function () {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(G.data));
        localStorage.setItem('mw-pet-bones', String(G.data.bones));
      } catch (e) {}
    };
    if (now) doIt(); else saveT = setTimeout(doIt, 400);
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden) G.persist(true); });
  window.addEventListener('pagehide', function () { G.persist(true); });

  /* Bedürfnisse sinken mit der echten Zeit (auch offline, gedeckelt auf 3 h) */
  G.decay = function () {
    var s = G.data.stats, now = Date.now();
    var min = G.clamp((now - s.t) / 60000, 0, 180);
    s.t = now;
    if (min <= 0) return;
    s.hunger = G.clamp(s.hunger - min * 1.0, 0, 100);
    s.water = G.clamp(s.water - min * 1.3, 0, 100);
    s.love = G.clamp(s.love - min * 0.8, 0, 100);
    if (G.data.resting) s.energy = G.clamp(s.energy + min * 6, 0, 100);
    else s.energy = G.clamp(s.energy - min * 0.5, 0, 100);
  };
  G.stat = function (k, delta) {
    var s = G.data.stats; s[k] = G.clamp(s[k] + delta, 0, 100); G.refreshStats(); G.persist();
  };
  G.mood = function () {
    var s = G.data.stats, avg = (s.love + s.hunger + s.water + s.fur + s.energy) / 5, low = Math.min(s.hunger, s.water);
    if (low < 20) return { key: 'sad', text: s.hunger < s.water ? 'hat Hunger …' : 'hat Durst …' };
    if (s.energy < 18) return { key: 'tired', text: 'ist müde' };
    if (s.fur < 30) return { key: 'dirty', text: 'braucht eine Bürste' };
    if (avg > 78) return { key: 'happy', text: 'ist überglücklich!' };
    if (avg > 50) return { key: 'ok', text: 'ist zufrieden' };
    return { key: 'meh', text: 'braucht Zuwendung' };
  };
  G.refreshStats = function () {
    var s = G.data.stats;
    ['love', 'hunger', 'water', 'fur'].forEach(function (k) {
      var b = $('sm-' + k); if (b) { b.style.width = s[k] + '%'; b.classList.toggle('low', s[k] < 30); }
    });
    ['love', 'hunger', 'water', 'fur', 'energy'].forEach(function (k) {
      var b = $('cb-' + k); if (b) { b.style.width = s[k] + '%'; b.classList.toggle('low', s[k] < 30); }
    });
    var m = $('mood'); if (m) m.textContent = G.data.name + ' ' + G.mood().text;
  };
  G.addBones = function (n) {
    G.data.bones = Math.max(0, G.data.bones + n);
    $('bones').textContent = G.data.bones;
    var p = $('bones-pill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump');
    G.persist();
  };

  /* ================= Haptik ================= */
  /* Vibration erst nach echter Berührung (Chrome blockiert sie vorher) */
  window.addEventListener('pointerdown', function () { G.touched = true; }, { once: true, capture: true });
  G.buzz = function (ms) {
    if (!G.touched || !G.data.settings.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(ms || 12); } catch (e) {}
  };

  /* ================= Audio (komplett synthetisch, keine Dateien) ================= */
  var A = G.audio = { ctx: null, master: null, sfx: null, music: null, amb: null };
  A.unlock = function () {
    if (!A.ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        A.ctx = new AC();
        A.master = A.ctx.createGain(); A.master.gain.value = 0.9;
        var comp = A.ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 4;
        A.master.connect(comp); comp.connect(A.ctx.destination);
        A.sfx = A.ctx.createGain(); A.sfx.connect(A.master);
        A.music = A.ctx.createGain(); A.music.connect(A.master);
        A.amb = A.ctx.createGain(); A.amb.connect(A.master);
        A.applySettings();
        /* iOS: stiller Puffer schaltet die Ausgabe frei */
        var b = A.ctx.createBuffer(1, 1, 22050), s = A.ctx.createBufferSource(); s.buffer = b; s.connect(A.ctx.destination); s.start(0);
        A.noiseBuf = A.ctx.createBuffer(1, A.ctx.sampleRate * 2, A.ctx.sampleRate);
        var dta = A.noiseBuf.getChannelData(0); for (var i = 0; i < dta.length; i++) dta[i] = Math.random() * 2 - 1;
      } catch (e) { A.ctx = null; return; }
    }
    if (A.ctx.state !== 'running') A.ctx.resume();
  };
  A.applySettings = function () {
    if (!A.ctx) return;
    var st = G.data.settings, t = A.ctx.currentTime;
    A.sfx.gain.setTargetAtTime(st.sfx ? 0.55 : 0, t, .05);
    A.amb.gain.setTargetAtTime(st.sfx ? 0.5 : 0, t, .05);
    A.music.gain.setTargetAtTime(st.music ? 0.22 : 0, t, .1);
  };
  ['pointerup', 'touchend', 'keydown', 'click'].forEach(function (ev) { window.addEventListener(ev, function () { A.unlock(); }, { passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!A.ctx) return;
    if (document.hidden) A.ctx.suspend(); else A.ctx.resume();
  });

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  A.tone = function (freq, t, dur, type, peak, dest, slideTo, attack) {
    var c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env(g, t, attack || 0.008, peak, dur);
    o.connect(g); g.connect(dest || A.sfx); o.start(t); o.stop(t + dur + 0.05);
    return o;
  };
  A.noise = function (t, dur, peak, freq, q, type, dest, attack) {
    var c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; f.type = type || 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 1;
    env(g, t, attack || 0.005, peak, dur);
    s.connect(f); f.connect(g); g.connect(dest || A.sfx);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    return f;
  };
  var lastPlay = {};
  G.sfx = function (name, vol) {
    if (!A.ctx || !G.data.settings.sfx) return;
    var c = A.ctx, t = c.currentTime + 0.005, v = vol || 1, T = A.tone, N = A.noise;
    if (lastPlay[name] && t - lastPlay[name] < 0.03) return;
    lastPlay[name] = t;
    switch (name) {
      case 'step': N(t, 0.07, 0.05 * v, 900 + Math.random() * 500, 1.2); break;
      case 'stepGravel': N(t, 0.09, 0.09 * v, 2600 + Math.random() * 800, 0.8); break;
      case 'splash': N(t, 0.35, 0.22 * v, 1100, 0.7, 'lowpass'); T(420, t, 0.12, 'sine', 0.05 * v, null, 180); break;
      case 'mud': N(t, 0.25, 0.18 * v, 320, 1.5, 'lowpass'); T(140, t, 0.18, 'sine', 0.1 * v, null, 90); break;
      case 'pet': T(660, t, 0.2, 'sine', 0.14 * v); T(990, t + 0.09, 0.25, 'sine', 0.12 * v); T(1320, t + 0.18, 0.3, 'sine', 0.06 * v); break;
      case 'dig': for (var i = 0; i < 3; i++) N(t + i * 0.13, 0.12, 0.13 * v, 500 + i * 80, 1.2); break;
      case 'bone': case 'coin': T(988, t, 0.09, 'square', 0.06 * v); T(1319, t + 0.07, 0.22, 'square', 0.06 * v); break;
      case 'throw': N(t, 0.3, 0.12 * v, 1800, 0.6, 'bandpass', null, 0.04).frequency.exponentialRampToValueAtTime(500, t + 0.3); break;
      case 'grab': T(520, t, 0.08, 'triangle', 0.15 * v); T(780, t + 0.05, 0.1, 'triangle', 0.12 * v); break;
      case 'happy': [523, 659, 784, 1047].forEach(function (f, k) { T(f, t + k * 0.07, 0.22, 'triangle', 0.12 * v); }); break;
      case 'win': [523, 659, 784, 1047, 1319, 1568].forEach(function (f, k) { T(f, t + k * 0.08, 0.35, 'triangle', 0.13 * v); T(f / 2, t + k * 0.08, 0.3, 'sine', 0.06 * v); }); break;
      case 'lose': [392, 330, 262].forEach(function (f, k) { T(f, t + k * 0.14, 0.3, 'triangle', 0.12 * v); }); break;
      case 'drop': T(260, t, 0.16, 'sine', 0.16 * v, null, 120); break;
      case 'hit': N(t, 0.25, 0.3 * v, 300, 0.8, 'lowpass'); T(160, t, 0.2, 'square', 0.08 * v, null, 60); break;
      case 'whistle': T(1700, t, 0.16, 'sine', 0.12 * v, null, 2300); T(2300, t + 0.18, 0.22, 'sine', 0.11 * v, null, 1600); break;
      case 'bark':
        var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2; f.connect(A.sfx);
        T(380 * (0.9 + Math.random() * 0.2), t, 0.13, 'sawtooth', 0.22 * v, f, 240);
        N(t, 0.1, 0.12 * v, 1400, 1.5);
        break;
      case 'yip': T(900, t, 0.08, 'sawtooth', 0.08 * v, null, 1300); break;
      case 'jump': T(300, t, 0.18, 'square', 0.07 * v, null, 720); break;
      case 'land': N(t, 0.08, 0.1 * v, 400, 1); break;
      case 'stomp': T(200, t, 0.15, 'square', 0.1 * v, null, 80); N(t, 0.12, 0.15 * v, 700, 1); break;
      case 'key': [1568, 2093, 2637].forEach(function (f, k) { T(f, t + k * 0.06, 0.25, 'sine', 0.1 * v); }); break;
      case 'door': N(t, 0.4, 0.12 * v, 250, 2, 'bandpass', null, 0.06); T(110, t, 0.3, 'sine', 0.1 * v); break;
      case 'fish': T(500, t, 0.08, 'sine', 0.15 * v, null, 1100); N(t + 0.02, 0.2, 0.12 * v, 1600, 0.7); break;
      case 'bloop': T(300 + Math.random() * 200, t, 0.1, 'sine', 0.08 * v, null, 700); break;
      case 'brush': N(t, 0.18, 0.1 * v, 4000, 0.6, 'highpass', null, 0.04); break;
      case 'eat': for (var e = 0; e < 4; e++) N(t + e * 0.11, 0.06, 0.16 * v, 1800 + Math.random() * 900, 2); break;
      case 'drink': for (var d = 0; d < 4; d++) T(380 + d * 40, t + d * 0.13, 0.08, 'sine', 0.1 * v, null, 600); break;
      case 'squeak': T(1400, t, 0.12, 'square', 0.05 * v, null, 2100); break;
      case 'snore': N(t, 0.9, 0.06 * v, 200, 1.2, 'lowpass', null, 0.4); break;
      case 'click': T(1200, t, 0.04, 'square', 0.05 * v); break;
      case 'beep': T(880, t, 0.14, 'square', 0.08 * v); break;
      case 'go': T(1760, t, 0.4, 'square', 0.08 * v); break;
      case 'buy': [784, 988, 1175, 1568].forEach(function (f, k) { T(f, t + k * 0.06, 0.2, 'triangle', 0.1 * v); }); break;
      case 'error': T(200, t, 0.18, 'square', 0.07 * v); break;
      case 'whoosh': N(t, 0.4, 0.1 * v, 600, 0.5, 'bandpass', null, 0.15).frequency.exponentialRampToValueAtTime(2400, t + 0.35); break;
      case 'crash': N(t, 0.5, 0.35 * v, 500, 0.5, 'lowpass'); T(90, t, 0.4, 'sawtooth', 0.1 * v, null, 40); break;
      case 'shark': T(110, t, 0.5, 'sawtooth', 0.08 * v, null, 70); T(117, t + 0.25, 0.5, 'sawtooth', 0.08 * v, null, 74); break;
    }
  };

  /* ---- Ambiente: Vögel, Grillen, Wasser ---- */
  var amb = { water: null, waterGain: null, nextBird: 0, nextCricket: 0 };
  G.ambient = function (opts, dt) {
    if (!A.ctx || !G.data.settings.sfx) return;
    var c = A.ctx, t = c.currentTime;
    if (!amb.water) {
      var s = c.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
      var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.6;
      amb.waterGain = c.createGain(); amb.waterGain.gain.value = 0;
      s.connect(f); f.connect(amb.waterGain); amb.waterGain.connect(A.amb); s.start();
      amb.water = s;
    }
    amb.waterGain.gain.setTargetAtTime(opts.water || 0, t, 0.3);
    if (opts.birds && t > amb.nextBird) {
      amb.nextBird = t + 2.5 + Math.random() * 6;
      var base = 2400 + Math.random() * 1600, n = 2 + (Math.random() * 4) | 0;
      for (var i = 0; i < n; i++) A.tone(base * (0.9 + Math.random() * 0.25), t + i * 0.09, 0.07, 'sine', 0.025 * opts.birds, A.amb, base * 1.3);
    }
    if (opts.crickets && t > amb.nextCricket) {
      amb.nextCricket = t + 0.6 + Math.random() * 1.6;
      for (var k = 0; k < 4; k++) A.tone(4600 + Math.random() * 200, t + k * 0.045, 0.03, 'sine', 0.012 * opts.crickets, A.amb);
    }
  };

  /* ---- Generative Musik: kleiner Sequenzer mit Szenen-Stimmungen ---- */
  var M = { track: null, step: 0, nextT: 0, timer: null };
  var NOTE = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
  var TRACKS = {
    hub: { bpm: 92, root: 60, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], lead: 'triangle', bassType: 'sine', density: 0.55, drums: 0 },
    night: { bpm: 70, root: 57, scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [7, 10, 14]], lead: 'sine', bassType: 'sine', density: 0.35, drums: 0, bell: true },
    house: { bpm: 78, root: 65, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]], lead: 'sine', bassType: 'triangle', density: 0.45, drums: 0, bell: true },
    maze: { bpm: 64, root: 50, scale: [0, 1, 5, 7, 8], chords: [[0, 7, 12], [1, 8, 13], [0, 7, 12], [-2, 5, 10]], lead: 'sine', bassType: 'sawtooth', density: 0.22, drums: 0, bell: true, dark: true },
    runner: { bpm: 124, root: 62, scale: [0, 2, 3, 7, 8], chords: [[0, 7, 12], [3, 7, 10], [-4, 3, 8], [-5, 2, 7]], lead: 'triangle', bassType: 'triangle', density: 0.7, drums: 1, koto: true },
    fish: { bpm: 88, root: 67, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [2, 5, 9], [-5, -1, 2], [0, 4, 7]], lead: 'sine', bassType: 'sine', density: 0.4, drums: 0, bell: true },
    race: { bpm: 140, root: 64, scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]], lead: 'square', bassType: 'sawtooth', density: 0.75, drums: 2 }
  };
  function schedule() {
    if (!A.ctx || !M.track) return;
    var tr = TRACKS[M.track], c = A.ctx, spb = 60 / tr.bpm / 2;
    while (M.nextT < c.currentTime + 0.15) {
      var t = M.nextT, s = M.step, bar = Math.floor(s / 8) % tr.chords.length, ch = tr.chords[bar], beat = s % 8;
      if (beat === 0) {
        A.tone(NOTE(tr.root - 24 + ch[0]), t, spb * 7, tr.bassType, tr.dark ? 0.09 : 0.14, A.music, null, 0.02);
        ch.forEach(function (iv) { A.tone(NOTE(tr.root - 12 + iv), t, spb * 8, 'sine', 0.035, A.music, null, 0.25); });
      } else if (beat === 4 && !tr.dark) A.tone(NOTE(tr.root - 24 + ch[0] + 7), t, spb * 3, tr.bassType, 0.09, A.music);
      if (Math.random() < tr.density && (beat % 2 === 0 || Math.random() < 0.4)) {
        var deg = tr.scale[(Math.random() * tr.scale.length) | 0] + (Math.random() < 0.3 ? 12 : 0);
        var f = NOTE(tr.root + deg);
        if (tr.koto) { A.tone(f, t, spb * 2.2, 'triangle', 0.07, A.music); A.tone(f * 2, t, spb * 0.8, 'sine', 0.025, A.music); }
        else if (tr.bell) { A.tone(f * 2, t, spb * 4, 'sine', 0.05, A.music); A.tone(f * 4.01, t, spb * 1.5, 'sine', 0.012, A.music); }
        else A.tone(f, t, spb * 1.6, tr.lead, tr.lead === 'square' ? 0.03 : 0.065, A.music);
      }
      if (tr.drums) {
        if (beat % 4 === 0) A.tone(150, t, 0.16, 'sine', 0.22, A.music, 45);
        if (tr.drums > 1 && beat % 2 === 1) A.noise(t, 0.04, 0.05, 8000, 0.7, 'highpass', A.music);
        if (beat === 4 || (tr.drums > 1 && beat === 6 && Math.random() < .3)) A.noise(t, 0.12, tr.koto ? 0.08 : 0.1, tr.koto ? 260 : 1500, 0.8, tr.koto ? 'lowpass' : 'bandpass', A.music);
      }
      M.nextT += spb; M.step++;
    }
  }
  G.music = function (name) {
    if (M.track === name) return;
    M.track = name; M.step = 0;
    if (A.ctx) M.nextT = A.ctx.currentTime + 0.1;
    if (!M.timer) M.timer = setInterval(function () { if (A.ctx && M.track) { if (M.nextT < A.ctx.currentTime) M.nextT = A.ctx.currentTime + 0.05; schedule(); } }, 40);
  };

  /* ================= Eingabe ================= */
  var keys = G.keys = {};
  G.input = { x: 0, y: 0, mag: 0 };
  window.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!keys[k]) { keys[k] = true; G.onKeyAction(k, true); }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; G.onKeyAction(k, false); });
  window.addEventListener('blur', function () { for (var k in keys) keys[k] = false; });

  var joy = { id: null, ox: 0, oy: 0, x: 0, y: 0, rest: { x: 90, y: 300 } };
  var joyEl = $('joystick'), knob = $('joy-knob'), zone = $('joyzone');
  G.placeJoystickRest = function () {
    var cs = getComputedStyle(document.documentElement);
    var sl = parseFloat(cs.getPropertyValue('--safe-l')) || 0, sb = parseFloat(cs.getPropertyValue('--safe-b')) || 0;
    joy.rest = { x: 82 + sl, y: (G.H || innerHeight) - 82 - sb };
    if (joy.id === null) { joyEl.style.transform = 'translate(' + joy.rest.x + 'px,' + joy.rest.y + 'px)'; }
  };
  function joyUpdate(e) {
    var dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, max = 50, d = Math.hypot(dx, dy);
    if (d > max) { /* Basis zieht mit, wenn der Daumen weiter wandert */
      joy.ox += dx / d * (d - max); joy.oy += dy / d * (d - max);
      dx = e.clientX - joy.ox; dy = e.clientY - joy.oy; d = max;
      joyEl.style.transform = 'translate(' + joy.ox + 'px,' + joy.oy + 'px)';
    }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    var m = d / max;
    if (m < 0.14) { joy.x = 0; joy.y = 0; return; }
    var mm = G.clamp((m - 0.14) / 0.86, 0, 1);
    joy.x = dx / d * (0.25 + 0.75 * mm); joy.y = dy / d * (0.25 + 0.75 * mm);
  }
  zone.addEventListener('pointerdown', function (e) {
    if (joy.id !== null || !G.joyEnabled) return;
    e.preventDefault();
    joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY;
    try { zone.setPointerCapture(e.pointerId); } catch (er) {}
    joyEl.classList.add('active');
    joyEl.style.transform = 'translate(' + joy.ox + 'px,' + joy.oy + 'px)';
    joyUpdate(e);
  });
  zone.addEventListener('pointermove', function (e) { if (e.pointerId === joy.id) joyUpdate(e); });
  function joyEnd(e) {
    if (e.pointerId !== joy.id) return;
    joy.id = null; joy.x = 0; joy.y = 0;
    knob.style.transform = '';
    joyEl.classList.remove('active');
    joyEl.style.transform = 'translate(' + joy.rest.x + 'px,' + joy.rest.y + 'px)';
  }
  zone.addEventListener('pointerup', joyEnd); zone.addEventListener('pointercancel', joyEnd); zone.addEventListener('lostpointercapture', joyEnd);
  G.setJoystick = function (on) {
    G.joyEnabled = on; zone.hidden = !on; joyEl.hidden = !on;
    if (!on) { joy.id = null; joy.x = 0; joy.y = 0; knob.style.transform = ''; }
  };
  G.readMove = function () {
    var kx = 0, ky = 0;
    if (keys.ArrowLeft || keys.a) kx -= 1; if (keys.ArrowRight || keys.d) kx += 1;
    if (keys.ArrowUp || keys.w) ky -= 1; if (keys.ArrowDown || keys.s) ky += 1;
    var inp = G.input;
    if (kx || ky) { var l = Math.hypot(kx, ky); inp.x = kx / l; inp.y = ky / l; inp.mag = 1; }
    else { inp.x = joy.x; inp.y = joy.y; inp.mag = Math.min(1, Math.hypot(joy.x, joy.y)); }
    return inp;
  };

  /* ---- Aktionsknöpfe (dynamisch je Szene) ---- */
  var actionsEl = $('actions'), actions = {};
  G.held = {};
  G.setActions = function (list) {
    actionsEl.innerHTML = ''; actions = {}; G.held = {};
    (list || []).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'act ' + (a.size || 'sm') + ' ' + (a.style || (a.size === 'lg' ? 'primary' : 'secondary'));
      b.innerHTML = '<span class="ic">' + a.icon + '</span>' + (a.label ? '<span class="lb">' + a.label + '</span>' : '');
      if (a.size === 'lg') b.style.gridRow = '1 / span 2';
      var down = function (e) {
        e.preventDefault(); if (b.disabled || G.transition) return;
        try { b.setPointerCapture(e.pointerId); } catch (er) {}
        b.classList.add('pressed'); G.held[a.id] = true; G.buzz(8);
        if (a.onDown) a.onDown();
      };
      var up = function () { if (!G.held[a.id]) return; b.classList.remove('pressed'); G.held[a.id] = false; if (a.onUp) a.onUp(); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
      actionsEl.appendChild(b);
      actions[a.id] = { el: b, def: a };
    });
  };
  G.updateAction = function (id, o) {
    var a = actions[id]; if (!a) return;
    if (o.icon !== undefined && o.icon !== a._icon) { a._icon = o.icon; a.el.querySelector('.ic').textContent = o.icon; }
    if (o.label !== undefined && o.label !== a._label) { a._label = o.label; var l = a.el.querySelector('.lb'); if (l) l.textContent = o.label; }
    if (o.disabled !== undefined) a.el.disabled = o.disabled;
    if (o.pulse !== undefined) a.el.classList.toggle('pulse', o.pulse);
    if (o.hidden !== undefined) a.el.hidden = o.hidden;
  };
  G.onKeyAction = function (k, isDown) {
    if (G.modalOpen || G.transition) return;
    if (isDown && (k === 'Escape') && G.scene && G.scene.onEscape) { G.scene.onEscape(); return; }
    for (var id in actions) {
      var d = actions[id].def;
      if (d.keys && d.keys.indexOf(k) >= 0 && !actions[id].el.disabled && !actions[id].el.hidden) {
        if (isDown) { G.held[id] = true; actions[id].el.classList.add('pressed'); if (d.onDown) d.onDown(); }
        else { G.held[id] = false; actions[id].el.classList.remove('pressed'); if (d.onUp) d.onUp(); }
      }
    }
  };

  /* ================= HUD, Toast, Banner, Modal ================= */
  G.hud = function (o) {
    o = o || {};
    $('stats-mini').hidden = !o.stats;
    $('objective').hidden = !o.objective; if (o.objective) $('objective').innerHTML = o.objective;
    $('btn-exit').hidden = !o.exit;
    $('btn-quests').hidden = !o.quests;
    $('hud-extra').hidden = !o.extra; if (o.extra) $('hud-extra').innerHTML = o.extra;
    $('bones').textContent = G.data.bones;
  };
  G.setObjective = function (html) { var el = $('objective'); if (el._h !== html) { el._h = html; el.innerHTML = html; } };
  G.setExtra = function (html) { var el = $('hud-extra'); if (el._h !== html) { el._h = html; el.innerHTML = html; } };
  var toastT = null;
  G.toast = function (msg, ms) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2000);
  };
  G.banner = function (text) {
    var b = $('banner-text'); b.textContent = text; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  };
  var modal = $('modal'), card = $('modal-card');
  G.modalOpen = false;
  G.openModal = function (html, opts) {
    opts = opts || {};
    card.innerHTML = html; modal.classList.add('show'); G.modalOpen = true;
    modal._dismiss = opts.dismissable !== false ? (opts.onClose || true) : null;
    if (opts.bind) opts.bind(card);
  };
  G.closeModal = function () {
    modal.classList.remove('show'); G.modalOpen = false;
    var cb = modal._dismiss; modal._dismiss = null;
    if (typeof cb === 'function') cb();
  };
  modal.addEventListener('pointerdown', function (e) { if (e.target === modal && modal._dismiss) G.closeModal(); });

  G.showResult = function (o) {
    var stars = '';
    for (var i = 0; i < 3; i++) stars += '<span class="' + (i < o.stars ? '' : 'off') + '">⭐</span>';
    var html = '<h2>' + o.title + '</h2><p class="sub">' + (o.sub || '') + '</p>' +
      '<div class="stars">' + stars + '</div>' +
      '<div class="result-grid">' + (o.cells || []).map(function (c) { return '<div><small>' + c[0] + '</small><b>' + c[1] + '</b></div>'; }).join('') + '</div>' +
      '<div class="row"><button class="btn ghost" data-r="back">Zurück</button><button class="btn gold" data-r="again">Nochmal ↻</button></div>';
    G.openModal(html, {
      dismissable: false,
      bind: function (c) {
        c.querySelector('[data-r=back]').onclick = function () { G.sfx('click'); G.closeModal(); o.onBack(); };
        c.querySelector('[data-r=again]').onclick = function () { G.sfx('click'); G.closeModal(); o.onAgain(); };
      }
    });
  };

  /* ================= Partikel ================= */
  G.Particles = function () { this.list = []; };
  G.Particles.prototype.emit = function (o, n) {
    n = Math.max(1, Math.round((n || 1) * (o.always ? 1 : G.fx)));
    for (var i = 0; i < n; i++) {
      var sp = o.speed !== undefined ? o.speed * (0.5 + Math.random()) : 0;
      var ang = o.angle !== undefined ? o.angle + (Math.random() - .5) * (o.spread || 0) : Math.random() * Math.PI * 2;
      this.list.push({
        x: o.x + (o.jitter ? (Math.random() - .5) * o.jitter : 0), y: o.y + (o.jitter ? (Math.random() - .5) * o.jitter * (o.jy || 1) : 0),
        z: o.z || 0, vz: o.vz !== undefined ? o.vz * (0.7 + Math.random() * 0.6) : 0,
        vx: (o.vx || 0) + Math.cos(ang) * sp, vy: (o.vy || 0) + Math.sin(ang) * sp,
        life: o.life * (0.7 + Math.random() * 0.6), age: 0,
        size: o.size * (0.7 + Math.random() * 0.6), grow: o.grow || 0,
        color: Array.isArray(o.color) ? G.pick(o.color) : o.color, type: o.type || 'circle', text: o.text,
        g: o.gravity || 0, drag: o.drag || 0, rot: Math.random() * 6.28, vr: (o.vr || 0) * (Math.random() - .5),
        fade: o.fade !== false, add: !!o.add, shadow: !!o.shadow
      });
    }
  };
  G.Particles.prototype.update = function (dt) {
    var l = this.list;
    for (var i = l.length - 1; i >= 0; i--) {
      var p = l[i];
      p.age += dt;
      if (p.age >= p.life) { l[i] = l[l.length - 1]; l.pop(); continue; }
      p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.vz || p.z) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= .6; p.vy *= .6; } }
      else p.vy += p.g * dt;
      p.rot += p.vr * dt; p.size += p.grow * dt;
    }
  };
  G.Particles.prototype.draw = function (ctx, filter) {
    var l = this.list;
    for (var i = 0; i < l.length; i++) {
      var p = l[i];
      if (filter && !filter(p)) continue;
      var k = p.age / p.life, a = p.fade ? (k < .15 ? k / .15 : 1 - (k - .15) / .85) : 1;
      if (a <= 0 || p.size <= 0) continue;
      ctx.globalAlpha = a;
      if (p.add) ctx.globalCompositeOperation = 'lighter';
      if (p.shadow && p.z > 0) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * .8, p.size * .35, 0, 0, 6.283); ctx.fill(); }
      var y = p.y - p.z;
      if (p.type === 'circle') { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, y, p.size, 0, 6.283); ctx.fill(); }
      else if (p.type === 'glow') {
        var gr = ctx.createRadialGradient(p.x, y, 0, p.x, y, p.size);
        gr.addColorStop(0, p.color); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, y, p.size, 0, 6.283); ctx.fill();
      }
      else if (p.type === 'ring') { ctx.strokeStyle = p.color; ctx.lineWidth = 2 * (1 - k) + .5; ctx.beginPath(); ctx.ellipse(p.x, y, p.size, p.size * .45, 0, 0, 6.283); ctx.stroke(); }
      else if (p.type === 'leaf' || p.type === 'petal') {
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.rot * 2) * .6 + .4);
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * .55, 0, 0, 6.283); ctx.fill(); ctx.restore();
      }
      else if (p.type === 'spark') {
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size * .5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x - p.vx * .05, y - p.vy * .05); ctx.stroke();
      }
      else if (p.type === 'text') {
        ctx.font = '700 ' + Math.round(p.size) + 'px ' + G.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.text, p.x, y);
      }
      else if (p.type === 'star') {
        ctx.save(); ctx.translate(p.x, y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath();
        for (var s = 0; s < 10; s++) { var r = s % 2 ? p.size * .45 : p.size, an = s * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        ctx.fill(); ctx.restore();
      }
      if (p.add) ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  };
  G.FONT = 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", Nunito, system-ui, sans-serif';

  /* ================= Kamera ================= */
  G.Camera = function () { this.x = 0; this.y = 0; this.zoom = 1; this.shakeT = 0; this.shakeA = 0; this.sx = 0; this.sy = 0; };
  G.Camera.prototype.baseZoom = function (ref) { return G.clamp(G.H / (ref || 460), 0.8, 1.7); };
  G.Camera.prototype.follow = function (tx, ty, dt, bw, bh, lambda) {
    this.x = G.damp(this.x, tx, lambda || 6, dt); this.y = G.damp(this.y, ty, lambda || 6, dt);
    this.clamp(bw, bh);
  };
  G.Camera.prototype.clamp = function (bw, bh) {
    var hw = G.W / 2 / this.zoom, hh = G.H / 2 / this.zoom;
    if (bw) this.x = bw <= hw * 2 ? bw / 2 : G.clamp(this.x, hw, bw - hw);
    if (bh) this.y = bh <= hh * 2 ? bh / 2 : G.clamp(this.y, hh, bh - hh);
  };
  G.Camera.prototype.shake = function (a, t) { this.shakeA = Math.max(this.shakeA, a); this.shakeT = Math.max(this.shakeT, t || .3); };
  G.Camera.prototype.update = function (dt) {
    if (this.shakeT > 0) { this.shakeT -= dt; var a = this.shakeA * Math.max(0, this.shakeT / .3); this.sx = (Math.random() - .5) * a; this.sy = (Math.random() - .5) * a; if (this.shakeT <= 0) this.shakeA = 0; }
    else { this.sx = 0; this.sy = 0; }
  };
  G.Camera.prototype.apply = function (ctx) {
    var z = this.zoom * G.dpr;
    ctx.setTransform(z, 0, 0, z, (G.W / 2 - (this.x + this.sx) * this.zoom) * G.dpr, (G.H / 2 - (this.y + this.sy) * this.zoom) * G.dpr);
  };
  G.Camera.prototype.view = function (pad) {
    pad = pad || 0;
    var hw = G.W / 2 / this.zoom, hh = G.H / 2 / this.zoom;
    return { l: this.x - hw - pad, t: this.y - hh - pad, r: this.x + hw + pad, b: this.y + hh + pad };
  };
  G.Camera.prototype.toScreen = function (x, y) { return { x: (x - this.x) * this.zoom + G.W / 2, y: (y - this.y) * this.zoom + G.H / 2 }; };
  G.screen = function (ctx) { ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); };

  /* ================= Tageszeit (echte Uhrzeit) ================= */
  G.dayInfo = function () {
    var forced = /[?&]zeit=(nacht|abend|tag)/.exec(location.search);
    var d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    if (forced) h = { nacht: 23, abend: 19.4, tag: 12 }[forced[1]];
    var night = h < 5 ? 1 : h < 7.5 ? 1 - (h - 5) / 2.5 : h < 18.5 ? 0 : h < 21 ? (h - 18.5) / 2.5 : 1;
    var dusk = Math.max(0, 1 - Math.abs(h - 19.2) / 1.8) + Math.max(0, 1 - Math.abs(h - 6.6) / 1.4) * .7;
    return { h: h, night: G.clamp(night, 0, 1), dusk: G.clamp(dusk, 0, 1) };
  };

  /* ================= Tagesaufgaben ================= */
  var QPOOL = [
    { id: 'pet', e: '❤️', t: 'Streichle {n} 5×', goal: 5, r: 3 },
    { id: 'fetch', e: '🥢', t: 'Spiele 3× Stöckchen', goal: 3, r: 3 },
    { id: 'feed', e: '🍖', t: 'Füttere {n}', goal: 1, r: 2 },
    { id: 'brush', e: '🪮', t: 'Bürste {n} 3×', goal: 3, r: 2 },
    { id: 'clean', e: '💩', t: 'Räume einen Haufen weg', goal: 1, r: 3 },
    { id: 'dig', e: '🦴', t: 'Lass {n} einen Knochen ausbuddeln', goal: 1, r: 3 },
    { id: 'maze', e: '🔦', t: 'Schaffe die Höhle', goal: 1, r: 4 },
    { id: 'runner', e: '⛩️', t: 'Schaffe den Tempellauf', goal: 1, r: 4 },
    { id: 'fish', e: '🎣', t: 'Gewinne beim Angeln', goal: 1, r: 4 },
    { id: 'race', e: '🚗', t: 'Komme mit dem Auto ins Ziel', goal: 1, r: 4 },
    { id: 'walk', e: '🐾', t: 'Laufe 400 Schritte', goal: 400, r: 3 },
    { id: 'butterfly', e: '🦋', t: 'Lass {n} Schmetterlinge jagen', goal: 2, r: 2 },
    { id: 'ball', e: '🎾', t: 'Wirf im Haus 3× den Ball', goal: 3, r: 2 },
    { id: 'sleep', e: '💤', t: 'Bring {n} ins Körbchen', goal: 1, r: 2 },
    { id: 'mud', e: '🟤', t: 'Bade {n} nach dem Schlamm sauber', goal: 1, r: 3 }
  ];
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  G.ensureQuests = function () {
    var k = todayKey();
    if (G.data.quests && G.data.quests.date === k) return;
    var r = G.rng(k.split('-').reduce(function (a, b) { return a * 31 + (+b); }, 7)), pool = QPOOL.slice(), list = [];
    while (list.length < 3) { var q = pool.splice((r() * pool.length) | 0, 1)[0]; list.push({ id: q.id, p: 0, done: false, claimed: false }); }
    G.data.quests = { date: k, list: list, bonus: false };
    G.persist();
  };
  function qdef(id) { for (var i = 0; i < QPOOL.length; i++) if (QPOOL[i].id === id) return QPOOL[i]; }
  G.quest = function (id, n) {
    G.ensureQuests();
    G.data.quests.list.forEach(function (q) {
      if (q.id !== id || q.done) return;
      var d = qdef(id); q.p = Math.min(d.goal, q.p + (n || 1));
      if (q.p >= d.goal) {
        q.done = true; G.sfx('key');
        setTimeout(function () { G.toast('📜 Aufgabe erledigt: ' + d.t.replace('{n}', G.data.name) + ' – Belohnung abholen!', 2600); }, 300);
        $('btn-quests').classList.add('pulse-q');
      }
      G.persist();
    });
  };
  G.openQuests = function () {
    G.ensureQuests();
    var Q = G.data.quests;
    var render = function () {
      var all = Q.list.every(function (q) { return q.claimed; });
      return '<h2>📜 Tagesaufgaben</h2><p class="sub">Jeden Tag neu. Belohnung: Knochen 🦴 für die Garderobe.</p><div class="list">' +
        Q.list.map(function (q, i) {
          var d = qdef(q.id), pct = Math.round(q.p / d.goal * 100);
          return '<div class="q ' + (q.done ? 'done' : '') + '"><div class="e">' + d.e + '</div><div><b>' + G.esc(d.t.replace('{n}', G.data.name)) + '</b><small>' + q.p + ' / ' + d.goal + '</small><div class="bar"><b style="width:' + pct + '%"></b></div></div>' +
            '<button class="tiny-btn" data-i="' + i + '" ' + (q.done && !q.claimed ? '' : 'disabled') + '>' + (q.claimed ? '✓' : '+' + d.r + ' 🦴') + '</button></div>';
        }).join('') + '</div>' +
        '<div class="q ' + (Q.bonus ? 'done' : '') + '" style="margin-top:8px"><div class="e">🎁</div><div><b>Tagesbonus</b><small>Alle drei Aufgaben abholen</small></div><button class="tiny-btn" data-bonus ' + (all && !Q.bonus ? '' : 'disabled') + '>' + (Q.bonus ? '✓' : '+5 🦴') + '</button></div>' +
        '<div class="row"><button class="btn gold" data-close>Weiter</button></div>';
    };
    var bind = function (c) {
      c.querySelectorAll('[data-i]').forEach(function (b) {
        b.onclick = function () {
          var q = Q.list[+b.dataset.i]; if (!q.done || q.claimed) return;
          q.claimed = true; G.addBones(qdef(q.id).r); G.sfx('buy'); G.buzz(20);
          c.innerHTML = render(); bind(c); G.persist();
        };
      });
      var bb = c.querySelector('[data-bonus]');
      if (bb) bb.onclick = function () { if (Q.bonus) return; Q.bonus = true; G.addBones(5); G.sfx('win'); c.innerHTML = render(); bind(c); G.persist(); };
      c.querySelector('[data-close]').onclick = function () { G.sfx('click'); G.closeModal(); };
      $('btn-quests').classList.toggle('pulse-q', Q.list.some(function (q) { return q.done && !q.claimed; }));
    };
    G.openModal(render(), { bind: bind });
  };

  /* ================= Garderobe ================= */
  G.COSMETICS = [
    { id: 'collar-red', slot: 'collar', name: 'Rotes Halsband', price: 0 },
    { id: 'collar-blue', slot: 'collar', name: 'Blaues Halsband', price: 4 },
    { id: 'collar-gold', slot: 'collar', name: 'Goldhalsband', price: 14 },
    { id: 'bandana', slot: 'collar', name: 'Bandana', price: 8 },
    { id: 'hat-party', slot: 'hat', name: 'Partyhut', price: 6 },
    { id: 'hat-flower', slot: 'hat', name: 'Blumenkranz', price: 8 },
    { id: 'hat-cap', slot: 'hat', name: 'Basecap', price: 10 },
    { id: 'glasses', slot: 'face', name: 'Sonnenbrille', price: 15 },
    { id: 'hat-crown', slot: 'hat', name: 'Krone', price: 30 }
  ];

  /* ================= Szenen & Übergänge ================= */
  G.scenes = {};
  G.scene = null;
  G.transition = null;
  G.go = function (name, params, opt) {
    opt = opt || {};
    if (G.transition) return;
    var target = G.scenes[name];
    if (!G.scene || opt.instant) {
      if (G.scene && G.scene.exit) G.scene.exit();
      G.scene = target; target.enter(params || {});
      return;
    }
    G.sfx('whoosh', .6);
    G.transition = { phase: 'out', t: 0, dur: opt.dur || .5, cx: opt.cx, cy: opt.cy, name: name, params: params || {} };
  };
  function drawTransition(ctx) {
    var tr = G.transition; if (!tr) return;
    var k = G.clamp(tr.t / tr.dur, 0, 1);
    var cover = tr.phase === 'out' ? G.easeInOut(k) : 1 - G.easeInOut(k);
    var cx = tr.cx !== undefined ? tr.cx : G.W / 2, cy = tr.cy !== undefined ? tr.cy : G.H / 2;
    var maxR = Math.hypot(Math.max(cx, G.W - cx), Math.max(cy, G.H - cy)) + 20;
    var r = maxR * (1 - cover);
    G.screen(ctx);
    ctx.fillStyle = '#0b130e';
    ctx.beginPath(); ctx.rect(0, 0, G.W, G.H);
    if (r > 0.5) ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    if (cover > .92) { /* Pfote in der Mitte, während das Bild schwarz ist */
      ctx.globalAlpha = (cover - .92) / .08; ctx.fillStyle = '#ffd166';
      var px = G.W / 2, py = G.H / 2;
      ctx.beginPath(); ctx.ellipse(px, py + 8, 15, 12, 0, 0, 6.283); ctx.fill();
      [[-15, -8], [-5, -17], [7, -17], [17, -8]].forEach(function (o) { ctx.beginPath(); ctx.ellipse(px + o[0], py + o[1], 5.5, 7, o[0] * .03, 0, 6.283); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
  }
  function stepTransition(dt) {
    var tr = G.transition; if (!tr) return;
    tr.t += dt;
    if (tr.phase === 'out' && tr.t >= tr.dur) {
      if (G.scene && G.scene.exit) G.scene.exit();
      G.scene = G.scenes[tr.name];
      G.scene.enter(tr.params);
      tr.phase = 'in'; tr.t = 0; tr.cx = undefined; tr.cy = undefined;
      if (G.scene.update) G.scene.update(0);
    } else if (tr.phase === 'in' && tr.t >= tr.dur) G.transition = null;
  }

  /* ================= Hauptschleife ================= */
  var last = performance.now(), statTick = 0;
  G.time = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dtMs = now - last; last = now;
    if (document.hidden) return;
    var dt = Math.min(0.05, dtMs / 1000);
    G.time += dt;
    watchPerf(dtMs);
    statTick += dt;
    if (statTick > 2) { statTick = 0; G.decay(); G.refreshStats(); }
    stepTransition(dt);
    var sc = G.scene;
    if (sc) {
      if (!G.modalOpen && !(G.transition && G.transition.phase === 'out')) sc.update(dt);
      else if (sc.idle) sc.idle(dt);
      sc.draw(ctx, dt);
    }
    drawTransition(ctx);
  }
  G.start = function () { resize(); requestAnimationFrame(frame); };

  /* ================= Bestell-Sammelbalken (von der Bestellliste) ================= */
  (function () {
    var bar = $('wait-bar-thin'), fill = $('wait-bar-thin-fill');
    function tick() {
      var q; try { q = JSON.parse(localStorage.getItem('mw-wait-order')); } catch (e) { q = null; }
      if (!q || !q.length) { bar.classList.remove('show'); return; }
      bar.classList.add('show');
      var s = q[0].start, e = q[q.length - 1].end, n = Date.now();
      fill.style.width = G.clamp((n - s) / (e - s) * 100, 0, 100) + '%';
      fill.classList.toggle('gold', n >= e);
    }
    tick(); setInterval(tick, 1000);
  })();
})();
