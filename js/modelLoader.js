// =====================================
// modelLoader.js - CARGA DE MODELOS 3D
// =====================================

class ModelLoader {
    constructor() {
        this.gltfLoader = null;
        this.modelCache = {};
        this.loadingProgress = {};
        this.initialized = false;
    }

    async initialize() {
        return new Promise((resolve) => {
            if (typeof THREE.GLTFLoader !== 'undefined') {
                this.gltfLoader = new THREE.GLTFLoader();
                this.initialized = true;
                console.log('✅ GLTFLoader ya disponible');
                resolve();
                return;
            }

            console.log('📦 Cargando GLTFLoader...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';

            script.onload = () => {
                this.gltfLoader = new THREE.GLTFLoader();
                this.initialized = true;
                console.log('✅ GLTFLoader cargado exitosamente');
                resolve();
            };

            script.onerror = () => {
                console.warn('⚠️ Error cargando GLTFLoader, usando modelos de respaldo');
                this.useOnlyFallbackModels();
                this.initialized = true;
                resolve();
            };

            document.head.appendChild(script);
        });
    }

    async preloadModels(onProgress = null) {
        console.log('🎯 Iniciando precarga de modelos...');
        const modelKeys = Object.keys(MODEL_PATHS);
        const promises = modelKeys.map(key => this.loadModel(key, onProgress));

        await Promise.all(promises);
        console.log('✅ Todos los modelos precargados');

        return this.getLoadingReport();
    }

    loadModel(key, onProgress = null) {
        return new Promise((resolve) => {
            if (!this.gltfLoader) {
                console.warn(`⚠️ GLTFLoader no disponible, usando fallback para: ${key}`);
                this.modelCache[key] = this.createFallbackModel(key);
                this.loadingProgress[key] = { status: 'fallback', progress: 100 };
                resolve();
                return;
            }

            this.loadingProgress[key] = { status: 'loading', progress: 0 };

            this.gltfLoader.load(
                MODEL_PATHS[key],
                // OnLoad
                (gltf) => {
                    this.modelCache[key] = gltf;
                    this.loadingProgress[key] = { status: 'loaded', progress: 100 };
                    console.log(`✅ Modelo cargado: ${key}`);

                    if (onProgress) {
                        onProgress(key, 100, 'loaded');
                    }
                    resolve();
                },
                // OnProgress
                (progress) => {
                    const percent = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
                    this.loadingProgress[key] = { status: 'loading', progress: percent };

                    if (onProgress) {
                        onProgress(key, percent, 'loading');
                    }
                },
                // OnError
                (error) => {
                    console.warn(`⚠️ Error cargando modelo ${key}:`, error.message);
                    console.log(`🔄 Usando modelo de respaldo para: ${key}`);

                    this.modelCache[key] = this.createFallbackModel(key);
                    this.loadingProgress[key] = { status: 'fallback', progress: 100 };

                    if (onProgress) {
                        onProgress(key, 100, 'fallback');
                    }
                    resolve();
                }
            );
        });
    }

    createFallbackModel(type) {
        const group = new THREE.Group();
        let mesh;

        switch (type) {
            // === NAVES ===
            case 'shipDefault':
                mesh = new THREE.Mesh(
                    new THREE.ConeGeometry(0.5, 2, 8),
                    new THREE.MeshPhongMaterial({
                        color: 0x00ff00,
                        emissive: 0x002200,
                        emissiveIntensity: 0.2
                    })
                );
                mesh.rotation.x = Math.PI / 2;
                break;

            case 'shipFighter':
                mesh = new THREE.Mesh(
                    new THREE.ConeGeometry(0.3, 1.5, 6),
                    new THREE.MeshPhongMaterial({
                        color: 0x00ccff,
                        emissive: 0x001144,
                        emissiveIntensity: 0.2
                    })
                );
                mesh.rotation.x = Math.PI / 2;
                break;

            case 'shipCruiser':
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 3, 0.5),
                    new THREE.MeshPhongMaterial({
                        color: 0xff8800,
                        emissive: 0x441100,
                        emissiveIntensity: 0.2
                    })
                );
                break;

                // === ELEMENTOS DEL JUEGO ===
            case 'asteroid':
                const asteroidGeom = new THREE.DodecahedronGeometry(2.0);
                // Deformar geometría para hacerla más irregular
                const positions = asteroidGeom.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] *= 0.8 + Math.random() * 0.4;
                    positions[i + 1] *= 0.8 + Math.random() * 0.4;
                    positions[i + 2] *= 0.8 + Math.random() * 0.4;
                }
                asteroidGeom.attributes.position.needsUpdate = true;
                asteroidGeom.computeVertexNormals();

                mesh = new THREE.Mesh(
                    asteroidGeom,
                    new THREE.MeshPhongMaterial({
                        color: 0xAA6633,
                        emissive: 0x443322,
                        emissiveIntensity: 0.3,
                        shininess: 10
                    })
                );
                break;

            case 'obstacle':
                mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(1, 8, 6),
                    new THREE.MeshPhongMaterial({
                        color: 0xff4444,
                        emissive: 0x440000,
                        emissiveIntensity: 0.4
                    })
                );
                break;

                // === POWER-UPS ===
            case 'powerUpShield':
                mesh = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.8),
                    new THREE.MeshPhongMaterial({
                        color: 0x00ff00,
                        emissive: 0x002200,
                        emissiveIntensity: 0.4,
                        transparent: true,
                        opacity: 0.9
                    })
                );
                break;

            case 'powerUpPoints':
                mesh = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.8),
                    new THREE.MeshPhongMaterial({
                        color: 0x0088ff,
                        emissive: 0x001144,
                        emissiveIntensity: 0.4,
                        transparent: true,
                        opacity: 0.9
                    })
                );
                break;

            case 'powerUpSpeed':
                mesh = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.8),
                    new THREE.MeshPhongMaterial({
                        color: 0xffff00,
                        emissive: 0x444400,
                        emissiveIntensity: 0.5,
                        transparent: true,
                        opacity: 0.9
                    })
                );
                break;

            case 'powerUpMultiplier':
                mesh = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.8),
                    new THREE.MeshPhongMaterial({
                        color: 0xff00ff,
                        emissive: 0x440044,
                        emissiveIntensity: 0.5,
                        transparent: true,
                        opacity: 0.9
                    })
                );
                break;

            case 'powerUpHealth':
                mesh = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.8),
                    new THREE.MeshPhongMaterial({
                        color: 0xff0000,
                        emissive: 0x440000,
                        emissiveIntensity: 0.5,
                        transparent: true,
                        opacity: 0.9
                    })
                );
                break;

            default:
                console.warn(`⚠️ Tipo de modelo desconocido: ${type}`);
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshPhongMaterial({
                        color: 0xffffff,
                        wireframe: true
                    })
                );
                break;
        }

        group.add(mesh);
        console.log(`🔄 Modelo fallback creado: ${type}`);
        return { scene: group };
    }

    cloneModel(modelKey) {
        if (!this.modelCache[modelKey]) {
            console.warn(`⚠️ Modelo ${modelKey} no encontrado en cache, usando fallback`);
            return this.createFallbackModel(modelKey).scene;
        }

        const originalModel = this.modelCache[modelKey].scene;
        const clonedModel = originalModel.clone();

        // Clonar materiales para evitar conflictos
        clonedModel.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    child.material = child.material.clone();
                }
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return clonedModel;
    }

    useOnlyFallbackModels() {
        console.log('🔄 Creando todos los modelos de respaldo...');
        Object.keys(MODEL_PATHS).forEach(key => {
            this.modelCache[key] = this.createFallbackModel(key);
            this.loadingProgress[key] = { status: 'fallback', progress: 100 };
        });
        console.log('✅ Modelos de respaldo listos');
    }

    getLoadingReport() {
        const report = {
            total: Object.keys(MODEL_PATHS).length,
            loaded: 0,
            fallback: 0,
            failed: 0
        };

        Object.values(this.loadingProgress).forEach(progress => {
            switch (progress.status) {
                case 'loaded':
                    report.loaded++;
                    break;
                case 'fallback':
                    report.fallback++;
                    break;
                case 'failed':
                    report.failed++;
                    break;
            }
        });

        return report;
    }

    getModelInfo(modelKey) {
        const model = this.modelCache[modelKey];
        if (!model) return null;

        const info = {
            key: modelKey,
            status: (this.loadingProgress[modelKey] && this.loadingProgress[modelKey].status) || 'unknown',
            triangles: 0,
            vertices: 0,
            materials: 0
        };

        if (model.scene) {
            model.scene.traverse((child) => {
                if (child.isMesh) {
                    info.materials++;
                    if (child.geometry) {
                        const positionAttribute = child.geometry.attributes.position;
                        if (positionAttribute) {
                            info.vertices += positionAttribute.count;
                        }
                        if (child.geometry.index) {
                            info.triangles += child.geometry.index.count / 3;
                        }
                    }
                }
            });
        }

        return info;
    }

    // Liberar memoria de modelos no utilizados
    disposeModel(modelKey) {
        const model = this.modelCache[modelKey];
        if (model && model.scene) {
            model.scene.traverse((child) => {
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
            delete this.modelCache[modelKey];
            console.log(`🗑️ Modelo liberado de memoria: ${modelKey}`);
        }
    }

    // Liberar toda la memoria
    dispose() {
        Object.keys(this.modelCache).forEach(key => {
            this.disposeModel(key);
        });
        this.modelCache = {};
        this.loadingProgress = {};
        console.log('🗑️ Todos los modelos liberados de memoria');
    }

    // Información de estado para debugging
    getStatus() {
        const report = this.getLoadingReport();
        return {
            initialized: this.initialized,
            hasGLTFLoader: !!this.gltfLoader,
            modelsInCache: Object.keys(this.modelCache).length,
            loadingReport: report,
            memoryUsage: this.getMemoryUsage()
        };
    }

    getMemoryUsage() {
        let totalVertices = 0;
        let totalTriangles = 0;
        let totalMaterials = 0;

        Object.keys(this.modelCache).forEach(key => {
            const info = this.getModelInfo(key);
            if (info) {
                totalVertices += info.vertices;
                totalTriangles += info.triangles;
                totalMaterials += info.materials;
            }
        });

        return {
            vertices: totalVertices,
            triangles: totalTriangles,
            materials: totalMaterials
        };
    }
}

// Instancia global del cargador de modelos
const modelLoader = new ModelLoader();