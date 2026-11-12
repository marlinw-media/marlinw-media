/* Pets — Tempellauf (Jump'n'Run, automatischer Lauf) */
(function () {
  'use strict';
  var G = window.G, A = G.art, TAU = Math.PI * 2;
  var LEN = 5200;
  var S = { fx: new G.Particles(), t: 0, camX: 0, camY: 0, shake: 0 };

  function build() {
    var r = G.rng((Math.random() * 1e9) | 0);
    var solids = [], spikes = [], onis = [], bones = [], lanterns = [];
    var x = 0;
    function ground(w, y) { solids.push({ x: x, y: y || 0, w: w, h: 400, ground: true }); x += w; }
    function boneArc(cx, y, n, h) { for (var i = 0; i < n; i++) { var k = i / (n - 1 || 1); bones.push({ x: cx + (k - .5) * (n - 1) * 34, y: y - Math.sin(k * Math.PI) * h, got: false }); } }
    ground(700);
    lanterns.push({ x: 60, lit: true });
    var nextLantern = 1700;
    while (x < LEN - 700) {
      var d = x / LEN, f = r();
      if (x > nextLantern) { lanterns.push({ x: x + 40, lit: false }); nextLantern += 1600; ground(220); continue; }
      if (f < .26) { /* Lücke */
        var gw = 80 + d * 70 + r() * 40;
        boneArc(x + gw / 2, -70, 3, 50);
        x += gw; ground(200 + r() * 140);
      } else if (f < .44) { /* Bambusspitzen */
        ground(90); var sw = 34 + (r() < .4 + d * .4 ? 36 : 0);
        spikes.push({ x: x, w: sw }); boneArc(x + sw / 2, -110, 3, 30); ground(sw + 170 + r() * 100);
      } else if (f < .64) { /* Oni zum Draufspringen */
        ground(110); onis.push({ x: x + 90, bx: x + 90, range: 60 + r() * 40, sp: 1 + r() * .8, alive: true, sq: 0, t: r() * 5 });
        ground(260 + r() * 80);
      } else if (f < .82) { /* Plattform über einer großen Lücke */
        var big = 200 + d * 60;
        solids.push({ x: x + big / 2 - 55, y: -96 - r() * 20, w: 110, h: 22, plat: true });
        boneArc(x + big / 2, -150, 3, 20);
        x += big; ground(220 + r() * 100);
      } else { /* Stufe hoch und runter */
        ground(60);
        solids.push({ x: x, y: -58, w: 170 + r() * 80, h: 460, ground: true }); boneArc(x + 80, -110, 4, 30); x = solids[solids.length - 1].x + solids[solids.length - 1].w;
        ground(220);
      }
    }
    ground(LEN + 400 - x);
    S.solids = solids; S.spikes = spikes; S.onis = onis; S.bones = bones; S.lanterns = lanterns;
    S.goal = LEN - 220; S.totalBones = bones.length;
    S.deco = [];
    for (var k = 0; k < 40; k++) S.deco.push({ x: r() * LEN * .55 + 200, kind: r() < .5 ? 'sakura' : 'bamboo', s: .6 + r() * .4 });
    S.fg = [];
    for (k = 0; k < 9; k++) S.fg.push({ x: r() * LEN * 1.25, h: 160 + r() * 120 });
  }
  function groundTopAt(x) { var best = null; S.solids.forEach(function (s) { if (!s.plat && x >= s.x && x <= s.x + s.w && (best === null || s.y < best)) best = s.y; }); return best === null ? 0 : best; }
  function reset(toX) {
    var x = toX || 80;
    S.d = { x: x, y: groundTopAt(x) - .1, vx: 0, vy: 0, onGround: true, jumps: 0, coyote: 0, buffer: 0, cut: false, walk: 0, inv: 1.2, hurtT: 0 };
  }
  function jumpPress() { if (S.state !== 'play') return; S.d.buffer = .13; }
  function jumpRelease() { var d = S.d; if (d && d.vy < -280 && !d.cut) { d.vy *= .55; d.cut = true; } }

  function hurt(msg) {
    var d = S.d; if (d.inv > 0) return;
    S.lives--; d.inv = 1.5; d.vy = -480; d.hurtT = .4;
    G.sfx('hit'); G.buzz(60); S.shake = .35;
    S.fx.emit({ x: d.x, y: d.y - 20, type: 'star', color: '#fff', size: 5, life: .5, speed: 160, always: true }, 8);
    if (S.lives <= 0) lose(); else G.toast(msg || 'Autsch!', 1100);
  }
  function lose() {
    S.state = 'done';
    G.mini.finish('runner', { win: false, loseTitle: 'Keine Herzen mehr 💔', sub: 'Du warst bei ' + Math.round(S.d.x / LEN * 100) + ' % – gleich nochmal?', cells: [['Strecke', Math.round(S.d.x / LEN * 100) + ' %'], ['Knochen', S.got + ' / ' + S.totalBones]], again: restart, back: leave });
  }
  function win() {
    S.state = 'done';
    var stars = 1 + (S.lives >= 2 ? 1 : 0) + (S.got >= S.totalBones * .7 ? 1 : 0);
    G.mini.finish('runner', { win: true, time: S.time, stars: stars, bones: 2 + Math.floor(S.got / 4) + (S.stomps > 2 ? 1 : 0), sub: 'Durch das Tempeltor! ⛩️', cells: [['Zeit', G.fmtTime(S.time)], ['Knochen', S.got + ' / ' + S.totalBones], ['Herzen übrig', '❤️'.repeat(S.lives)], ['Onis besiegt', S.stomps]], again: restart, back: leave });
    for (var i = 0; i < 40; i++) S.fx.emit({ x: S.goal + G.rand(-60, 60), y: -150, type: 'petal', color: G.pick(['#ffc4d8', '#fff', '#ff8fb8']), size: 4, life: 2.5, vx: G.rand(-80, 80), vy: G.rand(-160, 40), gravity: 120, vr: 8, always: true }, 1);
  }
  function overlap(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }

  function update(dt) {
    S.t += dt;
    var d = S.d;
    if (S.state === 'play') {
      S.time += dt;
      var prog = d.x / LEN, speed = 255 + prog * 70;
      d.vx = G.damp(d.vx, speed, 6, dt);
      d.inv = Math.max(0, d.inv - dt); d.hurtT = Math.max(0, d.hurtT - dt);
      d.coyote = d.onGround ? .1 : Math.max(0, d.coyote - dt);
      d.buffer = Math.max(0, d.buffer - dt);
      if (d.buffer > 0) {
        if (d.onGround || d.coyote > 0) { d.vy = -760; d.onGround = false; d.coyote = 0; d.jumps = 1; d.cut = false; d.buffer = 0; G.sfx('jump'); S.fx.emit({ x: d.x, y: d.y, color: 'rgba(255,255,255,.7)', size: 3, life: .4, speed: 70, angle: Math.PI, spread: 1.2 }, 6); }
        else if (d.jumps < 2) { d.vy = -640; d.jumps = 2; d.cut = false; d.buffer = 0; G.sfx('jump', .8); S.fx.emit({ x: d.x, y: d.y - 10, type: 'ring', color: 'rgba(255,255,255,.8)', size: 16, grow: 40, life: .35, always: true }, 1); }
      }
      d.vy = Math.min(1400, d.vy + 2300 * dt);
      /* horizontal */
      var nx = d.x + d.vx * dt, box;
      S.solids.forEach(function (s) {
        if (s.plat) return;
        box = { l: nx - 15, r: nx + 15, t: d.y - 30, b: d.y - 2 };
        if (overlap(box, { l: s.x, r: s.x + s.w, t: s.y, b: s.y + s.h })) { nx = s.x - 15.01; d.vx = 0; }
      });
      d.x = nx;
      /* vertikal */
      var ny = d.y + d.vy * dt, was = d.onGround; d.onGround = false;
      S.solids.forEach(function (s) {
        if (d.x + 13 < s.x || d.x - 13 > s.x + s.w) return;
        if (d.vy >= 0 && d.y <= s.y + 2 && ny >= s.y) { ny = s.y; d.vy = 0; d.onGround = true; d.jumps = 0; }
        else if (!s.plat && d.vy < 0 && d.y - 30 >= s.y + s.h && ny - 30 < s.y + s.h) { ny = s.y + s.h + 30; d.vy = 0; }
      });
      d.y = ny;
      if (d.onGround && !was) { G.sfx('land', .6); S.fx.emit({ x: d.x, y: d.y, color: 'rgba(230,210,180,.8)', size: 2.4, life: .35, speed: 80, angle: -Math.PI / 2, spread: 2.6 }, 6); }
      /* Gefahren */
      var me = { l: d.x - 13, r: d.x + 13, t: d.y - 28, b: d.y };
      S.spikes.forEach(function (sp) { if (overlap(me, { l: sp.x + 4, r: sp.x + sp.w - 4, t: -16, b: 0 })) hurt('Spitzer Bambus! 🎋'); });
      S.onis.forEach(function (o) {
        if (!o.alive) { o.sq += dt; return; }
        o.t += dt; o.x = o.bx + Math.sin(o.t * o.sp) * o.range;
        var ob = { l: o.x - 15, r: o.x + 15, t: -34, b: 0 };
        if (overlap(me, ob)) {
          if (d.vy > 60 && d.y - 14 < ob.t + 6) {
            o.alive = false; o.sq = 0; d.vy = -560; d.jumps = 1; S.stomps++;
            G.sfx('stomp'); G.buzz(25); S.shake = .15;
            S.fx.emit({ x: o.x, y: -20, type: 'star', color: ['#ff5f6d', '#ffd166', '#fff'], size: 5, life: .6, speed: 200, vr: 10, always: true }, 14);
            S.fx.emit({ x: o.x, y: -60, type: 'text', text: '+1', size: 18, life: .8, vy: -60, always: true }, 1);
          } else hurt('Ein Oni! 👹');
        }
      });
      S.bones.forEach(function (b) {
        if (!b.got && Math.abs(b.x - d.x) < 22 && Math.abs(b.y - (d.y - 16)) < 26) { b.got = true; S.got++; G.sfx('coin', .7); S.fx.emit({ x: b.x, y: b.y, type: 'star', color: '#ffd166', size: 4, life: .5, speed: 100, add: true, always: true }, 6); }
      });
      S.lanterns.forEach(function (l) { if (!l.lit && d.x > l.x) { l.lit = true; S.check = l.x; G.sfx('key', .6); G.toast('🏮 Checkpoint!', 1000); } });
      if (d.y > 420) { d.inv = 0; hurt('Abgestürzt!'); if (S.lives > 0) reset(S.check + 40); }
      if (d.x > S.goal) win();
      G.setObjective('<span class="hearts">' + '❤️'.repeat(Math.max(0, S.lives)) + '<span style="opacity:.25">' + '❤️'.repeat(Math.max(0, 3 - S.lives)) + '</span></span> · 🦴 ' + S.got + ' · ' + Math.min(100, Math.round(d.x / S.goal * 100)) + ' %');
    } else if (S.state === 'done' && d.x > S.goal - 50) { d.vx = G.damp(d.vx, 0, 3, dt); d.x += d.vx * dt; }
    d.walk += Math.abs(d.vx) * dt * .07;
    S.camX = G.damp(S.camX, d.x + G.W * .18 / camZoom(), 8, dt);
    S.camY = G.damp(S.camY, Math.min(0, d.y + 60) * .5, 3, dt);
    S.shake = Math.max(0, S.shake - dt);
    if (Math.random() < dt * 10 * G.fx) S.fx.emit({ x: S.camX + G.W / camZoom() * .6, y: G.rand(-420, 0), type: 'petal', color: G.pick(['#ffc4d8', '#ffe0ea', '#ff9ec0']), size: 3.2, life: 5, vx: G.rand(-110, -50), vy: G.rand(10, 50), vr: 7, always: true }, 1);
    S.fx.update(dt);
  }
  function camZoom() { return G.clamp(G.H / 420, .75, 1.6); }

  /* ---- Hintergrund-Ebenen ---- */
  function drawBg(ctx) {
    var W = G.W, H = G.H, cx = S.camX;
    ctx.fillStyle = A.lg(ctx, 0, 0, 0, H, [0, '#ff8e8a', .45, '#ffc59e', .8, '#ffe8c8', 1, '#fff4dc']); ctx.fillRect(0, 0, W, H);
    var sunX = W * .7 - cx * .01 % W, sunY = H * .32;
    var sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * .4); sg.addColorStop(0, 'rgba(255,250,220,.9)'); sg.addColorStop(.2, 'rgba(255,230,180,.5)'); sg.addColorStop(1, 'rgba(255,200,150,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.arc(sunX, sunY, H * .09, 0, TAU); ctx.fill();
    /* Fuji */
    var base = H * .72, off = -(cx * .06) % 1400;
    for (var k = -1; k < Math.ceil(W / 1400) + 1; k++) {
      var mx = off + k * 1400 + 500;
      ctx.fillStyle = '#c98fae';
      ctx.beginPath(); ctx.moveTo(mx - 520, base); ctx.quadraticCurveTo(mx - 160, base - H * .3, mx - 50, base - H * .42); ctx.lineTo(mx + 50, base - H * .42); ctx.quadraticCurveTo(mx + 160, base - H * .3, mx + 520, base); ctx.fill();
      ctx.fillStyle = '#fff8f4';
      ctx.beginPath(); ctx.moveTo(mx - 50, base - H * .42); ctx.lineTo(mx + 50, base - H * .42); ctx.lineTo(mx + 108, base - H * .3); ctx.lineTo(mx + 70, base - H * .32); ctx.lineTo(mx + 40, base - H * .28); ctx.lineTo(mx, base - H * .32); ctx.lineTo(mx - 40, base - H * .28); ctx.lineTo(mx - 75, base - H * .32); ctx.lineTo(mx - 108, base - H * .3); ctx.closePath(); ctx.fill();
    }
    /* Hügel mit Pagoden */
    off = -(cx * .18) % 900;
    ctx.fillStyle = '#b07a9c';
    for (k = -1; k < Math.ceil(W / 900) + 2; k++) {
      var hx = off + k * 900;
      ctx.beginPath(); ctx.moveTo(hx - 100, H); ctx.quadraticCurveTo(hx + 200, H * .55, hx + 450, H * .66); ctx.quadraticCurveTo(hx + 700, H * .58, hx + 1000, H); ctx.fill();
      var px = hx + 430, py = H * .66;
      for (var f = 0; f < 4; f++) { var w = 46 - f * 8; ctx.fillRect(px - w * .35, py - 14 - f * 18, w * .7, 14); ctx.beginPath(); ctx.moveTo(px - w, py - 12 - f * 18); ctx.quadraticCurveTo(px, py - 22 - f * 18, px + w, py - 12 - f * 18); ctx.lineTo(px + w * .6, py - 8 - f * 18); ctx.lineTo(px - w * .6, py - 8 - f * 18); ctx.fill(); }
      ctx.fillRect(px - 1.5, py - 92, 3, 20);
    }
    ctx.fillStyle = 'rgba(255,220,220,.25)'; ctx.fillRect(0, H * .55, W, H * .45);
  }
  function drawWorld(ctx) {
    var z = camZoom(), sh = S.shake > 0 ? (Math.random() - .5) * 10 * S.shake / .35 : 0;
    var oy = G.H * .76;
    ctx.setTransform(z * G.dpr, 0, 0, z * G.dpr, (G.W * .5 - S.camX * z + sh) * G.dpr, (oy - S.camY * z + sh) * G.dpr);
    var l = S.camX - G.W / z * .6, r = S.camX + G.W / z * .6, t = S.t;
    /* mittlere Ebene: Kirschbäume & Bambus (Parallax) */
    S.deco.forEach(function (dc) {
      var x = dc.x + S.camX * .45;
      if (x < l - 120 || x > r + 120) return;
      ctx.globalAlpha = .75;
      if (dc.kind === 'sakura') G.drawSprite(ctx, A.tree('sakura'), x, 30, Math.sin(t + dc.x) * .02, dc.s * 1.4);
      else { ctx.fillStyle = '#7fae6a'; for (var b = 0; b < 3; b++) { ctx.fillRect(x + b * 14, -230 * dc.s, 6, 260 * dc.s); for (var n = 0; n < 6; n++) ctx.fillRect(x + b * 14 - 1, -230 * dc.s + n * 40 * dc.s, 8, 3); } }
      ctx.globalAlpha = 1;
    });
    /* Laternen-Checkpoints */
    S.lanterns.forEach(function (ln) {
      if (ln.x < l - 60 || ln.x > r + 60) return;
      var gy = groundTopAt(ln.x);
      ctx.fillStyle = '#3a2a20'; ctx.fillRect(ln.x - 2, gy - 90, 4, 90);
      var sw = Math.sin(t * 2 + ln.x) * .08;
      ctx.save(); ctx.translate(ln.x, gy - 88); ctx.rotate(sw);
      ctx.fillStyle = ln.lit ? '#ff4d4d' : '#8a3a3a';
      ctx.beginPath(); ctx.ellipse(0, 18, 13, 17, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-8, 0, 16, 4); ctx.fillRect(-8, 33, 16, 4);
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; for (var q = -1; q <= 1; q++) { ctx.beginPath(); ctx.ellipse(0, 18, 13 * Math.abs(q * .6 + .01), 17, 0, 0, TAU); ctx.stroke(); }
      if (ln.lit) { ctx.globalCompositeOperation = 'lighter'; var g = ctx.createRadialGradient(0, 18, 0, 0, 18, 46); g.addColorStop(0, 'rgba(255,170,90,.6)'); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 18, 46, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.restore();
    });
    /* Tempeltor als Ziel */
    var gy2 = groundTopAt(S.goal);
    ctx.save(); ctx.translate(S.goal, gy2); ctx.scale(1.7, 1.7); G.drawSprite(ctx, A.torii(), 0, 0); ctx.restore();
    /* Boden & Plattformen */
    S.solids.forEach(function (s) {
      if (s.x + s.w < l || s.x > r) return;
      if (s.plat) {
        ctx.fillStyle = '#7a1f1f'; ctx.fillRect(s.x + 8, s.y + s.h, 6, 30); ctx.fillRect(s.x + s.w - 14, s.y + s.h, 6, 30);
        ctx.fillStyle = A.lg(ctx, 0, s.y, 0, s.y + s.h, [0, '#d9a066', 1, '#8a5a3a']); ctx.beginPath(); G.roundRect(ctx, s.x, s.y, s.w, s.h, 6); ctx.fill();
        ctx.fillStyle = '#c0392b'; ctx.fillRect(s.x - 4, s.y - 4, s.w + 8, 6);
        return;
      }
      ctx.fillStyle = A.lg(ctx, 0, s.y, 0, s.y + 160, [0, '#8a5a3a', 1, '#5e3a22']); ctx.fillRect(s.x, s.y, s.w, 500);
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      for (var bx = s.x + 10; bx < s.x + s.w - 10; bx += 46) for (var by = s.y + 26; by < s.y + 200; by += 34) { ctx.beginPath(); G.roundRect(ctx, bx + ((by / 34) % 2) * 20, by, 32, 22, 6); ctx.fill(); }
      ctx.fillStyle = A.lg(ctx, 0, s.y - 6, 0, s.y + 14, [0, '#8fd47f', 1, '#4f9a45']); ctx.fillRect(s.x, s.y - 4, s.w, 16);
      ctx.fillStyle = '#9fe08a';
      for (var gx = s.x + 4; gx < s.x + s.w - 4; gx += 9) { ctx.beginPath(); ctx.moveTo(gx, s.y - 3); ctx.lineTo(gx + 3, s.y - 9 - (gx % 4)); ctx.lineTo(gx + 6, s.y - 3); ctx.fill(); }
    });
    /* Bambusspitzen */
    S.spikes.forEach(function (sp) {
      if (sp.x > r || sp.x + sp.w < l) return;
      for (var x = sp.x + 5; x < sp.x + sp.w - 3; x += 10) {
        ctx.fillStyle = A.lg(ctx, x - 4, 0, x + 4, 0, [0, '#9ccf6a', 1, '#5e9a3a']);
        ctx.beginPath(); ctx.moveTo(x - 4, 0); ctx.lineTo(x - 4, -14); ctx.lineTo(x + 4, -24); ctx.lineTo(x + 4, 0); ctx.fill();
        ctx.fillStyle = '#e8f5c8'; ctx.beginPath(); ctx.moveTo(x - 4, -14); ctx.lineTo(x + 4, -24); ctx.lineTo(x + 4, -20); ctx.fill();
      }
    });
    /* Knochen */
    S.bones.forEach(function (b) { if (!b.got && b.x > l && b.x < r) A.bone(ctx, b.x, b.y + Math.sin(t * 3 + b.x) * 3, 1.2, Math.sin(t * 2 + b.x) * .3); });
    /* Onis */
    S.onis.forEach(function (o) {
      if (o.x < l - 40 || o.x > r + 40) return;
      if (!o.alive) { if (o.sq > .5) return; ctx.globalAlpha = 1 - o.sq * 2; }
      var sq = o.alive ? 1 : .4, bob = o.alive ? Math.abs(Math.sin(o.t * 8)) * 3 : 0, face = Math.cos(o.t * o.sp) > 0 ? 1 : -1;
      ctx.save(); ctx.translate(o.x, 0); ctx.scale(face * (2 - sq), sq);
      A.shadow(ctx, 0, 0, 16, 4, .25);
      ctx.fillStyle = A.rg(ctx, -4, -24, 2, 22, [0, '#ff7a6b', 1, '#c7322b']);
      ctx.beginPath(); ctx.ellipse(0, -17 - bob, 16, 17, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f5e6c8'; [[-7, -32], [7, -32]].forEach(function (h) { ctx.beginPath(); ctx.moveTo(h[0] - 3, h[1] - bob); ctx.lineTo(h[0] + (h[0] > 0 ? 5 : -5), h[1] - 10 - bob); ctx.lineTo(h[0] + 3, h[1] - bob); ctx.fill(); });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, -20 - bob, 4, 0, TAU); ctx.arc(5, -20 - bob, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(-4, -20 - bob, 2, 0, TAU); ctx.arc(6, -20 - bob, 2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, -26 - bob); ctx.lineTo(-2, -24 - bob); ctx.moveTo(9, -26 - bob); ctx.lineTo(2, -24 - bob); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-6, -10 - bob); ctx.lineTo(6, -10 - bob); ctx.lineTo(4, -7 - bob); ctx.lineTo(2, -10 - bob); ctx.lineTo(-2, -10 - bob); ctx.lineTo(-4, -7 - bob); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    });
    /* Hund */
    var d = S.d, blink = d.inv > 0 && Math.floor(S.t * 14) % 2 === 0;
    if (!blink) {
      if (!d.onGround) A.shadow(ctx, d.x, groundTopAt(d.x), 16, 4, .15);
      A.dog(ctx, { x: d.x, y: d.y, face: 1, walk: d.walk, move: d.onGround ? 1 : .15, t: S.t, wag: 1, pant: 1, acc: G.data.wear, dirt: G.data.dirt || 0, scale: 1.1, tilt: d.onGround ? 0 : G.clamp(d.vy / 1600, -.35, .35), earUp: d.onGround ? 0 : 1, happy: true });
    }
    S.fx.draw(ctx);
    /* Vordergrund-Bambus */
    S.fg.forEach(function (f) {
      var x = f.x - S.camX * .25;
      if (x < l - 40 || x > r + 40) return;
      ctx.fillStyle = 'rgba(40,70,35,.28)';
      ctx.fillRect(x, 140 - f.h, 14, f.h + 40);
      for (var n = 0; n < 6; n++) ctx.fillRect(x - 2, 140 - f.h + n * 50, 18, 4);
      ctx.beginPath(); ctx.ellipse(x + 26, 150 - f.h + 20, 26, 6, -.4, 0, TAU); ctx.fill();
    });
  }
  function draw(ctx) {
    G.screen(ctx); drawBg(ctx); drawWorld(ctx);
  }
  function restart() {
    build(); reset(80);
    S.lives = 3; S.got = 0; S.stomps = 0; S.time = 0; S.check = 60; S.state = 'ready';
    S.camX = S.d.x + 200; S.camY = 0;
    G.setObjective('⛩️ Spring über Lücken & Bambus – Onis kannst du plattmachen!');
    G.mini.countdown(function () { S.state = 'play'; });
  }
  function leave() { G.go('hub', { returnTo: 'runner' }); }
  /* Tippen irgendwo im Bild = Springen */
  var cv = document.getElementById('game');
  cv.addEventListener('pointerdown', function () { if (G.scene === G.scenes.runner && !G.modalOpen) { jumpPress(); S.ptr = true; } });
  cv.addEventListener('pointerup', function () { if (S.ptr) { S.ptr = false; jumpRelease(); } });
  G.scenes.runner = {
    enter: function () {
      G.setJoystick(false);
      G.setActions([{ id: 'jump', icon: '⬆️', label: 'Springen', size: 'lg', keys: [' ', 'ArrowUp', 'w'], onDown: jumpPress, onUp: jumpRelease }]);
      G.hud({ exit: true, objective: ' ' });
      G.music('runner'); G.ambient({}, 0);
      restart();
    },
    exit: function () { },
    update: update, draw: draw,
    idle: function (dt) { S.t += dt; S.fx.update(dt); },
    onEscape: leave
  };
})();
