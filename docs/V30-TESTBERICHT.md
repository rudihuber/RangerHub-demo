# Fachwissen – Abnahme der neuen Version

Stand: 4. November 2026. Getestet wurde die tatsächliche App: private kompakte HTML und öffentliche Demo, keine bloße Reparaturskript-Ausgabe. Sämtliche Tests benutzen vorübergehende Browser-Speicher und Datenbanken; keine produktiven Personen/Termine wurden zu Testzwecken bearbeitet.

## Ergebnis

- Öffentliche Demo: vollständiger aktueller Prüflauf **88/88 bestanden**, anschließend **25/25 echte HTTP-/Modell-Servertests bestanden**.
- Private kompakte HTML: vollständiger aktueller Prüflauf **85/85 bestanden**, anschließend **25/25 Servertests bestanden**.
- Nach Ergänzung der aus demselben Journal abgeleiteten Punkte im bestehenden Rangerprofil: Demo nochmals **24/24**, private HTML **26/26** gezielte Browser-/Verpackungsprüfungen bestanden. Keine Änderungen am Fachwissen-Backend nach dem vollständigen Servertest.
- Alle 185 Dateien des privaten Vorstands und 231 Dateien des Demo-Vorstands im vollständigen Backup gegen ihre vorher dokumentierten SHA-256 geprüft: identisch.
- Private HTML unter 25 MB; alle 17 Original-Asset-Referenzen einschließlich 12 PDF-Referenzen und alle nicht ersetzten ursprünglichen Inline-Skripte unverändert. Originalquellkatalog und bisherige Oberwelt-SVG identisch. Öffentliche Demo weiterhin ohne PDFs und mit ihren bestehenden fiktiven Profilen.

Prüfskript: `python tools/check_v30.py`. Gezielte Schlussprüfung: `PYTHONPATH=tests python -m unittest test_v30 test_v30_packaging test_v28.V28Tests.test_previous_ranger_profile_and_team_screen_can_be_restored test_planning_and_recipes.PlanningAndRecipeTests.test_editorial_layout_icon_and_growth_art_on_mobile_and_desktop -v`.

Die älteren versionierten Tests bleiben als Dokumentation ihrer Releases erhalten. Das frühere pauschale Bildverbot im Dashboardtest wurde für den ausdrücklich gewünschten funktionalen Wachstumspfad-Einstieg präzisiert; die entfernte dekorative Hero-Illustration bleibt ausgeschlossen. V29-Einreichungs-/Duelltests sind nicht die Abnahme des ausdrücklich ersetzten Workflows.

## Was geprüft wurde

| Bereich | Konkretes Ergebnis |
|---|---|
| Unterwelten | Alle fünf Szenen und sämtliche 36 Themenorte im Browser besucht; 253 Aufgaben, 302 Originalabsätze und 250 Punktnennungen erhalten; kein Thema doppelt/fehlend. |
| Bewusste Auswahl | Oberwelt ohne Aufgaben; Region ohne Aufgaben; Ort öffnet genau sein Thema, erst die gewählte Aufgabe ihre Details. |
| Navigation | Dashboard-Hotspot direkt zur passenden Unterwelt; Zurück, Escape, echte Touch-Eingaben, Hash-Direktlink, Reload mit offener Aufgabe und aktivem Profil; Stammwechsel ohne Fremddaten. |
| Anmeldung | Echte Kalender-ID, Datum/Ort und Aufgabe im Bestätigungsdialog; danach keine Punkte. Vier konkurrierende Anfragen belegen maximal drei Plätze, kategorienübergreifend; Wiederholungen und Request-Replay ohne Dubletten. |
| Rücktritt/Termine | Rechtzeitige Abmeldung gibt Platz frei. Bewertete Versuche zählen weiter. Absagen bleiben mit Datum/Ort im Verlauf; bewusster Ersatztermin mit erneuter Kapazitätsprüfung. Teamtermine, eigene Ranger-Abmeldung und unpassende/erfundene Termine geprüft. |
| Leiterprüfung | Gruppierung und Filter; Bestanden, Nicht bestanden und Nicht angetreten; keine vorzeitige Bewertung; Ergebnis verschwindet aus Offen, bleibt im Verlauf. Zwei Leiter erzeugen keine Doppelgutschrift. |
| Punkte/Rangliste | Genau eine aktive Gutschrift; Wiederholung nach Fehlversuch erst bei späterem Treffen; Original-Fitnessvariante 8 Punkte; ungeklärte Punkte blockiert bis zur begründeten Klärung. Top 3, persönlicher Rang und vollständige Rangliste aus bestätigtem Journal. |
| Redaktion | Alle fünf Entitätsarten über echte Formulare erstellt. Texte/Unterpunkte/Punkte, Quellen, Verschieben und lokale Rücksetzung; Revisionen, Sichtbarkeit, Archivierung und Rechteentzug serverseitig getestet. Bereits gebuchte/verdiente Fassungen bleiben unverändert. |
| Rollen | Ranger kann weder bewerten noch editieren; Leiter nie global/fremder Stamm/fremdes Team; Stammleiter nur lokal; Admin globale Basis plus Stammwechsel. Gleichlautende Ranger-IDs in anderen Stämmen teilen keine Daten. |
| Migration | Tatsächliche V29-App mit bestätigter Gutschrift und aktiver Sitzung nach V30 übernommen; unveränderte Personen/Kalender/Wachstumsdaten und Journal. Zusätzlich Schema-1-SQLite-Stand über Neustart idempotent migriert. Altdaten archiviert, aktive API ohne digitale Nachweise/Duelle. |
| Mehrgeräte | Drei getrennte Browserprofile, gemeinsamer echter Node-/SQLite-HTTP-Dienst: Rangeranmeldung → Leiterbestätigung → aktualisierte Punkte/Rangliste auf anderen Profilen → Neuladen. Abweichendes persönliches Token wird abgewiesen; kein lokaler Erfolg bei Serverfehler. |
| Bestehende App | Wachstumspfad einschließlich 0/79/80/99/100 %, vorgezogener Aufgaben und Bonuspakete; Rollen, Stammwechsel, Kalender-/Rezeptplanung, Warnung vor ungespeicherten Änderungen, Anwesenheit, Wetter, Fotos/Slides, Knotenprüfung, Vorschlagskataloge und Demo-Nachrichten weiterhin geprüft. |
| Speicherfehler | Voller LocalStorage löscht keine bisherigen Daten; anderer Tab und normale App-Speicherung überschreiben keine neueren Fachwissen-Buchungen. |

## Browser und Darstellung

Chromium mit Playwright; Desktop 1440×900, 1920×1080 und 1366×768; iPad-Größe 768×1024; Smartphones 390×844, 375×812, 320×568; Querformat 844×390. Zusätzliche unabhängige Touch-Kontexte in 320×568, 390×844 und 768×1024. Native Dialoge, Scrollbarkeit, Fokus und `prefers-reduced-motion` geprüft.

Alle Regions-/Themenort-/Wachstumsstations-Schaltflächen auf Grenzen, gegenseitige Überlappung und mindestens 44×44 px geprüft; keine ungewollte horizontale Seitenrolle. Screenshots der beiden Dashboardkarten, aller Unterwelten, Oberwelt, Leiter-Prüfungen, Registrierung, Rangliste und bestehender Wachstumspfaddarstellung erzeugt. Desktop-/Smartphone-Bilder wurden zusätzlich visuell geprüft. Index: [Screenshotliste](v30-screenshots.json), [Bilder](screenshots/v30/).

Die Top-3-Beispielbilder zeigen ausschließlich fiktive Browser-Testprofile mit über die normalen Prüfungsbefehle bestätigten Testaufgaben. Diese Fortschritte werden nicht in die eigentliche Demo oder private App eingebaut.

## Verbleibende Einrichtung und Grenzen

Die öffentliche Vorschau ist weiterhin eine lokale Demo. Ein produktiver HTTPS-Host, dauerhafte Datenbank, persönliche Authentifizierung und die konkrete Frontend-Konfiguration sind **noch nicht aktiviert**. Die serverseitige Mehrgerätefunktion ist lokal tatsächlich getestet; sie wird nicht als bereits erreichbare öffentliche Online-Speicherung ausgegeben. [Einrichtung](V30-BACKEND.md).

Kein physisches iPhone/iPad und keine verfügbare WebKit-/Safari-Laufzeit in dieser Umgebung. Die iPhone-/iPad-Abnahme beruht auf Chromium mit passenden Viewports und echten Touch-Kontexten; Safari auf echten Geräten sollte nach Bereitstellung zusätzlich geprüft werden. Screenreader-Beschriftungen/Fokus sind implementiert, ein manueller VoiceOver-Test war nicht verfügbar.

Chat, Fotos und andere bisher lokale Bereiche werden nicht durch den Fachwissen-Dienst plötzlich geräteübergreifend synchronisiert. Die API synchronisiert Prüfungen, Ergebnisjournal, Katalog-Layers und die für Prüfungen nötigen bestehenden Kalenderdaten. Kalenderkonflikte/Verbindungsfehler werden gemeldet; keine stille Ersetzung einer noch unbestätigten lokalen Planung.
