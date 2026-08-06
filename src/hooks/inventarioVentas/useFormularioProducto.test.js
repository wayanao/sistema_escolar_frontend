import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useFormularioProducto from "./useFormularioProducto";

const { serviceMock, swalFireMock } = vi.hoisted(() => ({
    serviceMock: {
        crearProductoInventario: vi.fn(),
        actualizarProductoInventario: vi.fn(),
        actualizarEstadoProductoInventario: vi.fn(),
    },
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/inventarioVentasApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const producto = {
    id: 1,
    nombre: "Sudadera",
    costo: 30000,
    precio_venta: 50000,
    stock_actual: 12,
    estado: "activo",
};

const evento = { preventDefault: vi.fn() };

describe("useFormularioProducto", () => {
    const cargarInventario = vi.fn();
    const aplicarEstadoLocal = vi.fn();

    const renderizar = () =>
        renderHook(() => useFormularioProducto({ cargarInventario, aplicarEstadoLocal }));

    beforeEach(() => {
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        serviceMock.crearProductoInventario.mockResolvedValue({ status: 201, data: { id: 9 } });
        serviceMock.actualizarProductoInventario.mockResolvedValue({ status: 200, data: {} });
        serviceMock.actualizarEstadoProductoInventario.mockResolvedValue({
            status: 200,
            data: { estado: "inactivo" },
        });
    });

    it("bloquea el envío cuando falta un campo obligatorio", async () => {
        const { result } = renderizar();

        await act(async () => {
            await result.current.handleSubmit(evento);
        });

        expect(swalFireMock).toHaveBeenCalledWith(
            "Atención",
            "Todos los campos son obligatorios",
            "warning"
        );
        expect(serviceMock.crearProductoInventario).not.toHaveBeenCalled();
    });

    it("crea el producto, limpia el formulario y recarga el listado", async () => {
        const { result } = renderizar();

        act(() => {
            result.current.cambiarCampoFormulario("nombre", "Kit de útiles");
            result.current.cambiarCampoFormulario("costo", "15000.50");
            result.current.cambiarCampoFormulario("precio_venta", "25000.75");
            result.current.cambiarCampoFormulario("stock_actual", "20");
        });
        await act(async () => {
            await result.current.handleSubmit(evento);
        });

        expect(serviceMock.crearProductoInventario).toHaveBeenCalledWith({
            nombre: "Kit de útiles",
            costo: 15000.5,
            precio_venta: 25000.75,
            stock_actual: 20,
            estado: "activo",
        });
        expect(swalFireMock).toHaveBeenCalledWith("Éxito", "Producto creado", "success");
        expect(cargarInventario).toHaveBeenCalled();
        expect(result.current.showForm).toBe(false);
        expect(result.current.editingId).toBeNull();
        expect(result.current.formData.nombre).toBe("");
    });

    it("actualiza el producto cargado desde la tabla", async () => {
        const { result } = renderizar();

        act(() => {
            result.current.editarProducto(producto);
        });
        expect(result.current.showForm).toBe(true);
        expect(result.current.editingId).toBe(1);

        await act(async () => {
            await result.current.handleSubmit(evento);
        });

        expect(serviceMock.actualizarProductoInventario).toHaveBeenCalledWith(1, {
            nombre: "Sudadera",
            costo: 30000,
            precio_venta: 50000,
            stock_actual: 12,
            estado: "activo",
        });
        expect(swalFireMock).toHaveBeenCalledWith("Éxito", "Producto actualizado", "success");
    });

    it("cambia el estado tras confirmar y actualiza la lista en memoria", async () => {
        const { result } = renderizar();

        await act(async () => {
            await result.current.cambiarEstadoProducto(producto, "inactivo");
        });

        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "¿Deseas desactivar este producto?",
                confirmButtonText: "Sí, desactivar",
            })
        );
        expect(serviceMock.actualizarEstadoProductoInventario).toHaveBeenCalledWith(1, "inactivo");
        expect(aplicarEstadoLocal).toHaveBeenCalledWith(1, "inactivo");
        expect(swalFireMock).toHaveBeenCalledWith("Listo", "Producto inactivo", "success");
    });

    it("no consulta al backend si el estado destino es el actual", async () => {
        const { result } = renderizar();

        await act(async () => {
            await result.current.cambiarEstadoProducto(producto, "activo");
        });

        expect(swalFireMock).not.toHaveBeenCalled();
        expect(serviceMock.actualizarEstadoProductoInventario).not.toHaveBeenCalled();
    });

    it("respeta la cancelación de la confirmación", async () => {
        swalFireMock.mockResolvedValue({ isConfirmed: false });
        const { result } = renderizar();

        await act(async () => {
            await result.current.cambiarEstadoProducto(producto, "inactivo");
        });

        expect(serviceMock.actualizarEstadoProductoInventario).not.toHaveBeenCalled();
        expect(aplicarEstadoLocal).not.toHaveBeenCalled();
    });

    it("alterna el formulario y lo limpia solo al cerrarlo", async () => {
        const { result } = renderizar();

        act(() => {
            result.current.editarProducto(producto);
        });
        await waitFor(() => expect(result.current.editingId).toBe(1));

        act(() => {
            result.current.alternarFormulario();
        });

        expect(result.current.showForm).toBe(false);
        expect(result.current.editingId).toBeNull();
        expect(result.current.formData.nombre).toBe("");
    });
});
