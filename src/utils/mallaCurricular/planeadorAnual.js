export const CANTIDAD_FILAS_PLANEADOR = 8;

export const CAMPOS_CONTENIDO = [
  "unidad_tematica",
  "estandar_competencia",
  "contenido",
  "actividades_recursos",
];

export const crearFilaVacia = () => ({
  unidad_tematica: "",
  estandar_competencia: "",
  contenido: "",
  actividades_recursos: "",
  fecha: "",
});

export const crearFilasVacias = () => Array.from(
  { length: CANTIDAD_FILAS_PLANEADOR },
  crearFilaVacia
);

export const filaTieneContenido = (fila) => CAMPOS_CONTENIDO.some(
  (campo) => String(fila?.[campo] || "").trim().length > 0
);

export const mapearPlaneadoresPorSlot = (planeadoresData = []) => {
  const filas = crearFilasVacias();

  planeadoresData.forEach((planeador, index) => {
    const slotIndex = Number(planeador.slot) - 1;
    const targetIndex = Number.isInteger(slotIndex) && slotIndex >= 0
      && slotIndex < CANTIDAD_FILAS_PLANEADOR
      ? slotIndex
      : index;

    if (targetIndex < CANTIDAD_FILAS_PLANEADOR) {
      filas[targetIndex] = {
        unidad_tematica: planeador.unidad_tematica || "",
        estandar_competencia: planeador.estandar_competencia || "",
        contenido: planeador.contenido || "",
        actividades_recursos: planeador.actividades_recursos || "",
        fecha: planeador.fecha ? String(planeador.fecha).slice(0, 10) : "",
      };
    }
  });

  return filas;
};

export const construirPayloadPlaneadores = (planeadores) => planeadores.map((planeador) => ({
  unidad_tematica: String(planeador.unidad_tematica || "").trim(),
  estandar_competencia: String(planeador.estandar_competencia || "").trim(),
  contenido: String(planeador.contenido || "").trim(),
  actividades_recursos: String(planeador.actividades_recursos || "").trim(),
  fecha: planeador.fecha || null,
}));

export const validarFilasPlaneador = (planeadores) => ({
  filaSinFecha: planeadores.findIndex(
    (planeador) => filaTieneContenido(planeador) && !planeador.fecha
  ),
  filaSoloConFecha: planeadores.findIndex(
    (planeador) => !filaTieneContenido(planeador) && planeador.fecha
  ),
  filasDiligenciadas: planeadores.filter(filaTieneContenido).length,
});
