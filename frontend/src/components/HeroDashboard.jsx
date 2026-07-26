import React from 'react';
import '../components/landing.css';
import mapImg from '../assets/karnataka-tactical-map.jpg';

const KPIs = ({items}) => (
  <div className="top-kpi-bar">
    {items.map((k,i)=> (
      <div className={`kpi-card compact kpi-${k.color}`} key={i} title={k.label}>
        <div className="kpi-icon">{k.icon}</div>
        <div className="kpi-left">
          <div className="kpi-label">{k.label.toUpperCase()}</div>
          <div className="kpi-value">{k.value}</div>
        </div>
        <div className={`kpi-delta ${k.delta && (k.delta.startsWith('-') || k.delta.startsWith('−')) ? 'neg' : 'pos'}`}>{k.delta}</div>
      </div>
    ))}
  </div>
);

const LeftPanel = () => (
  <aside className="left-panel glass-card compact-left">
    <div className="left-kicker">AI PREDICTION ENGINE</div>
    <div className="left-sub">24h probabilistic forecast · GNN-v3</div>
    <div className="pred-list compact">
      <div className="pred-item">
        <div className="pred-row"><div className="pred-title">Property Theft</div><div className="pred-val">92%</div></div>
        <div className="pred-bar thin"><div className="pred-fill" style={{width:'92%'}}/></div>
        <div className="pred-cats">BLR CENTRAL · TECH CORRIDOR</div>
      </div>
      <div className="pred-item">
        <div className="pred-row"><div className="pred-title">Cyber Intrusion</div><div className="pred-val">67%</div></div>
        <div className="pred-bar thin"><div className="pred-fill" style={{width:'67%'}}/></div>
        <div className="pred-cats">TECH CORRIDOR · BLR CENTRAL</div>
      </div>
      <div className="pred-item">
        <div className="pred-row"><div className="pred-title">Civil Unrest</div><div className="pred-val">42%</div></div>
        <div className="pred-bar thin"><div className="pred-fill" style={{width:'42%'}}/></div>
        <div className="pred-cats">BELAGAVI · COASTAL BELT</div>
      </div>
      <div className="pred-item">
        <div className="pred-row"><div className="pred-title">Trafficking</div><div className="pred-val">28%</div></div>
        <div className="pred-bar thin"><div className="pred-fill" style={{width:'28%'}}/></div>
        <div className="pred-cats">COASTAL BELT · BELAGAVI</div>
      </div>
    </div>

    <div className="matrix-kicker">DISTRICT THREAT MATRIX</div>
    <div className="matrix-list compact">
      <div className="matrix-row"><span>Bengaluru Urban</span><span className="pct">+8%</span><span className="status small crit">CRIT</span></div>
      <div className="matrix-row"><span>Mysuru</span><span className="pct">-2%</span><span className="status small stbl">STBL</span></div>
      <div className="matrix-row"><span>Hubballi-Dharwad</span><span className="pct">+3%</span><span className="status small warn">WARN</span></div>
      <div className="matrix-row"><span>Mangaluru</span><span className="pct">-1%</span><span className="status small stbl">STBL</span></div>
      <div className="matrix-row"><span>Belagavi</span><span className="pct">+5%</span><span className="status small warn">WARN</span></div>
    </div>
  </aside>
);

const CognitiveNexus = () => (
  <div className="cognitive-nexus glass-card">
    <div className="cn-kicker">COGNITIVE NEXUS</div>
    <div className="cn-body">Reroute 3 units from Station-B to West Corridor.<br/>sensor anomaly correlation up +34%.</div>
    <div className="cn-footer">
      <div className="cn-meta"><span>3 units</span><span>ETA 4.1m</span></div>
      <div className="cn-actions"><button className="btn primary small">APPROVE →</button></div>
    </div>
  </div>
);

const FIRThroughput = () => (
  <div className="fir-throughput glass-card">
    <div className="fir-kicker">FIR THROUGHPUT - 7D</div>
    <div className="fir-chart">
      <div className="fir-bar" style={{height:'68%'}}><span className="fir-day">Mon</span></div>
      <div className="fir-bar" style={{height:'82%'}}><span className="fir-day">Tue</span></div>
      <div className="fir-bar" style={{height:'56%'}}><span className="fir-day">Wed</span></div>
      <div className="fir-bar" style={{height:'74%'}}><span className="fir-day">Thu</span></div>
      <div className="fir-bar" style={{height:'91%'}}><span className="fir-day">Fri</span></div>
      <div className="fir-bar" style={{height:'48%'}}><span className="fir-day">Sat</span></div>
      <div className="fir-bar" style={{height:'63%'}}><span className="fir-day">Sun</span></div>
    </div>
    <div className="fir-total">
      <div className="fir-label">Total FIRs:</div>
      <div className="fir-value">84,219</div>
    </div>
  </div>
);

const RightPanel = ({feed}) => (
  <aside className="right-panel glass-card compact-right">
    <div className="right-kicker">INTELLIGENCE FEED</div>
    <div className="intel-feed rebuild compact">
      {feed.map((it, idx) => {
        const time = it.time || '00:00';
        return (
          <div key={it.id || idx} className={`feed-row compact`}> 
            <div className="fr-time-col">{time}</div>
            <div className="fr-content">
              <div className="fr-main">{it.title || it.text}</div>
              <div className="fr-sub">{it.desc || it.source || ''}</div>
            </div>
          </div>
        );
      })}
    </div>

    <div className="investigation compact">
      <div className="inv-kicker">Investigation Support</div>
      <ul className="inv-list">
        <li>Link Analysis</li>
        <li>Query Vector DB</li>
        <li>Forensic Audit</li>
      </ul>
    </div>

    <CognitiveNexus />
    <FIRThroughput />
  </aside>
);

const CenterMap = ({hotspots}) => (
  <section className="center-map glass-card">
    <div className="map-wrap">
    <img src={mapImg} alt="Karnataka Tactical Map" className="tactical-map" />

      <div className="map-overlay grid-overlay" />
      <div className="radar-scan" aria-hidden="true">
        <div className="radar-ring r1" />
        <div className="radar-ring r2" />
        <div className="radar-ring r3" />
        <div className="radar-ring r4" />
        <div className="radar-ring r5" />
        <div className="radar-ring r6" />
        <div className="radar-ring r7" />
        <div className="radar-ring r8" />
        <div className="radar-ring r9" />
        <div className="radar-ring r10" />
        
        {/* expanding pulse circles */}
        <div className="radar-pulse p1" />
        <div className="radar-pulse p2" />
        <div className="radar-pulse p3" />
        
        <div className="radar-arm" />
        <div className="radar-center" />

        {/* subtle blips */}
        <div className="radar-blip" style={{left:'56%', top:'32%'}} />
        <div className="radar-blip" style={{left:'34%', top:'44%'}} />
        <div className="radar-blip" style={{left:'68%', top:'48%'}} />
      </div>

      <div className="radar-arcs" aria-hidden="true">
        <div className="arc s1" />
        <div className="arc s2" />
        <div className="arc s3" />
      </div>

      <div className="scan-lines" aria-hidden="true" />

      {hotspots.map(h => {
        const parts = (h.label || '').split('—').map(s=>s.trim());
        const title = parts[0] || h.label;
        const sub = parts[1] || '';
        const cls = h.id === 'beng' ? 'hot-beng' : h.id === 'hub' ? 'hot-hub' : h.id === 'mys' ? 'hot-mys' : h.id === 'bel' ? 'hot-bel' : '';

        // Bengaluru: render a focused red cluster (no cyan dot)
        if (h.id === 'beng') {
          return (
            <div key={h.id} className={`hotspot ${cls} beng-cluster-wrap`} style={{left: `${h.x}%`, top: `${h.y}%`}}>
              <div className="beng-cluster">
                <div className="beng-ring" />
                <div className="beng-glow" />
                <div className="beng-core" />
              </div>
              <div className="hot-label-box beng-label">
                <div className="hl-title">{title}</div>
                {sub && <div className="hl-sub">{sub}</div>}
              </div>
            </div>
          );
        }

        // Other hotspots: include a mini radar micro-scanner
        return (
          <div key={h.id} className={`hotspot ${cls}`} style={{left: `${h.x}%`, top: `${h.y}%`}}>
            <div className="hot-mini-radar" aria-hidden="true">
              <div className="mini-dot" />
              <div className="mini-ring r1" />
              <div className="mini-ring r2" />
            </div>
            <div className="hot-label-box">
              <div className="hl-title">{title}</div>
              {sub && <div className="hl-sub">{sub}</div>}
            </div>
          </div>
        );
      })}

      {/* small tactical pings to add life */}
      {[
        {id: 'p1', x: 46, y: 28},
        {id: 'p2', x: 18, y: 52},
        {id: 'p3', x: 62, y: 38},
      ].map(p => (
        <div key={p.id} className="map-ping" style={{left: `${p.x}%`, top: `${p.y}%`}} />
      ))}

      <div className="floating-card glass-card">
        <div className="fc-kicker">Geospatial Intelligence</div>
        <div className="fc-title">Live Prediction • Bengaluru</div>
        <div className="fc-meta">Most likely event: Property Theft • Confidence 92%</div>
      </div>
    </div>
  </section>
);

const BottomTicker = () => {
  const items = [
    {text: 'LIVE INTEL', cls: 'cyan'},
    {text: 'SIGNIT: ENCRYPTED UPLINK', cls: 'cyan'},
    {text: 'SECTOR 7', cls: 'yellow'},
    {text: 'ALERT: CROWD DENSITY ANOMALY', cls: 'yellow'},
    {text: 'METRO STN B', cls: 'orange'},
    {text: 'FACIAL MATCH FOUND', cls: 'red'},
    {text: 'CASE ID-884-X', cls: 'green'},
    {text: 'PREDICTIVE MODEL RETRAINED', cls: 'cyan'},
    {text: '2.4M FIRs', cls: 'purple'},
    {text: 'PURSUIT ACTIVE', cls: 'red'},
    {text: 'PL8-449-XTZ', cls: 'orange'},
    {text: 'UNIT-04 DEPLOYED', cls: 'green'},
    {text: 'JAYANAGAR', cls: 'yellow'},
  ];

  // duplicate for seamless loop
  const track = [...items, ...items];

  return (
    <div className="intel-ticker" aria-hidden="false">
      <div className="ticker-row">
        {track.map((it, idx) => (
          <span key={idx} className={`ticker-item ${it.cls}`}>
            {it.text}
            {idx < track.length - 1 && <span className="ticker-sep"> | </span>}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function HeroDashboard({hotspots = [], feed = []}){
  const kpis = [
    {label: 'Active Incidents', value: '1402', delta: '+12', icon: '💓', color: 'cyan'},
    {label: 'Predicted Hotspots', value: '42', delta: '+6', icon: '🎯', color: 'cyan'},
    {label: 'Response Time', value: '4.2m', delta: '-0.4m', icon: '⏱️', color: 'cyan'},
    {label: 'Patrol Density', value: '88%', delta: '+2%', icon: '👥', color: 'cyan'},
    {label: 'Risk Index', value: '7.4', delta: '+0.3', icon: '⚠️', color: 'yellow'},
  ];

  return (
    <div className="hero-dashboard">
      <KPIs items={kpis} />
      <div className="hero-grid">
        <LeftPanel />
        <CenterMap hotspots={hotspots} />
        <RightPanel feed={feed} />
      </div>

      <BottomTicker />
    </div>
  );
}
