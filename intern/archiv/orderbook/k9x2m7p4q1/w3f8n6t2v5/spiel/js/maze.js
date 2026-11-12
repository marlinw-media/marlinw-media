/* Pets — Minispiel-Grundlagen + Höhlen-Labyrinth */
(function () {
  'use strict';
  var G = window.G, A = G.art, TAU = Math.PI * 2;

  /* ================= gemeinsame Minispiel-Helfer ================= */
  G.mini = {
    countdown: function (onGo) {
      var n = 3;
      var step = function () {
        if (n > 0) { G.banner(String(n)); G.sfx('beep'); n--; setTimeout(step, 700); }
        else { G.banner('Los!'); G.sfx('go'); G.buzz(30); onGo(); }
      };
      setTimeout(step, 350);
    },
    finish: function (id, o) {
      var data = G.data, best = data.best[id], newBest = false;
      data.plays[id] = (data.plays[id] || 0) + 1;
      if (o.win && o.time !== undefined && (best === undefined || o.time < best)) { data.best[id] = o.time; newBest = best !== undefined; }
      var earned = o.win ? o.bones : 0;
      if (earned) G.addBones(earned);
      if (o.win) { G.quest(id); G.stat('love', 8); G.stat('energy', -6); G.sfx('win'); G.buzz([30, 40, 30]); }
      else { G.sfx('lose'); G.buzz(60); }
      G.persist();
      setTimeout(function () {
        G.showResult({
          title: o.win ? (newBest ? '🏆 Neuer Rekord!' : o.title || 'Geschafft! 🎉') : (o.loseTitle || 'Fast geschafft!'),
          sub: o.sub || '',
          stars: o.win ? o.stars : 0,
          cells: (o.cells || []).concat([['Belohnung', '+' + earned + ' 🦴'], ['Bestzeit', data.best[id] !== undefined ? G.fmtTime(data.best[id]) : '–']]),
          onAgain: o.again, onBack: o.back
        });
      }, o.win ? 900 : 600);
    }
  };

  /* ================= Labyrinth ================= */
  var T = 48, CW = 12, CH = 8, GW = CW * 2 + 1, GH = CH * 2 + 1;
  var S = { cam: new G.Camera(), fx: new G.Particles(), t: 0 };
  function generate() {
    var r = G.rng((Math.random() * 1e9) | 0), grid = [];
    for (var y = 0; y < GH; y++) { grid.push([]); for (var x = 0; x < GW; x++) grid[y].push(1); }
    var vis = {}, stack = [[0, 0]]; vis['0,0'] = 1; grid[1][1] = 0;
    while (stack.length) {
      var c = stack[stack.length - 1], dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(function () { return r() - .5; }), moved = false;
      for (var i = 0; i < 4; i++) {
        var nx = c[0] + dirs[i][0], ny = c[1] + dirs[i][1];
        if (nx < 0 || ny < 0 || nx >= CW || ny >= CH || vis[nx + ',' + ny]) continue;
        vis[nx + ',' + ny] = 1; grid[c[1] * 2 + 1 + dirs[i][1]][c[0] * 2 + 1 + dirs[i][0]] = 0; grid[ny * 2 + 1][nx * 2 + 1] = 0;
        stack.push([nx, ny]); moved = true; break;
      }
      if (!moved) stack.pop();
    }
    for (y = 1; y < GH - 1; y++) for (x = 1; x < GW - 1; x++) if (grid[y][x] === 1 && ((x % 2) !== (y % 2)) && r() < .12) grid[y][x] = 0;
    return grid;
  }
  function bfs(grid, sx, sy) {
    var dist = grid.map(function (row) { return row.map(function () { return -1; }); }), q = [[sx, sy]], qi = 0; dist[sy][sx] = 0;
    while (qi < q.length) { var c = q[qi++]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var x = c[0] + d[0], y = c[1] + d[1]; if (grid[y] && grid[y][x] === 0 && dist[y][x] < 0) { dist[y][x] = dist[c[1]][c[0]] + 1; q.push([x, y]); } }); }
    return dist;
  }
  function cellC(gx, gy) { return { x: gx * T + T / 2, y: gy * T + T / 2 }; }
  function wall(gx, gy) { return gy < 0 || gx < 0 || gy >= GH || gx >= GW || S.grid[gy][gx] === 1; }
  function collides(x, y, r) {
    var x0 = Math.floor((x - r) / T), x1 = Math.floor((x + r) / T), y0 = Math.floor((y - r) / T), y1 = Math.floor((y + r) / T);
    for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) if (wall(gx, gy)) return true;
    return false;
  }
  function build() {
    S.grid = generate();
    var dS = bfs(S.grid, 1, 1), far = { d: -1 };
    for (var y = 1; y < GH; y += 2) for (var x = 1; x < GW; x += 2) if (dS[y][x] > far.d && (x > GW / 2 || y > GH / 2)) far = { x: x, y: y, d: dS[y][x] };
    S.exit = cellC(far.x, far.y); S.exitG = far;
    var dE = bfs(S.grid, far.x, far.y), direct = dS[far.y][far.x], cands = [];
    for (y = 1; y < GH; y += 2) for (x = 1; x < GW; x += 2) { if ((x === 1 && y === 1) || (x === far.x && y === far.y)) continue; cands.push({ x: x, y: y, det: dS[y][x] + dE[y][x] - direct, d: dS[y][x] }); }
    cands.sort(function (a, b) { return b.det - a.det; });
    var k = cands[(Math.random() * Math.max(1, cands.length * .3)) | 0]; S.key = cellC(k.x, k.y); S.hasKey = false;
    S.gems = [];
    var pool = cands.filter(function (c) { return c.d > 6 && G.dist(c.x, c.y, k.x, k.y) > 3; }).sort(function () { return Math.random() - .5; });
    for (var i = 0; i < 5 && i < pool.length; i++) S.gems.push(Object.assign(cellC(pool[i].x, pool[i].y), { got: false, c: G.pick(['#7cf0ff', '#ff7ad9', '#b6ff7a', '#ffd166']) }));
    /* Fackeln an Wänden neben Gängen */
    S.torches = [];
    for (y = 1; y < GH - 1; y++) for (x = 1; x < GW - 1; x++) if (S.grid[y][x] === 1 && S.grid[y + 1] && S.grid[y + 1][x] === 0 && Math.random() < .07) S.torches.push({ x: x * T + T / 2, y: y * T + T - 6, s: Math.random() * 10 });
    S.bats = [];
    for (i = 0; i < 4; i++) { var bc = pool[(i * 3 + 7) % pool.length] || pool[0]; S.bats.push({ x: bc.x * T + T / 2, y: bc.y * T + T / 2, a: Math.random() * TAU, t: Math.random() * 5 }); }
    S.d = { x: T * 1.5, y: T * 1.5, vx: 0, vy: 0, face: 1, walk: 0, move: 0, stun: 0 };
    S.trail = [];
    prerender();
  }
  function prerender() {
    var w = GW * T, h = GH * T, sc = G.quality >= 2 ? 1.5 : 1;
    S.map = G.makeCanvas(w * sc, h * sc); S.mapSc = sc;
    var c = S.map.getContext('2d'), r = G.rng(5);
    c.scale(sc, sc);
    c.fillStyle = '#3a3129'; c.fillRect(0, 0, w, h);
    for (var i = 0; i < 1600; i++) { c.fillStyle = r() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,230,200,.06)'; c.beginPath(); c.ellipse(r() * w, r() * h, 2 + r() * 7, 1 + r() * 4, r() * 3, 0, TAU); c.fill(); }
    for (var y = 0; y < GH; y++) for (var x = 0; x < GW; x++) {
      if (S.grid[y][x] !== 1) continue;
      var px = x * T, py = y * T;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(px + 4, py + 10, T, T);
      c.fillStyle = A.lg(c, 0, py + T * .5, 0, py + T, [0, '#5e554a', 1, '#3d362e']); c.fillRect(px, py + T * .45, T, T * .55);
      c.fillStyle = A.lg(c, px, py, px + T, py + T, [0, '#9b9183', 1, '#746a5d']); c.fillRect(px, py - 8, T, T * .45 + 8);
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.strokeRect(px + .5, py - 7.5, T - 1, T * .45 + 7);
      if (!wall(x, y + 1)) { c.fillStyle = 'rgba(0,0,0,.25)'; for (var k = 0; k < 3; k++) c.fillRect(px + 6 + k * 15, py + T * .55 + (k % 2) * 6, 10, 4); }
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(px + 3, py - 6, T - 6, 3);
      if (r() < .25) { c.fillStyle = 'rgba(110,170,90,.5)'; c.beginPath(); c.ellipse(px + r() * T, py - 6 + r() * 10, 6, 2.5, 0, 0, TAU); c.fill(); }
    }
    /* Startmarkierung */
    c.fillStyle = 'rgba(255,214,102,.25)'; c.beginPath(); c.arc(T * 1.5, T * 1.5, 16, 0, TAU); c.fill();
  }

  function update(dt) {
    S.t += dt;
    var d = S.d;
    if (S.state === 'play') {
      S.time += dt;
      var inp = G.readMove(), sp = 175;
      if (d.stun > 0) { d.stun -= dt; inp = { x: 0, y: 0 }; }
      G.approach(d, inp.x * sp, inp.y * sp, 1100, dt);
      var nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
      if (!collides(nx, d.y, 12)) d.x = nx; else d.vx = 0;
      if (!collides(d.x, ny, 12)) d.y = ny; else d.vy = 0;
      if (!S.hasKey && G.dist(d.x, d.y, S.key.x, S.key.y) < 26) {
        S.hasKey = true; G.sfx('key'); G.buzz(30);
        S.fx.emit({ x: S.key.x, y: S.key.y, type: 'star', color: ['#ffd166', '#fff3b0'], size: 6, life: .9, speed: 160, vr: 10, add: true, always: true }, 18);
        G.toast('🔑 Schlüssel gefunden! Jetzt zum Ausgang.');
      }
      S.gems.forEach(function (g) {
        if (!g.got && G.dist(d.x, d.y, g.x, g.y) < 24) { g.got = true; S.gemCount++; G.sfx('coin'); S.fx.emit({ x: g.x, y: g.y, type: 'star', color: g.c, size: 5, life: .7, speed: 120, vr: 10, add: true, always: true }, 10); }
      });
      S.bats.forEach(function (b) {
        b.t += dt; b.a += Math.sin(b.t * 1.3) * dt * 2.4;
        var bx = b.x + Math.cos(b.a) * 70 * dt, by = b.y + Math.sin(b.a) * 70 * dt;
        /* Fledermäuse fliegen frei über die Wände – nur am Höhlenrand drehen sie um */
        if (bx < T || by < T || bx > (GW - 1) * T || by > (GH - 1) * T) b.a += Math.PI * .7; else { b.x = bx; b.y = by; }
        if (d.stun <= 0 && G.dist(d.x, d.y, b.x, b.y) < 20) {
          d.stun = .8; var a = Math.atan2(d.y - b.y, d.x - b.x); d.vx = Math.cos(a) * 260; d.vy = Math.sin(a) * 260;
          b.a += Math.PI; G.sfx('hit'); G.buzz(40); S.cam.shake(8, .3); G.toast('Huch, eine Fledermaus! 🦇', 1200);
        }
      });
      if (G.dist(d.x, d.y, S.exit.x, S.exit.y) < 26) {
        if (S.hasKey) win();
        else if (!S.lockMsg) { S.lockMsg = true; G.toast('🔒 Abgeschlossen – erst den Schlüssel finden!'); G.sfx('error'); setTimeout(function () { S.lockMsg = false; }, 2500); }
      }
      if (Math.hypot(d.vx, d.vy) > 30) { S.trailAcc = (S.trailAcc || 0) + dt; if (S.trailAcc > .18) { S.trailAcc = 0; S.trail.push({ x: d.x, y: d.y }); if (S.trail.length > 400) S.trail.shift(); } }
      G.setObjective((S.hasKey ? '🔑✓ → 🚪 Ausgang' : '🔑 Schlüssel suchen') + ' · 💎 ' + S.gemCount + '/' + S.gems.length + ' · <span class="timer">' + G.fmtTime(S.time) + '</span>');
    }
    var sp2 = Math.hypot(d.vx, d.vy);
    d.move = G.clamp(sp2 / 140, 0, 1.2); d.walk += sp2 * dt * .085;
    if (Math.abs(d.vx) > 8) d.face = d.vx < 0 ? -1 : 1;
    S.cam.zoom = G.damp(S.cam.zoom, S.cam.baseZoom(340), 4, dt);
    S.cam.follow(d.x, d.y, dt, GW * T, GH * T, 7); S.cam.update(dt);
    if (Math.random() < dt * 3) S.fx.emit({ x: d.x + G.rand(-200, 200), y: d.y + G.rand(-140, 140), color: 'rgba(255,230,190,.35)', size: 1.2, life: 3, vx: G.rand(-6, 6), vy: G.rand(-8, -2) }, 1);
    S.fx.update(dt);
  }
  function win() {
    S.state = 'done';
    var stars = S.time < 50 ? 3 : S.time < 85 ? 2 : 1, bones = 2 + S.gemCount + (stars === 3 ? 1 : 0);
    S.fx.emit({ x: S.exit.x, y: S.exit.y, type: 'star', color: ['#ffd166', '#fff', '#7cf0ff'], size: 6, life: 1.2, speed: 220, vr: 10, add: true, always: true }, 30);
    G.mini.finish('maze', { win: true, time: S.time, stars: stars, bones: bones, sub: G.data.name + ' hat aus der Höhle gefunden!', cells: [['Zeit', G.fmtTime(S.time)], ['Edelsteine', S.gemCount + ' / ' + S.gems.length]], again: restart, back: leave });
  }
  function drawTorch(ctx, x, y, t, s) {
    ctx.fillStyle = '#4a2c14'; ctx.fillRect(x - 2, y - 14, 4, 12);
    var f = 1 + Math.sin(t * 13 + s) * .15 + Math.sin(t * 23 + s) * .08;
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(x, y - 18, 5 * f, 8 * f, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.ellipse(x, y - 16, 2.6, 4.5 * f, 0, 0, TAU); ctx.fill();
  }
  function draw(ctx) {
    var cam = S.cam, t = S.t, d = S.d;
    G.screen(ctx); ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, G.W, G.H);
    cam.apply(ctx);
    ctx.drawImage(S.map, 0, 0, GW * T, GH * T);
    /* Pfotenspur */
    ctx.fillStyle = 'rgba(255,220,160,.12)';
    S.trail.forEach(function (p, i) { ctx.beginPath(); ctx.arc(p.x + (i % 2 ? 4 : -4), p.y + 4, 2.2, 0, TAU); ctx.fill(); });
    /* Ausgang */
    var ex = S.exit.x, ey = S.exit.y;
    ctx.fillStyle = S.hasKey ? '#ffd166' : '#6b5a44';
    ctx.beginPath(); G.roundRect(ctx, ex - 16, ey - 26, 32, 34, 8); ctx.fill();
    ctx.fillStyle = S.hasKey ? '#fff8d6' : '#3a2f22'; ctx.beginPath(); ctx.moveTo(ex - 11, ey + 8); ctx.lineTo(ex - 11, ey - 12); ctx.arc(ex, ey - 12, 11, Math.PI, 0); ctx.lineTo(ex + 11, ey + 8); ctx.fill();
    if (!S.hasKey) { ctx.font = '16px ' + G.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔒', ex, ey - 4); }
    /* Schlüssel */
    if (!S.hasKey) {
      var ky = S.key.y - 6 + Math.sin(t * 3) * 3;
      ctx.save(); ctx.translate(S.key.x, ky); ctx.rotate(Math.sin(t * 2) * .2);
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(-6, 0, 5, 0, TAU); ctx.moveTo(-1, 0); ctx.lineTo(11, 0); ctx.moveTo(7, 0); ctx.lineTo(7, 5); ctx.moveTo(11, 0); ctx.lineTo(11, 4); ctx.stroke();
      ctx.restore();
    }
    S.gems.forEach(function (g) {
      if (g.got) return;
      var gy = g.y - 4 + Math.sin(t * 2.5 + g.x) * 2;
      ctx.fillStyle = g.c; ctx.beginPath(); ctx.moveTo(g.x, gy - 8); ctx.lineTo(g.x + 7, gy - 2); ctx.lineTo(g.x, gy + 8); ctx.lineTo(g.x - 7, gy - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(g.x, gy - 8); ctx.lineTo(g.x + 3, gy - 2); ctx.lineTo(g.x, gy); ctx.lineTo(g.x - 3, gy - 2); ctx.fill();
    });
    S.torches.forEach(function (tc) { drawTorch(ctx, tc.x, tc.y, t, tc.s); });
    A.dog(ctx, { x: d.x, y: d.y + 10, face: d.face, walk: d.walk, move: d.move, t: t, wag: .7, acc: G.data.wear, dirt: G.data.dirt || 0, tilt: d.stun > 0 ? Math.sin(t * 30) * .3 : 0, pant: d.move > .8 ? 1 : 0, scale: .9 });
    S.bats.forEach(function (b) {
      var fl = Math.sin(b.t * 20) * .8;
      ctx.save(); ctx.translate(b.x, b.y - 14);
      ctx.fillStyle = '#2b2233';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -8 * fl, -16, -2 * fl); ctx.quadraticCurveTo(-10, 2, -4, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -8 * fl, 16, -2 * fl); ctx.quadraticCurveTo(10, 2, 4, 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 1, 4, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff5f6d'; ctx.fillRect(-2.2, 0, 1.4, 1.4); ctx.fillRect(.8, 0, 1.4, 1.4);
      ctx.restore();
    });
    S.fx.draw(ctx);
    /* Dunkelheit mit Lichtquellen */
    var sc = .5, lw = Math.ceil(G.W * sc), lh = Math.ceil(G.H * sc);
    if (!S.light || S.light.width !== lw || S.light.height !== lh) S.light = G.makeCanvas(lw, lh);
    var lc = S.light.getContext('2d');
    lc.globalCompositeOperation = 'source-over'; lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.fillStyle = 'rgba(4,3,8,.96)'; lc.fillRect(0, 0, lw, lh);
    lc.globalCompositeOperation = 'destination-out';
    var z = cam.zoom * sc;
    lc.setTransform(z, 0, 0, z, (G.W / 2 - (cam.x + cam.sx) * cam.zoom) * sc, (G.H / 2 - (cam.y + cam.sy) * cam.zoom) * sc);
    var flick = 1 + Math.sin(t * 9) * .03 + Math.sin(t * 17) * .02;
    var lights = [{ x: d.x, y: d.y, r: 165 * flick, a: 1 }];
    S.torches.forEach(function (tc) { lights.push({ x: tc.x, y: tc.y - 18, r: 95 * (1 + Math.sin(t * 11 + tc.s) * .06), a: .9 }); });
    if (!S.hasKey) lights.push({ x: S.key.x, y: S.key.y, r: 48, a: .8 });
    lights.push({ x: S.exit.x, y: S.exit.y - 8, r: S.hasKey ? 110 : 40, a: S.hasKey ? 1 : .5 });
    S.gems.forEach(function (g) { if (!g.got) lights.push({ x: g.x, y: g.y, r: 30, a: .6 }); });
    lights.forEach(function (L) { var g = lc.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r); g.addColorStop(0, 'rgba(0,0,0,' + L.a + ')'); g.addColorStop(.55, 'rgba(0,0,0,' + L.a * .7 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(L.x, L.y, L.r, 0, TAU); lc.fill(); });
    G.screen(ctx); ctx.drawImage(S.light, 0, 0, G.W, G.H);
    cam.apply(ctx); ctx.globalCompositeOperation = 'lighter';
    S.torches.forEach(function (tc) { var g = ctx.createRadialGradient(tc.x, tc.y - 18, 0, tc.x, tc.y - 18, 60); g.addColorStop(0, 'rgba(255,150,60,.35)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tc.x, tc.y - 18, 60, 0, TAU); ctx.fill(); });
    if (S.hasKey) { var g2 = ctx.createRadialGradient(ex, ey - 8, 0, ex, ey - 8, 70); g2.addColorStop(0, 'rgba(255,220,120,.4)'); g2.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(ex, ey - 8, 70, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    /* Hinweispfeil nach einer Weile */
    if (S.state === 'play' && S.time > 25) {
      var tgt = S.hasKey ? S.exit : S.key, a = Math.atan2(tgt.y - d.y, tgt.x - d.x), sp = cam.toScreen(d.x, d.y);
      G.screen(ctx); ctx.save(); ctx.translate(sp.x + Math.cos(a) * 70, sp.y + Math.sin(a) * 70); ctx.rotate(a);
      ctx.globalAlpha = .55 + Math.sin(t * 4) * .2; ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
  function restart() {
    build(); S.time = 0; S.gemCount = 0; S.state = 'ready'; S.lockMsg = false;
    S.cam.x = S.d.x; S.cam.y = S.d.y;
    G.setObjective('🔑 Finde den Schlüssel, dann den Ausgang!');
    G.mini.countdown(function () { S.state = 'play'; });
  }
  function leave() { G.go('hub', { returnTo: 'maze' }); }
  G.scenes.maze = {
    enter: function () {
      S.cam.zoom = S.cam.baseZoom(340);
      G.setJoystick(true); G.setActions([]);
      G.hud({ exit: true, objective: ' ' });
      G.music('maze'); G.ambient({}, 0);
      restart();
    },
    exit: function () { },
    update: update, draw: draw,
    idle: function (dt) { S.t += dt; S.fx.update(dt); },
    onEscape: leave
  };
})();
