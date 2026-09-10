export const obtenerFechaLocal = (ahora) => {
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

export const formatearMoneda = (valor) => `$${Number(valor || 0).toLocaleString()}`;

const NOMBRES_MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const formatearNombreMes = (valor) => {
  const mesRecibido = Number(valor);
  const mes = Number.isInteger(mesRecibido) && mesRecibido >= 1 && mesRecibido <= 12
    ? mesRecibido
    : 12;
  return NOMBRES_MESES[mes - 1];
};

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
