/**
 * TrainerUIRenderer
 * Rendert das Trainer-Sheet UI
 */
class TrainerUIRenderer {
    constructor(trainerState) {
        this.trainerState = trainerState;
        
        // Zustandsvariablen für "Alle aufklappen"-Modus
        this.inventoryExpandAll = false;
        this.notesExpandAll = {
            personen: false,
            orte: false,
            sonstiges: false
        };
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
        // Kein natives draggable - wir verwenden Custom Drag & Drop
        
        // Header mit Drag-Handle, Titel und Toggle-Button
        const header = document.createElement('div');
        header.className = 'collapsible-header';
        header.style.cursor = 'pointer'; // Klicken ist Hauptaktion, langes Drücken = Drag
        header.innerHTML = `
            <div class="drag-handle-section" title="Ziehen zum Verschieben">⋮⋮</div>
            <h2 class="collapsible-title">${title}</h2>
            <button type="button" class="collapse-toggle" title="${isCollapsed ? 'Aufklappen' : 'Einklappen'}">
                <span class="collapse-icon">${isCollapsed ? '▶' : '▼'}</span>
            </button>
        `;
        
        // Toggle-Funktionalität - nur über den Button
        const toggleBtn = header.querySelector('.collapse-toggle');
        
        const toggleCollapse = () => {
            const isNowCollapsed = wrapper.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('.collapse-icon');
            icon.textContent = isNowCollapsed ? '▶' : '▼';
            toggleBtn.title = isNowCollapsed ? 'Aufklappen' : 'Einklappen';
            this._saveCollapsedState(sectionId, isNowCollapsed);
        };
        
        toggleBtn.addEventListener('click', toggleCollapse);
        
        // Content-Container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'collapsible-content';
        contentContainer.appendChild(content);
        
        wrapper.appendChild(header);
        wrapper.appendChild(contentContainer);
        
        return wrapper;
    }
    
    /**
     * Initialisiert Custom Drag & Drop für die Sektionen
     * Verwendet ein eigenes System statt natives HTML5 Drag & Drop für bessere Kontrolle.
     * - Kurzer Klick auf Header: Collapse/Expand
     * - Langes Drücken auf Header: Drag starten
     * - Drag-Handle: Sofort Drag (ohne Wartezeit)
     * @param {HTMLElement} container - Der Container mit den Sektionen
     * @private
     */
    _initDragAndDrop(container) {
        const DRAG_THRESHOLD = 5; // Pixel bevor Drag startet
        const HOLD_DELAY = 200; // Millisekunden bis Drag aktiviert wird
        const self = this;
        
        // State-Variablen
        let isDragging = false;
        let dragStarted = false;
        let draggedSection = null;
        let dragClone = null;
        let placeholder = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0; // Cursor-Offset relativ zum Element
        let offsetY = 0;
        let holdTimer = null;
        let dragEnabled = false; // Wird true nach HOLD_DELAY oder bei Drag-Handle
        
        const sections = container.querySelectorAll('.collapsible-section');
        
        // Natives Drag & Drop deaktivieren
        sections.forEach(section => {
            section.setAttribute('draggable', 'false');
        });
        
        // Hilfsfunktion: Finde die Section unter dem Cursor
        const getSectionAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('collapsible-section') && el !== dragClone) {
                    return el;
                }
                const parentSection = el.closest('.collapsible-section');
                if (parentSection && parentSection !== dragClone && container.contains(parentSection)) {
                    return parentSection;
                }
            }
            return null;
        };
        
        // Hilfsfunktion: Toggle Collapse
        const toggleCollapse = (section) => {
            const wrapper = section;
            const toggleBtn = wrapper.querySelector('.collapse-toggle');
            if (!toggleBtn) return;
            
            const isNowCollapsed = wrapper.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('.collapse-icon');
            if (icon) {
                icon.textContent = isNowCollapsed ? '▶' : '▼';
            }
            toggleBtn.title = isNowCollapsed ? 'Aufklappen' : 'Einklappen';
            self._saveCollapsedState(wrapper.dataset.sectionId, isNowCollapsed);
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
                dragClone.classList.add('section-drag-clone');
                
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
                    background: var(--bg-secondary, #2a2a2a);
                    border-radius: 12px;
                `;
                
                document.body.appendChild(dragClone);
                
                // Placeholder erstellen - nur an der exakten alten Position
                placeholder = document.createElement('div');
                placeholder.className = 'section-placeholder';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.margin = '8px 0';
                placeholder.style.border = '2px dashed var(--accent-color, #4a9eff)';
                placeholder.style.borderRadius = '12px';
                placeholder.style.background = 'rgba(74, 158, 255, 0.1)';
                
                draggedSection.parentNode.insertBefore(placeholder, draggedSection);
                draggedSection.style.display = 'none';
                
                document.body.style.cursor = 'grabbing';
            }
            
            // Clone-Position aktualisieren (mit gespeichertem Offset)
            if (dragStarted && dragClone) {
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                
                // Ziel-Section finden und Placeholder positionieren
                const targetSection = getSectionAtPosition(e.clientX, e.clientY);
                
                if (targetSection && targetSection !== draggedSection) {
                    const rect = targetSection.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        // Oberhalb der Mitte - Placeholder vor dem Element
                        if (placeholder.nextSibling !== targetSection) {
                            targetSection.parentNode.insertBefore(placeholder, targetSection);
                        }
                    } else {
                        // Unterhalb der Mitte - Placeholder nach dem Element
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
            
            const wasOnDragHandle = e.target.closest('.drag-handle-section');
            
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
                self._saveSectionOrder(container);
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
        sections.forEach(section => {
            const header = section.querySelector('.collapsible-header');
            if (!header) return;
            
            header.addEventListener('mousedown', (e) => {
                // Nicht starten wenn auf Button geklickt wurde
                if (e.target.closest('button')) return;
                
                // Verhindere Text-Selektion
                e.preventDefault();
                
                const isOnDragHandle = e.target.closest('.drag-handle-section');
                
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
                        <div class="perks-header-buttons">
                            <button type="button" class="perk-toggle-all-button" id="toggle-all-perks-button" title="Alle Beschreibungen ein-/ausblenden">📖</button>
                            <button type="button" class="perk-add-button" id="add-perk-button" title="Perk hinzufügen">+</button>
                        </div>
                    </div>
                    <div class="perks-list" id="perks-list">
                        ${this._createPerksHTML()}
                    </div>
                </div>
                
                <!-- Kommandos-Bereich (rechte Seite) -->
                <div class="trainer-kommandos-section">
                    <div class="kommandos-header-row">
                        <h3 class="section-title kommandos-title">Kommandos</h3>
                        <div class="kommandos-header-buttons">
                            <button type="button" class="kommando-toggle-all-button" id="toggle-all-kommandos-button" title="Alle Beschreibungen ein-/ausblenden">📖</button>
                            <button type="button" class="kommando-add-button" id="add-kommando-button" title="Kommando hinzufügen">+</button>
                        </div>
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
     * Ermittelt die Typ-Farbe für eine Trainer-Attacke
     * Unterstützt sowohl deutsche als auch englische Typ-Namen
     * @param {string} typeName - Der Typ-Name (deutsch oder englisch)
     * @returns {string|null} Die Farbe als Hex-Code oder null
     * @private
     */
    _getTypeColorForAttack(typeName) {
        if (!typeName) return null;
        
        const normalizedType = typeName.toLowerCase().trim();
        
        // Direkt prüfen (englischer Name)
        if (TYPE_COLORS[normalizedType]) {
            return TYPE_COLORS[normalizedType];
        }
        
        // Deutsches Mapping umkehren und prüfen
        const typeDeToEn = {};
        Object.entries(TYPE_NAMES_DE).forEach(([en, de]) => {
            typeDeToEn[de.toLowerCase()] = en;
        });
        
        const englishType = typeDeToEn[normalizedType];
        if (englishType && TYPE_COLORS[englishType]) {
            return TYPE_COLORS[englishType];
        }
        
        return null;
    }
    
    /**
     * Aktualisiert die Hintergrundfarbe einer Attacken-Zeile basierend auf dem Typ
     * @param {HTMLElement} row - Die Tabellenzeile
     * @param {string} typeName - Der Typ-Name
     * @private
     */
    _updateAttackRowColor(row, typeName) {
        const color = this._getTypeColorForAttack(typeName);
        
        if (color) {
            row.classList.add('attack-row-typed');
            row.style.backgroundColor = color;
        } else {
            row.classList.remove('attack-row-typed');
            row.style.backgroundColor = '';
        }
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
        
        return this.trainerState.attacks.map((attack, index) => {
            // Typ-Farbe ermitteln
            const typeColor = this._getTypeColorForAttack(attack.type);
            const colorClass = typeColor ? 'attack-row-typed' : '';
            const colorStyle = typeColor ? `background-color: ${typeColor};` : '';
            
            return `
            <tr class="attack-row ${colorClass}" data-attack-index="${index}" style="${colorStyle}">
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
        `}).join('');
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
            const hasBeschreibung = beschreibung && beschreibung.trim().length > 0;
            
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
                        <button type="button" class="perk-info-toggle ${hasBeschreibung ? '' : 'disabled'}" 
                                data-perk-index="${index}" 
                                title="${hasBeschreibung ? 'Beschreibung ein-/ausblenden' : 'Keine Beschreibung verfügbar'}"
                                ${hasBeschreibung ? '' : 'disabled'}>ℹ️</button>
                        <button type="button" class="perk-remove-button" 
                                data-perk-index="${index}" 
                                title="Perk entfernen">×</button>
                    </div>
                    <div class="perk-description-container collapsed" data-perk-index="${index}">
                        <div class="perk-description" data-perk-index="${index}">${beschreibung}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Aktualisiert die Perks-Liste
     * Erhält den expanded-State der Beschreibungen
     */
    updatePerksList() {
        const perksList = document.getElementById('perks-list');
        if (perksList) {
            // 1. Aktuellen expanded-State speichern (welche Indices sind offen)
            const expandedIndices = new Set();
            document.querySelectorAll('.perk-description-container').forEach(container => {
                if (!container.classList.contains('collapsed')) {
                    const index = parseInt(container.dataset.perkIndex, 10);
                    expandedIndices.add(index);
                }
            });
            
            // 2. Toggle-All Status prüfen
            const toggleAllButton = document.getElementById('toggle-all-perks-button');
            const isToggleAllActive = toggleAllButton?.classList.contains('active');
            
            // 3. HTML neu rendern
            perksList.innerHTML = this._createPerksHTML();
            this._addPerkEventListeners();
            
            // 4. Expanded-States wiederherstellen
            document.querySelectorAll('.perk-description-container').forEach(container => {
                const index = parseInt(container.dataset.perkIndex, 10);
                const infoButton = document.querySelector(`.perk-info-toggle[data-perk-index="${index}"]`);
                const desc = container.querySelector('.perk-description');
                const hasBeschreibung = desc && desc.textContent.trim().length > 0;
                
                // Öffnen wenn: (war vorher offen ODER Toggle-All aktiv) UND hat Beschreibung
                if ((expandedIndices.has(index) || isToggleAllActive) && hasBeschreibung) {
                    container.classList.remove('collapsed');
                    infoButton?.classList.add('active');
                }
            });
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
        
        // Drag & Drop initialisieren
        const perksList = document.getElementById('perks-list');
        if (perksList) {
            this._initPerksDragAndDrop(perksList);
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
        
        // Info-Toggle-Buttons für einzelne Perks
        const infoToggleButtons = document.querySelectorAll('.perk-info-toggle');
        infoToggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(button.dataset.perkIndex, 10);
                const descContainer = document.querySelector(`.perk-description-container[data-perk-index="${index}"]`);
                if (descContainer) {
                    const isCollapsed = descContainer.classList.toggle('collapsed');
                    button.classList.toggle('active', !isCollapsed);
                }
            });
        });
        
        // "Alle ein-/ausklappen" Button für Perks
        const toggleAllPerksButton = document.getElementById('toggle-all-perks-button');
        if (toggleAllPerksButton) {
            toggleAllPerksButton.onclick = () => {
                const allDescContainers = document.querySelectorAll('.perk-description-container');
                const allInfoButtons = document.querySelectorAll('.perk-info-toggle');
                
                // Prüfen ob mindestens einer offen ist
                const anyOpen = Array.from(allDescContainers).some(c => !c.classList.contains('collapsed'));
                
                // Alle umschalten
                allDescContainers.forEach(container => {
                    if (anyOpen) {
                        container.classList.add('collapsed');
                    } else {
                        // Nur öffnen wenn Beschreibung vorhanden
                        const desc = container.querySelector('.perk-description');
                        if (desc && desc.textContent.trim().length > 0) {
                            container.classList.remove('collapsed');
                        }
                    }
                });
                
                // Button-States aktualisieren
                allInfoButtons.forEach(btn => {
                    const index = parseInt(btn.dataset.perkIndex, 10);
                    const descContainer = document.querySelector(`.perk-description-container[data-perk-index="${index}"]`);
                    if (descContainer) {
                        btn.classList.toggle('active', !descContainer.classList.contains('collapsed'));
                    }
                });
                
                // Toggle-All Button State aktualisieren
                toggleAllPerksButton.classList.toggle('active', !anyOpen);
            };
        }
    }
    
    /**
     * Initialisiert Custom Drag & Drop für Perks
     * @param {HTMLElement} container - Der Container mit den Perk-Items
     * @private
     */
    _initPerksDragAndDrop(container) {
        const DRAG_THRESHOLD = 5;
        const self = this;
        
        let isDragging = false;
        let dragStarted = false;
        let draggedItem = null;
        let dragClone = null;
        let placeholder = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;
        
        const getItemAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('perk-item') && el !== dragClone) {
                    return el;
                }
                const parentItem = el.closest('.perk-item');
                if (parentItem && parentItem !== dragClone && container.contains(parentItem)) {
                    return parentItem;
                }
            }
            return null;
        };
        
        const onMouseMove = (e) => {
            if (!isDragging || !draggedItem) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            if (!dragStarted && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                dragStarted = true;
                draggedItem.classList.add('perk-item-dragging');
                
                dragClone = draggedItem.cloneNode(true);
                dragClone.classList.remove('perk-item-dragging');
                dragClone.classList.add('perk-item-drag-clone');
                
                const rect = draggedItem.getBoundingClientRect();
                offsetX = startX - rect.left;
                offsetY = startY - rect.top;
                
                dragClone.style.cssText = `
                    position: fixed;
                    left: ${rect.left}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    opacity: 0.95;
                    background: var(--bg-secondary, #2a2a2a);
                    border-radius: 8px;
                `;
                
                document.body.appendChild(dragClone);
                
                placeholder = document.createElement('div');
                placeholder.className = 'perk-item-placeholder';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.margin = '4px 0';
                placeholder.style.border = '2px dashed var(--accent-color, #4a9eff)';
                placeholder.style.borderRadius = '8px';
                placeholder.style.background = 'rgba(74, 158, 255, 0.1)';
                
                draggedItem.parentNode.insertBefore(placeholder, draggedItem);
                draggedItem.style.display = 'none';
                
                document.body.style.cursor = 'grabbing';
            }
            
            if (dragStarted && dragClone) {
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                
                const targetItem = getItemAtPosition(e.clientX, e.clientY);
                
                if (targetItem && targetItem !== draggedItem) {
                    const rect = targetItem.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        if (placeholder.nextSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem);
                        }
                    } else {
                        if (placeholder.previousSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem.nextSibling);
                        }
                    }
                }
            }
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (dragStarted && draggedItem && placeholder) {
                const items = Array.from(container.querySelectorAll('.perk-item, .perk-item-placeholder'));
                const newIndex = items.indexOf(placeholder);
                const oldIndex = parseInt(draggedItem.dataset.perkIndex, 10);
                
                if (dragClone && dragClone.parentNode) dragClone.remove();
                if (placeholder && placeholder.parentNode) placeholder.remove();
                
                draggedItem.style.display = '';
                draggedItem.classList.remove('perk-item-dragging');
                
                if (newIndex !== -1 && newIndex !== oldIndex) {
                    const adjustedNewIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
                    self._movePerk(oldIndex, adjustedNewIndex);
                }
            } else if (draggedItem) {
                draggedItem.classList.remove('perk-item-dragging');
            }
            
            document.body.style.cursor = '';
            isDragging = false;
            dragStarted = false;
            draggedItem = null;
            dragClone = null;
            placeholder = null;
        };
        
        container.querySelectorAll('.perk-item').forEach(item => {
            const row = item.querySelector('.perk-row');
            if (!row) return;
            
            row.addEventListener('mousedown', (e) => {
                if (e.target.closest('input, button, textarea, select, .custom-dropdown-button, .custom-dropdown-list')) return;
                
                e.preventDefault();
                
                isDragging = true;
                dragStarted = false;
                draggedItem = item;
                startX = e.clientX;
                startY = e.clientY;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }
    
    /**
     * Verschiebt einen Perk an eine neue Position
     * @param {number} fromIndex - Ursprünglicher Index
     * @param {number} toIndex - Ziel-Index
     * @private
     */
    _movePerk(fromIndex, toIndex) {
        const perks = this.trainerState.perks;
        if (!perks || fromIndex < 0 || fromIndex >= perks.length) return;
        
        const [movedItem] = perks.splice(fromIndex, 1);
        perks.splice(toIndex, 0, movedItem);
        
        this.updatePerksList();
        
        if (this.trainerState.save) {
            this.trainerState.save();
        }
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
            const hasBeschreibung = beschreibung && beschreibung.trim().length > 0;
            
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
                        <button type="button" class="kommando-info-toggle ${hasBeschreibung ? '' : 'disabled'}" 
                                data-kommando-index="${index}" 
                                title="${hasBeschreibung ? 'Beschreibung ein-/ausblenden' : 'Keine Beschreibung verfügbar'}"
                                ${hasBeschreibung ? '' : 'disabled'}>ℹ️</button>
                        <button type="button" class="kommando-remove-button" 
                                data-kommando-index="${index}" 
                                title="Kommando entfernen">×</button>
                    </div>
                    <div class="kommando-description-container collapsed" data-kommando-index="${index}">
                        <div class="kommando-description" data-kommando-index="${index}">${beschreibung}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Aktualisiert die Kommandos-Liste
     * Erhält den expanded-State der Beschreibungen
     */
    updateKommandosList() {
        const kommandosList = document.getElementById('kommandos-list');
        if (kommandosList) {
            // 1. Aktuellen expanded-State speichern (welche Indices sind offen)
            const expandedIndices = new Set();
            document.querySelectorAll('.kommando-description-container').forEach(container => {
                if (!container.classList.contains('collapsed')) {
                    const index = parseInt(container.dataset.kommandoIndex, 10);
                    expandedIndices.add(index);
                }
            });
            
            // 2. Toggle-All Status prüfen
            const toggleAllButton = document.getElementById('toggle-all-kommandos-button');
            const isToggleAllActive = toggleAllButton?.classList.contains('active');
            
            // 3. HTML neu rendern
            kommandosList.innerHTML = this._createKommandosHTML();
            this._addKommandoEventListeners();
            
            // 4. Expanded-States wiederherstellen
            document.querySelectorAll('.kommando-description-container').forEach(container => {
                const index = parseInt(container.dataset.kommandoIndex, 10);
                const infoButton = document.querySelector(`.kommando-info-toggle[data-kommando-index="${index}"]`);
                const desc = container.querySelector('.kommando-description');
                const hasBeschreibung = desc && desc.textContent.trim().length > 0;
                
                // Öffnen wenn: (war vorher offen ODER Toggle-All aktiv) UND hat Beschreibung
                if ((expandedIndices.has(index) || isToggleAllActive) && hasBeschreibung) {
                    container.classList.remove('collapsed');
                    infoButton?.classList.add('active');
                }
            });
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
        
        // Drag & Drop initialisieren
        const kommandosList = document.getElementById('kommandos-list');
        if (kommandosList) {
            this._initKommandosDragAndDrop(kommandosList);
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
        
        // Info-Toggle-Buttons für einzelne Kommandos
        const infoToggleButtons = document.querySelectorAll('.kommando-info-toggle');
        infoToggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(button.dataset.kommandoIndex, 10);
                const descContainer = document.querySelector(`.kommando-description-container[data-kommando-index="${index}"]`);
                if (descContainer) {
                    const isCollapsed = descContainer.classList.toggle('collapsed');
                    button.classList.toggle('active', !isCollapsed);
                }
            });
        });
        
        // "Alle ein-/ausklappen" Button für Kommandos
        const toggleAllKommandosButton = document.getElementById('toggle-all-kommandos-button');
        if (toggleAllKommandosButton) {
            toggleAllKommandosButton.onclick = () => {
                const allDescContainers = document.querySelectorAll('.kommando-description-container');
                const allInfoButtons = document.querySelectorAll('.kommando-info-toggle');
                
                // Prüfen ob mindestens einer offen ist
                const anyOpen = Array.from(allDescContainers).some(c => !c.classList.contains('collapsed'));
                
                // Alle umschalten
                allDescContainers.forEach(container => {
                    if (anyOpen) {
                        container.classList.add('collapsed');
                    } else {
                        // Nur öffnen wenn Beschreibung vorhanden
                        const desc = container.querySelector('.kommando-description');
                        if (desc && desc.textContent.trim().length > 0) {
                            container.classList.remove('collapsed');
                        }
                    }
                });
                
                // Button-States aktualisieren
                allInfoButtons.forEach(btn => {
                    const index = parseInt(btn.dataset.kommandoIndex, 10);
                    const descContainer = document.querySelector(`.kommando-description-container[data-kommando-index="${index}"]`);
                    if (descContainer) {
                        btn.classList.toggle('active', !descContainer.classList.contains('collapsed'));
                    }
                });
                
                // Toggle-All Button State aktualisieren
                toggleAllKommandosButton.classList.toggle('active', !anyOpen);
            };
        }
    }
    
    /**
     * Initialisiert Custom Drag & Drop für Kommandos
     * @param {HTMLElement} container - Der Container mit den Kommando-Items
     * @private
     */
    _initKommandosDragAndDrop(container) {
        const DRAG_THRESHOLD = 5;
        const self = this;
        
        let isDragging = false;
        let dragStarted = false;
        let draggedItem = null;
        let dragClone = null;
        let placeholder = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;
        
        const getItemAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('kommando-item') && el !== dragClone) {
                    return el;
                }
                const parentItem = el.closest('.kommando-item');
                if (parentItem && parentItem !== dragClone && container.contains(parentItem)) {
                    return parentItem;
                }
            }
            return null;
        };
        
        const onMouseMove = (e) => {
            if (!isDragging || !draggedItem) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            if (!dragStarted && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                dragStarted = true;
                draggedItem.classList.add('kommando-item-dragging');
                
                dragClone = draggedItem.cloneNode(true);
                dragClone.classList.remove('kommando-item-dragging');
                dragClone.classList.add('kommando-item-drag-clone');
                
                const rect = draggedItem.getBoundingClientRect();
                offsetX = startX - rect.left;
                offsetY = startY - rect.top;
                
                dragClone.style.cssText = `
                    position: fixed;
                    left: ${rect.left}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    opacity: 0.95;
                    background: var(--bg-secondary, #2a2a2a);
                    border-radius: 8px;
                `;
                
                document.body.appendChild(dragClone);
                
                placeholder = document.createElement('div');
                placeholder.className = 'kommando-item-placeholder';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.margin = '4px 0';
                placeholder.style.border = '2px dashed var(--accent-color, #4a9eff)';
                placeholder.style.borderRadius = '8px';
                placeholder.style.background = 'rgba(74, 158, 255, 0.1)';
                
                draggedItem.parentNode.insertBefore(placeholder, draggedItem);
                draggedItem.style.display = 'none';
                
                document.body.style.cursor = 'grabbing';
            }
            
            if (dragStarted && dragClone) {
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                
                const targetItem = getItemAtPosition(e.clientX, e.clientY);
                
                if (targetItem && targetItem !== draggedItem) {
                    const rect = targetItem.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        if (placeholder.nextSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem);
                        }
                    } else {
                        if (placeholder.previousSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem.nextSibling);
                        }
                    }
                }
            }
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (dragStarted && draggedItem && placeholder) {
                const items = Array.from(container.querySelectorAll('.kommando-item, .kommando-item-placeholder'));
                const newIndex = items.indexOf(placeholder);
                const oldIndex = parseInt(draggedItem.dataset.kommandoIndex, 10);
                
                if (dragClone && dragClone.parentNode) dragClone.remove();
                if (placeholder && placeholder.parentNode) placeholder.remove();
                
                draggedItem.style.display = '';
                draggedItem.classList.remove('kommando-item-dragging');
                
                if (newIndex !== -1 && newIndex !== oldIndex) {
                    const adjustedNewIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
                    self._moveKommando(oldIndex, adjustedNewIndex);
                }
            } else if (draggedItem) {
                draggedItem.classList.remove('kommando-item-dragging');
            }
            
            document.body.style.cursor = '';
            isDragging = false;
            dragStarted = false;
            draggedItem = null;
            dragClone = null;
            placeholder = null;
        };
        
        container.querySelectorAll('.kommando-item').forEach(item => {
            const row = item.querySelector('.kommando-row');
            if (!row) return;
            
            row.addEventListener('mousedown', (e) => {
                if (e.target.closest('input, button, textarea, select, .custom-dropdown-button, .custom-dropdown-list')) return;
                
                e.preventDefault();
                
                isDragging = true;
                dragStarted = false;
                draggedItem = item;
                startX = e.clientX;
                startY = e.clientY;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }
    
    /**
     * Verschiebt ein Kommando an eine neue Position
     * @param {number} fromIndex - Ursprünglicher Index
     * @param {number} toIndex - Ziel-Index
     * @private
     */
    _moveKommando(fromIndex, toIndex) {
        const kommandos = this.trainerState.kommandos;
        if (!kommandos || fromIndex < 0 || fromIndex >= kommandos.length) return;
        
        const [movedItem] = kommandos.splice(fromIndex, 1);
        kommandos.splice(toIndex, 0, movedItem);
        
        this.updateKommandosList();
        
        if (this.trainerState.save) {
            this.trainerState.save();
        }
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
        
        // Drag & Drop initialisieren
        const tbody = document.getElementById('attacks-table-body');
        if (tbody) {
            this._initAttacksDragAndDrop(tbody);
        }
        
        // Input-Änderungen
        const attackInputs = document.querySelectorAll('.attack-input');
        attackInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const row = e.target.closest('.attack-row');
                const index = parseInt(row.dataset.attackIndex, 10);
                const field = e.target.dataset.field;
                this.trainerState.updateAttack(index, field, e.target.value);
                
                // Bei Typ-Änderung: Zeilen-Farbe aktualisieren
                if (field === 'type') {
                    this._updateAttackRowColor(row, e.target.value);
                }
            });
            
            // Live-Aktualisierung bei Typ-Eingabe (für sofortiges Feedback)
            if (input.dataset.field === 'type') {
                input.addEventListener('input', (e) => {
                    const row = e.target.closest('.attack-row');
                    this._updateAttackRowColor(row, e.target.value);
                });
            }
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
     * Initialisiert Custom Drag & Drop für Attacken
     * @param {HTMLElement} tbody - Der tbody mit den Attacken-Zeilen
     * @private
     */
    _initAttacksDragAndDrop(tbody) {
        const DRAG_THRESHOLD = 5;
        const self = this;
        
        let isDragging = false;
        let dragStarted = false;
        let draggedRow = null;
        let dragClone = null;
        let placeholder = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;
        
        const getRowAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('attack-row') && el !== dragClone) {
                    return el;
                }
                const parentRow = el.closest('.attack-row');
                if (parentRow && parentRow !== dragClone && tbody.contains(parentRow)) {
                    return parentRow;
                }
            }
            return null;
        };
        
        const onMouseMove = (e) => {
            if (!isDragging || !draggedRow) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            if (!dragStarted && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                dragStarted = true;
                draggedRow.classList.add('attack-row-dragging');
                
                dragClone = draggedRow.cloneNode(true);
                dragClone.classList.remove('attack-row-dragging');
                dragClone.classList.add('attack-row-drag-clone');
                
                const rect = draggedRow.getBoundingClientRect();
                offsetX = startX - rect.left;
                offsetY = startY - rect.top;
                
                dragClone.style.cssText = `
                    position: fixed;
                    left: ${rect.left}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    opacity: 0.95;
                    background: var(--bg-secondary, #2a2a2a);
                    display: table-row;
                `;
                
                document.body.appendChild(dragClone);
                
                placeholder = document.createElement('tr');
                placeholder.className = 'attack-row-placeholder';
                placeholder.innerHTML = `<td colspan="5" style="height: ${rect.height}px; border: 2px dashed var(--accent-color, #4a9eff); background: rgba(74, 158, 255, 0.1);"></td>`;
                
                draggedRow.parentNode.insertBefore(placeholder, draggedRow);
                draggedRow.style.display = 'none';
                
                document.body.style.cursor = 'grabbing';
            }
            
            if (dragStarted && dragClone) {
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                
                const targetRow = getRowAtPosition(e.clientX, e.clientY);
                
                if (targetRow && targetRow !== draggedRow) {
                    const rect = targetRow.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        if (placeholder.nextSibling !== targetRow) {
                            targetRow.parentNode.insertBefore(placeholder, targetRow);
                        }
                    } else {
                        if (placeholder.previousSibling !== targetRow) {
                            targetRow.parentNode.insertBefore(placeholder, targetRow.nextSibling);
                        }
                    }
                }
            }
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (dragStarted && draggedRow && placeholder) {
                const rows = Array.from(tbody.querySelectorAll('.attack-row, .attack-row-placeholder'));
                const newIndex = rows.indexOf(placeholder);
                const oldIndex = parseInt(draggedRow.dataset.attackIndex, 10);
                
                if (dragClone && dragClone.parentNode) dragClone.remove();
                if (placeholder && placeholder.parentNode) placeholder.remove();
                
                draggedRow.style.display = '';
                draggedRow.classList.remove('attack-row-dragging');
                
                if (newIndex !== -1 && newIndex !== oldIndex) {
                    const adjustedNewIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
                    self._moveAttack(oldIndex, adjustedNewIndex);
                }
            } else if (draggedRow) {
                draggedRow.classList.remove('attack-row-dragging');
            }
            
            document.body.style.cursor = '';
            isDragging = false;
            dragStarted = false;
            draggedRow = null;
            dragClone = null;
            placeholder = null;
        };
        
        tbody.querySelectorAll('.attack-row').forEach(row => {
            row.addEventListener('mousedown', (e) => {
                if (e.target.closest('input, button, textarea, select')) return;
                
                e.preventDefault();
                
                isDragging = true;
                dragStarted = false;
                draggedRow = row;
                startX = e.clientX;
                startY = e.clientY;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }
    
    /**
     * Verschiebt eine Attacke an eine neue Position
     * @param {number} fromIndex - Ursprünglicher Index
     * @param {number} toIndex - Ziel-Index
     * @private
     */
    _moveAttack(fromIndex, toIndex) {
        const attacks = this.trainerState.attacks;
        if (!attacks || fromIndex < 0 || fromIndex >= attacks.length) return;
        
        const [movedItem] = attacks.splice(fromIndex, 1);
        attacks.splice(toIndex, 0, movedItem);
        
        this.updateAttacksTable();
        
        if (this.trainerState.save) {
            this.trainerState.save();
        }
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
        
        // Skill-Werte aus dem TrainerState laden - Gesamtwerte-Modus berücksichtigen
        const isTotalMode = window.skillDisplayModeService?.isTotalMode() || false;
        Object.entries(this.trainerState.skillValues).forEach(([skill, value]) => {
            const input = container.querySelector(`input[data-skill="${skill}"]`);
            if (!input) return;
            
            // Grundwerte (KÖ, WI, CH, GL) werden immer direkt gesetzt
            const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
            if (baseStats.includes(skill)) {
                input.value = value;
                return;
            }
            
            // Für Fertigkeiten: Im Gesamtwerte-Modus den Summen-Wert anzeigen
            if (isTotalMode && window.skillDisplayModeService) {
                const displayInfo = window.skillDisplayModeService.getDisplayValue(
                    skill, value, this.trainerState.skillValues
                );
                input.value = displayInfo.displayValue;
                input.dataset.baseValue = value.toString();
                if (displayInfo.isTotal) {
                    input.classList.add('skill-total-mode');
                }
            } else {
                input.value = value;
            }
        });
        
        // Custom-Skills auch mit Gesamtwerte-Modus laden
        if (isTotalMode && window.skillDisplayModeService) {
            const skillGroups = typeof TRAINER_SKILL_GROUPS !== 'undefined' ? TRAINER_SKILL_GROUPS : SKILL_GROUPS;
            Object.keys(skillGroups).forEach(category => {
                const customSkills = this.trainerState.getCustomSkills ? 
                    this.trainerState.getCustomSkills(category) : [];
                    
                customSkills.forEach((customSkill, index) => {
                    const input = container.querySelector(
                        `input.trainer-custom-skill-value[data-category="${category}"][data-custom-index="${index}"]`
                    );
                    if (!input) return;
                    
                    const skillValue = customSkill.value || 0;
                    const displayInfo = window.skillDisplayModeService.getDisplayValueForCustomSkill(
                        category, skillValue, this.trainerState.skillValues
                    );
                    input.value = displayInfo.displayValue;
                    input.dataset.baseValue = skillValue.toString();
                    if (displayInfo.isTotal) {
                        input.classList.add('skill-total-mode');
                    }
                });
            });
        }
        
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
        
        // Aktuellen Modus vom Service holen
        const isTotalMode = window.skillDisplayModeService?.isTotalMode() || false;
        
        // Farben für Kategorien
        const categoryColors = {
            'KÖ': '#e53e3e', // Rot
            'WI': '#3182ce', // Blau
            'CH': '#d69e2e', // Gelb/Gold
            'GL': '#38a169'  // Grün
        };
        
        // Toggle-Button HTML
        const toggleButtonHtml = `
            <button type="button" 
                    id="trainer-skill-display-mode-toggle" 
                    class="skill-display-mode-toggle ${isTotalMode ? 'mode-total' : 'mode-individual'}"
                    title="${isTotalMode 
                        ? 'Gesamtwerte-Modus aktiv (Fertigkeit + Grundwert)\nKlicken für Einzelwerte'
                        : 'Einzelwerte-Modus aktiv\nKlicken für Gesamtwerte (Fertigkeit + Grundwert)'}"
            >${isTotalMode ? 'Σ' : '#'}</button>
        `;
        
        let html = `
            <div class="skills-header-container trainer-skills-header">
                <div class="skills-points-display">
                    <div class="points-display">
                        <span class="points-label">Punkte für Grundwerte: <span id="remaining-base-points" class="${remainingBasePoints < 0 ? 'negative-points' : ''}">${remainingBasePoints}</span></span>
                        <span class="points-label">Punkte für Fertigkeiten: <span id="remaining-skill-points" class="${remainingSkillPoints < 0 ? 'negative-points' : ''}">${remainingSkillPoints}</span></span>
                    </div>
                </div>
                ${toggleButtonHtml}
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
                const baseValue = this.trainerState.skillValues[skill] || 0;
                const displayInfo = window.skillDisplayModeService?.getDisplayValue(
                    skill, baseValue, this.trainerState.skillValues
                ) || { displayValue: baseValue, isTotal: false };
                
                const totalModeClass = displayInfo.isTotal ? ' skill-total-mode' : '';
                
                html += `
                    <div class="skill-row">
                        <span class="skill-name">${skill}</span>
                        <input type="number" class="skill-value skill-input${totalModeClass}" 
                               data-skill="${skill}" 
                               data-base-value="${baseValue}"
                               value="${displayInfo.displayValue}"
                               min="-9" max="99">
                    </div>
                `;
            });
            
            // Benutzerdefinierte Skills
            customSkills.forEach((customSkill, index) => {
                const baseValue = customSkill.value || 0;
                // Custom Skills nutzen die Kategorie direkt für den Gesamtwert
                const displayInfo = window.skillDisplayModeService?.getDisplayValueForCustomSkill(
                    category, baseValue, this.trainerState.skillValues
                ) || { displayValue: baseValue, isTotal: false };
                
                const totalModeClass = displayInfo.isTotal ? ' skill-total-mode' : '';
                
                html += `
                    <div class="skill-row custom-skill-row" data-category="${category}" data-custom-index="${index}">
                        <input type="text" class="custom-skill-name trainer-custom-skill-name" 
                               data-category="${category}" data-custom-index="${index}"
                               value="${this._escapeHtml(customSkill.name)}" 
                               placeholder="Neue Fertigkeit">
                        <input type="number" class="skill-value skill-input trainer-custom-skill-value${totalModeClass}" 
                               data-category="${category}" data-custom-index="${index}"
                               data-base-value="${baseValue}"
                               data-is-custom-skill="true"
                               value="${displayInfo.displayValue}"
                               min="-9" max="99">
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
                <div class="inventory-header-buttons">
                    <button type="button" class="inventory-toggle-all-button" id="inventory-toggle-all" title="Alle auf-/zuklappen">
                        <span class="toggle-icon">▶</span> Alle
                    </button>
                    <button type="button" id="add-inventory-item" class="inventory-add-button" title="Eintrag hinzufügen">+</button>
                </div>
            </div>
            <div class="inventory-list" id="inventory-list">
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
        const preview = this._getInventoryPreview(item);
        const hasDetails = item.description && item.description.trim();
        
        return `
            <div class="inventory-item" data-index="${index}">
                <div class="inventory-item-header" data-index="${index}">
                    <span class="inventory-drag-handle" title="Ziehen zum Verschieben">⋮⋮</span>
                    <span class="inventory-expand-icon">▶</span>
                    <input type="text" class="inventory-name" 
                           data-index="${index}" data-field="name"
                           value="${this._escapeHtml(item.name)}" 
                           placeholder="Gegenstand">
                    <input type="number" class="inventory-quantity" 
                           data-index="${index}" data-field="quantity"
                           value="${item.quantity}" min="0" max="999">
                    <span class="inventory-preview ${hasDetails ? '' : 'empty'}">${this._escapeHtml(preview)}</span>
                    <button type="button" class="inventory-remove-button" 
                            data-index="${index}" title="Eintrag entfernen">×</button>
                </div>
                <div class="inventory-item-details">
                    <textarea class="inventory-description" 
                              data-index="${index}" data-field="description"
                              placeholder="Beschreibung, Effekte, Notizen...">${this._escapeHtml(item.description)}</textarea>
                </div>
            </div>
        `;
    }
    
    /**
     * Generiert eine Vorschau für einen Inventar-Eintrag
     * @param {InventoryItem} item - Der Inventar-Eintrag
     * @private
     */
    _getInventoryPreview(item) {
        if (!item.description || !item.description.trim()) {
            return '';
        }
        const text = item.description.trim();
        const maxLength = 40;
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
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
        
        // Expanded-Zustand speichern (nach Position im Array, da sich Inhalte ändern können)
        const expandedPositions = new Set();
        const items = container.querySelectorAll('.inventory-item');
        items.forEach((item, visualIndex) => {
            if (item.classList.contains('expanded')) {
                // Speichere den Namen des Items für robusteres Matching
                const nameInput = item.querySelector('.inventory-name');
                const name = nameInput?.value || '';
                expandedPositions.add(name);
            }
        });
        
        let html = '';
        
        this.trainerState.inventory.forEach((item, index) => {
            html += this._renderInventoryItem(item, index);
        });
        
        container.innerHTML = html;
        
        // Expanded-Zustand wiederherstellen
        container.querySelectorAll('.inventory-item').forEach(itemEl => {
            const nameInput = itemEl.querySelector('.inventory-name');
            const name = nameInput?.value || '';
            
            // Aufklappen wenn: Name war vorher aufgeklappt ODER expandAll aktiv ist
            if (expandedPositions.has(name) || this.inventoryExpandAll) {
                itemEl.classList.add('expanded');
                const icon = itemEl.querySelector('.inventory-expand-icon');
                if (icon) icon.textContent = '▼';
            }
        });
        
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
        
        // Zähler für Tabs berechnen
        const countPersonen = (this.trainerState.notes.personen || []).length;
        const countOrte = (this.trainerState.notes.orte || []).length;
        const countSonstiges = (this.trainerState.notes.sonstiges || []).length;
        
        let html = `
            <div class="notes-tabs">
                <button type="button" class="notes-tab active" data-tab="personen">
                    👤 Personen <span class="notes-tab-count">(${countPersonen})</span>
                </button>
                <button type="button" class="notes-tab" data-tab="orte">
                    📍 Orte <span class="notes-tab-count">(${countOrte})</span>
                </button>
                <button type="button" class="notes-tab" data-tab="sonstiges">
                    📝 Sonstiges <span class="notes-tab-count">(${countSonstiges})</span>
                </button>
            </div>
            
            <div class="notes-content">
                <!-- Personen Tab -->
                <div class="notes-tab-content active" data-tab-content="personen">
                    <div class="notes-header-row">
                        <button type="button" class="notes-toggle-all-button" data-category="personen" title="Alle auf-/zuklappen">
                            <span class="toggle-icon">▶</span> Alle
                        </button>
                        <button type="button" class="notes-add-button" data-category="personen" title="Person hinzufügen">+</button>
                    </div>
                    <div class="notes-list" id="notes-list-personen">
                        ${this._renderNoteEntries('personen')}
                    </div>
                </div>
                
                <!-- Orte Tab -->
                <div class="notes-tab-content" data-tab-content="orte">
                    <div class="notes-header-row">
                        <button type="button" class="notes-toggle-all-button" data-category="orte" title="Alle auf-/zuklappen">
                            <span class="toggle-icon">▶</span> Alle
                        </button>
                        <button type="button" class="notes-add-button" data-category="orte" title="Ort hinzufügen">+</button>
                    </div>
                    <div class="notes-list" id="notes-list-orte">
                        ${this._renderNoteEntries('orte')}
                    </div>
                </div>
                
                <!-- Sonstiges Tab -->
                <div class="notes-tab-content" data-tab-content="sonstiges">
                    <div class="notes-header-row">
                        <button type="button" class="notes-toggle-all-button" data-category="sonstiges" title="Alle auf-/zuklappen">
                            <span class="toggle-icon">▶</span> Alle
                        </button>
                        <button type="button" class="notes-add-button" data-category="sonstiges" title="Eintrag hinzufügen">+</button>
                    </div>
                    <div class="notes-list" id="notes-list-sonstiges">
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
     * Erzeugt eine kurze Vorschau des Notiz-Textes
     * @param {string} text - Der vollständige Text
     * @param {number} maxLength - Maximale Länge der Vorschau
     * @returns {string} Gekürzte Vorschau
     * @private
     */
    _getNotesPreview(text, maxLength = 40) {
        if (!text) return '';
        const cleaned = text.replace(/\n/g, ' ').trim();
        if (cleaned.length <= maxLength) return cleaned;
        return cleaned.substring(0, maxLength).trim() + '…';
    }
    
    /**
     * Rendert einen einzelnen Notiz-Eintrag (klappbar)
     * @param {string} category - Kategorie des Eintrags
     * @param {NoteEntry} entry - Der Notiz-Eintrag
     * @param {number} index - Index des Eintrags
     * @private
     */
    _renderNoteEntry(category, entry, index) {
        const preview = this._getNotesPreview(entry.notizen);
        const hasContent = (entry.notizen && entry.notizen.trim()) || 
                          (category === 'personen' && entry.rolle && entry.rolle.trim());
        
        if (category === 'personen') {
            return `
                <div class="notes-item notes-personen-item" data-category="${category}" data-index="${index}" draggable="true">
                    <div class="notes-item-header" data-category="${category}" data-index="${index}">
                        <span class="notes-drag-handle" title="Ziehen zum Verschieben">⋮⋮</span>
                        <span class="notes-expand-icon">▶</span>
                        <input type="text" class="notes-input notes-name" 
                               data-category="${category}" data-index="${index}" data-field="name"
                               value="${this._escapeHtml(entry.name || '')}" 
                               placeholder="Name">
                        <span class="notes-preview ${hasContent ? '' : 'empty'}">${this._escapeHtml(preview)}</span>
                        <button type="button" class="notes-remove-button" 
                                data-category="${category}" data-index="${index}" title="Eintrag entfernen">×</button>
                    </div>
                    <div class="notes-item-details">
                        <div class="notes-detail-field">
                            <label class="notes-detail-label">Rolle</label>
                            <input type="text" class="notes-input notes-rolle" 
                                   data-category="${category}" data-index="${index}" data-field="rolle"
                                   value="${this._escapeHtml(entry.rolle || '')}" 
                                   placeholder="z.B. Rivale, Mentor, Händler...">
                        </div>
                        <div class="notes-detail-field">
                            <label class="notes-detail-label">Notizen</label>
                            <textarea class="notes-textarea notes-notizen" 
                                      data-category="${category}" data-index="${index}" data-field="notizen"
                                      placeholder="Weitere Details zur Person...">${this._escapeHtml(entry.notizen || '')}</textarea>
                        </div>
                    </div>
                </div>
            `;
        } else if (category === 'orte') {
            return `
                <div class="notes-item notes-orte-item" data-category="${category}" data-index="${index}" draggable="true">
                    <div class="notes-item-header" data-category="${category}" data-index="${index}">
                        <span class="notes-drag-handle" title="Ziehen zum Verschieben">⋮⋮</span>
                        <span class="notes-expand-icon">▶</span>
                        <input type="text" class="notes-input notes-name" 
                               data-category="${category}" data-index="${index}" data-field="name"
                               value="${this._escapeHtml(entry.name || '')}" 
                               placeholder="Ortsname">
                        <span class="notes-preview ${hasContent ? '' : 'empty'}">${this._escapeHtml(preview)}</span>
                        <button type="button" class="notes-remove-button" 
                                data-category="${category}" data-index="${index}" title="Eintrag entfernen">×</button>
                    </div>
                    <div class="notes-item-details">
                        <div class="notes-detail-field">
                            <label class="notes-detail-label">Notizen</label>
                            <textarea class="notes-textarea notes-notizen" 
                                      data-category="${category}" data-index="${index}" data-field="notizen"
                                      placeholder="Beschreibung, wichtige NPCs, Besonderheiten...">${this._escapeHtml(entry.notizen || '')}</textarea>
                        </div>
                    </div>
                </div>
            `;
        } else if (category === 'sonstiges') {
            return `
                <div class="notes-item notes-sonstiges-item" data-category="${category}" data-index="${index}" draggable="true">
                    <div class="notes-item-header" data-category="${category}" data-index="${index}">
                        <span class="notes-drag-handle" title="Ziehen zum Verschieben">⋮⋮</span>
                        <span class="notes-expand-icon">▶</span>
                        <input type="text" class="notes-input notes-ueberschrift" 
                               data-category="${category}" data-index="${index}" data-field="ueberschrift"
                               value="${this._escapeHtml(entry.ueberschrift || '')}" 
                               placeholder="Überschrift">
                        <span class="notes-preview ${hasContent ? '' : 'empty'}">${this._escapeHtml(preview)}</span>
                        <button type="button" class="notes-remove-button" 
                                data-category="${category}" data-index="${index}" title="Eintrag entfernen">×</button>
                    </div>
                    <div class="notes-item-details">
                        <div class="notes-detail-field">
                            <label class="notes-detail-label">Notizen</label>
                            <textarea class="notes-textarea notes-notizen" 
                                      data-category="${category}" data-index="${index}" data-field="notizen"
                                      placeholder="Deine Notizen...">${this._escapeHtml(entry.notizen || '')}</textarea>
                        </div>
                    </div>
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
        
        // Expanded-Zustand vor dem Re-Render speichern (nach Name für robusteres Matching)
        const expandedNames = new Set();
        container.querySelectorAll('.notes-item.expanded').forEach(item => {
            const nameInput = item.querySelector('.notes-name, .notes-ueberschrift');
            if (nameInput) {
                expandedNames.add(nameInput.value || '');
            }
        });
        
        // Einträge rendern
        container.innerHTML = this._renderNoteEntries(category);
        
        // Expanded-Zustand wiederherstellen
        container.querySelectorAll('.notes-item').forEach(item => {
            const nameInput = item.querySelector('.notes-name, .notes-ueberschrift');
            const name = nameInput?.value || '';
            
            // Aufklappen wenn: Name war vorher aufgeklappt ODER expandAll für diese Kategorie aktiv ist
            if (expandedNames.has(name) || this.notesExpandAll[category]) {
                item.classList.add('expanded');
                const icon = item.querySelector('.notes-expand-icon');
                if (icon) icon.textContent = '▼';
            }
        });
        
        // Event-Listener hinzufügen
        this._addNotesEntryEventListeners(category);
    }
    
    /**
     * Togglet den Expand-Zustand eines Notiz-Eintrags
     * @param {HTMLElement} item - Das notes-item Element
     * @private
     */
    _toggleNoteExpand(item) {
        const wasExpanded = item.classList.contains('expanded');
        const isExpanded = item.classList.toggle('expanded');
        const icon = item.querySelector('.notes-expand-icon');
        if (icon) {
            icon.textContent = isExpanded ? '▼' : '▶';
        }
        
        // Wenn manuell zugeklappt wird, expandAll für diese Kategorie deaktivieren
        if (wasExpanded && !isExpanded) {
            const category = item.dataset.category;
            if (category && this.notesExpandAll[category]) {
                this.notesExpandAll[category] = false;
                // Auch den Button-Zustand aktualisieren
                const toggleBtn = document.querySelector(`.notes-toggle-all-button[data-category="${category}"]`);
                if (toggleBtn) {
                    toggleBtn.classList.remove('active');
                    const btnIcon = toggleBtn.querySelector('.toggle-icon');
                    if (btnIcon) btnIcon.textContent = '▶';
                }
            }
        }
    }
    
    /**
     * Klappt alle Notizen einer Kategorie auf oder zu
     * @param {string} category - Die Kategorie
     * @param {boolean} expand - true = aufklappen, false = zuklappen
     * @private
     */
    _toggleAllNotes(category, expand) {
        const container = document.getElementById(`notes-list-${category}`);
        if (!container) return;
        
        container.querySelectorAll('.notes-item').forEach(item => {
            const icon = item.querySelector('.notes-expand-icon');
            if (expand) {
                item.classList.add('expanded');
                if (icon) icon.textContent = '▼';
            } else {
                item.classList.remove('expanded');
                if (icon) icon.textContent = '▶';
            }
        });
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
                this._updateNotesTabCount(category);
            });
        });
        
        // Toggle-All-Buttons
        document.querySelectorAll('.notes-toggle-all-button').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const button = e.target.closest('.notes-toggle-all-button');
                const category = button.dataset.category;
                const isExpanded = button.classList.toggle('active');
                const icon = button.querySelector('.toggle-icon');
                
                if (icon) {
                    icon.textContent = isExpanded ? '▼' : '▶';
                }
                
                // Zustand speichern für neue Einträge
                this.notesExpandAll[category] = isExpanded;
                
                this._toggleAllNotes(category, isExpanded);
            });
        });
        
        // Entry-spezifische Listener für alle Kategorien
        ['personen', 'orte', 'sonstiges'].forEach(category => {
            this._addNotesEntryEventListeners(category);
        });
    }
    
    /**
     * Aktualisiert den Zähler eines Notizen-Tabs
     * @param {string} category - Die Kategorie
     * @private
     */
    _updateNotesTabCount(category) {
        const tab = document.querySelector(`.notes-tab[data-tab="${category}"]`);
        if (!tab) return;
        
        const count = (this.trainerState.notes[category] || []).length;
        const countSpan = tab.querySelector('.notes-tab-count');
        if (countSpan) {
            countSpan.textContent = `(${count})`;
        }
    }
    
    /**
     * Fügt Event-Listener für Notiz-Einträge einer Kategorie hinzu
     * @param {string} category - Die Kategorie
     * @private
     */
    _addNotesEntryEventListeners(category) {
        const container = document.getElementById(`notes-list-${category}`);
        if (!container) return;
        
        // WICHTIG: Erst Header klonen (um alte Listener zu entfernen), 
        // DANN Drag & Drop initialisieren (damit die neuen Listener nicht zerstört werden)
        
        // Expand/Collapse durch Klick auf Header
        container.querySelectorAll('.notes-item-header').forEach(header => {
            // Klonen um alte Listener zu entfernen
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', (e) => {
                // Nicht togglen wenn auf Input, Button oder deren Kinder geklickt wurde
                if (e.target.closest('input, button, textarea')) return;
                
                const item = newHeader.closest('.notes-item');
                if (item) {
                    this._toggleNoteExpand(item);
                }
            });
        });
        
        // Drag & Drop initialisieren (NACH dem Header-Klonen!)
        this._initNotesDragAndDrop(container, category);
        
        // Entfernen-Buttons - durch Klonen alte Listener entfernen
        container.querySelectorAll('.notes-remove-button').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Verhindere Toggle
                const cat = e.target.dataset.category;
                const index = parseInt(e.target.dataset.index, 10);
                
                if (this.trainerState.removeNote(cat, index)) {
                    this.updateNotes(cat);
                    this._updateNotesTabCount(cat);
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
                
                // Preview aktualisieren wenn Notizen geändert wurden
                if (field === 'notizen') {
                    this._updateNotePreview(e.target, value);
                }
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
                
                // Preview live aktualisieren
                if (field === 'notizen') {
                    this._updateNotePreview(e.target, value);
                }
            });
            
            // Verhindern dass Klick auf Input das Item toggled
            newInput.addEventListener('click', (e) => e.stopPropagation());
        });
    }
    
    /**
     * Initialisiert Custom Drag & Drop für Notiz-Einträge
     * Verwendet ein eigenes System statt natives HTML5 Drag & Drop,
     * da dieses mit Input-Feldern interferiert.
     * @param {HTMLElement} container - Der Container mit den Einträgen
     * @param {string} category - Die Kategorie
     * @private
     */
    _initNotesDragAndDrop(container, category) {
        const DRAG_THRESHOLD = 5; // Pixel bevor Drag startet
        const self = this;
        
        // State-Variablen für diesen Container
        let isDragging = false;
        let dragStarted = false;
        let draggedItem = null;
        let dragClone = null;
        let placeholder = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0; // Cursor-Offset relativ zum Element
        let offsetY = 0;
        
        // Natives Drag & Drop deaktivieren
        container.querySelectorAll('.notes-item').forEach(item => {
            item.setAttribute('draggable', 'false');
        });
        
        // Hilfsfunktion: Finde das notes-item unter dem Cursor
        const getItemAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('notes-item') && el !== dragClone) {
                    return el;
                }
                const parentItem = el.closest('.notes-item');
                if (parentItem && parentItem !== dragClone && container.contains(parentItem)) {
                    return parentItem;
                }
            }
            return null;
        };
        
        // ========== MOUSE MOVE (global für diesen Drag) ==========
        const onMouseMove = (e) => {
            if (!isDragging || !draggedItem) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            // Prüfe ob Drag-Schwelle überschritten wurde
            if (!dragStarted && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                dragStarted = true;
                
                // Clone erstellen
                draggedItem.classList.add('notes-item-dragging');
                
                dragClone = draggedItem.cloneNode(true);
                dragClone.classList.remove('notes-item-dragging');
                dragClone.classList.add('notes-item-drag-clone');
                
                const rect = draggedItem.getBoundingClientRect();
                
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
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    opacity: 0.95;
                    background: var(--bg-secondary, #2a2a2a);
                    border-radius: 8px;
                `;
                
                document.body.appendChild(dragClone);
                
                // Placeholder erstellen
                placeholder = document.createElement('div');
                placeholder.className = 'notes-item-placeholder';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.margin = '4px 0';
                placeholder.style.border = '2px dashed var(--accent-color, #4a9eff)';
                placeholder.style.borderRadius = '8px';
                placeholder.style.background = 'rgba(74, 158, 255, 0.1)';
                
                draggedItem.parentNode.insertBefore(placeholder, draggedItem);
                draggedItem.style.display = 'none';
                
                document.body.style.cursor = 'grabbing';
            }
            
            // Clone-Position aktualisieren (mit gespeichertem Offset)
            if (dragStarted && dragClone) {
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                
                // Ziel-Element finden und Placeholder positionieren
                const targetItem = getItemAtPosition(e.clientX, e.clientY);
                
                if (targetItem && targetItem !== draggedItem) {
                    const rect = targetItem.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        // Oberhalb der Mitte - Placeholder vor dem Element
                        if (placeholder.nextSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem);
                        }
                    } else {
                        // Unterhalb der Mitte - Placeholder nach dem Element
                        if (placeholder.previousSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem.nextSibling);
                        }
                    }
                }
            }
        };
        
        // ========== MOUSE UP (global für diesen Drag) ==========
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            // Event-Listener entfernen
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (dragStarted && draggedItem && placeholder) {
                // Neue Position berechnen
                const items = Array.from(container.querySelectorAll('.notes-item, .notes-item-placeholder'));
                const newIndex = items.indexOf(placeholder);
                const oldIndex = parseInt(draggedItem.dataset.index, 10);
                
                // Aufräumen
                if (dragClone && dragClone.parentNode) {
                    dragClone.remove();
                }
                if (placeholder && placeholder.parentNode) {
                    placeholder.remove();
                }
                
                draggedItem.style.display = '';
                draggedItem.classList.remove('notes-item-dragging');
                
                // Position aktualisieren wenn geändert
                if (newIndex !== -1 && newIndex !== oldIndex) {
                    // Korrektur: Wenn nach unten verschoben, muss Index angepasst werden
                    const adjustedNewIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
                    self._moveNoteEntry(category, oldIndex, adjustedNewIndex);
                }
            } else if (draggedItem) {
                // Kein Drag gestartet - aufräumen
                draggedItem.classList.remove('notes-item-dragging');
            }
            
            document.body.style.cursor = '';
            isDragging = false;
            dragStarted = false;
            draggedItem = null;
            dragClone = null;
            placeholder = null;
        };
        
        // ========== MOUSE DOWN auf Header ==========
        container.querySelectorAll('.notes-item').forEach(item => {
            const header = item.querySelector('.notes-item-header');
            if (!header) return;
            
            header.addEventListener('mousedown', (e) => {
                // Nicht starten wenn auf Input, Button, Textarea geklickt wurde
                if (e.target.closest('input, button, textarea')) return;
                
                // Verhindere Text-Selektion
                e.preventDefault();
                
                isDragging = true;
                dragStarted = false;
                draggedItem = item;
                startX = e.clientX;
                startY = e.clientY;
                
                // Globale Event-Listener hinzufügen
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }
    
    /**
     * Verschiebt einen Notiz-Eintrag an eine neue Position
     * @param {string} category - Die Kategorie
     * @param {number} fromIndex - Ursprünglicher Index
     * @param {number} toIndex - Ziel-Index
     * @private
     */
    _moveNoteEntry(category, fromIndex, toIndex) {
        const container = document.getElementById(`notes-list-${category}`);
        const notes = this.trainerState.notes[category];
        if (!notes || !container || fromIndex < 0 || fromIndex >= notes.length) return;
        
        // Expanded-Zustände vor dem Verschieben speichern (nach Index)
        const expandedIndices = new Set();
        container.querySelectorAll('.notes-item.expanded').forEach(item => {
            const index = parseInt(item.dataset.index, 10);
            if (!isNaN(index)) {
                expandedIndices.add(index);
            }
        });
        
        // Neue Indizes für expanded-Elemente berechnen
        const newExpandedIndices = new Set();
        expandedIndices.forEach(oldIdx => {
            let newIdx = oldIdx;
            
            if (oldIdx === fromIndex) {
                // Das verschobene Element bekommt den Ziel-Index
                newIdx = toIndex;
            } else if (fromIndex < toIndex) {
                // Element wurde nach unten verschoben
                // Elemente zwischen from+1 und to rücken eins nach oben
                if (oldIdx > fromIndex && oldIdx <= toIndex) {
                    newIdx = oldIdx - 1;
                }
            } else if (fromIndex > toIndex) {
                // Element wurde nach oben verschoben
                // Elemente zwischen to und from-1 rücken eins nach unten
                if (oldIdx >= toIndex && oldIdx < fromIndex) {
                    newIdx = oldIdx + 1;
                }
            }
            
            newExpandedIndices.add(newIdx);
        });
        
        // Element entfernen und an neuer Position einfügen
        const [movedItem] = notes.splice(fromIndex, 1);
        notes.splice(toIndex, 0, movedItem);
        
        // UI aktualisieren (ohne automatische Zustandswiederherstellung)
        container.innerHTML = this._renderNoteEntries(category);
        
        // Expanded-Zustand mit korrigierten Indizes wiederherstellen
        container.querySelectorAll('.notes-item').forEach(item => {
            const index = parseInt(item.dataset.index, 10);
            if (newExpandedIndices.has(index)) {
                item.classList.add('expanded');
                const icon = item.querySelector('.notes-expand-icon');
                if (icon) icon.textContent = '▼';
            }
        });
        
        // Event-Listener hinzufügen
        this._addNotesEntryEventListeners(category);
        
        // State speichern (falls Auto-Save aktiv)
        if (this.trainerState.save) {
            this.trainerState.save();
        }
    }
    
    /**
     * Aktualisiert die Vorschau eines Notiz-Eintrags
     * @param {HTMLElement} textarea - Das Textarea-Element
     * @param {string} value - Der neue Wert
     * @private
     */
    _updateNotePreview(textarea, value) {
        const item = textarea.closest('.notes-item');
        if (!item) return;
        
        const preview = item.querySelector('.notes-preview');
        if (preview) {
            const previewText = this._getNotesPreview(value);
            preview.textContent = previewText;
            preview.classList.toggle('empty', !previewText);
        }
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
                // Effektiver Wert mit Capping auf 0-100
                const rawEffectiveValue = isFavorite ? value + 5 : value;
                const effectiveValue = Math.max(0, Math.min(100, rawEffectiveValue));
                
                html += `
                    <div class="type-mastery-item ${isFavorite ? 'is-favorite' : ''}" data-type="${typeId}">
                        <div class="type-mastery-label" style="background-color: ${config.color};">
                            <span class="type-icon">${config.icon}</span>
                            <span class="type-name">${config.name}</span>
                        </div>
                        <div class="type-mastery-value-container">
                            <button type="button" class="type-mastery-btn type-mastery-btn-decrease" data-type="${typeId}" title="Wert verringern">◀</button>
                            <input type="text" 
                                   class="type-mastery-input" 
                                   data-type="${typeId}"
                                   value="${effectiveValue}"
                                   data-base-value="${value}"
                                   inputmode="numeric">
                            <button type="button" class="type-mastery-btn type-mastery-btn-increase" data-type="${typeId}" title="Wert erhöhen">▶</button>
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
            // Effektiver Wert mit Capping auf 0-100
            const rawEffectiveValue = isFavorite ? baseValue + 5 : baseValue;
            const effectiveValue = Math.max(0, Math.min(100, rawEffectiveValue));
            
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
                
                // Neuen Lieblingstyp setzen
                this.trainerState.setFavoriteType(newFavorite);
                
                // Anzeige aktualisieren
                this.updateTypeMastery();
                
                // Button-Zustände für alle Typen aktualisieren
                this._updateAllTypeMasteryButtonStates();
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
                    const parsedBase = parseInt(e.target.dataset.baseValue, 10);
                    const baseValue = isNaN(parsedBase) ? 5 : parsedBase;
                    const rawEffectiveValue = isFavorite ? baseValue + 5 : baseValue;
                    e.target.value = Math.max(0, Math.min(100, rawEffectiveValue));
                    return;
                }
                
                // Basis-Wert berechnen (wenn Favorit, -5 abziehen)
                let baseValue = isFavorite ? inputValue - 5 : inputValue;
                
                // Min/Max-Grenzen anwenden (0-100)
                baseValue = Math.max(0, Math.min(100, baseValue));
                
                // Effektiven Wert für Anzeige neu berechnen mit Capping
                const rawEffectiveValue = isFavorite ? baseValue + 5 : baseValue;
                const effectiveValue = Math.max(0, Math.min(100, rawEffectiveValue));
                e.target.value = effectiveValue;
                
                // Speichern
                this.trainerState.setTypeMastery(typeId, baseValue);
                e.target.dataset.baseValue = baseValue;
                lastValidValue = e.target.value;
                
                // Button-Zustände aktualisieren
                this._updateTypeMasteryButtonStates(typeId, baseValue, isFavorite);
            });
            
            input.addEventListener('blur', (e) => {
                const typeId = e.target.dataset.type;
                const isFavorite = this.trainerState.getFavoriteType() === typeId;
                const parsedBase = parseInt(e.target.dataset.baseValue, 10);
                const baseValue = isNaN(parsedBase) ? 5 : parsedBase;
                const rawEffectiveValue = isFavorite ? baseValue + 5 : baseValue;
                const effectiveValue = Math.max(0, Math.min(100, rawEffectiveValue));
                
                // Bei leerem oder ungültigem Input: Zurücksetzen
                if (e.target.value === '' || isNaN(parseInt(e.target.value, 10))) {
                    e.target.value = effectiveValue;
                }
            });
        });
        
        // Pfeil-Buttons für Wert verringern/erhöhen
        document.querySelectorAll('.type-mastery-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const typeId = e.target.dataset.type;
                const isIncrease = e.target.classList.contains('type-mastery-btn-increase');
                const input = document.querySelector(`.type-mastery-input[data-type="${typeId}"]`);
                
                if (!input) return;
                
                const isFavorite = this.trainerState.getFavoriteType() === typeId;
                const parsedValue = parseInt(input.dataset.baseValue, 10);
                let baseValue = isNaN(parsedValue) ? 5 : parsedValue;
                
                // Aktuellen angezeigten Wert berechnen (gecappt)
                const currentDisplayValue = Math.max(0, Math.min(100, isFavorite ? baseValue + 5 : baseValue));
                
                // Wert erhöhen oder verringern mit Min/Max-Grenzen für angezeigten Wert
                if (isIncrease) {
                    if (currentDisplayValue >= 100) return; // Maximum erreicht
                    baseValue += 1;
                } else {
                    if (currentDisplayValue <= 0) return; // Minimum erreicht
                    baseValue -= 1;
                }
                
                // Basis-Wert auf 0-100 cappen
                baseValue = Math.max(0, Math.min(100, baseValue));
                
                // Wert speichern und Anzeige aktualisieren
                this.trainerState.setTypeMastery(typeId, baseValue);
                input.dataset.baseValue = baseValue;
                
                // Effektiven Wert mit Capping berechnen
                const rawEffectiveValue = isFavorite ? baseValue + 5 : baseValue;
                const effectiveValue = Math.max(0, Math.min(100, rawEffectiveValue));
                input.value = effectiveValue;
                
                // Button-Zustände aktualisieren (basierend auf angezeigtem Wert)
                this._updateTypeMasteryButtonStates(typeId, baseValue, isFavorite);
            });
        });
        
        // Initiale Button-Zustände setzen
        this._updateAllTypeMasteryButtonStates();
    }
    
    /**
     * Aktualisiert die Button-Zustände für einen bestimmten Typ
     * @param {string} typeId - Die Typ-ID
     * @param {number} baseValue - Der aktuelle Basis-Wert
     * @param {boolean} [isFavorite] - Ob es der Lieblingstyp ist (optional, wird automatisch ermittelt)
     * @private
     */
    _updateTypeMasteryButtonStates(typeId, baseValue, isFavorite) {
        // Wenn isFavorite nicht übergeben wurde, automatisch ermitteln
        if (isFavorite === undefined) {
            isFavorite = this.trainerState.getFavoriteType() === typeId;
        }
        
        // Angezeigten Wert berechnen (gecappt auf 0-100)
        const rawDisplayValue = isFavorite ? baseValue + 5 : baseValue;
        const displayValue = Math.max(0, Math.min(100, rawDisplayValue));
        
        const decreaseBtn = document.querySelector(`.type-mastery-btn-decrease[data-type="${typeId}"]`);
        const increaseBtn = document.querySelector(`.type-mastery-btn-increase[data-type="${typeId}"]`);
        
        if (decreaseBtn) {
            // Deaktiviert wenn angezeigter Wert <= 0
            const disableDecrease = displayValue <= 0;
            decreaseBtn.disabled = disableDecrease;
            decreaseBtn.classList.toggle('disabled', disableDecrease);
        }
        
        if (increaseBtn) {
            // Deaktiviert wenn angezeigter Wert >= 100
            const disableIncrease = displayValue >= 100;
            increaseBtn.disabled = disableIncrease;
            increaseBtn.classList.toggle('disabled', disableIncrease);
        }
    }
    
    /**
     * Aktualisiert alle Button-Zustände für Typ-Meisterschaft
     * @private
     */
    _updateAllTypeMasteryButtonStates() {
        const favoriteType = this.trainerState.getFavoriteType();
        
        document.querySelectorAll('.type-mastery-input').forEach(input => {
            const typeId = input.dataset.type;
            const parsedValue = parseInt(input.dataset.baseValue, 10);
            const baseValue = isNaN(parsedValue) ? 5 : parsedValue;
            const isFavorite = favoriteType === typeId;
            this._updateTypeMasteryButtonStates(typeId, baseValue, isFavorite);
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
        
        // Gespeicherten Zustand für die Info-Box laden
        const infoBoxCollapsed = localStorage.getItem('grades-info-collapsed') === 'true';
        
        let html = `
            <div class="grades-info-wrapper">
                <div class="grades-info-header" id="grades-info-toggle">
                    <span class="grades-info-toggle-icon">${infoBoxCollapsed ? '▶' : '▼'}</span>
                    <span class="grades-info-toggle-text">Anleitung ${infoBoxCollapsed ? 'anzeigen' : 'ausblenden'}</span>
                    <span class="grades-points-badge ${remainingPoints < 0 ? 'grades-warning' : ''}" id="grades-points-badge">${remainingPoints} Punkte</span>
                </div>
                <div class="grades-info-box ${infoBoxCollapsed ? 'collapsed' : ''}" id="grades-info-box">
                    <p class="grades-explanation">
                    Verteile 30 Punkte, um deine Noten zu verbessern. Standard ist Note 5, je mehr Punkte du ausgibst, desto besser wird die Note.<br>
                    <strong>Beispiel:</strong> 3 Punkte in einem Fach verbessern die Note 5 auf 2.
                </p>
                <div class="grades-points-display">
                    <span class="grades-points-label">Verfügbare Punkte:</span>
                    <span id="grades-remaining-points" class="grades-points-value ${remainingPoints < 0 ? 'grades-warning' : ''}">${remainingPoints}</span>
                </div>
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
        const rowClass = this._getGradeRowClass(grade);
        return `
            <div class="grade-item ${rowClass}" data-subject="${subject.id}">
                <span class="grade-subject-name">${subject.name}</span>
                <select class="grade-select ${gradeClass}" data-subject="${subject.id}">
                    <option value="1" ${grade === 1 ? 'selected' : ''}>1 (5W6)</option>
                    <option value="2" ${grade === 2 ? 'selected' : ''}>2 (4W6)</option>
                    <option value="3" ${grade === 3 ? 'selected' : ''}>3 (3W6)</option>
                    <option value="4" ${grade === 4 ? 'selected' : ''}>4 (2W6)</option>
                    <option value="5" ${grade === 5 ? 'selected' : ''}>5 (1W6)</option>
                </select>
            </div>
        `;
    }
    
    /**
     * Gibt die CSS-Klasse für den Zeilen-Hintergrund einer Note zurück
     * @param {number} grade - Die Note (1-5)
     * @private
     */
    _getGradeRowClass(grade) {
        const rowClasses = {
            1: 'grade-row-1',
            2: 'grade-row-2',
            3: 'grade-row-3',
            4: 'grade-row-4',
            5: 'grade-row-5'
        };
        return rowClasses[grade] || 'grade-row-5';
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
        
        // Badge im Header aktualisieren
        const pointsBadge = document.getElementById('grades-points-badge');
        if (pointsBadge) {
            pointsBadge.textContent = `${remainingPoints} Punkte`;
            pointsBadge.classList.toggle('grades-warning', remainingPoints < 0);
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
        
        // Alle Select-Elemente und ihre Zeilen aktualisieren
        document.querySelectorAll('.grade-select').forEach(select => {
            const subject = select.dataset.subject;
            const grade = this.trainerState.getGrade(subject);
            select.value = grade;
            
            // Farb-Klasse für Select aktualisieren
            select.classList.remove('grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5');
            select.classList.add(this._getGradeColorClass(grade));
            
            // Zeilen-Hintergrund-Klasse aktualisieren
            const gradeItem = select.closest('.grade-item');
            if (gradeItem) {
                gradeItem.classList.remove('grade-row-1', 'grade-row-2', 'grade-row-3', 'grade-row-4', 'grade-row-5');
                gradeItem.classList.add(this._getGradeRowClass(grade));
            }
        });
    }
    
    /**
     * Fügt Event-Listener für Noten hinzu
     * @private
     */
    _addGradesEventListeners() {
        // Event-Listener für die einklappbare Info-Box
        const infoToggle = document.getElementById('grades-info-toggle');
        const infoBox = document.getElementById('grades-info-box');
        
        if (infoToggle && infoBox) {
            infoToggle.addEventListener('click', () => {
                const isCollapsed = infoBox.classList.toggle('collapsed');
                const toggleIcon = infoToggle.querySelector('.grades-info-toggle-icon');
                const toggleText = infoToggle.querySelector('.grades-info-toggle-text');
                
                if (toggleIcon) {
                    toggleIcon.textContent = isCollapsed ? '▶' : '▼';
                }
                if (toggleText) {
                    toggleText.textContent = isCollapsed ? 'Anleitung anzeigen' : 'Anleitung ausblenden';
                }
                
                // Zustand speichern
                localStorage.setItem('grades-info-collapsed', isCollapsed);
            });
        }
        
        // Event-Listener für Noten-Selects
        document.querySelectorAll('.grade-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const subject = e.target.dataset.subject;
                const grade = parseInt(e.target.value, 10);
                
                this.trainerState.setGrade(subject, grade);
                
                // Farb-Klasse aktualisieren
                e.target.classList.remove('grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5');
                e.target.classList.add(this._getGradeColorClass(grade));
                
                // Zeilen-Hintergrund aktualisieren
                const gradeItem = e.target.closest('.grade-item');
                if (gradeItem) {
                    gradeItem.classList.remove('grade-row-1', 'grade-row-2', 'grade-row-3', 'grade-row-4', 'grade-row-5');
                    gradeItem.classList.add(this._getGradeRowClass(grade));
                }
                
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
                        
                        // Abhängige Fertigkeiten im Gesamtwerte-Modus aktualisieren
                        this._updateSkillDisplaysForCategory(skillName);
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
        
        // Skill-Display-Mode Event-Listener
        this._addSkillDisplayModeListeners();
    }
    
    /**
     * Fügt Event-Listener für den Fertigkeiten-Anzeigemodus hinzu
     * @private
     */
    _addSkillDisplayModeListeners() {
        const self = this;
        const trainerContainer = document.getElementById('trainer-sheet-container');
        if (!trainerContainer) return;
        
        // Toggle-Button Click-Handler - Event-Delegation für persistente Handler
        trainerContainer.addEventListener('click', function(e) {
            // Prüfe ob der Toggle-Button geklickt wurde
            if (e.target.classList.contains('skill-display-mode-toggle')) {
                console.log('Trainer Toggle-Button geklickt!');
                if (!window.skillDisplayModeService) {
                    console.error('skillDisplayModeService nicht verfügbar!');
                    return;
                }
                
                const newMode = window.skillDisplayModeService.toggleMode();
                console.log('Neuer Modus:', newMode);
                
                // Skills-Sektion neu rendern
                self._refreshSkillsSection();
                
                // Auch Pokemon-Sheet aktualisieren falls vorhanden
                if (window.pokemonApp && window.pokemonApp.uiRenderer) {
                    window.pokemonApp.uiRenderer._refreshSkillsSection?.();
                }
            }
        });
        
        // Focus-Handler: Bei Fokus zeige den Basiswert (nicht Gesamtwert)
        trainerContainer.addEventListener('focusin', function(e) {
            if (!e.target.classList.contains('skill-input')) return;
            if (e.target.classList.contains('base-stat-input')) return;
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
        trainerContainer.addEventListener('focusout', function(e) {
            if (!e.target.classList.contains('skill-input')) return;
            if (e.target.classList.contains('base-stat-input')) return;
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
                    category, skillValue, self.trainerState.skillValues
                );
            } else if (skill) {
                // Normaler Skill - nutze Skill-Namen
                displayInfo = window.skillDisplayModeService.getDisplayValue(
                    skill, skillValue, self.trainerState.skillValues
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
                        
                        // Abhängige Fertigkeiten im Gesamtwerte-Modus aktualisieren
                        this._updateSkillDisplaysForCategory(skillName);
                    } else if (skillName) {
                        this.trainerState.setSkillValue(skillName, e.target.value);
                    }
                    
                    this._updateRemainingPoints();
                });
            });
        }
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
        
        const container = document.getElementById('trainer-sheet-container');
        if (!container) return;
        
        // Skill-Gruppen für Trainer verwenden
        const skillGroups = typeof TRAINER_SKILL_GROUPS !== 'undefined' ? TRAINER_SKILL_GROUPS : SKILL_GROUPS;
        const skillsInCategory = skillGroups[category] || [];
        
        // Standard-Skills dieser Kategorie aktualisieren
        skillsInCategory.forEach(skillName => {
            const input = container.querySelector(`input.skill-input[data-skill="${skillName}"]`);
            if (!input || input.classList.contains('base-stat-input')) return;
            
            // Nicht aktualisieren wenn gerade editiert wird
            if (input.classList.contains('skill-editing')) return;
            
            // Fertigkeitswert aus dem TrainerState holen (source of truth)
            const skillValue = this.trainerState.skillValues[skillName] || 0;
            const displayInfo = window.skillDisplayModeService.getDisplayValue(
                skillName, skillValue, this.trainerState.skillValues
            );
            
            input.value = displayInfo.displayValue;
            input.dataset.baseValue = skillValue.toString(); // dataset synchron halten
            if (displayInfo.isTotal) {
                input.classList.add('skill-total-mode');
            }
        });
        
        // Custom-Skills dieser Kategorie aktualisieren
        const customSkillInputs = container.querySelectorAll(
            `input.trainer-custom-skill-value[data-category="${category}"]`
        );
        customSkillInputs.forEach(input => {
            // Nicht aktualisieren wenn gerade editiert wird
            if (input.classList.contains('skill-editing')) return;
            
            // Custom-Skill-Wert aus dem TrainerState holen
            const customIndex = parseInt(input.dataset.customIndex, 10);
            const customSkills = this.trainerState.getCustomSkills ? 
                this.trainerState.getCustomSkills(category) : [];
            const customSkill = customSkills[customIndex];
            const skillValue = customSkill?.value || 0;
            
            const displayInfo = window.skillDisplayModeService.getDisplayValueForCustomSkill(
                category, skillValue, this.trainerState.skillValues
            );
            
            input.value = displayInfo.displayValue;
            input.dataset.baseValue = skillValue.toString(); // dataset synchron halten
            if (displayInfo.isTotal) {
                input.classList.add('skill-total-mode');
            }
        });
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
        
        // Toggle-All-Button
        const toggleAllButton = document.getElementById('inventory-toggle-all');
        if (toggleAllButton) {
            const newToggleAllButton = toggleAllButton.cloneNode(true);
            toggleAllButton.parentNode.replaceChild(newToggleAllButton, toggleAllButton);
            
            newToggleAllButton.addEventListener('click', () => {
                const items = document.querySelectorAll('.inventory-item');
                const expandedItems = document.querySelectorAll('.inventory-item.expanded');
                const shouldExpand = expandedItems.length < items.length / 2;
                
                // Zustand speichern für neue Einträge
                this.inventoryExpandAll = shouldExpand;
                
                // Button-Zustand und Icon aktualisieren
                newToggleAllButton.classList.toggle('active', shouldExpand);
                const buttonIcon = newToggleAllButton.querySelector('.toggle-icon');
                if (buttonIcon) {
                    buttonIcon.textContent = shouldExpand ? '▼' : '▶';
                }
                
                items.forEach(item => {
                    const icon = item.querySelector('.inventory-expand-icon');
                    if (shouldExpand) {
                        item.classList.add('expanded');
                        if (icon) icon.textContent = '▼';
                    } else {
                        item.classList.remove('expanded');
                        if (icon) icon.textContent = '▶';
                    }
                });
            });
        }
        
        // Einklappen/Ausklappen per Klick auf Header
        document.querySelectorAll('.inventory-item-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Nicht auslösen wenn auf Input, Button oder Drag-Handle geklickt
                if (e.target.matches('input, button, textarea, .inventory-drag-handle')) {
                    return;
                }
                
                const item = header.closest('.inventory-item');
                const icon = header.querySelector('.inventory-expand-icon');
                
                if (item) {
                    const wasExpanded = item.classList.contains('expanded');
                    item.classList.toggle('expanded');
                    if (icon) {
                        icon.textContent = item.classList.contains('expanded') ? '▼' : '▶';
                    }
                    
                    // Wenn manuell zugeklappt wird, expandAll deaktivieren
                    if (wasExpanded) {
                        this.inventoryExpandAll = false;
                        // Auch den Button-Zustand aktualisieren
                        const toggleBtn = document.getElementById('inventory-toggle-all');
                        if (toggleBtn) {
                            toggleBtn.classList.remove('active');
                            const btnIcon = toggleBtn.querySelector('.toggle-icon');
                            if (btnIcon) btnIcon.textContent = '▶';
                        }
                    }
                }
            });
        });
        
        // Drag & Drop initialisieren
        const inventoryList = document.getElementById('inventory-list');
        if (inventoryList) {
            this._initInventoryDragAndDrop(inventoryList);
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
                
                // Vorschau aktualisieren wenn Beschreibung geändert wird
                if (field === 'description') {
                    const item = e.target.closest('.inventory-item');
                    const preview = item?.querySelector('.inventory-preview');
                    if (preview) {
                        const previewText = this._getInventoryPreview({ description: e.target.value });
                        preview.textContent = previewText;
                        preview.classList.toggle('empty', !previewText);
                    }
                }
            });
        });
    }
    
    /**
     * Initialisiert Custom Drag & Drop für Inventar-Items
     * @param {HTMLElement} container - Der Container mit den Inventar-Items
     * @private
     */
    _initInventoryDragAndDrop(container) {
        const DRAG_THRESHOLD = 5;
        const self = this;
        
        let isDragging = false;
        let dragStarted = false;
        let draggedItem = null;
        let dragClone = null;
        let placeholder = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;
        
        const getItemAtPosition = (x, y) => {
            const elements = document.elementsFromPoint(x, y);
            for (const el of elements) {
                if (el.classList.contains('inventory-item') && el !== dragClone) {
                    return el;
                }
                const parentItem = el.closest('.inventory-item');
                if (parentItem && parentItem !== dragClone && container.contains(parentItem)) {
                    return parentItem;
                }
            }
            return null;
        };
        
        const onMouseMove = (e) => {
            if (!isDragging || !draggedItem) return;
            
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            
            if (!dragStarted && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                dragStarted = true;
                draggedItem.classList.add('inventory-item-dragging');
                
                dragClone = draggedItem.cloneNode(true);
                dragClone.classList.remove('inventory-item-dragging');
                dragClone.classList.add('inventory-item-drag-clone');
                
                const rect = draggedItem.getBoundingClientRect();
                offsetX = startX - rect.left;
                offsetY = startY - rect.top;
                
                dragClone.style.cssText = `
                    position: fixed;
                    left: ${rect.left}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    opacity: 0.95;
                    background: var(--bg-secondary, #2a2a2a);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                `;
                
                document.body.appendChild(dragClone);
                
                placeholder = document.createElement('div');
                placeholder.className = 'inventory-item-placeholder';
                placeholder.style.height = rect.height + 'px';
                placeholder.style.margin = '2px 0';
                placeholder.style.border = '2px dashed var(--accent-color, #4a9eff)';
                placeholder.style.borderRadius = '4px';
                placeholder.style.background = 'rgba(74, 158, 255, 0.1)';
                
                draggedItem.parentNode.insertBefore(placeholder, draggedItem);
                draggedItem.style.display = 'none';
                
                document.body.style.cursor = 'grabbing';
            }
            
            if (dragStarted && dragClone) {
                dragClone.style.left = (e.clientX - offsetX) + 'px';
                dragClone.style.top = (e.clientY - offsetY) + 'px';
                
                const targetItem = getItemAtPosition(e.clientX, e.clientY);
                
                if (targetItem && targetItem !== draggedItem) {
                    const rect = targetItem.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    
                    if (e.clientY < midY) {
                        if (placeholder.nextSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem);
                        }
                    } else {
                        if (placeholder.previousSibling !== targetItem) {
                            targetItem.parentNode.insertBefore(placeholder, targetItem.nextSibling);
                        }
                    }
                }
            }
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (dragStarted && draggedItem && placeholder) {
                const items = Array.from(container.querySelectorAll('.inventory-item, .inventory-item-placeholder'));
                const newIndex = items.indexOf(placeholder);
                const oldIndex = parseInt(draggedItem.dataset.index, 10);
                
                if (dragClone && dragClone.parentNode) dragClone.remove();
                if (placeholder && placeholder.parentNode) placeholder.remove();
                
                draggedItem.style.display = '';
                draggedItem.classList.remove('inventory-item-dragging');
                
                if (newIndex !== -1 && newIndex !== oldIndex) {
                    const adjustedNewIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
                    self._moveInventoryItem(oldIndex, adjustedNewIndex);
                }
            } else if (draggedItem) {
                draggedItem.classList.remove('inventory-item-dragging');
            }
            
            document.body.style.cursor = '';
            isDragging = false;
            dragStarted = false;
            draggedItem = null;
            dragClone = null;
            placeholder = null;
        };
        
        // Drag nur über den Drag-Handle aktivieren
        container.querySelectorAll('.inventory-drag-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Verhindere, dass der Header-Click-Event ausgelöst wird
                
                const item = handle.closest('.inventory-item');
                if (!item) return;
                
                isDragging = true;
                dragStarted = false;
                draggedItem = item;
                startX = e.clientX;
                startY = e.clientY;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }
    
    /**
     * Verschiebt ein Inventar-Item an eine neue Position
     * @param {number} fromIndex - Ursprünglicher Index
     * @param {number} toIndex - Ziel-Index
     * @private
     */
    _moveInventoryItem(fromIndex, toIndex) {
        const inventory = this.trainerState.inventory;
        if (!inventory || fromIndex < 0 || fromIndex >= inventory.length) return;
        
        const [movedItem] = inventory.splice(fromIndex, 1);
        inventory.splice(toIndex, 0, movedItem);
        
        this.updateInventory();
        
        if (this.trainerState.save) {
            this.trainerState.save();
        }
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
        
        // Skills - Gesamtwerte-Modus berücksichtigen
        const isTotalMode = window.skillDisplayModeService?.isTotalMode() || false;
        Object.entries(this.trainerState.skillValues).forEach(([skill, value]) => {
            const input = document.querySelector(`input[data-skill="${skill}"]`);
            if (!input) return;
            
            // Grundwerte (KÖ, WI, CH, GL) werden immer direkt gesetzt
            const baseStats = ['KÖ', 'WI', 'CH', 'GL'];
            if (baseStats.includes(skill)) {
                input.value = value;
                return;
            }
            
            // Für Fertigkeiten: Im Gesamtwerte-Modus den Summen-Wert anzeigen
            if (isTotalMode && window.skillDisplayModeService) {
                const displayInfo = window.skillDisplayModeService.getDisplayValue(
                    skill, value, this.trainerState.skillValues
                );
                input.value = displayInfo.displayValue;
                input.dataset.baseValue = value.toString();
                if (displayInfo.isTotal) {
                    input.classList.add('skill-total-mode');
                }
            } else {
                input.value = value;
            }
        });
        
        // Custom-Skills auch mit Gesamtwerte-Modus laden
        if (isTotalMode && window.skillDisplayModeService) {
            const skillGroups = typeof TRAINER_SKILL_GROUPS !== 'undefined' ? TRAINER_SKILL_GROUPS : SKILL_GROUPS;
            Object.keys(skillGroups).forEach(category => {
                const customSkills = this.trainerState.getCustomSkills ? 
                    this.trainerState.getCustomSkills(category) : [];
                    
                customSkills.forEach((customSkill, index) => {
                    const input = document.querySelector(
                        `input.trainer-custom-skill-value[data-category="${category}"][data-custom-index="${index}"]`
                    );
                    if (!input) return;
                    
                    const skillValue = customSkill.value || 0;
                    const displayInfo = window.skillDisplayModeService.getDisplayValueForCustomSkill(
                        category, skillValue, this.trainerState.skillValues
                    );
                    input.value = displayInfo.displayValue;
                    input.dataset.baseValue = skillValue.toString();
                    if (displayInfo.isTotal) {
                        input.classList.add('skill-total-mode');
                    }
                });
            });
        }
        
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