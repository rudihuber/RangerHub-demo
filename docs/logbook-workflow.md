# Logbuch und Leiterabläufe

Dieser Stand betrifft die öffentliche Demo. Die private Installation und deren
Hauptbranch bleiben unverändert. Vor der Änderung wurde der Git-Sicherungspunkt
`backup/before-logbook-navigation-20261103` auf Commit `44346b1` angelegt.

## Direkt im Browser testen

https://rudihuber.github.io/RangerHub-demo/

Stamm **Rangerstamm 01** wählen, anschließend eines der persönlichen Demo-Profile:
**PM** (Stammleiter), **RH** (Admin), **DL** (Leiter), oder **JB, KN, LI, TK, JK,
EL, LM, AT** (Ranger). Das Passwortfeld ist absichtlich deaktiviert. Die
Anmeldung benötigt auf üblichen Desktopgrößen und bei 390 × 844 Pixeln kein
Scrollen. Auf kleineren Geräten oder bei großer Schrift bleibt reguläres
Seitenscrollen möglich; es gibt keinen eigenen rechten Scrollbereich.

Auf dem Handy öffnet das Hamburger-Symbol das Menü. **Stammleben → Rezepte**
führt zur Rezeptbibliothek. Ein Klick auf **Ranger Hub** führt zum Dashboard.
Aktuelles Wetter erscheint auf der Anmeldung und im Dashboard. Es verwendet
den vorhandenen Wetterort; die Demo beginnt mit Berlin beziehungsweise Hamburg.
Bei nicht erreichbarem Wetterdienst wird dies angezeigt.

## Wachstumspfad

Die fünf Blöcke übernehmen die Hintergrundfarben aus der Illustration: gelb,
blau, grau, weiß und braun. Sämtliche Texte bleiben entsprechend der abschließenden
Rückmeldung erhalten. Der vorhandene Aufgabenkatalog wird bis einschließlich
Forscher um fehlende Einträge ergänzt: Erkunder 21, Entdecker 14 und Forscher 16
Aufgaben bei einer neuen Installation. Vorhandene und selbst angelegte Aufgaben
werden erhalten; dies ist keine neue Abschrift zusätzlicher PDF-Arbeitsblätter.

Ranger können ihren Fortschritt ansehen. Nur Leiter, Stammleiter und Admin können
ihn bestätigen. Die bisherige Freigabe der nächsten Stufe ab 80 Prozent bleibt
bestehen. Eine Bibliotheksaufgabe muss beim Hinzufügen einer Kategorie zugeordnet
werden; Admin und Stammleiter können auch neue Kategorien anlegen.

Aufgabenpakete werden nacheinander freigegeben: **A → B → C → Reflexion**.
Wird ein früheres Paket wieder geöffnet, werden nachfolgende Paketbestätigungen
zurückgesetzt. Bereits gespeicherte widersprüchliche Bestätigungen werden erst
gezählt, wenn ihre Voraussetzungen erfüllt sind. Es werden weiterhin keine
PDF-Arbeitsblätter oder deren Download-Schaltflächen mitgeliefert. Der Import
eigener PDF- und Word-Rezepte bleibt möglich und verarbeitet Dateien lokal.

## Jahresvision und Karten

Unter **Stammleben → Leitermeetings** kann das Leiterteam je Stamm und Jahr eine
Vision und Ziele hinterlegen. Diese erscheinen automatisch bei jedem Treffen
des betreffenden Jahres, auch während der Bearbeitung. Die Jahresauswahl zeigt
vergangene und kommende Planungen. Ein anderer Stamm hat eine eigene Vision.

Neben sichtbaren Kontaktadressen öffnet **Route planen** die Auswahl zwischen
Google Maps und Apple Karten, auf Android zusätzlich die Karten-App. Die Adresse
wird erst beim Öffnen des gewählten Kartendienstes übergeben. Bestehende Regeln
für die Sichtbarkeit von Kontaktdaten bleiben bestehen.

## Daten, Anmeldung und Prüfung

Die Demo verwendet weiterhin `rhv9-demo` und `rhv9-demo-session`. Der produktive
LocalStorage-Key `rhv9` bleibt unberührt. Bestehende Profil-IDs und alle
Fortschrittsdatensätze bleiben erhalten. Die beiden entfallenen Standardprofile
09/10 werden einschließlich ihrer Daten archiviert, falls sie noch vorhanden
sind; selbst umbenannte Profile werden nicht entfernt.

Die Rollenregeln werden in Oberfläche und Änderungshandlern geprüft. Die Demo
bleibt eine lokale Anwendung mit frei wählbaren Profilen und bietet keine sichere
Mehrbenutzer-Anmeldung. Für persönliche Zugangsdaten und gedruckte einmalige
QR-Einladungen wird noch ein Authentifizierungsdienst mit zentraler Datenbank
benötigt. QR-Codes dürfen später keine dauerhaften Anmeldeschlüssel enthalten;
Einladungen müssen ablaufen und nach Aktivierung ungültig werden.

32 Inhalts- und Browsertests prüfen alle vier Rollen, Neuladen, Navigation,
Speicherung, Stammtrennung, Migration, mobile Menüs, Kartenlinks, Jahresvision,
Aufgabenfolge sowie echte PDF-/DOCX-Importe und OCR. Wetter-Erfolg und Fehlerfall
werden mit kontrollierten HTTP-Antworten geprüft; eine Live-Antwort des externen
Wetterdienstes konnte in der eingeschränkten Entwicklungsumgebung nicht geprüft
werden. Die Screenshots enthalten ausschließlich fiktive Daten.

- [Anmeldung](screenshots/login-desktop.png)
- [Mobiles Menü](screenshots/menu-mobile.png)
- [Wachstumspfad](screenshots/growth-desktop.png)
- [Jahresvision](screenshots/annual-vision.png)

Die Umsetzung wird direkt von `index.html` geladen. Zum Hosten gehören die
JavaScript-, CSS-, Bild- und `vendor`-Dateien dazu; ein Reparaturskript ist nicht
erforderlich. Die Änderung kann im Git-Vergleich des Feature-Branches geprüft
werden. Ein Übertrag in die private Hauptanwendung erfordert dort einen eigenen
geprüften Änderungsstand, damit keine Demo-Profile oder Demo-Speicherschlüssel
in die produktive App gelangen.
