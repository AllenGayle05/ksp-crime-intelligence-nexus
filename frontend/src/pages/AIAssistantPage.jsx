import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { usePredictions } from '../context/PredictionContext';
import './AIAssistantPage.css';

// ─── Intelligence Engine ─────────────────────────────────────────────────────
// Processes prediction data and generates structured intelligence responses
// based on keyword matching against the user query.
// ─────────────────────────────────────────────────────────────────────────────

function useIntelligenceEngine(predictions) {
  const normalizeRisk = (r) => (r || 'Low').toUpperCase();

  const analytics = useMemo(() => {
    const total = predictions.length;
    if (total === 0) return null;

    const sorted = [...predictions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const highRisk = predictions.filter(p => normalizeRisk(p.riskLevel) === 'HIGH');
    const medRisk = predictions.filter(p => normalizeRisk(p.riskLevel) === 'MEDIUM');
    const lowRisk = predictions.filter(p => normalizeRisk(p.riskLevel) === 'LOW');

    // District aggregation
    const districtMap = {};
    predictions.forEach((p, idx) => {
      if (!districtMap[p.district]) {
        districtMap[p.district] = { count: 0, highCount: 0, totalConf: 0, crimes: [], riskScores: [] };
      }
      const d = districtMap[p.district];
      d.count++;
      d.totalConf += (p.confidence || 0);
      d.crimes.push(p.crimeHead);
      d.riskScores.push(normalizeRisk(p.riskLevel) === 'HIGH' ? 3 : normalizeRisk(p.riskLevel) === 'MEDIUM' ? 2 : 1);
      if (normalizeRisk(p.riskLevel) === 'HIGH') d.highCount++;
    });

    const districtRanking = Object.entries(districtMap)
      .map(([name, d]) => ({
        name,
        score: Math.min(98, Math.round(d.riskScores.reduce((a, b) => a + b, 0) * 12 + d.highCount * 15 + d.count * 5)),
        count: d.count,
        highCount: d.highCount,
        avgConf: Math.round(d.totalConf / d.count),
        topCrime: d.crimes.sort((a, b) => d.crimes.filter(v => v === b).length - d.crimes.filter(v => v === a).length)[0]
      }))
      .sort((a, b) => b.score - a.score);

    // Category aggregation
    const categories = {};
    predictions.forEach(p => {
      const head = (p.crimeHead || '').toLowerCase();
      const type = (p.crimeType || '').toLowerCase();
      let cat = 'Other';
      if (head.includes('theft') || type.includes('theft') || head.includes('burglary') || type.includes('robbery')) cat = 'Theft';
      else if (head.includes('assault') || head.includes('murder') || head.includes('pocso') || head.includes('heinous') || type.includes('assault')) cat = 'Assault';
      else if (head.includes('missing') || type.includes('missing')) cat = 'Missing Person';
      else if (head.includes('fraud') || head.includes('cheating') || type.includes('fraud')) cat = 'Fraud';
      else if (head.includes('cyber') || head.includes('online') || head.includes('it act') || type.includes('cyber')) cat = 'Cyber Crime';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

    // Average confidence
    const avgConf = Math.round(predictions.reduce((s, p) => s + (p.confidence || 0), 0) / total);

    // Threat trend
    const recentSlice = sorted.slice(-Math.min(5, total));
    const recentHighPct = Math.round((recentSlice.filter(p => normalizeRisk(p.riskLevel) === 'HIGH').length / recentSlice.length) * 100);

    // Risk growth
    const thirdSize = Math.max(1, Math.floor(total / 3));
    const earlyRisk = sorted.slice(0, thirdSize).reduce((s, p) => s + (normalizeRisk(p.riskLevel) === 'HIGH' ? 3 : normalizeRisk(p.riskLevel) === 'MEDIUM' ? 2 : 1), 0) / thirdSize;
    const lateRisk = sorted.slice(-thirdSize).reduce((s, p) => s + (normalizeRisk(p.riskLevel) === 'HIGH' ? 3 : normalizeRisk(p.riskLevel) === 'MEDIUM' ? 2 : 1), 0) / thirdSize;
    const riskGrowth = earlyRisk > 0 ? Math.round(((lateRisk - earlyRisk) / earlyRisk) * 100) : 0;

    const threatIndex = Math.min(99, Math.max(5, Math.round(
      (highRisk.length * 90 + medRisk.length * 50 + lowRisk.length * 20) / total
    )));

    return {
      total,
      highRisk: highRisk.length,
      medRisk: medRisk.length,
      lowRisk: lowRisk.length,
      highPct: Math.round((highRisk.length / total) * 100),
      districtRanking,
      topDistrict: districtRanking[0],
      categories,
      topCategory,
      avgConf,
      recentHighPct,
      riskGrowth,
      threatIndex,
      sorted,
      latestPrediction: sorted[sorted.length - 1],
      districtMap
    };
  }, [predictions]);

  return analytics;
}

// ─── Response Generator ──────────────────────────────────────────────────────
function generateResponse(query, analytics) {
  const q = query.toLowerCase().trim();
  const a = analytics;

  // No data fallback
  if (!a) {
    return {
      executive: 'Intelligence system currently has no active prediction data loaded. The analytics engine requires at least one prediction record to generate meaningful intelligence.',
      risk: 'Unable to assess — no prediction data available in the system.',
      action: 'Navigate to the Prediction page and generate at least one crime prediction to activate the intelligence pipeline.',
      confidence: 0,
      priority: 'LOW'
    };
  }

  const top = a.topDistrict;
  const topCat = a.topCategory;

  // ─── PREDICTION INTELLIGENCE ───
  if (q.includes('most likely') || q.includes('probable') || (q.includes('crime') && q.includes('predict'))) {
    // Check if asking about a specific district
    const matchedDist = a.districtRanking.find(d => q.includes(d.name.toLowerCase()));
    if (matchedDist) {
      return {
        executive: `${matchedDist.name} has ${matchedDist.count} recorded intelligence alert(s) with a composite threat score of ${matchedDist.score}%. The dominant crime category is "${matchedDist.topCrime}" with an average model confidence of ${matchedDist.avgConf}%. ${matchedDist.highCount} out of ${matchedDist.count} predictions are classified HIGH risk.`,
        risk: matchedDist.highCount > 0 ? `ELEVATED — ${matchedDist.highCount} HIGH-risk prediction(s) detected. Proactive intervention recommended.` : `MODERATE — No HIGH-risk predictions currently, but continued monitoring advised.`,
        action: matchedDist.highCount >= 2 ? `Deploy rapid response units to ${matchedDist.name}. Prioritize ${matchedDist.topCrime} investigation. Increase patrol frequency by 40%.` : `Maintain standard patrol coverage in ${matchedDist.name}. Assign one investigative unit to monitor ${matchedDist.topCrime} trends.`,
        confidence: matchedDist.avgConf,
        priority: matchedDist.score >= 70 ? 'CRITICAL' : matchedDist.score >= 45 ? 'HIGH' : 'MEDIUM'
      };
    }
    return {
      executive: `Based on ${a.total} intelligence records, the most probable crime type is "${topCat[0]}" (${topCat[1]} occurrences, ${Math.round((topCat[1] / a.total) * 100)}% of all alerts). The highest-risk district is ${top.name} with a threat score of ${top.score}%. System-wide, ${a.highPct}% of all predictions are classified as HIGH risk.`,
      risk: a.highPct > 50 ? `CRITICAL — Over half of all predictions (${a.highPct}%) are HIGH risk. Immediate strategic response required.` : `ELEVATED — ${a.highPct}% HIGH risk rate. Maintain heightened surveillance.`,
      action: `Focus investigative resources on ${topCat[0]}-related cases in ${top.name}. Recommend cross-district coordination for pattern analysis. Deploy predictive patrol schedules targeting peak crime hours.`,
      confidence: a.avgConf,
      priority: a.highPct > 50 ? 'CRITICAL' : 'HIGH'
    };
  }

  if (q.includes('why') && (q.includes('prediction') || q.includes('generated'))) {
    return {
      executive: `Predictions are generated using a gradient-boosted machine learning model trained on historical Karnataka State Police FIR data. The model analyzes temporal patterns (year, month), geographic risk factors (district), crime type prevalence, and historical incidence rates to produce forward-looking risk assessments.`,
      risk: `Model accuracy depends on data quality and recency. Current system confidence averages ${a.avgConf}%.`,
      action: `Ensure prediction parameters are validated against real-world conditions. Cross-reference AI predictions with field intelligence before deploying resources. Run periodic model calibration checks.`,
      confidence: a.avgConf,
      priority: 'MEDIUM'
    };
  }

  if (q.includes('confidence') && (q.includes('score') || q.includes('explain') || q.includes('what'))) {
    return {
      executive: `The confidence score represents the ML model's statistical certainty about its prediction, expressed as a percentage (0-100%). The current system-wide average confidence is ${a.avgConf}%. HIGH-risk predictions average ${a.highRisk > 0 ? Math.round(predictions.filter(p => normalizeRisk(p.riskLevel) === 'HIGH').reduce((s, p) => s + (p.confidence || 0), 0) / a.highRisk) : 'N/A'}% confidence. Scores above 75% indicate strong predictive reliability.`,
      risk: a.avgConf < 60 ? `CAUTION — Average confidence below 60% suggests model uncertainty. Predictions should be corroborated with field data.` : `RELIABLE — ${a.avgConf}% average confidence indicates strong model performance.`,
      action: `For scores above 80%: treat as high-reliability intelligence. For 60-80%: corroborate with field data before resource deployment. Below 60%: use as supplementary intelligence only.`,
      confidence: a.avgConf,
      priority: 'MEDIUM'
    };
  }

  if (q.includes('risk level') || q.includes('risk details') || q.includes('risk classification')) {
    return {
      executive: `Current risk distribution across ${a.total} predictions: HIGH risk — ${a.highRisk} (${a.highPct}%), MEDIUM risk — ${a.medRisk} (${Math.round((a.medRisk / a.total) * 100)}%), LOW risk — ${a.lowRisk} (${Math.round((a.lowRisk / a.total) * 100)}%). The system assigns risk levels based on historical crime severity, district vulnerability profiles, and temporal risk patterns.`,
      risk: a.highPct > 60 ? `CRITICAL — ${a.highPct}% HIGH risk concentration requires immediate command-level attention.` : `MANAGEABLE — Risk distribution within acceptable operational parameters.`,
      action: `Prioritize HIGH-risk alerts for immediate response. Schedule MEDIUM-risk cases for next-shift deployment. Monitor LOW-risk predictions for pattern escalation indicators.`,
      confidence: a.avgConf,
      priority: a.highPct > 60 ? 'CRITICAL' : a.highPct > 40 ? 'HIGH' : 'MEDIUM'
    };
  }

  if (q.includes('factor') && q.includes('influence')) {
    return {
      executive: `The prediction model considers these primary factors: (1) Historical FIR frequency per district, (2) Crime type recurrence patterns, (3) Temporal signals — month and seasonal trends, (4) District-level vulnerability indices, (5) Recent crime acceleration rate. The latest prediction for ${a.latestPrediction?.district || 'N/A'} was driven primarily by elevated ${a.latestPrediction?.crimeHead || 'crime'} activity in the region.`,
      risk: `Factor weights are model-internal. Sudden changes in input data distribution may affect accuracy.`,
      action: `Cross-validate model outputs against ground-truth FIR data monthly. Flag districts where actual crime diverges >20% from predicted patterns for model retraining.`,
      confidence: a.avgConf,
      priority: 'MEDIUM'
    };
  }

  // ─── ANALYTICS INTELLIGENCE ───
  if (q.includes('highest threat') || q.includes('highest risk district') || q.includes('top district') || q.includes('most dangerous district')) {
    return {
      executive: `${top.name} ranks #1 in threat concentration with a composite score of ${top.score}%. This district has ${top.count} intelligence alerts, ${top.highCount} classified HIGH risk, and dominant crime type "${top.topCrime}". Average prediction confidence: ${top.avgConf}%.`,
      risk: top.score >= 70 ? `CRITICAL — Threat score exceeds 70%. Requires immediate command attention and rapid deployment.` : `ELEVATED — Active threat detected. Heightened patrol recommended.`,
      action: `1. Deploy additional patrol units to ${top.name}.\n2. Establish a command post for real-time intelligence coordination.\n3. Activate inter-agency task force for ${top.topCrime} investigation.\n4. Increase night patrol frequency by 50%.`,
      confidence: top.avgConf,
      priority: top.score >= 70 ? 'CRITICAL' : 'HIGH'
    };
  }

  if (q.includes('crime trend') || q.includes('trend') || q.includes('explain trend')) {
    const trendWord = a.riskGrowth > 15 ? 'sharply escalating' : a.riskGrowth > 0 ? 'gradually increasing' : a.riskGrowth < -15 ? 'significantly declining' : 'relatively stable';
    return {
      executive: `Overall crime risk trajectory is ${trendWord} (${a.riskGrowth >= 0 ? '+' : ''}${a.riskGrowth}% growth). Recent alert activity shows ${a.recentHighPct}% HIGH-risk concentration in the last 5 predictions. The dominant crime category is ${topCat[0]} (${topCat[1]} alerts, ${Math.round((topCat[1] / a.total) * 100)}% share).`,
      risk: a.riskGrowth > 15 ? `ESCALATING — Crime risk is accelerating. Proactive measures urgently required.` : a.riskGrowth < -10 ? `IMPROVING — Crime risk declining, but sustained monitoring essential.` : `STABLE — No significant trend deviation detected.`,
      action: a.riskGrowth > 10 ? `Increase staffing for upcoming shifts. Review patrol deployment to cover emerging ${topCat[0]} hotspots. Conduct joint operations with neighboring districts.` : `Maintain current patrol strategy. Continue monitoring for pattern changes. Prepare contingency plans for potential escalation.`,
      confidence: a.avgConf,
      priority: a.riskGrowth > 15 ? 'CRITICAL' : a.riskGrowth > 0 ? 'HIGH' : 'MEDIUM'
    };
  }

  if (q.includes('compare district') || q.includes('district comparison')) {
    const ranking = a.districtRanking.slice(0, 5);
    const comparisonText = ranking.map((d, i) => `${i + 1}. ${d.name} — Score: ${d.score}%, Alerts: ${d.count}, HIGH: ${d.highCount}, Top: ${d.topCrime}`).join('\n');
    return {
      executive: `District threat comparison (Top ${ranking.length}):\n${comparisonText}\n\nSpread between #1 and #${ranking.length}: ${ranking[0].score - ranking[ranking.length - 1].score} points, indicating ${ranking[0].score - ranking[ranking.length - 1].score > 30 ? 'significant disparity' : 'moderate variation'} in threat levels.`,
      risk: ranking[0].score >= 70 ? `CRITICAL — ${ranking[0].name} significantly outpaces other districts in threat level.` : `ELEVATED — Top districts require focused attention.`,
      action: `Redistribute patrol resources proportionally: allocate ${Math.round(ranking[0].score / ranking.reduce((s, d) => s + d.score, 0) * 100)}% to ${ranking[0].name}, balance remainder across other hotspot districts.`,
      confidence: a.avgConf,
      priority: 'HIGH'
    };
  }

  if (q.includes('summarize') || q.includes('summary') || q.includes('intelligence data')) {
    return {
      executive: `Intelligence Summary — ${a.total} predictions processed. Risk profile: ${a.highRisk} HIGH (${a.highPct}%), ${a.medRisk} MEDIUM, ${a.lowRisk} LOW. Top threat: ${top.name} at ${top.score}%. Primary crime: ${topCat[0]} (${topCat[1]} alerts). Risk trajectory: ${a.riskGrowth >= 0 ? '+' : ''}${a.riskGrowth}%. System confidence: ${a.avgConf}%.`,
      risk: `Overall threat level: ${a.threatIndex >= 70 ? 'CRITICAL' : a.threatIndex >= 45 ? 'ELEVATED' : 'MODERATE'} (Threat Index: ${a.threatIndex}%).`,
      action: `Review all HIGH-risk predictions for immediate actionability. Cross-reference ${topCat[0]} trends with field reports. Schedule command briefing within the hour.`,
      confidence: a.avgConf,
      priority: a.threatIndex >= 70 ? 'CRITICAL' : 'HIGH'
    };
  }

  if (q.includes('escalation') || q.includes('escalation rate')) {
    return {
      executive: `Escalation rate measures the concentration of HIGH-risk predictions in recent activity. Current rate: ${a.recentHighPct}% (${a.highRisk} HIGH-risk alerts out of last ${Math.min(5, a.total)} predictions). Values above 60% trigger elevated alert status.`,
      risk: a.recentHighPct >= 60 ? `HIGH ALERT — Escalation rate at ${a.recentHighPct}% exceeds critical threshold.` : `NORMAL — Escalation rate within acceptable range.`,
      action: a.recentHighPct >= 60 ? `Activate rapid response protocol. Increase patrol density in top threat districts. Initiate command-level briefing.` : `Maintain standard monitoring cadence. Review escalation trends weekly.`,
      confidence: a.avgConf,
      priority: a.recentHighPct >= 60 ? 'CRITICAL' : 'MEDIUM'
    };
  }

  if (q.includes('which district') && (q.includes('attention') || q.includes('require') || q.includes('needs'))) {
    const critical = a.districtRanking.filter(d => d.score >= 50);
    return {
      executive: `${critical.length} district(s) currently require elevated attention:\n${critical.map(d => `• ${d.name} — Threat: ${d.score}%, HIGH alerts: ${d.highCount}, Primary: ${d.topCrime}`).join('\n') || '• No districts exceed critical threshold.'}\n\nPrimary concern: ${top.name} with score ${top.score}%.`,
      risk: critical.length >= 3 ? `CRITICAL — Multiple districts above threat threshold. Resources are stretched.` : `MANAGEABLE — Focus on priority districts.`,
      action: `Deploy additional resources to ${critical.slice(0, 2).map(d => d.name).join(' and ')}. Schedule cross-district coordination meetings. Activate intelligence sharing between stations.`,
      confidence: a.avgConf,
      priority: critical.length >= 3 ? 'CRITICAL' : 'HIGH'
    };
  }

  // ─── HOTSPOT INTELLIGENCE ───
  if (q.includes('hotspot') && (q.includes('dangerous') || q.includes('most'))) {
    return {
      executive: `Hotspot analysis identifies ${top.name} as the most dangerous active zone with ${top.count} intelligence alerts and a threat score of ${top.score}%. The area shows concentrated ${top.topCrime} activity. ${top.highCount > 1 ? `Multiple HIGH-risk events (${top.highCount}) suggest systematic criminal pattern rather than isolated incidents.` : 'Current data suggests isolated incident pattern.'}`,
      risk: `CRITICAL — Hotspot concentration in ${top.name} demands immediate strategic intervention.`,
      action: `1. Establish mobile command post in ${top.name}.\n2. Deploy plainclothes surveillance teams.\n3. Coordinate with local intelligence networks.\n4. Implement CCTV monitoring sweep.\n5. Schedule nightly patrol saturation for 7 days.`,
      confidence: top.avgConf,
      priority: 'CRITICAL'
    };
  }

  if (q.includes('hotspot') && (q.includes('why') || q.includes('marked') || q.includes('reason'))) {
    return {
      executive: `Districts are designated as hotspots based on: (1) Weighted prediction count — more alerts increase hotspot score, (2) Risk severity — HIGH-risk predictions carry 3x weight, (3) Recency — recent predictions score higher via exponential decay, (4) Confidence level — higher model confidence amplifies the signal. ${top.name} qualifies due to ${top.count} alerts with ${top.highCount} HIGH-risk classifications and ${top.avgConf}% average confidence.`,
      risk: `Hotspot designation is dynamic — rankings shift with every new prediction. Current data may not reflect emerging threats in previously quiet districts.`,
      action: `Monitor hotspot evolution hourly. Compare current rankings against last 24h shift. Flag any district moving up 2+ positions in ranking.`,
      confidence: a.avgConf,
      priority: 'HIGH'
    };
  }

  if (q.includes('patrol') && (q.includes('deploy') || q.includes('recommend'))) {
    const topDists = a.districtRanking.slice(0, 3);
    const totalScore = topDists.reduce((s, d) => s + d.score, 0);
    return {
      executive: `Patrol deployment recommendation based on current threat intelligence:\n${topDists.map(d => `• ${d.name}: Deploy ${Math.round((d.score / totalScore) * 100)}% of available units — Primary target: ${d.topCrime} (Threat: ${d.score}%)`).join('\n')}\n\nRecommend 24/7 coverage in ${topDists[0].name}. Standard shift coverage for remaining districts.`,
      risk: `Under-deploying to ${topDists[0].name} risks escalation. Over-deploying may leave secondary districts vulnerable.`,
      action: `Execute patrol redistribution within next 4 hours. Notify shift commanders of updated beat assignments. Deploy rapid-response backup unit to cover secondary threats.`,
      confidence: a.avgConf,
      priority: topDists[0].score >= 70 ? 'CRITICAL' : 'HIGH'
    };
  }

  if (q.includes('hotspot') && (q.includes('ranking') || q.includes('rank') || q.includes('list'))) {
    const ranking = a.districtRanking.slice(0, 5);
    return {
      executive: `Current hotspot ranking (Top ${ranking.length}):\n${ranking.map((d, i) => `${i + 1}. ${d.name} — Threat Score: ${d.score}%, Alerts: ${d.count}, HIGH: ${d.highCount}`).join('\n')}\n\nDelta between #1 and #${ranking.length}: ${ranking[0].score - ranking[ranking.length - 1].score} points.`,
      risk: ranking[0].score >= 70 ? `CRITICAL — Top hotspot at ${ranking[0].score}% requires immediate escalation.` : `ELEVATED — Active monitoring of top 3 hotspots required.`,
      action: `Brief station heads on updated ranking. Reallocate investigation units proportionally. Flag any district showing >15% score increase over 24 hours.`,
      confidence: a.avgConf,
      priority: 'HIGH'
    };
  }

  if (q.includes('hotspot') && q.includes('evolution')) {
    return {
      executive: `Hotspot evolution tracking: Risk growth rate is ${a.riskGrowth >= 0 ? '+' : ''}${a.riskGrowth}% comparing early vs recent prediction history. ${a.riskGrowth > 10 ? 'Threat landscape is expanding — new hotspots may be emerging.' : a.riskGrowth < -10 ? 'Threat landscape is contracting — interventions may be effective.' : 'Hotspot pattern is stable.'} ${top.name} remains the persistent primary hotspot with ${top.count} cumulative alerts.`,
      risk: `Hotspot evolution requires continuous monitoring. Static snapshots can miss emerging micro-hotspots.`,
      action: `Implement automated hotspot drift detection. Compare weekly rankings to identify emerging and declining threat zones. Schedule monthly strategic review of hotspot evolution.`,
      confidence: a.avgConf,
      priority: 'MEDIUM'
    };
  }

  // ─── COMMAND QUERIES ───
  if (q.includes('briefing') || q.includes('intelligence briefing') || q.includes('complete briefing')) {
    return {
      executive: `KSP CRIME INTELLIGENCE BRIEFING — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n• Total Intelligence Alerts: ${a.total}\n• Risk Distribution: HIGH ${a.highRisk} (${a.highPct}%) | MEDIUM ${a.medRisk} | LOW ${a.lowRisk}\n• Threat Index: ${a.threatIndex}%\n• Primary Threat: ${top.name} (Score: ${top.score}%)\n• Dominant Crime: ${topCat[0]} (${topCat[1]} alerts)\n• Trend: ${a.riskGrowth >= 0 ? '+' : ''}${a.riskGrowth}% risk trajectory\n• System Confidence: ${a.avgConf}%\n• Active Hotspots: ${a.districtRanking.filter(d => d.score >= 50).length} districts above threshold`,
      risk: `Overall posture: ${a.threatIndex >= 70 ? 'CRITICAL — Multiple high-threat vectors detected' : a.threatIndex >= 45 ? 'ELEVATED — Sustained vigilance required' : 'MODERATE — Standard operations sufficient'}.`,
      action: `1. Deploy to ${top.name} with priority coverage.\n2. Activate ${topCat[0]} task force.\n3. Schedule next briefing in 6 hours.\n4. Share intelligence summary with all station commanders.\n5. Flag any new HIGH-risk predictions for immediate review.`,
      confidence: a.avgConf,
      priority: a.threatIndex >= 70 ? 'CRITICAL' : 'HIGH'
    };
  }

  if (q.includes('action plan') || q.includes('police action')) {
    return {
      executive: `POLICE ACTION PLAN — Generated from ${a.total} intelligence alerts.\n\n📋 IMMEDIATE (0-4 hours):\n• Deploy to ${top.name} — ${top.topCrime} interdiction\n• Increase patrol density by 50% in top 3 districts\n\n📋 SHORT-TERM (4-24 hours):\n• Establish cross-district coordination\n• Brief all station commanders on threat ranking\n• Activate CCTV monitoring protocols\n\n📋 STRATEGIC (24-72 hours):\n• Review patrol beat assignments\n• Conduct inter-agency intelligence sharing\n• Prepare weekly threat assessment report`,
      risk: `Inaction risk: ${a.highPct}% of predictions are HIGH risk. Delayed response increases probability of incident materialization.`,
      action: `Execute Phase 1 (Immediate) within 4 hours. Assign lead officer for each phase. Report progress at next shift handover.`,
      confidence: a.avgConf,
      priority: 'CRITICAL'
    };
  }

  if (q.includes('resource') && q.includes('allocation')) {
    const topDists = a.districtRanking.slice(0, 4);
    const totalScore = topDists.reduce((s, d) => s + d.score, 0);
    return {
      executive: `RESOURCE ALLOCATION MATRIX:\n\n${topDists.map(d => `📍 ${d.name}: ${Math.round((d.score / totalScore) * 100)}% of resources — ${d.highCount} HIGH-risk targets — Focus: ${d.topCrime}`).join('\n')}\n\nTotal patrol units recommended: ${Math.max(8, a.highRisk * 3)} (based on ${a.highRisk} HIGH-risk predictions × 3 units each).\nInvestigation teams: ${Math.max(2, Math.ceil(a.highRisk * 0.5))} dedicated squads.`,
      risk: `Resource strain alert: ${a.districtRanking.filter(d => d.score >= 50).length} active hotspots competing for limited resources.`,
      action: `Implement tiered resource allocation. Priority 1: ${topDists[0].name}. Priority 2: ${topDists[1]?.name || 'N/A'}. Activate reserve units if HIGH-risk count exceeds ${a.highRisk + 3}.`,
      confidence: a.avgConf,
      priority: 'HIGH'
    };
  }

  if (q.includes('preventive') || q.includes('prevent')) {
    return {
      executive: `PREVENTIVE MEASURES — Based on ${topCat[0]} concentration in ${top.name}:\n\n1. Community policing: Increase beat officer visibility in ${top.name}\n2. CCTV enhancement: Deploy additional surveillance at identified ${topCat[0]} hotspots\n3. Intelligence-led patrols: Schedule patrols during peak crime hours\n4. Public awareness: Launch crime prevention campaigns in high-risk zones\n5. Stakeholder engagement: Coordinate with local businesses and community leaders\n6. Digital monitoring: Activate social media intelligence feeds for early warning`,
      risk: `Preventive measures have a 48-72 hour lag before impact. Immediate tactical response still required for active threats.`,
      action: `Begin implementing measures within 24 hours. Assign each measure to a designated officer. Set weekly review cadence for effectiveness assessment.`,
      confidence: a.avgConf,
      priority: 'HIGH'
    };
  }

  if (q.includes('investigation') && (q.includes('strategy') || q.includes('plan'))) {
    return {
      executive: `INVESTIGATION STRATEGY — Targeting ${topCat[0]} in ${top.name}\n\n🔍 Phase 1 — Intelligence Gathering:\n• Compile all ${top.count} prediction records for ${top.name}\n• Cross-reference with historical FIR database\n• Map crime temporal patterns\n\n🔍 Phase 2 — Pattern Analysis:\n• Identify repeat offender networks\n• Analyze geographic clustering within district\n• Check for inter-district criminal mobility\n\n🔍 Phase 3 — Tactical Execution:\n• Deploy investigation teams to primary crime zones\n• Coordinate with forensics and cyber units\n• Establish informant network activation`,
      risk: `Investigation may reveal larger criminal networks requiring additional resources.`,
      action: `Assign senior investigating officer. Form 3-person investigation squad. Set 14-day initial timeline with weekly progress reports.`,
      confidence: a.avgConf,
      priority: 'HIGH'
    };
  }

  if (q.includes('today') && q.includes('report')) {
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      executive: `DAILY INTELLIGENCE REPORT — ${today}\n\n📊 Total Alerts: ${a.total}\n🔴 HIGH Risk: ${a.highRisk} (${a.highPct}%)\n🟡 MEDIUM: ${a.medRisk}\n🟢 LOW: ${a.lowRisk}\n📍 Top Threat: ${top.name} (${top.score}%)\n📈 Trend: ${a.riskGrowth >= 0 ? '+' : ''}${a.riskGrowth}%\n🎯 Primary Crime: ${topCat[0]}\n💡 Confidence: ${a.avgConf}%\n\nLatest alert: ${a.latestPrediction?.district || 'N/A'} — ${a.latestPrediction?.crimeHead || 'N/A'} (${a.latestPrediction?.riskLevel || 'N/A'} Risk)`,
      risk: `${a.threatIndex >= 70 ? 'CRITICAL' : a.threatIndex >= 45 ? 'ELEVATED' : 'MODERATE'} — Threat Index at ${a.threatIndex}%.`,
      action: `Forward report to all station commanders. Schedule follow-up briefing for 1800 hours. Update patrol deployment as needed.`,
      confidence: a.avgConf,
      priority: a.threatIndex >= 70 ? 'CRITICAL' : 'HIGH'
    };
  }

  if (q.includes('threat assessment') || q.includes('assess threat')) {
    return {
      executive: `THREAT ASSESSMENT REPORT\n\nOverall Threat Index: ${a.threatIndex}% — ${a.threatIndex >= 70 ? 'CRITICAL' : a.threatIndex >= 45 ? 'ELEVATED' : 'MODERATE'}\n\n• ${a.highRisk} active HIGH-risk threats across ${Object.keys(a.districtMap).length} districts\n• Escalation probability: ${a.recentHighPct}%\n• Risk trajectory: ${a.riskGrowth >= 0 ? 'Increasing' : 'Declining'} (${a.riskGrowth >= 0 ? '+' : ''}${a.riskGrowth}%)\n• Primary vector: ${topCat[0]} via ${top.name}\n• System reliability: ${a.avgConf}% avg confidence`,
      risk: a.threatIndex >= 70 ? `CRITICAL — Multiple threat vectors active. Immediate escalation to command authority required.` : `ELEVATED — Threats identified and being tracked. Continued vigilance essential.`,
      action: `1. Alert all district command centers.\n2. Activate rapid response standby in ${top.name}.\n3. Implement enhanced surveillance protocols.\n4. Prepare situation report for state HQ.`,
      confidence: a.avgConf,
      priority: a.threatIndex >= 70 ? 'CRITICAL' : 'HIGH'
    };
  }

  // ─── DEFAULT / FALLBACK ───
  return {
    executive: `Based on current intelligence data (${a.total} predictions), the system identifies ${top.name} as the primary threat zone (Score: ${top.score}%) with ${topCat[0]} as the dominant crime category. ${a.highPct}% of all alerts are HIGH risk. System confidence: ${a.avgConf}%.`,
    risk: `Threat posture: ${a.threatIndex >= 70 ? 'CRITICAL' : a.threatIndex >= 45 ? 'ELEVATED' : 'MODERATE'} (Index: ${a.threatIndex}%).`,
    action: `Review the Analytics dashboard for detailed visualizations. Use quick commands below for specific intelligence queries.`,
    confidence: a.avgConf,
    priority: a.threatIndex >= 70 ? 'CRITICAL' : a.threatIndex >= 45 ? 'HIGH' : 'MEDIUM'
  };
}

// Helper needed inside generateResponse for confidence query
const normalizeRisk = (r) => (r || 'Low').toUpperCase();

// ─── Quick Command Definitions ──────────────────────────────────────────────
const QUICK_COMMANDS = [
  { icon: '🔴', label: 'Highest Risk District', query: 'Which district has the highest threat score?' },
  { icon: '📋', label: 'Generate Briefing', query: 'Give a complete intelligence briefing.' },
  { icon: '🚔', label: 'Patrol Recommendation', query: 'Recommend patrol deployment.' },
  { icon: '📈', label: 'Crime Trends', query: 'Explain current crime trends.' },
  { icon: '📍', label: 'Hotspot Analysis', query: 'Which hotspot is most dangerous?' },
  { icon: '⚡', label: 'Threat Assessment', query: 'Generate threat assessment.' },
  { icon: '🧑‍✈️', label: 'Resource Allocation', query: 'Recommend resource allocation.' },
  { icon: '🔍', label: 'Investigation Plan', query: 'Generate investigation strategy.' },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const { predictions } = usePredictions();
  const analytics = useIntelligenceEngine(predictions);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: null, // special welcome message
      isWelcome: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const processQuery = useCallback((query) => {
    // Add user message
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing delay (600-1200ms)
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const response = generateResponse(query, analytics);
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);
    }, delay);
  }, [analytics]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    processQuery(input.trim());
  };

  const handleQuickCommand = (cmd) => {
    if (isTyping) return;
    processQuery(cmd.query);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      default: return 'low';
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div className="ai-assistant-page">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-header-icon">🤖</div>
          <div>
            <h1 className="ai-header-title">AI Command Assistant</h1>
            <p className="ai-header-subtitle">KSP Integrated Intelligence System v2.0</p>
          </div>
        </div>
        <div className="ai-status-badge">
          <span className="ai-status-dot" />
          SYSTEM ACTIVE — {predictions.length} INTEL RECORDS
        </div>
      </div>

      {/* Main Layout */}
      <div className="ai-main-layout">
        {/* Chat Panel */}
        <div className="ai-chat-panel">
          <div className="ai-messages">
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                {msg.isWelcome ? (
                  /* Welcome Message */
                  <div className="ai-welcome-msg">
                    <span className="ai-welcome-shield">🛡️</span>
                    <h3 className="ai-welcome-title">Welcome, Officer.</h3>
                    <p className="ai-welcome-text">
                      I am the KSP Crime Intelligence AI Assistant. I can analyze predictions,
                      explain trends, identify hotspots, recommend deployments, and generate
                      intelligence briefings. Use the quick commands or type your query below.
                    </p>
                    <div className="ai-badge-row" style={{ justifyContent: 'center', marginTop: '12px' }}>
                      <span className="ai-priority-badge medium" style={{ fontSize: '8px' }}>
                        {predictions.length} PREDICTIONS LOADED
                      </span>
                      <span className="ai-priority-badge low" style={{ fontSize: '8px' }}>
                        ENGINE READY
                      </span>
                    </div>
                  </div>
                ) : msg.role === 'user' ? (
                  /* User Message */
                  <div className="ai-message user">
                    <div className="ai-msg-avatar">👤</div>
                    <div>
                      <div className="ai-msg-bubble">{msg.content}</div>
                      <div className="ai-msg-timestamp">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ) : (
                  /* Assistant Structured Response */
                  <div className="ai-message assistant">
                    <div className="ai-msg-avatar">🤖</div>
                    <div>
                      <div className="ai-msg-bubble">
                        {/* Executive Summary */}
                        <div className="ai-response-section">
                          <div className="ai-response-label exec">📋 Executive Summary</div>
                          <div className="ai-response-text" style={{ whiteSpace: 'pre-line' }}>{msg.content.executive}</div>
                        </div>
                        <div className="ai-response-divider" />

                        {/* Risk Assessment */}
                        <div className="ai-response-section">
                          <div className="ai-response-label risk">⚠️ Risk Assessment</div>
                          <div className="ai-response-text">{msg.content.risk}</div>
                        </div>
                        <div className="ai-response-divider" />

                        {/* Recommended Action */}
                        <div className="ai-response-section">
                          <div className="ai-response-label action">✅ Recommended Police Action</div>
                          <div className="ai-response-text" style={{ whiteSpace: 'pre-line' }}>{msg.content.action}</div>
                        </div>
                        <div className="ai-response-divider" />

                        {/* Badges */}
                        <div className="ai-badge-row">
                          <span className={`ai-priority-badge ${getPriorityClass(msg.content.priority)}`}>
                            PRIORITY: {msg.content.priority}
                          </span>
                          <span className="ai-priority-badge medium">
                            CONFIDENCE: {msg.content.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="ai-msg-timestamp">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="ai-typing-indicator">
                <div className="ai-msg-avatar" style={{
                  width: 30, height: 30, borderRadius: 8, fontSize: 14,
                  background: 'linear-gradient(135deg, rgba(39,212,255,0.2), rgba(124,92,255,0.2))',
                  border: '1px solid rgba(39,212,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>🤖</div>
                <div className="ai-typing-dots">
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                  <div className="ai-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form className="ai-input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="ai-input-field"
              type="text"
              placeholder="Enter intelligence query... (e.g., 'Which district has highest threat?')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              id="ai-query-input"
            />
            <button className="ai-send-btn" type="submit" disabled={!input.trim() || isTyping} id="ai-send-button">
              ▶
            </button>
          </form>
        </div>

        {/* Right Sidebar — Quick Commands & Intel */}
        <div className="ai-commands-panel">
          {/* Live Intel Cards */}
          <div className="ai-intel-card">
            <div className="ai-intel-card-title">Threat Index</div>
            <div className="ai-intel-card-value" style={{ color: analytics?.threatIndex >= 70 ? '#FF4E4E' : analytics?.threatIndex >= 45 ? '#FFB020' : '#27D4FF' }}>
              {analytics?.threatIndex || 0}%
            </div>
            <div className="ai-intel-card-label">System-wide threat level</div>
          </div>

          <div className="ai-intel-card">
            <div className="ai-intel-card-title">Active Alerts</div>
            <div className="ai-intel-card-value">{predictions.length}</div>
            <div className="ai-intel-card-label">{analytics?.highRisk || 0} HIGH risk</div>
          </div>

          {/* Quick Commands */}
          <div className="ai-cmd-section-title">Quick Commands</div>
          {QUICK_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              className="ai-cmd-btn"
              onClick={() => handleQuickCommand(cmd)}
              disabled={isTyping}
              id={`ai-cmd-${idx}`}
            >
              <span className="ai-cmd-icon">{cmd.icon}</span>
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
