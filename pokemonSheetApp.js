/**
 * Optimierte Hauptklasse für die Pokemon Sheet Creator Anwendung
 * mit einheitlichem Timing-Modell und effizienterem Laden
 */
class PokemonSheetApp {
    /**
     * Konstruktor
     */
    constructor() {
        // Globalen AppState verwenden statt einen neuen zu erstellen
        this.appState = window.pokemonApp.appState;
        
        // Services initialisieren
        this.translationService = new TranslationService();
        this.apiService = new ApiService(this.appState);
        this.uiRenderer = new UiRenderer(this.appState);
        this.storageService = new StorageService(this.appState);
        
        // Status-Tracking für Ladeoperationen
        this.isLoading = false;
        this.loadingOperations = {
            pokemonList: false,
            pokemonDetails: false,
            moves: false
        };
        
        // Einheitliche Verzögerungszeiten in Millisekunden
        this.timing = {
            short: 100,    // Kurze Verzögerung für UI-Updates
            medium: 300,   // Mittlere Verzögerung für einfache Datenverarbeitungen
            long: 500,     // Längere Verzögerung für komplexere Operationen
            extraLong: 1000 // Sehr lange Verzögerung für umfangreiche Operationen
        };
        
        // Service-Initialisierung
        this.pdfService = null;
        
        // Event-Listener initialisieren
        this._initEventListeners();
    }
    
    /**
     * Anwendung starten
     */
    async init() {
        console.log("PokemonSheetApp wird initialisiert...");
        
        this._setLoadingState(true, "Pokémon-Liste wird geladen");
        
        try {
            // Pokemon-Liste laden
            this.loadingOperations.pokemonList = true;
            await this.apiService.fetchPokemonList();
            this.loadingOperations.pokemonList = false;
            
            // UI initialisieren
            this.uiRenderer.renderPokemonSelect();
            
            // PDF-Service initialisieren
            this._initPdfService();
            
            // Versuch, den zuletzt geöffneten Charakterbogen zu laden
            this._tryLoadLastSheet();
            
            console.log("Pokemon App erfolgreich initialisiert");
        } catch (error) {
            console.error("Fehler bei der App-Initialisierung:", error);
            this._showError("Fehler beim Laden der Pokémon-Liste. Bitte laden Sie die Seite neu.");
        } finally {
            this._setLoadingState(false);
        }
    }
    
    /**
     * Initialisiert den PDF-Service
     * @private
     */
    _initPdfService() {
        // PDF-Service verzögert initialisieren
        setTimeout(() => {
            try {
                this.pdfService = new PdfService(this.appState, this.uiRenderer);
                console.log('PDF-Service erfolgreich initialisiert');
            } catch (pdfError) {
                console.warn('PDF-Service konnte nicht initialisiert werden:', pdfError);
                // Kein kritischer Fehler, UI weiterhin nutzbar
            }
        }, this.timing.extraLong);
    }
    
    /**
     * Versucht, den zuletzt geöffneten Charakterbogen zu laden
     * @private
     */
    _tryLoadLastSheet() {
        try {
            // Prüfen, ob ein zuletzt geöffneter Charakterbogen gespeichert ist
            const lastOpenedPokemonId = localStorage.getItem('last_opened_pokemon');
            
            if (lastOpenedPokemonId) {
                // Pokemon-Select auf den richtigen Wert setzen
                const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
                if (selectElement) {
                    // Prüfen, ob das Pokemon in der Liste verfügbar ist
                    const optionExists = Array.from(selectElement.options).some(option => option.value === lastOpenedPokemonId);
                    
                    if (optionExists) {
                        console.log(`Lade zuletzt geöffnetes Pokémon: ID ${lastOpenedPokemonId}`);
                        selectElement.value = lastOpenedPokemonId;
                        
                        // Change-Event auslösen, um das Pokemon zu laden
                        const event = new Event('change', { bubbles: true });
                        selectElement.dispatchEvent(event);
                    } else {
                        console.warn(`Das zuletzt geöffnete Pokémon (ID: ${lastOpenedPokemonId}) wurde nicht in der Liste gefunden.`);
                    }
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden des zuletzt geöffneten Charakterbogens:', error);
            // Kein kritischer Fehler, UI weiterhin nutzbar
        }
    }
    
    /**
     * Event-Listener initialisieren
     * @private
     */
    _initEventListeners() {
        // Event-Listener für Pokemon-Auswahl
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        if (selectElement) {
            selectElement.addEventListener('change', this._handlePokemonSelect.bind(this));
        } else {
            console.warn("Pokémon-Select-Element nicht gefunden. Event-Listener konnten nicht initialisiert werden.");
        }

        // Event-Listener für Speichern/Laden-Buttons hinzufügen
        this._initActionButtonsListeners();
        
        // Event für erfolgreiche Pokémon-Ladung erstellen
        this.pokemonLoadedEvent = new CustomEvent('pokemonLoaded', {
            bubbles: true,
            detail: { success: true }
        });
    }

    // Füge diese neue Methode hinzu:
    /**
     * Initialisiert Event-Listener für die Action-Buttons (Speichern/Laden)
     * @private
     */
    _initActionButtonsListeners() {        
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
    }
    
    /**
     * Handler für Pokemon-Auswahl
     * @param {Event} e - Event-Objekt
     * @private
     */
    async _handlePokemonSelect(e) {
        const pokemonId = parseInt(e.target.value, 10);
        
        // Wenn kein Pokémon ausgewählt wurde oder bereits ein Ladevorgang läuft, nichts tun
        if (!pokemonId || this.isLoading) return;
        
        // Auswahlmenü während des Ladens deaktivieren
        e.target.disabled = true;
        this._setLoadingState(true, "Pokémon-Daten werden geladen");
        
        try {
            // WICHTIG: Strichliste zurücksetzen, wenn ein neues Pokémon gewählt wird
            this.appState.tallyMarks = [];
            
            // Alle Fertigkeitswerte auf Standardwert (0) zurücksetzen
            this._resetSkillValues();
            
            // Wunden auf 0 zurücksetzen
            if (typeof this.appState.setWounds === 'function') {
                this.appState.setWounds(0);
            } else if (this.appState.wounds !== undefined) {
                this.appState.wounds = 0;
            }
            
            // Pokemon-Details laden
            this.loadingOperations.pokemonDetails = true;
            const pokemonData = await this.apiService.fetchPokemonDetails(pokemonId);
            this.loadingOperations.pokemonDetails = false;
            
            if (!pokemonData) {
                throw new Error(`Pokémon mit ID ${pokemonId} konnte nicht geladen werden.`);
            }
            
            // Prüfen, ob gespeicherte Daten für dieses Pokemon existieren
            const savedSheet = this.storageService.loadSheet(pokemonId);
            
            // UI aktualisieren
            this.uiRenderer.renderPokemonSheet();
            
            // Attacken laden und UI aktualisieren
            this.loadingOperations.moves = true;
            await this.apiService.fetchPokemonMoves(pokemonData);
            this.loadingOperations.moves = false;
            this.uiRenderer.updateMoveSelects();
            
            // Event auslösen, dass das Pokémon erfolgreich geladen wurde
            document.dispatchEvent(this.pokemonLoadedEvent);
            
            // Wenn gespeicherte Daten existieren, diese anwenden
            if (savedSheet) {
                this._applyLoadedSheet(savedSheet);
            } else {
                // Strichliste-UI aktualisieren (leere Liste)
                this._updateFriendshipDisplay();
            }
            
            // Speichern des zuletzt ausgewählten Pokemon
            if (pokemonId) {
                localStorage.setItem('last_opened_pokemon', pokemonId.toString());
            }
            
            console.log(`Pokémon mit ID ${pokemonId} erfolgreich geladen`);
        } catch (error) {
            console.error("Fehler beim Laden der Pokémon-Details:", error);
            this._showError(`Fehler beim Laden des Pokémon: ${error.message}`);
        } finally {
            // Auswahlmenü nach dem Laden wieder aktivieren
            e.target.disabled = false;
            this._setLoadingState(false);
        }
    }
    
    /**
     * Aktualisiert die Anzeige der Freundschafts-Strichliste
     * @private
     */
    _updateFriendshipDisplay() {
        setTimeout(() => {
            if (typeof window.renderTallyMarks === 'function') {
                window.renderTallyMarks(this.appState.tallyMarks || []);
            } else if (this.uiRenderer && typeof this.uiRenderer._renderTallyMarks === 'function') {
                this.uiRenderer._renderTallyMarks();
            }
        }, this.timing.short);
    }
    
    /**
     * Setzt alle Fertigkeitswerte auf den Standardwert zurück (0)
     * @private
     */
    _resetSkillValues() {
        // Haupt-Kategorien
        Object.keys(SKILL_GROUPS).forEach(category => {
            this.appState.skillValues[category] = DEFAULT_VALUES.SKILL_VALUE;
        });
        
        // Einzelne Skills
        Object.values(SKILL_GROUPS).flat().forEach(skill => {
            this.appState.skillValues[skill] = DEFAULT_VALUES.SKILL_VALUE;
        });
    }

    /**
     * Setzt den Ladezustand der App
     * @param {boolean} isLoading - Ob die App gerade lädt
     * @param {string} message - Optionale Nachricht, die angezeigt werden soll
     * @private
     */
    _setLoadingState(isLoading, message = "Laden...") {
        this.isLoading = isLoading;
        
        if (isLoading) {
            this._showLoadingOverlay(message);
        } else {
            this._hideLoadingOverlay();
        }
    }

    /**
     * Zeigt einen Ladehinweis im Overlay an
     * @param {string} message - Die anzuzeigende Nachricht
     * @private
     */
    _showLoadingOverlay(message = "Laden...") {
        // Prüfen, ob bereits ein Overlay angezeigt wird
        let overlay = document.querySelector('.loading-overlay');
        
        if (!overlay) {
            // Overlay-Element erstellen
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            
            // Spinner erstellen
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            // Nachricht erstellen
            const messageElement = document.createElement('div');
            messageElement.className = 'loading-message';
            messageElement.style.color = 'white';
            messageElement.style.marginTop = '10px';
            messageElement.style.fontSize = '16px';
            
            // Zum Overlay hinzufügen
            overlay.appendChild(spinner);
            overlay.appendChild(messageElement);
            
            // Zum Dokument hinzufügen
            document.body.appendChild(overlay);
        }
        
        // Nachricht aktualisieren
        const messageElement = overlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    /**
     * Entfernt das Ladeoverlay
     * @private
     */
    _hideLoadingOverlay() {
        // Overlay suchen und entfernen
        const overlay = document.querySelector('.loading-overlay');
        if (overlay && document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    }
    
    /**
     * Zeigt eine Fehlermeldung an
     * @param {string} message - Die anzuzeigende Fehlermeldung
     * @private
     */
    _showError(message) {
        // Toast-Benachrichtigung erstellen
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '4px';
        toast.style.backgroundColor = '#F44336';
        toast.style.color = 'white';
        toast.style.fontWeight = 'bold';
        toast.style.zIndex = '1001';
        toast.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        
        // Zum Dokument hinzufügen
        document.body.appendChild(toast);
        
        // Nach einigen Sekunden entfernen
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * Wendet einen geladenen Charakterbogen auf den AppState an
     * @param {Object} sheet - Der geladene Charakterbogen
     * @private
     */
    _applyLoadedSheet(sheet) {
        // Keine Aktualisierung, wenn kein Sheet oder kein AppState
        if (!sheet || !this.appState) return;
        
        try {
            console.log("Wende gespeicherten Charakterbogen an:", sheet);
            
            // Level setzen
            if (sheet.level !== undefined) {
                this.appState.setLevel(sheet.level);
                const levelInput = document.getElementById('level-value');
                if (levelInput) {
                    levelInput.value = sheet.level.toString();
                }
            }
    
            // Freundschaft setzen
            if (sheet.tallyMarks) {
                console.log("Setze Freundschaftspunkte:", sheet.tallyMarks);
                this.appState.tallyMarks = sheet.tallyMarks;
                this._updateFriendshipDisplay();
            }
            
            // Aktuelle EXP setzen
            if (sheet.currentExp !== undefined) {
                this.appState.currentExp = sheet.currentExp;
                const currentExpInput = document.getElementById('current-exp-input');
                if (currentExpInput) {
                    currentExpInput.value = sheet.currentExp.toString();
                }
            }
            
            // Stats setzen
            if (sheet.stats) {
                Object.entries(sheet.stats).forEach(([statKey, statValue]) => {
                    this.appState.setStat(statKey, statValue);
                    const statInput = document.querySelector(`input[data-stat="${statKey}"]`);
                    if (statInput) {
                        statInput.value = statValue.toString();
                    }
                });
            }
            
            // Aktuelle HP setzen
            if (sheet.currentHp !== undefined) {
                this.appState.setCurrentHp(sheet.currentHp);
                const currentHpInput = document.getElementById('current-hp-input');
                if (currentHpInput) {
                    currentHpInput.value = sheet.currentHp.toString();
                }
            }
            
            // GENA, PA und BW setzen
            if (sheet.gena !== undefined) {
                this.appState.setGena(sheet.gena);
                const genaInput = document.getElementById('gena-input');
                if (genaInput) {
                    genaInput.value = sheet.gena.toString();
                }
            }
            
            if (sheet.pa !== undefined) {
                this.appState.setPa(sheet.pa);
                const paInput = document.getElementById('pa-input');
                if (paInput) {
                    paInput.value = sheet.pa.toString();
                }
            }
            
            if (sheet.bw !== undefined) {
                this.appState.setBw(sheet.bw);
                const bwInput = document.getElementById('bw-input');
                if (bwInput) {
                    bwInput.value = sheet.bw.toString();
                }
            }
            
            // Wunden setzen, wenn vorhanden
            if (sheet.wounds !== undefined && typeof this.appState.setWounds === 'function') {
                this.appState.setWounds(sheet.wounds);
                setTimeout(() => {
                    if (typeof displayWoundsState === 'function') {
                        displayWoundsState(sheet.wounds);
                    }
                }, this.timing.short);
            }
            
            // Fertigkeiten setzen
            if (sheet.skillValues) {
                Object.entries(sheet.skillValues).forEach(([skill, value]) => {
                    this.appState.setSkillValue(skill, value);
                    const skillInput = document.querySelector(`input[data-skill="${skill}"]`);
                    if (skillInput) {
                        skillInput.value = value.toString();
                    }
                });
            }
            
            // Attacken setzen - mit einheitlichem Timing
            this._applyMoves(sheet.moves);
            
            // Textfelder setzen
            this._applyTextFields(sheet.textFields);
            
            console.log(`Charakterbogen für ${sheet.pokemonGermanName || sheet.pokemonName} geladen`);
        } catch (error) {
            console.error('Fehler beim Anwenden des geladenen Charakterbogens:', error);
        }
    }
    
    /**
     * Wendet gespeicherte Attacken an
     * @param {Array} moves - Die gespeicherten Attacken
     * @private
     */
    _applyMoves(moves) {
        if (!moves || !Array.isArray(moves)) return;
        
        // Alle Attacken-Selects auf einmal aktualisieren
        setTimeout(() => {
            moves.forEach((moveData, index) => {
                if (!moveData) return;
                
                // Bei neuem Format (mit Beschreibungen)
                const moveName = typeof moveData === 'object' ? moveData.name : moveData;
                
                const moveSelect = document.getElementById(`move-${index}`);
                if (moveSelect) {
                    moveSelect.value = moveName;
                    
                    // Change-Event auslösen
                    const event = new Event('change', { bubbles: true });
                    moveSelect.dispatchEvent(event);
                    
                    // Wenn Beschreibung vorhanden, diese setzen
                    if (typeof moveData === 'object' && moveData.customDescription) {
                        setTimeout(() => {
                            const descriptionField = document.getElementById(`move-description-${index}`);
                            if (descriptionField) {
                                descriptionField.value = moveData.customDescription;
                                
                                // Auch im AppState speichern
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
        
        // Trainer-Name setzen
        const trainerInput = document.getElementById('trainer-input');
        if (trainerInput && textFields.trainer) {
            trainerInput.value = textFields.trainer;
        }
        
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
    }
}

// App beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM vollständig geladen, initialisiere Pokemon Sheet App...");
    const app = new PokemonSheetApp();
    window.pokemonApp = Object.assign(window.pokemonApp || {}, app);
    app.init();
});