import api from "../utils/api";

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); sin él, la petición es la de siempre.
export async function listarHorariosAdmin({ signal, parametrosAnio } = {}) {
    const opciones = {};
    if (parametrosAnio) opciones.params = parametrosAnio;
    if (signal) opciones.signal = signal;

    const response = Object.keys(opciones).length > 0
        ? await api.get("/hora/horarios-admin", opciones)
        : await api.get("/hora/horarios-admin");
    const { data } = response;
    return data;
}
