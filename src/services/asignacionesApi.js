import api from "../utils/api";

function getConOpciones(url, { params, signal } = {}) {
    const opciones = {};
    if (params) opciones.params = params;
    if (signal) opciones.signal = signal;
    return Object.keys(opciones).length > 0 ? api.get(url, opciones) : api.get(url);
}

export async function listarProfesoresAsignacion({ signal } = {}) {
    const { data } = await getConOpciones("/profesores", { signal });
    return data;
}

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); sin él, cada petición es la de siempre.
export async function listarCursosAsignacion({ signal, parametrosAnio } = {}) {
    const { data } = await getConOpciones("/cursos", { params: parametrosAnio, signal });
    return data;
}

export async function listarMateriasAsignacion({ signal } = {}) {
    const { data } = await getConOpciones("/materias", { signal });
    return data;
}

export async function listarAsignaciones({ signal, parametrosAnio } = {}) {
    const { data } = await getConOpciones("/asignaciones/lista", {
        params: parametrosAnio,
        signal,
    });
    return data;
}

export async function obtenerDisponibilidadProfesor(
    profesorId,
    params,
    { signal, parametrosAnio } = {},
) {
    const { data } = await getConOpciones(
        `/profesores/${profesorId}/disponibilidad`,
        { params: parametrosAnio ? { ...params, ...parametrosAnio } : params, signal },
    );
    return data;
}

export async function crearAsignacion(payload) {
    const { data } = await api.post("/asignaciones", payload);
    return data;
}

export async function actualizarAsignacion(asignacionId, payload) {
    const { data } = await api.put(`/asignaciones/${asignacionId}`, payload);
    return data;
}

export async function desactivarAsignacion(asignacionId) {
    const { data } = await api.delete(`/asignaciones/${asignacionId}`);
    return data;
}
