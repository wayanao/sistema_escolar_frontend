import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarProfesoresMock } = vi.hoisted(() => ({
    listarProfesoresMock: vi.fn(),
}));

vi.mock("../../services/profesoresApi", () => ({
    listarProfesores: listarProfesoresMock,
}));

import useProfesores from "./useProfesores";

function diferido() {
    let resolve;
    const promise = new Promise((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

beforeEach(() => {
    vi.clearAllMocks();
    listarProfesoresMock.mockResolvedValue([{ id: 11, estado: "activo" }]);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useProfesores", () => {
    it("carga inicialmente profesores activos con una señal cancelable", async () => {
        const { result } = renderHook(() => useProfesores());

        await waitFor(() => expect(result.current.profesores).toEqual([
            { id: 11, estado: "activo" },
        ]));

        expect(result.current.estadoFiltro).toBe("activo");
        expect(listarProfesoresMock).toHaveBeenCalledWith("activo", {
            signal: expect.any(AbortSignal),
        });
    });

    it("cambia el filtro, cancela la carga anterior y descarta su respuesta tardía", async () => {
        const primeraCarga = diferido();
        listarProfesoresMock
            .mockImplementationOnce(() => primeraCarga.promise)
            .mockResolvedValueOnce([{ id: 12, estado: "inactivo" }]);
        const { result } = renderHook(() => useProfesores());
        const primeraSignal = listarProfesoresMock.mock.calls[0][1].signal;

        act(() => {
            result.current.setEstadoFiltro("inactivo");
        });

        await waitFor(() => expect(result.current.profesores).toEqual([
            { id: 12, estado: "inactivo" },
        ]));
        expect(primeraSignal.aborted).toBe(true);
        expect(listarProfesoresMock).toHaveBeenLastCalledWith("inactivo", {
            signal: expect.any(AbortSignal),
        });

        await act(async () => {
            primeraCarga.resolve([{ id: 11, estado: "activo" }]);
            await primeraCarga.promise;
        });

        expect(result.current.profesores).toEqual([{ id: 12, estado: "inactivo" }]);
    });

    it("expone una recarga para sincronizar el filtro vigente", async () => {
        const { result } = renderHook(() => useProfesores());
        await waitFor(() => expect(result.current.profesores).toHaveLength(1));
        listarProfesoresMock.mockResolvedValue([{ id: 13, estado: "activo" }]);

        await act(async () => {
            await result.current.recargar();
        });

        expect(result.current.profesores).toEqual([{ id: 13, estado: "activo" }]);
        expect(listarProfesoresMock).toHaveBeenCalledTimes(2);
        expect(listarProfesoresMock).toHaveBeenLastCalledWith("activo", {
            signal: expect.any(AbortSignal),
        });
    });

    it("conserva el manejo de error y cancela la solicitud al desmontar", async () => {
        const error = new Error("Sin conexión");
        listarProfesoresMock.mockRejectedValueOnce(error);
        const { result, unmount } = renderHook(() => useProfesores());

        await waitFor(() => expect(console.error).toHaveBeenCalledWith(error));
        expect(result.current.profesores).toEqual([]);

        listarProfesoresMock.mockImplementationOnce(() => new Promise(() => {}));
        act(() => {
            void result.current.recargar();
        });
        const signal = listarProfesoresMock.mock.calls[1][1].signal;

        unmount();

        expect(signal.aborted).toBe(true);
    });
});
