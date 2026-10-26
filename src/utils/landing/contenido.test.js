import { describe, expect, it } from "vitest";
import * as contenido from "./contenido";
import {
    PLANILLA_DEMO,
    ROLES,
    SECCIONES_LANDING,
    formatearNota,
    nivelNota,
} from "./contenido";

// Redondeo a una cifra con la mitad hacia arriba, como la planilla real.
const redondearUnaCifra = (valor) => Math.round(valor * 10 + 1e-9) / 10;

describe("contenido de la landing", () => {
    it("no promete lo que el sistema no hace ni un contacto que aún no existe", () => {
        const textos = JSON.stringify(
            Object.values(contenido).filter((valor) => typeof valor !== "function"),
        );

        // Ni portal de padres, ni app para descargar, ni WhatsApp por ahora.
        expect(textos).not.toMatch(/padres|acudiente/i);
        expect(textos).not.toMatch(/\bapps?\b|descarga/i);
        expect(textos).not.toMatch(/whatsapp/i);
    });

    it("usa anclas únicas para el menú", () => {
        const ids = SECCIONES_LANDING.map((seccion) => seccion.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("da a cada rol sus funciones", () => {
        expect(ROLES.map((rol) => rol.id)).toEqual(["rectoria", "profesores"]);
        ROLES.forEach((rol) => expect(rol.funciones.length).toBeGreaterThan(0));
    });
});

describe("PLANILLA_DEMO", () => {
    it("reparte el 100 % entre las actividades", () => {
        const total = PLANILLA_DEMO.actividades.reduce((suma, item) => suma + item.porcentaje, 0);
        expect(total).toBe(100);
    });

    it("muestra definitivas que cuadran con los porcentajes", () => {
        PLANILLA_DEMO.filas.forEach((fila) => {
            const ponderada = fila.notas.reduce(
                (suma, nota, indice) =>
                    suma + (nota * PLANILLA_DEMO.actividades[indice].porcentaje) / 100,
                0,
            );
            expect(fila.definitiva).toBe(redondearUnaCifra(ponderada));
        });
    });
});

describe("nivelNota", () => {
    it("clasifica en la escala de 1 a 5", () => {
        expect(nivelNota(4)).toBe("alto");
        expect(nivelNota(3.9)).toBe("basico");
        expect(nivelNota(3)).toBe("basico");
        expect(nivelNota(2.9)).toBe("bajo");
    });
});

describe("formatearNota", () => {
    it("usa coma decimal y una cifra", () => {
        expect(formatearNota(4.6)).toBe("4,6");
        expect(formatearNota(4)).toBe("4,0");
    });
});
