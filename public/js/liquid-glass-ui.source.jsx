import React from 'react';
import { createRoot } from 'react-dom/client';
import LiquidGlass from 'liquid-glass-react';

function GlassShell({
  className,
  cornerRadius,
  displacementScale,
  blurAmount,
  saturation,
  aberrationIntensity,
  elasticity,
  mode = 'polar',
  children
}) {
  return (
    <LiquidGlass
      className={className}
      displacementScale={displacementScale}
      blurAmount={blurAmount}
      saturation={saturation}
      aberrationIntensity={aberrationIntensity}
      elasticity={elasticity}
      cornerRadius={cornerRadius}
      mode={mode}
      padding="0px"
    >
      {children}
    </LiquidGlass>
  );
}

function ScorebugGlass() {
  return (
    <div className="scorebug-container">
      <GlassShell
        className="scorebug-liquid-shell"
        displacementScale={78}
        blurAmount={0.08}
        saturation={145}
        aberrationIntensity={1.6}
        elasticity={0.18}
        cornerRadius={34}
      >
        <div className="scorebug-glass">
          <div className="scorebug-chrome chrome-a"></div>
          <div className="scorebug-chrome chrome-b"></div>
          <div className="scorebug-main-row">
            <div className="team-section batting">
              <div className="team-flag circular-media" id="batting-flag"><span>MI</span></div>
              <div className="team-info">
                <span className="team-nameplate" id="scorebug-team-name">MUMBAI INDIANS</span>
                <div className="team-scoreline">
                  <span className="team-score" id="batting-score">142-3</span>
                  <span className="team-overs" id="batting-overs">14.2 OV</span>
                </div>
              </div>
            </div>

            <div className="scorebug-center">
              <div className="match-topline">
                <div className="match-chip" id="scorebug-context">PROJECTED 199</div>
                <div className="match-chip soft" id="run-rate">RR 9.95</div>
                <div className="match-status" id="match-status">LIVE</div>
              </div>
              <div className="batsmen-section">
                <div className="batsman striker" id="striker">
                  <span className="batsman-name">Rohit Sharma</span>
                  <span className="batsman-stats">58* (32)</span>
                </div>
                <div className="batsman non-striker" id="non-striker">
                  <span className="batsman-name">Suryakumar Y</span>
                  <span className="batsman-stats">42 (28)</span>
                </div>
              </div>
            </div>

            <div className="scorebug-side">
              <div className="bowler-section">
                <div className="bowler-label">Bowler</div>
                <div className="bowler-name" id="bowler-name">Chahar</div>
                <div className="bowler-figures" id="bowler-figures">3.2-0-28-1</div>
              </div>
              <div className="this-over">
                <div className="over-label">This Over</div>
                <div className="over-balls" id="this-over"></div>
              </div>
            </div>
          </div>

          <div className="win-predictor-inline">
            <div className="win-predictor-head">
              <span className="predictor-kicker">Win Predictor</span>
              <div className="predictor-values">
                <span id="wp-team1-text">MI 68%</span>
                <span className="predictor-divider">|</span>
                <span id="wp-team2-text">CSK 32%</span>
              </div>
            </div>
            <div className="win-predictor-track">
              <div className="predictor-fill predictor-fill-team1" id="wp-team1-fill"></div>
              <div className="predictor-blend-zone" id="wp-blend-zone"></div>
              <div className="predictor-fill predictor-fill-team2" id="wp-team2-fill"></div>
            </div>
          </div>
        </div>
      </GlassShell>
    </div>
  );
}

function FullScoreboardGlass() {
  return (
    <GlassShell
      className="scoreboard-liquid-shell"
      displacementScale={74}
      blurAmount={0.078}
      saturation={144}
      aberrationIntensity={1.45}
      elasticity={0.16}
      cornerRadius={30}
    >
      <div className="scoreboard-panel">
        <div className="panel-header">
          <div className="header-accent"></div>
          <div className="team-badge-large circular-media" id="fs-team-badge"><span>MI</span></div>
          <div className="team-title" id="fs-team-name">MUMBAI INDIANS</div>
          <div className="total-score" id="fs-total">142-3</div>
          <div className="overs-display" id="fs-overs">14.2 Overs</div>
        </div>
        <div className="batsmen-table">
          <div className="table-header"><span>Batsman</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span></div>
          <div className="batsman-row striker" id="fs-striker"><span className="name"><span className="indicator">▶</span> Rohit Sharma</span><span className="runs highlight">58*</span><span>32</span><span>5</span><span>3</span><span>181.25</span></div>
          <div className="batsman-row" id="fs-nonstriker"><span className="name">Suryakumar Yadav</span><span className="runs">42</span><span>28</span><span>3</span><span>2</span><span>150.00</span></div>
        </div>
        <div className="partnership-bar"><div className="partnership-label">Partnership</div><div className="partnership-value" id="fs-partnership">87 runs (52 balls)</div></div>
        <div className="bowler-section-full">
          <div className="bowler-header">Current Bowler</div>
          <div className="bowler-row" id="fs-bowler"><span className="bowler-name-large">Deepak Chahar</span><span className="bowler-figures-large">3.2-0-28-1</span><span className="economy">Econ: 8.40</span></div>
        </div>
      </div>
    </GlassShell>
  );
}

function BattingCardGlass() {
  return (
    <GlassShell
      className="batting-card-liquid-shell"
      displacementScale={68}
      blurAmount={0.07}
      saturation={138}
      aberrationIntensity={1.2}
      elasticity={0.12}
      cornerRadius={28}
    >
      <div className="batting-card-shell">
        <div className="batting-card-corner"></div>
        <div className="batting-card-header">
          <div className="batting-card-badge circular-media" id="bc-team-badge"><span>MI</span></div>
          <div className="batting-card-header-copy">
            <div className="batting-card-title" id="bc-team-title">MALIYADEVA COLLEGE</div>
            <div className="batting-card-subtitle" id="bc-team-subtitle">LIVE BATTING CARD</div>
          </div>
          <div className="batting-card-columns">
            <span>RUNS</span>
            <span>BALLS</span>
          </div>
        </div>
        <div className="batting-card-table-head">
          <span>BATTER</span>
          <span>STATUS</span>
          <span>RUNS</span>
          <span>BALLS</span>
        </div>
        <div className="batting-card-rows" id="batting-card-rows"></div>
        <div className="batting-card-footer">
          <div className="batting-card-meta"><span>EXTRAS</span><strong id="bc-extras-display">14</strong></div>
          <div className="batting-card-meta"><span>OVERS</span><strong id="bc-overs-display">23.5</strong></div>
          <div className="batting-card-meta total"><span>TOTAL</span><strong id="bc-total-display">225-5</strong></div>
        </div>
      </div>
    </GlassShell>
  );
}

function PlayerStatsGlass() {
  return (
    <GlassShell
      className="player-liquid-shell"
      displacementScale={72}
      blurAmount={0.078}
      saturation={142}
      aberrationIntensity={1.45}
      elasticity={0.14}
      cornerRadius={34}
    >
      <div className="player-panel">
        <div className="player-visual">
          <div className="player-photo-container">
            <div className="player-glow"></div>
            <div className="player-photo circular-media" id="ps-photo"><span>RS</span></div>
          </div>
          <div className="player-team-stripe" id="ps-team-stripe"></div>
        </div>
        <div className="player-info">
          <div className="player-name-large" id="ps-name">ROHIT SHARMA</div>
          <div className="player-role" id="ps-role">Batsman</div>
          <div className="player-stats-grid">
            <div className="stat-box"><div className="stat-value" id="ps-runs">58</div><div className="stat-label">Runs</div></div>
            <div className="stat-box"><div className="stat-value" id="ps-balls">32</div><div className="stat-label">Balls</div></div>
            <div className="stat-box"><div className="stat-value highlight" id="ps-sr">181.25</div><div className="stat-label">Strike Rate</div></div>
            <div className="stat-box"><div className="stat-value boundary" id="ps-fours">5</div><div className="stat-label">Fours</div></div>
            <div className="stat-box"><div className="stat-value six" id="ps-sixes">3</div><div className="stat-label">Sixes</div></div>
          </div>
        </div>
      </div>
    </GlassShell>
  );
}

function BowlerStatsGlass() {
  return (
    <GlassShell
      className="bowler-liquid-shell"
      displacementScale={72}
      blurAmount={0.078}
      saturation={142}
      aberrationIntensity={1.45}
      elasticity={0.14}
      cornerRadius={28}
    >
      <div className="bowler-panel">
        <div className="bowler-header-section"><div className="bowler-icon">CR</div><div className="bowler-title">Current Bowler</div></div>
        <div className="bowler-main"><div className="bowler-name-highlight" id="bs-name">DEEPAK CHAHAR</div><div className="bowler-team" id="bs-team">Chennai Super Kings</div></div>
        <div className="bowler-stats-row">
          <div className="bowler-stat"><div className="bowler-stat-value" id="bs-overs">3.2</div><div className="bowler-stat-label">Overs</div></div>
          <div className="bowler-stat"><div className="bowler-stat-value" id="bs-runs">28</div><div className="bowler-stat-label">Runs</div></div>
          <div className="bowler-stat highlight"><div className="bowler-stat-value" id="bs-wickets">1</div><div className="bowler-stat-label">Wickets</div></div>
          <div className="bowler-stat"><div className="bowler-stat-value" id="bs-econ">8.40</div><div className="bowler-stat-label">Economy</div></div>
          <div className="bowler-stat"><div className="bowler-stat-value" id="bs-dots">8</div><div className="bowler-stat-label">Dots</div></div>
        </div>
        <div className="this-over-detail"><div className="over-label-detail">This Over</div><div className="over-balls-detail" id="bs-over-balls"></div></div>
      </div>
    </GlassShell>
  );
}

function MatchSummaryGlass() {
  return (
    <GlassShell
      className="summary-liquid-shell"
      displacementScale={72}
      blurAmount={0.078}
      saturation={142}
      aberrationIntensity={1.45}
      elasticity={0.14}
      cornerRadius={34}
    >
      <div className="summary-container">
        <div className="summary-header">Match Summary</div>
        <div className="summary-content">
          <div className="summary-team" id="sum-team1"><div className="sum-team-name">Mumbai Indians</div><div className="sum-team-score">142-3</div><div className="sum-team-overs">(14.2 ov)</div></div>
          <div className="summary-vs">VS</div>
          <div className="summary-team" id="sum-team2"><div className="sum-team-name">Chennai Super Kings</div><div className="sum-team-score">Yet to bat</div><div className="sum-team-overs"></div></div>
        </div>
        <div className="summary-stats">
          <div className="summary-stat"><div className="ss-label">Run Rate</div><div className="ss-value" id="sum-rr">9.95</div></div>
          <div className="summary-stat"><div className="ss-label">Projected Score</div><div className="ss-value" id="sum-proj">199</div></div>
          <div className="summary-stat"><div className="ss-label">Boundaries</div><div className="ss-value" id="sum-bounds">14</div></div>
        </div>
      </div>
    </GlassShell>
  );
}

function TeamComparisonGlass() {
  return (
    <GlassShell
      className="comparison-liquid-shell"
      displacementScale={72}
      blurAmount={0.078}
      saturation={142}
      aberrationIntensity={1.45}
      elasticity={0.14}
      cornerRadius={34}
    >
      <div className="comparison-container">
        <div className="comp-header">Team Comparison</div>
        <div className="comp-teams">
          <div className="comp-team" id="comp-team1"><div className="comp-team-badge circular-media" id="comp-team1-badge"><span>MI</span></div><div className="comp-team-name">Mumbai Indians</div></div>
          <div className="comp-divider">VS</div>
          <div className="comp-team" id="comp-team2"><div className="comp-team-badge circular-media" id="comp-team2-badge"><span>CSK</span></div><div className="comp-team-name">Chennai Super Kings</div></div>
        </div>
        <div className="comparison-chart">
          <div className="comp-stat-row"><div className="comp-stat-value left" id="comp-runs1">142</div><div className="comp-stat-label">Runs</div><div className="comp-stat-value right" id="comp-runs2">0</div></div>
          <div className="comp-stat-row"><div className="comp-stat-value left" id="comp-wickets1">3</div><div className="comp-stat-label">Wickets</div><div className="comp-stat-value right" id="comp-wickets2">0</div></div>
          <div className="comp-stat-row"><div className="comp-stat-value left" id="comp-rr1">9.95</div><div className="comp-stat-label">Run Rate</div><div className="comp-stat-value right" id="comp-rr2">0.00</div></div>
        </div>
      </div>
    </GlassShell>
  );
}

function LowerThirdGlass() {
  return (
    <div className="lt-container">
      <GlassShell
        className="lt-liquid-shell"
        displacementScale={74}
        blurAmount={0.075}
        saturation={142}
        aberrationIntensity={1.5}
        elasticity={0.2}
        cornerRadius={999}
      >
        <div className="lt-bar">
          <div className="lt-chrome"></div>
          <div className="lt-accent"></div>
          <div className="lt-photo circular-media" id="lt-photo"><span>RS</span></div>
          <div className="lt-content">
            <div className="lt-name" id="lt-name">Rohit Sharma</div>
            <div className="lt-info" id="lt-info">Captain, Mumbai Indians</div>
          </div>
        </div>
      </GlassShell>
    </div>
  );
}

function mountReactGlass(id, element) {
  const rootNode = document.getElementById(id);
  if (!rootNode || rootNode.dataset.mounted) {
    return;
  }
  createRoot(rootNode).render(element);
  rootNode.dataset.mounted = 'true';
}

function mountLiquidGlassUI() {
  document.body.classList.add('react-liquid-glass-active');

  mountReactGlass('scorebug-root', <ScorebugGlass />);
  mountReactGlass('full-scoreboard-root', <FullScoreboardGlass />);
  mountReactGlass('batting-card-root', <BattingCardGlass />);
  mountReactGlass('player-stats-root', <PlayerStatsGlass />);
  mountReactGlass('bowler-stats-root', <BowlerStatsGlass />);
  mountReactGlass('match-summary-root', <MatchSummaryGlass />);
  mountReactGlass('team-comparison-root', <TeamComparisonGlass />);
  mountReactGlass('lower-third-root', <LowerThirdGlass />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLiquidGlassUI);
} else {
  mountLiquidGlassUI();
}
