// "Lo que debe" del año que se cobra, con lo que ya mandó el backend: las
// deudas de `/estudiantes/:id/deudas` (solo trae conceptos con deuda), los
// cargos de inventario pendientes y los meses por pagar de cada concepto
// mensual. No calcula ninguna deuda: arma las filas y suma lo que se ve.
//
// Los meses salen de las opciones vencidas y no de `cuotas_vencidas`: ese
// campo cuenta todas las cuotas que ya vencieron, pagadas o no.
export function crearResumenDeuda({
  deudas = [],
  ventasPendientes = [],
  opcionesVencidas = [],
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
    cobro: { ventaId: venta.id },
  }));

  const filas = [...filasDeudas, ...filasVentas];
  // En centavos, como la distribución de adelantos, para no arrastrar decimales.
  const totalCentavos = filas.reduce(
    (suma, fila) => suma + Math.round(fila.monto * 100),
    0
  );
  return { filas, total: totalCentavos / 100 };
}
