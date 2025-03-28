/**
 * Utility-Funktionen für die Pokemon Sheet Creator App
 */

/**
 * Ersten Buchstaben groß schreiben
 * @param {string} string - Der zu verarbeitende String
 * @returns {string} String mit erstem Buchstaben als Großbuchstabe
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Alle Wortanfänge groß schreiben
 * @param {string} string - Der zu verarbeitende String
 * @returns {string} String mit allen Wortanfängen als Großbuchstaben
 */
function capitalizeWords(string) {
    if (!string) return '';
    return string.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Berechnet den Statuswert basierend auf dem Basiswert und dem Level
 * @param {number} baseStat - Basiswert des Statuswerts
 * @param {number} level - Level des Pokemons
 * @returns {number} Berechneter Statuswert
 */
function calculateStat(baseStat, level) {
    return Math.floor((2 * baseStat * level) / 100 + 5);
}

/**
 * Berechnet den HP-Wert basierend auf dem Basis-HP und dem Level
 * @param {number} baseHP - Basis-HP des Pokemons
 * @param {number} level - Level des Pokemons
 * @returns {number} Berechneter HP-Wert
 */
function calculateHP(baseHP, level) {
    return Math.floor((2 * baseHP * level) / 100 + level + 10);
}

/**
 * Erstellt ein neues DOM-Element mit optionalen Attributen
 * @param {string} tag - HTML-Tag des Elements
 * @param {Object} attributes - Objekt mit Attributnamen und -werten
 * @param {string|Node|Array} children - Inhalt des Elements (String, Node oder Array von Nodes)
 * @returns {HTMLElement} Das erstellte Element
 */
function createElement(tag, attributes = {}, children = null) {
    const element = document.createElement(tag);
    
    // Attribute setzen
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Kinder hinzufügen
    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (child instanceof Node) {
                    element.appendChild(child);
                } else {
                    element.appendChild(document.createTextNode(child.toString()));
                }
            });
        } else if (children instanceof Node) {
            element.appendChild(children);
        } else {
            element.textContent = children.toString();
        }
    }
    
    return element;
}

/**
 * Event-Listener sicher hinzufügen
 * @param {string|Element} selector - CSS-Selektor oder DOM-Element
 * @param {string} eventType - Typ des Events (z.B. 'click')
 * @param {Function} handler - Event-Handler-Funktion
 * @param {boolean} useCapture - Event-Capturing verwenden
 */
function addEventListenerSafe(selector, eventType, handler, useCapture = false) {
    const element = typeof selector === 'string' 
        ? document.querySelector(selector) 
        : selector;
    
    if (element) {
        element.addEventListener(eventType, handler, useCapture);
    }
}

/**
 * Event-Listener mit Delegation hinzufügen
 * @param {string|Element} parentSelector - CSS-Selektor oder DOM-Element des Elternelements
 * @param {string} childSelector - CSS-Selektor für die Kindelemente
 * @param {string} eventType - Typ des Events (z.B. 'click')
 * @param {Function} handler - Event-Handler-Funktion
 */
function delegateEvent(parentSelector, childSelector, eventType, handler) {
    const parent = typeof parentSelector === 'string' 
        ? document.querySelector(parentSelector) 
        : parentSelector;
    
    if (!parent) return;
    
    parent.addEventListener(eventType, function(e) {
        let targetElement = e.target;
        
        while (targetElement && targetElement !== parent) {
            if (targetElement.matches(childSelector)) {
                handler.call(targetElement, e);
                return;
            }
            targetElement = targetElement.parentElement;
        }
    });
}

/**
     * Normalisiert einen Pokémon-Namen, indem Form-Suffix entfernt wird
     * @param {string} name - Der zu normalisierende Pokémon-Name
     * @returns {string} Normalisierter Name ohne Form-Suffix
     */
function normalizePokemonName(name) {
    // Liste von bekannten Form-Bezeichnern
    const formIdentifiers = [
        '-normal', '-attack', '-defense', '-speed', '-altered', '-origin',
        '-plant', '-sandy', '-trash', '-sunshine', '-snowy', '-rainy',
        '-land', '-sky', '-red-striped', '-blue-striped', '-standard',
        '-zen', '-incarnate', '-ordinary', '-aria', '-pirouette', '-shield',
        '-blade', '-small', '-large', '-super', '-unbound', '-10', '-complete', 
        '-male', '-average', '-50', '-baile', '-midday', '-solo', '-red-meteor',
        '-disguised', '-amped', '-ice', '-full-belly', '-single-strike',
        '-family-of-four', '-green-plumage', '-zero', '-curly', '-two-segment'
    ];
    
    // Prüfen, ob der Name einen bekannten Form-Bezeichner enthält
    for (const identifier of formIdentifiers) {
        if (name.endsWith(identifier)) {
            return name.replace(identifier, '');
        }
    }
    
    return name;
}

/**
 * Globale Hilfsfunktion zum Rendern der Freundschaftspunkte
 * @param {Array} tallyMarks - Die darzustellenden Freundschaftspunkte
 */
function renderTallyMarks(tallyMarks) {
    console.log("FREUNDSCHAFT SOLL GEZEICHNET WERDEN!");
    console.log(tallyMarks)
    const tallyContainer = document.getElementById('tally-container');
    if (!tallyContainer) return;
    
    // Container leeren
    tallyContainer.innerHTML = '';
    
    // Wenn keine Striche vorhanden sind, früh zurückkehren
    if (!tallyMarks || tallyMarks.length === 0) return;
    
    // Strichliste in 5er-Gruppen
    for (let i = 0; i < tallyMarks.length; i++) {
        // Bei jedem fünften Strich eine neue Gruppe erstellen
        if (i % 5 === 0) {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'tally-group';
            tallyContainer.appendChild(groupContainer);
        }
        
        // Aktuelle Gruppe finden
        const currentGroup = tallyContainer.lastChild;
        
        // Strich erstellen
        const mark = document.createElement('span');
        mark.className = 'tally-mark';
        mark.textContent = '|';
        
        // Goldene Striche mit schwarzer Umrandung
        mark.style.color = '#FFD700'; // Gold
        mark.style.textShadow = '1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000';
        mark.style.fontWeight = 'bold';
        
        currentGroup.appendChild(mark);
    }
}

// Globale Funktion verfügbar machen
window.renderTallyMarks = renderTallyMarks;