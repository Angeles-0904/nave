// =====================================
// ship.js - LÓGICA DE LA NAVE
// =====================================

class Ship {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.position = { x: 0, y: 0 };
        this.rotation = { z: 0 };
        this.stats = null;
        this.type = 'default';
        this.trail = null;
        this.light = null;
    }

    create(shipType = 'default') {
        // Remover nave anterior si existe
        this.remove();

        this.type = shipType;
        const shipData = SHIP_TYPES[shipType];

        if (!shipData) {
            console.error(`❌ Tipo de nave desconocido: ${shipType}`);
            return null;
        }

        // Crear mesh de la nave
        this.mesh = modelLoader.cloneModel(shipData.model);
        this.mesh.scale.set(shipData.scale, shipData.scale, shipData.scale);

        // Guardar estadísticas
        this.stats = {...shipData.stats };

        // Añadir luz específica de la nave
        this.light = new THREE.PointLight(shipData.lightColor, 1, 10);
        this.light.position.set(0, 0, 1);
        this.mesh.add(this.light);

        // Crear estela si gráficos altos
        if (userConfig.graphics === 'high') {
            this.createTrail();
        }

        // Añadir a la escena
        this.scene.add(this.mesh);

        // Resetear posición
        this.resetPosition();

        console.log(`🚀 Nave creada: ${shipData.name} (${shipType})`);
        return this.stats;
    }

    createTrail() {
        const trailGeometry = new THREE.BufferGeometry();
        const trailCount = 50;
        const positions = new Float32Array(trailCount * 3);

        // Inicializar posiciones del trail
        for (let i = 0; i < trailCount * 3; i += 3) {
            positions[i] = 0; // x
            positions[i + 1] = 0; // y
            positions[i + 2] = 0; // z
        }

        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const trailMaterial = new THREE.PointsMaterial({
            color: this.stats ? SHIP_TYPES[this.type].lightColor : 0x00ff00,
            size: 2,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.trail = new THREE.Points(trailGeometry, trailMaterial);
        this.mesh.add(this.trail);
    }

    updateTrail() {
        if (!this.trail) return;

        const positions = this.trail.geometry.attributes.position.array;

        // Mover todas las posiciones hacia atrás
        for (let i = positions.length - 3; i >= 3; i -= 3) {
            positions[i] = positions[i - 3]; // x
            positions[i + 1] = positions[i - 2]; // y
            positions[i + 2] = positions[i - 1]; // z
        }

        // Añadir nueva posición al frente
        positions[0] = this.position.x;
        positions[1] = this.position.y;
        positions[2] = 0.5; // Ligeramente detrás de la nave

        this.trail.geometry.attributes.position.needsUpdate = true;
    }

    move(deltaX, deltaY) {
        const maxPosition = GAME_CONFIG.TUNNEL_RADIUS - 2;
        const agility = this.stats ? this.stats.agility : 1.0;

        // Aplicar modificador de agilidad
        deltaX *= agility;
        deltaY *= agility;

        // Actualizar posición con límites
        this.position.x = Math.max(-maxPosition, Math.min(maxPosition, this.position.x + deltaX));
        this.position.y = Math.max(-maxPosition, Math.min(maxPosition, this.position.y + deltaY));

        // Efecto de inclinación en movimiento horizontal
        if (deltaX !== 0) {
            const targetRotation = -deltaX * 0.3; // Inclinar en dirección opuesta
            this.rotation.z = THREE.MathUtils.lerp(this.rotation.z, targetRotation, 0.1);
        } else {
            // Volver gradualmente a la posición normal
            this.rotation.z *= 0.95;
        }
    }

    update() {
        if (!this.mesh) return;

        // Actualizar posición del mesh
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.rotation.z = this.rotation.z;

        // Actualizar estela
        this.updateTrail();

        // Efecto de brillo pulsante
        if (this.light) {
            this.light.intensity = 1 + Math.sin(Date.now() * 0.005) * 0.2;
        }

        // Efecto visual de materiales
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.01) * 0.1;
            }
        });
    }

    resetPosition() {
        this.position.x = 0;
        this.position.y = 0;
        this.rotation.z = 0;
    }

    takeDamage() {
        if (!this.mesh) return;

        // Efecto visual de daño
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const originalEmissive = child.material.emissive.getHex();
                child.material.emissive.setHex(0xff0000);

                setTimeout(() => {
                    child.material.emissive.setHex(originalEmissive);
                }, 200);
            }
        });

        // Efecto de shake
        const originalX = this.position.x;
        const shakeIntensity = 0.2;

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (this.mesh) {
                    this.mesh.position.x = originalX + (Math.random() - 0.5) * shakeIntensity;
                }
            }, i * 50);
        }

        setTimeout(() => {
            if (this.mesh) {
                this.mesh.position.x = originalX;
            }
        }, 250);
    }

    setInvincible(isInvincible) {
        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (isInvincible) {
                    child.material.transparent = true;
                    child.material.opacity = 0.7;
                    child.material.emissive.setHex(0x004400);
                } else {
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.material.emissive.setHex(0x002200);
                }
            }
        });
    }

    boost(intensity = 1.0) {
        if (!this.mesh) return;

        // Efecto visual de boost
        if (this.light) {
            this.light.intensity = 1.5 * intensity;
        }

        // Efecto en materiales
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.emissiveIntensity = 0.5 * intensity;
            }
        });

        // Restablecer después de un tiempo
        setTimeout(() => {
            if (this.light) {
                this.light.intensity = 1;
            }
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissiveIntensity = 0.2;
                }
            });
        }, 200);
    }

    getPosition() {
        return {...this.position };
    }

    getWorldPosition() {
        if (!this.mesh) return new THREE.Vector3();

        const worldPosition = new THREE.Vector3();
        this.mesh.getWorldPosition(worldPosition);
        return worldPosition;
    }

    getStats() {
        return this.stats ? {...this.stats } : null;
    }

    getType() {
        return this.type;
    }

    isCreated() {
        return !!this.mesh;
    }

    setVisible(visible) {
        if (this.mesh) {
            this.mesh.visible = visible;
        }
    }

    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);

            // Limpiar geometrías y materiales
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });

            this.mesh = null;
            this.trail = null;
            this.light = null;
        }
    }

    // Para debugging
    debug() {
        console.log('🚀 Ship Debug:', {
            type: this.type,
            position: this.position,
            rotation: this.rotation,
            stats: this.stats,
            hasTrail: !!this.trail,
            isCreated: this.isCreated()
        });
    }
}

// Instancia global de la nave
const ship = new Ship(null); // Se asignará la escena más tarde