/**
 * Service für API-Anfragen an die Pokemon-API mit deutscher Übersetzung
 */
class ApiService {
    /**
     * Konstruktor
     * @param {AppState} appState - Die App-State-Instanz
     */
    constructor(appState) {        
        this.appState = appState;
        this.translationService = new TranslationService();
        
        // Normale Pokemon IDs (1-1025) und spezielle IDs (10001-10277)
        this.standardPokemonRange = { min: 1, max: 1025 };
        this.specialPokemonRange = { min: 10001, max: 10277 };
    }
    
    /**
     * Lädt die Liste aller Pokemon
     * @returns {Promise<Array>} Liste der Pokemon
     */
    async fetchPokemonList() {
        try {
            const response = await fetch(API.POKEMON_LIST);
            const data = await response.json();
            
            // Pokemon-Liste mit deutschen Namen vorbereiten
            let pokemonList = [];
            
            // Normale Pokemon verarbeiten (aus der API-Liste)
            for (const pokemon of data.results) {
                try {
                    // Pokemon-ID aus der URL extrahieren
                    const pokemonId = this.extractPokemonIdFromUrl(pokemon.url);
                    
                    // Für jeden Pokémon die Species-Daten laden, um den deutschen Namen zu erhalten
                    pokemon.name = normalizePokemonName(pokemon.name);
                    const speciesResponse = await fetch(`${API.BASE_URL}/pokemon-species/${pokemonId}`);
                    
                    // Prüfen, ob die Antwort erfolgreich war
                    if (!speciesResponse.ok) {
                        console.error(`Fehler beim Laden der Species-Daten für ID ${pokemonId}: ${speciesResponse.status} ${speciesResponse.statusText}`);
                        throw new Error(`Fehler beim Laden der Species-Daten für ID ${pokemonId}`);
                    }
                    
                    // Prüfen, ob der Content-Type JSON ist
                    const contentType = speciesResponse.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        console.error(`Unerwarteter Content-Type für Species-Daten ID ${pokemonId}: ${contentType}`);
                        throw new Error(`Unerwarteter Content-Type für Species-Daten ID ${pokemonId}`);
                    }
                    
                    const speciesData = await speciesResponse.json();
                    
                    // Deutschen Namen ermitteln
                    const germanName = this.translationService.translatePokemonName(pokemon.name, speciesData);
                    
                    // Pokémon mit deutschem Namen und ID zur Liste hinzufügen
                    pokemonList.push({
                        id: pokemonId, // Pokemon-ID für API-Anfragen
                        name: pokemon.name, // Englischer Name (für Referenz)
                        germanName: germanName, // Deutscher Name (für die Anzeige)
                        url: pokemon.url
                    });
                } catch (speciesError) {
                    console.error(`Fehler beim Laden der Species-Daten für ID ${this.extractPokemonIdFromUrl(pokemon.url)}:`, speciesError);
                    // Bei Fehler den Original-Eintrag verwenden mit ID
                    pokemonList.push({
                        ...pokemon,
                        id: this.extractPokemonIdFromUrl(pokemon.url)
                    });
                }
            }
            
            // ZUSÄTZLICH: Spezielle Pokemon mit IDs 10001-10277 laden und hinzufügen
            for (let specialId = this.specialPokemonRange.min; specialId <= this.specialPokemonRange.max; specialId++) {
                try {
                    // Pokemon-Daten mit der ID direkt laden
                    const pokemonResponse = await fetch(`${API.BASE_URL}/pokemon/${specialId}`);
                    
                    if (!pokemonResponse.ok) {
                        console.error(`Spezielles Pokemon mit ID ${specialId} nicht gefunden: ${pokemonResponse.status}`);
                        continue; // Zum nächsten Pokemon übergehen
                    }
                    
                    const pokemonData = await pokemonResponse.json();
                    
                    // Species-Daten laden für den deutschen Namen
                    const speciesResponse = await fetch(`${API.BASE_URL}/pokemon/${specialId}`);
                    
                    if (!speciesResponse.ok) {
                        console.error(`Species-Daten für spezielles Pokemon ID ${specialId} nicht gefunden: ${speciesResponse.status}`);
                        // Auch ohne Species-Daten hinzufügen (mit englischem Namen)
                        pokemonList.push({
                            id: specialId,
                            name: normalizePokemonName(pokemonData.name),
                            germanName: normalizePokemonName(pokemonData.name), // Fallback: englischer Name
                            url: `${API.BASE_URL}/pokemon/${specialId}`
                        });
                        continue;
                    }
                    
                    const speciesData = await speciesResponse.json();
                    
                    // Normalisierter Name
                    const normalizedName = normalizePokemonName(pokemonData.name);
                    
                    // Deutschen Namen ermitteln
                    const germanName = this.translationService.translatePokemonName(normalizedName, speciesData);
                    
                    // Spezielles Pokémon zur Liste hinzufügen
                    pokemonList.push({
                        id: specialId,
                        name: normalizedName,
                        germanName: germanName,
                        url: `${API.BASE_URL}/pokemon/${specialId}`
                    });
                    
                    console.log(`Spezielles Pokemon hinzugefügt: ID ${specialId}, Name: ${germanName}`);
                } catch (error) {
                    console.error(`Fehler beim Laden des speziellen Pokemon mit ID ${specialId}:`, error);
                    // Fehler bei diesem Pokemon ignorieren und mit dem nächsten fortfahren
                }
            }
            
            // Sortieren nach ID
            pokemonList = pokemonList.sort((a, b) => a.id - b.id);
            
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
     * @returns {Promise<Object|null>} Pokemon-Daten oder null bei Fehler
     */
    async fetchPokemonDetails(pokemonId) {
        if (!pokemonId) {
            this.appState.selectedPokemon = null;
            this.appState.pokemonData = null;
            return null;
        }
    
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
            this.appState.setPokemonData(enhancedData, speciesData);
            
            // Fähigkeiten abrufen und im AppState speichern
            try {
                // ID des Pokémon verwenden
                const pokemonId = data.id;
                
                // Für alle Pokemon (reguläre und spezielle) Fähigkeiten laden
                if (pokemonId && (
                    (pokemonId >= this.standardPokemonRange.min && pokemonId <= this.standardPokemonRange.max) ||
                    (pokemonId >= this.specialPokemonRange.min && pokemonId <= this.specialPokemonRange.max)
                )) {
                    // Fähigkeiten mit Hilfe des abilityService abrufen
                    const abilities = getAbilities(pokemonId);
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
                if (evolutionDetails.min_level) {
                    evolutionLevel = evolutionDetails.min_level;
                } 
                // Freundschafts-basierte Evolution (schätzen Level 25-30)
                else if (evolutionDetails.min_happiness) {
                    evolutionLevel = 25;
                } 
                // Item-basierte Evolution (schätzen Level 20-30)
                else if (evolutionDetails.item) {
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
     * @param {Object} pokemonData - Pokemon-Daten
     * @returns {Promise<Array>} Sortierte Liste der Attacken
     */
    async fetchPokemonMoves(pokemonData) {
        if (!pokemonData) return [];
        
        const pokemonTypes = pokemonData.types.map(type => type.type.name);
        
        // Kategorisiere Attacken
        const levelUpMoves = [];
        const eggMoves = [];
        const tmMoves = [];
        const sameTypeMoves = [];
        const otherMoves = [];

        // Spielversionen in Reihenfolge der Priorität
        const gameVersions = [
            GAME_VERSION,           // Primär: "sword-shield"
            'ultra-sun-ultra-moon', // Fallback 1
            'sun-moon',             // Fallback 2
            'omega-ruby-alpha-sapphire', // Fallback 3
            'x-y',                  // Fallback 4
            'black-white',          // Fallback 5
            'heartgold-soulsilver', // Fallback 6
            'diamond-pearl',        // Fallback 7
            'ruby-sapphire',        // Fallback 8
            'gold-silver',          // Fallback 9
            'red-blue'              // Fallback 10
        ];

        // Level-Up Attacken extrahieren
        for (const moveEntry of pokemonData.moves) {
            let moveDetails = null;
            
            // Versuche jede Spielversion der Reihe nach, bis move_learn_method gefunden wird
            for (const version of gameVersions) {
                const versionDetails = moveEntry.version_group_details.find(
                    detail => detail.version_group.name === version
                );
                
                if (versionDetails) {
                    moveDetails = versionDetails;
                    break; // Sobald eine Version gefunden wurde, die Suche beenden
                }
            }
            
            // Wenn keine Version gefunden wurde, die nächste Attacke versuchen
            if (!moveDetails) continue;
            
            try {
                // Informationen über die Attacke laden
                const moveResponse = await fetch(moveEntry.move.url);
                const moveData = await moveResponse.json();
                
                // Deutschen Namen der Attacke ermitteln
                const germanMoveName = this.translationService.translateMoveName(moveEntry.move.name, moveData);
                
                // Typ der Attacke übersetzen
                const germanType = this.translationService.translateTypeName(moveData.type.name);
                
                // Move-Objekt erstellen mit deutschen Namen
                const move = new PokemonMove(
                    moveData, 
                    moveDetails,
                    germanMoveName,
                    germanType
                );
                
                // In die richtige Kategorie einsortieren
                if (move.isCategory('level-up')) {
                    levelUpMoves.push(move);
                } else if (move.isCategory('egg')) {
                    eggMoves.push(move);
                } else if (move.isCategory('machine')) {
                    tmMoves.push(move);
                } else if (move.isCategory('same-type', pokemonTypes)) {
                    sameTypeMoves.push(move);
                } else {
                    otherMoves.push(move);
                }
            } catch (error) {
                console.error(`Fehler beim Laden der Attackendaten für ${moveEntry.move.name}:`, error);
            }
        }
        
        // Level-Up Attacken nach Level sortieren
        levelUpMoves.sort((a, b) => a.levelLearned - b.levelLearned);
        
        // Alle Kategorien zusammenführen
        const allMoves = [
            ...levelUpMoves,
            ...eggMoves,
            ...tmMoves,
            ...sameTypeMoves,
            ...otherMoves
        ];
        
        // Im AppState speichern
        this.appState.setAvailableMoves(allMoves);
        
        return allMoves;
    }
}