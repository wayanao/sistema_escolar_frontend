import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VistaVentas from "./VistaVentas";

const inventario = [{ id: 1, nombre: "Sudadera", stock_actual: 3, precio_venta: 25000 }];
const carrito = [{ id: 1, nombre: "Sudadera", stock_actual: 3, precio_venta: 25000, cantidad: 2 }];
const estudiantes = [{ id: 7, nombre: "Ana", apellido: "Pérez" }];

const ventas = [
    {
        id: 501,
        fecha: "2026-07-20T10:30:00",
        estado: "Pendiente",
        total: 50000,
        detalles: [{ cantidad: 2, producto: "Sudadera", subtotal: 50000 }],
    },
    {
        id: 502,
        fecha: "2026-07-21T09:00:00",
        estado: "Anulada",
        total: 5000,
        motivo_anulacion: "Error de registro",
        detalles: [],
    },
];

const renderizar = (props = {}) => {
    const callbacks = {
        onAgregarAlCarrito: vi.fn(),
        onCambiarCantidad: vi.fn(),
        onQuitarDelCarrito: vi.fn(),
        onCambiarBusqueda: vi.fn(),
        onMostrarDropdown: vi.fn(),
        onOcultarDropdown: vi.fn(),
        onSeleccionarEstudiante: vi.fn(),
        onProcesarVenta: vi.fn(),
        onAnularVenta: vi.fn(),
        onAbrirVolante: vi.fn(),
    };
    render(
        <VistaVentas
            inventario={inventario}
            carrito={[]}
            totalVenta={0}
            busquedaEstudiante=""
            mostrarDropdownEstudiantes={false}
            estudiantesFiltrados={estudiantes}
            hayEstudianteEnHistorial={false}
            ventasDelEstudiante={[]}
            ultimaVenta={null}
            {...callbacks}
            {...props}
        />
    );
    return callbacks;
};

describe("VistaVentas", () => {
    it("presenta el catálogo y notifica cuando se añade un producto", () => {
        const callbacks = renderizar();

        expect(screen.getByText("Sudadera")).toBeInTheDocument();
        expect(screen.getByText("Stock: 3 unid.")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "+ Añadir" }));
        expect(callbacks.onAgregarAlCarrito).toHaveBeenCalledWith(1);
    });

    it("muestra el carrito vacío y luego sus renglones con subtotal", () => {
        renderizar();
        expect(screen.getByText("Agrega productos al carrito...")).toBeInTheDocument();

        renderizar({ carrito, totalVenta: 50000 });
        expect(
            screen.getAllByText(`$${(50000).toLocaleString()}`).length
        ).toBeGreaterThan(0);
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("reporta cantidades, eliminación y el envío del cargo", () => {
        const callbacks = renderizar({ carrito, totalVenta: 50000 });

        fireEvent.click(screen.getByRole("button", { name: "-" }));
        expect(callbacks.onCambiarCantidad).toHaveBeenCalledWith(1, -1);

        fireEvent.click(screen.getByRole("button", { name: "+" }));
        expect(callbacks.onCambiarCantidad).toHaveBeenCalledWith(1, 1);

        fireEvent.click(screen.getByRole("button", { name: "🗑️" }));
        expect(callbacks.onQuitarDelCarrito).toHaveBeenCalledWith(1);

        fireEvent.click(screen.getByRole("button", { name: /Cargar al Estudiante/ }));
        expect(callbacks.onProcesarVenta).toHaveBeenCalled();
    });

    it("bloquea el botón de cargo mientras la venta está en curso", () => {
        const callbacks = renderizar({
            carrito,
            totalVenta: 50000,
            registrandoVenta: true,
        });

        const boton = screen.getByRole("button", { name: /Cargando/ });
        expect(boton).toBeDisabled();

        fireEvent.click(boton);
        expect(callbacks.onProcesarVenta).not.toHaveBeenCalled();
    });

    it("reporta la búsqueda y la selección del estudiante", () => {
        const callbacks = renderizar({ mostrarDropdownEstudiantes: true });

        const buscador = screen.getByPlaceholderText("Buscar por nombre...");
        fireEvent.focus(buscador);
        expect(callbacks.onMostrarDropdown).toHaveBeenCalled();

        fireEvent.change(buscador, { target: { value: "pé" } });
        expect(callbacks.onCambiarBusqueda).toHaveBeenCalledWith("pé");

        fireEvent.mouseDown(screen.getByText("Pérez Ana - Cód: 7"));
        expect(callbacks.onSeleccionarEstudiante).toHaveBeenCalledWith(estudiantes[0]);
    });

    it("pide seleccionar un estudiante antes de mostrar el historial", () => {
        renderizar();

        expect(
            screen.getByText("Selecciona o carga productos a un estudiante para ver su historial")
        ).toBeInTheDocument();
    });

    it("avisa cuando el estudiante no tiene cargos previos", () => {
        renderizar({ hayEstudianteEnHistorial: true, ventasDelEstudiante: [] });

        expect(screen.getByText("Este estudiante no tiene cargos previos")).toBeInTheDocument();
    });

    it("distingue una venta anulada de una vigente en el historial", () => {
        const callbacks = renderizar({
            hayEstudianteEnHistorial: true,
            ventasDelEstudiante: ventas,
        });

        expect(screen.getByText("2026-07-20T10:30")).toBeInTheDocument();
        expect(screen.getByText("Pendiente")).toHaveClass("bg-yellow-100");
        expect(screen.getByText("Anulada", { selector: "span.bg-red-100" })).toBeInTheDocument();
        expect(screen.getByText("Motivo: Error de registro")).toBeInTheDocument();
        expect(screen.getByText("Sin detalles")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Anular" }));
        expect(callbacks.onAnularVenta).toHaveBeenCalledWith(ventas[0]);
    });

    it("ofrece imprimir el volante solo cuando existe una última venta", () => {
        renderizar();
        expect(
            screen.queryByRole("button", { name: /Imprimir Volante/ })
        ).not.toBeInTheDocument();

        const callbacks = renderizar({ ultimaVenta: { id: 901 } });
        fireEvent.click(
            screen.getByRole("button", { name: "🖨️ Imprimir Volante de Pago #901" })
        );
        expect(callbacks.onAbrirVolante).toHaveBeenCalled();
    });
});
