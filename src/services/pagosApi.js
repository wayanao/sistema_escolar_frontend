import api from "../utils/api";

const obtenerDatos = async (solicitud) => {
  const respuesta = await solicitud;
  return respuesta.data;
};

const pagosApi = {
  obtenerEstudiantes: () => obtenerDatos(api.get("/estudiantes")),

  obtenerTiposPagos: () => obtenerDatos(api.get("/tipos-pagos")),

  obtenerHistorialPagos: (estudianteId) =>
    obtenerDatos(api.get(`/pagos/${estudianteId}`)),

  obtenerDeudasEstudiante: (estudianteId) =>
    obtenerDatos(api.get(`/estudiantes/${estudianteId}/deudas`)),

  obtenerVentasPendientes: (estudianteId) =>
    obtenerDatos(api.get(`/api/ventas/pendientes/${estudianteId}`)),

  obtenerOpcionesVencidas: (estudianteId) =>
    obtenerDatos(api.get(`/pagos/vencidos/opciones/${estudianteId}`)),

  obtenerOpcionesAdelanto: (estudianteId) =>
    obtenerDatos(api.get(`/pagos/adelanto/opciones/${estudianteId}`)),

  obtenerCursos: () => obtenerDatos(api.get("/cursos")),

  obtenerValoresPersonalizados: (estudianteId) =>
    obtenerDatos(
      api.get(`/estudiantes/${estudianteId}/valores-pago-personalizados`)
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
