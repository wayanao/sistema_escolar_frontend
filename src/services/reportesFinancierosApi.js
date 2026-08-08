import api from "../utils/api";

export const obtenerReporteGeneral = async () => {
  const response = await api.get("/reportes/general");
  return response.data;
};

export const obtenerIngresosRango = async (inicio, fin) => {
  const response = await api.get("/reportes/ingresos-rango", { params: { inicio, fin } });
  return response.data;
};

export const obtenerEgresosRango = async (inicio, fin) => {
  const response = await api.get("/reportes/egresos-rango", { params: { inicio, fin } });
  return response.data;
};

export const obtenerIngresosMes = async (mes) => {
  const response = await api.get(`/reportes/ingresos-mes/${mes}`);
  return response.data;
};
