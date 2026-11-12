/* Kapitel 19 – „Ausführlich erklärt“: warum die richtige Antwort richtig ist */
(function () {
  var L = OSTEP.lang = OSTEP.lang || {};
  L['19-t1'] = {
    q: [
      '**TLB** steht für **Translation Lookaside Buffer**. Der Name ist historisch: Beim Atlas-Rechner in Manchester nannte man einen Cache „lookaside buffer“; ein Cache für Adress**übersetzungen** (translations) wurde so zum Translation Lookaside Buffer. Das Buch meint, „address-translation cache“ wäre eigentlich der treffendere Name – genau das ist er.',
      'Der TLB ist Teil der **MMU (Memory Management Unit)**, also des Bereichs im Prozessor, der virtuelle in physische Adressen übersetzt. Er sitzt direkt am Rechenkern und ist dadurch extrem schnell – eine Antwort dauert nur wenige Taktzyklen statt der vielen Nanosekunden eines Speicherzugriffs.',
      'Der TLB speichert **beliebte Übersetzungen VPN → PFN** (plus Schutzbits), nicht die Daten selbst. Die vollständige Liste aller Übersetzungen steht weiterhin in der Page Table im Speicher; der TLB ist nur eine kleine, schnelle Kopie der am häufigsten gebrauchten Einträge.',
      'Ein Cache funktioniert nur, wenn sich Zugriffe **wiederholen** (zeitliche Lokalität) oder **nah beieinander** liegen (räumliche Lokalität). Zufällige Zugriffe auf einen riesigen Bereich berühren ständig neue Seiten, die nicht in die wenigen TLB-Einträge passen – fast jeder Zugriff wird ein Miss. Das Buch nennt das „exceeding the TLB coverage“ und zitiert **Culler’s Law**: „RAM isn’t always RAM“ – nicht jeder Speicherzugriff ist gleich schnell.',
      'Bei einem **TLB-Hit** liegt die Übersetzung bereits im TLB. Die Hardware nimmt die PFN aus dem Eintrag, hängt den Offset der virtuellen Adresse an und greift direkt auf den Speicher zu. Der teure Zugriff auf die Page Table entfällt – im Normalfall läuft das Programm dadurch fast so schnell, als gäbe es gar keine Virtualisierung.',
      'Auch bei einem Hit prüft die Hardware mit CanAccess(TlbEntry.ProtectBits) die **Zugriffsrechte**. Sonst könnte ein Programm über den schnellen Weg z. B. auf eine schreibgeschützte Seite schreiben. Deshalb stehen die Protection-Bits mit im TLB-Eintrag; ein verbotener Zugriff führt zu einem Protection Fault.',
      'Bei einem Miss mit hardwareverwaltetem TLB geht die Hardware zur **Page Table** (über das PTBR), liest den PTE, prüft Gültigkeit und Rechte, fügt die Übersetzung mit TLB_Insert in den TLB ein und führt die **Instruktion erneut** aus. Beim zweiten Versuch ist es ein Hit. So steht es in Figure 19.1 des Buches.',
      'Ein Miss erfordert mindestens einen **zusätzlichen Speicherzugriff** auf die Page Table – bei mehrstufigen Tabellen sogar mehrere. Speicherzugriffe sind im Vergleich zu CPU-Instruktionen sehr teuer. Passieren Misses häufig, läuft das Programm deutlich langsamer; das Ziel ist deshalb, Misses so weit wie möglich zu vermeiden.',
      'Nach dem Einfügen ist der eigentliche Speicherzugriff der Instruktion noch gar nicht passiert. Deshalb wird **dieselbe Instruktion wiederholt** (RetryInstruction). Diesmal findet die Hardware die Übersetzung im TLB – ein Hit – und der Zugriff wird schnell erledigt.',
      '**Zeitliche Lokalität** bedeutet: Eine Instruktion oder ein Datum, auf das gerade zugegriffen wurde, wird **bald wieder** benutzt. Typische Beispiele aus dem Buch sind Schleifenvariablen und die Instruktionen einer Schleife – sie werden über die Zeit immer wieder angesprochen.',
      '**Räumliche Lokalität** bedeutet: Greift ein Programm auf Adresse x zu, greift es wahrscheinlich bald auf Adressen **in der Nähe von x** zu. Das klassische Beispiel ist das Durchlaufen eines Arrays, Element für Element. Benachbarte Elemente liegen meist auf derselben Seite und teilen sich eine TLB-Übersetzung.',
      'Das Buch erklärt es mit **Physik**: Je größer ein Speicher, desto länger sind die Signalwege, und Effekte wie die Lichtgeschwindigkeit werden relevant. Ein großer Cache ist deshalb zwangsläufig langsam und verfehlt seinen Zweck. Man bleibt bei **kleinen, schnellen** Caches und versucht, sie möglichst geschickt zu nutzen.',
      'Der TLB lohnt sich nur, wenn die meisten Zugriffe **Hits** sind – dann kostet Paging fast nichts. Jeder Miss bringt dagegen den vollen Preis des Page-Table-Zugriffs zurück. Gemessen wird das mit der **Trefferquote** (Hits ÷ Zugriffe), die man möglichst nahe an 100 % bringen möchte.',
      'Bei einem Miss liest die Hardware den PTE aus der Page Table. Ist er **ungültig**, gehört die Adresse nicht zum Prozess, und laut Figure 19.1 wird **RaiseException(SEGMENTATION_FAULT)** ausgelöst. Eine ungültige Übersetzung wird natürlich nicht in den TLB eingetragen.',
      'Die Instruktionen einer Schleife werden bei jedem Durchlauf **erneut** von denselben Adressen geholt. Das ist der Inbegriff **zeitlicher Lokalität**: dieselben Speicherstellen in kurzer Zeit immer wieder. Ihre Übersetzungen bleiben im TLB, und alle weiteren Durchläufe treffen.',
      'Wird ein Array Element für Element durchlaufen, folgt auf Adresse x direkt x + 4, x + 8 usw. – **benachbarte** Adressen. Das ist **räumliche Lokalität**. Im Buchbeispiel sorgt sie dafür, dass nur das erste Element jeder Seite einen Miss erzeugt.',
      'Der TLB ist nach **Seiten** organisiert: Jeder Eintrag gilt für eine ganze virtuelle Seite. Deshalb extrahiert die Hardware zuerst die **VPN** aus der virtuellen Adresse (VPN = (VA & VPN_MASK) >> SHIFT) und sucht damit im TLB. Der Offset wird erst danach an die gefundene PFN gehängt.',
      'Der TLB ist ein **Hardware-Cache auf dem Chip**, direkt beim Rechenkern. Läge er im Hauptspeicher, wäre ein Nachschlagen genauso teuer wie ein Page-Table-Zugriff – der ganze Vorteil wäre weg. Das Buch sagt sogar: TLBs machen virtuellen Speicher in gewissem Sinne erst **möglich**.',
      'Kapitel 18 endete mit zwei Problemen: Paging ist **zu langsam** und braucht **zu viel Speicher**. Der TLB löst das erste: Er spart den zusätzlichen Page-Table-Zugriff, der jeden Speicherzugriff verdoppelt. Das Platzproblem lösen erst die kleineren Page Tables in Kapitel 20.',
      'Das Buch nennt Caching eine der **grundlegendsten Techniken** in Computersystemen, um den Normalfall schnell zu machen. Ob Instruktions-, Daten- oder Übersetzungs-Cache: Alle nutzen **Lokalität**, indem sie Kopien in kleinem, schnellem Speicher halten. Der TLB ist einfach ein Cache für Adressübersetzungen.'
    ],
    T: [
      'Der TLB ist ein kleiner **Hardware-Cache** in der MMU, der beliebte Übersetzungen VPN → PFN speichert – ein „address-translation cache“.',
      'Bei einem Hit liefert der TLB die PFN direkt; der Zugriff auf die Page Table **entfällt**. Genau das macht Paging schnell.',
      'Nach einem Miss wird die Übersetzung eingefügt und die **auslösende Instruktion wiederholt** – diesmal mit Hit.',
      'Array-Elemente liegen nebeneinander auf denselben Seiten; nach dem ersten Zugriff treffen die Nachbarn – **räumliche Lokalität**.',
      'Große Speicher sind physikalisch langsamer; ein schneller Cache muss deshalb **klein** sein.',
      'Der TLB gehört zur **MMU**, dem Teil des Prozessors, der Adressen übersetzt.'
    ],
    F: [
      'Falsch: Der TLB speichert nur **Übersetzungen** (VPN → PFN plus Bits), nicht die Daten der Seiten.',
      'Falsch: Bei einem Hit wird die Page Table **nicht** gelesen – genau das ist der Sinn des TLB.',
      'Falsch: Der Speicherzugriff steht noch aus, deshalb wird **dieselbe** Instruktion wiederholt.',
      'Falsch: „Dieselbe Adresse wieder“ ist **zeitliche** Lokalität. Räumlich heißt: benachbarte Adressen.',
      'Falsch: Je größer ein Cache, desto **langsamer** ist er – darum sind TLBs klein.',
      'Falsch: Der TLB ist **Hardware auf dem Chip** in der MMU, nicht im Hauptspeicher.'
    ],
    g: [
      'Die Trefferquote misst, wie oft der TLB die Übersetzung schon kennt: **Hits ÷ alle Zugriffe**, als Prozentzahl. 100 % minus Trefferquote ist die Miss-Rate. Je höher die Trefferquote, desto weniger merkt man vom Paging-Overhead.',
      'Rechne Hits ÷ Zugriffe und multipliziere mit 100. Beispiel aus dem Buch: 7 Hits bei 10 Zugriffen ergeben 70 %. Verwechsle die Trefferquote nicht mit der Miss-Rate oder mit der absoluten Zahl der Hits.'
    ]
  };
  L['19-t2'] = {
    q: [
      'In C liegen die Elemente einer Zeile direkt hintereinander im Speicher (zeilenweise Ablage). Läuft die **innere Schleife über die Spalten**, greift man auf benachbarte Adressen zu – optimale **räumliche Lokalität**: Viele Zugriffe teilen sich eine Seite und damit eine TLB-Übersetzung. Spaltenweise springt man bei jedem Zugriff um eine ganze Zeilenlänge, bei großen Matrizen jedes Mal auf eine neue Seite – das erzeugt viele Misses.',
      'Im Buchbeispiel hat der Adressraum 16-Byte-Seiten. Das Array beginnt bei Adresse 100: 100 ÷ 16 = 6 Rest 4. Also liegt a[0] auf **Seite 6** (VPN = 06) bei Offset 4. Auf diese Seite passen nur noch drei Integer (a[0] bis a[2]), danach geht das Array auf Seite 7 weiter.',
      'Mit einer Schrittweite von genau einer Seite (4096 Bytes) landet **jeder** Zugriff auf einer neuen Seite. Beim ersten Durchlauf ist keine dieser Übersetzungen im TLB – jeder Zugriff ist ein Miss, die Trefferquote ist **0 %**. Genau dieses Muster nutzt die Hausaufgabe des Buches, um TLB-Größe und Miss-Kosten zu **messen**.',
      'Seite 7 umfasst die Adressen 7 · 16 = 112 bis 127. Das Element a[i] liegt bei 100 + 4i: a[3] bei 112, a[6] bei 124. Also liegen **a[3] bis a[6]** – vier Integer – auf Seite 7. Das Buch zeigt diese Aufteilung in Figure 19.2.',
      'Ein Miss entsteht nur beim **ersten Zugriff auf jede Seite**. Das Array verteilt sich auf die Seiten 6, 7 und 8, also gibt es **3 Misses**: bei a[0], a[3] und a[7]. Das Buch fasst die Folge zusammen: miss, hit, hit, miss, hit, hit, hit, miss, hit, hit.',
      'Von 10 Zugriffen sind 3 Misses und 7 Hits. Trefferquote = 7 ÷ 10 = **70 %**. Das Buch betont: Das ist zwar nicht hoch, aber **nicht null** – erstaunlich, weil das Programm das Array zum ersten Mal berührt. Verantwortlich ist die räumliche Lokalität.',
      'Die Hits im ersten Durchlauf entstehen, weil die Elemente **dicht nebeneinander** auf denselben Seiten liegen: Nach dem Miss bei a[0] steht die Übersetzung für Seite 6 im TLB, und a[1] und a[2] treffen. Das ist **räumliche Lokalität** – Nachbarschaft im Speicher.',
      'Mit 32-Byte-Seiten passen 8 statt 4 Integer auf eine Seite. Das Array braucht dadurch weniger Seiten und es gibt **weniger Seitenwechsel**, also weniger Misses. Das Buch: Wäre die Seite doppelt so groß gewesen, hätte der Zugriff noch weniger Misses erlitten.',
      'Bei 4-KB-Seiten passen 1024 Integer auf eine Seite. Ein dichtes Array erzeugt deshalb nur beim ersten Element jeder Seite einen Miss – **einen Miss pro Seite**, danach über tausend Hits. Das Buch nennt das „exzellente TLB-Performance“ für dichte, arraybasierte Zugriffe.',
      'Wird das Array kurz danach noch einmal durchlaufen und der TLB ist groß genug, stehen alle drei Übersetzungen noch darin. Jeder Zugriff ist ein Hit: **100 %**. Das Buch schreibt die Folge aus: hit, hit, hit, … – zehnmal.',
      'Der zweite Durchlauf benutzt **dieselben** Seiten wie der erste, kurz danach. Das ist **zeitliche Lokalität** – das schnelle Wiederverwenden derselben Speicherstellen. Das Buch: TLBs profitieren sowohl von räumlicher als auch von zeitlicher Lokalität, beides Eigenschaften des Programms.',
      'Ein TLB hat nur wenige Einträge. Springt ein Programm **wild über viele Seiten**, braucht es ständig Übersetzungen, die nicht im TLB stehen – viele Misses. Arrays der Reihe nach, kleine Schleifen oder wiederholte Zugriffe auf dieselbe Variable sind dagegen TLB-freundlich.',
      'Ein Array liegt **zusammenhängend** im Speicher, also teilen sich viele Elemente eine Seite. Knoten einer verketteten Liste werden dagegen einzeln angelegt und liegen oft auf **verschiedenen Seiten**. Beim Durchlaufen berührt man dadurch viel mehr Seiten, jede neue bringt einen Miss – schlechtere räumliche Lokalität.',
      'Seite 7 beginnt bei Adresse 112. Das Element a[3] liegt bei 100 + 3 · 4 = 112 – es ist das **erste** Element auf Seite 7, und dessen Übersetzung ist noch nicht im TLB. Also verursacht **a[3]** den zweiten Miss; a[4] bis a[6] treffen danach.',
      'Seite 8 beginnt bei Adresse 128 = 100 + 7 · 4. **a[7]** ist das erste Element auf Seite 8 und verursacht den dritten und letzten Miss. a[8] und a[9] liegen ebenfalls auf Seite 8 und treffen.',
      'Eine 4-KB-Seite hat 4096 Bytes, ein Integer 4 Bytes: 4096 ÷ 4 = **1024** Integer pro Seite. Daraus folgt: Bei einem dichten Integer-Array gibt es höchstens einen Miss pro 1024 Elemente – eine Trefferquote von über 99,9 %.',
      'Ein seitenausgerichtetes 8-KB-Array belegt genau **2 Seiten**. Im ersten Durchlauf entstehen 2 Misses. Danach stehen beide Übersetzungen im TLB, und alle 99 weiteren Durchläufe treffen dank **zeitlicher Lokalität** – insgesamt also nur **2 Misses** bei Tausenden Zugriffen.',
      'Beim einmaligen Durchlaufen entsteht **ein Miss pro Seite**. Weniger Seiten heißt weniger Misses – und weniger Seiten für denselben Datenbereich bekommt man mit **größeren Seiten**. Das Buch erwähnt, dass z. B. Datenbanken genau deshalb große Seiten nutzen, um die TLB-Abdeckung zu erhöhen.',
      '10 Integer à 4 Bytes sind 40 Bytes. Eine 16-Byte-Seite fasst 4 Integer; 40 Bytes passen deshalb selbst bei optimaler Ausrichtung nur auf **3 Seiten** (16 + 16 + 8). Auch bei Offset 0 gibt es also 3 Misses – die Lage ändert hier nur, welche Elemente die Misses auslösen.',
      'Ein **kleines Array mehrmals** zu durchlaufen nutzt beides: Benachbarte Elemente teilen sich Seiten (**räumlich**), und dieselben Seiten werden kurz danach wieder benutzt (**zeitlich**). Das Ergebnis sind fast ausschließlich Hits – ein ideales Muster für jeden Cache.'
    ],
    T: [
      'Das Array liegt auf den Seiten 6, 7 und 8; nur der erste Zugriff pro Seite ist ein Miss → **3 Misses, 7 Hits**.',
      'Adresse 100 ÷ 16 = 6 Rest 4: a[0] liegt auf **Seite 6**, Offset 4.',
      'Größere Seiten fassen mehr Elemente; das Array braucht weniger Seiten, also gibt es **weniger Misses**.',
      'Beim zweiten Durchlauf stehen alle Übersetzungen noch im TLB → **100 % Hits** dank zeitlicher Lokalität.',
      'Nach dem Miss für eine Seite treffen alle Nachbarn auf derselben Seite – das ist **räumliche Lokalität**.',
      'Seite 7 umfasst die Adressen 112–127; a[i] liegt bei 100 + 4i → **a[3] bis a[6]**.'
    ],
    F: [
      'Falsch: Es gibt nur einen Miss **pro Seite** – bei drei Seiten also 3, nicht 10.',
      'Falsch: Größere Seiten **senken** die Zahl der Misses, weil mehr Elemente auf eine Seite passen.',
      'Falsch: Im zweiten Durchlauf treffen alle Zugriffe – **100 %**, nicht 70 %.',
      'Falsch: 100 ÷ 16 = 6 Rest 4 – a[0] liegt auf Seite **6**.',
      'Falsch: Im ersten Durchlauf gibt es noch keine Wiederholung. Die Hits kommen von **räumlicher** Lokalität.',
      'Falsch: Sprünge über viele Seiten erzeugen **viele Misses** – sie sind das schlechteste Muster für den TLB.'
    ],
    g: [
      'Für die Zahl der Misses musst du nur zählen, **wie viele verschiedene Seiten** das Array berührt: Seite des ersten Elements = Startadresse ÷ Seitengröße, Seite des letzten Elements = (Startadresse + (n − 1) · Elementgröße) ÷ Seitengröße. Anzahl Seiten = letzte − erste + 1 = Misses; alle anderen Zugriffe sind Hits.',
      'Ein TLB-Miss entsteht nur beim ersten Zugriff auf eine neue Seite. Bestimme also die erste und die letzte berührte Seite und zähle die Seiten dazwischen mit – das ist die Zahl der Misses.',
      'Wie viele Elemente auf eine Seite passen, ist einfach Seitengröße ÷ Elementgröße. Bei dichtem Zugriff gibt es pro Seite genau einen Miss – je mehr Elemente auf eine Seite passen, desto höher die Trefferquote.'
    ]
  };
  L['19-t3'] = {
    q: [
      'Früher hatten Prozessoren **komplexe Befehlssätze (CISC)**, und die Hardware-Entwickler „trauten den OS-Leuten nicht“, wie das Buch augenzwinkernd schreibt. Deshalb übernahm die Hardware die Behandlung von TLB-Misses komplett. **Intel x86** ist das Beispiel für eine solche Architektur mit hardwareverwaltetem TLB.',
      'Auf x86 zeigt das Register **CR3** (Control Register 3) auf die aktuelle Page Table bzw. das Page Directory des laufenden Prozesses. Es ist das x86-Gegenstück zum allgemeinen Page-Table Base Register. Beim Kontextwechsel lädt das OS CR3 neu.',
      'Wenn die Hardware den Miss selbst behandeln soll, muss sie die Page Table selbstständig „durchwandern“ (Page Table Walk). Dafür muss sie genau wissen, **wo** die Tabelle liegt (über ein Register) und **wie** sie aufgebaut ist (festes Format). x86 nutzt dafür eine fest vorgegebene mehrstufige Page Table.',
      '**RISC**-Architekturen (Reduced Instruction Set Computer) wie **MIPS** oder **SPARC** halten die Hardware bewusst einfach. Sie haben einen **softwareverwalteten TLB**: Die Hardware meldet einen Miss nur, und das Betriebssystem kümmert sich um den Rest. Das Buch nennt MIPS R10k und SPARC v9 als Beispiele.',
      'Bei einem Software-TLB löst die Hardware bei einem Miss eine **Ausnahme** aus: Sie unterbricht den laufenden Befehlsstrom, hebt die Privilegstufe auf **Kernel-Modus** an und springt in einen **Trap-Handler** – OS-Code, der eigens für TLB-Misses geschrieben ist. Dieser sucht die Übersetzung in der Page Table und trägt sie ein.',
      'Den TLB zu verändern ist extrem sicherheitskritisch: Könnte ein Benutzerprogramm eigene Einträge schreiben, könnte es auf beliebigen Speicher zugreifen und den Rechner übernehmen. Deshalb gibt es spezielle **privilegierte Instruktionen**, beim MIPS z. B. TLBWI und TLBWR, die nur im Kernel-Modus erlaubt sind.',
      'Nach einem TLB-Miss ist der Speicherzugriff, der den Trap ausgelöst hat, noch nicht passiert. Deshalb muss der return-from-trap **genau an dieser Instruktion** weitermachen, damit sie erneut läuft – diesmal mit TLB-Hit. Das Buch betont: Dieser return-from-trap ist anders als der bei Systemaufrufen.',
      'Nach einem Systemaufruf hat das OS die gewünschte Arbeit erledigt. Wie bei der Rückkehr aus einer Prozedur geht es mit der **nächsten Instruktion** weiter. Würde man die auslösende Instruktion wiederholen, würde der Systemaufruf ein zweites Mal ausgeführt.',
      'Der Miss-Handler ist selbst Code, der Speicher benutzt. Fehlt **dessen** Übersetzung im TLB, entsteht beim Ausführen des Handlers ein neuer Miss, der wieder den Handler aufruft – eine **unendliche Kette** von TLB-Misses. Das Buch nennt das ausdrücklich als Gefahr, auf die das OS achten muss.',
      'Das Buch nennt zwei Lösungen: Man legt den Miss-Handler in **physischen Speicher, der nicht übersetzt wird** (unmapped), sodass er gar keinen TLB-Eintrag braucht. Oder man **reserviert** einige TLB-Einträge dauerhaft für den Handler-Code – diese **wired** Übersetzungen treffen immer.',
      'Der größte Vorteil des Software-Ansatzes ist **Flexibilität**: Das OS kann jede beliebige Datenstruktur für die Page Table verwenden, ohne dass die Hardware geändert werden muss. Dazu kommt **Einfachheit**: Die Hardware muss bei einem Miss nur eine Ausnahme auslösen – in Figure 19.3 ist das eine einzige Zeile.',
      'Bei jedem Miss muss die CPU in den Kernel springen, den Handler ausführen und zurückkehren. Dieser **Trap-Overhead** kommt zum eigentlichen Page-Table-Zugriff hinzu. Ein Miss kann deshalb etwas teurer sein als beim Hardware-Walk – der Preis für die Flexibilität.',
      'Damit die Hardware die Tabelle selbst durchlaufen kann, schreibt x86 ein festes Format vor: eine **mehrstufige Page Table** (Details in Kapitel 20). Das Buch erwähnt das ausdrücklich bei der Beschreibung des hardwareverwalteten TLB von x86.',
      'Der Miss-Handler ist **Betriebssystem-Code** und muss privilegierte Instruktionen ausführen, um den TLB zu ändern. Deshalb hebt die Hardware beim Auslösen der Ausnahme die Privilegstufe auf den **Kernel-Modus** an.',
      'Nachdem der Handler die Übersetzung eingetragen hat, kehrt er mit return-from-trap zurück, und die Hardware **wiederholt die auslösende Instruktion**. Diesmal steht die Übersetzung im TLB – es gibt einen **Hit**, und der Speicherzugriff wird schnell erledigt.',
      'Beim hardwareverwalteten TLB „walkt“ die **Hardware** selbst durch die Page Table: Sie findet den richtigen PTE, holt die Übersetzung heraus, aktualisiert den TLB und wiederholt die Instruktion – ganz ohne Beteiligung des Betriebssystems.',
      'Je nach Ursache muss nach dem Trap an einer anderen Stelle weitergemacht werden: nach einem **TLB-Miss** an der **auslösenden** Instruktion, nach einem **Systemaufruf** an der **nächsten**. Deshalb muss die Hardware beim Trap je nach Grund einen anderen Program Counter sichern.',
      '**Wired** bedeutet: fest reserviert. Beim MIPS kann das OS über ein **wired-Register** festlegen, wie viele TLB-Plätze für das OS reserviert sind. Diese Einträge werden nie ersetzt und treffen deshalb immer – ideal für Code wie den Miss-Handler, bei dem ein Miss problematisch wäre.',
      'Beim Software-TLB durchsucht das **OS** die Page Table, nicht die Hardware. Die Hardware muss das Format deshalb **nicht kennen**. Genau das erlaubt dem OS, jede beliebige Datenstruktur zu nutzen – z. B. eine Hash-Tabelle oder einen Baum.',
      'Beim softwareverwalteten TLB tut die Hardware bei einem Miss nur eines: Sie löst eine **Ausnahme** aus (RaiseException(TLB_MISS)). Alles Weitere – Page Table durchsuchen, TLB aktualisieren – erledigt der Handler des Betriebssystems.'
    ],
    T: [
      'x86 ist eine CISC-Architektur mit **hardwareverwaltetem TLB**: Die Hardware durchläuft die mehrstufige Page Table selbst, CR3 zeigt auf sie.',
      'MIPS ist eine RISC-Architektur mit **softwareverwaltetem TLB**: Ein Miss löst eine Ausnahme aus, das OS füllt den TLB.',
      'Der Speicherzugriff ist noch nicht passiert, deshalb wird die **auslösende Instruktion wiederholt** – diesmal mit Hit.',
      'Wired-Einträge werden nie ersetzt und treffen immer. Liegt der Miss-Handler darin, kann er **keinen eigenen Miss** auslösen.',
      'Weil das OS die Page Table selbst durchsucht, ist es bei der Datenstruktur **völlig frei**.',
      'Auf x86 zeigt **CR3** auf die Page Table (das Page Directory) des laufenden Prozesses.'
    ],
    F: [
      'Falsch: x86 ist **hardwareverwaltet**. Softwareverwaltete TLBs haben RISC-Architekturen wie MIPS.',
      'Falsch: Weiter geht es mit der **auslösenden** Instruktion; „nächste Instruktion“ gilt nach Systemaufrufen.',
      'Falsch: Ein Miss im Handler würde eine **Endlosschleife** von Misses auslösen – das muss verhindert werden.',
      'Falsch: Gerade der Software-Ansatz erlaubt **beliebige** Formate, weil nur das OS die Tabelle kennt.',
      'Falsch: Beim Software-TLB durchsucht der **OS-Handler** die Page Table; die Hardware löst nur eine Ausnahme aus.',
      'Falsch: Der TLB darf nur mit **privilegierten** Instruktionen beschrieben werden – sonst könnte jedes Programm den Schutz aushebeln.'
    ],
    g: [
      'Die Zusatzkosten von Misses ergeben sich aus: Anzahl Misses = Zugriffe · Miss-Rate, Zusatzkosten = Misses · Kosten pro Miss. Beim softwareverwalteten TLB enthalten die Kosten pro Miss auch den Trap ins OS und den Handler. Schon wenige Prozent Misses können so einen großen Teil der Laufzeit ausmachen.'
    ]
  };
  L['19-t4'] = {
    q: [
      'Ein typischer TLB hat laut Buch **32, 64 oder 128 Einträge**. Er muss bei jedem Speicherzugriff in wenigen Takten antworten, und das geht nur mit einem kleinen Speicher. Moderne CPUs haben oft zwei Stufen: einen winzigen, sehr schnellen und einen größeren, etwas langsameren TLB – die Hausaufgabe des Buches misst genau das.',
      '**Voll assoziativ** heißt: Eine Übersetzung kann an **jeder beliebigen Stelle** im TLB stehen. Deshalb weiß die Hardware nicht vorher, wo sie suchen muss, und vergleicht die gesuchte VPN mit **allen Einträgen gleichzeitig**. Darum steht in jedem Eintrag auch die VPN selbst – nur so lässt sich ein Treffer erkennen.',
      'Ein TLB-Eintrag besteht aus **VPN, PFN und weiteren Bits**. Die VPN braucht man zum Wiederfinden (der TLB ist voll assoziativ), die PFN ist das Ergebnis der Übersetzung. Die „other bits“ sind z. B. Valid, Protection, ASID und Dirty.',
      'Das Buch widmet dem einen eigenen Kasten, weil es ein häufiger Fehler ist: In der **Page Table** heißt invalid „Seite gehört nicht zum Adressraum“ – ein Zugriff ist ein Fehler. Im **TLB** heißt invalid nur „dieser Eintrag enthält gerade keine Übersetzung“. Beim Systemstart sind alle TLB-Einträge invalid, ohne dass irgendetwas falsch wäre.',
      'Der TLB enthält Übersetzungen, die nur für den **gerade laufenden** Prozess gelten. Das Buchbeispiel: Prozess 1 bildet VPN 10 auf Frame 100 ab, Prozess 2 dieselbe VPN 10 auf Frame 170. Stehen beide Einträge im TLB, kann die Hardware **nicht unterscheiden**, welcher gemeint ist – der neue Prozess könnte die Übersetzung des alten benutzen.',
      'Ein **Flush** setzt **alle Valid-Bits auf 0** und leert damit den TLB. Bei Software-TLBs gibt es dafür eine privilegierte Instruktion; bei Hardware-TLBs kann der Flush automatisch passieren, wenn das PTBR umgestellt wird – was das OS beim Kontextwechsel ohnehin tut.',
      'Nach einem Flush ist der TLB leer. Der nächste Prozess erzeugt bei jedem ersten Zugriff auf eine seiner Seiten einen **Miss**. Wechselt das OS häufig zwischen Prozessen, entstehen dadurch sehr viele Misses – die Lösung ist korrekt, aber **teuer**.',
      '**ASID = Address Space Identifier**: ein zusätzliches Feld im TLB-Eintrag, das angibt, zu welchem Adressraum (Prozess) die Übersetzung gehört. Man kann sie sich wie eine PID vorstellen, nur mit weniger Bits. Mit ASIDs sind gleiche VPNs verschiedener Prozesse unterscheidbar.',
      'Das Buch nennt **8 Bit** als typische ASID-Größe, im Gegensatz zu 32 Bit für eine PID. Mit 8 Bit lassen sich 2^8 = 256 Adressräume gleichzeitig im TLB unterscheiden. Das Buch fragt dazu, was das OS tun soll, wenn mehr als 256 Prozesse laufen – es muss dann ASIDs wiederverwenden.',
      'Mit ASIDs kann der TLB Übersetzungen **mehrerer Prozesse gleichzeitig** halten, ohne dass sie verwechselt werden. Beim Kontextwechsel muss der TLB deshalb **nicht geleert** werden. Kehrt ein Prozess kurz darauf zurück, findet er seine Übersetzungen oft noch vor – weniger Misses.',
      'Damit die Hardware weiß, welche Einträge gerade gelten, muss sie die ASID des **laufenden** Prozesses kennen. Das OS setzt dafür beim Kontextwechsel ein **privilegiertes Register** auf die ASID des neuen Prozesses. Nur Einträge mit passender ASID gelten als Treffer.',
      'Ja – das Buch zeigt genau diesen Fall: Prozess 1 bildet VPN 10 und Prozess 2 VPN 50 auf **denselben Frame 101** ab. Das passiert, wenn sich Prozesse eine Seite **teilen**, etwa eine Code-Seite eines Programms oder einer Bibliothek. Das spart physischen Speicher.',
      'Bei 65 Seiten im Kreis und 64 Einträgen ist die **am längsten nicht benutzte** Seite immer genau die, die **als Nächstes** gebraucht wird. LRU verdrängt sie also jedes Mal – und **jeder Zugriff wird ein Miss**. Das Buch nennt das als Grenzfall, in dem eine „vernünftige“ Strategie sehr unvernünftig wird; zufällige Ersetzung schneidet hier viel besser ab.',
      'LRU versagt, wenn ein Programm zyklisch über **n + 1 Seiten** läuft, der TLB aber nur **n** Einträge hat. Dann wirft LRU systematisch genau die Seite hinaus, die als Nächstes benötigt wird. Deshalb nennt das Buch die **zufällige Ersetzung** als einfache Alternative, die solche Grenzfälle vermeidet.',
      'Der MIPS R4000 hat einen 32-Bit-Adressraum mit 4-KB-Seiten, man würde also 20 VPN-Bits erwarten. Benutzeradressen stammen aber nur aus **der Hälfte** des Adressraums – die andere Hälfte gehört dem Kernel. Deshalb reichen **19 Bit** für die VPN.',
      'Die PFN des MIPS R4000 hat **24 Bit**. Damit lassen sich 2^24 Frames à 4 KB adressieren: 2^24 · 2^12 = 2^36 Bytes = **64 GB** physischer Speicher – deutlich mehr, als ein 32-Bit-Adressraum eines einzelnen Prozesses fassen kann.',
      'Das **G-Bit (Global)** markiert Seiten, die von **allen Prozessen** gemeinsam genutzt werden. Ist es gesetzt, wird die **ASID ignoriert** – der Eintrag gilt für jeden Prozess. Das ist nützlich für Kernel-Seiten, die in jedem Adressraum gleich abgebildet sind.',
      'Die **TLB-Abdeckung** (coverage) ist die Menge an Speicher, die über die Einträge des TLB ohne Miss erreichbar ist: **Einträge · Seitengröße**. Greift ein Programm in kurzer Zeit auf mehr Seiten zu, „überschreitet es die TLB-Abdeckung“ und erzeugt viele Misses. Größere Seiten erhöhen die Abdeckung.',
      'Beim MIPS kann das OS über ein **wired-Register** festlegen, wie viele TLB-Plätze für das OS reserviert sind. Diese Einträge werden nie ersetzt. Das OS nutzt sie für Code und Daten, auf die es in kritischen Momenten zugreifen muss, in denen ein TLB-Miss problematisch wäre – etwa im Miss-Handler selbst.',
      'In einem voll assoziativen TLB kann eine Übersetzung überall stehen. Würde die Hardware die Einträge **nacheinander** prüfen, wäre die Suche viel zu langsam. Deshalb vergleicht sie die VPN mit **allen Einträgen parallel** – so dauert ein Lookup trotzdem nur einen Bruchteil eines Speicherzugriffs.'
    ],
    T: [
      'Mit ASIDs gehört jeder Eintrag zu einem bestimmten Prozess; Einträge verschiedener Prozesse können bleiben → **kein Flush** nötig.',
      'Ein typischer TLB ist **voll assoziativ**: Jede Übersetzung darf überall stehen, alle Einträge werden parallel durchsucht.',
      'Zufällige Ersetzung ist einfach und vermeidet Fälle wie **n + 1 Seiten bei n Einträgen**, in denen LRU immer danebenliegt.',
      'Weil Benutzeradressen nur aus der Hälfte des 32-Bit-Raums kommen, braucht der MIPS R4000 nur **19 VPN-Bits**.',
      'Ein Flush setzt **alle Valid-Bits auf 0** und leert damit den TLB.',
      'Geteilte Seiten (z. B. Code) können bei zwei Prozessen unter **verschiedenen VPNs auf denselben Frame** zeigen.'
    ],
    F: [
      'Falsch: Ein TLB muss extrem schnell sein und hat deshalb nur **32 bis 128** Einträge.',
      'Falsch: ASIDs sind **kürzer** als PIDs, typisch 8 statt 32 Bit.',
      'Falsch: LRU versagt z. B. bei **n + 1 Seiten** in einer Schleife – dann ist jeder Zugriff ein Miss.',
      'Falsch: Im TLB bedeutet valid nur, dass der **Eintrag belegt** ist; in der Page Table heißt valid „gehört zum Adressraum“.',
      'Falsch: Nach einem Flush ist der TLB leer, und der neue Prozess erzeugt zunächst **viele Misses**.',
      'Falsch: Weil die Hälfte des Adressraums dem Kernel gehört, sind es **19** VPN-Bits.'
    ],
    g: [
      'Die **TLB-Abdeckung** ist der Speicher, den der TLB ohne Miss überblicken kann: **Einträge · Seitengröße**. Arbeitet ein Programm auf mehr Speicher, häufen sich Misses. Große Seiten (z. B. 2 MB) vervielfachen die Abdeckung – deshalb nutzen Datenbanken sie für große, zufällig benutzte Strukturen.',
      'Mit b Bits lassen sich **2^b** verschiedene Werte darstellen – also 2^b verschiedene ASIDs. Bei 8 Bit sind das 256 Adressräume. Laufen mehr Prozesse, muss das OS ASIDs wiederverwenden und dabei die alten Einträge ungültig machen.',
      'Rechne Einträge · Seitengröße und achte auf die Einheit. Je mehr Einträge oder je größer die Seiten, desto mehr Speicher ist ohne Miss erreichbar.',
      'n Bits ergeben 2^n verschiedene Kennungen. Die ASID-Breite bestimmt also direkt, wie viele Prozesse gleichzeitig Einträge im TLB haben können.'
    ]
  };
})();
