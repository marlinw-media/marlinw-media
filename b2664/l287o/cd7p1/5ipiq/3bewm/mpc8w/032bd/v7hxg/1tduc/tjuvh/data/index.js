/* Kapitel-Übersicht (OSTEP – Operating Systems: Three Easy Pieces, Arpaci-Dusseau)
   Datenformat eines Kapitels (data/kNN.js):
   OSTEP.add({ n: 7, topics: [ {
     id: 't1', title: '…', icon: '🧮', sum: 'Kurzbeschreibung',
     segs: [ { h: 'Abschnittstitel', t: 'Lern-/Sprechtext (Markdown-light: `code`, **fett**)', say: 'optional: Aussprachefassung', v: { type: '…', … } } ],
     q: [ [Frage, [richtig, falsch, falsch, falsch], Erklärung, Abschnittsindex, 'Markier-Phrase'] ],   // Antwort 0 ist immer richtig
     st: { about: 'Thema', T: [[wahre Aussage, seg]], F: [[falsche Aussage, Korrektur, seg]] },       // Aussagen-Bank → Variantenfragen
     gen: [ { n: 5, f: function (r) { return { q, a: [richtig, …], e, s, m }; } } ]                   // Rechen-/Codeaufgaben mit Zufallszahlen
   } ] }); */
window.OSTEP = {
  chapters: {},
  meta: [
    { n: 2, part: 'Einführung', title: 'Einführung in Betriebssysteme', short: 'Virtualisierung, Nebenläufigkeit, Persistenz', color: '#7c5cff' },
    { n: 4, part: 'Virtualisierung: CPU', title: 'Prozesse', short: 'Die Abstraktion des laufenden Programms', color: '#4c8dff' },
    { n: 5, part: 'Virtualisierung: CPU', title: 'Prozess-API', short: 'fork(), wait(), exec() und die Shell', color: '#4c8dff' },
    { n: 6, part: 'Virtualisierung: CPU', title: 'Limited Direct Execution', short: 'User/Kernel-Modus, Traps, Kontextwechsel', color: '#4c8dff' },
    { n: 7, part: 'Virtualisierung: CPU', title: 'CPU-Scheduling', short: 'FIFO, SJF, STCF, Round Robin', color: '#4c8dff' },
    { n: 8, part: 'Virtualisierung: CPU', title: 'Multi-Level Feedback Queue', short: 'Lernen aus der Vergangenheit', color: '#4c8dff' },
    { n: 13, part: 'Virtualisierung: Speicher', title: 'Adressräume', short: 'Die Abstraktion des Speichers', color: '#ff5fa2' },
    { n: 14, part: 'Virtualisierung: Speicher', title: 'Speicher-API', short: 'malloc(), free() und typische Fehler', color: '#ff5fa2' },
    { n: 15, part: 'Virtualisierung: Speicher', title: 'Adressübersetzung', short: 'Base & Bounds, dynamische Relokation', color: '#ff5fa2' },
    { n: 17, part: 'Virtualisierung: Speicher', title: 'Freispeicherverwaltung', short: 'Splitting, Coalescing, Fit-Strategien', color: '#ff5fa2' },
    { n: 18, part: 'Virtualisierung: Speicher', title: 'Paging: Einführung', short: 'Seiten, Frames und Page Tables', color: '#ff5fa2' },
    { n: 19, part: 'Virtualisierung: Speicher', title: 'TLBs', short: 'Schnellere Übersetzungen', color: '#ff5fa2' },
    { n: 20, part: 'Virtualisierung: Speicher', title: 'Kleinere Page Tables', short: 'Mehrstufige und invertierte Tabellen', color: '#ff5fa2' },
    { n: 21, part: 'Virtualisierung: Speicher', title: 'Swapping: Mechanismen', short: 'Present-Bit, Page Fault, Swap Space', color: '#ff5fa2' }
  ],
  soon: [],
  add: function (ch) { this.chapters[ch.n] = ch; }
};
/* Hilfen für Rechenaufgaben (r = Zufallsgenerator 0…1) */
OSTEP.u = {
  ri: function (r, a, b) { return a + Math.floor(r() * (b - a + 1)); },
  pick: function (r, arr) { return arr[Math.floor(r() * arr.length)]; },
  num: function (x) { var v = Math.round(x * 100) / 100; return String(v).replace('.', ','); },
  /* vier verschiedene Antworten: richtig + plausible Fehler (+ Notfüllung) */
  opts: function (right, wrongs, unit) {
    unit = unit || '';
    var f = function (x) { return typeof x === 'number' ? OSTEP.u.num(x) + unit : x; };
    var out = [f(right)], seen = {}; seen[out[0]] = 1;
    wrongs.concat([right * 2, right / 2, right + 10, right - 5, right * 1.5, right + 1]).forEach(function (w) {
      if (out.length >= 4) return;
      if (typeof w === 'number' && (!isFinite(w) || w < 0)) return;
      var s = f(w); if (!seen[s]) { seen[s] = 1; out.push(s); }
    });
    return out;
  },
  bin: function (n, bits) { return n.toString(2).padStart(bits, '0'); },
  hex: function (n) { return '0x' + n.toString(16).toUpperCase(); },
  /* Begründungen für falsche Optionen: [[Wert, 'warum falsch'], …] → { 'Optionstext': Begründung } */
  W: function (pairs) { var m = {}; pairs.forEach(function (p) { m[typeof p[0] === 'number' ? OSTEP.u.num(p[0]) : p[0]] = p[1]; }); return m; },
  kb: function (b) { return b >= 1048576 && b % 1048576 === 0 ? (b / 1048576) + ' MB' : b >= 1024 && b % 1024 === 0 ? (b / 1024) + ' KB' : b + ' Byte'; }
};
