import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Search, Cloud, Thermometer, Droplets, Wind } from 'lucide-react';
import { getWeather } from '../api';

const W_ICON = d => {
  const s = (d || '').toLowerCase();
  if (s.includes('thunder') || s.includes('storm')) return '⛈️';
  if (s.includes('rain') || s.includes('drizzle')) return '🌧️';
  if (s.includes('snow')) return '❄️';
  if (s.includes('mist') || s.includes('fog')) return '🌫️';
  if (s.includes('cloud') || s.includes('overcast')) return '⛅';
  if (s.includes('clear') || s.includes('sun')) return '☀️';
  return '🌤️';
};

const A_ICON = t => {
  const s = t.toLowerCase();
  if (s.includes('rain') || s.includes('irrigat')) return '💧';
  if (s.includes('heat') || s.includes('high temp')) return '🌡️';
  if (s.includes('frost') || s.includes('cold')) return '❄️';
  if (s.includes('humid') || s.includes('fungal')) return '🍄';
  if (s.includes('wind') || s.includes('spray')) return '💨';
  return '✅';
};

const CITIES = ['Pune', 'Mumbai', 'Delhi', 'Nagpur', 'Nashik', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad'];

const SEASONAL_TIPS = [
  { month: 'June–Sep', season: 'Kharif', emoji: '🌧️', crop: 'Rice, Maize, Cotton, Soybean', tip: 'Kharif sowing season. Ensure good drainage. Monitor for fungal diseases in high humidity.' },
  { month: 'Oct–Feb', season: 'Rabi', emoji: '🌾', crop: 'Wheat, Mustard, Chickpea', tip: 'Rabi sowing begins Oct–Nov. Irrigate 4–6 times for wheat. Watch for frost in Dec–Jan.' },
  { month: 'Feb–May', season: 'Zaid', emoji: '☀️', crop: 'Watermelon, Cucumber, Moong', tip: 'Short summer crop season. High water demand. Morning irrigation preferred to reduce evaporation.' },
];

const WEATHER_MEANING = [
  {
    icon: <Thermometer size={16} />, label: 'Temperature', ranges: [
      { range: '< 10°C', meaning: 'Risk of frost. Protect sensitive crops.', color: '#3b82f6' },
      { range: '10–25°C', meaning: 'Ideal for most crops. Good growing conditions.', color: '#16a34a' },
      { range: '25–35°C', meaning: 'Monitor water needs. Increase irrigation.', color: '#d97706' },
      { range: '> 35°C', meaning: 'Heat stress. Mulch and irrigate frequently.', color: '#dc2626' },
    ]
  },
  {
    icon: <Droplets size={16} />, label: 'Humidity', ranges: [
      { range: '< 40%', meaning: 'Drought stress possible. Water crops.', color: '#d97706' },
      { range: '40–70%', meaning: 'Comfortable for most crops.', color: '#16a34a' },
      { range: '> 70%', meaning: 'High fungal disease risk. Monitor leaves.', color: '#dc2626' },
    ]
  },
  {
    icon: <Wind size={16} />, label: 'Wind speed', ranges: [
      { range: '0–5 m/s', meaning: 'Ideal for spraying pesticides or fertiliser.', color: '#16a34a' },
      { range: '5–10 m/s', meaning: 'Light wind. Spray with caution.', color: '#d97706' },
      { range: '> 10 m/s', meaning: 'Avoid spraying. Risk of crop damage.', color: '#dc2626' },
    ]
  },
];

export default function WeatherAdvisory() {
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const guideRef = useRef(null);
  const inView = useInView(guideRef, { once: true });

  const fetchWeather = async name => {
    if (!name.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try { const { data } = await getWeather(name.trim()); setResult(data); }
    catch (err) {
      const msg = err.response?.data?.detail || '';
      if (msg.includes('API key') || err.response?.status === 500)
        setError('Weather API key not configured. Add OPENWEATHER_API_KEY to backend/.env and restart.');
      else if (err.response?.status === 404)
        setError(`City "${name}" not found. Try a different spelling.`);
      else setError(msg || 'Could not fetch weather. Is the backend running?');
    } finally { setLoading(false); }
  };

  const getTempContext = t => {
    if (t < 10) return { label: 'Cold', color: '#3b82f6', advice: 'Risk of frost. Protect crops tonight.' };
    if (t < 25) return { label: 'Ideal', color: '#16a34a', advice: 'Good growing conditions today.' };
    if (t < 35) return { label: 'Warm', color: '#d97706', advice: 'Increase irrigation. Avoid afternoon fieldwork.' };
    return { label: 'Hot', color: '#dc2626', advice: 'Heat stress risk. Irrigate and mulch.' };
  };

  const ctx = result ? getTempContext(result.temperature) : null;

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 mb-1">
          <Cloud size={22} color="#7c3aed" strokeWidth={2} />
          <h1 className="font-display font-extrabold text-4xl" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Weather Advisory</h1>
        </div>
        <p className="text-[15px] font-light ml-8" style={{ color: 'var(--text-2)' }}>
          Live weather + AI-generated farming advisories for irrigation, spraying and harvesting.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div className="rounded-[22px] p-7 border mb-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Search your location</p>
        <div className="flex gap-3">
          <input type="text" value={city} onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchWeather(city)}
            placeholder="Enter city — e.g. Pune, Mumbai, Delhi" className="flex-1" />
          <motion.button onClick={() => fetchWeather(city)} disabled={loading} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm text-white cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
            style={{ background: '#15803d', minHeight: 42 }}>
            {loading ? <><span className="spinner" />Fetching...</> : <><Search size={14} />Get Advisory</>}
          </motion.button>
        </div>
        <div className="flex gap-1.5 flex-wrap mt-3">
          {CITIES.map(c => (
            <button key={c} onClick={() => { setCity(c); fetchWeather(c); }}
              className="city-pill px-3 py-1 text-[12px] border rounded-full cursor-pointer transition-all duration-200"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
              {c}
            </button>
          ))}
        </div>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">
            {error}
          </motion.p>
        )}
        {!result && !error && (
          <p className="mt-3 text-[12px] p-3 rounded-[10px] border-l-4 border-green-500"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
            Requires <code>OPENWEATHER_API_KEY</code> in <code>backend/.env</code>. Free key at openweathermap.org
          </p>
        )}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div key="weather" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Weather card */}
              <div className="rounded-[22px] p-7 border text-center"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                <motion.span className="text-7xl block mb-3 leading-none"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 18 }}>
                  {W_ICON(result.description)}
                </motion.span>
                <div className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-1)' }}>{result.location}</div>
                <p className="text-[14px] capitalize mb-4" style={{ color: 'var(--text-2)' }}>{result.description}</p>

                <div className="flex justify-center gap-5 flex-wrap mb-4">
                  {[
                    { val: `${result.temperature}°C`, lbl: 'Temp', icon: <Thermometer size={13} /> },
                    { val: `${result.humidity}%`, lbl: 'Humidity', icon: <Droplets size={13} /> },
                    { val: `${result.wind_speed}m/s`, lbl: 'Wind', icon: <Wind size={13} /> },
                  ].map(s => (
                    <div key={s.lbl} className="flex flex-col items-center gap-0.5">
                      <span className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>{s.val}</span>
                      <span className="text-[10px] uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                        {s.icon}{s.lbl}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Temperature context */}
                <motion.div className="p-2.5 rounded-xl text-[12px]"
                  style={{ background: ctx.color + '15', color: ctx.color, borderLeft: `2px solid ${ctx.color}` }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <span className="font-semibold">{ctx.label}</span> · {ctx.advice}
                </motion.div>
              </div>

              {/* Advisories */}
              <div className="rounded-[22px] p-7 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>AI Farming Advisories</p>
                <ul className="flex flex-col gap-2.5">
                  {result.advisories.map((adv, i) => (
                    <motion.li key={i} className="flex items-start gap-2.5 text-[13px] p-3 rounded-xl"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-1)' }}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}>
                      <span className="text-lg flex-shrink-0 leading-none mt-0.5">{A_ICON(adv)}</span>
                      <span>{adv}</span>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2 font-display" style={{ color: 'var(--text-3)' }}>What to do today</p>
                  <div className="flex flex-col gap-2">
                    {[
                      result.humidity > 75 ? '🍄 High humidity — check leaves for fungal spots' : null,
                      result.wind_speed > 8 ? '💨 High wind — avoid chemical spraying' : null,
                      result.temperature > 32 ? '💧 Hot day — irrigate early morning or evening' : null,
                      result.temperature < 12 ? '🧊 Cold night — protect frost-sensitive crops' : null,
                      '📋 Check your crop growth stage before applying any inputs',
                    ].filter(Boolean).slice(0, 3).map((tip, i) => (
                      <div key={i} className="text-[12px] p-2 rounded-lg" style={{ background: 'rgba(22,163,74,0.06)', color: 'var(--text-2)' }}>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seasonal farming calendar */}
      <motion.div ref={guideRef} className="rounded-[22px] p-7 border mb-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1 font-display" style={{ color: 'var(--text-3)' }}>Indian farming seasons</p>
        <p className="text-[12px] mb-4 font-light" style={{ color: 'var(--text-2)' }}>Understanding the 3 crop seasons helps plan weather-based decisions.</p>
        <div className="grid grid-cols-3 gap-4">
          {SEASONAL_TIPS.map((s, i) => (
            <motion.div key={s.season} className="p-4 rounded-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}
              initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}>
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="text-[13px] font-bold mb-0.5" style={{ color: 'var(--text-1)' }}>{s.season} <span className="font-normal text-[11px]" style={{ color: 'var(--text-3)' }}>{s.month}</span></div>
              <div className="text-[11px] mb-2 font-medium" style={{ color: '#16a34a' }}>{s.crop}</div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.tip}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Weather meaning guide */}
      <motion.div className="rounded-[22px] p-7 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>What weather readings mean for your farm</p>
        <div className="grid grid-cols-3 gap-6">
          {WEATHER_MEANING.map(wm => (
            <div key={wm.label}>
              <div className="flex items-center gap-1.5 mb-3" style={{ color: 'var(--text-2)' }}>
                {wm.icon}
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{wm.label}</span>
              </div>
              <div className="flex flex-col gap-2">
                {wm.ranges.map(r => (
                  <div key={r.range} className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold" style={{ color: r.color }}>{r.range}</span>
                    <span className="text-[11px] leading-snug" style={{ color: 'var(--text-2)' }}>{r.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}