/**
 * Contratos puros de la impresión del observador.
 *
 * Sin HTTP, sin React y sin DOM. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 *
 * **Se imprime lo que se está viendo**: el periodo que marque el selector y la
 * agrupación que esté puesta. Sin sorpresas.
 */

import { esAnotacionPropia } from "./formulario";
import { periodoParaConsulta } from "./anotaciones";

/** Las anotaciones de todos los profesores. Es el documento oficial que va a la
 * carpeta del alumno. */
export const IMPRIMIR_TODO = "todo";

/** Solo las de quien imprime, para una reunión con el acudiente. */
export const IMPRIMIR_MIAS = "mias";

export const OPCIONES_IMPRESION = [
  { value: IMPRIMIR_TODO, label: "Todo el observador" },
  { value: IMPRIMIR_MIAS, label: "Solo mis anotaciones" },
];

/**
 * Las anotaciones que entran en el impreso.
 *
 * Recibe **las que ya están en pantalla**, o sea las del periodo elegido: este
 * filtro solo decide de quién, nunca de cuándo.
 */
export function anotacionesParaImprimir(anotaciones, opcion, profesorId) {
  const lista = anotaciones || [];
  if (opcion !== IMPRIMIR_MIAS) return lista;

  return lista.filter((anotacion) => esAnotacionPropia(anotacion, profesorId));
}

/**
 * Las firmas del pie, que **cambian según el reporte**. Decidido con el
 * usuario.
 *
 * El general lo firma quien responde por el curso; el propio, el profesor que
 * lo imprime. En los dos casos firma también el acudiente.
 *
 * `nombre` es el papel y `cargo` la etiqueta bajo la raya, igual que en la
 * pantalla vieja: el documento se firma a mano, así que del director de grupo
 * no hace falta saber el nombre.
 */
export function firmasObservador(opcion, profesor) {
  const acudiente = { nombre: "Acudiente", cargo: "Firma del Acudiente" };

  if (opcion === IMPRIMIR_MIAS) {
    const nombre = `${profesor?.nombre || ""} ${profesor?.apellido || ""}`.trim();
    return [
      { nombre: nombre || "Profesor", cargo: "Firma del Profesor" },
      acudiente,
    ];
  }

  return [
    { nombre: "Director de grupo", cargo: "Firma del Director de Grupo" },
    acudiente,
  ];
}

/**
 * Cómo se nombra en el impreso el periodo que está puesto en pantalla.
 *
 * Reutiliza la misma validación que decide qué se le pide al servidor: todo lo
 * que no sea un periodo real -«Todos», vacío, o cualquier cosa rota- es el año
 * entero, porque es justo lo que la pantalla está enseñando. Sin esto, un valor
 * inesperado imprimiría «Periodo undefined» **en papel**.
 */
export function etiquetaPeriodoImpreso(periodo) {
  const numero = periodoParaConsulta(periodo);
  return numero === null ? "Año completo" : `Periodo ${numero}`;
}

/**
 * El subtítulo del impreso: de quién es y qué trozo del año sale.
 *
 * Que el periodo aparezca escrito no es adorno. El impreso se archiva y se
 * enseña meses después: sin él, nadie sabría si tiene delante el año entero o
 * un trozo.
 */
export function subtituloImpresion({ alumno, periodo } = {}) {
  return `Estudiante: ${alumno || ""} · ${etiquetaPeriodoImpreso(periodo)}`;
}

/** El título del impreso, según de quién sean las anotaciones. */
export function tituloImpresion(opcion) {
  return opcion === IMPRIMIR_MIAS
    ? "Observador del Estudiante — Anotaciones del docente"
    : "Observador del Estudiante";
}
