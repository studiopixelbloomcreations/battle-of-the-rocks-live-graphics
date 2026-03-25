import React from 'react';
import { createRoot } from 'react-dom/client';
import { Vaso } from 'vaso';

function ScorebugGlass() {
  return (
    <div className="scorebug-container">
      <Vaso
        className="scorebug-vaso-shell"
        px={14}
        py={14}
        radius={34}
        depth={1.05}
        blur={0.42}
        dispersion={0.45}
      >
        <div className="scorebug-glass">
          <div className="scorebug-liquid"></div>
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
      </Vaso>
    </div>
  );
}

function mountLiquidGlassUI() {
  const scorebugRoot = document.getElementById('scorebug-root');
  if (!scorebugRoot || scorebugRoot.dataset.mounted) {
    return;
  }

  document.body.classList.add('scorebug-vaso-active');
  createRoot(scorebugRoot).render(<ScorebugGlass />);
  scorebugRoot.dataset.mounted = 'true';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLiquidGlassUI);
} else {
  mountLiquidGlassUI();
}
