/**
 * PdfService zur Verwaltung des PDF-Exports und -Imports
 * Version 2.0 - Multi-Page Support mit korrekter Skalierung
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
     * - Sektionsbasiertes Rendering für optimale Qualität
     * - Automatisches Multi-Page Layout
     * - Eingeklappte Sektionen werden aufgeklappt (außer Notizen)
     */
    async exportPdf() {
        if (!this.appState.pokemonData) {
            this._showToast('Bitte wähle zuerst ein Pokémon aus.', 'error');
            return;
        }

        this._showLoadingOverlay('Bereite Pokemon-PDF vor...');
        
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
            
            const sheetElement = sheetContainer.firstChild || sheetContainer;
            
            // ============================================
            // Sheet-Breite temporär anpassen für besseres Rendering
            // ============================================
            const originalContainerWidth = sheetContainer.style.width;
            const originalContainerMinWidth = sheetContainer.style.minWidth;
            const originalContainerMaxWidth = sheetContainer.style.maxWidth;
            const originalWidth = sheetElement.style.width;
            const originalMinWidth = sheetElement.style.minWidth;
            const originalMaxWidth = sheetElement.style.maxWidth;
            
            // Mindestbreite erzwingen für bessere PDF-Qualität (1000px für alle Spalten)
            const minRenderWidth = 1000;
            
            // Container anpassen
            sheetContainer.style.width = minRenderWidth + 'px';
            sheetContainer.style.minWidth = minRenderWidth + 'px';
            sheetContainer.style.maxWidth = 'none';
            
            // Sheet Element anpassen
            sheetElement.style.width = '100%';
            sheetElement.style.minWidth = minRenderWidth + 'px';
            sheetElement.style.maxWidth = 'none';
            
            // Layout-Reflow erzwingen
            void sheetContainer.offsetHeight;
            
            // Kurz warten für vollständigen Reflow
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // ============================================
            // Sektionen finden und vorbereiten
            // ============================================
            const skipIfCollapsedTerms = ['notizen', 'notes'];
            const collapsedElements = [];
            
            // Alle Sektionen im Pokemon-Sheet finden
            // Pokemon-Sheets haben typischerweise .draggable-section oder direkte Kinder
            let sections = Array.from(sheetElement.querySelectorAll('.draggable-section, .pokemon-section, .sheet-section'));
            
            // Fallback: Wenn keine speziellen Sektionen gefunden, direkte Kinder nehmen
            if (sections.length === 0) {
                sections = Array.from(sheetElement.children).filter(child => 
                    child.tagName !== 'STYLE' && 
                    child.tagName !== 'SCRIPT' &&
                    child.offsetHeight > 0
                );
            }
            
            // Eingeklappte Elemente behandeln
            const allCollapsible = sheetElement.querySelectorAll('.collapsed, [data-collapsed="true"]');
            allCollapsible.forEach(element => {
                const elementId = (element.id || '').toLowerCase();
                const sectionTitle = element.querySelector('.section-title, .collapsible-title, h3, h4')?.textContent?.toLowerCase() || '';
                
                const isNotes = skipIfCollapsedTerms.some(term => 
                    sectionTitle.includes(term) || elementId.includes(term)
                );
                
                if (isNotes) {
                    const origDisplay = element.style.display;
                    element.style.display = 'none';
                    collapsedElements.push({ element, action: 'hide', origDisplay });
                } else {
                    element.classList.remove('collapsed');
                    if (element.dataset.collapsed) {
                        element.dataset.collapsed = 'false';
                    }
                    collapsedElements.push({ element, action: 'expand' });
                }
            });
            
            // Kurz warten für Layout-Update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // PDF-Objekt erstellen (A4 Hochformat)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 8; // Reduzierter Rand für mehr Platz
            const usableWidth = pdfWidth - (2 * margin);
            const usableHeight = pdfHeight - (2 * margin);
            const sectionGap = 0; // Keine Lücke zwischen Sektionen
            const fillMultiplier = 1.08; // Multiplikator um horizontalen Weißraum zu füllen
            
            this._updateLoadingMessage('Rendere Sektionen...');
            
            // ============================================
            // Jede Sektion einzeln rendern
            // ============================================
            const renderedSections = [];
            
            // UI-Elemente verstecken
            const hiddenUI = this._hideUiElementsForPdf(sheetElement);
            
            // Textareas ersetzen
            const textareaReplacements = this._replaceTextareasWithDivs(sheetElement);
            
            // ============================================
            // Einheitliche Breite für alle Sektionen ermitteln
            // ============================================
            const targetWidth = Math.max(minRenderWidth, sheetElement.scrollWidth);
            
            // Wenn wir echte Sektionen haben, diese einzeln rendern
            if (sections.length > 1) {
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i];
                    
                    // Versteckte Sektionen überspringen
                    if (section.style.display === 'none' || section.offsetHeight === 0) {
                        continue;
                    }
                    
                    this._updateLoadingMessage(`Rendere Sektion ${i + 1}/${sections.length}...`);
                    
                    // Andere Sektionen verstecken
                    const hiddenOthers = sections.filter(s => s !== section).map(s => {
                        const orig = s.style.display;
                        s.style.display = 'none';
                        return { element: s, originalDisplay: orig };
                    });
                    
                    // Sektion auf einheitliche Breite zwingen
                    const origSectionWidth = section.style.width;
                    const origSectionMinWidth = section.style.minWidth;
                    const origSectionMaxWidth = section.style.maxWidth;
                    section.style.width = targetWidth + 'px';
                    section.style.minWidth = targetWidth + 'px';
                    section.style.maxWidth = targetWidth + 'px';
                    
                    // Reflow erzwingen
                    void section.offsetHeight;
                    
                    // Sektion rendern mit einheitlicher Breite
                    const canvas = await html2canvas(section, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#FFFFFF',
                        width: targetWidth,
                        height: section.scrollHeight
                    });
                    
                    // Sektionsbreite wiederherstellen
                    section.style.width = origSectionWidth;
                    section.style.minWidth = origSectionMinWidth;
                    section.style.maxWidth = origSectionMaxWidth;
                    
                    // Andere Sektionen wieder anzeigen
                    hiddenOthers.forEach(({ element, originalDisplay }) => {
                        element.style.display = originalDisplay || '';
                    });
                    
                    // Skalierung: Volle Breite nutzen mit Multiplikator
                    const canvasWidth = canvas.width / 2;
                    const canvasHeight = canvas.height / 2;
                    const finalWidth = usableWidth * fillMultiplier;
                    const scale = finalWidth / canvasWidth;
                    
                    renderedSections.push({
                        canvas,
                        width: finalWidth,
                        height: canvasHeight * scale,
                        imgData: canvas.toDataURL('image/png')
                    });
                }
            } else {
                // Fallback: Gesamtes Sheet rendern und in Streifen aufteilen
                this._updateLoadingMessage('Rendere komplettes Sheet...');
                
                const canvas = await html2canvas(sheetElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF',
                    width: targetWidth,
                    height: sheetElement.scrollHeight
                });
                
                // Canvas in Streifen aufteilen die auf Seiten passen
                const canvasWidth = canvas.width / 2;
                const canvasHeight = canvas.height / 2;
                const finalWidth = usableWidth * fillMultiplier;
                const scale = finalWidth / canvasWidth;
                const scaledHeight = canvasHeight * scale;
                
                // Wenn das skalierte Bild höher als eine Seite ist, aufteilen
                if (scaledHeight > usableHeight) {
                    const stripHeight = usableHeight; // mm pro Streifen
                    const stripHeightPx = (stripHeight / scale) * 2; // Pixel im Canvas
                    const numStrips = Math.ceil(canvas.height / stripHeightPx);
                    
                    for (let i = 0; i < numStrips; i++) {
                        const startY = i * stripHeightPx;
                        const currentStripHeight = Math.min(stripHeightPx, canvas.height - startY);
                        
                        // Temporäres Canvas für diesen Streifen
                        const stripCanvas = document.createElement('canvas');
                        stripCanvas.width = canvas.width;
                        stripCanvas.height = currentStripHeight;
                        const ctx = stripCanvas.getContext('2d');
                        
                        ctx.drawImage(canvas, 0, startY, canvas.width, currentStripHeight, 
                                            0, 0, canvas.width, currentStripHeight);
                        
                        renderedSections.push({
                            canvas: stripCanvas,
                            width: finalWidth,
                            height: (currentStripHeight / 2) * scale,
                            imgData: stripCanvas.toDataURL('image/png')
                        });
                    }
                } else {
                    renderedSections.push({
                        canvas,
                        width: finalWidth,
                        height: scaledHeight,
                        imgData: canvas.toDataURL('image/png')
                    });
                }
            }
            
            // ============================================
            // Wiederherstellen
            // ============================================
            this._restoreTextareas(textareaReplacements);
            this._restoreUiElementsForPdf(hiddenUI);
            
            // Ursprüngliche Breiten wiederherstellen
            sheetContainer.style.width = originalContainerWidth;
            sheetContainer.style.minWidth = originalContainerMinWidth;
            sheetContainer.style.maxWidth = originalContainerMaxWidth;
            sheetElement.style.width = originalWidth;
            sheetElement.style.minWidth = originalMinWidth;
            sheetElement.style.maxWidth = originalMaxWidth;
            
            collapsedElements.forEach(({ element, action, origDisplay }) => {
                if (action === 'expand') {
                    element.classList.add('collapsed');
                    if (element.dataset.collapsed !== undefined) {
                        element.dataset.collapsed = 'true';
                    }
                } else if (action === 'hide') {
                    element.style.display = origDisplay || '';
                }
            });
            
            // ============================================
            // Sektionen auf PDF-Seiten verteilen
            // ============================================
            this._updateLoadingMessage('Erstelle PDF-Seiten...');
            
            let currentY = margin;
            let currentPage = 1;
            let sectionsOnCurrentPage = 0;
            
            for (let i = 0; i < renderedSections.length; i++) {
                const section = renderedSections[i];
                
                // Prüfen ob diese Sektion noch auf die aktuelle Seite passt
                const neededHeight = section.height + (sectionsOnCurrentPage > 0 ? sectionGap : 0);
                const remainingHeight = usableHeight - (currentY - margin);
                
                if (sectionsOnCurrentPage > 0 && neededHeight > remainingHeight) {
                    // Neue Seite beginnen
                    pdf.addPage();
                    currentPage++;
                    currentY = margin;
                    sectionsOnCurrentPage = 0;
                }
                
                // Abstand zwischen Sektionen
                if (sectionsOnCurrentPage > 0) {
                    currentY += sectionGap;
                }
                
                // Sektion auf die Seite zeichnen (horizontal zentriert auf der Seite)
                const x = (pdfWidth - section.width) / 2;
                pdf.addImage(section.imgData, 'PNG', x, currentY, section.width, section.height);
                
                currentY += section.height;
                sectionsOnCurrentPage++;
            }
            
            // Metadata hinzufügen
            this._addMetadataToPdf(pdf);
            
            // PDF speichern
            const pokemonName = this.appState.pokemonData.germanName || this.appState.pokemonData.name;
            pdf.save(`Pokemon_${pokemonName}_Lv${this.appState.level}.pdf`);
            
            this._showToast(`Pokemon-PDF mit ${currentPage} Seite(n) gespeichert`, 'success');
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
    _hideUiElementsForPdf(container) {
        const hidden = [];
        
        const hideSelectors = [
            '.drag-handle',
            '.drag-handle-section',
            '.collapse-toggle',
            '.section-collapse-btn',
            '.add-button',
            '.remove-button',
            '.edit-button',
            '.delete-button',
            '.action-buttons',
            '.section-actions',
            '.toggle-btn',
            '.info-toggle',
            '.note-remove-btn',
            '.note-collapse-btn'
        ];
        
        hideSelectors.forEach(selector => {
            container.querySelectorAll(selector).forEach(el => {
                const orig = el.style.display;
                el.style.display = 'none';
                hidden.push({ element: el, originalDisplay: orig });
            });
        });
        
        return hidden;
    }
    
    /**
     * Stellt versteckte UI-Elemente wieder her
     * @param {Array} hidden - Array mit versteckten Elementen
     * @private
     */
    _restoreUiElementsForPdf(hidden) {
        hidden.forEach(({ element, originalDisplay }) => {
            element.style.display = originalDisplay || '';
        });
    }
    
    /**
     * Fügt Metadaten zum PDF hinzu, um es editierbar zu machen
     * @param {jsPDF} pdf - Das PDF-Objekt
     * @private
     */
    _addMetadataToPdf(pdf) {
        // Skill-Display-Modus ermitteln
        const skillDisplayMode = window.skillDisplayModeService?.getMode() || 'individual';
        
        // Skill-Werte je nach Modus berechnen
        const displaySkillValues = {};
        Object.entries(this.appState.skillValues).forEach(([skillName, baseValue]) => {
            if (skillDisplayMode === 'total' && window.skillDisplayModeService) {
                const displayInfo = window.skillDisplayModeService.getDisplayValue(
                    skillName, baseValue, this.appState.skillValues
                );
                displaySkillValues[skillName] = displayInfo.displayValue;
            } else {
                displaySkillValues[skillName] = baseValue;
            }
        });
        
        // Pokemon-Daten als JSON-String in Metadaten speichern
        const metadataString = JSON.stringify({
            version: '1.2',
            appState: {
                pokemonId: this.appState.pokemonData.id,
                pokemonName: this.appState.selectedPokemon,
                level: this.appState.level,
                currentExp: this.appState.currentExp || 0,
                stats: this.appState.stats,
                currentHp: this.appState.currentHp,
                gena: this.appState.gena,
                pa: this.appState.pa,
                bw: this.appState.bw,
                skillValues: this.appState.skillValues,
                displaySkillValues: displaySkillValues,
                skillDisplayMode: skillDisplayMode,
                moves: this.appState.moves.map(move => move ? move.name : null),
                abilities: this.appState.abilities,
                isShiny: this.appState.isShiny || false,
                customHeight: this.appState.customHeight || null,
                customWeight: this.appState.customWeight || null,
                customRideability: this.appState.customRideability || null
            },
            textFields: {
                trainer: document.getElementById('trainer-input')?.value || '',
                nickname: document.getElementById('nickname-input')?.value || '',
                item: document.getElementById('item-input')?.value || ''
            },
            timestamp: new Date().toISOString()
        });
        
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
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    /**
     * Zeigt einen Ladeindikator an
     * @param {string} message - Optionale Nachricht
     * @private
     */
    _showLoadingOverlay(message = 'Erstelle Pokemon-PDF...') {
        if (document.querySelector('.loading-overlay')) {
            this._updateLoadingMessage(message);
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const messageEl = document.createElement('div');
        messageEl.className = 'loading-message';
        messageEl.style.color = 'white';
        messageEl.style.marginTop = '10px';
        messageEl.textContent = message;
        
        overlay.appendChild(spinner);
        overlay.appendChild(messageEl);
        document.body.appendChild(overlay);
    }
    
    /**
     * Aktualisiert die Ladeindikator-Nachricht
     * @param {string} message - Neue Nachricht
     * @private
     */
    _updateLoadingMessage(message) {
        const messageEl = document.querySelector('.loading-overlay .loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    /**
     * Entfernt den Ladeindikator
     * @private
     */
    _hideLoadingOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay && document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
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
            const computedStyle = window.getComputedStyle(textarea);
            
            const div = document.createElement('div');
            div.className = textarea.className + ' textarea-pdf-replacement';
            
            const text = textarea.value || '';
            div.innerHTML = text
                .split('\n')
                .map(line => line || '&nbsp;')
                .join('<br>');
            
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
            
            replacements.push({
                textarea: textarea,
                div: div,
                parent: textarea.parentNode,
                nextSibling: textarea.nextSibling
            });
            
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
            if (div.parentNode) {
                div.parentNode.removeChild(div);
            }
            textarea.style.display = '';
        });
    }
}