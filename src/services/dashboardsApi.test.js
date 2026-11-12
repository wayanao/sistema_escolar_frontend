import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../utils/api";
import {
    actualizarEstadoTenant,
    crearTenant,
    listarTenants,
    obtenerAuditoriaEstadoTenant,
    obtenerClasesProfesor,
    obtenerCumpleanosAdmin,
    obtenerCumpleanosProfesor,
    obtenerInasistenciasProfesor,
    obtenerNotasAltasProfesor,
    obtenerNotasBajasProfesor,
    obtenerPuntualidadParaDashboard,
    obtenerRankingBajoRendimiento,
    obtenerRankingMejorRendimiento,
    obtenerResumenCarteraParaDashboard,
    registrarPagoTenant,
} from "./dashboardsApi";

vi.mock("../utils/api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
    },
}));

describe("dashboardsApi", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        api.patch.mockReset();
    });

    it("consulta el resumen de cartera y los cumpleaños del panel de admin", async () => {
        const resumen = { total_estudiantes: 3, total_deuda: 1250000 };
        const cumpleanos = [{ estudiante_id: 5 }];
        api.get.mockResolvedValueOnce({ data: resumen }).mockResolvedValueOnce({ data: cumpleanos });

        await expect(obtenerResumenCarteraParaDashboard()).resolves.toBe(resumen);
        await expect(obtenerCumpleanosAdmin({ dias: 7 })).resolves.toBe(cumpleanos);

        expect(api.get).toHaveBeenNthCalledWith(1, "/cartera/mora/resumen");
        expect(api.get).toHaveBeenNthCalledWith(2, "/dashboard/cumpleanos/admin", {
            params: { dias: 7 },
        });
    });

    it("consulta quién paga a tiempo para el panel de admin, sin parámetros", async () => {
        const puntualidad = { total_estudiantes: 3, siempre_a_tiempo: 2, mejores: [], cursos: [] };
        api.get.mockResolvedValueOnce({ data: puntualidad });

        await expect(obtenerPuntualidadParaDashboard()).resolves.toBe(puntualidad);

        expect(api.get).toHaveBeenCalledWith("/cartera/puntualidad");
        expect(api.get.mock.calls[0]).toHaveLength(1);
    });

    it("consulta clases, inasistencias y cumpleaños del profesor", async () => {
        const clases = [{ id: 10 }];
        const inasistencias = [{ estudiante_id: 1 }];
        const cumpleanos = [{ estudiante_id: 5 }];
        api.get
            .mockResolvedValueOnce({ data: clases })
            .mockResolvedValueOnce({ data: inasistencias })
            .mockResolvedValueOnce({ data: cumpleanos });

        await expect(obtenerClasesProfesor(7)).resolves.toBe(clases);
        await expect(obtenerInasistenciasProfesor(7)).resolves.toBe(inasistencias);
        await expect(obtenerCumpleanosProfesor(7, { dias: 7 })).resolves.toBe(cumpleanos);

        expect(api.get).toHaveBeenNthCalledWith(1, "/mis-clases/7");
        expect(api.get).toHaveBeenNthCalledWith(2, "/dashboard/inasistencias/7");
        expect(api.get).toHaveBeenNthCalledWith(3, "/dashboard/cumpleanos/profesor/7", {
            params: { dias: 7 },
        });
    });

    it("consulta el rendimiento con los parámetros del filtro", async () => {
        const bajas = [{ nombre: "Ana" }];
        const altas = [{ nombre: "Zoe" }];
        api.get.mockResolvedValueOnce({ data: bajas }).mockResolvedValueOnce({ data: altas });

        const params = { curso_id: "100", asignacion_id: "10" };
        await expect(obtenerNotasBajasProfesor(7, params)).resolves.toBe(bajas);
        await expect(obtenerNotasAltasProfesor(7, params)).resolves.toBe(altas);

        expect(api.get).toHaveBeenNthCalledWith(1, "/dashboard/notas-bajas/7", { params });
        expect(api.get).toHaveBeenNthCalledWith(2, "/dashboard/notas-altas/7", { params });
    });

    it("consulta los dos rankings por asignación y período", async () => {
        const bajo = [{ id: 11 }];
        const mejor = [{ id: 12 }];
        api.get.mockResolvedValueOnce({ data: bajo }).mockResolvedValueOnce({ data: mejor });

        await expect(obtenerRankingBajoRendimiento("44", "3")).resolves.toBe(bajo);
        await expect(obtenerRankingMejorRendimiento("44", "3")).resolves.toBe(mejor);

        expect(api.get).toHaveBeenNthCalledWith(1, "/dashboard/ranking/44/3");
        expect(api.get).toHaveBeenNthCalledWith(2, "/dashboard/ranking-mejor/44/3");
    });

    it("lista, crea y actualiza tenants del super admin", async () => {
        const tenants = [{ id: 1 }];
        const creado = { id: 4, nombre: "Colegio Demo" };
        const actualizado = { id: 1, estado: "suspendido" };
        api.get.mockResolvedValue({ data: tenants });
        api.post.mockResolvedValue({ data: creado });
        api.patch.mockResolvedValue({ data: actualizado });

        const payload = { nombre: "Colegio Demo", codigo: "colegio_demo" };
        await expect(listarTenants()).resolves.toBe(tenants);
        await expect(crearTenant(payload)).resolves.toBe(creado);
        await expect(
            actualizarEstadoTenant(1, { estado: "suspendido", motivo: "Pago vencido" }),
        ).resolves.toBe(actualizado);

        expect(api.get).toHaveBeenCalledWith("/super-admin/tenants");
        expect(api.post).toHaveBeenCalledWith("/super-admin/tenants", payload);
        expect(api.patch).toHaveBeenCalledWith("/super-admin/tenants/1/estado", {
            estado: "suspendido",
            motivo: "Pago vencido",
        });
    });

    it("consulta la auditoría de estados de un tenant", async () => {
        const historial = [{ estado_anterior: "activo", estado_nuevo: "suspendido" }];
        api.get.mockResolvedValue({ data: historial });

        await expect(obtenerAuditoriaEstadoTenant(1)).resolves.toBe(historial);

        expect(api.get).toHaveBeenCalledWith("/super-admin/tenants/1/estado-auditoria");
    });

    it("registra el pago de un tenant", async () => {
        const actualizado = { id: 1, estado: "activo", fecha_proximo_pago: "2026-12-01" };
        api.post.mockResolvedValue({ data: actualizado });
        const payload = { fecha_proximo_pago: "2026-12-01", nota: "Transferencia" };

        await expect(registrarPagoTenant(1, payload)).resolves.toBe(actualizado);

        expect(api.post).toHaveBeenCalledWith("/super-admin/tenants/1/pagos", payload);
    });

    it("propaga el error de Axios sin decidir mensajes", async () => {
        const error = { response: { data: { detail: "El codigo ya existe." } } };
        api.post.mockRejectedValue(error);
        api.get.mockRejectedValue(new Error("500"));

        await expect(crearTenant({})).rejects.toBe(error);
        await expect(listarTenants()).rejects.toThrow("500");
    });
});
