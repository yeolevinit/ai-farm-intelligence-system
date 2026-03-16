import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { detectDisease } from '../api';

export default function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1
  });

  const handleDetect = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await detectDisease(image);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Detection failed. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Plant Disease Detection</h1>
      <p className="subtitle">Upload a leaf image to detect diseases using AI vision.</p>

      <div className="two-col">
        <div className="card">
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Uploaded leaf" className="preview-img" />
            ) : (
              <div className="dropzone-placeholder">
                <span className="drop-icon">🍃</span>
                <p>Drag & drop a leaf image here</p>
                <p className="hint">or click to browse (.jpg, .png)</p>
              </div>
            )}
          </div>
          {image && (
            <button className="btn-primary" onClick={handleDetect} disabled={loading}>
              {loading ? 'Analysing image...' : '🔍 Detect Disease'}
            </button>
          )}
          {error && <p className="error">{error}</p>}
        </div>

        {result && (
          <div className="card result-card">
            <div className={`disease-badge ${result.is_healthy ? 'healthy' : 'diseased'}`}>
              {result.is_healthy ? '✅ Healthy' : '⚠️ Disease Detected'}
            </div>
            <h2 className="disease-name">{result.disease.replace(/_/g, ' ')}</h2>
            <p className="confidence">Confidence: {(result.confidence * 100).toFixed(1)}%</p>

            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${result.confidence * 100}%` }} />
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>Top 3 Predictions</h3>
            {result.top_3.map((d, i) => (
              <div className="bar-row" key={i}>
                <span style={{ fontSize: '12px', flex: 1 }}>{d.disease.replace(/_/g, ' ')}</span>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${d.probability * 100}%`, background: i === 0 ? '#f59e0b' : '#94a3b8' }} />
                </div>
                <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>{(d.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
