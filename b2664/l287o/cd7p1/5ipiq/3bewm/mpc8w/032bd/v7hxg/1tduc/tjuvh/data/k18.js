/* Kapitel 18 – Paging: Introduction */
(function () {
  var u = OSTEP.u;
  function log2(x) { return Math.round(Math.log(x) / Math.LN2); }
  OSTEP.add({ n: 18, topics: [
  {
    id: 't1', title: 'Die Idee von Paging', icon: '📄', sum: 'Speicher in gleich große Seiten und Frames teilen.',
    segs: [
      { h: 'Feste Stücke statt variabler Segmente', t: 'Segmentierung teilt den Speicher in **variabel große** Stücke und leidet deshalb unter externer Fragmentierung. **Paging** geht den anderen Weg: Der Adressraum wird in **gleich große** Stücke geteilt, die **Seiten** oder **Pages** heißen. Der physische Speicher wird entsprechend als Folge gleich großer Fächer betrachtet, den **Page Frames**. Jeder Frame kann genau eine virtuelle Seite aufnehmen.',
        v: { type: 'points', title: 'Paging', items: [['📄', 'virtuell: Seiten (Pages) fester Größe'], ['🗄️', 'physisch: Page Frames gleicher Größe'], ['🔀', 'jede Seite kann in jedem Frame liegen'], ['🧩', 'keine externe Fragmentierung']] } },
      { h: 'Ein winziges Beispiel', t: 'Das Buch nimmt einen winzigen Adressraum von **64 Bytes** mit **16-Byte-Seiten**, also **4 Seiten**: 0 bis 3. Der physische Speicher hat **128 Bytes**, also **8 Frames**. Frame 0 belegt das Betriebssystem. Die vier virtuellen Seiten liegen verstreut: Seite 0 in Frame 3, Seite 1 in Frame 7, Seite 2 in Frame 5 und Seite 3 in Frame 2. Die Frames 1, 4 und 6 sind frei.',
        v: { type: 'mem', title: 'Physischer Speicher: 8 Frames à 16 Bytes', regions: [['F0: OS', 0, 12.5, '#4cc9ff'], ['F1 frei', 12.5, 25, '#232848', 'free'], ['F2: Seite 3', 25, 37.5, '#ffb347'], ['F3: Seite 0', 37.5, 50, '#7c5cff'], ['F4 frei', 50, 62.5, '#232848', 'free'], ['F5: Seite 2', 62.5, 75, '#2fd17c'], ['F6 frei', 75, 87.5, '#232848', 'free'], ['F7: Seite 1', 87.5, 100, '#ff5fa2']], marks: [[0, '0'], [25, '32'], [50, '64'], [75, '96'], [100, '128']] } },
      { h: 'Vorteile', t: 'Paging hat zwei große Vorteile. Erstens **Flexibilität**: Das System muss keine Annahmen darüber treffen, wie Heap und Stack wachsen oder wie der Adressraum benutzt wird. Zweitens **Einfachheit** der Freispeicherverwaltung: Braucht ein Prozess vier Seiten, nimmt das OS einfach die ersten vier Frames aus einer **Free List** freier Frames. Ein Suchen nach passenden Lücken wie bei Segmentierung gibt es nicht.',
        v: { type: 'table', cmp: true, cols: ['Segmentierung', 'Paging'], rows: [[0, 'variable Größen'], [0, 'externe Fragmentierung'], [0, 'Fit-Suche nötig'], [1, 'feste Seitengröße'], [1, 'keine externe Fragmentierung'], [1, 'beliebiger freier Frame passt']] } },
      { h: 'Die Page Table', t: 'Um sich zu merken, welche Seite wo liegt, führt das OS **pro Prozess** eine Datenstruktur: die **Page Table**. Ihre Hauptaufgabe ist, **Adressübersetzungen** für jede virtuelle Seite zu speichern. Im Beispiel enthält sie vier Einträge: VP 0 nach PF 3, VP 1 nach PF 7, VP 2 nach PF 5 und VP 3 nach PF 2. Wichtig: Jeder Prozess hat seine **eigene** Page Table, denn seine virtuellen Seiten liegen in anderen Frames.',
        v: { type: 'table', cmp: true, cols: ['Virtuelle Seite', 'Page Frame'], rows: [[0, 'VP 0'], [1, 'PF 3'], [0, 'VP 1'], [1, 'PF 7'], [0, 'VP 2'], [1, 'PF 5'], [0, 'VP 3'], [1, 'PF 2']] } }
    ],
    q: [
      ['Wie heißen die gleich großen Stücke des virtuellen Adressraums?', ['Seiten (Pages)', 'Segmente', 'Frames', 'Slabs'], 'Physisch heißen die Gegenstücke Page Frames.', 0, 'Seiten'],
      ['Wie heißen die gleich großen Stücke des physischen Speichers?', ['Page Frames', 'Pages', 'Segmente', 'Buddies'], 'Jeder Frame nimmt genau eine Seite auf.', 0, 'Page Frames'],
      ['Welches Problem der Segmentierung vermeidet Paging?', ['Externe Fragmentierung', 'Interne Fragmentierung', 'Langsame Übersetzung', 'Große Page Tables'], 'Alle Stücke sind gleich groß – jedes freie Fach passt.', 0],
      ['Adressraum 64 Bytes, Seitengröße 16 Bytes. Wie viele Seiten?', ['4', '16', '8', '64'], '64 / 16 = 4.', 1],
      ['Physischer Speicher 128 Bytes, Frames à 16 Bytes. Wie viele Frames?', ['8', '4', '16', '128'], '128 / 16 = 8.', 1],
      ['Im Buchbeispiel liegt virtuelle Seite 1 in welchem Frame?', ['PF 7', 'PF 3', 'PF 5', 'PF 2'], 'VP0→3, VP1→7, VP2→5, VP3→2.', 1, 'Seite 1 in Frame 7'],
      ['Im Buchbeispiel liegt virtuelle Seite 0 in welchem Frame?', ['PF 3', 'PF 0', 'PF 7', 'PF 1'], 'Frame 0 belegt das OS.', 1],
      ['Welche Frames sind im Beispiel frei?', ['1, 4 und 6', '0, 1 und 2', '3, 5 und 7', 'Keiner'], 'Die übrigen sind mit OS und Prozessseiten belegt.', 1],
      ['Welche zwei Vorteile von Paging nennt das Buch?', ['Flexibilität und Einfachheit der Freispeicherverwaltung', 'Geschwindigkeit und kleine Tabellen', 'Keine Hardware nötig und kein OS nötig', 'Verschlüsselung und Kompression'], 'Keine Annahmen über Heap/Stack und einfache Frame-Vergabe.', 2, 'Flexibilität'],
      ['Wie findet das OS bei Paging Platz für einen Prozess mit 4 Seiten?', ['Es nimmt vier beliebige Frames aus der Free List', 'Es sucht eine zusammenhängende Lücke', 'Es nutzt Best Fit', 'Es verschiebt andere Prozesse'], 'Jeder freie Frame passt.', 2, 'Free List'],
      ['Was speichert die Page Table?', ['Die Übersetzung jeder virtuellen Seite in ihren Frame', 'Die Dateinamen', 'Die Prozesspriorität', 'Die Free List des Heaps'], 'Eine Zuordnung VPN → PFN.', 3, 'Adressübersetzungen'],
      ['Wie viele Page Tables gibt es?', ['Eine pro Prozess', 'Eine für das ganze System', 'Eine pro CPU', 'Eine pro Seite'], 'Jeder Prozess hat eigene Zuordnungen.', 3, 'pro Prozess'],
      ['Warum braucht jeder Prozess eine eigene Page Table?', ['Seine virtuellen Seiten liegen in anderen Frames als die anderer Prozesse', 'Weil das OS es so mag', 'Weil Page Tables klein sind', 'Weil es nur einen Prozess gibt'], 'Gleiche virtuelle Adressen, andere physische Orte.', 3],
      ['Muss eine Seite bei Paging in einem bestimmten Frame liegen?', ['Nein – jede Seite kann in jedem freien Frame liegen', 'Ja, Seite n in Frame n', 'Ja, immer im Frame mit gleicher Adresse', 'Nur Seite 0 ist frei platzierbar'], 'Das macht Paging so flexibel.', 0],
      ['Warum ist Paging flexibel bezüglich Heap und Stack?', ['Es braucht keine Annahmen darüber, wie sie wachsen', 'Weil es keinen Heap gibt', 'Weil der Stack fest ist', 'Weil es Segmente nutzt'], 'Jede Seite wird unabhängig abgebildet.', 2],
      ['Wer belegt im Beispiel Frame 0?', ['Das Betriebssystem', 'Seite 0 des Prozesses', 'Niemand', 'Der Stack'], 'Das OS liegt im ersten Frame.', 1],
      ['Wie viele Frames brauchte der Prozess im Beispiel?', ['4', '8', '3', '1'], 'Einen pro virtueller Seite.', 1],
      ['Welches Konzept aus Kapitel 17 löst Paging elegant?', ['Externe Fragmentierung durch variable Größen', 'Den Context Switch', 'Das Scheduling', 'Die Dateiverwaltung'], 'Feste Größen machen Fit-Strategien überflüssig.', 2],
      ['Was heißt PFN?', ['Physical Frame Number', 'Page File Name', 'Process Frame Node', 'Primary Free Number'], 'Die Nummer des physischen Frames.', 3],
      ['Was heißt VPN?', ['Virtual Page Number', 'Virtual Private Network', 'Variable Page Node', 'Valid Page Number'], 'Die Nummer der virtuellen Seite.', 3]
    ],
    st: { about: 'Paging', T: [['Seiten und Frames sind gleich groß.', 0], ['Jeder Prozess hat eine eigene Page Table.', 3], ['Paging vermeidet externe Fragmentierung.', 0], ['Im Beispiel liegt VP 2 in PF 5.', 3], ['Freie Frames verwaltet das OS in einer Free List.', 2], ['64 Bytes mit 16-Byte-Seiten ergeben 4 Seiten.', 1]],
      F: [['Seiten sind variabel groß.', 'Sie haben eine feste Größe.', 0], ['Es gibt eine Page Table für das ganze System.', 'Eine pro Prozess.', 3], ['Paging leidet unter externer Fragmentierung.', 'Gerade die vermeidet es.', 0], ['Seite n muss in Frame n liegen.', 'Jede Seite kann in jedem Frame liegen.', 0], ['Im Beispiel liegt VP 1 in PF 3.', 'VP 1 liegt in PF 7.', 3], ['Paging braucht Fit-Strategien wie Best Fit.', 'Jeder freie Frame passt.', 2]] },
    gen: [{ n: 10, f: function (r) {
      var as = u.pick(r, [64, 128, 256, 1024, 4096]), ps = u.pick(r, [8, 16, 32, 64]), pm = as * u.pick(r, [2, 4]), np = as / ps, nf = pm / ps;
      return { q: 'Adressraum ' + as + ' Bytes, physischer Speicher ' + pm + ' Bytes, Seitengröße ' + ps + ' Bytes. Wie viele **virtuelle Seiten** und wie viele **Frames** gibt es?', a: u.opts(np + ' Seiten, ' + nf + ' Frames', [nf + ' Seiten, ' + np + ' Frames', np + ' Seiten, ' + np + ' Frames', (as / 2) + ' Seiten, ' + nf + ' Frames']), e: as + ' / ' + ps + ' = ' + np + ' Seiten; ' + pm + ' / ' + ps + ' = ' + nf + ' Frames.', s: 1 };
    } }]
  },
  {
    id: 't2', title: 'Adressübersetzung: VPN & Offset', icon: '🔢', sum: 'Eine virtuelle Adresse zerlegen und in eine physische übersetzen.',
    segs: [
      { h: 'Zwei Teile einer Adresse', t: 'Für die Übersetzung teilt man die virtuelle Adresse in zwei Teile: die **Virtual Page Number**, kurz **VPN**, und den **Offset** innerhalb der Seite. Im Beispiel hat der Adressraum 64 Bytes, braucht also **6 Bit**, denn 2 hoch 6 ist 64. Eine Seite hat 16 Bytes, der Offset braucht also **4 Bit**. Für die VPN bleiben die oberen **2 Bit** – genau richtig für 4 Seiten.',
        v: { type: 'bits', title: '6-Bit-Adresse, 16-Byte-Seiten', bits: '010101', split: [2, 4], labels: ['VPN', 'Offset'], note: '2 Bit VPN (4 Seiten) + 4 Bit Offset (16 Bytes)' } },
      { h: 'Ein Beispiel: Adresse 21', t: 'Ein Prozess lädt von der virtuellen Adresse **21**. Binär ist 21 gleich **01 0101**. Die oberen zwei Bit, **01**, sind die VPN: also virtuelle Seite **1**. Die unteren vier Bit, **0101**, sind der Offset: das **fünfte** Byte der Seite, Offset 5. Nun schaut man in der Page Table nach: Seite 1 liegt in **Frame 7**.',
        v: { type: 'bits', title: 'Virtuelle Adresse 21', bits: '010101', split: [2, 4], labels: ['VPN = 1', 'Offset = 5'], note: 'Seite 1 liegt laut Page Table in Frame 7' } },
      { h: 'Die physische Adresse', t: 'Für die physische Adresse ersetzt man die VPN durch die **PFN** und lässt den **Offset unverändert** – denn das Byte liegt in der Seite an derselben Stelle wie im Frame. Frame 7 ist binär **111**. Zusammen mit dem Offset **0101** ergibt sich **111 0101**, also dezimal **117**. Allgemein: **physisch = PFN mal Seitengröße plus Offset**. Hier: 7 mal 16 plus 5 gleich 117.',
        v: { type: 'xlate', va: 21, vbits: 2, obits: 4, pt: { 0: 3, 1: 7, 2: 5, 3: 2 } } },
      { h: 'Größere Adressräume', t: 'Echte Systeme sind größer. Ein **32-Bit**-Adressraum mit **4-Kilobyte-Seiten** hat **12 Offset-Bit**, denn 2 hoch 12 ist 4096, und **20 Bit VPN**. Das sind 2 hoch 20, also rund eine Million virtuelle Seiten. Die Regel: Offset-Bits gleich log2 der Seitengröße, VPN-Bits gleich Adressbits minus Offset-Bits. Die physische Adresse kann eine andere Breite haben – die PFN wird einfach so breit, wie der physische Speicher es verlangt.',
        v: { type: 'bits', title: '32-Bit-Adresse, 4-KB-Seiten', split: [20, 12], labels: ['VPN (20 Bit)', 'Offset (12 Bit)'], note: '2^20 ≈ 1 Million Seiten à 4096 Bytes' } }
    ],
    q: [
      ['In welche zwei Teile zerlegt man eine virtuelle Adresse bei Paging?', ['VPN und Offset', 'Base und Bounds', 'Segment und Länge', 'PFN und PID'], 'VPN wählt die Seite, Offset das Byte darin.', 0, 'Offset'],
      ['Wie viele Bit braucht ein 64-Byte-Adressraum?', ['6', '8', '4', '64'], '2^6 = 64.', 0, '6 Bit'],
      ['Seitengröße 16 Bytes: Wie viele Offset-Bits?', ['4', '16', '2', '8'], '2^4 = 16.', 0],
      ['64-Byte-Adressraum, 16-Byte-Seiten: Wie viele VPN-Bits?', ['2', '4', '6', '16'], '6 − 4 = 2.', 0],
      ['Virtuelle Adresse 21 (6 Bit, 16-Byte-Seiten). Welche VPN?', ['1', '5', '21', '0'], '21 = 01 0101 → VPN 01 = 1.', 1],
      ['Virtuelle Adresse 21 (6 Bit, 16-Byte-Seiten). Welcher Offset?', ['5', '1', '21', '4'], 'Die unteren 4 Bit 0101 = 5.', 1],
      ['VP 1 liegt in PF 7, Seitengröße 16. Welche physische Adresse hat virtuell 21?', ['117', '21', '112', '37'], '7 · 16 + 5 = 117.', 2, '117'],
      ['Was passiert mit dem Offset bei der Übersetzung?', ['Er bleibt unverändert', 'Er wird zur PFN addiert', 'Er wird verdoppelt', 'Er wird verworfen'], 'Das Byte liegt im Frame an derselben Stelle.', 2, 'Offset unverändert'],
      ['Welche Formel liefert die physische Adresse?', ['PFN · Seitengröße + Offset', 'VPN · Seitengröße + Offset', 'PFN + VPN', 'VPN · PFN'], 'Die VPN wird durch die PFN ersetzt.', 2],
      ['32-Bit-Adressraum, 4-KB-Seiten: Wie viele Offset-Bits?', ['12', '20', '32', '4'], '2^12 = 4096.', 3, '12 Offset-Bit'],
      ['32-Bit-Adressraum, 4-KB-Seiten: Wie viele VPN-Bits?', ['20', '12', '32', '22'], '32 − 12 = 20.', 3],
      ['Wie viele virtuelle Seiten hat ein 32-Bit-Adressraum mit 4-KB-Seiten?', ['2^20 ≈ 1 Million', '2^12 = 4096', '2^32', '1024'], 'Eine Seite pro VPN-Wert.', 3],
      ['Muss die physische Adresse dieselbe Breite haben wie die virtuelle?', ['Nein – die PFN ist so breit, wie der physische Speicher es verlangt', 'Ja, immer', 'Nur bei 64 Bit', 'Nur bei Segmentierung'], 'Im Beispiel: 6 Bit virtuell, 7 Bit physisch.', 3],
      ['Wie viele Bit hat die physische Adresse im Beispiel (128 Bytes)?', ['7', '6', '8', '4'], '2^7 = 128.', 2],
      ['Wie lautet 21 in 6 Bit binär?', ['010101', '101010', '000101', '010001'], '16 + 4 + 1 = 21.', 1],
      ['Welche Bits der virtuellen Adresse bilden die VPN?', ['Die oberen (höchstwertigen)', 'Die unteren', 'Die mittleren', 'Jedes zweite Bit'], 'Der Offset sind die unteren Bits.', 0],
      ['Virtuell 0 im Beispiel (VP 0 → PF 3) wird zu …', ['48', '0', '3', '16'], '3 · 16 + 0 = 48.', 2],
      ['Virtuell 63 im Beispiel (VP 3 → PF 2) wird zu …', ['47', '63', '32', '31'], 'VPN 3, Offset 15: 2 · 16 + 15 = 47.', 2],
      ['Allgemein gilt: Offset-Bits = …', ['log2(Seitengröße)', 'log2(Adressraum)', 'Seitengröße / 2', 'Adressbits − 12'], 'Der Offset adressiert jedes Byte einer Seite.', 3],
      ['Allgemein gilt: VPN-Bits = …', ['Adressbits − Offset-Bits', 'Offset-Bits − Adressbits', 'log2(Seitengröße)', 'Anzahl Frames'], 'Der Rest der Adresse.', 3]
    ],
    st: { about: 'VPN & Offset', T: [['Der Offset bleibt bei der Übersetzung gleich.', 2], ['Die VPN steht in den oberen Bits.', 0], ['Offset-Bits = log2(Seitengröße).', 3], ['32 Bit mit 4-KB-Seiten → 20 Bit VPN.', 3], ['Virtuell 21 wird im Beispiel zu physisch 117.', 2], ['physisch = PFN · Seitengröße + Offset.', 2]],
      F: [['Der Offset wird bei der Übersetzung ersetzt.', 'Ersetzt wird die VPN durch die PFN.', 2], ['Die VPN steht in den unteren Bits.', 'In den oberen Bits.', 0], ['32 Bit mit 4-KB-Seiten → 12 Bit VPN.', '12 Bit Offset, 20 Bit VPN.', 3], ['Virtuell 21 wird im Beispiel zu physisch 21.', 'Zu 117.', 2], ['Physische und virtuelle Adressen haben immer gleich viele Bits.', 'Die PFN kann breiter oder schmaler sein.', 3], ['Virtuell 21 hat im Beispiel die VPN 5.', 'VPN 1, Offset 5.', 1]] },
    gen: [{ n: 14, f: function (r) {
      var vb = u.ri(r, 2, 3), ob = u.ri(r, 3, 5), ps = 1 << ob, np = 1 << vb, pt = {}, used = {}, i;
      for (i = 0; i < np; i++) { var f; do { f = u.ri(r, 1, 15); } while (used[f]); used[f] = 1; pt[i] = f; }
      var va = u.ri(r, 0, (1 << (vb + ob)) - 1), vpn = va >> ob, off = va & (ps - 1), pa = pt[vpn] * ps + off;
      var tab = Object.keys(pt).map(function (k) { return 'VP ' + k + ' → PF ' + pt[k]; }).join(', ');
      return { q: 'Seitengröße ' + ps + ' Bytes, Adressraum ' + (np * ps) + ' Bytes. Page Table: ' + tab + '. Welche physische Adresse hat die virtuelle Adresse **' + va + '**?', a: u.opts(pa, [va, pt[vpn] + off, vpn * ps + off === va ? pt[vpn] * ps : vpn * ps + off, pt[(vpn + 1) % np] * ps + off]), e: va + ' = ' + u.bin(va, vb + ob) + ' → VPN ' + vpn + ', Offset ' + off + '. VP ' + vpn + ' liegt in PF ' + pt[vpn] + ': ' + pt[vpn] + ' · ' + ps + ' + ' + off + ' = ' + pa + '.', s: 2 };
    } }, { n: 8, f: function (r) {
      var ab = u.pick(r, [16, 20, 24, 32, 48]), ps = u.pick(r, [512, 1024, 4096, 8192, 16384]), ob = log2(ps), vb = ab - ob;
      return { q: 'Virtueller Adressraum mit ' + ab + ' Bit, Seitengröße ' + u.kb(ps) + '. Wie viele Bit hat die **VPN**, wie viele der **Offset**?', a: u.opts('VPN ' + vb + ' Bit, Offset ' + ob + ' Bit', ['VPN ' + ob + ' Bit, Offset ' + vb + ' Bit', 'VPN ' + (vb - 2) + ' Bit, Offset ' + (ob + 2) + ' Bit', 'VPN ' + ab + ' Bit, Offset ' + ob + ' Bit']), e: 'Offset = log2(' + ps + ') = ' + ob + ' Bit; VPN = ' + ab + ' − ' + ob + ' = ' + vb + ' Bit.', s: 3 };
    } }]
  },
  {
    id: 't3', title: 'Page Tables & PTEs', icon: '🗂️', sum: 'Wie groß Page Tables sind, wo sie liegen und was in einem Eintrag steht.',
    segs: [
      { h: 'Page Tables sind groß', t: 'Page Tables können **riesig** werden. Ein 32-Bit-Adressraum mit 4-Kilobyte-Seiten hat 2 hoch 20 virtuelle Seiten. Braucht jeder Eintrag, ein **Page Table Entry** oder **PTE**, 4 Bytes, dann ist die Page Table **4 Megabyte** groß – **pro Prozess**! Bei 100 Prozessen sind das 400 Megabyte nur für Übersetzungen. Darum liegen Page Tables nicht in der MMU, sondern **im Speicher**, genauer im Speicher des Betriebssystems.',
        v: { type: 'bars', title: 'Größe linearer Page Tables (4-Byte-PTEs)', items: [['1 Prozess', 4], ['10 Prozesse', 40], ['100 Prozesse', 400]], unit: ' MB' } },
      { h: 'Die lineare Page Table', t: 'Die einfachste Form ist die **lineare Page Table**: ein einfaches **Array**. Das OS **indiziert** es mit der VPN und findet dort den passenden PTE mit der PFN. Später lernen wir fortgeschrittenere Strukturen, die mit weniger Speicher auskommen. Doch was steht in einem PTE außer der PFN? Eine Reihe von **Bits**, die das Verhalten steuern.',
        v: { type: 'code', title: 'Lineare Page Table', code: 'PTE page_table[1 << 20];\n\n// Übersetzung:\nPTE e = page_table[VPN];\nPFN   = e.pfn;', steps: [0, 3, 4], out: ['Index = VPN', 'Eintrag liefert PFN + Bits'] } },
      { h: 'Die Bits eines PTE', t: 'Das **Valid-Bit** zeigt, ob die Übersetzung gültig ist. Ungenutzter Raum zwischen Heap und Stack ist **invalid** – ein Zugriff löst eine Ausnahme aus, und es muss kein Frame dafür reserviert werden. **Protection-Bits** regeln Lesen, Schreiben und Ausführen. Das **Present-Bit** sagt, ob die Seite im Speicher oder ausgelagert auf der Platte liegt. Das **Dirty-Bit** zeigt, ob die Seite seit dem Laden **verändert** wurde. Das **Reference-Bit**, auch Accessed-Bit, zeigt, ob die Seite **benutzt** wurde – wichtig für die Seitenersetzung.',
        v: { type: 'points', title: 'Bits im PTE', items: [['✅', 'Valid: Übersetzung gültig?'], ['🔒', 'Protection: lesen / schreiben / ausführen'], ['💾', 'Present: im Speicher oder auf der Platte?'], ['✏️', 'Dirty: seit dem Laden verändert?'], ['👆', 'Reference / Accessed: kürzlich benutzt?']] } },
      { h: 'Ein x86-PTE', t: 'Ein echter **x86**-Eintrag enthält: das **Present-Bit P**, das Bit **R/W** für Lese- oder Schreibzugriff, das Bit **U/S** für User oder Supervisor, also ob Benutzerprogramme zugreifen dürfen, die Bits **PWT**, **PCD**, **PAT** und **G** für Caching, das **Accessed-Bit A**, das **Dirty-Bit D** und schließlich die **PFN**. Ein separates Valid-Bit gibt es auf x86 nicht – das Present-Bit übernimmt diese Rolle, und das OS unterscheidet mit eigenen Strukturen.',
        v: { type: 'bits', title: 'x86-PTE (32 Bit, vereinfacht)', split: [20, 3, 9], labels: ['PFN', 'frei', 'Flags'], note: 'Flags: G, PAT, D (Dirty), A (Accessed), PCD, PWT, U/S, R/W, P (Present)' } }
    ],
    q: [
      ['Wie groß ist eine lineare Page Table für 32 Bit, 4-KB-Seiten und 4-Byte-PTEs?', ['4 MB', '4 KB', '1 MB', '4 GB'], '2^20 · 4 Bytes = 4 MB.', 0, '4 Megabyte'],
      ['Wie viel Speicher brauchen 100 solcher Page Tables?', ['400 MB', '4 MB', '40 MB', '4 GB'], '100 · 4 MB.', 0],
      ['Wo liegen Page Tables?', ['Im Speicher (des Betriebssystems)', 'Vollständig in der MMU', 'Auf der Festplatte, immer', 'In den CPU-Registern'], 'Sie sind viel zu groß für spezielle Hardware.', 0, 'im Speicher'],
      ['Was ist ein PTE?', ['Ein Page Table Entry – ein Eintrag der Page Table', 'Ein Prozess-Typ', 'Eine Art Interrupt', 'Ein Dateisystem'], 'Er enthält PFN und Statusbits.', 0, 'Page Table Entry'],
      ['Wie ist eine lineare Page Table aufgebaut?', ['Als Array, das mit der VPN indiziert wird', 'Als Baum', 'Als Hash-Tabelle', 'Als verkettete Liste'], 'Die einfachste Form.', 1, 'Array'],
      ['Was zeigt das Valid-Bit an?', ['Ob die Übersetzung gültig ist', 'Ob die Seite verändert wurde', 'Ob die Seite benutzt wurde', 'Ob die Seite ausführbar ist'], 'Invalid → Zugriff löst Ausnahme aus.', 2, 'Valid-Bit'],
      ['Welcher Vorteil ergibt sich aus invaliden Einträgen?', ['Für ungenutzten Raum muss kein Frame reserviert werden', 'Die Page Table wird kleiner', 'Zugriffe werden schneller', 'Die Seiten werden verschlüsselt'], 'Der Raum zwischen Heap und Stack braucht keinen physischen Speicher.', 2],
      ['Was regeln die Protection-Bits?', ['Ob gelesen, geschrieben oder ausgeführt werden darf', 'Ob die Seite im Speicher ist', 'Ob sie benutzt wurde', 'Wer der Besitzer ist'], 'Verstöße lösen eine Ausnahme aus.', 2, 'Protection-Bits'],
      ['Was zeigt das Present-Bit an?', ['Ob die Seite im Speicher oder auf der Platte liegt', 'Ob die Übersetzung gültig ist', 'Ob sie verändert wurde', 'Ob sie gesperrt ist'], 'Grundlage für Swapping.', 2, 'Present-Bit'],
      ['Was zeigt das Dirty-Bit an?', ['Ob die Seite seit dem Laden verändert wurde', 'Ob sie fehlerhaft ist', 'Ob sie benutzt wurde', 'Ob sie gültig ist'], 'Veränderte Seiten müssen vor dem Auslagern zurückgeschrieben werden.', 2, 'Dirty-Bit'],
      ['Wozu dient das Reference-(Accessed-)Bit?', ['Es zeigt, ob die Seite benutzt wurde – wichtig für die Seitenersetzung', 'Es zeigt Schreibrechte', 'Es zählt Prozesse', 'Es markiert Kernel-Seiten'], 'Damit erkennt das OS beliebte Seiten.', 2, 'Reference-Bit'],
      ['Was regelt das U/S-Bit eines x86-PTE?', ['Ob Benutzerprogramme auf die Seite zugreifen dürfen', 'Ob die Seite benutzt wurde', 'Ob die Seite dirty ist', 'Die Seitengröße'], 'User / Supervisor.', 3, 'U/S'],
      ['Was regelt das R/W-Bit eines x86-PTE?', ['Ob geschrieben werden darf', 'Ob die Seite present ist', 'Ob sie gecacht wird', 'Ob sie benutzt wurde'], 'Read/Write.', 3],
      ['Welches Bit übernimmt auf x86 die Rolle des Valid-Bits?', ['Das Present-Bit (P)', 'Das Dirty-Bit (D)', 'Das U/S-Bit', 'Das G-Bit'], 'x86 hat kein separates Valid-Bit.', 3],
      ['Wofür sind PWT, PCD, PAT und G zuständig?', ['Für das Caching-Verhalten', 'Für Zugriffsrechte', 'Für die Seitengröße', 'Für Prozess-IDs'], 'Sie steuern die Hardware-Caches.', 3],
      ['Warum sind lineare Page Tables problematisch?', ['Sie sind sehr groß, auch für ungenutzte Teile des Adressraums', 'Sie sind zu langsam zu indizieren', 'Sie haben keine PFN', 'Sie passen nicht zu Paging'], 'Kapitel 20 zeigt kleinere Alternativen.', 0],
      ['Was passiert bei Zugriff auf eine Seite mit Valid-Bit 0?', ['Eine Ausnahme (Trap) ans OS – meist Prozessende', 'Die Seite wird geladen', 'Nichts', 'Der Zugriff geht auf Frame 0'], 'Ungültige Adresse.', 2],
      ['Wie viele Einträge hat eine lineare Page Table mit 20 VPN-Bits?', ['2^20', '20', '2^12', '2^32'], 'Ein Eintrag pro virtueller Seite.', 1],
      ['Welche Bits des x86-PTE setzt die Hardware automatisch beim Zugriff bzw. Schreiben?', ['A (Accessed) und D (Dirty)', 'P und U/S', 'R/W und G', 'PWT und PCD'], 'Das OS kann sie auswerten.', 3],
      ['Was steht in den oberen Bits eines x86-PTE?', ['Die PFN', 'Die VPN', 'Die Prozess-ID', 'Der Offset'], 'Die Nummer des physischen Frames.', 3]
    ],
    st: { about: 'Page Tables', T: [['Lineare Page Tables sind Arrays, indiziert mit der VPN.', 1], ['Page Tables liegen im Speicher.', 0], ['Das Dirty-Bit zeigt Veränderungen an.', 2], ['Das Present-Bit zeigt, ob eine Seite im Speicher liegt.', 2], ['32 Bit, 4-KB-Seiten, 4-Byte-PTE → 4 MB Page Table.', 0], ['Das U/S-Bit regelt den Zugriff aus dem User-Modus.', 3]],
      F: [['Page Tables liegen komplett in der MMU.', 'Sie liegen im Speicher.', 0], ['Das Dirty-Bit zeigt, ob eine Seite benutzt wurde.', 'Das macht das Reference-Bit; Dirty heißt verändert.', 2], ['Eine lineare Page Table ist ein Baum.', 'Sie ist ein Array.', 1], ['x86 hat ein separates Valid-Bit.', 'Das Present-Bit übernimmt die Rolle.', 3], ['Eine 32-Bit-Page-Table (4 KB, 4 B) ist 4 KB groß.', 'Sie ist 4 MB groß.', 0], ['Invalide Seiten brauchen einen reservierten Frame.', 'Gerade nicht – das spart Speicher.', 2]] },
    gen: [{ n: 14, f: function (r) {
      var ab = u.pick(r, [24, 32, 32, 36]), ps = u.pick(r, [1024, 4096, 4096, 8192, 16384]), pte = u.pick(r, [4, 8]), vb = ab - log2(ps), size = Math.pow(2, vb) * pte;
      var fmt = function (b) { return b >= 1073741824 ? (b / 1073741824) + ' GB' : u.kb(b); };
      return { q: 'Lineare Page Table: ' + ab + '-Bit-Adressraum, Seitengröße ' + u.kb(ps) + ', PTE-Größe ' + pte + ' Bytes. Wie groß ist die Page Table eines Prozesses?', a: u.opts(fmt(size), [fmt(size / pte), fmt(size * 2), fmt(size / 2)]), e: 'VPN-Bits: ' + ab + ' − ' + log2(ps) + ' = ' + vb + ' → 2^' + vb + ' Einträge · ' + pte + ' Bytes = ' + fmt(size) + '.', s: 0 };
    } }]
  },
  {
    id: 't4', title: 'Paging ist langsam', icon: '🐢', sum: 'Ein zusätzlicher Speicherzugriff pro Referenz – und ein Speicher-Trace.',
    segs: [
      { h: 'Der zusätzliche Zugriff', t: 'Nehmen wir die Instruktion `movl 21, %eax`. Um von der virtuellen Adresse 21 zu laden, muss die Hardware erst den **PTE holen**. Dazu kennt sie die Startadresse der Page Table aus dem **Page-Table Base Register**. Sie berechnet: VPN gleich virtuelle Adresse UND VPN-Maske, verschoben um SHIFT. Dann ist die **PTE-Adresse gleich Basis plus VPN mal Größe eines PTE**. Erst danach kann sie die eigentliche Adresse bilden.',
        v: { type: 'code', title: 'Übersetzung in Hardware', code: 'VPN     = (VA & VPN_MASK) >> SHIFT\nPTEAddr = PTBR + (VPN * sizeof(PTE))\nPTE     = AccessMemory(PTEAddr)\nif (PTE.Valid == False)\n  RaiseException(SEGMENTATION_FAULT)\nelse if (CanAccess(PTE.Prot) == False)\n  RaiseException(PROTECTION_FAULT)\nelse\n  offset   = VA & OFFSET_MASK\n  PhysAddr = (PTE.PFN << SHIFT) | offset\n  Register = AccessMemory(PhysAddr)', steps: [0, 1, 2, 3, 5, 8, 9, 10] } },
      { h: 'Masken und Shifts', t: 'Im 64-Byte-Beispiel ist die **VPN_MASK** gleich 11 0000, also hexadezimal 30, und **SHIFT** gleich 4, die Zahl der Offset-Bits. Die **OFFSET_MASK** ist 00 1111. Für Adresse 21 ergibt VA UND VPN_MASK den Wert 01 0000; nach Verschieben um 4 bleibt VPN 1. Am Ende wird die PFN um SHIFT nach links geschoben und mit dem Offset **oder-verknüpft**. Wichtig: Für **jeden** Speicherzugriff braucht Paging einen **zusätzlichen** Zugriff auf die Page Table – das kann alles **um den Faktor zwei oder mehr verlangsamen**.',
        v: { type: 'bits', title: 'VPN_MASK = 0x30, SHIFT = 4', bits: '110000', split: [2, 4], labels: ['Maske 11', '0000'], note: 'VPN = (VA & 0x30) >> 4' } },
      { h: 'Ein Speicher-Trace', t: 'Betrachten wir eine Schleife: `for (i = 0; i < 1000; i++) array[i] = 0;`. Der Compiler erzeugt vier Instruktionen: `movl` schreibt die Null in das Array-Element, `incl` erhöht i, `cmpl` vergleicht mit 1000, hexadezimal 3e8, und `jne` springt zurück. Pro Durchlauf gibt es **vier Instruktionsabrufe** und **einen Store** ins Array – also fünf Speicherzugriffe für das Programm.',
        v: { type: 'code', title: 'Array-Schleife', code: '1024 movl $0x0,(%edi,%eax,4)\n1028 incl %eax\n1032 cmpl $0x03e8,%eax\n1036 jne  0x1024', steps: [0, 1, 2, 3], out: ['4 Fetches', '+ 1 Store'] } },
      { h: 'Doppelt so viele Zugriffe', t: 'Jeder dieser fünf Zugriffe braucht vorher einen **Page-Table-Zugriff**: vier für die Instruktionen und einer für das Array. Pro Schleifendurchlauf sind es also **zehn** Speicherzugriffe statt fünf. Im Buch liegt der Code auf virtueller Seite 1, das Array auf den Seiten 39 und 40. Das zeigt: Ohne weitere Hilfe macht Paging alles **langsam** und braucht **viel Speicher**. Die nächsten Kapitel lösen beides: TLBs gegen die Langsamkeit, kleinere Page Tables gegen den Speicherverbrauch.',
        v: { type: 'bars', title: 'Speicherzugriffe pro Durchlauf', items: [['ohne Paging', 5], ['mit Paging', 10]], unit: '' } }
    ],
    q: [
      ['Welches Register enthält die Startadresse der Page Table?', ['Das Page-Table Base Register (PTBR)', 'Das Bounds-Register', 'Der Stack Pointer', 'Der Program Counter'], 'Daraus und aus der VPN berechnet die Hardware die PTE-Adresse.', 0, 'Page-Table Base Register'],
      ['Wie berechnet die Hardware die Adresse des PTE?', ['PTBR + VPN · sizeof(PTE)', 'PTBR + Offset', 'VPN · Seitengröße', 'PTBR − VPN'], 'Lineare Page Table = Array.', 0, 'PTE-Adresse gleich Basis plus VPN mal Größe'],
      ['Wie wird die VPN aus der virtuellen Adresse gewonnen?', ['(VA & VPN_MASK) >> SHIFT', 'VA & OFFSET_MASK', 'VA << SHIFT', 'VA + PTBR'], 'Maskieren und nach rechts schieben.', 0],
      ['Wie bildet die Hardware die physische Adresse?', ['(PFN << SHIFT) | offset', 'PFN + VPN', '(VPN << SHIFT) | offset', 'PFN & offset'], 'PFN nach links schieben, Offset hineinodern.', 1],
      ['Was ist SHIFT im 64-Byte-Beispiel mit 16-Byte-Seiten?', ['4', '2', '6', '16'], 'Die Anzahl der Offset-Bits.', 1, 'SHIFT gleich 4'],
      ['Was ist die VPN_MASK im 64-Byte-Beispiel?', ['0x30 (110000)', '0x0F (001111)', '0x3F', '0x10'], 'Die beiden oberen der 6 Bits.', 1],
      ['Was ist die OFFSET_MASK im 64-Byte-Beispiel?', ['0x0F (001111)', '0x30 (110000)', '0x3F', '0xF0'], 'Die unteren 4 Bits.', 1],
      ['Was passiert, wenn der PTE invalid ist?', ['Eine Ausnahme (Segmentation Fault)', 'Ein Protection Fault', 'Die Seite wird geladen', 'Nichts'], 'Laut Pseudocode RaiseException(SEGMENTATION_FAULT).', 0],
      ['Was passiert, wenn die Protection-Bits den Zugriff verbieten?', ['Ein Protection Fault', 'Ein Segmentation Fault', 'Ein TLB-Miss', 'Der Zugriff wird ignoriert'], 'CanAccess(PTE.Prot) schlägt fehl.', 0],
      ['Um welchen Faktor kann Paging ohne weitere Hilfe alles verlangsamen?', ['Etwa zwei oder mehr', 'Gar nicht', 'Etwa 1 %', 'Faktor 1000'], 'Ein zusätzlicher Zugriff pro Referenz.', 1, 'Faktor zwei'],
      ['Wie viele Instruktionen hat die Array-Schleife im Buch?', ['4', '3', '5', '10'], 'movl, incl, cmpl, jne.', 2],
      ['Wie viele Speicherzugriffe des Programms entstehen pro Schleifendurchlauf (ohne Paging)?', ['5', '4', '10', '1'], '4 Instruktionen holen + 1 Store.', 2, 'fünf Speicherzugriffe'],
      ['Wie viele Speicherzugriffe entstehen pro Durchlauf mit Paging (ohne TLB)?', ['10', '5', '8', '20'], 'Jeder der 5 Zugriffe braucht einen PTE-Zugriff.', 3, 'zehn'],
      ['Wofür steht 0x03e8 in der Schleife?', ['1000', '3', '1024', '0'], '3e8 hex = 1000 dezimal.', 2],
      ['Welche Instruktion schreibt die Null ins Array?', ['movl $0x0,(%edi,%eax,4)', 'incl %eax', 'cmpl $0x03e8,%eax', 'jne 0x1024'], 'edi = Basis, eax = i, 4 = Elementgröße.', 2],
      ['Welche zwei Probleme hat einfaches Paging laut Kapitel?', ['Es ist langsam und braucht viel Speicher für Page Tables', 'Es ist unsicher und unflexibel', 'Es hat externe Fragmentierung und keine Protection', 'Es braucht keine Hardware'], 'TLBs und kleinere Tabellen lösen das.', 3],
      ['Welche Technik bekämpft die Langsamkeit von Paging?', ['TLBs', 'Segmentierung', 'Coalescing', 'Round Robin'], 'Kapitel 19.', 3],
      ['Wie viele Page-Table-Zugriffe braucht ein Durchlauf der Schleife?', ['5', '4', '1', '10'], 'Einer pro Speicherzugriff des Programms.', 3],
      ['Warum muss auch das Holen von Instruktionen übersetzt werden?', ['Weil Code ebenfalls an virtuellen Adressen liegt', 'Weil Code im Kernel liegt', 'Muss es nicht', 'Weil Instruktionen verschlüsselt sind'], 'Jeder Fetch ist ein Speicherzugriff.', 2],
      ['Virtuell 21, VPN_MASK 0x30, SHIFT 4. Welche VPN?', ['1', '5', '2', '0'], '21 & 0x30 = 16; 16 >> 4 = 1.', 1]
    ],
    st: { about: 'Paging-Ablauf', T: [['Paging braucht einen zusätzlichen Zugriff pro Referenz.', 1], ['Das PTBR enthält die Startadresse der Page Table.', 0], ['PTE-Adresse = PTBR + VPN · sizeof(PTE).', 0], ['Die Array-Schleife braucht 10 Zugriffe pro Durchlauf.', 3], ['physisch = (PFN << SHIFT) | offset.', 1], ['TLBs sollen Paging beschleunigen.', 3]],
      F: [['Paging braucht keine zusätzlichen Speicherzugriffe.', 'Pro Referenz kommt ein PTE-Zugriff dazu.', 1], ['Die PTE-Adresse ist PTBR + Offset.', 'PTBR + VPN · sizeof(PTE).', 0], ['Die Array-Schleife braucht 5 Zugriffe pro Durchlauf mit Paging.', 'Es sind 10.', 3], ['SHIFT ist die Anzahl der VPN-Bits.', 'Es ist die Anzahl der Offset-Bits.', 1], ['Instruktionsabrufe werden nicht übersetzt.', 'Auch sie werden übersetzt.', 2], ['Ein ungültiger PTE löst einen Protection Fault aus.', 'Das ist ein Segmentation Fault.', 0]] },
    gen: [{ n: 10, f: function (r) {
      var ins = u.ri(r, 3, 6), data = u.ri(r, 1, 3), it = u.pick(r, [10, 100, 1000]), per = 2 * (ins + data);
      return { q: 'Eine Schleife hat ' + ins + ' Instruktionen und ' + data + ' Datenzugriff(e) pro Durchlauf. Paging mit linearer Page Table, **ohne TLB**. Wie viele Speicherzugriffe entstehen in ' + it + ' Durchläufen?', a: u.opts(per * it, [(ins + data) * it, (2 * ins + data) * it, (ins + 2 * data) * it]), e: 'Pro Durchlauf: ' + (ins + data) + ' Zugriffe + ebenso viele PTE-Zugriffe = ' + per + '. Mal ' + it + ' = ' + (per * it) + '.', s: 3 };
    } }, { n: 8, f: function (r) {
      var ptbr = u.pick(r, [1, 2, 4, 8]) * 4096, vpn = u.ri(r, 1, 40), pte = u.pick(r, [4, 8]);
      return { q: 'PTBR = ' + ptbr + ', PTE-Größe ' + pte + ' Bytes. An welcher Adresse liegt der PTE für VPN ' + vpn + '?', a: u.opts(ptbr + vpn * pte, [ptbr + vpn, ptbr + (vpn + 1) * pte, vpn * pte]), e: ptbr + ' + ' + vpn + ' · ' + pte + ' = ' + (ptbr + vpn * pte) + '.', s: 0 };
    } }]
  }
  ] });
})();
