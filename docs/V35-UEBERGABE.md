# V35 – visueller Ranger-Wissen-Editor und Mitgliederstatus

V35 erweitert die vorhandene, geprüfte V34. Die Auftragsdatei nennt V33; entsprechend ihrer Versionsregel wurde die nächste freie Versionsnummer verwendet. Es handelt sich um dieselbe RangerHub-App, mit unverändertem privaten LocalStorage-Key `rhv9`. Die öffentliche Demo bleibt getrennt unter `rhv9-demo` und enthält ausschließlich fiktive Profile.

## Vorherige Sicherung und Rückweg

Vor der ersten Änderung wurden privat 737 und öffentlich 779 getrackte Dateien vollständig kopiert, einzeln per SHA-256 geprüft und erneut aus der Sicherung gelesen. Die Git-Tags heißen `backup/before-v35`. Baseline und Einzelhashes liegen in `docs/v35-baseline.json`; die vollständigen Kopien liegen im Übergabeverzeichnis `V35/backup/`.

Die früheren HTML-Versionen, Quellkataloge und Originalgrafiken bleiben unverändert. Absichtlich aktualisierte bestehende Dateien: `index.html`, `README.md` und der bestehende Server `backend/knowledge-server.mjs`. Alle weiteren Implementierungen sind neue V35-Dateien. Neue Testaufnahmen sind von historischen Screenshots getrennt.

Der Rückweg für Browserdaten ist ebenfalls getestet: Ein vollständiges ZIP-Backup mit bearbeiteten Wissensseiten und Bilddateien wurde exportiert, der Test-Bildspeicher geleert und das Backup wieder importiert. Entwurf, Datenmarkierung und Bild waren anschließend wieder vorhanden. Die importierte Datei wird vor Änderungen geprüft und muss ausdrücklich bestätigt werden. Bei einem Format-, Prüfsummen- oder Speicherfehler wird der bisherige Stammdatenspeicher nicht ersetzt.

## Visueller Editor

Einstieg als Admin oder Stammleiter: **Ranger-Bibliothek → Thema → Visuell bearbeiten**. Alternativ in **Ranger-Bibliothek verwalten → Visueller Seiteneditor**. Zusätzliche Editorrechte für gewöhnliche Leiter lassen sich durch Admin im Verwaltungsbereich für den aktuellen Stamm erteilen und entziehen.

Die Oberfläche besitzt Seitenminiaturen, eine direkt bearbeitbare Bühne, eine Eigenschaftenleiste und Bedienleisten. Vorhandene Themen werden beim Öffnen als separate Arbeitsgrundlage aus den bestehenden Originaltexten und Grafiken aufgebaut. Erst eine tatsächliche Bearbeitung erzeugt einen gespeicherten Entwurf.

- Texte direkt anklicken und bearbeiten; Schriftgröße, Farbe, Fett/Kursiv, Ausrichtung, Zeilenabstand und Listen einstellen.
- Texte, Bilder, Symbole, Linien, Flächen und Infopunkte hinzufügen, auswählen, verschieben, skalieren und drehen. Text verschiebt man am Griff; dadurch bleibt normales Markieren und Schreiben möglich.
- Exakte Position, Größe, Deckkraft und Bildausschnitt einstellen; Ebenen nach vorne/hinten legen, an Seitenkanten oder mittig ausrichten. Raster und Einrasten sind schaltbar, Hilfslinien unterstützen die Anordnung.
- Mehrfachauswahl mit Umschalt-Klick; gruppieren, Gruppierung lösen, duplizieren sowie Kopieren/Einfügen. Entf entfernt ausgewählte, nicht gesperrte Objekte. Pfeiltasten verschieben um 1 Pixel, Umschalt-Pfeil um 10 Pixel. Strg/Cmd-Z, Strg/Cmd-Umschalt-Z und Strg/Cmd-Y unterstützen Undo/Redo; Strg/Cmd-S speichert den Entwurf.
- Bilder aus den Originalassets oder per PNG/JPG/WebP/SVG-Upload einsetzen und austauschen. Größere Rasterbilder werden auf höchstens 2048 Pixel Kantenlänge optimiert. SVG wird auf aktive/externe Inhalte geprüft. Uploadgrenze: 8 MiB.
- Seiten und Abschnitte anlegen, umbenennen, duplizieren, umsortieren und nach Bestätigung archivieren. Archivierte Seiten bleiben wiederherstellbar. Eine Seite kann unabhängig vom Modul für Ranger ausgeblendet werden.
- Autosave zeigt Speicherstand und Fehler an. **Vorschau als Ranger** ändert keine Veröffentlichung. **Veröffentlichen** ist eine eigene bestätigte Aktion; die bestehende Modulfreigabe bleibt zusätzlich erforderlich.
- **Versionen / Vergleichen** zeigt Autor, Zeitpunkt, veröffentlichte Fassungen und Änderungen an Text, Bild, Position und Größe. Wiederherstellen erzeugt zunächst einen Entwurf. Undo/Redo und Verwerfen verändern keine bereits veröffentlichte Version.
- Eine veraltete Revision wird abgewiesen. Der eigene Stand bleibt bei einem Konflikt im Editor erhalten; es erfolgt kein stilles Überschreiben. Rollenentzug beendet die Bearbeitung, gespeicherte Fassungen bleiben erhalten.

Veröffentlichte Seiten verwenden auf großen Bildschirmen die entworfene Bühne. Auf iPhone-/iPad-Breiten werden die Inhalte in lesbarer Reihenfolge umgebrochen; Text bleibt vollständig sichtbar. Infopunkte öffnen ihre Erklärung in einem eigenen Dialog.

### Originale und Bilder

Die 16 Originalmodule, 76 Erklärungspunkte und 43 Originalgrafiken aus **Logbuch Ausgabe(4), gedruckte Seiten 6–27**, bleiben unverändert. Es wurden keine anderen Logbuchbilder und keine erfundenen Ersatzillustrationen in diese Grundmodule eingefügt. Die Originalansicht bleibt neben einer veröffentlichten visuellen Fassung erreichbar. Gedruckte Schrift in einem Bild bleibt Bildinhalt; der Editor stellt sie nicht als frei editierbare Bildpixel dar.

Originalbilder bleiben Referenzen auf dieselben unveränderten Dateien. Eigene Bilder liegen im Browser als Blob in IndexedDB, beim Serverbetrieb als Datei im konfigurierten Bildordner. In `rhv9` liegen nur Metadaten und Kennungen, keine zusätzlichen Bild-Base64-Blöcke. Ein Browserbackup mit Uploads wird deshalb als ZIP mit JSON, separaten Bilddateien und Prüfsummen exportiert; alte JSON-Backups ohne zusätzliche Bilddateien bleiben importierbar.

## KI-Assistenz

**Mit KI bearbeiten** öffnet die Assistenz für einen ausgewählten Text oder die Anordnung einer Seite. Ein Vorschlag verändert zunächst nichts. Übernehmen ist ein normaler Undo-fähiger Entwurfsschritt; erneut versuchen und verwerfen sind getrennte Aktionen. Es gibt keine Veröffentlichung durch die KI und keine automatische Anfrage bei jedem Tastendruck.

Die Serveranbindung unterstützt OpenAI Responses für Text- und begrenzte Layoutvorschläge. Sie überträgt ausschließlich den ausgewählten redaktionellen Text, den Bearbeitungswunsch und gegebenenfalls Elementpositionen. Die Mitgliederdatei, Anwesenheiten, Verwaltungsnotizen und API-Zugangsschlüssel werden nicht an den Anbieter übergeben.

**Der ausgelieferte Stand besitzt keinen eingerichteten KI-Zugang.** Er zeigt „KI noch nicht konfiguriert · Einrichtung erforderlich“. Die manuelle Bearbeitung ist vollständig nutzbar. Schlüssel werden ausschließlich serverseitig eingerichtet; im Browser gibt es dafür kein Eingabefeld.

## Mitgliederstatus

Ranger-Team und Leiterteam besitzen **Aktiv | Pausiert | Ausgetreten | Alle** mit dynamischen Zählern und Suche. Standard ist Aktiv. Personenprofile zeigen Status, Verlauf und historische Anwesenheit. Admin und die eigene Stammleitung können über **Status ändern** Zielstatus, Gültigkeitsdatum, ein voraussichtliches Pausenende und eine optionale neutrale Verwaltungsnotiz erfassen. Eine Diagnose ist weder erforderlich noch vorgesehen. Die Auswirkung auf offene Prüfungen und Zuständigkeiten wird vor der Bestätigung genannt.

Status und Rolle sind getrennt. Ein Leiter bleibt Leiter, wenn seine Mitgliedschaft pausiert. Jeder Status gilt ausschließlich für die Mitgliedschaft im jeweiligen Stamm. Änderungen enthalten Bearbeiter, Zeit, alten/neuen Status, Gültigkeitsdatum, Stamm und Revision. Der zentrale Dienst führt zusätzlich ein append-only Statusjournal. Zeitgleiche veraltete Änderungen werden abgewiesen.

- Nur aktuell aktive Ranger zählen in aktiven Listen, aktueller Rangliste, Geburtstagsübersicht und Ranger-Durchschnitt. Die Zahl ist nicht auf acht Personen festgelegt.
- Erwartete Teilnehmer werden anhand ihres Status am Datum des Treffens ermittelt. Persönliche Quoten berücksichtigen nur erfasste, relevante Treffen in aktiven Zeiträumen. Pausen und Zeit nach Austritt zählen nicht in den Nenner; gespeicherte Anwesenheitsdatensätze werden nicht gelöscht.
- Bei fehlender geeigneter Grundlage erscheint **Keine Daten**. Aktuelle Durchschnittsquoten mitteln ausschließlich aktive Ranger mit vorhandenen Daten.
- Pausierte Leiter werden für neue Zuständigkeiten nicht angeboten. Bestehende Zuordnungen bleiben erhalten und werden zur Neuverteilung gekennzeichnet. Offene Aufgaben werden nicht gelöscht. Bestehende inaktive Zuordnungen bleiben beim Öffnen einer Planung sichtbar.
- Pausierte Ranger können keine neuen Prüfungen anmelden. Bestehende offene Anmeldungen bleiben mit Prüfhinweis erhalten. Punkte, Kapitel- und Wachstumsfortschritt werden nicht zurückgesetzt und bleiben im berechtigten Archivprofil abrufbar.
- Pausierte Profile haben eingeschränkten Lesezugang. Bei Austritt wird der zentrale Zugriff auch mit einem vorher gültigen persönlichen Token abgewiesen; die App schließt die Sitzung. Reaktivierung verwendet dasselbe vorhandene Profil.
- Das Feld **Voraussichtlich bis** ist eine Planungshilfe. Eine Pause endet durch einen bestätigten Wechsel auf Aktiv. Es wird keine unbestätigte Rückkehr unterstellt.

Personen ohne neue Statusdaten bleiben entsprechend ihren bisherigen Kennzeichen aktiv, pausiert oder ausgetreten. Vorhandene `archivedRangers`/`archivedLeaders` werden ohne Löschen des alten Archivs und ohne Dubletten für die Statusverwaltung übernommen. Unbekannte historische Statuszeiträume werden nicht erfunden; die ursprünglichen Teilnahmedatensätze bleiben erhalten.

## Datenmodell und Dateien

Die vorhandene Knowledge-/Punkte-Datenbank bleibt bestehen. Ergänzungen:

- Pro Person: `membership` mit ursprünglicher Einstufung, datierten Ereignissen und Revision, innerhalb des bestehenden Stammdatensatzes.
- Redaktionelle Editionsdaten: `knowledge.visualPages` lokal und `shared.knowledgeCatalog.visualPages` global, mit Seiten, Elementen, Entwurf, Veröffentlichung, Historie, Metadaten und Berechtigungen.
- Bilder: IndexedDB `${storageKey}-media-v35` oder serverseitiger Dateispeicher; neue Metadatentabelle `knowledge_visual_assets`.
- Statusprotokoll: serverseitige Tabelle `membership_events` mit Schutz vor UPDATE und DELETE.

Wesentliche neue Dateien: `rangerhub-visual-editor-v35.js`, `rangerhub-visual-views-v35.js`, `rangerhub-visual-media-v35.js`, `rangerhub-visual-model-v35.js`, `rangerhub-membership-model-v35.js`, `rangerhub-membership-v35.js`, `rangerhub-backup-v35.js`, `rangerhub-v35.css` und `backend/editor-v35.mjs`. Versionskopien der vorhandenen Planungs-, Anwesenheits-, Navigations-, Dashboard- und Knowledge-Schichten integrieren dieselben Statusregeln; sie ersetzen keine andere App.

## Auslieferung und Betrieb

Privat: `RangerHub_Webapp_V35_Kompakt.html` mit `assets/` und `vendor/`, weiterhin unter 25 MB. Die optionale Standalone-Fassung bettet die 43 Originalgrafiken byteidentisch ein und ist größer als 25 MB. Alle 17 alten eingebetteten Anlagen einschließlich 12 PDF-Verweise bleiben erhalten.

Die öffentliche Demo ist browserlokal. **Zentrale Speicherung und Geräteabgleich sind implementiert und mit unabhängigen Browserprofilen getestet, aber im ausgelieferten Standard nicht produktiv konfiguriert.** Dazu ist der vorhandene gesicherte Node-Dienst mit persönlicher Anmeldung einzurichten. Details und nötige Umgebungsvariablen: [V35-BACKEND.md](V35-BACKEND.md). Es wurde kein kostenpflichtiger Dienst eingerichtet und kein KI-Schlüssel hinterlegt.

Start lokal: `python -m http.server 8000`, dann `index.html`. Vollständige Prüfung: `python tools/check_v35.py`. Buildwerkzeuge: `tools/build_v35.py` und `tools/build_demo_v35.py`. Der private `main` bleibt bis zur Abnahme unverändert; die private Umsetzung liegt im Feature-Branch.
