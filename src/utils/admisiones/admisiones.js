// Contrato puro de la lista de admisiones (entrevista de admisión, paso E4):
// leer la respuesta del backend, nombrar los resultados, filtrar y armar los
// mensajes de error. Sin HTTP, sin React, sin DOM y sin almacenamiento.
//
// El backend decide quién se puede registrar, editar o matricular (`editable`
// y sus 409); aquí solo se lee lo que responde.
// Ver docs/funcionalidades/ENTREVISTA_ADMISION.md y, para el contrato,
// sistema_escolar_api/docs/API_ENDPOINTS.md ("Admisiones").

export const RESULTADO_PENDIENTE = "pendiente";
export const RESULTADO_APROBADO = "aprobado";
export const RESULTADO_NO_APROBADO = "no_aprobado";

const ETIQUETAS_RESULTADO = {
  [RESULTADO_PENDIENTE]: "Pendiente",
  [RESULTADO_APROBADO]: "Aprobado",
  [RESULTADO_NO_APROBADO]: "No aprobado",
};

export const etiquetaResultado = (resultado) => ETIQUETAS_RESULTADO[resultado] ?? resultado;

// Las opciones del resultado, en el orden en que se muestran.
export const RESULTADOS = Object.freeze([
  RESULTADO_PENDIENTE,
  RESULTADO_APROBADO,
  RESULTADO_NO_APROBADO,
]);

export const FILTRO_TODOS = "todos";

export const FILTROS_RESULTADO = Object.freeze([
  { valor: FILTRO_TODOS, etiqueta: "Todos" },
  { valor: RESULTADO_PENDIENTE, etiqueta: "Pendientes" },
  { valor: RESULTADO_APROBADO, etiqueta: "Aprobados" },
  { valor: RESULTADO_NO_APROBADO, etiqueta: "No aprobados" },
]);

export const CONTEOS_VACIOS = Object.freeze({
  pendiente: 0,
  aprobado: 0,
  no_aprobado: 0,
  matriculado: 0,
  total: 0,
});

// `GET /anios-lectivos/{id}/admisiones`. `editable` solo es verdad si el
// backend lo dice con un booleano: ante la duda, solo consulta.
export function normalizarListaAdmisiones(respuesta) {
  return {
    anioLectivo: respuesta?.anio_lectivo ?? null,
    editable: respuesta?.editable === true,
    conteos: { ...CONTEOS_VACIOS, ...(respuesta?.conteos ?? {}) },
    admisiones: Array.isArray(respuesta?.admisiones) ? respuesta.admisiones : [],
  };
}

export const LISTA_ADMISIONES_VACIA = normalizarListaAdmisiones(null);

// Se filtra en el navegador sobre la lista que ya llegó: cambiar de filtro no
// cuesta otra petición. Los conteos son siempre de todo el año.
export function filtrarAdmisiones(admisiones, filtro) {
  if (!filtro || filtro === FILTRO_TODOS) return admisiones;
  return admisiones.filter((admision) => admision.resultado === filtro);
}

export const conteoDeFiltro = (conteos, filtro) =>
  filtro === FILTRO_TODOS ? conteos.total : conteos[filtro] ?? 0;

// El texto del backend tal cual. Un 422 de FastAPI llega como lista de
// errores; se unen sin el "Value error, " que antepone Pydantic.
export function mensajeDeErrorAdmision(error, respaldo) {
  const detalle = error?.response?.data?.detail;
  if (typeof detalle === "string" && detalle.trim()) return detalle;
  if (Array.isArray(detalle) && detalle.length > 0) {
    return detalle
      .map((item) => String(item?.msg ?? item).replace(/^Value error, /, ""))
      .join("\n");
  }
  return respaldo;
}
