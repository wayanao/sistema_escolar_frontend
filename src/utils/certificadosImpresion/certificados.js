export const PERIODOS = [
  { value: "todos", label: "Todos los periodos" },
  { value: "1", label: "Periodo 1" },
  { value: "2", label: "Periodo 2" },
  { value: "3", label: "Periodo 3" },
  { value: "4", label: "Periodo 4" },
];

export const PERIODOS_NUMERICOS = [1, 2, 3, 4];
export const PERIODOS_REPORTE = PERIODOS.filter(
  (item) => item.value !== "todos",
);
export const MATERIA_TODAS = "todas";

export const ESTADOS = [
  { value: "activo", label: "Activos" },
  { value: "retirado", label: "Retirados" },
  { value: "egresado", label: "Egresados" },
  { value: "inactivo", label: "Inactivos" },
  { value: "todos", label: "Todos" },
];

export function crearMapaCursos(cursos) {
  const mapa = new Map();
  cursos.forEach((curso) => mapa.set(curso.id, curso));
  return mapa;
}

export function filtrarEstudiantesCertificados(
  estudiantes,
  { busqueda, cursoSeleccionado, estadoFiltro },
) {
  const texto = busqueda.trim().toLowerCase();
  return estudiantes.filter((estudiante) => {
    const coincideCurso = cursoSeleccionado
      ? estudiante.curso_id === Number(cursoSeleccionado)
      : true;
    const estado = estudiante.estado || "activo";
    const coincideEstado = estadoFiltro === "todos" ? true : estado === estadoFiltro;
    const nombreCompleto = `${estudiante.nombre || ""} ${estudiante.apellido || ""} ${estudiante.documento_identidad || ""}`.toLowerCase();
    const coincideBusqueda = texto ? nombreCompleto.includes(texto) : true;
    return coincideCurso && coincideEstado && coincideBusqueda;
  });
}

export function normalizarTexto(valor, fallback = "N/A") {
  const texto = String(valor ?? "").trim();
  return texto || fallback;
}

export function nombreEstudiante(estudiante) {
  return `${normalizarTexto(estudiante?.nombre, "")} ${normalizarTexto(estudiante?.apellido, "")}`
    .trim()
    .replace(/\s+/g, " ");
}

export function documentoEstudiante(estudiante) {
  return normalizarTexto(
    estudiante?.documento_identidad
      ?? estudiante?.documento
      ?? estudiante?.identificacion
      ?? estudiante?.cedula,
  );
}

export function construirCertificadoNotas({
  boletines,
  periodosConsultar,
  periodo,
  estudiante,
  curso,
}) {
  const data = boletines[0];
  const periodosData = boletines.map((boletin, index) => ({
    ...boletin,
    periodo: periodosConsultar[index],
    materias: (boletin.materias || []).map((materia) => ({
      ...materia,
      periodo: periodosConsultar[index],
    })),
  }));

  return {
    ...data,
    periodo: periodo === "todos" ? "Todos" : data.periodo,
    todos_los_periodos: periodo === "todos",
    periodos_data: periodosData,
    documento_identidad: documentoEstudiante(estudiante),
    estudiante_nombre: estudiante?.nombre ?? data.estudiante_nombre,
    estudiante_apellido: estudiante?.apellido ?? data.estudiante_apellido,
    estudiante_nombre_completo: nombreEstudiante(estudiante),
    curso: data.curso ?? curso?.nombre,
  };
}

export function getDefinitiva(materia) {
  const valor = materia?.definitiva ?? materia?.promedio ?? materia?.nota_final ?? null;
  const numero = Number(valor);
  if (Number.isFinite(numero) && numero > 0) return numero;

  const notasDetalle = (materia?.detalles || [])
    .flatMap((detalle) => {
      const periodoActual = String(materia?.periodo ?? detalle?.periodo ?? "");
      if (
        periodoActual
        && detalle?.notas_por_periodo?.[periodoActual] !== undefined
      ) {
        return [detalle.notas_por_periodo[periodoActual]];
      }
      return [detalle?.nota];
    })
    .map(Number)
    .filter((nota) => Number.isFinite(nota) && nota > 0);

  if (!notasDetalle.length) return null;
  return notasDetalle.reduce((total, nota) => total + nota, 0) / notasDetalle.length;
}

export function getDesempeno(definitiva) {
  if (definitiva === null) return "Pendiente";
  if (definitiva >= 4.6) return "Superior";
  if (definitiva >= 4.0) return "Alto";
  if (definitiva >= 3.0) return "Basico";
  return "Bajo";
}

export function formatoNota(definitiva) {
  return definitiva === null ? "---" : definitiva.toFixed(1);
}

export function obtenerFilasMaterias(certificado) {
  const mapa = new Map();
  const fuentes = certificado.todos_los_periodos
    ? certificado.periodos_data || []
    : [certificado];

  fuentes.forEach((periodoData) => {
    const periodoKey = String(periodoData.periodo);
    (periodoData.materias || []).forEach((materia) => {
      const key = materia.materia_id ?? materia.id ?? materia.materia ?? materia.nombre;
      if (!mapa.has(key)) {
        mapa.set(key, {
          key,
          nombre: normalizarTexto(
            materia.materia || materia.nombre || materia.nombre_materia,
            "Materia",
          ),
          docente: normalizarTexto(
            `${materia.profesor_nombre || ""} ${materia.profesor_apellido || ""}`.trim(),
          ),
          notasPorPeriodo: {},
        });
      }
      mapa.get(key).notasPorPeriodo[periodoKey] = getDefinitiva(materia);
    });
  });

  return Array.from(mapa.values()).map((fila) => {
    const notas = Object.values(fila.notasPorPeriodo).filter(
      (nota) => nota !== null,
    );
    const promedio = notas.length
      ? notas.reduce((total, nota) => total + nota, 0) / notas.length
      : null;
    return { ...fila, promedio };
  });
}

export function getMateriaId(materia) {
  return materia?.materia_id ?? materia?.id ?? materia?.materia ?? materia?.nombre;
}

export function getNombreMateria(materia) {
  return normalizarTexto(
    materia?.materia || materia?.nombre || materia?.nombre_materia,
    "Materia",
  );
}

export function getDocenteMateria(materia) {
  return normalizarTexto(
    `${materia?.profesor_nombre || ""} ${materia?.profesor_apellido || ""}`.trim(),
  );
}

export function getValorDetalle(detalle, periodo) {
  const periodoKey = String(periodo);
  const valoracion = detalle?.valoraciones_por_periodo?.[periodoKey]
    ?? detalle?.valoracion;
  if (valoracion) return String(valoracion);

  const nota = detalle?.notas_por_periodo?.[periodoKey] ?? detalle?.nota;
  const numero = Number(nota);
  return Number.isFinite(numero) && numero > 0 ? numero.toFixed(1) : "";
}

export function getDescripcionDetalle(detalle, index) {
  const texto = String(
    detalle?.descripcion ?? detalle?.tipo_nota ?? detalle?.observacion ?? "",
  ).trim();
  return texto || `Evaluacion ${index + 1}`;
}

export function getEstadoMateria(materia) {
  const definitiva = getDefinitiva(materia);
  const detalles = materia?.detalles || [];

  if (!detalles.length && definitiva === null) return "Sin calificar";
  if (
    definitiva === null
    || detalles.some(
      (detalle, index) => !getValorDetalle(
        detalle,
        materia?.periodo || detalle?.periodo || 1,
      ) && getDescripcionDetalle(detalle, index),
    )
  ) {
    return "Con pendientes";
  }
  return "Al dia";
}

export function contarAusencias(registro) {
  return (registro?.historial || []).filter(
    (item) => String(item?.estado || "").toLowerCase() === "ausente",
  ).length;
}

export function construirMateriaReporte(
  materia,
  periodo,
  asistenciaPorAsignacion,
  estudianteId,
) {
  const asistenciaAsignacion = asistenciaPorAsignacion.get(
    Number(materia.asignacion_id),
  ) || [];
  const registroEstudiante = asistenciaAsignacion.find(
    (item) => Number(item.estudiante_id) === Number(estudianteId),
  );
  const detalles = (materia.detalles || []).map((detalle, index) => ({
    descripcion: getDescripcionDetalle(detalle, index),
    valor: getValorDetalle(detalle, periodo),
  }));
  const definitiva = getDefinitiva({ ...materia, periodo });

  return {
    asignacion_id: materia.asignacion_id,
    materia_id: getMateriaId(materia),
    nombre: getNombreMateria(materia),
    docente: getDocenteMateria(materia),
    definitiva,
    desempeno: getDesempeno(definitiva),
    estado: getEstadoMateria({ ...materia, periodo }),
    inasistencias: contarAusencias(registroEstudiante),
    detalles,
  };
}

export function construirBoletinesValidos(
  respuestas,
  estudiantesObjetivo,
  periodoNumero,
  materiaIdFiltro,
) {
  return respuestas
    .map((respuesta, index) => {
      if (respuesta.status !== "fulfilled") return null;
      const estudiante = estudiantesObjetivo[index];
      const data = respuesta.value || {};
      const materiasFiltradas = (data.materias || [])
        .filter((materia) => (
          materiaIdFiltro
            ? Number(getMateriaId(materia)) === materiaIdFiltro
            : true
        ))
        .map((materia) => ({ ...materia, periodo: periodoNumero }));
      return { estudiante, data, materiasFiltradas };
    })
    .filter(Boolean);
}

export function obtenerAsignacionIds(boletinesValidos) {
  return Array.from(
    new Set(
      boletinesValidos
        .flatMap((item) => item.materiasFiltradas)
        .map((materia) => Number(materia.asignacion_id))
        .filter(Boolean),
    ),
  );
}

export function construirEstudiantesReporte({
  boletinesValidos,
  cursosPorId,
  asistenciaPorAsignacion,
  periodoNumero,
}) {
  return boletinesValidos.map(({ estudiante, data, materiasFiltradas }) => {
    const curso = cursosPorId.get(estudiante.curso_id);
    const materiasReporte = materiasFiltradas.map((materia) =>
      construirMateriaReporte(
        materia,
        periodoNumero,
        asistenciaPorAsignacion,
        estudiante.id,
      ));

    return {
      id: estudiante.id,
      nombre: nombreEstudiante(estudiante) || normalizarTexto(
        `${data.estudiante_nombre || ""} ${data.estudiante_apellido || ""}`.trim(),
      ),
      documento: documentoEstudiante(estudiante),
      curso: data.curso || curso?.nombre || "Sin asignar",
      estado: estudiante.estado || "activo",
      promedio: promedioMaterias(materiasReporte),
      inasistencias: totalInasistencias(materiasReporte),
      materias: materiasReporte,
    };
  });
}

export function construirResumenReporteParcial({
  alcance,
  periodoNumero,
  materiaIdFiltro,
  materias,
  cursosPorId,
  cursoSeleccionado,
  estudiantesReporte,
  errores,
  fecha,
}) {
  const cursoSeleccionadoInfo = cursosPorId.get(Number(cursoSeleccionado));
  const materiaSeleccionadaInfo = materiaIdFiltro
    ? materias.find((materia) => Number(materia.id) === materiaIdFiltro)
    : null;

  return {
    alcance,
    periodo: periodoNumero,
    materia: materiaSeleccionadaInfo?.nombre || "Todas las materias",
    curso: alcance === "curso"
      ? `${normalizarTexto(cursoSeleccionadoInfo?.nombre, "Curso")} ${cursoSeleccionadoInfo?.jornada ? `- ${cursoSeleccionadoInfo.jornada}` : ""}`.trim()
      : estudiantesReporte[0]?.curso,
    fecha,
    estudiantes: estudiantesReporte,
    errores,
  };
}

export function filtrarEstudiantesCurso(
  estudiantes,
  cursoSeleccionado,
  estadoFiltro,
) {
  return estudiantes.filter((estudiante) => {
    const coincideCurso = estudiante.curso_id === Number(cursoSeleccionado);
    const estado = estudiante.estado || "activo";
    const coincideEstado = estadoFiltro === "todos" ? true : estado === estadoFiltro;
    return coincideCurso && coincideEstado;
  });
}

export function promedioMaterias(materias) {
  const notas = materias
    .map((materia) => materia.definitiva)
    .filter((nota) => nota !== null);
  if (!notas.length) return null;
  return notas.reduce((total, nota) => total + nota, 0) / notas.length;
}

export function totalInasistencias(materias) {
  return materias.reduce(
    (total, materia) => total + (Number(materia.inasistencias) || 0),
    0,
  );
}
