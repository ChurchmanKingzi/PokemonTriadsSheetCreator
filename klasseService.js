// klasseService.js
const klasseService = {
    getAllKlassen: function() {
        return [
            {
                id: 'angler',
                name: 'Angler',
                beschreibung: 'Du beginnst das Spiel mit einer einfachen Angelrute und erhältst +1 automatischen Erfolg auf alle Angeln-Proben.'
            },
            {
                id: 'aromalady',
                name: 'Aromalady',
                beschreibung: 'Du bist in der Lage, aus Pflanzenpokemon und Wildblumen Parfüms mit starker Wirkung herzustellen. Ein Parfüm herzustellen, dauert 1W4 Stunden und erfordert Blumen oder Pflanzen-Pokemon in deiner Umgebung. Parfüms können genutzt werden, um eine Probe auf eine der folgenden Fertigkeiten mit doppelt so vielen Würfeln zu würfeln: Anführen, Beruhigen, Betören, Überreden, Umgang mit Pokemon.'
            },
            {
                id: 'ass-trainer',
                name: 'Ass-Trainer',
                beschreibung: 'Sehr effektive Attacken deines Pokemon fügen statt x2- x2.5-fachen Schaden zu.'
            },
            {
                id: 'biker',
                name: 'Biker',
                beschreibung: 'Du beginnst das Spiel mit einem zusammenklappbaren Fahrrad sowie Verbindungen zu den Weezing Wheezing, einer notorischen Biker-Gang, die den Nordosten der Triaden-Region unsicher macht. Wenn du Bezug auf deine Gang nimmst, kannst du bei Einschüchtern-Proben gegen manche Ziele nach Ermessen des Spielleiters zusätzliche Erfolge bekommen.'
            },
            {
                id: 'clown',
                name: 'Clown',
                beschreibung: 'Du kannst im Kampf deine Aktion nutzen, um zu versuchen, ein Ziel abzulenken. Dazu würfelst du eine Probe auf Schauspielern und das Ziel muss auf Menschenkenntnis dagegen würfeln. Erzielst du mehr Erfolge, verliert das Ziel seinen nächsten Zug.'
            },
            {
                id: 'cowboy-cowgirl',
                name: 'Cowboy/Cowgirl',
                beschreibung: 'Solange du auf einem Pokemon reitest, darfst du alle Proben auf folgende Fertigkeiten mit der doppelten Anzahl Würfel würfeln: Sinnesschärfe, Werfen, Orientierung, Anführen, Einschüchtern, Fangen'
            },
            {
                id: 'dieb',
                name: 'Dieb',
                beschreibung: 'Du kannst Pokebälle so modifizieren, dass man damit die Pokemon anderer Trainer stehlen kann. Einen Ball zu modifizieren, dauert 2W6 Stunden. Das ist eines der schwersten Verbrechen, die man begehen kann. Ein gestohlenes Pokemon wird dir nicht sofort gehorchen, du kannst es aber über Umgang mit Pokemon „erziehen“.'
            },
            {
                id: 'dompteur',
                name: 'Dompteur',
                beschreibung: 'Du kannst deinen Pokemon Kombinationen von Attacken beibringen. Diese bestehen aus 2 oder mehr verschiedenen Attacken hintereinander, die alle innerhalb einer Aktion ausgeführt werden. Einem Pokemon eine Kombination beizubringen, kostet 1W6 Tage. Führt ein Pokemon eine Kombination aus, ist die Schwierigkeit seiner GENA-Probe pro zusätzlicher Attacke um 1 erhöht. Das heißt: 2 Attacken hintereinander → Schwierigkeit +1; 3 Attacken → Schwierigkeit +2 usw. Ein Pokemon kann natürlich trotzdem immer auch die einzelnen Attacken einsetzen.'
            },
            {
                id: 'farmer',
                name: 'Farmer',
                beschreibung: 'Du kommst von einer Farm und hast dort bereits lange Zeit mit einem Pokemon zusammengearbeitet. Neben deinem Starter bekommst du außerdem eines der folgenden Pokemon deiner Wahl auf Level 5: Nidoran (m/w), Fukano, Ponita, Voltilamm, Quiekel, Pampuli, Wolly'
            },
            {
                id: 'feuerspucker',
                name: 'Feuerspucker',
                beschreibung: 'Du als Trainer erhältst die Attacke: Flammenwurf. Typ Feuer, Schaden 9W6. Bei 3 oder mehr Erfolgen wird das Ziel verbrannt. Diese Attacke kann nur einmal alle zwei Runden eingesetzt werden. Du kannst diese Attacke mit einer Probe auf Umgang mit Pokemon in 1W6 Tagen Pokemon, die sie lernen können, beibringen.'
            },
            {
                id: 'forscher',
                name: 'Forscher',
                beschreibung: 'Du erhältst automatisch +1 Erfolg auf alle Proben auf folgende Fertigkeiten: Gefahreninstinkt, Naturwissenschaften, Orientierung, Wildnisleben'
            },
            {
                id: 'gentleman-lady',
                name: 'Gentleman/Lady',
                beschreibung: 'Du beginnst das Spiel mit drei zusätzlichen Items aus der Item-Auswahl.'
            },
            {
                id: 'goere',
                name: 'Göre',
                beschreibung: 'Du erhältst 2 zusätzliche Würfel für folgende Fertigkeiten, wenn du das Ziel während der Interaktion geschickt und charmant beleidigst: Betören, Einschüchtern, Überreden, Überzeugen'
            },
            {
                id: 'hexe',
                name: 'Hexe',
                beschreibung: 'Du beginnst das Spiel mit einer Kristallkugel. Wenn du dir deine Umgebung durch die Kristallkugel hindurch anschaust, kannst du sie in der Vergangenheit sehen. Beispiel: Du kommst an eine eingestürzte Brücke. Durch den Blick in die Kristallkugel kannst du den Moment sehen, in dem sie eingestürzt ist, findest also das Warum heraus. Du kannst nicht kontrollieren, wann du die Dinge in der Kugel siehst, aber die Kugel zeigt dir immer wichtige Momente, sofern es sie gibt. Durch die Kugel zu sehen erschöpft sich sehr und erfordert große Konzentration! Andere können die Kugel nicht benutzen.'
            },
            {
                id: 'jongleur',
                name: 'Jongleur',
                beschreibung: 'Du kannst zu Beginn jeder Runde im Kampf dein aktives Pokemon als zusätzliche Aktion wechseln. Du kannst für das neue Pokemon die Initiative des alten behalten oder neu würfeln.'
            },
            {
                id: 'kaefersammler',
                name: 'Käfersammler',
                beschreibung: 'Du erhältst +2 zusätzliche Erfolge auf Fangen-Proben von Käfer-Pokemon. Außerdem hast du Kontakte zu Käfersammler-Clubs in jeder Stadt, in denen du Käfer-Pokemon für Pokebälle eintauschen kannst. Je nach Seltenheit der Spezies kannst du so viel Gewinn machen..'
            },
            {
                id: 'kuenstler',
                name: 'Künstler',
                beschreibung: 'Du kannst Attacken, die du aus nächster Nähe und im Detail siehst, in Gemälden festhalten. Diese kannst du wie TMs nutzen, um Pokemon in detaillierten und exzessiven Trainings-Sessions diese Attacken beizubringen. Das Malen erfordert 2W6 Stunden, das Beibringen 6 Stunden.'
            },
            {
                id: 'matrose',
                name: 'Matrose',
                beschreibung: 'Du erhältst +1 Erfolge auf alle Fertigkeits-Proben, die auf hoher See (auf einem Schiff, surfend, schwimmend...) ausgeführt werden.'
            },
            {
                id: 'medium',
                name: 'Medium',
                beschreibung: 'Du kannst deinen Pokemon telepathisch und über beliebige Distanz Befehle geben. Das gilt nur, solange sie wach und bei Bewusstsein sind und ist genauso, als ob du ihnen einen verbalen Befehl geben würdest; sie müssen nicht gehorchen, wenn sie das nicht wollen. Solange du schläfst, kannst du außerdem durch die Augen eines deiner Pokemon sehen. Das Pokemon kann dich aktiv aus seinem Kopf "rausschmeißen", wenn es das nicht will.'
            },
            {
                id: 'ninjajunge',
                name: 'Ninjajunge',
                beschreibung: 'Du kannst jederzeit und unabhängig von der Umgebung eine Probe auf Schleichen/Verstecken ablegen, um dich perfekt zu tarnen und nahezu unsichtbar zu werden. Solange du dich nicht bewegt, sind Proben, dich zu finden, Schwierigkeit 4. Außerdem beginnst du das Spiel mit 5 Rauchbomben, die du nutzen kannst, um dich in einer Rauchwolke „aufzulösen“.'
            },
            {
                id: 'picknicker',
                name: 'Picknicker',
                beschreibung: 'Du kannst vollwertige Mahlzeiten aus dem herstellen, was du in der Natur so um dich herum findest (Kräuter, wilde Pflanzen usw.). Um die Zutaten zu finden, musst du trotzdem Wildnisleben oder Suchen würfeln, aber sobald du sie hast, kannst du ohne Notwendigkeit einer weiteren Probe ein gutes, vollwertiges Essen daraus herstellen. Normalerweise würde es Mali mit sich bringen, keine „richtige“ Nahrung zu sich zu nehmen. Außerdem weißt du immer automatisch, ob Pflanzen, Pilze usw. giftig sind.'
            },
            {
                id: 'pokefan',
                name: 'Pokefan',
                beschreibung: 'Du kannst auf einen Blick und ohne Notwendigkeit einer Probe folgende Dinge über ein Pokemon herausfinden, das du siehst: Seine Spezies, sein Geschlecht, sein genaues Level, wie glücklich es gerade ist, wie aggressiv es gerade ist, wie viele Wunden es hat und wie viel Kampferfahrung es hat.'
            },
            {
                id: 'pokemon-sammler',
                name: 'Pokemon-Sammler',
                beschreibung: 'Du hast Connections zu einem nicht komplett legalen Underground-Trader-Netzwerk, in dem Pokemon gegen zufällige andere Pokemon getauscht werden können. Du kannst einmal pro Woche einen Kontakt im Netzwerk kontaktieren und eines deiner Pokemon abgeben, das innerhalb von 2W6 Stunden gegen ein zufälliges anderes auf demselben Level getauscht werden wird. Was genau du bekommst, würfelt der Spielleiter aus. Erwarte keine legendären Pokemon und in der frühen Phase deiner Reise auch keine entwickelten … es können aber sehr wohl Pokemon sein, die extrem selten oder anders gar nicht zu bekommen sind!'
            },
            {
                id: 'pokemon-zuechter',
                name: 'Pokemon-Züchter',
                beschreibung: 'Du beginnst das Spiel mit einem Pokemon-Ei, weißt allerdings selbst nicht, was daraus schlüpfen wird; das bestimmt der Spielleiters. Aus dem Ei wird irgendein Baby-Pokemon schlüpfen, das keinen Pokeball braucht, um Teil deines Teams zu werden. Wenn du ein bestimmtes Baby-Pokemon willst, kannst du eine Probe auf GL (nur den Grundwert) ablegen, um rein zufällig genau dieses Mon zu bekommen. Die Probe erfolgt, wenn das Ei schlüpft, was einige In-Game-Tage dauern wird.'
            },
            {
                id: 'raufbold',
                name: 'Raufbold',
                beschreibung: 'Bis zu zweimal pro Session, wenn du Schaden durch einen physischen Angriff nehmen würdest: Du kannst ihn ignorieren.'
            },
            {
                id: 'schwarzgurt',
                name: 'Schwarzgurt',
                beschreibung: 'Du als Trainer erhältst die Attacken: KARATESCHLAG. Typ Kampf, 5W6 Schaden. Erzielt bei 2 oder mehr Erfolgen einen kritischen Treffer. SCANNER. Typ Kampf, kein Schaden. Du weichst der nächsten physischen Attacke, die dich innerhalb der nächsten 2 Runden treffen würde und die du sehen kannst, automatisch aus. ÜBERWURF. Typ Kampf, 7W6 Schaden. Das Ziel ist in der nächsten Runde als letztes (nach den Trainern) dran. Funktioniert nur gegen Ziele, die du heben kannst! Du kannst diese Attacken binnen 1W6 Tagen Pokemon beibringen, die sie lernen können.'
            },
            {
                id: 'schwimmer',
                name: 'Schwimmer',
                beschreibung: 'Du erhältst +2 Erfolge auf alle Schwimmen-Proben. Außerdem kannst du bis zu 5 Minuten lang die Luft anhalten und erhältst unter Wasser keinerlei Mali. Wasser-Pokemon bauen schneller Vertrauen zu dir auf und du erhältst +1 Erfolge auf Umgang mit Pokemon-Proben mit Wasser-Pokemon.'
            },
            {
                id: 'schoenheit',
                name: 'Schönheit',
                beschreibung: 'Betören-Proben (gegen Ziele, bei denen sie auch funktionieren) bekommen +1 Erfolge. Außerdem darfst du im Kampf für jedes deiner Pokemon, das in deinen Augen niedlich ist, einmal pro Kampf eine Probe neuwürfeln.'
            },
            {
                id: 'vogel-profi',
                name: 'Vogel-Profi',
                beschreibung: 'Du erhältst +1 Erfolge auf Fangen-Proben gegen alle Pokemon, die Flügel haben. Außerdem kannst du fliegende Pokemon (die entsprechend groß sind) auch ohne einen Sattel reiten.'
            },
            {
                id: 'wanderer',
                name: 'Wanderer',
                beschreibung: 'Deine Pokemon, die doppelt schwach gegen einen Typ sind (z.B. Kleinstein gegen Wasser) nehmen nur doppelten Schaden von Attacken dieses Typs, nicht vierfachen. Du besitzt außerdem große Ausdauer und brauchst selbst nach großer körperlicher Anstrengung nicht mehr Schlaf als normal.'
            }
        ];
    }
};
