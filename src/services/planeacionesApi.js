import api from "../utils/api";

export async function listarNotificacionesPlaneadores(limit) {
  const { data } = await api.get("/notificaciones/planeadores", {
    params: { limit },
  });
  return data;
}

export async function descargarImagenPlaneacion(path) {
  const { data } = await api.get(path, { responseType: "blob" });
  return data;
}

export async function listarClasesProfesor(profesorId) {
  const { data } = await api.get(`/mis-clases/${profesorId}`);
  return data;
}

export async function obtenerPlanProfesor(asignacionId, fecha) {
  const { data } = await api.get(`/plan-de-clases/${asignacionId}`, {
    params: { fecha },
  });
  return data;
}

export async function listarHistorialPlanesProfesor(asignacionId, { limit, offset }) {
  const { data } = await api.get(`/plan-de-clases/${asignacionId}`, {
    params: { limit, offset },
  });
  return data;
}

export async function guardarPlanProfesor(formData) {
  const { data } = await api.post("/plan-de-clases", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function eliminarImagenPlanProfesor(planId, slot) {
  const { data } = await api.delete(`/plan-de-clases/${planId}/imagen`, {
    params: { slot },
  });
  return data;
}

export async function listarObservacionesPlan(planId) {
  const { data } = await api.get(`/plan-de-clases/${planId}/observaciones`);
  return data;
}

export async function marcarObservacionVista(planId, observacionId) {
  const { data } = await api.patch(
    `/plan-de-clases/${planId}/observaciones/${observacionId}/vista`,
  );
  return data;
}

// Año lectivo, fase 7 (paso 7.4): usar un plan del año pasado como base. Solo
// se manda la clase de este año (y el id del plan elegido); el origen lo
// encuentra el backend. El plan nuevo se guarda con `guardarPlanProfesor`.
export async function listarPlanesAnioAnterior(asignacionId) {
  const { data } = await api.get(`/plan-de-clases/${asignacionId}/anio-anterior`);
  return data;
}

export async function obtenerPlanAnioAnterior(asignacionId, planId) {
  const { data } = await api.get(`/plan-de-clases/${asignacionId}/anio-anterior/${planId}`);
  return data;
}

// Nombres de los cuadros del plan (docs/funcionalidades/NOMBRES_CUADROS_PLAN.md).
// Solo viajan los cuadros que el colegio renombró; los originales viven en
// `utils/planeaciones/cuadros.js`. Guardar manda la lista completa y la
// reemplaza: una lista vacía vuelve a los originales.
export async function obtenerCuadrosPlan() {
  const { data } = await api.get("/plan-de-clases/cuadros");
  return data;
}

export async function guardarCuadrosPlan(payload) {
  const { data } = await api.put("/admin/plan-de-clases/cuadros", payload);
  return data;
}

export async function listarProfesoresPlaneaciones() {
  const { data } = await api.get("/profesores");
  return data;
}

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); se suma a los filtros. Sin él, la petición es la de
// siempre. El detalle, la revisión y las evidencias parten del id del plan.
export async function listarPlaneacionesAdmin(params, { signal, parametrosAnio } = {}) {
  const { data } = await api.get("/admin/plan-de-clases", {
    params: parametrosAnio ? { ...params, ...parametrosAnio } : params,
    signal,
  });
  return data;
}

export async function obtenerPlaneacionAdmin(planId) {
  const { data } = await api.get(`/admin/plan-de-clases/${planId}`);
  return data;
}

export async function actualizarRevisionPlaneacionAdmin(planId, payload) {
  const { data } = await api.patch(
    `/admin/plan-de-clases/${planId}/revision`,
    payload,
  );
  return data;
}

export async function crearObservacionPlaneacionAdmin(planId, payload) {
  const { data } = await api.post(
    `/admin/plan-de-clases/${planId}/observaciones`,
    payload,
  );
  return data;
}

export async function eliminarImagenPlaneacionAdmin(planId, slot) {
  const { data } = await api.delete(`/admin/plan-de-clases/${planId}/imagen`, {
    params: { slot },
  });
  return data;
}
