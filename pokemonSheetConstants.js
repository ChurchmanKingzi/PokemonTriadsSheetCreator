/**
 * Konstanten für die Pokemon Sheet Creator App mit deutschen Übersetzungen
 */

// API Endpunkte
const API = {
    BASE_URL: 'https://pokeapi.co/api/v2',
    POKEMON_LIST: 'https://pokeapi.co/api/v2/pokemon?limit=1025',
    POKEMON_DETAILS_BY_ID: (id) => `https://pokeapi.co/api/v2/pokemon/${id}`,
    POKEMON_SPECIES_BY_ID: (id) => `https://pokeapi.co/api/v2/pokemon-species/${id}`
};

// Pokemon-Typen Farben (englische Namen als Schlüssel, für API-Kompatibilität)
const TYPE_COLORS = {
    normal: '#A8A878',   // Normal
    fire: '#F08030',     // Feuer
    water: '#6890F0',    // Wasser
    electric: '#F8D030', // Elektro
    grass: '#78C850',    // Pflanze
    ice: '#98D8D8',      // Eis
    fighting: '#C03028', // Kampf
    poison: '#A040A0',   // Gift
    ground: '#E0C068',   // Boden
    flying: '#A890F0',   // Flug
    psychic: '#F85888',  // Psycho
    bug: '#A8B820',      // Käfer
    rock: '#B8A038',     // Gestein
    ghost: '#705898',    // Geist
    dragon: '#7038F8',   // Drache
    dark: '#705848',     // Unlicht
    steel: '#B8B8D0',    // Stahl
    fairy: '#EE99AC'     // Fee
};

// Deutsche Typ-Namen Mapping
const TYPE_NAMES_DE = {
    normal: 'Normal',
    fire: 'Feuer',
    water: 'Wasser',
    electric: 'Elektro',
    grass: 'Pflanze',
    ice: 'Eis',
    fighting: 'Kampf',
    poison: 'Gift',
    ground: 'Boden',
    flying: 'Flug',
    psychic: 'Psycho',
    bug: 'Käfer',
    rock: 'Gestein',
    ghost: 'Geist',
    dragon: 'Drache',
    dark: 'Unlicht',
    steel: 'Stahl',
    fairy: 'Fee'
};

// Struktur der Fähigkeiten
const SKILL_GROUPS = {
    KÖ: ['Akrobatik', 'Ausweichen', 'Klettern', 'Reiten', 'Schleichen/Verstecken', 'Schließtechnik', 'Sinnesschärfe', 'Springen', 'Schwimmen', 'Stehlen', 'Werfen', 'Widerstand'],
    WI: ['Gefahreninstinkt', 'Orientierung', 'Umgang mit Pokemon', 'Wildnisleben/Survival', 'Wissen über Pokemon'],
    CH: ['Anführen', 'Beruhigen', 'Einschüchtern', 'Menschenkenntnis', 'Schauspielern'],
    GL: ['Spielen', 'Suchen']
};

// DOM-Element-IDs
const DOM_IDS = {
    POKEMON_SELECT: 'pokemon-select',
    SHEET_CONTAINER: 'pokemon-sheet-container'
};

// Default-Werte
const DEFAULT_VALUES = {
    SKILL_VALUE: 0,
    MOVE_SLOTS: 4,
    GENA_PA_DEFAULT: 5,
    MIN_LEVEL: 1,
    MAX_LEVEL: 100,
    MIN_STAT: 1,
    MAX_STAT: 99999,
    MIN_GENA_PA: 1,
    MAX_GENA_PA: 100
};

// Spiel-Version für Attacken
const GAME_VERSION = 'sword-shield';

// Würfelklassen
const DICE_CLASSES = [
    '1W4',
    '1W6',
    '1W8',
    '1W10',
    '1W12',
    '2W6',
    '2W8',
    '2W10',
    '2W12',
    '2W100'
];

// BST-Grenzen für Würfelklassen
const DICE_BST_THRESHOLDS = [
    { max: 299, dice: '1W4' },
    { max: 400, dice: '1W6' },
    { max: 450, dice: '1W8' },
    { max: 500, dice: '1W10' },
    { max: 550, dice: '1W12' },
    { max: Infinity, dice: '2W6' }
];

// Würfelklassen-Rangfolge
const DICE_CLASS_ORDER = {
    '1W4': 0,
    '1W6': 1,
    '1W8': 2,
    '1W10': 3,
    '1W12': 4,
    '2W6': 5,
    '2W8': 6,
    '2W10': 7,
    '2W12': 8,
    '2W100': 9
};