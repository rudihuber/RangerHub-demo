# V32 – gemeinsame Freigaben und noch offene Produktiveinrichtung

Die ausgelieferte Demo läuft weiterhin ohne gemeinsamen Server. Fachwissen, Bibelreise, Ranger-Wissen-Anpassungen und Freigaben gelten dort **für dieses Browserprofil**. Die private HTML behält `rhv9`, die öffentliche Demo ihren zuvor vorhandenen getrennten Key `rhv9-demo`.

## Vorhandene Implementierung

Der bisherige Node-24-/SQLite-Dienst wurde erweitert, keine weitere App oder Datenbank eingeführt. Ranger-Wissen verwendet dieselbe persönlich authentifizierte `/knowledge`-API und den neuen Befehl `wisdom-change`. Die lokale Schicht verwendet denselben Transport und vorhandene Web Locks. HTTP-Fehler lösen keinen stillen lokalen Fallback aus.

- Global: vorhandene Tabelle `knowledge_global_catalog`, JSON-Feld `rangerWisdom` mit Einträgen, Overrides, Revisionen und Audit.
- Pro Stamm: vorhandene Tabelle `knowledge_stamms`, `state_json.rangerWisdom` mit eigenen Einträgen/Overrides. Lokale Änderungen wirken nur im betreffenden Stamm.
- `BEGIN IMMEDIATE`, vorhandene Request-Idempotenz und Revisionsvergleich schützen gleichzeitige Änderungen.
- Die Serveridentität stammt ausschließlich aus dem persönlichen Token und importierten bestehenden Rollen. Client-Rolle, fremde Stamm-ID oder fremde Ranger-ID verleihen keine Rechte.
- Admin global und lokal; Stammleiter lokal im eigenen Stamm; Leiter und Ranger können Ranger-Wissen nicht verändern. Die Fachwissen-Redaktionsdelegation verleiht ausdrücklich keine Ranger-Wissen-Publikationsrechte.
- Ranger-API-Snapshots enthalten ausschließlich effektiv veröffentlichte, nicht archivierte Themen, ihre Symboltexte und nicht leere Gruppen. Kein interner Quellseiten-Metadatensatz, keine verborgenen Texte und keine Verwaltungslayer im Ranger-Snapshot. URL-Routen/Suche arbeiten ausschließlich mit diesen freigegebenen Daten.
- Alle bisherigen Prüfungs-, Bibelreise- und Punkte-Regeln bleiben im bestehenden Modell und Journal erhalten.

## Vor Produktivbetrieb noch einzurichten

1. Persistenter Server mit Node 24+, SQLite-Datei außerhalb der öffentlichen Website, Sicherung und HTTPS-Reverse-Proxy. Server startet ausschließlich auf Loopback, standardmäßig Port 8787.
2. Bestehende Stamm-/Mitglieds- und Kalenderdaten kontrolliert über den bereits vorhandenen Import übernehmen. Vorhandene Fachwissen-Punkte/Lesemarkierungen erfordern weiterhin die bewusste Option `includeVerifiedKnowledge`; kein Zurücksetzen und kein stilles Überschreiben vorhandener Serverstände.
3. Persönliche, ablaufende Zugangsdaten mit SHA-256-Tokenhash und bestehenden IDs/Rollen konfigurieren. Keine Tokens in Git/HTML/LocalStorage speichern. Der bisherige Demo-Profilwechsel ist **keine sichere Online-Anmeldung**.
4. `RANGERHUB_KNOWLEDGE_DB`, `RANGERHUB_PRINCIPALS`, `RANGERHUB_ORIGIN` auf den realen Host/Frontend-Origin setzen; optional `RANGERHUB_KNOWLEDGE_PORT`. Keine Beispiel-Zugangsdaten werden automatisch angelegt.
5. Nach persönlicher Anmeldung `RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL, getAccessToken}))` verbinden. Der Adapter gleicht die Serveridentität mit dem bestehenden App-Profil und aktiven Stamm ab.
6. Für vertrauliche zukünftige Lerninhalte eine authentifizierte Frontend-Auslieferung verwenden: Die portable/offline App und öffentliche Demo enthalten den vorbereiteten Basiskatalog zum lokalen Testen. Deren statische JavaScript-Dateien sind grundsätzlich lesbar; eine ausgeblendete öffentliche Demo-Lektion ist kein geheimes Dokument. Der getestete Server filtert die API dagegen tatsächlich nach Rolle und Veröffentlichung. Interne Quell-PDF und Seitenmetadaten werden nicht in der öffentlichen Demo veröffentlicht.
7. Betrieb, persönliche Authentifizierung, Import und echte Geräte anhand des Testberichts abnehmen. Eine Zahlungspflicht oder ein bestimmter Hosting-Anbieter wird durch V32 nicht eingeführt.

Bestehende Betriebsdetails und Importablauf: `docs/V30-BACKEND.md` und `docs/V31-BACKEND.md`. Kalender-Synchronisation und Stammgrenzen bleiben dieselben. Die gesamte Verwaltungs-App, Chat, Fotos und persönliche Kontakte sind damit weiterhin nicht automatisch vollständig online: V32 erweitert den vorhandenen Fachwissen/Bibelreise-Dienst um Ranger-Wissen; es behauptet keine eingerichtete Gesamtsynchronisierung.

## Reproduzierbare Serverprüfung

`node --test backend/test-knowledge-v30.mjs backend/test-bible-v31.mjs backend/test-wisdom-v32.mjs`

Zusätzlich echte Mehrgeräte-Browsertests: getrennte Ranger-/Leiter-Browserprofile mit eigenem lokalen Speicher, derselbe temporäre HTTP-/SQLite-Dienst; Anmeldung/Ergebnisse, Lesemarkierung/Rücknahme und Freigabeänderungen werden unabhängig abgefragt.
