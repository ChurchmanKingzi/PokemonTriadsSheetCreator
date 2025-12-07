/**
 * JSONExportService zur Verwaltung des JSON-Exports
 * 
 * Unterstützt:
 * - Export des aktuellen Sheets (Trainer ODER Pokemon)
 * - Export aller Daten als separate JSON-Dateien
 */
class JSONExportService {
    constructor() {
        console.log('JSON Export Service initialisiert');
    }
    
    // ==================== EINZELNE SHEETS EXPORTIEREN ====================
    
    /**
     * Exportiert das aktuell geöffnete Sheet (Trainer oder Pokemon)
     * Je nach aktiver Ansicht wird entweder der Trainer oder das Pokemon exportiert
     */
    exportCurrentSheet() {
        const currentView = window.navigationService?.getCurrentView() || 'trainer';
        
        if (currentView === 'pokemon') {
            this._exportCurrentPokemon();
        } else {
            this._exportCurrentTrainer();
        }
    }
    
    /**
     * Exportiert nur den aktuellen Trainer (ohne Pokemon)
     * @private
     */
    _exportCurrentTrainer() {
        const trainer = this._getActiveTrainer();
        if (!trainer) {
            this._showToast('Kein Trainer gefunden.', 'error');
            return;
        }
        
        try {
            const trainerData = this._gatherTrainerData(trainer);
            const jsonString = JSON.stringify(trainerData, null, 2);
            const fileName = `Trainer_${trainer.name || 'Unbenannt'}_${this._getDateString()}.json`;
            
            this._downloadJSON(jsonString, fileName);
            this._showToast('Trainer-Sheet erfolgreich exportiert', 'success');
        } catch (error) {
            console.error('Fehler beim Exportieren des Trainers:', error);
            this._showToast('Fehler beim Exportieren des Trainers', 'error');
        }
    }
    
    /**
     * Exportiert nur das aktuell geöffnete Pokemon
     * @private
     */
    _exportCurrentPokemon() {
        const appState = window.pokemonApp?.appState;
        if (!appState?.pokemonData) {
            this._showToast('Bitte wähle zuerst ein Pokémon aus.', 'error');
            return;
        }
        
        try {
            // Aktuellen Stand speichern
            if (window.pokemonStorageService) {
                window.pokemonStorageService.saveCurrentPokemon();
            }
            
            const pokemonData = this._gatherCurrentPokemonData();
            if (!pokemonData) {
                this._showToast('Fehler beim Sammeln der Pokemon-Daten.', 'error');
                return;
            }
            
            const jsonString = JSON.stringify(pokemonData, null, 2);
            const pokemonName = pokemonData.pokemonGermanName || pokemonData.pokemonName || 'Pokemon';
            const fileName = `Pokemon_${pokemonName}_Lv${pokemonData.level}_${this._getDateString()}.json`;
            
            this._downloadJSON(jsonString, fileName);
            this._showToast('Pokémon-Sheet erfolgreich exportiert', 'success');
        } catch (error) {
            console.error('Fehler beim Exportieren des Pokemons:', error);
            this._showToast('Fehler beim Exportieren des Pokemons', 'error');
        }
    }
    
    // ==================== ALLES EXPORTIEREN ====================
    
    /**
     * Exportiert ALLE Daten als separate JSON-Dateien:
     * - Eine Datei für den Trainer
     * - Eine Datei für jedes Pokemon im Team
     */
    exportAllData() {
        const trainer = this._getActiveTrainer();
        if (!trainer) {
            this._showToast('Kein Trainer gefunden.', 'error');
            return;
        }
        
        try {
            // Aktuellen Stand speichern, falls im Pokemon-View
            if (window.navigationService?.getCurrentView() === 'pokemon' && window.pokemonStorageService) {
                window.pokemonStorageService.saveCurrentPokemon();
            }
            
            const filesToDownload = [];
            
            // 1. Trainer-Daten sammeln und hinzufügen
            const trainerData = this._gatherTrainerData(trainer);
            filesToDownload.push({
                data: trainerData,
                fileName: `Trainer_${trainer.name || 'Unbenannt'}_${this._getDateString()}.json`
            });
            
            // 2. Alle Pokemon des Trainers sammeln
            const pokemonCount = this._addPokemonFiles(trainer, filesToDownload);
            
            // 3. Alle Dateien nacheinander herunterladen
            this._downloadMultipleFiles(filesToDownload);
            
            const totalFiles = 1 + pokemonCount;
            this._showToast(`${totalFiles} Datei(en) werden heruntergeladen (1 Trainer + ${pokemonCount} Pokémon)`, 'success');
            
        } catch (error) {
            console.error('Fehler beim Exportieren aller Daten:', error);
            this._showToast('Fehler beim Exportieren der Daten', 'error');
        }
    }
    
    /**
     * Fügt alle Pokemon-Dateien zur Download-Liste hinzu
     * @param {TrainerState} trainer - Der Trainer
     * @param {Array} filesToDownload - Liste der zu downloadenden Dateien
     * @returns {number} Anzahl der hinzugefügten Pokemon
     * @private
     */
    _addPokemonFiles(trainer, filesToDownload) {
        let pokemonCount = 0;
        
        trainer.pokemonSlots.forEach((slot, index) => {
            if (slot.isEmpty()) return;
            
            // Pokemon-Daten aus dem Storage laden
            let pokemonData = null;
            
            if (window.pokemonStorageService && slot.pokemonUuid) {
                pokemonData = window.pokemonStorageService.load(trainer.id, slot.pokemonUuid);
            }
            
            if (pokemonData) {
                // Daten mit Slot-Info anreichern
                pokemonData.slotIndex = index;
                pokemonData.timestamp = new Date().toISOString();
                pokemonData.exportType = 'pokemon_single';
                
                const pokemonName = pokemonData.pokemonGermanName || pokemonData.pokemonName || `Pokemon_${index + 1}`;
                const level = pokemonData.level || 1;
                
                filesToDownload.push({
                    data: pokemonData,
                    fileName: `Pokemon_${pokemonName}_Lv${level}_${this._getDateString()}.json`
                });
                
                pokemonCount++;
            } else {
                // Nur Basis-Informationen aus dem Slot verfügbar
                const basicData = {
                    pokemonId: slot.pokemonId,
                    pokemonName: slot.pokemonName,
                    pokemonGermanName: slot.germanName,
                    nickname: slot.nickname,
                    types: slot.types,
                    slotIndex: index,
                    level: 1,
                    timestamp: new Date().toISOString(),
                    exportType: 'pokemon_single',
                    note: 'Nur Basis-Informationen verfügbar - Pokemon war noch nicht vollständig geladen.'
                };
                
                const pokemonName = slot.germanName || slot.pokemonName || `Pokemon_${index + 1}`;
                
                filesToDownload.push({
                    data: basicData,
                    fileName: `Pokemon_${pokemonName}_Basic_${this._getDateString()}.json`
                });
                
                pokemonCount++;
            }
        });
        
        return pokemonCount;
    }
    
    // ==================== DATEN SAMMELN ====================
    
    /**
     * Sammelt alle relevanten Trainer-Daten für den Export
     * @param {TrainerState} trainer - Der Trainer
     * @returns {Object} Die Trainer-Daten
     * @private
     */
    _gatherTrainerData(trainer) {
        const data = trainer._exportToJSON();
        
        // Export-Metadaten hinzufügen
        data.timestamp = new Date().toISOString();
        data.exportType = 'trainer_single';
        data.exportVersion = '4.0';
        
        // Pokemon-Slot-Übersicht (ohne volle Daten, nur Referenzen)
        data.pokemonSummary = trainer.pokemonSlots.map((slot, index) => ({
            slotIndex: index,
            pokemonId: slot.pokemonId,
            pokemonName: slot.pokemonName,
            germanName: slot.germanName,
            nickname: slot.nickname,
            pokemonUuid: slot.pokemonUuid,
            isEmpty: slot.isEmpty()
        }));
        
        return data;
    }
    
    /**
     * Sammelt die aktuellen Pokemon-Daten aus dem AppState
     * @returns {Object|null} Die Pokemon-Daten
     * @private
     */
    _gatherCurrentPokemonData() {
        // Zuerst versuchen, über den StorageService zu sammeln
        if (window.pokemonStorageService) {
            const data = window.pokemonStorageService.gatherCurrentPokemonData();
            if (data) {
                data.timestamp = new Date().toISOString();
                data.exportType = 'pokemon_single';
                data.exportVersion = '4.0';
                return data;
            }
        }
        
        // Fallback: Direkt aus AppState sammeln
        const appState = window.pokemonApp?.appState;
        if (!appState?.pokemonData) return null;
        
        // Moves mit benutzerdefinierten Beschreibungen
        const movesWithDescriptions = (appState.moves || []).map(move => {
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
        
        return {
            timestamp: new Date().toISOString(),
            exportType: 'pokemon_single',
            exportVersion: '4.0',
            pokemonId: appState.pokemonData.id,
            pokemonName: appState.selectedPokemon,
            pokemonGermanName: appState.pokemonData.germanName || '',
            types: appState.pokemonData.types || [],
            level: appState.level,
            currentExp: appState.currentExp || 0,
            stats: appState.stats,
            currentHp: appState.currentHp,
            gena: appState.gena,
            pa: appState.pa,
            bw: appState.bw || 0,
            primaryStatChoice: appState.primaryStatChoice || 'hp',
            secondaryStatChoice: appState.secondaryStatChoice || 'speed',
            skillValues: appState.skillValues,
            moves: movesWithDescriptions,
            abilities: appState.abilities,
            wounds: appState.wounds || 0,
            statusEffects: appState.statusEffects || [],
            tempStatModifiers: appState.tempStatModifiers || {},
            tallyMarks: appState.tallyMarks || [],
            customSkills: appState.customSkills || { 'KÖ': [], 'WI': [], 'CH': [], 'GL': [] },
            customDiceClass: appState.customDiceClass || null,
            textFields: {
                trainer: document.getElementById('trainer-input')?.value || '',
                nickname: document.getElementById('nickname-input')?.value || '',
                item: document.getElementById('item-input')?.value || ''
            }
        };
    }
    
    // ==================== DOWNLOAD-FUNKTIONEN ====================
    
    /**
     * Lädt mehrere JSON-Dateien nacheinander herunter
     * @param {Array} files - Array von {data, fileName} Objekten
     * @private
     */
    _downloadMultipleFiles(files) {
        // Kleine Verzögerung zwischen Downloads, damit der Browser nicht blockiert
        files.forEach((file, index) => {
            setTimeout(() => {
                const jsonString = JSON.stringify(file.data, null, 2);
                this._downloadJSON(jsonString, file.fileName);
            }, index * 300); // 300ms Verzögerung zwischen Downloads
        });
    }
    
    /**
     * Lädt eine JSON-Datei herunter
     * @param {string} jsonString - Der JSON-String
     * @param {string} filename - Der Dateiname
     * @private
     */
    _downloadJSON(jsonString, filename) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // ==================== HILFSMETHODEN ====================
    
    /**
     * Gibt den aktiven Trainer zurück
     * @returns {TrainerState|null}
     * @private
     */
    _getActiveTrainer() {
        return window.trainerManager 
            ? window.trainerManager.getActiveTrainer() 
            : window.trainerState;
    }
    
    /**
     * Gibt das aktuelle Datum als String zurück
     * @returns {string} Datum im Format YYYY-MM-DD
     * @private
     */
    _getDateString() {
        return new Date().toISOString().split('T')[0];
    }
    
    /**
     * Zeigt eine Toast-Benachrichtigung an
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {string} type - Der Typ der Nachricht ('success' oder 'error')
     * @private
     */
    _showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 4000);
    }
}

// Globale Instanz erstellen
window.jsonExportService = new JSONExportService();

console.log('JSONExportService wurde global als window.jsonExportService initialisiert.');