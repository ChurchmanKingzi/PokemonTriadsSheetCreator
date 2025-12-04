/**
 * Wunden-Komponente für den Pokemon-Charakterbogen
 * 
 * DESIGN-PRINZIPIEN:
 * 1. Nur UI-Rendering und Event-Handling
 * 2. Keine Storage-Operationen - das macht pokemonSheetApp.js
 * 3. Wunden werden im AppState verwaltet und automatisch gespeichert
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
    justify-content: flex-start;
    gap: 0.75rem;
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

// Maximum retry attempts to prevent infinite loops
const MAX_RETRY_ATTEMPTS = 5;

// Flag um doppelte Event-Listener zu verhindern
let eventListenersInitialized = false;

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
 * Event-Handler für Klicks auf Wunden-Kreise
 * @param {Event} event - Das Klick-Event
 */
function handleWoundClick(event) {
    const circle = event.currentTarget;
    const index = parseInt(circle.dataset.index);
    
    // Aktuellen Wunden-Status aus AppState holen
    let currentWounds = 0;
    if (window.pokemonApp && window.pokemonApp.appState) {
        currentWounds = window.pokemonApp.appState.wounds || 0;
    }
    
    // Neuen Wunden-Status berechnen
    let newWounds;
    if (index === currentWounds) {
        // Klick auf bereits markierten Kreis: Wunde entfernen
        newWounds = index - 1;
    } else if (index > currentWounds) {
        // Klick auf höheren Kreis: Alle bis dahin markieren
        newWounds = index;
    } else {
        // Klick auf niedrigeren Kreis: Alle bis dahin markieren
        newWounds = index;
    }
    
    // Stelle sicher, dass der Wert im gültigen Bereich liegt
    newWounds = Math.max(0, Math.min(10, newWounds));
    
    // AppState aktualisieren
    updateWoundsInAppState(newWounds);
    
    // UI aktualisieren
    displayWoundsState(newWounds);
    
    // Auto-Save triggern (der StorageService kümmert sich um alles)
    triggerAutoSave();
}

/**
 * Aktualisiert den Wunden-Status im AppState
 * @param {number} woundsCount - Anzahl der Wunden
 */
function updateWoundsInAppState(woundsCount) {
    if (window.pokemonApp && window.pokemonApp.appState) {
        // Verwendung der setWounds-Methode, wenn verfügbar
        if (typeof window.pokemonApp.appState.setWounds === 'function') {
            window.pokemonApp.appState.setWounds(woundsCount);
        } else {
            // Fallback zur direkten Zuweisung
            window.pokemonApp.appState.wounds = woundsCount;
        }
    }
}

/**
 * Triggert Auto-Save über den StorageService
 */
function triggerAutoSave() {
    if (window.pokemonStorageService && 
        typeof window.pokemonStorageService.triggerAutoSave === 'function') {
        window.pokemonStorageService.triggerAutoSave();
    }
}

/**
 * Zeigt den Wunden-Status in der UI an
 * @param {number} woundsCount - Anzahl der markierten Wunden
 * @param {number} retryCount - Aktuelle Retry-Anzahl (für Retry-Limit)
 */
function displayWoundsState(woundsCount, retryCount = 0) {
    // Validierung
    if (typeof woundsCount !== 'number' || woundsCount < 0) {
        woundsCount = 0;
    }
    
    const circles = document.querySelectorAll('.wound-circle');
    if (!circles || circles.length === 0) {
        // Nur erneut versuchen wenn das Limit nicht erreicht ist
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
 * Prüft ob ein Pokemon geladen ist
 * @returns {boolean} True wenn ein Pokemon geladen ist
 */
function isPokemonLoaded() {
    return window.pokemonApp && 
           window.pokemonApp.appState && 
           window.pokemonApp.appState.pokemonData;
}

/**
 * Initialisiert den Wunden-Status im AppState
 */
function initializeWoundsInAppState() {
    if (window.pokemonApp && window.pokemonApp.appState) {
        // Initialisiere wounds auf 0, falls noch nicht vorhanden
        if (window.pokemonApp.appState.wounds === undefined) {
            if (typeof window.pokemonApp.appState.setWounds === 'function') {
                window.pokemonApp.appState.setWounds(0);
            } else {
                window.pokemonApp.appState.wounds = 0;
            }
        }
    }
}

/**
 * Fügt die Wunden-Komponente in den Pokemon-Info-Bereich ein
 * @param {number} retryCount - Aktuelle Retry-Anzahl
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
        // Nur erneut versuchen wenn Limit nicht erreicht UND ein Pokemon geladen ist
        if (retryCount < MAX_RETRY_ATTEMPTS && isPokemonLoaded()) {
            setTimeout(() => injectWoundsComponent(retryCount + 1), 500);
        }
        return;
    }
    
    const pokemonInfo = container.querySelector('.pokemon-info');
    if (!pokemonInfo) {
        // Nur erneut versuchen wenn Limit nicht erreicht UND ein Pokemon geladen ist
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
 * @param {number} retryCount - Aktuelle Retry-Anzahl
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
        // Nur erneut versuchen wenn Limit nicht erreicht
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
                // Nur wenn ein Pokemon geladen ist
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
 * Initialisiert die Event-Listener für die Wunden-Komponente
 */
function initializeEventListeners() {
    if (eventListenersInitialized) {
        return;
    }
    eventListenersInitialized = true;
    
    // Event-Listener für 'pokemonLoaded' Event
    // Dieses Event wird von pokemonSheetApp.js ausgelöst nachdem ein Pokemon geladen wurde
    document.addEventListener('pokemonLoaded', function(e) {
        setTimeout(() => {
            injectWoundsComponent();
            if (window.pokemonApp && window.pokemonApp.appState) {
                displayWoundsState(window.pokemonApp.appState.wounds || 0);
            }
        }, 500);
    });
    
    // Event-Listener für Pokemon-Auswahl (falls kein pokemonLoaded Event ausgelöst wird)
    const selectElement = document.getElementById('pokemon-select');
    if (selectElement) {
        selectElement.addEventListener('change', function() {
            // Wunden beim Wechsel des Pokemons zurücksetzen (visuell)
            // Der AppState wird von pokemonSheetApp.js verwaltet
            setTimeout(() => {
                injectWoundsComponent();
                // Die Wunden werden aus dem AppState gelesen, der von pokemonSheetApp.js gesetzt wird
                if (window.pokemonApp && window.pokemonApp.appState) {
                    displayWoundsState(window.pokemonApp.appState.wounds || 0);
                }
            }, 1500);
        });
    }
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
            // Event-Listener initialisieren
            setTimeout(() => initializeEventListeners(), 500);
            
            // Beobachter für DOM-Änderungen einrichten
            setTimeout(() => setupMutationObserver(0), 1000);
        });
    } else {
        // DOM ist bereits geladen, direkt fortfahren
        setTimeout(() => initializeEventListeners(), 500);
        setTimeout(() => setupMutationObserver(0), 1000);
    }
}

// Event-Listener für die Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    initWoundsComponent();
});

// Start der Komponenteninitialisierung
initWoundsComponent();

// Globale Funktionen verfügbar machen
window.displayWoundsState = displayWoundsState;
window.injectWoundsComponent = injectWoundsComponent;