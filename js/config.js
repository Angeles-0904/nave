// =====================================
// config.js - CONFIGURACIONES Y CONSTANTES
// =====================================

// Configuración base del juego
const GAME_CONFIG = {
    TUNNEL_RADIUS: 15,
    TUNNEL_SEGMENTS_COUNT: 25,
    MAX_SPEED: 3.0,
    DAMAGE_MULTIPLIER: 1.0,
    OBSTACLE_SPAWN_RATE: 0.12,
    POWERUP_SPAWN_RATE: 0.008
};

// Configuración dinámica basada en dificultad
const DIFFICULTY_SETTINGS = {
    easy: {
        TUNNEL_RADIUS: 18,
        OBSTACLE_SPAWN_RATE: 0.06,
        POWERUP_SPAWN_RATE: 0.015,
        MAX_SPEED: 2.0,
        DAMAGE_MULTIPLIER: 0.7
    },
    normal: {
        TUNNEL_RADIUS: 15,
        OBSTACLE_SPAWN_RATE: 0.12,
        POWERUP_SPAWN_RATE: 0.008,
        MAX_SPEED: 3.0,
        DAMAGE_MULTIPLIER: 1.0
    },
    hard: {
        TUNNEL_RADIUS: 12,
        OBSTACLE_SPAWN_RATE: 0.18,
        POWERUP_SPAWN_RATE: 0.005,
        MAX_SPEED: 4.0,
        DAMAGE_MULTIPLIER: 1.5
    },
    insane: {
        TUNNEL_RADIUS: 10,
        OBSTACLE_SPAWN_RATE: 0.25,
        POWERUP_SPAWN_RATE: 0.003,
        MAX_SPEED: 5.0,
        DAMAGE_MULTIPLIER: 2.0
    }
};

// Rutas de modelos 3D
const MODEL_PATHS = {
    // Naves
    shipDefault: './models/ship.glb',
    shipFighter: './models/ship_fighter.glb',
    shipCruiser: './models/ship_cruiser.glb',

    // Elementos del juego
    asteroid: './models/asteroide.glb',
    obstacle: './models/meteorite.glb',

    // Power-ups
    powerUpShield: './models/diamanteverde.glb',
    powerUpPoints: './models/diamanteAzul.glb',
    powerUpSpeed: './models/cristal_amarillo.glb',
    powerUpMultiplier: './models/cristal_morado.glb',
    powerUpHealth: './models/cristal_rojo.glb'
};

// Tipos de naves con estadísticas
const SHIP_TYPES = {
    default: {
        name: 'Nave Clásica',
        model: 'shipDefault',
        stats: {
            speed: 1.0,
            health: 100,
            agility: 1.0,
            boost: 100
        },
        scale: 0.5,
        lightColor: 0x00ff00,
        description: 'Nave equilibrada para principiantes'
    },
    fighter: {
        name: 'Caza Estelar',
        model: 'shipFighter',
        stats: {
            speed: 1.3,
            health: 80,
            agility: 1.5,
            boost: 120
        },
        scale: 0.4,
        lightColor: 0x00ccff,
        description: 'Rápida y ágil, pero frágil'
    },
    cruiser: {
        name: 'Crucero Pesado',
        model: 'shipCruiser',
        stats: {
            speed: 0.8,
            health: 150,
            agility: 0.7,
            boost: 80
        },
        scale: 0.6,
        lightColor: 0xff8800,
        description: 'Resistente pero lenta'
    }
};

// Tipos de power-ups con efectos
const POWERUP_TYPES = {
    shield: {
        color: 0x00ff00,
        duration: 5000,
        effect: 'invincible',
        model: 'powerUpShield',
        description: 'Invencibilidad temporal',
        sound: 'powerupShield'
    },
    points: {
        color: 0x0088ff,
        value: 1000,
        effect: 'points',
        model: 'powerUpPoints',
        description: 'Puntos extra',
        sound: 'powerupCollect'
    },
    speed: {
        color: 0xffff00,
        duration: 3000,
        effect: 'speed_boost',
        model: 'powerUpSpeed',
        description: 'Boost de velocidad',
        sound: 'powerupSpeed'
    },
    multiplier: {
        color: 0xff00ff,
        duration: 8000,
        effect: 'score_multiplier',
        model: 'powerUpMultiplier',
        description: 'Multiplicador x2',
        sound: 'powerupCollect'
    },
    health: {
        color: 0xff0000,
        value: 30,
        effect: 'heal',
        model: 'powerUpHealth',
        description: 'Restaura vida',
        sound: 'powerupHealth'
    }
};

// Umbrales de niveles
const LEVEL_THRESHOLDS = [
    0, 5000, 15000, 35000, 65000, 100000,
    150000, 220000, 300000, 400000
];

// Archivos de sonido
const SOUND_FILES = {
    // Música
    backgroundMusic: './sounds/background_music.mp3',
    menuMusic: './sounds/menu_music.mp3',

    // Efectos de sonido
    engine: './sounds/engine.mp3',
    explosion: './sounds/explosion1.mp3',
    powerupCollect: './sounds/powerup_speed.mp3',
    powerupShield: './sounds/powerup_speed.mp3',
    powerupSpeed: './sounds/powerup_speed.mp3',
    powerupHealth: './sounds/powerup_speed.mp3',
    damage: './sounds/damage.mp3',
    levelUp: './sounds/level_up.mp3',
    gameOver: './sounds/game_over.mp3',
    menuClick: './sounds/menu_click.mp3',
    boost: './sounds/boost.mp3',
    combo: './sounds/combo.mp3'
};

// Configuración de usuario (guardada en localStorage)
let userConfig = {
    difficulty: 'normal',
    sensitivity: 0.3,
    graphics: 'medium',
    selectedShip: 'default',
    musicVolume: 0.3,
    sfxVolume: 0.7,
    musicEnabled: true,
    sfxEnabled: true
};

// Función para aplicar configuración de dificultad
function applyDifficultySettings() {
    const settings = DIFFICULTY_SETTINGS[userConfig.difficulty];
    GAME_CONFIG.TUNNEL_RADIUS = settings.TUNNEL_RADIUS;
    GAME_CONFIG.OBSTACLE_SPAWN_RATE = settings.OBSTACLE_SPAWN_RATE;
    GAME_CONFIG.POWERUP_SPAWN_RATE = settings.POWERUP_SPAWN_RATE;
    GAME_CONFIG.MAX_SPEED = settings.MAX_SPEED;
    GAME_CONFIG.DAMAGE_MULTIPLIER = settings.DAMAGE_MULTIPLIER;
}

// Función para cargar configuración guardada
function loadUserConfig() {
    const saved = localStorage.getItem('spaceRunnerConfig');
    if (saved) {
        userConfig = {...userConfig, ...JSON.parse(saved) };
    }
    return userConfig;
}

// Función para guardar configuración
function saveUserConfig() {
    localStorage.setItem('spaceRunnerConfig', JSON.stringify(userConfig));
}