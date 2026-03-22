import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, FlaskConical } from 'lucide-react';
import { predictCrop, explainPrediction } from '../api';

const FIELDS = [
  { name: 'nitrogen', label: 'Nitrogen', unit: 'N · kg/ha', min: 0, max: 200, eg: 90 },
  { name: 'phosphorus', label: 'Phosphorus', unit: 'P · kg/ha', min: 0, max: 200, eg: 42 },
  { name: 'potassium', label: 'Potassium', unit: 'K · kg/ha', min: 0, max: 200, eg: 43 },
  { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 50, eg: 20.8 },
  { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, eg: 82 },
  { name: 'ph', label: 'Soil pH', unit: '0–14', min: 0, max: 14, eg: 6.5 },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 500, eg: 202 },
];

const EMOJI = {
  rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🌿', jute: '🌿', coconut: '🥥',
  mango: '🥭', banana: '🍌', apple: '🍎', grapes: '🍇', orange: '🍊', papaya: '🫧',
  watermelon: '🍉', muskmelon: '🍈', coffee: '☕', lentil: '🌱', chickpea: '🟡',
  kidneybeans: '🫘', pigeonpeas: '🌱', mothbeans: '🌱', mungbean: '🌱', blackgram: '🌱'
};

const INITIAL = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };

export default function CropRecommendation() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const fillSample = () => setForm({
    nitrogen: '90', phosphorus: '42', potassium: '43',
    temperature: '20.8', humidity: '82', ph: '6.5', rainfall: '202'
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null); setExp(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v)]));
      const { data } = await predictCrop(payload);
      setResult(data);
      const { data: explanation } = await explainPrediction('crop', payload);
      setExp(explanation);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally { setLoading(false); }
  };

  const maxShap = exp ? Math.max(...exp.contributions.map(c => Math.abs(c.shap_value))) : 1;

  return (
    <div>
      <div className="page-header">
        <h1>Crop Recommendation</h1>
        <p className="subtitle">Enter your soil and climate data — AI picks the best crop with explainability.</p>
      </div>

      <div className="two-col">
        {/* Form */}
        <motion.div className="card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          <div className="section-label">Soil & Climate Inputs</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {FIELDS.map(f => (
                <div className="form-group" key={f.name}>
                  <label>{f.label} <span className="unit">{f.unit}</span></label>
                  <input type="number" name={f.name} value={form[f.name]}
                    onChange={handleChange} placeholder={String(f.eg)}
                    required min={f.min} max={f.max} step="any" />
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Analysing...</> : <><Sprout size={15} />Get Recommendation</>}
            </button>

            <button type="button" onClick={fillSample}
              style={{
                marginTop: 8, width: '100%', padding: '0.5rem', fontSize: '0.8rem',
                border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer'
              }}>
              <FlaskConical size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              Fill sample values (rice conditions)
            </button>

            {error && <p className="error">{error}</p>}
          </form>
        </motion.div>

        {/* Results */}
        <div>
          <AnimatePresence>
            {result && (
              <motion.div className="card" key="result"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
                <div className="result-hero">
                  <motion.span className="crop-emoji"
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    {EMOJI[result.recommended_crop?.toLowerCase()] || '🌱'}
                  </motion.span>
                  <div className="crop-name">{result.recommended_crop}</div>
                  <div className="crop-conf">Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                  <div className="progress-bar-wrap">
                    <motion.div className="progress-bar-fill"
                      initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} />
                  </div>
                </div>

                <div className="section-label">Top 3 candidates</div>
                {result.top_3.map((c, i) => (
                  <div className="bar-row" key={c.crop}>
                    <span style={{ minWidth: 90, fontSize: 13, color: 'var(--text-secondary)' }}>{c.crop}</span>
                    <div className="bar-track">
                      <motion.div className="bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${c.probability * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                        style={{ background: i === 0 ? 'var(--green-500)' : 'var(--text-muted)' }} />
                    </div>
                    <span style={{ fontSize: 12, minWidth: 38, textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {(c.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {exp && (
              <motion.div className="card" key="shap"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}>
                <div className="section-label">SHAP Explanation</div>
                <div className="summary-box">{exp.summary}</div>
                {exp.contributions.map((c, i) => (
                  <motion.div className="shap-row" key={c.feature}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <div className="shap-label">
                      <span>{c.feature}</span>
                      <span className={c.shap_value >= 0 ? 'shap-val-pos' : 'shap-val-neg'}>
                        {c.shap_value >= 0 ? '+' : ''}{c.shap_value.toFixed(3)}
                      </span>
                    </div>
                    <div className="bar-track">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04 }}
                        style={{
                          height: '100%', borderRadius: 'var(--radius-full)',
                          background: c.shap_value >= 0 ? 'var(--green-500)' : 'var(--red-500)'
                        }} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}