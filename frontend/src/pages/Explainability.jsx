import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sprout, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { explainPrediction } from '../api';

// ── Sample presets so user can try instantly ──────────────────
const PRESETS = {
    crop: [
        { label: 'Rice conditions', values: { nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202 } },
        { label: 'Wheat conditions', values: { nitrogen: 20, phosphorus: 50, potassium: 30, temperature: 15, humidity: 65, ph: 7.0, rainfall: 90 } },
        { label: 'Coffee conditions', values: { nitrogen: 20, phosphorus: 30, potassium: 30, temperature: 25, humidity: 80, ph: 6.0, rainfall: 200 } },
    ],
    yield: [
        { label: 'Cassava 2010', values: { crop: 'Cassava', year: 2010, rainfall: 800, temperature: 22, pesticide_use: 10 } },
        { label: 'Maize 2005', values: { crop: 'Maize', year: 2005, rainfall: 600, temperature: 20, pesticide_use: 5 } },
        { label: 'Wheat 2012', values: { crop: 'Wheat', year: 2012, rainfall: 450, temperature: 18, pesticide_use: 15 } },
    ],
};

const CROP_FIELDS = [
    { name: 'nitrogen', label: 'Nitrogen', unit: 'kg/ha', min: 0, max: 200, step: 'any' },
    { name: 'phosphorus', label: 'Phosphorus', unit: 'kg/ha', min: 0, max: 200, step: 'any' },
    { name: 'potassium', label: 'Potassium', unit: 'kg/ha', min: 0, max: 200, step: 'any' },
    { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 50, step: 'any' },
    { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, step: 'any' },
    { name: 'ph', label: 'Soil pH', unit: '', min: 0, max: 14, step: 'any' },
    { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 500, step: 'any' },
];

const YIELD_CROPS = ['Cassava', 'Maize', 'Plantains and others', 'Potatoes', 'Rice, paddy', 'Sorghum', 'Soybeans', 'Sweet potatoes', 'Wheat', 'Yams'];

const CROP_INIT = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };
const YIELD_INIT = { crop: 'Cassava', year: 2010, rainfall: 800, temperature: 22, pesticide_use: 10 };

// ── What SHAP means ──────────────────────────────────────────
const SHAP_INFO = [
    { icon: '🟢', label: 'Positive bar', desc: 'This feature pushed the prediction higher / toward this crop' },
    { icon: '🔴', label: 'Negative bar', desc: 'This feature pushed the prediction lower / away from this crop' },
    { icon: '📏', label: 'Bar length', desc: 'Longer bar = stronger impact on the final prediction' },
    { icon: '🎯', label: 'Base value', desc: 'Average prediction before any features are considered' },
];

export default function Explainability() {
    const [model, setModel] = useState('crop');
    const [cropForm, setCropForm] = useState(CROP_INIT);
    const [yieldForm, setYieldForm] = useState(YIELD_INIT);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showGuide, setShowGuide] = useState(true);

    const handleCropChange = e => setCropForm({ ...cropForm, [e.target.name]: e.target.value });
    const handleYieldChange = e => {
        const v = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setYieldForm({ ...yieldForm, [e.target.name]: v });
    };

    const applyPreset = preset => {
        if (model === 'crop') setCropForm(Object.fromEntries(Object.entries(preset.values).map(([k, v]) => [k, String(v)])));
        if (model === 'yield') setYieldForm(preset.values);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true); setError(''); setResult(null);
        try {
            const features = model === 'crop'
                ? Object.fromEntries(Object.entries(cropForm).map(([k, v]) => [k, parseFloat(v)]))
                : { ...yieldForm };
            const { data } = await explainPrediction(model, features);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Explanation failed. Is the backend running?');
        } finally { setLoading(false); }
    };

    const maxShap = result ? Math.max(...result.contributions.map(c => Math.abs(c.shap_value))) : 1;

    return (
        <div>
            <div className="page-header">
                <h1>Explainable AI</h1>
                <p className="subtitle">Understand exactly why the AI made each prediction using SHAP (SHapley Additive exPlanations).</p>
            </div>

            {/* ── What is SHAP guide ── */}
            <motion.div className="card" style={{ marginBottom: '1.5rem' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setShowGuide(g => !g)}>
                    <div className="section-label" style={{ margin: 0 }}>
                        <BrainCircuit size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        What is SHAP?
                    </div>
                    {showGuide ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
                <AnimatePresence>
                    {showGuide && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                            style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.85rem 0 1rem', lineHeight: 1.6 }}>
                                SHAP assigns each input feature a numerical value showing how much it contributed to the AI's decision.
                                It's based on game theory — it fairly distributes the "credit" for the prediction across all features.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.6rem' }}>
                                {SHAP_INFO.map(s => (
                                    <div key={s.label} style={{
                                        display: 'flex', gap: 10, padding: '0.6rem 0.75rem',
                                        background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', alignItems: 'flex-start'
                                    }}>
                                        <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                                        <div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="two-col">
                {/* ── Left: Input panel ── */}
                <motion.div className="card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>

                    {/* Model selector */}
                    <div className="section-label">Select Model</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.5rem' }}>
                        {[
                            { id: 'crop', label: 'Crop Model', icon: Sprout, desc: 'Random Forest' },
                            { id: 'yield', label: 'Yield Model', icon: TrendingUp, desc: 'Gradient Boost' },
                        ].map(m => (
                            <button key={m.id} type="button"
                                onClick={() => { setModel(m.id); setResult(null); setError(''); }}
                                style={{
                                    padding: '0.75rem', border: model === m.id ? '2px solid var(--green-600)' : '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)', background: model === m.id ? 'var(--green-50)' : 'var(--bg-muted)',
                                    cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)'
                                }}>
                                <m.icon size={16} color={model === m.id ? 'var(--green-700)' : 'var(--text-muted)'} style={{ marginBottom: 4 }} />
                                <div style={{
                                    fontSize: '0.85rem', fontWeight: 600,
                                    color: model === m.id ? 'var(--green-700)' : 'var(--text-primary)'
                                }}>{m.label}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                            </button>
                        ))}
                    </div>

                    {/* Presets */}
                    <div className="section-label">Quick Presets</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {PRESETS[model].map(p => (
                            <button key={p.label} type="button" className="city-pill"
                                onClick={() => applyPreset(p)}>{p.label}</button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="section-label">Input Features</div>
                        <AnimatePresence mode="wait">
                            {model === 'crop' ? (
                                <motion.div key="crop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                    <div className="form-grid">
                                        {CROP_FIELDS.map(f => (
                                            <div className="form-group" key={f.name}>
                                                <label>{f.label} {f.unit && <span className="unit">{f.unit}</span>}</label>
                                                <input type="number" name={f.name} value={cropForm[f.name]}
                                                    onChange={handleCropChange} placeholder="—"
                                                    required min={f.min} max={f.max} step={f.step} />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="yield" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                    <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                                        <label>Crop</label>
                                        <select name="crop" value={yieldForm.crop} onChange={handleYieldChange}>
                                            {YIELD_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    {[
                                        { name: 'year', label: 'Year', unit: '', min: 1990, max: 2013 },
                                        { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 3000 },
                                        { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 50 },
                                        { name: 'pesticide_use', label: 'Pesticide use', unit: 'tonnes', min: 0, max: 500 },
                                    ].map(f => (
                                        <div className="form-group" key={f.name} style={{ marginBottom: '0.85rem' }}>
                                            <label>{f.label} {f.unit && <span className="unit">{f.unit}</span>}</label>
                                            <input type="number" name={f.name} value={yieldForm[f.name]}
                                                onChange={handleYieldChange} required min={f.min} max={f.max} step="any" />
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading
                                ? <><span className="spinner" />Computing SHAP...</>
                                : <><BrainCircuit size={15} />Explain Prediction</>}
                        </button>
                        {error && <p className="error">{error}</p>}
                    </form>
                </motion.div>

                {/* ── Right: Results panel ── */}
                <div>
                    <AnimatePresence>
                        {result && (
                            <motion.div key="result"
                                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>

                                {/* Prediction summary card */}
                                <div className="card" style={{ marginBottom: '1rem' }}>
                                    <div className="section-label">Prediction</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                        <div>
                                            <div style={{
                                                fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800,
                                                color: 'var(--text-primary)', letterSpacing: '-0.03em', textTransform: 'capitalize'
                                            }}>
                                                {result.prediction}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                Model: {result.model_type} · Base value: {
                                                    typeof result.base_value === 'number'
                                                        ? (Math.abs(result.base_value) > 100
                                                            ? Math.round(result.base_value).toLocaleString()
                                                            : result.base_value.toFixed(4))
                                                        : result.base_value
                                                }
                                            </div>
                                        </div>
                                        <span className="badge badge-green" style={{ fontSize: '0.78rem' }}>
                                            SHAP explained ✓
                                        </span>
                                    </div>

                                    <div className="summary-box" style={{ marginTop: '1rem' }}>
                                        {result.summary}
                                    </div>
                                </div>

                                {/* SHAP waterfall card */}
                                <div className="card">
                                    <div className="section-label">Feature Contributions</div>
                                    <div style={{ display: 'flex', gap: 16, marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green-500)', display: 'inline-block' }} />
                                            Positive impact
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--red-500)', display: 'inline-block' }} />
                                            Negative impact
                                        </span>
                                    </div>

                                    {result.contributions.map((c, i) => (
                                        <motion.div key={c.feature}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05, duration: 0.3 }}
                                            style={{ marginBottom: 14 }}>

                                            {/* Feature name + value + SHAP number */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {c.feature}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.72rem', color: 'var(--text-muted)',
                                                        background: 'var(--bg-muted)', padding: '1px 7px', borderRadius: 'var(--radius-full)'
                                                    }}>
                                                        = {typeof c.value === 'number' && Math.abs(c.value) > 100
                                                            ? Math.round(c.value).toLocaleString()
                                                            : (typeof c.value === 'number' ? c.value.toFixed(2) : c.value)}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.82rem', fontWeight: 700, minWidth: 70, textAlign: 'right',
                                                    color: c.shap_value >= 0 ? 'var(--green-600)' : 'var(--red-500)'
                                                }}>
                                                    {c.shap_value >= 0 ? '+' : ''}
                                                    {Math.abs(c.shap_value) > 100
                                                        ? Math.round(c.shap_value).toLocaleString()
                                                        : c.shap_value.toFixed(4)}
                                                </span>
                                            </div>

                                            {/* Animated bar */}
                                            <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-full)', height: 9, overflow: 'hidden', position: 'relative' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }}
                                                    transition={{ duration: 0.55, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: 'var(--radius-full)',
                                                        background: c.shap_value >= 0
                                                            ? 'linear-gradient(90deg, var(--green-600), var(--green-400))'
                                                            : 'linear-gradient(90deg, #dc2626, #f87171)',
                                                    }}
                                                />
                                            </div>

                                            {/* Impact label for top feature */}
                                            {i === 0 && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                                                    ← strongest driver of this prediction
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}

                                    {/* Total SHAP sum */}
                                    <div style={{
                                        borderTop: '1px solid var(--border)', paddingTop: '0.85rem', marginTop: '0.5rem',
                                        display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)'
                                    }}>
                                        <span>Total SHAP contribution</span>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {result.contributions.reduce((s, c) => s + c.shap_value, 0) >= 0 ? '+' : ''}
                                            {Math.abs(result.contributions.reduce((s, c) => s + c.shap_value, 0)) > 100
                                                ? Math.round(result.contributions.reduce((s, c) => s + c.shap_value, 0)).toLocaleString()
                                                : result.contributions.reduce((s, c) => s + c.shap_value, 0).toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!result && !loading && (
                            <motion.div key="empty" className="card"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                                <BrainCircuit size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Select a model, fill in the inputs or pick a preset,<br />then click <strong>Explain Prediction</strong>.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}