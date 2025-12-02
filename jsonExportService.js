/**
 * JSONExportService zur Verwaltung des JSON-Exports
 * Verwendet den globalen PokemonStorageService
 */
class JSONExportService {
    constructor(appState, uiRenderer) {
        this.appState = appState || window.pokemonApp?.appState;
        this.uiRenderer = uiRenderer;
        
        console.log('JSON Export Service initialisiert');
    }
    
    /**
     * Exportiert den aktuellen Pokemon-Sheet als JSON
     */
    exportJSON() {
        if (!this.appState?.pokemonData) {
            this._showToast('Bitte wähle zuerst ein Pokémon aus.', 'error');
            return;
        }

        try {
            // Daten über den StorageService sammeln
            let characterData;
            if (window.pokemonStorageService) {
                characterData = window.pokemonStorageService.gatherCurrentPokemonData();
            } else {
                characterData = this._gatherCharacterData();
            }
            
            if (!characterData) {
                this._showToast('Fehler beim Sammeln der Daten.', 'error');
                return;
            }
            
            // Timestamp hinzufügen
            characterData.timestamp = new Date().toISOString();
            
            // JSON-String erstellen
            const jsonString = JSON.stringify(characterData, null, 2);
            
            // Als Datei herunterladen
            this._downloadJSON(jsonString, `Pokemon_${characterData.pokemonGermanName || characterData.pokemonName}_Lv${characterData.level}.json`);
            
            this._showToast('Pokémon-Sheet erfolgreich als JSON exportiert', 'success');
        } catch (error) {
            console.error('Fehler beim Exportieren als JSON:', error);
            this._showToast('Fehler beim Exportieren als JSON', 'error');
        }
    }
    
    /**
     * Sammelt alle relevanten Daten des aktuellen Charakterbogens
     * @returns {Object} Charakterbogen-Daten als Objekt
     * @private
     */
    _gatherCharacterData() {
        // Moves mit benutzerdefinierten Beschreibungen
        const movesWithDescriptions = this.appState.moves.map(move => {
            if (!move) return null;
            return {
                name: move.name,
                germanName: move.germanName,
                type: move.type,
                germanType: move.germanType,
                power: move.power,
                customDescription: move.customDescription || ''
            };
        });
        
        // Aktuelle Werte in ein Objekt packen
        return {
            timestamp: new Date().toISOString(),
            pokemonId: this.appState.pokemonData.id,
            pokemonName: this.appState.selectedPokemon,
            pokemonGermanName: this.appState.pokemonData.germanName || '',
            types: this.appState.pokemonData.types || [],
            level: this.appState.level,
            currentExp: this.appState.currentExp || 0,
            stats: this.appState.stats,
            currentHp: this.appState.currentHp,
            gena: this.appState.gena,
            pa: this.appState.pa,
            bw: this.appState.bw || 0,
            skillValues: this.appState.skillValues,
            moves: movesWithDescriptions,
            abilities: this.appState.abilities,
            wounds: this.appState.wounds || 0,
            tallyMarks: this.appState.tallyMarks || [], 
            // Textfelder erfassen
            textFields: {
                trainer: document.getElementById('trainer-input')?.value || '',
                nickname: document.getElementById('nickname-input')?.value || '',
                item: document.getElementById('item-input')?.value || ''
            }
        };
    }
    
    /**
     * Lädt eine JSON-Datei herunter
     * @param {string} jsonString - Der JSON-String
     * @param {string} filename - Der Dateiname
     * @private
     */
    _downloadJSON(jsonString, filename) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // Klick simulieren
        document.body.appendChild(a);
        a.click();
        
        // Aufräumen
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
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
}

// Initialisiert den JSONExportService mit den globalen Variablen
function initJSONExportService() {
    // Warten bis die App und AppState verfügbar sind
    if (window.pokemonApp && window.pokemonApp.appState) {
        // Service initialisieren, wenn nicht bereits vorhanden
        if (!window.jsonExportService) {
            window.jsonExportService = new JSONExportService(
                window.pokemonApp.appState, 
                window.pokemonApp.uiRenderer
            );
            console.log('JSON Export Service initialisiert und bereit');
        }
    } else {
        // Erneut versuchen nach kurzer Verzögerung
        setTimeout(initJSONExportService, 500);
    }
}

// Service beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', initJSONExportService);