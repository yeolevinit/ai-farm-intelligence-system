import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2 } from 'lucide-react';
import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js';
import { predictYield, explainPrediction } from '../api';
import api from '../api';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler);

const INITIAL = { crop: '', year: 2010, rainfall: 800, temperature: 22, pesticide_use: 10 };

export default function YieldPrediction() {
  const [form, setForm] = useState(INITIAL);
  const [crops, setCrops] = useState([]);
  const [result, setResult] = useState(null);
  const [exp, setExp] = useState(null);
  const [chartData, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    api.get('/supported_crops')
      .then(r => { const l = r.data.crops; setCrops(l); setForm(f => ({ ...f, crop: l[0] || '' })); })
      .catch(() => setError('Could not load crop list. Make sure backend is running.'));
  }, []);

  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: chartData.years,
        datasets: [{
          data: chartData.yields,
          borderColor: '#22c55e',
          backgroundColor: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.08)',
          borderWidth: 2,
          pointBackgroundColor: chartData.years.map(y => y === chartData.sel ? '#f59e0b' : '#22c55e'),
          pointRadius: chartData.years.map(y => y === chartData.sel ? 7 : 3),
          tension: 0.4, fill: true,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false }, tooltip: {
            callbacks: {
              label: ctx => `  ${Math.round(ctx.raw).toLocaleString()} hg/ha`
            }
          }
        },
        scales: {
          x: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#9ab89a' : '#64748b', font: { size: 11 } }
          },
          y: {
            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            ticks: {
              color: isDark ? '#9ab89a' : '#64748b', font: { size: 11 },
              callback: v => Math.round(v / 1000) + 'k'
            }
          }
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
    e.preventDefault();
    setLoading(true); setError(''); setResult(null); setExp(null); setChart(null);
    try {
      const { data } = await predictYield(form);
      setResult(data);
      const years = [2000, 2002, 2004, 2006, 2008, 2010, 2012, 2013];
      const yields = await Promise.all(years.map(y => predictYield({ ...form, year: y }).then(r => Math.round(r.data.predicted_yield))));
      setChart({ years, yields, crop: data.crop, sel: form.year });
      const { data: explanation } = await explainPrediction('yield', { crop: form.crop, year: form.year, rainfall: form.rainfall, temperature: form.temperature, pesticide_use: form.pesticide_use });
      setExp(explanation);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally { setLoading(false); }
  };

  const maxShap = exp ? Math.max(...exp.contributions.map(c => Math.abs(c.shap_value))) : 1;

  return (
    <div>
      <div className="page-header">
        <h1>Yield Prediction</h1>
        <p className="subtitle">Estimate expected crop harvest from climate and farming inputs.</p>
      </div>

      <div className="two-col">
        <motion.div className="card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <div className="section-label">Prediction Inputs</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Crop type</label>
              <select name="crop" value={form.crop} onChange={handleChange} required>
                {crops.length === 0 ? <option value="">Loading crops...</option>
                  : crops.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {[
              { name: 'year', label: 'Year', unit: '1990–2013', min: 1990, max: 2013, step: 1 },
              { name: 'rainfall', label: 'Annual Rainfall', unit: 'mm', min: 0, max: 3000, step: 1 },
              { name: 'temperature', label: 'Avg Temperature', unit: '°C', min: 0, max: 50, step: 0.1 },
              { name: 'pesticide_use', label: 'Pesticide Use', unit: 'tonnes', min: 0, max: 500, step: 0.1 },
            ].map(f => (
              <div className="form-group" key={f.name} style={{ marginBottom: '0.85rem' }}>
                <label>{f.label} <span className="unit">{f.unit}</span></label>
                <input type="number" name={f.name} value={form[f.name]}
                  onChange={handleChange} required min={f.min} max={f.max} step={f.step} />
              </div>
            ))}
            <button type="submit" className="btn-primary" disabled={loading || !form.crop}>
              {loading ? <><span className="spinner" />Predicting...</> : <><BarChart2 size={15} />Predict Yield</>}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        </motion.div>

        <div>
          <AnimatePresence>
            {result && (
              <motion.div className="card" key="res"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}>
                <div className="yield-hero">
                  <div className="yield-label">{result.crop}</div>
                  <motion.div className="yield-num"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {Math.round(result.predicted_yield).toLocaleString()}
                  </motion.div>
                  <div className="yield-unit">{result.unit}</div>
                  <div className="yield-conv">≈ {(result.predicted_yield / 10000).toFixed(2)} tonnes/ha</div>
                </div>
              </motion.div>
            )}

            {chartData && (
              <motion.div className="card" key="chart"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="section-label">Yield Projection 2000–2013</div>
                <div style={{ position: 'relative', height: 190 }}>
                  <canvas ref={chartRef} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>🟡 Orange dot = your selected year</p>
              </motion.div>
            )}

            {exp && (
              <motion.div className="card" key="shap"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="section-label">SHAP Feature Impact</div>
                <div className="summary-box">{exp.summary}</div>
                {exp.contributions.slice(0, 6).map((c, i) => (
                  <motion.div className="shap-row" key={c.feature}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <div className="shap-label">
                      <span>{c.feature}</span>
                      <span className={c.shap_value >= 0 ? 'shap-val-pos' : 'shap-val-neg'}>
                        {c.shap_value >= 0 ? '+' : ''}{Math.round(c.shap_value).toLocaleString()}
                      </span>
                    </div>
                    <div className="bar-track">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
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