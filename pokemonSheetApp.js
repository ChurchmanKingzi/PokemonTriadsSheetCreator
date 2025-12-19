/**
 * PokemonSheetApp
 * ================
 * Hauptklasse für die Pokemon Sheet Creator Anwendung
 * 
 * DESIGN-PRINZIPIEN:
 * 1. Verwendet PokemonStorageService für alle Storage-Operationen
 * 2. UUID-basierte Persistenz - Pokemon werden durch UUID identifiziert, NICHT durch Position
 * 3. Klare Trennung: API → AppState → UI
 * 4. Auto-Save bei jeder Änderung
 * 5. Paralleles Preloading für Pokemon-Cries (keine Verzögerung beim Abspielen)
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
        // Sofort versuchen zu initialisieren
        this._tryInitPdfService();
        
        // Zusätzlich nach kurzer Verzögerung erneut versuchen (falls Bibliotheken noch laden)
        setTimeout(() => {
            if (!this.pdfService) {
                this._tryInitPdfService();
            }
        }, this.timing.extraLong);
    }
    
    /**
     * Versucht den PDF-Service zu initialisieren
     * @private
     * @returns {boolean} True wenn erfolgreich
     */
    _tryInitPdfService() {
        if (this.pdfService) return true;
        
        try {
            if (typeof PdfService !== 'undefined') {
                this.pdfService = new PdfService(this.appState, this.uiRenderer);
                console.log('PDF-Service erfolgreich initialisiert');
                return true;
            } else {
                console.log('PdfService-Klasse noch nicht verfügbar, warte...');
                return false;
            }
        } catch (pdfError) {
            console.warn('PDF-Service konnte nicht initialisiert werden:', pdfError);
            return false;
        }
    }
    
    /**
     * Gibt den PDF-Service zurück, initialisiert ihn bei Bedarf
     * @returns {PdfService|null}
     */
    getPdfService() {
        if (!this.pdfService) {
            this._tryInitPdfService();
        }
        return this.pdfService;
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
        
        
        // Event für erfolgreiche Pokémon-Ladung
        this.pokemonLoadedEvent = new CustomEvent('pokemonLoaded', {
            bubbles: true,
            detail: { success: true }
        });
    }
    
    // ==================== POKEMON-AUSWAHL & LADEN ====================
    
    /**
     * Lädt ein Pokemon für einen bestimmten Slot.
     * Verwendet die UUID des Pokemon für stabilen Storage-Zugriff.
     * 
     * WICHTIG: Diese Methode wird vom NavigationService aufgerufen.
     * Der Storage-Kontext (Trainer-ID + Pokemon-UUID) muss bereits gesetzt sein!
     * 
     * @param {string} trainerId - ID des Trainers
     * @param {number} slotIndex - Index des Pokemon-Slots (nur für UI)
     * @returns {Promise<boolean>} Erfolg
     */
    async loadPokemonForSlot(trainerId, slotIndex) {
        if (this.isLoading) {
            console.log('PokemonSheetApp: Bereits beim Laden, überspringe');
            return false;
        }
        
        console.log(`PokemonSheetApp: Lade Pokemon für Trainer ${trainerId}, Slot ${slotIndex}`);
        
        // Trainer und Slot holen
        const trainer = window.trainerManager 
            ? window.trainerManager.getActiveTrainer() 
            : window.trainerState;
        
        if (!trainer || !trainer.pokemonSlots || slotIndex >= trainer.pokemonSlots.length) {
            console.error('PokemonSheetApp: Ungültiger Trainer oder Slot-Index');
            return false;
        }
        
        const slot = trainer.pokemonSlots[slotIndex];
        
        // UUID muss vorhanden sein (wird vom NavigationService generiert)
        if (slot.pokemonId && !slot.pokemonUuid) {
            console.error('PokemonSheetApp: Pokemon hat keine UUID! NavigationService hätte diese generieren sollen.');
            // Fallback: UUID jetzt generieren
            slot.generateUuid();
            if (trainer.manager) {
                trainer.manager.notifyChange();
            }
        }
        
        // Kontext für StorageService setzen (MIT UUID!)
        if (this.storageService && slot.pokemonUuid) {
            this.storageService.setContext(trainerId, slot.pokemonUuid);
        }
        
        // Gespeicherte Daten laden (über UUID)
        let savedSheet = null;
        if (this.storageService && slot.pokemonUuid) {
            savedSheet = this.storageService.load(trainerId, slot.pokemonUuid);
        }
        
        if (savedSheet && savedSheet.pokemonId) {
            // Gespeicherte Daten existieren
            console.log(`PokemonSheetApp: Gespeicherte Daten gefunden - Pokemon ID ${savedSheet.pokemonId} (${savedSheet.pokemonGermanName || savedSheet.pokemonName})`);
            
            const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
            if (selectElement) {
                selectElement.value = savedSheet.pokemonId.toString();
            }
            
            return await this._loadPokemonById(savedSheet.pokemonId, savedSheet);
        } else if (slot.pokemonId) {
            // Slot hat Pokemon aber keine gespeicherten Daten
            console.log(`PokemonSheetApp: Slot hat Pokemon ID ${slot.pokemonId}, aber keine gespeicherten Daten`);
            
            const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
            if (selectElement) {
                selectElement.value = slot.pokemonId.toString();
            }
            
            return await this._loadPokemonById(slot.pokemonId, null);
        } else {
            // Leerer Slot
            console.log('PokemonSheetApp: Leerer Slot, keine Daten');
            this._resetForEmptySlot();
            return false;
        }
    }
    
    /**
     * Setzt die UI für einen leeren Slot zurück
     * @private
     */
    _resetForEmptySlot() {
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        if (selectElement) {
            selectElement.value = '';
        }
        
        // Sheet-Container leeren
        const sheetContainer = document.getElementById(DOM_IDS.SHEET_CONTAINER);
        if (sheetContainer) {
            sheetContainer.innerHTML = '<p class="no-pokemon-message">Wähle ein Pokémon aus der Liste oben.</p>';
        }
    }
    
    /**
     * Handler für Pokemon-Auswahl (wenn User manuell im Dropdown wählt)
     * @param {Event} e - Event-Objekt
     * @private
     */
    async _handlePokemonSelect(e) {
        const pokemonId = parseInt(e.target.value, 10);
        
        if (!pokemonId || this.isLoading) return;
        
        e.target.disabled = true;
        
        try {
            // Kontext vom NavigationService holen (enthält UUID)
            const context = this._getContext();
            
            // Prüfen ob es gespeicherte Daten für DIESES Pokemon gibt
            let savedSheet = null;
            if (context && context.pokemonUuid && this.storageService) {
                const existingData = this.storageService.load(context.trainerId, context.pokemonUuid);
                
                // Nur verwenden wenn die Pokemon-ID übereinstimmt
                if (existingData && existingData.pokemonId === pokemonId) {
                    savedSheet = existingData;
                    console.log(`PokemonSheetApp: Gespeicherte Daten für ID ${pokemonId} gefunden`);
                } else if (existingData && existingData.pokemonId !== pokemonId) {
                    // User hat eine ANDERE Spezies gewählt - das ist eine bewusste Änderung
                    console.log(`PokemonSheetApp: User wählt neue Spezies (ID ${pokemonId}), ersetze alte (ID ${existingData.pokemonId})`);
                    savedSheet = null;
                }
            }
            
            await this._loadPokemonById(pokemonId, savedSheet);
            
        } finally {
            e.target.disabled = false;
        }
    }
    
    /**
     * Lädt ein Pokemon anhand seiner ID
     * @param {number} pokemonId - Die Pokemon-ID
     * @param {Object|null} savedSheet - Optionale gespeicherte Daten
     * @returns {Promise<boolean>} Erfolg
     * @private
     */
    async _loadPokemonById(pokemonId, savedSheet = null) {
        this._setLoadingState(true, 'Pokémon-Daten werden geladen');
        
        // ============================================================
        // PARALLELES CRY-PRELOADING STARTEN
        // Der Cry wird gleichzeitig mit den Pokemon-Daten geladen,
        // sodass er sofort abgespielt werden kann wenn die UI fertig ist.
        // ============================================================
        let cryPreloadPromise = null;
        if (window.pokemonCryService && window.pokemonCryService.isEnabled()) {
            cryPreloadPromise = window.pokemonCryService.preloadCry(pokemonId);
            console.log(`PokemonSheetApp: Cry-Preloading für #${pokemonId} gestartet (parallel)`);
        }
        
        try {
            const hasExistingSheet = savedSheet !== null;
            
            // AppState zurücksetzen, wenn keine gespeicherten Daten
            if (!hasExistingSheet) {
                this._resetAppStateForNewPokemon();
            }
            
            // Pokemon-Details von API laden
            this.loadingOperations.pokemonDetails = true;
            const pokemonData = await this.apiService.fetchPokemonDetails(pokemonId, hasExistingSheet);
            this.loadingOperations.pokemonDetails = false;
            
            if (!pokemonData) {
                throw new Error(`Pokémon mit ID ${pokemonId} konnte nicht geladen werden.`);
            }
            
            // Gespeicherte Daten auf AppState anwenden (VOR UI-Rendering)
            if (hasExistingSheet) {
                this._applyLoadedSheetToAppState(savedSheet);
            }
            
            // UI rendern
            this.uiRenderer.renderPokemonSheet();
            
            // ============================================================
            // CRY ABSPIELEN (sobald UI gerendert ist)
            // Warte auf das Preload-Promise und spiele dann ab.
            // Da das Preloading parallel lief, sollte der Cry jetzt bereit sein!
            // ============================================================
            if (cryPreloadPromise) {
                cryPreloadPromise.then(() => {
                    // Kleiner Delay um sicherzustellen dass die UI komplett sichtbar ist
                    setTimeout(() => {
                        window.pokemonCryService.playCry(pokemonId);
                    }, 50);
                });
            }
            
            // Attacken laden
            this.loadingOperations.moves = true;
            await this.apiService.fetchPokemonMoves(pokemonData);
            this.loadingOperations.moves = false;
            this.uiRenderer.updateMoveSelects();
            
            // Gespeicherte Daten auf UI anwenden (NACH UI-Rendering)
            if (hasExistingSheet) {
                this._applyLoadedSheetToUI(savedSheet);
            } else {
                // Für neue Pokemon: UI initialisieren
                this._initializeNewPokemonUI();
            }
            
            // NavigationService benachrichtigen
            if (window.navigationService && window.navigationService.getCurrentView() === 'pokemon') {
                window.navigationService.onPokemonSelected(pokemonId, pokemonData);
            }
            
            // Auto-Save einrichten
            this._setupAutoSave();
            
            // Event auslösen (für andere Komponenten die darauf lauschen)
            document.dispatchEvent(this.pokemonLoadedEvent);
            
            console.log(`Pokémon mit ID ${pokemonId} erfolgreich geladen`);
            return true;
            
        } catch (error) {
            console.error('Fehler beim Laden der Pokémon-Details:', error);
            this._showError(`Fehler beim Laden des Pokémon: ${error.message}`);
            return false;
        } finally {
            this._setLoadingState(false);
        }
    }
    
    /**
     * Holt den aktuellen Kontext (Trainer + Pokemon-UUID)
     * 
     * WICHTIG: Der Kontext enthält die UUID, NICHT den Slot-Index!
     * 
     * @returns {{trainerId: string, slotIndex: number, pokemonUuid: string|null}|null}
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
                const slotIndex = window.navigationService.getCurrentSlotIndex();
                const slot = trainer.pokemonSlots[slotIndex];
                
                // UUID aus dem Slot holen (sollte bereits existieren)
                const pokemonUuid = slot ? slot.pokemonUuid : null;
                
                // Falls keine UUID vorhanden, eine generieren
                if (slot && slot.pokemonId && !slot.pokemonUuid) {
                    slot.generateUuid();
                    if (trainer.manager) {
                        trainer.manager.notifyChange();
                    }
                }
                
                return {
                    trainerId: trainer.id,
                    slotIndex: slotIndex,
                    pokemonUuid: slot ? slot.pokemonUuid : null
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
        
        // Würfelklasse zurücksetzen
        this.appState.customDiceClass = null;
        
        // Shiny-Modus zurücksetzen
        this.appState.isShiny = false;
        
        // Geschlecht zurücksetzen (wird später durch API-Default oder geladene Daten überschrieben)
        this.appState.gender = GENDER.MALE;
        
        // Exotische Färbung zurücksetzen
        this.appState.isExoticColor = false;
        this.appState.exoticHueRotation = 0;
        
        // Benutzerdefinierte physische Werte zurücksetzen
        this.appState.customHeight = null;
        this.appState.customWeight = null;
        this.appState.customRideability = null;
        
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
        // Trainer-Feld einrichten
        setTimeout(() => {
            this._setupTrainerField();
        }, this.timing.short);
    }
    
    /**
     * Wendet geladene Daten auf den AppState an
     * @param {Object} sheet - Die geladenen Daten
     * @private
     */
    _applyLoadedSheetToAppState(sheet) {
        if (!sheet) return;
        
        console.log('Wende geladene Daten auf AppState an...');
        
        // Level & Erfahrung
        if (sheet.level !== undefined) {
            this.appState.level = sheet.level;
        }
        if (sheet.currentExp !== undefined) {
            this.appState.currentExp = sheet.currentExp;
        }
        
        // ============================================
        // FIX: Stats DIREKT setzen, nicht hasOwnProperty prüfen!
        // Wenn skipLevelCalculation=true ist, ist appState.stats ein leeres Objekt {},
        // und hasOwnProperty('hp') wäre immer false!
        // ============================================
        if (sheet.stats) {
            // Stats-Objekt komplett übernehmen oder einzeln setzen
            this.appState.stats = {
                hp: sheet.stats.hp ?? 0,
                attack: sheet.stats.attack ?? 0,
                defense: sheet.stats.defense ?? 0,
                spAttack: sheet.stats.spAttack ?? 0,
                spDefense: sheet.stats.spDefense ?? 0,
                speed: sheet.stats.speed ?? 0
            };
        }
        
        // Weitere Werte
        if (sheet.currentHp !== undefined) this.appState.currentHp = sheet.currentHp;
        if (sheet.gena !== undefined) this.appState.gena = sheet.gena;
        if (sheet.pa !== undefined) this.appState.pa = sheet.pa;
        if (sheet.bw !== undefined) this.appState.bw = sheet.bw;
        
        // Stat-Auswahl für Level-Up
        if (sheet.primaryStatChoice !== undefined) {
            this.appState.primaryStatChoice = sheet.primaryStatChoice;
        }
        if (sheet.secondaryStatChoice !== undefined) {
            this.appState.secondaryStatChoice = sheet.secondaryStatChoice;
        }
        
        // Fertigkeiten - mit robuster Key-Zuordnung für unterschiedliche Encodings
        if (sheet.skillValues) {
            const knownKeys = Object.keys(this.appState.skillValues);
            
            Object.entries(sheet.skillValues).forEach(([importedKey, value]) => {
                // Normalisiere den importierten Key
                const normalizedImportedKey = importedKey.normalize('NFC');
                
                // Direkte Übereinstimmung
                if (knownKeys.includes(importedKey)) {
                    this.appState.skillValues[importedKey] = value;
                    return;
                }
                
                // Übereinstimmung mit normalisiertem Key
                if (knownKeys.includes(normalizedImportedKey)) {
                    this.appState.skillValues[normalizedImportedKey] = value;
                    return;
                }
                
                // Fuzzy-Match: Suche nach Key mit gleichem normalisierten Wert
                const match = knownKeys.find(k => k.normalize('NFC') === normalizedImportedKey);
                if (match) {
                    this.appState.skillValues[match] = value;
                }
            });
        }
        
        // Wunden
        if (sheet.wounds !== undefined) {
            if (typeof this.appState.setWounds === 'function') {
                this.appState.setWounds(sheet.wounds);
            } else {
                this.appState.wounds = sheet.wounds;
            }
        }
        
        // Statuseffekte
        if (sheet.statusEffects) {
            this.appState.statusEffects = [...sheet.statusEffects];
        }
        
        // Temp Stat Modifiers
        if (sheet.tempStatModifiers) {
            this.appState.tempStatModifiers = { ...sheet.tempStatModifiers };
        }
        
        // Freundschaft (Tally Marks)
        if (sheet.tallyMarks) {
            this.appState.tallyMarks = [...sheet.tallyMarks];
        }
        
        // Custom Skills
        if (sheet.customSkills) {
            this.appState.customSkills = JSON.parse(JSON.stringify(sheet.customSkills));
        }
        
        // Benutzerdefinierte Würfelklasse - IMMER setzen (null wenn nicht vorhanden)
        // Sonst "rutscht" die customDiceClass eines anderen Pokemon durch!
        this.appState.customDiceClass = sheet.customDiceClass || null;
        
        // Shiny-Modus - IMMER setzen (false wenn nicht vorhanden)
        this.appState.isShiny = sheet.isShiny || false;
        
        // Geschlecht - IMMER setzen (Default aus API wenn nicht vorhanden)
        if (sheet.gender) {
            this.appState.gender = sheet.gender;
        } else if (this.appState.pokemonData?.defaultGender) {
            this.appState.gender = this.appState.pokemonData.defaultGender;
        } else {
            this.appState.gender = GENDER.MALE;
        }
        
        // Exotische Färbung - IMMER setzen (false/0 wenn nicht vorhanden)
        this.appState.isExoticColor = sheet.isExoticColor || false;
        this.appState.exoticHueRotation = sheet.exoticHueRotation || 0;
        
        // Benutzerdefinierte physische Werte - IMMER setzen (null wenn nicht vorhanden)
        this.appState.customHeight = sheet.customHeight || null;
        this.appState.customWeight = sheet.customWeight || null;
        this.appState.customRideability = sheet.customRideability || null;
    }
    
    /**
     * Wendet geladene Daten auf die UI an
     * @param {Object} sheet - Die geladenen Daten
     * @private
     */
    _applyLoadedSheetToUI(sheet) {
        if (!sheet) return;
        
        console.log('Wende geladene Daten auf UI an...');
        
        try {
            // Level
            const levelInput = document.getElementById('level-input');
            if (levelInput && sheet.level) {
                levelInput.value = sheet.level.toString();
            }
            
            // Erfahrung
            const expInput = document.getElementById('exp-input');
            if (expInput && sheet.currentExp !== undefined) {
                expInput.value = sheet.currentExp.toString();
            }
            
            // HP
            if (sheet.currentHp !== undefined) {
                const hpInput = document.getElementById('current-hp-input');
                if (hpInput) hpInput.value = sheet.currentHp.toString();
            }
            
            // GENA & PA
            const genaInput = document.getElementById('gena-input');
            if (genaInput && sheet.gena !== undefined) {
                genaInput.value = sheet.gena.toString();
            }
            
            const paInput = document.getElementById('pa-input');
            if (paInput && sheet.pa !== undefined) {
                paInput.value = sheet.pa.toString();
            }
            
            // BW
            const bwInput = document.getElementById('bw-input');
            if (bwInput && sheet.bw !== undefined) {
                bwInput.value = sheet.bw.toString();
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
            
            // Fertigkeiten - auch AppState synchronisieren!
            if (sheet.skillValues) {
                Object.entries(sheet.skillValues).forEach(([skill, value]) => {
                    // Normalisiere den Key (wichtig für Umlaute wie KÖ)
                    const normalizedSkill = skill.normalize('NFC');
                    
                    // Setze im AppState (mit Fallback für unterschiedliche Encodings)
                    if (this.appState.skillValues.hasOwnProperty(skill)) {
                        this.appState.setSkillValue(skill, value);
                    } else if (this.appState.skillValues.hasOwnProperty(normalizedSkill)) {
                        this.appState.setSkillValue(normalizedSkill, value);
                    } else {
                        // Fallback: Suche nach ähnlichem Key
                        const matchingKey = Object.keys(this.appState.skillValues).find(
                            k => k.normalize('NFC') === normalizedSkill
                        );
                        if (matchingKey) {
                            this.appState.setSkillValue(matchingKey, value);
                        }
                    }
                    
                    // Setze in der UI
                    let skillInput = document.querySelector(`input[data-skill="${skill}"]`);
                    if (!skillInput) {
                        // Fallback: Suche mit normalisiertem Key
                        skillInput = document.querySelector(`input[data-skill="${normalizedSkill}"]`);
                    }
                    if (skillInput) {
                        skillInput.value = value.toString();
                    }
                });
            }
            
            // Attacken
            this._applyMoves(sheet.moves);
            
            // Textfelder
            this._applyTextFields(sheet.textFields);
            
            // Freundschaft
            this._updateFriendshipDisplay();
            
            // Shiny-Modus UI aktualisieren
            if (sheet.isShiny !== undefined) {
                const spriteImg = document.getElementById('pokemon-sprite');
                const shinyToggleBtn = document.getElementById('shiny-toggle-btn');
                
                if (spriteImg && this.appState.pokemonData) {
                    const spriteUrl = sheet.isShiny && this.appState.pokemonData.sprites?.front_shiny
                        ? this.appState.pokemonData.sprites.front_shiny
                        : this.appState.pokemonData.sprites?.front_default;
                    if (spriteUrl) spriteImg.src = spriteUrl;
                }
                
                if (shinyToggleBtn) {
                    if (sheet.isShiny) {
                        shinyToggleBtn.classList.add('shiny-active');
                        shinyToggleBtn.title = 'Normale Farbe anzeigen';
                    } else {
                        shinyToggleBtn.classList.remove('shiny-active');
                        shinyToggleBtn.title = 'Shiny-Farbe anzeigen';
                    }
                    const textSpan = shinyToggleBtn.querySelector('.shiny-text');
                    if (textSpan) textSpan.textContent = sheet.isShiny ? 'Shiny' : 'Normal';
                }
            }
            
            // Geschlecht UI aktualisieren
            if (sheet.gender !== undefined) {
                const genderBadge = document.getElementById('gender-badge');
                if (genderBadge && GENDER_DISPLAY[sheet.gender]) {
                    const genderInfo = GENDER_DISPLAY[sheet.gender];
                    genderBadge.textContent = genderInfo.symbol;
                    genderBadge.style.color = genderInfo.color;
                    genderBadge.title = `${genderInfo.label} (Klicken zum Ändern)`;
                    genderBadge.className = `gender-badge gender-${sheet.gender}`;
                }
            }
            
            // Exotische Färbung UI aktualisieren
            if (sheet.isExoticColor !== undefined || sheet.exoticHueRotation !== undefined) {
                const spriteImg = document.getElementById('pokemon-sprite');
                const exoticToggleBtn = document.getElementById('exotic-color-toggle-btn');
                const sliderContainer = document.getElementById('exotic-hue-slider-container');
                const hueSlider = document.getElementById('exotic-hue-slider');
                const hueValueDisplay = document.getElementById('exotic-hue-value');
                
                const isExotic = sheet.isExoticColor || false;
                const hueRotation = sheet.exoticHueRotation || 0;
                
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
            
            // Benutzerdefinierte Größe
            if (sheet.customHeight) {
                const heightInput = document.getElementById('pokemon-height-input');
                if (heightInput) heightInput.value = sheet.customHeight;
            }
            
            // Benutzerdefiniertes Gewicht
            if (sheet.customWeight) {
                const weightInput = document.getElementById('pokemon-weight-input');
                if (weightInput) weightInput.value = sheet.customWeight;
            }
            
            // Benutzerdefinierte Reitbarkeit
            if (sheet.customRideability) {
                const rideabilityBadge = document.getElementById('rideability-badge');
                if (rideabilityBadge) {
                    const rideabilityInfo = {
                        'none': { labelShort: 'Nicht reitbar', icon: '🚫', cssClass: 'rideability-none' },
                        'land': { labelShort: 'Land', icon: '🏇', cssClass: 'rideability-land' },
                        'water': { labelShort: 'Wasser', icon: '🌊', cssClass: 'rideability-water' },
                        'fly': { labelShort: 'Fliegend', icon: '🦅', cssClass: 'rideability-fly' }
                    };
                    const info = rideabilityInfo[sheet.customRideability];
                    if (info) {
                        rideabilityBadge.className = `rideability-badge rideability-clickable ${info.cssClass}`;
                        rideabilityBadge.dataset.rideabilityType = sheet.customRideability;
                        const iconSpan = rideabilityBadge.querySelector('.rideability-icon');
                        const labelSpan = rideabilityBadge.querySelector('.rideability-label');
                        if (iconSpan) iconSpan.textContent = info.icon;
                        if (labelSpan) labelSpan.textContent = info.labelShort;
                    }
                }
            }
            
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
    // Bestehende appState-Referenz bewahren
    const existingAppState = window.pokemonApp?.appState;
    
    const app = new PokemonSheetApp();
    
    // App direkt als Referenz setzen, appState wiederherstellen falls nötig
    if (existingAppState) {
        app.appState = existingAppState;
    }
    window.pokemonApp = app;
    
    app.init();
});