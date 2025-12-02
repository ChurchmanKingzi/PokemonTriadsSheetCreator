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
        this.CACHE_KEY_POKEMON_LIST = 'pokemon_list_cache_v3';
        this.CACHE_EXPIRY_DAYS = 7;
        
        // Normale Pokemon IDs (1-1025) und spezielle IDs (10001-10277)
        this.standardPokemonRange = { min: 1, max: 1025 };
        this.specialPokemonRange = { min: 10001, max: 10277 };
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
            
            // Spezielle Pokemon-IDs hinzufügen - auch ohne API-Calls
            for (let specialId = this.specialPokemonRange.min; specialId <= this.specialPokemonRange.max; specialId++) {
                pokemonList.push({
                    id: specialId,
                    name: `special-${specialId}`,
                    germanName: `Pokemon #${specialId}`,
                    url: `${API.BASE_URL}/pokemon/${specialId}`,
                    isSpecial: true
                });
            }
            
            // Sortieren nach ID
            pokemonList = pokemonList.sort((a, b) => a.id - b.id);
            
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
            this.appState.setPokemonData(enhancedData, speciesData, this._skipLevelCalculation);
            
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
     * Löscht den Pokemon-Listen-Cache (für Debug/Reset)
     */
    clearCache() {
        localStorage.removeItem(this.CACHE_KEY_POKEMON_LIST);
        console.log('Pokemon-Listen-Cache gelöscht');
    }
}