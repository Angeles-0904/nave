// =====================================
// audioManager.js - SISTEMA DE AUDIO
// =====================================

class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicVolume = 0.3;
        this.sfxVolume = 0.7;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.currentMusic = null;
        this.initialized = false;

        this.loadSounds();
    }

    loadSounds() {
        Object.entries(SOUND_FILES).forEach(([key, url]) => {
            this.sounds[key] = new Audio(url);

            // Configurar propiedades del audio
            if (key.includes('Music')) {
                this.sounds[key].volume = this.musicVolume;
                this.sounds[key].loop = true;
            } else {
                this.sounds[key].volume = this.sfxVolume;
            }

            // Precargar audio
            this.sounds[key].preload = 'auto';

            // Manejar errores de carga
            this.sounds[key].addEventListener('error', () => {
                console.warn(`⚠️ No se pudo cargar el sonido: ${url}`);
            });

            // Marcar como listo cuando carga
            this.sounds[key].addEventListener('canplaythrough', () => {
                console.log(`🔊 Audio listo: ${key}`);
            });
        });

        this.initialized = true;
    }

    playSound(soundName, volume = null) {
        if (!this.initialized || !this.sounds[soundName]) {
            console.warn(`🔇 Sonido no encontrado: ${soundName}`);
            return;
        }

        const isMusic = soundName.includes('Music');

        // Verificar si el tipo de audio está habilitado
        if ((isMusic && !this.musicEnabled) || (!isMusic && !this.sfxEnabled)) {
            return;
        }

        const sound = this.sounds[soundName];

        // Configurar volumen si se especifica
        if (volume !== null) {
            sound.volume = volume;
        }

        // Resetear y reproducir
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.warn(`❌ Error reproduciendo ${soundName}:`, error.message);
        });
    }

    playMusic(musicName) {
        if (!this.musicEnabled) return;

        // Detener música actual
        if (this.currentMusic) {
            this.stopMusic();
        }

        // Reproducir nueva música
        this.currentMusic = this.sounds[musicName];
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
            this.currentMusic.play().catch(error => {
                console.warn(`❌ Error reproduciendo música ${musicName}:`, error.message);
            });

            console.log(`🎵 Reproduciendo música: ${musicName}`);
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            console.log('🎵 Música detenida');
        }
    }

    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
            console.log('⏸️ Música pausada');
        }
    }

    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused && this.musicEnabled) {
            this.currentMusic.play().catch(error => {
                console.warn('❌ Error reanudando música:', error.message);
            });
            console.log('▶️ Música reanudada');
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));

        // Aplicar a todos los sonidos de música
        Object.entries(this.sounds).forEach(([key, sound]) => {
            if (key.includes('Music')) {
                sound.volume = this.musicVolume;
            }
        });

        console.log(`🔊 Volumen música: ${Math.round(this.musicVolume * 100)}%`);
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));

        // Aplicar a todos los efectos de sonido
        Object.entries(this.sounds).forEach(([key, sound]) => {
            if (!key.includes('Music')) {
                sound.volume = this.sfxVolume;
            }
        });

        console.log(`🔊 Volumen SFX: ${Math.round(this.sfxVolume * 100)}%`);
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        if (!this.musicEnabled) {
            this.stopMusic();
        } else if (this.currentMusic) {
            this.currentMusic.play();
        }

        console.log(`🎵 Música ${this.musicEnabled ? 'activada' : 'desactivada'}`);
        return this.musicEnabled;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        console.log(`🔊 SFX ${this.sfxEnabled ? 'activados' : 'desactivados'}`);
        return this.sfxEnabled;
    }

    // Efectos especiales de audio
    playPowerUpSound(powerUpType) {
        const powerUpData = POWERUP_TYPES[powerUpType];
        if (powerUpData && powerUpData.sound) {
            this.playSound(powerUpData.sound);
        } else {
            this.playSound('powerupCollect');
        }
    }

    playComboSound(comboCount) {
        if (comboCount > 1) {
            this.playSound('combo', Math.min(1, 0.3 + comboCount * 0.1));
        }
    }

    playEngineSound(intensity = 0.3) {
        this.playSound('engine', intensity);
    }

    // Configurar audio 3D (para futuras mejoras)
    setupSpatialAudio(listener) {
        // TODO: Implementar audio espacial con Web Audio API
        console.log('🎧 Audio espacial preparado');
    }

    // Guardar configuración de audio
    saveSettings() {
        const audioSettings = {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled
        };

        // Actualizar configuración global
        Object.assign(userConfig, audioSettings);
        saveUserConfig();
    }

    // Cargar configuración de audio
    loadSettings() {
        const config = loadUserConfig();

        this.setMusicVolume(config.musicVolume || 0.3);
        this.setSFXVolume(config.sfxVolume || 0.7);
        this.musicEnabled = config.musicEnabled !== false;
        this.sfxEnabled = config.sfxEnabled !== false;

        console.log('🎵 Configuración de audio cargada');
    }

    // Manejar interacción del usuario (necesario para auto-play)
    handleUserInteraction() {
        // Reproducir silencio para "desbloquear" audio en navegadores
        Object.values(this.sounds).forEach(sound => {
            if (sound.readyState >= 2) { // HAVE_CURRENT_DATA
                const originalVolume = sound.volume;
                sound.volume = 0;
                sound.play().then(() => {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = originalVolume;
                }).catch(() => {
                    // Silenciar errores esperados
                });
            }
        });

        console.log('🎵 Audio desbloqueado por interacción del usuario');
    }

    // Información de estado para debugging
    getStatus() {
        return {
            initialized: this.initialized,
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            currentMusic: this.currentMusic ? 'Playing' : 'None',
            loadedSounds: Object.keys(this.sounds).length
        };
    }
}

// Instancia global del audio manager
const audioManager = new AudioManager();

// Configurar eventos para desbloquear audio
document.addEventListener('click', () => {
    audioManager.handleUserInteraction();
}, { once: true });

document.addEventListener('keydown', () => {
    audioManager.handleUserInteraction();
}, { once: true });