import { TIPOS_DOCUMENTO_ACUDIENTE } from "../../constants/documentosEstudiante";
import { formatearFechaAnotacion, SIN_FECHA } from "./anotaciones";

/**
 * Contratos puros de la firma del acudiente en el observador.
 *
 * Ver `docs/funcionalidades/FIRMA_OBSERVADOR.md` (aquí y, el principal, en el
 * backend). Sin HTTP, sin React y sin DOM: quién firma, qué se envía, el texto
 * del sello y cuál es la siguiente anotación pendiente.
 *
 * **Nada de aquí es la regla.** Quién puede firmar, la fecha, la hora y el
 * testigo los decide el servidor; esto solo arma lo que la pantalla enseña y
 * envía.
 */

/** Los dos de la ficha -para que el papá y la mamá sugeridos encajen en una
 * opción- y los que puede traer otro acudiente. */
export const TIPOS_DOCUMENTO_FIRMANTE = [
  ...TIPOS_DOCUMENTO_ACUDIENTE,
  "Pasaporte",
  "PPT",
  "Otro",
];

/** Ideas para el campo de parentesco. Es texto libre: no se limita a esto. */
export const SUGERENCIAS_PARENTESCO = [
  "Madre",
  "Padre",
  "Abuela",
  "Abuelo",
  "Tía",
  "Tío",
  "Hermana",
  "Hermano",
  "Acudiente",
];

/** Los mismos límites que el servidor (`FirmaAnotacionCreate`). */
export const MAX_NOMBRE_FIRMANTE = 150;
export const MAX_DATO_FIRMANTE = 50;

export const FIRMANTE_VACIO = Object.freeze({
  nombre: "",
  tipoDocumento: TIPOS_DOCUMENTO_ACUDIENTE[0],
  documento: "",
  parentesco: "",
});

export const MENSAJE_FIRMA_FALLO =
  "No se pudo guardar la firma. Revisa la conexión e intenta de nuevo.";
export const MENSAJE_FIRMA_DATOS =
  "Revisa los datos de quien firma y la firma, e intenta de nuevo.";

/** Sin espacios al principio, al final ni repetidos, igual que el servidor. */
function limpiar(texto) {
  return String(texto ?? "").split(/\s+/).filter(Boolean).join(" ");
}

/** Un firmante de `GET /observador/{id}/firmantes-sugeridos`, con la forma del
 * formulario. Si la ficha no tiene su tipo de documento, queda el primero. */
export function firmanteDesdeSugerido(sugerido) {
  return {
    nombre: sugerido?.nombre || "",
    tipoDocumento: sugerido?.tipo_documento || FIRMANTE_VACIO.tipoDocumento,
    documento: sugerido?.documento || "",
    parentesco: sugerido?.parentesco || "",
  };
}

/** Las opciones del tipo de documento. Si la ficha trae un tipo que no está en
 * la lista, se añade: el formulario nunca puede borrar lo que vino de ella. */
export function opcionesTipoDocumento(actual) {
  const valor = limpiar(actual);
  return valor && !TIPOS_DOCUMENTO_FIRMANTE.includes(valor)
    ? [...TIPOS_DOCUMENTO_FIRMANTE, valor]
    : TIPOS_DOCUMENTO_FIRMANTE;
}

/** Lo primero que falta para poder guardar, en el orden de la pantalla, o
 * `null` si está todo. */
export function faltaParaFirmar({ firmante, imagen, leida }) {
  if (!limpiar(firmante?.nombre)) return "Escribe el nombre de quien firma.";
  if (!limpiar(firmante?.tipoDocumento)) return "Elige el tipo de documento.";
  if (!limpiar(firmante?.documento)) return "Escribe el número de documento.";
  if (!limpiar(firmante?.parentesco)) return "Escribe el parentesco.";
  if (!imagen) return "Falta la firma en el recuadro.";
  if (!leida) return "Confirma que el acudiente leyó lo que va a firmar.";
  return null;
}

function datosDelFirmante(firmante) {
  return {
    firmante_nombre: limpiar(firmante?.nombre),
    firmante_tipo_documento: limpiar(firmante?.tipoDocumento),
    firmante_documento: limpiar(firmante?.documento),
    firmante_parentesco: limpiar(firmante?.parentesco),
  };
}

/** El cuerpo de `POST /observador/anotaciones/{id}/firma`.
 *
 * **Ni quién toma la firma ni la hora viajan aquí**: los pone el servidor. La
 * `version` es la que trajo la bitácora; si la anotación cambió desde entonces,
 * el servidor rechaza la firma con 409. */
export function construirPayloadFirma({ firmante, imagen, version }) {
  return { ...datosDelFirmante(firmante), imagen, version };
}

/** El cuerpo de `POST /observador/{estudiante_id}/firmas`: una sola firma para
 * todo un periodo. Lleva **la lista exacta que se mostró**, cada una con su
 * versión, y no el número del periodo: el servidor no elige qué se firma. */
export function construirPayloadFirmaPeriodo({ firmante, imagen, anotaciones }) {
  return {
    ...datosDelFirmante(firmante),
    imagen,
    anotaciones: (anotaciones || []).map(({ id, version }) => ({ id, version })),
  };
}

function esPendiente(anotacion) {
  return Boolean(anotacion?.puede_firmar && !anotacion?.firma);
}

/** Las anotaciones de un periodo que todavía se pueden firmar, en el orden de
 * la bitácora. Son las que el acudiente ve y firma de una vez. */
export function pendientesDelPeriodo(anotaciones, periodo) {
  return (anotaciones || []).filter(
    (anotacion) => esPendiente(anotacion) && Number(anotacion.periodo) === Number(periodo),
  );
}

/** Los periodos que tienen algo por firmar, con cuántas anotaciones:
 * `[{ periodo, cantidad }]`, del primero al último. */
export function periodosConPendientes(anotaciones) {
  const cuenta = new Map();
  for (const anotacion of anotaciones || []) {
    if (!esPendiente(anotacion)) continue;
    const periodo = Number(anotacion.periodo);
    cuenta.set(periodo, (cuenta.get(periodo) || 0) + 1);
  }
  return [...cuenta.entries()]
    .sort(([a], [b]) => a - b)
    .map(([periodo, cantidad]) => ({ periodo, cantidad }));
}

/** Con qué periodo se abre "Firmar un periodo": el del selector si tiene algo
 * por firmar; si no, el primero que tenga. `null` si no hay nada. */
export function periodoParaFirmar(anotaciones, periodoSeleccionado) {
  const periodos = periodosConPendientes(anotaciones);
  const elegido = periodos.find(
    ({ periodo }) => String(periodo) === String(periodoSeleccionado),
  );
  return (elegido || periodos[0])?.periodo ?? null;
}

/** La siguiente anotación que todavía se puede firmar, en el orden de la
 * bitácora, sin contar la que se acaba de firmar. Para "Firmar la siguiente". */
export function siguientePendiente(anotaciones, firmadaId) {
  return (
    (anotaciones || []).find(
      (anotacion) =>
        anotacion?.puede_firmar && !anotacion?.firma && anotacion.id !== firmadaId,
    ) || null
  );
}

/** "27/oct/2026, 10:15", en la hora local de quien mira. */
export function formatearFechaHoraFirma(valor) {
  const diaYMes = formatearFechaAnotacion(valor);
  if (diaYMes === SIN_FECHA) return SIN_FECHA;

  const fecha = new Date(valor);
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${diaYMes}/${fecha.getFullYear()}, ${hora}:${minutos}`;
}

/** El sello de una anotación firmada: quién, con qué documento, cuándo y ante
 * quién. El documento llega ya enmascarado del servidor. */
export function textoSelloFirma(firma) {
  if (!firma) return "";
  const partes = [
    `Firmada por ${firma.firmante_nombre} (${firma.firmante_parentesco})`,
    [firma.firmante_tipo_documento, firma.firmante_documento_enmascarado]
      .filter(Boolean)
      .join(" "),
    formatearFechaHoraFirma(firma.firmada_en),
    firma.tomada_por_nombre ? `ante ${firma.tomada_por_nombre}` : "",
  ];
  return partes.filter(Boolean).join(" · ");
}

/** El mensaje de un fallo al firmar. Los textos del servidor ya están listos
 * para enseñar (403, 404, 409); un 422 de validación llega como lista, y eso no
 * se le enseña a nadie. */
export function mensajeErrorFirma(error) {
  const detalle = error?.response?.data?.detail;
  if (typeof detalle === "string" && detalle.trim()) return detalle;
  if (error?.response?.status === 422) return MENSAJE_FIRMA_DATOS;
  return MENSAJE_FIRMA_FALLO;
}

/** Un 409 dice que la anotación ya no está como se mostró -ya firmada o
 * cambiada-: hay que volver a pedir la bitácora. */
export function esConflictoDeFirma(error) {
  return error?.response?.status === 409;
}
