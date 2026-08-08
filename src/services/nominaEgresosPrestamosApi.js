import api from "../utils/api";

export const obtenerEmpleadosNomina = async () => {
    const response = await api.get("/api/nomina/empleados");
    return response.data;
};

export const obtenerHistorialNomina = async () => {
    const response = await api.get("/api/nomina/historial");
    return response.data;
};

export const registrarPagoNomina = async (payload) => {
    const response = await api.post("/api/nomina/pagar", payload);
    return response.data;
};

export const obtenerEgresos = async (params) => {
    const response = await api.get("/api/egresos/", { params });
    return response.data;
};

export const crearEgreso = async (payload) => {
    const response = await api.post("/api/egresos/", payload);
    return response.data;
};

export const actualizarEgreso = async (egresoId, payload) => {
    const response = await api.put(`/api/egresos/${egresoId}`, payload);
    return response.data;
};

export const obtenerPrestamos = async (params) => {
    const response = await api.get("/api/prestamos/", { params });
    return response.data;
};

export const crearPrestamo = async (payload) => {
    const response = await api.post("/api/prestamos/", payload);
    return response.data;
};

export const actualizarEstadoPrestamo = async (prestamoId, estado) => {
    const response = await api.put(`/api/prestamos/${prestamoId}/estado`, { estado });
    return response.data;
};

export const obtenerProfesoresParaPrestamos = async () => {
    const response = await api.get("/profesores");
    return response.data;
};
