# RangerHub Demo

[Korrigierte V36-Demo zur Ansicht](https://rudihuber.github.io/RangerHub-demo/RangerHub_Webapp_V36_Demo.html?v=36). Die bestehende Startseite bleibt V35. Die V36-Vorschau verwendet ausschließlich fiktive Profile; produktive Vertreterrechte und KI benötigen die gesonderte Serveranbindung.


Öffentliche Vorschau mit ausschließlich fiktiven Demo-Profilen. Die App ist
über `index.html` erreichbar und benötigt weder Backend noch Build. Die
mitgelieferten JavaScript-, CSS-, Bild- und Import-Dateien müssen mitgehostet werden.

## Aktueller Stand V35 – visueller Editor und Mitgliederstatus

App öffnen: [RangerHub_Webapp_V35_Demo.html](RangerHub_Webapp_V35_Demo.html) oder `index.html`. [Öffentliche Demo](https://rudihuber.github.io/RangerHub-demo/?v=35).

PowerPoint-artiger Ranger-Wissen-Editor mit Bühne, Seitenminiaturen, direkt bearbeitbaren Texten und Bildern, Raster, Ebenen, Undo/Redo, Entwurfsspeicherung, Ranger-Vorschau und ausdrücklicher Veröffentlichung. Originale aus Logbuch Ausgabe(4) bleiben erhalten; eigene Bilddateien liegen separat und sind in ZIP-Backups enthalten.

Ranger und Leiter haben die Status Aktiv, Pausiert und Ausgetreten mit Gültigkeitsdaten und Verlauf. Die bestehenden Daten und der Speicher `rhv9` bleiben erhalten; die öffentliche Demo verwendet weiterhin `rhv9-demo`. Anwesenheitsquoten berücksichtigen Statuszeiträume, aktive Listen und Ranglisten den aktuellen Status. Offene Aufgaben und Prüfungen werden erhalten und bei Bedarf gekennzeichnet.

- [Änderungen und Bedienung](docs/V35-UEBERGABE.md)
- [Testbericht und Screenshots](docs/V35-TESTBERICHT.md)
- [Zentrale Anbindung, Bildspeicher und optionale KI](docs/V35-BACKEND.md)
- [SHA-256](docs/V35-SHA256SUMS) und [gesicherte V34-Baseline](docs/v35-baseline.json)

Start: `python -m http.server 8000`, dann `index.html`. `assets/` und `vendor/` mit ausliefern. Tests: `python tools/check_v35.py`. Die manuelle Bearbeitung funktioniert ohne KI. KI und produktive Geräteanbindung benötigen die dokumentierte Serverkonfiguration; ohne KI-Zugang erscheint ausdrücklich „KI noch nicht konfiguriert“. Die öffentliche Demo bleibt browserlokal. Der private `main` bleibt bis zur Abnahme unverändert.

## Archiv V34 – kompaktes Dashboard und geordnete Vorlagen

App öffnen: [RangerHub_Webapp_V34_Demo.html](RangerHub_Webapp_V34_Demo.html) oder `index.html`. [Öffentliche Browser-Demo](https://rudihuber.github.io/RangerHub-demo/?v=34).

Originales Rangers-Wappen dauerhaft neben Ranger Hub; Bildmarkierungen in der Ranger-Bibliothek ausblendbar; Geburtstage untereinander. Naturphänomene alphabetisch und ohne Bibelstelle/Gesprächsfrage. Naturphänomene, Aktionen und Impulse erscheinen zwei Kalenderjahre nach der letzten Verwendung wieder als Vorlage. Rezepte haben Kategorien, Suche und Kategorieauswahl im Editor.

Die Expedition zeigt alle fünf Stufen direkt im Bild. Kleinere Fachwissen-Labels und Buchrücken gelten für Mobil und Desktop. Die Dashboard-Bücher wechseln beim erneuten Aufrufen und über „Bücher wechseln“; Lesestand und vollständige Bibelbibliothek bleiben erhalten.

- [Änderungen, Bedienung und Nachweise](docs/V34-UEBERGABE.md)
- [Tests und Screenshots](docs/V34-TESTBERICHT.md)
- [SHA-256](docs/V34-SHA256SUMS) und [gesicherte V33.1-Baseline](docs/v34-baseline.json)

Start: `python -m http.server 8000`, danach `index.html`. `assets/` und `vendor/` mit ausliefern. Tests: `python tools/check_v34.py`. Speicher bleibt privat `rhv9`, Demo `rhv9-demo`. Die Demo speichert weiterhin im jeweiligen Browser; die produktive gemeinsame API ist unverändert nicht konfiguriert. Privater `main` bleibt bis zur Abnahme unverändert.

## Archiv V33.1 – überprüfte Korrektur

Nachprüfung des vollständigen Auftrags: Dashboard-Buchhaken, mobile Sortierung, Aufgaben-Zuordnung/-Status, Geburtstage und Veröffentlichung korrigiert. [Befunde und Nachprüfung](docs/V33.1-NACHPRUEFUNG.md).

App öffnen: [RangerHub_Webapp_V33_Demo.html](RangerHub_Webapp_V33_Demo.html) oder `index.html`. [Öffentliche Browser-Demo](https://rudihuber.github.io/RangerHub-demo/?v=33).

Neue Rollen-Navigation, Leiter-Arbeitszentrale mit echten Planungsaufgaben und Quoten, Ranger-Dashboard mit allen fünf Stufen und 66 Buchrücken. Die Bibelreise enthält 1.189 einzeln markierbare Kapitel bei unveränderten 240 Buchpunkten. Ranger-Bibliothek verwendet ausschließlich Texte und 43 Originalgrafiken aus der neu gelieferten Logbuch-Ausgabe(4); vorhandene Bearbeitungen und Freigaben bleiben erhalten.

- [Übergabe, Datenquellen und Sicherung](docs/V33-UEBERGABE.md)
- [Aktuelle Nachprüfung, Tests und Screenshots](docs/V33.1-NACHPRUEFUNG.md)
- [Originalgrafiken und Quellzuordnung](docs/V33-BIBLIOTHEK-QUELLEN.md)
- [Backend und noch offene Produktiveinrichtung](docs/V33-BACKEND.md)
- [SHA-256](docs/V33-SHA256SUMS) und [unveränderte V32-Baseline](docs/v33-baseline.json)

Start: `python -m http.server 8000`, danach `index.html`. `assets/` und `vendor/` mit ausliefern. Aktuelle Tests: `python tools/check_v33.py` mit Playwright/Chromium und Node 24. Bestehender Speicher bleibt privat `rhv9`, Demo `rhv9-demo`. Die öffentliche Demo speichert weiterhin lokal im Browserprofil; die gemeinsame API ist getestet, aber nicht produktiv konfiguriert. Der private `main` bleibt bis zur Abnahme unverändert.

## Archiv V32 – Ranger-Wissen und geordnetes Dashboard

App direkt öffnen: [RangerHub_Webapp_V32_Demo.html](RangerHub_Webapp_V32_Demo.html), ebenfalls über `index.html`. Unveränderte Vorversion: V31. Öffentliche Browser-Vorschau: https://rudihuber.github.io/RangerHub-demo/ .

**Ranger-Wissen:** fünf Gruppen, 16 echte Logbuch-Module, 76 interaktive Erklärungen. Drei Startthemen sichtbar; Admin/Stammleitung geben die übrigen Themen mit echten Schiebeschaltern frei. Globale Standards und Anpassungen des eigenen Stammes bleiben getrennt. Ranger sehen ausschließlich veröffentlichte Themen; Ranger-Wissen vergibt keine Punkte.

**Bibelreise:** eigener Hauptreiter, alle 66 Bücher / 240 Punkte erhalten. Gelesene Bücher dunkel, offene hell. Selbst markieren und zurücknehmen bleiben unverändert. **Dashboard:** Treffen → Anwesenheit → kompakte Expedition + Fachwissen → Bibelreise → zwei getrennte Ranglisten → Geburtstage. Login ohne Wetterabrufe.

- [Übergabe und Bedienung](docs/V32-UEBERGABE.md)
- [Testbericht und Screenshots](docs/V32-TESTBERICHT.md)
- [Serverrechte / noch offene Online-Einrichtung](docs/V32-BACKEND.md)
- [SHA-256](docs/V32-SHA256SUMS) und [vollständige Vorversions-Baseline](docs/v32-baseline.json)

Start: `python3 -m http.server 8000`, dann `index.html` öffnen. Aktuelle Tests: `python tools/check_v32.py` (Playwright/Chromium, Node 24). Privater Speicher unverändert `rhv9`, Demo unverändert getrennt `rhv9-demo`. Keine Nutzer-, Stamm-, Aufgaben- oder Punktedaten zurückgesetzt. Die gemeinsame Serveranbindung ist implementiert und lokal getestet; die veröffentlichte Demo bleibt ohne produktive Serverkonfiguration lokal. Privater `main` bleibt bis zur Abnahme unverändert.

## Archiv V31 – Bibelbibliothek und persönliche Bibelreise

Archivierte App: [RangerHub_Webapp_V31_Demo.html](RangerHub_Webapp_V31_Demo.html), ebenfalls über `index.html`. Die unveränderte V30 bleibt erhalten.

66 kanonische Bibelbücher in interaktiven AT-/NT-Regalen: selbstständig als vollständig gelesen markieren, ohne Leiterprüfung, und jederzeit wieder zurücknehmen. Genau 240 zusätzliche Punkte (AT 187, NT 53). Profil, Fachwissen-Gesamtstand und Rangliste verwenden dieselben aktuellen Buchungen. Die bisherigen Fachwissen-Aufgaben und das Limit von drei normalen Prüfungen je Treffen bleiben erhalten.

- [Übergabe und Datenmodell](docs/V31-UEBERGABE.md)
- [Testbericht und Screenshots](docs/V31-TESTBERICHT.md)
- [Online-Anbindung / offene Einrichtung](docs/V31-BACKEND.md)
- [SHA-256](docs/V31-SHA256SUMS), [unveränderte Vorversion](docs/v31-baseline.json)

Start: `python3 -m http.server 8000`, dann `index.html` öffnen. `assets/` und `vendor/` gemeinsam mitliefern. Aktuelle vollständige Tests: `python tools/check_v31.py` mit Playwright/Chromium und Node 24.

Die öffentliche Vorschau bleibt lokal; eine gemeinsame persönliche Online-Anbindung ist implementiert und mit getrennten Browserprofilen geprüft, aber noch nicht produktiv konfiguriert. Privater `main` bleibt bis zur Abnahme unverändert. Speicher bleibt privat `rhv9`, Demo getrennt `rhv9-demo`.

## Archiv V30 – interaktive Unterwelten und persönliche Prüfungen

Aktueller Einstieg: [RangerHub_Webapp_V30_Demo.html](RangerHub_Webapp_V30_Demo.html), auch über `index.html`. V29 bleibt unverändert archiviert.

Die vorhandene Oberwelt führt zu fünf eigenen Unterwelten mit 36 Themenorten und 253 Originalaufgaben. Erst Ort und Aufgabe auswählen; dann für ein echtes Rangertreffen anmelden, höchstens drei Prüfungen pro Ranger/Treffen. Leiter bestätigen persönlich bestandene Aufgaben, Punkte und Rangliste folgen dem bestehenden Journal. Die frühere Arena ist ausschließlich Rangliste. Globale Redaktion und lokale Stammesanpassungen bleiben getrennt.

Das Dashboard zeigt beide interaktiven Karten sowie Punkte, Platzierung, Top 3 und Prüfungsstatus. Die öffentliche Vorschau bleibt ausdrücklich lokal. Die zentrale Node-/SQLite-Anbindung mit persönlichen Rollen wurde mit getrennten Browserprofilen getestet; ein produktiver Host und persönliche Online-Zugänge sind noch einzurichten.

- [Übergabe, Dateien und Datenmodell](docs/V30-UEBERGABE.md)
- [Testbericht und Screenshots](docs/V30-TESTBERICHT.md)
- [Backend-Einrichtung](docs/V30-BACKEND.md)
- [SHA-256](docs/V30-SHA256SUMS), [unveränderte Baseline](docs/v30-baseline.json)

Start: `python3 -m http.server 8000`, dann `index.html` öffnen. `assets/` und `vendor/` gemeinsam mitliefern. Aktuelle Tests: `python tools/check_v30.py` (Playwright/Chromium, Node 24). Ältere versionierte Tests dokumentieren die früheren Releases und deren inzwischen ersetzte Workflows.

Privater Hauptbranch bleibt bis zur Abnahme unverändert. Speicher bleibt `rhv9`, Demo getrennt `rhv9-demo`. Keine bestehenden Personen, Aufgaben, Fortschritte, Termine oder Originalassets gelöscht.

## Archiv V28 – Vorschläge, Navigation und Demo-Nachrichten

Neue Hauptdatei: [RangerHub_Webapp_V28_Demo.html](RangerHub_Webapp_V28_Demo.html). `index.html` öffnet V28. Vorversionen bleiben unverändert erhalten.

Einheitliche Menü-Icons, 28 Naturphänomene mit Besonderheiten und Schöpfungsgedanken, 22 Planungsideen mit Impulsen, verbesserte Zurück-Schaltflächen, gleich ausgerichtete Stufenbeschriftungen und ein klar gekennzeichneter Demo-Chat.

- [Übergabe](docs/V28-UEBERGABE.md)
- [Testbericht](docs/V28-TESTBERICHT.md)
- [Prüfsummen](docs/V28-SHA256SUMS)
- [Vorbereitete Online-Anbindung und späteres Push](docs/V28-ONLINE-CHAT.md)

Der Chat speichert im bestehenden Browserprofil. Geräteübergreifende Online-Zustellung und Push sind vorbereitet und noch nicht aktiviert. Der private Hauptbranch bleibt bis zur Prüfung unverändert.

## Archiv V27 – Wetter, Teilnahme und Stammleben

Neue Hauptdatei: [RangerHub_Webapp_V27_Demo.html](RangerHub_Webapp_V27_Demo.html). `index.html` öffnet V27. V25 und V26 bleiben unverändert erhalten.

Wetter am Stammort und am Treffpunkt, Geburtstage als Abschnitt 04, direkte Ranger-Abmeldung und Anwesenheitsquote, Anwesenheit per Häkchen, Bestätigungsnachweise und zwei Treffen für neue Knotenabschlüsse, bis zu vier Fotos je Treffen sowie 55 Aktionsvorlagen und 17 Rezepte.

- [Übergabe und Datenmodell](docs/V27-UEBERGABE.md)
- [Testbericht und Grenzen](docs/V27-TESTBERICHT.md)
- [SHA-256-Prüfsummen](docs/V27-SHA256SUMS)

Der private Hauptbranch bleibt bis zur Prüfung unverändert. Die öffentliche Demo enthält weiterhin keine persönlichen Daten und keine gebündelten PDFs.

## Archiv V26 – persönlicher Wachstumspfad als Expeditionskarte

Die Karte erscheint ausschließlich auf dem persönlichen Ranger-Dashboard,
beispielsweise nach **Rangerstamm 01 → JB · Ranger**. Leiter, Stammleiter und
Admin behalten ihre Verwaltungsansichten ohne Karte. Die vorhandene 80-%-/100-%-
Logik, Aufgaben, Rollen und gespeicherten Fortschritte werden weiterverwendet.

- [V26 direkt öffnen](https://rudihuber.github.io/RangerHub-demo/RangerHub_Webapp_V26_Demo.html)
- [Unveränderte Vorversion](https://rudihuber.github.io/RangerHub-demo/RangerHub_Webapp_V25_Demo_Backup.html)
- [Übergabe](docs/V26-UEBERGABE.md)
- [57 Prüfungen und alle Geräte-Screenshots](docs/V26-TESTBERICHT.md)
- [SHA-256-Prüfsummen](docs/V26-SHA256SUMS)

Die Erweiterung verwendet SVG, CSS und vorhandene Bildassets. Es gibt keine
neuen großen Bilder, kein zusätzliches Framework und keine neue Fortschrittsdatenbank.

## Beispieldaten

- **Rangerstamm 01**: **PM** (Stammleiter), **RH** (Admin), **DL** (Leiter)
  sowie **JB, KN, LI, TK, JK, EL, LM, AT** (Ranger).
- **Rangerstamm 02**: zusätzliche fiktive Leiter- und Rangerprofile.
- E-Mail-Adressen verwenden die reservierte Domain `example.invalid`.
- Telefonnummern stammen aus dem fiktiven Bereich `+1 202 555 0100–0199`.
- Alle nicht persönlichen Inhalte und freigegebenen Bilder sind enthalten:
  Wachstumspfad, Schulterschlaufe, Beobachter-Einführung und Themengrafik.
  Persönliche Angaben bleiben durch fiktive Profile ersetzt.
- Es werden keine PDF-Arbeitsblätter mitgeliefert, auch keine PDF-Platzhalter.
  Die Aufgabenpakete und ihre Fortschritts-Checkboxen bleiben erhalten.
- Der integrierte Wachstumspfad verwendet eine bereinigte Illustration mit
  Beschriftung in der App-Schrift. Rollenbezeichnungen oben rechts entfallen.
  Gesperrte Stufen zeigen sofort ein Schloss. Das Dashboard bleibt ohne Illustration.

Die Rollen Admin, Stammleiter, Leiter und Ranger sowie Kalender, Treffen,
Wachstumspfad, Teilnahme, Backup und Stammwechsel sind entsprechend ihrer Rolle bedienbar.
Der Fehler beim Neuladen einer aktiven Sitzung ist korrigiert.

Zum Einstieg Stamm und Profil im Dropdown wählen; das Passwortfeld bleibt in
der Demo deaktiviert. Für den vollständigen Funktionsumfang **RH · Admin** wählen.
Aufgabenfortschritte können ausschließlich Leiter bestätigen. Admin und
Stammleiter dürfen Aufgaben samt Kategorie hinzufügen. Alle fünf Wachstumsstufen einschließlich der Beobachter-Einführung
bleiben erreichbar. Private Personendaten und PDF-Dateien werden nicht veröffentlicht.

Der Rezeptimport aus selbst ausgewählten PDF- und Word-Dateien bleibt nutzbar.
Diese Dateien werden nur lokal im Browser gelesen und nicht mit der Demo gehostet.

Das neue freie Dashboard, die automatische Treffenplanung, Lebensmittel-Aufgaben
und der PDF-/Word-Rezeptimport sind in
[Dashboard und Planung](docs/dashboard-and-planning.md) beschrieben.
Die kompakte Anmeldung, mobile Navigation, Jahresplanung und neuen Regeln für
den Wachstumspfad sind in [Logbuch und Leiterabläufe](docs/logbook-workflow.md) dokumentiert.
Die persönliche Rangeransicht mit Anwesenheitsquote, Absagen, Wachstumsfortschritt
und Rangliste ist in [Rangeransicht und Teilnahme](docs/ranger-view.md) beschrieben.
Ranger sehen keine Planungsbibliotheken. Vergangene Treffen werden für das
Leiterteam erst nach dem Öffnen des Archivs angezeigt.

Die öffentliche Demo ist unter **https://rudihuber.github.io/RangerHub-demo/**
direkt im Browser erreichbar. Die Profilauswahl dient der Demonstration und ist
keine sichere Anmeldung. Persönliche Zugangsdaten und einmalige QR-Einladungen
benötigen eine zentrale Benutzerverwaltung; sie sind hier noch nicht aktiviert.

Diese Demo nutzt `rhv9-demo`, `rhv9-demo-session` und einen eigenen
Wetterort-Schlüssel. Vorhandene Daten unter `rhv9` werden nicht gelesen oder
überschrieben. Änderungen in der Demo bleiben im jeweiligen Browserprofil.
Persönliche Backups aus einer produktiven Installation sollten hier nicht
importiert werden. Wetter benötigt Internetzugriff.

## Kostenlose Veröffentlichung

1. Ein **neues öffentliches** GitHub-Repository für diese Demo anlegen.
2. Nur den Inhalt dieses Demo-Verzeichnisses samt eigener neuer Git-Historie
   übertragen. Keine Historie oder Dateien einer privaten Installation kopieren.
3. Unter **Settings → Pages** die Quelle **Deploy from a branch**, Branch
   **main**, Ordner **/ (root)** wählen und speichern.
4. Nach erfolgreicher Bereitstellung den von GitHub angezeigten Pages-Link öffnen.

## Lokale Prüfung

```sh
python3 -m http.server 8000
```

Tests (Python; für Browsertests zusätzlich Playwright und Chromium):

```sh
python3 -m unittest discover -s tests -v
```

Die Tests arbeiten mit isoliertem Browserspeicher und prüfen die Demo-Inhalte,
alle vier Rollen, Anmeldung, Neuladen, Navigation, Datenspeicherung und getrennte
Stammdaten. Die Originalinstallation wird nicht verändert.
