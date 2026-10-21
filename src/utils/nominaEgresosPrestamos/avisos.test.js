import { describe, expect, it } from "vitest";
import { esRespuestaIncierta, explicacionDelRechazo, pesosEnMensaje } from "./avisos";

describe("avisos compartidos de nómina, egresos y préstamos", () => {
    it("escribe los pesos como Colombia, con dos decimales", () => {
        const esperado = (1525).toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        expect(pesosEnMensaje(1525)).toBe(`$${esperado}`);
        expect(pesosEnMensaje("1525")).toBe(`$${esperado}`);
    });

    it("trata como cero un monto vacío o que no es número", () => {
        const cero = (0).toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        expect(pesosEnMensaje("")).toBe(`$${cero}`);
        expect(pesosEnMensaje(undefined)).toBe(`$${cero}`);
    });

    it("no se sabe si se guardó cuando el servidor no respondió", () => {
        expect(esRespuestaIncierta(new Error("Network Error"))).toBe(true);
    });

    it("tampoco se sabe cuando contestó un intermediario en vez del servidor", () => {
        for (const status of [502, 503, 504]) {
            expect(esRespuestaIncierta({ response: { status } })).toBe(true);
        }
    });

    it("una respuesta de error del servidor es segura: no se guardó nada", () => {
        expect(esRespuestaIncierta({ response: { status: 500 } })).toBe(false);
        expect(esRespuestaIncierta({ response: { status: 400 } })).toBe(false);
    });

    it("solo usa la explicación del backend cuando es un rechazo con texto", () => {
        expect(
            explicacionDelRechazo({ response: { status: 400, data: { detail: "Monto inválido." } } })
        ).toBe("Monto inválido.");
        expect(
            explicacionDelRechazo({ response: { status: 500, data: { detail: "psycopg2 boom" } } })
        ).toBeNull();
        expect(
            explicacionDelRechazo({ response: { status: 422, data: { detail: [{ msg: "x" }] } } })
        ).toBeNull();
        expect(explicacionDelRechazo({ response: { status: 400, data: { detail: "  " } } })).toBeNull();
        expect(explicacionDelRechazo(new Error("Network Error"))).toBeNull();
    });
});
