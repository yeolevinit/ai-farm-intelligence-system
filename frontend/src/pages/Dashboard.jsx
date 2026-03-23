import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Cpu, TrendingUp, Leaf, CloudSun, Zap,
  Activity, BrainCircuit, AlertTriangle, CheckCircle2,
  UserCheck, GraduationCap, Sprout, ChevronRight
} from 'lucide-react';
import {
  Chart, RadarController, RadialLinearScale,
  PointElement, LineElement, Filler, Tooltip
} from 'chart.js';
import api from '../api';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

/* ── Data ─────────────────────────────────────────────────── */
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
    desc: 'Understand why AI made each prediction with animated SHAP waterfall charts and base values.'
  },
];

const IMPACT = [
  { icon: '🌍', stat: '500M+', label: 'Smallholder farmers globally who need decision support' },
  { icon: '📉', stat: '30%', label: 'Average crop loss due to poor decisions & late disease detection' },
  { icon: '🤖', stat: '5 AI', label: 'Models working together in one integrated platform' },
  { icon: '⚡', stat: '<1s', label: 'Prediction time per query end-to-end' },
];

const PROBLEMS = [
  {
    icon: '🌾', title: 'Wrong crop selection',
    problem: 'Farmers choose crops based on habit or neighbour advice — not actual soil data. This leads to poor yield and wasted money.',
    solution: 'Our AI analyses your exact N, P, K, pH, humidity and rainfall to recommend the scientifically best crop for your land.'
  },
  {
    icon: '🦠', title: 'Late disease detection',
    problem: 'By the time a disease is visible, it has already spread across 40–60% of the crop. Manual inspection is slow and inaccurate.',
    solution: 'Upload one leaf photo. Our ResNet18 CNN identifies the disease in under a second with 95%+ accuracy across 38 diseases.'
  },
  {
    icon: '☁️', title: 'Ignoring weather patterns',
    problem: 'Spraying pesticides before rain or irrigating before a storm wastes resources and damages crops.',
    solution: 'Live weather advisory gives you farming-specific guidance — when to irrigate, when to spray, when to harvest.'
  },
  {
    icon: '📊', title: 'Unpredictable harvest yield',
    problem: 'Farmers cannot plan finances or sell forward contracts without knowing expected yield months in advance.',
    solution: 'Input your crop, rainfall and temperature — get an accurate yield prediction in hg/ha with multi-year trend charts.'
  },
];

const HOW_TO_USE = [
  {
    step: '01', icon: '🌱', title: 'Check your soil',
    desc: 'Go to the Crop page. Enter your soil nitrogen, phosphorus, potassium, pH, humidity and rainfall. The AI tells you the best crop to grow — with a confidence score and explanation of why.'
  },
  {
    step: '02', icon: '🍃', title: 'Detect diseases early',
    desc: 'Go to the Disease page. Take a photo of any leaf showing unusual spots, yellowing or discolouration. Upload it — get an instant diagnosis with the disease name and confidence level.'
  },
  {
    step: '03', icon: '🌤️', title: 'Check weather before farming',
    desc: 'Go to the Weather page. Enter your city name. Get live temperature, humidity and wind — plus AI-generated advisories like "delay irrigation" or "avoid spraying today".'
  },
  {
    step: '04', icon: '📈', title: 'Plan your harvest',
    desc: 'Go to the Yield page. Select your crop, enter rainfall and temperature data. Get your expected yield in hg/ha with a projection chart showing trends across years.'
  },
  {
    step: '05', icon: '🧠', title: 'Understand AI decisions',
    desc: 'Go to Explain AI. See exactly which factors (soil nutrients, weather) drove each prediction — with visual SHAP bars showing positive and negative impacts.'
  },
];

const WHO_FOR = [
  {
    Icon: Sprout, color: '#16a34a', bg: '#dcfce7', darkBg: 'rgba(74,222,128,0.1)',
    title: 'Farmers',
    desc: 'Use the crop advisor and disease detector to make smarter daily decisions without needing any technical knowledge. Just enter numbers or upload a photo.'
  },
  {
    Icon: GraduationCap, color: '#7c3aed', bg: '#ede9fe', darkBg: 'rgba(167,139,250,0.1)',
    title: 'Agriculture students',
    desc: 'Learn how AI applies to real farming problems. The Explainability page shows you exactly how machine learning models think — perfect for assignments and projects.'
  },
  {
    Icon: UserCheck, color: '#0891b2', bg: '#e0f2fe', darkBg: 'rgba(34,211,238,0.1)',
    title: 'Agri researchers',
    desc: 'Explore SHAP feature analysis, model accuracy (99.55% crop, R²0.96 yield) and multi-year yield projections for research and comparative studies.'
  },
];

const IDEAL = {
  nitrogen: { ideal: 80, max: 200, label: 'Nitrogen' },
  phosphorus: { ideal: 60, max: 200, label: 'Phosphorus' },
  potassium: { ideal: 60, max: 200, label: 'Potassium' },
  ph: { ideal: 65, max: 14, label: 'Soil pH' },
  humidity: { ideal: 75, max: 100, label: 'Humidity' },
  rainfall: { ideal: 60, max: 500, label: 'Rainfall' },
};

const PRESETS = [
  { label: 'Rice', values: { nitrogen: 90, phosphorus: 42, potassium: 43, ph: 6.5, humidity: 82, rainfall: 202 } },
  { label: 'Wheat', values: { nitrogen: 20, phosphorus: 50, potassium: 30, ph: 7.0, humidity: 65, rainfall: 90 } },
  { label: 'Coffee', values: { nitrogen: 25, phosphorus: 30, potassium: 30, ph: 6.0, humidity: 80, rainfall: 200 } },
  { label: 'Cotton', values: { nitrogen: 60, phosphorus: 35, potassium: 25, ph: 7.5, humidity: 60, rainfall: 110 } },
  { label: 'Maize', values: { nitrogen: 40, phosphorus: 40, potassium: 40, ph: 6.2, humidity: 70, rainfall: 150 } },
];

const STACK = [
  { label: 'Frontend', value: 'React + Framer Motion' },
  { label: 'Backend', value: 'FastAPI · Python' },
  { label: 'Crop model', value: 'Random Forest 99.55%' },
  { label: 'Yield model', value: 'Gradient Boost R²0.96' },
  { label: 'Disease CNN', value: 'ResNet18 · PyTorch' },
  { label: 'XAI', value: 'SHAP TreeExplainer' },
];

function getSoilHealth(vals) {
  const scores = Object.keys(IDEAL).map(k => {
    const pct = (vals[k] / IDEAL[k].max) * 100;
    const diff = Math.abs(pct - IDEAL[k].ideal);
    return Math.max(0, 100 - diff * 1.5);
  });
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 75) return { label: 'Excellent', color: '#16a34a' };
  if (avg >= 55) return { label: 'Good', color: '#65a30d' };
  if (avg >= 35) return { label: 'Fair', color: '#d97706' };
  return { label: 'Poor', color: '#dc2626' };
}

/* ── Animation helpers ────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const stagger2 = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

/* ── Scroll-triggered section wrapper ────────────────────── */
function Section({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [apiOk, setApiOk] = useState(null);
  const [soil, setSoil] = useState(PRESETS[0].values);
  const chartRef = useRef(null);
  const chartInst = useRef(null);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    const RENDER_URL = 'https://ai-farm-backend-n8gm.onrender.com';
    const apiBase = process.env.REACT_APP_API_URL
      || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : RENDER_URL);
    fetch(`${apiBase}/health`)
      .then(r => r.ok ? setApiOk(true) : setApiOk(false))
      .catch(() => setApiOk(false));
  }, []);

  /* radar chart */
  useEffect(() => {
    if (!chartRef.current) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const labels = Object.keys(IDEAL).map(k => IDEAL[k].label);
    const userVals = Object.keys(IDEAL).map(k => Math.round((soil[k] / IDEAL[k].max) * 100));
    const idealVals = Object.keys(IDEAL).map(k => IDEAL[k].ideal);
    const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const lbl = dark ? '#9ab89a' : '#64748b';
    if (chartInst.current) chartInst.current.destroy();
    chartInst.current = new Chart(chartRef.current, {
      type: 'radar',
      data: {
        labels, datasets: [
          { label: 'Your soil', data: userVals, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.12)', borderWidth: 2, pointBackgroundColor: '#16a34a', pointRadius: 4, pointHoverRadius: 6 },
          { label: 'Ideal range', data: idealVals, borderColor: dark ? 'rgba(251,191,36,0.5)' : 'rgba(217,119,6,0.4)', backgroundColor: 'rgba(217,119,6,0.04)', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}%` } } },
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, display: false }, grid: { color: grid }, angleLines: { color: grid }, pointLabels: { color: lbl, font: { size: 12, family: 'DM Sans, sans-serif', weight: '500' } } } }
      }
    });
  }, [soil]);

  useEffect(() => () => { if (chartInst.current) chartInst.current.destroy(); }, []);

  const health = getSoilHealth(soil);

  return (
    <div>
      {/* ── Hero ── */}
      <motion.div className="text-center py-12 pb-8"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display font-extrabold text-5xl mb-3 leading-[1.05]"
          style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
          AI-Powered<br /><span style={{ color: '#16a34a' }}>Farm Intelligence</span>
        </h1>
        <p className="text-base font-light max-w-lg mx-auto mb-6" style={{ color: 'var(--text-2)' }}>
          End-to-end decision support for modern agriculture — machine learning, deep learning,
          and explainable AI in one platform built to help farmers make better decisions.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${apiOk === true ? 'bg-green-500 animate-pulse-dot' : apiOk === false ? 'bg-red-500' : 'bg-green-500 animate-pulse-dot'}`} />
            {apiOk === true ? 'Backend live' : apiOk === false ? 'Backend offline' : 'Connecting...'}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"><Zap size={11} />99.55% crop accuracy</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Activity size={11} />R² 0.96 yield model</span>
        </div>
      </motion.div>

      {/* ── Impact stats ── */}
      <Section delay={0.1}>
        <div className="rounded-[22px] p-7 mb-4 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Why we built this</p>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 mb-5">
            {IMPACT.map((s, i) => (
              <motion.div key={s.stat} className="text-center"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-display font-extrabold text-2xl mb-1" style={{ color: 'var(--text-1)' }}>{s.stat}</div>
                <div className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-2)' }}>
            Farmers across India and the world lose billions every year to wrong crop selection, undetected diseases, and poor
            weather-based decisions. This system combines <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>5 AI models</strong> —
            crop recommendation, yield prediction, disease detection, weather advisory, and explainable AI — into one accessible platform.
            Built as a final-year engineering project demonstrating end-to-end AI system design.
          </p>
        </div>
      </Section>

      {/* ── Problems we solve ── */}
      <Section delay={0}>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} color="#d97706" />
            <p className="text-xs font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-3)' }}>Problems we solve</p>
          </div>
          <p className="text-sm mb-5 font-light" style={{ color: 'var(--text-2)' }}>
            Real challenges Indian and global farmers face every day — and how our AI fixes each one.
          </p>
          <motion.div className="grid grid-cols-2 gap-4" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
            {PROBLEMS.map(p => (
              <motion.div key={p.title} variants={fadeUp}
                className="rounded-[22px] p-6 border relative overflow-hidden"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                {/* top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[22px]" style={{ background: 'linear-gradient(90deg,#16a34a,transparent)' }} />
                <div className="text-2xl mb-3">{p.icon}</div>
                <h3 className="font-display font-bold text-base mb-3" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{p.title}</h3>
                {/* Problem */}
                <div className="flex gap-2 mb-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)' }}>
                  <span className="text-red-500 flex-shrink-0 mt-0.5"><AlertTriangle size={13} /></span>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{p.problem}</p>
                </div>
                {/* Solution */}
                <div className="flex gap-2 p-3 rounded-xl" style={{ background: 'rgba(22,163,74,0.07)' }}>
                  <span className="text-green-600 flex-shrink-0 mt-0.5"><CheckCircle2 size={13} /></span>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{p.solution}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── How to use ── */}
      <Section delay={0}>
        <div className="rounded-[22px] p-7 mb-4 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 font-display" style={{ color: 'var(--text-3)' }}>How to use this platform</p>
          <p className="text-sm mb-6 font-light" style={{ color: 'var(--text-2)' }}>
            No technical knowledge needed. Follow these 5 steps — each takes under 30 seconds.
          </p>
          <div className="flex flex-col gap-3">
            {HOW_TO_USE.map((h, i) => (
              <motion.div key={h.step}
                className="flex gap-4 p-4 rounded-2xl border cursor-pointer group transition-all duration-200"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ x: 4, borderColor: '#16a34a', background: 'rgba(22,163,74,0.04)' }}
                onClick={() => navigate(FEATURES[i]?.path || '/')}>
                {/* Step number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-sm"
                  style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>
                  {h.step}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg leading-none">{h.icon}</span>
                    <span className="font-display font-bold text-[14px]" style={{ color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{h.title}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{h.desc}</p>
                </div>
                {/* Arrow */}
                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ChevronRight size={16} color="#16a34a" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Who is it for ── */}
      <Section delay={0}>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 font-display" style={{ color: 'var(--text-3)' }}>Who is this for</p>
          <p className="text-sm mb-5 font-light" style={{ color: 'var(--text-2)' }}>This platform is useful for anyone connected to agriculture.</p>
          <motion.div className="grid grid-cols-3 gap-4" variants={stagger2} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
            {WHO_FOR.map(w => (
              <motion.div key={w.title} variants={fadeUp}
                className="rounded-[22px] p-6 border flex flex-col gap-3"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: isDark ? w.darkBg : w.bg }}>
                  <w.Icon size={20} color={w.color} strokeWidth={1.8} />
                </div>
                <div className="font-display font-bold text-base" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{w.title}</div>
                <p className="text-[12px] leading-relaxed font-light" style={{ color: 'var(--text-2)' }}>{w.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── Soil Radar ── */}
      <Section delay={0}>
        <div className="rounded-[22px] p-7 mb-4 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
            <p className="text-xs font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-3)' }}>Soil Nutrient Analyser</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: health.color + '22', color: health.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: health.color, display: 'inline-block' }} />
              {health.label} soil profile
            </span>
          </div>
          <p className="text-[12px] mb-5" style={{ color: 'var(--text-3)' }}>
            Drag sliders or pick a crop preset to visualise your soil nutrient profile. Green = your values · Dashed = ideal targets.
          </p>
          <div className="grid grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex gap-1.5 flex-wrap mb-5">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => setSoil(p.values)}
                    className="city-pill px-3 py-1 text-[12px] border rounded-full cursor-pointer transition-all duration-200"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                {Object.keys(IDEAL).map(key => {
                  const { label, max } = IDEAL[key];
                  const pct = Math.round((soil[key] / max) * 100);
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
                        <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
                          {soil[key]}{key === 'ph' ? '' : key === 'humidity' ? '%' : key === 'rainfall' ? ' mm' : ' kg/ha'}
                          <span className="ml-1 text-[11px]" style={{ color: 'var(--text-3)' }}>({pct}%)</span>
                        </span>
                      </div>
                      <input type="range" min={0} max={max} step={key === 'ph' ? 0.1 : 1}
                        value={soil[key]} onChange={e => setSoil(s => ({ ...s, [key]: parseFloat(e.target.value) || 0 }))}
                        style={{ width: '100%', accentColor: '#16a34a' }} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ position: 'relative', maxWidth: 300, margin: '0 auto', width: '100%' }}>
              <canvas ref={chartRef} />
              <div className="flex gap-4 justify-center mt-3" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 16, height: 2, background: '#16a34a', display: 'inline-block', borderRadius: 2 }} />Your soil
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ width: 16, height: 2, background: '#d97706', display: 'inline-block', borderRadius: 2, opacity: 0.6 }} />Ideal
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Feature cards ── */}
      <Section delay={0}>
        <motion.div className="grid grid-cols-2 gap-4 mb-4" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
          {FEATURES.map(f => (
            <motion.div key={f.path} variants={fadeUp}
              className="rounded-[22px] p-6 cursor-pointer flex flex-col gap-2 relative overflow-hidden border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
              onClick={() => navigate(f.path)}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)', borderColor: '#16a34a' }}
              whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: f.color, opacity: 0.07, transform: 'translate(25px,-25px)' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 flex-shrink-0"
                style={{ background: isDark ? f.darkBg : f.bg }}>
                <f.Icon size={22} color={f.color} strokeWidth={1.8} />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit tracking-wide"
                style={{ background: isDark ? f.darkBg : f.bg, color: f.color }}>{f.tag}</span>
              <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p className="text-[13px] font-light leading-relaxed flex-1" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
              <div className="flex items-center gap-1 text-[13px] font-semibold mt-1" style={{ color: f.color }}>
                Explore <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── Tech stack ── */}
      <Section delay={0}>
        <div className="rounded-[22px] p-6 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Tech stack</p>
          <div className="grid grid-cols-3 gap-3">
            {STACK.map(s => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{s.label}</span>
                <span className="text-[14px] font-medium" style={{ color: 'var(--text-1)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}