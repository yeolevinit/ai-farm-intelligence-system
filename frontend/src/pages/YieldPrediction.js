import React, { useState, useEffect, useRef } from 'react';
import { predictYield, explainPrediction } from '../api';
import api from '../api';
import {
  Chart,
  LineElement, PointElement, LineController,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler
} from 'chart.js';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const INITIAL = { crop: '', year: 2010, rainfall: 800, temperature: 22, pesticide_use: 10 };

export default function YieldPrediction() {
  const [form, setForm] = useState(INITIAL);
  const [crops, setCrops] = useState([]);
  const [result, setResult] = useState(null);
  const [explanation, setExp] = useState(null);
  const [chartData, setChart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Load supported crops on mount
  useEffect(() => {
    api.get('/supported_crops')
      .then(r => {
        const list = r.data.crops;
        setCrops(list);
        setForm(f => ({ ...f, crop: list[0] || '' }));
      })
      .catch(() => setError('Could not load crop list. Make sure backend is running on port 8000.'));
  }, []);

  // Draw chart whenever chartData updates
  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: chartData.years,
        datasets: [{
          label: `${chartData.crop} yield (hg/ha)`,
          data: chartData.yields,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.08)',
          borderWidth: 2,
          pointBackgroundColor: chartData.years.map(y =>
            y === chartData.selectedYear ? '#f59e0b' : '#22c55e'
          ),
          pointRadius: chartData.years.map(y =>
            y === chartData.selectedYear ? 7 : 4
          ),
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Year' } },
          y: { title: { display: true, text: 'Yield (hg/ha)' } }
        }
      }
    });
  }, [chartData]);

  // Destroy chart on unmount to avoid canvas reuse errors
  useEffect(() => {
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null); setExp(null); setChart(null);
    try {
      const { data } = await predictYield(form);
      setResult(data);

      // Multi-year projection
      const years = [2000, 2002, 2004, 2006, 2008, 2010, 2012, 2013];
      const yields = await Promise.all(
        years.map(y =>
          predictYield({ ...form, year: y }).then(r => Math.round(r.data.predicted_yield))
        )
      );
      setChart({ years, yields, crop: data.crop, selectedYear: form.year });

      // SHAP explanation
      const { data: exp } = await explainPrediction('yield', {
        crop: form.crop,
        year: form.year,
        rainfall: form.rainfall,
        temperature: form.temperature,
        pesticide_use: form.pesticide_use
      });
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
      <h1>Yield Prediction</h1>
      <p className="subtitle">Estimate expected crop production based on climate and farming inputs.</p>

      <div className="two-col">
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Crop type</label>
            <select name="crop" value={form.crop} onChange={handleChange} required>
              {crops.length === 0
                ? <option value="">Loading crops...</option>
                : crops.map(c => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>

          {[
            { name: 'year', label: 'Year', unit: '', min: 1990, max: 2013, step: 1 },
            { name: 'rainfall', label: 'Annual rainfall', unit: 'mm', min: 0, max: 3000, step: 1 },
            { name: 'temperature', label: 'Avg temperature', unit: '°C', min: 0, max: 50, step: 0.1 },
            { name: 'pesticide_use', label: 'Pesticide use', unit: 'tonnes', min: 0, max: 500, step: 0.1 },
          ].map(f => (
            <div className="form-group" key={f.name} style={{ marginBottom: '0.85rem' }}>
              <label>{f.label}{f.unit && <span className="unit"> {f.unit}</span>}</label>
              <input
                type="number" name={f.name} value={form[f.name]}
                onChange={handleChange} required
                min={f.min} max={f.max} step={f.step}
              />
            </div>
          ))}

          <button type="submit" className="btn-primary" disabled={loading || !form.crop}>
            {loading ? '⏳ Predicting...' : '📊 Predict Yield'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        {/* ── Results ── */}
        <div>
          {result && (
            <div className="card result-card">
              <p className="yield-label">Predicted yield — {result.crop}</p>
              <p className="yield-value">{result.predicted_yield.toLocaleString()}</p>
              <p className="yield-unit">{result.unit}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                ≈ {(result.predicted_yield / 10000).toFixed(2)} tonnes/ha
              </p>
            </div>
          )}

          {chartData && (
            <div className="card">
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Yield projection — {chartData.crop}
              </p>
              <div style={{ position: 'relative', height: 200 }}>
                <canvas ref={chartRef} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Orange dot = your selected year
              </p>
            </div>
          )}

          {explanation && (
            <div className="card">
              <h3>What drives this yield?</h3>
              <p className="summary">{explanation.summary}</p>
              <div style={{ marginTop: '0.75rem' }}>
                {explanation.contributions.slice(0, 6).map(c => (
                  <div key={c.feature} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                      <span>{c.feature}</span>
                      <span style={{ color: c.shap_value >= 0 ? '#16a34a' : '#dc2626' }}>
                        {c.shap_value >= 0 ? '+' : ''}{Math.round(c.shap_value).toLocaleString()}
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