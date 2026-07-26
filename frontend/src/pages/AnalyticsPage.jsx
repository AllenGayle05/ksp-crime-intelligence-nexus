import React, { useMemo } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { usePredictions } from '../context/PredictionContext';

export default function AnalyticsPage() {
  const { predictions } = usePredictions();

  // Normalize risk levels to uppercase for consistency
  const normalizeRisk = (risk) => {
    if (!risk) return 'LOW';
    return risk.toUpperCase();
  };

  // Roll up crimes into the 6 standard categories requested
  const getCategoryGroup = (crimeHead, crimeType) => {
    const head = (crimeHead || '').toLowerCase();
    const type = (crimeType || '').toLowerCase();
    if (head.includes('theft') || type.includes('theft') || head.includes('burglary') || type.includes('burglary') || head.includes('robbery') || type.includes('robbery')) {
      return 'Theft';
    }
    if (head.includes('assault') || type.includes('assault') || head.includes('murder') || type.includes('murder') || head.includes('kidnap') || type.includes('kidnap') || head.includes('pocso') || type.includes('pocso') || head.includes('heinous') || type.includes('heinous')) {
      return 'Assault';
    }
    if (head.includes('missing') || type.includes('missing')) {
      return 'Missing Person';
    }
    if (head.includes('fraud') || type.includes('fraud') || head.includes('cheating') || type.includes('cheating')) {
      return 'Fraud';
    }
    if (head.includes('cyber') || type.includes('cyber') || head.includes('online') || type.includes('online') || head.includes('it act') || type.includes('it act') || head.includes('electronic') || type.includes('electronic')) {
      return 'Cyber Crime';
    }
    return 'Other';
  };

  // Handle completely empty states
  const hasData = predictions && predictions.length > 0;

  // =====================================================================
  // RISK WEIGHT CONSTANTS — HIGH impact predictions dominate analytics
  // =====================================================================
  const RISK_WEIGHT = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const getRiskWeight = (risk) => RISK_WEIGHT[normalizeRisk(risk)] || 1;

  // Recency factor: newest prediction = 1.0, oldest = 0.3, exponential decay
  const getRecencyFactor = (index, total) => {
    if (total <= 1) return 1;
    const position = index / (total - 1); // 0 = oldest, 1 = newest
    return 0.3 + 0.7 * Math.pow(position, 1.5);
  };

  // Sort predictions chronologically once (reused everywhere)
  const sortedPredictions = useMemo(() => {
    if (!hasData) return [];
    return [...predictions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [predictions, hasData]);

  // Derive Advanced Intelligence Metrics
  const metrics = useMemo(() => {
    if (!hasData) {
      return {
        threatIndex: 0,
        escalationProb: 0,
        avgConfidence: 0,
        hotspotCount: 0,
        riskGrowth: 0
      };
    }

    const total = sortedPredictions.length;

    // 1. WEIGHTED Threat Index — each prediction's contribution is weight × recency × confidence
    let weightedSum = 0;
    let weightDenom = 0;
    sortedPredictions.forEach((p, idx) => {
      const w = getRiskWeight(p.riskLevel);
      const recency = getRecencyFactor(idx, total);
      const conf = (p.confidence || 50) / 100;
      const score = w * recency * conf * 100;
      weightedSum += score;
      weightDenom += recency;
    });
    const threatIndex = Math.min(99, Math.max(5, Math.round(weightedSum / (weightDenom * 3))));

    // 2. Escalation Rate — weighted by risk: recent HIGH predictions push this way up
    const recentSlice = sortedPredictions.slice(-Math.min(5, total));
    const recentWeightedHigh = recentSlice.reduce((sum, p) => {
      const w = getRiskWeight(p.riskLevel);
      return sum + (w >= 3 ? w * 1.5 : w * 0.3);
    }, 0);
    const maxPossibleEscalation = recentSlice.length * 4.5; // 3 * 1.5
    const escalationProb = Math.min(99, Math.max(0, Math.round((recentWeightedHigh / maxPossibleEscalation) * 100)));

    // 3. Weighted Average Confidence (high-risk predictions' confidence matters more)
    let confWeightedSum = 0;
    let confWeightDenom = 0;
    sortedPredictions.forEach(p => {
      const w = getRiskWeight(p.riskLevel);
      confWeightedSum += (p.confidence || 0) * w;
      confWeightDenom += w;
    });
    const avgConfidence = Math.round(confWeightedSum / Math.max(confWeightDenom, 1));

    // 4. Hotspot Count — districts where weighted threat exceeds threshold
    const distMap = {};
    sortedPredictions.forEach((p, idx) => {
      if (!distMap[p.district]) distMap[p.district] = { weightedScore: 0 };
      const w = getRiskWeight(p.riskLevel);
      const recency = getRecencyFactor(idx, total);
      distMap[p.district].weightedScore += w * recency * ((p.confidence || 50) / 100) * 30;
    });
    let hotspotCount = 0;
    Object.values(distMap).forEach(stats => {
      if (stats.weightedScore >= 40) hotspotCount += 1;
    });

    // 5. Risk Growth — compares weighted severity of first-third vs last-third
    const thirdSize = Math.max(1, Math.floor(total / 3));
    const firstThird = sortedPredictions.slice(0, thirdSize);
    const lastThird = sortedPredictions.slice(-thirdSize);
    const avgWeightedRisk = (slice) => {
      const sum = slice.reduce((s, p) => s + getRiskWeight(p.riskLevel) * ((p.confidence || 50) / 100), 0);
      return sum / slice.length;
    };
    const earlyAvg = avgWeightedRisk(firstThird);
    const lateAvg = avgWeightedRisk(lastThird);
    const riskGrowth = earlyAvg > 0 ? Math.round(((lateAvg - earlyAvg) / earlyAvg) * 100) : 0;

    return { threatIndex, escalationProb, avgConfidence, hotspotCount, riskGrowth };
  }, [sortedPredictions, hasData]);

  // Top districts threat ranking — WEIGHTED scoring with recency decay
  const districtThreatData = useMemo(() => {
    if (!hasData) return [];
    
    const total = sortedPredictions.length;
    const dMap = {};

    sortedPredictions.forEach((p, idx) => {
      if (!dMap[p.district]) {
        dMap[p.district] = { weightedScore: 0, count: 0, recentWeight: 0, highCount: 0 };
      }
      const w = getRiskWeight(p.riskLevel);
      const recency = getRecencyFactor(idx, total);
      const conf = (p.confidence || 50) / 100;

      // Each prediction contributes: riskWeight × recency × confidence × scaling
      dMap[p.district].weightedScore += w * recency * conf * 25;
      dMap[p.district].count += 1;
      if (normalizeRisk(p.riskLevel) === 'HIGH') dMap[p.district].highCount += 1;

      // Track recent weight for trend detection (last 40% of predictions)
      if (idx >= total * 0.6) {
        dMap[p.district].recentWeight += w * conf;
      }
    });

    const list = Object.keys(dMap).map(d => {
      const stats = dMap[d];
      // Normalize score to 0-100 range
      const threatScore = Math.min(98, Math.max(8, Math.round(stats.weightedScore)));

      // Trend: based on whether recent weighted activity exceeds average
      const avgWeightPerPrediction = stats.weightedScore / (stats.count * 25);
      let trend = 'Stable';
      if (stats.recentWeight > avgWeightPerPrediction * stats.count * 0.5) trend = 'Escalating';
      else if (stats.recentWeight < avgWeightPerPrediction * stats.count * 0.15) trend = 'Declining';

      return { district: d, threatScore, count: stats.count, trend };
    });

    return list.sort((a, b) => b.threatScore - a.threatScore).slice(0, 5);
  }, [sortedPredictions, hasData]);

  // Crime Category distribution — WEIGHTED counts (High risk crime = 3 units, Low = 1)
  const categoryCounts = useMemo(() => {
    const counts = { 'Theft': 0, 'Assault': 0, 'Missing Person': 0, 'Fraud': 0, 'Cyber Crime': 0, 'Other': 0 };
    if (!hasData) return counts;
    predictions.forEach(p => {
      const cat = getCategoryGroup(p.crimeHead, p.crimeType);
      const w = getRiskWeight(p.riskLevel);
      counts[cat] = (counts[cat] || 0) + w; // Weighted: High=3, Medium=2, Low=1
    });
    return counts;
  }, [predictions, hasData]);

  // Confidence Intelligence radar — each axis sensitive to prediction composition
  const radarMetrics = useMemo(() => {
    if (!hasData) return [0, 0, 0, 0, 0];
    const total = sortedPredictions.length;

    // 1. Stability: inverse of confidence standard deviation, scaled by risk diversity
    const avgConf = predictions.reduce((s, p) => s + (p.confidence || 0), 0) / total;
    const variance = predictions.reduce((s, p) => s + Math.pow((p.confidence || 0) - avgConf, 2), 0) / total;
    const stdDev = Math.sqrt(variance);
    const riskTypes = new Set(predictions.map(p => normalizeRisk(p.riskLevel)));
    const diversityPenalty = riskTypes.size * 8; // More diverse risk mix = less stable
    const stability = Math.max(10, Math.min(98, Math.round(100 - (stdDev * 2.5) - diversityPenalty)));

    // 2. Avg Confidence — weighted by recency (recent predictions matter more)
    let recencyWeightedConf = 0;
    let recencyDenom = 0;
    sortedPredictions.forEach((p, idx) => {
      const r = getRecencyFactor(idx, total);
      recencyWeightedConf += (p.confidence || 0) * r;
      recencyDenom += r;
    });
    const weightedAvgConf = Math.round(recencyWeightedConf / Math.max(recencyDenom, 1));

    // 3. Reliability: confidence of HIGH-risk predictions vs overall (big delta = unreliable)
    const highRisk = predictions.filter(p => normalizeRisk(p.riskLevel) === 'HIGH');
    const highAvg = highRisk.length > 0 ? highRisk.reduce((s, p) => s + (p.confidence || 0), 0) / highRisk.length : 0;
    const lowRisk = predictions.filter(p => normalizeRisk(p.riskLevel) === 'LOW');
    const lowAvg = lowRisk.length > 0 ? lowRisk.reduce((s, p) => s + (p.confidence || 0), 0) / lowRisk.length : 0;
    // If high-risk items have higher confidence = more reliable system
    const reliability = highRisk.length > 0
      ? Math.max(15, Math.min(98, Math.round(highAvg - Math.abs(highAvg - avgConf) * 0.5)))
      : Math.max(15, Math.min(70, Math.round(avgConf * 0.7)));

    // 4. Data Quality: completeness + weighted by risk severity
    const qualityScore = predictions.reduce((sum, p) => {
      let completeness = 0;
      if (p.district) completeness += 25;
      if (p.crimeHead) completeness += 25;
      if (p.confidence) completeness += 25;
      if (p.crimeType) completeness += 25;
      return sum + completeness * (getRiskWeight(p.riskLevel) / 3);
    }, 0) / total;
    const quality = Math.max(10, Math.min(98, Math.round(qualityScore)));

    // 5. Consistency: how uniform are confidence scores within each risk tier
    const tierGroups = { HIGH: [], MEDIUM: [], LOW: [] };
    predictions.forEach(p => {
      const r = normalizeRisk(p.riskLevel);
      if (tierGroups[r]) tierGroups[r].push(p.confidence || 0);
    });
    let totalTierVariance = 0;
    let tierCount = 0;
    Object.values(tierGroups).forEach(arr => {
      if (arr.length > 1) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const v = arr.reduce((s, c) => s + Math.pow(c - mean, 2), 0) / arr.length;
        totalTierVariance += Math.sqrt(v);
        tierCount += 1;
      }
    });
    const avgTierStdDev = tierCount > 0 ? totalTierVariance / tierCount : 0;
    const consistency = Math.max(10, Math.min(98, Math.round(95 - avgTierStdDev * 3)));

    return [stability, weightedAvgConf, reliability, quality, consistency];
  }, [predictions, sortedPredictions, hasData]);

  // Trend line — wide spread based on actual risk level + confidence variation
  const trendPoints = useMemo(() => {
    if (!hasData) return [];

    // Downsample if dataset is large to maintain dense layout (max 10 points)
    const step = Math.max(1, Math.floor(sortedPredictions.length / 10));
    const sampled = [];
    for (let i = 0; i < sortedPredictions.length; i += step) {
      sampled.push(sortedPredictions[i]);
    }
    if (sampled.length > 0 && sampled[sampled.length - 1]?.id !== sortedPredictions[sortedPredictions.length - 1]?.id) {
      sampled.push(sortedPredictions[sortedPredictions.length - 1]);
    }

    return sampled.map((p, index) => {
      const rLevel = normalizeRisk(p.riskLevel);
      const conf = (p.confidence || 50);
      // WIDE spread: High = 75-95, Medium = 40-65, Low = 10-35
      let risk;
      if (rLevel === 'HIGH') {
        risk = 75 + (conf / 100) * 20; // 75-95
      } else if (rLevel === 'MEDIUM') {
        risk = 40 + (conf / 100) * 25; // 40-65
      } else {
        risk = 10 + (conf / 100) * 25; // 10-35
      }
      return {
        label: `Alert #${index + 1}`,
        risk: Math.min(98, Math.max(5, Math.round(risk))),
        variance: Math.round(20 - (conf * 0.12)), // wider uncertainty for low-confidence
        confidence: conf
      };
    });
  }, [sortedPredictions, hasData]);

  // AI Narrative — dynamically constructed from weighted data
  const dynamicAIInsight = useMemo(() => {
    if (!hasData) {
      return "System offline. No active prediction intelligence loaded. Please generate predictions in the investigation panel.";
    }

    const topDist = districtThreatData[0];
    const sortedCats = Object.entries(categoryCounts).sort((a,b) => b[1] - a[1]);
    const topCatName = sortedCats[0]?.[0] || 'N/A';
    const totalWeighted = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const topCatWeight = categoryCounts[topCatName] || 0;
    const catPct = totalWeighted > 0 ? Math.round((topCatWeight / totalWeighted) * 100) : 0;

    const highCount = predictions.filter(p => normalizeRisk(p.riskLevel) === 'HIGH').length;
    const highPct = Math.round((highCount / predictions.length) * 100);

    const trendWord = metrics.riskGrowth > 15 ? 'sharply escalating' : metrics.riskGrowth > 0 ? 'gradually increasing' : metrics.riskGrowth < -15 ? 'significantly declining' : 'stabilizing';

    return `${topDist ? topDist.district : 'N/A'} leads threat concentration at ${topDist ? topDist.threatScore : 0}% (${topDist?.trend || 'Stable'}). ${highPct}% of all alerts are classified HIGH risk, with threat trajectory ${trendWord} (${metrics.riskGrowth >= 0 ? '+' : ''}${metrics.riskGrowth}%). Intelligence is concentrated in ${topCatName} (${catPct}% weighted share). System confidence: ${metrics.avgConfidence}%. ${metrics.hotspotCount} district${metrics.hotspotCount !== 1 ? 's' : ''} exceed${metrics.hotspotCount === 1 ? 's' : ''} critical threat threshold.`;
  }, [predictions, districtThreatData, categoryCounts, metrics, hasData]);

  // ChartJS Configurations
  const lineChartData = {
    labels: trendPoints.map(t => t.label),
    datasets: [
      {
        label: 'Overall Crime Risk Score',
        data: trendPoints.map(t => t.risk),
        borderColor: '#27D4FF',
        backgroundColor: 'rgba(39, 212, 255, 0.08)',
        borderWidth: 2,
        tension: 0.45,
        fill: true,
        pointBackgroundColor: '#27D4FF',
        pointRadius: 3
      },
      {
        label: '3-Period Moving Average',
        data: trendPoints.map((t, idx) => {
          const start = Math.max(0, idx - 2);
          const slice = trendPoints.slice(start, idx + 1);
          return Math.round(slice.reduce((acc, curr) => acc + curr.risk, 0) / slice.length);
        }),
        borderColor: '#FFB020',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false,
        tension: 0.4
      },
      {
        label: 'Confidence Upper Limit',
        data: trendPoints.map(t => Math.min(100, t.risk + t.variance)),
        borderColor: 'rgba(39, 212, 255, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [2, 2],
        fill: false
      },
      {
        label: 'Confidence Lower Limit',
        data: trendPoints.map(t => Math.max(0, t.risk - t.variance)),
        borderColor: 'rgba(39, 212, 255, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [2, 2],
        fill: false
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9fb0d9', font: { size: 9 }, boxWidth: 10, padding: 8 }
      },
      tooltip: {
        backgroundColor: 'rgba(11, 15, 25, 0.95)',
        borderColor: 'rgba(39, 212, 255, 0.2)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#9fb0d9'
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#9fb0d9', font: { size: 8 } },
        grid: { color: 'rgba(39, 212, 255, 0.05)' }
      },
      x: {
        ticks: { color: '#9fb0d9', font: { size: 8 } },
        grid: { display: false }
      }
    }
  };

  const barChartData = {
    labels: districtThreatData.map(d => d.district),
    datasets: [{
      label: 'Threat Score',
      data: districtThreatData.map(d => d.threatScore),
      backgroundColor: districtThreatData.map(d => {
        if (d.threatScore >= 75) return 'rgba(255, 78, 78, 0.85)';
        if (d.threatScore >= 50) return 'rgba(255, 176, 32, 0.85)';
        return 'rgba(39, 212, 255, 0.85)';
      }),
      borderColor: districtThreatData.map(d => {
        if (d.threatScore >= 75) return '#FF4E4E';
        if (d.threatScore >= 50) return '#FFB020';
        return '#27D4FF';
      }),
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  const barChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11, 15, 25, 0.95)',
        borderColor: 'rgba(39, 212, 255, 0.2)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { color: '#9fb0d9', font: { size: 8 } },
        grid: { color: 'rgba(39, 212, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#e6eef8', font: { size: 9, weight: 'bold' } },
        grid: { display: false }
      }
    }
  };

  const doughnutData = {
    labels: Object.keys(categoryCounts),
    datasets: [{
      data: Object.values(categoryCounts),
      backgroundColor: [
        'rgba(39, 212, 255, 0.8)',
        'rgba(255, 78, 78, 0.8)',
        'rgba(124, 92, 255, 0.8)',
        'rgba(255, 176, 32, 0.8)',
        'rgba(0, 229, 255, 0.8)',
        'rgba(154, 166, 191, 0.6)'
      ],
      borderColor: '#0f172a',
      borderWidth: 2
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#e6eef8', font: { size: 9 }, boxWidth: 10, padding: 6 }
      },
      tooltip: {
        backgroundColor: 'rgba(11, 15, 25, 0.95)',
        borderColor: 'rgba(39, 212, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const sum = context.dataset.data.reduce((a, b) => a + b, 0);
            const pct = sum > 0 ? Math.round((val / sum) * 100) : 0;
            return ` ${context.label}: ${val} (${pct}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  const radarData = {
    labels: ['Stability', 'Avg Confidence', 'Reliability', 'Data Quality', 'Consistency'],
    datasets: [{
      label: 'Model Confidence Profile',
      data: radarMetrics,
      backgroundColor: 'rgba(39, 212, 255, 0.15)',
      borderColor: '#27D4FF',
      pointBackgroundColor: '#27D4FF',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#27D4FF',
      borderWidth: 1.5,
      pointRadius: 2.5
    }]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(11, 15, 25, 0.95)',
        borderColor: 'rgba(39, 212, 255, 0.2)',
        borderWidth: 1
      }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
        grid: { color: 'rgba(39, 212, 255, 0.08)' },
        pointLabels: { color: '#9fb0d9', font: { size: 7.5 } },
        ticks: {
          color: '#9fb0d9',
          backdropColor: 'transparent',
          font: { size: 7 },
          stepSize: 25
        },
        min: 0,
        max: 100
      }
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '24px', paddingTop: '68px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <style>{`
        .intel-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 12px;
        }
        .intel-card {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%);
          border: 1px solid rgba(39, 212, 255, 0.12);
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 6px 24px rgba(2, 6, 23, 0.4);
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .intel-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 1.5px;
          background: linear-gradient(90deg, #27D4FF, transparent);
        }
        .intel-card:hover {
          border-color: rgba(39, 212, 255, 0.24);
          box-shadow: 0 6px 24px rgba(39, 212, 255, 0.06);
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        .metric-title {
          font-size: 10px;
          color: #9fb0d9;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 800;
          font-family: var(--mono);
          color: #ffffff;
          text-shadow: 0 0 8px rgba(39, 212, 255, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(39, 212, 255, 0.18);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(39, 212, 255, 0.35);
        }
        .offline-banner {
          background: linear-gradient(90deg, rgba(255,78,78,0.1) 0%, rgba(255,176,32,0.05) 100%);
          border: 1px solid rgba(255, 78, 78, 0.3);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 40px auto;
          max-width: 600px;
          box-shadow: 0 8px 32px rgba(2,6,23,0.5);
        }
      `}</style>

      {/* Header and Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ color: '#e6eef8', margin: '0 0 2px 0', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>Command Analytics & Intel</h1>
          <p style={{ color: '#9aa6c7', fontSize: '11px', margin: 0 }}>Karnataka State Police prediction monitoring and predictive threat profiling</p>
        </div>
      </div>

      {!hasData ? (
        <div className="offline-banner">
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚨</div>
          <h3 style={{ color: '#FF4E4E', fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>SYSTEM OFFLINE: NO ACTIVE PREDICTION FEEDS</h3>
          <p style={{ color: '#9aa6c7', fontSize: '12px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
            The crime intelligence dashboard requires prediction data to activate threat metrics, trend analysis, and district comparison indices.
          </p>
          <a
            href="/prediction"
            style={{
              display: 'inline-block',
              background: 'rgba(39, 212, 255, 0.15)',
              border: '1px solid #27D4FF',
              color: '#27D4FF',
              padding: '8px 18px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.8px',
              transition: 'all 0.2s'
            }}
          >
            NAVIGATE TO INVESTIGATION UNIT
          </a>
        </div>
      ) : (
        <>
          {/* KPI Cards Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div className="intel-card" style={{ padding: '8px 12px' }}>
              <div className="metric-title">District Threat Index</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <div className="metric-value">{metrics.threatIndex}%</div>
                <span style={{ fontSize: '10px', color: metrics.riskGrowth >= 0 ? '#FF4E4E' : '#20E3A2', fontWeight: 'bold' }}>
                  {metrics.riskGrowth >= 0 ? `+${metrics.riskGrowth}%` : `${metrics.riskGrowth}%`}
                </span>
              </div>
            </div>
            <div className="intel-card" style={{ padding: '8px 12px' }}>
              <div className="metric-title">Escalation Rate</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <div className="metric-value" style={{ color: metrics.escalationProb >= 60 ? '#FF4E4E' : '#ffffff' }}>
                  {metrics.escalationProb}%
                </div>
                <span style={{ fontSize: '8px', color: metrics.escalationProb >= 60 ? '#FF4E4E' : '#9fb0d9', fontWeight: '600' }}>
                  {metrics.escalationProb >= 60 ? 'HIGH ALERT' : 'NORMAL'}
                </span>
              </div>
            </div>
            <div className="intel-card" style={{ padding: '8px 12px' }}>
              <div className="metric-title">Reliability Health</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <div className="metric-value" style={{ color: '#20E3A2' }}>{metrics.avgConfidence}%</div>
                <span style={{ fontSize: '8px', color: '#9fb0d9' }}>AVG CONFIDENCE</span>
              </div>
            </div>
            <div className="intel-card" style={{ padding: '8px 12px' }}>
              <div className="metric-title">Active Hotspots</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <div className="metric-value">{metrics.hotspotCount} Districts</div>
                <span style={{ fontSize: '8px', color: '#9fb0d9' }}>THREAT INDEX &gt;= 65</span>
              </div>
            </div>
          </div>

          {/* Main Visualizations Grid */}
          <div className="intel-grid">
            {/* Row 1 - Chart A: Crime Trend Intelligence */}
            <div className="intel-card col-span-6" style={{ height: '220px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#e6eef8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crime Trend Intelligence</h3>
              <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 20px)' }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Row 1 - Chart B: District Risk Comparison & List */}
            <div className="intel-card col-span-6" style={{ height: '220px', flexDirection: 'row', gap: '10px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#e6eef8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>District Threat ranking</h3>
                <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 20px)' }}>
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
              <div style={{ width: '40%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '8px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#9fb0d9', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Threat Roster</h4>
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(39, 212, 255, 0.15)', color: '#9fb0d9' }}>
                        <th style={{ padding: '2px 0', textAlign: 'left', fontWeight: 'normal' }}>District</th>
                        <th style={{ padding: '2px 0', textAlign: 'right', fontWeight: 'normal' }}>Score</th>
                        <th style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'normal' }}>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {districtThreatData.map((d) => (
                        <tr key={d.district} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '3px 0', color: '#e6eef8', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65px' }}>{d.district}</td>
                          <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 'bold', color: d.threatScore >= 75 ? '#FF4E4E' : d.threatScore >= 50 ? '#FFB020' : '#27D4FF' }}>{d.threatScore}</td>
                          <td style={{ padding: '3px 0', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '8px',
                              padding: '1px 3px',
                              borderRadius: '2px',
                              background: d.trend === 'Escalating' ? 'rgba(255, 78, 78, 0.15)' : d.trend === 'Declining' ? 'rgba(32, 227, 162, 0.15)' : 'rgba(255, 176, 32, 0.15)',
                              color: d.trend === 'Escalating' ? '#FF4E4E' : d.trend === 'Declining' ? '#20E3A2' : '#FFB020',
                              fontWeight: 'bold'
                            }}>
                              {d.trend === 'Escalating' ? '↑' : d.trend === 'Declining' ? '↓' : '•'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Row 2 - Chart C: Crime Category Distribution */}
            <div className="intel-card col-span-6" style={{ height: '170px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#e6eef8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crime Category Distribution</h3>
              <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 20px)' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>

            {/* Row 2 - Chart D: Confidence Intelligence Assessment */}
            <div className="intel-card col-span-6" style={{ height: '170px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#e6eef8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confidence Intelligence Profile</h3>
              <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 20px)' }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>

          {/* AI Intelligence Summary Panel */}
          <div className="intel-card" style={{ borderLeft: '3px solid #27D4FF', padding: '10px 14px' }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#27D4FF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>AI Intelligence Narrative Summary</h4>
            <p style={{ color: '#E6FCFF', fontSize: '10.5px', lineHeight: '1.4', margin: 0, fontWeight: '500' }}>
              {dynamicAIInsight}
            </p>
          </div>

          {/* Prediction Timeline */}
          <div className="intel-card" style={{ padding: '10px 12px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#e6eef8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Intelligence Alert History</h3>
            <div className="custom-scrollbar" style={{ maxHeight: '110px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, backgroundColor: 'rgba(15,23,42,0.95)' }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#9fb0d9', fontWeight: 'bold' }}>Time</th>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#9fb0d9', fontWeight: 'bold' }}>District</th>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#9fb0d9', fontWeight: 'bold' }}>Category Head</th>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: '#9fb0d9', fontWeight: 'bold' }}>Intelligence Classification</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: '#9fb0d9', fontWeight: 'bold', width: '65px' }}>Risk</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right', color: '#9fb0d9', fontWeight: 'bold', width: '70px' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {[...predictions].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((p, idx) => {
                    const r = normalizeRisk(p.riskLevel);
                    return (
                      <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', backgroundColor: idx % 2 ? 'rgba(39,212,255,0.015)' : 'transparent' }}>
                        <td style={{ padding: '4px 6px', color: '#9fb0d9' }}>{new Date(p.timestamp).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false })}</td>
                        <td style={{ padding: '4px 6px', color: '#27D4FF', fontWeight: '600' }}>{p.district}</td>
                        <td style={{ padding: '4px 6px', color: '#9fb0d9' }}>{p.crimeHead}</td>
                        <td style={{ padding: '4px 6px', color: '#e6eef8', fontWeight: '500' }}>{p.crimeType}</td>
                        <td style={{ padding: '2px 6px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            borderRadius: '3px',
                            fontSize: '8.5px',
                            fontWeight: '700',
                            padding: '1.5px 5px',
                            width: '100%',
                            textAlign: 'center',
                            backgroundColor: r === 'HIGH' ? 'rgba(255,78,78,0.15)' : r === 'MEDIUM' ? 'rgba(255,176,32,0.15)' : 'rgba(32,227,162,0.15)',
                            color: r === 'HIGH' ? '#FF4E4E' : r === 'MEDIUM' ? '#FFB020' : '#20E3A2'
                          }}>
                            {r}
                          </span>
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', color: '#20E3A2', fontWeight: '600' }}>{p.confidence}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
