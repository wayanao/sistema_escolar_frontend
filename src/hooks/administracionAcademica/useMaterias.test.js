import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarMateriasMock } = vi.hoisted(() => ({
    listarMateriasMock: vi.fn(),
}));

vi.mock("../../services/materiasApi", () => ({
    listarMaterias: listarMateriasMock,
}));

import useMaterias from "./useMaterias";

function diferido() {
    let resolve;
    const promise = new Promise((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

beforeEach(() => {
    vi.clearAllMocks();
    listarMateriasMock.mockResolvedValue([{ id: 31, estado: "activo" }]);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useMaterias", () => {
    it("carga inicialmente materias activas con una señal cancelable", async () => {
        const { result } = renderHook(() => useMaterias());

        await waitFor(() => expect(result.current.materias).toEqual([
            { id: 31, estado: "activo" },
        ]));

        expect(result.current.estadoFiltro).toBe("activo");
        expect(listarMateriasMock).toHaveBeenCalledWith("activo", {
            signal: expect.any(AbortSignal),
        });
    });

    it("cambia el filtro, cancela la carga anterior y descarta su respuesta tardía", async () => {
        const primeraCarga = diferido();
        listarMateriasMock
            .mockImplementationOnce(() => primeraCarga.promise)
            .mockResolvedValueOnce([{ id: 32, estado: "inactivo" }]);
        const { result } = renderHook(() => useMaterias());
        const primeraSignal = listarMateriasMock.mock.calls[0][1].signal;

        act(() => {
            result.current.setEstadoFiltro("inactivo");
        });

        await waitFor(() => expect(result.current.materias).toEqual([
            { id: 32, estado: "inactivo" },
        ]));
        expect(primeraSignal.aborted).toBe(true);
        expect(listarMateriasMock).toHaveBeenLastCalledWith("inactivo", {
            signal: expect.any(AbortSignal),
        });

        await act(async () => {
            primeraCarga.resolve([{ id: 31, estado: "activo" }]);
            await primeraCarga.promise;
        });

        expect(result.current.materias).toEqual([{ id: 32, estado: "inactivo" }]);
    });

    it("expone una recarga para sincronizar el filtro vigente", async () => {
        const { result } = renderHook(() => useMaterias());
        await waitFor(() => expect(result.current.materias).toHaveLength(1));
        listarMateriasMock.mockResolvedValue([{ id: 33, estado: "activo" }]);

        await act(async () => {
            await result.current.recargar();
        });

        expect(result.current.materias).toEqual([{ id: 33, estado: "activo" }]);
        expect(listarMateriasMock).toHaveBeenCalledTimes(2);
        expect(listarMateriasMock).toHaveBeenLastCalledWith("activo", {
            signal: expect.any(AbortSignal),
        });
    });

    it("conserva el manejo de error y cancela la solicitud al desmontar", async () => {
        const error = new Error("Sin conexión");
        listarMateriasMock.mockRejectedValueOnce(error);
        const { result, unmount } = renderHook(() => useMaterias());

        await waitFor(() => expect(console.error).toHaveBeenCalledWith(error));
        expect(result.current.materias).toEqual([]);

        listarMateriasMock.mockImplementationOnce(() => new Promise(() => {}));
        act(() => {
            void result.current.recargar();
        });
        const signal = listarMateriasMock.mock.calls[1][1].signal;

        unmount();

        expect(signal.aborted).toBe(true);
    });
});
