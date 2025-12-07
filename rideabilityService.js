/**
 * RideabilityService
 * ==================
 * Bestimmt ob und wie ein Pokemon geritten werden kann.
 * 
 * Kategorien:
 * - "none"    = Kann nicht geritten werden
 * - "land"    = Reitbar (Land)
 * - "water"   = Reitbar (Wasser) - Surfer + Wasser/Eis-Typ
 * - "flying"  = Reitbar (Fliegend) - Fliegen + Flug-Typ oder Schwebe-Fähigkeit
 * 
 * Priorität: flying > water > land
 * 
 * Algorithmus basiert auf:
 * 1. Körperform (shape) - Hauptkriterium
 * 2. Mindestgröße pro Shape
 * 3. Ei-Gruppe "humanshape" als Ausschluss
 * 4. Whitelist für Sonderfälle (definitiv reitbar)
 * 5. Blacklist für Fehlklassifikationen (definitiv nicht reitbar)
 */
class RideabilityService {
    constructor() {
        // ============================================================
        // WHITELIST: Pokemon die DEFINITIV reitbar sind
        // Format: { pokemonId: "land" | "water" | "flying" }
        // Diese überschreiben den Algorithmus komplett
        // ============================================================
        this.WHITELIST = {
            // Spezialfälle die der Algorithmus falsch einordnen würde
            426: "flying",  // Drifzepeli - Heißluftballon, trotz blob-shape
            143: "land",    // Relaxo - riesig, aber humanoid-ish
            149: "flying",  // Dragoran - humanoid aber klassisches Reittier
            130: "water",   // Garados - serpentine Wassertier
            6: "water",   // Turtok
            131: "water",   // Lapras - DAS klassische Surf-Pokemon
            321: "water",   // Wailord - riesiger Wal
            319: "water",   // Tohaido - Hai
            91: "water",    // Austos - Muschel, aber groß genug
            87: "water",    // Jugong - Seelöwe
            24: "land",     // Arbok
            31: "land",     // Nidoqueen
            34: "land",     // Nidoking
            73: "water",    // Tentoxa
            76: "land",     // Geowaz
            85: "land",     // Dodri
            95: "land",     // Onix
            110: "flying",  // Smogmog
            112: "land",    // Rizeros
            115: "land",    // Kangama
            119: "water",   // Golking
            121: "water",   // Starmie
            134: "water",   // Aquana
            139: "water",   // Amoroso
            141: "water",   // Kabutops
            148: "land",    // Dragonir
            160: "water",   // Impergator
            168: "land",    // Ariados
            171: "water",   // Lanturn
            179: "land",    // Voltilamm
            181: "land",    // Ampharos
            208: "land",    //Stahlos
            224: "water",   // Octillery
            248: "land",    // Despotar
            260: "water",   // Sumpex
            264: "land",    // Geradaks
            306: "land",    // Stolloss
            324: "land",    // Qurtel
            336: "land",    // Vipitis
            337: "flying",  // Lunastein
            338: "flying",  // Sonnfel
            340: "water",   // Welsar
            348: "land",    // Armaldo
            350: "water",   // Milotic
            357: "flying",  // Tropius
            364: "water",   // Seejong
            365: "water",   // Walraisa
            367: "water",   // Aalabyss
            368: "water",   // Saganabyss
            375: "flying",  // Metang
            395: "water",   // Impoleon
            409: "land",    // Rameidon
            423: "water",   // Gastrodon
            430: "flying",  // Kramshef
            437: "flying",  // Bronzong
            452: "land",    // Piondragi
            457: "water",   // Lumineon
            462: "flying",  // Magnezone
            464: "land",    // Rihornior
            465: "land",    // Tangoloss
            466: "land",    // Elevoltek
            476: "flying",  // Voluminas
            484: "land",    // Palkia
            486: "land",    // Regigigas
            488: "flying",  // Cresselia
            497: "land",    // Serpiroyal
            500: "land",    // Flambirex
            503: "land",   // Admurai
            526: "land",    // Brockoloss
            528: "flying",  // Fletiamo
            537: "water",   // Branawarz
            553: "land",    // Rabigator
            558: "land",    // Castellith
            565: "water",   // Karippas
            569: "land",    // Deponitox
            593: "water",   // Apoquallyp
            601: "flying",  // Klikdiklak
            621: "flying",  // Shardrago
            623: "flying",  // Golgantes
            641: "flying",  // Boreos
            642: "flying",  // Voltolos
            645: "flying",  // Demeteros
            646: "land",    // Kyurem
            652: "land",    // Bigaron
            691: "flying",  // Tandrak
            697: "land",    // Monargoras
            706: "land",    // Viscogon
            709: "land",    // Trombork
            730: "water",   // Primarene
            738: "flying",  // Donarion
            740: "land",    // Krawell
            760: "land",    // Kosturso
            768: "land",    // Tectass
            780: "flying",  // Sen-Long
            784: "land",    // Grandiras
            794: "flying",  // Masskito
            797: "flying",  // Kaguron
            799: "land",    // Schlingking
            809: "land",    // Melmetal
            838: "land",    // Wagong
            839: "land",    // Montecarbo
            842: "land",    // Schlapfel
            844: "land",    // Sandaconda
            847: "water",   // Barrakiefa
            851: "land",    // Infernopod
            862: "land",    // Barrikadax
            880: "land",    // Lectragon
            881: "land",    // Lecryodon
            883: "water",   // Pescryodon
            884: "land",    // Duraludon
            887: "flying",  // Katapuldra
            900: "land",    // Axantor
            902: "water",   // Salmagnis
            905: "flying",  // Cupidos
            927: "land",    // Backel
            950: "land",    // Klibbe
            956: "land",    // Psioptera
            965: "land",    // Knattox
            966: "land",    // Knattatox
            968: "land",    // Schlurm
            975: "land",    // Kolowal
            976: "water",   // Agizula
            993: "flying",  // Eisenhals
            995: "land",    // Eisendorn
            998: "land",    // Espinodon
            1001: "land",   // Chongjian
            1005: "flying", // Donnersichel
            1007: "land",   // Koraidon
            1009: "land",   // Windewoge
            1014: "land",   // Okidogi
            1018: "land",   // Briduradon
            10111: "land",   // Alola-Geowaz
            10019: "flying", // Boreos (Tiergeist)
            // 1058 entfernt - keine gültige Pokemon-ID
            10193: "land",   //Coronospa (Ice Rider/Schimmelreiter)
            10194: "flying", // Coronospa (Shadow Rider/Rappenreiter)
            10249: "flying", // Cupidos (Tiergeist)
            10021: "flying", // Demeteros (Tiergeist)
            982: "land",    
            10255: "land",   // Dummimisel (Drei-Segment)
            10175: "land",   // Galar-Geradaks (Linoone)
            10007: "flying", // Giratina (Urform)
            10216: "land",   // GMax-Drapfel
            10225: "land",   // Gmax-Duraludon
            10196: "land",   // GMax-Glurak
            10220: "land",   // GMax-Infernopod
            10204: "water",  // GMax-Lapras
            10201: "land",   // GMax-Machomei
            10208: "land",   // GMax-Melmetal
            10215: "land",   // GMax-Montecarbo
            10222: "land",   // GMax-Olangaar (Grimmsnarl)
            10219: "land",   // GMax-Riffex (Toxtricity)
            10197: "land",   // GMax-Turtok
            10226: "land",   // GMax-Wulaosu (Urshifu Single Strike)
            10022: "land",   // Kyurem Black
            10023: "land",   // Kyurem White
            10127: "water",  // Lusardin Schwarm
            10045: "land",   // Mega-Ampharos
            10090: "land",   // Mega-Bibor
            10089: "flying", // Mega-Brutalanda
            10049: "land",   // Mega-Despotar
            10075: "flying", // Mega-Diancie
            10041: "water",  // Mega-Garados
            10065: "land",   // Mega-Gewaldro
            10034: "flying", // Mega-Glurak X
            10035: "flying", // Mega-Glurak Y
            10039: "land",   // Mega-Kangama
            10058: "land",   // Mega-Knakrack
            10076: "flying", // Mega-Metagross
            10040: "flying", // Mega-Pinsir
            10079: "flying", // Mega-Rayquaza
            10060: "land",   // Mega-Rexblisar
            10047: "land",   // Mega-Skaraborn
            10072: "land",   // Mega-Stahlos
            10053: "land",   // Mega-Stolloss
            10064: "land",   // Mega-Sumpex
            10070: "water",  // Mega-Tohaido
            9: "land",      // Turtok
            10036: "land",   // Mega-Turtok
            10155: "land",   // Necrozma (Abendmähne)
            10156: "flying", // Necrozma (Morgenschwingen)
            10246: "land",   // Palkia (Urform)

            // Legendäre/Mystische die oft als Reittiere dienen
            249: "flying",  // Lugia
            250: "flying",  // Ho-Oh
            384: "flying",  // Rayquaza
            382: "water",   // Kyogre
            383: "land",    // Groudon
            483: "land",    // Dialga
            484: "water",   // Palkia
            487: "flying",  // Giratina
            643: "flying",  // Reshiram
            644: "flying",  // Zekrom
            646: "flying",  // Kyurem
            716: "land",    // Xerneas
            717: "flying",  // Yveltal
            718: "land",    // Zygarde
            791: "land",    // Solgaleo
            792: "flying",  // Lunala
            800: "flying",  // Necrozma
            888: "land",    // Zacian
            889: "land",    // Zamazenta
            890: "flying",  // Eternatus
            898: "land",    // Coronospa
            
            // Weitere klassische Reittiere
            78: "land",     // Gallopa
            59: "land",     // Arkani
            128: "land",    // Tauros
            241: "land",    // Miltank
            229: "land",    // Hundemon
            234: "land",    // Damhirplex
            508: "land",    // Bissbark
            612: "land",    // Maxax (Drache)
            713: "land",    // Avalugg
            
            // Fliegende Drachen
            6: "flying",    // Glurak
            142: "flying",  // Aerodactyl
            373: "flying",  // Brutalanda
            334: "flying",  // Altaria
            445: "flying",  // Knakrack
            635: "flying",  // Trikephalo
            
            // Große Vögel
            18: "flying",   // Tauboss
            22: "flying",   // Ibitak
            164: "flying",  // Noctuh
            169: "flying",  // Iksbat
            227: "flying",  // Panzaeron
            277: "flying",  // Schwalboss
            398: "flying",  // Staraptor
            521: "flying",  // Fasasnob
            628: "flying",  // Washakwil
            663: "flying",  // Fiaro
            
            // Psycho/Schwebe-Pokemon die tragen können
            376: "flying",  // Metagross (schwebt)
            437: "flying",  // Bronzong (Schwebe)
        };
        
        // ============================================================
        // BLACKLIST: Pokemon die DEFINITIV NICHT reitbar sind
        // Diese werden nie als reitbar eingestuft, egal was der Algo sagt
        // ============================================================
        this.BLACKLIST = new Set([
            // Zu klein/fragil trotz passender Shape
            2,                  // Bisaknosp
            10, 11, 13, 14,     // Raupy, Safcon, Hornliu, Kokuna
            15,                 // Bibor (zu fragil)
            12,17,              // Smettbo, Tauboga (zu fragil)
            46, 47,             // Paras, Parasek (Pilz-Pokemon)
            48, 49,             // Bluzuk, Omot
            53,                 // Snobilikat
            65,                 // Simsala
            132,                // Ditto
            137,                // Porygon
            233,                // Porygon2
            474,                // Porygon-Z
            201,                // Icognito
            292,                // Ninjatom (Geist einer Hülle)
            152,                // Endivie
            161,                // Wiesor
            165,166,            // Ledyba/Ledian
            207,                // Skorgla
            212,                // Scherox
            449,                // Hippopotas
            507,                // Terribark
            552,                // Rokkaiman
            712,                // Arktip
            898,                // Coronospa
            904,                // Myriador
            986,                // Wutpilz
            987,                // Fluttermane
            988,                // Kriechflügel
            10164,               // Galar-Flegmon
            10229,               // Hisui-Fukano
            10046,               // Mega-Scherox
            
            // Humanoide die der Algo fälschlicherweise als reitbar einstufen könnte
            68,                  // Machomei
            106, 107,            // Kicklee, Nockchan
            122,                 // Pantimos
            124,                 // Rossana
            125, 126,            // Elektek, Magmar
            237,                 // Kapoera
            296, 297,            // Makuhita, Hariyama
            307, 308,            // Meditie, Meditalis
            453, 454,            // Glibunkel, Toxiquak
            532, 533, 534,       // Rotomurf, Strepoli, Meistagrif
            538, 539,            // Jiutesto, Karadonis
            619, 620,            // Lin-Fu, Wie-Shu
            674, 675,            // Pam-Pam, Pandagro
            701,                 // Resladero
            739, 740,            // Krabbox, Krawell
            
            // Unterirdisch lebende Pokemon
            50, 51,              // Digda, Digdri
            
            // Geister/Formlose die nicht tragen können
            92, 93, 94,          // Nebulak, Alpollo, Gengar (außer Mega)
            200, 429,            // Traunfugil, Traunmagil
            353, 354,            // Shuppet, Banette
            355, 356, 477,       // Zwirrlicht, Zwirrklop, Zwirrfinst
            442,                 // Kryppuk
            562, 563,            // Makabaja, Echnatoll
            607, 608, 609,       // Lichtel, Laternecto, Skelabra
            
            // Gift-Klumpen
            88, 89,              // Sleima, Sleimok
            316, 317,            // Schluppuck, Schlukwech
            568, 569,            // Unratütox, Deponitox
            
            // Zu gefährlich zum Reiten
            109, 110,            // Smogon, Smogmog (giftig)
            100, 101,            // Voltobal, Lektrobal (explosiv)
            436, 437,            // Bronzel (zu klein)
            
            // Baby-Pokemon (generell zu klein)
            172, 173, 174, 175,  // Pichu, Pii, Fluffeluff, Togepi
            236, 238, 239, 240,  // Rabauz, Kussilla, Elekid, Magby
            298, 360,            // Azurill, Isso
            406, 433, 438, 439, 440,  // Knospi, Klingplim, Mobai, Pantimimi, Wonneira
            446, 447, 458,       // Mampfaxo, Riolu, Mantirps
            
            // Sonstige
            235,                 // Farbeagle (zu dünn)
            352,                 // Kecleon
            327,                 // Pandir
        ]);
        
        // ============================================================
        // SHAPE-KONFIGURATION
        // Welche Shapes grundsätzlich reitbar sein können und ihre Mindestgröße
        // ============================================================
        this.RIDEABLE_SHAPES = {
            'quadruped': { minHeight: 0.8, baseType: 'land' },      // Vierbeiner
            'wings': { minHeight: 1.0, baseType: 'flying' },         // Geflügelt
            'serpentine': { minHeight: 2.5, baseType: 'land' },      // Schlangenförmig (Onix, etc.)
            'fins': { minHeight: 1.2, baseType: 'water' },           // Mit Flossen
            'armor': { minHeight: 1.5, baseType: 'land' },           // Gepanzert (Bisaflor, etc.)
            'bug-wings': { minHeight: 1.5, baseType: 'flying' },     // Insektenflügel (selten reitbar)
        };
        
        // Shapes die NIEMALS reitbar sind
        this.NON_RIDEABLE_SHAPES = new Set([
            'humanoid',   // Machomei, Kicklee, etc.
            'upright',    // Aufrechte Zweibiner wie Kurkmarda
            'arms',       // Mit Armen (Haunter, etc.)
            'blob',       // Formlos (Ditto, Sleima)
            'ball',       // Kugelförmig (Voltorb)
            'heads',      // Nur Kopf (Nebulak, Koffing)
            'squiggle',   // Wurmförmig (Raupy)
            'tentacles',  // Tentakel (meist zu klein/instabil)
        ]);
        
        // Fähigkeiten die auf Flug-Reitbarkeit hindeuten
        this.FLYING_ABILITIES = new Set([
            'levitate',      // Schwebe
            'aerilate',      // Schwebedurch (eigentlich Normalität -> Flug)
        ]);
        
        console.log('RideabilityService initialisiert');
    }
    
    /**
     * Bestimmt die Reitbarkeit eines Pokemon
     * @param {Object} pokemonData - Pokemon-Daten aus der API
     * @param {Object} speciesData - Species-Daten aus der API
     * @param {Array} learnableMoves - Liste der lernbaren Attacken (optional)
     * @returns {Object} { type: "none"|"land"|"water"|"flying", label: string, icon: string }
     */
    getRideability(pokemonData, speciesData, learnableMoves = null) {
        if (!pokemonData) {
            return this._formatResult('none');
        }
        
        const pokemonId = pokemonData.id;
        
        // 1. Blacklist-Check (höchste Priorität für Ausschluss)
        if (this.BLACKLIST.has(pokemonId)) {
            return this._formatResult('none');
        }
        
        // 2. Whitelist-Check (überschreibt Algorithmus)
        if (this.WHITELIST[pokemonId]) {
            return this._formatResult(this.WHITELIST[pokemonId]);
        }
        
        // 3. Algorithmus-basierte Bestimmung
        const baseRideability = this._calculateBaseRideability(pokemonData, speciesData);
        
        if (baseRideability === 'none') {
            return this._formatResult('none');
        }
        
        // 4. Spezialtyp bestimmen (flying > water > land)
        const specialType = this._determineSpecialType(pokemonData, speciesData, learnableMoves, baseRideability);
        
        return this._formatResult(specialType);
    }
    
    /**
     * Berechnet die Basis-Reitbarkeit basierend auf Shape und Größe
     * @private
     */
    _calculateBaseRideability(pokemonData, speciesData) {
        // Shape aus speciesData holen
        const shape = speciesData?.shape?.name;
        const height = pokemonData.height / 10; // API gibt Dezimeter, wir brauchen Meter
        
        // Egg-Group Check: humanshape = nicht reitbar
        const eggGroups = speciesData?.egg_groups?.map(eg => eg.name) || [];
        if (eggGroups.includes('no-eggs') === false && eggGroups.includes('human-like')) {
            // human-like egg group = wahrscheinlich nicht reitbar
            // Außer bei sehr großen Pokemon
            if (height < 2.0) {
                return 'none';
            }
        }
        
        // Shape-basierte Prüfung
        if (!shape) {
            // Fallback: Nur Größe verwenden
            return height >= 1.5 ? 'land' : 'none';
        }
        
        // Nicht-reitbare Shapes
        if (this.NON_RIDEABLE_SHAPES.has(shape)) {
            return 'none';
        }
        
        // Reitbare Shapes mit Mindestgröße
        const shapeConfig = this.RIDEABLE_SHAPES[shape];
        if (shapeConfig) {
            if (height >= shapeConfig.minHeight) {
                return shapeConfig.baseType;
            }
        }
        
        // Unbekannter Shape: Größen-Fallback
        if (height >= 2.0) {
            return 'land';
        }
        
        return 'none';
    }
    
    /**
     * Bestimmt ob ein Pokemon als Wasser- oder Flug-Reittier gilt
     * @private
     */
    _determineSpecialType(pokemonData, speciesData, learnableMoves, baseType) {
        const types = pokemonData.types?.map(t => t.type.name) || [];
        const abilities = pokemonData.abilities?.map(a => a.ability.name) || [];
        
        // Prüfe auf Flug-Reitbarkeit (höchste Priorität)
        const canFly = this._canBeFlying(types, abilities, learnableMoves);
        if (canFly) {
            return 'flying';
        }
        
        // Prüfe auf Wasser-Reitbarkeit
        const canSurf = this._canBeWater(types, learnableMoves);
        if (canSurf) {
            return 'water';
        }
        
        // Basis-Typ zurückgeben
        return baseType;
    }
    
    /**
     * Prüft ob ein Pokemon als Flug-Reittier gilt
     * Kriterien: Kann "Fliegen" lernen UND (hat Flug-Typ ODER Schwebe-Fähigkeit)
     * @private
     */
    _canBeFlying(types, abilities, learnableMoves) {
        // Hat Flug-Typ oder Schwebe-Fähigkeit?
        const hasFlightCapability = 
            types.includes('flying') || 
            abilities.some(a => this.FLYING_ABILITIES.has(a));
        
        if (!hasFlightCapability) {
            return false;
        }
        
        // Kann "Fliegen" (fly) lernen?
        if (learnableMoves && Array.isArray(learnableMoves)) {
            const canLearnFly = learnableMoves.some(move => {
                const moveName = typeof move === 'string' ? move : move.move?.name || move.name;
                return moveName === 'fly';
            });
            return canLearnFly;
        }
        
        // Ohne Move-Liste: Flug-Typ allein reicht
        return types.includes('flying');
    }
    
    /**
     * Prüft ob ein Pokemon als Wasser-Reittier gilt
     * Kriterien: Kann "Surfer" lernen UND hat Wasser- oder Eis-Typ
     * @private
     */
    _canBeWater(types, learnableMoves) {
        // Hat Wasser- oder Eis-Typ?
        const hasWaterCapability = types.includes('water') || types.includes('ice');
        
        if (!hasWaterCapability) {
            return false;
        }
        
        // Kann "Surfer" (surf) lernen?
        if (learnableMoves && Array.isArray(learnableMoves)) {
            const canLearnSurf = learnableMoves.some(move => {
                const moveName = typeof move === 'string' ? move : move.move?.name || move.name;
                return moveName === 'surf';
            });
            return canLearnSurf;
        }
        
        // Ohne Move-Liste: Wasser-Typ allein reicht für Wasser-Reitbarkeit
        return types.includes('water');
    }
    
    /**
     * Formatiert das Ergebnis mit Label und Icon
     * @private
     */
    _formatResult(type) {
        const results = {
            'none': {
                type: 'none',
                label: 'Kann nicht geritten werden',
                labelShort: 'Nicht reitbar',
                icon: '🚫',
                cssClass: 'rideability-none'
            },
            'land': {
                type: 'land',
                label: 'Reitbar (Land)',
                labelShort: 'Land',
                icon: '🐎',
                cssClass: 'rideability-land'
            },
            'water': {
                type: 'water',
                label: 'Reitbar (Wasser)',
                labelShort: 'Wasser',
                icon: '🌊',
                cssClass: 'rideability-water'
            },
            'flying': {
                type: 'flying',
                label: 'Reitbar (Fliegend)',
                labelShort: 'Fliegend',
                icon: '🦅',
                cssClass: 'rideability-flying'
            }
        };
        
        return results[type] || results['none'];
    }
    
    // ============================================================
    // HILFSMETHODEN FÜR MANUELLE ANPASSUNGEN
    // ============================================================
    
    /**
     * Fügt ein Pokemon zur Whitelist hinzu
     * @param {number} pokemonId - Die Pokemon-ID
     * @param {string} rideType - "land", "water" oder "flying"
     */
    addToWhitelist(pokemonId, rideType) {
        if (['land', 'water', 'flying'].includes(rideType)) {
            this.WHITELIST[pokemonId] = rideType;
            console.log(`RideabilityService: Pokemon #${pokemonId} zur Whitelist hinzugefügt (${rideType})`);
        }
    }
    
    /**
     * Entfernt ein Pokemon von der Whitelist
     * @param {number} pokemonId - Die Pokemon-ID
     */
    removeFromWhitelist(pokemonId) {
        delete this.WHITELIST[pokemonId];
        console.log(`RideabilityService: Pokemon #${pokemonId} von der Whitelist entfernt`);
    }
    
    /**
     * Fügt ein Pokemon zur Blacklist hinzu
     * @param {number} pokemonId - Die Pokemon-ID
     */
    addToBlacklist(pokemonId) {
        this.BLACKLIST.add(pokemonId);
        console.log(`RideabilityService: Pokemon #${pokemonId} zur Blacklist hinzugefügt`);
    }
    
    /**
     * Entfernt ein Pokemon von der Blacklist
     * @param {number} pokemonId - Die Pokemon-ID
     */
    removeFromBlacklist(pokemonId) {
        this.BLACKLIST.delete(pokemonId);
        console.log(`RideabilityService: Pokemon #${pokemonId} von der Blacklist entfernt`);
    }
    
    /**
     * Gibt die aktuelle Whitelist zurück (für Debugging)
     */
    getWhitelist() {
        return { ...this.WHITELIST };
    }
    
    /**
     * Gibt die aktuelle Blacklist zurück (für Debugging)
     */
    getBlacklist() {
        return [...this.BLACKLIST];
    }
}

// Global verfügbar machen
window.rideabilityService = new RideabilityService();
console.log('RideabilityService wurde global als window.rideabilityService initialisiert.');