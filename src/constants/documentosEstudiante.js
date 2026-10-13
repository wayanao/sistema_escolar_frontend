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

// Lo que salió de la ficha del estudiante y pasó a la entrevista de admisión
// (decisión 6, paso E6): solo sirve para admitir. Al matricular se copia a la
// ficha, y la ficha lo muestra de solo lectura en "Datos de admisión". El
// orden es el de `COLUMNAS_COPIADAS_A_ESTUDIANTE` en el backend.
export const DATOS_DE_ADMISION_EN_LA_FICHA = [
    { campo: "colegio_anterior", etiqueta: "Colegio anterior" },
    { campo: "anio_cursado_anterior", etiqueta: "Año cursado" },
    { campo: "pre_escolar_anterior", etiqueta: "Preescolar" },
    { campo: "ebp_anterior", etiqueta: "EBP" },
    { campo: "motivo_retiro_anterior", etiqueta: "Motivo del retiro" },
    { campo: "paz_salvo_anterior", etiqueta: "Paz y salvo" },
    { campo: "ocupacion_padre", etiqueta: "Ocupación del padre" },
    { campo: "ocupacion_madre", etiqueta: "Ocupación de la madre" },
];
