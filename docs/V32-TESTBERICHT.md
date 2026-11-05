# V32 – Umsetzung und Abnahme

Geprüft: tatsächliche kompakte HTML und öffentliche Demo, echter Chromium-Browser und vorhandener Node-24-/SQLite-Dienst. Alle Schreibtests verwenden ausschließlich vorübergehende Browserprofile und Testdatenbanken. Keine produktiven Nutzer- oder Browserdaten wurden für Tests verändert.

## Ergebnisse

- Öffentliche Demo: **111/111 Browser- und Integritätsprüfungen bestanden**.
- Private kompakte HTML: **106/106 Browser- und Integritätsprüfungen bestanden**.
- Node-/SQLite-Dienst: in beiden Checkouts jeweils **55/55 Servertests bestanden**, davon zehn neue Ranger-Wissen-Prüfungen und 45 bisherige Fachwissen-/Bibelreise-Prüfungen.
- Abschließende Gesamtläufe: Demo 249,8 Sekunden; private HTML 391,1 Sekunden. Keine verbleibenden Testfehler. Eine zusätzliche echte Browserprüfung der Wissenswelt und Verwaltung erzeugt die Übergabe-Screenshots.

- Vollständiges Vorversionsbackup SHA-256-geprüft: **364 private Dateien und 409 Demo-Dateien**. Git-Sicherungspunkt `backup/before-v32-ranger-wissen`; V31 bleibt zusätzlich im Repository erhalten.
- Private V32-HTML unter **25.000.000 Bytes**, verlustfrei neu gepackt. Alle **17 ursprünglichen Asset-Referenzen einschließlich zwölf PDF-Referenzen** identisch; 17 andere Inline-Skripte unverändert. Neue Funktionen sind direkt eingebunden. Öffentliche Demo weiterhin ohne PDFs und mit ihren bisherigen fiktiven Personen.
- Kein neuer LocalStorage-Key. Private Daten bleiben in `rhv9`; die Demo behält ihren bereits zuvor getrennten Key `rhv9-demo`. Reine Wissensansicht erzeugt keine neuen Wissensdatensätze oder Punkte.

## Neue Funktionen tatsächlich geprüft

| Bereich | Nachweis |
|---|---|
| Vollständige Quelle | 16 eindeutige Module, fünf Gruppen, 76 echte Erklärungen. Im Browser alle 16 Module und alle Symbolerklärungen geöffnet, einschließlich der 13 noch nicht veröffentlichten Themen in der Leitungsansicht. |
| FECG-Inhalte | Emblem mit Kreuz, Feuer, Kompass und dekorativer Lilie; acht Eigenschaften einzeln auswählbar. Originalbedeutungen, religiöse Aussagen und Quellzuordnung erhalten. Keine erfundenen Altersspannen oder übernommenen Beispiel-Stammdaten. |
| Progressive Navigation | Welt → Gruppe → Thema → ausgewählter Symbolpunkt. Keine automatisch geöffneten Aufgabenlisten und keine PDF-Seiten als Lernoberfläche. Browser-Zurück, eigene Zurück-Schaltflächen und Direktlinks geprüft. |
| Anfangsfreigaben | Genau `start`, `emblem`, `eigenschaften` für Ranger sichtbar; alle anderen Module fertig, aber verborgen. Leere Gruppen für Ranger nicht angezeigt. |
| Veröffentlichung | Echte Schiebeschalter per Maus und Tastatur, sofortige Persistenz, Reload, Ranger-Vorschau, Ausblenden und verständlicher gesperrter Direktaufruf. |
| Mehrgeräte-Freigabe | Zwei unabhängige Browserprofile mit getrenntem Speicher am selben Testserver: Stammleitung veröffentlicht Lilie → Ranger sieht sie; Rücknahme → offener Ranger-Direktlink wird gesperrt. Auch nach Reload korrekt. |
| Rechte / Stammesgrenzen | Admin global und lokal; Stammleiter nur eigener Stamm; Leiter lesen, veröffentlichen nicht. Ranger auch per manipuliertem HTTP-Auftrag ohne Editierrechte. Fachwissen-Delegation verleiht keine Ranger-Wissen-Publikation. Globale Standards und lokale Overrides getrennt. |
| Redaktion | Gruppe, Modul und Symbolpunkt über echte Formulare erstellt; Texte, Zuordnung, Symbol/Lerngrafik und Reihenfolge bearbeitet. Archivieren, Wiederherstellen, Historie und Revisionskonflikte geprüft. Globale Reichweite und Gruppen-Editor bleiben nach Reload korrekt erhalten. |
| Datenintegrität | Keine Ranger-Wissen-Punkte; vorhandenes Punktejournal und Personen bleiben bei Redaktion unverändert. Bestehende Nutzer-/Stamm-, Wachstums-, Kalender-, Fachwissen- und Bibeldaten nach Reload erhalten. |
| Eigene Bibelreise | Eigener aktiver Hauptreiter und kanonische Route; alte `#fw/bible…`-Links umgeleitet. Alle 66 Buchdetails und Originalwerte, Markieren/Rücknahme, genau 240 Punkte, echte Touch-Bedienung und getrennte Server-Browser geprüft. Normales Fachwissen-Thema „Die Bibel“ mit sieben Aufgaben bleibt erhalten. |
| Bücherkontrast | Offene Bücher hell/dunkel lesbar; gelesene Bücher dunkelgrün/hell lesbar plus Häkchen. Beide bleiben anklickbar. Dashboard und Bibliothek verwenden dieselben tatsächlichen Markierungen. |
| Dashboard | Exakte DOM-/Ansichtsreihenfolge Treffen → Anwesenheit → zwei Karten → Bibelreise → zwei Ranglisten → Geburtstage. Störende alte Zwischenblöcke und „Dein Weg“ entfernt; zugrunde liegende Funktionen bleiben erhalten. |
| Treffen / Kalender | Echter Stammes-/Teamtermin; abgesagte, vergangene und bereits beendete heutige Treffen übersprungen. „Heute“, kein Termin und Berliner Kalender-Tagesdifferenz einschließlich Sommer-/Winterzeitgrenze geprüft. Eigene Abmeldung direkt im Dashboard und Rücknahme funktionieren weiterhin. |
| Anwesenheit | Vorhandene Anwesenheitsdaten, kein erfundener Wert. SVG-Container bei allen Testgrößen quadratisch, Ring vollständig sichtbar und tatsächlich kreisrund. |
| Karten | Kompakte, wirklich interaktive Vorschauen. Vollständige Expeditionskarte und Fachwissen-Unterwelten erreichbar. Wachstum nur beim eigenen Ranger, keine persönliche Expeditionskarte im Verwaltungsdashboard. Standort beim mobilen Öffnen sofort in Sicht; keine konkurrierenden Scrollanimationen. |
| Ranglisten | Wachstum aus bestätigter Stufen-/Aufgabenerfüllung, Punkte separat aus bestätigtem Fachwissen plus aktiv gelesenen Bibelbüchern. Gleiche Stände, eigene Position und Stammestrennung geprüft; keine vertraulichen Profile über Ranglistenzeilen. |
| Geburtstage | Letzter Dashboard-Abschnitt, nächste 30 Tage chronologisch, nur erforderliche Namen/Kürzel und Tag/Monat. Keine Geburtsjahre oder Altersangaben für Ranger. |
| Wetter | Anmeldung ohne Wetterelement **und ohne Wetter-Netzwerkaufrufe**. Detaillierter Stammwetter-Abruf erhalten, kompakte Anzeige bleibt auch nach wiederholter Datenaktualisierung sichtbar. Treffpunktprognose aufklappbar. |

## Bestehende Funktionen

Unverändert weiter geprüft: 36 Fachwissen-Themen mit allen 253 Aufgaben/302 Quellabsätzen, drei Prüfungen je Ranger/Treffen, Leiterbestätigung, fehlgeschlagene Prüfungen und späterer Wiederholungsversuch, Rückzug und Umbuchung, Schutz vor Doppelgutschriften und veralteten Anfragen, globale/lokale Fachwissen-Redaktion, historisches Journal und bestehende Punktmigration.

Wachstum mit **0 %, 79 %, 80 %, 99 % und 100 %**, vorzeitigen Folgestufen, automatischer offizieller Hochstufung, Beobachter-Bonuspaketen, gesperrten Stationen, Stufen ohne Aufgaben, Leiter-Häkchen, Markerposition/-bewegung, reduzierter Bewegung, vorhandenen PDFs und kollidierenden Ranger-IDs in getrennten Stämmen. Rudi Hubers Adminrecht und Ben Hensels Stammleiterrolle bleiben erhalten.

Außerdem Treffenplanung mit Speichern/Verwerfen/Weiterbearbeiten-Warnung, Anwesenheits-Checkboxen, Bestätigungsdatum und Leiter, zwei Knoten-Prüftage, Rezepte samt PDF-/Word-/lokalem OCR-Import, Einkaufslisten, Foto-Speicherung und Treffen-Slides, Vorschlagsbibliotheken, mobiler Rückweg, bisheriger Demo-Chat, Speicherfehler und nicht behauptete Zustellung. Der frühere Dashboard-Fotoblock ist gemäß der neuen verbindlichen Reihenfolge entfallen; Foto-Daten und Treffen-Fotoansicht bleiben erhalten.

Die versionierten V32-Regressionen passen ausschließlich die ausdrücklich geänderten Einstiegspunkte, Dashboard-Selektoren und Screenshotpfade an. Fachliche Punkte-, Rollen-, Daten-, Prüfungs- und Speichererwartungen wurden erhalten. Frühere Testdateien und Screenshots bleiben unverändert archiviert.

## Darstellung und Grenzen

Echte Chromium-Screenshots und geometrische Prüfungen: **1440×900, 1920×1080, 1366×768, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 375×812, 320×568 und 844×390**. Zusätzliche Touch-Kontexte für kleine iPhones und iPad, Tastatur, Fokus, ARIA-Beschriftungen, ≥44-Pixel-Symbolziele und `prefers-reduced-motion`. Keine horizontale Seitenrolle, überlappenden Wachstumsstationen oder abgeschnittenen Stationsflächen. Die mobilen Fachwissen-Vorschauen zeigen vier gut bedienbare Orte; alle Gebiete bleiben über „Karte vollständig öffnen“ zugänglich.

Beispiele unter `docs/screenshots/v32/`: `dashboard-1440x900.png`, `dashboard-390x844.png`, `dashboard-320x568.png`, `emblem-390x844.png`, `wisdom-world-390.png`, `properties-390.png`, `wisdom-manager-desktop.png`, `wisdom-manager-phone.png`. Screenshots verwenden ausschließlich isolierte Teststände; beispielhafte Lesepunkte sind keine neuen voreingestellten Nutzerpunkte.

**Echte Safari-/WebKit- und physische iPhone-/iPad-Abnahme war in dieser Umgebung nicht verfügbar.** Es wurden Chromium mit realen Touch-Ereignissen und passenden Bildschirmgrößen getestet; das wird nicht als Safari-Test ausgegeben.

Die veröffentlichte Demo ist lokal. Gemeinsame Veröffentlichung, Prüfungen und Bibelpunkte wurden am echten temporären Server geprüft; produktiver Host, persönliche Zugangsdaten und die geschützte Online-Auslieferung sind noch einzurichten. Details: `V32-BACKEND.md`. Der statische Offline-Basiskatalog ist für lokale Bedienung enthalten und daher im Quellcode lesbar; vertrauliche zukünftige Inhalte benötigen authentifizierte Auslieferung. Die Server-API liefert verborgene Ranger-Wissen-Texte tatsächlich nicht an Ranger aus.

Aktueller vollständiger Prüfbefehl: `python tools/check_v32.py`. Neue/alte Servertests: `node --test backend/test-wisdom-v32.mjs backend/test-bible-v31.mjs backend/test-knowledge-v30.mjs`.
