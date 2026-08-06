import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useConsultasVentas from "./useConsultasVentas";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerVentas: vi.fn(),
        obtenerInventario: vi.fn(),
        obtenerEstudiantesParaVentas: vi.fn(),
    },
}));

vi.mock("../../services/inventarioVentasApi", () => serviceMock);

const ventas = [{ id: 501, estudiante_id: 7 }];
const estudiantes = [{ id: 7, nombre: "Ana", apellido: "Pérez" }];
const inventario = [
    { id: 1, nombre: "Sudadera", stock_actual: 3, precio_venta: 25000 },
    { id: 2, nombre: "Cuaderno agotado", stock_actual: 0, precio_venta: 5000 },
];

describe("useConsultasVentas", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        serviceMock.obtenerVentas.mockResolvedValue(ventas);
        serviceMock.obtenerInventario.mockResolvedValue(inventario);
        serviceMock.obtenerEstudiantesParaVentas.mockResolvedValue(estudiantes);
    });

    it("consulta ventas, inventario activo y estudiantes en paralelo", async () => {
        const { result } = renderHook(() => useConsultasVentas());

        await waitFor(() => {
            expect(result.current.ventasAnteriores).toEqual(ventas);
        });
        expect(result.current.estudiantes).toEqual(estudiantes);
        expect(serviceMock.obtenerVentas).toHaveBeenCalledTimes(1);
        expect(serviceMock.obtenerInventario).toHaveBeenCalledWith("activo");
        expect(serviceMock.obtenerEstudiantesParaVentas).toHaveBeenCalledTimes(1);
    });

    it("deja en el catálogo solo los productos con existencias", async () => {
        const { result } = renderHook(() => useConsultasVentas());

        await waitFor(() => {
            expect(result.current.inventario).toEqual([inventario[0]]);
        });
    });

    it("avisa con alert cuando falla cualquiera de las consultas", async () => {
        const error = new Error("fallo");
        serviceMock.obtenerInventario.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useConsultasVentas());

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Error cargando base de datos");
        });
        expect(result.current.inventario).toEqual([]);
        expect(result.current.ventasAnteriores).toEqual([]);
        expect(consoleError).toHaveBeenCalledWith(error);
        consoleError.mockRestore();
    });

    it("permite refrescar stock e historial bajo demanda", async () => {
        const { result } = renderHook(() => useConsultasVentas());
        await waitFor(() => expect(result.current.ventasAnteriores).toEqual(ventas));

        await act(async () => {
            await result.current.cargarDatos();
        });

        expect(serviceMock.obtenerVentas).toHaveBeenCalledTimes(2);
        expect(serviceMock.obtenerInventario).toHaveBeenCalledTimes(2);
        expect(serviceMock.obtenerEstudiantesParaVentas).toHaveBeenCalledTimes(2);
    });
});
