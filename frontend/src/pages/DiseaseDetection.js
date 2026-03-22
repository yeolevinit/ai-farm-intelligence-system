import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ScanLine, RotateCcw } from 'lucide-react';
import { detectDisease } from '../api';

const fmt = name => name.replace(/___/g, ' — ').replace(/_/g, ' ');

export default function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(accepted => {
    const file = accepted[0]; if (!file) return;
    setImage(file); setPreview(URL.createObjectURL(file));
    setResult(null); setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1
  });

  const handleDetect = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await detectDisease(image);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.detail || '';
      if (err.response?.status === 503) setError('Disease model not found. Place disease_model.pth in ml_models/ folder.');
      else setError(msg || 'Detection failed. Is the backend running?');
    } finally { setLoading(false); }
  };

  const handleReset = () => { setImage(null); setPreview(null); setResult(null); setError(''); };

  return (
    <div>
      <div className="page-header">
        <h1>Disease Detection</h1>
        <p className="subtitle">Upload a leaf photo — ResNet18 CNN diagnoses across 38 plant diseases.</p>
      </div>

      <div className="two-col">
        <motion.div className="card" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <div className="section-label">Upload Leaf Image</div>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            {preview
              ? <img src={preview} alt="Leaf" className="preview-img" />
              : <div>
                <span className="drop-icon">🍃</span>
                <p className="drop-text">Drag & drop a leaf image</p>
                <p className="drop-hint">or click to browse · JPG, PNG</p>
              </div>
            }
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
            {image && (
              <button className="btn-primary" onClick={handleDetect} disabled={loading} style={{ flex: 1, marginTop: 0 }}>
                {loading ? <><span className="spinner" />Analysing...</> : <><ScanLine size={15} />Detect Disease</>}
              </button>
            )}
            {(image || result) && (
              <button className="btn-secondary" onClick={handleReset} style={{ marginTop: 0 }}>
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {error && <p className="error">{error}</p>}
          {!image && <p className="info-box">Supports 38 diseases · tomato, potato, corn, grape & more. Requires <code>disease_model.pth</code> in <code>ml_models/</code>.</p>}
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div className="card" key="result"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span className={`badge ${result.is_healthy ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.82rem', padding: '5px 14px' }}>
                  {result.is_healthy ? '✅ Healthy plant' : '⚠️ Disease detected'}
                </span>
                <div className="disease-name-text">{fmt(result.disease)}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </div>
                <div className="conf-bar">
                  <motion.div className="conf-fill"
                    initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }} />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div className="section-label">Top 3 Predictions</div>
                {result.top_3.map((d, i) => (
                  <motion.div className="bar-row" key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}>
                    <span style={{ fontSize: 11, flex: 1, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{fmt(d.disease)}</span>
                    <div className="bar-track">
                      <motion.div className="bar-fill"
                        initial={{ width: 0 }} animate={{ width: `${d.probability * 100}%` }}
                        transition={{ duration: 0.55, delay: i * 0.08 }}
                        style={{ background: i === 0 ? 'var(--amber-400)' : 'var(--text-muted)' }} />
                    </div>
                    <span style={{ fontSize: 11, minWidth: 36, textAlign: 'right', color: 'var(--text-muted)' }}>
                      {(d.probability * 100).toFixed(1)}%
                    </span>
                  </motion.div>
                ))}
              </div>

              {!result.is_healthy && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{
                    marginTop: '1rem', padding: '0.75rem', background: 'var(--amber-50)',
                    borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--amber-400)'
                  }}>
                  <p style={{ fontSize: 12, color: 'var(--amber-600)', margin: 0, lineHeight: 1.5 }}>
                    💊 Consult an agronomist for treatment recommendations specific to this disease and region.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}