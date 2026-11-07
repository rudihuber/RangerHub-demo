# V35 – zentrale Speicherung, Mitgliederstatus, Bildspeicher und optionale KI

Der bestehende Dienst `backend/knowledge-server.mjs` wurde erweitert. Er verwendet weiterhin Node 24 und die vorhandene SQLite-Datenbank, reale importierte Mitglieds-IDs und persönliche Zugangstoken. Es gibt keine neuen Demo-Konten, keine fest eingebauten Zugangsdaten und keine automatische Vergabe der Adminrolle durch Clientangaben.

## Erforderliche Konfiguration

| Variable | Bedeutung |
| --- | --- |
| `RANGERHUB_KNOWLEDGE_DB` | Absoluter Pfad zur vorhandenen bzw. explizit importierten SQLite-Datenbank. |
| `RANGERHUB_PRINCIPALS` | Geschützte Datei mit vorhandenen IDs, Heimatstamm, Art, SHA-256 des persönlichen Zugangstokens und Ablaufdatum. |
| `RANGERHUB_ORIGIN` | Genau eine zugelassene Frontend-Origin, z. B. `https://rangerhub.example.org`, ohne abschließenden Schrägstrich oder Pfad. |
| `RANGERHUB_ASSET_DIR` | Geschützter, persistenter Bildordner außerhalb des öffentlichen Webverzeichnisses. Für Online-Uploads erforderlich. |
| `RANGERHUB_KNOWLEDGE_PORT` | Optionaler lokaler Port, Standard 8787. |

Start: `node backend/knowledge-server.mjs`. Der Dienst bindet an Loopback; für den Betrieb ist ein HTTPS-Reverse-Proxy erforderlich. Proxy-Requestgrößen müssen Bild-Uploads bis 8 MiB erlauben. Persönliche Zugänge gehören in die vorhandene Anmeldung; die Frontend-Anbindung erfolgt über `RangerHub.createHttpKnowledgeTransport({baseURL, getAccessToken})` und `RangerHub.setKnowledgeTransport(...)`. `getAccessToken` muss das Token der aktuell angemeldeten Person liefern. Eine Auswahl im lokalen Demo-Profilmenü ersetzt diese persönliche Serveranmeldung nicht.

Bestehende Daten können mit `backend/import-existing.mjs` übernommen werden. Bereits vorhandene Knowledge-Buchungen benötigen die bewusste Option `--include-verified-knowledge` nach Prüfung. Bestehende zentrale Mitgliedschaftsereignisse werden beim erneuten Import nicht durch ältere Exportdaten ersetzt. Die bisherigen Punkte- und Statusjournale werden nicht neu initialisiert.

## Endpunkte und Rechte

- `GET /knowledge?stammId=…`: persönliche, rollenabhängige aktuelle Sicht einschließlich zulässiger Seiten und Mitgliedschaftsmetadaten.
- `POST /knowledge/commands?stammId=…`: bestehende Befehle plus `visual-draft`, `visual-publish`, `visual-discard`, `visual-restore`, `visual-permission`, `membership-change`.
- `POST /knowledge/assets?stammId=…&scope=local|global&…`: geprüfte Bilddatei; nur berechtigte redaktionelle Rollen im jeweiligen Geltungsbereich.
- `GET /knowledge/assets/{id}?stammId=…`: binäre Bilddaten; für Ranger ausschließlich bei einer aktuell freigegebenen Veröffentlichung.
- `POST /knowledge/ai?stammId=…`: bewusster redaktioneller Vorschlag, nur mit aktiver Mitgliedschaft und tatsächlichem Editorrecht.

Rolle, Heimatstamm, Teamrechte und aktueller Mitgliedschaftsstatus stammen aus der serverseitigen Mitgliedsdatei. Gefälschte Client-Rollen werden nicht verwendet. Stammleitung darf keine fremden Stammdaten oder globale Seiten ändern. Admin kann stammsübergreifend arbeiten. Pausierte Mitgliedschaften erhalten nur Lesezugriff; ausgetretene Mitgliedschaften keinen Zugriff. Die Zugriffssperre gilt auch für vorher ausgegebene, noch nicht abgelaufene persönliche Token.

Entwürfe und Publikationshistorien sind von Ranger-Snapshots getrennt. Seiten- und Statusänderungen verwenden Revisionen und Transaktionen. Wiederholung einer bereits verbuchten Befehls-ID verändert den Stand nicht erneut. Mitgliedschaftsereignisse werden außerdem in `membership_events` unveränderlich protokolliert. Bilder werden als inhaltsadressierte Dateien gespeichert; die Datenbank enthält nur deren Metadaten. Lokale Uploads sind nicht für andere Stämme abrufbar. SVG-Skripte, Events und externe Referenzen werden zurückgewiesen.

Redaktionelle Editionen sind auf 60 Seiten und 150 Elemente pro Seite sowie eine begrenzte JSON-Größe beschränkt. Redaktionelle Leitungsbefehle dürfen größere Anfragen als die bisherigen Prüfungsbefehle enthalten; eine Abnahme mit mehr als 128 KiB ist enthalten.

## Optionale KI

Zusätzlich sind serverseitig einzurichten:

| Variable | Bedeutung |
| --- | --- |
| `RANGERHUB_AI_API_KEY` | Anbieterzugang aus Secret-Verwaltung oder geschützter Dienstumgebung. Niemals in HTML, LocalStorage oder Git hinterlegen. |
| `RANGERHUB_AI_MODEL` | Gewähltes, für den eigenen Anbieterzugang verfügbares Responses-Modell. Ohne explizite Modellkonfiguration bleibt die KI deaktiviert. |
| `RANGERHUB_AI_DAILY_LIMIT` | Optional, Standard 100 Anfragen pro Person und UTC-Tag; auf 1–1000 begrenzt. |

Der implementierte Anbieter ist OpenAI Responses unter `https://api.openai.com/v1/responses`. Der Server benötigt erlaubten ausgehenden HTTPS-Zugriff dorthin. Der Browser kontaktiert den Anbieter nicht direkt. Zusätzlich gelten fünf KI-Aufträge pro Minute und Person, begrenzte Eingabe-/Ausgabelängen, Zeitlimit, Formatprüfung und kontrollierte Fehlermeldungen. Anfragen werden nicht bei Tastatureingaben ausgelöst. Es gibt keinen Publikationsbefehl im KI-Endpunkt.

Übertragen werden nur ausgewählter redaktioneller Text, Bearbeitungswunsch und optional Position/Größe der Seitenelemente. Die Mitgliederdatenbank, Anwesenheiten, privaten Verwaltungsnotizen, Bilder und Authentifizierungsdaten werden nicht als Kontext mitgegeben. Das Modell erhält den Auftrag, bestehende Aussagen zu erhalten und keine neuen Logbuchfakten oder Emblembedeutungen zu behaupten. Ergebnisse bleiben unbestätigte Vorschläge, bis der Nutzer sie als Entwurf übernimmt.

Ohne Schlüssel und Modell meldet die API „KI noch nicht konfiguriert“; die App zeigt denselben Zustand. Die Tests verwenden einen ausdrücklich synthetischen Provider und überprüfen Übernehmen/Verwerfen/Undo und Begrenzungen. Es wurden keine echten Anbieteranfragen ausgelöst.

## Sicherung und Wiederherstellung

Für den zentralen Betrieb gehören zusammen: konsistente SQLite-Sicherung, kompletter Bildordner und die geschützte persönliche Anmeldekonfiguration. SQLite mit dessen Backup-Funktion sichern oder den Dienst vor einem Dateikopieren sauber stoppen; bei laufender WAL-Datenbank nicht nur die Hauptdatei unkoordiniert kopieren. Wiederherstellung erfolgt durch die Serververwaltung, nicht durch einen lokalen Browserimport.

Für den browserlokalen Betrieb exportiert die App weiterhin JSON, solange keine zusätzlichen Bildblobs vorhanden sind. Mit eigenen Uploads entsteht ein ZIP mit JSON, separaten Bilddateien und Prüfsummen. Der Import validiert Struktur, Editionen, Statusdaten und Bilddateien vor dem Ersetzen des vorhandenen `rhv9`-Standes. Fehlende Bilder werden nicht als vollständige Sicherung ausgegeben.

## Ausgelieferter Zustand

Der Code für zentrale Speicherung, Bildrechte und Statusdurchsetzung ist implementiert und lokal getestet, einschließlich zweier voneinander unabhängiger Browserprofile. In der öffentlichen Demo ist weiterhin kein produktiver zentraler Dienst konfiguriert. Es wurden kein Serveranbieter gewählt, keine geheimen Zugangsdaten angelegt und keine kostenpflichtigen KI-Aufrufe aktiviert. Manuelle Bearbeitung, Statusverwaltung und Sicherung sind im Browsermodus nutzbar.
