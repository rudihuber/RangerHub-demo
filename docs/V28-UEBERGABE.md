# RangerHub V28 – Übergabe

## Stand und Sicherung

V28 baut auf der zuletzt funktionierenden V27 auf. Vor Änderungen wurden alle
versionierten Dateien kopiert und mit SHA-256 in `v28-baseline.json` dokumentiert.
Git-Sicherungspunkt: `backup/before-v28-library-messages`.
Entwicklungsbranch: `feature/v28-library-messages`. Private Übernahme in `main`
erst nach Prüfung. V25, V26 und V27 bleiben unverändert erhalten.

## Umsetzung

- Einheitliche kleine SVG-Menüsymbole wie in der Konzeptvorschau: Haus,
  Stammleben, Kalender, Wachstumspfad, Teilnahme und die weiteren bestehenden
  Menüpunkte. Der neue Reiter Nachrichten erscheint bei allen Rollen.
  Die bisherigen Rollenfilter entscheiden weiterhin über sichtbare Menüpunkte.
- 28 unterschiedliche Naturphänomene aus der Liste. „Spinne“ ist einmal
  enthalten. Jeweils eine fachliche Besonderheit, ein davon getrennter Gedanke
  zu Gottes Schöpfung, eine Bibelstelle und eine Gesprächsfrage. Die Texte sind
  von Leitern bearbeitbar. Wissenschaftliche Beschreibungen und geistliche
  Anwendungen werden nicht als dieselbe Art von Aussage dargestellt.
- Naturphänomen-Bibliothek mit Suche und eigener Eingabe. Aus einem Vorschlag
  lässt sich ein neues oder bestehendes Rangertreffen öffnen. In der Planung
  steht ein Auswahlfeld bereit. Die verantwortliche Leitung wird ausdrücklich
  zugewiesen; sie wird nicht aus dem Anhang geraten.
- 22 Planungsideen aus der abgebildeten Tabelle mit Material, Ablauf und je
  einem Impulsvorschlag. Gleichnamige vorhandene Vorlagen behalten ihre IDs und
  eigenen Beschreibungen, auch bewusst leere Inhalte. Die Impulse werden
  additiv ergänzt. Bereits gelöschte Vorlagen werden nicht erneut angelegt.
- Impulsvorschläge sind bei Aktionen und in der Leiter-Bibliothek Impulse
  einsehbar. In der Treffenplanung passen sie zur gewählten Aktion. Übernommene
  Texte können angepasst werden. Es werden keine historischen Termine,
  damaligen Verantwortlichen oder personenbezogenen Ortsangaben importiert.
- Geplante Inhalte für Aktion, Naturphänomen und Impuls sind im Treffen für
  Leiter als aufklappbarer Abschnitt verfügbar. Ranger behalten ihre bisherige
  öffentliche Termin-/Wetteransicht ohne interne Planungsinhalte.
- Gut erreichbare Zurück-Schaltflächen und ein beim Scrollen erreichbarer
  Dialogkopf. Hauptansichten/Unterseiten können über den vorherigen
  Bildschirminhalt samt Scrollposition zurückkehren. Die vorhandene
  Speichern-/Verwerfen-Warnung der Treffenplanung bleibt wirksam. Verlauf nur
  im Arbeitsspeicher; er wird bei Profil- oder Stammwechsel verworfen.
- Alle fünf Bildbeschriftungen stehen auf derselben linken Kante und haben
  dieselbe Schriftgröße. Der schmale braune Bereich erhält mehr Platz durch
  eine SVG-Erweiterung der vorhandenen Farbbänder. Das vollständige bestehende
  Bild wird daneben proportional angezeigt. Keine Figuren abgeschnitten,
  keine Originalbilddatei verändert oder gelöscht.
- Nachrichten mit Themenwahl, Betreff, Frage, Antwort und Rückfrage. Unten
  rechts öffnet ein Chat-Symbol den Dialog; die vollständige Ansicht liegt im
  Reiter Nachrichten. Neue/offene Rangerfragen sind beim Leiter fett,
  beantwortete Fragen mit Haken und normaler Schrift gekennzeichnet.
  Neue Antworten werden beim Ranger bis zum Öffnen hervorgehoben.

## Vereinbarter Demo-Umfang und Online-Vorbereitung

Der Benutzer hat ausdrücklich „Zunächst Demo-Chat und Online-Anbindung
vorbereiten“ gewählt. Der ausgelieferte Chat ist sichtbar als Demo gekennzeichnet
und arbeitet in demselben Browserprofil. Zum Testen zwischen Ranger- und
Leiterprofil wechseln; auch zwei Tabs desselben Browserprofils funktionieren.
Es gibt keine geräteübergreifende Zustellung und keine aktiven Push-Nachrichten.

`rangerhub-chat-transport.js` enthält einen austauschbaren lokalen und einen
HTTP-Transport mit persönlichem Bearer-Token, HTTPS, Zeitlimit und
Fehlerbehandlung. `setMessagesTransport()` aktiviert später einen echten
Dienst. Die persönliche Online-Authentifizierung und der Server werden nicht
vorgegeben oder als bereits eingerichtet dargestellt. Details, REST-Vertrag,
Rollen-/Stammprüfung und Push-Integrationsstellen: `V28-ONLINE-CHAT.md`.
Lokale Ereignisse und ein Push-Payload-Helfer sind vorbereitet; es werden weder
Benachrichtigungsrechte angefragt noch Betriebssystem-Pushs ausgelöst.

## Datenmodell und Bestandsschutz

Privater LocalStorage bleibt `rhv9`, Demo bleibt `rhv9-demo`. Die Zuordnung
steht im neuen nicht-geheimen HTML-Metadatum `rangerhub-storage`.
Keine zweite Fortschrittsdatenbank, kein neues Rollensystem. Bestehende
Fortschrittswerte und die 80-%-/100-%-Regeln einschließlich Bonuspaketen und
leeren Stufen sind unverändert.

Additive Stammfelder:

- `natureLibrary[]`: `id`, `title`, `fact`, `creation`, `verse`, `question`.
  Eigene vorhandene Einträge und IDs werden beim Import berücksichtigt.
- `actionLibrary[].sourceV28`, `.impulseSuggestions[]`, `.planningMaterials`,
  `.planningSteps`: zusätzliche Vorschläge; alte Eigenschaften bleiben erhalten.
- `v28LibraryImported`: einmaliger additiver Import je Stamm.
- `messages[]`: Thread-ID, Stamm-ID, Ranger-ID, Thema, Betreff, Zeitstempel,
  Nachrichten mit Autor-Snapshot und Lesestände. Kein manuelles Statusfeld.
  Die letzte Autorenart bestimmt offen/beantwortet.

Neue Frage: angemeldeter Ranger des aktiven Stamms. Zugriff: der betreffende
Ranger und das Leiterteam dieses Stamms; der bestehende Admin kann im aktiv
gewählten Stamm arbeiten. Autor und Ranger-ID stammen beim Demo-Schreiben aus
der bestehenden Sitzung. Andere Ranger und andere Stämme sind ausgeschlossen.
Nachrichten-Schreiben vereinigt nur das Nachrichtenfeld mit dem zuletzt
vorhandenen App-Speicher. Fehler lassen die bisherigen Daten und den Entwurf
bestehen. Texte werden als Text ausgegeben, nicht als HTML ausgeführt.
Die lokale Rollenprüfung ist keine produktive Online-Authentifizierung.

Beim Auswählen eines Vorschlags werden Inhalte als Snapshot in die bestehenden
`meeting.nature`-/`meeting.impulse`-Felder übernommen. Spätere Änderungen der
Bibliothek schreiben geplante Treffen nicht um. Neue Verknüpfungen heißen
`nature.libraryId` und `impulse.suggestionId`. Verantwortliche und Datum bleiben
bewusste Eingaben. Kein neuer Kalender wird angelegt.

## Build und Dateien

Neue Module: `rangerhub-library-v28.js`, `rangerhub-v28.js`,
`rangerhub-chat-transport.js`, `rangerhub-messages.js`, `rangerhub-v28.css`.
Keine neuen UI-Frameworks oder großen Generatorbilder. Der generierte Katalog
ist mit `python3 tools/prepare_library_v28.py` reproduzierbar. Die 22 Ideen
folgen der Tabelle; leere Impulsfelder wurden als ausdrücklich ergänzende
Vorschläge ausgearbeitet. Quellnamen/Personen/Privatorte sind nicht enthalten.

Privat: `python3 tools/build_v28.py`. V27 ist unveränderter Input; ursprüngliches
Gzip-/ASCII85-Format und sämtliche früheren Inline-Skripte bleiben erhalten.
Alle 17 ursprünglichen Assetreferenzen einschließlich 12 PDF-Referenzen werden
bytegenau geprüft. Die neuen Module sind inline eingebunden.
Die vorhandene bereinigte Illustration `assets/growth-journey-clean.png` aus der
Demo wird unverändert auch privat verwendet. Das alte Original bleibt erhalten.
`assets/` und `vendor/` weiterhin mitliefern.

Demo: `python3 tools/build_demo_v28.py` erzeugt den benannten V28-Einstieg und
`index.html`. Alte benannte Versionen werden nicht überschrieben. Die Demo
enthält weiterhin keine Original-PDFs und keine privaten Personenstammdaten.

Tests: `python3 -m unittest discover -s tests -v`. Standard ist V28.
Archivtests verwenden ihre alten HTML-Dateien gezielt. Browser-Screenshots
werden künftig im Verzeichnis der tatsächlich geprüften Version gespeichert.
Siehe `V28-TESTBERICHT.md` und `V28-SHA256SUMS`.

## Fortsetzung

V28 an derselben Origin bereitstellen, um bestehende Browserdaten weiterzunutzen.
Bei einem Adresswechsel den vorhandenen JSON-Export/-Import verwenden.
Für die nächste Entwicklung V29 erstellen. Keine bestehenden Daten durch
Beispieldaten ersetzen. Erst den privaten Prüfbranch vergleichen und nach
Abnahme mergen. Die öffentliche Demo bleibt separat veröffentlichbar.

## Ausgangscommit dieses Repositorys

`053f62e6646cc3bde1d08d7d7028207b97e5ce52`
