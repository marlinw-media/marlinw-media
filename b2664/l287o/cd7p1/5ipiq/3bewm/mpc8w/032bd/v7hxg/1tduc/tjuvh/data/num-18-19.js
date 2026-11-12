/* Eingabefragen (Antwort als Zahl eintippen) für Kapitel 18 und 19.
   Generator liefert: { q, num: Ergebnis, unit: 'Bytes', hint: Formatangabe, e: Rechenweg, s: Abschnitt, wr: { 'falscherWert': 'typischer Fehler' } } */
(function () {
  var u = OSTEP.u;
  function log2(x) { return Math.round(Math.log(x) / Math.LN2); }
  function add(n, tid, g) { var t = OSTEP.chapters[n].topics.filter(function (x) { return x.id === tid; })[0]; (t.gen = t.gen || []).push(g); }

  /* ---- Kapitel 18 ---- */
  add(18, 't1', { n: 6, f: function (r) {
    var as = u.pick(r, [64, 128, 256, 1024]), ps = u.pick(r, [8, 16, 32]), v = as / ps, wr = {};
    wr[ps] = 'Das ist die Seitengröße, nicht die Anzahl der Seiten.'; wr[as] = 'Das ist die Größe des Adressraums in Bytes.';
    return { q: 'Ein virtueller Adressraum ist **' + as + ' Bytes** groß, eine Seite **' + ps + ' Bytes**. Wie viele **virtuelle Seiten** gibt es?', num: v, unit: 'Seiten', hint: 'Ganze Zahl (dezimal), nur die Anzahl', e: '**Rechenweg:** Anzahl Seiten = Adressraum / Seitengröße = ' + as + ' / ' + ps + ' = **' + v + '**.', s: 1, wr: wr };
  } });
  add(18, 't2', { n: 10, f: function (r) {
    var vb = 2, ob = u.pick(r, [4, 4, 5]), ps = 1 << ob, pt = { 0: 3, 1: 7, 2: 5, 3: 2 }, va = u.ri(r, 0, (1 << (vb + ob)) - 1), vpn = va >> ob, off = va & (ps - 1), pa = pt[vpn] * ps + off, wr = {};
    wr[va] = 'Das ist die unübersetzte **virtuelle** Adresse – die VPN muss durch die PFN ersetzt werden.'; wr[pt[vpn] * ps] = 'Das ist nur der **Anfang des Frames** – der Offset ' + off + ' fehlt.'; wr[vpn * ps + off] = 'Hier wurde mit der VPN statt mit der PFN gerechnet.'; wr[pt[vpn] + off] = 'Die PFN muss erst mit der Seitengröße ' + ps + ' multipliziert werden.';
    return { q: 'Seitengröße **' + ps + ' Bytes**, Page Table: VP 0 → PF 3, VP 1 → PF 7, VP 2 → PF 5, VP 3 → PF 2. Welche **physische Adresse** gehört zur virtuellen Adresse **' + va + '**?', num: pa, unit: '', hint: 'Dezimale Adresse als ganze Zahl (z. B. 117), keine Hex-Schreibweise', e: '**Rechenweg:** ' + va + ' = ' + u.bin(va, vb + ob) + ' → VPN = ' + vpn + ', Offset = ' + off + '.\nVP ' + vpn + ' liegt in PF ' + pt[vpn] + '.\nphysisch = PFN · Seitengröße + Offset = ' + pt[vpn] + ' · ' + ps + ' + ' + off + ' = **' + pa + '**.', s: 2, wr: wr };
  } });
  add(18, 't2', { n: 8, f: function (r) {
    var ab = u.pick(r, [16, 24, 32, 48]), ps = u.pick(r, [512, 1024, 4096, 8192, 16384]), ob = log2(ps), vb = ab - ob, wr = {};
    wr[ob] = 'Das ist die Zahl der **Offset**-Bits (log2 der Seitengröße).'; wr[ab] = 'Das ist die Länge der ganzen Adresse.';
    return { q: 'Ein virtueller Adressraum hat **' + ab + ' Bit**, die Seitengröße ist **' + u.kb(ps) + '**. Wie viele Bit hat die **VPN**?', num: vb, unit: 'Bit', hint: 'Ganze Zahl (Anzahl Bits)', e: '**Rechenweg:** Offset-Bits = log2(' + ps + ') = ' + ob + '.\nVPN-Bits = Adressbits − Offset-Bits = ' + ab + ' − ' + ob + ' = **' + vb + '**.', s: 3, wr: wr };
  } });
  add(18, 't3', { n: 8, f: function (r) {
    var ab = u.pick(r, [24, 32]), ps = u.pick(r, [1024, 4096, 16384]), pte = u.pick(r, [4, 8]), vb = ab - log2(ps), kb = Math.pow(2, vb) * pte / 1024, wr = {};
    wr[Math.pow(2, vb) * pte] = 'Das ist die Größe in **Bytes** – gefragt war KB (durch 1024 teilen).'; wr[Math.pow(2, vb) / 1024] = 'Die PTE-Größe (' + pte + ' Bytes) wurde vergessen.';
    return { q: 'Lineare Page Table: **' + ab + '-Bit**-Adressraum, Seitengröße **' + u.kb(ps) + '**, PTE-Größe **' + pte + ' Bytes**. Wie groß ist die Page Table **in KB**?', num: kb, unit: 'KB', hint: 'Zahl in Kilobyte (1 KB = 1024 Bytes), ohne Einheit eintippen', e: '**Rechenweg:** VPN-Bits = ' + ab + ' − ' + log2(ps) + ' = ' + vb + ' → 2^' + vb + ' = ' + Math.pow(2, vb) + ' Einträge.\nGröße = ' + Math.pow(2, vb) + ' · ' + pte + ' Bytes = ' + Math.pow(2, vb) * pte + ' Bytes = **' + kb + ' KB**.', s: 0, wr: wr };
  } });
  add(18, 't4', { n: 6, f: function (r) {
    var ins = u.ri(r, 3, 6), data = u.ri(r, 1, 2), it = u.pick(r, [10, 50, 100]), v = 2 * (ins + data) * it, wr = {};
    wr[(ins + data) * it] = 'Das sind nur die eigentlichen Zugriffe – ohne die PTE-Zugriffe.';
    return { q: 'Eine Schleife hat pro Durchlauf **' + ins + ' Instruktionen** und **' + data + ' Datenzugriff(e)**. Lineare Page Table, **kein TLB**. Wie viele **Speicherzugriffe** entstehen in **' + it + '** Durchläufen?', num: v, unit: 'Zugriffe', hint: 'Ganze Zahl (Anzahl aller Speicherzugriffe inkl. Page Table)', e: '**Rechenweg:** pro Durchlauf ' + ins + ' Fetches + ' + data + ' Datenzugriffe = ' + (ins + data) + ' Zugriffe, jeder braucht vorher einen PTE-Zugriff → ' + 2 * (ins + data) + '.\n' + 2 * (ins + data) + ' · ' + it + ' = **' + v + '**.', s: 3, wr: wr };
  } });

  /* ---- Kapitel 19 ---- */
  add(19, 't1', { n: 6, f: function (r) {
    var tot = u.pick(r, [20, 40, 50, 200]), h = u.ri(r, 10, 19) * 5, hits = tot * h / 100, wr = {};
    wr[100 - h] = 'Das ist die **Miss**-Rate.'; wr[hits] = 'Das ist die Anzahl der Hits, nicht der Anteil in Prozent.';
    return { q: 'Bei **' + tot + '** Speicherzugriffen gibt es **' + hits + ' TLB-Hits**. Wie hoch ist die **Trefferquote**?', num: h, unit: '%', hint: 'Prozentzahl ohne %-Zeichen (z. B. 70)', e: '**Rechenweg:** Trefferquote = Hits / Zugriffe = ' + hits + ' / ' + tot + ' = ' + u.num(h / 100) + ' = **' + h + ' %**.', s: 2, wr: wr };
  } });
  add(19, 't2', { n: 10, f: function (r) {
    var ps = u.pick(r, [16, 32, 64]), es = 4, n = u.ri(r, 6, 24), start = u.ri(r, 0, ps / es - 1) * es + u.ri(r, 2, 9) * ps;
    var first = Math.floor(start / ps), lastA = start + (n - 1) * es, last = Math.floor(lastA / ps), miss = last - first + 1, wr = {};
    wr[n] = 'Ein Miss gibt es nur beim **ersten** Zugriff auf jede Seite, nicht bei jedem Element.'; wr[n - miss] = 'Das ist die Zahl der **Hits**.';
    return { q: 'Ein Array aus **' + n + ' Integern à 4 Bytes** beginnt bei der virtuellen Adresse **' + start + '**. Seitengröße **' + ps + ' Bytes**, der TLB ist anfangs leer. Wie viele **TLB-Misses** gibt es beim einmaligen Durchlaufen?', num: miss, unit: 'Misses', hint: 'Ganze Zahl (Anzahl der Misses)', e: '**Rechenweg:** erstes Element auf Seite ' + start + ' / ' + ps + ' = ' + first + ' (abgerundet).\nletztes Element bei ' + start + ' + ' + (n - 1) + ' · 4 = ' + lastA + ' → Seite ' + last + '.\nSeiten ' + first + ' bis ' + last + ' = **' + miss + '** Seiten → ' + miss + ' Misses (je einer pro Seite).', s: 1, wr: wr };
  } });
  add(19, 't2', { n: 6, f: function (r) {
    var ps = u.pick(r, [1024, 2048, 4096, 8192]), es = u.pick(r, [4, 8]), v = ps / es, wr = {};
    wr[ps] = 'Das ist die Seitengröße in Bytes – noch durch die Elementgröße teilen.';
    return { q: 'Wie viele Array-Elemente à **' + es + ' Bytes** passen auf **eine** Seite von **' + u.kb(ps) + '**?', num: v, unit: 'Elemente', hint: 'Ganze Zahl', e: '**Rechenweg:** ' + ps + ' Bytes / ' + es + ' Bytes = **' + v + '** Elemente → bei dichtem Zugriff nur 1 Miss pro ' + v + ' Elemente.', s: 2, wr: wr };
  } });
  add(19, 't4', { n: 8, f: function (r) {
    var ent = u.pick(r, [16, 32, 64, 128]), ps = u.pick(r, [4, 8, 16]), v = ent * ps, wr = {};
    wr[ent] = 'Das ist nur die Zahl der Einträge – noch mit der Seitengröße multiplizieren.'; wr[v * 1024] = 'Das ist der Wert in **Bytes** – gefragt war KB.';
    return { q: 'Ein TLB hat **' + ent + ' Einträge**, die Seitengröße ist **' + ps + ' KB**. Wie groß ist die **TLB-Abdeckung**?', num: v, unit: 'KB', hint: 'Zahl in Kilobyte, ohne Einheit eintippen', e: '**Rechenweg:** Abdeckung = Einträge · Seitengröße = ' + ent + ' · ' + ps + ' KB = **' + v + ' KB**.', s: 3, wr: wr };
  } });
  add(19, 't4', { n: 5, f: function (r) {
    var b = u.pick(r, [4, 6, 8, 10, 12]), v = Math.pow(2, b), wr = {};
    wr[b] = 'Das ist die Zahl der Bits – gefragt war die Zahl der unterscheidbaren Werte (2 hoch Bits).'; wr[2 * b] = 'Nicht 2 · Bits, sondern 2 **hoch** Bits.';
    return { q: 'Ein TLB nutzt ASIDs mit **' + b + ' Bit**. Wie viele Adressräume kann er gleichzeitig unterscheiden?', num: v, unit: 'Adressräume', hint: 'Ganze Zahl (dezimal)', e: '**Rechenweg:** ' + b + ' Bit → 2^' + b + ' = **' + v + '** verschiedene Werte.', s: 2, wr: wr };
  } });
})();
