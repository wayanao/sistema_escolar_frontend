// Nombres de los cuadros del plan de clase. Ver
// docs/funcionalidades/NOMBRES_CUADROS_PLAN.md.
//
// **Los nombres y las ayudas originales viven solo aquí.** El backend guarda
// solo los cuadros que el colegio renombró (`GET /plan-de-clases/cuadros`) y
// revisa las claves; las pantallas del plan arman sus títulos con
// `nombresCuadrosPlan`. Si la lectura falla, se usan los originales y el
// profesor sigue planeando.
//
// Cuando un cuadro tenía dos nombres (uno en el formulario y otro en el
// detalle del admin), el original es el del formulario del profesor: decisión
// del usuario del 2026-10-31 (P1). "Actividad en clase" (`competencias`) no se
// renombra: ya no se escribe y solo aparece en planes viejos.
import {
  MAX_BYTES_IMAGEN_EVIDENCIA,
  MAX_BYTES_PDF_EVIDENCIA,
} from "./evidencias";

export const LARGO_NOMBRE_CUADRO = 60;
export const LARGO_AYUDA_CUADRO = 150;

const aMegas = (bytes) => Math.round(bytes / (1024 * 1024));

export const RECIBE_CUADRO = Object.freeze({
  texto:
    "Texto. Acepta enlaces: los de YouTube se reproducen dentro de la clase y los demás se abren en otra pestaña.",
  archivo: `Un archivo: imagen PNG, JPG o WEBP de hasta ${aMegas(MAX_BYTES_IMAGEN_EVIDENCIA)} MB, o un PDF de hasta ${aMegas(MAX_BYTES_PDF_EVIDENCIA)} MB.`,
});

export const AVISO_RENOMBRAR_CUADROS =
  "Cambiar el nombre no cambia lo que recibe el cuadro ni borra lo escrito. Los planes que ya existen se verán con el nombre nuevo.";

/** En el orden del formulario del profesor. */
export const CUADROS_PLAN = Object.freeze([
  {
    clave: "unidad",
    tipo: "texto",
    nombre: "Unidad",
    ayuda: "Nombre de la unidad o eje de trabajo",
  },
  {
    clave: "estandar",
    tipo: "texto",
    nombre: "Estándar / Lineamientos curriculares",
    ayuda: "Estándar, lineamientos curriculares o referente curricular",
  },
  {
    clave: "tema",
    tipo: "texto",
    nombre: "Tema",
    ayuda: "Tema central de la clase",
  },
  {
    clave: "proposito",
    tipo: "texto",
    nombre: "Logro",
    ayuda: "Qué se espera que logren los estudiantes",
  },
  {
    clave: "clase",
    tipo: "texto",
    nombre: "Actividad inicial",
    ayuda: "Cómo inicia la clase y qué hacen los estudiantes",
  },
  {
    clave: "dba",
    tipo: "texto",
    nombre: "Desarrollo cognitivo",
    ayuda: "Proceso, habilidad o DBA relacionado",
  },
  {
    clave: "actividad_casa",
    tipo: "texto",
    nombre: "Actividad en casa",
    ayuda: "Refuerzo, consulta o producción para casa",
  },
  { clave: "imagen1", tipo: "archivo", nombre: "Actividad a desarrollar", ayuda: "" },
  { clave: "imagen2", tipo: "archivo", nombre: "Evidencia de actividad en casa", ayuda: "" },
]);

const ORIGINALES = Object.fromEntries(CUADROS_PLAN.map((cuadro) => [cuadro.clave, cuadro]));

const textoRecortado = (valor) => (typeof valor === "string" ? valor.trim() : "");

/**
 * Los cuadros renombrados de la respuesta del backend, `{clave, nombre,
 * ayuda}`. Descarta lo que no sirve: una clave desconocida, un nombre vacío o
 * una respuesta sin lista.
 */
export function normalizarCuadrosPersonalizados(respuesta) {
  const lista = Array.isArray(respuesta?.cuadros) ? respuesta.cuadros : [];
  return lista
    .filter((cuadro) => ORIGINALES[cuadro?.clave] && textoRecortado(cuadro.nombre))
    .map((cuadro) => ({
      clave: cuadro.clave,
      nombre: textoRecortado(cuadro.nombre),
      ayuda: ORIGINALES[cuadro.clave].tipo === "archivo" ? "" : textoRecortado(cuadro.ayuda),
    }));
}

/**
 * Los nueve cuadros por clave, con el nombre y la ayuda que se muestran y los
 * originales: `cuadros.proposito.nombre`, `cuadros.imagen1.nombreOriginal`...
 */
export function nombresCuadrosPlan(personalizados = []) {
  const porClave = Object.fromEntries(personalizados.map((cuadro) => [cuadro.clave, cuadro]));
  return Object.fromEntries(
    CUADROS_PLAN.map((original) => {
      const propio = porClave[original.clave];
      return [
        original.clave,
        {
          clave: original.clave,
          tipo: original.tipo,
          nombre: propio?.nombre || original.nombre,
          ayuda: propio ? propio.ayuda : original.ayuda,
          nombreOriginal: original.nombre,
          ayudaOriginal: original.ayuda,
        },
      ];
    }),
  );
}

export const NOMBRES_CUADROS_ORIGINALES = Object.freeze(nombresCuadrosPlan());

/** Lo que se edita en la ventana del admin: `{clave: {nombre, ayuda}}`. */
export function crearBorradorCuadros(cuadros = NOMBRES_CUADROS_ORIGINALES) {
  return Object.fromEntries(
    CUADROS_PLAN.map(({ clave }) => [
      clave,
      { nombre: cuadros[clave].nombre, ayuda: cuadros[clave].ayuda },
    ]),
  );
}

const claveDeNombre = (nombre) => textoRecortado(nombre).toLocaleLowerCase("es-CO");

/**
 * Errores del borrador por cuadro y campo: `{clave: {nombre?, ayuda?}}`.
 * Vacío si se puede guardar. Mira los nueve a la vez: dos cuadros no pueden
 * llamarse igual (el backend no lo puede revisar, solo ve los renombrados).
 */
export function validarBorradorCuadros(borrador) {
  const conteo = {};
  CUADROS_PLAN.forEach(({ clave }) => {
    const nombre = claveDeNombre(borrador[clave]?.nombre);
    if (nombre) conteo[nombre] = (conteo[nombre] || 0) + 1;
  });

  const errores = {};
  CUADROS_PLAN.forEach(({ clave, tipo }) => {
    const nombre = textoRecortado(borrador[clave]?.nombre);
    const ayuda = textoRecortado(borrador[clave]?.ayuda);
    const propios = {};
    if (!nombre) propios.nombre = "Escribe un nombre.";
    else if (nombre.length > LARGO_NOMBRE_CUADRO) {
      propios.nombre = `Máximo ${LARGO_NOMBRE_CUADRO} caracteres.`;
    } else if (conteo[claveDeNombre(nombre)] > 1) {
      propios.nombre = "Otro cuadro ya se llama así.";
    }
    if (tipo === "texto" && ayuda.length > LARGO_AYUDA_CUADRO) {
      propios.ayuda = `Máximo ${LARGO_AYUDA_CUADRO} caracteres.`;
    }
    if (Object.keys(propios).length) errores[clave] = propios;
  });
  return errores;
}

/**
 * El cuerpo de `PUT /admin/plan-de-clases/cuadros`: la lista completa de
 * cuadros que quedan distintos del original, recortados. Escribir a mano el
 * nombre original equivale a no renombrar; sin ninguno, vuelve a los
 * originales.
 */
export function armarEnvioCuadros(borrador) {
  const cuadros = CUADROS_PLAN.map((original) => {
    const nombre = textoRecortado(borrador[original.clave]?.nombre);
    const ayuda = original.tipo === "archivo" ? "" : textoRecortado(borrador[original.clave]?.ayuda);
    return { clave: original.clave, nombre, ayuda };
  }).filter(
    (cuadro) =>
      cuadro.nombre !== ORIGINALES[cuadro.clave].nombre ||
      cuadro.ayuda !== ORIGINALES[cuadro.clave].ayuda,
  );
  return { cuadros };
}
