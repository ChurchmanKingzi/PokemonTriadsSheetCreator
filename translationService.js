/**
 * Dienst für die Übersetzung von Pokémon-Daten ins Deutsche
 * OPTIMIERT: Mit lokaler Übersetzungstabelle für schnelleres Laden
 */
class TranslationService {
    constructor() {
        // Cache für bereits übersetzte Elemente
        this.translationCache = {
            pokemonNames: new Map(),
            moveNames: new Map(),
            typeNames: new Map()
        };

        // Deutsche Typen-Mapping
        this.typeTranslations = {
            'normal': 'Normal',
            'fire': 'Feuer',
            'water': 'Wasser',
            'electric': 'Elektro',
            'grass': 'Pflanze',
            'ice': 'Eis',
            'fighting': 'Kampf',
            'poison': 'Gift',
            'ground': 'Boden',
            'flying': 'Flug',
            'psychic': 'Psycho',
            'bug': 'Käfer',
            'rock': 'Gestein',
            'ghost': 'Geist',
            'dragon': 'Drache',
            'dark': 'Unlicht',
            'steel': 'Stahl',
            'fairy': 'Fee'
        };
        
        // Lokale deutsche Pokemon-Namen (die ersten 151 + einige wichtige)
        // Dies ermöglicht schnelles Laden ohne API-Calls
        this.localPokemonNames = {
            'bulbasaur': 'Bisasam',
            'ivysaur': 'Bisaknosp',
            'venusaur': 'Bisaflor',
            'charmander': 'Glumanda',
            'charmeleon': 'Glutexo',
            'charizard': 'Glurak',
            'squirtle': 'Schiggy',
            'wartortle': 'Schillok',
            'blastoise': 'Turtok',
            'caterpie': 'Raupy',
            'metapod': 'Safcon',
            'butterfree': 'Smettbo',
            'weedle': 'Hornliu',
            'kakuna': 'Kokuna',
            'beedrill': 'Bibor',
            'pidgey': 'Taubsi',
            'pidgeotto': 'Tauboga',
            'pidgeot': 'Tauboss',
            'rattata': 'Rattfratz',
            'raticate': 'Rattikarl',
            'spearow': 'Habitak',
            'fearow': 'Ibitak',
            'ekans': 'Rettan',
            'arbok': 'Arbok',
            'pikachu': 'Pikachu',
            'raichu': 'Raichu',
            'sandshrew': 'Sandan',
            'sandslash': 'Sandamer',
            'nidoran-f': 'Nidoran♀',
            'nidorina': 'Nidorina',
            'nidoqueen': 'Nidoqueen',
            'nidoran-m': 'Nidoran♂',
            'nidorino': 'Nidorino',
            'nidoking': 'Nidoking',
            'clefairy': 'Piepi',
            'clefable': 'Pixi',
            'vulpix': 'Vulpix',
            'ninetales': 'Vulnona',
            'jigglypuff': 'Pummeluff',
            'wigglytuff': 'Knuddeluff',
            'zubat': 'Zubat',
            'golbat': 'Golbat',
            'oddish': 'Myrapla',
            'gloom': 'Duflor',
            'vileplume': 'Giflor',
            'paras': 'Paras',
            'parasect': 'Parasek',
            'venonat': 'Bluzuk',
            'venomoth': 'Omot',
            'diglett': 'Digda',
            'dugtrio': 'Digdri',
            'meowth': 'Mauzi',
            'persian': 'Snobilikat',
            'psyduck': 'Enton',
            'golduck': 'Entoron',
            'mankey': 'Menki',
            'primeape': 'Rasaff',
            'growlithe': 'Fukano',
            'arcanine': 'Arkani',
            'poliwag': 'Quapsel',
            'poliwhirl': 'Quaputzi',
            'poliwrath': 'Quappo',
            'abra': 'Abra',
            'kadabra': 'Kadabra',
            'alakazam': 'Simsala',
            'machop': 'Machollo',
            'machoke': 'Maschock',
            'machamp': 'Machomei',
            'bellsprout': 'Knofensa',
            'weepinbell': 'Ultrigaria',
            'victreebel': 'Sarzenia',
            'tentacool': 'Tentacha',
            'tentacruel': 'Tentoxa',
            'geodude': 'Kleinstein',
            'graveler': 'Georok',
            'golem': 'Geowaz',
            'ponyta': 'Ponita',
            'rapidash': 'Gallopa',
            'slowpoke': 'Flegmon',
            'slowbro': 'Lahmus',
            'magnemite': 'Magnetilo',
            'magneton': 'Magneton',
            'farfetchd': 'Porenta',
            'doduo': 'Dodu',
            'dodrio': 'Dodri',
            'seel': 'Jurob',
            'dewgong': 'Jugong',
            'grimer': 'Sleima',
            'muk': 'Sleimok',
            'shellder': 'Muschas',
            'cloyster': 'Austos',
            'gastly': 'Nebulak',
            'haunter': 'Alpollo',
            'gengar': 'Gengar',
            'onix': 'Onix',
            'drowzee': 'Traumato',
            'hypno': 'Hypno',
            'krabby': 'Krabby',
            'kingler': 'Kingler',
            'voltorb': 'Voltobal',
            'electrode': 'Lektrobal',
            'exeggcute': 'Owei',
            'exeggutor': 'Kokowei',
            'cubone': 'Tragosso',
            'marowak': 'Knogga',
            'hitmonlee': 'Kicklee',
            'hitmonchan': 'Nockchan',
            'lickitung': 'Schlurp',
            'koffing': 'Smogon',
            'weezing': 'Smogmog',
            'rhyhorn': 'Rihorn',
            'rhydon': 'Rizeros',
            'chansey': 'Chaneira',
            'tangela': 'Tangela',
            'kangaskhan': 'Kangama',
            'horsea': 'Seeper',
            'seadra': 'Seemon',
            'goldeen': 'Goldini',
            'seaking': 'Golking',
            'staryu': 'Sterndu',
            'starmie': 'Starmie',
            'mr-mime': 'Pantimos',
            'scyther': 'Sichlor',
            'jynx': 'Rossana',
            'electabuzz': 'Elektek',
            'magmar': 'Magmar',
            'pinsir': 'Pinsir',
            'tauros': 'Tauros',
            'magikarp': 'Karpador',
            'gyarados': 'Garados',
            'lapras': 'Lapras',
            'ditto': 'Ditto',
            'eevee': 'Evoli',
            'vaporeon': 'Aquana',
            'jolteon': 'Blitza',
            'flareon': 'Flamara',
            'porygon': 'Porygon',
            'omanyte': 'Amonitas',
            'omastar': 'Amoroso',
            'kabuto': 'Kabuto',
            'kabutops': 'Kabutops',
            'aerodactyl': 'Aerodactyl',
            'snorlax': 'Relaxo',
            'articuno': 'Arktos',
            'zapdos': 'Zapdos',
            'moltres': 'Lavados',
            'dratini': 'Dratini',
            'dragonair': 'Dragonir',
            'dragonite': 'Dragoran',
            'mewtwo': 'Mewtu',
            'mew': 'Mew',
            // Gen 2
            'chikorita': 'Endivie',
            'bayleef': 'Lorblatt',
            'meganium': 'Meganie',
            'cyndaquil': 'Feurigel',
            'quilava': 'Igelavar',
            'typhlosion': 'Tornupto',
            'totodile': 'Karnimani',
            'croconaw': 'Tyracroc',
            'feraligatr': 'Impergator',
            'sentret': 'Wiesor',
            'furret': 'Wiesenior',
            'hoothoot': 'Hoothoot',
            'noctowl': 'Noctuh',
            'ledyba': 'Ledyba',
            'ledian': 'Ledian',
            'spinarak': 'Webarak',
            'ariados': 'Ariados',
            'crobat': 'Iksbat',
            'chinchou': 'Lampi',
            'lanturn': 'Lanturn',
            'pichu': 'Pichu',
            'cleffa': 'Pii',
            'igglybuff': 'Fluffeluff',
            'togepi': 'Togepi',
            'togetic': 'Togetic',
            'natu': 'Natu',
            'xatu': 'Xatu',
            'mareep': 'Voltilamm',
            'flaaffy': 'Waaty',
            'ampharos': 'Ampharos',
            'bellossom': 'Blubella',
            'marill': 'Marill',
            'azumarill': 'Azumarill',
            'sudowoodo': 'Mogelbaum',
            'politoed': 'Quaxo',
            'hoppip': 'Hoppspross',
            'skiploom': 'Hubelupf',
            'jumpluff': 'Papungha',
            'aipom': 'Griffel',
            'sunkern': 'Sonnkern',
            'sunflora': 'Sonnflora',
            'yanma': 'Yanma',
            'wooper': 'Felino',
            'quagsire': 'Morlord',
            'espeon': 'Psiana',
            'umbreon': 'Nachtara',
            'murkrow': 'Kramurx',
            'slowking': 'Laschoking',
            'misdreavus': 'Traunfugil',
            'unown': 'Icognito',
            'wobbuffet': 'Woingenau',
            'girafarig': 'Girafarig',
            'pineco': 'Tannza',
            'forretress': 'Forstellka',
            'dunsparce': 'Dummisel',
            'gligar': 'Skorgla',
            'steelix': 'Stahlos',
            'snubbull': 'Snubbull',
            'granbull': 'Granbull',
            'qwilfish': 'Baldorfish',
            'scizor': 'Scherox',
            'shuckle': 'Pottrott',
            'heracross': 'Skaraborn',
            'sneasel': 'Sniebel',
            'teddiursa': 'Teddiursa',
            'ursaring': 'Ursaring',
            'slugma': 'Schneckmag',
            'magcargo': 'Magcargo',
            'swinub': 'Quiekel',
            'piloswine': 'Keifel',
            'corsola': 'Corasonn',
            'remoraid': 'Remoraid',
            'octillery': 'Octillery',
            'delibird': 'Botogel',
            'mantine': 'Mantax',
            'skarmory': 'Panzaeron',
            'houndour': 'Hunduster',
            'houndoom': 'Hundemon',
            'kingdra': 'Seedraking',
            'phanpy': 'Phanpy',
            'donphan': 'Donphan',
            'porygon2': 'Porygon2',
            'stantler': 'Damhirplex',
            'smeargle': 'Farbeagle',
            'tyrogue': 'Rabauz',
            'hitmontop': 'Kapoera',
            'smoochum': 'Kussilla',
            'elekid': 'Elekid',
            'magby': 'Magby',
            'miltank': 'Miltank',
            'blissey': 'Heiteira',
            'raikou': 'Raikou',
            'entei': 'Entei',
            'suicune': 'Suicune',
            'larvitar': 'Larvitar',
            'pupitar': 'Pupitar',
            'tyranitar': 'Despotar',
            'lugia': 'Lugia',
            'ho-oh': 'Ho-Oh',
            'celebi': 'Celebi',
            // Gen 3 Starters
            'treecko': 'Geckarbor',
            'grovyle': 'Reptain',
            'sceptile': 'Gewaldro',
            'torchic': 'Flemmli',
            'combusken': 'Jungglut',
            'blaziken': 'Lohgock',
            'mudkip': 'Hydropi',
            'marshtomp': 'Moorabbel',
            'swampert': 'Sumpex',
            // Gen 4 Starters
            'turtwig': 'Chelast',
            'grotle': 'Chelcarain',
            'torterra': 'Chelterrar',
            'chimchar': 'Panflam',
            'monferno': 'Panpyro',
            'infernape': 'Panferno',
            'piplup': 'Plinfa',
            'prinplup': 'Pliprin',
            'empoleon': 'Impoleon',
            // Gen 5 Starters
            'snivy': 'Serpifeu',
            'servine': 'Efoserp',
            'serperior': 'Serpiroyal',
            'tepig': 'Floink',
            'pignite': 'Ferkokel',
            'emboar': 'Flambirex',
            'oshawott': 'Ottaro',
            'dewott': 'Zwottronin',
            'samurott': 'Admurai',
            // Gen 6 Starters
            'chespin': 'Igamaro',
            'quilladin': 'Igastarnish',
            'chesnaught': 'Brigaron',
            'fennekin': 'Fynx',
            'braixen': 'Rutena',
            'delphox': 'Fennexis',
            'froakie': 'Froxy',
            'frogadier': 'Amphizel',
            'greninja': 'Quajutsu',
            // Gen 7 Starters
            'rowlet': 'Bauz',
            'dartrix': 'Arboretoss',
            'decidueye': 'Silvarro',
            'litten': 'Flamiau',
            'torracat': 'Miezunder',
            'incineroar': 'Fuegro',
            'popplio': 'Robball',
            'brionne': 'Marikeck',
            'primarina': 'Primarene',
            // Gen 8 Starters
            'grookey': 'Chimpep',
            'thwackey': 'Chimstix',
            'rillaboom': 'Gortrom',
            'scorbunny': 'Hopplo',
            'raboot': 'Kickerlo',
            'cinderace': 'Liberlo',
            'sobble': 'Memmeon',
            'drizzile': 'Phlegleon',
            'inteleon': 'Intelleon',
            // Gen 9 Starters
            'sprigatito': 'Felori',
            'floragato': 'Feliospa',
            'meowscarada': 'Maskagato',
            'fuecoco': 'Krokel',
            'crocalor': 'Lokroko',
            'skeledirge': 'Skelokrok',
            'quaxly': 'Kwaks',
            'quaxwell': 'Fuentente',
            'quaquaval': 'Bailonda'
        };
    }

    /**
     * Holt den deutschen Namen aus der lokalen Tabelle (ohne API-Call)
     * @param {string} englishName - Englischer Name
     * @returns {string|null} Deutscher Name oder null wenn nicht gefunden
     */
    getGermanNameFromLocal(englishName) {
        const normalized = englishName.toLowerCase().replace(/\s+/g, '-');
        return this.localPokemonNames[normalized] || null;
    }

    /**
     * Übersetzt einen Pokémon-Namen ins Deutsche
     * @param {string} englishName - Englischer Name
     * @param {Object} speciesData - Arten-Daten aus der API
     * @returns {string} Deutscher Name
     */
    translatePokemonName(englishName, speciesData) {
        // Prüfen, ob der Name bereits im Cache ist
        if (this.translationCache.pokemonNames.has(englishName)) {
            return this.translationCache.pokemonNames.get(englishName);
        }
        
        // Erst lokal versuchen
        const localName = this.getGermanNameFromLocal(englishName);
        if (localName) {
            this.translationCache.pokemonNames.set(englishName, localName);
            return localName;
        }

        // Versuchen, den deutschen Namen aus den speciesData zu extrahieren
        let germanName = englishName; // Standard: englischer Name
        
        if (speciesData && speciesData.names && Array.isArray(speciesData.names)) {
            const germanEntry = speciesData.names.find(entry => 
                entry.language && entry.language.name === 'de'
            );
            
            if (germanEntry && germanEntry.name) {
                germanName = germanEntry.name;
            }
        }
        
        // Name im Cache speichern
        this.translationCache.pokemonNames.set(englishName, germanName);
        
        return germanName;
    }

    /**
     * Übersetzt einen Attacken-Namen ins Deutsche
     * @param {string} englishName - Englischer Name
     * @param {Object} moveData - Attacken-Daten aus der API
     * @returns {string} Deutscher Name
     */
    translateMoveName(englishName, moveData) {
        // Prüfen, ob der Name bereits im Cache ist
        if (this.translationCache.moveNames.has(englishName)) {
            return this.translationCache.moveNames.get(englishName);
        }

        // Versuchen, den deutschen Namen aus den moveData zu extrahieren
        let germanName = englishName.replace('-', ' '); // Standard: englischer Name formatiert
        
        if (moveData && moveData.names && Array.isArray(moveData.names)) {
            const germanEntry = moveData.names.find(entry => 
                entry.language && entry.language.name === 'de'
            );
            
            if (germanEntry && germanEntry.name) {
                germanName = germanEntry.name;
            }
        }
        
        // Name im Cache speichern
        this.translationCache.moveNames.set(englishName, germanName);
        
        return germanName;
    }

    /**
     * Übersetzt einen Typen-Namen ins Deutsche
     * @param {string} englishType - Englischer Typ
     * @returns {string} Deutscher Typ
     */
    translateTypeName(englishType) {
        // Prüfen, ob der Typ bereits im Cache ist
        if (this.translationCache.typeNames.has(englishType)) {
            return this.translationCache.typeNames.get(englishType);
        }

        // Übersetzung aus dem Mapping abrufen oder englischen Namen zurückgeben
        const germanType = this.typeTranslations[englishType] || capitalizeFirstLetter(englishType);
        
        // Typ im Cache speichern
        this.translationCache.typeNames.set(englishType, germanType);
        
        return germanType;
    }

    /**
     * Löscht den Cache für alle Übersetzungen
     */
    clearCache() {
        this.translationCache.pokemonNames.clear();
        this.translationCache.moveNames.clear();
        this.translationCache.typeNames.clear();
    }
}