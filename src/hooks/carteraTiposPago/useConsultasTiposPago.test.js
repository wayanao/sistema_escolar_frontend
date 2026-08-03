import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useConsultasTiposPago from "./useConsultasTiposPago";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerTiposPagoDetallados: vi.fn(),
        obtenerTiposPago: vi.fn(),
        obtenerCursosParaTiposPago: vi.fn(),
        obtenerDetalleTipoPago: vi.fn(),
    },
}));

vi.mock("../../services/carteraTiposPagoApi", () => serviceMock);

const tiposPagos = [
    { id: 1, nombre: "Matrícula", activo: true, cursos: [] },
    { id: 2, nombre: "Histórico", activo: false, cursos: [] },
];

const cursos = [{ id: 10, nombre: "5A", estado: "activo" }];

describe("useConsultasTiposPago", () => {
    beforeEach(() => {
        serviceMock.obtenerTiposPagoDetallados.mockResolvedValue(tiposPagos);
        serviceMock.obtenerTiposPago.mockResolvedValue(tiposPagos);
        serviceMock.obtenerCursosParaTiposPago.mockResolvedValue(cursos);
        serviceMock.obtenerDetalleTipoPago.mockResolvedValue({
            id: 1,
            descripcion: "Cobro ordinario",
            tipo_cobro: "mensual",
        });
    });

    it("carga conceptos y cursos y conserva el filtro inicial de activos", async () => {
        const { result } = renderHook(() => useConsultasTiposPago());

        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));
        await waitFor(() => expect(result.current.cursos).toEqual(cursos));

        expect(result.current.estadoFiltro).toBe("activo");
        expect(result.current.tiposPagosFiltrados).toEqual([tiposPagos[0]]);
        expect(result.current.resumenEstados).toEqual({ activo: 1, inactivo: 1, todos: 2 });

        act(() => result.current.setEstadoFiltro("inactivo"));
        expect(result.current.tiposPagosFiltrados).toEqual([tiposPagos[1]]);
    });

    it("mantiene el fallback al listado básico cuando falla el detallado", async () => {
        const error = new Error("Detallado no disponible");
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerTiposPagoDetallados.mockRejectedValue(error);

        const { result } = renderHook(() => useConsultasTiposPago());
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        expect(serviceMock.obtenerTiposPago).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith(
            "Error cargando tipos de pagos detallado, fallback a básico",
            error
        );
    });

    it("precarga el concepto y combina su detalle remoto", async () => {
        const { result } = renderHook(() => useConsultasTiposPago());
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        let detalle;
        await act(async () => {
            detalle = await result.current.seleccionarTipo(tiposPagos[0]);
        });

        expect(serviceMock.obtenerDetalleTipoPago).toHaveBeenCalledWith(1);
        expect(detalle).toEqual({
            ...tiposPagos[0],
            descripcion: "Cobro ordinario",
            tipo_cobro: "mensual",
        });
        expect(result.current.selectedTipoId).toBe(1);
        expect(result.current.detalle).toEqual(detalle);
        expect(result.current.loadingDetalle).toBe(false);

        act(() => result.current.actualizarDetalle({ activo: false }));
        expect(result.current.detalle).toEqual({ ...detalle, activo: false });

        act(() => result.current.cerrarDetalle());
        expect(result.current.selectedTipoId).toBeNull();
        expect(result.current.detalle).toBeNull();
    });

    it("propaga el error de detalle y siempre finaliza su carga", async () => {
        const error = new Error("Detalle no disponible");
        serviceMock.obtenerDetalleTipoPago.mockRejectedValue(error);
        const { result } = renderHook(() => useConsultasTiposPago());
        await waitFor(() => expect(result.current.tiposPagos).toEqual(tiposPagos));

        await act(async () => {
            await expect(result.current.seleccionarTipo(tiposPagos[0])).rejects.toBe(error);
        });

        expect(result.current.detalle).toEqual(tiposPagos[0]);
        expect(result.current.loadingDetalle).toBe(false);
    });
});
