export const TIPO_ERROR_CAMBIO_PASSWORD = Object.freeze({
  DEBIL: "debil",
  CONFIRMACION: "confirmacion",
  REUTILIZADA: "reutilizada",
});

export function obtenerRequisitosPasswordFaltantes(valor) {
  const password = valor || "";
  const requisitos = [];
  if (password.length < 10) requisitos.push("minimo 10 caracteres");
  if (!/[A-Z]/.test(password)) requisitos.push("una mayuscula");
  if (!/[a-z]/.test(password)) requisitos.push("una minuscula");
  if (!/[0-9]/.test(password)) requisitos.push("un numero");
  return requisitos;
}

export function validarCambioPassword({ passwordActual, passwordNueva, confirmacion }) {
  const requisitos = obtenerRequisitosPasswordFaltantes(passwordNueva);
  if (requisitos.length) {
    return { tipo: TIPO_ERROR_CAMBIO_PASSWORD.DEBIL, requisitos };
  }
  if (passwordNueva !== confirmacion) {
    return { tipo: TIPO_ERROR_CAMBIO_PASSWORD.CONFIRMACION };
  }
  if (passwordActual === passwordNueva) {
    return { tipo: TIPO_ERROR_CAMBIO_PASSWORD.REUTILIZADA };
  }
  return null;
}

export function construirPayloadCambioPassword({ passwordActual, passwordNueva }) {
  return {
    password_actual: passwordActual,
    password_nueva: passwordNueva,
  };
}
