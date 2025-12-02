/**
 * PokemonSheetApp
 * ================
 * Hauptklasse für die Pokemon Sheet Creator Anwendung
 * 
 * DESIGN-PRINZIPIEN:
 * 1. Verwendet PokemonStorageService für alle Storage-Operationen
 * 2. Klare Trennung: API → AppState → UI
 * 3. Auto-Save bei jeder Änderung
 */
class PokemonSheetApp {
    /**
     * Konstruktor
     */
    constructor() {
        // Globalen AppState verwenden
        this.appState = window.pokemonApp.appState;
        
        // Services initialisieren
        this.translationService = new TranslationService();
        this.apiService = new ApiService(this.appState);
        this.uiRenderer = new UiRenderer(this.appState);
        
        // Referenz auf den globalen StorageService
        this.storageService = window.pokemonStorageService;
        
        // Status-Tracking für Ladeoperationen
        this.isLoading = false;
        this.loadingOperations = {
            pokemonList: false,
            pokemonDetails: false,
            moves: false
        };
        
        // Timing-Konstanten
        this.timing = {
            short: 100,
            medium: 300,
            long: 500,
            extraLong: 1000
        };
        
        // PDF-Service (wird später initialisiert)
        this.pdfService = null;
        
        // Event-Listener initialisieren
        this._initEventListeners();
    }
    
    /**
     * Anwendung starten
     */
    async init() {
        console.log('PokemonSheetApp wird initialisiert...');
        
        this._setLoadingState(true, 'Pokémon-Liste wird geladen');
        
        try {
            // Pokemon-Liste laden
            this.loadingOperations.pokemonList = true;
            await this.apiService.fetchPokemonList();
            this.loadingOperations.pokemonList = false;
            
            // UI initialisieren
            this.uiRenderer.renderPokemonSelect();
            
            // PDF-Service initialisieren
            this._initPdfService();
            
            console.log('Pokemon App erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der App-Initialisierung:', error);
            this._showError('Fehler beim Laden der Pokémon-Liste. Bitte laden Sie die Seite neu.');
        } finally {
            this._setLoadingState(false);
        }
    }
    
    /**
     * Initialisiert den PDF-Service
     * @private
     */
    _initPdfService() {
        setTimeout(() => {
            try {
                this.pdfService = new PdfService(this.appState, this.uiRenderer);
                console.log('PDF-Service erfolgreich initialisiert');
            } catch (pdfError) {
                console.warn('PDF-Service konnte nicht initialisiert werden:', pdfError);
            }
        }, this.timing.extraLong);
    }
    
    /**
     * Event-Listener initialisieren
     * @private
     */
    _initEventListeners() {
        // Pokemon-Auswahl
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        if (selectElement) {
            selectElement.addEventListener('change', this._handlePokemonSelect.bind(this));
        }
        
        // PDF-Export-Button
        const savePdfButton = document.getElementById('save-pdf-button');
        if (savePdfButton) {
            savePdfButton.addEventListener('click', () => {
                if (this.pdfService) {
                    this.pdfService.exportPdf();
                } else {
                    this._showError('PDF-Export-Service nicht verfügbar');
                }
            });
        }
        
        // Event für erfolgreiche Pokémon-Ladung
        this.pokemonLoadedEvent = new CustomEvent('pokemonLoaded', {
            bubbles: true,
            detail: { success: true }
        });
    }
    
    // ==================== POKEMON-AUSWAHL & LADEN ====================
    
    /**
     * Handler für Pokemon-Auswahl
     * @param {Event} e - Event-Objekt
     * @private
     */
    async _handlePokemonSelect(e) {
        const pokemonId = parseInt(e.target.value, 10);
        
        if (!pokemonId || this.isLoading) return;
        
        e.target.disabled = true;
        this._setLoadingState(true, 'Pokémon-Daten werden geladen');
        
        try {
            // 1. Kontext aus NavigationService holen
            const context = this._getContext();
            
            // 2. Prüfen ob gespeicherte Daten existieren
            let savedSheet = null;
            if (context && this.storageService) {
                savedSheet = this.storageService.load(context.trainerId, context.slotIndex);
                
                // Nur verwenden wenn die Pokemon-ID übereinstimmt
                if (savedSheet && savedSheet.pokemonId !== pokemonId) {
                    console.log(`Neue Pokemon-Spezies gewählt (ID ${pokemonId}), ignoriere alte Daten (ID ${savedSheet.pokemonId})`);
                    savedSheet = null;
                }
            }
            
            const hasExistingSheet = savedSheet !== null;
            
            // 3. AppState zurücksetzen, wenn keine gespeicherten Daten
            if (!hasExistingSheet) {
                this._resetAppStateForNewPokemon();
            }
            
            // 4. Pokemon-Details von API laden
            this.loadingOperations.pokemonDetails = true;
            const pokemonData = await this.apiService.fetchPokemonDetails(pokemonId, hasExistingSheet);
            this.loadingOperations.pokemonDetails = false;
            
            if (!pokemonData) {
                throw new Error(`Pokémon mit ID ${pokemonId} konnte nicht geladen werden.`);
            }
            
            // 5. Gespeicherte Daten auf AppState anwenden (VOR UI-Rendering)
            if (hasExistingSheet) {
                this._applyLoadedSheetToAppState(savedSheet);
            }
            
            // 6. UI rendern
            this.uiRenderer.renderPokemonSheet();
            
            // 7. Attacken laden
            this.loadingOperations.moves = true;
            await this.apiService.fetchPokemonMoves(pokemonData);
            this.loadingOperations.moves = false;
            this.uiRenderer.updateMoveSelects();
            
            // 8. Gespeicherte Daten auf UI anwenden (NACH UI-Rendering)
            if (hasExistingSheet) {
                this._applyLoadedSheetToUI(savedSheet);
            } else {
                // Für neue Pokemon: UI initialisieren
                this._initializeNewPokemonUI();
            }
            
            // 9. NavigationService benachrichtigen
            if (window.navigationService && window.navigationService.getCurrentView() === 'pokemon') {
                window.navigationService.onPokemonSelected(pokemonId, pokemonData);
            }
            
            // 10. Auto-Save einrichten
            this._setupAutoSave();
            
            // Event auslösen
            document.dispatchEvent(this.pokemonLoadedEvent);
            
            console.log(`Pokémon mit ID ${pokemonId} erfolgreich geladen`);
        } catch (error) {
            console.error('Fehler beim Laden der Pokémon-Details:', error);
            this._showError(`Fehler beim Laden des Pokémon: ${error.message}`);
        } finally {
            e.target.disabled = false;
            this._setLoadingState(false);
        }
    }
    
    /**
     * Holt den aktuellen Kontext (Trainer + Slot)
     * @returns {{trainerId: string, slotIndex: number}|null}
     * @private
     */
    _getContext() {
        if (window.navigationService && 
            window.navigationService.getCurrentView() === 'pokemon' &&
            window.navigationService.getCurrentSlotIndex() !== null) {
            
            const trainer = window.trainerManager 
                ? window.trainerManager.getActiveTrainer() 
                : window.trainerState;
            
            if (trainer && trainer.id) {
                return {
                    trainerId: trainer.id,
                    slotIndex: window.navigationService.getCurrentSlotIndex()
                };
            }
        }
        return null;
    }
    
    /**
     * Setzt den AppState für ein neues Pokemon zurück
     * @private
     */
    _resetAppStateForNewPokemon() {
        // Strichliste zurücksetzen
        this.appState.tallyMarks = [];
        
        // Fertigkeitswerte auf Standard zurücksetzen
        Object.keys(SKILL_GROUPS).forEach(category => {
            this.appState.skillValues[category] = DEFAULT_VALUES.SKILL_VALUE;
        });
        Object.values(SKILL_GROUPS).flat().forEach(skill => {
            this.appState.skillValues[skill] = DEFAULT_VALUES.SKILL_VALUE;
        });
        
        // Wunden zurücksetzen
        if (typeof this.appState.setWounds === 'function') {
            this.appState.setWounds(0);
        } else {
            this.appState.wounds = 0;
        }
    }
    
    /**
     * Initialisiert die UI für ein neues Pokemon
     * @private
     */
    _initializeNewPokemonUI() {
        // Strichliste aktualisieren
        this._updateFriendshipDisplay();
        
        // Trainer-Feld einrichten
        setTimeout(() => {
            this._setupTrainerField();
        }, this.timing.short);
    }
    
    // ==================== DATEN ANWENDEN ====================
    
    /**
     * Wendet geladene Daten auf den AppState an
     * @param {Object} sheet - Der geladene Charakterbogen
     * @private
     */
    _applyLoadedSheetToAppState(sheet) {
        if (!sheet || !this.appState) return;
        
        console.log('Wende gespeicherten Charakterbogen auf AppState an:', sheet.pokemonGermanName || sheet.pokemonName);
        
        try {
            // Level setzen (mit skipRecalculation = true)
            if (sheet.level !== undefined) {
                this.appState.setLevel(sheet.level, true);
            }
            
            // Freundschaft setzen
            if (sheet.tallyMarks) {
                this.appState.tallyMarks = [...sheet.tallyMarks];
            }
            
            // EXP setzen
            if (sheet.currentExp !== undefined) {
                this.appState.currentExp = sheet.currentExp;
            }
            
            // Stats setzen
            if (sheet.stats) {
                Object.entries(sheet.stats).forEach(([statKey, statValue]) => {
                    this.appState.setStat(statKey, statValue);
                });
            }
            
            // Aktuelle HP setzen
            if (sheet.currentHp !== undefined) {
                this.appState.setCurrentHp(sheet.currentHp);
            }
            
            // GENA setzen
            if (sheet.gena !== undefined) {
                this.appState.setGena(sheet.gena);
            }
            
            // PA setzen
            if (sheet.pa !== undefined) {
                this.appState.setPa(sheet.pa);
            }
            
            // Wunden setzen
            if (sheet.wounds !== undefined && typeof this.appState.setWounds === 'function') {
                this.appState.setWounds(sheet.wounds);
            }
            
            // Fertigkeiten setzen
            if (sheet.skillValues) {
                Object.entries(sheet.skillValues).forEach(([skill, value]) => {
                    this.appState.setSkillValue(skill, value);
                });
            }
            
            // BW neu berechnen
            if (typeof this.appState.recalculateBw === 'function') {
                this.appState.recalculateBw();
            }
            
            console.log('AppState erfolgreich aktualisiert');
        } catch (error) {
            console.error('Fehler beim Anwenden der geladenen Daten auf AppState:', error);
        }
    }
    
    /**
     * Wendet geladene Daten auf die UI an
     * @param {Object} sheet - Der geladene Charakterbogen
     * @private
     */
    _applyLoadedSheetToUI(sheet) {
        if (!sheet) return;
        
        console.log('Wende gespeicherten Charakterbogen auf UI an');
        
        try {
            // Level-Input
            if (sheet.level !== undefined) {
                const levelInput = document.getElementById('level-value');
                if (levelInput) levelInput.value = sheet.level.toString();
            }
            
            // Freundschafts-Anzeige
            this._updateFriendshipDisplay();
            
            // EXP-Input
            if (sheet.currentExp !== undefined) {
                const currentExpInput = document.getElementById('current-exp-input');
                if (currentExpInput) currentExpInput.value = sheet.currentExp.toString();
            }
            
            // Stats-Inputs
            if (sheet.stats) {
                Object.entries(sheet.stats).forEach(([statKey, statValue]) => {
                    const statInput = document.querySelector(`input[data-stat="${statKey}"]`);
                    if (statInput) statInput.value = statValue.toString();
                });
            }
            
            // Aktuelle HP
            if (sheet.currentHp !== undefined) {
                const currentHpInput = document.getElementById('current-hp-input');
                if (currentHpInput) currentHpInput.value = sheet.currentHp.toString();
            }
            
            // GENA
            if (sheet.gena !== undefined) {
                const genaInput = document.getElementById('gena-input');
                if (genaInput) genaInput.value = sheet.gena.toString();
            }
            
            // PA
            if (sheet.pa !== undefined) {
                const paInput = document.getElementById('pa-input');
                if (paInput) paInput.value = sheet.pa.toString();
            }
            
            // BW
            const bwInput = document.getElementById('bw-input');
            if (bwInput) {
                bwInput.value = this.appState.bw.toString();
                if (this.appState.getBwTooltip) {
                    bwInput.title = this.appState.getBwTooltip();
                }
            }
            
            // Wunden
            if (sheet.wounds !== undefined) {
                setTimeout(() => {
                    if (typeof displayWoundsState === 'function') {
                        displayWoundsState(sheet.wounds);
                    }
                }, this.timing.short);
            }
            
            // Fertigkeiten
            if (sheet.skillValues) {
                Object.entries(sheet.skillValues).forEach(([skill, value]) => {
                    const skillInput = document.querySelector(`input[data-skill="${skill}"]`);
                    if (skillInput) skillInput.value = value.toString();
                });
            }
            
            // Attacken
            this._applyMoves(sheet.moves);
            
            // Textfelder
            this._applyTextFields(sheet.textFields);
            
            console.log('UI-Anwendung abgeschlossen');
        } catch (error) {
            console.error('Fehler beim Anwenden der gespeicherten Daten auf UI:', error);
        }
    }
    
    /**
     * Wendet gespeicherte Attacken an
     * @param {Array} moves - Die gespeicherten Attacken
     * @private
     */
    _applyMoves(moves) {
        if (!moves || !Array.isArray(moves)) return;
        
        setTimeout(() => {
            moves.forEach((moveData, index) => {
                if (!moveData) return;
                
                const moveName = typeof moveData === 'object' ? moveData.name : moveData;
                const moveSelect = document.getElementById(`move-${index}`);
                
                if (moveSelect) {
                    moveSelect.value = moveName;
                    
                    // Change-Event auslösen
                    const event = new Event('change', { bubbles: true });
                    moveSelect.dispatchEvent(event);
                    
                    // Benutzerdefinierte Beschreibung setzen
                    if (typeof moveData === 'object' && moveData.customDescription) {
                        setTimeout(() => {
                            const descriptionField = document.getElementById(`move-description-${index}`);
                            if (descriptionField) {
                                descriptionField.value = moveData.customDescription;
                                if (this.appState.moves[index]) {
                                    this.appState.moves[index].customDescription = moveData.customDescription;
                                }
                            }
                        }, this.timing.short);
                    }
                }
            });
        }, this.timing.medium);
    }
    
    /**
     * Wendet gespeicherte Textfelder an
     * @param {Object} textFields - Die gespeicherten Textfelder
     * @private
     */
    _applyTextFields(textFields) {
        if (!textFields) return;
        
        // Spitznamen setzen
        const nicknameInput = document.getElementById('nickname-input');
        if (nicknameInput && textFields.nickname) {
            nicknameInput.value = textFields.nickname;
        }
        
        // Item setzen
        const itemInput = document.getElementById('item-input');
        if (itemInput && textFields.item) {
            itemInput.value = textFields.item;
        }
        
        // Trainer-Feld einrichten
        setTimeout(() => {
            this._setupTrainerField();
        }, this.timing.short);
    }
    
    // ==================== AUTO-SAVE ====================
    
    /**
     * Richtet Auto-Save Event-Listener ein
     * @private
     */
    _setupAutoSave() {
        const sheetContainer = document.getElementById('pokemon-sheet-container');
        if (!sheetContainer) return;
        
        // Alle Input-Elemente im Container überwachen
        sheetContainer.addEventListener('change', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this._triggerAutoSave();
            }
        });
        
        sheetContainer.addEventListener('input', (e) => {
            if (e.target.matches('input[type="number"], input[type="text"], textarea')) {
                this._triggerAutoSave();
            }
        });
        
        // Tally-Marks-Events überwachen
        document.addEventListener('tallyMarksChanged', () => {
            this._triggerAutoSave();
        });
    }
    
    /**
     * Triggert Auto-Save
     * @private
     */
    _triggerAutoSave() {
        if (this.storageService) {
            this.storageService.triggerAutoSave();
        }
    }
    
    // ==================== UI-HILFSMETHODEN ====================
    
    /**
     * Aktualisiert die Freundschafts-Anzeige
     * @private
     */
    _updateFriendshipDisplay() {
        setTimeout(() => {
            if (typeof window.renderTallyMarks === 'function') {
                window.renderTallyMarks(this.appState.tallyMarks || []);
            }
        }, this.timing.short);
    }
    
    /**
     * Richtet das Trainer-Feld ein
     * @private
     */
    _setupTrainerField() {
        if (window.navigationService) {
            window.navigationService.setupTrainerField();
        }
    }
    
    /**
     * Setzt den Ladezustand
     * @param {boolean} isLoading - Ob geladen wird
     * @param {string} message - Nachricht für den Lade-Indikator
     * @private
     */
    _setLoadingState(isLoading, message = 'Laden...') {
        this.isLoading = isLoading;
        
        if (isLoading) {
            this._showLoadingIndicator(message);
        } else {
            this._hideLoadingIndicator();
        }
    }
    
    /**
     * Zeigt den Lade-Indikator
     * @param {string} message - Die anzuzeigende Nachricht
     * @private
     */
    _showLoadingIndicator(message) {
        let indicator = document.getElementById('loading-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'loading-indicator';
            indicator.className = 'loading-indicator';
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = message;
        indicator.style.display = 'block';
    }
    
    /**
     * Entfernt den Lade-Indikator
     * @private
     */
    _hideLoadingIndicator() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * Zeigt eine Fehlermeldung
     * @param {string} message - Die Fehlermeldung
     * @private
     */
    _showError(message) {
        let errorContainer = document.getElementById('error-container');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'error-container';
            errorContainer.className = 'error-container';
            document.body.appendChild(errorContainer);
        }
        
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

// App beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM vollständig geladen, initialisiere Pokemon Sheet App...');
    const app = new PokemonSheetApp();
    window.pokemonApp = Object.assign(window.pokemonApp || {}, app);
    app.init();
});