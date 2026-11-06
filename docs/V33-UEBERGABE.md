# V33 – Leiter-Cockpit, Kapitelplan und Originalbibliothek

Die bestehende App wurde auf `feature/v33-logbuch4-cockpit` erweitert. Die öffentliche Demo wird für die Browserabnahme aktualisiert; der private `main` bleibt bis zur Abnahme unverändert. V31 und V32 bleiben als unveränderte Dateien vorhanden.

## Bedienung und Änderungen

Ranger erhalten die Gruppen **Dein Abenteuer**, **Stammleben** und **Wissen & Grundlagen**. Das Leiter-Menü beginnt mit dem dauerhaft offenen **Leiter-Cockpit**; die weiteren Gruppen lassen sich einklappen. Verwaltungseinträge richten sich nach den tatsächlichen bisherigen Rechten. Eine bereits delegierte Fachwissen-Redaktion bleibt erhalten und verleiht keine Bibliotheksrechte. Die Menüauswahl wird innerhalb von `rhv9` gespeichert, in der Demo weiterhin innerhalb von `rhv9-demo`.

Das Leiter-Dashboard zeigt das nächste Ranger- oder Leitertreffen, eigene Aufgaben, Anwesenheiten, Wachstumspfad, die sortierbare Punkte-/Kapitelstatistik und Geburtstage. Ranger behalten die Reihenfolge Treffen, Anwesenheit, Karten, Bibelregal, Ranglisten, Geburtstage. Alle fünf Stufen sind erreichbar; die vollständige bisherige Expeditionskarte bleibt erhalten. Das Dashboard-Regal enthält alle 66 Bücher in drei Desktop-Reihen, mobil als drei horizontal bedienbare Reihen. Buchkörper und Abschluss-Häkchen sind getrennte Aktionen.

In der Bibelreise öffnet der Buchkörper den Kapitelplan. Drei Kapitel in 1. Mose ergeben 3/50 bzw. 6 %, ohne Punkte. Ein vollständig gelesenes Buch erhält seinen bisherigen Buchwert genau einmal. Ein direkt gesetzter Buch-Haken bewahrt einen vorhandenen Teilplan; seine Rücknahme stellt diesen wieder her. Wird ein Buch durch alle Einzelkapitel vollständig, öffnet die Rücknahme des Buch-Hakens das letzte Kapitel wieder. Ein einzelnes Kapitel kann ebenfalls zurückgenommen werden. Altbestände mit gelesenem Buch zählen als vollständige Kapitelabdeckung, ohne neue Buchungen beim Upgrade. Es bleiben 66 Bücher, 1.189 Kapitel und genau 240 Buchpunkte.

**Ranger-Bibliothek** ersetzt den sichtbaren Namen Ranger-Wissen. Die 16 Modul-IDs, 76 Erklärungspunkte und vorhandenen Freigaben/Anpassungen bleiben bestehen. Basistext und Bilder stammen ausschließlich aus dem neu gelieferten Ausgabe-4-Ausschnitt. Alle 43 Originalgrafiken erscheinen in passenden Ansichten bzw. aufklappbaren Galerien. Das Motto besitzt keine separate Originalabbildung und verwendet die belegte Typografie „SEI BEREIT“. Die [Modul-/Bildzuordnung](V33-BIBLIOTHEK-QUELLEN.md) dokumentiert Herkunft und Grenzen.

## Tatsächliche Datenquellen

| Anzeige | Vorhandene Quelle und Berechnung |
| --- | --- |
| Nächstes Ereignis / Countdown | `db.meetings` und `db.leaderMeetings`; abgesagte/archivierte Termine ausgeschlossen; Datum und Startzeit in Europe/Berlin, Kalendertage für Heute/Morgen/Noch X Tage. Neuberechnung alle 30 Sekunden und beim Wiederanzeigen. |
| Wer macht was? | Vorhandene `food`, `action`/`actions`, `impulse`, `nature` und zugehörige Leiter-IDs. Einzelne Aktionen und Doings behalten ihre eigenen Verantwortlichen. Leitertreffen zeigen die tatsächliche Agenda/Info und vereinbarte Aufgaben. |
| Meine Aufgaben | Dieselben Quellobjekte wie in der Planung: Programmverantwortungen, Zutaten, Doings, verknüpfte Vor-/Nachbereitung und Leitertreffen-Aufgaben. Stabile IDs und Quellreferenzen verhindern Doppelungen. Nur vorhandene boolesche `done`/`completed`-Felder erhalten Häkchen; andere Verantwortungen verlinken zur Planung. Erledigte bleiben eingeklappt erhalten. |
| Anwesenheit | Tatsächlich erfasste `ANWESEND`, `ABWESEND`, `ENTSCHULDIGT` in relevanten, bereits begonnenen und nicht abgesagten Ranger-Treffen. Entschuldigte zählen wie bisher im Nenner. Ranger-Durchschnitt = arithmetisches Mittel der ungerundeten Einzelquoten mit Nenner. Ohne Erfassung erscheint „—“. |
| Wachstum | Vorhandenes `v24Count` für alle fünf Stufen einschließlich bestehender Aufgaben/Bonusregeln; kein 100-%-Wert bei 0/0. Profile bleiben die vorhandenen Profile. |
| Punkte und Kapitel | Bestehendes bestätigtes Fachwissen-/Bibeljournal; Kapitelabdeckung aus den Buchdatensätzen. Rangliste und Bücher-/Kapitelwerte verwenden denselben Stand. Leiter erhalten nur für ihre berechtigten Ranger Kapitelstatistiken. |
| Geburtstage | Bestehende aktive Personen mit hinterlegtem Datum, chronologisch die fünf nächsten Geburtstage, unter Beachtung des berechtigten Ranger-Bereichs. |

V31 ist im Repository als unveränderte Anwendung verfügbar. Planungsfelder und Schreibwege wurden aus der tatsächlich vorhandenen Implementierung übernommen. Es wurde keine zweite Aufgaben-, Rollen- oder Punktedatenbank eingeführt.

## Dateien, Sicherung und Auslieferung

- Neue Module: `rangerhub-navigation-v33.*`, `rangerhub-dashboard-v33.*`, `rangerhub-bible-chapters-v33.js`, `rangerhub-bible-views-v33.js`, `rangerhub-bible-v33.css`, `rangerhub-wisdom-catalog-v33.js`, `rangerhub-wisdom-views-v33.js`, `rangerhub-wisdom-v33.css`, `rangerhub-knowledge-v33.js`.
- Quellen/Originale: `assets/ranger-library/`, `data/ranger-wissen-content-v33.json`, interne `data/library-source-map-v33.json`; die fünf unveränderten Uploads bleiben ausschließlich privat unter `docs/reference/logbuch4/`.
- Backend: bestehender `backend/knowledge-server.mjs`, ergänzt um Kapitelbefehl und neuen Bibliotheks-Basiskatalog. Das bisherige Schema und die API bleiben erhalten.
- Build: `tools/build_v33.py`; öffentliche Demo `tools/build_demo_v33.py`. Prüfsummen und Bytegrößen: [v33-build.json](v33-build.json), [V33-SHA256SUMS](V33-SHA256SUMS).
- Sicherung **vor den Änderungen**: Git-Tag `backup/before-v33-logbuch4`, private Basis `27ded27bad16d2a84209f4e3a143ba5589f0f37c`, öffentliche Basis `c8f60951cf0469cef887051e1498e285a349a5bb`. Zusätzlich vollständige Sicherungen aller 466 privaten bzw. 517 öffentlichen zuvor getrackten Dateien unter `/workspace/rangerhub-delivery/V33/backup/`, jeweils mit SHA-256-Manifest. Die Baseline liegt auch im Repository unter `docs/v33-baseline.json`.

`RangerHub_Webapp_V33_Kompakt.html` bleibt unter 25 MB und lädt die Original-WebP-Dateien wie beauftragt aus `assets/ranger-library/`. Deshalb die App gemeinsam mit `assets/` und `vendor/` ausliefern und über HTTP öffnen. Die zusätzliche `RangerHub_Webapp_V33_Standalone.html` bettet dieselben 43 WebP-Bytes ein und ist etwa 33 MB groß; diese Variante überschreitet die 25-MB-Grenze ohne eine Reduktion von Original- oder Altmaterial. Beide Varianten erhalten alle 17 alten eingebetteten Assetreferenzen einschließlich zwölf PDF-Referenzen bytegleich. Die öffentliche Demo enthält keine privaten Quelldokumente und keine gebündelten PDFs.

## Prüfung und Betriebsgrenzen

Ausgeführte Tests und geprüfte Screenshots stehen im [Testbericht](V33-TESTBERICHT.md). Lokaler Einstieg: `python -m http.server 8000`, danach `index.html`. Vollständiger aktueller Prüflauf: `python tools/check_v33.py` mit Playwright/Chromium und Node 24.

Die gemeinsame Fachwissen-/Bibel-/Bibliotheks-API ist implementiert und lokal mit unabhängigen Browserprofilen geprüft. Die Demo verwendet weiterhin den lokalen Speicher des jeweiligen Browserprofils. Ein produktiver Server und persönliche Online-Zugänge sind nicht konfiguriert; Chat, Fotos, Anwesenheit und übrige Verwaltungsdaten werden dadurch nicht automatisch geräteübergreifend synchron. Details: [V33-BACKEND.md](V33-BACKEND.md).
