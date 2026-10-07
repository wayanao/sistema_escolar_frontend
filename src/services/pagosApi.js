import api from "../utils/api";

const obtenerDatos = async (solicitud) => {
  const respuesta = await solicitud;
  return respuesta.data;
};

// El año solo viaja cuando el admin eligió uno distinto del activo. Sin él,
// `api.get` recibe exactamente los mismos argumentos que antes de 5.9.
const getConAnio = (url, parametrosAnio) =>
  parametrosAnio?.anio_lectivo_id
    ? api.get(url, { params: parametrosAnio })
    : api.get(url);

const pagosApi = {
  obtenerEstudiantes: () => obtenerDatos(api.get("/estudiantes")),

  obtenerTiposPagos: ({ parametrosAnio } = {}) =>
    obtenerDatos(getConAnio("/tipos-pagos", parametrosAnio)),

  obtenerHistorialPagos: (estudianteId) =>
    obtenerDatos(api.get(`/pagos/${estudianteId}`)),

  obtenerDeudasEstudiante: (estudianteId, { parametrosAnio } = {}) =>
    obtenerDatos(
      getConAnio(`/estudiantes/${estudianteId}/deudas`, parametrosAnio)
    ),

  obtenerVentasPendientes: (estudianteId) =>
    obtenerDatos(api.get(`/api/ventas/pendientes/${estudianteId}`)),

  obtenerOpcionesVencidas: (estudianteId, { parametrosAnio } = {}) =>
    obtenerDatos(
      getConAnio(`/pagos/vencidos/opciones/${estudianteId}`, parametrosAnio)
    ),

  obtenerOpcionesAdelanto: (estudianteId, { parametrosAnio } = {}) =>
    obtenerDatos(
      getConAnio(`/pagos/adelanto/opciones/${estudianteId}`, parametrosAnio)
    ),

  obtenerCursos: () => obtenerDatos(api.get("/cursos")),

  obtenerValoresPersonalizados: (estudianteId, { parametrosAnio } = {}) =>
    obtenerDatos(
      getConAnio(
        `/estudiantes/${estudianteId}/valores-pago-personalizados`,
        parametrosAnio
      )
    ),

  guardarValorPersonalizado: (estudianteId, tipoPagoId, payload) =>
    obtenerDatos(
      api.put(
        `/estudiantes/${estudianteId}/valores-pago-personalizados/${tipoPagoId}`,
        payload
      )
    ),

  quitarValorPersonalizado: (estudianteId, tipoPagoId) =>
    obtenerDatos(
      api.delete(
        `/estudiantes/${estudianteId}/valores-pago-personalizados/${tipoPagoId}`
      )
    ),

  registrarPago: (payload) => obtenerDatos(api.post("/pagos", payload)),

  registrarPagoAdelantado: (payload) =>
    obtenerDatos(api.post("/pagos/adelanto", payload)),

  anularPago: (pagoId, payload) =>
    obtenerDatos(api.post(`/pagos/${pagoId}/anular`, payload)),
};

export default pagosApi;
