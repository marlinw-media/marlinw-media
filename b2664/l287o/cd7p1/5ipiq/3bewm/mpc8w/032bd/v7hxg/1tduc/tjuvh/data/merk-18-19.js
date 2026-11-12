/* Merksätze pro Kapitel: [Merksatz, genauere Erklärung, Thema, Abschnitt] */
(function () {
  var M = OSTEP.merk = OSTEP.merk || {};
  M[18] = [
    ['Paging teilt den Speicher in gleich große Stücke: virtuelle **Seiten** und physische **Frames**.',
     'Weil alle Stücke gleich groß sind, passt jede Seite in jeden freien Frame. Dadurch gibt es **keine externe Fragmentierung** – im Gegensatz zur Segmentierung mit variabel großen Segmenten.', 't1', 0],
    ['Jede Seite kann in **jedem** freien Frame liegen.',
     'Die Seiten eines Prozesses müssen weder zusammenhängend noch in der „richtigen“ Reihenfolge liegen. Im Beispiel liegt VP 0 in PF 3 und VP 1 in PF 7. Das OS nimmt einfach beliebige Frames aus seiner **Free List**.', 't1', 2],
    ['Die **Page Table** speichert pro Prozess die Übersetzung VPN → PFN.',
     'Jeder Prozess hat seine **eigene** Page Table, weil dieselbe virtuelle Seite bei verschiedenen Prozessen in verschiedenen Frames liegt. Die Tabelle liegt im Speicher, das **PTBR** zeigt auf ihren Anfang.', 't1', 3],
    ['Virtuelle Adresse = **VPN | Offset**.',
     'Die oberen Bits wählen die Seite (VPN), die unteren das Byte in der Seite (Offset).\n**Offset-Bits = log2(Seitengröße)**, **VPN-Bits = Adressbits − Offset-Bits**.\nBeispiel 32 Bit, 4 KB: Offset 12 Bit, VPN 20 Bit.', 't2', 0],
    ['Bei der Übersetzung wird nur die VPN ersetzt – der **Offset bleibt gleich**.',
     '**physisch = PFN · Seitengröße + Offset** = (PFN << Offset-Bits) | Offset.\nBeispiel: VA 21 = 01 0101 → VPN 1, Offset 5; VPN 1 → PFN 7 → 7 · 16 + 5 = **117**.', 't2', 2],
    ['Anzahl Seiten = Adressraum / Seitengröße, Anzahl Frames = Speicher / Seitengröße.',
     'Beispiel: 64-Byte-Adressraum mit 16-Byte-Seiten → **4 Seiten**; 128 Bytes Speicher → **8 Frames**. Bei 32 Bit und 4-KB-Seiten sind es 2^20 ≈ 1 Million Seiten.', 't1', 1],
    ['Lineare Page Tables sind **groß**: Größe = 2^VPN-Bits · PTE-Größe.',
     '32 Bit, 4-KB-Seiten, 4-Byte-PTE: 2^20 · 4 Bytes = **4 MB pro Prozess** – bei 100 Prozessen 400 MB. Auch ungenutzte Bereiche brauchen Einträge. Kapitel 20 zeigt kleinere Strukturen.', 't3', 0],
    ['Ein **PTE** enthält die PFN plus Statusbits.',
     '**Valid** (gehört zum Adressraum?), **Protection** (lesen/schreiben/ausführen), **Present** (im Speicher oder auf der Platte?), **Dirty** (verändert?), **Reference/Accessed** (kürzlich benutzt?). Auf x86 übernimmt das Present-Bit die Rolle des Valid-Bits.', 't3', 2],
    ['Ungültige Seiten (Valid = 0) brauchen **keinen Frame**.',
     'Der große leere Bereich zwischen Heap und Stack ist ungültig. Ein Zugriff dorthin löst eine Ausnahme aus (Segmentation Fault) – und physischer Speicher wird dafür nicht verschwendet.', 't3', 2],
    ['PTE-Adresse = **PTBR + VPN · sizeof(PTE)**.',
     'Die lineare Page Table ist ein Array; die Hardware rechnet: VPN = (VA & VPN_MASK) >> SHIFT, dann PTEAddr = PTBR + VPN · sizeof(PTE). SHIFT ist die Zahl der Offset-Bits.', 't4', 0],
    ['Paging ohne TLB **verdoppelt** die Speicherzugriffe.',
     'Vor jedem Zugriff (Instruktion holen, Laden, Speichern) muss erst der PTE gelesen werden. Die Array-Schleife braucht pro Durchlauf 4 Fetches + 1 Store = 5 Zugriffe, mit Paging **10**.', 't4', 3],
    ['Die zwei Probleme von einfachem Paging: **zu langsam** und **zu viel Speicher**.',
     'Gegen die Langsamkeit hilft der **TLB** (Kapitel 19), gegen den Speicherverbrauch helfen **kleinere Page Tables** (Kapitel 20: mehrstufig, invertiert).', 't4', 3]
  ];
  M[19] = [
    ['Der **TLB** ist ein Hardware-Cache für Übersetzungen VPN → PFN in der MMU.',
     'Er ist klein (32–128 Einträge) und sehr schnell. Steht die Übersetzung im TLB, entfällt der zusätzliche Page-Table-Zugriff – Paging wird fast so schnell wie ohne Übersetzung.', 't1', 0],
    ['**TLB-Hit**: PFN aus dem TLB, Offset anhängen, fertig.',
     'Auch bei einem Hit werden die **Schutzbits** geprüft. Es gibt keinen zusätzlichen Speicherzugriff.', 't1', 1],
    ['**TLB-Miss**: Page Table lesen, Eintrag in den TLB laden, **Instruktion wiederholen**.',
     'Der zweite Versuch ist dann ein Hit. Misses sind teuer, weil sie zusätzliche Speicherzugriffe kosten – Ziel ist eine möglichst hohe **Trefferquote**.', 't1', 2],
    ['Der TLB lebt von **Lokalität**.',
     '**Räumlich**: Nach Adresse x folgen Zugriffe in der Nähe (Array-Elemente auf derselben Seite). **Zeitlich**: Dasselbe wird bald wieder benutzt (Schleifen). Schnelle Caches müssen klein sein – darum ist Lokalität entscheidend.', 't1', 3],
    ['Ein Miss entsteht nur beim **ersten** Zugriff auf jede Seite.',
     'Array mit 10 Integern ab Adresse 100, 16-Byte-Seiten: Seiten 6, 7, 8 → **3 Misses, 7 Hits = 70 %**. Zweiter Durchlauf: **100 %** (zeitliche Lokalität).', 't2', 1],
    ['**Größere Seiten** → weniger Misses bei dichten Zugriffen.',
     'Mehr Elemente pro Seite heißt weniger Seitenwechsel. Bei 4-KB-Seiten gibt es für ein dichtes Integer-Array nur einen Miss pro 1024 Elemente.', 't2', 2],
    ['**Hardwareverwaltet** (CISC, x86): Die Hardware durchläuft die Page Table selbst.',
     'Sie muss dafür Ort (Register **CR3**) und festes **Format** der Page Table kennen.', 't3', 0],
    ['**Softwareverwaltet** (RISC, MIPS): Ein Miss löst eine Ausnahme aus, das **OS** füllt den TLB.',
     'Der Trap-Handler sucht die Übersetzung und schreibt sie mit privilegierten Instruktionen in den TLB. Vorteil: Das OS darf **jede Datenstruktur** für die Page Table nutzen, die Hardware bleibt einfach.', 't3', 1],
    ['Nach einem TLB-Miss geht es mit **derselben** Instruktion weiter, nach einem Systemaufruf mit der **nächsten**.',
     'Außerdem darf der Miss-Handler selbst keinen Miss auslösen (Endlosschleife). Lösung: Handler in **ungemapptem** Speicher oder **wired** (fest reservierte) TLB-Einträge.', 't3', 2],
    ['Beim Kontextwechsel: entweder **Flush** oder **ASIDs**.',
     'Ohne Kennzeichnung wären Einträge verschiedener Prozesse für dieselbe VPN nicht unterscheidbar. Ein Flush leert den TLB (danach viele Misses). Mit **ASIDs** (oft 8 Bit → 256 Adressräume) bleiben Einträge mehrerer Prozesse gleichzeitig gültig.', 't4', 1],
    ['Ein TLB-Eintrag: **VPN | PFN | Bits** – voll assoziativ, parallel durchsucht.',
     'Zu den Bits gehören Valid, Protection, Dirty, ASID und beim MIPS ein **Global**-Bit. Das Valid-Bit im TLB bedeutet nur „Eintrag enthält eine gültige Übersetzung“.', 't4', 0],
    ['Ersetzung: **LRU** oder **Random**; Abdeckung = Einträge · Seitengröße.',
     'LRU nutzt Lokalität, versagt aber bei einer Schleife über n+1 Seiten mit n Einträgen; Random vermeidet diesen Grenzfall. **TLB-Abdeckung**: 64 Einträge · 4 KB = 256 KB – wer mehr Speicher aktiv nutzt, bekommt viele Misses.', 't4', 3]
  ];
})();
/* Animation je Merksatz (Reihenfolge wie oben) */
(function () {
  var M = OSTEP.merk, MAP = { 0: 3, 1: 7, 2: 5, 3: 2 };
  var V18 = [
    { type: 'pagemap', title: 'Gleich große Seiten → gleich große Frames', pages: 4, frames: 8, map: MAP, os: [0], free: true, note: 'Jedes Stück ist gleich groß – jede Seite passt in jeden Frame.' },
    { type: 'pagemap', title: 'Beliebige freie Frames', pages: 4, frames: 8, map: { 0: 6, 1: 1, 2: 4, 3: 7 }, os: [0], free: true, note: 'Die Seiten müssen nicht zusammenhängend oder in Reihenfolge liegen.' },
    { type: 'table', cmp: true, cols: ['VPN', 'Prozess A', 'Prozess B'], rows: [[0, 'VP 0'], [1, '→ PF 3'], [2, '→ PF 6'], [0, 'VP 1'], [1, '→ PF 7'], [2, '→ PF 1'], [0, 'VP 2'], [1, '→ PF 5'], [2, '→ PF 4'], [0, 'VP 3'], [1, '→ PF 2'], [2, '(ungültig)']] },
    { type: 'bits', title: '32-Bit-Adresse, 4-KB-Seiten', split: [20, 12], labels: ['VPN (20 Bit)', 'Offset (12 Bit)'], note: 'Offset = log2(4096) = 12 · VPN = 32 − 12 = 20' },
    { type: 'xlate', va: 21, vbits: 2, obits: 4, pt: MAP },
    { type: 'bars', title: 'Seiten und Frames (16-Byte-Stücke)', items: [['Seiten (64 B)', 4], ['Frames (128 B)', 8]], unit: '' },
    { type: 'bars', title: 'Lineare Page Table (32 Bit, 4 KB, 4-Byte-PTE)', items: [['1 Prozess', 4], ['10', 40], ['100 Prozesse', 400]], unit: ' MB' },
    { type: 'bits', title: 'Ein PTE (x86, 32 Bit)', split: [20, 3, 9], labels: ['PFN', 'frei', 'Flags'], note: 'Flags: Present, R/W, U/S, Accessed, Dirty …' },
    { type: 'mem', title: 'Nur gültige Seiten brauchen Frames', regions: [['Code ✓', 0, 14, '#7c5cff'], ['Heap ✓', 14, 30, '#2fd17c'], ['ungültig – kein Frame', 30, 84, '#ff5d6c', 'free'], ['Stack ✓', 84, 100, '#ffb347']] },
    { type: 'code', title: 'PTE-Adresse berechnen', code: 'VPN     = (VA & VPN_MASK) >> SHIFT\nPTEAddr = PTBR + VPN * sizeof(PTE)\n\n// Beispiel: PTBR = 4096, VPN = 5, PTE = 4 B\n// PTEAddr = 4096 + 5 * 4 = 4116', steps: [0, 1, 3, 4] },
    { type: 'bars', title: 'Speicherzugriffe pro Schleifendurchlauf', items: [['ohne Paging', 5], ['mit Paging', 10]], unit: '' },
    { type: 'versus', title: 'Zwei Probleme – zwei Lösungen', l: ['zu langsam', '🐢', 'jeder Zugriff braucht einen Page-Table-Zugriff'], r: ['Lösung: TLB', '⚡', 'Übersetzungen cachen (Kapitel 19)'], note: 'Zu viel Speicher → kleinere Page Tables (Kapitel 20)' }
  ];
  var V19 = [
    { type: 'tlbflow', hit: true },
    { type: 'bits', title: 'Hit: PFN aus dem TLB + Offset', bits: '1110101', split: [3, 4], labels: ['PFN 7 (aus TLB)', 'Offset 5'], note: 'physisch = 7 · 16 + 5 = 117 – ganz ohne Page-Table-Zugriff' },
    { type: 'tlbflow', hit: false },
    { type: 'tlb', n: 10, per: 8, off: 1, vpn0: 3 },
    { type: 'tlb', n: 10, per: 4, off: 1, vpn0: 6 },
    { type: 'bars', title: 'Misses für 10 Integer (je nach Seitengröße)', items: [['16 B', 3], ['32 B', 2], ['4 KB', 1]], unit: '' },
    { type: 'points', title: 'Hardwareverwaltet (x86)', items: [['🧭', 'CR3 zeigt auf die Page Table'], ['📐', 'Format ist fest vorgegeben'], ['🚶', 'Hardware durchläuft die Tabelle'], ['🔁', 'lädt Eintrag, wiederholt Instruktion']] },
    { type: 'code', title: 'TLB-Miss-Handler des OS', code: 'TLB_MISS:            // Trap ins OS\n  PTE = PT[VPN]       // OS sucht\n  TLB_Write(VPN, PTE) // privilegiert\n  return-from-trap    // gleiche Instr.', steps: [0, 1, 2, 3] },
    { type: 'table', cmp: true, cols: ['Trap-Grund', 'weiter bei'], rows: [[0, 'TLB-Miss'], [1, 'derselben Instruktion ↺'], [0, 'Systemaufruf'], [1, 'der nächsten Instruktion ↓'], [0, 'Handler-Code'], [1, 'wired / ungemappt']] },
    { type: 'versus', title: 'Kontextwechsel', l: ['Flush', '🧹', 'TLB leeren → danach viele Misses'], r: ['ASID', '🏷️', 'Einträge mehrerer Prozesse bleiben gültig'], note: '8 Bit ASID → 2^8 = 256 Adressräume' },
    { type: 'bits', title: 'Ein TLB-Eintrag', split: [6, 6, 4], labels: ['VPN', 'PFN', 'Bits'], note: 'voll assoziativ: alle Einträge werden parallel durchsucht' },
    { type: 'bars', title: 'TLB-Abdeckung bei 64 Einträgen', items: [['4-KB-Seiten', 0.25], ['2-MB-Seiten', 128]], unit: ' MB' }
  ];
  M[18].forEach(function (m, i) { m[4] = V18[i]; });
  M[19].forEach(function (m, i) { m[4] = V19[i]; });
})();
