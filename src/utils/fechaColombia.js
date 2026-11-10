// La fecha de hoy en Colombia (AAAA-MM-DD), sin importar la zona del equipo.
//
// `new Date().toISOString()` da la fecha en UTC, cinco horas por delante de
// Colombia: desde las 7 p. m. devolvia la de mañana (un plan de clases hecho
// de noche proponia la fecha del dia siguiente). Es el mismo error que tenia el
// backend con la deuda; alla lo resuelve `app/core/fechas.py`. Ver "Hallazgos
// fuera de alcance" en sistema_escolar_api/docs/funcionalidades/ANIO_LECTIVO.md.

export const ZONA_HORARIA_COLOMBIA = "America/Bogota";

const formatoColombia = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA_COLOMBIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const fechaIsoColombia = (ahora = new Date()) => {
  const partes = Object.fromEntries(
    formatoColombia.formatToParts(ahora).map(({ type, value }) => [type, value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}`;
};

const formatoHoraColombia = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONA_HORARIA_COLOMBIA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const formatoDiaSemanaColombia = new Intl.DateTimeFormat("es-CO", {
  timeZone: ZONA_HORARIA_COLOMBIA,
  weekday: "long",
});

const formatoFechaLargaColombia = new Intl.DateTimeFormat("es-CO", {
  timeZone: ZONA_HORARIA_COLOMBIA,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const conMayuscula = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto);

/** Minutos desde la medianoche en Colombia (7:30 a. m. → 450). */
export const minutosDelDiaColombia = (ahora = new Date()) => {
  const partes = Object.fromEntries(
    formatoHoraColombia.formatToParts(ahora).map(({ type, value }) => [type, value]),
  );
  return Number(partes.hour) * 60 + Number(partes.minute);
};

/** El día de la semana en Colombia, con mayúscula inicial: «Lunes», «Miércoles», «Sábado». */
export const diaSemanaColombia = (ahora = new Date()) =>
  conMayuscula(formatoDiaSemanaColombia.format(ahora));

/** «Martes, 10 de noviembre», en Colombia. */
export const fechaLargaColombia = (ahora = new Date()) =>
  conMayuscula(formatoFechaLargaColombia.format(ahora));
