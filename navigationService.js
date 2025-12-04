/**
 * NavigationService
 * =================
 * Verwaltet die Navigation zwischen Trainer- und Pokemon-Ansicht.
 * 
 * DESIGN-PRINZIPIEN:
 * 1. Klare Trennung: Navigation vs. Daten-Management
 * 2. UUID-basierte Persistenz: Pokemon werden durch UUID identifiziert, NICHT durch Position
 * 3. Der Slot-Index wird nur für die UI verwendet, NIEMALS für Storage
 * 
 * WICHTIG: Bei jedem Wechsel zur Pokemon-Ansicht wird die UUID des Pokemon-Slots
 * an den StorageService übergeben - NICHT der Slot-Index!
 */
class NavigationService {
    constructor() {
        this.currentView = 'trainer';  // 'trainer' oder 'pokemon'
        this.currentSlotIndex = null;  // Aktuell ausgewählter Pokemon-Slot (nur für UI)
        this.currentPokemonUuid = null; // UUID des aktuellen Pokemon (für Storage)
        
        // DOM-Referenzen (werden in init() gesetzt)
        this.trainerView = null;
        this.pokemonView = null;
        this.pokemonSelect = null;
    }
    
    /**
     * Initialisiert den NavigationService
     */
    init() {
        this.trainerView = document.getElementById('trainer-view');
        this.pokemonView = document.getElementById('pokemon-view');
        this.pokemonSelect = document.getElementById('pokemon-select');
        
        console.log('NavigationService initialisiert (UUID-basiert)');
    }
    
    /**
     * Gibt die aktuelle Ansicht zurück
     * @returns {string} 'trainer' oder 'pokemon'
     */
    getCurrentView() {
        return this.currentView;
    }
    
    /**
     * Gibt den aktuellen Slot-Index zurück (nur für UI-Zwecke)
     * @returns {number|null}
     */
    getCurrentSlotIndex() {
        return this.currentSlotIndex;
    }
    
    /**
     * Gibt die aktuelle Pokemon-UUID zurück
     * @returns {string|null}
     */
    getCurrentPokemonUuid() {
        return this.currentPokemonUuid;
    }
    
    /**
     * Gibt den aktuellen Trainer zurück
     * @returns {TrainerState|null}
     * @private
     */
    _getActiveTrainer() {
        return window.trainerManager 
            ? window.trainerManager.getActiveTrainer() 
            : window.trainerState;
    }
    
    /**
     * Löst ein Custom-Event aus, wenn sich die Ansicht ändert
     * @private
     */
    _emitViewChangedEvent() {
        const event = new CustomEvent('viewChanged', {
            bubbles: true,
            detail: { view: this.currentView }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Wechselt zur Trainer-Ansicht
     */
    showTrainerView() {
        // Vor dem Wechsel: Aktuellen Pokemon-Stand speichern
        this._saveCurrentPokemonIfNeeded();
        
        // Storage-Kontext löschen
        if (window.pokemonStorageService) {
            window.pokemonStorageService.clearContext();
        }
        
        // Ansicht wechseln
        if (this.pokemonView) this.pokemonView.style.display = 'none';
        if (this.trainerView) this.trainerView.style.display = 'block';
        
        this.currentView = 'trainer';
        this.currentSlotIndex = null;
        this.currentPokemonUuid = null;
        
        // Pokemon-Slots im Trainer-Sheet aktualisieren
        if (window.trainerUIRenderer) {
            window.trainerUIRenderer.updatePokemonSlots();
            window.trainerUIRenderer.reloadTrainerValues();
        }
        
        // Trainer-Tabs aktualisieren
        if (window.trainerApp) {
            window.trainerApp._updateTrainerTabs();
        }
        
        // Event auslösen für ButtonController
        this._emitViewChangedEvent();
        
        console.log('Gewechselt zur Trainer-Ansicht');
    }
    
    /**
     * Wechselt zur Pokemon-Ansicht für einen bestimmten Slot.
     * 
     * WICHTIG: Diese Methode holt sich die UUID aus dem Slot und übergibt
     * diese an den StorageService - NICHT den Slot-Index!
     * 
     * @param {number} slotIndex - Index des Pokemon-Slots
     */
    showPokemonView(slotIndex) {
        // Vor dem Wechsel: Aktuelles Pokemon speichern (falls wir bereits ein Pokemon bearbeiten)
        if (this.currentView === 'pokemon' && this.currentPokemonUuid) {
            this._saveCurrentPokemonIfNeeded();
        }
        
        const trainer = this._getActiveTrainer();
        if (!trainer) {
            console.error('NavigationService: Kein aktiver Trainer gefunden');
            return;
        }
        
        // Slot und UUID holen
        const slot = trainer.pokemonSlots[slotIndex];
        if (!slot) {
            console.error(`NavigationService: Slot ${slotIndex} existiert nicht`);
            return;
        }
        
        // Slot-Index für UI merken
        this.currentSlotIndex = slotIndex;
        
        // UUID aus dem Slot holen (oder generieren falls nicht vorhanden)
        if (slot.pokemonId && !slot.pokemonUuid) {
            // Pokemon existiert, aber hat noch keine UUID -> Generieren!
            slot.generateUuid();
            console.log(`NavigationService: UUID generiert für Slot ${slotIndex}: ${slot.pokemonUuid}`);
            
            // Trainer-Daten speichern mit neuer UUID
            if (window.trainerManager) {
                window.trainerManager.notifyChange();
            }
        }
        
        // UUID merken (kann null sein für leere Slots)
        this.currentPokemonUuid = slot.pokemonUuid;
        
        // Storage-Kontext setzen MIT UUID (nicht mit slotIndex!)
        if (window.pokemonStorageService && slot.pokemonUuid) {
            window.pokemonStorageService.setContext(trainer.id, slot.pokemonUuid);
        }
        
        // Ansicht wechseln
        if (this.trainerView) this.trainerView.style.display = 'none';
        if (this.pokemonView) this.pokemonView.style.display = 'block';
        
        this.currentView = 'pokemon';
        
        // Pokemon laden oder leeren Slot anzeigen
        if (!slot.isEmpty()) {
            this._loadPokemonForSlot(slot, trainer.id);
        } else {
            this._showEmptySlotUI();
        }
        
        // Event auslösen für ButtonController
        this._emitViewChangedEvent();
        
        console.log(`Gewechselt zur Pokemon-Ansicht (Slot ${slotIndex}, UUID: ${slot.pokemonUuid || 'keine'})`);
    }
    
    /**
     * Zeigt die UI für einen leeren Slot
     * @private
     */
    _showEmptySlotUI() {
        if (this.pokemonSelect) {
            this.pokemonSelect.value = '';
        }
        
        const sheetContainer = document.getElementById('pokemon-sheet-container');
        if (sheetContainer) {
            sheetContainer.innerHTML = `
                <div class="empty-pokemon-hint">
                    <p>Wähle ein Pokémon aus dem Dropdown-Menü oben aus,</p>
                    <p>um es diesem Slot hinzuzufügen.</p>
                </div>
            `;
        }
    }
    
    /**
     * Lädt ein Pokemon für einen Slot
     * 
     * @param {PokemonSlot} slot - Der Pokemon-Slot
     * @param {string} trainerId - ID des Trainers
     * @private
     */
    _loadPokemonForSlot(slot, trainerId) {
        // Zuerst: Prüfen ob gespeicherte Daten existieren
        let savedData = null;
        if (window.pokemonStorageService && slot.pokemonUuid) {
            savedData = window.pokemonStorageService.load(trainerId, slot.pokemonUuid);
        }
        
        if (savedData) {
            console.log(`NavigationService: Gespeicherte Daten gefunden für UUID ${slot.pokemonUuid}`);
        } else {
            console.log(`NavigationService: Keine gespeicherten Daten für UUID ${slot.pokemonUuid}`);
        }
        
        // Pokemon-Select auf das richtige Pokemon setzen
        if (this.pokemonSelect) {
            this.pokemonSelect.value = slot.pokemonId;
            
            // Change-Event auslösen
            const event = new Event('change', { bubbles: true });
            this.pokemonSelect.dispatchEvent(event);
        }
    }
    
    /**
     * Speichert das aktuelle Pokemon, falls eines geladen ist
     * @private
     */
    _saveCurrentPokemonIfNeeded() {
        if (window.pokemonStorageService && this.currentPokemonUuid) {
            window.pokemonStorageService.saveCurrentPokemon();
        }
    }
    
    /**
     * Richtet das Trainer-Feld im Pokemon-Sheet ein
     */
    setupTrainerField() {
        const trainerInput = document.getElementById('trainer-input');
        if (!trainerInput) return;
        
        const trainer = this._getActiveTrainer();
        
        trainerInput.value = trainer ? (trainer.name || 'Unbenannter Trainer') : '';
        trainerInput.readOnly = true;
        trainerInput.classList.add('trainer-field-clickable');
        trainerInput.style.cursor = 'pointer';
        trainerInput.title = 'Klicken, um zum Trainer zurückzukehren';
        
        // Click-Event hinzufügen (vorherige entfernen)
        const newTrainerInput = trainerInput.cloneNode(true);
        trainerInput.parentNode.replaceChild(newTrainerInput, trainerInput);
        
        newTrainerInput.addEventListener('click', () => {
            this.showTrainerView();
        });
    }
    
    /**
     * Wird aufgerufen, wenn ein Pokemon aus dem Dropdown ausgewählt wird.
     * Aktualisiert den Trainer-Slot und generiert ggf. eine neue UUID.
     * 
     * @param {number} pokemonId - ID des gewählten Pokemons
     * @param {Object} pokemonData - Die Pokemon-Daten
     */
    onPokemonSelected(pokemonId, pokemonData) {
        if (this.currentSlotIndex === null) {
            console.warn('NavigationService: Kein aktiver Slot für Pokemon-Auswahl');
            return;
        }
        
        const trainer = this._getActiveTrainer();
        if (!trainer) return;
        
        const slot = trainer.pokemonSlots[this.currentSlotIndex];
        if (!slot) return;
        
        // Prüfen ob es eine neue Pokemon-Spezies ist
        const isNewSpecies = slot.pokemonId !== pokemonId;
        const wasEmpty = slot.isEmpty();
        
        // Pokemon-Daten dem Slot zuweisen
        slot.pokemonId = pokemonId;
        slot.pokemonName = pokemonData.name;
        slot.germanName = pokemonData.germanName || pokemonData.name;
        slot.spriteUrl = pokemonData.sprites?.front_default || '';
        slot.nickname = document.getElementById('nickname-input')?.value || '';
        
        // Typen extrahieren
        if (pokemonData.types) {
            slot.types = pokemonData.types.map(t => {
                if (t.type && t.type.name) return t.type.name.toLowerCase();
                if (typeof t === 'string') return t.toLowerCase();
                return null;
            }).filter(t => t !== null);
        }
        
        // UUID generieren falls noch keine vorhanden
        // WICHTIG: Wenn der Slot leer war, brauchen wir eine NEUE UUID
        if (!slot.pokemonUuid || wasEmpty) {
            slot.generateUuid();
            console.log(`NavigationService: Neue UUID generiert: ${slot.pokemonUuid}`);
        }
        
        // UUID lokal und im Storage-Kontext aktualisieren
        this.currentPokemonUuid = slot.pokemonUuid;
        
        if (window.pokemonStorageService) {
            window.pokemonStorageService.setContext(trainer.id, slot.pokemonUuid);
        }
        
        // Trainer-Änderung benachrichtigen (speichert auch die UUID)
        if (window.trainerManager) {
            window.trainerManager.notifyChange();
        }
        
        console.log(`Pokemon ${slot.germanName} zu Slot ${this.currentSlotIndex} hinzugefügt (UUID: ${slot.pokemonUuid})`);
    }
}

// NavigationService global verfügbar machen
window.navigationService = new NavigationService();

console.log('NavigationService wurde global initialisiert (UUID-basiert).');