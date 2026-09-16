import { describe, expect, it } from "vitest";

import {
    aplicarEstadoCurso,
    CLASES_ESTADO_CURSO,
    construirPayloadCurso,
    DIRECTOR_GRUPO_SIN_DEFINIR,
    ESTADOS_CURSO,
    FILTROS_CURSO,
    JORNADA_CURSO_INICIAL,
    JORNADAS_CURSO,
    NIVEL_CURSO_SIN_DEFINIR,
    NIVELES_CURSO,
    normalizarNombreCurso,
    obtenerEtiquetaEstadoCurso,
    obtenerEtiquetaNivelCurso,
    obtenerMensajeErrorCurso,
} from "./cursos";

describe("utilidades puras de cursos", () => {
    it("normaliza espacios y mayúsculas con la configuración regional actual", () => {
        expect(normalizarNombreCurso("  sexto   a  ")).toBe("SEXTO A");
        expect(normalizarNombreCurso(null)).toBe("");
    });

    it("construye el payload vigente sin reinterpretar jornada ni estado", () => {
        expect(construirPayloadCurso({
            nombre: "  6a  ",
            jornada: "Tarde",
            estado: "inactivo",
        })).toEqual({
            nombre: "6A",
            jornada: "Tarde",
            estado: "inactivo",
            nivel: null,
            director_grupo_id: null,
        });
    });

    it("conserva el nivel cuando viene definido y lo normaliza a null si no", () => {
        expect(construirPayloadCurso({
            nombre: "Transición A",
            jornada: "Mañana",
            estado: "activo",
            nivel: "preescolar",
        }).nivel).toBe("preescolar");

        expect(construirPayloadCurso({
            nombre: "6A",
            jornada: "Mañana",
            estado: "activo",
            nivel: NIVEL_CURSO_SIN_DEFINIR,
        }).nivel).toBeNull();
    });

    it("conserva el director de grupo cuando viene definido y lo normaliza a null si no", () => {
        expect(construirPayloadCurso({
            nombre: "Transición A",
            jornada: "Mañana",
            estado: "activo",
            directorGrupoId: 7,
        }).director_grupo_id).toBe(7);

        expect(construirPayloadCurso({
            nombre: "6A",
            jornada: "Mañana",
            estado: "activo",
            directorGrupoId: DIRECTOR_GRUPO_SIN_DEFINIR,
        }).director_grupo_id).toBeNull();
    });

    it("conserva detalles, mensajes y fallback de errores HTTP", () => {
        expect(obtenerMensajeErrorCurso({
            response: {
                data: {
                    detail: [
                        { msg: "Nombre repetido" },
                        { message: "Jornada inválida" },
                        "Estado inválido",
                    ],
                },
            },
        }, "Fallback")).toBe("Nombre repetido\nJornada inválida\nEstado inválido");
        expect(obtenerMensajeErrorCurso({
            response: { data: { detail: "Conflicto" } },
        }, "Fallback")).toBe("Conflicto");
        expect(obtenerMensajeErrorCurso(new Error("Red"), "Fallback")).toBe("Fallback");
    });

    it("expone estados, filtros, jornadas, etiquetas y clases actuales", () => {
        expect(ESTADOS_CURSO).toEqual([
            { value: "activo", label: "Activo" },
            { value: "inactivo", label: "Inactivo" },
        ]);
        expect(FILTROS_CURSO.at(-1)).toEqual({ value: "todos", label: "Todos" });
        expect(JORNADA_CURSO_INICIAL).toBe("Mañana");
        expect(JORNADAS_CURSO).toEqual([
            { value: "Mañana", label: "🌅 Mañana" },
            { value: "Tarde", label: "🌇 Tarde" },
        ]);
        expect(obtenerEtiquetaEstadoCurso("inactivo")).toBe("Inactivo");
        expect(obtenerEtiquetaEstadoCurso("desconocido")).toBe("Activo");
        expect(CLASES_ESTADO_CURSO.activo).toBe(
            "bg-green-100 text-green-800 border-green-200",
        );
        expect(NIVELES_CURSO).toEqual([
            { value: "", label: "Sin definir" },
            { value: "preescolar", label: "Preescolar" },
            { value: "primaria", label: "Primaria" },
        ]);
        expect(obtenerEtiquetaNivelCurso("preescolar")).toBe("Preescolar");
        expect(obtenerEtiquetaNivelCurso(null)).toBe("Sin definir");
        expect(obtenerEtiquetaNivelCurso(undefined)).toBe("Sin definir");
    });

    it("actualiza el estado y filtra según el estado operativo", () => {
        const cursos = [
            { id: 21, nombre: "6A", estado: "activo" },
            { id: 22, nombre: "7B", estado: "activo" },
        ];

        expect(aplicarEstadoCurso(cursos, 21, "inactivo", "activo")).toEqual([
            { id: 22, nombre: "7B", estado: "activo" },
        ]);
        expect(aplicarEstadoCurso(cursos, 21, "inactivo", "todos")).toEqual([
            { id: 21, nombre: "6A", estado: "inactivo" },
            { id: 22, nombre: "7B", estado: "activo" },
        ]);
        expect(cursos[0].estado).toBe("activo");
    });
});
