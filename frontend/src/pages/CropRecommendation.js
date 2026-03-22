import React, { useState } from 'react';
import { predictCrop, explainPrediction } from '../api';

const INITIAL = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };

const FIELDS = [
  { name: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', min: 0, max: 200, eg: 90 },
  { name: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', min: 0, max: 200, eg: 42 },
  { name: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', min: 0, max: 200, eg: 43 },
  { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 50, eg: 20 },
  { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, eg: 82 },
  { name: 'ph', label: 'Soil pH', unit: '', min: 0, max: 14, eg: 6.5 },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 500, eg: 203 },
];

const CROP_EMOJI = {
  rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🌿', jute: '🌿',
  coconut: '🥥', mango: '🥭', banana: '🍌', apple: '🍎', grapes: '🍇',
  orange: '🍊', papaya: '🧡', watermelon: '🍉', muskmelon: '🍈',
  default: '🌱'
};

function getCropEmoji(crop) {
  return CROP_EMOJI[crop?.toLowerCase()] || CROP_EMOJI.default;
}

export default function CropRecommendation() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [explanation, setExp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null); setExp(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, parseFloat(v)])
      );
      const { data } = await predictCrop(payload);
      setResult(data);
      // SHAP explanation
      const { data: exp } = await explainPrediction('crop', payload);
      setExp(exp);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const maxShap = explanation
    ? Math.max(...explanation.contributions.map(c => Math.abs(c.shap_value)))
    : 1;

  return (
    <div className="page">
      <h1>Crop Recommendation</h1>
      <p className="subtitle">Enter your soil and climate conditions to get AI-powered crop advice.</p>

      <div className="two-col">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="card">
          <div className="form-grid">
            {FIELDS.map(f => (
              <div className="form-group" key={f.name}>
                <label>{f.label}{f.unit && <span className="unit"> {f.unit}</span>}</label>
                <input
                  type="number" name={f.name} value={form[f.name]}
                  onChange={handleChange} placeholder={`e.g. ${f.eg}`}
                  required min={f.min} max={f.max} step="any"
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Analysing...' : '🌱 Get Recommendation'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        {/* ── Results ── */}
        <div>
          {result && (
            <div className="card result-card">
              <div className="crop-emoji">{getCropEmoji(result.recommended_crop)}</div>
              <div className="crop-badge">{result.recommended_crop.toUpperCase()}</div>
              <p className="confidence">Confidence: {(result.confidence * 100).toFixed(1)}%</p>

              <div className="conf-bar-wrap">
                <div className="conf-bar-fill" style={{ width: `${result.confidence * 100}%` }} />
              </div>

              <h3 style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>Top 3 candidates</h3>
              {result.top_3.map((c, i) => (
                <div className="bar-row" key={c.crop}>
                  <span style={{ minWidth: 90, fontSize: 13 }}>{c.crop}</span>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{
                      width: `${c.probability * 100}%`,
                      background: i === 0 ? '#22c55e' : '#94a3b8'
                    }} />
                  </div>
                  <span style={{ fontSize: 13, minWidth: 40, textAlign: 'right' }}>
                    {(c.probability * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {explanation && (
            <div className="card">
              <h3>Why this crop?</h3>
              <p className="summary">{explanation.summary}</p>
              <div style={{ marginTop: '0.75rem' }}>
                {explanation.contributions.map(c => (
                  <div key={c.feature} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                      <span>{c.feature}</span>
                      <span style={{ color: c.shap_value >= 0 ? '#16a34a' : '#dc2626' }}>
                        {c.shap_value >= 0 ? '+' : ''}{c.shap_value.toFixed(3)}
                      </span>
                    </div>
                    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(Math.abs(c.shap_value) / maxShap) * 100}%`,
                        height: '100%',
                        background: c.shap_value >= 0 ? '#22c55e' : '#ef4444',
                        borderRadius: 4
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}