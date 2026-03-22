import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, TrendingUp, Leaf, CloudSun, Zap, Activity } from 'lucide-react';
import api from '../api';

const FEATURES = [
  {
    path: '/crop', icon: Leaf, color: '#16a34a', bg: '#dcfce7', darkBg: 'rgba(74,222,128,0.1)',
    title: 'Crop Recommendation', tag: '99.55% accuracy',
    desc: 'Enter soil NPK, temperature, humidity and rainfall to get the best crop recommendation powered by Random Forest.'
  },
  {
    path: '/yield', icon: TrendingUp, color: '#2563eb', bg: '#dbeafe', darkBg: 'rgba(96,165,250,0.1)',
    title: 'Yield Prediction', tag: 'R² 0.96',
    desc: 'Predict expected harvest in hg/ha from climate inputs with multi-year projection chart and SHAP analysis.'
  },
  {
    path: '/disease', icon: Cpu, color: '#d97706', bg: '#fef3c7', darkBg: 'rgba(251,191,36,0.1)',
    title: 'Disease Detection', tag: 'ResNet18 CNN',
    desc: 'Upload a leaf photo for instant AI diagnosis across 38 plant diseases from the PlantVillage dataset.'
  },
  {
    path: '/weather', icon: CloudSun, color: '#7c3aed', bg: '#ede9fe', darkBg: 'rgba(167,139,250,0.1)',
    title: 'Weather Advisory', tag: 'Live data',
    desc: 'Real-time weather for any city with AI-generated farming advisories for irrigation and spraying.'
  },
];

const STACK = [
  { label: 'Frontend', value: 'React + Framer Motion' },
  { label: 'Backend', value: 'FastAPI · Python' },
  { label: 'Crop model', value: 'Random Forest 99.55%' },
  { label: 'Yield model', value: 'Gradient Boost R² 0.96' },
  { label: 'Disease CNN', value: 'ResNet18 · PyTorch' },
  { label: 'XAI', value: 'SHAP TreeExplainer' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [apiOk, setApiOk] = useState(null);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    // /health is at root, not under /api prefix
    fetch('http://localhost:8000/health')
      .then(r => r.ok ? setApiOk(true) : setApiOk(false))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <motion.div className="dash-hero" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1>
          AI-Powered<br />
          <span>Farm Intelligence</span>
        </h1>
        <p>End-to-end decision support for modern agriculture — machine learning, deep learning, and explainable AI in one platform.</p>

        <div className="dash-pills">
          <span className="badge badge-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`status-dot ${apiOk === true ? 'online' : apiOk === false ? 'offline' : 'online'}`} />
            {apiOk === true ? 'Backend live' : apiOk === false ? 'Backend offline' : 'Connecting...'}
          </span>
          <span className="badge badge-green"><Zap size={11} />99.55% crop accuracy</span>
          <span className="badge badge-blue"><Activity size={11} />R² 0.96 yield model</span>
        </div>
      </motion.div>

      {/* Feature cards */}
      <motion.div className="feature-grid" variants={container} initial="hidden" animate="show">
        {FEATURES.map(f => (
          <motion.div key={f.path} className="feature-card" variants={item}
            onClick={() => navigate(f.path)}
            style={{ '--card-accent': f.color }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.99 }}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 90, height: 90, borderRadius: '50%',
              background: f.color, opacity: 0.07, transform: 'translate(25px,-25px)'
            }} />
            <div className="feature-card-icon" style={{ background: isDark ? f.darkBg : f.bg }}>
              <f.icon size={22} color={f.color} strokeWidth={1.8} />
            </div>
            <span className="feature-card-tag" style={{ background: isDark ? f.darkBg : f.bg, color: f.color }}>
              {f.tag}
            </span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div className="feature-card-cta" style={{ color: f.color }}>
              Explore <ArrowRight size={13} strokeWidth={2.5} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Stack */}
      <motion.div className="stack-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
        <div className="section-label">Tech stack</div>
        <div className="stack-grid">
          {STACK.map(s => (
            <div key={s.label} className="stack-item">
              <span className="stack-label">{s.label}</span>
              <span className="stack-value">{s.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}