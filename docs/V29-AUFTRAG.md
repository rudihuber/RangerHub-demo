# CODEX-AUFTRAG: RangerHub – neuer Reiter „Fachwissen“ als interaktive Expedition

## 0. Ziel und Arbeitsmodus

Entwickle **direkt in der bereits bestehenden RangerHub-App / im vorhandenen GitHub-Repository** einen neuen, erstklassig gestalteten und vollständig bedienbaren Hauptbereich **„Fachwissen“**. Dieser soll Lernen, praktische Pfadfinderfähigkeiten, den Fortschritt jedes Rangers und einen freundschaftlichen Wettbewerb ins Zentrum der App rücken. Nicht nur eine Design-Mockup-Seite erstellen, sondern in vorhandene Navigation, Profile, Rollen, Datenverwaltung und Dashboard integrieren.

**Arbeite selbstständig nach Analyse des aktuellen Codes.** Zunächst Repository, Projektstart, Komponenten, State, Navigation, Nutzerrollen, vorhandene Rangerliste, Backup-/Versionsregeln und bestehende Datenhaltung lesen. Vor Änderungen vollständiges Backup/Commit anlegen. Bestehende Funktionen, Ranger- und Leiterdaten, Login, Rangertreffen, Rezepte, Wachstumspfad usw. erhalten. **Den vorhandenen LocalStorage-Key `rhv9` unter keinen Umständen löschen, umbenennen, ersetzen oder ohne verlustfreie Migration überschreiben.** Vorhandene Architektur nutzen, keine zweite isolierte App. Danach implementieren, testen und die Änderungen samt Start-/Testanleitung dokumentieren. Keine Versionsnummern im sichtbaren UI hinzufügen.

## 1. Quellmaterial und verbindliche Priorität

1. **`RangerHub_Fachwissen_Quellkatalog.json`**: beigefügter maschinenlesbarer, vollständiger Abschnitts- und Absatzexport aus `Fachwissen_Logbuch.docx`. Dies ist die direkte Importgrundlage für Themen und Aufgaben. Er enthält Originalformulierungen, Reihenfolge, Punktangaben und Unterfragen; bitte die Aufgaben logisch gruppieren, ohne Unterpunkte als separate zusätzliche Punktaufgaben zu zählen.
2. **`Fachwissen_Logbuch.docx`**, sofern im Repository zugänglich: maßgeblich für Aufgabenformulierungen und Punktwerte. Mit JSON gegenprüfen.
3. **`Logbuch Ausgabe(2).pdf`**: FECG-Logbuch; der Fachwissenabschnitt beginnt auf Buchseite 98 / etwa PDF-Seite 50. Maßgebliche visuelle und inhaltliche Referenz für das Ranger-Design und die inhaltliche Struktur; bei Abweichungen zum DOCX nicht automatisch mischen, sondern Abweichungen protokollieren.
4. **`Royal Rangers_Logbuch.pdf`**: weitere gestalterische Inspiration, u. a. Logbuch, Wachstumspfad, Pfadfinder-Illustrationen. Es enthält ein **anderes Ranger-System**; dessen andere Stufen, Anforderungen und Punktlogiken ausdrücklich **nicht** unbemerkt in den FECG-Fachwissenkatalog übernehmen.

Sollten große Original-PDFs im Codex-Repository nicht vorliegen, **nicht blockieren**: Der JSON-Quellkatalog enthält bereits alle 36 Themengebiete und die vollständigen DOCX-Absätze. In diesem Fall JSON für die Inhalte nutzen und die Gestaltung anhand dieser Beschreibung neu erstellen. **Keine Aufgaben, Anforderungen, Fragen oder offiziellen Punkte erfinden.** Fehlende Punkte mit `null`/„Punkte müssen geprüft werden“ kennzeichnen. Der Quellkatalog ist der unveränderte Ursprung; nutze separate normalisierte Importdaten und nachvollziehbare IDs.

Die Quelle enthält **3 Kategorien, je 12 Themenbereiche, also 36 Themenbereiche insgesamt** und **250 explizite Punktangaben**. Diese Zahl ist **nicht gleich 250 einzeln geprüften Aufgaben**: einige Absätze sind Unterpunkte oder Alternativen. Die maximale erreichbare Punktzahl nicht aus naiven Regex-Treffern ableiten.

**Original-Kategorien und Themen (vollständig importieren):**

- **Kategorie A – Christliches Leben und die Gesellschaft, Kunst und Kultur:** Bilder, Videos, Musik, Medien, Gäste, Bürgerkunde, FECG-Rangers, Die Bibel, Biblische Ereignisse, Gemeinde, Geistlicher Dienst, Missionsarbeit.
- **Kategorie B – Rangers in der Natur:** Astronomie, Wetterkunde, Vogelkunde, Naturkunde, Tierkunde, Waldläufer, Winterkunde, Zeltbau, Lagerbau, Feuerbohren, Campkochen, Naturschutz.
- **Kategorie C – Sport und Gesundheit (so im DOCX gruppiert):** Fitness, Rettungsschwimmer, Erste Hilfe, Kanu, Fahrrad, Motor, Hobby, Handarbeiten, Bogenschießen, Kochen, Angeln, Garten.

**Quellenkonflikte:** In der grafischen Karte dürfen Themen anders verteilt werden, aber `sourceCategory`, `sourceTopic`, Originaltext, Aufgaben-Unterfragen und Punkte müssen erkennbar erhalten bleiben. Es gibt mindestens diese in der DOCX-Datei nicht ausdrücklich bepunkteten nummerierten Aufgaben: **„Gäste“ Aufgabe 4, „Bürgerkunde“ Aufgabe 9 und „Geistlicher Dienst“ Aufgabe 4**. Nicht mit geratenen Punkten füllen; für Leiter als Datenprüfung ausweisen. Subaufgaben a), b), c) usw. bleiben bei ihrer Hauptaufgabe. Nicht automatisch bepunktete Hilfetexte, Hinweise oder Alternativen in eigene Punkteaufgaben verwandeln.

## 2. Neuer Haupt-Reiter und Navigation

- In bestehender Desktop- und Mobile-Navigation einen eigenständigen, gut sichtbaren Reiter **„Fachwissen“** mit passendem Icon (Kompass/Buch/Karte) hinzufügen; für Ranger und Leiter sichtbar.
- UI-Label auf Einstiegsseite: **„Fachwissen – Deine Ranger Expedition“**, Subline z. B. „Entdecke Wissen. Bestehe Aufgaben. Sammle Punkte.“
- **Progressive Disclosure ist Pflicht:** Beim Öffnen nur Karte, persönlicher Fortschritt und die wichtigsten Challenges/Rankings. **Nicht** sofort alle Kartenregionen, Themen und Aufgaben als ausgeklappte Scrollliste anzeigen.
- Interaktionsfolge: **Karte → Region anklicken → Themen des Gebiets → Thema anklicken → Aufgabenliste → Aufgabe anklicken → Detailansicht/Challenge/Einreichen.** Für jede Stufe eigene Ansicht oder Drawer mit deutlichem Zurück-Button/Breadcrumb. Standardmäßig alle Detailbereiche geschlossen. Klick außerhalb/Zurück/ESC schließt Ebene sinnvoll. Nur genau ein Detailsheet gleichzeitig.
- Desktop mit großer, hochwertiger Karte und optionaler rechtsseitiger Detailspalte. Mobile mit voll nutzbarem, gut proportioniertem Kartenausschnitt und Bottom-Sheet für gewählte Inhalte. Keine mikroskopisch kleinen Klickziele, keine verdeckten Icons; Touchflächen >= 44 px, Tastaturbedienung und Screenreader-Labels berücksichtigen.

## 3. Visuelle Leitidee: interaktive handgezeichnete Abenteuerkarte

**Keine gewöhnliche Kachel-/Dashboard-Wand.** Inspiriere dich am Logbuch: warme Sand- und Papierfarben, Waldgrün, markante Überschriften, Kompass, Pfade, Lagerfeuer, Fluss, Berge, Zelte, Holz und Ranger-Symbole. Aber als eigenständige, moderne, klare **RangerHub-Illustrationswelt** umsetzen; bitte keine komplette Logbuchseite als unscharfes Hintergrundbild und keine urheberrechtlich geschützte Illustration einfach kopieren.

Die Karte hat z. B. diese anklickbaren Regionen (nur **visuelle** Gruppierung, keine vierte offizielle Quellkategorie):

1. **Wildnis & Lager** – Lagerbau, Zeltbau, Waldläufer, Feuerbohren, Campkochen, Naturschutz.
2. **Entdeckerland** – Astronomie, Wetterkunde, Naturkunde, Tierkunde, Vogelkunde, Winterkunde.
3. **Rettungsstation & Bewegung** – Erste Hilfe, Fitness, Rettungsschwimmer, Kanu, Fahrrad.
4. **Werkstatt & Kreativität** – Motor, Hobby, Handarbeiten, Bogenschießen, Kochen, Angeln, Garten, Bilder, Videos, Musik.
5. **Glaube & Gemeinschaft** – Die Bibel, Biblische Ereignisse, Gemeinde, Geistlicher Dienst, Missionsarbeit, FECG-Rangers, Gäste, Bürgerkunde, Medien.
6. **Challenge-Arena** – Wettbewerb, 1-gegen-1-Duelle, Rangliste; hier keine künstlich erzeugten Fachwissenaufgaben.

Wenn eine Liste an einer Stelle nicht vollständig oder intuitiv ist, alle **36** Themen eindeutig genau einem Kartenort zuordnen und einen automatischen Zuordnungscheck implementieren. Das Logo/Icon jedes Gebiets, sein Fertigstellungsfortschritt (z. B. 6/18 Aufgaben), verfügbare Punkte und „offene Herausforderung“ dürfen auf der Karte sichtbar sein. Ein gewähltes Gebiet wird schön hervorgehoben; andere liegen visuell ruhig. Kleine, sparsame Mikroanimationen (leichter Rauch am Lagerfeuer, ein leuchtender Weg, Marker-Pulse) nur performant und mit `prefers-reduced-motion`-Rücksicht. **Keine endlosen Animationen oder schwergewichtige 3D-Engine.** SVG/CSS/Canvas nach bestehenden Technologien, responsive und skalierbar, schnelles Laden.

Die Karte ist auf Desktop ohne horizontales Scrollen gut erfassbar und auf iPhone/iPad mit intuitivem Schieben/Zoomen oder adaptivem Zuschnitt gut bedienbar. Auf Mobile **keine** bloße Miniatur der Desktop-Karte. Bei Bedarf eigene mobile Komposition derselben Regionen verwenden. Versteckte Inhalte erst durch Tap auf Marker anzeigen, nicht durch bloßes Hover.

## 4. Themen- und Aufgabenansichten

Ein Themenbildschirm (z. B. „Astronomie“) zeigt Titel, Kurzbeschreibung, persönliches Thema-Progress, verdiente und noch mögliche **bekannte** Punkte und nur eine kompakte sortier-/filterbare Aufgabensammlung. Aufgabenkarte: Titel/Erstzeile, offizieller Punktwert, Aufgabentyp, Status und ggf. Challenge-Indikator.

Aufgabe öffnet eine schöne Detailansicht im Stil eines digitalen Logbuch-Eintrags:

- **Original-Aufgabentext vollständig**, gegebenenfalls sämtliche Unterpunkte (a, b, c ...) und Hinweise.
- **Offizielle Punktzahl** aus Quelle (oder „Punkte offen – Leiter klärt“), nicht selbst erfunden.
- Status: `Noch nicht gestartet`, `In Arbeit`, `Zur Prüfung eingereicht`, `Bestätigt`, `Überarbeitung nötig`.
- Klar erkennbare Aktionen: `Aufgabe starten`, `Ergebnis einreichen`, `Leiter prüft`, `Ranger herausfordern`.
- Geeignete Nachweisart abhängig von Aufgabe: Freitext, dokumentierter praktischer Nachweis, optional Foto/Datei mit Berechtigungen, mündliche Vorführung mit Leiterbestätigung. Keine öffentliche Bildgalerie von Minderjährigen.
- Historie: abgegeben am, geprüft am, Leiterkommentar, genehmigte Punkte. Wiederholte Einreichung möglich, aber **nur einmalige offizielle Punktegutschrift pro Aufgabe und Ranger**.
- Einführungsinfo/Tipps nur als klar getrennte Zusatzhilfe, nicht als Veränderung oder Ersatz der Originalanforderung.
- Optional Quiz-Übungen als **Training ohne offizielle Punkte**. Prüfungsaufgaben und Antworten nicht automatisch als „bestanden“ markieren.
- Schwierigkeit, geschätzte Zeit oder Materialtips dürfen nur als separate UI-Hilfen angezeigt werden, klar als Schätzung bezeichnet, nicht aus der Quelle vorgetäuscht.

**Beispiele für Testdatensätze aus der Quelle:** „Astronomie – Zeige sieben Sternbilder“ = 5 Punkte; „Die Bibel – Lerne die 66 Bücher“ = 4 Punkte; „Erste Hilfe – Erste-Hilfe-Kurs absolvieren“ = 20 Punkte; „Angeln – Angelschein mit Prüfung“ = 30 Punkte; „Kochen – Rezept auswählen und Gericht zubereiten“ = 2 Punkte. Dabei den vollständigen Originaltext im Detail erhalten.

## 5. Verbindliches Punktesystem

- **Gesamtpunkte** = Summe der genehmigten, eindeutig einmalig verbuchten offiziellen Fachwissenaufgaben. **Nicht** Punkte aus Quiz-Training, Klicks, Streaks, der Logbuch-Wachstumsstufe oder Challenges heimlich hinzurechnen.
- Vor Bestätigung zählen eingereichte Punkte **nicht** zum offiziellen Kontostand. In Bearbeitung separat als „Wartet auf Prüfung“ zeigen.
- Bei jeder Bestätigung sind Aufgabe, Ranger, genehmigender Leiter, Zeit, Quellwert und ggf. Kommentar revisionssicher/nachvollziehbar gespeichert. Rangliste und Ranger-Dashboard werden aus denselben geprüften Datensätzen berechnet. Kein doppeltes Buchen bei Reload/Retry/Sync-Konflikt.
- Wenn Korrektur nötig ist, nur für Leiter **widerrufbar mit Begründung** und sauberer Rückbuchung/Audit-Historie. Niemals Client-seitige „+ Punkte“ ohne autorisierte Prüfung zulassen.
- Quelle ohne Punktwert: Kein automatischer Punktegewinn, bis ein Leiter dies anhand der Quelle geklärt/administrativ dokumentiert hat. Fehlerliste für Leiter vorsehen.
- Punkte richtig als **offizielle Fachwissenpunkte** bezeichnen; jede Spielmechanik (Challenge-Siege, Serien, Abzeichen) als **gesonderte Kennzahl** ausweisen, keine Punktinflation.

## 6. Dashboard – Wettbewerb als sichtbarer Schwerpunkt

Die neue Sektion soll in **beiden Dashboards passend zu den Rollen** prominent auftauchen, ohne andere Funktionen zu entfernen:

### Ranger-Dashboard

- Oben im sichtbaren Bereich eine kompakte, hochwertige Fläche **„Deine Expedition“** mit **Gesamtpunkte**, **Rangplatz**, „Punkte diese Woche“, Anzahl bestandener Aufgaben und Fortschritt über Themen.
- Direkt darunter **Rangliste CLP-West**: Podium/Top 3 (sympathisch, nicht überdimensioniert), die eigene Position auch außerhalb der Top 3, aktuelle Veränderungen zur Vorwoche und klarer `Alle Rangplätze`-Link.
- Kleine Challenge-Fläche: **„Fordere einen Ranger heraus“** + aktuelle Duelle mit Deadline, Aufgaben und Fortschritt; vor allem Aktionen hervorheben, nicht 20 Datenboxen.
- Zusätzlich **„Diese Woche aufgestiegen“** statt nur Dauersieger zu zeigen. Die Rangliste darf sportlich und motivierend sein, soll aber hintere Plätze nicht bloßstellen.

### Leiter-Dashboard

- Dieselbe Übersicht der geprüften Punkte plus **„X Aufgaben warten auf Freigabe“** (mit direkten Prüfaktionen).
- Leaderboard aller aktiven Ranger dieses Stamms, Filter `Gesamt / diese Woche / diesen Monat / Kategorie / Team` wenn Daten vorhanden.
- Leader haben Such- und Filterfunktionen sowie Einblick, wie die Punktzahl zustande kam, um Unstimmigkeiten zu klären.

### Fairness

- Bei Punktgleichheit denselben Rang anzeigen oder dokumentierten stabilen Tiebreaker verwenden (z. B. Anzahl bestätigter Aufgaben, danach gleicher Platz); **keine erfundene Reihenfolge**.
- Wechsel zwischen `Gesamtwertung` und `Wochenwertung`, damit Neueinsteiger motiviert bleiben.
- Nur aktive, berechtigte Ranger des jeweiligen Stamms. Privatsphäre: auf Gruppenlisten zunächst **Vorname + Nachnamensinitial oder gewählter Alias**, nicht ungefragt volle Namen oder persönliche Profile veröffentlichen. Volle Namen nur im autorisierten Leiterbereich. Keine externe Suchmaschinen-/öffentliche Websicht.

## 7. 1-gegen-1-Challenges

Funktion **„Ranger herausfordern“** prominent in Fachwissen, Rangliste und Aufgabe. Ziel: motivierende faire Wettkämpfe mit bestätigbaren Ergebnissen, keine künstlichen Punkte.

1. Ranger A klickt auf eine **konkret existierende, für beide zugelassene Fachwissen-Aufgabe** oder eine vom Leiter freigegebene kleine Aufgabengruppe und wählt Ranger B aus demselben berechtigten Stamm/Team aus.
2. Anzeige: Herausforderer, Empfänger (Alias), originale Aufgabe, offizielle Punkte, vorgeschlagene Deadline z. B. 7 Tage (änderbar), Challenge-Regeln und Einverständnis-Button. Herausgeforderter kann **annehmen oder ablehnen**.
3. Nach Annahme sieht jeder seinen Status: `Offen`, `In Bearbeitung`, `Eingereicht`, `Vom Leiter bestätigt`. Eine kleine Timeline/2-Personen-Leiste ist attraktiv.
4. Sieg nach dokumentierter Leiterbestätigung und fairer Zeitregel; bei gleicher Leistung Unentschieden. **Keine automatischen Bonus-Fachwissenpunkte für einen Sieg**. Optional separate Siege/Abzeichen im Challenge-Profil.
5. Keine Strafen bei Ablehnung oder Niederlage, kein automatisches Posten peinlicher Niederlagen, keine endlosen Reminders. Eindeutige Grenzen für offene Herausforderungen und Anti-Spam.
6. Nicht absolvierte oder altersmäßig ungeeignete Aufgaben dürfen nicht zugelassen werden. Praxisaufgaben mit Feuer, Messern, Sägen, Axt, Bogen, Wasser, Winterübernachtung etc. benötigen ausdrückliche **Leiteraufsicht bzw. Sicherheitsprüfung**; keine Challenge ohne entsprechende Voraussetzungen.
7. Während der laufenden Challenge müssen die Rangers nicht online sein. Bei zentraler Synchronisierung aktualisieren sich Status und Rangliste nach genehmigten Aufgaben nachvollziehbar.

## 8. Benutzerrechte, Datenschutz, Synchronisierung

**Ranger**: sieht freigegebene Themen, eigene Aufgaben/Anträge, berechtigte Gruppenrangliste und eigene Challenges; kann keine amtlichen Punktstände oder andere Rangerprofile manipulieren.

**Leiter**: kann Aufgaben prüfen, bestätigen/ablehnen, Feedback geben, sicherheitsrelevante Tasks sperren, nachweislose Prüfungen dokumentieren, Punkte korrigieren und die Datenprüfungsfälle bearbeiten. Rückbuchungen nachvollziehbar speichern.

**Wichtig zur Architektur:** `localStorage` auf einem Gerät **kann keine echte stammesweite Rangliste über mehrere Ranger-Geräte garantieren**. Prüfe die vorhandene Backend-/Synchronisierungsarchitektur. Wenn vorhanden, verwende sie und mache serverseitige Rollenprüfung und Bestätigungen transaktional. Wenn keine geeignete gemeinsame Datenbank existiert: baue eine klare Datenzugriffs-/Sync-Schicht, dokumentiere konkret, welche Backend-Konfiguration noch benötigt wird, und zeige eine sichtbar als `Demo / nur lokale Daten` gekennzeichnete Vorschau. **Niemals eine erfundene Echtzeit-Rangliste** als echte CLP-West-Rangliste darstellen. Keine API-Schlüssel erfinden, keine Nutzerkonten/Datensätze duplizieren.

Kinderdatenschutz: keine ungeschützten Namen, Geburtsdaten, Anwesenheiten, Fotos oder personenbezogenen Nachweise in öffentlichen Ansichten oder clientseitigen globalen Datenexposures. Bilder und sensible Nachweise nur mit erlaubtem Zugriff und Löschkonzept. Keine Rangvergabe zur Bewertung persönlicher Glaubenshaltungen oder privater religiöser Informationen automatisieren; bei entsprechenden Aufgaben ausschließlich freiwillige, leiterbestätigte Nachweise nach bestehenden Regeln. Dies ist ein Lernspiel, kein soziales Ranking über persönliche Lebensführung.

## 9. Datenmodell und Migration

Wähle die bestehende Datenarchitektur; trenne mindestens folgende logischen Entitäten:

- `knowledgeCategories` – offizielle A/B/C.
- `knowledgeTopics` – die 36 Unterthemen, `sourceCategoryId`, eindeutige Zuordnung zu `mapRegionId`.
- `knowledgeTasks` – stabile ID, `originalText`, `subItems`, `points: number|null`, `sourceReference`, `safetyFlags`, `evidenceType`, `isPublished`.
- `rangerTaskProgress` – `rangerId`, `taskId`, Status, Beginn, Einreichung, Nachweise (geschützt), Prüferkommentar.
- `knowledgePointLedger` – unveränderbar nachvollziehbare Einträge für Gutschriften/Rückbuchungen, idempotent und autorisiert.
- `knowledgeChallenges` – Aufgaben, beide Ranger, Einladung, Annahme, Status, Deadline, Ergebnis, Leiterprüfung.
- ggf. `knowledgeLeaderboardView` – aus Ledger abgeleitete Sortierung, kein eigenständig beschreibbarer Punktestand.

Migration/Import idempotent: mehrfaches Ausführen darf keine Aufgaben duplizieren; keine alten Ranger-Daten überschreiben. Integration in vorhandene IDs und Stammlogik vornehmen. Änderungen an `rhv9` nur kompatibel und vorheriges Backup nachweisbar. Debug-/Seed-Testdaten von echten Rangerdaten streng trennen. Sämtliche Inhalte/Schlüssel UTF-8, Umlaute intakt.

## 10. Qualität, Abnahme und Tests – erst dann fertig melden

Implementiere und teste mindestens diese Fälle:

- Reiter **Fachwissen** auf Desktop und iPhone/iPad erreichbar, keine Navigationsregression; Karte attraktiv, ohne Overflow, keine Mini-Hotspots.
- Einstieg zeigt **nur Karte**, Fortschritt und relevante Highlights; erst Region-Klick zeigt Themen, erst Thema-Klick zeigt Aufgaben, erst Aufgaben-Klick zeigt Detail. Back-Flow klappt mit Maus, Tastatur und Touch.
- Vollständiger Import: 3 Quellkategorien, **36 einzigartige Themen**, sämtliche Quellabsätze korrekt gruppiert; **keine doppelt gezählten Unterpunkte**; Abgleich der 250 Punktangaben aus der DOCX als Audit; fehlende/unklare Werte in Bericht.
- Validierungsbeispiele: Astronomie 7 Sternbilder 5P; Bibel 66 Bücher 4P; Erste-Hilfe-Kurs 20P; Angelschein 30P; einfache Kochaufgabe 2P. Quelltexte vollständig.
- Ranger kann Aufgabe beginnen/einreichen, darf aber keine eigenen offiziellen Punkte vergeben. Leiter bestätigt → Gesamtpunkte, Thema, persönliches Dashboard und Rangliste ändern sich konsistent.
- Doppelklick/Reload/zweite Genehmigung/gleichzeitige Geräte vergeben **keine doppelten Punkte**. Rückbuchung korrekt.
- Leaderboard enthält nur berechtigte Ranger des jeweiligen Stamms; zeigt Top 3, persönliche Platzierung, Wochenwertung. Kein Fake-All-Ranger-Modus bei nur lokalem Storage.
- Challenge annehmen, ablehnen, Fortschritt, Bestätigung, Sieg/Unentschieden und Abbruch prüfen; keine unbeaufsichtigten Gefahr-Aufgaben.
- Rollenprüfung serverseitig; keine fremden Nachweise sichtbar; Datenschutz/Visibility prüfen.
- Keine Auswirkungen auf Rangertreffen, Rezepte, Wachstumspfad, `rhv9`, Anmeldung und Stammwechsel. Auch **Reload mit aktiver Sitzung** testen: keine weiße/leere Seite.
- Desktop und Mobile visuell prüfen (Screenshots). `prefers-reduced-motion`, Tastatur, Kontrast, Lade-/Fehler-/Leerzustände berücksichtigen.

**Zum Schluss berichten:** geänderte Dateien, Implementierungsumfang, wie starten und prüfen, Anzahl importierter Kategorien/Themen/Aufgaben, unklare Punktwerte, ob echte Mehrgeräte-Rangliste bereits funktioniert oder Backend-Konfiguration fehlt, Testergebnisse und offene Punkte. Nicht behaupten, etwas sei live oder synchron, wenn es nicht überprüft wurde.

## 11. Umsetzungshinweis für das gewünschte Feeling

Das Ganze soll sich **wie ein kleines Abenteuer im Logbuch** anfühlen – emotional, hochwertig und auf Kinder/Jugendliche abgestimmt, aber nicht kindisch. Karte, persönliche Reise, sichtbare Fortschritte, Teamgefühl, Wochen-Challenges und Rangliste stehen im Fokus. **Wichtigste UX-Regel: Erst auswählen, dann öffnet sich der nächste Bereich.** Weniger langweilige Kacheln, mehr Entdecken. Sehr hochwertige Desktop-Ansicht und gleichzeitig hervorragende iPhone-/iPad-Bedienung.
