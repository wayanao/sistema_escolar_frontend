import { describe, expect, it } from "vitest";

import {
    aplicarEstadoProfesor,
    CLASES_ESTADO_PROFESOR,
    construirPayloadProfesor,
    ESTADOS_PROFESOR,
    FILTROS_PROFESOR,
    filtrarProfesores,
    normalizarTextoMayusculas,
    obtenerEtiquetaEstadoProfesor,
    obtenerMensajeErrorApi,
} from "./profesores";

describe("utilidades puras de profesores", () => {
    it("normaliza espacios y mayúsculas con la configuración regional actual", () => {
        expect(normalizarTextoMayusculas("  Ana   María  ")).toBe("ANA MARÍA");
        expect(normalizarTextoMayusculas(null)).toBe("");
    });

    it("construye el payload vigente sin reinterpretar campos", () => {
        expect(construirPayloadProfesor({
            nombre: "  Ana  ",
            apellido: " Ruiz  Pérez ",
            documentoIdentidad: "102030",
            email: " ANA@EJEMPLO.COM ",
            telefono: "3001234567",
            password: "secreto",
            sueldo: "1200.50",
            estado: "activo",
        })).toEqual({
            nombre: "ANA",
            apellido: "RUIZ PÉREZ",
            documento_identidad: "102030",
            email: "ana@ejemplo.com",
            telefono: "3001234567",
            password: "secreto",
            sueldo: 1200.5,
            estado: "activo",
        });

        expect(construirPayloadProfesor({ sueldo: "no-numérico" }).sueldo).toBe(0);
    });

    it("conserva detalles, mensajes y fallback de errores HTTP", () => {
        expect(obtenerMensajeErrorApi({
            response: {
                data: {
                    detail: [
                        { msg: "Documento repetido" },
                        { message: "Correo repetido" },
                        "Teléfono repetido",
                    ],
                },
            },
        }, "Fallback")).toBe("Documento repetido\nCorreo repetido\nTeléfono repetido");
        expect(obtenerMensajeErrorApi({
            response: { data: { detail: "Conflicto" } },
        }, "Fallback")).toBe("Conflicto");
        expect(obtenerMensajeErrorApi(new Error("Red"), "Fallback")).toBe("Fallback");
    });

    it("expone estados, filtros, etiquetas y clases actuales", () => {
        expect(ESTADOS_PROFESOR).toEqual([
            { value: "activo", label: "Activo" },
            { value: "inactivo", label: "Inactivo" },
        ]);
        expect(FILTROS_PROFESOR.at(-1)).toEqual({ value: "todos", label: "Todos" });
        expect(obtenerEtiquetaEstadoProfesor("inactivo")).toBe("Inactivo");
        expect(obtenerEtiquetaEstadoProfesor("desconocido")).toBe("Activo");
        expect(CLASES_ESTADO_PROFESOR.activo).toBe("bg-green-100 text-green-800 border-green-200");
    });

    it("filtra por nombre, apellido o documento sin distinguir mayúsculas", () => {
        const profesores = [
            { id: 1, nombre: "ANA", apellido: "RUIZ", documento: "102030" },
            { id: 2, nombre: "LUIS", apellido: "PÉREZ", documento: "405060" },
        ];

        expect(filtrarProfesores(profesores, "ana").map(({ id }) => id)).toEqual([1]);
        expect(filtrarProfesores(profesores, "pérez").map(({ id }) => id)).toEqual([2]);
        expect(filtrarProfesores(profesores, "2030").map(({ id }) => id)).toEqual([1]);
        expect(filtrarProfesores(profesores, "")).toEqual(profesores);
    });

    it("actualiza el estado y respeta el filtro operativo", () => {
        const profesores = [
            { id: 1, nombre: "ANA", estado: "activo" },
            { id: 2, nombre: "LUIS", estado: "activo" },
        ];

        expect(aplicarEstadoProfesor(profesores, 1, "inactivo", "activo")).toEqual([
            { id: 2, nombre: "LUIS", estado: "activo" },
        ]);
        expect(aplicarEstadoProfesor(profesores, 1, "inactivo", "todos")).toEqual([
            { id: 1, nombre: "ANA", estado: "inactivo" },
            { id: 2, nombre: "LUIS", estado: "activo" },
        ]);
        expect(profesores[0].estado).toBe("activo");
    });
});
