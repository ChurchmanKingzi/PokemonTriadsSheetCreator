// vorteilService.js
const vorteilService = {
    getAllVorteile: function() {
        return [
            {
                id: 'adrenalinschub',
                name: 'Adrenalinschub',
                beschreibung: 'Du arbeitest am besten unter Druck. Immer, wenn du dich in einer Extremsituation befindest (wenn deine KP unter 25% fallen, du in einer scheinbar ausweglosen Situation bist oder ein Gruppenmitglied (ein Mensch) bewusstlos wird oder stirbt), wird dein Geist klarer und du erhältst vorübergehend einen zusätzlichen Erfolg auf alle Proben, die du machst. Im Kampf kannst du in diesem Zustand deine Aktion nutzen, um dein Pokemon anzufeuern, wodurch es einen zusätzlichen Erfolg bei seiner nächsten GENA-Probe bekommt. Du kannst diesen Zustand NICHT absichtlich herbeiführen, indem du z.B. deinen eigenen Kameraden ausknockst. Er passiert nur in wirklich stressigen Notsituationen. Wenn das Adrenalin abklingt, wirst du für eine Stunde extrem erschöpft und wobbelig auf den Beinen.'
            },
            {
                id: 'analyst',
                name: 'Analyst',
                beschreibung: 'Wenn du das erste Mal gegen ein Pokemon einer Spezies kämpfst, analysierst du es sehr genau. Der Kampf muss mindestens 2 volle Runden dauern, du musst ihn durchgehend sehen können und dein Pokemon muss aktiv daran beteiligt sein, damit deine Analyse erfolgreich ist. Nach erfolgreicher Analyse kannst du zukünftig besser gegen Pokemon dieser Spezies kämpfen. Alle GENA- und PA-Proben von dir oder deinen Pokemon gegen Pokemon der Spezies erhalten 3 zusätzliche Würfel. Du kannst theoretisch unendlich viele Pokemon analysiert haben (musst dir aber natürlich irgendwo notieren, welche du kennst).'
            },
            {
                id: 'besonders-gluecklich',
                name: 'Besonders Glücklich',
                beschreibung: 'Wenn du eine Probe mit einem Glücks-Token wiederholst: Du erhältst +2 Erfolge.'
            },
            {
                id: 'coach',
                name: 'Coach',
                beschreibung: 'Wenn eines deiner Pokemon eine Attacke beherrscht, die eines deiner anderen Pokemon lernen kann, kannst du beide für 1W6 Tage coachen, wodurch das zweite Pokemon die Attacke lernt. Das kannst du auch mit Pokemon von anderen machen, die sie dir anvertrauen, und du kannst mehreren Pokemon gleichzeitig eine Attacke beibringen, aber nie zwei verschiedene Attacken gleichzeitig lehren.'
            },
            {
                id: 'connections-zu-kurt',
                name: 'Connections zu Kurt',
                beschreibung: 'Du kennst Kurt, den Pokeball-Bauer, persönlich und hast enge Beziehungen zu ihm; vielleicht freundschaftlich, vielleicht schuldet er dir einfach was. In jedem Fall kannst du ihn einmal pro Woche anrufen und er wird dir einen seiner handgefertigten Pokebälle schicken. Du kannst auf Überreden oder Überzeugen würfeln, um dir einen auszusuchen, sonst ist es ein zufälliger von folgenden Optionen: KÖDERBALL (+2 automatische Erfolge bei Fangen-Proben gegen geangelte Pokemon), MONDBALL (+3 Würfel für Fangen-Proben bei Nacht), FREUNDESBALL (macht Pokemon, die er fängt, sofort zutraulich und gibt +1W6 Freundschaft), SYMPABALL (+3 Würfel für Fangen-Proben, wenn dein aktives Pokemon ein anderes Geschlecht hat als das zu fangende), LEVELBALL (+1 automatischer Erfolg für Fangen-Proben pro 10 volle Level, die dein aktives Pokemon höher ist als das Ziel), SCHWERBALL (+1 automatischer Erfolg pro 150 Kilo, die das Pokemon wiegt, max 3), TURBOBALL (+1 automatischer Erfolg pro 10 volle INIT-Base-Stat-Punkte, die das Ziel über 100 hat (max 3).)'
            },
            {
                id: 'critical_capture',
                name: 'Critical Capture',
                beschreibung: 'Fangen-Proben sind für dich um eine Stufe erleichtert. Wenn du ein Pokemon fängst, erhält es pro Erfolg bei seiner Fangen-Probe entweder +1 Freundschaft oder +1 Level (deine Wahl, beliebige Kombinationen möglich). Ist die Fangen-Probe ein kritischer Erfolg (4+ Erfolge), erhält das Pokemon außerdem +1 GENA und +1 PA.'
            },
            {
                id: 'critter',
                name: 'Critter',
                beschreibung: 'Deine Pokemon landen kritische Treffer schon mit 3 Erfolgen statt mit 4 auf ihre GENA-Würfe.'
            },
            {
                id: 'dirigent',
                name: 'Dirigent',
                beschreibung: 'Du kannst deine Pokemon dirigieren wie ein Schachspieler seine Figuren. Du kannst im Kampf deine Aktion nutzen, um ein verbündetes Pokemon (muss nicht dir gehören!) sofort eine zusätzliche Bewegung ausführen zu lassen und ihm nächste Runde eine zusätzliche Reaktion zu ermöglichen.'
            },
            {
                id: 'doppelte-klasse',
                name: 'Doppelte Klasse',
                beschreibung: 'Wähle eine zweite Trainer-Klasse.'
            },
            {
                id: 'eiserner-wille',
                name: 'Eiserner Wille',
                beschreibung: 'Du bist komplett immun gegen alle Versuche, dich zu manipulieren oder gehirnzuwaschen. Das gilt für Psycho-Kräfte, aber auch für Betören und ähnliche Fertigkeiten. Du merkst es sofort, wenn ein solcher Versuch gegen dich unternommen wird.'
            },
            {
                id: 'fantastische-eignung',
                name: 'Fantastische Eignung',
                beschreibung: 'Du erhältst +1 Punkt für Grundwerte und +12 Punkte für Fertigkeiten zu verteilen.'
            },
            {
                id: 'fruehaufsteher',
                name: 'Frühaufsteher',
                beschreibung: 'Du brauchst weniger Schlaf als andere. Du regenerierst deine KP bereits, wenn du nur 4 Stunden schläfst statt 8 und hast einen extrem leichten Schlaf, sodass du bei Gefahr leicht aufwachen kannst. Im Zweifel ist eine Probe auf Gefahreninstinkt nötig.'
            },
            {
                id: 'glueckspilz',
                name: 'Glückspilz',
                beschreibung: 'Du erhältst +5 maximale Glücks-Tokens.'
            },
            {
                id: 'guter_ruf',
                name: 'Guter Ruf',
                beschreibung: 'Du hast dir bereits einen guten Ruf aufgebaut, z.B. durch eine Heldentat oder bemerkenswerte Leistungen. Wer schon von dir gehört hat, hängt von der Art deiner Tat oder Leistung ab. Wer deinen Namen kennt, wird dir mit größerer Wahrscheinlichkeit positiv gesinnt sein. Proben auf Anführen, Beeindrucken, Betören, Feilschen und Überreden sind bei solchen Personen um eine Stufe erleichtert. Es könnte dir, wenn du deine Karten richtig spielst, auch leicht möglich sein, Gefälligkeiten von solchen Zielen zu bekommen. Du kannst dir diesen Ruf während des Spiels ruinieren, indem du z.B. kriminelle Dinge tust oder dich feige verhältst.'
            },
            {
                id: 'heilende-hand',
                name: 'Heilende Hand',
                beschreibung: 'Deine Berührung ist so beruhigend und heilsam, dass du Pokemon (aber nicht Menschen!) schon durch eine einfache Berührung von allen negativen Statuseffekten heilen kannst.'
            },
            {
                id: 'heimliche-kommunikation',
                name: 'Heimliche Kommunikation',
                beschreibung: 'Du kannst Lippenlesen und fließend in Morsecode kommunizieren. Beides erfordert keine Proben.'
            },
            {
                id: 'hibbelig',
                name: 'Hibbelig',
                beschreibung: 'Du bist ständig sehr schnell und erratisch in Bewegung, sodass GENA-Proben, die dich zum Ziel haben, eine Stufe schwieriger sind als sie es sonst wären. Sogar Attacken, die normalerweise immer treffen würden, erfordern eine GENA-Probe gegen dich.'
            },
            {
                id: 'hilfreich',
                name: 'Hilfreich',
                beschreibung: 'Wenn du erfolgreich einem Verbündeten bei einer Probe hilfst, erhält dieser +2 Erfolge statt +1.'
            },
            {
                id: 'hungerkuenstler',
                name: 'Hungerkünstler',
                beschreibung: 'Du kommst bist zu 3 Tage ohne Nahrung aus, bevor du negative Effekte davonträgst, und bis zu 5, bevor du verhungerst.'
            },
            {
                id: 'immun',
                name: 'Immun',
                beschreibung: 'Du bist komplett immun gegen alle negativen Statuseffekte.'
            },
            {
                id: 'luegendetektor',
                name: 'Lügendetektor',
                beschreibung: 'Du erkennst intuitiv sofort, wenn jemand lügt. Du erkennst so nur direkte Lügen, nicht das Auslassen von Details, und du weißt zwar, welche Aussagen gelogen waren, aber nicht, wie die Wahrheit aussehen würde (wenn jemand dir z.B. einen falschen Namen nennt, weißt du zwar, dass er falsch ist, aber nicht, wie der wahre Name lautet).'
            },
            {
                id: 'medizinische-grundausbildung',
                name: 'Medizinische Grundausbildung',
                beschreibung: 'Mit entsprechendem Werkzeug(!) kannst du Erste Hilfe nutzen, um Wunden zu versorgen. Die Wunden sind dann zwar nicht einfach weg (der gebrochene Arm ist z.B. geschient, aber immer noch gebrochen), aber regeltechnisch bringen sie keine Wunde mehr ein. Normalerweise kann Erste Hilfe nur KP regenerieren und Bewusstlosigkeit aufheben, aber keine Wunden entfernen. Außerdem kannst du, wenn du Heilkräuter und ein Labor zur Verfügung hast, Tränke, Supertränke und andere Items herstellen.'
            },
            {
                id: 'nachtsicht',
                name: 'Nachtsicht',
                beschreibung: 'Du kannst, solange es ein Mindestmaß an Licht gibt (Mond, Sterne...) so gut sehen wie am helllichten Tag.'
            },
            {
                id: 'pokemon-freund',
                name: 'Pokemon-Freund',
                beschreibung: 'Wilde Pokemon betrachten dich von Natur aus als freundlich und werden dich (in der Regel) nie von sich aus angreifen. Sie werden sich aber natürlich verteidigen, wenn du sie (oder ein Pokemon in ihrer Nähe) angreifst. Wenn du zu grausam oder blutrünstig bist, verlierst du diesen Vorteil irgendwann.'
            },
            {
                id: 'pokemon-fluesterer',
                name: 'Pokemon-Flüsterer',
                beschreibung: 'Du kannst it deinen Pokemon auf einer tieferen Ebene connecten als andere Trainer. Proben auf Umgang mit Pokemon mit deinen Pokemon erhalten zwei zusätzliche Erfolge und deine Pokemon generieren immer doppelt so viel Freundschaft, wie sie es sonst täten.'
            },
            {
                id: 'psycho-sicht',
                name: 'Psycho-Sicht',
                beschreibung: 'Du kannst den Einsatz von Psycho-Kräften in Form eines lila Nebels sehen, der etwa 24 Stunden braucht, um sich komplett aufzulösen. So weißt du immer, ob und wo um dich herum Psycho-Tricks angewandt werden. Im Kampf erhältst du +4 Erfolge für das Ausweichen von Psycho-Attacken.'
            },
            {
                id: 'regenerativ',
                name: 'Regenerativ',
                beschreibung: 'Wenn du einen ganzen Tag keine Wunde nimmst: Du heilst eine Wunde. Oberflächliche Kratzer und Schrammen heilen bei dir so schnell, dass man buchstäblich dabei zusehen kann!'
            },
            {
                id: 'reich',
                name: 'Reich',
                beschreibung: 'Du erhältst drei zusätzliche Gegenstände in deinem Inventar.'
            },
            {
                id: 'schnelle-reflexe',
                name: 'Schnelle Reflexe',
                beschreibung: 'Du bist immer am Anfang jeder Runde dran (statt wie andere Menschen am Ende) und darfst PA-Proben mit 5 zusätzlichen Würfeln werfen.'
            },
            {
                id: 'signatur-attacke',
                name: 'Signatur-Attacke',
                beschreibung: 'Wähle eine Attacke. Du weißt genau, wie ein Pokemon diese Attacke lernen und ausführen kann, und bist in der Lage, sie innerhalb von 1W6 Tagen Training bis zu 3 Pokemon gleichzeitig beizubringen.'
            },
            {
                id: 'sprinter',
                name: 'Sprinter',
                beschreibung: 'Du kannst pro Kampfrunde bis zu zwei Bewegungen ausführen, von denen auch eine vor und eine nach deiner Aktion sein kann. Bei INIT-Proben (für Menschen für Verfolgungsjagden oder generell schnelle Sprints) erhältst du +2 Erfolge.'
            },
            {
                id: 'starter-auswahl',
                name: 'Starter-Auswahl',
                beschreibung: 'Anders als andere neue Trainer darfst du dir deinen Starter aussuchen. Nicht beliebig, aber dir wird eine Auswahl von 5 Pokemon gegeben, die nach deinem Persönlichkeitstest passen würden, und du darfst dir davon eines aussuchen.'
            },
            {
                id: 'typ-experte',
                name: 'Typ-Experte',
                beschreibung: 'Wähle einen Typ. Du erhältst +1 Erfolge für alle Proben auf Umgang mit Pokemon und Fangen für Pokemon dieses Typs, aber +1 Patzer für alle Proben auf Umgang mit Pokemon und Fangen für Pokemon, die nicht diesen Typ haben. Wenn du ein Pokemon des Typs fängst, erhält es wegen deines guten Umgangs automatisch +1 GENA und +1 PA. Deine Typ-Meisterschaft mit diesem Typ steigt doppelt so schnell.'
            },
            {
                id: 'typ-resistenz',
                name: 'Typ-Resistenz',
                beschreibung: 'Wähle einen Typ. Du hast eine natürliche Resistenz gegen diesen Typ und nimmst nur halben Schaden von seinen Attacken. Pokemon des Typs erkennen in dir instinktiv eine größere Gefahr/einen stärkeren Gegner als in normalen Menschen.'
            },
            {
                id: 'vernarbt',
                name: 'Vernarbt',
                beschreibung: 'Du hast schon so einiges mitgemacht. +30 max KP.'
            }
        ];
    }
};
