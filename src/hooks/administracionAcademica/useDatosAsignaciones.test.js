import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
    listarAsignacionesMock,
    listarCursosMock,
    listarMateriasMock,
    listarProfesoresMock,
} = vi.hoisted(() => ({
    listarAsignacionesMock: vi.fn(),
    listarCursosMock: vi.fn(),
    listarMateriasMock: vi.fn(),
    listarProfesoresMock: vi.fn(),
}));

vi.mock("../../services/asignacionesApi", () => ({
    listarAsignaciones: listarAsignacionesMock,
    listarCursosAsignacion: listarCursosMock,
    listarMateriasAsignacion: listarMateriasMock,
    listarProfesoresAsignacion: listarProfesoresMock,
}));

import useDatosAsignaciones from "./useDatosAsignaciones";

function diferido() {
    let resolve;
    const promise = new Promise((resolver) => {
        resolve = resolver;
    });
    return { promise, resolve };
}

beforeEach(() => {
    vi.clearAllMocks();
    listarProfesoresMock.mockResolvedValue([{ id: 11 }]);
    listarCursosMock.mockResolvedValue([{ id: 21 }]);
    listarMateriasMock.mockResolvedValue([{ id: 31 }]);
    listarAsignacionesMock.mockResolvedValue([{ id: 41 }]);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useDatosAsignaciones", () => {
    it("carga concurrentemente catálogos y asignaciones con una señal común", async () => {
        const { result } = renderHook(() => useDatosAsignaciones());

        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(result.current.profesores).toEqual([{ id: 11 }]);
        expect(result.current.cursos).toEqual([{ id: 21 }]);
        expect(result.current.materias).toEqual([{ id: 31 }]);
        expect(result.current.listaAsignaciones).toEqual([{ id: 41 }]);

        const signal = listarProfesoresMock.mock.calls[0][0].signal;
        expect(signal).toBeInstanceOf(AbortSignal);
        expect(listarCursosMock).toHaveBeenCalledWith({ signal });
        expect(listarMateriasMock).toHaveBeenCalledWith({ signal });
        expect(listarAsignacionesMock).toHaveBeenCalledWith({ signal });
    });

    it("expone una recarga sin mostrar el estado de carga principal", async () => {
        const { result } = renderHook(() => useDatosAsignaciones());
        await waitFor(() => expect(result.current.cargando).toBe(false));

        listarAsignacionesMock.mockResolvedValue([{ id: 42 }]);
        await act(async () => {
            await result.current.recargar({ mostrarCarga: false });
        });

        expect(result.current.cargando).toBe(false);
        expect(result.current.listaAsignaciones).toEqual([{ id: 42 }]);
        expect(listarAsignacionesMock).toHaveBeenCalledTimes(2);
    });

    it("finaliza la carga y conserva el manejo de error actual", async () => {
        const error = new Error("Sin conexión");
        listarAsignacionesMock.mockRejectedValue(error);
        const { result } = renderHook(() => useDatosAsignaciones());

        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(console.error).toHaveBeenCalledWith("Error cargando datos de asignación", error);
        expect(result.current.profesores).toEqual([]);
        expect(result.current.cursos).toEqual([]);
        expect(result.current.materias).toEqual([]);
        expect(result.current.listaAsignaciones).toEqual([]);
    });

    it("cancela la carga anterior y descarta su respuesta tardía", async () => {
        const primeraCarga = diferido();
        listarProfesoresMock
            .mockImplementationOnce(() => primeraCarga.promise)
            .mockResolvedValueOnce([{ id: 12 }]);
        const { result } = renderHook(() => useDatosAsignaciones());
        const primeraSignal = listarProfesoresMock.mock.calls[0][0].signal;

        await act(async () => {
            await result.current.recargar({ mostrarCarga: false });
        });

        expect(primeraSignal.aborted).toBe(true);
        expect(result.current.profesores).toEqual([{ id: 12 }]);

        await act(async () => {
            primeraCarga.resolve([{ id: 11 }]);
            await primeraCarga.promise;
        });

        expect(result.current.profesores).toEqual([{ id: 12 }]);
    });
});

describe("useDatosAsignaciones con un año elegido", () => {
    it("pide los cursos y las clases de ese año; profesores y materias no tienen año", async () => {
        const parametrosAnio = { anio_lectivo_id: 2 };
        const { result } = renderHook(() => useDatosAsignaciones({ parametrosAnio }));

        await waitFor(() => expect(result.current.cargando).toBe(false));
        const conAnio = { signal: expect.any(AbortSignal), parametrosAnio };
        const sinAnio = { signal: expect.any(AbortSignal) };
        expect(listarCursosMock).toHaveBeenCalledWith(conAnio);
        expect(listarAsignacionesMock).toHaveBeenCalledWith(conAnio);
        expect(listarProfesoresMock).toHaveBeenCalledWith(sinAnio);
        expect(listarMateriasMock).toHaveBeenCalledWith(sinAnio);
    });
});
