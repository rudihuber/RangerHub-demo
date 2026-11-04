# V28 – vorbereitete Online-Anbindung und spätere Push-Nachrichten

Der Benutzer hat ausdrücklich **zunächst Demo-Chat und vorbereitete
Online-Anbindung** gewählt. Die ausgelieferte App aktiviert ausschließlich den
Demo-Transport. Es wurde kein Onlinedienst gebucht, keine externe Datenbank
angelegt, keine Nachricht an reale Empfänger versandt und keine
Benachrichtigungsberechtigung angefordert.

## Bereits implementiert

- Nachrichten-Reiter für alle vorhandenen Rollen sowie Chat-Schaltfläche unten
  rechts, vollständiger Frage-/Antwortablauf, eigene Ranger-Unterhaltungen,
  Leiterteam-Ansicht und Trennung nach aktivem Stamm.
- Themenwahl, Betreff, Frage, Antworten und Rückfragen. Offene Rangerfragen sind
  beim Leiter hervorgehoben, nach Leiterantwort beantwortet und mit Haken versehen.
  Neue Leiterantworten sind beim Ranger bis zum Öffnen hervorgehoben.
- Demo-Daten unter `stamms[stammId].messages` im bestehenden `rhv9` bzw.
  `rhv9-demo`. Keine zusätzliche LocalStorage-Datenbank. Zusammenführen mit dem
  zuletzt gespeicherten Datenstand vor jedem Nachrichten-Schreibvorgang.
- Synchronisierung derselben Demo zwischen Tabs eines Browserprofils über
  das bestehende Storage-Ereignis. Verschiedene Geräte teilen diese Daten nicht.
- Entwürfe pro Profil und Unterhaltung im Arbeitsspeicher; beim Schließen des
  Chats bleiben sie erhalten, beim vollständigen Neuladen nicht garantiert.
- `RangerHub.createHttpMessagesTransport`, getestete REST-Anfragen,
  persönliche Bearer-Token, HTTPS-Prüfung, Zeitlimit und Fehlerbehandlung für
  fehlende Anmeldung, verbotenen Zugriff und Netzausfälle.
- Austauschbarer Transport über `RangerHub.setMessagesTransport(transport)`.
  Die Darstellung hängt nicht vom verwendeten Speicheranbieter ab.

## Spätere Aktivierung

Erst nach Einrichtung eines echten Servers und persönlicher Anmeldung:

```js
const transport = RangerHub.createHttpMessagesTransport({
  baseURL: 'https://DEIN-NACHRICHTENDIENST.example/api',
  getAccessToken: async () => {
    // Hier die echte persönliche Sitzung des späteren Anmeldedienstes verwenden.
    return meineOnlineAnmeldung.accessToken;
  }
});
RangerHub.setMessagesTransport(transport);
```

Dieses Beispiel wird nicht automatisch geladen. Kein Admin-/Service-Schlüssel
gehört in die HTML-Datei. Die Demo-Profilwahl ist keine Online-Authentifizierung.
Ein echter Server muss die persönliche Anmeldung den vorhandenen RangerHub-
Personen und Stammrollen vertrauenswürdig zuordnen. Die existierenden Rollen
bleiben maßgeblich; eine im Browser gewählte Rolle darf keine Serverrechte
vergeben.

## REST-Vertrag

Alle Endpunkte benötigen `Authorization: Bearer PERSOENLICHES_TOKEN` und den
Abfrageparameter `stammId`. Der Server prüft die Mitgliedschaft selbst.

| Methode | Pfad | Anfrage | Antwort |
| --- | --- | --- | --- |
| GET | `/api/messages?stammId=…` | – | `{ "threads": [Thread] }` |
| POST | `/api/messages?stammId=…` | `{ "topic", "subject", "text" }` | `Thread` |
| POST | `/api/messages/ID/replies?stammId=…` | `{ "text" }` | `Thread` |
| POST | `/api/messages/ID/read?stammId=…` | `{}` | `Thread` |

Thread-Format:

```json
{
  "id": "UUID",
  "stammId": "clp-west",
  "rangerId": 11,
  "topic": "Wachstumspfad",
  "subject": "Frage zu einem Knoten",
  "createdAt": "2026-11-04T12:00:00.000Z",
  "updatedAt": "2026-11-04T12:00:00.000Z",
  "messages": [{
    "id": "UUID",
    "text": "Fragetext",
    "createdAt": "2026-11-04T12:00:00.000Z",
    "author": {
      "kind": "rangers",
      "id": 11,
      "homeStammId": "clp-west",
      "name": "Anzeigename"
    }
  }],
  "readBy": {}
}
```

`readBy` ordnet den aus den bestätigten Stammdaten abgeleiteten Schlüssel
`aktiverStamm:Heimatstamm:kind:personId` der zuletzt gelesenen Nachrichten-ID zu.
Ein zusätzlicher manueller Status ist nicht nötig: Eine Leiterantwort am Ende
des Gesprächs bedeutet beantwortet; eine Ranger-Rückfrage öffnet es erneut.

Serverseitig verbindlich:

- Ranger lesen und beantworten ausschließlich ihre eigenen Unterhaltungen
  im eigenen Stamm. Empfänger ist das Leiterteam, kein öffentlicher Gruppenchat.
- Leiter und Stammleiter sehen nur Unterhaltungen ihres Stamms. Der bestehende
  Admin darf nach serverseitiger Prüfung im ausgewählten Stamm arbeiten.
- `rangerId`, Autor, Zeitstempel und Rechte werden vom Server aus der bestätigten
  Sitzung bestimmt. Die Anfrage enthält keine frei wählbare Autorenrolle.
- Anhängen von Nachrichten und Setzen von Leseständen erfolgt atomar; keine
  vollständige RangerHub-Datenbank als unkontrollierten Browser-Upload übernehmen.
- HTTPS und passend eingeschränktes CORS. 401 für fehlende/abgelaufene Anmeldung,
  403 für unzulässigen Zugriff; fehlgeschlagene Anfragen werden nicht als
  erfolgreich gesendet dargestellt. Texte/Betreff begrenzen und als Text behandeln.

Die HTTP-Vertragstests verwenden abgefangene Testantworten. Sie sind kein
Nachweis eines bereits eingerichteten oder sicher konfigurierten Produktivservers.

## Push später

Nach einer erfolgreich gespeicherten Demo-Änderung erzeugt die App ein lokales
`rangerhub:message`-Ereignis. `detail.type` ist `question-created`,
`ranger-followup` oder `leader-replied`; dazu kommen Thread-ID, Stamm-ID,
Ranger-ID und Empfängergruppe. `RangerHub.messagePushPayload(detail)` erzeugt
eine kurze Benachrichtigung ohne den vertraulichen Fragetext.

Diese Ereignisse sind eine Integrationsstelle und versenden selbst keine Pushs.
Für Hintergrundzustellung bei geschlossener App benötigt die spätere Umsetzung
einen Service Worker, eine ausdrückliche Benachrichtigungsfreigabe, zugeordneten
Push-Abonnementspeicher und einen serverseitigen Web-Push-Sender. Der Server
erzeugt Zustellaufträge nach erfolgreicher Datenbanktransaktion: neue Rangerfrage
an die zuständigen Leiter des Stamms, Leiterantwort an den betreffenden Ranger.
Dadurch bleiben Rollen- und Stammgrenzen auch bei Benachrichtigungen erhalten.

Auf iPhone/iPad hängen Web-Push und Installation vom unterstützten System und
der als Web-App installierten Website ab. V28 meldet keine aktive Push-Zustellung.
