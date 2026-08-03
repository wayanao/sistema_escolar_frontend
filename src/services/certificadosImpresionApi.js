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
