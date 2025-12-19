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
        
        // Mojibake-Ersetzungstabelle (UTF-8 als ISO-8859-1/Windows-1252 interpretiert)
        this._mojibakeMap = {
            'Ã–': 'Ö', 'Ã¶': 'ö',
            'Ã„': 'Ä', 'Ã¤': 'ä',
            'Ãœ': 'Ü', 'Ã¼': 'ü',
            'ÃŸ': 'ß',
            'Ã©': 'é', 'Ã¨': 'è',
            'Ã ': 'à', 'Ã¡': 'á',
            'Ã®': 'î', 'Ã¯': 'ï',
            'Ã´': 'ô', 'Ã²': 'ò',
            'Ã»': 'û', 'Ã¹': 'ù'
        };
        
        console.log('JSON Import Service initialisiert');
    }
    
    /**
     * Repariert Mojibake-Strings (UTF-8 falsch als ISO-8859-1 decodiert)
     * @param {string} str - Der möglicherweise kaputte String
     * @returns {string} Der reparierte String
     * @private
     */
    _fixMojibake(str) {
        if (!str || typeof str !== 'string') return str;
        
        let result = str;
        for (const [broken, fixed] of Object.entries(this._mojibakeMap)) {
            result = result.split(broken).join(fixed);
        }
        return result;
    }
    
    /**
     * Repariert alle String-Keys und -Values in einem Objekt rekursiv
     * @param {Object} obj - Das zu reparierende Objekt
     * @returns {Object} Das reparierte Objekt
     * @private
     */
    _fixMojibakeInObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => this._fixMojibakeInObject(item));
        }
        
        const fixed = {};
        for (const [key, value] of Object.entries(obj)) {
            const fixedKey = this._fixMojibake(key);
            const fixedValue = typeof value === 'string' 
                ? this._fixMojibake(value)
                : typeof value === 'object' 
                    ? this._fixMojibakeInObject(value)
                    : value;
            fixed[fixedKey] = fixedValue;
        }
        return fixed;
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
        
        // Mojibake reparieren (UTF-8 falsch als ISO-8859-1 decodiert)
        // Dies behebt Probleme mit Umlauten wie "KÃ–" -> "KÖ"
        data = this._fixMojibakeInObject(data);
        
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
     * INKL. eingebetteter Pokemon-Daten (ab v5.0)
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
        
        // Prüfen ob vollständige Pokemon-Daten eingebettet sind
        const hasFullPokemonData = data.pokemonFullData && Object.keys(data.pokemonFullData).length > 0;
        
        let confirmMessage = `Trainer "${trainerName}" mit ${pokemonCount} Pokemon importieren?\n\n` +
            `Die aktuellen Trainer-Daten werden überschrieben.`;
        
        if (hasFullPokemonData) {
            confirmMessage += `\n\n✓ Vollständige Pokemon-Daten werden ebenfalls importiert.`;
        } else {
            confirmMessage += `\n\n(Pokemon-Daten müssen separat importiert werden)`;
        }
        
        if (!confirm(confirmMessage)) {
            this._showToast('Import abgebrochen', 'info');
            return;
        }
        
        // Trainer-Daten importieren
        trainer._importFromJSON(data);
        
        // Eingebettete Pokemon-Daten in den Storage schreiben (NEU)
        if (hasFullPokemonData) {
            this._importEmbeddedPokemonData(trainer, data.pokemonFullData);
        }
        
        // Trainer-Manager benachrichtigen
        if (window.trainerManager) {
            window.trainerManager.notifyChange();
        }
        
        // UI aktualisieren
        this._refreshTrainerUI();
        
        if (hasFullPokemonData) {
            this._showToast(`Trainer "${trainerName}" mit ${pokemonCount} Pokemon erfolgreich importiert`, 'success');
        } else {
            this._showToast(`Trainer "${trainerName}" erfolgreich importiert`, 'success');
        }
    }
    
    /**
     * Importiert eingebettete Pokemon-Daten in den Storage
     * @param {TrainerState} trainer - Der importierte Trainer
     * @param {Object} pokemonFullData - Die eingebetteten Pokemon-Daten (UUID -> Daten)
     * @private
     */
    _importEmbeddedPokemonData(trainer, pokemonFullData) {
        if (!pokemonFullData || typeof pokemonFullData !== 'object') return;
        
        const sheets = JSON.parse(localStorage.getItem('pokemon_character_sheets') || '{}');
        let importedCount = 0;
        
        // Durch alle Pokemon-Slots des Trainers iterieren
        trainer.pokemonSlots.forEach((slot, index) => {
            if (slot.isEmpty() || !slot.pokemonUuid) return;
            
            // Prüfen ob Daten für diese UUID vorhanden sind
            const pokemonData = pokemonFullData[slot.pokemonUuid];
            if (!pokemonData) {
                console.log(`Keine eingebetteten Daten für Slot ${index} (UUID: ${slot.pokemonUuid})`);
                return;
            }
            
            // Storage-Key erstellen
            const storageKey = `${trainer.id}_pokemon_${slot.pokemonUuid}`;
            
            // Pokemon-Daten speichern
            sheets[storageKey] = {
                ...pokemonData,
                _meta: {
                    trainerId: trainer.id,
                    pokemonUuid: slot.pokemonUuid,
                    importedAt: new Date().toISOString()
                }
            };
            
            importedCount++;
            console.log(`Pokemon importiert: ${pokemonData.pokemonGermanName || pokemonData.pokemonName} (Shiny: ${pokemonData.isShiny}, Exotic: ${pokemonData.isExoticColor})`);
        });
        
        // Speichern
        localStorage.setItem('pokemon_character_sheets', JSON.stringify(sheets));
        console.log(`${importedCount} Pokemon-Datensätze in den Storage importiert`);
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
            
            // Promise erstellen das auf das pokemonLoaded Event wartet
            const waitForPokemonLoaded = new Promise((resolve) => {
                const handler = () => {
                    document.removeEventListener('pokemonLoaded', handler);
                    resolve();
                };
                document.addEventListener('pokemonLoaded', handler);
                
                // Fallback-Timeout falls das Event nie kommt (10 Sekunden)
                setTimeout(() => {
                    document.removeEventListener('pokemonLoaded', handler);
                    resolve();
                }, 10000);
            });
            
            // Change-Event auslösen
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
            
            // Auf das Pokemon-Loaded-Event warten (oder Timeout)
            await waitForPokemonLoaded;
            
            // Warten bis alle nachfolgenden Operationen abgeschlossen sind
            await this._waitForPokemonLoad(1500);
            
            // Import-Daten auf den AppState anwenden (NICHT auf die UI!)
            this._applyPokemonDataToAppState(data);
            
            // UI komplett neu rendern - sie liest die Werte aus dem AppState
            if (window.pokemonApp?.uiRenderer) {
                console.log('Re-Render der UI mit importierten Werten...');
                window.pokemonApp.uiRenderer.renderPokemonSheet();
                
                // Move-Selects auch aktualisieren
                window.pokemonApp.uiRenderer.updateMoveSelects();
            }
            
            // Attacken und Textfelder separat anwenden (nach dem Re-Render)
            setTimeout(() => {
                this._applyMovesAndTextFields(data);
                
                // Auto-Save triggern
                if (window.pokemonStorageService) {
                    window.pokemonStorageService.triggerAutoSave();
                }
            }, 300);
            
            this._showToast(`"${pokemonName}" erfolgreich importiert`, 'success');
        } else {
            throw new Error('Pokemon-Select nicht gefunden oder keine Pokemon-ID vorhanden.');
        }
    }
    
    /**
     * Wendet Pokemon-Daten NUR auf den AppState an (nicht auf die UI)
     * @param {Object} data - Die anzuwendenden Daten
     * @private
     */
    _applyPokemonDataToAppState(data) {
        const appState = window.pokemonApp?.appState;
        if (!appState) return;
        
        console.log('Wende Import-Daten auf AppState an...');
        
        // Level
        if (data.level !== undefined) {
            appState.level = data.level;
        }
        
        // Erfahrung
        if (data.currentExp !== undefined) {
            appState.currentExp = data.currentExp;
        }
        
        // Stats
        if (data.stats) {
            appState.stats = { ...data.stats };
        }
        
        // HP, GENA, PA, BW
        if (data.currentHp !== undefined) appState.currentHp = data.currentHp;
        if (data.gena !== undefined) appState.gena = data.gena;
        if (data.pa !== undefined) appState.pa = data.pa;
        if (data.bw !== undefined) appState.bw = data.bw;
        
        // Stat-Auswahl
        if (data.primaryStatChoice) appState.primaryStatChoice = data.primaryStatChoice;
        if (data.secondaryStatChoice) appState.secondaryStatChoice = data.secondaryStatChoice;
        
        // Wunden
        if (data.wounds !== undefined) {
            appState.wounds = data.wounds;
        }
        
        // Fertigkeiten - ALLE setzen
        if (data.skillValues) {
            Object.entries(data.skillValues).forEach(([skill, value]) => {
                appState.skillValues[skill] = value;
            });
            console.log('Skill-Werte im AppState gesetzt:', appState.skillValues['KÖ'], appState.skillValues['WI']);
        }
        
        // Statuseffekte
        if (data.statusEffects) {
            appState.statusEffects = [...data.statusEffects];
        }
        
        // Temp Stat Modifiers
        if (data.tempStatModifiers) {
            appState.tempStatModifiers = { ...data.tempStatModifiers };
        }
        
        // Freundschaft
        if (data.tallyMarks) {
            appState.tallyMarks = [...data.tallyMarks];
        }
        
        // Custom Skills
        if (data.customSkills) {
            appState.customSkills = JSON.parse(JSON.stringify(data.customSkills));
        }
        
        // Würfelklasse
        appState.customDiceClass = data.customDiceClass || null;
        
        // Shiny-Modus
        if (data.isShiny !== undefined) {
            appState.isShiny = data.isShiny;
        }
        
        // Geschlecht des Pokemon
        if (data.gender !== undefined) {
            if (appState.setGender) {
                appState.setGender(data.gender);
            } else {
                appState.gender = data.gender;
            }
        }
        
        // Exotische Färbung
        if (data.isExoticColor !== undefined) {
            appState.isExoticColor = data.isExoticColor;
        }
        if (data.exoticHueRotation !== undefined) {
            appState.exoticHueRotation = data.exoticHueRotation;
        }
        
        // Notizen
        if (data.notes && Array.isArray(data.notes)) {
            if (appState.setNotes) {
                appState.setNotes(data.notes);
            } else {
                appState.notes = data.notes.map(note => ({
                    id: note.id || ('note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                    name: note.name || 'Notiz',
                    content: note.content || '',
                    isCollapsed: note.isCollapsed || false
                }));
            }
        }
        
        // Sektionen-Reihenfolge
        if (data.sectionOrder && Array.isArray(data.sectionOrder)) {
            if (appState.setSectionOrder) {
                appState.setSectionOrder(data.sectionOrder);
            } else {
                appState.sectionOrder = [...data.sectionOrder];
            }
        }
        
        // Eingeklappte Sektionen
        if (data.collapsedSections && typeof data.collapsedSections === 'object') {
            if (appState.setCollapsedSections) {
                appState.setCollapsedSections(data.collapsedSections);
            } else {
                appState.collapsedSections = { ...data.collapsedSections };
            }
        }
        
        // Benutzerdefinierte physische Werte
        if (data.customHeight !== undefined) {
            appState.customHeight = data.customHeight;
        }
        if (data.customWeight !== undefined) {
            appState.customWeight = data.customWeight;
        }
        if (data.customRideability !== undefined) {
            appState.customRideability = data.customRideability;
        }
        
        console.log('AppState erfolgreich aktualisiert (inkl. Shiny/Exotic/Notes).');
    }
    
    /**
     * Wendet Attacken und Textfelder an (nach UI-Render)
     * @param {Object} data - Die anzuwendenden Daten
     * @private
     */
    _applyMovesAndTextFields(data) {
        const appState = window.pokemonApp?.appState;
        
        // Attacken
        if (data.moves && Array.isArray(data.moves)) {
            data.moves.forEach((moveData, index) => {
                if (!moveData) return;
                
                const moveName = typeof moveData === 'object' ? moveData.name : moveData;
                const moveSelect = document.getElementById(`move-${index}`);
                
                if (moveSelect && moveName) {
                    moveSelect.value = moveName;
                    const event = new Event('change', { bubbles: true });
                    moveSelect.dispatchEvent(event);
                    
                    // Benutzerdefinierte Beschreibung
                    if (typeof moveData === 'object' && moveData.customDescription) {
                        setTimeout(() => {
                            const descField = document.getElementById(`move-description-${index}`);
                            if (descField) {
                                descField.value = moveData.customDescription;
                                const appState = window.pokemonApp?.appState;
                                if (appState?.moves?.[index]) {
                                    appState.moves[index].customDescription = moveData.customDescription;
                                }
                            }
                        }, 200);
                    }
                }
            });
        }
        
        // Textfelder
        if (data.textFields) {
            const nicknameInput = document.getElementById('nickname-input');
            if (nicknameInput && data.textFields.nickname) {
                nicknameInput.value = data.textFields.nickname;
            }
            
            const itemInput = document.getElementById('item-input');
            if (itemInput && data.textFields.item) {
                itemInput.value = data.textFields.item;
            }
        }
        
        // Wunden-Anzeige aktualisieren
        if (data.wounds !== undefined && typeof displayWoundsState === 'function') {
            displayWoundsState(data.wounds);
        }
        
        // Freundschaft rendern
        if (data.tallyMarks && typeof window.renderTallyMarks === 'function') {
            window.renderTallyMarks(data.tallyMarks);
        }
        
        // Shiny-Modus UI aktualisieren
        if (data.isShiny !== undefined) {
            const spriteImg = document.getElementById('pokemon-sprite');
            const shinyToggleBtn = document.getElementById('shiny-toggle-btn');
            
            if (spriteImg && appState?.pokemonData) {
                const spriteUrl = data.isShiny && appState.pokemonData.sprites?.front_shiny
                    ? appState.pokemonData.sprites.front_shiny
                    : appState.pokemonData.sprites?.front_default;
                if (spriteUrl) spriteImg.src = spriteUrl;
            }
            
            if (shinyToggleBtn) {
                if (data.isShiny) {
                    shinyToggleBtn.classList.add('shiny-active');
                    shinyToggleBtn.title = 'Normale Farbe anzeigen';
                } else {
                    shinyToggleBtn.classList.remove('shiny-active');
                    shinyToggleBtn.title = 'Shiny-Farbe anzeigen';
                }
                const textSpan = shinyToggleBtn.querySelector('.shiny-text');
                if (textSpan) textSpan.textContent = data.isShiny ? 'Shiny' : 'Normal';
            }
        }
        
        // Geschlecht UI aktualisieren
        if (data.gender !== undefined) {
            const genderBadge = document.getElementById('gender-badge');
            if (genderBadge && GENDER_DISPLAY[data.gender]) {
                const genderInfo = GENDER_DISPLAY[data.gender];
                genderBadge.textContent = genderInfo.symbol;
                genderBadge.style.color = genderInfo.color;
                genderBadge.title = `${genderInfo.label} (Klicken zum Ändern)`;
                genderBadge.className = `gender-badge gender-${data.gender}`;
            }
        }
        
        // Exotische Färbung UI aktualisieren
        if (data.isExoticColor !== undefined || data.exoticHueRotation !== undefined) {
            const spriteImg = document.getElementById('pokemon-sprite');
            const exoticToggleBtn = document.getElementById('exotic-color-toggle-btn');
            const sliderContainer = document.getElementById('exotic-hue-slider-container');
            const hueSlider = document.getElementById('exotic-hue-slider');
            const hueValueDisplay = document.getElementById('exotic-hue-value');
            
            const isExotic = data.isExoticColor || false;
            const hueRotation = data.exoticHueRotation || 0;
            
            if (spriteImg) {
                if (isExotic) {
                    spriteImg.style.filter = `hue-rotate(${hueRotation}deg)`;
                } else {
                    spriteImg.style.filter = '';
                }
            }
            
            if (exoticToggleBtn) {
                if (isExotic) {
                    exoticToggleBtn.classList.add('exotic-active');
                    exoticToggleBtn.title = 'Exotische Färbung deaktivieren';
                } else {
                    exoticToggleBtn.classList.remove('exotic-active');
                    exoticToggleBtn.title = 'Exotische Färbung aktivieren';
                }
                const textSpan = exoticToggleBtn.querySelector('.exotic-text');
                if (textSpan) textSpan.textContent = isExotic ? 'Exotisch' : 'Normal';
            }
            
            if (sliderContainer) {
                sliderContainer.style.display = isExotic ? '' : 'none';
            }
            
            if (hueSlider) {
                hueSlider.value = hueRotation.toString();
            }
            
            if (hueValueDisplay) {
                hueValueDisplay.textContent = `${hueRotation}°`;
            }
        }
        
        // Benutzerdefinierte physische Werte UI aktualisieren
        if (data.customHeight) {
            const heightInput = document.getElementById('pokemon-height-input');
            if (heightInput) heightInput.value = data.customHeight;
        }
        
        if (data.customWeight) {
            const weightInput = document.getElementById('pokemon-weight-input');
            if (weightInput) weightInput.value = data.customWeight;
        }
        
        if (data.customRideability) {
            const rideabilityBadge = document.getElementById('rideability-badge');
            if (rideabilityBadge) {
                const rideabilityInfo = {
                    'none': { labelShort: 'Nicht reitbar', icon: '🚫', cssClass: 'rideability-none' },
                    'land': { labelShort: 'Land', icon: '🏇', cssClass: 'rideability-land' },
                    'water': { labelShort: 'Wasser', icon: '🌊', cssClass: 'rideability-water' },
                    'fly': { labelShort: 'Fliegend', icon: '🦅', cssClass: 'rideability-fly' }
                };
                const info = rideabilityInfo[data.customRideability];
                if (info) {
                    rideabilityBadge.className = `rideability-badge rideability-clickable ${info.cssClass}`;
                    const iconSpan = rideabilityBadge.querySelector('.rideability-icon');
                    const labelSpan = rideabilityBadge.querySelector('.rideability-label');
                    if (iconSpan) iconSpan.textContent = info.icon;
                    if (labelSpan) labelSpan.textContent = info.labelShort;
                }
            }
        }
        
        // Benutzerdefinierte Würfelklasse UI aktualisieren
        if (data.customDiceClass !== undefined) {
            const diceClassDisplay = document.getElementById('dice-class-display');
            const resetBtn = document.getElementById('dice-class-reset-btn');
            if (diceClassDisplay) {
                const displayDice = data.customDiceClass || appState?.pokemonData?.diceClass || '';
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
        
        // Fertigkeiten - mit robuster Key-Zuordnung für unterschiedliche Encodings
        // WICHTIG: Wir müssen den BESTEHENDEN Key im appState verwenden, nicht den aus der JSON,
        // da die Keys aufgrund unterschiedlicher Unicode-Normalisierung abweichen können!
        if (data.skillValues) {
            const knownKeys = Object.keys(appState.skillValues);
            console.log('=== SKILL IMPORT DEBUG ===');
            console.log('Bekannte Keys im AppState:', knownKeys);
            console.log('Keys aus Import-Daten:', Object.keys(data.skillValues));
            
            Object.entries(data.skillValues).forEach(([importedKey, value]) => {
                // Normalisiere den importierten Key
                const normalizedImportedKey = importedKey.normalize('NFC');
                
                // Suche den passenden bestehenden Key im AppState
                let targetKey = null;
                
                // 1. Direkte Übereinstimmung
                if (knownKeys.includes(importedKey)) {
                    targetKey = importedKey;
                }
                // 2. Übereinstimmung mit normalisiertem Key
                else if (knownKeys.includes(normalizedImportedKey)) {
                    targetKey = normalizedImportedKey;
                }
                // 3. Fuzzy-Match: Suche nach Key mit gleichem normalisierten Wert
                else {
                    targetKey = knownKeys.find(k => k.normalize('NFC') === normalizedImportedKey);
                }
                
                console.log(`Import "${importedKey}" (Wert: ${value}) -> targetKey: "${targetKey}"`);
                
                // Wert setzen wenn ein passender Key gefunden wurde
                if (targetKey) {
                    const success = appState.setSkillValue(targetKey, value);
                    console.log(`  setSkillValue Erfolg: ${success}, AppState jetzt: ${appState.skillValues[targetKey]}`);
                    
                    // UI aktualisieren - verwende den gefundenen targetKey für den Selektor
                    let skillInput = document.querySelector(`input[data-skill="${targetKey}"]`);
                    if (!skillInput) {
                        // Fallback mit verschiedenen Encodings
                        skillInput = document.querySelector(`input[data-skill="${importedKey}"]`);
                    }
                    if (!skillInput) {
                        skillInput = document.querySelector(`input[data-skill="${normalizedImportedKey}"]`);
                    }
                    if (skillInput) {
                        skillInput.value = value.toString();
                        console.log(`  UI Input gefunden und gesetzt auf: ${skillInput.value}`);
                    } else {
                        console.log(`  WARNUNG: Kein Input-Element gefunden für data-skill="${targetKey}"`);
                    }
                } else {
                    console.log(`  WARNUNG: Kein passender Key gefunden für "${importedKey}"!`);
                }
            });
            console.log('=== SKILL IMPORT DEBUG ENDE ===');
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
        
        // Shiny-Modus
        if (data.isShiny !== undefined) {
            appState.isShiny = data.isShiny;
            // UI aktualisieren
            const spriteImg = document.getElementById('pokemon-sprite');
            const shinyToggleBtn = document.getElementById('shiny-toggle-btn');
            if (spriteImg && appState.pokemonData) {
                const spriteUrl = data.isShiny && appState.pokemonData.sprites?.front_shiny
                    ? appState.pokemonData.sprites.front_shiny
                    : appState.pokemonData.sprites?.front_default;
                if (spriteUrl) spriteImg.src = spriteUrl;
            }
            if (shinyToggleBtn) {
                if (data.isShiny) {
                    shinyToggleBtn.classList.add('shiny-active');
                    shinyToggleBtn.title = 'Normale Farbe anzeigen';
                } else {
                    shinyToggleBtn.classList.remove('shiny-active');
                    shinyToggleBtn.title = 'Shiny-Farbe anzeigen';
                }
                const textSpan = shinyToggleBtn.querySelector('.shiny-text');
                if (textSpan) textSpan.textContent = data.isShiny ? 'Shiny' : 'Normal';
            }
        }
        
        // Geschlecht des Pokemon
        if (data.gender !== undefined) {
            if (appState.setGender) {
                appState.setGender(data.gender);
            } else {
                appState.gender = data.gender;
            }
            // UI aktualisieren
            const genderBadge = document.getElementById('gender-badge');
            if (genderBadge && GENDER_DISPLAY[data.gender]) {
                const genderInfo = GENDER_DISPLAY[data.gender];
                genderBadge.textContent = genderInfo.symbol;
                genderBadge.style.color = genderInfo.color;
                genderBadge.title = `${genderInfo.label} (Klicken zum Ändern)`;
                genderBadge.className = `gender-badge gender-${data.gender}`;
            }
        }
        
        // Exotische Färbung
        if (data.isExoticColor !== undefined || data.exoticHueRotation !== undefined) {
            appState.isExoticColor = data.isExoticColor || false;
            appState.exoticHueRotation = data.exoticHueRotation || 0;
            
            // UI aktualisieren
            const spriteImg = document.getElementById('pokemon-sprite');
            const exoticToggleBtn = document.getElementById('exotic-color-toggle-btn');
            const sliderContainer = document.getElementById('exotic-hue-slider-container');
            const hueSlider = document.getElementById('exotic-hue-slider');
            const hueValueDisplay = document.getElementById('exotic-hue-value');
            
            if (spriteImg) {
                if (appState.isExoticColor) {
                    spriteImg.style.filter = `hue-rotate(${appState.exoticHueRotation}deg)`;
                } else {
                    spriteImg.style.filter = '';
                }
            }
            
            if (exoticToggleBtn) {
                if (appState.isExoticColor) {
                    exoticToggleBtn.classList.add('exotic-active');
                    exoticToggleBtn.title = 'Exotische Färbung deaktivieren';
                } else {
                    exoticToggleBtn.classList.remove('exotic-active');
                    exoticToggleBtn.title = 'Exotische Färbung aktivieren';
                }
                const textSpan = exoticToggleBtn.querySelector('.exotic-text');
                if (textSpan) textSpan.textContent = appState.isExoticColor ? 'Exotisch' : 'Normal';
            }
            
            if (sliderContainer) {
                sliderContainer.style.display = appState.isExoticColor ? '' : 'none';
            }
            
            if (hueSlider) {
                hueSlider.value = appState.exoticHueRotation.toString();
            }
            
            if (hueValueDisplay) {
                hueValueDisplay.textContent = `${appState.exoticHueRotation}°`;
            }
        }
        
        // Benutzerdefinierte physische Werte
        if (data.customHeight !== undefined) {
            appState.customHeight = data.customHeight;
            const heightInput = document.getElementById('pokemon-height-input');
            if (heightInput && data.customHeight) {
                heightInput.value = data.customHeight;
            }
        }
        
        if (data.customWeight !== undefined) {
            appState.customWeight = data.customWeight;
            const weightInput = document.getElementById('pokemon-weight-input');
            if (weightInput && data.customWeight) {
                weightInput.value = data.customWeight;
            }
        }
        
        if (data.customRideability !== undefined) {
            appState.customRideability = data.customRideability;
            // UI aktualisieren - Reitbarkeits-Badge
            const rideabilityBadge = document.getElementById('rideability-badge');
            if (rideabilityBadge && data.customRideability) {
                const rideabilityInfo = {
                    'none': { labelShort: 'Nicht reitbar', icon: '🚫', cssClass: 'rideability-none' },
                    'land': { labelShort: 'Land', icon: '🏇', cssClass: 'rideability-land' },
                    'water': { labelShort: 'Wasser', icon: '🌊', cssClass: 'rideability-water' },
                    'fly': { labelShort: 'Fliegend', icon: '🦅', cssClass: 'rideability-fly' }
                };
                const info = rideabilityInfo[data.customRideability];
                if (info) {
                    rideabilityBadge.className = `rideability-badge rideability-clickable ${info.cssClass}`;
                    const iconSpan = rideabilityBadge.querySelector('.rideability-icon');
                    const labelSpan = rideabilityBadge.querySelector('.rideability-label');
                    if (iconSpan) iconSpan.textContent = info.icon;
                    if (labelSpan) labelSpan.textContent = info.labelShort;
                }
            }
        }
        
        // Notizen
        if (data.notes && Array.isArray(data.notes)) {
            if (appState.setNotes) {
                appState.setNotes(data.notes);
            } else {
                appState.notes = data.notes.map(note => ({
                    id: note.id || ('note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
                    name: note.name || 'Notiz',
                    content: note.content || '',
                    isCollapsed: note.isCollapsed || false
                }));
            }
        }
        
        // Sektionen-Reihenfolge
        if (data.sectionOrder && Array.isArray(data.sectionOrder)) {
            if (appState.setSectionOrder) {
                appState.setSectionOrder(data.sectionOrder);
            } else {
                appState.sectionOrder = [...data.sectionOrder];
            }
        }
        
        // Eingeklappte Sektionen
        if (data.collapsedSections && typeof data.collapsedSections === 'object') {
            if (appState.setCollapsedSections) {
                appState.setCollapsedSections(data.collapsedSections);
            } else {
                appState.collapsedSections = { ...data.collapsedSections };
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