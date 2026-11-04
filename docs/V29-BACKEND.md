# Fachwissen: zentrale Speicherung und noch fehlende Einrichtung

## Tatsächlicher Stand

Die ausgelieferte Vorschau arbeitet mit **Demo / nur lokalen Daten**. Es wurde
keine Online-Datenbank gebucht und kein produktiver Server aktiviert. GitHub
Pages kann die statische App kostenlos bereitstellen, führt jedoch keinen
Node-Dienst und keine gemeinsame SQLite-Datenbank aus.

Eine echte zentrale Referenzimplementierung liegt unter `backend/` vor.
Sie verwendet Node 24, natives HTTP und natives SQLite, ohne zusätzliche
Server-Frameworks. Browser und Server nutzen exakt denselben geprüften
Fachwissen-Regelcode und denselben normalisierten Quellkatalog.
Ihre Mehrgeräte-Funktion wurde mit drei getrennten Browser-Speichern und
echten lokalen HTTP-Anfragen getestet. Das ist kein Nachweis eines bereits
erreichbaren Produktivservers.

## Vor Aktivierung erforderlich

1. Ein Node-24-Host mit dauerhafter privater Festplatte und HTTPS-Reverse-Proxy.
   Nicht nur ein flüchtiges Serverless-Dateisystem verwenden.
2. Ein vorhandener RangerHub-JSON-Export als kontrollierte Zuordnung der
   existierenden Ranger-IDs, Leiter-IDs, Rollen und Stämme. Keine neuen Personen
   erzeugen. Die bestehenden Admin- und Stammleiter-Berechtigungen ergeben
   sich weiterhin aus diesen Stammdaten.
3. Persönliche Zugangsdaten, die serverseitig genau diesen Personen zugeordnet
   werden. Die Demo-Profilwahl darf dafür keine Berechtigung vergeben.
4. Eine exakt erlaubte Frontend-Origin, z. B. die private App-Adresse. Tokens
   niemals in Git, öffentliches HTML oder eine gemeinsame Demo-Konfiguration legen.
5. Geschützter Speicherort für Datenbank und Credentials, automatische Sicherung
   einschließlich SQLite-WAL, definierte Aufbewahrung und Zugangs-Widerruf.

Der Referenzdienst akzeptiert persönliche, ausreichend lange Bearer-Tokens.
Serverseitig werden nur SHA-256-Hashes plus vorhandene Personen-ID, Heimatstamm
und Ablaufdatum konfiguriert. Kein Service-/Admin-Schlüssel im Browser.
Die Rolle wird bei jedem Zugriff aus der importierten Mitgliedschaft gelesen,
nicht aus einem vom Browser gelieferten Rollenfeld.
Ein komfortabler E-Mail-/QR-Anmeldedienst ist hier noch nicht eingerichtet;
dessen bestätigte persönliche Sitzung kann später `getAccessToken()` versorgen.
Tokens außerhalb von Git zufällig erzeugen, einzeln ausgeben, befristen und bei
Bedarf aus der Credential-Datei entfernen und den Dienst neu starten.

## Explizite Erstkonfiguration durch den Betreiber

Keine dieser Konfigurationen wird beim Öffnen der App automatisch ausgeführt.
Der Import ist ein Betreiberwerkzeug, kein öffentlich zugänglicher Endpunkt.

```sh
node backend/import-existing.mjs /secure/knowledge.sqlite /secure/rangerhub-export.json /secure/principals-template.json
```

Das Werkzeug übernimmt vorhandene IDs und Rollen sowie minimierte Alias- und
Teamdaten. Keine Adressen, Geburtstage oder Fotos. Wiederholter Import aktualisiert
die Mitgliedschaft, setzt vorhandenes zentrales Fachwissen aber nicht zurück.
Das Credential-Template enthält keine echten Tokens und ist absichtlich nicht
startfähig. Datei außerhalb des Webroots ausfüllen und auf Zugriffsrechte 0600
begrenzen. Vorhandene lokale Fachwissen-Daten müssen vor einer Übernahme vom
Betreiber geprüft werden; eine Browser-Demobuchung beweist keine echte Prüfung.
Keine verschiedenen lokalen Exporte blind zu einer amtlichen Rangliste addieren.

Bei einer Erstübernahme mit vorhandenem `knowledge`-Feld verweigert das Werkzeug
den automatischen Import vollständig. Erst nach einer dokumentierten Prüfung
kann der Betreiber ausdrücklich `--include-verified-knowledge` an den Befehl
anhängen. Ohne diese Entscheidung werden keine alten Daten zurückgesetzt oder
als bestätigte Online-Buchungen übernommen. Ein bereits vorhandener zentraler
Stand wird auch mit dieser Option nicht durch einen lokalen Export ersetzt.

Dienststart, Umgebungsvariablen nur für diesen Prozess:

```sh
RANGERHUB_KNOWLEDGE_DB=/secure/knowledge.sqlite \
RANGERHUB_PRINCIPALS=/secure/principals.json \
RANGERHUB_ORIGIN=https://DEINE-PRIVATE-APP.example \
node backend/knowledge-server.mjs
```

Der Dienst bindet ausschließlich an `127.0.0.1:8787`; Port mit
`RANGERHUB_KNOWLEDGE_PORT` änderbar. Davor HTTPS konfigurieren und die API unter
einer erreichbaren Adresse bereitstellen. Der Proxy muss `/knowledge` und
`/knowledge/commands` unverändert weiterreichen. CORS lässt genau die konfigurierte
Origin zu. Die Kinderdaten und Personenstammdaten der privaten App gehören nicht
in das öffentliche Demo-Repository.

Erst nach gültiger Anmeldung und Einrichtung auf jedem App-Start aktivieren:

```js
RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({
  baseURL: 'https://DEIN-FACHWISSEN-DIENST.example',
  getAccessToken: async () => meinePersoenlicheAnmeldung.accessToken
}));
```

Dies ist ein Beispiel und wird nicht automatisch geladen. Der Browser hält im
Online-Modus keine zweite beschreibbare Punkte-Datenbank. Die bestehenden
`rhv9`-Daten bleiben für alle bisherigen App-Funktionen erhalten.
Bei Serverfehlern wird keine lokale Ersatzrangliste als Online-Stand angezeigt.
Die vom Server bestätigte Personen-ID, Rolle und Stammzuordnung müssen zum
ausgewählten App-Profil passen; der Adapter prüft diese Zuordnung auch vor
jedem Schreibauftrag. Ein Token eines anderen Profils wird nicht still benutzt.
Aktualisierung bei Sichtbarwerden der App und alle 30 Sekunden im Vordergrund;
`RangerHub.refreshKnowledge()` aktualisiert bei Bedarf sofort. Keine behauptete
Echtzeit-/Push-Zustellung. Der bisherige Demo-Chat wird dadurch nicht umgestellt.

## API und Autorisierung

Alle Endpunkte verlangen einen persönlichen Bearer-Token sowie `stammId`.

| Methode | Endpunkt | Zweck |
| --- | --- | --- |
| GET | `/knowledge?stammId=…` | Autorisierte Ansicht mit Rangliste und eigenen bzw. Leiter-Nachweisen |
| POST | `/knowledge/commands?stammId=…` | `{type, payload, requestId}`; begrenzte fachliche Befehle |

Filter: `since`, `before` im Format YYYY-MM-DD, `category` A/B/C, `team`.
Eine Anfrage enthält niemals einen amtlichen Punktestand oder eine vertrauenswürdige
Autorenrolle. `start`, `submit`, `invite`, `respond`, `cancel` sind begrenzt auf
den angemeldeten Ranger bzw. die eigenen Duelle. `observe`, `review`, `revoke`,
`policy`, `resolve`, `settle` benötigen Leitung. Admin-Stammwechsel wird anhand
der vorhandenen Admin-Rolle geprüft, Stammleiter bleiben auf ihren Stamm begrenzt.

Der Server berechnet Quellwerte und Zeitstempel selbst. `BEGIN IMMEDIATE`
serialisiert Schreibvorgänge. Dieselbe Anfrage-ID mit demselben Inhalt ist ein
Retry; abweichender Inhalt mit derselben ID wird abgelehnt. Auch verschiedene
Anfrage-IDs können dieselbe Aufgabe nicht doppelt gutschreiben.
Der Ledger ist zusätzlich in einer separaten SQLite-Tabelle gespeichert;
UPDATE/DELETE sind durch Trigger verboten, Rückbuchungen verweisen eindeutig
auf ihre Gutschrift. Buchung, Fortschritt, Challenge-Ergebnis und Retry-Marker
werden zusammen atomar bestätigt. Betreiberzugriff auf Datenbank/Backups bleibt
privilegiert; dies ist keine Behauptung einer extern zertifizierten Revisionssicherheit.

Ranger-Antworten enthalten keine fremden Nachweise und keine fremden vollständigen
Buchungsdetails. Challenge-Teilnehmer sehen die vereinbarten Statusstufen, keine
Nachweistexte des Gegners. Gruppenlisten enthalten Alias, Punkte und Platzierung.
Aktuelle Sicherheitsfreigaben werden für Ranger ohne interne Begründungen geliefert.
Datei-/Foto-Uploads sind hier nicht implementiert; ein späterer Ausbau benötigt
privaten Objektspeicher, autorisierte Downloads und ein Löschkonzept.

## Testen und Betrieb

```sh
node --test backend/test-knowledge-server.mjs
python3 -m unittest discover -s tests -p test_v29.py -v
```

Die Tests verwenden ausschließlich temporäre Datenbanken, zufällige Test-Tokens
und Test-Browserprofile. Personen-/Stammdaten werden nicht in fremde Dienste
hochgeladen. Kosten oder einen dauerhaften Dienst hat diese Entwicklung nicht
eingerichtet. Einen konkreten Anbieter erst nach Prüfung seiner aktuellen
Gratisgrenzen, Datenschutzbedingungen und Betriebsanforderungen auswählen.
