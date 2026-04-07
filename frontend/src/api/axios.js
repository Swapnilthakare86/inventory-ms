import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });
export const MICRO = axios.create({ baseURL: import.meta.env.VITE_MICRO_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login only when authentication is invalid or expired.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || '').toLowerCase();
    const isAuthRoute = error.config?.url?.includes('/auth/');
    const shouldLogout =
      status === 401 ||
      (status === 403 && (message.includes('invalid token') || message.includes('token')));

    if (shouldLogout && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default API;
