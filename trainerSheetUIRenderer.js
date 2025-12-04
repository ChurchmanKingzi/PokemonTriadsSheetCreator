/**
 * TrainerUIRenderer
 * Rendert das Trainer-Sheet UI
 */
class TrainerUIRenderer {
    constructor(trainerState) {
        this.trainerState = trainerState;
    }
    
    /**
     * Rendert das komplette Trainer-Sheet
     */
    renderTrainerSheet() {
        const container = document.getElementById('trainer-sheet-container');
        if (!container) {
            console.error('Trainer-Sheet-Container nicht gefunden');
            return;
        }
        
        container.innerHTML = '';
        
        // Hauptcontainer erstellen
        const sheetElement = document.createElement('div');
        sheetElement.className = 'trainer-sheet';
        
        // Sektionen-Konfiguration (ID, Titel, Erstellungsfunktion)
        const sectionConfigs = [
            { id: 'basic-info', title: 'Trainer-Informationen', create: () => this._createBasicInfoSection() },
            { id: 'pokemon-team', title: 'Pokémon-Team', create: () => this._createPokemonTeamSection() },
            { id: 'skills', title: 'Fertigkeiten', create: () => this._createSkillsSection() },
            { id: 'combat', title: 'Kampfwerte', create: () => this._createStatsSection() },
            { id: 'inventory', title: 'Inventar', create: () => this._createInventorySection() },
            { id: 'notes', title: 'Notizen', create: () => this._createNotesSection() },
            { id: 'type-mastery', title: 'Typ-Meisterschaft', create: () => this._createTypeMasterySection(), defaultCollapsed: true },
            { id: 'grades', title: 'Noten', create: () => this._createGradesSection(), defaultCollapsed: true }
        ];
        
        // Gespeicherte Reihenfolge laden
        const savedOrder = this._loadSectionOrder();
        const collapsedStates = this._loadCollapsedStates();
        
        // Sektionen nach gespeicherter Reihenfolge sortieren
        if (savedOrder && savedOrder.length === sectionConfigs.length) {
            sectionConfigs.sort((a, b) => {
                const indexA = savedOrder.indexOf(a.id);
                const indexB = savedOrder.indexOf(b.id);
                return indexA - indexB;
            });
        }
        
        // Sektionen erstellen und hinzufügen
        sectionConfigs.forEach(config => {
            // Verwende gespeicherten Zustand oder Default-Wert
            const isCollapsed = collapsedStates.hasOwnProperty(config.id) 
                ? collapsedStates[config.id] 
                : (config.defaultCollapsed || false);
            const wrapper = this._createCollapsibleWrapper(
                config.id, 
                config.title, 
                config.create(),
                isCollapsed
            );
            sheetElement.appendChild(wrapper);
        });
        
        container.appendChild(sheetElement);
        
        // Event-Listener hinzufügen
        this._addEventListeners();
        
        // Drag & Drop initialisieren
        this._initDragAndDrop(sheetElement);
        
        // Gespeicherte Werte laden
        this._loadSavedValues();
    }
    
    /**
     * Erstellt einen zusammenklappbaren Wrapper für eine Sektion
     * @param {string} sectionId - Eindeutige ID der Sektion
     * @param {string} title - Titel der Sektion
     * @param {HTMLElement} content - Der Inhalt der Sektion
     * @param {boolean} isCollapsed - Ob die Sektion eingeklappt sein soll
     * @returns {HTMLElement} Der Wrapper
     * @private
     */
    _createCollapsibleWrapper(sectionId, title, content, isCollapsed = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `collapsible-section ${isCollapsed ? 'collapsed' : ''}`;
        wrapper.dataset.sectionId = sectionId;
        wrapper.draggable = true;
        
        // Header mit Drag-Handle, Titel und Toggle-Button
        const header = document.createElement('div');
        header.className = 'collapsible-header';
        header.innerHTML = `
            <div class="drag-handle-section" title="Ziehen zum Verschieben">⋮⋮</div>
            <h2 class="collapsible-title">${title}</h2>
            <button type="button" class="collapse-toggle" title="${isCollapsed ? 'Aufklappen' : 'Einklappen'}">
                <span class="collapse-icon">${isCollapsed ? '▶' : '▼'}</span>
            </button>
        `;
        
        // Toggle-Funktionalität
        const toggleBtn = header.querySelector('.collapse-toggle');
        const titleElement = header.querySelector('.collapsible-title');
        
        const toggleCollapse = () => {
            const isNowCollapsed = wrapper.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('.collapse-icon');
            icon.textContent = isNowCollapsed ? '▶' : '▼';
            toggleBtn.title = isNowCollapsed ? 'Aufklappen' : 'Einklappen';
            this._saveCollapsedState(sectionId, isNowCollapsed);
        };
        
        toggleBtn.addEventListener('click', toggleCollapse);
        titleElement.addEventListener('click', toggleCollapse);
        
        // Content-Container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'collapsible-content';
        contentContainer.appendChild(content);
        
        wrapper.appendChild(header);
        wrapper.appendChild(contentContainer);
        
        return wrapper;
    }
    
    /**
     * Initialisiert Drag & Drop für die Sektionen
     * @param {HTMLElement} container - Der Container mit den Sektionen
     * @private
     */
    _initDragAndDrop(container) {
        let draggedElement = null;
        let placeholder = null;
        
        const sections = container.querySelectorAll('.collapsible-section');
        
        sections.forEach(section => {
            const dragHandle = section.querySelector('.drag-handle-section');
            
            if (!dragHandle) {
                console.warn('Kein drag-handle gefunden für Section:', section.dataset.sectionId);
                return;
            }
            
            // WICHTIG: Flag direkt auf dem Element speichern (nicht in Closure)
            // Mousedown auf Handle markiert das Element als "drag-ready"
            dragHandle.addEventListener('mousedown', (e) => {
                section.dataset.dragReady = 'true';
                // Nach kurzer Zeit zurücksetzen, falls kein Drag startet
                setTimeout(() => {
                    if (section.dataset.dragReady === 'true' && !draggedElement) {
                        section.dataset.dragReady = 'false';
                    }
                }, 500);
            });
            
            section.addEventListener('dragstart', (e) => {
                // Nur starten wenn Drag vom Handle initiiert wurde
                if (section.dataset.dragReady !== 'true') {
                    e.preventDefault();
                    return;
                }
                
                draggedElement = section;
                section.classList.add('dragging');
                section.dataset.dragReady = 'false';
                
                // Placeholder erstellen
                placeholder = document.createElement('div');
                placeholder.className = 'section-placeholder';
                placeholder.style.height = section.offsetHeight + 'px';
                
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', section.dataset.sectionId);
                
                // Verzögert ausblenden für besseren visuellen Effekt
                setTimeout(() => {
                    section.style.opacity = '0.5';
                }, 0);
            });
            
            section.addEventListener('dragend', () => {
                // WICHTIG: Element an Placeholder-Position verschieben BEVOR Placeholder entfernt wird
                if (draggedElement && placeholder && placeholder.parentNode) {
                    placeholder.parentNode.insertBefore(draggedElement, placeholder);
                }
                
                section.classList.remove('dragging');
                section.style.opacity = '';
                section.dataset.dragReady = 'false';
                
                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
                
                // Neue Reihenfolge speichern
                this._saveSectionOrder(container);
                
                placeholder = null;
                draggedElement = null;
            });
            
            section.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (!draggedElement || draggedElement === section) return;
                
                const rect = section.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                if (e.clientY < midY) {
                    section.parentNode.insertBefore(placeholder, section);
                } else {
                    section.parentNode.insertBefore(placeholder, section.nextSibling);
                }
            });
        });
        
        // Container-weite Events für robustes Drag & Drop
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        // Drop auf Container (fängt auch Drops auf Placeholder)
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            // Das eigentliche Verschieben passiert in dragend
        });
    }
    
    /**
     * Speichert die Reihenfolge der Sektionen
     * @param {HTMLElement} container - Der Container
     * @private
     */
    _saveSectionOrder(container) {
        const sections = container.querySelectorAll('.collapsible-section');
        const order = Array.from(sections).map(s => s.dataset.sectionId);
        localStorage.setItem('trainer_section_order', JSON.stringify(order));
    }
    
    /**
     * Lädt die gespeicherte Reihenfolge der Sektionen
     * @returns {Array|null} Die Reihenfolge oder null
     * @private
     */
    _loadSectionOrder() {
        try {
            const saved = localStorage.getItem('trainer_section_order');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Speichert den Collapsed-Status einer Sektion
     * @param {string} sectionId - Die Sektions-ID
     * @param {boolean} isCollapsed - Ob eingeklappt
     * @private
     */
    _saveCollapsedState(sectionId, isCollapsed) {
        try {
            const states = this._loadCollapsedStates();
            states[sectionId] = isCollapsed;
            localStorage.setItem('trainer_collapsed_states', JSON.stringify(states));
        } catch (e) {
            console.error('Fehler beim Speichern des Collapsed-Status:', e);
        }
    }
    
    /**
     * Lädt alle Collapsed-Status
     * @returns {Object} Objekt mit Sektions-IDs und Status
     * @private
     */
    _loadCollapsedStates() {
        try {
            const saved = localStorage.getItem('trainer_collapsed_states');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }
    
    /**
     * Erstellt die Grundinformations-Sektion
     * @private
     */
    _createBasicInfoSection() {
        const section = document.createElement('div');
        section.className = 'trainer-basic-info trainer-two-column-layout';
        
        section.innerHTML = `
            <div class="trainer-left-column">
                <div class="trainer-info-grid">
                    <div class="info-field">
                        <label for="trainer-name">Name:</label>
                        <input type="text" id="trainer-name" class="trainer-input" placeholder="Trainer-Name">
                    </div>
                    <div class="info-field">
                        <label for="trainer-age">Alter:</label>
                        <input type="text" id="trainer-age" class="trainer-input" placeholder="Alter">
                    </div>
                    <div class="info-field">
                        <label for="trainer-played-by">Gespielt von:</label>
                        <input type="text" id="trainer-played-by" class="trainer-input" placeholder="Spielername">
                    </div>
                </div>
                
                <div class="trainer-dropdowns-grid">
                    <div class="dropdown-field">
                        <label>Klasse:</label>
                        <div id="klasse-dropdown-container" class="custom-dropdown-container"></div>
                        <input type="hidden" id="trainer-klasse" value="">
                    </div>
                    <div class="dropdown-field">
                        <label>Vorteil:</label>
                        <div id="vorteil-dropdown-container" class="custom-dropdown-container"></div>
                        <input type="hidden" id="trainer-vorteil" value="">
                    </div>
                    <div class="dropdown-field">
                        <label>Nachteil:</label>
                        <div id="nachteil-dropdown-container" class="custom-dropdown-container"></div>
                        <input type="hidden" id="trainer-nachteil" value="">
                    </div>
                    <div class="dropdown-field second-class-field" id="second-class-container" style="display: none;">
                        <label>Zweite Klasse:</label>
                        <div id="second-klasse-dropdown-container" class="custom-dropdown-container"></div>
                        <input type="hidden" id="trainer-second-klasse" value="">
                    </div>
                </div>
                
                <!-- Separate Beschreibungsboxen -->
                <div class="selection-descriptions">
                    <div id="klasse-description" class="selection-description"></div>
                    <div id="vorteil-description" class="selection-description"></div>
                    <div id="nachteil-description" class="selection-description"></div>
                    <div id="second-klasse-description" class="selection-description" style="display: none;"></div>
                </div>
            </div>
            
            <div class="trainer-right-column">
                <div class="character-image-container">
                    <div id="character-image-preview" class="character-image-preview">
                        <span class="image-placeholder-text">Kein Bild ausgewählt</span>
                    </div>
                    <div class="image-upload-controls">
                        <label for="character-image-input" class="image-upload-button">
                            📷 Bild hochladen
                        </label>
                        <input type="file" id="character-image-input" accept="image/*" style="display: none;">
                        <button id="character-image-remove" class="image-remove-button" style="display: none;">
                            🗑️ Entfernen
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Custom Dropdowns initialisieren nach dem Einfügen
        setTimeout(() => this._initCustomDropdowns(), 0);
        
        return section;
    }
    
    /**
     * Initialisiert alle Custom-Dropdowns mit Hover-Tooltips
     * @private
     */
    _initCustomDropdowns() {
        // Klasse Dropdown
        this._createCustomDropdown(
            'klasse-dropdown-container',
            'trainer-klasse',
            '-- Klasse wählen --',
            this._getKlassenData(),
            'klasse'
        );
        
        // Zweite Klasse Dropdown
        this._createCustomDropdown(
            'second-klasse-dropdown-container',
            'trainer-second-klasse',
            '-- Zweite Klasse wählen --',
            this._getKlassenData(),
            'secondKlasse'
        );
        
        // Vorteil Dropdown
        this._createCustomDropdown(
            'vorteil-dropdown-container',
            'trainer-vorteil',
            '-- Vorteil wählen --',
            this._getVorteileData(),
            'vorteil'
        );
        
        // Nachteil Dropdown
        this._createCustomDropdown(
            'nachteil-dropdown-container',
            'trainer-nachteil',
            '-- Nachteil wählen --',
            this._getNachteileData(),
            'nachteil'
        );
    }
    
    /**
     * Holt die Klassen-Daten
     * @private
     */
    _getKlassenData() {
        if (typeof klasseService === 'undefined') return [];
        return klasseService.getAllKlassen();
    }
    
    /**
     * Holt die Vorteile-Daten
     * @private
     */
    _getVorteileData() {
        if (typeof vorteilService === 'undefined') return [];
        return vorteilService.getAllVorteile();
    }
    
    /**
     * Holt die Nachteile-Daten
     * @private
     */
    _getNachteileData() {
        if (typeof nachteilService === 'undefined') return [];
        return nachteilService.getAllNachteile();
    }
    
    /**
     * Erstellt ein Custom Dropdown mit Hover-Tooltips
     * @private
     */
    _createCustomDropdown(containerId, hiddenInputId, placeholder, items, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const hiddenInput = document.getElementById(hiddenInputId);
        
        // Dropdown-Button erstellen
        const button = document.createElement('div');
        button.className = 'custom-dropdown-button';
        button.innerHTML = `<span class="dropdown-text">${placeholder}</span><span class="dropdown-arrow">▼</span>`;
        
        // Dropdown-Liste erstellen
        const list = document.createElement('div');
        list.className = 'custom-dropdown-list';
        list.style.display = 'none';
        
        // Leere Option
        const emptyOption = document.createElement('div');
        emptyOption.className = 'custom-dropdown-option';
        emptyOption.dataset.value = '';
        emptyOption.textContent = placeholder;
        emptyOption.addEventListener('click', () => {
            this._selectDropdownOption(button, hiddenInput, '', placeholder, type);
            list.style.display = 'none';
        });
        list.appendChild(emptyOption);
        
        // Optionen hinzufügen
        items.forEach(item => {
            const option = document.createElement('div');
            option.className = 'custom-dropdown-option';
            option.dataset.value = item.id;
            option.dataset.beschreibung = item.beschreibung;
            option.textContent = item.name;
            
            // Hover-Tooltip
            option.addEventListener('mouseenter', (e) => {
                this._showHoverTooltip(e, item.name, item.beschreibung);
            });
            
            option.addEventListener('mouseleave', () => {
                this._hideHoverTooltip();
            });
            
            option.addEventListener('mousemove', (e) => {
                this._moveHoverTooltip(e);
            });
            
            // Klick-Handler
            option.addEventListener('click', () => {
                this._selectDropdownOption(button, hiddenInput, item.id, item.name, type);
                list.style.display = 'none';
            });
            
            list.appendChild(option);
        });
        
        // Button-Klick öffnet/schließt Liste
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Alle anderen Dropdowns schließen
            document.querySelectorAll('.custom-dropdown-list').forEach(l => {
                if (l !== list) l.style.display = 'none';
            });
            
            list.style.display = list.style.display === 'none' ? 'block' : 'none';
        });
        
        // Klick außerhalb schließt Dropdown
        document.addEventListener('click', () => {
            list.style.display = 'none';
        });
        
        container.appendChild(button);
        container.appendChild(list);
        
        // Referenz für späteres Setzen des Werts speichern
        container.dataset.type = type;
    }
    
    /**
     * Wählt eine Dropdown-Option aus
     * @private
     */
    _selectDropdownOption(button, hiddenInput, value, text, type) {
        button.querySelector('.dropdown-text').textContent = text;
        hiddenInput.value = value;
        
        // State aktualisieren
        if (type === 'klasse') {
            this.trainerState.setKlasse(value);
            this._updateDescription('klasse', value);
            this._handleKlasseChange(value);
        } else if (type === 'secondKlasse') {
            this.trainerState.setSecondKlasse(value);
            this._updateDescription('secondKlasse', value);
        } else if (type === 'vorteil') {
            this.trainerState.setVorteil(value);
            this._updateDescription('vorteil', value);
            this._handleVorteilChange(value);
        } else if (type === 'nachteil') {
            this.trainerState.setNachteil(value);
            this._updateDescription('nachteil', value);
        }
        
        // Custom-Event feuern für andere Scripts (klasseEffekte.js, nachteilEffekte.js)
        const event = new CustomEvent('change', { bubbles: true, detail: { value, type } });
        hiddenInput.dispatchEvent(event);
    }
    
    /**
     * Zeigt den Hover-Tooltip
     * @private
     */
    _showHoverTooltip(event, name, beschreibung) {
        let tooltip = document.getElementById('dropdown-hover-tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'dropdown-hover-tooltip';
            tooltip.className = 'dropdown-hover-tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `<strong>${name}</strong><p>${beschreibung}</p>`;
        tooltip.style.display = 'block';
        
        this._moveHoverTooltip(event);
    }
    
    /**
     * Bewegt den Hover-Tooltip
     * @private
     */
    _moveHoverTooltip(event) {
        const tooltip = document.getElementById('dropdown-hover-tooltip');
        if (!tooltip) return;
        
        const x = event.clientX + 15;
        const y = event.clientY + 10;
        
        // Sicherstellen, dass Tooltip im Viewport bleibt
        const tooltipRect = tooltip.getBoundingClientRect();
        const maxX = window.innerWidth - tooltipRect.width - 20;
        const maxY = window.innerHeight - tooltipRect.height - 20;
        
        tooltip.style.left = Math.min(x, maxX) + 'px';
        tooltip.style.top = Math.min(y, maxY) + 'px';
    }
    
    /**
     * Versteckt den Hover-Tooltip
     * @private
     */
    _hideHoverTooltip() {
        const tooltip = document.getElementById('dropdown-hover-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    /**
     * Aktualisiert die Beschreibung für einen Typ
     * @private
     */
    _updateDescription(type, id) {
        let containerId, item, title, colorClass;
        
        if (type === 'klasse') {
            containerId = 'klasse-description';
            item = this._getKlassenData().find(k => k.id === id);
            title = 'Klasse';
            colorClass = 'desc-klasse';
        } else if (type === 'secondKlasse') {
            containerId = 'second-klasse-description';
            item = this._getKlassenData().find(k => k.id === id);
            title = 'Zweite Klasse';
            colorClass = 'desc-klasse';
        } else if (type === 'vorteil') {
            containerId = 'vorteil-description';
            item = this._getVorteileData().find(v => v.id === id);
            title = 'Vorteil';
            colorClass = 'desc-vorteil';
        } else if (type === 'nachteil') {
            containerId = 'nachteil-description';
            item = this._getNachteileData().find(n => n.id === id);
            title = 'Nachteil';
            colorClass = 'desc-nachteil';
        }
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (item && id) {
            container.innerHTML = `
                <div class="description-box ${colorClass}">
                    <strong>${title}: ${item.name}</strong>
                    <p>${item.beschreibung}</p>
                </div>
            `;
        } else {
            // Leere Box anzeigen statt leer zu lassen
            container.innerHTML = `
                <div class="description-box ${colorClass} empty-description">
                    <strong>${title}: --</strong>
                    <p class="empty-description-text">Keine Auswahl</p>
                </div>
            `;
        }
    }
    
    /**
     * Setzt den Wert eines Custom-Dropdowns
     * @private
     */
    _setDropdownValue(containerId, value, items) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const button = container.querySelector('.custom-dropdown-button .dropdown-text');
        if (!button) return;
        
        if (value) {
            const item = items.find(i => i.id === value);
            if (item) {
                button.textContent = item.name;
            }
        }
    }
    
    /**
     * Erstellt die Stats-Sektion mit Level, KP, GENA, PA, Initiative, BW und Wunden
     * *** AKTUALISIERT: Editierbare Felder mit Update-Buttons ***
     * @private
     */
    _createStatsSection() {
        const section = document.createElement('div');
        section.className = 'trainer-stats-section';
        
        // Kampfwerte und Formeln berechnen
        const combatValues = this.trainerState.calculateCombatValues();
        const formulas = this.trainerState.getStatFormulas();
        
        // GL-Wert für Glücks-Tokens
        const gl = this.trainerState.skillValues['GL'] || 1;
        
        // Hilfsfunktion für Stat-Feld mit Update-Button
        const createStatField = (id, label, value, statKey, formula = null) => {
            const isOverridden = this.trainerState.isManuallyOverridden(statKey);
            const overriddenClass = isOverridden ? 'manually-overridden' : '';
            const tooltipText = formula ? `Formel: ${formula}` : '';
            const labelClass = formula ? 'stat-label-with-formula' : '';
            
            return `
                <div class="stat-field">
                    <label class="${labelClass}" title="${tooltipText}">${label}:</label>
                    <div class="stat-input-wrapper">
                        <input type="number" id="${id}" 
                               class="stat-input editable-stat ${overriddenClass}" 
                               data-stat="${statKey}"
                               value="${value}">
                        <button type="button" class="stat-reset-button" 
                                data-stat="${statKey}" 
                                title="Auf berechneten Wert zurücksetzen (${combatValues[statKey]})">↻</button>
                    </div>
                </div>
            `;
        };
        
        let statsHTML = `
            <!-- Zeile 1: Level, KP, Initiative, GENA, Glücks-Tokens -->
            <div class="trainer-stats-row trainer-stats-row-1">
                <!-- Level (keine Formel) -->
                <div class="stat-field">
                    <label>Level:</label>
                    <input type="number" id="trainer-level" class="stat-input" 
                           value="${this.trainerState.level || 10}" min="1" max="100">
                </div>
                
                <!-- KP mit aktuellem Wert -->
                <div class="stat-field hp-field">
                    <label class="stat-label-with-formula" title="Formel: ${formulas.hp}">KP:</label>
                    <div class="hp-inputs">
                        <input type="number" id="trainer-current-hp" class="stat-input hp-current" 
                               value="${this.trainerState.currentHp}" min="0">
                        <span class="hp-separator">/</span>
                        <div class="stat-input-wrapper hp-max-wrapper">
                            <input type="number" id="trainer-stat-hp" 
                                   class="stat-input hp-max editable-stat ${this.trainerState.isManuallyOverridden('hp') ? 'manually-overridden' : ''}" 
                                   data-stat="hp" 
                                   value="${this.trainerState.stats.hp}">
                            <button type="button" class="stat-reset-button" 
                                    data-stat="hp" 
                                    title="Auf berechneten Wert zurücksetzen (${combatValues.hp})">↻</button>
                        </div>
                    </div>
                </div>
                
                ${createStatField('trainer-stat-initiative', 'Initiative', this.trainerState.stats.initiative, 'initiative', formulas.initiative)}
                
                ${createStatField('trainer-gena', 'GENA', this.trainerState.gena, 'gena', formulas.gena)}
                
                <!-- Glücks-Tokens mit aktuellem und maximalem Wert -->
                <div class="stat-field luck-tokens-field">
                    <label>Glücks-Tokens:</label>
                    <div class="luck-tokens-inputs">
                        <input type="number" id="trainer-luck-tokens" class="stat-input luck-current" 
                               value="${this.trainerState.luckTokens}" min="0">
                        <span class="luck-separator">/</span>
                        <div class="stat-input-wrapper luck-max-wrapper">
                            <input type="number" id="trainer-max-luck-tokens" 
                                   class="stat-input luck-max editable-stat ${this.trainerState.isManuallyOverridden('luckTokens') ? 'manually-overridden' : ''}" 
                                   data-stat="luckTokens"
                                   value="${this.trainerState.maxLuckTokens}" 
                                   title="Standard: GL = ${gl}">
                            <button type="button" class="stat-reset-button" 
                                    data-stat="luckTokens" 
                                    title="Auf GL zurücksetzen (${gl})">↻</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Zeile 2: Wunden, BW, PA -->
            <div class="trainer-stats-row trainer-stats-row-2">
                <!-- Wunden inline -->
                <div class="stat-field wounds-field">
                    <label>Wunden:</label>
                    <div class="trainer-wounds-bar-inline" id="trainer-wounds-bar">
                        ${this._createTrainerWoundCirclesHTML()}
                    </div>
                </div>
                
                ${createStatField('trainer-bw', 'BW', this.trainerState.bw, 'bw', formulas.bw)}
                
                ${createStatField('trainer-pa', 'PA', this.trainerState.pa, 'pa', formulas.pa)}
            </div>
            
            <!-- Zeile für Statuseffekte -->
            <div class="trainer-stats-row trainer-stats-row-status">
                <div class="stat-field status-effects-field" style="flex: 1;">
                    ${this._createStatusContainerHTML()}
                </div>
            </div>
            
            <!-- Perks & Kommandos Container (nebeneinander, ÜBER Attacken) -->
            <div class="perks-kommandos-container">
                <!-- Perks-Bereich (linke Seite) -->
                <div class="trainer-perks-section">
                    <div class="perks-header-row">
                        <h3 class="section-title perks-title">Perks</h3>
                        <button type="button" class="perk-add-button" id="add-perk-button" title="Perk hinzufügen">+</button>
                    </div>
                    <div class="perks-list" id="perks-list">
                        ${this._createPerksHTML()}
                    </div>
                </div>
                
                <!-- Kommandos-Bereich (rechte Seite) -->
                <div class="trainer-kommandos-section">
                    <div class="kommandos-header-row">
                        <h3 class="section-title kommandos-title">Kommandos</h3>
                        <button type="button" class="kommando-add-button" id="add-kommando-button" title="Kommando hinzufügen">+</button>
                    </div>
                    <div class="kommandos-list" id="kommandos-list">
                        ${this._createKommandosHTML()}
                    </div>
                </div>
            </div>
            
            <!-- Attacken-Bereich -->
            <div class="trainer-attacks-section">
                <div class="attacks-header-row">
                    <h3 class="section-title attacks-title">Attacken</h3>
                    <button type="button" class="attack-add-button" id="add-attack-button" title="Attacke hinzufügen">+</button>
                </div>
                <div class="attacks-table-container" id="attacks-table-container">
                    <table class="attacks-table">
                        <thead>
                            <tr>
                                <th class="attack-col-name">Name</th>
                                <th class="attack-col-type">Typ</th>
                                <th class="attack-col-damage">Schaden</th>
                                <th class="attack-col-effect">Effekt</th>
                                <th class="attack-col-actions"></th>
                            </tr>
                        </thead>
                        <tbody id="attacks-table-body">
                            ${this._createAttackRowsHTML()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        section.innerHTML = statsHTML;
        
        return section;
    }
    
    /**
     * Erstellt die Tabellenzeilen für alle Attacken
     * @returns {string} HTML für die Attacken-Zeilen
     * @private
     */
    _createAttackRowsHTML() {
        if (!this.trainerState.attacks || this.trainerState.attacks.length === 0) {
            return '';
        }
        
        return this.trainerState.attacks.map((attack, index) => `
            <tr class="attack-row" data-attack-index="${index}">
                <td class="attack-col-name">
                    <input type="text" class="attack-input attack-name" 
                           data-field="name" 
                           value="${this._escapeHtml(attack.name)}" 
                           placeholder="Name">
                </td>
                <td class="attack-col-type">
                    <input type="text" class="attack-input attack-type" 
                           data-field="type" 
                           value="${this._escapeHtml(attack.type)}" 
                           placeholder="Typ">
                </td>
                <td class="attack-col-damage">
                    <input type="text" class="attack-input attack-damage" 
                           data-field="damage" 
                           value="${this._escapeHtml(attack.damage)}" 
                           placeholder="0W6">
                </td>
                <td class="attack-col-effect">
                    <textarea class="attack-input attack-effect" 
                              data-field="effect" 
                              placeholder="Effektbeschreibung...">${this._escapeHtml(attack.effect)}</textarea>
                </td>
                <td class="attack-col-actions">
                    <button type="button" class="attack-remove-button" 
                            data-attack-index="${index}" 
                            title="Attacke entfernen">×</button>
                </td>
            </tr>
        `).join('');
    }
    
    /**
     * Escaped HTML-Sonderzeichen
     * @param {string} text - Der zu escapende Text
     * @returns {string} Der escapte Text
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ==================== PERKS UI ====================
    
    /**
     * Holt alle Perks aus dem PerkService
     * @private
     */
    _getPerksData() {
        if (typeof perkService === 'undefined') return [];
        return perkService.getAllPerks();
    }
    
    /**
     * Erstellt das HTML für die Perks-Liste
     * @returns {string} HTML für die Perks
     * @private
     */
    _createPerksHTML() {
        const perks = this.trainerState.perks || [{ id: '', chosenType: '' }];
        const allPerks = this._getPerksData();
        const selectedIds = this.trainerState.getSelectedPerkIds();
        
        return perks.map((perk, index) => {
            const selectedPerk = allPerks.find(p => p.id === perk.id);
            const beschreibung = selectedPerk ? selectedPerk.beschreibung : '';
            const requiresChoice = selectedPerk && selectedPerk.requiresChoice;
            const choices = selectedPerk && selectedPerk.choices ? selectedPerk.choices : [];
            const displayName = selectedPerk ? selectedPerk.name : '-- Perk wählen --';
            
            return `
                <div class="perk-item" data-perk-index="${index}">
                    <div class="perk-row">
                        <div class="perk-dropdown-container custom-dropdown-container" data-perk-index="${index}">
                            <div class="custom-dropdown-button perk-dropdown-button" data-perk-index="${index}">
                                <span class="dropdown-text">${displayName}</span>
                                <span class="dropdown-arrow">▼</span>
                            </div>
                            <div class="custom-dropdown-list perk-dropdown-list" style="display: none;">
                                <div class="custom-dropdown-option" data-value="" data-perk-index="${index}">
                                    -- Perk wählen --
                                </div>
                                ${allPerks.map(p => {
                                    const isSelected = perk.id === p.id;
                                    const isDisabled = !isSelected && selectedIds.includes(p.id);
                                    return `<div class="custom-dropdown-option ${isDisabled ? 'dropdown-option-disabled' : ''}" 
                                        data-value="${p.id}"
                                        data-perk-index="${index}"
                                        data-beschreibung="${this._escapeHtml(p.beschreibung)}"
                                        data-requires-choice="${p.requiresChoice || false}"
                                        data-choices="${p.choices ? p.choices.join(',') : ''}"
                                        data-name="${this._escapeHtml(p.name)}"
                                        ${isDisabled ? 'data-disabled="true"' : ''}
                                        >${p.name}</div>`;
                                }).join('')}
                            </div>
                        </div>
                        ${requiresChoice ? `
                            <select class="perk-choice-select" data-perk-index="${index}">
                                <option value="">-- Typ wählen --</option>
                                ${choices.map(c => `
                                    <option value="${c}" ${perk.chosenType === c ? 'selected' : ''}>${c}</option>
                                `).join('')}
                            </select>
                        ` : ''}
                        <button type="button" class="perk-remove-button" 
                                data-perk-index="${index}" 
                                title="Perk entfernen">×</button>
                    </div>
                    <div class="perk-description-container">
                        <textarea class="perk-description" readonly 
                                  data-perk-index="${index}">${beschreibung}</textarea>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Aktualisiert die Perks-Liste
     */
    updatePerksList() {
        const perksList = document.getElementById('perks-list');
        if (perksList) {
            perksList.innerHTML = this._createPerksHTML();
            this._addPerkEventListeners();
        }
    }
    
    /**
     * Fügt Event-Listener für Perks hinzu
     * @private
     */
    _addPerkEventListeners() {
        // Add-Button
        const addButton = document.getElementById('add-perk-button');
        if (addButton) {
            addButton.onclick = () => {
                this.trainerState.addPerk();
                this.updatePerksList();
            };
        }
        
        // Custom Dropdown Event-Listener
        const perkDropdownButtons = document.querySelectorAll('.perk-dropdown-button');
        perkDropdownButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const container = button.parentElement;
                const list = container.querySelector('.perk-dropdown-list');
                
                // Alle anderen Dropdowns schließen
                document.querySelectorAll('.perk-dropdown-list, .kommando-dropdown-list, .custom-dropdown-list').forEach(l => {
                    if (l !== list) l.style.display = 'none';
                });
                
                list.style.display = list.style.display === 'none' ? 'block' : 'none';
            });
        });
        
        // Dropdown-Optionen Event-Listener
        const perkDropdownOptions = document.querySelectorAll('.perk-dropdown-container .custom-dropdown-option');
        perkDropdownOptions.forEach(option => {
            // Hover-Tooltip
            option.addEventListener('mouseenter', (e) => {
                const beschreibung = option.dataset.beschreibung;
                const name = option.dataset.name || option.textContent.trim();
                if (beschreibung) {
                    this._showHoverTooltip(e, name, beschreibung);
                }
            });
            
            option.addEventListener('mouseleave', () => {
                this._hideHoverTooltip();
            });
            
            option.addEventListener('mousemove', (e) => {
                this._moveHoverTooltip(e);
            });
            
            // Klick-Handler
            option.addEventListener('click', (e) => {
                if (option.dataset.disabled === 'true') return;
                
                const index = parseInt(option.dataset.perkIndex, 10);
                const value = option.dataset.value;
                const container = option.closest('.perk-dropdown-container');
                const button = container.querySelector('.dropdown-text');
                const list = container.querySelector('.perk-dropdown-list');
                
                // Button-Text aktualisieren
                button.textContent = value ? option.dataset.name || option.textContent.trim() : '-- Perk wählen --';
                list.style.display = 'none';
                
                // Tooltip verstecken
                this._hideHoverTooltip();
                
                // State aktualisieren
                this.trainerState.updatePerk(index, value, '');
                this.updatePerksList();
            });
        });
        
        // Choice-Select-Änderungen (für Typ-Veteran etc.)
        const choiceSelects = document.querySelectorAll('.perk-choice-select');
        choiceSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.perkIndex, 10);
                const perk = this.trainerState.perks[index];
                this.trainerState.updatePerk(index, perk.id, e.target.value);
            });
        });
        
        // Remove-Buttons
        const removeButtons = document.querySelectorAll('.perk-remove-button');
        removeButtons.forEach(button => {
            button.onclick = (e) => {
                const index = parseInt(e.target.dataset.perkIndex, 10);
                if (this.trainerState.perks.length > 1) {
                    this.trainerState.removePerk(index);
                    this.updatePerksList();
                }
            };
        });
        
        // Klick außerhalb schließt Dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.perk-dropdown-container')) {
                document.querySelectorAll('.perk-dropdown-list').forEach(list => {
                    list.style.display = 'none';
                });
            }
        });
    }
    
    // ==================== KOMMANDOS UI ====================
    
    /**
     * Holt alle Kommandos aus dem KommandoService
     * @private
     */
    _getKommandosData() {
        if (typeof kommandoService === 'undefined') return [];
        return kommandoService.getAllKommandos();
    }
    
    /**
     * Erstellt das HTML für die Kommandos-Liste
     * @returns {string} HTML für die Kommandos
     * @private
     */
    _createKommandosHTML() {
        const kommandos = this.trainerState.kommandos || [{ id: '', chosenStat: '' }];
        const allKommandos = this._getKommandosData();
        const selectedIds = this.trainerState.getSelectedKommandoIds();
        
        return kommandos.map((kommando, index) => {
            const selectedKommando = allKommandos.find(k => k.id === kommando.id);
            const beschreibung = selectedKommando ? selectedKommando.beschreibung : '';
            const requiresChoice = selectedKommando && selectedKommando.requiresChoice;
            const choices = selectedKommando && selectedKommando.choices ? selectedKommando.choices : [];
            const displayName = selectedKommando ? selectedKommando.name : '-- Kommando wählen --';
            
            return `
                <div class="kommando-item" data-kommando-index="${index}">
                    <div class="kommando-row">
                        <div class="kommando-dropdown-container custom-dropdown-container" data-kommando-index="${index}">
                            <div class="custom-dropdown-button kommando-dropdown-button" data-kommando-index="${index}">
                                <span class="dropdown-text">${displayName}</span>
                                <span class="dropdown-arrow">▼</span>
                            </div>
                            <div class="custom-dropdown-list kommando-dropdown-list" style="display: none;">
                                <div class="custom-dropdown-option" data-value="" data-kommando-index="${index}">
                                    -- Kommando wählen --
                                </div>
                                ${allKommandos.map(k => {
                                    const isSelected = kommando.id === k.id;
                                    const isDisabled = !isSelected && selectedIds.includes(k.id);
                                    return `<div class="custom-dropdown-option ${isDisabled ? 'dropdown-option-disabled' : ''}" 
                                        data-value="${k.id}"
                                        data-kommando-index="${index}"
                                        data-beschreibung="${this._escapeHtml(k.beschreibung)}"
                                        data-requires-choice="${k.requiresChoice || false}"
                                        data-choices="${k.choices ? k.choices.join(',') : ''}"
                                        data-name="${this._escapeHtml(k.name)}"
                                        ${isDisabled ? 'data-disabled="true"' : ''}
                                        >${k.name}</div>`;
                                }).join('')}
                            </div>
                        </div>
                        ${requiresChoice ? `
                            <select class="kommando-choice-select" data-kommando-index="${index}">
                                <option value="">-- Wählen --</option>
                                ${choices.map(c => `
                                    <option value="${c}" ${kommando.chosenStat === c ? 'selected' : ''}>${c}</option>
                                `).join('')}
                            </select>
                        ` : ''}
                        <button type="button" class="kommando-remove-button" 
                                data-kommando-index="${index}" 
                                title="Kommando entfernen">×</button>
                    </div>
                    <div class="kommando-description-container">
                        <textarea class="kommando-description" readonly 
                                  data-kommando-index="${index}">${beschreibung}</textarea>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Aktualisiert die Kommandos-Liste
     */
    updateKommandosList() {
        const kommandosList = document.getElementById('kommandos-list');
        if (kommandosList) {
            kommandosList.innerHTML = this._createKommandosHTML();
            this._addKommandoEventListeners();
        }
    }
    
    /**
     * Fügt Event-Listener für Kommandos hinzu
     * @private
     */
    _addKommandoEventListeners() {
        // Add-Button
        const addButton = document.getElementById('add-kommando-button');
        if (addButton) {
            addButton.onclick = () => {
                this.trainerState.addKommando();
                this.updateKommandosList();
            };
        }
        
        // Custom Dropdown Event-Listener
        const kommandoDropdownButtons = document.querySelectorAll('.kommando-dropdown-button');
        kommandoDropdownButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const container = button.parentElement;
                const list = container.querySelector('.kommando-dropdown-list');
                
                // Alle anderen Dropdowns schließen
                document.querySelectorAll('.perk-dropdown-list, .kommando-dropdown-list, .custom-dropdown-list').forEach(l => {
                    if (l !== list) l.style.display = 'none';
                });
                
                list.style.display = list.style.display === 'none' ? 'block' : 'none';
            });
        });
        
        // Dropdown-Optionen Event-Listener
        const kommandoDropdownOptions = document.querySelectorAll('.kommando-dropdown-container .custom-dropdown-option');
        kommandoDropdownOptions.forEach(option => {
            // Hover-Tooltip
            option.addEventListener('mouseenter', (e) => {
                const beschreibung = option.dataset.beschreibung;
                const name = option.dataset.name || option.textContent.trim();
                if (beschreibung) {
                    this._showHoverTooltip(e, name, beschreibung);
                }
            });
            
            option.addEventListener('mouseleave', () => {
                this._hideHoverTooltip();
            });
            
            option.addEventListener('mousemove', (e) => {
                this._moveHoverTooltip(e);
            });
            
            // Klick-Handler
            option.addEventListener('click', (e) => {
                if (option.dataset.disabled === 'true') return;
                
                const index = parseInt(option.dataset.kommandoIndex, 10);
                const value = option.dataset.value;
                const container = option.closest('.kommando-dropdown-container');
                const button = container.querySelector('.dropdown-text');
                const list = container.querySelector('.kommando-dropdown-list');
                
                // Button-Text aktualisieren
                button.textContent = value ? option.dataset.name || option.textContent.trim() : '-- Kommando wählen --';
                list.style.display = 'none';
                
                // Tooltip verstecken
                this._hideHoverTooltip();
                
                // State aktualisieren
                this.trainerState.updateKommando(index, value, '');
                this.updateKommandosList();
            });
        });
        
        // Choice-Select-Änderungen (für "Streng dich an!" etc.)
        const choiceSelects = document.querySelectorAll('.kommando-choice-select');
        choiceSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.kommandoIndex, 10);
                const kommando = this.trainerState.kommandos[index];
                this.trainerState.updateKommando(index, kommando.id, e.target.value);
            });
        });
        
        // Remove-Buttons
        const removeButtons = document.querySelectorAll('.kommando-remove-button');
        removeButtons.forEach(button => {
            button.onclick = (e) => {
                const index = parseInt(e.target.dataset.kommandoIndex, 10);
                if (this.trainerState.kommandos.length > 1) {
                    this.trainerState.removeKommando(index);
                    this.updateKommandosList();
                }
            };
        });
        
        // Klick außerhalb schließt Dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.kommando-dropdown-container')) {
                document.querySelectorAll('.kommando-dropdown-list').forEach(list => {
                    list.style.display = 'none';
                });
            }
        });
    }
    
    /**
     * Aktualisiert die Attacken-Tabelle
     */
    updateAttacksTable() {
        const tbody = document.getElementById('attacks-table-body');
        if (tbody) {
            tbody.innerHTML = this._createAttackRowsHTML();
            this._addAttackEventListeners();
        }
    }
    
    /**
     * Fügt Event-Listener für Attacken hinzu
     * @private
     */
    _addAttackEventListeners() {
        // Add-Button
        const addButton = document.getElementById('add-attack-button');
        if (addButton) {
            addButton.onclick = () => {
                this.trainerState.addAttack();
                this.updateAttacksTable();
            };
        }
        
        // Input-Änderungen
        const attackInputs = document.querySelectorAll('.attack-input');
        attackInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const row = e.target.closest('.attack-row');
                const index = parseInt(row.dataset.attackIndex, 10);
                const field = e.target.dataset.field;
                this.trainerState.updateAttack(index, field, e.target.value);
            });
        });
        
        // Remove-Buttons
        const removeButtons = document.querySelectorAll('.attack-remove-button');
        removeButtons.forEach(button => {
            button.onclick = (e) => {
                const index = parseInt(e.target.dataset.attackIndex, 10);
                this.trainerState.removeAttack(index);
                this.updateAttacksTable();
            };
        });
    }
    
    /**
     * Erstellt nur die Wunden-Kreise (ohne Container)
     * @private
     */
    _createTrainerWoundCirclesHTML() {
        let circlesHTML = '';
        
        // 10 Wunden-Kreise erstellen
        for (let i = 1; i <= 10; i++) {
            if (i === 10) {
                // Letzter Kreis mit Totenschädel
                circlesHTML += `
                    <div class="trainer-wound-circle" data-wound-index="${i}">
                        <div class="trainer-skull">
                            <svg viewBox="0 0 100 100">
                                <path d="M50,10 C30,10 15,25 15,45 C15,55 20,63 25,68 C30,73 33,78 33,85 L40,85 C43,85 45,87 45,90 L55,90 C55,87 57,85 60,85 L67,85 C67,78 70,73 75,68 C80,63 85,55 85,45 C85,25 70,10 50,10 Z M35,45 C31.7,45 29,42.3 29,39 C29,35.7 31.7,33 35,33 C38.3,33 41,35.7 41,39 C41,42.3 38.3,45 35,45 Z M65,45 C61.7,45 59,42.3 59,39 C59,35.7 61.7,33 65,33 C68.3,33 71,35.7 71,39 C71,42.3 68.3,45 65,45 Z" />
                                <rect x="38" y="55" width="24" height="5" rx="2.5" />
                            </svg>
                        </div>
                    </div>
                `;
            } else {
                circlesHTML += `<div class="trainer-wound-circle" data-wound-index="${i}"></div>`;
            }
        }
        
        return circlesHTML;
    }
    
    /**
     * Erstellt das HTML für die Statuseffekt-Icons (Trainer)
     * @returns {string} HTML-String für die Statuseffekte
     * @private
     */
    _createStatusEffectsHTML() {
        // Prüfen ob STATUS_EFFECTS verfügbar ist
        const statusEffects = window.STATUS_EFFECTS || (typeof STATUS_EFFECTS !== 'undefined' ? STATUS_EFFECTS : null);
        
        if (!statusEffects) {
            console.warn('STATUS_EFFECTS nicht gefunden. Stelle sicher, dass statusEffectsComponent.js vor trainerSheetUIRenderer.js geladen wird.');
            return '<span style="color: #999; font-size: 0.8rem;">Statuseffekte nicht verfügbar</span>';
        }
        
        // Statuseffekte für Trainer (ohne "Verwirrt")
        const trainerStatuses = Object.values(statusEffects).filter(s => !s.pokemonOnly);
        
        // Aktive Statuses aus dem State laden
        const activeStatuses = this.trainerState.statusEffects || [];
        
        // Vorschau-Emojis für eingeklappten Zustand
        const previewEmojis = activeStatuses
            .map(id => statusEffects[id]?.emoji || '')
            .filter(e => e)
            .join(' ');
        const previewContent = previewEmojis || '<span class="status-effects-preview-empty">keine</span>';
        
        // Einklapp-Zustand aus localStorage laden
        let isCollapsed = false;
        try {
            isCollapsed = localStorage.getItem('statusEffects_collapsed_trainer-status-effects') === '1';
        } catch (e) {}
        
        return trainerStatuses.map(status => {
            const isActive = activeStatuses.includes(status.id);
            const activeClass = isActive ? 'active' : 'inactive';
            
            return `
                <div class="status-icon-wrapper" data-status-id="${status.id}" title="${status.name}">
                    <div class="status-icon ${activeClass}" 
                         data-status-id="${status.id}"
                         style="--status-color: ${status.color}; --status-border-color: ${status.borderColor};">
                        <span class="status-emoji">${status.emoji}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Erstellt den vollständigen einklappbaren Status-Container HTML für Trainer
     * @returns {string} HTML-String
     * @private
     */
    _createStatusContainerHTML() {
        // Einklapp-Zustand aus localStorage laden
        let isCollapsed = false;
        try {
            isCollapsed = localStorage.getItem('statusEffects_collapsed_trainer-status-effects') === '1';
        } catch (e) {}
        
        // Aktive Statuses für Vorschau
        const statusEffects = window.STATUS_EFFECTS || {};
        const activeStatuses = this.trainerState.statusEffects || [];
        const previewEmojis = activeStatuses
            .map(id => statusEffects[id]?.emoji || '')
            .filter(e => e)
            .join(' ');
        const previewContent = previewEmojis || '<span class="status-effects-preview-empty">keine</span>';
        
        return `
            <div class="status-effects-container${isCollapsed ? ' collapsed' : ''}" id="trainer-status-effects">
                <div class="status-effects-header" id="trainer-status-effects-header">
                    <button type="button" class="status-effects-toggle" title="Ein-/Ausklappen">▼</button>
                    <span class="status-effects-title">Status:</span>
                    <span class="status-effects-preview" id="trainer-status-effects-preview">${previewContent}</span>
                </div>
                <div class="status-effects-icons">
                    ${this._createStatusEffectsHTML()}
                </div>
            </div>
        `;
    }
    
    /**
     * Aktualisiert die Vorschau der aktiven Statuseffekte (Trainer)
     * @private
     */
    _updateStatusEffectsPreview() {
        const preview = document.getElementById('trainer-status-effects-preview');
        if (!preview) return;
        
        const statusEffects = window.STATUS_EFFECTS || {};
        const activeStatuses = this.trainerState.statusEffects || [];
        
        if (activeStatuses.length === 0) {
            preview.innerHTML = '<span class="status-effects-preview-empty">keine</span>';
        } else {
            const emojis = activeStatuses
                .map(id => statusEffects[id]?.emoji || '')
                .filter(e => e)
                .join(' ');
            preview.textContent = emojis;
        }
    }
    
    /**
     * Erstellt das HTML für die Trainer-Wunden (Legacy, für Kompatibilität)
     * @private
     */
    _createTrainerWoundsHTML() {
        let woundsHTML = `
            <div class="trainer-wounds-container" id="trainer-wounds-container">
                <div class="trainer-wounds-title">Wunden</div>
                <div class="trainer-wounds-bar" id="trainer-wounds-bar">
        `;
        
        // 10 Wunden-Kreise erstellen
        for (let i = 1; i <= 10; i++) {
            if (i === 10) {
                // Letzter Kreis mit Totenschädel
                woundsHTML += `
                    <div class="trainer-wound-circle" data-wound-index="${i}">
                        <div class="trainer-skull">
                            <svg viewBox="0 0 100 100">
                                <path d="M50,10 C30,10 15,25 15,45 C15,55 20,63 25,68 C30,73 33,78 33,85 L40,85 C43,85 45,87 45,90 L55,90 C55,87 57,85 60,85 L67,85 C67,78 70,73 75,68 C80,63 85,55 85,45 C85,25 70,10 50,10 Z M35,45 C31.7,45 29,42.3 29,39 C29,35.7 31.7,33 35,33 C38.3,33 41,35.7 41,39 C41,42.3 38.3,45 35,45 Z M65,45 C61.7,45 59,42.3 59,39 C59,35.7 61.7,33 65,33 C68.3,33 71,35.7 71,39 C71,42.3 68.3,45 65,45 Z" />
                                <rect x="38" y="55" width="24" height="5" rx="2.5" />
                            </svg>
                        </div>
                    </div>
                `;
            } else {
                woundsHTML += `<div class="trainer-wound-circle" data-wound-index="${i}"></div>`;
            }
        }
        
        woundsHTML += `
                </div>
            </div>
        `;
        
        return woundsHTML;
    }
    
    /**
     * Aktualisiert die Anzeige der Trainer-Wunden
     * @param {number} woundsCount - Anzahl der Wunden
     */
    updateTrainerWoundsDisplay(woundsCount) {
        const woundsBar = document.getElementById('trainer-wounds-bar');
        if (!woundsBar) return;
        
        const circles = woundsBar.querySelectorAll('.trainer-wound-circle');
        circles.forEach((circle, index) => {
            if (index < woundsCount) {
                circle.classList.add('marked');
            } else {
                circle.classList.remove('marked');
            }
        });
    }
    
    /**
     * Behandelt Klicks auf Wunden-Kreise
     * @param {Event} event - Das Klick-Event
     * @private
     */
    _handleWoundClick(event) {
        const circle = event.currentTarget;
        const woundIndex = parseInt(circle.dataset.woundIndex, 10);
        
        // Wenn der angeklickte Kreis bereits markiert ist
        if (circle.classList.contains('marked')) {
            // Alle Kreise ab diesem Index entmarkieren
            this.trainerState.setWounds(woundIndex - 1);
        } else {
            // Alle Kreise bis zu diesem Index markieren
            this.trainerState.setWounds(woundIndex);
        }
        
        this.updateTrainerWoundsDisplay(this.trainerState.wounds);
    }
    
    /**
     * Erstellt die Pokemon-Team-Sektion
     * @private
     */
    _createPokemonTeamSection() {
        const section = document.createElement('div');
        section.className = 'pokemon-team-section';
        
        section.innerHTML = `
            <div class="team-header-inline">
                <button id="add-pokemon-slot" class="add-slot-button" title="Slot hinzufügen">+</button>
            </div>
            <div id="pokemon-slots-container" class="pokemon-slots-grid">
                ${this._renderPokemonSlots()}
            </div>
        `;
        
        return section;
    }
    
    /**
     * Rendert die Pokemon-Slots
     * @private
     */
    _renderPokemonSlots() {
        let html = '';
        
        this.trainerState.pokemonSlots.forEach((slot, index) => {
            html += this._createPokemonSlotHTML(slot, index);
        });
        
        return html;
    }
    
    /**
     * Erstellt das HTML für einen einzelnen Pokemon-Slot
     * @param {PokemonSlot} slot - Der Slot
     * @param {number} index - Der Index
     * @private
     */
    _createPokemonSlotHTML(slot, index) {
        if (slot.isEmpty()) {
            return `
                <div class="pokemon-slot empty-slot" data-slot-index="${index}">
                    <div class="slot-content">
                        <div class="empty-slot-icon">+</div>
                        <span class="empty-slot-text">Leer</span>
                    </div>
                    <button class="remove-slot-button" data-slot-index="${index}" title="Slot entfernen">×</button>
                </div>
            `;
        } else {
            const displayName = slot.getDisplayName();
            const showNickname = slot.nickname && slot.nickname.trim() !== '';
            
            // Typ-Klassen für Hintergrundfarbe ermitteln
            const typeClasses = this._getTypeClasses(slot.types);
            
            return `
                <div class="pokemon-slot filled-slot ${typeClasses}" data-slot-index="${index}">
                    <div class="slot-content">
                        <img src="${slot.spriteUrl}" alt="${displayName}" class="pokemon-sprite">
                        ${showNickname ? `<span class="pokemon-nickname">${slot.nickname}</span>` : ''}
                        <span class="pokemon-species">${slot.germanName || slot.pokemonName}</span>
                    </div>
                    <button class="remove-slot-button" data-slot-index="${index}" title="Pokémon entfernen">×</button>
                </div>
            `;
        }
    }
    
    /**
     * Ermittelt die CSS-Klassen für die Typ-Hintergrundfarbe
     * @param {Array} types - Array der Typen (z.B. ['fire', 'flying'])
     * @returns {string} CSS-Klassen-String
     * @private
     */
    _getTypeClasses(types) {
        if (!types || types.length === 0) {
            return '';
        }
        
        // Typen auf Kleinbuchstaben normalisieren
        const normalizedTypes = types.map(t => t.toLowerCase());
        
        if (normalizedTypes.length === 1) {
            // Einzelner Typ
            return `type-${normalizedTypes[0]}`;
        } else if (normalizedTypes.length >= 2) {
            // Dual-Type: Klasse im Format "dual-type-{typ1}-{typ2}"
            return `dual-type-${normalizedTypes[0]}-${normalizedTypes[1]}`;
        }
        
        return '';
    }
    
    /**
     * Aktualisiert nur die Pokemon-Slots (ohne das ganze Sheet neu zu rendern)
     */
    updatePokemonSlots() {
        const container = document.getElementById('pokemon-slots-container');
        if (container) {
            container.innerHTML = this._renderPokemonSlots();
            this._addSlotEventListeners();
        }
    }
    
    /**
     * Lädt alle Trainer-Werte aus dem TrainerState in die UI
     * Wird aufgerufen, wenn vom Pokemon-View zum Trainer-View gewechselt wird
     */
    reloadTrainerValues() {
        const container = document.getElementById('trainer-sheet-container');
        if (!container) return;
        
        // Skill-Werte aus dem TrainerState laden
        Object.entries(this.trainerState.skillValues).forEach(([skill, value]) => {
            const input = container.querySelector(`input[data-skill="${skill}"]`);
            if (input) {
                input.value = value;
            }
        });
        
        // Stats neu laden
        const hpMaxInput = document.getElementById('trainer-stat-hp');
        if (hpMaxInput) hpMaxInput.value = this.trainerState.stats.hp;
        
        const initInput = document.getElementById('trainer-stat-initiative');
        if (initInput) initInput.value = this.trainerState.stats.initiative;
        
        const genaInput = document.getElementById('trainer-gena');
        if (genaInput) genaInput.value = this.trainerState.gena;
        
        const paInput = document.getElementById('trainer-pa');
        if (paInput) paInput.value = this.trainerState.pa;
        
        const bwInput = document.getElementById('trainer-bw');
        if (bwInput) bwInput.value = this.trainerState.bw;
        
        const currentHpInput = document.getElementById('trainer-current-hp');
        if (currentHpInput) currentHpInput.value = this.trainerState.currentHp;
        
        // Verbleibende Punkte aktualisieren
        this._updateRemainingPoints();
        
        console.log('TrainerUIRenderer: Trainer-Werte wurden neu geladen');
    }
    
    /**
     * Erstellt die Fertigkeiten-Sektion mit Color-Coding
     * @private
     */
    _createSkillsSection() {
        const section = document.createElement('div');
        section.className = 'trainer-skills-section';
        
        // Verbleibende Punkte berechnen
        const remainingBasePoints = this.trainerState.getRemainingBaseStatPoints();
        const remainingSkillPoints = this.trainerState.getRemainingSkillPoints();
        
        // Farben für Kategorien
        const categoryColors = {
            'KÖ': '#e53e3e', // Rot
            'WI': '#3182ce', // Blau
            'CH': '#d69e2e', // Gelb/Gold
            'GL': '#38a169'  // Grün
        };
        
        let html = `
            <div class="skills-points-display">
                <div class="points-display">
                    <span class="points-label">Punkte für Grundwerte: <span id="remaining-base-points" class="${remainingBasePoints < 0 ? 'negative-points' : ''}">${remainingBasePoints}</span></span>
                    <span class="points-label">Punkte für Fertigkeiten: <span id="remaining-skill-points" class="${remainingSkillPoints < 0 ? 'negative-points' : ''}">${remainingSkillPoints}</span></span>
                </div>
            </div>
        `;
        html += '<div class="skills-container">';
        
        // Für jede Kategorie (Trainer verwendet erweiterte Skill-Liste)
        const skillGroups = typeof TRAINER_SKILL_GROUPS !== 'undefined' ? TRAINER_SKILL_GROUPS : SKILL_GROUPS;
        Object.entries(skillGroups).forEach(([category, skills]) => {
            const categoryLabels = {
                'KÖ': 'Körper (KÖ)',
                'WI': 'Wissen (WI)',
                'CH': 'Charisma (CH)',
                'GL': 'Glück (GL)'
            };
            
            const color = categoryColors[category] || '#718096';
            
            // Custom Skills für diese Kategorie holen
            const customSkills = this.trainerState.getCustomSkills ? 
                this.trainerState.getCustomSkills(category) : [];
            
            // data-category Attribut für Color-Coding
            html += `
                <div class="skill-category" data-category="${category}">
                    <div class="category-header">
                        <span class="category-name">${categoryLabels[category] || category}</span>
                        <input type="number" class="category-value skill-input base-stat-input" 
                               data-skill="${category}" value="${this.trainerState.skillValues[category] || 1}"
                               min="1" max="9">
                    </div>
                    <div class="category-skills">
            `;
            
            // Standard-Skills
            skills.forEach(skill => {
                html += `
                    <div class="skill-row">
                        <span class="skill-name">${skill}</span>
                        <input type="number" class="skill-value skill-input" 
                               data-skill="${skill}" value="${this.trainerState.skillValues[skill] || 0}"
                               min="-9" max="9">
                    </div>
                `;
            });
            
            // Benutzerdefinierte Skills
            customSkills.forEach((customSkill, index) => {
                html += `
                    <div class="skill-row custom-skill-row" data-category="${category}" data-custom-index="${index}">
                        <input type="text" class="custom-skill-name trainer-custom-skill-name" 
                               data-category="${category}" data-custom-index="${index}"
                               value="${this._escapeHtml(customSkill.name)}" 
                               placeholder="Neue Fertigkeit">
                        <input type="number" class="skill-value skill-input trainer-custom-skill-value" 
                               data-category="${category}" data-custom-index="${index}"
                               value="${customSkill.value || 1}"
                               min="-9" max="9">
                        <button type="button" class="trainer-custom-skill-remove-btn" 
                                data-category="${category}" data-custom-index="${index}"
                                title="Fertigkeit entfernen">×</button>
                    </div>
                `;
            });
            
            // Plus-Button für neue Skills
            html += `
                    </div>
                    <div class="add-skill-container">
                        <button type="button" class="add-custom-skill-btn trainer-add-custom-skill-btn" 
                                data-category="${category}"
                                style="background-color: ${color}; border-color: ${color};"
                                title="Neue ${categoryLabels[category] || category}-Fertigkeit hinzufügen">+</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        section.innerHTML = html;
        
        return section;
    }
    
    /**
     * Erstellt die Inventar-Sektion
     * @private
     */
    _createInventorySection() {
        const section = document.createElement('div');
        section.className = 'trainer-inventory-section';
        
        let html = `
            <div class="inventory-header-row">
                <div class="money-field">
                    <label for="trainer-money">Geld:</label>
                    <input type="number" id="trainer-money" class="money-input" 
                           value="${this.trainerState.money || 0}" min="0" max="999999999"
                           placeholder="0">
                    <span class="money-symbol">₽</span>
                </div>
                <button type="button" id="add-inventory-item" class="inventory-add-button" title="Eintrag hinzufügen">+</button>
            </div>
            <div class="inventory-list" id="inventory-list">
                <div class="inventory-header">
                    <span class="inventory-col-name">Name</span>
                    <span class="inventory-col-quantity">Anz.</span>
                    <span class="inventory-col-description">Beschreibung</span>
                    <span class="inventory-col-actions"></span>
                </div>
        `;
        
        // Inventar-Einträge rendern
        this.trainerState.inventory.forEach((item, index) => {
            html += this._renderInventoryItem(item, index);
        });
        
        html += '</div>';
        section.innerHTML = html;
        
        return section;
    }
    
    /**
     * Rendert einen einzelnen Inventar-Eintrag
     * @param {InventoryItem} item - Der Inventar-Eintrag
     * @param {number} index - Der Index des Eintrags
     * @private
     */
    _renderInventoryItem(item, index) {
        return `
            <div class="inventory-item" data-index="${index}">
                <input type="text" class="inventory-name" 
                       data-index="${index}" data-field="name"
                       value="${this._escapeHtml(item.name)}" 
                       placeholder="Gegenstand">
                <input type="number" class="inventory-quantity" 
                       data-index="${index}" data-field="quantity"
                       value="${item.quantity}" min="0" max="999">
                <div class="inventory-description-wrapper">
                    <textarea class="inventory-description" 
                              data-index="${index}" data-field="description"
                              placeholder="Beschreibung...">${this._escapeHtml(item.description)}</textarea>
                </div>
                <button type="button" class="inventory-remove-button" 
                        data-index="${index}" title="Eintrag entfernen">×</button>
            </div>
        `;
    }
    
    /**
     * Escaped HTML-Sonderzeichen
     * @param {string} text - Der zu escapende Text
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Aktualisiert die Inventar-Anzeige
     */
    updateInventory() {
        const container = document.getElementById('inventory-list');
        if (!container) return;
        
        let html = `
            <div class="inventory-header">
                <span class="inventory-col-name">Name</span>
                <span class="inventory-col-quantity">Anz.</span>
                <span class="inventory-col-description">Beschreibung</span>
                <span class="inventory-col-actions"></span>
            </div>
        `;
        
        this.trainerState.inventory.forEach((item, index) => {
            html += this._renderInventoryItem(item, index);
        });
        
        container.innerHTML = html;
        this._addInventoryEventListeners();
    }
    
    // ==================== NOTIZEN ====================
    
    /**
     * Erstellt die Notizen-Sektion mit Tabs
     * @private
     */
    _createNotesSection() {
        const section = document.createElement('div');
        section.className = 'trainer-notes-section';
        
        // Aktiver Tab (default: personen)
        const activeTab = 'personen';
        
        let html = `
            <div class="notes-tabs">
                <button type="button" class="notes-tab active" data-tab="personen">👤 Personen</button>
                <button type="button" class="notes-tab" data-tab="orte">📍 Orte</button>
                <button type="button" class="notes-tab" data-tab="sonstiges">📝 Sonstiges</button>
            </div>
            
            <div class="notes-content">
                <!-- Personen Tab -->
                <div class="notes-tab-content active" data-tab-content="personen">
                    <div class="notes-header-row">
                        <button type="button" class="notes-add-button" data-category="personen" title="Person hinzufügen">+</button>
                    </div>
                    <div class="notes-list" id="notes-list-personen">
                        <div class="notes-table-header notes-personen-header">
                            <span class="notes-col-name">Name</span>
                            <span class="notes-col-rolle">Rolle</span>
                            <span class="notes-col-notizen">Notizen</span>
                            <span class="notes-col-actions"></span>
                        </div>
                        ${this._renderNoteEntries('personen')}
                    </div>
                </div>
                
                <!-- Orte Tab -->
                <div class="notes-tab-content" data-tab-content="orte">
                    <div class="notes-header-row">
                        <button type="button" class="notes-add-button" data-category="orte" title="Ort hinzufügen">+</button>
                    </div>
                    <div class="notes-list" id="notes-list-orte">
                        <div class="notes-table-header notes-orte-header">
                            <span class="notes-col-name">Name</span>
                            <span class="notes-col-notizen">Notizen</span>
                            <span class="notes-col-actions"></span>
                        </div>
                        ${this._renderNoteEntries('orte')}
                    </div>
                </div>
                
                <!-- Sonstiges Tab -->
                <div class="notes-tab-content" data-tab-content="sonstiges">
                    <div class="notes-header-row">
                        <button type="button" class="notes-add-button" data-category="sonstiges" title="Eintrag hinzufügen">+</button>
                    </div>
                    <div class="notes-list" id="notes-list-sonstiges">
                        <div class="notes-table-header notes-sonstiges-header">
                            <span class="notes-col-ueberschrift">Überschrift</span>
                            <span class="notes-col-notizen">Notizen</span>
                            <span class="notes-col-actions"></span>
                        </div>
                        ${this._renderNoteEntries('sonstiges')}
                    </div>
                </div>
            </div>
        `;
        
        section.innerHTML = html;
        return section;
    }
    
    /**
     * Rendert alle Notiz-Einträge einer Kategorie
     * @param {string} category - 'personen', 'orte' oder 'sonstiges'
     * @private
     */
    _renderNoteEntries(category) {
        const entries = this.trainerState.notes[category] || [];
        return entries.map((entry, index) => this._renderNoteEntry(category, entry, index)).join('');
    }
    
    /**
     * Rendert einen einzelnen Notiz-Eintrag
     * @param {string} category - Kategorie des Eintrags
     * @param {NoteEntry} entry - Der Notiz-Eintrag
     * @param {number} index - Index des Eintrags
     * @private
     */
    _renderNoteEntry(category, entry, index) {
        if (category === 'personen') {
            return `
                <div class="notes-item notes-personen-item" data-category="${category}" data-index="${index}">
                    <input type="text" class="notes-input notes-name" 
                           data-category="${category}" data-index="${index}" data-field="name"
                           value="${this._escapeHtml(entry.name || '')}" 
                           placeholder="Name">
                    <input type="text" class="notes-input notes-rolle" 
                           data-category="${category}" data-index="${index}" data-field="rolle"
                           value="${this._escapeHtml(entry.rolle || '')}" 
                           placeholder="Rolle">
                    <div class="notes-notizen-wrapper">
                        <textarea class="notes-textarea notes-notizen" 
                                  data-category="${category}" data-index="${index}" data-field="notizen"
                                  placeholder="Notizen...">${this._escapeHtml(entry.notizen || '')}</textarea>
                    </div>
                    <button type="button" class="notes-remove-button" 
                            data-category="${category}" data-index="${index}" title="Eintrag entfernen">×</button>
                </div>
            `;
        } else if (category === 'orte') {
            return `
                <div class="notes-item notes-orte-item" data-category="${category}" data-index="${index}">
                    <input type="text" class="notes-input notes-name" 
                           data-category="${category}" data-index="${index}" data-field="name"
                           value="${this._escapeHtml(entry.name || '')}" 
                           placeholder="Ortsname">
                    <div class="notes-notizen-wrapper">
                        <textarea class="notes-textarea notes-notizen" 
                                  data-category="${category}" data-index="${index}" data-field="notizen"
                                  placeholder="Notizen...">${this._escapeHtml(entry.notizen || '')}</textarea>
                    </div>
                    <button type="button" class="notes-remove-button" 
                            data-category="${category}" data-index="${index}" title="Eintrag entfernen">×</button>
                </div>
            `;
        } else if (category === 'sonstiges') {
            return `
                <div class="notes-item notes-sonstiges-item" data-category="${category}" data-index="${index}">
                    <input type="text" class="notes-input notes-ueberschrift" 
                           data-category="${category}" data-index="${index}" data-field="ueberschrift"
                           value="${this._escapeHtml(entry.ueberschrift || '')}" 
                           placeholder="Überschrift">
                    <div class="notes-notizen-wrapper">
                        <textarea class="notes-textarea notes-notizen" 
                                  data-category="${category}" data-index="${index}" data-field="notizen"
                                  placeholder="Notizen...">${this._escapeHtml(entry.notizen || '')}</textarea>
                    </div>
                    <button type="button" class="notes-remove-button" 
                            data-category="${category}" data-index="${index}" title="Eintrag entfernen">×</button>
                </div>
            `;
        }
        return '';
    }
    
    /**
     * Aktualisiert die Notizen-Anzeige für eine Kategorie
     * @param {string} category - 'personen', 'orte' oder 'sonstiges'
     */
    updateNotes(category) {
        const container = document.getElementById(`notes-list-${category}`);
        if (!container) return;
        
        // Header beibehalten
        let headerHtml = '';
        if (category === 'personen') {
            headerHtml = `
                <div class="notes-table-header notes-personen-header">
                    <span class="notes-col-name">Name</span>
                    <span class="notes-col-rolle">Rolle</span>
                    <span class="notes-col-notizen">Notizen</span>
                    <span class="notes-col-actions"></span>
                </div>
            `;
        } else if (category === 'orte') {
            headerHtml = `
                <div class="notes-table-header notes-orte-header">
                    <span class="notes-col-name">Name</span>
                    <span class="notes-col-notizen">Notizen</span>
                    <span class="notes-col-actions"></span>
                </div>
            `;
        } else if (category === 'sonstiges') {
            headerHtml = `
                <div class="notes-table-header notes-sonstiges-header">
                    <span class="notes-col-ueberschrift">Überschrift</span>
                    <span class="notes-col-notizen">Notizen</span>
                    <span class="notes-col-actions"></span>
                </div>
            `;
        }
        
        container.innerHTML = headerHtml + this._renderNoteEntries(category);
        this._addNotesEntryEventListeners(category);
    }
    
    /**
     * Fügt Event-Listener für Notizen hinzu (nur einmalig bei Initialisierung)
     * @private
     */
    _addNotesEventListeners() {
        // Tab-Wechsel - durch Klonen alte Listener entfernen
        document.querySelectorAll('.notes-tab').forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            newTab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Alle Tabs und Contents deaktivieren
                document.querySelectorAll('.notes-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.notes-tab-content').forEach(c => c.classList.remove('active'));
                
                // Gewählten Tab und Content aktivieren
                e.target.classList.add('active');
                document.querySelector(`[data-tab-content="${targetTab}"]`)?.classList.add('active');
            });
        });
        
        // Hinzufügen-Buttons - durch Klonen alte Listener entfernen
        document.querySelectorAll('.notes-add-button').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.trainerState.addNote(category);
                this.updateNotes(category);
            });
        });
        
        // Entry-spezifische Listener für alle Kategorien
        ['personen', 'orte', 'sonstiges'].forEach(category => {
            this._addNotesEntryEventListeners(category);
        });
    }
    
    /**
     * Fügt Event-Listener für Notiz-Einträge einer Kategorie hinzu
     * @param {string} category - Die Kategorie
     * @private
     */
    _addNotesEntryEventListeners(category) {
        const container = document.getElementById(`notes-list-${category}`);
        if (!container) return;
        
        // Entfernen-Buttons - durch Klonen alte Listener entfernen
        container.querySelectorAll('.notes-remove-button').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const cat = e.target.dataset.category;
                const index = parseInt(e.target.dataset.index, 10);
                
                if (this.trainerState.removeNote(cat, index)) {
                    this.updateNotes(cat);
                }
            });
        });
        
        // Input-Felder - durch Klonen alte Listener entfernen
        container.querySelectorAll('.notes-input, .notes-textarea').forEach(input => {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('change', (e) => {
                const cat = e.target.dataset.category;
                const index = parseInt(e.target.dataset.index, 10);
                const field = e.target.dataset.field;
                const value = e.target.value;
                
                this.trainerState.updateNote(cat, index, { [field]: value });
            });
            
            // Auch bei Input für schnelleres Feedback (debounced)
            newInput.addEventListener('input', (e) => {
                const cat = e.target.dataset.category;
                const index = parseInt(e.target.dataset.index, 10);
                const field = e.target.dataset.field;
                const value = e.target.value;
                
                clearTimeout(newInput._updateTimeout);
                newInput._updateTimeout = setTimeout(() => {
                    this.trainerState.updateNote(cat, index, { [field]: value });
                }, 300);
            });
        });
    }
    
    // ==================== TYP-MEISTERSCHAFT ====================
    
    /**
     * Konfiguration der Pokemon-Typen mit Farben und Symbolen
     */
    _getTypeConfig() {
        return {
            normal:   { name: 'Normal',   color: '#A8A878', icon: '⭐' },
            feuer:    { name: 'Feuer',    color: '#F08030', icon: '🔥' },
            wasser:   { name: 'Wasser',   color: '#6890F0', icon: '💧' },
            pflanze:  { name: 'Pflanze',  color: '#78C850', icon: '🌿' },
            elektro:  { name: 'Elektro',  color: '#F8D030', icon: '⚡' },
            eis:      { name: 'Eis',      color: '#98D8D8', icon: '❄️' },
            kampf:    { name: 'Kampf',    color: '#C03028', icon: '👊' },
            kaefer:   { name: 'Käfer',    color: '#A8B820', icon: '🐛' },
            gift:     { name: 'Gift',     color: '#A040A0', icon: '☠️' },
            flug:     { name: 'Flug',     color: '#A890F0', icon: '🪽' },
            boden:    { name: 'Boden',    color: '#E0C068', icon: '🏜️' },
            gestein:  { name: 'Gestein',  color: '#B8A038', icon: '🪨' },
            drache:   { name: 'Drache',   color: '#7038F8', icon: '🐲' },
            psycho:   { name: 'Psycho',   color: '#F85888', icon: '🔮' },
            geist:    { name: 'Geist',    color: '#705898', icon: '👻' },
            unlicht:  { name: 'Unlicht',  color: '#705848', icon: '🌙' },
            stahl:    { name: 'Stahl',    color: '#B8B8D0', icon: '⚙️' },
            fee:      { name: 'Fee',      color: '#EE99AC', icon: '✨' }
        };
    }
    
    /**
     * Erstellt die Typ-Meisterschaft-Sektion
     * @private
     */
    _createTypeMasterySection() {
        const section = document.createElement('div');
        section.className = 'trainer-type-mastery-section';
        
        const typeConfig = this._getTypeConfig();
        const favoriteType = this.trainerState.getFavoriteType();
        
        // Typen-Reihenfolge in 3 Zeilen á 6 Typen
        const typeRows = [
            ['normal', 'feuer', 'wasser', 'pflanze', 'elektro', 'eis'],
            ['kampf', 'kaefer', 'gift', 'flug', 'boden', 'gestein'],
            ['drache', 'psycho', 'geist', 'unlicht', 'stahl', 'fee']
        ];
        
        let html = `
            <div class="type-mastery-header">
                <div class="type-mastery-favorite-selector">
                    <label for="favorite-type-select">Lieblingstyp:</label>
                    <select id="favorite-type-select" class="favorite-type-select">
                        <option value="">-- Kein Lieblingstyp --</option>
                        ${Object.entries(typeConfig).map(([typeId, config]) => `
                            <option value="${typeId}" ${favoriteType === typeId ? 'selected' : ''}>
                                ${config.icon} ${config.name}
                            </option>
                        `).join('')}
                    </select>
                    <span class="favorite-bonus-info">(+5 Bonus)</span>
                </div>
            </div>
            
            <div class="type-mastery-grid">
        `;
        
        // Drei Zeilen erstellen
        typeRows.forEach(row => {
            html += '<div class="type-mastery-row">';
            
            row.forEach(typeId => {
                const config = typeConfig[typeId];
                const value = this.trainerState.getTypeMastery(typeId);
                const isFavorite = favoriteType === typeId;
                const effectiveValue = isFavorite ? value + 5 : value;
                
                html += `
                    <div class="type-mastery-item ${isFavorite ? 'is-favorite' : ''}" data-type="${typeId}">
                        <div class="type-mastery-label" style="background-color: ${config.color};">
                            <span class="type-icon">${config.icon}</span>
                            <span class="type-name">${config.name}</span>
                        </div>
                        <div class="type-mastery-value-container">
                            <input type="text" 
                                   class="type-mastery-input" 
                                   data-type="${typeId}"
                                   value="${effectiveValue}"
                                   data-base-value="${value}"
                                   inputmode="numeric">
                            ${isFavorite ? '<span class="favorite-indicator">★</span>' : ''}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        section.innerHTML = html;
        
        return section;
    }
    
    /**
     * Aktualisiert die Typ-Meisterschaft-Anzeige
     */
    updateTypeMastery() {
        const typeConfig = this._getTypeConfig();
        const favoriteType = this.trainerState.getFavoriteType();
        
        // Alle Type-Items aktualisieren
        document.querySelectorAll('.type-mastery-item').forEach(item => {
            const typeId = item.dataset.type;
            const input = item.querySelector('.type-mastery-input');
            const isFavorite = favoriteType === typeId;
            const baseValue = this.trainerState.getTypeMastery(typeId);
            const effectiveValue = isFavorite ? baseValue + 5 : baseValue;
            
            // Favorit-Status aktualisieren
            item.classList.toggle('is-favorite', isFavorite);
            
            // Input-Wert aktualisieren
            if (input) {
                input.value = effectiveValue;
                input.dataset.baseValue = baseValue;
            }
            
            // Favorit-Indikator anzeigen/verbergen
            let indicator = item.querySelector('.favorite-indicator');
            if (isFavorite && !indicator) {
                const container = item.querySelector('.type-mastery-value-container');
                indicator = document.createElement('span');
                indicator.className = 'favorite-indicator';
                indicator.textContent = '★';
                container.appendChild(indicator);
            } else if (!isFavorite && indicator) {
                indicator.remove();
            }
        });
        
        // Dropdown aktualisieren
        const favoriteSelect = document.getElementById('favorite-type-select');
        if (favoriteSelect) {
            favoriteSelect.value = favoriteType || '';
        }
    }
    
    /**
     * Fügt Event-Listener für Typ-Meisterschaft hinzu
     * @private
     */
    _addTypeMasteryEventListeners() {
        // Lieblingstyp-Auswahl
        const favoriteSelect = document.getElementById('favorite-type-select');
        if (favoriteSelect) {
            favoriteSelect.addEventListener('change', (e) => {
                const oldFavorite = this.trainerState.getFavoriteType();
                const newFavorite = e.target.value || null;
                
                // Alten Lieblingstyp: Basis-Wert wiederherstellen (effektiver Wert - 5)
                if (oldFavorite) {
                    const oldInput = document.querySelector(`.type-mastery-input[data-type="${oldFavorite}"]`);
                    if (oldInput) {
                        const baseValue = parseInt(oldInput.dataset.baseValue, 10) || 5;
                        this.trainerState.setTypeMastery(oldFavorite, baseValue);
                    }
                }
                
                // Neuen Lieblingstyp setzen
                this.trainerState.setFavoriteType(newFavorite);
                
                // Anzeige aktualisieren
                this.updateTypeMastery();
            });
        }
        
        // Input-Felder für Typ-Werte
        document.querySelectorAll('.type-mastery-input').forEach(input => {
            let lastValidValue = input.value;
            
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Nur ganze Zahlen erlauben
                if (!/^-?\d*$/.test(value)) {
                    e.target.value = lastValidValue;
                    return;
                }
            });
            
            input.addEventListener('change', (e) => {
                const typeId = e.target.dataset.type;
                const isFavorite = this.trainerState.getFavoriteType() === typeId;
                let inputValue = parseInt(e.target.value, 10);
                
                // Validierung: Muss eine ganze Zahl sein
                if (isNaN(inputValue)) {
                    // Zurück zum letzten gültigen Wert
                    const baseValue = parseInt(e.target.dataset.baseValue, 10) || 5;
                    const effectiveValue = isFavorite ? baseValue + 5 : baseValue;
                    e.target.value = effectiveValue;
                    return;
                }
                
                // Basis-Wert berechnen (wenn Favorit, -5 abziehen)
                let baseValue = isFavorite ? inputValue - 5 : inputValue;
                
                // Speichern
                this.trainerState.setTypeMastery(typeId, baseValue);
                e.target.dataset.baseValue = baseValue;
                lastValidValue = e.target.value;
            });
            
            input.addEventListener('blur', (e) => {
                const typeId = e.target.dataset.type;
                const isFavorite = this.trainerState.getFavoriteType() === typeId;
                const baseValue = parseInt(e.target.dataset.baseValue, 10) || 5;
                const effectiveValue = isFavorite ? baseValue + 5 : baseValue;
                
                // Bei leerem oder ungültigem Input: Zurücksetzen
                if (e.target.value === '' || isNaN(parseInt(e.target.value, 10))) {
                    e.target.value = effectiveValue;
                }
            });
        });
    }
    
    /**
     * Erstellt die Noten-Sektion
     * @private
     */
    _createGradesSection() {
        const section = document.createElement('div');
        section.className = 'trainer-grades-section';
        
        // Fächer-Konfiguration mit ID und Name
        const subjects = [
            { id: 'kaempfen', name: 'Kämpfen (Praktisch)' },
            { id: 'attackenTheorie', name: 'Attacken-Theorie' },
            { id: 'komplexeStrategien', name: 'Komplexe Strategien, Multi-Kämpfe und Items' },
            { id: 'trainingsmethoden', name: 'Trainingsmethoden' },
            { id: 'pokemonPflege', name: 'Pokémon-Pflege, Umgang und Zucht' },
            { id: 'pokemonBiologie', name: 'Pokémon-Biologie und -Anatomie' },
            { id: 'mathematik', name: 'Mathematik, Wahrscheinlichkeiten und Stats' },
            { id: 'naturwissenschaften', name: 'Naturwissenschaften' },
            { id: 'botanik', name: 'Botanik, Beeren und Aprikokos' },
            { id: 'survival', name: 'Survival' },
            { id: 'gesellschaft', name: 'Gesellschaft, Rechte und Pflichten' },
            { id: 'geographie', name: 'Geographie, Habitate und Regionskunde' },
            { id: 'kunstMusik', name: 'Kunst/Musik/Koordination (Wahl)' },
            { id: 'koerperlicheErtuecht', name: 'Körperliche Ertüchtigung' }
        ];
        
        const remainingPoints = this.trainerState.getRemainingGradePoints();
        const fivesCount = this.trainerState.countGradeFives();
        
        let html = `
            <div class="grades-info-box">
                <p class="grades-explanation">
                    Verteile 30 Punkte, um deine Noten zu verbessern. Standard ist Note 5, je mehr Punkte du ausgibst, desto besser wird die Note.<br>
                    <strong>Beispiel:</strong> 3 Punkte in einem Fach verbessern die Note 5 auf 2.
                </p>
                <div class="grades-points-display">
                    <span class="grades-points-label">Verfügbare Punkte:</span>
                    <span id="grades-remaining-points" class="grades-points-value ${remainingPoints < 0 ? 'grades-warning' : ''}">${remainingPoints}</span>
                </div>
            </div>
            
            <div id="grades-points-warning" class="grades-warning-box" style="display: ${remainingPoints < 0 ? 'block' : 'none'};">
                ⚠️ Du hast mehr Punkte ausgegeben als verfügbar!
            </div>
            
            <div id="grades-fives-warning" class="grades-warning-box" style="display: ${fivesCount > 2 ? 'block' : 'none'};">
                ⚠️ Achtung: Du hast in <span id="grades-fives-count">${fivesCount}</span> Fächern die Note 5. Erlaubt sind maximal 2!
            </div>
            
            <div class="grades-grid">
        `;
        
        // Fächer paarweise anordnen
        for (let i = 0; i < subjects.length; i += 2) {
            html += '<div class="grades-row">';
            
            // Erstes Fach
            const sub1 = subjects[i];
            const grade1 = this.trainerState.getGrade(sub1.id);
            html += this._renderGradeItem(sub1, grade1);
            
            // Zweites Fach (falls vorhanden)
            if (i + 1 < subjects.length) {
                const sub2 = subjects[i + 1];
                const grade2 = this.trainerState.getGrade(sub2.id);
                html += this._renderGradeItem(sub2, grade2);
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        section.innerHTML = html;
        
        return section;
    }
    
    /**
     * Rendert ein einzelnes Noten-Item
     * @param {Object} subject - Das Fach-Objekt mit id und name
     * @param {number} grade - Die Note (1-5)
     * @private
     */
    _renderGradeItem(subject, grade) {
        const gradeClass = this._getGradeColorClass(grade);
        return `
            <div class="grade-item">
                <span class="grade-subject-name">${subject.name}</span>
                <select class="grade-select ${gradeClass}" data-subject="${subject.id}">
                    <option value="1" ${grade === 1 ? 'selected' : ''}>1</option>
                    <option value="2" ${grade === 2 ? 'selected' : ''}>2</option>
                    <option value="3" ${grade === 3 ? 'selected' : ''}>3</option>
                    <option value="4" ${grade === 4 ? 'selected' : ''}>4</option>
                    <option value="5" ${grade === 5 ? 'selected' : ''}>5</option>
                </select>
            </div>
        `;
    }
    
    /**
     * Gibt die CSS-Klasse für eine Note zurück
     * @param {number} grade - Die Note (1-5)
     * @private
     */
    _getGradeColorClass(grade) {
        const gradeClasses = {
            1: 'grade-1',
            2: 'grade-2',
            3: 'grade-3',
            4: 'grade-4',
            5: 'grade-5'
        };
        return gradeClasses[grade] || 'grade-5';
    }
    
    /**
     * Aktualisiert die Noten-Anzeige
     */
    updateGrades() {
        const remainingPoints = this.trainerState.getRemainingGradePoints();
        const fivesCount = this.trainerState.countGradeFives();
        
        // Punkte-Anzeige aktualisieren
        const pointsDisplay = document.getElementById('grades-remaining-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = remainingPoints;
            pointsDisplay.classList.toggle('grades-warning', remainingPoints < 0);
        }
        
        // Punkte-Warnung anzeigen/verstecken
        const pointsWarning = document.getElementById('grades-points-warning');
        if (pointsWarning) {
            pointsWarning.style.display = remainingPoints < 0 ? 'block' : 'none';
        }
        
        // Fünfer-Warnung aktualisieren
        const fivesWarning = document.getElementById('grades-fives-warning');
        const fivesCountSpan = document.getElementById('grades-fives-count');
        if (fivesWarning) {
            fivesWarning.style.display = fivesCount > 2 ? 'block' : 'none';
        }
        if (fivesCountSpan) {
            fivesCountSpan.textContent = fivesCount;
        }
        
        // Alle Select-Elemente aktualisieren
        document.querySelectorAll('.grade-select').forEach(select => {
            const subject = select.dataset.subject;
            const grade = this.trainerState.getGrade(subject);
            select.value = grade;
            
            // Farb-Klasse aktualisieren
            select.classList.remove('grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5');
            select.classList.add(this._getGradeColorClass(grade));
        });
    }
    
    /**
     * Fügt Event-Listener für Noten hinzu
     * @private
     */
    _addGradesEventListeners() {
        document.querySelectorAll('.grade-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const subject = e.target.dataset.subject;
                const grade = parseInt(e.target.value, 10);
                
                this.trainerState.setGrade(subject, grade);
                
                // Farb-Klasse aktualisieren
                e.target.classList.remove('grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5');
                e.target.classList.add(this._getGradeColorClass(grade));
                
                // Warnungen und Punkte aktualisieren
                this.updateGrades();
            });
        });
    }
    
    /**
     * Fügt Event-Listener hinzu
     * @private
     */
    _addEventListeners() {
        // Trainer-Info Inputs
        const nameInput = document.getElementById('trainer-name');
        const ageInput = document.getElementById('trainer-age');
        const playedByInput = document.getElementById('trainer-played-by');
        
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                this.trainerState.setName(e.target.value);
            });
        }
        
        if (ageInput) {
            ageInput.addEventListener('input', (e) => {
                this.trainerState.setAge(e.target.value);
            });
        }
        
        if (playedByInput) {
            playedByInput.addEventListener('input', (e) => {
                this.trainerState.setPlayedBy(e.target.value);
            });
        }
        
        // Die Custom-Dropdowns haben ihre eigenen Event-Handler in _createCustomDropdown
        
        // Charakterbild-Upload
        const imageInput = document.getElementById('character-image-input');
        const imageRemoveBtn = document.getElementById('character-image-remove');
        
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                this._handleImageUpload(e);
            });
        }
        
        if (imageRemoveBtn) {
            imageRemoveBtn.addEventListener('click', () => {
                this._removeCharacterImage();
            });
        }
        
        // Level Input
        const levelInput = document.getElementById('trainer-level');
        if (levelInput) {
            levelInput.addEventListener('input', (e) => {
                this.trainerState.setLevel(parseInt(e.target.value, 10) || 1);
            });
        }
        
        // *** NEU: Event-Listener für editierbare Stats ***
        this._addEditableStatListeners();
        
        // *** NEU: Event-Listener für Reset-Buttons ***
        this._addResetButtonListeners();
        
        // Current HP mit Begrenzung auf Maximum
        const currentHpInput = document.getElementById('trainer-current-hp');
        if (currentHpInput) {
            currentHpInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value, 10) || 0;
                const maxHp = this.trainerState.stats.hp;
                
                // *** NEU: Begrenze auf Maximum ***
                if (value > maxHp) {
                    value = maxHp;
                    e.target.value = value;
                }
                
                this.trainerState.setCurrentHp(value);
            });
        }
        
        // Glücks-Tokens Event-Listener
        const luckTokensInput = document.getElementById('trainer-luck-tokens');
        if (luckTokensInput) {
            luckTokensInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value, 10) || 0;
                const maxLuck = this.trainerState.maxLuckTokens;
                
                // Begrenze auf Maximum
                if (value > maxLuck) {
                    value = maxLuck;
                    e.target.value = value;
                }
                
                this.trainerState.setLuckTokens(value);
            });
        }
        
        // Geld Event-Listener
        const moneyInput = document.getElementById('trainer-money');
        if (moneyInput) {
            moneyInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10) || 0;
                this.trainerState.setMoney(value);
            });
        }
        
        // Wunden Event-Listener
        document.querySelectorAll('.trainer-wound-circle').forEach(circle => {
            circle.addEventListener('click', (e) => this._handleWoundClick(e));
        });
        
        // Skull auch klickbar machen
        document.querySelectorAll('.trainer-skull').forEach(skull => {
            skull.addEventListener('click', (e) => {
                e.stopPropagation();
                const circle = skull.closest('.trainer-wound-circle');
                if (circle) {
                    this._handleWoundClick({ currentTarget: circle });
                }
            });
        });
        
        // Statuseffekte Header Toggle (Ein-/Ausklappen)
        const statusHeader = document.getElementById('trainer-status-effects-header');
        if (statusHeader) {
            statusHeader.addEventListener('click', (e) => {
                // Nicht toggled wenn auf ein Icon geklickt
                if (e.target.classList.contains('status-icon') || 
                    e.target.classList.contains('status-emoji') ||
                    e.target.classList.contains('status-icon-wrapper')) {
                    return;
                }
                
                const container = document.getElementById('trainer-status-effects');
                if (container) {
                    container.classList.toggle('collapsed');
                    const isCollapsed = container.classList.contains('collapsed');
                    try {
                        localStorage.setItem('statusEffects_collapsed_trainer-status-effects', isCollapsed ? '1' : '0');
                    } catch (e) {}
                }
            });
        }
        
        // Statuseffekte Toggle-Listener
        document.querySelectorAll('#trainer-status-effects .status-icon-wrapper').forEach(wrapper => {
            wrapper.addEventListener('click', () => {
                const statusId = wrapper.dataset.statusId;
                const icon = wrapper.querySelector('.status-icon');
                
                if (!icon) return;
                
                // Toggle Status
                const isCurrentlyActive = icon.classList.contains('active');
                
                if (isCurrentlyActive) {
                    icon.classList.remove('active');
                    icon.classList.add('inactive');
                    // Aus Array entfernen
                    if (!this.trainerState.statusEffects) {
                        this.trainerState.statusEffects = [];
                    }
                    const index = this.trainerState.statusEffects.indexOf(statusId);
                    if (index > -1) {
                        this.trainerState.statusEffects.splice(index, 1);
                    }
                } else {
                    icon.classList.remove('inactive');
                    icon.classList.add('active');
                    // Zu Array hinzufügen
                    if (!this.trainerState.statusEffects) {
                        this.trainerState.statusEffects = [];
                    }
                    if (!this.trainerState.statusEffects.includes(statusId)) {
                        this.trainerState.statusEffects.push(statusId);
                    }
                }
                
                // Vorschau aktualisieren
                this._updateStatusEffectsPreview();
                
                // Auto-Save
                this.trainerState._notifyChange();
            });
        });
        
        // Skill-Inputs - NUR im Trainer-Sheet-Container, nicht im Pokemon-Sheet!
        const trainerContainer = document.getElementById('trainer-sheet-container');
        if (trainerContainer) {
            trainerContainer.querySelectorAll('.skill-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const skillName = e.target.dataset.skill;
                    const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
                    
                    // Grundwerte müssen mindestens 1 sein
                    if (baseStats.includes(skillName)) {
                        let value = parseInt(e.target.value, 10) || 1;
                        if (value < 1) {
                            value = 1;
                            e.target.value = 1;
                        }
                        this.trainerState.setSkillValue(skillName, value);
                        
                        // Kampfwerte neu berechnen und anzeigen (nur nicht-überschriebene)
                        this._updateCombatValues();
                        
                        // *** NEU: Tooltips aktualisieren ***
                        this._updateStatTooltips();
                    } else {
                        this.trainerState.setSkillValue(skillName, e.target.value);
                    }
                    
                    // Verbleibende Punkte aktualisieren
                    this._updateRemainingPoints();
                });
            });
        }
        
        // Add-Slot Button
        const addSlotButton = document.getElementById('add-pokemon-slot');
        if (addSlotButton) {
            addSlotButton.addEventListener('click', () => {
                this.trainerState.addPokemonSlot();
                this.updatePokemonSlots();
            });
        }
        
        // Slot Event-Listener
        this._addSlotEventListeners();
        
        // Inventar Event-Listener
        this._addInventoryEventListeners();
        
        // Notizen Event-Listener
        this._addNotesEventListeners();
        
        // Attacken Event-Listener
        this._addAttackEventListeners();
        
        // Perks Event-Listener
        this._addPerkEventListeners();
        
        // Kommandos Event-Listener
        this._addKommandoEventListeners();
        
        // Typ-Meisterschaft Event-Listener
        this._addTypeMasteryEventListeners();
        
        // Noten Event-Listener
        this._addGradesEventListeners();
        
        // Custom-Skills Event-Listener
        this._addCustomSkillEventListeners();
    }
    
    /**
     * Fügt Event-Listener für benutzerdefinierte Fertigkeiten hinzu
     * @private
     */
    _addCustomSkillEventListeners() {
        const trainerContainer = document.getElementById('trainer-sheet-container');
        if (!trainerContainer) return;
        
        // Plus-Buttons für neue Custom-Skills
        trainerContainer.querySelectorAll('.trainer-add-custom-skill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                if (category && this.trainerState.addCustomSkill) {
                    this.trainerState.addCustomSkill(category);
                    this._refreshSkillsSection();
                }
            });
        });
        
        // Name-Änderungen bei Custom-Skills
        trainerContainer.querySelectorAll('.trainer-custom-skill-name').forEach(input => {
            input.addEventListener('change', (e) => {
                const category = e.target.dataset.category;
                const index = parseInt(e.target.dataset.customIndex, 10);
                const name = e.target.value.trim() || 'Neue Fertigkeit';
                
                if (this.trainerState.updateCustomSkill) {
                    this.trainerState.updateCustomSkill(category, index, { name });
                }
            });
        });
        
        // Wert-Änderungen bei Custom-Skills
        trainerContainer.querySelectorAll('.trainer-custom-skill-value').forEach(input => {
            input.addEventListener('input', (e) => {
                const category = e.target.dataset.category;
                const index = parseInt(e.target.dataset.customIndex, 10);
                const value = parseInt(e.target.value, 10);
                
                if (this.trainerState.updateCustomSkill) {
                    this.trainerState.updateCustomSkill(category, index, { value });
                }
                
                // Verbleibende Punkte aktualisieren
                this._updateRemainingPoints();
            });
        });
        
        // Entfernen-Buttons bei Custom-Skills
        trainerContainer.querySelectorAll('.trainer-custom-skill-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                const index = parseInt(e.target.dataset.customIndex, 10);
                
                if (this.trainerState.removeCustomSkill) {
                    this.trainerState.removeCustomSkill(category, index);
                    this._refreshSkillsSection();
                }
            });
        });
    }
    
    /**
     * Aktualisiert die Skills-Sektion nach Änderungen an benutzerdefinierten Fertigkeiten
     * @private
     */
    _refreshSkillsSection() {
        const skillsWrapper = document.querySelector('[data-section-id="skills"]');
        if (!skillsWrapper) return;
        
        const contentContainer = skillsWrapper.querySelector('.collapsible-content');
        if (!contentContainer) return;
        
        // Neue Skills-Sektion erstellen
        const newSkillsSection = this._createSkillsSection();
        
        // Alte Sektion ersetzen
        contentContainer.innerHTML = '';
        contentContainer.appendChild(newSkillsSection);
        
        // Event-Listener neu initialisieren
        this._addCustomSkillEventListeners();
        
        // Skill-Input Event-Listener auch neu initialisieren
        const trainerContainer = document.getElementById('trainer-sheet-container');
        if (trainerContainer) {
            trainerContainer.querySelectorAll('.skill-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const skillName = e.target.dataset.skill;
                    const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
                    
                    if (baseStats.includes(skillName)) {
                        let value = parseInt(e.target.value, 10) || 1;
                        if (value < 1) {
                            value = 1;
                            e.target.value = 1;
                        }
                        this.trainerState.setSkillValue(skillName, value);
                        this._updateCombatValues();
                        this._updateStatTooltips();
                    } else if (skillName) {
                        this.trainerState.setSkillValue(skillName, e.target.value);
                    }
                    
                    this._updateRemainingPoints();
                });
            });
        }
    }
    
    /**
     * Fügt Event-Listener für das Inventar hinzu
     * @private
     */
    _addInventoryEventListeners() {
        // Add-Button
        const addButton = document.getElementById('add-inventory-item');
        if (addButton) {
            // Alten Listener entfernen durch Klonen
            const newAddButton = addButton.cloneNode(true);
            addButton.parentNode.replaceChild(newAddButton, addButton);
            
            newAddButton.addEventListener('click', () => {
                this.trainerState.addInventoryItem();
                this.updateInventory();
            });
        }
        
        // Remove-Buttons
        document.querySelectorAll('.inventory-remove-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                if (this.trainerState.inventory.length > 1) {
                    this.trainerState.removeInventoryItem(index);
                    this.updateInventory();
                }
            });
        });
        
        // Input-Felder (Name, Anzahl, Beschreibung)
        document.querySelectorAll('.inventory-name, .inventory-quantity, .inventory-description').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                const field = e.target.dataset.field;
                this.trainerState.updateInventoryItem(index, { [field]: e.target.value });
            });
        });
    }
    
    /**
     * *** NEU: Fügt Event-Listener für editierbare Stats hinzu ***
     * @private
     */
    _addEditableStatListeners() {
        const editableStats = document.querySelectorAll('.editable-stat');
        
        editableStats.forEach(input => {
            input.addEventListener('input', (e) => {
                const statKey = e.target.dataset.stat;
                const value = parseInt(e.target.value, 10) || 0;
                const combatValues = this.trainerState.calculateCombatValues();
                const gl = this.trainerState.skillValues['GL'] || 1;
                
                // Prüfen, ob der Wert vom berechneten abweicht
                let calculatedValue;
                if (statKey === 'luckTokens') {
                    calculatedValue = gl;
                } else {
                    calculatedValue = combatValues[statKey];
                }
                const isNowOverridden = value !== calculatedValue;
                
                // Überschreibung setzen
                this.trainerState.setManualOverride(statKey, isNowOverridden);
                
                // Wert speichern
                switch (statKey) {
                    case 'hp':
                        this.trainerState.setStat('hp', value);
                        // Aktuelle KP begrenzen, falls nötig
                        this._clampCurrentHpToMax();
                        break;
                    case 'initiative':
                        this.trainerState.setStat('initiative', value);
                        break;
                    case 'gena':
                        this.trainerState.setGena(value);
                        break;
                    case 'pa':
                        this.trainerState.setPa(value);
                        break;
                    case 'bw':
                        this.trainerState.setBw(value);
                        break;
                    case 'luckTokens':
                        this.trainerState.setMaxLuckTokens(value);
                        // Aktuelle Tokens begrenzen, falls nötig
                        this._clampCurrentLuckToMax();
                        break;
                }
                
                // Visuellen Indikator aktualisieren
                if (isNowOverridden) {
                    e.target.classList.add('manually-overridden');
                } else {
                    e.target.classList.remove('manually-overridden');
                }
            });
        });
    }
    
    /**
     * *** NEU: Fügt Event-Listener für Reset-Buttons hinzu ***
     * @private
     */
    _addResetButtonListeners() {
        const resetButtons = document.querySelectorAll('.stat-reset-button');
        
        resetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const statKey = e.target.dataset.stat;
                
                // Stat auf berechneten Wert zurücksetzen
                this.trainerState.resetStatToCalculated(statKey);
                
                // UI aktualisieren
                const combatValues = this.trainerState.calculateCombatValues();
                const gl = this.trainerState.skillValues['GL'] || 1;
                const inputId = this._getInputIdForStat(statKey);
                const input = document.getElementById(inputId);
                
                if (input) {
                    if (statKey === 'luckTokens') {
                        input.value = gl;
                    } else {
                        input.value = combatValues[statKey];
                    }
                    input.classList.remove('manually-overridden');
                }
                
                // Falls HP-Max zurückgesetzt wurde, aktuelle KP auf Max setzen
                if (statKey === 'hp') {
                    const currentHpInput = document.getElementById('trainer-current-hp');
                    if (currentHpInput) {
                        currentHpInput.value = combatValues.hp;
                    }
                }
                
                // Falls luckTokens zurückgesetzt wurde, aktuelle Tokens auf GL setzen
                if (statKey === 'luckTokens') {
                    const currentLuckInput = document.getElementById('trainer-luck-tokens');
                    if (currentLuckInput) {
                        currentLuckInput.value = gl;
                    }
                }
                
                // Tooltips aktualisieren
                this._updateStatTooltips();
            });
        });
    }
    
    /**
     * *** NEU: Gibt die Input-ID für einen Stat zurück ***
     * @private
     */
    _getInputIdForStat(statKey) {
        const mapping = {
            'hp': 'trainer-stat-hp',
            'initiative': 'trainer-stat-initiative',
            'gena': 'trainer-gena',
            'pa': 'trainer-pa',
            'bw': 'trainer-bw',
            'luckTokens': 'trainer-max-luck-tokens'
        };
        return mapping[statKey];
    }
    
    /**
     * *** NEU: Begrenzt aktuelle KP auf Maximum ***
     * @private
     */
    _clampCurrentHpToMax() {
        const maxHp = this.trainerState.stats.hp;
        if (this.trainerState.currentHp > maxHp) {
            this.trainerState.setCurrentHp(maxHp);
            const currentHpInput = document.getElementById('trainer-current-hp');
            if (currentHpInput) {
                currentHpInput.value = maxHp;
            }
        }
    }
    
    /**
     * *** NEU: Begrenzt aktuelle Glücks-Tokens auf Maximum ***
     * @private
     */
    _clampCurrentLuckToMax() {
        const maxLuck = this.trainerState.maxLuckTokens;
        if (this.trainerState.luckTokens > maxLuck) {
            this.trainerState.setLuckTokens(maxLuck);
            const currentLuckInput = document.getElementById('trainer-luck-tokens');
            if (currentLuckInput) {
                currentLuckInput.value = maxLuck;
            }
        }
    }
    
    /**
     * *** NEU: Aktualisiert die Tooltips für alle Stats ***
     * @private
     */
    _updateStatTooltips() {
        const formulas = this.trainerState.getStatFormulas();
        const combatValues = this.trainerState.calculateCombatValues();
        const gl = this.trainerState.skillValues['GL'] || 1;
        
        const stats = ['hp', 'initiative', 'gena', 'pa', 'bw'];
        stats.forEach(statKey => {
            const inputId = this._getInputIdForStat(statKey);
            const input = document.getElementById(inputId);
            if (input) {
                input.title = `Formel: ${formulas[statKey]}`;
            }
            
            // Reset-Button Tooltip aktualisieren
            const resetButton = document.querySelector(`.stat-reset-button[data-stat="${statKey}"]`);
            if (resetButton) {
                resetButton.title = `Auf berechneten Wert zurücksetzen (${combatValues[statKey]})`;
            }
        });
        
        // Glücks-Tokens Tooltip
        const luckInput = document.getElementById('trainer-max-luck-tokens');
        if (luckInput) {
            luckInput.title = `Standard: GL = ${gl}`;
        }
        
        const luckResetButton = document.querySelector('.stat-reset-button[data-stat="luckTokens"]');
        if (luckResetButton) {
            luckResetButton.title = `Auf GL zurücksetzen (${gl})`;
        }
    }
    
    /**
     * Fügt Event-Listener für Pokemon-Slots hinzu
     * @private
     */
    _addSlotEventListeners() {
        // Remove-Buttons
        document.querySelectorAll('.remove-slot-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const slotIndex = parseInt(e.target.dataset.slotIndex, 10);
                this._confirmAndRemoveSlot(slotIndex);
            });
        });
        
        // Drag-and-Drop Event-Listener
        this._addDragAndDropListeners();
    }
    
    /**
     * Fügt Drag-and-Drop Event-Listener hinzu
     * CUSTOM IMPLEMENTATION mit Mouse-Events (nicht natives HTML5 Drag-and-Drop)
     * Der gesamte Slot ist draggable - Klick vs. Drag wird durch Bewegung unterschieden
     * @private
     */
    _addDragAndDropListeners() {
        const container = document.getElementById('pokemon-slots-container');
        if (!container) {
            console.error('[DragDrop] pokemon-slots-container nicht gefunden!');
            return;
        }
        
        const slots = container.querySelectorAll('.pokemon-slot');
        console.log(`[DragDrop] Initialisiere Custom Drag-and-Drop für ${slots.length} Pokemon-Slots`);
        
        // State für das Dragging
        let isDragging = false;
        let dragStarted = false; // Unterscheidung: Maus gedrückt vs. tatsächlich gezogen
        let draggedSlot = null;
        let draggedSlotIndex = null;
        let dragClone = null;
        let startX = 0;
        let startY = 0;
        const DRAG_THRESHOLD = 8; // Pixel die bewegt werden müssen bevor Drag startet
        
        // Referenz auf this für Callbacks
        const self = this;
        
        // Hilfsfunktion: Finde den Slot unter dem Cursor
        const getSlotAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('pokemon-slot') && el !== dragClone) {
                    return el;
                }
                // Auch Parent-Slots finden
                const parentSlot = el.closest('.pokemon-slot');
                if (parentSlot && parentSlot !== dragClone) {
                    return parentSlot;
                }
            }
            return null;
        };
        
        // ========== MOUSE MOVE (global) ==========
        const onMouseMove = (e) => {
            if (!isDragging || !draggedSlot) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            // Prüfe ob Drag-Schwelle überschritten wurde
            if (!dragStarted && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                dragStarted = true;
                
                // Jetzt erst den Clone erstellen
                draggedSlot.classList.add('dragging');
                
                // Clone erstellen - kopiere das Original so genau wie möglich
                dragClone = draggedSlot.cloneNode(true);
                dragClone.classList.remove('dragging');
                dragClone.classList.add('drag-clone');
                
                // Berechne die exakte Größe des Originals
                const rect = draggedSlot.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(draggedSlot);
                
                dragClone.style.cssText = `
                    position: fixed;
                    left: ${e.clientX - (rect.width / 2)}px;
                    top: ${e.clientY - (rect.height / 2)}px;
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    margin: 0;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
                    opacity: 0.95;
                    cursor: grabbing;
                `;
                
                // Animation im Clone deaktivieren
                const cloneSprite = dragClone.querySelector('.pokemon-sprite');
                if (cloneSprite) {
                    cloneSprite.style.animation = 'none';
                }
                
                // Remove-Button im Clone verstecken
                const cloneRemoveBtn = dragClone.querySelector('.remove-slot-button');
                if (cloneRemoveBtn) {
                    cloneRemoveBtn.style.display = 'none';
                }
                
                document.body.appendChild(dragClone);
                document.body.style.cursor = 'grabbing';
                
                console.log(`[DragDrop] Drag gestartet von Slot ${draggedSlotIndex}`);
            }
            
            // Clone-Position aktualisieren (nur wenn Drag wirklich gestartet)
            if (dragStarted && dragClone) {
                const rect = draggedSlot.getBoundingClientRect();
                dragClone.style.left = (e.clientX - (rect.width / 2)) + 'px';
                dragClone.style.top = (e.clientY - (rect.height / 2)) + 'px';
                
                // Highlight auf Ziel-Slot
                const targetSlot = getSlotAtPosition(e.clientX, e.clientY);
                
                // Alle Highlights entfernen
                container.querySelectorAll('.pokemon-slot').forEach(s => {
                    s.classList.remove('drag-over');
                });
                
                // Neuen Highlight setzen
                if (targetSlot && targetSlot !== draggedSlot) {
                    targetSlot.classList.add('drag-over');
                }
            }
        };
        
        // ========== MOUSE UP (global) ==========
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            const wasDragging = dragStarted;
            const clickedSlotIndex = draggedSlotIndex;
            
            // Ziel-Slot finden (nur wenn wirklich gedraggt wurde)
            if (wasDragging) {
                const targetSlot = getSlotAtPosition(e.clientX, e.clientY);
                
                if (targetSlot && targetSlot !== draggedSlot) {
                    const fromIndex = parseInt(draggedSlotIndex, 10);
                    const toIndex = parseInt(targetSlot.dataset.slotIndex, 10);
                    
                    console.log(`[DragDrop] Tausche Slot ${fromIndex} mit Slot ${toIndex}`);
                    
                    if (!isNaN(fromIndex) && !isNaN(toIndex) && fromIndex !== toIndex) {
                        const success = self.trainerState.swapPokemonSlots(fromIndex, toIndex);
                        
                        if (success) {
                            console.log('[DragDrop] Tausch erfolgreich!');
                            self._showDragToast('Pokemon getauscht!');
                            
                            // Cleanup
                            self._cleanupDrag(dragClone, draggedSlot, container);
                            isDragging = false;
                            dragStarted = false;
                            draggedSlot = null;
                            draggedSlotIndex = null;
                            dragClone = null;
                            
                            // UI aktualisieren
                            self.updatePokemonSlots();
                            
                            if (window.trainerManager) {
                                window.trainerManager.notifyChange();
                            }
                            
                            return;
                        }
                    }
                }
            }
            
            // Cleanup
            self._cleanupDrag(dragClone, draggedSlot, container);
            
            // Wenn NICHT gedraggt wurde (nur geklickt), dann Navigation auslösen
            if (!wasDragging && clickedSlotIndex !== null) {
                console.log(`[DragDrop] Klick auf Slot ${clickedSlotIndex} - Navigation`);
                window.navigationService.showPokemonView(parseInt(clickedSlotIndex, 10));
            }
            
            isDragging = false;
            dragStarted = false;
            draggedSlot = null;
            draggedSlotIndex = null;
            dragClone = null;
        };
        
        // Globale Event-Listener
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // Event-Listener für jeden Slot
        slots.forEach(slot => {
            const slotIndex = slot.dataset.slotIndex;
            
            // Deaktiviere natives Drag-and-Drop komplett
            slot.setAttribute('draggable', 'false');
            
            // Entferne den onclick vom slot-content (wir handhaben das jetzt selbst)
            const slotContent = slot.querySelector('.slot-content');
            if (slotContent) {
                slotContent.removeAttribute('onclick');
                slotContent.style.cursor = 'grab';
            }
            
            // ========== MOUSE DOWN auf gesamten Slot ==========
            slot.addEventListener('mousedown', function(e) {
                // Ignoriere Klicks auf den Remove-Button
                if (e.target.classList.contains('remove-slot-button')) {
                    return;
                }
                
                e.preventDefault();
                
                isDragging = true;
                dragStarted = false; // Noch kein Drag, nur Maus gedrückt
                draggedSlot = slot;
                draggedSlotIndex = slotIndex;
                startX = e.clientX;
                startY = e.clientY;
                
                // Cursor ändern um Drag-Möglichkeit anzuzeigen
                slot.style.cursor = 'grabbing';
            });
        });
        
        console.log('[DragDrop] Custom Drag-and-Drop Initialisierung abgeschlossen');
    }
    
    /**
     * Räumt nach einem Drag auf
     * @private
     */
    _cleanupDrag(dragClone, draggedSlot, container) {
        if (dragClone && dragClone.parentNode) {
            dragClone.remove();
        }
        if (draggedSlot) {
            draggedSlot.classList.remove('dragging');
            draggedSlot.style.cursor = '';
        }
        if (container) {
            container.querySelectorAll('.pokemon-slot').forEach(s => {
                s.classList.remove('drag-over');
            });
        }
        document.body.style.cursor = '';
    }
    
    /**
     * Zeigt eine Toast-Nachricht für Drag-Operationen
     * @param {string} message - Die anzuzeigende Nachricht
     * @private
     */
    _showDragToast(message) {
        const existingToast = document.querySelector('.drag-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'drag-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    /**
     * Bestätigt und entfernt einen Pokemon-Slot
     * @param {number} slotIndex - Der Index des zu entfernenden Slots
     * @private
     */
    _confirmAndRemoveSlot(slotIndex) {
        const slot = this.trainerState.pokemonSlots[slotIndex];
        let message;
        
        if (slot.isEmpty()) {
            message = 'Möchtest du diesen leeren Slot wirklich entfernen?';
        } else {
            const name = slot.nickname || slot.germanName || slot.pokemonName;
            message = `Möchtest du ${name} wirklich aus deinem Team entfernen? Die Pokemon-Daten werden ebenfalls gelöscht.`;
        }
        
        if (confirm(message)) {
            this.trainerState.removePokemonSlot(slotIndex);
            this.updatePokemonSlots();
        }
    }
    
    /**
     * Aktualisiert die angezeigten Kampfwerte basierend auf den Grundwerten
     * *** AKTUALISIERT: Berücksichtigt manuelle Überschreibungen ***
     * @private
     */
    _updateCombatValues() {
        const combatValues = this.trainerState.calculateCombatValues();
        const gl = this.trainerState.skillValues['GL'] || 1;
        
        // HP Max aktualisieren (nur wenn nicht manuell überschrieben)
        if (!this.trainerState.isManuallyOverridden('hp')) {
            const hpMaxInput = document.getElementById('trainer-stat-hp');
            if (hpMaxInput) {
                hpMaxInput.value = combatValues.hp;
                this.trainerState.stats.hp = combatValues.hp;
            }
        }
        
        // GENA aktualisieren (nur wenn nicht manuell überschrieben)
        if (!this.trainerState.isManuallyOverridden('gena')) {
            const genaInput = document.getElementById('trainer-gena');
            if (genaInput) {
                genaInput.value = combatValues.gena;
                this.trainerState.gena = combatValues.gena;
            }
        }
        
        // PA aktualisieren (nur wenn nicht manuell überschrieben)
        if (!this.trainerState.isManuallyOverridden('pa')) {
            const paInput = document.getElementById('trainer-pa');
            if (paInput) {
                paInput.value = combatValues.pa;
                this.trainerState.pa = combatValues.pa;
            }
        }
        
        // BW aktualisieren (nur wenn nicht manuell überschrieben)
        if (!this.trainerState.isManuallyOverridden('bw')) {
            const bwInput = document.getElementById('trainer-bw');
            if (bwInput) {
                bwInput.value = combatValues.bw;
                this.trainerState.bw = combatValues.bw;
            }
        }
        
        // Initiative aktualisieren (nur wenn nicht manuell überschrieben)
        if (!this.trainerState.isManuallyOverridden('initiative')) {
            const initInput = document.getElementById('trainer-stat-initiative');
            if (initInput) {
                initInput.value = combatValues.initiative;
                this.trainerState.stats.initiative = combatValues.initiative;
            }
        }
        
        // Glücks-Tokens aktualisieren (nur wenn nicht manuell überschrieben)
        if (!this.trainerState.isManuallyOverridden('luckTokens')) {
            const maxLuckInput = document.getElementById('trainer-max-luck-tokens');
            if (maxLuckInput) {
                maxLuckInput.value = gl;
                this.trainerState.maxLuckTokens = gl;
            }
            // Auch aktuelle Tokens auf GL setzen (da sie nicht überschrieben sind)
            const currentLuckInput = document.getElementById('trainer-luck-tokens');
            if (currentLuckInput) {
                currentLuckInput.value = gl;
                this.trainerState.luckTokens = gl;
            }
        }
        
        // Aktuelle KP begrenzen, falls nötig
        this._clampCurrentHpToMax();
        
        // Aktuelle Glücks-Tokens begrenzen, falls nötig
        this._clampCurrentLuckToMax();
    }
    
    /**
     * Aktualisiert die Anzeige der verbleibenden Punkte
     * @private
     */
    _updateRemainingPoints() {
        const remainingBasePoints = this.trainerState.getRemainingBaseStatPoints();
        const remainingSkillPoints = this.trainerState.getRemainingSkillPoints();
        
        const basePointsSpan = document.getElementById('remaining-base-points');
        const skillPointsSpan = document.getElementById('remaining-skill-points');
        
        if (basePointsSpan) {
            basePointsSpan.textContent = remainingBasePoints;
            basePointsSpan.className = remainingBasePoints < 0 ? 'negative-points' : '';
        }
        
        if (skillPointsSpan) {
            skillPointsSpan.textContent = remainingSkillPoints;
            skillPointsSpan.className = remainingSkillPoints < 0 ? 'negative-points' : '';
        }
    }
    
    /**
     * Initialisiert leere Beschreibungsboxen
     * @private
     */
    _initEmptyDescriptions() {
        if (!this.trainerState.klasse) {
            this._updateDescription('klasse', '');
        }
        if (!this.trainerState.vorteil) {
            this._updateDescription('vorteil', '');
        }
        if (!this.trainerState.nachteil) {
            this._updateDescription('nachteil', '');
        }
    }
    
    /**
     * Lädt gespeicherte Werte in die Inputs
     * @private
     */
    _loadSavedValues() {
        // Trainer-Info
        const nameInput = document.getElementById('trainer-name');
        const ageInput = document.getElementById('trainer-age');
        const playedByInput = document.getElementById('trainer-played-by');
        
        if (nameInput) nameInput.value = this.trainerState.name || '';
        if (ageInput) ageInput.value = this.trainerState.age || '';
        if (playedByInput) playedByInput.value = this.trainerState.playedBy || '';
        
        // Custom-Dropdowns setzen (mit kurzer Verzögerung, da sie async initialisiert werden)
        setTimeout(() => {
            // Klasse
            if (this.trainerState.klasse) {
                this._setDropdownValue('klasse-dropdown-container', this.trainerState.klasse, this._getKlassenData());
                document.getElementById('trainer-klasse').value = this.trainerState.klasse;
                this._updateDescription('klasse', this.trainerState.klasse);
            }
            
            // Vorteil (vor Klassen-Handler, da dieser die zweite Klasse beeinflusst)
            if (this.trainerState.vorteil) {
                this._setDropdownValue('vorteil-dropdown-container', this.trainerState.vorteil, this._getVorteileData());
                document.getElementById('trainer-vorteil').value = this.trainerState.vorteil;
                this._updateDescription('vorteil', this.trainerState.vorteil);
                this._handleVorteilChange(this.trainerState.vorteil);
            }
            
            // Zweite Klasse
            if (this.trainerState.secondKlasse) {
                this._setDropdownValue('second-klasse-dropdown-container', this.trainerState.secondKlasse, this._getKlassenData());
                document.getElementById('trainer-second-klasse').value = this.trainerState.secondKlasse;
                this._updateDescription('secondKlasse', this.trainerState.secondKlasse);
            }
            
            // Nachteil
            if (this.trainerState.nachteil) {
                this._setDropdownValue('nachteil-dropdown-container', this.trainerState.nachteil, this._getNachteileData());
                document.getElementById('trainer-nachteil').value = this.trainerState.nachteil;
                this._updateDescription('nachteil', this.trainerState.nachteil);
            }
        }, 100);
        
        // Leere Beschreibungsboxen initialisieren
        setTimeout(() => {
            this._initEmptyDescriptions();
        }, 150);
        
        // Charakterbild
        if (this.trainerState.characterImage) {
            this._displayCharacterImage(this.trainerState.characterImage);
        }
        
        // Level
        const levelInput = document.getElementById('trainer-level');
        if (levelInput) levelInput.value = this.trainerState.level || 10;
        
        // *** AKTUALISIERT: Kampfwerte mit Überschreibungs-Status laden ***
        // Stats werden direkt aus dem State geladen, nicht neu berechnet
        const hpMaxInput = document.getElementById('trainer-stat-hp');
        if (hpMaxInput) {
            hpMaxInput.value = this.trainerState.stats.hp;
            if (this.trainerState.isManuallyOverridden('hp')) {
                hpMaxInput.classList.add('manually-overridden');
            }
        }
        
        const initInput = document.getElementById('trainer-stat-initiative');
        if (initInput) {
            initInput.value = this.trainerState.stats.initiative;
            if (this.trainerState.isManuallyOverridden('initiative')) {
                initInput.classList.add('manually-overridden');
            }
        }
        
        const genaInput = document.getElementById('trainer-gena');
        if (genaInput) {
            genaInput.value = this.trainerState.gena;
            if (this.trainerState.isManuallyOverridden('gena')) {
                genaInput.classList.add('manually-overridden');
            }
        }
        
        const paInput = document.getElementById('trainer-pa');
        if (paInput) {
            paInput.value = this.trainerState.pa;
            if (this.trainerState.isManuallyOverridden('pa')) {
                paInput.classList.add('manually-overridden');
            }
        }
        
        const bwInput = document.getElementById('trainer-bw');
        if (bwInput) {
            bwInput.value = this.trainerState.bw;
            if (this.trainerState.isManuallyOverridden('bw')) {
                bwInput.classList.add('manually-overridden');
            }
        }
        
        // Current HP (mit Begrenzung)
        const currentHpInput = document.getElementById('trainer-current-hp');
        if (currentHpInput) {
            // Begrenze auf Maximum falls nötig
            const maxHp = this.trainerState.stats.hp;
            if (this.trainerState.currentHp > maxHp) {
                this.trainerState.setCurrentHp(maxHp);
            }
            currentHpInput.value = this.trainerState.currentHp;
        }
        
        // Glücks-Tokens (max und aktuell)
        const maxLuckInput = document.getElementById('trainer-max-luck-tokens');
        if (maxLuckInput) {
            maxLuckInput.value = this.trainerState.maxLuckTokens;
            if (this.trainerState.isManuallyOverridden('luckTokens')) {
                maxLuckInput.classList.add('manually-overridden');
            }
        }
        
        const currentLuckInput = document.getElementById('trainer-luck-tokens');
        if (currentLuckInput) {
            // Begrenze auf Maximum falls nötig
            const maxLuck = this.trainerState.maxLuckTokens;
            if (this.trainerState.luckTokens > maxLuck) {
                this.trainerState.setLuckTokens(maxLuck);
            }
            currentLuckInput.value = this.trainerState.luckTokens;
        }
        
        // Geld
        const moneyInput = document.getElementById('trainer-money');
        if (moneyInput) {
            moneyInput.value = this.trainerState.money || 0;
        }
        
        // Tooltips aktualisieren
        this._updateStatTooltips();
        
        // Verbleibende Punkte aktualisieren
        this._updateRemainingPoints();
        
        // Wunden
        this.updateTrainerWoundsDisplay(this.trainerState.wounds || 0);
        
        // Skills
        Object.entries(this.trainerState.skillValues).forEach(([skill, value]) => {
            const input = document.querySelector(`input[data-skill="${skill}"]`);
            if (input) input.value = value;
        });
        
        // Statuseffekte laden und UI aktualisieren
        if (this.trainerState.statusEffects && Array.isArray(this.trainerState.statusEffects)) {
            this.trainerState.statusEffects.forEach(statusId => {
                const icon = document.querySelector(`#trainer-status-effects .status-icon[data-status-id="${statusId}"]`);
                if (icon) {
                    icon.classList.remove('inactive');
                    icon.classList.add('active');
                }
            });
            // Vorschau aktualisieren
            this._updateStatusEffectsPreview();
        }
    }
    
    /**
     * Behandelt Änderungen an der Klassenauswahl
     * @param {string} klasseId - Die ID der gewählten Klasse
     * @private
     */
    _handleKlasseChange(klasseId) {
        const secondClassContainer = document.getElementById('second-class-container');
        
        // Zeige zweite Klasse nur wenn Vorteil "Doppelte Klasse" gewählt ist
        if (secondClassContainer && this.trainerState.vorteil === 'doppelte-klasse') {
            secondClassContainer.style.display = 'block';
        } else if (secondClassContainer) {
            secondClassContainer.style.display = 'none';
        }
    }
    
    /**
     * Behandelt Änderungen an der Vorteilauswahl
     * @param {string} vorteilId - Die ID des gewählten Vorteils
     * @private
     */
    _handleVorteilChange(vorteilId) {
        const secondClassContainer = document.getElementById('second-class-container');
        const secondClassDescContainer = document.getElementById('second-klasse-description');
        
        // Zeige zweite Klasse wenn "Doppelte Klasse" gewählt ist
        if (vorteilId === 'doppelte-klasse') {
            if (secondClassContainer) {
                secondClassContainer.style.display = 'block';
            }
            if (secondClassDescContainer) {
                secondClassDescContainer.style.display = 'block';
                // Leere Beschreibungsbox anzeigen, wenn noch keine zweite Klasse gewählt
                if (!this.trainerState.secondKlasse) {
                    this._updateDescription('secondKlasse', '');
                }
            }
        } else {
            if (secondClassContainer) {
                secondClassContainer.style.display = 'none';
            }
            if (secondClassDescContainer) {
                secondClassDescContainer.style.display = 'none';
            }
            // Zweite Klasse zurücksetzen
            const secondKlasseInput = document.getElementById('trainer-second-klasse');
            if (secondKlasseInput) {
                secondKlasseInput.value = '';
                this.trainerState.setSecondKlasse('');
            }
            // Custom-Dropdown Button zurücksetzen
            const secondDropdownContainer = document.getElementById('second-klasse-dropdown-container');
            if (secondDropdownContainer) {
                const button = secondDropdownContainer.querySelector('.dropdown-text');
                if (button) {
                    button.textContent = '-- Zweite Klasse wählen --';
                }
            }
        }
    }
    
    /**
     * Behandelt den Bild-Upload
     * @param {Event} event - Das Change-Event
     * @private
     */
    _handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validiere Dateityp
        if (!file.type.startsWith('image/')) {
            alert('Bitte wähle eine Bilddatei aus.');
            return;
        }
        
        // Validiere Dateigröße (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Das Bild ist zu groß. Maximale Größe: 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.trainerState.setCharacterImage(imageData);
            this._displayCharacterImage(imageData);
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Zeigt das Charakterbild an
     * @param {string} imageData - Base64-kodiertes Bild
     * @private
     */
    _displayCharacterImage(imageData) {
        const preview = document.getElementById('character-image-preview');
        const removeBtn = document.getElementById('character-image-remove');
        
        if (preview) {
            preview.innerHTML = `<img src="${imageData}" alt="Charakterbild" class="character-image">`;
        }
        
        if (removeBtn) {
            removeBtn.style.display = 'inline-block';
        }
    }
    
    /**
     * Entfernt das Charakterbild
     * @private
     */
    _removeCharacterImage() {
        const preview = document.getElementById('character-image-preview');
        const removeBtn = document.getElementById('character-image-remove');
        const imageInput = document.getElementById('character-image-input');
        
        this.trainerState.setCharacterImage('');
        
        if (preview) {
            preview.innerHTML = '<span class="image-placeholder-text">Kein Bild ausgewählt</span>';
        }
        
        if (removeBtn) {
            removeBtn.style.display = 'none';
        }
        
        if (imageInput) {
            imageInput.value = '';
        }
    }
}

// Global verfügbar machen
window.TrainerUIRenderer = TrainerUIRenderer;

console.log("TrainerUIRenderer ist jetzt verfügbar.");