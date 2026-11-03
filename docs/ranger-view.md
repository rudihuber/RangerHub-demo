# Rangeransicht und Teilnahme

Die öffentliche Demo bleibt unter https://rudihuber.github.io/RangerHub-demo/
erreichbar. Zum Prüfen der Rangeransicht **Rangerstamm 01 → JB · Ranger** wählen.
Leiterfunktionen sind mit **DL**, Stammleiterfunktionen mit **PM**, alle
Verwaltungsfunktionen mit **RH · Admin** zugänglich.

Vor dieser Änderung wurde `backup/before-ranger-view-20261103` auf dem vorherigen
Commit `23f7667` angelegt. Die private Hauptanwendung und deren `rhv9` bleiben
unverändert. Die Demo speichert weiterhin unter `rhv9-demo`.

## Sichtbarkeit und Treffen

Ranger haben keinen Menüeintrag und keinen direkten Ansichtsaufruf für
Rangertreffen, Leitermeetings, Rezepte, Naturphänomene und Aktionen. Die bisherigen
Leiteransichten bleiben für Leiter, Stammleiter und Admin zugänglich.
Vergangene Rangertreffen befinden sich in einem zunächst geschlossenen Archiv.
Die Inhalte des Archivs werden erst beim Öffnen erzeugt; kommende Treffen
bleiben sofort sichtbar und sind aufsteigend nach Datum sortiert.

Das Ranger-Dashboard zeigt vom nächsten Treffen ausschließlich Datum, Uhrzeit,
Ort und Wetter. Auch ein Treffenaufruf aus dem Kalender zeigt nur diese Angaben.
Programmpunkte, Essensplanung, interne Notizen und Planungsstatus werden dort
nicht ausgegeben. Absagen erfolgen ausschließlich unter **Teilnahme**.

Die Vorhersage verwendet den Treffpunkt oder einen ausdrücklich gespeicherten
Wetterort des Treffens. Bei generischen Demo-Orten wie „Demo-Treffpunkt“ dient
der Wetterort des Stamms als Ersatz und wird so beschriftet. Die bisherigen
DWD-/Bright-Sky-Daten und der Open-Meteo-Ersatz bleiben erhalten. Ist kein
verlässlicher Abruf möglich, wird keine Wetterprognose erfunden.

## Persönliche Teilnahme

Der bisherige Menüpunkt „Abwesenheiten“ heißt **Teilnahme**. Ranger sehen eine
große ringförmige Anwesenheitsanzeige und die nächsten Rangertreffen. Die Quote
berechnet sich aus „anwesend / alle erfassten bisherigen Treffen“; entschuldigte
und unentschuldigte Fehlzeiten sind im Nenner enthalten. Zukünftige Treffen und
noch nicht erfasste Anwesenheiten zählen nicht mit. Ohne erfasste Daten zeigt die
App einen leeren Zustand mit Erklärung, keine erfundene Prozentzahl.

Bei einem kommenden Treffen kann der Ranger eine eigene Absage mit optionaler
Nachricht speichern und wieder zurücknehmen. Die Nachricht erscheint beim
Leiterteam in der Abmeldeliste des Treffens. Vergangene Treffen und fremde Profile
können darüber nicht verändert werden. Vorhandene Abwesenheitszeiträume bleiben
erhalten und werden berücksichtigt; die Leiteransicht zur Pflege solcher
Zeiträume bleibt verfügbar. Nur das Leiterteam trägt die tatsächliche Anwesenheit
ein. Eine Absage verändert keine bereits erfasste Anwesenheitsquote.

Wie die übrigen Demo-Daten liegen Absagen im jeweiligen Browser. Die Demo
versendet keine E-Mail und synchronisiert noch nicht zwischen Geräten. Für einen
produktiven gemeinsamen Betrieb werden weiterhin zentrale Datenhaltung und
echte Benutzeranmeldung benötigt.

## Wachstum und Dashboard

Die Wachstumsillustration hat keine Rollenlegende oben rechts mehr. Stufennamen
und Schulterschlaufen werden als Text über die bereinigte Grafik gelegt, mit
derselben Schrift wie in den Feldern. Auf dem Desktop liegen die Felder auf Höhe
der zugehörigen Farbbänder; auf dem Handy folgen sie unter dem Bild. Gesperrte
Felder zeigen ein SVG-Schloss und sind deaktiviert. Die bestehende Freigabe ab
80 Prozent bleibt unverändert. Der Hinweis steht einmal unter dem Wachstumspfad.

Der Personenzähler auf dem Dashboard ist durch einen Countdown bis zum nächsten
Treffen ersetzt. Für heute, morgen und noch fehlende Termine gibt es passende
Zustände. Ranger sehen unter 03 ihren gesamten bestätigten Fortschritt, die fünf
Stufen und aufklappbare Details nach Aufgabenbereichen. Der Gesamtwert gewichtet
jede Aufgabe gleich: bestätigte Aufgaben geteilt durch alle Aufgaben der fünf
Stufen einschließlich Beobachter-Paketen.

Die Rangliste unter 04 verwendet dieselbe Berechnung und ausschließlich Ranger
des aktiven Stamms. Gleicher Fortschritt bedeutet gleicher Rang; die eigene
Zeile wird hervorgehoben. Vorhandene Aufgaben- und Fortschrittsdaten werden nicht
ersetzt. Das Leiterteam sieht unter 03 weiterhin die Stammübersicht.

Die zusätzliche Stamm-/Rollenbox und der gelbe Fußtext in der Seitenleiste
entfallen. Nur der Admin behält den Stammwechsler. Auf der Anmeldung entfallen
„Draußen unterwegs. Gemeinsam verbunden.“ und die untere Sloganzeile.

## Prüfung

43 Inhalts- und Browsertests decken neue und bestehende Funktionen ab,
einschließlich aller Rollen, Neuladen, Stammtrennung, Absagen mit Nachrichten,
Anwesenheitsberechnung, Archiv, 80-Prozent-Grenze, Rangliste, Grafik-Ausrichtung,
Wetterort sowie PDF-/Word-Rezeptimport und OCR. Wetterantworten werden im Test
kontrolliert bereitgestellt; der Live-Abruf benötigt Internetzugriff.

- [Ranger-Dashboard](screenshots/ranger-dashboard.png)
- [Persönliche Teilnahme auf dem Handy](screenshots/ranger-participation-mobile.png)
- [Wachstumspfad mit Schlössern](screenshots/ranger-growth.png)
- [Treffenarchiv](screenshots/meeting-archive.png)

Die Screenshots verwenden ausschließlich fiktive Daten in isolierten
Testbrowsern. Die Oberfläche bleibt eine Demo mit frei wählbaren Profilen;
die Ansichtsprüfungen ersetzen keine serverseitige Zugriffskontrolle.
