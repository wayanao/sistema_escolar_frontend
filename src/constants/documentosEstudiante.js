/**
 * Opciones de la ficha del estudiante que también usa la admisión.
 *
 * Las comparten el formulario del estudiante y los de la entrevista de
 * admisión: al matricular, lo del aspirante pasa a la ficha y tiene que caber
 * en las mismas opciones. Por eso viven aquí y no copiadas en cada módulo.
 * Ver docs/funcionalidades/ENTREVISTA_ADMISION.md.
 */

// Tipo de documento del estudiante (o del aspirante).
export const TIPOS_DOCUMENTO_ESTUDIANTE = [
    "Registro Civil",
    "Tarjeta de Identidad",
    "Cédula de Ciudadanía",
    "Cédula de Extranjería",
    "Otro",
];

// Paz y salvo del colegio anterior. Se guarda tal cual: "SI" o "NO".
export const OPCIONES_PAZ_Y_SALVO = ["SI", "NO"];
