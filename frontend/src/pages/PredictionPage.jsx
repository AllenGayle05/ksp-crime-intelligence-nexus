import React from 'react';
import CrimePrediction from '../components/CrimePrediction';
import './PredictionPage.css';

export default function PredictionPage() {
  return (
    <div className="page-container">
      <div className="prediction-page-container">
        <h2 className="pp-title">AI Investigation — Predict Incident</h2>
        <p className="muted pp-subtitle">Enter incident details to generate a prioritized investigation directive.</p>
        <div style={{ marginTop: 18 }}>
          <CrimePrediction showHistory={true} />
        </div>
      </div>
    </div>
  );
}
