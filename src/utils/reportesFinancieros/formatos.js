// Fecha local (no UTC) del instante actual, compensando el desfase horario
// antes de convertir a ISO. Mismo criterio que src/utils/pagos/formatos.js
// (obtenerFechaLocal), para que "hoy" coincida con el día calendario del
// usuario y no con el día en UTC.
export const hoyISO = () => {
  const ahora = new Date();
  const offsetMs = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - offsetMs).toISOString().split("T")[0];
};

export const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// Construye y formatea en UTC explícito para que el mes mostrado no dependa
// de la zona horaria del navegador. Mismo criterio que
// src/utils/pagos/formatos.js (formatearPeriodo). No capitaliza: la página
// aplica la clase visual `capitalize` sobre el resultado.
export const nombreMes = (mes) => {
  const [anio, mesNumero] = mes.split("-").map(Number);
  return new Date(Date.UTC(anio, mesNumero - 1, 1)).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
};

export const finDeMesISO = (mes) => {
  const [year, month] = mes.split("-").map(Number);
  const ultimoDia = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};
