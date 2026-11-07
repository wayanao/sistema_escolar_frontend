import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InventarioAdmin from "./InventarioAdmin";
import { opcionesVentanaExito } from "../hooks/ventanaExito";

const { apiMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const activos = [
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
        estado: "activo",
    },
];

const inactivos = [
    {
        id: 3,
        nombre: "Camiseta descontinuada",
        stock_actual: 0,
        costo: 10000,
        precio_venta: 18000,
        utilidad_unitaria: 8000,
        margen_utilidad: 44,
        estado: "inactivo",
    },
];

describe("InventarioAdmin", () => {
    beforeEach(() => {
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        apiMock.get.mockImplementation((url, config) => {
            if (url !== "/inventario") throw new Error(`GET inesperado: ${url}`);
            const estado = config?.params?.estado;
            if (estado === "activo") return Promise.resolve({ data: activos });
            if (estado === "inactivo") return Promise.resolve({ data: inactivos });
            return Promise.resolve({ data: [...activos, ...inactivos] });
        });
        apiMock.post.mockResolvedValue({ status: 201, data: { id: 9 } });
        apiMock.put.mockResolvedValue({ status: 200, data: {} });
        apiMock.patch.mockResolvedValue({ status: 200, data: { estado: "inactivo" } });
    });

    it("consulta el inventario activo y recarga al cambiar el filtro de estado", async () => {
        render(<InventarioAdmin />);

        expect(await screen.findByText("Sudadera")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/inventario", {
            params: { estado: "activo" },
        });
        expect(screen.getByText("12 und.")).toBeInTheDocument();
        expect(
            screen.getByText(`$${(20000).toLocaleString()}`)
        ).toBeInTheDocument();
        expect(screen.getByText("40%")).toBeInTheDocument();

        fireEvent.change(screen.getAllByRole("combobox")[0], {
            target: { value: "todos" },
        });

        expect(await screen.findByText("Camiseta descontinuada")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/inventario", {
            params: { estado: "todos" },
        });
        expect(screen.getByText("Sudadera")).toBeInTheDocument();
    });

    it("crea un producto convirtiendo costo, precio y stock antes de enviarlos", async () => {
        render(<InventarioAdmin />);
        await screen.findByText("Sudadera");

        fireEvent.click(screen.getByRole("button", { name: "+ Nuevo Producto" }));

        fireEvent.change(screen.getByRole("textbox"), {
            target: { value: "Kit de útiles" },
        });
        const [costo, precioVenta, stock] = screen.getAllByRole("spinbutton");
        fireEvent.change(costo, { target: { value: "15000.50" } });
        fireEvent.change(precioVenta, { target: { value: "25000.75" } });
        fireEvent.change(stock, { target: { value: "20" } });

        fireEvent.click(screen.getByRole("button", { name: "Guardar Producto" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/inventario", {
                nombre: "Kit de útiles",
                costo: 15000.5,
                precio_venta: 25000.75,
                stock_actual: 20,
                estado: "activo",
            });
        });
        expect(swalFireMock).toHaveBeenCalledWith(opcionesVentanaExito({ title: "Éxito", text: "Producto creado" }));
        await waitFor(() => {
            expect(
                screen.queryByRole("button", { name: "Guardar Producto" })
            ).not.toBeInTheDocument();
        });
    });

    it("edita un producto existente conservando su ruta y su estado", async () => {
        render(<InventarioAdmin />);
        await screen.findByText("Sudadera");

        fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
        expect(screen.getByDisplayValue("Sudadera")).toBeInTheDocument();

        fireEvent.change(screen.getAllByRole("spinbutton")[0], {
            target: { value: "31000" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Actualizar Producto" }));

        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/inventario/1", {
                nombre: "Sudadera",
                costo: 31000,
                precio_venta: 50000,
                stock_actual: 12,
                estado: "activo",
            });
        });
        expect(swalFireMock).toHaveBeenCalledWith(opcionesVentanaExito({ title: "Éxito", text: "Producto actualizado" }));
    });

    it("cambia el estado de un producto y lo retira de la lista filtrada sin recargar", async () => {
        render(<InventarioAdmin />);
        await screen.findByText("Sudadera");
        expect(apiMock.get).toHaveBeenCalledTimes(1);

        fireEvent.change(screen.getAllByRole("combobox")[1], {
            target: { value: "inactivo" },
        });

        await waitFor(() => {
            expect(apiMock.patch).toHaveBeenCalledWith("/inventario/1/estado", {
                estado: "inactivo",
            });
        });
        await waitFor(() => {
            expect(screen.queryByText("Sudadera")).not.toBeInTheDocument();
        });
        expect(screen.getByText("Cuaderno")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(1);
        expect(swalFireMock).toHaveBeenCalledWith(opcionesVentanaExito({ title: "Listo", text: "Producto inactivo" }));
    });
});
