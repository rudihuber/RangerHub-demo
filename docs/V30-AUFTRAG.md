# Codex-Änderungsauftrag: RangerHub – Fachwissen V2

## 0. Verbindlicher Auftrag und Abgrenzung

Erweitere **die aktuell im Repository vorhandene und bereits eingespielte RangerHub-App**. Erstelle **keine neue isolierte Anwendung**, keine reine Design-Demo und keine parallele Fachwissen-Datenbank. Die bereits umgesetzte Fachwissen-Oberwelt, die vorhandenen Rangerprofile, Rangertreffen, Rollen, Punkte, Aufgaben, das Dashboard und die vorhandene Wachstumspfad-Karte bilden den Ausgangspunkt.

**Diese Anweisung korrigiert frühere Anforderungen ausdrücklich:**

1. **Unterwelten ergänzen:** Aus *jeder* in der bestehenden Oberwelt anklickbaren Fachwissen-Region gelangt man zunächst auf eine **eigene interaktive Unterwelt-Karte**. Erst ein Klick auf einen Ort der Unterwelt öffnet dessen Themen-/Aufgabenbereich. Keine sofort eingeblendeten riesigen Listen.
2. **Keine Ranger-gegen-Ranger-Challenges:** Den bisherigen Challenge-/Arena-Raum auf **Rangliste** reduzieren. Keine Duelle, Einladungen, Wettkämpfe, Gegnerauswahl, Challenge-Belohnungen oder Challenge-Benachrichtigungen.
3. **Keine digitalen Nachweise oder Einreichungen:** Keine Foto-/Datei-Uploads, keine Nachweisgalerien, keine verpflichtenden Textantworten, kein automatisches Bestehen. Eine Aufgabe wird **persönlich beim Ranger-Treffen** vorgeführt/erklärt und anschließend durch einen berechtigten Leiter als **bestanden** oder **nicht bestanden** beurteilt.
4. **Maximal 3 Prüfungsanmeldungen je Ranger und konkretem Ranger-Treffen.** Anmeldung erfolgt vorher an einer einzelnen Fachwissen-Aufgabe; die App zeigt das nächste geeignete Rangertreffen und freie Plätze an.
5. **Leiter-Arbeitsbereich:** Alle für ein Treffen angemeldeten Aufgaben nach Treffen und Ranger geordnet anzeigen. Mit einem Klick Ergebnis erfassen; danach verschwindet der Vorgang aus der **offenen** Arbeitsliste, bleibt aber im Archiv und in der Historie.
6. **Redaktionelle Verwaltung:** Admin kann Inhalte global und für alle Stämme ändern. Stammleiter können dieselben Inhalte **ausschließlich für den eigenen Stamm** anpassen. Berechtigte Leiter können Inhalte ihres eigenen Stamms pflegen (siehe Rollenmatrix). Kategorien, Unterwelten, Orte, Themen, Aufgaben, Texte und Punktwerte sinnvoll verwalten.
7. **Dashboard:** Sowohl die **bereits vorhandene interaktive Karte** als auch eine **neue Fachwissen-Karte** attraktiv integrieren; dazu Gesamtpunkte, nächste angemeldete Prüfungen und eine deutlich sichtbare Top-Rangliste.

Die Punkte 2 und 3 **überschreiben** frühere Codex-Anweisungen zu Duellen, Challenge-Workflows, Foto-/Dateinachweisen und „Ergebnis einreichen“. Andere bestehende Funktionen unangetastet lassen.

## 1. Vor jeder Änderung

- Repository und tatsächlich laufende Version vollständig analysieren: Navigationsstruktur, Fachwissen-Oberwelt, vorhandene Map-Komponente, Ranger- und Leiterrollen, Stämme, Rangertreffen-Kalender, Datenzugriff, Punktestand/Rangliste, Dashboard, vorhandene Schreibrechte und vorhandene Backend-Daten.
- Vorher Commit/Backup erstellen; nicht einfach große Komponenten neu schreiben. **`localStorage`-Key `rhv9` unverändert beibehalten**, nicht löschen, nicht überschreiben und ggf. nur rückwärtskompatibel migrieren.
- Bereits importierte Aufgaben und Originalpunktwerte beibehalten. Falls vorhanden: `RangerHub_Fachwissen_Quellkatalog.json` und die ursprünglichen Logbücher weiterhin als inhaltliche Referenz verwenden. Originaltext und Quelle revisionssicher behalten; kundenseitige/stammbezogene Anpassungen als separaten Daten-Layer speichern.
- Vorhandene aktive Punkte und Rangerzuordnungen **nicht** neu initialisieren. Keine Testdaten in produktive Rangerprofile schreiben. Kein sichtbar eingeblendetes „V2“, „V30“ o. ä.
- Bestehendes Design übernehmen und sichtbar verbessern statt eine zweite Designsprache einzubauen.

## 2. Neue Navigationshierarchie: Oberwelt → Unterwelt → Thema → Aufgabe

### Einstieg „Fachwissen“
Beim Öffnen des Hauptreiters sieht man die **bestehende Oberwelt** mit den bisherigen Fachwissen-Regionen, den eigenen Fachwissen-Gesamtpunkten und einem kompakten Prüfungsstatus. Die bisherigen Regionen und deren Zuordnung sind zu erhalten. Es werden **keine Themenlisten oder Aufgaben automatisch aufgeklappt**.

### Klick auf eine Oberwelt-Region
Ein Klick, z. B. auf **„Glaube & Gemeinschaft“** (oder deren tatsächlich vorhandenen Namen), öffnet **eine eigene, großflächige, visuell anders gestaltete Unterwelt**: etwa ein erkundbares Dorf mit Gemeindehaus, Bibliothek, Missionsstation, Marktplatz und Medienwerkstatt. Die einzelnen Bauwerke/Hotspots entsprechen den im Quellkatalog vorhandenen **Themen**. Noch keine Aufgabenliste anzeigen.

### Klick auf einen Ort in der Unterwelt
Klick auf z. B. „Gemeindehaus“ öffnet nur **„Gemeinde“** mit Kurzbeschreibung, persönlichem Fortschritt, möglichen/bereits verdienten Punkten und einer kompakten **Liste der Aufgaben**. Erst Klick auf eine einzelne Aufgabe öffnet die vollständige Aufgaben-Detailansicht mit der Prüfungsanmeldung.

**Feste Interaktion:** `Fachwissen-Oberwelt → Region auswählen → Unterwelt dieser Region → Themenort auswählen → Aufgabenliste dieses Themas → Aufgabe auswählen → Aufgabe + Anmeldeaktion`.

- Jede neue Ansicht wird **aktiv per Klick/Tap** ausgelöst. Keine automatischen Popups, keine auf Hover geöffnete Navigation, keine unkontrolliert expandierenden Kacheln.
- Eindeutiger Pfad zurück (Breadcrumbs), Zurück-Button und Browser-/Geräte-Zurück; dabei keinen Fortschritt verlieren. Beim Wechsel der Region alte Auswahl schließen. Jeweils **nur eine Ebene/Detailansicht gleichzeitig** offen.
- Bestehender Oberwelt-Marker „Challenge-Arena“ → **„Rangliste“ / „Ranger-Rangliste“**: Klick führt nur zur Ranking-Ansicht, nicht zu einer Unterwelt mit Duellen.
- Unterwelten sollen genauso hochwertig und interaktiv sein wie die Oberwelt: nicht einfach eine Liste von Kacheln auf einem Hintergrundbild.

### Unterwelten für **alle** vorhandenen Regionen
Nutze die bestehenden Oberwelt-Regionen als oberste Ebene und lege **für jede davon** eine eigene Szene mit Orten an. Eine bewährte Zuordnung aus dem bisherigen Auftrag (bei abweichenden aktuellen Regionstiteln die **bestehende** Zuordnung beachten):

| Oberwelt-Region | Gestaltungsidee der Unterwelt | Anklickbare Themenorte (aus den Quelldaten) |
|---|---|---|
| **Wildnis & Lager** | Waldcamp mit Feuerplatz, Zeltplatz, Fluss, Hochsitz und Rangerhütte | Waldläufer, Zeltbau, Lagerbau, Feuerbohren, Campkochen, Naturschutz |
| **Entdeckerland** | Entdeckerlandschaft mit Sternwarte, Wetterturm, Tierpfad, Vogelbeobachtung und Winterberg | Astronomie, Wetterkunde, Vogelkunde, Naturkunde, Tierkunde, Winterkunde |
| **Rettungsstation & Bewegung** | Outdoor-Rettungsbasis mit Erste-Hilfe-Zelt, Kanuanleger, Fahrradstation, Trainingsplatz | Erste Hilfe, Rettungsschwimmer, Fitness, Kanu, Fahrrad |
| **Werkstatt & Kreativität** | Lebendiges Handwerkerdorf mit Werkstatt, Küche, Kunsthaus, Angelsteg, Garten | Motor, Hobby, Handarbeiten, Bogenschießen, Kochen, Angeln, Garten, Bilder, Videos, Musik |
| **Glaube & Gemeinschaft** | Ranger-Dorf mit Gemeindehaus, Bibelbibliothek, Missionshaus, Begegnungsplatz, Redaktionshaus | Die Bibel, Biblische Ereignisse, Gemeinde, Geistlicher Dienst, Missionsarbeit, FECG-Rangers, Gäste, Bürgerkunde, Medien |
| **Rangliste** | Ein kompakter Ranglistenraum / Gipfel mit Podium | **Keine Aufgaben/Unterwelt nötig**; ausschließlich Ranking und eigene Platzierung |

Die insgesamt **36 Quellthemen** müssen anhand ihrer IDs eindeutig, vollständig und nur einmal einem interaktiven Unterwelt-Ort zugeordnet werden. Gibt es wegen der zehn Themen einer Szene Platzprobleme, logisch gruppierte Stadtviertel oder eine zweite räumliche Ebene **innerhalb dieser Unterwelt** verwenden, aber keine stillschweigend verschwundenen Themen und keine neue große Aufklappliste. Themen- und Kategoriennamen aus der Datenquelle beibehalten, ansprechende Ortsnamen nur als zusätzliches UI-Label nutzen.

### Bildsprache und Responsivität
- Inspiriert vom FECG-Logbuch: Waldgrün, Sand/Papier, Wege, handgezeichnete Details, Kompass, Ranger-/Outdoor-Symbole; modern, sauber, nicht kindisch. Jede Unterwelt bekommt eine erkennbare eigene Identität, jedoch ein durchgängiges Designsystem.
- Orte sind **erkennbare visuelle Objekte** mit größeren Klick-/Touchflächen (mindestens 44×44 px) und lesbarer Kurzbeschriftung. Dezente Aktivzustände/Animationen; `prefers-reduced-motion` beachten.
- Desktop: Karte großzügig, aber vollständig und ohne unnötiges Seitenscrollen sichtbar. Themenpanel rechts oder als gezielte Detailansicht.
- iPhone/iPad: eigenständige nutzbare Kartenanordnung statt extrem verkleinerter Desktop-Karte; nutzbare Pan-/Zoom-Funktion oder sinnvoll angepasster Zuschnitt; Details als gut bedienbares Bottom-Sheet. Keine verdeckten Buttons oder horizontal ungewollt scrollende Seite.
- Gute Performance: SVG/CSS/leichte Vektoren und Lazy Loading statt schwerem 3D, große Bilder komprimieren, kein dauerndes Re-Rendern der ganzen Karten. Tastaturnavigation und Screenreader-Labels.
- Fortschritt je Ort als kleine, eindeutige Markierung: `3/8 bestanden`, `+18 Punkte` (nur wenn aus Daten korrekt berechenbar). Nicht bestätigte Prüfungen geben keine Punkte.

## 3. Prüfungsmodell – KEINE Nachweise, KEINE Duelle

### Ranger-Sicht: einzelne Aufgabe für ein Treffen anmelden
In jeder Aufgaben-Detailansicht:

- Vollständiger Aufgabeninhalt inkl. vorhandener Unterfragen und offizieller Punktzahl.
- Status verständlich anzeigen: `Noch nicht angemeldet`, `Für Treffen angemeldet`, `Bestanden`, `Nicht bestanden – erneut möglich`, ggf. `Nicht verfügbar` oder `Treffen abgesagt`.
- Hauptbutton für geeignete, noch nicht bestandene Aufgaben: **„Beim nächsten Rangertreffen vorführen“** / **„Zur Prüfung anmelden“**. Zusatztext: „Du erklärst oder zeigst die Aufgabe persönlich beim Treffen. Es sind keine Dateien oder Fotos notwendig.“
- Den **nächsten tatsächlich geplanten, passenden Rangertreffen-Termin** des Rangers/Stamms aus der bestehenden Terminverwaltung verwenden, inklusive Ort und Datum; niemals ein erfundenes Datum. Falls mehrere zulässige Termine oder Teams vorhanden sind, nur passende anbieten oder eine einfache Terminauswahl ermöglichen.
- Bei Klick eine kleine Bestätigung zeigen: **Aufgabe + Punkte + Treffen + bisherige Anmeldungen (`2 von 3`)**. Dann anmelden; sofort Status aktualisieren.
- Eine bereits bestandene Aufgabe kann nicht nochmals Punkte bringen. Nach `Nicht bestanden` ist Anmeldung **für ein späteres Treffen** erneut möglich.
- Nicht bestanden ist **kein negatives Punktkonto**; es gibt einfach noch keine neuen Punkte.
- Kein `Ergebnis einreichen`, `Foto aufnehmen`, `Dokument hochladen`, `Upload`, `Nachweis anhängen`, `Ranger-Challenge starten`, `Gegner wählen`. Alte UI-Aktionen und zugehörige Pflichtvalidierung konsequent entfernen.
- Informative Kurznotizen zur Vorbereitung können lokal angezeigt werden; **kein digitaler Prüfnachweis wird gesammelt**.

### Harte Drei-Prüfungen-Regel
- **Maximal drei verschiedene Fachwissen-Aufgaben pro Ranger UND pro konkreter Treffen-ID** (`meetingId`). Gilt über sämtliche Kategorien/Unterwelten hinweg, nicht drei pro Kategorie.
- Der Zähler berücksichtigt alle für das Treffen verbindlich angemeldeten sowie dort **tatsächlich geprüften** Aufgaben. `Bestanden` und `Nicht bestanden` bleiben als Versuche für dieses Treffen gezählt, selbst wenn sie aus der offenen Leiterliste verschwinden.
- Mehrfaches Drücken, Reload, mehrere Geräte und konkurrierende Anmeldeversuche dürfen keine vierte Prüfung und keine Dublette erzeugen. Grenze **serverseitig/transaktional** prüfen, nicht bloß Button deaktivieren.
- **Abmeldung vor dem Treffen** möglich (sofern noch nicht bewertet): gibt den Platz wieder frei und verschwindet aus offener Liste. Keine Abmeldung nach Bewertung.
- Wenn Aufgabe für dasselbe Treffen schon angemeldet ist, keinen zweiten Datensatz erlauben. Eine bereits anderswo für dasselbe Treffen angemeldete Aufgabe wird ebenfalls abgefangen.
- Kann ein Ranger nicht teilnehmen, darf der Leiter `Nicht angetreten` markieren; **ohne Punkte** und im Verlauf gespeichert. Das ist kein `Nicht bestanden`. Ob Neu-Anmeldung zu einem Folgetermin möglich ist: ja.
- Nach Terminabsage Anmeldungen nicht löschen; in klaren Status `Treffen abgesagt / neu zuordnen` überführen und nach Freigabe auf einen konkreten Ersatztermin verschieben. Keine automatische Anmeldung ohne verständliche Anzeige.
- Falls kein nächstes Treffen vorhanden: Button deaktivieren, klarer Hinweis „Noch kein Rangertreffen geplant“ und ggf. Link zur Treffenübersicht.

### Leiter-Sicht: Prüfungszentrale
Der bestehende Leiter-Arbeitsbereich erhält eine **„Fachwissen-Prüfungen“**-Ansicht, gut sichtbar im Leiter-Dashboard.

1. Kopfzeile `Nächstes Rangertreffen: [Datum, Titel] · [x] Ranger · [y] offene Prüfungen`.
2. Standardmäßig **nur offene Anmeldungen** des ausgewählten Treffens. Filter: Treffen, Ranger, Thema, Status; Standardsortierung nach Ranger oder Anmeldezeit, Umschalter möglich.
3. Sinnvolle kompakte Darstellungen: **Gruppiert nach Ranger**, innerhalb jedes Rangers dessen maximal drei gebuchte Aufgaben. Optional Umschalter „Nach Thema“ für eine Prüfstation.
4. Pro Eintrag: Rangername, Aufgaben-/Themenname, Punktzahl, Original-Anforderung als aufklappbares Detail, Treffen/Datum und **zwei gut sichtbare Aktionsbuttons**: `✓ Bestanden` und `✕ Nicht bestanden`. Optional dritter Status `Nicht angetreten`.
5. Bei Bestanden: **einmalige** Gutschrift der Original- bzw. gültigen lokalen Punktzahl ins Fachwissen-Punktekonto; Rangerprofil, Gesamtpunkte, Dashboard und Rangliste aktualisieren. Bei Nicht bestanden: 0 neue Punkte; Status zeigt Wiederholung möglich.
6. Nach Ergebnisaktion verschwindet der Eintrag **sofort aus „Offen“**, und wird unter **„Abgeschlossen/Verlauf“** weiter sichtbar. Niemals einfach löschen. Kurze Rückmeldung und ggf. „Rückgängig“ nur über berechtigte, protokollierte Ergebniskorrektur.
7. Einträge mit unklarem Punktwert dürfen nicht unbemerkt als 0 Punkte durchgehen: Warnung, Leiter/Stammleiter muss vor Gutschrift gültigen Punktwert festlegen oder Aufgabe bis zur Klärung sperren.
8. Standardmäßig erst während des Treffens oder durch berechtigte Leiter danach bewerten; keine automatische Punktevergabe allein durch Voranmeldung. Leiter dürfen nur Ranger ihres zulässigen Stamms/Teams prüfen.
9. Leiteransicht auch auf iPhone gut nutzbar: Rangerkarten, große Bestanden/Nicht-bestanden-Schaltflächen, bestätigende Fehlbedienungssicherung; keine riesige Verwaltungs-Tabelle.
10. Nachträgliche Ergebniskorrektur nur durch Berechtigte, nachvollziehbar mit `actorId`, Zeit und Grund; doppelte Punkte und negative Summen verhindern.

## 4. Punkte und Rangliste – ausschließlich Leistungsvergleich über bestandene Aufgaben

- **Eine Fachwissen-Aufgabe → maximal eine offizielle Gutschrift pro Ranger und stabiler Aufgaben-ID.** Keine neuen Punkte für Anmeldung, Teilnahme, Übungsquiz, Anzahl der Klicks, Einladungen oder Ranglisteninteraktion.
- Offizielle Punkte stammen aus dem originalen Import oder einem ausdrücklich autorisierten Stammes-Override. Fehlende Quellpunktwerte bleiben als `nicht geklärt` markiert; keine Fantasiewerte.
- Gesamtsumme eines Rangers = **Summe seiner gültigen, leiterbestätigten, nicht zurückgebuchten Fachwissen-Gutschriften**. Wachstumspfad und andere Wertungen getrennt halten.
- Derselbe Punktestand soll **konsistent** auf Profil, Fachwissen-Seite, Unterwelten, Kartenmarkern, Dashboard und Rangliste erscheinen. Kein separater manipulierbarer `totalPoints` als zweite Wahrheit; Rangliste aus freigegebenem Ledger/Prüfergebnissen ableiten.
- Ranglistenraum (`Challenge-Arena` bisher) auf eine attraktive **„Ranger-Rangliste“** umbauen: Siegerpodest Top 3, komplette stammbezogene Rangliste aller berechtigten Ranger, eigener Platz hervorgehoben, eigene Gesamtpunkte, Position und bei Bedarf Abstand zum nächsten Rang. Gleichstände als Gleichstände behandeln (nicht künstlich Gewinner erfinden).
- **Keine** Gegnerauswahl, Duellkarten, Einladung, Match, Challenge-Abschluss, eigene Siegerpunkte, „Jemanden herausfordern“-Buttons, Push-/Chat-Herausforderungen oder Rankings aus Challenge-Punkten. Bestehende Challenge-Routen/Buttons entfernen/deaktivieren, historische Datensätze bei Migration nicht unkontrolliert löschen.
- Das **Dashboard** zeigt eine kompakte Top-3-Rangliste mit klickbarem Einstieg in die vollständige Rangliste; Fachwissen-Gesamtpunkte des eingeloggten Rangers und `x/3` Anmeldungen fürs nächste Treffen.
- Primär **Gesamtpunkte über alle Zeiten** anzeigen. Optional Zeitraumfilter nur dann, wenn sauber aus datierten Prüfungsbestätigungen berechenbar; keine fingierten Wochenpunkte.
- Ranger sehen nur die berechtigte Rangliste ihres Stamms (z. B. CLP-West), keine öffentlichen Kinderprofile. Admin darf bei Bedarf Stämme einzeln betrachten; übergreifende öffentliche Rangliste **nicht** automatisch aktivieren.

## 5. Rollen und Editierfunktion – echte Datenpflege

Baue für berechtigte Nutzer eine moderne **„Fachwissen verwalten“**-Ansicht (mit schützendem, serverseitigem Rechtecheck, nicht nur versteckten Buttons).

| Rolle | Prüfungen | Inhalte bearbeiten | Reichweite |
|---|---|---|---|
| **Ranger** | Eigene Aufgabe anmelden/vor dem Treffen zurückziehen; eigene Ergebnisse sehen | **Nein** | Eigene Daten, berechtigte Stammesansicht |
| **Leiter** | Anmeldungen des zugeordneten Stamms/Teams prüfen und abhaken | **Lokale Inhalte des eigenen Stamms bearbeiten** (anlegen/umbenennen/verschieben/archivieren); bei Bedarf vorhandene Leiter-Berechtigungslogik nutzen | Nur zugeordneter Stamm; **keine globalen** Änderungen |
| **Stammleiter** | Alle Prüfungen im eigenen Stamm verwalten, Ergebnisse berichtigen | **Volle lokale Redaktionsrechte** inkl. Kategorien/Unterwelten/Orte/Themen/Aufgaben, Punkte, Reihenfolge, Sichtbarkeit und Freigaben | Nur eigener Stamm |
| **Admin** | Alle Stämme verwalten / autorisierte Korrekturen | **Globale Basiskatalog-Änderungen**, lokale Stammesanpassungen, Kategorie-/Map-Verwaltung in allen Stämmen | Alle Stämme |

Wenn das vorhandene Rollensystem normale Leiter bewusst **nur** für Prüfung und nicht für redaktionelle Änderungen vorsieht, führe **separates, vom Stammleiter steuerbares Recht `canEditLocalKnowledge`** ein und mache die Vergabe eindeutig. Normale Leiter dürfen global nie etwas überschreiben. So ist das gewünschte Bearbeiten durch Leiter möglich, ohne die Stammleiter-/Admin-Grenzen aufzuweichen.

### Funktionen des Editors
- Kategorien (Oberwelt-Regionen und/oder offizielle Quellkategorien, klar getrennt), Unterwelt-Orte, Themen und **einzelne Aufgaben** hinzufügen, umbenennen, Texte bearbeiten, sortieren/verschieben, eigene Beschreibung/Icon hinterlegen.
- Punkte für lokale/neu erstellte Aufgaben setzen und mit Werteprüfung speichern; vorhandene Punkte nur über nachvollziehbare Änderung. Verfügbarkeits-/Sichtbarkeitsschalter `aktiv / verborgen`.
- Aufgaben/Kategorien „Löschen“ als **Archivieren/Soft Delete** umsetzen, mit Sicherheitsdialog und Prüfung auf bestehende Prüfungen/Punkte. Bereits vergebene Punkte, Prüfungsverläufe und Alt-Referenzen niemals durch Löschung verlieren. Kategorien mit Unterthemen nur mit expliziter Behandlung der enthaltenen Inhalte archivierbar.
- **Admin-Basiskatalog → Stamm-Override-Modell:** Globale Aufgabe A erscheint zunächst unverändert in allen Stämmen. Ändert der Stammleiter in CLP-West ihren Text oder Punktwert, wird **nur in CLP-West ein Override** angelegt; in anderen Stämmen bleibt die globale Version unverändert. Admin kann global ändern; Stamm-Overrides bleiben nachvollziehbar und dürfen nicht still überschrieben werden. Lokale eigene Aufgaben nur in ihrem Stamm sichtbar. Stammleiter kann Override bewusst auf globale Standardversion zurücksetzen.
- Aufgaben-ID stabil halten und Prüfungsdaten stets mit eindeutiger ID, Stammesbezug und zur Prüfung gültiger Punkte-Version referenzieren. Bei späterer Punktänderung bereits **verdiente Punkte nicht rückwirkend** still ändern; nur ausdrücklich autorisierte, protokollierte Korrektur kann historische Buchungen ändern.
- Einfacher Bearbeiten-Modus unmittelbar auf Kategorie-/Unterwelt-/Themen-/Aufgabenansicht **für Berechtigte** (z. B. dezentes Stift-Icon), zusätzlich zentrale Verwaltungsübersicht. Ranger sehen niemals diese Bearbeitungsfunktionen.
- Änderungen werden geräteübergreifend persistiert; Aktivitäts-/Versionsprotokoll mit Person, Zeit, vorher/nachher und Stamm. Bestätigungsdialog für Löschung, klare Validierungen, keine leeren Titel, keine doppelten IDs.

## 6. Dashboard: zwei gleichwertig attraktive Karten + Ranking

Gestalte das bestehende Dashboard **bewusst neu an**, ohne dessen andere wesentliche Informationen zu verdrängen.

**Desktop-Wunschlayout:**

1. Kopfbereich mit Begrüßung und knappen Kennzahlen: Fachwissen-Gesamtpunkte, Rang, bestanden `x` Aufgaben, nächstes Rangertreffen und `x/3` Anmeldungen.
2. Darunter **zwei gleichwertige, visuell hochwertige Kartenmodule** nebeneinander oder in einem ausgewogenen responsiven Raster:
   - **Bestehende Ranger-/Wachstumspfad-Karte**: unverändert funktional, nicht duplizieren oder kaputtmachen.
   - **Neue Fachwissen-Expeditionskarte**: attraktive **interaktive Mini-/Preview-Version** der aktuellen Oberwelt, mit klar sichtbaren Regionshotspots und eigenem Fortschritt. Klick auf einen Hotspot führt **direkt** in genau dessen Unterwelt im Hauptreiter Fachwissen (mit Zurück zum Dashboard). Die Vorschau muss nicht die komplette schwere Karte zweimal rendern; teile Daten/Komponenten sinnvoll und lade Details bei Bedarf nach.
3. Direkt sichtbar **Top-3-Rangliste** mit Podium / starken, ruhigen Platzierungsakzenten und Link „Gesamte Rangliste ansehen“; auf Wunsch daneben die nächste Prüfungsanmeldung.
4. Für Leiter zusätzlich eine kleine **Prüfungsübersicht** `7 offene Prüfungen beim nächsten Treffen` mit Einstieg in den Leiter-Arbeitsbereich; für Ranger nur eigene Anmeldungen.

**Mobile:** zuerst kompakte Punkte/Platzierung, dann die zwei Karten **untereinander**, gut lesbar und separat antippbar; Rangliste/Prüfung nicht unsichtbar tief im Scrollbereich verstecken. Klare visuelle Hierarchie und keine Kachelwüste. Kein doppeltes Verkleinern der Desktop-Illustration, keine waagerecht scrollende Seite. iPhone und iPad eigenständig prüfen.

**Interaktion:** Dashboard-Vorschau → Region anklicken → genaue Fachwissen-Unterwelt; Dashboard-Wachstumskarte → bisheriges Ziel. Zurück funktioniert zuverlässig. Beide Karten müssen visuell eigenständig sein, aber wie Teile derselben RangerHub-Welt wirken.

## 7. Datenmodell und Mehrgeräte-Synchronisation

Konkrete Namen können an die bestehende Architektur angepasst werden. Mindestens logisch trennen:

- `knowledgeRegions` / `knowledgeSubworldLocations`: Oberwelt-Regionen und Unterwelt-Orte mit `id`, `title`, `icon`, `x/y`/Layout-Konfiguration, `topicIds`, `stammId|null`, `sortOrder`, `isActive`.
- `knowledgeCategories`, `knowledgeTopics`, `knowledgeTasks`: stabile IDs, Originalquelle/-text, bearbeitete Anzeige-Texte, offiziell/importierte Punkte, lokale Overrides, Archivierungsstatus, Revision.
- `knowledgeExamRegistrations`: `id`, `rangerId`, `stammId`, `meetingId`, `taskId`, `status` (`registered`, `passed`, `failed`, `withdrawn`, `no_show`, `meeting_cancelled`), `registeredAt`, `reviewedAt`, `reviewedBy`, `pointsAtReview`, ggf. `revisionId`. **Keine Upload- oder Nachweisfelder**.
- `knowledgePointLedger`: einmalige fachwissenbezogene Buchung `rangerId`+`taskId`+`stammId`, mit Punktwert, Bezug auf Prüfergebnis, Prüfer, Zeit und protokollierter Storno-/Korrekturlogik. Eindeutige Constraints/Transaktionen.
- `knowledgeContentOverrides`: `stammId`, `sourceId`, `patchedFields`, `updatedBy`, `updatedAt`, `revision`. Eine globale Änderung darf die lokalen Overrides nicht löschen.
- `knowledgeAuditLog`: Änderungen/Prüfergebnisse und Korrekturen mit Akteur, Umfang, Stammesbezug, Zeit und ggf. Grund.

Wichtig: **Nur mit gemeinsamem, autorisiertem Backend** können Ranger, Leiter und Stammleiter zeitgleich dieselben Anmeldungen, Inhalte und Ranglisten auf eigenen Geräten sehen. Prüfe die bestehende Backend-Anbindung und **verwende sie**. Sollte kein Backend vorhanden sein, realisiere kein angebliches Mehrgeräte-Live-System allein mit `localStorage`: implementiere Schnittstellen/klare Fehlerzustände und dokumentiere genau, was zum Aktivieren fehlt. Änderungen müssen mit serverseitigen Rollen-/Stammesprüfungen autorisiert werden.

Migrationen idempotent und verlustfrei. `rhv9` bleibt erhalten. Alten Duellcode nicht mehr aufrufbar lassen; Daten nur nach geprüftem Migrationsplan archivieren, nicht ungefragt zerstören. Alte Nachweispflicht aus UI/Validation entfernen; vorhandene Altdateien nicht unkontrolliert löschen, aber künftig keine neuen Uploads erzeugen. Stammeswechsel muss Karten/Anmeldungen/Ranking neu laden und unberechtigte Daten verbergen.

## 8. Beispiel-Userflows (verbindlich)

**A. Ranger meldet sich an:**
1. Ranger öffnet Fachwissen → Oberwelt.
2. Tippt Glaube & Gemeinschaft → **eigene Unterwelt** mit einzelnen Gebäuden.
3. Tippt Gemeindehaus → Thema `Gemeinde` → kompakte Aufgabenliste.
4. Tippt genau eine Aufgabe → Detail mit Text und Punkten.
5. Tippt „Beim nächsten Rangertreffen vorführen“ → nächstes geeignetes Treffen bestätigen.
6. App zeigt `1 von 3 Prüfungen angemeldet`. Leiter sieht diesen Eintrag in der Prüfungszentrale.

**B. Drei-Plätze-Grenze:** Ranger meldet drei verschiedene Aufgaben für dasselbe Treffen an → Anzeige `3/3`. Vierte Anmeldung wird **auch bei paralleler Nutzung** blockiert. Vor dem Treffen eine Anmeldung zurücknehmen → wieder `2/3`; danach kann eine andere Aufgabe gebucht werden.

**C. Leiter bewertet:** Beim Rangertreffen öffnet Leiter `Fachwissen-Prüfungen` → sieht Ranger mit seinen drei Aufgaben → drückt `Bestanden` bei einer Aufgabe und `Nicht bestanden` bei der zweiten → beide verschwinden aus `Offen`, stehen im Verlauf, nur erste Aufgabe bringt Punkte; Rangliste aktualisiert sich. Die dritte bleibt offen.

**D. Stammleiter ändert Aufgabe:** Stammleiter CLP-West ändert Aufgabentext/Punkte oder fügt einen Themenort hinzu → nur CLP-West sieht die Änderung; ein anderer Stamm bleibt unverändert. Bereits bestätigte Punkte bleiben historisch korrekt. Admin kann globale Basis ändern und alle lokalen Overrides sehen.

**E. Dashboard:** Zwei visuell starke Karten werden angezeigt. Klick auf Fachwissen-Region öffnet direkt deren Unterwelt. Top-3-Rangliste zeigt reale bestätigte Gesamtpunkte. Kein Challenge-Button im Rankingraum.

## 9. Tests und verbindliche Abnahmekriterien

**Karten / Navigation**
- Jede bestehende Oberwelt-Region besitzt die passende funktionierende Unterwelt, außer `Rangliste` als bewusst eigener Raum.
- Die **36** Themen der Importquelle sind über Unterwelt-Orte erreichbar; keine Dubletten, keine versteckten Themen. Originaldaten bleiben unangetastet.
- Keine Themen/Prüfungen ohne Klick öffnen. Browser-Zurück, Mobile-Zurück, Direktlink, Reload und Stammeswechsel funktionieren. Keine weiße Seite nach Reload mit bestehender Sitzung.
- Desktop, iPhone klein/groß und iPad mit Screenshots visuell prüfen: Touchziele, Text, Performance, Zoom, Lesbarkeit und Kartenhöhe.

**Prüfungsworkflow / Punkte**
- Ranger kann 1–3 unterschiedliche Aufgaben für **dieselbe echte Treffen-ID** buchen; vierte wird serverseitig abgelehnt; keine Doppelanmeldung, keine Race-Condition.
- Unterschiedliche Treffen haben je eigene Grenze; Umbuchung/Abmeldung/Terminabsage/Nichtantritt korrekt.
- Nach Anmeldung 0 neue Punkte. Nach `Bestanden` genau einmal Punkte. Nach `Nicht bestanden` 0 Punkte; späterer Versuch erlaubt. Keine Doppelgutschrift bei Doppelklick, Reload oder zwei Leitern.
- Erledigte/fehlgeschlagene Einträge sind nicht mehr in der offenen Leiterliste, aber immer in Verlauf/Audit enthalten. Kein Anhang oder digitaler Nachweis erforderlich.

**Editor / Rollen / Dashboard**
- Ranger kann keine Prüfungen bestätigen, Punkte manipulieren oder Aufgaben editieren. Leiter nie fremden Stamm und nie globale Inhalte editieren. Stammleiter-Änderung bleibt lokal, Admin-Änderung global. Berechtigungen **auf Daten-/Backend-Ebene** testen.
- Archivierung und Umbenennen zerstören keine Prüfungs- oder Punktedaten; globale Updates überschreiben keine lokalen Anpassungen.
- Dashboard zeigt **beide Karten** plus Gesamtpunkte, Top 3 und passende Prüfungsinformationen. Fachwissen-Minikarte navigiert zu richtiger Unterwelt; Wachstumskarte bleibt intakt.
- Challenge-Arena ist ausschließlich Rangliste: kein Duell, keine Challenge-Einladung, keine Challengepunkte, keine Upload-/Einreichungs-Funktion.

**Abschlussbericht von Codex:** Nenne konkrete geänderte Dateien, gewählte Berechtigungsstruktur, Datenmigrationen, verfügbare Unterwelten/Orte, Prüfungsworkflow, Dashboard, Backendstatus und durchgeführte Tests inkl. Screenshots. Liste offene Punkte ehrlich auf. **Nicht** behaupten, dass eine geräteübergreifende Rangliste/Bestätigung funktioniert, wenn das Backend nicht getestet wurde.

## 10. Qualitätsziel

Das Erlebnis soll eine **wertige digitale Ranger-Abenteuerkarte mit Ober- und Unterwelten** sein, kein gewöhnlicher Aufgaben-Tab. Kinder/Jugendliche dürfen intuitiv entdecken; Leiter sollen beim Treffen möglichst schnell drei angemeldete Aufgaben pro Ranger prüfen können. **Freundschaftlicher Vergleich ausschließlich über die Rangliste, ohne Duelle.** Kein unnötiger Datenverbrauch durch Nachweise. Das Dashboard zeigt auf einen Blick **zwei interaktive Karten, Fortschritt und die Bestenliste**. Den bestehenden Funktionsumfang erhalten und die Änderungen end-to-end in der echten RangerHub-App fertigstellen.
