import {
  ROL_ADMIN,
  ROL_SUPER_ADMIN,
  RUTAS_SESION,
} from "./sesion";

export const CLAVE_ULTIMO_CODIGO_COLEGIO = "ultimo_codigo_colegio";

export function normalizarCodigoColegio(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

export function normalizarCodigoColegioRecordado(valor) {
  const codigo = normalizarCodigoColegio(valor);
  return codigo === "demo" ? "" : codigo;
}

export function estanCompletasLasCredenciales({ email, password, codigoColegio }) {
  return Boolean(email && password && normalizarCodigoColegio(codigoColegio));
}

export function construirPayloadLogin({ email, password, codigoColegio }) {
  return {
    email,
    password,
    codigo_colegio: normalizarCodigoColegio(codigoColegio),
  };
}

export function capitalizarNombreVisible(valor) {
  return String(valor || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (palabra) =>
        palabra.charAt(0).toLocaleUpperCase("es-CO") +
        palabra.slice(1).toLocaleLowerCase("es-CO"),
    )
    .join(" ");
}

export function obtenerRutaDespuesDeLogin(data) {
  if (data.rol === ROL_SUPER_ADMIN) return RUTAS_SESION.INICIO_SUPER_ADMIN;
  if (data.rol === ROL_ADMIN && data.debe_cambiar_password) {
    return RUTAS_SESION.CAMBIAR_PASSWORD;
  }
  if (data.rol === ROL_ADMIN) return RUTAS_SESION.INICIO_ADMIN;
  return RUTAS_SESION.INICIO_PROFESOR;
}
