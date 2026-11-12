// Quién firma por el colegio (el rector o la rectora): lo que se configura en
// Diseño de impresos → Identidad institucional (`configuracion_extra`).
//
// Lo usan los certificados (docs/funcionalidades/CERTIFICADOS_NUEVOS.md) y,
// desde el 2026-11-12, el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md).
// Vive aquí, y no en los utils de uno de los dos, para que los dos lean lo
// mismo: un módulo no importa los utils de otro.

/** Sin cargo configurado, la firma dice esto, como siempre. */
export const CARGO_FIRMANTE_POR_DEFECTO = "Director(a)";

/** `{ nombre, documento, cargo }`, sin espacios sobrantes; vacío lo que no
 * esté configurado, menos el cargo, que tiene su valor por defecto. */
export function firmanteInstitucional(branding) {
  const extra = branding?.configuracion_extra || {};
  const leer = (clave) => (typeof extra[clave] === "string" ? extra[clave].trim() : "");
  return {
    nombre: leer("firmante_nombre"),
    documento: leer("firmante_documento"),
    cargo: leer("firmante_cargo") || CARGO_FIRMANTE_POR_DEFECTO,
  };
}
