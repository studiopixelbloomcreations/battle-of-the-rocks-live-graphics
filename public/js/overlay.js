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

    const particleCount = 1000;
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
      size: 1.2,
      transparent: true,
      opacity: 0.45
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
    document.getElementById('intro-venue').textContent = state.venue.toUpperCase();

    this.applyCircularMedia('intro-team1-logo', state.battingTeam.logoUrl, state.battingTeam.shortName);
    this.applyCircularMedia('intro-team2-logo', state.bowlingTeam.logoUrl, state.bowlingTeam.shortName);
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
      element.style.backgroundImage = `url("${url}")`;
      element.classList.add('has-image');
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
    }

    this.restartAnimations([
      '.stump',
      '.bail-left',
      '.bail-right',
      '.wicket-ball-trail',
      '.wicket-ball-impact',
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
    }

    this.restartAnimations([
      '.six-orbit-ring',
      '.six-ball-flight',
      '.six-number',
      '.six-text'
    ]);
  }

  triggerFourAnimation() {
    document.getElementById('four-player').textContent = this.currentState.striker.name;
    this.restartAnimations([
      '.four-lane',
      '.four-ball-dash',
      '.four-number',
      '.four-text'
    ]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.graphicsEngine = new CricketGraphicsEngine();
});
