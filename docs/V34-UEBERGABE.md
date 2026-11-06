# V34 – Änderungen und Bedienung

Ausgangspunkt ist die geprüfte V33.1. Die Dateien aller Vorversionen, die bisherigen Stamm- und Personendaten, Prüfungen, Punkte und Lesestände bleiben erhalten. Sicherung vor der Bearbeitung: `backup/before-v34`, vollständige 640-Dateien-Kopie mit Einzelhashes im getrennten Übergabepaket. Die Demo hat eine eigene vollständige Sicherung mit 683 Dateien.

## Wappen und Ranger-Bibliothek

Das originale Rangers-Wappen aus dem bereitgestellten Logbuch steht links neben „Ranger Hub“. Mobil bleibt die grüne Kopfzeile beim Scrollen sichtbar; am Desktop bleibt das Branding auch beim Scrollen innerhalb der Seitenleiste oben stehen. Das Wappen wird aus derselben Originaldatei wie das Bibliotheksmodul bezogen.

Auf den Bibliotheksseiten mit Bildmarkierungen schaltet „Markierungen ausblenden“ die nummerierten Kreise aus. Die Begriffe und Erklärungen bleiben bedienbar. „Markierungen einblenden“ stellt sie wieder her. Die Einstellung bleibt nach dem Neuladen erhalten und verwendet den vorhandenen Speicher. Themenfreigaben und Texte werden dabei nicht geändert.

## Vorlagen und Rezepte

Naturphänomene, Aktionen und Impulse besitzen jeweils „Vorlagen“ und „Schon verwendet“ mit Zähler und Suche. Verwendete Inhalte zeigen das letzte Verwendungsdatum und den Tag der erneuten Verfügbarkeit. Die Einstufung wird aus den bestehenden Rangertreffen berechnet: Vergangene, nicht abgesagte Treffen mit aktivem Programmpunkt zählen; heutige Treffen erst nach ihrem Beginn. Zukunftsplanungen zählen nicht als Verwendung. Quell-IDs werden bevorzugt; bei älteren Einträgen ohne Quell-ID dient der übereinstimmende Titel zur Zuordnung.

Genau zwei Kalenderjahre nach dem letzten Einsatz erscheint der Eintrag automatisch wieder unter „Vorlagen“. Beim 29. Februar gilt in einem Nichtschaltjahr der 28. Februar. Ein neuerer Einsatz beginnt die Frist erneut. Die Treffen und ihre gespeicherten Inhalte bleiben als Verlauf erhalten; es werden keine Einträge gelöscht oder in einen zweiten Datenspeicher verschoben.

Naturphänomene sind nach deutschem Alphabet sortiert. Bibelstelle und Gesprächsfrage entfallen in der Vorschlagsanzeige, im Editor und beim neuen Übernehmen in die Planung. Bereits gespeicherte historische Planungstexte und alte Quellfelder bleiben erhalten. Besonderheit und Schöpfungsgedanke bleiben nutzbar.

Rezepte sind in aufklappbaren Kategorien zusammengefasst. Suche und Kategorieauswahl grenzen die Ansicht ein. Vorhandene Rezepte werden anhand ihres Titels einsortiert, ohne eine Datenmigration auszulösen. Im Rezepteditor lässt sich eine vorgeschlagene oder eigene Kategorie speichern. Datei- und Textimport sowie das Übernehmen aus einem Planungsentwurf bleiben erhalten.

Standardkategorien: Suppen & Eintöpfe, Hauptgerichte, Frühstück & Brot, Snacks & Beilagen, Süßes & Backen, Getränke und Weitere Rezepte. Eigene Kategorien bleiben erhalten.

## Dashboard für Handy und Desktop

- Geburtstage stehen untereinander.
- „Deine Expedition“ verwendet die vorhandene Landschaft aus der V31-Linie. Alle fünf Schaltflächen stehen direkt im Bild auf dem Weg bergauf, „Meister“ am Gipfel. Die vollständige Expeditionskarte bleibt erreichbar.
- „Wissen entdecken“ hat kurze, am Text bemessene Schaltflächen mit mindestens 44 Pixel hoher Bedienfläche.
- Die Buchkörper sind nur noch 72 Pixel auf dem Handy beziehungsweise 76 Pixel am Desktop hoch. Auf dem Handy stehen zwei statt drei Reihen. Lange Buchnamen verwenden übliche Abkürzungen; vollständiger Name und Kapitelstand bleiben in Beschriftung und Buchansicht verfügbar.
- Beim erneuten Aufrufen des Dashboards und über „Bücher wechseln“ beginnt die Vorschau mit anderen Büchern. Alle 66 Bücher bleiben vorhanden. Die vollständige AT-/NT-Bibliothek behält ihre kanonische Reihenfolge.
- Buchdetails, Kapitelhaken, Vollständig-Haken und das Wiederherstellen vorheriger Teilstände verwenden unverändert dieselben vorhandenen Buchungen und Punkte.

## Auslieferung

Private Hauptdatei: `RangerHub_Webapp_V34_Kompakt.html`, weiterhin unter 25 MB; zugehörige `assets/` und `vendor/` mit ausliefern. Die optionale `RangerHub_Webapp_V34_Standalone.html` bettet die 43 Originalgrafiken byteidentisch ein und ist deshalb größer als 25 MB. Die vorhandenen 17 eingebetteten Altanlagen einschließlich 12 PDF-Verweise bleiben unverändert; 24 weitere Inline-Skripte bleiben byteidentisch. Die Rezeptschicht und drei Ansichts-/Navigationsschichten wurden gezielt ersetzt, eine Vorlagen-Schicht und ergänzende Stile hinzugefügt.

Öffentliche Demo: `RangerHub_Webapp_V34_Demo.html` und identische `index.html`, ausschließlich bestehende fiktive Demodaten, keine privaten PDF-Anlagen. Neue Ressourcen tragen `?v=34-1`. Privater Speicher bleibt `rhv9`, Demo `rhv9-demo`. Die produktive gemeinsame API ist weiterhin nicht eingerichtet; die Demo speichert im jeweiligen Browser.

V34 wird auf dem privaten Feature-Branch und in der öffentlichen Demo ausgeliefert. Der private `main` bleibt bis zur Abnahme unverändert. Einzelhashes: [V34-SHA256SUMS](V34-SHA256SUMS); reproduzierbare Builds: `tools/build_v34.py` beziehungsweise `tools/build_demo_v34.py`; Prüfung: `python tools/check_v34.py`.
