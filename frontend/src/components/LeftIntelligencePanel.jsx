import React from 'react';

export default function LeftIntelligencePanel(){
  return (
    <aside className="left-panel glass-card">
      <div className="lp-kicker">AI Prediction Engine</div>
      <h3 className="lp-title">Intelligence Panel</h3>
      <p className="lp-sub">Model-driven insights, explainability and recommended actions.</p>

      <div className="lp-section">
        <div className="lp-label">Threat Matrix</div>
        <div className="threat-matrix-placeholder">{/* rendered by ThreatMatrix component in page */}</div>
      </div>

      <div className="lp-section">
        <div className="lp-label">Risk Indicators</div>
        <ul className="risk-list">
          <li><span className="dot critical"/> Critical hotspots: 3</li>
          <li><span className="dot high"/> High risk clusters: 7</li>
          <li><span className="dot med"/> Medium alerts: 12</li>
        </ul>
      </div>

      <div className="lp-actions">
        <a href="/command" className="btn primary">Open Command</a>
        <a href="/prediction" className="btn outline">Run Prediction</a>
      </div>
    </aside>
  );
}
