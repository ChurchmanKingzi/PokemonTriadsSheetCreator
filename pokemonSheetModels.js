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
        this.moves = Array(DEFAULT_VALUES.MOVE_SLOTS).fill(null);
        this.availableMoves = [];
        
        // Neue Level-Up Stat-Auswahl: Primär und Sekundär
        this.primaryStatChoice = 'hp';
        this.secondaryStatChoice = 'speed';
        // Behalte für Rückwärtskompatibilität
        this.selectedStatForLevelUp = 'hp';
        
        this.level = 0;
        this.currentExp = 0; 
        this.baseStats = {};
        
        // Skill-Werte initialisieren
        this.skillValues = {};
        
        // Freundschafts-Strichliste initialisieren
        this.tallyMarks = [];
        
        // Benutzerdefinierte Fertigkeiten (pro Kategorie)
        // Format: { KÖ: [{name: 'Fertigkeit', value: 1}], WI: [], CH: [], GL: [] }
        this.customSkills = {
            'KÖ': [],
            'WI': [],
            'CH': [],
            'GL': []
        };

        this.wounds = 0; // Wunden-Status (Anzahl der markierten Wunden)
        
        // Statuseffekte (z.B. ['poisoned', 'burned'])
        this.statusEffects = [];
        
        // Temporäre Stat-Modifikatoren für den Kampf
        // Diese speichern die DIFFERENZ zum permanenten Wert
        this.tempStatModifiers = {
            attack: 0,
            defense: 0,
            spAttack: 0,
            spDefense: 0
        };
        
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
     * Setzt die Statuseffekte
     * @param {Array} effects - Array mit Status-IDs
     * @returns {boolean} True bei Erfolg
     */
    setStatusEffects(effects) {
        if (!Array.isArray(effects)) {
            effects = [];
        }
        this.statusEffects = [...effects];
        return true;
    }
    
    /**
     * Toggled einen einzelnen Statuseffekt
     * @param {string} statusId - ID des Statuseffekts
     * @returns {boolean} True wenn jetzt aktiv, False wenn jetzt inaktiv
     */
    toggleStatusEffect(statusId) {
        if (!this.statusEffects) {
            this.statusEffects = [];
        }
        
        const index = this.statusEffects.indexOf(statusId);
        if (index > -1) {
            this.statusEffects.splice(index, 1);
            return false;
        } else {
            this.statusEffects.push(statusId);
            return true;
        }
    }
    
    /**
     * Prüft ob ein Statuseffekt aktiv ist
     * @param {string} statusId - ID des Statuseffekts
     * @returns {boolean} True wenn aktiv
     */
    hasStatusEffect(statusId) {
        return this.statusEffects && this.statusEffects.includes(statusId);
    }
    
    /**
     * Löscht alle Statuseffekte
     */
    clearStatusEffects() {
        this.statusEffects = [];
    }
    
    // ==================== TEMPORÄRE STAT-MODIFIKATOREN ====================
    
    /**
     * Modifiziert einen temporären Stat-Wert
     * @param {string} statKey - Key des Stats (attack, defense, spAttack, spDefense)
     * @param {number} delta - Die Änderung (positiv oder negativ)
     * @returns {boolean} True bei Erfolg
     */
    modifyTempStat(statKey, delta) {
        if (!['attack', 'defense', 'spAttack', 'spDefense'].includes(statKey)) {
            console.error('Ungültiger Stat-Key für temp modifier:', statKey);
            return false;
        }
        
        if (isNaN(delta)) return false;
        
        // Sicherstellen, dass tempStatModifiers initialisiert ist
        if (!this.tempStatModifiers) {
            this.tempStatModifiers = { attack: 0, defense: 0, spAttack: 0, spDefense: 0 };
        }
        
        this.tempStatModifiers[statKey] += parseInt(delta, 10);
        
        // Event auslösen
        const event = new CustomEvent('tempStatChanged', { 
            detail: { statKey, newModifier: this.tempStatModifiers[statKey] } 
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Setzt einen temporären Stat-Modifikator auf einen bestimmten Wert
     * @param {string} statKey - Key des Stats
     * @param {number} value - Der neue Modifikator-Wert
     * @returns {boolean} True bei Erfolg
     */
    setTempStatModifier(statKey, value) {
        if (!['attack', 'defense', 'spAttack', 'spDefense'].includes(statKey)) {
            return false;
        }
        
        if (!this.tempStatModifiers) {
            this.tempStatModifiers = { attack: 0, defense: 0, spAttack: 0, spDefense: 0 };
        }
        
        this.tempStatModifiers[statKey] = parseInt(value, 10) || 0;
        return true;
    }
    
    /**
     * Setzt einen einzelnen temporären Stat-Modifikator zurück
     * @param {string} statKey - Key des Stats
     * @returns {boolean} True bei Erfolg
     */
    resetTempStat(statKey) {
        if (!['attack', 'defense', 'spAttack', 'spDefense'].includes(statKey)) {
            return false;
        }
        
        if (!this.tempStatModifiers) {
            this.tempStatModifiers = { attack: 0, defense: 0, spAttack: 0, spDefense: 0 };
        }
        
        this.tempStatModifiers[statKey] = 0;
        
        // Event auslösen
        const event = new CustomEvent('tempStatChanged', { 
            detail: { statKey, newModifier: 0 } 
        });
        document.dispatchEvent(event);
        
        return true;
    }
    
    /**
     * Setzt alle temporären Stat-Modifikatoren zurück
     */
    resetAllTempStats() {
        this.tempStatModifiers = {
            attack: 0,
            defense: 0,
            spAttack: 0,
            spDefense: 0
        };
        
        // Event auslösen
        const event = new CustomEvent('allTempStatsReset');
        document.dispatchEvent(event);
    }
    
    /**
     * Gibt den effektiven Stat-Wert zurück (Perma + Temp)
     * @param {string} statKey - Key des Stats
     * @returns {number} Der effektive Wert
     */
    getEffectiveStat(statKey) {
        const baseValue = this.stats[statKey] || 0;
        const tempModifier = (this.tempStatModifiers && this.tempStatModifiers[statKey]) || 0;
        return baseValue + tempModifier;
    }
    
    /**
     * Gibt den temporären Modifikator für einen Stat zurück
     * @param {string} statKey - Key des Stats
     * @returns {number} Der Modifikator (kann negativ sein)
     */
    getTempStatModifier(statKey) {
        if (!this.tempStatModifiers) return 0;
        return this.tempStatModifiers[statKey] || 0;
    }
    
    /**
     * Heilt das Pokemon vollständig (setzt currentHp auf max)
     */
    fullHeal() {
        if (this.stats && this.stats.hp) {
            this.currentHp = this.stats.hp;
            
            // Event auslösen
            const event = new CustomEvent('pokemonHealed', { 
                detail: { currentHp: this.currentHp, maxHp: this.stats.hp } 
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Setzt den ausgewählten Stat für Level-Up (Rückwärtskompatibilität)
     * @param {string} statName - Name des Statuswerts
     * @deprecated Use setPrimaryStatChoice and setSecondaryStatChoice instead
     */
    setSelectedStatForLevelUp(statName) {
        this.selectedStatForLevelUp = statName;
        this.primaryStatChoice = statName;
        // Nur korrigieren wenn beide jetzt identisch sind
        if (this.primaryStatChoice === this.secondaryStatChoice) {
            this._shiftSecondaryChoice();
        }
        return true;
    }
    
    /**
     * Setzt die primäre Stat-Wahl für Level-Up
     * @param {string} statName - Name des Statuswerts
     */
    setPrimaryStatChoice(statName) {
        this.primaryStatChoice = statName;
        this.selectedStatForLevelUp = statName; // Rückwärtskompatibilität
        // Nur korrigieren wenn beide jetzt identisch sind
        if (this.primaryStatChoice === this.secondaryStatChoice) {
            this._shiftSecondaryChoice();
        }
        return true;
    }
    
    /**
     * Setzt die sekundäre Stat-Wahl für Level-Up
     * @param {string} statName - Name des Statuswerts
     */
    setSecondaryStatChoice(statName) {
        this.secondaryStatChoice = statName;
        // Nur korrigieren wenn beide jetzt identisch sind
        if (this.primaryStatChoice === this.secondaryStatChoice) {
            this._shiftSecondaryChoice();
        }
        return true;
    }
    
    /**
     * Verschiebt die sekundäre Wahl um einen Wert nach unten
     * Wird nur aufgerufen wenn primäre und sekundäre Wahl identisch sind
     * Reihenfolge: KP -> Initiative -> Angriff -> Verteidigung -> Sp. Angriff -> Sp. Verteidigung -> KP
     * @private
     */
    _shiftSecondaryChoice() {
        const statOrder = ['hp', 'speed', 'attack', 'defense', 'spAttack', 'spDefense'];
        const currentIndex = statOrder.indexOf(this.secondaryStatChoice);
        const nextIndex = (currentIndex + 1) % statOrder.length;
        this.secondaryStatChoice = statOrder[nextIndex];
    }

    /**
     * Führt einen Level-Up durch
     * Neue Logik: Zufälliger Stat wird gewürfelt, dann wird entweder
     * die primäre oder sekundäre Spielerwahl erhöht
     * @returns {Object} Ergebnis des Level-Ups
     */
    levelUp() {
        if (!this.pokemonData) return null;
        
        // Prüfen, ob Level-Grenze erreicht ist
        if (this.level >= DEFAULT_VALUES.MAX_LEVEL) return null;
        
        // Prüfen, ob genug EXP vorhanden sind
        const requiredExp = this.getRequiredExp();
        if (this.currentExp < requiredExp) return null;
        
        // EXP abziehen
        this.currentExp -= requiredExp;
        
        // Level erhöhen
        this.level += 1;
        
        // Zufallszahlen basierend auf der Würfelklasse generieren
        const diceResults = this.rollDice(this.pokemonData.diceClass, 2);
        
        // NEUE LOGIK:
        // 1. Zufälliger Stat wird gewürfelt
        const allStats = Object.keys(this.stats); // ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed']
        const randomStat = allStats[Math.floor(Math.random() * allStats.length)];
        
        // 2. Erster Würfelwurf für den zufälligen Stat
        const randomStatResult = this.applyDiceResultToStat(randomStat, diceResults[0]);
        
        // 3. Zweiter Stat basierend auf Spielerwahl:
        //    - Wenn zufälliger Stat ≠ primäre Wahl → primäre Wahl wird erhöht
        //    - Wenn zufälliger Stat = primäre Wahl → sekundäre Wahl wird erhöht
        const playerChoiceStat = (randomStat !== this.primaryStatChoice) 
            ? this.primaryStatChoice 
            : this.secondaryStatChoice;
        
        const playerChoiceResult = this.applyDiceResultToStat(playerChoiceStat, diceResults[1]);
        
        // KP aktualisieren
        this.currentHp = this.stats.hp;
        
        return {
            newLevel: this.level,
            newCurrentExp: this.currentExp,
            newRequiredExp: this.getRequiredExp(),
            canLevelUpAgain: this.canLevelUp(),
            firstRoll: {
                stat: randomStat,
                roll: diceResults[0],
                result: randomStatResult,
                isRandom: true
            },
            secondRoll: {
                stat: playerChoiceStat,
                roll: diceResults[1],
                result: playerChoiceResult,
                isPlayerChoice: true,
                usedPrimary: (randomStat !== this.primaryStatChoice)
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
        
        // NICHT mehr automatisch Level-Up durchführen
        // Stattdessen wird nur geprüft, ob Level-Up möglich ist (für Button-Highlighting)
        
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
     * Prüft, ob ein Level-Up möglich ist (EXP >= benötigte EXP)
     * @returns {boolean} True, wenn Level-Up möglich ist
     */
    canLevelUp() {
        if (this.level >= DEFAULT_VALUES.MAX_LEVEL) return false;
        return this.currentExp >= this.getRequiredExp();
    }

    /**
     * Diese Funktion wurde entfernt - Level-Up wird jetzt manuell über Button ausgelöst
     * @deprecated Use canLevelUp() to check and levelUp() to perform
     */
    checkForLevelUp() {
        // Nicht mehr automatisch Level-Up durchführen
        // Nur noch prüfen ob möglich ist
        return this.canLevelUp();
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
     * Berechnet den Bewegungswert (BW) basierend auf Basis-Initiative, BST und KÖ-Wert
     * Formel: ceil(Basis-Initiative / 5) + ceil(BST / 15) + (5 * KÖ-Wert)
     * @returns {number} Berechneter BW-Wert
     */
    calculateBw() {
        // Basis-Initiative aus den baseStats
        const baseSpeed = this.baseStats.speed || 0;
        
        // BST aus pokemonData
        const bst = this.pokemonData ? this.pokemonData.bst : 0;
        
        // KÖ-Wert aus den Fertigkeiten
        const koValue = this.skillValues['KÖ'] || 0;
        
        // Formel anwenden
        const speedComponent = Math.ceil(baseSpeed / 5);
        const bstComponent = Math.ceil(bst / 15);
        const koComponent = 5 * koValue;
        
        return speedComponent + bstComponent + koComponent;
    }
    
    /**
     * Generiert den Tooltip-Text für den BW-Wert
     * @returns {string} Tooltip-Text mit der Formel
     */
    getBwTooltip() {
        const baseSpeed = this.baseStats.speed || 0;
        const bst = this.pokemonData ? this.pokemonData.bst : 0;
        const koValue = this.skillValues['KÖ'] || 0;
        
        const speedComponent = Math.ceil(baseSpeed / 5);
        const bstComponent = Math.ceil(bst / 15);
        const koComponent = 5 * koValue;
        
        return `${speedComponent} (${baseSpeed} Init /5) + ${bstComponent} (${bst} BST /15) + ${koComponent} (5 × ${koValue} KÖ)`;
    }
    
    /**
     * Berechnet BW neu und aktualisiert den Wert
     * Wird aufgerufen wenn sich der KÖ-Wert ändert
     */
    recalculateBw() {
        this.bw = this.calculateBw();
        return this.bw;
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
        
        // Spezielle Regeln für HP
        if (statName === 'hp') {
            valueToAdd = diceResult * 3; // Dreifacher Wert für KP
        }
        // Initiative (speed) wird NICHT mehr halbiert - gleiche Behandlung wie andere Stats
        
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
     * @param {boolean} skipLevelCalculation - Wenn true, Level nicht aus BST berechnen (für gespeicherte Charakterbögen)
     */
    setPokemonData(data, speciesData, skipLevelCalculation = false) {
        // BST berechnen
        const bst = data.stats.reduce((total, stat) => total + stat.base_stat, 0);
        
        // Level nur festlegen wenn skipLevelCalculation false ist
        if (!skipLevelCalculation) {
            this.level = Math.max(1, Math.floor(bst * 0.1));
        }
        
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
        
        // Würfelklasse mit vollständigem Ergebnis (inkl. Tooltip) berechnen
        const diceResult = this.calculateDiceClass(data, speciesData, bst, true);
        
        this.pokemonData = {
            ...data,
            speciesData,
            bst,
            diceClass: diceResult.diceType,
            diceClassTooltip: diceResult.tooltipText
        };
        
        // Attacken zurücksetzen
        this.moves = Array(DEFAULT_VALUES.MOVE_SLOTS).fill(null);
        this.availableMoves = [];
        
        // Statuswerte nur berechnen wenn skipLevelCalculation false ist
        if (!skipLevelCalculation) {
            this.recalculateStats();
            
            // GENA und PA berechnen
            this.calculateGenaAndPa(data, speciesData, bst);
        
            // BW berechnen (verwendet jetzt baseStats.speed, bst und KÖ-Wert intern)
            this.bw = this.calculateBw();
        }
    }
    
    /**
     * Berechnet die Würfelklasse eines Pokemon
     * @param {Object} data - Pokemon-Daten
     * @param {Object} speciesData - Arten-Daten
     * @param {number} bst - Base Stat Total
     * @param {boolean} returnFullResult - Wenn true, wird das vollständige Ergebnis mit Tooltip zurückgegeben
     * @returns {string|Object} Würfelklasse als String oder vollständiges Ergebnis-Objekt
     */
    calculateDiceClass(data, speciesData, bst, returnFullResult = false) {
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
        
        // Vollständiges Ergebnis oder nur diceType zurückgeben
        return returnFullResult ? diceResult : diceResult.diceType;
    }
    

    /**
     * Level setzen und Statuswerte neu berechnen
     * @param {number} newLevel - Neues Level
     * @param {boolean} skipRecalculation - Wenn true, Stats nicht neu berechnen (für gespeicherte Charakterbögen)
     * @returns {boolean} True, wenn der Wert gültig war und gesetzt wurde
     */
    setLevel(newLevel, skipRecalculation = false) {
        if (newLevel === '' || isNaN(newLevel)) return false;
        
        const level = parseInt(newLevel, 10);
        if (level < DEFAULT_VALUES.MIN_LEVEL || level > DEFAULT_VALUES.MAX_LEVEL) return false;
        
        this.level = level;
        
        // Stats nur neu berechnen wenn nicht übersprungen werden soll
        if (!skipRecalculation) {
            this.recalculateStats();
        }
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
        
        // Initiative (speed) wird NICHT mehr halbiert - gleiche Berechnung wie andere Stats
        const calculatedSpeed = calculateStat(this.baseStats.speed, this.level);
        
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
        return true;
    }
    
    /**
     * Fügt eine benutzerdefinierte Fertigkeit zu einer Kategorie hinzu
     * @param {string} category - Kategorie (KÖ, WI, CH, GL)
     * @param {string} name - Name der Fertigkeit
     * @returns {boolean} True bei Erfolg
     */
    addCustomSkill(category, name = '') {
        if (!this.customSkills) {
            this.customSkills = { 'KÖ': [], 'WI': [], 'CH': [], 'GL': [] };
        }
        
        if (!this.customSkills[category]) {
            this.customSkills[category] = [];
        }
        
        this.customSkills[category].push({
            name: name,
            value: 1
        });
        
        return true;
    }
    
    /**
     * Entfernt eine benutzerdefinierte Fertigkeit
     * @param {string} category - Kategorie (KÖ, WI, CH, GL)
     * @param {number} index - Index der Fertigkeit
     * @returns {boolean} True bei Erfolg
     */
    removeCustomSkill(category, index) {
        if (!this.customSkills || !this.customSkills[category]) return false;
        
        if (index >= 0 && index < this.customSkills[category].length) {
            this.customSkills[category].splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Aktualisiert eine benutzerdefinierte Fertigkeit
     * @param {string} category - Kategorie (KÖ, WI, CH, GL)
     * @param {number} index - Index der Fertigkeit
     * @param {Object} updates - Objekt mit Updates ({name, value})
     * @returns {boolean} True bei Erfolg
     */
    updateCustomSkill(category, index, updates) {
        if (!this.customSkills || !this.customSkills[category]) return false;
        
        if (index >= 0 && index < this.customSkills[category].length) {
            const skill = this.customSkills[category][index];
            
            if (updates.name !== undefined) {
                skill.name = updates.name;
            }
            if (updates.value !== undefined) {
                const numValue = parseInt(updates.value, 10);
                if (!isNaN(numValue) && numValue >= -9 && numValue <= 9) {
                    skill.value = numValue;
                }
            }
            return true;
        }
        return false;
    }
    
    /**
     * Gibt alle benutzerdefinierten Fertigkeiten einer Kategorie zurück
     * @param {string} category - Kategorie (KÖ, WI, CH, GL)
     * @returns {Array} Liste der benutzerdefinierten Fertigkeiten
     */
    getCustomSkills(category) {
        if (!this.customSkills) {
            this.customSkills = { 'KÖ': [], 'WI': [], 'CH': [], 'GL': [] };
        }
        return this.customSkills[category] || [];
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
     * Gibt den Anzeigenamen des Moves zurück (inkl. Lernmethode in Klammern)
     * @returns {string} Anzeigename
     */
    getDisplayName() {
        // Wenn learnMethodDisplay vorhanden ist, dieses verwenden
        if (this.learnMethodDisplay) {
            return `${this.germanName} (${this.learnMethodDisplay})`;
        }
        // Fallback für alte Move-Objekte
        return `${this.germanName}${this.levelLearned ? ` (Lv ${this.levelLearned})` : ''}`;
    }
}