import api from "../utils/api";

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); sin él, la llamada a `api` es la de siempre, con un
// solo argumento. Guardar no lo necesita: cada concepto ya es de un año.
const getConAnio = (url, parametrosAnio) =>
    parametrosAnio ? api.get(url, { params: parametrosAnio }) : api.get(url);

export const obtenerResumenCarteraVencida = async ({ parametrosAnio } = {}) => {
    const response = await getConAnio("/cartera/mora/resumen", parametrosAnio);
    return response.data;
};

export const obtenerDetalleCarteraVencida = async ({ parametrosAnio } = {}) => {
    const response = await getConAnio("/cartera/mora", parametrosAnio);
    return response.data;
};

export const obtenerTiposPagoDetallados = async ({ parametrosAnio } = {}) => {
    const response = await getConAnio("/tipos-pagos/detallado", parametrosAnio);
    return response.data;
};

export const obtenerTiposPago = async ({ parametrosAnio } = {}) => {
    const response = await getConAnio("/tipos-pagos", parametrosAnio);
    return response.data;
};

// Los cursos a los que se les pone precio: los del mismo año del concepto (el
// backend rechaza un curso de otro año).
export const obtenerCursosParaTiposPago = async ({ parametrosAnio } = {}) => {
    const response = await getConAnio("/cursos", parametrosAnio);
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
