/* Kapitel 18 – „Ausführlich erklärt“: warum die richtige Antwort richtig ist (q = Fragen, T/F = Aussagen-Bank, g = Rechenaufgaben-Typen) */
(function () {
  var L = OSTEP.lang = OSTEP.lang || {};
  L['18-t1'] = {
    q: [
      'Das Buch beschreibt zwei Grundideen, um Platz zu verwalten: in **variabel große** Stücke schneiden (Segmentierung) oder in **gleich große** Stücke (Paging). Beim Paging wird der **virtuelle Adressraum** eines Prozesses in gleich große Einheiten geteilt, die **Seiten** (Pages) heißen. Die Idee stammt vom britischen **Atlas**-Rechner aus den 1960ern. Wichtig ist die Blickrichtung: Seiten gehören immer zur Sicht des Programms (virtuell), ihre physischen Gegenstücke heißen anders.',
      'Den physischen Speicher betrachtet Paging als **Array gleich großer Fächer**, die **Page Frames** (kurz Frames) heißen. Jeder Frame ist genau so groß wie eine Seite und kann **genau eine** virtuelle Seite aufnehmen. Im Buchbeispiel hat ein 128-Byte-Speicher 8 Frames à 16 Bytes; Frame 0 nutzt das Betriebssystem selbst. Merke: Seite = virtuell, Frame = physisch – die Page Table verbindet beide.',
      'Bei Segmentierung sind die Stücke unterschiedlich groß. Gibt man sie frei, bleiben Lücken unterschiedlicher Größe zurück – irgendwann ist zwar insgesamt genug frei, aber kein Loch groß genug: **externe Fragmentierung**. Paging teilt alles in **gleich große** Stücke. Jede freie Lücke ist dann genau einen Frame groß und passt für **jede** Seite. Damit kann externe Fragmentierung gar nicht entstehen – das nennt das Buch als ersten großen Vorteil von Paging.',
      'Ein Adressraum von 64 Bytes, geteilt in Stücke à 16 Bytes, ergibt 64 / 16 = **4 Seiten** (VP 0 bis VP 3). Allgemein gilt: Anzahl Seiten = Größe des virtuellen Adressraums ÷ Seitengröße. Echte Systeme sind viel größer: Ein 32-Bit-Adressraum (4 GB) mit 4-KB-Seiten hat rund eine Million Seiten. Das Buch nutzt absichtlich winzige Zahlen, damit man jede Übersetzung im Kopf nachrechnen kann.',
      'Für den physischen Speicher rechnet man genauso: 128 Bytes ÷ 16 Bytes = **8 Frames**. Frames und Seiten sind gleich groß, deshalb passt jede Seite in jeden Frame. Im Beispiel sind Frame 0 (Betriebssystem) und vier Frames für die vier Seiten des Prozesses belegt; die Frames 1, 4 und 6 bleiben frei. Mehr Frames als Seiten heißt einfach: Es ist noch Platz für andere Prozesse.',
      'Bei Paging gibt es **keine Anforderung an Zusammenhang**: Jede virtuelle Seite wird einzeln auf irgendeinen freien Frame abgebildet. Das OS führt dafür eine **Free List** freier Frames und nimmt einfach die ersten fünf. Dass die Frames verstreut liegen, spielt keine Rolle – die Page Table merkt sich für jede Seite, wo sie gelandet ist. Genau diese Einfachheit der Freispeicherverwaltung nennt das Buch als zweiten großen Vorteil.',
      'Jeder Prozess hat seinen **eigenen Adressraum** und damit seine **eigene Page Table**. Die virtuelle Adresse 0 von Prozess A wird in A’s Tabelle nachgeschlagen, die von Prozess B in B’s Tabelle – und die zeigen auf **verschiedene Frames**. So können beide Programme glauben, sie hätten den Speicher ab Adresse 0 für sich allein, ohne sich gegenseitig zu stören. Das ist der Kern der Speichervirtualisierung: Isolation durch getrennte Übersetzungen.',
      'Paging braucht keine Annahmen darüber, wie Heap und Stack wachsen – das Buch nennt diese **Flexibilität** als wichtigsten Vorteil. Wächst der Heap um drei Seiten, nimmt das OS drei beliebige freie Frames, trägt die Zuordnungen in die Page Table ein und markiert die Einträge als gültig (Valid = 1). Nichts muss verschoben oder zusammenhängend gemacht werden; das Programm merkt von alledem nichts.',
      'Paging verhindert **externe** Fragmentierung, aber nicht **interne**: Seiten haben eine feste Größe, und ein Speicherbereich ist selten ein exaktes Vielfaches davon. Der Rest der letzten Seite bleibt ungenutzt. Bei 4-KB-Seiten verschenkt man pro Bereich im Schnitt etwa eine halbe Seite. Zusätzlich kosten die Page Tables selbst Speicher – das ist das zweite große Problem, das das Buch am Ende des Kapitels nennt.',
      'Weil alle Frames gleich groß sind, passt **jeder** freie Frame für **jede** Seite. Das OS muss keine passende Lücke suchen (wie Best Fit oder First Fit in Kapitel 17), sondern nimmt einfach vier Frames aus seiner Free List – im Buch heißt es wörtlich, es „schnappt sich die ersten vier freien Seiten“. Diese Einfachheit ist ein zentraler Vorteil gegenüber Segmentierung.',
      'Die **Page Table** ist eine Datenstruktur pro Prozess, deren Hauptaufgabe es ist, **Adressübersetzungen** zu speichern: für jede virtuelle Seite, in welchem physischen Frame sie liegt (VPN → PFN). Dazu kommen Statusbits wie Valid, Present oder Dirty. Im Beispiel stehen dort genau vier Zuordnungen: VP 0 → PF 3, VP 1 → PF 7, VP 2 → PF 5, VP 3 → PF 2.',
      'Das Buch betont: Die Page Table ist eine **pro Prozess** geführte Datenstruktur. Jeder Adressraum braucht seine eigenen Übersetzungen, denn dieselbe virtuelle Seitennummer liegt bei verschiedenen Prozessen in verschiedenen Frames. Eine Ausnahme, die später kommt, ist die **invertierte Page Table** (eine für das ganze System) – sie ist aber ein Sonderfall, nicht das Grundmodell.',
      'Würden sich zwei Prozesse eine Tabelle teilen, müsste die virtuelle Seite 1 bei beiden in denselben Frame führen – sie würden sich gegenseitig die Daten überschreiben. Damit jeder Prozess seine eigene, isolierte Sicht auf den Speicher bekommt, braucht jeder seine **eigenen Zuordnungen**. Nur gewollt geteilte Seiten (z. B. gemeinsamer Programmcode) zeigen bei beiden Prozessen auf denselben Frame.',
      'Genau das ist die Stärke von Paging: Die Page Table kann **jede beliebige Zuordnung** speichern. Im Buchbeispiel liegt VP 0 in PF 3 und VP 1 in PF 7 – die Reihenfolge ist völlig unabhängig. Das OS kann also immer irgendeinen freien Frame verwenden. Eine feste Zuordnung „Seite n in Frame n“ würde den ganzen Vorteil zunichtemachen.',
      'Bei Segmentierung muss man bei der Einrichtung wissen, wie groß die Segmente werden und in welche Richtung Heap und Stack wachsen. Paging bildet jede Seite **einzeln** ab, sobald sie gebraucht wird. Das Buch nennt das als wichtigsten Vorteil: Das System unterstützt die Abstraktion des Adressraums, **egal wie** der Prozess ihn benutzt – auch einen sehr dünn besetzten Adressraum.',
      'Halbe Seiten gibt es nicht. 10 KB brauchen bei 4-KB-Seiten **drei** Seiten (die dritte nur zur Hälfte gefüllt), also 12 KB belegter Speicher. Die nicht genutzten **2 KB** in der letzten Seite sind **interne Fragmentierung**. Je größer die Seiten, desto größer dieser Verschnitt im Schnitt – ein Grund, warum Seiten nicht beliebig groß gemacht werden.',
      'Um eine virtuelle Adresse zu übersetzen, muss die Hardware wissen, in welchem Frame die Seite liegt – und das steht in der **Page Table des laufenden Prozesses**. Deshalb hat die CPU ein **Page-Table Base Register (PTBR)**, das auf den Anfang dieser Tabelle zeigt. Beim Kontextwechsel stellt das OS das PTBR auf die Tabelle des nächsten Prozesses um.',
      'Kapitel 17 zeigte, wie schwierig die Verwaltung **variabel großer** freier Bereiche ist: Splitting, Coalescing, Fit-Strategien – und trotzdem bleibt **externe Fragmentierung**. Paging umgeht das ganze Problem, indem es nur noch **gleich große** Stücke gibt. Dafür handelt man sich andere Probleme ein (große Tabellen, langsame Übersetzung), die die nächsten Kapitel lösen.',
      '**PFN = Physical Frame Number**, die Nummer des physischen Frames, in dem eine Seite liegt. Das Buch erwähnt auch den Namen **PPN** (Physical Page Number) – gemeint ist dasselbe. Bei der Übersetzung ersetzt die PFN die virtuelle Seitennummer; zusammen mit dem unveränderten Offset ergibt sich die physische Adresse.',
      '**VPN = Virtual Page Number**, die Nummer der virtuellen Seite. Sie steht in den **oberen Bits** der virtuellen Adresse und dient als **Index** in die Page Table: Eintrag Nummer VPN enthält die passende PFN. Im Beispiel hat die 6-Bit-Adresse 21 = 01 0101 die VPN 01 = 1.'
    ],
    T: [
      'Paging teilt den virtuellen Raum in Seiten und den physischen Speicher in Frames – und beide sind **gleich groß**. Nur so passt jede Seite in jeden freien Frame, was externe Fragmentierung verhindert.',
      'Weil dieselbe virtuelle Seite bei verschiedenen Prozessen in verschiedenen Frames liegt, braucht **jeder Prozess seine eigene** Page Table. Das Buch nennt sie ausdrücklich eine „per-process data structure“.',
      'Externe Fragmentierung entsteht durch unterschiedlich große Lücken. Bei Paging ist jede Lücke genau ein Frame groß und passt für jede Seite – externe Fragmentierung ist damit **ausgeschlossen**.',
      'Im Buchbeispiel lautet die Page Table: VP 0 → PF 3, VP 1 → PF 7, **VP 2 → PF 5**, VP 3 → PF 2. Die Frames 1, 4 und 6 sind frei, Frame 0 gehört dem OS.',
      'Das OS führt eine **Free List** aller freien Frames. Braucht ein Prozess Seiten, nimmt es einfach die ersten Einträge dieser Liste – eine Suche nach passenden Lücken entfällt.',
      'Seitenzahl = Adressraum ÷ Seitengröße = 64 ÷ 16 = **4**. Die vier Seiten heißen VP 0 bis VP 3; die 6-Bit-Adresse hat dafür 2 VPN-Bits.'
    ],
    F: [
      'Die Aussage ist falsch, weil Paging gerade auf **gleich großen** Stücken beruht. Variabel große Stücke sind das Prinzip der Segmentierung – mit dem Problem der externen Fragmentierung.',
      'Falsch: Es gibt **eine Page Table pro Prozess**. Eine systemweite Tabelle ist nur die Sonderform „invertierte Page Table“ aus Kapitel 20.',
      'Falsch: Paging **vermeidet** externe Fragmentierung, weil jeder freie Frame jede Seite aufnehmen kann. Es leidet nur unter interner Fragmentierung (halb volle letzte Seite).',
      'Falsch: Die Page Table erlaubt **jede beliebige Zuordnung**. Im Beispiel liegt VP 0 in PF 3 – die Nummern hängen nicht zusammen.',
      'Falsch: Im Beispiel liegt VP 1 in **PF 7**. In PF 3 liegt die Seite VP 0.',
      'Falsch: Fit-Strategien braucht man nur bei variabel großen Stücken. Bei Paging passt **jeder** freie Frame gleich gut – das OS nimmt einfach irgendeinen.'
    ],
    g: [
      'Seiten zählt man im **virtuellen** Adressraum, Frames im **physischen** Speicher – beide mit derselben Seitengröße. Deshalb: Seiten = Adressraum ÷ Seitengröße, Frames = Speichergröße ÷ Seitengröße. Die beiden Zahlen müssen nicht gleich sein: Ein Prozess kann mehr oder weniger Seiten haben, als es Frames gibt.',
      'Die Anzahl virtueller Seiten ergibt sich direkt aus der Teilung: Adressraum ÷ Seitengröße. Weil beide Größen Zweierpotenzen sind, ist das Ergebnis ebenfalls eine Zweierpotenz – und ihr Logarithmus ist genau die Zahl der VPN-Bits.'
    ]
  };
  L['18-t2'] = {
    q: [
      'Jede virtuelle Adresse muss zwei Fragen beantworten: **In welcher Seite** liegt das Byte, und **wo innerhalb** dieser Seite? Deshalb teilt Paging die Adresse in die **Virtual Page Number (VPN)** in den oberen Bits und den **Offset** in den unteren Bits. Nur die VPN wird übersetzt; der Offset bleibt, wie er ist.',
      'Mit n Bits kann man 2^n verschiedene Adressen bilden. Ein Adressraum von 64 Bytes braucht 64 verschiedene Adressen, und 2^6 = 64 – also **6 Bit**. Das Buch schreibt die Adresse als Va5 … Va0, wobei Va5 das höchstwertige Bit ist.',
      'Der Offset muss jedes Byte innerhalb einer Seite erreichen können. Eine 16-Byte-Seite hat die Positionen 0 bis 15, also 16 Möglichkeiten – dafür reichen **4 Bit** (2^4 = 16). Allgemein: Offset-Bits = log2(Seitengröße).',
      'Von den 6 Adressbits gehören 4 dem Offset; die übrigen **2 Bit** sind die VPN. 2 Bit können 4 Seiten unterscheiden – genau die vier Seiten VP 0 bis VP 3 des 64-Byte-Adressraums. Die Rechnung VPN-Bits = Adressbits − Offset-Bits gilt immer.',
      'Das Buch rechnet genau dieses Beispiel vor: 21 ist binär **010101**. Die oberen zwei Bits **01** sind die VPN, also virtuelle **Seite 1**. Die unteren vier Bits 0101 = 5 sind der Offset – das Byte liegt also an Position 5 in Seite 1 (1 · 16 + 5 = 21).',
      'Bei 21 = 01 **0101** sind die unteren 4 Bits der Offset: 0101 = **5**. Das heißt: Das gesuchte Byte ist das sechste Byte (Zählung ab 0) der Seite 1. Diese Position ändert sich bei der Übersetzung nicht.',
      'Das ist das zentrale Rechenbeispiel des Kapitels: VA 21 = VPN 1, Offset 5. Laut Page Table liegt VP 1 in **PF 7** (binär 111). Man ersetzt die VPN durch die PFN und hängt den Offset an: 111 0101 = 64 + 32 + 16 + 4 + 1 = **117**. Genau dort liegt das Byte im physischen Speicher.',
      'Der Offset gibt nur an, welches Byte **innerhalb** der Seite gemeint ist. Eine Seite wird als Ganzes in einen Frame gelegt, also steht jedes Byte im Frame an **derselben Position** wie in der Seite. Das Buch sagt: Der Offset „wird nicht übersetzt“. Übersetzt wird nur die Seitennummer.',
      'Der Frame mit Nummer PFN beginnt an der physischen Adresse **PFN · Seitengröße**. Das Byte liegt darin an Position Offset. Also: physisch = PFN · Seitengröße + Offset. In Binärschreibweise ist das dasselbe wie „PFN vor den Offset schreiben“ – (PFN << Offset-Bits) | Offset.',
      'Eine 4-KB-Seite hat 4096 Bytes, und 2^12 = 4096. Um jedes Byte einer Seite zu adressieren, braucht der Offset also **12 Bit**. Das Buch erklärt es so: 10 Bit bräuchte man für 1 KB, zwei mehr für 4 KB.',
      'Eine 32-Bit-Adresse mit 12 Offset-Bits lässt **20 Bit** für die VPN übrig. Das ist die Standardaufteilung für 32-Bit-Systeme mit 4-KB-Seiten und taucht im Buch immer wieder auf, z. B. bei der Größe linearer Page Tables.',
      '20 VPN-Bits erlauben 2^20 = 1.048.576 verschiedene Seitennummern – also rund **eine Million** virtuelle Seiten pro Prozess. Jede braucht in einer linearen Page Table einen Eintrag, deshalb wird die Tabelle so groß.',
      'Virtuelle und physische Adressen haben denselben Offset, aber die Seitennummern können unterschiedlich breit sein. Die PFN muss nur so viele Frames unterscheiden, wie es **physisch** gibt. Im Buchbeispiel ist die virtuelle Adresse 6 Bit lang (64 Bytes), die physische 7 Bit (128 Bytes): 21 → 117 = 1110101.',
      '1 GB physischer Speicher sind 2^30 Bytes, also hat eine physische Adresse **30 Bit**. Davon sind 12 Bit Offset (4-KB-Seiten). Für die Framenummer bleiben 30 − 12 = **18 Bit** – genug für 2^18 = 262.144 Frames à 4 KB, zusammen genau 1 GB.',
      'Man zerlegt 21 in Zweierpotenzen: 21 = 16 + 4 + 1. In 6 Bit (Stellenwerte 32, 16, 8, 4, 2, 1) gesetzt ergibt das **010101**. Das Buch verwendet genau diese Darstellung, um VPN (01) und Offset (0101) sichtbar zu machen.',
      'Die oberen (höchstwertigen) Bits teilen den Adressraum in große Blöcke – genau die Seiten. Die unteren Bits zählen innerhalb eines Blocks. Deshalb steht die **VPN oben** und der Offset unten; eine Seite ist dadurch automatisch ein zusammenhängender Adressbereich.',
      'Wird die Seite doppelt so groß (8 KB = 2^13), braucht der Offset **ein Bit mehr** (13 statt 12). Die Adresse bleibt aber 32 Bit lang, also bleibt für die VPN **ein Bit weniger** (19 statt 20). Es gibt nur noch halb so viele, dafür doppelt so große Seiten – die lineare Page Table schrumpft auf die Hälfte.',
      'Liegen beide Adressen auf derselben Seite, haben sie dieselbe VPN und landen daher im **selben Frame**. Ihr Unterschied steckt nur im Offset, und der bleibt bei der Übersetzung erhalten. Also liegen auch die physischen Adressen genau **100 Bytes** auseinander. Nur Adressen auf verschiedenen Seiten können physisch beliebig verstreut sein.',
      'Der Offset muss jede Position einer Seite darstellen können. Eine Seite mit s Bytes hat s Positionen; dafür braucht man log2(s) Bits. Weil Seitengrößen immer Zweierpotenzen sind, ist das immer eine ganze Zahl: 16 Bytes → 4 Bit, 4 KB → 12 Bit, 2 MB → 21 Bit.',
      'Eine virtuelle Adresse besteht nur aus VPN und Offset. Kennt man die Gesamtlänge und die Offset-Bits, ergibt sich die VPN als **Rest**: VPN-Bits = Adressbits − Offset-Bits. Daraus folgt auch die Anzahl der Seiten: 2^VPN-Bits.'
    ],
    T: [
      'Der Offset gibt die Position innerhalb der Seite an, und Seiten werden als Ganzes in Frames gelegt. Deshalb bleibt er bei der Übersetzung **unverändert** – nur die VPN wird durch die PFN ersetzt.',
      'Die VPN steht in den **oberen** Bits, weil diese den Adressraum in große, gleich große Blöcke (die Seiten) einteilen. Die unteren Bits zählen innerhalb eines Blocks.',
      'Der Offset muss jedes Byte einer Seite erreichen: Bei s Bytes pro Seite braucht man **log2(s)** Bits. Beispiel: 4096 Bytes → 12 Bit.',
      '32 Bit Adresse minus 12 Bit Offset (4 KB) ergibt **20 Bit VPN** – rund eine Million Seiten pro Adressraum.',
      'VA 21 = 01 0101 → VPN 1, Offset 5 → VP 1 liegt in PF 7 → 7 · 16 + 5 = **117**. Das ist das zentrale Übersetzungsbeispiel des Buches.',
      'Der Frame PFN beginnt bei PFN · Seitengröße; das Byte liegt darin an Position Offset. Daher **physisch = PFN · Seitengröße + Offset**.'
    ],
    F: [
      'Falsch: Ersetzt wird die **VPN** durch die PFN. Der Offset bleibt gleich, weil das Byte im Frame an derselben Stelle liegt wie in der Seite.',
      'Falsch: Die VPN steht in den **oberen** Bits. In den unteren Bits steht der Offset.',
      'Falsch: Bei 32 Bit und 4-KB-Seiten sind **12 Bit Offset** und **20 Bit VPN** – die Aussage verwechselt beides.',
      'Falsch: Ohne Übersetzung bliebe 21 – mit Paging liegt das Byte bei **117**, weil VP 1 in Frame 7 liegt.',
      'Falsch: Die PFN ist so breit, wie der **physische** Speicher es verlangt. Im Beispiel: 6 Bit virtuell, 7 Bit physisch.',
      'Falsch: 21 = 01 0101 → VPN **1**, Offset 5. Die 5 ist der Offset, nicht die Seitennummer.'
    ],
    g: [
      'Jede Adressübersetzung folgt denselben drei Schritten: **zerlegen** (VPN = obere Bits, Offset = untere Bits), **nachschlagen** (VPN → PFN in der Page Table) und **zusammensetzen** (PFN · Seitengröße + Offset). Typische Fehler sind, die virtuelle Adresse unverändert zu lassen, mit der VPN statt der PFN zu rechnen oder den Offset zu vergessen.',
      'Die Aufteilung einer Adresse hängt nur von der Seitengröße ab: Offset-Bits = log2(Seitengröße), der Rest gehört der VPN. Größere Seiten bedeuten mehr Offset-Bits und weniger VPN-Bits – also weniger, aber größere Seiten.',
      'Bei der physischen Adresse bleibt der Offset erhalten; nur die Seitennummer wird durch die Framenummer ersetzt. Rechne deshalb immer zuerst VPN und Offset aus, schlage dann die PFN nach und setze am Ende PFN · Seitengröße + Offset zusammen.',
      'Die VPN ist alles, was nicht Offset ist. Mit log2 der Seitengröße erhält man die Offset-Bits; zieht man sie von der Adresslänge ab, bleibt die VPN-Breite – und 2^VPN-Bits ist die Anzahl der virtuellen Seiten.'
    ]
  };
  L['18-t3'] = {
    q: [
      'Das Buch rechnet genau dieses Beispiel vor: 32-Bit-Adressen mit 4-KB-Seiten haben eine 20-Bit-VPN, also 2^20 ≈ 1 Million Übersetzungen pro Prozess. Bei 4 Bytes pro Eintrag sind das **4 MB** – für **jeden** Prozess. Das ist der Grund, warum lineare Page Tables als zu groß gelten und Kapitel 20 kleinere Strukturen einführt.',
      'Wenn jeder Prozess eine 4-MB-Page-Table braucht, kosten 100 Prozesse **400 MB** nur für Übersetzungen. Das Buch kommentiert: Selbst bei Gigabytes an Speicher ist es „ein bisschen verrückt“, so viel davon für Übersetzungen zu verbrauchen – von 64-Bit-Adressräumen ganz zu schweigen.',
      'Weil Page Tables so groß werden, baut man **keine spezielle Hardware** in die MMU, die die ganze Tabelle hält. Stattdessen liegen sie **im Speicher**, verwaltet vom Betriebssystem. Das Buch erwähnt, dass sie später sogar im virtuellen Speicher des OS liegen und auf die Platte ausgelagert werden können.',
      'Ein **PTE (Page Table Entry)** ist ein einzelner Eintrag der Page Table. Er enthält die **PFN** des Frames, in dem die Seite liegt, sowie mehrere Statusbits (Valid, Protection, Present, Dirty, Reference). Auf x86 ist ein PTE 32 Bit groß.',
      'Die einfachste Organisation ist die **lineare Page Table**: ein schlichtes **Array**. Das OS nimmt die VPN als **Index** und findet an dieser Stelle den PTE mit der PFN. Der Zugriff ist schnell (eine Rechnung, ein Speicherzugriff), aber das Array muss für **jede mögliche** Seite einen Eintrag haben.',
      'Das **Valid-Bit** zeigt, ob eine Übersetzung gültig ist, also ob die Seite überhaupt zum Adressraum gehört. Code und Heap liegen an einem Ende, der Stack am anderen; der ungenutzte Raum dazwischen ist **invalid**. Ein Zugriff darauf löst einen Trap aus, und das OS beendet den Prozess meist.',
      'Ein Adressraum ist meist **dünn besetzt** (engl. sparse): Zwischen Heap und Stack liegt ein riesiger ungenutzter Bereich. Markiert man diese Seiten als invalid, muss für sie **kein physischer Frame** reserviert werden. Das Buch nennt das Valid-Bit deshalb „entscheidend“ für dünn besetzte Adressräume – es spart sehr viel Speicher.',
      'Die **Protection-Bits** legen fest, ob eine Seite **gelesen, beschrieben oder ausgeführt** werden darf. Code-Seiten sind z. B. lesbar und ausführbar, aber nicht beschreibbar. Ein Zugriff, den diese Bits verbieten, erzeugt einen Trap ans Betriebssystem (Protection Fault).',
      'Das **Present-Bit** zeigt, ob die Seite gerade im **Hauptspeicher** liegt oder auf die **Platte ausgelagert** ist (Swapping). So kann das OS seltener benutzte Seiten auslagern und Platz für andere schaffen. Ein Zugriff auf eine nicht vorhandene Seite führt zu einem Page Fault (Kapitel 21).',
      'Das **Dirty-Bit** wird gesetzt, sobald eine Seite seit dem Laden **verändert** (beschrieben) wurde. Das ist wichtig beim Auslagern: Eine unveränderte Seite kann man einfach verwerfen, weil die Kopie auf der Platte noch stimmt; eine dirty Seite muss erst **zurückgeschrieben** werden.',
      'Das **Reference-Bit** (Accessed-Bit) zeigt, ob eine Seite kürzlich **benutzt** wurde. Daraus erkennt das OS, welche Seiten „beliebt“ sind und im Speicher bleiben sollten. Das Buch nennt dieses Wissen „kritisch“ für die **Seitenersetzung**, die später ausführlich behandelt wird.',
      'Das **U/S-Bit** (User/Supervisor) auf x86 entscheidet, ob Prozesse im **User-Modus** auf die Seite zugreifen dürfen. Ist es nicht gesetzt, darf nur der Kernel (Supervisor-Modus) zugreifen. So schützt das OS seinen eigenen Speicher vor Benutzerprogrammen.',
      'Das **R/W-Bit** (Read/Write) auf x86 bestimmt, ob auf die Seite **geschrieben** werden darf. Ist es nicht gesetzt, ist die Seite nur lesbar – ein Schreibversuch führt zu einem Trap. Damit lässt sich z. B. Programmcode schreibgeschützt halten.',
      'Das Buch erklärt das in einem eigenen Kasten: x86 hat **kein separates Valid-Bit**, nur das **Present-Bit P**. P = 1 heißt: vorhanden und gültig. P = 0 heißt: entweder ausgelagert (aber gültig) oder ungültig. Bei einem Zugriff mit P = 0 gibt es einen Trap, und das **OS** prüft mit eigenen Strukturen, welcher Fall vorliegt.',
      'Die Bits **PWT, PCD, PAT und G** bestimmen laut Buch, wie **Hardware-Caching** für diese Seite funktioniert (z. B. Write-Through, Cache abschalten). Für das Verständnis von Paging muss man sie nicht im Detail kennen – wichtig ist nur, dass ein PTE neben der PFN viele solcher Steuerbits enthält.',
      'Eine lineare Page Table hat für **jede mögliche** virtuelle Seite einen Eintrag – auch für die riesigen ungenutzten Bereiche zwischen Heap und Stack. Sie verbraucht also Speicher proportional zur **Größe des Adressraums**, nicht zur tatsächlich genutzten Menge. Das ist das Platzproblem, das Kapitel 20 mit mehrstufigen Tabellen löst.',
      'Ist das Valid-Bit 0, gehört die Adresse nicht zum Prozess. Die Hardware löst einen **Trap** aus (laut Pseudocode RaiseException(SEGMENTATION_FAULT)). Das OS behandelt das in der Regel, indem es den Prozess **beendet** – ein Programm, das auf ungültigen Speicher zugreift, ist fehlerhaft.',
      'Eine lineare Page Table braucht für **jede** mögliche VPN einen Eintrag. Mit 20 VPN-Bits gibt es 2^20 Seitennummern, also **2^20** Einträge (≈ 1 Million). Multipliziert mit der PTE-Größe ergibt sich die Tabellengröße.',
      'Die Hardware setzt beim **Zugriff** auf eine Seite das **A-Bit** (Accessed) und beim **Schreiben** das **D-Bit** (Dirty) automatisch. So muss das OS nicht jeden Zugriff mitverfolgen, sondern kann die Bits später auswerten – etwa bei der Seitenersetzung oder beim Auslagern.',
      'In einem x86-PTE belegt die **PFN** die oberen 20 Bit (Bits 31 bis 12); die unteren 12 Bit enthalten die Steuerbits wie P, R/W, U/S, A und D. Das passt genau: Bei 4-KB-Seiten braucht der Offset 12 Bit, und die Framenummer füllt den Rest.'
    ],
    T: [
      'Die lineare Page Table ist ein **Array**; die VPN dient als Index. Eintrag Nummer VPN enthält die PFN – das ist die einfachste denkbare Struktur.',
      'Page Tables sind für Spezialhardware zu groß und liegen deshalb **im Speicher** (des OS). Die Hardware findet sie über das PTBR.',
      'Das Dirty-Bit wird gesetzt, wenn eine Seite **verändert** wurde. Beim Auslagern muss sie dann zurückgeschrieben werden.',
      'Das Present-Bit zeigt, ob die Seite im **Hauptspeicher** oder auf der Platte liegt – die Grundlage für Swapping.',
      '2^20 Einträge (32 − 12 VPN-Bits) · 4 Bytes = **4 MB** pro Prozess – die Rechnung aus dem Buch.',
      'Das U/S-Bit (User/Supervisor) entscheidet, ob Code im **User-Modus** auf die Seite zugreifen darf.'
    ],
    F: [
      'Falsch: Page Tables sind viel zu groß für die MMU. Sie liegen **im Speicher**; die MMU cacht nur einzelne Übersetzungen im TLB.',
      'Falsch: „Benutzt“ zeigt das **Reference-Bit**. Das Dirty-Bit bedeutet **verändert**.',
      'Falsch: Die lineare Page Table ist ein **Array**. Baumartige Strukturen sind die mehrstufigen Tabellen aus Kapitel 20.',
      'Falsch: x86 hat nur das **Present-Bit**, das die Rolle des Valid-Bits mit übernimmt.',
      'Falsch: 2^20 Einträge · 4 Bytes sind **4 MB**, nicht 4 KB.',
      'Falsch: Ungültige Seiten brauchen gerade **keinen** Frame – genau dadurch spart das Valid-Bit Speicher.'
    ],
    g: [
      'Die Größe einer linearen Page Table ergibt sich aus drei Schritten: VPN-Bits = Adressbits − log2(Seitengröße); Anzahl Einträge = 2^VPN-Bits; Größe = Einträge · PTE-Größe. Größere Seiten verkleinern die Tabelle, ein größerer Adressraum vergrößert sie exponentiell.',
      'Bei der Angabe in KB teilt man die Byte-Zahl durch 1024. Achte darauf, die PTE-Größe nicht zu vergessen – ohne sie hätte man nur die Anzahl der Einträge, nicht ihren Speicherbedarf.'
    ]
  };
  L['18-t4'] = {
    q: [
      'Damit die Hardware die Page Table des laufenden Prozesses findet, braucht sie deren Startadresse – und zwar ohne vorher selbst den Speicher fragen zu müssen. Dafür gibt es das **Page-Table Base Register (PTBR)**, das die **physische** Adresse des Tabellenanfangs enthält. Beim Kontextwechsel lädt das OS das PTBR des neuen Prozesses.',
      'Die lineare Page Table ist ein Array aus gleich großen Einträgen. Eintrag Nummer VPN liegt deshalb VPN · Eintragsgröße Bytes hinter dem Anfang: **PTEAddr = PTBR + VPN · sizeof(PTE)**. Das steht genau so im Pseudocode des Buches (Figure 18.6).',
      'Im Buch: VPN = (VirtualAddress & VPN_MASK) >> SHIFT. Die **Maske** löscht alle Offset-Bits und lässt nur die VPN-Bits stehen; das **Schieben** um SHIFT (= Anzahl Offset-Bits) bringt sie an die unterste Stelle, sodass eine normale Zahl entsteht. Beispiel: 21 & 0x30 = 16, 16 >> 4 = 1.',
      'Nach dem Nachschlagen setzt die Hardware die physische Adresse zusammen: PhysAddr = **(PFN << SHIFT) | offset**. Das Schieben setzt die PFN an die Stelle der VPN, das bitweise ODER fügt den unveränderten Offset in die unteren Bits ein – genau das „VPN durch PFN ersetzen“.',
      'SHIFT ist die Zahl der Offset-Bits und damit log2(Seitengröße). 16 KB = 16384 = 2^14, also **SHIFT = 14**. Schiebt man eine Adresse um 14 Bit nach rechts, bleibt genau die Seitennummer übrig.',
      'Bei 32-Byte-Seiten hat der Offset log2(32) = 5 Bit. Von 8 Adressbits bleiben 3 für die VPN – die oberen drei. Die Maske, die genau diese Bits stehen lässt, ist **1110 0000 = 0xE0**. Die OFFSET_MASK wäre das Gegenstück 0001 1111 = 0x1F.',
      'Weil Seitengrößen **Zweierpotenzen** sind, ist „Adresse ÷ Seitengröße“ dasselbe wie „um SHIFT nach rechts schieben“, und „Adresse mod Seitengröße“ dasselbe wie „mit der OFFSET_MASK verunden“. Bitoperationen sind in Hardware trivial und extrem schnell – wichtig, denn sie passieren bei **jedem** Speicherzugriff.',
      'Im Pseudocode des Buches folgt auf das Lesen des PTE die Prüfung: if (PTE.Valid == False) → **RaiseException(SEGMENTATION_FAULT)**. Eine ungültige Seite gehört nicht zum Adressraum; der Zugriff ist ein Programmfehler, und das OS beendet den Prozess meist.',
      'Ist die Seite gültig, prüft die Hardware als Nächstes CanAccess(PTE.ProtectBits). Verbieten die Schutzbits den Zugriff (z. B. Schreiben auf eine read-only Seite), wird ein **PROTECTION_FAULT** ausgelöst. Der Unterschied zum Segfault: Die Seite existiert, nur die Art des Zugriffs ist verboten.',
      'Vor **jedem** Speicherzugriff – Instruktion holen, Laden, Speichern – muss erst der PTE aus dem Speicher geholt werden. Das verdoppelt die Zahl der Speicherzugriffe. Das Buch schätzt, dass Paging einen Prozess dadurch um den **Faktor zwei oder mehr** verlangsamt.',
      'Der Zusatzaufwand entsteht **pro Speicherzugriff**: Jeder Zugriff braucht vorher einen PTE-Zugriff. Programme, die ständig auf den Speicher zugreifen (große Arrays, Datenbanken), werden deshalb fast doppelt so langsam. Wer dagegen hauptsächlich in Registern rechnet, merkt wenig davon.',
      'Die Hardware braucht die Startadresse der Page Table bei **jeder** Übersetzung. Stünde sie im Speicher, müsste man erst eine Speicherstelle lesen, um die Tabelle zu finden – noch mehr Zugriffe. Ein **Register** ist sofort verfügbar, und beim Kontextwechsel muss das OS nur dieses eine Register umstellen.',
      'Jeder Prozess hat seine eigene Page Table. Damit die Hardware nach dem Wechsel die Übersetzungen von B verwendet, setzt das OS das **PTBR** auf die Tabelle von B. Die Frames von A bleiben einfach im Speicher liegen – A läuft später mit seiner eigenen Tabelle weiter.',
      'Ohne TLB braucht ein Load zwei Speicherzugriffe: zuerst den PTE (um die PFN zu erfahren), dann die eigentlichen Daten. 2 · 100 ns = **200 ns**, also doppelt so lange wie ohne Paging. Genau dieser Faktor zwei ist das Geschwindigkeitsproblem von Kapitel 18.',
      'In der Schleife aus dem Buch schreibt `movl $0x0,(%edi,%eax,4)` den Wert 0 an die Adresse edi + eax · 4: edi enthält die Startadresse des Arrays, eax den Index i, und 4 ist die Größe eines Integers. Das ist array[i] = 0. Die anderen drei Instruktionen erhöhen i, vergleichen mit 1000 und springen zurück.',
      'Das Buch fasst am Ende zusammen: Ohne sorgfältiges Design ist Paging **zu langsam** (ein zusätzlicher Speicherzugriff pro Referenz) und verbraucht **zu viel Speicher** (große lineare Page Tables). Kapitel 19 (TLB) löst das erste, Kapitel 20 (kleinere Tabellen) das zweite Problem.',
      'Der zusätzliche Page-Table-Zugriff lässt sich vermeiden, wenn man häufig benutzte Übersetzungen **zwischenspeichert**. Dieser Hardware-Cache in der MMU heißt **TLB** (Translation Lookaside Buffer) und ist Thema von Kapitel 19. Bei einem TLB-Treffer fällt der Page-Table-Zugriff komplett weg.',
      'Im Speicher-Trace des Buches macht jeder Schleifendurchlauf 5 eigentliche Zugriffe: 4 Instruktionen holen und 1 Store ins Array. Jeder davon braucht vorher eine Übersetzung, also **5 Page-Table-Zugriffe** – zusammen 10 Speicherzugriffe pro Durchlauf.',
      'Programmcode liegt im **virtuellen** Adressraum genauso wie Daten. Die CPU holt Instruktionen über ihren Program Counter – eine virtuelle Adresse. Das Buch betont: Für **jede** Speicherreferenz, ob Instruktions-Fetch oder expliziter Load/Store, ist ein zusätzlicher Page-Table-Zugriff nötig.',
      'Genau das Rechenbeispiel aus dem Buch: VPN_MASK = 0x30 (110000) wählt die oberen 2 Bits, SHIFT = 4. 21 = 010101; 21 & 110000 = 010000 = 16; 16 >> 4 = **1**. Die virtuelle Adresse 21 liegt also auf Seite 1.'
    ],
    T: [
      'Vor jedem Speicherzugriff muss der PTE gelesen werden – also **ein zusätzlicher Zugriff pro Referenz**. Daher kommt die Verlangsamung um etwa den Faktor zwei.',
      'Das **PTBR** (Page-Table Base Register) enthält die physische Startadresse der Page Table des laufenden Prozesses.',
      'Weil die lineare Page Table ein Array ist, liegt Eintrag VPN bei **PTBR + VPN · sizeof(PTE)**.',
      'Pro Durchlauf: 4 Instruktionen + 1 Store = 5 Zugriffe, jeder mit einem PTE-Zugriff davor → **10** Speicherzugriffe.',
      'Die PFN wird um SHIFT nach links geschoben und der Offset mit ODER eingesetzt: **(PFN << SHIFT) | offset**.',
      'Der **TLB** cacht Übersetzungen und spart damit die meisten Page-Table-Zugriffe – Thema von Kapitel 19.'
    ],
    F: [
      'Falsch: Paging braucht vor jedem Zugriff **einen zusätzlichen** Zugriff auf die Page Table.',
      'Falsch: Der Offset hat mit der Lage des PTE nichts zu tun. Richtig ist **PTBR + VPN · sizeof(PTE)**.',
      'Falsch: Ohne Paging sind es 5 Zugriffe; **mit** Paging kommen 5 PTE-Zugriffe dazu → 10.',
      'Falsch: SHIFT ist die Zahl der **Offset**-Bits – um so viel wird die Adresse für die VPN nach rechts geschoben.',
      'Falsch: Auch Instruktionen liegen an virtuellen Adressen und werden **genauso übersetzt**.',
      'Falsch: Ein ungültiger PTE führt zu einem **Segmentation Fault**. Der Protection Fault betrifft verbotene Zugriffsarten auf gültige Seiten.'
    ],
    g: [
      'Ohne TLB kostet **jeder** Speicherzugriff zwei Zugriffe: einen auf die Page Table und einen auf die Daten. Zähle deshalb zuerst alle eigentlichen Zugriffe pro Durchlauf (Instruktions-Fetches + Datenzugriffe), verdopple sie und multipliziere mit der Anzahl der Durchläufe.',
      'Die Page Table ist ein Array; das PTBR zeigt auf Eintrag 0. Eintrag Nummer VPN liegt daher VPN · sizeof(PTE) Bytes dahinter. Häufige Fehler sind, die PTE-Größe zu vergessen oder bei 1 statt 0 zu zählen.',
      'Die Gesamtzahl der Speicherzugriffe ohne TLB ist immer doppelt so groß wie ohne Paging. Diese Verdopplung ist genau das Problem, das der TLB in Kapitel 19 löst.'
    ]
  };
})();
