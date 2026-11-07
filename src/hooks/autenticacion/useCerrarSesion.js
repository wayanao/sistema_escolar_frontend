import { useNavigate } from "react-router-dom";
import { cerrarSesion as solicitarCierreSesion } from "../../services/autenticacionApi";
import {
  CLAVES_LIMPIEZA_LOGOUT,
  COOKIE_TOKEN_EXPIRADA,
  PREFIJOS_LIMPIEZA_LOGOUT,
  RUTAS_SESION,
} from "../../utils/autenticacion/sesion";

// Borra las claves que empiezan con alguno de los prefijos (los borradores).
// Si el navegador no deja leer el almacenamiento, no hay nada que borrar.
function borrarClavesConPrefijo(prefijos) {
  try {
    for (let indice = localStorage.length - 1; indice >= 0; indice -= 1) {
      const clave = localStorage.key(indice);
      if (clave && prefijos.some((prefijo) => clave.startsWith(prefijo))) {
        localStorage.removeItem(clave);
      }
    }
  } catch {
    // Sin acceso al almacenamiento tampoco quedaron borradores.
  }
}

export function useCerrarSesion() {
  const navigate = useNavigate();

  return async () => {
    try {
      await solicitarCierreSesion();
    } catch (error) {
      console.error("Error cerrando sesión", error);
    }

    CLAVES_LIMPIEZA_LOGOUT.forEach((clave) => localStorage.removeItem(clave));
    borrarClavesConPrefijo(PREFIJOS_LIMPIEZA_LOGOUT);
    document.cookie = COOKIE_TOKEN_EXPIRADA;
    navigate(RUTAS_SESION.LOGIN);
  };
}
