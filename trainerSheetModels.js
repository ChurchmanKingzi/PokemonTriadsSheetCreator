/**
 * Datenmodelle für den Trainer-Sheet
 * MULTI-TRAINER VERSION
 * Verwaltet mehrere Trainer-Daten mit isolierten Pokemon-Slots
 */

/**
 * TrainerManager - Verwaltet mehrere Trainer
 */
class TrainerManager {
    constructor() {
        this.trainers = [];           // Array aller TrainerState-Objekte
        this.activeTrainerIndex = 0;  // Index des aktiven Trainers
        
        // Event-Callbacks für UI-Updates
        this.onTrainerSwitch = null;
        this.onTrainerListChange = null;
        
        // Laden der gespeicherten Daten
        this._loadFromLocalStorage();
        
        // Falls keine Trainer existieren, einen leeren erstellen
        if (this.trainers.length === 0) {
            this.addTrainer();
        }
    }
    
    /**
     * Gibt den aktuell aktiven Trainer zurück
     * @returns {TrainerState} Der aktive Trainer
     */
    getActiveTrainer() {
        return this.trainers[this.activeTrainerIndex] || this.trainers[0];
    }
    
    /**
     * Gibt alle Trainer zurück
     * @returns {Array<TrainerState>} Alle Trainer
     */
    getAllTrainers() {
        return this.trainers;
    }
    
    /**
     * Gibt die Anzahl der Trainer zurück
     * @returns {number} Anzahl der Trainer
     */
    getTrainerCount() {
        return this.trainers.length;
    }
    
    /**
     * Wechselt zum Trainer mit dem angegebenen Index
     * @param {number} index - Index des Trainers
     */
    switchToTrainer(index) {
        if (index >= 0 && index < this.trainers.length) {
            this.activeTrainerIndex = index;
            this._saveToLocalStorage();
            
            if (this.onTrainerSwitch) {
                this.onTrainerSwitch(this.getActiveTrainer(), index);
            }
        }
    }
    
    /**
     * Fügt einen neuen Trainer hinzu
     * @param {string} name - Optionaler Name für den Trainer
     * @returns {number} Index des neuen Trainers
     */
    addTrainer(name = '') {
        const newTrainer = new TrainerState(this, this.trainers.length);
        if (name) {
            newTrainer.name = name;
        }
        this.trainers.push(newTrainer);
        this._saveToLocalStorage();
        
        if (this.onTrainerListChange) {
            this.onTrainerListChange(this.trainers);
        }
        
        return this.trainers.length - 1;
    }
    
    /**
     * Entfernt einen Trainer
     * @param {number} index - Index des zu entfernenden Trainers
     * @returns {boolean} Erfolg
     */
    removeTrainer(index) {
        // Mindestens ein Trainer muss bleiben
        if (this.trainers.length <= 1) {
            return false;
        }
        
        if (index >= 0 && index < this.trainers.length) {
            const removedTrainer = this.trainers[index];
            
            // Pokemon-Daten dieses Trainers aus Storage entfernen
            removedTrainer.pokemonSlots.forEach((slot, slotIndex) => {
                if (slot.pokemonId) {
                    this._removePokemonFromStorage(removedTrainer.id, slotIndex);
                }
            });
            
            this.trainers.splice(index, 1);
            
            // Trainer-IDs und Indizes aktualisieren
            this.trainers.forEach((trainer, i) => {
                trainer.index = i;
            });
            
            // Aktiven Index anpassen falls nötig
            if (this.activeTrainerIndex >= this.trainers.length) {
                this.activeTrainerIndex = this.trainers.length - 1;
            } else if (this.activeTrainerIndex > index) {
                this.activeTrainerIndex--;
            }
            
            this._saveToLocalStorage();
            
            if (this.onTrainerListChange) {
                this.onTrainerListChange(this.trainers);
            }
            if (this.onTrainerSwitch) {
                this.onTrainerSwitch(this.getActiveTrainer(), this.activeTrainerIndex);
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Dupliziert einen Trainer
     * @param {number} index - Index des zu duplizierenden Trainers
     * @returns {number} Index des neuen Trainers
     */
    duplicateTrainer(index) {
        if (index >= 0 && index < this.trainers.length) {
            const originalTrainer = this.trainers[index];
            const newIndex = this.addTrainer();
            const newTrainer = this.trainers[newIndex];
            
            // Daten kopieren (außer ID und Index)
            const exportData = originalTrainer._exportToJSON();
            newTrainer._importFromJSON(exportData);
            newTrainer.name = (originalTrainer.name || 'Trainer') + ' (Kopie)';
            
            // Pokemon-Daten kopieren
            originalTrainer.pokemonSlots.forEach((slot, slotIndex) => {
                if (slot.pokemonId) {
                    const pokemonData = this._loadPokemonFromStorage(originalTrainer.id, slotIndex);
                    if (pokemonData) {
                        this._savePokemonToStorage(newTrainer.id, slotIndex, pokemonData);
                    }
                }
            });
            
            this._saveToLocalStorage();
            return newIndex;
        }
        return -1;
    }
    
    /**
     * Speichert Pokemon-Daten für einen bestimmten Trainer und Slot
     * Verwendet den globalen PokemonStorageService
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots
     * @param {Object} pokemonData - Die Pokemon-Daten
     */
    _savePokemonToStorage(trainerId, slotIndex, pokemonData) {
        if (window.pokemonStorageService) {
            window.pokemonStorageService.save(trainerId, slotIndex, pokemonData);
        } else {
            // Fallback für den Fall, dass der StorageService noch nicht geladen ist
            try {
                const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                const key = `${trainerId}_slot${slotIndex}`;
                sheets[key] = pokemonData;
                localStorage.setItem('pokemon_character_sheets', JSON.stringify(sheets));
            } catch (error) {
                console.error('Fehler beim Speichern der Pokemon-Daten:', error);
            }
        }
    }
    
    /**
     * Lädt Pokemon-Daten für einen bestimmten Trainer und Slot
     * Verwendet den globalen PokemonStorageService
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots
     * @returns {Object|null} Die Pokemon-Daten oder null
     */
    _loadPokemonFromStorage(trainerId, slotIndex) {
        if (window.pokemonStorageService) {
            return window.pokemonStorageService.load(trainerId, slotIndex);
        } else {
            // Fallback
            try {
                const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                const key = `${trainerId}_slot${slotIndex}`;
                return sheets[key] || null;
            } catch (error) {
                console.error('Fehler beim Laden der Pokemon-Daten:', error);
                return null;
            }
        }
    }
    
    /**
     * Entfernt Pokemon-Daten für einen bestimmten Trainer und Slot
     * Verwendet den globalen PokemonStorageService
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots
     */
    _removePokemonFromStorage(trainerId, slotIndex) {
        if (window.pokemonStorageService) {
            window.pokemonStorageService.delete(trainerId, slotIndex);
        } else {
            // Fallback
            try {
                const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                const key = `${trainerId}_slot${slotIndex}`;
                if (sheets[key]) {
                    delete sheets[key];
                    localStorage.setItem('pokemon_character_sheets', JSON.stringify(sheets));
                }
            } catch (error) {
                console.error('Fehler beim Entfernen der Pokemon-Daten:', error);
            }
        }
    }
    
    /**
     * Speichert alle Trainer-Daten in localStorage
     * @private
     */
    _saveToLocalStorage() {
        const data = {
            activeTrainerIndex: this.activeTrainerIndex,
            trainers: this.trainers.map(trainer => trainer._exportToJSON()),
            version: '3.0',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('pokemon_trainers_data', JSON.stringify(data));
    }
    
    /**
     * Lädt alle Trainer-Daten aus localStorage
     * @private
     */
    _loadFromLocalStorage() {
        try {
            // Zuerst versuchen, das neue Format zu laden
            const newData = localStorage.getItem('pokemon_trainers_data');
            if (newData) {
                const parsed = JSON.parse(newData);
                
                if (parsed.trainers && Array.isArray(parsed.trainers)) {
                    this.trainers = parsed.trainers.map((trainerData, index) => {
                        const trainer = new TrainerState(this, index);
                        trainer._importFromJSON(trainerData);
                        return trainer;
                    });
                    this.activeTrainerIndex = parsed.activeTrainerIndex || 0;
                    
                    // Validieren
                    if (this.activeTrainerIndex >= this.trainers.length) {
                        this.activeTrainerIndex = 0;
                    }
                    
                    console.log(`${this.trainers.length} Trainer aus neuem Format geladen.`);
                    return true;
                }
            }
            
            // Migration: Altes Format (einzelner Trainer) laden
            const oldData = localStorage.getItem('pokemon_trainer_data');
            if (oldData) {
                console.log('Migriere alten Trainer-Datensatz...');
                const parsed = JSON.parse(oldData);
                
                const trainer = new TrainerState(this, 0);
                trainer._importFromJSON(parsed);
                this.trainers = [trainer];
                this.activeTrainerIndex = 0;
                
                // Migration der Pokemon-Daten
                this._migratePokemonData(trainer);
                
                // Im neuen Format speichern
                this._saveToLocalStorage();
                
                console.log('Migration abgeschlossen.');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Fehler beim Laden der Trainer-Daten:', error);
            return false;
        }
    }
    
    /**
     * Migriert Pokemon-Daten vom alten Format (pokemonId als Key) zum neuen Format (trainerId_slotX als Key)
     * @param {TrainerState} trainer - Der Trainer dessen Pokemon migriert werden
     * @private
     */
    _migratePokemonData(trainer) {
        try {
            const oldSheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
            const newSheets = {};
            let migratedCount = 0;
            
            // Für jeden Pokemon-Slot des Trainers
            trainer.pokemonSlots.forEach((slot, slotIndex) => {
                if (slot.pokemonId) {
                    // Alte Daten mit Pokemon-ID als Key suchen
                    const oldKey = slot.pokemonId.toString();
                    const pokemonData = oldSheets[oldKey];
                    
                    if (pokemonData) {
                        // Neuen Key erstellen: trainerId_slotIndex
                        const newKey = `${trainer.id}_slot${slotIndex}`;
                        newSheets[newKey] = pokemonData;
                        migratedCount++;
                        console.log(`Pokemon ${slot.germanName || slot.pokemonName} migriert: ${oldKey} -> ${newKey}`);
                    }
                }
            });
            
            // Neue Daten speichern (alte bleiben erhalten für Rückwärtskompatibilität)
            if (migratedCount > 0) {
                // Alte und neue Daten zusammenführen
                const mergedSheets = { ...oldSheets, ...newSheets };
                localStorage.setItem('pokemon_character_sheets', JSON.stringify(mergedSheets));
                console.log(`${migratedCount} Pokemon-Datensätze migriert.`);
            }
        } catch (error) {
            console.error('Fehler bei der Pokemon-Daten-Migration:', error);
        }
    }
    
    /**
     * Exportiert alle Daten als JSON
     * @returns {Object} Alle Trainer- und Pokemon-Daten
     */
    exportAll() {
        const pokemonSheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
        
        return {
            trainers: this.trainers.map(trainer => trainer._exportToJSON()),
            activeTrainerIndex: this.activeTrainerIndex,
            pokemonSheets: pokemonSheets,
            exportDate: new Date().toISOString(),
            version: '3.0'
        };
    }
    
    /**
     * Importiert alle Daten aus JSON
     * @param {Object} data - Die zu importierenden Daten
     */
    importAll(data) {
        if (!data) {
            throw new Error('Ungültiges Import-Format');
        }
        
        // Neues Multi-Trainer-Format
        if (data.trainers && Array.isArray(data.trainers)) {
            this.trainers = data.trainers.map((trainerData, index) => {
                const trainer = new TrainerState(this, index);
                trainer._importFromJSON(trainerData);
                return trainer;
            });
            this.activeTrainerIndex = data.activeTrainerIndex || 0;
            
            // Pokemon-Sheets importieren
            if (data.pokemonSheets) {
                localStorage.setItem('pokemon_character_sheets', JSON.stringify(data.pokemonSheets));
            }
        }
        // Altes Single-Trainer-Format
        else if (data.trainer) {
            // Bestehende Trainer behalten und neuen hinzufügen
            const newIndex = this.addTrainer();
            const newTrainer = this.trainers[newIndex];
            newTrainer._importFromJSON(data.trainer);
            
            // Pokemon-Sheets importieren und migrieren
            if (data.pokemonSheets) {
                const existingSheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                
                // Für jeden Pokemon-Slot
                newTrainer.pokemonSlots.forEach((slot, slotIndex) => {
                    if (slot.pokemonId) {
                        const oldKey = slot.pokemonId.toString();
                        if (data.pokemonSheets[oldKey]) {
                            const newKey = `${newTrainer.id}_slot${slotIndex}`;
                            existingSheets[newKey] = data.pokemonSheets[oldKey];
                        }
                    }
                });
                
                localStorage.setItem('pokemon_character_sheets', JSON.stringify(existingSheets));
            }
            
            this.switchToTrainer(newIndex);
        }
        
        this._saveToLocalStorage();
        
        if (this.onTrainerListChange) {
            this.onTrainerListChange(this.trainers);
        }
    }
    
    /**
     * Benachrichtigt den Manager über Änderungen (für Auto-Save)
     */
    notifyChange() {
        this._saveToLocalStorage();
    }
}


/**
 * State-Management für einen einzelnen Trainer
 */
class TrainerState {
    constructor(manager, index = 0) {
        this.manager = manager;  // Referenz zum TrainerManager
        this.index = index;      // Index im Trainer-Array
        
        // Eindeutige ID für diesen Trainer
        this.id = this._generateId();
        
        // Grunddaten des Trainers
        this.name = '';
        this.age = '';
        this.playedBy = '';
        
        // Klasse, Vorteil, Nachteil
        this.klasse = '';
        this.secondKlasse = '';
        this.vorteil = '';
        this.nachteil = '';
        
        // Charakterbild (Base64)
        this.characterImage = '';
        
        // Level des Trainers (startet bei 10)
        this.level = 10;
        
        // Trainer-Statistiken (werden dynamisch berechnet)
        this.stats = {
            hp: 29,        // 20 + (1+1+1)*3 = 29
            initiative: 3  // 1 + 1 + 1 = 3
        };
        
        // Aktuelle HP
        this.currentHp = 29;
        
        // GENA und PA für Trainer (werden dynamisch berechnet)
        this.gena = 2;  // Math.ceil((1+1+1)/2) = 2
        this.pa = 2;    // Math.ceil((1+1+1)/2) = 2
        
        // Bewegungsweite (wird dynamisch berechnet)
        this.bw = 30;   // 25 + 1*5 = 30
        
        // Wunden (0-10)
        this.wounds = 0;
        
        // Glücks-Tokens (aktuelle und maximale, standardmäßig gleich GL)
        this.luckTokens = 1;       // Aktuelle Glücks-Tokens
        this.maxLuckTokens = 1;    // Maximale Glücks-Tokens (= GL)
        
        // Geld des Trainers (in Poké-Dollar)
        this.money = 0;
        
        // Manuelle Überschreibungen
        this.manualOverrides = {
            hp: false,
            initiative: false,
            gena: false,
            pa: false,
            bw: false,
            luckTokens: false
        };
        
        // Fertigkeitswerte (gleiche Struktur wie Pokemon)
        this.skillValues = {};
        
        // Haupt-Kategorien (Grundwerte) initialisieren mit 1
        Object.keys(SKILL_GROUPS).forEach(category => {
            this.skillValues[category] = 1;
        });
        
        // Einzelne Skills initialisieren mit 0
        Object.values(SKILL_GROUPS).flat().forEach(skill => {
            this.skillValues[skill] = 0;
        });
        
        // Pokemon-Slots (standardmäßig 6)
        this.pokemonSlots = [];
        for (let i = 0; i < 6; i++) {
            this.pokemonSlots.push(new PokemonSlot(i));
        }
        
        // Aktiver Pokemon-Index (für Navigation)
        this.activePokemonIndex = null;
        
        // Inventar (standardmäßig 1 leerer Slot)
        this.inventory = [];
        for (let i = 0; i < 1; i++) {
            this.inventory.push(new InventoryItem());
        }
        
        // Trainer-Attacken (mit Standard-Attacken)
        this.attacks = [
            {
                name: 'Tackle',
                type: 'Normal',
                damage: '5W6',
                effect: 'Kontakt, Nah. Trifft ein Ziel mit Körpereinsatz.'
            },
            {
                name: 'Risikotackle',
                type: 'Normal',
                damage: '12W6',
                effect: 'Kontakt, Nah. Rammt ein Ziel rücksichtslos. 50% Rückstoßschaden!'
            },
            {
                name: 'Kulleraugen',
                type: 'Fee',
                damage: '0W6',
                effect: 'Das Ziel muss den Anwender sehen können. Es muss eine Probe auf WI + Widerstand gegen eine Schauspiel-Probe des Anwenders würfeln. Schafft es diese nicht, verliert es ANG gleich seinem Level.'
            }
        ];
        
        // Perks (Liste der ausgewählten Perk-IDs, mit optionaler Typ-Auswahl)
        this.perks = [{ id: '', chosenType: '' }];
        
        // Kommandos (Liste der ausgewählten Kommando-IDs, mit optionaler Stat-Auswahl)
        this.kommandos = [{ id: '', chosenStat: '' }];
        
        // Schulnoten (Standardwert 5 für alle Fächer)
        this.grades = {
            'kaempfen': 5,
            'attackenTheorie': 5,
            'komplexeStrategien': 5,
            'trainingsmethoden': 5,
            'pokemonPflege': 5,
            'pokemonBiologie': 5,
            'mathematik': 5,
            'naturwissenschaften': 5,
            'botanik': 5,
            'survival': 5,
            'gesellschaft': 5,
            'geographie': 5,
            'kunstMusik': 5,
            'koerperlicheErtuecht': 5
        };
        
        // Lieblingstyp (für +5 Bonus auf Typ-Meisterschaft)
        this.favoriteType = null;
        
        // Typ-Meisterschaft (Standardwert 5 für alle Typen)
        this.typeMastery = {
            'normal': 5,
            'feuer': 5,
            'wasser': 5,
            'pflanze': 5,
            'elektro': 5,
            'eis': 5,
            'kampf': 5,
            'kaefer': 5,
            'gift': 5,
            'flug': 5,
            'boden': 5,
            'gestein': 5,
            'drache': 5,
            'psycho': 5,
            'geist': 5,
            'unlicht': 5,
            'stahl': 5,
            'fee': 5
        };
    }
    
    /**
     * Generiert eine eindeutige ID für den Trainer
     * @private
     */
    _generateId() {
        return 'trainer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Benachrichtigt den Manager über Änderungen
     * @private
     */
    _notifyChange() {
        if (this.manager) {
            this.manager.notifyChange();
        }
    }
    
    /**
     * Alias für Rückwärtskompatibilität
     * @private
     */
    _saveToLocalStorage() {
        this._notifyChange();
    }
    
    // ==================== Getter & Setter ====================
    
    /**
     * Setzt den Trainer-Namen
     * @param {string} name - Der neue Name
     */
    setName(name) {
        this.name = name;
        this._notifyChange();
    }
    
    /**
     * Setzt das Alter des Trainers
     * @param {string} age - Das neue Alter
     */
    setAge(age) {
        this.age = age;
        this._notifyChange();
    }
    
    /**
     * Setzt "Gespielt von"
     * @param {string} playedBy - Der Spielername
     */
    setPlayedBy(playedBy) {
        this.playedBy = playedBy;
        this._notifyChange();
    }
    
    /**
     * Setzt die Klasse
     * @param {string} klasse - Die Klassen-ID
     */
    setKlasse(klasse) {
        this.klasse = klasse;
        this._notifyChange();
    }
    
    /**
     * Setzt die zweite Klasse
     * @param {string} secondKlasse - Die zweite Klassen-ID
     */
    setSecondKlasse(secondKlasse) {
        this.secondKlasse = secondKlasse;
        this._notifyChange();
    }
    
    /**
     * Setzt den Vorteil
     * @param {string} vorteil - Die Vorteil-ID
     */
    setVorteil(vorteil) {
        this.vorteil = vorteil;
        this._notifyChange();
    }
    
    /**
     * Setzt den Nachteil
     * @param {string} nachteil - Die Nachteil-ID
     */
    setNachteil(nachteil) {
        this.nachteil = nachteil;
        this._notifyChange();
    }
    
    /**
     * Setzt das Charakterbild
     * @param {string} imageData - Base64-kodiertes Bild
     */
    setCharacterImage(imageData) {
        this.characterImage = imageData;
        this._notifyChange();
    }
    
    /**
     * Setzt das Level des Trainers
     * @param {number} level - Das neue Level
     */
    setLevel(level) {
        this.level = Math.min(100, parseInt(level, 10) || 10);
        this._notifyChange();
    }
    
    /**
     * Setzt einen Stat-Wert
     * @param {string} statName - Name des Stats
     * @param {number} value - Neuer Wert
     */
    setStat(statName, value) {
        if (this.stats.hasOwnProperty(statName)) {
            this.stats[statName] = parseInt(value, 10) || 0;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Setzt die aktuellen HP
     * @param {number} value - Neuer HP-Wert
     */
    setCurrentHp(value) {
        this.currentHp = parseInt(value, 10) || 0;
        this._notifyChange();
    }
    
    /**
     * Setzt GENA
     * @param {number} value - Neuer GENA-Wert
     */
    setGena(value) {
        this.gena = parseInt(value, 10) || 5;
        this._notifyChange();
    }
    
    /**
     * Setzt PA
     * @param {number} value - Neuer PA-Wert
     */
    setPa(value) {
        this.pa = parseInt(value, 10) || 5;
        this._notifyChange();
    }
    
    /**
     * Setzt BW (Bewegungsweite)
     * @param {number} value - Neuer BW-Wert
     */
    setBw(value) {
        this.bw = Math.max(1, parseInt(value, 10) || 6);
        this._notifyChange();
    }
    
    /**
     * Setzt die Anzahl der Wunden
     * @param {number} value - Anzahl der Wunden (0-10)
     */
    setWounds(value) {
        this.wounds = Math.max(0, Math.min(10, parseInt(value, 10) || 0));
        this._notifyChange();
    }
    
    /**
     * Setzt die aktuellen Glücks-Tokens
     * @param {number} value - Neuer Wert
     */
    setLuckTokens(value) {
        this.luckTokens = Math.max(0, parseInt(value, 10) || 0);
        this._notifyChange();
    }
    
    /**
     * Setzt die maximalen Glücks-Tokens
     * @param {number} value - Neuer Wert
     */
    setMaxLuckTokens(value) {
        this.maxLuckTokens = Math.max(1, parseInt(value, 10) || 1);
        this._notifyChange();
    }
    
    /**
     * Setzt das Geld des Trainers
     * @param {number} value - Neuer Wert
     */
    setMoney(value) {
        this.money = Math.max(0, parseInt(value, 10) || 0);
        this._notifyChange();
    }
    
    /**
     * Setzt einen Fertigkeitswert
     * @param {string} skill - Name der Fertigkeit
     * @param {number} value - Neuer Wert
     */
    setSkillValue(skill, value) {
        if (this.skillValues.hasOwnProperty(skill)) {
            let parsedValue = parseInt(value, 10) || 0;
            
            // Grundwerte (KÖ, WI, CH, GL) müssen mindestens 1 sein
            const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
            if (baseStats.includes(skill)) {
                parsedValue = Math.max(1, parsedValue);
            }
            
            this.skillValues[skill] = parsedValue;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Setzt eine manuelle Überschreibung
     * @param {string} statName - Name des Stats (hp, initiative, gena, pa, bw)
     * @param {boolean} isOverridden - True wenn manuell überschrieben
     */
    setManualOverride(statName, isOverridden) {
        if (this.manualOverrides.hasOwnProperty(statName)) {
            this.manualOverrides[statName] = isOverridden;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Prüft ob ein Stat manuell überschrieben ist
     * @param {string} statName - Name des Stats
     * @returns {boolean} True wenn manuell überschrieben
     */
    isManuallyOverridden(statName) {
        return this.manualOverrides[statName] === true;
    }
    
    /**
     * Setzt einen Stat auf den berechneten Wert zurück
     * @param {string} statName - Name des Stats
     */
    resetStatToCalculated(statName) {
        const combatValues = this.calculateCombatValues();
        
        switch (statName) {
            case 'hp':
                this.stats.hp = combatValues.hp;
                this.currentHp = combatValues.hp;
                break;
            case 'initiative':
                this.stats.initiative = combatValues.initiative;
                break;
            case 'gena':
                this.gena = combatValues.gena;
                break;
            case 'pa':
                this.pa = combatValues.pa;
                break;
            case 'bw':
                this.bw = combatValues.bw;
                break;
            case 'luckTokens':
                const gl = this.skillValues['GL'] || 1;
                this.maxLuckTokens = gl;
                this.luckTokens = gl;
                break;
        }
        
        this.manualOverrides[statName] = false;
        this._notifyChange();
    }
    
    /**
     * Berechnet die Kampfwerte basierend auf den Grundwerten
     * @returns {Object} Die berechneten Kampfwerte
     */
    calculateCombatValues() {
        const ko = this.skillValues['KÖ'] || 1;
        const wi = this.skillValues['WI'] || 1;
        const ch = this.skillValues['CH'] || 1;
        const gl = this.skillValues['GL'] || 1;
        
        return {
            hp: 20 + (ko + ko + gl) * 3,
            gena: Math.ceil((wi + wi + gl) / 2),
            pa: Math.ceil((wi + ch + gl) / 2),
            bw: 25 + ko * 5,
            initiative: ko + wi + ch
        };
    }
    
    /**
     * Gibt die Formeln für die Stats zurück
     * @returns {Object} Objekt mit Formeln als Strings
     */
    getStatFormulas() {
        const ko = this.skillValues['KÖ'] || 1;
        const wi = this.skillValues['WI'] || 1;
        const ch = this.skillValues['CH'] || 1;
        const gl = this.skillValues['GL'] || 1;
        
        return {
            hp: `20 + (KÖ + KÖ + GL) × 3 = 20 + (${ko} + ${ko} + ${gl}) × 3`,
            gena: `⌈(WI + WI + GL) ÷ 2⌉ = ⌈(${wi} + ${wi} + ${gl}) ÷ 2⌉`,
            pa: `⌈(WI + CH + GL) ÷ 2⌉ = ⌈(${wi} + ${ch} + ${gl}) ÷ 2⌉`,
            bw: `25 + KÖ × 5 = 25 + ${ko} × 5`,
            initiative: `KÖ + WI + CH = ${ko} + ${wi} + ${ch}`
        };
    }
    
    /**
     * Berechnet die verbleibenden Punkte für Grundwerte
     * @returns {number} Verbleibende Punkte (kann negativ sein)
     */
    getRemainingBaseStatPoints() {
        const ko = this.skillValues['KÖ'] || 0;
        const wi = this.skillValues['WI'] || 0;
        const ch = this.skillValues['CH'] || 0;
        const gl = this.skillValues['GL'] || 0;
        return 12 - (ko + wi + ch + gl);
    }
    
    /**
     * Berechnet die verbleibenden Punkte für Fertigkeiten
     * @returns {number} Verbleibende Punkte (kann negativ sein)
     */
    getRemainingSkillPoints() {
        const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
        let totalSkillPoints = 0;
        
        Object.entries(this.skillValues).forEach(([skill, value]) => {
            if (!baseStats.includes(skill)) {
                totalSkillPoints += value;
            }
        });
        
        return 40 - totalSkillPoints;
    }
    
    // ==================== Pokemon-Slot Management ====================
    
    /**
     * Fügt einen neuen Pokemon-Slot hinzu
     * @returns {number} Index des neuen Slots
     */
    addPokemonSlot() {
        const newIndex = this.pokemonSlots.length;
        this.pokemonSlots.push(new PokemonSlot(newIndex));
        this._notifyChange();
        return newIndex;
    }
    
    /**
     * Entfernt einen Pokemon-Slot
     * @param {number} index - Index des zu entfernenden Slots
     * @returns {boolean} True bei Erfolg
     */
    removePokemonSlot(index) {
        if (index < 0 || index >= this.pokemonSlots.length) {
            return false;
        }
        
        // Pokemon-Daten aus localStorage löschen
        if (this.manager) {
            this.manager._removePokemonFromStorage(this.id, index);
        }
        
        this.pokemonSlots.splice(index, 1);
        
        // Indizes aktualisieren
        this.pokemonSlots.forEach((slot, i) => {
            slot.index = i;
        });
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Weist einem Slot ein Pokemon zu
     * @param {number} slotIndex - Index des Slots
     * @param {number} pokemonId - ID des Pokemon
     * @param {Object} pokemonData - Pokemon-Daten
     */
    assignPokemonToSlot(slotIndex, pokemonId, pokemonData) {
        if (slotIndex < 0 || slotIndex >= this.pokemonSlots.length) {
            return false;
        }
        
        const slot = this.pokemonSlots[slotIndex];
        slot.pokemonId = pokemonId;
        slot.pokemonName = pokemonData.name;
        slot.germanName = pokemonData.germanName || pokemonData.name;
        slot.spriteUrl = pokemonData.sprites?.front_default || '';
        slot.nickname = '';
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Aktualisiert den Spitznamen eines Pokemon
     * @param {number} slotIndex - Index des Slots
     * @param {string} nickname - Neuer Spitzname
     */
    updatePokemonNickname(slotIndex, nickname) {
        if (slotIndex >= 0 && slotIndex < this.pokemonSlots.length) {
            this.pokemonSlots[slotIndex].nickname = nickname;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Leert einen Pokemon-Slot
     * @param {number} slotIndex - Index des Slots
     */
    clearPokemonSlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.pokemonSlots.length) {
            // Pokemon-Daten löschen
            if (this.manager) {
                this.manager._removePokemonFromStorage(this.id, slotIndex);
            }
            
            this.pokemonSlots[slotIndex].clear();
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Gibt den Storage-Key für ein Pokemon zurück
     * @param {number} slotIndex - Index des Pokemon-Slots
     * @returns {string} Der Storage-Key
     */
    getPokemonStorageKey(slotIndex) {
        return `${this.id}_slot${slotIndex}`;
    }
    
    // ==================== Inventar Management ====================
    
    /**
     * Fügt einen neuen Inventar-Eintrag hinzu
     * @returns {number} Index des neuen Eintrags
     */
    addInventoryItem() {
        const newItem = new InventoryItem();
        this.inventory.push(newItem);
        this._notifyChange();
        return this.inventory.length - 1;
    }
    
    /**
     * Entfernt einen Inventar-Eintrag
     * @param {number} index - Index des zu entfernenden Eintrags
     * @returns {boolean} True bei Erfolg
     */
    removeInventoryItem(index) {
        if (index >= 0 && index < this.inventory.length && this.inventory.length > 1) {
            this.inventory.splice(index, 1);
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Aktualisiert einen Inventar-Eintrag
     * @param {number} index - Index des Eintrags
     * @param {Object} data - Neue Daten { name, quantity, description }
     */
    updateInventoryItem(index, data) {
        if (index >= 0 && index < this.inventory.length) {
            const item = this.inventory[index];
            if (data.name !== undefined) item.name = data.name;
            if (data.quantity !== undefined) item.quantity = data.quantity;
            if (data.description !== undefined) item.description = data.description;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    // ==================== Attacken Management ====================
    
    /**
     * Fügt eine neue Attacke hinzu
     * @returns {number} Index der neuen Attacke
     */
    addAttack() {
        const newAttack = {
            name: '',
            type: 'Normal',
            damage: '0W6',
            effect: ''
        };
        this.attacks.push(newAttack);
        this._notifyChange();
        return this.attacks.length - 1;
    }
    
    /**
     * Entfernt eine Attacke
     * @param {number} index - Index der zu entfernenden Attacke
     * @returns {boolean} True bei Erfolg
     */
    removeAttack(index) {
        if (index >= 0 && index < this.attacks.length) {
            this.attacks.splice(index, 1);
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Aktualisiert eine Attacke
     * @param {number} index - Index der Attacke
     * @param {Object} data - Neue Daten { name, type, damage, effect }
     */
    updateAttack(index, data) {
        if (index >= 0 && index < this.attacks.length) {
            const attack = this.attacks[index];
            if (data.name !== undefined) attack.name = data.name;
            if (data.type !== undefined) attack.type = data.type;
            if (data.damage !== undefined) attack.damage = data.damage;
            if (data.effect !== undefined) attack.effect = data.effect;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    // ==================== Perks Management ====================
    
    /**
     * Fügt einen neuen Perk-Slot hinzu
     * @returns {number} Index des neuen Slots
     */
    addPerk() {
        this.perks.push({ id: '', chosenType: '' });
        this._notifyChange();
        return this.perks.length - 1;
    }
    
    /**
     * Entfernt einen Perk-Slot
     * @param {number} index - Index des zu entfernenden Slots
     * @returns {boolean} True bei Erfolg
     */
    removePerk(index) {
        if (index >= 0 && index < this.perks.length && this.perks.length > 1) {
            this.perks.splice(index, 1);
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Aktualisiert einen Perk
     * @param {number} index - Index des Perks
     * @param {string} perkId - ID des Perks
     * @param {string} chosenType - Gewählter Typ (falls erforderlich)
     */
    updatePerk(index, perkId, chosenType = '') {
        if (index >= 0 && index < this.perks.length) {
            this.perks[index] = { id: perkId, chosenType: chosenType };
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Gibt alle ausgewählten Perk-IDs zurück
     * @returns {Array} Array der Perk-IDs
     */
    getSelectedPerkIds() {
        return this.perks.filter(p => p.id).map(p => p.id);
    }
    
    // ==================== Kommandos Management ====================
    
    /**
     * Fügt einen neuen Kommando-Slot hinzu
     * @returns {number} Index des neuen Slots
     */
    addKommando() {
        this.kommandos.push({ id: '', chosenStat: '' });
        this._notifyChange();
        return this.kommandos.length - 1;
    }
    
    /**
     * Entfernt einen Kommando-Slot
     * @param {number} index - Index des zu entfernenden Slots
     * @returns {boolean} True bei Erfolg
     */
    removeKommando(index) {
        if (index >= 0 && index < this.kommandos.length && this.kommandos.length > 1) {
            this.kommandos.splice(index, 1);
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Aktualisiert ein Kommando
     * @param {number} index - Index des Kommandos
     * @param {string} kommandoId - ID des Kommandos
     * @param {string} chosenStat - Gewählter Stat (falls erforderlich)
     */
    updateKommando(index, kommandoId, chosenStat = '') {
        if (index >= 0 && index < this.kommandos.length) {
            this.kommandos[index] = { id: kommandoId, chosenStat: chosenStat };
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Gibt alle ausgewählten Kommando-IDs zurück
     * @returns {Array} Array der Kommando-IDs
     */
    getSelectedKommandoIds() {
        return this.kommandos.filter(k => k.id).map(k => k.id);
    }
    
    // ==================== Noten Management ====================
    
    /**
     * Setzt die Note für ein Fach
     * @param {string} subject - ID des Fachs
     * @param {number} grade - Note (1-5)
     */
    setGrade(subject, grade) {
        if (this.grades.hasOwnProperty(subject)) {
            this.grades[subject] = Math.max(1, Math.min(5, parseInt(grade, 10) || 5));
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Gibt die Note für ein Fach zurück
     * @param {string} subject - ID des Fachs
     * @returns {number} Die Note (1-5)
     */
    getGrade(subject) {
        return this.grades[subject] || 5;
    }
    
    /**
     * Berechnet die Gesamtkosten der aktuellen Notenverteilung
     * @returns {number} Gesamte ausgegebene Punkte
     */
    getGradePointsSpent() {
        let spent = 0;
        Object.values(this.grades).forEach(grade => {
            // Jede Verbesserung von 5 kostet Punkte: 5->4=1, 5->3=2, 5->2=3, 5->1=4
            spent += (5 - grade);
        });
        return spent;
    }
    
    /**
     * Berechnet die verbleibenden Notenpunkte
     * @returns {number} Verbleibende Punkte
     */
    getRemainingGradePoints() {
        return 30 - this.getGradePointsSpent();
    }
    
    /**
     * Zählt wie viele Fächer die Note 5 haben
     * @returns {number} Anzahl der Fächer mit Note 5
     */
    countGradeFives() {
        let count = 0;
        Object.values(this.grades).forEach(grade => {
            if (grade === 5) count++;
        });
        return count;
    }
    
    // ==================== Typ-Meisterschaft ====================
    
    /**
     * Setzt den Typ-Meisterschaftswert für einen Typ
     * @param {string} type - ID des Typs
     * @param {number} value - Neuer Wert
     */
    setTypeMastery(type, value) {
        if (this.typeMastery.hasOwnProperty(type)) {
            this.typeMastery[type] = parseInt(value, 10) || 5;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Gibt den Typ-Meisterschaftswert für einen Typ zurück
     * @param {string} type - ID des Typs
     * @returns {number} Der Wert
     */
    getTypeMastery(type) {
        return this.typeMastery[type] || 5;
    }
    
    /**
     * Gibt den effektiven Typ-Meisterschaftswert zurück (inkl. Lieblingstyp-Bonus)
     * @param {string} type - ID des Typs
     * @returns {number} Der effektive Wert
     */
    getEffectiveTypeMastery(type) {
        let value = this.typeMastery[type] || 5;
        if (this.favoriteType === type) {
            value += 5;
        }
        return value;
    }
    
    /**
     * Setzt den Lieblingstyp
     * @param {string} type - ID des Typs oder null
     */
    setFavoriteType(type) {
        this.favoriteType = type || null;
        this._notifyChange();
    }
    
    /**
     * Gibt den Lieblingstyp zurück
     * @returns {string|null} Der Lieblingstyp oder null
     */
    getFavoriteType() {
        return this.favoriteType;
    }
    
    // ==================== Export/Import ====================
    
    /**
     * Exportiert den Trainer als JSON-Objekt
     * @returns {Object} JSON-Repräsentation
     * @private
     */
    _exportToJSON() {
        return {
            id: this.id,
            name: this.name,
            age: this.age,
            playedBy: this.playedBy,
            klasse: this.klasse,
            secondKlasse: this.secondKlasse,
            vorteil: this.vorteil,
            nachteil: this.nachteil,
            characterImage: this.characterImage,
            level: this.level,
            stats: this.stats,
            currentHp: this.currentHp,
            gena: this.gena,
            pa: this.pa,
            bw: this.bw,
            wounds: this.wounds,
            luckTokens: this.luckTokens,
            maxLuckTokens: this.maxLuckTokens,
            money: this.money,
            manualOverrides: this.manualOverrides,
            skillValues: this.skillValues,
            pokemonSlots: this.pokemonSlots.map(slot => slot.toJSON()),
            inventory: this.inventory.map(item => item.toJSON()),
            attacks: this.attacks,
            perks: this.perks,
            kommandos: this.kommandos,
            grades: this.grades,
            typeMastery: this.typeMastery,
            favoriteType: this.favoriteType
        };
    }
    
    /**
     * Importiert Trainer-Daten aus JSON
     * @param {Object} data - Die zu importierenden Daten
     * @private
     */
    _importFromJSON(data) {
        if (!data) return;
        
        // ID beibehalten falls vorhanden, sonst neue generieren
        if (data.id) {
            this.id = data.id;
        }
        
        this.name = data.name || '';
        this.age = data.age || '';
        this.playedBy = data.playedBy || '';
        this.klasse = data.klasse || '';
        this.secondKlasse = data.secondKlasse || '';
        this.vorteil = data.vorteil || '';
        this.nachteil = data.nachteil || '';
        this.characterImage = data.characterImage || '';
        this.level = data.level || 10;
        
        // Stats mit Rückwärtskompatibilität
        if (data.stats) {
            this.stats.hp = data.stats.hp || 29;
            this.stats.initiative = data.stats.initiative || data.stats.speed || 3;
        }
        
        this.currentHp = data.currentHp || 29;
        this.gena = data.gena || 2;
        this.pa = data.pa || 2;
        this.bw = data.bw || 30;
        this.wounds = data.wounds || 0;
        
        // Glücks-Tokens
        const gl = data.skillValues?.['GL'] || 1;
        this.luckTokens = data.luckTokens !== undefined ? data.luckTokens : gl;
        this.maxLuckTokens = data.maxLuckTokens !== undefined ? data.maxLuckTokens : gl;
        
        this.money = data.money || 0;
        
        // Manuelle Überschreibungen
        if (data.manualOverrides) {
            this.manualOverrides = { ...this.manualOverrides, ...data.manualOverrides };
        }
        
        // Skill-Werte
        if (data.skillValues) {
            this.skillValues = { ...this.skillValues, ...data.skillValues };
        }
        
        // Grundwerte mindestens 1
        const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
        baseStats.forEach(stat => {
            if (this.skillValues[stat] < 1) {
                this.skillValues[stat] = 1;
            }
        });
        
        // Pokemon-Slots
        if (data.pokemonSlots && Array.isArray(data.pokemonSlots)) {
            this.pokemonSlots = data.pokemonSlots.map((slotData, index) => {
                const slot = new PokemonSlot(index);
                slot.fromJSON(slotData);
                return slot;
            });
        }
        
        // Inventar
        if (data.inventory && Array.isArray(data.inventory)) {
            this.inventory = data.inventory.map(itemData => {
                const item = new InventoryItem();
                item.fromJSON(itemData);
                return item;
            });
        }
        
        // Attacken
        if (data.attacks && Array.isArray(data.attacks)) {
            this.attacks = data.attacks;
        }
        
        // Perks
        if (data.perks && Array.isArray(data.perks)) {
            this.perks = data.perks.map(p => {
                if (typeof p === 'string') {
                    return { id: p, chosenType: '' };
                }
                return { id: p.id || '', chosenType: p.chosenType || '' };
            });
        }
        
        // Kommandos
        if (data.kommandos && Array.isArray(data.kommandos)) {
            this.kommandos = data.kommandos.map(k => {
                if (typeof k === 'string') {
                    return { id: k, chosenStat: '' };
                }
                return { id: k.id || '', chosenStat: k.chosenStat || '' };
            });
        }
        
        // Noten
        if (data.grades && typeof data.grades === 'object') {
            this.grades = { ...this.grades, ...data.grades };
        }
        
        // Typ-Meisterschaft
        if (data.typeMastery && typeof data.typeMastery === 'object') {
            this.typeMastery = { ...this.typeMastery, ...data.typeMastery };
        }
        
        // Lieblingstyp
        if (data.favoriteType !== undefined) {
            this.favoriteType = data.favoriteType;
        }
    }
    
    // ==================== Legacy-Kompatibilität ====================
    
    /**
     * Legacy-Methode für loadFromLocalStorage
     * @deprecated Verwende stattdessen TrainerManager
     */
    loadFromLocalStorage() {
        // Wird nicht mehr direkt verwendet
        console.warn('loadFromLocalStorage ist deprecated. Verwende TrainerManager.');
        return false;
    }
    
    /**
     * Legacy-Methode für exportAll
     * @deprecated Verwende stattdessen TrainerManager.exportAll()
     */
    exportAll() {
        if (this.manager) {
            return this.manager.exportAll();
        }
        return this._exportToJSON();
    }
    
    /**
     * Legacy-Methode für importAll
     * @deprecated Verwende stattdessen TrainerManager.importAll()
     */
    importAll(data) {
        if (this.manager) {
            this.manager.importAll(data);
        } else {
            this._importFromJSON(data.trainer || data);
        }
    }
}


/**
 * Klasse für einen Inventar-Eintrag
 */
class InventoryItem {
    constructor() {
        this.name = '';
        this.quantity = 1;
        this.description = '';
    }
    
    /**
     * Serialisiert den Eintrag zu JSON
     * @returns {Object} JSON-Repräsentation
     */
    toJSON() {
        return {
            name: this.name,
            quantity: this.quantity,
            description: this.description
        };
    }
    
    /**
     * Lädt Daten aus JSON
     * @param {Object} data - Die zu ladenden Daten
     */
    fromJSON(data) {
        this.name = data.name || '';
        this.quantity = data.quantity || 1;
        this.description = data.description || '';
    }
}


/**
 * Klasse für einen Pokemon-Slot im Trainer-Team
 */
class PokemonSlot {
    constructor(index) {
        this.index = index;
        this.pokemonId = null;
        this.pokemonName = null;
        this.germanName = null;
        this.nickname = '';
        this.spriteUrl = '';
        this.types = [];
    }
    
    /**
     * Prüft, ob der Slot leer ist
     * @returns {boolean} True wenn leer
     */
    isEmpty() {
        return this.pokemonId === null;
    }
    
    /**
     * Gibt den Anzeigenamen zurück (Spitzname oder deutscher Name)
     * @returns {string} Der Anzeigename
     */
    getDisplayName() {
        if (this.nickname && this.nickname.trim() !== '') {
            return this.nickname;
        }
        return this.germanName || this.pokemonName || '';
    }
    
    /**
     * Leert den Slot
     */
    clear() {
        this.pokemonId = null;
        this.pokemonName = null;
        this.germanName = null;
        this.nickname = '';
        this.spriteUrl = '';
        this.types = [];
    }
    
    /**
     * Serialisiert den Slot zu JSON
     * @returns {Object} JSON-Repräsentation
     */
    toJSON() {
        return {
            index: this.index,
            pokemonId: this.pokemonId,
            pokemonName: this.pokemonName,
            germanName: this.germanName,
            nickname: this.nickname,
            spriteUrl: this.spriteUrl,
            types: this.types || []
        };
    }
    
    /**
     * Lädt Daten aus JSON
     * @param {Object} data - Die zu ladenden Daten
     */
    fromJSON(data) {
        this.index = data.index !== undefined ? data.index : this.index;
        this.pokemonId = data.pokemonId || null;
        this.pokemonName = data.pokemonName || null;
        this.germanName = data.germanName || null;
        this.nickname = data.nickname || '';
        this.spriteUrl = data.spriteUrl || '';
        this.types = data.types || [];
    }
}


// ==================== Globale Initialisierung ====================

// TrainerManager global verfügbar machen
window.trainerManager = new TrainerManager();

// Für Rückwärtskompatibilität: trainerState zeigt auf den aktiven Trainer
Object.defineProperty(window, 'trainerState', {
    get: function() {
        return window.trainerManager.getActiveTrainer();
    },
    configurable: true
});

console.log("TrainerManager wurde global initialisiert. window.trainerManager ist jetzt verfügbar.");
console.log(`Anzahl geladener Trainer: ${window.trainerManager.getTrainerCount()}`);