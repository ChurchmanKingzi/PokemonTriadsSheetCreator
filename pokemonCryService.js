/**
 * PokemonCryService
 * ==================
 * Service zum Abspielen von Pokémon-Rufen (Cries).
 * Verwendet die offiziellen PokeAPI-Cries von GitHub.
 * 
 * URL-Schema:
 * - Latest: https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{id}.ogg
 * - Legacy: https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/{id}.ogg
 * 
 * Features:
 * - PARALLELES PRELOADING für verzögerungsfreie Wiedergabe
 * - Toggle zwischen Latest (modern) und Legacy (Retro) Cries
 * - Lautstärkeregelung mit Persistenz
 * - Fallback auf Legacy wenn Latest nicht verfügbar
 */
class PokemonCryService {
    constructor() {
        // Basis-URL für die Cries
        this.BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon';
        
        // Einstellungen aus LocalStorage laden
        this.settings = {
            enabled: this._loadSetting('pokemonCryEnabled', true),
            volume: this._loadSetting('pokemonCryVolume', 0.5),
            useLatest: this._loadSetting('pokemonCryUseLatest', true)
        };
        
        // Cache für vorgeladene Audio-Elemente
        // Map<pokemonId, {audio: HTMLAudioElement, ready: boolean, promise: Promise}>
        this.preloadCache = new Map();
        
        // Aktuell spielendes Audio-Element
        this.currentAudio = null;
        this.currentlyPlaying = null;
        
        // Maximale Cache-Größe (um Speicher zu sparen)
        this.MAX_CACHE_SIZE = 20;
        
        console.log('PokemonCryService initialisiert (mit Preloading)', this.settings);
    }
    
    /**
     * Lädt eine Einstellung aus dem LocalStorage
     * @private
     */
    _loadSetting(key, defaultValue) {
        try {
            const saved = localStorage.getItem(key);
            if (saved === null) return defaultValue;
            return JSON.parse(saved);
        } catch {
            return defaultValue;
        }
    }
    
    /**
     * Speichert eine Einstellung im LocalStorage
     * @private
     */
    _saveSetting(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('PokemonCryService: Konnte Einstellung nicht speichern', e);
        }
    }
    
    /**
     * Generiert die URL für einen Pokémon-Cry
     * @param {number} pokemonId - Die Pokémon-ID
     * @param {boolean} useLegacy - Ob Legacy-URL verwendet werden soll
     * @returns {string} Die Cry-URL
     */
    getCryUrl(pokemonId, useLegacy = false) {
        const folder = (this.settings.useLatest && !useLegacy) ? 'latest' : 'legacy';
        return `${this.BASE_URL}/${folder}/${pokemonId}.ogg`;
    }
    
    /**
     * Bereinigt den Cache wenn er zu groß wird
     * @private
     */
    _cleanupCache() {
        if (this.preloadCache.size > this.MAX_CACHE_SIZE) {
            // Älteste Einträge entfernen (erste Hälfte)
            const keysToRemove = Array.from(this.preloadCache.keys())
                .slice(0, Math.floor(this.MAX_CACHE_SIZE / 2));
            
            keysToRemove.forEach(key => {
                const cached = this.preloadCache.get(key);
                if (cached && cached.audio) {
                    cached.audio.src = '';
                }
                this.preloadCache.delete(key);
            });
            
            console.log(`PokemonCryService: Cache bereinigt, ${keysToRemove.length} Einträge entfernt`);
        }
    }
    
    /**
     * Lädt einen Cry vor und gibt ein Promise zurück, das resolved wenn der Cry spielbereit ist.
     * Diese Methode sollte PARALLEL zum Laden der Pokemon-Daten aufgerufen werden!
     * 
     * @param {number} pokemonId - Die Pokémon-ID
     * @returns {Promise<boolean>} Promise das resolved wenn der Cry spielbereit ist
     */
    preloadCry(pokemonId) {
        // Validierung
        if (!pokemonId || typeof pokemonId !== 'number') {
            return Promise.resolve(false);
        }
        
        // Prüfen ob bereits im Cache und spielbereit
        const cached = this.preloadCache.get(pokemonId);
        if (cached && cached.ready) {
            console.log(`PokemonCryService: Cry #${pokemonId} bereits im Cache`);
            return Promise.resolve(true);
        }
        
        // Wenn bereits am Laden, das existierende Promise zurückgeben
        if (cached && cached.promise) {
            return cached.promise;
        }
        
        // Cache bereinigen wenn nötig
        this._cleanupCache();
        
        // Neues Audio-Element erstellen und laden
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = this.settings.volume;
        
        const cryUrl = this.getCryUrl(pokemonId);
        console.log(`PokemonCryService: Preloading Cry #${pokemonId}...`, cryUrl);
        
        // Promise erstellen das resolved wenn Audio spielbereit ist
        const loadPromise = new Promise((resolve) => {
            // Erfolg: Audio ist spielbereit
            const onCanPlay = () => {
                cleanup();
                const entry = this.preloadCache.get(pokemonId);
                if (entry) {
                    entry.ready = true;
                }
                console.log(`PokemonCryService: Cry #${pokemonId} spielbereit`);
                resolve(true);
            };
            
            // Fehler: Versuche Legacy-Fallback
            const onError = () => {
                cleanup();
                
                // Nur Fallback versuchen wenn wir Latest verwendet haben
                if (this.settings.useLatest) {
                    console.log(`PokemonCryService: Latest fehlgeschlagen für #${pokemonId}, versuche Legacy...`);
                    this._preloadLegacyFallback(pokemonId, audio).then(resolve);
                } else {
                    console.warn(`PokemonCryService: Cry #${pokemonId} konnte nicht geladen werden`);
                    resolve(false);
                }
            };
            
            // Cleanup-Funktion
            const cleanup = () => {
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.removeEventListener('error', onError);
            };
            
            // Event-Listener hinzufügen
            audio.addEventListener('canplaythrough', onCanPlay, { once: true });
            audio.addEventListener('error', onError, { once: true });
            
            // Timeout nach 5 Sekunden (falls Netzwerk sehr langsam)
            setTimeout(() => {
                if (!this.preloadCache.get(pokemonId)?.ready) {
                    cleanup();
                    console.warn(`PokemonCryService: Timeout beim Laden von Cry #${pokemonId}`);
                    resolve(false);
                }
            }, 5000);
        });
        
        // Im Cache speichern
        this.preloadCache.set(pokemonId, {
            audio: audio,
            ready: false,
            promise: loadPromise
        });
        
        // Laden starten
        audio.src = cryUrl;
        audio.load();
        
        return loadPromise;
    }
    
    /**
     * Legacy-Fallback für Preloading
     * @private
     */
    _preloadLegacyFallback(pokemonId, audio) {
        return new Promise((resolve) => {
            const legacyUrl = this.getCryUrl(pokemonId, true);
            
            const onCanPlay = () => {
                cleanup();
                const entry = this.preloadCache.get(pokemonId);
                if (entry) {
                    entry.ready = true;
                }
                console.log(`PokemonCryService: Legacy-Cry #${pokemonId} spielbereit`);
                resolve(true);
            };
            
            const onError = () => {
                cleanup();
                console.warn(`PokemonCryService: Auch Legacy-Cry #${pokemonId} fehlgeschlagen`);
                resolve(false);
            };
            
            const cleanup = () => {
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.removeEventListener('error', onError);
            };
            
            audio.addEventListener('canplaythrough', onCanPlay, { once: true });
            audio.addEventListener('error', onError, { once: true });
            
            audio.src = legacyUrl;
            audio.load();
        });
    }
    
    /**
     * Spielt den Cry eines Pokémon ab.
     * Wenn der Cry vorgeladen wurde (via preloadCry), erfolgt die Wiedergabe sofort.
     * 
     * @param {number} pokemonId - Die Pokémon-ID
     * @returns {Promise<boolean>} Erfolg
     */
    async playCry(pokemonId) {
        // Prüfen ob aktiviert
        if (!this.settings.enabled) {
            console.log('PokemonCryService: Cries sind deaktiviert');
            return false;
        }
        
        // Validierung
        if (!pokemonId || typeof pokemonId !== 'number') {
            console.warn('PokemonCryService: Ungültige Pokemon-ID', pokemonId);
            return false;
        }
        
        // Aktuellen Cry stoppen
        this.stopCry();
        
        // Prüfen ob im Cache
        const cached = this.preloadCache.get(pokemonId);
        
        if (cached && cached.ready && cached.audio) {
            // Cry ist vorgeladen - sofort abspielen!
            console.log(`PokemonCryService: Spiele vorgeladenen Cry #${pokemonId}`);
            
            try {
                cached.audio.currentTime = 0;
                cached.audio.volume = this.settings.volume;
                this.currentAudio = cached.audio;
                this.currentlyPlaying = pokemonId;
                
                await cached.audio.play();
                return true;
            } catch (error) {
                console.warn(`PokemonCryService: Fehler beim Abspielen von Cry #${pokemonId}`, error);
                this.currentlyPlaying = null;
                return false;
            }
        } else if (cached && cached.promise) {
            // Cry wird gerade geladen - warten und dann abspielen
            console.log(`PokemonCryService: Warte auf Cry #${pokemonId}...`);
            
            const ready = await cached.promise;
            if (ready) {
                return this.playCry(pokemonId); // Rekursiver Aufruf, jetzt sollte er im Cache sein
            }
            return false;
        } else {
            // Cry nicht im Cache - laden und abspielen (mit Delay)
            console.log(`PokemonCryService: Cry #${pokemonId} nicht vorgeladen, lade jetzt...`);
            
            const ready = await this.preloadCry(pokemonId);
            if (ready) {
                return this.playCry(pokemonId);
            }
            return false;
        }
    }
    
    /**
     * Stoppt den aktuell spielenden Cry
     */
    stopCry() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        this.currentlyPlaying = null;
    }
    
    /**
     * Aktiviert oder deaktiviert Cries
     */
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        this._saveSetting('pokemonCryEnabled', enabled);
        console.log(`PokemonCryService: Cries ${enabled ? 'aktiviert' : 'deaktiviert'}`);
        
        if (!enabled) {
            this.stopCry();
        }
    }
    
    /**
     * Gibt zurück ob Cries aktiviert sind
     */
    isEnabled() {
        return this.settings.enabled;
    }
    
    /**
     * Setzt die Lautstärke
     */
    setVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.settings.volume = clampedVolume;
        this._saveSetting('pokemonCryVolume', clampedVolume);
        
        // Lautstärke für alle gecachten Audio-Elemente aktualisieren
        this.preloadCache.forEach(cached => {
            if (cached.audio) {
                cached.audio.volume = clampedVolume;
            }
        });
        
        console.log(`PokemonCryService: Lautstärke auf ${Math.round(clampedVolume * 100)}% gesetzt`);
    }
    
    /**
     * Gibt die aktuelle Lautstärke zurück
     */
    getVolume() {
        return this.settings.volume;
    }
    
    /**
     * Wechselt zwischen Latest und Legacy Cries
     */
    setUseLatest(useLatest) {
        this.settings.useLatest = useLatest;
        this._saveSetting('pokemonCryUseLatest', useLatest);
        
        // Cache leeren da sich die URLs ändern
        this.clearCache();
        
        console.log(`PokemonCryService: Verwende ${useLatest ? 'neuere' : 'Legacy/Retro'} Cries`);
    }
    
    /**
     * Gibt zurück ob Latest Cries verwendet werden
     */
    isUsingLatest() {
        return this.settings.useLatest;
    }
    
    /**
     * Toggle für Cries ein/aus
     */
    toggle() {
        this.setEnabled(!this.settings.enabled);
        return this.settings.enabled;
    }
    
    /**
     * Toggle für Latest/Legacy Cries
     */
    toggleCryType() {
        this.setUseLatest(!this.settings.useLatest);
        return this.settings.useLatest;
    }
    
    /**
     * Leert den Preload-Cache
     */
    clearCache() {
        this.preloadCache.forEach(cached => {
            if (cached.audio) {
                cached.audio.src = '';
            }
        });
        this.preloadCache.clear();
        console.log('PokemonCryService: Cache geleert');
    }
    
    /**
     * Spielt den Cry des aktuell geladenen Pokémon erneut ab
     */
    async replayCry() {
        const appState = window.pokemonApp?.appState;
        if (appState && appState.pokemonData && appState.pokemonData.id) {
            const wasEnabled = this.settings.enabled;
            if (!wasEnabled) {
                this.settings.enabled = true;
            }
            
            const result = await this.playCry(appState.pokemonData.id);
            
            if (!wasEnabled) {
                this.settings.enabled = false;
            }
            
            return result;
        }
        return false;
    }
    
    /**
     * Erstellt einen Button zum manuellen Abspielen des Cries
     */
    createPlayButton() {
        const button = document.createElement('button');
        button.className = 'play-cry-button';
        button.innerHTML = '🔊';
        button.title = 'Pokémon-Ruf abspielen';
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            button.classList.add('playing');
            await this.replayCry();
            
            setTimeout(() => {
                button.classList.remove('playing');
            }, 1000);
        });
        
        return button;
    }
    
    /**
     * Erstellt das UI-Element für Cry-Einstellungen
     */
    createSettingsUI() {
        const container = document.createElement('div');
        container.className = 'cry-settings';
        container.innerHTML = `
            <div class="cry-settings-row">
                <label class="cry-toggle-label">
                    <input type="checkbox" id="cry-enabled-toggle" ${this.settings.enabled ? 'checked' : ''}>
                    <span class="cry-toggle-text">🔊 Pokémon-Rufe</span>
                </label>
            </div>
            <div class="cry-settings-row cry-volume-row" style="${this.settings.enabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                <label for="cry-volume-slider">Lautstärke:</label>
                <input type="range" id="cry-volume-slider" min="0" max="100" value="${Math.round(this.settings.volume * 100)}">
                <span id="cry-volume-display">${Math.round(this.settings.volume * 100)}%</span>
            </div>
            <div class="cry-settings-row">
                <label class="cry-toggle-label">
                    <input type="checkbox" id="cry-legacy-toggle" ${!this.settings.useLatest ? 'checked' : ''}>
                    <span class="cry-toggle-text">🎮 Retro-Rufe (Gen 1-5 Style)</span>
                </label>
            </div>
        `;
        
        const enabledToggle = container.querySelector('#cry-enabled-toggle');
        const volumeSlider = container.querySelector('#cry-volume-slider');
        const volumeDisplay = container.querySelector('#cry-volume-display');
        const volumeRow = container.querySelector('.cry-volume-row');
        const legacyToggle = container.querySelector('#cry-legacy-toggle');
        
        enabledToggle.addEventListener('change', (e) => {
            this.setEnabled(e.target.checked);
            volumeRow.style.opacity = e.target.checked ? '' : '0.5';
            volumeRow.style.pointerEvents = e.target.checked ? '' : 'none';
        });
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            this.setVolume(volume);
            volumeDisplay.textContent = `${e.target.value}%`;
        });
        
        legacyToggle.addEventListener('change', (e) => {
            this.setUseLatest(!e.target.checked);
        });
        
        return container;
    }
}

// ============================================================
// GLOBALE INITIALISIERUNG
// ============================================================

window.pokemonCryService = new PokemonCryService();

console.log('PokemonCryService wurde global als window.pokemonCryService initialisiert.');