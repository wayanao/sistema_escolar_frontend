/**
 * La clase con la que trabaja el profesor, elegida dentro de Planilla y de
 * Asistencia (antes solo se elegía en el panel y las pantallas la leían a
 * ciegas del almacenamiento local).
 *
 * La elección es una sola para las dos pantallas, con una excepción de
 * preescolar: la asistencia se toma una vez al día con la asignación
 * reservada "Asistencia diaria" del curso (ver `nivelAcademico.js`), y esa
 * asignación no lleva notas, así que no sale en la planilla.
 *
 * `/mis-clases` trae una fila por franja de horario; el selector muestra una
 * opción por asignación.
 *
 * Sin HTTP, sin React y sin DOM.
 */
import { asistenciaRechazadaPorNivel, esAsignacionDeJornada } from "./nivelAcademico";

/** Misma clave que ya usan el panel y los demás módulos del profesor. */
export const CLAVE_ASIGNACION_PROFESOR = "asignacionId";

const mismoId = (a, b) => String(a) === String(b);

const normalizarTexto = (valor) => String(valor || "").trim().toLowerCase();

/** Una clase por asignación, en el orden en que llegan. */
export const clasesPorAsignacion = (clases) => {
    const vistas = new Map();
    for (const clase of Array.isArray(clases) ? clases : []) {
        if (clase?.id === undefined || clase?.id === null) continue;
        const clave = String(clase.id);
        if (!vistas.has(clave)) vistas.set(clave, clase);
    }
    return [...vistas.values()];
};

/** Las clases que se califican: todas menos "Asistencia diaria". */
export const clasesParaPlanilla = (clases) =>
    clasesPorAsignacion(clases).filter((clase) => !esAsignacionDeJornada(clase.materia));

/** Las clases con las que se toma asistencia: en preescolar, solo
 * "Asistencia diaria"; en primaria o sin nivel, todas. */
export const clasesParaAsistencia = (clases) =>
    clasesPorAsignacion(clases).filter(
        (clase) => !asistenciaRechazadaPorNivel(clase.nivel, clase.materia),
    );

export const buscarClase = (clases, asignacionId) => {
    if (!asignacionId) return null;
    return clasesPorAsignacion(clases).find((clase) => mismoId(clase.id, asignacionId)) || null;
};

const mismoCurso = (a, b) => {
    if (a.curso_id !== undefined && a.curso_id !== null
        && b.curso_id !== undefined && b.curso_id !== null) {
        return mismoId(a.curso_id, b.curso_id);
    }
    return normalizarTexto(a.curso) === normalizarTexto(b.curso);
};

/** La clase guardada si se puede calificar; si no (por ejemplo, es
 * "Asistencia diaria" o ya no está asignada), ninguna. */
export const asignacionParaPlanilla = (clases, asignacionId) => {
    const clase = buscarClase(clasesParaPlanilla(clases), asignacionId);
    return clase ? String(clase.id) : "";
};

/**
 * La asignación con la que se toma asistencia a partir de la guardada:
 * - la misma, si sirve para asistencia (primaria, sin nivel, o ya es
 *   "Asistencia diaria");
 * - en preescolar, la "Asistencia diaria" del mismo curso.
 *
 * `cursoSinJornada` es el curso de preescolar cuya "Asistencia diaria" no
 * está a nombre del profesor: la pantalla lo explica en vez de quedar vacía.
 */
export const resolverAsignacionAsistencia = (clases, asignacionId) => {
    const clase = buscarClase(clases, asignacionId);
    if (!clase) return { asignacionId: "", cursoSinJornada: "" };

    if (!asistenciaRechazadaPorNivel(clase.nivel, clase.materia)) {
        return { asignacionId: String(clase.id), cursoSinJornada: "" };
    }

    const jornada = clasesPorAsignacion(clases).find(
        (otra) => esAsignacionDeJornada(otra.materia) && mismoCurso(otra, clase),
    );
    return jornada
        ? { asignacionId: String(jornada.id), cursoSinJornada: "" }
        : { asignacionId: "", cursoSinJornada: clase.curso || "este curso" };
};

/**
 * Qué decir donde iría el contenido cuando todavía no hay clase con la que
 * trabajar. `sinOpciones` y `elegir` son los textos propios de cada pantalla.
 */
export const mensajeSinClase = ({ cargando, error, aviso, hayOpciones, sinOpciones, elegir }) => {
    if (cargando) return { titulo: "Cargando tus clases…", texto: "" };
    if (error) return { titulo: "No se pudieron cargar tus clases", texto: "Oprime «Reintentar» arriba." };
    if (aviso) return { titulo: "Elige otra clase", texto: aviso };
    if (!hayOpciones) return sinOpciones;
    return elegir;
};

/** Opciones del selector: "Materia - Curso", y la jornada solo cuando dos
 * opciones se llamarían igual. "Asistencia diaria" lleva primero el curso:
 * en celular el texto se corta, y en preescolar lo que distingue una opción
 * de otra es el curso. */
export const opcionesDeClase = (clases) => {
    const lista = clasesPorAsignacion(clases);
    const base = (clase) => {
        const materia = clase.materia || "Sin materia";
        const curso = clase.curso || "Sin curso";
        return esAsignacionDeJornada(clase.materia) ? `${curso} - ${materia}` : `${materia} - ${curso}`;
    };
    const repetidas = new Map();
    lista.forEach((clase) => repetidas.set(base(clase), (repetidas.get(base(clase)) || 0) + 1));

    return lista.map((clase) => ({
        valor: String(clase.id),
        etiqueta: repetidas.get(base(clase)) > 1 && clase.jornada
            ? `${base(clase)} - ${clase.jornada}`
            : base(clase),
    }));
};
