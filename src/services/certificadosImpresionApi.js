import api from "../utils/api";

export {
  generarBoletinAdministrativo as generarBoletinCertificado,
  listarCursosBoletines as listarCursosCertificados,
} from "./boletinesApi";

// Año lectivo, paso 6.10 (decisión del 2026-10-08): Certificados pide los
// estudiantes de todos los estados, para poder certificar a retirados y
// egresados; la pantalla sigue empezando en "Activos". Boletines conserva su
// propia consulta, solo de activos. `parametrosAnio` solo llega mirando un
// año que no es el activo.
export async function listarEstudiantesCertificados({ signal, parametrosAnio } = {}) {
  const opciones = { params: { estado: "todos", ...parametrosAnio } };
  if (signal) opciones.signal = signal;
  const { data } = await api.get("/estudiantes", opciones);
  return data;
}

// La ficha completa de un estudiante, por el tipo de documento (R.C., T.I.)
// de los certificados: la lista de arriba no lo trae. Es la misma consulta de
// la ficha en Estudiantes; no depende del año.
export async function obtenerFichaEstudianteCertificado(estudianteId, { signal } = {}) {
  const ruta = `/estudiantes/${estudianteId}`;
  const { data } = signal ? await api.get(ruta, { signal }) : await api.get(ruta);
  return data;
}

// Paz y salvo: lo que debe el estudiante a la fecha (lo vencido; la cuenta la
// hace el backend) en un año, más `deuda_anios_anteriores`. Sin
// `parametrosAnio`, el año activo. Es la misma consulta de Pagos.
export async function obtenerDeudasCertificado(estudianteId, { signal, parametrosAnio } = {}) {
  const ruta = `/estudiantes/${estudianteId}/deudas`;
  const opciones = {};
  if (parametrosAnio) opciones.params = parametrosAnio;
  if (signal) opciones.signal = signal;
  const { data } = Object.keys(opciones).length > 0
    ? await api.get(ruta, opciones)
    : await api.get(ruta);
  return data;
}

// Paz y salvo: las ventas fiadas (cargos de inventario) con saldo. No son de
// ningún año. Es la misma consulta de Pagos.
export async function listarVentasPendientesCertificado(estudianteId, { signal } = {}) {
  const ruta = `/api/ventas/pendientes/${estudianteId}`;
  const { data } = signal ? await api.get(ruta, { signal }) : await api.get(ruta);
  return data;
}

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
