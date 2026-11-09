import { describe, expect, it } from "vitest";
import {
    asignacionDeMateria,
    buscarClase,
    clasesParaAsistencia,
    clasesDeMateria,
    clasesPorAsignacion,
    mensajeSinClase,
    opcionesDeClase,
    resolverAsignacionAsistencia,
} from "./claseDeTrabajo";

const MATE_5A = { id: 10, materia: "MATEMÁTICAS", curso: "5A", curso_id: 1, nivel: "primaria" };
const MATE_5A_MARTES = { ...MATE_5A, horario_id: 2, dia: "Martes" };
const COMUNICATIVA_TA = {
    id: 20,
    materia: "DIMENSIÓN COMUNICATIVA",
    curso: "Transición A",
    curso_id: 7,
    nivel: "preescolar",
};
const JORNADA_TA = {
    id: 21,
    materia: "ASISTENCIA DIARIA",
    curso: "Transición A",
    curso_id: 7,
    nivel: "preescolar",
};
const COMUNICATIVA_TB = { ...COMUNICATIVA_TA, id: 30, curso: "Transición B", curso_id: 8 };
const JORNADA_TB = { ...JORNADA_TA, id: 31, curso: "Transición B", curso_id: 8 };

describe("clasesPorAsignacion", () => {
    it("deja una clase por asignación aunque venga una fila por franja de horario", () => {
        expect(clasesPorAsignacion([MATE_5A, MATE_5A_MARTES, JORNADA_TA])).toEqual([MATE_5A, JORNADA_TA]);
    });

    it("tolera listas vacías o ausentes y filas sin id", () => {
        expect(clasesPorAsignacion(undefined)).toEqual([]);
        expect(clasesPorAsignacion([{ materia: "Sin id" }, null])).toEqual([]);
    });
});

describe("clasesDeMateria y clasesParaAsistencia", () => {
    const todas = [MATE_5A, COMUNICATIVA_TA, JORNADA_TA];

    it("la planilla no ofrece «Asistencia diaria»: no lleva notas", () => {
        expect(clasesDeMateria(todas)).toEqual([MATE_5A, COMUNICATIVA_TA]);
    });

    it("la asistencia de preescolar solo ofrece «Asistencia diaria»; primaria, todas", () => {
        expect(clasesParaAsistencia(todas)).toEqual([MATE_5A, JORNADA_TA]);
    });
});

describe("asignacionDeMateria", () => {
    it("conserva la clase guardada si se califica", () => {
        expect(asignacionDeMateria([MATE_5A], "10")).toBe("10");
        expect(asignacionDeMateria([MATE_5A], 10)).toBe("10");
    });

    it("descarta «Asistencia diaria» y las clases que ya no están asignadas", () => {
        expect(asignacionDeMateria([MATE_5A, JORNADA_TA], "21")).toBe("");
        expect(asignacionDeMateria([MATE_5A], "999")).toBe("");
        expect(asignacionDeMateria([MATE_5A], "")).toBe("");
    });
});

describe("resolverAsignacionAsistencia", () => {
    const todas = [MATE_5A, COMUNICATIVA_TA, JORNADA_TA, COMUNICATIVA_TB, JORNADA_TB];

    it("en primaria usa la misma clase", () => {
        expect(resolverAsignacionAsistencia(todas, "10")).toEqual({ asignacionId: "10", cursoSinJornada: "" });
    });

    it("en preescolar cambia la materia por la «Asistencia diaria» del mismo curso", () => {
        expect(resolverAsignacionAsistencia(todas, "20")).toEqual({ asignacionId: "21", cursoSinJornada: "" });
        expect(resolverAsignacionAsistencia(todas, "30")).toEqual({ asignacionId: "31", cursoSinJornada: "" });
    });

    it("si ya es «Asistencia diaria» la deja igual", () => {
        expect(resolverAsignacionAsistencia(todas, "21")).toEqual({ asignacionId: "21", cursoSinJornada: "" });
    });

    it("sin `curso_id` compara por el nombre del curso", () => {
        const sinId = (clase) => {
            const copia = { ...clase };
            delete copia.curso_id;
            return copia;
        };
        expect(
            resolverAsignacionAsistencia([sinId(COMUNICATIVA_TA), sinId(JORNADA_TA)], "20"),
        ).toEqual({ asignacionId: "21", cursoSinJornada: "" });
    });

    it("si la «Asistencia diaria» del curso no es del profesor, dice de qué curso es", () => {
        expect(resolverAsignacionAsistencia([COMUNICATIVA_TA, JORNADA_TB], "20")).toEqual({
            asignacionId: "",
            cursoSinJornada: "Transición A",
        });
    });

    it("sin clase guardada o con una que ya no está, no hay ninguna", () => {
        expect(resolverAsignacionAsistencia(todas, "")).toEqual({ asignacionId: "", cursoSinJornada: "" });
        expect(resolverAsignacionAsistencia(todas, "999")).toEqual({ asignacionId: "", cursoSinJornada: "" });
    });
});

describe("buscarClase", () => {
    it("encuentra por id, como texto o número", () => {
        expect(buscarClase([MATE_5A], 10)).toBe(MATE_5A);
        expect(buscarClase([MATE_5A], "10")).toBe(MATE_5A);
        expect(buscarClase([MATE_5A], "")).toBeNull();
    });
});

describe("opcionesDeClase", () => {
    it("rotula «Materia - Curso»", () => {
        expect(opcionesDeClase([MATE_5A, MATE_5A_MARTES])).toEqual([
            { valor: "10", etiqueta: "MATEMÁTICAS - 5A" },
        ]);
    });

    it("en «Asistencia diaria» pone primero el curso, que es lo que distingue", () => {
        expect(opcionesDeClase([JORNADA_TA, JORNADA_TB]).map((opcion) => opcion.etiqueta)).toEqual([
            "Transición A - ASISTENCIA DIARIA",
            "Transición B - ASISTENCIA DIARIA",
        ]);
    });

    it("agrega la jornada solo cuando dos opciones se llamarían igual", () => {
        const manana = { id: 1, materia: "Inglés", curso: "5A", jornada: "Mañana" };
        const tarde = { id: 2, materia: "Inglés", curso: "5A", jornada: "Tarde" };
        expect(opcionesDeClase([manana, tarde]).map((opcion) => opcion.etiqueta)).toEqual([
            "Inglés - 5A - Mañana",
            "Inglés - 5A - Tarde",
        ]);
    });
});

describe("mensajeSinClase", () => {
    const textos = {
        sinOpciones: { titulo: "Sin clases", texto: "" },
        elegir: { titulo: "Elige", texto: "" },
    };

    it("prioriza cargando, error y aviso antes de los textos de la pantalla", () => {
        expect(mensajeSinClase({ ...textos, cargando: true, error: "x", aviso: "y" }).titulo)
            .toBe("Cargando tus clases…");
        expect(mensajeSinClase({ ...textos, error: "x", aviso: "y" }).titulo)
            .toBe("No se pudieron cargar tus clases");
        expect(mensajeSinClase({ ...textos, aviso: "Ya no es tuya" })).toEqual({
            titulo: "Elige otra clase",
            texto: "Ya no es tuya",
        });
        expect(mensajeSinClase({ ...textos, hayOpciones: false })).toBe(textos.sinOpciones);
        expect(mensajeSinClase({ ...textos, hayOpciones: true })).toBe(textos.elegir);
    });
});
