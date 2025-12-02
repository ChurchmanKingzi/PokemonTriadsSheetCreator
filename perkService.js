// perkService.js
const perkService = {
    getAllPerks: function() {
        return [
            {
                id: 'abrollen',
                name: 'Abrollen',
                beschreibung: 'Solange du bei Bewusstsein bist und dich halbwegs frei bewegen kannst, kannst du dich quasi automatisch abrollen. Aller Fallschaden wird halbiert.'
            },
            {
                id: 'adaption',
                name: 'Adaption',
                beschreibung: 'Nachdem du von einer Attacke getroffen wurdest, kannst du selbst für den Rest des Kampfes den Typ der Attacke annehmen. Das hat ausdrücklich nur den Effekt, dass du (nicht) sehr effektiv von anderen Attacken getroffen wirst. Den Typ Gift zu haben, macht dich nicht immun gegen Vergiftung, Wasser lässt dich nicht unter Wasser atmen usw.'
            },
            {
                id: 'adaptive-taktiken',
                name: 'Adaptive Taktiken',
                beschreibung: 'Nach jeder vollen Kampfrunde erhältst du für den Rest des Kampfes +1 Würfel auf alle GENA- und PA-Proben.'
            },
            {
                id: 'adrenalinjunkie',
                name: 'Adrenalinjunkie',
                beschreibung: 'Solange deine KP unter 50% ihres Maximums sind, würfelst du alle PA-Proben zweimal und das bessere Ergebnis zählt.'
            },
            {
                id: 'akrobat',
                name: 'Akrobat',
                beschreibung: 'Du kannst deinen Akrobatik-Wert zusätzlich zu Ausweichen auch noch auf deine PA-Proben addieren.'
            },
            {
                id: 'alte-narbe',
                name: 'Alte Narbe',
                beschreibung: 'Du hast eine pochende Narbe von einem alten Kampf gegen ein gefährliches Pokemon. Die Narbe pocht immer, wenn sehr starke, gefährliche Pokemon in der Nähe sind, selbst, wenn du sie nicht wahrnehmen kannst.'
            },
            {
                id: 'ausdauernd',
                name: 'Ausdauernd',
                beschreibung: 'Wenn du in einem Kampf zum ersten Mal auf 0 KP fallen würdest, solange du mehr als 1 KP hast, fällst du stattdessen automatisch auf 1 KP. Du nimmst dabei auch nicht die Wunde dafür, auf 0 KP zu fallen (aber alle anderen Wunden!).'
            },
            {
                id: 'ausweichkuenstler',
                name: 'Ausweichkünstler',
                beschreibung: 'Du erhältst jede Runde zwei zusätzliche Reaktionen, die nur zum Ausweichen genutzt werden können. Pro eingehendem Angriff kannst du trotzdem nur einen Ausweichversuch starten.'
            },
            {
                id: 'beeren-connoisseur',
                name: 'Beeren-Connoisseur',
                beschreibung: 'Du kannst eine Beere als getragenes Item in deinem Mund halten wie ein Pokemon und darauf herumkauen oder -lutschen. Im Kampf kannst du jederzeit als freie Aktion ansagen, die Beere schlucken zu wollen, um ihren Effekt zu bekommen. Beereneffekte betreffen dich doppelt so stark wie andere.'
            },
            {
                id: 'beguenstigt-vom-schicksal',
                name: 'Begünstigt vom Schicksal',
                beschreibung: 'Du kannst in jedem Kampf einmal pro Kampf einen einzelnen Würfelwurf, egal wer ihn würfelt und egal ob es sich dabei um eine Probe oder Schaden handelt, neu würfeln lassen wie mit einem zusätzlichen Glücks-Token.'
            },
            {
                id: 'blitztausch',
                name: 'Blitztausch',
                beschreibung: 'Deine Pokemon auszuwechseln, kostet dich keine Aktion oder Reaktion und du kannst es jederzeit tun, auch außerhalb deines Zugs. Ein neu eingewechseltes Pokemon bekommt erst nächste Runde einen Zug.'
            },
            {
                id: 'chaotische-biologie',
                name: 'Chaotische Biologie',
                beschreibung: 'Du würfelst zu Beginn jeder Runde 1W20, wobei 19 und 20 neugewürfelt werden. Von der gewürfelten Zahl hängt ab, welchen Typ du für den Rest der Runde hast. Dies beeinflusst nur, wie effektiv dich Attacken treffen und hat sonst keinerlei Effekt!'
            },
            {
                id: 'einschuechternde-praesenz',
                name: 'Einschüchternde Präsenz',
                beschreibung: 'Wilde Pokemon, deren Level niedriger sind als deines, werden dich niemals zuerst angreifen (sich aber natürlich wehren, falls du sie oder ihre Verbündeten angreifst). Außerhalb von bereits ausgebrochenen Kämpfen werden sie dir aus dem Weg gehen und lieber fliehen als sich auf eine Konfrontation einzulassen. Achtung: Das kann bei bestimmten Spezies oder in bestimmten Situationen fehlschlagen! Es ist niemals garantiert.'
            },
            {
                id: 'erfahrungs-dex',
                name: 'Erfahrungs-Dex',
                beschreibung: 'Du sammelst Erfahrung im Kampf gegen jedes Pokemon, das du schon einmal selbst mit einer Attacke getroffen hast oder von dem du in einem richtigen Kampf getroffen wurdest. Diese Pokemon kannst du dir in einer Liste notieren. Kämpfst du in Zukunft noch mal gegen Pokemon dieser Spezies (in neuen, zukünftigen Kämpfen), erhältst du +5 Würfel auf alle GENA- und PA-Proben gegen sie.'
            },
            {
                id: 'flashforwards',
                name: 'Flashforwards',
                beschreibung: 'Du kannst einmal pro Kampf deklarieren, dass eine Aktion nur in deinem Kopf passiert ist. Wenn du damit mit einer Spielleiter-Aktion interagieren willst, musst du das ansagen, bevor der Spielleiter würfelt! Das kannst du z.B. tun, wenn ein verbündetes Pokemon mit einer Attacke verfehlt oder ein gegnerisches Mon eine sehr gefährliche Attacke einsetzen wollen würde. Das, was da geschehen wäre, war nur ein kurzer Flashforward, der dir eine mögliche, aber nicht reale Zukunft gezeigt hat. Stattdessen muss der Kampfteilnehmer seine Aktion für etwas anderes nutzen (z.B. eine andere Attacke). Hat der Kampfteilnehmer sich unmittelbar vor der Aktion bewegt, wird auch die Bewegung zurückgesetzt und kann neu ausgeführt werden.'
            },
            {
                id: 'freundschaft-ist-blind',
                name: 'Freundschaft ist blind',
                beschreibung: 'Deine Bande zu deinen Pokemon ist so stark, dass sie sich in den Weg von Attacken werfen können, die dich sonst treffen würden. Das ist situationsabhängig und erfordert, dass dein Pokemon nahe genug dran ist, um die Attacke abzufangen, sie kommen sieht, und physisch überhaupt in der Lage ist, sich rechtzeitig dazwischen zu werfen und dich abzuschirmen. Attacken wie Käfergebrumm, die alles in einem großen Umkreis treffen, könnten so z.B. kaum abgewehrt werden. So eine Attacke abzufangen, kostet nicht die Reaktion des Pokemon, aber es nimmt dabei den vollen Schaden der Attacke!'
            },
            {
                id: 'gelaendeexperte',
                name: 'Geländeexperte',
                beschreibung: 'Wähle eines aus Stadt, Wald, Wüste, Höhle, Meer, Wiese, Tundra. In dem von dir gewählten Gebiet fühlst du dich besonders wohl und bist besonders geschickt, sodass du hier 2 automatische Erfolge auf PA-Proben bekommst. Kann nur einmal gewählt werden, nicht für mehrere Geländetypen.',
                requiresChoice: true,
                choices: ['Stadt', 'Wald', 'Wüste', 'Höhle', 'Meer', 'Wiese', 'Tundra']
            },
            {
                id: 'geteiltes-leid',
                name: 'Geteiltes Leid',
                beschreibung: 'Speziell deine Psycho-Pokemon können, solange sie bei Bewusstsein und in deiner Nähe sind, Wunden, die du nehmen würdest, in dem Moment, wo sie zugefügt werden, auf sich selbst übertragen. Du nimmst trotzdem den KP-Schaden und fühlst die Schmerzen der Wunden, aber dein Körper wird wie durch ein Wunder vor schwererem Schaden bewahrt. Dieser wird aber dem Pokemon exakt so zugefügt, wie du ihn bekommen hättest (z.B. durch Verbrennungen oder Knochenbrüche).'
            },
            {
                id: 'glueck-im-unglueck',
                name: 'Glück im Unglück',
                beschreibung: 'Du bist immun gegen Zusatzeffekte von Attacken, die bei 3 oder mehr Erfolgen triggern würden (sowas wie Vergiftung von Giftstachel oder Paralyse von Bodyslam).'
            },
            {
                id: 'gut-ausgeruht',
                name: 'Gut ausgeruht',
                beschreibung: 'Nach einer vollen Nacht Schlaf kannst du, je nach Dauer und Qualität, bis zu 25% deiner max KP (aufgerundet) als zusätzliche temporäre KP generieren, wie einen Schild. Diese gehen verloren, wenn du dich zu sehr anstrengst oder müde wirst!'
            },
            {
                id: 'gut-geerdet',
                name: 'Gut geerdet',
                beschreibung: 'Solange du mit wenigstens einer Fußsohle Bodenkontakt hast, nimmst du nur halben Schaden von Elektro- und auf Elektrizität basierenden Attacken und kannst nicht von solchen paralysiert werden.'
            },
            {
                id: 'gute-einschaetzung',
                name: 'Gute Einschätzung',
                beschreibung: 'Du kannst jederzeit erfragen, ungefähr wie viel Prozent seiner maximalen KP ein Pokemon aktuell hat. Der Spielleiter wird dir das mit +/- 10% seiner max KP sagen.'
            },
            {
                id: 'hitzeschutz',
                name: 'Hitzeschutz',
                beschreibung: 'Du bist sehr schwer (aber nicht unmöglich!) zu verbrennen. Zusatzeffekte, die Verbrennung auslösen (etwa durch Flammenwurf) funktionieren gegen dich nicht, Attacken wie Irrlicht, deren ganzer Effekt es ist, dich zu verbrennen, allerdings schon. Außerdem nimmst du nur halben Schaden von Feuer-Attacken und solchen, die auf Hitze basieren.'
            },
            {
                id: 'kaeltefest',
                name: 'Kältefest',
                beschreibung: 'Du bist sehr schwer (aber nicht unmöglich!) einzufrieren. Zusatzeffekte, die Einfrieren auslösen (etwa durch Eisstrahl) funktionieren gegen dich nur, wenn sie von sehr viel stärkeren Pokemon eingesetzt werden. Selbst wenn du eingefroren bist, kannst du jede Runde eine Probe auf Stärke & Konstitution ablegen, um aus dem Eis auszubrechen. Außerdem nimmst du nur halben Schaden von Eis-Attacken und solchen, die auf Kälte basieren.'
            },
            {
                id: 'kampf-kommandant',
                name: 'Kampf-Kommandant',
                beschreibung: 'Immer, wenn du direkt von einer gegnerischen Attacke getroffen und nicht besiegt wirst, kannst du sofort einem verbündeten Pokemon ein Kommando als zusätzliche Aktion geben.'
            },
            {
                id: 'kampfrausch',
                name: 'Kampfrausch',
                beschreibung: 'Immer, wenn du Schaden durch eine Attacke nimmst, erhältst du sofort eine zusätzliche Aktion, die du aber für eine Attacke nutzen musst.'
            },
            {
                id: 'karma',
                name: 'Karma',
                beschreibung: 'Immer, wenn du von einem Volltreffer getroffen wirst, erhalten bis zum Ende deines nächsten Zugs alle deine Proben +2 Erfolge.'
            },
            {
                id: 'kuehler-kopf',
                name: 'Kühler Kopf',
                beschreibung: 'Du bist immun gegen Status-Attacken, die deine Entscheidungen beeinflussen, dich verängstigen oder anderweitig auf deine Gedanken einwirken würden (z.B. Taunt, Torment, aber auch Glare).'
            },
            {
                id: 'letztes-aufbaeumen',
                name: 'Letztes Aufbäumen',
                beschreibung: 'Wenn du KO gehst, kannst du sofort eine zusätzliche Aktion ausführen, bevor du zu Boden gehst.'
            },
            {
                id: 'meds-liebhaber',
                name: 'Meds-Liebhaber',
                beschreibung: 'Heilgegenstände wirken bei dir besonders gut. Du erhältst die doppelte Menge KP von Tränken, Beeren, Heilkräutern usw.'
            },
            {
                id: 'meister-faenger',
                name: 'Meister-Fänger',
                beschreibung: 'Du kannst sofort, wenn du erfolgreich einer Attacke ausgewichen bist, als freie Zusatzaktion einen Pokeball auf den Angreifer werfen.'
            },
            {
                id: 'nachhall',
                name: 'Nachhall',
                beschreibung: 'Deine Kommandos betreffen ein Pokemon für zwei Runden statt eine.'
            },
            {
                id: 'narbengewebe',
                name: 'Narbengewebe',
                beschreibung: 'Immer, wenn du eine Wunde heilst, erhöhen sich deine maximalen KP dauerhaft um 1. Sie können so maximal um ihren Wert ohne diesen Bonus erhöht (also verdoppelt) werden.'
            },
            {
                id: 'narrenfreiheit',
                name: 'Narrenfreiheit',
                beschreibung: 'Die erste Wunde, die du in jedem Kampf nehmen würdest, wird negiert. Dafür wird die zweite Wunde, falls es dazu kommt, doppelt zugefügt.'
            },
            {
                id: 'nie-wieder',
                name: 'Nie wieder!',
                beschreibung: 'Führe eine Liste über alle Pokemon, die dich schon einmal in einem echten Kampf ausgeknockt haben. Du würfelst alle GENA- und PA-Proben gegen diese Pokemon mit der doppelten Anzahl Würfel und kannst versuchen, ihren Attacken auszuweichen, ohne dass es deine Reaktion kostet.'
            },
            {
                id: 'notoperation',
                name: 'Notoperation',
                beschreibung: 'Wenn du in einem Pokemon-Center geheilt wirst, regenerierst du pro Nacht bis zu 4 Wunden statt 3.'
            },
            {
                id: 'notreflex',
                name: 'Notreflex',
                beschreibung: 'Wenn eine Attacke sehr offensichtlich stark genug wäre, dich umzuhauen und auszuknocken, kannst du einmal pro Tag der Attacke automatisch ausweichen. Der Spielleiter würfelt dann den Schaden aus; hätte der NICHT gereicht, um dich umzuhauen, weichst du der Attacke zwar trotzdem aus, reißt dir dabei aber was und nimmst eine Wunde! Achtung: Dieses „automatische Ausweichen" funktioniert nur bei Attacken, denen du auch physisch realistisch ausweichen kannst. Wenn du etwa festgehalten wirst, im freien Fall bist, oder die Attacke ein riesiges Gebiet trifft, in dem du mitten drin bist, funktioniert das z.B. nicht!'
            },
            {
                id: 'opportunist',
                name: 'Opportunist',
                beschreibung: 'Immer, wenn ein gegnerisches Pokemon schwer patzt (-2 Erfolge oder weniger), kannst du sofort eine zusätzliche Aktion durchführen.'
            },
            {
                id: 'perfektes-timing',
                name: 'Perfektes Timing',
                beschreibung: 'Zu Beginn jedes Kampfes, wenn die Initiative-Werte erwürfelt wurden, kannst du eine vollständige Liste der exakten Kampfreihenfolge erfragen und dann den Initiative-Wert eines Kampfteilnehmers um sein Level erhöhen oder verringern.'
            },
            {
                id: 'pitcher',
                name: 'Pitcher',
                beschreibung: 'Du kannst PA-Proben gegen Fernkampfattacken statt mit PA-Ausweichen auch mit PA+KÖ+Werfen würfeln. In dem Fall musst du aber einen Gegenstand in den Weg der Attacke werfen, um sie „abzufangen". Der Gegenstand geht dabei wahrscheinlich kaputt. Gegenstände müssen eine gewisse Mindestgröße haben und sich zum Werfen eignen! Sowas wie Tränke oder (nicht verkleinerte) Pokebälle funktioniert wunderbar gegen Attacken wie Glut, aber nicht mehr gegen Steinwurf. Manche Attacken wie Steinhagel oder Käfergebrumm sind so nicht abzublocken.'
            },
            {
                id: 'ruecksichtslos',
                name: 'Rücksichtslos',
                beschreibung: 'Du kannst im Kampf während deines Zugs deine Reaktion nutzen, um eine zusätzliche Attacke auszuführen.'
            },
            {
                id: 'schmerztoleranz',
                name: 'Schmerztoleranz',
                beschreibung: 'Du nimmst keine Wunden dadurch, unter 50% deiner maximalen KP zu fallen, aber zwei Wunden dadurch, zum ersten Mal in einem Kampf auf 0 KP zu fallen.'
            },
            {
                id: 'schutzengel',
                name: 'Schutzengel',
                beschreibung: 'Einmal pro Tag, wenn du 3 oder mehr Wunden auf einmal nehmen würdest, kannst du diese Wunden wie durch ein Wunder komplett negieren. Deine KP sinken trotzdem und du wirst bewusstlos. Wichtig: Dein Charakter versteht dieses Konzept nicht! Nur weil du einen "aktiven Schutzengel" hast, solltest du dich nicht super furchtlos spielen! Nach Ermessen des Spielleiters kann „Meta-Gaming" auch bestraft werden, indem der Schutzengel nicht funktioniert!'
            },
            {
                id: 'sechster-sinn',
                name: 'Sechster Sinn',
                beschreibung: 'Du siehst Gefahr instinktiv kommen. Wenn du von einer Attacke getroffen würdest, bevor du in der Runde selbst dran warst, erhält deine PA-Probe einen zusätzlichen Erfolg.'
            },
            {
                id: 'sparring',
                name: 'Sparring',
                beschreibung: 'Du kannst anstatt Ausweichen auch deinen Kampfsport-Wert für PA-Proben verwenden (PA + Kampfsport statt PA + Ausweichen). In dem Fall weichst du nicht aus, sondern parierst tatsächlich mit deinem Körper die eingehenden Angriffe und lässt sie von dir abprallen. Funktioniert nur bei physischen Angriffen!'
            },
            {
                id: 'stabil',
                name: 'Stabil',
                beschreibung: 'Du bist sehr schwer (aber nicht unmöglich!) umzuwerfen oder zu bewegen. Attacken wie Wirbelwind sind bei dir stark erschwert und sowas wie Fegekick kann dir zwar schaden, aber dich nicht umhauen.'
            },
            {
                id: 'starker-auftritt',
                name: 'Starker Auftritt',
                beschreibung: 'Immer, wenn du ein Pokemon rausholst, legt es einen besonders beeindruckenden Auftritt hin, sodass bis nach seinem ersten Zug alle seine Proben mit der doppelten Anzahl Würfel gewürfelt werden.'
            },
            {
                id: 'starker-lebenswille',
                name: 'Starker Lebenswille',
                beschreibung: 'Du kannst unter normalen Umständen nicht mehr als zwei Wunden auf einmal nehmen. Achtung: Das kann ausdrücklich von Pokemon mit sehr viel höherem Level (+20 und mehr) umgangen werden! Ein Lv-80-Dragoran-Hyperstrahl kann dich trotzdem mit 5+ Wunden schwer verletzen!'
            },
            {
                id: 'starkes-immunsystem',
                name: 'Starkes Immunsystem',
                beschreibung: 'Vergiftungen enden bei dir immer spätestens nach 2 Runden.'
            },
            {
                id: 'tief-durchatmen',
                name: 'Tief durchatmen',
                beschreibung: 'Du kannst einmal pro Tag deine KP als Reaktion um 50% ihres Maximums heilen, indem du einen tiefen Atemzug nimmst.'
            },
            {
                id: 'typ-veteran',
                name: 'Typ-Veteran',
                beschreibung: 'Wähle einen Typ. Du hast im Laufe deines Lebens so viel Zeit mit Pokemon dieses Typs verbracht, dass du ihre Angriffsmuster antizipieren kannst. Du erhältst einen zusätzlichen Erfolg auf alle PA-Proben gegen Pokemon dieses Typs und gegen Attacken dieses Typs.',
                requiresChoice: true,
                choices: ['Normal', 'Feuer', 'Wasser', 'Elektro', 'Pflanze', 'Eis', 'Kampf', 'Gift', 'Boden', 'Flug', 'Psycho', 'Käfer', 'Gestein', 'Geist', 'Drache', 'Unlicht', 'Stahl', 'Fee']
            },
            {
                id: 'unauffaellig',
                name: 'Unauffällig',
                beschreibung: 'Du hast gelernt, dich in Gefahrsituationen unauffällig zu verhalten. Du fällst Pokemon einfach nicht ins Auge und wirst niemals als Ziel gewählt werden, solange nicht mindestens eines der folgenden gilt: Ein Trainer gibt seinem Pokemon das explizite Kommando, dich anzugreifen; Du machst auf dich aufmerksam, etwa, indem du direkt auf ein Pokemon zugehst; Es gibt keine anderen Kampfteilnehmer auf deiner Seite, die statt deiner angegriffen werden könnten. Insgesamt gilt: Du bist weder unsichtbar noch hält irgendetwas Pokemon davon ab, dich anzugreifen; sie würden nur buchstäblich jeden anderen vor dir angreifen.'
            },
            {
                id: 'unbeugsamer-wille',
                name: 'Unbeugsamer Wille',
                beschreibung: 'Du gehst selbst bei 0 KP niemals KO, aber alle Wunden, die du nimmst, solange deine KP unter der Hälfte sind, werden verdoppelt.'
            },
            {
                id: 'verbissener-kaempfer',
                name: 'Verbissener Kämpfer',
                beschreibung: 'Für jede Wunde, die du hast, würfelst du einen zusätzlichen Würfel auf GENA-Proben und nimmst -2 Schaden von Attacken (auf ein Minimum von 1).'
            },
            {
                id: 'verteidigungsformation',
                name: 'Verteidigungsformation',
                beschreibung: 'Solange du mindestens 2 verbündete Ziele in deiner direkten Nähe (Armweite) hast, nimmst du 25% weniger Schaden von eingehenden Attacken (aufgerundet).'
            },
            {
                id: 'verzweiflungsakt',
                name: 'Verzweiflungsakt',
                beschreibung: 'Solange du 8 oder mehr Wunden hast, kannst du nicht mehr bewusstlos werden und erhältst im Kampf +5 Würfel auf alle deine Proben.'
            },
            {
                id: 'vorbereitung-ist-alles',
                name: 'Vorbereitung ist alles',
                beschreibung: 'In der ersten Runde eines Kampfes haben du und dein Pokemon einen automatischen Erfolg auf alle Proben, die sie während ihres Zugs (nicht während Reaktionen!) durchführen.'
            },
            {
                id: 'zaeh',
                name: 'Zäh',
                beschreibung: 'Du kannst unter normalen Umständen nicht mehr als drei Viertel deiner KP auf einmal verlieren, sodass du effektiv nicht von vollen KP durch einen Treffer KO gehen kannst. Achtung: Das kann ausdrücklich von Pokemon mit sehr viel höherem Level (+20 und mehr) umgangen werden! Einen Lv-80-Dragoran-Hyperstrahl steckst du nicht so einfach ein!'
            }
        ];
    }
};