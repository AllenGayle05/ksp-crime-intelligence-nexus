import React from 'react';

export default function ThreatMatrix({ size = 4 }){
  const cells = Array.from({length: size*size});
  return (
    <div className="threat-matrix">
      {cells.map((_,i)=>{
        const severity = i%7===0? 'critical' : (i%5===0? 'high' : (i%3===0? 'med' : 'low'));
        return <div key={i} className={`tm-cell ${severity}`} aria-hidden />;
      })}
    </div>
  );
}
