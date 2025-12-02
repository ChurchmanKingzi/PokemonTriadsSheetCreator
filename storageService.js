/**
 * PokemonStorageService
 * ======================
 * Einzige Quelle für das Speichern und Laden von Pokemon-Daten.
 * 
 * Storage-Key-Format: "{trainerId}_slot{slotIndex}"
 * z.B. "trainer_abc123_slot0"
 * 
 * DESIGN-PRINZIPIEN:
 * 1. Einfache, klare API: save(), load(), delete()
 * 2. Keine komplexen Fallbacks oder Legacy-Pfade
 * 3. Alle Daten werden immer vollständig gespeichert/geladen
 */
class PokemonStorageService {
    constructor() {
        this.STORAGE_KEY = 'pokemon_character_sheets';
        this.AUTO_SAVE_DELAY = 500; // ms
        this._autoSaveTimer = null;
        this._currentContext = null; // {trainerId, slotIndex}
        
        console.log('PokemonStorageService initialisiert');
    }
    
    // ==================== KONTEXT-MANAGEMENT ====================
    
    /**
     * Setzt den aktuellen Kontext für Auto-Save
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots
     */
    setContext(trainerId, slotIndex) {
        this._currentContext = { trainerId, slotIndex };
        console.log(`StorageService: Kontext gesetzt auf ${trainerId}_slot${slotIndex}`);
    }
    
    /**
     * Löscht den aktuellen Kontext
     */
    clearContext() {
        this._currentContext = null;
    }
    
    /**
     * Gibt den aktuellen Kontext zurück
     * @returns {{trainerId: string, slotIndex: number}|null}
     */
    getContext() {
        return this._currentContext;
    }
    
    // ==================== KERN-API ====================
    
    /**
     * Speichert Pokemon-Daten für einen bestimmten Trainer und Slot
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots
     * @param {Object} pokemonData - Die zu speichernden Pokemon-Daten
     * @returns {boolean} Erfolg
     */
    save(trainerId, slotIndex, pokemonData) {
        if (!trainerId || slotIndex === null || slotIndex === undefined) {
            console.error('StorageService.save: Ungültige Parameter', { trainerId, slotIndex });
            return false;
        }
        
        if (!pokemonData || !pokemonData.pokemonId) {
            console.error('StorageService.save: Keine gültigen Pokemon-Daten');
            return false;
        }
        
        try {
            const key = this._makeKey(trainerId, slotIndex);
            const sheets = this._loadAllSheets();
            
            // Daten mit Metadaten anreichern
            sheets[key] = {
                ...pokemonData,
                trainerId: trainerId,
                slotIndex: slotIndex,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
            
            console.log(`StorageService: Pokemon "${pokemonData.pokemonGermanName || pokemonData.pokemonName}" gespeichert als ${key}`);
            return true;
        } catch (error) {
            console.error('StorageService.save: Fehler beim Speichern', error);
            return false;
        }
    }
    
    /**
     * Lädt Pokemon-Daten für einen bestimmten Trainer und Slot
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots
     * @returns {Object|null} Die Pokemon-Daten oder null
     */
    load(trainerId, slotIndex) {
        if (!trainerId || slotIndex === null || slotIndex === undefined) {
            console.error('StorageService.load: Ungültige Parameter', { trainerId, slotIndex });
            return null;
        }
        
        try {
            const key = this._makeKey(trainerId, slotIndex);
            const sheets = this._loadAllSheets();
            
            if (sheets[key]) {
                console.log(`StorageService: Pokemon-Daten geladen für ${key}`);
                return sheets[key];
            }
            
            console.log(`StorageService: Keine Daten gefunden für ${key}`);
            return null;
        } catch (error) {
            console.error('StorageService.load: Fehler beim Laden', error);
            return null;
        }
    }
    
    /**
     * Löscht Pokemon-Daten für einen bestimmten Trainer und Slot
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots
     * @returns {boolean} Erfolg
     */
    delete(trainerId, slotIndex) {
        if (!trainerId || slotIndex === null || slotIndex === undefined) {
            return false;
        }
        
        try {
            const key = this._makeKey(trainerId, slotIndex);
            const sheets = this._loadAllSheets();
            
            if (sheets[key]) {
                delete sheets[key];
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
                console.log(`StorageService: Pokemon-Daten gelöscht für ${key}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('StorageService.delete: Fehler beim Löschen', error);
            return false;
        }
    }
    
    // ==================== AUTO-SAVE ====================
    
    /**
     * Sammelt die aktuellen Pokemon-Daten aus dem AppState und der UI
     * @returns {Object|null} Die gesammelten Daten oder null
     */
    gatherCurrentPokemonData() {
        const appState = window.pokemonApp?.appState;
        if (!appState || !appState.pokemonData) {
            return null;
        }
        
        // Moves mit benutzerdefinierten Beschreibungen sammeln
        const movesData = (appState.moves || []).map(move => {
            if (!move) return null;
            return {
                name: move.name,
                germanName: move.germanName,
                type: move.type,
                germanType: move.germanType,
                power: move.power,
                customDescription: move.customDescription || ''
            };
        });
        
        // Textfelder aus der UI sammeln
        const textFields = {
            trainer: document.getElementById('trainer-input')?.value || '',
            nickname: document.getElementById('nickname-input')?.value || '',
            item: document.getElementById('item-input')?.value || ''
        };
        
        return {
            // Pokemon-Identifikation
            pokemonId: appState.pokemonData.id,
            pokemonName: appState.selectedPokemon,
            pokemonGermanName: appState.pokemonData.germanName || '',
            types: appState.pokemonData.types || [],
            
            // Level & Erfahrung
            level: appState.level,
            currentExp: appState.currentExp || 0,
            
            // Stats
            stats: { ...appState.stats },
            currentHp: appState.currentHp,
            gena: appState.gena,
            pa: appState.pa,
            bw: appState.bw || 0,
            
            // Fertigkeiten
            skillValues: { ...appState.skillValues },
            
            // Attacken
            moves: movesData,
            
            // Fähigkeiten
            abilities: appState.abilities ? [...appState.abilities] : [],
            
            // Wunden
            wounds: appState.wounds || 0,
            
            // Freundschaft
            tallyMarks: appState.tallyMarks ? [...appState.tallyMarks] : [],
            
            // Textfelder
            textFields: textFields
        };
    }
    
    /**
     * Speichert die aktuellen Pokemon-Daten mit dem gesetzten Kontext
     * @returns {boolean} Erfolg
     */
    saveCurrentPokemon() {
        if (!this._currentContext) {
            console.warn('StorageService.saveCurrentPokemon: Kein Kontext gesetzt');
            return false;
        }
        
        const data = this.gatherCurrentPokemonData();
        if (!data) {
            console.warn('StorageService.saveCurrentPokemon: Keine Daten zum Speichern');
            return false;
        }
        
        return this.save(
            this._currentContext.trainerId,
            this._currentContext.slotIndex,
            data
        );
    }
    
    /**
     * Triggert Auto-Save mit Verzögerung (debounced)
     * Verhindert zu häufiges Speichern bei schnellen Änderungen
     */
    triggerAutoSave() {
        if (this._autoSaveTimer) {
            clearTimeout(this._autoSaveTimer);
        }
        
        this._autoSaveTimer = setTimeout(() => {
            this.saveCurrentPokemon();
            this._autoSaveTimer = null;
        }, this.AUTO_SAVE_DELAY);
    }
    
    // ==================== HILFSMETHODEN ====================
    
    /**
     * Erstellt einen Storage-Key
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Slots
     * @returns {string} Der Storage-Key
     * @private
     */
    _makeKey(trainerId, slotIndex) {
        return `${trainerId}_slot${slotIndex}`;
    }
    
    /**
     * Lädt alle gespeicherten Pokemon-Sheets
     * @returns {Object} Alle Sheets
     * @private
     */
    _loadAllSheets() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('StorageService._loadAllSheets: Fehler', error);
            return {};
        }
    }
    
    // ==================== TRAINER-BEZOGENE METHODEN ====================
    
    /**
     * Gibt alle Pokemon eines Trainers zurück
     * @param {string} trainerId - ID des Trainers
     * @returns {Object} Objekt mit slotIndex => pokemonData
     */
    getAllPokemonForTrainer(trainerId) {
        const sheets = this._loadAllSheets();
        const result = {};
        
        for (const [key, data] of Object.entries(sheets)) {
            if (key.startsWith(`${trainerId}_slot`)) {
                const match = key.match(/_slot(\d+)$/);
                if (match) {
                    result[parseInt(match[1], 10)] = data;
                }
            }
        }
        
        return result;
    }
    
    /**
     * Löscht alle Pokemon eines Trainers
     * @param {string} trainerId - ID des Trainers
     * @returns {number} Anzahl gelöschter Pokemon
     */
    deleteAllPokemonForTrainer(trainerId) {
        const sheets = this._loadAllSheets();
        let count = 0;
        
        for (const key of Object.keys(sheets)) {
            if (key.startsWith(`${trainerId}_slot`)) {
                delete sheets[key];
                count++;
            }
        }
        
        if (count > 0) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
        }
        
        return count;
    }
    
    /**
     * Kopiert Pokemon-Daten von einem Trainer/Slot zu einem anderen
     * @param {string} fromTrainerId - Quell-Trainer-ID
     * @param {number} fromSlotIndex - Quell-Slot-Index
     * @param {string} toTrainerId - Ziel-Trainer-ID
     * @param {number} toSlotIndex - Ziel-Slot-Index
     * @returns {boolean} Erfolg
     */
    copyPokemon(fromTrainerId, fromSlotIndex, toTrainerId, toSlotIndex) {
        const data = this.load(fromTrainerId, fromSlotIndex);
        if (!data) return false;
        
        // Daten mit neuen Kontext-Infos speichern
        return this.save(toTrainerId, toSlotIndex, {
            ...data,
            trainerId: toTrainerId,
            slotIndex: toSlotIndex
        });
    }
    
    /**
     * Verschiebt/tauscht Pokemon zwischen zwei Slots
     * @param {string} trainerId - Trainer-ID
     * @param {number} fromSlot - Quell-Slot
     * @param {number} toSlot - Ziel-Slot
     * @returns {boolean} Erfolg
     */
    swapPokemonSlots(trainerId, fromSlot, toSlot) {
        const fromData = this.load(trainerId, fromSlot);
        const toData = this.load(trainerId, toSlot);
        
        try {
            // Beide löschen
            this.delete(trainerId, fromSlot);
            this.delete(trainerId, toSlot);
            
            // In getauschter Reihenfolge speichern
            if (fromData) {
                this.save(trainerId, toSlot, { ...fromData, slotIndex: toSlot });
            }
            if (toData) {
                this.save(trainerId, fromSlot, { ...toData, slotIndex: fromSlot });
            }
            
            return true;
        } catch (error) {
            console.error('StorageService.swapPokemonSlots: Fehler', error);
            return false;
        }
    }
    
    // ==================== EXPORT/IMPORT ====================
    
    /**
     * Exportiert alle Pokemon-Daten
     * @returns {Object} Alle Pokemon-Sheets
     */
    exportAll() {
        return this._loadAllSheets();
    }
    
    /**
     * Importiert Pokemon-Daten (überschreibt vorhandene mit gleichen Keys)
     * @param {Object} sheets - Die zu importierenden Sheets
     * @returns {number} Anzahl importierter Pokemon
     */
    importAll(sheets) {
        if (!sheets || typeof sheets !== 'object') {
            return 0;
        }
        
        const existing = this._loadAllSheets();
        let count = 0;
        
        for (const [key, data] of Object.entries(sheets)) {
            if (key.includes('_slot') && data && data.pokemonId) {
                existing[key] = data;
                count++;
            }
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
        return count;
    }
    
    /**
     * Löscht alle gespeicherten Pokemon-Daten
     */
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('StorageService: Alle Pokemon-Daten gelöscht');
    }
}

// Global verfügbar machen
window.pokemonStorageService = new PokemonStorageService();

console.log('PokemonStorageService wurde global als window.pokemonStorageService initialisiert.');