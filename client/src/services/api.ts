import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
