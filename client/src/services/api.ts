import axios from 'axios';

// Direct to backend in production to bypass Vercel's 4.5MB serverless proxy limit
const getBaseURL = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/api';
    }
  }
  return 'https://data-room-be.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dataroom_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's a file password challenge, do NOT log out the user!
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.code !== 'PASSWORD_REQUIRED' &&
      !error.response.data?.isProtected
    ) {
      localStorage.removeItem('dataroom_token');
      localStorage.removeItem('dataroom_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
