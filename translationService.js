/**
 * Dienst für die Übersetzung von Pokémon-Daten ins Deutsche
 */
class TranslationService {
    constructor() {
        // Cache für bereits übersetzte Elemente
        this.translationCache = {
            pokemonNames: new Map(),
            moveNames: new Map(),
            typeNames: new Map()
        };

        // Deutsche Typen-Mapping
        this.typeTranslations = {
            'normal': 'Normal',
            'fire': 'Feuer',
            'water': 'Wasser',
            'electric': 'Elektro',
            'grass': 'Pflanze',
            'ice': 'Eis',
            'fighting': 'Kampf',
            'poison': 'Gift',
            'ground': 'Boden',
            'flying': 'Flug',
            'psychic': 'Psycho',
            'bug': 'Käfer',
            'rock': 'Gestein',
            'ghost': 'Geist',
            'dragon': 'Drache',
            'dark': 'Unlicht',
            'steel': 'Stahl',
            'fairy': 'Fee'
        };
    }

    /**
     * Übersetzt einen Pokémon-Namen ins Deutsche
     * @param {string} englishName - Englischer Name
     * @param {Object} speciesData - Arten-Daten aus der API
     * @returns {string} Deutscher Name
     */
    translatePokemonName(englishName, speciesData) {
        // Prüfen, ob der Name bereits im Cache ist
        if (this.translationCache.pokemonNames.has(englishName)) {
            return this.translationCache.pokemonNames.get(englishName);
        }

        // Versuchen, den deutschen Namen aus den speciesData zu extrahieren
        let germanName = englishName; // Standard: englischer Name
        
        if (speciesData && speciesData.names && Array.isArray(speciesData.names)) {
            const germanEntry = speciesData.names.find(entry => 
                entry.language && entry.language.name === 'de'
            );
            
            if (germanEntry && germanEntry.name) {
                germanName = germanEntry.name;
            }
        }
        
        // Name im Cache speichern
        this.translationCache.pokemonNames.set(englishName, germanName);
        
        return germanName;
    }

    /**
     * Übersetzt einen Attacken-Namen ins Deutsche
     * @param {string} englishName - Englischer Name
     * @param {Object} moveData - Attacken-Daten aus der API
     * @returns {string} Deutscher Name
     */
    translateMoveName(englishName, moveData) {
        // Prüfen, ob der Name bereits im Cache ist
        if (this.translationCache.moveNames.has(englishName)) {
            return this.translationCache.moveNames.get(englishName);
        }

        // Versuchen, den deutschen Namen aus den moveData zu extrahieren
        let germanName = englishName.replace('-', ' '); // Standard: englischer Name formatiert
        
        if (moveData && moveData.names && Array.isArray(moveData.names)) {
            const germanEntry = moveData.names.find(entry => 
                entry.language && entry.language.name === 'de'
            );
            
            if (germanEntry && germanEntry.name) {
                germanName = germanEntry.name;
            }
        }
        
        // Name im Cache speichern
        this.translationCache.moveNames.set(englishName, germanName);
        
        return germanName;
    }

    /**
     * Übersetzt einen Typen-Namen ins Deutsche
     * @param {string} englishType - Englischer Typ
     * @returns {string} Deutscher Typ
     */
    translateTypeName(englishType) {
        // Prüfen, ob der Typ bereits im Cache ist
        if (this.translationCache.typeNames.has(englishType)) {
            return this.translationCache.typeNames.get(englishType);
        }

        // Übersetzung aus dem Mapping abrufen oder englischen Namen zurückgeben
        const germanType = this.typeTranslations[englishType] || capitalizeFirstLetter(englishType);
        
        // Typ im Cache speichern
        this.translationCache.typeNames.set(englishType, germanType);
        
        return germanType;
    }

    /**
     * Löscht den Cache für alle Übersetzungen
     */
    clearCache() {
        this.translationCache.pokemonNames.clear();
        this.translationCache.moveNames.clear();
        this.translationCache.typeNames.clear();
    }
}