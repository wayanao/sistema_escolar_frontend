import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarClasesMock, obtenerPlanillaMock } = vi.hoisted(() => ({
    listarClasesMock: vi.fn(),
    obtenerPlanillaMock: vi.fn(),
}));

vi.mock("../../services/planillaApi", () => ({
    listarClasesProfesorPlanilla: listarClasesMock,
    obtenerPlanillaNotas: obtenerPlanillaMock,
}));

import useConsultasPlanillaProfesor from "./useConsultasPlanillaProfesor";

const parametrosBase = {
    profesorId: 12,
    asignacionId: "88",
    periodo: "3",
};

function diferido() {
    let resolve;
    let reject;
    const promise = new Promise((resolver, rechazar) => {
        resolve = resolver;
        reject = rechazar;
    });
    return { promise, resolve, reject };
}

beforeEach(() => {
    vi.clearAllMocks();
    listarClasesMock.mockResolvedValue([{ id: 88, materia: "Ciencias Naturales" }]);
    obtenerPlanillaMock.mockResolvedValue({
        columnas: ["quiz", "mas_alto"],
        data: [{ estudiante_id: 501, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4 } }],
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useConsultasPlanillaProfesor", () => {
    it("carga clases y planilla, filtra la columna interna y calcula el promedio", async () => {
        const { result } = renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            onClaseNoDisponible: vi.fn(),
        }));

        await waitFor(() => expect(result.current.estudiantes).toEqual([
            {
                estudiante_id: 501,
                nombre: "Ana",
                apellido: "Ruiz",
                notas: { quiz: 4 },
                promedio: "4.00",
            },
        ]));

        expect(result.current.columnas).toEqual(["quiz"]);
        expect(result.current.clases).toEqual([{ id: 88, materia: "Ciencias Naturales" }]);
        // Subnotas, paso A3: la planilla se pide con sus subnotas.
        expect(obtenerPlanillaMock).toHaveBeenCalledWith("88", "3", {
            signal: expect.any(AbortSignal),
            conSubnotas: true,
        });
        expect(listarClasesMock).toHaveBeenCalledWith(12, {
            signal: expect.any(AbortSignal),
        });
        expect(result.current.subnotasPorTipo).toEqual({});
    });

    it("guarda las subnotas por tipo de las columnas visibles y las de cada estudiante", async () => {
        obtenerPlanillaMock.mockResolvedValue({
            columnas: ["Cognitivo", "mas_alto"],
            subnotas: {
                Cognitivo: [{ id: 7, nombre: "Taller 1" }, { id: 8, nombre: "Quiz" }],
                mas_alto: [{ id: 30, nombre: "Interna" }],
            },
            data: [{
                estudiante_id: 501,
                nombre: "Ana",
                apellido: "Ruiz",
                notas: { Cognitivo: 4 },
                subnotas: { 7: 4 },
            }],
        });

        const { result } = renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            onClaseNoDisponible: vi.fn(),
        }));

        await waitFor(() => expect(result.current.subnotasPorTipo).toEqual({
            Cognitivo: [{ id: 7, nombre: "Taller 1" }, { id: 8, nombre: "Quiz" }],
        }));
        expect(result.current.estudiantes[0].subnotas).toEqual({ 7: 4 });
    });

    it("no consulta clases sin profesorId, pero sí consulta la planilla", async () => {
        renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            profesorId: undefined,
            onClaseNoDisponible: vi.fn(),
        }));

        await waitFor(() => expect(obtenerPlanillaMock).toHaveBeenCalledTimes(1));
        expect(listarClasesMock).not.toHaveBeenCalled();
    });

    it("cancela una recarga de planilla en curso y descarta su respuesta obsoleta", async () => {
        const primeraCarga = diferido();
        obtenerPlanillaMock
            .mockResolvedValueOnce({ columnas: ["quiz"], data: [] })
            .mockImplementationOnce(() => primeraCarga.promise)
            .mockResolvedValueOnce({
                columnas: ["quiz"],
                data: [{ estudiante_id: 999, nombre: "Luis", apellido: "Pérez", notas: { quiz: 2 } }],
            });
        const { result } = renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            onClaseNoDisponible: vi.fn(),
        }));

        await waitFor(() => expect(obtenerPlanillaMock).toHaveBeenCalledTimes(1));

        let primeraRecarga;
        act(() => {
            primeraRecarga = result.current.cargarPlanilla();
        });
        await waitFor(() => expect(obtenerPlanillaMock).toHaveBeenCalledTimes(2));
        const signalDescartada = obtenerPlanillaMock.mock.calls[1][2].signal;

        await act(async () => {
            await result.current.cargarPlanilla();
        });

        expect(signalDescartada.aborted).toBe(true);
        expect(result.current.estudiantes).toEqual([
            { estudiante_id: 999, nombre: "Luis", apellido: "Pérez", notas: { quiz: 2 }, promedio: "2.00" },
        ]);

        await act(async () => {
            primeraCarga.resolve({ columnas: ["quiz"], data: [{ estudiante_id: 1, nombre: "Obsoleto" }] });
            await primeraRecarga;
        });

        expect(result.current.estudiantes).toEqual([
            { estudiante_id: 999, nombre: "Luis", apellido: "Pérez", notas: { quiz: 2 }, promedio: "2.00" },
        ]);
    });

    it("delega una clase no disponible (403) sin sobrescribir la planilla previa", async () => {
        obtenerPlanillaMock
            .mockResolvedValueOnce({ columnas: ["quiz"], data: [{ estudiante_id: 501, notas: { quiz: 4 } }] })
            .mockRejectedValueOnce({ response: { status: 403 } });
        const onClaseNoDisponible = vi.fn();
        const { result } = renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            onClaseNoDisponible,
        }));

        await waitFor(() => expect(result.current.estudiantes).toHaveLength(1));

        await act(async () => {
            await result.current.cargarPlanilla();
        });

        expect(onClaseNoDisponible).toHaveBeenCalledTimes(1);
        expect(result.current.estudiantes).toHaveLength(1);
    });

    it("expone setEstudiantes y setColumnas para las actualizaciones optimistas todavía en la página", async () => {
        const { result } = renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            onClaseNoDisponible: vi.fn(),
        }));

        await waitFor(() => expect(result.current.estudiantes).toHaveLength(1));

        act(() => {
            result.current.setColumnas(["quiz", "taller"]);
            result.current.setEstudiantes([{ estudiante_id: 501, notas: { quiz: 5 }, promedio: "5.00" }]);
        });

        expect(result.current.columnas).toEqual(["quiz", "taller"]);
        expect(result.current.estudiantes).toEqual([
            { estudiante_id: 501, notas: { quiz: 5 }, promedio: "5.00" },
        ]);
    });
});
