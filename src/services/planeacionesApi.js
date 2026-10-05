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
