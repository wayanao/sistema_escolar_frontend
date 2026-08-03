import api from "../utils/api";

export const obtenerResumenCarteraVencida = async () => {
    const response = await api.get("/cartera/mora/resumen");
    return response.data;
};

export const obtenerDetalleCarteraVencida = async () => {
    const response = await api.get("/cartera/mora");
    return response.data;
};

export const obtenerTiposPagoDetallados = async () => {
    const response = await api.get("/tipos-pagos/detallado");
    return response.data;
};

export const obtenerTiposPago = async () => {
    const response = await api.get("/tipos-pagos");
    return response.data;
};

export const obtenerCursosParaTiposPago = async () => {
    const response = await api.get("/cursos");
    return response.data;
};

export const crearTipoPago = async (payload) => {
    const response = await api.post("/tipos-pagos", payload);
    return { status: response.status, data: response.data };
};

export const actualizarTipoPago = async (tipoPagoId, payload) => {
    const response = await api.put(`/tipos-pagos/${tipoPagoId}`, payload);
    return { status: response.status, data: response.data };
};

export const obtenerDetalleTipoPago = async (tipoPagoId) => {
    const response = await api.get(`/tipos-pagos/${tipoPagoId}/detalle`);
    return response.data;
};

export const actualizarConfiguracionTipoPago = async (tipoPagoId, payload) => {
    const response = await api.put(`/tipos-pagos/${tipoPagoId}/configuracion`, payload);
    return response.data;
};

export const actualizarCursosTipoPago = async (tipoPagoId, payload) => {
    const response = await api.put(`/tipos-pagos/${tipoPagoId}/cursos`, payload);
    return response.data;
};
