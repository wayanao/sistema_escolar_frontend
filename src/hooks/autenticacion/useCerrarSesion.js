import { useNavigate } from "react-router-dom";
import { cerrarSesion as solicitarCierreSesion } from "../../services/autenticacionApi";
import {
  CLAVES_LIMPIEZA_LOGOUT,
  COOKIE_TOKEN_EXPIRADA,
  RUTAS_SESION,
} from "../../utils/autenticacion/sesion";

export function useCerrarSesion() {
  const navigate = useNavigate();

  return async () => {
    try {
      await solicitarCierreSesion();
    } catch (error) {
      console.error("Error cerrando sesión", error);
    }

    CLAVES_LIMPIEZA_LOGOUT.forEach((clave) => localStorage.removeItem(clave));
    document.cookie = COOKIE_TOKEN_EXPIRADA;
    navigate(RUTAS_SESION.LOGIN);
  };
}
