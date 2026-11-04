// "Lo que debe" del año que se cobra, con lo que ya mandó el backend: las
// deudas de `/estudiantes/:id/deudas` (solo trae conceptos con deuda), los
// cargos de inventario pendientes y los meses por pagar de cada concepto
// mensual. No calcula ninguna deuda: arma las filas y suma lo que se ve.
//
// Los meses salen de las opciones vencidas y no de `cuotas_vencidas`: ese
// campo cuenta todas las cuotas que ya vencieron, pagadas o no.
//
// Desde el 2026-11-04 este recuadro es la única forma de elegir qué cobrar,
// así que también trae los conceptos mensuales al día que se pueden adelantar
// (`conceptosAlDia`). No son deuda: no suman al total.
export function crearResumenDeuda({
  deudas = [],
  ventasPendientes = [],
  opcionesVencidas = [],
  conceptosAlDia = [],
} = {}) {
  const filasDeudas = deudas.map((deuda) => {
    const mensual = deuda.tipo_cobro === "mensual";
    const opcion = mensual
      ? opcionesVencidas.find(
          (item) => Number(item.tipo_pago_id) === Number(deuda.concepto_id)
        )
      : null;
    return {
      clave: `concepto-${deuda.concepto_id ?? deuda.concepto}`,
      nombre: deuda.concepto,
      monto: Number(deuda.deuda || 0),
      mesesPendientes: opcion?.cuotas?.length ?? 0,
      abonado: mensual ? 0 : Number(deuda.pagado || 0),
      mora: Number(deuda.mora || 0),
      valorPersonalizado: deuda.valor_personalizado === true,
      inventario: false,
      alDia: false,
      cobro: { concepto: deuda.concepto },
    };
  });

  const filasVentas = ventasPendientes.map((venta) => ({
    clave: `venta-${venta.id}`,
    nombre: venta.descripcion,
    monto: Number(venta.total || 0),
    mesesPendientes: 0,
    abonado: 0,
    mora: 0,
    valorPersonalizado: false,
    inventario: true,
    alDia: false,
    cobro: { ventaId: venta.id },
  }));

  const filasAlDia = conceptosAlDia.map((opcion) => ({
    clave: `adelanto-${opcion.tipo_pago_id}`,
    nombre: opcion.concepto,
    alDia: true,
    valorMes: Number(opcion.valor_unitario || 0),
    mesesPorAdelantar: Number(opcion.max_meses || 0),
    cobro: { concepto: opcion.concepto },
  }));

  const filasConDeuda = [...filasDeudas, ...filasVentas];
  // En centavos, como la distribución de adelantos, para no arrastrar decimales.
  const totalCentavos = filasConDeuda.reduce(
    (suma, fila) => suma + Math.round(fila.monto * 100),
    0
  );
  return { filas: [...filasConDeuda, ...filasAlDia], total: totalCentavos / 100 };
}
