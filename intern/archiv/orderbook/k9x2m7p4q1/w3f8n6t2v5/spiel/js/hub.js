/* Pets — Außenwelt (Gassi gehen) */
(function () {
  'use strict';
  var G = window.G, A = G.art, TAU = Math.PI * 2;
  var WW = 2400, WH = 1500;

  /* ================= Welt-Layout ================= */
  var HOUSE = { x: 420, y: 600, col: { x: 296, y: 470, w: 248, h: 128 } };
  var PAV = { x: 1960, y: 320, col: { x: 1858, y: 230, w: 204, h: 92 } };
  var TORII = { x: 1960, y: 470 };
  var CAVE = { x: 2080, y: 1420, col: { x: 1975, y: 1300, w: 210, h: 120 } };
  var GATE = { x: 600, y: 1474 };
  var POND = { x: 1330, y: 820, rx: 215, ry: 140 };
  var DOCK = { x: 1080, y: 802, w: 150, h: 34 };
  var CREEK = [{ x: 1520, y: -30 }, { x: 1490, y: 110 }, { x: 1545, y: 230 }, { x: 1470, y: 360 }, { x: 1405, y: 500 }, { x: 1370, y: 690 }];
  var CREEK_W = 19;
  var BRIDGE = { x: 1438, y: 430, w: 104, h: 44 };
  var PATH = [{ x: 420, y: 612 }, { x: 432, y: 760 }, { x: 540, y: 880 }, { x: 590, y: 1040 }, { x: 560, y: 1220 }, { x: 600, y: 1440 }];
  var PATH2 = [{ x: 590, y: 1040 }, { x: 820, y: 1000 }, { x: 1000, y: 880 }, { x: 1080, y: 818 }];
  var PATH3 = [{ x: 432, y: 760 }, { x: 760, y: 640 }, { x: 1120, y: 560 }, { x: 1400, y: 470 }, { x: 1500, y: 440 }, { x: 1760, y: 470 }, { x: 1960, y: 480 }];
  var PATH4 = [{ x: 1000, y: 880 }, { x: 1300, y: 1060 }, { x: 1700, y: 1180 }, { x: 2000, y: 1330 }, { x: 2080, y: 1400 }];
  var MUD = [{ x: 820, y: 470, r: 44 }, { x: 960, y: 1180, r: 40 }, { x: 1720, y: 980, r: 50 }, { x: 260, y: 1070, r: 42 }, { x: 1720, y: 640, r: 36 }];

  var ZONES = [
    { id: 'house', x: 420, y: 630, r: 44, label: '🏠 Nach Hause', icon: '🏠', ret: { x: 420, y: 690 } },
    { id: 'runner', x: 1960, y: 492, r: 48, label: '⛩️ Tempellauf', icon: '⛩️', ret: { x: 1960, y: 560 } },
    { id: 'maze', x: 2080, y: 1440, r: 52, label: '🔦 Höhle', icon: '🔦', ret: { x: 2060, y: 1330 } },
    { id: 'fish', x: 1200, y: 818, r: 40, label: '🎣 Angeln', icon: '🎣', ret: { x: 1050, y: 860 } },
    { id: 'race', x: 600, y: 1440, r: 56, label: '🚗 Zur Straße', icon: '🚗', ret: { x: 600, y: 1350 } }
  ];

  /* ---- deterministische Deko ---- */
  var R = G.rng(20251102);
  var pondPts = [];
  for (var i = 0; i < 18; i++) {
    var a = i / 18 * TAU, wob = 1 + Math.sin(a * 3 + 1.3) * .08 + Math.sin(a * 5 + .4) * .05;
    pondPts.push({ x: POND.x + Math.cos(a) * POND.rx * wob, y: POND.y + Math.sin(a) * POND.ry * wob });
  }
  function pondR(x, y) { /* normierter Abstand zum Teichmittelpunkt (1 = Ufer) */
    var dx = (x - POND.x) / POND.rx, dy = (y - POND.y) / POND.ry, a = Math.atan2(dy, dx);
    var wob = 1 + Math.sin(a * 3 + 1.3) * .08 + Math.sin(a * 5 + .4) * .05;
    return Math.hypot(dx, dy) / wob;
  }
  function inPond(x, y, pad) { return pondR(x, y) < 1 - (pad || 0) / POND.ry; }
  function onDock(x, y) { return x > DOCK.x - 6 && x < DOCK.x + DOCK.w + 4 && y > DOCK.y - 10 && y < DOCK.y + DOCK.h + 6; }
  function inCreek(x, y, pad) {
    if (Math.abs(x - BRIDGE.x) < BRIDGE.w / 2 && Math.abs(y - BRIDGE.y) < BRIDGE.h / 2 + 4) return false;
    for (var i = 0; i < CREEK.length - 1; i++) if (G.distToSeg(x, y, CREEK[i].x, CREEK[i].y, CREEK[i + 1].x, CREEK[i + 1].y) < CREEK_W + (pad || 0)) return true;
    return false;
  }
  function nearPath(x, y, w) {
    var paths = [PATH, PATH2, PATH3, PATH4];
    for (var p = 0; p < paths.length; p++) for (var i = 0; i < paths[p].length - 1; i++) if (G.distToSeg(x, y, paths[p][i].x, paths[p][i].y, paths[p][i + 1].x, paths[p][i + 1].y) < w) return true;
    return false;
  }
  function inRect(x, y, r, pad) { pad = pad || 0; return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad; }
  function inMud(x, y) { for (var i = 0; i < MUD.length; i++) if (G.dist(x, y, MUD[i].x, MUD[i].y) < MUD[i].r * .85) return MUD[i]; return null; }
  function blocked(x, y, pad) {
    if (inPond(x, y, -6) || inCreek(x, y, 6) || inRect(x, y, HOUSE.col, 6) || inRect(x, y, PAV.col, 6) || inRect(x, y, CAVE.col, 6)) return true;
    if (nearPath(x, y, 30)) return true;
    if (G.dist(x, y, TORII.x, TORII.y) < 80 || G.dist(x, y, GATE.x, GATE.y) < 70 || G.dist(x, y, DOCK.x, DOCK.y + 17) < 50) return true;
    return x < 70 || y < 70 || x > WW - 70 || y > WH - 60 || (pad && false);
  }

  /* Hindernisse (Kreise) */
  var props = [];   /* alles, was y-sortiert gezeichnet wird */
  var solids = [];  /* Kollisionskreise */
  function addProp(p) { props.push(p); if (p.r) solids.push(p); return p; }
  function placeRandom(n, minD, fn) {
    var tries = 0;
    while (n > 0 && tries++ < n * 60) {
      var x = 80 + R() * (WW - 160), y = 90 + R() * (WH - 170);
      if (blocked(x, y)) continue;
      var ok = true;
      for (var i = 0; i < props.length; i++) if (G.dist(x, y, props[i].x, props[i].y) < minD + (props[i].r || 0)) { ok = false; break; }
      if (!ok) continue;
      fn(x, y); n--;
    }
  }
  /* feste Szenerie */
  addProp({ kind: 'house', x: HOUSE.x, y: HOUSE.y });
  addProp({ kind: 'pavilion', x: PAV.x, y: PAV.y });
  addProp({ kind: 'torii', x: TORII.x, y: TORII.y });
  addProp({ kind: 'cave', x: CAVE.x, y: CAVE.y });
  addProp({ kind: 'gate', x: GATE.x, y: GATE.y });
  [[1876, 470], [2044, 470]].forEach(function (p) { addProp({ kind: 'slantern', x: p[0], y: p[1], r: 9, light: { r: 70, c: 'rgba(255,190,110,' } }); });
  [[1760, 300], [2160, 300], [1800, 560], [2150, 560], [2230, 420]].forEach(function (p, i) { addProp({ kind: 'sakura', x: p[0], y: p[1], r: 16, sway: i }); });
  [[520, 690, 0], [470, 900, 1], [640, 1150, 0], [520, 1330, 1], [1040, 600, 0], [1500, 520, 1], [1830, 500, 0], [1160, 940, 1], [1560, 1130, 0], [1900, 1280, 1]].forEach(function (p) { addProp({ kind: 'lamp', x: p[0] + (p[2] ? -36 : 36), y: p[1], r: 6, light: { r: 120, c: 'rgba(255,214,140,' } }); });
  addProp({ kind: 'bench', x: 1060, y: 1000, r: 14 });
  addProp({ kind: 'bench', x: 1250, y: 620, r: 14 });
  addProp({ kind: 'bench', x: 700, y: 760, r: 14 });
  addProp({ kind: 'sign', e: '🎣', l: 'TEICH', x: 1010, y: 776, r: 8 });
  addProp({ kind: 'sign', e: '🔦', l: 'HÖHLE', x: 1940, y: 1300, r: 8 });
  addProp({ kind: 'sign', e: '⛩️', l: 'TEMPEL', x: 1720, y: 440, r: 8 });
  addProp({ kind: 'sign', e: '🚗', l: 'STRASSE', x: 650, y: 1380, r: 8 });
  [[1990, 1230], [2190, 1250], [1950, 1380], [2220, 1380], [2120, 1210], [1890, 1440], [2280, 1300]].forEach(function (p, i) { addProp({ kind: 'rock', v: i % 4, x: p[0], y: p[1], r: 18 }); });
  [[120, 140, 'oak'], [210, 120, 'pine'], [140, 260, 'oak2'], [330, 150, 'pine'], [640, 140, 'oak'], [820, 210, 'oak2'], [980, 120, 'pine'], [1160, 190, 'oak'],
   [130, 760, 'oak2'], [150, 1300, 'pine'], [300, 1400, 'oak'], [880, 1380, 'oak2'], [1180, 1400, 'pine'], [1420, 1420, 'oak'], [2300, 860, 'pine'], [2250, 1000, 'oak2'],
   [1660, 120, 'pine'], [2280, 140, 'pine'], [2200, 200, 'oak'], [1780, 820, 'oak'], [760, 1240, 'oak'], [160, 520, 'pine']].forEach(function (p, i) {
    addProp({ kind: 'tree', t: p[2], x: p[0], y: p[1], r: p[2] === 'pine' ? 14 : 18, sway: i });
  });
  placeRandom(14, 70, function (x, y) { addProp({ kind: 'tree', t: G.pick(['oak', 'oak2', 'pine']), x: x, y: y, r: 16, sway: R() * 10 }); });
  placeRandom(22, 50, function (x, y) { addProp({ kind: 'bush', v: (R() * 3) | 0, x: x, y: y, r: 15 }); });
  placeRandom(10, 40, function (x, y) { addProp({ kind: 'rock', v: (R() * 4) | 0, x: x, y: y, r: 14 }); });
  placeRandom(14, 18, function (x, y) { addProp({ kind: 'mush', x: x, y: y }); });
  /* Blumen & Gras (nicht kollidierend) */
  var flowers = [], tufts = [];
  for (i = 0; i < 520; i++) {
    var fx = 60 + R() * (WW - 120), fy = 70 + R() * (WH - 130);
    var meadow = fx > 700 && fx < 1200 && fy > 1080 && fy < 1420;
    if ((R() < .55 && !meadow) || blocked(fx, fy)) continue;
    flowers.push({ x: fx, y: fy, v: (R() * 5) | 0, s: R() * 10 });
  }
  for (i = 0; i < 700; i++) {
    var gx = 50 + R() * (WW - 100), gy = 60 + R() * (WH - 110);
    if (blocked(gx, gy)) continue;
    tufts.push({ x: gx, y: gy, h: 7 + R() * 9, s: R() * 10, c: R() < .5 ? '#4f9a45' : '#68b55a' });
  }
  flowers.sort(function (a, b) { return a.y - b.y; });
  tufts.sort(function (a, b) { return a.y - b.y; });

  /* Schnüffelstellen (hier wird gebuddelt) */
  var sniffs = [];
  function spawnSniff() {
    for (var k = 0; k < 40; k++) {
      var x = 120 + Math.random() * (WW - 240), y = 120 + Math.random() * (WH - 240);
      if (blocked(x, y) || collides(x, y, 20)) continue;
      sniffs.push({ x: x, y: y, t: Math.random() * 5 }); return;
    }
  }
  function collides(x, y, r) {
    if (x - r < 40 || y - r < 46 || x + r > WW - 40 || y + r > WH - 40) return true;
    if (inRect(x, y, HOUSE.col, r * .6) || inRect(x, y, PAV.col, r * .6) || inRect(x, y, CAVE.col, r * .6)) return true;
    if (inPond(x, y, -r * .4) && !onDock(x, y)) return true;
    if (inCreek(x, y, r * .5)) return true;
    for (var i = 0; i < solids.length; i++) { var s = solids[i]; if (Math.abs(x - s.x) < 60 && Math.abs(y - s.y) < 60 && G.dist(x, y, s.x, s.y) < s.r + r * .7) return true; }
    return false;
  }

  /* ================= Boden einmalig vorzeichnen ================= */
  var ground = null, GS = 1;
  function drawPathStroke(c, pts, w) {
    c.beginPath(); G.smoothPath(c, pts, false);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#9f8a63'; c.lineWidth = w + 8; c.stroke();
    c.strokeStyle = '#cdb68c'; c.lineWidth = w; c.stroke();
    c.strokeStyle = 'rgba(255,245,215,.35)'; c.lineWidth = w * .45; c.stroke();
  }
  function buildGround() {
    GS = G.quality >= 3 ? 1.25 : G.quality >= 2 ? 1.05 : 0.85;
    ground = G.makeCanvas(WW * GS, WH * GS);
    var c = ground.getContext('2d'), r = G.rng(7);
    c.scale(GS, GS);
    c.fillStyle = A.lg(c, 0, 0, WW, WH, [0, '#7cc96c', .5, '#69b95c', 1, '#5aa94f']); c.fillRect(0, 0, WW, WH);
    for (var i = 0; i < 90; i++) {
      var x = r() * WW, y = r() * WH, rr = 80 + r() * 260, light = r() < .5;
      c.fillStyle = A.rg(c, x, y, 0, rr, [0, light ? 'rgba(200,240,150,.16)' : 'rgba(30,90,30,.14)', 1, 'rgba(0,0,0,0)']);
      c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    /* feine Grashalme */
    var cols = ['rgba(60,130,50,.5)', 'rgba(150,210,110,.45)', 'rgba(40,110,40,.4)', 'rgba(190,230,140,.35)'];
    c.lineWidth = 1.1; c.lineCap = 'round';
    for (var k = 0; k < 4; k++) {
      c.strokeStyle = cols[k]; c.beginPath();
      for (i = 0; i < 4200; i++) { var gx = r() * WW, gy = r() * WH, h = 3 + r() * 5; c.moveTo(gx, gy); c.lineTo(gx + (r() - .5) * 3, gy - h); }
      c.stroke();
    }
    /* Kleeblätter & Blütenpunkte */
    for (i = 0; i < 900; i++) { c.fillStyle = r() < .7 ? 'rgba(255,255,255,.55)' : 'rgba(255,220,80,.6)'; c.beginPath(); c.arc(r() * WW, r() * WH, .9 + r() * 1.2, 0, TAU); c.fill(); }
    /* Wiese unten mit Blumenmeer */
    for (i = 0; i < 700; i++) { c.fillStyle = G.pick(['#ff6b8b', '#ffd166', '#ffffff', '#b28dff', '#ff9f43']); c.globalAlpha = .7; c.beginPath(); c.arc(700 + r() * 500, 1080 + r() * 340, 1.3 + r() * 1.5, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    /* Kies-Platz vor dem Haus, Zen-Garten am Pavillon, Fels um die Höhle */
    c.fillStyle = 'rgba(205,182,140,.9)'; c.beginPath(); c.ellipse(420, 640, 70, 34, 0, 0, TAU); c.fill();
    c.fillStyle = '#e6dcc8'; c.beginPath(); c.ellipse(1960, 400, 230, 120, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(170,155,130,.55)'; c.lineWidth = 1.4;
    for (i = 0; i < 16; i++) { c.beginPath(); c.ellipse(1960, 400, 225 - i * 12, 116 - i * 6.5, 0, 0, TAU); c.stroke(); }
    c.fillStyle = 'rgba(140,130,110,.45)'; c.beginPath(); c.ellipse(2080, 1400, 210, 110, 0, 0, TAU); c.fill();
    /* Wege */
    [PATH3, PATH2, PATH4, PATH].forEach(function (p) { drawPathStroke(c, p, 40); });
    for (i = 0; i < 2600; i++) {
      var px = 300 + r() * 1900, py = 400 + r() * 1100;
      if (!nearPath(px, py, 18)) continue;
      c.fillStyle = r() < .5 ? 'rgba(120,100,70,.45)' : 'rgba(255,250,230,.5)';
      c.beginPath(); c.ellipse(px, py, 1.2 + r() * 1.8, 1 + r() * 1.2, r() * 3, 0, TAU); c.fill();
    }
    /* Teich- und Bachufer */
    c.lineJoin = 'round';
    c.beginPath(); G.smoothPath(c, pondPts, true); c.fillStyle = '#c9b48a'; c.fill();
    c.strokeStyle = '#d8c59c'; c.lineWidth = 34; c.stroke();
    c.strokeStyle = 'rgba(80,120,60,.4)'; c.lineWidth = 40; c.globalCompositeOperation = 'destination-over'; c.stroke(); c.globalCompositeOperation = 'source-over';
    c.beginPath(); G.smoothPath(c, CREEK, false); c.lineCap = 'round';
    c.strokeStyle = '#c9b48a'; c.lineWidth = CREEK_W * 2 + 18; c.stroke();
    /* Uferkiesel */
    for (i = 0; i < 260; i++) {
      var a2 = r() * TAU, rr2 = 1.03 + r() * .1;
      var sx = POND.x + Math.cos(a2) * POND.rx * rr2, sy = POND.y + Math.sin(a2) * POND.ry * rr2;
      c.fillStyle = G.pick(['#a8a296', '#bdb6aa', '#8f887c']); c.beginPath(); c.ellipse(sx, sy, 2 + r() * 3, 1.5 + r() * 2, r() * 3, 0, TAU); c.fill();
    }
    /* Schlammpfützen */
    MUD.forEach(function (m) {
      var pts = []; for (var j = 0; j < 10; j++) { var aa = j / 10 * TAU; pts.push({ x: m.x + Math.cos(aa) * m.r * (0.85 + r() * .3), y: m.y + Math.sin(aa) * m.r * .62 * (0.85 + r() * .3) }); }
      c.beginPath(); G.smoothPath(c, pts, true);
      c.fillStyle = 'rgba(110,80,45,.35)'; c.lineWidth = 12; c.strokeStyle = 'rgba(110,80,45,.35)'; c.stroke();
      c.fillStyle = A.rg(c, m.x - m.r * .3, m.y - m.r * .2, 2, m.r, [0, '#8a6a45', 1, '#5c4326']); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(m.x - m.r * .3, m.y - m.r * .2, m.r * .3, m.r * .1, -.2, 0, TAU); c.fill();
    });
    /* weiche Schatten der festen Objekte */
    props.forEach(function (p) {
      var sw = { tree: 34, sakura: 40, house: 150, pavilion: 125, cave: 115, torii: 60, bush: 22, rock: 18, lamp: 10, bench: 30, sign: 14, slantern: 12, gate: 50, mush: 6 }[p.kind] || 0;
      if (!sw) return;
      c.fillStyle = A.rg(c, p.x + sw * .25, p.y + 2, 1, sw, [0, 'rgba(25,60,20,.32)', 1, 'rgba(25,60,20,0)']);
      c.beginPath(); c.ellipse(p.x + sw * .25, p.y + 2, sw, sw * .38, 0, 0, TAU); c.fill();
    });
  }

  /* ================= Zustand ================= */
  var S = {
    cam: new G.Camera(), fx: new G.Particles(), gfx: new G.Particles(),
    p: { x: 420, y: 720, vx: 0, vy: 0, face: 1, walk: 0, move: 0, throwT: 0, hand: null },
    d: { x: 470, y: 750, vx: 0, vy: 0, z: 0, vz: 0, face: 1, walk: 0, move: 0, state: 'wander', st: 0, tx: 470, ty: 750, speed: 70, pause: 0, carry: null, blink: 0, tilt: 0, collar: null },
    rope: [], leashOn: true, stick: null, poops: [], butterflies: [], fireflies: [],
    t: 0, poopTimer: 140, stepAcc: 0, stepSide: 0, nearZone: null, attract: false, clouds: [], prints: 0,
    light: null
  };
  var LEASH = 150, ROPE_N = 14;
  function resetRope() {
    S.rope = [];
    for (var i = 0; i < ROPE_N; i++) { var k = i / (ROPE_N - 1); S.rope.push({ x: G.lerp(S.p.x, S.d.x, k), y: G.lerp(S.p.y - 20, S.d.y - 20, k), ox: 0, oy: 0 }); }
    S.rope.forEach(function (q) { q.ox = q.x; q.oy = q.y; });
  }
  for (i = 0; i < 6; i++) S.butterflies.push({ x: 300 + Math.random() * 1800, y: 200 + Math.random() * 1100, a: Math.random() * TAU, t: Math.random() * 10, col: G.pick(['#ffd166', '#ff8fb8', '#9ad0ff', '#ffffff', '#ffa94d']) });
  for (i = 0; i < 4; i++) S.clouds.push({ x: Math.random() * WW, y: Math.random() * WH, r: 200 + Math.random() * 200 });
  for (i = 0; i < 3; i++) spawnSniff();

  /* ================= Aktionen ================= */
  function dogDist() { return G.dist(S.p.x, S.p.y, S.d.x, S.d.y); }
  function hearts(x, y, n) { S.fx.emit({ x: x, y: y, type: 'text', text: '❤️', size: 15, life: 1.1, vy: -55, speed: 30, angle: -Math.PI / 2, spread: 1.6, z: 0 }, n || 4); }
  function setDog(state, extra) { S.d.state = state; S.d.st = 0; if (extra) for (var k in extra) S.d[k] = extra[k]; }
  function primary() {
    if (S.attract) return;
    var z = S.nearZone;
    if (z && z.active) { enterZone(z); return; }
    var pp = nearestPoop();
    if (pp && pp.d < 60) { cleanPoop(pp.p); return; }
    throwStick();
  }
  function enterZone(z) {
    var sc = S.cam.toScreen(S.p.x, S.p.y - 20);
    G.sfx('door');
    G.go(z.id, { returnTo: z.id }, { cx: sc.x, cy: sc.y });
  }
  function nearestPoop() {
    var best = null;
    S.poops.forEach(function (p) { var dd = G.dist(S.p.x, S.p.y, p.x, p.y); if (!best || dd < best.d) best = { p: p, d: dd }; });
    return best;
  }
  function cleanPoop(p) {
    S.poops.splice(S.poops.indexOf(p), 1);
    G.sfx('grab'); G.buzz(15);
    S.fx.emit({ x: p.x, y: p.y - 8, type: 'star', color: '#fff3b0', size: 5, life: .6, speed: 70, vr: 8 }, 8);
    S.fx.emit({ x: p.x, y: p.y - 18, type: 'text', text: '🧻', size: 18, life: .9, vy: -40 }, 1);
    G.stat('love', 3); G.quest('clean');
    G.toast('Brav aufgeräumt! ✨');
  }
  function throwStick() {
    if (S.stick || S.d.state === 'fetchGo' || S.d.state === 'fetchBack') return;
    var dx = S.p.vx, dy = S.p.vy, l = Math.hypot(dx, dy);
    if (l < 5) { dx = S.p.face; dy = (Math.random() - .5) * .6; l = Math.hypot(dx, dy); }
    dx /= l; dy /= l;
    var dist = 230, tx, ty;
    for (; dist > 60; dist -= 15) { tx = S.p.x + dx * dist; ty = S.p.y + dy * dist; if (!collides(tx, ty, 14) && !inMud(tx, ty)) break; }
    if (dist <= 60) { G.toast('Hier ist kein Platz zum Werfen'); return; }
    S.stick = { x: S.p.x, y: S.p.y, sx: S.p.x, sy: S.p.y, tx: tx, ty: ty, t: 0, dur: .75, z: 0, rot: 0, landed: false };
    S.p.throwT = 1; S.p.face = dx < 0 ? -1 : 1;
    S.leashOn = false;
    G.sfx('throw');
    setDog('wait');
    S.d.earUp = 1;
  }
  function petDog() {
    if (S.attract) return;
    if (dogDist() > 75) { G.toast(G.data.name + ' ist zu weit weg – ruf ihn her! 📣'); return; }
    if (S.d.state === 'fetchGo' || S.d.state === 'fetchBack') return;
    S.p.face = S.d.x < S.p.x ? -1 : 1;
    setDog('sit', { tx: S.d.x, ty: S.d.y });
    S.d.happyT = 2.2;
    hearts(S.d.x, S.d.y - 40, 5);
    G.sfx('pet'); G.buzz(18);
    G.stat('love', 8); G.quest('pet');
    if (Math.random() < .5) setTimeout(function () { G.sfx('bark'); }, 300);
  }
  function callDog() {
    if (S.attract) return;
    G.sfx('whistle');
    if (S.d.state === 'fetchGo' || S.d.state === 'fetchBack' || S.d.state === 'dig' || S.d.state === 'squat') return;
    setDog('come');
    S.d.earUp = 1;
  }

  /* ================= Hund-Verhalten ================= */
  function pickWander() {
    var d = S.d, tries = 0;
    /* manchmal zu einer Schnüffelstelle in Leinen-Reichweite */
    for (var i = 0; i < sniffs.length; i++) {
      var s = sniffs[i];
      if (G.dist(S.p.x, S.p.y, s.x, s.y) < LEASH * .9 && Math.random() < .8) { d.tx = s.x; d.ty = s.y; d.speed = 120; d.sniffTarget = s; return; }
    }
    d.sniffTarget = null;
    while (tries++ < 12) {
      var a = Math.random() * TAU, r = 30 + Math.random() * (LEASH - 40);
      var x = S.p.x + Math.cos(a) * r, y = S.p.y + Math.sin(a) * r;
      if (!collides(x, y, 12)) { d.tx = x; d.ty = y; break; }
    }
    d.speed = 40 + Math.random() * Math.random() * 110;
    d.pause = Math.random() < .3 ? .6 + Math.random() * 1.4 : 0;
  }
  function moveDogTo(tx, ty, speed, accel, dt) {
    var d = S.d, dx = tx - d.x, dy = ty - d.y, dd = Math.hypot(dx, dy);
    var sp = Math.min(speed, dd * 3.2);
    G.approach(d, dd > .5 ? dx / dd * sp : 0, dd > .5 ? dy / dd * sp : 0, accel, dt);
    var nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
    if (!collides(nx, d.y, 11)) d.x = nx; else d.vx *= -.2;
    if (!collides(d.x, ny, 11)) d.y = ny; else d.vy *= -.2;
    return dd;
  }
  function updateDog(dt) {
    var d = S.d, p = S.p, data = G.data;
    d.st += dt;
    d.blink = (Math.sin(S.t * 1.7) + Math.sin(S.t * 2.9)) / 2;
    d.earUp = Math.max(0, (d.earUp || 0) - dt * 1.5);
    d.happyT = Math.max(0, (d.happyT || 0) - dt);
    var pd = dogDist();
    switch (d.state) {
      case 'wander':
        if (d.pause > 0) { d.pause -= dt; moveDogTo(d.x, d.y, 0, 200, dt); d.tilt = G.damp(d.tilt, .35, 5, dt); break; }
        d.tilt = G.damp(d.tilt, 0, 6, dt);
        var dd = moveDogTo(d.tx, d.ty, d.speed, 160, dt);
        if (dd < 10 || d.st > 4 + Math.random() * 3) {
          if (d.sniffTarget && G.dist(d.x, d.y, d.sniffTarget.x, d.sniffTarget.y) < 22) { setDog('dig'); G.sfx('dig'); break; }
          if (Math.random() < .06 && !S.attract) { setDog('dig'); G.sfx('dig'); break; }
          d.st = 0; pickWander();
        }
        /* Schmetterlinge jagen */
        if (!S.attract) S.butterflies.forEach(function (b) { if (d.state === 'wander' && G.dist(d.x, d.y, b.x, b.y) < 90 && Math.random() < dt * .25) { setDog('chase', { target: b }); G.sfx('yip'); } });
        break;
      case 'come':
        moveDogTo(p.x + (d.x < p.x ? -26 : 26), p.y + 8, 230, 420, dt);
        if (pd < 40) { setDog('sit'); d.happyT = 1.5; }
        if (d.st > 6) setDog('wander');
        break;
      case 'sit':
        moveDogTo(d.x, d.y, 0, 300, dt);
        if (d.st > (d.happyT > 0 ? 2.4 : 3)) { setDog('wander'); pickWander(); }
        break;
      case 'wait': /* schaut dem Stöckchen nach */
        moveDogTo(d.x, d.y, 0, 300, dt);
        if (S.stick) d.face = S.stick.x < d.x ? -1 : 1;
        if (S.stick && S.stick.landed) setDog('fetchGo');
        break;
      case 'fetchGo':
        if (!S.stick) { setDog('wander'); break; }
        if (moveDogTo(S.stick.x, S.stick.y, 280, 520, dt) < 14) {
          S.stick = null; d.carry = 'stick'; setDog('fetchBack'); G.sfx('grab');
          S.fx.emit({ x: d.x, y: d.y - 2, color: 'rgba(120,90,50,.6)', size: 2.5, life: .5, speed: 50 }, 6);
        }
        break;
      case 'fetchBack':
        if (moveDogTo(p.x + (d.x < p.x ? -24 : 24), p.y + 6, 250, 500, dt) < 18) {
          d.carry = null; S.leashOn = true; resetRope();
          setDog('sit'); d.happyT = 2; d.vz = 220;
          hearts(d.x, d.y - 40, 6); G.sfx('happy'); G.buzz(20);
          G.stat('love', 6); G.stat('energy', -2); G.quest('fetch');
          G.updateAction('primary', { disabled: false });
        }
        break;
      case 'dig':
        moveDogTo(d.x, d.y, 0, 300, dt);
        if (Math.random() < dt * 18) S.gfx.emit({ x: d.x + d.face * 16, y: d.y - 2, z: 4, vz: 120, gravity: 500, color: G.pick(['#7a5a34', '#8f6b40', '#5c4326']), size: 2.4, life: .8, speed: 60, angle: d.face > 0 ? Math.PI : 0, spread: 1.2, shadow: true }, 1);
        if (d.st > 1.6) {
          var found = d.sniffTarget || Math.random() < .35;
          if (d.sniffTarget) { sniffs.splice(sniffs.indexOf(d.sniffTarget), 1); d.sniffTarget = null; setTimeout(spawnSniff, 8000); }
          if (found && !S.attract) {
            G.addBones(1); G.sfx('bone'); G.quest('dig'); G.buzz(25);
            S.fx.emit({ x: d.x + d.face * 14, y: d.y - 4, type: 'text', text: '🦴', size: 22, life: 1.3, vy: -70, always: true }, 1);
            S.fx.emit({ x: d.x + d.face * 14, y: d.y - 10, type: 'star', color: '#ffd166', size: 5, life: .7, speed: 90, vr: 10, add: true }, 10);
            G.toast(G.data.name + ' hat einen Knochen gefunden! 🦴');
            d.happyT = 2;
          }
          setDog('wander'); pickWander();
        }
        break;
      case 'squat':
        moveDogTo(d.x, d.y, 0, 300, dt);
        if (d.st > 1.3) {
          S.poops.push({ x: d.x - d.face * 16, y: d.y + 2 });
          setDog('wander'); pickWander();
        }
        break;
      case 'chase':
        var b = d.target;
        moveDogTo(b.x, b.y + 20, 210, 420, dt);
        if (Math.random() < dt * 1.5 && d.z === 0) { d.vz = 200; G.sfx('yip', .6); }
        if (d.st > 2.6 || pd > LEASH + 30) { setDog('wander'); pickWander(); G.quest('butterfly'); b.a += Math.PI; }
        break;
    }
    /* Sprung / Höhe */
    if (d.vz || d.z > 0) { d.vz -= 900 * dt; d.z += d.vz * dt; if (d.z <= 0) { d.z = 0; d.vz = 0; } }
    /* Leine: Hund kann sich nicht weiter entfernen */
    if (S.leashOn && pd > LEASH) {
      var k = (pd - LEASH) / pd, ex = (d.x - p.x) * k, ey = (d.y - p.y) * k;
      if (!collides(d.x - ex, d.y, 11)) d.x -= ex; if (!collides(d.x, d.y - ey, 11)) d.y -= ey;
      d.vx *= .9; d.vy *= .9;
    }
    var sp = Math.hypot(d.vx, d.vy);
    d.move = G.clamp(sp / 120, 0, 1.2);
    d.walk += sp * dt * .085;
    if (Math.abs(d.vx) > 8) d.face = d.vx < 0 ? -1 : 1;
    else if (d.state === 'sit' || d.state === 'come') d.face = p.x < d.x ? -1 : 1;
    /* Schlamm */
    var m = inMud(d.x, d.y);
    if (m && sp > 10) {
      if (!d.inMud) { G.sfx('mud'); S.gfx.emit({ x: d.x, y: d.y, color: '#6b4a2b', size: 3, life: .7, speed: 90, vz: 140, gravity: 500, shadow: true }, 10); }
      data.dirt = Math.min(1, (data.dirt || 0) + dt * .7);
      data.stats.fur = Math.max(0, data.stats.fur - dt * 9);
      data.wasMuddy = true;
    }
    d.inMud = !!m;
    if ((data.dirt || 0) > .25 && sp > 30) {
      S.prints += sp * dt;
      if (S.prints > 22) { S.prints = 0; S.gfx.emit({ x: d.x + (Math.random() - .5) * 8, y: d.y + 1, type: 'circle', color: 'rgba(92,64,36,.55)', size: 2.6, life: 5, fade: true, always: true }, 1); }
    }
    /* Kacke */
    if (!S.attract && d.state === 'wander' && S.poops.length < 2) {
      S.poopTimer -= dt;
      if (S.poopTimer <= 0) { S.poopTimer = 110 + Math.random() * 120; setDog('squat'); }
    }
  }

  /* ================= Spielerin ================= */
  function updatePlayer(dt) {
    var p = S.p, inp = S.attract ? { x: 0, y: 0, mag: 0 } : G.readMove();
    var maxSp = 175 + (inp.mag > .95 ? 45 : 0);
    G.approach(p, inp.x * maxSp, inp.y * maxSp, inp.mag ? 1400 : 1700, dt);
    var nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (!collides(nx, p.y, 13)) p.x = nx; else p.vx = 0;
    if (!collides(p.x, ny, 13)) p.y = ny; else p.vy = 0;
    var sp = Math.hypot(p.vx, p.vy);
    p.move = G.clamp(sp / 170, 0, 1.2);
    p.walk += sp * dt * .075;
    if (Math.abs(p.vx) > 10) p.face = p.vx < 0 ? -1 : 1;
    p.throwT = Math.max(0, p.throwT - dt * 2.4);
    if (sp > 20) {
      S.stepAcc += sp * dt;
      if (S.stepAcc > 42) {
        S.stepAcc = 0;
        var gravel = nearPath(p.x, p.y, 22);
        G.sfx(gravel ? 'stepGravel' : 'step', .8);
        G.quest('walk');
        if (gravel) S.gfx.emit({ x: p.x, y: p.y, color: 'rgba(200,180,140,.7)', size: 2, life: .4, speed: 30 }, 2);
      }
    }
  }

  /* ================= Leine (Verlet-Seil) ================= */
  function updateRope(dt) {
    var r = S.rope, n = r.length, hand = S.p.hand || { hx: S.p.x, hy: S.p.y - 20 };
    var end = S.d.collar || { lx: S.d.x, ly: S.d.y - 20 };
    var span = G.dist(hand.hx, hand.hy, end.lx, end.ly - S.d.z);
    var seg = (S.leashOn ? Math.max(span * 1.1 + 6, 34) : 46) / (n - 1);
    for (var i = 1; i < n - 1; i++) {
      var q = r[i], vx = (q.x - q.ox) * .94, vy = (q.y - q.oy) * .94;
      q.ox = q.x; q.oy = q.y; q.x += vx; q.y += vy + 0.35;
    }
    r[0].x = hand.hx; r[0].y = hand.hy;
    if (S.leashOn) { r[n - 1].x = end.lx; r[n - 1].y = end.ly - S.d.z; }
    for (var it = 0; it < 6; it++) {
      for (i = 0; i < n - 1; i++) {
        var a = r[i], b = r[i + 1], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy) || 1, diff = (dd - seg) / dd;
        if (dd < seg) continue;
        var fa = i === 0 ? 0 : (S.leashOn && i + 1 === n - 1 ? 1 : .5), fb = 1 - fa;
        if (i + 1 === n - 1 && S.leashOn) { fa = 1; fb = 0; }
        if (i === 0) { fa = 0; fb = 1; }
        a.x += dx * diff * fa; a.y += dy * diff * fa; b.x -= dx * diff * fb; b.y -= dy * diff * fb;
      }
    }
  }
  function drawRope(ctx) {
    var r = S.rope;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(r[0].x + 3, r[0].y + 4); for (var i = 1; i < r.length; i++) ctx.lineTo(r[i].x + 3, r[i].y + 4); ctx.stroke();
    ctx.strokeStyle = '#b4232f'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(r[0].x, r[0].y); for (i = 1; i < r.length; i++) ctx.lineTo(r[i].x, r[i].y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .8; ctx.stroke();
    if (!S.leashOn) { var e = r[r.length - 1]; ctx.fillStyle = '#c9c9c9'; ctx.beginPath(); ctx.arc(e.x, e.y, 2.4, 0, TAU); ctx.fill(); }
  }

  /* ================= Update ================= */
  var dayInfo = G.dayInfo(), dayTick = 0;
  function update(dt) {
    S.t += dt;
    dayTick -= dt; if (dayTick <= 0) { dayTick = 20; dayInfo = G.dayInfo(); G.music(S.attract ? 'hub' : dayInfo.night > .6 ? 'night' : 'hub'); }
    if (!S.attract) { updatePlayer(dt); updateDog(dt); }
    /* Stöckchen-Flug */
    var st = S.stick;
    if (st && !st.landed) {
      st.t += dt; var k = Math.min(1, st.t / st.dur);
      st.x = G.lerp(st.sx, st.tx, k); st.y = G.lerp(st.sy, st.ty, k);
      st.z = Math.sin(k * Math.PI) * 90 + (1 - k) * 22; st.rot += dt * 14;
      if (k >= 1) { st.landed = true; st.z = 0; G.sfx('land'); S.gfx.emit({ x: st.x, y: st.y, color: 'rgba(120,150,80,.8)', size: 2, life: .5, speed: 60 }, 6); }
    }
    /* Schmetterlinge */
    S.butterflies.forEach(function (b) {
      b.t += dt; b.a += (Math.sin(b.t * .9) + Math.sin(b.t * 2.3) * .5) * dt * 1.6;
      b.x += Math.cos(b.a) * 38 * dt; b.y += Math.sin(b.a) * 38 * dt;
      if (b.x < 100 || b.x > WW - 100 || b.y < 100 || b.y > WH - 100) b.a += Math.PI * dt * 3;
    });
    /* Glühwürmchen nachts */
    if (dayInfo.night > .3 && Math.random() < dt * 14 * G.fx) {
      var v = S.cam.view(40);
      S.fx.emit({ x: G.rand(v.l, v.r), y: G.rand(v.t, v.b), type: 'glow', color: 'rgba(220,255,140,.9)', size: 5, life: 3.5, vx: G.rand(-12, 12), vy: G.rand(-14, 4), add: true, always: true }, 1);
    }
    /* Blätter wehen bei Tag */
    if (dayInfo.night < .5 && Math.random() < dt * 2 * G.fx) {
      var vv = S.cam.view(0);
      S.fx.emit({ x: vv.l - 10, y: G.rand(vv.t, vv.b), type: G.pick(['leaf', 'petal']), color: G.pick(['#8ccf73', '#ffc4d8', '#c7e58f']), size: 3.2, life: 7, vx: G.rand(40, 70), vy: G.rand(-8, 14), vr: 6, always: true }, 1);
    }
    /* Schornsteinrauch */
    if (Math.random() < dt * 3) S.fx.emit({ x: HOUSE.x + 67, y: HOUSE.y - 212, color: 'rgba(235,235,235,.5)', size: 6, grow: 9, life: 3.2, vx: 12, vy: -22, always: true }, 1);
    S.fx.update(dt); S.gfx.update(dt);
    S.sniffT = (S.sniffT || 0) + dt;
    S.clouds.forEach(function (c) { c.x += 14 * dt; c.y += 4 * dt; if (c.x - c.r > WW) { c.x = -c.r; c.y = Math.random() * WH; } });

    /* Zonen & Kontext-Knopf */
    S.nearZone = null;
    if (!S.attract) {
      var best = null;
      ZONES.forEach(function (z) { var dd = G.dist(S.p.x, S.p.y, z.x, z.y); if (dd < 190 && (!best || dd < best.d)) best = { z: z, d: dd }; });
      if (best) S.nearZone = { id: best.z.id, z: best.z, active: best.d < best.z.r, d: best.d, x: best.z.x, y: best.z.y, label: best.z.label, icon: best.z.icon };
      var pp = nearestPoop();
      if (S.nearZone && S.nearZone.active) G.updateAction('primary', { icon: S.nearZone.icon, label: 'Betreten', disabled: false, pulse: true });
      else if (pp && pp.d < 60) G.updateAction('primary', { icon: '🧻', label: 'Aufsammeln', disabled: false, pulse: true });
      else G.updateAction('primary', { icon: '🥢', label: 'Werfen', disabled: !!S.stick || S.d.state === 'fetchGo' || S.d.state === 'fetchBack', pulse: false });
    }

    /* Kamera */
    var cam = S.cam;
    cam.zoom = G.damp(cam.zoom, cam.baseZoom(345), 3, dt);
    if (S.attract) {
      var ang = S.t * .05;
      cam.follow(WW / 2 + Math.cos(ang) * 700, WH / 2 + Math.sin(ang * 1.3) * 350, dt, WW, WH, 1.2);
      /* Spielerin und Hund laufen im Titelbild entspannt mit */
      var npx = cam.x - 40, npy = cam.y + 50, pdx = npx - S.p.x, pdy = npy - S.p.y;
      if (Math.hypot(pdx, pdy) > 200) { S.p.x = npx; S.p.y = npy; S.d.x = npx - 40; S.d.y = npy + 8; resetRope(); }
      else { S.p.vx = pdx / Math.max(dt, .001); S.p.vy = pdy / Math.max(dt, .001); S.p.x = npx; S.p.y = npy; }
      S.p.move = G.clamp(Math.hypot(S.p.vx, S.p.vy) / 120, 0, 1); S.p.walk += Math.hypot(S.p.vx, S.p.vy) * dt * .075; S.p.face = S.p.vx < 0 ? -1 : 1;
      var odx = S.d.x, ody = S.d.y;
      S.d.x = G.damp(S.d.x, S.p.x + S.p.face * 46, 2.5, dt); S.d.y = G.damp(S.d.y, S.p.y + 10, 2.5, dt);
      S.d.vx = (S.d.x - odx) / Math.max(dt, .001); S.d.vy = (S.d.y - ody) / Math.max(dt, .001);
      var dsp = Math.hypot(S.d.vx, S.d.vy); S.d.move = G.clamp(dsp / 120, 0, 1.2); S.d.walk += dsp * dt * .085; if (Math.abs(S.d.vx) > 5) S.d.face = S.d.vx < 0 ? -1 : 1;
    } else cam.follow(S.p.x + S.p.vx * .35, S.p.y - 20 + S.p.vy * .25, dt, WW, WH, 5);
    cam.update(dt);
    /* Ton-Atmosphäre */
    var wd = Math.min(pondR(cam.x, cam.y) - 1, 99) * POND.ry, cd = 9999;
    for (var c = 0; c < CREEK.length - 1; c++) cd = Math.min(cd, G.distToSeg(cam.x, cam.y, CREEK[c].x, CREEK[c].y, CREEK[c + 1].x, CREEK[c + 1].y));
    G.ambient({ birds: 1 - dayInfo.night, crickets: dayInfo.night, water: G.clamp(1 - Math.min(wd, cd) / 380, 0, 1) * .22 }, dt);
  }

  /* ================= Zeichnen ================= */
  function drawWater(ctx, v) {
    var t = S.t;
    /* Bach */
    if (v.r > 1300 && v.l < 1600) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); G.smoothPath(ctx, CREEK, false);
      ctx.strokeStyle = '#3d9cbf'; ctx.lineWidth = CREEK_W * 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,210,235,.6)'; ctx.lineWidth = CREEK_W * 1.2; ctx.stroke();
      ctx.setLineDash([10, 26]); ctx.lineDashOffset = -t * 60;
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.lineDashOffset = -t * 45 + 13; ctx.lineWidth = 1.4; ctx.translate(5, 2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    /* Teich */
    if (v.r > POND.x - POND.rx - 30 && v.l < POND.x + POND.rx + 30 && v.b > POND.y - POND.ry - 30 && v.t < POND.y + POND.ry + 30) {
      ctx.save();
      ctx.beginPath(); G.smoothPath(ctx, pondPts, true);
      ctx.fillStyle = A.rg(ctx, POND.x, POND.y, 20, POND.rx * 1.1, [0, '#2a7fa6', .7, '#3e9fc4', 1, '#7fd0e6']); ctx.fill();
      ctx.clip();
      /* Lichtwellen */
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.6;
      for (var i = 0; i < 9; i++) {
        var yy = POND.y - POND.ry + 20 + i * 30;
        ctx.beginPath();
        for (var x = POND.x - POND.rx; x <= POND.x + POND.rx; x += 14) ctx.lineTo(x, yy + Math.sin(x * .035 + t * 1.6 + i) * 4);
        ctx.stroke();
      }
      for (i = 0; i < 14; i++) {
        var sx = POND.x + Math.sin(i * 12.9) * POND.rx * .8, sy = POND.y + Math.cos(i * 7.3) * POND.ry * .7, a = Math.max(0, Math.sin(t * 2 + i * 1.7));
        ctx.fillStyle = 'rgba(255,255,255,' + a * .7 + ')'; ctx.beginPath(); ctx.ellipse(sx, sy, 4 * a + 1, 1.2, 0, 0, TAU); ctx.fill();
      }
      /* Fische als Schatten */
      for (i = 0; i < 3; i++) {
        var fa = t * (.3 + i * .1) + i * 2, fx = POND.x + Math.cos(fa) * POND.rx * (.4 + i * .15), fy = POND.y + Math.sin(fa * 1.3) * POND.ry * .5;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(fa + Math.PI / 2 + Math.sin(t * 6 + i) * .2);
        ctx.fillStyle = 'rgba(15,50,70,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-14, -4); ctx.lineTo(-14, 4); ctx.fill(); ctx.restore();
      }
      ctx.restore();
      /* Seerosen */
      [[1420, 760], [1480, 880], [1260, 920], [1390, 940], [1500, 790]].forEach(function (l, k) {
        var bob = Math.sin(t * 1.2 + k) * 1.5;
        ctx.fillStyle = '#4f9a45'; ctx.beginPath(); ctx.arc(l[0], l[1] + bob, 13, .3, TAU - .3); ctx.lineTo(l[0], l[1] + bob); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(l[0] - 3, l[1] - 3 + bob, 5, 0, TAU); ctx.fill();
        if (k % 2 === 0) { ctx.fillStyle = '#ffc4d8'; for (var pe = 0; pe < 6; pe++) { ctx.beginPath(); ctx.ellipse(l[0] + 4 + Math.cos(pe) * 3, l[1] - 2 + bob + Math.sin(pe) * 3, 3, 1.6, pe, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(l[0] + 4, l[1] - 2 + bob, 1.8, 0, TAU); ctx.fill(); }
      });
      /* Steg */
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(DOCK.x + 4, DOCK.y + DOCK.h - 2, DOCK.w, 6);
      ctx.fillStyle = A.lg(ctx, 0, DOCK.y, 0, DOCK.y + DOCK.h, [0, '#b8875a', 1, '#8a5a3a']);
      ctx.fillRect(DOCK.x, DOCK.y, DOCK.w, DOCK.h);
      ctx.strokeStyle = '#5e3a22'; ctx.lineWidth = 1.2;
      for (x = DOCK.x + 12; x < DOCK.x + DOCK.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, DOCK.y); ctx.lineTo(x, DOCK.y + DOCK.h); ctx.stroke(); }
      ctx.fillStyle = '#5e3a22'; [DOCK.x + 4, DOCK.x + DOCK.w - 8].forEach(function (px) { ctx.fillRect(px, DOCK.y - 6, 5, DOCK.h + 12); });
      /* Angel am Stegende */
      ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(DOCK.x + DOCK.w - 20, DOCK.y + 20); ctx.lineTo(DOCK.x + DOCK.w + 18, DOCK.y - 26); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(DOCK.x + DOCK.w + 18, DOCK.y - 26); ctx.quadraticCurveTo(DOCK.x + DOCK.w + 34, DOCK.y, DOCK.x + DOCK.w + 30, DOCK.y + 26 + Math.sin(t * 2) * 2); ctx.stroke();
      ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(DOCK.x + DOCK.w + 30, DOCK.y + 27 + Math.sin(t * 2) * 2, 2.6, 0, TAU); ctx.fill();
    }
    /* Brücke */
    if (Math.abs(v.l - BRIDGE.x) < 1400) {
      var bx = BRIDGE.x - BRIDGE.w / 2, by = BRIDGE.y - BRIDGE.h / 2;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(bx + 4, by + BRIDGE.h - 2, BRIDGE.w, 7);
      ctx.fillStyle = A.lg(ctx, 0, by, 0, by + BRIDGE.h, [0, '#c69563', 1, '#8a5a3a']); ctx.fillRect(bx, by + 6, BRIDGE.w, BRIDGE.h - 10);
      ctx.strokeStyle = '#5e3a22'; ctx.lineWidth = 1.2;
      for (var bxx = bx + 10; bxx < bx + BRIDGE.w; bxx += 11) { ctx.beginPath(); ctx.moveTo(bxx, by + 6); ctx.lineTo(bxx, by + BRIDGE.h - 4); ctx.stroke(); }
      ctx.fillStyle = '#6b4226'; ctx.fillRect(bx, by, BRIDGE.w, 5); ctx.fillRect(bx, by + BRIDGE.h - 5, BRIDGE.w, 5);
    }
  }
  function drawFence(ctx, v) {
    var fp = A.fencePost();
    for (var x = 20; x < WW; x += 40) {
      if (x > v.l - 40 && x < v.r + 40) { if (v.t < 60) G.drawSprite(ctx, fp, x, 44); if (v.b > WH - 40 && Math.abs(x - GATE.x) > 60) G.drawSprite(ctx, fp, x, WH - 6); }
    }
    ctx.fillStyle = '#8a5a3a';
    [12, WW - 12].forEach(function (x) {
      if (x < v.l - 20 || x > v.r + 20) return;
      for (var y = 50; y < WH; y += 46) { ctx.fillStyle = '#7a4e2a'; ctx.fillRect(x - 3, y - 26, 7, 30); }
      ctx.fillStyle = '#9a6a3c'; ctx.fillRect(x - 2, 40, 4, WH - 40);
    });
  }
  function drawProp(ctx, p, t) {
    switch (p.kind) {
      case 'tree': G.drawSprite(ctx, A.tree(p.t), p.x, p.y, Math.sin(t * 1.3 + p.sway) * .025); break;
      case 'sakura': G.drawSprite(ctx, A.tree('sakura'), p.x, p.y, Math.sin(t * 1.1 + p.sway) * .02); break;
      case 'bush': G.drawSprite(ctx, A.bush(p.v), p.x, p.y); break;
      case 'rock': G.drawSprite(ctx, A.rock(p.v), p.x, p.y); break;
      case 'mush': G.drawSprite(ctx, A.mushroom(), p.x, p.y); break;
      case 'lamp': G.drawSprite(ctx, A.lamp(), p.x, p.y); break;
      case 'bench': G.drawSprite(ctx, A.bench(), p.x, p.y); break;
      case 'sign': G.drawSprite(ctx, A.sign(p.e, p.l), p.x, p.y); break;
      case 'slantern': G.drawSprite(ctx, A.stoneLantern(), p.x, p.y); break;
      case 'house': G.drawSprite(ctx, A.house(), p.x, p.y); break;
      case 'pavilion': G.drawSprite(ctx, A.pavilion(), p.x, p.y); break;
      case 'torii': G.drawSprite(ctx, A.torii(), p.x, p.y); break;
      case 'cave':
        G.drawSprite(ctx, A.caveHill(), p.x, p.y);
        var bl = Math.sin(t * .7) > .96 ? .1 : 1;
        ctx.fillStyle = 'rgba(255,220,90,.85)'; ctx.beginPath(); ctx.ellipse(p.x - 8, p.y - 58, 2.6, 2.6 * bl, 0, 0, TAU); ctx.ellipse(p.x + 8, p.y - 58, 2.6, 2.6 * bl, 0, 0, TAU); ctx.fill();
        break;
      case 'gate': G.drawSprite(ctx, A.gate(), p.x, p.y); break;
      case 'player': S.p.hand = A.player(ctx, { x: S.p.x, y: S.p.y, face: S.p.face, walk: S.p.walk, move: S.p.move, t: t, throwT: S.p.throwT }); break;
      case 'dog':
        var d = S.d, data = G.data;
        var pose = d.state === 'sit' ? 'sit' : d.state === 'dig' ? 'dig' : d.state === 'squat' ? 'squat' : 'stand';
        if (d.state === 'wander' && d.pause > 0 && d.pause < 1) pose = 'stand';
        if (d.z > 0) { A.shadow(ctx, d.x, d.y, 18 - d.z * .05, 4.5, .18); }
        d.collar = A.dog(ctx, {
          x: d.x, y: d.y - d.z, face: d.face, walk: d.walk, move: d.state === 'dig' ? .2 : d.move, t: t, pose: pose,
          wag: d.happyT > 0 || d.state === 'come' || d.state === 'fetchBack' || d.state === 'wait' ? 1 : .4 + data.stats.love / 200,
          dirt: data.dirt || 0, carry: d.carry, blink: d.blink, tilt: d.tilt + (d.state === 'wait' ? -.2 : 0), earUp: d.earUp,
          pant: d.move > .8 ? 1 : 0, happy: d.happyT > 0, sad: G.mood().key === 'sad', acc: data.wear
        });
        break;
      case 'poop': A.poop(ctx, p.ref.x, p.ref.y, t); break;
      case 'stick':
        var s = S.stick;
        if (!s) break;
        if (s.z > 1) A.shadow(ctx, s.x, s.y, 8, 2.5, .2);
        A.stick(ctx, s.x, s.y - s.z, s.landed ? .3 : s.rot);
        break;
    }
  }
  var drawList = [];
  function draw(ctx) {
    var cam = S.cam, t = S.t;
    if (!ground) buildGround();
    cam.apply(ctx);
    var v = cam.view(20);
    /* Boden (nur sichtbarer Ausschnitt) */
    var sx = G.clamp(v.l, 0, WW), sy = G.clamp(v.t, 0, WH), sw = G.clamp(v.r, 0, WW) - sx, sh = G.clamp(v.b, 0, WH) - sy;
    ctx.fillStyle = '#4c8f42'; ctx.fillRect(v.l - 50, v.t - 50, v.r - v.l + 100, v.b - v.t + 100);
    if (sw > 0 && sh > 0) ctx.drawImage(ground, sx * GS, sy * GS, sw * GS, sh * GS, sx, sy, sw, sh);
    drawWater(ctx, v);
    /* Schnüffelstellen */
    sniffs.forEach(function (s) {
      if (s.x < v.l || s.x > v.r || s.y < v.t || s.y > v.b) return;
      var a = .5 + Math.sin(t * 3 + s.t) * .5;
      ctx.fillStyle = 'rgba(110,80,45,.35)'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 12, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,170,' + (.4 + a * .5) + ')';
      for (var k = 0; k < 3; k++) { var aa = t * 1.5 + k * 2.1; ctx.beginPath(); ctx.arc(s.x + Math.cos(aa) * 9, s.y - 8 - Math.abs(Math.sin(aa)) * 9, 1.6 + a, 0, TAU); ctx.fill(); }
    });
    S.gfx.draw(ctx);
    /* Grasbüschel & Blumen (Bodenhöhe) */
    ctx.lineCap = 'round';
    for (var i = 0; i < tufts.length; i++) {
      var g = tufts[i]; if (g.x < v.l || g.x > v.r || g.y < v.t || g.y > v.b + 10) continue;
      var sway = Math.sin(t * 2 + g.s + g.x * .01) * 2.2;
      ctx.strokeStyle = g.c; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(g.x - 3, g.y); ctx.quadraticCurveTo(g.x - 4, g.y - g.h * .6, g.x - 5 + sway, g.y - g.h);
      ctx.moveTo(g.x, g.y); ctx.quadraticCurveTo(g.x, g.y - g.h * .7, g.x + sway * 1.2, g.y - g.h * 1.2);
      ctx.moveTo(g.x + 3, g.y); ctx.quadraticCurveTo(g.x + 4, g.y - g.h * .6, g.x + 6 + sway, g.y - g.h * .9);
      ctx.stroke();
    }
    for (i = 0; i < flowers.length; i++) {
      var f = flowers[i]; if (f.x < v.l || f.x > v.r || f.y < v.t || f.y > v.b + 20) continue;
      G.drawSprite(ctx, A.flower(f.v), f.x, f.y, Math.sin(t * 2.2 + f.s) * .12);
    }
    drawFence(ctx, v);
    /* y-sortierte Objekte */
    drawList.length = 0;
    for (i = 0; i < props.length; i++) { var p = props[i]; if (p.x > v.l - 160 && p.x < v.r + 160 && p.y > v.t - 20 && p.y < v.b + 260) drawList.push(p); }
    drawList.push({ kind: 'player', y: S.p.y }, { kind: 'dog', y: S.d.y });
    S.poops.forEach(function (pp) { drawList.push({ kind: 'poop', y: pp.y, ref: pp }); });
    if (S.stick) drawList.push({ kind: 'stick', y: S.stick.y });
    drawList.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < drawList.length; i++) drawProp(ctx, drawList[i], t);
    if (!S.attract || true) { updateRope(1 / 60); drawRope(ctx); }
    /* Schmetterlinge */
    S.butterflies.forEach(function (b) {
      if (b.x < v.l || b.x > v.r || b.y < v.t || b.y > v.b) return;
      var h = 26 + Math.sin(b.t * 3) * 6;
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 4, 1.5, 0, 0, TAU); ctx.fill();
      A.butterfly(ctx, b.x, b.y - h, b.t, b.col);
    });
    S.fx.draw(ctx);
    /* Wolkenschatten */
    if (dayInfo.night < .5) {
      S.clouds.forEach(function (c) {
        if (c.x + c.r < v.l || c.x - c.r > v.r || c.y + c.r < v.t || c.y - c.r > v.b) return;
        ctx.fillStyle = A.rg(ctx, c.x, c.y, 10, c.r, [0, 'rgba(20,40,30,.13)', 1, 'rgba(20,40,30,0)']);
        ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * .6, 0, 0, TAU); ctx.fill();
      });
    }
    drawLighting(ctx, v);
    /* Hinweise über den Zielen */
    if (S.nearZone && !S.attract) {
      var z = S.nearZone, yOff = { house: 250, runner: 110, maze: 160, fish: 50, race: 70 }[z.id];
      cam.apply(ctx);
      A.prompt(ctx, z.x, z.y - yOff, z.active ? z.label + ' – tippen' : z.label, t, z.active);
    }
    if (!S.attract && S.d.state === 'wander' && dogDist() > LEASH * .98 && Math.random() < .002) G.sfx('yip', .4);
  }
  /* Licht: Abend-Tönung, Nacht mit Laternen, Fenstern und Glühwürmchen */
  function drawLighting(ctx, v) {
    var night = dayInfo.night, dusk = dayInfo.dusk;
    if (night < .02 && dusk < .02) return;
    G.screen(ctx);
    if (dusk > .02) { ctx.fillStyle = 'rgba(255,140,70,' + (dusk * .16) + ')'; ctx.fillRect(0, 0, G.W, G.H); }
    if (night < .02) return;
    var sc = .5, lw = Math.ceil(G.W * sc), lh = Math.ceil(G.H * sc);
    if (!S.light || S.light.width !== lw || S.light.height !== lh) S.light = G.makeCanvas(lw, lh);
    var lc = S.light.getContext('2d');
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, lw, lh);
    lc.fillStyle = 'rgba(8,16,44,' + (night * .56) + ')'; lc.fillRect(0, 0, lw, lh);
    lc.globalCompositeOperation = 'destination-out';
    var z = S.cam.zoom * sc;
    lc.setTransform(z, 0, 0, z, (G.W / 2 - S.cam.x * S.cam.zoom) * sc, (G.H / 2 - S.cam.y * S.cam.zoom) * sc);
    var lights = [{ x: S.p.x, y: S.p.y - 20, r: 210, a: .8 }];
    props.forEach(function (p) {
      if (!p.light || p.x < v.l - 200 || p.x > v.r + 200 || p.y < v.t - 200 || p.y > v.b + 200) return;
      lights.push({ x: p.x, y: p.y - (p.kind === 'lamp' ? 58 : 30), r: p.light.r * (1 + Math.sin(S.t * 9 + p.x) * .02), a: 1 });
    });
    [[372, 470], [496, 470], [372, 410], [496, 410]].forEach(function (w) { lights.push({ x: w[0], y: w[1], r: 90, a: .8 }); });
    lights.push({ x: PAV.x, y: PAV.y - 50, r: 170, a: .8 });
    lights.forEach(function (L) {
      var g = lc.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      g.addColorStop(0, 'rgba(0,0,0,' + L.a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g; lc.beginPath(); lc.arc(L.x, L.y, L.r, 0, TAU); lc.fill();
    });
    ctx.drawImage(S.light, 0, 0, G.W, G.H);
    /* warmes Leuchten */
    S.cam.apply(ctx);
    ctx.globalCompositeOperation = 'lighter';
    lights.forEach(function (L, i) {
      if (i === 0) return;
      var g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * .55);
      g.addColorStop(0, 'rgba(255,190,100,' + (.32 * night) + ')'); g.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x, L.y, L.r * .55, 0, TAU); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ================= Szene ================= */
  G.scenes.hub = {
    enter: function (o) {
      S.attract = !!o.attract;
      var z = null; ZONES.forEach(function (zz) { if (zz.id === o.returnTo) z = zz; });
      if (z) { S.p.x = z.ret.x; S.p.y = z.ret.y; }
      else if (!o.keep) { S.p.x = 470; S.p.y = 740; }
      S.p.vx = S.p.vy = 0;
      S.d.x = S.p.x + 34; S.d.y = S.p.y + 10; S.d.vx = S.d.vy = 0; S.d.z = 0; S.d.carry = null; S.stick = null; S.leashOn = true;
      if (collides(S.d.x, S.d.y, 11)) { S.d.x = S.p.x - 34; }
      setDog('wander'); pickWander();
      S.cam.x = S.p.x; S.cam.y = S.p.y; S.cam.zoom = S.cam.baseZoom(345);
      resetRope();
      dayInfo = G.dayInfo(); dayTick = 0;
      G.setJoystick(!S.attract);
      G.hud({ stats: !S.attract, quests: !S.attract });
      document.getElementById('hud').hidden = S.attract;
      if (S.attract) G.setActions([]);
      else G.setActions([
        { id: 'call', icon: '📣', label: 'Rufen', size: 'sm', keys: ['q'], onDown: callDog },
        { id: 'pet', icon: '✋', label: 'Streicheln', size: 'sm', keys: ['f'], onDown: petDog },
        { id: 'primary', icon: '🥢', label: 'Werfen', size: 'lg', keys: [' ', 'e', 'Enter'], onDown: primary }
      ]);
      G.refreshStats();
      if (!S.attract && !G.data.tut) {
        G.data.tut = true; G.persist();
        var tips = ['👆 Links auf den Bildschirm tippen und ziehen – so läufst du', '🥢 Wirf Stöckchen – ' + G.data.name + ' bringt sie zurück', '✨ Glitzernde Stellen: dort buddelt ' + G.data.name + ' Knochen aus', '🪧 Folge den Schildern: Teich, Höhle, Tempel & Straße', '📜 Tagesaufgaben bringen Knochen für die Garderobe'];
        tips.forEach(function (tip, i) { setTimeout(function () { if (G.scene === G.scenes.hub) G.toast(tip, 3400); }, 4200 + i * 3800); });
      }
      if (o.returnTo === 'house' && G.data.stats.energy > 30) setTimeout(function () { if (G.scene === G.scenes.hub) G.sfx('bark'); }, 700);
    },
    exit: function () { document.getElementById('hud').hidden = false; },
    update: update,
    idle: function (dt) { S.t += dt; S.fx.update(dt); },
    draw: draw,
    resize: function () { },
    onEscape: function () { G.openMenu(); },
    state: S
  };
})();
