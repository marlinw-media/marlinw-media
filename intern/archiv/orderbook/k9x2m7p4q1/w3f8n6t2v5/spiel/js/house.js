/* Pets — Zuhause: füttern, tränken, bürsten, Ball spielen, schlafen, Garderobe */
(function () {
  'use strict';
  var G = window.G, A = G.art, TAU = Math.PI * 2;
  var S = {
    fx: new G.Particles(), t: 0,
    d: { x: 0, vx: 0, face: 1, walk: 0, move: 0, state: 'idle', st: 0, tx: 0, z: 0, vz: 0, happyT: 0, lift: null },
    ball: null, bowls: { food: 0, water: 0 }, brushT: 0, brushAcc: 0, drag: null, ui: false
  };
  var L = {}; /* Raum-Layout in Bildschirm-Koordinaten */
  function layout() {
    var W = G.W, H = G.H;
    L.W = W; L.H = H;
    L.floor = H * .6;
    L.s = G.clamp(Math.min(H / 175, W / 300), 1.6, 3.8);
    L.basket = { x: W * .82, y: L.floor + (H - L.floor) * .42, w: 54 * L.s * .9, h: 26 * L.s * .9 };
    L.couch = { x: W * .2, y: L.floor + 4, w: Math.min(W * .26, 90 * L.s), h: 40 * L.s * .9 };
    L.food = { x: W * .4, y: L.floor + (H - L.floor) * .2 };
    L.water = { x: W * .6, y: L.floor + (H - L.floor) * .2 };
    L.dogY = L.floor + (H - L.floor) * .52;
    L.minX = W * .12; L.maxX = W * .88;
  }
  function dogBox() { var s = L.s, d = S.d; return { l: d.x - 26 * s, r: d.x + 30 * s, t: L.dogY - d.z - 46 * s, b: L.dogY - d.z + 4 }; }
  function overDog(x, y, pad) { var b = dogBox(); pad = pad || 0; return x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad; }
  function setState(s) { S.d.state = s; S.d.st = 0; }
  function hearts(n) { S.fx.emit({ x: S.d.x + S.d.face * 14 * L.s, y: L.dogY - 50 * L.s, type: 'text', text: '❤️', size: 22, life: 1.2, vy: -70, speed: 40, angle: -Math.PI / 2, spread: 1.4 }, n || 4); }

  /* ================= Interaktionen ================= */
  function pet() {
    if (G.data.resting) { wake(); return; }
    setState('sit'); S.d.happyT = 2.2;
    hearts(5); G.sfx('pet'); G.buzz(15);
    G.stat('love', 6); G.quest('pet');
    if (Math.random() < .4) setTimeout(function () { G.sfx('bark'); }, 250);
  }
  function wake() { G.data.resting = false; G.persist(); setState('idle'); S.d.z = 0; G.sfx('yip'); G.music('house'); G.toast(G.data.name + ' ist wach! ☀️'); }
  function sleep() {
    G.data.resting = true; G.persist(); setState('sleep'); S.d.x = L.basket.x; S.d.face = -1;
    G.sfx('drop'); G.quest('sleep'); G.music('night');
    G.toast(G.data.name + ' macht ein Nickerchen 💤 – tippen zum Wecken');
  }
  function fillBowl(kind) {
    S.bowls[kind] = 1;
    G.sfx(kind === 'food' ? 'grab' : 'splash', .7);
    var b = kind === 'food' ? L.food : L.water;
    S.fx.emit({ x: b.x, y: b.y - 10, type: 'star', color: kind === 'food' ? '#ffb35c' : '#9ad0ff', size: 5, life: .6, speed: 80, vr: 8 }, 8);
    if (G.data.resting) wake();
    setState(kind === 'food' ? 'toFood' : 'toWater');
  }
  function throwBall(x, y, vx, vy) {
    if (G.data.resting) wake();
    S.ball = { x: x, y: y, vx: G.clamp(vx, -1400, 1400), vy: G.clamp(vy, -1400, 600), z: 0, r: 7 * L.s * .55, spin: 0, rest: 0 };
    G.sfx('throw'); G.quest('ball'); setState('chase');
  }

  /* ---- Ziehen aus der Ablage ---- */
  document.querySelectorAll('#tray .item').forEach(function (it) {
    it.addEventListener('pointerdown', function (e) {
      e.preventDefault(); if (G.modalOpen) return;
      try { it.setPointerCapture(e.pointerId); } catch (er) {}
      var ghost = it.cloneNode(true); ghost.classList.add('drag-ghost'); ghost.querySelector('small') && ghost.querySelector('small').remove();
      document.body.appendChild(ghost);
      S.drag = { kind: it.dataset.item, ghost: ghost, x: e.clientX, y: e.clientY, hist: [], moved: 0, id: e.pointerId };
      ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
      G.sfx('click');
    });
    it.addEventListener('pointermove', function (e) {
      var d = S.drag; if (!d || d.id !== e.pointerId) return;
      d.moved += Math.hypot(e.clientX - d.x, e.clientY - d.y);
      d.x = e.clientX; d.y = e.clientY; d.hist.push({ x: d.x, y: d.y, t: performance.now() }); if (d.hist.length > 6) d.hist.shift();
      d.ghost.style.left = d.x + 'px'; d.ghost.style.top = d.y + 'px';
      if (d.kind === 'brush' && overDog(d.x, d.y, 10)) brushTick(e.movementX || 4);
    });
    var end = function (e) {
      var d = S.drag; if (!d || d.id !== e.pointerId) return;
      S.drag = null; d.ghost.remove();
      var hitDog = overDog(d.x, d.y, 24);
      if (d.kind === 'snack') { if (d.moved < 8 || hitDog || d.y < L.H - 60) fillBowl('food'); }
      else if (d.kind === 'water') { if (d.moved < 8 || hitDog || d.y < L.H - 60) fillBowl('water'); }
      else if (d.kind === 'brush') { if (d.moved < 8) G.toast('Zieh die Bürste über ' + G.data.name + ' 🪮'); }
      else if (d.kind === 'ball') {
        var h = d.hist, vx = 0, vy = -500;
        if (h.length > 1) { var a = h[0], b = h[h.length - 1], dt = Math.max(16, b.t - a.t) / 1000; vx = (b.x - a.x) / dt; vy = (b.y - a.y) / dt; }
        if (d.moved < 8) { vx = (S.d.x > L.W / 2 ? -1 : 1) * 500; vy = -500; }
        throwBall(d.x, Math.min(d.y, L.H - 30), vx * .9, vy * .9);
      }
    };
    it.addEventListener('pointerup', end); it.addEventListener('pointercancel', end);
  });
  function brushTick(dx) {
    if (G.data.resting) return;
    S.brushAcc += Math.abs(dx) + 2;
    if (S.brushAcc > 28) {
      S.brushAcc = 0;
      var data = G.data;
      data.stats.fur = Math.min(100, data.stats.fur + 2.5);
      data.dirt = Math.max(0, (data.dirt || 0) - .06);
      S.brushT += 1;
      G.sfx('brush', .8);
      S.fx.emit({ x: S.drag ? S.drag.x : S.d.x, y: S.drag ? S.drag.y : L.dogY - 30, type: 'star', color: ['#fff3b0', '#ffffff', '#ffd166'], size: 4, life: .6, speed: 90, vr: 10, add: true }, 3);
      if ((data.dirt || 0) > .05) S.fx.emit({ x: S.d.x, y: L.dogY - 20 * L.s, color: '#7a5a34', size: 2.2, life: .6, speed: 80, gravity: 300 }, 2);
      if (S.d.state !== 'brushed') setState('brushed');
      S.d.st = 0; S.d.happyT = 1.2;
      if (S.brushT % 12 === 0) { G.quest('brush'); hearts(2); }
      if (data.wasMuddy && (data.dirt || 0) <= 0.02) { data.wasMuddy = false; G.quest('mud'); G.toast(G.data.name + ' ist wieder blitzsauber! ✨'); G.sfx('happy'); }
      G.refreshStats(); G.persist();
    }
  }

  /* ---- Hund antippen / hochheben ---- */
  var cv = document.getElementById('game');
  var dogPtr = null;
  cv.addEventListener('pointerdown', function (e) {
    if (G.scene !== G.scenes.house || G.modalOpen || G.transition) return;
    if (overDog(e.clientX, e.clientY, 14)) { dogPtr = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lift: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} }
    else if (G.dist(e.clientX, e.clientY, L.basket.x, L.basket.y) < L.basket.w * .6) { if (!G.data.resting) { S.d.tx = L.basket.x; setState('toBed'); } }
  });
  cv.addEventListener('pointermove', function (e) {
    if (!dogPtr || dogPtr.id !== e.pointerId) return;
    if (!dogPtr.lift && G.dist(e.clientX, e.clientY, dogPtr.sx, dogPtr.sy) > 14) { dogPtr.lift = true; if (G.data.resting) G.data.resting = false; setState('lifted'); G.sfx('yip'); }
    if (dogPtr.lift) { S.d.x = G.clamp(e.clientX, 30, L.W - 30); S.d.z = G.clamp(L.dogY - e.clientY + 20 * L.s, 0, L.H); }
  });
  function dogUp(e) {
    if (!dogPtr || dogPtr.id !== e.pointerId) return;
    var p = dogPtr; dogPtr = null;
    if (!p.lift) { pet(); return; }
    if (G.dist(S.d.x, L.dogY - S.d.z, L.basket.x, L.basket.y - 10) < L.basket.w * .8) { S.d.z = 0; sleep(); return; }
    if (Math.abs(S.d.x - L.couch.x) < L.couch.w * .5 && S.d.z > 10 * L.s) { S.d.z = 0; G.sfx('drop'); setState('couch'); S.d.happyT = 2; hearts(3); return; }
    setState('fall'); S.d.vz = 0;
  }
  cv.addEventListener('pointerup', dogUp); cv.addEventListener('pointercancel', dogUp);

  /* ================= Update ================= */
  function walkTo(tx, sp, dt) {
    var d = S.d, dx = tx - d.x, dd = Math.abs(dx);
    var target = dd > 4 ? Math.sign(dx) * Math.min(sp, dd * 4) : 0;
    d.vx = G.damp(d.vx, target, 8, dt);
    d.x += d.vx * dt;
    return dd;
  }
  function update(dt) {
    S.t += dt;
    var d = S.d, data = G.data, s = L.s;
    d.st += dt; d.happyT = Math.max(0, d.happyT - dt);
    switch (d.state) {
      case 'idle':
        if (d.st > 2 + Math.random() * 3 || Math.abs(d.tx - d.x) < 6) { d.tx = G.rand(L.minX + 40, L.maxX - 60); d.st = 0; }
        walkTo(d.tx, data.stats.energy < 20 ? 40 : 90, dt);
        if (data.stats.energy < 15 && d.st > 1 && Math.random() < dt * .2) { d.tx = L.basket.x; setState('toBed'); }
        break;
      case 'sit': walkTo(d.x, 0, dt); if (d.st > 2.2) setState('idle'); break;
      case 'brushed': walkTo(d.x, 0, dt); if (d.st > 1.2) setState('idle'); break;
      case 'couch': walkTo(d.x, 0, dt); if (d.st > 6) setState('fall'); break;
      case 'toFood':
        if (walkTo(L.food.x - 30 * s * (d.x < L.food.x ? 1 : -1), 160, dt) < 6) { setState('eat'); d.face = d.x < L.food.x ? 1 : -1; }
        break;
      case 'eat':
        walkTo(d.x, 0, dt);
        if (Math.random() < dt * 4) G.sfx('eat', .6);
        if (Math.random() < dt * 10) S.fx.emit({ x: L.food.x, y: L.food.y - 10, color: '#b9763a', size: 2, life: .5, speed: 60, gravity: 400 }, 1);
        S.bowls.food = Math.max(0, S.bowls.food - dt / 3);
        if (S.bowls.food <= 0) { G.stat('hunger', 38); G.quest('feed'); hearts(3); G.sfx('happy'); setState('sit'); d.happyT = 2; }
        break;
      case 'toWater':
        if (walkTo(L.water.x - 30 * s * (d.x < L.water.x ? 1 : -1), 160, dt) < 6) { setState('drink'); d.face = d.x < L.water.x ? 1 : -1; }
        break;
      case 'drink':
        walkTo(d.x, 0, dt);
        if (Math.random() < dt * 3) G.sfx('drink', .5);
        if (Math.random() < dt * 8) S.fx.emit({ x: L.water.x, y: L.water.y - 12, color: 'rgba(150,215,255,.9)', size: 2, life: .5, speed: 70, gravity: 400 }, 1);
        S.bowls.water = Math.max(0, S.bowls.water - dt / 2.6);
        if (S.bowls.water <= 0) { G.stat('water', 38); hearts(2); setState('sit'); d.happyT = 1.5; }
        break;
      case 'toBed':
        if (walkTo(L.basket.x, 110, dt) < 6) sleep();
        break;
      case 'sleep':
        d.x = G.damp(d.x, L.basket.x, 6, dt); d.vx = 0;
        if (Math.random() < dt * .7) S.fx.emit({ x: d.x - 20 * s, y: L.dogY - 30 * s, type: 'text', text: 'z', size: 14 + Math.random() * 8, life: 2, vx: -12, vy: -26, color: '#fff' }, 1);
        if (Math.random() < dt * .25) G.sfx('snore', .7);
        break;
      case 'chase':
        var b = S.ball;
        if (!b) { setState('idle'); break; }
        if (walkTo(b.x, 280, dt) < 18 * s && b.z < 12) {
          S.ball = null; d.carry = 'ball'; setState('bring'); G.sfx('squeak');
        }
        break;
      case 'bring':
        if (walkTo(L.W * .5, 200, dt) < 10) { d.carry = null; setState('sit'); d.happyT = 2; d.vz = 260; hearts(4); G.sfx('happy'); G.stat('love', 5); G.stat('energy', -3); }
        break;
      case 'lifted': d.vx = 0; break;
      case 'fall':
        d.vz -= 1800 * dt; d.z += d.vz * dt;
        if (d.z <= 0) { d.z = 0; d.vz = 0; G.sfx('land'); setState('idle'); }
        break;
    }
    if (d.state !== 'fall' && d.state !== 'lifted' && d.state !== 'couch' && (d.vz || d.z > 0)) { d.vz -= 1500 * dt; d.z += d.vz * dt; if (d.z <= 0) { d.z = 0; d.vz = 0; } }
    if (d.state === 'couch') d.z = G.damp(d.z, 20 * s, 8, dt);
    d.x = G.clamp(d.x, L.minX, L.maxX);
    if (Math.abs(d.vx) > 6) d.face = d.vx < 0 ? -1 : 1;
    d.move = G.clamp(Math.abs(d.vx) / 110, 0, 1.2);
    d.walk += Math.abs(d.vx) * dt * .085 / s * 1.6;
    /* Ball-Physik */
    var bl = S.ball;
    if (bl) {
      bl.vy += 1700 * dt; bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.spin += bl.vx * dt * .05;
      var floorY = L.dogY - 4;
      if (bl.y > floorY) { bl.y = floorY; if (Math.abs(bl.vy) > 120) G.sfx('squeak', .5); bl.vy *= -.62; bl.vx *= .86; }
      if (bl.x < 20) { bl.x = 20; bl.vx *= -.7; } if (bl.x > L.W - 20) { bl.x = L.W - 20; bl.vx *= -.7; }
      if (bl.y < 40) { bl.y = 40; bl.vy *= -.5; }
      bl.z = Math.max(0, floorY - bl.y);
    }
    S.fx.update(dt);
    G.updateAction && G.ambient({}, dt);
  }

  /* ================= Zeichnen ================= */
  function drawRoom(ctx) {
    var W = L.W, H = L.H, F = L.floor, t = S.t, day = G.dayInfo();
    /* Wand */
    ctx.fillStyle = A.lg(ctx, 0, 0, 0, F, [0, '#f6e3c3', 1, '#ebcf9f']); ctx.fillRect(0, 0, W, F);
    ctx.fillStyle = 'rgba(214,170,110,.25)';
    for (var x = 0; x < W; x += 34) { ctx.fillRect(x, 0, 14, F); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (x = 17; x < W; x += 34) for (var y = 20; y < F; y += 40) { ctx.beginPath(); ctx.arc(x + 7, y + (x % 68 ? 20 : 0), 2, 0, TAU); ctx.fill(); }
    /* Fußleiste */
    ctx.fillStyle = '#a8784a'; ctx.fillRect(0, F - 12, W, 12); ctx.fillStyle = '#c4935f'; ctx.fillRect(0, F - 12, W, 3);
    /* Boden mit Dielen in Perspektive */
    ctx.fillStyle = A.lg(ctx, 0, F, 0, H, [0, '#c9965c', 1, '#a8743f']); ctx.fillRect(0, F, W, H - F);
    ctx.strokeStyle = 'rgba(90,55,25,.3)'; ctx.lineWidth = 1.2;
    for (var i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * .045, F); ctx.lineTo(W / 2 + i * W * .13, H); ctx.stroke(); }
    for (i = 1; i < 6; i++) { var yy = F + (H - F) * Math.pow(i / 6, 1.4); ctx.globalAlpha = .4; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); ctx.globalAlpha = 1; }
    /* Teppich */
    ctx.fillStyle = 'rgba(190,70,90,.85)'; ctx.beginPath(); ctx.ellipse(W * .5, L.dogY + 6, W * .26, (H - F) * .3, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,200,.6)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.ellipse(W * .5, L.dogY + 6, W * .23, (H - F) * .25, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    /* Fenster mit echtem Himmel */
    var wx = W * .5 - Math.min(W * .14, 110), ww = Math.min(W * .28, 220), wy = F * .14, wh = F * .52;
    var n = day.night;
    ctx.fillStyle = A.lg(ctx, 0, wy, 0, wy + wh, n > .5 ? [0, '#0c1640', 1, '#2b3a7a'] : day.dusk > .4 ? [0, '#ff9a6b', 1, '#ffd29a'] : [0, '#7cc8f0', 1, '#c6ecfb']);
    ctx.fillRect(wx, wy, ww, wh);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    if (n > .5) { ctx.fillStyle = '#fff'; for (i = 0; i < 18; i++) { var tw = .5 + Math.sin(t * 2 + i) * .5; ctx.globalAlpha = tw; ctx.fillRect(wx + (i * 53 % ww), wy + (i * 29 % wh), 1.6, 1.6); } ctx.globalAlpha = 1; ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(wx + ww * .75, wy + wh * .3, 14, 0, TAU); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(255,255,255,.9)'; var cx = wx + ((t * 8) % (ww + 120)) - 60; [[0, 0, 16], [16, -6, 14], [30, 2, 12]].forEach(function (c) { ctx.beginPath(); ctx.arc(cx + c[0], wy + wh * .3 + c[1], c[2], 0, TAU); ctx.fill(); }); ctx.fillStyle = '#5fae55'; ctx.beginPath(); ctx.ellipse(wx + ww / 2, wy + wh + 10, ww * .7, 30, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.strokeRect(wx, wy, ww, wh);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    ctx.fillStyle = '#e8d5b0'; ctx.fillRect(wx - 10, wy + wh + 2, ww + 20, 8);
    /* Vorhänge */
    ctx.fillStyle = '#7fb0d9'; [wx - 26, wx + ww + 4].forEach(function (cx2, k) { ctx.beginPath(); ctx.moveTo(cx2, wy - 10); ctx.lineTo(cx2 + 22, wy - 10); ctx.quadraticCurveTo(cx2 + (k ? 6 : 16), wy + wh * .6, cx2 + 22, wy + wh + 20); ctx.lineTo(cx2, wy + wh + 20); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = '#6b4226'; ctx.fillRect(wx - 34, wy - 14, ww + 68, 5);
    /* Bilderrahmen mit Pfote */
    var fx = W * .14, fy = F * .2, fw = Math.min(W * .1, 70), fh = fw * .8;
    ctx.fillStyle = '#a9744a'; ctx.fillRect(fx - 5, fy - 5, fw + 10, fh + 10); ctx.fillStyle = '#fff8ea'; ctx.fillRect(fx, fy, fw, fh);
    ctx.fillStyle = '#e2a258'; ctx.beginPath(); ctx.ellipse(fx + fw / 2, fy + fh * .62, fw * .17, fh * .15, 0, 0, TAU); ctx.fill();
    [[-.22, .3], [-.08, .2], [.08, .2], [.22, .3]].forEach(function (o) { ctx.beginPath(); ctx.arc(fx + fw / 2 + o[0] * fw, fy + o[1] * fh + fh * .15, fw * .06, 0, TAU); ctx.fill(); });
    /* Regal mit Pflanze */
    var sx = W * .8, sy = F * .32;
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(sx - 60, sy, 120, 8);
    ctx.fillStyle = '#d96a4f'; ctx.fillRect(sx - 44, sy - 22, 22, 22);
    ctx.fillStyle = '#4f9a45'; for (i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(sx - 33 + Math.cos(i * 1.3) * 10, sy - 30 - Math.sin(i * 1.3 + .4) * 8, 9, 4, i * .7, 0, TAU); ctx.fill(); }
    ['#3a6fd8', '#e0343f', '#f2c33d', '#34a37a'].forEach(function (c, k) { ctx.fillStyle = c; ctx.fillRect(sx + 4 + k * 11, sy - 26 + (k % 2) * 4, 9, 26 - (k % 2) * 4); });
    /* Sofa */
    var c = L.couch, cw = c.w, ch = c.h;
    ctx.save(); ctx.translate(c.x, c.y);
    A.shadow(ctx, 0, ch * .55, cw * .55, 10, .25);
    ctx.fillStyle = '#7a2f3c'; G.roundRect(ctx, -cw / 2, -ch * .9, cw, ch * .7, 16); ctx.fill();
    ctx.fillStyle = A.lg(ctx, 0, -ch, 0, ch * .5, [0, '#e07a91', 1, '#b84a62']); ctx.beginPath(); G.roundRect(ctx, -cw / 2 + 6, -ch * .85, cw - 12, ch * .6, 14); ctx.fill();
    ctx.fillStyle = '#c0596b'; ctx.beginPath(); G.roundRect(ctx, -cw / 2, -ch * .3, cw, ch * .6, 12); ctx.fill();
    ctx.fillStyle = '#d97088'; ctx.beginPath(); G.roundRect(ctx, -cw / 2 - 8, -ch * .55, 22, ch * .85, 10); ctx.fill(); ctx.beginPath(); G.roundRect(ctx, cw / 2 - 14, -ch * .55, 22, ch * .85, 10); ctx.fill();
    ctx.fillStyle = '#5e3a22'; ctx.fillRect(-cw / 2 + 6, ch * .28, 8, 10); ctx.fillRect(cw / 2 - 14, ch * .28, 8, 10);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); G.roundRect(ctx, -cw * .3, -ch * .62, cw * .22, ch * .32, 8); ctx.fill();
    ctx.restore();
    /* Körbchen */
    var b = L.basket;
    ctx.save(); ctx.translate(b.x, b.y);
    A.shadow(ctx, 0, b.h * .5, b.w * .6, 9, .25);
    ctx.fillStyle = A.lg(ctx, 0, -b.h, 0, b.h * .6, [0, '#d9a066', 1, '#9a6a3c']);
    ctx.beginPath(); ctx.ellipse(0, 0, b.w * .55, b.h * .7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(90,55,25,.4)'; ctx.lineWidth = 2;
    for (i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * b.w * .11, -b.h * .5); ctx.lineTo(i * b.w * .12, b.h * .6); ctx.stroke(); }
    ctx.fillStyle = '#f4e3c8'; ctx.beginPath(); ctx.ellipse(0, -b.h * .12, b.w * .44, b.h * .4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(122,180,220,.6)'; ctx.beginPath(); ctx.ellipse(-b.w * .1, -b.h * .15, b.w * .2, b.h * .2, .3, 0, TAU); ctx.fill();
    ctx.restore();
    if (!G.data.resting && S.d.state !== 'toBed') { A.prompt(ctx, b.x, b.y - b.h - 8, '💤 Körbchen', t, false); }
    /* Näpfe */
    [[L.food, '#e0343f', 'food', '#b9763a'], [L.water, '#2f6fe0', 'water', '#7cc8f0']].forEach(function (bw) {
      var p = bw[0], s = L.s * .8;
      A.shadow(ctx, p.x, p.y + 4, 22 * s, 6 * s, .25);
      ctx.fillStyle = bw[1]; ctx.beginPath(); ctx.moveTo(p.x - 20 * s, p.y - 9 * s); ctx.lineTo(p.x + 20 * s, p.y - 9 * s); ctx.lineTo(p.x + 15 * s, p.y + 2); ctx.lineTo(p.x - 15 * s, p.y + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(p.x - 17 * s, p.y - 7 * s, 34 * s, 2 * s);
      var lvl = S.bowls[bw[2]];
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 9 * s, 20 * s, 4.5 * s, 0, 0, TAU); ctx.fill();
      if (lvl > 0) {
        ctx.fillStyle = bw[3];
        ctx.beginPath(); ctx.ellipse(p.x, p.y - 9 * s - lvl * 2 * s, 18 * s, 3.8 * s, 0, 0, TAU); ctx.fill();
        if (bw[2] === 'food') { ctx.fillStyle = '#8a5428'; for (var k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(p.x - 12 * s + k * 4 * s, p.y - 10 * s - lvl * 3 * s + (k % 2) * 2, 2.2 * s, 0, TAU); ctx.fill(); } }
        else { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(p.x - 8 * s + Math.sin(t * 3) * 3, p.y - 10 * s - lvl * 2 * s, 8 * s, 1.5); }
      }
    });
  }
  function draw(ctx) {
    G.screen(ctx);
    drawRoom(ctx);
    var d = S.d, s = L.s, data = G.data;
    var sleeping = d.state === 'sleep';
    var pose = sleeping ? 'sleep' : (d.state === 'sit' || d.state === 'brushed' || d.state === 'couch') ? 'sit' : (d.state === 'eat' || d.state === 'drink') ? 'dig' : 'stand';
    var y = (sleeping ? L.basket.y + 4 : L.dogY) - d.z;
    if (d.z > 0 && !sleeping) A.shadow(ctx, d.x, L.dogY, 20 * s * Math.max(.4, 1 - d.z / 300), 5 * s, .2);
    if (d.state === 'lifted') { ctx.save(); ctx.translate(d.x, y - 20 * s); ctx.rotate(Math.sin(S.t * 8) * .08); ctx.translate(-d.x, -(y - 20 * s)); }
    A.dog(ctx, {
      x: d.x, y: y, face: d.face, walk: d.state === 'lifted' ? S.t * 14 : d.walk, move: d.state === 'lifted' ? 1 : (pose === 'dig' ? .15 : d.move), t: S.t, pose: pose, scale: s,
      wag: d.happyT > 0 ? 1 : .3 + data.stats.love / 200, dirt: data.dirt || 0, carry: d.carry,
      blink: (Math.sin(S.t * 1.7) + Math.sin(S.t * 2.9)) / 2, tilt: d.state === 'idle' ? Math.sin(S.t * .8) * .08 : 0,
      pant: d.move > .7 ? 1 : 0, happy: d.happyT > 0, sad: G.mood().key === 'sad', acc: data.wear
    });
    if (d.state === 'lifted') ctx.restore();
    /* Ball */
    var b = S.ball;
    if (b) {
      A.shadow(ctx, b.x, L.dogY, b.r * Math.max(.4, 1 - b.z / 200), b.r * .35, .25);
      ctx.save(); ctx.translate(b.x, b.y - b.r); ctx.rotate(b.spin);
      ctx.fillStyle = A.rg(ctx, -b.r * .3, -b.r * .3, 1, b.r, [0, '#f2ff8a', 1, '#b7d62f']); ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-b.r * .9, 0, b.r * .8, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(b.r * .9, 0, b.r * .8, Math.PI - 1, Math.PI + 1); ctx.stroke();
      ctx.restore();
    }
    S.fx.draw(ctx);
    /* Abendstimmung im Zimmer */
    var day = G.dayInfo();
    if (day.night > .3) {
      ctx.fillStyle = 'rgba(20,20,60,' + (day.night * .28) + ')'; ctx.fillRect(0, 0, L.W, L.H);
      var g = ctx.createRadialGradient(L.W * .5, L.floor * .2, 10, L.W * .5, L.floor * .2, L.W * .6);
      g.addColorStop(0, 'rgba(255,200,120,' + day.night * .22 + ')'); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H); ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ================= Garderobe ================= */
  G.openWardrobe = function () {
    var render = function () {
      var w = G.data.wear;
      return '<h2>🎀 Garderobe</h2><p class="sub">Du hast <b style="color:#ffd166">' + G.data.bones + ' 🦴</b> – verdiene mehr mit Aufgaben, Buddeln und Minispielen.</p><div class="wardrobe">' +
        G.COSMETICS.map(function (c) {
          var owned = G.data.owned.indexOf(c.id) >= 0, on = w[c.slot] === c.id;
          return '<button class="ward ' + (on ? 'on' : '') + '" data-id="' + c.id + '"><canvas data-prev="' + c.id + '"></canvas>' + c.name + '<br>' +
            (owned ? (on ? '<span style="color:#6ee7a8">✓ trägt</span>' : '<span>anziehen</span>') : '<span class="price">' + c.price + ' 🦴</span>') + '</button>';
        }).join('') + '</div><div class="row"><button class="btn gold" data-close>Fertig</button></div>';
    };
    var bind = function (card) {
      card.querySelectorAll('canvas[data-prev]').forEach(function (cv2) {
        var c = G.COSMETICS.filter(function (x) { return x.id === cv2.dataset.prev; })[0], acc = { collar: G.data.wear.collar, hat: null, face: null };
        acc[c.slot] = c.id; A.dogPreview(cv2, acc);
      });
      card.querySelectorAll('.ward').forEach(function (btn) {
        btn.onclick = function () {
          var c = G.COSMETICS.filter(function (x) { return x.id === btn.dataset.id; })[0], data = G.data;
          if (data.owned.indexOf(c.id) < 0) {
            if (data.bones < c.price) { G.sfx('error'); G.toast('Dir fehlen noch ' + (c.price - data.bones) + ' 🦴'); return; }
            G.addBones(-c.price); data.owned.push(c.id); G.sfx('buy'); G.buzz(25);
            S.fx.emit({ x: S.d.x, y: L.dogY - 50 * L.s, type: 'star', color: ['#ffd166', '#fff', '#ff8fb8'], size: 6, life: 1, speed: 160, vr: 10, add: true }, 16);
          } else G.sfx('click');
          if (data.wear[c.slot] === c.id && c.slot !== 'collar') data.wear[c.slot] = null; else data.wear[c.slot] = c.id;
          G.persist(); card.innerHTML = render(); bind(card);
        };
      });
      card.querySelector('[data-close]').onclick = function () { G.sfx('click'); G.closeModal(); };
    };
    G.openModal(render(), { bind: bind });
  };
  document.getElementById('btn-wardrobe').addEventListener('click', function () { G.sfx('click'); G.openWardrobe(); });

  /* ================= Szene ================= */
  G.scenes.house = {
    enter: function () {
      layout();
      var d = S.d;
      d.x = L.W * .5; d.vx = 0; d.z = 0; d.tx = d.x; d.carry = null; d.face = 1;
      S.ball = null; S.bowls = { food: 0, water: 0 };
      if (G.data.resting) { setState('sleep'); d.x = L.basket.x; } else { setState('sit'); d.happyT = 2; setTimeout(function () { G.sfx('bark'); }, 500); }
      document.getElementById('house-ui').hidden = false;
      G.setJoystick(false); G.setActions([]);
      G.hud({ exit: true, quests: true });
      G.music(G.data.resting ? 'night' : 'house');
      G.refreshStats();
      var m = G.mood();
      setTimeout(function () { if (G.scene === G.scenes.house) G.toast(m.key === 'sad' ? G.data.name + ' ' + m.text + ' Füll den Napf! 🍖' : 'Zieh Futter, Wasser, Bürste oder Ball auf ' + G.data.name, 2600); }, 700);
    },
    exit: function () { document.getElementById('house-ui').hidden = true; },
    update: update,
    idle: function (dt) { S.t += dt; S.fx.update(dt); },
    draw: draw,
    resize: layout,
    onEscape: function () { leave(); }
  };
  function leave() { if (G.scene === G.scenes.house) G.go('hub', { returnTo: 'house' }); }
  G.leaveHouse = leave;
})();
