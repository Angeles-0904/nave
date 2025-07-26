// =====================================
// gameState.js - ESTADO GLOBAL DEL JUEGO
// =====================================

class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.health = 100;
        this.speed = 1.0;
        this.gameOver = false;
        this.paused = false;
        this.invincible = false;
        this.invincibleTime = 0;
        this.bestScore = localStorage.getItem('spaceRunnerBest') || 0;
        this.level = 1;
        this.combo = 0;
        this.boost = 0;
        this.maxBoost = 100;
        this.playTime = 0;
        this.startTime = 0;
        this.gameStarted = false;

        // Efectos temporales
        this.speedBoostActive = false;
        this.speedBoostTime = 0;
        this.multiplierActive = false;
        this.multiplierTime = 0;
        this.scoreMultiplier = 1;

        // Stats de nave
        this.shipStats = null;
        this.maxHealth = 100;
    }

    start() {
        this.gameStarted = true;
        this.startTime = Date.now();
        this.gameOver = false;
        this.paused = false;
    }

    pause() {
        this.paused = !this.paused;
        return this.paused;
    }

    updatePlayTime() {
        if (this.gameStarted && !this.paused) {
            this.playTime = Date.now() - this.startTime;
        }
    }

    addScore(points) {
        const comboBonus = this.combo > 0 ? this.combo * 5 : 0;
        const multiplier = this.multiplierActive ? this.scoreMultiplier : 1;
        const totalPoints = (points + comboBonus) * multiplier;
        this.score += totalPoints;
        return totalPoints;
    }

    increaseCombo() {
        this.combo++;
        return this.combo;
    }

    resetCombo() {
        this.combo = 0;
    }

    takeDamage(amount) {
        if (this.invincible) return false;

        this.health = Math.max(0, this.health - amount);
        this.resetCombo();

        if (this.health <= 0) {
            this.endGame();
            return true;
        }
        return false;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health;
    }

    setInvincible(duration) {
        this.invincible = true;
        this.invincibleTime = duration;
    }

    setSpeedBoost(duration) {
        this.speedBoostActive = true;
        this.speedBoostTime = duration;
    }

    setScoreMultiplier(multiplier, duration) {
        this.multiplierActive = true;
        this.scoreMultiplier = multiplier;
        this.multiplierTime = duration;
    }

    updateTemporaryEffects(deltaTime = 16) {
        // Actualizar invencibilidad
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
                this.invincibleTime = 0;
            }
        }

        // Actualizar speed boost
        if (this.speedBoostActive) {
            this.speedBoostTime -= deltaTime;
            if (this.speedBoostTime <= 0) {
                this.speedBoostActive = false;
                this.speedBoostTime = 0;
            }
        }

        // Actualizar multiplicador
        if (this.multiplierActive) {
            this.multiplierTime -= deltaTime;
            if (this.multiplierTime <= 0) {
                this.multiplierActive = false;
                this.multiplierTime = 0;
                this.scoreMultiplier = 1;
            }
        }
    }

    updateLevel() {
        const newLevel = LEVEL_THRESHOLDS.findIndex(threshold => this.score < threshold);
        const level = newLevel === -1 ? LEVEL_THRESHOLDS.length : newLevel;

        if (level !== this.level) {
            const oldLevel = this.level;
            this.level = level;
            this.onLevelUp(oldLevel, level);
            return true;
        }
        return false;
    }

    onLevelUp(oldLevel, newLevel) {
        // Aumentar dificultad progresivamente
        GAME_CONFIG.OBSTACLE_SPAWN_RATE *= 1.1;
        if (GAME_CONFIG.POWERUP_SPAWN_RATE > 0.001) {
            GAME_CONFIG.POWERUP_SPAWN_RATE *= 0.95;
        }

        console.log(`🎉 Level Up! ${oldLevel} → ${newLevel}`);
    }

    updateSpeed() {
        const baseIncrease = 0.002;
        const speedMultiplier = this.shipStats ? this.shipStats.speed : 1.0;
        const targetSpeed = GAME_CONFIG.MAX_SPEED * speedMultiplier;

        this.speed = Math.min(targetSpeed, this.speed + baseIncrease);

        // Speed boost temporal
        if (this.speedBoostActive) {
            this.speed = Math.min(targetSpeed * 1.3, this.speed + 0.05);
        }
    }

    updateBoost() {
        // Regenerar boost gradualmente
        const regenRate = this.maxBoost > 100 ? 0.15 : 0.1;
        this.boost = Math.min(this.maxBoost, this.boost + regenRate);
    }

    useBoost(amount = 2) {
        if (this.boost >= amount) {
            this.boost = Math.max(0, this.boost - amount);
            return true;
        }
        return false;
    }

    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        this.saveScore();
    }

    saveScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('spaceRunnerBest', this.bestScore);
            return true; // Nueva mejor puntuación
        }
        return false;
    }

    setShipStats(stats) {
        this.shipStats = stats;
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.maxBoost = stats.boost;
        this.boost = stats.boost;
    }

    getPlayTimeFormatted() {
        const minutes = Math.floor(this.playTime / 60000);
        const seconds = Math.floor((this.playTime % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getStats() {
        return {
            score: this.score,
            level: this.level,
            combo: this.combo,
            health: this.health,
            maxHealth: this.maxHealth,
            boost: this.boost,
            maxBoost: this.maxBoost,
            speed: this.speed,
            playTime: this.getPlayTimeFormatted(),
            bestScore: this.bestScore,
            invincible: this.invincible,
            speedBoost: this.speedBoostActive,
            multiplier: this.multiplierActive ? this.scoreMultiplier : 1
        };
    }

    // Para debugging
    debug() {
        console.log('🎮 Game State:', {
            score: this.score,
            level: this.level,
            health: this.health,
            speed: this.speed.toFixed(2),
            combo: this.combo,
            effects: {
                invincible: this.invincible,
                speedBoost: this.speedBoostActive,
                multiplier: this.multiplierActive
            }
        });
    }
}

// Instancia global del estado del juego
const gameState = new GameState();