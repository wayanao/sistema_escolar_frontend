import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCarteraVencida from "./useCarteraVencida";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerResumenCarteraVencida: vi.fn(),
        obtenerDetalleCarteraVencida: vi.fn(),
    },
}));

vi.mock("../../services/carteraTiposPagoApi", () => serviceMock);

const items = [
    {
        estudiante_id: 1,
        nombre: "Ana",
        apellido: "Pérez",
        curso_id: 10,
        curso_nombre: "5A",
        deuda_academica: 100000,
        deuda_inventario: 0,
        mora: 10000,
        total: 110000,
    },
    {
        estudiante_id: 2,
        nombre: "Luis",
        apellido: "Gómez",
        curso_id: 20,
        curso_nombre: "6B",
        deuda_academica: 0,
        deuda_inventario: 200000,
        mora: 0,
        total: 200000,
    },
];

describe("useCarteraVencida", () => {
    beforeEach(() => {
        serviceMock.obtenerResumenCarteraVencida.mockResolvedValue({ total_deuda: 310000 });
        serviceMock.obtenerDetalleCarteraVencida.mockResolvedValue(items);
    });

    it("carga resumen y detalle en paralelo y calcula los derivados", async () => {
        const { result } = renderHook(() => useCarteraVencida());

        expect(result.current.cargando).toBe(true);
        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(serviceMock.obtenerResumenCarteraVencida).toHaveBeenCalledTimes(1);
        expect(serviceMock.obtenerDetalleCarteraVencida).toHaveBeenCalledTimes(1);
        expect(result.current.resumen).toEqual({ total_deuda: 310000 });
        expect(result.current.items).toEqual(items);
        expect(result.current.cursosUnicos).toEqual([
            { id: 10, nombre: "5A" },
            { id: 20, nombre: "6B" },
        ]);
        expect(result.current.totales).toEqual({
            total: 310000,
            academica: 100000,
            inventario: 200000,
            mora: 10000,
        });
        expect(result.current.maxDeuda).toBe(200000);
    });

    it("coordina búsqueda, curso y tipo de deuda", async () => {
        const { result } = renderHook(() => useCarteraVencida());
        await waitFor(() => expect(result.current.cargando).toBe(false));

        act(() => {
            result.current.setBusqueda("Pérez");
            result.current.setFiltroCurso("10");
            result.current.setFiltroTipo("mora");
        });

        expect(result.current.itemsFiltrados).toEqual([items[0]]);
        expect(result.current.cursoSeleccionado).toEqual({ id: 10, nombre: "5A" });
    });

    it("conserva el manejo actual de error y finaliza la carga", async () => {
        const error = new Error("Sin conexión");
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        serviceMock.obtenerResumenCarteraVencida.mockRejectedValue(error);

        const { result } = renderHook(() => useCarteraVencida());
        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(result.current.resumen).toBeNull();
        expect(result.current.items).toEqual([]);
        expect(consoleError).toHaveBeenCalledWith("Error cargando cartera vencida:", error);
    });
});
