import { describe, expect, it } from "vitest";
import {
    LETRAS_MURO,
    banderinesMuro,
    duracionPaseo,
    puntosDePaseo,
    rutaCerrada,
    rutaDeSoltar,
    sombraContorno,
} from "./globos";

describe("banderinesMuro", () => {
    it("escribe CUMPLEAÑOS, una letra por banderín", () => {
        expect(banderinesMuro().map((banderin) => banderin.letra).join("")).toBe("CUMPLEAÑOS");
        expect(LETRAS_MURO).toHaveLength(10);
    });

    it("cuelgan más abajo en el centro y se ladean igual a cada lado", () => {
        const banderines = banderinesMuro();
        const primero = banderines[0];
        const ultimo = banderines[banderines.length - 1];

        expect(primero.giro).toBe(-ultimo.giro);
        expect(primero.caida).toBe(ultimo.caida);
        expect(banderines[4].caida).toBeGreaterThan(primero.caida);
        banderines.forEach((banderin) => expect(banderin.caida).toBeGreaterThanOrEqual(2));
    });
});

describe("sombraContorno", () => {
    it("pone ocho sombras de un píxel del color dado", () => {
        const sombra = sombraContorno("#123456");

        expect(sombra.split(", ")).toHaveLength(8);
        expect(sombra.match(/#123456/g)).toHaveLength(8);
    });
});

describe("puntosDePaseo", () => {
    const area = { izquierda: 300, derecha: 1300, arriba: 16, abajo: 784 };
    const tamano = { ancho: 116, alto: 200 };

    it("deja el globo entero dentro del área", () => {
        [0, 0.5, 0.999].forEach((valor) => {
            puntosDePaseo(area, tamano, () => valor).forEach(([x, y]) => {
                expect(x).toBeGreaterThanOrEqual(300 + 58 + 8);
                expect(x).toBeLessThanOrEqual(1300 - 58 - 8);
                expect(y).toBeGreaterThanOrEqual(16 + 100 + 8);
                expect(y).toBeLessThanOrEqual(784 - 100 - 8);
            });
        });
    });

    it("se turna entre la mitad izquierda y la derecha", () => {
        const puntos = puntosDePaseo(area, tamano, () => 0.5);
        const centro = (300 + 1300) / 2;

        expect(puntos).toHaveLength(6);
        puntos.forEach(([x], indice) => {
            if (indice % 2 === 0) expect(x).toBeLessThan(centro);
            else expect(x).toBeGreaterThan(centro);
        });
    });

    it("no se sale aunque la pantalla sea más pequeña que el globo", () => {
        const puntos = puntosDePaseo({ izquierda: 0, derecha: 50, arriba: 0, abajo: 50 }, tamano, () => 0.5);

        puntos.forEach(([x, y]) => {
            expect(Number.isFinite(x)).toBe(true);
            expect(Number.isFinite(y)).toBe(true);
        });
    });
});

describe("rutaCerrada", () => {
    const puntos = [
        [100, 100],
        [400, 300],
        [200, 500],
    ];

    it("pasa por todos los puntos y vuelve al primero", () => {
        const ruta = rutaCerrada(puntos);

        expect(ruta.startsWith("M 100 100 C")).toBe(true);
        expect(ruta.match(/ C /g)).toHaveLength(3);
        expect(ruta.endsWith(" 100 100")).toBe(true);
        expect(ruta).toContain(" 400 300 C");
    });

    it("sin dos puntos no hay camino", () => {
        expect(rutaCerrada([[1, 1]])).toBe("");
        expect(rutaCerrada([])).toBe("");
    });
});

describe("rutaDeSoltar", () => {
    it("sale del muro hacia arriba y llega al primer punto del paseo", () => {
        const ruta = rutaDeSoltar([640.4, 1500.6], [500, 300]);

        expect(ruta.startsWith("M 640 1501 C 640 ")).toBe(true);
        expect(ruta.endsWith(" 500 300")).toBe(true);
        const subida = Number(ruta.split(" ")[5]);
        expect(subida).toBeLessThan(1501);
    });
});

describe("duracionPaseo", () => {
    it("va a velocidad pareja, entre 30 segundos y 2 minutos", () => {
        expect(duracionPaseo([[0, 0], [10, 0]])).toBe(30000);
        expect(duracionPaseo([[0, 0], [100000, 0]])).toBe(120000);

        const media = duracionPaseo([
            [0, 0],
            [1000, 0],
            [1000, 1000],
            [0, 1000],
        ]);
        expect(media).toBeGreaterThan(30000);
        expect(media).toBeLessThan(120000);
    });
});
