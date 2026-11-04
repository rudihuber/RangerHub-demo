# RangerHub V27 – Testbericht

Stand: 4. November 2026. 76 automatisierte Prüfungen erfolgreich; zusammen
mit dem getrennten privaten Repository 133 erfolgreiche Prüfungen.

## Durchführung

`python3 -m unittest discover -s tests -v`

Echter Headless-Browser: Chromium 154.0.8037.57 built on Debian GNU/Linux 13 (trixie), Playwright, de-DE,
Europe/Berlin. Alle Browserkontexte und Daten waren isolierte Testdaten;
keine produktiven Browserdaten wurden zurückgesetzt. Die vollständige Suite
ist erfolgreich. Nach der letzten rein visuellen Meister-Anpassung wurden
Layout/Screenshots und Paketintegrität gezielt erneut geprüft.

## Ergebnisse

| Bereich | Ergebnis |
| --- | --- |
| Anmeldung, Neuladen mit aktiver Sitzung, Speichern und erneutes Laden | Bestanden |
| Direkter Wechsel V26 → V27 unter derselben Origin | Alle alten Werte, IDs und die aktive Sitzung erhalten |
| Admin, Stammleiter, Leiter und Ranger | Bestanden, einschließlich Rollenprüfungen bei direkten Funktionsaufrufen |
| Stammwechsel und gleiche Personen-IDs in verschiedenen Stämmen | Keine Vermischung von Fortschritten, Anwesenheit oder Fotos |
| 0/79/80/99/100 %, Bonus A/B/C/Reflexion, leere Stufen, vorzeitige Folgestufenaufgaben | Bestanden; bestehende Zähler/Regeln unverändert |
| Wetter: Jugendwiese Cloppenburg, Stadt/PLZ, anderer Treffort, Stammortwechsel | Richtiger Ort; nur Stadt/PLZ zur Geocodierung |
| Detaillierte aktuelle Werte, Regen/Wind/Böen, Prognosegrenze, Netzausfall | Bestanden mit kontrollierten API-Antworten |
| Geburtstage 04, Seitenabstand, mobiler Punkt nach Zusammen | Bestanden; kein horizontales Scrollen |
| Änderungen schließen / Escape / Hintergrund / Navigation / Stammwechsel | Speichern, Verwerfen, Weiter bearbeiten; ungültige Pläne bleiben offen |
| Rezepteditor und PDF-/Word-/Scanimport | Bisheriger Import und Lebensmittel-Checklisten funktionieren weiter |
| Anwesenheit per Häkchen und Abmeldungen | Erst explizites Speichern erfasst Anwesenheit |
| Neue Aufgabenbestätigung mit Datum/Leitung und Ranger-Leseansicht | Bestanden; alte Angaben werden nicht erfunden |
| Knoten bei zwei Treffen an unterschiedlichen Tagen | Erst zweiter Nachweis zählt; gleicher Termin abgewiesen |
| Alte Knotenabschlüsse | Bleiben erhalten und können vom Leiter gezielt zurückgenommen werden |
| Drei/vier Fotos, Größenlimit, Speichern, Neuladen, Fotostrecke | Bestanden; maximal vier Bilder |
| Simulierter voller Browserspeicher | Warnung, vorherige Daten erhalten, Entwurf bleibt geöffnet |
| Eigene Abmeldung im Ranger-Dashboard und Rücknahme | Bestanden, einschließlich Neuladen |
| Eigene Anwesenheitsquote und motivierende Texte | Nur tatsächlich erfasste vergangene/heutige Treffen zählen |
| 55 Aktionen und 17 Rezepte | Additiv importiert; vorhandene IDs/Inhalte bleiben erhalten |
| Aktionsrechte und dauerhafte Löschung | Leiter legen an; Admin/Stammleiter löschen; alte Treffen behalten Inhalte |
| Tastatur, Fokus, gesperrte Stationen, reduzierte Bewegung | Bestanden; vorhandene Kartenbedienung bleibt erhalten |

## Bildschirmgrößen und echte Touch-Ereignisse

1440×900, 1920×1080, 1366×768, 768×1024, 390×844, 375×812, 320×568
und 844×390 wurden im Browser geprüft. Alle fünf Kartenstationen bleiben
auf den Desktopgrößen innerhalb des sichtbaren Kartenbereichs. Keine
überlappenden Stationen und keine horizontale Dokument-Scrollleiste.
Touch-Prüfungen mit `is_mobile=True` und `has_touch=True` bei 320×568
und 390×844: Karten-/Logbuchdialoge, Planung/Speicherwarnung, Anwesenheit
und direkte Absage. Screenshots stehen in `docs/screenshots/v27/`.

## Grenzen

- Wetterdienste sind aus dieser Cloud-Umgebung durch den Netzfilter nicht live
  erreichbar. Wetteranzeigen wurden mit realistischen kontrollierten Antworten
  sowie Ausfällen geprüft. Die App ruft Open-Meteo im Benutzerbrowser ab und
  kennzeichnet fehlende Daten ausdrücklich. Keine erfundenen Wetterwerte.
- Safari/WebKit ist nicht verfügbar; der Download war zuvor mit HTTP 403
  „Domain forbidden“ blockiert. Keine Tests auf physischen Geräten.
- Fotos und Appdaten bleiben im jeweiligen Browser und im bestehenden
  JSON-Datenexport; keine automatische Synchronisierung zwischen Geräten.
- Bei alten Bestätigungen ohne Zeit/Leiter wird der fehlende Nachweis genannt.
- Historische Termine aus dem Anhang wurden bewusst nicht als neue Termine
  importiert; geliefert sind die angeforderten wiederverwendbaren Vorlagen.

## Integrität und Prüfsummen

Siehe `V27-SHA256SUMS`, `v27-build.json`, `v27-baseline.json` und
`v27-library-source.json`. V25 und V26 sind unverändert erhalten.

Öffentliche Demo weiterhin ohne gebündelte PDFs, Original-Payload und
persönliche Stammdaten. Getrennter LocalStorage `rhv9-demo`.
