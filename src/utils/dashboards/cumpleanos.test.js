import { describe, expect, it } from "vitest";
import {
    DIAS_RANGO_CUMPLEANOS,
    construirParametrosCumpleanos,
    nombreCompletoEstudiante,
    normalizarCumpleanos,
    obtenerInfoCumpleanos,
    ordenarCumpleanos,
} from "./cumpleanos";

const AHORA = new Date(2026, 7, 7, 9, 30, 0);

describe("construirParametrosCumpleanos", () => {
    it("envía el rango de días tal como lo espera el backend", () => {
        expect(construirParametrosCumpleanos(DIAS_RANGO_CUMPLEANOS)).toEqual({ dias: 7 });
    });
});

describe("normalizarCumpleanos", () => {
    it("conserva los arreglos y descarta cualquier otra forma", () => {
        expect(normalizarCumpleanos([{ id: 1 }])).toEqual([{ id: 1 }]);
        expect(normalizarCumpleanos(null)).toEqual([]);
        expect(normalizarCumpleanos({ id: 1 })).toEqual([]);
        expect(normalizarCumpleanos(undefined)).toEqual([]);
    });
});

describe("nombreCompletoEstudiante", () => {
    it("une nombre y apellido y recorta los faltantes", () => {
        expect(nombreCompletoEstudiante({ nombre: "Ana", apellido: "Arias" })).toBe("Ana Arias");
        expect(nombreCompletoEstudiante({ nombre: "Ana" })).toBe("Ana");
        expect(nombreCompletoEstudiante({ apellido: "Arias" })).toBe("Arias");
    });

    it("usa el respaldo cuando no hay datos", () => {
        expect(nombreCompletoEstudiante({})).toBe("Estudiante");
        expect(nombreCompletoEstudiante(null)).toBe("Estudiante");
    });
});

describe("obtenerInfoCumpleanos", () => {
    it("etiqueta el cumpleaños de hoy con la edad que cumple", () => {
        expect(obtenerInfoCumpleanos("2010-08-07", AHORA)).toEqual({
            dias: 0,
            edad: 16,
            etiqueta: "Hoy",
        });
    });

    it("etiqueta mañana y los días siguientes", () => {
        expect(obtenerInfoCumpleanos("2012-08-08", AHORA).etiqueta).toBe("Mañana");
        expect(obtenerInfoCumpleanos("2015-08-10", AHORA).etiqueta).toBe("En 3 días");
    });

    it("empuja al año siguiente el cumpleaños ya pasado", () => {
        const info = obtenerInfoCumpleanos("2000-08-06", AHORA);

        expect(info.dias).toBe(364);
        expect(info.edad).toBe(27);
    });

    it("acepta la marca de tiempo completa que envía el backend", () => {
        expect(obtenerInfoCumpleanos("2010-08-07T00:00:00", AHORA).dias).toBe(0);
    });

    it("descarta las fechas ausentes o con formato distinto", () => {
        expect(obtenerInfoCumpleanos("", AHORA)).toBeNull();
        expect(obtenerInfoCumpleanos(null, AHORA)).toBeNull();
        expect(obtenerInfoCumpleanos("07/08/2010", AHORA)).toBeNull();
        expect(obtenerInfoCumpleanos("0000-08-07", AHORA)).toBeNull();
    });

    it("omite la edad cuando el año de nacimiento no es anterior", () => {
        expect(obtenerInfoCumpleanos("2026-08-07", AHORA).edad).toBeNull();
    });
});

describe("ordenarCumpleanos", () => {
    it("ordena por días restantes y desempata por nombre completo", () => {
        const estudiantes = [
            { id: 1, nombre: "Zoe", apellido: "Zapata", fecha_nacimiento: "2015-08-10" },
            { id: 2, nombre: "Ana", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
            { id: 3, nombre: "Aldo", apellido: "Arias", fecha_nacimiento: "2010-08-07" },
        ];

        expect(ordenarCumpleanos(estudiantes, AHORA).map((item) => item.id)).toEqual([3, 2, 1]);
    });

    it("coloca al final a quien no tiene fecha utilizable", () => {
        const estudiantes = [
            { id: 1, nombre: "Sin", apellido: "Fecha" },
            { id: 2, nombre: "Ana", apellido: "Arias", fecha_nacimiento: "2000-08-06" },
        ];

        expect(ordenarCumpleanos(estudiantes, AHORA).map((item) => item.id)).toEqual([2, 1]);
    });

    it("no modifica el arreglo recibido", () => {
        const estudiantes = [
            { id: 1, fecha_nacimiento: "2015-08-10" },
            { id: 2, fecha_nacimiento: "2010-08-07" },
        ];

        ordenarCumpleanos(estudiantes, AHORA);

        expect(estudiantes.map((item) => item.id)).toEqual([1, 2]);
    });
});
