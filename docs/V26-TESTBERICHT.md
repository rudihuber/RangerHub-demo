# RangerHub Demo V26 – Testergebnisse

Chromium 154.0.8037.57, Playwright 1.62.0, Sprache Deutsch,
Zeitzone Europe/Berlin. Alle Tests verwenden isolierte Browserkontexte.

**57 Prüfungen erfolgreich:** 43 bisherige Prüfungen und 14 Abnahmeprüfungen
für die neue Expeditionskarte. Die private Vollversion wird mit ihren eigenen
Integritäts-, Rollen-, Upgrade- und PDF-Prüfungen getrennt getestet.

| Bereich | Ergebnis |
| --- | --- |
| 0 %, 79 %, 80 %, 99 %, 100 % | Exakte Freischalt- und Abschlussgrenzen erhalten |
| 85 % Beobachter + 20 % Erkunder | Offiziell Beobachter, Erkunder zugänglich, beide Werte erhalten |
| Aufstieg und Neuladen | Vorzeitig erledigte Folgeaufgaben bleiben bestehen |
| A/B/C/Reflexion, leere Stufen | Korrekte Abschlusszählung, kein automatischer Leer-Abschluss |
| Echte Leiter-Checkbox | Bestehender Fortschritt erscheint auf derselben Rangerkarte |
| Rollen und Seiten | Karte nur im eigenen Ranger-Dashboard |
| Stammwechsel, gleiche IDs | Keine Vermischung persönlicher Fortschritte |
| Bestehende Aufgaben und Logbuch | Erreichbar, Rückkehr zur Karte funktioniert |
| Gesperrte Stationen | Verständlicher Hinweis statt Fehler oder leerer Seite |
| Touch auf 320 / 390 Pixel | Stationsdetails und bestehender Logbuchdialog schließen per Tap oberhalb der Navigation |
| Tastatur / Screenreader | Dialogname, Fokus, Tab-Zyklus, Escape und Fokusrückkehr geprüft |
| Reduzierte Bewegung | Keine Markeranimation und kein sanftes automatisches Scrollen |
| Bisherige Funktionen | Planung, Teilnahme, Rezepte, PDF/Word/OCR und Speicherung erhalten |

## Echte Browser-Screenshots

| Größe | Screenshot |
| --- | --- |
| 1440 × 900 | [Desktop](screenshots/v26/expedition-1440x900.png) |
| 1920 × 1080 | [Großer Desktop](screenshots/v26/expedition-1920x1080.png) |
| 1366 × 768 | [Laptop](screenshots/v26/expedition-1366x768.png) |
| 768 × 1024 | [Tablet](screenshots/v26/expedition-768x1024.png) |
| 390 × 844 | [Smartphone](screenshots/v26/expedition-390x844.png) |
| 375 × 812 | [Schmales Smartphone](screenshots/v26/expedition-375x812.png) |
| 320 × 568 | [Kleines Smartphone](screenshots/v26/expedition-320x568.png) |
| 844 × 390 | [Smartphone quer](screenshots/v26/expedition-844x390.png) |

Zusätzlich: [Stationsdetails Erkunder](screenshots/v26/station-erkunder.png)
und [Admin-Dashboard ohne Karte](screenshots/v26/admin-without-map.png).
Der [mobile Stationsdialog](screenshots/v26/station-mobile-dialog.png) wurde
zusätzlich in Touch-Kontexten auf 320 und 390 Pixel Breite geöffnet und geschlossen.

Geprüft: keine horizontale Seitenscrollleiste, keine überlappenden oder
abgeschnittenen Stationsfelder, mindestens 44 × 44 Pixel große Ziele und
sichtbarer persönlicher Standort auf Smartphones. Auf den Desktopgrößen sind
alle fünf Stationen gleichzeitig innerhalb des sichtbaren Bereichs.

Die Screenshots zeigen kontrollierte 85-%-/20-%-Testdaten in temporären
Browserkontexten. Die ausgelieferten Aufgaben- und Benutzerdaten werden dadurch
nicht verändert. Vorversion und neue Version sind über
[SHA-256-Prüfsummen](V26-SHA256SUMS) dokumentiert.

## Grenzen

WebKit/Safari ist nicht installiert. Der Installationsversuch scheiterte an der
Netzwerkrichtlinie mit HTTP 403 „Domain forbidden“. Ein Safari-Test wurde daher
nicht behauptet; der Test-Harness kann nach Installation mit
`RANGERHUB_BROWSER=webkit` ausgeführt werden.

Die Demo bleibt eine lokale Anwendung mit frei wählbaren Profilen. Sie
synchronisiert keine Fortschritte oder Absagen zwischen Geräten. Die neue Karte
ändert weder Anmeldung noch Datenhaltung. Private PDFs bleiben wie zuvor aus
der öffentlichen Demo ausgeschlossen.
