/**
 * PdfService zur Verwaltung des PDF-Exports und -Imports
 */
class PdfService {
    constructor(appState, uiRenderer) {
        this.appState = appState;
        this.uiRenderer = uiRenderer;
        
        // Bibliotheken laden
        this._loadLibraries().then(() => {
            console.log('PDF-Bibliotheken geladen');
        }).catch(error => {
            console.error('Fehler beim Laden der PDF-Bibliotheken:', error);
        });
        
        // File Input für PDF-Upload erstellen
        this._createFileInput();
        
        // Event-Listener initialisieren
        this._initEventListeners();
    }
    
    /**
     * Lädt benötigte Bibliotheken asynchron
     * @returns {Promise} Promise, das aufgelöst wird, wenn alle Bibliotheken geladen sind
     * @private
     */
    async _loadLibraries() {
        // jsPDF laden
        await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        
        // html2canvas laden
        await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        
        // PDF.js laden
        await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        
        // PDF.js Worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    /**
     * Lädt ein Script asynchron
     * @param {string} src - URL des zu ladenden Scripts
     * @returns {Promise} Promise, das aufgelöst wird, wenn das Script geladen ist
     * @private
     */
    _loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Erstellt ein verstecktes File-Input Element für den PDF-Upload
     * @private
     */
    _createFileInput() {
        // Prüfen, ob das Element bereits existiert
        if (document.getElementById('pdf-file-input')) {
            return;
        }
        
        // Input-Element erstellen
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'pdf-file-input';
        fileInput.accept = '.pdf';
        fileInput.style.display = 'none';
        
        // Zum Dokument hinzufügen
        document.body.appendChild(fileInput);
    }
    
    /**
     * Initialisiert Event-Listener
     * @private
     */
    _initEventListeners() {
        // Speichern-Button
        const saveButton = document.getElementById('save-pokemon-button');
        if (saveButton) {
            saveButton.addEventListener('click', this.exportPdf.bind(this));
        }
    }
    
    /**
     * Exportiert den aktuellen Pokemon-Sheet als PDF
     */
    async exportPdf() {
        if (!this.appState.pokemonData) {
            this._showToast('Bitte wähle zuerst ein Pokémon aus.', 'error');
            return;
        }

        this._showLoadingOverlay();
        
        try {
            // Warten, bis jsPDF geladen ist
            if (!window.jspdf) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Prüfen, ob jsPDF und html2canvas geladen wurden
            if (!window.jspdf || !window.html2canvas) {
                throw new Error('PDF-Bibliotheken nicht geladen');
            }
            
            const { jsPDF } = window.jspdf;
            
            // Sheet-Container ermitteln
            const sheetContainer = document.getElementById(DOM_IDS.SHEET_CONTAINER);
            if (!sheetContainer) {
                throw new Error('Pokemon-Sheet nicht gefunden');
            }
            
            // Pokémon-Sheet als Canvas rendern
            const canvas = await html2canvas(sheetContainer.firstChild, {
                scale: 2, // Höhere Auflösung für bessere Qualität
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF'
            });
            
            // Canvas-Dimensionen ermitteln
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            
            // PDF-Objekt erstellen mit passender Größe (A4 im Querformat)
            const pdf = new jsPDF({
                orientation: canvasHeight > canvasWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // PDF-Dimensionen ermitteln
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Skalierungsfaktor berechnen, um das Bild optimal anzupassen
            const scale = Math.min(
                pdfWidth / canvasWidth,
                pdfHeight / canvasHeight
            ) * 0.95; // Kleiner Rand
            
            // Neue Dimensionen berechnen
            const scaledWidth = canvasWidth * scale;
            const scaledHeight = canvasHeight * scale;
            
            // Bild zentrieren
            const x = (pdfWidth - scaledWidth) / 2;
            const y = (pdfHeight - scaledHeight) / 2;
            
            // Canvas als Bild zum PDF hinzufügen
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
            
            // Metadata hinzufügen
            this._addMetadataToPdf(pdf);
            
            // PDF speichern
            const pokemonName = this.appState.pokemonData.germanName || this.appState.pokemonData.name;
            pdf.save(`Pokemon_${pokemonName}_Lv${this.appState.level}.pdf`);
            
            this._showToast('Pokémon-Sheet erfolgreich als PDF gespeichert', 'success');
        } catch (error) {
            console.error('Fehler beim Exportieren des PDF:', error);
            this._showToast('Fehler beim Exportieren des PDF', 'error');
        } finally {
            this._hideLoadingOverlay();
        }
    }
    
    /**
     * Fügt Metadaten zum PDF hinzu, um es editierbar zu machen
     * @param {jsPDF} pdf - Das PDF-Objekt
     * @private
     */
    _addMetadataToPdf(pdf) {
        // Pokemon-Daten als JSON-String in Metadaten speichern
        const metadataString = JSON.stringify({
            version: '1.0',
            appState: {
                pokemonId: this.appState.pokemonData.id,
                pokemonName: this.appState.selectedPokemon,
                level: this.appState.level,
                currentExp: this.appState.currentExp || 0,
                stats: this.appState.stats,currentHp: this.appState.currentHp,
                gena: this.appState.gena,
                pa: this.appState.pa,
                bw: this.appState.bw,
                skillValues: this.appState.skillValues,
                moves: this.appState.moves.map(move => move ? move.name : null),
                abilities: this.appState.abilities
            },
            // Textfeld-Werte erfassen
            textFields: {
                trainer: document.getElementById('trainer-input')?.value || '',
                nickname: document.getElementById('nickname-input')?.value || '',
                item: document.getElementById('item-input')?.value || ''
            },
            timestamp: new Date().toISOString()
        });
        
        // Metadaten zum PDF hinzufügen
        pdf.setProperties({
            title: `Pokemon Charakterbogen - ${this.appState.pokemonData.germanName || this.appState.pokemonData.name}`,
            subject: 'Pokemon RPG Charakterbogen',
            author: 'Pokemon Sheet Creator',
            keywords: 'Pokemon, RPG, Charakterbogen',
            creator: 'Pokemon Sheet Creator',
            customData: metadataString
        });
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

    /**
     * Zeigt einen Ladeindikator an
     * @private
     */
    _showLoadingOverlay() {
        // Prüfen, ob bereits ein Overlay angezeigt wird
        if (document.querySelector('.loading-overlay')) {
            return;
        }
        
        // Overlay-Element erstellen
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        
        // Spinner erstellen
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        // Zum Overlay hinzufügen
        overlay.appendChild(spinner);
        
        // Zum Dokument hinzufügen
        document.body.appendChild(overlay);
    }

    /**
     * Entfernt den Ladeindikator
     * @private
     */
    _hideLoadingOverlay() {
        // Overlay suchen und entfernen
        const overlay = document.querySelector('.loading-overlay');
        if (overlay && document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    }
}