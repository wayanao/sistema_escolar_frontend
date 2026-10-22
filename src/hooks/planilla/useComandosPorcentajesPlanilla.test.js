import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { guardarPorcentajeTipoMock, swalFireMock } = vi.hoisted(() => ({
    guardarPorcentajeTipoMock: vi.fn(),
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/planillaApi", () => ({
    guardarPorcentajeTipo: guardarPorcentajeTipoMock,
}));

vi.mock("sweetalert2", () => ({
    default: { fire: swalFireMock },
}));

import useComandosPorcentajesPlanilla from "./useComandosPorcentajesPlanilla";

const COLUMNAS = ["Cognitivo", "Procedimental", "Actitudinal"];

function crearParametros(overrides = {}) {
    return {
        asignacionId: "88",
        periodo: "3",
        columnas: COLUMNAS,
        porcentajesPorTipo: { Cognitivo: 50, Procedimental: 30 },
        setPorcentajesPorTipo: vi.fn(),
        ...overrides,
    };
}

const aplicar = (setter, previo) => setter.mock.calls[0][0](previo);

beforeEach(() => {
    vi.clearAllMocks();
    swalFireMock.mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useComandosPorcentajesPlanilla (parte B, paso B4a)", () => {
    it("guarda el porcentaje de un tipo y aplica lo que responde el servidor", async () => {
        guardarPorcentajeTipoMock.mockResolvedValue({
            tipo_nota: "Actitudinal", porcentaje: 20, suma: 100, activos: true,
        });
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPorcentajesPlanilla(params));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardarPorcentaje("Actitudinal", "20");
        });

        expect(guardado).toBe(true);
        expect(guardarPorcentajeTipoMock).toHaveBeenCalledWith({
            asignacion_id: 88, periodo: 3, tipo_nota: "Actitudinal", porcentaje: 20,
        });
        expect(aplicar(params.setPorcentajesPorTipo, params.porcentajesPorTipo)).toEqual({
            Cognitivo: 50, Procedimental: 30, Actitudinal: 20,
        });
        expect(result.current.tipoGuardando).toBeNull();
    });

    it("vaciar el porcentaje lo quita con null", async () => {
        guardarPorcentajeTipoMock.mockResolvedValue({
            tipo_nota: "Procedimental", porcentaje: null, suma: 50, activos: false,
        });
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPorcentajesPlanilla(params));

        await act(async () => {
            await result.current.guardarPorcentaje("Procedimental", "  ");
        });

        expect(guardarPorcentajeTipoMock.mock.calls[0][0].porcentaje).toBeNull();
        expect(aplicar(params.setPorcentajesPorTipo, params.porcentajesPorTipo)).toEqual({ Cognitivo: 50 });
    });

    it("sin cambios no gasta una petición", async () => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPorcentajesPlanilla(params));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardarPorcentaje("Cognitivo", "50");
            await result.current.guardarPorcentaje("Actitudinal", "");
        });

        expect(guardado).toBe(true);
        expect(guardarPorcentajeTipoMock).not.toHaveBeenCalled();
    });

    it.each([
        ["0", "El porcentaje debe ser un número entero de 1 a 100."],
        ["33.5", "El porcentaje debe ser un número entero de 1 a 100."],
        ["21", "Los porcentajes de esta planilla no pueden sumar más de 100 %."],
    ])("con %s avisa y no envía nada", async (texto, mensaje) => {
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPorcentajesPlanilla(params));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardarPorcentaje("Actitudinal", texto);
        });

        expect(guardado).toBe(false);
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({ text: mensaje }));
        expect(guardarPorcentajeTipoMock).not.toHaveBeenCalled();
    });

    it("si el servidor rechaza, muestra su mensaje y no cambia nada", async () => {
        guardarPorcentajeTipoMock.mockRejectedValue(Object.assign(new Error("404"), {
            response: { status: 404, data: { detail: "Ese tipo de nota no existe en esta planilla." } },
        }));
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPorcentajesPlanilla(params));

        let guardado;
        await act(async () => {
            guardado = await result.current.guardarPorcentaje("Actitudinal", "20");
        });

        expect(guardado).toBe(false);
        expect(params.setPorcentajesPorTipo).not.toHaveBeenCalled();
        expect(swalFireMock).toHaveBeenCalledWith(expect.objectContaining({
            icon: "error",
            text: "Ese tipo de nota no existe en esta planilla.",
        }));
        expect(result.current.tipoGuardando).toBeNull();
    });

    it("no lanza un segundo guardado mientras el primero sigue en curso", async () => {
        let terminar;
        guardarPorcentajeTipoMock.mockImplementation(
            () => new Promise((resolver) => { terminar = resolver; }),
        );
        const params = crearParametros();
        const { result } = renderHook(() => useComandosPorcentajesPlanilla(params));

        let primero;
        act(() => {
            primero = result.current.guardarPorcentaje("Actitudinal", "20");
        });
        expect(result.current.tipoGuardando).toBe("Actitudinal");

        let segundo;
        await act(async () => {
            segundo = await result.current.guardarPorcentaje("Cognitivo", "40");
        });
        expect(segundo).toBe(false);

        await act(async () => {
            terminar({ tipo_nota: "Actitudinal", porcentaje: 20 });
            await primero;
        });
        expect(guardarPorcentajeTipoMock).toHaveBeenCalledTimes(1);
    });
});
