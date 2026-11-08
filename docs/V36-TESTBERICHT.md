# V36 – tatsächlich ausgeführte Abnahme

Stand: 8. November 2026, Europe/Berlin. Es wurden ausschließlich isolierte Browserprofile, synthetische Daten und lokale HTTP-/SQLite-Testdienste verwendet. Keine echten Konten, Produktionsdaten oder persönlichen Tokens wurden verändert.

## Ergebnisse

| Gruppe | Tatsächliches Ergebnis |
| --- | --- |
| Archiv V35, private Kompaktdatei | 128/128 Browserfälle bestanden, 553,143 s |
| Archiv V35, Demo mit ausdrücklich ausgewählter Archivdatei | 127/127 bestanden, 342,549 s |
| Breite V36-Browserregression, private Kompaktdatei | 140/140 bestanden, 598,738 s |
| Breite V36-Browserregression, Demo-Kandidat | 138/138 bestanden, 387,963 s |
| Abschließende gezielte V36-Browserfälle, privat | 15/15 bestanden, 59,447 s |
| Abschließende gezielte V36-Browserfälle, Demo | 15/15 bestanden, 53,598 s |
| Zentraler Server: frühere Fälle plus Vertreterprüfung | 115/115 bestanden, 7.404,285 ms |
| Navigation und Originalbibliothek: Node-Units | 10/10 bestanden |
| Vollständige Paket-/Backup-/Quellintegrität | jeweils 4/4 privat und Demo bestanden |

Die breite Demo-Runde lief vor der abschließenden globalen Stammwechselkorrektur; die gezielten V36-Suiten prüfen den letzten Stand. Die letzte isolierte Korrektur an Kalendergeburtstagen wurde ebenfalls mit allen 15 V36-Fällen nachgeprüft. Der private breite Lauf enthält noch 14 neue Fälle; der anschließend ergänzte Geburtstagsfall erklärt die Zahl 15 im abschließenden Lauf. Es wird kein erfundener einzelner Gesamtlauf mit allen Zahlen behauptet.

## Zuordnung der angehängten 100 Fälle

[V36-QA-ERGEBNISSE.csv](V36-QA-ERGEBNISSE.csv) enthält jeden Originalfall einzeln mit Ergebnis und Beleg:

- **96 automatisiert bestanden.**
- **2 nicht anwendbar:** Wochen-/Tagesansicht und Kalender-Typfilter existieren in der bisherigen App nicht. Die vorhandene Monatswahl, Route und Scrollposition wurden geprüft.
- **2 teilweise geprüft:** 200 % CSS-Reflow wurde erfolgreich geprüft. Der native Browser-Menü-Zoom ließ sich in dieser Chromium-Umgebung nicht aktivieren; die entsprechenden nativen Handprüfungen V36-037 und V36-053 bleiben offen.

Native Zoomversuche wurden nicht zu bestandenen Tests umgedeutet: Tastatur änderte Zoom/DPR nicht, temporäre Erweiterung und Profileinstellung waren nicht wirksam, die interne Settings-Seite war nicht zugänglich. Details: `tests/v36-native-zoom-limit.json`. Automatisierte ARIA-/Label- und Tastaturprüfungen ersetzen außerdem keine behauptete manuelle Sprachausgabe.

Es gibt keine offene reproduzierte Fehlfunktion in den bestandenen automatisierten Fällen. Eine vollständige native Geräte-/Produktivfreigabe oder ein Penetrationstest eines öffentlich betriebenen Servers wird hier ausdrücklich nicht behauptet.

## Was konkret geprüft wurde

Mitgliederkarten: 0/1/8/50 Profile; 320/375/390/768/1024/1440 Pixel; fehlende und vorhandene Bilder, lange Namen und E-Mail-Adressen, valide/ungültige Links, Rollen, Filter, Zähler, Suche, Profil, Tastatur, Touchaktionen und HTML-Injection. Es wurden keine realen Porträts oder Daten hinzugefügt.

Kalender: bestätigte Löschung aller drei Terminarten, Abbruch, lokaler Speicherfehler, simulierter Netzwerkfehler, Ausgangsroute, Monat/Jahr, Scrollposition, gleiche/andere Termine und Doppelaufruf. Die API prüft zusätzlich veraltete Kalenderrevisionen. Pausierte Geburtstage verschwinden aus dem Kalender, die Profile bleiben gespeichert.

Bibel: exakt 39 AT-/27 NT-Bücher in kanonischer Reihenfolge, Reload und Rückkehr ins Dashboard, horizontale Erreichbarkeit, direkte Haken und Rücknahme, Kapitelzwischenzustände, vollständiges Buch über Kapitel, zwei gleichzeitige Geräte, unverändert 66 Bücher/1.189 Kapitel/240 Punkte und keine zusätzlichen Kapitelpunkte.

Vertretung: echte persönliche Testtokens, zwei Stämme, globale/lokale Vergabe, ursprüngliche Rolle, keine Selbstvergabe oder Delegationskette, keine Vergabe an pausierte/ausgetretene Personen, Ablauf mit demselben Token, Widerruf, Mitgliedschaftsänderung des Vertreters und Ausstellers, keine Reaktivierung alter Rechte, Schutz originärer Verwaltungszugänge und unveränderliches Audit. Zwei parallele berechtigte Vergaben bei gleicher Revision liefern genau einen Erfolg, einen Konflikt und ein Ereignis.

Ein tatsächlicher lokaler Node-/SQLite-Dienst wurde außerdem mit **zwei unabhängigen Browserprofilen** bedient: Vertretung über den Dialog vergeben, Editor geöffnet, widerrufen und automatisch geschlossen; globale Vertretung über den Stammwechsel genutzt und beim Widerruf in den Heimatstamm zurückgekehrt. Manipulation einer Browserrolle hat keine zusätzlichen serverbestätigten Rechte ergeben. Ein Widerruf während eines noch eintreffenden POST-Körpers verhindert den Commit.

Die früheren Prüfungs-, Punkte-, Katalog-, KI- und Bildrechtefälle wurden erneut ausgeführt. Original-SVG-/MIME-Filter, fremde Stämme, Idempotenz, drei Prüfungsplätze, einmalige Punkte, Backup/Restore und die 43 unveränderten Logbuchbilder bleiben abgedeckt.

## Gefundene und behobene Probleme

- Neuer Verwaltungssnapshot gab zunächst interne Statusnotizen an gewöhnliche Leiter weiter. Sichtbarkeit wurde auf die tatsächliche Verwaltungsbefugnis begrenzt; eine eigene negative Serverprüfung schützt dies zusätzlich.
- Global bestätigte Vertreterrechte gingen zunächst beim Wechsel der lokalen UI-Stammesauswahl verloren. Der Identitätsbezug wurde korrigiert; der tatsächliche globale Zwei-Geräte-Fall besteht inklusive Widerruf und Rückkehr.
- Pausierte Geburtstage wurden im alten Kalender weiterhin angezeigt. Die Kalenderdarstellung filtert nun aktive Personen, ohne Profile zu löschen.
- Bei 200 % CSS-Reflow ragte ein Anwesenheitsblock über die Seite. Die flexiblen Bereiche können nun umbrechen; die Reflow-Prüfungen bestehen.
- Frühe Testfixtures warteten nicht auf initiale Daten und serialisierten versehentlich eine Storage-Testfunktion. Die betroffenen Testbedingungen wurden korrigiert; ursprüngliche und abschließende Protokolle bleiben unterscheidbar.
- Die alte Demo-Testhilfe öffnete fest `index.html`. Ein vermeintlicher Archivlauf traf deshalb V36 und scheiterte an der alten Erwartung wechselnder drei Desktopregale. Neue Testadapter wählen die Datei ausdrücklich und kontrollieren die Versionsnummer, ohne historische Tests zu verändern. Der tatsächliche V35-Archivlauf besteht vollständig.

## Belege und Wiederholung

Neue Screenshots: [Desktopkarten](screenshots/v36/leader-cards-1440.png), [Telefonkarten](screenshots/v36/leader-cards-390.png), [Bibelregale](screenshots/v36/bible-390.png), [Wetter](screenshots/v36/weather-390.png), [Vertretung mit Testserver](screenshots/v36/delegation-online-desktop.png), [ohne Server](screenshots/v36/delegation-setup-required.png). Vorher-Aufnahmen liegen unter `screenshots/v36/before/`.

Maschinenprotokolle: `docs/tests/v36-*`. Alte fehlgeschlagene beziehungsweise bewusst unterbrochene Läufe sind als solche erhalten; ausschlaggebend sind die benannten abschließenden Läufe. Neue Regressionsaufnahmen liegen getrennt unter `screenshots/v36-regression/`; alte Aufnahmen wurden nach dem Test byteidentisch zurückgelegt.

Zentraler Aufruf: `python tools/check_v36.py`. Einzelphasen: `--phase archived-browser`, `current-browser`, `new-browser`, `server`, `packaging`. Voraussetzungen: Python mit Playwright/Pillow, Chromium und Node 24. Die Originaltests werden wiederverwendet. Die alte Rotation-/33+33-Regalprüfung läuft gegen V35; V36 erhält stattdessen die ausdrücklich geforderte feste 39+27-Prüfung.

## Integrität und Betriebsgrenzen

Vollständige Vorher-Sicherung: privat 861, Demo 898 getrackte Dateien, mit Hash-Readback. Private Kompaktdatei: **24.958.665 Bytes** (unter 25.000.000). Optionale Standalone: **33.117.205 Bytes**. Alle 17 bisherigen eingebetteten Anlagen einschließlich 12 PDF-Anlagen sind unverändert. Die Standalone enthält die 43 Originalgrafiken zusätzlich byteidentisch; die Demo enthält keine privaten PDF-Anlagen. Speicherschlüssel bleiben `rhv9` und `rhv9-demo`.

**Produktiver Server, reale persönliche Anmeldungen und KI sind nicht konfiguriert und wurden nicht als live getestet ausgegeben.** Die API muss vor echter geräteübergreifender Vertreterverwaltung eingerichtet werden. Die öffentliche Demo bietet deshalb keine scheinbar sichere Freischaltung an. Wettertests verwenden kontrollierte Antworten beziehungsweise einen Fallback; es wird keine aktuelle Live-Wetterprognose zertifiziert.

Beide main-Branches bleiben unverändert. Die GitHub-API antwortet hier auf GraphQL und REST mit „Forbidden“. Der konkrete Review-Branch und die PR-Beschreibung werden bereitgestellt; eine erfolgreiche Anlage eines GitHub-Pull-Requests kann ohne API-Zugriff nicht behauptet werden.
