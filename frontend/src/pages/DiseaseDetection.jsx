import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ScanLine, RotateCcw, ShieldAlert, CheckCircle2, BookOpen } from 'lucide-react';
import { detectDisease } from '../api';

const fmt = n => n.replace(/___/g, ' — ').replace(/_/g, ' ');

const DISEASE_INFO = {
  'Tomato___Early_blight': { treat: 'Apply copper-based fungicide. Remove infected leaves immediately.', prevent: 'Avoid overhead irrigation. Rotate crops yearly.' },
  'Tomato___Late_blight': { treat: 'Apply chlorothalonil or mancozeb fungicide urgently.', prevent: 'Plant resistant varieties. Ensure good air circulation.' },
  'Tomato___Leaf_Mold': { treat: 'Apply fungicide with chlorothalonil. Improve ventilation.', prevent: 'Reduce humidity. Space plants 60–90cm apart.' },
  'Potato___Early_blight': { treat: 'Spray mancozeb fungicide at first sign.', prevent: 'Use certified disease-free seed. Avoid wetting foliage.' },
  'Potato___Late_blight': { treat: 'Apply systemic fungicide immediately. Destroy infected plants.', prevent: 'Plant certified seeds. Avoid cool wet conditions.' },
  'Corn_(maize)___Common_rust_': { treat: 'Apply propiconazole fungicide at early rust stage.', prevent: 'Plant resistant hybrids. Early planting helps.' },
  'Grape___Black_rot': { treat: 'Apply captan or mancozeb before infection period.', prevent: 'Remove mummified berries. Prune for air circulation.' },
  'Apple___Apple_scab': { treat: 'Apply myclobutanil or captan after petal fall.', prevent: 'Rake and destroy fallen leaves. Plant scab-resistant varieties.' },
  'Tomato___Bacterial_spot': { treat: 'Copper-based bactericide spray. Remove infected tissue.', prevent: 'Use disease-free seed. Avoid overhead watering.' },
  'default': { treat: 'Consult your local agricultural extension officer for crop-specific treatment.', prevent: 'Practice crop rotation, maintain proper spacing, and avoid overwatering.' },
};

const SUPPORTED = [
  '🍅 Tomato (9 diseases)', '🥔 Potato (3 diseases)', '🌽 Maize (4 diseases)',
  '🍇 Grape (4 diseases)', '🍎 Apple (4 diseases)', '🍑 Peach (2 diseases)',
  '🫑 Bell Pepper (2)', '🍓 Strawberry (2)', '🫐 Blueberry, Raspberry, Soybean, Squash (healthy)',
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } };

export default function DiseaseDetection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const infoRef = useRef(null);
  const inView = useInView(infoRef, { once: true });

  const onDrop = useCallback(a => {
    const f = a[0]; if (!f) return;
    setImage(f); setPreview(URL.createObjectURL(f)); setResult(null); setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1
  });

  const detect = async () => {
    setLoading(true); setError('');
    try { const { data } = await detectDisease(image); setResult(data); }
    catch (err) {
      if (err.response?.status === 503) setError('Disease model not found. Place disease_model.pth in ml_models/.');
      else setError(err.response?.data?.detail || 'Detection failed. Is the backend running?');
    } finally { setLoading(false); }
  };

  const reset = () => { setImage(null); setPreview(null); setResult(null); setError(''); };

  const diseaseKey = result?.disease;
  const diseaseInfo = DISEASE_INFO[diseaseKey] || DISEASE_INFO.default;

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={22} color="#d97706" strokeWidth={2} />
          <h1 className="font-display font-extrabold text-4xl" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Disease Detection</h1>
        </div>
        <p className="text-[15px] font-light ml-8" style={{ color: 'var(--text-2)' }}>
          Upload a leaf photo — ResNet18 CNN diagnoses 38 plant diseases in under 1 second.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Upload panel */}
        <motion.div className="rounded-[22px] p-7 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>Upload Leaf Image</p>

          <div {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl min-h-[200px] flex items-center justify-center cursor-pointer text-center p-6 transition-all duration-200`}
            style={{
              borderColor: isDragActive ? '#16a34a' : 'var(--border)',
              background: isDragActive ? 'rgba(22,163,74,0.04)' : 'var(--bg-muted)',
            }}>
            <input {...getInputProps()} />
            {preview
              ? <img src={preview} alt="Leaf" className="max-h-[200px] max-w-full rounded-[10px] object-contain" />
              : (
                <motion.div animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}>
                  <div className="text-5xl mb-2">🍃</div>
                  <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                    {isDragActive ? 'Drop the leaf image here...' : 'Drag & drop a leaf image'}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>or click to browse · JPG, PNG supported</p>
                </motion.div>
              )
            }
          </div>

          <div className="flex gap-2 mt-3">
            {image && (
              <motion.button onClick={detect} disabled={loading} whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold text-white cursor-pointer"
                style={{ background: '#15803d' }}>
                {loading ? <><span className="spinner" />Analysing...</> : <><ScanLine size={15} />Detect Disease</>}
              </motion.button>
            )}
            {(image || result) && (
              <button onClick={reset}
                className="w-11 h-11 flex items-center justify-center rounded-[10px] border cursor-pointer transition-all duration-200"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)', color: 'var(--text-2)' }}>
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 text-sm p-3 rounded-[10px] border-l-4 border-red-500 bg-red-50 text-red-700">
              {error}
            </motion.p>
          )}

          {/* Supported plants */}
          {!image && (
            <motion.div className="mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} color="#16a34a" />
                <p className="text-[11px] font-bold uppercase tracking-widest font-display" style={{ color: 'var(--text-3)' }}>Supported plants</p>
              </div>
              <div className="flex flex-col gap-1">
                {SUPPORTED.map(s => (
                  <div key={s} className="text-[12px] px-2 py-1 rounded-lg" style={{ color: 'var(--text-2)', background: 'var(--bg-muted)' }}>{s}</div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Result panel */}
        <div>
          <AnimatePresence>
            {!result && !loading && (
              <motion.div key="empty" className="rounded-[22px] p-8 border text-center"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-5xl mb-3">🔬</div>
                <p className="text-sm font-light" style={{ color: 'var(--text-3)' }}>
                  Upload a clear photo of a single leaf.<br />
                  <strong style={{ color: 'var(--text-2)' }}>Best results:</strong> natural light, leaf filling the frame.
                </p>
              </motion.div>
            )}

            {result && (
              <motion.div key="result" className="rounded-[22px] p-7 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)', boxShadow: 'var(--shadow-sm)' }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>

                {/* Status */}
                <div className="text-center pb-5 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 20 }}>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold mb-3 ${result.is_healthy ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {result.is_healthy ? '✅ Healthy plant' : '⚠️ Disease detected'}
                    </span>
                  </motion.div>
                  <div className="font-display font-bold text-lg mb-1" style={{ color: 'var(--text-1)' }}>{fmt(result.disease)}</div>
                  <div className="text-sm mb-2" style={{ color: 'var(--text-3)' }}>Confidence: {(result.confidence * 100).toFixed(1)}%</div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <motion.div className="h-full rounded-full conf-fill"
                      initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }} />
                  </div>
                </div>

                {/* Top 3 */}
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3 font-display" style={{ color: 'var(--text-3)' }}>Top 3 predictions</p>
                {result.top_3.map((d, i) => (
                  <motion.div key={i} className="flex items-center gap-2.5 mb-3"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <span className="text-[11px] flex-1 leading-snug" style={{ color: 'var(--text-2)' }}>{fmt(d.disease)}</span>
                    <div className="w-24 h-2 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${d.probability * 100}%` }}
                        transition={{ duration: 0.55, delay: i * 0.08 }}
                        style={{ background: i === 0 ? '#fbbf24' : '#94a3b8' }} />
                    </div>
                    <span className="text-[11px] w-9 text-right" style={{ color: 'var(--text-3)' }}>
                      {(d.probability * 100).toFixed(1)}%
                    </span>
                  </motion.div>
                ))}

                {/* Treatment & prevention */}
                {!result.is_healthy && (
                  <motion.div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="flex flex-col gap-3">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', borderLeft: '2px solid #ef4444' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldAlert size={12} color="#ef4444" />
                          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#dc2626' }}>Treatment</span>
                        </div>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{diseaseInfo.treat}</p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(22,163,74,0.06)', borderLeft: '2px solid #16a34a' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 size={12} color="#16a34a" />
                          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#15803d' }}>Prevention</span>
                        </div>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{diseaseInfo.prevent}</p>
                      </div>
                    </div>
                    <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--text-3)' }}>
                      ⚠️ Consult a local agronomist for region-specific guidance.
                    </p>
                  </motion.div>
                )}

                {result.is_healthy && (
                  <motion.div className="mt-4 p-3 rounded-xl text-center"
                    style={{ background: 'rgba(22,163,74,0.06)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <p className="text-[13px]" style={{ color: '#15803d' }}>
                      🎉 Your plant looks healthy! Keep monitoring weekly for early detection.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* How it works */}
      <motion.div ref={infoRef} className="rounded-[22px] p-7 border mt-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
        initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-3)' }}>How does the AI detect diseases?</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '📸', title: 'Reads the leaf image', desc: 'ResNet18 CNN processes your photo as a 224×224 pixel grid, identifying colour patterns, spots and texture.' },
            { icon: '🧬', title: 'Matches 38 disease patterns', desc: 'Trained on 54,000+ PlantVillage images, the model compares your leaf to known disease signatures.' },
            { icon: '📊', title: 'Returns confidence score', desc: 'The top predicted disease comes with a confidence % — above 85% is generally reliable for diagnosis.' },
          ].map((s, i) => (
            <motion.div key={s.title} className="p-4 rounded-2xl" style={{ background: 'var(--bg-muted)' }}
              initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}>
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