# RangerHub – Fachwissen (Entwicklungsstand V29)

## Ausgangspunkt und Sicherung

Die Erweiterung baut auf der funktionierenden V28 auf, nicht auf dem älteren
privaten `main`. Vor Änderungen wurden sämtliche versionierten Dateien in
eine vollständige Sicherung kopiert; Dateigrößen und SHA-256 stehen in
`v29-baseline.json`. Git-Sicherungspunkt: `backup/before-v29-fachwissen`.
Prüfbranch: `feature/v29-fachwissen`. Der private Hauptbranch wird vor Abnahme
nicht geändert. V25 bis V28, Originalbilder, PDFs und bisherige Module bleiben
unverändert erhalten.

## Inhalte und Quellenprüfung

`data/RangerHub_Fachwissen_Quellkatalog.json` ist die unveränderte hochgeladene
Quelle, SHA-256 `c3ed7f0f4b5f20387b2b536fa7a59a4cdcb756e3ad42ac97c1e7a62190266cc0`.
`tools/prepare_knowledge.py` erstellt nachvollziehbar normalisierte Daten:

- 3 offizielle Quellkategorien mit jeweils 12 Themen, insgesamt 36 Themen.
- 253 Hauptaufgaben; sämtliche 302 Quellabsätze bleiben wortgetreu erhalten.
- 250 explizite Punktangaben sind einzeln im Audit zugeordnet. Diese Zahl wird
  ausdrücklich nicht als Aufgabenanzahl oder maximal erreichbare Punktzahl verwendet.
- Gäste-Unterfragen, Kanu-Begriffe und Strickanweisungen sind Unterpunkte,
  keine zusätzlich bepunkteten Aufgaben. Der Foto-Hinweis ist eine Themennotiz.
- Jede der 36 Themenzuordnungen gehört genau einer von fünf Lernregionen an.
  Die sechste Kartenregion ist die Arena, keine zusätzliche Quellkategorie.

Vier Quellenfälle bleiben sichtbar offen: Gäste Aufgabe 4 (Absatz 62),
Bürgerkunde Aufgabe 9 (78), Geistlicher Dienst Aufgabe 4 (113) und Fitness
(275–286). Bei Fitness stehen die 8 Punkte ausdrücklich nur bei der Alternative
Sportabzeichen Silber. Die Trainingsziele erhalten keine geratenen Punkte.
Ein passender Sportabzeichen-Nachweis kann einmal mit den 8 Originalpunkten
bestätigt werden; der alternative Trainingsweg bleibt bis zur Quellenklärung offen.
Die Leitung kann offene Quellwerte nur mit Fundstelle und Begründung klären;
der Originalkatalog wird dabei nicht verändert. Bereits vorhandene Punktwerte
sind nicht bearbeitbar. Jede Gutschrift speichert ihren damaligen Quellwert.

Der vollständige Absatzabgleich und alle Punktverweise stehen in
`v29-catalog-audit.json`. Die Original-DOCX und die genannten vollständigen
Referenz-PDFs lagen nicht separat vor; ein unabhängiger Abgleich mit diesen
Dateien wird nicht behauptet. Bestehende eingebettete PDFs sind unverändert.
Es werden keine Anforderungen des anderen Royal-Rangers-Systems übernommen.

## Bedienung

Fachwissen ist ein neuer Hauptreiter mit Kompasssymbol für alle vorhandenen
Rollen. Die neue Karte verwendet eigens erstellte SVG-Landschaften, Pfade,
Lager, Fluss, Berge und Werkstätten. Mobile hat eine eigenständige vertikale
Komposition. Keine neuen großen Bilder oder UI-Frameworks.

Beim Einstieg: Karte, persönlicher Stand, Rangliste und Challenge-Hinweise.
Erst ein Klick öffnet Region → Thema → Aufgabenliste → Originalaufgabe.
Genau ein natives Dialogfenster bleibt offen: rechts auf Desktop, als Sheet
auf Smartphones. Zurück, Escape und Klick auf den Hintergrund gehen eine
Ebene zurück; Schließen kehrt direkt zur Karte zurück. Fokus und Touchflächen
werden berücksichtigt. Die Karte nutzt keine dauernden Animationen.

Aufgaben lassen sich beginnen, freiwillig mit Text oder als vereinbarte
mündliche/praktische Vorführung einreichen und durch Leiter bestätigen oder
zur Überarbeitung zurückgeben. Leitung kann eine beobachtete Vorführung
dokumentieren. Sensible Datei-/Foto-Uploads werden nicht eingeführt; die
optionalen Nachweise funktionieren als persönliche Text-/Vorführungsnachweise.
Andere Ranger erhalten weder den Nachweistext noch die vollständige Historie.

Leiter wählen im Aufgabendetail den Ranger. Sie können individuelle Eignung
und Aufsicht mit Begründung für 30 Tage freigeben, Aufgaben ausblenden und
Quellenfehler bearbeiten. Praxis-Sicherheitsmerkmale sind konservative
Vorprüfungen, keine fachliche Sicherheitszertifizierung. Die tatsächliche
Eignung und Aufsicht prüft die verantwortliche Leitung.

## Punkte, Rangliste und Challenges

Nur bestätigte Fachwissenaufgaben schreiben offizielle Punkte gut. Wachstumspfad,
Quiz, Klicks, Serien und Challenge-Siege werden nicht addiert. Eine bestätigte
Aufgabe zählt pro Ranger einmal. Widerruf benötigt eine Begründung und hängt
eine genau passende Rückbuchung an. Alte Gutschriften werden nicht editiert.
Nach einer erneuten gültigen Prüfung kann die Aufgabe wieder einmal zählen.

Dashboard und Rangliste verwenden dieselben Buchungen: Gesamt, Woche, beim
Leiter auch Monat, Quellkategorie und vorhandene Teams. Ranggleichheit bei
gleichen Punkten; ohne bestätigte Punkte noch keine Rangplatzierung.
Gruppenansichten verwenden Alias oder Vorname plus Nachnamensinitial.
Top-Plätze, eigene Position auch außerhalb des Podiums, Aufsteiger der Woche
und wartende Freigaben sind direkt erreichbar. Alle aktiven, berechtigten Ranger
des aktiven Stamms werden einbezogen, keine fremden Stämme.

Das Dashboard zeigt Fachwissen prominent vor dem bisherigen Wachstumspfad.
Der weiterhin vollständige Wachstumspfad wird dadurch weiter unten auf der
Seite erreicht. Keine Funktion und keine bestehende Station wird entfernt;
die Prüfungen kontrollieren die Karte an ihrer neuen Scrollposition.
Auf Smartphones bleibt der Dashboard-Einstieg bei der neuen Punkteübersicht.
Der Standortknopf und die ausdrückliche Rückkehr zur Wachstumskarte positionieren
weiterhin den persönlichen Wanderstand. Sonstige Dashboard-Aktualisierungen
bewahren die aktuelle Scrollposition, statt unbeabsichtigt zur Karte zu springen.

Challenges benötigen eine Originalaufgabe, zwei berechtigte Ranger desselben
Stamms, persönliche Leiterfreigaben, eine Frist und Zustimmung des Empfängers.
Bereits bestandene Aufgaben sind ausgeschlossen. Maximal drei eigene offene
Einladungen, höchstens fünf offene Beteiligungen beim Empfänger und keine
doppelte aktive Einladung zum selben Paar und derselben Aufgabe.
Ablehnen und Abbrechen haben keine Punktefolgen.

Die frühere, später bestätigte Einreichung gewinnt; bis 60 Sekunden Unterschied
gilt Unentschieden. Einreichungen müssen nach Annahme und innerhalb der Frist
erfolgen. Nach Fristablauf prüft die Leitung noch rechtzeitig eingereichte
Nachweise vor dem Abschluss. Widerruf einer Bestätigung öffnet ein betroffenes
Ergebnis wieder. Keine Bonus-Fachwissenpunkte für Siege.

## Architektur und Daten

- `rangerhub-knowledge-catalog.js`: generierte, stammübergreifende Quellinhalte.
- `rangerhub-knowledge-model.js`: zentrale Punkt-, Rollen-, Ranglisten- und
  Challenge-Regeln. Derselbe Code läuft im Browser und im optionalen Server.
- `rangerhub-knowledge-transport.js`: lokaler und HTTP-Zugriff; bestehende
  Identitäten über `messageActor()` / `v24Principal()`, keine neuen App-Rollen.
- `rangerhub-knowledge-map.js`: eigene responsive Vektorkompositionen.
- `rangerhub-knowledge.js`, `.css`: Navigation, Dashboard, Ansichten und Dialoge.
- `backend/`: optionaler Node-24-/SQLite-Dienst mit persönlicher Authentifizierung,
  vorhandener Mitgliedschaft, atomaren Befehlen und unveränderbarem Ledger.

Privat bleibt der LocalStorage-Key `rhv9`, Demo behält `rhv9-demo`. Kein Reset,
kein Umbenennen, kein Ersetzen durch Beispieldaten. Die bestehende Store-Schema-
Version bleibt kompatibel. Neu ist ausschließlich `stamms[id].knowledge`:
`schema:1`, `progress`, `ledger`, `challenges`, `policies`, `resolutions`, `audit`.
Der Katalog wird nicht je Ranger dupliziert. Vor der ersten Änderung wird nur
gelesen; eine reine Ansicht schreibt keine Fachwissen-Daten.

Lokale Befehle lesen den letzten vollständigen Store und ändern nur Fachwissen
des aktiven Stamms. Web Locks serialisieren mehrere Tabs, wenn verfügbar;
Storage-Ereignisse aktualisieren die Ansicht. Bestehendes Speichern vereinigt
neue Fachwissen-Daten anderer Tabs. Speicherfehler lassen die alten Daten stehen.
Unbekannte Datenformate werden nicht still ersetzt.

Die lokale Vorschau ist keine sichere Online-Authentifizierung: Browserdaten
und Testprofile sind technisch durch den Geräteinhaber veränderbar. Deshalb
steht überall bei Punkten und Ranglisten **Demo / nur lokale Daten**. Ein
produktiver, geräteübergreifender Betrieb benötigt den zentralen Dienst und
persönliche Zugänge; Details und konkret fehlende Konfiguration: `V29-BACKEND.md`.

## Build und Fortsetzung

Privat: `python3 tools/prepare_knowledge.py`, anschließend
`python3 tools/build_v29.py`. V28 ist unveränderter Input. Das bestehende
Gzip-/ASCII85-Format bleibt erhalten; Gzip nutzt zlib Level 9 mit memLevel 9,
um die zusätzliche Funktion ohne Datenreduktion unter 25 MB zu halten.
Rundlauf, alle 17 Assetreferenzen einschließlich 12 PDF-Referenzen und alle alten
Inline-Skripte werden geprüft. V29 enthält die neuen Module tatsächlich inline.

Demo: `python3 tools/build_demo_v29.py`. `index.html` und der benannte neue
V29-Einstieg werden erstellt. Die alten benannten Einstiege bleiben unverändert.
Die Demo enthält weiterhin nur ihre fiktiven Personen und keine Original-PDFs.

Zum Start alle mitgelieferten Dateien gemeinsam bereitstellen oder
`python3 -m http.server 8000` ausführen und `index.html` öffnen. Dieselbe Origin
behält die Browserdaten. Bei Adresswechsel vorher den vorhandenen Export nutzen.
Für die nächste Runde V30 erstellen. Ältere geöffnete Tabs vor produktiver
Weiterarbeit auf den aktuellen Stand neu laden. Private Änderung erst nach
Prüfung mergen; öffentliche Demo bleibt getrennt.
