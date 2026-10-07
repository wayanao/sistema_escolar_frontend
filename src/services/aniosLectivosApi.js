import api from "../utils/api";

// Unico punto HTTP del año lectivo. En la fase 5 se suman crear el año,
// copiar cursos, matricular y activar. Devuelve los datos tal cual; quien los
// ordena es `utils/anioLectivo.js`, y quien decide mensajes, los hooks.
//
// El año no viaja en una cabecera ni en la sesion: cada lectura lo pide como
// `?anio_lectivo_id=`, y solo cuando se mira un año que no es el activo.

// `[{ id, anio, estado }]`, el mas reciente primero. El admin recibe todos
// los años; el profesor, solo el activo.
export async function listarAniosLectivos({ signal } = {}) {
  const { data } = signal
    ? await api.get("/anios-lectivos", { signal })
    : await api.get("/anios-lectivos");
  return data;
}

// El backend calcula N+1: el cliente no envía ni decide el número del año.
export async function crearAnioLectivo() {
  const { data } = await api.post("/anios-lectivos");
  return data;
}

export async function copiarConfiguracionAnio(anioLectivoId, opciones) {
  const { data } = await api.post(
    `/anios-lectivos/${anioLectivoId}/copiar-configuracion`,
    opciones,
  );
  return data;
}

export async function listarCandidatosMatricula(
  anioLectivoId,
  cursoOrigenId,
  { signal } = {},
) {
  const opciones = { params: { curso_origen_id: cursoOrigenId } };
  if (signal) opciones.signal = signal;
  const { data } = await api.get(
    `/anios-lectivos/${anioLectivoId}/matriculas/candidatos`,
    opciones,
  );
  return data;
}

export async function promoverEstudiantes(anioLectivoId, seleccion) {
  const { data } = await api.post(
    `/anios-lectivos/${anioLectivoId}/matriculas/promocion`,
    seleccion,
  );
  return data;
}

export async function crearEstudianteEnPreparacion(anioLectivoId, estudiante) {
  const { data } = await api.post(
    `/anios-lectivos/${anioLectivoId}/estudiantes`,
    estudiante,
  );
  return data;
}

export async function obtenerResumenAnio(anioLectivoId, { signal } = {}) {
  const url = `/anios-lectivos/${anioLectivoId}/resumen`;
  const { data } = signal
    ? await api.get(url, { signal })
    : await api.get(url);
  return data;
}
