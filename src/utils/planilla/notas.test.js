import { describe, expect, it } from "vitest";
import {
    calcularPromedioNotas,
    construirPayloadNota,
    esColumnaInterna,
    formatearEtiquetaColumna,
    normalizarEstudiantesPlanilla,
    normalizarNumeroNota,
    obtenerColumnasVisibles,
    obtenerNotasVisibles,
} from "./notas";

describe("contratos puros de la planilla de notas", () => {
    it("reconoce la columna interna reservada sin importar mayúsculas o espacios", () => {
        expect(esColumnaInterna("mas_alto")).toBe(true);
        expect(esColumnaInterna(" Mas_Alto ")).toBe(true);
        expect(esColumnaInterna("quiz")).toBe(false);
        expect(esColumnaInterna("")).toBe(false);
    });

    it("filtra la columna interna conservando el orden de las demás", () => {
        expect(obtenerColumnasVisibles(["quiz", "mas_alto", "trabajo grupal"])).toEqual([
            "quiz",
            "trabajo grupal",
        ]);
        expect(obtenerColumnasVisibles(null)).toEqual([]);
        expect(obtenerColumnasVisibles(undefined)).toEqual([]);
    });

    it("formatea etiquetas de columna: vacío, reservada, separadores y espacios múltiples", () => {
        expect(formatearEtiquetaColumna("")).toBe("");
        expect(formatearEtiquetaColumna(null)).toBe("");
        expect(formatearEtiquetaColumna("MAS_ALTO")).toBe("Más alto");
        expect(formatearEtiquetaColumna("trabajo_en-equipo")).toBe("Trabajo En Equipo");
        expect(formatearEtiquetaColumna("  quiz   final  ")).toBe("Quiz Final");
        expect(formatearEtiquetaColumna("quiz")).toBe("Quiz");
    });

    it("conserva únicamente las notas de las columnas visibles presentes en el objeto", () => {
        expect(obtenerNotasVisibles({ quiz: 4, mas_alto: 4.5 }, ["quiz", "trabajo grupal"])).toEqual({
            quiz: 4,
        });
        expect(obtenerNotasVisibles({ quiz: 4 }, [])).toEqual({});
        expect(obtenerNotasVisibles(null, ["quiz"])).toEqual({});
    });

    it("calcula el promedio ignorando valores vacíos, nulos o no numéricos", () => {
        expect(calcularPromedioNotas({ quiz: 4, taller: 3 }, ["quiz", "taller"])).toBe("3.50");
        expect(calcularPromedioNotas({ quiz: 2 }, ["quiz", "taller"])).toBe("2.00");
        expect(calcularPromedioNotas({ quiz: "", taller: null }, ["quiz", "taller"])).toBe("");
        expect(calcularPromedioNotas({ quiz: "abc" }, ["quiz"])).toBe("");
        expect(calcularPromedioNotas({ a: 4, b: 2 })).toBe("3.00");
    });

    it("normaliza números con coma decimal y conserva el comportamiento de valores inválidos", () => {
        expect(normalizarNumeroNota("4,5")).toBe(4.5);
        expect(normalizarNumeroNota("5")).toBe(5);
        expect(Number.isNaN(normalizarNumeroNota("abc"))).toBe(true);
    });

    it("normaliza la lista de estudiantes calculando notas visibles y promedio sin mutar la entrada", () => {
        const estudiantes = [
            { estudiante_id: 1, nombre: "Ana", notas: { quiz: 4, taller: 3, mas_alto: 4.5 } },
            { estudiante_id: 2, nombre: "Luis", notas: { quiz: 2 } },
        ];
        const copia = estudiantes.map((est) => ({ ...est, notas: { ...est.notas } }));

        expect(normalizarEstudiantesPlanilla(estudiantes, ["quiz", "taller"])).toEqual([
            {
                estudiante_id: 1,
                nombre: "Ana",
                notas: { quiz: 4, taller: 3 },
                promedio: "3.50",
            },
            {
                estudiante_id: 2,
                nombre: "Luis",
                notas: { quiz: 2 },
                promedio: "2.00",
            },
        ]);
        expect(estudiantes).toEqual(copia);
        expect(normalizarEstudiantesPlanilla(null, ["quiz"])).toEqual([]);
    });

    it("construye el payload de nota con las conversiones numéricas y los valores por defecto del backend", () => {
        expect(construirPayloadNota({
            estudianteId: 501,
            asignacionId: "88",
            periodo: "3",
            descripcion: "quiz",
            tipoEvaluacion: "numerica",
            nota: 5,
        })).toEqual({
            estudiante_id: 501,
            asignacion_id: 88,
            nota: 5,
            descripcion: "quiz",
            periodo: 3,
            tipo_evaluacion: "numerica",
            valoracion: null,
        });

        expect(construirPayloadNota({
            estudianteId: 501,
            asignacionId: "88",
            periodo: "3",
            descripcion: "quiz",
            tipoEvaluacion: "desarrollo",
            valoracion: "logrado",
        })).toEqual({
            estudiante_id: 501,
            asignacion_id: 88,
            nota: null,
            descripcion: "quiz",
            periodo: 3,
            tipo_evaluacion: "desarrollo",
            valoracion: "logrado",
        });
    });
});
