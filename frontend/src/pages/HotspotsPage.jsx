import React from 'react';
import CrimeMap from '../components/CrimeMap';
import { usePredictions } from '../context/PredictionContext';

export default function HotspotsPage() {
  const { predictions } = usePredictions();

  // Extract hotspot data from predictions
  const districtRisks = predictions.reduce((acc, p) => {
    if (!acc[p.district]) {
      acc[p.district] = {
        district: p.district,
        count: 0,
        avgConfidence: 0,
        riskLevels: { High: 0, Medium: 0, Low: 0 },
        crimes: []
      };
    }
    acc[p.district].count += 1;
    acc[p.district].avgConfidence += p.confidence || 0;
    acc[p.district].riskLevels[p.riskLevel] += 1;
    acc[p.district].crimes.push(p.crimeType);
    return acc;
  }, {});

  // Calculate average confidence
  Object.values(districtRisks).forEach(dr => {
    dr.avgConfidence = Math.round(dr.avgConfidence / dr.count);
  });

  const sortedDistricts = Object.values(districtRisks).sort((a, b) => {
    const riskOrder = { High: 3, Medium: 2, Low: 1 };
    const aRisk = riskOrder[a.riskLevels.High > 0 ? 'High' : a.riskLevels.Medium > 0 ? 'Medium' : 'Low'];
    const bRisk = riskOrder[b.riskLevels.High > 0 ? 'High' : b.riskLevels.Medium > 0 ? 'Medium' : 'Low'];
    return bRisk - aRisk;
  });

  const highestRiskDistrict = sortedDistricts[0] || { district: 'N/A', avgConfidence: 0 };
  const escalationZones = sortedDistricts.filter(d => d.riskLevels.High > 0).slice(0, 3);
  const recommendedPatrolUnits = Math.ceil(escalationZones.length * 2);
  const densityScore = predictions.length > 0 ? Math.round((predictions.filter(p => p.riskLevel === 'High').length / predictions.length) * 100) : 0;

  const getHotspotColor = (riskLevel) => {
    if (riskLevel === 'High') return '#FF4E4E';
    if (riskLevel === 'Medium') return '#FFB020';
    return '#2ADE7C';
  };

  const getTopCrimeType = (crimes) => {
    const freq = {};
    crimes.forEach(c => freq[c] = (freq[c] || 0) + 1);
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : 'Unknown';
  };

  const generateAIInsight = () => {
    if (sortedDistricts.length === 0) {
      return "No prediction data available. Run predictions to identify hotspots.";
    }

    const insights = [];
    
    if (highestRiskDistrict) {
      const topCrime = getTopCrimeType(highestRiskDistrict.crimes);
      const riskPercent = Math.round((highestRiskDistrict.riskLevels.High / highestRiskDistrict.count) * 100);
      insights.push(`${highestRiskDistrict.district} exhibits the highest crime concentration with ${riskPercent}% high-risk incidents. ${topCrime} is the dominant crime type with ${highestRiskDistrict.avgConfidence}% prediction confidence.`);
    }

    if (escalationZones.length > 0) {
      const zones = escalationZones.map(z => z.district).join(', ');
      const totalEscalation = escalationZones.reduce((sum, z) => sum + z.count, 0);
      insights.push(`Identified ${escalationZones.length} escalation zones (${zones}) with ${totalEscalation} total high-risk incidents requiring immediate intervention and enhanced patrol coverage.`);
    }

    if (densityScore > 70) {
      insights.push(`Critical crime density score (${densityScore}%) indicates concentrated criminal activity clusters. Recommend tactical deployment and resource concentration.`);
    } else if (densityScore > 40) {
      insights.push(`Moderate crime density (${densityScore}%) suggests distributed hotspots. Standard patrol optimization recommended.`);
    }

    // Add trend information
    if (sortedDistricts.length > 1) {
      const topTwo = sortedDistricts.slice(0, 2);
      const riskGap = Math.round(((topTwo[0].count - topTwo[1].count) / topTwo[1].count) * 100);
      insights.push(`${topTwo[0].district} shows ${riskGap}% higher incident concentration than ${topTwo[1].district}, indicating primary focus area.`);
    }

    return insights.join(' ');
  };

  // Generate threat intelligence for emerging threats section
  const generateEmergingThreatsData = () => {
    const threatData = [];
    
    // Rising hotspots (most recent high-risk incidents)
    const recentHighRisk = predictions
      .filter(p => p.riskLevel === 'High')
      .slice(-5)
      .reverse();

    if (recentHighRisk.length > 0) {
      threatData.push({
        type: 'rising',
        title: 'Recently Detected High-Risk Patterns',
        items: recentHighRisk.map(p => ({
          label: `${p.district} - ${p.crimeType}`,
          confidence: p.confidence,
          timestamp: p.timestamp
        }))
      });
    }

    // Growth trend analysis
    const districtCountsLocal = predictions.reduce((acc, p) => {
      acc[p.district] = (acc[p.district] || 0) + 1;
      return acc;
    }, {});
    
    const districtGrowth = Object.entries(districtCountsLocal)
      .map(([district, count]) => {
        const districtPreds = predictions.filter(p => p.district === district);
        const highRiskCount = districtPreds.filter(p => p.riskLevel === 'High').length;
        return { district, count, highRiskCount };
      })
      .sort((a, b) => b.highRiskCount - a.highRiskCount)
      .slice(0, 3);

    if (districtGrowth.length > 0) {
      threatData.push({
        type: 'growth',
        title: 'Fastest Growing Hotspots',
        items: districtGrowth.map(d => ({
          label: d.district,
          highRisk: d.highRiskCount,
          total: d.count
        }))
      });
    }

    return threatData;
  };

  return (
    <div style={{ paddingTop: '48px', paddingBottom: '32px', overflow: 'auto', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', maxWidth: '1000px' }}>
          <h1 style={{ color: '#e6eef8', marginBottom: '12px', fontSize: '32px', lineHeight: '1.2', fontWeight: '600' }}>Karnataka Crime Hotspot Intelligence</h1>
          <p style={{ color: '#9aa6c7', marginBottom: '0', fontSize: '14px', lineHeight: '1.5' }}>Identify emerging crime concentration zones and assist proactive police deployment</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#9fb0d9' }}>Total Active Hotspots</div>
            <div style={{ fontWeight: '900', color: '#00E5FF', fontSize: '24px', marginTop: '8px' }}>{sortedDistricts.length}</div>
          </div>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#9fb0d9' }}>Highest Risk District</div>
            <div style={{ fontWeight: '900', color: '#FF4E4E', fontSize: '14px', marginTop: '8px' }}>{highestRiskDistrict.district}</div>
          </div>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#9fb0d9' }}>Predicted Escalation Zones</div>
            <div style={{ fontWeight: '900', color: '#FFB020', fontSize: '24px', marginTop: '8px' }}>{escalationZones.length}</div>
          </div>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#9fb0d9' }}>Recommended Patrol Units</div>
            <div style={{ fontWeight: '900', color: '#2ADE7C', fontSize: '24px', marginTop: '8px' }}>{recommendedPatrolUnits}</div>
          </div>
          <div className="glass-card" style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#9fb0d9' }}>Crime Density Score</div>
            <div style={{ fontWeight: '900', color: '#D084FF', fontSize: '24px', marginTop: '8px' }}>{densityScore}%</div>
          </div>
        </div>

        {/* Map Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginTop: '0', marginBottom: '8px', color: '#e6eef8', fontSize: '14px' }}>Tactical Hotspot Map</h4>
            <div style={{ height: '400px', flex: 1, overflow: 'hidden', position: 'relative', borderRadius: '8px' }}>
              <CrimeMap />
            </div>
          </div>

          {/* Right Panels */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {/* Hotspot Details */}
            <div className="glass-card">
              <h5 style={{ marginTop: '0', color: '#00E5FF', fontSize: '13px', fontWeight: '900' }}>HOTSPOT DETAILS</h5>
              {highestRiskDistrict && (
                <>
                  <div style={{ fontSize: '12px', color: '#9fb0d9', marginTop: '12px' }}>
                    <div>District: <span style={{ color: '#E6FCFF', fontWeight: 'bold' }}>{highestRiskDistrict.district}</span></div>
                    <div style={{ marginTop: '4px' }}>Risk Level: <span style={{ color: '#FF4E4E', fontWeight: 'bold' }}>HIGH</span></div>
                    <div style={{ marginTop: '4px' }}>Crime Density: <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>{highestRiskDistrict.count}</span></div>
                    <div style={{ marginTop: '4px' }}>Confidence: <span style={{ color: '#2ADE7C', fontWeight: 'bold' }}>{highestRiskDistrict.avgConfidence}%</span></div>
                  </div>
                </>
              )}
            </div>

            {/* Trend Forecast */}
            <div className="glass-card">
              <h5 style={{ marginTop: '0', color: '#00E5FF', fontSize: '13px', fontWeight: '900' }}>TREND FORECAST</h5>
              <div style={{ fontSize: '12px', color: '#9fb0d9', marginTop: '12px' }}>
                <div style={{ padding: '8px', background: 'rgba(255,78,78,0.1)', borderRadius: '6px', color: '#FF4E4E', fontWeight: 'bold', marginBottom: '4px' }}>📈 Increasing</div>
                <div style={{ fontSize: '11px', color: '#E6FCFF' }}>High-risk zones showing upward trend</div>
              </div>
            </div>

            {/* Patrol Recommendation */}
            <div className="glass-card">
              <h5 style={{ marginTop: '0', color: '#00E5FF', fontSize: '13px', fontWeight: '900' }}>PATROL RECOMMENDATION</h5>
              <div style={{ fontSize: '12px', color: '#9fb0d9', marginTop: '12px' }}>
                <div style={{ padding: '6px', background: 'rgba(42,222,124,0.1)', borderRadius: '4px', color: '#2ADE7C', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>
                  🛡️ Increase night patrol
                </div>
                <div style={{ padding: '6px', background: 'rgba(0,229,255,0.1)', borderRadius: '4px', color: '#00E5FF', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>
                  📡 Deploy surveillance unit
                </div>
                <div style={{ padding: '6px', background: 'rgba(208,132,255,0.1)', borderRadius: '4px', color: '#D084FF', fontSize: '11px', fontWeight: 'bold' }}>
                  🚦 Monitor traffic corridors
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Below Map Sections */}

        {/* Hotspot Ranking Table */}
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#e6eef8', fontSize: '14px' }}>Hotspot Ranking Table</h4>
          <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', position: 'sticky', top: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#9fb0d9', fontSize: '11px', fontWeight: 'bold', width: '22%' }}>District</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#9fb0d9', fontSize: '11px', fontWeight: 'bold', width: '16%' }}>Risk Score</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#9fb0d9', fontSize: '11px', fontWeight: 'bold', width: '16%' }}>Trend</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#9fb0d9', fontSize: '11px', fontWeight: 'bold', width: '18%' }}>Priority</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#9fb0d9', fontSize: '11px', fontWeight: 'bold', width: '16%' }}>Incidents</th>
              </tr>
            </thead>
            <tbody>
              {sortedDistricts.map((district, idx) => {
                const riskLevel = district.riskLevels.High > 0 ? 'High' : district.riskLevels.Medium > 0 ? 'Medium' : 'Low';
                const priority = district.riskLevels.High > 0 ? 'CRITICAL' : district.riskLevels.Medium > 0 ? 'HIGH' : 'MEDIUM';
                return (
                  <tr key={district.district} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: idx % 2 ? 'rgba(0,229,255,0.02)' : 'transparent', height: '44px' }}>
                    <td style={{ padding: '8px', color: '#E6FCFF', fontSize: '11px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{district.district}</td>
                    <td style={{ padding: '8px', color: getHotspotColor(riskLevel), fontSize: '11px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{district.avgConfidence}%</td>
                    <td style={{ padding: '8px', color: '#FFB020', fontSize: '11px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📈 Increasing</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderRadius: '3px', fontSize: '10px', fontWeight: '600', backgroundColor: 'rgba(255,78,78,0.25)', color: '#FF4E4E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{priority}</td>
                    <td style={{ padding: '8px', color: '#00E5FF', fontSize: '11px', fontWeight: '600', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{district.count}</td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>

        {/* Emerging Threats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card">
            <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#e6eef8', fontSize: '14px' }}>🔴 Threat Intelligence Feed</h4>
            <div style={{ marginTop: '0', maxHeight: '280px', overflowY: 'auto' }}>
              {predictions.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#9fb0d9', padding: '12px' }}>No prediction data available. Submit predictions to see threat patterns.</div>
              ) : (
                generateEmergingThreatsData().map((threatGroup, groupIdx) => (
                  <div key={groupIdx} style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#FFB020', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                      {threatGroup.title}
                    </div>
                    {threatGroup.type === 'rising' && threatGroup.items.map((item, idx) => (
                      <div key={idx} style={{ padding: '8px', background: 'rgba(255,78,78,0.08)', borderLeft: '3px solid #FF4E4E', marginBottom: '6px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '11px', color: '#E6FCFF', fontWeight: '500' }}>{item.label}</div>
                        <div style={{ fontSize: '10px', color: '#00E5FF', marginTop: '2px' }}>Confidence: {item.confidence}%</div>
                      </div>
                    ))}
                    {threatGroup.type === 'growth' && threatGroup.items.map((item, idx) => (
                      <div key={idx} style={{ padding: '8px', background: 'rgba(255,176,32,0.08)', borderLeft: '3px solid #FFB020', marginBottom: '6px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '11px', color: '#E6FCFF', fontWeight: '500' }}>{item.label}</div>
                        <div style={{ fontSize: '10px', color: '#00E5FF', marginTop: '2px' }}>{item.highRisk}/{item.total} high-risk incidents</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Strategic Risk Assessment */}
          <div className="glass-card">
            <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#e6eef8', fontSize: '14px' }}>📊 Strategic Risk Assessment</h4>
            <div style={{ marginTop: '0', maxHeight: '280px', overflowY: 'auto' }}>
              {sortedDistricts.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#9fb0d9', padding: '12px' }}>No hotspot data available.</div>
              ) : (
                <>
                  <div style={{ fontSize: '11px', marginBottom: '12px' }}>
                    <div style={{ padding: '8px', background: 'rgba(0,229,255,0.08)', borderRadius: '4px', marginBottom: '8px' }}>
                      <div style={{ color: '#00E5FF', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>CRITICAL ZONES: {escalationZones.length}</div>
                      <div style={{ color: '#E6FCFF', fontSize: '10px' }}>Requiring immediate tactical intervention</div>
                    </div>
                    <div style={{ padding: '8px', background: 'rgba(208,132,255,0.08)', borderRadius: '4px', marginBottom: '8px' }}>
                      <div style={{ color: '#D084FF', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>DENSITY SCORE: {densityScore}%</div>
                      <div style={{ color: '#E6FCFF', fontSize: '10px' }}>Crime concentration intensity level</div>
                    </div>
                    <div style={{ padding: '8px', background: 'rgba(42,222,124,0.08)', borderRadius: '4px' }}>
                      <div style={{ color: '#2ADE7C', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>COVERAGE NEEDED: {recommendedPatrolUnits} UNITS</div>
                      <div style={{ color: '#E6FCFF', fontSize: '10px' }}>Recommended patrol allocation</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9fb0d9', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <strong>Top 3 Priorities:</strong>
                    {sortedDistricts.slice(0, 3).map((d, idx) => (
                      <div key={idx} style={{ marginTop: '4px', color: '#E6FCFF' }}>
                        {idx + 1}. {d.district} ({d.count} incidents)
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hotspot Timeline */}
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#e6eef8', fontSize: '14px' }}>Hotspot Evolution Timeline</h4>
          <div style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', overflowX: 'hidden' }}>
            {predictions.length === 0 ? (
              <div style={{ color: '#9fb0d9', textAlign: 'center', padding: '24px' }}>No timeline data available</div>
            ) : (
              predictions.slice().reverse().map((pred, idx) => (
                <div key={pred.id} style={{ padding: '12px', background: 'rgba(0,229,255,0.05)', borderLeft: '3px solid #00E5FF', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#9fb0d9' }}>{new Date(pred.timestamp).toLocaleTimeString()}</div>
                  <div style={{ fontSize: '12px', color: '#E6FCFF', fontWeight: 'bold', marginTop: '4px' }}>{pred.district} - {pred.crimeType}</div>
                  <div style={{ fontSize: '11px', color: '#00E5FF', marginTop: '2px' }}>Confidence: {pred.confidence}%</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Hotspot Summary */}
        <div className="glass-card">
          <h4 style={{ marginTop: '0', marginBottom: '12px', color: '#00E5FF', fontSize: '14px' }}>AI Hotspot Summary</h4>
          <p style={{ color: '#E6FCFF', lineHeight: '1.6', marginTop: '0', fontSize: '13px' }}>
            {generateAIInsight()}
          </p>
        </div>
      </div>
    </div>
  );
}
