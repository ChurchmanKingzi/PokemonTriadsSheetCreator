/**
 * JSONExportService zur Verwaltung des JSON-Exports und -Imports
 * Mit Korrektur für doppelten PDF-Download
 */
class JSONExportService {
    constructor(appState, uiRenderer) {
        this.appState = appState || window.pokemonApp.appState;
        this.uiRenderer = uiRenderer;
        
        // File Input für JSON-Upload erstellen
        this._createFileInput();
        
        // Event-Listener initialisieren (mit Verzögerung, um sicherzustellen, dass andere Komponenten geladen sind)
        setTimeout(() => {
            this._initEventListeners();
        }, 500);
    }
    
    /**
     * Erstellt ein verstecktes File-Input Element für den JSON-Upload
     * @private
     */
    _createFileInput() {
        // Prüfen, ob das Element bereits existiert
        if (document.getElementById('json-file-input')) {
            return;
        }
        
        // Input-Element erstellen
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'json-file-input';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        // Zum Dokument hinzufügen
        document.body.appendChild(fileInput);
    }
    
    /**
     * Initialisiert Event-Listener für vorhandene Buttons mit verbesserter Methode zum Entfernen alter Listener
     * @private
     */
    _initEventListeners() {
        console.log('Initialisiere Event-Listener für JSON-Export/Import...');
        
        // Speichern-Button: Zuerst klonen, um alle Event-Listener zu entfernen
        const saveButton = document.getElementById('save-pokemon-button');
        if (saveButton) {
            // Attribute und Position des Original-Buttons speichern
            const saveButtonParent = saveButton.parentNode;
            const nextSibling = saveButton.nextSibling;
            const attributes = {};
            
            // Alle Attribute kopieren
            for (let i = 0; i < saveButton.attributes.length; i++) {
                const attr = saveButton.attributes[i];
                attributes[attr.name] = attr.value;
            }
            
            // Originalen Button entfernen
            saveButton.remove();
            
            // Neuen Button erstellen mit gleichen Attributen
            const newSaveButton = document.createElement('button');
            for (const [key, value] of Object.entries(attributes)) {
                newSaveButton.setAttribute(key, value);
            }
            newSaveButton.textContent = saveButton.textContent || 'Pokémon Speichern';
            
            // Neu positionieren
            if (nextSibling) {
                saveButtonParent.insertBefore(newSaveButton, nextSibling);
            } else {
                saveButtonParent.appendChild(newSaveButton);
            }
            
            // Neuen Event-Listener hinzufügen
            newSaveButton.addEventListener('click', (event) => {
                // JSON exportieren
                this.exportJSON();
            });
            
            console.log('Speichern-Button wurde erfolgreich neu konfiguriert');
        } else {
            console.warn('Speichern-Button nicht gefunden');
        }
        
        // Laden-Button auf gleiche Weise behandeln
        const loadButton = document.getElementById('load-pokemon-button');
        if (loadButton) {
            // Attribute und Position des Original-Buttons speichern
            const loadButtonParent = loadButton.parentNode;
            const nextSibling = loadButton.nextSibling;
            const attributes = {};
            
            // Alle Attribute kopieren
            for (let i = 0; i < loadButton.attributes.length; i++) {
                const attr = loadButton.attributes[i];
                attributes[attr.name] = attr.value;
            }
            
            // Originalen Button entfernen
            loadButton.remove();
            
            // Neuen Button erstellen mit gleichen Attributen
            const newLoadButton = document.createElement('button');
            for (const [key, value] of Object.entries(attributes)) {
                newLoadButton.setAttribute(key, value);
            }
            newLoadButton.textContent = loadButton.textContent || 'Pokémon Laden';
            
            // Neu positionieren
            if (nextSibling) {
                loadButtonParent.insertBefore(newLoadButton, nextSibling);
            } else {
                loadButtonParent.appendChild(newLoadButton);
            }
            
            // Neuen Event-Listener hinzufügen - direkt den JSON-File-Input auslösen
            newLoadButton.addEventListener('click', (event) => {
                // JSON-File-Input direkt auslösen
                const fileInput = document.getElementById('json-file-input');
                if (fileInput) {
                    fileInput.click();
                } else {
                    this._showToast('JSON-Import nicht verfügbar', 'error');
                }
            });
            
            console.log('Laden-Button wurde erfolgreich für direkten JSON-Import konfiguriert');
        } else {
            console.warn('Laden-Button nicht gefunden');
        }
        
        // File-Input für JSON-Upload
        const fileInput = document.getElementById('json-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.importJSON(file);
                }
                fileInput.value = '';
            });
        }
    }
    
    /**
     * Exportiert den aktuellen Pokemon-Sheet als JSON
     */
    exportJSON() {
        if (!this.appState.pokemonData) {
            this._showToast('Bitte wähle zuerst ein Pokémon aus.', 'error');
            return;
        }

        try {
            // Aktuelle Werte in ein Objekt packen
            const characterData = this._gatherCharacterData();
            
            // JSON-String erstellen
            const jsonString = JSON.stringify(characterData, null, 2);
            
            // Als Datei herunterladen
            this._downloadJSON(jsonString, `Pokemon_${characterData.pokemonGermanName}_Lv${characterData.level}.json`);
            
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
     * Lädt eine JSON-Datei als Charakterbogen
     * @param {File} file - Die JSON-Datei
     */
    async importJSON(file) {
        try {
            const jsonString = await file.text();
            const characterData = JSON.parse(jsonString);
            
            // Prüfen, ob die Datei valide ist
            if (!this._validateCharacterData(characterData)) {
                throw new Error('Die Datei enthält keinen gültigen Pokémon-Charakterbogen.');
            }
            
            // Daten anwenden
            await this._applyCharacterData(characterData);
            
            this._showToast('Pokémon-Sheet erfolgreich geladen', 'success');
        } catch (error) {
            console.error('Fehler beim Importieren des JSON:', error);
            this._showToast('Fehler beim Importieren des JSON', 'error');
        }
    }
    
    /**
     * Validiert die Charakterbogen-Daten
     * @param {Object} data - Die zu validierenden Daten
     * @returns {boolean} True, wenn die Daten valide sind
     * @private
     */
    _validateCharacterData(data) {
        // Mindestanforderungen prüfen
        return data && 
               (data.pokemonId || data.pokemonName) && // Entweder ID oder Name muss vorhanden sein
               data.level !== undefined;
    }
    
    /**
     * Wendet die importierten Charakterbogen-Daten an
     * @param {Object} data - Die anzuwendenden Daten
     * @private
     */
    async _applyCharacterData(data) {
        // Pokemon im Dropdown auswählen
        const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
        if (selectElement) {
            // Zuerst nach ID suchen
            if (data.pokemonId) {
                selectElement.value = data.pokemonId.toString();
            } 
            // Wenn keine ID oder nicht gefunden, nach Namen suchen
            else if (data.pokemonName) {
                // Alle Optionen durchsuchen
                let found = false;
                for (let i = 0; i < selectElement.options.length; i++) {
                    const option = selectElement.options[i];
                    const optionText = option.textContent.toLowerCase();
                    const searchName = data.pokemonGermanName ? 
                        data.pokemonGermanName.toLowerCase() : 
                        data.pokemonName.toLowerCase();
                    
                    if (optionText.includes(searchName)) {
                        selectElement.value = option.value;
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    throw new Error(`Pokémon "${data.pokemonGermanName || data.pokemonName}" nicht in der Liste gefunden.`);
                }
            }
            
            // Change-Event auslösen, um das Pokemon zu laden
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
            
            // Warten, bis das Pokemon geladen ist
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Nach kurzer Verzögerung die restlichen Daten anwenden
        setTimeout(() => {
            this._applyRemainingData(data);
        }, 1500);
    }
    
    /**
     * Wendet die restlichen Daten an, nachdem das Pokemon geladen wurde
     * @param {Object} data - Die anzuwendenden Daten
     * @private
     */
    _applyRemainingData(data) {
        // Level setzen
        if (data.level !== undefined) {
            this.appState.setLevel(data.level);
            const levelInput = document.getElementById('level-value');
            if (levelInput) {
                levelInput.value = data.level.toString();
            }
        }
        
        // Aktuelle EXP setzen
        if (data.currentExp !== undefined) {
            this.appState.currentExp = data.currentExp;
            const currentExpInput = document.getElementById('current-exp-input');
            if (currentExpInput) {
                currentExpInput.value = data.currentExp.toString();
            }
        }
        
        // Stats setzen
        if (data.stats) {
            Object.entries(data.stats).forEach(([statKey, statValue]) => {
                this.appState.setStat(statKey, statValue);
                const statInput = document.querySelector(`input[data-stat="${statKey}"]`);
                if (statInput) {
                    statInput.value = statValue.toString();
                }
            });
        }
        
        // Aktuelle HP setzen
        if (data.currentHp !== undefined) {
            this.appState.setCurrentHp(data.currentHp);
            const currentHpInput = document.getElementById('current-hp-input');
            if (currentHpInput) {
                currentHpInput.value = data.currentHp.toString();
            }
        }
        
        // GENA, PA und BW setzen
        if (data.gena !== undefined) {
            this.appState.setGena(data.gena);
            const genaInput = document.getElementById('gena-input');
            if (genaInput) {
                genaInput.value = data.gena.toString();
            }
        }
        
        if (data.pa !== undefined) {
            this.appState.setPa(data.pa);
            const paInput = document.getElementById('pa-input');
            if (paInput) {
                paInput.value = data.pa.toString();
            }
        }
        
        if (data.bw !== undefined) {
            this.appState.setBw(data.bw);
            const bwInput = document.getElementById('bw-input');
            if (bwInput) {
                bwInput.value = data.bw.toString();
            }
        }
        
        // Wunden setzen, wenn vorhanden
        if (data.wounds !== undefined && typeof this.appState.setWounds === 'function') {
            this.appState.setWounds(data.wounds);
            setTimeout(() => {
                if (typeof displayWoundsState === 'function') {
                    displayWoundsState(data.wounds);
                }
            }, 500);
        }
        
        // Freundschaft setzen, wenn vorhanden
        if (data.tallyMarks !== undefined && typeof this.appState.setWounds === 'function') {
            this.appState.setWounds(data.wounds);
            setTimeout(() => {
                if (typeof displayWoundsState === 'function') {
                    displayWoundsState(data.wounds);
                }
            }, 500);
        }
        
        // Fertigkeiten setzen
        if (data.skillValues) {
            Object.entries(data.skillValues).forEach(([skill, value]) => {
                this.appState.setSkillValue(skill, value);
                const skillInput = document.querySelector(`input[data-skill="${skill}"]`);
                if (skillInput) {
                    skillInput.value = value.toString();
                }
            });
        }
        
        // Attacken setzen
        if (data.moves && Array.isArray(data.moves)) {
            // Warten, bis die Attacken geladen sind
            setTimeout(() => {
                data.moves.forEach((moveData, index) => {
                    if (!moveData) return;
                    
                    // Bei neuem Format (mit Beschreibungen)
                    const moveName = typeof moveData === 'object' ? moveData.name : moveData;
                    
                    const moveSelect = document.getElementById(`move-${index}`);
                    if (moveSelect) {
                        moveSelect.value = moveName;
                        
                        // Change-Event auslösen
                        const event = new Event('change', { bubbles: true });
                        moveSelect.dispatchEvent(event);
                        
                        // Wenn Beschreibung vorhanden, diese nach kurzer Verzögerung setzen
                        if (typeof moveData === 'object' && moveData.customDescription) {
                            setTimeout(() => {
                                const descriptionField = document.getElementById(`move-description-${index}`);
                                if (descriptionField) {
                                    descriptionField.value = moveData.customDescription;
                                    
                                    // Auch im AppState speichern
                                    if (this.appState.moves[index]) {
                                        this.appState.moves[index].customDescription = moveData.customDescription;
                                    }
                                }
                            }, 300);
                        }
                    }
                });
            }, 800);
        }
        
        // Textfelder setzen
        if (data.textFields) {
            // Trainer-Name setzen
            const trainerInput = document.getElementById('trainer-input');
            if (trainerInput && data.textFields.trainer) {
                trainerInput.value = data.textFields.trainer;
            }
            
            // Spitznamen setzen
            const nicknameInput = document.getElementById('nickname-input');
            if (nicknameInput && data.textFields.nickname) {
                nicknameInput.value = data.textFields.nickname;
            }
            
            // Item setzen
            const itemInput = document.getElementById('item-input');
            if (itemInput && data.textFields.item) {
                itemInput.value = data.textFields.item;
            }
        }
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
    function waitForApp() {
        if (window.pokemonApp && window.pokemonApp.appState) {
            // Service initialisieren
            window.jsonExportService = new JSONExportService(
                window.pokemonApp.appState, 
                window.pokemonApp.uiRenderer
            );
            console.log('JSON Export/Import Service initialisiert');
        } else {
            // Erneut versuchen nach kurzer Verzögerung
            setTimeout(waitForApp, 500);
        }
    }
    
    // Initialisierung starten
    waitForApp();
}

// Service beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', initJSONExportService);

// Oder, wenn das Dokument bereits geladen ist, direkt initialisieren
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initJSONExportService();
}