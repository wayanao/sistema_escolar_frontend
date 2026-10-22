import { describe, expect, it } from "vitest";
import {
    MENSAJE_PORCENTAJE_INVALIDO,
    MENSAJE_SUMA_EXCEDIDA,
    PORCENTAJE_MAXIMO,
    PORCENTAJE_MINIMO,
    SUMA_COMPLETA,
    admitePorcentaje,
    aplicarPorcentajeGuardado,
    aplicarPromediosPonderados,
    calcularPromedioPonderado,
    construirPayloadPorcentaje,
    leerPorcentajeEscrito,
    normalizarPorcentajesPorTipo,
    notaPonderada,
    porcentajesActivos,
    sumaDePorcentajes,
    validarPorcentajeNuevo,
} from "./porcentajes";

// Gemela de `tests/test_nota_periodo.py` del backend: los mismos casos con las
// mismas cifras. Si una regla cambia allí, cambia aquí.

const TIPOS = ["Cognitivo", "Procedimental", "Actitudinal"];
const COMPLETOS = { Cognitivo: 50, Procedimental: 30, Actitudinal: 20 };

const numericas = (notas) => Object.entries(notas).map(([tipo, nota]) => [tipo, nota, null]);
const caritas = (codigos) => Object.entries(codigos).map(([tipo, codigo]) => [tipo, null, codigo]);

describe("límites de los porcentajes (PB2)", () => {
    it("son enteros de 1 a 100 y la suma completa es 100", () => {
        expect([PORCENTAJE_MINIMO, PORCENTAJE_MAXIMO, SUMA_COMPLETA]).toEqual([1, 100, 100]);
    });

    it("las columnas internas no llevan porcentaje", () => {
        expect(admitePorcentaje("mas_alto")).toBe(false);
        expect(admitePorcentaje(" MAS_ALTO ")).toBe(false);
        expect(admitePorcentaje("Desde React")).toBe(false);
        expect(admitePorcentaje("Cognitivo")).toBe(true);
    });

    it("los mensajes son los mismos del backend", () => {
        expect(MENSAJE_PORCENTAJE_INVALIDO).toBe("El porcentaje debe ser un número entero de 1 a 100.");
        expect(MENSAJE_SUMA_EXCEDIDA).toBe("Los porcentajes de esta planilla no pueden sumar más de 100 %.");
    });
});

describe("todo o nada (QB2)", () => {
    it("activos cuando todos los tipos tienen porcentaje y suman 100", () => {
        expect(porcentajesActivos(TIPOS, COMPLETOS)).toBe(true);
    });

    it("no activos si falta uno, si suman menos o sin ninguno", () => {
        expect(porcentajesActivos(TIPOS, { Cognitivo: 50, Procedimental: 50 })).toBe(false);
        expect(porcentajesActivos(TIPOS, { ...COMPLETOS, Actitudinal: 10 })).toBe(false);
        expect(porcentajesActivos(TIPOS, {})).toBe(false);
        expect(porcentajesActivos([], { Cognitivo: 100 })).toBe(false);
    });

    it("las columnas internas no cuentan y el porcentaje de un tipo borrado tampoco", () => {
        expect(porcentajesActivos([...TIPOS, "mas_alto"], COMPLETOS)).toBe(true);
        const sobrante = { Cognitivo: 70, Procedimental: 30, Borrado: 40 };
        expect(porcentajesActivos(["Cognitivo", "Procedimental"], sobrante)).toBe(true);
        expect(sumaDePorcentajes(["Cognitivo", "Procedimental"], sobrante)).toBe(100);
    });

    it("compara los tipos sin mayúsculas ni espacios en los extremos", () => {
        const guardados = { " cognitivo ": 50, PROCEDIMENTAL: 30, actitudinal: 20 };
        expect(porcentajesActivos(TIPOS, guardados)).toBe(true);
        expect(sumaDePorcentajes(TIPOS, { Cognitivo: 40, Procedimental: 30 })).toBe(70);
    });
});

describe("nota ponderada en primaria (PB4)", () => {
    it("ejemplo de B0 con las tres notas: 3.90", () => {
        const celdas = numericas({ Cognitivo: 4, Procedimental: 3, Actitudinal: 5 });
        expect(notaPonderada(celdas, COMPLETOS)).toEqual({ valor: 3.9, valoracion: null });
    });

    it("sin una nota reparte su peso: 3.625 sube a 3.63", () => {
        const celdas = numericas({ Cognitivo: 4, Procedimental: 3, Actitudinal: null });
        expect(notaPonderada(celdas, COMPLETOS)).toEqual({ valor: 3.63, valoracion: null });
    });

    it("con una sola nota es esa nota, y sin ninguna queda vacía", () => {
        expect(notaPonderada(numericas({ Procedimental: 3.7 }), COMPLETOS).valor).toBe(3.7);
        expect(notaPonderada(numericas({ Cognitivo: null }), COMPLETOS)).toBeNull();
        expect(notaPonderada([], COMPLETOS)).toBeNull();
    });

    it.each([
        [4.1, 4.15, 4.13],
        [1, 1.01, 1.01],
        ["3.25", "4.00", 3.63],
    ])("redondea mitad hacia arriba: %s y %s dan %s", (primera, segunda, esperada) => {
        const mitad = { Cognitivo: 50, Procedimental: 50 };
        const celdas = numericas({ Cognitivo: primera, Procedimental: segunda });
        expect(notaPonderada(celdas, mitad).valor).toBe(esperada);
    });

    it("tres tipos iguales con 33 + 33 + 34 dan 3.99", () => {
        const tercios = { Cognitivo: 33, Procedimental: 33, Actitudinal: 34 };
        const celdas = numericas({ Cognitivo: 5, Procedimental: 4, Actitudinal: 3 });
        expect(notaPonderada(celdas, tercios).valor).toBe(3.99);
    });

    it("no cuentan las columnas internas, las notas fuera de 1 a 5 ni las celdas sin porcentaje", () => {
        const celdas = [
            ...numericas({ Cognitivo: 4, Procedimental: 3, Actitudinal: 5 }),
            ["mas_alto", 1, null],
            ["Otro", 1, null],
        ];
        expect(notaPonderada(celdas, COMPLETOS).valor).toBe(3.9);
        const conCero = numericas({ Cognitivo: 4, Procedimental: 0, Actitudinal: null });
        expect(notaPonderada(conCero, COMPLETOS).valor).toBe(4);
    });

    it("compara el tipo de cada celda sin mayúsculas", () => {
        const celdas = [[" cognitivo", 4, null], ["PROCEDIMENTAL ", 3, null], ["Actitudinal", 5, null]];
        expect(notaPonderada(celdas, COMPLETOS).valor).toBe(3.9);
    });
});

describe("nota ponderada en preescolar (QB1)", () => {
    it("con empate gana la carita más alta", () => {
        const mitad = { Cognitivo: 50, Procedimental: 50 };
        const resultado = notaPonderada(caritas({ Cognitivo: "destacado", Procedimental: "logrado" }), mitad, "desarrollo");
        expect(resultado.valor).toBe(4.5);
        expect(resultado.valoracion.value).toBe("destacado");
    });

    it("sin empate va a la más cercana", () => {
        const pesos = { Cognitivo: 60, Procedimental: 40 };
        const resultado = notaPonderada(caritas({ Cognitivo: "logrado", Procedimental: "proceso" }), pesos, "desarrollo");
        expect(resultado.valor).toBe(3.6);
        expect(resultado.valoracion.value).toBe("logrado");
    });

    it("reparte el peso de la que falta", () => {
        const celdas = caritas({ Cognitivo: "apoyo", Procedimental: null, Actitudinal: "destacado" });
        const resultado = notaPonderada(celdas, COMPLETOS, "desarrollo");
        expect(resultado.valor).toBe(2.86);
        expect(resultado.valoracion.value).toBe("proceso");
    });

    it("casi empate no es empate: 445 / 99 es logrado", () => {
        const pesos = { Cognitivo: 49, Procedimental: 50, Actitudinal: 1 };
        const celdas = caritas({ Cognitivo: "destacado", Procedimental: "logrado", Actitudinal: null });
        const resultado = notaPonderada(celdas, pesos, "desarrollo");
        expect(resultado.valor).toBe(4.49);
        expect(resultado.valoracion.value).toBe("logrado");
    });

    it("una carita fuera de la escala no cuenta, y sin ninguna queda vacía", () => {
        const celdas = caritas({ Cognitivo: "logrado", Procedimental: "inventada" });
        expect(notaPonderada(celdas, COMPLETOS, "desarrollo").valor).toBe(4);
        expect(notaPonderada(caritas({ Cognitivo: null }), COMPLETOS, "desarrollo")).toBeNull();
    });
});

describe("los porcentajes que llegan del servidor", () => {
    it("quedan solo los de columnas visibles, con su nombre exacto", () => {
        expect(
            normalizarPorcentajesPorTipo(
                { Cognitivo: 60, Borrado: 40, mas_alto: 10 },
                ["Cognitivo", "Procedimental"],
            ),
        ).toEqual({ Cognitivo: 60 });
    });

    it("sin porcentajes (o con un servidor viejo) queda vacío", () => {
        expect(normalizarPorcentajesPorTipo(undefined, ["Cognitivo"])).toEqual({});
        expect(normalizarPorcentajesPorTipo(null, ["Cognitivo"])).toEqual({});
    });

    it("aplica lo que respondió el servidor al guardar o quitar", () => {
        expect(aplicarPorcentajeGuardado({ Cognitivo: 50 }, { tipo_nota: "Procedimental", porcentaje: 30 }))
            .toEqual({ Cognitivo: 50, Procedimental: 30 });
        expect(aplicarPorcentajeGuardado({ Cognitivo: 50, Procedimental: 30 }, { tipo_nota: "Cognitivo", porcentaje: null }))
            .toEqual({ Procedimental: 30 });
    });
});

describe("el promedio de la planilla con porcentajes", () => {
    const estudiante = (notas, valoraciones = {}) => ({ estudiante_id: 1, notas, valoraciones, promedio: "x" });

    it("sin porcentajes activos devuelve la misma lista, sin tocarla", () => {
        const estudiantes = [estudiante({ Cognitivo: 4 })];
        expect(aplicarPromediosPonderados(estudiantes, TIPOS, { Cognitivo: 50 })).toBe(estudiantes);
        expect(aplicarPromediosPonderados(estudiantes, TIPOS, {})).toBe(estudiantes);
    });

    it("con porcentajes activos el promedio es el ponderado, con dos decimales", () => {
        const estudiantes = [
            estudiante({ Cognitivo: 4, Procedimental: 3, Actitudinal: 5 }),
            estudiante({}),
        ];
        const resultado = aplicarPromediosPonderados(estudiantes, TIPOS, COMPLETOS);
        expect(resultado.map((est) => est.promedio)).toEqual(["3.90", ""]);
        expect(resultado[0].notas).toBe(estudiantes[0].notas);
    });

    it("en preescolar pondera las caritas, como el promedio de hoy las prefiere", () => {
        const mitad = { Cognitivo: 50, Procedimental: 50 };
        const est = estudiante({}, { Cognitivo: "destacado", Procedimental: "logrado" });
        expect(calcularPromedioPonderado(est, ["Cognitivo", "Procedimental"], mitad)).toBe("4.50");
    });
});

describe("lo que escribe el profesor", () => {
    it("lee un porcentaje entero, con o sin el signo %", () => {
        expect(leerPorcentajeEscrito(" 40 ")).toEqual({ porcentaje: 40 });
        expect(leerPorcentajeEscrito("40%")).toEqual({ porcentaje: 40 });
        expect(leerPorcentajeEscrito("")).toEqual({ vacio: true });
        expect(leerPorcentajeEscrito(null)).toEqual({ vacio: true });
    });

    it.each(["0", "101", "33.5", "33,5", "abc", "-5"])("no acepta %s", (texto) => {
        expect(leerPorcentajeEscrito(texto)).toEqual({ invalido: true });
    });

    it("valida antes de enviar: vacío quita, inválido avisa, y la suma no pasa de 100", () => {
        const base = { columnas: TIPOS, porcentajes: { Cognitivo: 50, Procedimental: 30 } };
        expect(validarPorcentajeNuevo({ ...base, tipo: "Actitudinal", texto: "20" })).toEqual({ porcentaje: 20 });
        expect(validarPorcentajeNuevo({ ...base, tipo: "Actitudinal", texto: "" })).toEqual({ porcentaje: null });
        expect(validarPorcentajeNuevo({ ...base, tipo: "Actitudinal", texto: "0" })).toEqual({ error: MENSAJE_PORCENTAJE_INVALIDO });
        expect(validarPorcentajeNuevo({ ...base, tipo: "Actitudinal", texto: "21" })).toEqual({ error: MENSAJE_SUMA_EXCEDIDA });
        // Cambiar el de un tipo no cuenta el que tenía.
        expect(validarPorcentajeNuevo({ ...base, tipo: "Cognitivo", texto: "70" })).toEqual({ porcentaje: 70 });
    });

    it("un tipo nuevo, que todavía no es columna, también cuenta en la suma", () => {
        const base = { columnas: ["Cognitivo"], porcentajes: { Cognitivo: 80 } };
        expect(validarPorcentajeNuevo({ ...base, tipo: "Quiz", texto: "20" })).toEqual({ porcentaje: 20 });
        expect(validarPorcentajeNuevo({ ...base, tipo: "Quiz", texto: "25" })).toEqual({ error: MENSAJE_SUMA_EXCEDIDA });
    });

    it("arma el cuerpo de PUT /planilla/tipos/porcentaje", () => {
        expect(construirPayloadPorcentaje({ asignacionId: "12", periodo: "2", tipoNota: "Cognitivo", porcentaje: 40 }))
            .toEqual({ asignacion_id: 12, periodo: 2, tipo_nota: "Cognitivo", porcentaje: 40 });
        expect(construirPayloadPorcentaje({ asignacionId: 12, periodo: 2, tipoNota: "Cognitivo", porcentaje: null }).porcentaje)
            .toBeNull();
    });
});
