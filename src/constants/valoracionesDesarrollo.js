/**
 * Escala de valoración del desarrollo infantil.
 *
 * `valor` es la equivalencia numérica de cada carita. Existe para que una
 * materia evaluada por desarrollo pueda promediarse y entrar en el puesto del
 * curso, que se calcula sobre `boletin_cabecera.definitiva`. El número viaja al
 * backend y se guarda; la interfaz sigue mostrando siempre la carita.
 *
 * El orden es descendente por `valor` y la presentación depende de él.
 */
export const VALORACIONES_DESARROLLO = [
    { value: "destacado", label: "Destacado", emoji: "⭐", valor: 5 },
    { value: "logrado", label: "Logrado", emoji: "😀", valor: 4 },
    { value: "proceso", label: "En proceso", emoji: "🙂", valor: 3 },
    { value: "apoyo", label: "Requiere acompañamiento", emoji: "🧩", valor: 2 },
];
