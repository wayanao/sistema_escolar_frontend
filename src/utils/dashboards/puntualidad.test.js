import { describe, expect, it } from "vitest";
import {
    CURSOS_PUNTUALES_VISIBLES,
    MENSAJE_ERROR_PUNTUALIDAD,
    detallePuntual,
    normalizarPuntualidad,
    porcentajeVisible,
    textoCostumbreDePago,
    textoCuotasATiempo,
    textoCursoPuntual,
    textoDespuesDelRanking,
    textoSinAtrasos,
} from "./puntualidad";

// Forma real de `GET /cartera/puntualidad` (docs/API_ENDPOINTS.md del backend).
const respuesta = {
    fecha_corte: "2026-11-11",
    total_estudiantes: 3,
    siempre_a_tiempo: 2,
    porcentaje: 66.7,
    mejores: [
        {
            estudiante_id: 3,
            nombre: "carla",
            apellido: "cruz",
            curso_id: 20,
            curso_nombre: "SEXTO",
            cuotas_vencidas: 2,
            cuotas_a_tiempo: 2,
            dias_antes_promedio: 21.5,
            siempre_a_tiempo: true,
        },
        {
            estudiante_id: 2,
            nombre: "BETO",
            apellido: "BRAVO",
            curso_id: 10,
            curso_nombre: "QUINTO",
            cuotas_vencidas: 2,
            cuotas_a_tiempo: 1,
            dias_antes_promedio: 4,
            siempre_a_tiempo: false,
        },
    ],
    cursos: [
        {
            curso_id: 20,
            curso_nombre: "SEXTO",
            estudiantes: 1,
            siempre_a_tiempo: 1,
            porcentaje: 100,
            mejores: [],
        },
        {
            curso_id: 10,
            curso_nombre: "QUINTO",
            estudiantes: 3,
            siempre_a_tiempo: 1,
            porcentaje: 33.3,
            mejores: [],
        },
    ],
};

describe("normalizarPuntualidad", () => {
    it("arma el total, los mejores y los cursos con sus puestos", () => {
        const datos = normalizarPuntualidad(respuesta);

        expect(datos.totalEstudiantes).toBe(3);
        expect(datos.siempreATiempo).toBe(2);
        expect(datos.mejores[0]).toEqual({
            estudianteId: 3,
            puesto: 1,
            nombre: "Carla Cruz",
            iniciales: "CC",
            curso: "SEXTO",
            cuotasVencidas: 2,
            cuotasATiempo: 2,
            diasAntes: 21.5,
            siempreATiempo: true,
        });
        expect(datos.mejores[1]).toMatchObject({ puesto: 2, nombre: "Beto Bravo", siempreATiempo: false });
        expect(datos.cursos.map((curso) => [curso.puesto, curso.nombre, curso.porcentaje])).toEqual([
            [1, "SEXTO", 100],
            [2, "QUINTO", 33],
        ]);
        expect(datos.cursos[1]).toMatchObject({ cursoId: 10, estudiantes: 3, siempreATiempo: 1, mejores: [] });
    });

    it("no se rompe con una respuesta vacía o rara", () => {
        expect(normalizarPuntualidad(null)).toEqual({
            totalEstudiantes: 0,
            siempreATiempo: 0,
            mejores: [],
            cursos: [],
        });
        expect(normalizarPuntualidad({ total_estudiantes: "x", mejores: {}, cursos: "no" })).toEqual({
            totalEstudiantes: 0,
            siempreATiempo: 0,
            mejores: [],
            cursos: [],
        });
    });

    it("sin días promedio queda en null y sin nombre dice «Estudiante»", () => {
        const [estudiante] = normalizarPuntualidad({ mejores: [{ dias_antes_promedio: null }] }).mejores;

        expect(estudiante.diasAntes).toBeNull();
        expect(estudiante.nombre).toBe("Estudiante");
        expect(estudiante.curso).toBe("Sin curso");
    });
});

describe("porcentajeVisible", () => {
    it("redondea sin decimales", () => {
        expect(porcentajeVisible(142, 286)).toBe(50);
        expect(porcentajeVisible(2, 3)).toBe(67);
    });

    it("no dice 100 % si alguien se atrasó ni 0 % si alguien paga a tiempo", () => {
        expect(porcentajeVisible(999, 1000)).toBe(99);
        expect(porcentajeVisible(1, 1000)).toBe(1);
        expect(porcentajeVisible(5, 5)).toBe(100);
        expect(porcentajeVisible(0, 5)).toBe(0);
    });

    it("sin estudiantes es 0", () => {
        expect(porcentajeVisible(0, 0)).toBe(0);
    });
});

describe("textos", () => {
    it("el anillo sirve para uno o muchos", () => {
        expect(textoSinAtrasos(1)).toBe("estudiante sin atrasarse ni un mes este año.");
        expect(textoSinAtrasos(286)).toBe("estudiantes sin atrasarse ni un mes este año.");
    });

    it("la fila de cada curso concuerda en singular y plural", () => {
        expect(textoCursoPuntual({ siempreATiempo: 1, estudiantes: 3 })).toBe("1 de 3 paga siempre a tiempo");
        expect(textoCursoPuntual({ siempreATiempo: 12, estudiantes: 20 })).toBe("12 de 20 pagan siempre a tiempo");
    });

    it("dice cuántos días antes suele pagar", () => {
        expect(textoCostumbreDePago(5.4)).toBe("Suele pagar 5 días antes");
        expect(textoCostumbreDePago(1)).toBe("Suele pagar 1 día antes");
        expect(textoCostumbreDePago(0.2)).toBe("Suele pagar el día límite");
        expect(textoCostumbreDePago(-2)).toBe("Suele pagar en los días de gracia");
        expect(textoCostumbreDePago(45)).toBe("Suele adelantar sus pagos");
        expect(textoCostumbreDePago(null)).toBe("");
    });

    it("el detalle de quien se atrasó dice cuántas cuotas pagó tarde", () => {
        const puntual = { siempreATiempo: true, diasAntes: 7, cuotasVencidas: 10, cuotasATiempo: 10 };
        const conAtrasos = { siempreATiempo: false, diasAntes: 3, cuotasVencidas: 10, cuotasATiempo: 9 };

        expect(detallePuntual(puntual)).toBe("Suele pagar 7 días antes");
        expect(detallePuntual(conAtrasos)).toBe("Pagó tarde 1 cuota");
        expect(detallePuntual({ ...conAtrasos, cuotasATiempo: 7 })).toBe("Pagó tarde 3 cuotas");
        expect(textoCuotasATiempo(conAtrasos)).toBe("9 de 10");
    });

    it("bajo el ranking dice si hay más o si los de la lista se atrasaron", () => {
        const lista = (puntuales, conAtrasos = 0) => [
            ...Array.from({ length: puntuales }, () => ({ siempreATiempo: true })),
            ...Array.from({ length: conAtrasos }, () => ({ siempreATiempo: false })),
        ];

        expect(textoDespuesDelRanking(142, lista(6))).toBe("Y 136 más pagan siempre a tiempo.");
        expect(textoDespuesDelRanking(6, lista(5))).toBe("Y 1 más paga siempre a tiempo.");
        expect(textoDespuesDelRanking(5, lista(5))).toBe("Son todos los que pagan siempre a tiempo.");
        expect(textoDespuesDelRanking(1, lista(1))).toBe("Nadie más paga siempre a tiempo.");
        expect(textoDespuesDelRanking(2, lista(2, 3))).toBe(
            "Solo 2 pagan siempre a tiempo; los demás de la lista se atrasaron alguna vez.",
        );
        expect(textoDespuesDelRanking(1, lista(1, 2))).toBe(
            "Solo 1 paga siempre a tiempo; los demás de la lista se atrasaron alguna vez.",
        );
        expect(textoDespuesDelRanking(0, lista(0, 3))).toBe(
            "Nadie paga siempre a tiempo; estos son los que menos se atrasan.",
        );
        expect(textoDespuesDelRanking(4, [])).toBe("");
    });

    it("cuenta a los puntuales que faltan aunque la lista tenga a alguien que se atrasó", () => {
        // No debería llegar así del backend (los puntuales van primero), pero
        // la cuenta no puede salir corta.
        const lista = [{ siempreATiempo: true }, { siempreATiempo: true }, { siempreATiempo: false }];

        expect(textoDespuesDelRanking(8, lista)).toBe("Y 6 más pagan siempre a tiempo.");
    });

    it("constantes del cuadro", () => {
        expect(CURSOS_PUNTUALES_VISIBLES).toBe(5);
        expect(MENSAJE_ERROR_PUNTUALIDAD).toBe("No se pudo cargar quién paga a tiempo.");
    });
});
