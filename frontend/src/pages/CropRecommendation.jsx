import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Sprout, FlaskConical, Info, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { predictCrop, explainPrediction } from '../api';

const FIELDS = [
  { name: 'nitrogen', label: 'Nitrogen', unit: 'kg/ha', min: 0, max: 200, eg: 90, hint: 'High N = leafy growth. Rice & wheat need 80–120.' },
  { name: 'phosphorus', label: 'Phosphorus', unit: 'kg/ha', min: 0, max: 200, eg: 42, hint: 'Roots & flowering. Most crops need 30–60 kg/ha.' },
  { name: 'potassium', label: 'Potassium', unit: 'kg/ha', min: 0, max: 200, eg: 43, hint: 'Fruit quality & disease resistance. 20–60 typical.' },
  { name: 'temperature', label: 'Temperature', unit: '°C', min: 0, max: 50, eg: 20.8, hint: 'Most crops grow best at 15–30°C.' },
  { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, eg: 82, hint: 'High humidity (>80%) suits rice. Low (<50%) suits wheat.' },
  { name: 'ph', label: 'Soil pH', unit: '0–14', min: 0, max: 14, eg: 6.5, hint: '6.0–7.5 is ideal for most crops. Below 5.5 = too acidic.' },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 500, eg: 202, hint: 'Rice needs 150–300mm. Wheat survives on 75–150mm.' },
];

const EMOJI = {
  rice: '🌾', wheat: '🌾', maize: '🌽', cotton: '🌿', jute: '🌿', coconut: '🥥', mango: '🥭',
  banana: '🍌', apple: '🍎', grapes: '🍇', orange: '🍊', watermelon: '🍉', muskmelon: '🍈',
  coffee: '☕', lentil: '🌱', chickpea: '🟡', kidneybeans: '🫘', pigeonpeas: '🌱',
  mothbeans: '🌱', mungbean: '🌱', blackgram: '🌱', papaya: '🧡', pomegranate: '❤️',
};

const CROP_TIPS = {
  rice: { season: 'Kharif (June–Nov)', water: 'High water needed', tip: 'Transplant seedlings after 25–30 days. Keep field waterlogged 2–3cm.' },
  wheat: { season: 'Rabi (Oct–Mar)', water: 'Medium water', tip: 'Sow at 100–125 kg/ha seed rate. First irrigation at 21 days.' },
  maize: { season: 'Kharif & Rabi', water: 'Medium water', tip: 'Plant in rows 60–75cm apart. Harvest when husk turns brown.' },
  cotton: { season: 'Kharif (May–Nov)', water: 'Low–medium', tip: 'Needs long frost-free period. Pick bolls when fully open.' },
  coconut: { season: 'Year-round', water: 'Regular', tip: 'Takes 5–7 years to fruit. Thrives in coastal humid areas.' },
  mango: { season: 'Summer harvest', water: 'Low–medium', tip: 'Does not need much water after establishment. Prune after harvest.' },
  banana: { season: 'Year-round', water: 'High water', tip: 'Harvest when fruits fill out. Plant suckers 2m apart.' },
  coffee: { season: 'Harvest Nov–Feb', water: 'Medium', tip: 'Shade-grown coffee has better flavour. Needs hilly terrain.' },
  grapes: { season: 'Harvest Feb–May', water: 'Low–medium', tip: 'Prune hard in winter. Train vines on trellis.' },
  default: { season: 'Seasonal', water: 'As needed', tip: 'Follow local agricultural extension office guidance for best results.' },
};

const PRESETS = [
  { label: 'Rice', v: { nitrogen: '90', phosphorus: '42', potassium: '43', temperature: '20.8', humidity: '82', ph: '6.5', rainfall: '202' } },
  { label: 'Wheat', v: { nitrogen: '20', phosphorus: '50', potassium: '30', temperature: '15', humidity: '65', ph: '7.0', rainfall: '90' } },
  { label: 'Coffee', v: { nitrogen: '20', phosphorus: '30', potassium: '30', temperature: '25', humidity: '80', ph: '6.0', rainfall: '200' } },
  { label: 'Cotton', v: { nitrogen: '60', phosphorus: '35', potassium: '25', temperature: '28', humidity: '55', ph: '7.5', rainfall: '110' } },
];

const INIT = { nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } };

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{value}</span>
    </div>
  );
}

export default function CropRecommendation() {
  const [form, setForm] = useState(INIT);
  const [result, setResult] = useState(null);
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [activeHint, setActiveHint] = useState(null);
  const tipsRef = useRef(null);
  const inView = useInView(tipsRef, { once: true });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const fillPreset = v => setForm(v);

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null); setExp(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v)]));
      const { data } = await predictCrop(payload);
      setResult(data);
      const { data: expl } = await explainPrediction('crop', payload);
      setExp(expl);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally { setLoading(false); }
  };

  const maxShap = exp ? Math.max(...exp.contributions.map(c => Math.abs(c.shap_value))) : 1;
  const cropKey = result?.recommended_crop?.toLowerCase();
  const tips = CROP_TIPS[cropKey] || CROP_TIPS.default;

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 mb-1">
          <Sprout size={22} color="#16a34a" strokeWidth={2} />
          <h1 className="font-display font-extrabold text-4xl" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Crop Recommendation</h1>
        </div>
        <p className="text-[15px] font-light ml-8" style={{ color: 'var(--text-2)' }}>
          Enter your soil and climate data — AI recommends the best crop with 99.55% accuracy.
        </p>
      </motion.div>

      {/* Collapsible guide */}
      <motion.div className="rounded-[22px] border mb-5 overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <button className="w-full flex items-center justify-between p-5 cursor-pointer"
          onClick={() => setShowGuide(g => !g)}>
          <div className="flex items-center gap-2">
            <Info size={14} color="#16a34a" />
            <span className="text-[12px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-3)' }}>
              What do these soil values mean?
            </span>
          </div>
          {showGuide ? <ChevronUp size={15} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={15} style={{ color: 'var(--text-3)' }} />}
        </button>
        <AnimatePresence>
          {showGuide && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
              <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                {FIELDS.map(f => (
                  <div key={f.name} className="p-3 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
                    <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{f.label} <span style={{ color: 'var(--text-3)' }}>({f.unit})</span></div>
                    <div className="text-[11px] leading-snug" style={{ color: 'var(--text-2)' }}>{f.hint}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Form */}
        <motion.div className="rounded-[22px] p-7 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>

          {/* Presets */}
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Quick presets</p>
          <div className="flex gap-2 flex-wrap mb-5">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => fillPreset(p.v)}
                className="city-pill px-3 py-1 text-[12px] border rounded-full cursor-pointer transition-all duration-200"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Soil & climate inputs</p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {FIELDS.map(f => (
                <div key={f.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>
                      {f.label} <span className="text-[11px] font-normal" style={{ color: 'var(--text-3)' }}>{f.unit}</span>
                    </label>
                    <button type="button" onMouseEnter={() => setActiveHint(f.name)} onMouseLeave={() => setActiveHint(null)}
                      className="cursor-help"><Info size={11} style={{ color: 'var(--text-3)' }} /></button>
                  </div>
                  <input type="number" name={f.name} value={form[f.name]} onChange={handleChange}
                    placeholder={String(f.eg)} required min={f.min} max={f.max} step="any" />
                  <AnimatePresence>
                    {activeHint === f.name && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-[11px] p-2 rounded-lg border-l-2 border-green-500 leading-snug"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
                        {f.hint}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-semibold text-sm text-white transition-all duration-200 cursor-pointer mt-2"
              style={{ background: '#15803d', minHeight: 44 }}>
              {loading ? <><span className="spinner" />Analysing...</> : <><Sprout size={15} />Get Recommendation</>}
            </motion.button>

            <button type="button" onClick={() => fillPreset(PRESETS[0].v)}
              className="w-full mt-2 py-2 text-[13px] rounded-[10px] border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              style={{ borderStyle: 'dashed', borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-3)' }}>
              <FlaskConical size={12} />Fill sample values (rice conditions)
            </button>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">
                {error}
              </motion.p>
            )}
          </form>
        </motion.div>

        {/* Results */}
        <div>
          <AnimatePresence>
            {!result && !loading && (
              <motion.div key="empty" className="rounded-[22px] p-8 border text-center"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-5xl mb-3">🌱</div>
                <p className="text-sm font-light" style={{ color: 'var(--text-3)' }}>
                  Fill in your soil data on the left and click<br /><strong style={{ color: 'var(--text-2)' }}>Get Recommendation</strong> to see AI results here.
                </p>
              </motion.div>
            )}

            {result && (
              <motion.div key="result" className="rounded-[22px] p-7 border mb-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.35 }}>

                {/* Crop badge */}
                <div className="text-center pb-5 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <motion.span className="text-6xl block mb-3"
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    {EMOJI[cropKey] || '🌱'}
                  </motion.span>
                  <div className="font-display font-extrabold text-3xl capitalize mb-1"
                    style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
                    {result.recommended_crop}
                  </div>
                  <div className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <motion.div className="h-full rounded-full progress-fill"
                      initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} />
                  </div>
                </div>

                {/* Top 3 */}
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Top 3 candidates</p>
                {result.top_3.map((c, i) => (
                  <div key={c.crop} className="flex items-center gap-2.5 mb-2.5">
                    <span className="text-[13px] w-[90px]" style={{ color: 'var(--text-2)' }}>{c.crop}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                        animate={{ width: `${c.probability * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        style={{ background: i === 0 ? '#22c55e' : '#94a3b8' }} />
                    </div>
                    <span className="text-[12px] w-10 text-right" style={{ color: 'var(--text-2)' }}>
                      {(c.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}

                {/* Growing tips */}
                <motion.div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Lightbulb size={13} color="#d97706" />
                    <p className="text-[11px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-3)' }}>
                      Growing tips for {result.recommended_crop}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <InfoRow label="Best season" value={tips.season} />
                    <InfoRow label="Water needs" value={tips.water} />
                    <div className="pt-2">
                      <p className="text-[12px] leading-relaxed p-3 rounded-xl"
                        style={{ background: 'rgba(22,163,74,0.06)', color: 'var(--text-2)', borderLeft: '2px solid #16a34a' }}>
                        💡 {tips.tip}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {exp && (
              <motion.div key="shap" className="rounded-[22px] p-7 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>SHAP Explanation — why this crop?</p>
                <div className="p-3 rounded-[10px] border-l-4 border-green-500 text-sm italic mb-4"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
                  {exp.summary}
                </div>
                <p className="text-[11px] mb-3" style={{ color: 'var(--text-3)' }}>
                  Green bars = pushed toward this crop · Red bars = pushed against it
                </p>
                {exp.contributions.map((c, i) => (
                  <motion.div key={c.feature} className="mb-3"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="flex justify-between text-[12px] mb-1" style={{ color: 'var(--text-2)' }}>
                      <span>{c.feature}</span>
                      <span className={c.shap_value >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
                        {c.shap_value >= 0 ? '+' : ''}{c.shap_value.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(Math.abs(c.shap_value) / maxShap) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04 }}
                        style={{ background: c.shap_value >= 0 ? '#22c55e' : '#ef4444' }} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* How it works section */}
      <motion.div ref={tipsRef} className="rounded-[22px] p-7 border mt-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>How the AI decides</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '🧪', title: 'Reads soil chemistry', desc: 'N, P, K and pH levels tell the model what nutrients are available for plant growth.' },
            { icon: '🌡️', title: 'Analyses climate fit', desc: 'Temperature, humidity and rainfall are matched to each crop\'s ideal growing conditions.' },
            { icon: '🤖', title: 'Random Forest votes', desc: '300 decision trees each vote on the best crop — the majority vote wins with a confidence score.' },
          ].map((s, i) => (
            <motion.div key={s.title} className="p-4 rounded-2xl"
              style={{ background: 'var(--bg-muted)' }}
              initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{s.title}</div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}