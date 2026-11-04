# RangerHub V27 – Übergabe

## Ausgangspunkt und Sicherung

V27 erweitert die vorhandene V26. Kein Neubau und kein Zurücksetzen von Daten.
Die vollständigen Ausgangsdateien wurden vor Änderungen kopiert und in
`docs/v27-baseline.json` mit SHA-256 erfasst. Git-Sicherungspunkt:
`backup/before-v27-stammlife`. Entwicklungsbranch: `feature/v27-stammlife`.
V25 und V26 bleiben unverändert. Der private Hauptbranch wird vor der Prüfung
nicht übernommen.

## Neue Funktionen

- Aktuelles Wetter ganz oben im Dashboard für den Stammort: Cloppenburg bzw.
  Meppen. Temperatur, gefühlte Temperatur, Windrichtung/-geschwindigkeit,
  Böen, Niederschlag, Luftfeuchte, Sonnenzeiten und UV-Index.
- Treffenwetter verwendet den Ort und gegebenenfalls die PLZ aus `meeting.place`.
  Beispielsweise wird „Jugendwiese Cloppenburg“ zu Cloppenburg. An die
  Geocodierung gehen keine vollständigen Treffpunkt-/Straßenangaben. Allgemeine
  Treffpunkte ohne Stadt verwenden den Stammort. Prognosen außerhalb von
  heute bis 15 Tage bleiben ausdrücklich als nicht verfügbar gekennzeichnet.
- Geburtstage sind Abschnitt 04 und stehen zuletzt. Der Abstand zur Seitenleiste
  ist kleiner. Die mobile Überschrift läuft einschließlich Punkt nicht über.
- In der Demo sitzt Meister einschließlich Schlaufenbezeichnung sicher im
  braunen Bildbereich. Die vier doppelten Begriffe unter dem Beobachterbild
  entfallen. „Weitere Beobachter-Inhalte“ erscheint nur für Leiter, oben vor
  dem Bild. Die eingebetteten Originalbilder bleiben erhalten.
- Ungespeicherte Treffenplanung: Schließen, Hintergrundklick, Escape, Navigation
  und Stammwechsel bieten Speichern / Verwerfen / Weiter bearbeiten. Ungültige
  Pflichtfelder verhindern das Speichern. Entwürfe und Fotos bleiben beim
  Wechsel in den bisherigen Rezepteditor erhalten. Beim Verlassen des Tabs
  wird die native Browserwarnung angefordert.
- Anwesenheit als Häkchenliste, ohne Dropdowns. Erst „Anwesenheit speichern“
  erfasst die Liste. Abmeldungen und Abwesenheitszeiträume stehen beim Namen;
  anwesende Personen werden ANWESEND, übrige abgemeldete Personen ENTSCHULDIGT,
  übrige Personen ABWESEND. Öffnen allein verändert keine Anwesenheit.
- Neue Bestätigungen zeigen Datum und Leiter in kleiner, hellgrauer Schrift.
  Es werden keine Daten für alte Bestätigungen erfunden.
- Neue Knotenabschlüsse benötigen zwei Bestätigungen aus Rangertreffen an
  unterschiedlichen Tagen. Erst beide zusammen setzen den bisherigen
  Erledigungswert. Alte bereits bestätigte Knoten bleiben angerechnet. Leiter
  können eine alte Bestätigung ausdrücklich zurücknehmen und neu nachweisen.
- Bis zu vier Fotos je Treffen: Vorschau, Entfernen, explizites Speichern und
  Rückblick als Fotostrecke im Dashboard. Touch, Wischen, Pfeiltasten und
  Zurück/Weiter; kein erzwungenes automatisches Abspielen.
- Ranger können sich direkt im Dashboard vom nächsten Treffen abmelden und
  die Absage zurücknehmen. Ihre große Anwesenheitsanzeige verwendet nur vom
  Leiterteam erfasste vergangene/heutige Treffen. Texte motivieren je nach Quote;
  ungepflegte Anwesenheit erzeugt keine erfundene Quote.
- 55 Aktionsvorlagen und 17 Rezepte aus dem Anhang sind additiv in beiden
  Stämmen verfügbar. Vorhandene Einträge und IDs werden nicht ersetzt.
  Leiter können Aktionen anlegen/bearbeiten; Löschen bleibt Admin/Stammleiter
  vorbehalten. Geplante Treffen behalten ihre Aktionsinhalte nach dem Löschen.

## Datenmodell und Rechte

Es bleibt beim bisherigen privaten `rhv9` bzw. getrennten Demo-Speicher
`rhv9-demo`. Keine zweite Fortschrittsdatenbank und kein neues Rollensystem.
Die bestehenden booleschen Werte in `observerProgress`, `observerBonus` und
`stageProgress` bleiben die Grundlage der Zähler und der Expeditionskarte.
Die unveränderte 80-%-/100-%-Regel zählt weiterhin Bonus A/B/C/Reflexion und
behandelt leere Stufen nicht als abgeschlossen.

Additive Felder innerhalb des jeweiligen Stamms:

- `taskConfirmations[personId][stage][taskId]`: Bestätigungszeit, Leiter-ID,
  damaliger Leitername und Heimatstamm; bei Knoten zusätzlich zwei
  `demonstrations` mit Treffen-ID und Treffendatum. Bonusnachweise stehen
  unter der Stufe `Bonus`. Vorhandene Fortschrittswerte werden nicht migriert.
- `meetings[].photos`: kleine JPEG-Daten-URLs samt ID und Erstellungszeit.
  Bilddateien werden lokal auf maximal 1200 Pixel längste Seite und
  höchstens 100.000 Zeichen pro Daten-URL reduziert. Die Vorlage/Originaldatei
  auf dem Gerät wird nicht geändert; die App erhält keine Originaldatei.
- `v27LibraryImported`: einmaliger additiver Vorlagenimport je Stamm.
- `v27ActionRemovals`: explizite Löschungen verhindern, dass der alte Loader
  eine gelöschte Vorlage aus einem historischen Treffen erneut erzeugt.
  Gleichnamige vorhandene Duplikate bleiben erhalten. Bewusstes Neuanlegen
  derselben Aktion hebt die entsprechende Löschmarkierung auf.

Ranger können keine Aufgaben oder Anwesenheiten bestätigen und keine Bibliotheken
bearbeiten. Sie sehen weiterhin nur ihre eigenen persönlichen Fortschritte.
Der Admin kann weiterhin den Stamm wechseln; alle persönlichen Bestätigungen,
Fotos, Kalender- und Anwesenheitsdaten bleiben beim aktiven Stamm.

## Dateien, Build und Import

Die neuen Module sind `rangerhub-v27.js`, `rangerhub-v27.css` und
`rangerhub-library-v27.js`. Bestehende Module bleiben unverändert.
Der Katalog wird mit `tools/prepare_library_v27.py INPUT.json` aus einer
expliziten Feldfreigabe erzeugt. Historische Events, Zuordnungen zu Personen,
Quelltermine, Quiz und zusätzliche Eigenschaften aus dem Anhang werden nicht
als neue Termine/Benutzer importiert. Herkunft und Prüfsumme stehen in
`docs/v27-library-source.json`. Die vollständige Quelldatei wird nicht in der
öffentlichen Demo veröffentlicht.

Privater Build: `python3 tools/build_v27.py`. V26 ist schreibgeschützter Input
mit geprüfter SHA-256. Die vorhandene Gzip-/ASCII85-Komprimierung wird erhalten.
Alle 17 Originalassets einschließlich 12 PDF-Referenzen werden bytegenau
verglichen. Die Original-Kernskripte bleiben identisch. Die neuen Module sind
in V27 inline enthalten. `assets/` und `vendor/` bleiben für bisherige Funktionen
notwendig. Öffnung über `index.html` oder die benannte V27-HTML-Datei.

Demo-Build: `python3 tools/build_demo_v27.py`. Der benannte V26-Einstieg bleibt
unverändert; `index.html` und der neue V27-Einstieg enthalten nur die bisherigen
fiktiven Profile. Die neuen Module werden als kleine externe Dateien geladen.
Keine privaten PDFs, Personendaten oder Git-Historien öffentlich kopieren.

## Betrieb, Backup und bekannte Grenzen

Unter derselben Origin wie bisher bereitstellen (Protokoll, Host und Port),
damit der vorhandene Browser-Speicher direkt weiterläuft. Bei einem Adresswechsel
die bestehende Export-/Importfunktion verwenden.

Fotos und Bestätigungen sind wie die übrigen Appdaten lokal im Browser gespeichert
und im vorhandenen JSON-Export enthalten. Sie werden nicht automatisch zwischen
Geräten synchronisiert. Speicherfehler werden abgefangen; ein fehlgeschlagenes
Speichern setzt die vorherigen Daten zurück und lässt den Entwurf zur Korrektur
geöffnet. Der Browser bestimmt seine Speicherkapazität.

Open-Meteo benötigt eine Internetverbindung, aber keinen App-API-Schlüssel.
Es werden keine Wetterwerte als Beispieldaten gespeichert. Der Cloud-Netzfilter
blockiert den Livezugriff auf Wetterdienste; Browserprüfungen verwenden deshalb
kontrollierte API-Antworten und simulierte Fehler. Safari/WebKit ist hier nicht
installiert; der zuvor versuchte Download war durch den Netzfilter blockiert.
Keine Prüfung auf physischen Smartphones behaupten.

## Nächste Runde und Übernahme

Für weitere Änderungen V28 erstellen und V26/V27 erhalten. Keine bestehenden
Personen, Stämme, Termine, Aufgaben oder Fortschritte als Beispieldaten ersetzen.
Test: `python3 -m unittest discover -s tests -v` im jeweiligen Repository.
Die private Testsammlung öffnet jetzt standardmäßig V27; die V26-Archivtests
verwenden ihre Vorversionen ausdrücklich.

Private Änderungen zunächst über den Vergleich `main...feature/v27-stammlife`
prüfen, danach Pull Request erstellen und erst nach Abnahme in `main` mergen.
Die getrennte öffentliche Demo kann für die Browserprüfung veröffentlicht werden.

## Repository-Ausgangsstand

Öffentliche Demo: `85d900b5fe06142c473548cbbc26f211fa75fc9d`. Nur die bestehenden fiktiven Profile bleiben enthalten.
