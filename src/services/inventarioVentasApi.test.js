import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../utils/api";
import {
    actualizarEstadoProductoInventario,
    actualizarProductoInventario,
    anularVenta,
    crearProductoInventario,
    obtenerEstudiantesParaVentas,
    obtenerInventario,
    obtenerVentas,
    registrarVenta,
} from "./inventarioVentasApi";

vi.mock("../utils/api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
    },
}));

describe("inventarioVentasApi", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        api.put.mockReset();
        api.patch.mockReset();
    });

    it("consulta el inventario por estado y devuelve sus datos", async () => {
        const productos = [{ id: 1, nombre: "Sudadera" }];
        api.get.mockResolvedValue({ data: productos });

        await expect(obtenerInventario("todos")).resolves.toBe(productos);

        expect(api.get).toHaveBeenCalledWith("/inventario", {
            params: { estado: "todos" },
        });
    });

    it("crea y actualiza productos devolviendo estado HTTP y datos", async () => {
        const payload = {
            nombre: "Sudadera",
            costo: 30000,
            precio_venta: 50000,
            stock_actual: 12,
            estado: "activo",
        };
        api.post.mockResolvedValue({ status: 201, data: { id: 9 } });
        api.put.mockResolvedValue({ status: 200, data: { mensaje: "ok" } });

        await expect(crearProductoInventario(payload)).resolves.toEqual({
            status: 201,
            data: { id: 9 },
        });
        await expect(actualizarProductoInventario(4, payload)).resolves.toEqual({
            status: 200,
            data: { mensaje: "ok" },
        });

        expect(api.post).toHaveBeenCalledWith("/inventario", payload);
        expect(api.put).toHaveBeenCalledWith("/inventario/4", payload);
    });

    it("cambia el estado de un producto enviando solo el estado", async () => {
        api.patch.mockResolvedValue({ status: 200, data: { estado: "inactivo" } });

        await expect(
            actualizarEstadoProductoInventario(4, "inactivo")
        ).resolves.toEqual({ status: 200, data: { estado: "inactivo" } });

        expect(api.patch).toHaveBeenCalledWith("/inventario/4/estado", {
            estado: "inactivo",
        });
    });

    it("consulta ventas y estudiantes en sus rutas actuales", async () => {
        const ventas = [{ id: 501 }];
        const estudiantes = [{ id: 7 }];
        api.get.mockResolvedValueOnce({ data: ventas }).mockResolvedValueOnce({
            data: estudiantes,
        });

        await expect(obtenerVentas()).resolves.toBe(ventas);
        await expect(obtenerEstudiantesParaVentas()).resolves.toBe(estudiantes);

        expect(api.get).toHaveBeenNthCalledWith(1, "/api/ventas/");
        expect(api.get).toHaveBeenNthCalledWith(2, "/estudiantes");
    });

    it("registra y anula ventas devolviendo los datos del backend", async () => {
        const payload = { estudiante_id: 7, tipo_venta: "Credito", detalles: [] };
        api.post
            .mockResolvedValueOnce({ data: { id: 901 } })
            .mockResolvedValueOnce({ data: { mensaje: "anulada" } });

        await expect(registrarVenta(payload)).resolves.toEqual({ id: 901 });
        await expect(
            anularVenta(901, { motivo: "Cargo equivocado" })
        ).resolves.toEqual({ mensaje: "anulada" });

        expect(api.post).toHaveBeenNthCalledWith(1, "/api/ventas/", payload);
        expect(api.post).toHaveBeenNthCalledWith(2, "/api/ventas/901/anular", {
            motivo: "Cargo equivocado",
        });
    });

    it("propaga los errores sin transformarlos ni decidir mensajes", async () => {
        const error = Object.assign(new Error("Request failed"), {
            response: { status: 400, data: { detail: "La venta ya está anulada" } },
        });
        api.get.mockRejectedValue(error);
        api.post.mockRejectedValue(error);

        await expect(obtenerInventario("activo")).rejects.toBe(error);
        await expect(anularVenta(901, { motivo: "x" })).rejects.toBe(error);
    });
});
