/**
 * Datenmodelle für die Pokemon Sheet Creator App
 */
window.pokemonApp = window.pokemonApp || {};
/**
 * State-Management für die App
 */

class AppState {
    constructor() {
        this.pokemonList = [];
        this.abilities = [];
        this.selectedPokemon = null;
        this.pokemonData = null;
        this.level = 0;
        this.baseStats = {};
        this.stats = {};
        this.currentHp = 0;
        this.gena = DEFAULT_VALUES.GENA_PA_DEFAULT;
        this.pa = DEFAULT_VALUES.GENA_PA_DEFAULT;
        this.bw = 0;
        this.baseBw = 0; // Base BW without KÖ bonus
        this.moves = Array(DEFAULT_VALUES.MOVE_SLOTS).fill(null);
        this.availableMoves = [];
        this.selectedStatForLevelUp = 'hp';
        this.level = 0;
        this.currentExp = 0; 
        this.baseStats = {};
        
        // Skill-Werte initialisieren
        this.skillValues = {};
        
        // Freundschafts-Strichliste initialisieren
        this.tallyMarks = [];

        this.wounds = 0; // Wunden-Status (Anzahl der markierten Wunden)
        
        // Haupt-Kategorien
        Object.keys(SKILL_GROUPS).forEach(category => {
            this.skillValues[category] = DEFAULT_VALUES.SKILL_VALUE;
        });
        
        // Einzelne Skills
        Object.values(SKILL_GROUPS).flat().forEach(skill => {
            this.skillValues[skill] = DEFAULT_VALUES.SKILL_VALUE;
        });
    }

    /**
     * Fügt einen Freundschafts-Strich hinzu
     * @returns {boolean} True bei Erfolg
     */
    addTallyMark() {
        // Sicherstellen, dass tallyMarks initialisiert ist
        if (!this.tallyMarks) {
            this.tallyMarks = [];
        }
        
        this.tallyMarks.push('|');
        
        // Event auslösen
        const event = new CustomEvent('tallyMarksChanged', { 
            detail: { tallyMarks: this.tallyMarks } 
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Entfernt den letzten Freundschafts-Strich
     * @returns {boolean} True bei Erfolg, False wenn keine Striche vorhanden
     */
    removeTallyMark() {
        // Sicherstellen, dass tallyMarks initialisiert ist
        if (!this.tallyMarks) {
            this.tallyMarks = [];
            return false;
        }
        
        if (this.tallyMarks.length === 0) {
            return false;
        }
        
        this.tallyMarks.pop();
        
        // Event auslösen
        const event = new CustomEvent('tallyMarksChanged', { 
            detail: { tallyMarks: this.tallyMarks } 
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Setzt die Freundschafts-Strichliste auf einen bestimmten Wert
     * @param {Array} marks - Die neuen Freundschaftsstriche
     * @returns {boolean} True bei Erfolg
     */
    setTallyMarks(marks) {
        if (!Array.isArray(marks)) {
            console.error('tallyMarks müssen ein Array sein');
            return false;
        }
        
        this.tallyMarks = [...marks]; // Kopie erstellen
        
        // Event auslösen
        const event = new CustomEvent('tallyMarksChanged', { 
            detail: { tallyMarks: this.tallyMarks } 
        });
        document.dispatchEvent(event);
        
        return true;
    }

    /**
     * Setzt den Wunden-Status
     * @param {number} value - Anzahl der Wunden
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setWounds(value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < 0 || numValue > 10) return false;
        
        this.wounds = numValue;
        return true;
    }

    /**
     * Setzt den ausgewählten Stat für Level-Up
     * @param {string} statName - Name des Statuswerts
     */
    setSelectedStatForLevelUp(statName) {
        this.selectedStatForLevelUp = statName;
        return true;
    }

    /**
     * Führt einen Level-Up durch
     * @returns {Object} Ergebnis des Level-Ups
     */
    levelUp() {
        if (!this.pokemonData) return null;
        
        // Prüfen, ob Level-Grenze erreicht ist
        if (this.level >= DEFAULT_VALUES.MAX_LEVEL) return null;
        
        // Level erhöhen
        this.level += 1;
        
        // Zufallszahlen basierend auf der Würfelklasse generieren
        const diceResults = this.rollDice(this.pokemonData.diceClass, 2);
        
        // Erster Würfelwurf für den ausgewählten Stat
        const selectedStatResult = this.applyDiceResultToStat(this.selectedStatForLevelUp, diceResults[0]);
        
        // Zweiten Würfelwurf für einen zufälligen anderen Stat anwenden
        const otherStats = Object.keys(this.stats).filter(stat => stat !== this.selectedStatForLevelUp);
        const randomOtherStat = otherStats[Math.floor(Math.random() * otherStats.length)];
        const randomStatResult = this.applyDiceResultToStat(randomOtherStat, diceResults[1]);
        
        // KP aktualisieren
        this.currentHp = this.stats.hp;
        
        return {
            newLevel: this.level,
            firstRoll: {
                stat: this.selectedStatForLevelUp,
                roll: diceResults[0],
                result: selectedStatResult
            },
            secondRoll: {
                stat: randomOtherStat,
                roll: diceResults[1],
                result: randomStatResult
            }
        };
    }

    /**
     * Setzt die aktuelle EXP
     * @param {number} value - Neuer EXP-Wert
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setCurrentExp(value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < 0) return false;
        
        this.currentExp = numValue;
        
        // Überprüfe, ob ein Level-Up möglich ist
        this.checkForLevelUp();
        
        return true;
    }

    /**
     * Berechnet die für das nächste Level benötigte EXP
     * @returns {number} Benötigte EXP für das nächste Level
     */
    getRequiredExp() {
        return this.level * this.level;
    }

    /**
     * Überprüft, ob ein Level-Up möglich ist und führt es ggf. durch
     * @returns {boolean} True, wenn ein Level-Up durchgeführt wurde
     */
    checkForLevelUp() {
        const requiredExp = this.getRequiredExp();
        
        if (this.currentExp >= requiredExp) {
            // Level erhöhen
            this.level += 1;
            
            // Überschüssige EXP behalten
            this.currentExp -= requiredExp;
            
            // Statuswerte aktualisieren
            this.recalculateStats();
            
            return true;
        }
        
        return false;
    }

    /**
     * BW-Wert setzen
     * @param {number} value - Neuer Wert
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setBw(value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < 0 || numValue > 99) return false; // Sinnvolle Begrenzung für BW
        
        this.bw = numValue;
        return true;
    }

    /**
     * Berechnet den Basis-Bewegungswert (BW) ohne KÖ-Bonus
     * Formel: ceil(baseSpeed / 4) + floor(BST / 12)
     * @param {number} baseSpeed - Basis-Geschwindigkeitswert des Pokémon
     * @param {number} bst - Base Stat Total des Pokémon
     * @returns {number} Berechneter Basis-BW-Wert
     */
    calculateBaseBw(baseSpeed, bst) {
        // BW = ceil(base Initiative / 4) + floor(BST / 12)
        const speedComponent = Math.ceil(baseSpeed / 4);
        const bstComponent = Math.floor(bst / 12);
        return speedComponent + bstComponent;
    }
    
    /**
     * Berechnet den gesamten Bewegungswert (BW) inklusive KÖ-Bonus
     * @returns {number} Gesamter BW-Wert
     */
    getTotalBw() {
        const koValue = this.skillValues['KÖ'] || 0;
        const koBonus = koValue * 5;
        return this.baseBw + koBonus;
    }
    
    /**
     * Aktualisiert den BW-Wert und das UI
     */
    updateBwDisplay() {
        this.bw = this.getTotalBw();
        const bwInput = document.getElementById('bw-input');
        if (bwInput) {
            bwInput.value = this.bw.toString();
        }
    }
    
    /**
     * Würfelt entsprechend der angegebenen Würfelklasse
     * @param {string} diceClass - Würfelklasse (z.B. "1W6", "2W8")
     * @param {number} count - Anzahl der Würfelwürfe
     * @returns {Array} Array mit den Würfelergebnissen
     */
    rollDice(diceClass, count) {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            // Würfelklasse parsen (z.B. "2W8" -> 2 Würfel mit je 8 Seiten)
            const [numDice, sides] = diceClass.split('W').map(part => parseInt(part, 10));
            
            let roll = 0;
            // Jeder Würfel wird einzeln gewürfelt und addiert
            for (let j = 0; j < numDice; j++) {
                roll += Math.floor(Math.random() * sides) + 1;
            }
            
            results.push(roll);
        }

        return results;
    }
    
    /**
     * Wendet das Würfelergebnis auf einen Statuswert an
     * @param {string} statName - Name des Statuswerts
     * @param {number} diceResult - Würfelergebnis
     * @returns {Object} Alten und neuen Wert
     */
    applyDiceResultToStat(statName, diceResult) {
        const oldValue = this.stats[statName];
        let valueToAdd = diceResult;
        
        // Spezielle Regeln für HP und Initiative
        if (statName === 'hp') {
            valueToAdd = diceResult * 3; // Dreifacher Wert für KP
        } else if (statName === 'speed') {
            valueToAdd = Math.ceil(diceResult / 2); // Halber Wert (aufgerundet) für Initiative
        }
        
        // Neuen Wert berechnen und setzen
        const newValue = oldValue + valueToAdd;
        this.stats[statName] = newValue;
        
        return {
            oldValue,
            newValue,
            difference: valueToAdd
        };
    }
    
    /**
     * Pokemon-Daten setzen und daraus abgeleitete Werte berechnen
     * @param {Object} data - Pokemon-Daten aus der API
     * @param {Object} speciesData - Arten-Daten aus der API
     */
    setPokemonData(data, speciesData) {
        // BST berechnen und Level festlegen (10% vom BST)
        const bst = data.stats.reduce((total, stat) => total + stat.base_stat, 0);
        this.level = Math.max(1, Math.floor(bst * 0.1));
        
        // Basis-Statuswerte speichern
        this.baseStats = {
            hp: data.stats.find(stat => stat.stat.name === 'hp').base_stat,
            attack: data.stats.find(stat => stat.stat.name === 'attack').base_stat,
            defense: data.stats.find(stat => stat.stat.name === 'defense').base_stat,
            spAttack: data.stats.find(stat => stat.stat.name === 'special-attack').base_stat,
            spDefense: data.stats.find(stat => stat.stat.name === 'special-defense').base_stat,
            speed: data.stats.find(stat => stat.stat.name === 'speed').base_stat
        };
        
        this.selectedPokemon = data.name;
        this.pokemonData = {
            ...data,
            speciesData,
            bst,
            diceClass: this.calculateDiceClass(data, speciesData, bst)
        };
        
        // Attacken zurücksetzen
        this.moves = Array(DEFAULT_VALUES.MOVE_SLOTS).fill(null);
        this.availableMoves = [];
        
        // Statuswerte berechnen
        this.recalculateStats();
        
        // GENA und PA berechnen
        this.calculateGenaAndPa(data, speciesData, bst);
    
        // BW berechnen (Basis-BW ohne KÖ-Bonus)
        this.baseBw = this.calculateBaseBw(this.baseStats.speed, bst);
        this.bw = this.getTotalBw();
    }
    
    /**
     * Berechnet die Würfelklasse eines Pokemon
     * @param {Object} data - Pokemon-Daten
     * @param {Object} speciesData - Arten-Daten
     * @param {number} bst - Base Stat Total
     * @returns {string} Würfelklasse
     */
    calculateDiceClass(data, speciesData, bst) {
        // Pokémon-Daten in das Format umwandeln, das DiceCalculator erwartet
        const pokemonData = {
            id: data.id,
            name: data.name,
            baseStatTotal: bst,
            isLegendary: speciesData.is_legendary,
            isMythical: speciesData.is_mythical,
            evolutionLevel: speciesData.evolution_stage || 0,
            remainingEvolutions: speciesData.remaining_evolutions || 0, // Wichtig für unentwickelte Formen
            firstEvolutionLevel: speciesData.first_evolution_level || 0,
            secondEvolutionLevel: speciesData.second_evolution_level || 0,
            speciesData: speciesData // Wir übergeben die kompletten speciesData für weitere Überprüfungen
        };
        
        // DiceCalculator verwenden, um Würfelklasse zu bestimmen
        const diceResult = DiceCalculator.determineDiceType(pokemonData);
        
        return diceResult.diceType;
    }
    

    /**
     * Level setzen und Statuswerte neu berechnen
     * @param {number} newLevel - Neues Level
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setLevel(newLevel) {
        if (newLevel === '' || isNaN(newLevel)) return false;
        
        const level = parseInt(newLevel, 10);
        if (level < DEFAULT_VALUES.MIN_LEVEL || level > DEFAULT_VALUES.MAX_LEVEL) return false;
        
        this.level = level;
        this.recalculateStats();
        return true;
    }
    
    /**
     * Statuswert direkt setzen
     * @param {string} statName - Name des Statuswerts (hp, attack, etc.)
     * @param {number} value - Neuer Wert
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setStat(statName, value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < DEFAULT_VALUES.MIN_STAT || numValue > DEFAULT_VALUES.MAX_STAT) return false;
        
        this.stats[statName] = numValue;
        
        // Bei HP auch die aktuellen HP anpassen, falls sie größer als max HP sind
        if (statName === 'hp' && this.currentHp > numValue) {
            this.currentHp = numValue;
        }
        
        return true;
    }
    
    /**
     * Aktuelle HP setzen
     * @param {number} value - Neuer Wert
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setCurrentHp(value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < 0 || numValue > this.stats.hp) return false;
        
        this.currentHp = numValue;
        return true;
    }
    
    /**
     * GENA-Wert setzen
     * @param {number} value - Neuer Wert
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setGena(value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < DEFAULT_VALUES.MIN_GENA_PA || numValue > DEFAULT_VALUES.MAX_GENA_PA) return false;
        
        this.gena = numValue;
        return true;
    }
    
    /**
     * PA-Wert setzen
     * @param {number} value - Neuer Wert
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setPa(value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < DEFAULT_VALUES.MIN_GENA_PA || numValue > DEFAULT_VALUES.MAX_GENA_PA) return false;
        
        this.pa = numValue;
        return true;
    }
    
    /**
     * Statuswerte basierend auf Level und Basiswerten neu berechnen
     */
    recalculateStats() {
        if (!this.baseStats || !this.level) return;
        
        // KP (HP) berechnen und verdreifachen
        const calculatedHp = calculateHP(this.baseStats.hp, this.level) * 3;
        
        // Initiative (speed) halbieren und aufrunden
        const calculatedSpeed = Math.ceil(calculateStat(this.baseStats.speed, this.level) / 2);
        
        // Statuswerte berechnen
        this.stats = {
            hp: calculatedHp,
            attack: calculateStat(this.baseStats.attack, this.level),
            defense: calculateStat(this.baseStats.defense, this.level),
            spAttack: calculateStat(this.baseStats.spAttack, this.level),
            spDefense: calculateStat(this.baseStats.spDefense, this.level),
            speed: calculatedSpeed
        };
        
        // Aktuelle HP standardmäßig auf maximale HP setzen
        this.currentHp = calculatedHp;
    }
    
    /**
     * GENA und PA berechnen basierend auf Pokemon-Daten
     * @param {Object} data - Pokemon-Daten
     * @param {Object} speciesData - Arten-Daten
     * @param {number} bst - Base Stat Total
     */
    calculateGenaAndPa(data, speciesData, bst) {
        // Standardwerte setzen
        this.gena = DEFAULT_VALUES.GENA_PA_DEFAULT;
        this.pa = DEFAULT_VALUES.GENA_PA_DEFAULT;
        
        // Anzahl der Entwicklungen bestimmen
        let evolutionCount = 0;
        
        // Evolution Chain URL aus species extrahieren
        if (speciesData.evolution_chain && speciesData.evolution_chain.url) {
            // Hier würde normalerweise die Evolution-Chain abgerufen werden
            // Da dies einen weiteren API-Call erfordern würde, vereinfachen wir das:
            // Wir schätzen die Anzahl der Entwicklungen anhand des 'order'-Felds
            if (speciesData.evolves_from_species) {
                evolutionCount += 1;
                
                // Prüfen, ob die Vorform auch eine Vorform hat (2. Entwicklung)
                // Dies ist eine Vereinfachung, die nicht immer korrekt ist
                if (speciesData.order > 3) {
                    evolutionCount += 1;
                }
            }
        }
        
        // GENA: Für jede Entwicklung +1
        this.gena += evolutionCount;
        
        // GENA: Für BST-Werte Boni
        if (bst >= 450) this.gena += 1;
        if (bst >= 500) this.gena += 1;
        if (bst >= 550) this.gena += 1;
        if (bst >= 600) this.gena += 1;
        
        // PA: Basis-Initiative-Wert auswerten
        const baseSpeed = this.baseStats.speed;
        
        // PA-Abzüge für niedrige Initiative
        if (baseSpeed < 60) this.pa -= 1;
        if (baseSpeed < 40) this.pa -= 1;
        if (baseSpeed < 20) this.pa -= 1;
        
        // PA-Boni für hohe Initiative
        if (baseSpeed > 70) this.pa += 1;
        if (baseSpeed > 80) this.pa += 1;
        if (baseSpeed > 90) this.pa += 1;
        if (baseSpeed > 100) this.pa += 1;
        if (baseSpeed > 110) this.pa += 1;
    }
    
    /**
     * Attacke setzen
     * @param {number} index - Index des Attacken-Slots
     * @param {string} moveName - Name der Attacke
     * @returns {boolean} True, wenn der Wert gesetzt wurde
     */
    setMove(index, moveName) {
        if (index < 0 || index >= DEFAULT_VALUES.MOVE_SLOTS) return false;
        
        if (!moveName) {
            this.moves[index] = null;
            return true;
        }
        
        const move = this.availableMoves.find(m => m.name === moveName);
        if (!move) return false;
        
        // Benutzerdefinierte Beschreibung beim Wechsel einer Attacke löschen
        move.customDescription = '';
        
        this.moves[index] = move;
        return true;
    }
    
    /**
     * Verfügbare Attacken setzen
     * @param {Array} moves - Liste der verfügbaren Attacken
     */
    setAvailableMoves(moves) {
        this.availableMoves = moves;
    }
    
    /**
     * Skill-Wert setzen
     * @param {string} skill - Name des Skills
     * @param {number} value - Neuer Wert
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setSkillValue(skill, value) {
        if (value === '' || isNaN(value)) return false;
        
        const numValue = parseInt(value, 10);
        if (numValue < -9 || numValue > 9) return false;
        
        this.skillValues[skill] = numValue;
        
        // When KÖ changes, update the BW value dynamically
        if (skill === 'KÖ') {
            this.updateBwDisplay();
        }
        
        return true;
    }
}

// AppState global verfügbar machen
window.pokemonApp.appState = new AppState();

// Hilfreiche DEBUG-Funktion, die man in der Konsole aufrufen kann
window.checkAppState = function() {
    console.log("AppState Status:", window.pokemonApp && window.pokemonApp.appState ? "Vorhanden" : "Nicht vorhanden");
    if (window.pokemonApp && window.pokemonApp.appState) {
        console.log("AppState Inhalt:", window.pokemonApp.appState);
    }
};

console.log("AppState wurde global initialisiert. window.pokemonApp.appState ist jetzt verfügbar.");

/**
 * Klasse zur Verwaltung eines einzelnen Move-Objekts mit deutscher Übersetzung
 */
class PokemonMove {
    /**
     * Konstruktor
     * @param {Object} moveData - Attackendaten aus der API
     * @param {Object} methodData - Methoden-Daten, wie die Attacke erlernt wird
     * @param {string} germanName - Deutscher Name der Attacke
     * @param {string} germanType - Deutscher Name des Typs
     */
    constructor(moveData, methodData, germanName = null, germanType = null) {
        this.id = moveData.id;
        // Englischer Name (für API-Anfragen)
        this.name = moveData.name;
        // Deutscher Name (für die Anzeige)
        this.germanName = germanName || capitalizeWords(moveData.name.replace('-', ' '));
        // Englischer Typ (für API-Anfragen)
        this.type = moveData.type.name;
        // Deutscher Typ (für die Anzeige)
        this.germanType = germanType || capitalizeFirstLetter(moveData.type.name);
        this.power = moveData.power;
        this.accuracy = moveData.accuracy;
        this.pp = moveData.pp;
        this.moveMethod = methodData.move_learn_method.name;
        this.levelLearned = methodData.level_learned_at;
    }
    
    /**
     * Gibt an, ob der Move zu einer bestimmten Kategorie gehört
     * @param {string} category - Kategorie-Name ('level-up', 'egg', 'machine', 'same-type', 'other')
     * @param {Array} pokemonTypes - Typen des Pokemons
     * @returns {boolean} True, wenn der Move zur Kategorie gehört
     */
    isCategory(category, pokemonTypes = []) {
        switch (category) {
            case 'level-up':
                return this.moveMethod === 'level-up';
            case 'egg':
                return this.moveMethod === 'egg';
            case 'machine':
                return this.moveMethod === 'machine';
            case 'same-type':
                return pokemonTypes.includes(this.type);
            case 'other':
                return true;
            default:
                return false;
        }
    }
    
    /**
     * Gibt den Anzeigenamen des Moves zurück (inkl. Level, falls vorhanden)
     * @returns {string} Anzeigename
     */
    getDisplayName() {
        return `${this.germanName}${this.levelLearned ? ` (Level ${this.levelLearned})` : ''}`;
    }
}