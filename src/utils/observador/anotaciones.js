/**
 * Contratos puros del observador del estudiante unificado.
 *
 * Sin HTTP, sin React y sin DOM. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 */

import { NIVEL_PREESCOLAR, NIVEL_PRIMARIA } from "../nivelAcademico";

// ---------------------------------------------------------------------------
// Periodo: etiqueta, nunca filtro obligatorio
// ---------------------------------------------------------------------------

/** Valor del selector que pide el año entero. Es el que viene por defecto:
 * cambiar de periodo no puede ocultar historial (invariante 4). */
export const PERIODO_TODOS = "todos";

export const OPCIONES_PERIODO_OBSERVADOR = [
  { value: PERIODO_TODOS, label: "Todos" },
  { value: "1", label: "Periodo 1" },
  { value: "2", label: "Periodo 2" },
  { value: "3", label: "Periodo 3" },
  { value: "4", label: "Periodo 4" },
];

/**
 * El periodo que viaja al servidor, o `null` para pedir el año entero.
 *
 * Devuelve `null` ante cualquier valor que no sea un periodo real -"todos",
 * vacío, texto o un número fuera de 1-4-, porque el servidor rechaza con 422
 * lo que se salga de ese rango y quedarse sin bitácora por una etiqueta rota
 * sería peor que enseñarla entera.
 */
export function periodoParaConsulta(valor) {
  const numero = Number.parseInt(valor, 10);
  if (Number.isNaN(numero) || numero < 1 || numero > 4) return null;
  return numero;
}

/** Cómo se nombra el periodo dentro de una anotación: "P1". Vacío si la
 * anotación no lo trae. */
export function formatearPeriodoAnotacion(periodo) {
  const numero = Number.parseInt(periodo, 10);
  return Number.isNaN(numero) ? "" : `P${numero}`;
}

// ---------------------------------------------------------------------------
// Las tres dimensiones de siempre
// ---------------------------------------------------------------------------

/** Los tres campos del observador, en el orden en que se muestran. Se
 * mantienen los mismos que la pantalla vieja (decisión 7 del documento). */
export const DIMENSIONES_OBSERVADOR = [
  { campo: "conductual", titulo: "Conductual" },
  { campo: "cognitivo", titulo: "Cognitivo" },
  { campo: "lenguaje", titulo: "Lenguaje" },
];

/**
 * Las anotaciones repartidas por dimensión, que es la vista principal.
 *
 * Una anotación aparece bajo **cada dimensión que tenga texto**: si solo trae
 * `conductual`, solo sale en ese bloque. Los bloques sin nada no se devuelven,
 * para no pintar títulos huecos.
 *
 * Conserva el orden en que llegan las anotaciones -el servidor las manda de la
 * más nueva a la más vieja- y no vuelve a ordenarlas.
 */
export function agruparAnotacionesPorDimension(anotaciones) {
  const lista = anotaciones || [];

  return DIMENSIONES_OBSERVADOR.map(({ campo, titulo }) => ({
    campo,
    titulo,
    entradas: lista
      .map((anotacion) => ({
        anotacion,
        texto: String(anotacion?.[campo] || "").trim(),
      }))
      .filter((entrada) => entrada.texto.length > 0),
  })).filter((grupo) => grupo.entradas.length > 0);
}

/**
 * Las dimensiones de **una** anotación que traen texto, con su título.
 *
 * Es lo que necesita la vista por fecha, donde una anotación es **una fila** que
 * enumera sus dimensiones: «Conductual: se para mucho.». En la vista por
 * dimensión pasa lo contrario -la anotación se reparte entre varios bloques-, y
 * de eso se encarga `agruparAnotacionesPorDimension`.
 *
 * Los dos son el **mismo dato pintado de dos maneras**: cambiar de vista no
 * puede provocar otra petición. Es el invariante 1.
 */
export function dimensionesConTextoDeAnotacion(anotacion) {
  return DIMENSIONES_OBSERVADOR
    .map(({ campo, titulo }) => ({
      campo,
      titulo,
      texto: String(anotacion?.[campo] || "").trim(),
    }))
    .filter((dimension) => dimension.texto.length > 0);
}

/**
 * Las anotaciones en orden cronológico, la más nueva primero.
 *
 * **No reordena**: el servidor ya las manda así, con las heredadas -que no
 * tienen fecha- al final. Solo descarta las que no tienen nada escrito, que no
 * deberían existir pero tampoco deberían pintar una tarjeta vacía.
 */
export function anotacionesEnOrdenCronologico(anotaciones) {
  return (anotaciones || []).filter(
    (anotacion) => dimensionesConTextoDeAnotacion(anotacion).length > 0,
  );
}

// ---------------------------------------------------------------------------
// Las dos maneras de mirar la misma bitácora
// ---------------------------------------------------------------------------

export const AGRUPACION_DIMENSION = "dimension";
export const AGRUPACION_FECHA = "fecha";

export const OPCIONES_AGRUPACION = [
  { value: AGRUPACION_DIMENSION, label: "Por dimensión" },
  { value: AGRUPACION_FECHA, label: "Por fecha" },
];

// ---------------------------------------------------------------------------
// Cómo se presenta una anotación
// ---------------------------------------------------------------------------

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Texto que se muestra cuando la anotación no tiene fecha. */
export const SIN_FECHA = "Sin fecha";

/**
 * La fecha de una anotación, corta: "20/mar".
 *
 * Las heredadas de la tabla vieja no tienen fecha -el modelo anterior nunca la
 * guardó- y llegan en `null`. Se dice "Sin fecha" en vez de inventar una: el
 * servidor ya las manda al final de la lista por eso mismo.
 */
export function formatearFechaAnotacion(valor) {
  if (!valor) return SIN_FECHA;

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return SIN_FECHA;

  return `${fecha.getDate()}/${MESES[fecha.getMonth()]}`;
}

// ---------------------------------------------------------------------------
// El título de la página
// ---------------------------------------------------------------------------

const ETIQUETA_NIVEL = {
  [NIVEL_PREESCOLAR]: "Preescolar",
  [NIVEL_PRIMARIA]: "Primaria",
};

/**
 * Cómo se nombra el nivel del curso en el título. Son **tres** casos, no dos:
 * preescolar, primaria y un curso sin nivel, que no pone nada -al decidirlo
 * había 20 cursos así en un solo colegio-.
 */
export function etiquetaNivelObservador(nivel) {
  return ETIQUETA_NIVEL[nivel] || "";
}

/**
 * El título de la bitácora: "PEPITO PÉREZ · Primaria".
 *
 * El nivel va **una sola vez aquí** y no en cada anotación, porque toda la
 * página es el mismo niño del mismo curso. La materia no aparece: se decidió
 * no mostrarla ni pedirla, ver el documento.
 */
export function titularObservador({ nombre, apellido, nivel } = {}) {
  const alumno = `${String(nombre || "").trim()} ${String(apellido || "").trim()}`.trim();
  const etiqueta = etiquetaNivelObservador(nivel);

  if (!alumno) return etiqueta;
  return etiqueta ? `${alumno} · ${etiqueta}` : alumno;
}
