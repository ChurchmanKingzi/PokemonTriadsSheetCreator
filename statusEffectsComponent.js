/**
 * StatusEffectsComponent
 * ======================
 * Komponente zur Anzeige und Verwaltung von Statuseffekten
 * Verwendet für Pokemon und Trainer (Menschen)
 */

// Statuseffekt-Definitionen mit Effektbeschreibungen
const STATUS_EFFECTS = {
    poisoned: {
        id: 'poisoned',
        name: 'Vergiftet',
        emoji: '☠️',
        color: '#9333ea',      // Lila
        borderColor: '#7c3aed',
        description: 'Das Ziel verliert nach jedem seiner Züge 10% seine max KP (aufgerundet). Dann darf es eine Probe auf Widerstand ablegen, die je nach Quelle des Gifts eine Schwierigkeit zwischen 1 und 5 haben kann. Besteht es die Probe, überkommt es das Gift. Außerhalb des Kampfes passiert das alle 10 Sekunden. Gift kann zu Wunden führen, z.B. durch schwere Organschäden, und sogar tödlich sein.'
    },
    burned: {
        id: 'burned',
        name: 'Verbrannt',
        emoji: '🔥',
        color: '#dc2626',      // Rot
        borderColor: '#b91c1c',
        description: 'Das Ziel verliert nach jedem seiner Züge 10% seine max KP (aufgerundet). Dieser Zustand endet automatisch nach 3 Runden und kann nicht zum Tod (der zehnten Wunde) führen, aber ansonsten Wunden auslösen.'
    },
    paralyzed: {
        id: 'paralyzed',
        name: 'Paralysiert',
        emoji: '⚡',
        color: '#eab308',      // Gelb
        borderColor: '#ca8a04',
        description: 'Das Ziel muss vor jedem eigenen Zug und wenn es eine Reaktion ausführen will zuerst eine Widerstand-Probe mit Schwierigkeit 1 bestehen, sonst muss es aussetzen/verliert seine Reaktion. Dieser Effekt hält 2W6 Stunden an, während denen die Muskeln des Ziels beeinträchtigt sind.'
    },
    asleep: {
        id: 'asleep',
        name: 'Schlafend',
        emoji: '💤',
        color: '#6b7280',      // Grau
        borderColor: '#4b5563',
        description: 'Das Ziel kann nicht agieren. Nimmt es irgendwelchen Schaden, wacht es auf. Ein Pokemon oder Trainer kann seine Aktion nutzen, um ein Schlafendes Ziel, das er berührt, aufzuwecken (Klapse ins Gesicht, ins Ohr brüllen...).'
    },
    frozen: {
        id: 'frozen',
        name: 'Eingefroren',
        emoji: '❄️',
        color: '#38bdf8',      // Hellblau
        borderColor: '#0ea5e9',
        description: 'Das Ziel kann nicht agieren, aber auch von den meisten Attacken nicht erreicht werden, da es in einen dicken Eisblock gehüllt ist. Der Eisblock kann durch eine Vielzahl von Attacken aufgebrochen werden, was das Ziel von diesem Status befreit.'
    },
    cursed: {
        id: 'cursed',
        name: 'Verflucht',
        emoji: '👻',
        color: '#1f2937',      // Schwarz/Dunkelgrau
        borderColor: '#111827',
        description: 'Das Ziel nimmt jede Runde 25% seiner max KP Schaden, bis es bewusstlos wird. Dann erleidet es furchtbare Alpträume. Durch einen Fluch ausgelöster Schaden fügt keine Wunden zu (höchstens seelische Traumata...).'
    },
    infatuated: {
        id: 'infatuated',
        name: 'Verliebt',
        emoji: '💕',
        color: '#ec4899',      // Pink
        borderColor: '#db2777',
        description: 'Das Ziel kann den Verursacher des Effekts nicht als Angriffsziel wählen.'
    },
    confused: {
        id: 'confused',
        name: 'Verwirrt',
        emoji: '💫',
        color: '#f97316',      // Orange
        borderColor: '#ea580c',
        pokemonOnly: true,     // Nur für Pokemon
        description: 'Das Ziel muss auswürfeln, welche Attacke es gegen welches Ziel/welche Ziele einsetzt.'
    }
};

/**
 * StatusEffectsComponent Klasse
 */
class StatusEffectsComponent {
    /**
     * Konstruktor
     * @param {Object} options - Konfigurationsoptionen
     * @param {boolean} options.isPokemon - True wenn Pokemon, False wenn Trainer
     * @param {Function} options.onStatusChange - Callback bei Statusänderung
     * @param {string} options.containerId - Optionale ID für den Container
     * @param {boolean} options.startCollapsed - Ob der Container eingeklappt starten soll
     */
    constructor(options = {}) {
        this.isPokemon = options.isPokemon !== false; // Default: Pokemon
        this.onStatusChange = options.onStatusChange || null;
        this.containerId = options.containerId || 'status-effects-container';
        this.startCollapsed = options.startCollapsed || false;
        this.activeStatuses = new Set();
        this.isCollapsed = this.startCollapsed;
        
        // Gespeicherten Zustand laden
        this._loadCollapseState();
    }
    
    /**
     * Gibt die verfügbaren Statuseffekte basierend auf dem Typ zurück
     * @returns {Object} Verfügbare Statuseffekte
     */
    getAvailableStatuses() {
        if (this.isPokemon) {
            return STATUS_EFFECTS;
        }
        // Für Trainer: Verwirrt ausfiltern
        const filtered = {};
        Object.entries(STATUS_EFFECTS).forEach(([key, status]) => {
            if (!status.pokemonOnly) {
                filtered[key] = status;
            }
        });
        return filtered;
    }
    
    /**
     * Erstellt das HTML-Element für die Statuseffekte
     * @returns {HTMLElement} Das erstellte Container-Element
     */
    createStatusEffectsElement() {
        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'status-effects-container' + (this.isCollapsed ? ' collapsed' : '');
        
        // Einklappbarer Header
        const header = document.createElement('div');
        header.className = 'status-effects-header';
        
        // Toggle-Button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'status-effects-toggle';
        toggleBtn.textContent = '▼';
        toggleBtn.title = 'Ein-/Ausklappen';
        header.appendChild(toggleBtn);
        
        // Titel
        const title = document.createElement('span');
        title.className = 'status-effects-title';
        title.textContent = 'Status:';
        header.appendChild(title);
        
        // Vorschau für eingeklappten Zustand
        const preview = document.createElement('span');
        preview.className = 'status-effects-preview';
        preview.id = this.containerId + '-preview';
        header.appendChild(preview);
        
        container.appendChild(header);
        
        // Icons-Container
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'status-effects-icons';
        
        const availableStatuses = this.getAvailableStatuses();
        
        Object.values(availableStatuses).forEach(status => {
            const iconWrapper = this._createStatusIcon(status);
            iconsContainer.appendChild(iconWrapper);
        });
        
        container.appendChild(iconsContainer);
        
        // Toggle-Event
        header.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-icon') || 
                e.target.classList.contains('status-emoji') ||
                e.target.classList.contains('status-icon-wrapper')) {
                return; // Nicht toggled wenn auf ein Icon geklickt
            }
            this._toggleCollapse(container);
        });
        
        // Initial Vorschau aktualisieren
        this._updatePreview();
        
        return container;
    }
    
    /**
     * Erstellt ein einzelnes Status-Icon
     * @param {Object} status - Status-Definition
     * @returns {HTMLElement} Das Icon-Element
     * @private
     */
    _createStatusIcon(status) {
        const wrapper = document.createElement('div');
        wrapper.className = 'status-icon-wrapper';
        wrapper.dataset.statusId = status.id;
        
        // Custom-Tooltip Daten speichern (kein title-Attribut mehr)
        wrapper.dataset.tooltipName = status.name;
        wrapper.dataset.tooltipDescription = status.description || '';
        wrapper.dataset.tooltipColor = status.color;
        
        const icon = document.createElement('div');
        icon.className = 'status-icon inactive';
        icon.dataset.statusId = status.id;
        icon.dataset.containerId = this.containerId;
        icon.style.setProperty('--status-color', status.color);
        icon.style.setProperty('--status-border-color', status.borderColor);
        
        const emoji = document.createElement('span');
        emoji.className = 'status-emoji';
        emoji.textContent = status.emoji;
        
        icon.appendChild(emoji);
        wrapper.appendChild(icon);
        
        // Click-Handler
        wrapper.addEventListener('click', () => this._toggleStatus(status.id));
        
        // Custom-Tooltip Event-Handler
        wrapper.addEventListener('mouseenter', (e) => this._showTooltip(e, status));
        wrapper.addEventListener('mouseleave', () => this._hideTooltip());
        wrapper.addEventListener('mousemove', (e) => this._moveTooltip(e));
        
        return wrapper;
    }
    
    /**
     * Zeigt den Custom-Tooltip an
     * @param {MouseEvent} e - Das Mouse-Event
     * @param {Object} status - Status-Definition
     * @private
     */
    _showTooltip(e, status) {
        // Existierenden Tooltip entfernen
        this._hideTooltip();
        
        // Neuen Tooltip erstellen
        const tooltip = document.createElement('div');
        tooltip.className = 'status-tooltip';
        tooltip.id = 'status-effect-tooltip';
        tooltip.style.backgroundColor = status.color;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'status-tooltip-name';
        nameSpan.textContent = status.name;
        tooltip.appendChild(nameSpan);
        
        if (status.description) {
            const descP = document.createElement('p');
            descP.className = 'status-tooltip-description';
            descP.textContent = status.description;
            tooltip.appendChild(descP);
        }
        
        document.body.appendChild(tooltip);
        
        // Position setzen
        this._positionTooltip(e, tooltip);
        
        // Sichtbar machen (nach kurzer Verzögerung für Animation)
        requestAnimationFrame(() => {
            tooltip.classList.add('visible');
        });
    }
    
    /**
     * Versteckt den Custom-Tooltip
     * @private
     */
    _hideTooltip() {
        const tooltip = document.getElementById('status-effect-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    /**
     * Bewegt den Tooltip mit der Maus
     * @param {MouseEvent} e - Das Mouse-Event
     * @private
     */
    _moveTooltip(e) {
        const tooltip = document.getElementById('status-effect-tooltip');
        if (tooltip) {
            this._positionTooltip(e, tooltip);
        }
    }
    
    /**
     * Positioniert den Tooltip relativ zur Maus
     * @param {MouseEvent} e - Das Mouse-Event
     * @param {HTMLElement} tooltip - Das Tooltip-Element
     * @private
     */
    _positionTooltip(e, tooltip) {
        const padding = 12;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = e.clientX + padding;
        let y = e.clientY + padding;
        
        // Tooltip-Dimensionen
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Rechten Rand prüfen
        if (x + tooltipRect.width > viewportWidth - padding) {
            x = e.clientX - tooltipRect.width - padding;
        }
        
        // Unteren Rand prüfen
        if (y + tooltipRect.height > viewportHeight - padding) {
            y = e.clientY - tooltipRect.height - padding;
        }
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }
    
    /**
     * Toggled einen Statuseffekt
     * @param {string} statusId - ID des Statuseffekts
     * @private
     */
    _toggleStatus(statusId) {
        // Icon im eigenen Container finden
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const iconElement = container.querySelector(`.status-icon[data-status-id="${statusId}"]`);
        if (!iconElement) return;
        
        if (this.activeStatuses.has(statusId)) {
            this.activeStatuses.delete(statusId);
            iconElement.classList.add('inactive');
            iconElement.classList.remove('active');
        } else {
            this.activeStatuses.add(statusId);
            iconElement.classList.remove('inactive');
            iconElement.classList.add('active');
        }
        
        // Vorschau aktualisieren
        this._updatePreview();
        
        // Callback aufrufen
        if (this.onStatusChange) {
            this.onStatusChange(this.getActiveStatuses());
        }
    }
    
    /**
     * Gibt alle aktiven Statuseffekte zurück
     * @returns {Array} Array mit aktiven Status-IDs
     */
    getActiveStatuses() {
        return Array.from(this.activeStatuses);
    }
    
    /**
     * Setzt die aktiven Statuseffekte
     * @param {Array} statuses - Array mit Status-IDs
     */
    setActiveStatuses(statuses) {
        if (!Array.isArray(statuses)) {
            statuses = [];
        }
        
        this.activeStatuses.clear();
        
        statuses.forEach(statusId => {
            const availableStatuses = this.getAvailableStatuses();
            if (availableStatuses[statusId]) {
                this.activeStatuses.add(statusId);
            }
        });
        
        // UI aktualisieren
        this._updateUI();
        
        // Vorschau aktualisieren
        this._updatePreview();
    }
    
    /**
     * Aktualisiert die UI basierend auf den aktiven Statuses
     * @private
     */
    _updateUI() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const allIcons = container.querySelectorAll('.status-icon');
        
        allIcons.forEach(icon => {
            const statusId = icon.dataset.statusId;
            
            if (this.activeStatuses.has(statusId)) {
                icon.classList.remove('inactive');
                icon.classList.add('active');
            } else {
                icon.classList.add('inactive');
                icon.classList.remove('active');
            }
        });
    }
    
    /**
     * Löscht alle aktiven Statuseffekte
     */
    clearAllStatuses() {
        this.activeStatuses.clear();
        this._updateUI();
        this._updatePreview();
        
        if (this.onStatusChange) {
            this.onStatusChange([]);
        }
    }
    
    /**
     * Toggled den eingeklappten Zustand
     * @param {HTMLElement} container - Der Container
     * @private
     */
    _toggleCollapse(container) {
        this.isCollapsed = !this.isCollapsed;
        container.classList.toggle('collapsed', this.isCollapsed);
        
        // Zustand speichern
        this._saveCollapseState();
    }
    
    /**
     * Aktualisiert die Vorschau der aktiven Statuseffekte
     * @private
     */
    _updatePreview() {
        const preview = document.getElementById(this.containerId + '-preview');
        if (!preview) return;
        
        if (this.activeStatuses.size === 0) {
            preview.innerHTML = '<span class="status-effects-preview-empty">keine</span>';
        } else {
            const availableStatuses = this.getAvailableStatuses();
            const emojis = Array.from(this.activeStatuses)
                .map(id => availableStatuses[id]?.emoji || '')
                .filter(e => e)
                .join(' ');
            preview.textContent = emojis;
        }
    }
    
    /**
     * Speichert den Einklapp-Zustand im localStorage
     * @private
     */
    _saveCollapseState() {
        try {
            const key = 'statusEffects_collapsed_' + this.containerId;
            localStorage.setItem(key, this.isCollapsed ? '1' : '0');
        } catch (e) {
            // localStorage nicht verfügbar
        }
    }
    
    /**
     * Lädt den Einklapp-Zustand aus dem localStorage
     * @private
     */
    _loadCollapseState() {
        try {
            const key = 'statusEffects_collapsed_' + this.containerId;
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                this.isCollapsed = saved === '1';
            }
        } catch (e) {
            // localStorage nicht verfügbar
        }
    }
}

// Global verfügbar machen
window.StatusEffectsComponent = StatusEffectsComponent;
window.STATUS_EFFECTS = STATUS_EFFECTS;

console.log('StatusEffectsComponent wurde geladen.');