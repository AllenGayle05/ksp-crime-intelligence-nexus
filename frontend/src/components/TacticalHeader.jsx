import React from 'react';

export default function TacticalHeader(){
  return (
    <header className="tactical-header">
      <div className="th-left">
        <div className="brand">KSP Crime Intelligence Nexus</div>
        <div className="secure">● <span className="secure-text">Secure</span></div>
      </div>

      <nav className="th-nav">
        <a href="/">Home</a>
        <a href="/prediction">Prediction</a>
        <a href="/analytics">Analytics</a>
        <a href="/hotspots">Hotspots</a>
      </nav>
    </header>
  );
}
