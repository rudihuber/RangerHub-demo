# V33: Ranger-Bibliothek aus Logbuch Ausgabe(4)

Einzige Inhalts- und Bildquelle ist der neu gelieferte Originalausschnitt der gedruckten Seiten 6–27. Die vorherige Bibliotheksfassung wird weder als Text- noch als Bildquelle verwendet. Aus dem alten Katalog werden ausschließlich bestehende Kennungen, Reihenfolge, Gruppenzuordnung und anfängliche Freigabewerte übernommen.

Die folgenden Seitenangaben gehören nur in die Lieferdokumentation und Quellzuordnung. Im Ranger-Frontend und im Inhaltskatalog werden keine Quellen-Seitenzahlen oder PDF-Seiten gezeigt.

| Stabile Modul-ID / Titel | Originalgrafiken aus dem Quellenmanifest | Gedruckte Quelle |
| --- | --- | --- |
| `start` / So werde ich Ranger | `pdf_04_originalbild_960.webp`<br>`pdf_04_originalbild_961.webp` | 6-7 |
| `emblem` / Unser Emblem | `pdf_04_originalbild_961.webp`<br>`emblem_symbol_kreuz_feuer_kompass.webp`<br>`pdf_09_originalbild_913.webp` | 6-7, 16-17 |
| `lilie` / Pfadfinderlilie | `pfadfinderlilie_originalzeichnung.webp`<br>`pdf_05_originalbild_965.webp`<br>`pdf_05_originalbild_963.webp`<br>`pdf_05_originalbild_964.webp` | 8-9 |
| `eigenschaften` / Acht Ranger-Eigenschaften | `ranger_wachsam_zeichnung.webp`<br>`ranger_rein_zeichnung.webp`<br>`ranger_ehrlich_zeichnung.webp`<br>`ranger_tapfer_zeichnung.webp`<br>`ranger_treu_zeichnung.webp`<br>`ranger_hoeflich_zeichnung.webp`<br>`ranger_gehorsam_zeichnung.webp`<br>`ranger_geistlich_zeichnung.webp` | 10-11 |
| `goldene-regel` / Goldene Regel | `goldene_regel_illustration.webp` | 12-13 |
| `motto` / Motto – Sei bereit | Keine separate Bilddatei: `SEI BEREIT` und `EIN RANGER IST STETS BEREIT` als HTML-Quelltypografie; keine fremde Galerie | 13 |
| `gruss` / Ranger-Gruß | `pdf_08_originalbild_909.webp`<br>`gruessende_hand.webp` | 14-15 |
| `ausruestung` / Ausrüstung und Ranger-Kluft | `pdf_04_originalbild_960.webp`<br>`pdf_09_originalbild_912.webp` | 6-7, 16-17 |
| `kluft` / Aufnäher und Platzierung | `pdf_09_originalbild_912.webp`<br>`pfadfinder_kluft.webp`<br>`pdf_10_originalbild_924.webp`<br>`kluft_platzierung.webp`<br>`pdf_09_originalbild_913.webp` | 16-17, 18-19 |
| `schlaufen` / Schulterschlaufen & Bedeutung | `schlaufen_originalfoto.webp`<br>`pdf_10_originalbild_916.webp`<br>`pdf_10_originalbild_917.webp`<br>`pdf_10_originalbild_918.webp`<br>`pdf_10_originalbild_919.webp`<br>`pdf_10_originalbild_920.webp`<br>`pdf_10_originalbild_921.webp`<br>`pdf_10_originalbild_922.webp`<br>`pdf_10_originalbild_923.webp` | 18-19 |
| `team` / Gemeinsam im Team | `team_seil_illustration.webp`<br>`pdf_11_originalbild_871.webp`<br>`pdf_12_originalbild_877.webp` | 20-21, 22-23 |
| `teamhelfer` / Teamhelfer | `team_kampf_illustration.webp`<br>`pdf_12_originalbild_874.webp`<br>`pdf_12_originalbild_875.webp`<br>`pdf_12_originalbild_876.webp`<br>`pdf_12_originalbild_877.webp` | 22-23 |
| `teamname` / Teamname | `team_name_illustration.webp` | 22-23 |
| `banner` / Teamemblem & Teambanner | `team_banner_originalzeichnung.webp` | 24-25 |
| `appell` / Der Appell | `appell_illustration.webp` | 26-27 |
| `stammposten` / Dein Stammposten | `stammposten_nr_symbol.webp` | 26-27 |

## Extraktion und Nachweis

- 43 Originalgrafiken: 22 eingebettete Bildobjekte einschließlich Originalfotos und 21 vom Manifest vorgegebene Ausschnitte. Keine vollständige PDF-Doppelseite ist ein UI-Bild.
- Eingebettete Originale werden mit Transparenz extrahiert und entsprechend der PDF-Platzierung verlustfrei um 90° gedreht, wenn nötig. Vektorgrafik-Ausschnitte werden mit Faktor 3 gerendert. Anschließend WebP mit `lossless=True, exact=True`; auch RGB-Werte vollständig transparenter Pixel bleiben erhalten.
- Das neue PDF enthält elf Doppelseiten. Seine XREF-Nummern weichen durch den Seitenauszug vom Manifest ab. Der Abgleich nutzt Seite, Pixelabmessungen und genaue Bildposition; beide XREFs und Pixelhashes sind intern dokumentiert.
- Geprüfter SHA256 des tatsächlich hochgeladenen Ausschnitts: `a3ba40194e3e1356af9e070ffb9f04bad3c012b13ebcd858c84975a393da9d30`.
- Vom Manifest deklarierter SHA256 des vollständigen, nicht separat hochgeladenen Ausgangs-PDFs: `8bf79683d14998ffc0ea35451c48598c89198e0789e66dd128595c247d5b0b1c`. Dieser Hash ist eine Quellenangabe des Manifests, kein eigenständig geprüfter Bytevergleich mit dem vollständigen PDF.
- Originalgrafiken insgesamt: 6502082 Bytes. Alle 43 Dateien sind über passende Modulgalerien erreichbar; zusätzliche Hauptansichten und Eigenschafts-/Schlaufen-Auswahlen verwenden dieselben Originaldateien.
- Alle 76 Erklärungstexte und 16 Einleitungen haben interne Textblockzuordnungen in `data/library-source-map-v33.json`. Die Altersangaben Orange 6–8, Gelb 9–11, Blau 12–13 und Weiß 14–15 sind aus der lesbaren Originalgrafik übernommen.

## Vorhandene Inhalte und Freigaben erhalten

Die Quellenkorrektur ersetzt nur den unveränderlichen Basiskatalog. `rangerhub-wisdom-model.js`, Zustandsschema 1, LocalStorage-Key `rhv9`, die fünf Gruppenkennungen, 16 Modulkennungen und 76 Symbolpunktkennungen bleiben bestehen. Die bestehenden globalen und lokalen `entries`, `overrides`, Revisionen und Audit-Einträge werden weder neu initialisiert noch überschrieben.

Das vorhandene Modell führt weiterhin Basis → globale Anpassung → lokale Anpassung zusammen. Ein bereits gespeicherter eigener Text, Titel, Freigabestatus oder eine Archivierung hat damit dieselbe Priorität wie zuvor. Ohne gespeicherte Anpassung erscheint der korrigierte Originaltext. Eigene gespeicherte Texte werden ausdrücklich nicht als Originalzitate ausgegeben oder in die interne Quellenzuordnung hineinkopiert.

Frühere semantische Bildschlüssel wie `emblem` und `gruss` werden beim Rendern auf das zum bestehenden Modul gehörende Original aufgelöst. Unbekannte Bildschlüssel eines selbst angelegten Themas zeigen den Text „Keine Abbildung hinterlegt“. Für das Motto wird unabhängig von einem früher gespeicherten Bildschlüssel das nachgewiesene Quellmotiv als Typografie dargestellt. Die Bearbeitungsoberfläche bietet ausschließlich freigegebene Originaldateien; beim Motto den typografischen Quelltext.

Ein destruktiver Datenmigrationslauf ist nicht erforderlich. Der vollständige Datei-Backup vor V33 enthält die vorherigen Inhaltsbasen; die vorhandenen Browserdaten werden durch V33 nicht neu initialisiert. Eine bewusste spätere Rückkehr zum neuen Basistext muss über die bereits vorhandenen lokalen Zurücksetz-/Wiederherstellungsfunktionen erfolgen und darf nicht automatisch alle bearbeiteten Inhalte löschen.

## Einbindung

- `rangerhub-wisdom-catalog-v33.js`: Basis + `RHWisdomOriginalAssets` + `RHWisdomModuleAssets`.
- `rangerhub-wisdom-views-v33.js`: bestehende `wisdom-*`-Aktionen und Editor-/Freigabebindungen; native Bilder tragen `data-original-asset`.
- `rangerhub-wisdom-v33.css`: responsive Originalansichten; Prozentmarker beziehen sich auf das tatsächliche Bildrechteck.
- `assets/ranger-library/lb4-*.webp`: undurchsichtige Asset-IDs ohne Seiten-/XREF-Metadaten.
- Das Quellen-PDF bleibt ausschließlich privat. Dieser Nachweis und `data/library-source-map-v33.json` dienen dem Herkunftsnachweis; das Frontend lädt sie nicht als UI-Inhalt.

## Prüfung

`node tests/test_library_v33.mjs` prüft Originaldatei-Hashes, 16/76 Identitäten, Freigabe-Defaults, Zitatzuordnung, Erhalt globaler/lokaler Änderungen sowie eigener Themen, alle 16 Modulansichten und das bildfreie Motto. Die browser- und backendweiten Rollen-/Freigabetests werden vom zentralen V33-Abnahmesatz ausgeführt.

Grenzen: Das Motto besitzt kein separates Originalbild und verwendet deshalb belegte Quell-Typografie. Die gezeichneten Bestandteile der Lilie werden in den vier erhaltenen Symbolpunktkennungen gebündelt, ohne Aussagen hinzuzuerfinden. Bestehende eigene Textänderungen bleiben erhalten und sind daher gegebenenfalls keine Originalzitate.
