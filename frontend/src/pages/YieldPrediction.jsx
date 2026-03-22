import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2 } from 'lucide-react';
import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js';
import { predictYield, explainPrediction } from '../api';
import api from '../api';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler);
const INIT = { crop: '', year: 2010, rainfall: 800, temperature: 22, pesticide_use: 10 };

export default function YieldPrediction() {
  const [form, setForm] = useState(INIT);
  const [crops, setCrops] = useState([]);
  const [result, setResult] = useState(null);
  const [exp, setExp] = useState(null);
  const [chartData, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chartRef = useRef(null); const chartInst = useRef(null);

  useEffect(() => {
    api.get('/supported_crops').then(r => { const l = r.data.crops; setCrops(l); setForm(f => ({ ...f, crop: l[0] || '' })); })
      .catch(() => setError('Could not load crop list. Make sure backend is running.'));
  }, []);

  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels: chartData.years, datasets: [{ data: chartData.yields, borderColor: '#22c55e', backgroundColor: dark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.08)', borderWidth: 2, pointBackgroundColor: chartData.years.map(y => y === chartData.sel ? '#f59e0b' : '#22c55e'), pointRadius: chartData.years.map(y => y === chartData.sel ? 7 : 3), tension: 0.4, fill: true }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `  ${Math.round(ctx.raw).toLocaleString()} hg/ha` } } }, scales: { x: { grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: dark ? '#9ab89a' : '#64748b', font: { size: 11 } } }, y: { grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: dark ? '#9ab89a' : '#64748b', font: { size: 11 }, callback: v => Math.round(v / 1000) + 'k' } } } }
    });
  }, [chartData]);

  useEffect(() => () => { if (chartInst.current) chartInst.current.destroy(); }, []);

  const handleChange = e => { const v = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value; setForm({ ...form, [e.target.name]: v }); };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null); setExp(null); setChart(null);
    try {
      const { data } = await predictYield(form); setResult(data);
      const years = [2000, 2002, 2004, 2006, 2008, 2010, 2012, 2013];
      const yields = await Promise.all(years.map(y => predictYield({ ...form, year: y }).then(r => Math.round(r.data.predicted_yield))));
      setChart({ years, yields, crop: data.crop, sel: form.year });
      const { data: explanation } = await explainPrediction('yield', { crop: form.crop, year: form.year, rainfall: form.rainfall, temperature: form.temperature, pesticide_use: form.pesticide_use });
      setExp(explanation);
    } catch (err) { setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?'); }
    finally { setLoading(false); }
  };

  const maxShap = exp ? Math.max(...exp.contributions.map(c => Math.abs(c.shap_value))) : 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-4xl mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Yield Prediction</h1>
        <p className="text-[15px] font-light" style={{ color: 'var(--text-2)' }}>Estimate expected crop harvest from climate and farming inputs.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        <motion.div className="rounded-[22px] p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-5 font-display" style={{ color: 'var(--text-3)' }}>Prediction Inputs</p>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Crop type</label>
              <select name="crop" value={form.crop} onChange={handleChange} required>
                {crops.length === 0 ? <option value="">Loading crops...</option> : crops.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {[{ name: 'year', label: 'Year', unit: '1990–2013', min: 1990, max: 2013, step: 1 }, { name: 'rainfall', label: 'Annual Rainfall', unit: 'mm', min: 0, max: 3000, step: 1 }, { name: 'temperature', label: 'Avg Temperature', unit: '°C', min: 0, max: 50, step: 0.1 }, { name: 'pesticide_use', label: 'Pesticide Use', unit: 'tonnes', min: 0, max: 500, step: 0.1 }].map(f => (
              <div key={f.name} className="flex flex-col gap-1.5 mb-3">
                <label className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>{f.label} <span className="text-[11px] font-normal" style={{ color: 'var(--text-3)' }}>{f.unit}</span></label>
                <input type="number" name={f.name} value={form[f.name]} onChange={handleChange} required min={f.min} max={f.max} step={f.step} />
              </div>
            ))}
            <button type="submit" disabled={loading || !form.crop} className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-semibold text-sm text-white transition-all duration-200 cursor-pointer mt-2" style={{ background: '#15803d', minHeight: 44 }}>
              {loading ? <><span className="spinner" />Predicting...</> : <><BarChart2 size={15} />Predict Yield</>}
            </button>
            {error && <p className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">{error}</p>}
          </form>
        </motion.div>

        <div>
          <AnimatePresence>
            {result && (
              <motion.div key="r" className="rounded-[22px] p-7 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <div className="text-center">
                  <div className="text-[13px] mb-1" style={{ color: 'var(--text-2)' }}>{result.crop}</div>
                  <motion.div className="font-display font-extrabold text-5xl leading-none" style={{ color: '#15803d', letterSpacing: '-0.04em' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {Math.round(result.predicted_yield).toLocaleString()}
                  </motion.div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{result.unit}</div>
                  <div className="text-[12px] mt-1.5" style={{ color: 'var(--text-3)' }}>≈ {(result.predicted_yield / 10000).toFixed(2)} tonnes/ha</div>
                </div>
              </motion.div>
            )}
            {chartData && (
              <motion.div key="c" className="rounded-[22px] p-7 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Yield Projection 2000–2013</p>
                <div className="relative h-[190px]"><canvas ref={chartRef} /></div>
                <p className="text-[11px] mt-2" style={{ color: 'var(--text-3)' }}>🟡 Orange dot = your selected year</p>
              </motion.div>
            )}
            {exp && (
              <motion.div key="s" className="rounded-[22px] p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>SHAP Feature Impact</p>
                <div className="p-3 rounded-[10px] border-l-4 border-green-500 text-sm italic mb-4" style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>{exp.summary}</div>
                {exp.contributions.slice(0, 6).map((c, i) => (
                  <motion.div key={c.feature} className="mb-3" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex justify-between text-[12px] mb-1" style={{ color: 'var(--text-2)' }}>
                      <span>{c.feature}</span>
                      <span className={c.shap_value >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>{c.shap_value >= 0 ? '+' : ''}{Math.round(c.shap_value).toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} style={{ background: c.shap_value >= 0 ? '#22c55e' : '#ef4444' }} />
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