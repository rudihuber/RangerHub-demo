# RangerHub V32 – Ranger-Wissen, Bibelreise und kompaktes Dashboard

V32 erweitert den verifizierten V31-Stand. Bestehende Nutzer, Rollen, Stammeszuordnung, Wachstumsaufgaben, Fortschritte, Termine, Originalassets, Fachwissen-Prüfungen und Buchmarkierungen werden erhalten. Privater Hauptbranch `main` bleibt bis zur Prüfung unverändert.

## Direkt testen

Öffentliche Demo: https://rudihuber.github.io/RangerHub-demo/ . Die Demo verwendet unverändert die fiktiven Profile und `rhv9-demo`; die private App verwendet weiterhin **`rhv9`**. Ein Download ist zum Testen der Demo nicht erforderlich. Lokal: `python3 -m http.server 8000`, anschließend die neue V32-HTML-Datei öffnen. Keine Datenimporte oder Speicherlöschungen erforderlich.

Die private portable Datei ist `RangerHub_Webapp_V32_Kompakt.html`. Die Funktion ist direkt in dieser Datei eingebunden, nicht nur in einem Reparaturskript. Gzip/ASCII85-Verpackung bleibt verlustfrei; alle 17 ursprünglichen Asset-Referenzen einschließlich zwölf PDF-Referenzen sind erhalten. Die öffentliche Demo enthält weiterhin keine PDFs.

## Ranger-Wissen bedienen

Hauptreiter **Ranger-Wissen** → Gruppe → Thema → beschrifteter Symbolpunkt. Alle 16 Module enthalten echte Inhalte, insgesamt 76 einzelne Erklärungen. Die drei anfangs veröffentlichten Themen sind **So wirst du Ranger**, **Unser Ranger-Emblem** und **Die acht Ranger-Eigenschaften**. Die übrigen 13 sind vollständig vorbereitet und zunächst verborgen.

Fünf Gruppen: Grundlagen & Identität, Werte & Haltung, Kluft & Ausstattung, Teamleben, Team & Stamm. Eigene skalierbare Lerngrafiken für Emblem (Kreuz/Feuer/Kompass), Lilie, Wertekompass, Ranger-Gruß, Kluft, Schlaufen, Banner und Stammposten. Nummerierte Grafikpunkte und beschriftete Schaltflächen führen zur jeweils ausgewählten Erklärung; auf kleinen Geräten rückt der Inhalt in Sicht. Lernbeispiele sind als didaktische Ergänzungen gekennzeichnet. Weder Seitenzahlen noch PDF-Seiten werden in der Lernoberfläche angezeigt. Ranger-Wissen vergibt keine Punkte und verändert keine echten Rollen, Mitgliedschaften, Teamnamen oder Anwesenheiten.

**Admin/Stammleiter:** Ranger-Wissen → **Bearbeiten / Verwalten**. Je Thema Schiebeschalter **Für Ranger sichtbar**. **Admin** wählt „Global · alle Stämme“ oder „Aktueller Stamm“. **Stammleiter** kann ausschließlich seinen eigenen Stamm anpassen; lokale Anpassungen haben Vorrang vor globalen Standards. **Leiter** lesen Inhalte zur Vorbereitung, haben standardmäßig keine Bearbeitungs- oder Publikationsrechte. **Ranger** sehen ausschließlich freigegebene Inhalte; leere Gruppen entfallen.

Neue Gruppe, neues Thema und neuer Symbolpunkt sind über die gleichnamigen Schaltflächen möglich. Texte, Einleitung, Symbol, geprüfte Lerngrafik, Reihenfolge, Zuordnung und optionale Symbolpositionen sind bearbeitbar. Archivieren blendet Inhalte aus, ohne Historie zu löschen. „Wiederherstellen“ und der Änderungsverlauf ermöglichen Rückkehr zu früheren Fassungen. Gleichzeitige Änderungen werden über Revisionsvergleich abgewiesen. Eine Ranger-Vorschau zeigt nur aktuell freigegebene Inhalte. Versteckte Inhalte werden in Ranger-Snapshots nicht ausgeliefert; direkte Lernrouten zeigen eine verständliche Freigabemeldung.

## Bibelreise und Dashboard

**Bibelreise** ist ein eigener Hauptreiter. Alte `#fw/bible…`-Links werden zur neuen `#bibelreise/…`-Route umgeleitet. Fachwissen enthält weiterhin die regulären sieben Aufgaben des Themas „Die Bibel“, nun am Ort **Bibelwissen**; dort gibt es kein Bibelreise-Regal mehr.

Alle 66 Bücher, 240 Originalpunkte, Selbstmarkierung und jederzeitige Rücknahme bleiben unverändert. **Dunkelgrün + Häkchen = gelesen**, **hell = offen**. Ein Buchklick öffnet Details; Punkte entstehen ausschließlich nach ausdrücklicher Lesemarkierung. Die Dashboard-Bücher zeigen denselben echten Status und führen zu denselben Buchdetails.

Reihenfolge für Ranger auf Desktop und Mobil:

1. Nächstes reales, nicht abgesagtes Treffen und Countdown in Berliner Kalendertagen; „Heute“ bzw. verständlicher Leerzustand.
2. Vorhandene Anwesenheitswerte mit quadratischem SVG-Kreis und motivierendem Text.
3. Kompakte, interaktive Vorschauen **Deine Expedition** und **Wissen entdecken**. Desktop nebeneinander, Smartphone untereinander. „Karte vollständig öffnen“ öffnet die vollständige bestehende Karte; fünf Wachstumsstationen, 80-/100-%-Regel, Aufgaben und Logbuch bleiben angeschlossen.
4. **Meine Bibelreise**, größere echte Buchrücken und persönliche Werte.
5. Getrennte Wachstumspfad- und Punkte-Ranglisten mit Top 3, eigener Platzierung und vollständiger Liste.
6. Geburtstage in den kommenden 30 Tagen, ausschließlich Kürzel/Namen und Tag/Monat.

Wachstumsrang: offizielle Stufenfolge, dann bestätigter Anteil der aktuellen Stufe, dann bestätigte Aufgaben insgesamt. Bei gleichem Stand gleicher Platz; alphabetische Alias-Sortierung innerhalb des Gleichstands. Punkte-Rang: ausschließlich bereits bestätigtes Fachwissen plus aktuell gelesene Bibelbücher; keine Anwesenheits- oder Ranger-Wissen-Punkte. Beide Listen verwenden nur Ranger des aktiven Stammes.

Die große persönliche Expeditionskarte erscheint weiterhin ausschließlich beim eigenen Rangerprofil. Leiter erhalten die bestehende Verwaltungsnavigation und einen Stufen-Einstieg; keine persönliche Expeditionskarte im Verwaltungsdashboard. Prüfungszentrale, Planung und Verantwortlichkeiten bleiben erreichbar. Andere bisherige Dashboard-Zwischenelemente einschließlich des Fotoblocks entfallen entsprechend der neuen verbindlichen Reihenfolge; gespeicherte Fotos und Treffen-Fotofunktionen bleiben erhalten.

Login hat weder Wetteranzeige noch Wetteraufrufe. Authentifiziert bleibt das detaillierte Stammwetter technisch erhalten, im Dashboard aber klein und sekundär; Treffpunktprognose ist aufklappbar. In der Demo musste zusätzlich der ältere Logbuch-Login-Wetteraufruf entfernt werden, nicht nur das sichtbare Element.

## Daten und Dateien

- `rangerhub-wisdom-catalog.js`, `data/ranger-wissen-content.json`: strukturierte, redaktionell ausgearbeitete Quelle ohne interne Seitenmetadaten.
- `rangerhub-wisdom-model.js`: Freigaben, Revisionen, Archiv, Historie und Snapshot-Filter; erweitert denselben vorhandenen `RHKnowledgeModel`.
- `rangerhub-wisdom-views.js`: Welt, Gruppen, Lernansichten, echte Verwaltung und Vorschau.
- `rangerhub-dashboard-v32.js`, `rangerhub-v32.css`: Dashboard-Reihenfolge, Kreis, Vorschaukarten, Rankings und kontrastreiche Bücher.
- `rangerhub-knowledge-v32.js`: gemeinsame bestehende Navigation, neue kanonische Routen und Integration.
- `rangerhub-knowledge-transport-v32.js`, `backend/knowledge-server.mjs`: gleiche lokale/API-Grenze mit globaler Ranger-Wissen-Persistenz und Serverrechten.
- `rangerhub-expedition-v32.js`: unveränderte Wachstumsberechnungen, zusätzlich Aktualisierung/Resize der vollständigen Karte auf ihrer neuen Route.
- `rangerhub-bible-views-v32.js`, `rangerhub-v27-v32.js`: gezielte Ansichts- und Login-Anpassungen; bestehende Fachfunktionen erhalten.
- Nur Demo: `rangerhub-logbook-v32.js` entfernt den früheren, schon vor V27 ausgeführten Login-Wetterabruf.

Neue Daten werden ausschließlich im vorhandenen Fachwissen-Datensatz geführt: lokal `stamms[stammId].knowledge.rangerWisdom`, global `shared.knowledgeCatalog.rangerWisdom`. Kein neuer LocalStorage-Key, keine zweite Punkte-Datenbank. Basisinhalte sind idempotent über stabile IDs abgeleitet; bloßes Öffnen erzeugt keine Wissens- oder Punktedatensätze. Anpassungen werden erst bei tatsächlicher Bearbeitung geschrieben.

## Sicherung, Prüfung und nächste Runde

Git-Sicherungspunkt: `backup/before-v32-ranger-wissen`. Vollständige unveränderte Vorversionskopien aller getrackten Dateien mit SHA-256-Manifesten liegen unter `/workspace/rangerhub-delivery/V32/backup/`, zusätzlich bleiben die V31-HTML-Dateien im Repository. Baseline: `docs/v32-baseline.json`, aktuelle Prüfsummen: `docs/V32-SHA256SUMS`.

Aktuelle Tests: `python tools/check_v32.py`. Bericht: `docs/V32-TESTBERICHT.md`. Produktive Online-Konfiguration und Grenzen: `docs/V32-BACKEND.md`. Visuelle Ergebnisse: `docs/screenshots/v32/`.

Private Änderungen bleiben im Branch `feature/v32-ranger-wissen-dashboard`. Erst nach eigener Abnahme per GitHub-Vergleich/Pull Request in den privaten `main` übernehmen. Keine Benutzer-Daten neu importieren und `rhv9` nicht löschen. Die öffentliche Demo ist separat und enthält keine echten Personenprofile oder Original-PDFs.
