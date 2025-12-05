/**
 * searchableSelect.js
 * Erweitert das Pokemon-Dropdown zu einem durchsuchbaren Dropdown, 
 * das die Nummern im Format "#25 Pikachu" bei der Suche ignoriert.
 */

/**
 * Verwandelt das Pokemon-Dropdown in ein durchsuchbares Dropdown-Menü
 */
class SearchableSelect {
  /**
   * Konstruktor
   * @param {string} selectId - ID des Select-Elements
   */
  constructor(selectId) {
    this.originalSelect = document.getElementById(selectId);
    
    if (!this.originalSelect) {
      console.error(`Element mit ID ${selectId} nicht gefunden`);
      return;
    }
    
    this.options = [];
    this.createSearchableSelect();
    this.setupEventListeners();
  }
  
  /**
   * Erstellt die UI-Elemente für das durchsuchbare Dropdown
   */
  createSearchableSelect() {
    // Container für das neue UI erstellen
    this.container = document.createElement('div');
    this.container.className = 'searchable-select-container';
    this.container.style.position = 'relative';
    
    // Suchfeld erstellen
    this.searchField = document.createElement('input');
    this.searchField.type = 'text';
    this.searchField.className = 'searchable-select-input';
    this.searchField.placeholder = 'Pokemon suchen...';
    this.searchField.style.width = '100%';
    this.searchField.style.padding = '0.5rem';
    this.searchField.style.border = '1px solid #d1d5db';
    this.searchField.style.borderRadius = '0.25rem';
    this.searchField.style.boxSizing = 'border-box';
    
    // Dropdown-Liste erstellen
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'searchable-select-dropdown';
    this.dropdown.style.position = 'absolute';
    this.dropdown.style.width = '100%';
    this.dropdown.style.maxHeight = '300px';
    this.dropdown.style.overflowY = 'auto';
    this.dropdown.style.border = '1px solid #d1d5db';
    this.dropdown.style.borderRadius = '0 0 0.25rem 0.25rem';
    this.dropdown.style.backgroundColor = 'white';
    this.dropdown.style.zIndex = '100';
    this.dropdown.style.display = 'none';
    this.dropdown.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    
    // Optionen extrahieren und in das neue Format umwandeln
    Array.from(this.originalSelect.options).forEach(option => {
      // Extrahiere die Dex-Nummer (falls vorhanden) für separate Nummernsuche
      const dexMatch = option.textContent.match(/^#(\d+)\s+/);
      const dexNumber = dexMatch ? dexMatch[1] : '';
      
      // Original-Option speichern
      this.options.push({
        value: option.value,
        text: option.textContent,
        // Extrahiere den Namen ohne die Nummer für die Namenssuche
        searchText: option.textContent.replace(/^#\d+\s+/, '').toLowerCase(),
        // Speichere die Dex-Nummer separat für Nummernsuche
        dexNumber: dexNumber
      });
    });
    
    // Container an Stelle des Original-Selects einfügen
    this.originalSelect.parentNode.insertBefore(this.container, this.originalSelect);
    this.container.appendChild(this.searchField);
    this.container.appendChild(this.dropdown);
    
    // Original-Select verstecken, aber nicht entfernen (für Formular-Submission)
    this.originalSelect.style.display = 'none';
  }
  
  /**
   * Event-Listener einrichten
   */
  setupEventListeners() {
    // Bei Fokus auf das Suchfeld das Dropdown anzeigen
    this.searchField.addEventListener('focus', () => {
      this.filterOptions();
      this.dropdown.style.display = 'block';
    });
    
    // Bei Klick außerhalb des Containers das Dropdown schließen
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.dropdown.style.display = 'none';
      }
    });
    
    // Bei Eingabe die Optionen filtern
    this.searchField.addEventListener('input', () => {
      this.filterOptions();
    });
    
    // Bei Tastendruck Spezialfunktionen (Pfeiltasten, Enter, Escape)
    this.searchField.addEventListener('keydown', (e) => {
      const visibleOptions = this.dropdown.querySelectorAll('.searchable-select-option');
      const highlightedOption = this.dropdown.querySelector('.highlighted');
      let highlightedIndex = Array.from(visibleOptions).indexOf(highlightedOption);
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (highlightedIndex < visibleOptions.length - 1) {
            if (highlightedOption) highlightedOption.classList.remove('highlighted');
            visibleOptions[highlightedIndex + 1].classList.add('highlighted');
            this.ensureVisible(visibleOptions[highlightedIndex + 1]);
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (highlightedIndex > 0) {
            if (highlightedOption) highlightedOption.classList.remove('highlighted');
            visibleOptions[highlightedIndex - 1].classList.add('highlighted');
            this.ensureVisible(visibleOptions[highlightedIndex - 1]);
          }
          break;
          
        case 'Enter':
          if (highlightedOption) {
            e.preventDefault();
            this.selectOption(highlightedOption.dataset.value, highlightedOption.textContent);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          this.dropdown.style.display = 'none';
          break;
      }
    });
  }
  
  /**
   * Filtert die Optionen basierend auf dem Suchbegriff
   */
  filterOptions() {
    const searchTerm = this.searchField.value.toLowerCase();
    
    // Dropdown leeren
    this.dropdown.innerHTML = '';
    
    // Standard-Option "-- Pokémon auswählen --" immer anzeigen
    if (this.options.length > 0 && this.options[0].value === '') {
      const defaultOption = document.createElement('div');
      defaultOption.className = 'searchable-select-option';
      defaultOption.textContent = this.options[0].text;
      defaultOption.dataset.value = this.options[0].value;
      defaultOption.style.padding = '0.5rem';
      defaultOption.style.cursor = 'pointer';
      
      defaultOption.addEventListener('click', () => {
        this.selectOption(this.options[0].value, this.options[0].text);
      });
      
      defaultOption.addEventListener('mouseover', () => {
        const highlighted = this.dropdown.querySelector('.highlighted');
        if (highlighted) highlighted.classList.remove('highlighted');
        defaultOption.classList.add('highlighted');
      });
      
      this.dropdown.appendChild(defaultOption);
    }
    
    // Gefilterte Optionen anzeigen
    let hasResults = false;
    
    this.options.forEach(option => {
      // Erste Option (Standard) überspringen, da sie bereits hinzugefügt wurde
      if (option.value === '' && this.options.indexOf(option) === 0) {
        return;
      }
      
      // Filtern nach dem Namen (ohne die Nummer) ODER nach der Dex-Nummer
      const matchesName = option.searchText.includes(searchTerm);
      const matchesDexNumber = option.dexNumber && option.dexNumber.startsWith(searchTerm);
      
      if (searchTerm === '' || matchesName || matchesDexNumber) {
        hasResults = true;
        
        const optionElement = document.createElement('div');
        optionElement.className = 'searchable-select-option';
        optionElement.textContent = option.text;
        optionElement.dataset.value = option.value;
        optionElement.style.padding = '0.5rem';
        optionElement.style.cursor = 'pointer';
        
        optionElement.addEventListener('click', () => {
          this.selectOption(option.value, option.text);
        });
        
        optionElement.addEventListener('mouseover', () => {
          const highlighted = this.dropdown.querySelector('.highlighted');
          if (highlighted) highlighted.classList.remove('highlighted');
          optionElement.classList.add('highlighted');
        });
        
        this.dropdown.appendChild(optionElement);
      }
    });
    
    // "Keine Ergebnisse" anzeigen, wenn nichts gefunden wurde
    if (!hasResults && searchTerm !== '') {
      const noResults = document.createElement('div');
      noResults.className = 'searchable-select-no-results';
      noResults.textContent = 'Keine Ergebnisse gefunden';
      noResults.style.padding = '0.5rem';
      noResults.style.color = '#6b7280';
      noResults.style.fontStyle = 'italic';
      this.dropdown.appendChild(noResults);
    }
    
    // Ersten Eintrag hervorheben
    const firstOption = this.dropdown.querySelector('.searchable-select-option');
    if (firstOption) {
      firstOption.classList.add('highlighted');
    }
    
    // Dropdown anzeigen, wenn es Inhalte gibt
    if (this.dropdown.childNodes.length > 0) {
      this.dropdown.style.display = 'block';
    } else {
      this.dropdown.style.display = 'none';
    }
  }
  
  /**
   * Wählt eine Option aus
   * @param {string} value - Wert der Option (Pokemon-ID)
   * @param {string} text - Anzeigetext der Option
   */
  selectOption(value, text) {
    // Original-Select aktualisieren
    this.originalSelect.value = value;
    
    // Change-Event im Original-Select auslösen
    const event = new Event('change', { bubbles: true });
    this.originalSelect.dispatchEvent(event);
    
    // Suchfeld-Wert setzen und Dropdown schließen
    this.searchField.value = text;
    this.dropdown.style.display = 'none';
  }
  
  /**
   * Stellt sicher, dass ein Element im sichtbaren Bereich des Dropdowns ist
   * @param {HTMLElement} element - Das sicherzustellende Element
   */
  ensureVisible(element) {
    const dropdownRect = this.dropdown.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    if (elementRect.top < dropdownRect.top) {
      this.dropdown.scrollTop -= (dropdownRect.top - elementRect.top);
    } else if (elementRect.bottom > dropdownRect.bottom) {
      this.dropdown.scrollTop += (elementRect.bottom - dropdownRect.bottom);
    }
  }
  
  /**
   * Aktualisiert die Optionen im durchsuchbaren Dropdown
   * Rufe diese Methode auf, wenn sich die Optionen im Original-Select ändern
   */
  updateOptions() {
    this.options = [];
    
    // Optionen extrahieren und in das neue Format umwandeln
    Array.from(this.originalSelect.options).forEach(option => {
      // Extrahiere die Dex-Nummer (falls vorhanden) für separate Nummernsuche
      const dexMatch = option.textContent.match(/^#(\d+)\s+/);
      const dexNumber = dexMatch ? dexMatch[1] : '';
      
      this.options.push({
        value: option.value,
        text: option.textContent,
        // Extrahiere den Namen ohne die Nummer für die Suche
        searchText: option.textContent.replace(/^#\d+\s+/, '').toLowerCase(),
        // Speichere die Dex-Nummer separat für Nummernsuche
        dexNumber: dexNumber
      });
    });
    
    // Dropdown aktualisieren, wenn es geöffnet ist
    if (this.dropdown.style.display === 'block') {
      this.filterOptions();
    }
  }
}

// CSS-Styles für die durchsuchbare Dropdown-Liste
function addSearchableSelectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .searchable-select-container {
      margin-bottom: 1rem;
    }
    
    .searchable-select-input:focus {
      outline: 2px solid #4a5568;
      outline-offset: -1px;
    }
    
    .searchable-select-option {
      transition: background-color 0.2s;
    }
    
    .searchable-select-option:hover,
    .searchable-select-option.highlighted {
      background-color: #f3f4f6;
    }
    
    .searchable-select-dropdown {
      transition: all 0.2s ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

// Initialisierungsfunktion für das durchsuchbare Dropdown
function initSearchableSelect() {
  console.log("Initialisiere durchsuchbares Dropdown...");
  addSearchableSelectStyles();
  const pokemonSelect = new SearchableSelect(DOM_IDS.POKEMON_SELECT);
  
  // Observer für Änderungen am Original-Select erstellen
  const selectObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        pokemonSelect.updateOptions();
      }
    });
  });
  
  // Observer starten
  selectObserver.observe(document.getElementById(DOM_IDS.POKEMON_SELECT), {
    childList: true
  });
  
  // Globale Referenz speichern
  window.pokemonSearchableSelect = pokemonSelect;
}

// Funktion, die periodisch überprüft, ob die Pokémon-Liste bereits geladen wurde
function waitForPokemonList() {
  const selectElement = document.getElementById(DOM_IDS.POKEMON_SELECT);
  
  // Wenn die erste echte Pokémon-Option vorhanden ist, initialisiere das durchsuchbare Dropdown
  if (selectElement && selectElement.options.length > 1) {
    initSearchableSelect();
  } else {
    // Sonst erneut prüfen nach 500ms
    setTimeout(waitForPokemonList, 500);
  }
}

// Diese Funktion auf das DOMContentLoaded-Event anmelden
document.addEventListener('DOMContentLoaded', () => {
  // Warte 1 Sekunde bevor wir mit der Prüfung beginnen
  // Das gibt dem ursprünglichen PokemonSheetApp.init() Zeit, zu starten
  setTimeout(waitForPokemonList, 1000);
});