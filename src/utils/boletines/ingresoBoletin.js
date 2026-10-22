import {
  esEvaluacionDesarrollo,
  promedioDeValoraciones,
} from "../valoracionesDesarrollo";

/**
 * Se reexporta para no obligar a cambiar los imports existentes.
 *
 * La única definición vive en `src/constants/`, compartida con la planilla.
 * Antes este archivo tenía su propia copia y las dos escalas se
 * desincronizaron: la misma carita se llamaba "Requiere apoyo" en la planilla y
 * "Requiere acompañamiento" en el boletín.
 */
export { VALORACIONES_DESARROLLO } from "../../constants/valoracionesDesarrollo";

const COLUMNAS_INTERNAS_OCULTAS = new Set(["mas_alto"]);

export const obtenerTipoNota = (nota) =>
  nota?.tipo_nota || nota?.descripcion || nota?.referencia || "";

export const esNotaInterna = (nota) =>
  COLUMNAS_INTERNAS_OCULTAS.has(String(obtenerTipoNota(nota)).trim().toLowerCase());

export const formatearEtiquetaNota = (valor) =>
  String(valor || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

export const obtenerTextoLimpio = (valor) => String(valor || "").trim();

export const crearClaveObservacion = (observacion) =>
  `${String(observacion?.referencia || "").trim().toLowerCase()}|${observacion?.tipo_evaluacion || "numerica"}`;

export const deduplicarClases = (clases, asignacionId) => {
  const clasesPorCursoMateria = new Map();

  clases.forEach((clase) => {
    const clave = `${clase.curso}__${clase.materia}`;
    const esAsignacionActual = String(clase.id) === String(asignacionId);
    if (!clasesPorCursoMateria.has(clave) || esAsignacionActual) {
      clasesPorCursoMateria.set(clave, clase);
    }
  });

  return Array.from(clasesPorCursoMateria.values());
};

export const normalizarEstudiantesReferencia = (data) => {
  const estudiantes = Array.isArray(data) ? data : [];
  return estudiantes.map((estudiante) => ({
    ...estudiante,
    notas: (estudiante.notas || []).filter((nota) => !esNotaInterna(nota)),
  }));
};

export const crearDatosBoletinInicial = (estudiantes) => {
  const estadoInicial = {};

  estudiantes.forEach((estudiante) => {
    const notas = estudiante.notas || [];
    const notasNumericas = notas.filter(
      (nota) =>
        nota.tipo_evaluacion !== "desarrollo" &&
        nota.valor !== null &&
        nota.valor !== undefined,
    );

    // Una materia de desarrollo no tiene notas numéricas que promediar, así que
    // su definitiva sale de la equivalencia de las caritas. Sin esto la
    // definitiva quedaba en cero y el estudiante no entraba en el puesto del
    // curso. El profesor sigue viendo la carita, nunca este número.
    const promedioDesarrollo = esEvaluacionDesarrollo(notas)
      ? promedioDeValoraciones(notas.map((nota) => nota.valoracion))
      : null;

    const promedioNumerico =
      notasNumericas.length > 0
        ? notasNumericas.reduce((total, nota) => total + nota.valor, 0) /
          notasNumericas.length
        : null;

    // Porcentajes por tipo de nota, paso B4a (PB5): con los porcentajes de la
    // clase activos, el servidor manda la definitiva que va a guardar, y se
    // muestra esa. Si no viene, la cuenta de siempre.
    const delServidor = Number(estudiante.definitiva);
    const tieneDelServidor =
      estudiante.definitiva !== null
      && estudiante.definitiva !== undefined
      && Number.isFinite(delServidor);
    const promedio = tieneDelServidor ? delServidor : promedioDesarrollo ?? promedioNumerico;
    const definitiva = promedio === null ? 0 : promedio.toFixed(2);

    estadoInicial[estudiante.estudiante_id] = {
      definitiva,
      observaciones: (estudiante.notas || []).map((nota) => ({
        nota: nota.valor,
        observacion: nota.observacion_guardada || "",
        referencia: obtenerTipoNota(nota),
        tipo_evaluacion: nota.tipo_evaluacion || "numerica",
        valoracion: nota.valoracion || "",
      })),
    };
  });

  return estadoInicial;
};

export const crearEstadoGuardadoInicial = (estudiantes) => {
  const estadoInicial = {};

  estudiantes.forEach((estudiante) => {
    const tieneObservacionesGuardadas = (estudiante.notas || []).some(
      (nota) => String(nota.observacion_guardada || "").trim().length > 0,
    );
    estadoInicial[estudiante.estudiante_id] = {
      guardado: tieneObservacionesGuardadas,
      modificado: false,
      guardadoEn: null,
    };
  });

  return estadoInicial;
};

export const correspondeFormularioAEstudiante = (form, estudiante) => {
  const observaciones = form?.observaciones;
  const notas = estudiante?.notas || [];

  if (!Array.isArray(observaciones) || observaciones.length !== notas.length) {
    return false;
  }

  return notas.every((nota, index) => {
    const observacion = observaciones[index];
    if (!observacion) return false;

    return (
      String(observacion.referencia || "") === String(obtenerTipoNota(nota)) &&
      (observacion.tipo_evaluacion || "numerica") ===
        (nota.tipo_evaluacion || "numerica")
    );
  });
};

export const aplicarLogrosEnGrupo = (datosBoletin, estudianteIdOrigen, soloVacios) => {
  const origen = datosBoletin[estudianteIdOrigen];
  const logrosPorClave = new Map();
  const logrosPorIndice = new Map();

  (origen?.observaciones || []).forEach((observacion, index) => {
    const texto = obtenerTextoLimpio(observacion.observacion);
    if (!texto) return;
    logrosPorClave.set(crearClaveObservacion(observacion), texto);
    logrosPorIndice.set(index, texto);
  });

  const nuevosDatosBoletin = {};
  const estudiantesModificados = [];

  Object.entries(datosBoletin).forEach(([estudianteId, data]) => {
    let tuvoCambios = false;
    const observaciones = (data.observaciones || []).map((observacion, index) => {
      const textoOrigen =
        logrosPorClave.get(crearClaveObservacion(observacion)) ||
        logrosPorIndice.get(index) ||
        "";
      if (!textoOrigen) return observacion;

      const textoActual = obtenerTextoLimpio(observacion.observacion);
      if (soloVacios && textoActual) return observacion;
      if (observacion.observacion === textoOrigen) return observacion;

      tuvoCambios = true;
      return { ...observacion, observacion: textoOrigen };
    });

    nuevosDatosBoletin[estudianteId] = tuvoCambios
      ? { ...data, observaciones }
      : data;
    if (tuvoCambios) estudiantesModificados.push(estudianteId);
  });

  return { datosBoletin: nuevosDatosBoletin, estudiantesModificados };
};

export const construirPayloadBoletin = ({
  datosBoletin,
  estudianteId,
  asignacionId,
  periodo,
}) => {
  const data = datosBoletin[estudianteId];
  if (!data) return null;
  const esDesarrollo = esEvaluacionDesarrollo(data.observaciones);

  // En desarrollo se envía el promedio de las caritas, no `null`: el puesto del
  // curso se calcula sobre las definitivas guardadas y descarta las nulas, de
  // modo que enviarlas vacías dejaba a estos cursos sin puesto. Si todavía no
  // hay ninguna carita puesta se mantiene `null`, que es lo que distingue "sin
  // calificar" de un promedio real.
  const definitiva = esDesarrollo
    ? promedioDeValoraciones(
        data.observaciones.map((observacion) => observacion.valoracion),
      )
    : parseFloat(data.definitiva);

  return {
    estudiante_id: estudianteId,
    asignacion_id: parseInt(asignacionId),
    periodo: parseInt(periodo),
    definitiva,
    detalles: data.observaciones.map((observacion) => ({
      nota:
        observacion.tipo_evaluacion === "desarrollo"
          ? null
          : parseFloat(observacion.nota),
      observacion: observacion.observacion,
      tipo_evaluacion: observacion.tipo_evaluacion || "numerica",
      valoracion:
        observacion.tipo_evaluacion === "desarrollo"
          ? observacion.valoracion
          : null,
    })),
  };
};
