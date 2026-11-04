# RangerHub V28 – Testbericht

4. November 2026 · 94 Prüfungen erfolgreich in diesem Repository.
Zusammen mit dem getrennten privaten Repository: **172 erfolgreiche Prüfungen**.

Browser: Chromium 154.0.8037.57 built on Debian GNU/Linux 13 (trixie). Playwright, de-DE, Europe/Berlin.
Alle Daten und Fragen lagen in temporären Browserkontexten. Keine produktiven
Browserdaten wurden verändert oder zurückgesetzt.

## Neue Prüfungen

- 28 Naturthemen, Spinne einmal; fachlicher Kurztext, Schöpfungsgedanke, Bibelstelle und Frage.
- 22 Planungsideen mit passenden Impulsen; keine erfundenen Kalendertermine oder Leiterzuordnungen.
- Natur- und Impulsauswahl in neuen/bestehenden Treffen, manuelle Anpassung und dauerhaft gespeicherte Snapshots.
- Eigene Naturbeschreibungen, Rollenprüfung und Stammtrennung. Eigene leere Aktionsbeschreibungen bleiben erhalten.
- Menü-Icons mit unveränderten zugänglichen Namen und Rollenfiltern.
- Zurück zu Rangerprofil und Personenliste; Treffenwarnung weiterhin wirksam.
- Chatfrage, Leiterantwort, Rückfrage, Fettschrift, Haken und Lesestand.
- Andere Ranger und andere Stämme ausgeschlossen; Profilwechsel und Neuladen.
- Zwei Tabs desselben Browserprofils: Antwort erscheint, angefangener Entwurf bleibt erhalten.
- Speicherfehler: keine behauptete Zustellung und kein Datenverlust. HTML-Inhalte werden als Text behandelt.
- Vorbereiteter HTTP-Vertrag mit persönlichem Token und Behandlung von 403; kein produktiver Onlinedienst.
- Mobile Touch-Ereignisse bei 320×568 und 390×844 für Zurück, Warnung, Frage und Chat-Schließen.
- Ausrichtung aller fünf Bildtitel an derselben linken Kante, mindestens 18 Pixel Titelschrift.
- V27 → V28 unter derselben Origin: Personen, Sitzung, eigene Bibliotheksnotizen und Fortschritte bleiben erhalten.

## Regressionen

Alle vorhandenen Prüfungen für Anmeldung, Neuladen, Rollen, Stammwechsel,
0/79/80/99/100-Prozent-Fortschritt, vorzeitige Folgestufen, Bonuspakete,
Stufen ohne Aufgaben, Leiterbestätigungen, Knoten-Nachweise, Termine,
Anwesenheit, Abmeldungen, Wetteranzeige, Rezepte und PDF-/Word-/Scanimport
bestehen weiterhin. Alte Original-HTML-Versionen bleiben bytegleich.

## Darstellung

Geprüft: 1440×900, 1920×1080, 1366×768, 768×1024, 390×844, 375×812,
320×568 und 844×390. Kein horizontales Scrollen. Die vorhandene Expeditionskarte
bleibt ausschließlich auf dem eigenen Ranger-Dashboard. Desktopstationen
bleiben vollständig sichtbar. Echte Browser-Screenshots unter `screenshots/v28/`.

## Grenzen und vereinbarter Umfang

- Chat bewusst als Demo in diesem Browserprofil. Keine geräteübergreifende
  Online-Zustellung und keine aktiven Push-Nachrichten. HTTP-Adapter, Vertrag
  und Ereignisse sind vorbereitet; siehe `V28-ONLINE-CHAT.md`.
- Vorbereitete HTTP-Zustellung mit kontrollierten Testantworten geprüft.
  Ein sicherer produktiver Server oder echter Anmeldedienst wurde nicht eingerichtet.
- Chromium und emulierte Touch-Geräte getestet. Safari/WebKit ist in dieser
  Umgebung nicht verfügbar; der Installationsdownload war zuvor netzseitig blockiert.
- Die vorhandenen Wettertests verwenden kontrollierte API-Antworten; Livezugriff
  auf Wetterdienste ist in der Cloud-Umgebung eingeschränkt.
- Bibelstellen und geistliche Anwendungen sind Vorschläge und bleiben bearbeitbar.

## Integrität

Prüfsummen: `V28-SHA256SUMS`, Ausgangsmanifest: `v28-baseline.json`,
Buildnachweis: `v28-build.json`.

Öffentliche Demo ohne private Stammdaten und ohne gebündelte PDFs.
