import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticion: la sesion principal viaja en cookie HttpOnly.
// Authorization queda solo como fallback para cookies no HttpOnly en desarrollo.
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ────────────────────────────────────────────────────────────────────────────
//  Interceptor de Respuesta  →  manejo global de 401
// ────────────────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      Cookies.remove('token');
      localStorage.removeItem('super_admin');
      localStorage.removeItem('usuario');
      localStorage.removeItem('profesor');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
