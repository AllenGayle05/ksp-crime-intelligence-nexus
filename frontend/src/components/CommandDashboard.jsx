import React, { useState } from 'react';

export default function CommandDashboard({ hotspots = [] }){
  const [hover, setHover] = useState(null);

  return (
    <div className="command-dashboard">
      <div className="dashboard-canvas">
        <svg viewBox="0 0 100 70" className="dashboard-svg" preserveAspectRatio="xMidYMid meet">
          <g className="grid-lines" stroke="rgba(255,255,255,0.03)" strokeWidth="0.18">
            {[...Array(10)].map((_,i)=>(<line key={i} x1={0} y1={i*7} x2={100} y2={i*7} />))}
            {[...Array(12)].map((_,i)=>(<line key={'v'+i} x1={i*8} y1={0} x2={i*8} y2={70} />))}
          </g>

          <g className="district-mesh" stroke="rgba(255,255,255,0.03)" strokeWidth="0.25" fill="none">
            <path d="M6 22 C22 8, 36 12, 54 22 C72 32, 86 28, 96 36" />
            <path d="M6 48 C22 38, 40 44, 60 52 C76 58, 86 54, 96 60" />
          </g>

          {hotspots.map(h=> (
            <g key={h.id} transform={`translate(${h.x}, ${h.y})`} onMouseEnter={()=>setHover(h)} onMouseLeave={()=>setHover(null)} className="hd-hotspot">
              <circle r="1.8" fill="#fff" />
              <circle className="hd-pulse" r="3" fill="#FF3B3B" opacity="0.16" />
            </g>
          ))}
        </svg>

        <div className="radar" aria-hidden><div className="radar-sweep"/></div>
      </div>

      {hover && (
        <div className="dashboard-tooltip">
          <div className="dt-title">{hover.label}</div>
          <div className="dt-meta">Risk: <strong>{hover.risk}%</strong> · {hover.cat}</div>
        </div>
      )}
    </div>
  );
}
