import { describe, expect, it } from "vitest";

import { VALORACIONES_DESARROLLO } from "../constants/valoracionesDesarrollo";
import {
    esEvaluacionDesarrollo,
    obtenerValoracion,
    promedioDeValoraciones,
    valorDeValoracion,
    valoracionDesdePromedio,
} from "./valoracionesDesarrollo";

describe("escala de desarrollo", () => {
    // Prueba gemela de test_la_escala_es_la_misma_del_frontend en el backend
    // (tests/test_subnotas_planilla_calculo.py): el servidor calcula la carita
    // de una celda con subnotas usando esta misma escala. Si cambia aqui,
    // cambia alla.
    it("expone las cuatro caritas con su equivalencia numerica", () => {
        expect(VALORACIONES_DESARROLLO.map((opcion) => [opcion.value, opcion.valor])).toEqual([
            ["destacado", 5],
            ["logrado", 4],
            ["proceso", 3],
            ["apoyo", 2],
        ]);
    });

    it("traduce una carita a su numero", () => {
        expect(valorDeValoracion("destacado")).toBe(5);
        expect(valorDeValoracion("apoyo")).toBe(2);
    });

    it("devuelve null ante un codigo que no pertenece a la escala", () => {
        expect(valorDeValoracion("inventado")).toBeNull();
        expect(valorDeValoracion("")).toBeNull();
        expect(obtenerValoracion("inventado")).toBeNull();
    });
});

describe("promedioDeValoraciones", () => {
    it("promedia las caritas por su equivalencia numerica", () => {
        expect(promedioDeValoraciones(["destacado", "logrado", "logrado"])).toBeCloseTo(4.33, 2);
    });

    it("ignora las casillas sin calificar en vez de contarlas como cero", () => {
        expect(promedioDeValoraciones(["destacado", "", null, undefined])).toBe(5);
    });

    it("ignora codigos desconocidos", () => {
        expect(promedioDeValoraciones(["logrado", "inventado"])).toBe(4);
    });

    it("devuelve null cuando no queda ninguna carita valida", () => {
        expect(promedioDeValoraciones([])).toBeNull();
        expect(promedioDeValoraciones(["", null])).toBeNull();
        expect(promedioDeValoraciones(undefined)).toBeNull();
    });
});

describe("valoracionDesdePromedio", () => {
    it("elige la carita mas cercana al promedio", () => {
        expect(valoracionDesdePromedio(4.33).value).toBe("logrado");
        expect(valoracionDesdePromedio(3.6).value).toBe("logrado");
        expect(valoracionDesdePromedio(3.4).value).toBe("proceso");
        expect(valoracionDesdePromedio(2.1).value).toBe("apoyo");
    });

    it("ante un empate se queda con la carita mas alta", () => {
        expect(valoracionDesdePromedio(4.5).value).toBe("destacado");
        expect(valoracionDesdePromedio(3.5).value).toBe("logrado");
        expect(valoracionDesdePromedio(2.5).value).toBe("proceso");
    });

    it("respeta los extremos de la escala", () => {
        expect(valoracionDesdePromedio(5).value).toBe("destacado");
        expect(valoracionDesdePromedio(2).value).toBe("apoyo");
        expect(valoracionDesdePromedio(1).value).toBe("apoyo");
    });

    it("devuelve null cuando no hay promedio, para distinguir sin calificar", () => {
        expect(valoracionDesdePromedio(null)).toBeNull();
        expect(valoracionDesdePromedio(undefined)).toBeNull();
        expect(valoracionDesdePromedio("abc")).toBeNull();
    });
});

describe("esEvaluacionDesarrollo", () => {
    it("detecta una sola evaluacion de desarrollo en el conjunto", () => {
        expect(
            esEvaluacionDesarrollo([
                { tipo_evaluacion: "numerica" },
                { tipo_evaluacion: "desarrollo" },
            ]),
        ).toBe(true);
    });

    it("es falso sin evaluaciones de desarrollo", () => {
        expect(esEvaluacionDesarrollo([{ tipo_evaluacion: "numerica" }])).toBe(false);
        expect(esEvaluacionDesarrollo([])).toBe(false);
        expect(esEvaluacionDesarrollo(undefined)).toBe(false);
    });
});
