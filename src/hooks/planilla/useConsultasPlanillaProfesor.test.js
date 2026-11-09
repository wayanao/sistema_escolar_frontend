import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerPlanillaMock } = vi.hoisted(() => ({
    obtenerPlanillaMock: vi.fn(),
}));

vi.mock("../../services/planillaApi", () => ({
    obtenerPlanillaNotas: obtenerPlanillaMock,
}));

import useConsultasPlanillaProfesor from "./useConsultasPlanillaProfesor";

const parametrosBase = {
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
    it("carga la planilla, filtra la columna interna y calcula el promedio", async () => {
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
        // La lista de clases la carga el selector de la pantalla, no este hook.
        expect(result.current).not.toHaveProperty("clases");
        // Subnotas, paso A3: la planilla se pide con sus subnotas. Porcentajes,
        // paso B4a: y con sus porcentajes por tipo de nota.
        expect(obtenerPlanillaMock).toHaveBeenCalledWith("88", "3", {
            signal: expect.any(AbortSignal),
            conSubnotas: true,
            conPorcentajes: true,
        });
        expect(result.current.subnotasPorTipo).toEqual({});
        expect(result.current.porcentajesPorTipo).toEqual({});
        expect(result.current.porcentajesActivos).toBe(false);
    });

    it("con porcentajes incompletos guarda los porcentajes y deja el promedio simple", async () => {
        obtenerPlanillaMock.mockResolvedValue({
            columnas: ["Cognitivo", "Procedimental", "mas_alto"],
            porcentajes: { Cognitivo: 60, mas_alto: 10 },
            porcentajes_activos: false,
            data: [{ estudiante_id: 501, notas: { Cognitivo: 4, Procedimental: 3 } }],
        });

        const { result } = renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            onClaseNoDisponible: vi.fn(),
        }));

        await waitFor(() => expect(result.current.porcentajesPorTipo).toEqual({ Cognitivo: 60 }));
        expect(result.current.porcentajesActivos).toBe(false);
        expect(result.current.sumaPorcentajes).toBe(60);
        expect(result.current.estudiantes[0].promedio).toBe("3.50");
    });

    it("con porcentajes activos el promedio de cada estudiante es el ponderado", async () => {
        obtenerPlanillaMock.mockResolvedValue({
            columnas: ["Cognitivo", "Procedimental", "Actitudinal"],
            porcentajes: { Cognitivo: 50, Procedimental: 30, Actitudinal: 20 },
            porcentajes_activos: true,
            data: [{ estudiante_id: 501, notas: { Cognitivo: 4, Procedimental: 3, Actitudinal: 5 } }],
        });

        const { result } = renderHook(() => useConsultasPlanillaProfesor({
            ...parametrosBase,
            onClaseNoDisponible: vi.fn(),
        }));

        // Simple seria 4.00; ponderado, 3.90.
        await waitFor(() => expect(result.current.estudiantes[0].promedio).toBe("3.90"));
        expect(result.current.porcentajesActivos).toBe(true);

        // Si se quita un porcentaje, vuelve el promedio simple sin recargar.
        act(() => {
            result.current.setPorcentajesPorTipo({ Cognitivo: 50, Procedimental: 30 });
        });
        expect(result.current.porcentajesActivos).toBe(false);
        expect(result.current.estudiantes[0].promedio).toBe("4.00");
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
