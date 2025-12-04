/**
 * TrainerPdfService
 * PDF-Export für Trainer-Charakterbögen
 * Exportiert nur aufgeklappte Sektionen
 * 
 * SELBST-INTEGRIEREND: Nutzt den bestehenden "PDF Speichern" Button
 * und wählt automatisch zwischen Trainer- und Pokemon-Export
 */
class TrainerPdfService {
    constructor() {
        this.trainerManager = null;
        this.navigationService = null;
        
        // Bibliotheken laden
        this._loadLibraries().then(() => {
            console.log('PDF-Bibliotheken für Trainer geladen');
        }).catch(error => {
            console.error('Fehler beim Laden der PDF-Bibliotheken:', error);
        });
        
        // Warten bis alle Services verfügbar sind, dann Button einrichten
        this._waitForServices();
    }
    
    /**
     * Wartet auf benötigte Services und richtet dann den Button ein
     * @private
     */
    _waitForServices() {
        const checkServices = () => {
            if (window.trainerManager && window.navigationService) {
                this.trainerManager = window.trainerManager;
                this.navigationService = window.navigationService;
                this._setupPdfButton();
                console.log('TrainerPdfService: Services gefunden, Button eingerichtet');
            } else {
                setTimeout(checkServices, 100);
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkServices);
        } else {
            checkServices();
        }
    }
    
    /**
     * Richtet den PDF-Button ein (nutzt bestehenden Button)
     * @private
     */
    _setupPdfButton() {
        const pdfButton = document.getElementById('save-pdf-button');
        
        if (!pdfButton) {
            console.warn('TrainerPdfService: PDF-Button nicht gefunden');
            return;
        }
        
        // Alten Event-Listener entfernen durch Klonen
        const newPdfButton = pdfButton.cloneNode(true);
        pdfButton.parentNode.replaceChild(newPdfButton, pdfButton);
        
        // Neuen Event-Listener hinzufügen
        newPdfButton.addEventListener('click', () => {
            this._handlePdfExport();
        });
        
        // Button-Text dynamisch aktualisieren bei View-Wechsel
        this._updateButtonText(newPdfButton);
        
        // Bei Klicks auf Navigation den Button-Text aktualisieren
        document.addEventListener('click', () => {
            setTimeout(() => this._updateButtonText(newPdfButton), 50);
        });
    }
    
    /**
     * Aktualisiert den Button-Text basierend auf dem aktuellen View
     * @param {HTMLElement} button - Der PDF-Button
     * @private
     */
    _updateButtonText(button) {
        if (!this.navigationService) return;
        
        const currentView = this.navigationService.getCurrentView();
        
        if (currentView === 'trainer') {
            button.textContent = '📄 Trainer-PDF';
            button.title = 'Trainer-Bogen als PDF exportieren (nur aufgeklappte Bereiche)';
        } else {
            button.textContent = '📄 Pokemon-PDF';
            button.title = 'Pokemon-Bogen als PDF exportieren';
        }
    }
    
    /**
     * Behandelt den PDF-Export basierend auf dem aktuellen View
     * @private
     */
    _handlePdfExport() {
        if (!this.navigationService) {
            this._showToast('Navigation-Service nicht verfügbar', 'error');
            return;
        }
        
        const currentView = this.navigationService.getCurrentView();
        
        if (currentView === 'trainer') {
            this.exportTrainerPdf();
        } else {
            // Pokemon-PDF über den bestehenden PdfService
            if (window.pokemonApp && window.pokemonApp.pdfService) {
                window.pokemonApp.pdfService.exportPdf();
            } else {
                this._showToast('Pokemon-PDF-Service nicht verfügbar', 'error');
            }
        }
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
    }
    
    /**
     * Lädt ein Script asynchron
     * @param {string} src - URL des zu ladenden Scripts
     * @returns {Promise} Promise, das aufgelöst wird, wenn das Script geladen ist
     * @private
     */
    _loadScript(src) {
        return new Promise((resolve, reject) => {
            // Prüfen ob das Script bereits geladen ist
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Exportiert den aktuellen Trainer-Sheet als PDF
     * Jede aufgeklappte Sektion bekommt eine eigene Seite
     */
    async exportTrainerPdf() {
        const trainer = this.trainerManager?.getActiveTrainer();
        
        if (!trainer) {
            this._showToast('Kein Trainer vorhanden.', 'error');
            return;
        }

        this._showLoadingOverlay('Bereite PDF vor...');
        
        try {
            // Warten, bis jsPDF geladen ist
            if (!window.jspdf) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Prüfen, ob jsPDF und html2canvas geladen wurden
            if (!window.jspdf || !window.html2canvas) {
                throw new Error('PDF-Bibliotheken nicht geladen. Bitte warten Sie einen Moment und versuchen Sie es erneut.');
            }
            
            const { jsPDF } = window.jspdf;
            
            // Sheet-Container ermitteln
            const sheetContainer = document.getElementById('trainer-sheet-container');
            if (!sheetContainer) {
                throw new Error('Trainer-Sheet nicht gefunden');
            }
            
            const sheetElement = sheetContainer.querySelector('.trainer-sheet');
            if (!sheetElement) {
                throw new Error('Trainer-Sheet Element nicht gefunden');
            }
            
            // ============================================
            // Alle AUFGEKLAPPTEN Sektionen sammeln
            // ============================================
            const allSections = sheetElement.querySelectorAll('.collapsible-section');
            const expandedSections = Array.from(allSections).filter(
                section => !section.classList.contains('collapsed')
            );
            
            if (expandedSections.length === 0) {
                this._showToast('Keine aufgeklappten Sektionen zum Exportieren.', 'error');
                return;
            }
            
            // PDF-Objekt erstellen (A4 Hochformat als Standard)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10; // 10mm Rand
            const usableWidth = pdfWidth - (2 * margin);
            const usableHeight = pdfHeight - (2 * margin);
            
            // ============================================
            // Jede Sektion einzeln rendern
            // ============================================
            for (let i = 0; i < expandedSections.length; i++) {
                const section = expandedSections[i];
                const sectionTitle = section.querySelector('.collapsible-title')?.textContent || `Sektion ${i + 1}`;
                
                this._updateLoadingMessage(`Rendere: ${sectionTitle} (${i + 1}/${expandedSections.length})`);
                
                // Neue Seite hinzufügen (außer bei der ersten)
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Alle anderen Sektionen temporär verstecken
                const otherSections = Array.from(allSections).filter(s => s !== section);
                const hiddenOthers = otherSections.map(s => {
                    const orig = s.style.display;
                    s.style.display = 'none';
                    return { element: s, originalDisplay: orig };
                });
                
                // UI-Elemente in dieser Sektion verstecken
                const hiddenUI = this._hideUiElements(section);
                
                // Textareas in dieser Sektion ersetzen
                const textareaReplacements = this._replaceTextareasWithDivs(section);
                
                // Sektion als Canvas rendern
                const canvas = await html2canvas(section, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF',
                    width: section.scrollWidth,
                    height: section.scrollHeight
                });
                
                // Wiederherstellen
                this._restoreTextareas(textareaReplacements);
                this._restoreUiElements(hiddenUI);
                hiddenOthers.forEach(({ element, originalDisplay }) => {
                    element.style.display = originalDisplay || '';
                });
                
                // Skalierung berechnen um die Seite optimal zu füllen
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                
                // Skalierungsfaktor: Seite möglichst ausfüllen
                const scaleX = usableWidth / (canvasWidth / 2); // /2 wegen scale:2 bei html2canvas
                const scaleY = usableHeight / (canvasHeight / 2);
                const scale = Math.min(scaleX, scaleY) * 0.95; // 95% für etwas Luft
                
                // Finale Dimensionen
                const finalWidth = (canvasWidth / 2) * scale;
                const finalHeight = (canvasHeight / 2) * scale;
                
                // Zentrieren auf der Seite
                const x = margin + (usableWidth - finalWidth) / 2;
                const y = margin + (usableHeight - finalHeight) / 2;
                
                // Canvas als Bild zur PDF-Seite hinzufügen
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            }
            
            // Metadata hinzufügen
            this._addMetadataToPdf(pdf, trainer);
            
            // PDF speichern
            const trainerName = trainer.name || 'Trainer';
            const sanitizedName = trainerName.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
            pdf.save(`Trainer_${sanitizedName}.pdf`);
            
            this._showToast(`Trainer-PDF mit ${expandedSections.length} Seiten gespeichert`, 'success');
        } catch (error) {
            console.error('Fehler beim Exportieren des PDF:', error);
            this._showToast('Fehler beim Exportieren des PDF: ' + error.message, 'error');
        } finally {
            this._hideLoadingOverlay();
        }
    }
    
    /**
     * Versteckt UI-Elemente die im PDF nicht erscheinen sollen
     * @param {HTMLElement} container - Das Container-Element
     * @returns {Array} Array mit versteckten Elementen
     * @private
     */
    _hideUiElements(container) {
        const hidden = [];
        
        // Drag-Handles verstecken
        container.querySelectorAll('.drag-handle-section').forEach(el => {
            const orig = el.style.display;
            el.style.display = 'none';
            hidden.push({ element: el, originalDisplay: orig });
        });
        
        // Collapse-Toggle-Buttons verstecken
        container.querySelectorAll('.collapse-toggle').forEach(el => {
            const orig = el.style.display;
            el.style.display = 'none';
            hidden.push({ element: el, originalDisplay: orig });
        });
        
        return hidden;
    }
    
    /**
     * Stellt versteckte UI-Elemente wieder her
     * @param {Array} hiddenElements - Array mit versteckten Elementen
     * @private
     */
    _restoreUiElements(hiddenElements) {
        hiddenElements.forEach(({ element, originalDisplay }) => {
            element.style.display = originalDisplay || '';
        });
    }
    
    /**
     * Ersetzt Textareas temporär durch Divs für korrekte Darstellung in html2canvas
     * @param {HTMLElement} container - Das Container-Element
     * @returns {Array} Array mit Informationen zur Wiederherstellung
     * @private
     */
    _replaceTextareasWithDivs(container) {
        const replacements = [];
        const textareas = container.querySelectorAll('textarea');
        
        textareas.forEach(textarea => {
            // Computed styles kopieren
            const computedStyle = window.getComputedStyle(textarea);
            
            // Div erstellen
            const div = document.createElement('div');
            div.className = textarea.className + ' textarea-pdf-replacement';
            
            // Text mit Zeilenumbrüchen setzen
            const text = textarea.value || '';
            div.innerHTML = text
                .split('\n')
                .map(line => line || '&nbsp;')
                .join('<br>');
            
            // Wichtige Styles übernehmen
            div.style.width = computedStyle.width;
            div.style.minHeight = computedStyle.height;
            div.style.padding = computedStyle.padding;
            div.style.margin = computedStyle.margin;
            div.style.border = computedStyle.border;
            div.style.borderRadius = computedStyle.borderRadius;
            div.style.backgroundColor = computedStyle.backgroundColor;
            div.style.color = computedStyle.color;
            div.style.fontSize = computedStyle.fontSize;
            div.style.fontFamily = computedStyle.fontFamily;
            div.style.lineHeight = computedStyle.lineHeight;
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordWrap = 'break-word';
            div.style.overflow = 'hidden';
            div.style.boxSizing = 'border-box';
            
            // Speichere Referenz für Wiederherstellung
            replacements.push({
                textarea: textarea,
                div: div,
                parent: textarea.parentNode,
                nextSibling: textarea.nextSibling
            });
            
            // Textarea verstecken und Div einfügen
            textarea.style.display = 'none';
            textarea.parentNode.insertBefore(div, textarea.nextSibling);
        });
        
        return replacements;
    }
    
    /**
     * Stellt die originalen Textareas wieder her
     * @param {Array} replacements - Array mit Wiederherstellungsinformationen
     * @private
     */
    _restoreTextareas(replacements) {
        replacements.forEach(({ textarea, div }) => {
            // Div entfernen
            if (div.parentNode) {
                div.parentNode.removeChild(div);
            }
            // Textarea wieder anzeigen
            textarea.style.display = '';
        });
    }
    
    /**
     * Fügt Metadaten zum PDF hinzu
     * @param {jsPDF} pdf - Das PDF-Objekt
     * @param {TrainerState} trainer - Der Trainer
     * @private
     */
    _addMetadataToPdf(pdf, trainer) {
        // Trainer-Daten als JSON-String in Metadaten speichern
        const metadataString = JSON.stringify({
            version: '1.0',
            type: 'trainer',
            trainerData: {
                id: trainer.id,
                name: trainer.name,
                age: trainer.age,
                playedBy: trainer.playedBy,
                klasse: trainer.klasse,
                secondKlasse: trainer.secondKlasse,
                vorteil: trainer.vorteil,
                nachteil: trainer.nachteil,
                level: trainer.level,
                stats: trainer.stats,
                skillValues: trainer.skillValues,
                pokemonCount: trainer.pokemonSlots?.filter(s => !s.isEmpty()).length || 0
            },
            timestamp: new Date().toISOString()
        });
        
        // Metadaten zum PDF hinzufügen
        pdf.setProperties({
            title: `Trainer Charakterbogen - ${trainer.name || 'Trainer'}`,
            subject: 'Pokemon RPG Trainer-Charakterbogen',
            author: 'Pokemon Sheet Creator',
            keywords: 'Pokemon, RPG, Trainer, Charakterbogen',
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
     * @param {string} initialMessage - Initiale Nachricht
     * @private
     */
    _showLoadingOverlay(initialMessage = 'Erstelle Trainer-PDF...') {
        // Prüfen, ob bereits ein Overlay angezeigt wird
        if (document.querySelector('.loading-overlay')) {
            this._updateLoadingMessage(initialMessage);
            return;
        }
        
        // Overlay-Element erstellen
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        
        // Spinner erstellen
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        // Nachricht erstellen
        const message = document.createElement('div');
        message.className = 'loading-message';
        message.style.color = 'white';
        message.style.marginTop = '10px';
        message.style.textAlign = 'center';
        message.style.maxWidth = '300px';
        message.textContent = initialMessage;
        
        // Zum Overlay hinzufügen
        overlay.appendChild(spinner);
        overlay.appendChild(message);
        
        // Zum Dokument hinzufügen
        document.body.appendChild(overlay);
    }
    
    /**
     * Aktualisiert die Nachricht im Ladeindikator
     * @param {string} newMessage - Neue Nachricht
     * @private
     */
    _updateLoadingMessage(newMessage) {
        const message = document.querySelector('.loading-overlay .loading-message');
        if (message) {
            message.textContent = newMessage;
        }
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

// Global verfügbar machen und sofort initialisieren
window.trainerPdfService = new TrainerPdfService();

console.log('TrainerPdfService wurde global als window.trainerPdfService initialisiert.');