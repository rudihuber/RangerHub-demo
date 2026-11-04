# RangerHub Demo

Öffentliche Vorschau mit ausschließlich fiktiven Demo-Profilen. Die App ist
über `index.html` erreichbar und benötigt weder Backend noch Build. Die
mitgelieferten JavaScript-, CSS-, Bild- und Import-Dateien müssen mitgehostet werden.

## Fachwissen – interaktive Unterwelten und persönliche Prüfungen

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
