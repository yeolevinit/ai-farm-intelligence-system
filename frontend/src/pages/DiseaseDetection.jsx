import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ScanLine, RotateCcw } from 'lucide-react';
import { detectDisease } from '../api';

const fmt = n => n.replace(/___/g, ' — ').replace(/_/g, ' ');

export default function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(a => { const f = a[0]; if (!f) return; setImage(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(''); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1 });

  const detect = async () => {
    setLoading(true); setError('');
    try { const { data } = await detectDisease(image); setResult(data); }
    catch (err) {
      if (err.response?.status === 503) setError('Disease model not found. Place disease_model.pth in ml_models/.');
      else setError(err.response?.data?.detail || 'Detection failed.');
    } finally { setLoading(false); }
  };
  const reset = () => { setImage(null); setPreview(null); setResult(null); setError(''); };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-4xl mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Disease Detection</h1>
        <p className="text-[15px] font-light" style={{ color: 'var(--text-2)' }}>Upload a leaf photo — ResNet18 CNN diagnoses across 38 plant diseases.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        <motion.div className="rounded-[22px] p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Upload Leaf Image</p>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl min-h-[200px] flex items-center justify-center cursor-pointer text-center p-6 transition-all duration-200 ${isDragActive ? 'border-green-500' : 'hover:border-green-500'}`}
            style={{ borderColor: isDragActive ? '#16a34a' : 'var(--border)', background: isDragActive ? '#f0fdf4' : 'var(--bg-muted)' }}>
            <input {...getInputProps()} />
            {preview ? <img src={preview} alt="Leaf" className="max-h-[200px] max-w-full rounded-[10px] object-contain" />
              : <div><span className="text-5xl block mb-2">🍃</span><p className="text-[14px]" style={{ color: 'var(--text-2)' }}>Drag & drop a leaf image</p><p className="text-[12px] mt-1" style={{ color: 'var(--text-3)' }}>or click to browse · JPG, PNG</p></div>}
          </div>
          <div className="flex gap-2 mt-3">
            {image && <button onClick={detect} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold text-white cursor-pointer" style={{ background: '#15803d' }}>
              {loading ? <><span className="spinner" />Analysing...</> : <><ScanLine size={15} />Detect Disease</>}</button>}
            {(image || result) && <button onClick={reset} className="w-11 h-11 flex items-center justify-center rounded-[10px] border cursor-pointer transition-all duration-200" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-2)' }}><RotateCcw size={14} /></button>}
          </div>
          {error && <p className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">{error}</p>}
          {!image && <p className="mt-3 text-[12px] p-3 rounded-[10px] border-l-4 border-green-500" style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}>Supports 38 diseases · tomato, potato, corn, grape & more. Requires <code>disease_model.pth</code> in <code>ml_models/</code>.</p>}
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div key="r" className="rounded-[22px] p-7 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div className="text-center pb-5 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold mb-3 ${result.is_healthy ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {result.is_healthy ? '✅ Healthy plant' : '⚠️ Disease detected'}
                </span>
                <div className="font-display font-bold text-lg mb-1" style={{ color: 'var(--text-1)' }}>{fmt(result.disease)}</div>
                <div className="text-sm mb-2" style={{ color: 'var(--text-3)' }}>Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                  <motion.div className="h-full rounded-full conf-fill" initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }} transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }} />
                </div>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Top 3 Predictions</p>
              {result.top_3.map((d, i) => (
                <motion.div key={i} className="flex items-center gap-2.5 mb-3" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <span className="text-[11px] flex-1 leading-snug" style={{ color: 'var(--text-2)' }}>{fmt(d.disease)}</span>
                  <div className="w-24 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${d.probability * 100}%` }} transition={{ duration: 0.55, delay: i * 0.08 }} style={{ background: i === 0 ? '#fbbf24' : '#94a3b8' }} />
                  </div>
                  <span className="text-[11px] w-9 text-right" style={{ color: 'var(--text-3)' }}>{(d.probability * 100).toFixed(1)}%</span>
                </motion.div>
              ))}
              {!result.is_healthy && <div className="mt-4 p-3 rounded-[10px] border-l-4 border-amber-400 bg-amber-50"><p className="text-[12px] text-amber-700">💊 Consult an agronomist for treatment specific to this disease and region.</p></div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}