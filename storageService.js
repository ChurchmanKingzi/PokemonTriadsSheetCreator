/**
 * StorageService zur Verwaltung der Persistenz von Charakterbögen
 */
class StorageService {
    constructor(appState) {
        this.appState = appState;
        this.STORAGE_KEY = 'pokemon_character_sheets';
        
        // Migrationsservice initialisieren
        this._initMigration();
    }

    /**
     * Initialisiert die Migration von namensbasierten zu ID-basierten Charakterbögen
     * @private
     */
    _initMigration() {
        try {
            // Prüfen, ob bereits migriert wurde
            const migrated = localStorage.getItem('pokemon_storage_migrated');
            if (migrated === 'true') return;
            
            console.log('Starte Migration von namensbasierten zu ID-basierten Charakterbögen...');
            
            // Alle Sheets laden
            const sheets = this.loadAllSheets();
            const newSheets = {};
            let migrationNeeded = false;
            
            // Über alle Sheets iterieren
            Object.entries(sheets).forEach(([key, sheet]) => {
                // Prüfen, ob der Schlüssel ein Name ist (nicht numerisch)
                if (isNaN(parseInt(key))) {
                    migrationNeeded = true;
                    
                    // Wenn die Pokemon-ID vorhanden ist, als neuen Schlüssel verwenden
                    if (sheet.pokemonId) {
                        newSheets[sheet.pokemonId] = sheet;
                        console.log(`Migriert: ${key} -> ${sheet.pokemonId}`);
                    } else {
                        // Wenn keine ID vorhanden ist, den alten Schlüssel beibehalten
                        // (dieser Charakterbogen wird nach der Migration nicht mehr gefunden)
                        newSheets[key] = sheet;
                        console.log(`Konnte nicht migrieren: ${key} (keine ID gefunden)`);
                    }
                } else {
                    // Schlüssel ist bereits eine ID, unverändert übernehmen
                    newSheets[key] = sheet;
                }
            });
            
            // Nur speichern, wenn tatsächlich etwas migriert wurde
            if (migrationNeeded) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSheets));
                console.log('Migration abgeschlossen.');
            } else {
                console.log('Keine Migration erforderlich.');
            }
            
            // Migration als abgeschlossen markieren
            localStorage.setItem('pokemon_storage_migrated', 'true');
        } catch (error) {
            console.error('Fehler bei der Migration:', error);
        }
    }

    /**
     * Speichert den aktuellen Charakterbogen im localStorage
     */
    saveCurrentSheet() {
        if (!this.appState.pokemonData) {
            return false;
        }
    
        try {
            // Aktuelle Charakterbögen laden
            const sheets = this.loadAllSheets();
            
            // Eindeutige ID für den Charakterbogen ist die Pokemon-ID
            const id = this.appState.pokemonData.id;
            
            // Moves mit benutzerdefinierten Beschreibungen
            const movesWithDescriptions = this.appState.moves.map(move => {
                if (!move) return null;
                return {
                    name: move.name,
                    customDescription: move.customDescription || ''
                };
            });
            
            // Aktuelle Werte in ein Objekt packen
            const characterSheet = {
                id,
                timestamp: new Date().toISOString(),
                pokemonId: this.appState.pokemonData.id,
                pokemonName: this.appState.selectedPokemon,
                pokemonGermanName: this.appState.pokemonData.germanName || '',
                tallyMarks: this.appState.tallyMarks || [],
                level: this.appState.level,
                currentExp: this.appState.currentExp || 0,
                stats: this.appState.stats,
                currentHp: this.appState.currentHp,
                gena: this.appState.gena,
                pa: this.appState.pa,
                bw: this.appState.bw || 0,
                skillValues: this.appState.skillValues,
                moves: movesWithDescriptions, 
                abilities: this.appState.abilities,
                // Textfelder erfassen
                textFields: {
                    trainer: document.getElementById('trainer-input')?.value || '',
                    nickname: document.getElementById('nickname-input')?.value || '',
                    item: document.getElementById('item-input')?.value || ''
                }
            };
            
            // Vorhandene Daten aktualisieren oder neue anlegen
            // Schlüssel ist jetzt die Pokemon-ID
            sheets[id] = characterSheet;
            
            // In localStorage speichern
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern des Charakterbogens:', error);
            return false;
        }
    }

    /**
     * Lädt alle gespeicherten Charakterbögen aus dem localStorage
     * @returns {Object} Objekt mit allen gespeicherten Charakterbögen
     */
    loadAllSheets() {
        try {
            const storedData = localStorage.getItem(this.STORAGE_KEY);
            return storedData ? JSON.parse(storedData) : {};
        } catch (error) {
            console.error('Fehler beim Laden der Charakterbögen:', error);
            return {};
        }
    }

    /**
     * Lädt einen bestimmten Charakterbogen
     * @param {number} pokemonId - Die ID des Pokemon
     * @returns {Object|null} Der geladene Charakterbogen oder null bei Fehler
     */
    loadSheet(pokemonId) {
        try {
            const sheets = this.loadAllSheets();
            if (sheets[pokemonId]) {
                // Verzögerte Aktualisierung der Freundschaftspunkte-Anzeige
                if (sheets[pokemonId] && sheets[pokemonId].tallyMarks) {
                    setTimeout(() => {
                        console.log("Geladene Freundschaftspunkte:", sheets[pokemonId].tallyMarks);
                        this.appState.tallyMarks = sheets[pokemonId].tallyMarks;
                        if (typeof window.renderTallyMarks === 'function') {
                            window.renderTallyMarks(sheets[pokemonId].tallyMarks);
                        }
                    }, 500);
                }
                return sheets[pokemonId];
            }
            
            // Rückwärtskompatibilität: Bei Namen nach ID suchen
            // Dies ist ein Fallback für Charakterbögen, die vor der Migration gespeichert wurden
            for (const sheet of Object.values(sheets)) {
                if (sheet.pokemonId === pokemonId) {
                    // Verzögerte Aktualisierung der Freundschaftspunkte-Anzeige
                    if (sheet && sheet.tallyMarks) {
                        setTimeout(() => {
                            console.log("Geladene Freundschaftspunkte:", sheet.tallyMarks);
                            this.appState.tallyMarks = sheet.tallyMarks;
                            if (typeof window.renderTallyMarks === 'function') {
                                window.renderTallyMarks(sheet.tallyMarks);
                            }
                        }, 500);
                    }
                    return sheet;
                }
            }
            
            return null;
        } catch (error) {
            console.error(`Fehler beim Laden des Charakterbogens für ID ${pokemonId}:`, error);
            return null;
        }
    }

    /**
     * Löscht einen bestimmten Charakterbogen
     * @param {number} pokemonId - Die ID des Pokemon
     * @returns {boolean} True, wenn der Charakterbogen erfolgreich gelöscht wurde
     */
    deleteSheet(pokemonId) {
        try {
            const sheets = this.loadAllSheets();
            
            if (sheets[pokemonId]) {
                delete sheets[pokemonId];
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Fehler beim Löschen des Charakterbogens für ID ${pokemonId}:`, error);
            return false;
        }
    }

    /**
     * Löscht alle gespeicherten Charakterbögen
     * @returns {boolean} True, wenn alle Charakterbögen erfolgreich gelöscht wurden
     */
    clearAllSheets() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen aller Charakterbögen:', error);
            return false;
        }
    }
}