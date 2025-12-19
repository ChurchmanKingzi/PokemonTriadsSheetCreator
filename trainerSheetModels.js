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
            
            // Pokemon-Daten dieses Trainers aus Storage entfernen (über UUID!)
            removedTrainer.pokemonSlots.forEach((slot) => {
                if (slot.pokemonUuid) {
                    this._removePokemonFromStorage(removedTrainer.id, slot.pokemonUuid);
                }
            });
            
            this.trainers.splice(index, 1);
            
            // Trainer-Indizes aktualisieren
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
     * Kopiert Pokemon-Daten mit neuen UUIDs
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
            
            // Pokemon-Daten kopieren mit NEUEN UUIDs
            originalTrainer.pokemonSlots.forEach((slot, slotIndex) => {
                if (slot.pokemonId && slot.pokemonUuid) {
                    // Neue UUID für das kopierte Pokemon generieren
                    const newSlot = newTrainer.pokemonSlots[slotIndex];
                    newSlot.generateUuid();
                    
                    // Daten laden und mit neuer UUID speichern
                    const pokemonData = this._loadPokemonFromStorage(originalTrainer.id, slot.pokemonUuid);
                    if (pokemonData) {
                        this._savePokemonToStorage(newTrainer.id, newSlot.pokemonUuid, {
                            ...pokemonData,
                            trainerId: newTrainer.id,
                            pokemonUuid: newSlot.pokemonUuid
                        });
                    }
                }
            });
            
            this._saveToLocalStorage();
            return newIndex;
        }
        return -1;
    }
    
    /**
     * Speichert Pokemon-Daten für einen bestimmten Trainer und Pokemon-UUID
     * @param {string} trainerId - ID des Trainers
     * @param {string} pokemonUuid - UUID des Pokemon
     * @param {Object} pokemonData - Die Pokemon-Daten
     */
    _savePokemonToStorage(trainerId, pokemonUuid, pokemonData) {
        if (window.pokemonStorageService) {
            window.pokemonStorageService.save(trainerId, pokemonUuid, pokemonData);
        } else {
            // Fallback mit neuem Key-Format
            try {
                const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                const key = `${trainerId}_pokemon_${pokemonUuid}`;
                sheets[key] = pokemonData;
                localStorage.setItem('pokemon_character_sheets', JSON.stringify(sheets));
            } catch (error) {
                console.error('Fehler beim Speichern der Pokemon-Daten:', error);
            }
        }
    }
    
    /**
     * Lädt Pokemon-Daten für einen bestimmten Trainer und Pokemon-UUID
     * @param {string} trainerId - ID des Trainers
     * @param {string} pokemonUuid - UUID des Pokemon
     * @returns {Object|null} Die Pokemon-Daten oder null
     */
    _loadPokemonFromStorage(trainerId, pokemonUuid) {
        if (window.pokemonStorageService) {
            return window.pokemonStorageService.load(trainerId, pokemonUuid);
        } else {
            // Fallback mit neuem Key-Format
            try {
                const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                const key = `${trainerId}_pokemon_${pokemonUuid}`;
                return sheets[key] || null;
            } catch (error) {
                console.error('Fehler beim Laden der Pokemon-Daten:', error);
                return null;
            }
        }
    }
    
    /**
     * Entfernt Pokemon-Daten für einen bestimmten Trainer und Pokemon-UUID
     * @param {string} trainerId - ID des Trainers
     * @param {string} pokemonUuid - UUID des Pokemon
     */
    _removePokemonFromStorage(trainerId, pokemonUuid) {
        if (window.pokemonStorageService) {
            window.pokemonStorageService.delete(trainerId, pokemonUuid);
        } else {
            // Fallback mit neuem Key-Format
            try {
                const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                const key = `${trainerId}_pokemon_${pokemonUuid}`;
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
                    
                    // UUID-Migration für alle Trainer durchführen
                    this.migrateAllToUuidFormat();
                    
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
     * Migriert Pokemon-Daten vom alten Format zum neuen UUID-Format
     * Wird automatisch beim Laden aufgerufen
     * @param {TrainerState} trainer - Der Trainer dessen Pokemon migriert werden
     * @private
     */
    _migratePokemonData(trainer) {
        try {
            const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
            let migratedCount = 0;
            let needsSave = false;
            
            // Für jeden Pokemon-Slot des Trainers
            trainer.pokemonSlots.forEach((slot, slotIndex) => {
                if (slot.pokemonId) {
                    // UUID generieren falls nicht vorhanden
                    if (!slot.pokemonUuid) {
                        slot.generateUuid();
                        needsSave = true;
                        console.log(`UUID generiert für Slot ${slotIndex}: ${slot.pokemonUuid}`);
                    }
                    
                    const newKey = `${trainer.id}_pokemon_${slot.pokemonUuid}`;
                    const slotKey = `${trainer.id}_slot${slotIndex}`;
                    
                    // Prüfen ob Daten unter neuem Key bereits existieren
                    if (sheets[newKey]) {
                        // Daten existieren bereits unter neuem Key - alles gut
                        // Aber trotzdem alten Key löschen falls vorhanden
                        if (sheets[slotKey]) {
                            delete sheets[slotKey];
                            needsSave = true;
                            console.log(`Alter Key gelöscht: ${slotKey}`);
                        }
                    }
                    // Daten unter altem Slot-Key vorhanden? -> Migrieren!
                    else if (sheets[slotKey]) {
                        sheets[newKey] = sheets[slotKey];
                        sheets[newKey].pokemonUuid = slot.pokemonUuid;
                        delete sheets[slotKey];
                        migratedCount++;
                        needsSave = true;
                        console.log(`Pokemon migriert: ${slotKey} -> ${newKey}`);
                    }
                    // Ganz altes Format: nur Pokemon-ID als Key
                    else {
                        const oldKey = slot.pokemonId.toString();
                        if (sheets[oldKey]) {
                            sheets[newKey] = sheets[oldKey];
                            sheets[newKey].pokemonUuid = slot.pokemonUuid;
                            // Alten Key behalten für andere Trainer die ihn nutzen könnten
                            migratedCount++;
                            needsSave = true;
                            console.log(`Pokemon migriert (legacy): ${oldKey} -> ${newKey}`);
                        }
                    }
                }
            });
            
            if (needsSave) {
                localStorage.setItem('pokemon_character_sheets', JSON.stringify(sheets));
                if (migratedCount > 0) {
                    console.log(`${migratedCount} Pokemon-Datensätze migriert.`);
                }
            }
        } catch (error) {
            console.error('Fehler bei der Pokemon-Daten-Migration:', error);
        }
    }
    
    /**
     * Migriert alle Pokemon aller Trainer zum UUID-Format
     * Wird nach dem Laden aller Trainer aufgerufen
     * Prüft auch ob Daten unter dem neuen Key existieren
     */
    migrateAllToUuidFormat() {
        console.log('Prüfe auf Pokemon-Migration zum UUID-Format...');
        
        // Migration für jeden Trainer durchführen
        this.trainers.forEach(trainer => {
            this._migratePokemonData(trainer);
        });
        
        // Trainer-State speichern (mit eventuell neu generierten UUIDs)
        this._saveToLocalStorage();
        console.log('UUID-Migration abgeschlossen.');
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
            
            // Migration durchführen für alle Trainer
            this.migrateAllToUuidFormat();
        }
        // Altes Single-Trainer-Format
        else if (data.trainer) {
            // Bestehende Trainer behalten und neuen hinzufügen
            const newIndex = this.addTrainer();
            const newTrainer = this.trainers[newIndex];
            newTrainer._importFromJSON(data.trainer);
            
            // Pokemon-Sheets importieren
            if (data.pokemonSheets) {
                const existingSheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                
                // Für jeden Pokemon-Slot - mit UUID-Format!
                newTrainer.pokemonSlots.forEach((slot, slotIndex) => {
                    if (slot.pokemonId) {
                        // UUID generieren falls nicht vorhanden
                        if (!slot.pokemonUuid) {
                            slot.generateUuid();
                        }
                        
                        // Alte Daten unter verschiedenen Keys suchen
                        const oldKey = slot.pokemonId.toString();
                        const slotKey = `${newTrainer.id}_slot${slotIndex}`;
                        
                        // Neue UUID-basierte Key verwenden
                        const newKey = `${newTrainer.id}_pokemon_${slot.pokemonUuid}`;
                        
                        if (data.pokemonSheets[oldKey]) {
                            existingSheets[newKey] = {
                                ...data.pokemonSheets[oldKey],
                                pokemonUuid: slot.pokemonUuid
                            };
                        } else if (data.pokemonSheets[slotKey]) {
                            existingSheets[newKey] = {
                                ...data.pokemonSheets[slotKey],
                                pokemonUuid: slot.pokemonUuid
                            };
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
        this.height = '';
        this.weight = '';
        this.playedBy = '';
        this.background = '';
        
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
        
        // Statuseffekte (z.B. ['poisoned', 'burned'])
        this.statusEffects = [];
        
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
        
        // Fertigkeitswerte (Trainer verwendet erweiterte Skill-Liste)
        this.skillValues = {};
        
        // Haupt-Kategorien (Grundwerte) initialisieren mit 1
        // Verwende TRAINER_SKILL_GROUPS für Trainer-spezifische Skills
        const skillGroups = typeof TRAINER_SKILL_GROUPS !== 'undefined' ? TRAINER_SKILL_GROUPS : SKILL_GROUPS;
        Object.keys(skillGroups).forEach(category => {
            this.skillValues[category] = 1;
        });
        
        // Einzelne Skills initialisieren mit 0
        Object.values(skillGroups).flat().forEach(skill => {
            this.skillValues[skill] = 0;
        });
        
        // Benutzerdefinierte Fertigkeiten (pro Kategorie)
        // Format: { KÖ: [{name: 'Fertigkeit', value: 1}], WI: [], CH: [], GL: [] }
        this.customSkills = {
            'KÖ': [],
            'WI': [],
            'CH': [],
            'GL': []
        };
        
        // Pokemon-Slots (standardmäßig 6)
        this.pokemonSlots = [];
        for (let i = 0; i < 6; i++) {
            this.pokemonSlots.push(new PokemonSlot(i));
        }
        
        // Aktiver Pokemon-Index (für Navigation)
        this.activePokemonIndex = null;
        
        // Inventar mit Kategorien
        this.inventory = {
            categories: ['items', 'schluessel-items', 'pokeballs', 'medizin', 'sonstiges'],
            categoryNames: {
                'items': 'Items',
                'schluessel-items': 'Schlüssel-Items',
                'pokeballs': 'Pokébälle',
                'medizin': 'Medizin',
                'sonstiges': 'Sonstiges'
            },
            items: {
                'items': [new InventoryItem()],
                'schluessel-items': [],
                'pokeballs': [],
                'medizin': [],
                'sonstiges': []
            }
        };
        
        // Notizen (dynamische Kategorien mit Einträgen)
        this.notes = {
            categories: ['personen', 'orte', 'sonstiges'],
            categoryNames: {
                'personen': 'Personen',
                'orte': 'Orte',
                'sonstiges': 'Sonstiges'
            },
            categoryIcons: {
                'personen': '👤',
                'orte': '📍',
                'sonstiges': '📝'
            },
            categoryColors: {
                // Hue-Werte (0-360) für Kategorie-Hintergrundfarben, null = Standard
                'personen': null,
                'orte': null,
                'sonstiges': null
            },
            entries: {
                'personen': [new NoteEntry('personen')],
                'orte': [new NoteEntry('orte')],
                'sonstiges': [new NoteEntry('sonstiges')]
            }
        };
        
        // Trainer-Attacken (mit Standard-Attacken)
        this.attacks = [
            {
                name: 'Tackle',
                type: 'Normal',
                damage: '5W6',
                range: 'Nah',
                attackCategory: 'Physisch',
                effect: 'Kontakt. Trifft ein Ziel mit Körpereinsatz.'
            },
            {
                name: 'Risikotackle',
                type: 'Normal',
                damage: '12W6',
                range: 'Nah',
                attackCategory: 'Physisch',
                effect: 'Kontakt. Rammt ein Ziel rücksichtslos. 50% Rückstoßschaden!'
            },
            {
                name: 'Kulleraugen',
                type: 'Fee',
                damage: '0W6',
                range: 'Blickkontakt',
                attackCategory: 'Status',
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
     * Setzt die Größe des Trainers
     * @param {string} height - Die Größe
     */
    setHeight(height) {
        this.height = height;
        this._notifyChange();
    }
    
    /**
     * Setzt das Gewicht des Trainers
     * @param {string} weight - Das Gewicht
     */
    setWeight(weight) {
        this.weight = weight;
        this._notifyChange();
    }
    
    /**
     * Setzt den Hintergrund des Trainers
     * @param {string} background - Die Hintergrundgeschichte
     */
    setBackground(background) {
        this.background = background;
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
        
        this._notifyChange();
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
            this._notifyChange();
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
            this._notifyChange();
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
     * Löscht die Storage-Daten über die UUID des Pokemon
     * @param {number} index - Index des zu entfernenden Slots
     * @returns {boolean} True bei Erfolg
     */
    removePokemonSlot(index) {
        if (index < 0 || index >= this.pokemonSlots.length) {
            return false;
        }
        
        const slot = this.pokemonSlots[index];
        
        // Pokemon-Daten über UUID aus localStorage löschen
        if (slot.pokemonUuid && this.manager) {
            this.manager._removePokemonFromStorage(this.id, slot.pokemonUuid);
        }
        
        this.pokemonSlots.splice(index, 1);
        
        // Nur die Slot-Indizes aktualisieren (UUIDs bleiben stabil!)
        this.pokemonSlots.forEach((s, i) => {
            s.index = i;
        });
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Tauscht zwei Pokemon-Slots
     * Die UUIDs und Storage-Keys bleiben unverändert - nur die Positionen werden getauscht
     * @param {number} fromIndex - Index des ersten Slots
     * @param {number} toIndex - Index des zweiten Slots
     * @returns {boolean} True bei Erfolg
     */
    swapPokemonSlots(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.pokemonSlots.length ||
            toIndex < 0 || toIndex >= this.pokemonSlots.length ||
            fromIndex === toIndex) {
            return false;
        }
        
        const fromSlot = this.pokemonSlots[fromIndex];
        const toSlot = this.pokemonSlots[toIndex];
        
        // Alle Slot-Daten tauschen (außer dem Index)
        const tempData = {
            pokemonId: fromSlot.pokemonId,
            pokemonUuid: fromSlot.pokemonUuid,
            pokemonName: fromSlot.pokemonName,
            germanName: fromSlot.germanName,
            nickname: fromSlot.nickname,
            spriteUrl: fromSlot.spriteUrl,
            shinySpriteUrl: fromSlot.shinySpriteUrl,
            types: fromSlot.types ? [...fromSlot.types] : []
        };
        
        // fromSlot bekommt toSlot-Daten
        fromSlot.pokemonId = toSlot.pokemonId;
        fromSlot.pokemonUuid = toSlot.pokemonUuid;
        fromSlot.pokemonName = toSlot.pokemonName;
        fromSlot.germanName = toSlot.germanName;
        fromSlot.nickname = toSlot.nickname;
        fromSlot.spriteUrl = toSlot.spriteUrl;
        fromSlot.shinySpriteUrl = toSlot.shinySpriteUrl;
        fromSlot.types = toSlot.types ? [...toSlot.types] : [];
        
        // toSlot bekommt tempData
        toSlot.pokemonId = tempData.pokemonId;
        toSlot.pokemonUuid = tempData.pokemonUuid;
        toSlot.pokemonName = tempData.pokemonName;
        toSlot.germanName = tempData.germanName;
        toSlot.nickname = tempData.nickname;
        toSlot.spriteUrl = tempData.spriteUrl;
        toSlot.shinySpriteUrl = tempData.shinySpriteUrl;
        toSlot.types = tempData.types;
        
        console.log(`Pokemon-Slots getauscht: ${fromIndex} <-> ${toIndex}`);
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Weist einem Slot ein Pokemon zu
     * Generiert automatisch eine UUID für das Pokemon
     * @param {number} slotIndex - Index des Slots
     * @param {number} pokemonId - ID des Pokemon
     * @param {Object} pokemonData - Pokemon-Daten
     * @returns {string|false} Die UUID des Pokemon oder false bei Fehler
     */
    assignPokemonToSlot(slotIndex, pokemonId, pokemonData) {
        if (slotIndex < 0 || slotIndex >= this.pokemonSlots.length) {
            return false;
        }
        
        const slot = this.pokemonSlots[slotIndex];
        
        // UUID generieren wenn nicht vorhanden oder wenn es ein neues Pokemon ist
        if (!slot.pokemonUuid || slot.pokemonId !== pokemonId) {
            slot.generateUuid();
        }
        
        slot.pokemonId = pokemonId;
        slot.pokemonName = pokemonData.name;
        slot.germanName = pokemonData.germanName || pokemonData.name;
        slot.spriteUrl = pokemonData.sprites?.front_default || '';
        slot.shinySpriteUrl = pokemonData.sprites?.front_shiny || '';
        slot.nickname = '';
        
        // Typen extrahieren
        if (pokemonData.types && Array.isArray(pokemonData.types)) {
            slot.types = pokemonData.types.map(t => {
                if (typeof t === 'string') return t.toLowerCase();
                if (t.type && t.type.name) return t.type.name.toLowerCase();
                return null;
            }).filter(t => t !== null);
        }
        
        this._notifyChange();
        return slot.pokemonUuid;
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
     * Löscht auch die Storage-Daten über die UUID
     * @param {number} slotIndex - Index des Slots
     * @returns {boolean} True bei Erfolg
     */
    clearPokemonSlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.pokemonSlots.length) {
            const slot = this.pokemonSlots[slotIndex];
            
            // Pokemon-Daten über UUID löschen
            if (slot.pokemonUuid && this.manager) {
                this.manager._removePokemonFromStorage(this.id, slot.pokemonUuid);
            }
            
            slot.clear();
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Gibt den Storage-Key für ein Pokemon zurück
     * @param {number} slotIndex - Index des Pokemon-Slots
     * @returns {string|null} Der Storage-Key oder null wenn keine UUID vorhanden
     */
    getPokemonStorageKey(slotIndex) {
        const slot = this.pokemonSlots[slotIndex];
        if (slot && slot.pokemonUuid) {
            return `${this.id}_pokemon_${slot.pokemonUuid}`;
        }
        return null;
    }
    
    // ==================== Inventar Management ====================
    
    // ==================== Inventar Management ====================
    
    /**
     * Gibt die Standard-Kategorien zurück
     * @returns {Object} Standard-Kategorien Konfiguration
     */
    getDefaultInventoryCategories() {
        return {
            categories: ['items', 'schluessel-items', 'pokeballs', 'medizin', 'sonstiges'],
            categoryNames: {
                'items': 'Items',
                'schluessel-items': 'Schlüssel-Items',
                'pokeballs': 'Pokébälle',
                'medizin': 'Medizin',
                'sonstiges': 'Sonstiges'
            }
        };
    }
    
    /**
     * Fügt einen neuen Inventar-Eintrag hinzu
     * @param {string} category - Die Kategorie-ID (default: 'items')
     * @returns {number} Index des neuen Eintrags
     */
    addInventoryItem(category = 'items') {
        if (!this.inventory.items[category]) {
            category = 'items'; // Fallback zur Items-Kategorie
        }
        const newItem = new InventoryItem();
        this.inventory.items[category].push(newItem);
        this._notifyChange();
        return this.inventory.items[category].length - 1;
    }
    
    /**
     * Entfernt einen Inventar-Eintrag
     * @param {string} category - Die Kategorie-ID
     * @param {number} index - Index des zu entfernenden Eintrags
     * @returns {boolean} True bei Erfolg
     */
    removeInventoryItem(category, index) {
        if (!this.inventory.items[category]) return false;
        const items = this.inventory.items[category];
        if (index >= 0 && index < items.length) {
            items.splice(index, 1);
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Aktualisiert einen Inventar-Eintrag
     * @param {string} category - Die Kategorie-ID
     * @param {number} index - Index des Eintrags
     * @param {Object} data - Neue Daten { name, quantity, description }
     */
    updateInventoryItem(category, index, data) {
        if (!this.inventory.items[category]) return false;
        const items = this.inventory.items[category];
        if (index >= 0 && index < items.length) {
            const item = items[index];
            if (data.name !== undefined) item.name = data.name;
            if (data.quantity !== undefined) item.quantity = data.quantity;
            if (data.description !== undefined) item.description = data.description;
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Verschiebt ein Item in eine andere Kategorie
     * @param {string} fromCategory - Quell-Kategorie
     * @param {number} fromIndex - Index in der Quell-Kategorie
     * @param {string} toCategory - Ziel-Kategorie
     * @param {number} toIndex - Optional: Ziel-Index (default: am Ende)
     * @returns {boolean} True bei Erfolg
     */
    moveInventoryItem(fromCategory, fromIndex, toCategory, toIndex = -1) {
        if (!this.inventory.items[fromCategory] || !this.inventory.items[toCategory]) return false;
        
        const fromItems = this.inventory.items[fromCategory];
        if (fromIndex < 0 || fromIndex >= fromItems.length) return false;
        
        const [item] = fromItems.splice(fromIndex, 1);
        const toItems = this.inventory.items[toCategory];
        
        if (toIndex < 0 || toIndex >= toItems.length) {
            toItems.push(item);
        } else {
            toItems.splice(toIndex, 0, item);
        }
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Fügt eine neue Inventar-Kategorie hinzu
     * @param {string} name - Name der neuen Kategorie
     * @returns {string|null} ID der neuen Kategorie oder null bei Fehler
     */
    addInventoryCategory(name) {
        if (!name || typeof name !== 'string') return null;
        
        // ID generieren (lowercase, Bindestriche statt Leerzeichen)
        const id = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9äöüß-]/g, '')
            .substring(0, 30);
        
        // Prüfen ob ID schon existiert
        if (this.inventory.items[id]) {
            // Suffix anhängen
            let counter = 2;
            let newId = `${id}-${counter}`;
            while (this.inventory.items[newId]) {
                counter++;
                newId = `${id}-${counter}`;
            }
            this.inventory.categories.push(newId);
            this.inventory.categoryNames[newId] = name;
            this.inventory.items[newId] = [];
            this._notifyChange();
            return newId;
        }
        
        this.inventory.categories.push(id);
        this.inventory.categoryNames[id] = name;
        this.inventory.items[id] = [];
        this._notifyChange();
        return id;
    }
    
    /**
     * Entfernt eine Inventar-Kategorie
     * @param {string} categoryId - ID der zu entfernenden Kategorie
     * @param {boolean} moveItems - True = Items nach 'items' verschieben, False = löschen
     * @returns {boolean} True bei Erfolg
     */
    removeInventoryCategory(categoryId, moveItems = true) {
        // 'items' Kategorie kann nicht gelöscht werden
        if (categoryId === 'items') return false;
        if (!this.inventory.items[categoryId]) return false;
        
        // Items verschieben oder löschen
        if (moveItems) {
            const itemsToMove = this.inventory.items[categoryId];
            this.inventory.items['items'].push(...itemsToMove);
        }
        
        // Kategorie entfernen
        delete this.inventory.items[categoryId];
        delete this.inventory.categoryNames[categoryId];
        this.inventory.categories = this.inventory.categories.filter(id => id !== categoryId);
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Benennt eine Inventar-Kategorie um
     * @param {string} categoryId - ID der Kategorie
     * @param {string} newName - Neuer Name
     * @returns {boolean} True bei Erfolg
     */
    renameInventoryCategory(categoryId, newName) {
        if (!this.inventory.categoryNames[categoryId]) return false;
        if (!newName || typeof newName !== 'string') return false;
        
        this.inventory.categoryNames[categoryId] = newName;
        this._notifyChange();
        return true;
    }
    
    /**
     * Ändert die Reihenfolge der Inventar-Kategorien
     * @param {number} fromIndex - Ursprünglicher Index
     * @param {number} toIndex - Ziel-Index
     * @returns {boolean} True bei Erfolg
     */
    reorderInventoryCategories(fromIndex, toIndex) {
        const categories = this.inventory.categories;
        if (fromIndex < 0 || fromIndex >= categories.length) return false;
        if (toIndex < 0 || toIndex >= categories.length) return false;
        
        const [category] = categories.splice(fromIndex, 1);
        categories.splice(toIndex, 0, category);
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Gibt die Items einer Kategorie zurück
     * @param {string} category - Kategorie-ID
     * @returns {InventoryItem[]} Items der Kategorie
     */
    getInventoryItems(category) {
        return this.inventory.items[category] || [];
    }
    
    /**
     * Gibt alle Kategorie-IDs zurück
     * @returns {string[]} Kategorie-IDs
     */
    getInventoryCategories() {
        return this.inventory.categories;
    }
    
    /**
     * Gibt den Namen einer Kategorie zurück
     * @param {string} categoryId - Kategorie-ID
     * @returns {string} Kategorie-Name
     */
    getInventoryCategoryName(categoryId) {
        return this.inventory.categoryNames[categoryId] || categoryId;
    }
    
    // ==================== Notizen Management ====================
    
    /**
     * Fügt einen neuen Notiz-Eintrag hinzu
     * @param {string} category - Kategorie-ID
     * @returns {number} Index des neuen Eintrags
     */
    addNote(category) {
        if (!this.notes.entries[category]) return -1;
        const newEntry = new NoteEntry(category);
        this.notes.entries[category].push(newEntry);
        this._notifyChange();
        return this.notes.entries[category].length - 1;
    }
    
    /**
     * Entfernt einen Notiz-Eintrag
     * @param {string} category - Kategorie-ID
     * @param {number} index - Index des zu entfernenden Eintrags
     * @returns {boolean} True bei Erfolg
     */
    removeNote(category, index) {
        if (!this.notes.entries[category]) return false;
        if (index >= 0 && index < this.notes.entries[category].length) {
            this.notes.entries[category].splice(index, 1);
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Aktualisiert einen Notiz-Eintrag
     * @param {string} category - Kategorie-ID
     * @param {number} index - Index des Eintrags
     * @param {Object} data - Neue Daten
     */
    updateNote(category, index, data) {
        if (!this.notes.entries[category]) return false;
        if (index >= 0 && index < this.notes.entries[category].length) {
            const entry = this.notes.entries[category][index];
            Object.keys(data).forEach(key => {
                if (entry.hasOwnProperty(key) && key !== 'type') {
                    entry[key] = data[key];
                }
            });
            this._notifyChange();
            return true;
        }
        return false;
    }
    
    /**
     * Gibt alle Notizen-Kategorien zurück
     * @returns {string[]} Array von Kategorie-IDs
     */
    getNoteCategories() {
        return this.notes.categories;
    }
    
    /**
     * Gibt den Namen einer Notizen-Kategorie zurück
     * @param {string} categoryId - Kategorie-ID
     * @returns {string} Kategorie-Name
     */
    getNoteCategoryName(categoryId) {
        return this.notes.categoryNames[categoryId] || categoryId;
    }
    
    /**
     * Gibt das Icon einer Notizen-Kategorie zurück
     * @param {string} categoryId - Kategorie-ID
     * @returns {string} Kategorie-Icon
     */
    getNoteCategoryIcon(categoryId) {
        return this.notes.categoryIcons[categoryId] || '📋';
    }
    
    /**
     * Gibt die Einträge einer Notizen-Kategorie zurück
     * @param {string} categoryId - Kategorie-ID
     * @returns {NoteEntry[]} Einträge der Kategorie
     */
    getNoteEntries(categoryId) {
        return this.notes.entries[categoryId] || [];
    }
    
    /**
     * Fügt eine neue Notizen-Kategorie hinzu
     * @param {string} name - Name der neuen Kategorie
     * @param {string} icon - Icon für die Kategorie (optional)
     * @returns {string|null} ID der neuen Kategorie oder null bei Fehler
     */
    addNoteCategory(name, icon = '📋') {
        if (!name || typeof name !== 'string') return null;
        
        // ID generieren (lowercase, Bindestriche statt Leerzeichen)
        const id = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9äöüß-]/g, '')
            .substring(0, 30);
        
        // categoryColors initialisieren falls nicht vorhanden
        if (!this.notes.categoryColors) {
            this.notes.categoryColors = {};
        }
        
        // Prüfen ob ID schon existiert
        if (this.notes.entries[id]) {
            // Suffix anhängen
            let counter = 2;
            let newId = `${id}-${counter}`;
            while (this.notes.entries[newId]) {
                counter++;
                newId = `${id}-${counter}`;
            }
            this.notes.categories.push(newId);
            this.notes.categoryNames[newId] = name;
            this.notes.categoryIcons[newId] = icon;
            this.notes.categoryColors[newId] = null;
            this.notes.entries[newId] = [];
            this._notifyChange();
            return newId;
        }
        
        this.notes.categories.push(id);
        this.notes.categoryNames[id] = name;
        this.notes.categoryIcons[id] = icon;
        this.notes.categoryColors[id] = null;
        this.notes.entries[id] = [];
        this._notifyChange();
        return id;
    }
    
    /**
     * Entfernt eine Notizen-Kategorie
     * @param {string} categoryId - ID der zu entfernenden Kategorie
     * @returns {boolean} True bei Erfolg
     */
    removeNoteCategory(categoryId) {
        // Mindestens eine Kategorie muss bleiben
        if (this.notes.categories.length <= 1) return false;
        if (!this.notes.entries[categoryId]) return false;
        
        // Kategorie entfernen
        delete this.notes.entries[categoryId];
        delete this.notes.categoryNames[categoryId];
        delete this.notes.categoryIcons[categoryId];
        if (this.notes.categoryColors) {
            delete this.notes.categoryColors[categoryId];
        }
        this.notes.categories = this.notes.categories.filter(id => id !== categoryId);
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Benennt eine Notizen-Kategorie um
     * @param {string} categoryId - ID der Kategorie
     * @param {string} newName - Neuer Name
     * @returns {boolean} True bei Erfolg
     */
    renameNoteCategory(categoryId, newName) {
        if (!this.notes.categoryNames[categoryId]) return false;
        if (!newName || typeof newName !== 'string') return false;
        
        this.notes.categoryNames[categoryId] = newName;
        this._notifyChange();
        return true;
    }
    
    /**
     * Ändert das Icon einer Notizen-Kategorie
     * @param {string} categoryId - ID der Kategorie
     * @param {string} newIcon - Neues Icon
     * @returns {boolean} True bei Erfolg
     */
    changeNoteCategoryIcon(categoryId, newIcon) {
        if (!this.notes.categoryIcons[categoryId]) return false;
        if (!newIcon || typeof newIcon !== 'string') return false;
        
        this.notes.categoryIcons[categoryId] = newIcon;
        this._notifyChange();
        return true;
    }
    
    /**
     * Ändert die Reihenfolge der Notiz-Einträge innerhalb einer Kategorie
     * @param {string} category - Kategorie-ID
     * @param {number} fromIndex - Ursprünglicher Index
     * @param {number} toIndex - Ziel-Index
     * @returns {boolean} True bei Erfolg
     */
    reorderNotes(category, fromIndex, toIndex) {
        if (!this.notes.entries[category]) return false;
        const entries = this.notes.entries[category];
        if (fromIndex < 0 || fromIndex >= entries.length) return false;
        if (toIndex < 0 || toIndex >= entries.length) return false;
        
        const [entry] = entries.splice(fromIndex, 1);
        entries.splice(toIndex, 0, entry);
        
        this._notifyChange();
        return true;
    }
    
    /**
     * Setzt die Hintergrundfarbe einer Notizen-Kategorie
     * @param {string} categoryId - ID der Kategorie
     * @param {number|null} hue - Hue-Wert (0-360) oder null zum Zurücksetzen
     * @returns {boolean} True bei Erfolg
     */
    setNoteCategoryColor(categoryId, hue) {
        if (!this.notes.entries[categoryId]) return false;
        
        // categoryColors initialisieren falls nicht vorhanden
        if (!this.notes.categoryColors) {
            this.notes.categoryColors = {};
        }
        
        this.notes.categoryColors[categoryId] = hue;
        this._notifyChange();
        return true;
    }
    
    /**
     * Gibt die Hintergrundfarbe einer Notizen-Kategorie zurück
     * @param {string} categoryId - ID der Kategorie
     * @returns {number|null} Hue-Wert oder null
     */
    getNoteCategoryColor(categoryId) {
        if (!this.notes.categoryColors) return null;
        return this.notes.categoryColors[categoryId] ?? null;
    }
    
    /**
     * Setzt die Hintergrundfarbe eines einzelnen Notiz-Eintrags
     * @param {string} category - Kategorie-ID
     * @param {number} index - Index des Eintrags
     * @param {number|null} hue - Hue-Wert (0-360) oder null zum Zurücksetzen
     * @returns {boolean} True bei Erfolg
     */
    setNoteEntryColor(category, index, hue) {
        if (!this.notes.entries[category]) return false;
        if (index < 0 || index >= this.notes.entries[category].length) return false;
        
        this.notes.entries[category][index].hue = hue;
        this._notifyChange();
        return true;
    }
    
    /**
     * Gibt die effektive Hintergrundfarbe eines Eintrags zurück
     * (Eintrag-Farbe > Kategorie-Farbe > null)
     * @param {string} category - Kategorie-ID
     * @param {number} index - Index des Eintrags
     * @returns {number|null} Effektiver Hue-Wert oder null
     */
    getEffectiveNoteColor(category, index) {
        if (!this.notes.entries[category]) return null;
        if (index < 0 || index >= this.notes.entries[category].length) return null;
        
        const entry = this.notes.entries[category][index];
        
        // Eintrag-Farbe hat Vorrang
        if (entry.hue !== null && entry.hue !== undefined) {
            return entry.hue;
        }
        
        // Sonst Kategorie-Farbe
        return this.getNoteCategoryColor(category);
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
            range: 'Nah',
            attackCategory: 'Physisch',
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
     * @param {Object} data - Neue Daten { name, type, damage, range, attackCategory, effect }
     */
    updateAttack(index, data) {
        if (index >= 0 && index < this.attacks.length) {
            const attack = this.attacks[index];
            if (data.name !== undefined) attack.name = data.name;
            if (data.type !== undefined) attack.type = data.type;
            if (data.damage !== undefined) attack.damage = data.damage;
            if (data.range !== undefined) attack.range = data.range;
            if (data.attackCategory !== undefined) attack.attackCategory = data.attackCategory;
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
            height: this.height,
            weight: this.weight,
            playedBy: this.playedBy,
            background: this.background,
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
            statusEffects: this.statusEffects || [],
            luckTokens: this.luckTokens,
            maxLuckTokens: this.maxLuckTokens,
            money: this.money,
            manualOverrides: this.manualOverrides,
            skillValues: this.skillValues,
            customSkills: this.customSkills || { 'KÖ': [], 'WI': [], 'CH': [], 'GL': [] },
            pokemonSlots: this.pokemonSlots.map(slot => slot.toJSON()),
            inventory: {
                categories: this.inventory.categories,
                categoryNames: this.inventory.categoryNames,
                items: Object.fromEntries(
                    Object.entries(this.inventory.items).map(([cat, items]) => [
                        cat,
                        items.map(item => item.toJSON())
                    ])
                )
            },
            notes: {
                categories: this.notes.categories,
                categoryNames: this.notes.categoryNames,
                categoryIcons: this.notes.categoryIcons,
                categoryColors: this.notes.categoryColors || {},
                entries: Object.fromEntries(
                    Object.entries(this.notes.entries).map(([cat, entries]) => [
                        cat,
                        entries.map(entry => entry.toJSON())
                    ])
                )
            },
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
        this.height = data.height || '';
        this.weight = data.weight || '';
        this.playedBy = data.playedBy || '';
        this.background = data.background || '';
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
        this.statusEffects = data.statusEffects || [];
        
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
        
        // Benutzerdefinierte Fertigkeiten
        if (data.customSkills && typeof data.customSkills === 'object') {
            this.customSkills = {
                'KÖ': data.customSkills['KÖ'] || [],
                'WI': data.customSkills['WI'] || [],
                'CH': data.customSkills['CH'] || [],
                'GL': data.customSkills['GL'] || []
            };
        }
        
        // Pokemon-Slots
        if (data.pokemonSlots && Array.isArray(data.pokemonSlots)) {
            this.pokemonSlots = data.pokemonSlots.map((slotData, index) => {
                const slot = new PokemonSlot(index);
                slot.fromJSON(slotData);
                return slot;
            });
        }
        
        // Inventar (mit Migration von altem Format)
        if (data.inventory) {
            // Prüfen ob altes Format (Array) oder neues Format (Object)
            if (Array.isArray(data.inventory)) {
                // MIGRATION: Altes flaches Array -> Neue kategorisierte Struktur
                const defaults = this.getDefaultInventoryCategories();
                this.inventory = {
                    categories: defaults.categories,
                    categoryNames: defaults.categoryNames,
                    items: {
                        'items': data.inventory.map(itemData => {
                            const item = new InventoryItem();
                            item.fromJSON(itemData);
                            return item;
                        }),
                        'schluessel-items': [],
                        'pokeballs': [],
                        'medizin': [],
                        'sonstiges': []
                    }
                };
                // Mindestens ein Item in der Items-Kategorie
                if (this.inventory.items['items'].length === 0) {
                    this.inventory.items['items'].push(new InventoryItem());
                }
            } else if (data.inventory.categories && data.inventory.items) {
                // Neues Format laden
                this.inventory = {
                    categories: data.inventory.categories || ['items'],
                    categoryNames: data.inventory.categoryNames || { 'items': 'Items' },
                    items: {}
                };
                
                // Items pro Kategorie laden
                for (const categoryId of this.inventory.categories) {
                    const categoryItems = data.inventory.items[categoryId] || [];
                    this.inventory.items[categoryId] = categoryItems.map(itemData => {
                        const item = new InventoryItem();
                        item.fromJSON(itemData);
                        return item;
                    });
                }
                
                // Sicherstellen dass 'items' Kategorie existiert
                if (!this.inventory.categories.includes('items')) {
                    this.inventory.categories.unshift('items');
                    this.inventory.categoryNames['items'] = 'Items';
                    this.inventory.items['items'] = [];
                }
                
                // Mindestens ein Item in der Items-Kategorie wenn alles leer
                const totalItems = Object.values(this.inventory.items).flat().length;
                if (totalItems === 0) {
                    this.inventory.items['items'].push(new InventoryItem());
                }
            }
        }
        
        // Notizen
        if (data.notes && typeof data.notes === 'object') {
            // Neues Format mit dynamischen Kategorien
            if (data.notes.categories && data.notes.entries) {
                this.notes = {
                    categories: data.notes.categories || ['personen', 'orte', 'sonstiges'],
                    categoryNames: data.notes.categoryNames || {
                        'personen': 'Personen',
                        'orte': 'Orte',
                        'sonstiges': 'Sonstiges'
                    },
                    categoryIcons: data.notes.categoryIcons || {
                        'personen': '👤',
                        'orte': '📍',
                        'sonstiges': '📝'
                    },
                    categoryColors: data.notes.categoryColors || {},
                    entries: {}
                };
                
                // Einträge für jede Kategorie laden
                for (const categoryId of this.notes.categories) {
                    const categoryEntries = data.notes.entries[categoryId] || [];
                    this.notes.entries[categoryId] = categoryEntries.map(entryData => {
                        const entry = new NoteEntry(categoryId);
                        entry.fromJSON(entryData);
                        return entry;
                    });
                    
                    // categoryColors für neue Kategorien initialisieren
                    if (this.notes.categoryColors[categoryId] === undefined) {
                        this.notes.categoryColors[categoryId] = null;
                    }
                }
                
                // Sicherstellen, dass Standard-Kategorien Icons haben
                if (!this.notes.categoryIcons['personen']) this.notes.categoryIcons['personen'] = '👤';
                if (!this.notes.categoryIcons['orte']) this.notes.categoryIcons['orte'] = '📍';
                if (!this.notes.categoryIcons['sonstiges']) this.notes.categoryIcons['sonstiges'] = '📝';
                
            } else {
                // Altes Format - Migration zur neuen Struktur
                this.notes = {
                    categories: ['personen', 'orte', 'sonstiges'],
                    categoryNames: {
                        'personen': 'Personen',
                        'orte': 'Orte',
                        'sonstiges': 'Sonstiges'
                    },
                    categoryIcons: {
                        'personen': '👤',
                        'orte': '📍',
                        'sonstiges': '📝'
                    },
                    categoryColors: {
                        'personen': null,
                        'orte': null,
                        'sonstiges': null
                    },
                    entries: {
                        'personen': [],
                        'orte': [],
                        'sonstiges': []
                    }
                };
                
                ['personen', 'orte', 'sonstiges'].forEach(category => {
                    if (data.notes[category] && Array.isArray(data.notes[category])) {
                        this.notes.entries[category] = data.notes[category].map(entryData => {
                            const entry = new NoteEntry(category);
                            entry.fromJSON(entryData);
                            return entry;
                        });
                    }
                    // Mindestens ein Eintrag pro Kategorie
                    if (this.notes.entries[category].length === 0) {
                        this.notes.entries[category].push(new NoteEntry(category));
                    }
                });
            }
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
 * Klasse für einen Notiz-Eintrag
 */
class NoteEntry {
    constructor(type = 'personen') {
        this.type = type; // 'personen', 'orte', 'sonstiges', oder benutzerdefiniert
        this.hue = null;  // Benutzerdefinierte Hintergrundfarbe (0-360), null = Standard
        
        // Felder basierend auf Typ initialisieren
        if (type === 'personen') {
            this.name = '';
            this.rolle = '';
            this.notizen = '';
        } else if (type === 'orte') {
            this.name = '';
            this.notizen = '';
        } else if (type === 'sonstiges') {
            this.ueberschrift = '';
            this.notizen = '';
        } else {
            // Benutzerdefinierte Kategorie
            this.ueberschrift = '';
            this.notizen = '';
        }
    }
    
    /**
     * Serialisiert den Eintrag zu JSON
     * @returns {Object} JSON-Repräsentation
     */
    toJSON() {
        const base = { type: this.type, hue: this.hue };
        
        if (this.type === 'personen') {
            return { ...base, name: this.name, rolle: this.rolle, notizen: this.notizen };
        } else if (this.type === 'orte') {
            return { ...base, name: this.name, notizen: this.notizen };
        } else if (this.type === 'sonstiges') {
            return { ...base, ueberschrift: this.ueberschrift, notizen: this.notizen };
        }
        // Benutzerdefinierte Kategorie
        return { ...base, ueberschrift: this.ueberschrift || '', name: this.name || '', notizen: this.notizen };
    }
    
    /**
     * Lädt Daten aus JSON
     * @param {Object} data - Die zu ladenden Daten
     */
    fromJSON(data) {
        this.type = data.type || 'personen';
        this.hue = data.hue !== undefined ? data.hue : null;
        
        if (this.type === 'personen') {
            this.name = data.name || '';
            this.rolle = data.rolle || '';
            this.notizen = data.notizen || '';
        } else if (this.type === 'orte') {
            this.name = data.name || '';
            this.notizen = data.notizen || '';
        } else if (this.type === 'sonstiges') {
            this.ueberschrift = data.ueberschrift || '';
            this.notizen = data.notizen || '';
        } else {
            // Benutzerdefinierte Kategorie
            this.ueberschrift = data.ueberschrift || '';
            this.name = data.name || '';
            this.notizen = data.notizen || '';
        }
    }
}


/**
 * Klasse für einen Pokemon-Slot im Trainer-Team
 * Mit UUID für stabile Speicherung unabhängig von Slot-Position
 */
class PokemonSlot {
    constructor(index) {
        this.index = index;
        this.pokemonId = null;
        this.pokemonUuid = null;  // Stabile UUID für Storage
        this.pokemonName = null;
        this.germanName = null;
        this.nickname = '';
        this.spriteUrl = '';
        this.shinySpriteUrl = '';  // Shiny-Sprite-URL
        this.types = [];
    }
    
    /**
     * Generiert eine eindeutige UUID für das Pokemon
     * @returns {string} Die generierte UUID
     */
    generateUuid() {
        this.pokemonUuid = 'pkmn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return this.pokemonUuid;
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
     * @returns {string|null} Die alte UUID (für Storage-Löschung)
     */
    clear() {
        const oldUuid = this.pokemonUuid;
        this.pokemonId = null;
        this.pokemonUuid = null;
        this.pokemonName = null;
        this.germanName = null;
        this.nickname = '';
        this.spriteUrl = '';
        this.shinySpriteUrl = '';
        this.types = [];
        return oldUuid;
    }
    
    /**
     * Serialisiert den Slot zu JSON
     * @returns {Object} JSON-Repräsentation
     */
    toJSON() {
        return {
            index: this.index,
            pokemonId: this.pokemonId,
            pokemonUuid: this.pokemonUuid,
            pokemonName: this.pokemonName,
            germanName: this.germanName,
            nickname: this.nickname,
            spriteUrl: this.spriteUrl,
            shinySpriteUrl: this.shinySpriteUrl,
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
        this.pokemonUuid = data.pokemonUuid || null;
        this.pokemonName = data.pokemonName || null;
        this.germanName = data.germanName || null;
        this.nickname = data.nickname || '';
        this.spriteUrl = data.spriteUrl || '';
        this.shinySpriteUrl = data.shinySpriteUrl || '';
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