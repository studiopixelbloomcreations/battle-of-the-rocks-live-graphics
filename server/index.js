const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const publicDir = path.join(__dirname, '../public');
const uploadsDir = path.join(publicDir, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

let matchState = {
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
    strikeRate: 150.00,
    isStriker: false,
    photoUrl: ''
  },
  bowler: {
    name: 'Deepak Chahar',
    overs: 3.2,
    maidens: 0,
    runs: 28,
    wickets: 1,
    economy: 8.40,
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

const wss = new WebSocket.Server({ server, path: '/ws' });
const clients = new Set();

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'init', data: matchState }));
  
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      handleMessage(ws, parsed);
    } catch (err) {
      console.error('Invalid message:', err);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

function handleMessage(ws, message) {
  const { type, data } = message;
  
  switch (type) {
    case 'update_score':
      if (data.battingTeam) Object.assign(matchState.battingTeam, data.battingTeam);
      if (data.bowlingTeam) Object.assign(matchState.bowlingTeam, data.bowlingTeam);
      if (data.venue) matchState.venue = data.venue;
      if (data.matchType) matchState.matchType = data.matchType;
      if (data.thisOver) matchState.thisOver = data.thisOver;
      matchState.lastEvent = 'score_update';
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'update_batsman':
      if (data.striker) Object.assign(matchState.striker, data.striker);
      if (data.nonStriker) Object.assign(matchState.nonStriker, data.nonStriker);
      if (data.partnership) Object.assign(matchState.partnership, data.partnership);
      matchState.lastEvent = 'batsman_update';
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'update_predictor':
      if (data.winPredictor) {
        matchState.winPredictor = {
          ...matchState.winPredictor,
          ...data.winPredictor
        };
      }
      matchState.lastEvent = 'predictor_update';
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'update_media':
      if (data.battingTeam) Object.assign(matchState.battingTeam, data.battingTeam);
      if (data.bowlingTeam) Object.assign(matchState.bowlingTeam, data.bowlingTeam);
      if (data.striker) Object.assign(matchState.striker, data.striker);
      if (data.nonStriker) Object.assign(matchState.nonStriker, data.nonStriker);
      if (data.lowerThirdData) {
        matchState.lowerThirdData = {
          ...matchState.lowerThirdData,
          ...data.lowerThirdData
        };
      }
      matchState.lastEvent = 'media_update';
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'update_bowler':
      if (data.bowler) Object.assign(matchState.bowler, data.bowler);
      matchState.lastEvent = 'bowler_update';
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'wicket':
      matchState.battingTeam.wickets++;
      matchState.lastWicket = {
        player: data.player || matchState.striker.name,
        runs: data.runs || matchState.striker.runs,
        balls: data.balls || matchState.striker.balls,
        bowler: data.bowler || matchState.bowler.name,
        dismissal: data.dismissal || 'caught'
      };
      matchState.bowler.wickets++;
      matchState.showWicketAnimation = true;
      matchState.lastEvent = 'wicket';
      broadcast({ type: 'state_update', data: matchState });
      setTimeout(() => {
        matchState.showWicketAnimation = false;
        broadcast({ type: 'state_update', data: matchState });
      }, 5000);
      break;
    case 'six':
      matchState.showSixAnimation = true;
      matchState.striker.sixes++;
      matchState.striker.runs += 6;
      matchState.battingTeam.runs += 6;
      matchState.thisOver.push('6');
      matchState.lastEvent = 'six';
      broadcast({ type: 'state_update', data: matchState });
      setTimeout(() => {
        matchState.showSixAnimation = false;
        broadcast({ type: 'state_update', data: matchState });
      }, 4000);
      break;
    case 'four':
      matchState.showFourAnimation = true;
      matchState.striker.fours++;
      matchState.striker.runs += 4;
      matchState.battingTeam.runs += 4;
      matchState.thisOver.push('4');
      matchState.lastEvent = 'four';
      broadcast({ type: 'state_update', data: matchState });
      setTimeout(() => {
        matchState.showFourAnimation = false;
        broadcast({ type: 'state_update', data: matchState });
      }, 3000);
      break;
    case 'toggle_scorebug':
      matchState.showScorebug = data.visible;
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'toggle_fullscoreboard':
      matchState.showFullScoreboard = data.visible;
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'toggle_playerstats':
      matchState.showPlayerStats = data.visible;
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'toggle_bowlerstats':
      matchState.showBowlerStats = data.visible;
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'toggle_matchsummary':
      matchState.showMatchSummary = data.visible;
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'toggle_teamcomparison':
      matchState.showTeamComparison = data.visible;
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'toggle_lowerthird':
      matchState.showLowerThird = data.visible;
      if (data.player) {
        matchState.lowerThirdData = {
          ...matchState.lowerThirdData,
          ...data.player
        };
      }
      broadcast({ type: 'state_update', data: matchState });
      break;
    case 'show_intro':
      matchState.showIntro = true;
      broadcast({ type: 'state_update', data: matchState });
      setTimeout(() => {
        matchState.showIntro = false;
        broadcast({ type: 'state_update', data: matchState });
      }, 8000);
      break;
    case 'reset_match':
      matchState.battingTeam.runs = 0;
      matchState.battingTeam.wickets = 0;
      matchState.battingTeam.overs = 0;
      matchState.bowlingTeam.runs = 0;
      matchState.bowlingTeam.wickets = 0;
      matchState.bowlingTeam.overs = 0;
      matchState.striker = { name: data.striker?.name || 'Player 1', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, isStriker: true, photoUrl: matchState.striker.photoUrl || '' };
      matchState.nonStriker = { name: data.nonStriker?.name || 'Player 2', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0, isStriker: false, photoUrl: matchState.nonStriker.photoUrl || '' };
      matchState.bowler = { name: data.bowler?.name || 'Bowler', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0, dots: 0, balls: 0 };
      matchState.thisOver = [];
      matchState.winPredictor = { ...matchState.winPredictor, team1: 0, team2: 0 };
      matchState.partnership = { runs: 0, balls: 0 };
      matchState.lastWicket = null;
      matchState.showLowerThird = false;
      matchState.showPlayerStats = false;
      matchState.showBowlerStats = false;
      matchState.showFullScoreboard = false;
      matchState.showMatchSummary = false;
      matchState.showTeamComparison = false;
      broadcast({ type: 'state_update', data: matchState });
      break;
    default:
      console.log('Unknown message type:', type);
  }
}

app.get('/api/state', (req, res) => {
  res.json(matchState);
});

app.post('/api/upload-cropped-image', async (req, res) => {
  try {
    const { imageData, fileName } = req.body || {};

    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Valid imageData data URL is required.' });
    }

    const match = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Unsupported image format.' });
    }

    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    const safeName = (fileName || 'graphic-asset')
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'graphic-asset';
    const outputName = `${safeName}_${Date.now()}.${extension}`;
    const filePath = path.join(uploadsDir, outputName);

    await fsp.writeFile(filePath, Buffer.from(match[2], 'base64'));

    res.json({ url: `/uploads/${outputName}` });
  } catch (error) {
    console.error('Image upload failed:', error);
    res.status(500).json({ error: 'Failed to save cropped image.' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Cricket Broadcast Server running on port ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Graphics Output: http://localhost:${PORT}/overlay.html`);
  console.log(`Control Panel: http://localhost:${PORT}/control.html`);
});
