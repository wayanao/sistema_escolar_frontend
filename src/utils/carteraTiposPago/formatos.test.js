import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, nombreCompleto } from "./formatos";

describe("formatos de cartera y tipos de pago", () => {
    it("formatea importes como pesos colombianos sin decimales", () => {
        const formatoActual = new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        });

        expect(formatMoney(125000.75)).toBe(formatoActual.format(125000.75));
        expect(formatMoney(null)).toBe(formatoActual.format(0));
    });

    it("conserva el marcador vacío y el fallback de fechas inválidas", () => {
        expect(formatDate("")).toBe("—");
        expect(formatDate("fecha-invalida-larga")).toBe("fecha-inva");
    });

    it("arma el nombre con apellido primero y compacta espacios", () => {
        expect(nombreCompleto({ nombre: "  Ana María ", apellido: " Pérez  " })).toBe(
            "Pérez Ana María"
        );
        expect(nombreCompleto(null)).toBe("");
    });
});
