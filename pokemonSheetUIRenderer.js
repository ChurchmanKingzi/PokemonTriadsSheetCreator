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
        
        // Statuseffekte aus dem AppState laden (falls vorhanden)
        if (this._statusEffectsComponent && this.appState.statusEffects) {
            this._statusEffectsComponent.setActiveStatuses(this.appState.statusEffects);
        }
        
        // Initial Level-Up Button Highlight prüfen
        this._updateLevelUpButtonHighlight();
        
        // Initial Stat-Auswahl Radio-Buttons setzen
        this._updatePrimaryStatSelection();
        this._updateSecondaryStatSelection();
    }
    
    /**
     * Aktualisiert die Attacken-Dropdown-Menüs mit deutschen Namen
     * Unterstützt Separatoren zwischen Kategorien und exklusive Slots
     * (gewählte Attacken werden in anderen Slots ausgegraut)
     */
    updateMoveSelects() {
        const moveSelects = document.querySelectorAll('.move-select');
        
        // Sammle alle aktuell ausgewählten Attacken (für exklusive Slots)
        const selectedMoveNames = new Set();
        this.appState.moves.forEach((move, idx) => {
            if (move && move.name) {
                selectedMoveNames.add(move.name);
            }
        });
        
        moveSelects.forEach((select, selectIndex) => {
            // Aktuell ausgewählten Wert merken
            const currentValue = select.value;
            
            // Bestehende Optionen entfernen, außer der ersten
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Neue Optionen hinzufügen mit deutschen Namen
            this.appState.availableMoves.forEach(move => {
                // Separator-Behandlung
                if (move.isSeparator) {
                    const separator = createElement('option', {
                        value: '',
                        disabled: 'disabled',
                        className: 'move-separator'
                    }, move.label);
                    separator.style.fontWeight = 'bold';
                    separator.style.backgroundColor = '#e0e0e0';
                    separator.style.color = '#666';
                    select.appendChild(separator);
                    return;
                }
                
                // Prüfen ob diese Attacke in einem anderen Slot ausgewählt ist
                const isSelectedElsewhere = selectedMoveNames.has(move.name) && 
                    this.appState.moves[selectIndex]?.name !== move.name;
                
                const option = createElement('option', {
                    value: move.name // Englischer Name für Referenz
                }, move.getDisplayName()); // Deutscher Anzeigename mit Lernmethode
                
                // Wenn in anderem Slot ausgewählt, deaktivieren
                if (isSelectedElsewhere) {
                    option.disabled = true;
                }
                
                select.appendChild(option);
            });
            
            // Vorherigen Wert wiederherstellen, falls noch gültig
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }
    
    /**
     * Aktualisiert alle Move-Selects nach einer Auswahländerung
     * (für exklusive Slots - deaktiviert bereits gewählte Attacken in anderen Slots)
     */
    refreshMoveSelectsExclusivity() {
        this.updateMoveSelects();
    }
    
    /**
     * Aktualisiert die Details einer ausgewählten Attacke mit deutschen Namen
     * @param {number} index - Index des Attacken-Slots
     */
    updateMoveDetails(index) {
        const detailsContainer = document.getElementById(`move-details-${index}`);
        const descriptionContainer = document.getElementById(`move-description-container-${index}`);
        const move = this.appState.moves[index];
        
        // Slot-Farbe basierend auf dem Attacken-Typ aktualisieren
        this._updateMoveSlotColor(index, move);
        
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
        
        // Beschreibungs-Textbox anzeigen und befüllen, wenn eine Attacke ausgewählt ist
        if (descriptionContainer) {
            descriptionContainer.style.display = 'block';
            const descriptionTextarea = document.getElementById(`move-description-${index}`);
            
            if (descriptionTextarea) {
                // Prüfe ob eine benutzerdefinierte Beschreibung existiert
                if (move.customDescription) {
                    descriptionTextarea.value = move.customDescription;
                } else {
                    // Versuche Beschreibung aus moveService zu laden
                    const germanMoveName = move.germanName || move.name;
                    if (typeof getMoveDescription === 'function') {
                        const serviceDescription = getMoveDescription(germanMoveName);
                        if (serviceDescription && !serviceDescription.includes('Keine Beschreibung für')) {
                            descriptionTextarea.value = serviceDescription;
                            // Speichere die Beschreibung im Move-Objekt
                            move.customDescription = serviceDescription;
                        } else {
                            descriptionTextarea.value = '';
                        }
                    } else {
                        descriptionTextarea.value = '';
                    }
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
        
        // Hilfsfunktion zum Erstellen eines Stat-Items mit Icon
        const createStatItemWithIcon = (itemClass, iconClass, iconSvg, label, inputId, inputClass, value, min, max, title = '') => {
            const item = createElement('div', { className: `stat-item ${itemClass}` });
            
            // Label mit Icon
            const nameSpan = createElement('span', { className: 'stat-name' });
            const iconSpan = document.createElement('span');
            iconSpan.className = `stat-icon ${iconClass}`;
            iconSpan.innerHTML = iconSvg;
            nameSpan.appendChild(iconSpan);
            nameSpan.appendChild(document.createTextNode(label));
            
            // Input
            const input = createElement('input', {
                type: 'number',
                min: min.toString(),
                max: max.toString(),
                value: value.toString(),
                className: `stat-input ${inputClass}`,
                id: inputId,
                title: title
            });
            
            item.appendChild(nameSpan);
            item.appendChild(input);
            return item;
        };
        
        // SVG-Icons (gleiche wie im Trainer-Interface)
        const icons = {
            gena: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>',
            pa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>',
            bw: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 3c-2.25 0-4.5 1.5-7.5 1.5S7.25 3 4.5 3C3 3 2 4 2 5.5v12c0 1.5 1 2.5 2.5 2.5 2.25 0 4.5-1.5 7.5-1.5s5.25 1.5 7.5 1.5c1.5 0 2.5-1 2.5-2.5v-12C22 4 21 3 19.5 3zM12 17c-2.62 0-5.17.75-7.5 1.5.67-2.5 1.75-5.5 3-7.5 1-1.5 2.5-3.5 4.5-3.5s3.5 2 4.5 3.5c1.25 2 2.33 5 3 7.5-2.33-.75-4.88-1.5-7.5-1.5z"/></svg>'
        };
        
        return createElement('div', { className: 'gena-pa-container' }, [
            // GENA/PA/BW Stats
            createElement('div', { className: 'gena-pa-stats' }, [
                createStatItemWithIcon('gena-item', 'stat-icon-gena', icons.gena, 'GENA:', 'gena-input', 'gena-input', gena, DEFAULT_VALUES.MIN_GENA_PA, DEFAULT_VALUES.MAX_GENA_PA),
                createStatItemWithIcon('pa-item', 'stat-icon-pa', icons.pa, 'PA:', 'pa-input', 'pa-input', pa, DEFAULT_VALUES.MIN_GENA_PA, DEFAULT_VALUES.MAX_GENA_PA),
                createStatItemWithIcon('bw-item', 'stat-icon-bw', icons.bw, 'BW:', 'bw-input', 'bw-input', bw, 0, 999, this.appState.getBwTooltip ? this.appState.getBwTooltip() : '')
            ]),
            // Utility-Buttons direkt daneben
            createElement('div', { className: 'gena-pa-utility-buttons' }, [
                createElement('button', {
                    type: 'button',
                    className: 'stat-utility-btn full-heal-btn',
                    id: 'full-heal-btn',
                    title: 'KP vollständig wiederherstellen'
                }, '❤️ Heilen'),
                createElement('button', {
                    type: 'button',
                    className: 'stat-utility-btn reset-all-temps-btn',
                    id: 'reset-all-temps-btn',
                    title: 'Alle temporären Kampfwert-Modifikationen zurücksetzen'
                }, '↺ Reset')
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
        
        // Prüfen ob KP 0 sind für initiale Klasse
        const hpZeroClass = currentHp === 0 ? ' hp-zero' : '';
        
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
                        className: `stat-input current-hp-input${hpZeroClass}`,
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
                    }),
                    // +/-10% Buttons
                    createElement('div', { className: 'hp-percent-buttons' }, [
                        createElement('button', {
                            type: 'button',
                            className: 'hp-percent-btn hp-damage',
                            id: 'hp-minus-10',
                            title: '-10% KP'
                        }, '-10%'),
                        createElement('button', {
                            type: 'button',
                            className: 'hp-percent-btn hp-heal',
                            id: 'hp-plus-10',
                            title: '+10% KP'
                        }, '+10%')
                    ])
                ])
            ]),
            this._createEditableStatItem('Initiative', stats.speed, 'speed', 'speed-item'),
            
            // Zeile 2: Angriff und Verteidigung (mit Modifikatoren)
            this._createModifiableStatItem('Angriff', stats.attack, 'attack', 'attack-item'),
            this._createModifiableStatItem('Verteidigung', stats.defense, 'defense', 'defense-item'),
            
            // Zeile 3: Spez. Angriff und Spez. Verteidigung (mit Modifikatoren)
            this._createModifiableStatItem('Spez. Ang.', stats.spAttack, 'spAttack', 'sp-attack-item'),
            this._createModifiableStatItem('Spez. Vert.', stats.spDefense, 'spDefense', 'sp-defense-item')
            // Utility-Buttons sind jetzt im GENA/PA-Container
        ]);
        
        return statsSection;
    }
    
    /**
     * Erstellt ein modifizierbares Kampfwert-Element mit temporären Modifikatoren
     * Kompaktes Layout: Name | Wert | Reset | − | ±Input | + alles in einer Zeile
     * @param {string} name - Name des Statuswerts
     * @param {number} permaValue - Permanenter Wert des Statuswerts
     * @param {string} statKey - Schlüssel des Statuswerts im stats-Objekt
     * @param {string} className - Zusätzliche CSS-Klasse für das Element
     * @returns {HTMLElement} Das Statuswert-Element
     * @private
     */
    _createModifiableStatItem(name, permaValue, statKey, className = '') {
        const tempMod = this.appState.getTempStatModifier(statKey);
        const effectiveValue = permaValue + tempMod;
        
        // Bestimme die Farbe basierend auf dem Vergleich
        let valueColorClass = '';
        if (tempMod > 0) {
            valueColorClass = 'stat-boosted';
        } else if (tempMod < 0) {
            valueColorClass = 'stat-reduced';
        }
        
        return createElement('div', { className: `stat-item modifiable-stat-item ${className}` }, [
            createElement('span', { className: 'stat-name' }, `${name}:`),
            // Hauptwert (editierbar, zeigt effektiven Wert)
            createElement('input', {
                type: 'number',
                min: DEFAULT_VALUES.MIN_STAT,
                max: DEFAULT_VALUES.MAX_STAT,
                value: effectiveValue.toString(),
                className: `stat-input stat-effective-value ${valueColorClass}`,
                'data-stat': statKey,
                'data-perma-value': permaValue.toString(),
                id: `stat-${statKey}`
            }),
            // Einzelner Reset-Button für diesen Stat
            createElement('button', {
                type: 'button',
                className: 'stat-reset-btn',
                'data-stat': statKey,
                title: `${name} auf Perma-Wert zurücksetzen`
            }, '↺'),
            // Minus-Button (rot)
            createElement('button', {
                type: 'button',
                className: 'stat-mod-btn stat-mod-minus',
                'data-stat': statKey,
                title: 'Wert verringern'
            }, '−'),
            // Input für den Modifikator-Betrag
            createElement('input', {
                type: 'number',
                min: '0',
                max: '9999',
                value: '',
                placeholder: '±',
                className: 'stat-mod-input',
                'data-stat': statKey,
                id: `mod-input-${statKey}`
            }),
            // Plus-Button (grün)
            createElement('button', {
                type: 'button',
                className: 'stat-mod-btn stat-mod-plus',
                'data-stat': statKey,
                title: 'Wert erhöhen'
            }, '+')
        ]);
    }
    
    // _createStatUtilityButtons wurde entfernt - Buttons sind jetzt im GENA/PA-Container

    /**
     * Aktualisierte Methode für _createStatsArea in UiRenderer-Klasse
     * Die KP-Erstellung wurde entfernt, da sie jetzt Teil der Stats-Grid ist
     */
    _createStatsArea() {
        // Erstellen des Statuswerte-Bereichs
        const statsArea = createElement('div', { className: 'stats-area' }, [
            // Die Stats-Grid direkt ohne separaten HP-Bereich
            this._createStatsSection(),
            // Statuseffekte-Container
            this._createStatusEffectsSection()
        ]);
        
        return statsArea;
    }
    
    /**
     * Erstellt den Statuseffekte-Bereich für Pokemon
     * @returns {HTMLElement} Der Statuseffekte-Container
     * @private
     */
    _createStatusEffectsSection() {
        // StatusEffectsComponent für Pokemon erstellen
        if (!this._statusEffectsComponent) {
            this._statusEffectsComponent = new StatusEffectsComponent({
                isPokemon: true,
                containerId: 'pokemon-status-effects',
                onStatusChange: (statuses) => {
                    // AppState aktualisieren
                    if (this.appState) {
                        this.appState.statusEffects = statuses;
                    }
                    // Auto-Save triggern
                    if (window.pokemonStorageService) {
                        window.pokemonStorageService.triggerAutoSave();
                    }
                }
            });
        }
        
        // Element erstellen und zurückgeben
        return this._statusEffectsComponent.createStatusEffectsElement();
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
        // Direkt das Attacken-Grid ohne zusätzlichen Container
        const movesGrid = createElement('div', { className: 'moves-grid' },
            Array.from({ length: DEFAULT_VALUES.MOVE_SLOTS }).map((_, index) => 
                this._createMoveSlot(index)
            )
        );
        
        return movesGrid;
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
        // Aktuellen Modus vom Service holen
        const isTotalMode = window.skillDisplayModeService?.isTotalMode() || false;
        
        // Toggle-Button erstellen
        const toggleButton = createElement('button', {
            type: 'button',
            id: 'skill-display-mode-toggle',
            className: `skill-display-mode-toggle ${isTotalMode ? 'mode-total' : 'mode-individual'}`,
            title: isTotalMode 
                ? 'Gesamtwerte-Modus aktiv (Fertigkeit + Grundwert)\nKlicken für Einzelwerte'
                : 'Einzelwerte-Modus aktiv\nKlicken für Gesamtwerte (Fertigkeit + Grundwert)'
        }, isTotalMode ? 'Σ' : '#');
        
        // Header-Container mit Titel und Toggle-Button
        const headerContainer = createElement('div', { className: 'skills-header-container' }, [
            createElement('h3', { className: 'section-title skills-title' }, 'Fertigkeiten'),
            toggleButton
        ]);
        
        const skillsSection = createElement('div', { className: 'skills-table' }, [
            headerContainer,
            
            // Skills-Grid
            createElement('div', { className: 'skills-grid' },
                Object.entries(SKILL_GROUPS).map(([category, skills]) => 
                    this._createSkillCategory(category, skills)
                )
            )
        ]);
        
        return skillsSection;
    }
    
    // ==================== NOTIZEN-SEKTION ====================
    
    /**
     * Erstellt die Notizen-Sektion
     * @returns {HTMLElement} Die Notizen-Sektion
     * @private
     */
    _createNotesSection() {
        const notes = this.appState.getNotes ? this.appState.getNotes() : [];
        
        // Falls keine Notizen vorhanden, eine leere hinzufügen
        if (notes.length === 0 && this.appState.addNote) {
            this.appState.addNote('Notizen', '');
        }
        
        const notesList = createElement('div', { 
            className: 'notes-list',
            id: 'pokemon-notes-list'
        });
        
        // Notizen rendern
        const currentNotes = this.appState.getNotes ? this.appState.getNotes() : [];
        currentNotes.forEach((note, index) => {
            const noteElement = this._createNoteItem(note, index);
            notesList.appendChild(noteElement);
        });
        
        // Header mit Add-Button
        const headerRow = createElement('div', { className: 'notes-header-row' }, [
            createElement('button', {
                type: 'button',
                className: 'notes-add-btn',
                id: 'add-note-btn',
                title: 'Neue Notiz hinzufügen'
            }, [
                createElement('span', {}, '+'),
                createElement('span', {}, 'Notiz hinzufügen')
            ])
        ]);
        
        return createElement('div', { className: 'notes-section-container' }, [
            headerRow,
            notesList
        ]);
    }
    
    /**
     * Erstellt ein einzelnes Notiz-Element
     * @param {Object} note - Die Notiz-Daten
     * @param {number} index - Der Index der Notiz
     * @returns {HTMLElement} Das Notiz-Element
     * @private
     */
    _createNoteItem(note, index) {
        const isCollapsed = note.isCollapsed || false;
        
        const noteItem = createElement('div', {
            className: `note-item${isCollapsed ? ' collapsed' : ''}`,
            'data-note-id': note.id,
            'data-note-index': index.toString(),
            draggable: 'true'
        });
        
        // Header mit Drag-Handle, Toggle, Name-Input und Remove-Button
        const header = createElement('div', { className: 'note-header' }, [
            createElement('span', { className: 'note-drag-handle' }, '⋮⋮'),
            createElement('button', {
                type: 'button',
                className: 'note-toggle',
                'data-note-id': note.id,
                title: 'Ein-/Ausklappen'
            }, '▼'),
            createElement('input', {
                type: 'text',
                className: 'note-name-input',
                value: note.name,
                'data-note-id': note.id,
                placeholder: 'Notiz-Name...'
            }),
            createElement('button', {
                type: 'button',
                className: 'note-remove-btn',
                'data-note-id': note.id,
                title: 'Notiz entfernen'
            }, '✕')
        ]);
        
        // Content mit Textarea
        const content = createElement('div', { className: 'note-content' }, [
            createElement('textarea', {
                className: 'note-textarea',
                'data-note-id': note.id,
                placeholder: 'Notizen hier eingeben...'
            }, note.content || '')
        ]);
        
        noteItem.appendChild(header);
        noteItem.appendChild(content);
        
        return noteItem;
    }
    
    /**
     * Aktualisiert die Notizen-Liste im DOM
     * @private
     */
    _refreshNotesList() {
        const notesList = document.getElementById('pokemon-notes-list');
        if (!notesList) return;
        
        notesList.innerHTML = '';
        
        const notes = this.appState.getNotes ? this.appState.getNotes() : [];
        notes.forEach((note, index) => {
            const noteElement = this._createNoteItem(note, index);
            notesList.appendChild(noteElement);
        });
        
        // Event-Listener werden durch Event-Delegation automatisch übernommen
        // Nur Drag & Drop muss neu initialisiert werden
        this._initNotesDragDrop(notesList, this._autoSaveCallback);
    }
    
    // ==================== EINKLAPPBARE SEKTIONEN ====================
    
    /**
     * Erstellt eine einklappbare Sektion mit Drag & Drop
     * @param {string} sectionId - ID der Sektion
     * @param {string} title - Titel der Sektion
     * @param {HTMLElement|Array} content - Inhalt der Sektion
     * @param {Object} options - Zusätzliche Optionen
     * @returns {HTMLElement} Die Sektion
     * @private
     */
    _createCollapsibleSection(sectionId, title, content, options = {}) {
        const isCollapsed = this.appState.isSectionCollapsed 
            ? this.appState.isSectionCollapsed(sectionId) 
            : false;
        
        const canCollapse = options.canCollapse !== false;
        const canDrag = options.canDrag !== false;
        
        const section = createElement('div', {
            className: `pokemon-section section-${sectionId}${isCollapsed ? ' collapsed' : ''}`,
            'data-section-id': sectionId
            // Kein natives draggable - wir verwenden Custom Drag & Drop
        });
        
        // Header mit Toggle, Titel und Drag-Handle
        const header = createElement('div', { 
            className: 'pokemon-section-header',
            style: 'cursor: pointer'  // Klicken ist Hauptaktion, langes Drücken = Drag
        }, [
            createElement('button', {
                type: 'button',
                className: 'pokemon-section-toggle',
                'data-section-id': sectionId,
                title: 'Ein-/Ausklappen',
                style: canCollapse ? '' : 'visibility: hidden'
            }, '▼'),
            createElement('span', { className: 'pokemon-section-title' }, title),
            ...(canDrag ? [createElement('span', { 
                className: 'pokemon-section-drag-handle',
                title: 'Ziehen zum Verschieben'
            }, '⋮⋮')] : [])
        ]);
        
        // Content-Container
        const contentContainer = createElement('div', { className: 'pokemon-section-content' });
        
        if (Array.isArray(content)) {
            content.forEach(child => {
                if (child) contentContainer.appendChild(child);
            });
        } else if (content) {
            contentContainer.appendChild(content);
        }
        
        section.appendChild(header);
        section.appendChild(contentContainer);
        
        return section;
    }

    /**
     * Erstellt eine Fertigkeiten-Kategorie mit Farbcodierung und Plus-Button
     * @param {string} category - Name der Kategorie
     * @param {Array} skills - Liste der Fertigkeiten in der Kategorie
     * @returns {HTMLElement} Das Kategorie-Element
     * @private
     */
    _createSkillCategory(category, skills) {
        // Farben für Kategorien
        const categoryColors = {
            'KÖ': '#e53e3e', // Rot
            'WI': '#3182ce', // Blau
            'CH': '#d69e2e', // Gelb/Gold
            'GL': '#38a169'  // Grün
        };
        
        const color = categoryColors[category] || '#718096';
        
        // Custom Skills für diese Kategorie holen
        const customSkills = this.appState.getCustomSkills ? 
            this.appState.getCustomSkills(category) : [];
        
        // Skills-Liste erstellen
        const skillsList = createElement('div', { className: 'skills-list' });
        
        // Standard-Skills hinzufügen
        skills.forEach(skill => {
            const baseValue = this.appState.skillValues[skill] || 0;
            const displayInfo = window.skillDisplayModeService?.getDisplayValue(
                skill, baseValue, this.appState.skillValues
            ) || { displayValue: baseValue, isTotal: false };
            
            const skillInput = createElement('input', {
                type: 'number',
                min: '-9',
                max: '99',
                value: displayInfo.displayValue.toString(),
                className: `skill-input${displayInfo.isTotal ? ' skill-total-mode' : ''}`,
                dataset: { 
                    skill,
                    baseValue: baseValue.toString()
                }
            });
            
            skillsList.appendChild(
                createElement('div', { className: 'skill-item' }, [
                    createElement('span', { className: 'skill-name' }, skill),
                    skillInput
                ])
            );
        });
        
        // Benutzerdefinierte Skills hinzufügen
        customSkills.forEach((customSkill, index) => {
            const baseValue = customSkill.value || 0;
            // Custom Skills nutzen die Kategorie direkt für den Gesamtwert
            const displayInfo = window.skillDisplayModeService?.getDisplayValueForCustomSkill(
                category, baseValue, this.appState.skillValues
            ) || { displayValue: baseValue, isTotal: false };
            
            const customSkillItem = createElement('div', { 
                className: 'skill-item custom-skill-item',
                dataset: { category, customIndex: index.toString() }
            }, [
                createElement('input', {
                    type: 'text',
                    value: customSkill.name,
                    className: 'skill-name-input custom-skill-name',
                    dataset: { category, customIndex: index.toString() },
                    placeholder: 'Neue Fertigkeit'
                }),
                createElement('input', {
                    type: 'number',
                    min: '-9',
                    max: '99',
                    value: displayInfo.displayValue.toString(),
                    className: `skill-input custom-skill-value${displayInfo.isTotal ? ' skill-total-mode' : ''}`,
                    dataset: { 
                        category, 
                        customIndex: index.toString(),
                        baseValue: baseValue.toString(),
                        isCustomSkill: 'true'
                    }
                }),
                createElement('button', {
                    type: 'button',
                    className: 'custom-skill-remove-btn',
                    dataset: { category, customIndex: index.toString() },
                    title: 'Fertigkeit entfernen'
                }, '×')
            ]);
            skillsList.appendChild(customSkillItem);
        });
        
        // Plus-Button für neue Skills
        const addButton = createElement('button', {
            type: 'button',
            className: 'add-custom-skill-btn',
            dataset: { category },
            style: `background-color: ${color}; border-color: ${color};`,
            title: `Neue ${category}-Fertigkeit hinzufügen`
        }, '+');
        
        return createElement('div', { 
            className: 'skill-category',
            dataset: { category }
        }, [
            // Kategorie-Header
            createElement('div', { className: 'skill-header' }, [
                createElement('span', { className: 'category-name' }, category),
                createElement('input', {
                    type: 'number',
                    min: '-9',
                    max: '9',
                    value: this.appState.skillValues[category].toString(),
                    className: 'skill-input base-stat-input',
                    dataset: { skill: category }
                })
            ]),
            
            // Skills-Liste
            skillsList,
            
            // Plus-Button Container
            createElement('div', { className: 'add-skill-container' }, [addButton])
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
                        app.storageService.saveCurrentPokemon();
                    }
                }, 500);
            }
        };
        
        this._addLevelUpEventListeners(autoSave);
        
        // Würfelklassen-Events initialisieren
        this._initDiceClassEvents(autoSave);
        
        // Freundschafts-Strichliste initialisieren
        this._initFriendshipTally();
        
        // Geschlechts-Badge Event-Listener initialisieren
        this._initGenderEvents(autoSave);
        
        // Entwicklungs-Feature initialisieren
        this._initEvolutionFeature();

        // Event-Listener für Attacken
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.move-select', 'change', e => {
            const index = parseInt(e.target.dataset.index);
            const moveName = e.target.value;
            
            this.appState.setMove(index, moveName);
            this.updateMoveDetails(index);
            
            // Alle Move-Selects aktualisieren für exklusive Slots
            this.refreshMoveSelectsExclusivity();
            
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
            } else {
                // Bei Änderung eines Grundwerts (KÖ, WI, CH, GL):
                // Abhängige Fertigkeiten im Gesamtwerte-Modus aktualisieren
                const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
                if (baseStats.includes(skill)) {
                    // Fertigkeiten dieser Kategorie aktualisieren
                    this._updateSkillDisplaysForCategory(skill);
                    
                    // BW nur bei KÖ-Änderung neu berechnen
                    if (skill === 'KÖ') {
                        this.appState.recalculateBw();
                        // BW-Input im UI aktualisieren
                        const bwInput = document.getElementById('bw-input');
                        if (bwInput) {
                            bwInput.value = this.appState.bw.toString();
                            // Tooltip aktualisieren
                            if (this.appState.getBwTooltip) {
                                bwInput.title = this.appState.getBwTooltip();
                            }
                        }
                    }
                }
            }
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für Plus-Buttons (benutzerdefinierte Fertigkeiten hinzufügen)
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.add-custom-skill-btn', 'click', e => {
            const category = e.target.dataset.category;
            if (category && this.appState.addCustomSkill) {
                this.appState.addCustomSkill(category);
                // Skills-Sektion neu rendern
                this._refreshSkillsSection();
                autoSave();
            }
        });
        
        // Event-Listener für Custom-Skill-Name Änderungen
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.custom-skill-name', 'change', e => {
            const category = e.target.dataset.category;
            const index = parseInt(e.target.dataset.customIndex, 10);
            const name = e.target.value.trim();
            
            if (this.appState.updateCustomSkill) {
                this.appState.updateCustomSkill(category, index, { name });
                autoSave();
            }
        });
        
        // Event-Listener für Custom-Skill-Wert Änderungen
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.custom-skill-value', 'change', e => {
            const category = e.target.dataset.category;
            const index = parseInt(e.target.dataset.customIndex, 10);
            const value = parseInt(e.target.value, 10);
            
            if (this.appState.updateCustomSkill) {
                this.appState.updateCustomSkill(category, index, { value });
                autoSave();
            }
        });
        
        // Event-Listener für Custom-Skill entfernen
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.custom-skill-remove-btn', 'click', e => {
            const category = e.target.dataset.category;
            const index = parseInt(e.target.dataset.customIndex, 10);
            
            if (this.appState.removeCustomSkill) {
                this.appState.removeCustomSkill(category, index);
                // Skills-Sektion neu rendern
                this._refreshSkillsSection();
                autoSave();
            }
        });
        
        // Event-Listener für Statuswerte
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.stat-input', 'change', e => {
            if (e.target.dataset.stat) {
                const statName = e.target.dataset.stat;
                let value = parseInt(e.target.value, 10);
                
                // Für modifizierbare Stats: temporären Modifikator abziehen,
                // damit der eingegebene Wert als EFFEKTIVER Wert interpretiert wird
                // und der korrekte permanente Wert berechnet wird
                const modifiableStats = ['attack', 'defense', 'spAttack', 'spDefense'];
                let tempMod = 0;
                if (modifiableStats.includes(statName)) {
                    tempMod = this.appState.getTempStatModifier(statName);
                    value = value - tempMod;
                }
                
                if (!this.appState.setStat(statName, value)) {
                    // Bei Fehler: effektiven Wert wiederherstellen (perma + tempMod)
                    const currentPerma = this.appState.stats[statName] || 0;
                    e.target.value = currentPerma + tempMod;
                } else {
                    // Nach erfolgreichem Setzen: dataset.permaValue aktualisieren
                    if (modifiableStats.includes(statName)) {
                        e.target.dataset.permaValue = value.toString();
                    }
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
            
            // HP-Zero Klasse aktualisieren
            this._updateHpZeroState();
            
            autoSave(); // Automatisch speichern
        });
        
        // Event-Listener für -10% HP Button
        addEventListenerSafe('#hp-minus-10', 'click', () => {
            const maxHp = this.appState.stats.hp;
            const damage = Math.max(1, Math.round(maxHp * 0.1)); // Mindestens 1 Schaden
            const newHp = Math.max(0, this.appState.currentHp - damage);
            this.appState.setCurrentHp(newHp);
            
            const currentHpInput = document.getElementById('current-hp-input');
            if (currentHpInput) currentHpInput.value = newHp;
            
            // HP-Zero Klasse aktualisieren
            this._updateHpZeroState();
            
            autoSave();
        });
        
        // Event-Listener für +10% HP Button
        addEventListenerSafe('#hp-plus-10', 'click', () => {
            const maxHp = this.appState.stats.hp;
            const heal = Math.max(1, Math.round(maxHp * 0.1)); // Mindestens 1 Heilung
            const newHp = Math.min(maxHp, this.appState.currentHp + heal);
            this.appState.setCurrentHp(newHp);
            
            const currentHpInput = document.getElementById('current-hp-input');
            if (currentHpInput) currentHpInput.value = newHp;
            
            // HP-Zero Klasse aktualisieren
            this._updateHpZeroState();
            
            autoSave();
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
        
        // Event-Listener für Größe und Gewicht (editierbar)
        addEventListenerSafe('#pokemon-height-input', 'change', e => {
            this.appState.setCustomHeight(e.target.value);
            autoSave();
        });
        addEventListenerSafe('#pokemon-height-input', 'input', autoSave);
        
        addEventListenerSafe('#pokemon-weight-input', 'change', e => {
            this.appState.setCustomWeight(e.target.value);
            autoSave();
        });
        addEventListenerSafe('#pokemon-weight-input', 'input', autoSave);
        
        // Event-Listener für Reitbarkeits-Klick (Links- und Rechtsklick)
        this._addRideabilityEventListeners(autoSave);
        
        // Event-Listener für Shiny-Toggle
        this._addShinyToggleEventListener(autoSave);
        
        // Event-Listener für Exotische Färbung
        this._addExoticColorEventListeners(autoSave);
        
        // Event-Listener für Kampfwert-Modifikatoren
        this._addStatModifierEventListeners(autoSave);
        
        // Event-Listener für die Export/Import-Buttons
        this._addExportImportButtonListeners();
        
        // Event-Listener für Skill-Display-Mode-Toggle
        this._addSkillDisplayModeListeners(autoSave);
        
        // Event-Listener für Notizen
        this._initNotesEventListeners(autoSave);
        
        // Event-Listener für einklappbare Sektionen und Drag & Drop
        this._initSectionEventListeners(autoSave);
    }
    
    /**
     * Initialisiert Event-Listener für die Notizen-Sektion
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _initNotesEventListeners(autoSave) {
        const self = this;
        const container = document.getElementById(DOM_IDS.SHEET_CONTAINER);
        if (!container) return;
        
        // autoSave-Callback speichern für spätere Verwendung
        this._autoSaveCallback = autoSave;
        
        // Notiz hinzufügen
        const addBtn = document.getElementById('add-note-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (self.appState.addNote) {
                    self.appState.addNote('Neue Notiz', '');
                    self._refreshNotesList();
                    if (autoSave) autoSave();
                }
            });
        }
        
        // Event-Delegation für Notizen-Interaktionen
        const notesList = document.getElementById('pokemon-notes-list');
        if (notesList) {
            // Toggle-Button
            notesList.addEventListener('click', (e) => {
                const toggleBtn = e.target.closest('.note-toggle');
                if (toggleBtn) {
                    const noteId = toggleBtn.dataset.noteId;
                    const noteItem = toggleBtn.closest('.note-item');
                    if (noteItem && self.appState.updateNote) {
                        const isCollapsed = !noteItem.classList.contains('collapsed');
                        noteItem.classList.toggle('collapsed', isCollapsed);
                        self.appState.updateNote(noteId, { isCollapsed });
                        if (autoSave) autoSave();
                    }
                }
                
                // Remove-Button
                const removeBtn = e.target.closest('.note-remove-btn');
                if (removeBtn) {
                    const noteId = removeBtn.dataset.noteId;
                    if (self.appState.removeNote) {
                        // Mindestens eine Notiz behalten
                        const notes = self.appState.getNotes ? self.appState.getNotes() : [];
                        if (notes.length > 1) {
                            self.appState.removeNote(noteId);
                            self._refreshNotesList();
                            if (autoSave) autoSave();
                        }
                    }
                }
            });
            
            // Name-Input
            notesList.addEventListener('input', (e) => {
                if (e.target.classList.contains('note-name-input')) {
                    const noteId = e.target.dataset.noteId;
                    if (self.appState.updateNote) {
                        self.appState.updateNote(noteId, { name: e.target.value });
                    }
                }
                
                // Textarea
                if (e.target.classList.contains('note-textarea')) {
                    const noteId = e.target.dataset.noteId;
                    if (self.appState.updateNote) {
                        self.appState.updateNote(noteId, { content: e.target.value });
                    }
                }
            });
            
            // Blur für Auto-Save
            notesList.addEventListener('blur', (e) => {
                if (e.target.classList.contains('note-name-input') || 
                    e.target.classList.contains('note-textarea')) {
                    if (autoSave) autoSave();
                }
            }, true);
            
            // Drag & Drop für Notizen
            this._initNotesDragDrop(notesList, autoSave);
        }
    }
    
    /**
     * Initialisiert Drag & Drop für Notizen
     * @param {HTMLElement} notesList - Die Notizen-Liste
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _initNotesDragDrop(notesList, autoSave) {
        const self = this;
        let draggedNote = null;
        let isDragFromHandle = false;
        
        // Tracken ob mousedown auf Handle war
        notesList.addEventListener('mousedown', (e) => {
            const dragHandle = e.target.closest('.note-drag-handle');
            isDragFromHandle = !!dragHandle;
        });
        
        notesList.addEventListener('dragstart', (e) => {
            const noteItem = e.target.closest('.note-item');
            
            // Drag nur erlauben wenn von Handle gestartet
            if (!isDragFromHandle) {
                e.preventDefault();
                return;
            }
            
            if (noteItem) {
                draggedNote = noteItem;
                noteItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', noteItem.dataset.noteId);
            }
        });
        
        notesList.addEventListener('dragend', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                noteItem.classList.remove('dragging');
                draggedNote = null;
            }
            isDragFromHandle = false;
            
            // Alle drag-over Klassen entfernen
            notesList.querySelectorAll('.note-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        });
        
        notesList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const noteItem = e.target.closest('.note-item');
            if (noteItem && noteItem !== draggedNote) {
                noteItem.classList.add('drag-over');
            }
        });
        
        notesList.addEventListener('dragleave', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                noteItem.classList.remove('drag-over');
            }
        });
        
        notesList.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetNote = e.target.closest('.note-item');
            if (targetNote && draggedNote && targetNote !== draggedNote) {
                const fromIndex = parseInt(draggedNote.dataset.noteIndex, 10);
                const toIndex = parseInt(targetNote.dataset.noteIndex, 10);
                
                if (self.appState.reorderNotes) {
                    self.appState.reorderNotes(fromIndex, toIndex);
                    self._refreshNotesList();
                    if (autoSave) autoSave();
                }
            }
            
            // Alle drag-over Klassen entfernen
            notesList.querySelectorAll('.note-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        });
    }
    
    /**
     * Initialisiert Custom Drag & Drop für die Sektionen
     * Verwendet ein eigenes System statt natives HTML5 Drag & Drop für bessere Kontrolle.
     * - Kurzer Klick auf Header: Collapse/Expand
     * - Langes Drücken auf Header: Drag starten
     * - Drag-Handle: Sofort Drag (ohne Wartezeit)
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _initSectionEventListeners(autoSave) {
        const self = this;
        const sectionsContainer = document.getElementById('pokemon-sections-container');
        if (!sectionsContainer) return;
        
        const DRAG_THRESHOLD = 5; // Pixel bevor Drag startet
        const HOLD_DELAY = 200; // Millisekunden bis Drag aktiviert wird
        
        // State-Variablen
        let isDragging = false;
        let dragStarted = false;
        let draggedSection = null;
        let dragClone = null;
        let placeholder = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;
        let holdTimer = null;
        let dragEnabled = false;
        
        const sections = sectionsContainer.querySelectorAll('.pokemon-section');
        
        // Natives Drag & Drop deaktivieren
        sections.forEach(section => {
            section.setAttribute('draggable', 'false');
        });
        
        // Hilfsfunktion: Finde die Section unter dem Cursor
        const getSectionAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('pokemon-section') && el !== dragClone) {
                    return el;
                }
                const parentSection = el.closest('.pokemon-section');
                if (parentSection && parentSection !== dragClone && sectionsContainer.contains(parentSection)) {
                    return parentSection;
                }
            }
            return null;
        };
        
        // Hilfsfunktion: Toggle Collapse
        const toggleCollapse = (section) => {
            const sectionId = section.dataset.sectionId;
            const isNowCollapsed = !section.classList.contains('collapsed');
            section.classList.toggle('collapsed', isNowCollapsed);
            
            const toggleBtn = section.querySelector('.pokemon-section-toggle');
            if (toggleBtn) {
                toggleBtn.title = isNowCollapsed ? 'Ausklappen' : 'Einklappen';
            }
            
            if (self.appState.setSectionCollapsed) {
                self.appState.setSectionCollapsed(sectionId, isNowCollapsed);
                if (autoSave) autoSave();
            }
        };
        
        // ========== MOUSE MOVE (global für diesen Drag) ==========
        const onMouseMove = (e) => {
            if (!isDragging || !draggedSection) return;
            
            // Drag nur wenn aktiviert (nach Hold-Delay oder Drag-Handle)
            if (!dragEnabled) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            // Prüfe ob Drag-Schwelle überschritten wurde
            if (!dragStarted && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                dragStarted = true;
                
                // Clone erstellen
                draggedSection.classList.add('dragging');
                
                dragClone = draggedSection.cloneNode(true);
                dragClone.classList.remove('dragging');
                dragClone.classList.add('pokemon-section-drag-clone');
                
                const rect = draggedSection.getBoundingClientRect();
                
                // Offset berechnen: Cursor-Position relativ zum Element
                offsetX = startX - rect.left;
                offsetY = startY - rect.top;
                
                dragClone.style.cssText = `
                    position: fixed;
                    left: ${rect.left}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
                    opacity: 0.95;
                    background: #f9fafb;
                    border-radius: 8px;
                `;
                
                document.body.appendChild(dragClone);
                
                // Placeholder erstellen
                placeholder = document.createElement('div');
                placeholder.className = 'pokemon-section-placeholder';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.margin = '8px 0';
                placeholder.style.border = '2px dashed #3b82f6';
                placeholder.style.borderRadius = '8px';
                placeholder.style.background = 'rgba(59, 130, 246, 0.1)';
                
                draggedSection.parentNode.insertBefore(placeholder, draggedSection);
                draggedSection.style.display = 'none';
                
                document.body.style.cursor = 'grabbing';
            }
            
            // Clone-Position aktualisieren
            if (dragStarted && dragClone) {
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                
                // Ziel-Section finden und Placeholder positionieren
                const targetSection = getSectionAtPosition(e.clientX, e.clientY);
                
                if (targetSection && targetSection !== draggedSection) {
                    const rect = targetSection.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        if (placeholder.nextSibling !== targetSection) {
                            targetSection.parentNode.insertBefore(placeholder, targetSection);
                        }
                    } else {
                        if (placeholder.previousSibling !== targetSection) {
                            targetSection.parentNode.insertBefore(placeholder, targetSection.nextSibling);
                        }
                    }
                }
            }
        };
        
        // ========== MOUSE UP (global für diesen Drag) ==========
        const onMouseUp = (e) => {
            // Timer abbrechen
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
            
            if (!isDragging) return;
            
            // Event-Listener entfernen
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            const wasOnDragHandle = e.target.closest('.pokemon-section-drag-handle');
            
            if (dragStarted && draggedSection && placeholder) {
                // Drag wurde durchgeführt - Section an Placeholder-Position einfügen
                placeholder.parentNode.insertBefore(draggedSection, placeholder);
                
                // Aufräumen
                if (dragClone && dragClone.parentNode) {
                    dragClone.remove();
                }
                if (placeholder && placeholder.parentNode) {
                    placeholder.remove();
                }
                
                draggedSection.style.display = '';
                draggedSection.classList.remove('dragging', 'drag-ready');
                
                // Neue Reihenfolge speichern
                const newOrder = Array.from(sectionsContainer.querySelectorAll('.pokemon-section'))
                    .map(s => s.dataset.sectionId);
                
                if (self.appState.setSectionOrder) {
                    self.appState.setSectionOrder(newOrder);
                    if (autoSave) autoSave();
                }
            } else if (draggedSection) {
                // Kein Drag gestartet
                draggedSection.classList.remove('dragging', 'drag-ready');
                
                // Wenn kein Drag und nicht auf Drag-Handle: Collapse toggeln
                if (!dragEnabled && !wasOnDragHandle) {
                    toggleCollapse(draggedSection);
                }
            }
            
            document.body.style.cursor = '';
            isDragging = false;
            dragStarted = false;
            dragEnabled = false;
            draggedSection = null;
            dragClone = null;
            placeholder = null;
        };
        
        // ========== MOUSE DOWN auf Header ==========
        sectionsContainer.querySelectorAll('.pokemon-section').forEach(section => {
            const header = section.querySelector('.pokemon-section-header');
            if (!header) return;
            
            header.addEventListener('mousedown', (e) => {
                // Nicht starten wenn auf Button geklickt wurde
                if (e.target.closest('button')) return;
                
                // Verhindere Text-Selektion
                e.preventDefault();
                
                const isOnDragHandle = e.target.closest('.pokemon-section-drag-handle');
                
                isDragging = true;
                dragStarted = false;
                dragEnabled = isOnDragHandle; // Sofort aktiviert wenn auf Drag-Handle
                draggedSection = section;
                startX = e.clientX;
                startY = e.clientY;
                
                // Wenn nicht auf Drag-Handle: Timer starten für verzögerten Drag
                if (!isOnDragHandle) {
                    holdTimer = setTimeout(() => {
                        if (isDragging && draggedSection) {
                            dragEnabled = true;
                            // Visuelles Feedback dass Drag jetzt möglich ist
                            draggedSection.classList.add('drag-ready');
                            document.body.style.cursor = 'grabbing';
                        }
                    }, HOLD_DELAY);
                }
                
                // Globale Event-Listener hinzufügen
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }
    
    /**
     * Fügt Event-Listener für den Fertigkeiten-Anzeigemodus hinzu
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _addSkillDisplayModeListeners(autoSave) {
        const self = this;
        
        // Toggle-Button Click-Handler - Event-Delegation, damit es nach _refreshSkillsSection funktioniert
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.skill-display-mode-toggle', 'click', function(e) {
            console.log('Toggle-Button geklickt!');
            if (!window.skillDisplayModeService) {
                console.error('skillDisplayModeService nicht verfügbar!');
                return;
            }
            
            const newMode = window.skillDisplayModeService.toggleMode();
            console.log('Neuer Modus:', newMode);
            
            // Skills-Sektion neu rendern
            self._refreshSkillsSection();
            
            // Auch Trainer-Sheet aktualisieren falls vorhanden
            if (window.trainerApp && window.trainerApp.uiRenderer) {
                window.trainerApp.uiRenderer._refreshSkillsSection?.();
            }
        });
        
        // Focus-Handler: Bei Fokus zeige den Basiswert (nicht Gesamtwert)
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.skill-input:not(.base-stat-input)', 'focus', function(e) {
            if (!window.skillDisplayModeService?.isTotalMode()) return;
            
            const input = e.target;
            const skill = input.dataset.skill;
            const category = input.dataset.category;
            const baseValue = input.dataset.baseValue;
            
            // Funktioniert für beide: normale Skills (haben skill) und Custom Skills (haben category)
            if ((skill || category) && baseValue !== undefined) {
                // Speichere aktuellen Display-Wert und zeige Basiswert
                input.dataset.displayValue = input.value;
                input.value = baseValue;
                input.classList.remove('skill-total-mode');
                input.classList.add('skill-editing');
            }
        });
        
        // Blur-Handler: Bei Blur zeige wieder den Gesamtwert (wenn im Total-Mode)
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.skill-input:not(.base-stat-input)', 'blur', function(e) {
            if (!window.skillDisplayModeService?.isTotalMode()) return;
            
            const input = e.target;
            const skill = input.dataset.skill;
            const category = input.dataset.category;
            const isCustomSkill = input.dataset.isCustomSkill === 'true';
            
            // Berechne und zeige den neuen Gesamtwert
            const skillValue = parseInt(input.value, 10) || 0;
            let displayInfo;
            
            if (isCustomSkill && category) {
                // Custom Skill - nutze Kategorie direkt
                displayInfo = window.skillDisplayModeService.getDisplayValueForCustomSkill(
                    category, skillValue, self.appState.skillValues
                );
            } else if (skill) {
                // Normaler Skill - nutze Skill-Namen
                displayInfo = window.skillDisplayModeService.getDisplayValue(
                    skill, skillValue, self.appState.skillValues
                );
            } else {
                return;
            }
            
            input.value = displayInfo.displayValue;
            input.dataset.baseValue = skillValue.toString();
            input.classList.remove('skill-editing');
            
            if (displayInfo.isTotal) {
                input.classList.add('skill-total-mode');
            }
        });
    }
    
    /**
     * Fügt Event-Listener für die Reitbarkeits-Umschaltung hinzu
     * Linksklick: Vorwärts durch die Modi
     * Rechtsklick: Rückwärts durch die Modi
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _addRideabilityEventListeners(autoSave) {
        const self = this;
        
        // Reitbarkeits-Badge Klick-Handler
        const rideabilityBadge = document.getElementById('rideability-badge');
        if (!rideabilityBadge) return;
        
        // Linksklick: Vorwärts
        rideabilityBadge.addEventListener('click', () => {
            const newType = self.appState.cycleRideability(false);
            self._updateRideabilityDisplay(newType);
            autoSave();
        });
        
        // Rechtsklick: Rückwärts
        rideabilityBadge.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Kontextmenü verhindern
            const newType = self.appState.cycleRideability(true);
            self._updateRideabilityDisplay(newType);
            autoSave();
        });
    }
    
    /**
     * Aktualisiert die Reitbarkeits-Anzeige nach einem Wechsel
     * @param {string} newType - Der neue Reitbarkeits-Typ
     * @private
     */
    _updateRideabilityDisplay(newType) {
        const rideabilityBadge = document.getElementById('rideability-badge');
        if (!rideabilityBadge) return;
        
        // Reitbarkeits-Definitionen
        const rideabilityInfo = {
            'none': {
                label: 'Kann nicht geritten werden',
                labelShort: 'Nicht reitbar',
                icon: '🚫',
                cssClass: 'rideability-none'
            },
            'land': {
                label: 'Kann an Land geritten werden',
                labelShort: 'Land',
                icon: '🏇',
                cssClass: 'rideability-land'
            },
            'water': {
                label: 'Kann im Wasser geritten werden',
                labelShort: 'Wasser',
                icon: '🌊',
                cssClass: 'rideability-water'
            },
            'fly': {
                label: 'Kann geflogen werden',
                labelShort: 'Fliegend',
                icon: '🦅',
                cssClass: 'rideability-fly'
            }
        };
        
        const info = rideabilityInfo[newType] || rideabilityInfo['none'];
        
        // CSS-Klassen aktualisieren
        rideabilityBadge.className = `rideability-badge rideability-clickable ${info.cssClass}`;
        rideabilityBadge.dataset.rideabilityType = newType;
        rideabilityBadge.title = `${info.label}\n\nLinksklick: Nächster Modus\nRechtsklick: Vorheriger Modus`;
        
        // Icon und Label aktualisieren
        const iconSpan = rideabilityBadge.querySelector('.rideability-icon');
        const labelSpan = rideabilityBadge.querySelector('.rideability-label');
        
        if (iconSpan) iconSpan.textContent = info.icon;
        if (labelSpan) labelSpan.textContent = info.labelShort;
    }
    
    /**
     * Fügt Event-Listener für den Shiny-Toggle hinzu
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _addShinyToggleEventListener(autoSave) {
        const self = this;
        const shinyToggleBtn = document.getElementById('shiny-toggle-btn');
        
        if (!shinyToggleBtn) return;
        
        shinyToggleBtn.addEventListener('click', () => {
            const isNowShiny = self.appState.toggleShiny();
            self._updateShinyDisplay(isNowShiny);
            autoSave();
        });
    }
    
    /**
     * Aktualisiert die Sprite-Anzeige nach Shiny-Toggle
     * @param {boolean} isShiny - Ob Shiny angezeigt werden soll
     * @private
     */
    _updateShinyDisplay(isShiny) {
        const { pokemonData } = this.appState;
        const spriteImg = document.getElementById('pokemon-sprite');
        const shinyToggleBtn = document.getElementById('shiny-toggle-btn');
        
        if (spriteImg && pokemonData) {
            // Sprite-URL aktualisieren
            const newSpriteUrl = isShiny && pokemonData.sprites.front_shiny
                ? pokemonData.sprites.front_shiny
                : pokemonData.sprites.front_default;
            spriteImg.src = newSpriteUrl;
        }
        
        if (shinyToggleBtn) {
            // Button-Stil aktualisieren
            if (isShiny) {
                shinyToggleBtn.classList.add('shiny-active');
                shinyToggleBtn.title = 'Normale Farbe anzeigen';
            } else {
                shinyToggleBtn.classList.remove('shiny-active');
                shinyToggleBtn.title = 'Shiny-Farbe anzeigen';
            }
            
            // Text aktualisieren
            const textSpan = shinyToggleBtn.querySelector('.shiny-text');
            if (textSpan) {
                textSpan.textContent = isShiny ? 'Shiny' : 'Normal';
            }
        }
    }
    
    /**
     * Fügt Event-Listener für Exotische Färbung hinzu
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _addExoticColorEventListeners(autoSave) {
        const self = this;
        const exoticToggleBtn = document.getElementById('exotic-color-toggle-btn');
        const hueSlider = document.getElementById('exotic-hue-slider');
        
        if (exoticToggleBtn) {
            exoticToggleBtn.addEventListener('click', () => {
                const isNowExotic = self.appState.toggleExoticColor();
                self._updateExoticColorDisplay(isNowExotic);
                autoSave();
            });
        }
        
        if (hueSlider) {
            hueSlider.addEventListener('input', (e) => {
                const hueValue = parseInt(e.target.value, 10);
                self.appState.setExoticHueRotation(hueValue);
                self._updateExoticHueRotation(hueValue);
                // Kein autoSave bei input, da zu häufig
            });
            
            hueSlider.addEventListener('change', () => {
                // Nur bei change (Loslassen) speichern
                autoSave();
            });
        }
    }
    
    /**
     * Aktualisiert die Anzeige nach Exotische-Färbung-Toggle
     * @param {boolean} isExotic - Ob exotische Färbung aktiv ist
     * @private
     */
    _updateExoticColorDisplay(isExotic) {
        const spriteImg = document.getElementById('pokemon-sprite');
        const exoticToggleBtn = document.getElementById('exotic-color-toggle-btn');
        const sliderContainer = document.getElementById('exotic-hue-slider-container');
        
        if (spriteImg) {
            if (isExotic) {
                spriteImg.style.filter = `hue-rotate(${this.appState.exoticHueRotation}deg)`;
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
            if (textSpan) {
                textSpan.textContent = isExotic ? 'Exotisch' : 'Normal';
            }
        }
        
        if (sliderContainer) {
            sliderContainer.style.visibility = isExotic ? 'visible' : 'hidden';
        }
    }
    
    /**
     * Aktualisiert die Hue-Rotation-Anzeige
     * @param {number} hueValue - Der neue Hue-Wert
     * @private
     */
    _updateExoticHueRotation(hueValue) {
        const spriteImg = document.getElementById('pokemon-sprite');
        const hueValueDisplay = document.getElementById('exotic-hue-value');
        
        if (spriteImg && this.appState.isExoticColor) {
            spriteImg.style.filter = `hue-rotate(${hueValue}deg)`;
        }
        
        if (hueValueDisplay) {
            hueValueDisplay.textContent = `${hueValue}°`;
        }
    }
    
    /**
     * Fügt Event-Listener für die Kampfwert-Modifikatoren hinzu
     * @param {Function} autoSave - Callback für automatisches Speichern
     * @private
     */
    _addStatModifierEventListeners(autoSave) {
        const modifiableStats = ['attack', 'defense', 'spAttack', 'spDefense'];
        
        // Plus-Buttons
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.stat-mod-plus', 'click', e => {
            const statKey = e.target.dataset.stat;
            if (!statKey || !modifiableStats.includes(statKey)) return;
            
            const modInput = document.getElementById(`mod-input-${statKey}`);
            const delta = parseInt(modInput?.value, 10) || 0;
            
            if (delta > 0) {
                this.appState.modifyTempStat(statKey, delta);
                modInput.value = '';
                this._updateStatDisplay(statKey);
                autoSave();
            }
        });
        
        // Minus-Buttons
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.stat-mod-minus', 'click', e => {
            const statKey = e.target.dataset.stat;
            if (!statKey || !modifiableStats.includes(statKey)) return;
            
            const modInput = document.getElementById(`mod-input-${statKey}`);
            const delta = parseInt(modInput?.value, 10) || 0;
            
            if (delta > 0) {
                this.appState.modifyTempStat(statKey, -delta);
                modInput.value = '';
                this._updateStatDisplay(statKey);
                autoSave();
            }
        });
        
        // Einzelne Reset-Buttons
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.stat-reset-btn', 'click', e => {
            const statKey = e.target.dataset.stat;
            if (!statKey || !modifiableStats.includes(statKey)) return;
            
            this.appState.resetTempStat(statKey);
            this._updateStatDisplay(statKey);
            autoSave();
        });
        
        // Alle Werte zurücksetzen Button
        addEventListenerSafe('#reset-all-temps-btn', 'click', () => {
            this.appState.resetAllTempStats();
            modifiableStats.forEach(statKey => this._updateStatDisplay(statKey));
            autoSave();
        });
        
        // Vollheilungs-Button
        addEventListenerSafe('#full-heal-btn', 'click', () => {
            this.appState.fullHeal();
            const currentHpInput = document.getElementById('current-hp-input');
            if (currentHpInput) {
                currentHpInput.value = this.appState.currentHp.toString();
            }
            autoSave();
        });
        
        // Modifikator-Eingabefelder: Enter-Taste zum Bestätigen
        delegateEvent('#' + DOM_IDS.SHEET_CONTAINER, '.stat-mod-input', 'keypress', e => {
            if (e.key === 'Enter') {
                const statKey = e.target.dataset.stat;
                if (!statKey) return;
                
                // Bei Enter: Plus-Button simulieren (positiver Modifikator)
                const plusBtn = document.querySelector(`.stat-mod-plus[data-stat="${statKey}"]`);
                if (plusBtn) plusBtn.click();
            }
        });
    }
    
    /**
     * Aktualisiert die Anzeige eines einzelnen modifizierbaren Stats
     * @param {string} statKey - Der Stat-Key (attack, defense, etc.)
     * @private
     */
    _updateStatDisplay(statKey) {
        const statInput = document.getElementById(`stat-${statKey}`);
        if (!statInput) return;
        
        const permaValue = this.appState.stats[statKey] || 0;
        const tempMod = this.appState.getTempStatModifier(statKey);
        const effectiveValue = permaValue + tempMod;
        
        // Wert aktualisieren
        statInput.value = effectiveValue.toString();
        statInput.dataset.permaValue = permaValue.toString();
        
        // Farb-Klassen aktualisieren
        statInput.classList.remove('stat-boosted', 'stat-reduced');
        if (tempMod > 0) {
            statInput.classList.add('stat-boosted');
        } else if (tempMod < 0) {
            statInput.classList.add('stat-reduced');
        }
    }
    
    /**
     * Fügt Event-Listener für die Export/Import-Buttons hinzu
     * @private
     */
    _addExportImportButtonListeners() {
        // JSON-Export-Button - Klon erstellen um alte Listener zu entfernen
        const jsonExportBtn = document.getElementById('save-json-button');
        if (jsonExportBtn) {
            const newJsonExportBtn = jsonExportBtn.cloneNode(true);
            jsonExportBtn.parentNode.replaceChild(newJsonExportBtn, jsonExportBtn);
            newJsonExportBtn.addEventListener('click', () => {
                if (window.jsonExportService) {
                    window.jsonExportService.exportJSON();
                } else {
                    this._showToast('JSON-Export-Service nicht verfügbar', 'error');
                }
            });
        }
        
        // PDF-Export-Button wird vom TrainerPdfService gesteuert (trainerSheetPdfService.js)
        // um kontextabhängig zwischen Trainer- und Pokemon-PDF zu wechseln.
        // KEIN zusätzlicher Event-Listener hier, da sonst Mehrfach-Downloads entstehen!
        
        // Laden-Button - Klon erstellen um alte Listener zu entfernen
        const loadBtn = document.getElementById('load-pokemon-button');
        if (loadBtn) {
            const newLoadBtn = loadBtn.cloneNode(true);
            loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
            newLoadBtn.addEventListener('click', () => {
                const fileInput = document.getElementById('json-file-input');
                if (fileInput) {
                    fileInput.click();
                } else {
                    this._showToast('JSON-Import nicht verfügbar', 'error');
                }
            });
        }
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
        
        // ==================== SEKTION 1: POKEMON-INFO ====================
        // Enthält: Name, Trainer, Spitzname, Item, Typen, Größe, Gewicht, Reitbarkeit, Freundschaft, Sprite
        
        // Sprite-URL basierend auf Shiny-Zustand
        const spriteUrl = this.appState.isShiny && pokemonData.sprites.front_shiny
            ? pokemonData.sprites.front_shiny
            : pokemonData.sprites.front_default;
        
        const hasShinySprite = !!pokemonData.sprites.front_shiny;
        
        // Hue-Slider (wird unter den Buttons platziert, visibility statt display für stabiles Layout)
        const hueSliderContainer = createElement('div', {
            id: 'exotic-hue-slider-container',
            className: 'exotic-hue-slider-container',
            style: this.appState.isExoticColor ? 'visibility: visible' : 'visibility: hidden'
        }, [
            createElement('input', {
                type: 'range',
                id: 'exotic-hue-slider',
                className: 'exotic-hue-slider',
                min: '0',
                max: '360',
                value: this.appState.exoticHueRotation.toString()
            }),
            createElement('span', {
                id: 'exotic-hue-value',
                className: 'exotic-hue-value'
            }, `${this.appState.exoticHueRotation}°`)
        ]);
        
        // Bild-Bereich: Sprite oben, Buttons darunter, Slider ganz unten
        const imageAreaRestructured = createElement('div', { className: 'pokemon-image-area' }, [
            createElement('div', { className: 'pokemon-image' }, [
                createElement('img', {
                    id: 'pokemon-sprite',
                    src: spriteUrl,
                    alt: pokemonData.germanName || selectedPokemon,
                    className: 'sprite',
                    style: this.appState.isExoticColor 
                        ? `filter: hue-rotate(${this.appState.exoticHueRotation}deg)` 
                        : ''
                })
            ]),
            createElement('div', { className: 'sprite-buttons-row' }, [
                ...(hasShinySprite ? [
                    createElement('button', {
                        id: 'shiny-toggle-btn',
                        className: `shiny-toggle-btn ${this.appState.isShiny ? 'shiny-active' : ''}`,
                        type: 'button',
                        title: this.appState.isShiny ? 'Normale Farbe anzeigen' : 'Shiny-Farbe anzeigen'
                    }, [
                        createElement('span', { className: 'shiny-icon' }, '✨'),
                        createElement('span', { className: 'shiny-text' }, this.appState.isShiny ? 'Shiny' : 'Normal')
                    ])
                ] : []),
                createElement('button', {
                    id: 'exotic-color-toggle-btn',
                    className: `exotic-color-toggle-btn ${this.appState.isExoticColor ? 'exotic-active' : ''}`,
                    type: 'button',
                    title: this.appState.isExoticColor ? 'Exotische Färbung deaktivieren' : 'Exotische Färbung aktivieren'
                }, [
                    createElement('span', { className: 'exotic-text' }, this.appState.isExoticColor ? 'Exotisch' : 'Normal')
                ])
            ]),
            hueSliderContainer
        ]);
        
        // Freundschafts-Anzeige
        const compactFriendshipTracker = this._createCompactFriendshipTracker();
        
        // Pokemon-Info Container MIT Freundschaft direkt daneben
        const pokemonInfoContainer = createElement('div', { className: 'pokemon-info-container' }, [
            createElement('div', { className: 'pokemon-info' }, [
                createElement('div', { className: 'pokemon-header' }, [
                    createElement('h2', { className: 'pokemon-name' }, pokemonData.germanName || capitalizeFirstLetter(selectedPokemon))
                ]),
                // Trainer-Felder, Geschlecht und Freundschaft nebeneinander
                createElement('div', { className: 'trainer-friendship-row' }, [
                    createElement('div', { className: 'trainer-fields' }, [
                        this._createTextField('Trainer', 'trainer-input'),
                        this._createTextField('Spitzname', 'nickname-input'),
                        this._createTextField('Item', 'item-input')
                    ]),
                    this._createGenderBadge(),
                    createElement('div', { className: 'friendship-column' }, [compactFriendshipTracker])
                ]),
                createElement('div', { className: 'types' }, 
                    pokemonData.types.map(typeInfo => 
                        createElement('span', {
                            className: 'type-badge',
                            style: `background-color: ${TYPE_COLORS[typeInfo.type.name] || '#777777'}`
                        }, typeInfo.type.germanName || capitalizeFirstLetter(typeInfo.type.name))
                    )
                ),
                this._createPhysicalInfoRow()
            ])
        ]);
        
        // Info-Sektion Content: Info+Freundschaft links, Sprite rechts
        const infoSectionContent = createElement('div', { className: 'info-section-layout' }, [
            pokemonInfoContainer,
            imageAreaRestructured
        ]);
        
        // ==================== SEKTION 2: KAMPF ====================
        // Enthält: Level-Up, GENA/PA, Stats (OHNE Attacken)
        
        const levelUpSection = this._createLevelUpSection();
        const genaPaContainer = this._createGenaPaContainer();
        const statsArea = this._createStatsArea();
        
        // Kampf-Sektion Layout: Nur Level/Stats
        const combatSectionContent = createElement('div', { className: 'combat-section-layout' }, [
            levelUpSection,
            genaPaContainer,
            statsArea
        ]);
        
        // ==================== SEKTION 3: ATTACKEN ====================
        const movesSection = this._createMovesSection();
        
        // ==================== SEKTION 4: FÄHIGKEITEN ====================
        const abilitiesSection = this._createAbilitiesSection();
        
        // ==================== SEKTION 5: FERTIGKEITEN ====================
        const skillsSection = this._createSkillsSection();
        
        // ==================== SEKTION 6: NOTIZEN ====================
        const notesSection = this._createNotesSection();
        
        // ==================== SEKTIONEN ZUSAMMENBAUEN ====================
        const sections = {
            info: this._createCollapsibleSection('info', 'Pokémon-Info', infoSectionContent, { canCollapse: true }),
            combat: this._createCollapsibleSection('combat', 'Kampf & Werte', combatSectionContent, { canCollapse: true }),
            moves: this._createCollapsibleSection('moves', 'Attacken', movesSection, { canCollapse: true }),
            abilities: this._createCollapsibleSection('abilities', 'Fähigkeiten', abilitiesSection, { canCollapse: true }),
            skills: this._createCollapsibleSection('skills', 'Fertigkeiten', skillsSection, { canCollapse: true }),
            notes: this._createCollapsibleSection('notes', 'Notizen', notesSection, { canCollapse: true })
        };
        
        // Reihenfolge aus AppState holen
        const defaultOrder = ['info', 'combat', 'moves', 'abilities', 'skills', 'notes'];
        const sectionOrder = this.appState.getSectionOrder ? this.appState.getSectionOrder() : defaultOrder;
        
        // Validiere und korrigiere Reihenfolge (falls alte Daten)
        const validOrder = sectionOrder.filter(id => sections[id]);
        defaultOrder.forEach(id => {
            if (!validOrder.includes(id)) validOrder.push(id);
        });
        
        // Sektionen-Container erstellen
        const sectionsContainer = createElement('div', { 
            className: 'pokemon-sections-container',
            id: 'pokemon-sections-container'
        });
        
        // Sektionen in der richtigen Reihenfolge hinzufügen
        validOrder.forEach(sectionId => {
            if (sections[sectionId]) {
                sectionsContainer.appendChild(sections[sectionId]);
            }
        });
        
        // Überarbeitete Struktur
        const overviewSection = createElement('div', { className: 'pokemon-overview' }, [
            sectionsContainer
        ]);
        
        // Verzögert den typabhängigen Hintergrund anwenden
        setTimeout(() => this._applyPokemonTypeBackground(), 10);
        
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
     * Erstellt die Zeile mit physischen Infos: Größe, Gewicht, Reitbarkeit
     * @returns {HTMLElement} Die Physical-Info-Zeile
     * @private
     */
    _createPhysicalInfoRow() {
        const { pokemonData } = this.appState;
        
        // Größe: Custom-Wert oder API-Wert
        const heightDisplay = this.appState.getDisplayHeight 
            ? this.appState.getDisplayHeight() 
            : (pokemonData.height / 10).toFixed(1).replace('.', ',') + ' m';
        
        // Gewicht: Custom-Wert oder API-Wert
        const weightDisplay = this.appState.getDisplayWeight 
            ? this.appState.getDisplayWeight() 
            : (pokemonData.weight / 10).toFixed(1).replace('.', ',') + ' kg';
        
        // Reitbarkeit ermitteln (custom oder automatisch)
        const rideability = this._getRideability();
        
        return createElement('div', { className: 'physical-info-row' }, [
            // Größe (editierbar)
            createElement('div', { className: 'physical-info-item' }, [
                createElement('span', { className: 'info-icon' }, '📏'),
                createElement('span', { className: 'info-label' }, 'Größe:'),
                createElement('input', { 
                    type: 'text',
                    id: 'pokemon-height-input',
                    className: 'info-value-input physical-info-input',
                    value: heightDisplay
                })
            ]),
            
            // Gewicht (editierbar)
            createElement('div', { className: 'physical-info-item' }, [
                createElement('span', { className: 'info-icon' }, '⚖️'),
                createElement('span', { className: 'info-label' }, 'Gewicht:'),
                createElement('input', { 
                    type: 'text',
                    id: 'pokemon-weight-input',
                    className: 'info-value-input physical-info-input',
                    value: weightDisplay
                })
            ]),
            
            // Reitbarkeit (klickbar zum Durchwechseln)
            createElement('div', { 
                id: 'rideability-badge',
                className: `rideability-badge rideability-clickable ${rideability.cssClass}`,
                title: `${rideability.label}\n\nLinksklick: Nächster Modus\nRechtsklick: Vorheriger Modus`,
                dataset: {
                    rideabilityType: rideability.type
                }
            }, [
                createElement('span', { className: 'rideability-icon' }, rideability.icon),
                createElement('span', { className: 'rideability-label' }, rideability.labelShort)
            ])
        ]);
    }
    
    /**
     * Ermittelt die Reitbarkeit des aktuellen Pokemon
     * Nutzt den RideabilityService falls verfügbar, oder custom-Wert
     * @returns {Object} Reitbarkeits-Info mit type, label, labelShort, icon, cssClass
     * @private
     */
    _getRideability() {
        const { pokemonData } = this.appState;
        
        // Reitbarkeits-Definitionen
        const rideabilityInfo = {
            'none': {
                type: 'none',
                label: 'Kann nicht geritten werden',
                labelShort: 'Nicht reitbar',
                icon: '🚫',
                cssClass: 'rideability-none'
            },
            'land': {
                type: 'land',
                label: 'Kann an Land geritten werden',
                labelShort: 'Land',
                icon: '🏇',
                cssClass: 'rideability-land'
            },
            'water': {
                type: 'water',
                label: 'Kann im Wasser geritten werden',
                labelShort: 'Wasser',
                icon: '🌊',
                cssClass: 'rideability-water'
            },
            'fly': {
                type: 'fly',
                label: 'Kann geflogen werden',
                labelShort: 'Fliegend',
                icon: '🦅',
                cssClass: 'rideability-fly'
            }
        };
        
        // Wenn Custom-Wert gesetzt ist, diesen verwenden
        if (this.appState.customRideability !== null && this.appState.customRideability !== undefined) {
            return rideabilityInfo[this.appState.customRideability] || rideabilityInfo['none'];
        }
        
        // Fallback falls Service nicht verfügbar
        if (!window.rideabilityService) {
            return rideabilityInfo['none'];
        }
        
        // Lernbare Attacken für Fly/Surf-Check ermitteln
        // availableMoves enthält alle lernbaren Attacken des Pokemon
        const learnableMoves = this.appState.availableMoves || [];
        
        const autoRideability = window.rideabilityService.getRideability(
            pokemonData,
            pokemonData.speciesData,
            learnableMoves
        );
        
        // Mapping vom Service-Ergebnis zu unseren Info-Objekten
        return rideabilityInfo[autoRideability.type] || rideabilityInfo['none'];
    }

    /**
     * Erstellt den Level-Up-Bereich mit Buttons und Würfelklasse
     * @returns {HTMLElement} Der Level-Up-Bereich
     */
    _createLevelUpSection() {
        // Aktuelle Würfelklasse ermitteln (custom oder original)
        const currentDiceClass = this.appState.getCurrentDiceClass() || 
            this.appState.pokemonData.diceClass;
        const isCustomized = this.appState.isDiceClassCustomized();
        
        const levelUpSection = createElement('div', { className: 'level-up-section' }, [
            // Obere Zeile mit Level-Anzeige und Würfelklasse
            createElement('div', { className: 'level-display-row' }, [
                // Würfelklasse (hier neu positioniert) - mit Tooltip für Erklärung
                createElement('div', { className: 'dice-class-container' }, [
                    createElement('span', { 
                        id: 'dice-class-display',
                        className: `dice-class dice-class-clickable${isCustomized ? ' dice-class-customized' : ''}`,
                        title: (this.appState.pokemonData.diceClassTooltip || 'Würfelklasse') + 
                            '\n\nKlicken zum Erhöhen'
                    }, currentDiceClass),
                    // Reset-Button (nur sichtbar wenn customized)
                    createElement('button', {
                        id: 'dice-class-reset-btn',
                        className: `dice-class-reset-btn${isCustomized ? '' : ' hidden'}`,
                        type: 'button',
                        title: 'Würfelklasse zurücksetzen'
                    }, '↺')
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
                ]),
                
                // Entwickeln-Container mit Icons und Button
                createElement('div', { className: 'evolution-container', id: 'evolution-container' }, [
                    // Container für die Entwicklungs-Icons (werden dynamisch befüllt)
                    createElement('div', { 
                        className: 'evolution-icons-container', 
                        id: 'evolution-icons-container' 
                    }),
                    
                    // Entwickeln-Button
                    createElement('button', {
                        id: 'evolve-button',
                        className: 'evolve-button',
                        type: 'button',
                        disabled: 'disabled' // Standardmäßig deaktiviert, bis Entwicklungen geladen sind
                    }, '✨ Entwickeln!')
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
    /**
     * Aktualisiert den visuellen Zustand des HP-Inputs bei 0 KP
     * @private
     */
    _updateHpZeroState() {
        const currentHpInput = document.getElementById('current-hp-input');
        if (!currentHpInput) return;
        
        const currentHp = parseInt(currentHpInput.value, 10) || 0;
        
        if (currentHp === 0) {
            currentHpInput.classList.add('hp-zero');
        } else {
            currentHpInput.classList.remove('hp-zero');
        }
    }

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
        // Direkt die Fähigkeiten als Container ohne zusätzlichen Wrapper
        const abilitiesContainer = createElement('div', { className: 'abilities-container' });
        
        // Fähigkeiten aus dem AppState abrufen
        const abilities = this.appState.abilities || [];
        
        // Filtere leere Fähigkeiten heraus und zähle die validen
        const validAbilities = abilities.filter(ability => ability !== "Leer");
        
        // Jede Fähigkeit mit Beschreibung hinzufügen
        validAbilities.forEach((ability, index) => {
            // Fähigkeitsbeschreibung abrufen
            let abilityDescription = "";
            try {
                abilityDescription = getAbilityDescription(ability) || "Keine Beschreibung verfügbar.";
            } catch (error) {
                abilityDescription = "Beschreibung konnte nicht geladen werden.";
            }
            
            // Bestimme eine Farbe basierend auf dem Namen der Fähigkeit
            const abilityColor = this._getAbilityColor(ability);
            
            // Mittlere Fähigkeit bekommt spezielle Klasse für helleren Hintergrund
            const isMiddle = validAbilities.length === 3 && index === 1;
            const middleClass = isMiddle ? ' ability-middle' : '';
            
            // Fähigkeitseintrag erstellen
            const abilityItem = createElement('div', { 
                className: `ability-item${middleClass}`,
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
        
        return abilitiesContainer;
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
     * Erstellt das Geschlechts-Badge mit klickbarem Symbol
     * Linksklick: Male -> Female -> Neutral -> Male
     * Rechtsklick: Male -> Neutral -> Female -> Male
     */
    _createGenderBadge() {
        const currentGender = this.appState.gender || GENDER.MALE;
        const genderInfo = GENDER_DISPLAY[currentGender];
        
        const genderBadge = createElement('div', { 
            className: 'gender-badge-container',
            id: 'gender-badge-container'
        }, [
            createElement('div', { className: 'gender-badge-title' }, 'Geschlecht'),
            createElement('div', { 
                className: `gender-badge gender-${currentGender}`,
                id: 'gender-badge',
                title: `${genderInfo.label} (Klicken zum Ändern)`,
                style: `color: ${genderInfo.color};`
            }, genderInfo.symbol)
        ]);
        
        return genderBadge;
    }
    
    /**
     * Aktualisiert die Geschlechts-Anzeige im UI
     */
    _updateGenderDisplay() {
        const genderBadge = document.getElementById('gender-badge');
        if (!genderBadge) return;
        
        const currentGender = this.appState.gender || GENDER.MALE;
        const genderInfo = GENDER_DISPLAY[currentGender];
        
        genderBadge.textContent = genderInfo.symbol;
        genderBadge.style.color = genderInfo.color;
        genderBadge.title = `${genderInfo.label} (Klicken zum Ändern)`;
        genderBadge.className = `gender-badge gender-${currentGender}`;
    }
    
    /**
     * Initialisiert die Event-Listener für das Geschlechts-Badge
     * @param {Function} autoSave - Funktion zum automatischen Speichern
     * @private
     */
    _initGenderEvents(autoSave) {
        const genderBadge = document.getElementById('gender-badge');
        if (!genderBadge) return;
        
        // Linksklick: vorwärts durch den Zyklus
        genderBadge.addEventListener('click', (e) => {
            e.preventDefault();
            this.appState.cycleGender(false);
            this._updateGenderDisplay();
            if (typeof autoSave === 'function') {
                autoSave();
            }
        });
        
        // Rechtsklick: rückwärts durch den Zyklus
        genderBadge.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.appState.cycleGender(true);
            this._updateGenderDisplay();
            if (typeof autoSave === 'function') {
                autoSave();
            }
        });
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
     * Initialisiert die Event-Listener für die Würfelklasse
     * @param {Function} autoSave - Funktion zum automatischen Speichern
     * @private
     */
    _initDiceClassEvents(autoSave) {
        // Warten, bis das DOM geladen ist
        setTimeout(() => {
            const diceClassDisplay = document.getElementById('dice-class-display');
            const resetBtn = document.getElementById('dice-class-reset-btn');
            
            if (!diceClassDisplay) return;
            
            // Klick auf Würfelklasse erhöht sie
            diceClassDisplay.addEventListener('click', () => {
                const newDice = this.appState.increaseDiceClass();
                
                if (newDice) {
                    // UI aktualisieren
                    diceClassDisplay.textContent = newDice;
                    diceClassDisplay.classList.add('dice-class-customized');
                    
                    // Reset-Button sichtbar machen
                    if (resetBtn) {
                        resetBtn.classList.remove('hidden');
                    }
                    
                    // Animation
                    diceClassDisplay.classList.add('dice-class-pulse');
                    setTimeout(() => {
                        diceClassDisplay.classList.remove('dice-class-pulse');
                    }, 300);
                    
                    autoSave();
                } else {
                    // Maximum erreicht - visuelles Feedback
                    diceClassDisplay.classList.add('dice-class-shake');
                    setTimeout(() => {
                        diceClassDisplay.classList.remove('dice-class-shake');
                    }, 300);
                }
            });
            
            // Rechtsklick auf Würfelklasse verringert sie
            diceClassDisplay.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // Kontextmenü verhindern
                
                const newDice = this.appState.decreaseDiceClass();
                
                if (newDice) {
                    // UI aktualisieren
                    diceClassDisplay.textContent = newDice;
                    diceClassDisplay.classList.add('dice-class-customized');
                    
                    // Reset-Button sichtbar machen
                    if (resetBtn) {
                        resetBtn.classList.remove('hidden');
                    }
                    
                    // Animation
                    diceClassDisplay.classList.add('dice-class-pulse');
                    setTimeout(() => {
                        diceClassDisplay.classList.remove('dice-class-pulse');
                    }, 300);
                    
                    autoSave();
                } else {
                    // Minimum erreicht - visuelles Feedback
                    diceClassDisplay.classList.add('dice-class-shake');
                    setTimeout(() => {
                        diceClassDisplay.classList.remove('dice-class-shake');
                    }, 300);
                }
            });
            
            // Reset-Button
            if (resetBtn) {
                resetBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Verhindert, dass der Klick die Würfelklasse erhöht
                    
                    const originalDice = this.appState.resetDiceClass();
                    
                    if (originalDice) {
                        // UI aktualisieren
                        diceClassDisplay.textContent = originalDice;
                        diceClassDisplay.classList.remove('dice-class-customized');
                        
                        // Reset-Button verstecken
                        resetBtn.classList.add('hidden');
                        
                        // Animation
                        diceClassDisplay.classList.add('dice-class-reset-pulse');
                        setTimeout(() => {
                            diceClassDisplay.classList.remove('dice-class-reset-pulse');
                        }, 500);
                        
                        autoSave();
                    }
                });
            }
        }, 10);
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
     * Aktualisiert die Skills-Sektion nach Änderungen an benutzerdefinierten Fertigkeiten
     * @private
     */
    _refreshSkillsSection() {
        const skillsTable = document.querySelector('.skills-table');
        if (!skillsTable) return;
        
        // Neue Skills-Sektion erstellen
        const newSkillsSection = this._createSkillsSection();
        
        // Alte Sektion ersetzen
        skillsTable.parentNode.replaceChild(newSkillsSection, skillsTable);
    }
    
    /**
     * Aktualisiert die angezeigten Werte aller Fertigkeiten einer Kategorie
     * Wird aufgerufen, wenn ein Grundwert (KÖ, WI, CH, GL) geändert wird
     * @param {string} category - Die Kategorie (KÖ, WI, CH, GL)
     * @private
     */
    _updateSkillDisplaysForCategory(category) {
        // Nur im Gesamtwerte-Modus relevant
        if (!window.skillDisplayModeService?.isTotalMode()) return;
        
        const container = document.getElementById(DOM_IDS.SHEET_CONTAINER);
        if (!container) return;
        
        // Alle Skills dieser Kategorie aus SKILL_GROUPS holen
        const skillsInCategory = SKILL_GROUPS[category] || [];
        
        // Standard-Skills dieser Kategorie aktualisieren
        skillsInCategory.forEach(skillName => {
            const input = container.querySelector(`input.skill-input[data-skill="${skillName}"]`);
            if (!input || input.classList.contains('base-stat-input')) return;
            
            // Nicht aktualisieren wenn gerade editiert wird
            if (input.classList.contains('skill-editing')) return;
            
            // Fertigkeitswert aus dem AppState holen (source of truth)
            const skillValue = this.appState.skillValues[skillName] || 0;
            const displayInfo = window.skillDisplayModeService.getDisplayValue(
                skillName, skillValue, this.appState.skillValues
            );
            
            input.value = displayInfo.displayValue;
            input.dataset.baseValue = skillValue.toString(); // dataset synchron halten
            if (displayInfo.isTotal) {
                input.classList.add('skill-total-mode');
            }
        });
        
        // Custom-Skills dieser Kategorie aktualisieren
        const customSkillInputs = container.querySelectorAll(
            `input.custom-skill-value[data-category="${category}"]`
        );
        customSkillInputs.forEach(input => {
            // Nicht aktualisieren wenn gerade editiert wird
            if (input.classList.contains('skill-editing')) return;
            
            // Custom-Skill-Wert aus dem AppState holen
            const customIndex = parseInt(input.dataset.customIndex, 10);
            const customSkills = this.appState.getCustomSkills ? 
                this.appState.getCustomSkills(category) : [];
            const customSkill = customSkills[customIndex];
            const skillValue = customSkill?.value || 0;
            
            const displayInfo = window.skillDisplayModeService.getDisplayValueForCustomSkill(
                category, skillValue, this.appState.skillValues
            );
            
            input.value = displayInfo.displayValue;
            input.dataset.baseValue = skillValue.toString(); // dataset synchron halten
            if (displayInfo.isTotal) {
                input.classList.add('skill-total-mode');
            }
        });
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
                // Direkt die saveCurrentPokemon-Methode des StorageService aufrufen
                window.pokemonApp.storageService.saveCurrentPokemon();
            } catch (error) {
                console.error("Fehler beim Speichern des Charakterbogens:", error);
            }
        }, 10);
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
    
    /**
     * Initialisiert das Entwicklungs-Feature
     * Lädt mögliche Entwicklungen und rendert die Icons
     * @private
     */
    _initEvolutionFeature() {
        // Verzögerung um sicherzustellen, dass das DOM bereit ist
        setTimeout(async () => {
            const evolveButton = document.getElementById('evolve-button');
            const iconsContainer = document.getElementById('evolution-icons-container');
            
            if (!evolveButton || !iconsContainer) {
                console.log('Evolution-UI-Elemente nicht gefunden');
                return;
            }
            
            // EvolutionService prüfen
            if (!window.evolutionService) {
                console.log('EvolutionService nicht verfügbar');
                evolveButton.disabled = true;
                evolveButton.classList.add('evolve-button-disabled');
                return;
            }
            
            try {
                // Mögliche Entwicklungen laden
                const evolutions = await window.evolutionService.getDirectEvolutions(this.appState.pokemonData);
                
                // Cache die Entwicklungen im Container für späteren Zugriff
                iconsContainer.dataset.evolutions = JSON.stringify(evolutions.map(e => e.id));
                this._cachedEvolutions = evolutions;
                
                if (evolutions.length === 0) {
                    // Keine Entwicklungen möglich - Button deaktivieren
                    evolveButton.disabled = true;
                    evolveButton.classList.add('evolve-button-disabled');
                    evolveButton.title = 'Dieses Pokémon kann sich nicht weiter entwickeln';
                    return;
                }
                
                // Icons für jede mögliche Entwicklung erstellen
                iconsContainer.innerHTML = '';
                
                evolutions.forEach((evolution, index) => {
                    const icon = this._createEvolutionIcon(evolution, index);
                    iconsContainer.appendChild(icon);
                });
                
                // Button aktivieren
                evolveButton.disabled = false;
                evolveButton.classList.remove('evolve-button-disabled');
                evolveButton.classList.add('evolve-button-ready');
                evolveButton.title = `Entwickle zu ${evolutions.length === 1 ? evolutions[0].germanName : 'einer neuen Form'}`;
                
                // Event-Listener für den Entwickeln-Button
                evolveButton.addEventListener('click', () => {
                    this._handleEvolveButtonClick(evolutions);
                });
                
            } catch (error) {
                console.error('Fehler beim Initialisieren des Evolution-Features:', error);
                evolveButton.disabled = true;
                evolveButton.classList.add('evolve-button-disabled');
            }
        }, 500);
    }
    
    /**
     * Erstellt ein Icon für eine mögliche Entwicklung
     * @param {Object} evolution - Die Entwicklungsdaten
     * @param {number} index - Index der Entwicklung
     * @returns {HTMLElement} Das Icon-Element
     * @private
     */
    _createEvolutionIcon(evolution, index) {
        const typeColor = TYPE_COLORS[evolution.primaryType] || '#777777';
        
        const iconWrapper = createElement('div', { 
            className: 'evolution-icon-wrapper',
            title: `Entwickeln zu ${evolution.germanName}`,
            dataset: { evolutionId: evolution.id.toString(), index: index.toString() }
        });
        
        const iconElement = createElement('div', { 
            className: 'evolution-icon',
            style: `border-color: ${typeColor};`
        }, [
            createElement('img', {
                src: evolution.sprite,
                alt: evolution.germanName,
                className: 'evolution-sprite'
            })
        ]);
        
        // Tooltip/Name unter dem Icon
        const nameLabel = createElement('span', { 
            className: 'evolution-name-label'
        }, evolution.germanName);
        
        iconWrapper.appendChild(iconElement);
        iconWrapper.appendChild(nameLabel);
        
        // Click-Event für dieses Icon
        iconWrapper.addEventListener('click', async () => {
            await this._handleEvolutionIconClick(evolution);
        });
        
        return iconWrapper;
    }
    
    /**
     * Handler für Klick auf den Entwickeln-Button
     * Zeigt die Icons an (falls versteckt) oder führt Entwicklung durch
     * @param {Array} evolutions - Verfügbare Entwicklungen
     * @private
     */
    _handleEvolveButtonClick(evolutions) {
        const iconsContainer = document.getElementById('evolution-icons-container');
        const evolveButton = document.getElementById('evolve-button');
        
        if (!iconsContainer) return;
        
        // Wenn Icons bereits sichtbar sind, nichts tun
        if (iconsContainer.classList.contains('evolution-icons-visible')) {
            return;
        }
        
        // Icons sichtbar machen
        iconsContainer.classList.add('evolution-icons-visible');
        
        // Button deaktivieren während Icons sichtbar sind
        evolveButton.disabled = true;
        evolveButton.classList.add('evolve-button-waiting');
        evolveButton.textContent = '⬆ Wähle eine Form!';
    }
    
    /**
     * Handler für Klick auf ein Entwicklungs-Icon
     * Führt die Entwicklung durch
     * @param {Object} evolution - Die gewählte Entwicklung
     * @private
     */
    async _handleEvolutionIconClick(evolution) {
        const iconsContainer = document.getElementById('evolution-icons-container');
        const evolveButton = document.getElementById('evolve-button');
        
        // Spitznamen VOR der Entwicklung sichern (UI wird danach neu gerendert!)
        const savedNickname = document.getElementById('nickname-input')?.value?.trim() || '';
        
        // Entwicklung durchführen
        evolveButton.textContent = '🔄 Entwickle...';
        evolveButton.disabled = true;
        
        try {
            const success = await window.evolutionService.evolve(evolution, this.appState);
            
            if (success) {
                // Evolution-Boni vom EvolutionService holen
                const evolutionBonuses = window.evolutionService._lastEvolutionBonuses || null;
                
                // Erfolgs-Toast anzeigen (mit gesichertem Spitznamen und Boni)
                this._showEvolutionSuccessToast(evolution.germanName, savedNickname, evolutionBonuses);
            } else {
                alert('Die Entwicklung ist fehlgeschlagen. Bitte versuche es erneut.');
                // Button wiederherstellen
                evolveButton.textContent = '✨ Entwickeln!';
                evolveButton.disabled = false;
                iconsContainer.classList.remove('evolution-icons-visible');
            }
        } catch (error) {
            console.error('Fehler bei der Entwicklung:', error);
            alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
            evolveButton.textContent = '✨ Entwickeln!';
            evolveButton.disabled = false;
            iconsContainer.classList.remove('evolution-icons-visible');
        }
    }
    
    /**
     * Zeigt eine Erfolgs-Toast-Nachricht nach der Entwicklung
     * @param {string} newPokemonName - Name des neuen Pokemon
     * @param {string} nickname - Optionaler Spitzname des Pokemon
     * @param {Object} evolutionBonuses - Optionale Evolution-Stat-Boni
     * @private
     */
    _showEvolutionSuccessToast(newPokemonName, nickname = '', evolutionBonuses = null) {
        // Bestehenden Toast entfernen
        const existingToast = document.querySelector('.evolution-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Spitznamen verwenden falls vorhanden, sonst Fallback
        const pokemonIdentifier = nickname || 'Dein Pokémon';
        
        // Toast-Inhalt erstellen
        const toastContent = [
            createElement('span', { className: 'evolution-toast-icon' }, '🎉'),
            createElement('span', { className: 'evolution-toast-message' }, 
                `Glückwunsch! ${pokemonIdentifier} hat sich zu ${newPokemonName} entwickelt!`)
        ];
        
        // Stat-Boni hinzufügen falls vorhanden
        if (evolutionBonuses && evolutionBonuses.bonuses) {
            const bonusContainer = this._createEvolutionBonusDisplay(evolutionBonuses);
            toastContent.push(bonusContainer);
        }
        
        // Neuen Toast erstellen
        const toast = createElement('div', { className: 'evolution-toast evolution-toast-with-bonuses' }, toastContent);
        
        document.body.appendChild(toast);
        
        // Toast nach längerer Zeit entfernen wenn Boni angezeigt werden
        const displayTime = evolutionBonuses ? 8000 : 5000;
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.classList.add('evolution-toast-fadeout');
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 500);
            }
        }, displayTime);
    }
    
    /**
     * Erstellt die Anzeige für Evolution-Stat-Boni
     * @param {Object} evolutionBonuses - Die Bonus-Daten vom EvolutionService
     * @returns {HTMLElement} Das Bonus-Anzeige-Element
     * @private
     */
    _createEvolutionBonusDisplay(evolutionBonuses) {
        const { bonuses, multiplier, diceClass } = evolutionBonuses;
        
        // Deutsche Stat-Namen
        const statLabels = {
            hp: 'KP',
            attack: 'Angriff',
            defense: 'Verteidigung',
            spAttack: 'Sp.-Ang.',
            spDefense: 'Sp.-Vert.',
            speed: 'Initiative'
        };
        
        // Container erstellen
        const container = createElement('div', { className: 'evolution-bonus-container' });
        
        // Header mit Erklärung
        const header = createElement('div', { className: 'evolution-bonus-header' }, 
            `Entwicklungsbonus (${multiplier}× ${diceClass}):`
        );
        container.appendChild(header);
        
        // Grid für die Stat-Boni
        const grid = createElement('div', { className: 'evolution-bonus-grid' });
        
        // Reihenfolge: KP zuerst (weil verdreifacht), dann Rest
        const statOrder = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];
        
        statOrder.forEach(statName => {
            const bonus = bonuses[statName];
            const label = statLabels[statName];
            const isHp = statName === 'hp';
            
            const statItem = createElement('div', { 
                className: `evolution-bonus-item ${isHp ? 'evolution-bonus-hp' : ''}`
            }, [
                createElement('span', { className: 'evolution-bonus-label' }, label),
                createElement('span', { className: 'evolution-bonus-value' }, `+${bonus}${isHp ? ' (×3)' : ''}`)
            ]);
            
            grid.appendChild(statItem);
        });
        
        container.appendChild(grid);
        
        return container;
    }
    
    /**
     * Aktualisiert die Hintergrundfarbe eines Move-Slots basierend auf dem Typ der Attacke
     * @param {number} index - Index des Attacken-Slots
     * @param {Object|null} move - Die ausgewählte Attacke oder null
     * @private
     */
    _updateMoveSlotColor(index, move) {
        // Slot über das Select-Element finden (zuverlässiger als :has())
        const select = document.getElementById(`move-${index}`);
        if (!select) return;
        
        const slot = select.closest('.move-slot');
        if (!slot) return;
        
        this._applyMoveSlotColor(slot, move);
    }
    
    /**
     * Wendet die Farbe auf einen Move-Slot an
     * @param {HTMLElement} slot - Das Slot-Element
     * @param {Object|null} move - Die ausgewählte Attacke oder null
     * @private
     */
    _applyMoveSlotColor(slot, move) {
        if (!move || !move.type) {
            // Keine Attacke ausgewählt - Standardfarben wiederherstellen
            slot.classList.remove('move-slot-typed');
            slot.style.backgroundColor = '';
            return;
        }
        
        // Typ-Farbe aus TYPE_COLORS holen (englischer Typ-Name als Key)
        const typeColor = TYPE_COLORS[move.type.toLowerCase()] || '#A8A878'; // Fallback: Normal
        
        // Farbe anwenden
        slot.classList.add('move-slot-typed');
        slot.style.backgroundColor = typeColor;
    }
}