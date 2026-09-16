import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarCursosMock, listarProfesoresMock } = vi.hoisted(() => ({
    listarCursosMock: vi.fn(),
    listarProfesoresMock: vi.fn(),
}));

vi.mock("../../services/cursosApi", () => ({
    listarCursos: listarCursosMock,
}));

vi.mock("../../services/profesoresApi", () => ({
    listarProfesores: listarProfesoresMock,
}));

import useCursos from "./useCursos";

function diferido() {
    let resolve;
    const promise = new Promise((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

beforeEach(() => {
    vi.clearAllMocks();
    listarCursosMock.mockResolvedValue([{ id: 21, estado: "activo" }]);
    listarProfesoresMock.mockResolvedValue([{ id: 7, nombre: "Ana", apellido: "Gómez" }]);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useCursos", () => {
    it("carga inicialmente cursos activos con una señal cancelable", async () => {
        const { result } = renderHook(() => useCursos());

        await waitFor(() => expect(result.current.cursos).toEqual([
            { id: 21, estado: "activo" },
        ]));

        expect(result.current.estadoFiltro).toBe("activo");
        expect(listarCursosMock).toHaveBeenCalledWith("activo", {
            signal: expect.any(AbortSignal),
        });
    });

    it("carga los profesores activos para el selector de director de grupo", async () => {
        const { result } = renderHook(() => useCursos());

        await waitFor(() => expect(result.current.profesores).toEqual([
            { id: 7, nombre: "Ana", apellido: "Gómez" },
        ]));
        expect(listarProfesoresMock).toHaveBeenCalledWith("activo", {
            signal: expect.any(AbortSignal),
        });
    });

    it("cambia el filtro, cancela la carga anterior y descarta su respuesta tardía", async () => {
        const primeraCarga = diferido();
        listarCursosMock
            .mockImplementationOnce(() => primeraCarga.promise)
            .mockResolvedValueOnce([{ id: 22, estado: "inactivo" }]);
        const { result } = renderHook(() => useCursos());
        const primeraSignal = listarCursosMock.mock.calls[0][1].signal;

        act(() => {
            result.current.setEstadoFiltro("inactivo");
        });

        await waitFor(() => expect(result.current.cursos).toEqual([
            { id: 22, estado: "inactivo" },
        ]));
        expect(primeraSignal.aborted).toBe(true);
        expect(listarCursosMock).toHaveBeenLastCalledWith("inactivo", {
            signal: expect.any(AbortSignal),
        });

        await act(async () => {
            primeraCarga.resolve([{ id: 21, estado: "activo" }]);
            await primeraCarga.promise;
        });

        expect(result.current.cursos).toEqual([{ id: 22, estado: "inactivo" }]);
    });

    it("expone una recarga para sincronizar el filtro vigente", async () => {
        const { result } = renderHook(() => useCursos());
        await waitFor(() => expect(result.current.cursos).toHaveLength(1));
        listarCursosMock.mockResolvedValue([{ id: 23, estado: "activo" }]);

        await act(async () => {
            await result.current.recargar();
        });

        expect(result.current.cursos).toEqual([{ id: 23, estado: "activo" }]);
        expect(listarCursosMock).toHaveBeenCalledTimes(2);
        expect(listarCursosMock).toHaveBeenLastCalledWith("activo", {
            signal: expect.any(AbortSignal),
        });
    });

    it("conserva el manejo de error y cancela la solicitud al desmontar", async () => {
        const error = new Error("Sin conexión");
        listarCursosMock.mockRejectedValueOnce(error);
        const { result, unmount } = renderHook(() => useCursos());

        await waitFor(() => expect(console.error).toHaveBeenCalledWith(error));
        expect(result.current.cursos).toEqual([]);

        listarCursosMock.mockImplementationOnce(() => new Promise(() => {}));
        act(() => {
            void result.current.recargar();
        });
        const signal = listarCursosMock.mock.calls[1][1].signal;

        unmount();

        expect(signal.aborted).toBe(true);
    });
});
