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

// Paso 6.6: `{ estudiante_ids, estado_salida }`, con `estado_salida`
// "retirado", "egresado" o `null` para quitarla. El backend la guarda en la
// matrícula del año activo y rechaza a quien ya está matriculado en el
// siguiente.
export async function guardarDecisionSalida(anioLectivoId, decision) {
  const { data } = await api.put(
    `/anios-lectivos/${anioLectivoId}/matriculas/salida`,
    decision,
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

// Paso 6.7: cuántos siguen y salen, la lista de quienes faltan por decidir y
// `puede_activar`, que decide el backend. Solo lee.
export async function obtenerVistaPreviaActivacion(anioLectivoId, { signal } = {}) {
  const url = `/anios-lectivos/${anioLectivoId}/activacion/vista-previa`;
  const { data } = signal
    ? await api.get(url, { signal })
    : await api.get(url);
  return data;
}

// Paso 6.7: el año que escribió el admin viaja tal cual; el backend lo compara
// con el que se activa. Con pendientes responde 409 con su lista.
export async function activarAnioLectivo(anioLectivoId, confirmarAnio) {
  const { data } = await api.post(`/anios-lectivos/${anioLectivoId}/activar`, {
    confirmar_anio: confirmarAnio,
  });
  return data;
}

export async function obtenerResumenAnio(anioLectivoId, { signal } = {}) {
  const url = `/anios-lectivos/${anioLectivoId}/resumen`;
  const { data } = signal
    ? await api.get(url, { signal })
    : await api.get(url);
  return data;
}
