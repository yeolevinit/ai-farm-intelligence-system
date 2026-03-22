import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, TrendingUp, Leaf, CloudSun, Zap, Activity, BrainCircuit, Users, BarChart3 } from 'lucide-react';
import api from '../api';

const FEATURES = [
  {
    path: '/crop', Icon: Leaf, color: '#16a34a', bg: '#dcfce7', darkBg: 'rgba(74,222,128,0.1)',
    title: 'Crop Recommendation', tag: '99.55% accuracy',
    desc: 'Enter soil NPK, temperature, humidity and rainfall to get the best crop recommendation powered by Random Forest.'
  },
  {
    path: '/yield', Icon: TrendingUp, color: '#2563eb', bg: '#dbeafe', darkBg: 'rgba(96,165,250,0.1)',
    title: 'Yield Prediction', tag: 'R² 0.96',
    desc: 'Predict expected harvest in hg/ha from climate inputs with multi-year projection chart and SHAP analysis.'
  },
  {
    path: '/disease', Icon: Cpu, color: '#d97706', bg: '#fef3c7', darkBg: 'rgba(251,191,36,0.1)',
    title: 'Disease Detection', tag: 'ResNet18 CNN',
    desc: 'Upload a leaf photo for instant AI diagnosis across 38 plant diseases from the PlantVillage dataset.'
  },
  {
    path: '/weather', Icon: CloudSun, color: '#7c3aed', bg: '#ede9fe', darkBg: 'rgba(167,139,250,0.1)',
    title: 'Weather Advisory', tag: 'Live data',
    desc: 'Real-time weather for any city with AI-generated farming advisories for irrigation and spraying.'
  },
  {
    path: '/explain', Icon: BrainCircuit, color: '#0891b2', bg: '#e0f2fe', darkBg: 'rgba(34,211,238,0.1)',
    title: 'Explainable AI', tag: 'SHAP powered',
    desc: 'Understand exactly why AI made each prediction with animated SHAP waterfall charts and base values.'
  },
];

const IMPACT = [
  { icon: '🌍', stat: '500M+', label: 'Smallholder farmers globally who need decision support' },
  { icon: '📉', stat: '30%', label: 'Average crop loss due to poor decisions & late disease detection' },
  { icon: '🤖', stat: '5 AI', label: 'Models working together in one integrated platform' },
  { icon: '⚡', stat: '<1s', label: 'Prediction time per query end-to-end' },
];

const STACK = [
  { label: 'Frontend', value: 'React + Framer Motion' },
  { label: 'Backend', value: 'FastAPI · Python' },
  { label: 'Crop model', value: 'Random Forest 99.55%' },
  { label: 'Yield model', value: 'Gradient Boost R²0.96' },
  { label: 'Disease CNN', value: 'ResNet18 · PyTorch' },
  { label: 'XAI', value: 'SHAP TreeExplainer' },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [apiOk, setApiOk] = useState(null);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(r => r.ok ? setApiOk(true) : setApiOk(false))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <motion.div className="text-center py-12 pb-8"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display font-extrabold text-5xl mb-3 leading-[1.05]"
          style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
          AI-Powered<br />
          <span className="text-green-600 dark:text-green-400">Farm Intelligence</span>
        </h1>
        <p className="text-base font-light max-w-lg mx-auto mb-6"
          style={{ color: 'var(--text-2)' }}>
          End-to-end decision support for modern agriculture — machine learning, deep learning,
          and explainable AI in one platform built to help farmers make better decisions.
        </p>

        <div className="flex gap-2 justify-center flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${apiOk === true ? 'bg-green-500 animate-pulse-dot' : apiOk === false ? 'bg-red-500' : 'bg-green-500 animate-pulse-dot'}`} />
            {apiOk === true ? 'Backend live' : apiOk === false ? 'Backend offline' : 'Connecting...'}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <Zap size={11} />99.55% crop accuracy
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Activity size={11} />R² 0.96 yield model
          </span>
        </div>
      </motion.div>

      {/* ── Why we built this ── */}
      <motion.div className="rounded-[22px] p-7 mb-4 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-4 font-display"
          style={{ color: 'var(--text-3)' }}>Why we built this</p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {IMPACT.map(s => (
            <div key={s.stat} className="text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display font-extrabold text-2xl mb-1" style={{ color: 'var(--text-1)' }}>{s.stat}</div>
              <div className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-sm mt-5 leading-relaxed font-light" style={{ color: 'var(--text-2)' }}>
          Farmers across India and the world lose billions every year to wrong crop selection, undetected diseases,
          and poor weather-based decisions. This system combines <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>5 AI models</strong> — crop recommendation,
          yield prediction, disease detection, weather advisory, and explainable AI — into one accessible platform.
          Built as a final-year engineering project demonstrating end-to-end AI system design.
        </p>
      </motion.div>

      {/* ── Feature cards ── */}
      <motion.div className="grid grid-cols-2 gap-4 mb-4" variants={stagger} initial="hidden" animate="show"
        style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
        {FEATURES.map(f => (
          <motion.div key={f.path} variants={item}
            className="rounded-[22px] p-6 cursor-pointer flex flex-col gap-2 relative overflow-hidden border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
            onClick={() => navigate(f.path)}
            whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)', borderColor: '#16a34a' }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}>
            {/* Accent circle */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: f.color, opacity: 0.07, transform: 'translate(25px,-25px)' }} />
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 flex-shrink-0"
              style={{ background: isDark ? f.darkBg : f.bg }}>
              <f.Icon size={22} color={f.color} strokeWidth={1.8} />
            </div>
            {/* Tag */}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit tracking-wide"
              style={{ background: isDark ? f.darkBg : f.bg, color: f.color }}>
              {f.tag}
            </span>
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{f.title}</h3>
            <p className="text-[13px] font-light leading-relaxed flex-1" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
            <div className="flex items-center gap-1 text-[13px] font-semibold mt-1" style={{ color: f.color }}>
              Explore <ArrowRight size={13} strokeWidth={2.5} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tech stack ── */}
      <motion.div className="rounded-[22px] p-6 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>
          Tech stack
        </p>
        <div className="grid grid-cols-3 gap-3">
          {STACK.map(s => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{s.label}</span>
              <span className="text-[14px] font-medium" style={{ color: 'var(--text-1)' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}