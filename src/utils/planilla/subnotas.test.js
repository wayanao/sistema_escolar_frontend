import { describe, expect, it } from "vitest";

import {
    MENSAJE_LIMITE_SUBNOTAS,
    MENSAJE_NOTA_CALCULADA,
    MENSAJE_NOMBRE_LARGO,
    MENSAJE_NOMBRE_REPETIDO,
    MENSAJE_NOMBRE_VACIO,
    aCentesimas,
    agregarSubnota,
    alcanzoElLimite,
    aplicarCalificacionesGuardadas,
    aplicarSubnotaBorrada,
    borradorInicial,
    calificacionesDelTipo,
    casillasInvalidas,
    construirPayloadCalificaciones,
    construirPayloadRenombrarSubnota,
    construirPayloadSubnota,
    contarCalificacionesDeSubnota,
    contarCalificadas,
    esCeldaCalculada,
    esErrorDeNotaCalculada,
    formatearNotaCalculada,
    leerNotaDeSubnota,
    mensajeDelServidor,
    normalizarSubnotasPorTipo,
    promedioDeCentesimas,
    quedaraSinSubnotas,
    quitarSubnota,
    renombrarSubnota,
    subnotasCambiadas,
    subnotasDelTipo,
    tieneNotaAMano,
    validarNombreSubnota,
    vistaPreviaDeCelda,
} from "./subnotas";

const COGNITIVO = [
    { id: 7, nombre: "Taller 1" },
    { id: 8, nombre: "Quiz" },
    { id: 9, nombre: "Parcial" },
];

const ANA = {
    estudiante_id: 501,
    nombre: "Ana",
    apellido: "Gómez",
    notas: { Cognitivo: 3.8, Actitudinal: 5 },
    valoraciones: { Cognitivo: null, Actitudinal: null },
    tipos_evaluacion: { Cognitivo: "numerica", Actitudinal: "numerica" },
    subnotas: { 7: 4, 8: 3, 9: 4.4, 12: 5 },
    promedio: "4.40",
};

describe("lo que llega del servidor", () => {
    it("deja solo las subnotas de las columnas que se ven", () => {
        const subnotas = {
            Cognitivo: [{ id: 7, nombre: "Taller 1", extra: "x" }],
            mas_alto: [{ id: 30, nombre: "Interna" }],
            Vacia: [],
        };

        expect(normalizarSubnotasPorTipo(subnotas, ["Cognitivo", "Vacia"])).toEqual({
            Cognitivo: [{ id: 7, nombre: "Taller 1" }],
        });
        // Un servidor sin subnotas en la respuesta no rompe nada.
        expect(normalizarSubnotasPorTipo(undefined, ["Cognitivo"])).toEqual({});
        expect(subnotasDelTipo({}, "Cognitivo")).toEqual([]);
    });

    it("lee lo calificado por el estudiante solo en las subnotas del tipo", () => {
        expect(calificacionesDelTipo(ANA, COGNITIVO)).toEqual({ 7: 4, 8: 3, 9: 4.4 });
        expect(contarCalificadas(ANA, COGNITIVO)).toBe(3);
        expect(calificacionesDelTipo({ ...ANA, subnotas: undefined }, COGNITIVO)).toEqual({});
    });

    it("P1: la celda es calculada con al menos una subnota calificada", () => {
        expect(esCeldaCalculada(ANA, COGNITIVO)).toBe(true);
        expect(esCeldaCalculada({ ...ANA, subnotas: { 9: "" } }, COGNITIVO)).toBe(false);
        expect(esCeldaCalculada(ANA, [])).toBe(false);
    });

    it("P3: reconoce una nota escrita a mano sin subnotas", () => {
        const aMano = { ...ANA, subnotas: {} };

        expect(tieneNotaAMano(aMano, "Cognitivo", COGNITIVO)).toBe(true);
        expect(tieneNotaAMano(ANA, "Cognitivo", COGNITIVO)).toBe(false);
        expect(tieneNotaAMano({ ...aMano, notas: {} }, "Cognitivo", COGNITIVO)).toBe(false);
        expect(
            tieneNotaAMano({ subnotas: {}, valoraciones: { Juego: "logrado" } }, "Juego", []),
        ).toBe(true);
    });

    it("la celda calculada muestra el promedio con dos decimales, o una raya", () => {
        expect(formatearNotaCalculada(3.8)).toBe("3.80");
        expect(formatearNotaCalculada(4)).toBe("4.00");
        expect(formatearNotaCalculada(null)).toBe("—");
        expect(formatearNotaCalculada("")).toBe("—");
        expect(formatearNotaCalculada("x")).toBe("—");
    });

    it("P5: cuenta cuántos estudiantes tienen calificada una subnota", () => {
        const luis = { estudiante_id: 502, subnotas: { 7: 5 } };
        const eva = { estudiante_id: 503, subnotas: {} };

        expect(contarCalificacionesDeSubnota([ANA, luis, eva], 7)).toBe(2);
        expect(contarCalificacionesDeSubnota([ANA, luis, eva], "9")).toBe(1);
    });
});

describe("notas y promedio, iguales a los del backend", () => {
    it.each([
        ["4", 400],
        ["4.5", 450],
        ["4,5", 450],
        ["4.155", 416], // mitad hacia arriba leyendo el texto: Math.round daría 415
        ["4.1549", 415],
        [" 3.80 ", 380],
        [4.15, 415],
        ["", null],
        ["abc", null],
        ["-4", null],
        ["1e1", null],
    ])("aCentesimas(%j) es %j", (valor, esperado) => {
        expect(aCentesimas(valor)).toBe(esperado);
    });

    it("lee una nota de subnota como el backend: rango sobre lo escrito", () => {
        expect(leerNotaDeSubnota("")).toEqual({ vacia: true });
        expect(leerNotaDeSubnota(null)).toEqual({ vacia: true });
        expect(leerNotaDeSubnota("4.5")).toEqual({ centesimas: 450 });
        expect(leerNotaDeSubnota("1")).toEqual({ centesimas: 100 });
        expect(leerNotaDeSubnota("5")).toEqual({ centesimas: 500 });
        // 0.995 redondearía a 1.00, pero lo escrito está fuera de rango.
        expect(leerNotaDeSubnota("0.995")).toEqual({ invalida: true });
        expect(leerNotaDeSubnota("5.5")).toEqual({ invalida: true });
        expect(leerNotaDeSubnota("cuatro")).toEqual({ invalida: true });
    });

    it.each([
        [[400, 300, 440], 3.8], // el ejemplo del documento
        [[410, 415], 4.13], // 4.125: el backend también da 4.13
        [[100, 101], 1.01], // 1.005: con números con decimales saldría 1.00
        [[500], 5],
        [[300, 400, 400], 3.67],
        [[], null],
    ])("promedioDeCentesimas(%j) es %j", (centesimas, esperado) => {
        expect(promedioDeCentesimas(centesimas)).toBe(esperado);
    });

    it("P2: la vista previa numérica ignora las casillas vacías y las mal escritas", () => {
        expect(vistaPreviaDeCelda({ 7: "5", 8: "", 9: "3.5" }, "numerica")).toEqual({ nota: 4.25 });
        expect(vistaPreviaDeCelda({ 7: "4", 8: "x" }, "numerica")).toEqual({ nota: 4 });
        expect(vistaPreviaDeCelda({ 7: "", 8: "" }, "numerica")).toBeNull();
    });

    it("P8: la vista previa de preescolar es la carita más cercana, empate a la más alta", () => {
        expect(vistaPreviaDeCelda({ 7: "logrado", 8: "destacado" }, "desarrollo").valoracion.value)
            .toBe("destacado");
        expect(
            vistaPreviaDeCelda({ 7: "logrado", 8: "logrado", 9: "destacado" }, "desarrollo")
                .valoracion.value,
        ).toBe("logrado");
        expect(vistaPreviaDeCelda({ 7: "" }, "desarrollo")).toBeNull();
    });
});

describe("lo que escribe el profesor en el modal", () => {
    it("arma el borrador con todas las subnotas del tipo, vacías las que no tiene", () => {
        const luis = { estudiante_id: 502, subnotas: { 8: 2.5 } };

        expect(borradorInicial(ANA, COGNITIVO)).toEqual({ 7: "4", 8: "3", 9: "4.4" });
        expect(borradorInicial(luis, COGNITIVO)).toEqual({ 7: "", 8: "2.5", 9: "" });
    });

    it("marca las casillas mal escritas solo en numérica", () => {
        const borrador = { 7: "4", 8: "6", 9: "" };

        expect(casillasInvalidas(borrador, "numerica")).toEqual(["8"]);
        expect(casillasInvalidas({ 7: "logrado" }, "desarrollo")).toEqual([]);
    });

    it("4, 4.0 y 4,00 son la misma nota: no cuentan como cambio", () => {
        const original = { 7: "4", 8: "3", 9: "" };

        expect(subnotasCambiadas(original, { 7: "4.0", 8: "3,00", 9: "" }, "numerica")).toEqual([]);
        expect(subnotasCambiadas(original, { 7: "4.5", 8: "", 9: "2" }, "numerica"))
            .toEqual(["7", "8", "9"]);
        expect(subnotasCambiadas({ 7: "logrado" }, { 7: "destacado" }, "desarrollo")).toEqual(["7"]);
    });

    it("P4: avisa cuando el estudiante se queda sin ninguna subnota calificada", () => {
        expect(quedaraSinSubnotas({ 7: "4", 8: "" }, { 7: "", 8: "" })).toBe(true);
        expect(quedaraSinSubnotas({ 7: "4" }, { 7: "3" })).toBe(false);
        expect(quedaraSinSubnotas({ 7: "" }, { 7: "" })).toBe(false);
    });

    it("valida el nombre de una subnota como el backend", () => {
        expect(validarNombreSubnota("   ", COGNITIVO)).toBe(MENSAJE_NOMBRE_VACIO);
        expect(validarNombreSubnota("x".repeat(61), COGNITIVO)).toBe(MENSAJE_NOMBRE_LARGO);
        expect(validarNombreSubnota(" quiz ", COGNITIVO)).toBe(MENSAJE_NOMBRE_REPETIDO);
        expect(validarNombreSubnota("Taller 2", COGNITIVO)).toBeNull();
        // Al renombrar, el propio nombre no cuenta como repetido.
        expect(validarNombreSubnota("QUIZ", COGNITIVO, { excluirId: 8 })).toBeNull();
    });

    it("P11: reconoce el límite de 20 subnotas", () => {
        const veinte = Array.from({ length: 20 }, (_, indice) => ({ id: indice, nombre: `S${indice}` }));

        expect(alcanzoElLimite(veinte)).toBe(true);
        expect(alcanzoElLimite(veinte.slice(1))).toBe(false);
        expect(MENSAJE_LIMITE_SUBNOTAS).toContain("20");
    });
});

describe("cuerpos para el servidor", () => {
    it("arma los cuerpos de crear y renombrar con el nombre recortado", () => {
        expect(construirPayloadSubnota({
            asignacionId: "88", periodo: "3", tipoNota: "Cognitivo", nombre: "  Taller 1 ",
        })).toEqual({ asignacion_id: 88, periodo: 3, tipo_nota: "Cognitivo", nombre: "Taller 1" });
        expect(construirPayloadRenombrarSubnota({ asignacionId: "88", nombre: " Quiz 2 " }))
            .toEqual({ asignacion_id: 88, nombre: "Quiz 2" });
    });

    it("manda solo las calificaciones cambiadas, con dos decimales y null las vacías", () => {
        const payload = construirPayloadCalificaciones({
            asignacionId: "88",
            periodo: "3",
            tipoNota: "Cognitivo",
            estudianteId: 501,
            tipoEvaluacion: "numerica",
            borrador: { 7: "4", 8: "4.155", 9: "" },
            cambiadas: ["8", "9"],
        });

        expect(payload).toEqual({
            asignacion_id: 88,
            periodo: 3,
            tipo_nota: "Cognitivo",
            estudiante_id: 501,
            tipo_evaluacion: "numerica",
            valores: { 8: 4.16, 9: null },
        });
    });

    it("en preescolar manda el código de la carita", () => {
        const payload = construirPayloadCalificaciones({
            asignacionId: 88,
            periodo: 1,
            tipoNota: "Juego",
            estudianteId: 501,
            tipoEvaluacion: "desarrollo",
            borrador: { 7: "logrado", 8: "" },
            cambiadas: ["7", "8"],
        });

        expect(payload.tipo_evaluacion).toBe("desarrollo");
        expect(payload.valores).toEqual({ 7: "logrado", 8: null });
    });
});

describe("actualizar la planilla con lo que respondió el servidor", () => {
    it("aplica la celda y las subnotas guardadas, y recalcula el promedio", () => {
        const respuesta = {
            estudiante_id: 501,
            tipo_nota: "Cognitivo",
            tipo_evaluacion: "numerica",
            nota: 4,
            valoracion: null,
            subnotas: { 7: 4, 9: 4 },
        };

        const actualizada = aplicarCalificacionesGuardadas(
            ANA, "Cognitivo", COGNITIVO, respuesta, ["Cognitivo", "Actitudinal"],
        );

        // La 8 ya no está; la 12, de otro tipo, se conserva.
        expect(actualizada.subnotas).toEqual({ 7: 4, 9: 4, 12: 5 });
        expect(actualizada.notas).toEqual({ Cognitivo: 4, Actitudinal: 5 });
        expect(actualizada.promedio).toBe("4.50");
        expect(ANA.notas.Cognitivo).toBe(3.8); // sin mutar el original
    });

    it("P4: la celda vacía queda en null, como la devuelve la planilla", () => {
        const actualizada = aplicarCalificacionesGuardadas(
            ANA, "Cognitivo", COGNITIVO,
            { tipo_evaluacion: "numerica", nota: null, valoracion: null, subnotas: {} },
            ["Cognitivo", "Actitudinal"],
        );

        expect(actualizada.notas.Cognitivo).toBeNull();
        expect(actualizada.promedio).toBe("5.00");
    });

    it("al borrar una subnota la quita a todos y aplica las celdas recalculadas", () => {
        const luis = {
            estudiante_id: 502,
            notas: { Cognitivo: 5 },
            valoraciones: {},
            subnotas: { 7: 5 },
        };
        const eva = { estudiante_id: 503, notas: { Cognitivo: 2 }, valoraciones: {}, subnotas: { 8: 2 } };
        const celdas = {
            501: { nota: 3.7, valoracion: null },
            502: { nota: null, valoracion: null },
        };

        const [ana, luisActualizado, evaActualizada] = aplicarSubnotaBorrada(
            [ANA, luis, eva], "Cognitivo", 7, celdas, ["Cognitivo"],
        );

        expect(ana.subnotas).toEqual({ 8: 3, 9: 4.4, 12: 5 });
        expect(ana.notas.Cognitivo).toBe(3.7);
        expect(luisActualizado.subnotas).toEqual({});
        expect(luisActualizado.notas.Cognitivo).toBeNull();
        expect(luisActualizado.promedio).toBe("");
        // Eva no tenía la 7: queda igual, el mismo objeto.
        expect(evaActualizada).toBe(eva);
    });

    it("agrega, renombra y quita subnotas de un tipo", () => {
        const conUna = agregarSubnota({}, "Cognitivo", { id: 7, nombre: "Taller 1", tipo_nota: "Cognitivo" });
        expect(conUna).toEqual({ Cognitivo: [{ id: 7, nombre: "Taller 1" }] });

        const renombrada = renombrarSubnota(conUna, "Cognitivo", "7", "Taller A");
        expect(renombrada.Cognitivo[0].nombre).toBe("Taller A");

        expect(quitarSubnota(renombrada, "Cognitivo", 7)).toEqual({});
        expect(quitarSubnota({ Cognitivo: COGNITIVO }, "Cognitivo", 8).Cognitivo.map((s) => s.id))
            .toEqual([7, 9]);
    });

    it("reconoce el 409 de una celda calculada por el mensaje exacto del backend", () => {
        // Espejo de NOTA_CALCULADA en app/controllers/planilla_controller.py.
        expect(MENSAJE_NOTA_CALCULADA)
            .toBe("Esta nota se calcula con sus subnotas. Cámbiala desde las subnotas.");
        const calculada = { response: { status: 409, data: { detail: MENSAJE_NOTA_CALCULADA } } };
        const anioCerrado = { response: { status: 409, data: { detail: "El año 2026 está cerrado." } } };

        expect(esErrorDeNotaCalculada(calculada)).toBe(true);
        expect(esErrorDeNotaCalculada(anioCerrado)).toBe(false);
        expect(esErrorDeNotaCalculada({ response: { status: 422, data: { detail: MENSAJE_NOTA_CALCULADA } } }))
            .toBe(false);
        expect(esErrorDeNotaCalculada(new Error("red"))).toBe(false);
    });

    it("usa el mensaje del servidor si lo trae", () => {
        const error = { response: { data: { detail: "Esa subnota ya no existe." } } };

        expect(mensajeDelServidor(error, "Respaldo")).toBe("Esa subnota ya no existe.");
        expect(mensajeDelServidor({ response: { data: { detail: [{ msg: "x" }] } } }, "Respaldo"))
            .toBe("Respaldo");
        expect(mensajeDelServidor(new Error("red"), "Respaldo")).toBe("Respaldo");
    });
});
