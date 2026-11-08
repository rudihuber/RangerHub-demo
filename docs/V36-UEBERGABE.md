# RangerHub V36 – Kalender, kompakte Mitgliederkarten und sichere Vertretung

V36 erweitert die bestehende RangerHub-App. Der private Speicher bleibt `rhv9`, die öffentliche Demo bleibt unter `rhv9-demo` getrennt. Es werden keine echten Konten erzeugt, keine Rollen dauerhaft durch Vertretung umgeschrieben und keine bestehenden Personen, Punkte, Kalenderhistorien oder Logbuchdateien zurückgesetzt.

## Geprüfte Ausgangsbasis und Sicherung

Die Remote-Prüfung fand zusätzlich zu V35 den neueren Teilstand `feature/v36-final-polish-and-qa` bei `e262de3be3f057a4376d4d9c2d631de865039d46`. Dieser enthielt erste Regal-/CSS-Änderungen, aber noch keinen fertigen V36-Build und keine Sicherheitsabnahme. Darauf basiert der neue Review-Branch `feature/v36-secure-delegation-review`.

Vor Änderungen wurden privat 861 und öffentlich 898 getrackte Dateien vollständig kopiert und aus der Kopie per SHA-256 nachgelesen. Sicherung: `V36/backup/`, Tag `backup/before-v36-review`, Einzelhashes `docs/v36-baseline.json`. Zusätzlich bleibt die frühere V35-Sicherung bestehen.

Die zwei im vorbereitenden Branch bereits veränderten V35-Quelldateien wurden als neue V36-Dateien übernommen. Ihre V35-Fassungen wurden aus dem ursprünglichen V35-Commit wiederhergestellt, damit das V35-Archiv einschließlich seiner ursprünglichen Quellen konsistent bleibt. Alle alten HTML-Versionen, Originalbilder und Kataloge bleiben byteidentisch. Andere bewusst aktualisierte vorhandene Dateien sind `README.md`, `index.html` und der bestehende zentrale Dienst `backend/knowledge-server.mjs`.

## Kalender und Dashboard

- Löschen von Ranger-Treffen, Leitermeetings und eigenen Terminen kehrt in die Ausgangsansicht zurück. Aus dem Kalender heraus bleibt Kalender aktiv; Monat, Jahr und Scrollposition bleiben erhalten. Abbruch und Speicher-/Netzwerkfehler löschen keinen Termin. Doppeltes Betätigen erzeugt keine zweite Löschung.
- Zentrale Ranger-Treffen werden mit Revision und bestätigter Speicherung abgesagt; der Verlauf bleibt erhalten. Die Kalenderansicht zeigt abgesagte Termine nicht erneut an. Leitermeetings und eigene Termine verwenden den bestätigten zentralen Verwaltungsstand.
- Pausierte und ausgetretene Geburtstage werden auch im Kalender ausgeblendet. Die Profile werden dadurch nicht entfernt.
- Wetter steht unter 768 Pixeln mittig. Normale Ortsnamen bleiben zusammen; sehr lange Namen können innerhalb der verfügbaren Fläche umbrechen.
- Das persönliche Ranger-Dashboard zeigt zwei feste, horizontal blätterbare Regale: oben die 39 AT-Bücher, unten die 27 NT-Bücher in kanonischer Reihenfolge. Die bisherige Rotation entfällt. Die Regale sind auch am Desktop einheitlich. Buch-/Kapitelzustände, Rücknahme, 1.189 Kapitel und insgesamt 240 Buchpunkte bleiben unverändert. Einzelne Kapitel erzeugen keine zusätzlichen Kapitelpunkte.

## Gemeinsame Mitgliederkarte

Ranger und Leiter verwenden dieselbe kompakte Kartenkomponente. Gespeicherte Daten und Rollen bleiben erhalten. Ohne gespeichertes Bild erscheinen Initialen; es wurden keine Porträts erfunden. Kontaktfelder fehlen, wenn kein Wert vorhanden ist. Telefon, E-Mail und Route erhalten nur bei geeigneten Werten einen Link. Kontaktdaten und Bearbeitungsaktionen werden anhand der bestehenden Rolle beziehungsweise der serverbestätigten Vertretung angezeigt.

Statusfilter, Suche, Zähler und Profilansichten bleiben vorhanden. Klick auf die Karte oder „Profil ansehen“ öffnet das bestehende Profil. Tastatur: Karte beziehungsweise Profilaktion fokussieren und Enter. „Mitgliedschaft beenden“ liegt im Drei-Punkte-Menü und öffnet den bestätigungspflichtigen Statuswechsel auf Ausgetreten. Es gibt dadurch keine Personenlöschung. Historien bleiben im Profil aufklappbar.

## Vertreterrechte benutzen

Einstieg: **Leiterteam → Vertreterrechte** oder **Verwaltung → Vertreterrechte**. Vergabe bleibt der originären Adminrolle beziehungsweise der originären Stammleitung im eigenen Stamm vorbehalten.

1. Aktiven bestehenden Leiter wählen.
2. Reichweite wählen: Stammleiter-Vertretung im gewählten Stamm; für Admin zusätzlich globale Admin-Vertretung für alle Stämme.
3. Beginn und Ablauf prüfen. Standard ist eine Woche; „ohne Ablaufdatum“ muss ausdrücklich gewählt werden.
4. Reichweite und Auswirkungen bestätigen, dann speichern.

Aktive und geplante Vertretungen können mit Bestätigung widerrufen werden. Ereignisse bleiben im Audit erhalten. Die ursprüngliche Rolle steht weiterhin auf der Mitgliederkarte; wirksame Vertretung und Reichweite werden separat angezeigt. Normale Vertreter können keine weiteren Vertreter ernennen, keine eigentlichen Admin-/Stammleiterkonten ändern und keine Server-Zugangsdaten verwalten.

Die zentrale API prüft bei jedem Zugriff die echte persönliche Identität, den Mitgliedschaftsstatus, die originäre Rolle und gültige Delegationsereignisse. Rollenparameter und LocalStorage-Flags sind keine Berechtigungsquelle. Lokale Vertretung überschreitet keine Stammesgrenze. Ein Widerruf oder Ablauf wirkt serverseitig beim nächsten Zugriff, auch mit demselben ausgestellten Token. Ein noch eintreffender POST wird vor der Mutation erneut autorisiert.

Die App aktualisiert ihre serverbestätigten Rechte alle fünf Sekunden sowie bei Fokuswechseln. Nach Rechteentzug schließt sie Editordialoge. Eine globale Vertretung, die sich beim Widerruf in einem fremden Stamm befindet, kehrt in den Heimatstamm zurück. Bei Verbindungsverlust werden die erweiterten UI-Rechte verworfen; die API akzeptiert ohnehin keine offline behaupteten Rechte.

Pausierung/Austritt des Vertreters oder eine Änderung der Mitgliedschaft des ursprünglichen Ausstellers macht bestehende Vertretungen unwirksam. Die Ereignisse sind an die Mitgliedschaftsrevision gebunden. Eine spätere Reaktivierung schaltet solche alten Rechte nicht erneut ein; nötig ist eine neue ausdrückliche Vergabe. Der letzte originäre Admin-/Stammleitungszugang wird vor Deaktivierung geschützt.

## Betrieb und Grenzen

**Die ausgelieferte Standarddatei und die öffentliche Demo sind weiterhin browserlokal. Ein produktiver zentraler Dienst ist nicht eingerichtet.** Deshalb bietet der Vertreterdialog ohne API keine scheinbar sichere Freischaltung an, sondern „Servereinrichtung erforderlich“. Die Funktion wurde mit einem echten lokalen Node-/SQLite-Dienst und zwei unabhängigen Browserprofilen getestet. Produktion benötigt die bestehende persönliche Serveranmeldung; die lokale Profilwahl ersetzt sie nicht.

[Servereinrichtung und Datenmodell](V36-BACKEND.md), [Testbericht](V36-TESTBERICHT.md), [100-Fälle-Matrix](V36-QA-ERGEBNISSE.csv). Die optionale KI aus V35 bleibt ohne serverseitige Konfiguration deaktiviert. Es wurden keine kostenpflichtigen Dienste oder echten KI-Anfragen eingerichtet.

Privat starten: komplette Paketstruktur erhalten, HTTP-Server im App-Ordner starten, `index.html` öffnen. Für vorhandene Browserdaten dieselbe bisherige Origin und denselben Browser verwenden. Ein anderer Host, Port oder Browser hat seinen eigenen LocalStorage; bei einem Wechsel die geprüfte App-Sicherung übertragen. Ein Backup mit eigenen Wissensbildern als vollständiges ZIP aufbewahren.

Build: `python tools/build_v36.py` privat beziehungsweise `python tools/build_demo_v36.py` in der Demo. Abnahme: `python tools/check_v36.py`. Der Runner erhält alte Testdateien und Screenshots, prüft ausdrücklich die geladene Versionsnummer und legt neue Belege getrennt ab. Die ursprüngliche V34-Prüfung für wechselnde Regale wird gegen V35 ausgeführt; V36 erhält dafür die ausdrücklich geforderte feste 39-/27-Prüfung.

Beide `main`-Branches werden durch diese Übergabe nicht aktualisiert oder automatisch gemergt. Der Review-Branch enthält die konkrete Änderung und PR-Beschreibung zur Abnahme.
