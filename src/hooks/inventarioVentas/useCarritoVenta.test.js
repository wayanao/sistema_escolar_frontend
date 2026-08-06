import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCarritoVenta from "./useCarritoVenta";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { registrarVenta: vi.fn() },
}));

vi.mock("../../services/inventarioVentasApi", () => serviceMock);

const inventario = [
    { id: 1, nombre: "Sudadera", stock_actual: 3, precio_venta: 25000 },
    { id: 2, nombre: "Cuaderno", stock_actual: 10, precio_venta: 5000 },
];

const estudiantes = [
    { id: 7, nombre: "Ana", apellido: "Pérez" },
    { id: 8, nombre: "Luis", apellido: "Gómez" },
];

const ventasAnteriores = [
    { id: 501, estudiante_id: 7, estado: "Pendiente" },
    { id: 502, estudiante_id: 8, estado: "Anulada" },
];

describe("useCarritoVenta", () => {
    const cargarDatos = vi.fn();

    const renderizar = () =>
        renderHook(() =>
            useCarritoVenta({ inventario, estudiantes, ventasAnteriores, cargarDatos })
        );

    beforeEach(() => {
        window.alert = vi.fn();
        serviceMock.registrarVenta.mockResolvedValue({ id: 901 });
    });

    it("agrega productos, respeta el stock y calcula el total", () => {
        const { result } = renderizar();

        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.agregarAlCarrito(1));

        expect(result.current.carrito[0].cantidad).toBe(3);
        expect(result.current.totalVenta).toBe(75000);
        expect(window.alert).toHaveBeenCalledWith(
            "No hay más stock disponible de este producto."
        );
    });

    it("cambia cantidades y quita productos del carrito", () => {
        const { result } = renderizar();

        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.agregarAlCarrito(2));
        act(() => result.current.cambiarCantidad(2, 1));

        expect(result.current.totalVenta).toBe(35000);

        act(() => result.current.quitarDelCarrito(1));

        expect(result.current.carrito.map((item) => item.id)).toEqual([2]);
    });

    it("filtra estudiantes por la búsqueda y limpia la selección al escribir", () => {
        const { result } = renderizar();

        act(() => result.current.cambiarBusquedaEstudiante("gó"));

        expect(result.current.estudiantesFiltrados.map((e) => e.id)).toEqual([8]);
        expect(result.current.mostrarDropdownEstudiantes).toBe(true);

        act(() => result.current.cerrarDropdownEstudiantes());
        expect(result.current.mostrarDropdownEstudiantes).toBe(false);

        act(() => result.current.abrirDropdownEstudiantes());
        expect(result.current.mostrarDropdownEstudiantes).toBe(true);

        act(() => result.current.seleccionarEstudiante(estudiantes[1]));

        expect(result.current.busquedaEstudiante).toBe("Gómez Luis");
        expect(result.current.mostrarDropdownEstudiantes).toBe(false);
        expect(result.current.ventasDelEstudiante.map((v) => v.id)).toEqual([502]);
    });

    it("bloquea el cargo con el carrito vacío o sin estudiante válido", async () => {
        const { result } = renderizar();

        await act(async () => {
            await result.current.procesarVenta();
        });
        expect(window.alert).toHaveBeenCalledWith("El carrito está vacío.");

        act(() => result.current.agregarAlCarrito(1));
        await act(async () => {
            await result.current.procesarVenta();
        });

        expect(window.alert).toHaveBeenCalledWith(
            "Por favor selecciona un estudiante válido. Ya no se permiten cargos a Público General."
        );
        expect(serviceMock.registrarVenta).not.toHaveBeenCalled();
    });

    it("registra el cargo, arma el volante, limpia el carrito y refresca", async () => {
        const { result } = renderizar();

        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.seleccionarEstudiante(estudiantes[0]));

        await act(async () => {
            await result.current.procesarVenta();
        });

        expect(serviceMock.registrarVenta).toHaveBeenCalledWith({
            estudiante_id: 7,
            tipo_venta: "Credito",
            total: 50000,
            notas: "",
            detalles: [
                { inventario_id: 1, cantidad: 2, precio_unitario: 25000, subtotal: 50000 },
            ],
        });
        expect(result.current.ultimaVenta).toMatchObject({
            id: 901,
            cliente: "Pérez Ana",
            tipo_venta: "Cargo Pendiente",
            total: 50000,
        });
        expect(result.current.carrito).toEqual([]);
        expect(result.current.busquedaEstudiante).toBe("");
        expect(cargarDatos).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith(
            "Productos cargados a la cuenta del estudiante exitosamente"
        );
    });

    it("conserva el historial del último estudiante cargado tras limpiar la búsqueda", async () => {
        const { result } = renderizar();

        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.seleccionarEstudiante(estudiantes[0]));

        await act(async () => {
            await result.current.procesarVenta();
        });

        await waitFor(() => {
            expect(result.current.hayEstudianteEnHistorial).toBe(true);
        });
        expect(result.current.ventasDelEstudiante.map((v) => v.id)).toEqual([501]);
    });

    it("no registra un segundo cargo si se pulsa mientras el primero está en vuelo", async () => {
        let resolverVenta;
        serviceMock.registrarVenta.mockReturnValueOnce(
            new Promise((resolve) => {
                resolverVenta = resolve;
            })
        );
        const { result } = renderizar();

        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.seleccionarEstudiante(estudiantes[0]));

        let primeraVenta;
        act(() => {
            primeraVenta = result.current.procesarVenta();
        });

        expect(result.current.registrandoVenta).toBe(true);

        await act(async () => {
            await result.current.procesarVenta();
        });

        expect(serviceMock.registrarVenta).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolverVenta({ id: 901 });
            await primeraVenta;
        });

        expect(serviceMock.registrarVenta).toHaveBeenCalledTimes(1);
        expect(result.current.registrandoVenta).toBe(false);
        expect(result.current.carrito).toEqual([]);
    });

    it("vuelve a habilitar el cargo después de un error para poder reintentar", async () => {
        serviceMock.registrarVenta.mockRejectedValueOnce(new Error("fallo"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderizar();

        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.seleccionarEstudiante(estudiantes[0]));

        await act(async () => {
            await result.current.procesarVenta();
        });

        expect(result.current.registrandoVenta).toBe(false);

        await act(async () => {
            await result.current.procesarVenta();
        });

        expect(serviceMock.registrarVenta).toHaveBeenCalledTimes(2);
        consoleError.mockRestore();
    });

    it("avisa cuando el registro del cargo falla y conserva el carrito", async () => {
        const error = new Error("fallo");
        serviceMock.registrarVenta.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderizar();

        act(() => result.current.agregarAlCarrito(1));
        act(() => result.current.seleccionarEstudiante(estudiantes[0]));

        await act(async () => {
            await result.current.procesarVenta();
        });

        expect(window.alert).toHaveBeenCalledWith("Error procesando la venta");
        expect(result.current.carrito).toHaveLength(1);
        expect(result.current.ultimaVenta).toBeNull();
        expect(consoleError).toHaveBeenCalledWith(error);
        consoleError.mockRestore();
    });
});
