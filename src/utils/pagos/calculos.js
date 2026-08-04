export const distribuirMontoEnPeriodos = (periodos = [], monto = 0) => {
  let restante = Math.max(0, Math.round(Number(monto || 0) * 100));
  const distribucion = [];
  for (const periodo of periodos) {
    if (restante <= 0) break;
    const saldo = Math.max(0, Math.round(Number(periodo.saldo || 0) * 100));
    const aplicado = Math.min(restante, saldo);
    if (aplicado <= 0) continue;
    distribucion.push({
      ...periodo,
      monto_aplicado: aplicado / 100,
      saldo_restante: (saldo - aplicado) / 100,
    });
    restante -= aplicado;
  }
  return { distribucion, sinDistribuir: restante / 100 };
};

export const crearAplicacionesCuotas = (opcion, periodos = []) => {
  const seleccionadas = (opcion?.cuotas || []).filter((cuota) =>
    periodos.includes(cuota.periodo)
  );
  const aplicaciones = seleccionadas.map((cuota) => ({
    tipo_pago_id: Number(opcion.tipo_pago_id),
    periodo: cuota.periodo,
    monto: Number(cuota.saldo || 0),
  }));
  const total = aplicaciones.reduce((acumulado, item) => acumulado + item.monto, 0);
  return { aplicaciones, total };
};

export const calcularTotalPeriodos = (periodos = [], cantidad) =>
  periodos
    .slice(0, Number(cantidad))
    .reduce((acumulado, periodo) => acumulado + Number(periodo.saldo || 0), 0);

export const crearPeriodosAdelantoPorCantidad = (periodos = [], cantidad) =>
  periodos.slice(0, Number(cantidad || 0)).map((periodo) => ({
    ...periodo,
    monto_aplicado: Number(periodo.saldo || 0),
    saldo_restante: 0,
  }));
