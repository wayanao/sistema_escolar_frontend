/**
 * «Mi curso» del director de grupo: contratos puros para mostrar el ranking
 * del curso. Ver docs/funcionalidades/MI_CURSO_DIRECTOR.md.
 *
 * El servidor ya aplica las reglas del boletín (puesto con lo guardado,
 * definitiva con respaldo en la planilla); aquí solo se normaliza y se decide
 * cómo se ve cada dato.
 */
import { PREFIJO_BORRADOR_BOLETIN } from "../../constants/borradores";
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
    observacionGeneral: String(estudiante.observacion_general ?? ""),
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

/**
 * Las materias sin guardar, por profesor: a quién hay que recordarle y qué
 * (rediseño del aviso, 2026-11-07). Primero quien tiene más materias
 * pendientes; las materias, en el orden en que llegan (el del boletín). Las
 * que no tienen profesor van al final.
 */
export const agruparPendientesPorProfesor = (pendientes) => {
  const grupos = new Map();
  (pendientes || []).forEach((materia) => {
    const profesor = materia.profesor || "";
    if (!grupos.has(profesor)) grupos.set(profesor, { profesor, materias: [] });
    grupos.get(profesor).materias.push(materia);
  });
  return [...grupos.values()].sort((a, b) => {
    if (Boolean(a.profesor) !== Boolean(b.profesor)) return a.profesor ? -1 : 1;
    return b.materias.length - a.materias.length || a.profesor.localeCompare(b.profesor, "es");
  });
};

/**
 * «0 de 15»: boletines de la materia ya guardados. La palabra «guardados» va
 * en el título de la columna, para que la fila quepa en una tarjeta angosta.
 */
export const textoAvanceMateria = (materia) => `${materia.guardados} de ${materia.total}`;

/** Qué parte de la materia está guardada, de 0 a 100, para su barrita. */
export const porcentajeGuardado = (materia) =>
  materia.total > 0 ? Math.round((materia.guardados / materia.total) * 100) : 0;

// ---------------------------------------------------------------------------
// Observación general del boletín (paso 4)
// ---------------------------------------------------------------------------

/** El mismo límite del servidor y de la tabla: los tres renglones del impreso. */
export const LARGO_MAXIMO_OBSERVACION = 500;

/** Como la guarda el servidor: fin de línea de Windows a uno solo, sin bordes. */
export const limpiarObservacion = (texto) =>
  String(texto ?? "").replace(/\r\n/g, "\n").trim();

/**
 * Borrador de las observaciones de un curso y periodo. Usa el prefijo de los
 * borradores del boletín, así "Cerrar sesión" también lo borra.
 */
export const crearClaveBorradorObservaciones = ({ tenant, profesorId, cursoId, periodo }) => {
  if (profesorId == null || profesorId === "" || cursoId == null || !periodo) return null;
  return `${PREFIJO_BORRADOR_BOLETIN}observaciones:${tenant ?? ""}:${profesorId}:${cursoId}:${periodo}`;
};

/** Solo las observaciones que cambiaron frente a lo guardado; `null` si ninguna. */
export const construirBorradorObservaciones = (textos, guardadas, actualizado) => {
  const cambiadas = Object.fromEntries(
    Object.entries(textos || {}).filter(
      ([estudianteId, texto]) => texto !== (guardadas?.[estudianteId] ?? ""),
    ),
  );
  return Object.keys(cambiadas).length > 0 ? { actualizado, textos: cambiadas } : null;
};

/**
 * Pone el borrador encima de lo guardado, solo para estudiantes que siguen en
 * el curso. Devuelve los textos y cuántos se recuperaron.
 */
export const aplicarBorradorObservaciones = (guardadas, borrador) => {
  const textos = { ...(guardadas || {}) };
  let recuperadas = 0;
  const delBorrador = borrador?.textos;
  if (delBorrador && typeof delBorrador === "object") {
    Object.entries(delBorrador).forEach(([estudianteId, texto]) => {
      if (!(estudianteId in textos) || typeof texto !== "string") return;
      const recortado = texto.slice(0, LARGO_MAXIMO_OBSERVACION);
      if (recortado === textos[estudianteId]) return;
      textos[estudianteId] = recortado;
      recuperadas += 1;
    });
  }
  return { textos, recuperadas };
};
