/**
 * Reglas de negocio por nivel académico de un curso (preescolar/primaria).
 *
 * Espejo de `app/core/nivel_academico.py` en el backend: centraliza qué exige
 * cada nivel para no repetir el condicional en cada pantalla. El servidor es
 * quien de verdad garantiza estas reglas al guardar; aquí solo reflejan la
 * experiencia (ocultar controles que no aplican, preseleccionar el modo
 * correcto).
 *
 * Sin HTTP, sin React y sin DOM.
 */

export const NIVEL_PREESCOLAR = "preescolar";
export const NIVEL_PRIMARIA = "primaria";

const TIPO_EVALUACION_FORZADO_POR_NIVEL = {
    [NIVEL_PREESCOLAR]: "desarrollo",
    [NIVEL_PRIMARIA]: "numerica",
};

/**
 * Tipo de evaluación que un nivel exige, o `null` solo cuando el curso no
 * tiene nivel definido -único caso libre-. Ningún nivel definido es libre:
 * preescolar fuerza "desarrollo" y primaria fuerza "numerica".
 */
export const tipoEvaluacionForzado = (nivel) =>
    TIPO_EVALUACION_FORZADO_POR_NIVEL[nivel] || null;

/** `true` si el curso es de preescolar. */
export const esNivelPreescolar = (nivel) => nivel === NIVEL_PREESCOLAR;

// ---------------------------------------------------------------------------
// Asistencia por jornada (preescolar)
// ---------------------------------------------------------------------------

/** Nombre reservado de la materia usada para tomar asistencia por jornada
 * completa en preescolar. Espejo de
 * `app.core.nivel_academico.NOMBRE_MATERIA_ASISTENCIA_JORNADA`. */
export const NOMBRE_MATERIA_ASISTENCIA_JORNADA = "ASISTENCIA DIARIA";

/** `true` si el nombre de materia es el reservado para asistencia por
 * jornada completa. */
export const esAsignacionDeJornada = (nombreMateria) =>
    String(nombreMateria || "").trim().toUpperCase() === NOMBRE_MATERIA_ASISTENCIA_JORNADA;

const NIVELES_QUE_EXIGEN_JORNADA = new Set([NIVEL_PREESCOLAR]);

/**
 * `true` si, según el nivel del curso, esta asignación NO es válida para
 * registrar asistencia -por ejemplo, una materia real en un curso
 * preescolar, que exige la asignación reservada de jornada en su lugar.
 *
 * Espejo de `app.core.nivel_academico.asistencia_rechazada_por_nivel`. Es
 * solo una ayuda de experiencia para detectarlo temprano, antes de que el
 * profesor marque asistencia; el servidor sigue siendo quien de verdad
 * garantiza la regla al guardar.
 */
export const asistenciaRechazadaPorNivel = (nivel, nombreMateria) => {
    if (!NIVELES_QUE_EXIGEN_JORNADA.has(nivel)) return false;
    return !esAsignacionDeJornada(nombreMateria);
};

/** Mismo texto que ve el profesor si intenta guardar de todas formas.
 * Espejo de `app.core.nivel_academico.MENSAJE_ASISTENCIA_REQUIERE_JORNADA`. */
export const MENSAJE_ASISTENCIA_REQUIERE_JORNADA =
    'Este curso es de preescolar. Usa la asignación "Asistencia diaria" ' +
    "para registrar asistencia.";
