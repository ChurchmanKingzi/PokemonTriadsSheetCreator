/**
 * EvolutionService
 * =================
 * Verwaltet die Entwicklungs-Funktionalität für Pokemon
 * - Ermittelt mögliche direkte Entwicklungen
 * - Führt Entwicklungen durch (transformiert das aktuelle Pokemon)
 * 
 * WICHTIG: Verwendet UUID-basierte Persistenz.
 * Die UUID bleibt gleich auch wenn sich die Spezies ändert!
 */
class EvolutionService {
    constructor() {
        this.translationService = new TranslationService();
        this.evolutionData = null; // Cache für Entwicklungsdaten
        console.log('EvolutionService initialisiert');
    }
    
    /**
     * Ermittelt alle direkten Entwicklungen des aktuellen Pokemon
     * @param {Object} pokemonData - Das aktuelle Pokemon (inkl. speciesData)
     * @returns {Promise<Array>} Array von möglichen Entwicklungen
     */
    async getDirectEvolutions(pokemonData) {
        if (!pokemonData || !pokemonData.speciesData) {
            console.log('EvolutionService: Keine Pokemon-Daten vorhanden');
            return [];
        }
        
        const speciesData = pokemonData.speciesData;
        const evolutionChainData = speciesData.evolution_chain_data;
        
        if (!evolutionChainData || !evolutionChainData.chain) {
            console.log('EvolutionService: Keine Evolutionsketten-Daten vorhanden');
            return [];
        }
        
        const currentPokemonId = pokemonData.id;
        const evolutions = [];
        
        // Rekursive Funktion zum Durchsuchen der Kette
        const findEvolutions = (node) => {
            const nodeId = this._extractIdFromUrl(node.species.url);
            
            // Wenn wir das aktuelle Pokemon gefunden haben
            if (nodeId === currentPokemonId) {
                // Alle direkten Entwicklungen (evolves_to) sammeln
                for (const evolution of node.evolves_to) {
                    const evoId = this._extractIdFromUrl(evolution.species.url);
                    const evoName = evolution.species.name;
                    
                    evolutions.push({
                        id: evoId,
                        name: evoName,
                        evolutionDetails: evolution.evolution_details
                    });
                }
                return true; // Gefunden, keine weitere Suche nötig
            }
            
            // Rekursiv durch alle Evolutionen suchen
            for (const evolution of node.evolves_to) {
                if (findEvolutions(evolution)) {
                    return true;
                }
            }
            
            return false;
        };
        
        findEvolutions(evolutionChainData.chain);
        
        // Für jede Entwicklung die vollständigen Daten laden
        const evolutionsWithDetails = await Promise.all(
            evolutions.map(async (evo) => {
                try {
                    // Pokemon-Daten laden
                    const response = await fetch(`${API.BASE_URL}/pokemon/${evo.id}`);
                    if (!response.ok) return null;
                    const data = await response.json();
                    
                    // Species-Daten für deutschen Namen laden
                    const speciesResponse = await fetch(data.species.url);
                    if (!speciesResponse.ok) return null;
                    const speciesData = await speciesResponse.json();
                    
                    // Deutschen Namen ermitteln
                    const germanName = this.translationService.translatePokemonName(data.name, speciesData);
                    
                    // Primären Typ ermitteln
                    const primaryType = data.types[0]?.type?.name || 'normal';
                    
                    return {
                        id: evo.id,
                        name: evo.name,
                        germanName: germanName,
                        sprite: data.sprites.front_default,
                        types: data.types,
                        primaryType: primaryType,
                        evolutionDetails: evo.evolutionDetails,
                        fullData: data,
                        speciesData: speciesData
                    };
                } catch (error) {
                    console.error(`Fehler beim Laden der Entwicklung ${evo.name}:`, error);
                    return null;
                }
            })
        );
        
        // Null-Werte filtern
        const validEvolutions = evolutionsWithDetails.filter(e => e !== null);
        
        console.log(`EvolutionService: ${validEvolutions.length} mögliche Entwicklung(en) gefunden`);
        return validEvolutions;
    }
    
    /**
     * Führt eine Entwicklung durch - transformiert das aktuelle Pokemon
     * Behält: Level, EXP, Stats, Attacken, Spitzname, Fertigkeiten, Freundschaft, Wunden
     * Ändert: Spezies, Typen, Würfelklasse, Fähigkeiten
     * 
     * WICHTIG: Die UUID des Pokemon bleibt gleich! Nur die Spezies-Daten ändern sich.
     * 
     * @param {Object} targetEvolution - Die Ziel-Entwicklungsform
     * @param {Object} appState - Der aktuelle AppState
     * @returns {Promise<boolean>} Erfolg
     */
    async evolve(targetEvolution, appState) {
        if (!targetEvolution || !appState) {
            console.error('EvolutionService.evolve: Ungültige Parameter');
            return false;
        }
        
        console.log(`EvolutionService: Entwickle zu ${targetEvolution.germanName}...`);
        
        try {
            // 1. Alte Werte sichern, die beibehalten werden sollen
            const preservedData = {
                level: appState.level,
                currentExp: appState.currentExp,
                stats: { ...appState.stats },
                currentHp: appState.currentHp,
                gena: appState.gena,
                pa: appState.pa,
                bw: appState.bw,
                moves: [...appState.moves],
                skillValues: { ...appState.skillValues },
                tallyMarks: appState.tallyMarks ? [...appState.tallyMarks] : [],
                wounds: appState.wounds || 0,
                primaryStatChoice: appState.primaryStatChoice,
                secondaryStatChoice: appState.secondaryStatChoice
            };
            
            // Textfelder aus der UI sichern
            const preservedTextFields = {
                trainer: document.getElementById('trainer-input')?.value || '',
                nickname: document.getElementById('nickname-input')?.value || '',
                item: document.getElementById('item-input')?.value || ''
            };
            
            // 2. Neue Pokemon-Daten vorbereiten (Evolution-Chain laden)
            const evolutionChainUrl = targetEvolution.speciesData.evolution_chain?.url;
            let evolutionChainData = null;
            
            if (evolutionChainUrl) {
                try {
                    const chainResponse = await fetch(evolutionChainUrl);
                    evolutionChainData = await chainResponse.json();
                } catch (e) {
                    console.warn('Konnte Evolution-Chain nicht laden:', e);
                }
            }
            
            // speciesData mit evolution_chain_data anreichern
            const enrichedSpeciesData = {
                ...targetEvolution.speciesData,
                evolution_chain_data: evolutionChainData
            };
            
            // 3. Typen ins Deutsche übersetzen
            const translatedTypes = targetEvolution.fullData.types.map(typeInfo => {
                return {
                    ...typeInfo,
                    type: {
                        ...typeInfo.type,
                        germanName: this.translationService.translateTypeName(typeInfo.type.name)
                    }
                };
            });
            
            // 4. Evolutionsdetails für die Zielform extrahieren
            // Dies setzt wichtige Felder wie evolution_stage, remaining_evolutions, etc.
            if (evolutionChainData && window.pokemonApp?.apiService) {
                window.pokemonApp.apiService.extractEvolutionDetails(
                    targetEvolution.id, 
                    evolutionChainData, 
                    enrichedSpeciesData
                );
            }
            
            // 5. Neue Pokemon-Daten setzen
            const enhancedData = {
                ...targetEvolution.fullData,
                germanName: targetEvolution.germanName,
                types: translatedTypes,
                speciesData: enrichedSpeciesData
            };
            
            // 6. AppState mit neuen Daten aktualisieren (ohne Level-Neuberechnung!)
            appState.selectedPokemon = targetEvolution.name;
            appState.pokemonData = enhancedData;
            appState.pokemonData.speciesData = enrichedSpeciesData;
            
            // Basis-Stats speichern
            appState.baseStats = {
                hp: targetEvolution.fullData.stats.find(s => s.stat.name === 'hp').base_stat,
                attack: targetEvolution.fullData.stats.find(s => s.stat.name === 'attack').base_stat,
                defense: targetEvolution.fullData.stats.find(s => s.stat.name === 'defense').base_stat,
                spAttack: targetEvolution.fullData.stats.find(s => s.stat.name === 'special-attack').base_stat,
                spDefense: targetEvolution.fullData.stats.find(s => s.stat.name === 'special-defense').base_stat,
                speed: targetEvolution.fullData.stats.find(s => s.stat.name === 'speed').base_stat
            };
            
            // BST berechnen
            const bst = Object.values(appState.baseStats).reduce((sum, val) => sum + val, 0);
            appState.pokemonData.bst = bst;
            
            // Würfelklasse korrekt über DiceCalculator berechnen (wie in setPokemonData)
            const diceClass = appState.calculateDiceClass(
                targetEvolution.fullData, 
                enrichedSpeciesData, 
                bst
            );
            appState.pokemonData.diceClass = diceClass;
            
            console.log(`EvolutionService: Würfelklasse für ${targetEvolution.germanName} berechnet: ${diceClass}`);
            
            // ========== EVOLUTION STAT-BONI ==========
            // Berechne Stat-Boni basierend auf Level und neuer Würfelklasse
            const evolutionBonusData = this._calculateEvolutionStatBonuses(preservedData.level, diceClass);
            
            // Boni auf die erhaltenen Stats anwenden
            Object.entries(evolutionBonusData.bonuses).forEach(([statName, bonus]) => {
                if (preservedData.stats[statName] !== undefined) {
                    preservedData.stats[statName] += bonus;
                }
            });
            
            // Auch currentHp um den HP-Bonus erhöhen
            preservedData.currentHp += evolutionBonusData.bonuses.hp;
            
            // Boni-Daten für die Anzeige speichern
            this._lastEvolutionBonuses = evolutionBonusData;
            
            console.log(`EvolutionService: Stat-Boni angewendet (${evolutionBonusData.multiplier}x ${diceClass}):`, evolutionBonusData.bonuses);
            
            // 6. Erhaltene Werte wiederherstellen
            appState.level = preservedData.level;
            appState.currentExp = preservedData.currentExp;
            appState.stats = preservedData.stats;
            appState.currentHp = preservedData.currentHp;
            appState.gena = preservedData.gena;
            appState.pa = preservedData.pa;
            appState.bw = preservedData.bw;
            appState.moves = preservedData.moves;
            appState.skillValues = preservedData.skillValues;
            appState.tallyMarks = preservedData.tallyMarks;
            appState.wounds = preservedData.wounds;
            appState.primaryStatChoice = preservedData.primaryStatChoice;
            appState.secondaryStatChoice = preservedData.secondaryStatChoice;
            
            // 7. Fähigkeiten für das neue Pokemon laden
            try {
                const abilities = getAbilities(targetEvolution.id);
                appState.abilities = abilities;
            } catch (e) {
                console.warn('Konnte Fähigkeiten nicht laden:', e);
                appState.abilities = ['Unbekannt', 'Unbekannt', 'Unbekannt'];
            }
            
            // 8. UI neu rendern
            const uiRenderer = window.pokemonApp?.uiRenderer;
            if (uiRenderer) {
                uiRenderer.renderPokemonSheet();
                
                // Attacken laden und UI aktualisieren
                const apiService = window.pokemonApp?.apiService;
                if (apiService) {
                    await apiService.fetchPokemonMoves(appState.pokemonData);
                    uiRenderer.updateMoveSelects();
                }
                
                // Kurze Verzögerung, dann Textfelder wiederherstellen
                setTimeout(() => {
                    // Textfelder wiederherstellen
                    const trainerInput = document.getElementById('trainer-input');
                    const nicknameInput = document.getElementById('nickname-input');
                    const itemInput = document.getElementById('item-input');
                    
                    if (trainerInput) trainerInput.value = preservedTextFields.trainer;
                    if (nicknameInput) nicknameInput.value = preservedTextFields.nickname;
                    if (itemInput) itemInput.value = preservedTextFields.item;
                    
                    // Stats in der UI aktualisieren
                    document.getElementById('level-value').value = preservedData.level.toString();
                    document.getElementById('current-exp-input').value = preservedData.currentExp.toString();
                    document.getElementById('max-exp-input').value = (preservedData.level * preservedData.level).toString();
                    document.getElementById('current-hp-input').value = preservedData.currentHp.toString();
                    document.getElementById('max-hp-input').value = preservedData.stats.hp.toString();
                    document.getElementById('gena-input').value = preservedData.gena.toString();
                    document.getElementById('pa-input').value = preservedData.pa.toString();
                    document.getElementById('bw-input').value = preservedData.bw.toString();
                    
                    // Andere Stats aktualisieren
                    const statInputs = document.querySelectorAll('.stat-input[data-stat]');
                    statInputs.forEach(input => {
                        const statName = input.dataset.stat;
                        if (preservedData.stats[statName] !== undefined) {
                            input.value = preservedData.stats[statName].toString();
                        }
                    });
                    
                    // Skill-Werte aktualisieren
                    Object.entries(preservedData.skillValues).forEach(([skill, value]) => {
                        const skillInput = document.querySelector(`input[data-skill="${skill}"]`);
                        if (skillInput) skillInput.value = value.toString();
                    });
                    
                    // Freundschaft aktualisieren
                    if (typeof window.renderTallyMarks === 'function') {
                        window.renderTallyMarks(preservedData.tallyMarks);
                    }
                    
                    // Wunden aktualisieren
                    if (typeof displayWoundsState === 'function') {
                        displayWoundsState(preservedData.wounds);
                    }
                    
                    // Attacken wiederherstellen
                    preservedData.moves.forEach((move, index) => {
                        if (move) {
                            const moveSelect = document.getElementById(`move-${index}`);
                            if (moveSelect) {
                                moveSelect.value = move.name;
                                const event = new Event('change', { bubbles: true });
                                moveSelect.dispatchEvent(event);
                                
                                // Benutzerdefinierte Beschreibung wiederherstellen
                                if (move.customDescription) {
                                    setTimeout(() => {
                                        const descField = document.getElementById(`move-description-${index}`);
                                        if (descField) {
                                            descField.value = move.customDescription;
                                            appState.moves[index].customDescription = move.customDescription;
                                        }
                                    }, 100);
                                }
                            }
                        }
                    });
                    
                    // Dropdown auf neue Spezies aktualisieren
                    const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
                    if (selectElement) {
                        selectElement.value = targetEvolution.id.toString();
                        console.log(`EvolutionService: Dropdown auf ID ${targetEvolution.id} (${targetEvolution.germanName}) aktualisiert`);
                    }
                    
                    // ========== FIX: Sofort speichern ==========
                    if (window.pokemonStorageService) {
                        const saveSuccess = window.pokemonStorageService.saveCurrentPokemon();
                        if (saveSuccess) {
                            console.log(`EvolutionService: Evolution zu ${targetEvolution.germanName} erfolgreich gespeichert`);
                        } else {
                            console.warn('EvolutionService: Speichern nach Evolution fehlgeschlagen');
                        }
                    }
                    
                    // ========== FIX: PokemonSlot im TrainerState über UUID aktualisieren ==========
                    // Die UUID bleibt gleich - nur die Spezies-Daten ändern sich!
                    this._updateTrainerSlotAfterEvolution(targetEvolution);
                    
                }, 300);
            }
            
            console.log(`EvolutionService: Entwicklung zu ${targetEvolution.germanName} erfolgreich!`);
            return true;
            
        } catch (error) {
            console.error('EvolutionService.evolve: Fehler bei der Entwicklung:', error);
            return false;
        }
    }
    
    /**
     * Aktualisiert den PokemonSlot im TrainerState nach einer Evolution.
     * Findet den Slot über die UUID (nicht über den Index!).
     * 
     * @param {Object} targetEvolution - Die Ziel-Entwicklungsform
     * @private
     */
    _updateTrainerSlotAfterEvolution(targetEvolution) {
        // Kontext vom StorageService holen (enthält trainerId und pokemonUuid)
        const context = window.pokemonStorageService?.getContext();
        
        if (!context || !context.pokemonUuid) {
            console.warn('EvolutionService: Kein gültiger Kontext für Slot-Update');
            return;
        }
        
        if (!window.trainerManager) {
            console.warn('EvolutionService: TrainerManager nicht verfügbar');
            return;
        }
        
        const trainer = window.trainerManager.getActiveTrainer();
        if (!trainer || !trainer.pokemonSlots) {
            console.warn('EvolutionService: Kein aktiver Trainer oder keine Slots');
            return;
        }
        
        // ========== FIX: Slot über UUID finden, NICHT über Index! ==========
        const slot = trainer.pokemonSlots.find(s => s.pokemonUuid === context.pokemonUuid);
        
        if (!slot) {
            console.warn(`EvolutionService: Slot mit UUID ${context.pokemonUuid} nicht gefunden`);
            return;
        }
        
        // Slot mit neuen Pokemon-Daten aktualisieren (UUID bleibt gleich!)
        slot.pokemonId = targetEvolution.id;
        slot.pokemonName = targetEvolution.name;
        slot.germanName = targetEvolution.germanName;
        slot.spriteUrl = targetEvolution.sprite;
        slot.types = targetEvolution.types.map(t => t.type.name);
        // slot.pokemonUuid bleibt unverändert!
        
        // TrainerManager speichern
        window.trainerManager._saveToLocalStorage();
        
        console.log(`EvolutionService: PokemonSlot (UUID: ${context.pokemonUuid}) auf ${targetEvolution.germanName} aktualisiert`);
    }
    
    /**
     * Extrahiert die Pokemon-ID aus einer URL
     * @private
     */
    _extractIdFromUrl(url) {
        const parts = url.split('/');
        return parseInt(parts[parts.length - 2], 10);
    }
    
    /**
     * Simuliert einen Würfelwurf basierend auf einer Würfelklasse
     * @param {string} diceClass - Die Würfelklasse (z.B. "1W6", "2W8")
     * @returns {number} Das Würfelergebnis
     * @private
     */
    _rollDice(diceClass) {
        // Parse "1W6", "2W8", etc.
        const match = diceClass.match(/(\d+)W(\d+)/);
        if (!match) return 0;
        
        const numDice = parseInt(match[1], 10);
        const diceSize = parseInt(match[2], 10);
        
        let total = 0;
        for (let i = 0; i < numDice; i++) {
            total += Math.floor(Math.random() * diceSize) + 1;
        }
        
        return total;
    }
    
    /**
     * Berechnet die Evolution-Stat-Boni basierend auf Level und Würfelklasse
     * @param {number} level - Das Level des Pokemon
     * @param {string} diceClass - Die Würfelklasse der entwickelten Form
     * @returns {Object} Objekt mit Stat-Boni und Einzelwürfen
     * @private
     */
    _calculateEvolutionStatBonuses(level, diceClass) {
        // X berechnen: Level 1-10 = 1, 11-20 = 2, usw.
        const evolutionMultiplier = Math.ceil(level / 10);
        
        const statNames = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];
        const bonuses = {};
        const rolls = {}; // Speichert die Einzelwürfe für die Anzeige
        
        statNames.forEach(statName => {
            let totalBonus = 0;
            const individualRolls = [];
            
            // X mal würfeln
            for (let i = 0; i < evolutionMultiplier; i++) {
                const roll = this._rollDice(diceClass);
                individualRolls.push(roll);
                totalBonus += roll;
            }
            
            // KP werden verdreifacht!
            if (statName === 'hp') {
                totalBonus *= 3;
            }
            
            bonuses[statName] = totalBonus;
            rolls[statName] = individualRolls;
        });
        
        return {
            bonuses,
            rolls,
            multiplier: evolutionMultiplier,
            diceClass
        };
    }
}

// Global verfügbar machen
window.evolutionService = new EvolutionService();
console.log('EvolutionService wurde global als window.evolutionService initialisiert.');