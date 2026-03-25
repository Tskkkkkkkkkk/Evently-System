import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config._retryWithoutToken) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// On 401 (invalid/expired token), clear storage and retry once without token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retryWithoutToken) {
      original._retryWithoutToken = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete original.headers.Authorization;
      return api.request(original);
    }
    return Promise.reject(err);
  }
);

export const mediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = 'http://localhost:8000';
  return path.startsWith('/') ? base + path : base + '/' + path;
};

export default api;
