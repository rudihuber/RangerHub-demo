# Dashboard, Treffenplanung und Rezepte

Diese Änderungen liegen zunächst auf `feature/open-dashboard-meeting-planning`.
Die bestehende Pages-Seite folgt weiterhin `main`, bis die Änderungen geprüft
und übernommen werden.

## Oberfläche

Das Dashboard verwendet freie Abschnitte, große Typografie und offene Listen.
Die Illustration entfällt dort. Profil und Einstellungen bleiben über das
beschriftete Zahnrad-Icon erreichbar. Versionsnummern werden in der Oberfläche
und im Namen heruntergeladener Backups nicht mehr angezeigt.

Der Wachstumspfad integriert die vorhandene Illustration in die App. Die braune
Schrift wurde dunkler gesetzt und die gedruckte Seitenzahl entfernt. Es gibt
keine Bezeichnung als Originalseite; die fünf Stufen bleiben bedienbar.

## Automatischer Status

Eine Planung ist abgeschlossen, wenn eine Aktion eingetragen und ihre Leitung
zugewiesen ist. Naturphänomen und Impuls benötigen jeweils eine Leitung, außer
sie sind ausdrücklich als nicht vorgesehen markiert. Essen ist optional und
benötigt nur dann eine Leitung, wenn es vorgesehen ist.

- Vollständige Planung: ganzer Treffenblock grün.
- Unvollständig, heute bis einschließlich in sieben Tagen: ganzer Block rot.
- Sonstige unvollständige Treffen: neutral mit „Planung noch nicht abgeschlossen“.

Der Status wird aus den aktuellen Daten berechnet, auch im Dashboard und im
Kalender. Alte manuelle Statusfelder werden entfernt; es gibt keinen manuellen
Status-Schalter mehr. Unvollständige Planungen können weiterhin gespeichert
werden. Bereits erledigte Einkäufe sind keine Voraussetzung für einen fertigen
Planungsstatus.

## Essen und Rezepte

Lebensmittel werden einzeln abgehakt. Offene Zutaten erscheinen bei der für das
Essen verantwortlichen Leitung in „Meine Aufgaben“. Erledigte Einträge bleiben
nach Neuladen und Bearbeiten erhalten. Bei einer Neuzuweisung wechseln offene
Lebensmittel zur neuen Leitung. Aufgaben aus bestehenden Leitermeetings bleiben
ebenfalls sichtbar.

Rezepte werden je Stamm getrennt verwaltet. Ein ausgewähltes Rezept füllt
Lebensmittel und Zubereitung im Treffen aus. Das Treffen speichert eine eigene
Kopie: spätere Änderungen oder das Löschen des Bibliotheksrezepts überschreiben
keine bestehende Essensplanung. Beim Anlegen eines Rezepts aus einer noch nicht
gespeicherten Treffenplanung bleibt dieser Entwurf erhalten.

Dateiimporte unterstützen PDF, Word (`.docx`), Text, Markdown, JSON sowie Fotos.
Gescannte PDFs und Fotos werden per lokaler Texterkennung gelesen. Alle Dateien
bleiben dabei auf dem Gerät. Die Erkennung übernimmt vorhandene Rezeptinhalte;
sie erfindet keine Zutaten oder Zubereitungsschritte. Mengen und erkannte Schritte
müssen vor dem Speichern geprüft werden. Grenzen: 25 MB pro Datei, 20 PDF-Seiten.

## Daten und Betrieb

Die Demo bleibt unter `rhv9-demo`, die private App unter `rhv9`. Daten beider
Stämme, Rollen und vorhandene Fortschritte werden weiterverwendet. Backups
enthalten nun auch Rezepte und Einkaufslisten.

Die HTML-Datei verwendet die mitgelieferten CSS-, JavaScript-, Bild- und
`vendor`-Dateien. Zum Hosten muss daher das gesamte Verzeichnis bereitgestellt
werden. Es sind kein Backend, kein kostenpflichtiger KI-Dienst und kein Build
notwendig. Zum lokalen Testen einen HTTP-Server verwenden.

Tests: `python3 -m unittest discover -s tests -v`.

## Zur Überprüfung

- [Dashboard auf dem Desktop](screenshots/dashboard-desktop.png)
- [Dashboard auf dem Handy](screenshots/dashboard-mobile.png)
- [Integrierter Wachstumspfad](screenshots/growth-desktop.png)
- [Automatische Planungsfarben](screenshots/planning-states.png)
- [Rezeptimport aus einer PDF-Datei](screenshots/recipe-import.png)

Geprüft: 19 Tests in der Demo, 14 Tests in der privaten App, einschließlich echter
PDF-/DOCX-Importe und OCR einer gescannten PDF-Seite. Die Screenshots verwenden
ausschließlich fiktive Demo-Daten; die Beispiele für Planungsfarben wurden nur
in einem isolierten Testbrowser angelegt.

Die externe Gestaltungsreferenz war in der Entwicklungsumgebung durch die
Netzwerkrichtlinie nicht abrufbar. Die freie, typografische Gestaltung setzt
deshalb die beschriebene Richtung um, ohne eine exakte Nachbildung zu behaupten.
