# V33 – vorhandener Dienst mit Kapitelplan

V33 erweitert denselben Node-24-/SQLite-Dienst um `set-bible-chapter` und den korrigierten Ausgabe-4-Basiskatalog. `/knowledge`, `/knowledge/commands`, persönliche Serveridentität, Stamm-/Teamrechte, Request-Idempotenz, Revisionsvergleich und das append-only Punktejournal bleiben erhalten. Es gibt keinen zusätzlichen Kapitelserver und keine neue Datenbank.

Pro tatsächlich geändertem Buch wird im vorhandenen JSON-Datensatz `bibleReading.records[rangerId][bookId].chapterState` gespeichert: eine sortierte Kapitelliste plus ein expliziter Buchabschluss. Beim bloßen Lesen oder Upgrade werden keine 1.189 Einträge erzeugt und keine Punkte vergeben. Die bestehende SQL-Buchprojektion bleibt eine Zeile je vorhandenem Buchdatensatz; der vollständige Kapitelstand liegt im bereits vorhandenen `knowledge_stamms.state_json`.

Ranger ändern ausschließlich ihren eigenen Lesestand. Leiter, Stammleiter und Admin können berechtigte Lesestände ansehen; sie können sie nicht für Ranger abhaken. Kapitelstatistiken werden im Server-Snapshot für teambegrenzte Leiter nur zu autorisierten Personen geliefert. Einzelne Kapitel vergeben keine Punkte und belegen keinen der drei Fachwissen-Prüfungsplätze. Ein vollständiges Buch verwendet genau die bisherigen Credit-/Reversal-Buchungen.

Bibliotheksinhalte verwenden weiterhin dieselben globalen und lokalen `rangerWisdom`-Layer, Revisionen und Freigaben. Bestehende persönliche Bearbeitungen haben Vorrang vor dem neuen Basiskatalog. Die Ranger-API liefert ausschließlich veröffentlichte Module und enthält keine internen PDF-/Seitenmetadaten. Eine Fachwissen-Redaktionsdelegation verleiht weiterhin keine Bibliotheksrechte.

Für einen bereits eingerichteten Dienst müssen Frontend und Backend gemeinsam auf V33 aktualisiert werden. Das neue Frontend verlangt `bible.chapterSchema === 1`; bei einem alten Backend zeigt es einen Fehler, statt Kapiteländerungen stillschweigend falsch zu speichern. Vor einem Dienstupgrade bestehende SQLite-Datei einschließlich ihrer aktiven WAL-Daten sichern. Vorhandene Daten müssen nicht neu importiert oder zurückgesetzt werden.

Die tatsächliche Produktiveinrichtung bleibt offen: persistenter Host, HTTPS, vorhandene Mitgliedschaften, persönliche ablaufende Zugänge und Verbindung des Frontends. Konfiguration und Importwege stehen unverändert in [V32-BACKEND.md](V32-BACKEND.md) und [V31-BACKEND.md](V31-BACKEND.md). Es wurden keine kostenpflichtigen Dienste eingerichtet und keine Zugangsdaten in App/Git abgelegt.

Die veröffentlichte statische Demo bleibt lokal. Für einen echten vertraulichen Betrieb braucht auch die Frontend-Auslieferung Authentifizierung: statisch ausgelieferte Basiskataloge sind lesbar, auch wenn ein Thema in der Demo noch nicht freigegeben ist. Die tatsächlich getestete Server-API filtert Veröffentlichungen und Rollen. Das Quellen-PDF wird nicht öffentlich ausgeliefert.

Die neue Kapitel-API ist mit gleichzeitigen Clients, Wiederholung von Aufträgen, Fremdprofilen, Teamgrenzen und Serverneustart geprüft. Nachrichten, Fotos, Kalender-/Anwesenheitsverwaltung und klassische Aufgaben bleiben bei ihren bisherigen Speicher-/Onlinefähigkeiten; V33 behauptet keine eingerichtete Gesamtsynchronisierung.
