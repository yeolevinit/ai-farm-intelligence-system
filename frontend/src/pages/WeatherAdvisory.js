import React, { useState } from 'react';
import { getWeather } from '../api';

export default function WeatherAdvisory() {
  const [city, setCity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await getWeather(city.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Weather fetch failed. Check your API key or city name.');
    } finally {
      setLoading(false);
    }
  };

  const weatherIcon = (desc = '') => {
    const d = desc.toLowerCase();
    if (d.includes('rain')) return '🌧️';
    if (d.includes('cloud')) return '⛅';
    if (d.includes('clear') || d.includes('sun')) return '☀️';
    if (d.includes('snow')) return '❄️';
    if (d.includes('storm') || d.includes('thunder')) return '⛈️';
    return '🌤️';
  };

  return (
    <div className="page">
      <h1>Weather Advisory</h1>
      <p className="subtitle">Get real-time weather data and AI farming advisories for your location.</p>

      <form onSubmit={handleSubmit} className="card search-form">
        <div className="search-row">
          <input
            type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="Enter city name (e.g. Pune, Mumbai, Delhi)"
            className="search-input"
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Fetching...' : '🔍 Get Advisory'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <div className="weather-grid">
          <div className="card weather-hero">
            <div className="weather-icon">{weatherIcon(result.description)}</div>
            <h2>{result.location}</h2>
            <p className="weather-desc">{result.description}</p>
            <div className="weather-stats">
              <div className="stat"><span className="stat-val">{result.temperature}°C</span><span className="stat-label">Temperature</span></div>
              <div className="stat"><span className="stat-val">{result.humidity}%</span><span className="stat-label">Humidity</span></div>
              <div className="stat"><span className="stat-val">{result.wind_speed} m/s</span><span className="stat-label">Wind Speed</span></div>
            </div>
          </div>

          <div className="card advisories-card">
            <h3>🌱 Farming Advisories</h3>
            <ul className="advisory-list">
              {result.advisories.map((adv, i) => (
                <li key={i} className="advisory-item">
                  <span className="advisory-dot" />
                  {adv}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
