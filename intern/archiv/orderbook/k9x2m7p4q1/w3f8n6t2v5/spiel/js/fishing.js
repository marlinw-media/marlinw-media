/* Pets — Angeln auf dem See */
(function () {
  'use strict';
  var G = window.G, A = G.art, TAU = Math.PI * 2;
  var WW = 1500, WH = 1000, GOAL = 6;
  var S = { cam: new G.Camera(), fx: new G.Particles(), wake: new G.Particles(), t: 0 };
  var shore = [];
  (function () { for (var i = 0; i < 26; i++) { var a = i / 26 * TAU, w = 1 + Math.sin(a * 3) * .05 + Math.sin(a * 7 + 1) * .03; shore.push({ x: WW / 2 + Math.cos(a) * (WW / 2 - 50) * w, y: WH / 2 + Math.sin(a) * (WH / 2 - 50) * w }); } })();
  function inWater(x, y, pad) {
    var dx = (x - WW / 2) / (WW / 2 - 50), dy = (y - WH / 2) / (WH / 2 - 50), a = Math.atan2(dy, dx), w = 1 + Math.sin(a * 3) * .05 + Math.sin(a * 7 + 1) * .03;
    return Math.hypot(dx, dy) / w < 1 - (pad || 0) / (WH / 2);
  }
  var pads = [], reeds = [];
  (function () {
    var r = G.rng(9);
    for (var i = 0; i < 26; i++) { var x = 120 + r() * (WW - 240), y = 120 + r() * (WH - 240); if (inWater(x, y, 30) && G.dist(x, y, WW / 2, WH / 2) > 200) pads.push({ x: x, y: y, r: 12 + r() * 10, a: r() * TAU, fl: r() < .35 }); }
    for (i = 0; i < 70; i++) { var a = r() * TAU, p = shore[(a / TAU * 26) | 0]; reeds.push({ x: WW / 2 + (p.x - WW / 2) * (.9 + r() * .06), y: WH / 2 + (p.y - WH / 2) * (.9 + r() * .06), h: 16 + r() * 14, s: r() * 5 }); }
  })();

  function spawnFish(gold) {
    for (var k = 0; k < 40; k++) {
      var x = 100 + Math.random() * (WW - 200), y = 100 + Math.random() * (WH - 200);
      if (!inWater(x, y, 60) || G.dist(x, y, S.b.x, S.b.y) < 220) continue;
      S.fish.push({ x: x, y: y, a: Math.random() * TAU, sp: 40 + Math.random() * 30, t: Math.random() * 9, gold: !!gold, size: gold ? 1.25 : .8 + Math.random() * .5 });
      return;
    }
  }
  function restart() {
    S.b = { x: WW * .3, y: WH * .5, vx: 0, vy: 0, a: 0, row: 0, inv: 0 };
    S.shark = { x: WW * .8, y: WH * .75, a: Math.PI, mode: 'patrol', t: 0, rest: 0 };
    S.fish = []; S.jumps = [];
    for (var i = 0; i < 9; i++) spawnFish(false);
    S.goldTimer = 12 + Math.random() * 8;
    S.caught = 0; S.golds = 0; S.time = 0; S.hits = 0; S.state = 'ready';
    S.cam.x = S.b.x; S.cam.y = S.b.y;
    G.setObjective('🎣 Fang ' + GOAL + ' Fische – Vorsicht vor dem Hai!');
    G.mini.countdown(function () { S.state = 'play'; });
  }
  function catchFish(f) {
    S.fish.splice(S.fish.indexOf(f), 1);
    var pts = f.gold ? 2 : 1;
    S.caught += pts; if (f.gold) S.golds++;
    G.sfx('fish'); G.buzz(20);
    S.jumps.push({ sx: f.x, sy: f.y, x: f.x, y: f.y, t: 0, gold: f.gold, size: f.size });
    S.fx.emit({ x: f.x, y: f.y, type: 'ring', color: 'rgba(255,255,255,.8)', size: 10, grow: 60, life: .6, always: true }, 2);
    S.fx.emit({ x: f.x, y: f.y, color: 'rgba(200,240,255,.9)', size: 2.6, life: .6, speed: 120, z: 2, vz: 160, gravity: 500, always: true }, 12);
    if (f.gold) G.toast('✨ Goldfisch! Zählt doppelt!', 1400);
    setTimeout(function () { if (G.scene === G.scenes.fish && S.state === 'play') spawnFish(false); }, 1500);
    if (S.caught >= GOAL) win();
  }
  function win() {
    S.state = 'done';
    var stars = S.time < 40 ? 3 : S.time < 70 ? 2 : 1;
    if (S.hits === 0 && stars < 3) stars++;
    G.mini.finish('fish', { win: true, time: S.time, stars: stars, bones: 2 + S.golds + (S.hits === 0 ? 1 : 0), sub: 'Ein toller Fang! 🐟', cells: [['Zeit', G.fmtTime(S.time)], ['Goldfische', S.golds], ['Hai-Treffer', S.hits]], again: restart, back: leave });
  }

  function update(dt) {
    S.t += dt;
    var b = S.b;
    if (S.state === 'play') {
      S.time += dt;
      var inp = G.readMove();
      G.approach(b, inp.x * 230, inp.y * 230, inp.mag ? 380 : 160, dt);
      var nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      if (inWater(nx, b.y, 34)) b.x = nx; else b.vx *= -.4;
      if (inWater(b.x, ny, 34)) b.y = ny; else b.vy *= -.4;
      var sp = Math.hypot(b.vx, b.vy);
      if (sp > 20) { var ta = Math.atan2(b.vy, b.vx), da = Math.atan2(Math.sin(ta - b.a), Math.cos(ta - b.a)); b.a += da * Math.min(1, dt * 5); }
      b.row += sp * dt * .05;
      if (sp > 40 && Math.random() < dt * 30) S.wake.emit({ x: b.x - Math.cos(b.a) * 26 + (Math.random() - .5) * 10, y: b.y - Math.sin(b.a) * 26 + (Math.random() - .5) * 10, type: 'ring', color: 'rgba(255,255,255,.5)', size: 4, grow: 26, life: 1.2, always: true }, 1);
      if (sp > 60 && Math.random() < dt * 2) G.sfx('bloop', .3);
      b.inv = Math.max(0, b.inv - dt);
      /* Fische */
      S.fish.forEach(function (f) {
        f.t += dt;
        var fd = G.dist(f.x, f.y, b.x, b.y);
        if (fd < 130) { var away = Math.atan2(f.y - b.y, f.x - b.x), dd = Math.atan2(Math.sin(away - f.a), Math.cos(away - f.a)); f.a += dd * dt * 2.2; f.sp = G.damp(f.sp, 95, 2, dt); }
        else { f.a += Math.sin(f.t * .8) * dt * .9; f.sp = G.damp(f.sp, 45, 1, dt); }
        var fx = f.x + Math.cos(f.a) * f.sp * dt, fy = f.y + Math.sin(f.a) * f.sp * dt;
        if (!inWater(fx, fy, 50)) f.a += Math.PI * .6; else { f.x = fx; f.y = fy; }
      });
      for (var i = S.fish.length - 1; i >= 0; i--) if (G.dist(S.fish[i].x, S.fish[i].y, b.x + Math.cos(b.a) * 14, b.y + Math.sin(b.a) * 14) < 34) catchFish(S.fish[i]);
      S.goldTimer -= dt;
      if (S.goldTimer <= 0) { S.goldTimer = 16 + Math.random() * 10; if (!S.fish.some(function (f) { return f.gold; })) { spawnFish(true); G.toast('✨ Ein Goldfisch ist aufgetaucht!', 1500); } }
      /* Hai */
      var sh = S.shark, sd = G.dist(sh.x, sh.y, b.x, b.y);
      sh.t += dt; sh.rest = Math.max(0, sh.rest - dt);
      var tgt;
      if (sh.rest > 0) { tgt = Math.atan2(sh.y - b.y, sh.x - b.x); sh.mode = 'rest'; }
      else if (sd < 300) { if (sh.mode !== 'chase') G.sfx('shark'); sh.mode = 'chase'; tgt = Math.atan2(b.y - sh.y, b.x - sh.x); }
      else { sh.mode = 'patrol'; tgt = sh.a + Math.sin(sh.t * .5) * .8; }
      var dA = Math.atan2(Math.sin(tgt - sh.a), Math.cos(tgt - sh.a));
      sh.a += G.clamp(dA, -2.4 * dt, 2.4 * dt);
      var ssp = sh.mode === 'chase' ? 150 + S.time * .9 : sh.mode === 'rest' ? 120 : 70;
      var sx = sh.x + Math.cos(sh.a) * ssp * dt, sy = sh.y + Math.sin(sh.a) * ssp * dt;
      if (inWater(sx, sy, 50)) { sh.x = sx; sh.y = sy; } else sh.a += Math.PI * .5;
      if (Math.random() < dt * 8) S.wake.emit({ x: sh.x, y: sh.y, type: 'ring', color: 'rgba(255,255,255,.35)', size: 3, grow: 18, life: .9, always: true }, 1);
      if (sd < 34 && b.inv <= 0) {
        b.inv = 1.6; sh.rest = 2.6; S.hits++;
        var lost = S.caught > 0 ? 1 : 0; S.caught -= lost;
        var ka = Math.atan2(b.y - sh.y, b.x - sh.x); b.vx = Math.cos(ka) * 340; b.vy = Math.sin(ka) * 340;
        G.sfx('crash'); G.buzz(80); S.cam.shake(12, .4);
        S.fx.emit({ x: b.x, y: b.y, color: 'rgba(220,245,255,.95)', size: 3, life: .7, speed: 160, z: 2, vz: 200, gravity: 500, always: true }, 18);
        G.toast(lost ? 'Der Hai hat dir einen Fisch geklaut! 🦈' : 'Uff, der Hai! 🦈', 1500);
      }
      G.setObjective('🐟 ' + S.caught + ' / ' + GOAL + ' · <span class="timer">' + G.fmtTime(S.time) + '</span>' + (S.shark.mode === 'chase' ? ' · <b style="color:#ff8a8a">🦈 Hai!</b>' : ''));
    }
    S.jumps.forEach(function (j) { j.t += dt; var k = Math.min(1, j.t / .7); j.x = G.lerp(j.sx, S.b.x, k); j.y = G.lerp(j.sy, S.b.y, k) - Math.sin(k * Math.PI) * 70; });
    S.jumps = S.jumps.filter(function (j) { return j.t < .7; });
    S.cam.zoom = G.damp(S.cam.zoom, S.cam.baseZoom(360), 3, dt);
    S.cam.follow(b.x + b.vx * .3, b.y + b.vy * .3, dt, WW, WH, 4); S.cam.update(dt);
    S.fx.update(dt); S.wake.update(dt);
    G.ambient({ water: .2 }, dt);
  }

  function drawBoat(ctx, b, t) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
    var bob = Math.sin(t * 2) * .03; ctx.rotate(bob);
    ctx.fillStyle = 'rgba(0,30,50,.25)'; ctx.beginPath(); ctx.ellipse(4, 6, 36, 16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = A.lg(ctx, 0, -16, 0, 16, [0, '#b8875a', 1, '#7a4e2a']);
    ctx.beginPath(); ctx.moveTo(-32, -12); ctx.quadraticCurveTo(10, -18, 36, 0); ctx.quadraticCurveTo(10, 18, -32, 12); ctx.quadraticCurveTo(-36, 0, -32, -12); ctx.fill();
    ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.moveTo(-27, -8); ctx.quadraticCurveTo(8, -13, 29, 0); ctx.quadraticCurveTo(8, 13, -27, 8); ctx.quadraticCurveTo(-30, 0, -27, -8); ctx.fill();
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-10, -10, 5, 20); ctx.fillRect(10, -8, 5, 16);
    /* Ruder */
    var ra = Math.sin(b.row) * .6;
    ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    [[-1], [1]].forEach(function (s) { ctx.save(); ctx.translate(-6, s[0] * 10); ctx.rotate(s[0] * (1.4 + ra)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(28, 0); ctx.stroke(); ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(28, 0, 7, 3.5, 0, 0, TAU); ctx.fill(); ctx.restore(); });
    /* Spielerin (von oben) */
    ctx.fillStyle = '#e85d9a'; ctx.beginPath(); ctx.ellipse(-8, 0, 8, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3319'; ctx.beginPath(); ctx.arc(-9, 0, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3319'; ctx.beginPath(); ctx.ellipse(-17, 0, 4, 2.4, 0, 0, TAU); ctx.fill();
    /* Hund vorne */
    ctx.fillStyle = '#e2a258'; ctx.beginPath(); ctx.ellipse(16, 0, 7, 6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 0, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#94562a'; ctx.beginPath(); ctx.ellipse(23, -5, 2.4, 3.8, .4, 0, TAU); ctx.ellipse(23, 5, 2.4, 3.8, -.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2b1a12'; ctx.beginPath(); ctx.arc(29.5, 0, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawFish(ctx, x, y, a, s, t, gold, shadow) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
    var wig = Math.sin(t * 9) * .25;
    if (shadow) ctx.fillStyle = gold ? 'rgba(255,200,40,.55)' : 'rgba(10,40,60,.38)';
    else ctx.fillStyle = gold ? '#ffcc33' : '#7fb7d9';
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 5.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-20, -6 + wig * 8); ctx.lineTo(-20, 6 + wig * 8); ctx.closePath(); ctx.fill();
    if (!shadow) { ctx.fillStyle = '#1b2b3a'; ctx.beginPath(); ctx.arc(7, -1.5, 1.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function draw(ctx) {
    var cam = S.cam, t = S.t;
    G.screen(ctx); ctx.fillStyle = '#5aa94f'; ctx.fillRect(0, 0, G.W, G.H);
    cam.apply(ctx);
    var v = cam.view(40);
    /* Ufer */
    ctx.fillStyle = '#69b95c'; ctx.fillRect(v.l, v.t, v.r - v.l, v.b - v.t);
    ctx.beginPath(); G.smoothPath(ctx, shore, true);
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#d8c59c'; ctx.lineWidth = 60; ctx.stroke();
    ctx.fillStyle = A.rg(ctx, WW / 2, WH / 2, 50, WW * .6, [0, '#1f6f97', .6, '#2d8bb3', 1, '#5fc0dd']); ctx.fill();
    ctx.save(); ctx.clip();
    /* Lichtspiel (Kaustik) */
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 3;
    for (var i = 0; i < 18; i++) { ctx.beginPath(); for (var x = v.l; x < v.r; x += 30) ctx.lineTo(x, v.t + i * 70 + Math.sin(x * .02 + t * 1.2 + i) * 14 + ((v.t / 70) | 0) * 0); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    for (i = 0; i < 18; i++) { ctx.beginPath(); for (x = v.l; x < v.r; x += 30) ctx.lineTo(x, v.t + 35 + i * 70 + Math.sin(x * .017 - t * 1.5 + i * 2) * 18); ctx.stroke(); }
    S.fish.forEach(function (f) { if (f.x > v.l && f.x < v.r && f.y > v.t && f.y < v.b) drawFish(ctx, f.x, f.y, f.a, f.size, t + f.t, f.gold, true); });
    ctx.restore();
    S.wake.draw(ctx);
    /* Seerosen */
    pads.forEach(function (p) {
      if (p.x < v.l || p.x > v.r || p.y < v.t || p.y > v.b) return;
      var bob = Math.sin(t + p.a) * 1.2;
      ctx.fillStyle = '#4f9a45'; ctx.beginPath(); ctx.arc(p.x, p.y + bob, p.r, p.a + .3, p.a + TAU - .3); ctx.lineTo(p.x, p.y + bob); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.arc(p.x - 3, p.y - 3 + bob, p.r * .4, 0, TAU); ctx.fill();
      if (p.fl) { ctx.fillStyle = '#ffc4d8'; for (var k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(p.x + Math.cos(k) * 4, p.y + bob + Math.sin(k) * 4, 4, 2, k, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(p.x, p.y + bob, 2.2, 0, TAU); ctx.fill(); }
    });
    /* Hai: nur die Flosse ragt heraus */
    var sh = S.shark;
    ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.a);
    ctx.fillStyle = 'rgba(15,40,60,.35)'; ctx.beginPath(); ctx.ellipse(-6, 0, 34, 11, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(sh.x, sh.y);
    ctx.fillStyle = sh.mode === 'chase' ? '#4a5866' : '#5a6876';
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-2, -26, 6, -28); ctx.quadraticCurveTo(4, -12, 10, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(0, -20, 5, -26); ctx.lineTo(3, -10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 1, 14, 4, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    /* Boot */
    if (!(S.b.inv > 0 && Math.floor(t * 12) % 2)) drawBoat(ctx, S.b, t);
    S.jumps.forEach(function (j) { drawFish(ctx, j.x, j.y, Math.sin(j.t * 12) * .8, j.size * 1.2, t, j.gold, false); });
    /* Schilf */
    ctx.lineCap = 'round';
    reeds.forEach(function (r) {
      if (r.x < v.l || r.x > v.r || r.y < v.t || r.y > v.b) return;
      var sw = Math.sin(t * 1.5 + r.s) * 3;
      ctx.strokeStyle = '#5e8f3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.quadraticCurveTo(r.x, r.y - r.h * .6, r.x + sw, r.y - r.h); ctx.stroke();
      ctx.strokeStyle = '#7a4e2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(r.x + sw, r.y - r.h); ctx.lineTo(r.x + sw * 1.1, r.y - r.h - 8); ctx.stroke();
    });
    S.fx.draw(ctx);
  }
  function leave() { G.go('hub', { returnTo: 'fish' }); }
  G.scenes.fish = {
    enter: function () {
      S.cam.zoom = S.cam.baseZoom(360);
      G.setJoystick(true); G.setActions([]);
      G.hud({ exit: true, objective: ' ' });
      G.music('fish');
      restart();
    },
    exit: function () { G.ambient({ water: 0 }, 0); },
    update: update, draw: draw,
    idle: function (dt) { S.t += dt; S.fx.update(dt); S.wake.update(dt); },
    onEscape: leave
  };
})();
