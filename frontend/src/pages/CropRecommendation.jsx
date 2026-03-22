import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, FlaskConical } from 'lucide-react';
import { predictCrop, explainPrediction } from '../api';

const FIELDS = [
  { name: 'nitrogen', label: 'Nitrogen', unit: 'kg/ha', min: 0, max: 200, eg: 90 },
  { name: 'phosphorus', label: 'Phosphorus', unit: 'kg/ha', min: 0, max: 200, eg: 42 },
  { name: 'potassium', label: 'Potassium', unit: 'kg/ha', min: 0, max: 200, eg: 43 },
  { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 50, eg: 20.8 },
  { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, eg: 82 },
  { name: 'ph', label: 'Soil pH', unit: '0–14', min: 0, max: 14, eg: 6.5 },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 500, eg: 202 },
];
const EMOJI = {
  rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🌿', jute: '🌿', coconut: '🥥', mango: '🥭',
  banana: '🍌', apple: '🍎', grapes: '🍇', orange: '🍊', watermelon: '🍉', muskmelon: '🍈',
  coffee: '☕', lentil: '🌱', chickpea: '🟡', kidneybeans: '🫘', pigeonpeas: '🌱', mothbeans: '🌱', mungbean: '🌱', blackgram: '🌱'
};
const INIT = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };

export default function CropRecommendation() {
  const [form, setForm] = useState(INIT);
  const [result, setResult] = useState(null);
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const fillSample = () => setForm({ nitrogen: '90', phosphorus: '42', potassium: '43', temperature: '20.8', humidity: '82', ph: '6.5', rainfall: '202' });

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null); setExp(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v)]));
      const { data } = await predictCrop(payload);
      setResult(data);
      const { data: explanation } = await explainPrediction('crop', payload);
      setExp(explanation);
    } catch (err) { setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?'); }
    finally { setLoading(false); }
  };

  const maxShap = exp ? Math.max(...exp.contributions.map(c => Math.abs(c.shap_value))) : 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-4xl mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Crop Recommendation</h1>
        <p className="text-[15px] font-light" style={{ color: 'var(--text-2)' }}>Enter soil and climate data — AI picks the best crop with SHAP explainability.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Form */}
        <motion.div className="rounded-[22px] p-7 border mb-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-5 font-display" style={{ color: 'var(--text-3)' }}>Soil & Climate Inputs</p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {FIELDS.map(f => (
                <div key={f.name} className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>
                    {f.label} <span className="text-[11px] font-normal" style={{ color: 'var(--text-3)' }}>{f.unit}</span>
                  </label>
                  <input type="number" name={f.name} value={form[f.name]} onChange={handleChange}
                    placeholder={String(f.eg)} required min={f.min} max={f.max} step="any" />
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-semibold text-sm text-white relative overflow-hidden transition-all duration-200 cursor-pointer mt-2"
              style={{ background: '#15803d', minHeight: 44 }}
              onMouseOver={e => !loading && (e.target.style.background = '#14532d')}
              onMouseOut={e => !loading && (e.target.style.background = '#15803d')}>
              {loading ? <><span className="spinner" />Analysing...</> : <><Sprout size={15} />Get Recommendation</>}
            </button>

            <button type="button" onClick={fillSample}
              className="w-full mt-2 py-2 text-[13px] rounded-[10px] border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              style={{ borderStyle: 'dashed', borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-3)' }}>
              <FlaskConical size={12} />Fill sample values (rice conditions)
            </button>
            {error && <p className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">{error}</p>}
          </form>
        </motion.div>

        {/* Results */}
        <div>
          <AnimatePresence>
            {result && (
              <motion.div key="result" className="rounded-[22px] p-7 border mb-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <div className="text-center pb-5 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <motion.span className="text-6xl block mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    {EMOJI[result.recommended_crop?.toLowerCase()] || '🌱'}
                  </motion.span>
                  <div className="font-display font-extrabold text-3xl capitalize mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{result.recommended_crop}</div>
                  <div className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <motion.div className="h-full rounded-full progress-fill" initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }} transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} />
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Top 3 candidates</p>
                {result.top_3.map((c, i) => (
                  <div key={c.crop} className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-[13px] w-[90px]" style={{ color: 'var(--text-2)' }}>{c.crop}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${c.probability * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }} style={{ background: i === 0 ? '#22c55e' : '#94a3b8' }} />
                    </div>
                    <span className="text-[12px] w-10 text-right" style={{ color: 'var(--text-2)' }}>{(c.probability * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </motion.div>
            )}

            {exp && (
              <motion.div key="shap" className="rounded-[22px] p-7 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>SHAP Explanation</p>
                <div className="p-3 rounded-[10px] border-l-4 border-green-500 text-sm italic mb-4" style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>{exp.summary}</div>
                {exp.contributions.map((c, i) => (
                  <motion.div key={c.feature} className="mb-3" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="flex justify-between text-[12px] mb-1" style={{ color: 'var(--text-2)' }}>
                      <span>{c.feature}</span>
                      <span className={c.shap_value >= 0 ? 'font-semibold text-green-600 shap-pos' : 'font-semibold text-red-500'}>
                        {c.shap_value >= 0 ? '+' : ''}{c.shap_value.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04 }} style={{ background: c.shap_value >= 0 ? '#22c55e' : '#ef4444' }} />
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