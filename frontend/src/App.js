import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import CropRecommendation from './pages/CropRecommendation';
import YieldPrediction from './pages/YieldPrediction';
import DiseaseDetection from './pages/DiseaseDetection';
import WeatherAdvisory from './pages/WeatherAdvisory';
import Dashboard from './pages/Dashboard';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">🌾 AI Farm Intelligence</div>
          <div className="nav-links">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/crop">Crop Advisor</NavLink>
            <NavLink to="/yield">Yield Predictor</NavLink>
            <NavLink to="/disease">Disease Detector</NavLink>
            <NavLink to="/weather">Weather</NavLink>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crop" element={<CropRecommendation />} />
            <Route path="/yield" element={<YieldPrediction />} />
            <Route path="/disease" element={<DiseaseDetection />} />
            <Route path="/weather" element={<WeatherAdvisory />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
