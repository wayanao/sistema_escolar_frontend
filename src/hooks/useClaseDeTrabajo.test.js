import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { swalFireMock } = vi.hoisted(() => ({ swalFireMock: vi.fn() }));

vi.mock("sweetalert2", () => ({
    default: { fire: swalFireMock },
}));

import useClaseDeTrabajo, {
    MENSAJE_CLASE_NO_DISPONIBLE,
    MENSAJE_ERROR_CLASES_TRABAJO,
} from "./useClaseDeTrabajo";

const CLASES = [{ id: 10, materia: "Matemáticas", curso: "5A" }];

const parametros = (extra = {}) => ({
    profesorId: 7,
    listarClases: vi.fn().mockResolvedValue(CLASES),
    tituloCambiosPendientes: "Hay cambios",
    textoCambiosPendientes: "Se pierden.",
    ...extra,
});

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
    swalFireMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useClaseDeTrabajo", () => {
    it("carga las clases del profesor con el servicio que recibe", async () => {
        const opciones = parametros();
        const { result } = renderHook(() => useClaseDeTrabajo(opciones));

        expect(result.current.cargandoClases).toBe(true);
        await waitFor(() => expect(result.current.cargandoClases).toBe(false));

        expect(result.current.clases).toEqual(CLASES);
        expect(result.current.errorClases).toBe("");
        expect(opciones.listarClases).toHaveBeenCalledWith(7, { signal: expect.any(AbortSignal) });
    });

    it("arranca con la clase y el período guardados", () => {
        localStorage.setItem("asignacionId", "10");
        localStorage.setItem("periodo_profesor_7", "3");

        const { result } = renderHook(() => useClaseDeTrabajo(parametros()));

        expect(result.current.asignacionId).toBe("10");
        expect(result.current.periodo).toBe("3");
    });

    it("recuerda la clase y el período elegidos para las demás pantallas", async () => {
        const { result } = renderHook(() => useClaseDeTrabajo(parametros()));

        await act(async () => {
            await result.current.cambiarAsignacion("10");
            await result.current.cambiarPeriodo("4");
        });

        expect(result.current.asignacionId).toBe("10");
        expect(localStorage.getItem("asignacionId")).toBe("10");
        expect(result.current.periodo).toBe("4");
        expect(localStorage.getItem("periodo_profesor_7")).toBe("4");
        expect(swalFireMock).not.toHaveBeenCalled();
    });

    it("con cambios sin guardar pregunta antes y respeta «Seguir aquí»", async () => {
        localStorage.setItem("asignacionId", "10");
        const { result } = renderHook(() => useClaseDeTrabajo(parametros()));
        act(() => result.current.informarCambiosPendientes(true));

        swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
        let cambio;
        await act(async () => {
            cambio = await result.current.cambiarAsignacion("11");
        });

        expect(cambio).toBe(false);
        expect(result.current.asignacionId).toBe("10");
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
            title: "Hay cambios",
            text: "Se pierden.",
            confirmButtonText: "Cambiar sin guardar",
            cancelButtonText: "Seguir aquí",
            focusCancel: true,
        }));

        swalFireMock.mockResolvedValueOnce({ isConfirmed: true });
        await act(async () => {
            cambio = await result.current.cambiarPeriodo("2");
        });
        expect(cambio).toBe(true);
        expect(result.current.periodo).toBe("2");
    });

    it("olvida una clase que ya no es del profesor y dice por qué", async () => {
        localStorage.setItem("asignacionId", "10");
        const { result } = renderHook(() => useClaseDeTrabajo(parametros()));

        act(() => result.current.descartarAsignacion());

        expect(result.current.asignacionId).toBe("");
        expect(result.current.aviso).toBe(MENSAJE_CLASE_NO_DISPONIBLE);
        expect(localStorage.getItem("asignacionId")).toBeNull();

        await act(async () => {
            await result.current.cambiarAsignacion("10");
        });
        expect(result.current.aviso).toBe("");
    });

    it("informa el error de la lista y permite reintentar", async () => {
        const listarClases = vi.fn()
            .mockRejectedValueOnce(new Error("Sin conexión"))
            .mockResolvedValueOnce(CLASES);
        const { result } = renderHook(() => useClaseDeTrabajo(parametros({ listarClases })));

        await waitFor(() => expect(result.current.errorClases).toBe(MENSAJE_ERROR_CLASES_TRABAJO));
        expect(result.current.clases).toEqual([]);

        act(() => result.current.reintentarClases());

        await waitFor(() => expect(result.current.clases).toEqual(CLASES));
        expect(result.current.errorClases).toBe("");
        expect(listarClases).toHaveBeenCalledTimes(2);
    });

    it("sin profesor no consulta nada", () => {
        const opciones = parametros({ profesorId: undefined });
        const { result } = renderHook(() => useClaseDeTrabajo(opciones));

        expect(result.current.cargandoClases).toBe(false);
        expect(opciones.listarClases).not.toHaveBeenCalled();
    });
});
