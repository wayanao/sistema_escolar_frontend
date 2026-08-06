import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VistaInventario from "./VistaInventario";

const productos = [
    {
        id: 1,
        nombre: "Sudadera",
        stock_actual: 12,
        costo: 30000,
        precio_venta: 50000,
        utilidad_unitaria: 20000,
        margen_utilidad: 40,
        estado: "activo",
    },
    {
        id: 2,
        nombre: "Cuaderno",
        stock_actual: 3,
        costo: 2000,
        precio_venta: 5000,
        utilidad_unitaria: 3000,
        margen_utilidad: 60,
        estado: "inactivo",
    },
];

const formData = {
    nombre: "",
    costo: "",
    precio_venta: "",
    stock_actual: "",
    estado: "activo",
};

const renderizar = (props = {}) => {
    const callbacks = {
        onCambiarFiltro: vi.fn(),
        onCambiarCampo: vi.fn(),
        onAlternarFormulario: vi.fn(),
        onSubmit: vi.fn(),
        onEditarProducto: vi.fn(),
        onCambiarEstadoProducto: vi.fn(),
    };
    render(
        <VistaInventario
            productos={productos}
            loading={false}
            estadoFiltro="activo"
            showForm={false}
            editingId={null}
            formData={formData}
            {...callbacks}
            {...props}
        />
    );
    return callbacks;
};

describe("VistaInventario", () => {
    it("muestra el spinner mientras carga y no dibuja la tabla", () => {
        renderizar({ loading: true });

        expect(screen.queryByText("Productos")).not.toBeInTheDocument();
        expect(screen.queryByText("Sudadera")).not.toBeInTheDocument();
    });

    it("presenta la tabla con stock, utilidad, margen y estado de cada producto", () => {
        renderizar();

        expect(screen.getByText("Sudadera")).toBeInTheDocument();
        expect(screen.getByText("12 und.")).toBeInTheDocument();
        expect(screen.getByText("40%")).toBeInTheDocument();
        expect(screen.getByText("Activo", { selector: "span" })).toBeInTheDocument();
        expect(screen.getByText("Inactivo", { selector: "span" })).toBeInTheDocument();
        expect(screen.getByText("3 und.")).toHaveClass("bg-red-100");
        expect(screen.getByText("12 und.")).toHaveClass("bg-green-100");
    });

    it("muestra el estado vacío cuando no hay productos", () => {
        renderizar({ productos: [] });

        expect(screen.getByText("No hay productos en inventario")).toBeInTheDocument();
    });

    it("notifica el filtro, la edición y el cambio de estado", () => {
        const callbacks = renderizar();

        const [filtro, estadoFila] = screen.getAllByRole("combobox");
        fireEvent.change(filtro, { target: { value: "todos" } });
        expect(callbacks.onCambiarFiltro).toHaveBeenCalledWith("todos");

        fireEvent.change(estadoFila, { target: { value: "inactivo" } });
        expect(callbacks.onCambiarEstadoProducto).toHaveBeenCalledWith(
            productos[0],
            "inactivo"
        );

        fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
        expect(callbacks.onEditarProducto).toHaveBeenCalledWith(productos[0]);

        fireEvent.click(screen.getByRole("button", { name: "+ Nuevo Producto" }));
        expect(callbacks.onAlternarFormulario).toHaveBeenCalled();
    });

    it("dibuja el formulario en modo edición y reporta cada campo", () => {
        const callbacks = renderizar({ showForm: true, editingId: 1 });

        expect(screen.getByText("Editar Producto")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Actualizar Producto" })
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();

        fireEvent.change(screen.getByRole("textbox"), {
            target: { value: "Kit de útiles" },
        });
        expect(callbacks.onCambiarCampo).toHaveBeenCalledWith("nombre", "Kit de útiles");

        fireEvent.change(screen.getAllByRole("spinbutton")[0], {
            target: { value: "15000" },
        });
        expect(callbacks.onCambiarCampo).toHaveBeenCalledWith("costo", "15000");
    });
});
