export const obtenerFechaLocal = (ahora) => {
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

export const formatearMoneda = (valor) => `$${Number(valor || 0).toLocaleString()}`;

export const formatearPeriodo = (periodo) => {
  if (!periodo) return "";
  const [anio, mes] = periodo.split("-").map(Number);
  const etiqueta = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, 1)));
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
};
