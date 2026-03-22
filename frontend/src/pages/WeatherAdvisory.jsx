import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { getWeather } from '../api';

const W = d => { const s = (d || '').toLowerCase(); return s.includes('thunder') || s.includes('storm') ? '⛈️' : s.includes('rain') || s.includes('drizzle') ? '🌧️' : s.includes('snow') ? '❄️' : s.includes('mist') || s.includes('fog') ? '🌫️' : s.includes('cloud') || s.includes('overcast') ? '⛅' : s.includes('clear') || s.includes('sun') ? '☀️' : '🌤️'; };
const A = t => { const s = t.toLowerCase(); return s.includes('rain') || s.includes('irrigat') ? '💧' : s.includes('heat') || s.includes('high temp') ? '🌡️' : s.includes('frost') || s.includes('cold') ? '❄️' : s.includes('humid') || s.includes('fungal') ? '🍄' : s.includes('wind') || s.includes('spray') ? '💨' : '✅'; };
const CITIES = ['Pune', 'Mumbai', 'Delhi', 'Nagpur', 'Nashik', 'Bangalore', 'Hyderabad'];

export default function WeatherAdvisory() {
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch_ = async name => {
    if (!name.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try { const { data } = await getWeather(name.trim()); setResult(data); }
    catch (err) {
      const msg = err.response?.data?.detail || '';
      if (msg.includes('API key') || err.response?.status === 500) setError('Weather API key not configured. Add OPENWEATHER_API_KEY to backend/.env and restart.');
      else if (err.response?.status === 404) setError(`City "${name}" not found.`);
      else setError(msg || 'Could not fetch weather. Is the backend running?');
    }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-4xl mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Weather Advisory</h1>
        <p className="text-[15px] font-light" style={{ color: 'var(--text-2)' }}>Live weather data with AI-generated farming advisories for your location.</p>
      </div>

      <motion.div className="rounded-[22px] p-7 border mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Location Search</p>
        <div className="flex gap-3">
          <input type="text" value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetch_(city)}
            placeholder="Enter city — e.g. Pune, Mumbai, Delhi" className="flex-1" />
          <button onClick={() => fetch_(city)} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm text-white cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
            style={{ background: '#15803d', minHeight: 42 }}>
            {loading ? <><span className="spinner" />Fetching...</> : <><Search size={14} />Get Advisory</>}
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap mt-3">
          {CITIES.map(c => (
            <button key={c} onClick={() => { setCity(c); fetch_(c); }}
              className="city-pill px-3 py-1 text-[13px] border rounded-full transition-all duration-200 cursor-pointer"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
              {c}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">{error}</p>}
        {!result && !error && <p className="mt-3 text-[13px] p-3 rounded-[10px] border-l-4 border-green-500" style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>Requires <code>OPENWEATHER_API_KEY</code> in <code>backend/.env</code>. Get a free key at openweathermap.org</p>}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div key="w" className="grid grid-cols-2 gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="rounded-[22px] p-7 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
              <motion.span className="text-7xl block mb-3 leading-none" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 18 }}>{W(result.description)}</motion.span>
              <div className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-1)' }}>{result.location}</div>
              <p className="text-[14px] capitalize mb-5" style={{ color: 'var(--text-2)' }}>{result.description}</p>
              <div className="flex justify-center gap-6 flex-wrap">
                {[{ val: `${result.temperature}°C`, lbl: 'Temp' }, { val: `${result.humidity}%`, lbl: 'Humidity' }, { val: `${result.wind_speed} m/s`, lbl: 'Wind' }].map(s => (
                  <div key={s.lbl} className="flex flex-col items-center gap-0.5">
                    <span className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>{s.val}</span>
                    <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{s.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Farming Advisories</p>
              <ul className="flex flex-col gap-2.5">
                {result.advisories.map((adv, i) => (
                  <motion.li key={i} className="flex items-start gap-2.5 text-[14px] p-2.5 rounded-[10px]"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-1)' }}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                    <span className="text-lg flex-shrink-0">{A(adv)}</span><span>{adv}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}