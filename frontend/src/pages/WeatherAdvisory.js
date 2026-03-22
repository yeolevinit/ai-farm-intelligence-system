import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
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
const CITIES = ['Pune', 'Mumbai', 'Delhi', 'Nagpur', 'Nashik', 'Bangalore', 'Hyderabad'];

export default function WeatherAdvisory() {
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async name => {
    if (!name.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await getWeather(name.trim());
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.detail || '';
      if (msg.includes('API key') || err.response?.status === 500)
        setError('Weather API key not configured. Add OPENWEATHER_API_KEY to backend/.env and restart.');
      else if (err.response?.status === 404)
        setError(`City "${name}" not found. Try a different spelling.`);
      else setError(msg || 'Could not fetch weather. Is the backend running?');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Weather Advisory</h1>
        <p className="subtitle">Live weather data with AI-generated farming advisories for your location.</p>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="section-label">Location Search</div>
        <div className="search-row">
          <input type="text" className="search-input"
            value={city} onChange={e => setCity(e.target.value)}
            placeholder="Enter city — e.g. Pune, Mumbai, Delhi"
            onKeyDown={e => e.key === 'Enter' && fetchWeather(city)} />
          <button className="btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap', marginTop: 0 }}
            onClick={() => fetchWeather(city)} disabled={loading}>
            {loading ? <><span className="spinner" />Fetching...</> : <><Search size={14} />Get Advisory</>}
          </button>
        </div>

        <div className="city-pills">
          {CITIES.map(c => (
            <button key={c} className="city-pill" onClick={() => { setCity(c); fetchWeather(c); }}>{c}</button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        {!result && !error && (
          <p className="info-box">Requires <code>OPENWEATHER_API_KEY</code> in <code>backend/.env</code>. Get a free key at openweathermap.org</p>
        )}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div className="weather-grid" key="weather"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="card weather-hero">
              <motion.span className="weather-icon-lg"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 250, damping: 18 }}>
                {W_ICON(result.description)}
              </motion.span>
              <div className="weather-city">{result.location}</div>
              <p className="weather-desc-text">{result.description}</p>
              <div className="weather-stats">
                <div className="wstat"><span className="wstat-val">{result.temperature}°C</span><span className="wstat-label">Temp</span></div>
                <div className="wstat"><span className="wstat-val">{result.humidity}%</span><span className="wstat-label">Humidity</span></div>
                <div className="wstat"><span className="wstat-val">{result.wind_speed} m/s</span><span className="wstat-label">Wind</span></div>
              </div>
            </div>

            <div className="card">
              <div className="section-label">Farming Advisories</div>
              <ul className="adv-list">
                {result.advisories.map((adv, i) => (
                  <motion.li key={i} className="adv-item"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{A_ICON(adv)}</span>
                    <span>{adv}</span>
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