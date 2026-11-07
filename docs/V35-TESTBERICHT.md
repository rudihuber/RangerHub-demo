# V35 – Testbericht

Stand: 7. November 2026. Geprüft wurde die Erweiterung der vorhandenen V34 mit den vorhandenen Profilen, Rollen, Quellgrafiken und dem unveränderten privaten Speicherschlüssel `rhv9`. Die öffentliche Demo verwendet weiterhin `rhv9-demo`.

## Ergebnisse

| Prüfung | Ergebnis |
| --- | --- |
| Öffentliche Demo: Browserabnahme einschließlich bisheriger Regressionen | 127/127 bestanden, 417,797 Sekunden |
| Private Kompaktdatei: bisherige Browserregressionen | 115/115 bestanden |
| Private Kompaktdatei: neue V35-Browserfälle, abschließender Lauf | 13/13 bestanden, 33,190 Sekunden |
| Zentraler Node-/SQLite-Dienst einschließlich früherer Serverfälle | 82/82 bestanden |
| Navigation und Originalbibliothek: Node-Unitprüfungen | 10/10 bestanden |
| Paket-, Backup-, Quell- und Bildintegrität | je 4/4 privat und Demo bestanden |

Beim ersten vollständigen privaten Browserlauf liefen zwei neue Mehrfensterfälle vor der asynchronen Entpackung der Kompaktdatei an und warfen einen ReferenceError im Test. Die Wartebedingung wurde auf das vorhandene `window.RangerHub` abgesichert. Anschließend bestanden alle 13 neuen Fälle erneut. Die 115 bestehenden Fälle waren schon im vollständigen Lauf erfolgreich. Der ursprüngliche Lauf wird im privaten Protokoll mit seinen zwei Testfehlern unverändert aufbewahrt; die Zahlen sind kein behaupteter einzelner grüner 128er-Lauf.

## Konkrete Abnahme

- Editor: Originalmodul-Konvertierung aller 16 Themen, direkte Textbearbeitung, Entwurf/Veröffentlichung, Bildupload, Verschieben, Größenänderung, Undo/Redo, Seitenverwaltung, Tastaturaktionen, Versionswiederherstellung und konkurrierende Änderungen mit Revisionskonflikt.
- Leser: veröffentlichte Seiten bei 320, 375, 390, 768 und 1440 Pixeln; Text bleibt innerhalb der sichtbaren Fläche. Seitenentwürfe und nicht freigegebene Inhalte bleiben für Ranger verborgen.
- Mitgliedschaft: aktive Standardlisten, Filter/Zähler, datierte Pausen/Austritte/Reaktivierung, historische Quoten, aktive Ranglisten, erhaltene Punkte und Prüfungen, markierte Leiterzuständigkeiten und stammspezifische Rechte.
- Tatsächlicher lokaler Server mit zwei unabhängigen Browserprofilen: Entwurf und veröffentlichte Bilddatei geräteübergreifend abrufbar; Pausierung erzwingt Lesezugang, Austritt widerruft auch das bestehende persönliche Token.
- Serverseitige Rollen- und Stammprüfung, Revisionskonflikte, Wiederholbarkeit, append-only Statusjournal, Bilderzugriff, sichere SVG-Prüfung und größere Präsentationen über 128 KiB.
- Browserbackup mit eigenem Bild: ZIP exportiert, Bildspeicher geleert, Daten und Bild wiederhergestellt, danach Entwurf und Bild erneut geladen. Bestehender JSON-Import bleibt unterstützt.
- KI: sichtbarer Zustand ohne Konfiguration; ausdrücklich synthetischer Testanbieter für Vorschau, Übernehmen, Verwerfen, Undo, Kontextbegrenzung und Ratenlimit. Keine echten Anbieteraufrufe oder Schlüssel.

## Verlustfreie Auslieferung

Vor Änderungen vollständig gesichert und per SHA-256 gelesen: privat 737, Demo 779 getrackte Dateien. Historische Testaufnahmen wurden nach der Regression byteidentisch aus dieser Sicherung zurückgelegt; neue Aufnahmen liegen in `screenshots/v35/` und `screenshots/v35-regression/`.

Die private Kompaktdatei ist 24.948.075 Bytes groß und damit unter 25 MB. Die Standalone-Datei ist 33.106.470 Bytes groß. Alle 17 zuvor eingebetteten Anlagen, einschließlich der 12 PDF-Anlagen, sind unverändert. Die Standalone-Fassung enthält die 43 Originalgrafiken zusätzlich byteidentisch. Die öffentliche Demo enthält keine eingebetteten privaten PDFs. Katalog, Originaltexte und Quellzuordnungen wurden per Hash gegen die Baseline geprüft.

## Belege und Wiederholung

- [Editor am Desktop](screenshots/v35/editor-desktop.png)
- [Mitgliederfilter am Desktop](screenshots/v35/member-filters-desktop.png)
- [Mitgliederfilter am Telefon](screenshots/v35/member-filters-phone.png)
- [Statuswechsel am Telefon](screenshots/v35/status-change-phone.png)
- [Veröffentlichte Seite am Telefon](screenshots/v35/published-390x844.png)
- [KI ohne Einrichtung](screenshots/v35/ai-setup-required.png)
- Maschinenprotokolle unter `tests/v35-*`.

Gesamte Prüfung: `python tools/check_v35.py` mit Python/Playwright, Chromium, Pillow und Node 24. Es werden temporäre Browserprofile und Testdaten verwendet. Der Testaufruf erhält historische Aufnahmen und legt neue Belege separat ab. Paketprüfungen kontrollieren bei vorhandener separater Sicherung zusätzlich deren vollständige Dateien.

## Betriebsgrenzen

Die öffentliche Demo und die ausgelieferte Standarddatei arbeiten browserlokal. Zentrale Speicherung, Rechteprüfung und Geräteabgleich sind implementiert und tatsächlich lokal getestet; eine produktive API mit persönlicher Anmeldung ist nicht eingerichtet. Auch der optionale KI-Anbieter ist nicht konfiguriert. Dafür sind die Schritte in [V35-BACKEND.md](V35-BACKEND.md) erforderlich. Die manuelle Bearbeitung funktioniert ohne KI. Es wurde kein kostenpflichtiger Dienst eingerichtet.
