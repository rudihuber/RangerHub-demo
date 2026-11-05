# RangerHub – Bibellesen: Umsetzung und Übergabe

## Stand und Sicherung

Die Erweiterung basiert auf der unveränderten, zuletzt getesteten V30-App. Neuer Stand: V31. Kein Neubau, keine parallele App und keine Rücksetzung des vorhandenen Speichers. Privat bleibt `rhv9`, die öffentliche Demo verwendet weiterhin getrennt `rhv9-demo`.

Vor Beginn wurden **272 private Dateien** und **316 Demo-Dateien** vollständig gesichert und anhand SHA-256 überprüft. Git-Sicherungstag: `backup/before-bible-reading-2026-11-05`. Backup-Commit privat `b2b4008552eea8aa76b7761ac09213c8dc1815c6`, Demo `cfcaf20491d3426d2b6d44214fc5ae299a97876c`. Die Dateiprüfsummen stehen in `docs/v31-baseline.json`; die unveränderten Backupordner liegen im Lieferverzeichnis unter `Bibellese/backup/2026-11-05/`. V30-HTML und bisherige Module bleiben im Repository unverändert erhalten.

Die private Umsetzung liegt auf `feature/v31-bible-reading`; der private Hauptbranch `main` bleibt bis zur Abnahme unverändert. Die öffentliche Demo enthält ausschließlich ihre bisherigen fiktiven Profile und keine privaten PDFs.

## Datenquelle und neue Punkte

Die hochgeladene JSON-Datei `data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json` ist unverändert die kanonische Quelle. SHA-256: `ea4f106082ca515d57efc74c93f0020d0f5ad6bed43942df0452fed11d88685f`.

`tools/build_bible_catalog.py` erzeugt daraus den gemeinsamen eingefrorenen Browser-/Serverkatalog: 66 stabile IDs `bible-01` bis `bible-66`, kanonische Reihenfolge, 39 AT-Bücher/187 Punkte und 27 NT-Bücher/53 Punkte. Keine manuelle Abschrift oder zusätzliche Buchpunkte. Gesamtwert **240**. Keine Kapitel-/Lesezeit-/Abzeichen-Bonuspunkte.

Das normale bekannte Fachwissen-Maximum wird aus den tatsächlich sichtbaren Aufgaben inklusive gültiger Alternativwerte berechnet, nicht fest in die UI geschrieben. Unveränderte Basis: 1.358 + 240 = **1.598 ausgewiesene Punkte**. Drei normale Aufgaben haben weiterhin ungeklärte Quellpunkte; spätere autorisierte Klärungen/Redaktionen ändern den aktiven Katalogwert. Bereits verdiente übrige Fachwissen-Punkte ändern sich dadurch nicht.

## Bibliothek und Bedienung

Einstieg: Fachwissen → Glaube & Gemeinschaft → vorhandener Ort Bibelbibliothek. Zunächst erscheinen zwei interaktive Regale für AT und NT. Erst die bewusste Regalwahl zeigt die zugehörigen Buchrücken, erst ein Buch öffnet seine Detailkarte. Vollständiger Name, Kapitel, Punkte und eindeutiger Status sind vorhanden. Die bisherigen sieben Fachwissen-Aufgaben zum Thema Die Bibel bleiben über einen eigenen Einstieg in der Bibliothek erreichbar und behalten ihre Leiterprüfung.

Markieren fragt: „Hast du das ganze Buch … gelesen?“ Abbrechen vergibt nichts. Bestätigung markiert unmittelbar vollständig gelesen und schreibt genau den Buchwert gut. Die dauerhafte Aktion „Markierung zurücknehmen“ benötigt weder Leiter noch Grund und zieht genau diesen Wert wieder ab. Erneutes Markieren bringt wieder nur denselben Buchwert. Nach jeder Änderung erscheint kurz eine auch auf Touchgeräten bedienbare Rückgängig-Aktion innerhalb des nativen Buchdialogs.

Suche, Alle/Offen/Gelesen-Filter, große Buchflächen, kanonische Reihenfolge, Goldmarkierung plus Häkchen/Text/ARIA, Tastaturfokus und reduzierte Animationen sind umgesetzt. Browser-Zurück, Detail-Zurück, Direktlinks, Reload und Scrollposition der Regale werden unterstützt. Keine Bibeltexte, Fotos, Dateien, Videos oder Antworten gespeichert.

## Dashboard, Profil und Rangliste

Die vorhandenen beiden Dashboardkarten bleiben bestehen. Eine kompakte „Meine Bibelreise“ zeigt Bücher x/66, Punkte x/240 und Fortschritt mit direktem Bibliothekseinstieg. Die gemeinsame Fachwissen-Gesamtsumme, Rangerprofil, Top 3 und vollständige Stammesrangliste enthalten normale bestätigte Aufgabenpunkte plus aktuell aktive Bibelpunkte. Aufgabe-bestanden-Zähler bleiben auf die normalen Prüfungen bezogen; gelesene Bücher werden gesondert ausgewiesen. Die Arena bleibt ausschließlich Rangliste.

## Persistenz, Journal und Rechte

Der bisherige `knowledge`-Datensatz mit `schema:2` wird rückwärtskompatibel um `bibleReading` ergänzt:

```
bibleReading: {
  schema: 1,
  catalogVersion: "bible-reading-v2-240",
  records: { rangerId: { bookId: { isRead, version, updatedAt } } }
}
```

Nur Status und wenige Metadaten pro Ranger/Buch. Kein eigener Gesamtpunktestand als zweite Wahrheit. Eine aktive Markierung besitzt im vorhandenen append-only Journal genau eine `bible-credit`-Buchung mit `source:bible_reading` und stabiler Buch-ID. Rücknahme hängt eine passende `bible-reversal`-Buchung an. Alte Journalzeilen werden nicht geändert oder gelöscht. Status, Journal, Revisionsnummer und SQLite-Projektion werden gemeinsam in der vorhandenen Transaktion gespeichert; der bestehende eindeutige Index für aktive Gutschriften schützt auch Buch-IDs.

Die Summe der aktiven Bibelbuchungen wird mit den aus den Statusdaten berechneten kanonischen Punkten auf Konsistenz geprüft. Normale Fachwissen-Gutschriften und Prüfungen werden getrennt beibehalten. Lesemarkierungen tauchen nicht in der offenen Leiter-Prüfungsliste auf und belegen keinen der drei Prüfungsplätze.

Neuer Befehl über die bestehende API: `set-bible-read` mit ausschließlich `{bookId, isRead: true|false, version}`. Kein blindes Toggle. Identische Zustände/Request-IDs sind idempotent. Veraltete Gegenzustände werden abgewiesen und der aktuelle Stand geladen; kein stilles Wiedereinspielen einer alten Markierung nach Rücknahme. Der Server prüft vorhandene Mitgliedschaft, persönlichen Rangeraccount und Heimat-/aktiven Stamm. Fremde IDs, Punkte, Anhänge und ungültige Bücher werden abgewiesen. Leiter, Stammleiter und Admin können zugelassene Ranger-/Teamdaten ansehen, aber keine fremden Lesemarkierungen ändern. Ihre bestehenden Redaktionsrechte für normale Fachwissen-Aufgaben bleiben erhalten; die kanonischen Buchwerte sind für alle Stämme identisch.

SQLite-Tabelle `knowledge_bible_reading` ist eine transaktional aktualisierte Projektion des bestehenden Fachwissen-Zustands mit eindeutigem Schlüssel `(stamm_id,ranger_id,book_id)`, kein unabhängiges Fortschrittssystem. Die bestehende persönliche HTTP-Anbindung und Rollenprüfung werden wiederverwendet. Neue Lesemarkierungen haben eigene technische Burstbegrenzung; Rücknahme hat keine Prüfungs-/Schreibquote. Die allgemeinen Verbindungs- und API-Schutzmechanismen bleiben bestehen.

## Migration früherer Entwürfe

Im tatsächlich gesicherten V30-Stand war keine 395-Punkte-Lesefunktion vorhanden. Die normale Erweiterung fügt deshalb nur einen leeren Bibellesezustand hinzu; bestehende Personendaten, Prüfungen und Journalbuchungen bleiben unverändert.

Zusätzlich implementiert und mit Modell, Browser und echter SQLite-Neustartmigration geprüft: ausdrücklich zugeordnete ältere `bibleReading`-/`bibleProgress`-Records mit 395er-Katalog, `isRead`/`completed`-Flags und Buch-IDs aus der kanonischen Liste. Bereits gelesene Bücher bleiben markiert. Historische Bibelgutschriften werden durch zusätzliche Stornos neutralisiert und einmal nach der 240er-Liste bewertet; keine Addition zum alten 395er-Saldo. Das alte Format bleibt als `bibleReadingLegacy` erhalten. Wiederholter Import/Neustart migriert nicht nochmals.

Alte Buch-Prüfungsanmeldungen werden mit ursprünglichem Status im Verlauf als Lese-Migrationsfall erhalten; offene Anmeldungen gelten nicht automatisch als gelesen. Sie werden aus dem aktiven Prüfungsworkflow/Plätzelimit genommen. Die Bibliothek weist den Ranger auf diese noch offenen Bücher hin. Normale Aufgabenprüfungen werden dabei nicht verändert. Nicht eindeutig zuordenbare ältere Daten werden mit klarer Fehlermeldung abgewiesen statt zurückgesetzt oder geraten.

## Dateien, Build und nächste Schritte

Neu: `rangerhub-bible-catalog.js`, `rangerhub-bible-model.js`, `rangerhub-bible-views.js`, `rangerhub-bible.css`, `rangerhub-knowledge-v31.js`, kanonisches JSON, neue V31-HTML, Builder und Tests. Geändert: tatsächlicher aktueller Einstieg `index.html`, vorhandener Backenddienst, Browser-Testziel und Dokumentation. Die Anpassung der bestehenden 36-Themen-Navigation im Test berücksichtigt ausschließlich den bewusst neuen Zwischenschritt über die Bibliothek.

Privater Build: `python tools/build_bible_catalog.py`, dann `python tools/build_v31.py`. Demo: `python tools/build_demo_v31.py`. Die private HTML bleibt unter 25 MB und verwendet weiterhin die vorhandene verlustfreie Verpackung. Originalassets/PDFs und andere Inline-Skripte bleiben unverändert; `assets/` und `vendor/` weiterhin vollständig mitliefern.

Aktuelle Abnahme: `python tools/check_v31.py`. Einzelheiten: [Testbericht](V31-TESTBERICHT.md), [Backend](V31-BACKEND.md), [SHA-256](V31-SHA256SUMS).

Der produktive gemeinsame Onlinebetrieb ist weiterhin nicht aktiviert. Die vorhandene zentrale Implementierung wurde erweitert und mit getrennten Browserprofilen geprüft. Dauerhafter HTTPS-Host, persönliche Authentifizierung und konkrete Frontend-Konfiguration bleiben Betreiberaufgaben. Die öffentliche Demo ist ehrlich als lokal gekennzeichnet; Chat/Fotos/Wachstumspfad werden durch diese Erweiterung nicht zu einer behaupteten Cloud-Synchronisation.
