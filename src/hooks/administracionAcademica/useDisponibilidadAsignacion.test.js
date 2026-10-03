import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerDisponibilidadMock } = vi.hoisted(() => ({
    obtenerDisponibilidadMock: vi.fn(),
}));

vi.mock("../../services/asignacionesApi", () => ({
    obtenerDisponibilidadProfesor: obtenerDisponibilidadMock,
}));

import useDisponibilidadAsignacion from "./useDisponibilidadAsignacion";

function diferido() {
    let resolve;
    const promise = new Promise((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

beforeEach(() => {
    vi.clearAllMocks();
    obtenerDisponibilidadMock.mockResolvedValue({ jornadas: [] });
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useDisponibilidadAsignacion", () => {
    it("no consulta y limpia el estado mientras falte profesor o día", () => {
        const { result } = renderHook(() => useDisponibilidadAsignacion({
            profesorId: "",
            dia: "",
            editandoId: null,
        }));

        expect(obtenerDisponibilidadMock).not.toHaveBeenCalled();
        expect(result.current.disponibilidad).toBeNull();
        expect(result.current.cargandoDisponibilidad).toBe(false);
    });

    it("consulta con los parámetros de edición y expone la disponibilidad", async () => {
        const disponibilidad = { jornadas: [{ jornada: "Mañana", rangos: [] }] };
        obtenerDisponibilidadMock.mockResolvedValue(disponibilidad);
        const { result } = renderHook(() => useDisponibilidadAsignacion({
            profesorId: "11",
            dia: "Lunes",
            editandoId: 41,
        }));

        await waitFor(() => expect(result.current.cargandoDisponibilidad).toBe(false));

        expect(result.current.disponibilidad).toBe(disponibilidad);
        expect(obtenerDisponibilidadMock).toHaveBeenCalledWith(
            "11",
            { dia: "Lunes", excluir_asignacion_id: 41 },
            { signal: expect.any(AbortSignal) },
        );
    });

    it("descarta la respuesta anterior cuando cambia el día", async () => {
        const primeraCarga = diferido();
        obtenerDisponibilidadMock
            .mockImplementationOnce(() => primeraCarga.promise)
            .mockResolvedValueOnce({ jornadas: [{ jornada: "Martes" }] });
        const { result, rerender } = renderHook(
            ({ dia }) => useDisponibilidadAsignacion({
                profesorId: "11",
                dia,
                editandoId: null,
            }),
            { initialProps: { dia: "Lunes" } },
        );
        const primeraSignal = obtenerDisponibilidadMock.mock.calls[0][2].signal;

        rerender({ dia: "Martes" });

        await waitFor(() => expect(result.current.disponibilidad).toEqual({
            jornadas: [{ jornada: "Martes" }],
        }));
        expect(primeraSignal.aborted).toBe(true);

        await act(async () => {
            primeraCarga.resolve({ jornadas: [{ jornada: "Lunes" }] });
            await primeraCarga.promise;
        });

        expect(result.current.disponibilidad).toEqual({
            jornadas: [{ jornada: "Martes" }],
        });
    });

    it("limpia la disponibilidad y conserva el manejo de error actual", async () => {
        const error = new Error("Sin disponibilidad");
        obtenerDisponibilidadMock.mockRejectedValue(error);
        const { result } = renderHook(() => useDisponibilidadAsignacion({
            profesorId: "11",
            dia: "Lunes",
            editandoId: null,
        }));

        await waitFor(() => expect(result.current.cargandoDisponibilidad).toBe(false));

        expect(console.error).toHaveBeenCalledWith(
            "Error cargando disponibilidad del profesor",
            error,
        );
        expect(result.current.disponibilidad).toBeNull();
    });
});

describe("useDisponibilidadAsignacion con un año elegido", () => {
    it("pide la disponibilidad del profesor en ese año", async () => {
        const parametrosAnio = { anio_lectivo_id: 2 };
        const { result } = renderHook(() => useDisponibilidadAsignacion({
            profesorId: "11",
            dia: "Lunes",
            editandoId: null,
            parametrosAnio,
        }));

        await waitFor(() => expect(result.current.disponibilidad).toEqual({ jornadas: [] }));
        expect(obtenerDisponibilidadMock).toHaveBeenCalledWith("11", { dia: "Lunes" }, {
            signal: expect.any(AbortSignal),
            parametrosAnio,
        });
    });
});
