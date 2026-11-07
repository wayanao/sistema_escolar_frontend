import { PREFIJO_BORRADOR_BOLETIN } from "../../constants/borradores";
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

// Porcentajes por tipo de nota, paso B4c (PB11 de
// docs/funcionalidades/SUBNOTAS_PLANILLA.md del backend): al guardar el
// boletín con porcentajes incompletos se avisa que la definitiva es el
// promedio simple. No bloquea: el profesor decide.
export const AVISO_PORCENTAJES_INCOMPLETOS =
  "Los porcentajes de esta clase están incompletos: la definitiva es el promedio simple.";
export const MENSAJE_PORCENTAJES_INCOMPLETOS = `${AVISO_PORCENTAJES_INCOMPLETOS} ¿Guardar igual?`;

/**
 * `true` si la clase tiene algún porcentaje pero no están activos. Usa lo que
 * decide el servidor (`porcentajes_activos`), el mismo que calcula la
 * definitiva al guardar.
 */
export const hayPorcentajesIncompletos = (estado) =>
  Object.keys(estado?.porcentajes || {}).length > 0 && !estado?.porcentajes_activos;

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

/**
 * Borrador del boletín: lo que el profesor escribió y no ha guardado, para
 * encontrarlo al volver. Uno por colegio, profesor, clase y periodo; sin
 * profesor o sin clase no hay borrador (`null`).
 */
export const crearClaveBorradorBoletin = ({ tenant, profesorId, asignacionId, periodo }) => {
  if (profesorId == null || profesorId === "" || !asignacionId || !periodo) return null;
  return `${PREFIJO_BORRADOR_BOLETIN}${tenant ?? ""}:${profesorId}:${asignacionId}:${periodo}`;
};

/**
 * Lo que va al borrador: solo los textos de los estudiantes con cambios sin
 * guardar. Las notas y la definitiva no, porque vienen de la planilla. Sin
 * cambios pendientes devuelve `null` (no queda borrador).
 */
export const construirBorrador = (datosBoletin, estadoGuardado, actualizado) => {
  const estudiantes = {};
  estudiantesConCambiosSinGuardar(estadoGuardado).forEach((estudianteId) => {
    const form = datosBoletin?.[estudianteId];
    if (!form?.observaciones) return;
    estudiantes[estudianteId] = {
      observaciones: form.observaciones.map((observacion) => ({
        referencia: observacion.referencia || "",
        tipo_evaluacion: observacion.tipo_evaluacion || "numerica",
        observacion: observacion.observacion || "",
      })),
    };
  });
  return Object.keys(estudiantes).length > 0 ? { actualizado, estudiantes } : null;
};

/**
 * Pone el borrador encima de lo que trajo el servidor. Cada texto se busca por
 * su tipo de nota: si la planilla cambió y ese tipo ya no está, ese texto se
 * descarta. Los estudiantes con algún texto distinto al guardado quedan con
 * "Cambios sin guardar" y salen en `recuperados`.
 */
export const aplicarBorrador = ({ datosBoletin, estadoGuardado, borrador }) => {
  const sinCambios = { datosBoletin, estadoGuardado, recuperados: [] };
  const estudiantes = borrador?.estudiantes;
  if (!estudiantes || typeof estudiantes !== "object") return sinCambios;

  const nuevosDatos = { ...datosBoletin };
  const nuevoEstado = { ...estadoGuardado };
  const recuperados = [];

  Object.entries(estudiantes).forEach(([estudianteId, delBorrador]) => {
    const form = datosBoletin?.[estudianteId];
    const observacionesBorrador = Array.isArray(delBorrador?.observaciones)
      ? delBorrador.observaciones
      : [];
    if (!form?.observaciones || observacionesBorrador.length === 0) return;

    const porClave = new Map(
      observacionesBorrador.map((item) => [crearClaveObservacion(item), item]),
    );
    let huboCambio = false;
    const observaciones = form.observaciones.map((observacion, indice) => {
      const clave = crearClaveObservacion(observacion);
      // Primero la misma posición (por si hay dos del mismo tipo); si no, por tipo.
      const mismaPosicion = observacionesBorrador[indice];
      const item = mismaPosicion && crearClaveObservacion(mismaPosicion) === clave
        ? mismaPosicion
        : porClave.get(clave);
      if (!item) return observacion;

      const texto = String(item.observacion ?? "");
      if (texto === (observacion.observacion || "")) return observacion;
      huboCambio = true;
      return { ...observacion, observacion: texto };
    });

    if (!huboCambio) return;
    nuevosDatos[estudianteId] = { ...form, observaciones };
    nuevoEstado[estudianteId] = { ...(estadoGuardado?.[estudianteId] || {}), modificado: true };
    recuperados.push(estudianteId);
  });

  return recuperados.length > 0
    ? { datosBoletin: nuevosDatos, estadoGuardado: nuevoEstado, recuperados }
    : sinCambios;
};

/** Ids de los estudiantes con cambios sin guardar. */
export const estudiantesConCambiosSinGuardar = (estadoGuardado) =>
  Object.entries(estadoGuardado || {})
    .filter(([, estado]) => estado?.modificado)
    .map(([estudianteId]) => estudianteId);

/** Qué decirle al profesor antes de cambiar de clase o de periodo con cambios sin guardar. */
export const mensajeCambiosSinGuardar = (cantidad) =>
  `${cantidad === 1 ? "Un estudiante tiene" : `${cantidad} estudiantes tienen`} cambios sin guardar. Si cambias de clase o de periodo, se pierden.`;

/**
 * Qué decirle al profesor cuando "Guardar todo" se detiene en un estudiante.
 * Si el servidor explica por qué (por ejemplo, el año está cerrado), se usa
 * su explicación; si no respondió, lo más probable es la conexión.
 */
export const mensajeGuardadoGrupoIncompleto = ({ guardados, total, nombreFallido, error }) => {
  const detalle = error?.response?.data?.detail;
  const causa = typeof detalle === "string" && detalle.trim() ? ` ${detalle.trim()}` : "";

  if (guardados === 0) {
    return `No se pudo guardar el grupo.${causa || " Revisa la conexión e intenta nuevamente."}`;
  }
  const faltan = total - guardados;
  return (
    `Se guardaron ${guardados} de ${total} estudiantes. `
    + `${faltan === 1 ? "Falta" : `Faltan ${faltan}, desde`} ${nombreFallido}: `
    + `${faltan === 1 ? "sigue marcado" : "siguen marcados"} como no guardado${faltan === 1 ? "" : "s"}.`
    + (causa || " Revisa la conexión y oprime «Guardar todo» otra vez.")
  );
};

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

/**
 * Las otras clases del profesor en el mismo curso que `asignacionId`, para la
 * vista previa del boletín. Van en orden alfabético: el orden del boletín real
 * lo configura el admin y el profesor no puede leerlo.
 */
export const clasesDelMismoCurso = (clases, asignacionId) => {
  const lista = Array.isArray(clases) ? clases : [];
  const actual = lista.find((clase) => String(clase.id) === String(asignacionId));
  if (!actual) return [];

  const mismoCurso = (clase) =>
    actual.curso_id != null && clase.curso_id != null
      ? String(clase.curso_id) === String(actual.curso_id)
      : clase.curso === actual.curso;

  return lista
    .filter(
      (clase) =>
        String(clase.id) !== String(asignacionId)
        && clase.materia !== actual.materia
        && mismoCurso(clase),
    )
    .sort((a, b) => String(a.materia || "").localeCompare(String(b.materia || ""), "es"));
};

/**
 * La materia del profesor con la forma con que el boletín del colegio la
 * imprime (`MateriaBoletin`), armada con lo que el profesor tiene en pantalla,
 * aunque no esté guardado. Sale del mismo payload que se guarda, para que la
 * vista previa muestre exactamente la definitiva y los logros que van a llegar.
 *
 * Solo trae el periodo que se está llenando: los otros periodos viven en el
 * boletín del admin, que el profesor no puede leer.
 */
export const construirMateriaVistaPrevia = ({
  datosBoletin,
  estudianteId,
  asignacionId,
  periodo,
  materia,
  docente,
}) => {
  const payload = construirPayloadBoletin({
    datosBoletin,
    estudianteId,
    asignacionId,
    periodo,
  });
  if (!payload) return null;

  const clavePeriodo = String(periodo);
  return {
    materia_id: payload.asignacion_id,
    materia: materia || "",
    profesor_nombre: docente || "",
    profesor_apellido: "",
    definitiva: Number.isFinite(payload.definitiva) ? payload.definitiva : null,
    // Igual que el boletín del admin: una nota en cero no se imprime.
    detalles: payload.detalles.map((detalle) => ({
      observacion: detalle.observacion || "",
      tipo_evaluacion: detalle.tipo_evaluacion,
      notas_por_periodo:
        Number.isFinite(detalle.nota) && detalle.nota > 0
          ? { [clavePeriodo]: detalle.nota }
          : {},
      valoraciones_por_periodo: detalle.valoracion
        ? { [clavePeriodo]: detalle.valoracion }
        : {},
    })),
  };
};

/**
 * Otra materia del profesor en el mismo curso, para la vista previa: sale de
 * su consulta de referencia (`estudiantes`, ya normalizados), o sea con lo
 * último que guardó y las notas actuales de la planilla. `guardada` es `false`
 * si el estudiante no tiene ningún logro guardado en esa materia.
 *
 * Si el estudiante no aparece en esa clase, la materia queda sin detalles y el
 * boletín la muestra como pendiente, igual que el del admin.
 */
export const construirOtraMateriaVistaPrevia = ({
  clase,
  estudiantes,
  estudianteId,
  periodo,
  docente,
}) => {
  const estudiante = (estudiantes || []).find(
    (item) => String(item.estudiante_id) === String(estudianteId),
  );
  if (!estudiante) {
    return {
      guardada: false,
      materia: {
        materia_id: parseInt(clase.id),
        materia: clase.materia || "",
        profesor_nombre: docente || "",
        profesor_apellido: "",
        definitiva: null,
        detalles: [],
      },
    };
  }

  const id = estudiante.estudiante_id;
  return {
    guardada: crearEstadoGuardadoInicial([estudiante])[id].guardado,
    materia: construirMateriaVistaPrevia({
      datosBoletin: crearDatosBoletinInicial([estudiante]),
      estudianteId: id,
      asignacionId: clase.id,
      periodo,
      materia: clase.materia,
      docente,
    }),
  };
};
