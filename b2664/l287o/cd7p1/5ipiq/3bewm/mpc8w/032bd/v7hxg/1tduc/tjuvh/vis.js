/* Animierte Visualisierungen, gesteuert über den Fortschritt p (0…1) eines Podcast-Abschnitts */
(function () {
  'use strict';
  var W = 400, H = 300;
  var PAL = ['#7c5cff', '#ff5fa2', '#ffb347', '#4cc9ff', '#2fd17c', '#ff7a59', '#b18cff', '#ffd166'];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function ap(p, i, n, span) { /* Einblend-Fortschritt von Element i aus n */ var s = i / (n + (span || .6)); return ease((p - s) * (n + 1) * 1.4); }
  /* auf schmalen Handys kleine Schrift etwas vergrößern */
  var FS = (window.innerWidth || 400) < 520 ? 1.12 : 1;
  function fs(n) { return n < 13 ? Math.min(13, n * FS) : n; }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + fs(o.size || 12) + '" font-weight="' + (o.w || 700) + '" fill="' + (o.fill || '#e9e9ff') + '" text-anchor="' + (o.anchor || 'middle') + '" opacity="' + (o.op === undefined ? 1 : o.op) + '"' + (o.mono ? ' font-family="ui-monospace,Menlo,monospace"' : '') + (o.extra || '') + '>' + esc(s) + '</text>';
  }
  function R(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + Math.max(0, w) + '" height="' + Math.max(0, h) + '" rx="' + (o.rx === undefined ? 8 : o.rx) + '" fill="' + (o.fill || '#232848') + '" stroke="' + (o.stroke || 'none') + '" stroke-width="' + (o.sw || 1.5) + '" opacity="' + (o.op === undefined ? 1 : o.op) + '"' + (o.extra || '') + '/>';
  }
  function L(x1, y1, x2, y2, o) { o = o || {}; return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (o.stroke || '#6f7399') + '" stroke-width="' + (o.sw || 2) + '" opacity="' + (o.op === undefined ? 1 : o.op) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + (o.arrow ? ' marker-end="url(#ar)"' : '') + '/>'; }
  function wrap(s, max) { var w = String(s).split(' '), lines = [], cur = ''; w.forEach(function (x) { if ((cur + ' ' + x).trim().length > max) { if (cur) lines.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) lines.push(cur); return lines; }
  function TW(x, y, s, max, o) { o = o || {}; var lh = (o.size || 12) * 1.25; return wrap(s, max).map(function (l, i) { return T(x, y + i * lh, l, o); }).join(''); }
  var DEFS = '<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9aa0d6"/></marker>' +
    '<linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".55" stop-color="#ff5fa2"/><stop offset="1" stop-color="#ffb347"/></linearGradient>' +
    '<radialGradient id="glow"><stop offset="0" stop-color="#ff5fa2" stop-opacity=".55"/><stop offset="1" stop-color="#ff5fa2" stop-opacity="0"/></radialGradient></defs>';

  var V = {};

  /* ---------- Stichpunkte mit Symbolen ---------- */
  V.points = function (v, p) {
    var it = v.items, n = it.length, cols = n > 4 ? 2 : 1, rows = Math.ceil(n / cols), out = '';
    var top = v.title ? 46 : 22, cw = cols === 2 ? 178 : 340, ch = Math.min(56, (H - top - 40) / rows - 8), x0 = cols === 2 ? 18 : 30;
    if (v.title) out += T(W / 2, 30, v.title, { size: 16, w: 900, fill: '#fff' });
    it.forEach(function (x, i) {
      var a = ap(p, i, n), c = i % cols, r = Math.floor(i / cols), xx = x0 + c * (cw + 8), yy = top + r * (ch + 8) + (1 - a) * 14;
      out += '<g opacity="' + a + '">' + R(xx, yy, cw, ch, { fill: 'rgba(255,255,255,.06)', stroke: 'rgba(255,255,255,.14)', rx: 12 }) +
        T(xx + 22, yy + ch / 2 + 7, x[0], { size: 20 }) + TW(xx + 44, yy + ch / 2 + (wrap(x[1], cols === 2 ? 21 : 42).length > 1 ? -2 : 4), x[1], cols === 2 ? 21 : 42, { size: 11.5, anchor: 'start', w: 700 }) + '</g>';
    });
    return out;
  };

  /* ---------- CPU-Virtualisierung: viele Prozesse, eine CPU ---------- */
  V.cpu = function (v, p, t) {
    var procs = v.procs || ['A', 'B', 'C', 'D'], n = procs.length, out = '', cx = W / 2, cy = 132;
    var speed = 1 + p * 7, active = Math.floor(t * speed) % n;
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="70" fill="url(#glow)"/>';
    out += R(cx - 42, cy - 42, 84, 84, { fill: '#1d2246', stroke: '#7c5cff', sw: 2.5, rx: 14 });
    for (var k = 0; k < 6; k++) { out += L(cx - 30 + k * 12, cy - 42, cx - 30 + k * 12, cy - 52, { stroke: '#7c5cff' }) + L(cx - 30 + k * 12, cy + 42, cx - 30 + k * 12, cy + 52, { stroke: '#7c5cff' }); }
    out += T(cx, cy - 4, 'CPU', { size: 20, w: 900 }) + T(cx, cy + 16, 'läuft: ' + procs[active], { size: 11, fill: PAL[active % 8] });
    procs.forEach(function (pr, i) {
      var a = ap(Math.min(1, p * 2), i, n), ang = -Math.PI / 2 + i / n * Math.PI * 2, px = cx + Math.cos(ang) * 150, py = cy + Math.sin(ang) * 96, on = i === active;
      out += L(cx + Math.cos(ang) * 56, cy + Math.sin(ang) * 56, px - Math.cos(ang) * 30, py - Math.sin(ang) * 20, { stroke: on ? PAL[i % 8] : '#3a3f6b', sw: on ? 3 : 1.5, op: a, dash: on ? '' : '4 4' });
      out += '<g opacity="' + a + '">' + R(px - 30, py - 18, 60, 36, { fill: on ? PAL[i % 8] : '#232848', stroke: PAL[i % 8], sw: 2, rx: 10 }) + T(px, py + 5, 'Prozess ' + pr, { size: 11, w: 900, fill: on ? '#fff' : '#cfd0f5' }) + '</g>';
    });
    out += T(cx, 278, p < .5 ? 'Time Sharing: abwechselnd kurze Zeitscheiben' : 'So schnell, dass jeder Prozess „seine eigene CPU" zu haben scheint', { size: 12, fill: '#c9c3ff' });
    return out;
  };

  /* ---------- Speicherlayout (Adressraum / physischer Speicher) ---------- */
  V.mem = function (v, p, t) {
    var regs = v.regions, out = '', x = v.x || 150, w = v.w || 100, y0 = 34, h = 222;
    if (v.title) out += T(W / 2, 22, v.title, { size: 14, w: 900 });
    out += R(x, y0, w, h, { fill: '#151935', stroke: '#4a4f80', rx: 6 });
    regs.forEach(function (r, i) {
      var a = ap(p, i, regs.length), ry = y0 + h * r[1] / 100, rh = h * (r[2] - r[1]) / 100;
      out += '<g opacity="' + a + '">' + R(x + 2, ry + 1, w - 4, rh - 2, { fill: r[3] || PAL[i % 8], rx: 4, op: r[4] === 'free' ? .18 : .9 }) +
        T(x + w / 2, ry + rh / 2 + 4, r[0], { size: rh < 20 ? 9 : 11.5, w: 900, fill: r[4] === 'free' ? '#9aa0d6' : '#fff' }) + '</g>';
    });
    (v.marks || []).forEach(function (m, i) { var yy = y0 + h * m[0] / 100; out += L(x - 8, yy, x, yy, { stroke: '#9aa0d6' }) + T(x - 12, yy + 4, m[1], { size: 10, anchor: 'end', fill: '#9aa0d6', mono: true }); });
    (v.arrows || []).forEach(function (ar) {
      var yy = y0 + h * ar[0] / 100, d = ar[1] === 'down' ? 1 : -1, bob = Math.sin(t * 3) * 5;
      out += L(x + w + 20, yy, x + w + 20, yy + d * (30 + bob), { stroke: '#ffb347', sw: 3, arrow: true, op: ease(p * 3) }) + T(x + w + 28, yy + d * 16, ar[2] || 'wächst', { size: 10, anchor: 'start', fill: '#ffb347', op: ease(p * 3) });
    });
    if (v.side) out += TW(x + w + 50, 70, v.side, 20, { size: 11.5, anchor: 'start', fill: '#c9c3ff', op: ease((p - .5) * 3) });
    return out;
  };

  /* ---------- Prozesszustände ---------- */
  V.states = function (v, p) {
    var pos = { Running: [200, 70], Ready: [80, 210], Blocked: [320, 210] }, de = { Running: 'Running', Ready: 'Ready', Blocked: 'Blocked' };
    var out = '';
    var edges = [['Ready', 'Running', 'eingeplant', -16], ['Running', 'Ready', 'verdrängt', 16], ['Running', 'Blocked', 'I/O startet', 0], ['Blocked', 'Ready', 'I/O fertig', 0]];
    edges.forEach(function (e) {
      var a = pos[e[0]], b = pos[e[1]], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * e[3], ny = dx / l * e[3];
      var x1 = a[0] + dx / l * 48 + nx, y1 = a[1] + dy / l * 30 + ny, x2 = b[0] - dx / l * 48 + nx, y2 = b[1] - dy / l * 30 + ny;
      out += L(x1, y1, x2, y2, { arrow: true, stroke: '#7d82b8' }) + T((x1 + x2) / 2 + nx * 1.6, (y1 + y2) / 2 + ny * 1.6 - 4, e[2], { size: 10, fill: '#b9bde6' });
    });
    var seq = v.seq || ['Ready', 'Running', 'Blocked', 'Ready', 'Running'], k = p * (seq.length - 1), i = Math.min(seq.length - 2, Math.floor(k)), f = ease((k - i) * 1.6);
    var A = pos[seq[i]], B = pos[seq[i + 1]] || A, cx = A[0] + (B[0] - A[0]) * f, cy = A[1] + (B[1] - A[1]) * f, cur = f > .5 ? seq[i + 1] : seq[i];
    Object.keys(pos).forEach(function (s) {
      var on = s === cur, c = s === 'Running' ? '#2fd17c' : s === 'Ready' ? '#4cc9ff' : '#ff7a59';
      out += R(pos[s][0] - 48, pos[s][1] - 26, 96, 52, { fill: on ? c : '#1d2246', stroke: c, sw: 2.5, rx: 26 }) + T(pos[s][0], pos[s][1] + 5, de[s], { size: 14, w: 900, fill: on ? '#0b0d1c' : '#fff' });
    });
    out += '<circle cx="' + cx + '" cy="' + (cy - 40) + '" r="13" fill="#ffd166" stroke="#fff" stroke-width="2"/>' + T(cx, cy - 36, v.proc || 'P', { size: 11, w: 900, fill: '#3a2400' });
    return out;
  };

  /* ---------- Code mit Ausführungsschritten ---------- */
  V.code = function (v, p) {
    var lines = v.code.split('\n'), steps = v.steps || lines.map(function (_, i) { return i; }), out = '', lh = Math.min(17, 200 / lines.length), y0 = v.title ? 40 : 24;
    var outLines = v.out || [], hasOut = outLines.length > 0, cw = hasOut ? 250 : 370;
    if (v.title) out += T(16, 24, v.title, { size: 12, anchor: 'start', fill: '#c9c3ff' });
    out += R(10, y0 - 14, cw, lines.length * lh + 16, { fill: '#090b18', stroke: '#2b3060', rx: 10 });
    var si = Math.min(steps.length - 1, Math.floor(p * steps.length)), cur = steps[si];
    lines.forEach(function (ln, i) {
      if (i === cur) out += R(12, y0 - 12 + i * lh, cw - 4, lh, { fill: 'rgba(255,95,162,.22)', rx: 4 });
      out += T(20, y0 + i * lh, ln, { size: Math.min(11, lh * .72), anchor: 'start', mono: true, w: 500, fill: i === cur ? '#fff' : '#b7bbe6', extra: ' xml:space="preserve"' });
    });
    if (hasOut) {
      out += R(268, y0 - 14, 122, 232, { fill: '#05060f', stroke: '#2b3060', rx: 10 }) + T(278, y0 + 2, '$ Ausgabe', { size: 10, anchor: 'start', fill: '#2fd17c', mono: true });
      var shown = Math.floor(ease(p * 1.1) * outLines.length + .0001);
      outLines.slice(0, shown).forEach(function (o, i) { out += TW(276, y0 + 22 + i * 26, o, 19, { size: 9.5, anchor: 'start', mono: true, w: 500, fill: '#d6ffe6' }); });
    }
    return out;
  };

  /* ---------- Scheduling-Gantt (wird berechnet) ---------- */
  function schedule(jobs, pol, q) {
    var J = jobs.map(function (j) { return { n: j[0], arr: j[1], len: j[2], rem: j[2], first: -1, done: -1 }; }), t = 0, slices = [], rrq = [], last = null;
    var guard = 0;
    while (J.some(function (j) { return j.rem > 0; }) && guard++ < 5000) {
      var ready = J.filter(function (j) { return j.arr <= t && j.rem > 0; });
      if (!ready.length) { t = Math.min.apply(null, J.filter(function (j) { return j.rem > 0; }).map(function (j) { return j.arr; })); continue; }
      var pick, run;
      if (pol === 'rr') {
        J.forEach(function (j) { if (j.arr <= t && j.rem > 0 && rrq.indexOf(j) < 0 && j !== last) rrq.push(j); });
        if (last && last.rem > 0) rrq.push(last);
        pick = rrq.shift(); run = Math.min(q, pick.rem);
      } else if (pol === 'fifo') { pick = ready.sort(function (a, b) { return a.arr - b.arr; })[0]; run = pick.rem; }
      else if (pol === 'sjf') { pick = ready.sort(function (a, b) { return a.len - b.len || a.arr - b.arr; })[0]; run = pick.rem; }
      else { /* stcf */
        pick = ready.sort(function (a, b) { return a.rem - b.rem || a.arr - b.arr; })[0];
        var nextArr = J.filter(function (j) { return j.arr > t; }).map(function (j) { return j.arr; });
        run = Math.min(pick.rem, nextArr.length ? Math.min.apply(null, nextArr) - t : pick.rem);
      }
      if (pick.first < 0) pick.first = t;
      if (slices.length && slices[slices.length - 1].n === pick.n && slices[slices.length - 1].e === t) slices[slices.length - 1].e += run;
      else slices.push({ n: pick.n, s: t, e: t + run });
      t += run; pick.rem -= run; if (pick.rem <= 0) pick.done = t;
      last = pol === 'rr' ? pick : null;
      if (pol === 'rr' && pick.rem <= 0) last = null;
    }
    return { slices: slices, jobs: J, end: t };
  }
  window.OSTEP_schedule = schedule;
  V.gantt = function (v, p) {
    var S = schedule(v.jobs, v.pol, v.q || 1), out = '', x0 = 50, x1 = 380, y0 = 60, total = Math.max(S.end, v.max || 0), names = v.jobs.map(function (j) { return j[0]; });
    var sc = (x1 - x0) / total, now = total * ease(p * 1.15);
    out += T(W / 2, 26, v.title || ({ fifo: 'FIFO', sjf: 'SJF', stcf: 'STCF', rr: 'Round Robin (Zeitscheibe ' + (v.q || 1) + ')' }[v.pol]), { size: 15, w: 900 });
    names.forEach(function (n, i) { var y = y0 + i * 34; out += T(x0 - 12, y + 18, n, { size: 13, w: 900, fill: PAL[i % 8] }) + L(x0, y + 28, x1, y + 28, { stroke: '#262a52', sw: 1 }); });
    S.slices.forEach(function (s) {
      var i = names.indexOf(s.n), y = y0 + i * 34, e = Math.min(s.e, now);
      if (e > s.s) out += R(x0 + s.s * sc, y + 4, (e - s.s) * sc, 22, { fill: PAL[i % 8], rx: 5 });
    });
    S.jobs.forEach(function (j, i) { var y = y0 + i * 34; out += '<path d="M' + (x0 + j.arr * sc) + ' ' + (y + 30) + ' l-4 7 h8 z" fill="#9aa0d6"/>'; });
    var ay = y0 + names.length * 34 + 8;
    out += L(x0, ay, x1, ay, { stroke: '#6f7399' });
    var step = total <= 30 ? 5 : total <= 60 ? 10 : total <= 150 ? 20 : 50;
    for (var k = 0; k <= total; k += step) out += L(x0 + k * sc, ay, x0 + k * sc, ay + 5, { stroke: '#6f7399' }) + T(x0 + k * sc, ay + 17, k, { size: 9.5, fill: '#9aa0d6' });
    out += L(x0 + now * sc, y0 - 4, x0 + now * sc, ay, { stroke: '#ffd166', sw: 1.5, dash: '3 3' });
    if (p > .8 && v.metric !== 'none') {
      var n = S.jobs.length, tat = S.jobs.reduce(function (a, j) { return a + j.done - j.arr; }, 0) / n, rsp = S.jobs.reduce(function (a, j) { return a + j.first - j.arr; }, 0) / n, a = ease((p - .8) * 5);
      var m = v.metric || 'tat', txt = (m !== 'resp' ? 'Ø Turnaround: ' + (+tat.toFixed(2)) : '') + (m === 'both' ? '   ·   ' : '') + (m !== 'tat' ? 'Ø Antwortzeit: ' + (+rsp.toFixed(2)) : '');
      out += R(W / 2 - 150, ay + 28, 300, 30, { fill: 'rgba(255,209,102,.15)', stroke: '#ffd166', op: a, rx: 15 }) + T(W / 2, ay + 48, txt, { size: 12.5, w: 900, fill: '#ffd166', op: a });
    }
    return out;
  };

  /* ---------- Tabellen-Protokoll (z. B. LDE) ---------- */
  V.table = function (v, p) {
    var cols = v.cols, rows = v.rows, n = rows.length, out = '', cw = (W - 20) / cols.length, rh = Math.min(30, (H - 50) / n);
    cols.forEach(function (c, i) { out += R(10 + i * cw + 2, 8, cw - 4, 26, { fill: PAL[[0, 3, 1][i] || i], rx: 8 }) + T(10 + i * cw + cw / 2, 26, c, { size: 11, w: 900, fill: '#fff' }); });
    rows.forEach(function (r, i) {
      var a = ap(p, i, n, .3), y = 40 + i * rh, c = r[0];
      out += '<g opacity="' + a + '">' + R(10 + c * cw + 4, y, cw - 8, rh - 4, { fill: 'rgba(255,255,255,.07)', stroke: 'rgba(255,255,255,.14)', rx: 6 }) + TW(10 + c * cw + cw / 2, y + rh / 2 + (wrap(r[1], 22).length > 1 ? -3 : 2), r[1], 22, { size: 9.5, w: 700 }) + '</g>';
      if (i > 0 && a > .5 && rows[i - 1][0] !== c) out += L(10 + rows[i - 1][0] * cw + cw / 2, y - 4, 10 + c * cw + cw / 2, y + 2, { stroke: '#ffb347', sw: 1.5, arrow: true, op: a });
    });
    return out;
  };

  /* ---------- Adressübersetzung ---------- */
  V.xlate = function (v, p) {
    var out = '';
    if (v.mode === 'bb') {
      var ok = v.va < v.bounds, steps = [ease(p * 4), ease(p * 4 - 1), ease(p * 4 - 2), ease(p * 4 - 3)];
      out += T(W / 2, 26, 'Base & Bounds (dynamische Relokation)', { size: 14, w: 900 });
      out += '<g opacity="' + steps[0] + '">' + R(20, 60, 110, 52, { fill: '#2a2f5e', stroke: '#4cc9ff', rx: 12 }) + T(75, 82, 'virtuelle Adresse', { size: 10, fill: '#9ad8ff' }) + T(75, 102, v.va, { size: 17, w: 900, mono: true }) + '</g>';
      out += '<g opacity="' + steps[1] + '">' + R(150, 50, 100, 30, { fill: '#1d2246', stroke: '#ffb347', rx: 8 }) + T(200, 70, 'Bounds = ' + v.bounds, { size: 11, mono: true, fill: '#ffd9a8' }) +
        T(200, 98, v.va + ' < ' + v.bounds + ' ?', { size: 12, w: 900, mono: true }) + T(200, 118, ok ? '✓ ja, erlaubt' : '✗ nein → Ausnahme!', { size: 12, w: 900, fill: ok ? '#2fd17c' : '#ff5d6c' }) + '</g>';
      out += L(130, 86, 148, 86, { arrow: true, op: steps[1] });
      if (ok) {
        out += '<g opacity="' + steps[2] + '">' + R(150, 140, 100, 30, { fill: '#1d2246', stroke: '#ff5fa2', rx: 8 }) + T(200, 160, '+ Base = ' + v.base, { size: 11, mono: true, fill: '#ffb3d1' }) + '</g>';
        out += L(200, 124, 200, 138, { arrow: true, op: steps[2] });
        out += '<g opacity="' + steps[3] + '">' + R(270, 130, 115, 52, { fill: '#173b2a', stroke: '#2fd17c', rx: 12 }) + T(327, 152, 'physische Adresse', { size: 10, fill: '#9df0c4' }) + T(327, 172, v.va + v.base, { size: 17, w: 900, mono: true }) + '</g>';
        out += L(250, 155, 268, 155, { arrow: true, op: steps[3] });
      } else out += '<g opacity="' + steps[2] + '">' + R(150, 140, 100, 40, { fill: '#3d1520', stroke: '#ff5d6c', rx: 10 }) + T(200, 165, 'OS: Prozess beenden', { size: 11, w: 900, fill: '#ffb3bd' }) + '</g>';
      out += T(W / 2, 236, 'physisch = virtuell + Base (falls virtuell < Bounds)', { size: 12, fill: '#c9c3ff', op: steps[3] || steps[2] });
      return out;
    }
    /* Paging: VPN | Offset → Page Table → PFN | Offset */
    var vb = v.vbits, ob = v.obits, bits = v.va.toString(2).padStart(vb + ob, '0'), vpn = v.va >> ob, off = v.va & ((1 << ob) - 1), pfn = v.pt[vpn], pa = (pfn << ob) | off;
    var s1 = ease(p * 4), s2 = ease(p * 4 - 1), s3 = ease(p * 4 - 2), s4 = ease(p * 4 - 3), bw = Math.min(28, 300 / (vb + ob));
    out += T(W / 2, 22, 'Virtuelle Adresse ' + v.va + ' → physisch', { size: 14, w: 900 });
    var bx = W / 2 - bw * (vb + ob) / 2;
    for (var i = 0; i < vb + ob; i++) { var isV = i < vb; out += R(bx + i * bw, 36, bw - 3, 30, { fill: isV ? (s2 > .5 ? '#7c5cff' : '#2a2f5e') : (s2 > .5 ? '#ff5fa2' : '#2a2f5e'), rx: 6, op: s1 }) + T(bx + i * bw + bw / 2 - 1.5, 57, bits[i], { size: 14, w: 900, mono: true, op: s1 }); }
    out += T(bx + vb * bw / 2, 82, 'VPN = ' + vpn, { size: 12, w: 900, fill: '#c9b8ff', op: s2 }) + T(bx + vb * bw + ob * bw / 2, 82, 'Offset = ' + off, { size: 12, w: 900, fill: '#ffb3d1', op: s2 });
    var keys = Object.keys(v.pt);
    out += T(110, 108, 'Page Table', { size: 11, w: 900, fill: '#9aa0d6', op: s3 });
    keys.forEach(function (k, j) { var on = +k === vpn; out += '<g opacity="' + s3 + '">' + R(60, 114 + j * 22, 100, 20, { fill: on ? '#7c5cff' : '#1d2246', stroke: '#3a3f6b', rx: 4 }) + T(85, 128 + j * 22, 'VPN ' + k, { size: 10, mono: true }) + T(135, 128 + j * 22, '→ ' + v.pt[k], { size: 10, mono: true, w: 900 }) + '</g>'; });
    out += '<g opacity="' + s4 + '">' + R(210, 150, 170, 60, { fill: '#173b2a', stroke: '#2fd17c', rx: 12 }) + T(295, 172, 'PFN ' + pfn + ' | Offset ' + off, { size: 12, w: 900, mono: true, fill: '#9df0c4' }) + T(295, 196, 'physisch = ' + pa, { size: 15, w: 900, mono: true }) + '</g>';
    out += L(162, 125 + keys.indexOf(String(vpn)) * 22, 208, 175, { arrow: true, op: s4 });
    return out;
  };

  /* ---------- TLB: Zugriff auf ein Array ---------- */
  V.tlb = function (v, p) {
    var n = v.n || 10, per = v.per || 4, off = v.off || 1, out = '', cell = 34, x0 = 30, y0 = 70, shown = Math.floor(ease(p * 1.05) * n + .0001), hits = 0, miss = 0, seen = {};
    out += T(W / 2, 24, 'Array a[' + n + '] über ' + Math.ceil((n + off) / per) + ' Seiten', { size: 14, w: 900 });
    var pages = Math.ceil((n + off) / per);
    for (var pg = 0; pg < pages; pg++) {
      out += R(x0 + pg * per * cell - 2, y0 - 22, per * cell, 64, { fill: 'none', stroke: '#3a3f6b', rx: 8 }) + T(x0 + pg * per * cell + per * cell / 2 - 2, y0 - 8, 'VPN ' + ((v.vpn0 || 0) + pg), { size: 10, fill: '#9aa0d6' });
    }
    for (var i = 0; i < n; i++) {
      var slot = i + off, pgI = Math.floor(slot / per), hit = !!seen[pgI], x = x0 + slot * cell;
      if (i < shown) { seen[pgI] = 1; if (hit) hits++; else miss++; }
      var col = i < shown ? (hit ? '#2fd17c' : '#ff5d6c') : '#232848';
      out += R(x, y0, cell - 6, 30, { fill: col, rx: 6 }) + T(x + (cell - 6) / 2, y0 + 20, 'a[' + i + ']', { size: 9, w: 800, mono: true, fill: i < shown ? '#0b0d1c' : '#9aa0d6' });
      if (i < shown) out += T(x + (cell - 6) / 2, y0 + 48, hit ? 'Hit' : 'Miss', { size: 9, w: 900, fill: hit ? '#2fd17c' : '#ff8a95' });
    }
    out += T(W / 2, 190, 'Hits: ' + hits + '   Misses: ' + miss, { size: 15, w: 900 });
    if (shown === n) out += T(W / 2, 216, 'Trefferquote: ' + Math.round(hits / n * 100) + ' % – dank räumlicher Lokalität', { size: 12.5, w: 900, fill: '#ffd166' });
    return out;
  };

  /* ---------- Freispeicher-Liste / Heap ---------- */
  V.heap = function (v, p) {
    var frames = v.frames, k = Math.min(frames.length - 1, Math.floor(p * frames.length)), fr = frames[k], out = '', total = v.size || 100, x0 = 20, w = 360, sc = w / total, y = 96;
    out += T(W / 2, 26, v.title || 'Heap', { size: 14, w: 900 });
    out += T(W / 2, 52, fr.note || '', { size: 12, fill: '#ffd9a8' });
    var x = x0;
    fr.blocks.forEach(function (b, i) {
      var bw = b[1] * sc, used = b[0] !== '';
      out += R(x + 1, y, bw - 2, 56, { fill: used ? PAL[(b[0].charCodeAt(0) - 65) % 8] : 'rgba(255,255,255,.05)', stroke: used ? 'none' : '#4a4f80', rx: 6, extra: used ? '' : ' stroke-dasharray="4 3"' });
      out += T(x + bw / 2, y + 26, used ? b[0] : 'frei', { size: bw < 30 ? 9 : 12, w: 900, fill: used ? '#fff' : '#9aa0d6' }) + T(x + bw / 2, y + 44, b[1], { size: 10, mono: true, fill: used ? '#f0f0ff' : '#9aa0d6' });
      x += bw;
    });
    var fl = fr.blocks.filter(function (b) { return b[0] === ''; }).map(function (b) { return b[1]; });
    out += T(20, 196, 'Freie Liste:', { size: 12, w: 900, anchor: 'start', fill: '#c9c3ff' });
    var lx = 104;
    fl.forEach(function (s, i) { out += R(lx, 182, 46, 22, { fill: '#1d2246', stroke: '#7c5cff', rx: 6 }) + T(lx + 23, 197, s, { size: 11, w: 900, mono: true }) + (i < fl.length - 1 ? L(lx + 46, 193, lx + 58, 193, { arrow: true }) : T(lx + 62, 197, 'NULL', { size: 10, mono: true, anchor: 'start', fill: '#6f7399' })); lx += 58; });
    out += T(W / 2, 250, 'Schritt ' + (k + 1) + ' / ' + frames.length, { size: 11, fill: '#6f7399' });
    return out;
  };

  /* ---------- Fit-Strategien ---------- */
  V.fit = function (v, p) {
    var free = v.free, req = v.req, out = '', strat = v.strat, cand = free.map(function (s, i) { return { s: s, i: i }; }).filter(function (c) { return c.s >= req; });
    var pick = strat === 'best' ? cand.sort(function (a, b) { return a.s - b.s; })[0] : strat === 'worst' ? cand.sort(function (a, b) { return b.s - a.s; })[0] : cand[0];
    var name = { best: 'Best Fit', worst: 'Worst Fit', first: 'First Fit', next: 'Next Fit' }[strat];
    out += T(W / 2, 28, name + ': Anfrage über ' + req + ' Bytes', { size: 15, w: 900 });
    var s1 = ease(p * 3), s2 = ease(p * 3 - 1), s3 = ease(p * 3 - 2), x = 30;
    out += T(30, 76, 'head', { size: 11, anchor: 'start', mono: true, fill: '#9aa0d6' });
    free.forEach(function (s, i) {
      var isPick = pick && pick.i === i, ok = s >= req, bx = 30 + i * 120, by = 90;
      out += R(bx, by, 96, 56, { fill: isPick && s2 > .5 ? '#2fd17c' : 'rgba(255,255,255,.06)', stroke: s1 > .5 ? (ok ? '#2fd17c' : '#ff5d6c') : '#4a4f80', rx: 10 });
      out += T(bx + 48, by + 34, (isPick && s3 > .5 ? (s - req) : s), { size: 18, w: 900, mono: true, fill: isPick && s2 > .5 ? '#062b17' : '#fff' });
      if (i < free.length - 1) out += L(bx + 96, by + 28, bx + 118, by + 28, { arrow: true });
      out += T(bx + 48, by + 76, ok ? 'passt' : 'zu klein', { size: 11, w: 800, fill: ok ? '#9df0c4' : '#ff8a95', op: s1 });
    });
    out += TW(W / 2, 210, v.note || '', 50, { size: 12, fill: '#c9c3ff', op: s3 });
    return out;
  };

  /* ---------- Mehrstufige Page Table ---------- */
  V.ml = function (v, p) {
    var out = '', s = [ease(p * 4), ease(p * 4 - 1), ease(p * 4 - 2), ease(p * 4 - 3)];
    out += T(W / 2, 22, 'Zweistufige Page Table', { size: 14, w: 900 });
    var parts = [['PD-Index', v.pdi, '#ffb347'], ['PT-Index', v.pti, '#7c5cff'], ['Offset', v.off, '#ff5fa2']];
    parts.forEach(function (pt, i) { out += R(70 + i * 90, 36, 84, 40, { fill: pt[2], rx: 8, op: s[0] }) + T(112 + i * 90, 53, pt[0], { size: 10, w: 900, fill: '#fff', op: s[0] }) + T(112 + i * 90, 70, pt[1], { size: 13, w: 900, mono: true, fill: '#fff', op: s[0] }); });
    function col(x, title, n, hl, c, a, valid) {
      var o = T(x + 40, 104, title, { size: 10, w: 900, fill: '#9aa0d6', op: a });
      for (var i = 0; i < n; i++) { var on = i === hl; o += R(x, 112 + i * 18, 80, 16, { fill: on ? c : (valid && valid[i] === 0 ? 'rgba(255,255,255,.03)' : '#1d2246'), stroke: '#3a3f6b', rx: 3, op: a }) + T(x + 40, 124 + i * 18, valid && valid[i] === 0 ? '—' : (on ? '→' : '·'), { size: 9, op: a, fill: on ? '#fff' : '#6f7399' }); }
      return o;
    }
    out += col(30, 'Page Directory', 8, v.pdi % 8, '#ffb347', s[1], v.valid);
    out += L(112, 112 + (v.pdi % 8) * 18 + 8, 158, 120, { arrow: true, op: s[2] });
    out += col(160, 'Seite der PT', 8, v.pti % 8, '#7c5cff', s[2]);
    out += L(242, 112 + (v.pti % 8) * 18 + 8, 290, 160, { arrow: true, op: s[3] });
    out += '<g opacity="' + s[3] + '">' + R(292, 136, 96, 52, { fill: '#173b2a', stroke: '#2fd17c', rx: 10 }) + T(340, 158, 'Frame ' + v.pfn, { size: 12, w: 900, fill: '#9df0c4' }) + T(340, 177, '+ Offset ' + v.off, { size: 10, mono: true }) + '</g>';
    out += TW(W / 2, 274, v.note || 'Ungenutzte Bereiche brauchen keine Seiten der Page Table', 60, { size: 11.5, fill: '#c9c3ff', op: s[3] });
    return out;
  };

  /* ---------- Swapping ---------- */
  V.swap = function (v, p) {
    var fr = v.frames, k = Math.min(fr.length - 1, Math.floor(p * fr.length)), f = fr[k], out = '';
    out += T(110, 26, 'Physischer Speicher', { size: 12, w: 900, fill: '#9ad8ff' }) + T(310, 26, 'Swap Space (Platte)', { size: 12, w: 900, fill: '#ffd9a8' });
    f.mem.forEach(function (m, i) { var y = 40 + i * 34, hl = f.hl === 'm' + i; out += R(40, y, 140, 28, { fill: m ? (hl ? '#ff5fa2' : '#2a2f5e') : 'rgba(255,255,255,.04)', stroke: hl ? '#fff' : '#3a3f6b', rx: 6 }) + T(110, y + 19, m || 'frei', { size: 11, w: 800, mono: true, fill: m ? '#fff' : '#6f7399' }); });
    f.disk.forEach(function (d, i) { var y = 40 + i * 34, hl = f.hl === 'd' + i; out += R(240, y, 140, 28, { fill: d ? (hl ? '#ffb347' : '#3a2f22') : 'rgba(255,255,255,.04)', stroke: hl ? '#fff' : '#5a4a36', rx: 6 }) + T(310, y + 19, d || '–', { size: 11, w: 800, mono: true, fill: d ? '#fff' : '#6f7399' }); });
    if (f.arrow) out += L(f.arrow[0] === 'd' ? 238 : 182, 54 + f.arrow[1] * 34, f.arrow[0] === 'd' ? 182 : 238, 54 + f.arrow[2] * 34, { stroke: '#ffd166', sw: 3, arrow: true });
    out += TW(W / 2, 252, f.note || '', 58, { size: 12, fill: '#ffd9a8', w: 800 });
    return out;
  };

  /* ---------- Schichten (Anwendung → OS → Hardware) ---------- */
  V.layers = function (v, p, t) {
    var ls = v.layers, n = ls.length, out = '', h = Math.min(46, 220 / n);
    ls.forEach(function (l, i) {
      var a = ap(p, n - 1 - i, n), y = 30 + i * (h + 8), w = 300 - (n - 1 - i) * 0, hl = v.hl === i;
      out += '<g opacity="' + a + '">' + R(W / 2 - w / 2, y, w, h, { fill: hl ? 'url(#gg)' : PAL[i % 8], op: hl ? 1 : .32, rx: 12, stroke: PAL[i % 8] }) + T(W / 2, y + h / 2 + 5, l, { size: 13, w: 900 }) + '</g>';
    });
    if (v.call && p > .5) { var yy = 30 + ((t * 40) % (n * (h + 8))); out += '<circle cx="' + (W / 2 + 165) + '" cy="' + yy + '" r="6" fill="#ffd166"/>' + T(W / 2 + 165, 22, v.call, { size: 10, fill: '#ffd166' }); }
    return out;
  };

  /* ---------- Bits einer Adresse ---------- */
  V.bits = function (v, p) {
    var total = v.split.reduce(function (a, b) { return a + b; }, 0), bw = Math.min(30, 340 / total), x0 = W / 2 - total * bw / 2, out = '', k = 0;
    out += T(W / 2, 40, v.title || '', { size: 14, w: 900 });
    v.split.forEach(function (n, si) {
      var a = ease(p * 3 - si * .6), c = PAL[[0, 1, 3, 2][si % 4]];
      for (var i = 0; i < n; i++, k++) out += R(x0 + k * bw, 90, bw - 3, 40, { fill: a > .5 ? c : '#232848', rx: 6 }) + T(x0 + k * bw + bw / 2 - 1.5, 116, v.bits ? v.bits[k] : '·', { size: 15, w: 900, mono: true });
      var mid = x0 + (k - n / 2) * bw;
      out += T(mid, 154, v.labels[si], { size: 12, w: 900, fill: c, op: a }) + T(mid, 172, n + ' Bit', { size: 10, fill: '#9aa0d6', op: a });
    });
    if (v.note) out += TW(W / 2, 220, v.note, 56, { size: 12, fill: '#c9c3ff', op: ease(p * 2 - 1) });
    return out;
  };

  /* ---------- MLFQ-Warteschlangen ---------- */
  V.mlfq = function (v, p) {
    var fr = v.frames, k = Math.min(fr.length - 1, Math.floor(p * fr.length)), f = fr[k], nq = v.queues || 3, out = '';
    for (var q = 0; q < nq; q++) {
      var lvl = nq - 1 - q, y = 34 + q * 56;
      out += T(36, y + 26, 'Q' + lvl, { size: 14, w: 900, fill: PAL[q] }) + T(36, y + 40, lvl === nq - 1 ? 'hoch' : lvl === 0 ? 'niedrig' : '', { size: 8.5, fill: '#9aa0d6' });
      out += R(64, y + 6, 310, 40, { fill: 'rgba(255,255,255,.04)', stroke: '#3a3f6b', rx: 10 });
      (f['Q' + lvl] || []).forEach(function (j, i) { var run = f.run === j; out += R(74 + i * 56, y + 12, 48, 28, { fill: PAL[(j.charCodeAt(0) - 65) % 8], stroke: run ? '#fff' : 'none', sw: 2.5, rx: 8 }) + T(98 + i * 56, y + 31, j, { size: 13, w: 900 }); });
    }
    out += TW(W / 2, 214, f.note || '', 58, { size: 12, fill: '#ffd9a8', w: 800 });
    if (f.rule) out += R(W / 2 - 150, 248, 300, 30, { fill: 'rgba(124,92,255,.2)', stroke: '#7c5cff', rx: 15 }) + T(W / 2, 268, f.rule, { size: 11.5, w: 900, fill: '#d9d0ff' });
    return out;
  };

  /* ---------- Vergleich zweier Werte (Balken) ---------- */
  V.bars = function (v, p) {
    var out = '', max = Math.max.apply(null, v.items.map(function (x) { return x[1]; })), n = v.items.length, bw = Math.min(70, 300 / n - 14);
    out += T(W / 2, 26, v.title || '', { size: 14, w: 900 });
    v.items.forEach(function (it, i) {
      var a = ap(p, i, n), h = 170 * it[1] / max * a, x = W / 2 - n * (bw + 14) / 2 + i * (bw + 14);
      out += R(x, 230 - h, bw, h, { fill: PAL[i % 8], rx: 8 }) + T(x + bw / 2, 222 - h, it[1] + (v.unit || ''), { size: 12, w: 900, op: a }) + TW(x + bw / 2, 250, it[0], 12, { size: 10.5, w: 800, fill: '#c9c3ff' });
    });
    return out;
  };

  window.OSTEP_VIS = {
    render: function (svg, v, p, t) {
      var fn = V[v.type] || V.points, html;
      try { html = fn(v, clamp(p, 0, 1), t || 0); } catch (e) { html = T(W / 2, H / 2, '⚠ ' + e.message, { size: 12 }); }
      svg.innerHTML = DEFS + html;
    },
    types: Object.keys(V)
  };
})();
