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
    [NIVEL_PRIMARIA]: null,
};

/** Tipo de evaluación que un nivel exige, o `null` si el nivel es libre o no está definido. */
export const tipoEvaluacionForzado = (nivel) =>
    TIPO_EVALUACION_FORZADO_POR_NIVEL[nivel] || null;

/** `true` si el curso es de preescolar. */
export const esNivelPreescolar = (nivel) => nivel === NIVEL_PREESCOLAR;
