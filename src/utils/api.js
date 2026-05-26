import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ────────────────────────────────────────────────────────────────────────────
//  Interceptor de Petición  →  inyecta Authorization + X-Tenant-ID
// ────────────────────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // 1. JWT ─ recuperar de cookie. En produccion debe ser HttpOnly y viajar
    // automaticamente con withCredentials; este fallback conserva compatibilidad
    // con cookies no HttpOnly usadas en desarrollo.
    const token = Cookies.get('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Tenant ─ leer del localStorage e inyectar como header dedicado.
    //    El backend lo usa como referencia para apuntar al schema de BD correcto.
    //    Fuente de verdad sigue siendo el JWT (firmado); este header es explícito.
    const tenant = localStorage.getItem('tenant');
    if (tenant) {
      config.headers['X-Tenant-ID'] = tenant;
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
      localStorage.removeItem('usuario');
      localStorage.removeItem('profesor');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
