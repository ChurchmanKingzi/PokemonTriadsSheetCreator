/**
 * PokemonStorageService
 * ======================
 * Einzige Quelle für das Speichern und Laden von Pokemon-Charakterbögen.
 * 
 * DESIGN-PRINZIPIEN:
 * 1. Jedes Pokemon wird durch eine UUID identifiziert (NICHT durch Position!)
 * 2. Storage-Key-Format: "{trainerId}_pokemon_{pokemonUuid}"
 * 3. UUIDs werden einmal generiert und ändern sich NIEMALS
 * 4. Position im Team ist irrelevant für die Persistenz
 * 
 * WICHTIG: Die UUID ist die EINZIGE Verbindung zwischen einem Pokemon-Slot
 * und seinen gespeicherten Daten. Drag & Drop, Löschen, Umsortieren - 
 * nichts davon beeinflusst die UUID!
 */
class PokemonStorageService {
    constructor() {
        this.STORAGE_KEY = 'pokemon_character_sheets';
        this.AUTO_SAVE_DELAY = 500; // ms
        this._autoSaveTimer = null;
        
        // Aktueller Kontext für Auto-Save
        this._currentContext = null; // {trainerId, pokemonUuid}
        
        console.log('PokemonStorageService initialisiert (UUID-basiert)');
    }
    
    // ==================== KONTEXT-MANAGEMENT ====================
    
    /**
     * Setzt den aktuellen Kontext für Auto-Save.
     * WICHTIG: pokemonUuid muss eine echte UUID sein, KEIN Slot-Index!
     * 
     * @param {string} trainerId - ID des Trainers
     * @param {string} pokemonUuid - UUID des Pokemon (z.B. "pkmn_1701720000_abc123")
     */
    setContext(trainerId, pokemonUuid) {
        // Validierung: UUID muss ein String sein, kein Number
        if (typeof pokemonUuid === 'number') {
            console.error('StorageService.setContext: pokemonUuid ist eine Zahl! Das ist falsch - es muss eine UUID sein.');
            console.error('Aufrufer übergibt wahrscheinlich einen slotIndex statt einer UUID.');
            return;
        }
        
        if (!trainerId || !pokemonUuid) {
            console.warn('StorageService.setContext: Ungültige Parameter', { trainerId, pokemonUuid });
            return;
        }
        
        this._currentContext = { trainerId, pokemonUuid };
        console.log(`StorageService: Kontext gesetzt - Trainer: ${trainerId}, Pokemon-UUID: ${pokemonUuid}`);
    }
    
    /**
     * Löscht den aktuellen Kontext
     */
    clearContext() {
        this._currentContext = null;
    }
    
    /**
     * Gibt den aktuellen Kontext zurück
     * @returns {{trainerId: string, pokemonUuid: string}|null}
     */
    getContext() {
        return this._currentContext;
    }
    
    // ==================== KERN-API ====================
    
    /**
     * Speichert Pokemon-Daten.
     * 
     * @param {string} trainerId - ID des Trainers
     * @param {string} pokemonUuid - UUID des Pokemon
     * @param {Object} pokemonData - Die zu speichernden Daten
     * @returns {boolean} Erfolg
     */
    save(trainerId, pokemonUuid, pokemonData) {
        // Validierung
        if (!trainerId || !pokemonUuid) {
            console.error('StorageService.save: trainerId und pokemonUuid sind erforderlich');
            return false;
        }
        
        if (typeof pokemonUuid === 'number') {
            console.error('StorageService.save: pokemonUuid ist eine Zahl! UUID erwartet.');
            return false;
        }
        
        if (!pokemonData || !pokemonData.pokemonId) {
            console.error('StorageService.save: Keine gültigen Pokemon-Daten (pokemonId fehlt)');
            return false;
        }
        
        try {
            const key = this._makeKey(trainerId, pokemonUuid);
            const sheets = this._loadAllSheets();
            
            // Daten mit Metadaten anreichern
            sheets[key] = {
                ...pokemonData,
                _meta: {
                    trainerId: trainerId,
                    pokemonUuid: pokemonUuid,
                    savedAt: new Date().toISOString()
                }
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
            
            console.log(`StorageService: Gespeichert - ${pokemonData.pokemonGermanName || pokemonData.pokemonName} (UUID: ${pokemonUuid})`);
            return true;
        } catch (error) {
            console.error('StorageService.save: Fehler', error);
            return false;
        }
    }
    
    /**
     * Lädt Pokemon-Daten.
     * 
     * @param {string} trainerId - ID des Trainers
     * @param {string} pokemonUuid - UUID des Pokemon
     * @returns {Object|null} Die Pokemon-Daten oder null
     */
    load(trainerId, pokemonUuid) {
        if (!trainerId || !pokemonUuid) {
            console.warn('StorageService.load: trainerId und pokemonUuid sind erforderlich');
            return null;
        }
        
        if (typeof pokemonUuid === 'number') {
            console.error('StorageService.load: pokemonUuid ist eine Zahl! UUID erwartet.');
            return null;
        }
        
        try {
            const key = this._makeKey(trainerId, pokemonUuid);
            const sheets = this._loadAllSheets();
            
            if (sheets[key]) {
                console.log(`StorageService: Geladen - UUID ${pokemonUuid}`);
                return sheets[key];
            }
            
            console.log(`StorageService: Keine Daten für UUID ${pokemonUuid}`);
            return null;
        } catch (error) {
            console.error('StorageService.load: Fehler', error);
            return null;
        }
    }
    
    /**
     * Löscht Pokemon-Daten.
     * 
     * @param {string} trainerId - ID des Trainers
     * @param {string} pokemonUuid - UUID des Pokemon
     * @returns {boolean} Erfolg
     */
    delete(trainerId, pokemonUuid) {
        if (!trainerId || !pokemonUuid) {
            return false;
        }
        
        try {
            const key = this._makeKey(trainerId, pokemonUuid);
            const sheets = this._loadAllSheets();
            
            if (sheets[key]) {
                delete sheets[key];
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
                console.log(`StorageService: Gelöscht - UUID ${pokemonUuid}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('StorageService.delete: Fehler', error);
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
                customDescription: move.customDescription || ''
            };
        });
        
        // Textfeld-Werte aus dem DOM lesen
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
            
            // Stat-Auswahl für Level-Up
            primaryStatChoice: appState.primaryStatChoice || 'hp',
            secondaryStatChoice: appState.secondaryStatChoice || 'speed',
            
            // Fertigkeiten
            skillValues: { ...appState.skillValues },
            
            // Attacken
            moves: movesData,
            
            // Fähigkeiten
            abilities: appState.abilities ? [...appState.abilities] : [],
            
            // Wunden
            wounds: appState.wounds || 0,
            
            // Statuseffekte
            statusEffects: appState.statusEffects || [],
            
            // Temporäre Stat-Modifikatoren
            tempStatModifiers: appState.tempStatModifiers ? { ...appState.tempStatModifiers } : {
                attack: 0,
                defense: 0,
                spAttack: 0,
                spDefense: 0
            },
            
            // Freundschaft
            tallyMarks: appState.tallyMarks ? [...appState.tallyMarks] : [],
            
            // Benutzerdefinierte Fertigkeiten
            customSkills: appState.customSkills ? JSON.parse(JSON.stringify(appState.customSkills)) : {
                'KÖ': [], 'WI': [], 'CH': [], 'GL': []
            },
            
            // Benutzerdefinierte Würfelklasse (null = automatisch berechnet)
            customDiceClass: appState.customDiceClass || null,
            
            // Textfelder
            textFields: textFields
        };
    }
    
    /**
     * Speichert das aktuelle Pokemon mit dem gesetzten Kontext
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
            this._currentContext.pokemonUuid,
            data
        );
    }
    
    /**
     * Triggert Auto-Save mit Verzögerung (debounced)
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
     * @private
     */
    _makeKey(trainerId, pokemonUuid) {
        return `${trainerId}_pokemon_${pokemonUuid}`;
    }
    
    /**
     * Lädt alle gespeicherten Sheets
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
     * @returns {Object} Objekt mit pokemonUuid => pokemonData
     */
    getAllPokemonForTrainer(trainerId) {
        const sheets = this._loadAllSheets();
        const result = {};
        const prefix = `${trainerId}_pokemon_`;
        
        for (const [key, data] of Object.entries(sheets)) {
            if (key.startsWith(prefix)) {
                const uuid = key.substring(prefix.length);
                result[uuid] = data;
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
        const prefix = `${trainerId}_pokemon_`;
        
        for (const key of Object.keys(sheets)) {
            if (key.startsWith(prefix)) {
                delete sheets[key];
                count++;
            }
        }
        
        if (count > 0) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
            console.log(`StorageService: ${count} Pokemon für Trainer ${trainerId} gelöscht`);
        }
        
        return count;
    }
    
    /**
     * Kopiert Pokemon-Daten zu einer neuen UUID
     * (Nützlich für Trainer-Duplizierung)
     */
    copyPokemon(fromTrainerId, fromUuid, toTrainerId, toUuid) {
        const data = this.load(fromTrainerId, fromUuid);
        if (!data) return false;
        
        // Neue Metadaten setzen
        const newData = {
            ...data,
            _meta: {
                trainerId: toTrainerId,
                pokemonUuid: toUuid,
                savedAt: new Date().toISOString(),
                copiedFrom: fromUuid
            }
        };
        
        return this.save(toTrainerId, toUuid, newData);
    }
    
    // ==================== EXPORT/IMPORT ====================
    
    /**
     * Exportiert alle Pokemon-Daten
     */
    exportAll() {
        return this._loadAllSheets();
    }
    
    /**
     * Importiert Pokemon-Daten
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
            // Nur gültige Keys akzeptieren (Format: trainerId_pokemon_uuid)
            if (key.includes('_pokemon_') && data && data.pokemonId) {
                existing[key] = data;
                count++;
            }
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
        return count;
    }
    
    /**
     * Löscht ALLE gespeicherten Pokemon-Daten
     */
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('StorageService: Alle Pokemon-Daten gelöscht');
    }
    
    // ==================== DEBUG ====================
    
    /**
     * Gibt Debug-Informationen aus
     */
    debug() {
        const sheets = this._loadAllSheets();
        console.log('=== StorageService Debug ===');
        console.log('Aktueller Kontext:', this._currentContext);
        console.log('Anzahl gespeicherter Pokemon:', Object.keys(sheets).length);
        console.log('Keys:', Object.keys(sheets));
        console.log('============================');
        return sheets;
    }
}

// Global verfügbar machen
window.pokemonStorageService = new PokemonStorageService();

console.log('PokemonStorageService wurde global als window.pokemonStorageService initialisiert.');