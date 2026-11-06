# V33 – Abnahme am 6. November 2026

Geprüft wurden die tatsächlich ausgelieferten HTML-Dateien und ihre referenzierten Originalassets mit Node 24.19, Python 3.12, Playwright und Chromium. Alle Browserdaten, Tokens und SQLite-Datenbanken der Tests sind temporär; es wurden keine Nutzerbrowser oder Produktivdaten verändert.

## Abschließende Ergebnisse

| Prüfsatz | Ergebnis |
| --- | --- |
| Private V33-Kompaktdatei | **106/106 bestanden**: 16 neue V33-Browserfälle, 81 bestehende Geschäftsregressionen als V33-Adapter, acht Integritäts-/Paketprüfungen und eine zusätzliche bestehende Rollenprüfung. |
| Öffentliche V33-Demo | **103 bestanden, zwei ausschließlich private Paketprüfungen planmäßig übersprungen** (105 Fälle insgesamt). |
| HTTP-/SQLite-Dienst | **69/69 bestanden**: 25 Fachwissen-, 20 bisherige Bibel-, 14 neue Kapitel- und zehn Bibliothekstests. |
| Gemeinsame Navigation und Originalbibliothek | **10/10 bestanden**: sechs Navigations- und vier Bibliotheks-Units. |

Vollständiger reproduzierbarer Aufruf: `python tools/check_v33.py`. Der jeweilige vollständige Endlauf wird unter `docs/tests/v33-final.log` mitgeliefert. Historische Testdateien und Vorversionen bleiben unverändert. Die V33-Adapter prüfen dieselben Geschäftsabläufe mit den absichtlich geänderten Navigationseinträgen, Ansichten und der abschließend bereiten V33-Anwendung.

## Nachgewiesenes Verhalten

- Rollenmenüs, einklappbare Gruppen, aktiver Menüpunkt, Reload, bestehende delegierte Fachwissen-Rechte und gesperrte direkte Leitungs-/Editorrouten für Ranger. Menüpräferenzen erzeugen keinen weiteren LocalStorage-Key.
- Chronologisch nächstes Ranger-/Leitertreffen; echte Agenda bzw. alle Aktionen mit ihren eigenen Zuständigkeiten. Kalender-Tagesdifferenzen und Sommer-/Winterzeit in Europe/Berlin, einschließlich Heute und Mitternacht.
- Eigene Einkaufs-, Programm-, Doing- und Leitertreffen-Aufgaben: keine doppelten Quellaufgaben; Häkchen schreiben in dasselbe vorhandene Feld und bleiben nach Reload erhalten. Erledigte Aufgaben bleiben verborgen in einem aufklappbaren Bereich verfügbar.
- Anwesenheitsquote nur aus relevanten, erfassten Treffen; exakt ungerundeter Ranger-Mittelwert, korrekter Umgang mit entschuldigter Abwesenheit, abgesagten/zukünftigen Treffen und fehlendem Nenner. Aktive Personen werden dynamisch aufgenommen bzw. ausgeblendet.
- Alle fünf Wachstumsstufen, native Dialoge, Tastatur, echte Touch-Ereignisse, 80-/100-%-Regeln, Bonusaufgaben, Stammwechsel und vorhandene PDF-/Logbuchwege. Alle 66 Dashboard-Buchrücken mit getrennten Aktionen bleiben erreichbar.
- 3/50 Kapitel = 6 % ohne Punkte; expliziter Buchabschluss, exakte Wiederherstellung des vorherigen Teilplans, automatische Vollständigkeit aller Einzelkapitel und einmalige Punktestornierung. 66 vollständige Bücher ergeben genau 240 Punkte und 1.189 Kapitel; drei normale Prüfungsplätze bleiben unabhängig.
- Echte Drei-Browser-Prüfung mit zwei getrennten Geräten desselben Rangers und einem nur lesenden Leiter: Kapitel 1 → 2/50 → Buchabschluss 50/50 und +10 Punkte → Rücknahme am anderen Gerät auf exakt 2/50 und 0 Punkte. Der Server behält `[1,2]`; Leiteransicht und erneuter Remote-Reload stimmen überein.
- Gleichzeitige HTTP-Aufträge, Idempotenz, veraltete Versionen, fremde Profile, Stamm-/Teamgrenzen und SQLite-Neustart. Kapitelwerte anderer Teams gelangen nicht in den eingeschränkten Leiter-Snapshot.
- Migrationen aus tatsächlich vorhandenen älteren HTML-Dateien, aktive Sitzungen, bestehende Personen, Aufgaben, Bibliotheksanpassungen und Punkte. Nachrichten mit mehreren Tabs, Entwürfe, Fragen/Antworten, Rollenfilter und Speicherfehler; Planung, Rezepte, Lebensmittel, Fotos, Teilnahme, Abmeldungen und Knotenbestätigungen bleiben geprüft.
- Alle 16 Bibliotheksmodule im tatsächlichen Browser, Klick auf Erklärungen, Laden und sichtbare Anzeige aller 43 Originaldateien, unveränderte vorhandene Freigaben und Anpassungen sowie unsichtbare unveröffentlichte Inhalte im Ranger-Snapshot.

## Bild- und Auslieferungsprüfung

Die vollständigen Sicherungen aller 466 privaten bzw. 517 öffentlichen vorherigen Dateien wurden mit ihren SHA-256-Manifesten verglichen. V32, ältere Dateien, ursprüngliche Kataloge und historische Tests bleiben bytegleich. Die 17 bisherigen eingebetteten Assetreferenzen einschließlich zwölf PDF-Referenzen bleiben ebenfalls bytegleich, ebenso 21 nicht ausgetauschte Inline-Skripte.

Für alle 43 neuen WebP-Dateien wurden Hash, Größe und Zuordnung zum Quellenmanifest geprüft. Zusätzlich wurden die Originalpixel erneut aus dem hochgeladenen PDF extrahiert bzw. die exakt vorgegebenen Ausschnitte erneut gerendert und mit den ausgelieferten WebP-Pixeln verglichen, einschließlich Transparenz und notwendiger verlustfreier Drehung. Die zusätzliche Standalone-Datei enthält exakt dieselben Originaldatei-Bytes; die Kompaktdatei bleibt unter 25 MB. Werte und Hashes stehen in [v33-build.json](v33-build.json), [V33-SHA256SUMS](V33-SHA256SUMS) und der [Quellzuordnung](V33-BIBLIOTHEK-QUELLEN.md).

## Screenshots und visuelle Prüfung

Beide Rollen wurden bei **1440×900, 1366×768, 1920×1080, 768×1024, 390×844, 375×812, 320×568 und 844×390** geprüft. Die Screenshots wurden tatsächlich geöffnet und auf Abstände, Überlauf, lesbare Tabellen, Originalbilder, fünf Stufen, sechs Kartenlinks und den runden Anwesenheitskreis geprüft. Die zusätzlichen mobilen Regressionen verwenden Chromium mit Touch-Ereignissen. Buch- und Kapitel-Touchflächen sind mindestens 44 Pixel groß. Wetterdaten werden für reproduzierbare Tests kontrolliert beantwortet; der Login löst keinen Wetterabruf aus, „Cloppenburg“ bleibt auf Desktop einzeilig.

- [Leiter-Cockpit Desktop](screenshots/v33/leaders-dashboard-1440x900.png)
- [Ranger-Dashboard Desktop](screenshots/v33/rangers-dashboard-1440x900.png)
- [Ranger auf iPhone-Bildschirmgröße](screenshots/v33/rangers-dashboard-390x844.png)
- [Ranger auf iPad-Bildschirmgröße](screenshots/v33/rangers-dashboard-768x1024.png)
- [Mobile Leiternavigation](screenshots/v33/navigation-leader-phone.png)
- [Original-Emblem mit Erklärung](screenshots/v33/library-emblem-desktop.png)
- [Original-Lilie](screenshots/v33/library-lilie-desktop.png)
- [Original-Grußhand mobil](screenshots/v33/library-gruss-phone.png)
- [Kapitelplan 3/50 = 6 %, mobil](screenshots/v33/bible-chapters-6percent-phone.png)

Weitere Belege und Prüfsummen: `docs/screenshots/v33/` und `docs/v33-screenshots.json`.

## Grenzen

Physische iPhones/iPads und Safari/WebKit wurden nicht getestet; die Bildschirmgrößen und Touch-Abläufe sind in Chromium geprüft. Die Tests belegen die implementierte API mit einem lokalen temporären Dienst, keine eingerichtete produktive Gesamtsynchronisierung. Die öffentliche Demo speichert weiterhin im jeweiligen Browserprofil. Der vollständige PDF-Hash ist ausschließlich die Angabe des mitgelieferten Manifests; unabhängig geprüft wurde der tatsächlich hochgeladene elfseitige Ausschnitt. Das Motto besitzt kein separates Bild und verwendet die nachgewiesene Typografie. Bestehende eigene Texte bleiben erhalten und sind gegebenenfalls keine Originalzitate.
