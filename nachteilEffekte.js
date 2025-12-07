// nachteilEffekte.js - Spezielle Effekte für bestimmte Nachteile

document.addEventListener('DOMContentLoaded', function() {
    // Warte bis die Trainer-UI gerendert ist
    setTimeout(initNachteilEffekte, 1000);
});

function initNachteilEffekte() {
    // DOM-Elemente referenzieren (mit neuen IDs)
    const disadvantageSelect = document.getElementById('trainer-nachteil');
    const advantageSelect = document.getElementById('trainer-vorteil');
    
    // Falls die Elemente noch nicht existieren, später erneut versuchen
    if (!disadvantageSelect || !advantageSelect) {
        setTimeout(initNachteilEffekte, 500);
        return;
    }
    
    // Speichert die Item-Slots, die bei Auswahl von "Arm" entfernt wurden
    let removedItemSlots = [];
    
    // Event Listener für Nachteil-Änderung
    disadvantageSelect.addEventListener('change', handleDisadvantageChange);
    
    // Initiale Prüfung
    handleDisadvantageChange();
    setupMutualExclusion(); // Gegenseitigen Ausschluss einrichten
    
    // Funktion zur Behandlung der Nachteil-Auswahl-Änderung
    function handleDisadvantageChange() {
        const selectedDisadvantage = disadvantageSelect.value;
        
        // Überprüfe, ob der Nachteil "Arm" ausgewählt wurde
        if (selectedDisadvantage === 'arm') {
            applyArmDisadvantage();
        } else {
            // Wenn "Arm" nicht mehr ausgewählt ist, stelle normale Slots wieder her
            restoreItemSlots();
        }
    }
    
    // Funktion zum Anwenden des Nachteils "Arm"
    function applyArmDisadvantage() {
        const inventoryContainer = document.getElementById('inventory-container');
        
        // Zuerst sichern wir alle zu entfernenden Item-Slots
        removedItemSlots = [];
        
        // Alle Item-Slots finden, außer den klassenspezifischen
        const itemSlots = inventoryContainer.querySelectorAll('.item-slot:not(.special-item-slot):not(.second-class-effect)');
        
        // Slots entfernen und speichern
        itemSlots.forEach(slot => {
            // HTML-Element klonen und speichern, bevor es entfernt wird
            removedItemSlots.push({
                element: slot.cloneNode(true),
                parent: inventoryContainer
            });
            
            // Entferne den Slot aus dem DOM
            if (slot && slot.parentNode) {
                slot.parentNode.removeChild(slot);
            }
        });
        
        // Hinweis-Element hinzufügen, dass keine Items verfügbar sind
        const armInfoElement = document.createElement('div');
        armInfoElement.id = 'arm-disadvantage-info';
        armInfoElement.className = 'arm-disadvantage-effect';
        armInfoElement.style.padding = '15px';
        armInfoElement.style.margin = '10px 0';
        armInfoElement.style.backgroundColor = '#fff0f0';
        armInfoElement.style.border = '2px dashed #ff6b6b';
        armInfoElement.style.borderRadius = '5px';
        armInfoElement.style.textAlign = 'center';
        armInfoElement.style.color = '#d63031';
        armInfoElement.style.fontWeight = 'bold';
        armInfoElement.innerHTML = 'Du besitzt keine regulären Items aufgrund des Nachteils "Arm".<br>Nur klassenspezifische Items sind verfügbar.';
        
        // Füge das Info-Element nach dem letzten verbliebenen Item-Slot ein oder am Anfang des Containers
        const lastSpecialItemSlot = inventoryContainer.querySelector('.special-item-slot, .second-class-effect');
        if (lastSpecialItemSlot) {
            if (lastSpecialItemSlot.nextSibling) {
                inventoryContainer.insertBefore(armInfoElement, lastSpecialItemSlot.nextSibling);
            } else {
                inventoryContainer.appendChild(armInfoElement);
            }
        } else {
            // Wenn keine klassenspezifischen Item-Slots existieren, am Anfang einfügen
            if (inventoryContainer.firstChild) {
                inventoryContainer.insertBefore(armInfoElement, inventoryContainer.firstChild);
            } else {
                inventoryContainer.appendChild(armInfoElement);
            }
        }
    }
    
    // Funktion zum Wiederherstellen der entfernten Item-Slots
    function restoreItemSlots() {
        // Info-Element entfernen, falls vorhanden
        const armInfoElement = document.getElementById('arm-disadvantage-info');
        if (armInfoElement && armInfoElement.parentNode) {
            armInfoElement.parentNode.removeChild(armInfoElement);
        }
        
        // Wenn keine Item-Slots zu wiederherzustellen sind, überprüfe, ob Vorteil "Reich" oder Klasse "Gentleman/Lady" aktiv ist
        if (removedItemSlots.length === 0) {
            checkAndApplyItemSlotExtras();
            return;
        }
        
        // Inventar-Container abrufen
        const inventoryContainer = document.getElementById('inventory-container');
        
        // Alle gespeicherten Item-Slots wiederherstellen
        removedItemSlots.forEach(slotInfo => {
            // Neues Element erstellen basierend auf dem gespeicherten
            const newSlot = slotInfo.element.cloneNode(true);
            
            // Event-Listener wiederherstellen für Select-Elemente
            const selectElement = newSlot.querySelector('select');
            if (selectElement) {
                // Hier würden wir die Logik für die Wiederherstellung der Event-Listener hinzufügen
                // Diese ist spezifisch für Ihre Anwendung - nutzen Sie setupCustomSelect oder ähnlich
                
                // Beispiel (je nachdem, wie Ihre Anwendung funktioniert):
                if (typeof setupCustomSelect === 'function' && window.itemService) {
                    const items = window.itemService.getAllItems();
                    setupCustomSelect(selectElement, items);
                }
            }
            
            // Element zum Container hinzufügen
            inventoryContainer.appendChild(newSlot);
        });
        
        // Array zurücksetzen
        removedItemSlots = [];
        
        // Überprüfen, ob Vorteil "Reich" oder Klasse "Gentleman/Lady" aktiv ist
        checkAndApplyItemSlotExtras();
    }
    
    // Überprüfen, ob Vorteil "Reich" oder Klasse "Gentleman/Lady" aktiv ist und entsprechende Slots hinzufügen
    function checkAndApplyItemSlotExtras() {
        const classSelect = document.getElementById('trainer-klasse');
        const secondClassSelect = document.getElementById('trainer-second-klasse');
        
        // Überprüfe, ob Vorteil "Reich" aktiv ist und rufe die entsprechende Funktion auf
        if (advantageSelect && advantageSelect.value === 'reich') {
            if (typeof checkReichVorteil === 'function') {
                checkReichVorteil();
            }
        }
        
        // Überprüfe, ob Klasse "Gentleman/Lady" aktiv ist und rufe die entsprechende Funktion auf
        if (classSelect && classSelect.value === 'gentleman-lady') {
            if (typeof handleClassChange === 'function') {
                handleClassChange();
            } else if (typeof addAdditionalItemSlots === 'function') {
                addAdditionalItemSlots(3);
            }
        }
        
        // Überprüfe, ob zweite Klasse "Gentleman/Lady" aktiv ist
        if (secondClassSelect && secondClassSelect.value === 'gentleman-lady') {
            if (typeof activateSecondClassEffects === 'function') {
                activateSecondClassEffects('gentleman-lady');
            } else if (typeof addSecondClassAdditionalItems === 'function') {
                addSecondClassAdditionalItems(3);
            }
        }
    }

    // Funktion, um die gegenseitige Ausschließung von 'Reich' und 'Arm' zu handhaben
    function setupMutualExclusion() {
        console.log("Setting up mutual exclusion for Reich/Arm and Nachtsicht/Nachtblindheit");
        
        // Funktion, um Optionen zu deaktivieren/aktivieren
        function updateExclusionState() {
            console.log("Updating exclusion state");
            
            // Überprüfe den aktuellen Status beider Selects für Reich/Arm
            const isReichSelected = advantageSelect.value === 'reich';
            const isArmSelected = disadvantageSelect.value === 'arm';
            
            // Überprüfe den aktuellen Status beider Selects für Nachtsicht/Nachtblindheit
            const isNachtsichtSelected = advantageSelect.value === 'nachtsicht';
            const isNachtblindheitSelected = disadvantageSelect.value === 'nachtblindheit';
            
            console.log("Reich selected:", isReichSelected);
            console.log("Arm selected:", isArmSelected);
            console.log("Nachtsicht selected:", isNachtsichtSelected);
            console.log("Nachtblindheit selected:", isNachtblindheitSelected);
            
            // Finde die entsprechenden Custom-Select-Optionen
            const reichOptions = document.querySelectorAll('.custom-select-option[data-value="reich"]');
            const armOptions = document.querySelectorAll('.custom-select-option[data-value="arm"]');
            const nachtsichtOptions = document.querySelectorAll('.custom-select-option[data-value="nachtsicht"]');
            const nachtblindheitOptions = document.querySelectorAll('.custom-select-option[data-value="nachtblindheit"]');
            
            console.log("Found Reich options:", reichOptions.length);
            console.log("Found Arm options:", armOptions.length);
            console.log("Found Nachtsicht options:", nachtsichtOptions.length);
            console.log("Found Nachtblindheit options:", nachtblindheitOptions.length);
            
            // Deaktiviere/Aktiviere die Reich-Option basierend auf Arm-Auswahl
            reichOptions.forEach(option => {
                if (isArmSelected) {
                    // Arm ist ausgewählt, also deaktiviere Reich
                    option.style.color = '#999';
                    option.style.backgroundColor = '#f5f5f5';
                    option.style.cursor = 'not-allowed';
                    option.dataset.disabled = 'true';
                    console.log("Disabled Reich option");
                } else {
                    // Arm ist nicht ausgewählt, also aktiviere Reich
                    option.style.color = '';
                    option.style.backgroundColor = '';
                    option.style.cursor = 'pointer';
                    option.dataset.disabled = 'false';
                    console.log("Enabled Reich option");
                }
            });
            
            // Deaktiviere/Aktiviere die Arm-Option basierend auf Reich-Auswahl
            armOptions.forEach(option => {
                if (isReichSelected) {
                    // Reich ist ausgewählt, also deaktiviere Arm
                    option.style.color = '#999';
                    option.style.backgroundColor = '#f5f5f5';
                    option.style.cursor = 'not-allowed';
                    option.dataset.disabled = 'true';
                    console.log("Disabled Arm option");
                } else {
                    // Reich ist nicht ausgewählt, also aktiviere Arm
                    option.style.color = '';
                    option.style.backgroundColor = '';
                    option.style.cursor = 'pointer';
                    option.dataset.disabled = 'false';
                    console.log("Enabled Arm option");
                }
            });
            
            // Deaktiviere/Aktiviere die Nachtsicht-Option basierend auf Nachtblindheit-Auswahl
            nachtsichtOptions.forEach(option => {
                if (isNachtblindheitSelected) {
                    // Nachtblindheit ist ausgewählt, also deaktiviere Nachtsicht
                    option.style.color = '#999';
                    option.style.backgroundColor = '#f5f5f5';
                    option.style.cursor = 'not-allowed';
                    option.dataset.disabled = 'true';
                    console.log("Disabled Nachtsicht option");
                } else {
                    // Nachtblindheit ist nicht ausgewählt, also aktiviere Nachtsicht
                    option.style.color = '';
                    option.style.backgroundColor = '';
                    option.style.cursor = 'pointer';
                    option.dataset.disabled = 'false';
                    console.log("Enabled Nachtsicht option");
                }
            });
            
            // Deaktiviere/Aktiviere die Nachtblindheit-Option basierend auf Nachtsicht-Auswahl
            nachtblindheitOptions.forEach(option => {
                if (isNachtsichtSelected) {
                    // Nachtsicht ist ausgewählt, also deaktiviere Nachtblindheit
                    option.style.color = '#999';
                    option.style.backgroundColor = '#f5f5f5';
                    option.style.cursor = 'not-allowed';
                    option.dataset.disabled = 'true';
                    console.log("Disabled Nachtblindheit option");
                } else {
                    // Nachtsicht ist nicht ausgewählt, also aktiviere Nachtblindheit
                    option.style.color = '';
                    option.style.backgroundColor = '';
                    option.style.cursor = 'pointer';
                    option.dataset.disabled = 'false';
                    console.log("Enabled Nachtblindheit option");
                }
            });
        }
        
        // Event-Listener für Änderungen an den Selects
        advantageSelect.addEventListener('change', updateExclusionState);
        disadvantageSelect.addEventListener('change', updateExclusionState);
        
        // Initiale Ausführung
        updateExclusionState();
    }
};