// =====================================
// main.js - ARCHIVO PRINCIPAL DEL JUEGO
// =====================================

// Variables globales de Three.js
let scene, camera, renderer;
let keys = {};

// Arrays de objetos del juego
let tunnelSegments = [];
let obstacles = [];
let powerUps = [];
let particles = [];

// Variables de estado del juego
let currentTunnelZ = 0;

// =====================================
// INICIALIZACIÓN DEL JUEGO
// =====================================

class SpaceRunnerGame {
    constructor() {
        this.initialized = false;
        this.gameLoop = null;
    }

    async initialize() {
        console.log('🎮 Inicializando Space Runner 3D...');

        try {
            // Cargar configuración del usuario
            loadUserConfig();

            // Configurar eventos del menú
            this.setupMenuEvents();

            // Inicializar sistemas
            await modelLoader.initialize();
            audioManager.loadSettings();

            // Configurar Three.js básico
            this.setupThreeJS();

            // Configurar controles
            this.setupControls();

            // Asignar escena a la nave
            ship.scene = scene;

            this.initialized = true;
            console.log('✅ Juego inicializado correctamente');

            // Reproducir música del menú
            setTimeout(() => {
                audioManager.playMusic('menuMusic');
            }, 1000);

        } catch (error) {
            console.error('❌ Error inicializando el juego:', error);
        }
    }

    setupThreeJS() {
        // Crear escena
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000011, 50, 200);

        // Configurar cámara
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 5);

        // Configurar renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000011);
        renderer.shadowMap.enabled = userConfig.graphics !== 'low';
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Remover canvas anterior si existe
        const existingCanvas = document.querySelector('canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        document.body.appendChild(renderer.domElement);
        console.log('🎨 Three.js configurado');
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            keys[event.code] = true;

            // Pausa con ESC
            if (event.code === 'Escape' && gameState.gameStarted) {
                this.pauseGame();
            }
        });

        document.addEventListener('keyup', (event) => {
            keys[event.code] = false;
        });

        window.addEventListener('resize', () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        console.log('🎮 Controles configurados');
    }

    setupMenuEvents() {
        // Menú principal
        const startBtn = document.getElementById('start-game');
        const settingsBtn = document.getElementById('settings-btn');
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        const instructionsBtn = document.getElementById('instructions-btn');

        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
        if (leaderboardBtn) leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        if (instructionsBtn) instructionsBtn.addEventListener('click', () => this.toggleInstructions());

        // Configuración
        const backBtn = document.getElementById('back-to-menu');
        const saveBtn = document.getElementById('save-settings');

        if (backBtn) backBtn.addEventListener('click', () => this.hideSettings());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveSettings());

        // Pausa
        const resumeBtn = document.getElementById('resume-game');
        const restartPauseBtn = document.getElementById('restart-from-pause');
        const menuPauseBtn = document.getElementById('main-menu-from-pause');

        if (resumeBtn) resumeBtn.addEventListener('click', () => this.resumeGame());
        if (restartPauseBtn) restartPauseBtn.addEventListener('click', () => this.restartFromPause());
        if (menuPauseBtn) menuPauseBtn.addEventListener('click', () => this.returnToMainMenu());

        // Game Over
        const restartBtn = document.getElementById('restart-btn');
        const menuBtn = document.getElementById('menu-btn');

        if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());
        if (menuBtn) menuBtn.addEventListener('click', () => this.returnToMainMenu());

        // Añadir sonidos a botones
        document.querySelectorAll('button, .menu-btn').forEach(button => {
            button.addEventListener('click', () => {
                audioManager.playSound('menuClick');
            });
        });

        console.log('📋 Eventos del menú configurados');
    }

    async startGame() {
        console.log('🚀 Iniciando juego...');

        // Ocultar menú y mostrar HUD
        this.hideElement('main-menu');
        this.showElement('hud');
        this.showElement('instructions');

        // Aplicar configuración de dificultad
        applyDifficultySettings();

        // Cambiar música
        audioManager.playMusic('backgroundMusic');

        try {
            // Precargar modelos si no están cargados
            if (Object.keys(modelLoader.modelCache).length === 0) {
                console.log('📦 Precargando modelos...');
                await modelLoader.preloadModels();
            }

            // Inicializar elementos del juego
            this.initGameWorld();

            // Configurar nave
            const shipStats = ship.create(userConfig.selectedShip);
            gameState.setShipStats(shipStats);

            // Iniciar estado del juego
            gameState.start();

            // Iniciar bucle del juego
            this.startGameLoop();

            console.log('✅ Juego iniciado correctamente');

        } catch (error) {
            console.error('❌ Error iniciando el juego:', error);
        }
    }

    initGameWorld() {
        // Limpiar objetos anteriores
        this.clearGameObjects();

        // Crear fondo estrellado
        this.createStarField();

        // Crear túnel inicial
        this.createInitialTunnel();

        // Configurar luces
        this.setupLights();

        console.log('🌌 Mundo del juego inicializado');
    }

    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = userConfig.graphics === 'high' ? 3000 :
            userConfig.graphics === 'medium' ? 2000 : 1000;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 400;
            positions[i + 1] = (Math.random() - 0.5) * 400;
            positions[i + 2] = (Math.random() - 0.5) * 400;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            opacity: 0.8
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
    }

    createInitialTunnel() {
        console.log('🕳️ Creando túnel inicial...');
        currentTunnelZ = 0;

        for (let i = 0; i < GAME_CONFIG.TUNNEL_SEGMENTS_COUNT; i++) {
            this.createTunnelSegment(i * -5);
        }
    }

    createTunnelSegment(z) {
        const segment = new THREE.Group();
        segment.userData.initialZ = z;

        const asteroidCount = 20 + Math.floor(Math.random() * 10);
        for (let i = 0; i < asteroidCount; i++) {
            const angle = (i / asteroidCount) * Math.PI * 2;
            const radius = GAME_CONFIG.TUNNEL_RADIUS + Math.random() * 2;

            const asteroid = modelLoader.cloneModel('asteroid');
            const baseScale = 1.5;
            const scale = baseScale + Math.random() * baseScale;
            asteroid.scale.set(scale, scale, scale);

            asteroid.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                z
            );
            asteroid.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Aplicar material brillante
            asteroid.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x444422);
                    child.material.emissiveIntensity = 0.3;
                }
            });

            segment.add(asteroid);
        }

        tunnelSegments.push(segment);
        scene.add(segment);
    }

    setupLights() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        scene.add(ambientLight);

        // Luz direccional principal
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);

        if (userConfig.graphics !== 'low') {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
        }
        scene.add(directionalLight);

        // Luces dinámicas solo en gráficos medios/altos
        if (userConfig.graphics !== 'low') {
            for (let i = 0; i < 3; i++) {
                const tunnelLight = new THREE.PointLight(
                    new THREE.Color().setHSL(Math.random(), 0.5, 0.5),
                    2,
                    30
                );
                tunnelLight.position.set(
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 30, -20 - i * 20
                );
                scene.add(tunnelLight);
            }
        }
    }

    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        const loop = () => {
            this.gameLoop = requestAnimationFrame(loop);
            this.update();
            this.render();
        };

        loop();
        console.log('🔄 Bucle del juego iniciado');
    }

    update() {
        if (!gameState.gameStarted) return;

        if (!gameState.paused) {
            // Actualizar controles
            this.handleControls();

            // Actualizar estado del juego
            gameState.updatePlayTime();
            gameState.updateTemporaryEffects();
            gameState.updateSpeed();
            gameState.updateBoost();

            // Actualizar lógica de puntuación
            this.updateGameLogic();

            // Actualizar elementos del mundo
            this.updateTunnel();
            this.updateObstacles();
            this.updatePowerUps();
            this.updateParticles();

            // Actualizar nave
            ship.update();

            // Actualizar UI
            this.updateHUD();
        }
    }

    handleControls() {
        if (gameState.gameOver) return;

        const sensitivity = userConfig.sensitivity;
        const agility = ship.stats ? ship.stats.agility : 1.0;
        const moveSpeed = sensitivity * agility;

        let deltaX = 0;
        let deltaY = 0;

        // Movimiento horizontal
        if (keys['KeyA'] || keys['ArrowLeft']) {
            deltaX = -moveSpeed;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            deltaX = moveSpeed;
        }

        // Movimiento vertical
        if (keys['KeyW'] || keys['ArrowUp']) {
            deltaY = moveSpeed;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            deltaY = -moveSpeed;
        }

        // Aplicar movimiento
        if (deltaX !== 0 || deltaY !== 0) {
            ship.move(deltaX, deltaY);
        }

        // Turbo normal
        if (keys['Space']) {
            const speedMultiplier = ship.stats ? ship.stats.speed : 1.0;
            gameState.speed = Math.min(GAME_CONFIG.MAX_SPEED * speedMultiplier, gameState.speed + 0.05);
            audioManager.playSound('boost', 0.2);
            ship.boost(1.2);
        }

        // Boost especial
        if (keys['ShiftLeft'] || keys['ShiftRight']) {
            if (gameState.useBoost()) {
                gameState.speed = Math.min(GAME_CONFIG.MAX_SPEED * 1.5, gameState.speed + 0.1);
                ship.boost(1.5);
            }
        }
    }

    updateGameLogic() {
        // Aumentar puntuación base
        const basePoints = Math.floor(gameState.speed * 10);
        gameState.addScore(basePoints);

        // Verificar cambio de nivel
        if (gameState.updateLevel()) {
            this.showLevelUp();
        }
    }

    updateTunnel() {
        currentTunnelZ += gameState.speed * 0.5;

        // Actualizar segmentos existentes
        tunnelSegments.forEach((segment, index) => {
            segment.position.z += gameState.speed * 0.5;

            // Rotar asteroides
            segment.children.forEach(asteroid => {
                asteroid.rotation.x += 0.005;
                asteroid.rotation.y += 0.003;
            });

            // Eliminar segmentos que han pasado
            if (segment.position.z > 25) {
                scene.remove(segment);
                tunnelSegments.splice(index, 1);
            }
        });

        // Crear nuevos segmentos
        while (tunnelSegments.length < GAME_CONFIG.TUNNEL_SEGMENTS_COUNT) {
            let lastZ = -25;
            if (tunnelSegments.length > 0) {
                const positions = tunnelSegments.map(segment => {
                    return segment.userData.initialZ + segment.position.z;
                });
                lastZ = Math.min(...positions);
            }
            this.createTunnelSegment(lastZ - 5);
        }
    }

    spawnObstacle() {
        if (Math.random() < GAME_CONFIG.OBSTACLE_SPAWN_RATE * gameState.speed) {
            const obstacle = modelLoader.cloneModel('obstacle');

            const baseScale = 0.05;
            const scale = baseScale + Math.random() * baseScale;
            obstacle.scale.set(scale, scale, scale);

            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (GAME_CONFIG.TUNNEL_RADIUS - 3);
            obstacle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius, -30
            );

            obstacle.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x440000);
                }
            });

            obstacles.push(obstacle);
            scene.add(obstacle);
        }
    }

    spawnPowerUp() {
        if (Math.random() < GAME_CONFIG.POWERUP_SPAWN_RATE) {
            const powerUpKeys = Object.keys(POWERUP_TYPES);
            const randomType = powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];
            const powerUpData = POWERUP_TYPES[randomType];

            const powerUp = modelLoader.cloneModel(powerUpData.model);
            powerUp.scale.set(0.08, 0.08, 0.08);

            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (GAME_CONFIG.TUNNEL_RADIUS - 2);
            powerUp.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius, -30
            );

            powerUp.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(powerUpData.color);
                    child.material.emissiveIntensity = 0.5;
                    child.material.transparent = true;
                    child.material.opacity = 0.9;
                }
            });

            powerUp.userData.type = randomType;
            powerUps.push(powerUp);
            scene.add(powerUp);
        }
    }

    updateObstacles() {
        // Generar nuevos obstáculos
        this.spawnObstacle();

        // Actualizar obstáculos existentes
        obstacles.forEach((obstacle, index) => {
            obstacle.position.z += gameState.speed * 1.2;
            obstacle.rotation.x += 0.02;
            obstacle.rotation.y += 0.02;

            // Verificar colisión
            const distance = obstacle.position.distanceTo(ship.getWorldPosition());
            if (distance < 2 && !gameState.invincible) {
                const damage = 20 * GAME_CONFIG.DAMAGE_MULTIPLIER;
                const died = gameState.takeDamage(damage);

                ship.takeDamage();
                audioManager.playSound('damage');
                this.createExplosion(obstacle.position);

                scene.remove(obstacle);
                obstacles.splice(index, 1);

                if (died) {
                    this.endGame();
                }
            }

            // Eliminar obstáculos que han pasado
            if (obstacle.position.z > 15) {
                scene.remove(obstacle);
                obstacles.splice(index, 1);
            }
        });
    }

    updatePowerUps() {
        // Generar nuevos power-ups
        this.spawnPowerUp();

        // Actualizar power-ups existentes
        powerUps.forEach((powerUp, index) => {
            powerUp.position.z += gameState.speed * 1.2;
            powerUp.rotation.x += 0.05;
            powerUp.rotation.y += 0.05;

            // Verificar colisión
            const distance = powerUp.position.distanceTo(ship.getWorldPosition());
            if (distance < 2) {
                this.collectPowerUp(powerUp.userData.type);
                this.createCollectEffect(powerUp.position);
                scene.remove(powerUp);
                powerUps.splice(index, 1);
            }

            // Eliminar power-ups que han pasado
            if (powerUp.position.z > 15) {
                scene.remove(powerUp);
                powerUps.splice(index, 1);
            }
        });
    }

    collectPowerUp(type) {
        const powerUpData = POWERUP_TYPES[type];
        gameState.increaseCombo();

        audioManager.playPowerUpSound(type);
        audioManager.playComboSound(gameState.combo);

        switch (type) {
            case 'shield':
                gameState.setInvincible(powerUpData.duration);
                ship.setInvincible(true);
                this.showPowerUpIndicator('¡INVENCIBLE!', powerUpData.duration);
                break;

            case 'points':
                const bonusPoints = powerUpData.value * (1 + gameState.combo * 0.1);
                gameState.addScore(bonusPoints);
                this.showComboIndicator(bonusPoints);
                break;

            case 'speed':
                gameState.setSpeedBoost(powerUpData.duration);
                this.showPowerUpIndicator('¡VELOCIDAD!', powerUpData.duration);
                break;

            case 'multiplier':
                gameState.setScoreMultiplier(2, powerUpData.duration);
                this.showPowerUpIndicator('¡MULTIPLICADOR x2!', powerUpData.duration);
                break;

            case 'health':
                gameState.heal(powerUpData.value);
                this.showPowerUpIndicator(`¡VIDA +${powerUpData.value}!`, 2000);
                break;
        }
    }

    updateParticles() {
        particles.forEach((particle, index) => {
            particle.position.add(particle.velocity);
            particle.velocity.multiplyScalar(0.98);
            particle.life -= 0.02;
            particle.material.opacity = particle.life;

            if (particle.life <= 0) {
                scene.remove(particle);
                particles.splice(index, 1);
            }
        });
    }

    createExplosion(position) {
        if (userConfig.graphics === 'low') return;

        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1),
                new THREE.MeshBasicMaterial({ color: 0xff4400 })
            );

            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            particle.life = 1.0;

            particles.push(particle);
            scene.add(particle);
        }
    }

    createCollectEffect(position) {
        if (userConfig.graphics === 'low') return;

        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );

            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                Math.random() * 2,
                (Math.random() - 0.5) * 1
            );
            particle.life = 0.8;

            particles.push(particle);
            scene.add(particle);
        }
    }

    // UI y Menús
    updateHUD() {
        const stats = gameState.getStats();

        this.updateElement('current-level', stats.level);
        this.updateElement('score', stats.score.toLocaleString());
        this.updateElement('speed', stats.speed.toFixed(1));
        this.updateElement('combo-count', stats.combo);

        // Barras de progreso
        this.updateProgressBar('health-fill', (stats.health / stats.maxHealth) * 100);
        this.updateProgressBar('boost-fill', (stats.boost / stats.maxBoost) * 100);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    updateProgressBar(id, percentage) {
        const element = document.getElementById(id);
        if (element) element.style.width = percentage + '%';
    }

    showPowerUpIndicator(text, duration) {
        const indicator = document.getElementById('power-up-indicator');
        const textElement = document.getElementById('power-up-text');
        const timerElement = document.getElementById('power-timer');

        if (indicator && textElement) {
            textElement.textContent = text;
            indicator.style.display = 'block';

            if (duration && timerElement) {
                let timeLeft = duration;
                const updateTimer = () => {
                    timerElement.textContent = Math.ceil(timeLeft / 1000);
                    timeLeft -= 100;
                    if (timeLeft <= 0) {
                        indicator.style.display = 'none';
                        ship.setInvincible(false);
                    } else {
                        setTimeout(updateTimer, 100);
                    }
                };
                updateTimer();
            } else {
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 2000);
            }
        }
    }

    showComboIndicator(points) {
        const indicator = document.getElementById('combo-indicator');
        const multiplier = document.getElementById('combo-multiplier');
        const pointsElement = document.getElementById('combo-points');

        if (indicator && multiplier && pointsElement) {
            multiplier.textContent = gameState.combo;
            pointsElement.textContent = points;
            indicator.style.display = 'block';

            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        }
    }

    showLevelUp() {
        audioManager.playSound('levelUp');
        this.showPowerUpIndicator(`¡NIVEL ${gameState.level}!`, 3000);
    }

    // Gestión de estados del juego
    pauseGame() {
        const paused = gameState.pause();
        this.showElement('pause-menu', paused ? 'flex' : 'none');

        if (paused) {
            audioManager.pauseMusic();
        } else {
            audioManager.resumeMusic();
        }
    }

    resumeGame() {
        gameState.paused = false;
        this.hideElement('pause-menu');
        audioManager.resumeMusic();
    }

    restartFromPause() {
        this.resumeGame();
        this.restartGame();
    }

    restartGame() {
        // Limpiar objetos del juego
        this.clearGameObjects();

        // Reiniciar estado
        gameState.reset();

        // Reiniciar nave
        const shipStats = ship.create(userConfig.selectedShip);
        gameState.setShipStats(shipStats);

        // Reinicializar mundo
        this.initGameWorld();

        // Reiniciar juego
        gameState.start();

        // Ocultar pantallas
        this.hideElement('game-over');
        this.hideElement('power-up-indicator');
        this.hideElement('combo-indicator');

        console.log('🔄 Juego reiniciado');
    }

    endGame() {
        gameState.endGame();
        audioManager.stopMusic();
        audioManager.playSound('gameOver');

        // Mostrar estadísticas finales
        const stats = gameState.getStats();
        this.updateElement('final-score', stats.score.toLocaleString());
        this.updateElement('best-score', stats.bestScore.toLocaleString());
        this.updateElement('final-level', stats.level);
        this.updateElement('play-time', stats.playTime);

        this.showElement('game-over');
    }

    returnToMainMenu() {
        // Detener bucle del juego
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        // Limpiar juego
        this.clearGameObjects();
        ship.remove();

        // Cambiar música
        audioManager.playMusic('menuMusic');

        // Resetear estado
        gameState.reset();

        // Mostrar/ocultar elementos
        this.hideElement('hud');
        this.hideElement('instructions');
        this.hideElement('game-over');
        this.hideElement('pause-menu');
        this.showElement('main-menu', 'flex');

        console.log('🏠 Volviendo al menú principal');
    }

    clearGameObjects() {
        // Limpiar arrays y escena
        [...tunnelSegments, ...obstacles, ...powerUps, ...particles].forEach(obj => {
            scene.remove(obj);
        });

        tunnelSegments = [];
        obstacles = [];
        powerUps = [];
        particles = [];
    }

    // Configuración
    showSettings() {
        this.showElement('settings-menu');
        this.updateConfigUI();
    }

    hideSettings() {
        this.hideElement('settings-menu');
    }

    updateConfigUI() {
        this.setElementValue('difficulty-select', userConfig.difficulty);
        this.setElementValue('sensitivity-slider', userConfig.sensitivity);
        this.setElementValue('graphics-select', userConfig.graphics);
        this.setElementValue('ship-select', userConfig.selectedShip);
    }

    saveSettings() {
        userConfig.difficulty = this.getElementValue('difficulty-select') || userConfig.difficulty;
        userConfig.sensitivity = parseFloat(this.getElementValue('sensitivity-slider')) || userConfig.sensitivity;
        userConfig.graphics = this.getElementValue('graphics-select') || userConfig.graphics;
        userConfig.selectedShip = this.getElementValue('ship-select') || userConfig.selectedShip;

        saveUserConfig();
        audioManager.saveSettings();
        this.hideSettings();

        console.log('💾 Configuración guardada');
    }

    showLeaderboard() {
        alert(`Mejor Puntuación: ${gameState.bestScore}\n\n¡Próximamente: Tabla de líderes online!`);
    }

    toggleInstructions() {
        const instructions = document.getElementById('instructions');
        if (instructions) {
            const isVisible = instructions.style.display !== 'none';
            instructions.style.display = isVisible ? 'none' : 'block';
        }
    }

    // Utilidades de DOM
    showElement(id, display = 'block') {
        const element = document.getElementById(id);
        if (element) element.style.display = display;
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    }

    setElementValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    getElementValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : null;
    }

    render() {
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }
}

// =====================================
// INICIALIZACIÓN GLOBAL
// =====================================

const game = new SpaceRunnerGame();

document.addEventListener('DOMContentLoaded', () => {
    game.initialize();
});

// Exportar para debugging
window.gameDebug = {
    game,
    gameState,
    ship,
    audioManager,
    modelLoader,
    scene,
    camera,
    renderer
};