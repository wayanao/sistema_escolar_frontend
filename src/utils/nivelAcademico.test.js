import { describe, expect, it } from "vitest";

import {
    asistenciaRechazadaPorNivel,
    esAsignacionDeJornada,
    esNivelPreescolar,
    MENSAJE_ASISTENCIA_REQUIERE_JORNADA,
    NIVEL_PREESCOLAR,
    NIVEL_PRIMARIA,
    NOMBRE_MATERIA_ASISTENCIA_JORNADA,
    tipoEvaluacionForzado,
} from "./nivelAcademico";

describe("reglas puras de nivel académico", () => {
    it("preescolar fuerza desarrollo", () => {
        expect(tipoEvaluacionForzado(NIVEL_PREESCOLAR)).toBe("desarrollo");
    });

    it("primaria fuerza numérica", () => {
        expect(tipoEvaluacionForzado(NIVEL_PRIMARIA)).toBe("numerica");
    });

    it("un nivel desconocido o ausente no fuerza nada", () => {
        expect(tipoEvaluacionForzado(undefined)).toBeNull();
        expect(tipoEvaluacionForzado(null)).toBeNull();
        expect(tipoEvaluacionForzado("bachillerato")).toBeNull();
    });

    it("reconoce el nivel preescolar", () => {
        expect(esNivelPreescolar(NIVEL_PREESCOLAR)).toBe(true);
        expect(esNivelPreescolar(NIVEL_PRIMARIA)).toBe(false);
        expect(esNivelPreescolar(undefined)).toBe(false);
        expect(esNivelPreescolar(null)).toBe(false);
    });

    it("reconoce el nombre reservado de la asignación de jornada, tolerante a mayúsculas y espacios", () => {
        expect(esAsignacionDeJornada("ASISTENCIA DIARIA")).toBe(true);
        expect(esAsignacionDeJornada("  asistencia diaria  ")).toBe(true);
        expect(esAsignacionDeJornada("Matemáticas")).toBe(false);
        expect(esAsignacionDeJornada(undefined)).toBe(false);
    });

    it("rechaza una materia normal en un curso preescolar", () => {
        expect(asistenciaRechazadaPorNivel(NIVEL_PREESCOLAR, "Matemáticas")).toBe(true);
    });

    it("acepta la asignación de jornada en un curso preescolar", () => {
        expect(asistenciaRechazadaPorNivel(NIVEL_PREESCOLAR, NOMBRE_MATERIA_ASISTENCIA_JORNADA)).toBe(false);
    });

    it("primaria y sin nivel nunca rechazan nada", () => {
        expect(asistenciaRechazadaPorNivel(NIVEL_PRIMARIA, "Matemáticas")).toBe(false);
        expect(asistenciaRechazadaPorNivel(undefined, "Matemáticas")).toBe(false);
    });

    it("el mensaje de rechazo nombra la asignación reservada", () => {
        expect(MENSAJE_ASISTENCIA_REQUIERE_JORNADA).toContain("Asistencia diaria");
        expect(MENSAJE_ASISTENCIA_REQUIERE_JORNADA).toContain("preescolar");
    });
});
