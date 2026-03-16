import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    path: '/crop',
    icon: '🌱',
    title: 'Crop Recommendation',
    description: 'Enter soil nutrients, temperature, humidity and rainfall to get the best crop suggestion powered by Random Forest AI.',
    color: '#22c55e',
    tag: 'Random Forest'
  },
  {
    path: '/yield',
    icon: '📊',
    title: 'Yield Prediction',
    description: 'Predict expected harvest in hg/ha using historical climate data and inputs. Includes multi-year projection chart.',
    color: '#3b82f6',
    tag: 'RF Regressor'
  },
  {
    path: '/disease',
    icon: '🍃',
    title: 'Disease Detection',
    description: 'Upload a leaf photograph and get instant disease diagnosis with confidence score using a trained CNN vision model.',
    color: '#f59e0b',
    tag: 'CNN (ResNet18)'
  },
  {
    path: '/weather',
    icon: '🌤️',
    title: 'Weather Advisory',
    description: 'Live weather data for any city combined with AI-generated farming advisories for irrigation, spraying and more.',
    color: '#8b5cf6',
    tag: 'OpenWeatherMap'
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="dashboard-hero">
        <h1>AI Farm Intelligence System</h1>
        <p>An end-to-end AI decision support platform for modern agriculture. Powered by machine learning, deep learning, and explainable AI.</p>
      </div>

      <div className="feature-grid">
        {features.map(f => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="feature-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <div className="feature-tag" style={{ background: f.color + '22', color: f.color }}>{f.tag}</div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <span className="feature-cta" style={{ color: f.color }}>Try it →</span>
          </div>
        ))}
      </div>

      <div className="card stack-info">
        <h3>Tech Stack</h3>
        <div className="stack-grid">
          {[
            { label: 'Frontend', value: 'React + Plotly.js' },
            { label: 'Backend', value: 'FastAPI (Python)' },
            { label: 'ML Models', value: 'scikit-learn + PyTorch' },
            { label: 'XAI', value: 'SHAP' },
            { label: 'Weather', value: 'OpenWeatherMap API' },
            { label: 'Deployment', value: 'Vercel + Render' },
          ].map(s => (
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
