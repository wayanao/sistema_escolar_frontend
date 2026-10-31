import { describe, expect, it } from "vitest";
import {
    avisoRangoPesos,
    formatearPesos,
    limpiarPesos,
    posicionTrasDigitos,
    separarMiles,
} from "./formatoPesos";

// El formato colombiano separa el signo con un espacio que no se parte.
const conEspacioNormal = (texto) => texto.replace(/\u00a0/g, " ");

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
        expect(formatearPesos(400)).toBe("$\u00a0400");
    });
});

describe("limpiarPesos", () => {
    it("deja solo los dígitos de lo que se escribe", () => {
        expect(limpiarPesos("150.000")).toBe("150000");
        expect(limpiarPesos("$ 1.500.000")).toBe("1500000");
        expect(limpiarPesos("abc")).toBe("");
        expect(limpiarPesos("")).toBe("");
    });

    it("la coma tampoco parte el número: 150,000 es ciento cincuenta mil", () => {
        expect(limpiarPesos("150,000")).toBe("150000");
    });

    it("quita los ceros de adelante, pero deja un cero solo", () => {
        expect(limpiarPesos("007")).toBe("7");
        expect(limpiarPesos("0")).toBe("0");
    });
});

describe("separarMiles", () => {
    it("pone los puntos de miles al valor del estado", () => {
        expect(separarMiles("150000")).toBe("150.000");
        expect(separarMiles(1500000)).toBe("1.500.000");
        expect(separarMiles("999")).toBe("999");
        expect(separarMiles("0")).toBe("0");
    });

    it("lee el valor que llega del backend con decimales", () => {
        expect(separarMiles("200000.00")).toBe("200.000");
        expect(separarMiles(1500.6)).toBe("1.501");
    });

    it("deja vacío lo vacío, para que se vea el ejemplo del campo", () => {
        for (const valor of ["", null, undefined, "abc"]) {
            expect(separarMiles(valor)).toBe("");
        }
    });
});

describe("posicionTrasDigitos", () => {
    it("ubica el cursor detrás del mismo número de dígitos", () => {
        expect(posicionTrasDigitos("150.000", 3)).toBe(3);
        expect(posicionTrasDigitos("150.000", 4)).toBe(5);
        expect(posicionTrasDigitos("1.500.000", 0)).toBe(0);
    });

    it("si faltan dígitos, lo deja al final", () => {
        expect(posicionTrasDigitos("5", 2)).toBe(1);
    });
});

describe("avisoRangoPesos", () => {
    it("no avisa nada si el valor está en el rango o vacío", () => {
        expect(avisoRangoPesos("80000", { min: 1, max: 200000 })).toBe("");
        expect(avisoRangoPesos("", { min: 1 })).toBe("");
        expect(avisoRangoPesos("5000")).toBe("");
    });

    it("avisa el mínimo y el máximo en pesos", () => {
        expect(conEspacioNormal(avisoRangoPesos("0", { min: 1 }))).toBe("El valor mínimo es $ 1.");
        expect(conEspacioNormal(avisoRangoPesos("250000", { max: 200000 }))).toBe(
            "El valor máximo es $ 200.000."
        );
    });
});
