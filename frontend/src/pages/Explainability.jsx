import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sprout, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { explainPrediction } from '../api';

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

const CROP_FIELDS = [{ name: 'nitrogen', label: 'Nitrogen', unit: 'kg/ha' }, { name: 'phosphorus', label: 'Phosphorus', unit: 'kg/ha' }, { name: 'potassium', label: 'Potassium', unit: 'kg/ha' }, { name: 'temperature', label: 'Temperature', unit: '°C' }, { name: 'humidity', label: 'Humidity', unit: '%' }, { name: 'ph', label: 'Soil pH', unit: '' }, { name: 'rainfall', label: 'Rainfall', unit: 'mm' }];
const YIELD_CROPS = ['Cassava', 'Maize', 'Plantains and others', 'Potatoes', 'Rice, paddy', 'Sorghum', 'Soybeans', 'Sweet potatoes', 'Wheat', 'Yams'];
const SHAP_INFO = [{ icon: '🟢', label: 'Positive bar', desc: 'Feature pushed prediction higher / toward this crop' }, { icon: '🔴', label: 'Negative bar', desc: 'Feature pushed prediction lower / away from this crop' }, { icon: '📏', label: 'Bar length', desc: 'Longer = stronger impact on the prediction' }, { icon: '🎯', label: 'Base value', desc: 'Average prediction before any features are considered' }];

const CROP_INIT = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };
const YIELD_INIT = { crop: 'Cassava', year: 2010, rainfall: 800, temperature: 22, pesticide_use: 10 };

export default function Explainability() {
    const [model, setModel] = useState('crop');
    const [cropForm, setCropForm] = useState(CROP_INIT);
    const [yieldForm, setYieldForm] = useState(YIELD_INIT);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [guide, setGuide] = useState(true);

    const applyPreset = p => { if (model === 'crop') setCropForm(Object.fromEntries(Object.entries(p.values).map(([k, v]) => [k, String(v)]))); else setYieldForm(p.values); };

    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true); setError(''); setResult(null);
        try {
            const features = model === 'crop' ? Object.fromEntries(Object.entries(cropForm).map(([k, v]) => [k, parseFloat(v)])) : yieldForm;
            const { data } = await explainPrediction(model, features); setResult(data);
        } catch (err) { setError(err.response?.data?.detail || 'Explanation failed. Is the backend running?'); }
        finally { setLoading(false); }
    };

    const maxShap = result ? Math.max(...result.contributions.map(c => Math.abs(c.shap_value))) : 1;

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-display font-extrabold text-4xl mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Explainable AI</h1>
                <p className="text-[15px] font-light" style={{ color: 'var(--text-2)' }}>Understand exactly why the AI made each prediction using SHAP values.</p>
            </div>

            {/* Guide */}
            <motion.div className="rounded-[22px] p-7 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setGuide(g => !g)}>
                    <p className="text-[11px] font-bold uppercase tracking-widest font-display flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                        <BrainCircuit size={13} />What is SHAP?
                    </p>
                    {guide ? <ChevronUp size={16} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />}
                </div>
                <AnimatePresence>
                    {guide && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                            <p className="text-sm font-light leading-relaxed my-4" style={{ color: 'var(--text-2)' }}>SHAP assigns each input feature a value showing how much it contributed to the AI's decision. Based on game theory — it fairly distributes the "credit" for the prediction across all features.</p>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {SHAP_INFO.map(s => (
                                    <div key={s.label} className="flex gap-2.5 p-3 rounded-[10px] items-start" style={{ background: 'var(--bg-muted)' }}>
                                        <span className="text-lg flex-shrink-0">{s.icon}</span>
                                        <div><div className="text-[12px] font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>{s.label}</div><div className="text-[11px] leading-snug" style={{ color: 'var(--text-2)' }}>{s.desc}</div></div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="grid grid-cols-2 gap-6 items-start">
                {/* Input */}
                <motion.div className="rounded-[22px] p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                    {/* Model toggle */}
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Select Model</p>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                        {[{ id: 'crop', label: 'Crop Model', Icon: Sprout, desc: 'Random Forest' }, { id: 'yield', label: 'Yield Model', Icon: TrendingUp, desc: 'Gradient Boost' }].map(m => (
                            <button key={m.id} type="button" onClick={() => { setModel(m.id); setResult(null); setError(''); }}
                                className="p-3 rounded-2xl border text-left cursor-pointer transition-all duration-200"
                                style={{ border: model === m.id ? '2px solid #16a34a' : '1px solid var(--border)', background: model === m.id ? '#f0fdf4' : 'var(--bg-muted)' }}>
                                <m.Icon size={16} color={model === m.id ? '#15803d' : 'var(--text-3)'} style={{ marginBottom: 4 }} />
                                <div className="text-[13px] font-semibold" style={{ color: model === m.id ? '#15803d' : 'var(--text-1)' }}>{m.label}</div>
                                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{m.desc}</div>
                            </button>
                        ))}
                    </div>

                    {/* Presets */}
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Quick Presets</p>
                    <div className="flex gap-1.5 flex-wrap mb-5">
                        {PRESETS[model].map(p => (
                            <button key={p.label} onClick={() => applyPreset(p)} className="city-pill px-3 py-1 text-[12px] border rounded-full cursor-pointer transition-all duration-200" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-2)' }}>{p.label}</button>
                        ))}
                    </div>

                    {/* Form */}
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Input Features</p>
                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {model === 'crop' ? (
                                <motion.div key="crop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {CROP_FIELDS.map(f => (
                                            <div key={f.name} className="flex flex-col gap-1.5">
                                                <label className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>{f.label} <span className="font-normal" style={{ color: 'var(--text-3)' }}>{f.unit}</span></label>
                                                <input type="number" name={f.name} value={cropForm[f.name]} onChange={e => setCropForm({ ...cropForm, [e.target.name]: e.target.value })} placeholder="—" required step="any" />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="yield" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                                    <div className="flex flex-col gap-3 mb-4">
                                        <div className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>Crop</label><select name="crop" value={yieldForm.crop} onChange={e => setYieldForm({ ...yieldForm, crop: e.target.value })}>{YIELD_CROPS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                        {[{ name: 'year', label: 'Year', min: 1990, max: 2013 }, { name: 'rainfall', label: 'Rainfall mm', min: 0, max: 3000 }, { name: 'temperature', label: 'Temperature °C', min: 0, max: 50 }, { name: 'pesticide_use', label: 'Pesticide tonnes', min: 0, max: 500 }].map(f => (
                                            <div key={f.name} className="flex flex-col gap-1.5"><label className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>{f.label}</label><input type="number" name={f.name} value={yieldForm[f.name]} onChange={e => setYieldForm({ ...yieldForm, [f.name]: parseFloat(e.target.value) })} required min={f.min} max={f.max} step="any" /></div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-semibold text-sm text-white transition-all duration-200 cursor-pointer" style={{ background: '#15803d', minHeight: 44 }}>
                            {loading ? <><span className="spinner" />Computing SHAP...</> : <><BrainCircuit size={15} />Explain Prediction</>}
                        </button>
                        {error && <p className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">{error}</p>}
                    </form>
                </motion.div>

                {/* Results */}
                <div>
                    <AnimatePresence>
                        {result ? (
                            <motion.div key="r" initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.35 }}>
                                <div className="rounded-[22px] p-7 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                                        <div>
                                            <div className="font-display font-extrabold text-3xl capitalize" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{result.prediction}</div>
                                            <div className="text-[12px] mt-1" style={{ color: 'var(--text-3)' }}>Model: {result.model_type} · Base: {Math.abs(result.base_value) > 100 ? Math.round(result.base_value).toLocaleString() : result.base_value.toFixed(4)}</div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-semibold bg-green-100 text-green-800">SHAP explained ✓</span>
                                    </div>
                                    <div className="p-3 rounded-[10px] border-l-4 border-green-500 text-sm italic" style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>{result.summary}</div>
                                </div>

                                <div className="rounded-[22px] p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Feature Contributions</p>
                                    <div className="flex gap-4 mb-4 text-[12px]" style={{ color: 'var(--text-3)' }}>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Positive impact</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Negative impact</span>
                                    </div>
                                    {result.contributions.map((c, i) => (
                                        <motion.div key={c.feature} className="mb-4" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{c.feature}</span>
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-muted)', color: 'var(--text-3)' }}>= {Math.abs(c.value) > 100 ? Math.round(c.value).toLocaleString() : c.value.toFixed(2)}</span>
                                                </div>
                                                <span className={`text-[13px] font-bold min-w-[70px] text-right ${c.shap_value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {c.shap_value >= 0 ? '+' : ''}{Math.abs(c.shap_value) > 100 ? Math.round(c.shap_value).toLocaleString() : c.shap_value.toFixed(4)}
                                                </span>
                                            </div>
                                            <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-muted)' }}>
                                                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }}
                                                    transition={{ duration: 0.55, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                                                    style={{ background: c.shap_value >= 0 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#dc2626,#f87171)' }} />
                                            </div>
                                            {i === 0 && <div className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>← strongest driver of this prediction</div>}
                                        </motion.div>
                                    ))}
                                    <div className="border-t pt-3 mt-2 flex justify-between text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                                        <span>Total SHAP contribution</span>
                                        <span className="font-bold" style={{ color: 'var(--text-1)' }}>
                                            {result.contributions.reduce((s, c) => s + c.shap_value, 0) >= 0 ? '+' : ''}{
                                                Math.abs(result.contributions.reduce((s, c) => s + c.shap_value, 0)) > 100
                                                    ? Math.round(result.contributions.reduce((s, c) => s + c.shap_value, 0)).toLocaleString()
                                                    : result.contributions.reduce((s, c) => s + c.shap_value, 0).toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" className="rounded-[22px] p-12 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <BrainCircuit size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-3)' }} />
                                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Select a model, pick a preset or fill inputs,<br />then click <strong style={{ color: 'var(--text-2)' }}>Explain Prediction</strong>.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}