export const VALORACIONES_DESARROLLO = {
  destacado: { label: "Destacado", emoji: "⭐" },
  logrado: { label: "Logrado", emoji: "😀" },
  proceso: { label: "En proceso", emoji: "🙂" },
  apoyo: { label: "Requiere acompañamiento", emoji: "🧩" },
};

export const ESCALA_NUMERICA = [
  { rango: "5.0", concepto: "Excelente / Superior" },
  { rango: "4.0 - 4.9", concepto: "Alto" },
  { rango: "3.0 - 3.9", concepto: "Básico" },
  { rango: "1.0 - 2.9", concepto: "Bajo" },
];

const EMOJI_DESARROLLO = Object.fromEntries(
  Object.entries(VALORACIONES_DESARROLLO).map(([valor, item]) => [valor, item.emoji]),
);

export const normalizarTexto = (valor, fallback = "N/A") => {
  const texto = String(valor ?? "").trim();
  return texto || fallback;
};

export const documentoEstudiante = (estudiante) =>
  normalizarTexto(
    estudiante?.documento_identidad ??
      estudiante?.documento ??
      estudiante?.identificacion ??
      estudiante?.cedula,
  );

export const filtrarEstudiantes = (estudiantes, cursoSeleccionado, busqueda) =>
  estudiantes.filter((estudiante) => {
    const coincideCurso = cursoSeleccionado
      ? estudiante.curso_id === parseInt(cursoSeleccionado)
      : true;
    const textoBusqueda = [
      estudiante.nombre,
      estudiante.apellido,
      documentoEstudiante(estudiante),
    ]
      .join(" ")
      .toLowerCase();
    const coincideBusqueda = textoBusqueda.includes(busqueda.toLowerCase());
    return coincideCurso && coincideBusqueda;
  });

export const calcularPromedioGeneral = (materias) => {
  if (!materias) return 0;
  const evaluadas = materias.filter((materia) => materia.definitiva !== null);
  if (evaluadas.length === 0) return 0;
  const suma = evaluadas.reduce((total, materia) => total + materia.definitiva, 0);
  return (suma / evaluadas.length).toFixed(1);
};

export const obtenerDesempeno = (definitiva) => {
  if (definitiva === null) return "PENDIENTE";
  if (definitiva >= 4.6) return "SUPERIOR";
  if (definitiva >= 4.0) return "ALTO";
  if (definitiva >= 3.0) return "BÁSICO";
  return "BAJO";
};

export const formatearValoracionPeriodo = (detalle, periodoKey) => {
  const valor = detalle.valoraciones_por_periodo?.[periodoKey];
  if (valor) return EMOJI_DESARROLLO[valor] || valor;
  return detalle.notas_por_periodo?.[periodoKey]?.toFixed(1) || "";
};

export const usaDesarrolloInfantil = (materias) =>
  materias?.some((materia) =>
    materia.detalles?.some(
      (detalle) =>
        detalle.tipo_evaluacion === "desarrollo" ||
        Object.keys(detalle.valoraciones_por_periodo || {}).length > 0,
    ),
  );

export const consolidarMateriasBoletin = (materias = []) =>
  Array.from(
    (materias || [])
      .reduce((mapa, materia) => {
        const clave = String(materia.materia_id);
        if (!mapa.has(clave)) mapa.set(clave, { ...materia, detalles: [] });
        mapa.get(clave).detalles.push(...(materia.detalles || []));
        return mapa;
      }, new Map())
      .values(),
  );
