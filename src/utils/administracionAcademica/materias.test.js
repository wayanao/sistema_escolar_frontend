import { describe, expect, it } from "vitest";

import {
    aplicarEstadoMateria,
    CLASES_ESTADO_MATERIA,
    construirPayloadMateria,
    ESTADOS_MATERIA,
    FILTROS_MATERIA,
    normalizarNombreMateria,
    obtenerAvisoMateriaUsadaEnOtroAnio,
    obtenerEtiquetaEstadoMateria,
    obtenerMensajeErrorMateria,
} from "./materias";

describe("utilidades puras de materias", () => {
    it("normaliza espacios y mayúsculas con la configuración regional actual", () => {
        expect(normalizarNombreMateria("  ciencias   naturales  ")).toBe(
            "CIENCIAS NATURALES",
        );
        expect(normalizarNombreMateria(null)).toBe("");
    });

    it("construye el payload vigente sin reinterpretar el estado", () => {
        expect(construirPayloadMateria({
            nombre: "  matemáticas  ",
            estado: "inactivo",
        })).toEqual({
            nombre: "MATEMÁTICAS",
            estado: "inactivo",
        });
    });

    it("conserva detalles, mensajes y fallback de errores HTTP", () => {
        expect(obtenerMensajeErrorMateria({
            response: {
                data: {
                    detail: [
                        { msg: "Nombre repetido" },
                        { message: "Estado inválido" },
                        "Conflicto",
                    ],
                },
            },
        }, "Fallback")).toBe("Nombre repetido\nEstado inválido\nConflicto");
        expect(obtenerMensajeErrorMateria({
            response: { data: { detail: "Duplicada" } },
        }, "Fallback")).toBe("Duplicada");
        expect(obtenerMensajeErrorMateria(new Error("Red"), "Fallback")).toBe("Fallback");
    });

    it("reconoce solo el aviso de renombrado definido por el backend", () => {
        const aviso = {
            response: {
                status: 409,
                data: {
                    detail: {
                        codigo: "materia_usada_en_otro_anio",
                        mensaje: "Esta materia se usa en 2026.",
                    },
                },
            },
        };

        expect(obtenerAvisoMateriaUsadaEnOtroAnio(aviso)).toEqual({
            codigo: "materia_usada_en_otro_anio",
            mensaje: "Esta materia se usa en 2026.",
        });
        expect(obtenerAvisoMateriaUsadaEnOtroAnio({
            ...aviso,
            response: { ...aviso.response, status: 400 },
        })).toBeNull();
        expect(obtenerAvisoMateriaUsadaEnOtroAnio({
            response: { status: 409, data: { detail: "Nombre repetido" } },
        })).toBeNull();
        expect(obtenerAvisoMateriaUsadaEnOtroAnio({
            response: {
                status: 409,
                data: { detail: { codigo: "otro_conflicto", mensaje: "Otro" } },
            },
        })).toBeNull();
    });

    it("expone estados, filtros, etiquetas y clases actuales", () => {
        expect(ESTADOS_MATERIA).toEqual([
            { value: "activo", label: "Activo" },
            { value: "inactivo", label: "Inactivo" },
        ]);
        expect(FILTROS_MATERIA.at(-1)).toEqual({ value: "todos", label: "Todos" });
        expect(obtenerEtiquetaEstadoMateria("inactivo")).toBe("Inactivo");
        expect(obtenerEtiquetaEstadoMateria("desconocido")).toBe("Activo");
        expect(CLASES_ESTADO_MATERIA.activo).toBe(
            "bg-green-100 text-green-800 border-green-200",
        );
    });

    it("actualiza el estado y filtra según el estado operativo", () => {
        const materias = [
            { id: 31, nombre: "MATEMÁTICAS", estado: "activo" },
            { id: 32, nombre: "BIOLOGÍA", estado: "activo" },
        ];

        expect(aplicarEstadoMateria(materias, 31, "inactivo", "activo")).toEqual([
            { id: 32, nombre: "BIOLOGÍA", estado: "activo" },
        ]);
        expect(aplicarEstadoMateria(materias, 31, "inactivo", "todos")).toEqual([
            { id: 31, nombre: "MATEMÁTICAS", estado: "inactivo" },
            { id: 32, nombre: "BIOLOGÍA", estado: "activo" },
        ]);
        expect(materias[0].estado).toBe("activo");
    });
});
