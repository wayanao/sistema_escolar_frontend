export const construirMesesFinancieros = (ingresosMensuales, egresosMensuales) => {
  const egresosPorMes = new Map(egresosMensuales.map((item) => [item.mes, Number(item.total || 0)]));
  const meses = new Set([
    ...ingresosMensuales.map((item) => item.mes),
    ...egresosMensuales.map((item) => item.mes),
  ]);

  return Array.from(meses)
    .sort()
    .reverse()
    .map((mes) => {
      const ingreso = Number(ingresosMensuales.find((item) => item.mes === mes)?.total || 0);
      const egreso = egresosPorMes.get(mes) || 0;
      return {
        mes,
        ingreso,
        egreso,
        balance: ingreso - egreso,
        maximo: Math.max(ingreso, egreso, 1),
      };
    });
};
