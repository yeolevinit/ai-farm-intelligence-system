import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { BarChart2, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js';
import { predictYield, explainPrediction } from '../api';
import api from '../api';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler);

const INIT = { crop: '', year: 2010, rainfall: 800, temperature: 22, pesticide_use: 10 };

// National average yields in hg/ha (approximate India figures)
const NATIONAL_AVG = {
  'Cassava': 20000, 'Maize': 14000, 'Plantains and others': 60000,
  'Potatoes': 23000, 'Rice, paddy': 23000, 'Sorghum': 8000,
  'Soybeans': 10000, 'Sweet potatoes': 21000, 'Wheat': 32000, 'Yams': 35000,
};

function getYieldContext(predicted, crop) {
  const avg = NATIONAL_AVG[crop] || 20000;
  const pct = ((predicted - avg) / avg) * 100;
  if (pct > 20) return { label: 'Above average', color: '#16a34a', icon: '↑', tip: `Your predicted yield is ${Math.abs(pct).toFixed(0)}% above the typical average for ${crop}.` };
  if (pct < -20) return { label: 'Below average', color: '#dc2626', icon: '↓', tip: `Yield is ${Math.abs(pct).toFixed(0)}% below average. Consider improving soil nutrients or irrigation.` };
  return { label: 'Near average', color: '#d97706', icon: '→', tip: `Yield is close to the typical average for ${crop}. Small improvements in pesticide or rainfall management can help.` };
}

const YIELD_TIPS = [
  { icon: '💧', tip: 'Optimise irrigation — water stress is the #1 factor reducing yield below potential.' },
  { icon: '🌿', tip: 'Use balanced NPK fertiliser. Nitrogen deficiency reduces yield by 20–40% in cereals.' },
  { icon: '🛡️', tip: 'Apply pesticides at the right crop growth stage, not just when damage is visible.' },
  { icon: '🌡️', tip: 'Extreme heat (>35°C) during flowering causes permanent yield loss in most crops.' },
];

const infoRef_outer = React.createRef();

export default function YieldPrediction() {
  const [form, setForm] = useState(INIT);
  const [crops, setCrops] = useState([]);
  const [result, setResult] = useState(null);
  const [exp, setExp] = useState(null);
  const [chartData, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInst = useRef(null);
  const tipsRef = useRef(null);
  const inView = useInView(tipsRef, { once: true });

  useEffect(() => {
    api.get('/supported_crops')
      .then(r => { const l = r.data.crops; setCrops(l); setForm(f => ({ ...f, crop: l[0] || '' })); })
      .catch(() => setError('Could not load crop list. Make sure backend is running.'));
  }, []);

  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: chartData.years, datasets: [
          {
            data: chartData.yields, borderColor: '#22c55e',
            backgroundColor: dark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.08)',
            borderWidth: 2,
            pointBackgroundColor: chartData.years.map(y => y === chartData.sel ? '#f59e0b' : '#22c55e'),
            pointRadius: chartData.years.map(y => y === chartData.sel ? 7 : 3),
            tension: 0.4, fill: true
          },
          // National average line
          {
            data: chartData.years.map(() => NATIONAL_AVG[chartData.crop] || 20000),
            borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
            borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, label: 'National avg'
          },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `  ${Math.round(ctx.raw).toLocaleString()} hg/ha` } }
        },
        scales: {
          x: { grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: dark ? '#9ab89a' : '#64748b', font: { size: 11 } } },
          y: { grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: dark ? '#9ab89a' : '#64748b', font: { size: 11 }, callback: v => Math.round(v / 1000) + 'k' } }
        }
      }
    });
  }, [chartData]);

  useEffect(() => () => { if (chartInst.current) chartInst.current.destroy(); }, []);

  const handleChange = e => {
    const v = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: v });
  };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null); setExp(null); setChart(null);
    try {
      const { data } = await predictYield(form); setResult(data);
      const years = [2000, 2002, 2004, 2006, 2008, 2010, 2012, 2013];
      const yields = await Promise.all(years.map(y => predictYield({ ...form, year: y }).then(r => Math.round(r.data.predicted_yield))));
      setChart({ years, yields, crop: data.crop, sel: form.year });
      const { data: explanation } = await explainPrediction('yield', {
        crop: form.crop, year: form.year, rainfall: form.rainfall,
        temperature: form.temperature, pesticide_use: form.pesticide_use,
      });
      setExp(explanation);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally { setLoading(false); }
  };

  const maxShap = exp ? Math.max(...exp.contributions.map(c => Math.abs(c.shap_value))) : 1;
  const yieldCtx = result ? getYieldContext(result.predicted_yield, result.crop) : null;

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={22} color="#2563eb" strokeWidth={2} />
          <h1 className="font-display font-extrabold text-4xl" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Yield Prediction</h1>
        </div>
        <p className="text-[15px] font-light ml-8" style={{ color: 'var(--text-2)' }}>
          Estimate expected crop harvest in hg/ha — plan finances and operations before sowing.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Form */}
        <motion.div className="rounded-[22px] p-7 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-5 font-display" style={{ color: 'var(--text-3)' }}>Prediction inputs</p>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Crop type</label>
              <select name="crop" value={form.crop} onChange={handleChange} required>
                {crops.length === 0
                  ? <option value="">Loading crops...</option>
                  : crops.map(c => <option key={c} value={c}>{c}</option>)
                }
              </select>
            </div>
            {[
              { name: 'year', label: 'Year', unit: '1990–2013', min: 1990, max: 2013, step: 1, hint: 'Historical data range' },
              { name: 'rainfall', label: 'Annual rainfall', unit: 'mm', min: 0, max: 3000, step: 1, hint: 'Total yearly rainfall in mm' },
              { name: 'temperature', label: 'Avg temperature', unit: '°C', min: 0, max: 50, step: 0.1, hint: 'Average annual temperature' },
              { name: 'pesticide_use', label: 'Pesticide use', unit: 'tonnes', min: 0, max: 500, step: 0.1, hint: 'Total pesticide used in tonnes' },
            ].map(f => (
              <div key={f.name} className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>
                    {f.label} <span className="text-[11px] font-normal" style={{ color: 'var(--text-3)' }}>{f.unit}</span>
                  </label>
                  <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{f.hint}</span>
                </div>
                <input type="number" name={f.name} value={form[f.name]} onChange={handleChange}
                  required min={f.min} max={f.max} step={f.step} />
              </div>
            ))}

            <motion.button type="submit" disabled={loading || !form.crop} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-semibold text-sm text-white transition-all duration-200 cursor-pointer mt-2"
              style={{ background: '#15803d', minHeight: 44 }}>
              {loading ? <><span className="spinner" />Predicting...</> : <><BarChart2 size={15} />Predict Yield</>}
            </motion.button>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">
                {error}
              </motion.p>
            )}
          </form>

          {/* What is hg/ha */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Info size={12} color="#16a34a" />
              <p className="text-[11px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-3)' }}>What is hg/ha?</p>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
              <strong style={{ color: 'var(--text-1)' }}>Hectograms per hectare</strong> — the standard international yield unit.
              Divide by 10,000 to get tonnes/ha. Example: 30,000 hg/ha = 3 tonnes/ha (good wheat yield in India).
            </p>
          </div>
        </motion.div>

        {/* Results */}
        <div>
          <AnimatePresence>
            {!result && !loading && (
              <motion.div key="empty" className="rounded-[22px] p-8 border text-center"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-5xl mb-3">📊</div>
                <p className="text-sm font-light" style={{ color: 'var(--text-3)' }}>
                  Select a crop, fill in climate inputs<br />and click <strong style={{ color: 'var(--text-2)' }}>Predict Yield</strong>.
                </p>
              </motion.div>
            )}

            {result && (
              <motion.div key="res" className="rounded-[22px] p-7 border mb-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>

                <div className="text-center mb-5 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-[13px] mb-1" style={{ color: 'var(--text-2)' }}>{result.crop} — predicted yield</div>
                  <motion.div className="font-display font-extrabold text-5xl leading-none mb-1"
                    style={{ color: '#15803d', letterSpacing: '-0.04em' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {Math.round(result.predicted_yield).toLocaleString()}
                  </motion.div>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-3)' }}>{result.unit}</div>
                  <div className="text-[13px] mb-3" style={{ color: 'var(--text-2)' }}>
                    ≈ <strong>{(result.predicted_yield / 10000).toFixed(2)} tonnes/ha</strong>
                  </div>

                  {/* Comparison badge */}
                  {yieldCtx && (
                    <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold"
                      style={{ background: yieldCtx.color + '18', color: yieldCtx.color }}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
                      <span>{yieldCtx.icon}</span>{yieldCtx.label}
                    </motion.div>
                  )}
                </div>

                {yieldCtx && (
                  <motion.p className="text-[12px] p-3 rounded-xl mb-4"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-2)', borderLeft: `2px solid ${yieldCtx.color}` }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    💡 {yieldCtx.tip}
                  </motion.p>
                )}
              </motion.div>
            )}

            {chartData && (
              <motion.div key="chart" className="rounded-[22px] p-7 border mb-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-3)' }}>
                    Yield projection 2000–2013
                  </p>
                  <div className="flex gap-3 text-[11px]" style={{ color: 'var(--text-3)' }}>
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 12, height: 2, background: '#22c55e', display: 'inline-block', borderRadius: 2 }} />
                      Predicted
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 12, height: 0, borderTop: '2px dashed rgba(0,0,0,0.3)', display: 'inline-block' }} />
                      National avg
                    </span>
                  </div>
                </div>
                <div style={{ position: 'relative', height: 190 }}><canvas ref={chartRef} /></div>
                <p className="text-[11px] mt-2" style={{ color: 'var(--text-3)' }}>🟡 Orange dot = your selected year</p>
              </motion.div>
            )}

            {exp && (
              <motion.div key="shap" className="rounded-[22px] p-7 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>SHAP feature impact</p>
                <div className="p-3 rounded-[10px] border-l-4 border-green-500 text-sm italic mb-4"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
                  {exp.summary}
                </div>
                {exp.contributions.slice(0, 6).map((c, i) => (
                  <motion.div key={c.feature} className="mb-3"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex justify-between text-[12px] mb-1" style={{ color: 'var(--text-2)' }}>
                      <span>{c.feature}</span>
                      <span className={c.shap_value >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                        {c.shap_value >= 0 ? '+' : ''}{Math.round(c.shap_value).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        style={{ background: c.shap_value >= 0 ? '#22c55e' : '#ef4444' }} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tips to improve yield */}
      <motion.div ref={tipsRef} className="rounded-[22px] p-7 border mt-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>How to improve your yield</p>
        <div className="grid grid-cols-2 gap-3">
          {YIELD_TIPS.map((t, i) => (
            <motion.div key={i} className="flex gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--bg-muted)' }}
              initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}>
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{t.tip}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}