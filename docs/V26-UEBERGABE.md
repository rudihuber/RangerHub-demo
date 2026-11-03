# RangerHub Demo V26 – Expeditionskarte

Ausgangspunkt ist der letzte funktionierende Demo-Stand `50dd35f`, nicht eine
ältere HTML-Fassung. Sicherungspunkt: `backup/before-v26-expedition`.
Die unveränderte Vorversion ist als
[V25-Demo-Backup](../RangerHub_Webapp_V25_Demo_Backup.html) erhalten.
Die anfängliche Dateiinventur steht in [v26-baseline.json](v26-baseline.json).

## Öffnen und Prüfen

- [Aktuelle Demo](https://rudihuber.github.io/RangerHub-demo/)
- [Benannte V26-Demo](../RangerHub_Webapp_V26_Demo.html)
- [Prüfsummen](V26-SHA256SUMS) und [Buildnachweis](v26-build.json)
- [Testbericht und Screenshots](V26-TESTBERICHT.md)

Stamm **Rangerstamm 01**, Profil **JB · Ranger** wählen. Die Karte erscheint nur
auf dem persönlichen Ranger-Dashboard. Mit **DL · Leiter**, **PM · Stammleiter**
oder **RH · Admin** bleibt das Verwaltungs-Dashboard ohne Karte. Auch die
Personenlisten und die allgemeine Wachstumspfadseite bleiben ohne Expeditionskarte.

Die Demo enthält wie bisher keine privaten Personendaten und keine
PDF-Arbeitsblätter. Die private Vollversion wird getrennt weitergeführt;
ihre Inhalte, Namen, PDFs und Git-Historien werden hier nicht veröffentlicht.
Neue Kartenmodule und generische Kartentests sind in beiden Ständen identisch.

## Umsetzung

`rangerhub-expedition.js` und `rangerhub-expedition.css` ergänzen die vorhandene
App. Die Einbindung erfolgt am Ende von `index.html`. Die benannte V26-Datei
ist ein identischer, versionierter Einstieg. Erzeugung und Integritätsprüfung:

```sh
python3 tools/build_demo_v26.py
python3 -m unittest discover -s tests -v
```

Die Landschaft besteht aus SVG und CSS. Es wurden keine großen neuen Bilddateien
und keine neuen Bibliotheken hinzugefügt. Ein vorhandenes Logbuchmotiv wird als
Begleiterportrait integriert; alle Originalbilder bleiben erhalten. Der neue
Anzeige-Code ist zusammen rund 37 KB unkomprimiert groß.

Die Datenbasis bleibt unverändert: gemeinsame Aufgabenkataloge, persönliche
Fortschritte pro Stamm und Person, `rhv9-demo` und `rhv9-demo-session`. Die Karte
verwendet `v24Principal()`, `v24Count()` und `stageUnlockedForRanger()`.
Sie speichert keine eigene Fortschrittsdatenbank. Ein flüchtiger Animationscache
enthält nur vorherige Position und visuelle Zustände, keine Aufgabenstatusdaten.

Ab 80 Prozent wird die Folgestation zugänglich. Der offizielle Rang wechselt
erst nach vollständigem Abschluss. Vorzeitig erledigte Folgeaufgaben bleiben
erhalten. Beobachter-Pakete A/B/C/Reflexion zählen mit. Eine Stufe ohne Aufgaben
gilt nicht automatisch als vollständig. Der Marker verwendet den exakten
Erledigungsanteil der offiziellen Stufe und bewegt sich entlang des SVG-Weges.

Stationsdetails führen zu den vorhandenen Aufgaben und Logbuchseiten. Gesperrte
Stationen erklären die nächste Voraussetzung. Die bisherigen Bearbeitungsrechte
bleiben erhalten; in der Demo bestätigen weiterhin nur Leiter Fortschritte.
Ranger sehen nur ihren eigenen, aktiven Stamm. Der Admin-Stammwechsel bleibt
erhalten und zeigt keine eigene Expeditionskarte an.

Auf Desktop und Tablet wird die breite Landschaft verwendet. Kleine Geräte und
schmale Smartphone-Querformate erhalten einen vertikalen Weg. Die aktuelle
Position wird beim Öffnen sichtbar. Navigation und Status berücksichtigen die
tatsächliche Höhe der vorhandenen Seitenleiste. Tastaturfokus, Dialogbeschriftung,
Escape, Touch-Ziele und reduzierte Bewegung werden berücksichtigt.

Der bestehende Countdown, Wetter, persönliche Wachstumsdetails und die Rangliste
bleiben unter der Karte erhalten. Es gibt keine permanente Animationsschleife.
Die neue Karte selbst benötigt keine externe API.

## Nächste Runde

Für eine neue Veröffentlichung V27 erstellen und V26 erhalten. Für Änderungen
an den gemeinsamen Modulen die private Vollversion separat neu paketieren und
dort die eigenen Integritätsprüfungen ausführen. Niemals Demo-Profile oder
Demo-Speicherschlüssel in die private App übernehmen.

Der Browser-Harness unterstützt auch `RANGERHUB_BROWSER=webkit`, sobald die
WebKit-Engine installiert ist. In dieser Umgebung wurde ihr Download mit HTTP
403 „Domain forbidden“ blockiert; Safari wurde deshalb noch nicht ausgeführt.
