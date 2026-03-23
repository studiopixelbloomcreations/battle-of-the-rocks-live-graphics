class SceneManager {
  constructor(canvas, palette) {
    this.palette = palette;
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050814, 0.018);
    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.clock = new THREE.Clock();
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.setupLights();
    this.setupEnvironment();
  }

  setupLights() {
    this.hemiLight = new THREE.HemisphereLight(0x4fd5ff, 0x04070d, 1.1);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xcde4ff, 1.4);
    this.keyLight.position.set(6, 10, 8);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.PointLight(this.palette.accent, 1.8, 40, 2);
    this.rimLight.position.set(-4, 6, 10);
    this.scene.add(this.rimLight);

    this.flashLight = new THREE.PointLight(0xffffff, 0, 45, 2);
    this.flashLight.position.set(0, 4, 8);
    this.scene.add(this.flashLight);
  }

  setupEnvironment() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(18, 48),
      new THREE.MeshStandardMaterial({
        color: 0x08111d,
        emissive: 0x09162b,
        emissiveIntensity: 0.18,
        roughness: 0.56,
        metalness: 0.22,
        transparent: true,
        opacity: 0.94
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.6;
    this.scene.add(floor);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.position = new THREE.Vector3(0, 1.5, 11);
    this.targetPosition = this.position.clone();
    this.lookAt = new THREE.Vector3(0, 0, 0);
    this.targetLookAt = this.lookAt.clone();
    this.shake = 0;
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.lookAt);
  }

  moveTo(position, lookAt) {
    this.targetPosition.copy(position);
    this.targetLookAt.copy(lookAt);
  }

  addShake(amount) {
    this.shake = Math.max(this.shake, amount);
  }

  update(delta) {
    this.position.lerp(this.targetPosition, Math.min(1, delta * 4.8));
    this.lookAt.lerp(this.targetLookAt, Math.min(1, delta * 5.2));
    this.camera.position.copy(this.position);

    if (this.shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
      this.shake *= Math.max(0, 1 - delta * 7);
    }

    this.camera.lookAt(this.lookAt);
  }
}

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.bursts = [];
    this.shockwaves = [];
    this.trails = [];
  }

  spawnBurst(origin, options = {}) {
    const count = options.count || 160;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];
    const color = new THREE.Color(options.color || 0x8ad8ff);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * (options.spread || 8),
        (Math.random() - 0.2) * (options.lift || 8),
        (Math.random() - 0.5) * (options.depth || 5)
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: options.size || 0.16,
      vertexColors: true,
      transparent: true,
      opacity: options.opacity || 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.bursts.push({ points, velocities, life: options.life || 1.2, gravity: options.gravity || 6 });
  }

  spawnShockwave(origin, color) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.8, 64),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.shockwaves.push({ mesh, life: 0.8, scale: 1 });
  }

  spawnTrail(position, color, scale = 1) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18 * scale, 16, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.trails.push({ mesh, life: 0.4 });
  }

  update(delta) {
    this.bursts = this.bursts.filter((burst) => {
      burst.life -= delta;
      const positions = burst.points.geometry.attributes.position.array;
      burst.velocities.forEach((velocity, index) => {
        positions[index * 3] += velocity.x * delta;
        positions[index * 3 + 1] += velocity.y * delta;
        positions[index * 3 + 2] += velocity.z * delta;
        velocity.y -= burst.gravity * delta;
      });
      burst.points.geometry.attributes.position.needsUpdate = true;
      burst.points.material.opacity = Math.max(0, burst.life);
      if (burst.life <= 0) {
        this.scene.remove(burst.points);
        burst.points.geometry.dispose();
        burst.points.material.dispose();
        return false;
      }
      return true;
    });

    this.shockwaves = this.shockwaves.filter((wave) => {
      wave.life -= delta;
      wave.scale += delta * 8;
      wave.mesh.scale.setScalar(wave.scale);
      wave.mesh.material.opacity = Math.max(0, wave.life);
      if (wave.life <= 0) {
        this.scene.remove(wave.mesh);
        wave.mesh.geometry.dispose();
        wave.mesh.material.dispose();
        return false;
      }
      return true;
    });

    this.trails = this.trails.filter((trail) => {
      trail.life -= delta;
      trail.mesh.scale.multiplyScalar(1 + delta * 2.6);
      trail.mesh.material.opacity = Math.max(0, trail.life * 1.6);
      if (trail.life <= 0) {
        this.scene.remove(trail.mesh);
        trail.mesh.geometry.dispose();
        trail.mesh.material.dispose();
        return false;
      }
      return true;
    });
  }
}

class EventAnimationController {
  constructor(sceneManager, palette) {
    this.sceneManager = sceneManager;
    this.palette = palette;
    this.cameraController = new CameraController(sceneManager.camera);
    this.particles = new ParticleSystem(sceneManager.scene);
    this.time = 0;
    this.active = false;
    this.flashTimer = 0;
  }

  trigger(context = {}) {
    this.context = context;
    this.time = 0;
    this.active = true;
  }

  update(delta) {
    this.particles.update(delta);
    this.cameraController.update(delta);
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - delta * 4);
      this.sceneManager.flashLight.intensity = this.flashTimer * 6;
    } else {
      this.sceneManager.flashLight.intensity = 0;
    }
  }

  flash() {
    this.flashTimer = 1;
  }
}

class WicketAnimationController extends EventAnimationController {
  constructor(sceneManager, palette) {
    super(sceneManager, palette);
    this.fragmentVelocities = [];
    this.impactTriggered = false;
    this.setup();
  }

  setup() {
    const root = this.sceneManager.root;
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xff315d, emissive: 0x8f1026, emissiveIntensity: 1, metalness: 0.25, roughness: 0.36 })
    );
    root.add(this.ball);

    this.stumps = [];
    for (let i = 0; i < 3; i += 1) {
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 2.2, 12),
        new THREE.MeshStandardMaterial({ color: 0xe4b255, emissive: 0x5a3911, emissiveIntensity: 0.26, metalness: 0.3, roughness: 0.42 })
      );
      stump.position.set(-0.46 + i * 0.46, -1.4, 0);
      root.add(stump);
      this.stumps.push(stump);
    }

    this.fragments = [];
    for (let i = 0; i < 18; i += 1) {
      const fragment = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.34, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xe0b35f, emissive: 0x4c2f0d, emissiveIntensity: 0.18, metalness: 0.32, roughness: 0.44 })
      );
      fragment.visible = false;
      root.add(fragment);
      this.fragments.push(fragment);
      this.fragmentVelocities.push(new THREE.Vector3());
    }
  }

  trigger(context = {}) {
    super.trigger(context);
    this.impactTriggered = false;
    this.ball.position.set(-4.5, -0.7, 3.2);
    this.sceneManager.rimLight.color.setHex(this.palette.wicket);
    this.cameraController.moveTo(new THREE.Vector3(0, 0.8, 9.5), new THREE.Vector3(0, -0.5, 0));
    this.stumps.forEach((stump, index) => {
      stump.visible = true;
      stump.position.set(-0.46 + index * 0.46, -1.4, 0);
      stump.rotation.set(0, 0, 0);
    });
    this.fragments.forEach((fragment) => {
      fragment.visible = false;
      fragment.position.set(0, -1, 0);
      fragment.rotation.set(0, 0, 0);
    });
  }

  update(delta) {
    super.update(delta);
    if (!this.active) return;
    this.time += delta;

    const hitProgress = Math.min(1, this.time / 0.82);
    this.ball.position.set(
      THREE.MathUtils.lerp(-4.5, 0.12, hitProgress),
      THREE.MathUtils.lerp(-0.7, -0.62, hitProgress),
      THREE.MathUtils.lerp(3.2, 0.18, hitProgress)
    );

    if (!this.impactTriggered) {
      this.particles.spawnTrail(this.ball.position.clone(), this.palette.wicket, 0.7);
    }

    if (this.time > 0.56 && !this.impactTriggered) {
      this.impactTriggered = true;
      this.flash();
      this.cameraController.addShake(0.34);
      this.cameraController.moveTo(new THREE.Vector3(1.1, 1.4, 6.8), new THREE.Vector3(0, -0.55, 0));
      this.particles.spawnBurst(new THREE.Vector3(0, -0.55, 0), { color: this.palette.wicket, count: 280, spread: 12, lift: 11, life: 1.5, size: 0.2 });
      this.particles.spawnBurst(new THREE.Vector3(0, -0.55, 0), { color: 0xffffff, count: 120, spread: 7, lift: 7, life: 0.85, size: 0.12 });
      this.particles.spawnBurst(new THREE.Vector3(0, -1.5, 0), { color: 0xffb3c3, count: 90, spread: 8, lift: 4, depth: 2, life: 0.9, size: 0.15, gravity: 4 });
      this.particles.spawnShockwave(new THREE.Vector3(0, -2.48, 0), this.palette.wicket);
      this.particles.spawnShockwave(new THREE.Vector3(0, -2.45, 0), 0xffffff);
      this.stumps.forEach((stump) => { stump.visible = false; });
      this.fragments.forEach((fragment, index) => {
        fragment.visible = true;
        fragment.position.set((Math.random() - 0.5) * 0.6, -0.8 + Math.random() * 1.8, (Math.random() - 0.5) * 0.6);
        this.fragmentVelocities[index].set((Math.random() - 0.5) * 8.5, Math.random() * 9.5, (Math.random() - 0.5) * 5.5);
      });
    }

    if (this.impactTriggered) {
      this.fragments.forEach((fragment, index) => {
        const velocity = this.fragmentVelocities[index];
        fragment.position.addScaledVector(velocity, delta);
        fragment.rotation.x += delta * 9;
        fragment.rotation.y += delta * 7;
        velocity.y -= delta * 11.5;
        this.particles.spawnTrail(fragment.position.clone(), 0xffc7d3, 0.34);
      });
    }

    if (this.time > 2.05) {
      this.active = false;
    }
  }
}

class SixAnimationController extends EventAnimationController {
  constructor(sceneManager, palette) {
    super(sceneManager, palette);
    this.impactTriggered = false;
    this.setup();
  }

  setup() {
    const root = this.sceneManager.root;
    this.batPivot = new THREE.Group();
    this.batPivot.position.set(-0.7, -0.8, 0);
    root.add(this.batPivot);

    this.bat = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 2.5, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xc39854, emissive: 0x5c3a11, emissiveIntensity: 0.2, metalness: 0.18, roughness: 0.5 })
    );
    this.bat.position.set(0.2, 0.7, 0);
    this.bat.rotation.z = 0.35;
    this.batPivot.add(this.bat);

    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x7fd0ff, emissive: 0x2751d4, emissiveIntensity: 1.4, metalness: 0.18, roughness: 0.22 })
    );
    root.add(this.ball);
  }

  trigger(context = {}) {
    super.trigger(context);
    this.impactTriggered = false;
    this.ball.position.set(-2.8, -0.7, 2.1);
    this.batPivot.rotation.set(0, 0, -0.6);
    this.sceneManager.rimLight.color.setHex(this.palette.six);
    this.cameraController.moveTo(new THREE.Vector3(-1.5, 1.2, 8.5), new THREE.Vector3(0, -0.2, 0));
  }

  update(delta) {
    super.update(delta);
    if (!this.active) return;
    this.time += delta;

    const swing = Math.min(1, this.time / 0.55);
    this.batPivot.rotation.z = THREE.MathUtils.lerp(-0.6, 1.05, swing);
    this.ball.position.set(
      this.time < 0.46 ? THREE.MathUtils.lerp(-2.8, -0.15, this.time / 0.46) : THREE.MathUtils.lerp(-0.15, 6.2, Math.min(1, (this.time - 0.46) / 1.2)),
      this.time < 0.46 ? -0.7 : THREE.MathUtils.lerp(-0.7, 5.8, Math.min(1, (this.time - 0.46) / 1.2)),
      this.time < 0.46 ? THREE.MathUtils.lerp(2.1, 0.2, this.time / 0.46) : THREE.MathUtils.lerp(0.2, -7.2, Math.min(1, (this.time - 0.46) / 1.2))
    );

    if (this.time > 0.44 && !this.impactTriggered) {
      this.impactTriggered = true;
      this.flash();
      this.cameraController.addShake(0.12);
      this.particles.spawnBurst(new THREE.Vector3(-0.05, -0.7, 0.1), { color: this.palette.six, count: 220, spread: 8, lift: 8, life: 1.1, size: 0.16 });
      this.particles.spawnShockwave(new THREE.Vector3(-0.05, -2.46, 0), this.palette.six);
    }

    if (this.impactTriggered) {
      this.particles.spawnTrail(this.ball.position.clone(), this.palette.six, 1.05);
      this.cameraController.moveTo(
        new THREE.Vector3(this.ball.position.x * 0.36, 1.2 + this.ball.position.y * 0.2, 8.2 + Math.max(0, -this.ball.position.z) * 0.18),
        this.ball.position.clone()
      );
    }

    if (this.time > 1.8) {
      this.active = false;
    }
  }
}

class FourAnimationController extends EventAnimationController {
  constructor(sceneManager, palette) {
    super(sceneManager, palette);
    this.setup();
  }

  setup() {
    const root = this.sceneManager.root;
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xffc768, emissive: 0xb8620d, emissiveIntensity: 0.95, metalness: 0.12, roughness: 0.28 })
    );
    root.add(this.ball);
  }

  trigger(context = {}) {
    super.trigger(context);
    this.ball.position.set(-7.4, -2.15, 0.2);
    this.sceneManager.rimLight.color.setHex(this.palette.four);
    this.cameraController.moveTo(new THREE.Vector3(-4.2, -0.9, 4.2), new THREE.Vector3(-1.2, -2.15, 0));
  }

  update(delta) {
    super.update(delta);
    if (!this.active) return;
    this.time += delta;

    const travel = Math.min(1, this.time / 1.3);
    this.ball.position.x = THREE.MathUtils.lerp(-7.4, 8, travel);
    this.ball.position.y = -2.15 + Math.sin(travel * Math.PI * 8) * 0.05;
    this.ball.rotation.z -= delta * 16;
    this.ball.rotation.x += delta * 7;
    this.particles.spawnTrail(this.ball.position.clone(), this.palette.four, 0.85);

    if (this.time < 0.26) {
      this.flash();
      this.particles.spawnBurst(this.ball.position.clone(), { color: this.palette.four, count: 26, spread: 2.5, lift: 1.5, life: 0.35, size: 0.08, gravity: 1.4 });
    }

    this.cameraController.moveTo(
      new THREE.Vector3(this.ball.position.x - 2.6, -1.0, 4.2),
      new THREE.Vector3(this.ball.position.x + 1.8, -2.05, 0)
    );

    if (this.time > 1.35) {
      this.active = false;
    }
  }
}

class AnimationManager {
  constructor() {
    this.controllers = {};
  }

  register(name, controller) {
    this.controllers[name] = controller;
  }

  triggerAnimation(name, context) {
    this.controllers[name]?.trigger(context);
  }

  update(delta) {
    Object.values(this.controllers).forEach((controller) => controller.update(delta));
  }
}

class CricketGraphicsEngine {
  constructor() {
    this.ws = null;
    this.currentState = null;
    this.reconnectInterval = 3000;
    this.threeScenes = {};
    this.init();
  }

  init() {
    this.connectWebSocket();
    this.setupGraphics();
    this.setupResizeHandler();
    this.startAnimationLoop();
  }

  connectWebSocket() {
    this.syncClient = window.createGraphicsSyncClient({
      onMessage: (message) => this.handleMessage(message)
    });
  }

  handleMessage(message) {
    const { type, data } = message;

    if (type === 'init' || type === 'state_update') {
      this.currentState = data;
      this.renderAll();
      this.handleTriggers();
    }
  }

  setupGraphics() {
    this.layers = {
      scorebug: document.getElementById('scorebug'),
      fullScoreboard: document.getElementById('full-scoreboard'),
      battingCard: document.getElementById('batting-card'),
      playerStats: document.getElementById('player-stats'),
      bowlerStats: document.getElementById('bowler-stats'),
      matchSummary: document.getElementById('match-summary'),
      teamComparison: document.getElementById('team-comparison'),
      lowerThird: document.getElementById('lower-third'),
      wicketAnimation: document.getElementById('wicket-animation'),
      sixAnimation: document.getElementById('six-animation'),
      fourAnimation: document.getElementById('four-animation'),
      intro: document.getElementById('intro-layer')
    };

    this.setupThreeJS();
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      Object.values(this.threeScenes).forEach((sceneEntry) => {
        const { camera, renderer } = sceneEntry;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    });
  }

  setupThreeJS() {
    this.setupWicketScene();
    this.setupSixScene();
    this.setupFourScene();
    this.setupIntroScene();
  }

  setupWicketScene() {
    const canvas = document.getElementById('wicket-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i += 1) {
      velocities.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 20,
        z: (Math.random() - 0.5) * 20
      });
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xef4444,
      size: 3,
      transparent: true,
      opacity: 0.8
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    const light = new THREE.PointLight(0xef4444, 2, 100);
    light.position.set(0, 0, 10);
    scene.add(light);

    camera.position.z = 50;
    this.threeScenes.wicket = { scene, camera, renderer, particleSystem, velocities, particles };
  }

  setupSixScene() {
    const canvas = document.getElementById('six-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particleCount = 500;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 30;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      colors[i * 3] = 0.8 + Math.random() * 0.15;
      colors[i * 3 + 1] = 0.75 + Math.random() * 0.1;
      colors[i * 3 + 2] = 1;
      velocities.push({
        x: Math.cos(angle) * (2 + Math.random() * 3),
        y: Math.sin(angle) * (2 + Math.random() * 3),
        z: (Math.random() - 0.5) * 2
      });
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    camera.position.z = 100;
    this.threeScenes.six = { scene, camera, renderer, particleSystem, velocities, particles };
  }

  setupFourScene() {
    const canvas = document.getElementById('four-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffb22e,
      size: 2,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    camera.position.z = 80;
    this.threeScenes.four = { scene, camera, renderer, particleSystem, particles };
  }

  setupIntroScene() {
    const canvas = document.getElementById('intro-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particleCount = 140;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc8d4ff,
      size: 0.7,
      transparent: true,
      opacity: 0.12
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    camera.position.z = 50;
    this.threeScenes.intro = { scene, camera, renderer, particleSystem, particles };
  }

  startAnimationLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.updateThreeJSScenes();
    };
    animate();
  }

  updateThreeJSScenes() {
    if (this.threeScenes.wicket && !this.layers.wicketAnimation.classList.contains('hidden')) {
      const { scene, camera, renderer, particleSystem, velocities, particles } = this.threeScenes.wicket;
      const positions = particles.attributes.position.array;
      for (let i = 0; i < 200; i += 1) {
        positions[i * 3] += velocities[i].x * 0.1;
        positions[i * 3 + 1] += velocities[i].y * 0.1;
        positions[i * 3 + 2] += velocities[i].z * 0.1;
        velocities[i].y -= 0.1;
      }
      particles.attributes.position.needsUpdate = true;
      particleSystem.rotation.y += 0.01;
      renderer.render(scene, camera);
    }

    if (this.threeScenes.six && !this.layers.sixAnimation.classList.contains('hidden')) {
      const { scene, camera, renderer, particleSystem, velocities, particles } = this.threeScenes.six;
      const positions = particles.attributes.position.array;
      for (let i = 0; i < 500; i += 1) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;
      }
      particles.attributes.position.needsUpdate = true;
      particleSystem.rotation.z += 0.005;
      renderer.render(scene, camera);
    }

    if (this.threeScenes.four && !this.layers.fourAnimation.classList.contains('hidden')) {
      const { scene, camera, renderer, particles } = this.threeScenes.four;
      const positions = particles.attributes.position.array;
      for (let i = 0; i < 300; i += 1) {
        positions[i * 3] += 0.5;
        if (positions[i * 3] > 50) positions[i * 3] = -50;
      }
      particles.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }

    if (this.threeScenes.intro && !this.layers.intro.classList.contains('hidden')) {
      const { scene, camera, renderer, particleSystem } = this.threeScenes.intro;
      particleSystem.rotation.y += 0.002;
      particleSystem.rotation.x += 0.001;
      renderer.render(scene, camera);
    }
  }

  renderAll() {
    if (!this.currentState) {
      return;
    }

    const state = this.currentState;
    this.applyTheme(state);
    this.updateScorebug(state);
    this.updateWinPredictor(state);
    this.updateFullScoreboard(state);
    this.updateBattingCard(state);
    this.updatePlayerStats(state);
    this.updateBowlerStats(state);
    this.updateMatchSummary(state);
    this.updateTeamComparison(state);
    this.updateLowerThird(state);
    this.updateIntro(state);
    this.updateVisibility(state);
  }

  applyTheme(state) {
    document.documentElement.style.setProperty('--team-primary', state.battingTeam.color || '#004BA0');
    document.documentElement.style.setProperty('--team-secondary', state.bowlingTeam.color || '#F9CD05');
  }

  updateScorebug(state) {
    const bt = state.battingTeam;
    const bo = state.bowlingTeam;
    const striker = state.striker;
    const nonStriker = state.nonStriker;
    const bowler = state.bowler;

    document.getElementById('scorebug-team-name').textContent = bt.name.toUpperCase();
    document.getElementById('batting-score').textContent = `${bt.runs}-${bt.wickets}`;
    document.getElementById('batting-overs').textContent = `${Number(bt.overs).toFixed(1)} OV`;

    const rr = bt.overs > 0 ? (bt.runs / bt.overs).toFixed(2) : '0.00';
    const projected = bt.overs > 0 ? Math.round((bt.runs / bt.overs) * 20) : 0;
    const context = bo.runs > 0 ? `TARGET ${bo.runs + 1}` : `PROJECTED ${projected}`;
    document.getElementById('scorebug-context').textContent = context;
    document.getElementById('run-rate').textContent = `RR ${rr}`;
    document.getElementById('match-status').textContent = 'LIVE';

    document.getElementById('striker').querySelector('.batsman-name').textContent = striker.name;
    document.getElementById('striker').querySelector('.batsman-stats').textContent = `${striker.runs}* (${striker.balls})`;
    document.getElementById('non-striker').querySelector('.batsman-name').textContent = nonStriker.name;
    document.getElementById('non-striker').querySelector('.batsman-stats').textContent = `${nonStriker.runs} (${nonStriker.balls})`;
    document.getElementById('bowler-name').textContent = bowler.name.split(' ').pop();
    document.getElementById('bowler-figures').textContent = `${Number(bowler.overs).toFixed(1)}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}`;

    this.applyCircularMedia('batting-flag', bt.logoUrl, bt.shortName);
    this.renderBallRow(document.getElementById('this-over'), state.thisOver, 'ball');
  }

  updateWinPredictor(state) {
    const predictor = state.winPredictor || { team1: 50, team2: 50, label: 'Win Predictor' };
    const team1 = Math.max(0, Math.min(100, Number(predictor.team1) || 0));
    const team2 = Math.max(0, Math.min(100, Number(predictor.team2) || 0));
    const [team1Color1, team1Color2, team1Color3] = predictor.team1GradientColors || ['#7a0710', '#d61f2c', '#ff9a7a'];
    const [team2Color1, team2Color2, team2Color3] = predictor.team2GradientColors || ['#0f5a2a', '#17a34a', '#9af0b0'];
    const blendWidth = Math.min(12, Math.max(6, Math.round(Math.min(team1, team2) * 0.16)));
    const leftWidth = Math.max(0, team1 - blendWidth / 2);
    const rightWidth = Math.max(0, team2 - blendWidth / 2);

    document.querySelector('.predictor-kicker').textContent = predictor.label || 'Win Predictor';
    document.getElementById('wp-team1-text').textContent = `${state.battingTeam.shortName} ${Math.round(team1)}%`;
    document.getElementById('wp-team2-text').textContent = `${state.bowlingTeam.shortName} ${Math.round(team2)}%`;
    document.getElementById('wp-team1-fill').style.width = `${leftWidth}%`;
    document.getElementById('wp-team2-fill').style.width = `${rightWidth}%`;
    document.getElementById('wp-blend-zone').style.width = `${blendWidth}%`;
    document.getElementById('wp-team1-fill').style.background = `linear-gradient(90deg, ${team1Color1}, ${team1Color2} 55%, ${team1Color3})`;
    document.getElementById('wp-team2-fill').style.background = `linear-gradient(90deg, ${team2Color1}, ${team2Color2} 55%, ${team2Color3})`;
    document.getElementById('wp-blend-zone').style.background = `linear-gradient(90deg, ${team1Color3}, ${team2Color1})`;
  }

  updateFullScoreboard(state) {
    const bt = state.battingTeam;
    document.getElementById('fs-team-name').textContent = bt.name.toUpperCase();
    document.getElementById('fs-total').textContent = `${bt.runs}-${bt.wickets}`;
    document.getElementById('fs-overs').textContent = `${Number(bt.overs).toFixed(1)} Overs`;
    this.applyCircularMedia('fs-team-badge', bt.logoUrl, bt.shortName);

    const fsStriker = document.getElementById('fs-striker');
    fsStriker.querySelector('.name').innerHTML = `<span class="indicator">▶</span> ${state.striker.name}`;
    fsStriker.children[1].textContent = `${state.striker.runs}*`;
    fsStriker.children[2].textContent = state.striker.balls;
    fsStriker.children[3].textContent = state.striker.fours;
    fsStriker.children[4].textContent = state.striker.sixes;
    fsStriker.children[5].textContent = Number(state.striker.strikeRate).toFixed(2);

    const fsNonStriker = document.getElementById('fs-nonstriker');
    fsNonStriker.querySelector('.name').textContent = state.nonStriker.name;
    fsNonStriker.children[1].textContent = state.nonStriker.runs;
    fsNonStriker.children[2].textContent = state.nonStriker.balls;
    fsNonStriker.children[3].textContent = state.nonStriker.fours;
    fsNonStriker.children[4].textContent = state.nonStriker.sixes;
    fsNonStriker.children[5].textContent = Number(state.nonStriker.strikeRate).toFixed(2);

    document.getElementById('fs-partnership').textContent = `${state.partnership.runs} runs (${state.partnership.balls} balls)`;
    document.getElementById('fs-bowler').querySelector('.bowler-name-large').textContent = state.bowler.name;
    document.getElementById('fs-bowler').querySelector('.bowler-figures-large').textContent = `${Number(state.bowler.overs).toFixed(1)}-${state.bowler.maidens}-${state.bowler.runs}-${state.bowler.wickets}`;
    document.getElementById('fs-bowler').querySelector('.economy').textContent = `Econ: ${Number(state.bowler.economy).toFixed(2)}`;
  }

  updatePlayerStats(state) {
    const striker = state.striker;
    document.getElementById('ps-name').textContent = striker.name.toUpperCase();
    document.getElementById('ps-runs').textContent = striker.runs;
    document.getElementById('ps-balls').textContent = striker.balls;
    document.getElementById('ps-sr').textContent = Number(striker.strikeRate).toFixed(2);
    document.getElementById('ps-fours').textContent = striker.fours;
    document.getElementById('ps-sixes').textContent = striker.sixes;
    document.getElementById('ps-role').textContent = 'Batsman';
    document.getElementById('ps-team-stripe').style.background = `linear-gradient(90deg, ${state.battingTeam.color}, rgba(255,255,255,0.9), ${state.battingTeam.color})`;
    this.applyCircularMedia('ps-photo', striker.photoUrl, this.getInitials(striker.name));
  }

  updateBowlerStats(state) {
    const bowler = state.bowler;
    document.getElementById('bs-name').textContent = bowler.name.toUpperCase();
    document.getElementById('bs-team').textContent = state.bowlingTeam.name;
    document.getElementById('bs-overs').textContent = Number(bowler.overs).toFixed(1);
    document.getElementById('bs-runs').textContent = bowler.runs;
    document.getElementById('bs-wickets').textContent = bowler.wickets;
    document.getElementById('bs-econ').textContent = Number(bowler.economy).toFixed(2);
    document.getElementById('bs-dots').textContent = bowler.dots;
    this.renderBallRow(document.getElementById('bs-over-balls'), state.thisOver, 'ball-detail');
  }

  updateMatchSummary(state) {
    const bt = state.battingTeam;
    const bo = state.bowlingTeam;
    document.getElementById('sum-team1').querySelector('.sum-team-name').textContent = bt.name;
    document.getElementById('sum-team1').querySelector('.sum-team-score').textContent = `${bt.runs}-${bt.wickets}`;
    document.getElementById('sum-team1').querySelector('.sum-team-overs').textContent = `(${Number(bt.overs).toFixed(1)} ov)`;
    document.getElementById('sum-team2').querySelector('.sum-team-name').textContent = bo.name;
    document.getElementById('sum-team2').querySelector('.sum-team-score').textContent = bo.runs > 0 ? `${bo.runs}-${bo.wickets}` : 'Yet to bat';
    document.getElementById('sum-team2').querySelector('.sum-team-overs').textContent = bo.overs > 0 ? `(${Number(bo.overs).toFixed(1)} ov)` : '';

    const rr = bt.overs > 0 ? (bt.runs / bt.overs).toFixed(2) : '0.00';
    const projected = bt.overs > 0 ? Math.round((bt.runs / bt.overs) * 20) : 0;
    const boundaries = state.striker.fours + state.nonStriker.fours + state.striker.sixes + state.nonStriker.sixes;
    document.getElementById('sum-rr').textContent = rr;
    document.getElementById('sum-proj').textContent = projected;
    document.getElementById('sum-bounds').textContent = boundaries;
  }

  updateTeamComparison(state) {
    const bt = state.battingTeam;
    const bo = state.bowlingTeam;

    document.getElementById('comp-team1').querySelector('.comp-team-name').textContent = bt.name;
    document.getElementById('comp-team2').querySelector('.comp-team-name').textContent = bo.name;
    document.getElementById('comp-runs1').textContent = bt.runs;
    document.getElementById('comp-runs2').textContent = bo.runs;
    document.getElementById('comp-wickets1').textContent = bt.wickets;
    document.getElementById('comp-wickets2').textContent = bo.wickets;
    document.getElementById('comp-rr1').textContent = bt.overs > 0 ? (bt.runs / bt.overs).toFixed(2) : '0.00';
    document.getElementById('comp-rr2').textContent = bo.overs > 0 ? (bo.runs / bo.overs).toFixed(2) : '0.00';

    this.applyCircularMedia('comp-team1-badge', bt.logoUrl, bt.shortName);
    this.applyCircularMedia('comp-team2-badge', bo.logoUrl, bo.shortName);
  }

  updateLowerThird(state) {
    if (!state.lowerThirdData) {
      return;
    }

    document.getElementById('lt-name').textContent = state.lowerThirdData.name;
    document.getElementById('lt-info').textContent = state.lowerThirdData.info || '';
    this.applyCircularMedia('lt-photo', state.lowerThirdData.photoUrl, this.getInitials(state.lowerThirdData.name));
  }

  updateIntro(state) {
    document.getElementById('intro-match-type').textContent = `${state.matchType} CRICKET`;
    document.getElementById('intro-team1-name').textContent = state.battingTeam.name.toUpperCase();
    document.getElementById('intro-team2-name').textContent = state.bowlingTeam.name.toUpperCase();
    document.getElementById('intro-match-label').textContent = state.introData?.matchLabel || 'MATCH 3';
    document.getElementById('intro-venue').textContent = state.introData?.venueLine || `LIVE FROM ${String(state.venue || '').toUpperCase()}`;

    document.getElementById('intro-team1-logo').classList.remove('team-logo-fallback');
    document.getElementById('intro-team2-logo').classList.remove('team-logo-fallback');
    this.applyCircularMedia('intro-team1-logo', state.battingTeam.logoUrl, state.battingTeam.shortName);
    this.applyCircularMedia('intro-team2-logo', state.bowlingTeam.logoUrl, state.bowlingTeam.shortName);
  }

  updateBattingCard(state) {
    const card = state.battingCard || {};
    document.getElementById('bc-team-title').textContent = card.title || state.battingTeam.name.toUpperCase();
    document.getElementById('bc-team-subtitle').textContent = card.subtitle || 'BATTLE OF THE ROCKS';
    document.getElementById('bc-extras-display').textContent = card.extras ?? 0;
    document.getElementById('bc-overs-display').textContent = card.overs ?? '0.0';
    document.getElementById('bc-total-display').textContent = card.total || `${state.battingTeam.runs}-${state.battingTeam.wickets}`;
    this.applyCircularMedia('bc-team-badge', state.battingTeam.logoUrl, state.battingTeam.shortName);

    const container = document.getElementById('batting-card-rows');
    const players = Array.isArray(card.players) ? card.players : [];
    container.innerHTML = players.map((player) => `
      <div class="batting-card-row-display ${player.highlight ? 'highlight' : ''}">
        <div class="bc-player-name">${player.name || ''}</div>
        <div class="bc-player-status">${player.status || ''}</div>
        <div class="bc-player-runs">${player.runs ?? ''}</div>
        <div class="bc-player-balls">${player.balls ?? ''}</div>
      </div>
    `).join('');
  }

  renderBallRow(container, balls, className) {
    container.innerHTML = '';
    (balls || []).slice(-6).forEach((ball) => {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = ball;
      if (ball === '4' || ball === '4b') span.classList.add('boundary');
      if (ball === '6' || ball === '6b') span.classList.add('six');
      if (ball === 'W' || ball === 'Wb') span.classList.add('wicket');
      if (ball === 'Wd' || ball === 'Nb') span.classList.add('extra');
      container.appendChild(span);
    });
  }

  applyCircularMedia(elementId, url, fallback) {
    const element = document.getElementById(elementId);
    element.innerHTML = '';

    if (url) {
      element.style.backgroundImage = '';
      element.classList.add('has-image');
      const image = document.createElement('img');
      image.src = url;
      image.alt = fallback || 'logo';
      image.loading = 'eager';
      element.appendChild(image);
      return;
    }

    element.style.backgroundImage = '';
    element.classList.remove('has-image');
    const span = document.createElement('span');
    span.textContent = fallback || 'NA';
    element.appendChild(span);
  }

  getInitials(name) {
    return String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'NA';
  }

  updateVisibility(state) {
    this.toggleLayer('scorebug', state.showScorebug);
    this.toggleLayer('fullScoreboard', state.showFullScoreboard);
    this.toggleLayer('battingCard', state.showBattingCard);
    this.toggleLayer('playerStats', state.showPlayerStats);
    this.toggleLayer('bowlerStats', state.showBowlerStats);
    this.toggleLayer('matchSummary', state.showMatchSummary);
    this.toggleLayer('teamComparison', state.showTeamComparison);
    this.toggleLayer('lowerThird', state.showLowerThird);
    this.toggleLayer('wicketAnimation', state.showWicketAnimation);
    this.toggleLayer('sixAnimation', state.showSixAnimation);
    this.toggleLayer('fourAnimation', state.showFourAnimation);
    this.toggleLayer('intro', state.showIntro);
  }

  toggleLayer(layerName, visible) {
    const layer = this.layers[layerName];
    if (layer) {
      layer.classList.toggle('hidden', !visible);
    }
  }

  handleTriggers() {
    if (!this.currentState) {
      return;
    }

    if (this.currentState.showWicketAnimation) {
      this.triggerWicketAnimation();
    }
    if (this.currentState.showSixAnimation) {
      this.triggerSixAnimation();
    }
    if (this.currentState.showFourAnimation) {
      this.triggerFourAnimation();
    }
    if (this.currentState.showIntro) {
      this.triggerIntroAnimation();
    }
  }

  restartAnimations(selectors) {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.animation = 'none';
        void element.offsetHeight;
        element.style.animation = '';
      });
    });
  }

  triggerWicketAnimation() {
    if (this.currentState.lastWicket) {
      document.getElementById('wicket-player').textContent = this.currentState.lastWicket.player;
      document.getElementById('wicket-dismissal').textContent = `${this.currentState.lastWicket.dismissal} b ${this.currentState.lastWicket.bowler}`;
      document.getElementById('wicket-figures').textContent = `${this.currentState.lastWicket.runs} runs (${this.currentState.lastWicket.balls} balls)`;
    }

    if (this.threeScenes.wicket) {
      const { particles, velocities } = this.threeScenes.wicket;
      const positions = particles.attributes.position.array;

      for (let i = 0; i < 200; i += 1) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        velocities[i].x = (Math.random() - 0.5) * 20;
        velocities[i].y = Math.random() * 20;
        velocities[i].z = (Math.random() - 0.5) * 20;
      }

      particles.attributes.position.needsUpdate = true;
    }

    this.restartAnimations([
      '.wicket-kicker',
      '.stump',
      '.bail-left',
      '.bail-right',
      '.wicket-ball-trail',
      '.wicket-ball-impact',
      '.wicket-shockring',
      '.wicket-slash',
      '.wicket-text'
    ]);
  }

  triggerSixAnimation() {
    document.getElementById('six-player').textContent = this.currentState.striker.name;

    if (this.threeScenes.six) {
      const { particles, velocities } = this.threeScenes.six;
      const positions = particles.attributes.position.array;

      for (let i = 0; i < 500; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 30;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        velocities[i].x = Math.cos(angle) * (2 + Math.random() * 3);
        velocities[i].y = Math.sin(angle) * (2 + Math.random() * 3);
        velocities[i].z = (Math.random() - 0.5) * 2;
      }

      particles.attributes.position.needsUpdate = true;
    }

    this.restartAnimations([
      '.six-kicker',
      '.six-grid',
      '.six-halo',
      '.six-orbit-ring',
      '.orbit-secondary',
      '.six-ball-flight',
      '.six-comet-tail',
      '.six-number',
      '.six-text'
    ]);
  }

  triggerFourAnimation() {
    document.getElementById('four-player').textContent = this.currentState.striker.name;

    this.restartAnimations([
      '.four-kicker',
      '.four-scan',
      '.four-lane',
      '.four-ball-dash',
      '.four-number',
      '.four-text'
    ]);
  }

  triggerIntroAnimation() {
    this.restartAnimations([
      '.ring-a',
      '.ring-b',
      '.ring-c',
      '.team-left .team-logo',
      '.team-right .team-logo',
      '.intro-team-name.top',
      '.intro-team-name.bottom',
      '.intro-match-label',
      '.venue'
    ]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.graphicsEngine = new CricketGraphicsEngine();
});
