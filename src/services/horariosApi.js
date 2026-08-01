import api from "../utils/api";

export async function listarHorariosAdmin({ signal } = {}) {
    const response = signal
        ? await api.get("/hora/horarios-admin", { signal })
        : await api.get("/hora/horarios-admin");
    const { data } = response;
    return data;
}
