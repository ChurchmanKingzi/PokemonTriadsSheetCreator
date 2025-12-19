/**
 * Service für API-Anfragen an die Pokemon-API mit deutscher Übersetzung
 * OPTIMIERT: fetchPokemonList lädt keine Species-Daten mehr vorab (Lazy Loading)
 */
class ApiService {
    /**
     * Konstruktor
     * @param {AppState} appState - Die App-State-Instanz
     */
    constructor(appState) {        
        this.appState = appState;
        this.translationService = new TranslationService();
        
        // Cache Keys für LocalStorage
        this.CACHE_KEY_POKEMON_LIST = 'pokemon_list_cache_v5'; // Version erhöht wegen neuer Daten!
        this.CACHE_KEY_ALL_MOVES = 'all_moves_cache_v1'; // Cache für alle Attacken
        this.CACHE_EXPIRY_DAYS = 7;
        
        // Normale Pokemon IDs (1-1025) und spezielle IDs (10001-10277)
        this.standardPokemonRange = { min: 1, max: 1025 };
        this.specialPokemonRange = { min: 10001, max: 10277 };
        
        // Mapping-Tabelle: Spezielle Pokemon-ID -> API-Name
        // Diese Tabelle ermöglicht die korrekte Übersetzung ohne API-Calls
        this.specialPokemonIdToName = {
            // ===== DEOXYS-FORMEN (10001-10003) =====
            10001: 'deoxys-attack',
            10002: 'deoxys-defense',
            10003: 'deoxys-speed',
            
            // ===== WORMADAM-FORMEN (10004-10005) =====
            10004: 'wormadam-sandy',
            10005: 'wormadam-trash',
            
            // ===== SHAYMIN (10006) =====
            10006: 'shaymin-sky',
            
            // ===== GIRATINA (10007) =====
            10007: 'giratina-origin',
            
            // ===== ROTOM-FORMEN (10008-10012) =====
            10008: 'rotom-heat',
            10009: 'rotom-wash',
            10010: 'rotom-frost',
            10011: 'rotom-fan',
            10012: 'rotom-mow',
            
            // ===== CASTFORM-FORMEN (10013-10015) =====
            10013: 'castform-sunny',
            10014: 'castform-rainy',
            10015: 'castform-snowy',
            
            // ===== BASCULIN (10016) =====
            10016: 'basculin-blue-striped',
            
            // ===== DARMANITAN (10017) =====
            10017: 'darmanitan-zen',
            
            // ===== MELOETTA (10018) =====
            10018: 'meloetta-pirouette',
            
            // ===== KAMI-TRIO TIERGEISTFORM (10019-10021) =====
            10019: 'tornadus-therian',
            10020: 'thundurus-therian',
            10021: 'landorus-therian',
            
            // ===== KYUREM-FORMEN (10022-10023) =====
            10022: 'kyurem-black',
            10023: 'kyurem-white',
            
            // ===== KELDEO (10024) =====
            10024: 'keldeo-resolute',
            
            // ===== MEOWSTIC (10025) =====
            10025: 'meowstic-female',
            
            // ===== AEGISLASH (10026) =====
            10026: 'aegislash-blade',
            
            // ===== PUMPKABOO & GOURGEIST GRÖßEN (10027-10032) =====
            10027: 'pumpkaboo-small',
            10028: 'pumpkaboo-large',
            10029: 'pumpkaboo-super',
            10030: 'gourgeist-small',
            10031: 'gourgeist-large',
            10032: 'gourgeist-super',
            
            // ===== MEGA-EVOLUTIONEN GEN 1 (10033-10044) =====
            10033: 'venusaur-mega',
            10034: 'charizard-mega-x',
            10035: 'charizard-mega-y',
            10036: 'blastoise-mega',
            10037: 'alakazam-mega',
            10038: 'gengar-mega',
            10039: 'kangaskhan-mega',
            10040: 'pinsir-mega',
            10041: 'gyarados-mega',
            10042: 'aerodactyl-mega',
            10043: 'mewtwo-mega-x',
            10044: 'mewtwo-mega-y',
            
            // ===== MEGA-EVOLUTIONEN GEN 2 (10045-10049) =====
            10045: 'ampharos-mega',
            10046: 'scizor-mega',
            10047: 'heracross-mega',
            10048: 'houndoom-mega',
            10049: 'tyranitar-mega',
            
            // ===== MEGA-EVOLUTIONEN GEN 3+ (10050-10079) =====
            10050: 'blaziken-mega',
            10051: 'gardevoir-mega',
            10052: 'mawile-mega',
            10053: 'aggron-mega',
            10054: 'medicham-mega',
            10055: 'manectric-mega',
            10056: 'banette-mega',
            10057: 'absol-mega',
            10058: 'garchomp-mega',
            10059: 'lucario-mega',
            10060: 'abomasnow-mega',
            10061: 'floette-eternal',
            10062: 'latias-mega',
            10063: 'latios-mega',
            10064: 'swampert-mega',
            10065: 'sceptile-mega',
            10066: 'sableye-mega',
            10067: 'altaria-mega',
            10068: 'gallade-mega',
            10069: 'audino-mega',
            10070: 'sharpedo-mega',
            10071: 'slowbro-mega',
            10072: 'steelix-mega',
            10073: 'pidgeot-mega',
            10074: 'glalie-mega',
            10075: 'diancie-mega',
            10076: 'metagross-mega',
            10077: 'kyogre-primal',
            10078: 'groudon-primal',
            10079: 'rayquaza-mega',
            
            // ===== PIKACHU COSPLAY-FORMEN (10080-10085) =====
            10080: 'pikachu-rock-star',
            10081: 'pikachu-belle',
            10082: 'pikachu-pop-star',
            10083: 'pikachu-phd',
            10084: 'pikachu-libre',
            10085: 'pikachu-cosplay',
            
            // ===== Hoopa Unbound =====
            10086: 'hoopa-unbound',
            
            // ===== MEHR MEGA-EVOLUTIONEN (10096-10099) =====
            10087: 'camerupt-mega',
            10088: 'lopunny-mega',
            10089: 'salamence-mega',
            10090: 'beedrill-mega',
            
            // ===== ALOLA-FORMEN (10100-10118) =====
            10091: 'rattata-alola',
            10092: 'raticate-alola',
            10100: 'raichu-alola',
            10101: 'sandshrew-alola',
            10102: 'sandslash-alola',
            10103: 'vulpix-alola',
            10104: 'ninetales-alola',
            10105: 'diglett-alola',
            10106: 'dugtrio-alola',
            10107: 'meowth-alola',
            10108: 'persian-alola',
            10109: 'geodude-alola',
            10110: 'graveler-alola',
            10111: 'golem-alola',
            10112: 'grimer-alola',
            10113: 'muk-alola',
            10114: 'exeggutor-alola',
            10115: 'marowak-alola',
            
            // ===== GRENINJA (10119-10120) =====
            10116: 'greninja-battle-bond',
            10117: 'greninja-ash',
            
            // ===== ZYGARDE-FORMEN (10121-10124) =====
            10118: 'zygarde-10-power-construct',
            10119: 'zygarde-50-power-construct',
            10120: 'zygarde-complete',
            
            
            // ===== ORICORIO-FORMEN (10126-10128) =====
            10123: 'oricorio-pom-pom',
            10124: 'oricorio-pau',
            10125: 'oricorio-sensu',
            
            // ===== LYCANROC-FORMEN (10129-10130) =====
            10126: 'lycanroc-midnight',
            10152: 'lycanroc-dusk',
            
            // ===== WISHIWASHI (10127) =====
            10127: 'wishiwashi-school',
            
            // ===== NECROZMA-FORMEN (10155-10157) =====
            10155: 'necrozma-dusk',
            10156: 'necrozma-dawn',
            10157: 'necrozma-ultra',
            
            // ===== MIMIKYU & TOTEM-POKEMON (10162-10174) =====
            10184: 'toxtricity-low-key',
            10186: 'indeedee-female',
            10187: 'morpeko-hangry',
            10188: 'zacian-crowned',
            10189: 'zamazenta-crowned',
            
            // ===== GALAR-FORMEN (10178-10197) =====
            10161: 'meowth-galar',
            10162: 'ponyta-galar',
            10163: 'rapidash-galar',
            10164: 'slowpoke-galar',
            10165: 'slowbro-galar',
            10166: 'farfetchd-galar',
            10167: 'weezing-galar',
            10168: 'mr-mime-galar',
            10169: 'articuno-galar',
            10170: 'zapdos-galar',
            10171: 'moltres-galar',
            10172: 'slowking-galar',
            10173: 'corsola-galar',
            10174: 'zigzagoon-galar',
            10175: 'linoone-galar',
            10176: 'darumaka-galar',
            10177: 'darmanitan-galar-standard',
            10178: 'darmanitan-galar-zen',
            10179: 'yamask-galar',
            10180: 'stunfisk-galar',

            10193: 'calyrex-ice',
            10194: 'calyrex-shadow',
            
            // ===== URSHIFU (10201-10202) =====
            10191: 'urshifu-rapid-strike',
            10192: 'zarude-dada',
            
            // ===== GMAX FORMS =====
            10190: 'eternatus-eternamax',
            10195: 'venusaur-gmax',
            10196: 'charizard-gmax',
            10197: 'blastoise-gmax',
            10198: 'butterfree-gmax',
            10199: 'pikachu-gmax',
            10200: 'meowth-gmax',
            10201: 'machamp-gmax',
            10202: 'gengar-gmax',
            10203: 'kingler-gmax',
            10204: 'lapras-gmax',
            10205: 'eevee-gmax',
            10206: 'snorlax-gmax',
            10207: 'garbodor-gmax',
            10208: 'melmetal-gmax',
            10209: 'rillaboom-gmax',
            10210: 'cinderace-gmax',
            10211: 'inteleon-gmax',
            10212: 'corviknight-gmax',
            10213: 'orbeetle-gmax',
            10214: 'drednaw-gmax',
            10215: 'coalossal-gmax',
            10216: 'flapple-gmax',
            10217: 'appletun-gmax',
            10218: 'sandaconda-gmax',
            10219: 'toxtricity-gmax',
            10220: 'centiskorch-gmax',
            10221: 'hatterene-gmax',
            10222: 'grimmsnarl-gmax',
            10223: 'alcremie-gmax',
            10224: 'copperajah-gmax',
            10225: 'duraludon-gmax',
            10226: 'urshifu-gmax',
            
            // ===== HISUI-FORMEN (10221-10239) =====
            10229: 'growlithe-hisui',
            10230: 'arcanine-hisui',
            10231: 'voltorb-hisui',
            10232: 'electrode-hisui',
            10233: 'typhlosion-hisui',
            10234: 'qwilfish-hisui',
            10235: 'sneasel-hisui',
            10236: 'samurott-hisui',
            10237: 'lilligant-hisui',
            10238: 'zorua-hisui',
            10239: 'zoroark-hisui',
            10240: 'braviary-hisui',
            10241: 'sliggoo-hisui',
            10242: 'goodra-hisui',
            10243: 'avalugg-hisui',
            10244: 'decidueye-hisui',
            10245: 'dialga-origin',
            10246: 'palkia-origin',
            10247: 'basculin-white-striped',
            
            // ===== ENAMORUS (10248) =====
            10249: 'enamorus-therian',
            
            // ===== BASCULEGION (10249) =====
            10248: 'basculegion-female',
            
            // ===== PALDEA-FORMEN (10250-10253) =====
            10253: 'wooper-paldea',
            10250: 'tauros-paldea-combat',
            10251: 'tauros-paldea-blaze',
            10252: 'tauros-paldea-aqua',
            
            // ===== OINKOLOGNE (10254) =====
            10254: 'oinkologne-female',
            
            // ===== MAUSHOLD (10255) =====
            10262: 'squawkabilly-white-plumage',
            
            // ===== SQUAWKABILLY (10256-10258) =====
            10260: 'squawkabilly-blue-plumage',
            10261: 'squawkabilly-yellow-plumage',
            
            // ===== PALAFIN (10259) =====
           // 10259: 'tatsugiri-droopy',
            
            // ===== TATSUGIRI (10260-10261) =====
            10257: 'maushold-family-of-three',
            10256: 'palafin-hero',
            10258: 'tatsugiri-droopy',
            10259: 'tatsugiri-stretchy',
            
            // ===== DUDUNSPARCE (10262) =====
            10255: 'dudunsparce-three-segment',
            
            // ===== GIMMIGHOUL (10263) =====
            10263: 'gimmighoul-roaming',
                        
            // ===== POLTCHAGEIST (10272) =====
            10272: 'ursaluna_bloodmoon',
            
            // ===== OGERPON-MASKEN (10273-10275) =====
            10273: 'ogerpon-wellspring-mask',
            10274: 'ogerpon-hearthflame-mask',
            10275: 'ogerpon-cornerstone-mask',
                        
            // ===== TERAPAGOS-FORMEN (10277-10278) =====
            10276: 'terapagos-terastal',
            10277: 'terapagos-stellar',
        };
    }
    
    /**
     * Prüft ob der Cache noch gültig ist
     */
    _isCacheValid(cacheData) {
        if (!cacheData || !cacheData.timestamp) return false;
        const cacheAge = Date.now() - cacheData.timestamp;
        const maxAge = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        return cacheAge < maxAge;
    }
    
    /**
     * Speichert Daten im LocalStorage Cache
     */
    _saveToCache(key, data) {
        try {
            const cacheData = { timestamp: Date.now(), data: data };
            localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Cache speichern fehlgeschlagen:', e);
        }
    }
    
    /**
     * Lädt Daten aus dem LocalStorage Cache
     */
    _loadFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            const cacheData = JSON.parse(cached);
            if (this._isCacheValid(cacheData)) {
                return cacheData.data;
            }
            localStorage.removeItem(key);
            return null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Lädt die Liste aller Pokemon - OPTIMIERT
     * Lädt NUR die Basisliste ohne Species-API-Calls für jeden Pokemon
     * @returns {Promise<Array>} Liste der Pokemon
     */
    async fetchPokemonList() {
        try {
            // Erst aus Cache versuchen
            const cachedList = this._loadFromCache(this.CACHE_KEY_POKEMON_LIST);
            if (cachedList && cachedList.length > 0) {
                console.log(`Pokemon-Liste aus Cache geladen (${cachedList.length} Einträge)`);
                this.appState.pokemonList = cachedList;
                return cachedList;
            }
            
            console.log('Lade Pokemon-Liste von API (optimiert)...');
            
            const response = await fetch(API.POKEMON_LIST);
            const data = await response.json();
            
            let pokemonList = [];
            
            // Normale Pokemon verarbeiten - OHNE Species-Calls!
            for (const pokemon of data.results) {
                const pokemonId = this.extractPokemonIdFromUrl(pokemon.url);
                const normalizedName = normalizePokemonName(pokemon.name);
                
                // Deutschen Namen aus lokaler Tabelle holen (falls vorhanden)
                const germanName = this.translationService.getGermanNameFromLocal(normalizedName) 
                    || capitalizeFirstLetter(normalizedName);
                
                pokemonList.push({
                    id: pokemonId,
                    name: normalizedName,
                    germanName: germanName,
                    url: pokemon.url
                });
            }
            
            // Spezielle Pokemon-IDs hinzufügen - MIT korrekten Namen aus der Mapping-Tabelle
            for (let specialId = this.specialPokemonRange.min; specialId <= this.specialPokemonRange.max; specialId++) {
                // Englischen Namen aus der Mapping-Tabelle holen
                const englishName = this.specialPokemonIdToName[specialId];
                
                let germanName;
                let displayName;
                
                if (englishName) {
                    // Deutschen Namen aus dem TranslationService holen
                    germanName = this.translationService.getGermanNameFromLocal(englishName);
                    
                    // Falls kein deutscher Name gefunden, englischen Namen formatieren
                    if (!germanName) {
                        // Formatierung: "vulpix-alola" -> "Vulpix Alola"
                        germanName = englishName.split('-').map(part => 
                            capitalizeFirstLetter(part)
                        ).join(' ');
                    }
                    displayName = englishName;
                } else {
                    // Fallback für nicht gemappte IDs
                    germanName = `Pokemon #${specialId}`;
                    displayName = `special-${specialId}`;
                }
                
                pokemonList.push({
                    id: specialId,
                    name: displayName,
                    germanName: germanName,
                    url: `${API.BASE_URL}/pokemon/${specialId}`,
                    isSpecial: true
                });
            }
            
            // Sortieren: Normale Pokemon nach ID, spezielle Formen alphabetisch nach deutschem Namen
            pokemonList = pokemonList.sort((a, b) => {
                // Erst nach "Basis-ID" sortieren (normale Pokemon zuerst)
                const aIsSpecial = a.id >= 10000;
                const bIsSpecial = b.id >= 10000;
                
                // Normale Pokemon nach ID
                if (!aIsSpecial && !bIsSpecial) {
                    return a.id - b.id;
                }
                
                // Spezielle Pokemon ans Ende
                if (!aIsSpecial && bIsSpecial) return -1;
                if (aIsSpecial && !bIsSpecial) return 1;
                
                // Beide speziell: alphabetisch nach deutschem Namen sortieren
                return a.germanName.localeCompare(b.germanName, 'de');
            });
            
            // Im Cache speichern
            this._saveToCache(this.CACHE_KEY_POKEMON_LIST, pokemonList);
            
            console.log(`Pokemon-Liste geladen: ${pokemonList.length} Einträge`);
            this.appState.pokemonList = pokemonList;
            return pokemonList;
            
        } catch (error) {
            console.error('Fehler beim Laden der Pokemon-Liste:', error);
            return [];
        }
    }
    
    /**
     * Extrahiert die Pokemon-ID aus einer URL
     * @param {string} url - Die Pokemon-URL
     * @returns {number} Die Pokemon-ID
     */
    extractPokemonIdFromUrl(url) {
        // URL-Format ist typischerweise https://pokeapi.co/api/v2/pokemon/1/
        const urlParts = url.split('/');
        // ID ist der vorletzte Teil der URL (vor dem abschließenden Slash)
        return parseInt(urlParts[urlParts.length - 2]);
    }
    
    /**
     * Lädt die Details eines bestimmten Pokemon
     * @param {number} pokemonId - ID des Pokemon
     * @param {boolean} skipLevelCalculation - Wenn true, Level/Stats nicht aus BST berechnen
     * @returns {Promise<Object|null>} Pokemon-Daten oder null bei Fehler
     */
    async fetchPokemonDetails(pokemonId, skipLevelCalculation = false) {
        if (!pokemonId) {
            this.appState.selectedPokemon = null;
            this.appState.pokemonData = null;
            return null;
        }
    
        // Flag für späteren Aufruf von setPokemonData speichern
        this._skipLevelCalculation = skipLevelCalculation;
        
        try {
            // Pokemon-Daten laden mit ID
            const response = await fetch(`${API.BASE_URL}/pokemon/${pokemonId}`);
            
            // Prüfen, ob die Antwort erfolgreich war
            if (!response.ok) {
                console.error(`Fehler beim Laden von Pokemon ID ${pokemonId}: ${response.status} ${response.statusText}`);
                return null;
            }
            
            // Prüfen, ob der Content-Type JSON ist
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error(`Unerwarteter Content-Type für Pokemon ID ${pokemonId}: ${contentType}`);
                return null;
            }
            
            const data = await response.json();
    
            // Species-Daten für zusätzliche Informationen laden
            const speciesResponse = await fetch(data.species.url);
            const speciesData = await speciesResponse.json();
            
            // Deutschen Pokémon-Namen ermitteln
            const germanName = this.translationService.translatePokemonName(data.name, speciesData);
            
            // Pokemon in der Liste aktualisieren (für spezielle Pokemon)
            const listEntry = this.appState.pokemonList.find(p => p.id === pokemonId);
            if (listEntry && listEntry.isSpecial) {
                listEntry.name = normalizePokemonName(data.name);
                listEntry.germanName = germanName;
                // Cache aktualisieren
                this._saveToCache(this.CACHE_KEY_POKEMON_LIST, this.appState.pokemonList);
            }
            
            // Typen ins Deutsche übersetzen
            const translatedTypes = data.types.map(typeInfo => {
                return {
                    ...typeInfo,
                    type: {
                        ...typeInfo.type,
                        germanName: this.translationService.translateTypeName(typeInfo.type.name)
                    }
                };
            });
    
            // Wenn möglich, Evolution Chain laden, um genauere Informationen zu haben
            try {
                if (speciesData.evolution_chain && speciesData.evolution_chain.url) {
                    const evolutionResponse = await fetch(speciesData.evolution_chain.url);
                    const evolutionData = await evolutionResponse.json();
                    
                    // Evolutionskette zu den Species-Daten hinzufügen
                    speciesData.evolution_chain_data = evolutionData;
                    
                    // Extraktion der Evolutionsstufe und -level
                    this.extractEvolutionDetails(data.id, evolutionData, speciesData);
                    
                    // Wenn dieses Pokémon eine Entwicklung ist, Daten der Vorentwicklung laden
                    if (speciesData.evolves_from_species) {
                        try {
                            // ID der Vorentwicklung aus der URL extrahieren
                            const preEvoUrl = speciesData.evolves_from_species.url;
                            const preEvoId = this.extractPokemonIdFromUrl(preEvoUrl);
                            
                            // Daten der Vorentwicklung laden
                            const preEvoResponse = await fetch(`${API.BASE_URL}/pokemon/${preEvoId}`);
                            
                            // Prüfen, ob die Antwort erfolgreich war
                            if (!preEvoResponse.ok) {
                                console.error(`Fehler beim Laden der Vorentwicklung mit ID ${preEvoId}: ${preEvoResponse.status} ${preEvoResponse.statusText}`);
                                throw new Error(`Fehler beim Laden der Vorentwicklung mit ID ${preEvoId}`);
                            }
                            
                            // Prüfen, ob der Content-Type JSON ist
                            const contentType = preEvoResponse.headers.get('content-type');
                            if (!contentType || !contentType.includes('application/json')) {
                                console.error(`Unerwarteter Content-Type für Vorentwicklung ID ${preEvoId}: ${contentType}`);
                                throw new Error(`Unerwarteter Content-Type für Vorentwicklung ID ${preEvoId}`);
                            }
                            
                            const preEvoData = await preEvoResponse.json();
                            
                            // Vorentwicklungs-Species-Daten laden
                            const preEvoSpeciesResponse = await fetch(preEvoData.species.url);
                            const preEvoSpeciesData = await preEvoSpeciesResponse.json();
                            
                            // Evolutionsdetails für die Vorentwicklung extrahieren
                            this.extractEvolutionDetails(preEvoId, evolutionData, preEvoSpeciesData);
                            
                            // Deutschen Namen der Vorentwicklung ermitteln
                            const preEvoName = normalizePokemonName(preEvoData.name);
                            const preEvoGermanName = this.translationService.translatePokemonName(preEvoName, preEvoSpeciesData);
                            
                            // Vorentwicklungsdaten zum speciesData hinzufügen, mit deutschem Namen
                            speciesData.pre_evolution_data = {
                                ...preEvoData,
                                germanName: preEvoGermanName
                            };
                            speciesData.pre_evolution_species_data = preEvoSpeciesData;
                        } catch (preEvoError) {
                            console.error('Fehler beim Laden der Vorentwicklungsdaten:', preEvoError);
                        }
                    }
                }
            } catch (evolutionError) {
                console.error('Fehler beim Laden der Evolutionskette:', evolutionError);
            }
    
            // Daten im AppState speichern, mit deutschen Namen
            const enhancedData = {
                ...data,
                germanName: germanName,
                types: translatedTypes
            };
            
            // Default-Geschlecht basierend auf gender_rate berechnen
            const genderRate = speciesData.gender_rate;
            const defaultGender = AppState.calculateDefaultGender(genderRate);
            
            // Speichere gender_rate und defaultGender in den Daten für spätere Referenz
            enhancedData.genderRate = genderRate;
            enhancedData.defaultGender = defaultGender;
            
            this.appState.setPokemonData(enhancedData, speciesData, this._skipLevelCalculation);
            
            // Setze das Default-Geschlecht, falls noch nicht durch Import überschrieben
            // (skipLevelCalculation bedeutet, dass wir aus einem Import kommen)
            if (!this._skipLevelCalculation) {
                this.appState.setGender(defaultGender);
            }
            
            // Fähigkeiten abrufen und im AppState speichern
            try {
                // ID des Pokémon verwenden
                const pokemonIdForAbilities = data.id;
                
                // Für alle Pokemon (reguläre und spezielle) Fähigkeiten laden
                if (pokemonIdForAbilities && (
                    (pokemonIdForAbilities >= this.standardPokemonRange.min && pokemonIdForAbilities <= this.standardPokemonRange.max) ||
                    (pokemonIdForAbilities >= this.specialPokemonRange.min && pokemonIdForAbilities <= this.specialPokemonRange.max)
                )) {
                    // Fähigkeiten mit Hilfe des abilityService abrufen
                    const abilities = getAbilities(pokemonIdForAbilities);
                    this.appState.abilities = abilities;
                }
            } catch (abilitiesError) {
                console.error('Fehler beim Laden der Fähigkeiten:', abilitiesError);
                this.appState.abilities = ["Unbekannt", "Unbekannt", "Unbekannt"];
            }

            return this.appState.pokemonData;
        } catch (error) {
            console.error('Fehler beim Laden der Pokemon-Daten:', error);
            return null;
        }
    }
    
    /**
     * Extrahiert alle Vorentwicklungs-IDs aus der Evolutionskette
     * @param {number} currentPokemonId - ID des aktuellen Pokemon
     * @param {Object} evolutionChainData - Die Evolutionsketten-Daten
     * @returns {Array<number>} Array aller Vorentwicklungs-IDs (leer wenn Basis-Pokemon)
     */
    getPreEvolutionIds(currentPokemonId, evolutionChainData) {
        if (!evolutionChainData || !evolutionChainData.chain) {
            return [];
        }
        
        const preEvolutionIds = [];
        
        // Rekursive Funktion zum Durchsuchen der Kette
        const findPathToId = (node, path = []) => {
            const nodeId = this.extractPokemonIdFromUrl(node.species.url);
            
            // Wenn wir das Ziel-Pokemon gefunden haben, ist der Pfad unsere Vorentwicklungsliste
            if (nodeId === currentPokemonId) {
                return path;
            }
            
            // Rekursiv durch alle Evolutionen suchen
            for (const evolution of node.evolves_to) {
                const result = findPathToId(evolution, [...path, nodeId]);
                if (result) {
                    return result;
                }
            }
            
            return null;
        };
        
        const path = findPathToId(evolutionChainData.chain);
        return path || [];
    }
    
    /**
     * Extrahiert Evolutionsdetails aus der Evolutionskette
     * @param {number} pokemonId - ID des aktuellen Pokemon
     * @param {Object} evolutionData - Evolutionskettendaten
     * @param {Object} speciesData - Species-Daten (werden modifiziert)
     */
    extractEvolutionDetails(pokemonId, evolutionData, speciesData) {
        const chain = evolutionData.chain;
        speciesData.evolution_stage = 0;
        speciesData.evolution_from_level = 0;
        speciesData.first_evolution_level = 0;
        speciesData.second_evolution_level = 0; // Für die zweite Evolutionsstufe
        speciesData.prev_form_id = null; // ID der Vorform
        speciesData.remaining_evolutions = 0; // Anzahl der verbleibenden Evolutionen
        
        // Evolutionsstufen und Pfad speichern
        let evolutionPath = [];
        
        // Funktion zur rekursiven Durchsuchung der Evolutionskette
        const searchEvolutionChain = (chainNode, currentStage = 0, pathToHere = []) => {
            // Aktuelle Form prüfen
            const speciesUrl = chainNode.species.url;
            const speciesId = this.extractPokemonIdFromUrl(speciesUrl);
            const currentPath = [...pathToHere];
            
            if (speciesId === pokemonId) {
                speciesData.evolution_stage = currentStage;
                
                // Evolutionspfad speichern
                evolutionPath = currentPath;
                
                // Wenn es sich um eine entwickelte Form handelt und wir den Pfad haben
                if (currentStage > 0 && currentPath.length > 0) {
                    // Das Level der unmittelbaren Vorform-Entwicklung
                    speciesData.evolution_from_level = currentPath[currentPath.length - 1].level;
                    
                    // Das Level der ERSTEN Entwicklung in der Kette
                    speciesData.first_evolution_level = currentPath[0].level;
                    
                    // Das Level der ZWEITEN Entwicklung in der Kette (falls vorhanden)
                    if (currentPath.length > 1) {
                        speciesData.second_evolution_level = currentPath[1].level;
                    }
                    
                    // Vorform speichern
                    speciesData.prev_form_id = currentPath[currentPath.length - 1].fromId;
                }
                
                // Verbleibende Evolutionen zählen
                speciesData.remaining_evolutions = countRemainingEvolutions(chainNode);
                
                return true;
            }
            
            // Evolutionen prüfen
            for (const evolution of chainNode.evolves_to) {
                const evolutionDetails = evolution.evolution_details[0];
                let evolutionLevel = 0;
                
                // Level-basierte Evolution
                if (evolutionDetails && evolutionDetails.min_level) {
                    evolutionLevel = evolutionDetails.min_level;
                } 
                // Freundschafts-basierte Evolution (schätzen Level 25-30)
                else if (evolutionDetails && evolutionDetails.min_happiness) {
                    evolutionLevel = 25;
                } 
                // Item-basierte Evolution (schätzen Level 20-30)
                else if (evolutionDetails && evolutionDetails.item) {
                    evolutionLevel = 20;
                }
                // Andere Evolutionsarten (schätzen Level 20)
                else {
                    evolutionLevel = 20;
                }
                
                // ID für die aktuelle Form aus der URL extrahieren
                const fromId = this.extractPokemonIdFromUrl(chainNode.species.url);
                // ID für die Evolutionsform aus der URL extrahieren
                const toId = this.extractPokemonIdFromUrl(evolution.species.url);
                
                // Path für diese Entwicklung aktualisieren
                const newPath = [...currentPath, { 
                    fromId: fromId,
                    toId: toId,
                    level: evolutionLevel 
                }];
                
                // Rekursiver Aufruf für die nächste Evolutionsstufe
                if (searchEvolutionChain(evolution, currentStage + 1, newPath)) {
                    return true;
                }
            }
            
            return false;
        };
        
        // Zählt die verbleibenden Evolutionen ab einem bestimmten Knoten
        const countRemainingEvolutions = (node) => {
            if (!node.evolves_to || node.evolves_to.length === 0) {
                return 0;
            }
            
            // Nimm die erste Evolutionskette (für einfache Fälle)
            const evolution = node.evolves_to[0];
            return 1 + countRemainingEvolutions(evolution);
        };
        
        // Evolutionskette durchsuchen
        searchEvolutionChain(chain);
    }
    
    /**
     * Lädt und kategorisiert die Attacken eines Pokemon
     * Kategorien (in dieser Reihenfolge, mit Separatoren):
     * 1. Level-Up Attacken (aktuelle Generation) - sortiert nach Level
     * 2. Level-Up Attacken (frühere Generationen) - mit Generation-Angabe
     * 3. TM-Attacken (alle Spiele)
     * 4. Andere Attacken (Tutor, Egg, etc.)
     * 
     * Jede Attacke erscheint nur in der ersten Kategorie, in der sie vorkommt!
     * 
     * @param {Object} pokemonData - Pokemon-Daten
     * @returns {Promise<Array>} Sortierte Liste der Attacken mit Kategorien
     */
    async fetchPokemonMoves(pokemonData) {
        if (!pokemonData) return [];
        
        // Aktuelle Spielversionen (neueste Generation zuerst)
        const currentVersions = ['scarlet-violet', 'sword-shield', 'lets-go-pikachu-lets-go-eevee'];
        
        // Alle Spielversionen nach Generation geordnet (neueste zuerst)
        const versionsByGeneration = {
            9: ['scarlet-violet'],
            8: ['sword-shield', 'brilliant-diamond-and-shining-pearl', 'lets-go-pikachu-lets-go-eevee'],
            7: ['ultra-sun-ultra-moon', 'sun-moon'],
            6: ['omega-ruby-alpha-sapphire', 'x-y'],
            5: ['black-2-white-2', 'black-white'],
            4: ['heartgold-soulsilver', 'platinum', 'diamond-pearl'],
            3: ['emerald', 'firered-leafgreen', 'ruby-sapphire'],
            2: ['crystal', 'gold-silver'],
            1: ['yellow', 'red-blue']
        };
        
        // Generation-Namen für die Anzeige
        const generationNames = {
            9: 'Gen 9', 8: 'Gen 8', 7: 'Gen 7', 6: 'Gen 6', 
            5: 'Gen 5', 4: 'Gen 4', 3: 'Gen 3', 2: 'Gen 2', 1: 'Gen 1'
        };
        
        // Kategorien für Attacken
        const currentLevelUpMoves = [];      // Kategorie 1: Level-Up (aktuell)
        const legacyLevelUpMoves = [];       // Kategorie 2: Level-Up (frühere Gens)
        const tmMoves = [];                   // Kategorie 3: TM
        const otherMoves = [];                // Kategorie 4: Andere (Tutor, Egg, etc.)
        
        // Set für bereits verarbeitete Attacken (zur Duplikat-Erkennung)
        const processedMoveNames = new Set();
        
        // Alle Attacken laden und verarbeiten
        for (const moveEntry of pokemonData.moves) {
            const moveName = moveEntry.move.name;
            
            // Attacken-Daten laden
            let moveData;
            try {
                const moveResponse = await fetch(moveEntry.move.url);
                moveData = await moveResponse.json();
            } catch (error) {
                console.error(`Fehler beim Laden der Attackendaten für ${moveName}:`, error);
                continue;
            }
            
            // Deutschen Namen der Attacke ermitteln
            const germanMoveName = this.translationService.translateMoveName(moveName, moveData);
            const germanType = this.translationService.translateTypeName(moveData.type.name);
            
            // Alle Versionsdetails dieser Attacke analysieren
            const versionDetails = moveEntry.version_group_details;
            
            // 1. Prüfen auf Level-Up in aktueller Generation
            let currentLevelUpDetail = null;
            for (const version of currentVersions) {
                const detail = versionDetails.find(
                    d => d.version_group.name === version && d.move_learn_method.name === 'level-up'
                );
                if (detail) {
                    currentLevelUpDetail = detail;
                    break;
                }
            }
            
            if (currentLevelUpDetail && !processedMoveNames.has(moveName)) {
                const move = this._createMoveObject(
                    moveData, currentLevelUpDetail, germanMoveName, germanType,
                    'current-level-up', `Lv ${currentLevelUpDetail.level_learned_at}`
                );
                currentLevelUpMoves.push(move);
                processedMoveNames.add(moveName);
                continue;
            }
            
            // 2. Prüfen auf Level-Up in früheren Generationen
            if (!processedMoveNames.has(moveName)) {
                let legacyLevelUpDetail = null;
                let legacyGeneration = null;
                
                // Von neuester zu ältester Generation suchen
                for (let gen = 9; gen >= 1; gen--) {
                    const versions = versionsByGeneration[gen] || [];
                    for (const version of versions) {
                        // Aktuelle Versionen überspringen (bereits geprüft)
                        if (currentVersions.includes(version)) continue;
                        
                        const detail = versionDetails.find(
                            d => d.version_group.name === version && d.move_learn_method.name === 'level-up'
                        );
                        if (detail) {
                            legacyLevelUpDetail = detail;
                            legacyGeneration = gen;
                            break;
                        }
                    }
                    if (legacyLevelUpDetail) break;
                }
                
                if (legacyLevelUpDetail) {
                    const levelInfo = legacyLevelUpDetail.level_learned_at > 0 
                        ? `Lv ${legacyLevelUpDetail.level_learned_at}, ` 
                        : '';
                    const move = this._createMoveObject(
                        moveData, legacyLevelUpDetail, germanMoveName, germanType,
                        'legacy-level-up', `${levelInfo}${generationNames[legacyGeneration]}`
                    );
                    legacyLevelUpMoves.push(move);
                    processedMoveNames.add(moveName);
                    continue;
                }
            }
            
            // 3. Prüfen auf TM/HM in irgendeinem Spiel
            if (!processedMoveNames.has(moveName)) {
                const tmDetail = versionDetails.find(
                    d => d.move_learn_method.name === 'machine'
                );
                
                if (tmDetail) {
                    const move = this._createMoveObject(
                        moveData, tmDetail, germanMoveName, germanType,
                        'tm', 'TM'
                    );
                    tmMoves.push(move);
                    processedMoveNames.add(moveName);
                    continue;
                }
            }
            
            // 4. Alle anderen Lernmethoden (Tutor, Egg, etc.)
            if (!processedMoveNames.has(moveName)) {
                const otherDetail = versionDetails.find(
                    d => ['tutor', 'egg', 'stadium-surfing-pikachu', 'light-ball-egg', 'colosseum-purification', 'xd-shadow', 'xd-purification', 'form-change', 'zygarde-cube'].includes(d.move_learn_method.name)
                );
                
                if (otherDetail) {
                    // Lernmethode für Anzeige formatieren
                    const methodNames = {
                        'tutor': 'Tutor',
                        'egg': 'Ei',
                        'stadium-surfing-pikachu': 'Event',
                        'light-ball-egg': 'Ei (Lichtball)',
                        'colosseum-purification': 'Colosseum',
                        'xd-shadow': 'XD',
                        'xd-purification': 'XD',
                        'form-change': 'Formwandel',
                        'zygarde-cube': 'Zygarde-Würfel'
                    };
                    const methodName = methodNames[otherDetail.move_learn_method.name] || otherDetail.move_learn_method.name;
                    
                    const move = this._createMoveObject(
                        moveData, otherDetail, germanMoveName, germanType,
                        'other', methodName
                    );
                    otherMoves.push(move);
                    processedMoveNames.add(moveName);
                }
            }
        }
        
        // Sortieren
        currentLevelUpMoves.sort((a, b) => a.levelLearned - b.levelLearned);
        legacyLevelUpMoves.sort((a, b) => a.germanName.localeCompare(b.germanName, 'de'));
        tmMoves.sort((a, b) => a.germanName.localeCompare(b.germanName, 'de'));
        otherMoves.sort((a, b) => a.germanName.localeCompare(b.germanName, 'de'));
        
        // === NEU: Attacken von Vorentwicklungen laden ===
        const preEvolutionMoves = [];
        
        // Vorentwicklungs-IDs aus pokemonData.speciesData holen (falls evolution_chain_data vorhanden)
        const speciesData = pokemonData.speciesData || this.appState.pokemonData?.speciesData;
        if (speciesData && speciesData.evolution_chain_data) {
            const preEvoIds = this.getPreEvolutionIds(
                pokemonData.id, 
                speciesData.evolution_chain_data
            );
            
            if (preEvoIds.length > 0) {
                console.log(`Lade Attacken von ${preEvoIds.length} Vorentwicklung(en): ${preEvoIds.join(', ')}`);
                
                // Für jede Vorentwicklung die Attacken laden
                for (const preEvoId of preEvoIds) {
                    try {
                        // Pokemon-Daten der Vorentwicklung laden
                        const preEvoResponse = await fetch(`${API.BASE_URL}/pokemon/${preEvoId}`);
                        if (!preEvoResponse.ok) continue;
                        
                        const preEvoData = await preEvoResponse.json();
                        
                        // Deutschen Namen für die Vorentwicklung ermitteln
                        let preEvoGermanName = '';
                        try {
                            const preEvoSpeciesResponse = await fetch(preEvoData.species.url);
                            const preEvoSpeciesData = await preEvoSpeciesResponse.json();
                            preEvoGermanName = this.translationService.translatePokemonName(
                                preEvoData.name, 
                                preEvoSpeciesData
                            );
                        } catch (e) {
                            preEvoGermanName = capitalizeFirstLetter(preEvoData.name);
                        }
                        
                        // Alle Attacken der Vorentwicklung durchgehen
                        for (const moveEntry of preEvoData.moves) {
                            const moveName = moveEntry.move.name;
                            
                            // Überspringen, wenn diese Attacke bereits verarbeitet wurde
                            if (processedMoveNames.has(moveName)) continue;
                            
                            // Attacken-Daten laden
                            let moveData;
                            try {
                                const moveResponse = await fetch(moveEntry.move.url);
                                moveData = await moveResponse.json();
                            } catch (error) {
                                console.error(`Fehler beim Laden der Attackendaten für ${moveName}:`, error);
                                continue;
                            }
                            
                            // Deutschen Namen der Attacke ermitteln
                            const germanMoveName = this.translationService.translateMoveName(moveName, moveData);
                            const germanType = this.translationService.translateTypeName(moveData.type.name);
                            
                            // Prüfen, ob diese Attacke tatsächlich lernbar war
                            const versionDetails = moveEntry.version_group_details;
                            const hasValidLearnMethod = versionDetails.some(d => 
                                ['level-up', 'machine', 'tutor', 'egg'].includes(d.move_learn_method.name)
                            );
                            
                            if (hasValidLearnMethod) {
                                const move = this._createMoveObject(
                                    moveData, 
                                    versionDetails[0], 
                                    germanMoveName, 
                                    germanType,
                                    'pre-evolution', 
                                    `Via ${preEvoGermanName}`
                                );
                                preEvolutionMoves.push(move);
                                processedMoveNames.add(moveName);
                            }
                        }
                    } catch (error) {
                        console.error(`Fehler beim Laden der Vorentwicklungs-Attacken für ID ${preEvoId}:`, error);
                    }
                }
            }
        }
        
        // Vorentwicklungs-Attacken sortieren
        preEvolutionMoves.sort((a, b) => a.germanName.localeCompare(b.germanName, 'de'));
        
        // Alle Kategorien mit Separatoren zusammenführen
        const allMoves = [];
        
        // Kategorie 1: Aktuelle Level-Up Attacken
        if (currentLevelUpMoves.length > 0) {
            allMoves.push(...currentLevelUpMoves);
        }
        
        // Separator 1
        if (currentLevelUpMoves.length > 0 && legacyLevelUpMoves.length > 0) {
            allMoves.push({ isSeparator: true, label: '── Frühere Generationen ──' });
        }
        
        // Kategorie 2: Legacy Level-Up Attacken
        if (legacyLevelUpMoves.length > 0) {
            allMoves.push(...legacyLevelUpMoves);
        }
        
        // Separator 2
        if ((currentLevelUpMoves.length > 0 || legacyLevelUpMoves.length > 0) && tmMoves.length > 0) {
            allMoves.push({ isSeparator: true, label: '── TM-Attacken ──' });
        }
        
        // Kategorie 3: TM Attacken
        if (tmMoves.length > 0) {
            allMoves.push(...tmMoves);
        }
        
        // Separator 3
        if ((currentLevelUpMoves.length > 0 || legacyLevelUpMoves.length > 0 || tmMoves.length > 0) && otherMoves.length > 0) {
            allMoves.push({ isSeparator: true, label: '── Andere ──' });
        }
        
        // Kategorie 4: Andere Attacken
        if (otherMoves.length > 0) {
            allMoves.push(...otherMoves);
        }
        
        // Separator 4: Vorentwicklungs-Attacken
        if ((currentLevelUpMoves.length > 0 || legacyLevelUpMoves.length > 0 || tmMoves.length > 0 || otherMoves.length > 0) && preEvolutionMoves.length > 0) {
            allMoves.push({ isSeparator: true, label: '── Via Vorentwicklung ──' });
        }
        
        // Kategorie 5: Vorentwicklungs-Attacken
        if (preEvolutionMoves.length > 0) {
            allMoves.push(...preEvolutionMoves);
        }
        
        // === NEU: Alle fehlenden Attacken laden ===
        const remainingMoves = await this._fetchRemainingMoves(processedMoveNames);
        
        // Separator 5: Alle anderen Attacken (nicht lernbar)
        if (remainingMoves.length > 0) {
            allMoves.push({ isSeparator: true, label: '══════════════════════════════════' });
            allMoves.push({ isSeparator: true, label: '── Alle anderen Attacken ──' });
        }
        
        // Kategorie 6: Fehlende/Sonstige Attacken
        if (remainingMoves.length > 0) {
            allMoves.push(...remainingMoves);
        }
        
        // Im AppState speichern
        this.appState.setAvailableMoves(allMoves);
        
        return allMoves;
    }
    
    /**
     * Hilfsmethode zum Erstellen eines Move-Objekts mit erweiterter Kategorie-Info
     * @private
     */
    _createMoveObject(moveData, methodData, germanName, germanType, category, learnMethodDisplay) {
        const move = new PokemonMove(moveData, methodData, germanName, germanType);
        move.category = category;
        move.learnMethodDisplay = learnMethodDisplay;
        return move;
    }
    
    /**
     * Lädt die Liste aller verfügbaren Attacken von der API (mit Cache)
     * @returns {Promise<Array>} Liste aller Attacken mit Name und URL
     */
    async fetchAllMovesList() {
        // Prüfen, ob gecachte Daten vorhanden sind
        const cached = localStorage.getItem(this.CACHE_KEY_ALL_MOVES);
        if (cached) {
            try {
                const cachedData = JSON.parse(cached);
                const cacheAge = Date.now() - cachedData.timestamp;
                const maxAge = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
                
                if (cacheAge < maxAge) {
                    console.log('Verwende gecachte Attacken-Liste');
                    return cachedData.moves;
                }
            } catch (e) {
                console.warn('Fehler beim Lesen des Move-Caches:', e);
            }
        }
        
        // Alle Attacken von der API laden (es gibt ca. 900+ Attacken)
        console.log('Lade alle Attacken von der API...');
        try {
            const response = await fetch(`${API.BASE_URL}/move?limit=1000`);
            if (!response.ok) {
                throw new Error(`API-Fehler: ${response.status}`);
            }
            
            const data = await response.json();
            const moves = data.results;
            
            // In Cache speichern
            localStorage.setItem(this.CACHE_KEY_ALL_MOVES, JSON.stringify({
                timestamp: Date.now(),
                moves: moves
            }));
            
            console.log(`${moves.length} Attacken geladen und gecacht`);
            return moves;
        } catch (error) {
            console.error('Fehler beim Laden der Attacken-Liste:', error);
            return [];
        }
    }
    
    /**
     * Lädt alle fehlenden Attacken (die das Pokemon nicht lernen kann)
     * @param {Set} processedMoveNames - Namen der bereits verarbeiteten Attacken
     * @returns {Promise<Array>} Liste der fehlenden Attacken
     * @private
     */
    async _fetchRemainingMoves(processedMoveNames) {
        const remainingMoves = [];
        
        // Alle verfügbaren Attacken laden
        const allMoves = await this.fetchAllMovesList();
        
        // Fehlende Attacken ermitteln
        const missingMoves = allMoves.filter(move => !processedMoveNames.has(move.name));
        
        console.log(`${missingMoves.length} fehlende Attacken gefunden, werden geladen...`);
        
        // Status-Update für UI (falls vorhanden)
        const statusElement = document.getElementById('loading-status');
        if (statusElement) {
            statusElement.textContent = `Lade zusätzliche Attacken... (0/${missingMoves.length})`;
        }
        
        // Attacken in Batches laden, um die API nicht zu überlasten
        const batchSize = 20;
        for (let i = 0; i < missingMoves.length; i += batchSize) {
            const batch = missingMoves.slice(i, i + batchSize);
            
            // Parallel laden für bessere Performance
            const batchPromises = batch.map(async (moveEntry) => {
                try {
                    const moveResponse = await fetch(moveEntry.url);
                    if (!moveResponse.ok) return null;
                    
                    const moveData = await moveResponse.json();
                    
                    // Deutschen Namen ermitteln
                    const germanMoveName = this.translationService.translateMoveName(moveEntry.name, moveData);
                    const germanType = this.translationService.translateTypeName(moveData.type.name);
                    
                    // Dummy-methodData für Attacken, die das Pokemon nicht lernen kann
                    const dummyMethodData = {
                        move_learn_method: { name: 'other' },
                        level_learned_at: 0
                    };
                    
                    return this._createMoveObject(
                        moveData,
                        dummyMethodData,
                        germanMoveName,
                        germanType,
                        'all-moves',
                        'Sonstige'
                    );
                } catch (error) {
                    console.error(`Fehler beim Laden von ${moveEntry.name}:`, error);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            remainingMoves.push(...batchResults.filter(m => m !== null));
            
            // Status-Update
            if (statusElement) {
                statusElement.textContent = `Lade zusätzliche Attacken... (${Math.min(i + batchSize, missingMoves.length)}/${missingMoves.length})`;
            }
        }
        
        // Alphabetisch sortieren
        remainingMoves.sort((a, b) => a.germanName.localeCompare(b.germanName, 'de'));
        
        console.log(`${remainingMoves.length} zusätzliche Attacken erfolgreich geladen`);
        
        return remainingMoves;
    }
    
    /**
     * Löscht den Pokemon-Listen-Cache (für Debug/Reset)
     */
    clearCache() {
        localStorage.removeItem(this.CACHE_KEY_POKEMON_LIST);
        localStorage.removeItem(this.CACHE_KEY_ALL_MOVES);
        console.log('Pokemon-Listen-Cache und Attacken-Cache gelöscht');
    }
}