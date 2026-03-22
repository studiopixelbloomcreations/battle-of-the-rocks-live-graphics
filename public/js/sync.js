(function () {
  const STORAGE_KEY = 'big-match-live-graphic-station-state';
  const CHANNEL_KEY = 'big-match-live-graphic-station-channel';

  const DEFAULT_STATE = {
    matchType: 'T20',
    venue: 'Wankhede Stadium',
    battingTeam: {
      name: 'Maliyadeva College',
      shortName: 'MCC',
      color: '#d61f2c',
      secondaryColor: '#D1AB3E',
      logoUrl: '/uploads/team1_logo_1774120217186.png',
      runs: 142,
      wickets: 3,
      overs: 14.2,
      totalOvers: 20
    },
    bowlingTeam: {
      name: "St Anne's College",
      shortName: 'SAC',
      color: '#17a34a',
      secondaryColor: '#008ECE',
      logoUrl: '/uploads/team2_logo_1774120324627.png',
      runs: 0,
      wickets: 0,
      overs: 0,
      totalOvers: 20
    },
    striker: {
      name: 'Rohit Sharma',
      runs: 58,
      balls: 32,
      fours: 5,
      sixes: 3,
      strikeRate: 181.25,
      isStriker: true,
      photoUrl: ''
    },
    nonStriker: {
      name: 'Suryakumar Yadav',
      runs: 42,
      balls: 28,
      fours: 3,
      sixes: 2,
      strikeRate: 150.0,
      isStriker: false,
      photoUrl: ''
    },
    bowler: {
      name: 'Deepak Chahar',
      overs: 3.2,
      maidens: 0,
      runs: 28,
      wickets: 1,
      economy: 8.4,
      dots: 8,
      balls: 20
    },
    winPredictor: {
      team1: 68,
      team2: 32,
      label: 'Win Predictor',
      team1GradientColors: ['#7a0710', '#d61f2c', '#ff9a7a'],
      team2GradientColors: ['#0f5a2a', '#17a34a', '#9af0b0']
    },
    thisOver: ['1', '4', '6', '0', 'W', '1'],
    partnership: { runs: 87, balls: 52 },
    lastWicket: null,
    lastEvent: null,
    lowerThirdData: {
      name: 'Rohit Sharma',
      info: 'Captain, Mumbai Indians',
      photoUrl: ''
    },
    showScorebug: true,
    showFullScoreboard: false,
    showPlayerStats: false,
    showBowlerStats: false,
    showMatchSummary: false,
    showTeamComparison: false,
    showLowerThird: false,
    showWicketAnimation: false,
    showSixAnimation: false,
    showFourAnimation: false,
    showIntro: false
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function deepMerge(base, incoming) {
    if (!isPlainObject(base) || !isPlainObject(incoming)) {
      return incoming === undefined ? clone(base) : incoming;
    }

    const result = clone(base);
    Object.keys(incoming).forEach((key) => {
      const baseValue = result[key];
      const incomingValue = incoming[key];

      if (isPlainObject(baseValue) && isPlainObject(incomingValue)) {
        result[key] = deepMerge(baseValue, incomingValue);
      } else {
        result[key] = incomingValue;
      }
    });
    return result;
  }

  function getConfiguredWebSocketUrl() {
    const queryValue = new URLSearchParams(window.location.search).get('ws');
    if (queryValue) return queryValue;
    if (window.BIG_MATCH_CONFIG?.websocketUrl) return window.BIG_MATCH_CONFIG.websocketUrl;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }

  function getConfiguredApiBaseUrl() {
    if (window.BIG_MATCH_CONFIG?.apiBaseUrl) return window.BIG_MATCH_CONFIG.apiBaseUrl;
    const wsUrl = getConfiguredWebSocketUrl();
    if (wsUrl.startsWith('ws://')) return wsUrl.replace('ws://', 'http://').replace(/\/ws$/, '');
    if (wsUrl.startsWith('wss://')) return wsUrl.replace('wss://', 'https://').replace(/\/ws$/, '');
    return window.location.origin;
  }

  function hasSupabaseConfig() {
    return Boolean(window.BIG_MATCH_CONFIG?.supabaseUrl && window.BIG_MATCH_CONFIG?.supabaseAnonKey && window.supabase?.createClient);
  }

  function dataUrlToBlob(dataUrl) {
    const [meta, base64] = dataUrl.split(',');
    const mime = meta.match(/data:(.*?);base64/)?.[1] || 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { blob: new Blob([bytes], { type: mime }), mime };
  }

  function loadStaticState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return clone(DEFAULT_STATE);
      return deepMerge(DEFAULT_STATE, JSON.parse(stored));
    } catch (error) {
      console.error('Failed to load stored state:', error);
      return clone(DEFAULT_STATE);
    }
  }

  function persistStaticState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyMessageToState(state, message, scheduleReset) {
    const next = clone(state);
    const { type, data } = message;

    switch (type) {
      case 'update_score':
        if (data.battingTeam) Object.assign(next.battingTeam, data.battingTeam);
        if (data.bowlingTeam) Object.assign(next.bowlingTeam, data.bowlingTeam);
        if (data.venue) next.venue = data.venue;
        if (data.matchType) next.matchType = data.matchType;
        if (data.thisOver) next.thisOver = data.thisOver;
        next.lastEvent = 'score_update';
        break;
      case 'update_batsman':
        if (data.striker) Object.assign(next.striker, data.striker);
        if (data.nonStriker) Object.assign(next.nonStriker, data.nonStriker);
        if (data.partnership) Object.assign(next.partnership, data.partnership);
        next.lastEvent = 'batsman_update';
        break;
      case 'update_predictor':
        if (data.winPredictor) {
          next.winPredictor = {
            ...next.winPredictor,
            ...data.winPredictor
          };
        }
        next.lastEvent = 'predictor_update';
        break;
      case 'update_media':
        if (data.battingTeam) Object.assign(next.battingTeam, data.battingTeam);
        if (data.bowlingTeam) Object.assign(next.bowlingTeam, data.bowlingTeam);
        if (data.striker) Object.assign(next.striker, data.striker);
        if (data.nonStriker) Object.assign(next.nonStriker, data.nonStriker);
        if (data.lowerThirdData) {
          next.lowerThirdData = {
            ...next.lowerThirdData,
            ...data.lowerThirdData
          };
        }
        next.lastEvent = 'media_update';
        break;
      case 'update_bowler':
        if (data.bowler) Object.assign(next.bowler, data.bowler);
        next.lastEvent = 'bowler_update';
        break;
      case 'wicket':
        next.battingTeam.wickets += 1;
        next.lastWicket = {
          player: data.player || next.striker.name,
          runs: data.runs || next.striker.runs,
          balls: data.balls || next.striker.balls,
          bowler: data.bowler || next.bowler.name,
          dismissal: data.dismissal || 'caught'
        };
        next.bowler.wickets += 1;
        next.showWicketAnimation = true;
        next.lastEvent = 'wicket';
        scheduleReset({ showWicketAnimation: false }, 5000);
        break;
      case 'six':
        next.showSixAnimation = true;
        next.striker.sixes += 1;
        next.striker.runs += 6;
        next.battingTeam.runs += 6;
        next.thisOver = [...next.thisOver, '6'].slice(-6);
        next.lastEvent = 'six';
        scheduleReset({ showSixAnimation: false }, 4000);
        break;
      case 'four':
        next.showFourAnimation = true;
        next.striker.fours += 1;
        next.striker.runs += 4;
        next.battingTeam.runs += 4;
        next.thisOver = [...next.thisOver, '4'].slice(-6);
        next.lastEvent = 'four';
        scheduleReset({ showFourAnimation: false }, 3000);
        break;
      case 'toggle_scorebug':
        next.showScorebug = data.visible;
        break;
      case 'toggle_fullscoreboard':
        next.showFullScoreboard = data.visible;
        break;
      case 'toggle_playerstats':
        next.showPlayerStats = data.visible;
        break;
      case 'toggle_bowlerstats':
        next.showBowlerStats = data.visible;
        break;
      case 'toggle_matchsummary':
        next.showMatchSummary = data.visible;
        break;
      case 'toggle_teamcomparison':
        next.showTeamComparison = data.visible;
        break;
      case 'toggle_lowerthird':
        next.showLowerThird = data.visible;
        if (data.player) {
          next.lowerThirdData = {
            ...next.lowerThirdData,
            ...data.player
          };
        }
        break;
      case 'show_intro':
        next.showIntro = true;
        scheduleReset({ showIntro: false }, 8000);
        break;
      case 'reset_match':
        next.battingTeam.runs = 0;
        next.battingTeam.wickets = 0;
        next.battingTeam.overs = 0;
        next.bowlingTeam.runs = 0;
        next.bowlingTeam.wickets = 0;
        next.bowlingTeam.overs = 0;
        next.striker = {
          name: data.striker?.name || 'Player 1',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isStriker: true,
          photoUrl: next.striker.photoUrl || ''
        };
        next.nonStriker = {
          name: data.nonStriker?.name || 'Player 2',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isStriker: false,
          photoUrl: next.nonStriker.photoUrl || ''
        };
        next.bowler = {
          name: data.bowler?.name || 'Bowler',
          overs: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          economy: 0,
          dots: 0,
          balls: 0
        };
        next.thisOver = [];
        next.winPredictor = { ...next.winPredictor, team1: 0, team2: 0 };
        next.partnership = { runs: 0, balls: 0 };
        next.lastWicket = null;
        next.showLowerThird = false;
        next.showPlayerStats = false;
        next.showBowlerStats = false;
        next.showFullScoreboard = false;
        next.showMatchSummary = false;
        next.showTeamComparison = false;
        break;
      default:
        break;
    }

    return next;
  }

  class UnifiedSyncClient {
    constructor(options) {
      this.onMessage = options.onMessage;
      this.onConnectionChange = options.onConnectionChange || (() => {});
      this.mode = 'connecting';
      this.socket = null;
      this.channel = null;
      this.state = null;
      this.fallbackStarted = false;
      this.init();
    }

    init() {
      if (hasSupabaseConfig()) {
        this.startSupabaseMode();
        return;
      }
      this.tryWebSocket();
      setTimeout(() => {
        if (this.mode === 'connecting') {
          this.startStaticMode();
        }
      }, 1400);
    }

    async startSupabaseMode() {
      try {
        this.mode = 'supabase';
        window.__graphicsSyncTransport = 'supabase';
        this.supabase = window.supabase.createClient(
          window.BIG_MATCH_CONFIG.supabaseUrl,
          window.BIG_MATCH_CONFIG.supabaseAnonKey
        );

        const table = window.BIG_MATCH_CONFIG.supabaseStateTable || 'graphic_state';
        const rowId = window.BIG_MATCH_CONFIG.supabaseStateRowId || 'main';
        const { data, error } = await this.supabase
          .from(table)
          .select('state')
          .eq('id', rowId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (!data) {
          this.state = clone(DEFAULT_STATE);
          await this.supabase.from(table).upsert({ id: rowId, state: this.state });
        } else {
          this.state = deepMerge(DEFAULT_STATE, data.state || {});
          await this.supabase.from(table).upsert({ id: rowId, state: this.state });
        }

        this.channel = this.supabase
          .channel('graphics-state-channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table,
              filter: `id=eq.${rowId}`
            },
            (payload) => {
              if (payload.new?.state) {
                this.state = deepMerge(DEFAULT_STATE, payload.new.state || {});
                this.onMessage({ type: 'state_update', data: this.state });
              }
            }
          )
          .subscribe();

        this.onConnectionChange(true, 'supabase');
        this.onMessage({ type: 'init', data: this.state });
      } catch (error) {
        console.error('Supabase mode failed, falling back:', error);
        this.mode = 'connecting';
        this.tryWebSocket();
        setTimeout(() => {
          if (this.mode === 'connecting') {
            this.startStaticMode();
          }
        }, 1400);
      }
    }

    tryWebSocket() {
      try {
        this.socket = new WebSocket(getConfiguredWebSocketUrl());
        this.socket.onopen = () => {
          if (this.mode === 'static') {
            return;
          }
          this.mode = 'ws';
          window.__graphicsSyncTransport = 'ws';
          this.onConnectionChange(true, 'ws');
        };
        this.socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.state = message.data;
          this.onMessage(message);
        };
        this.socket.onclose = () => {
          if (this.mode !== 'static') {
            this.startStaticMode();
          }
        };
        this.socket.onerror = () => {
          if (this.mode !== 'static') {
            this.startStaticMode();
          }
        };
      } catch (error) {
        this.startStaticMode();
      }
    }

    startStaticMode() {
      if (this.fallbackStarted) {
        return;
      }
      this.fallbackStarted = true;
      this.mode = 'static';
      window.__graphicsSyncTransport = 'static';
      this.state = loadStaticState();
      persistStaticState(this.state);

      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(CHANNEL_KEY);
        this.channel.onmessage = (event) => {
          if (!event.data) return;
          this.state = event.data.data;
          this.onMessage(event.data);
        };
      }

      window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY || !event.newValue) return;
        this.state = JSON.parse(event.newValue);
        this.onMessage({ type: 'state_update', data: this.state });
      });

      this.onConnectionChange(true, 'static');
      this.onMessage({ type: 'init', data: this.state });
    }

    send(message) {
      if (this.mode === 'supabase' && this.supabase) {
        const nextState = applyMessageToState(this.state || loadStaticState(), message, (patch, delay) => {
          window.setTimeout(async () => {
            this.state = deepMerge(this.state || DEFAULT_STATE, patch);
            this.onMessage({ type: 'state_update', data: this.state });
            await this.supabase
              .from(window.BIG_MATCH_CONFIG.supabaseStateTable || 'graphic_state')
              .update({ state: this.state, updated_at: new Date().toISOString() })
              .eq('id', window.BIG_MATCH_CONFIG.supabaseStateRowId || 'main');
          }, delay);
        });

        this.state = nextState;
        this.onMessage({ type: 'state_update', data: this.state });
        this.supabase
          .from(window.BIG_MATCH_CONFIG.supabaseStateTable || 'graphic_state')
          .update({ state: this.state, updated_at: new Date().toISOString() })
          .eq('id', window.BIG_MATCH_CONFIG.supabaseStateRowId || 'main');
        return;
      }

      if (this.mode === 'ws' && this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
        return;
      }

      if (this.mode !== 'static') {
        this.startStaticMode();
      }

      const nextState = applyMessageToState(this.state || loadStaticState(), message, (patch, delay) => {
        window.setTimeout(() => {
          this.state = { ...(this.state || {}), ...patch };
          persistStaticState(this.state);
          this.emitStatic({ type: 'state_update', data: this.state });
        }, delay);
      });

      this.state = nextState;
      persistStaticState(this.state);
      this.emitStatic({ type: 'state_update', data: this.state });
    }

    emitStatic(message) {
      this.onMessage(message);
      if (this.channel) {
        this.channel.postMessage(message);
      }
    }
  }

  window.createGraphicsSyncClient = function (options) {
    return new UnifiedSyncClient(options);
  };

  window.saveGraphicAsset = async function (imageData, fileName) {
    if (window.__graphicsSyncTransport === 'supabase' && hasSupabaseConfig()) {
      const { blob, mime } = dataUrlToBlob(imageData);
      const extension = mime.split('/')[1] || 'png';
      const storagePath = `graphics/${fileName}_${Date.now()}.${extension}`;
      const bucket = window.BIG_MATCH_CONFIG.supabaseStorageBucket || 'graphics-assets';
      const supabaseClient = window.supabase.createClient(
        window.BIG_MATCH_CONFIG.supabaseUrl,
        window.BIG_MATCH_CONFIG.supabaseAnonKey
      );

      const { error } = await supabaseClient.storage.from(bucket).upload(storagePath, blob, {
        contentType: mime,
        upsert: true
      });

      if (error) {
        throw error;
      }

      const { data } = supabaseClient.storage.from(bucket).getPublicUrl(storagePath);
      return { url: data.publicUrl };
    }

    if (window.__graphicsSyncTransport === 'static') {
      return { url: imageData };
    }

    const response = await fetch(`${getConfiguredApiBaseUrl()}/api/upload-cropped-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, fileName })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }
    return result;
  };
})();
