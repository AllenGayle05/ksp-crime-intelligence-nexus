import React from 'react';
import { NavLink } from 'react-router-dom';
import './navbar.css';

export default function Navbar() {
  return (
    <header className="top-nav">
      <div className="nav-inner">
        <div className="brand"><span className="ksp-shield" aria-hidden>🛡️</span>KSP Crime Intelligence Nexus</div>

        <nav className="nav-links">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Home</NavLink>
          <NavLink to="/prediction" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Prediction</NavLink>
          <NavLink to="/analytics" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Analytics</NavLink>
          <NavLink to="/hotspots" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>Hotspots</NavLink>
        </nav>
      </div>
    </header>
  );
}

