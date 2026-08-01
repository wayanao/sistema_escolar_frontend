import api from "../utils/api";

export async function listarMaterias(estado, { signal } = {}) {
    const opciones = { params: { estado } };
    if (signal) opciones.signal = signal;

    const { data } = await api.get("/materias", opciones);
    return data;
}

export async function crearMateria(payload) {
    const { data } = await api.post("/materia", payload);
    return data;
}

export async function actualizarMateria(materiaId, payload) {
    const { data } = await api.put(`/materias/${materiaId}`, payload);
    return data;
}

export async function cambiarEstadoMateria(materiaId, estado) {
    const { data } = await api.patch(`/materias/${materiaId}/estado`, { estado });
    return data;
}
