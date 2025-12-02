// nachteilService.js
const nachteilService = {
    getAllNachteile: function() {
        return [
            {
                id: 'absolut ehrlich',
                name: 'Absolut Ehrlich',
                beschreibung: 'Du kannst niemals lügen, egal, was passiert. Es ist dir physisch unmöglich.'
            },
            {
                id: 'alpträume',
                name: 'Alpträume',
                beschreibung: 'Du wirst nachts ständig von Alpträumen geplagt. Egal, wie lange du schläfst, du regenerierst dabei maximal 50% deiner maximalen KP (statt alle).'
            },
            {
                id: 'angst-vor-pokemon',
                name: 'Angst vor Pokemon',
                beschreibung: 'Du hast panische Angst vor Pokemon, die irgendwie gefährlich wirken, zu dem Punkt, dass du selbst nie sowas wie ein Ursaring besitzen könntest und niemals im selben Zelt wie ein Nidoking schlafen würdest. Deine eigenen Pokemon sind dabei explizit nicht ausgenommen, pass also genau auf, was du fängst...'
            },
            {
                id: 'arm',
                name: 'Arm',
                beschreibung: 'Du besitzt nicht viel. Wähle KEINE Gegenstände aus der Item-Auswahl.'
            },
            {
                id: 'aversion',
                name: 'Aversion gegen Typen',
                beschreibung: 'Du kannst drei bestimmte Typen und ihre Vertreter einfach absolut nicht leiden. Deine Typ-Meisterschaft für diese Typen kann niemals steigen, du kannst niemals Pokemon dieser Typen besitzen oder kontrollieren und alle Proben, die mit einem der Typen zu tun haben (inklusive GENA-Proben gegen Pokemon des Typs) sind um eine Stufe erschwert. Sollte eines deiner Pokemon sich zu einem Pokemon mit einem der Typen entwickeln (Beispiel: Riolu zu Lucario, wenn du Stahl nicht leiden kannst), wirst du dein eigenes Pokemon automatisch nicht mehr mögen und musst es loswerden. Es ist gut möglich, aber nicht notwendig, dass du Angst vor Pokemon mit dem Typ hast.'
            },
            {
                id: 'entwicklungsgegner',
                name: 'Entwicklungsgegner',
                beschreibung: 'Du kannst es nicht ertragen, wenn deine Pokemon sich verändern. Du wirst nach Möglichkeit versuchen, Entwicklungen zu verhindern (z.B. indem du niemals Entwicklungs-Items für sie besorgst, sie absichtlich auf einem niedrigen Level lässt oder - besonders grausam - sie schlecht behandelst, bevor eine Freundschafts-Entwicklung einsetzen kann). Wenn du es nicht schaffst, eine Entwicklung zu verhindern, wirst du ein nervliches Wrack, bis du das nächste Mal eine Nacht durchschläfst. Du betrachtest das Pokemon als neue Person und assoziierst es nicht mehr mit dem, was es einmal war.'
            },
            {
                id: 'gejagt',
                name: 'Gejagt',
                beschreibung: 'Du hast irgendjemanden in deinem Leben richtig wütend gemacht oder anderweitig seine Aufmerksamkeit in der schlechtestmöglichen Weise auf dich gezogen. Diese Person oder Organisation (die du dir im Rahmen deiner Backstory ausdenkst) wird euch, aber dich im Besonderen, verfolgen und euch immer wieder begegnen. Sie ist explizit extrem gefährlich, mit Pokemon, die ihr im direkten Kampf kaum besiegen könnt, und stellt eine lebensbedrohliche Gefahr für dich und jeden, der dazwischenspringt, dar!'
            },
            {
                id: 'geraeuschempfindlich',
                name: 'Geräuschempfindlich',
                beschreibung: 'Deine Ohren sind extrem gut, aber auch extrem empfindlich. Du erhältst einen zusätzlichen Erfolg auf alle Horchen-Proben, aber laute Geräusche fügen dir physische Schmerzen zu und kosten dich je nach Lautstärke und Intensität bis zu 6W6 KP. Dadurch erzeugte Wunden können dich vorübergehend taub machen.'
            },
            {
                id: 'glasknochen',
                name: 'Glasknochen',
                beschreibung: 'Dein Körper ist extrem labil. Immer, wenn du Schaden nimmst, der eigentlich keine Wunde verursachen würde, musst du entweder auf KÖ oder GL würfeln (deine Wahl). Erzielst du nicht mindestens einen Erfolg, erleidest du eine Wunde. Solange du bewusstlos bist, entfällt die Probe und du nimmst immer eine Wunde.'
            },
            {
                id: 'halluzinationen',
                name: 'Halluzinationen',
                beschreibung: 'Du siehst, hörst und … erlebst manchmal Dinge, die nur du so wahrnimmst. Der Spielleiter wird dir wie selbstverständlich falsche Informationen geben und dich nicht vorwarnen, ob und seit wann du Dinge falsch wahrnimmst.'
            },
            {
                id: 'heuschnupfen',
                name: 'Heuschnupfen',
                beschreibung: 'Du leidest an ganz fürchterlichem Heuschnupfen und Allergien gegen so ziemlich jede Pflanze überhaupt. Dich in Gebieten mit vielen Pflanzen, vor allem Blumen, oder in der Nähe von Pflanzen-Pokemon aufzuhalten, erzeugt ein ständiges Niesen und Jucken bei dir, was alle deine Proben um eine Stufe erhöht. Proben auf Umgang mit Pflanzen-Pokemon sind für dich um 4 Stufen erschwert.'
            },
            {
                id: 'hypochonder',
                name: 'Hypochonder',
                beschreibung: 'Du bist überzeugt davon, ständig krank zu sein und gehst immer direkt vom Schlimmsten aus. Du kannst es absolut nicht ertragen, zu frieren, nasse Haare zu haben oder anderweitig vermeintlich empfindlich für Erkältungen und Krankheiten zu sein. Du musst zu Beginn jedes Tages eine Widerstand-Probe ablegen. Schaffst du diese nicht, glaubst du den ganzen Tag, an einem schlimmen Infekt zu leiden und alle deine Proben sind um eine Stufe erschwert.'
            },
            {
                id: 'impulsiv',
                name: 'Impulsiv',
                beschreibung: 'Du bist ein großer Fan vorschneller Entscheidungen. Wenn du zu lange überlegst (z.B., was dein Pokemon tun soll), kann der Spielleiter dir irgendwann nach eigenem Ermessen diktieren, was du tun musst - selbst, wenn das eine sehr dumme Aktion sein sollte.'
            },
            {
                id: 'lampenfieber',
                name: 'Lampenfieber',
                beschreibung: 'Du kannst einfach nicht mit dem Druck eines Publikums umgehen. Proben auf Anführen, Auftreten und Schauspielern sind für dich nicht möglich; sie enden immer automatisch in einem einfachen Patzer. Wenn du ein Publikum hast (z.B. auf einer Bühne, in einem Arenakampf etc.) musst du jede Runde eine Ch-Probe bestehen, um überhaupt agieren zu können. Misslingt die Probe in einer Kampf-Situation, wird deine Runde übersprungen und dein Pokemon handelt autonom.'
            },
            {
                id: 'langschlaefer',
                name: 'Langschläfer',
                beschreibung: '(Kann nicht mit Frühaufsteher kombiniert werden) Du brauchst ganz besonders viel Schlaf. Wenn man dich nicht mindestens 12 Stunden am Stück schlafen lässt, bist du zu nichts zu gebrauchen; ständig im Halbschlaf, mies gelaunt, die KP nur teilweise geheilt usw. Solange du müde bist, haben alle Proben für dich eine nach Ermessen des Spielleiters erhöhte Schwierigkeit.'
            },
            {
                id: 'nachtblindheit',
                name: 'Nachtblindheit',
                beschreibung: '(Kann nicht mit Nachtsicht kombiniert werden) Du kannst in relativer Dunkelheit überhaupt nichts mehr wahrnehmen. Wenn du nur Mond und Sterne oder unter einer Tür hindurchfallendes Licht oder dergleichen zur Verfügung hast, bist du effektiv blind.'
            },
            {
                id: 'pazifist',
                name: 'Pazifist',
                beschreibung: 'Du hasst es, anderen Schaden zuzufügen, und würdest das (im Normalfall) niemals tun. Du kannst deinen Pokemon den Einsatz offensiver Attacken (auch solche, die keinen direkten Schaden zufüügen, etwa Giftpuder oder Irrlicht) nur befehlen, wenn das Ziel dich aktiv bedroht oder du bereits Schaden durch es genommen hast. Wenn du oder eines deiner Pokemon jemandem Schaden zufügt, musst du eine Widerstand-Probe bestehen oder verfällst in Schockstarre. Natürlich ist es dir auch zuwider, wenn deine Verbündeten andere angreifen; Notwehr ist aber okay.'
            },
            {
                id: 'pechvbogel',
                name: 'Pechvogel',
                beschreibung: 'Wenn du bei einer Probe patzt, zählt der Patzer als eine Stufe schlimmer (z.B. eine Eins → 2 Einsen).'
            },
            {
                id: 'phobie',
                name: 'Phobie',
                beschreibung: 'Wähle eine sehr gewöhnliche Phobie (Höhe, Feuer, Dunkelheit...). Du hast diese Phobie in einem extremen Ausmaß und kannst Proben nicht einmal versuchen, solange du mit der Phobie konfrontiert bist.'
            },
            {
                id: 'pokeball-hater',
                name: 'Pokeball-Hater',
                beschreibung: 'Du glaubst nicht an Pokebälle. Zwar fängst du deine Pokemon ganz normal in ihnen und besitzt sie, aber du würdest sie niemals in ihre Pokebälle sperren. Tatsächlich geht das so weit, dass du deine Pokebälle absichtlich beschädigt hast, sodass du deine Pokemon nicht in sie zurückrufen kannst. Wenn du große Pokemon besitzt, wird ihre Unterkunft ein Problem, wenn deine Pokemon KO sind, müssen sie irgendwie transportiert werden und du kannst Pokebälle nicht nutzen, um deine Pokemon z.B. aus brenzligen Situationen zu retten.'
            },
            {
                id: 'schlafwandler',
                name: 'Schlafwandler',
                beschreibung: 'Für dich besteht jede Nacht eine vom Spielleiter ausgewürfelte Chance, im Schlaf umherzuwandern. Die Chance wird größer je ausgeruhter du bist und kleiner je verletzter du bist. Wenn du im Schlaf unterwegs bist, bestimmt der Spielleiter, wohin du gehst und was du tust. Du selbst hast keinerlei Einfluss und keine Ahnung von diesem Zustand.'
            },
            {
                id: 'schuechtern',
                name: 'Schüchtern',
                beschreibung: 'Du kannst absolut nicht mit Menschen umgehen. Solange du mehr als eine Person in der Nähe hast, die du nicht bereits gut kennst, bist du ein nervliches Wrack. Außerdem sind alle Proben auf folgende Fertigkeiten für dich um 2 Stufen erschwert: Anführen, Betören, Einschüchtern, Lügen, Schauspielern, Überreden, Überzeugen'
            },
            {
                id: 'stur',
                name: 'Stur',
                beschreibung: 'Du kannst es einfach nicht akzeptieren, etwas nicht zu schaffen. Wenn du eine Probe nicht schaffst, aber auch nicht patzt, musst du sie solange weiter versuchen, bis du sie schaffst oder dabei patzt (allerdings wird die Probe weiterhin bei jedem Versuch schwerer).'
            },
            {
                id: 'tollpatschig',
                name: 'Tollpatschig',
                beschreibung: 'Du bist von Natur aus einfach ungeschickt. Proben auf folgendes sind für dich um X Stufen erschwert: Akrobatik (3), Angeln (1), Handwerk (2), Klettern (2), Reiten (1), Schleichen/Verstecken (3), Schließtechnik (2), Springen (2), Stehlen (3), Tanzen (3), Werfen (2), Computernutzung (1), Erste Hilfe (2), Fahrzeuge lenken (1), Reparieren (1), Wildnisleben/Survival (1), Beeindrucken (2), Musizieren (1), PA-Proben (1).'
            },
            {
                id: 'unselbststaendig',
                name: 'Unselbstständig',
                beschreibung: 'Du kommst alleine einfach nicht klar. Solange du nicht jemanden bei dir hast, der dir sagt, was du tun sollst, oder dir zumindest aktiv moralischen Support gibt, kannst du aktiv keine Proben versuchen.'
            },
            {
                id: 'unterdrückte persönlichkeit',
                name: 'Unterdrückte Persönlichkeit',
                beschreibung: 'Tief in deinem Unterbewusstsein lebt ein zweites Du, das in jeder Hinsicht dein Gegenteil ist. Bist du vorsichtig, ist es risikofreudig. Bist du freundlich, ist es ein Arschloch. Und so weiter. Immer, wenn deine KP unter die Hälfte ihres Maximums fallen, kommt deine andere Persönlichkeit zum Vorschein und bleibt solange aktiv, bis du über 50% deiner max KP geheilt bist und dich nicht in einer Stresssituation (etwa im Kampf) befindest. Beide Persönlichkeiten haben VERSCHIEDENE GEDÄCHTNISSE und wissen beide nicht, wie man den Persönlichkeitswechsel triggern kann.'
            },
            {
                id: 'verflucht',
                name: 'Verflucht',
                beschreibung: 'Ein Geist-Pokemon hat dir in jungen Jahren einen üblen Fluch verpasst. Deine Glücks-Tokens regenerieren sich niemals.'
            },
            {
                id: 'vorlaut',
                name: 'Vorlaut',
                beschreibung: 'Du bist nicht nur frech, du neigst auch dazu, vertrauliche Dinge einfach auszuplaudern. Du musst Geheimnisse und wichtige Informationen, die du erfährst, zwanghaft mit anderen teilen. Das betrifft ausdrücklich auch deine eigenen Geheimnisse, von Peinlichkeiten bis hin zu wenn du etwas Illegales getan hast! Du kannst trotzdem lügen - aber im Nachhinein wirst du dich später ganz offen damit rühmen, oh so clever gelogen zu haben.'
            },
            {
                id: 'vorsichtig',
                name: 'Vorsichtig',
                beschreibung: 'Du bist übervorsichtig. Wenn eine Probe nicht auf Anhieb klappt, kannst du sie nicht forcieren.'
            },
            {
                id: 'zerstreut',
                name: 'Zerstreut',
                beschreibung: 'Du würdest deinen eigenen Kopf vergessen, wenn er nicht angewachsen wäre. Immer, wenn du einen Ort verlässt, an dem du dich länger als eine Stunde aufgehalten hast (dein Zimmer, ein Lager im Wald usw.), musst du eine WI-Probe bestehen oder lässt nach Ermessen des Spielleiters Gegenstände zurück. Das können unter anderem auch Pokebälle oder sogar (schlafende) Pokemon sein. Im Nachhinein vergessene Gegenstände wiederzufinden, kann nach Ermessen des Spielleiters eine Suchen-Probe erfordern oder sogar einfach unmöglich sein.'
            }
        ];
    }
};
