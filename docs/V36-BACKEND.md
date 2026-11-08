# V36 – Betrieb der zentralen Vertreterrechte

V36 erweitert den vorhandenen Node-24-/SQLite-Dienst `backend/knowledge-server.mjs`, statt eine zweite Anwendung oder neue Anmeldung anzulegen. Die Grundkonfiguration aus [V35-BACKEND.md](V35-BACKEND.md) bleibt gültig:

- `RANGERHUB_KNOWLEDGE_DB`: persistente SQLite-Datenbank.
- `RANGERHUB_PRINCIPALS`: geschützte persönliche Anmeldekonfiguration mit vorhandener Mitglieds-ID, Heimatstamm, Art, Token-Hash und Ablauf. Keine Client-Rolle als Identität.
- `RANGERHUB_ORIGIN`: genau eine erlaubte HTTPS-Frontend-Origin.
- `RANGERHUB_ASSET_DIR`: persistenter privater Bildordner.
- Optional `RANGERHUB_KNOWLEDGE_PORT`; KI-Schlüssel und Modell ausschließlich serverseitig und optional wie in V35.

Start: `node backend/knowledge-server.mjs`, anschließend vorhandenen HTTPS-Reverse-Proxy verwenden. Der Dienst bindet nur an Loopback. Das Frontend nutzt weiterhin `RangerHub.createHttpKnowledgeTransport({baseURL,getAccessToken})` und `RangerHub.setKnowledgeTransport(...)`. Der Token muss zur gerade ausgewählten echten Person gehören.

## Erweiterung und Migration

Neue Datei `backend/delegation-v36.mjs` ergänzt zwei Tabellen:

- `delegation_events_v36`: unveränderliche Vergabe-/Widerrufsereignisse mit Identität, Person, Reichweite, Stamm, Beginn, Ablauf, Mitgliedschaftsrevisionen, Zeit und optionalem Grund. SQL-Trigger verhindern UPDATE und DELETE.
- `management_v36`: pro Stamm versionierte fachliche Verwaltungsdaten für Leitermeetings, eigene Termine, Aufgaben, Vorlagen, Rezepte, Teams und Abwesenheiten.

Die vorhandenen Knowledge-, Mitgliederstatus-, Bibel-, Prüfungs- und Punktejournale bleiben bestehen. Ein ausdrücklicher Import übernimmt bestehende Verwaltungsdaten einmal; erneuter Import überschreibt weder zentrale Mitgliedschaftsereignisse noch Verwaltungsrevisionen oder Vertreterereignisse. Bestehende Personen werden über ihre vorhandenen IDs weiterverwendet.

Zugriffsentscheidungen verwenden die originäre Rolle und bei Bedarf eine aktuell gültige zusätzliche Vertretung. Globale Vertretung erweitert den fachlichen Adminzugriff auf alle Stämme; lokale Vertretung nur die Stammleiterfunktionen im festgelegten Stamm. Die originäre Mitgliedsrolle wird nicht umgeschrieben. Token- und Secret-Verwaltung sind keine delegierbaren Endpunkte. Geschützte originäre Verwaltungskonten können Vertreter nicht über Profildaten oder Statusänderungen übernehmen.

Mitgliedschaftsrevisionen sind an die Vergabe gebunden. Pause/Austritt sowie spätere Wiederaktivierung machen alte Vergaben dauerhaft unwirksam. Auch der Aussteller muss weiterhin aktiv und originär berechtigt sein. Die Gültigkeit wird auf dem Server geprüft, nicht anhand der Uhr oder einer Rolle im Browser.

## API

Vorhandener Einstieg bleibt `POST /knowledge/commands?stammId=…` mit persönlichem Token, `type`, `payload` und `requestId`:

- `delegation-grant`: bestehende Leiter-ID, Heimatstamm, `scope` global/local, Zielstamm bei local, `startsAt`, optional `expiresAt`, aktuelle globale Delegationsrevision, `confirmed: true`, optionaler Grund.
- `delegation-revoke`: Vergabe-ID, aktuelle Delegationsrevision, ausdrückliche Bestätigung und optionaler Grund.
- `management-change`: erlaubte Sammlung, deren vollständiger neuer fachlicher Stand und aktuelle Verwaltungsrevision. Unbekannte Sammlungen, unzulässige Kennungen und Prototype-Felder werden abgewiesen.
- `person-change`: vorhandene Person beziehungsweise berechtigt neu anzulegendes Mitgliedsprofil und ausdrücklich erlaubte Stammdatenfelder mit Profilrevision. Rolle, Mitgliedschaft, Authentifizierungsdaten und fremde IDs können dadurch nicht umgeschrieben werden. Ein neues Profil erzeugt kein persönliches Zugangstoken.

Die vorhandenen Kalender-, Katalog-, Prüfungs-, Status-, Bild-, Publikations- und KI-Aktionen erhalten denselben zentral abgeleiteten Berechtigungskontext. Kalenderänderungen behalten ihre Compare-and-Swap-Revision. Ankommende POST-Daten werden vor der eigentlichen Mutation erneut autorisiert; eine zwischenzeitlich widerrufene Vertretung kann nicht mit einem früheren UI-Stand veröffentlichen.

`GET /knowledge` enthält zusätzlich den für die Person zulässigen Delegationsstand und Verwaltungsstand. Ranger erhalten keine fremden Kontakte oder Vertreterverwaltung. Interne Mitgliedschaftsnotizen bleiben auf berechtigte Verwaltung beschränkt. Die App übernimmt die serverbestätigte originäre Rolle und wirksame Vertretung nur für die passende Identität; manipulierte Browserrollen wirken nicht auf API-Rechte.

Gleichzeitige veraltete Verwaltungs-/Vertreteränderungen erhalten einen Revisionskonflikt statt stiller Überschreibung. Identische `requestId` mit identischem Auftrag bleibt idempotent. Ereignisse sind transaktional gespeichert. UTC-Zeitpunkte werden aus der lokalen Datum-/Zeitwahl übernommen; die deutsche Oberfläche wird in Europe/Berlin geprüft.

## Sicherung und Auslieferungszustand

Vor produktivem Upgrade konsistente SQLite-Sicherung, privaten Bildordner und geschützte persönliche Anmeldekonfiguration gemeinsam sichern. Den Dienst zum einfachen Dateikopieren sauber stoppen oder die SQLite-Backupfunktion verwenden; eine laufende WAL-Datenbank nicht durch unkoordiniertes Kopieren nur der Hauptdatei sichern.

Dieser Auftrag hat keine echte Produktionsdatenbank, keine echten persönlichen Tokens und keinen produktiven API-Anbieter eingerichtet. Die Rechteprüfung ist implementiert und mit realem lokalen HTTP-/SQLite-Testdienst geprüft. Die Demo zeigt ohne API bewusst keine global wirksame Freischaltung. Lokale Browserdaten sind keine sichere Instanz für Rechte anderer Geräte.
