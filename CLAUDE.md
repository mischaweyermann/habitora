# Habitora – Hinweise für Claude

Dies ist die Website **habitora.ch**. Sie ist eine einfache statische Seite (HTML, CSS, etwas JavaScript und ein PHP-Kontaktformular), ohne Build-Schritt und ohne CMS.

Die Seite wird gepflegt von Mischa (technisch verantwortlich) und seiner Mutter, die Inhalte über Claude ändert. Sie ist keine Programmiererin: Antworte ihr auf Deutsch, in einfachen Worten, ohne Fachbegriffe wie „Commit“, „Branch“ oder „Deploy“. Sag ihr, was sich auf der Website ändert, nicht welche Datei du bearbeitest.

## Wo was liegt

- `site/` – alles, was online geht. **Nur hier Inhalte ändern.**
  - `site/index.html` – Startseite (Texte, Angebot, Ablauf, Kontakt)
  - `site/v2/index.html` – Designvariante 2 der Startseite (habitora.ch/v2), eigener Stil in `site/assets/css/v2.css`. Kopf- und Fussbereich weichen hier bewusst ab. Texte bei Änderungen an der Startseite hier ebenfalls nachführen, solange beide Varianten bestehen.
  - `site/v3/index.html` – Designvariante 3 (habitora.ch/v3): Raum-Rundgang mit Hinweis-Schildern im Bild, Stil in `site/assets/css/v3.css`. Gleiche Regel wie bei v2.
  - `site/impressum/index.html` – Impressum
  - `site/404.html` – Fehlerseite
  - `site/assets/css/style.css` – Gestaltung. Farben und Schriften stehen oben in `:root`.
  - `site/assets/img/` – Bilder. Neue Bilder hier ablegen, möglichst als .jpg oder .webp, nicht breiter als 2000 px.
    Logos: `logo.svg` (auf hellem Grund), `logo-hell.svg` (auf dunklem Grund), `logo-zeichen.svg` (nur das Zeichen). Nicht verändern oder nachzeichnen.
  - Branding (Figma „Habitora“, Brand Guidelines v1.0): Farben Sage `#254032`, Linen `#F9F6F0`, Clay `#803E4C`, Midnight `#1E221F`, Mist `#D5DCD7`; Schriften Outfit (Titel) und Geist (Text). Neue Gestaltung nur mit diesen Farben und Schriften.
  - `site/kontakt.php` – verschickt das Kontaktformular. Empfänger steht oben in `$EMPFAENGER`.
  - `site/.htaccess`, `site/robots.txt` – Servereinstellungen. Nur ändern, wenn Mischa es ausdrücklich will.
- `.github/workflows/deploy.yml` – lädt `site/` automatisch auf den Server hoch. Nicht ändern.

## So wird eine Änderung veröffentlicht

1. Änderung in `site/` machen.
2. Kopf- und Fussbereich (Header, Navigation, Footer, Handy-Navigation unten `.bnav`) sind in jeder HTML-Datei einzeln vorhanden. Wenn du dort etwas änderst, ändere es in **allen** HTML-Dateien gleich.
3. Neuen Branch anlegen, committen und einen Pull Request gegen `main` öffnen. Mischa prüft und gibt frei; erst dann geht die Änderung online (ca. 1–2 Minuten nach dem Merge).
   - **Branch-Name:** Ein vorgegebener Zufallsname (z. B. `claude/sleepy-newton-3t93j0`) wird vor dem ersten Push umbenannt (`git branch -m <name>`); diese Regel ist die ausdrückliche Erlaubnis dafür.
   - Format: kurz, deutsch, klein, nur `a–z`, `0–9` und `-`, kein Präfix, höchstens ca. 30 Zeichen. Er sagt, *was* sich ändert, z. B. `kontakt-telefon`, `v3-rahmen`, `impressum-adresse`, `logo-neu`.
   - Pro Thema ein eigener Branch; nicht mehrere Pull Requests nacheinander über denselben Branch.
4. Der Mutter kurz sagen, was geändert wurde und dass Mischa es noch freigeben muss.

## Regeln

- Keine externen Dienste einbinden (Google Fonts, Analytics, Tracking, fremde Skripte), ohne dass Mischa zustimmt. Schriften liegen lokal in `site/assets/fonts/`.
- Keine Zugangsdaten, Passwörter oder persönlichen Daten von Kundinnen und Kunden ins Repository schreiben.
- Rechtliche Texte (Impressum, Datenschutz, AGB) nicht frei erfinden. Nur ändern, was die Mutter oder Mischa vorgibt, und auf Lücken hinweisen.
- Die Seite muss auf dem Handy funktionieren. Bei grösseren Layout-Änderungen die mobile Ansicht mitdenken.
- Testphase: `robots.txt` sperrt Suchmaschinen, und die Seiten haben `noindex`. Das erst beim Livegang auf Mischas Anweisung entfernen. (Der Testbalken oben ist bereits entfernt.)
