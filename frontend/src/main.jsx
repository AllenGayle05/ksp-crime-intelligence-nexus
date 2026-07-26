import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './chartSetup'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PredictionProvider } from './context/PredictionContext'
import LandingPage from './pages/LandingPage'
import PredictionPage from './pages/PredictionPage'
import AnalyticsPage from './pages/AnalyticsPage'
import HotspotsPage from './pages/HotspotsPage'
import AIAssistantPage from './pages/AIAssistantPage'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PredictionProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/prediction" element={<PredictionPage />} />
          <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage/></ErrorBoundary>} />
          <Route path="/hotspots" element={<HotspotsPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
        </Routes>
      </BrowserRouter>
    </PredictionProvider>
  </StrictMode>,
)

