// Tamaños de papel que una plantilla puede fijar para sus impresos. Sin tamaño
// (valor vacío) el documento se adapta al papel que se elija en la ventana de
// imprimir, que es el comportamiento de siempre.
//
// Fijarlo sirve cuando el papel del colegio no está entre los que ofrece
// "Guardar como PDF" de Chrome: el oficio colombiano (21,6 × 33 cm) no está, y
// su opción larga es Legal (35,6 cm), que al imprimirse en oficio se corta abajo
// o se achica.
export const TAMANOS_PAPEL = [
  { valor: "carta", etiqueta: "Carta (21,6 × 27,9 cm)", anchoMm: 215.9, altoMm: 279.4 },
  { valor: "oficio", etiqueta: "Oficio (21,6 × 33 cm)", anchoMm: 215.9, altoMm: 330.2 },
  { valor: "legal", etiqueta: "Legal (21,6 × 35,6 cm)", anchoMm: 215.9, altoMm: 355.6 },
  { valor: "a4", etiqueta: "A4 (21 × 29,7 cm)", anchoMm: 210, altoMm: 297 },
];

export function obtenerTamanoPapel(config = {}) {
  return TAMANOS_PAPEL.find((tamano) => tamano.valor === config.tamano_papel) || null;
}

// Regla que fija la hoja al imprimir. Solo el tamaño: el margen de la hoja
// sigue viniendo de print.css.
export function reglaTamanoPapel(tamano) {
  if (!tamano) return "";
  return `@media print { @page { size: ${tamano.anchoMm}mm ${tamano.altoMm}mm; } }`;
}
