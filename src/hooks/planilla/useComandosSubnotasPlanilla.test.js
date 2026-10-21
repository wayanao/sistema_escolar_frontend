import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
    crearSubnotaMock,
    renombrarSubnotaMock,
    eliminarSubnotaMock,
    guardarCalificacionesMock,
    swalFireMock,
} = vi.hoisted(() => ({
    crearSubnotaMock: vi.fn(),
    renombrarSubnotaMock: vi.fn(),
    eliminarSubnotaMock: vi.fn(),
    guardarCalificacionesMock: vi.fn(),
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/planillaApi", () => ({
    crearSubnotaPlanilla: crearSubnotaMock,
    renombrarSubnotaPlanilla: renombrarSubnotaMock,
    eliminarSubnotaPlanilla: eliminarSubnotaMock,
    guardarCalificacionesSubnotas: guardarCalificacionesMock,
}));

vi.mock("sweetalert2", () => ({
    default: { fire: swalFireMock },
}));

import useComandosSubnotasPlanilla from "./useComandosSubnotasPlanilla";

const COLUMNAS = ["Cognitivo", "Actitudinal"];
const SUBNOTAS = {
    Cognitivo: [
        { id: 7, nombre: "Taller 1" },
        { id: 8, nombre: "Quiz" },
        { id: 9, nombre: "Parcial" },
    ],
};
const ESTUDIANTES = [
    {
        estudiante_id: 501, nombre: "Ana", apellido: "Gómez",
        notas: { Cognitivo: 3.8, Actitudinal: 5 },
        valoraciones: {},
        subnotas: { 7: 4, 8: 3, 9: 4.4 },
        promedio: "4.40",
    },
    {
        estudiante_id: 502, nombre: "Luis", apellido: "Pérez",
        notas: { Cognitivo: 4, Actitudinal: 3 },
        valoraciones: {},
        subnotas: {},
        promedio: "3.50",
    },
    {
        estudiante_id: 503, nombre: "Eva", apellido: "Ríos",
        notas: {},
        valoraciones: {},
        subnotas: { 7: 5 },
        promedio: "",
    },
];

function renderizar({ tipoEvaluacion = "numerica", estudiantes = ESTUDIANTES, subnotas = SUBNOTAS } = {}) {
    return renderHook(() => {
        const [lista, setLista] = useState(estudiantes);
        const [porTipo, setPorTipo] = useState(subnotas);
        const comandos = useComandosSubnotasPlanilla({
            asignacionId: "88",
            periodo: "3",
            tipoEvaluacion,
            estudiantes: lista,
            columnas: COLUMNAS,
            subnotasPorTipo: porTipo,
            setEstudiantes: setLista,
            setSubnotasPorTipo: setPorTipo,
        });
        return { ...comandos, lista, porTipo };
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    swalFireMock.mockResolvedValue({ isConfirmed: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useComandosSubnotasPlanilla", () => {
    it("abre el modal con las subnotas del tipo y lo que tiene el estudiante", () => {
        const { result } = renderizar();

        act(() => result.current.abrir(502, "Cognitivo"));

        expect(result.current.abierta).toBe(true);
        expect(result.current.estudiante.nombre).toBe("Luis");
        expect(result.current.subnotas.map((s) => s.nombre)).toEqual(["Taller 1", "Quiz", "Parcial"]);
        expect(result.current.borrador).toEqual({ 7: "", 8: "", 9: "" });
        // P3: Luis tiene su 4 escrito a mano y ninguna subnota.
        expect(result.current.notaAMano).toBe(true);
        expect(result.current.hayCambios).toBe(false);
        expect(result.current.posicion).toBe(2);
        expect(result.current.hayAnterior).toBe(true);
        expect(result.current.haySiguiente).toBe(true);
    });

    it("la vista previa sigue lo escrito y no cuenta las vacías", () => {
        const { result } = renderizar();
        act(() => result.current.abrir(502, "Cognitivo"));

        act(() => result.current.cambiarCalificacion(7, "5"));
        act(() => result.current.cambiarCalificacion(9, "3,5"));

        expect(result.current.vistaPrevia).toEqual({ nota: 4.25 });
        expect(result.current.hayCambios).toBe(true);
    });

    it("guarda solo lo cambiado y aplica en la planilla la celda que devuelve el servidor", async () => {
        guardarCalificacionesMock.mockResolvedValue({
            estudiante_id: 501,
            tipo_nota: "Cognitivo",
            tipo_evaluacion: "numerica",
            nota: 3.75,
            valoracion: null,
            subnotas: { 7: 4, 8: 3.5 },
        });
        const { result } = renderizar();
        act(() => result.current.abrir(501, "Cognitivo"));
        act(() => result.current.cambiarCalificacion(8, "3.5"));
        act(() => result.current.cambiarCalificacion(9, ""));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardar();
        });

        expect(guardado).toBe(true);
        expect(guardarCalificacionesMock).toHaveBeenCalledWith({
            asignacion_id: 88,
            periodo: 3,
            tipo_nota: "Cognitivo",
            estudiante_id: 501,
            tipo_evaluacion: "numerica",
            valores: { 8: 3.5, 9: null },
        });
        const ana = result.current.lista[0];
        expect(ana.notas.Cognitivo).toBe(3.75);
        expect(ana.subnotas).toEqual({ 7: 4, 8: 3.5 });
        expect(ana.promedio).toBe("4.38");
        expect(result.current.borrador).toEqual({ 7: "4", 8: "3.5", 9: "" });
        expect(result.current.hayCambios).toBe(false);
    });

    it("sin cambios no gasta una petición", async () => {
        const { result } = renderizar();
        act(() => result.current.abrir(501, "Cognitivo"));
        act(() => result.current.cambiarCalificacion(7, "4.0"));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardar();
        });

        expect(guardado).toBe(true);
        expect(guardarCalificacionesMock).not.toHaveBeenCalled();
    });

    it("una nota mal escrita no se envía: avisa y lo escrito se queda", async () => {
        const { result } = renderizar();
        act(() => result.current.abrir(501, "Cognitivo"));
        act(() => result.current.cambiarCalificacion(8, "6"));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardar();
        });

        expect(guardado).toBe(false);
        expect(result.current.invalidas).toEqual(["8"]);
        expect(guardarCalificacionesMock).not.toHaveBeenCalled();
        expect(swalFireMock).toHaveBeenCalledWith({
            icon: "warning",
            title: "Nota inválida",
            text: "Cada subnota debe ser un número entre 1 y 5.",
        });
        expect(result.current.borrador[8]).toBe("6");
    });

    it("si el servidor lo rechaza, muestra su mensaje y no toca la planilla", async () => {
        guardarCalificacionesMock.mockRejectedValue({
            response: { status: 422, data: { detail: "Alguna de esas subnotas no es de este tipo de nota." } },
        });
        const { result } = renderizar();
        act(() => result.current.abrir(501, "Cognitivo"));
        act(() => result.current.cambiarCalificacion(8, "5"));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardar();
        });

        expect(guardado).toBe(false);
        expect(swalFireMock).toHaveBeenCalledWith({
            icon: "error",
            title: "No se guardó",
            text: "Alguna de esas subnotas no es de este tipo de nota.",
        });
        expect(result.current.lista).toEqual(ESTUDIANTES);
        expect(result.current.hayCambios).toBe(true);
        expect(result.current.accionEnCurso).toBe(null);
    });

    it("Siguiente guarda y pasa al estudiante de abajo; si falla, se queda", async () => {
        guardarCalificacionesMock.mockResolvedValueOnce({
            tipo_evaluacion: "numerica", nota: 5, valoracion: null, subnotas: { 7: 5 },
        });
        const { result } = renderizar();
        act(() => result.current.abrir(502, "Cognitivo"));
        act(() => result.current.cambiarCalificacion(7, "5"));

        await act(async () => {
            await result.current.irAlSiguiente();
        });

        expect(guardarCalificacionesMock).toHaveBeenCalledTimes(1);
        expect(result.current.lista[1].notas.Cognitivo).toBe(5);
        expect(result.current.estudiante.nombre).toBe("Eva");
        expect(result.current.borrador).toEqual({ 7: "5", 8: "", 9: "" });
        expect(result.current.haySiguiente).toBe(false);

        guardarCalificacionesMock.mockRejectedValueOnce(new Error("red"));
        act(() => result.current.cambiarCalificacion(8, "2"));
        await act(async () => {
            await result.current.irAlAnterior();
        });
        expect(result.current.estudiante.nombre).toBe("Eva");
        expect(result.current.borrador[8]).toBe("2");
    });

    it("Anterior sin cambios no guarda nada y mueve", async () => {
        const { result } = renderizar();
        act(() => result.current.abrir(502, "Cognitivo"));

        await act(async () => {
            await result.current.irAlAnterior();
        });

        expect(guardarCalificacionesMock).not.toHaveBeenCalled();
        expect(result.current.estudiante.nombre).toBe("Ana");
        expect(result.current.hayAnterior).toBe(false);
    });

    it("cerrar con cambios pregunta antes; si se arrepiente, sigue abierto", async () => {
        const { result } = renderizar();
        act(() => result.current.abrir(501, "Cognitivo"));
        act(() => result.current.cambiarCalificacion(8, "5"));

        swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
        await act(async () => {
            await result.current.cerrar();
        });
        expect(result.current.abierta).toBe(true);
        expect(swalFireMock.mock.calls[0][0].title).toBe("Cambios sin guardar");

        await act(async () => {
            await result.current.cerrar();
        });
        expect(result.current.abierta).toBe(false);
    });

    it("cerrar sin cambios no pregunta", async () => {
        const { result } = renderizar();
        act(() => result.current.abrir(501, "Cognitivo"));

        await act(async () => {
            await result.current.cerrar();
        });

        expect(swalFireMock).not.toHaveBeenCalled();
        expect(result.current.abierta).toBe(false);
    });

    it("P4: avisa cuando lo escrito deja al estudiante sin subnotas", () => {
        const { result } = renderizar();
        act(() => result.current.abrir(503, "Cognitivo"));
        expect(result.current.quedaraVacia).toBe(false);

        act(() => result.current.cambiarCalificacion(7, ""));
        expect(result.current.quedaraVacia).toBe(true);
    });

    it("en preescolar guarda caritas y la vista previa es una carita", async () => {
        guardarCalificacionesMock.mockResolvedValue({
            tipo_evaluacion: "desarrollo", nota: null, valoracion: "destacado",
            subnotas: { 7: "logrado", 8: "destacado" },
        });
        const { result } = renderizar({ tipoEvaluacion: "desarrollo" });
        act(() => result.current.abrir(502, "Cognitivo"));
        act(() => result.current.cambiarCalificacion(7, "logrado"));
        act(() => result.current.cambiarCalificacion(8, "destacado"));

        expect(result.current.vistaPrevia.valoracion.value).toBe("destacado");
        await act(async () => {
            await result.current.guardar();
        });

        expect(guardarCalificacionesMock.mock.calls[0][0].tipo_evaluacion).toBe("desarrollo");
        expect(guardarCalificacionesMock.mock.calls[0][0].valores).toEqual({ 7: "logrado", 8: "destacado" });
        expect(result.current.lista[1].valoraciones.Cognitivo).toBe("destacado");
    });

    describe("subnotas del tipo", () => {
        it("crea una subnota para todo el curso y la deja vacía en el modal", async () => {
            crearSubnotaMock.mockResolvedValue({ id: 10, tipo_nota: "Cognitivo", nombre: "Taller 2" });
            const { result } = renderizar();
            act(() => result.current.abrir(501, "Cognitivo"));

            let creada;
            await act(async () => {
                creada = await result.current.crearSubnota("  Taller 2 ");
            });

            expect(creada).toBe(true);
            expect(crearSubnotaMock).toHaveBeenCalledWith({
                asignacion_id: 88, periodo: 3, tipo_nota: "Cognitivo", nombre: "Taller 2",
            });
            expect(result.current.porTipo.Cognitivo.map((s) => s.nombre))
                .toEqual(["Taller 1", "Quiz", "Parcial", "Taller 2"]);
            expect(result.current.borrador[10]).toBe("");
            // Una casilla nueva y vacía no es un cambio por guardar.
            expect(result.current.hayCambios).toBe(false);
        });

        it("no crea un nombre repetido ni pasa del límite", async () => {
            const veinte = Array.from({ length: 20 }, (_, i) => ({ id: 100 + i, nombre: `S${i}` }));
            const { result } = renderizar();
            act(() => result.current.abrir(501, "Cognitivo"));

            await act(async () => {
                await result.current.crearSubnota("quiz");
            });
            expect(swalFireMock.mock.calls[0][0].text)
                .toBe("Ya existe una subnota con ese nombre en este tipo de nota.");

            const lleno = renderizar({ subnotas: { Cognitivo: veinte } });
            act(() => lleno.result.current.abrir(501, "Cognitivo"));
            expect(lleno.result.current.limiteAlcanzado).toBe(true);
            await act(async () => {
                await lleno.result.current.crearSubnota("Otra");
            });
            expect(swalFireMock.mock.calls[1][0].text).toBe("Un tipo de nota admite hasta 20 subnotas.");
            expect(crearSubnotaMock).not.toHaveBeenCalled();
        });

        it("renombra sin tocar ninguna nota, y no gasta petición si el nombre no cambia", async () => {
            renombrarSubnotaMock.mockResolvedValue({ id: 8, nombre: "Quiz final" });
            const { result } = renderizar();
            act(() => result.current.abrir(501, "Cognitivo"));

            await act(async () => {
                await result.current.cambiarNombreSubnota(8, "Quiz");
            });
            expect(renombrarSubnotaMock).not.toHaveBeenCalled();

            await act(async () => {
                await result.current.cambiarNombreSubnota(8, " Quiz final ");
            });
            expect(renombrarSubnotaMock).toHaveBeenCalledWith(8, { asignacion_id: 88, nombre: "Quiz final" });
            expect(result.current.porTipo.Cognitivo[1].nombre).toBe("Quiz final");
            expect(result.current.lista).toEqual(ESTUDIANTES);
        });

        it("borra una subnota tras confirmar cuántas calificaciones se pierden", async () => {
            eliminarSubnotaMock.mockResolvedValue({
                mensaje: "Subnota eliminada correctamente",
                calificaciones_borradas: 2,
                celdas: {
                    501: { nota: 3.7, valoracion: null },
                    503: { nota: null, valoracion: null },
                },
            });
            const { result } = renderizar();
            act(() => result.current.abrir(501, "Cognitivo"));

            await act(async () => {
                await result.current.borrarSubnota(7);
            });

            expect(swalFireMock.mock.calls[0][0]).toMatchObject({
                title: "¿Borrar \"Taller 1\"?",
                text: "Se borrarán 2 calificaciones del curso en esta subnota, y la nota de esos estudiantes se recalculará.",
            });
            expect(eliminarSubnotaMock).toHaveBeenCalledWith({ subnotaId: 7, asignacionId: "88" });
            expect(result.current.porTipo.Cognitivo.map((s) => s.id)).toEqual([8, 9]);
            expect(result.current.borrador).toEqual({ 8: "3", 9: "4.4" });
            expect(result.current.lista[0].notas.Cognitivo).toBe(3.7);
            expect(result.current.lista[2].notas.Cognitivo).toBeNull();
            expect(result.current.lista[2].subnotas).toEqual({});
        });

        it("si no confirma el borrado, no pasa nada", async () => {
            swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
            const { result } = renderizar();
            act(() => result.current.abrir(502, "Cognitivo"));

            await act(async () => {
                await result.current.borrarSubnota(8);
            });

            expect(swalFireMock.mock.calls[0][0].text)
                .toBe("Se borrará 1 calificación del curso en esta subnota, y la nota de esos estudiantes se recalculará.");
            expect(eliminarSubnotaMock).not.toHaveBeenCalled();
            expect(result.current.porTipo).toEqual(SUBNOTAS);
        });
    });
});
