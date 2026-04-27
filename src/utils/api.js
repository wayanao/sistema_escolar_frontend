import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ────────────────────────────────────────────────────────────────────────────
//  Interceptor de Petición  →  inyecta Authorization + X-Tenant-ID
// ────────────────────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // 1. JWT ─ recuperar de cookie (prioridad) o localStorage (fallback para dev)
    let token = Cookies.get('token');

    if (!token) {
      const raw =
        localStorage.getItem('usuario') || localStorage.getItem('profesor');
      if (raw) {
        try {
          const userData = JSON.parse(raw);
          if (userData?.access_token) {
            token = userData.access_token;
            Cookies.set('token', token, { expires: 1 });
          }
        } catch (_) {
          // ignorar JSON malformado
        }
      }
    }

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
