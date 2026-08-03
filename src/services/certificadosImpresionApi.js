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

export async function generarReporteParcialCertificado(
  estudianteId,
  periodo,
  { signal } = {},
) {
  const ruta = `/boletines/admin/reporte-parcial/${estudianteId}/${periodo}`;
  const respuesta = signal
    ? await api.get(ruta, { signal })
    : await api.get(ruta);
  return respuesta.data;
}
