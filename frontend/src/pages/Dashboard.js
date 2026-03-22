import React from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    path: '/crop', icon: '🌱', color: '#16a34a', bg: '#dcfce7',
    title: 'Crop Recommendation',
    desc: 'Enter soil NPK, temperature, humidity and rainfall — get the best crop suggestion with 99.5% accuracy.',
    tag: 'Random Forest · 22 crops',
  },
  {
    path: '/yield', icon: '📊', color: '#2563eb', bg: '#dbeafe',
    title: 'Yield Prediction',
    desc: 'Predict harvest in hg/ha using climate data. Includes multi-year projection chart and feature analysis.',
    tag: 'Gradient Boosting · R² 0.96',
  },
  {
    path: '/disease', icon: '🍃', color: '#d97706', bg: '#fef3c7',
    title: 'Disease Detection',
    desc: 'Upload a leaf photo for instant disease diagnosis with confidence score — 38 plant diseases supported.',
    tag: 'ResNet18 CNN · PlantVillage',
  },
  {
    path: '/weather', icon: '🌤️', color: '#7c3aed', bg: '#ede9fe',
    title: 'Weather Advisory',
    desc: 'Live weather for any city with AI-generated farming advisories for irrigation, spraying, and harvesting.',
    tag: 'OpenWeatherMap API',
  },
];

const STACK = [
  { label: 'Frontend', value: 'React + Chart.js' },
  { label: 'Backend', value: 'FastAPI (Python)' },
  { label: 'Crop model', value: 'Random Forest · 99.55%' },
  { label: 'Yield model', value: 'Gradient Boosting · R² 0.96' },
  { label: 'Disease CNN', value: 'ResNet18 · PyTorch' },
  { label: 'XAI', value: 'SHAP TreeExplainer' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="dashboard-hero">
        <h1>AI Farm Intelligence System</h1>
        <p>
          An end-to-end AI decision support platform for modern agriculture —
          combining machine learning, deep learning, and explainable AI.
        </p>
      </div>

      <div className="feature-grid">
        {FEATURES.map(f => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
              {f.icon}
            </div>
            <div className="feature-tag" style={{ background: f.bg, color: f.color }}>
              {f.tag}
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className="feature-cta" style={{ color: f.color }}>Try it →</span>
          </div>
        ))}
      </div>

      <div className="card stack-info">
        <h3 style={{ marginBottom: '1rem' }}>Tech stack</h3>
        <div className="stack-grid">
          {STACK.map(s => (
            <div key={s.label} className="stack-item">
              <span className="stack-label">{s.label}</span>
              <span className="stack-value">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}