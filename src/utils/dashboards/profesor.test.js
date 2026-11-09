import { describe, expect, it } from "vitest";
import {
    JORNADA_ESTILOS,
    MATERIA_TODAS,
    agruparClasesPorJornada,
    agruparHorarioPorJornada,
    capitalizarInicial,
    construirHorarioProfesor,
    construirParametrosRendimiento,
    deduplicarClases,
    claseNotaBaja,
    etiquetaPuestoMejorRendimiento,
    formatearHora12,
    formatearPromedio,
    jornadaUnicaDe,
    nombreCompletoProfesor,
    nombreCursoFiltro,
    nombreMateriaFiltro,
    normalizarClases,
    normalizarInasistencias,
    normalizarNotas,
    obtenerCursosProfesor,
    obtenerEstiloHorarioDia,
    obtenerJornadaClase,
    obtenerJornadasDisponibles,
    obtenerJornadasVisibles,
    obtenerMateriasDelCurso,
    obtenerOrdenDia,
    ordenarClasesConHorario,
    primerNombreProfesor,
    tieneDosJornadas,
} from "./profesor";

const clases = [
    { id: 10, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
    { id: 10, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Miércoles", hora_inicio: "09:00", hora_fin: "10:00" },
    { id: 11, materia: "Español", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Martes", hora_inicio: "08:00", hora_fin: "09:00" },
    { id: 12, materia: "Sociales", curso: "6B", curso_id: 200, jornada: "Tarde", dia: "Jueves", hora_inicio: "13:00", hora_fin: "14:00" },
];

describe("obtenerOrdenDia", () => {
    it("ordena los días de la semana escolar", () => {
        expect(obtenerOrdenDia("Lunes")).toBe(0);
        expect(obtenerOrdenDia("Viernes")).toBe(4);
    });

    it("empuja al final los días que no pertenecen a la semana escolar", () => {
        expect(obtenerOrdenDia("Sábado")).toBe(5);
        expect(obtenerOrdenDia(undefined)).toBe(5);
    });
});

describe("formatearHora12", () => {
    it("convierte la hora de 24 a 12 horas", () => {
        expect(formatearHora12("07:00")).toBe("7:00 AM");
        expect(formatearHora12("13:30")).toBe("1:30 PM");
        expect(formatearHora12("00:15")).toBe("12:15 AM");
        expect(formatearHora12("12:00")).toBe("12:00 PM");
    });

    it("respeta la hora que ya viene en 12 horas", () => {
        expect(formatearHora12("7:00 AM")).toBe("7:00 AM");
        expect(formatearHora12("1:30 pm")).toBe("1:30 pm");
    });

    it("completa los minutos ausentes y tolera la hora vacía", () => {
        expect(formatearHora12("9")).toBe("9:00 AM");
        expect(formatearHora12("")).toBe("");
        expect(formatearHora12(null)).toBe("");
    });
});

describe("obtenerJornadaClase", () => {
    it("reconoce la jornada declarada sin importar tildes ni mayúsculas", () => {
        expect(obtenerJornadaClase({ jornada: "Mañana" })).toBe("Mañana");
        expect(obtenerJornadaClase({ jornada: "  MANANA  " })).toBe("Mañana");
        expect(obtenerJornadaClase({ jornada: "tarde" })).toBe("Tarde");
    });

    it("deduce la jornada por la hora cuando no está declarada", () => {
        expect(obtenerJornadaClase({ jornada: "", hora_inicio: "06:30" })).toBe("Mañana");
        expect(obtenerJornadaClase({ jornada: "", hora_inicio: "12:29" })).toBe("Mañana");
        expect(obtenerJornadaClase({ jornada: "", hora_inicio: "12:30" })).toBe("Tarde");
        expect(obtenerJornadaClase({ jornada: "", hora_inicio: "18:00" })).toBe("Tarde");
    });

    it("la jornada declarada gana sobre la hora", () => {
        expect(obtenerJornadaClase({ jornada: "manana", hora_inicio: "16:00" })).toBe("Mañana");
    });

    it("sin datos cae en la jornada de la mañana", () => {
        expect(obtenerJornadaClase({})).toBe("Mañana");
        expect(obtenerJornadaClase(null)).toBe("Mañana");
    });
});

describe("capitalizarInicial y nombres del profesor", () => {
    it("sube la inicial y baja el resto, a diferencia del panel de admin", () => {
        expect(capitalizarInicial("aNA")).toBe("Ana");
        expect(capitalizarInicial("")).toBe("");
    });

    it("arma el nombre completo con lo que exista", () => {
        expect(nombreCompletoProfesor({ nombre: "Ana", apellido: "Arias" })).toBe("Ana Arias");
        expect(nombreCompletoProfesor({ apellido: "Arias" })).toBe("Arias");
        expect(nombreCompletoProfesor(null)).toBe("");
    });

    it("saluda con el primer nombre y usa el respaldo sin datos", () => {
        expect(primerNombreProfesor({ nombre: "ana maría", apellido: "Arias" })).toBe("Ana");
        expect(primerNombreProfesor({ apellido: "arias" })).toBe("Arias");
        expect(primerNombreProfesor(null)).toBe("Profe");
    });
});

describe("formatearPromedio", () => {
    it("siempre muestra dos decimales", () => {
        expect(formatearPromedio(2.345)).toBe("2.35");
        expect(formatearPromedio(4)).toBe("4.00");
        expect(formatearPromedio("3.1")).toBe("3.10");
    });
});

describe("normalizaciones de respuestas", () => {
    it("protege clases y notas ante respuestas vacías", () => {
        expect(normalizarClases(null)).toEqual([]);
        expect(normalizarClases([{ id: 1 }])).toEqual([{ id: 1 }]);
        expect(normalizarNotas(undefined)).toEqual([]);
    });

    it("envuelve la inasistencia devuelta como objeto suelto", () => {
        expect(normalizarInasistencias([{ id: 1 }])).toEqual([{ id: 1 }]);
        expect(normalizarInasistencias({ id: 1 })).toEqual([{ id: 1 }]);
        expect(normalizarInasistencias(null)).toEqual([]);
    });

});

describe("construirHorarioProfesor", () => {
    it("conserva la franja y usa el identificador de la asignación como respaldo", () => {
        const horario = construirHorarioProfesor([
            { id: 10, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
            { id: 11, horario_id: 503, materia: "Español", curso: "5A", curso_id: 100, jornada: "Mañana", dia: "Martes", hora_inicio: "08:00", hora_fin: "09:00" },
        ]);

        expect(horario[0].horario_id).toBe(10);
        expect(horario[1].horario_id).toBe(503);
        expect(horario[0]).toEqual({
            id: 10,
            horario_id: 10,
            materia: "Matemáticas",
            curso: "5A",
            curso_id: 100,
            jornada: "Mañana",
            dia: "Lunes",
            hora_inicio: "07:00",
            hora_fin: "08:00",
        });
    });
});

describe("deduplicarClases", () => {
    it("deja una sola entrada por curso y materia", () => {
        expect(deduplicarClases(clases).map((clase) => clase.id)).toEqual([10, 11, 12]);
    });

    it("conserva la primera aparición", () => {
        expect(deduplicarClases(clases)[0].dia).toBe("Lunes");
    });

    it("distingue por curso y jornada cuando no hay identificador de curso", () => {
        const sinCursoId = [
            { id: 1, curso: "5A", materia: "Arte", jornada: "Mañana" },
            { id: 2, curso: "5A", materia: "Arte", jornada: "Tarde" },
            { id: 3, curso: " 5a ", materia: " arte ", jornada: "Mañana" },
        ];

        expect(deduplicarClases(sinCursoId).map((clase) => clase.id)).toEqual([1, 2]);
    });
});

describe("obtenerCursosProfesor", () => {
    it("agrupa por curso, ordena por nombre y resuelve la jornada", () => {
        expect(obtenerCursosProfesor(clases)).toEqual([
            { id: 100, nombre: "5A", jornada: "Mañana" },
            { id: 200, nombre: "6B", jornada: "Tarde" },
        ]);
    });

    it("descarta las asignaciones sin curso", () => {
        expect(obtenerCursosProfesor([{ id: 1, materia: "Arte" }])).toEqual([]);
    });
});

describe("obtenerMateriasDelCurso", () => {
    it("filtra por curso y ordena por materia", () => {
        const unicas = deduplicarClases(clases);

        expect(obtenerMateriasDelCurso(unicas, "100").map((clase) => clase.materia)).toEqual([
            "Español",
            "Matemáticas",
        ]);
        expect(obtenerMateriasDelCurso(unicas, "999")).toEqual([]);
    });
});

describe("nombres de los filtros de rendimiento", () => {
    it("describe el curso con su jornada o usa el respaldo", () => {
        const cursos = obtenerCursosProfesor(clases);

        expect(nombreCursoFiltro(cursos, "100")).toBe("5A - Mañana");
        expect(nombreCursoFiltro(cursos, "")).toBe("Curso");
        expect(nombreCursoFiltro([], "100")).toBe("Curso");
    });

    it("describe la materia elegida, todas o el respaldo", () => {
        const materias = obtenerMateriasDelCurso(deduplicarClases(clases), "100");

        expect(nombreMateriaFiltro(materias, MATERIA_TODAS)).toBe("Todas las materias");
        expect(nombreMateriaFiltro(materias, "10")).toBe("Matemáticas");
        expect(nombreMateriaFiltro(materias, "999")).toBe("Materia");
    });
});

describe("agrupación del horario", () => {
    it("descarta las franjas incompletas y ordena por día y hora", () => {
        const horario = [
            { id: 1, dia: "Miércoles", hora_inicio: "09:00", hora_fin: "10:00" },
            { id: 2, dia: "Lunes", hora_inicio: "10:00", hora_fin: "11:00" },
            { id: 3, dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:00" },
            { id: 4, dia: "Lunes", hora_inicio: "07:00" },
            { id: 5, hora_inicio: "07:00", hora_fin: "08:00" },
        ];

        expect(ordenarClasesConHorario(horario).map((clase) => clase.id)).toEqual([3, 2, 1]);
    });

    it("separa las clases por jornada", () => {
        const porJornada = agruparClasesPorJornada(ordenarClasesConHorario(clases));

        expect(porJornada["Mañana"].map((clase) => clase.id)).toEqual([10, 11, 10]);
        expect(porJornada["Tarde"].map((clase) => clase.id)).toEqual([12]);
    });

    it("reparte cada jornada en los cinco días de la semana", () => {
        const porJornada = agruparClasesPorJornada(ordenarClasesConHorario(clases));
        const horario = agruparHorarioPorJornada(porJornada);

        expect(Object.keys(horario["Mañana"])).toEqual([
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
        ]);
        expect(horario["Mañana"].Lunes).toHaveLength(1);
        expect(horario["Mañana"].Jueves).toHaveLength(0);
        expect(horario["Tarde"].Jueves).toHaveLength(1);
    });
});

describe("filtro de jornadas", () => {
    const porJornada = agruparClasesPorJornada(ordenarClasesConHorario(clases));
    const soloManana = agruparClasesPorJornada(
        ordenarClasesConHorario(clases.filter((clase) => clase.jornada === "Mañana")),
    );

    it("detecta cuándo hay clases en las dos jornadas", () => {
        expect(tieneDosJornadas(porJornada)).toBe(true);
        expect(tieneDosJornadas(soloManana)).toBe(false);
    });

    it("lista solo las jornadas con clases", () => {
        expect(obtenerJornadasDisponibles(porJornada)).toEqual(["Mañana", "Tarde"]);
        expect(obtenerJornadasDisponibles(soloManana)).toEqual(["Mañana"]);
    });

    it("muestra ambas jornadas, la elegida, o revierte si la elegida está vacía", () => {
        expect(obtenerJornadasVisibles("Ambas", porJornada)).toEqual(["Mañana", "Tarde"]);
        expect(obtenerJornadasVisibles("Tarde", porJornada)).toEqual(["Tarde"]);
        expect(obtenerJornadasVisibles("Tarde", soloManana)).toEqual(["Mañana"]);
    });
});

describe("construirParametrosRendimiento", () => {
    it("consulta todo el curso cuando no hay materia concreta", () => {
        expect(construirParametrosRendimiento("100", MATERIA_TODAS)).toEqual({ curso_id: "100" });
    });

    it("agrega la asignación cuando hay materia concreta", () => {
        expect(construirParametrosRendimiento("100", "10")).toEqual({
            curso_id: "100",
            asignacion_id: "10",
        });
    });
});

describe("reglas de clase", () => {
    it("da a cada jornada su paleta y su horario institucional", () => {
        expect(JORNADA_ESTILOS["Mañana"].rango).toBe("06:30 - 12:30");
        expect(JORNADA_ESTILOS["Tarde"].rango).toBe("12:30 - 18:30");
        expect(JORNADA_ESTILOS["Mañana"].badge).toContain("sky");
        expect(JORNADA_ESTILOS["Tarde"].badge).toContain("orange");
    });

    it("da a cada día de la semana escolar su paleta", () => {
        expect(obtenerEstiloHorarioDia("Lunes").panel).toContain("purple");
        expect(obtenerEstiloHorarioDia("Viernes").panel).toContain("slate");
    });

    it("usa la paleta base para un día desconocido", () => {
        expect(obtenerEstiloHorarioDia("Sábado").panel).toBe("border-gray-200 bg-gray-50");
        expect(obtenerEstiloHorarioDia(undefined).headerMobile).toBe("text-gray-800");
    });

    it("resuelve la jornada única del encabezado", () => {
        const soloManana = agruparClasesPorJornada(
            ordenarClasesConHorario(clases.filter((clase) => clase.jornada === "Mañana")),
        );
        const soloTarde = agruparClasesPorJornada(
            ordenarClasesConHorario(clases.filter((clase) => clase.jornada === "Tarde")),
        );

        expect(jornadaUnicaDe(soloManana)).toBe("Mañana");
        expect(jornadaUnicaDe(soloTarde)).toBe("Tarde");
    });

    it("colorea el promedio bajo según el campo del backend", () => {
        expect(claseNotaBaja("red")).toBe("text-red-500");
        expect(claseNotaBaja("yellow")).toBe("text-yellow-500");
        expect(claseNotaBaja("green")).toBe("text-green-500");
        expect(claseNotaBaja(undefined)).toBe("text-green-500");
    });
});

describe("etiquetaPuestoMejorRendimiento", () => {
    it("marca el podio con medallas", () => {
        expect(etiquetaPuestoMejorRendimiento(0)).toBe("🥇 1");
        expect(etiquetaPuestoMejorRendimiento(1)).toBe("🥈 2");
        expect(etiquetaPuestoMejorRendimiento(2)).toBe("🥉 3");
    });

    it("numera al resto desde el cuarto puesto", () => {
        expect(etiquetaPuestoMejorRendimiento(3)).toBe(4);
        expect(etiquetaPuestoMejorRendimiento(9)).toBe(10);
    });
});
