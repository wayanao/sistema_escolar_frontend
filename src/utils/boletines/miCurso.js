/**
 * «Mi curso» del director de grupo: contratos puros para mostrar el ranking
 * del curso. Ver docs/funcionalidades/MI_CURSO_DIRECTOR.md.
 *
 * El servidor ya aplica las reglas del boletín (puesto con lo guardado,
 * definitiva con respaldo en la planilla); aquí solo se normaliza y se decide
 * cómo se ve cada dato.
 */
import { capitalizarNombreVisible } from "../nombres";
import { valoracionDesdePromedio } from "../valoracionesDesarrollo";

const comoNumero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

export const normalizarCursosDirigidos = (data) =>
  (Array.isArray(data) ? data : [])
    .filter((curso) => curso && curso.id !== null && curso.id !== undefined)
    .map((curso) => ({
      id: curso.id,
      nombre: curso.nombre || "",
      jornada: curso.jornada || "",
      nivel: curso.nivel || null,
    }));

export const normalizarMiCurso = (data) => {
  const materias = (Array.isArray(data?.materias) ? data.materias : []).map((materia) => ({
    asignacionId: String(materia.asignacion_id),
    materia: materia.materia || "",
    profesor: materia.profesor || "",
    tipoEvaluacion: materia.tipo_evaluacion === "desarrollo" ? "desarrollo" : "numerica",
    guardados: Number(materia.guardados) || 0,
    total: Number(materia.total) || 0,
  }));

  const estudiantes = (Array.isArray(data?.estudiantes) ? data.estudiantes : []).map((estudiante) => ({
    estudianteId: estudiante.estudiante_id,
    nombre: nombreDelEstudiante(estudiante),
    puesto: comoNumero(estudiante.puesto),
    promedio: comoNumero(estudiante.promedio),
    notas: Object.fromEntries(
      materias.map((materia) => {
        const celda = estudiante.notas?.[materia.asignacionId] || {};
        return [
          materia.asignacionId,
          { definitiva: comoNumero(celda.definitiva), guardada: Boolean(celda.guardada) },
        ];
      }),
    ),
    inasistencias: {
      periodo: Number(estudiante.inasistencias?.periodo) || 0,
      anio: Number(estudiante.inasistencias?.anio) || 0,
    },
  }));

  return {
    curso: {
      id: data?.curso?.id ?? null,
      nombre: data?.curso?.nombre || "",
      jornada: data?.curso?.jornada || "",
    },
    periodo: data?.periodo ?? null,
    totalRankeados: Number(data?.total_rankeados) || 0,
    materias,
    estudiantes,
    // Como el boletín impreso: con alguna materia de caritas, el promedio
    // también se muestra como carita.
    usaCaritas: materias.some((materia) => materia.tipoEvaluacion === "desarrollo"),
  };
};

/** «Pérez Gómez Ana Sofía»: apellidos primero, como en las listas del curso. */
export const nombreDelEstudiante = (estudiante) =>
  capitalizarNombreVisible(`${estudiante?.apellido || ""} ${estudiante?.nombre || ""}`);

/**
 * Cómo se ve una nota. `tono` sigue los colores del boletín impreso: alta
 * desde 4.0, media desde 3.0 y baja por debajo. `guardada` en `false` es
 * una nota que sale de la planilla: todavía no cuenta para el puesto.
 */
export const presentarNota = (definitiva, { caritas = false, guardada = true } = {}) => {
  const valor = comoNumero(definitiva);
  if (valor === null) return { texto: "—", carita: null, tono: "vacia", guardada };
  if (caritas) {
    const valoracion = valoracionDesdePromedio(valor);
    return {
      texto: valoracion?.label || "—",
      carita: valoracion?.emoji || null,
      tono: "caritas",
      guardada,
    };
  }
  const tono = valor >= 4 ? "alta" : valor >= 3 ? "media" : "baja";
  return { texto: valor.toFixed(1), carita: null, tono, guardada };
};

/** Materias que todavía tienen estudiantes sin boletín guardado. */
export const materiasPendientes = (materias) =>
  (materias || [])
    .filter((materia) => materia.guardados < materia.total)
    .map((materia) => ({ ...materia, faltan: materia.total - materia.guardados }));

/** «Inglés: faltan 12 por guardar», «Arte: falta 1 por guardar». */
export const textoMateriaPendiente = (materia) =>
  `${materia.materia}: ${materia.faltan === 1 ? "falta 1" : `faltan ${materia.faltan}`} por guardar`;
