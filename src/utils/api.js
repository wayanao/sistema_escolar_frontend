import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../config/env';
import {
  CLAVES_LIMPIEZA_401,
  COOKIE_TOKEN,
  RUTAS_SESION,
  debeLimpiarSesionPor401,
} from './autenticacion/sesion';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticion: la sesion principal viaja en cookie HttpOnly.
// Authorization queda solo como fallback para cookies no HttpOnly en desarrollo.
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get(COOKIE_TOKEN);

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
    if (debeLimpiarSesionPor401(error.response?.status, window.location.pathname)) {
      Cookies.remove(COOKIE_TOKEN);
      CLAVES_LIMPIEZA_401.forEach((clave) => localStorage.removeItem(clave));
      window.location.href = RUTAS_SESION.LOGIN;
    }
    return Promise.reject(error);
  },
);

export default api;
