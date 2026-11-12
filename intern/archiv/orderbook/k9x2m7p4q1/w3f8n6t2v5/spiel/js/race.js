/* Pets — Straßenrennen (Draufsicht) */
(function () {
  'use strict';
  var G = window.G, A = G.art, TAU = Math.PI * 2;
  var RW = 300, LANE = RW / 3, TOTAL = 9000;
  var S = { fx: new G.Particles(), t: 0 };
  var CAR_COLORS = ['#3a6fd8', '#f2c33d', '#34a37a', '#8e5cff', '#ffffff', '#ff8a3d', '#22b8cf', '#555b66'];

  function z() { return G.clamp(G.H / 420, .85, 1.5); }
  function carY() { return G.H * .8; }
  function toScreenY(dist) { return carY() - (dist - S.dist) * z(); }

  function restart() {
    S.dist = 0; S.speed = 0; S.x = 0; S.vx = 0; S.lives = 3; S.inv = 0; S.spin = 0; S.boost = 0; S.nitro = 1;
    S.bones = 0; S.time = 0; S.hits = 0; S.state = 'ready';
    S.traffic = []; S.items = []; S.nextSpawn = 600; S.nextItem = 400;
    S.side = [];
    var r = G.rng((Math.random() * 1e9) | 0);
    for (var d = -200; d < TOTAL + 1200; d += 70 + r() * 90) {
      var s = r() < .5 ? -1 : 1;
      S.side.push({ d: d, x: s * (RW / 2 + 50 + r() * 140), kind: r() < .55 ? G.pick(['oak', 'oak2', 'pine']) : r() < .5 ? 'bush' : 'lamp', v: (r() * 3) | 0 });
    }
    G.setObjective('🚗 Ausweichen, Knochen sammeln, ins Ziel!');
    G.mini.countdown(function () { S.state = 'play'; });
  }
  function spawnTraffic() {
    var prog = S.dist / TOTAL;
    var lanes = [0, 1, 2].sort(function () { return Math.random() - .5; });
    var n = Math.random() < .25 + prog * .45 ? 2 : 1;
    var ahead = S.dist + G.H / z() + 160;
    for (var i = 0; i < n; i++) {
      var cone = Math.random() < .12;
      S.traffic.push({ lane: lanes[i], x: (lanes[i] - 1) * LANE + (Math.random() - .5) * 14, d: ahead + i * 40, sp: cone ? 0 : 150 + Math.random() * 90, col: G.pick(CAR_COLORS), cone: cone, truck: !cone && Math.random() < .2 });
    }
    if (Math.random() < .5) S.items.push({ x: (lanes[2] - 1) * LANE, d: ahead + 20, kind: Math.random() < .2 ? 'nitro' : 'bone' });
    S.nextSpawn = S.dist + 260 + Math.random() * 180 - prog * 120;
  }
  function crash(o) {
    if (S.inv > 0) return;
    S.lives--; S.hits++; S.inv = 1.6; S.spin = .8; S.speed *= .35; S.boost = 0;
    G.sfx('crash'); G.buzz([40, 30, 60]); S.shake = .45;
    S.fx.emit({ x: G.W / 2 + S.x * z(), y: carY() - 20, type: 'star', color: ['#fff', '#ffd166', '#ff8a8a'], size: 6, life: .6, speed: 220, vr: 10, always: true }, 16);
    S.fx.emit({ x: G.W / 2 + S.x * z(), y: carY(), color: 'rgba(120,120,120,.6)', size: 8, grow: 20, life: .9, speed: 60, always: true }, 8);
    if (S.lives <= 0) {
      S.state = 'done';
      G.mini.finish('race', { win: false, loseTitle: 'Totalschaden 💥', sub: 'Du hast ' + Math.round(S.dist / TOTAL * 100) + ' % geschafft.', cells: [['Strecke', Math.round(S.dist / TOTAL * 100) + ' %'], ['Knochen', S.bones]], again: restart, back: leave });
    } else G.toast('Rums! Noch ' + S.lives + ' ❤️', 1200);
  }
  function boost() {
    if (S.state !== 'play' || S.nitro <= 0 || S.boost > 0) return;
    S.nitro--; S.boost = 2.2; G.sfx('whoosh'); G.buzz(30);
  }
  function update(dt) {
    S.t += dt;
    if (S.state === 'play') {
      S.time += dt;
      var prog = S.dist / TOTAL, target = 330 + prog * 230 + (S.boost > 0 ? 280 : 0);
      if (S.spin > 0) target *= .4;
      S.speed = G.damp(S.speed, target, S.boost > 0 ? 3 : 1.4, dt);
      S.dist += S.speed * dt;
      var inp = G.readMove();
      var steer = inp.x;
      S.vx = G.damp(S.vx, steer * 330, 9, dt);
      S.x = G.clamp(S.x + S.vx * dt, -RW / 2 + 26, RW / 2 - 26);
      S.inv = Math.max(0, S.inv - dt); S.spin = Math.max(0, S.spin - dt); S.boost = Math.max(0, S.boost - dt); S.shake = Math.max(0, (S.shake || 0) - dt);
      if (S.dist > S.nextSpawn && S.dist < TOTAL - 500) spawnTraffic();
      S.traffic.forEach(function (o) {
        o.d += o.sp * dt;
        var len = o.truck ? 70 : o.cone ? 18 : 50, wid = o.cone ? 16 : 40;
        if (Math.abs(o.x - S.x) < (wid + 38) / 2 - 4 && Math.abs(o.d - S.dist) < (len + 54) / 2 - 6) crash(o);
      });
      S.traffic = S.traffic.filter(function (o) { return o.d > S.dist - 300; });
      S.items.forEach(function (it) {
        if (!it.got && Math.abs(it.x - S.x) < 34 && Math.abs(it.d - S.dist) < 34) {
          it.got = true;
          if (it.kind === 'bone') { S.bones++; G.sfx('coin', .8); }
          else { S.nitro = Math.min(3, S.nitro + 1); G.sfx('key', .7); G.toast('⚡ Turbo +1', 900); }
          S.fx.emit({ x: G.W / 2 + it.x * z(), y: toScreenY(it.d), type: 'star', color: '#ffd166', size: 5, life: .5, speed: 120, add: true, always: true }, 8);
        }
      });
      S.items = S.items.filter(function (it) { return !it.got && it.d > S.dist - 200; });
      if (S.dist >= TOTAL) {
        S.state = 'done';
        var stars = 1 + (S.hits === 0 ? 1 : 0) + (S.time < 24 ? 1 : 0);
        if (S.hits <= 1 && S.bones >= 8) stars = Math.max(stars, 2);
        G.mini.finish('race', { win: true, time: S.time, stars: Math.min(3, stars), bones: 2 + Math.floor(S.bones / 3), sub: 'Zielflagge! 🏁', cells: [['Zeit', G.fmtTime(S.time)], ['Knochen', S.bones], ['Unfälle', S.hits]], again: restart, back: leave });
        for (var i = 0; i < 30; i++) S.fx.emit({ x: G.W / 2 + G.rand(-RW / 2, RW / 2) * z(), y: G.rand(0, G.H * .5), type: 'star', color: G.pick(['#ffd166', '#ff8fb8', '#9ad0ff', '#6ee7a8']), size: 5, life: 1.6, vy: 80, speed: 60, vr: 8, always: true }, 1);
      }
      G.setObjective('<span class="hearts">' + '❤️'.repeat(Math.max(0, S.lives)) + '</span> · 🦴 ' + S.bones + ' · ' + Math.min(100, Math.round(S.dist / TOTAL * 100)) + ' %');
      G.updateAction('boost', { label: 'Turbo ×' + S.nitro, disabled: S.nitro <= 0 || S.boost > 0, pulse: S.nitro > 0 && S.boost <= 0 });
      if (S.boost > 0 && Math.random() < dt * 30) S.fx.emit({ x: G.W / 2 + S.x * z() + G.rand(-10, 10), y: carY() + 30 * z(), color: G.pick(['#ffd166', '#ff8a3d', '#fff']), size: 3, life: .3, vy: 300, speed: 40, add: true, always: true }, 1);
    } else if (S.state === 'done') { S.speed = G.damp(S.speed, 0, 1.5, dt); S.dist += S.speed * dt; }
    /* Motorgeräusch folgt der Geschwindigkeit */
    if (S.engine) {
      var tt = G.audio.ctx.currentTime;
      S.engine.o.frequency.setTargetAtTime(48 + S.speed * .11, tt, .1);
      S.engine.o2.frequency.setTargetAtTime(96 + S.speed * .22, tt, .1);
      S.engine.g.gain.setTargetAtTime(G.data.settings.sfx ? .05 + (S.boost > 0 ? .03 : 0) : 0, tt, .2);
    }
    S.fx.update(dt);
  }
  function drawCar(ctx, x, y, col, player, truck, rot) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
    var w = 40, l = truck ? 70 : 52;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); G.roundRect(ctx, -w / 2 + 4, -l / 2 + 6, w, l, 10); ctx.fill();
    ctx.fillStyle = '#1b1b1b'; [[-w / 2 - 2, -l * .32], [w / 2 - 4, -l * .32], [-w / 2 - 2, l * .2], [w / 2 - 4, l * .2]].forEach(function (p) { ctx.fillRect(p[0], p[1], 6, 12); });
    ctx.fillStyle = A.lg(ctx, -w / 2, 0, w / 2, 0, [0, shade(col, -30), .5, col, 1, shade(col, -40)]);
    ctx.beginPath(); G.roundRect(ctx, -w / 2, -l / 2, w, l, 10); ctx.fill();
    if (truck) {
      ctx.fillStyle = shade(col, -15); ctx.fillRect(-w / 2 + 3, -l / 2 + 22, w - 6, l - 26);
      ctx.fillStyle = 'rgba(160,210,240,.85)'; ctx.fillRect(-w / 2 + 5, -l / 2 + 6, w - 10, 10);
    } else if (player) {
      ctx.fillStyle = 'rgba(160,210,240,.9)'; ctx.beginPath(); G.roundRect(ctx, -w / 2 + 5, -l / 2 + 10, w - 10, 7, 3); ctx.fill();
      ctx.fillStyle = '#5a1e1e'; ctx.beginPath(); G.roundRect(ctx, -w / 2 + 5, -l / 2 + 19, w - 10, l * .55, 6); ctx.fill();
      /* Hund am Steuer (von oben) */
      ctx.fillStyle = '#e2a258'; ctx.beginPath(); ctx.arc(-5, -2, 7.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#94562a'; ctx.beginPath(); ctx.ellipse(-12, 0, 3, 5.5, .3, 0, TAU); ctx.ellipse(2, 0, 3, 5.5, -.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f7cf92'; ctx.beginPath(); ctx.ellipse(-5, -8, 4, 3.4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2b1a12'; ctx.beginPath(); ctx.arc(-5, -10.5, 1.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(-5, -15, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      /* Beifahrerin */
      ctx.fillStyle = '#5a3319'; ctx.beginPath(); ctx.arc(9, 4, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff6b9d'; ctx.beginPath(); ctx.arc(9, 9, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(-w / 2 + 4, -l / 2 + 1, 7, 3); ctx.fillRect(w / 2 - 11, -l / 2 + 1, 7, 3);
    } else {
      ctx.fillStyle = 'rgba(160,210,240,.85)'; ctx.beginPath(); G.roundRect(ctx, -w / 2 + 5, -l / 2 + 10, w - 10, 9, 3); ctx.fill();
      ctx.fillStyle = shade(col, -18); ctx.beginPath(); G.roundRect(ctx, -w / 2 + 5, -l / 2 + 20, w - 10, l * .38, 4); ctx.fill();
      ctx.fillStyle = 'rgba(160,210,240,.7)'; ctx.fillRect(-w / 2 + 6, l / 2 - 14, w - 12, 6);
      ctx.fillStyle = '#ff4d4d'; ctx.fillRect(-w / 2 + 3, l / 2 - 4, 7, 3); ctx.fillRect(w / 2 - 10, l / 2 - 4, 7, 3);
    }
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); G.roundRect(ctx, -w / 2 + 3, -l / 2 + 2, 5, l - 6, 3); ctx.fill();
    ctx.restore();
  }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = G.clamp((n >> 16) + amt, 0, 255), g = G.clamp(((n >> 8) & 255) + amt, 0, 255), b = G.clamp((n & 255) + amt, 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function draw(ctx) {
    var Z = z(), W = G.W, H = G.H, cx = W / 2, t = S.t, sh = S.shake > 0 ? (Math.random() - .5) * 12 * S.shake : 0;
    G.screen(ctx);
    ctx.setTransform(G.dpr, 0, 0, G.dpr, sh * G.dpr, 0);
    /* Gras mit Mähstreifen */
    ctx.fillStyle = '#5fae55'; ctx.fillRect(0, 0, W, H);
    var stripe = 60 * Z, off = (S.dist * Z) % (stripe * 2);
    ctx.fillStyle = '#6cbb5f';
    for (var y = -stripe * 2 + off; y < H; y += stripe * 2) ctx.fillRect(0, y, W, stripe);
    ctx.save(); ctx.translate(cx, 0); ctx.scale(Z, 1);
    /* Straße */
    ctx.fillStyle = '#4a4d55'; ctx.fillRect(-RW / 2, 0, RW, H);
    ctx.fillStyle = 'rgba(255,255,255,.03)'; for (var k = 0; k < 6; k++) ctx.fillRect(-RW / 2 + k * 50 + 10, 0, 18, H);
    var curb = 30 * Z, coff = (S.dist * Z) % (curb * 2);
    for (y = -curb * 2 + coff; y < H; y += curb) { ctx.fillStyle = Math.round((y - coff) / curb) % 2 ? '#e0343f' : '#fff'; ctx.fillRect(-RW / 2 - 12, y, 12, curb); ctx.fillRect(RW / 2, y, 12, curb); }
    var dash = 44 * Z, doff = (S.dist * Z) % (dash * 2);
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    [-LANE / 2, LANE / 2].forEach(function (lx) { for (var yy = -dash * 2 + doff; yy < H; yy += dash * 2) ctx.fillRect(lx - 2.5, yy, 5, dash); });
    ctx.restore();
    /* Ziellinie */
    var fy = toScreenY(TOTAL);
    if (fy > -60 && fy < H + 60) {
      ctx.save(); ctx.translate(cx, fy); ctx.scale(Z, Z);
      for (var cxx = -RW / 2; cxx < RW / 2; cxx += 15) for (var cy = 0; cy < 2; cy++) { ctx.fillStyle = ((cxx / 15 + cy) % 2 + 2) % 2 ? '#111' : '#fff'; ctx.fillRect(cxx, -15 + cy * 15, 15, 15); }
      ctx.fillStyle = '#e0343f'; ctx.fillRect(-RW / 2 - 20, -90, 8, 90); ctx.fillRect(RW / 2 + 12, -90, 8, 90);
      ctx.fillStyle = '#fff'; ctx.beginPath(); G.roundRect(ctx, -RW / 2 - 20, -96, RW + 40, 26, 8); ctx.fill();
      ctx.fillStyle = '#e0343f'; ctx.font = '900 16px ' + G.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏁 ZIEL 🏁', 0, -82);
      ctx.restore();
    }
    /* Objekte am Rand */
    ctx.save(); ctx.translate(cx, 0);
    S.side.forEach(function (s) {
      var sy = toScreenY(s.d); if (sy < -140 || sy > H + 40) return;
      ctx.save(); ctx.translate(s.x * Z, sy); ctx.scale(Z * .9, Z * .9);
      if (s.kind === 'bush') G.drawSprite(ctx, A.bush(s.v), 0, 0);
      else if (s.kind === 'lamp') G.drawSprite(ctx, A.lamp(), 0, 0);
      else G.drawSprite(ctx, A.tree(s.kind), 0, 0, Math.sin(t * 1.3 + s.d) * .02);
      ctx.restore();
    });
    /* Gegenstände */
    S.items.forEach(function (it) {
      var iy = toScreenY(it.d); if (iy < -40 || iy > H + 40) return;
      ctx.save(); ctx.translate(it.x * Z, iy); ctx.scale(Z, Z);
      if (it.kind === 'bone') { A.bone(ctx, 0, Math.sin(t * 4 + it.d) * 3, 1.4, Math.sin(t * 2) * .3); }
      else {
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); G.roundRect(ctx, -11, -15, 22, 30, 6); ctx.fill();
        ctx.fillStyle = '#3a2400'; ctx.font = '900 18px ' + G.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚡', 0, 1);
      }
      ctx.restore();
    });
    /* Verkehr */
    S.traffic.forEach(function (o) {
      var oy = toScreenY(o.d); if (oy < -80 || oy > H + 80) return;
      ctx.save(); ctx.translate(o.x * Z, oy); ctx.scale(Z, Z);
      if (o.cone) {
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(3, 4, 11, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      } else drawCar(ctx, 0, 0, o.col, false, o.truck, 0);
      ctx.restore();
    });
    /* eigenes Auto */
    var blink = S.inv > 0 && Math.floor(t * 12) % 2;
    if (!blink) {
      ctx.save(); ctx.translate(S.x * Z, carY()); ctx.scale(Z, Z);
      drawCar(ctx, 0, 0, '#e0343f', true, false, S.spin > 0 ? S.spin * 9 : S.vx * .0012);
      ctx.restore();
    }
    ctx.restore();
    S.fx.draw(ctx);
    /* Turbo-Streifen */
    if (S.boost > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
      for (var i = 0; i < 14; i++) { var lx = (Math.sin(i * 91.7 + Math.floor(t * 20)) * .5 + .5) * W, ly = ((i * 137 + t * 1800) % (H + 200)) - 100; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 60); ctx.stroke(); }
    }
    /* Nacht: Scheinwerfer */
    var day = G.dayInfo();
    if (day.night > .3) {
      ctx.fillStyle = 'rgba(8,14,40,' + day.night * .55 + ')'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      var px = cx + S.x * Z, py = carY() - 26 * Z;
      var g = ctx.createRadialGradient(px, py - 120 * Z, 10, px, py - 120 * Z, 170 * Z); g.addColorStop(0, 'rgba(255,240,190,' + day.night * .35 + ')'); g.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(px - 14 * Z, py); ctx.lineTo(px - 90 * Z, py - 300 * Z); ctx.lineTo(px + 90 * Z, py - 300 * Z); ctx.lineTo(px + 14 * Z, py); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  function startEngine() {
    var A2 = G.audio; if (!A2.ctx || S.engine) return;
    var o = A2.ctx.createOscillator(), o2 = A2.ctx.createOscillator(), f = A2.ctx.createBiquadFilter(), g = A2.ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 520; g.gain.value = 0;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(A2.sfx); o.start(); o2.start();
    S.engine = { o: o, o2: o2, g: g };
  }
  function stopEngine() {
    if (!S.engine) return;
    var e = S.engine; S.engine = null;
    try { e.g.gain.setTargetAtTime(0, G.audio.ctx.currentTime, .05); setTimeout(function () { e.o.stop(); e.o2.stop(); }, 300); } catch (er) {}
  }
  function leave() { G.go('hub', { returnTo: 'race' }); }
  G.scenes.race = {
    enter: function () {
      G.setJoystick(true);
      G.setActions([{ id: 'boost', icon: '⚡', label: 'Turbo', size: 'lg', keys: [' ', 'ArrowUp', 'w'], onDown: boost }]);
      G.hud({ exit: true, objective: ' ' });
      G.music('race'); G.ambient({}, 0);
      startEngine();
      restart();
    },
    exit: function () { stopEngine(); },
    update: update, draw: draw,
    idle: function (dt) { S.t += dt; S.fx.update(dt); },
    onEscape: leave
  };
})();
