/**
 * Pokemon Move Service
 * Stellt Funktionen bereit, um Pokemon-Attacken-Beschreibungen abzurufen
 */

/**
 * Mapping von deutschen Attackennamen zu ihren Beschreibungen
 * Die Beschreibungen können manuell hier eingetragen werden.
 * 
 * Format: "Attackenname": "Beschreibung der Attacke"
 * 
 * Hinweis: Der Schlüssel muss dem deutschen Namen der Attacke entsprechen,
 * wie er im Spiel angezeigt wird.
 */
const MOVE_DESCRIPTIONS = {
    // === BEISPIEL-EINTRÄGE (können ersetzt/erweitert werden) ===
    
    // Normal-Attacken
    "Tackle": "Kontakt, Nah",
    "Kratzer": "Kontakt, Nah",
    "Pfund": "Kontakt, Nah",
    "Bodyslam": "Kontakt, Nah, 3+ Erfolge: Paralysiert Ziel",
    "Risikotackle": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Superschall": "Alle Ziele in Hörweite würfeln Widerstand gegen GENA-Probe des Angreifers. Jedes Ziel braucht mehr Erfolge als der Angreifer oder wird Verwirrt.",
    "Slam": "Kontakt, Nah",
    "Fuchtler": "Kontakt, Nah, der Angreifer muss diese Attacke solange hintereinander ausführen, wie es physisch in der Lage ist und Gegner in Nahkampfreichweite hat. Es kann sich in dieser Zeit nicht von Gegnern wegbewegen.",
    "Kratzfurie": "Kontakt, Nah. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Schlitzer": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Megahieb": "Kontakt, Nah",
    "Megakick": "Kontakt, Nah",
    "Kopfnuss": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Hornattacke": "Kontakt, Nah",
    "Furienschlag": "Kontakt, Nah, trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Bodycheck": "Kontakt, Nah. 50% Recoil.",
    "Stampfer": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück. Doppelter Schaden, wenn das Ziel deutlich kleiner ist als der Angreifer.",
    "Stakkato": "0.5xLV Meter, trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Zahltag": "LV Meter, ereugt eine Münze und wirft sie auf das Ziel. Egal, ob die Attacke trifft, sie hinterlässt 1W4 kleine Objekte, die je 100 Pokedollar wert sind. Funktioniert nur in einem echten Kampf!",
    "Sternschauer": "LV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite. Trifft immer, kann aber ausgewichen werden.",
    "Schädelwumme": "Attacke über 2 Runden. In der ersten Runde verdoppelt sich die VERT und SP VERT des Angreifers. In der zweiten Runde springt er auf ein Ziel innerhalb seine BW-Reichweite zu und rammt dieses. Kontakt, Nah. Die Wertsteigerungen bleiben für den gesamten Kampf bestehen.",
    "Einigler": "REAKTION: Halbiert allen Schaden, den das Pokemon für den Rest der Runde nehmen würde. AKTION: Erhöht VERT um LV.",
    "Mogelhieb": "Kontakt, Nah. Priorität +4. Wenn das Ziel den Angreifer während des gesamten Kampfes noch nicht bewusst bemerkt hat (er ist gerade erst dazugekommen oder war bisher versteckt/passiv), schreckt es zurück.",
    "Fassade": "Kontakt, Nah. Pro Statuseffekt, von dem der Angreifer betroffen ist, erhöht sich der angerichtete Schaden um 50% (multiplikativ).",
    "Rückkehr": "Kontakt, Nah, Grundschaden = 1W6 + 1W6 pro Freundschaftspunkt, max 12W6. Der Anwender kehrt nach der Attacke mit einer zusätzlichen Bewegung an die Seite seines Trainers zurück, falls möglich.",
    "Frustration": "Kontakt, Nah, Grundschaden = 10W6 - 1W6 pro Freundschaftspunkt, min 1W6. Der Anwender bewegt sich nach der Attacke mit einer zusätzlichen Bewegung so weit wie möglich von seinem Trainer weg, falls möglich.",
    "Geheimpower": "Kantakt, Nah. Der Angreifer sammelt Energie aus seiner Umgebung, um eine andere Art Attacke je nach Umgebung einzusetzen. Grasland: Schläfert ein und Vergiftet bei 3+ Erfolgen. Steinuntergrund, Klippen etc: Verwirrt bei 3+ Erfolgen. Höhlen: Lässt bei 2+ Erfolgen zurückschrecken. Strand, Wüste, sandige Umgebungen: Verringert GENA des Ziels immer um 1. In seichtem Wasser: Verringert bei 2+ Erfolgen Initiative des Ziels um LV. In tiefem Wasser: Verringert bei 3+ Erfolgen ANG des Ziels um LV. Unterwasser: Verringert bei 3+ Erfolgen VERT des Ziels um LV. Sonst: Paralysiert bei 3+ Erfolgen.",
    "Gigastoß": "Kontakt, Nah. Wenn diese Attacke das Ziel nicht besiegt, muss der Anwender eine Runde aussetzen.",
    "Zermürben": "Kontakt, Nah. Ignoriert alle Effekte, die die gegnerische VERT erhöhen oder Schaden verringern würden.",
    "Bezirzer": "Kontakt, Nah. Bei Treffer: Angreifer würfelt eine Betören-Probe. Bei Erfolg: Er stiehlt das getragene Item des Ziels, sofern möglich, da dieses es ihm einfach gibt.",
    "Ultraschall": "Trifft alle Ziele in Hörweite, jedes Ziel bekommt eine eigene PA-Gelegenheit. Getroffene Ziele nehmen 3xLV Schaden, der nicht erhöht oder verringert werden kann. Ignoriert Typ-Immunität, Resistenzen und Fähigkeiten von Gegnern.",
    "Gesang": "Alle Ziele in Hörweite müssen eine Widerstand-Probe gegen die GENA-Probe des Angreifers würfeln oder schlafen ein. Dies erfordert keine Reaktion.",
    "Einrollen": "Erhöht ANG und VERT des Anwenders um LV und seine GENA um 1. Kann als Reaktion eingesetzt werden, wenn der Anwender angegriffen wird.",
    "Härtner": "REAKTION: Halbiert allen Schaden, den das Pokemon für den Rest der Runde nehmen würde. AKTION: Erhöht VERT um LV.",
    "Schwerttanz": "Der Anwender würfelt Tanzen statt GENA. Bei Erfolg: ANG + 2xLV. Bei Misserfolg: ANG + LV.",
    "Agilität": "Verdoppelt die aktuelle Initiative und Bewegung des Anwenders. Kann nur einmal pro Kampf eingesetzt werden.",
    "Bauchtrommel": "Der Anwender schlägt auf sich selbst ein und halbiert seine aktuellen KP (aufgerundet), ohne dabei eine Wunde zu erzeugen. Sein ANG wird verdreifacht, kann aber nicht weiter erhöht werden.",
    "Gähner": "Alle Ziele, die gerade auf den Anwender achten, müssen eine Widerstand-Probe mit Schwierigkeit 1 bestehen oder schlafen zu Beginn der nächsten Runde ein. Keine GENA-Probe nötig.",
    "Erholung": "Der Anwender schläft ein und heilt seine KP vollständig. Dieser Schlaf dauert 2 Runden und kann nicht vorzeitig beendet werden.",
    "Schutzschild": "Priorität. Wird in eine bestimmte Richtung ausgerichtet und hält alle Attacken von beiden Seiten ab wie eine massive Wand. Hält bis zum Beginn der nächsten Runde. Besonders starke Attacken können den Schild durchbrechen.",
    "Ausdauer": "REAKTION: Der Anwender übersteht bis zum Ende der Runde alle eingehenden Attacken mit 1 KP, nimmt aber trotzdem Wunden, als würde jede davon ihn auf 0 KP bringen. Der Anwender kann selbst entscheiden, den Effekt vorzeitig zu beenden.",
    "Angeberei": "Der Anwender würfelt Schauspielern und wählt dabei ein oder mehrere nah beieinanderstehende Ziele in Hörweite als Ziele. Die gewählten Ziele müssen eine WI + Widerstand-Probe bestehen oder werden Verwirrt. Unabhängig von der Widerstand-Probe erhöht sich ihr ANG um 2xLV und sie werden bevorzugt physisch angreifen, falls möglich.",
    "Zuschuss": "Der Anwender würfelt eine GENA-Probe. Bei 3+ Erfolgen kann er eine beliebige Attacke eines anderen Pokemon im Team seines Trainers wählen und diese Benutzen. Anderenfalls wird eine zufällige Attacke eines anderen Pokemon im Team seines Trainers gewählt, die es benutzt. Es sind so ausdrücklich nur Attacken möglich, die das Pokemon physisch ausführen kann. Attacken wie Fliegen werden z.B. für viele Pokemon schwierig.",
    "Umklammerung": "Kontakt, Nah. Das Ziel wird festgehalten und kann sich nicht bewegen, bis der Anwender es loslässt oder das Ziel in einem eine Stärke-Proben-Wettkampf gegen den Anwender gewinnt oder mittels einer Attacke ausbricht.",
    "Auflockern": "Entfernt mit einem gewaltigen, monodirektionalen Windstoß alle Objekte, die in einem 45°-Kegel in bis zu 2xLV Metern Entfernung platziert waren (Stachler, Tarnsteine, Klebenetz usw.). Sehr leichte Pokemon werden außerdem ebenfalls um bis zu 3xLV Meter in einer geraden Linie vom Anwender wegbewegt.",
    "Offenlegung": "Kontakt, Nah. Ignoriert alle Effekte, die die gegnerische VERT erhöhen oder Schaden verringern würden. Durchbricht außerde, alle Schild-Effekte und -Fähigkeiten und entfernt diese oder (im Fall von Fähigkeiten) negiert sie für den Rest der Runde.",
    "Kraftschub": "Erhöht ANG und SP ANG des Anwenders je um LV. Der Anwender kann anschließend sofort eine Nah-Attacke als zusätzliche Aktion durchführen, die dann aber +2 automatische Patzer hat.",
    "Wechseldich": "REAKTION: Der Anwender tauscht sofort seine Position mit einem Ziel. Wenn das Ziel unwillig ist, würfelt der Anwender GENA und das Ziel Widerstand. Würfelt das Ziel MEHR Erfolge, widersteht es der Attacke.",
    "Imitator": "Der Anwender wählt eine Attacke, die seit seiner letzten Runde (oder seit es Teil des Kampfes ist) in seinem Sichtfeld eingesetzt wurde. Wenn es sich nicht um die zuletzt eingesetzte Attacke handelt, muss es eine GENA-Probe bestehen oder wählt automatisch die zuletzt eingesetzte Attacke. Der Anwender setzt dann die gewählte Attacke ein.",
    "Wandler": "Das Pokemon verändert seine physische Form für die Dauer des Kampfes oder maximal 10 Minuten. Seine Attacken und Fähigkeiten werden ersetzt durch die des Ziels, in das es sich verwandelt, aber seine Statuswerte bleiben unverändert. Das Pokemon kann sich so auch in einen Menschen verwandeln, sieht dabei aber sehr uncanny aus. Sobald das Pokemon sich zurückverwandelt, tut sein ganzer Körper durch die extreme Anstrengung weh. Kann nur einmal pro 10 volle Level des Anwenders am Tag eingesetzt werden.",
    "Nachahmer": "Der Anwender wählt eine Attacke, die seit seiner letzten Runde (oder seit es Teil des Kampfes ist) in seinem Sichtfeld eingesetzt wurde. Diese Attacke wird durch die gewählte Attacke ersetzt, egal, ob der Anwender sie normalerweise lernen könnte oder nicht. Attacken, die der Anwender physisch nicht ausführen kann (z.B. Fliegen für ein Onix) werden immer fehlschlagen!",
    "Wunschtraum": "Kann nur als Reaktion eingesetzt werden, wenn der Anwender besiegt wird. Am Ende der nächsten Runde werden die KP aller verbündeten Pokemon um 25% geheilt (aufgerundet).",
    "Staffette": "Der Anwender übergibt sein Item und seine Status-Veränderungen an ein verbündetes Ziel in Nahkampf-Reichweite. Funktioniert nur, solange der Anwender ein Item trägt. Das Ziel kann anschließend mehr als ein Item tragen!",
    "Heilblockade": "LV Meter. Das Ziel wird mit einem Fluch belegt und kann bis zum Ende des Kampfes durch keine Quelle mehr geheilt werden. Das beinhaltet seine KP, aber auch Heilung von negativen Effekten, inklusive diesem. Der Effekt endet vorzeitig, wenn das Pokemon ausgewechselt wird.",
    "Silberblick": "Erfordert Sichtkontakt mit einem Ziel. Das Ziel würfelt eine Widerstand-Probe mit Schwierigkeit 3 oder seine VERT sinkt um LV. Kostet das Ziel keine Reaktion.",
    "Brüller": "Der Anwender würfelt Einschüchtern statt GENA. Alle Pokemon in Hörweite, Freund wie Feind, müssen eine Probe auf WI + Widerstand bestehen oder werden sofort eine zusätzliche Bewegung ausführen, um sich so weit wie möglich vom Anwender weg zu bewegen. Pokemon, die bereits in der Nähe ihrer Trainer sind, werden versuchen, sich selbst in ihre eigenen Pokebälle zurückzurufen, um dem Kampf zu entkommen.",
    "Rauchwolke": "Erzeugt eine dicke Rauchwolke mit 10 + 0.1xLV Metern Durchmesser, deren Zentrum bis zu LV Meter vom Anwender entfernt ist. Alle Attacken, die in der Rauchwolke starten oder in diese eindringen/sie durchdringen müssten, haben ihre Schwierigkeit um 2 erhöht. Nur der Anwender selbst ist von der Rauchwolke nicht beeinträchtigt.",
    "Lockduft": "Der Anwender würfelt Betören statt GENA. Alle Pokemon, die ihn riechen können, Freund wie Feind, müssen eine Probe auf WI + Widerstand bestehen oder werden sofort eine zusätzliche Bewegung ausführen, um sich so nah wie möglich an den Anwender heran zu bewegen. Außerhalb von Kämpfen können so Pokemon angelockt werden, die dabei nicht kampfeslustig sind.",
    "Tarnung": "Gilt als zusätzliche Aktion. Der Anwender verändert seinen Typ, um sich der Umgebung anzupassen; Wald/Grasebene = Pflanze, sandiges Gelände = Boden, Höhle = Gestein, auf/unter Wasser = Wasser, Schnee = Eis, Gebäude/Straßen/Städte = Normal.",
    "Charme": "Der Anwender würfelt eine Betören-Probe statt GENA. Alle Ziele in Hörweite müssen eine Probe auf WI + Widerstand bestehen oder fügen dem Anwender für den Rest des Kampfes halben Schaden mit physischen Attacken zu. Wirkt nicht kumulativ.",
    "Klingensturm": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer. Muss erst eine Runde aufgeladen werden. Die GENA-Probe erhält +2 automatische Erfolge.",
    "Ruckzuckhieb": "AKTION: Kontakt, Nah. Priorität, der Anwender kann eine zusätzliche Bewegung vor oder nach der Attacke ausführen. REAKTION: Der Anwender weicht automatisch einer Nah-Attacke aus, muss aber nächste Runde seine Aktion überspringen.",
    "Wachstum": "Der Anwender wird sofort doppelt so groß wie bisher. Dabei vervierfacht sich sein Gewicht und alle Statuswerte erhöhen sich um LV. Im Sonnenschein erhöhen sie sich stattdessen um 2xLV. Der Effekt endet nach maximal 10 Minuten. Kann nur dreimal pro Tag eingesetzt werden.",
    "Zuflucht": "Kontakt, Nah. Kann nur eingesetzt werden, wenn der Anwender jede andere Attacke, die er beherrscht, mindestens einmal in diesem Kampf eingesetzt hat.",
    "Vitalglocke": "Heilt alle Ziele in bis zu LV Metern Entfernung, die das Pokemon hören können, von allen negativen Statuseffekten. Hat keinen Einfluss auf Pokemon, die in dicken Eisblöcken eingefroren sind!",
    "Guillotine": "Trifft nur bei 4+ Erfolgen und nur, wenn das Ziel nicht mehr als das doppelte Level des Anwenders hat. Das Ziel wird zerschnitten und sofort besiegt.,",
    "Hornbohrer": "Trifft nur bei 4+ Erfolgen und nur, wenn das Ziel nicht mehr als das doppelte Level des Anwenders hat. Das Ziel wird aufgebohrt und sofort besiegt.,",
    "Hyperzahn": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Superzahn": "Kontakt, Nah. Das Ziel nimmt Schaden in Höhe der Hälfte seiner aktuellen KP (aufgerundet).",
    "Hyperstrahl": "LV Meter. Trifft alle Ziele in einer geraden Linie in Reichweite. Wenn diese Attacke nicht mindestens ein Ziel besiegt, muss der Anwender eine Runde aussetzen.",
    "Doppelschlag": "Kontakt, Nah. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen.",
    "Dornkanone": "LV Meter. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Duplexhieb": "Kontakt, Nah. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Furienschlag": "Kontakt, Nah. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Kehrschelle": "Kontakt, Nah. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Kometenhieb": "Kontakt, Nah. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Mäuseplage": "Kontakt, Nah. Trifft 1W10 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    
    // Feuer-Attacken
    "Glut": "LV Meter. 3+ Erfolge: Das Ziel wird Verbrannt.",
    "Flammenwurf": "LV Meter. 3+ Erfolge: Das Ziel wird Verbrannt.",
    "Feuersturm": "2xLV Meter. -2 Würfel auf der GENA-Probe. 3+ Erfolge: Das Ziel wird Verbrannt.",
    "Feuerwirbel": "LV Meter. Das Ziel und alle Ziele in direkter Nähe werden in einer Feuer-Vortex gefangen, die 5 Runden hält. Sie nehmen 25% max KP-Schaden und werden verbrannt, wenn sie die Feuer-Vortex durchbrechen. Die Attacke kann auch auf Objekte oder den leeren Raum eingesetzt werden, um einfach Feuer-Vortexes zu erzeugen.",
    "Flammensturm": "Trifft alle Ziele in bis zu LV Metern Entfernung in allen Richtungen. Bei 3+ Erfolgen werden alle getroffenen Ziele Verbrannt. Ein Ziel kann nur ausweichen, wenn sein BW-Wert groß genug ist, aus der Reichweite zu entkommen.",
    "Hitzekoller": "Trifft alle Ziele in bis zu LV Metern Entfernung in allen Richtungen. Ein Ziel kann nur ausweichen, wenn sein BW-Wert groß genug ist, aus der Reichweite zu entkommen. Anschließend sinkt SP ANG des Anwenders um LV.",
    "Flammenblitz": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Feuerzahn": "Kontakt, Nah. 3+ Erfolge: Das Ziel wird Verbrannt und schreckt zurück.",
    "Inferno": "Die GENA-Probe für diese Attacke wird mit der Hälfte der Würfel gewürfelt (aufgerundet). 5xLV Meter. Trifft alle Ziele in einer breiten Linie zwischen dem Anwender und einem Zielpunkt in Reichweite. Getroffene Ziele werden Verbrannt.",
    "Flammenrad": "Kontakt, Nah. 3+ Erfolge: Das Ziel wird Verbrannt. Kann eingesetzt werden, solange der Anwender Eingefroren ist, und taut ihn garantiert auf.",
    "Feuersäulen": "LV Meter. Wenn innerhalb derselben Runde zuvor bereits Wassersäulen gegen dasselbe Ziel eingesetzt wurde: Ein Regenbogen entsteht für 5 Runden und alle Zusatzeffekte, die bei 2+, 3+ oder 4+ Erfolgen eintreten würden, treten bereits mit einem Erfolg weniger ein. Wenn zuvor Pflanzensäulen eingesetzt wurde: Ein Moor entsteht in einem großen Gebiet und senkt die Initiative aller Ziele darin mit Bodenkontakt um 75%.",
    "Flammenwut": "Kontakt, Nah, der Angreifer muss diese Attacke solange hintereinander ausführen, wie es physisch in der Lage ist und Gegner in Nahkampfreichweite hat. Es kann sich in dieser Zeit nicht von Gegnern wegbewegen.",
    "Nitroladung": "Kontakt, Nah. Der Anwender muss vor der Attacke eine Bewegung auf das Ziel zu ausgeführt haben. Der Anwender erhält +LV BW und Initiative.",
    "Feuerfeger": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Rüstungskanone": "LV Meter. Der Anwender verausgabt sich total und verliert LV VERT und SP VERT, selbst, wenn die Attacke nicht trifft.",
    "Irrlicht": "Erzeugt eine etwa kopfgroße, flackernde, autonom agierende Flamme in einer beliebigen Farbe. Bei Erzeugen wird der Flamme entweder ein Weg oder Ziel zugewiesen, dem sie folgt, bis sie entweder ein Ziel/Objekt trifft oder, z.B. durch eine Wasser-Attacke, gelöscht wird. Kommt ein Ziel mit einem Irrlicht in Kontakt, wird dieses gelöscht und das Ziel Verbrannt. Um einem Irrlicht auszuweichen, das ein Ziel treffen würde, ist keine PA-Probe nötig, aber eine Reaktion.",
    "Lohekanonade": "LV Meter. Wenn diese Attacke das Ziel nicht besiegt, muss der Anwender eine Runde aussetzen.",
    "Hitzeturbo": "Kontakt, Nah. 3+ Erfolge: Das Ziel wird Verbrannt.",

    // Wasser-Attacken
    "Aquaknarre": "LV Meter.",
    "Blubbstrahl": "LV Meter. 3+ Erfolge: Das Ziel verliert LV Initiative.",
    "Hydropumpe": "2xLV Meter. Durchbricht alle Schutz-Effekte wie Barriere, Reflektor und Schutzschild.",
    "Surfer": "LV Meter. Erzeugt gewaltige Wassermassen und trifft alle Ziele in einem 90°-Kegel in Reichweite.",
    "Wasserdüse": "AKTION: Kontakt, Nah. Priorität, der Anwender kann eine zusätzliche Bewegung vor oder nach der Attacke ausführen. REAKTION: Der Anwender weicht automatisch einer Nah-Attacke aus, muss aber nächste Runde seine Aktion überspringen.",
    "Nassschweif": "Kontakt, Nah. Kann als REAKTION verwendet werden, um eine physische Fernkampf-Attacke wegzuschlagen, wobei dann eine GENA statt einer PA-Probe gewürfelt wird.",
    "Kaskade": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Taucher": "Der Anwender taucht tief ins Wasser. Solange er im Wasser ist, erhält er 2 zusätzliche Bewegungen pro Runde und kann jederzeit wieder auftauchen, um als zusätzliche Aktion ein beliebiges Ziel mit dieser Attacke anzugreifen. Kontakt, Nah. Kann auch verwendet werden, um in Sand oder andere nicht komplett feste Böden einzutauchen, erhält dann aber keine zusätzlichen Bewegungen.",
    "Aquawelle": "LV Meter. 3+ Erfolge: Das Ziel wird Verwirrt.",
    "Siedewasser": "LV Meter. 3+ Erfolge: Das Ziel wird Verbrannt.",
    "Regentanz": "Das Pokemon führt einen Tanz auf und lässt es regnen. Funktioniert ausdrücklich auch in Innenräumen oder Höhlen. Der Anwender würfelt Tanzen statt GENA. Bei Erfolg kann es sofort eine andere Wasser-Attacke als zusätzliche Aktion durchführen.",
    "Whirlpool": "LV Meter. Das Ziel und alle Ziele in direkter Nähe werden in einem großen Strudel gefangen, der 5 Runden hält. Sie nehmen 25% max KP-Schaden und werden LV Meter weit in eine zufällige Richtung geschleudet, wenn sie den Strudel durchbrechen. Die Attacke kann auch auf Objekte oder den leeren Raum eingesetzt werden, um einfach Strudel zu erzeugen.",
    "Aquahaubitze": "LV Meter. Wenn diese Attacke das Ziel nicht besiegt, muss der Anwender eine Runde aussetzen.",
    "Schaumserenade": "LV Meter. Der Anwender würfelt Schauspielern statt GENA. Diese Attacke trifft alle Ziele in Reichweite, die den Anwender hören können. Getroffene Ziele nehmen Schaden und werden von ihren Verbrennungen geheilt. Diese Attacke kann auch gezielt eingesetzt werden, um nur Verbrennungen zu heilen, das dann aber an allen Zielen, nicht nur an bestimmten.",
    "Aquaschnitt": "LV Meter. Landet bei 3+ Erfolgen Volltreffer.",
    "Krabhammer": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Präzisionsschuss": "3xLV Meter. Landet bei 3+ Erfolgen Volltreffer.",
    "Trefferschwall": "Kontakt, Nah. Landet automatisch Volltreffer, wenn die Attacke trifft.",
    "Wellentackle": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Wassersäulen": "LV Meter. Wenn innerhalb derselben Runde zuvor bereits Feuersäulen gegen dasselbe Ziel eingesetzt wurde: Ein Regenbogen entsteht für 5 Runden und alle Zusatzeffekte, die bei 2+, 3+ oder 4+ Erfolgen eintreten würden, treten bereits mit einem Erfolg weniger ein. Wenn zuvor Pflanzensäulen eingesetzt wurde: Ein Meer aus Feuer entsteht in einem großen Gebiet und fügt jedem Ziel darin am Ende jeder seiner Runden 20% max KP Feuer-Schaden zu. Hat keinen Effekt auf Feuer-Pokemon.",
    "Laker": "LV Meter. Wenn das Ziel weniger als 50% seiner max KP hat: Diese Attacke fügt doppelten Schaden zu.",
    "Tauchtriade": "Kontakt, Nah. Wird dreimal ausgeführt, wobei für jede Instanz je eigene GENA-Proben nötig sind und ihnen einzeln ausgewichen werden muss. Verfehlt eine Schadensinstanz, können weitere trotzdem treffen.",
    "Wasser-Shuriken": "LV Meter. Priorität. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort. 3+ Erfolge bei einer Instanz: Das Ziel schreckt zurück.",
    "Nassmacher": "LV Meter. Tränkt alle Ziele in einem bis zu 1x1 Meter großen Gebiet in Reichweite in Wasser, dass sie triefen. Betroffene Ziele nehmen halben Schaden von Feuer-, aber doppelten von Elektro-Attacken und werden immer von Attacken paralysiert, die sonst nur eine Chance hätten, sie zu paralysieren, sind aber immun gegen Verbrennung und werden sofort von Verbrennungen geheilt.",
    "Lebenstropfen": "0.5xLV Meter. Heilt die KP des Ziels (kann auch der Anwender selbst sein) um 50% ihres Maximums. Unterwasser werden die KP stattdessen vollständig geheilt. Kann nur einmal pro Tag außerhalb von Kämpfen eingesetzt werden und heilt dann nur 25%.",
    
    // Elektro-Attacken
    "Donnerschock": "LV Meter. 3+ Erfolge: Das Ziel wird Paralysiert.",
    "Donnerblitz": "LV Meter. 3+ Erfolge: Das Ziel wird Paralysiert.",
    "Donner": "LV Meter. Trifft bei Regen immer und hat dreifache Reichweite. Sonst wird die GENA-Probe mit 3 Würfeln weniger gewürfelt.",
    "Donnerwelle": "Statt PA + Ausweichen kann das Ziel auch KÖ + Widerstand gegen die Attacke würfeln, was dann keine Reaktion kostet. Besteht das Ziel keine Probe, wird es Paralysiert.",
    "Funkensprung": "Kontakt, Nah. 3+ Erfolge: Das Ziel wird Paralysiert.",
    "Elektroball": "Kontakt, Nah. Der Basisschaden skaliert mit der Geschwindigkeit des Anwenders relativ zum Ziel: Der Anwender ist gleich schnell oder langsamer: 4W6. Er ist schneller, aber nicht doppelt so schnell: 6W6. 2x-3x so schnell: 8W6. 3x-4x so schnell: 12W6. Noch schneller: 15W6.",
    "Volttackle": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Ladungsstoß": "LV Meter. Trifft alle Ziele in Reichweite. 3+ Erfolge: Getroffene Ziele werden Paralysiert.",
    "Ladestrahl": "2+ Erfolge: Der Anwender erhält +LV SP ANG.",
    "Blitz": "Alle Ziele, die den Anwender sehen können, werden für den Rest der Runde geblendet und würfeln GENA-Proben zweimal, wobei das schlechtere Ergebnis zählt. Außerdem verlieren betroffene Ziele bis zum Ende des Kampfes 1 GENA.",
    "Magnetflug": "Der Anwender schwebt für den Rest des Kampfes elektromagnetisch. Funktioniert ausdrücklich über jedem Untergrund, sogar Wasser. Kann als Reaktion verwendet werden. Der Anwender ist schwebend immun gegen manche Attacken wie Erdbeben und schwebt immer exakt 20 Centimeter über dem Boden. Er kann bis zu sein eigenes Körpergewicht tragen, bevor er zu Boden gedrückt wird.",
    "Plasmaschauer": "Piorität. Lässt es für den Rest des Kampfes Elektrizität regnen. Solange dieses besondere Wetter vorherrscht, gelten alle Attacken zusätzlich zu ihrem regulären Typ als Elektro-Attacken, wenn es um Schwäche und Resistenz geht (allerdings nicht, wenn es um Immunität geht!). Normal-Attacken gelten NUR als Elektro-Attacken. Elektro-Pokemon erhalten, solange der Plasmaschauer anhält, + ihr LV Initiative.",
    "Schockwelle": "LV Meter. Trifft alle Ziele in einer geraden Linie in Reichweite. Trifft immer, kann aber ausgewichen werden.",
    "Blitzkanone": "Die GENA-Probe für diese Attacke wird mit der Hälfte der Würfel gewürfelt (aufgerundet). 5xLV Meter. Trifft alle Ziele in einer geraden Linie. Getroffene Ziele werden Paralysiert.",
    "Stromstoß": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Elektronetz": "Platziert ein Elektronetz mit einem Meter Durchmesser, dessen Zentrum innerhalb von LV Metern Entfernung zum Anwender sein muss. Jedes Ziel, das das Netz berührt, nimmt Schaden und muss eine Widerstand-Probe würfeln. Schafft es diese nicht, verliert es LV Initiative. Das Elektronetz bleibt bestehen, bis es, z.B. durch eine Feuer-Attacke, zerstört wird. Beim Einsatz kann das Netz auch direkt auf ein Ziel geschossen werden; in dem Fall werden normal GENA und PA gewürfelt.",
    "Donnerstoß": "Kontakt, Nah. Wenn die Attacke nicht trifft, geht der Anwender zu Boden und nimmt 25% seiner max KP als Rückstoßschaden. Dieser Schaden kann keine Wunden verursachen und den Anwender nicht besiegen.",
    "Donnerzahn": "Kontakt, Nah. 3+ Erfolge: Das Ziel wird Verbrannt und schreckt zurück.",
    "Voltwechsel": "Kontakt, Nah. Der Anwender kann vor und muss nach der Attacke sofort eine zusätzliche Bewegung ausführen, wobei die Bewegung nach der Attacke so nah an seinem Trainer enden muss wie möglich, dalls er einen hat. Schafft der Anwender es zurück zu seinem Trainer, wird er sofort zurückgerufen und gegen ein anderes Pokemon ausgetauscht.",
    "Elektrofeld": "Hüllt das komplette Kampffeld für 5 Runden in starke Spannung und steten Funkenflug. Solange das Feld aktiv ist, können Pokemon in ihm mit Bodenkontakt nicht einschlafen und wachen sofort auf, wenn sie bereits schlafen. Außerdem fügen Elektro-Attacken, die innerhalb des Felds treffen, +50% Schaden zu.",
    
    // Pflanze-Attacken
    "Rankenhieb": "1 Meter. Das Ziel wird festgehalten und kann sich nicht bewegen, bis der Anwender es loslässt oder das Ziel in einem eine Stärke-Proben-Wettkampf gegen den Anwender gewinnt oder mittels einer Attacke ausbricht.",
    "Rasierblatt": "LV Meter. Landet bei 3+ Erfolgen Volltreffer.",
    "Solarstrahl": "5xLV Meter. Muss erst eine Runde aufgeladen werden, außer in der Sonne. Trifft alle Ziele in einer geraden Linie.",
    "Egelsamen": "0.5xLV Meter. Das Ziel wird bepflanzt und verliert jede Runde 10% seiner max KP. Dieselbe Anzahl KP wird beim Anwender geheilt. Die Pflanzen können zerstört werden, z.B. durch Feuer, oder indem das Ziel sich mit einer Akrobatik- oder Stärke-Probe befreit; dadurch endet der Effekt. Manche Pokemon, z.B. solche mit Magmapanzer sowie Pflanzen-Pokemon, sind immun.",
    "Giftpuder": "1 Meter. Statt PA + Ausweichen kann das Ziel auch KÖ + Widerstand gegen die Attacke würfeln, was dann keine Reaktion kostet. Jedes Ziel, das keine Probe gegen diese Attacke besteht, wird Vergiftet. Kein Effekt auf Pflanzen-Pokemon.",
    "Stachelspore": "1 Meter. Statt PA + Ausweichen kann das Ziel auch KÖ + Widerstand gegen die Attacke würfeln, was dann keine Reaktion kostet. Jedes Ziel, das keine Probe gegen diese Attacke besteht, wird Paralysiert. Kein Effekt auf Pflanzen-Pokemon.",
    "Schlafpuder": "1 Meter. Statt PA + Ausweichen kann das Ziel auch KÖ + Widerstand gegen die Attacke würfeln, was dann keine Reaktion kostet. Jedes Ziel, das keine Probe gegen diese Attacke besteht, schläft ein. Kein Effekt auf Pflanzen-Pokemon.",
    "Blättertanz": "Kontakt, Nah, der Angreifer muss diese Attacke solange hintereinander ausführen, wie es physisch in der Lage ist und Gegner in Nahkampfreichweite hat. Es kann sich in dieser Zeit nicht von Gegnern wegbewegen. Statt GENA kann der Anwender auch eine Tanzen-Probe würfeln.",
    "Synthese": "Der Anwender heilt sich um 50% seiner max KP. Funktioniert nur, solange die Sonne zu sehen ist. In gleißendem Sonnenschein werden stattdessen 75% geheilt.",
    "Aromakur": "Heilt alle Ziele in bis zu LV Metern Entfernung, die das Pokemon riechen können, von allen negativen Statuseffekten. Hat keinen Einfluss auf Pokemon, die in dicken Eisblöcken eingefroren sind!",
    "Gigasauger": "Kontakt, Nah. Der Anwender heilt sich um 50% des angerichteten Schadens. Kann auch auf Bäume eingesetzt werden, um sich pro Runde um 10W6 KP zu heilen (und den Baum damit langsam zu töten).",
    "Megasauger": "Kontakt, Nah. Der Anwender heilt sich um 50% des angerichteten Schadens. Kann auch auf Bäume eingesetzt werden, um sich pro Runde um 6W6 KP zu heilen (und den Baum damit langsam zu töten).",
    "Absorber": "Kontakt, Nah. Der Anwender heilt sich um 50% des angerichteten Schadens. Kann auch auf Bäume eingesetzt werden, um sich pro Runde um 2W6 KP zu heilen (und den Baum damit langsam zu töten).",
    "Samenbomben": "LV Meter. Die Attacke detoniert und fügt auch Zielen in direkter Nähe des Ziels Schaden zu.",
    "Energieball": "LV Meter. 3+ Erfolge: Das Ziel verliert LV SP VERT.",
    "Blättersturm": "LV Meter. Der Anwender verliert 2xLV SP ANG.",
    "Holzhammer": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Zauberblatt": "LV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite. Trifft immer, kann aber ausgewichen werden.",
    "Laubklinge": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Rankenkeule": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Blumentrick": "Nah. Landet automatisch Volltreffer, wenn die Attacke trifft. GENA-Probe wird um Schauspielern des Angreifers erhöht.",
    "Schutzstacheln": "Priorität. Wird in eine bestimmte Richtung ausgerichtet und hält alle Attacken von beiden Seiten ab wie eine massive Wand. Hält bis zum Beginn der nächsten Runde. Besonders starke Attacken können den Schild durchbrechen. Kontakt-Attacken, die den Schild treffen, fügen dem Angreifer Schaden von 20% max KP zu.",
    "Strauchler": "Kontakt, Nah. Der Basisschaden verändert sich je nach Gewicht des Ziels. <= 10 Kilo: 2W6. Bis 25 Kilo: 4W6. Bist 50 Kilo: 6W6. Bis 100 Kilo: 8W6. Bis 200 Kilo: 10W6. Sonst: 12W6.",
    "Nietenranke": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Pflanzensäulen": "LV Meter. Wenn innerhalb derselben Runde zuvor bereits Feuersäulen gegen dasselbe Ziel eingesetzt wurde: Ein Meer aus Feuer entsteht in einem großen Gebiet und fügt jedem Ziel darin am Ende jeder seiner Runden 20% max KP Feuer-Schaden zu. Hat keinen Effekt auf Feuer-Pokemon. Wenn zuvor Wassersäulen eingesetzt wurde: Ein Moor entsteht in einem großen Gebiet und senkt die Initiative aller Ziele darin mit Bodenkontakt um 75%.",
    "Flora-Statue": "LV Meter. Wenn diese Attacke das Ziel nicht besiegt, muss der Anwender eine Runde aussetzen.",
    "Kugelsaat": "LV Meter. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Grasfeld": "Überzieht das komplette Kampffeld für 5 Runden mit dichtem, unnatürlich grünem, saftigem Gras. Solange das Grasfeld aktiv ist, regenrieren alle Pokemon in ihm mit Bodenkontakt am Ende jedes ihrer Züge 10% ihrer max KP. Außerdem fügen Pflanzen-Attacken, die in dem Feld eingesetzt werden, 50% mehr Schaden zu und manche Boden-Attacken wie Erdbeben fügen im Grasfeld nur halben Schaden zu (aufgerundet).",
    
    // Eis-Attacken
    "Eisstrahl": "LV Meter. 4+ Erfolge: Das Ziel wird Eingefroren.",
    "Blizzard": "2xLV Meter. Trifft alle Ziele in einem 45°-Trichter in Reichweite. 4+ Erfolge: Alle getroffenen Ziele werden Eingefroren. Bekommt in Schnee/Hagel +2 automatische Erfolge auf GENA-Proben, sonst +1 Patzer. Kann nur alle zwei Runden eingesetzt werden.",
    "Pulverschnee": "LV Meter. Trifft alle Ziele in einem 45°-Trichter in Reichweite. 4+ Erfolge: Alle getroffenen Ziele werden Eingefroren. Bekommt in Schnee/Hagel +2 automatische Erfolge auf GENA-Proben, sonst +1 Patzer.",
    "Aurorastrahl": "LV Meter. 3+ Erfolge: Das Ziel verliert LV ANG.",
    "Eissturm": "LV Meter. Trifft alle Ziele in einem 45°-Trichter in Reichweite. 3+ Erfolge: Alle getroffenen Ziele verlieren LV ANG. Bekommt in Schnee/Hagel +2 automatische Erfolge auf GENA-Proben, sonst +1 Patzer.",
    "Eiszapfhagel": "LV Meter. Trifft alle Ziele in einer geraden Linie in Reichweite mit riesigen, aus dem Nichts herunterfallenden Eiszapfen. Funktioniert auch in geschlossenen Räumen/Höhlen, aber nur, wenn die Decke mindestens 5 Meter hoch ist. 3+ Erfolge: Alle getroffenen Ziele schrecken zurück.",
    "Eissplitter": "LV Meter. Priorität. PA-Proben gegen diese Attacke werden nur mit der halben Anzahl Würfeln gewürfelt.",
    "Lawine": "Kontakt, Nah. Priorität -1. Der Anwender kann sofort vor Einsatz der Attacke eine zusätzliche Bewegung auf das Ziel zu ausführen. Wenn der Anwender diese Runde Schaden genommen hat, fügt diese Attacke doppelten Schaden zu.",
    "Hagelsturm": "Ändert das Wetter zu Hagelsturm. Wenn bereits ein Hagelsturm herrscht, wird stattdessen ALLEN Zielen, außer Wasser- und Eis-Pokemon, 20% ihrer max KP zugefügt. Hierauf kann nicht reagiert werden, aber Ziele erhalten eine Widerstand-Probe gegen die GENA-Probe des Angreifers, um dem Schaden zu widerstehen.",
    "Eiseskälte": "Trifft nur bei 4+ Erfolgen und nur, wenn das Ziel nicht mehr als das doppelte Level des Anwenders hat. Das Ziel wird in meterdickes Eis gehüllt und sofort besiegt.",
    "Gefriertrockner": "LV Meter. Sehr effektiv gegen Wasser-Pokemon und extrem kalt. 4+ Erfolge: Das Ziel wird eingeforen.",
    "Frosthauch": "0.5xLV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite. 3+ Erfolge: Verbrennt das Ziel. Muss erst eine Runde aufgeladen werden. Die GENA-Probe erhält +2 automatische Erfolge.",
    "Frostvolt": "Kontakt, Nah. 3+ Erfolge: Paralysiert das Ziel. Muss erst eine Runde aufgeladen werden. Die GENA-Probe erhält +2 automatische Erfolge.",
    "Eisesodem": "LV Meter. Landet automatisch Volltreffer, wenn die Attacke trifft.",
    "Eiszahn": "Kontakt, Nah. 4+ Erfolge: Das Ziel wird Verbrannt und schreckt zurück.",
    "Dreifach-Axel": "Kontakt, Nah. Wird dreimal ausgeführt, wobei für jede Instanz je eigene GENA-Proben nötig sind und ihnen einzeln ausgewichen werden muss. Verfehlt eine Schadensinstanz, können weitere trotzdem treffen. Die erste Instanz fügt 2W6, die zweite 4W6 und die dritte 6W6 Schaden zu.",
    "Eisspeer": "LV Meter. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    
    // Kampf-Attacken
    "Karateschlag": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Fußkick": "Kontakt, Nah. Der Basisschaden verändert sich je nach Gewicht des Ziels. <= 10 Kilo: 2W6. Bis 25 Kilo: 4W6. Bist 50 Kilo: 6W6. Bis 100 Kilo: 8W6. Bis 200 Kilo: 10W6. Sonst: 12W6.",
    "Sprungkick": "Kontakt, Nah. Wenn die Attacke nicht trifft, geht der Anwender zu Boden und nimmt 25% seiner max KP als Rückstoßschaden. Dieser Schaden kann keine Wunden verursachen und den Anwender nicht besiegen.",
    "Turmkick": "Kontakt, Nah. Wenn die Attacke nicht trifft, geht der Anwender zu Boden und nimmt 25% seiner max KP als Rückstoßschaden. Dieser Schaden kann keine Wunden verursachen und den Anwender nicht besiegen.",
    "Doppelkick": "Kontakt, Nah. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen.",
    "Dreifachkick": "Kontakt, Nah. Wird dreimal ausgeführt, wobei für jede Instanz je eigene GENA-Proben nötig sind und ihnen einzeln ausgewichen werden muss. Verfehlt eine Schadensinstanz, können weitere trotzdem treffen. Die erste Instanz fügt 1W6, die zweite 2W6 und die dritte 3W6 Schaden zu.",
    "Kreuzhieb": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Nahkampf": "Kontakt, Nah. Der Anwender verausgabt sich bei einem Treffer total und verliert LV VERT und SP VERT.",
    "Überwurf": "Kontakt, Nah. Priotität -1. Kann nicht verfehlen, kann aber ausgewichen werden, und wirft das Ziel hinter den Anwender. Funktioniert nur gegen Ziele, die leichter sind als der Anwender.",
    "Wuchtschlag": "Die GENA-Probe für diese Attacke wird mit der Hälfte der Würfel gewürfelt (aufgerundet). Kontakt, Nah. Das Ziel wird Verwirrt.",
    "Durchbruch": "Kontakt, Nah. Ignoriert und entfernt alle schützenden Effekte (Lichtschild, Barriere, Schutzschild...).",
    "Steigerungshieb": "Kontakt, Nah. Bei Treffer: Der Anwender erhält +LV ANG.",
    "Konter": "REAKTION: Kann nur in Reaktion auf eine Attacke mit Kontakt eingesetzt werden. Der Angreifer nimmt doppelt so viel Schaden wie der Anwender. Er kann eine Probe auf GENA + Kampfsport ablegen, um stattdessen nur denselben Schaden zu nehmen.",
    "Wuchtschlag": "Kontakt, Nah. Die GENA-Probe für diese Attacke wird mit der Hälfte der Würfel gewürfelt (aufgerundet). Das Ziel wird Verwirrt.",
    "Vakuumwelle": "LV Meter. Priorität. PA-Proben gegen diese Attacke werden nur mit der halben Anzahl Würfeln gewürfelt.",
    "Ableithieb": "Kontakt, Nah. Der Anwender heilt sich um 50% des angerichteten Schadens. Kann auch auf besiegte Ziele eingesetzt werden, um sich pro Runde um 4W6 KP zu heilen.",
    "Fußtritt": "Kontakt, Nah. Das Ziel kommt ins Stolpern und verliert LV Initiative.",
    "Aurasphäre": "Lv Meter. Kann nicht danebengehen, kann aber ausgewichen werden.",
    "Kraftwelle": "Kontakt, Nah. 3+ Erfolge: Das Ziel wird Paralysiert.",
    "Fokusstoß": "LV Meter. GENA-Probe wird mit 3 Würfeln weniger gewürfelt. 3+ Erfolge: Das Ziel verliert LV SP VERT.",
    "Gegenstoß": "Kontakt, Nah. Wenn der Anwender in dieser Runde bereits Schaden von einer gegnerischen Attacke genommen hat, erhöht sich der Grundschaden um 5W6. Wenn er Schaden durch das Ziel genommen hat, erhöht sich der Schaden noch mal um 5W6.",
    "Drillingspfeile": "LV Meter. Landet bei 3+ Erfolgen Volltreffer.",
    "Bergsturm": "Kontakt, Nah. Landet automatisch Volltreffer, wenn die Attacke trifft.",
    "Zertrümmerer": "Kontakt, Nah. 2+ Erfolge: Verteidigung des Ziels sinkt um LV.",
    "Vergeltung": "Kontakt, Nah. Fügt +1W6 zusätzlichen Schaden für jedes verbündete Pokemon zu, das in diesem Kampf bisher besiegt wurde, und nochmal +3W6 für jedes, das vom Ziel besiegt wurde.",
    "Überkopfwurf": "Solange das Ziel nicht mehr wiegt als der Anwender: Es wird bis zu LV Meter weit in einer geraden Linie vom Anwender weggeschleudert. Wird ein Pokemon gegen seinen Trainer geschleudert, wird es automatisch in seinen Pokeball zurückgeholt.",
    "Kraftkoloss": "Kontakt, Nah. Der Anwender verausgabt sich bei einem Treffer total und verliert LV ANG und VERT.",
    "Tempohieb": "AKTION: Kontakt, Nah. Priorität, der Anwender kann eine zusätzliche Bewegung vor oder nach der Attacke ausführen. REAKTION: Der Anwender weicht automatisch einer Nah-Attacke aus, muss aber nächste Runde seine Aktion überspringen.",
    "Protzer": "Erhöht ANG und VERT des Anwenders je um LV. Der Anwender kann anschließend sofort eine Nah-Attacke als zusätzliche Aktion durchführen, die dann aber +2 automatische Patzer hat.",
    "Fersenkick": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil. 3+ Erfolge: Das Ziel wird Verwirrt.",
    "Armstoß": "Kontakt, Nah. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",

    // Gift-Attacken
    "Giftstachel": "LV Meter. 3+ Erfolge: Das Ziel wird vergiftet. Hinterlässt eine lange, giftige Nadel im Ziel. Diese muss mit einer Aktion entfernt werden, sonst kann die Vergiftung des Ziels nicht geheilt werden.",
    "Giftschock": "LV Meter. Wenn das Ziel vergiftet ist: +2 automatische Erfolge für die GENA-Probe und der Schaden dieser Attacke wird verdoppelt.",
    "Matschbombe": "LV Meter. 3+ Erfolge: Das Ziel wird vergiftet.",
    "Klärsmog": "Wenn mindestens ein Statuswert des Ziels verändert ist: Diese Attacke kann nicht danebengehen, man kann ihr aber normal ausweichen. Alle Statuswerte des Ziels werden auf ihre Grundwerte zurückgesetzt.",
    "Schlammbad": "LV Meter. 3+ Erfolge: Das Ziel wird vergiftet.",
    "Schlammwoge": "LV Meter. Trifft alle Ziele in einem 90°-Kegel in Reichweite. LV Meter. 3+ Erfolge: Alle getroffenen Ziele werden vergiftet.",
    "Gifthieb": "Kontakt, Nah. 3+ Erfolge: Das Ziel wird Vergiftet.",
    "Giftschweif": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Säure": "LV Meter. Fügt auch Stahl-Pokemon Schaden zu. Tut sehr weg. 3+ Erfolge: Senkt SP VERT um LV.",
    "Säurepanzer": "Der Anwender wird halb-flüssig und erhöht seine VERT um 2xLV. Jedes Ziel, das den Anwender für den Rest des Kampfes berührt, nimmt 10% seiner max KP als Schaden. Wirkt nicht kumulativ.",
    "Toxin": "0.5xLV Meter. Das Ziel wird Schwer Vergiftet.",
    "Giftfalle": "REAKTION: Kann nur eingesetzt werden, wenn der Anwender von einer Nahkampf-Attacke getroffen wird. Senkt ANG, SP ANG und Initiative des Angreifers je um LV und erfordert keine GENA-Probe.",
    "Giftwolke": "Erzeugt eine dicke Wolke aus Giftgas um den Anwender herum. Jedes Ziel innerhalb von LV Metern Entfernung muss eine Widerstand-Probe bestehen oder wird Vergiftet. Die Giftwolke bleibt für bis zu 3 Runden, oder bis sie verweht wird, bestehen. Ziele innerhalb der Giftwolke müssen jede Runde die Widerstand-Probe wiederholen. Vergiftete Ziele in der Giftwolke können ihre Vergiftung durch nichts heilen.",
    "Giftfaden": "LV Meter. Das Ziel wird mit giftigen Fäden umwickelt, wodurch es unbeweglich wird. Es verliert LV Initiative und BW. Außerdem wird es Vergiftet.",
    "Bunker": "REAKTION: Kann nur in Reaktion auf eine physische Nah-Attacke eingesetzt werden. Der Schaden der Attacke wird halbiert (aufgerundet) und der Angreifer Vergiftet.",
    "Unheilsklauen": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    
    // Boden-Attacken
    "Erdbeben": "5xLV Meter. Trifft alle Ziele in Reichweite, die Bodenkontakt haben. Zu versuchen, dieser Attacke auszuweichen, kostet keine Reaktion. Statt PA + Ausweichen kann auch KÖ + Springen gewürfelt werden.",
    "Erdkräfte": "LV Meter. Erde schießt aus dem Boden und trifft auch fliegende Ziele in großer Höhe. 3+ Erfolge: Das Ziel verliert LV SP VERT.",
    "Schaufler": "Der Anwender gräbt sich in den Boden ein. Er kann sich, solange er eingegraben ist, in halber Geschwindigkeit durch den Boden bewegen. Befindet er sich in Nahkampf-Reichweite zu einem Ziel, kann er als Aktion oder Reaktion aus dem Boden springen und das Ziel tatsächlich mit dieser Attacke angreifen. Kontakt, Nah.",
    "Geofissur": "Trifft nur bei 4+ Erfolgen und nur, wenn das Ziel den Boden berührt und nicht mehr als das doppelte Level des Anwenders hat. Das Ziel wird in den Boden gerissen und sofort besiegt.",
    "Pferdestärke": "Kontakt, Nah. Fügt doppelten Schaden zu, solange der Anwender geritten wird, erfordert dann aber eine Reiten-Probe vom Reiter, um nicht abgeworfen zu werden. Schwierigkeit variiert nach Kampfsituation!",
    "Sandwirbel": "LV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite, die in die grobe Richtung des Anwenders sehen, und senkt ihre Initiative um 2, auf ein Minimum von 1.",
    "Lehmschelle": "LV Meter. Reduziert die GENA des Ziels um 2, auf ein Minimum von 1. Hat nur einen Effekt auf Ziele mit Bodenkontakt. Statt PA + Ausweichen kann auch KÖ + Springen gewürfelt werden.",
    "Sandsturm": "Ändert das Wetter zu Sandsturm. Wenn bereits ein Sandsturm herrscht, wird stattdessen ALLEN Zielen, außer Boden-, Gestein- und Stahl-Pokemon, 20% ihrer max KP zugefügt. Hierauf kann nicht reagiert werden, aber Ziele erhalten eine Widerstand-Probe gegen die GENA-Probe des Angreifers, um dem Schaden zu widerstehen.",
    "Tausend Pfeile": "LV Meter. Trifft alle Ziele, die der Anwender sehen kann, und wirft sie zu Boden, sodass sie geerdet sind. Beendet Effekte wie Magnetflug vorzeitig und durchbricht alle schützenden Effekte wie Barriere und Schutzschild.",
    "Knochenkeule": "Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Knochmerang": "0.5xLV Meter. Trifft zweimal, wobei nur eine GENA-Probe für beide Instanzen gewürfelt wird und man mit einer PA-Probe beiden Instanzen ausweicht. Landet bereits bei 3+ Erfolgen Volltreffer.",
    "Tausend Wellen": "Kontakt, Nah. Der Anwender kann vor dieser Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. Das Ziel wird in den Boden gepinnt und kann sich nicht von der Stelle bewegen, bis es eine Stärke-Probe mit Schwierigkeit 3 Schafft (diese kann je einmal für eine Aktion, Reaktion und Bewegung versucht werden) oder es mit einer Attacke wie Teleport entkommt.",
    "Abgrundsklinge": "LV Meter. Trifft auch fliegende/schwebende Ziele bis zu 3 Meter über dem Boden.",
    "Schlagbohrer": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer. Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen.",
    "Schmetterramme": "Kontakt, Nah. Der Anwender verausgabt sich bei einem Treffer total und verliert LV VERT und SP VERT.",
    "Lehmschuss": "LV Meter. Reduziert die Initiative des Ziels um LV. Hat nur einen Effekt auf Ziele mit Bodenkontakt. Statt PA + Ausweichen kann auch KÖ + Springen gewürfelt werden.",
    "Fruststampfer": "Kontakt, Nah. Wenn der Anwender letzte Runde nicht getroffen hat oder seine Attacke anderweitig fehlgeschlagen ist, verdoppelt sich der Schaden dieser Attacke.",
    "Knochenhatz": "Nah. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    
    // Flug-Attacken
    "Flügelschlag": "Kontakt, Nah.",
    "Windschnitt": "LV Meter. Landet bei 3+ Erfolgen Volltreffer.",
    "Luftschnitt": "LV Meter. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Orkan": "Entfernt alle Wettereffekte und trifft alle Ziele in LV Metern Reichweite um den Anwender herum. Wenn das Wetter zuvor Regen war: +2 Erfolge auf die GENA-Probe. 3+ Erfolge: Alle getroffenen Ziele werden Verwirrt. Diese Attacke kann nur eingesetzt werden, solange ein besonderes Wetter vorherrscht.",
    "Sturzflug": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Fliegen": "Kontakt, Nah. Der Anwender fliegt hoch in die Luft. In der nächsten Runde rammt er ein Ziel als eigentliche Attacke. In beiden Runden kann der Anwender je eine zusätzliche Bewegung vor der Attacke ausführen.",
    "Himmelsfeger": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer. Muss erst eine Runde aufgeladen werden. Die GENA-Probe erhält +2 automatische Erfolge.",
    "Sprungfeder": "Kontakt, Nah. Der Anwender springt hoch in die Luft. Für diese Attacke wird GENA + Springen gewürfelt. Der Anwender kommt erst am Ende der Runde an der dann aktuellen Position seines zuvor designierten Ziels wieder runter, um dieses anzugreifen. Wenn das Ziel nicht maximal BW Meter weit entfernt ist, geht die Attacke automatisch daneben.",
    "Aero-Ass": "Kontakt, Nah. Trifft immer, kann aber ausgewichen werden.",
    "Wirbelwind": "Entfernt mit einem gewaltigen, monodirektionalen Windstoß alle Objekte, die in einem 45°-Kegel in bis zu 2xLV Metern Entfernung platziert waren (Stachler, Tarnsteine, Klebenetz usw.). Außerdem werden alle Ziele, die nicht deutlich schwerer sind als der Anwender, in einer geraden Linie bis zu 3xLV Meter weit weggeschleudert. Pokemon, die dabei gegen ihre Trainer geworfen werden, kehren automatisch in ihre Pokebälle zurück.",
    "Rückenwind": "Erzeugt einen 5 Runden anhaltenden, starken monodirektionalen Wind. Alle Pokemon, Freund wie Feind, die diesen Wind im Rücken haben, erhalten + LV Initiative.",
    "Daunenreigen": "2 Meter. Hüllt ein Ziel in ein Meer von dicken Federn. Das Ziel kann sich dadurch schlecht bewegen; seine BW und Initiative werden halbiert und es verliert LV ANG.",
    "Freier Fall": "Kontakt, Nah. Der Anwender packt ein Ziel und hebt es hoch in die Luft. Erfordert, dass der Anwender das Ziel heben und sich in die Luft bewegen kann. Zu Beginn der nächsten Runde wird das Ziel losgelassen und kracht auf den Boden, was den Schaden dieser Attacke zufügt. Pro 20 BW des Anwenders noch mal +1W6 Fallschaden.",
    "Akrobatik": "Kontakt, Nah. Wenn der Anwender kein Item trägt, fügt diese Attacke doppelten Schaden zu und kann in dieser Runde eine zusätzliche Reaktion zum Ausweichen ausführen.",
    "Doppelflügel": "Kontakt, Nah. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen.",
    "Luftstoß": "LV Meter. Landet bei 3+ Erfolgen Volltreffer.",
    "Zenitstürmer": "Kontakt, Nah. Der Anwender verausgabt sich bei einem Treffer total und verliert LV VERT und SP VERT.",
    "Pflücker": "Kontakt, Nah. Wenn das Ziel etwas Essbares bei sich trägt (z.B. eine Beere), frisst der Anwender es und erhält die entsprechenden Effekte/Boni.",
    
    // Psycho-Attacken
    "Konfusion": "Sichtweite. Lässt ein Ziel, das maximal 10xLV Kilo wiegt, schweben und kann es bis zu in Jogging-Geschwindigkeit beliebig bewegen. Die Attacke kann ein Ziel entweder festhalten, wogegen dieses eine Stärke-Probe würfeln muss, um auszubrechen, es gegen seinen Willen bewegen, oder ihm den Schaden dieser Attacke zufügen, indem es in eine Wand oder in den Boden gerammt wird.",
    "Psychokinese": "Sichtweite. Erfordert Augenkontakt. Fügt dem Geist eines Ziels empfindliche Schmerzen zu und senkt für die Dauer des Kampfes seinen WI-Wert und alle davon abhängigen Werte um 2, auf ein Minimum von 0. Bei 3+ Erfolgen sinkt außerdem SP VERT des Ziels um LV.",
    "Psystrahl": "LV Meter. 3+ Erfolge: Das Ziel wird Verwirrt.",
    "Traumfresser": "Hat nur einen Effekt, wenn das Ziel schläft. Der Anwender heilt sich um den gesamten angerichteten Schaden und wird außerdem je nach Größe des Ziels gesättigt.",
    "Hypnose": "Das Ziel muss eine Probe auf WI + Widerstand bestehen oder schläft ein. Diese Probe kostet keine Reaktion.",
    "Psychoschock": "LV Meter. Verwendet VERT des Ziels für die Schadensberechnung statt SP VERT.",
    "Gedankengut": "Erhöht  SP ANG und SP VERT des Anwenders je um LV. Der Anwender kann anschließend sofort eine spezielle Attacke als zusätzliche Aktion durchführen, die dann aber +2 automatische Patzer hat.",
    "Psywelle": "LV Meter. Füge 1W100 Schaden pro 30 volle Level des Pokemon, +1W100 zu.",
    "Lichtschild": "3 Meter. Erzeugt eine bis zu 3 Meter breite, 2 Meter hohe Wand aus Licht in Sicht und in Reichweite. Spezielle Attacken, die die Wand passieren, fügen 50% weniger Schaden zu (aufgerundet). Die Wand hat keinerlei physische Komponente und kann mühelos passiert werden. Sie leuchtet schwach.",
    "Reflektor": "3 Meter. Erzeugt eine bis zu 3 Meter breite, 2 Meter hohe Wand aus gehärtetem Licht in Sicht und in Reichweite. Physische Attacken, die die Wand passieren, fügen 50% weniger Schaden zu (aufgerundet). Die Wand ist fest und kann nur schwer passiert werden, eine Bewegung durch sie hindurch kostet 30 BW, oder den kompletten Rest, falls weniger BW-Punkte übrig sind. Sie leuchtet schwach.",
    "Trickbetrug": "LV Meter. Der Anwender tauscht sofort per Teleportation sein eigenes Item mit dem eines Ziels in Reichweite, das er sehen kann. Funktioniert nur, wenn beide ein Item tragen und physisch in der Lage sind, das Item des jeweils anderen zu tragen. Trägt das Ziel mehrere Items, wird zufällig bestimmt, welches getauscht wird!",
    "Telekinese": "LV Meter. Gibt einem Ziel in Reichweite, das der Anwender sehen kann, oder dem Anwender selbst für bis zu eine Minute (6 Runden) die Fähigkeit, Kraft seiner Gedanken frei zu schweben. Das Ziel kann bis zu sein eigenes Körpergewicht tragen und dabei schweben. Funktioniert nur bei Zielen, die maximal 20xLV Kilo wiegen.",
    "Wunderraum": "Verzerrt für 5 Runden den Raum der Umgebung (3xLV Meter vom Anwender in alle Richtungen) und sorgt für seltsame pinke Partikel und verwirrende Interaktionen zwischen Attacken und Körpern. Physische Attacken benutzen den gegnerischen SP VERT-Wert und spezielle den VERT-Wert.",
    "Zen-Kopfstoß": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Psychoklinge": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Herzstempel": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Psybann": "LV Meter. Alle Statuseffekte des Anwenders werden auf das Ziel übertragen, sofern dieses nicht gegen sie immun und noch nicht von ihnen betroffen ist.",
    "Prisma-Laser": "LV Meter. Trifft alle Ziele in einer geraden Linie in Reichweite. Wenn diese Attacke nicht mindestens ein Ziel besiegt, muss der Anwender eine Runde aussetzen.",
    "Auraschwingen": "LV Meter. Landet bei 3+ Erfolgen Volltreffer.",
    "Krafttrick": "Der Anwender tauscht seine aktuellen ANG- und VERT-Werte. Statt einer Aktion kann auch eine Reaktion oder Bewegung ausgegeben werden, um diese Attacke einzusetzen.",
    "Krafttausch": "Nah. Statt PA + Ausweichen kann das Ziel auch KÖ + Widerstand gegen die Attacke würfeln, was dann keine Reaktion kostet. Sonst werden die aktuellen ANG- und SP-ANG-Werte von Anwender und Ziel vertauscht. Ein hiervon getroffenes Ziel kann jederzeit eine Aktion verwenden, um seine ANG- und SP-ANG-Werte zurückzubekommen.",
    "Kosmik-Kraft": "Erhöht VERT und SP VERT des Anwenders je um LV. Der Anwender kann anschließend sofort eine Status-Attacke als zusätzliche Aktion durchführen, die dann aber +2 automatische Patzer hat.",
    "Seitentausch": "REAKTION: Der Anwender tauscht sofort seine Position mit der eines willigen Ziels. Erfordert keine Probe und kann in Reaktion auf Attacken eingesetzt werden, um das getroffene Ziel zu ändern.",
    "Doppelstrahl": "LV Meter. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen.",
    "Psychofeld": "Breitet für 5 Runden mysteriöse Schwingungen über dem kompletten Kampffeld aus. Solange die Schwingungen aktiv sind, schlagen alle Attacken mit erhöhter Priorität, die Ziele mit Bodenkontakt ausführen, automatisch fehl. Außerdem fügen Psycho-Attacken, die in dem Feld eingesetzt werden, 50% mehr Schaden zu.",

    // Käfer-Attacken
    "Käferbiss": "Kontakt, Nah. Wenn das Ziel etwas Essbares bei sich trägt (z.B. eine Beere), frisst der Anwender es und erhält die entsprechenden Effekte/Boni.",
    "Kreuzschere": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Ampelleuchte": "LV Meter. 3+ Erfolge: Das Ziel wird Verwirrt.",
    "Kehrtwende": "Kontakt, Nah. Der Anwender kann vor und muss nach der Attacke sofort eine zusätzliche Bewegung ausführen, wobei die Bewegung nach der Attacke so nah an seinem Trainer enden muss wie möglich, dalls er einen hat. Schafft der Anwender es zurück zu seinem Trainer, wird er sofort zurückgerufen und gegen ein anderes Pokemon ausgetauscht.",
    "Silberhauch": "LV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite. 4+ Erfolge: ANG, VERT, SP ANG, SP VERT und Initiative + LV.",
    "Käfergebrumm": "LV Meter. Trifft alle Ziele in Reichweite, die den Anwender hören können. Erfolgreiche PA-Proben gegen diese Attacke stellen dar, sich die Ohren fest zuzuhalten. 3+ Erfolge: Alle getroffenen Ziele verlieren LV SP VERT.",
    "Fadenschuss": "LV Meter. Das Ziel wird mit Fäden umwickelt, wodurch es unbeweglich wird. Es verliert LV Initiative und BW.",
    "Giftstreich": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Nadelrakete": "LV Meter. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Plage": "LV Meter. Das Ziel und alle Ziele in direkter Nähe werden in einem großen Strudel aus Käfern gefangen, der 5 Runden hält. Sie nehmen 25% max KP-Schaden und von Käfern bedeckt, wenn sie den Strudel durchbrechen. Ein so bedecktes Ziel nimmt jede Runde 5% seiner max KP als Schaden, bis es die Käfer loswird. Die Attacke kann auch auf Objekte oder den leeren Raum eingesetzt werden, um einfach Strudel zu erzeugen.",
    "Anfallen": "Kontakt, Nah. Der Anwender kann vor der Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. Das Ziel verliert LV ANG.",
    "Pollenknödel": "LV Meter. Hüllt ein Ziel in dichte Pollen. Gegner nehmen den Schaden dieser Attacke, Verbündete werden stattdessen um den Schaden geheilt.",
    "Schlagbefehl": "LV Meter. Landet bei 3+ Erfolgen Volltreffer. Erzeugt eine Armee von 2W6 Wadribie-Tokens, die im Kampf bestehen bleiben. Pro Wadribie-Token werden künftige Schlagbefehle um 1W4 stärker. Wadribie-Tokens haben 1 KP und können normal angegriffen werden.",
    "Blockbefehl": "REAKTION: Erzeugt sofort eine Armee von 2W6 Wadribie-Tokens, die im Kampf bestehen bleiben. Pro Wadribie-Token werden künftige Schlagbefehle um 1W4 stärker. Wadribie-Tokens haben 1 KP und können normal angegriffen werden. Eine eingehende Attacke richtet XW6 weniger Schaden an, wobei X die Summe aller aktuellen Wadribie-Tokens ist. Je nach Attacke werden dabei Wadribie-Tokens zerstört.",
    "Heilbefehl": "Erzeugt sofort eine Armee von 2W6 Wadribie-Tokens, die im Kampf bestehen bleiben. Pro Wadribie-Token werden künftige Schlagbefehle um 1W4 stärker. Wadribie-Tokens haben 1 KP und können normal angegriffen werden. Alle aktiven Wadribie-Tokens umschwärmen den Anwender und heilen ihn jeweils um 1W6 KP.",
    "Blutsauger": "Kontakt, Nah. Der Anwender heilt sich um 50% des angerichteten Schadens. Kann auch auf Leichen oder besiegte Ziele eingesetzt werden, um sich pro Runde um 4W6 KP zu heilen.",
    "Duonadel": "Kontakt, Nah. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen. 3+ Erfolge auf einer Instanz: Das Ziel wird Vergiftet.",
    "Überrumpler": "Kontakt, Nah. Priorität +2. Wenn das Ziel den Angreifer NICHT während des gesamten Kampfes noch nicht bewusst bemerkt hat (er ist gerade erst dazugekommen oder war bisher versteckt/passiv), schlägt diese Attacke fehl.",
    
    // Gestein-Attacken
    "Steinwurf": "LV Meter. Erzeugt einen einzelnen großen Stein oder wirft ein passendes Objekt.",
    "Steinkante": "LV Meter. Landet bei 3+ Erfolgen Volltreffer. Lässt Felsen aus dem Boden schießen, kann das Terrain verändern.",
    "Steinhagel": "LV Meter. Erzeugt große Felsen aus dem Nichts und lässt diese auf ein 3x3 Meter großes Zielgebiet, dessen Zentrum in Reichweite sein muss, herabregnen. 3+ Erfolge: Alle getroffenen Ziele schrecken zurück.",
    "Felswerfer": "LV Meter. Erzeugt einen gewaltigen Felsen und schmeißt diesen nach dem Ziel. Trifft auch Ziele in direkter Nähe des ursprünglichen Ziels. Wenn diede Attacke nicht mindestens ein Ziel besiegt, muss der Anwender eine Runde aussetzen.",
    "Antik-Kraft": "LV Meter. Wirft mit mystischen Kräften Steine oder andere schwere und/oder sperrige Objekte auf ein Ziel. 4+ Erfolge: ANG, VERT, SP ANG, SP VERT und Initiative + LV.",
    "Juwelenkraft": "LV Meter. Erzeugt und hinterlässt eine Handvoll wunderschöner, aber wetloser Halbedelsteine.",
    "Felsgrab": "LV Meter. Hebt Felsen oder andere schwere/sperrige Objekte in der Umgebung an und begräbt das Ziel darunter. Das Ziel verliert LV Initiative und muss sich erst aus dem Grab befreien, um sich überhaupt wieder bewegen zu können. Das erfordert eine Aktion, Reaktion oder Bewegung.",
    "Tarnsteine": "Erzeugt schwebende, halb-unsichtbare Steine in einem Gebiet mit bis zu (LV / 10 (aufgerundet)) Durchmesser, dessen Zentrum in Reichweite ist. Jedes Ziel, außer dem Anwender, das das Gebiet betritt oder sich darin bewegt, nimmt 20% seiner max KP als Gestein-Schaden.",
    "Sandgrab": "LV Meter. Das Ziel und alle Ziele in direkter Nähe werden in einem großen Sand-Strudel gefangen, der 5 Runden hält. Sie nehmen 25% max KP-Schaden und werden LV Meter weit in eine zufällige Richtung geschleudet, wenn sie den Strudel durchbrechen. Die Attacke kann auch auf Objekte oder den leeren Raum eingesetzt werden, um einfach Strudel zu erzeugen.",
    "Sanctoklinge": "Nah. Ignoriert alle Stärkungen der VERT des Ziels und durchbricht alle defensiven Effekte wie Reflektor, Lichtschild und Schutzschild.",
    "Diamantsturm": "LV Meter. Trifft alle Ziele in einem 45-Kegel in Reichweite. Pro getroffenem Ziel erhält der Anwender +0.5xLV VERT.",
    "Kopfstoß": "Kontakt, Nah, Anwender kann vor Attacke sofort eine zusätzliche Bewegung auf das Ziel zu ausführen. 50% Recoil.",
    "Felsaxt": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",    
    "Walzer": "Kontakt, Nah. Rollt auf ein Ziel zu. Wenn zuvor eingeigelt: Doppelter Schaden. Walzer muss solange wiederholt werden, bis der Anwender in ein Objekt kracht oder langsam (über mehrere Runden!) ausrollt. Jede Walzer-Runde erhöht den Schaden um 3W6. Kein Limit! Mit jedem Einsatz (davor und/oder danach) MUSS der Anwender insgesamt seine volle BW in Metern an Strecke zurücklegen! Zu verfehlen beendet weder die Attacke, noch die Kombo. Kritische Patzer ab -3 können den Angreifer aber in Objekte krachen und so (mit Schaden) die Attacke abbrechen lassen.",
    "Rundumschutz": "REAKTION: Springt in den Weg einer Attacke, die mehrere Ziele treffen würde, und negiert diese vollständig. Erfordert eine Probe auf PA + Widerstand, sonst erleidet nur der Anwender den vollen Schaden/Effekt der abgewehrten Attacke.",
    "Turbofelsen": "LV Meter. Priorität. PA-Proben gegen diese Attacke werden nur mit der halben Anzahl Würfeln gewürfelt.",
    "Felswurf": "LV Meter. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",

    // Geist-Attacken
    "Nachtnebel": "3xLV Meter. Trifft alle Ziele in einem 3x3 Meter großen Gebiet, dessen Zentrum in Reichweite sein muss. Fügt immer 3xLV Schaden zu.",
    "Konfusstrahl": "2xLV Meter. Statt PA + Ausweichen kann das Ziel auch KÖ + Widerstand gegen die Attacke würfeln, was dann keine Reaktion kostet. Sonst wird das Ziel Verwirrt.",
    "Spukball": "LV Meter. 3+ Erfolge: Das Ziel verliert LV SP VERT.",
    "Dunkelklaue": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Fluch": "Der Anwender beginnt ein aufwändiges Ritual. Dieses dauert bis zum Ende der nächsten Runde und kostet ihn seine nächste Aktion. Außerdem kann der Anwender, solange er das Ritual ausführt, sich weder bewegen noch angreifen. Das Ziel muss, wenn das Ritual beginn, in Sichtweite sein, danach aber nicht mehr. Ist der Anwender nach der nächsten Runde nicht besiegt, wird das Ziel Verflucht.",
    "Nachtmahr": "Hat nur einen Effekt auf schlafende Pokemon. Alle schlafenden Pokemon in maximal LV Metern Entfernung erleiden Alpträume und nehmen, solange sie schlafen, nach jeder ihrer Runden 25% ihrer max KP als Schaden.",
    "Nachspiel": "REAKTION: Wird eingesetzt, wenn ein Gegner den Anwender mit einer Attacke trifft. Der Gegner kann diese Attacke für den Rest des Kampfes nicht mehr einsetzen. War bereits eine Attacke des Gegners blockiert, wird deren Blockierung dadurch aufgehoben.",
    "Bürde": "LV Meter. Der Schaden dieser Attacke erhöht sich um 4W6 pro negativem Statuseffekt, von dem das Ziel betroffen ist.",
    "Phantomkraft": "Kontakt, Nah. Der Anwender designiert ein Ziel, das er sehen kann. Er verschwindet in einer anderen Dimension. Am Ende der nächsten Runde erscheint er an der aktuellen Position des Ziels trifft dieses automatisch. Diese Attacke kann weder danebengehen, noch kann man ihr ausweichen; andere Reaktionen sind möglich. Kann nur einmal pro Ziel in einem Kampf eingesetzt werden.",
    "Schattenstoß": "Reichweite so weit, wie Schatten reichen. Der Anwender kann sich, statt anzugreifen, sofort zu einem beliebigen Ort teleportieren, der via Schatten mit seiner aktuellen Position verbunden ist. Wirkungslos in kompletter Dunkelheit.",
    "Poltergeist": "Der Anwender weiß immer automatisch, ob und was für Items alle Ziele in Sichtweite tragen. LV Meter. Ergreift Besitz vom getragenen Item des Ziels und greift dieses damit an. Schlägt fehl, wenn das Ziel kein Item trägt.",
    "Schattenfessel": "LV Meter. Das Ziel wird mit einer Kette aus Schatten am Boden festgekettet und kann sich nicht mehr als einen Meter davon wegbewegen. Es kann nicht ausgewechselt werden, bis es sich mit einer Stärke-Probe oder einer Attacke wie Teleport von der Fessel befreit.",
    "Unheilböen": "LV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite. 4+ Erfolge: ANG, VERT, SP ANG, SP VERT und Initiative + LV.",
    
    // Drachen-Attacken
    "Drachenwut": "Fügt Pokemon immer 120 und Menschen 30 Schaden zu, kann aber keine Wunden verursachen.",
    "Drachenklaue": "Kontakt, Nah.",
    "Draco Meteor": "Designiert einen 3x3 Meter großen Zielbereich, dessen Zentrum maximal LV Meter weit entfernt sein darf und den der Anwender sehen können muss. Am Ende der nächsten Runde kracht an der Stelle ein Meteor vom Himmel und fügt allen Zielen in dem Gebiet Schaden zu. SP ANG sinkt um LV.",
    "Drachenpuls": "LV Meter.",
    "Drachenrute": "Solange das Ziel nicht mehr wiegt als der Anwender: Es wird bis zu LV Meter weit in einer geraden Linie vom Anwender weggeschleudert. Wird ein Pokemon gegen seinen Trainer geschleudert, wird es automatisch in seinen Pokeball zurückgeholt.",
    "Drachentanz": "Der Anwender würfelt Tanzen statt GENA. Bei Erfolg: ANG + LV und Initiative + LV. Bei Misserfolg: ANG + LV.",
    "Drachenstoß": "Kontakt, Nah. Die GENA-Probe für diese Attacke wird mit 2 Würfeln weniger gewürfelt. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Schuppenrasseln": "LV Meter. Der Anwender verschießt seine Schuppen und wird dadurch teilweise nackt. Er verliert LV VERT. Kann nur eingesetzt werden, solange die VERT größer ist als LV.",
    "Breitseite": "Kontakt, Nah. Trifft alle Ziele in Nahkampfreichweite mit einem ausladenden Schwungangriff. Getroffene Ziele verlieren LV ANG.",
    "Raumschlag": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Feuerodem": "LV Meter. 3+ Erfolge: Das Ziel wird Paralysiert.",
    "Wutanfall": "Kontakt, Nah, der Angreifer muss diese Attacke solange hintereinander ausführen, wie es physisch in der Lage ist und Gegner in Nahkampfreichweite hat. Es kann sich in dieser Zeit nicht von Gegnern wegbewegen.",
    "Windhose": "10xLV Meter. Erzeugt einen gewaltigen Wirbelwind, der sich für die nächsten 10 Runden pro Runde um LV Meter in einer geraden Linie vom Anwender wegbewegen wird. Jedes Ziel, das die Windhose erfasst, nimmt den Schaden dieser Attacke und wird LV Meter weit in eine zufällige Richtung geschleudert. Kracht es dabei gegen ein Hindernis, nimmt es 6W6 zusätzlichen Schaden. Kracht es gegen ein anderes Ziel, nehmen beide 6W6 zusätzlichen Schaden.",
    "Zeitenlärm": "LV Meter. Trifft alle Ziele in Reichweite. Wunden, die durch diese Attacke ausgelöst werden, können nicht geheilt werden. Wenn diese Attacke nicht mindestens ein Ziel besiegt, muss der Anwender eine Runde aussetzen.",
    "Doppelhieb": "Kontakt, Nah. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen.",
    "Drachenpfeile": "LV Meter. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen. Instanzen, die nicht treffen, erschaffen stattdessen temporäre Dreepy-Tokens, die als LV-5-Dreepies an der Seite des Anwenders kämpfen, bis sie besiegt werden.",
    "Schuppenschuss": "LV Meter. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",

    // Unlicht-Attacken
    "Biss": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Knirscher": "Kontakt, Nah. 3+ Erfolge: Das Ziel verliert LV VERT.",
    "Finte": "Kontakt, Nah. Trifft immer, kann aber ausgewichen werden.",
    "Finsteraura": "LV Meter. Trifft beliebig viele Ziele in Reichweite. Zu versuchen, dieser Attacke auszuweichen, kostet keine Reaktion. 3+ Erfolge: Getroffene Ziele schrecken zurück.",
    "Nachthieb": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Tiefschlag": "Kontakt, Nah. Priorität. Hat nur einen Effekt, wenn das Ziel letzte Runde physisch angegriffen hat.",
    "Standpauke": "Nah. Trifft beliebig viele Ziele in der direkten Nähe des Anwenders. Getroffene Ziele können statt PA auch WI + Widerstand würfeln; in dem Fall kostet das keine Reaktion, verhindert aber nicht den Schaden. Ziele, die keine Probe schaffen, verlieren LV SP ANG.",
    "Schmarotzer": "Kontakt, Nah. Verwendet den ANG-Wert des Ziels und nicht den des Angreifers.",
    "Raub": "Kontakt, Nah. Bei Treffer: Angreifer würfelt eine Stehlen-Probe. Bei Erfolg: Er stiehlt das getragene Item des Ziels, sofern möglich.",
    "Ränkeschmied": "Der Anwender erhöht seine SP ANG um 2xLV. Er kann anschließend sofort eine andere Attacke als Ränkeschmied mit sich oder einem Verbündeten als Ziel als zusätzliche Aktion ausführen.",
    "Memento-Mori": "Der Anwender fügt sich selbst Schaden zu und besiegt sich mit großem Tamtam. Dabei nimmt er keine Wunden. Alle Gegner in Hörweite werden durch die Show eingeschüchtert und verlieren LV ANG, VERT, SP ANG, SP DEF und Initiative.",
    "Abschlag": "Kontakt, Nah. Wenn das Ziel ein Item trägt, wird dieses weggehauen und diese Attacke fügt doppelten Schaden zu.",
    "Gewissheit": "Kontakt, Nah. Wenn das Ziel in dieser Runde schon Schaden durch eine Attacke genommen hat: Diese Attacke fügt ihm doppelten Schaden zu.",
    "Strafattacke": "Kontakt, Nah. Fügt 6W6 Schaden zu, +2W6 für jede positive Statusveränderung des Ziels.",
    "Klingenschwall": "Kontakt, Nah, landet bei 3+ Erfolgen Volltreffer.",
    "Finstertreffer": "Kontakt, Nah. Landet automatisch Volltreffer, wenn die Attacke trifft.",
    "Finsterfaust": "Nah. Trifft immer, kann aber ausgewichen werden.",
    "Klauenwetzer": "Erhöht ANG Anwenders um LV und GENA um 1. Der Anwender kann anschließend sofort eine Nah-Attacke als zusätzliche Aktion durchführen, die dann aber +2 automatische Patzer hat.",
    "Prügler": "Kontakt, Nah. Trifft einmal für jedes verbündete Pokemon im Kampf, inklusive des Anwenders, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Wirbler": "Kontakt, Nah. Trifft alle Ziele in Nahkampfreichweite und schleudert alle Objekte in der Nähe (Stachler, Tarnsteine usw.) weg und entfernt sie aus dem Kampf.",
    "Verderben": "LV Meter. Das Ziel nimmt Schaden in Höhe der Hälfte seiner aktuellen KP (aufgerundet). Dabei können keine Wunden zugefügt werden.",
    
    // Stahl-Attacken
    "Metallklaue": "Kontakt, Nah. 3+ Erfolge: ANG + LV.",
    "Eisenschweif": "Kontakt, Nah. 3+ Erfolge: Das Ziel verliert LV DEF.",
    "Eisenabwehr": "AKTION: Der Anwender erhält + 2xLV VERT. REAKTION: Der Anwender erhält + LV VERT.",
    "Eisenschädel": "Kontakt, Nah. 3+ Erfolge: Das Ziel schreckt zurück.",
    "Stahlflügel": "Kontakt, Nah. 3+ Erfolge: VERT + LV.",
    "Patronenhieb": "Kontakt, Nah. Priorität, der Anwender kann eine zusätzliche Bewegung vor oder nach der Attacke ausführen.",
    "Turbodreher": "Kontakt, Nah. Trifft alle Ziele in Nahkampfreichweite und schleudert alle Objekte in der Nähe (Stachler, Tarnsteine usw.) weg und entfernt sie aus dem Kampf. REAKTION: Schleudert einen Gegner, der den Anwender mit einer Nahkampf-Attacke trifft, so weit sie möglich in einer geraden Linie weg und halbiert den durch die Attacke erlittenen Schaden.",
    "Gyroball": "Kontakt, Nah. Der Basisschaden skaliert mit der Geschwindigkeit des Anwenders relativ zum Ziel: Der Anwender ist gleich schnell oder schneller: 4W6. Er ist langsamer, aber nicht halb so schnell: 6W6. 0.5x-0.3x so schnell: 8W6. 0-3x-0-25x so schnell: 12W6. Noch langsamer: 15W6.",
    "Metallstoß": "REAKTION: Muss in Reaktion auf eine Attacke eingesetzt werden, wenn der Anwender maximal 3 Meter weit entfernt ist. Ein Teil der Wucht der Attacke wird auf den Angreifer zurückgeworfen, sodass Anwender und Ziel jeweils die Hälfte des eigentlich angerichteten Schadens (aufgerundet) nehmen.",
    "Lichtkanone": "LV Meter. 3+ Erfolge: Das Ziel verliert LV SP VERT.",
    "Stahlstrahl": "3xLV Meter. Der Anwender verliert 50% seiner aktuellen KP (aufgerundet), wenn er diese Attacke einsetzt (auch, wenn sie danebengeht oder pariert wird). Dadurch werden keine Wunden zugefügt.",
    "Riesenhammer": "Nah. Diese Attacke kann nur alle zwei Runden ausgeführt werden. Nachdem diese Attacke einmal ausgeführt und damit 'vorgeführt' wurde, erhalten alle Gegner, die sie gesehen haben, für den Rest des Kampfes +1 automatischen Erfolg auf Parade-Proben gegen sie.",
    "Magnetbombe": "LV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite. Trifft immer, kann aber ausgewichen werden.",
    "Klikkdiskus": "LV Meter. Trifft 1W4 + 1 mal, jede Instanz erfordert eine eigene GENA-Probe, PA-Proben gelten nur gegen einzelne Instanzen. Verfehlt eine einzige Instanz, endet die Attacke sofort.",
    "Panzerfäuste": "Kontakt, LV Meter. Wird zweimal ausgeführt, wobei für beide Instanzen je eigene GENA-Proben nötig sind und beiden einzeln ausgewichen werden muss. Verfehlt die erste Schadensinstanz, kann die zweite trotzdem treffen. 3+ Erfolge auf einer Schadensinstanz: Das Ziel schreckt zurück.",
    
    // Fee-Attacken
    "Feenbrise": "LV Meter. Trifft alle Ziele in einem 45°-Kegel in Reichweite.",
    "Mondgewalt": "LV Meter. 3+ Erfolge: Das Ziel verliert LV SP ANG.",
    "Zauberschein": "0.2xLV Meter. Trifft alle Ziele in Reichweite.",
    "Knuddler": "Kontakt, Nah. Das Ziel wird festgehalten und kann sich nicht bewegen, bis der Anwender es loslässt oder das Ziel in einem eine Stärke-Proben-Wettkampf gegen den Anwender gewinnt oder mittels einer Attacke ausbricht. 3+ Erfolge: Das Ziel verliert LV ANG.",
    "Säuselstimme": "0.5xLV Meter. Trifft alle Ziele in Reichweite, die den Anwender hören können. Kann nicht danebengehen, aber pariert werden, indem man sich die Ohren zuhält (was ganz normal eine Reaktion kostet).",
    "Nebelfeld": "Hüllt das komplette Kampffeld für 5 Runden in dichten, mystischen Nebel. Solange der Nebel aktiv ist, sind alle Pokemon in ihm mit Bodenkontakt immun gegen alle negativen Statuseffekte sowie deren Effekte, werden aber nicht von Effekten geheilt, die sie schon haben. Außerdem nehmen sie halben Schaden von Drachen-Attacken (aufgerundet).",
    "Geokontrolle": "Manipuliert die Schwerkraft in einem Gebiet bis zu 2xLV Meter in allen Richtungen um den Anwender um einen Faktor von bis zu x0.1/x3. Die Einrichtung der Kontrolle dauert zwei ganze Runden. Am Ende der nächsten Runde des Anwenders ist die Schwerkraft verändert und der Anwender erhält +2xLV SP ANG, SP DEF und Initiative.",
    "Naturzorn": "LV Meter. Kann nur gegen Ziele eingesetzt werden, die dem Anwender bereits Schaden zugefügt haben, ODER wenn der Anwender generell wütend ist. Das Ziel nimmt Schaden in Höhe der Hälfte seiner aktuellen KP (aufgerundet). Dabei können keine Wunden zugefügt werden.",
    "Florekur": "Nah. Heilt die KP des Ziels (kann auch der Anwender selbst sein) um 50% ihres Maximums. Im Grasfeld werden die KP stattdessen vollständig geheilt. Kann nur einmal pro Tag außerhalb von Kämpfen eingesetzt werden.",
    "Glitzersturm": "LV Meter. Fügt allen Gegnern in Reichweite Schaden zu und heilt alle Verbündeten in Reichweite von allen negativen Status-Effekten. Der Einsatz dieser Attacke kostet einen Freundschaftspunkt.",
    
    // === HIER WEITERE ATTACKEN HINZUFÜGEN ===
    // Format: "Attackenname": "Beschreibung",
    
};

/**
 * Gibt die Beschreibung einer Attacke zurück
 * @param {string} moveName - Der deutsche Name der Attacke
 * @returns {string} Die Beschreibung der Attacke oder eine Standardnachricht
 */
function getMoveDescription(moveName) {
    if (!moveName || moveName === '') {
        return "Keine Attacke ausgewählt";
    }
    
    // Versuche die Beschreibung aus dem Mapping zu holen
    const description = MOVE_DESCRIPTIONS[moveName];
    
    // Wenn eine Beschreibung existiert und nicht leer ist, gib sie zurück
    if (description && description.trim() !== '') {
        return description;
    }
    
    // Ansonsten gib eine Standardnachricht zurück
    return `Keine Beschreibung für "${moveName}" verfügbar`;
}

/**
 * Prüft, ob eine Attacke eine benutzerdefinierte Beschreibung hat
 * @param {string} moveName - Der deutsche Name der Attacke
 * @returns {boolean} True, wenn eine Beschreibung existiert
 */
function hasMoveDescription(moveName) {
    if (!moveName || moveName === '') {
        return false;
    }
    
    const description = MOVE_DESCRIPTIONS[moveName];
    return description && description.trim() !== '';
}

/**
 * Gibt alle verfügbaren Attacken-Beschreibungen zurück
 * @returns {Object} Das gesamte Beschreibungs-Mapping
 */
function getAllMoveDescriptions() {
    return { ...MOVE_DESCRIPTIONS };
}

/**
 * Fügt eine neue Beschreibung hinzu oder aktualisiert eine bestehende
 * (Nützlich für Runtime-Änderungen, falls gewünscht)
 * @param {string} moveName - Der deutsche Name der Attacke
 * @param {string} description - Die Beschreibung
 */
function setMoveDescription(moveName, description) {
    if (moveName && typeof moveName === 'string') {
        MOVE_DESCRIPTIONS[moveName] = description;
    }
}

// Globale Funktionen verfügbar machen
window.getMoveDescription = getMoveDescription;
window.hasMoveDescription = hasMoveDescription;
window.getAllMoveDescriptions = getAllMoveDescriptions;
window.setMoveDescription = setMoveDescription;

// Exportiere Module für Node.js-Umgebungen, falls benötigt
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getMoveDescription,
        hasMoveDescription,
        getAllMoveDescriptions,
        setMoveDescription,
        MOVE_DESCRIPTIONS
    };
}

console.log("MoveService geladen - Attacken-Beschreibungen verfügbar");