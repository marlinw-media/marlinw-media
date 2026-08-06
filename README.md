# MarlinW Media — Website

Statische Website (reines HTML/CSS/JS, kein Build-Schritt nötig) für MarlinW Media —
Videoproduktion, Fotografie, Grafikdesign & Webdesign.

## Struktur

```
index.html         Startseite (Hero, Leistungen, Portfolio-Teaser, Preis-Konfigurator, Bewertungen, Kontakt)
portfolio.html      Vollständige, filterbare Portfolio-Galerie
impressum.html      Impressum
datenschutz.html    Datenschutzerklärung
css/style.css        Gesamtes Styling inkl. Dark-/Lightmode
js/main.js            Theme-Toggle, mobiles Menü, Portfolio-Filter, Preis-Konfigurator, Kontaktformular
assets/               Logo (logo-black.png / logo-white.png) & Favicon (SVG)
images/portfolio/      Echte Projektfotos (Video, Fotografie, Automotive, Events)
images/partners/       Partner-Logos (CU Visuals, Closed Circle Studios, MatoDigital)
images/profil.jpg      Profilbild für den Kontaktbereich
```

## Auf GitHub veröffentlichen (GitHub Pages)

1. Repository auf GitHub anlegen (z. B. `marlinw-media-website`).
2. Diesen Ordner hochladen / pushen:
   ```bash
   git init
   git add .
   git commit -m "Website MarlinW Media"
   git branch -M main
   git remote add origin https://github.com/<dein-user>/<repo-name>.git
   git push -u origin main
   ```
3. Im Repo unter **Settings → Pages** als Quelle den `main`-Branch (Ordner `/root`) auswählen.
4. Die Seite ist danach unter `https://<dein-user>.github.io/<repo-name>/` erreichbar. Für eine eigene Domain (z. B. `marlinw-media.de`) unter **Settings → Pages → Custom domain** eintragen und beim Domain-Anbieter die entsprechenden DNS-Einträge (CNAME/A-Records) setzen.

## Kontaktformular aktivieren (wichtig!)

Das Formular sendet Anfragen ganz ohne eigenen Server über den kostenlosen Dienst
[FormSubmit](https://formsubmit.co) direkt an **marlinw.media@gmail.com**.

➡️ **Nach dem ersten echten Absenden** des Formulars auf der live gehosteten Seite
schickt FormSubmit eine Bestätigungs-Mail an marlinw.media@gmail.com — der Link darin muss
einmalig angeklickt werden, danach werden alle weiteren Anfragen automatisch zugestellt.
Das Formular funktioniert **nur über eine echte URL** (nicht beim lokalen Öffnen der Datei per Doppelklick).

## Was noch ersetzt werden sollte

- **Portfolio-Bilder**: Video, Fotografie, Automotive und Events zeigen bereits echte Projektfotos
  (`images/portfolio/`). Branding, Hochzeiten, Grafikdesign und Webdesign sind noch bewusst als
  Platzhalter (Farbverlauf + Icon + Badge „Platzhalter“) markiert — bereit, um durch echte
  Beispiele ersetzt zu werden (`portfolio.html`).
- **Bewertungen**: Die drei Testimonials sind Beispieltexte und sollten durch echte
  Kundenstimmen ersetzt werden, sobald diese vorliegen.
- **Preise**: Alle Preise im Konfigurator wurden aus der bisherigen Preisliste übernommen —
  bei Änderungen einfach direkt in `index.html` im Abschnitt `#konfigurator` anpassen.

## Dark-/Lightmode

Der Modus wird automatisch anhand der Systemeinstellung vorausgewählt und lässt sich über
den Schalter oben rechts umschalten; die Wahl wird im Browser gespeichert (Local Storage).

