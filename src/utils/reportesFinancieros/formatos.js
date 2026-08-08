export const hoyISO = () => new Date().toISOString().split("T")[0];

export const formatoMoneda = (valor) =>
  Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export const nombreMes = (mes) =>
  new Date(`${mes}-01`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
  });

export const finDeMesISO = (mes) => {
  const [year, month] = mes.split("-").map(Number);
  const ultimoDia = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};
