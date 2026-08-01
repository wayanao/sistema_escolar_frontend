import { describe, expect, it } from "vitest";

import {
    construirParametrosDisponibilidad,
    construirPayloadAsignacion,
    estaEnRangoInstitucional,
    formatearHora12,
    obtenerAsignacionesCurso,
    validarAsignacion,
} from "./asignaciones";

const FORMULARIO_VALIDO = {
    cursoId: "21",
    profesorId: "11",
    materiaId: "31",
    dia: "Lunes",
    horaInicio: "08:00",
    horaFin: "09:00",
    cursoSeleccionado: { id: 21, jornada: "Mañana" },
    listaAsignaciones: [],
    editandoId: null,
};

describe("utilidades puras de asignaciones académicas", () => {
    it("formatea horas de 24 horas y conserva valores que ya incluyen AM/PM", () => {
        expect(formatearHora12("")).toBe("");
        expect(formatearHora12("00:15")).toBe("12:15 AM");
        expect(formatearHora12("12:30")).toBe("12:30 PM");
        expect(formatearHora12("18:05")).toBe("6:05 PM");
        expect(formatearHora12("8:00 am")).toBe("8:00 am");
    });

    it("acepta sólo intervalos completos dentro de una jornada institucional", () => {
        expect(estaEnRangoInstitucional("06:30", "12:30")).toBe(true);
        expect(estaEnRangoInstitucional("12:30", "18:30")).toBe(true);
        expect(estaEnRangoInstitucional("11:30", "13:00")).toBe(false);
        expect(estaEnRangoInstitucional("06:29", "07:00")).toBe(false);
        expect(estaEnRangoInstitucional("17:00", "18:31")).toBe(false);
        expect(estaEnRangoInstitucional("", "09:00")).toBe(false);
    });

    it("filtra por curso y ordena por día y hora sin modificar la lista original", () => {
        const asignaciones = [
            { id: 1, curso_id: 21, dia: "Martes", hora_inicio: "07:00" },
            { id: 2, curso_id: "21", dia: "Lunes", hora_inicio: "09:00" },
            { id: 3, curso_id: 22, dia: "Lunes", hora_inicio: "06:30" },
            { id: 4, curso_id: 21, dia: "Lunes", hora_inicio: "08:00" },
        ];

        expect(obtenerAsignacionesCurso(asignaciones, "21").map(({ id }) => id)).toEqual([4, 2, 1]);
        expect(asignaciones.map(({ id }) => id)).toEqual([1, 2, 3, 4]);
    });

    it("construye los parámetros de disponibilidad y excluye la edición vigente", () => {
        expect(construirParametrosDisponibilidad("Lunes", null)).toEqual({ dia: "Lunes" });
        expect(construirParametrosDisponibilidad("Martes", 41)).toEqual({
            dia: "Martes",
            excluir_asignacion_id: 41,
        });
    });

    it("construye el payload numérico que consume el backend", () => {
        expect(construirPayloadAsignacion(FORMULARIO_VALIDO)).toEqual({
            profesor_id: 11,
            curso_id: 21,
            materia_id: 31,
            dia: "Lunes",
            hora_inicio: "08:00",
            hora_fin: "09:00",
        });
    });

    it.each([
        [{ cursoId: "" }, "Completa curso, profesor, materia, día y horas."],
        [{ horaInicio: "09:00", horaFin: "09:00" }, "La hora de inicio debe ser anterior a la hora de fin."],
        [{ horaInicio: "11:30", horaFin: "13:00" }, "El horario debe estar dentro de 06:30-12:30 o 12:30-18:30."],
        [
            { horaInicio: "12:30", horaFin: "13:00" },
            "El curso es jornada Mañana: la clase debe terminar antes o a las 12:30.",
        ],
        [
            {
                horaInicio: "11:00",
                horaFin: "12:00",
                cursoSeleccionado: { id: 21, jornada: "Tarde" },
            },
            "El curso es jornada Tarde: la clase debe comenzar a partir de las 12:30.",
        ],
    ])("conserva las validaciones y mensajes actuales", (cambios, mensaje) => {
        expect(validarAsignacion({ ...FORMULARIO_VALIDO, ...cambios })).toBe(mensaje);
    });

    it("detecta la materia asignada a otro profesor y omite la asignación editada", () => {
        const asignacionExistente = {
            id: 41,
            curso_id: 21,
            materia_id: 31,
            profesor_id: 12,
            profesor_nombre: "LUIS PEREZ",
        };

        expect(validarAsignacion({
            ...FORMULARIO_VALIDO,
            listaAsignaciones: [asignacionExistente],
        })).toBe("Esta materia ya está asignada en este curso al profesor LUIS PEREZ.");

        expect(validarAsignacion({
            ...FORMULARIO_VALIDO,
            listaAsignaciones: [asignacionExistente],
            editandoId: 41,
        })).toBeNull();
    });

    it("acepta el formulario vigente cuando no hay conflictos", () => {
        expect(validarAsignacion(FORMULARIO_VALIDO)).toBeNull();
    });
});
