import React, { createContext, useState, useContext } from 'react';

const PredictionContext = createContext();

const INITIAL_PREDICTIONS = [
  {
    id: 1001,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    district: 'Bengaluru City',
    crimeHead: 'HEINOUS CRIME',
    crimeType: 'Assault',
    riskLevel: 'High',
    confidence: 88,
    year: 2026,
    month: 5
  },
  {
    id: 1002,
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    district: 'Bagalkot',
    crimeHead: 'BURGLARY - DAY',
    crimeType: 'Theft',
    riskLevel: 'High',
    confidence: 82,
    year: 2026,
    month: 5
  },
  {
    id: 1003,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    district: 'Belagavi',
    crimeHead: 'CYBER CRIME',
    crimeType: 'Cyber Crime',
    riskLevel: 'Medium',
    confidence: 68,
    year: 2026,
    month: 5
  },
  {
    id: 1004,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    district: 'Hubballi Dharwad',
    crimeHead: 'MISSING PERSON',
    crimeType: 'Missing Person',
    riskLevel: 'Low',
    confidence: 45,
    year: 2026,
    month: 5
  },
  {
    id: 1005,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    district: 'Bengaluru City',
    crimeHead: 'CHEATING/FRAUD',
    crimeType: 'Fraud',
    riskLevel: 'Medium',
    confidence: 72,
    year: 2026,
    month: 5
  },
  {
    id: 1006,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    district: 'Bagalkot',
    crimeHead: 'POCSO',
    crimeType: 'Assault',
    riskLevel: 'High',
    confidence: 91,
    year: 2026,
    month: 6
  },
  {
    id: 1007,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    district: 'Mysuru City',
    crimeHead: 'ONLINE FRAUD',
    crimeType: 'Cyber Crime',
    riskLevel: 'High',
    confidence: 84,
    year: 2026,
    month: 6
  },
  {
    id: 1008,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    district: 'Bengaluru City',
    crimeHead: 'THEFT-OTHER',
    crimeType: 'Theft',
    riskLevel: 'High',
    confidence: 85,
    year: 2026,
    month: 6
  }
];

export const PredictionProvider = ({ children }) => {
  const [predictions, setPredictions] = useState(() => {
    try {
      const stored = localStorage.getItem('ksp_predictions_history');
      if (stored === null) {
        localStorage.setItem('ksp_predictions_history', JSON.stringify(INITIAL_PREDICTIONS));
        return INITIAL_PREDICTIONS;
      }
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  });

  const addPrediction = (predictionData) => {
    let normRisk = 'Low';
    if (predictionData.riskLevel) {
      const r = predictionData.riskLevel.toUpperCase();
      if (r === 'HIGH') normRisk = 'High';
      else if (r === 'MEDIUM') normRisk = 'Medium';
    }

    const newPrediction = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...predictionData,
      riskLevel: normRisk
    };

    setPredictions((prev) => {
      const updated = [...prev, newPrediction];
      try {
        localStorage.setItem('ksp_predictions_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    return newPrediction;
  };

  const clearPredictions = () => {
    setPredictions([]);
    try {
      localStorage.setItem('ksp_predictions_history', JSON.stringify([]));
    } catch (e) {}
  };

  return (
    <PredictionContext.Provider value={{ predictions, addPrediction, clearPredictions }}>
      {children}
    </PredictionContext.Provider>
  );
};

export const usePredictions = () => {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePredictions must be used within PredictionProvider');
  }
  return context;
};
