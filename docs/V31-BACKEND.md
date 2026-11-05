# Bibellesen – zentrale Anbindung und noch nötige Aktivierung

Die Bibellese-Funktion verwendet den vorhandenen Fachwissen-Dienst, dieselbe persönliche Anmeldung, dieselben Stamm-/Ranger-IDs und dieselbe SQLite-Datenbank. Es wurde kein zweiter Dienst und kein externer kostenpflichtiger Speicher eingerichtet.

Die öffentliche Vorschau bleibt eine **lokale Demo**. Für dauerhafte gemeinsame Speicherung fehlen weiterhin ein produktiver Node-24-Host mit dauerhaftem Datenträger, HTTPS, persönliche Online-Zugänge und die konkrete Frontend-Konfiguration. Die bestehende Einrichtung ist in [V30-BACKEND.md](V30-BACKEND.md) beschrieben und gilt weiterhin. GitHub Pages stellt die App kostenlos statisch bereit, führt den Node-/SQLite-Dienst aber nicht aus.

## Aktualisierung eines vorhandenen Dienstes

Vor Update Datenbank mit SQLite-sicherem Backup einschließlich WAL sowie bisherige Dateien sichern. Kein leerer Neuimport anstelle einer bestehenden Datenbank. Den vorhandenen `backend/knowledge-server.mjs`, unveränderte Fachwissen-Grundmodule und zusätzlich `rangerhub-bible-catalog.js` und `rangerhub-bible-model.js` aus derselben geprüften V31-Lieferung bereitstellen. `data/knowledge-normalized.json` bleibt notwendig. Der Bibelkatalog wird aus der unveränderten hochgeladenen JSON generiert und von Browser und Server identisch verwendet.

Die vorhandenen Umgebungsvariablen bleiben gültig:

- `RANGERHUB_KNOWLEDGE_DB`: bisherige private SQLite-Datei.
- `RANGERHUB_PRINCIPALS`: persönliche Tokenhashes mit bestehender ID, Heimatstamm und Ablaufdatum, außerhalb von Git/Webroot.
- `RANGERHUB_ORIGIN`: exakt erlaubte HTTPS-Origin der App.
- Optional `RANGERHUB_KNOWLEDGE_PORT` für den Loopback-Port.

Dienst starten: `node backend/knowledge-server.mjs`. Die Transaktionsmigration ergänzt die Lesestatus-Projektion und gegebenenfalls kanonische Bibelbuchungen. Der übrige Datenbestand wird weder gelöscht noch mit Beispielen überschrieben. Rollen werden weiterhin bei jedem Zugriff aus vorhandener Mitgliedschaft gelesen. Keine globalen Admin-Schlüssel im Browser.

Nach tatsächlicher persönlicher Anmeldung bleibt derselbe Frontend-Aufruf gültig:

```js
RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({
  baseURL: 'https://DEINE-PRIVATE-API.example',
  getAccessToken: async () => persoenlicheAnmeldung.accessToken()
}));
```

Die gezeigte `persoenlicheAnmeldung` muss an den realen Auth-Dienst angebunden sein. Ein komfortabler E-Mail-/QR-Registrierungsdienst wird hierdurch nicht zusätzlich produktiv eingerichtet.

## Neue Operation

`POST /knowledge/commands?stammId=…`, vorhandene persönliche Bearer-Anmeldung und `requestId`:

```json
{
  "type": "set-bible-read",
  "payload": {"bookId":"bible-01","isRead":true,"version":0},
  "requestId":"PERSOENLICHE-EINDEUTIGE-AUFTRAGS-ID"
}
```

Nur der angemeldete Ranger darf schreiben. Keine vom Client vorgegebene Personen-ID, Rolle, Punktzahl, Datei oder Textantwort. Nur 66 kanonische Bücher. `isRead` muss explizit boolesch und die Version gültig sein. Markieren/Rücknehmen ist nicht an Treffen, Leiter, Begründung oder ein Prüfungslimit gebunden. Leiter/Admin erhalten für ihren erlaubten Stamm/Team nur Lesezugriff auf die Lesestatus.

Gleicher Zustand erzeugt keine weitere Gutschrift. Ein veralteter Gegenzustand führt zu einem Konflikt; der Client lädt den aktuellen Zustand und fordert eine bewusste neue Entscheidung. Eine alte Markierung wird nach Rücknahme nicht im Hintergrund erneut abgesendet. Keine automatische Offline-Schreibwarteschlange. Bei Netzwerk-/Speicherfehlern wird kein vermeintlicher lokaler offizieller Erfolg behauptet.

Status, Version, Journal, eindeutige aktive Buchung, SQL-Projektion und Auftrags-ID werden innerhalb des vorhandenen `BEGIN IMMEDIATE` gemeinsam gespeichert. Rücknahme storniert nur die aktive Bibelbuchung. Übrige Aufgabenpunkte und Bewertungen sind davon unabhängig. Die vorhandenen Journal-Update-/Delete-Sperren bleiben aktiv.

Die Migration unterstützter 395er-Records wurde mit allen 66 als gelesen markierten Büchern und genau 395 alten Punkten in SQLite geprüft: danach exakt 240 aktuelle Bibelpunkte, alle Markierungen erhalten und bei erneutem Start keine Doppelbuchung. Unklare Altformate werden nicht geraten oder zurückgesetzt; Details in der [Übergabe](V31-UEBERGABE.md).

## Tatsächliche Prüfung und Grenzen

Echte lokale HTTP-Tests einschließlich paralleler Geräte, doppelter Requests, Rollen-/Stamm-/Teamgrenzen, vollständiger Rücknahme, normaler Prüfungen und SQLite-Neustartmigration. Zusätzlich drei unabhängige Browser-Speicher: zwei Geräte desselben Rangers und eine nur lesende Leiteransicht. Markieren auf einem Gerät und Rücknahme auf dem anderen aktualisieren die gemeinsame Rangliste nach Laden/Synchronisieren.

Aktualisierung erfolgt bei Aktionen, Sichtbarwerden und im Onlinebetrieb im vorhandenen 30-Sekunden-Intervall. Ein produktiver Endpunkt wurde nicht bereitgestellt; die öffentliche Demo synchronisiert weiterhin nicht zwischen fremden Geräten. Chat, Fotos und Wachstumspfad behalten ihre bisherigen Speichergrenzen.

Prüfen: `node --test backend/test-bible-v31.mjs backend/test-knowledge-v30.mjs`, vollständige Appabnahme: `python tools/check_v31.py`. Nach tatsächlicher Einrichtung sind produktives HTTPS, persönlicher Auth-Dienst und echte Geräte nochmals gegen die konkrete Bereitstellung abzunehmen.
