import { describe, expect, it } from "vitest";
import {
    ACCESOS_ADMIN,
    capitalizarInicial,
    esAdmin,
    esTeclaDeActivacion,
    formatearMoneda,
    hayMoraEnCartera,
    primerNombreAdmin,
    textoResumenMora,
} from "./admin";

describe("ACCESOS_ADMIN", () => {
    it("conserva los cuatro accesos con sus rutas y su orden", () => {
        expect(ACCESOS_ADMIN.map((acceso) => [acceso.title, acceso.path])).toEqual([
            ["Gestión de Pagos", "/admin/pagos"],
            ["Gestión de Estudiantes", "/admin/estudiantes"],
            ["Gestión Académica", "/admin"],
            ["Reportes", "/admin/reportes"],
        ]);
    });
});

describe("formatearMoneda", () => {
    it("usa pesos colombianos sin decimales", () => {
        expect(formatearMoneda(1250000)).toContain("1.250.000");
        expect(formatearMoneda(1250000)).not.toContain(",00");
    });

    it("trata los valores ausentes como cero", () => {
        expect(formatearMoneda(null)).toContain("0");
        expect(formatearMoneda(undefined)).toContain("0");
        expect(formatearMoneda("")).toContain("0");
    });
});

describe("capitalizarInicial", () => {
    it("sube la inicial y conserva el resto tal cual", () => {
        expect(capitalizarInicial("carlos")).toBe("Carlos");
        expect(capitalizarInicial("cARLOS")).toBe("CARLOS");
        expect(capitalizarInicial("  ana  ")).toBe("Ana");
    });

    it("devuelve una cadena vacía cuando no hay texto", () => {
        expect(capitalizarInicial("")).toBe("");
        expect(capitalizarInicial(null)).toBe("");
        expect(capitalizarInicial("   ")).toBe("");
    });
});

describe("primerNombreAdmin", () => {
    it("toma solo el primer nombre", () => {
        expect(primerNombreAdmin("carlos andrés gómez")).toBe("Carlos");
    });

    it("usa el respaldo cuando no hay nombre", () => {
        expect(primerNombreAdmin("")).toBe("Admin");
        expect(primerNombreAdmin(null)).toBe("Admin");
    });
});

describe("esAdmin", () => {
    it("solo acepta al usuario con rol admin", () => {
        expect(esAdmin({ rol: "admin" })).toBe(true);
        expect(esAdmin({ rol: "profesor" })).toBe(false);
        expect(esAdmin({})).toBe(false);
        expect(esAdmin(null)).toBe(false);
    });
});

describe("hayMoraEnCartera", () => {
    it("solo hay mora cuando el resumen trae estudiantes", () => {
        expect(hayMoraEnCartera({ total_estudiantes: 3 })).toBe(true);
        expect(hayMoraEnCartera({ total_estudiantes: 0 })).toBe(false);
        expect(hayMoraEnCartera(null)).toBe(false);
    });
});

describe("textoResumenMora", () => {
    it("describe el conteo y el monto en mora", () => {
        const texto = textoResumenMora({ total_estudiantes: 3, total_mora: 80000 });

        expect(texto).toContain("3 estudiantes en mora · Mora:");
        expect(texto).toContain("80.000");
    });
});

describe("esTeclaDeActivacion", () => {
    it("activa la tarjeta con Enter y con espacio", () => {
        expect(esTeclaDeActivacion("Enter")).toBe(true);
        expect(esTeclaDeActivacion(" ")).toBe(true);
    });

    it("ignora cualquier otra tecla", () => {
        expect(esTeclaDeActivacion("Tab")).toBe(false);
        expect(esTeclaDeActivacion("a")).toBe(false);
    });
});
