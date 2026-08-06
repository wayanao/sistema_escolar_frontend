import api from "../utils/api";

export const obtenerInventario = async (estado) => {
    const response = await api.get("/inventario", { params: { estado } });
    return response.data;
};

export const crearProductoInventario = async (payload) => {
    const response = await api.post("/inventario", payload);
    return { status: response.status, data: response.data };
};

export const actualizarProductoInventario = async (productoId, payload) => {
    const response = await api.put(`/inventario/${productoId}`, payload);
    return { status: response.status, data: response.data };
};

export const actualizarEstadoProductoInventario = async (productoId, estado) => {
    const response = await api.patch(`/inventario/${productoId}/estado`, { estado });
    return { status: response.status, data: response.data };
};

export const obtenerVentas = async () => {
    const response = await api.get("/api/ventas/");
    return response.data;
};

export const obtenerEstudiantesParaVentas = async () => {
    const response = await api.get("/estudiantes");
    return response.data;
};

export const registrarVenta = async (payload) => {
    const response = await api.post("/api/ventas/", payload);
    return response.data;
};

export const anularVenta = async (ventaId, payload) => {
    const response = await api.post(`/api/ventas/${ventaId}/anular`, payload);
    return response.data;
};
