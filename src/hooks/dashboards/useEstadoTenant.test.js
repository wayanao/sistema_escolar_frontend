import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useEstadoTenant from "./useEstadoTenant";
import { opcionesVentanaExito } from "../ventanaExito";

const { serviceMock, swalFireMock } = vi.hoisted(() => ({
    serviceMock: {
        actualizarEstadoTenant: vi.fn(),
        obtenerAuditoriaEstadoTenant: vi.fn(),
    },
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const tenantActivo = { id: 1, nombre: "Colegio Uno", estado: "activo" };
const tenantEnMora = { id: 2, nombre: "Colegio Dos", estado: "en_mora", estado_manual: "activo" };

const reemplazarTenant = vi.fn();

describe("useEstadoTenant", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        reemplazarTenant.mockClear();
        swalFireMock.mockResolvedValue({ isConfirmed: false });
        serviceMock.actualizarEstadoTenant.mockResolvedValue({ ...tenantActivo, estado: "suspendido" });
        serviceMock.obtenerAuditoriaEstadoTenant.mockResolvedValue([]);
    });

    it("no pide confirmación cuando el estado elegido es el manual vigente", async () => {
        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.cambiarEstado(tenantActivo, "activo");
        await result.current.cambiarEstado(tenantEnMora, "activo");

        expect(swalFireMock).not.toHaveBeenCalled();
        expect(serviceMock.actualizarEstadoTenant).not.toHaveBeenCalled();
    });

    it("exige motivo para los estados críticos", async () => {
        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.cambiarEstado(tenantActivo, "suspendido");

        const confirmacion = swalFireMock.mock.calls[0][0];
        expect(confirmacion.icon).toBe("warning");
        expect(confirmacion.title).toBe("Cambiar a suspendido");
        expect(confirmacion.text).toBe("Colegio Uno pasara de activo a suspendido.");
        expect(confirmacion.inputLabel).toBe("Motivo obligatorio");
        expect(confirmacion.confirmButtonColor).toBe("#dc2626");
        expect(confirmacion.inputValidator("   ")).toBe(
            "Escribe el motivo para suspender o cancelar.",
        );
    });

    it("deja el motivo opcional en los estados no críticos", async () => {
        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.cambiarEstado(tenantActivo, "en_mora");

        const confirmacion = swalFireMock.mock.calls[0][0];
        expect(confirmacion.icon).toBe("question");
        expect(confirmacion.inputLabel).toBe("Motivo opcional");
        expect(confirmacion.confirmButtonColor).toBe("#059669");
        expect(confirmacion.inputValidator("")).toBeUndefined();
    });

    it("guarda el cambio con el motivo recortado y reemplaza la fila", async () => {
        const actualizado = { ...tenantActivo, estado: "suspendido" };
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: "  Pago vencido  " });
        serviceMock.actualizarEstadoTenant.mockResolvedValue(actualizado);

        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.cambiarEstado(tenantActivo, "suspendido");

        expect(serviceMock.actualizarEstadoTenant).toHaveBeenCalledWith(1, {
            estado: "suspendido",
            motivo: "Pago vencido",
        });
        expect(reemplazarTenant).toHaveBeenCalledWith(1, actualizado);
        expect(swalFireMock).toHaveBeenLastCalledWith(opcionesVentanaExito({ title: "Estado actualizado", text: "Colegio Uno quedó en suspendido." }));
        await waitFor(() => expect(result.current.savingId).toBeNull());
    });

    it("no guarda nada cuando se cancela la confirmación", async () => {
        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.cambiarEstado(tenantActivo, "cancelado");

        expect(serviceMock.actualizarEstadoTenant).not.toHaveBeenCalled();
        expect(reemplazarTenant).not.toHaveBeenCalled();
    });

    it("avisa y no toca la lista cuando el cambio falla", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: "Motivo" });
        serviceMock.actualizarEstadoTenant.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.cambiarEstado(tenantActivo, "cancelado");

        expect(reemplazarTenant).not.toHaveBeenCalled();
        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "error",
            title: "No se pudo actualizar",
            text: "Revisa tu sesión o intenta nuevamente.",
        });
        await waitFor(() => expect(result.current.savingId).toBeNull());
    });

    it("avisa cuando el tenant no tiene historial", async () => {
        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.verHistorial(tenantActivo);

        expect(serviceMock.obtenerAuditoriaEstadoTenant).toHaveBeenCalledWith(1);
        expect(swalFireMock).toHaveBeenCalledWith({
            icon: "info",
            title: "Sin historial",
            text: "Colegio Uno todavía no tiene cambios de estado registrados.",
        });
    });

    it("pinta el historial escapando su contenido", async () => {
        serviceMock.obtenerAuditoriaEstadoTenant.mockResolvedValue([
            {
                creado_en: null,
                estado_anterior: "activo",
                estado_nuevo: "suspendido",
                motivo: "<script>alerta()</script>",
                super_admin_nombre: "Soporte & Cia",
            },
        ]);

        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.verHistorial(tenantActivo);

        const dialogo = swalFireMock.mock.calls.at(-1)[0];
        expect(dialogo.title).toBe("Historial de Colegio Uno");
        expect(dialogo.html).toContain("&lt;script&gt;alerta()&lt;/script&gt;");
        expect(dialogo.html).not.toContain("<script>");
        expect(dialogo.html).toContain("Soporte &amp; Cia");
    });

    it("avisa cuando el historial no se puede cargar", async () => {
        serviceMock.obtenerAuditoriaEstadoTenant.mockRejectedValue(new Error("500"));

        const { result } = renderHook(() => useEstadoTenant(reemplazarTenant));

        await result.current.verHistorial(tenantActivo);

        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "error",
            title: "No se pudo cargar",
            text: "Intenta nuevamente.",
        });
    });
});
