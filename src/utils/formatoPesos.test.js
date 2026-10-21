import { describe, expect, it } from "vitest";
import { formatearPesos } from "./formatoPesos";

// El formato colombiano separa el signo con un espacio que no se parte.
const conEspacioNormal = (texto) => texto.replace(/ /g, " ");

describe("formatearPesos", () => {
    it("escribe los pesos colombianos sin centavos, con puntos de miles", () => {
        expect(conEspacioNormal(formatearPesos(1500000))).toBe("$ 1.500.000");
        expect(conEspacioNormal(formatearPesos(400))).toBe("$ 400");
        expect(conEspacioNormal(formatearPesos("1525"))).toBe("$ 1.525");
    });

    it("redondea los centavos al peso más cercano", () => {
        expect(conEspacioNormal(formatearPesos(1500.4))).toBe("$ 1.500");
        expect(conEspacioNormal(formatearPesos(150.5))).toBe("$ 151");
    });

    it("muestra los negativos con su signo", () => {
        expect(conEspacioNormal(formatearPesos(-100))).toBe("-$ 100");
    });

    it("trata como cero lo vacío o lo que no es un número", () => {
        for (const valor of [0, "", null, undefined, "abc"]) {
            expect(conEspacioNormal(formatearPesos(valor))).toBe("$ 0");
        }
    });

    it("usa el mismo espacio que ya muestra Cartera", () => {
        expect(formatearPesos(400)).toBe("$ 400");
    });
});
