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
    const mesFinalRecibido = Number(opcion.mes_final);
    const mesFinal = Number.isInteger(mesFinalRecibido) &&
      mesFinalRecibido >= 1 && mesFinalRecibido <= 12
      ? mesFinalRecibido
      : 12;
    const periodos = (opcion.periodos_disponibles || []).map((periodo) => ({
      ...periodo,
      saldo: Number(periodo.saldo ?? opcion.valor_unitario ?? 0),
      estado: periodo.estado || "disponible",
    }));
    return {
      ...opcion,
      mes_final: mesFinal,
      periodos_disponibles: periodos,
      total_disponible: Number(
        opcion.total_disponible ??
        periodos.reduce((total, periodo) => total + periodo.saldo, 0)
      ),
    };
  });

// Conceptos mensuales que se pueden adelantar y no tienen deuda: como
// `/deudas` solo trae los que deben algo, sin esto no habría dónde elegirlos
// para adelantar. Se relacionan por id, como las demás opciones.
export const conceptosAlDiaParaAdelantar = (opcionesAdelanto = [], deudas = []) =>
  opcionesAdelanto.filter(
    (opcion) =>
      !deudas.some((deuda) => Number(deuda.concepto_id) === Number(opcion.tipo_pago_id))
  );

// Los pagos que acaba de crear un registro. `POST /pagos` crea una fila por
// método de pago y devuelve un id o una lista de ids; `POST /pagos/adelanto`,
// un id. Siempre como lista de números, para encontrarlos en el historial.
export const idsDelPagoRegistrado = (resultado) => {
  const ids = resultado?.pago_id;
  return (Array.isArray(ids) ? ids : [ids])
    .filter((id) => id !== null && id !== undefined)
    .map(Number);
};

export const crearPayloadPagoNormal = (pagoData, estudianteId, anioLectivoId) => {
  const payload = {
    ...pagoData,
    estudiante_id: pagoData.estudiante_id || estudianteId,
    ...(anioLectivoId ? { anio_lectivo_id: anioLectivoId } : {}),
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
  esDistribucionAdelanto,
  anioLectivoId,
) => ({
  estudiante_id: estudianteId,
  ...(anioLectivoId ? { anio_lectivo_id: anioLectivoId } : {}),
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
