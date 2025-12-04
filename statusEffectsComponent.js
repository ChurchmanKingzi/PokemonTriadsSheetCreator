/**
 * StatusEffectsComponent
 * ======================
 * Komponente zur Anzeige und Verwaltung von Statuseffekten
 * Verwendet für Pokemon und Trainer (Menschen)
 */

// Statuseffekt-Definitionen
const STATUS_EFFECTS = {
    poisoned: {
        id: 'poisoned',
        name: 'Vergiftet',
        emoji: '☠️',
        color: '#9B59B6',      // Lila
        borderColor: '#7D3C98'
    },
    burned: {
        id: 'burned',
        name: 'Verbrannt',
        emoji: '🔥',
        color: '#E74C3C',      // Rot
        borderColor: '#C0392B'
    },
    paralyzed: {
        id: 'paralyzed',
        name: 'Paralysiert',
        emoji: '⚡',
        color: '#F1C40F',      // Gelb
        borderColor: '#D4AC0D'
    },
    asleep: {
        id: 'asleep',
        name: 'Schlafend',
        emoji: '💤',
        color: '#3498DB',      // Blau
        borderColor: '#2980B9'
    },
    frozen: {
        id: 'frozen',
        name: 'Eingefroren',
        emoji: '❄️',
        color: '#85C1E9',      // Hellblau/Cyan
        borderColor: '#5DADE2'
    },
    cursed: {
        id: 'cursed',
        name: 'Verflucht',
        emoji: '👻',
        color: '#2C3E50',      // Dunkel
        borderColor: '#1A252F'
    },
    infatuated: {
        id: 'infatuated',
        name: 'Verliebt',
        emoji: '💕',
        color: '#FF69B4',      // Pink
        borderColor: '#FF1493'
    },
    confused: {
        id: 'confused',
        name: 'Verwirrt',
        emoji: '💫',
        color: '#E67E22',      // Orange
        borderColor: '#D35400',
        pokemonOnly: true      // Nur für Pokemon
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
        wrapper.title = status.name;
        
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
        
        return wrapper;
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