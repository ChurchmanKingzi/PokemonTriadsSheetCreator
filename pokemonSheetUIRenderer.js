/**
 * Neue Klasse zur Verwaltung des UI-Renderings mit deutschen Übersetzungen
 * und separaten Buttons für JSON- und PDF-Export
 */
class UiRenderer {
    /**
     * Konstruktor
     * @param {AppState} appState - Die App-State-Instanz
     */
    constructor(appState) {
        this.appState = appState;
    }
    
    /**
     * Füllt das Pokemon-Auswahlmenü mit deutschen Namen
     */
    renderPokemonSelect() {
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        
        // Bestehende Optionen entfernen, außer der ersten
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        
        // Neue Optionen hinzufügen mit deutschen Namen
        this.appState.pokemonList.forEach((pokemon, index) => {
            const option = createElement('option', {
                value: pokemon.id // ID für API-Anfragen
            }, `#${index + 1} ${pokemon.germanName || capitalizeFirstLetter(pokemon.name)}`); // Deutscher Name anzeigen
            
            selectElement.appendChild(option);
        });
    }
    
    /**
     * Rendert das gesamte Pokemon-Sheet mit deutschen Namen
     */
    renderPokemonSheet() {
        if (!this.appState.pokemonData) {
            document.getElementById(DOM_IDS.SHEET_CONTAINER).innerHTML = '';
            return;
        }
        
        const container = document.getElementById(DOM_IDS.SHEET_CONTAINER);
        
        // Hauptcontainer erstellen
        const sheetElement = createElement('div', { className: 'pokemon-sheet' }, [
            this._createOverviewSection()
        ]);
        
        // Alles rendern
        container.innerHTML = '';
        container.appendChild(sheetElement);
        
        // Event-Listener hinzufügen
        this._addEventListeners();
        
        // Initial Level-Up Button Highlight prüfen
        this._updateLevelUpButtonHighlight();
        
        // Initial Stat-Auswahl Radio-Buttons setzen
        this._updatePrimaryStatSelection();
        this._updateSecondaryStatSelection();
    }
    
    /**
     * Aktualisiert die Attacken-Dropdown-Menüs mit deutschen Namen
     */
    updateMoveSelects() {
        const moveSelects = document.querySelectorAll('.move-select');
        
        moveSelects.forEach(select => {
            // Bestehende Optionen entfernen, außer der ersten
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Neue Optionen hinzufügen mit deutschen Namen
            this.appState.availableMoves.forEach(move => {
                const option = createElement('option', {
                    value: move.name // Englischer Name für Referenz
                }, move.getDisplayName()); // Deutscher Anzeigename mit Level
                
                select.appendChild(option);
            });
        });
    }
    
    /**
     * Aktualisiert die Details einer ausgewählten Attacke mit deutschen Namen
     * @param {number} index - Index des Attacken-Slots
     */
    updateMoveDetails(index) {
        const detailsContainer = document.getElementById(`move-details-${index}`);
        const descriptionContainer = document.getElementById(`move-description-container-${index}`);
        const move = this.appState.moves[index];
        
        if (!move) {
            detailsContainer.innerHTML = '';
            // Beschreibungs-Textbox verstecken und leeren, wenn keine Attacke ausgewählt
            if (descriptionContainer) {
                const descriptionTextarea = document.getElementById(`move-description-${index}`);
                if (descriptionTextarea) {
                    descriptionTextarea.value = '';
                }
            }
            return;
        }
        
        detailsContainer.innerHTML = '';
        
        // Typ mit deutschem Namen anzeigen
        detailsContainer.appendChild(
            createElement('span', { className: 'move-type' }, `Typ: ${move.germanType},`)
        );
        
        // Stärke im neuen Format anzeigen (XW6, wobei X 10% der Basisstärke ist, aufgerundet)
        if (move.power) {
            // Berechne 10% der Basisstärke und runde auf
            const scaledPower = Math.ceil(move.power * 0.1);
            
            detailsContainer.appendChild(
                createElement('span', { className: 'move-power' }, `Schaden: ${scaledPower}W6`)
            );
        } else {
            detailsContainer.appendChild(
                createElement('span', { className: 'move-power' }, `Schaden: 0`)
            );
        }
        
        // Beschreibungs-Textbox anzeigen, wenn eine Attacke ausgewählt ist
        if (descriptionContainer) {
            descriptionContainer.style.display = 'block';
            
            // Versuche gespeicherte Beschreibung wiederherzustellen, falls vorhanden
            if (move.customDescription) {
                const descriptionTextarea = document.getElementById(`move-description-${index}`);
                if (descriptionTextarea) {
                    descriptionTextarea.value = move.customDescription;
                }
            }
        }
    }

    /**
    * Erstellt den GENA/PA-Container
    * @returns {HTMLElement} Der GENA/PA-Container
    * @private
    */
    _createGenaPaContainer() {
        const { gena, pa, bw } = this.appState;
        
        return createElement('div', { className: 'gena-pa-container' }, [
            // GENA
            createElement('div', { className: 'stat-item gena-item' }, [
                createElement('span', { className: 'stat-name' }, 'GENA:'),
                createElement('input', {
                    type: 'number',
                    min: DEFAULT_VALUES.MIN_GENA_PA,
                    max: DEFAULT_VALUES.MAX_GENA_PA,
                    value: gena.toString(),
                    className: 'stat-input gena-input',
                    id: 'gena-input'
                })
            ]),
            
            // PA
            createElement('div', { className: 'stat-item pa-item' }, [
                createElement('span', { className: 'stat-name' }, 'PA:'),
                createElement('input', {
                    type: 'number',
                    min: DEFAULT_VALUES.MIN_GENA_PA,
                    max: DEFAULT_VALUES.MAX_GENA_PA,
                    value: pa.toString(),
                    className: 'stat-input pa-input',
                    id: 'pa-input'
                })
            ]),
            
            // BW (neu)
            createElement('div', { className: 'stat-item bw-item' }, [
                createElement('span', { className: 'stat-name' }, 'BW:'),
                createElement('input', {
                    type: 'number',
                    min: '0',
                    max: '99',
                    value: bw.toString(),
                    className: 'stat-input bw-input',
                    id: 'bw-input'
                })
            ])
        ]);
    }
    
    /**
     * Erstellt den Statuswerte-Bereich mit Level-Up-Funktionalität
     * Reihenfolge: KP/Initiative, dann Angriff/Verteidigung, dann Sp.Angriff/Sp.Verteidigung
     * @returns {HTMLElement} Der Statuswerte-Bereich
     * @private
     */
    _createStatsSection() {
        const { stats, currentHp } = this.appState;
        
        // Erstelle den Stats-Container mit neuer Reihenfolge
        const statsSection = createElement('div', { className: 'stats' }, [
            // Zeile 1: KP und Initiative
            createElement('div', { className: 'stat-item hp-item' }, [
                createElement('span', { className: 'stat-name' }, 'KP:'),
                createElement('div', { className: 'hp-inputs' }, [
                    createElement('input', {
                        type: 'number',
                        min: '0',
                        max: stats.hp.toString(),
                        value: currentHp.toString(),
                        className: 'stat-input current-hp-input',
                        id: 'current-hp-input'
                    }),
                    createElement('span', { className: 'hp-separator' }, '/'),
                    createElement('input', {
                        type: 'number',
                        min: DEFAULT_VALUES.MIN_STAT,
                        max: DEFAULT_VALUES.MAX_STAT,
                        value: stats.hp.toString(),
                        className: 'stat-input max-hp-input',
                        id: 'max-hp-input',
                        'data-stat': 'hp'
                    })
                ])
            ]),
            this._createEditableStatItem('Initiative', stats.speed, 'speed', 'speed-item'),
            
            // Zeile 2: Angriff und Verteidigung
            this._createEditableStatItem('Angriff', stats.attack, 'attack', 'attack-item'),
            this._createEditableStatItem('Verteidigung', stats.defense, 'defense', 'defense-item'),
            
            // Zeile 3: Spez. Angriff und Spez. Verteidigung
            this._createEditableStatItem('Spez. Angriff', stats.spAttack, 'spAttack', 'sp-attack-item'),
            this._createEditableStatItem('Spez. Verteidigung', stats.spDefense, 'spDefense', 'sp-defense-item')
        ]);
        
        return statsSection;
    }

    /**
     * Aktualisierte Methode für _createStatsArea in UiRenderer-Klasse
     * Die KP-Erstellung wurde entfernt, da sie jetzt Teil der Stats-Grid ist
     */
    _createStatsArea() {
        // Erstellen des Statuswerte-Bereichs
        const statsArea = createElement('div', { className: 'stats-area' }, [
            // Die Stats-Grid direkt ohne separaten HP-Bereich
            this._createStatsSection()
        ]);
        
        return statsArea;
    }
    
    
    /**
     * Erstellt ein editierbares Statuswert-Element
     * @param {string} name - Name des Statuswerts
     * @param {number} value - Wert des Statuswerts
     * @param {string} statKey - Schlüssel des Statuswerts im stats-Objekt
     * @param {string} className - Zusätzliche CSS-Klasse für das Element
     * @returns {HTMLElement} Das Statuswert-Element
     * @private
     */
    _createEditableStatItem(name, value, statKey, className = '') {
        return createElement('div', { className: `stat-item ${className}` }, [
            createElement('span', { className: 'stat-name' }, `${name}:`),
            createElement('input', {
                type: 'number',
                min: DEFAULT_VALUES.MIN_STAT,
                max: DEFAULT_VALUES.MAX_STAT,
                value: value.toString(),
                className: 'stat-input',
                'data-stat': statKey
            })
        ]);
    }
    
    /**
     * Erstellt den Attacken-Bereich mit deutschen Namen
     * @returns {HTMLElement} Der Attacken-Bereich
     * @private
     */
    _createMovesSection() {
        const movesSection = createElement('div', { className: 'moves-selection' }, [
            createElement('h3', { className: 'section-title' }, 'Attacken'),
            
            // Attacken-Grid
            createElement('div', { className: 'moves-grid' },
                Array.from({ length: DEFAULT_VALUES.MOVE_SLOTS }).map((_, index) => 
                    this._createMoveSlot(index)
                )
            )
        ]);
        
        return movesSection;
    }
    
    /**
     * Erstellt einen einzelnen Attacken-Slot
     * @param {number} index - Index des Slots
     * @returns {HTMLElement} Das Slot-Element
     * @private
     */
    _createMoveSlot(index) {
        return createElement('div', { className: 'move-slot' }, [
            createElement('label', {
                for: `move-${index}`,
                className: 'move-label'
            }, `Attacke ${index + 1}:`),
            
            createElement('select', {
                id: `move-${index}`,
                className: 'move-select',
                dataset: { index: index.toString() }
            }, [
                createElement('option', { value: '' }, '-- Attacke wählen --')
                // Weitere Optionen werden dynamisch hinzugefügt
            ]),
            
            createElement('div', {
                id: `move-details-${index}`,
                className: 'move-details'
            }),
            
            // Beschreibungs-Textbox (jetzt immer sichtbar)
            createElement('div', {
                id: `move-description-container-${index}`,
                className: 'move-description-container'
            }, [
                createElement('textarea', {
                    id: `move-description-${index}`,
                    className: 'move-description',
                    placeholder: 'Eigene Beschreibung eingeben...',
                    rows: 3
                })
            ])
        ]);
    }
    
    /**
     * Erstellt den Fertigkeiten-Bereich
     * @returns {HTMLElement} Der Fertigkeiten-Bereich
     * @private
     */
    _createSkillsSection() {
        const skillsSection = createElement('div', { className: 'skills-table' }, [
            createElement('h3', { className: 'section-title' }, 'Fertigkeiten'),
            
            // Skills-Grid
            createElement('div', { className: 'skills-grid' },
                Object.entries(SKILL_GROUPS).map(([category, skills]) => 
                    this._createSkillCategory(category, skills)
                )
            )
        ]);
        
        return skillsSection;
    }
    
    /**
     * Erstellt eine Fertigkeiten-Kategorie
     * @param {string} category - Name der Kategorie
     * @param {Array} skills - Liste der Fertigkeiten in der Kategorie
     * @returns {HTMLElement} Das Kategorie-Element
     * @private
     */
    _createSkillCategory(category, skills) {
        return createElement('div', { className: 'skill-category' }, [
            // Kategorie-Header
            createElement('div', { className: 'skill-header' }, [
                createElement('span', { className: 'category-name' }, category),
                createElement('input', {
                    type: 'number',
                    min: '-9',
                    max: '9',
                    value: this.appState.skillValues[category].toString(),
                    className: 'skill-input',
                    dataset: { skill: category }
                })
            ]),
            
            // Skills-Liste
            createElement('div', { className: 'skills-list' },
                skills.map(skill => 
                    createElement('div', { className: 'skill-item' }, [
                        createElement('span', { className: 'skill-name' }, skill),
                        createElement('input', {
                            type: 'number',
                            min: '-9',
                            max: '9',
                            value: this.appState.skillValues[skill].toString(),
                            className: 'skill-input',
                            dataset: { skill }
                        })
                    ])
                )
            )
        ]);
    }
    
    /**
     * Erstellt die Action-Buttons mit separaten Buttons für JSON- und PDF-Export
     * @returns {HTMLElement} Der Container mit den Action-Buttons
     * @private
     */
    _createActionButtons() {
        return createElement('div', { className: 'action-buttons' }, [
            // JSON-Export-Button
            createElement('button', {
                id: 'save-json-button',
                className: 'action-button save-button',
                title: 'Speichert den Charakterbogen als JSON-Datei'
            }, 'Speichern (JSON)'),
            
            // PDF-Export-Button
            createElement('button', {
                id: 'save-pdf-button',
                className: 'action-button save-button',
                title: 'Speichert den Charakterbogen als PDF-Datei',
                style: 'background-color: #4285F4; margin-right: 5px;'
            }, 'Speichern (PDF)'),
            
            // Load-Button
            createElement('button', {
                id: 'load-pokemon-button',
                className: 'action-button load-button',
                title: 'Lädt einen gespeicherten Charakterbogen'
            }, 'Pokémon Laden')
        ]);
    }
    
    /**
     * Fügt Event-Listener zu den interaktiven Elementen hinzu
     * @private
     */
    _addEventListeners() {
        // Funktion zum automatischen Speichern nach Änderungen
        const autoSave = () => {
            if (this.appState.pokemonData) {
                // Kleine Verzögerung, um UI-Updates abzuschließen
                setTimeout(() => {
                    const app = window.pokemonApp;
                    if (app && app.storageService) {
                        app.storageService.saveCurrentSheet();
                    }
                }, 500);
            }
        };
        
        this._addLevelUpEventListeners(autoSave);
        
        // Freundschafts-Strichliste initialisieren
        this._initFriendshipTally();

        // Event-Listener für Attacken
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.move-select', 'change', e => {
            const index = parseInt(e.target.dataset.index);
            const moveName = e.target.value;
            
            this.appState.setMove(index, moveName);
            this.updateMoveDetails(index);
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für Attackenbeschreibungen
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.move-description', 'input', e => {
            const index = parseInt(e.target.id.split('-')[2]);
            const description = e.target.value;
            
            // Beschreibung im Attacken-Objekt im AppState speichern
            if (this.appState.moves[index]) {
                this.appState.moves[index].customDescription = description;
                autoSave(); // Automatisch speichern
            }
        });
        
        // Event-Listener für Skills
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.skill-input', 'change', e => {
            const skill = e.target.dataset.skill;
            const value = e.target.value;
            
            if (!this.appState.setSkillValue(skill, value)) {
                e.target.value = this.appState.skillValues[skill];
            }
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für Statuswerte
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.stat-input', 'change', e => {
            if (e.target.dataset.stat) {
                const statName = e.target.dataset.stat;
                const value = e.target.value;
                
                if (!this.appState.setStat(statName, value)) {
                    e.target.value = this.appState.stats[statName];
                }
            }
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für aktuelle HP
        addEventListenerSafe('#current-hp-input', 'change', e => {
            const value = e.target.value;
            
            if (!this.appState.setCurrentHp(value)) {
                e.target.value = this.appState.currentHp;
            }
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für GENA
        addEventListenerSafe('#gena-input', 'change', e => {
            const value = e.target.value;
            
            if (!this.appState.setGena(value)) {
                e.target.value = this.appState.gena;
            }
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für PA
        addEventListenerSafe('#pa-input', 'change', e => {
            const value = e.target.value;
            
            if (!this.appState.setPa(value)) {
                e.target.value = this.appState.pa;
            }
            autoSave(); // Automatisch speichern
        });

        // Event-Listener für BW
        addEventListenerSafe('#bw-input', 'change', e => {
            const value = e.target.value;
            
            if (!this.appState.setBw(value)) {
                e.target.value = this.appState.bw;
            }
            autoSave(); // Automatisch speichern
        });

        // Event-Listener für Level-Änderung
        addEventListenerSafe('#level-value', 'change', e => {
            const value = e.target.value;
            
            if (!this.appState.setLevel(value)) {
                e.target.value = this.appState.level;
            } else {
                // Aktualisiere alle Statuswerte basierend auf dem neuen Level
                this._updateAllStats();
                
                // Aktualisiere das benötigte EXP basierend auf dem neuen Level
                const maxExpInput = document.getElementById('max-exp-input');
                if (maxExpInput) {
                    maxExpInput.value = (this.appState.level * this.appState.level).toString();
                }
            }
            autoSave(); // Automatisch speichern
        });

        // Event-Listener für aktuelle EXP-Änderung
        addEventListenerSafe('#current-exp-input', 'change', e => {
            const value = parseInt(e.target.value);
            
            // Validieren
            if (isNaN(value) || value < 0) {
                e.target.value = '0';
                return;
            }
            
            // Speichern im AppState
            if (this.appState.setCurrentExp) {
                this.appState.setCurrentExp(value);
                
                // Interface aktualisieren, falls ein Level-Up stattgefunden hat
                document.getElementById('level-value').value = this.appState.level.toString();
                document.getElementById('max-exp-input').value = (this.appState.level * this.appState.level).toString();
                e.target.value = this.appState.currentExp.toString();
            }
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für Trainer-Namen und andere Textfelder
        addEventListenerSafe('#trainer-input', 'change', autoSave);
        addEventListenerSafe('#nickname-input', 'change', autoSave);
        addEventListenerSafe('#item-input', 'change', autoSave);
        
        // Auch Input-Events für Echtzeit-Speicherung bei Textfeldern überwachen
        addEventListenerSafe('#trainer-input', 'input', autoSave);
        addEventListenerSafe('#nickname-input', 'input', autoSave);
        addEventListenerSafe('#item-input', 'input', autoSave);
        
        // Event-Listener für die Export/Import-Buttons
        this._addExportImportButtonListeners();
    }
    
    /**
     * Fügt Event-Listener für die Export/Import-Buttons hinzu
     * @private
     */
    _addExportImportButtonListeners() {
        // JSON-Export-Button
        addEventListenerSafe('#save-json-button', 'click', () => {
            if (window.jsonExportService) {
                window.jsonExportService.exportJSON();
            } else {
                this._showToast('JSON-Export-Service nicht verfügbar', 'error');
            }
        });
        
        // PDF-Export-Button
        addEventListenerSafe('#save-pdf-button', 'click', () => {
            if (window.pokemonApp && window.pokemonApp.pdfService) {
                window.pokemonApp.pdfService.exportPdf();
            } else {
                this._showToast('PDF-Export-Service nicht verfügbar', 'error');
            }
        });
        
        // Laden-Button
        addEventListenerSafe('#load-pokemon-button', 'click', () => {
            const fileInput = document.getElementById('json-file-input');
            if (fileInput) {
                fileInput.click();
            } else {
                this._showToast('JSON-Import nicht verfügbar', 'error');
            }
        });
    }
    
    /**
     * Zeigt eine Toast-Benachrichtigung an
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {string} type - Der Typ der Nachricht ('success' oder 'error')
     * @private
     */
    _showToast(message, type = 'success') {
        // Prüfen, ob bereits ein Toast angezeigt wird
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Toast-Element erstellen
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Zum Dokument hinzufügen
        document.body.appendChild(toast);
        
        // Nach einigen Sekunden entfernen
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
    

    /**
     * Erstellt den Übersichtsbereich des Pokemon-Sheets mit deutschen Namen und zusätzlichen Feldern
     * @returns {HTMLElement} Der Übersichtsbereich
     * @private
     */
    _createOverviewSection() {
        const { pokemonData, selectedPokemon } = this.appState;
        
        // Erstellen des Fähigkeiten-Bereichs
        const abilitiesSection = this._createAbilitiesSection();
    
        // Erstellen des Level-Up-Bereichs (für die obere linke Ecke)
        const levelUpSection = this._createLevelUpSection();
        
        // GENA und PA Container separat erstellen
        const genaPaContainer = this._createGenaPaContainer();
        
        // Erstellen des Attacken-Bereichs (für die rechte Seite auf gleicher Höhe wie Level-Up)
        const movesSection = this._createMovesSection();
        
        // Erstellen des Statuswerte-Bereichs
        const statsArea = this._createStatsArea();
        
        // Erstellen des Bild-Bereichs in der oberen rechten Ecke
        const imageArea = createElement('div', { className: 'pokemon-image-area' }, [
            // Pokemon-Bild
            createElement('div', { className: 'pokemon-image' }, [
                createElement('img', {
                    src: pokemonData.sprites.front_default,
                    alt: pokemonData.germanName || selectedPokemon,
                    className: 'sprite'
                })
            ])
        ]);
        
        // Kompakte Freundschafts-Anzeige erstellen
        const compactFriendshipTracker = this._createCompactFriendshipTracker();
        
        // Pokemon-Info ohne Freundschafts-Anzeige
        const pokemonInfoContainer = createElement('div', { className: 'pokemon-info-container' }, [
            // Pokemon-Info mit deutschem Namen
            createElement('div', { className: 'pokemon-info' }, [
                // Header mit Name
                createElement('div', { className: 'pokemon-header' }, [
                    createElement('h2', { className: 'pokemon-name' }, pokemonData.germanName || capitalizeFirstLetter(selectedPokemon))
                ]),
                
                // Neue Eingabefelder für Trainer, Spitzname und Item
                createElement('div', { className: 'trainer-fields' }, [
                    this._createTextField('Trainer', 'trainer-input'),
                    this._createTextField('Spitzname', 'nickname-input'),
                    this._createTextField('Item', 'item-input')
                ]),
                
                // Typen mit deutschen Namen
                createElement('div', { className: 'types' }, 
                    pokemonData.types.map(typeInfo => 
                        createElement('span', {
                            className: 'type-badge',
                            style: `background-color: ${TYPE_COLORS[typeInfo.type.name] || '#777777'}`
                        }, typeInfo.type.germanName || capitalizeFirstLetter(typeInfo.type.name))
                    )
                )
            ])
        ]);
        
        // Freundschafts-Bereich in eigener Spalte
        const friendshipColumn = createElement('div', { className: 'friendship-column' }, [
            compactFriendshipTracker
        ]);
        
        // Action-Buttons für JSON- und PDF-Export
        const actionButtons = this._createActionButtons();
        
        // Container erstellen mit Titel und Action-Buttons
        const headerContainer = createElement('div', { className: 'header-container' }, [
            createElement('h1', { className: 'title' }, 'Pokémon Charakterbogen'),
            actionButtons
        ]);
        
        // Basic-Info-Bereich mit zwei Spalten
        const basicInfo = createElement('div', { className: 'basic-info' }, [
            pokemonInfoContainer,
            friendshipColumn
        ]);
        
        // Level container with GENA/PA and Stats
        const levelContainer = createElement('div', { className: 'level-container' }, [
            levelUpSection,
            genaPaContainer,
            // Hier den Statuswerte-Bereich einfügen
            statsArea
        ]);
        
        // Überarbeitete Struktur
        const overviewSection = createElement('div', { className: 'pokemon-overview' }, [
            // Header-Container oben einfügen
            //headerContainer,
            
            // Basic info at top left (with friendship tracker inside)
            basicInfo,
            
            // Pokemon image in top right
            imageArea,
            
            // Level-up section with Stats inside
            levelContainer,
            
            // Moves section (Attacks)
            movesSection,
            
            // Abilities and Skills
            abilitiesSection,
            this._createSkillsSection()
        ]);
        
        // Verzögert den typabhängigen Hintergrund anwenden
        setTimeout(() => this._applyPokemonTypeBackground(), 100);
        
        return overviewSection;
    }

    /**
     * Erstellt ein Textfeld mit Label
     * @param {string} label - Label für das Textfeld
     * @param {string} id - ID für das Eingabefeld
     * @returns {HTMLElement} - Das erstellte Eingabefeld mit Label
     * @private
     */
    _createTextField(label, id) {
        return createElement('div', { className: 'text-field-container' }, [
            createElement('label', { for: id, className: 'text-field-label' }, `${label}:`),
            createElement('input', {
                type: 'text',
                id: id,
                className: 'text-field-input'
            })
        ]);
    }

    /**
     * Erstellt den Level-Up-Bereich mit Buttons und Würfelklasse
     * @returns {HTMLElement} Der Level-Up-Bereich
     */
    _createLevelUpSection() {
        const levelUpSection = createElement('div', { className: 'level-up-section' }, [
            // Obere Zeile mit Level-Anzeige und Würfelklasse
            createElement('div', { className: 'level-display-row' }, [
                // Würfelklasse (hier neu positioniert)
                createElement('div', { className: 'dice-class-container' }, [
                    createElement('span', { className: 'dice-class' }, this.appState.pokemonData.diceClass)
                ])
            ]),
        
            // Mittlere Zeile mit Level-Button und Level/EXP-Anzeige
            createElement('div', { className: 'level-controls-row' }, [
                // Level-Up-Button
                createElement('button', {
                    id: 'level-up-button',
                    className: 'level-up-button',
                    type: 'button'
                }, 'LEVEL UP!'),
                
                // Level-Anzeige (jetzt editierbar)
                createElement('div', { className: 'level-display' }, [
                    createElement('span', { className: 'level-label' }, 'Level:'),
                    createElement('input', {
                        type: 'number',
                        id: 'level-value',
                        className: 'level-value-input',
                        value: this.appState.level.toString(),
                        min: DEFAULT_VALUES.MIN_LEVEL,
                        max: DEFAULT_VALUES.MAX_LEVEL
                    })
                ]),
                
                // EXP-Anzeige (neu)
                createElement('div', { className: 'exp-display' }, [
                    createElement('span', { className: 'exp-label' }, 'EXP:'),
                    createElement('div', { className: 'exp-inputs' }, [
                        createElement('input', {
                            type: 'number',
                            id: 'current-exp-input',
                            className: 'exp-input current-exp-input',
                            value: this.appState.currentExp ? this.appState.currentExp.toString() : '0',
                            min: '0'
                        }),
                        createElement('span', { className: 'exp-separator' }, '/'),
                        createElement('input', {
                            type: 'number',
                            id: 'max-exp-input',
                            className: 'exp-input max-exp-input',
                            value: (this.appState.level * this.appState.level).toString(),
                            readonly: 'readonly'
                        })
                    ])
                ])
            ]),
        
            // Stat-Auswahl für Level-Up - Primäre Wahl
            createElement('div', { className: 'stat-selection' }, [
                createElement('div', { className: 'stat-selection-header' }, 'Erste Wahl (wenn zufälliger Stat ≠ diese):'),
            
                this._createStatRadioButton('hp', 'KP', this.appState.primaryStatChoice === 'hp', 'primary'),
                this._createStatRadioButton('speed', 'Initiative', this.appState.primaryStatChoice === 'speed', 'primary'),
                this._createStatRadioButton('attack', 'Angriff', this.appState.primaryStatChoice === 'attack', 'primary'),
                this._createStatRadioButton('defense', 'Verteidigung', this.appState.primaryStatChoice === 'defense', 'primary'),
                this._createStatRadioButton('spAttack', 'Sp. Angriff', this.appState.primaryStatChoice === 'spAttack', 'primary'),
                this._createStatRadioButton('spDefense', 'Sp. Verteidigung', this.appState.primaryStatChoice === 'spDefense', 'primary')
            ]),
            
            // Stat-Auswahl für Level-Up - Sekundäre Wahl
            createElement('div', { className: 'stat-selection stat-selection-secondary' }, [
                createElement('div', { className: 'stat-selection-header' }, 'Zweite Wahl (wenn zufälliger Stat = erste Wahl):'),
            
                this._createStatRadioButton('hp', 'KP', this.appState.secondaryStatChoice === 'hp', 'secondary'),
                this._createStatRadioButton('speed', 'Initiative', this.appState.secondaryStatChoice === 'speed', 'secondary'),
                this._createStatRadioButton('attack', 'Angriff', this.appState.secondaryStatChoice === 'attack', 'secondary'),
                this._createStatRadioButton('defense', 'Verteidigung', this.appState.secondaryStatChoice === 'defense', 'secondary'),
                this._createStatRadioButton('spAttack', 'Sp. Angriff', this.appState.secondaryStatChoice === 'spAttack', 'secondary'),
                this._createStatRadioButton('spDefense', 'Sp. Verteidigung', this.appState.secondaryStatChoice === 'spDefense', 'secondary')
            ])
        ]);

        return levelUpSection;
    }

    /**
     * Erstellt einen Radio-Button für die Stat-Auswahl
     * @param {string} value - Der Wert des Radio-Buttons
     * @param {string} label - Das Label des Radio-Buttons
     * @param {boolean} checked - Ob der Radio-Button ausgewählt sein soll
     * @param {string} group - Die Gruppe ('primary' oder 'secondary')
     * @returns {HTMLElement} Das Radio-Button-Element
     * @private
     */
    _createStatRadioButton(value, label, checked = false, group = 'primary') {
        const id = `stat-radio-${group}-${value}`;
        const name = group === 'primary' ? 'primary-stat' : 'secondary-stat';

        // Hier ist der kritische Teil, der sicherstellt, dass checked korrekt gesetzt wird
        const radioWrapper = createElement('div', { className: 'stat-radio-wrapper' }, [
            createElement('input', {
                type: 'radio',
                id,
                name,
                value,
                className: 'stat-radio',
                checked: checked
            }),
            createElement('label', { for: id, className: 'stat-radio-label' }, label)
        ]);
        
        return radioWrapper;
    }

    /**
     * Fügt Event-Listener für Level-Up hinzu
     * @param {Function} autoSave - Funktion zum automatischen Speichern
     * @private
     */
    _addLevelUpEventListeners(autoSave) {
        // Level-Up-Button
        addEventListenerSafe('#level-up-button', 'click', e => {
            // Prüfe ob Level-Up möglich ist
            if (!this.appState.canLevelUp()) {
                return;
            }
            
            // Führe Level-Ups durch, solange möglich
            const allResults = [];
            let levelUpResult;
            
            do {
                levelUpResult = this.appState.levelUp();
                
                if (levelUpResult) {
                    allResults.push(levelUpResult);
                }
            } while (levelUpResult && levelUpResult.canLevelUpAgain);
            
            // UI aktualisieren wenn mindestens ein Level-Up durchgeführt wurde
            if (allResults.length > 0) {
                const lastResult = allResults[allResults.length - 1];
                
                // Level-Anzeige aktualisieren
                const levelElement = document.getElementById('level-value');
                if (levelElement) {
                    levelElement.value = lastResult.newLevel.toString();
                }
                
                // Alle Statuswerte aktualisieren
                this._updateAllStats();
                
                // EXP-Anzeigen aktualisieren
                const currentExpInput = document.getElementById('current-exp-input');
                const maxExpInput = document.getElementById('max-exp-input');
                if (currentExpInput) {
                    currentExpInput.value = lastResult.newCurrentExp.toString();
                }
                if (maxExpInput) {
                    maxExpInput.value = lastResult.newRequiredExp.toString();
                }
                
                // Stat-Erhöhungen als Popups anzeigen (für alle Level-Ups)
                allResults.forEach((result, index) => {
                    // Verzögere die Anzeige für jeden Level-Up
                    setTimeout(() => {
                        this._showStatIncrease(result.firstRoll.stat, result.firstRoll.result.difference);
                        this._showStatIncrease(result.secondRoll.stat, result.secondRoll.result.difference);
                    }, index * 500);
                });
                
                // Button-Highlighting aktualisieren
                this._updateLevelUpButtonHighlight();
                
                // Automatisch speichern
                if (autoSave) {
                    autoSave();
                }
            }
        });
    
        // EXP-Input Listener für Button-Highlighting
        addEventListenerSafe('#current-exp-input', 'input', e => {
            this._updateLevelUpButtonHighlight();
        });
        
        addEventListenerSafe('#current-exp-input', 'change', e => {
            const value = e.target.value;
            this.appState.setCurrentExp(value);
            this._updateLevelUpButtonHighlight();
            
            if (autoSave) {
                autoSave();
            }
        });
    
        // Radio-Buttons für primäre Statauswahl
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, 'input[name="primary-stat"]', 'change', e => {
            this.appState.setPrimaryStatChoice(e.target.value);
            
            // UI aktualisieren falls die sekundäre Wahl automatisch korrigiert wurde
            this._updateSecondaryStatSelection();
            
            // Automatisch speichern
            if (autoSave) {
                autoSave();
            }
        });
        
        // Radio-Buttons für sekundäre Statauswahl
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, 'input[name="secondary-stat"]', 'change', e => {
            this.appState.setSecondaryStatChoice(e.target.value);
            
            // UI aktualisieren falls die Wahl automatisch korrigiert wurde
            this._updateSecondaryStatSelection();
            
            // Automatisch speichern
            if (autoSave) {
                autoSave();
            }
        });
    
        // Füge einen Listener für Typ-Änderungen hinzu
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Nach DOM-Änderungen die Typ-Farben anwenden
                    setTimeout(() => this._applyPokemonTypeBackground(), 200);
                }
            });
        });
    }
    
    /**
     * Aktualisiert die sekundäre Stat-Auswahl in der UI
     * Wird aufgerufen wenn die primäre Wahl geändert wird und die sekundäre automatisch angepasst wurde
     * @private
     */
    /**
     * Aktualisiert die primäre Stat-Auswahl in der UI
     * @private
     */
    _updatePrimaryStatSelection() {
        const primaryRadio = document.querySelector(`input[name="primary-stat"][value="${this.appState.primaryStatChoice}"]`);
        if (primaryRadio) {
            primaryRadio.checked = true;
        }
    }
    
    /**
     * Aktualisiert die sekundäre Stat-Auswahl in der UI
     * Wird aufgerufen wenn die primäre Wahl geändert wird und die sekundäre automatisch angepasst wurde
     * @private
     */
    _updateSecondaryStatSelection() {
        const secondaryRadio = document.querySelector(`input[name="secondary-stat"][value="${this.appState.secondaryStatChoice}"]`);
        if (secondaryRadio) {
            secondaryRadio.checked = true;
        }
    }
    
    /**
     * Aktualisiert das Highlighting des Level-Up-Buttons basierend auf EXP
     * @private
     */
    _updateLevelUpButtonHighlight() {
        const levelUpButton = document.getElementById('level-up-button');
        if (!levelUpButton) return;
        
        if (this.appState.canLevelUp()) {
            levelUpButton.classList.add('level-up-ready');
        } else {
            levelUpButton.classList.remove('level-up-ready');
        }
    }

    /**
     * Aktualisiert alle Statuswerte in der UI
     * @private
     */
    _updateAllStats() {
        // KP aktualisieren
        const currentHpInput = document.getElementById('current-hp-input');
        const maxHpInput = document.getElementById('max-hp-input');
        
        if (currentHpInput && maxHpInput) {
            currentHpInput.value = this.appState.currentHp.toString();
            currentHpInput.max = this.appState.stats.hp.toString();
            maxHpInput.value = this.appState.stats.hp.toString();
        }
        
        // Andere Statuswerte aktualisieren
        Object.entries(this.appState.stats).forEach(([statKey, statValue]) => {
            if (statKey !== 'hp') { // HP wurde bereits aktualisiert
                const statInput = document.querySelector(`input[data-stat="${statKey}"]`);
                if (statInput) {
                    statInput.value = statValue.toString();
                }
            }
        });
    }

    _showStatIncrease(statKey, increase) {
        // Finde das Input-Element für den Statuswert
        const statInput = statKey === 'hp' 
            ? document.getElementById('max-hp-input') 
            : document.querySelector(`input[data-stat="${statKey}"]`);
        
        if (!statInput) return;
        
        // Position des Inputs im Viewport bestimmen
        const rect = statInput.getBoundingClientRect();
        
        // Scroll-Offset hinzufügen für absolute Positionierung
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Erstelle das Animation-Element
        const bubbleElement = document.createElement('div');
        bubbleElement.className = 'stat-increase-bubble';
        bubbleElement.textContent = `+${increase}`;
        
        // Positioniere das Element absolut relativ zum Dokument (scrollt mit)
        bubbleElement.style.left = `${rect.left + scrollLeft + rect.width / 2 - 20}px`;
        bubbleElement.style.top = `${rect.top + scrollTop - 30}px`;
        
        // Füge das Element zum Dokument hinzu
        document.body.appendChild(bubbleElement);
        
        // Entferne das Element nach der Animation (verlängert auf 4 Sekunden)
        setTimeout(() => {
            if (document.body.contains(bubbleElement)) {
                document.body.removeChild(bubbleElement);
            }
        }, 4000);
    }

    /**
     * Gibt den Anzeigenamen eines Statuswerts zurück
     * @param {string} statKey - Der Schlüssel des Statuswerts
     * @returns {string} Der Anzeigename
     * @private
     */
    _getStatDisplayName(statKey) {
        const statNames = {
            hp: 'KP',
            attack: 'Angriff',
            defense: 'Verteidigung',
            spAttack: 'Sp. Angriff',
            spDefense: 'Sp. Verteidigung',
            speed: 'Initiative'
        };
        
        return statNames[statKey] || statKey;
    }

    /**
     * Erstellt den Fähigkeiten-Bereich mit Beschreibungen
     * @returns {HTMLElement} Der Fähigkeiten-Bereich
     * @private
     */
    _createAbilitiesSection() {
        const abilitiesSection = createElement('div', { className: 'abilities-section' }, [
            createElement('h3', { className: 'section-title' }, 'Fähigkeiten')
        ]);
        
        // Fähigkeiten aus dem AppState abrufen
        const abilities = this.appState.abilities || [];
        
        // Container für die Fähigkeiten
        const abilitiesContainer = createElement('div', { className: 'abilities-container' });
        
        // Jede Fähigkeit mit Beschreibung hinzufügen
        abilities.forEach((ability, index) => {
            // Prüfen, ob es sich um "Leer" handelt
            if (ability === "Leer") return; // Leere Fähigkeiten überspringen
            
            // Fähigkeitsbeschreibung abrufen
            let abilityDescription = "";
            try {
                abilityDescription = getAbilityDescription(ability) || "Keine Beschreibung verfügbar.";
            } catch (error) {
                abilityDescription = "Beschreibung konnte nicht geladen werden.";
            }
            
            // Bestimme eine Farbe basierend auf dem Namen der Fähigkeit
            const abilityColor = this._getAbilityColor(ability);
            
            // Fähigkeitseintrag erstellen
            const abilityItem = createElement('div', { 
                className: 'ability-item',
                style: `border-left-color: ${abilityColor}`
            }, [
                createElement('div', { className: 'ability-header' }, [
                    createElement('span', { 
                        className: 'ability-name',
                        style: `color: ${abilityColor}`
                    }, ability)
                ]),
                createElement('div', { className: 'ability-description' }, abilityDescription)
            ]);
            
            abilitiesContainer.appendChild(abilityItem);
        });
        
        abilitiesSection.appendChild(abilitiesContainer);
        return abilitiesSection;
    }
    
    _getAbilityColor(abilityName) {
        // Einfacher Hash des Namens, um eine konsistente Farbe zu generieren
        let hash = 0;
        for (let i = 0; i < abilityName.length; i++) {
            hash = abilityName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Farben aus dem abilityService abrufen, falls verfügbar
        const predefinedColor = getAbilityColor(abilityName);
        if (predefinedColor) {
            return predefinedColor;
        }
        
        // Ansonsten generiere eine zufällige aber konsistente Farbe
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 40%)`;
    }

    /**
     * Wendet typabhängigen Hintergrund auf das Pokémon-Bild an
     * @private
     */
    _applyPokemonTypeBackground() {
        // Pokémon-Bild Container finden
        const imageContainer = document.querySelector('.pokemon-image');
        if (!imageContainer) return;
        
        // Typ-Badges finden
        const typeBadges = document.querySelectorAll('.type-badge');
        if (!typeBadges || typeBadges.length === 0) return;
        
        // Alle vorherigen Typ-Klassen entfernen
        imageContainer.classList.remove('single-type', 'dual-type');
        
        // CSS-Variablen zurücksetzen
        imageContainer.style.removeProperty('--type-color');
        imageContainer.style.removeProperty('--primary-type-color');
        imageContainer.style.removeProperty('--secondary-type-color');
        
        if (typeBadges.length === 1) {
            // Einzelner Typ
            const typeColor = window.getComputedStyle(typeBadges[0]).backgroundColor;
            
            // Farbe entsättigen
            const desaturatedColor = this._desaturateColor(typeColor);
            
            imageContainer.classList.add('single-type');
            imageContainer.style.setProperty('--type-color', desaturatedColor);
        } else if (typeBadges.length >= 2) {
            // Dualer Typ
            const primaryTypeColor = window.getComputedStyle(typeBadges[0]).backgroundColor;
            const secondaryTypeColor = window.getComputedStyle(typeBadges[1]).backgroundColor;
            
            // Farben entsättigen
            const desaturatedPrimaryColor = this._desaturateColor(primaryTypeColor);
            const desaturatedSecondaryColor = this._desaturateColor(secondaryTypeColor);
            
            imageContainer.classList.add('dual-type');
            imageContainer.style.setProperty('--primary-type-color', desaturatedPrimaryColor);
            imageContainer.style.setProperty('--secondary-type-color', desaturatedSecondaryColor);
        }
    }

    /**
     * Hilfsmethode zum Entsättigen einer Farbe
     * @param {string} colorStr - Die zu entsättigende Farbe im RGB-Format, z.B. "rgb(123, 45, 67)"
     * @returns {string} Die entsättigte Farbe
     * @private
     */
    _desaturateColor(colorStr) {
        // RGB-Werte aus dem String extrahieren
        const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!rgbMatch) return colorStr; // Fallback bei Fehler
        
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        
        // Berechnung des Grauwerts als Durchschnitt von R, G, B
        const gray = (r + g + b) / 3;
        
        // Mischen der Originalfarbe mit dem Grauwert im Verhältnis 20:80
        // 20% Original, 80% Grau (starke Entsättigung)
        const mixFactor = 0.2; // 20% der Originalfarbe behalten
        
        const mixedR = Math.round(r * mixFactor + gray * (1 - mixFactor));
        const mixedG = Math.round(g * mixFactor + gray * (1 - mixFactor));
        const mixedB = Math.round(b * mixFactor + gray * (1 - mixFactor));
        
        // Zurück in RGB-String
        return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
    }


    /**
     * Neue Methode für die UiRenderer-Klasse, um die Freundschafts-Anzeige zu erstellen
     * Miniaturisierte Version, die in den Basic-Info-Bereich integriert werden kann
     */
    _createCompactFriendshipTracker() {
        // Container für die kompakte Freundschafts-Anzeige
        const compactFriendshipTracker = createElement('div', { className: 'compact-friendship-tracker' }, [
            // Überschrift mit Icon
            createElement('div', { className: 'compact-friendship-title' }, 'Freundschaft'),
            
            // Container für die Strichliste
            createElement('div', { 
                className: 'compact-tally-container',
                id: 'tally-container'
            }),
            
            // Kompakte Buttons in einer Zeile
            createElement('div', { className: 'compact-tally-buttons' }, [
                createElement('button', { 
                    className: 'compact-tally-button add-tally-button',
                    id: 'add-tally-button',
                    title: 'Strich hinzufügen'
                }, '+'),
                
                createElement('button', { 
                    className: 'compact-tally-button remove-tally-button',
                    id: 'remove-tally-button',
                    title: 'Strich entfernen'
                }, '-')
            ])
        ]);
        
        return compactFriendshipTracker;
    }
    /**
     * Initialisiert die Freundschafts-Strichliste
     * @private
     */
    _initFriendshipTally() {
        // Warten, bis das DOM geladen ist
        setTimeout(() => {
            const addTallyButton = document.getElementById('add-tally-button');
            const removeTallyButton = document.getElementById('remove-tally-button');
            const tallyContainer = document.getElementById('tally-container');
            
            if (!addTallyButton || !removeTallyButton || !tallyContainer) return;
            
            // Tally-Daten aus dem AppState lesen oder initialisieren
            if (!this.appState.tallyMarks) {
                this.appState.tallyMarks = [];
            }
            
            // Strichliste rendern
            this._renderTallyMarks();
            
            // Event-Listener für Hinzufügen-Button
            addTallyButton.addEventListener('click', () => {
                // Strich hinzufügen
                this.appState.tallyMarks.push('|');
                
                // Strichliste aktualisieren
                this._renderTallyMarks();
                
                // Auto-Save auslösen
                this._triggerAutoSave();
            });
            
            // Event-Listener für Entfernen-Button
            removeTallyButton.addEventListener('click', () => {
                // Letzten Strich entfernen, wenn vorhanden
                if (this.appState.tallyMarks.length > 0) {
                    this.appState.tallyMarks.pop();
                    
                    // Strichliste aktualisieren
                    this._renderTallyMarks();
                    
                    // Auto-Save auslösen
                    this._triggerAutoSave();
                }
            });
        }, 500);
    }
    /**
     * Hilfsmethode zum Auslösen der Auto-Save-Funktion
     * @private
     */
    _triggerAutoSave() {
        // Prüfen, ob pokemonApp verfügbar ist
        if (typeof window.pokemonApp === 'undefined' || !window.pokemonApp) {
            return;
        }
        
        // Prüfen, ob storageService verfügbar ist
        if (!window.pokemonApp.storageService) {
            return;
        }
        
        // Kleine Verzögerung, um UI-Updates abzuschließen
        setTimeout(() => {
            try {
                // Direkt die saveCurrentSheet-Methode des StorageService aufrufen
                window.pokemonApp.storageService.saveCurrentSheet();
            } catch (error) {
                console.error("Fehler beim Speichern des Charakterbogens:", error);
            }
        }, 100);
    }

    /**
     * Rendert die Strichliste
     * @private
     */
    _renderTallyMarks() {
        if (typeof window.renderTallyMarks === 'function') {
            window.renderTallyMarks(this.appState.tallyMarks);
        }
    }
}