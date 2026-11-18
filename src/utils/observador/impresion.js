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
import { formatearFechaHoraFirma } from "./firma";

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
 * Lo que puede imprimir un admin: **solo el documento general**.
 *
 * «Solo mis anotaciones» no tiene sentido para un coordinador, que no tiene
 * ninguna: le saldría siempre una hoja vacía. Decidido con el usuario el
 * 2026-09-10.
 *
 * Se deriva de la lista de arriba en vez de escribirse aparte, para que no
 * puedan decir cosas distintas del mismo reporte.
 */
export const OPCIONES_IMPRESION_ADMIN = OPCIONES_IMPRESION.filter(
  (opcion) => opcion.value === IMPRIMIR_TODO,
);

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

const CARGO_FIRMA_DIRECTOR = "Firma del Director de Grupo";

/**
 * Las firmas del pie, que **cambian según el reporte**. Decidido con el
 * usuario.
 *
 * El general lo firma quien responde por el curso; el propio, el profesor que
 * lo imprime. En los dos casos firma también el acudiente.
 *
 * `nombre` es el papel y `cargo` la etiqueta bajo la raya, igual que en la
 * pantalla vieja.
 *
 * `firmaDirector` (2026-11-18) solo llega en el impreso del admin:
 * `{ director_grupo, imagen }` de `GET /firmas/director-grupo/{id}`. Con él, la
 * raya lleva el nombre del director y, si la guardó en «Mi curso», su firma
 * encima. Sin él, la raya de siempre, para firmar a mano.
 *
 * La raya del acudiente se queda aunque haya firmado anotaciones en pantalla:
 * su firma de cada anotación va junto a ella, y la del pie es la del documento
 * completo.
 */
export function firmasObservador(opcion, profesor, firmaDirector = null) {
  const acudiente = { nombre: "Acudiente", cargo: "Firma del Acudiente" };

  if (opcion === IMPRIMIR_MIAS) {
    const nombre = `${profesor?.nombre || ""} ${profesor?.apellido || ""}`.trim();
    return [
      { nombre: nombre || "Profesor", cargo: "Firma del Profesor" },
      acudiente,
    ];
  }

  const director = String(firmaDirector?.director_grupo ?? "").trim();
  return [
    director
      ? { nombre: director, cargo: CARGO_FIRMA_DIRECTOR, imagen: firmaDirector?.imagen || null }
      : { nombre: "Director de grupo", cargo: CARGO_FIRMA_DIRECTOR },
    acudiente,
  ];
}

// --- Firmas guardadas en el impreso (2026-11-18) ------------------------------

export const MENSAJE_CARGANDO_FIRMAS = "Cargando las firmas…";

export const MENSAJE_ERROR_FIRMAS =
  "No se pudieron cargar las firmas. Si imprimes ahora, salen las rayas vacías para firmar a mano.";

/** Las firmas del acudiente para imprimir, por `anotacion_id`. Lo que no sea
 * una lista queda en un objeto vacío: el impreso sale sin firmas, como antes. */
export function firmasPorAnotacion(firmas) {
  const porAnotacion = {};
  (Array.isArray(firmas) ? firmas : []).forEach((firma) => {
    if (firma?.anotacion_id != null) porAnotacion[firma.anotacion_id] = firma;
  });
  return porAnotacion;
}

/**
 * Lo que va junto a la firma del acudiente en el papel: quién firmó, con su
 * documento **completo**, cuándo y ante quién.
 *
 * En pantalla el documento sale enmascarado (`textoSelloFirma`); el impreso es
 * el documento oficial que va a la carpeta, y lleva el documento entero (P3 de
 * `FIRMA_OBSERVADOR.md`).
 */
export function textoFirmaImpresa(firma) {
  if (!firma) return "";
  return [
    `Firmó ${firma.firmante_nombre} (${firma.firmante_parentesco})`,
    [firma.firmante_tipo_documento, firma.firmante_documento].filter(Boolean).join(" "),
    formatearFechaHoraFirma(firma.firmada_en),
    firma.tomada_por_nombre ? `ante ${firma.tomada_por_nombre}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** El aviso para el admin, antes de imprimir y solo en pantalla, cuando el
 * director de grupo no ha guardado su firma. Sin director asignado no hay a
 * quién pedírsela: no avisa. */
export function avisoSinFirmaDirector(firmaDirector) {
  const director = String(firmaDirector?.director_grupo ?? "").trim();
  if (!director || firmaDirector?.imagen) return "";
  return `Sale sin la firma del director de grupo (${director}). Cada director de grupo pone la suya desde «Mi curso».`;
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
