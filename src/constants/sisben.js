/**
 * Opciones del SISBÉN y del lugar de residencia en la ficha del estudiante.
 *
 * Ver docs/funcionalidades/SISBEN_RESIDENCIA.md. La ficha la usan Estudiantes,
 * Años lectivos y Admisiones (al matricular), por eso viven aquí. El backend
 * valida lo mismo (`EstudianteCreate`); estas listas solo arman el formulario.
 */

// "Sin dato" es el de los estudiantes que ya existían: nadie lo preguntó aún.
export const OPCIONES_TIENE_SISBEN = [
  { valor: "", etiqueta: "Sin dato" },
  { valor: "si", etiqueta: "Sí" },
  { valor: "no", etiqueta: "No" },
];

// SISBÉN IV: el grupo y lo que significa, como lo nombra el certificado.
export const GRUPOS_SISBEN = [
  { valor: "A", etiqueta: "A: pobreza extrema" },
  { valor: "B", etiqueta: "B: pobreza moderada" },
  { valor: "C", etiqueta: "C: vulnerable" },
  { valor: "D", etiqueta: "D: no pobre ni vulnerable" },
];

// Subgrupos del SISBÉN IV: A1 a A5, B1 a B7, C1 a C18 y D1 a D21.
const ULTIMO_SUBGRUPO = { A: 5, B: 7, C: 18, D: 21 };

export const SUBGRUPOS_SISBEN = Object.freeze(
  Object.fromEntries(
    Object.entries(ULTIMO_SUBGRUPO).map(([grupo, ultimo]) => [
      grupo,
      Array.from({ length: ultimo }, (_, indice) => `${grupo}${indice + 1}`),
    ]),
  ),
);

// Nivel del SISBÉN III, el anterior, para quien solo tenga ese certificado.
export const NIVELES_SISBEN = ["1", "2", "3"];

export const ZONAS_RESIDENCIA = [
  { valor: "urbana", etiqueta: "Urbana" },
  { valor: "rural", etiqueta: "Rural" },
];
