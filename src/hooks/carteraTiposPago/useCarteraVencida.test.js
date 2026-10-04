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

    it("sin año elegido, resumen y lista se piden sin año", async () => {
        const { result } = renderHook(() => useCarteraVencida());
        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(serviceMock.obtenerResumenCarteraVencida).toHaveBeenCalledWith({});
        expect(serviceMock.obtenerDetalleCarteraVencida).toHaveBeenCalledWith({});
    });
});

describe("useCarteraVencida con un año elegido", () => {
    const parametrosAnio = { anio_lectivo_id: 2 };

    beforeEach(() => {
        serviceMock.obtenerResumenCarteraVencida.mockResolvedValue({ total_deuda: 310000 });
        serviceMock.obtenerDetalleCarteraVencida.mockResolvedValue(items);
    });

    it("pide resumen y lista de ese año", async () => {
        const { result } = renderHook(() => useCarteraVencida({ parametrosAnio }));
        await waitFor(() => expect(result.current.cargando).toBe(false));

        expect(serviceMock.obtenerResumenCarteraVencida).toHaveBeenCalledWith({ parametrosAnio });
        expect(serviceMock.obtenerDetalleCarteraVencida).toHaveBeenCalledWith({ parametrosAnio });
        expect(result.current.items).toEqual(items);
    });

    it("si cambia el año, vuelve a pedir la cartera con el año nuevo", async () => {
        const { result, rerender } = renderHook(
            ({ anio }) => useCarteraVencida({ parametrosAnio: anio }),
            { initialProps: { anio: parametrosAnio } },
        );
        await waitFor(() => expect(result.current.cargando).toBe(false));

        const otroAnio = { anio_lectivo_id: 3 };
        rerender({ anio: otroAnio });

        await waitFor(() => expect(serviceMock.obtenerResumenCarteraVencida)
            .toHaveBeenLastCalledWith({ parametrosAnio: otroAnio }));
        expect(serviceMock.obtenerDetalleCarteraVencida)
            .toHaveBeenLastCalledWith({ parametrosAnio: otroAnio });
        await waitFor(() => expect(result.current.cargando).toBe(false));
    });

    it("recargar vuelve a pedir la cartera del mismo año y conserva los filtros", async () => {
        const { result } = renderHook(() => useCarteraVencida({ parametrosAnio }));
        await waitFor(() => expect(result.current.cargando).toBe(false));
        act(() => result.current.setFiltroCurso("10"));

        serviceMock.obtenerDetalleCarteraVencida.mockResolvedValue([items[1]]);
        act(() => result.current.recargar());

        await waitFor(() => expect(result.current.items).toEqual([items[1]]));
        expect(serviceMock.obtenerResumenCarteraVencida).toHaveBeenCalledTimes(2);
        expect(serviceMock.obtenerResumenCarteraVencida).toHaveBeenLastCalledWith({ parametrosAnio });
        expect(serviceMock.obtenerDetalleCarteraVencida).toHaveBeenLastCalledWith({ parametrosAnio });
        expect(result.current.filtroCurso).toBe("10");
        expect(result.current.cargando).toBe(false);
    });

    it("si se recarga antes de que llegue la respuesta, la vieja no pisa a la nueva", async () => {
        let responderLaVieja;
        serviceMock.obtenerResumenCarteraVencida
            .mockReturnValueOnce(new Promise((resolve) => {
                responderLaVieja = resolve;
            }))
            .mockResolvedValueOnce({ total_deuda: 200000 });
        serviceMock.obtenerDetalleCarteraVencida
            .mockResolvedValueOnce([items[0]])
            .mockResolvedValueOnce([items[1]]);

        const { result } = renderHook(() => useCarteraVencida({ parametrosAnio }));
        act(() => result.current.recargar());
        await waitFor(() => expect(result.current.cargando).toBe(false));
        expect(result.current.items).toEqual([items[1]]);

        await act(async () => {
            responderLaVieja({ total_deuda: 110000 });
        });

        expect(result.current.resumen).toEqual({ total_deuda: 200000 });
        expect(result.current.items).toEqual([items[1]]);
        expect(result.current.cargando).toBe(false);
    });
});
