export const ESTADO_PRESENTE = "presente";
export const ESTADO_AUSENTE = "ausente";

export function normalizarFechaAsistencia(valor) {
  if (!valor) return "";

  const texto = String(valor);
  const formatoIso = texto.match(/^\d{4}-\d{2}-\d{2}/);
  if (formatoIso) return formatoIso[0];

  const fechaParseada = new Date(texto);
  if (Number.isNaN(fechaParseada.getTime())) return texto.slice(0, 10);

  return fechaParseada.toISOString().slice(0, 10);
}

export function indexarHistorialPorEstudiante(historial) {
  const mapa = new Map();

  historial.forEach((item) => {
    mapa.set(
      Number(item.estudiante_id),
      Array.isArray(item.historial) ? item.historial : [],
    );
  });

  return mapa;
}

export function obtenerAsistenciaGuardadaEnFecha(historialPorEstudiante, fecha) {
  const registros = new Map();
  const fechaNormalizada = normalizarFechaAsistencia(fecha);

  if (!fechaNormalizada) return registros;

  historialPorEstudiante.forEach((items, estudianteId) => {
    const registro = items.find(
      (item) => normalizarFechaAsistencia(item.fecha) === fechaNormalizada,
    );

    if (registro?.estado) {
      registros.set(estudianteId, registro.estado);
    }
  });

  return registros;
}

export function resumirAsistencia(estudiantes, asistencia) {
  return estudiantes.reduce(
    (resumen, estudiante) => {
      const estado = asistencia[estudiante.estudiante_id];

      if (estado === ESTADO_PRESENTE) resumen.presentes += 1;
      else if (estado === ESTADO_AUSENTE) resumen.ausentes += 1;
      else resumen.pendientes += 1;

      return resumen;
    },
    { presentes: 0, ausentes: 0, pendientes: 0 },
  );
}

export function tieneCambiosDeAsistencia(estudiantes, asistencia, asistenciaGuardada) {
  return estudiantes.some((estudiante) => {
    const estudianteId = estudiante.estudiante_id;
    return (asistencia[estudianteId] || "") !== (asistenciaGuardada[estudianteId] || "");
  });
}

export function crearMarcacionTodosPresentes(estudiantes) {
  return Object.fromEntries(
    estudiantes.map((estudiante) => [estudiante.estudiante_id, ESTADO_PRESENTE]),
  );
}

export function construirPayloadAsistencia({
  estudiantes,
  asistencia,
  asignacionId,
  fecha,
  periodo,
}) {
  return estudiantes.map((estudiante) => ({
    estudiante_id: estudiante.estudiante_id,
    asignacion_id: Number(asignacionId),
    fecha,
    estado: asistencia[estudiante.estudiante_id],
    periodo: Number(periodo),
  }));
}
