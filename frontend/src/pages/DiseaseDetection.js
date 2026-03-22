import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { detectDisease } from '../api';

export default function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    const file = accepted[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null); setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1
  });

  const handleDetect = async () => {
    if (!image) return;
    setLoading(true); setError('');
    try {
      const { data } = await detectDisease(image);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Detection failed. Is disease_model.pth in ml_models/?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null); setPreview(null); setResult(null); setError('');
  };

  // Format disease name: "Tomato___Early_blight" → "Tomato — Early blight"
  const formatDisease = (name = '') =>
    name.replace(/___/g, ' — ').replace(/_/g, ' ');

  return (
    <div className="page">
      <h1>Plant Disease Detection</h1>
      <p className="subtitle">Upload a leaf photo to detect diseases using AI vision (ResNet18 CNN).</p>

      <div className="two-col">
        {/* ── Upload panel ── */}
        <div className="card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {preview
              ? <img src={preview} alt="Leaf" className="preview-img" />
              : (
                <div className="dropzone-placeholder">
                  <span className="drop-icon">🍃</span>
                  <p>Drag & drop a leaf image here</p>
                  <p className="hint">or click to browse (.jpg, .png)</p>
                </div>
              )
            }
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {image && (
              <button className="btn-primary" onClick={handleDetect} disabled={loading}
                style={{ flex: 1 }}>
                {loading ? '⏳ Analysing...' : '🔍 Detect Disease'}
              </button>
            )}
            {(image || result) && (
              <button onClick={handleReset}
                style={{ padding: '0.65rem 1rem', border: '1px solid var(--color-border-secondary)', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                Reset
              </button>
            )}
          </div>

          {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}

          {!image && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-background-secondary)', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                💡 Works with tomato, potato, corn, grape, apple, and 33 more plant diseases from the PlantVillage dataset.
                Requires <code>disease_model.pth</code> in <code>ml_models/</code>.
              </p>
            </div>
          )}
        </div>

        {/* ── Result panel ── */}
        {result && (
          <div className="card result-card">
            <div className={`disease-badge ${result.is_healthy ? 'healthy' : 'diseased'}`}>
              {result.is_healthy ? '✅ Healthy plant' : '⚠️ Disease detected'}
            </div>

            <h2 className="disease-name">{formatDisease(result.disease)}</h2>
            <p className="confidence">Confidence: {(result.confidence * 100).toFixed(1)}%</p>

            <div className="confidence-bar">
              <div className="confidence-fill"
                style={{ width: `${result.confidence * 100}%` }} />
            </div>

            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Top 3 predictions</h3>
            {result.top_3.map((d, i) => (
              <div className="bar-row" key={i}>
                <span style={{ fontSize: 11, flex: 1, color: 'var(--color-text-secondary)' }}>
                  {formatDisease(d.disease)}
                </span>
                <div className="bar-bg">
                  <div className="bar-fill" style={{
                    width: `${d.probability * 100}%`,
                    background: i === 0 ? '#f59e0b' : '#94a3b8'
                  }} />
                </div>
                <span style={{ fontSize: 12, minWidth: 40, textAlign: 'right' }}>
                  {(d.probability * 100).toFixed(1)}%
                </span>
              </div>
            ))}

            {!result.is_healthy && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
                  💊 Consult an agronomist for treatment recommendations specific to this disease.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}