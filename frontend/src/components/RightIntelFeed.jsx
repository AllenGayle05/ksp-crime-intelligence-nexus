import React from 'react';

export default function RightIntelFeed({ items = [] }){
  return (
    <aside className="right-feed glass-card">
      <div className="rf-title">Live Alerts</div>
      <div className="rf-list">
        {items.map(it=> (
          <div key={it.id} className={`rf-item ${it.sev.toLowerCase()}`}>
            <div className="rf-sev">{it.sev==='Critical'?'🔴': it.sev==='High'?'🔺':'🟠'}</div>
            <div className="rf-body"><div className="rf-text">{it.text}</div><div className="rf-time muted">{it.time}</div></div>
          </div>
        ))}
      </div>
    </aside>
  );
}
