import {
  CLAVES_SESION,
  esUsuarioAdmin,
  haySesionGeneral,
  obtenerRedireccionCambioPassword,
  obtenerRedireccionRutaAdmin,
  obtenerRedireccionRutaProtegida,
  obtenerRedireccionSuperAdmin,
  parsearSesionAlmacenada,
} from "../../utils/autenticacion/sesion";

function leerSesion(clave) {
  return parsearSesionAlmacenada(localStorage.getItem(clave));
}

function leerSesionGeneral() {
  const usuario = leerSesion(CLAVES_SESION.USUARIO);
  const profesor = leerSesion(CLAVES_SESION.PROFESOR);
  return { usuario, profesor };
}

export function useEstadoSesionGeneral() {
  const { usuario, profesor } = leerSesionGeneral();

  return {
    haySesion: haySesionGeneral(usuario, profesor),
    esAdmin: esUsuarioAdmin(usuario),
  };
}

export function useRedireccionRutaProtegida() {
  return obtenerRedireccionRutaProtegida(leerSesionGeneral());
}

export function useRedireccionRutaAdmin() {
  return obtenerRedireccionRutaAdmin(leerSesion(CLAVES_SESION.USUARIO));
}

export function useRedireccionCambioPassword() {
  return obtenerRedireccionCambioPassword(leerSesion(CLAVES_SESION.USUARIO));
}

export function useRedireccionSuperAdmin() {
  return obtenerRedireccionSuperAdmin(
    leerSesion(CLAVES_SESION.SUPER_ADMIN),
  );
}

export function useSesionSuperAdmin() {
  return leerSesion(CLAVES_SESION.SUPER_ADMIN);
}

// Identidad visual del admin y del profesor (el nombre para la tarjeta del
// menú). Solo leen: los permisos los decide el backend.
export function useSesionUsuario() {
  return leerSesion(CLAVES_SESION.USUARIO);
}

export function useSesionProfesor() {
  return leerSesion(CLAVES_SESION.PROFESOR);
}
