import api from "../utils/api";

// Firmas guardadas para el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md).
// Única frontera HTTP del módulo. Todas responden `{imagen, actualizado_en}`:
// `imagen` es `data:image/png;base64,...` o `null` si no hay firma guardada.
//
// - `/firmas/institucional`: la del rector(a). Solo el admin, también para leer.
// - `/firmas/mia`: la del profesor de la sesión. Solo profesores; el servidor
//   usa siempre el id de la sesión, así que no se envía ninguno.

const RUTA_INSTITUCIONAL = "/firmas/institucional";
const RUTA_MIA = "/firmas/mia";

async function leer(ruta, signal) {
  const { data } = signal ? await api.get(ruta, { signal }) : await api.get(ruta);
  return data;
}

async function guardar(ruta, imagen) {
  const { data } = await api.put(ruta, { imagen });
  return data;
}

async function quitar(ruta) {
  const { data } = await api.delete(ruta);
  return data;
}

export function obtenerFirmaInstitucional({ signal } = {}) {
  return leer(RUTA_INSTITUCIONAL, signal);
}

export function guardarFirmaInstitucional(imagen) {
  return guardar(RUTA_INSTITUCIONAL, imagen);
}

export function quitarFirmaInstitucional() {
  return quitar(RUTA_INSTITUCIONAL);
}

export function obtenerMiFirma({ signal } = {}) {
  return leer(RUTA_MIA, signal);
}

export function guardarMiFirma(imagen) {
  return guardar(RUTA_MIA, imagen);
}

export function quitarMiFirma() {
  return quitar(RUTA_MIA);
}
