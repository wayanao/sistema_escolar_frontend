import api from "../utils/api";

// Unico punto HTTP del modulo. Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md
// y, para el contrato del backend, docs/API_CLIENT.md.
//
// Ninguna de estas funciones decide mensajes de UI: devuelven datos o lanzan.
// Quien traduce un 409 o un 422 en algo legible son los hooks.
//
// El tenant NO viaja aqui: lo resuelve el backend desde la cookie o el JWT.

const getConSignal = (url, signal) =>
  signal ? api.get(url, { signal }) : api.get(url);

export async function obtenerCursosListasSeguimiento({ signal } = {}) {
  const { data } = await getConSignal("/cursos", signal);
  return data;
}

export async function obtenerListaSeguimiento(cursoId, { signal } = {}) {
  const { data } = await getConSignal(`/listas-seguimiento/${cursoId}`, signal);
  return data;
}

export async function crearColumnaSeguimiento(cursoId, nombre, { signal } = {}) {
  const url = `/listas-seguimiento/${cursoId}/columnas`;
  const cuerpo = { nombre };
  const { data } = signal
    ? await api.post(url, cuerpo, { signal })
    : await api.post(url, cuerpo);
  return data;
}

export async function eliminarColumnaSeguimiento(cursoId, columnaId, { signal } = {}) {
  const url = `/listas-seguimiento/${cursoId}/columnas/${columnaId}`;
  const { data } = signal ? await api.delete(url, { signal }) : await api.delete(url);
  return data;
}

// `payload` es la lista pelada de celdas, el mismo formato que usa
// `POST /asistencia`. La arma `construirPayloadMarcas` en
// utils/listasSeguimiento/marcas.js, que garantiza que no lleve la misma celda
// dos veces: el backend rechaza el lote entero con 422 si eso pasa.
export async function guardarMarcasSeguimiento(cursoId, payload, { signal } = {}) {
  const url = `/listas-seguimiento/${cursoId}/marcas`;
  const { data } = signal
    ? await api.post(url, payload, { signal })
    : await api.post(url, payload);
  return data;
}
