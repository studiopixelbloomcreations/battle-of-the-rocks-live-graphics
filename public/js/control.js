const TEAM_INSTANCES = {
  'maliyadeva': {
    name: 'Maliyadeva College',
    shortName: 'MCC',
    color: '#d61f2c',
    logoUrl: '/uploads/team1_logo_1774120217186.png'
  },
  'st-annes': {
    name: "St Anne's College",
    shortName: 'SAC',
    color: '#17a34a',
    logoUrl: '/uploads/team2_logo_1774120324627.png'
  }
};

class ControlPanel {
  constructor() {
    this.ws = null;
    this.currentOver = ['1', '4', '6', '0', 'W', '1'];
    this.currentState = null;
    this.reconnectInterval = 3000;
    this.isConnected = false;
    this.cropper = {
      modal: null,
      canvas: null,
      ctx: null,
      fileInput: null,
      zoomInput: null,
      title: null,
      image: null,
      target: null,
      scale: 1,
      minScale: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      startOffsetX: 0,
      startOffsetY: 0
    };
    this.mediaTargets = {
      'team1-logo': {
        title: 'Crop Team 1 Logo',
        fileName: 'team1_logo',
        buildMessage: (url) => ({ battingTeam: { logoUrl: url } })
      },
      'team2-logo': {
        title: 'Crop Team 2 Logo',
        fileName: 'team2_logo',
        buildMessage: (url) => ({ bowlingTeam: { logoUrl: url } })
      },
      'striker-photo': {
        title: 'Crop Striker Portrait',
        fileName: 'striker_photo',
        buildMessage: (url) => ({ striker: { photoUrl: url } })
      },
      'nonstriker-photo': {
        title: 'Crop Non-Striker Portrait',
        fileName: 'nonstriker_photo',
        buildMessage: (url) => ({ nonStriker: { photoUrl: url } })
      },
      'lowerthird-photo': {
        title: 'Crop Lower Third Portrait',
        fileName: 'lower_third_photo',
        buildMessage: (url) => ({ lowerThirdData: { photoUrl: url } })
      }
    };
    this.init();
  }

  init() {
    this.connectWebSocket();
    this.setupEventListeners();
    this.setupCropper();
    this.setupInstanceSelectors();
    this.renderBalls();
  }

  connectWebSocket() {
    this.syncClient = window.createGraphicsSyncClient({
      onMessage: (message) => this.handleMessage(message),
      onConnectionChange: (connected, mode) => {
        this.isConnected = connected;
        this.updateConnectionStatus(connected, mode);
      }
    });
  }

  handleMessage(message) {
    if (message.type === 'init' || message.type === 'state_update') {
      this.currentState = message.data;
      this.syncFormFromState(message.type === 'init');
      this.renderMediaPreviews();
    }
  }

  send(message) {
    if (this.syncClient) {
      this.syncClient.send(message);
    } else {
      showNotification('Connection not ready yet', true);
    }
  }

  updateConnectionStatus(connected, mode = 'ws') {
    const statusEl = document.getElementById('connection-status');
    const textEl = statusEl.querySelector('.status-text');
    statusEl.classList.toggle('connected', connected);
    textEl.textContent = connected ? (mode === 'static' ? 'Static Sync' : 'Connected') : 'Disconnected';
  }

  setupEventListeners() {
    document.querySelectorAll('input').forEach((input) => {
      input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          event.target.blur();
        }
      });
    });

    document.querySelectorAll('[data-media-target]').forEach((button) => {
      button.addEventListener('click', () => this.openCropper(button.dataset.mediaTarget));
    });
  }

  setupInstanceSelectors() {
    const battingSelect = document.getElementById('batting-instance');
    const bowlingSelect = document.getElementById('bowling-instance');

    const handleSelectionChange = (source) => {
      if (battingSelect.value === bowlingSelect.value) {
        const alternate = Object.keys(TEAM_INSTANCES).find((key) => key !== battingSelect.value) || battingSelect.value;
        if (source === 'batting') {
          bowlingSelect.value = alternate;
        } else {
          battingSelect.value = alternate;
        }
      }

      this.applyInstanceToFields('batting', battingSelect.value);
      this.applyInstanceToFields('bowling', bowlingSelect.value);
      updateMatchSetup();
    };

    battingSelect.addEventListener('change', () => handleSelectionChange('batting'));
    bowlingSelect.addEventListener('change', () => handleSelectionChange('bowling'));
  }

  applyInstanceToFields(side, instanceKey) {
    const config = TEAM_INSTANCES[instanceKey];
    if (!config) {
      return;
    }

    if (side === 'batting') {
      document.getElementById('team1-name').value = config.name;
      document.getElementById('team1-short').value = config.shortName;
      document.getElementById('team1-color').value = config.color;
      this.updateMediaPreview('team1-logo-preview', config.logoUrl, config.shortName);
    } else {
      document.getElementById('team2-name').value = config.name;
      document.getElementById('team2-short').value = config.shortName;
      document.getElementById('team2-color').value = config.color;
      this.updateMediaPreview('team2-logo-preview', config.logoUrl, config.shortName);
    }
  }

  syncInstanceSelectors(state) {
    const battingSelect = document.getElementById('batting-instance');
    const bowlingSelect = document.getElementById('bowling-instance');
    battingSelect.value = this.getInstanceKeyForName(state.battingTeam.name) || battingSelect.value;
    bowlingSelect.value = this.getInstanceKeyForName(state.bowlingTeam.name) || bowlingSelect.value;
  }

  getInstanceKeyForName(name) {
    return Object.entries(TEAM_INSTANCES).find(([, config]) => config.name === name)?.[0] || '';
  }

  syncFormFromState(forceAll = false) {
    if (!this.currentState) {
      return;
    }

    const state = this.currentState;

    if (forceAll) {
      document.getElementById('team1-name').value = state.battingTeam.name;
      document.getElementById('team1-short').value = state.battingTeam.shortName;
      document.getElementById('team1-color').value = state.battingTeam.color;
      document.getElementById('team2-name').value = state.bowlingTeam.name;
      document.getElementById('team2-short').value = state.bowlingTeam.shortName;
      document.getElementById('team2-color').value = state.bowlingTeam.color;
      document.getElementById('match-venue').value = state.venue;
      document.getElementById('match-type').value = state.matchType;
      document.getElementById('lt-name-input').value = state.lowerThirdData?.name || '';
      document.getElementById('lt-info-input').value = state.lowerThirdData?.info || '';
      document.getElementById('wp-label').value = state.winPredictor?.label || 'Win Predictor';
      this.syncInstanceSelectors(state);
    }

    this.currentOver = Array.isArray(state.thisOver) ? [...state.thisOver] : [];
    this.renderBalls();

    document.getElementById('batting-runs').value = state.battingTeam.runs;
    document.getElementById('batting-wickets').value = state.battingTeam.wickets;
    document.getElementById('batting-overs').value = state.battingTeam.overs;
    document.getElementById('bowling-runs').value = state.bowlingTeam.runs;
    document.getElementById('bowling-wickets').value = state.bowlingTeam.wickets;
    document.getElementById('bowling-overs').value = state.bowlingTeam.overs;

    document.getElementById('striker-name').value = state.striker.name;
    document.getElementById('striker-runs').value = state.striker.runs;
    document.getElementById('striker-balls').value = state.striker.balls;
    document.getElementById('striker-fours').value = state.striker.fours;
    document.getElementById('striker-sixes').value = state.striker.sixes;

    document.getElementById('nonstriker-name').value = state.nonStriker.name;
    document.getElementById('nonstriker-runs').value = state.nonStriker.runs;
    document.getElementById('nonstriker-balls').value = state.nonStriker.balls;
    document.getElementById('nonstriker-fours').value = state.nonStriker.fours;
    document.getElementById('nonstriker-sixes').value = state.nonStriker.sixes;

    document.getElementById('partnership-runs').value = state.partnership.runs;
    document.getElementById('partnership-balls').value = state.partnership.balls;

    document.getElementById('bowler-name').value = state.bowler.name;
    document.getElementById('bowler-overs').value = state.bowler.overs;
    document.getElementById('bowler-maidens').value = state.bowler.maidens;
    document.getElementById('bowler-runs').value = state.bowler.runs;
    document.getElementById('bowler-wickets').value = state.bowler.wickets;
    document.getElementById('bowler-dots').value = state.bowler.dots;
    document.getElementById('wp-team1').value = Math.round(state.winPredictor?.team1 ?? 50);
    document.getElementById('wp-team2').value = Math.round(state.winPredictor?.team2 ?? 50);
    document.getElementById('wp-label').value = state.winPredictor?.label || 'Win Predictor';
    document.getElementById('wp-team1-color-1').value = state.winPredictor?.team1GradientColors?.[0] || '#7a0710';
    document.getElementById('wp-team1-color-2').value = state.winPredictor?.team1GradientColors?.[1] || '#d61f2c';
    document.getElementById('wp-team1-color-3').value = state.winPredictor?.team1GradientColors?.[2] || '#ff9a7a';
    document.getElementById('wp-team2-color-1').value = state.winPredictor?.team2GradientColors?.[0] || '#0f5a2a';
    document.getElementById('wp-team2-color-2').value = state.winPredictor?.team2GradientColors?.[1] || '#17a34a';
    document.getElementById('wp-team2-color-3').value = state.winPredictor?.team2GradientColors?.[2] || '#9af0b0';

    document.getElementById('toggle-scorebug').checked = state.showScorebug;
    document.getElementById('toggle-fullscoreboard').checked = state.showFullScoreboard;
    document.getElementById('toggle-playerstats').checked = state.showPlayerStats;
    document.getElementById('toggle-bowlerstats').checked = state.showBowlerStats;
    document.getElementById('toggle-matchsummary').checked = state.showMatchSummary;
    document.getElementById('toggle-teamcomparison').checked = state.showTeamComparison;
    document.getElementById('toggle-lowerthird').checked = state.showLowerThird;
  }

  renderBalls() {
    const container = document.getElementById('balls-grid');
    container.innerHTML = '';

    this.currentOver.forEach((ball, index) => {
      const div = document.createElement('div');
      div.className = 'ball-item';
      div.textContent = ball;

      if (ball === '4' || ball === '4b') div.classList.add('boundary');
      if (ball === '6' || ball === '6b') div.classList.add('six');
      if (ball === 'W' || ball === 'Wb') div.classList.add('wicket');
      if (ball === 'Wd' || ball === 'Nb') div.classList.add('extra');

      div.addEventListener('click', () => this.removeBall(index));
      container.appendChild(div);
    });
  }

  removeBall(index) {
    this.currentOver.splice(index, 1);
    this.renderBalls();
    updateScore();
  }

  renderMediaPreviews() {
    if (!this.currentState) {
      return;
    }

    this.updateMediaPreview(
      'team1-logo-preview',
      this.currentState.battingTeam.logoUrl,
      this.currentState.battingTeam.shortName || 'T1'
    );
    this.updateMediaPreview(
      'team2-logo-preview',
      this.currentState.bowlingTeam.logoUrl,
      this.currentState.bowlingTeam.shortName || 'T2'
    );
    this.updateMediaPreview(
      'striker-photo-preview',
      this.currentState.striker.photoUrl,
      this.getInitials(this.currentState.striker.name)
    );
    this.updateMediaPreview(
      'nonstriker-photo-preview',
      this.currentState.nonStriker.photoUrl,
      this.getInitials(this.currentState.nonStriker.name)
    );
    this.updateMediaPreview(
      'lowerthird-photo-preview',
      this.currentState.lowerThirdData?.photoUrl,
      this.getInitials(this.currentState.lowerThirdData?.name || 'LT')
    );
  }

  updateMediaPreview(elementId, imageUrl, fallbackText) {
    const element = document.getElementById(elementId);
    element.innerHTML = '';

    if (imageUrl) {
      element.style.backgroundImage = `url("${imageUrl}")`;
      element.classList.add('has-image');
      return;
    }

    element.style.backgroundImage = '';
    element.classList.remove('has-image');
    const span = document.createElement('span');
    span.textContent = fallbackText;
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

  setupCropper() {
    this.cropper.modal = document.getElementById('cropper-modal');
    this.cropper.canvas = document.getElementById('cropper-canvas');
    this.cropper.ctx = this.cropper.canvas.getContext('2d');
    this.cropper.fileInput = document.getElementById('cropper-file-input');
    this.cropper.zoomInput = document.getElementById('cropper-zoom');
    this.cropper.title = document.getElementById('cropper-title');

    document.getElementById('cropper-close').addEventListener('click', () => this.closeCropper());
    document.getElementById('cropper-backdrop').addEventListener('click', () => this.closeCropper());
    document.getElementById('cropper-reset').addEventListener('click', () => this.resetCropperView());
    document.getElementById('cropper-save').addEventListener('click', () => this.saveCroppedImage());
    this.cropper.fileInput.addEventListener('change', (event) => this.loadCropperFile(event));
    this.cropper.zoomInput.addEventListener('input', (event) => {
      this.cropper.scale = parseFloat(event.target.value);
      this.drawCropper();
    });

    this.cropper.canvas.addEventListener('mousedown', (event) => this.startDrag(event));
    window.addEventListener('mousemove', (event) => this.onDrag(event));
    window.addEventListener('mouseup', () => this.stopDrag());

    this.cropper.canvas.addEventListener('touchstart', (event) => this.startDrag(event.touches[0]));
    window.addEventListener('touchmove', (event) => {
      if (this.cropper.isDragging) {
        this.onDrag(event.touches[0]);
      }
    }, { passive: true });
    window.addEventListener('touchend', () => this.stopDrag());

    this.drawCropperPlaceholder();
  }

  openCropper(target) {
    const config = this.mediaTargets[target];
    if (!config) {
      return;
    }

    this.cropper.target = target;
    this.cropper.title.textContent = config.title;
    this.cropper.modal.classList.remove('hidden');
    this.cropper.fileInput.value = '';
    this.resetCropperView();
    this.drawCropper();
  }

  closeCropper() {
    this.cropper.modal.classList.add('hidden');
    this.cropper.target = null;
  }

  async loadCropperFile(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      this.cropper.image = image;
      this.resetCropperView();
      this.drawCropper();
    };
    image.src = URL.createObjectURL(file);
  }

  resetCropperView() {
    const image = this.cropper.image;
    const canvas = this.cropper.canvas;

    if (!image) {
      this.cropper.scale = 1;
      this.cropper.offsetX = 0;
      this.cropper.offsetY = 0;
      this.cropper.zoomInput.value = '1';
      this.drawCropperPlaceholder();
      return;
    }

    const fitScale = Math.max(canvas.width / image.width, canvas.height / image.height);
    this.cropper.minScale = fitScale;
    this.cropper.scale = fitScale;
    this.cropper.zoomInput.min = fitScale.toFixed(2);
    this.cropper.zoomInput.max = Math.max(fitScale * 3, fitScale + 1).toFixed(2);
    this.cropper.zoomInput.value = fitScale.toFixed(2);
    this.cropper.offsetX = 0;
    this.cropper.offsetY = 0;
  }

  drawCropperPlaceholder() {
    const { ctx, canvas } = this.cropper;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#08111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 20px Exo 2';
    ctx.textAlign = 'center';
    ctx.fillText('Choose an image to start cropping', canvas.width / 2, canvas.height / 2 + 8);
  }

  drawCropper() {
    if (!this.cropper.image) {
      this.drawCropperPlaceholder();
      return;
    }

    const { canvas, ctx, image } = this.cropper;
    const scale = this.cropper.scale;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (canvas.width - drawWidth) / 2 + this.cropper.offsetX;
    const y = (canvas.height - drawHeight) / 2 + this.cropper.offsetY;
    const circleRadius = canvas.width * 0.34;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#08111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    ctx.save();
    ctx.fillStyle = 'rgba(3, 8, 17, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.78)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  startDrag(event) {
    if (!this.cropper.image) {
      return;
    }

    this.cropper.isDragging = true;
    this.cropper.dragStartX = event.clientX;
    this.cropper.dragStartY = event.clientY;
    this.cropper.startOffsetX = this.cropper.offsetX;
    this.cropper.startOffsetY = this.cropper.offsetY;
  }

  onDrag(event) {
    if (!this.cropper.isDragging) {
      return;
    }

    this.cropper.offsetX = this.cropper.startOffsetX + (event.clientX - this.cropper.dragStartX);
    this.cropper.offsetY = this.cropper.startOffsetY + (event.clientY - this.cropper.dragStartY);
    this.drawCropper();
  }

  stopDrag() {
    this.cropper.isDragging = false;
  }

  async saveCroppedImage() {
    const targetKey = this.cropper.target;
    const target = this.mediaTargets[targetKey];

    if (!this.cropper.image || !target) {
      showNotification('Select an image before saving', true);
      return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 720;
    exportCanvas.height = 720;
    const exportCtx = exportCanvas.getContext('2d');
    const displayCanvas = this.cropper.canvas;
    const image = this.cropper.image;
    const scaleRatio = exportCanvas.width / displayCanvas.width;
    const scaledWidth = image.width * this.cropper.scale * scaleRatio;
    const scaledHeight = image.height * this.cropper.scale * scaleRatio;
    const scaledX = ((displayCanvas.width - image.width * this.cropper.scale) / 2 + this.cropper.offsetX) * scaleRatio;
    const scaledY = ((displayCanvas.height - image.height * this.cropper.scale) / 2 + this.cropper.offsetY) * scaleRatio;

    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.beginPath();
    exportCtx.arc(exportCanvas.width / 2, exportCanvas.height / 2, exportCanvas.width / 2, 0, Math.PI * 2);
    exportCtx.closePath();
    exportCtx.clip();
    exportCtx.drawImage(image, scaledX, scaledY, scaledWidth, scaledHeight);

    const imageData = exportCanvas.toDataURL('image/png');

    try {
      const result = await window.saveGraphicAsset(imageData, target.fileName);

      this.send({
        type: 'update_media',
        data: target.buildMessage(result.url)
      });
      showNotification('Image cropped and applied');
      this.closeCropper();
    } catch (error) {
      console.error(error);
      showNotification('Image upload failed', true);
    }
  }
}

const controlPanel = new ControlPanel();

function updateMatchSetup() {
  const battingInstance = TEAM_INSTANCES[document.getElementById('batting-instance').value];
  const bowlingInstance = TEAM_INSTANCES[document.getElementById('bowling-instance').value];
  const data = {
    battingTeam: {
      name: document.getElementById('team1-name').value,
      shortName: document.getElementById('team1-short').value,
      color: document.getElementById('team1-color').value,
      logoUrl: battingInstance?.logoUrl || controlPanel.currentState?.battingTeam?.logoUrl || ''
    },
    bowlingTeam: {
      name: document.getElementById('team2-name').value,
      shortName: document.getElementById('team2-short').value,
      color: document.getElementById('team2-color').value,
      logoUrl: bowlingInstance?.logoUrl || controlPanel.currentState?.bowlingTeam?.logoUrl || ''
    },
    venue: document.getElementById('match-venue').value,
    matchType: document.getElementById('match-type').value
  };

  controlPanel.send({ type: 'update_score', data });
  showNotification('Match setup updated');
}

function updateScore() {
  const data = {
    battingTeam: {
      runs: parseInt(document.getElementById('batting-runs').value, 10),
      wickets: parseInt(document.getElementById('batting-wickets').value, 10),
      overs: parseFloat(document.getElementById('batting-overs').value)
    },
    bowlingTeam: {
      runs: parseInt(document.getElementById('bowling-runs').value, 10),
      wickets: parseInt(document.getElementById('bowling-wickets').value, 10),
      overs: parseFloat(document.getElementById('bowling-overs').value)
    },
    thisOver: controlPanel.currentOver
  };

  controlPanel.send({ type: 'update_score', data });
  showNotification('Score updated');
}

function updateWinPredictor() {
  const team1 = Math.max(0, Math.min(100, parseInt(document.getElementById('wp-team1').value, 10) || 0));
  const team2 = Math.max(0, Math.min(100, parseInt(document.getElementById('wp-team2').value, 10) || 0));
  const total = team1 + team2 || 1;
  const normalizedTeam1 = Math.round((team1 / total) * 100);
  const normalizedTeam2 = 100 - normalizedTeam1;
  const team1GradientColors = [
    document.getElementById('wp-team1-color-1').value,
    document.getElementById('wp-team1-color-2').value,
    document.getElementById('wp-team1-color-3').value
  ];
  const team2GradientColors = [
    document.getElementById('wp-team2-color-1').value,
    document.getElementById('wp-team2-color-2').value,
    document.getElementById('wp-team2-color-3').value
  ];

  document.getElementById('wp-team1').value = normalizedTeam1;
  document.getElementById('wp-team2').value = normalizedTeam2;

  controlPanel.send({
    type: 'update_predictor',
    data: {
      winPredictor: {
        team1: normalizedTeam1,
        team2: normalizedTeam2,
        label: document.getElementById('wp-label').value || 'Win Predictor',
        team1GradientColors,
        team2GradientColors
      }
    }
  });
  showNotification('Win predictor updated');
}

function autoWinPredictor() {
  const runs = parseInt(document.getElementById('batting-runs').value, 10) || 0;
  const wickets = parseInt(document.getElementById('batting-wickets').value, 10) || 0;
  const overs = parseFloat(document.getElementById('batting-overs').value) || 0;
  const oppositionRuns = parseInt(document.getElementById('bowling-runs').value, 10) || 0;
  const phaseFactor = Math.min(1, overs / 20);
  const scoringFactor = Math.min(1, runs / 220);
  const wicketPenalty = wickets * 0.045;
  const chasePressure = oppositionRuns > 0 ? Math.max(-0.12, Math.min(0.12, (runs - oppositionRuns) / 220)) : 0;
  let team1 = Math.round((0.5 + phaseFactor * 0.16 + scoringFactor * 0.18 + chasePressure - wicketPenalty) * 100);
  team1 = Math.max(5, Math.min(95, team1));
  document.getElementById('wp-team1').value = team1;
  document.getElementById('wp-team2').value = 100 - team1;
  updateWinPredictor();
}

function updateBatsmen() {
  const strikerRuns = parseInt(document.getElementById('striker-runs').value, 10);
  const strikerBalls = parseInt(document.getElementById('striker-balls').value, 10);
  const nonStrikerRuns = parseInt(document.getElementById('nonstriker-runs').value, 10);
  const nonStrikerBalls = parseInt(document.getElementById('nonstriker-balls').value, 10);

  const data = {
    striker: {
      name: document.getElementById('striker-name').value,
      runs: strikerRuns,
      balls: strikerBalls,
      fours: parseInt(document.getElementById('striker-fours').value, 10),
      sixes: parseInt(document.getElementById('striker-sixes').value, 10),
      strikeRate: strikerBalls > 0 ? Number(((strikerRuns / strikerBalls) * 100).toFixed(2)) : 0,
      isStriker: true
    },
    nonStriker: {
      name: document.getElementById('nonstriker-name').value,
      runs: nonStrikerRuns,
      balls: nonStrikerBalls,
      fours: parseInt(document.getElementById('nonstriker-fours').value, 10),
      sixes: parseInt(document.getElementById('nonstriker-sixes').value, 10),
      strikeRate: nonStrikerBalls > 0 ? Number(((nonStrikerRuns / nonStrikerBalls) * 100).toFixed(2)) : 0,
      isStriker: false
    },
    partnership: {
      runs: parseInt(document.getElementById('partnership-runs').value, 10),
      balls: parseInt(document.getElementById('partnership-balls').value, 10)
    }
  };

  controlPanel.send({ type: 'update_batsman', data });
  showNotification('Batsmen updated');
}

function updateBowler() {
  const overs = parseFloat(document.getElementById('bowler-overs').value);
  const runs = parseInt(document.getElementById('bowler-runs').value, 10);

  const data = {
    bowler: {
      name: document.getElementById('bowler-name').value,
      overs,
      maidens: parseInt(document.getElementById('bowler-maidens').value, 10),
      runs,
      wickets: parseInt(document.getElementById('bowler-wickets').value, 10),
      dots: parseInt(document.getElementById('bowler-dots').value, 10),
      economy: overs > 0 ? Number((runs / overs).toFixed(2)) : 0
    }
  };

  controlPanel.send({ type: 'update_bowler', data });
  showNotification('Bowler updated');
}

function addBall(ball) {
  controlPanel.currentOver.push(ball);
  if (controlPanel.currentOver.length > 6) {
    controlPanel.currentOver.shift();
  }
  controlPanel.renderBalls();
  updateScore();
}

function clearOver() {
  controlPanel.currentOver = [];
  controlPanel.renderBalls();
  updateScore();
}

function triggerWicket() {
  const data = {
    player: document.getElementById('striker-name').value,
    runs: parseInt(document.getElementById('striker-runs').value, 10),
    balls: parseInt(document.getElementById('striker-balls').value, 10),
    bowler: document.getElementById('bowler-name').value,
    dismissal: 'caught'
  };

  controlPanel.send({ type: 'wicket', data });
  showNotification('Wicket triggered');
}

function triggerSix() {
  controlPanel.send({ type: 'six', data: {} });
  showNotification('Six animation triggered');
}

function triggerFour() {
  controlPanel.send({ type: 'four', data: {} });
  showNotification('Four animation triggered');
}

function triggerIntro() {
  controlPanel.send({ type: 'show_intro', data: {} });
  showNotification('Match intro triggered');
}

function toggleGraphic(type) {
  const checkbox = document.getElementById(`toggle-${type}`);
  controlPanel.send({
    type: `toggle_${type}`,
    data: { visible: checkbox.checked }
  });
}

function showLowerThird() {
  const data = {
    name: document.getElementById('lt-name-input').value,
    info: document.getElementById('lt-info-input').value,
    photoUrl: controlPanel.currentState?.lowerThirdData?.photoUrl || ''
  };

  controlPanel.send({ type: 'toggle_lowerthird', data: { visible: true, player: data } });
  document.getElementById('toggle-lowerthird').checked = true;
  showNotification('Lower third displayed');
}

function resetMatch() {
  if (!confirm('Are you sure you want to reset the match? Scores will be cleared.')) {
    return;
  }

  controlPanel.send({
    type: 'reset_match',
    data: {
      striker: { name: document.getElementById('striker-name').value },
      nonStriker: { name: document.getElementById('nonstriker-name').value },
      bowler: { name: document.getElementById('bowler-name').value }
    }
  });
  document.getElementById('wp-team1').value = 0;
  document.getElementById('wp-team2').value = 0;
  clearOver();
  showNotification('Match reset');
}

function showNotification(message, isError = false) {
  const notif = document.createElement('div');
  notif.className = `toast ${isError ? 'error' : ''}`;
  notif.textContent = message;
  document.body.appendChild(notif);

  requestAnimationFrame(() => notif.classList.add('visible'));

  setTimeout(() => {
    notif.classList.remove('visible');
    setTimeout(() => notif.remove(), 300);
  }, 2600);
}
