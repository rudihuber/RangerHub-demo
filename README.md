# RangerHub Demo

Öffentliche Vorschau mit ausschließlich fiktiven Demo-Profilen. Die App ist
über `index.html` erreichbar und benötigt weder Backend noch Build. Die
mitgelieferten JavaScript-, CSS-, Bild- und Import-Dateien müssen mitgehostet werden.

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
- Der integrierte Wachstumspfad verwendet die Illustration mit dunklerer Schrift
  und ohne gedruckte Seitenzahl. Das Dashboard bleibt ohne Illustration.

Die Rollen Admin, Stammleiter, Leiter und Ranger sowie Kalender, Treffen,
Wachstumspfad, Abwesenheiten, Backup und Stammwechsel sind bedienbar.
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
