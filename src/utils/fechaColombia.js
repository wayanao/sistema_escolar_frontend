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
