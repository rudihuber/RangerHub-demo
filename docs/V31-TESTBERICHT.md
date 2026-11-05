# Bibellesen – Prüfung der tatsächlichen RangerHub-App

Stand: 5. November 2026. Geprüft wurden die neue private kompakte HTML-Datei und die öffentliche Demo im echten Chromium-Browser, zusätzlich der vorhandene Node-/SQLite-Dienst über echte lokale HTTP-Verbindungen. Sämtliche Personenänderungen, Markierungen und Punkte in den Tests befinden sich ausschließlich in vorübergehenden Browserprofilen/Testdatenbanken.

## Ergebnis

- Vollständige Demo-Abnahme: **102/102 Browser-/Integritätsprüfungen bestanden**.
- Vollständige private HTML-Abnahme: **98/98 Browser-/Integritätsprüfungen bestanden**.
- Backend: **45/45 Servertests bestanden** – 20 neue Bibellese-/Migrationstests und 25 unveränderte Fachwissen-Regeltests.
- Danach nochmals die vollständigen neuen Bibellese- und Verpackungsprüfungen für die letzte Schriftanpassung sowie eine zusätzliche echte Touch-Prüfung der schnellen Rücknahme: Demo **17/17**, private HTML **18/18** bestanden.
- Zusätzliche Schlussprüfung der alten Sammelbuchungen und des echten Mehrgeräte-Ablaufs: Demo **4/4**, private HTML **5/5** bestanden.
- Alle **272 privaten** und **316 Demo-Dateien** im vollständigen Vorversionsbackup SHA-256-verifiziert. Die vorhandenen V30-Screenshots bleiben unverändert; neue Bilder liegen ausschließlich unter `docs/screenshots/v31/`.
- Neue kompakte HTML unter 25 MB; alle 17 ursprünglichen Asset-Referenzen einschließlich 12 PDF-Referenzen und sämtliche anderen bisherigen Inline-Skripte unverändert. Neue Funktion direkt in der ausgelieferten HTML eingebunden, kein Reparaturskript nötig. Die öffentliche Demo enthält weiterhin keine PDFs und ausschließlich ihre bisherigen fiktiven Profile.

Aktueller vollständiger Befehl: `python tools/check_v31.py`. Zusätzliche Schlussprüfung: `PYTHONPATH=tests python -m unittest test_bible_v31 test_v31_packaging -v`. Servertests: `node --test backend/test-bible-v31.mjs backend/test-knowledge-v30.mjs`.

## Die 13 Abnahmekriterien

| Kriterium | Ergebnis und Nachweis |
|---|---|
| 1. Vollständiger Katalog | Runtime-Katalog entspricht dem unveränderten hochgeladenen JSON vollständig. Genau 66 eindeutige stabile IDs, 39 AT/27 NT in kanonischer Reihenfolge, 187 + 53 = 240 Punkte. Alle Buchdetails im Browser geöffnet. |
| 2. Buch öffnen ohne Punkte | Einstieg in die Bibliothek zeigt nur zwei Testamente. Testament zeigt nur seine Bücher. Buchklick öffnet Details, Punkte bleiben unverändert; auch Abbrechen der Nachfrage schreibt nichts gut. |
| 3. Selbst markieren | Bestätigung „Hast du das ganze Buch … gelesen?“ führt unmittelbar zu Gelesen und genau dem kanonischen Buchwert, ohne Leiter/Nachweis/Termin. |
| 4. Selbst zurücknehmen | Dauerhafte Aktion und schnelle Rückgängig-Aktion getestet, letztere innerhalb des nativen Dialogs auch mit echten Touch-Eingaben bei 320×568, 390×844 und 768×1024. Genau der Buchwert wird storniert. |
| 5. Erneut markieren | Lesen → zurücknehmen → erneut lesen mehrfach geprüft: kein zusätzlicher Bonus, immer nur eine aktive Buchung. |
| 6. Zwei Geräte/Doppelklick | Parallele Anfragen und gleiche Request-IDs erzeugen nur einen aktiven Status/Award. Veraltete Markierung nach zwischenzeitlicher Rücknahme wird abgelehnt. Drei unabhängige Browser-Speicher – zwei Rangergeräte und Leiteransicht – bestätigen gemeinsamen Status und gemeinsame Rangliste. |
| 7. Exakt 240 bzw. 0 | Alle 66 Bücher über echte HTTP-Anfragen markieren: 240 Punkte und 66 Bücher. Alle zurücknehmen: 0 Punkte und 0 Bücher. SQL-Projektion und aktive Journalbuchungen stimmen überein. |
| 8. Keine Prüfungsplätze | Buchmarkierungen verändern keine normalen Prüfungsanmeldungen. Drei normale Prüfungen bleiben verfügbar; die vierte bleibt auch nach Bibelmarkierungen blockiert. |
| 9. Übrige Punkte erhalten | Echte normale Aufgabe durch Leiter bestätigt, danach Bibelmarkierung/Rücknahme: ursprüngliche Gutschrift bytegleich erhalten; Gesamtstand wechselt beispielsweise 5 → 15 → 5. Profil, Dashboard und Rangliste stimmen überein. |
| 10. Serverrechte | Fremde Ranger-ID, vorgegebene Punkte/Rolle/Nachweise, falsche Bücher und nichtboolesche Zustände abgewiesen. Leiter/Stammleiter/Admin können keine fremden Lesemarkierungen ändern. Stammes-/Teamgrenzen und gleichlautende IDs in verschiedenen Stämmen geprüft. |
| 11. Persistenz | Reload mit aktiver Sitzung, Profilwechsel, Stammwechsel, Buch-Direktlink und erneutes Online-Anmelden auf unabhängigen Browser-Speichern erhalten den Zustand. Kein weißer Bildschirm; kein stiller lokaler Fallback bei Onlinefehlern. |
| 12. 395er-Migration | Im realen V30-Stand keine solche Funktion vorhanden. Zusätzlich vollständige 395er-Fixture mit 66 Markierungen über SQLite-Neustart auf exakt 240 migriert, Markierungen/Versionen behalten, wiederholter Start ohne weitere Awards. Teilzustände und offene alte Buchprüfungen separat geprüft; unzugeordnete alte Sammelgutschriften werden ohne Doppelzählung sicher abgewiesen; keine stillen Lesebestätigungen. |
| 13. Responsive und zugänglich | Desktop, iPad und Smartphone einschließlich 320 px/Querformat, Suche, Statusfilter, Tastaturbedienung, Fokus, ARIA-Lesestatus, Farb- und Textunterscheidung, reduzierte Bewegung und Touchziele ≥44×44 px geprüft. Keine horizontale Seitenrolle. |

## Bestehende Funktionen und Integrität

Zusätzlich geprüft: vollständiger Fachwissen-Katalog mit allen 36 Themen und 253 Aufgaben, alle fünf Unterwelten, Leiterprüfungen und Ergebniskorrekturen, globale/lokale Redaktion, Archivierung, Rollen, Rudi Hubers Adminrechte und Ben Hensels Stammleiterrolle, Stammwechsel, Wachstumspfad mit 0/79/80/99/100 %, Bonuspakete, vorzeitig bearbeitete Folgestufen, Treffenplanung samt Warnung bei ungespeicherten Änderungen, Rezepte/PDF-/Word-Import, Wetter, Anwesenheit, Fotos/Slides, Knotenprüfung, Vorschläge und bisheriger Demo-Chat.

Die Navigation des bisherigen Tests für das Thema Die Bibel wurde um den ausdrücklich gewünschten Bibliotheks-Zwischenschritt ergänzt. Screenshotpfade verwenden die aktuelle Versionsmetadaten, damit alte Bilder unverändert bleiben. Keine anderen fachlichen Regressionserwartungen entfernt.

Kanonische Quelle und Originalversionen gegen SHA-256 geprüft. Quelle: `ea4f106082ca515d57efc74c93f0020d0f5ad6bed43942df0452fed11d88685f`. Aktuelle App-/Modulprüfsummen: [V31-SHA256SUMS](V31-SHA256SUMS), Vorversion: [v31-baseline.json](v31-baseline.json).

## Screenshots und visuelle Prüfung

Chromium/Playwright: 1440×900, 1920×1080, 1366×768, 768×1024, 390×844, 375×812, 320×568 und 844×390. Zusätzliche separate Touch-Kontexte in 320×568, 390×844 und 768×1024.

Aufgenommen und zusätzlich visuell geprüft: Dashboard mit beiden bestehenden Karten plus kompakter Bibelreise, Bibliotheksraum, AT-/NT-Regale mit gelesenen/offenen Buchrücken, Buchdetails und Touch-Markierung. Die Beispielmarkierungen existieren nur in Testprofilen und werden nicht als Beispieldaten in die App geschrieben. [Screenshotverzeichnis](screenshots/v31/), [Liste mit Prüfsummen](v31-screenshots.json).

## Verbleibende technische Abhängigkeiten

Die öffentliche Vorschau speichert weiterhin lokal. Der gemeinsame Backend-Code ist tatsächlich implementiert und getestet; produktiver Node-Host, dauerhaftes SQLite, HTTPS und persönliche Authentifizierung/Frontend-Konfiguration sind **noch nicht aktiviert**. [Einrichtung](V31-BACKEND.md). Keine Behauptung, dass beliebige Geräte die öffentliche lokale Demo bereits gemeinsam speichern.

Physisches iPhone/iPad, Safari/WebKit und manuelles VoiceOver waren in dieser Umgebung nicht verfügbar. iPhone-/iPad-Größen wurden mit Chromium und echten Touch-Kontexten geprüft. Safari und der konkrete persönliche Auth-Dienst sind nach Produktivbereitstellung auf echten Geräten zusätzlich abzunehmen.

Lesemarkierungen folgen ausdrücklich dem Vertrauensprinzip. Die App behauptet nicht, das tatsächliche Lesen technisch verifiziert zu haben. Keine Anhänge oder Leseprotokolle werden gesammelt. Chat, Fotos und Wachstumspfad behalten ihre bisherigen Online-/Offline-Grenzen.
