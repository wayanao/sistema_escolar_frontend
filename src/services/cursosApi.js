import api from "../utils/api";

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); sin él, la petición es la de siempre.
export async function listarCursos(estado, { signal, parametrosAnio } = {}) {
    const opciones = { params: { estado, ...parametrosAnio } };
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
