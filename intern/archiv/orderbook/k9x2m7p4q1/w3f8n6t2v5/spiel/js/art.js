/* Pets — Illustrationen: alles per Canvas gezeichnet, statische Motive werden einmal gerastert */
(function () {
  'use strict';
  var G = window.G, A = G.art = {};
  var TAU = Math.PI * 2;

  /* ---------- Sprite-Cache (2× Auflösung für scharfe Kanten) ---------- */
  var cache = {};
  G.sprite = function (key, w, h, ax, ay, draw) {
    if (cache[key]) return cache[key];
    var S = 2, c = G.makeCanvas(w * S, h * S), x = c.getContext('2d');
    x.scale(S, S); draw(x, w, h);
    return (cache[key] = { c: c, w: w, h: h, ax: ax, ay: ay });
  };
  G.drawSprite = function (ctx, s, x, y, skew, sx) {
    sx = sx || 1;
    if (!skew) { ctx.drawImage(s.c, x - s.ax * sx, y - s.ay, s.w * sx, s.h); return; }
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, skew, 1, 0, 0);
    ctx.drawImage(s.c, -s.ax * sx, -s.ay, s.w * sx, s.h); ctx.restore();
  };
  function lg(ctx, x0, y0, x1, y1, stops) { var g = ctx.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); return g; }
  function rg(ctx, x, y, r0, r1, stops, fx, fy) { var g = ctx.createRadialGradient(fx === undefined ? x : fx, fy === undefined ? y : fy, r0, x, y, r1); for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]); return g; }
  A.lg = lg; A.rg = rg;
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  A.shadow = function (ctx, x, y, rx, ry, a) { ctx.fillStyle = 'rgba(20,35,15,' + (a || .22) + ')'; ell(ctx, x, y, rx, ry); ctx.fill(); };

  /* ================= Der Hund ================= */
  var FUR = '#e2a258', FUR_L = '#f7cf92', FUR_D = '#b8763a', EAR = '#94562a', OUT = 'rgba(70,40,15,.55)';
  A.dog = function (ctx, o) {
    var t = o.t || 0, walk = o.walk || 0, mv = o.move || 0, pose = o.pose || 'stand', s = o.scale || 1;
    var wagSp = 7 + (o.wag || 0.5) * 12, wag = Math.sin(t * wagSp) * (0.35 + (o.wag || 0.5) * 0.5);
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale((o.face || 1) * s, s);
    var sleep = pose === 'sleep', lie = pose === 'lie' || sleep, sit = pose === 'sit', dig = pose === 'dig', squat = pose === 'squat';
    A.shadow(ctx, 1, 0, lie ? 25 : 21, lie ? 6 : 5, .24);
    var bob = lie ? 0 : -Math.abs(Math.sin(walk)) * 1.7 * mv;
    var bodyY = lie ? -9 : sit ? -16 : squat ? -15 : -19;
    var bodyRot = sit ? -0.42 : squat ? -0.22 : dig ? 0.18 : 0;
    var breathe = Math.sin(t * (sleep ? 1.6 : 3)) * (sleep ? 0.9 : 0.4);

    function leg(hx, hy, ph, far, front) {
      var a, len = 14;
      if (lie) { ctx.strokeStyle = far ? FUR_D : FUR; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, -6); ctx.lineTo(hx + (front ? 12 : -9), -3); ctx.stroke(); ctx.fillStyle = far ? FUR_D : FUR_L; ell(ctx, hx + (front ? 13 : -10), -3, 3.2, 2.2); ctx.fill(); return; }
      if (sit && !front) { ctx.fillStyle = far ? FUR_D : FUR; ell(ctx, hx + 2, -7, 8, 6.5, -0.3); ctx.fill(); ctx.fillStyle = far ? FUR_D : FUR_L; ell(ctx, hx + 9, -1.6, 4.2, 2.2); ctx.fill(); return; }
      if (dig && front) a = Math.sin(t * 22 + ph) * 0.9; else a = Math.sin(walk + ph) * 0.6 * mv;
      var px = hx + Math.sin(a) * len, py = hy + Math.cos(a) * len;
      if (sit && front) { px = hx + 1; py = -0.5; }
      ctx.strokeStyle = far ? FUR_D : FUR; ctx.lineWidth = far ? 4.6 : 5.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx + Math.sin(a) * len * .5 + (front ? 1 : -1.5), hy + len * .55, px, py - 1.5); ctx.stroke();
      ctx.fillStyle = far ? FUR_D : FUR_L; ell(ctx, px + 1.4, py - 1.2, 3.3, 2.1); ctx.fill();
    }
    var hipY = bodyY + 4 + bob;
    ctx.save(); ctx.translate(0, 0);
    leg(-10, hipY, Math.PI, true, false); leg(11, hipY, 0, true, true);
    /* Schwanz */
    ctx.save(); ctx.translate(-15, bodyY - 2 + bob); ctx.rotate(bodyRot);
    var tailUp = squat ? -1.1 : sleep ? 0.9 : 0;
    ctx.rotate(-0.5 + wag * (sleep ? 0.15 : 1) + tailUp);
    ctx.strokeStyle = FUR; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -3, -12, -10); ctx.stroke();
    ctx.strokeStyle = FUR_L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, -6); ctx.quadraticCurveTo(-11, -8, -12, -10); ctx.stroke();
    ctx.restore();
    /* Körper */
    ctx.save(); ctx.translate(0, bodyY + bob); ctx.rotate(bodyRot);
    ctx.fillStyle = lg(ctx, 0, -11, 0, 11, [0, FUR_L, .45, FUR, 1, FUR_D]);
    ell(ctx, 0, 0, 17.5 + breathe * .3, 10.5 + breathe); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,215,.55)'; ell(ctx, 3, 5, 11, 4.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ell(ctx, -3, -6, 9, 3, -0.1); ctx.fill();
    if (o.dirt > 0.05) {
      ctx.globalAlpha = Math.min(1, o.dirt * 1.2); ctx.fillStyle = '#6b4a2b';
      [[-9, 2, 5, 3.5], [4, -4, 4, 3], [10, 4, 3.5, 2.6], [-2, 6, 4, 2.5], [-13, -3, 3, 2.3]].forEach(function (d) { ell(ctx, d[0], d[1], d[2], d[3], .3); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    leg(-6, hipY + 1, 0, false, false); leg(14, hipY + (sit ? -4 : 0), Math.PI, false, true);
    /* Kopf */
    var hx = lie ? 18 : sit ? 13 : 15, hy = (lie ? -11 : sit ? -33 : squat ? -30 : -28) + bob;
    var tilt = (o.tilt || 0) + (dig ? 0.55 : 0) + (lie ? 0.15 : 0) + (sleep ? 0.12 : 0);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(tilt);
    if (!lie) { ctx.fillStyle = FUR; ell(ctx, -3, 6, 7, 8.5, -0.3); ctx.fill(); }
    /* hinteres Ohr */
    ctx.fillStyle = '#7a4420'; ell(ctx, 6.5, -8, 3.4, 5, 0.5); ctx.fill();
    /* Schädel & Schnauze */
    ctx.fillStyle = rg(ctx, 3, -2, 1, 11, [0, FUR_L, .6, FUR, 1, FUR_D], 0, -6);
    ctx.beginPath(); ctx.arc(3, -2, 9.6, 0, TAU); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = FUR_L; ell(ctx, 11.5, 1.8, 7.2, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b1a12'; ell(ctx, 17.6, -0.4, 2.7, 2.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(ctx, 17, -1.2, .9, .6); ctx.fill();
    /* Maul */
    var pant = o.pant || 0;
    ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(16, 3.2); ctx.quadraticCurveTo(13, 5.6 + pant * 2, 9, 4.2); ctx.stroke();
    if (pant > 0.1 || o.happy) {
      var tl = 3 + Math.sin(t * 10) * .8;
      ctx.fillStyle = '#f2788f'; ell(ctx, 12.5, 6 + tl * .5, 2.4, tl); ctx.fill();
      ctx.strokeStyle = '#c4506a'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(12.5, 5.5); ctx.lineTo(12.5, 6 + tl); ctx.stroke();
    }
    /* Auge */
    var blink = sleep || (o.blink || 0) > 0.85;
    if (blink) { ctx.strokeStyle = '#2b1a12'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(5.5, -4, 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else {
      ctx.fillStyle = '#2b1a12'; ell(ctx, 5.6, -4.2, 2, 2.3); ctx.fill();
      ctx.fillStyle = '#fff'; ell(ctx, 6.2, -5, .8, .8); ctx.fill();
      if (o.sad) { ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(3, -8.5); ctx.lineTo(8, -7); ctx.stroke(); }
    }
    if (o.happy && !sleep) { ctx.fillStyle = 'rgba(255,120,140,.35)'; ell(ctx, 8, 0.5, 2.6, 1.6); ctx.fill(); }
    /* Stöckchen im Maul */
    if (o.carry === 'stick') {
      ctx.strokeStyle = '#7b4f2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 5); ctx.lineTo(26, 3); ctx.stroke();
      ctx.strokeStyle = '#a06c3c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(20, 3.4); ctx.lineTo(24, -1); ctx.stroke();
    } else if (o.carry === 'ball') {
      ctx.fillStyle = '#d8f24a'; ctx.beginPath(); ctx.arc(14, 5, 4.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(14, 5, 3, -1, 1); ctx.stroke();
    }
    /* vorderes Schlappohr */
    var earA = Math.sin(walk * 1) * 0.28 * mv + (o.earUp || 0) * -0.6 + Math.sin(t * 2.3) * 0.04;
    ctx.save(); ctx.translate(-1.5, -8); ctx.rotate(earA + 0.15);
    ctx.fillStyle = lg(ctx, 0, 0, 0, 14, [0, EAR, 1, '#7b4320']);
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.bezierCurveTo(-7, 3, -7, 12, -3, 15); ctx.bezierCurveTo(1, 16, 4, 12, 3.5, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    /* Accessoires */
    var acc = o.acc || {};
    if (acc.face === 'glasses' && !sleep) {
      ctx.fillStyle = '#16161c'; G.roundRect(ctx, 1.5, -7.5, 8, 5.6, 2); ctx.fill();
      ctx.strokeStyle = '#16161c'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(9, -5.5); ctx.lineTo(14, -4); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(3, -6.8, 2.5, 1.2);
    }
    if (acc.hat) A.dogHat(ctx, acc.hat, t);
    ctx.restore();
    /* Halsband sitzt am Hals (zwischen Körper und Kopf) */
    if (acc.collar && !lie) {
      ctx.save(); ctx.translate(hx - 3, hy + 6); ctx.rotate(tilt * .5 - .3);
      if (acc.collar === 'bandana') {
        ctx.fillStyle = '#d6334a'; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(6, -3); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; [[-2, 0], [2, 1], [0, 4]].forEach(function (d) { ctx.beginPath(); ctx.arc(d[0], d[1], .8, 0, TAU); ctx.fill(); });
      } else {
        var col = { 'collar-red': '#e0343f', 'collar-blue': '#2f6fe0', 'collar-gold': '#f2c33d' }[acc.collar] || '#e0343f';
        ctx.strokeStyle = col; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 3, 0, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, 4.2, 1.9, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
    /* Weltposition der Halsband-Öse (für die Leine) */
    return { lx: o.x + (hx - 3) * (o.face || 1) * s, ly: o.y + (hy + 8) * s };
  };
  A.dogHat = function (ctx, hat, t) {
    ctx.save(); ctx.translate(2, -11);
    if (hat === 'hat-party') {
      ctx.rotate(-0.25);
      ctx.fillStyle = lg(ctx, -5, 0, 5, -14, [0, '#7c5cff', 1, '#ff5fa2']);
      ctx.beginPath(); ctx.moveTo(-5.5, 1); ctx.lineTo(5.5, 1); ctx.lineTo(0, -14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd166'; [[-2, -3], [1.5, -7], [-.5, -10]].forEach(function (d) { ctx.beginPath(); ctx.arc(d[0], d[1], 1, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -14.5, 2.2, 0, TAU); ctx.fill();
    } else if (hat === 'hat-flower') {
      var cols = ['#ff6b8b', '#ffd166', '#ffffff', '#b28dff', '#ff9f43'];
      for (var i = 0; i < 7; i++) { var a = Math.PI + i / 6 * Math.PI; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(Math.cos(a) * 8.5, 2 + Math.sin(a) * 3.2, 2.3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#5fae55'; ctx.beginPath(); ctx.ellipse(-6, -1, 2.4, 1, -.5, 0, TAU); ctx.fill();
    } else if (hat === 'hat-cap') {
      ctx.fillStyle = '#2f6fe0'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#1f4fb0'; ctx.beginPath(); ctx.ellipse(9, .5, 7, 2, 0.05, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -6.6, 1.3, 0, TAU); ctx.fill();
    } else if (hat === 'hat-crown') {
      var bob = Math.sin(t * 3) * .4;
      ctx.translate(0, bob);
      ctx.fillStyle = lg(ctx, 0, -10, 0, 1, [0, '#fff3b0', .5, '#f5c542', 1, '#c9921f']);
      ctx.beginPath(); ctx.moveTo(-7, 1); ctx.lineTo(-8, -8); ctx.lineTo(-4, -4); ctx.lineTo(0, -10); ctx.lineTo(4, -4); ctx.lineTo(8, -8); ctx.lineTo(7, 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0343f'; ctx.beginPath(); ctx.arc(0, -3, 1.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3aa0ff'; ctx.beginPath(); ctx.arc(-4.5, -2, 1.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(4.5, -2, 1.1, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  /* ================= Die Spielerin ================= */
  A.player = function (ctx, o) {
    var t = o.t || 0, walk = o.walk || 0, mv = o.move || 0, f = o.face || 1;
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(f, 1);
    A.shadow(ctx, 0, 0, 12, 4, .25);
    var bob = -Math.abs(Math.sin(walk)) * 2 * mv, sw = Math.sin(walk) * mv;
    /* Beine */
    ctx.lineCap = 'round';
    [[-3, 1], [3, -1]].forEach(function (l, i) {
      var off = l[1] * sw * 5;
      ctx.strokeStyle = i ? '#f0c398' : '#d9a77c'; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(l[0], -13 + bob); ctx.lineTo(l[0] + off, -2); ctx.stroke();
      ctx.fillStyle = i ? '#ffffff' : '#e8e4e0'; ell(ctx, l[0] + off + 1.2, -1.4, 3, 1.8); ctx.fill();
    });
    /* hinterer Arm */
    ctx.strokeStyle = '#d9a77c'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(-5, -29 + bob); ctx.lineTo(-7 - sw * 4, -19 + bob); ctx.stroke();
    /* Kleid */
    var hem = Math.sin(walk * 2) * 1.2 * mv;
    ctx.fillStyle = lg(ctx, 0, -32, 0, -11, [0, '#ff9ec6', 1, '#e85d9a']);
    ctx.beginPath(); ctx.moveTo(-6, -31 + bob); ctx.quadraticCurveTo(0, -34 + bob, 6, -31 + bob);
    ctx.lineTo(10 + hem, -12 + bob); ctx.quadraticCurveTo(0, -9 + bob, -10 + hem, -12 + bob); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(140,30,80,.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(-4, -29 + bob); ctx.quadraticCurveTo(-6, -20 + bob, -8 + hem, -13 + bob); ctx.lineTo(-5 + hem, -13 + bob); ctx.quadraticCurveTo(-3, -21 + bob, -1, -30 + bob); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-6, -24 + bob, 12, 1.8);
    /* Kopf */
    var hy = -39 + bob;
    /* Zopf schwingt */
    var bx = -6, by = hy - 1;
    ctx.fillStyle = '#5a3319';
    for (var i = 0; i < 4; i++) {
      bx += -1.5 - Math.sin(t * 4 + i * .6) * .6 * (0.3 + mv); by += 3.4;
      ell(ctx, bx, by, 2.8 - i * .3, 2.4); ctx.fill();
    }
    ctx.fillStyle = '#ff6b9d'; ell(ctx, bx - .5, by + 2.4, 1.8, 1.3); ctx.fill();
    ctx.fillStyle = rg(ctx, 1, hy, 1, 9, [0, '#ffe6c9', 1, '#f0bf92'], -1, hy - 3);
    ctx.beginPath(); ctx.arc(1, hy, 8.2, 0, TAU); ctx.fill();
    ctx.fillStyle = rg(ctx, -1, hy - 4, 1, 10, [0, '#86522c', 1, '#5a3319']);
    ctx.beginPath(); ctx.moveTo(-7.5, hy + 2); ctx.bezierCurveTo(-9, hy - 10, 8, hy - 13, 9.4, hy - 2);
    ctx.bezierCurveTo(6, hy - 6, 1, hy - 7, -1, hy - 4); ctx.bezierCurveTo(-3, hy - 1, -5, hy + 2, -7.5, hy + 2); ctx.fill();
    ctx.fillStyle = '#2d1d14'; ell(ctx, 5, hy + .5, 1.2, 1.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,140,.45)'; ell(ctx, 5.5, hy + 3.5, 2, 1.2); ctx.fill();
    ctx.strokeStyle = '#a8583f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(6.5, hy + 3.5, 1.8, .3, 1.8); ctx.stroke();
    /* vorderer Arm mit Hand (hält die Leine) */
    var hx = 6 + sw * 3, hyy = -19 + bob;
    if (o.throwT > 0) { var k = o.throwT; hx = 4 + Math.cos(k * 3) * 9; hyy = -26 - Math.sin(k * 3) * 10 + bob; }
    ctx.strokeStyle = '#f0c398'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(4, -29 + bob); ctx.lineTo(hx, hyy); ctx.stroke();
    ctx.fillStyle = '#f0c398'; ctx.beginPath(); ctx.arc(hx, hyy, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
    return { hx: o.x + hx * f, hy: o.y + hyy };
  };

  /* ================= Natur ================= */
  function blob(ctx, x, y, r, c1, c2, hl) {
    ctx.fillStyle = rg(ctx, x - r * .3, y - r * .35, r * .1, r * 1.05, [0, c1, 1, c2]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (hl) { ctx.fillStyle = 'rgba(255,255,230,' + hl + ')'; ell(ctx, x - r * .35, y - r * .45, r * .45, r * .3, -.4); ctx.fill(); }
  }
  A.tree = function (kind) {
    if (kind === 'pine') return G.sprite('pine', 70, 110, 35, 104, function (c) {
      c.fillStyle = '#6b4226'; c.fillRect(31, 82, 8, 22);
      [[35, 12, 18, 30], [35, 32, 26, 34], [35, 54, 32, 36]].forEach(function (l, i) {
        c.fillStyle = lg(c, 0, l[1], 0, l[1] + l[3], [0, i ? '#3f8a4a' : '#57a35e', 1, '#1f5a33']);
        c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[0] + l[2], l[1] + l[3]); c.quadraticCurveTo(l[0], l[1] + l[3] + 6, l[0] - l[2], l[1] + l[3]); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,220,.13)'; c.beginPath(); c.moveTo(l[0], l[1] + 2); c.lineTo(l[0] - l[2] * .55, l[1] + l[3] - 2); c.lineTo(l[0] - 3, l[1] + l[3] - 4); c.closePath(); c.fill();
      });
    });
    if (kind === 'sakura') return G.sprite('sakura', 110, 112, 55, 106, function (c) {
      c.strokeStyle = '#5b3a2c'; c.lineCap = 'round';
      c.lineWidth = 9; c.beginPath(); c.moveTo(55, 106); c.quadraticCurveTo(52, 80, 58, 60); c.stroke();
      c.lineWidth = 4; c.beginPath(); c.moveTo(56, 72); c.quadraticCurveTo(40, 62, 30, 52); c.moveTo(57, 66); c.quadraticCurveTo(72, 56, 82, 48); c.stroke();
      [[55, 38, 26], [30, 48, 20], [82, 46, 21], [42, 26, 18], [70, 26, 19], [55, 56, 18], [20, 60, 13], [92, 60, 13]].forEach(function (b, i) { blob(c, b[0], b[1], b[2], i % 3 ? '#ffd3e2' : '#ffe6ef', '#f08bb0', .25); });
      for (var i = 0; i < 40; i++) { c.fillStyle = Math.random() < .5 ? '#fff' : '#ff9ec0'; c.globalAlpha = .7; c.beginPath(); c.arc(15 + Math.random() * 80, 15 + Math.random() * 55, 1.4, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    });
    var v = kind === 'oak2' ? 1 : 0;
    return G.sprite('oak' + v, 100, 116, 50, 110, function (c) {
      c.fillStyle = lg(c, 44, 0, 58, 0, [0, '#7a4e2e', 1, '#55331d']);
      c.beginPath(); c.moveTo(43, 110); c.quadraticCurveTo(46, 84, 44, 66); c.lineTo(57, 66); c.quadraticCurveTo(54, 86, 58, 110); c.closePath(); c.fill();
      c.strokeStyle = '#55331d'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(50, 76); c.lineTo(36, 64); c.moveTo(52, 72); c.lineTo(66, 60); c.stroke();
      var blobs = v ? [[50, 44, 30], [26, 56, 20], [74, 56, 21], [36, 30, 20], [64, 30, 21], [50, 20, 18]] : [[50, 46, 28], [28, 54, 21], [72, 52, 22], [40, 28, 21], [62, 26, 20], [50, 62, 18]];
      blobs.forEach(function (b) { blob(c, b[0] + 2, b[1] + 4, b[2], '#2f6b34', '#1d4a25'); });
      blobs.forEach(function (b, i) { blob(c, b[0], b[1], b[2] - 1, i % 2 ? '#7cc06a' : '#8ccf73', '#3e8a41', .22); });
      for (var i = 0; i < 26; i++) { c.fillStyle = 'rgba(255,255,210,' + (.08 + Math.random() * .12) + ')'; c.beginPath(); c.arc(22 + Math.random() * 56, 14 + Math.random() * 50, 2 + Math.random() * 3, 0, TAU); c.fill(); }
      if (!v) { c.fillStyle = '#e8434f'; [[34, 40], [62, 50], [48, 30], [70, 34]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], 2.6, 0, TAU); c.fill(); }); }
    });
  };
  A.rock = function (v) {
    return G.sprite('rock' + v, 56, 42, 28, 36, function (c) {
      var r = G.rng(v * 97 + 3);
      var pts = []; for (var i = 0; i < 8; i++) { var a = i / 8 * TAU, rr = 20 + r() * 6; pts.push({ x: 28 + Math.cos(a) * rr, y: 24 + Math.sin(a) * rr * .62 - (Math.sin(a) < 0 ? 4 : 0) }); }
      c.fillStyle = lg(c, 0, 4, 0, 38, [0, '#c9c2b6', .5, '#9e968a', 1, '#6f685e']);
      c.beginPath(); G.smoothPath(c, pts, true); c.fill();
      c.strokeStyle = 'rgba(40,35,30,.35)'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.22)'; ell(c, 22, 14, 9, 4, -.3); c.fill();
      c.fillStyle = 'rgba(95,160,80,.55)'; ell(c, 30, 8 + r() * 4, 7, 2.5, .2); c.fill();
    });
  };
  A.bush = function (v) {
    return G.sprite('bush' + v, 64, 46, 32, 42, function (c) {
      [[20, 28, 14], [44, 28, 15], [32, 20, 16]].forEach(function (b) { blob(c, b[0] + 1, b[1] + 3, b[2], '#2c6431', '#1b4421'); });
      [[20, 28, 13], [44, 28, 14], [32, 19, 15]].forEach(function (b) { blob(c, b[0], b[1], b[2], '#79bf68', '#3b8a3f', .2); });
      if (v === 1) { c.fillStyle = '#ff6b8b'; [[22, 22], [38, 14], [46, 26], [30, 30], [16, 32]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], 2.4, 0, TAU); c.fill(); }); }
      if (v === 2) { c.fillStyle = '#fff'; [[22, 22], [38, 14], [46, 26], [30, 30]].forEach(function (p) { for (var k = 0; k < 5; k++) { c.beginPath(); c.arc(p[0] + Math.cos(k * 1.26) * 2, p[1] + Math.sin(k * 1.26) * 2, 1.3, 0, TAU); c.fill(); } }); }
    });
  };
  A.flower = function (v) {
    var cols = [['#ff6b8b', '#ffd166'], ['#ffd166', '#ff9f43'], ['#b28dff', '#fff3b0'], ['#ffffff', '#ffd166'], ['#ff9f43', '#fff']][v % 5];
    return G.sprite('flower' + v, 22, 26, 11, 24, function (c) {
      c.strokeStyle = '#3f8a41'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(11, 24); c.quadraticCurveTo(10, 16, 11, 9); c.stroke();
      c.fillStyle = '#5fae55'; ell(c, 7, 18, 3.5, 1.5, -.5); c.fill();
      c.fillStyle = cols[0]; for (var i = 0; i < 5; i++) { var a = i / 5 * TAU; ell(c, 11 + Math.cos(a) * 3.6, 8 + Math.sin(a) * 3.6, 3, 2.2, a); c.fill(); }
      c.fillStyle = cols[1]; c.beginPath(); c.arc(11, 8, 2.2, 0, TAU); c.fill();
    });
  };
  A.mushroom = function () {
    return G.sprite('mush', 20, 20, 10, 18, function (c) {
      c.fillStyle = '#f4ead8'; c.fillRect(8, 9, 4, 9);
      c.fillStyle = lg(c, 0, 2, 0, 11, [0, '#ff5a4f', 1, '#c4302b']); c.beginPath(); c.ellipse(10, 10, 8, 7, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#fff'; [[7, 6], [12, 5], [14, 8.5], [5, 9]].forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], 1.1, 0, TAU); c.fill(); });
    });
  };
  A.lamp = function () {
    return G.sprite('lamp', 24, 70, 12, 66, function (c) {
      c.fillStyle = '#2d3436'; c.fillRect(10.5, 14, 3, 50); c.fillRect(6, 62, 12, 4);
      c.fillStyle = '#2d3436'; c.beginPath(); c.moveTo(5, 8); c.lineTo(19, 8); c.lineTo(16, 2); c.lineTo(8, 2); c.closePath(); c.fill();
      c.fillStyle = '#fff1b8'; c.fillRect(7, 8, 10, 8);
      c.fillStyle = '#2d3436'; c.fillRect(6, 15.5, 12, 2);
    });
  };
  A.bench = function () {
    return G.sprite('bench', 70, 40, 35, 36, function (c) {
      c.fillStyle = '#3d3d3d'; c.fillRect(8, 20, 4, 16); c.fillRect(58, 20, 4, 16);
      c.fillStyle = lg(c, 0, 4, 0, 26, [0, '#b07a4a', 1, '#7a4e2a']);
      for (var i = 0; i < 3; i++) { G.roundRect(c, 4, 4 + i * 6, 62, 4.5, 2); c.fill(); }
      c.fillStyle = '#9a6a3c'; G.roundRect(c, 2, 22, 66, 6, 2); c.fill();
    });
  };
  A.sign = function (emoji, label) {
    return G.sprite('sign' + emoji, 70, 60, 35, 56, function (c) {
      c.fillStyle = '#6b4226'; c.fillRect(32, 22, 6, 34);
      c.fillStyle = lg(c, 0, 4, 0, 30, [0, '#d9a066', 1, '#a86f3d']);
      G.roundRect(c, 6, 4, 58, 24, 6); c.fill(); c.strokeStyle = '#6b4226'; c.lineWidth = 2; c.stroke();
      c.font = '15px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(emoji, 18, 16.5);
      c.fillStyle = '#4a2c14'; c.font = '800 9px ' + G.FONT; c.fillText(label, 42, 17);
    });
  };

  /* ================= Gebäude ================= */
  A.house = function () {
    return G.sprite('house', 280, 250, 140, 240, function (c) {
      /* Wände */
      c.fillStyle = lg(c, 0, 100, 0, 240, [0, '#fff4dc', 1, '#efd4a8']);
      c.fillRect(30, 100, 220, 140);
      c.strokeStyle = '#8a5a3a'; c.lineWidth = 5;
      [[30, 100, 30, 240], [250, 100, 250, 240], [30, 160, 250, 160], [110, 100, 110, 240], [170, 100, 170, 240]].forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
      c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(30, 100, 220, 14);
      /* Fundament */
      c.fillStyle = '#9b958a'; c.fillRect(24, 232, 232, 10);
      for (var i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#8a847a' : '#a8a296'; c.fillRect(24 + i * 19.3, 232, 18, 10); }
      /* Dach */
      c.fillStyle = lg(c, 0, 10, 0, 110, [0, '#e06a55', 1, '#a8382e']);
      c.beginPath(); c.moveTo(10, 108); c.lineTo(140, 14); c.lineTo(270, 108); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(90,20,15,.35)'; c.lineWidth = 1.5;
      for (var r = 0; r < 7; r++) { var y = 30 + r * 12.5, hw = (y - 14) / 94 * 130; c.beginPath(); for (var k = -hw; k < hw; k += 12) { c.moveTo(140 + k, y); c.quadraticCurveTo(140 + k + 6, y + 6, 140 + k + 12, y); } c.stroke(); }
      c.fillStyle = '#7a2a22'; c.beginPath(); c.moveTo(4, 112); c.lineTo(140, 10); c.lineTo(276, 112); c.lineTo(268, 112); c.lineTo(140, 20); c.lineTo(12, 112); c.closePath(); c.fill();
      /* Schornstein */
      c.fillStyle = '#8a4a3a'; c.fillRect(196, 30, 22, 46); c.fillStyle = '#6a3a2a'; c.fillRect(192, 26, 30, 8);
      /* Tür */
      c.fillStyle = lg(c, 0, 168, 0, 236, [0, '#8a5a3a', 1, '#5e3a22']);
      c.beginPath(); c.moveTo(122, 236); c.lineTo(122, 182); c.arc(140, 182, 18, Math.PI, 0); c.lineTo(158, 236); c.closePath(); c.fill();
      c.strokeStyle = '#4a2c14'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(152, 210, 2.4, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,240,200,.5)'; c.beginPath(); c.arc(140, 182, 9, Math.PI, 0); c.fill();
      /* Fenster */
      [[52, 120], [182, 120], [52, 182], [192, 182]].forEach(function (w, i) {
        if (i === 3) return;
        c.fillStyle = '#5e3a22'; c.fillRect(w[0] - 4, w[1] - 4, 50, 40);
        c.fillStyle = lg(c, 0, w[1], 0, w[1] + 32, [0, '#bfe8f5', 1, '#7cc4de']); c.fillRect(w[0], w[1], 42, 32);
        c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.strokeRect(w[0], w[1], 42, 32); c.beginPath(); c.moveTo(w[0] + 21, w[1]); c.lineTo(w[0] + 21, w[1] + 32); c.moveTo(w[0], w[1] + 16); c.lineTo(w[0] + 42, w[1] + 16); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(w[0] + 3, w[1] + 3); c.lineTo(w[0] + 14, w[1] + 3); c.lineTo(w[0] + 3, w[1] + 13); c.fill();
        /* Blumenkasten */
        c.fillStyle = '#8a5a3a'; c.fillRect(w[0] - 4, w[1] + 34, 50, 7);
        for (var f = 0; f < 7; f++) { c.fillStyle = ['#ff6b8b', '#ffd166', '#ff9f43', '#b28dff'][f % 4]; c.beginPath(); c.arc(w[0] + 2 + f * 6.5, w[1] + 33, 2.8, 0, TAU); c.fill(); }
      });
      /* Briefkasten-Schild */
      c.fillStyle = '#fff4dc'; G.roundRect(c, 112, 150, 56, 14, 4); c.fill(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#6b4226'; c.font = '800 9px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ZUHAUSE', 140, 157.5);
    });
  };
  A.pavilion = function () {
    return G.sprite('pavilion', 230, 200, 115, 192, function (c) {
      c.fillStyle = '#b9b2a6'; c.fillRect(20, 176, 190, 16); c.fillStyle = '#9e978b'; c.fillRect(20, 188, 190, 4);
      c.fillStyle = '#d9c8a0'; c.fillRect(34, 92, 162, 86);
      for (var i = 0; i < 6; i++) {
        c.fillStyle = '#f7efdc'; c.fillRect(40 + i * 26, 100, 22, 72);
        c.strokeStyle = '#8a5a3a'; c.lineWidth = 1.4; c.strokeRect(40 + i * 26, 100, 22, 72);
        c.beginPath(); for (var k = 1; k < 4; k++) { c.moveTo(40 + i * 26, 100 + k * 18); c.lineTo(62 + i * 26, 100 + k * 18); } c.moveTo(51 + i * 26, 100); c.lineTo(51 + i * 26, 172); c.stroke();
      }
      c.fillStyle = '#7a1f1f'; [34, 190].forEach(function (x) { c.fillRect(x - 3, 88, 9, 92); });
      /* geschwungenes Dach */
      c.fillStyle = lg(c, 0, 20, 0, 96, [0, '#4a4f58', 1, '#2b2f36']);
      c.beginPath(); c.moveTo(4, 86); c.quadraticCurveTo(40, 80, 60, 50); c.lineTo(170, 50); c.quadraticCurveTo(190, 80, 226, 86); c.quadraticCurveTo(200, 98, 115, 96); c.quadraticCurveTo(30, 98, 4, 86); c.fill();
      c.fillStyle = lg(c, 0, 10, 0, 52, [0, '#5a606a', 1, '#3a3f47']);
      c.beginPath(); c.moveTo(40, 54); c.quadraticCurveTo(70, 46, 82, 22); c.lineTo(148, 22); c.quadraticCurveTo(160, 46, 190, 54); c.closePath(); c.fill();
      c.fillStyle = '#c9a227'; c.fillRect(104, 8, 22, 16); c.beginPath(); c.arc(115, 8, 6, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
      for (var r = 0; r < 14; r++) { c.beginPath(); c.moveTo(60 + r * 8, 52); c.lineTo(58 + r * 8.4, 92); c.stroke(); }
      c.fillStyle = '#b8322a'; c.fillRect(30, 84, 170, 5);
    });
  };
  A.torii = function () {
    return G.sprite('torii', 120, 110, 60, 106, function (c) {
      c.fillStyle = lg(c, 0, 0, 120, 0, [0, '#c0392b', .5, '#e74c3c', 1, '#a93226']);
      c.fillRect(22, 26, 10, 80); c.fillRect(88, 26, 10, 80);
      c.fillStyle = '#2c2c2c'; c.fillRect(20, 98, 14, 8); c.fillRect(86, 98, 14, 8);
      c.fillStyle = '#c0392b'; c.fillRect(12, 34, 96, 8);
      c.fillStyle = '#2c2c2c'; c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(60, 24, 120, 14); c.lineTo(116, 24); c.quadraticCurveTo(60, 30, 4, 24); c.closePath(); c.fill();
      c.fillStyle = '#e74c3c'; c.beginPath(); c.moveTo(4, 24); c.quadraticCurveTo(60, 30, 116, 24); c.lineTo(112, 28); c.quadraticCurveTo(60, 34, 8, 28); c.closePath(); c.fill();
      c.fillStyle = '#f5e6c8'; c.fillRect(52, 28, 16, 12); c.fillStyle = '#2c2c2c'; c.font = '800 8px ' + G.FONT; c.textAlign = 'center'; c.fillText('⛩', 60, 37);
    });
  };
  A.stoneLantern = function () {
    return G.sprite('slantern', 30, 50, 15, 47, function (c) {
      c.fillStyle = '#9e978b'; c.fillRect(11, 26, 8, 18); c.fillRect(6, 42, 18, 5);
      c.fillStyle = '#b9b2a6'; c.fillRect(7, 14, 16, 13);
      c.fillStyle = '#ffe9a8'; c.fillRect(11, 17, 8, 7);
      c.fillStyle = '#8a847a'; c.beginPath(); c.moveTo(3, 15); c.lineTo(27, 15); c.lineTo(20, 6); c.lineTo(10, 6); c.closePath(); c.fill();
      c.beginPath(); c.arc(15, 5, 3, 0, TAU); c.fill();
    });
  };
  A.caveHill = function () {
    return G.sprite('cave', 220, 160, 110, 150, function (c) {
      var r = G.rng(42), pts = [];
      for (var i = 0; i <= 12; i++) { var a = Math.PI + i / 12 * Math.PI; pts.push({ x: 110 + Math.cos(a) * (100 + r() * 10), y: 150 + Math.sin(a) * (120 + r() * 14) }); }
      c.fillStyle = lg(c, 0, 20, 0, 150, [0, '#b3ab9e', .6, '#857d70', 1, '#5e574d']);
      c.beginPath(); G.smoothPath(c, pts, false); c.lineTo(214, 150); c.lineTo(6, 150); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.15)'; for (i = 0; i < 9; i++) { ell(c, 50 + r() * 120, 50 + r() * 60, 10 + r() * 14, 4 + r() * 4, r() - .5); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.12)'; for (i = 0; i < 9; i++) { ell(c, 30 + r() * 160, 70 + r() * 70, 8 + r() * 12, 3 + r() * 3, r() - .5); c.fill(); }
      /* Moos oben */
      c.fillStyle = '#5f9e4f'; c.beginPath(); c.moveTo(40, 52); c.quadraticCurveTo(110, 12, 180, 52); c.quadraticCurveTo(150, 40, 110, 38); c.quadraticCurveTo(70, 40, 40, 52); c.fill();
      for (i = 0; i < 18; i++) { blob(c, 50 + r() * 120, 30 + r() * 26, 4 + r() * 5, '#79bf68', '#3e8a41'); }
      /* Höhlenöffnung */
      c.fillStyle = rg(c, 110, 140, 6, 62, [0, '#000', .7, '#120c08', 1, '#2b221a']);
      c.beginPath(); c.moveTo(62, 150); c.quadraticCurveTo(60, 80, 110, 74); c.quadraticCurveTo(160, 80, 158, 150); c.closePath(); c.fill();
      c.fillStyle = '#6f685e'; [[80, 84, 6, 14], [100, 76, 5, 12], [124, 77, 6, 15], [143, 88, 5, 11]].forEach(function (s) { c.beginPath(); c.moveTo(s[0] - s[2], s[1]); c.lineTo(s[0] + s[2], s[1]); c.lineTo(s[0], s[1] + s[3]); c.closePath(); c.fill(); });
    });
  };
  A.gate = function () {
    return G.sprite('gate', 110, 70, 55, 64, function (c) {
      c.fillStyle = '#6b4226'; c.fillRect(6, 4, 10, 62); c.fillRect(94, 4, 10, 62);
      c.fillStyle = '#4a2c14'; c.beginPath(); c.arc(11, 4, 6, 0, TAU); c.arc(99, 4, 6, 0, TAU); c.fill();
      c.strokeStyle = '#8a5a3a'; c.lineWidth = 5;
      for (var i = 0; i < 5; i++) { c.beginPath(); c.moveTo(22 + i * 15, 18); c.lineTo(22 + i * 15, 60); c.stroke(); }
      c.beginPath(); c.moveTo(16, 22); c.lineTo(94, 22); c.moveTo(16, 50); c.lineTo(94, 50); c.moveTo(18, 50); c.lineTo(92, 22); c.stroke();
      c.fillStyle = '#ffd166'; G.roundRect(c, 32, 28, 46, 14, 4); c.fill();
      c.fillStyle = '#5a3a00'; c.font = '800 8px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🚗 STRASSE', 55, 35.5);
    });
  };
  A.fencePost = function () {
    return G.sprite('fence', 40, 36, 20, 32, function (c) {
      c.fillStyle = lg(c, 0, 0, 0, 36, [0, '#b07a4a', 1, '#7a4e2a']);
      c.fillRect(16, 2, 8, 30); c.beginPath(); c.moveTo(16, 2); c.lineTo(20, -2); c.lineTo(24, 2); c.fill();
      c.fillRect(0, 9, 40, 5); c.fillRect(0, 20, 40, 5);
      c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(0, 9, 40, 1.5); c.fillRect(0, 20, 40, 1.5);
    });
  };
  A.poop = function (ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    A.shadow(ctx, 0, 1, 8, 2.5, .2);
    ctx.fillStyle = '#7a4a24'; ell(ctx, 0, -2, 8, 4); ctx.fill(); ell(ctx, 0, -6, 6, 3.4); ctx.fill(); ell(ctx, .5, -9.5, 3.6, 2.6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ell(ctx, -2, -7, 2, 1); ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,90,.6)'; ctx.lineWidth = 1;
    for (var i = 0; i < 2; i++) { var a = t * 3 + i * 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 9, -16 + Math.sin(a * 1.3) * 3, 1.2, 0, TAU); ctx.stroke(); }
    ctx.restore();
  };
  A.bone = function (ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#c9b48a';
    [[-7.5, -2.6], [-7.5, 2.6], [7.5, -2.6], [7.5, 2.6]].forEach(function (k) { ctx.beginPath(); ctx.arc(k[0], k[1] + .6, 3.4, 0, TAU); ctx.fill(); });
    ctx.fillRect(-7.5, -2, 15, 5);
    ctx.fillStyle = '#fff8ea';
    [[-7.5, -2.6], [-7.5, 2.6], [7.5, -2.6], [7.5, 2.6]].forEach(function (k) { ctx.beginPath(); ctx.arc(k[0], k[1], 3, 0, TAU); ctx.fill(); });
    ctx.fillRect(-7.5, -2.2, 15, 4.4);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(-5, -1.6, 9, 1.2);
    ctx.restore();
  };
  A.stick = function (ctx, x, y, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.strokeStyle = '#7b4f2a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(8, -5); ctx.stroke();
    ctx.restore();
  };
  A.butterfly = function (ctx, x, y, t, col) {
    var f = Math.abs(Math.sin(t * 18)) * .85 + .15;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(-3 * f, -2, 4 * f, 3, -.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3 * f, -2, 4 * f, 3, .4, 0, TAU); ctx.fill();
    ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(-2.4 * f, 2, 2.6 * f, 2, .4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(2.4 * f, 2, 2.6 * f, 2, -.4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#2d2d2d'; ctx.fillRect(-.6, -4, 1.2, 7);
    ctx.restore();
  };
  /* Sprechblase / Hinweis über einem Ort */
  A.prompt = function (ctx, x, y, text, t, active) {
    ctx.save();
    ctx.font = '800 13px ' + G.FONT;
    var w = ctx.measureText(text).width + 22, h = 26, bob = Math.sin(t * 4) * 2.5;
    ctx.translate(x, y + bob);
    ctx.globalAlpha = active ? 1 : .85;
    ctx.fillStyle = active ? '#ffd166' : 'rgba(255,255,255,.92)';
    ctx.beginPath(); G.roundRect(ctx, -w / 2, -h, w, h, 13); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, 7); ctx.lineTo(6, 0); ctx.fill();
    ctx.fillStyle = active ? '#4a2c00' : '#2b3a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -h / 2 + .5);
    ctx.restore();
  };
  /* Hund im Kleinformat für die Garderobe */
  A.dogPreview = function (canvas, acc) {
    var c = canvas.getContext('2d'), S = 2; canvas.width = 140; canvas.height = 108;
    c.setTransform(S, 0, 0, S, 0, 0); c.clearRect(0, 0, 70, 54);
    A.dog(c, { x: 29, y: 51, face: 1, t: 1, wag: .6, acc: acc, scale: 1.28, happy: true });
  };
})();
