export const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia", "subsidio"];

export const crearPagoInicial = (estudianteId = "", fecha) => ({
  estudiante_id: estudianteId,
  descripcion: "",
  fecha,
  monto: "",
  venta_id: null,
  metodos: [],
  tipo_pago_id_adelanto: "",
  cantidad_meses: 1,
  modalidad_adelanto: "meses",
  monto_distribuir: "",
  aplicaciones: [],
});

export const crearValorPersonalizadoInicial = () => ({
  tipo_pago_id: "",
  valor: "",
  motivo: "",
});

export const normalizarTiposPagos = (tiposPagos) =>
  Array.isArray(tiposPagos)
    ? tiposPagos.filter((tipoPago) => tipoPago.activo !== false)
    : [];

export const normalizarOpcionesVencidas = (opciones) =>
  Array.isArray(opciones) ? opciones : [];

export const normalizarOpcionesAdelanto = (opciones) =>
  (Array.isArray(opciones) ? opciones : []).map((opcion) => {
    const periodos = (opcion.periodos_disponibles || []).map((periodo) => ({
      ...periodo,
      saldo: Number(periodo.saldo ?? opcion.valor_unitario ?? 0),
      estado: periodo.estado || "disponible",
    }));
    return {
      ...opcion,
      periodos_disponibles: periodos,
      total_disponible: Number(
        opcion.total_disponible ??
        periodos.reduce((total, periodo) => total + periodo.saldo, 0)
      ),
    };
  });

export const crearPayloadPagoNormal = (pagoData, estudianteId) => {
  const payload = {
    ...pagoData,
    estudiante_id: pagoData.estudiante_id || estudianteId,
  };
  delete payload.tipo_pago_id_adelanto;
  delete payload.cantidad_meses;
  delete payload.modalidad_adelanto;
  delete payload.monto_distribuir;
  payload.aplicaciones = (payload.aplicaciones || []).map((aplicacion) => ({
    ...aplicacion,
    tipo_pago_id: Number(aplicacion.tipo_pago_id),
    monto: Number(aplicacion.monto),
  }));
  if (payload.aplicaciones.length === 0) delete payload.aplicaciones;
  if (!payload.venta_id) delete payload.venta_id;
  return payload;
};

export const crearPayloadPagoAdelantado = (
  pagoData,
  estudianteId,
  esDistribucionAdelanto
) => ({
  estudiante_id: estudianteId,
  tipo_pago_id: Number(pagoData.tipo_pago_id_adelanto),
  ...(esDistribucionAdelanto
    ? { monto_distribuir: Number(pagoData.monto_distribuir) }
    : { cantidad_meses: Number(pagoData.cantidad_meses) }),
  fecha: pagoData.fecha,
  metodos: pagoData.metodos.map((metodo) => ({
    ...metodo,
    monto: Number(metodo.monto),
  })),
});
