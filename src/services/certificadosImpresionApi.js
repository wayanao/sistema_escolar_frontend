import api from "../utils/api";

export {
  generarBoletinAdministrativo as generarBoletinCertificado,
  listarCursosBoletines as listarCursosCertificados,
  listarEstudiantesBoletines as listarEstudiantesCertificados,
} from "./boletinesApi";

export {
  listarHistorialAsistencia as listarHistorialAsistenciaCertificados,
} from "./asistenciaApi";

export async function listarMateriasCertificados({ signal } = {}) {
  const respuesta = signal
    ? await api.get("/materias", { signal })
    : await api.get("/materias");
  return respuesta.data;
}

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); sin él, la petición es la de siempre.
export async function generarReporteParcialCertificado(
  estudianteId,
  periodo,
  { signal, parametrosAnio } = {},
) {
  const ruta = `/boletines/admin/reporte-parcial/${estudianteId}/${periodo}`;
  const opciones = {};
  if (parametrosAnio) opciones.params = parametrosAnio;
  if (signal) opciones.signal = signal;
  const respuesta = Object.keys(opciones).length > 0
    ? await api.get(ruta, opciones)
    : await api.get(ruta);
  return respuesta.data;
}
