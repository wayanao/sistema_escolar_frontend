import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useInventario from "./useInventario";

const { serviceMock, swalFireMock } = vi.hoisted(() => ({
    serviceMock: { obtenerInventario: vi.fn() },
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/inventarioVentasApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const activos = [
    { id: 1, nombre: "Sudadera", estado: "activo" },
    { id: 2, nombre: "Cuaderno", estado: "activo" },
];

const todos = [...activos, { id: 3, nombre: "Camiseta", estado: "inactivo" }];

describe("useInventario", () => {
    beforeEach(() => {
        serviceMock.obtenerInventario.mockImplementation((estado) =>
            Promise.resolve(estado === "todos" ? todos : activos)
        );
    });

    it("carga el inventario activo al montar y termina el estado de carga", async () => {
        const { result } = renderHook(() => useInventario());

        expect(result.current.loading).toBe(true);
        expect(result.current.estadoFiltro).toBe("activo");

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.productos).toEqual(activos);
        expect(serviceMock.obtenerInventario).toHaveBeenCalledWith("activo");
    });

    it("recarga con el estado seleccionado al cambiar el filtro", async () => {
        const { result } = renderHook(() => useInventario());
        await waitFor(() => expect(result.current.productos).toEqual(activos));

        act(() => {
            result.current.setEstadoFiltro("todos");
        });

        await waitFor(() => {
            expect(result.current.productos).toEqual(todos);
        });
        expect(serviceMock.obtenerInventario).toHaveBeenLastCalledWith("todos");
        expect(serviceMock.obtenerInventario).toHaveBeenCalledTimes(2);
    });

    it("aplica el cambio de estado en memoria sin volver a consultar", async () => {
        const { result } = renderHook(() => useInventario());
        await waitFor(() => expect(result.current.productos).toEqual(activos));

        act(() => {
            result.current.aplicarEstadoLocal(1, "inactivo");
        });

        expect(result.current.productos.map((item) => item.id)).toEqual([2]);
        expect(serviceMock.obtenerInventario).toHaveBeenCalledTimes(1);
    });

    it("avisa del error de carga y deja de mostrar el spinner", async () => {
        const error = new Error("fallo");
        serviceMock.obtenerInventario.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useInventario());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.productos).toEqual([]);
        expect(swalFireMock).toHaveBeenCalledWith(
            "Error",
            "No se pudo cargar el inventario",
            "error"
        );
        expect(consoleError).toHaveBeenCalledWith("Error cargando inventario", error);
        consoleError.mockRestore();
    });

    it("permite recargar el listado bajo demanda", async () => {
        const { result } = renderHook(() => useInventario());
        await waitFor(() => expect(result.current.productos).toEqual(activos));

        await act(async () => {
            await result.current.cargarInventario();
        });

        expect(serviceMock.obtenerInventario).toHaveBeenCalledTimes(2);
        expect(serviceMock.obtenerInventario).toHaveBeenLastCalledWith("activo");
    });
});
