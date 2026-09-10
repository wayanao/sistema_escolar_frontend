/**
 * Un color por profesor, para distinguir de un vistazo quién escribió cada
 * anotación.
 *
 * Sin HTTP, sin React y sin DOM.
 *
 * **El color sale del `profesor_id`, no del nombre.** El id es estable: dos
 * profesoras que se llamen igual no comparten color, y cambiarle el nombre a
 * una no le cambia el suyo. El mismo profesor sale del mismo color en la
 * bitácora de todos sus alumnos, que es lo que hace que el color signifique
 * algo.
 *
 * **El color no es la única señal**: el nombre sigue escrito al lado. Quien no
 * distinga dos tonos lee exactamente lo mismo que antes.
 */

/**
 * Las clases van escritas **enteras y literales** porque Tailwind lee el código
 * fuente para decidir qué CSS genera. Componerlas -`text-${color}-700`- las
 * dejaría fuera de la hoja de estilos y el nombre saldría sin color, sin ningún
 * error que lo avisara.
 */
export const COLORES_PROFESOR = [
  "text-purple-700",
  "text-emerald-700",
  "text-blue-700",
  "text-amber-700",
  "text-rose-700",
  "text-teal-700",
  "text-indigo-700",
  "text-orange-700",
];

/**
 * El color de un profesor. Reparto por resto (`id % 8`), medido contra la base
 * real antes de elegirlo.
 *
 * En los **16 cursos** de los dos colegios no hay ni un solo caso de dos
 * profesores del mismo curso con el mismo color. Un hash multiplicativo -que
 * parecía más fino- daba **6 cursos con choque**: los profesores de un mismo
 * curso tienen ids seguidos (39, 40, 42, 44), y el resto los separa uno a uno
 * mientras que el hash los revuelve y los junta. Lo simple gana aquí, y se
 * comprobó en vez de suponerlo.
 *
 * Ocho colores sobran para lo que cabe en una pantalla: el curso con más
 * docentes tiene **5**.
 *
 * Sin `profesor_id` devuelve el color neutro: nunca se queda sin clase.
 */
export function colorDeProfesor(profesorId) {
  const id = Number.parseInt(profesorId, 10);
  if (Number.isNaN(id)) return COLOR_SIN_PROFESOR;

  return COLORES_PROFESOR[Math.abs(id) % COLORES_PROFESOR.length];
}

/** Para una anotación sin autor reconocible. No debería ocurrir -`profesor_id`
 * es obligatorio en la tabla-, pero pintar «undefined» sin color es mejor que
 * reventar. */
export const COLOR_SIN_PROFESOR = "text-slate-700";
