/**
 * SkillDisplayModeService
 * =======================
 * Verwaltet den globalen Anzeigemodus für Fertigkeitswerte.
 * 
 * Modi:
 * - 'individual': Zeigt nur den Fertigkeitswert selbst (Default)
 * - 'total': Zeigt Fertigkeitswert + zugehöriger Grundwert (KÖ/WI/CH/GL)
 * 
 * Ausnahmen (zeigen immer nur eigenen Wert):
 * - Ausweichen
 * - Nahkampf
 * - Schießen
 * - Kampfsport
 */
class SkillDisplayModeService {
    constructor() {
        this.STORAGE_KEY = 'skill_display_mode';
        this.MODE_INDIVIDUAL = 'individual';
        this.MODE_TOTAL = 'total';
        
        // Fertigkeiten, die KEINE Grundwert-Addition erhalten
        this.EXCLUDED_SKILLS = [
            'Ausweichen',
            'Nahkampf',
            'Schießen',
            'Kampfsport'
        ];
        
        // Mapping: Fertigkeit -> Grundwert-Kategorie (wird dynamisch gebaut)
        this.SKILL_TO_BASE = {};
        
        // Event-Listener für Modus-Änderungen
        this._listeners = [];
        
        // Mapping bauen, sobald SKILL_GROUPS verfügbar ist
        this._initializeMapping();
        
        console.log('SkillDisplayModeService initialisiert');
    }
    
    /**
     * Initialisiert das Skill-to-Base Mapping
     * Wartet ggf. auf SKILL_GROUPS
     * @private
     */
    _initializeMapping() {
        // Versuche sofort zu bauen
        if (typeof SKILL_GROUPS !== 'undefined') {
            this._buildMappingFromSkillGroups();
        } else {
            // Warte auf DOMContentLoaded und versuche erneut
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this._buildMappingFromSkillGroups();
                });
            } else {
                // Fallback: Warte kurz und versuche erneut
                setTimeout(() => {
                    this._buildMappingFromSkillGroups();
                }, 100);
            }
        }
    }
    
    /**
     * Baut das Mapping dynamisch aus SKILL_GROUPS und TRAINER_SKILL_GROUPS
     * @private
     */
    _buildMappingFromSkillGroups() {
        this.SKILL_TO_BASE = {};
        
        // Aus SKILL_GROUPS (Pokemon)
        if (typeof SKILL_GROUPS !== 'undefined') {
            Object.entries(SKILL_GROUPS).forEach(([category, skills]) => {
                skills.forEach(skill => {
                    this.SKILL_TO_BASE[skill] = category;
                });
            });
        }
        
        // Aus TRAINER_SKILL_GROUPS (Trainer, falls vorhanden)
        if (typeof TRAINER_SKILL_GROUPS !== 'undefined') {
            Object.entries(TRAINER_SKILL_GROUPS).forEach(([category, skills]) => {
                skills.forEach(skill => {
                    if (!this.SKILL_TO_BASE[skill]) {
                        this.SKILL_TO_BASE[skill] = category;
                    }
                });
            });
        }
        
        console.log('SkillDisplayModeService: Mapping gebaut mit', Object.keys(this.SKILL_TO_BASE).length, 'Fertigkeiten');
    }
    
    /**
     * Gibt den aktuellen Anzeigemodus zurück
     * @returns {string} 'individual' oder 'total'
     */
    getMode() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored === this.MODE_TOTAL) {
                return this.MODE_TOTAL;
            }
        } catch (e) {
            console.warn('SkillDisplayModeService: localStorage nicht verfügbar');
        }
        return this.MODE_INDIVIDUAL;
    }
    
    /**
     * Setzt den Anzeigemodus
     * @param {string} mode - 'individual' oder 'total'
     */
    setMode(mode) {
        if (mode !== this.MODE_INDIVIDUAL && mode !== this.MODE_TOTAL) {
            console.error('SkillDisplayModeService: Ungültiger Modus:', mode);
            return;
        }
        
        try {
            localStorage.setItem(this.STORAGE_KEY, mode);
            console.log('SkillDisplayModeService: Modus gespeichert:', mode);
        } catch (e) {
            console.warn('SkillDisplayModeService: Konnte Modus nicht speichern');
        }
        
        // Listener benachrichtigen
        this._notifyListeners(mode);
        
        console.log('SkillDisplayModeService: Modus geändert zu', mode);
    }
    
    /**
     * Wechselt zwischen den Modi
     * @returns {string} Der neue Modus
     */
    toggleMode() {
        const currentMode = this.getMode();
        const newMode = currentMode === this.MODE_INDIVIDUAL 
            ? this.MODE_TOTAL 
            : this.MODE_INDIVIDUAL;
        this.setMode(newMode);
        console.log('SkillDisplayModeService: Toggle von', currentMode, 'zu', newMode);
        return newMode;
    }
    
    /**
     * Prüft, ob eine Fertigkeit von der Grundwert-Addition ausgenommen ist
     * @param {string} skillName - Name der Fertigkeit
     * @returns {boolean}
     */
    isExcludedSkill(skillName) {
        return this.EXCLUDED_SKILLS.includes(skillName);
    }
    
    /**
     * Gibt die zugehörige Grundwert-Kategorie für eine Fertigkeit zurück
     * @param {string} skillName - Name der Fertigkeit
     * @returns {string|null} 'KÖ', 'WI', 'CH', 'GL' oder null
     */
    getBaseStatForSkill(skillName) {
        return this.SKILL_TO_BASE[skillName] || null;
    }
    
    /**
     * Berechnet den anzuzeigenden Wert für eine Fertigkeit
     * @param {string} skillName - Name der Fertigkeit
     * @param {number} skillValue - Der Basis-Fertigkeitswert
     * @param {Object} skillValues - Alle Skill-Werte (inkl. Grundwerte KÖ, WI, CH, GL)
     * @param {boolean} forceIndividual - Erzwingt Einzelwert-Anzeige (z.B. bei Fokus)
     * @returns {{displayValue: number, isTotal: boolean}}
     */
    getDisplayValue(skillName, skillValue, skillValues, forceIndividual = false) {
        const mode = this.getMode();
        
        // Wenn Einzelwert-Modus oder erzwungen, zeige nur den Skill-Wert
        if (mode === this.MODE_INDIVIDUAL || forceIndividual) {
            return { displayValue: skillValue, isTotal: false };
        }
        
        // Grundwerte (KÖ, WI, CH, GL) werden nie addiert
        if (['KÖ', 'WI', 'CH', 'GL'].includes(skillName)) {
            return { displayValue: skillValue, isTotal: false };
        }
        
        // Ausgenommene Skills zeigen nur eigenen Wert
        if (this.isExcludedSkill(skillName)) {
            return { displayValue: skillValue, isTotal: false };
        }
        
        // Für alle anderen: Fertigkeit + Grundwert
        const baseStat = this.getBaseStatForSkill(skillName);
        if (baseStat && skillValues && skillValues[baseStat] !== undefined) {
            const baseValue = parseInt(skillValues[baseStat], 10) || 0;
            const totalValue = skillValue + baseValue;
            return { displayValue: totalValue, isTotal: true };
        }
        
        return { displayValue: skillValue, isTotal: false };
    }
    
    /**
     * Berechnet den anzuzeigenden Wert für eine benutzerdefinierte Fertigkeit
     * Nutzt direkt die Kategorie statt den Namen im Mapping nachzuschlagen
     * @param {string} category - Die Kategorie (KÖ, WI, CH, GL)
     * @param {number} skillValue - Der Basis-Fertigkeitswert
     * @param {Object} skillValues - Alle Skill-Werte (inkl. Grundwerte KÖ, WI, CH, GL)
     * @param {boolean} forceIndividual - Erzwingt Einzelwert-Anzeige (z.B. bei Fokus)
     * @returns {{displayValue: number, isTotal: boolean}}
     */
    getDisplayValueForCustomSkill(category, skillValue, skillValues, forceIndividual = false) {
        const mode = this.getMode();
        
        // Wenn Einzelwert-Modus oder erzwungen, zeige nur den Skill-Wert
        if (mode === this.MODE_INDIVIDUAL || forceIndividual) {
            return { displayValue: skillValue, isTotal: false };
        }
        
        // Prüfe ob die Kategorie gültig ist
        if (!['KÖ', 'WI', 'CH', 'GL'].includes(category)) {
            return { displayValue: skillValue, isTotal: false };
        }
        
        // Fertigkeit + Grundwert der Kategorie
        if (skillValues && skillValues[category] !== undefined) {
            const baseValue = parseInt(skillValues[category], 10) || 0;
            const totalValue = skillValue + baseValue;
            return { displayValue: totalValue, isTotal: true };
        }
        
        return { displayValue: skillValue, isTotal: false };
    }
    
    /**
     * Registriert einen Listener für Modus-Änderungen
     * @param {Function} callback - Wird mit dem neuen Modus aufgerufen
     * @returns {Function} Funktion zum Entfernen des Listeners
     */
    addListener(callback) {
        this._listeners.push(callback);
        return () => {
            const index = this._listeners.indexOf(callback);
            if (index > -1) {
                this._listeners.splice(index, 1);
            }
        };
    }
    
    /**
     * Benachrichtigt alle Listener
     * @param {string} newMode - Der neue Modus
     * @private
     */
    _notifyListeners(newMode) {
        this._listeners.forEach(callback => {
            try {
                callback(newMode);
            } catch (e) {
                console.error('SkillDisplayModeService: Listener-Fehler', e);
            }
        });
    }
    
    /**
     * Gibt zurück, ob gerade der Gesamtwerte-Modus aktiv ist
     * @returns {boolean}
     */
    isTotalMode() {
        return this.getMode() === this.MODE_TOTAL;
    }
}

// Global verfügbar machen
window.skillDisplayModeService = new SkillDisplayModeService();

console.log('SkillDisplayModeService wurde global als window.skillDisplayModeService initialisiert.');