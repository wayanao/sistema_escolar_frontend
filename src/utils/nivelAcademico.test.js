import { describe, expect, it } from "vitest";

import {
    esNivelPreescolar,
    NIVEL_PREESCOLAR,
    NIVEL_PRIMARIA,
    tipoEvaluacionForzado,
} from "./nivelAcademico";

describe("reglas puras de nivel académico", () => {
    it("preescolar fuerza desarrollo", () => {
        expect(tipoEvaluacionForzado(NIVEL_PREESCOLAR)).toBe("desarrollo");
    });

    it("primaria no fuerza nada", () => {
        expect(tipoEvaluacionForzado(NIVEL_PRIMARIA)).toBeNull();
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
});
