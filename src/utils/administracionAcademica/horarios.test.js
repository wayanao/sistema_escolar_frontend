import { describe, expect, it } from "vitest";

import {
    DIAS_SEMANA_HORARIOS,
    filtrarCursosHorario,
    formatearHora12,
    obtenerClasesDiaHorario,
    obtenerCursosUnicosHorario,
    obtenerHorariosCurso,
    obtenerHorariosProfesor,
    obtenerProfesoresUnicosHorario,
} from "./horarios";

const HORARIOS = [
    {
        profesor: "Ana Torres",
        curso: "7B",
        materia: "QUÍMICA",
        dia: "Lunes",
        hora_inicio: "10:00",
    },
    {
        profesor: "Luis Pérez",
        curso: "6A",
        materia: "BIOLOGÍA",
        dia: "Lunes",
        hora_inicio: "08:00",
    },
    {
        profesor: "Ana Torres",
        curso: "7B",
        materia: "MATEMÁTICAS",
        dia: "Martes",
        hora_inicio: "06:30",
    },
];

describe("utilidades puras de horarios administrativos", () => {
    it("conserva los cinco días laborales en el orden visible", () => {
        expect(DIAS_SEMANA_HORARIOS).toEqual([
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
        ]);
    });

    it("formatea horas de 24 horas y conserva valores ya formateados", () => {
        expect(formatearHora12()).toBe("");
        expect(formatearHora12("00:15")).toBe("12:15 AM");
        expect(formatearHora12("12:00")).toBe("12:00 PM");
        expect(formatearHora12("13:05")).toBe("1:05 PM");
        expect(formatearHora12("6:30 am")).toBe("6:30 am");
    });

    it("obtiene profesores y cursos únicos sin alterar el orden de entrada", () => {
        expect(obtenerProfesoresUnicosHorario(HORARIOS)).toEqual([
            "Ana Torres",
            "Luis Pérez",
        ]);
        expect(obtenerCursosUnicosHorario(HORARIOS)).toEqual(["7B", "6A"]);
        expect(obtenerCursosUnicosHorario(HORARIOS, { ordenar: true })).toEqual(["6A", "7B"]);
        expect(HORARIOS.map((horario) => horario.curso)).toEqual(["7B", "6A", "7B"]);
    });

    it("filtra cursos ignorando espacios y mayúsculas y conserva la lista sin consulta", () => {
        const cursos = ["6A", "Primero", "7B"];

        expect(filtrarCursosHorario(cursos, "  PRI ")).toEqual(["Primero"]);
        expect(filtrarCursosHorario(cursos, "")).toBe(cursos);
        expect(filtrarCursosHorario(cursos, "inexistente")).toEqual([]);
    });

    it("filtra horarios por profesor y curso conservando el orden", () => {
        expect(obtenerHorariosProfesor(HORARIOS, "Ana Torres")).toEqual([
            HORARIOS[0],
            HORARIOS[2],
        ]);
        expect(obtenerHorariosCurso(HORARIOS, "6A")).toEqual([HORARIOS[1]]);
    });

    it("obtiene clases del día y solo ordena por hora cuando se solicita", () => {
        const lunes = obtenerClasesDiaHorario(HORARIOS, "Lunes");
        const lunesOrdenado = obtenerClasesDiaHorario(HORARIOS, "Lunes", {
            ordenarPorHora: true,
        });

        expect(lunes).toEqual([HORARIOS[0], HORARIOS[1]]);
        expect(lunesOrdenado).toEqual([HORARIOS[1], HORARIOS[0]]);
        expect(HORARIOS[0].hora_inicio).toBe("10:00");
    });
});
