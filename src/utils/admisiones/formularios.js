// Contrato puro de los formularios de la admisión (paso E4): estado inicial,
// llenarlo desde el backend, los cuerpos que viajan y la validación previa.
// Sin HTTP, sin React, sin DOM.
//
// La validación de aquí es comodidad: el backend vuelve a validar todo (y
// manda). Los límites de texto son los `VARCHAR` de la tabla `admisiones`.

import { DATOS_DE_ADMISION_EN_LA_FICHA } from "../../constants/documentosEstudiante";
import { capitalizarNombreVisible, capitalizarPalabras, primeraMayuscula } from "../nombres";
import { RESULTADO_NO_APROBADO, RESULTADO_PENDIENTE } from "./admisiones";

// Lo que se pide al registrar (mismo orden que el backend).
export const CAMPOS_ASPIRANTE = Object.freeze([
  "nombre",
  "apellido",
  "tipo_documento",
  "documento_identidad",
  "fecha_nacimiento",
  "curso_id",
  "acudiente_nombre",
  "acudiente_parentesco",
  "acudiente_telefono",
  "autoriza_datos",
  "autoriza_nombre",
]);

// Lo que se agrega al editar: la entrevista.
export const CAMPOS_ENTREVISTA = Object.freeze([
  "fecha_entrevista",
  "entrevistador",
  "asistentes",
  "colegio_anterior",
  "anio_cursado_anterior",
  "pre_escolar_anterior",
  "ebp_anterior",
  "motivo_retiro_anterior",
  "paz_salvo_anterior",
  "ocupacion_padre",
  "ocupacion_madre",
  "vive_con",
  "expectativas",
  "observaciones",
]);

// Lo de la entrevista que va en las secciones que se abren y se cierran,
// junto a las preguntas del anexo (2026-10-20, a pedido del usuario):
// "Estudios anteriores" es una sección propia y lo de la familia va al inicio
// de la sección "Familia" del anexo. Quién, cuándo y quiénes asistieron siguen
// a la vista. Solo cambia dónde se ven: el cuerpo es el mismo.
export const CAMPOS_ESTUDIOS_ANTERIORES = Object.freeze([
  "colegio_anterior",
  "anio_cursado_anterior",
  "pre_escolar_anterior",
  "ebp_anterior",
  "paz_salvo_anterior",
  "motivo_retiro_anterior",
]);

export const CAMPOS_FAMILIA_ENTREVISTA = Object.freeze([
  "ocupacion_padre",
  "ocupacion_madre",
  "vive_con",
  "expectativas",
  "observaciones",
]);

// Cuántos de `campos` tienen algo escrito, para el "2 de 6" de su sección.
export function contarLlenos(formulario, campos) {
  const respondidas = campos.filter(
    (campo) => String(formulario?.[campo] ?? "").trim() !== "",
  ).length;
  return { respondidas, total: campos.length };
}

export const LIMITES_TEXTO = Object.freeze({
  nombre: 100,
  apellido: 100,
  tipo_documento: 50,
  documento_identidad: 20,
  acudiente_nombre: 150,
  acudiente_parentesco: 50,
  acudiente_telefono: 50,
  autoriza_nombre: 150,
  entrevistador: 150,
  asistentes: 250,
  colegio_anterior: 150,
  anio_cursado_anterior: 50,
  pre_escolar_anterior: 50,
  ebp_anterior: 50,
  paz_salvo_anterior: 10,
  ocupacion_padre: 100,
  ocupacion_madre: 100,
  vive_con: 250,
});

const TODOS_LOS_CAMPOS = [...CAMPOS_ASPIRANTE, ...CAMPOS_ENTREVISTA];

export function crearFormularioAdmision() {
  const formulario = Object.fromEntries(TODOS_LOS_CAMPOS.map((campo) => [campo, ""]));
  formulario.autoriza_datos = false;
  return formulario;
}

// Una admisión del backend, lista para los campos: sin `null` (un input
// controlado no los acepta) y el curso como texto, que es lo que da un select.
export function formularioDesdeAdmision(admision) {
  const formulario = crearFormularioAdmision();
  for (const campo of TODOS_LOS_CAMPOS) {
    const valor = admision?.[campo];
    if (campo === "autoriza_datos") formulario[campo] = valor === true;
    else formulario[campo] = valor === null || valor === undefined ? "" : String(valor);
  }
  return formulario;
}

const textoONulo = (valor) => {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
};

// Pedido del usuario el 2026-11-05: que lo escrito lleve sus mayúsculas.
// Nombres de personas, con mayúscula inicial en cada palabra, como se ven en
// las listas.
const CAMPOS_NOMBRE_PERSONA = new Set([
  "nombre",
  "apellido",
  "acudiente_nombre",
  "autoriza_nombre",
  "entrevistador",
]);

// El colegio anterior es un nombre propio: mayúscula en cada palabra y el resto
// como se escribió.
const CAMPOS_CADA_PALABRA = new Set(["colegio_anterior"]);

// Textos libres: primera letra en mayúscula. Lo demás (documento, teléfono,
// fechas y el paz y salvo, que es "SI" o "NO") va como se escribe.
const CAMPOS_TEXTO_LIBRE = new Set([
  "acudiente_parentesco",
  "asistentes",
  "anio_cursado_anterior",
  "pre_escolar_anterior",
  "ebp_anterior",
  "motivo_retiro_anterior",
  "ocupacion_padre",
  "ocupacion_madre",
  "vive_con",
  "expectativas",
  "observaciones",
]);

function valorDeCampo(formulario, campo) {
  if (campo === "autoriza_datos") return formulario.autoriza_datos === true;
  if (campo === "curso_id") {
    const curso = Number(formulario.curso_id);
    return Number.isInteger(curso) && curso > 0 ? curso : null;
  }
  if (CAMPOS_NOMBRE_PERSONA.has(campo)) {
    return textoONulo(capitalizarNombreVisible(formulario[campo]));
  }
  if (CAMPOS_CADA_PALABRA.has(campo)) return textoONulo(capitalizarPalabras(formulario[campo]));
  if (CAMPOS_TEXTO_LIBRE.has(campo)) return textoONulo(primeraMayuscula(formulario[campo]));
  return textoONulo(formulario[campo]);
}

const construir = (formulario, campos) =>
  Object.fromEntries(campos.map((campo) => [campo, valorDeCampo(formulario, campo)]));

// `POST /anios-lectivos/{id}/admisiones`: solo el aspirante.
export const construirCuerpoAspirante = (formulario) => construir(formulario, CAMPOS_ASPIRANTE);

// `PUT /admisiones/{id}`: el aspirante y la entrevista. Reemplaza todo.
export const construirCuerpoAdmision = (formulario) => construir(formulario, TODOS_LOS_CAMPOS);

export function validarAspirante(formulario) {
  const errores = {};
  if (!textoONulo(formulario.nombre)) errores.nombre = "Escribe el nombre.";
  if (!textoONulo(formulario.apellido)) errores.apellido = "Escribe los apellidos.";
  if (formulario.autoriza_datos !== true) {
    errores.autoriza_datos = "Sin la autorización de datos no se puede registrar al aspirante.";
  }
  if (!textoONulo(formulario.autoriza_nombre)) errores.autoriza_nombre = "Escribe quién autoriza.";
  return errores;
}

export function resultadoDesdeAdmision(admision) {
  return {
    resultado: admision?.resultado ?? RESULTADO_PENDIENTE,
    motivo_resultado: admision?.motivo_resultado ?? "",
  };
}

// `PUT /admisiones/{id}/resultado`. El motivo, con la primera letra en mayúscula.
export const construirCuerpoResultado = ({ resultado, motivo_resultado }) => ({
  resultado,
  motivo_resultado: textoONulo(primeraMayuscula(motivo_resultado)),
});

// "No aprobado" exige el motivo, como la base (no discriminación).
export function validarResultado({ resultado, motivo_resultado }) {
  if (resultado === RESULTADO_NO_APROBADO && !textoONulo(motivo_resultado)) {
    return { motivo_resultado: 'Para marcar "No aprobado" escribe el motivo.' };
  }
  return {};
}

// Paso E5: lo que la admisión pone en la ficha del estudiante al matricular.
// Los datos del aspirante y lo que pasó a la entrevista (decisión 6), solo si
// tienen algo: un vacío no borra lo que ya traiga la ficha (la de un
// exalumno). El curso viaja siempre, porque el de la ficha de un exalumno es
// de otro año.
const CAMPOS_PARA_LA_FICHA = Object.freeze([
  "nombre",
  "apellido",
  "tipo_documento",
  "documento_identidad",
  "fecha_nacimiento",
  ...DATOS_DE_ADMISION_EN_LA_FICHA.map(({ campo }) => campo),
]);

export function datosParaMatricular(admision) {
  const datos = {};
  for (const campo of CAMPOS_PARA_LA_FICHA) {
    const valor = admision?.[campo];
    if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
      datos[campo] = String(valor);
    }
  }
  datos.curso_id = admision?.curso_id ? String(admision.curso_id) : "";
  return datos;
}
