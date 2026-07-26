import { useState, useEffect } from "react";
import axios from "axios";
import { usePredictions } from '../context/PredictionContext';
import './CrimePrediction.css';

export default function CrimePrediction({ showHistory = true }) {
  const { addPrediction, clearPredictions } = usePredictions();
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(6);
  const [district, setDistrict] = useState("");
  const [crimeHead, setCrimeHead] = useState("");
  const [districtOptions, setDistrictOptions] = useState([]);
  const [crimeHeadOptions, setCrimeHeadOptions] = useState([]);
  const [encodersLoading, setEncodersLoading] = useState(true);
  const [encodersError, setEncodersError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [investigatorNotes, setInvestigatorNotes] = useState('');

  const INSIGHTS = {
    "POCSO": {
      insight: "Possible offence involving protection of minors. Immediate victim protection and investigation recommended.",
      action: "Notify child-protection unit, secure victim support and preserve evidence."
    },
    "BURGLARY - DAY": {
      insight: "Property crime involving unlawful entry and theft during daytime hours. Area surveillance and offender tracking recommended.",
      action: "Review CCTV, alert nearby stations, and canvass witnesses."
    },
    "KARNATAKA POLICE ACT 1963": {
      insight: "Possible violation of local law enforcement or public order regulations. Further review of associated activities is recommended.",
      action: "Escalate to local legal team for review and follow-up."
    },
    "Failure to appear to Court": {
      insight: "Individual may have failed to comply with court attendance requirements. Verification of legal notices and warrant status recommended.",
      action: "Check court records, issue notices, and coordinate with process servers."
    },
    "NEGLIGENT ACT": {
      insight: "Incident may involve careless or unsafe actions leading to risk or harm. Review responsible parties and circumstances.",
      action: "Investigate circumstances, record witness statements, and assess liability."
    }
  };

  function getInsightFor(pred) {
    if (!pred) return { insight: null, action: null };
    if (INSIGHTS[pred]) return INSIGHTS[pred];
    const lower = pred.toLowerCase();
    // try to match by key substring
    for (const k of Object.keys(INSIGHTS)) {
      if (k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
        return INSIGHTS[k];
      }
    }
    return { insight: "No automated insight available for this crime group.", action: "Refer to specialists and review case details." };
  }

  useEffect(() => {
    // initialize prediction history from localStorage
    try {
      const raw = localStorage.getItem('predictionHistory');
      if (raw) setPredictionHistory(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
    try {
      const n = localStorage.getItem('investigatorNotes');
      if (n) setInvestigatorNotes(n);
    } catch (e) {}
    let mounted = true;
    setEncodersLoading(true);
    setEncodersError(null);
    const apiUrl = 'http://127.0.0.1:5000/encoders';
    console.log('Fetching encoders...');
    console.log('API URL:', apiUrl);

    async function fetchEncoders() {
      try {
        const resp = await axios.get(apiUrl, { timeout: 8000 });
        if (!mounted) return;
        console.log('API response:', resp.data);
        const apiData = resp.data || {};
        const d = apiData.District_Name || [];
        const c = apiData.CrimeHead_Name || [];
        console.log('District count:', d.length);
        console.log('Crime head count:', c.length);
        setDistrictOptions(d);
        setCrimeHeadOptions(c);
        // set sensible defaults if available
        if (d.length > 0) setDistrict((prev) => (prev && d.includes(prev) ? prev : d[0]));
        if (c.length > 0) setCrimeHead((prev) => (prev && c.includes(prev) ? prev : c[0]));
        setEncodersLoading(false);
      } catch (err) {
        console.error('ENCODER LOAD FAILED:', err);
        if (err && err.response) {
          console.error('Response status:', err.response.status, err.response.data);
        } else if (err && err.request) {
          console.error('No response received, request details:', err.request);
        } else {
          console.error('Request setup error:', err && err.message);
        }
        if (!mounted) return;
        setEncodersError('Failed to load encoders');
        setEncodersLoading(false);
      }
    }

    fetchEncoders();

    return () => (mounted = false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        FIR_YEAR: Number(year),
        FIR_MONTH: Number(month),
        District_Name: district,
        CrimeHead_Name: crimeHead,
      };

      const apiPredict = "http://127.0.0.1:5000/predict";
      const resp = await axios.post(apiPredict, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (resp.data && resp.data.predicted_crime_group) {
        setResult(resp.data.predicted_crime_group);
        if (resp.data.confidence_pct !== undefined) setConfidence(resp.data.confidence_pct);
        // add to in-memory prediction history (newest on top), keep only last 10
        const entry = {
          time: new Date().toLocaleString(),
          district: district,
          crimeHead: crimeHead,
          prediction: resp.data.predicted_crime_group,
          confidence: resp.data.confidence_pct !== undefined ? resp.data.confidence_pct : null,
        };
        
        // Store prediction in context
        addPrediction({
          district: district,
          crimeHead: crimeHead,
          crimeType: resp.data.predicted_crime_group,
          riskLevel: getRiskLevel(resp.data.confidence_pct),
          confidence: resp.data.confidence_pct !== undefined ? resp.data.confidence_pct : null,
          year: Number(year),
          month: Number(month)
        });
        
        // Update prediction history safely: compute next, update state, persist,
        // and dispatch the cross-window event asynchronously to avoid triggering
        // other components' updates during this component's render phase.
        let nextHistory;
        setPredictionHistory((prev) => {
          nextHistory = [entry, ...prev].slice(0, 10);
          return nextHistory;
        });
        try { localStorage.setItem('predictionHistory', JSON.stringify(nextHistory)); } catch (e) {}
        // Dispatch asynchronously so listeners don't run while we're rendering
        setTimeout(() => {
          try { window.dispatchEvent(new CustomEvent('predictionHistoryUpdated', { detail: nextHistory })); } catch (e) {}
        }, 0);
      } else {
        setError("Unable to generate prediction. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to generate prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crime-prediction-container">
      <h2 className="cp-title">AI Investigation — Predict Incident</h2>

      <div className="cp-card">
        <h3 className="cp-section-title">Crime Prediction Form</h3>
        <form onSubmit={handleSubmit} className="cp-form">
          <div className="cp-row">
            <label className="cp-label">FIR Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="cp-input"
              min={2000}
              max={2100}
              required
            />
          </div>

          <div className="cp-row">
            <label className="cp-label">FIR Month</label>
            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="cp-input"
              min={1}
              max={12}
              required
            />
          </div>

          <div className="cp-row">
            <label className="cp-label">District Name {encodersLoading && <span className="cp-loading">⏳</span>}</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="cp-input cp-select" required>
              {encodersLoading ? (
                <option value="" disabled>Loading...</option>
              ) : encodersError ? (
                <option value="" disabled>Failed to load districts</option>
              ) : (
                districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="cp-row">
            <label className="cp-label">Crime Head Name {encodersLoading && <span className="cp-loading">⏳</span>}</label>
            <select value={crimeHead} onChange={(e) => setCrimeHead(e.target.value)} className="cp-input cp-select" required>
              {encodersLoading ? (
                <option value="" disabled>Loading...</option>
              ) : encodersError ? (
                <option value="" disabled>Failed to load crime heads</option>
              ) : (
                crimeHeadOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="cp-actions">
            <button
              type="submit"
              className="cp-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 50 50" className="cp-spinner">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="6" />
                    <path d="M25 5 a20 20 0 0 1 0 40" stroke="white" strokeWidth="6" fill="none">
                      <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  Analyzing Crime Pattern...
                </>
              ) : (
                "Predict Crime"
              )}
            </button>
          </div>
        </form>

        {error && <div className="cp-error">{error}</div>}

        {result && (
          <div className="cp-result">
            <h4 className="cp-section-title">Prediction Result</h4>
            <div className="cp-result-row"><span className="cp-key">Prediction:</span><span className="cp-value">{result}</span></div>
            {confidence !== null && <div className="cp-result-row"><span className="cp-key">Confidence:</span><span className="cp-value">{confidence}%</span></div>}
            {confidence !== null && <div className="cp-result-row"><span className="cp-key">Risk Level:</span><span className="cp-value">{getRiskLevel(confidence)}</span></div>}
            <div className="cp-result-row"><span className="cp-key">District:</span><span className="cp-value">{district}</span></div>
            <div className="cp-result-row"><span className="cp-key">Crime Head:</span><span className="cp-value">{crimeHead}</span></div>
          </div>
        )}
        {result && (
          <>
            <div className="cp-case-summary card-effect">
              <h4 className="cp-section-title">AI Case Summary</h4>
              <div className="cp-insight-text">{generateCaseSummary(result, district, crimeHead, confidence)}</div>
            </div>

            <div className="cp-insight cp-card-effect">
              <h4 className="cp-section-title">Incident Insight</h4>
              <div className="cp-insight-text">{getInsightFor(result).insight}</div>
            </div>

            <div className="cp-action-suggestion card-effect">
              <h4 className="cp-section-title">Suggested Action</h4>
              <div className="cp-insight-text">{getInsightFor(result).action}</div>
            </div>

            <div className="cp-checklist card-effect">
              <h4 className="cp-section-title">Investigation Checklist</h4>
              <ul className="cp-checklist-list">
                <li>Verify FIR details</li>
                <li>Review previous related incidents</li>
                <li>Contact nearest station</li>
                <li>Gather witness statements</li>
                <li>Check CCTV and digital evidence</li>
                <li>Escalate if pattern repeats</li>
              </ul>
            </div>

            <div className="cp-metrics card-effect">
              <h4 className="cp-section-title">Prediction Metrics</h4>
              <div className="metrics-row">
                <div className="kpi-card"><div className="kpi-title">Confidence</div><div className="kpi-value">{confidence !== null ? `${confidence}%` : 'N/A'}</div></div>
                <div className="kpi-card"><div className="kpi-title">District</div><div className="kpi-value">{district || '—'}</div></div>
                <div className="kpi-card"><div className="kpi-title">Crime Type</div><div className="kpi-value">{crimeHead || '—'}</div></div>
                <div className="kpi-card"><div className="kpi-title">Risk</div><div className="kpi-value">{getRiskLevel(confidence)}</div></div>
                <div className="kpi-card"><div className="kpi-title">Prediction</div><div className="kpi-value">{result}</div></div>
              </div>
            </div>

            <div className="cp-insights-strip card-effect">
              <h4 className="cp-section-title">Crime Intelligence Insights</h4>
              <div className="insights-grid">
                <div className="insight-card-mini">📍<div className="mini-title">District Analysis</div><div>This district has recorded recurring incidents of similar categories.</div></div>
                <div className="insight-card-mini">📊<div className="mini-title">Pattern Detection</div><div>Prediction confidence suggests moderate similarity to historical records.</div></div>
                <div className="insight-card-mini">🚔<div className="mini-title">Recommended Focus</div><div>Prioritize verification and intelligence gathering.</div></div>
              </div>
            </div>

            <div className="cp-riskbar card-effect">
              <h4 className="cp-section-title">Risk Indicator</h4>
              <div className="risk-row">
                <div className="risk-meta">Confidence {confidence !== null ? `${confidence}%` : 'N/A'}</div>
                <div className="risk-bar">
                  <div className="risk-fill" style={{ width: `${Math.min(Math.max(confidence||0,0),100)}%`, background: riskGradient(confidence) }} />
                </div>
                <div className="risk-level">{getRiskLevel(confidence)}</div>
              </div>
            </div>

            <div className="cp-timeline card-effect">
              <h4 className="cp-section-title">Suggested Investigation Timeline</h4>
              <ol className="timeline-list">
                <li><strong>Day 1</strong> — Initial Verification</li>
                <li><strong>Day 2</strong> — Evidence Collection</li>
                <li><strong>Day 3</strong> — Witness Follow-up</li>
                <li><strong>Day 4</strong> — Case Review</li>
                <li><strong>Day 5</strong> — Final Assessment</li>
              </ol>
            </div>
          </>
        )}

        {showHistory && (
          <div className="cp-history">
            <h4 className="cp-section-title">Prediction History</h4>
            <div className="cp-history-meta">
              <div className="cp-muted">{predictionHistory.length} stored in this session</div>
              <button
                onClick={() => {
                  setPredictionHistory([]);
                  try { localStorage.removeItem('predictionHistory'); } catch (e) {}
                  clearPredictions();
                }}
                className="cp-button cp-button-danger"
                disabled={predictionHistory.length === 0}
              >
                Clear History
              </button>
            </div>

            {predictionHistory.length === 0 ? (
              <div className="cp-muted">No predictions yet.</div>
            ) : (
              <div className="cp-history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>District</th>
                      <th>Crime Head</th>
                      <th>Prediction</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictionHistory.map((h, idx) => (
                      <tr key={idx}>
                        <td>{h.time}</td>
                        <td>{h.district}</td>
                        <td>{h.crimeHead}</td>
                        <td>{h.prediction}</td>
                        <td>{h.confidence !== null && h.confidence !== undefined ? `${h.confidence}%` : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      <div className="cp-notes card-effect">
        <h4 className="cp-section-title">Investigator Notes</h4>
        <textarea className="cp-notes-area" value={investigatorNotes} onChange={(e)=>{ setInvestigatorNotes(e.target.value); try{ localStorage.setItem('investigatorNotes', e.target.value); }catch(err){} }} placeholder="Type notes here. Saved locally." />
      </div>
    </div>
  );
}
function getRiskLevel(conf) {
  const c = Number(conf);
  if (isNaN(c)) return 'UNKNOWN';
  if (c >= 75) return 'HIGH';
  if (c >= 50) return 'MEDIUM';
  return 'LOW';
}

function generateCaseSummary(prediction, district, crimeHead, confidence) {
  return `Based on historical FIR patterns, the selected district (${district || 'N/A'}) and crime category (${crimeHead || 'N/A'}) show characteristics similar to previous incidents classified as ${prediction}. Investigators should prioritize verification of related records and local intelligence inputs.`;
}

function riskGradient(conf) {
  const c = Number(conf || 0);
  if (isNaN(c)) return 'linear-gradient(90deg,#00E676,#00D4FF)';
  if (c >= 75) return 'linear-gradient(90deg,#FF5252,#FFB300)';
  if (c >=50) return 'linear-gradient(90deg,#FFB300,#7C4DFF)';
  return 'linear-gradient(90deg,#00E676,#00D4FF)';
}

function ConfidenceBadge({ confidence }) {
  const conf = Number(confidence);
  let bg = "#ef4444"; // red low
  let text = "LOW CONFIDENCE";
  if (!isNaN(conf)) {
    if (conf >= 75) {
      bg = "#16a34a"; // green
      text = "HIGH CONFIDENCE";
    } else if (conf >= 50) {
      bg = "#f59e0b"; // orange
      text = "MEDIUM CONFIDENCE";
    }
  }
  const style = {
    display: "inline-block",
    background: bg,
    color: "white",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 4,
  };
  return <div style={style}>{text}</div>;
}

const thStyle = {
  textAlign: "left",
  padding: "8px 6px",
  fontSize: 13,
  color: "#234",
};

const tdStyle = {
  padding: "8px 6px",
  fontSize: 13,
  color: "#222",
  verticalAlign: "top",
};
