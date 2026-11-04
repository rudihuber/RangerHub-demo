"""V28 content: requested nature topics and reusable ideas from the supplied table.

No historical dates, people, owner names or private meeting places are imported.
Scientific descriptions and spiritual reflections are deliberately separate.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NATURE = []
ACTIONS = []


def nature(slug, title, fact, creation, verse, question):
    NATURE.append(dict(id='v28-nature-'+slug, title=title, fact=fact,
                       creation=creation, verse=verse, question=question))


nature('spinne', 'Spinne',
       'Spinnen können verschiedene Seidenfäden herstellen: je nach Aufgabe zum Sichern, Fangen oder für den Kokon. Spinnenseide verbindet geringes Gewicht mit hoher Belastbarkeit und Elastizität.',
       'Selbst ein unscheinbarer Faden lädt zum Staunen ein. Wir loben Gott für die Vielfalt seiner Schöpfung und begegnen auch kleinen Tieren mit Respekt.',
       'Psalm 104,24', 'Was entdeckst du an einem Spinnennetz, wenn du ganz genau hinsiehst?')
nature('schaf', 'Schaf',
       'Schafe sind soziale Tiere und können vertraute Gesichter und Stimmen wiedererkennen. In ihrer gekräuselten Wolle eingeschlossene Luft hilft beim Warmhalten.',
       'Jesus nennt sich den guten Hirten. Gott kennt uns und wir dürfen ihm vertrauen. Ein Schaf kann uns an seine Fürsorge erinnern.',
       'Johannes 10,11–14', 'Wann hast du erlebt, dass jemand dich gut kennt und für dich sorgt?')
nature('eule', 'Eule',
       'Viele Eulen fliegen durch besondere Federkanten sehr leise. Schleiereulen können Beute mithilfe ihres feinen Gehörs auch bei wenig Licht orten.',
       'Wir staunen über Fähigkeiten, die uns selbst fehlen. Gott sieht und kennt uns auch dort, wo wir den Überblick verlieren.',
       'Psalm 139,1–3.11–12', 'Was hörst du, wenn die ganze Gruppe eine Minute still ist?')
nature('steinfisch', 'Steinfisch',
       'Steinfische können zwischen Steinen und Korallen fast unsichtbar wirken. Ihre Rückenflossenstacheln sind giftig; sie werden ausschließlich auf Bildern oder aus sicherem Abstand betrachtet.',
       'Im Meer gibt es eine unglaubliche Vielfalt von Lebewesen. Wir preisen Gott dafür und lernen, ihren Lebensraum und ihre Grenzen zu respektieren.',
       'Psalm 104,24–25', 'Wie hilft Tarnung einem Tier, und warum ist Abstand manchmal der beste Schutz?')
nature('alpaka', 'Alpaka',
       'Alpakas gehören zu den südamerikanischen Kameltieren und leben gern in Gruppen. Ihre feinen Wollfasern schließen Luft ein und schützen vor Kälte.',
       'Verschiedene Lebewesen sind auf unterschiedliche Weise ausgestattet. Wir danken Gott für das, was uns schützt, und überlegen, wie wir anderen Wärme und Geborgenheit geben.',
       'Psalm 104,24', 'Wer gibt dir Geborgenheit, und wem kannst du heute etwas Gutes tun?')
nature('boden', 'Erde / Mutterboden',
       'Lebendiger Boden enthält Bakterien, Pilze und viele kleine Bodentiere. Humus kann Wasser und Nährstoffe speichern; Bodenlebewesen helfen, abgestorbene Pflanzen zu zersetzen.',
       'Unter unseren Füßen steckt eine Welt voller Leben. Gott vertraut uns seine Erde zum Bebauen und Bewahren an. Dafür können wir dankbar und achtsam sein.',
       '1. Mose 2,15', 'Was verändert sich, wenn wir Boden als Lebensraum statt als bloßen Dreck sehen?')
nature('gottesanbeterin', 'Gottesanbeterin',
       'Gottesanbeterinnen besitzen Fangarme und können Entfernungen räumlich wahrnehmen. Ihre ruhende Armhaltung erinnert an gefaltete Hände; daher kommt ihr Name.',
       'Der Name ist ein Bild, keine Aussage darüber, dass das Tier betet. Uns kann es daran erinnern, selbst innezuhalten und Gott für seine wunderbaren Geschöpfe zu danken.',
       'Psalm 145,9–10', 'Wofür möchtest du Gott heute ganz bewusst danken?')
nature('gras', 'Gras',
       'Viele Gräser wachsen aus Bereichen nahe der Pflanzenbasis weiter. Deshalb können sie nach Beweidung oder Mähen erneut austreiben. Ihre Wurzeln helfen, den Boden festzuhalten.',
       'Auch Alltägliches ist voller Wunder. Gott versorgt seine Schöpfung; wir dürfen kleine Anfänge und neues Wachstum wahrnehmen.',
       'Matthäus 6,28–30', 'Wo siehst du neues Wachstum, das dir gestern noch nicht aufgefallen ist?')
nature('zitteraal', 'Zitteraal',
       'Zitteraale sind keine echten Aale. Spezielle elektrische Zellen erzeugen schwache Signale zur Orientierung und kräftige Stromstöße zum Beutefang; je nach Art mehrere hundert Volt.',
       'Die Vielfalt des Lebens ist größer, als wir zuerst vermuten. Wir staunen über Gottes Schöpfung und setzen unsere eigenen Fähigkeiten zum Guten ein.',
       'Psalm 139,14', 'Welche Fähigkeit hast du, mit der du jemandem helfen kannst?')
nature('schnee', 'Schnee',
       'Schneekristalle besitzen häufig eine sechsfache Symmetrie. Temperatur und Feuchtigkeit beeinflussen, ob etwa Plättchen, Säulen oder verzweigte Sterne wachsen.',
       'Wir sehen Ordnung und Vielfalt zugleich. Ein Schneekristall kann Anlass sein, Gott für die Schönheit der Natur zu loben.',
       'Hiob 37,6', 'Was erkennst du mit einer Lupe an einem Schneekristall auf dunklem Stoff?')
nature('grubenotter', 'Grubenotter',
       'Grubenottern nehmen mit besonderen Grubenorganen Wärmestrahlung wahr. Das hilft ihnen, warme Beutetiere auch bei wenig Licht zu orten. Schlangen werden nicht angefasst.',
       'Andere Lebewesen nehmen die Welt anders wahr als wir. Das macht uns demütig und erinnert uns an die Fülle von Gottes Schöpfung.',
       'Psalm 104,24', 'Welche Dinge bemerkst du nur, wenn du einen anderen Blickwinkel einnimmst?')
nature('gecko', 'Gecko',
       'Viele Geckos können auf glatten Flächen klettern. Winzige, fein verzweigte Hafthaare an ihren Zehen vergrößern die Kontaktfläche; dabei wirken zwischenmolekulare Kräfte.',
       'Im ganz Kleinen steckt Erstaunliches. Wir loben Gott für die Vielfalt seiner Werke und achten auf Details, die leicht übersehen werden.',
       'Psalm 111,2', 'Welche kleine Einzelheit in der Natur hat dich schon einmal überrascht?')
nature('wanderfalke', 'Wanderfalke',
       'Wanderfalken sind im Jagd-Sturzflug außergewöhnlich schnell; dabei sind Geschwindigkeiten von über 300 km/h möglich. Flügelform und Körperhaltung unterstützen diesen Flug.',
       'Der Himmel und seine Lebewesen laden uns zum Staunen über Gott ein. Unterschiedliche Fähigkeiten machen seine Schöpfung reich.',
       'Psalm 19,2', 'Welche verschiedenen Begabungen helfen unserem Team gemeinsam weiter?')
nature('muschelperle', 'Muschelperle',
       'Manche Muscheln bilden Perlmutt um Fremdkörper oder geschädigte Gewebestellen. Eine natürliche Perle entsteht nicht einfach regelmäßig um ein Sandkorn; ihre Entstehung ist selten.',
       'Jesus vergleicht das Reich Gottes mit einer besonders wertvollen Perle. Wir fragen, was wirklich kostbar ist und welchen Wert Gott Menschen gibt.',
       'Matthäus 13,45–46', 'Was ist für dich wertvoll, obwohl man es nicht kaufen kann?')
nature('giraffe', 'Giraffe',
       'Eine Giraffe hat wie der Mensch normalerweise sieben Halswirbel – ihre sind nur viel länger. Ihr Herz-Kreislauf-System muss das Blut bis in den hohen Kopf versorgen.',
       'So unterschiedliche Körper und doch gemeinsame Grundmuster: Wir staunen und danken Gott für seine vielfältige Schöpfung.',
       'Psalm 139,14', 'Was verbindet Menschen miteinander, obwohl wir sehr verschieden aussehen?')
nature('adler', 'Adler',
       'Viele Adler nutzen aufsteigende warme Luft und können mit weit ausgebreiteten Flügeln kreisen. So sparen sie beim Fliegen Energie. Ihr Sehvermögen ist sehr leistungsfähig.',
       'Die Bibel verwendet den Adler als Bild neuer Kraft. Wir dürfen auf Gott hoffen, statt alles aus eigener Kraft tragen zu müssen.',
       'Jesaja 40,31', 'Was gibt dir neue Kraft, wenn dein eigener Vorrat aufgebraucht scheint?')
nature('leopard', 'Leopard',
       'Die rosettenförmigen Flecken eines Leoparden unterstützen die Tarnung in Licht und Schatten. Leoparden sind kräftige Kletterer und können Beute auf Bäume bringen.',
       'Farben und Muster erfüllen in der Natur vielfältige Aufgaben. Wir loben Gott für die Schönheit und Verschiedenheit seiner Geschöpfe.',
       'Psalm 104,24', 'Welche Farben oder Muster entdeckst du in unserem Wald besonders oft?')
nature('eichhoernchen', 'Eichhörnchen',
       'Eichhörnchen legen Futterverstecke an. Nicht wiedergefundene Samen können keimen. Ihr buschiger Schwanz hilft beim Balancieren; sie halten Winterruhe und keinen durchgehenden Winterschlaf.',
       'Auch kleine Tiere haben ihren Platz im großen Ganzen. Wir danken Gott für Wälder und für das Zusammenspiel seiner Schöpfung.',
       'Psalm 104,16–18', 'Welche kleine gute Tat kann später eine große Wirkung haben?')
nature('vogel', 'Vogel',
       'Federn sind leicht und erfüllen verschiedene Aufgaben: Sie isolieren, schützen und ermöglichen bei vielen Arten das Fliegen. Feine Verzweigungen können eine geschlossene Federfläche bilden.',
       'Jesus lenkt unseren Blick auf die Vögel und auf Gottes Fürsorge. Das lädt uns zum Vertrauen ein, ohne dass wir unsere Verantwortung abgeben.',
       'Matthäus 6,26', 'Woran merkst du im Alltag, dass für dich gesorgt wird?')
nature('frosch', 'Frosch',
       'Bei vielen Froscharten wird aus der im Wasser lebenden Kaulquappe ein Frosch mit Beinen und Lungen. Frösche können zusätzlich über ihre feuchte Haut Sauerstoff aufnehmen.',
       'Die Verwandlung macht Wachstum sichtbar. Wir staunen über Gottes Schöpfung und darüber, dass auch wir lernen und uns entwickeln dürfen.',
       'Psalm 104,24', 'Welche Veränderung in deinem eigenen Leben kannst du schon erkennen?')
nature('fisch', 'Fisch',
       'Kiemen nehmen im Wasser gelösten Sauerstoff auf. Viele Fische spüren mit ihrem Seitenlinienorgan Wasserbewegungen und Druckunterschiede – hilfreich für Orientierung und Schwarmverhalten.',
       'Auch unter der Wasseroberfläche liegt eine Welt voller Leben. Wir preisen Gott für diese Vielfalt und schützen Gewässer als Lebensräume.',
       'Psalm 104,25', 'Was können wir tun, damit der Lebensraum Wasser sauber bleibt?')
nature('regenbogen', 'Regenbogen',
       'Ein Regenbogen entsteht, wenn Sonnenlicht in Wassertropfen gebrochen, im Tropfen reflektiert und in Farben aufgeteilt wird. Die Sonne steht dabei hinter dem Beobachter.',
       'In der Geschichte von Noah ist der Regenbogen ein Zeichen von Gottes Bund. Wir verbinden das Staunen über das Licht mit Dank für Gottes Treue.',
       '1. Mose 9,12–16', 'Welches Zeichen erinnert dich daran, dass ein Versprechen gilt?')
nature('regenwurm', 'Regenwurm',
       'Regenwürmer mischen organisches Material in den Boden und schaffen Gänge. Das kann Belüftung und Wasseraufnahme verbessern. Sie sind wichtige Helfer in vielen Bodenökosystemen.',
       'Ein unscheinbares Tier leistet viel. Wir danken Gott und lernen, auch leise, verborgene Beiträge wertzuschätzen.',
       'Psalm 24,1', 'Wer hilft im Hintergrund mit, ohne dafür viel Aufmerksamkeit zu bekommen?')
nature('igel', 'Igel',
       'Igelstacheln sind umgebildete Haare. Eine besondere Muskulatur ermöglicht das Einrollen. Im Winterschlaf werden Körpertemperatur, Herzschlag und Stoffwechsel stark abgesenkt.',
       'Schutz und Ruhe gehören zum Leben. Wir loben Gott für seine Geschöpfe und schaffen Rückzugsräume, statt Tiere zu stören.',
       'Psalm 104,18–23', 'Wo findest du Ruhe und Schutz, und wie können wir Tiere in Ruhe lassen?')
nature('schakal', 'Schakal',
       'Schakale gehören zu den Hunden. Sie können je nach Lebensraum sehr unterschiedliche Nahrung nutzen, auch Aas, und erfüllen damit Aufgaben im Nahrungsnetz.',
       'Nicht nur die beliebten Tiere gehören zur Schöpfung. Wir staunen über Zusammenhänge und achten Gottes vielfältige Lebenswelt.',
       'Psalm 104,24', 'Welches Tier wird oft unterschätzt, obwohl es eine wichtige Aufgabe erfüllt?')
nature('universum', 'Das Universum',
       'Sterne sind ferne Sonnen. Licht braucht Zeit für seinen Weg zu uns; ein Lichtjahr ist eine Entfernung. Wenn wir in den Sternenhimmel schauen, sehen wir deshalb auch in die Vergangenheit.',
       'Die Größe des Himmels kann uns an Gottes Größe erinnern. Mit dem Psalmisten dürfen wir staunen, dass Gott sich zugleich für uns Menschen interessiert.',
       'Psalm 8,4–5; Psalm 19,2', 'Was löst der Sternenhimmel in dir aus: Staunen, Fragen oder Dank?')
nature('huhn', 'Das Huhn',
       'Hühner sind soziale Tiere mit verschiedenen Lauten, etwa zur Warnung oder zum Rufen der Küken. Eine Glucke bietet ihren Küken Wärme und Schutz unter ihren Flügeln.',
       'Jesus verwendet das Bild einer Henne, die ihre Küken sammelt. So können wir über Geborgenheit und seine liebevolle Einladung nachdenken.',
       'Matthäus 23,37', 'Was bedeutet es für dich, bei jemandem geborgen zu sein?')
nature('braunbaer', 'Der Braunbär',
       'Braunbären sind Allesfresser. Für die Winterruhe legen sie Fettreserven an; Aktivität, Atmung und Herzschlag gehen zurück. Sie leben nicht allein von Fleisch.',
       'Jahreszeiten, Vorräte und Ruhe gehören zum Leben. Wir danken Gott für Nahrung und lernen, mit unseren Kräften und Lebensräumen verantwortlich umzugehen.',
       'Psalm 104,27–28', 'Wie können wir dankbar mit Nahrung umgehen und zugleich Wildtiere schützen?')


def action(slug, title, matches, category, materials, steps, impulse_title, verse, message, question, source_impulse=True):
    ACTIONS.append(dict(id='v28-action-'+slug, title=title, matches=matches, category=category,
                        materials=materials, steps=steps, source='Planungstabelle im Anhang',
                        impulse=dict(id='v28-impulse-'+slug, title=impulse_title, verse=verse,
                                     message=message, question=question,
                                     origin='Aus dem Anhang ausgearbeitet' if source_impulse else 'Ergänzender Vorschlag')))


action('schwedenstuhl', 'Schwedenstuhl bauen', ['schwedenstuhl'], 'Bauen & Werken',
       ['Holz', 'Zeichnung', 'Schrauben', 'Akkuschrauber', 'Säge', 'Zollstock', 'Bleistift', 'Stoff', 'Tacker'],
       ['Zeichnung und Maße gemeinsam prüfen.', 'Holzteile unter Anleitung vorbereiten und verbinden.', 'Sitzfläche befestigen und den fertigen Stuhl prüfen.'],
       'Durchhalten bis zum Ziel', 'Hebräer 12,1–2', 'Ein Stuhl wird Schritt für Schritt fertig. Auch auf dem Weg mit Jesus dürfen wir dranbleiben und uns gegenseitig ermutigen.', 'Was hilft dir, eine angefangene Sache zu Ende zu bringen?')
action('pfannenwender', 'Pfannenwender schnitzen', ['pfannenwender_schnitzen'], 'Schnitzen',
       ['Geeignetes Holzbrett', 'Schnitzmesser', 'Schleifpapier'], ['Form aufzeichnen und sichere Schnitzregeln besprechen.', 'Unter Anleitung in kleinen Schritten schnitzen.', 'Kanten glätten und das Ergebnis gemeinsam betrachten.'],
       'Mit unseren Händen dienen', '1. Petrus 4,10', 'Aus einem Stück Holz wird ein nützlicher Helfer. Gott gibt uns Begabungen, mit denen wir anderen dienen können.', 'Wem könntest du mit deiner Begabung eine Freude machen?', False)
action('flusswanderung', 'Flusswanderung', ['flusswanderung'], 'Unterwegs',
       ['Badesachen nach Absprache', 'Passende Schuhe', 'Trinkwasser', 'Hotdog-Verpflegung'], ['Route, Wasserstand und sichere Ein-/Ausstiege vorab prüfen.', 'Gemeinsam unter geeigneter Aufsicht unterwegs sein.', 'Mit einer Pause und Rückblick abschließen.'],
       'Mit Jesus durch schwierige Wege', 'Psalm 23,4', 'Ein Weg am Wasser kann schön und herausfordernd sein. Gottes Begleitung bedeutet nicht, dass wir leichtsinnig werden; wir dürfen ihm vertrauen und aufeinander achten.', 'Wann war es gut, auf einem schwierigen Weg nicht allein zu sein?')
action('spiele-kartoffeln', 'Wiesenspiele und Kartoffeln am Feuer', [], 'Spielen & Feuer',
       ['Ball', 'Kartoffeln', 'Salz', 'Geeignete Feuerstelle'], ['Gemeinsame Spiele vorbereiten.', 'Kartoffeln sicher an der Feuerstelle zubereiten.', 'Beim Essen über die gemeinsam verbrachte Zeit sprechen.'],
       'Unsere Zeit sinnvoll nutzen', 'Epheser 5,15–16', 'Zeit ist ein Geschenk. Wir können bewusst wählen, was uns und anderen guttut und wie wir unsere Tage mit Gott gestalten.', 'Wofür möchtest du diese Woche bewusst Zeit freihalten?')
action('brot-backen', 'Brot backen und gemeinsam spielen', ['essen_am_feuer'], 'Outdoor-Küche',
       ['Brotmischung oder Teigzutaten', 'Warmes Wasser', 'Aufstrich', 'Geeignete Backmöglichkeit'], ['Teig nach Rezept zubereiten.', 'Während der Geh-/Backzeit gemeinsam spielen.', 'Brot teilen und einen kurzen Impuls gestalten.'],
       'Jesus – das Brot des Lebens', 'Johannes 6,35', 'Brot stärkt unseren Körper. Jesus spricht davon, dass er das Brot des Lebens ist: Bei ihm finden wir mehr als eine volle Mahlzeit.', 'Was brauchst du neben Essen, damit es dir innerlich gut geht?')
action('burger', 'Burgerabend', ['burgerabend'], 'Outdoor-Küche',
       ['Burgerpatties', 'Burgerbrötchen', 'Soßen', 'Gemüse', 'Getränke'], ['Aufgaben in der Küche verteilen.', 'Zutaten und Patties hygienisch zubereiten.', 'Gemeinsam essen und allen Helfern danken.'],
       'Viele Teile – ein Team', '1. Korinther 12,12–27', 'Verschiedene Zutaten ergeben eine Mahlzeit, verschiedene Begabungen bereichern unsere Gruppe. In Gottes Gemeinde ist jede Person wertvoll.', 'Welchen Beitrag von jemand anderem möchtest du heute würdigen?', False)
action('bienen', 'Bienen beobachten und Honigfrühstück', [], 'Natur & Entdecken',
       ['Informationen oder Bilder zu Bienen', 'Milch', 'Brötchen', 'Schmand', 'Honig'], ['Beobachtung mit einer kundigen Person und sicherem Abstand planen.', 'Aufgaben und Bestäubung der Bienen kennenlernen.', 'Beim Frühstück über Schöpfung und Zusammenarbeit sprechen.'],
       'Kleine Geschöpfe, große Wirkung', 'Psalm 104,24', 'Bienen und viele andere Bestäuber verbinden Pflanzen und Lebensräume. Wir danken Gott für dieses Zusammenspiel und fragen, wie wir es bewahren können.', 'Welche kleine Handlung hilft unserer Umwelt?', False)
action('knoten', 'Knotenkunde mit Spielen und Hotdogs', ['knotenkunde'], 'Pfadfindertechnik',
       ['Seile', 'Hotdogs', 'Material für Gruppenspiele'], ['Knoten vorführen und selbst üben.', 'In kleinen Teams eine praktische Aufgabe lösen.', 'Gemeinsam essen und den Zusammenhalt besprechen.'],
       'Eine dreifache Schnur', 'Prediger 4,9–12', 'Der Bibeltext beschreibt die Stärke von Gemeinschaft. Das Bild der dreifachen Schnur kann uns zusätzlich an Bibel, Gebet und den Heiligen Geist erinnern; diese Zuordnung ist eine Anwendung des Bildes.', 'Wer hilft dir, im Glauben dranzubleiben?')
action('bogen-bauen', 'Bogenbau und Eier braten', [], 'Bauen & Werken',
       ['Geeignetes Holz', 'Maurerschnur', 'Kabelbinder', 'Säge', 'Eier', 'Pfanne'], ['Sportgerechtes Material und geeignete Anleitung organisieren.', 'Bogenbau in betreuten Arbeitsschritten planen; Schießen nur im gesicherten Bereich.', 'Gemeinsam eine Mahlzeit zubereiten.'],
       'Was uns innerlich stark macht', 'Epheser 6,10–18', 'Paulus beschreibt die Waffenrüstung Gottes als geistliches Bild: Wahrheit, Gerechtigkeit, Frieden, Glaube und Gebet. Es geht um Vertrauen auf Gott und einen friedfertigen Lebensweg.', 'Welches dieser Dinge brauchst du gerade besonders?')
action('bogenschiessen', 'Bogenschießen und Schnitzelbrötchen', [], 'Sport & Geschick',
       ['Sportbogen und passende Pfeile', 'Zielscheibe', 'Geeigneter gesicherter Schießbereich', 'Brötchen und Schnitzel'], ['Fachkundige Aufsicht und feste Sicherheitsregeln sicherstellen.', 'Zielübungen durchführen und sich gegenseitig ermutigen.', 'Gemeinsame Mahlzeit und Gespräch über Ziele.'],
       'Gute Ziele im Leben', 'Philipper 3,13–14', 'Beim Zielen richten wir uns bewusst aus. Paulus beschreibt seinen Weg mit Christus als einen Weg mit Ziel. Wir dürfen überlegen, woran wir unser Leben ausrichten.', 'Welches Ziel hilft dir, gute Entscheidungen zu treffen?')
action('suppenkueche', 'Lagerküche bauen und Suppe kochen', ['dutchoven'], 'Outdoor-Küche',
       ['Kartoffeln', 'Zwiebeln', 'Möhren', 'Weitere Zutaten nach Rezept', 'Seile', 'Kochtopf', 'Geeignete Feuerstelle'], ['Einen sicheren Arbeitsplatz und die Lagerküche vorbereiten.', 'Zutaten gemeinsam schneiden und Suppe kochen.', 'Vor dem Essen danken und einen Gebetsimpuls teilen.'],
       'Mit Gott im Gespräch', 'Philipper 4,6–7', 'In der Küche müssen wir uns absprechen. Auch mit Gott dürfen wir über alles reden: danken, bitten und Sorgen aussprechen.', 'Was möchtest du Gott heute anvertrauen?')
action('pizzaofen', 'Pizzaofen bauen und Pizza backen', ['pizzaofen','pizzaabend'], 'Bauen & Outdoor-Küche',
       ['Für Hitze geeignete Ofenbausteine', 'Pizzateig', 'Pizzabelag', 'Geeignete Backunterlage'], ['Ofenbau mit einer sachkundigen Person und geeigneten Materialien planen.', 'Ofen sicher vorbereiten und Pizzen belegen.', 'Gemeinsam essen und die Geschichte aus Daniel 3 besprechen.'],
       'Gott vertrauen – auch wenn es schwer wird', 'Daniel 3,16–18.24–28', 'Daniels Freunde bleiben Gott treu. Sie vertrauen ihm, ohne seine Hilfe erzwingen zu wollen. Ihr Mut ermutigt uns, in schweren Situationen bei Gott Halt zu suchen.', 'Was bedeutet Vertrauen, wenn ich den Ausgang einer Sache noch nicht kenne?')
action('nachtwanderung', 'Nachtwanderung mit gemeinsamem Essen', ['nachtwanderung'], 'Unterwegs',
       ['Taschenlampen', 'Wetterfeste Kleidung', 'Verpflegung nach Absprache'], ['Route, Aufsicht und Treffpunkte festlegen.', 'Mit vereinbarten Regeln gemeinsam im Dunkeln wandern.', 'An einem sicheren Ort essen und über Licht sprechen.'],
       'Jesus ist Licht – wir können Licht weitergeben', 'Johannes 8,12; Matthäus 5,14–16', 'Eine Lampe hilft auf dunklen Wegen. Jesus nennt sich das Licht der Welt und ermutigt seine Nachfolger, Gutes sichtbar werden zu lassen.', 'Wie kannst du für jemanden in einer schwierigen Situation ein Licht sein?')
action('grillzange', 'Grillzange bauen', ['grillzange_schnitzen'], 'Bauen & Werken',
       ['Geeignetes Holz', 'Säge', 'Verbindungsmaterial nach Bauplan', 'Schleifpapier'], ['Bauplan und Werkzeugregeln besprechen.', 'Die Grillzange unter Anleitung herstellen.', 'Funktion prüfen und zum gemeinsamen Kochen einsetzen.'],
       'Groß sein durch Dienen', 'Markus 10,45', 'Ein Werkzeug kann anderen das Leben leichter machen. Jesus zeigt uns Größe im Dienen. Auch unsere Hände können anderen helfen.', 'Was kannst du heute tun, das jemand anderem Arbeit abnimmt?', False)
action('sauna', 'Gemeinsamer Saunaabend', ['saunaabend'], 'Gemeinschaft',
       ['Getränke', 'Knabbereien', 'Handtücher', 'Wechselkleidung'], ['Geeigneten Ort, freiwillige Teilnahme und Aufsicht klären.', 'Pausen, ausreichendes Trinken und persönliche Grenzen beachten.', 'Mit einem ruhigen gemeinsamen Abschluss ausklingen lassen.'],
       'Zur Ruhe kommen', 'Matthäus 11,28–30', 'Ruhe und Grenzen sind wichtig. Jesus lädt erschöpfte Menschen zu sich ein. Wir dürfen bei Gott zur Ruhe kommen und aufeinander Rücksicht nehmen.', 'Was hilft dir, wieder zur Ruhe zu kommen?', False)
action('fackel', 'Fackeln gestalten', [], 'Werken & Feuer',
       ['Geeignetes Material nach erprobter Anleitung', 'Stoff', 'Draht', 'Wachs', 'Werkzeug'], ['Geeignete Anleitung, Brandschutz und Aufsicht klären.', 'Materialien unter Anleitung vorbereiten und gestalten.', 'Fackeln nur an freigegebenen Orten sicher verwenden.'],
       'Licht sein', 'Matthäus 5,14–16', 'Licht macht einen Unterschied, ohne viel zu reden. Jesus ermutigt uns, mit guten Taten auf Gott hinzuweisen.', 'Welche konkrete gute Tat könnte diese Woche etwas heller machen?')
action('stockbrot', 'Stockbrot und Bewegungsspiele', ['hotdogabend','essen_am_feuer'], 'Spielen & Outdoor-Küche',
       ['Teig', 'Geeignete Stockbrotstöcke', 'Würstchen nach Rezept', 'Spielmaterial'], ['Bewegungsspiele und die Feuerstelle vorbereiten.', 'Stockbrot unter Aufsicht backen.', 'Beim Essen über Glauben im Alltag sprechen.'],
       'Gott auch im Alltag erleben', '1. Korinther 10,31', 'Glaube gehört auch zum Spielen, Essen, Helfen und Unterwegssein. Wir können Gott mitten im Alltag danken und ihm mit unserem Handeln Ehre geben.', 'Wo möchtest du morgen bewusst mit Gott rechnen?')
action('rundgang', 'Geländerundgang und gemeinsame Auszeit', [], 'Gemeinschaft',
       ['Abgesprochene Route', 'Getränke', 'Kleidung nach Wetter'], ['Rundgang und zugängliche Bereiche mit den Verantwortlichen absprechen.', 'Gemeinsam den Ort entdecken.', 'Mit einer Pause und einem kurzen Rückblick abschließen.'],
       'Mit offenen Augen unterwegs', 'Psalm 24,1', 'Wir können einen vertrauten Ort neu wahrnehmen. Die Erde gehört Gott; Dankbarkeit hilft uns, gut mit ihr und mit anderen umzugehen.', 'Was hast du heute zum ersten Mal bewusst wahrgenommen?', False)
action('epheser-pizza', 'Pizzaabend mit Epheserbrief', [], 'Gemeinschaft & Bibel',
       ['Pizzateig', 'Pizzabelag', 'Bibel', 'Material für einen kurzen Ortsüberblick'], ['Gemeinsam Pizza vorbereiten.', 'Die Stadt Ephesus kurz einordnen und eine Passage aus dem Epheserbrief lesen.', 'Gebetsanliegen für andere sammeln.'],
       'Nicht nur für uns selbst beten', 'Epheser 6,18–20', 'Paulus bittet um Gebet und ermutigt zum Beten für andere. Unser Blick darf über die eigenen Wünsche hinausgehen.', 'Für wen außerhalb unserer Gruppe möchtest du beten?')
action('schneidebrett', 'Schneidebrett schleifen', [], 'Bauen & Werken',
       ['Geeignetes Eichenholz', 'Schleifpapier oder betreutes Schleifgerät', 'Geeignete Oberflächenbehandlung'], ['Holz und Arbeitsschutz vorbereiten.', 'Kanten und Flächen unter Anleitung glätten.', 'Das Ergebnis betrachten und über Entwicklung sprechen.'],
       'Gott formt uns', 'Epheser 2,10; Jesaja 64,7', 'Ein Werkstück entwickelt sich in vielen Schritten. Die Bibel beschreibt Menschen als Gottes Werk und Gott als den Töpfer. Wir dürfen uns von ihm prägen lassen.', 'In welchem Bereich möchtest du mit Gottes Hilfe wachsen?')
action('schneidebrett-fertig', 'Schneidebrett fertigstellen und ölen', [], 'Bauen & Werken',
       ['Vorbereitetes Schneidebrett', 'Geeignete Fräse unter fachkundiger Aufsicht', 'Möbelfüße und Verbindungsmaterial', 'Lebensmittelechtes Holzöl'], ['Die nächsten Arbeitsschritte und benötigtes Material prüfen.', 'Kanten und Füße unter geeigneter Anleitung fertigstellen.', 'Das Brett nach Herstellerangaben ölen.'],
       'Bereit sein', 'Matthäus 25,1–13', 'Die Geschichte der klugen und törichten Brautjungfern lädt dazu ein, wach und bereit zu leben. Vorbereitung hilft – im Werkprojekt und in unserem Weg mit Gott.', 'Welche kleine Vorbereitung könntest du heute schon treffen?')
action('schwedenfeuer', 'Schwedenfeuer und Schnitzelbrötchen', [], 'Feuer & Outdoor-Küche',
       ['Trockenes geeignetes Holz', 'Werkzeug und Verbindungsmaterial nach erprobter Anleitung', 'Schnitzel', 'Brötchen', 'Soßen'], ['Feuerplatz, Aufsicht und sichere Anleitung vorbereiten.', 'Schwedenfeuer anlegen und die Mahlzeit zubereiten.', 'Gemeinsam essen und den Impuls besprechen.'],
       'Was macht uns innerlich rein?', 'Markus 7,14–23', 'Jesus lenkt den Blick auf unser Herz. Entscheidend ist nicht eine saubere Außenseite allein, sondern wie wir denken, reden und handeln. Wir dürfen ihn um ein erneuertes Herz bitten.', 'Was möchtest du in deinem Denken oder Handeln verändern lassen?')

data = {'nature': NATURE, 'actions': ACTIONS}
assert len(NATURE) == 28 and len(ACTIONS) == 22
code = '/* V28: nature facts, separate faith reflections, and anonymised reusable planning ideas. */\nwindow.RangerHubLibraryV28=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c') + ';\n'
(ROOT/'rangerhub-library-v28.js').write_text(code)
print(json.dumps({'nature': len(NATURE), 'action_scenarios': len(ACTIONS), 'bytes': len(code.encode())}))
