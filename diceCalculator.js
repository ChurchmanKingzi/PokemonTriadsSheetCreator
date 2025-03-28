/**
 * Klasse zur Berechnung und Bestimmung von Würfeltypen
 */
class DiceCalculator {
    // Statischer Cache für bereits berechnete Würfelklassen
    static diceTypeCache = new Map();
    
    /**
     * Bestimmt die Würfelklasse eines Pokémon basierend auf verschiedenen Eigenschaften
     * @param {Object} pokemonData - Die Daten des Pokémon aus der PokéAPI
     * @returns {Object} Die Würfelklasse und zusätzliche Info
     */
    static determineDiceType(pokemonData) {
        // Cacheprüfung - wenn die Pokémon-ID bereits berechnet wurde
        if (pokemonData.id && this.diceTypeCache.has(pokemonData.id)) {
            return this.diceTypeCache.get(pokemonData.id);
        }
        
        // Verfügbare Würfelklassen in aufsteigender Reihenfolge
        const diceClasses = ["1W4", "1W6", "1W8", "1W10", "1W12", "2W6", "2W8", "2W10", "2W12", "2W100"];
        
        // Prüfen ob das Pokémon legendär oder mystisch ist
        if (pokemonData.isLegendary || pokemonData.isMythical) {
            const result = {
                diceType: "2W100",
                tooltipText: "Legendäres/Mystisches Pokémon: 2W100"
            };
            
            // Im Cache speichern
            if (pokemonData.id) {
                this.diceTypeCache.set(pokemonData.id, result);
            }
            
            return result;
        }
        
        // Base Stat Total
        const bst = pokemonData.baseStatTotal;
        
        // Debug-Text für die Tooltip-Anzeige
        let tooltipText = `BST: ${bst}`;
        
        // Grundlegende Würfelklasse basierend auf BST bestimmen
        let diceClassIndex;
        if (bst <= 299) {
            diceClassIndex = 0; // 1W4
            tooltipText += " ➔ 1W4";
        } else if (bst <= 400) {
            diceClassIndex = 1; // 1W6
            tooltipText += " ➔ 1W6";
        } else if (bst <= 450) {
            diceClassIndex = 2; // 1W8
            tooltipText += " ➔ 1W8";
        } else if (bst <= 500) {
            diceClassIndex = 3; // 1W10
            tooltipText += " ➔ 1W10";
        } else if (bst <= 550) {
            diceClassIndex = 4; // 1W12
            tooltipText += " ➔ 1W12";
        } else {
            diceClassIndex = 5; // 2W6
            tooltipText += " ➔ 2W6";
        }
        
        // Grundwert speichern
        const baseDiceClassIndex = diceClassIndex;
        
        // Evolution Stage und andere evolutionsrelevante Parameter
        const evolutionStage = pokemonData.evolutionLevel || 0;
        const remainingEvolutions = pokemonData.remainingEvolutions || 0;
        
        // 1. Prüfen, ob sich das Pokémon nicht entwickeln kann und noch nicht entwickelt hat
        if (evolutionStage === 0 && remainingEvolutions === 0) {
            // Bewegung in Richtung 1W10 (Index 3)
            if (diceClassIndex < 3) {
                diceClassIndex++;
                tooltipText += "\nBasisform, keine Entwicklung ➔ +1 (Richtung 1W10)";
            } else if (diceClassIndex > 3) {
                diceClassIndex--;
                tooltipText += "\nBasisform, keine Entwicklung ➔ -1 (Richtung 1W10)";
            }
        }
        
        // 2. Prüfen, ob sich das Pokémon bereits zweimal entwickelt hat
        if (evolutionStage >= 2) {
            diceClassIndex = Math.min(diceClassIndex + 1, diceClasses.length - 1);
            tooltipText += "\nBereits zweimal entwickelt ➔ +1";
        }
        
        // 3. Evolutionslevel prüfen
        const firstEvolutionLevel = pokemonData.firstEvolutionLevel || 0;
        const secondEvolutionLevel = pokemonData.secondEvolutionLevel || 0;
        
        // 3a. Erste Evolution auf Level 32 oder später
        if (evolutionStage > 0 && firstEvolutionLevel >= 32) {
            diceClassIndex = Math.min(diceClassIndex + 1, diceClasses.length - 1);
            tooltipText += `\nErste Evolution auf Level ${firstEvolutionLevel} (≥32) ➔ +1`;
            
            // 3b. Erste Evolution auf Level 42 oder später (zusätzlich)
            if (firstEvolutionLevel >= 42) {
                diceClassIndex = Math.min(diceClassIndex + 1, diceClasses.length - 1);
                tooltipText += `\nErste Evolution auf Level ${firstEvolutionLevel} (42) ➔ +1`;
            }
        }
        
        // 3c. Eine Evolution auf Level 50 oder später
        if (evolutionStage > 0 && (firstEvolutionLevel >= 50 || secondEvolutionLevel >= 50)) {
            diceClassIndex = Math.min(diceClassIndex + 1, diceClasses.length - 1);
            tooltipText += "\nEntwicklung auf Level ≥50 ➔ +1";
        }
        
        // 4. Wenn das Pokémon entwickelt ist, die Vorentwicklung überprüfen
        if (evolutionStage > 0 && pokemonData.speciesData && pokemonData.speciesData.pre_evolution_data) {
            const preEvoData = pokemonData.speciesData.pre_evolution_data;
            const preEvoSpeciesData = pokemonData.speciesData.pre_evolution_species_data;
            
            if (preEvoData && preEvoSpeciesData) {
                // Erstelle die pokemonData-Struktur für die Vorentwicklung
                const preEvoBST = preEvoData.stats.reduce((total, stat) => total + stat.base_stat, 0);
                
                const preEvoPokemonData = {
                    id: preEvoData.id,
                    name: preEvoData.name,
                    baseStatTotal: preEvoBST,
                    isLegendary: preEvoSpeciesData.is_legendary,
                    isMythical: preEvoSpeciesData.is_mythical,
                    evolutionLevel: preEvoSpeciesData.evolution_stage || 0,
                    remainingEvolutions: preEvoSpeciesData.remaining_evolutions || 0,
                    firstEvolutionLevel: preEvoSpeciesData.first_evolution_level || 0,
                    secondEvolutionLevel: preEvoSpeciesData.second_evolution_level || 0,
                    // Keine tiefere Rekursion - wir betrachten nur die direkte Vorentwicklung
                    speciesData: { pre_evolution_data: null, pre_evolution_species_data: null }
                };
                
                // Die Würfelklasse der Vorentwicklung berechnen
                // Durch die geänderte speciesData vermeiden wir unendliche Rekursion
                const preEvoDiceResult = this.determineDiceType(preEvoPokemonData);
                const preEvoDiceClassIndex = diceClasses.indexOf(preEvoDiceResult.diceType);
                
                tooltipText += `\nVorentwicklung ${preEvoData.name} hat Würfelklasse: ${preEvoDiceResult.diceType}`;
                
                // Wenn die aktuelle Würfelklasse nicht größer ist als die der Vorentwicklung
                if (diceClassIndex <= preEvoDiceClassIndex) {
                    diceClassIndex = Math.min(diceClassIndex + 1, diceClasses.length - 1);
                    tooltipText += "\nNicht besser als Vorentwicklung ➔ +1";
                }
            }
        }
        
        // Ergebnis zusammenstellen
        const result = {
            diceType: diceClasses[diceClassIndex],
            tooltipText: tooltipText
        };
        
        // Im Cache speichern
        if (pokemonData.id) {
            this.diceTypeCache.set(pokemonData.id, result);
        }
        
        return result;
    }
    
    /**
     * Löscht den Cache, um die Würfelklassen neu zu berechnen
     */
    static clearCache() {
        this.diceTypeCache.clear();
    }
}