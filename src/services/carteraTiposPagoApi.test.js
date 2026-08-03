import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../utils/api";
import {
    actualizarConfiguracionTipoPago,
    actualizarCursosTipoPago,
    actualizarTipoPago,
    crearTipoPago,
    obtenerCursosParaTiposPago,
    obtenerDetalleCarteraVencida,
    obtenerDetalleTipoPago,
    obtenerResumenCarteraVencida,
    obtenerTiposPago,
    obtenerTiposPagoDetallados,
} from "./carteraTiposPagoApi";

vi.mock("../utils/api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

describe("carteraTiposPagoApi", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        api.put.mockReset();
    });

    it("consulta los contratos de cartera y devuelve sus datos", async () => {
        const resumen = { total_deuda: 250000 };
        const detalle = [{ estudiante_id: 1, total: 250000 }];
        api.get
            .mockResolvedValueOnce({ data: resumen })
            .mockResolvedValueOnce({ data: detalle });

        await expect(obtenerResumenCarteraVencida()).resolves.toBe(resumen);
        await expect(obtenerDetalleCarteraVencida()).resolves.toBe(detalle);

        expect(api.get).toHaveBeenNthCalledWith(1, "/cartera/mora/resumen");
        expect(api.get).toHaveBeenNthCalledWith(2, "/cartera/mora");
    });

    it("consulta listados, cursos y detalle de tipos de pago", async () => {
        const detallados = [{ id: 1, nombre: "Matrícula", cursos: [] }];
        const basicos = [{ id: 1, nombre: "Matrícula" }];
        const cursos = [{ id: 10, nombre: "5A" }];
        const detalle = { id: 1, tipo_cobro: "mensual" };
        api.get
            .mockResolvedValueOnce({ data: detallados })
            .mockResolvedValueOnce({ data: basicos })
            .mockResolvedValueOnce({ data: cursos })
            .mockResolvedValueOnce({ data: detalle });

        await expect(obtenerTiposPagoDetallados()).resolves.toBe(detallados);
        await expect(obtenerTiposPago()).resolves.toBe(basicos);
        await expect(obtenerCursosParaTiposPago()).resolves.toBe(cursos);
        await expect(obtenerDetalleTipoPago(1)).resolves.toBe(detalle);

        expect(api.get).toHaveBeenNthCalledWith(1, "/tipos-pagos/detallado");
        expect(api.get).toHaveBeenNthCalledWith(2, "/tipos-pagos");
        expect(api.get).toHaveBeenNthCalledWith(3, "/cursos");
        expect(api.get).toHaveBeenNthCalledWith(4, "/tipos-pagos/1/detalle");
    });

    it("crea y actualiza el contrato básico conservando estado y datos HTTP", async () => {
        const payload = { nombre: "Transporte", valor: 125000 };
        api.post.mockResolvedValue({ status: 201, data: { id: 8, ...payload } });
        api.put.mockResolvedValue({ status: 200, data: { id: 8, ...payload } });

        await expect(crearTipoPago(payload)).resolves.toEqual({
            status: 201,
            data: { id: 8, ...payload },
        });
        await expect(actualizarTipoPago(8, payload)).resolves.toEqual({
            status: 200,
            data: { id: 8, ...payload },
        });

        expect(api.post).toHaveBeenCalledWith("/tipos-pagos", payload);
        expect(api.put).toHaveBeenCalledWith("/tipos-pagos/8", payload);
    });

    it("actualiza configuración y cursos con los payloads recibidos", async () => {
        const configuracion = { tipo_cobro: "mensual", activo: true };
        const asignacion = {
            cursos: [{ curso_id: 10, valor: 350000, activo: true }],
        };
        api.put
            .mockResolvedValueOnce({ data: { ok: true } })
            .mockResolvedValueOnce({ data: { actualizados: 1 } });

        await expect(actualizarConfiguracionTipoPago(3, configuracion)).resolves.toEqual({
            ok: true,
        });
        await expect(actualizarCursosTipoPago(3, asignacion)).resolves.toEqual({
            actualizados: 1,
        });

        expect(api.put).toHaveBeenNthCalledWith(
            1,
            "/tipos-pagos/3/configuracion",
            configuracion
        );
        expect(api.put).toHaveBeenNthCalledWith(2, "/tipos-pagos/3/cursos", asignacion);
    });

    it("propaga sin reinterpretar los errores del transporte", async () => {
        const error = new Error("Sin conexión");
        api.get.mockRejectedValue(error);

        await expect(obtenerResumenCarteraVencida()).rejects.toBe(error);
    });
});
