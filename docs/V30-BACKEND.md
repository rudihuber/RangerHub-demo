# Fachwissen: zentrale Speicherung aktivieren

## Was tatsächlich läuft

Die öffentliche Vorschau speichert weiterhin nur in ihrem bestehenden Browserprofil. GitHub Pages liefert die App kostenlos aus, betreibt aber keinen Node-Prozess und keine gemeinsame SQLite-Datenbank. Es wurde kein kostenpflichtiger Dienst eingerichtet.

Der vorhandene zentrale Dienst wurde für persönliche Prüfungen, Inhalte, Kalenderbezüge und Rangliste erweitert. Browser und Server verwenden dieselben V30-Regeln. Er wurde über echtes HTTP und mit drei voneinander getrennten Browser-Speichern getestet: Anmeldung am Rangergerät, Bewertung am Leitergerät, aktualisierte Rangliste beim zweiten Ranger, erneutes Laden mit bestehender persönlicher Online-Zuordnung. Das ist ein Test der Implementierung, keine Behauptung eines bereits aktivierten Produktivservers.

## Noch einzurichten

1. Node 24 mit dauerhaftem privatem Datenträger und HTTPS-Reverse-Proxy. SQLite darf nicht auf einem flüchtigen Serverless-Dateisystem liegen. Hostingtarif oder eigener vorhandener Server sind Betreiberentscheidung; es besteht kein gebuchter Vertrag.
2. Kontrollierter Export der vorhandenen RangerHub-Stämme/Personen/Rollen und echten Rangertreffen. Keine neuen Personen oder erfundenen Termine erzeugen.
3. Persönliche Zugangsdaten bzw. ein bestätigter Authentifizierungsdienst mit Zuordnung zu bestehender Personen-ID und Heimatstamm. Die Demo-Profilwahl ist keine Online-Authentifizierung. E-Mail-/QR-Registrierung wird durch diese Fachwissen-Erweiterung nicht produktiv eingerichtet.
4. Eine exakt erlaubte Frontend-Origin, HTTPS-API-Adresse und Einbindung des persönlichen Tokens nach jeder erfolgreichen Anmeldung/Appinitialisierung.
5. Geschützter Datenbank-/Credentialpfad außerhalb des Website-Verzeichnisses, Backups einschließlich SQLite-WAL, Ablauf/Widerruf persönlicher Tokens und Prüfung der tatsächlichen Mitgliedschaft.

## Kontrollierter Erstimport

```sh
node backend/import-existing.mjs /secure/knowledge.sqlite /secure/rangerhub-export.json /secure/principals-template.json
```

Importiert bestehende IDs, Rollen, Alias, Namen ausschließlich für die Leiteransicht, Teamzuordnung und minimale Kalenderdaten. Keine Adressen, Geburtstage, Fotos oder Logbuch-PDFs. Bei vorhandenem lokalen Fachwissen oder globalen Anpassungen wird der ungeprüfte Erstimport vollständig abgelehnt. Erst nach Betreiberprüfung ausdrücklich `--include-verified-knowledge` anhängen. Lokale Demo-Bestätigungen beweisen keine echte Prüfung; keine Exporte unkontrolliert addieren.

Ein wiederholter Personenimport aktualisiert die Mitgliedschaft und setzt den zentralen Prüfungsstand nicht zurück. Ein vorhandener zentraler Basiskatalog wird nicht durch einen Export überschrieben. Vorhandene Schema-1-Daten werden beim Start idempotent migriert; Ledger und altes Nachweis-/Duellarchiv bleiben erhalten. Bei ungültigen/doppelten Bestandsbuchungen verweigert der Dienst den Start statt Daten zu löschen.

Das Credentialtemplate ist absichtlich nicht startfähig. Für jede vorhandene Person ein eigenes zufälliges, ausreichend langes Token außerhalb von Git erzeugen, SHA-256 und Ablauf eintragen. Eintrag:

```json
{"homeStammId":"clp-west","kind":"rangers","id":"VORHANDENE_ID","tokenHash":"SHA256_DES_PERSOENLICHEN_TOKENS","expiresAt":"EXPLIZITES_ABLAUFDATUM"}
```

Keine echte Zugangsinformation in HTML, Dokumentation, Git oder öffentliche Demo schreiben. Rechte für die Credentialdatei auf 0600 begrenzen. Die Rolle kommt bei jedem Zugriff aus der importierten Mitgliedschaft, nicht aus dem Template oder Browser. Token darf nur zu einer Person gehören. Zum Widerruf Eintrag entfernen und Dienst neu starten bzw. am persönlichen Auth-Dienst widerrufen.

## Start und Frontend

```sh
RANGERHUB_KNOWLEDGE_DB=/secure/knowledge.sqlite \
RANGERHUB_PRINCIPALS=/secure/principals.json \
RANGERHUB_ORIGIN=https://DEINE-PRIVATE-APP.example \
node backend/knowledge-server.mjs
```

Bindet nur an `127.0.0.1:8787` (Port über `RANGERHUB_KNOWLEDGE_PORT`). Reverse-Proxy für `/knowledge` und `/knowledge/commands`, HTTPS, Requestlimits und exakt passende CORS-Origin konfigurieren.

Nach tatsächlicher persönlicher Anmeldung und nach jedem Appstart:

```js
RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({
  baseURL: 'https://DEINE-PRIVATE-API.example',
  getAccessToken: async () => persoenlicheAnmeldung.accessToken()
}));
```

`persoenlicheAnmeldung` ist vom Betreiber an die vorhandene Anmeldung anzubinden; kein globaler oder gemeinsamer Admin-Schlüssel. Die API prüft Benutzer-ID, Rolle, aktiven Stamm, Heimatstamm und Team unabhängig vom Browser. Eine abweichende persönliche Identität wird auch im Frontend abgewiesen. Verbindungs-/Berechtigungsfehler werden angezeigt; es gibt keinen stillen Rückfall zu lokalen vermeintlich offiziellen Buchungen. Aktualisierung bei Aktionen, Sichtbarwerden der App sowie im Onlinebetrieb alle 30 Sekunden.

## Transaktionen und Rechte

`BEGIN IMMEDIATE` umfasst jeweils Lesen, Drei-Plätze-Prüfung, Resultat, Journal, Projektionen und Auftrags-ID. Identische Request-ID ist idempotent; Wiederverwendung für anderen Inhalt wird abgelehnt. Eindeutige Indizes schützen aktive Prüfungsregistrierungen und eine aktive Gutschrift je Stamm/Ranger/Aufgabe. Das bestehende Journal besitzt weiterhin Update-/Delete-Sperren.

- Ranger: eigene Anmeldung, rechtzeitiges Zurückziehen, bewusster Ersatztermin; keine Nachweis-/Punktefelder zugelassen.
- Leiter: eigener Stamm und zugeordnete Teams prüfen; lokale Redaktion bei erteiltem Recht.
- Stammleiter: gesamte eigene Stammesredaktion und begründete Ergebniskorrektur.
- Admin: globale Basis, lokale Anpassungen, autorisierter Stammwechsel.

Globale Tabelle `knowledge_global_catalog`, lokale Layers im vorhandenen `knowledge_stamms.state_json`; stabile Aufgaben-IDs und eingefrorene Buchungsfassungen. Alle globalen Änderungen werden auch gegen die bestehenden lokalen Kataloge validiert. Keine neuen Duell-/Upload-/Einreichungs-Endpunkte.

## Bestehender Kalender

Die API übernimmt die tatsächlichen bestehenden Treffen-IDs, Datum, Start/Ende, Ort, Thema, Team-/Rangerzuordnung und Absagestatus. Bearbeitungen über die vorhandene Treffenverwaltung werden mit Revisionsprüfung synchronisiert. Löschen eines gebuchten Treffens wird zentral zur Absage, nicht zur Vernichtung der Prüfungen. Keine automatische Anmeldung zu einem Ersatztermin. Die eigene Ranger-Abmeldung wird ebenfalls berücksichtigt.

Gleichzeitige Kalenderkonflikte werden gemeldet und nicht unbemerkt überschrieben. Bei ausgefallener API bleibt eine lokale Kalenderbearbeitung bestehen und die App meldet, dass sie noch nicht zentral bestätigt wurde. Vor weiteren zentralen Planungen muss die Verbindung wiederhergestellt und die Änderung erneut gespeichert/abgeglichen werden. Der Fachwissen-Dienst synchronisiert die für Prüfungen benötigten Kalenderdaten; er ersetzt keine vollständige Cloud-Migration aller bisherigen Planungsfelder, Fotos, Wachstumspfaddaten oder des Demo-Chats.

## Prüfung vor Produktiveinsatz

```sh
node --test backend/test-knowledge-v30.mjs
python tools/check_v30.py
```

Die tatsächliche produktive HTTPS-Adresse, den persönlichen Auth-Dienst und zwei echte Geräte nach Konfiguration zusätzlich abnehmen. Bisherige Tests verwenden lokale echte HTTP-Verbindungen und isolierte Browserprofile. Physisches iPhone/Safari konnte in dieser Umgebung nicht geprüft werden.
