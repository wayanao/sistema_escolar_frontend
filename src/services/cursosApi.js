import api from "../utils/api";

export async function listarCursos(estado, { signal } = {}) {
    const opciones = { params: { estado } };
    if (signal) opciones.signal = signal;

    const { data } = await api.get("/cursos", opciones);
    return data;
}

export async function crearCurso(payload) {
    const { data } = await api.post("/cursos", payload);
    return data;
}

export async function actualizarCurso(cursoId, payload) {
    const { data } = await api.put(`/cursos/${cursoId}`, payload);
    return data;
}

export async function cambiarEstadoCurso(cursoId, estado) {
    const { data } = await api.patch(`/cursos/${cursoId}/estado`, { estado });
    return data;
}
