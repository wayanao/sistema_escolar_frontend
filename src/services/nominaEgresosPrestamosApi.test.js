import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../utils/api";
import {
    actualizarEgreso,
    actualizarEstadoPrestamo,
    crearEgreso,
    crearPrestamo,
    obtenerEgresos,
    obtenerEmpleadosNomina,
    obtenerHistorialNomina,
    obtenerPrestamos,
    obtenerProfesoresParaPrestamos,
    registrarPagoNomina,
} from "./nominaEgresosPrestamosApi";

vi.mock("../utils/api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

describe("nominaEgresosPrestamosApi", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        api.put.mockReset();
    });

    it("consulta empleados e historial de nómina en sus rutas actuales", async () => {
        const empleados = [{ id: 1, saldo_prestamos: 400 }];
        const historial = [{ id: 55, profesor: "Pérez Ana" }];
        api.get
            .mockResolvedValueOnce({ data: empleados })
            .mockResolvedValueOnce({ data: historial });

        await expect(obtenerEmpleadosNomina()).resolves.toBe(empleados);
        await expect(obtenerHistorialNomina()).resolves.toBe(historial);

        expect(api.get).toHaveBeenNthCalledWith(1, "/api/nomina/empleados");
        expect(api.get).toHaveBeenNthCalledWith(2, "/api/nomina/historial");
    });

    it("registra el pago de nómina con el payload recibido", async () => {
        const payload = {
            profesor_id: 1,
            salario_base: 1500,
            deduccion_prestamos: 50,
            otros_descuentos: 25,
            bonificaciones: 100,
            notas: "Marzo 2026",
        };
        api.post.mockResolvedValue({ data: { nomina_id: 77 } });

        await expect(registrarPagoNomina(payload)).resolves.toEqual({ nomina_id: 77 });

        expect(api.post).toHaveBeenCalledWith("/api/nomina/pagar", payload);
    });

    it("consulta los egresos del rango recibido", async () => {
        const egresos = [{ id: 10, monto: 150.5 }];
        api.get.mockResolvedValue({ data: egresos });

        await expect(
            obtenerEgresos({ fecha_desde: "2026-08-01", fecha_hasta: "2026-08-10" })
        ).resolves.toBe(egresos);

        expect(api.get).toHaveBeenCalledWith("/api/egresos/", {
            params: { fecha_desde: "2026-08-01", fecha_hasta: "2026-08-10" },
        });
    });

    it("crea y actualiza egresos cambiando solo el método y la ruta", async () => {
        const payload = {
            concepto: "Aseo general",
            monto: 80000,
            fecha: "2026-08-01",
            categoria: "Mantenimiento",
            notas: "",
        };
        api.post.mockResolvedValue({ data: { id: 12 } });
        api.put.mockResolvedValue({ data: { id: 10 } });

        await expect(crearEgreso(payload)).resolves.toEqual({ id: 12 });
        await expect(actualizarEgreso(10, payload)).resolves.toEqual({ id: 10 });

        expect(api.post).toHaveBeenCalledWith("/api/egresos/", payload);
        expect(api.put).toHaveBeenCalledWith("/api/egresos/10", payload);
    });

    it("consulta los préstamos de un profesor y la lista de profesores", async () => {
        const prestamos = [{ id: 90, estado: "Pendiente" }];
        const profesores = [{ id: 3, apellido: "Pérez" }];
        api.get
            .mockResolvedValueOnce({ data: prestamos })
            .mockResolvedValueOnce({ data: profesores });

        await expect(obtenerPrestamos({ profesor_id: "3" })).resolves.toBe(prestamos);
        await expect(obtenerProfesoresParaPrestamos()).resolves.toBe(profesores);

        expect(api.get).toHaveBeenNthCalledWith(1, "/api/prestamos/", {
            params: { profesor_id: "3" },
        });
        expect(api.get).toHaveBeenNthCalledWith(2, "/profesores");
    });

    it("crea préstamos y salda uno enviando solo el estado", async () => {
        const payload = {
            profesor_id: 3,
            monto: 500000,
            fecha: "2026-08-01",
            estado: "Pendiente",
            notas: "",
        };
        api.post.mockResolvedValue({ data: { id: 92 } });
        api.put.mockResolvedValue({ data: { mensaje: "Estado actualizado a Pagado" } });

        await expect(crearPrestamo(payload)).resolves.toEqual({ id: 92 });
        await expect(actualizarEstadoPrestamo(90, "Pagado")).resolves.toEqual({
            mensaje: "Estado actualizado a Pagado",
        });

        expect(api.post).toHaveBeenCalledWith("/api/prestamos/", payload);
        expect(api.put).toHaveBeenCalledWith("/api/prestamos/90/estado", {
            estado: "Pagado",
        });
    });

    it("propaga los errores sin transformarlos ni decidir mensajes", async () => {
        const error = Object.assign(new Error("Request failed"), {
            response: { status: 400, data: { detail: "El monto debe ser mayor que 0." } },
        });
        api.get.mockRejectedValue(error);
        api.post.mockRejectedValue(error);
        api.put.mockRejectedValue(error);

        await expect(obtenerEmpleadosNomina()).rejects.toBe(error);
        await expect(crearEgreso({})).rejects.toBe(error);
        await expect(actualizarEstadoPrestamo(90, "Pagado")).rejects.toBe(error);
    });
});
