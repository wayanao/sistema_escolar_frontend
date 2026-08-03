export function crearEstadoGuardadoObservacion({
  cargando = true,
  guardado = false,
  modificado = false,
  guardadoEn = null,
} = {}) {
  return { cargando, guardado, modificado, guardadoEn };
}

export function normalizarObservacionGuardada(observacion) {
  const conductual = observacion.conductual || "";
  const cognitivo = observacion.cognitivo || "";
  const lenguaje = observacion.lenguaje || "";
  const tieneObservacion = [conductual, cognitivo, lenguaje].some(
    (valor) => String(valor || "").trim().length > 0,
  );

  return { conductual, cognitivo, lenguaje, tieneObservacion };
}

export function construirGuardadoObservacion({
  estudianteId,
  asignacionId,
  periodo,
  conductual,
  cognitivo,
  lenguaje,
}) {
  const valores = {
    conductual: conductual.trim(),
    cognitivo: cognitivo.trim(),
    lenguaje: lenguaje.trim(),
  };
  const dimensionesDiligenciadas = Object.values(valores).filter(Boolean).length;

  return {
    valores,
    dimensionesDiligenciadas,
    payload: {
      estudiante_id: estudianteId,
      asignacion_id: parseInt(asignacionId),
      periodo,
      ...valores,
    },
  };
}
