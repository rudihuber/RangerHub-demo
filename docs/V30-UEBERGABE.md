# RangerHub – Übergabe der Fachwissen-Erweiterung

## Ausgangspunkt und Sicherung

Weiterentwicklung des neuesten vorhandenen V29-Standes, kein Neubau. Vor jeder Quelländerung wurde der Git-Sicherungspunkt `backup/before-v30-fachwissen-v2` erstellt. Die vollständigen, unveränderten Vorstände beider Repositories liegen zusätzlich im Lieferverzeichnis `backup/private` und `backup/demo`. `docs/v30-baseline.json` dokumentiert Commit, Dateigrößen und SHA-256 aller zuvor verfolgten Dateien. Die V29-HTML-Dateien bleiben im Repository erhalten.

Der private Hauptbranch `main` bleibt unverändert. Die private Umsetzung liegt auf `feature/v30-fachwissen-v2` zur Überprüfung. Nur die öffentliche Demo wird gemäß bestehender Freigabe veröffentlicht. Es werden keine privaten HTML-Dateien, Personenexporte oder Zugangsdaten dorthin kopiert.

## Karten und Navigation

Die vorhandene Oberwelt und ihre Zuordnung bleiben erhalten. Fünf neue SVG-Unterwelten: Waldcamp (`wildnis`, 6 Themen), Entdeckerlandschaft (`entdecker`, 6), Rettungsbasis (`rettung`, 5), Handwerkerdorf (`werkstatt`, 10), Ranger-Dorf (`gemeinschaft`, 9). Alle 36 Originalthemen besitzen genau einen Themenort; alle 253 Hauptaufgaben, 302 Quellabsätze und 250 Punktnennungen bleiben im Quellkatalog enthalten. Vier ungeklärte Quellwerte werden weiterhin nicht geraten.

Reihenfolge: Oberwelt → Unterwelt → Ort/Thema → Aufgabenliste → gewählte Aufgabe → bestätigte Anmeldung. Nur eine native Detailansicht gleichzeitig. Hash-URLs, Browser-Zurück, Escape, Touch, Fokus und Neuladen werden unterstützt. Neue Orte/Regionen sind über den Editor möglich. Die Arena enthält ausschließlich die Rangliste; keine Duelle oder Einreichungen.

Das Ranger-Dashboard zeigt die vorhandene persönliche Wachstumskarte genau einmal neben der neuen Fachwissen-Vorschau (ab 1200 px). Darunterliegende bestehende Dashboardinformationen bleiben erhalten. Mobil stehen die Karten untereinander. Leiter erhalten die vorhandene Wachstumspfad-Illustration mit Stufeneinstiegen, keine persönliche Ranger-Expeditionskarte. Beide Rollen sehen passende Fachwissen-Statistiken, Rangliste und Prüfungsinformationen. Auch das vorhandene Rangerprofil zeigt die daraus abgeleiteten Punkte, die Platzierung und bestandene Aufgaben.

## Daten und Migration

Privat bleibt der LocalStorage-Key `rhv9`, in der öffentlichen Demo der bestehende getrennte Key `rhv9-demo`. Keine Rücksetzung, keine neuen Beispielpersonen, keine Änderung an Ranger-, Leiter-, Kalender- oder Wachstumspfaddaten. Die Fachwissen-Migration läuft idempotent von `knowledge.schema:1` nach `2`.

- `ledger`: bestehendes Journal unverändert übernommen; weitere Gutschriften/Stornos nur angehängt.
- `exams`: persönliche Prüfungen mit tatsächlicher `meetingId`, Stamm/Ranger/Aufgaben-ID, Status, gebuchtem Aufgaben-/Punktesnapshot, Prüfer, Zeit und Verlauf.
- `content`: lokale Ergänzungen und Overrides über dem unveränderten Quellkatalog.
- `shared.knowledgeCatalog`: globale Ergänzungen und Overrides.
- `permissions`: separates lokales Redaktionsrecht `canEditLocalKnowledge`.
- `legacy`: frühere Duell-, Nachweis-, Freigabe- und Einreichungsdaten verlustfrei geschlossen archiviert. Keine neue Sammlung digitaler Nachweise; keine Alt-Nachweise in aktiven API-Antworten oder UI.

Alte Quellmodule bleiben als Vorversionsbestand erhalten; die tatsächliche V30-HTML lädt/enthält ausschließlich die neuen Workflowmodule. Der vorhandene Katalog und die bestehende Oberwelt-SVG werden wiederverwendet. Alle übrigen ursprünglichen Inline-Skripte sowie alle 17 eingebetteten Asset-Referenzen inklusive 12 PDF-Referenzen bleiben identisch. Die öffentliche Demo enthält weiterhin keine PDF-Dateien und ausschließlich ihre bisherigen fiktiven Personen.

## Prüfungen und Punkte

Es zählen höchstens drei unterschiedliche Aufgaben pro Ranger und konkretem Treffen, über Kategorien hinweg. Bestanden/Nicht bestanden/Nicht angetreten bleiben für dieses Treffen mitgezählt. Zurückziehen ist nur vor Beginn und Bewertung möglich. Ein Wiederholungsversuch ist erst bei einem späteren Treffen erlaubt. Ausgefallene Termine löschen nichts; Ersatztermine werden bewusst bestätigt und erneut auf Kapazität geprüft.

Anmeldung und Rangliste erzeugen keine Punkte. Bestanden bringt genau eine aktive Gutschrift pro Stamm/Ranger/stabiler Aufgaben-ID; Nicht bestanden und Nicht angetreten bringen keine Punkte. Gebuchte Fassungen und bereits verdiente Punkte ändern sich nicht durch spätere Text-/Punktänderungen oder Archivieren. Ungeklärte Punkte blockieren eine Gutschrift bis zur begründeten Quellenklärung. Fitness-Sportabzeichen nutzt nur seine importierte 8-Punkte-Variante.

Leiterzentrale: Treffen, Ranger, Thema, Status, Gruppierung und Sortierung; offene Prüfungen nach Ranger; Originalanforderungen gezielt aufklappbar; große Ergebnisbuttons mit Bestätigung. Aus der offenen Liste entfernte Ergebnisse bleiben im Verlauf. Berichtigung nur Stammleitung/Admin mit Grund und Stornobuchung; keine negativen Gesamtpunkte, keine Doppelgutschrift.

## Rechte und Redaktion

Serverseitige Rolle aus vorhandener Mitgliedschaft, niemals aus Browserfeldern. Ranger nur eigene Anmeldung/Verlauf, keine Redaktion/Bewertung. Leiter nur eigener Stamm und zugeordnete Teams; lokale Redaktion standardmäßig erlaubt und durch Stammleitung entziehbar. Stammleiter volle lokale Rechte und Ergebniskorrektur; Admin globale Basis und autorisierter Stammwechsel.

Editor für Kategorien, Regionen/Unterwelten, Gebäude/Orte, Themen und Aufgaben: Anlegen, Namen, Beschreibung, Gestaltung/Symbole, Position, Reihenfolge, Sichtbarkeit, Aufgabentext/Unterpunkte, gültige Punkte, Themen-/Ortswechsel, Archivierung und Wiederherstellung. Kategorien mit enthaltenen Aufgaben benötigen ausdrückliche Archivbestätigung. Lokale Overrides lassen sich auf globale Standards zurücksetzen. Unveränderte Originaltexte, Originalpunkte und Quellen bleiben separat erhalten. Revisionen verhindern unbemerkte gleichzeitige Überschreibungen; Änderungen sind protokolliert. Ungespeicherte Editoränderungen werden vor Verlassen abgefragt.

## Dateien und Verpackung

Neue Module: `rangerhub-knowledge-catalog-v30.js`, `rangerhub-knowledge-model-v30.js`, `rangerhub-knowledge-transport-v30.js`, `rangerhub-knowledge-subworlds-v30.js`, `rangerhub-knowledge-exams-v30.js`, `rangerhub-knowledge-editor-v30.js`, `rangerhub-knowledge-v30.js`, `rangerhub-knowledge-v30.css`.

Geändert: tatsächliche neue V30-HTML und `index.html`, `backend/knowledge-server.mjs`, aktueller Browser-Teststart, README und Dokumentation. Neue V30-Server-, Browser- und Verpackungstests. `tools/build_v30.py` verpackt die private HTML verlustfrei im bestehenden Gzip/ASCII85-Verfahren, mit `Z_FILTERED` unter 25 MB. Der Demo-Builder verwendet externe Module. Vorversionen bleiben unverändert; `assets/` und `vendor/` gehören weiterhin zur vollständigen Lieferung.

## Backend und nächste Runde

Die zentrale Node-24-/SQLite-Anbindung wurde erweitert und tatsächlich über HTTP sowie mit drei getrennten Browserprofilen geprüft. Die öffentliche Vorschau benutzt weiterhin lokale Daten. Kein produktiver Host und keine persönlichen Online-Credentials wurden eingerichtet. Details: [Backend-Einrichtung](V30-BACKEND.md). Chat und sonstige Datenbereiche behalten ihren bisherigen lokalen Status; diese Erweiterung gibt ihnen keine angebliche gemeinsame Cloud-Speicherung.

Aktueller Testumfang, Grenzen und Browserbilder: [Testbericht](V30-TESTBERICHT.md), [Screenshots](screenshots/v30/). Vor weiteren Änderungen Baseline/Backup erneuern, V30-Regelcode für Browser und Server gemeinsam ändern und `tools/check_v30.py` ausführen. Die älteren versionierten Prüfungen dokumentieren frühere Workflows und ersetzen keine V30-Abnahme.
