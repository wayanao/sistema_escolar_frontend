export const VALORACIONES_DESARROLLO = [
  { value: "destacado", label: "Destacado", emoji: "⭐" },
  { value: "logrado", label: "Logrado", emoji: "😀" },
  { value: "proceso", label: "En proceso", emoji: "🙂" },
  { value: "apoyo", label: "Requiere acompañamiento", emoji: "🧩" },
];

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
    const notasNumericas = (estudiante.notas || []).filter(
      (nota) =>
        nota.tipo_evaluacion !== "desarrollo" &&
        nota.valor !== null &&
        nota.valor !== undefined,
    );
    const definitiva =
      notasNumericas.length > 0
        ? (
            notasNumericas.reduce((total, nota) => total + nota.valor, 0) /
            notasNumericas.length
          ).toFixed(2)
        : 0;

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
  const esDesarrollo = data.observaciones.some(
    (observacion) => observacion.tipo_evaluacion === "desarrollo",
  );

  return {
    estudiante_id: estudianteId,
    asignacion_id: parseInt(asignacionId),
    periodo: parseInt(periodo),
    definitiva: esDesarrollo ? null : parseFloat(data.definitiva),
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
