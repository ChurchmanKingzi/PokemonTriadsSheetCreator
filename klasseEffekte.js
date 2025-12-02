// klasseEffekte.js - Spezielle Effekte für bestimmte Klassen

document.addEventListener('DOMContentLoaded', function() {
    // Warte bis die Trainer-UI gerendert ist
    setTimeout(initKlasseEffekte, 1000);
});

function initKlasseEffekte() {
    // DOM-Elemente referenzieren (mit neuen IDs)
    const classSelect = document.getElementById('trainer-klasse');
    const inventoryContainer = document.getElementById('inventory-container');
    const container = document.querySelector('.container');
    
    // Falls die Elemente noch nicht existieren, später erneut versuchen
    if (!classSelect) {
        setTimeout(initKlasseEffekte, 500);
        return;
    }
    
    // Spezielle Items für Klassen
    const SPECIAL_ITEMS = {
        angler: {
            name: "Angel",
            beschreibung: "Damit kann man angeln!",
            anzahl: 1
        },
        biker: {
            name: "Klapp-Fahrrad",
            beschreibung: "Ein sehr leichtes, kompaktes Fahrrad. Sehr stabil. Schafft maximal 50km/h.",
            anzahl: 1
        },
        // Neue Items hinzugefügt
        hexe: {
            name: "Kristallkugel",
            beschreibung: "Wenn du dir deine Umgebung durch die Kristallkugel hindurch anschaust, kannst du sie in der Vergangenheit sehen. Beispiel: Du kommst an eine eingestürzte Brücke. Durch den Blick in die Kristallkugel kannst du den Moment sehen, in dem sie eingestürzt ist, findest also das Warum heraus. Du kannst nicht kontrollieren, wann du die Dinge in der Kugel siehst, aber die Kugel zeigt dir immer wichtige Momente, sofern es sie gibt. Durch die Kugel zu sehen erschöpft sich sehr und erfordert große Konzentration! Andere können die Kugel nicht benutzen.",
            anzahl: 1
        },
        kuenstler: {
            name: "Leinwand und Farben",
            beschreibung: "Kann benutzt werden, um eine Attacke zu bannen.",
            anzahl: 1
        },
        ninjajunge: {
            name: "5 Rauchbomben",
            beschreibung: "Rauchbomben, die auf den ersten Blick aussehen wie Pokebälle. Wenn sie (nach einem Wurf) auf dem Boden aufschlagen, platzen sie auf und entlassen dicken, lilanen Qualm, der es unmöglich macht, in den Qualm oder aus dem Qualm zu sehen. Der Qualm verzieht sich nach etwa einer Minute. GENA-Proben in, aus oder durch den Qualm haben ihre Schwierigkeit um 4 erhöht.",
            anzahl: 5
        }
    };
    
    // Fertigkeitsboni für Klassen
    const FERTIGKEITS_BONI = {
        angler: [
            { fertigkeit: "Angeln", bonus: 1 }
        ],
        forscher: [
            { fertigkeit: "Gefahreninstinkt", bonus: 1 },
            { fertigkeit: "Naturwissenschaften", bonus: 1 },
            { fertigkeit: "Orientierung", bonus: 1 },
            { fertigkeit: "Wildnisleben/Survival", bonus: 1 }
        ],
        schwimmer: [
            { fertigkeit: "Schwimmen", bonus: 2 }
        ],
        schoenheit: [
            { fertigkeit: "Betören", bonus: 1 }
        ]
    };
    
    // Attacken-Texte für Klassen mit HTML-Formatierung
    const ATTACKEN_TEXTE = {
        feuerspucker: "<strong style='color: #FF4500;'>Flammenwurf</strong>. <span style='color: #FF4500;'>Typ Feuer</span>. Schaden: 9W6.<br>Bei 3 oder mehr Erfolgen wird das Ziel verbrannt. Diese Attacke kann nur einmal alle zwei Runden eingesetzt werden.",
        schwarzgurt: "<strong style='color: #A0522D;'>Karateschlag</strong>. <span style='color: #A0522D;'>Typ Kampf</span>. Schaden: 5W6.<br>Erzielt bei 2 oder mehr Erfolgen einen kritischen Treffer.<br><br><strong style='color: #A0522D;'>Scanner</strong>. <span style='color: #A0522D;'>Typ Kampf</span>, kein Schaden.<br>Du weichst der nächsten physischen Attacke, die dich innerhalb der nächsten 2 Runden treffen würde und die du sehen kannst, automatisch aus.<br><br><strong style='color: #A0522D;'>Überwurf</strong>. <span style='color: #A0522D;'>Typ Kampf</span>, 7W6 Schaden.<br>Das Ziel ist in der nächsten Runde als letztes (nach den Trainern) dran. Funktioniert nur gegen Ziele, die du heben kannst!"
    };
    
    // Referenzen auf speziell erstellte Elemente
    let specialItemSlot = null;
    let attackenSection = null;
    let additionalItemSlots = []; // Array zum Speichern zusätzlicher Item-Slots
    
    // Event Listener für Klassen-Änderung
    classSelect.addEventListener('change', handleClassChange);
    
    // Initiale Prüfung
    handleClassChange();
    
    // Funktion zur Behandlung der Klassenauswahl-Änderung
    function handleClassChange() {
        const selectedClass = classSelect.value;
        
        // Bereinige vorherige spezielle Elemente
        removeSpecialElements();
        
        // Entferne vorherige Fertigkeitsboni
        removeFertigkeitsBoni();
        
        // Entferne zusätzliche Item-Slots
        removeAdditionalItemSlots();
        
        // Füge klassenspezifische Elemente hinzu
        switch(selectedClass) {
            case 'angler':
                addSpecialItemSlot('angler');
                applyFertigkeitsBoni('angler');
                break;
            case 'biker':
                addSpecialItemSlot('biker');
                break;
            case 'feuerspucker':
                addAttackenSection('feuerspucker');
                break;
            case 'schwarzgurt':
                addAttackenSection('schwarzgurt');
                break;
            case 'forscher':
                applyFertigkeitsBoni('forscher');
                break;
            case 'schwimmer':
                applyFertigkeitsBoni('schwimmer');
                break;
            case 'schoenheit':
                applyFertigkeitsBoni('schoenheit');
                break;
            // Neue Klassen-Effekte hinzugefügt
            case 'gentleman-lady':
                addAdditionalItemSlots(3);
                break;
            case 'hexe':
                addSpecialItemSlot('hexe');
                break;
            case 'kuenstler':
                addSpecialItemSlot('kuenstler');
                break;
            case 'ninjajunge':
                addSpecialItemSlot('ninjajunge');
                break;
        }
    }
    
    // Funktion zum Entfernen aller speziellen Elemente
    function removeSpecialElements() {
        // Spezial-Item-Slot entfernen
        if (specialItemSlot && specialItemSlot.parentNode) {
            specialItemSlot.parentNode.removeChild(specialItemSlot);
            specialItemSlot = null;
        }
        
        // Attacken-Sektion entfernen
        if (attackenSection && attackenSection.parentNode) {
            attackenSection.parentNode.removeChild(attackenSection);
            attackenSection = null;
        }
    }
    
    // Funktion zum Entfernen aller Fertigkeitsboni
    function removeFertigkeitsBoni() {
        // Alle Bonus-Anzeigen entfernen
        document.querySelectorAll('.fertigkeit-bonus').forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }

    // Funktion zum Entfernen zusätzlicher Item-Slots
    function removeAdditionalItemSlots() {
        // Alle zusätzlichen Item-Slots entfernen
        additionalItemSlots.forEach(slot => {
            if (slot && slot.parentNode) {
                slot.parentNode.removeChild(slot);
            }
        });
        // Array zurücksetzen
        additionalItemSlots = [];
    }

    // Funktion zum Hinzufügen zusätzlicher Item-Slots (für Gentleman/Lady)
    function addAdditionalItemSlots(count) {
        // Lade die Items aus dem Item-Service
        const items = itemService.getAllItems();
        
        // Erstelle die angegebene Anzahl an zusätzlichen Item-Slots
        for (let i = 0; i < count; i++) {
            const slotContainer = document.createElement('div');
            slotContainer.className = 'item-slot additional-item-slot';
            slotContainer.style.backgroundColor = '#f5f5ff'; // Leicht anderer Hintergrund zur Kennzeichnung
            slotContainer.style.border = '2px dashed #4169E1'; // Königsblau als Rahmenfarbe
            slotContainer.style.position = 'relative';
            
            // Select-Container (für das benutzerdefinierte Dropdown)
            const selectContainer = document.createElement('div');
            selectContainer.className = 'custom-select-container';
            
            // Erstelle das select-Element
            const selectElement = document.createElement('select');
            selectElement.className = 'item-select';
            selectElement.id = `additional-item-select-${i}`;
            
            // Platzhalter-Option hinzufügen
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = '-- Item auswählen --';
            selectElement.appendChild(placeholderOption);
            
            // Füge alle Items als Optionen hinzu
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name;
                option.dataset.beschreibung = item.beschreibung;
                option.dataset.anzahl = item.anzahl;
                selectElement.appendChild(option);
            });
            
            // Beschreibung und Anzahl Container
            const descriptionContainer = document.createElement('div');
            descriptionContainer.className = 'item-description-container';
            
            const descriptionLabel = document.createElement('label');
            descriptionLabel.textContent = 'Beschreibung:';
            descriptionLabel.htmlFor = `additional-item-description-${i}`;
            
            const descriptionInput = document.createElement('textarea');
            descriptionInput.className = 'item-description';
            descriptionInput.id = `additional-item-description-${i}`;
            descriptionInput.readOnly = true;
            descriptionInput.rows = 2;
            
            const amountContainer = document.createElement('div');
            amountContainer.className = 'item-amount-container';
            
            const amountLabel = document.createElement('label');
            amountLabel.textContent = 'Anzahl:';
            amountLabel.htmlFor = `additional-item-amount-${i}`;
            
            const amountInput = document.createElement('input');
            amountInput.type = 'number';
            amountInput.className = 'item-amount';
            amountInput.id = `additional-item-amount-${i}`;
            amountInput.readOnly = true;
            
            // Hinweis-Label erstellen
            const infoLabel = document.createElement('div');
            infoLabel.style.position = 'absolute';
            infoLabel.style.top = '5px';
            infoLabel.style.right = '10px';
            infoLabel.style.fontSize = '12px';
            infoLabel.style.color = '#666';
            infoLabel.style.fontStyle = 'italic';
            infoLabel.textContent = '(Zusätzlicher Slot durch Klasse)';
            
            // Event-Listener für das Select-Element
            selectElement.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                
                if (this.value === '') {
                    // Nichts ausgewählt
                    descriptionInput.value = '';
                    amountInput.value = '';
                } else {
                    // Item ausgewählt, Beschreibung und Anzahl setzen
                    descriptionInput.value = selectedOption.dataset.beschreibung;
                    amountInput.value = selectedOption.dataset.anzahl;
                }
            });
            
            // DOM-Struktur zusammensetzen
            selectContainer.appendChild(selectElement);
            
            descriptionContainer.appendChild(descriptionLabel);
            descriptionContainer.appendChild(descriptionInput);
            
            amountContainer.appendChild(amountLabel);
            amountContainer.appendChild(amountInput);
            
            slotContainer.appendChild(selectContainer);
            slotContainer.appendChild(descriptionContainer);
            slotContainer.appendChild(amountContainer);
            slotContainer.appendChild(infoLabel);
            
            // Slot zum Inventar-Container hinzufügen (am Ende)
            inventoryContainer.appendChild(slotContainer);
            
            // Slot im Array speichern
            additionalItemSlots.push(slotContainer);
            
            // Setup mit benutzerdefinierten Select-Dropdown
            setupCustomSelect(selectElement, items);
        }
    }
    
    // Funktion zum Anwenden von Fertigkeitsboni für eine Klasse
    function applyFertigkeitsBoni(classId) {
        // Überprüfen, ob Boni für diese Klasse definiert sind
        if (!FERTIGKEITS_BONI[classId]) return;
        
        // Für jeden definierten Bonus
        FERTIGKEITS_BONI[classId].forEach(boni => {
            // Wir müssen eine spezielle Suche implementieren, da :contains nicht nativ unterstützt wird
            const attributeItems = document.querySelectorAll('.attribute-item');
            
            // Manuell filtern, welche davon den Fertigkeitsnamen enthalten
            Array.from(attributeItems).forEach(element => {
                // Überprüfen, ob das Element den Text der gesuchten Fertigkeit enthält
                const elementText = element.textContent.trim();
                if (elementText.includes(boni.fertigkeit)) {
                    // Erstelle Bonus-Element
                    const bonusElement = document.createElement('span');
                    bonusElement.className = 'fertigkeit-bonus';
                    bonusElement.textContent = ` +${boni.bonus} E`;
                    bonusElement.style.color = '#006400'; // Dunkelgrün
                    bonusElement.style.fontWeight = 'bold';
                    
                    // Füge Bonus-Element nach dem Input-Element ein
                    const inputElement = element.querySelector('input');
                    if (inputElement) {
                        // Füge nach dem Input-Element ein
                        if (inputElement.nextSibling) {
                            element.insertBefore(bonusElement, inputElement.nextSibling);
                        } else {
                            element.appendChild(bonusElement);
                        }
                    }
                }
            });
        });
    }
    
    // Funktion zum Hinzufügen eines speziellen Item-Slots
    function addSpecialItemSlot(classId) {
        if (!SPECIAL_ITEMS[classId]) return;
        
        const item = SPECIAL_ITEMS[classId];
        
        // Slot Container erstellen
        specialItemSlot = document.createElement('div');
        specialItemSlot.className = 'item-slot special-item-slot';
        specialItemSlot.style.backgroundColor = '#f0f8ff'; // Leicht blauer Hintergrund zur Kennzeichnung
        specialItemSlot.style.border = '2px dashed #4CAF50';
        specialItemSlot.style.position = 'relative';
        
        // Item-Name Container
        const nameContainer = document.createElement('div');
        nameContainer.className = 'item-name-container';
        
        const nameLabel = document.createElement('div');
        nameLabel.textContent = 'Klassenspezifisches Item:';
        nameLabel.style.fontWeight = 'bold';
        nameLabel.style.color = '#4CAF50';
        
        const nameValue = document.createElement('div');
        nameValue.textContent = item.name;
        nameValue.style.fontSize = '16px';
        nameValue.style.padding = '8px';
        nameValue.style.backgroundColor = '#e8f5e9';
        nameValue.style.borderRadius = '4px';
        nameValue.style.marginTop = '5px';
        
        // Beschreibung Container
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'item-description-container';
        
        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Beschreibung:';
        
        const descriptionInput = document.createElement('textarea');
        descriptionInput.className = 'item-description';
        descriptionInput.readOnly = true;
        descriptionInput.value = item.beschreibung;
        descriptionInput.rows = 2;
        
        // Anzahl Container
        const amountContainer = document.createElement('div');
        amountContainer.className = 'item-amount-container';
        
        const amountLabel = document.createElement('label');
        amountLabel.textContent = 'Anzahl:';
        
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'item-amount';
        amountInput.readOnly = true;
        amountInput.value = item.anzahl;
        
        // Hinweis-Label erstellen
        const infoLabel = document.createElement('div');
        infoLabel.style.position = 'absolute';
        infoLabel.style.top = '5px';
        infoLabel.style.right = '10px';
        infoLabel.style.fontSize = '12px';
        infoLabel.style.color = '#666';
        infoLabel.style.fontStyle = 'italic';
        infoLabel.textContent = '(Automatisch durch Klasse)';
        
        // DOM-Struktur zusammensetzen
        nameContainer.appendChild(nameLabel);
        nameContainer.appendChild(nameValue);
        
        descriptionContainer.appendChild(descriptionLabel);
        descriptionContainer.appendChild(descriptionInput);
        
        amountContainer.appendChild(amountLabel);
        amountContainer.appendChild(amountInput);
        
        specialItemSlot.appendChild(nameContainer);
        specialItemSlot.appendChild(descriptionContainer);
        specialItemSlot.appendChild(amountContainer);
        specialItemSlot.appendChild(infoLabel);
        
        // Slot an den Anfang des Inventar-Containers hinzufügen
        if (inventoryContainer && inventoryContainer.firstChild) {
            inventoryContainer.insertBefore(specialItemSlot, inventoryContainer.firstChild);
        } else if (inventoryContainer) {
            inventoryContainer.appendChild(specialItemSlot);
        }
    }
    
    // Funktion zum Hinzufügen der Attacken-Sektion - KORRIGIERT
    function addAttackenSection(classId) {
        if (!ATTACKEN_TEXTE[classId]) return;
        
        // Neuen Abschnitt für Attacken erstellen
        attackenSection = document.createElement('div');
        attackenSection.className = 'attacken-section';
        attackenSection.style.marginTop = '30px';
        attackenSection.style.borderTop = '1px solid #eee';
        attackenSection.style.paddingTop = '20px';
        
        // Überschrift erstellen
        const heading = document.createElement('h2');
        heading.textContent = 'Trainer-Attacken';
        heading.style.textAlign = 'center';
        heading.style.marginBottom = '20px';
        heading.style.color = '#333';
        
        // Container für die Attacken erstellen
        const attackenContainer = document.createElement('div');
        attackenContainer.style.backgroundColor = '#f5f5f5';
        attackenContainer.style.border = '2px solid #ddd';
        attackenContainer.style.borderRadius = '8px';
        attackenContainer.style.padding = '15px';
        attackenContainer.style.maxWidth = '900px';
        attackenContainer.style.margin = '0 auto';
        attackenContainer.style.position = 'relative';
        
        // Anstatt einer Textarea verwenden wir jetzt ein div für HTML-Unterstützung
        const attackenDiv = document.createElement('div');
        attackenDiv.className = 'attacken-text';
        attackenDiv.innerHTML = ATTACKEN_TEXTE[classId];
        attackenDiv.style.width = '100%';
        attackenDiv.style.minHeight = '150px';
        attackenDiv.style.padding = '10px';
        attackenDiv.style.fontSize = '14px';
        attackenDiv.style.border = '1px solid #ccc';
        attackenDiv.style.borderRadius = '4px';
        attackenDiv.style.backgroundColor = '#fff';
        attackenDiv.style.overflowY = 'auto';
        attackenDiv.style.lineHeight = '1.5';
        
        // Hinweis-Label erstellen
        const infoLabel = document.createElement('div');
        infoLabel.style.position = 'absolute';
        infoLabel.style.top = '10px';
        infoLabel.style.right = '15px';
        infoLabel.style.fontSize = '12px';
        infoLabel.style.color = '#666';
        infoLabel.style.fontStyle = 'italic';
        infoLabel.textContent = '(Automatisch durch Klasse)';
        
        // DOM-Struktur zusammensetzen
        attackenContainer.appendChild(attackenDiv);
        attackenContainer.appendChild(infoLabel);
        
        attackenSection.appendChild(heading);
        attackenSection.appendChild(attackenContainer);
        
        try {
            // Überschriebene Logik: Positioniere die Attacken-Sektion vor der Fußzeile
            const footer = document.querySelector('.footer');
            if (footer) {
                container.insertBefore(attackenSection, footer);
                return;
            }
            
            // Fallback 1: Nach der Attribut-Sektion
            const attributesSection = document.querySelector('.attributes-section');
            if (attributesSection) {
                // Element nach der Attributsektion suchen
                let nextElement = attributesSection.nextElementSibling;
                
                // Wenn ein nächstes Element existiert, füge die Attackensektion davor ein
                if (nextElement) {
                    container.insertBefore(attackenSection, nextElement);
                } 
                // Sonst füge es am Ende der Attributsektion ein
                else {
                    container.appendChild(attackenSection);
                }
                return;
            }
            
            // Fallback 2: Vor der Inventar-Sektion
            const inventorySection = document.querySelector('.inventory-section');
            if (inventorySection) {
                container.insertBefore(attackenSection, inventorySection);
                return;
            }
            
            // Fallback 3: Am Ende des Containers
            container.appendChild(attackenSection);
            
        } catch (error) {
            console.error('Fehler beim Einfügen der Attacken-Sektion:', error);
            
            // Fallback: Direkt an den Container anhängen, wenn etwas schief geht
            container.appendChild(attackenSection);
        }
    }

    // Hilfsfunktion für benutzerdefinierte Select-Elemente mit Tooltips (für zusätzliche Item-Slots)
    function setupCustomSelect(selectElement, items) {
        // Container für das benutzerdefinierte Dropdown erstellen
        const selectContainer = document.createElement('div');
        selectContainer.className = 'custom-select-container';
        selectContainer.style.position = 'relative';
        selectContainer.style.width = '100%';
        
        // Verstecke das originale Select-Element, behalte es aber für die Funktionalität
        selectElement.style.display = 'none';
        selectElement.parentNode.insertBefore(selectContainer, selectElement);
        selectContainer.appendChild(selectElement);
        
        // Erstelle den sichtbaren Select-Button
        const selectButton = document.createElement('div');
        selectButton.className = 'custom-select-button';
        selectButton.innerHTML = selectElement.options[0].text;
        selectContainer.appendChild(selectButton);
        
        // Erstelle die Dropdown-Liste
        const dropdownList = document.createElement('div');
        dropdownList.className = 'custom-select-dropdown';
        dropdownList.style.display = 'none';
        selectContainer.appendChild(dropdownList);
        
        // Erstelle Tooltip-Element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-text';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        
        // Füge die Optionen zur Dropdown-Liste hinzu
        const options = Array.from(selectElement.options).slice(1); // Überspringe den Platzhalter
        options.forEach((option, index) => {
            const item = items[index];
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-select-option';
            optionElement.textContent = item.name;
            optionElement.dataset.value = item.id;
            optionElement.dataset.beschreibung = item.beschreibung;
            optionElement.dataset.anzahl = item.anzahl;
            
            // Hover-Effekt für Optionen
            optionElement.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
                
                // Tooltip anzeigen
                tooltip.textContent = `${this.dataset.beschreibung} (Anzahl: ${this.dataset.anzahl})`;
                tooltip.style.display = 'block';
                
                // Position des Tooltips aktualisieren
                const updateTooltipPosition = function(e) {
                    tooltip.style.position = 'fixed';
                    tooltip.style.top = (e.clientY + 10) + 'px';
                    tooltip.style.left = (e.clientX + 15) + 'px';
                };
                
                updateTooltipPosition(window.event);
                document.addEventListener('mousemove', updateTooltipPosition);
                
                // Event-Listener für mousemove speichern, um ihn später zu entfernen
                this.updateTooltipPosition = updateTooltipPosition;
            });
            
            optionElement.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
                tooltip.style.display = 'none';
                
                // Event-Listener entfernen
                if (this.updateTooltipPosition) {
                    document.removeEventListener('mousemove', this.updateTooltipPosition);
                }
            });
            
            // Klick-Event für Optionen
            optionElement.addEventListener('click', function() {
                selectElement.value = this.dataset.value;
                selectButton.innerHTML = this.textContent;
                dropdownList.style.display = 'none';
                
                // Aktualisiere Beschreibung und Anzahl
                const id = selectElement.id;
                const type = id.includes('additional') ? 'additional' : 'item';
                const index = parseInt(id.split('-').pop());
                
                const descriptionInput = document.getElementById(`${type}-description-${index}`);
                const amountInput = document.getElementById(`${type}-amount-${index}`);
                
                if (descriptionInput && amountInput) {
                    descriptionInput.value = this.dataset.beschreibung;
                    amountInput.value = this.dataset.anzahl;
                }
                
                // Manuelles Auslösen des change-Events für das Original-Select
                const event = new Event('change', { bubbles: true });
                selectElement.dispatchEvent(event);
            });
            
            dropdownList.appendChild(optionElement);
        });
        
        // Leere Option hinzufügen
        const emptyOption = document.createElement('div');
        emptyOption.className = 'custom-select-option';
        emptyOption.textContent = '-- Item auswählen --';
        emptyOption.dataset.value = '';
        
        emptyOption.addEventListener('click', function() {
            selectElement.value = '';
            selectButton.innerHTML = this.textContent;
            dropdownList.style.display = 'none';
            
            // Aktualisiere Beschreibung und Anzahl (leeren)
            const id = selectElement.id;
            const type = id.includes('additional') ? 'additional' : 'item';
            const index = parseInt(id.split('-').pop());
            
            const descriptionInput = document.getElementById(`${type}-description-${index}`);
            const amountInput = document.getElementById(`${type}-amount-${index}`);
            
            if (descriptionInput && amountInput) {
                descriptionInput.value = '';
                amountInput.value = '';
            }
            
            // Manuelles Auslösen des change-Events für das Original-Select
            const event = new Event('change', { bubbles: true });
            selectElement.dispatchEvent(event);
        });
        
        // Leere Option am Anfang einfügen
        dropdownList.insertBefore(emptyOption, dropdownList.firstChild);
        
        // Dropdown öffnen/schließen
        selectButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = dropdownList.style.display === 'block';
            // Alle anderen Dropdowns schließen
            document.querySelectorAll('.custom-select-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
            
            if (!isOpen) {
                dropdownList.style.display = 'block';
            }
        });
        
        // Schließen bei Klick außerhalb
        document.addEventListener('click', function() {
            dropdownList.style.display = 'none';
        });
    }
});