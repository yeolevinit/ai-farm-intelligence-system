import React, { useState } from 'react';
import { getWeather } from '../api';

const ICON = (desc = '') => {
  const d = desc.toLowerCase();
  if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
  if (d.includes('thunder') || d.includes('storm')) return '⛈️';
  if (d.includes('snow')) return '❄️';
  if (d.includes('cloud') || d.includes('overcast')) return '⛅';
  if (d.includes('clear') || d.includes('sun')) return '☀️';
  if (d.includes('mist') || d.includes('fog')) return '🌫️';
  return '🌤️';
};

const ADVISORY_ICON = (text) => {
  if (text.includes('rain') || text.includes('irrigation')) return '💧';
  if (text.includes('temperature') || text.includes('heat')) return '🌡️';
  if (text.includes('frost') || text.includes('cold')) return '❄️';
  if (text.includes('humid') || text.includes('fungal')) return '🍄';
  if (text.includes('wind') || text.includes('spray')) return '💨';
  return '✅';
};

export default function WeatherAdvisory() {
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await getWeather(city.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not fetch weather. Check city name or API key in .env');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Weather Advisory</h1>
      <p className="subtitle">Get live weather data and AI-generated farming advisories for your location.</p>

      <form onSubmit={handleSubmit} className="card search-form">
        <div className="search-row">
          <input
            type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="Enter city — e.g. Pune, Mumbai, Nagpur"
            className="search-input"
          />
          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: 'auto', whiteSpace: 'nowrap' }}>
            {loading ? '⏳ Fetching...' : '🔍 Get Advisory'}
          </button>
        </div>
        {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
        {!result && !error && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Requires OpenWeatherMap API key in <code>backend/.env</code>
          </p>
        )}
      </form>

      {result && (
        <div className="weather-grid">
          {/* Weather card */}
          <div className="card weather-hero">
            <div className="weather-icon">{ICON(result.description)}</div>
            <h2>{result.location}</h2>
            <p className="weather-desc">{result.description}</p>
            <div className="weather-stats">
              <div className="stat">
                <span className="stat-val">{result.temperature}°C</span>
                <span className="stat-label">Temperature</span>
              </div>
              <div className="stat">
                <span className="stat-val">{result.humidity}%</span>
                <span className="stat-label">Humidity</span>
              </div>
              <div className="stat">
                <span className="stat-val">{result.wind_speed} m/s</span>
                <span className="stat-label">Wind</span>
              </div>
            </div>
          </div>

          {/* Advisories card */}
          <div className="card advisories-card">
            <h3>🌱 Farming advisories</h3>
            <ul className="advisory-list">
              {result.advisories.map((adv, i) => (
                <li key={i} className="advisory-item">
                  <span style={{ fontSize: 18 }}>{ADVISORY_ICON(adv.toLowerCase())}</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}