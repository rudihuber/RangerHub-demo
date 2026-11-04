# Fachwissen – Testbericht V29

4. November 2026. **116 App-Prüfungen in diesem Repository erfolgreich.**
Insgesamt: 103 private + 116 Demo-Prüfungen + 15 zentrale Serverprüfungen = **234 erfolgreiche Prüfungen**.

## Inhalt und Navigation

- 3 Quellkategorien, 36 Themen, 253 Hauptaufgaben, 302 vollständig erhaltene Quellabsätze.
- Alle 250 expliziten Punktangaben einzeln zugeordnet. Keine zusätzliche Bepunktung der Unterfragen.
- Die fünf vorgegebenen Referenzfälle stimmen: Sternbilder 5, Bibelbücher 4, Erste-Hilfe-Kurs 20, Angelschein 30, einfache Kochaufgabe 2 Punkte.
- Vier dokumentierte Klärungsfälle: Gäste 4, Bürgerkunde 9, Geistlicher Dienst 4, Fitness-Trainingsweg. Sportabzeichen Silber erhält ausschließlich bei genau dieser Alternative 8 Punkte.
- Alle sechs Kartenregionen und alle 36 Themen tatsächlich geöffnet, erste Aufgabe jedes Themas geöffnet und zurück navigiert. Keine JavaScript-Fehler; `v29-navigation-audit.json`.
- Einstieg enthält keine ausgeklappte Themen-/Aufgabenliste. Native Detailansicht, Zurück, Escape, Fokus-Rückgabe und echte Touch-Ereignisse geprüft.

## Aufgaben und Punkte

Beginn → freiwillige Einreichung → Leiterprüfung → Dashboard/Rangliste aus derselben Gutschrift.
Vor Bestätigung keine Punkte. Ranger können weder bestätigen noch Quellwerte verändern oder für andere Ranger einreichen.
Unklare Werte erst nach dokumentierter Quellenklärung; alternative Fitness-Punkte werden nicht doppelt gebucht.
Doppelklick, wiederholte Genehmigung, Reload, Request-Retry und gleichzeitige Freigaben erzeugen keine doppelten Punkte.
Widerruf benötigt einen Grund, hängt genau eine Rückbuchung an und erhält die Historie.
Nachweise bleiben bei Eigentümer und Leitung; Texte werden escaped. Speicherfehler ändern den bisherigen Store nicht.

## Wettbewerb und Stammschutz

Nur aktive, berechtigte Ranger des aktiven Stamms. Gleiche Punkte: gleicher Rang; ohne Punkte noch keine Platzierung.
Top-Plätze, eigene Position außerhalb der Top 3, Wochenwertung, Quellkategorie und Monatsfilter geprüft.
Einladung, Zustimmung, Ablehnung, Abbruch, persönliche Eignungs-/Aufsichtsfreigabe, Grenzen gegen Spam,
Nachweisstatus, bestätigter Sieg/Unentschieden, Fristprüfung und Wiederöffnung nach Widerruf geprüft.
Keine Challenge-Bonuspunkte. Andere Stämme und fremde Nachweise werden ausgeschlossen.
CLP-West/Meppen, kollidierende IDs zwischen Stämmen, Admin und Stammleiter behalten die vorhandenen Rechte.

## Zentrale Anbindung

Echte lokale HTTP-Anfragen an den Node-/SQLite-Dienst, persönliche Token-Prüfung, serverseitige Mitgliedschaft
und Rollen, atomare Transaktionen, unveränderbarer Ledger und idempotente Befehle geprüft.
Drei **getrennte Browser-Speicher**: Ranger reicht ein, Leiter bestätigt, anderer Ranger sieht denselben
Ranglistenstand ohne fremden Nachweis. Online-Neuladen funktioniert nach erneuter persönlicher Transportanbindung.
Ein Token, das nicht zum gewählten App-Profil gehört, wird abgewiesen.
Ein lokaler Demo-Export wird nicht automatisch zu amtlichen Online-Buchungen importiert.

**Kein produktiver Onlinedienst aktiviert.** Die ausgelieferte Vorschau bleibt sichtbar
„Demo / nur lokale Daten“. Hosting, HTTPS, persönliche Server-Zugänge und kontrollierter Import sind
noch zu konfigurieren; `V29-BACKEND.md`. Kein Anbieter gebucht, keine Kosten ausgelöst.

## Darstellung und bestehende Funktionen

Chromium 154 mit Playwright, de-DE und Europe/Berlin. Größen: 1440×900, 1920×1080,
1366×768, 768×1024, 390×844, 375×812, 320×568, 844×390. Echte emulierte Touch-Kontexte
bei 320, 390 und 768 Pixeln. Keine horizontale Scrollleiste; alle Karten-Klickflächen mindestens 44×44 Pixel,
alle Beschriftungen innerhalb der Karte und ohne gegenseitige Überlappung. Reduzierte Bewegung und Tastatur geprüft.
Mobile Dashboard-Punkte bleiben beim Einstieg sichtbar. Standortknopf und ausdrückliche Rückkehr zur alten
Wachstumskarte positionieren weiterhin den Ranger. Der Wachstumspfad liegt unter der neuen Übersicht.

Anmeldung, aktive Sitzung nach Reload, Stammwechsel, Personen/Rollen, Wachstumspfad mit 0/79/80/99/100,
vorzeitiger Folgestufe und Bonuspaketen, Rangerrechte, Rangertreffen, Speicherwarnung, Anwesenheit,
Knoten-Nachweise, Fotos, Rezepte, PDF-/Word-/Scanimport, Wetterdarstellung, Natur-/Aktionsbibliotheken und
Demo-Nachrichten bestehen weiterhin. Upgrade V28 → V29 verändert keine vorhandenen Stammdaten oder Fortschritte.

Safari/WebKit und physische iPhones/iPads wurden in dieser Umgebung nicht getestet.
Wettertests verwenden kontrollierte Antworten; Live-Wetterzugriff ist in der Cloud eingeschränkt.
Echte Browser-Screenshots stehen unter `screenshots/v29/`; darin sichtbare positive Punkte stammen nur
von im temporären Testprofil eingereichten und bestätigten Originalaufgaben, nicht von ausgelieferten Seed-Punkten.

## Integrität und Lieferung

V28 und alle bisherigen Inline-Skripte sind unverändert. 17 Original-Assetreferenzen einschließlich
12 PDF-Referenzen bleiben bytegleich. Privater LocalStorage-Key: `rhv9`, Demo: `rhv9-demo`.
Backup-Manifest: `v29-baseline.json`, Git-Tag: `backup/before-v29-fachwissen`.
Die neue private HTML enthält die Erweiterung tatsächlich inline; kein Reparaturskript erforderlich.

Private HTML: **24984835 Bytes**, unter 25 MB.
SHA-256: `4e0924007579eea66da982aec74fc56638399439185d4a4a8672cfa47ae70f7d`.
Alle weiteren Prüfsummen: `V29-SHA256SUMS`; Builds: `v29-build.json`.
