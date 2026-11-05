# RangerHub – Codex-Änderungsauftrag: Bibel lesen als selbstständiger Fachwissen-Fortschritt (240 Punkte)

> **Wichtig: Aktualisierung des vorherigen Entwurfs.** Diese Anweisung ersetzt die frühere Bibellese-Spezifikation mit **395 Punkten** und Leiterbestätigung. Die neue verbindliche Logik ist: **240 Punkte**, **66 Bücher**, **selbstständiges An- und Abhaken durch die Jugendlichen**, **sofortige und reversible Punktevergabe**. Die übrigen Fachwissen-Aufgaben behalten den bereits vereinbarten Leiter-Prüfungsworkflow.

## 0. Ausgangsbasis und Arbeitsweise

- Die aktuelle RangerHub-Anwendung mit ihren interaktiven Ober-/Unterwelten, dem Fachwissen-Reiter, Rangliste, Dashboard, Login, Rollen und Stammlogik ist die einzige Codebasis. **Keine parallele App bauen**.
- **Zuerst Backup**, dann Analyse der bestehenden Datenmodelle und des bereits implementierten Bibellese-Features (falls vorhanden). Keine Änderungen an bestehenden Nutzerdaten verlieren. Der LocalStorage-Key **`rhv9` muss erhalten bleiben**.
- Die beiliegende Datei **`RangerHub_Bibellesen_66_Buecher_240_Punkte.json`** ist der kanonische Datensatz für die Namen, Reihenfolge und Punktwerte. Nicht manuell abschreiben und keine Bücher doppelt importieren.
- Verwende vorhandene Designsysteme, Account-IDs, Stamm-IDs, Navigation, Berechtigungssystem und gemeinsame Datenspeicherung. Bei fehlender serverbasierter Datenbank echte Persistenz/Aktivierung als offene Abhängigkeit dokumentieren; nicht behaupten, Geräte synchronisieren bereits, wenn dies nicht implementiert wurde.

## 1. Punkte und faire Gewichtung

- Bestehendes Fachwissen: laut derzeitiger Planung **1.358 Punkte** maximal.
- Bibellesen zusätzlich: **exakt 240 Punkte** für alle 66 Bücher.
- Rechnerisches neues Maximum bei unverändertem Fachwissen-Katalog: **1.598 Punkte**.
- **Gesamtpunkte = bestätigte Punkte aus dem bisherigen Fachwissen + aktuell selbst als vollständig gelesen markierte Bibelbücher.**
- Das Maximum darf nicht mehrfach fest in der Oberfläche verstreut sein. Fachwissen-Maximum aus dem tatsächlich aktiven Katalog berechnen; Bibellesen-Maximum aus dem kanonischen Buchkatalog. Die 1.598 sind der Sollwert bei unverändertem Basisstand.
- Jedes Buch gibt **einmalig** seine Punkte, solange es als gelesen markiert ist. **Markierung zurücknehmen = exakt diese Punkte wieder abziehen**. Erneutes Markieren = wieder genau einmal gutschreiben, nie doppelt.
- Punkte sind proportional zu der zuvor vereinbarten kapitelbasierten Umfangsgewichtung auf 240 herunterskaliert und auf ganze Zahlen gebracht. Kürzeste Bücher erhalten mindestens einen Punkt. Die Gewichtung nach Kapiteln ist eine praktikable Näherung für den Leseumfang, keine wortgenaue Lesedauer.
- Summe Altes Testament: **187 Punkte**, Neues Testament: **53 Punkte**, insgesamt **240 Punkte**.

## 2. Selbstständiges Lesen und selbstständiges Korrigieren – **ohne Leiterfreigabe**

Die Jugendlichen verwalten ausschließlich **ihren eigenen Bibellese-Fortschritt** selbst. Sie müssen nicht für einen der drei Fachwissen-Prüfungsplätze angemeldet sein.

**Schrittfolge:**

1. Ranger öffnet Fachwissen → Glauben/Gemeinschaft bzw. Bibelwelt → interaktive Bibelbibliothek.
2. Er sieht die 66 Bücher und seine bereits erreichten Bibellese-Punkte.
3. Klick auf ein Buch öffnet zuerst dessen Detailkarte, nicht direkt eine Punkteaktion.
4. Auf der Detailkarte steht **„Als vollständig gelesen markieren“**.
5. Vor dem erstmaligen Markieren kurze, leicht verständliche Nachfrage: **„Hast du das ganze Buch {BUCHNAME} gelesen?“** – bestätigen oder abbrechen; kein unnötiger Nachweis.
6. Nach Bestätigung bekommt das Buch direkt den Status **Gelesen**, wird visuell besonders markiert und **die Punkte werden unmittelbar im Profil, Fachwissen-Gesamtstand und in der Rangliste gutgeschrieben**.
7. Auf demselben Buch erscheint jederzeit **„Markierung zurücknehmen“**. Ein versehentliches Häkchen lässt sich ohne Leiter, ohne Support und ohne Begründung wieder entfernen. Die vorher angerechneten Punkte verschwinden sofort wieder aus allen Summen und der Rangliste.
8. Danach darf der Ranger das Buch erneut markieren. Keine Strafpunkte, keine Sperrfrist, kein wachsender Punktewert, kein Mehrfachbonus.
9. In der Bücherübersicht können Häkchen ebenfalls gut sichtbar sein; **reines Antippen des Buchrückens öffnet die Detailkarte, vergibt niemals sofort Punkte**. Dadurch werden Fehlklicks minimiert.
10. Auf Mobilgeräten nach dem Markieren eine kurze Rückgängig-Möglichkeit anzeigen; die dauerhafte Aktion „Markierung zurücknehmen“ muss trotzdem erhalten bleiben.

**Wichtig:** Für Bibellesen **keine** Anmeldung beim nächsten Ranger-Treffen, **keine** Leiterbestätigung und **kein** „Bestanden/Nicht bestanden“; Bibellesen zählt **nicht** gegen das Limit von maximal drei Fachwissen-Prüfungen pro Treffen. Das Limit und der Leiterworkflow gelten **weiterhin unverändert für alle normalen Fachwissen-Prüfungen**.

Das System folgt hier bewusst dem **Vertrauensprinzip**: Die Jugendlichen dokumentieren selbst, was sie tatsächlich gelesen haben. Bitte klare Formulierung „vollständig gelesen“ verwenden, aber keine Datei-, Foto-, Video- oder Freitexteinreichungen verlangen.

## 3. Interaktive Bibelwelt mit 66 anklickbaren Büchern

### Position in RangerHub

- Die bestehende Fachwissen-Oberwelt bleibt erhalten.
- Im Bereich **„Glaube & Gemeinschaft“** einen eigenen anklickbaren Ort **„Bibelbibliothek“** / **„Haus des Wortes“** einfügen, der in eine **individuelle Unterwelt** mit Bücherregalen führt.
- Optional direkter Einstieg ins Bibelregal über den Fachwissen-Reiter bzw. das Dashboard, ohne den bestehenden Navigationsaufbau zu ersetzen.
- Die Welt darf sich visuell vom übrigen Fachwissen unterscheiden: warme Holztöne, Buchrücken, Regale, Licht, subtile Bewegung. Kein zusätzliches überladenes Dashboard.

### Bibliotheks-Aufbau

- Ein reizvolles, interaktives Bücherregal mit **66 separat auswählbaren Buchrücken**.
- Zunächst zwei deutliche Bereiche: **Altes Testament (39)** und **Neues Testament (27)**. Ein Klick auf eine Testament-Kachel oder ein Regal öffnet dessen Bücher. Keine sofortige lange Aufgabenliste über die ganze Seite.
- Untergliederungen optional visuell als Regale/Reihen, etwa Mosebücher, Geschichtsbücher, Weisheitsbücher, Propheten, Evangelien, Briefe. Die chronologische Bibelreihenfolge darf dadurch nicht verfälscht werden.
- Pro Buch kurzer Name, Punktwert und Status. Nach Klick Detailkarte mit vollständigem Namen, Kapitelanzahl, Punkten, Status, Aktion zum Markieren/Zurücknehmen.
- Die Bücher können nach Status und Name gesucht/gefiltert werden; optionale Filter „Alle“, „Offen“, „Gelesen“.
- Gelesene Bücher besonders hervorheben: goldener Buchrücken, kleines Siegel/Häkchen, sanftes Leuchten; nicht allein auf Farben verlassen (Icon/Text und Screenreader-Beschriftung).
- Auf iPhone **keine 66 winzigen unlesbaren Touch-Ziele**. Regale sinnvoll gruppieren, große Touchflächen ≥ 44×44 px, zoombare/scrollbare Regalansicht oder responsives Raster; iPad und Desktop eigene sinnvolle Aufteilung.
- Keine automatische Vollbild-Überblendung beim Laden. Zunächst eine ruhige Übersicht, erst per Klick ein Gebäude/Regal/Buch öffnen. Saubere Zurück-Navigation mit Erhalt der Scrollposition.

### Fortschrittsanzeige

Oben im Bibliotheksbereich eine kleine, gut sichtbare Statistik:
- **Bücher: x / 66**
- **Punkte: x / 240**
- **Altes Testament: x / 39**
- **Neues Testament: x / 27**
- Optional Fortschrittsbalken, Mini-Auszeichnungen wie „Evangelien vollständig gelesen“ – **keine zusätzlichen Bonuspunkte**.

## 4. Dashboard und Rangliste

- Die vorhandene **Fachwissen-Gesamtsumme** berücksichtigt Bibellesen sofort; beispielsweise 87 Leiter-bestätigte Fachwissen-Punkte + 23 selbst markierte Bibellese-Punkte = **110 Gesamtpunkte**.
- Die vorhandene **Ranglisten-Arena bleibt ausschließlich Rangliste**, ohne direkte Duelle oder gegenseitige Challenge-Anfragen.
- In Rangliste und Top-3-Bereich zählen **normale Fachwissen-Punkte plus Bibellese-Punkte**, auf demselben Stammes-/Sichtbarkeitsumfang wie bisher.
- Zeige eine zusätzliche kompakte, attraktiv gestaltete **„Meine Bibelreise“-Kachel** auf dem Dashboard: Bücher x/66, Punkte x/240, Fortschritt, Klick in die Bibelbibliothek.
- Die beiden bereits gewünschten interaktiven Dashboard-Karten sollen erhalten bleiben; die Bibelreise-Kachel harmonisch integrieren, nicht zu einer dritten riesigen Karte aufblasen.
- Ranking korrigiert sich sofort nach Zurücknehmen; keine veraltete gecachte Top-3-Anzeige.

## 5. Technische Umsetzung / Datenmodell

### Kanonischer Katalog

- Buch-IDs stabil aus JSON übernehmen: `bible-01` bis `bible-66`; je Buch genau ein Eintrag.
- Felder: `id`, `canonicalOrder`, `name`, `testament`, `chapters`, `points`.
- Keine frei erfundenen Bibelbücher oder abweichende Buchreihenfolge.
- Die kanonischen 240 Punkte sind für alle Stämme gleich, damit Ranglisten sinnvoll vergleichbar bleiben. Bestehende Admin-/Stammleiter-Bearbeitungsrechte für **andere** Fachwissen-Aufgaben dürfen nicht eingeschränkt werden.

### Persönlicher Lese-Fortschritt

Empfohlen: eine knappe, persistente Tabelle pro Kombination aus `(userId, bookId)`, etwa:

```
readingStatus(userId, bookId, isRead, updatedAt, version)
UNIQUE(userId, bookId)
```

- Es müssen **nur Status/IDs und wenige Metadaten** gespeichert werden, keine Bibeltexte und keine Anhänge, um die Datenbank klein zu halten.
- Status `true` = vollständig gelesen, `false` oder fehlender Eintrag = offen.
- Jeder Ranger darf serverseitig **ausschließlich den eigenen Status** ändern. Kein anderer Ranger darf fremde Bücher markieren. Leiter/Admin können in ihrer Übersicht Fortschritte einsehen, nicht automatisch als gelesen markieren.
- Schreiboperation als idempotentes **Setzen eines expliziten Zustands**, nicht als blindes „Toggle“: `setRead(bookId, true | false)`. Doppelt gesendete Anfragen dürfen keine Doppelpunktbuchung verursachen.
- Server validiert `bookId` gegen den 66er-Katalog und die Nutzerberechtigung.
- Bei Offline-/Mehrgeräte-Nutzung: Konflikte nachvollziehbar behandeln (z. B. letzter erfolgreich serverseitig bestätigter Schreibvorgang mit Versionsprüfung). Beim Zurücknehmen keine veralteten lokalen Buchungen wieder einspielen.

### Punktezählung

- Bibelpunkte möglichst **ableiten**, nicht inkrementell auf einen frei editierbaren Gesamtpunktestand addieren:

```
biblePoints(user) = SUM(book.points WHERE user.book.isRead == true)
fachwissenTotal(user) = leaderConfirmedFachwissenPoints(user) + biblePoints(user)
```

- Wenn bestehende App einen Punkte-Ledger nutzt: Buchstatus und Ledger-Transaktion atomar/verschränkt behandeln, mit eindeutigem Schlüssel `userId+bookId+source=bible_reading`; Rücknahme storniert die aktive Buchungswirkung, **ohne alte Fachwissen-Punkte zu berühren**. Keine doppelten Awards.
- Bei Änderungen oder Synchronisation sofort Dashboard, Profil, Arena und Rangliste neu berechnen oder Echtzeit-Subscriptions aktualisieren.

### Migration / Kompatibilität

- Falls die früheren 395 Bibellese-Punkte bereits umgesetzt wurden: Bestehende `isRead`/completed-Zustände übernehmen, **keine Markierungen zurücksetzen**, alte Bibellese-Punkte auf Grundlage der neuen 240er-Liste neu berechnen; nicht zusätzlich zum alten 395er-Saldo buchen.
- Falls bisher für Bibelbücher „zur Leiterprüfung angemeldet“ gespeichert wurde: vorhandene Daten behutsam prüfen, nichts stillschweigend als gelesen werten. Bei Bedarf einen klaren Migrationspfad ausweisen und offenen Status erhalten, bis der Ranger ihn selbst markiert.
- Normale Fachwissen-Prüfungsanmeldungen, historische Bewertungen, Aufgaben und Punkte unverändert behalten.
- LocalStorage-Key **`rhv9`** unverändert. Bestehende Nutzer- und Stammdaten nicht überschreiben; neue Daten versionssicher migrieren.

## 6. Zuverlässigkeit, Datenschutz und Missbrauchsschutz

- Die Bibel-Lesefortschritte sind für Ranger **frei korrigierbar**; keine Uploads, Screenshots oder Leseprotokolle verlangen.
- Keine Video-, Datei- oder personenbezogenen Zusatzdaten zur Prüfung sammeln. Nur technisch notwendige kleine Statusdaten speichern.
- Selbstbestätigung kann sachlich nicht kontrollieren, ob das Buch tatsächlich gelesen wurde; die App soll das **Vertrauensprinzip** unterstützen, nicht falsche Verifikation behaupten.
- Frontend alleine reicht nicht: API und Datenbank müssen prüfen, ob der Benutzer nur seinen eigenen Status schreibt.
- Optional einfache Missbrauchsbremse gegen versehentliche Mehrfachklicks (Button während Speichern deaktivieren), aber **kein Limit** für legitimes Rückgängigmachen.

## 7. Konkrete Punkte-Liste (JSON ist verbindlich)

### Altes Testament – **187 Punkte / 39 Bücher**

| Nr. | Bibelbuch | Kapitel | Punkte |
|---:|---|---:|---:|
| 1 | 1. Mose | 50 | 10 |
| 2 | 2. Mose | 40 | 8 |
| 3 | 3. Mose | 27 | 5 |
| 4 | 4. Mose | 36 | 7 |
| 5 | 5. Mose | 34 | 7 |
| 6 | Josua | 24 | 5 |
| 7 | Richter | 21 | 4 |
| 8 | Ruth | 4 | 1 |
| 9 | 1. Samuel | 31 | 6 |
| 10 | 2. Samuel | 24 | 5 |
| 11 | 1. Könige | 22 | 4 |
| 12 | 2. Könige | 25 | 5 |
| 13 | 1. Chronik | 29 | 6 |
| 14 | 2. Chronik | 36 | 7 |
| 15 | Esra | 10 | 2 |
| 16 | Nehemia | 13 | 2 |
| 17 | Ester | 10 | 2 |
| 18 | Hiob | 42 | 8 |
| 19 | Psalmen | 150 | 30 |
| 20 | Sprüche | 31 | 6 |
| 21 | Prediger | 12 | 2 |
| 22 | Hoheslied | 8 | 2 |
| 23 | Jesaja | 66 | 13 |
| 24 | Jeremia | 52 | 10 |
| 25 | Klagelieder | 5 | 1 |
| 26 | Hesekiel | 48 | 10 |
| 27 | Daniel | 12 | 2 |
| 28 | Hosea | 14 | 3 |
| 29 | Joel | 3 | 1 |
| 30 | Amos | 9 | 2 |
| 31 | Obadja | 1 | 1 |
| 32 | Jona | 4 | 1 |
| 33 | Micha | 7 | 1 |
| 34 | Nahum | 3 | 1 |
| 35 | Habakuk | 3 | 1 |
| 36 | Zephanja | 3 | 1 |
| 37 | Haggai | 2 | 1 |
| 38 | Sacharja | 14 | 3 |
| 39 | Maleachi | 4 | 1 |

### Neues Testament – **53 Punkte / 27 Bücher**

| Nr. | Bibelbuch | Kapitel | Punkte |
|---:|---|---:|---:|
| 40 | Matthäus | 28 | 5 |
| 41 | Markus | 16 | 3 |
| 42 | Lukas | 24 | 5 |
| 43 | Johannes | 21 | 4 |
| 44 | Apostelgeschichte | 28 | 5 |
| 45 | Römer | 16 | 3 |
| 46 | 1. Korinther | 16 | 3 |
| 47 | 2. Korinther | 13 | 2 |
| 48 | Galater | 6 | 1 |
| 49 | Epheser | 6 | 1 |
| 50 | Philipper | 4 | 1 |
| 51 | Kolosser | 4 | 1 |
| 52 | 1. Thessalonicher | 5 | 1 |
| 53 | 2. Thessalonicher | 3 | 1 |
| 54 | 1. Timotheus | 6 | 1 |
| 55 | 2. Timotheus | 4 | 1 |
| 56 | Titus | 3 | 1 |
| 57 | Philemon | 1 | 1 |
| 58 | Hebräer | 13 | 2 |
| 59 | Jakobus | 5 | 1 |
| 60 | 1. Petrus | 5 | 1 |
| 61 | 2. Petrus | 3 | 1 |
| 62 | 1. Johannes | 5 | 1 |
| 63 | 2. Johannes | 1 | 1 |
| 64 | 3. Johannes | 1 | 1 |
| 65 | Judas | 1 | 1 |
| 66 | Offenbarung | 22 | 4 |

**Kontrollsumme: 187 + 53 = 240 Punkte, 66 Bücher.**

## 8. Abnahmetests (Pflicht)

1. **66 Bücher**, davon 39 AT und 27 NT, exakt einmal importiert; Punktesumme = **240**.
2. Buch auf iPhone antippen → Detail öffnet → noch **keine Punkte**.
3. „Als vollständig gelesen markieren“ → bestätigen → Buch sofort **Gelesen**, exakte Punkte gutgeschrieben, Dashboard und Rangliste aktualisiert.
4. „Markierung zurücknehmen“ → Buch wieder **Offen**, exakt gleiche Punkte abgezogen, Dashboard/Rangliste aktualisiert.
5. Erneutes Markieren bringt exakt den ursprünglichen Punktewert, nicht doppelt.
6. Derselbe Vorgang auf zwei Geräten und bei schnellem Doppelklicken erzeugt keine zusätzlichen Punkte.
7. Mit 66 vollständig markierten Büchern genau **240 Bibelpunkte**; mit 0 markierten exakt **0**.
8. Die Bibelmarkierung verändert **nicht** die Liste der Leiter-Prüfungen und belegt **keinen** der drei Anmeldeplätze.
9. Bereits durch Leiter bestätigte übrige Fachwissen-Punkte bleiben nach An- und Abhaken der Bibelbücher unverändert.
10. Ein Ranger kann **keine** fremden Lesestatus oder Punktzahlen per manipuliertem API-Aufruf ändern.
11. Nach Refresh/Login auf iPhone, iPad und Desktop bleibt der Status korrekt; bei vorhandener Sync-Backend-Anbindung auch geräteübergreifend.
12. Falls 395er-Daten bereits existieren, 240er-Migration ohne doppelte Punkte und ohne verlorene Lesemarkierungen.
13. Responsive Bibliothekswelt, eindeutige Statuskontraste, große Touchflächen, Tastaturbedienung und Screenreader-Labels testen.

## 9. Arbeitsauftrag an Codex

Implementiere **jetzt** diese Änderung auf dem bestehenden RangerHub-Stand. Lege vorher ein Backup an. Die alte Bibellese-Anweisung mit 395 Punkten bzw. Leiterbestätigung ist durch diese Version vollständig überholt. Nutze die beiliegende JSON-Datei als Importquelle. Ändere keine fremden Punkte-/Prüfungsdaten. Teste die 13 Abnahmekriterien, führe die relevante Migration durch und dokumentiere geänderte Dateien sowie offene technische Abhängigkeiten.
