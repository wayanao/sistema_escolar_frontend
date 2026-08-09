export const ROL_ADMIN = "admin";
export const ROL_SUPER_ADMIN = "super_admin";

export const CLAVES_SESION = Object.freeze({
  SUPER_ADMIN: "super_admin",
  USUARIO: "usuario",
  PROFESOR: "profesor",
  TENANT_LEGACY: "tenant",
  ASIGNACION_ID: "asignacionId",
  PERIODO: "periodo",
});

export const RUTAS_SESION = Object.freeze({
  LOGIN: "/login",
  CAMBIAR_PASSWORD: "/cambiar-password",
  INICIO_ADMIN: "/dashboard-admin",
  INICIO_PROFESOR: "/",
  INICIO_SUPER_ADMIN: "/super-admin",
});

export const CLAVES_IDENTIDAD_SESION = Object.freeze([
  CLAVES_SESION.SUPER_ADMIN,
  CLAVES_SESION.USUARIO,
  CLAVES_SESION.PROFESOR,
]);

export const CLAVES_LIMPIEZA_LOGOUT = Object.freeze([
  CLAVES_SESION.PROFESOR,
  CLAVES_SESION.USUARIO,
  CLAVES_SESION.SUPER_ADMIN,
  CLAVES_SESION.TENANT_LEGACY,
  CLAVES_SESION.ASIGNACION_ID,
  CLAVES_SESION.PERIODO,
]);

export const CLAVES_LIMPIEZA_401 = Object.freeze([
  CLAVES_SESION.SUPER_ADMIN,
  CLAVES_SESION.USUARIO,
  CLAVES_SESION.PROFESOR,
  CLAVES_SESION.TENANT_LEGACY,
]);

export const COOKIE_TOKEN = "token";
export const COOKIE_TOKEN_EXPIRADA =
  "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

export function parsearSesionAlmacenada(valor) {
  return JSON.parse(valor || "null");
}

export function construirSesionVisual(data) {
  return {
    id: data.id,
    nombre: data.nombre,
    rol: data.rol,
    tenant: data.tenant,
    debe_cambiar_password: Boolean(data.debe_cambiar_password),
  };
}

export function marcarPasswordComoCambiada(usuario) {
  return usuario
    ? { ...usuario, debe_cambiar_password: false }
    : usuario;
}

export function obtenerClaveIdentidadPorRol(rol) {
  if (rol === ROL_SUPER_ADMIN) return CLAVES_SESION.SUPER_ADMIN;
  if (rol === ROL_ADMIN) return CLAVES_SESION.USUARIO;
  return CLAVES_SESION.PROFESOR;
}

export function obtenerClavesIdentidadAlternas(rol) {
  const claveActiva = obtenerClaveIdentidadPorRol(rol);
  return CLAVES_IDENTIDAD_SESION.filter((clave) => clave !== claveActiva);
}

export function esUsuarioAdmin(usuario) {
  return Boolean(usuario && usuario.rol === ROL_ADMIN);
}

export function esSuperAdmin(superAdmin) {
  return Boolean(superAdmin && superAdmin.rol === ROL_SUPER_ADMIN);
}

export function haySesionGeneral(usuario, profesor) {
  return Boolean(usuario || profesor);
}

export function obtenerRedireccionRutaProtegida({ usuario, profesor }) {
  if (usuario?.debe_cambiar_password) return RUTAS_SESION.CAMBIAR_PASSWORD;
  return haySesionGeneral(usuario, profesor) ? null : RUTAS_SESION.LOGIN;
}

export function obtenerRedireccionRutaAdmin(usuario) {
  if (usuario?.debe_cambiar_password) return RUTAS_SESION.CAMBIAR_PASSWORD;
  return esUsuarioAdmin(usuario) ? null : RUTAS_SESION.LOGIN;
}

export function obtenerRedireccionCambioPassword(usuario) {
  if (!esUsuarioAdmin(usuario)) return RUTAS_SESION.LOGIN;
  return usuario.debe_cambiar_password ? null : RUTAS_SESION.INICIO_ADMIN;
}

export function obtenerRedireccionSuperAdmin(superAdmin) {
  return esSuperAdmin(superAdmin) ? null : RUTAS_SESION.LOGIN;
}

export function debeLimpiarSesionPor401(status, pathname) {
  return status === 401 && pathname !== RUTAS_SESION.LOGIN;
}
