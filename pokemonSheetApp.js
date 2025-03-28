/**
 * Hauptklasse für die Pokemon Sheet Creator Anwendung
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
    
        // StorageService initialisieren
        this.storageService = new StorageService(this.appState);
        
        // Evolutionsdaten für die Würfelklassenberechnung
        this.evolutionData = new Map();
        
        // PDF-Service initialisieren (später)
        this.pdfService = null;
        
        // Event-Listener initialisieren
        this._initEventListeners();
    }
    
    /**
     * Anwendung starten
     */
    async init() {        
        // Ladeindikator anzeigen
        this._showLoadingIndicator();
        
        try {
            // Pokemon-Liste laden
            await this.apiService.fetchPokemonList();
            
            // Ladeindikator entfernen
            this._hideLoadingIndicator();
            
            // UI initialisieren
            this.uiRenderer.renderPokemonSelect();
            
            // PDF-Service verzögert initialisieren
            setTimeout(() => {
                try {
                    this.pdfService = new PdfService(this.appState, this.uiRenderer);
                    console.log('PDF-Service erfolgreich initialisiert');
                } catch (pdfError) {
                    console.error('Fehler bei der PDF-Service-Initialisierung:', pdfError);
                }
            }, 1000); // 1 Sekunde warten
                        
            // Versuche, den zuletzt geöffneten Charakterbogen zu laden
            // Wichtig: Wir warten bis die Pokémon-Liste vollständig geladen ist
            setTimeout(() => {
                this._tryLoadLastSheet();
            }, 500);
            
        } catch (error) {
            console.error("Fehler beim Laden der Pokémon-Liste:", error);
            // Bei Fehler trotzdem Ladeindikator entfernen und Fehlermeldung anzeigen
            this._hideLoadingOverlay();
            
            const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
            const errorOption = createElement('option', { value: "" }, "Fehler beim Laden der Pokémon-Daten");
            selectElement.appendChild(errorOption);
        }
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
                        selectElement.value = lastOpenedPokemonId;
                        
                        // Change-Event auslösen, um das Pokemon zu laden
                        const event = new Event('change', { bubbles: true });
                        selectElement.dispatchEvent(event);
                    } else {
                        console.warn(`Das Pokémon mit ID '${lastOpenedPokemonId}' wurde in der Liste nicht gefunden.`);
                    }
                }
            }

             // Nach kurzer Verzögerung sicherstellen, dass die Freundschaftspunkte angezeigt werden
            setTimeout(() => {
                if (this.appState && this.appState.tallyMarks) {
                    console.log("Zeige Freundschaftspunkte nach Seiten-Reload:", this.appState.tallyMarks);
                    if (typeof window.renderTallyMarks === 'function') {
                        window.renderTallyMarks(this.appState.tallyMarks);
                    }
                }
            }, 2000); // Längere Verzögerung, um sicherzustellen, dass die UI vollständig geladen ist
        } catch (error) {
            console.error('Fehler beim Laden des zuletzt geöffneten Charakterbogens:', error);
        }
    }
    
    /**
     * Event-Listener initialisieren
     * @private
     */
    _initEventListeners() {
        // Event-Listener für Pokemon-Auswahl
        addEventListenerSafe('#' + DOM_IDS.POKEMON_SELECT, 'change', this._handlePokemonSelect.bind(this));
    }
    
    /**
     * Handler für Pokemon-Auswahl
     * @param {Event} e - Event-Objekt
     * @private
     */
    async _handlePokemonSelect(e) {
        console.log("e: " + e);
        const pokemonId = parseInt(e.target.value, 10);
        
        // Wenn kein Pokémon ausgewählt wurde, nichts tun
        if (!pokemonId) return;
        
        // Auswahlmenü während des Ladens deaktivieren
        e.target.disabled = true;
        
        try {
            // WICHTIG: Strichliste zurücksetzen, wenn ein neues Pokémon gewählt wird
            this.appState.tallyMarks = [];
            
            // Alle Fertigkeitswerte auf Standardwert (0) zurücksetzen
            this._resetSkillValues();
            
            // Pokemon-Details laden mit ID statt Name
            const pokemonData = await this.apiService.fetchPokemonDetails(pokemonId);
            
            // Prüfen, ob gespeicherte Daten für dieses Pokemon existieren
            const savedSheet = this.storageService.loadSheet(pokemonId);
            
            // UI aktualisieren
            this.uiRenderer.renderPokemonSheet();
            
            if (pokemonData) {            
                // Attacken laden und UI aktualisieren
                await this.apiService.fetchPokemonMoves(pokemonData);
                this.uiRenderer.updateMoveSelects();
                
                // Wenn gespeicherte Daten existieren, diese anwenden
                if (savedSheet) {
                    this._applyLoadedSheet(savedSheet);
                } else {
                    // Strichliste-UI aktualisieren (leere Liste)
                    if (typeof window.renderTallyMarks === 'function') {
                        window.renderTallyMarks([]);
                    } else if (this.uiRenderer && typeof this.uiRenderer._renderTallyMarks === 'function') {
                        this.uiRenderer._renderTallyMarks();
                    }
                }
            }
            
            // Speichern des zuletzt ausgewählten Pokemon
            if (pokemonId) {
                localStorage.setItem('last_opened_pokemon', pokemonId.toString());
            }
        } catch (error) {
            console.error("Fehler beim Laden der Pokémon-Details:", error);
        } finally {
            // Auswahlmenü nach dem Laden wieder aktivieren
            e.target.disabled = false;
        }
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
     * Zeigt einen Ladehinweis im Pokémon-Auswahlmenü an
     */
    _showLoadingIndicator() {
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        
        // Alle Optionen entfernen
        while (selectElement.options.length > 0) {
            selectElement.remove(0);
        }
        
        // Lade-Option hinzufügen
        const loadingOption = createElement('option', {
            value: ""
        }, "Pokémon-Daten werden geladen...");
        
        selectElement.appendChild(loadingOption);
        selectElement.disabled = true; // Deaktivieren während des Ladens
    }
    
    /**
     * Entfernt den Ladehinweis und aktiviert das Auswahlmenü wieder
     */
    _hideLoadingIndicator() {
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        
        // Alle Optionen entfernen
        while (selectElement.options.length > 0) {
            selectElement.remove(0);
        }
        
        // Standard-Option hinzufügen
        const defaultOption = createElement('option', {
            value: ""
        }, "-- Pokémon auswählen --");
        
        selectElement.appendChild(defaultOption);
        selectElement.disabled = false; // Aktivieren nach dem Laden
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
     * Wendet einen geladenen Charakterbogen auf den AppState an
     * @param {Object} sheet - Der geladene Charakterbogen
     * @private
     */
    _applyLoadedSheet(sheet) {
        // Keine Aktualisierung, wenn kein Sheet oder kein AppState
        if (!sheet || !this.appState) return;
        
        try {
            // Level setzen
            if (sheet.level !== undefined) {
                this.appState.setLevel(sheet.level);
                const levelInput = document.getElementById('level-value');
                if (levelInput) {
                    levelInput.value = sheet.level.toString();
                }
            }

            console.log("SHEET");
            console.log(sheet);
    
            // Freundschaft setzen
            if (sheet.tallyMarks) {
                console.log("FREUNDSCHAFT: " + sheet.tallyMarks);
                this.appState.tallyMarks = sheet.tallyMarks;
                // Strichliste nach kurzer Verzögerung aktualisieren
                setTimeout(() => {
                    if (typeof window.renderTallyMarks === 'function') {
                        window.renderTallyMarks(this.appState.tallyMarks);
                    } else if (this.uiRenderer && typeof this.uiRenderer._renderTallyMarks === 'function') {
                        this.uiRenderer._renderTallyMarks();
                    }
                }, 500);
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
            
            // Attacken setzen
            if (sheet.moves && Array.isArray(sheet.moves)) {
                sheet.moves.forEach((moveData, index) => {
                    if (!moveData) return;
                    
                    // Kurze Verzögerung, um sicherzustellen, dass die Attacken geladen sind
                    setTimeout(() => {
                        const moveSelect = document.getElementById(`move-${index}`);
                        if (moveSelect) {
                            // Bei neuem Format (mit Beschreibungen)
                            const moveName = typeof moveData === 'object' ? moveData.name : moveData;
                            
                            moveSelect.value = moveName;
                            const event = new Event('change', { bubbles: true });
                            moveSelect.dispatchEvent(event);
                            
                            // Wenn Beschreibung vorhanden, diese nach kurzer Verzögerung setzen
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
                                }, 300);
                            }
                        }
                    }, 100);
                });
            }
            
            // Textfelder setzen
            if (sheet.textFields) {
                const trainerInput = document.getElementById('trainer-input');
                if (trainerInput && sheet.textFields.trainer) {
                    trainerInput.value = sheet.textFields.trainer;
                }
                
                const nicknameInput = document.getElementById('nickname-input');
                if (nicknameInput && sheet.textFields.nickname) {
                    nicknameInput.value = sheet.textFields.nickname;
                }
                
                const itemInput = document.getElementById('item-input');
                if (itemInput && sheet.textFields.item) {
                    itemInput.value = sheet.textFields.item;
                }
            }
            
            console.log(`Charakterbogen für ${sheet.pokemonGermanName || sheet.pokemonName} geladen`);
        } catch (error) {
            console.error('Fehler beim Anwenden des geladenen Charakterbogens:', error);
        }
    }
}

// App beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', () => {
    const app = new PokemonSheetApp();
    app.init();
});
