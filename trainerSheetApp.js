/**
 * TrainerApp
 * Hauptklasse für die kombinierte Trainer/Pokemon-Anwendung
 * MULTI-TRAINER VERSION
 * 
 * WICHTIG: Diese Version verwendet UUID-basierte Persistenz.
 * Pokemon werden durch ihre UUID identifiziert, NICHT durch ihre Position im Team!
 */
class TrainerApp {
    constructor() {
        this.trainerManager = window.trainerManager;
        this.navigationService = window.navigationService;
        this.trainerUIRenderer = null;
        this.pokemonAppInitialized = false;
        
        // Callbacks für Trainer-Wechsel registrieren
        this.trainerManager.onTrainerSwitch = (trainer, index) => this._onTrainerSwitch(trainer, index);
        this.trainerManager.onTrainerListChange = (trainers) => this._onTrainerListChange(trainers);
        
        console.log('TrainerApp wird initialisiert (Multi-Trainer-Version)...');
    }
    
    /**
     * Initialisiert die gesamte Anwendung
     */
    async init() {
        console.log('TrainerApp.init() gestartet');
        
        // Trainer-UI-Renderer erstellen
        this.trainerUIRenderer = new TrainerUIRenderer(this.trainerManager.getActiveTrainer());
        window.trainerUIRenderer = this.trainerUIRenderer;
        
        // Trainer-Tabs rendern
        this._renderTrainerTabs();
        
        // Trainer-Sheet rendern
        this.trainerUIRenderer.renderTrainerSheet();
        
        // Navigation initialisieren
        this.navigationService.init();
        
        // Pokemon-App Integration einrichten
        this._setupPokemonAppIntegration();
        
        // HINWEIS: Export/Import Buttons werden jetzt vom ButtonController gesteuert
        // Die alte _setupExportImportButtons() Methode wird nicht mehr benötigt
        
        console.log('TrainerApp erfolgreich initialisiert');
    }
    
    /**
     * Rendert die Trainer-Tabs
     * @private
     */
    _renderTrainerTabs() {
        const container = document.getElementById('trainer-tabs-wrapper');
        if (!container) {
            // Container erstellen falls nicht vorhanden
            const trainerView = document.getElementById('trainer-view');
            if (!trainerView) return;
            
            const tabsContainer = document.createElement('div');
            tabsContainer.id = 'trainer-tabs-wrapper';
            tabsContainer.className = 'trainer-tabs-container';
            trainerView.insertBefore(tabsContainer, trainerView.firstChild);
        }
        
        this._updateTrainerTabs();
    }
    
    /**
     * Aktualisiert die Trainer-Tabs
     * @private
     */
    _updateTrainerTabs() {
        const container = document.getElementById('trainer-tabs-wrapper');
        if (!container) return;
        
        const trainers = this.trainerManager.getAllTrainers();
        const activeIndex = this.trainerManager.activeTrainerIndex;
        
        container.innerHTML = `
            <div class="trainer-tabs-header">
                <h3 class="trainer-tabs-title">🎓 Trainer</h3>
                <div class="trainer-tabs-list">
                    ${trainers.map((trainer, index) => `
                        <div class="trainer-tab ${index === activeIndex ? 'active' : ''}" 
                             data-trainer-index="${index}"
                             data-tooltip="${trainer.name || 'Neuer Trainer'} - ${trainer.pokemonSlots.filter(s => !s.isEmpty()).length} Pokémon">
                            <span class="trainer-tab-icon">${index === activeIndex ? '⭐' : '👤'}</span>
                            <span class="trainer-tab-name">${trainer.name || 'Trainer ' + (index + 1)}</span>
                            <span class="trainer-tab-badge">${trainer.pokemonSlots.filter(s => !s.isEmpty()).length}</span>
                            ${trainers.length > 1 ? `
                                <button class="trainer-tab-close" data-action="close" data-index="${index}" title="Trainer löschen">×</button>
                            ` : ''}
                        </div>
                    `).join('')}
                    <button class="trainer-tab-add" title="Neuen Trainer hinzufügen">+</button>
                </div>
                <div class="trainer-tab-actions">
                    <button class="trainer-action-btn duplicate" data-action="duplicate" title="Aktuellen Trainer duplizieren">📋</button>
                </div>
            </div>
        `;
        
        // Event-Listener hinzufügen
        this._addTabEventListeners(container);
    }
    
    /**
     * Fügt Event-Listener für die Tabs hinzu
     * @param {HTMLElement} container - Der Tab-Container
     * @private
     */
    _addTabEventListeners(container) {
        // Tab-Klicks
        container.querySelectorAll('.trainer-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Nicht auf Close-Button reagieren
                if (e.target.classList.contains('trainer-tab-close')) return;
                
                const index = parseInt(tab.dataset.trainerIndex, 10);
                if (index !== this.trainerManager.activeTrainerIndex) {
                    this.trainerManager.switchToTrainer(index);
                }
            });
        });
        
        // Close-Buttons
        container.querySelectorAll('.trainer-tab-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index, 10);
                this._confirmDeleteTrainer(index);
            });
        });
        
        // Add-Button
        const addBtn = container.querySelector('.trainer-tab-add');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const newIndex = this.trainerManager.addTrainer();
                this.trainerManager.switchToTrainer(newIndex);
            });
        }
        
        // Duplicate-Button
        const dupBtn = container.querySelector('.trainer-action-btn.duplicate');
        if (dupBtn) {
            dupBtn.addEventListener('click', () => {
                const newIndex = this.trainerManager.duplicateTrainer(this.trainerManager.activeTrainerIndex);
                if (newIndex >= 0) {
                    this.trainerManager.switchToTrainer(newIndex);
                    this._showToast('Trainer wurde dupliziert!', 'success');
                }
            });
        }
    }
    
    /**
     * Zeigt einen Bestätigungsdialog zum Löschen eines Trainers
     * @param {number} index - Index des zu löschenden Trainers
     * @private
     */
    _confirmDeleteTrainer(index) {
        const trainer = this.trainerManager.trainers[index];
        const trainerName = trainer.name || 'Trainer ' + (index + 1);
        const pokemonCount = trainer.pokemonSlots.filter(s => !s.isEmpty()).length;
        
        // Modal erstellen
        const modal = document.createElement('div');
        modal.className = 'trainer-confirm-modal';
        modal.innerHTML = `
            <div class="trainer-confirm-content">
                <h3 class="trainer-confirm-title">Trainer löschen?</h3>
                <p class="trainer-confirm-message">
                    Möchtest du <strong>${trainerName}</strong> wirklich löschen?
                    ${pokemonCount > 0 ? `<br><br>⚠️ Achtung: ${pokemonCount} Pokémon und alle deren Daten werden ebenfalls gelöscht!` : ''}
                </p>
                <div class="trainer-confirm-buttons">
                    <button class="trainer-confirm-btn cancel">Abbrechen</button>
                    <button class="trainer-confirm-btn confirm">Löschen</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event-Listener
        modal.querySelector('.cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.confirm').addEventListener('click', () => {
            this.trainerManager.removeTrainer(index);
            document.body.removeChild(modal);
            this._showToast('Trainer wurde gelöscht.', 'success');
        });
        
        // Klick außerhalb schließt Modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    /**
     * Callback wenn der Trainer gewechselt wird
     * @param {TrainerState} trainer - Der neue aktive Trainer
     * @param {number} index - Index des Trainers
     * @private
     */
    _onTrainerSwitch(trainer, index) {
        console.log(`Trainer gewechselt zu Index ${index}: ${trainer.name || 'Unbenannt'}`);
        
        // UIRenderer mit neuem Trainer aktualisieren
        this.trainerUIRenderer.trainerState = trainer;
        
        // UI neu rendern
        this.trainerUIRenderer.renderTrainerSheet();
        
        // Tabs aktualisieren
        this._updateTrainerTabs();
        
        // Navigation zurück zur Trainer-Ansicht
        if (this.navigationService.getCurrentView() === 'pokemon') {
            this.navigationService.showTrainerView();
        }
    }
    
    /**
     * Callback wenn sich die Trainer-Liste ändert
     * @param {Array} trainers - Alle Trainer
     * @private
     */
    _onTrainerListChange(trainers) {
        console.log(`Trainer-Liste geändert. Anzahl: ${trainers.length}`);
        this._updateTrainerTabs();
    }
    
    /**
     * Richtet die Integration mit der Pokemon-App ein
     * @private
     */
    _setupPokemonAppIntegration() {
        // Warten bis die Pokemon-App bereit ist
        const checkPokemonApp = () => {
            if (window.pokemonApp && window.pokemonApp.appState) {
                this._hookIntoPokemonApp();
                this.pokemonAppInitialized = true;
            } else {
                setTimeout(checkPokemonApp, 100);
            }
        };
        
        checkPokemonApp();
    }
    
    /**
     * Hängt sich in die Pokemon-App ein, um Auswahländerungen zu überwachen
     * @private
     */
    _hookIntoPokemonApp() {
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                // Wenn wir im Pokemon-View sind und ein Pokemon gewählt wurde
                if (this.navigationService.getCurrentView() === 'pokemon') {
                    const pokemonId = parseInt(e.target.value, 10);
                    if (pokemonId) {
                        // Warten bis Pokemon-Daten geladen sind
                        setTimeout(() => {
                            if (window.pokemonApp.appState.pokemonData) {
                                const pokemonData = window.pokemonApp.appState.pokemonData;
                                const trainer = this.trainerManager.getActiveTrainer();
                                
                                // Typen extrahieren und zum aktuellen Slot hinzufügen
                                const types = this._extractPokemonTypes(pokemonData);
                                const slotIndex = this.navigationService.getCurrentSlotIndex();
                                
                                if (slotIndex !== null && trainer.pokemonSlots[slotIndex]) {
                                    const slot = trainer.pokemonSlots[slotIndex];
                                    slot.types = types;
                                    
                                    // UUID generieren falls nicht vorhanden
                                    if (!slot.pokemonUuid) {
                                        slot.generateUuid();
                                    }
                                    
                                    this.trainerManager.notifyChange();
                                    
                                    // ============================================
                                    // FIX: Storage-Kontext mit UUID setzen, NICHT mit slotIndex!
                                    // ============================================
                                    if (window.pokemonStorageService && slot.pokemonUuid) {
                                        window.pokemonStorageService.setContext(trainer.id, slot.pokemonUuid);
                                    }
                                }
                                
                                this.navigationService.onPokemonSelected(
                                    pokemonId,
                                    pokemonData
                                );
                            }
                        }, 1000);
                    }
                }
            });
        }
        
        // Event-Listener für Spitznamen-Änderungen
        document.addEventListener('input', (e) => {
            if (e.target.id === 'nickname-input') {
                const slotIndex = this.navigationService.getCurrentSlotIndex();
                const trainer = this.trainerManager.getActiveTrainer();
                if (slotIndex !== null) {
                    trainer.updatePokemonNickname(slotIndex, e.target.value);
                    // Tabs aktualisieren wegen Badge
                    this._updateTrainerTabs();
                }
            }
        });
    }
    
    /**
     * Extrahiert die Typ-Namen aus den Pokemon-Daten
     * @param {Object} pokemonData - Die Pokemon-Daten von der API
     * @returns {Array} Array der Typ-Namen (z.B. ['fire', 'flying'])
     * @private
     */
    _extractPokemonTypes(pokemonData) {
        if (!pokemonData || !pokemonData.types) {
            return [];
        }
        
        return pokemonData.types.map(typeEntry => {
            if (typeEntry.type && typeEntry.type.name) {
                return typeEntry.type.name.toLowerCase();
            }
            if (typeof typeEntry === 'string') {
                return typeEntry.toLowerCase();
            }
            return null;
        }).filter(t => t !== null);
    }
    
    /**
     * Zeigt eine Toast-Benachrichtigung
     * @param {string} message - Die Nachricht
     * @param {string} type - 'success' oder 'error'
     * @private
     */
    _showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
}

// App-Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM geladen, initialisiere TrainerApp (Multi-Trainer)...");
    
    // Warten bis TrainerManager verfügbar ist
    const initApp = () => {
        if (window.trainerManager && window.navigationService) {
            const trainerApp = new TrainerApp();
            window.trainerApp = trainerApp;
            trainerApp.init();
        } else {
            setTimeout(initApp, 50);
        }
    };
    
    initApp();
});