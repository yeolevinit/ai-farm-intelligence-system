import axios from 'axios';

// Production backend URL - hardcoded as reliable fallback
const RENDER_URL = 'https://ai-farm-backend-n8gm.onrender.com';

const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : window.location.hostname === 'localhost'
    ? '/api'
    : `${RENDER_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

export const predictCrop = (data) => api.post('/predict_crop', data);
export const predictYield = (data) => api.post('/predict_yield', data);

export const detectDisease = (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  return api.post('/detect_disease', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getWeather = (city) => api.get('/weather', { params: { city } });
export const explainPrediction = (modelType, features) =>
  api.post('/explain_prediction', { model_type: modelType, features });

export default api;