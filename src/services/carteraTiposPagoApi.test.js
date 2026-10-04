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

    it("con las opciones del año activo, cada lectura llama a api como siempre", async () => {
        // Los hooks pasan `{}` mirando el año activo (`opcionesConAnio`).
        api.get.mockResolvedValue({ data: [] });

        await obtenerResumenCarteraVencida({});
        await obtenerDetalleCarteraVencida({});
        await obtenerTiposPagoDetallados({});
        await obtenerTiposPago({});
        await obtenerCursosParaTiposPago({});

        expect(api.get.mock.calls).toEqual([
            ["/cartera/mora/resumen"],
            ["/cartera/mora"],
            ["/tipos-pagos/detallado"],
            ["/tipos-pagos"],
            ["/cursos"],
        ]);
        // Un solo argumento, sin un segundo vacío.
        expect(api.get.mock.calls.map((llamada) => llamada.length)).toEqual([1, 1, 1, 1, 1]);
    });

    it("mirando otro año, las cinco lecturas llevan anio_lectivo_id", async () => {
        const parametrosAnio = { anio_lectivo_id: 2 };
        api.get.mockResolvedValue({ data: [] });

        await obtenerResumenCarteraVencida({ parametrosAnio });
        await obtenerDetalleCarteraVencida({ parametrosAnio });
        await obtenerTiposPagoDetallados({ parametrosAnio });
        await obtenerTiposPago({ parametrosAnio });
        await obtenerCursosParaTiposPago({ parametrosAnio });

        const conAnio = { params: { anio_lectivo_id: 2 } };
        expect(api.get.mock.calls).toEqual([
            ["/cartera/mora/resumen", conAnio],
            ["/cartera/mora", conAnio],
            ["/tipos-pagos/detallado", conAnio],
            ["/tipos-pagos", conAnio],
            ["/cursos", conAnio],
        ]);
    });

    it("el detalle de un concepto y lo que se guarda no llevan año: parten de su id", async () => {
        api.get.mockResolvedValue({ data: {} });
        api.put.mockResolvedValue({ status: 200, data: {} });

        await obtenerDetalleTipoPago(4);
        await actualizarTipoPago(4, { nombre: "MATRÍCULA", valor: 1 });
        await actualizarConfiguracionTipoPago(4, { activo: true });
        await actualizarCursosTipoPago(4, { cursos: [] });

        expect(api.get.mock.calls).toEqual([["/tipos-pagos/4/detalle"]]);
        expect(api.put.mock.calls).toEqual([
            ["/tipos-pagos/4", { nombre: "MATRÍCULA", valor: 1 }],
            ["/tipos-pagos/4/configuracion", { activo: true }],
            ["/tipos-pagos/4/cursos", { cursos: [] }],
        ]);
    });

    it("propaga sin reinterpretar los errores del transporte", async () => {
        const error = new Error("Sin conexión");
        api.get.mockRejectedValue(error);

        await expect(obtenerResumenCarteraVencida()).rejects.toBe(error);
    });
});
