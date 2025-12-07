/**
 * JSON Import Service für den Pokemon Charakterbogen
 * 
 * Unterstützt:
 * - Import von einzelnen Pokemon (pokemon_single)
 * - Import von einzelnen Trainern (trainer_single)
 * - Import von Legacy-Formaten (ältere Versionen)
 */
class JSONImportService {
    constructor() {
        // File Input für JSON-Upload erstellen
        this._createFileInput();
        
        // Event-Listener initialisieren
        this._initEventListeners();
        
        console.log('JSON Import Service initialisiert');
    }
    
    /**
     * Erstellt ein verstecktes File-Input Element für den JSON-Upload
     * @private
     */
    _createFileInput() {
        const existingInput = document.getElementById('json-file-input');
        if (existingInput) {
            return;
        }
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'json-file-input';
        fileInput.accept = '.json';
        fileInput.multiple = true; // Mehrere Dateien erlauben
        fileInput.style.display = 'none';
        
        document.body.appendChild(fileInput);
    }
    
    /**
     * Initialisiert Event-Listener für den JSON-Import
     * @private
     */
    _initEventListeners() {
        // File-Input für JSON-Upload
        const fileInput = document.getElementById('json-file-input');
        if (fileInput) {
            const newFileInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);
            
            newFileInput.addEventListener('change', async (event) => {
                const files = event.target.files;
                if (files.length > 0) {
                    await this._handleMultipleFiles(files);
                }
                newFileInput.value = '';
            });
        }
    }
    
    /**
     * Öffnet den Datei-Dialog zum Importieren
     */
    openImportDialog() {
        const fileInput = document.getElementById('json-file-input');
        if (fileInput) {
            fileInput.click();
        } else {
            this._showToast('Import-Dialog nicht verfügbar', 'error');
        }
    }
    
    /**
     * Verarbeitet mehrere Dateien
     * @param {FileList} files - Die ausgewählten Dateien
     * @private
     */
    async _handleMultipleFiles(files) {
        let successCount = 0;
        let errorCount = 0;
        
        for (const file of files) {
            try {
                await this.importJSON(file);
                successCount++;
            } catch (error) {
                console.error(`Fehler beim Importieren von ${file.name}:`, error);
                errorCount++;
            }
        }
        
        if (files.length > 1) {
            if (errorCount > 0) {
                this._showToast(`${successCount} erfolgreich, ${errorCount} fehlgeschlagen`, errorCount > successCount ? 'error' : 'success');
            } else {
                this._showToast(`${successCount} Dateien erfolgreich importiert`, 'success');
            }
        }
    }
    
    /**
     * Importiert eine JSON-Datei
     * @param {File} file - Die JSON-Datei
     */
    async importJSON(file) {
        // Prüfen, ob die Datei ein JSON ist
        if (!file.name.toLowerCase().endsWith('.json')) {
            throw new Error('Nur JSON-Dateien können importiert werden.');
        }
        
        // JSON-Datei lesen
        const jsonString = await file.text();
        let data;
        
        try {
            data = JSON.parse(jsonString);
        } catch (parseError) {
            throw new Error('Die ausgewählte Datei enthält kein gültiges JSON.');
        }
        
        // Typ der Datei erkennen und entsprechend verarbeiten
        const importType = this._detectImportType(data);
        console.log(`Import-Typ erkannt: ${importType}`);
        
        switch (importType) {
            case 'trainer_single':
                await this._importTrainerSingle(data);
                break;
            case 'pokemon_single':
                await this._importPokemonSingle(data);
                break;
            case 'multi_trainer':
                await this._importMultiTrainer(data);
                break;
            case 'legacy_pokemon':
                await this._importLegacyPokemon(data);
                break;
            default:
                throw new Error('Unbekanntes Dateiformat. Die Datei konnte nicht importiert werden.');
        }
    }
    
    /**
     * Erkennt den Typ der Import-Datei
     * @param {Object} data - Die zu analysierende Datei
     * @returns {string} Der erkannte Typ
     * @private
     */
    _detectImportType(data) {
        // Neues Export-Format mit explizitem Typ
        if (data.exportType === 'trainer_single') {
            return 'trainer_single';
        }
        if (data.exportType === 'pokemon_single') {
            return 'pokemon_single';
        }
        
        // Multi-Trainer Format
        if (data.trainers && Array.isArray(data.trainers)) {
            return 'multi_trainer';
        }
        
        // Trainer-Erkennung: Hat typische Trainer-Felder
        if (data.klasse !== undefined || data.vorteil !== undefined || 
            data.nachteil !== undefined || data.attacks !== undefined ||
            data.perks !== undefined || data.kommandos !== undefined ||
            data.inventory !== undefined || data.notes !== undefined) {
            return 'trainer_single';
        }
        
        // Pokemon-Erkennung: Hat typische Pokemon-Felder
        if (data.pokemonId || data.pokemonName) {
            if (data.moves !== undefined || data.abilities !== undefined || 
                data.tallyMarks !== undefined) {
                return 'pokemon_single';
            }
            return 'legacy_pokemon';
        }
        
        return 'unknown';
    }
    
    // ==================== TRAINER IMPORT ====================
    
    /**
     * Importiert einen einzelnen Trainer
     * @param {Object} data - Die Trainer-Daten
     * @private
     */
    async _importTrainerSingle(data) {
        const trainer = this._getActiveTrainer();
        if (!trainer) {
            throw new Error('Kein aktiver Trainer gefunden.');
        }
        
        // Bestätigung vom Benutzer
        const trainerName = data.name || 'Unbenannter Trainer';
        const pokemonCount = data.pokemonSummary 
            ? data.pokemonSummary.filter(p => !p.isEmpty).length 
            : (data.pokemonSlots ? data.pokemonSlots.filter(s => s.pokemonId).length : 0);
        
        const confirmMessage = `Trainer "${trainerName}" mit ${pokemonCount} Pokemon importieren?\n\n` +
            `Die aktuellen Trainer-Daten werden überschrieben.\n` +
            `(Pokemon-Daten müssen separat importiert werden)`;
        
        if (!confirm(confirmMessage)) {
            this._showToast('Import abgebrochen', 'info');
            return;
        }
        
        // Trainer-Daten importieren
        trainer._importFromJSON(data);
        
        // Trainer-Manager benachrichtigen
        if (window.trainerManager) {
            window.trainerManager.notifyChange();
        }
        
        // UI aktualisieren
        this._refreshTrainerUI();
        
        this._showToast(`Trainer "${trainerName}" erfolgreich importiert`, 'success');
    }
    
    /**
     * Importiert Multi-Trainer-Format (alle Trainer ersetzen oder hinzufügen)
     * @param {Object} data - Die Multi-Trainer-Daten
     * @private
     */
    async _importMultiTrainer(data) {
        if (!window.trainerManager) {
            throw new Error('TrainerManager nicht verfügbar.');
        }
        
        const trainerCount = data.trainers.length;
        const confirmReplace = confirm(
            `Diese Datei enthält ${trainerCount} Trainer.\n\n` +
            `Möchtest du alle bestehenden Trainer ersetzen (OK)\n` +
            `oder die Trainer hinzufügen (Abbrechen)?`
        );
        
        if (confirmReplace) {
            // Komplett ersetzen
            window.trainerManager.importAll(data);
        } else {
            // Trainer einzeln hinzufügen
            data.trainers.forEach(trainerData => {
                const newIndex = window.trainerManager.addTrainer();
                const newTrainer = window.trainerManager.trainers[newIndex];
                newTrainer._importFromJSON(trainerData);
                
                // Pokemon-Daten kopieren
                if (data.pokemonSheets) {
                    const existingSheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
                    
                    Object.entries(data.pokemonSheets).forEach(([key, pokemonData]) => {
                        if (key.startsWith(trainerData.id + '_slot') || 
                            key.startsWith(trainerData.id + '_pokemon_')) {
                            const newKey = key.replace(trainerData.id, newTrainer.id);
                            existingSheets[newKey] = {
                                ...pokemonData,
                                trainerId: newTrainer.id
                            };
                        }
                    });
                    
                    localStorage.setItem('pokemon_character_sheets', JSON.stringify(existingSheets));
                }
            });
            
            window.trainerManager.notifyChange();
        }
        
        // UI aktualisieren
        this._refreshTrainerUI();
        
        // Zur Trainer-Ansicht wechseln
        if (window.navigationService) {
            window.navigationService.showTrainerView();
        }
        
        this._showToast(`${trainerCount} Trainer importiert!`, 'success');
    }
    
    // ==================== POKEMON IMPORT ====================
    
    /**
     * Importiert ein einzelnes Pokemon
     * @param {Object} data - Die Pokemon-Daten
     * @private
     */
    async _importPokemonSingle(data) {
        const currentView = window.navigationService?.getCurrentView() || 'trainer';
        
        if (currentView === 'pokemon') {
            // Im Pokemon-View: Direkt das aktuelle Pokemon überschreiben
            await this._importPokemonToCurrentSlot(data);
        } else {
            // Im Trainer-View: In einen leeren Slot oder neuen Slot laden
            await this._importPokemonToEmptySlot(data);
        }
    }
    
    /**
     * Importiert Pokemon in den aktuellen Slot (Pokemon-Ansicht)
     * @param {Object} data - Die Pokemon-Daten
     * @private
     */
    async _importPokemonToCurrentSlot(data) {
        const pokemonName = data.pokemonGermanName || data.pokemonName || 'Pokemon';
        
        const confirmMessage = `"${pokemonName}" (Lv. ${data.level || '?'}) in den aktuellen Slot laden?\n\n` +
            `Die aktuellen Pokemon-Daten werden überschrieben.`;
        
        if (!confirm(confirmMessage)) {
            this._showToast('Import abgebrochen', 'info');
            return;
        }
        
        // Pokemon im Dropdown auswählen und laden
        const selectElement = document.getElementById('pokemon-select');
        if (selectElement && data.pokemonId) {
            selectElement.value = data.pokemonId.toString();
            
            // Change-Event auslösen
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
            
            // Warten und dann restliche Daten anwenden
            await this._waitForPokemonLoad(2000);
            this._applyPokemonData(data);
            
            this._showToast(`"${pokemonName}" erfolgreich importiert`, 'success');
        } else {
            throw new Error('Pokemon-Select nicht gefunden oder keine Pokemon-ID vorhanden.');
        }
    }
    
    /**
     * Importiert Pokemon in einen leeren Slot (Trainer-Ansicht)
     * @param {Object} data - Die Pokemon-Daten
     * @private
     */
    async _importPokemonToEmptySlot(data) {
        const trainer = this._getActiveTrainer();
        if (!trainer) {
            throw new Error('Kein aktiver Trainer gefunden.');
        }
        
        // Leeren Slot finden
        let targetSlotIndex = trainer.pokemonSlots.findIndex(slot => slot.isEmpty());
        
        if (targetSlotIndex === -1) {
            // Kein leerer Slot - neuen erstellen
            targetSlotIndex = trainer.addPokemonSlot();
        }
        
        const pokemonName = data.pokemonGermanName || data.pokemonName || 'Pokemon';
        
        // Slot mit Pokemon-Daten füllen
        const slot = trainer.pokemonSlots[targetSlotIndex];
        slot.pokemonId = data.pokemonId;
        slot.pokemonName = data.pokemonName;
        slot.germanName = data.pokemonGermanName || data.pokemonName;
        slot.nickname = data.textFields?.nickname || data.nickname || '';
        
        // Typen extrahieren
        if (data.types && Array.isArray(data.types)) {
            slot.types = data.types.map(t => {
                if (typeof t === 'string') return t.toLowerCase();
                if (t.type && t.type.name) return t.type.name.toLowerCase();
                return null;
            }).filter(t => t !== null);
        } else {
            slot.types = [];
        }
        
        // UUID generieren
        slot.generateUuid();
        
        // Pokemon-Daten mit der neuen UUID speichern
        const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
        const newKey = `${trainer.id}_pokemon_${slot.pokemonUuid}`;
        sheets[newKey] = {
            ...data,
            trainerId: trainer.id,
            pokemonUuid: slot.pokemonUuid
        };
        localStorage.setItem('pokemon_character_sheets', JSON.stringify(sheets));
        
        // Trainer-State speichern
        if (window.trainerManager) {
            window.trainerManager.notifyChange();
        }
        
        // UI aktualisieren
        if (window.trainerUIRenderer) {
            window.trainerUIRenderer.updatePokemonSlots();
        }
        
        // Trainer-Tabs aktualisieren
        if (window.trainerApp) {
            window.trainerApp._updateTrainerTabs();
        }
        
        this._showToast(`"${pokemonName}" in Slot ${targetSlotIndex + 1} importiert`, 'success');
    }
    
    /**
     * Importiert Legacy-Pokemon (älteres Format ohne exportType)
     * @param {Object} data - Die Pokemon-Daten
     * @private
     */
    async _importLegacyPokemon(data) {
        // Konvertieren zum neuen Format und dann normal importieren
        console.log('Legacy-Pokemon-Format erkannt, konvertiere...');
        data.exportType = 'pokemon_single';
        await this._importPokemonSingle(data);
    }
    
    // ==================== DATEN ANWENDEN ====================
    
    /**
     * Wendet Pokemon-Daten auf die aktuelle UI an
     * @param {Object} data - Die anzuwendenden Daten
     * @private
     */
    _applyPokemonData(data) {
        const appState = window.pokemonApp?.appState;
        if (!appState) return;
        
        console.log('Wende Pokemon-Daten an:', data);
        
        // Level setzen
        if (data.level !== undefined) {
            appState.setLevel(data.level, true);
            const levelInput = document.getElementById('level-value');
            if (levelInput) levelInput.value = data.level.toString();
        }
        
        // Stats setzen
        if (data.stats) {
            Object.entries(data.stats).forEach(([stat, value]) => {
                appState.setStat(stat, value);
                const statInput = document.getElementById(`${stat}-input`);
                if (statInput) statInput.value = value.toString();
            });
        }
        
        // Aktuelle HP
        if (data.currentHp !== undefined) {
            appState.setCurrentHp(data.currentHp);
            const currentHpInput = document.getElementById('current-hp-input');
            if (currentHpInput) currentHpInput.value = data.currentHp.toString();
        }
        
        // GENA, PA, BW
        if (data.gena !== undefined) {
            appState.setGena(data.gena);
            const genaInput = document.getElementById('gena-input');
            if (genaInput) genaInput.value = data.gena.toString();
        }
        
        if (data.pa !== undefined) {
            appState.setPa(data.pa);
            const paInput = document.getElementById('pa-input');
            if (paInput) paInput.value = data.pa.toString();
        }
        
        // Wunden
        if (data.wounds !== undefined && typeof appState.setWounds === 'function') {
            appState.setWounds(data.wounds);
            setTimeout(() => {
                if (typeof displayWoundsState === 'function') {
                    displayWoundsState(data.wounds);
                }
            }, 100);
        }
        
        // Fertigkeiten
        if (data.skillValues) {
            Object.entries(data.skillValues).forEach(([skill, value]) => {
                appState.setSkillValue(skill, value);
                const skillInput = document.querySelector(`input[data-skill="${skill}"]`);
                if (skillInput) skillInput.value = value.toString();
            });
        }
        
        // BW neu berechnen
        if (appState.recalculateBw) {
            appState.recalculateBw();
            const bwInput = document.getElementById('bw-input');
            if (bwInput) {
                bwInput.value = appState.bw.toString();
                if (appState.getBwTooltip) {
                    bwInput.title = appState.getBwTooltip();
                }
            }
        }
        
        // Freundschaft
        if (data.tallyMarks) {
            appState.tallyMarks = data.tallyMarks;
            if (typeof window.renderTallyMarks === 'function') {
                window.renderTallyMarks(data.tallyMarks);
            }
        }
        
        // Erfahrungspunkte
        if (data.currentExp !== undefined) {
            appState.currentExp = data.currentExp;
            const expInput = document.getElementById('current-exp-input');
            if (expInput) expInput.value = data.currentExp.toString();
        }
        
        // Stat-Auswahl für Level-Up
        if (data.primaryStatChoice) {
            appState.primaryStatChoice = data.primaryStatChoice;
        }
        if (data.secondaryStatChoice) {
            appState.secondaryStatChoice = data.secondaryStatChoice;
        }
        
        // Statuseffekte
        if (data.statusEffects && Array.isArray(data.statusEffects)) {
            appState.statusEffects = [...data.statusEffects];
        }
        
        // Temporäre Stat-Modifikatoren
        if (data.tempStatModifiers) {
            appState.tempStatModifiers = { ...data.tempStatModifiers };
        }
        
        // Benutzerdefinierte Fertigkeiten
        if (data.customSkills) {
            appState.customSkills = JSON.parse(JSON.stringify(data.customSkills));
        }
        
        // Benutzerdefinierte Würfelklasse
        if (data.customDiceClass !== undefined) {
            appState.customDiceClass = data.customDiceClass;
            // UI aktualisieren
            const diceClassDisplay = document.getElementById('dice-class-display');
            const resetBtn = document.getElementById('dice-class-reset-btn');
            if (diceClassDisplay) {
                const displayDice = data.customDiceClass || appState.pokemonData?.diceClass || '';
                diceClassDisplay.textContent = displayDice;
                if (data.customDiceClass) {
                    diceClassDisplay.classList.add('dice-class-customized');
                    if (resetBtn) resetBtn.classList.remove('hidden');
                } else {
                    diceClassDisplay.classList.remove('dice-class-customized');
                    if (resetBtn) resetBtn.classList.add('hidden');
                }
            }
        }
        
        // Attacken
        if (data.moves && Array.isArray(data.moves)) {
            this._applyMoves(data.moves);
        }
        
        // Textfelder
        if (data.textFields) {
            this._applyTextFields(data.textFields);
        }
        
        // Auto-Save triggern
        if (window.pokemonStorageService) {
            window.pokemonStorageService.triggerAutoSave();
        }
        
        console.log('Pokemon-Daten erfolgreich angewendet.');
    }
    
    /**
     * Wendet Attacken an
     * @param {Array} moves - Die Attacken
     * @private
     */
    _applyMoves(moves) {
        setTimeout(() => {
            moves.forEach((moveData, index) => {
                if (!moveData) return;
                
                const moveName = typeof moveData === 'object' ? moveData.name : moveData;
                const moveSelect = document.getElementById(`move-${index}`);
                
                if (moveSelect) {
                    moveSelect.value = moveName;
                    const event = new Event('change', { bubbles: true });
                    moveSelect.dispatchEvent(event);
                    
                    // Benutzerdefinierte Beschreibung
                    if (typeof moveData === 'object' && moveData.customDescription) {
                        setTimeout(() => {
                            const descriptionField = document.getElementById(`move-description-${index}`);
                            if (descriptionField) {
                                descriptionField.value = moveData.customDescription;
                                const appState = window.pokemonApp?.appState;
                                if (appState?.moves?.[index]) {
                                    appState.moves[index].customDescription = moveData.customDescription;
                                }
                            }
                        }, 300);
                    }
                }
            });
        }, 1000);
    }
    
    /**
     * Wendet Textfelder an
     * @param {Object} textFields - Die Textfelder
     * @private
     */
    _applyTextFields(textFields) {
        const nicknameInput = document.getElementById('nickname-input');
        if (nicknameInput && textFields.nickname) {
            nicknameInput.value = textFields.nickname;
        }
        
        const itemInput = document.getElementById('item-input');
        if (itemInput && textFields.item) {
            itemInput.value = textFields.item;
        }
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
     * Wartet auf das Laden eines Pokemon
     * @param {number} ms - Millisekunden zu warten
     * @private
     */
    _waitForPokemonLoad(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Aktualisiert die Trainer-UI
     * @private
     */
    _refreshTrainerUI() {
        if (window.trainerUIRenderer) {
            window.trainerUIRenderer.trainerState = this._getActiveTrainer();
            window.trainerUIRenderer.renderTrainerSheet();
        }
        
        if (window.trainerApp) {
            window.trainerApp._updateTrainerTabs();
        }
    }
    
    /**
     * Zeigt eine Toast-Benachrichtigung an
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {string} type - Der Typ der Nachricht
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
        }, 3000);
    }
}

// Globale Instanz erstellen
window.jsonImportService = new JSONImportService();

console.log('JSONImportService wurde global als window.jsonImportService initialisiert.');