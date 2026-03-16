import React, { useState } from 'react';
import { predictYield, explainPrediction } from '../api';
import Plot from 'react-plotly.js';

const CROPS = ['Wheat', 'Rice', 'Maize', 'Potatoes', 'Soybeans', 'Cassava', 'Sweet potatoes', 'Sorghum', 'Yams', 'Plantains'];
const INITIAL = { crop: 'Wheat', year: 2024, rainfall: 800, temperature: 22, pesticide_use: 10 };

export default function YieldPrediction() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setChartData(null);
    try {
      const { data } = await predictYield(form);
      setResult(data);

      // Generate multi-year projection by calling yield API for ±3 years
      const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027];
      const yields = await Promise.all(
        years.map(y => predictYield({ ...form, year: y }).then(r => r.data.predicted_yield))
      );
      setChartData({ years, yields });

      // Fetch SHAP explanation — we need crop_encoded but we don't have encoder on frontend
      // Pass raw numeric placeholders; backend handles encoding
      const { data: exp } = await explainPrediction('yield', {
        crop_encoded: 0, year: form.year,
        rainfall: form.rainfall, pesticide_use: form.pesticide_use,
        temperature: form.temperature
      });
      setExplanation(exp);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the yield model trained?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Yield Prediction</h1>
      <p className="subtitle">Estimate your expected crop production based on climate and inputs.</p>

      <div className="two-col">
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Crop Type</label>
            <select name="crop" value={form.crop} onChange={handleChange}>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {[
            { name: 'year', label: 'Year', unit: '', min: 1990, max: 2030 },
            { name: 'rainfall', label: 'Annual Rainfall', unit: 'mm', min: 0, max: 3000 },
            { name: 'temperature', label: 'Avg Temperature', unit: '°C', min: 0, max: 50 },
            { name: 'pesticide_use', label: 'Pesticide Use', unit: 'tonnes', min: 0, max: 500 },
          ].map(f => (
            <div className="form-group" key={f.name}>
              <label>{f.label} {f.unit && <span className="unit">{f.unit}</span>}</label>
              <input
                type="number" name={f.name} value={form[f.name]}
                onChange={handleChange} required min={f.min} max={f.max} step="any"
              />
            </div>
          ))}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Predicting...' : '📊 Predict Yield'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        <div>
          {result && (
            <div className="card result-card">
              <p className="yield-label">Predicted Yield</p>
              <p className="yield-value">{result.predicted_yield.toLocaleString()}</p>
              <p className="yield-unit">{result.unit} for {result.crop}</p>
            </div>
          )}

          {chartData && (
            <div className="card">
              <Plot
                data={[{
                  type: 'scatter', mode: 'lines+markers',
                  x: chartData.years, y: chartData.yields,
                  line: { color: '#22c55e', width: 2 },
                  marker: { size: 7, color: chartData.years.map(y => y === form.year ? '#f59e0b' : '#22c55e') },
                  name: form.crop
                }]}
                layout={{
                  title: `${form.crop} yield projection (2021–2027)`,
                  xaxis: { title: 'Year', dtick: 1 },
                  yaxis: { title: 'Yield (hg/ha)' },
                  margin: { l: 60, r: 20, t: 50, b: 50 },
                  height: 240,
                  paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {explanation && (
            <div className="card">
              <h3>What drives this yield?</h3>
              <p className="summary">{explanation.summary}</p>
              <Plot
                data={[{
                  type: 'bar', orientation: 'h',
                  x: explanation.contributions.map(c => c.shap_value),
                  y: explanation.contributions.map(c => c.feature),
                  marker: { color: explanation.contributions.map(c => c.shap_value > 0 ? '#22c55e' : '#ef4444') }
                }]}
                layout={{
                  margin: { l: 120, r: 20, t: 20, b: 40 },
                  height: 220,
                  xaxis: { title: 'SHAP impact' },
                  paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
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
