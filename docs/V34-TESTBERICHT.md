# V34 – Abnahme und Regression

Geprüft am 6. November 2026 mit Playwright/Chromium und Node 24. Alle Browserdaten stammen aus getrennten, temporären Testprofilen. Die öffentliche Demo verwendet ausschließlich fiktive Ausgangsdaten. Der private Hauptbranch wird durch diese Prüfungen nicht verändert.

## Ergebnis

114 Browserprüfungen erfolgreich, einschließlich aller acht neuen V34-Abnahmen. Zusätzlich vier Auslieferungsprüfungen, zehn Modell-/Navigationstests und 69 Serverprüfungen erfolgreich. Keine Fehler.

Rohprotokolle: [Browser](tests/v34-browser.log), [Auslieferung](tests/v34-packaging.log), [Server](tests/v34-core-server.log), [Modell-/Serverübersicht](tests/v34-model-server.json).

## Neue Abnahmefälle

Die acht V34-Browserfälle prüfen im laufenden Programm:

1. Originalwappen geladen, links neben dem Namen, sichtbar beim Scrollen und nach Seitenwechseln.
2. Markierungen aus-/einblenden, Zustand nach Neuladen, keine zweite LocalStorage-Datenbank und keine Änderung an Texten oder Freigaben.
3. Geburtstage untereinander, für Ranger und Leiter, auf Handy und Desktop.
4. Naturphänomene alphabetisch; Bibelstelle/Gesprächsfrage aus Anzeige und Editor entfernt; neue Planung ohne diese Zusätze, bestehende Quellfelder erhalten.
5. Zwei-Jahres-Regel für alle drei Inhaltstypen: Tag davor, genau am Stichtag, Tag danach, Schaltjahr, erneute Verwendung, Zukunftsplanung, abgesagte/deaktivierte Punkte und heutige Treffen vor/nach Beginn.
6. Reale Zuordnung zu „Vorlagen“/„Schon verwendet“, Suche und Zähler bei Erhalt der Meeting-Historie.
7. Rezeptkategorien, Suche, eigene Kategorie speichern, Textimport mit passender Kategorie und Neuladen.
8. Alle fünf Stufenbuttons innerhalb des Bildes ohne Überlappung, Meister oberhalb der übrigen Stufen, kleinere Fachwissen-Labels und Buchkörper, 66 unterschiedliche Bücher, zwei mobile Buchreihen und wechselnde Startbücher.

Bildschirmgrößen: 1440×900, 1366×768, 1920×1080, 768×1024, 390×844, 375×812, 320×568 und 844×390. Bedienflächen der Stufen und Fachwissen-Labels bleiben mindestens 44 Pixel hoch. Buchhaken bleiben auf Touch-Geräten 44 Pixel hoch.

## Belege

- [Ranger-Dashboard, Handy](screenshots/v34/ranger-dashboard-390x844.png)
- [Ranger-Dashboard, schmalstes Handy](screenshots/v34/ranger-dashboard-320x568.png)
- [Ranger-Dashboard, Desktop](screenshots/v34/ranger-dashboard-1440x900.png)
- [Naturphänomene, Handy](screenshots/v34/nature-phone.png)
- [Rezeptkategorien, Handy](screenshots/v34/recipes-phone.png)
- [Wappen ohne Bildmarkierungen, Handy](screenshots/v34/crest-markers-hidden-phone.png)

Weitere aktuelle Regression-Screenshots liegen in `screenshots/v34/` und `screenshots/v34-regression/`. Die historischen V33-Screenshots bleiben byteidentisch erhalten.

## Auslieferung und Reproduzierbarkeit

`test_v34_packaging` prüft alle bisherigen Dateien gegen die vollständige V33.1-Baseline, ausgenommen den bewusst aktualisierten Einstieg `index.html` und `README.md`. Außerdem geprüft: Einzelhashes der V34-Builds, vollständige Backup-Kopien, korrekter Speicherschlüssel, unveränderte 43 Originalgrafiken und Quellkataloge. Privat werden die ursprünglichen 17 eingebetteten Anlagen, die übrigen Inline-Skripte und die byteidentischen Standalone-Bilddaten geprüft; öffentlich das Fehlen privater PDF-Anlagen und der identische Demo-Einstieg.

Start der vollständigen Prüfung: `python tools/check_v34.py`. Der Runner führt die neuen Abnahmen, die bisherigen 16 V33- und 9 V33.1-Fälle, die 81 Geschäftsregressionen sowie privat den Rechtefall aus. Er bewahrt historische Screenshot-Dateien und legt neue Belege getrennt ab. Anschließend folgen vier Verpackungsprüfungen, zehn Modell-/Navigationstests und 69 Serverprüfungen.

Die gemeinsamen Serverfunktionen sind lokal geprüft. Das ersetzt keine produktive Einrichtung der API; die veröffentlichte Demo bleibt weiterhin browserlokal.
