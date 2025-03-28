/**
 * JSON Import Service für den Pokemon Charakterbogen
 * Ermöglicht das Laden von gespeicherten Pokemon-Daten aus JSON-Dateien
 */
class JSONImportService {
    /**
     * Konstruktor
     * @param {AppState} appState - Die App-State-Instanz
     * @param {UiRenderer} uiRenderer - Die UI-Renderer-Instanz
     */
    constructor(appState, uiRenderer) {
        this.appState = appState || window.pokemonApp.appState;
        this.uiRenderer = uiRenderer;
        
        // File Input für JSON-Upload erstellen
        this._createFileInput();
        
        // Event-Listener initialisieren
        this._initEventListeners();
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
     * Initialisiert Event-Listener für den JSON-Import
     * @private
     */
    _initEventListeners() {
        console.log('Initialisiere Event-Listener für JSON-Import...');
        
        // Laden-Button: Zum direkten Laden von JSON-Dateien verwenden
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
            
            // Neuen Event-Listener hinzufügen für direkten JSON-Import
            newLoadButton.addEventListener('click', (event) => {
                // JSON-File-Input direkt auslösen
                const fileInput = document.getElementById('json-file-input');
                if (fileInput) {
                    fileInput.click();
                }
            });
            
            console.log('Laden-Button wurde erfolgreich für direkten JSON-Import konfiguriert');
        } else {
            console.warn('Laden-Button nicht gefunden');
        }
        
        // File-Input für JSON-Upload
        const fileInput = document.getElementById('json-file-input');
        if (fileInput) {
            // Bestehende Listener entfernen
            const newFileInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);
            
            // Neuen Listener hinzufügen
            newFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.importJSON(file);
                }
                newFileInput.value = '';
            });
        }
    }
    
    /**
     * Lädt eine JSON-Datei als Charakterbogen
     * @param {File} file - Die JSON-Datei
     */
    async importJSON(file) {
        try {
            // Prüfen, ob die Datei ein JSON ist
            if (!file.name.toLowerCase().endsWith('.json')) {
                throw new Error('Nur JSON-Dateien können importiert werden.');
            }
            
            // JSON-Datei lesen
            const jsonString = await file.text();
            let characterData;
            
            try {
                characterData = JSON.parse(jsonString);
            } catch (parseError) {
                throw new Error('Die ausgewählte Datei enthält kein gültiges JSON.');
            }
            
            // Prüfen, ob die Datei valide ist
            if (!this._validateCharacterData(characterData)) {
                throw new Error('Die Datei enthält keinen gültigen Pokémon-Charakterbogen.');
            }
            
            // Daten anwenden
            console.log('Lade Charakterbogen aus JSON:', characterData);
            await this._applyCharacterData(characterData);
            
            this._showToast('Pokémon-Sheet erfolgreich geladen', 'success');
        } catch (error) {
            console.error('Fehler beim Importieren des JSON:', error);
            this._showToast('Fehler beim Importieren: ' + error.message, 'error');
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
            console.log('Wähle Pokemon aus mit ID:', data.pokemonId);
            
            // Zuerst nach ID suchen (priorisiert)
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
            
            // Warten, bis das Pokemon geladen ist - längere Wartezeit für zuverlässige Ladung
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Nach ausreichender Verzögerung die restlichen Daten anwenden
            // Die längere Verzögerung stellt sicher, dass das Pokemon vollständig geladen ist
            // und die automatisch gesetzten Werte überschrieben werden können
            setTimeout(() => {
                console.log('Wende restliche Daten an...');
                this._applyRemainingData(data);
            }, 2000);
        } else {
            throw new Error('Pokemon-Select-Element nicht gefunden.');
        }
    }
    
    /**
     * Wendet die restlichen Daten an, nachdem das Pokemon geladen wurde
     * @param {Object} data - Die anzuwendenden Daten
     * @private
     */
    _applyRemainingData(data) {
        console.log('Überschreibe Standardwerte mit gespeicherten Werten...');
        
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
        
        // WICHTIG: Stats erst NACH der Auswahl der Spezies setzen!
        if (data.stats) {
            console.log('Setze Statuswerte:', data.stats);
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
            }, 50);
        }
        
        // Fertigkeiten setzen
        if (data.skillValues) {
            console.log('Setze Fertigkeiten:', data.skillValues);
            Object.entries(data.skillValues).forEach(([skill, value]) => {
                this.appState.setSkillValue(skill, value);
                const skillInput = document.querySelector(`input[data-skill="${skill}"]`);
                if (skillInput) {
                    skillInput.value = value.toString();
                }
            });
        }
    
        // Nach kurzer Verzögerung die Strichliste aktualisieren
        setTimeout(() => {
            if (data.tallyMarks) {
                console.log("Geladene Freundschaft: ", data.tallyMarks);
                this.appState.tallyMarks = data.tallyMarks;
                
                // UI Renderer-Funktion direkt aufrufen
                if (window.pokemonApp && window.pokemonApp.uiRenderer) {
                    window.pokemonApp.uiRenderer._renderTallyMarks();
                } else {
                    // Globale Hilfsfunktion definieren und aufrufen
                    window.renderTallyMarks = window.renderTallyMarks || function(marks) {
                        const tallyContainer = document.getElementById('tally-container');
                        if (!tallyContainer) return;
                        
                        tallyContainer.innerHTML = '';
                        
                        for (let i = 0; i < marks.length; i++) {
                            if (i % 5 === 0) {
                                const groupContainer = document.createElement('div');
                                groupContainer.className = 'tally-group';
                                tallyContainer.appendChild(groupContainer);
                            }
                            
                            const currentGroup = tallyContainer.lastChild;
                            const mark = document.createElement('span');
                            mark.className = 'tally-mark';
                            mark.textContent = '|';
                            mark.style.color = '#FFD700';
                            mark.style.textShadow = '1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000';
                            mark.style.fontWeight = 'bold';
                            
                            currentGroup.appendChild(mark);
                        }
                    };
                    
                    window.renderTallyMarks(this.appState.tallyMarks);
                }
            }
        }, 50); // Kürzere Verzögerung
        
        // Attacken setzen mit längerer Verzögerung
        if (data.moves && Array.isArray(data.moves)) {
            setTimeout(() => {
                console.log('Setze Attacken:', data.moves);
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
            }, 1000);
        }
        
        // Textfelder setzen
        if (data.textFields) {
            console.log('Setze Textfelder:', data.textFields);
            
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
        
        console.log('Charakterbogen-Daten erfolgreich angewendet.');
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

// Service exportieren
window.JSONImportService = JSONImportService;

// Automatische Initialisierung
function initJSONImportService() {
    // Warten bis die App und AppState verfügbar sind
    function waitForApp() {
        if (window.pokemonApp && window.pokemonApp.appState) {
            // Service initialisieren
            window.jsonImportService = new JSONImportService(
                window.pokemonApp.appState, 
                window.pokemonApp.uiRenderer
            );
            console.log('JSON Import Service initialisiert');
        } else {
            // Erneut versuchen nach kurzer Verzögerung
            setTimeout(waitForApp, 500);
        }
    }
    
    // Initialisierung starten
    waitForApp();
}

// Service beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', initJSONImportService);

// Oder, wenn das Dokument bereits geladen ist, direkt initialisieren
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initJSONImportService();
}