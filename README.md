# MarlinW Media — Website

Statische Website (HTML/CSS/JS) für marlinw-media.de, gehostet über GitHub Pages.

Die Seiten werden **nicht hier bearbeitet**, sondern im Arbeitsordner
`Claude Website/neu-konzept/` aus `_src/pages/*.html` gebaut (`python3 _src/build.py`)
und mit `deploy.sh` hierher kopiert.

```
index.html, hochzeiten.html, events.html, brand-videos.html,
leistungen.html, portfolio.html, termin.html, impressum.html, datenschutz.html
css/style.css        Styling
js/main.js           Animationen, Video-Steuerung, Formular
js/vendor/           GSAP, ScrollTrigger, Lenis (lokal, keine CDNs)
material-web/        Videos & Bilder (nur referenzierte Dateien)
assets/              Favicon & Schriften (werden auch von intern/ genutzt)
intern/              privater Bereich — unabhängig von der Website
```

Kontaktformular: FormSubmit (AJAX) an marlinw.media@gmail.com.
Keine Cookies, kein Tracking, keine externen Skripte.
