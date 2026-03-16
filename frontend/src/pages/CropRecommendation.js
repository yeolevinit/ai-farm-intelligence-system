import React, { useState } from 'react';
import { predictCrop, explainPrediction } from '../api';
import Plot from 'react-plotly.js';

const INITIAL = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };

export default function CropRecommendation() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setExplanation(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v)]));
      const { data } = await predictCrop(payload);
      setResult(data);

      // Fetch SHAP explanation
      const expPayload = {
        nitrogen: payload.nitrogen, phosphorus: payload.phosphorus,
        potassium: payload.potassium, temperature: payload.temperature,
        humidity: payload.humidity, ph: payload.ph, rainfall: payload.rainfall
      };
      const { data: exp } = await explainPrediction('crop', expPayload);
      setExplanation(exp);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', min: 0, max: 200 },
    { name: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', min: 0, max: 200 },
    { name: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', min: 0, max: 200 },
    { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 50 },
    { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100 },
    { name: 'ph', label: 'Soil pH', unit: '', min: 0, max: 14 },
    { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 500 },
  ];

  return (
    <div className="page">
      <h1>Crop Recommendation</h1>
      <p className="subtitle">Enter your soil and climate conditions to get AI-powered crop advice.</p>

      <div className="two-col">
        <form onSubmit={handleSubmit} className="card">
          <div className="form-grid">
            {fields.map(f => (
              <div className="form-group" key={f.name}>
                <label>{f.label} {f.unit && <span className="unit">{f.unit}</span>}</label>
                <input
                  type="number" name={f.name} value={form[f.name]}
                  onChange={handleChange} placeholder={`e.g. ${f.min + (f.max - f.min) / 2}`}
                  required min={f.min} max={f.max} step="any"
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Analysing...' : '🌱 Get Recommendation'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        <div>
          {result && (
            <div className="card result-card">
              <div className="crop-badge">{result.recommended_crop.toUpperCase()}</div>
              <p className="confidence">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
              <h3>Top 3 Candidates</h3>
              {result.top_3.map(c => (
                <div className="bar-row" key={c.crop}>
                  <span>{c.crop}</span>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${c.probability * 100}%` }} />
                  </div>
                  <span>{(c.probability * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}

          {explanation && (
            <div className="card">
              <h3>Why this recommendation?</h3>
              <p className="summary">{explanation.summary}</p>
              <Plot
                data={[{
                  type: 'bar', orientation: 'h',
                  x: explanation.contributions.map(c => c.shap_value),
                  y: explanation.contributions.map(c => c.feature),
                  marker: { color: explanation.contributions.map(c => c.shap_value > 0 ? '#22c55e' : '#ef4444') }
                }]}
                layout={{
                  title: 'Feature Impact (SHAP values)',
                  margin: { l: 100, r: 20, t: 40, b: 40 },
                  height: 280,
                  xaxis: { title: 'Impact on prediction' },
                  paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                  font: { size: 12 }
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
