import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sprout } from 'lucide-react';
import CropRecommendation from './pages/CropRecommendation';
import YieldPrediction from './pages/YieldPrediction';
import DiseaseDetection from './pages/DiseaseDetection';
import WeatherAdvisory from './pages/WeatherAdvisory';
import Dashboard from './pages/Dashboard';
import Explainability from './pages/Explainability';
import './styles/App.css';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/crop', label: 'Crop' },
  { to: '/yield', label: 'Yield' },
  { to: '/disease', label: 'Disease' },
  { to: '/weather', label: 'Weather' },
  { to: '/explain', label: 'Explain AI' },
];

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <NavLink to="/" className="nav-brand" end>
            <Sprout size={18} strokeWidth={2.5} />
            FarmAI
            <span className="nav-brand-dot" />
          </NavLink>

          <div className="nav-links">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
            ))}
            <button
              className="nav-theme-btn"
              onClick={() => setDark(d => !d)}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
            </button>
          </div>
        </nav>

        <main className="main-content">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrap><Dashboard /></PageWrap>} />
              <Route path="/crop" element={<PageWrap><CropRecommendation /></PageWrap>} />
              <Route path="/yield" element={<PageWrap><YieldPrediction /></PageWrap>} />
              <Route path="/disease" element={<PageWrap><DiseaseDetection /></PageWrap>} />
              <Route path="/weather" element={<PageWrap><WeatherAdvisory /></PageWrap>} />
              <Route path="/explain" element={<PageWrap><Explainability /></PageWrap>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

function PageWrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}