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

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/crop', label: 'Crop' },
  { to: '/yield', label: 'Yield' },
  { to: '/disease', label: 'Disease' },
  { to: '/weather', label: 'Weather' },
  { to: '/explain', label: 'Explain AI' },
];

export default function App() {
  const [dark, setDark] = useState(() => {
    const s = localStorage.getItem('theme');
    return s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <Router>
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-16 border-b"
          style={{
            background: 'var(--bg-nav)', borderColor: 'var(--border)',
            backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            transition: 'background 0.2s ease'
          }}>

          <NavLink to="/" end
            className="flex items-center gap-2 font-display font-extrabold text-lg no-underline tracking-tight whitespace-nowrap"
            style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            <Sprout size={18} strokeWidth={2.5} />
            FarmAI
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
          </NavLink>

          <div className="flex items-center gap-0.5">
            {NAV.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) =>
                  `nav-link no-underline px-3 py-1.5 rounded-[10px] text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive ? 'active' : ''
                  }`
                }
                style={({ isActive }) => ({ color: isActive ? undefined : 'var(--text-2)' })}>
                {l.label}
              </NavLink>
            ))}
            <button onClick={() => setDark(d => !d)}
              className="ml-2 w-[38px] h-[38px] flex items-center justify-center rounded-[10px] border transition-all duration-200 cursor-pointer"
              style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-2)' }}
              title={dark ? 'Light mode' : 'Dark mode'}>
              {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
            </button>
          </div>
        </nav>

        {/* ── Content ── */}
        <main className="flex-1 w-full max-w-[1240px] mx-auto px-8 py-10">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PW><Dashboard /></PW>} />
              <Route path="/crop" element={<PW><CropRecommendation /></PW>} />
              <Route path="/yield" element={<PW><YieldPrediction /></PW>} />
              <Route path="/disease" element={<PW><DiseaseDetection /></PW>} />
              <Route path="/weather" element={<PW><WeatherAdvisory /></PW>} />
              <Route path="/explain" element={<PW><Explainability /></PW>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

function PW({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}