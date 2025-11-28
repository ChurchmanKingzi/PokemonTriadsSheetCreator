/**
 * Wunden-Komponente für den Pokemon-Charakterbogen
 * Fixed version: Added retry limits to prevent infinite loops
 */

// CSS für die Wunden-Komponente
const woundsCSS = `
/* Wunden-Container */
.wounds-container {
    margin-top: 0.5rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.wounds-title {
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
}

.wounds-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    position: relative;
    padding: 0.25rem 0;
}

/* Kreis-Styles - jetzt als Ringe mit weißem Inhalt */
.wound-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #4a5568;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: #fff;
    transition: all 0.2s ease;
}

.wound-circle:hover {
    transform: scale(1.1);
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}

/* Durchkreuzter Zustand */
.wound-circle.marked::before,
.wound-circle.marked::after {
    content: '';
    position: absolute;
    width: 115%;
    height: 2px;
    background-color: #C53030;
    top: 50%;
    left: 50%;
    transform-origin: center;
    z-index: 2;
}

.wound-circle.marked::before {
    transform: translate(-50%, -50%) rotate(45deg);
}

.wound-circle.marked::after {
    transform: translate(-50%, -50%) rotate(-45deg);
}

/* Farbverlauf von schwarz nach rot - jetzt nur die Umrandung, nicht der Hintergrund */
.wound-circle:nth-child(1) {
    border-color: #000000;
}

.wound-circle:nth-child(2) {
    border-color: #1a0000;
}

.wound-circle:nth-child(3) {
    border-color: #330000;
}

.wound-circle:nth-child(4) {
    border-color: #4d0000;
}

.wound-circle:nth-child(5) {
    border-color: #660000;
}

.wound-circle:nth-child(6) {
    border-color: #800000;
}

.wound-circle:nth-child(7) {
    border-color: #990000;
}

.wound-circle:nth-child(8) {
    border-color: #b30000;
}

.wound-circle:nth-child(9) {
    border-color: #cc0000;
}

/* Der letzte Kreis wird durch den Totenschädel ersetzt, 
   daher wird hier nur ein Platzhalter für die Logik behalten */
.wound-circle:nth-child(10) {
    border-color: #ff0000;
    position: relative;
}

/* Totenschädel als Ersatz für den letzten Kreis */
.skull {
    position: absolute;
    width: 30px;
    height: 30px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 1;
    background-color: #d1d1d1; /* Hellgrauer Hintergrund */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ff0000; /* Rote Umrandung */
}

.skull svg {
    width: 80%;
    height: 80%;
    fill: #333;
    stroke: #000;
    stroke-width: 1px;
}

/* Der letzte Kreis wird durch den Totenschädel ersetzt */
.wounds-bar .wound-circle:last-child {
    background: transparent;
    border: none;
}

/* Die Durchkreuzungslinien sollen beim Schädel länger sein */
.wounds-bar .wound-circle:last-child.marked::before,
.wounds-bar .wound-circle:last-child.marked::after {
    width: 140%;
    height: 3px;
}

@media (max-width: 480px) {
    .wounds-bar {
        overflow-x: auto;
        justify-content: flex-start;
        gap: 8px;
        padding-bottom: 5px;
    }
    
    .wound-circle {
        flex-shrink: 0;
    }
}
`;

// Globale Variable, um zu verfolgen, ob die Integration bereits durchgeführt wurde
let woundsIntegrated = false;
let selectHandlerIntegrated = false;

// Maximum retry attempts to prevent infinite loops
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Erstellt die Wunden-Komponente
 * @returns {HTMLElement} Die Wunden-Komponente
 */
function createWoundsComponent() {
    // Füge CSS zum Dokument hinzu, falls noch nicht vorhanden
    if (!document.getElementById('wounds-style')) {
        const style = document.createElement('style');
        style.id = 'wounds-style';
        style.textContent = woundsCSS;
        document.head.appendChild(style);
    }
    
    // Erstelle den Container
    const woundsContainer = document.createElement('div');
    woundsContainer.className = 'wounds-container';
    woundsContainer.id = 'wounds-container';
    
    // Titel hinzufügen
    const title = document.createElement('div');
    title.className = 'wounds-title';
    title.textContent = 'Wunden';
    woundsContainer.appendChild(title);
    
    // Leiste für die Kreise
    const woundsBar = document.createElement('div');
    woundsBar.className = 'wounds-bar';
    woundsBar.id = 'wounds-bar';
    woundsContainer.appendChild(woundsBar);
    
    // Kreise erstellen
    for (let i = 1; i <= 10; i++) {
        const circle = document.createElement('div');
        circle.className = 'wound-circle';
        circle.dataset.index = i;
        woundsBar.appendChild(circle);
        
        // Event-Listener für Klicks
        circle.addEventListener('click', handleWoundClick);
    }
    
    // Totenschädel anstatt des letzten Kreises
    const lastCircle = woundsBar.lastChild;
    const skullContainer = document.createElement('div');
    skullContainer.className = 'skull';
    skullContainer.innerHTML = `
        <svg viewBox="0 0 100 100">
            <path d="M50,10 C30,10 15,25 15,45 C15,55 20,63 25,68 C30,73 33,78 33,85 L40,85 C43,85 45,87 45,90 L55,90 C55,87 57,85 60,85 L67,85 C67,78 70,73 75,68 C80,63 85,55 85,45 C85,25 70,10 50,10 Z M35,45 C31.7,45 29,42.3 29,39 C29,35.7 31.7,33 35,33 C38.3,33 41,35.7 41,39 C41,42.3 38.3,45 35,45 Z M65,45 C61.7,45 59,42.3 59,39 C59,35.7 61.7,33 65,33 C68.3,33 71,35.7 71,39 C71,42.3 68.3,45 65,45 Z" />
            <rect x="38" y="55" width="24" height="5" rx="2.5" />
        </svg>
    `;
    lastCircle.appendChild(skullContainer);
    
    // Event-Listener für den Schädel hinzufügen (da er den Kreis ersetzen soll)
    skullContainer.addEventListener('click', (event) => {
        // Verhindere das Bubbling zum lastCircle
        event.stopPropagation();
        // Rufe die gleiche Handler-Funktion wie für die Kreise auf, mit dem letzten Kreis als Kontext
        handleWoundClick.call(lastCircle, { currentTarget: lastCircle });
    });
    
    return woundsContainer;
}

/**
 * Initialisiert Wunden im AppState, falls sie noch nicht existieren
 */
function initializeWoundsInAppState() {
    if (window.pokemonApp && window.pokemonApp.appState) {
        // Nur initialisieren wenn undefined oder null
        if (window.pokemonApp.appState.wounds === undefined || window.pokemonApp.appState.wounds === null) {
            window.pokemonApp.appState.wounds = 0;
        }
        
        // Hier fügen wir auch die setWounds-Methode zum AppState hinzu, falls noch nicht vorhanden
        if (!window.pokemonApp.appState.setWounds) {
            window.pokemonApp.appState.setWounds = function(value) {
                if (value === '' || isNaN(value)) return false;
                
                const numValue = parseInt(value, 10);
                if (numValue < 0 || numValue > 10) return false;
                
                this.wounds = numValue;
                return true;
            };
        }
    }
}

/**
 * Handler für Klicks auf Wunden-Kreise
 * @param {Event} event - Das Klick-Event
 */
function handleWoundClick(event) {
    const clickedCircle = event.currentTarget;
    const index = parseInt(clickedCircle.dataset.index);
    
    // Prüfen, ob der Kreis bereits markiert ist
    const isMarked = clickedCircle.classList.contains('marked');
    
    // Alle Kreise auswählen
    const circles = document.querySelectorAll('.wound-circle');
    
    // Wenn der Kreis bereits markiert ist, diesen und alle rechts davon demarkieren
    if (isMarked) {
        circles.forEach(circle => {
            const circleIndex = parseInt(circle.dataset.index);
            if (circleIndex >= index) {
                circle.classList.remove('marked');
            }
        });
        
        // Wunden-Zustand im AppState aktualisieren
        updateWoundsState(index - 1);
    } 
    // Wenn der Kreis nicht markiert ist, diesen und alle links davon markieren
    else {
        circles.forEach(circle => {
            const circleIndex = parseInt(circle.dataset.index);
            if (circleIndex <= index) {
                circle.classList.add('marked');
            }
        });
        
        // Wunden-Zustand im AppState aktualisieren
        updateWoundsState(index);
    }
    
    // Auto-Save auslösen
    triggerAutoSave();
}

/**
 * Löst die Auto-Save-Funktion aus
 */
function triggerAutoSave() {
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
            // Direkt die saveCurrentSheet-Methode des StorageService aufrufen
            window.pokemonApp.storageService.saveCurrentSheet();
        } catch (error) {
            console.error("Fehler beim Speichern des Charakterbogens:", error);
        }
    }, 100);
}

/**
 * Aktualisiert den Wunden-Zustand im AppState
 * @param {number} woundsCount - Anzahl der markierten Wunden
 */
function updateWoundsState(woundsCount) {
    if (window.pokemonApp && window.pokemonApp.appState) {
        // Verwendung der setWounds-Methode, wenn verfügbar
        if (window.pokemonApp.appState.setWounds) {
            window.pokemonApp.appState.setWounds(woundsCount);
        } else {
            // Fallback zur direkten Zuweisung
            window.pokemonApp.appState.wounds = woundsCount;
        }
    }
}

/**
 * Zeigt den gespeicherten Wunden-Status an
 * @param {number} woundsCount - Anzahl der markierten Wunden
 * @param {number} retryCount - Current retry attempt (for limiting retries)
 */
function displayWoundsState(woundsCount, retryCount = 0) {
    if (typeof woundsCount !== 'number' || woundsCount < 0) {
        woundsCount = 0;
    }
    
    const circles = document.querySelectorAll('.wound-circle');
    if (!circles || circles.length === 0) {
        // Only retry if we haven't exceeded the maximum attempts
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            setTimeout(() => displayWoundsState(woundsCount, retryCount + 1), 300);
        }
        return;
    }
    
    // Den Status in allen Kreisen aktualisieren
    circles.forEach(circle => {
        const index = parseInt(circle.dataset.index);
        if (index <= woundsCount) {
            circle.classList.add('marked');
        } else {
            circle.classList.remove('marked');
        }
    });
}

/**
 * Checks if a Pokemon is currently loaded
 * @returns {boolean} True if a Pokemon is loaded
 */
function isPokemonLoaded() {
    return window.pokemonApp && 
           window.pokemonApp.appState && 
           window.pokemonApp.appState.pokemonData;
}

/**
 * Integriert die Wunden-Komponente in den StorageService
 * @param {number} retryCount - Current retry attempt
 */
function integrateWithStorageService(retryCount = 0) {
    // Wenn die Integration bereits durchgeführt wurde, nichts tun
    if (woundsIntegrated) {
        return;
    }
    
    // Prüfen, ob StorageService verfügbar ist
    if (!window.pokemonApp || !window.pokemonApp.storageService) {
        // Only retry if we haven't exceeded the maximum attempts
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            setTimeout(() => integrateWithStorageService(retryCount + 1), 1000);
        }
        return;
    }
    
    // Markieren, dass die Integration durchgeführt wurde
    woundsIntegrated = true;
    
    // Speichern der Original-Methode für saveCurrentSheet
    const originalSaveCurrentSheet = window.pokemonApp.storageService.saveCurrentSheet;
    
    // Überschreiben der saveCurrentSheet-Methode
    window.pokemonApp.storageService.saveCurrentSheet = function() {
        // Wenn kein Pokemon geladen ist, nichts tun
        if (!this.appState.pokemonData) {
            return false;
        }
        
        try {
            // Aktuelle Charakterbögen laden
            const sheets = this.loadAllSheets();
            
            // Eindeutige ID für den Charakterbogen ist die Pokemon-ID
            const id = this.appState.pokemonData.id;
            
            // Moves mit benutzerdefinierten Beschreibungen (wie im Original)
            const movesWithDescriptions = this.appState.moves.map(move => {
                if (!move) return null;
                return {
                    name: move.name,
                    customDescription: move.customDescription || ''
                };
            });
            
            // Aktuelle Werte in ein Objekt packen
            const characterSheet = {
                id,
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
                wounds: this.appState.wounds || 0, // Wunden-Status speichern
                tallyMarks: this.appState.tallyMarks || [],
                skillValues: this.appState.skillValues,
                moves: movesWithDescriptions,
                abilities: this.appState.abilities,
                // Textfelder erfassen
                textFields: {
                    trainer: document.getElementById('trainer-input')?.value || '',
                    nickname: document.getElementById('nickname-input')?.value || '',
                    item: document.getElementById('item-input')?.value || ''
                }
            };
            
            // Vorhandene Daten aktualisieren oder neue anlegen
            sheets[id] = characterSheet;
            
            // In localStorage speichern
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sheets));
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern des Charakterbogens:', error);
            return false;
        }
    };
    
    // Verbessere den Event-Listener für Pokémon-Select und füge einen neuen Event-Listener für _applyLoadedSheet hinzu
    if (!selectHandlerIntegrated) {
        selectHandlerIntegrated = true;
        
        // Überwache die App-Initialisierung und Pokémon-Auswahl für frühzeitige Wunden-Anzeige
        document.addEventListener('pokemonLoaded', function(e) {
            setTimeout(() => {
                injectWoundsComponent();
                if (window.pokemonApp && window.pokemonApp.appState) {
                    displayWoundsState(window.pokemonApp.appState.wounds || 0);
                }
            }, 500);
        });
        
        // Patche die _applyLoadedSheet-Methode, um die Wunden anzuzeigen
        if (window.pokemonApp) {
            const originalApplyLoadedSheet = window.pokemonApp._applyLoadedSheet;
            if (originalApplyLoadedSheet) {
                window.pokemonApp._applyLoadedSheet = function(sheet) {
                    // Rufe die Originalmethode auf
                    originalApplyLoadedSheet.call(this, sheet);
                    
                    // Füge einen Event aus, damit die Wunden-Komponente weiß, dass Daten geladen wurden
                    const event = new CustomEvent('pokemonLoaded', { detail: sheet });
                    document.dispatchEvent(event);
                };
            }
        }
    }
    
    // Speichern der Original-Methode für loadSheet
    const originalLoadSheet = window.pokemonApp.storageService.loadSheet;
    
    // Überschreiben der loadSheet-Methode
    window.pokemonApp.storageService.loadSheet = function(pokemonId) {
        // Original-Methode aufrufen
        const sheet = originalLoadSheet.call(this, pokemonId);
        
        if (sheet) {
            // Wunden im AppState speichern, wenn in den gespeicherten Daten vorhanden
            if (sheet.wounds !== undefined) {
                // Verwende die setWounds-Methode, wenn verfügbar
                if (window.pokemonApp.appState.setWounds) {
                    window.pokemonApp.appState.setWounds(sheet.wounds);
                } else {
                    window.pokemonApp.appState.wounds = sheet.wounds;
                }
                
                // Warten, bis die UI aktualisiert wurde, dann Wunden-Status anzeigen
                // Single delayed call instead of multiple
                setTimeout(() => {
                    displayWoundsState(sheet.wounds);
                }, 500);
            } else {
                // Setze Wunden auf 0, wenn sie nicht in den gespeicherten Daten vorhanden sind
                if (window.pokemonApp.appState.setWounds) {
                    window.pokemonApp.appState.setWounds(0);
                } else {
                    window.pokemonApp.appState.wounds = 0;
                }
                
                // Stelle sicher, dass alle Wunden-Anzeigen zurückgesetzt werden
                setTimeout(() => {
                    displayWoundsState(0);
                }, 500);
            }
        }
        
        return sheet;
    };
    
    // Event-Listener für den Fall hinzufügen, dass ein Pokémon ausgewählt wird
    const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
    if (selectElement) {
        selectElement.addEventListener('change', () => {
            // Nach der Auswahl eines Pokémon die Wunden-Komponente initialisieren
            setTimeout(() => {
                injectWoundsComponent();
            }, 1000);
        });
    }
}

/**
 * Fügt die Wunden-Komponente in den Pokemon-Info-Bereich ein
 * @param {number} retryCount - Current retry attempt
 */
function injectWoundsComponent(retryCount = 0) {
    // Warten, bis der DOM vollständig geladen ist
    if (document.readyState !== "complete" && document.readyState !== "interactive") {
        document.addEventListener("DOMContentLoaded", () => injectWoundsComponent(0));
        return;
    }
    
    // Initialisiere Wunden im AppState
    initializeWoundsInAppState();
    
    // Pokemon-Info-Element in der DOM-Struktur finden
    const container = document.getElementById(DOM_IDS.SHEET_CONTAINER);
    if (!container || !container.querySelector) {
        // Only retry if we haven't exceeded the maximum attempts AND a Pokemon is loaded
        if (retryCount < MAX_RETRY_ATTEMPTS && isPokemonLoaded()) {
            setTimeout(() => injectWoundsComponent(retryCount + 1), 500);
        }
        return;
    }
    
    const pokemonInfo = container.querySelector('.pokemon-info');
    if (!pokemonInfo) {
        // Only retry if we haven't exceeded the maximum attempts AND a Pokemon is loaded
        if (retryCount < MAX_RETRY_ATTEMPTS && isPokemonLoaded()) {
            setTimeout(() => injectWoundsComponent(retryCount + 1), 500);
        }
        return;
    }
    
    // Prüfen, ob die Wunden-Komponente bereits existiert
    const existingWoundsContainer = document.getElementById('wounds-container');
    if (existingWoundsContainer) {
        // Aktualisiere den Wunden-Status in der bestehenden Komponente
        if (window.pokemonApp && window.pokemonApp.appState) {
            displayWoundsState(window.pokemonApp.appState.wounds || 0);
        }
        return;
    }
    
    // Erstelle und füge die Wunden-Komponente ein
    const woundsComponent = createWoundsComponent();
    
    // Nach dem Typen-Element einfügen
    const typesElement = pokemonInfo.querySelector('.types');
    if (typesElement) {
        typesElement.insertAdjacentElement('afterend', woundsComponent);
        
        // Wunden-Status anzeigen, wenn im AppState vorhanden
        if (window.pokemonApp && window.pokemonApp.appState) {
            const woundsCount = window.pokemonApp.appState.wounds || 0;
            displayWoundsState(woundsCount);
        }
    }
}

/**
 * Beobachter für Änderungen im Sheet-Container
 * @param {number} retryCount - Current retry attempt
 */
function setupMutationObserver(retryCount = 0) {
    // Prüfen, ob der DOM bereit ist
    if (document.readyState !== "complete" && document.readyState !== "interactive") {
        document.addEventListener("DOMContentLoaded", () => setupMutationObserver(0));
        return;
    }
    
    // Container für den Beobachter ermitteln
    const container = document.getElementById(DOM_IDS.SHEET_CONTAINER);
    if (!container) {
        // Only retry if we haven't exceeded the maximum attempts
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            setTimeout(() => setupMutationObserver(retryCount + 1), 500);
        }
        return;
    }
    
    // Beobachter erstellen, der auf Änderungen im Container wartet
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Wenn Änderungen erkannt werden, die Wunden-Komponente injizieren
                // Only inject if a Pokemon is actually loaded
                if (isPokemonLoaded()) {
                    setTimeout(() => {
                        injectWoundsComponent();
                    }, 300);
                }
            }
        });
    });
    
    // Beobachtung starten
    observer.observe(container, {
        childList: true,
        subtree: true
    });
}

/**
 * Hauptfunktion zur Initialisierung der Wunden-Komponente
 */
function initWoundsComponent() {    
    // CSS hinzufügen
    if (!document.getElementById('wounds-style')) {
        const style = document.createElement('style');
        style.id = 'wounds-style';
        style.textContent = woundsCSS;
        document.head.appendChild(style);
    }
    
    // Warten, bis das DOM vollständig geladen ist
    if (document.readyState !== "complete" && document.readyState !== "interactive") {
        document.addEventListener("DOMContentLoaded", () => {
            // Mit dem StorageService integrieren
            setTimeout(() => integrateWithStorageService(0), 1000);
            
            // Beobachter für DOM-Änderungen einrichten
            setTimeout(() => setupMutationObserver(0), 1000);
        });
    } else {
        // DOM ist bereits geladen, direkt fortfahren
        setTimeout(() => integrateWithStorageService(0), 1000);
        setTimeout(() => setupMutationObserver(0), 1000);
    }
}

// Event-Listener für die Initialisierung der App
document.addEventListener('DOMContentLoaded', function() {
    // Stelle sicher, dass die Wunden-Komponente initialisiert wird
    initWoundsComponent();
});

// Füge einen Event-Listener für Änderungen am Pokemon-Select hinzu
setTimeout(function() {
    const selectElement = document.getElementById('pokemon-select');
    if (selectElement) {
        selectElement.addEventListener('change', function() {
            const pokemonId = parseInt(this.value, 10);
            
            // Sofort alle Wunden auf 0 zurücksetzen beim Wechsel
            if (window.pokemonApp && window.pokemonApp.appState) {
                if (window.pokemonApp.appState.setWounds) {
                    window.pokemonApp.appState.setWounds(0);
                } else {
                    window.pokemonApp.appState.wounds = 0;
                }
                
                // Bestehende Wunden-Anzeige sofort zurücksetzen
                displayWoundsState(0);
            }
            
            // Nach der Ladephase die korrekten Wunden anzeigen
            setTimeout(() => {
                if (window.pokemonApp && window.pokemonApp.appState) {
                    // Versuche, die gespeicherten Wunden für dieses Pokemon zu finden
                    if (window.pokemonApp.storageService && pokemonId) {
                        const sheet = window.pokemonApp.storageService.loadSheet(pokemonId);
                        if (sheet && sheet.wounds !== undefined) {
                            // Wunden im AppState setzen
                            if (window.pokemonApp.appState.setWounds) {
                                window.pokemonApp.appState.setWounds(sheet.wounds);
                            } else {
                                window.pokemonApp.appState.wounds = sheet.wounds;
                            }
                            
                            // Komponente einfügen und Wunden anzeigen
                            injectWoundsComponent();
                            displayWoundsState(sheet.wounds);
                        } else {
                            // Wenn keine Wunden gefunden wurden, auf 0 setzen
                            injectWoundsComponent();
                            displayWoundsState(0);
                        }
                    } else {
                        // Fallback zur aktuellen Wunden-Anzeige
                        injectWoundsComponent();
                        displayWoundsState(window.pokemonApp.appState.wounds || 0);
                    }
                }
            }, 1500);
        });
    }
}, 1000);

// Patchen der PokemonSheetApp._handlePokemonSelect-Methode für ein zusätzliches Event
setTimeout(function() {
    if (window.pokemonApp && window.pokemonApp._handlePokemonSelect) {
        const originalHandleSelect = window.pokemonApp._handlePokemonSelect;
        
        window.pokemonApp._handlePokemonSelect = async function(e) {
            const pokemonId = parseInt(e.target.value, 10);
            
            // Wunden immer zu Beginn auf 0 zurücksetzen, um Überbleibsel vom vorherigen Pokemon zu vermeiden
            if (this.appState) {
                if (this.appState.setWounds) {
                    this.appState.setWounds(0);
                } else {
                    this.appState.wounds = 0;
                }
                
                // Sofort alle Wunden-Anzeigen zurücksetzen
                setTimeout(() => {
                    displayWoundsState(0);
                }, 100);
            }
            
            // Originale Methode ausführen
            await originalHandleSelect.call(this, e);
            
            // Nach Abschluss der Auswahl die richtigen Wunden anzeigen
            setTimeout(() => {
                injectWoundsComponent();
                
                // Versuche, die gespeicherten Wunden für dieses Pokemon zu finden
                if (this.storageService && pokemonId) {
                    const sheet = this.storageService.loadSheet(pokemonId);
                    if (sheet && sheet.wounds !== undefined) {
                        // Wunden im AppState setzen
                        if (this.appState.setWounds) {
                            this.appState.setWounds(sheet.wounds);
                        } else {
                            this.appState.wounds = sheet.wounds;
                        }
                        
                        // Anzeige aktualisieren
                        displayWoundsState(sheet.wounds);
                    } else {
                        displayWoundsState(0);
                    }
                } else if (this.appState) {
                    displayWoundsState(this.appState.wounds || 0);
                }
            }, 1000);
        };
    }
}, 1500);

// Start der Komponenteninitialisierung - only once
initWoundsComponent();