/**
 * Contratos puros de la lista de alumnos del observador.
 *
 * Sin HTTP, sin React y sin DOM.
 */

/** Encabezado de los alumnos cuyo curso no está definido. `estudiantes.curso_id`
 * es nulable, así que el caso existe aunque el servidor hoy no los devuelva:
 * su consulta los descarta por el mismo `JOIN` con el que se dan los permisos. */
export const SIN_CURSO = "Sin curso";

/**
 * Los alumnos agrupados por curso, conservando el orden en que llegan.
 *
 * El servidor los manda ya ordenados por curso y apellido, así que aquí no se
 * vuelve a ordenar nada: solo se parten en bloques.
 *
 * Agrupar no es adorno. Un profesor puede tener **81 alumnos** repartidos en
 * seis cursos -medido contra la base real-, y una lista plana de 81 nombres no
 * se lee.
 */
export function agruparAlumnosPorCurso(alumnos) {
  const grupos = [];
  const porCurso = new Map();

  (alumnos || []).forEach((alumno) => {
    const curso = String(alumno?.curso || "").trim() || SIN_CURSO;

    if (!porCurso.has(curso)) {
      const grupo = { curso, alumnos: [] };
      porCurso.set(curso, grupo);
      grupos.push(grupo);
    }

    porCurso.get(curso).alumnos.push(alumno);
  });

  return grupos;
}

/** El nombre completo del alumno, tal y como se lista. */
export function nombreCompletoAlumno(alumno) {
  return `${String(alumno?.nombre || "").trim()} ${String(alumno?.apellido || "").trim()}`.trim();
}

/**
 * Los alumnos cuyo nombre completo contiene el texto buscado.
 *
 * Filtra en local sobre la lista ya cargada: escribir en el buscador no vuelve
 * a preguntarle nada al servidor.
 */
export function filtrarAlumnosObservador(alumnos, busqueda) {
  const termino = String(busqueda || "").trim().toLowerCase();
  if (!termino) return alumnos || [];

  return (alumnos || []).filter((alumno) =>
    nombreCompletoAlumno(alumno).toLowerCase().includes(termino),
  );
}
