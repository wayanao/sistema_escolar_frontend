import api from "../utils/api";

export async function listarProfesores(estado, { signal } = {}) {
    const opciones = { params: { estado } };
    if (signal) opciones.signal = signal;

    const { data } = await api.get("/profesores", opciones);
    return data;
}

export async function crearProfesor(payload) {
    const { data } = await api.post("/profesores", payload);
    return data;
}

export async function actualizarProfesor(profesorId, payload) {
    const { data } = await api.put(`/profesores/${profesorId}`, payload);
    return data;
}

export async function cambiarEstadoProfesor(profesorId, estado) {
    const { data } = await api.patch(`/profesores/${profesorId}/estado`, { estado });
    return data;
}
