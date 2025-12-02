// kommandoService.js
const kommandoService = {
    getAllKommandos: function() {
        return [
            {
                id: 'atme-tief-durch',
                name: 'Atme tief durch!',
                beschreibung: 'Das Pokemon nutzt seine Aktion, um sofort ein Drittel seiner max KP zu heilen (aufgerundet).'
            },
            {
                id: 'auf-die-augen',
                name: 'Auf die Augen!',
                beschreibung: 'Für den Rest der Runde gelten Attacken des Pokemon bereits als Volltreffer, wenn sie nur zwei Erfolge erzielen. Das Pokemon greift dadurch sehr brutal an.'
            },
            {
                id: 'beeil-dich',
                name: 'Beeil dich!',
                beschreibung: 'In der nächsten Runde erhält das Pokemon Priorität auf seiner Attacke, egal, was es einsetzt. Du selbst hast keine Priorität und bist erst wieder dann dran, wenn normalerweise dein Pokemon drangewesen wäre.'
            },
            {
                id: 'beiss-die-zaehne-zusammen',
                name: 'Beiß die Zähne zusammen!',
                beschreibung: 'Alle Wunden, die das Pokemon bis zum Beginn seines nächsten Zugs nehmen würde, werden negiert. Sollte der Kampf zu Beginn des nächsten Zugs des Pokemon noch nicht vorbei sein, nimmt es sofort alle so negierten Wunden auf einmal.'
            },
            {
                id: 'beweg-dich',
                name: 'Beweg dich!',
                beschreibung: 'Das Pokemon kann sofort bis zu zwei zusätzliche Bewegungen ausführen.'
            },
            {
                id: 'bleib-ruhig',
                name: 'Bleib ruhig!',
                beschreibung: 'Entfernt alle Effekte von dem Pokemon, die seine Entscheidungsfindung beeinflussen würden (z.B. Verhöhner, Folterknecht), und macht es für den Rest der Runde immun gegen diese und andere Attacken, die auf seine Psyche anspielen (z.B. auch Kulleraugen).'
            },
            {
                id: 'brich-durch',
                name: 'Brich durch!',
                beschreibung: 'Für den Rest der Runde ignorieren Attacken des Pokemon alle defensiven Effekte wie Schutzschild, Barriere oder Eisenabwehr.'
            },
            {
                id: 'erinnere-dich',
                name: 'Erinnere dich!',
                beschreibung: 'Das Pokemon kann seine Aktion nutzen, um eine Attacke einzusetzen, die es einmal beherrscht hat, die aber aktuell nicht Teil seines Movesets ist. Lege dir hierfür am besten eine separate Liste aller in Frage kommenden Attacken an.'
            },
            {
                id: 'fokussier-dich',
                name: 'Fokussier dich!',
                beschreibung: 'Das Pokemon erhält für den Rest der Runde einen Bonus von +5 Würfeln auf alle GENA-Proben.'
            },
            {
                id: 'geh-in-deckung',
                name: 'Geh in Deckung!',
                beschreibung: 'Das Pokemon springt sofort als zusätzliche Aktion in Deckung. GENA-Proben gegen es sind, bis es aus der Deckung kommt, um 2 Stufen erschwert. Um anzugreifen, muss es die Deckung verlassen. Setzt passendes Gelände/Deckung voraus!'
            },
            {
                id: 'grosser-ansturm',
                name: 'Großer Ansturm!',
                beschreibung: 'Muss vor dem Zug des Pokemon eingesetzt werden. Das Pokemon erhält diese Runde 3 Züge statt einen, aber alle seine Würfelproben werden mit der Hälfte der Würfel (aufgerundet) gewürfelt und es würfelt jede Probe zweimal und nimmt das schlechtere Ergebnis.'
            },
            {
                id: 'halte-durch',
                name: 'Halte durch!',
                beschreibung: 'Das Pokemon ignoriert alle Mali durch Statuseffekte (das heißt Paralyse-Chance, Gift- und Verbrennungsschaden, Fluch usw.). Aber: Zeitlich begrenzte Effekte wie Verbrennung klingen dadurch nicht ab. Wird dieses Kommando mehr als einmal in Folge benutzt, muss das Pokemon immer schwerere Widerstand-Proben bestehen, oder es schlägt fehl.'
            },
            {
                id: 'kanalisiere-den-typ',
                name: 'Kanalisiere den Typ!',
                beschreibung: 'Wähle einen Typ. Die nächste Fernkampf-Attacke des Pokemon diese Runde nimmt den gewählten Typ statt ihres normalen Typs an. Kann nur einmal pro Kampf benutzt werden!',
                requiresChoice: true,
                choices: ['Normal', 'Feuer', 'Wasser', 'Elektro', 'Pflanze', 'Eis', 'Kampf', 'Gift', 'Boden', 'Flug', 'Psycho', 'Käfer', 'Gestein', 'Geist', 'Drache', 'Unlicht', 'Stahl', 'Fee']
            },
            {
                id: 'komm-zurueck',
                name: 'Komm zurück!',
                beschreibung: 'Das Pokemon wird "bereit", jederzeit zurückzukommen. Es kann für den Rest der Runde seine Parade nutzen, um selbstständig in seinen Pokeball zurückzukehren und so garantiert einer Attacke auszuweichen (ähnlich, wie es mit Kehrtwende zurückkehren könnte). Du kannst aber nicht sofort ein neues Pokemon rausholen! Achtung: Wenn du eine Runde ohne aktives Pokemon beginnst, würfelst du deine eigene Initiative, um zu sehen, wann du dran bist. Pokemon, die du in den Kampf schickst, kommen erst eine Runde später selbst dran. Das heißt effektiv, du tauscht garantiertes Ausweichen für einen vollen Zug von Trainer und Pokemon.'
            },
            {
                id: 'lass-es-nicht-entkommen',
                name: 'Lass es nicht entkommen!',
                beschreibung: 'Auf die nächste Attacke des Pokemon diese Runde, die ihr Ziel trifft, kann dieses nicht reagieren (also nicht ausweichen).'
            },
            {
                id: 'mach-das-auch',
                name: 'Mach das auch!',
                beschreibung: 'Das Pokemon nutzt seine Aktion, um eine Attacke, die es seit seinem letzten Zug gesehen hat, zu imitieren, ähnlich wie die Attacke Imitator. Es kann so nur Attacken imitieren, zu denen es physisch auch in der Lage ist (also z.B. nicht Fliegen als Rihorn oder Flammenwurf als Karpador). Rule of thumb: Alles, was Sinn ergibt, garantiert alles, was das Pokemon in irgendeiner Generation irgendwie mal lernen konnte.'
            },
            {
                id: 'mach-dich-bereit',
                name: 'Mach dich bereit!',
                beschreibung: 'Das Pokemon benutzt seine Aktion, um sich bereitzumachen. Aller Schaden, den es (außer von Statuseffekten) nimmt, wird bis zu seinem nächsten Zug halbiert.'
            },
            {
                id: 'merk-dir-das',
                name: 'Merk dir das!',
                beschreibung: 'Das Pokemon benutzt seine Aktion, um eine Attacke zu analysieren, von der es seit seinem letzten Zug getroffen wurde. Das Pokemon würfelt eine blanke WI-Probe. Je nach Komplexität und Stärke der Attacke braucht es dabei eventuell auch mehr als einen Erfolg, vielleicht sogar 3 oder 4! Gelingt die Probe, lernt das Pokemon die Attacke. Hat das Pokemon diese Attacke im selben Kampf mittels Imitator oder „Mach das auch!" schon einmal eingesetzt, sinkt die Schwierigkeit um eine Stufe (auf ein Minimum von 1). Funktioniert ausdrücklich nur, wenn es selbst in einem echten Kampf mit echten Stakes von der Attacke getroffen wird. Wird niemals in Sparring-Matches oder beim Zusehen funktionieren.'
            },
            {
                id: 'noch-mal',
                name: 'Noch mal!',
                beschreibung: 'Kann nur NACH einer Pokemon-Aktion eingesetzt werden, die schiefgelaufen ist (Attacke, die daneben ging). Das Pokemon darf dieselbe Aktion gegen dieselben Ziele sofort noch einmal versuchen.'
            },
            {
                id: 'nutze-den-schmerz',
                name: 'Nutze den Schmerz!',
                beschreibung: 'Das Pokemon konzentriert sich auf seine eigenen Schmerzen, um seinen ANG-Wert zu erhöhen. Dieser erhöht sich um ein Viertel seines Levels (aufgerundet) pro Wunde, die das Pokemon hat. Dieses Kommando setzt das Pokemon extremem Stress und Schmerzen aus!'
            },
            {
                id: 'nutze-die-schwaeche',
                name: 'Nutze die Schwäche!',
                beschreibung: 'Wenn für den Rest der Runde eine Attacke des Pokemon ein Ziel sehr effektiv trifft, fügt sie dadurch dreifachen (bzw. neunfachen) Schaden zu statt doppelten (bzw. vierfachen).'
            },
            {
                id: 'ohne-ruecksicht-auf-verluste',
                name: 'Ohne Rücksicht auf Verluste!',
                beschreibung: 'Die nächste physische Attacke des Pokemon ist ein garantierter Volltreffer, wenn sie trifft. Aber: Der Angreifer nimmt den halben angerichteten Schaden als Rückstoß!'
            },
            {
                id: 'pass-auf',
                name: 'Pass auf!',
                beschreibung: 'Das Pokemon erhält für den Rest der Runde einen Bonus von +5 Würfeln auf alle PA-Proben.'
            },
            {
                id: 'spring-dazwischen',
                name: 'Spring dazwischen!',
                beschreibung: 'Das Pokemon kann für den Rest der Runde seine Reaktion nutzen, um in eine Attacke zu springen und diese abzufangen. Es nimmt dabei den vollen Schaden, kann aber z.B. verhindern, dass du oder ein anderer Mensch getroffen wirst. Für das Dazwischenspringen ist keine Probe notwendig, das Pokemon muss aber physisch dazu in der Lage sein (nicht festgehalten, nahe genug dran, die Attacke muss klein genug sein, um von ihm abgeblockt zu werden usw.).'
            },
            {
                id: 'streng-dich-an',
                name: 'Streng dich an!',
                beschreibung: 'Wähle einen Statuswert (ANG, DEF, SP ANG, SP DEF, INIT). Das Pokemon erhält einen Bonus in Höhe seines Levels auf diesem Wert (als hätte es Panzerschutz oder etwas ähnliches eingesetzt).',
                requiresChoice: true,
                choices: ['ANG', 'DEF', 'SP ANG', 'SP DEF', 'INIT']
            },
            {
                id: 'verstaerke-den-effekt',
                name: 'Verstärke den Effekt!',
                beschreibung: 'Für den Rest der Runde aktivieren Attacken des Pokemon ihre Zusatzeffekte schon bei einem Erfolg weniger (z.B. würde Glut schon bei 2 statt 3 Erfolgen verbrennen).'
            },
            {
                id: 'volle-breitseite',
                name: 'Volle Breitseite!',
                beschreibung: 'Die nächste Fernkampf-Attacke des Pokemon diese Runde, die genau ein Ziel treffen würde, trifft stattdessen alle Ziele in seinem Sichtfeld in Reichweite. Dieses Kommando erschöpft das Pokemon sehr!'
            },
            {
                id: 'volle-kraft',
                name: 'Volle Kraft!!!',
                beschreibung: 'Für den Rest der Runde würfelt das Pokemon GENA-Proben mit der halben Anzahl Würfel (aufgerundet). Wenn es trifft, wird der angerichtete Schaden nicht gewürfelt, sondern behandelt, als hätten alle Würfel eine 6 ergeben.'
            },
            {
                id: 'volles-risiko',
                name: 'Volles Risiko!',
                beschreibung: 'Für den Rest des Kampfes würfelt das Pokemon alle Proben mit der doppelten Anzahl Würfel, aber jede verpatzte Probe gilt, als wären 4 zusätzliche Patzer gewürfelt worden. Du kannst einem Pokemon diesen Befehl ein zweites Mal geben, um den Modus vor Ende des Kampfes zu beenden.'
            },
            {
                id: 'warte-ab',
                name: 'Warte ab!',
                beschreibung: 'Das Pokemon verzögert seine Aktion, aber nicht bis zu einem vorher festgelegten Ereignis. Du kannst jederzeit ansagen "Jetzt macht es das und das", und das passiert dann sofort in Reaktion auf was auch immer gerade geschieht.'
            },
            {
                id: 'weich-zurueck',
                name: 'Weich zurück!',
                beschreibung: 'Das Pokemon bewegt sich sofort so weit wie möglich von allen Gegnern weg und erhält diese Runde eine zusätzliche Reaktion.'
            },
            {
                id: 'ziel-fixieren',
                name: 'Ziel fixieren!',
                beschreibung: 'Wähle ein Ziel. Für den Rest des Kampfes, oder solange das Ziel als Gegner am Kampf teilnimmt und nicht besiegt ist, muss das Pokemon das Ziel angreifen, falls möglich. Dafür werden alle seine GENA-Proben gegen das Ziel mit der doppelten Anzahl Würfeln gewürfelt. Du kannst mit „Ziel fixieren!" auch ein neues Ziel wählen, indem du das Kommando nochmal gibst – dann muss das Pokemon aber einen Zug lang aussetzen, um sein Ziel zu wechseln! Verwirrung beendet diesen Effekt vorzeitig.'
            }
        ];
    }
};