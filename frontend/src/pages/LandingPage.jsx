import React from 'react';
import HeroDashboard from '../components/HeroDashboard';
import '../components/landing.css';

export default function LandingPage(){
  const hotspots = [
    { id: 'beng', x: 24, y: 28, label: 'Bengaluru Urban — Zone 3', risk: 86, cat: 'Theft' },
    { id: 'mys', x: 34, y: 44, label: 'Mysuru — North', risk: 74, cat: 'Assault' },
    { id: 'hub', x: 40, y: 18, label: 'Hubballi-Dharwad — Central', risk: 71, cat: 'Robbery' },
    { id: 'bel', x: 12, y: 38, label: 'Belagavi — Central', risk: 65, cat: 'Robbery' },
  ];

  const feed = [
    { id: 1, sev: 'Critical', text: 'UAV signature detected near Bengaluru', time: '2m' },
    { id: 2, sev: 'Info', text: 'Sentiment spike in Belagavi', time: '8m' },
    { id: 3, sev: 'Warning', text: 'LPR hit BOLO #144', time: '12m' },
    { id: 4, sev: 'Success', text: 'Patrol UNIT secure', time: '18m' },
  ];

  return (
    <div className="landing-hero command-home" style={{ display: 'flex', width: '100%', height: 'calc(100vh - 48px)', overflow: 'hidden', flexDirection: 'column' }}>
      <HeroDashboard hotspots={hotspots} feed={feed} />
    </div>
  );
}
