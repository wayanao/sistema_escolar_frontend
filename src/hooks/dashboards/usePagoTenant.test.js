import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import usePagoTenant from "./usePagoTenant";

const { serviceMock, swalFireMock, showValidationMessageMock } = vi.hoisted(() => ({
    serviceMock: { registrarPagoTenant: vi.fn() },
    swalFireMock: vi.fn(),
    showValidationMessageMock: vi.fn(),
}));

vi.mock("../../services/dashboardsApi", () => serviceMock);
vi.mock("sweetalert2", () => ({
    default: { fire: swalFireMock, showValidationMessage: showValidationMessageMock },
}));

// Vencido desde mayo: sin mover la fecha, el colegio sigue suspendido.
const tenantVencido = {
    id: 3,
    nombre: "Colegio Tres",
    fecha_proximo_pago: "2026-05-01",
    estado: "suspendido",
    estado_manual: "activo",
};

// El diálogo está simulado, así que la prueba monta los mismos campos que
// SweetAlert pintaría y ejecuta el `preConfirm` capturado.
const ejecutarPreConfirm = ({ fecha, nota = "" }) => {
    const configuracion = swalFireMock.mock.calls.at(-1)[0];
    const campoFecha = document.createElement("input");
    campoFecha.id = "pago-fecha-proximo";
    campoFecha.value = fecha;
    const campoNota = document.createElement("textarea");
    campoNota.id = "pago-nota";
    campoNota.value = nota;
    document.body.append(campoFecha, campoNota);

    try {
        return configuracion.preConfirm();
    } finally {
        campoFecha.remove();
        campoNota.remove();
    }
};

const reemplazarTenant = vi.fn();

describe("usePagoTenant", () => {
    beforeEach(() => {
        // Solo el reloj de fechas: los temporizadores siguen siendo reales.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-10-26T15:00:00Z"));
        vi.spyOn(console, "error").mockImplementation(() => {});
        reemplazarTenant.mockClear();
        showValidationMessageMock.mockClear();
        swalFireMock.mockReset();
        swalFireMock.mockResolvedValue({ isConfirmed: false });
        serviceMock.registrarPagoTenant.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("abre la ventana con la fecha sugerida y el nombre como texto plano", async () => {
        const { result } = renderHook(() => usePagoTenant(reemplazarTenant));

        await result.current.registrarPago(tenantVencido);

        const configuracion = swalFireMock.mock.calls[0][0];
        expect(configuracion.titleText).toBe("Registrar pago de Colegio Tres");
        expect(configuracion.title).toBeUndefined();
        expect(configuracion.confirmButtonText).toBe("Registrar pago");
        // Un mes después de mayo ya pasó: propone un mes después de hoy.
        expect(configuracion.html).toMatch(/id="pago-fecha-proximo"[^>]*value="2026-11-26"/);
        expect(configuracion.html).toContain("<strong>2026-05-01</strong>");
    });

    it("no registra nada cuando se cancela", async () => {
        const { result } = renderHook(() => usePagoTenant(reemplazarTenant));

        await result.current.registrarPago(tenantVencido);

        expect(serviceMock.registrarPagoTenant).not.toHaveBeenCalled();
        expect(reemplazarTenant).not.toHaveBeenCalled();
    });

    it("no deja confirmar una fecha que mantendría el colegio bloqueado", async () => {
        const { result } = renderHook(() => usePagoTenant(reemplazarTenant));
        await result.current.registrarPago(tenantVencido);

        expect(ejecutarPreConfirm({ fecha: "2026-10-26" })).toBe(false);
        expect(showValidationMessageMock).toHaveBeenCalledWith(
            "La fecha debe ser posterior a hoy; si no, el colegio seguirá bloqueado.",
        );
    });

    it("arma el payload en el preConfirm con la nota recortada", async () => {
        const { result } = renderHook(() => usePagoTenant(reemplazarTenant));
        await result.current.registrarPago(tenantVencido);

        expect(ejecutarPreConfirm({ fecha: "2026-11-26", nota: "  Transferencia  " })).toEqual({
            fecha_proximo_pago: "2026-11-26",
            nota: "Transferencia",
        });
        expect(showValidationMessageMock).not.toHaveBeenCalled();
    });

    it("guarda el pago, reemplaza la fila y confirma que quedó activo", async () => {
        const payload = { fecha_proximo_pago: "2026-11-26", nota: "Transferencia" };
        const actualizado = { ...tenantVencido, estado: "activo", fecha_proximo_pago: "2026-11-26" };
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: payload });
        serviceMock.registrarPagoTenant.mockResolvedValue(actualizado);

        const { result } = renderHook(() => usePagoTenant(reemplazarTenant));
        await result.current.registrarPago(tenantVencido);

        expect(serviceMock.registrarPagoTenant).toHaveBeenCalledWith(3, payload);
        expect(reemplazarTenant).toHaveBeenCalledWith(3, actualizado);
        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "success",
            title: "Pago registrado",
            text: "Colegio Tres quedó activo. Próximo pago: 2026-11-26.",
        });
        await waitFor(() => expect(result.current.pagandoId).toBeNull());
    });

    it("avisa cuando el estado manual lo sigue bloqueando", async () => {
        const actualizado = {
            ...tenantVencido,
            estado: "suspendido",
            estado_manual: "suspendido",
            fecha_proximo_pago: "2026-11-26",
        };
        swalFireMock.mockResolvedValueOnce({
            isConfirmed: true,
            value: { fecha_proximo_pago: "2026-11-26", nota: "" },
        });
        serviceMock.registrarPagoTenant.mockResolvedValue(actualizado);

        const { result } = renderHook(() => usePagoTenant(reemplazarTenant));
        await result.current.registrarPago(tenantVencido);

        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "warning",
            title: "Pago registrado",
            text: "Próximo pago: 2026-11-26. Colegio Tres sigue en suspendido por su estado manual: cámbialo a activo en la columna Cambiar.",
        });
    });

    it("muestra el motivo del backend y no toca la lista cuando falla", async () => {
        swalFireMock.mockResolvedValueOnce({
            isConfirmed: true,
            value: { fecha_proximo_pago: "2026-11-26", nota: "" },
        });
        serviceMock.registrarPagoTenant.mockRejectedValue({
            response: { data: { detail: "El colegio no tiene suscripcion registrada" } },
        });

        const { result } = renderHook(() => usePagoTenant(reemplazarTenant));
        await result.current.registrarPago(tenantVencido);

        expect(reemplazarTenant).not.toHaveBeenCalled();
        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "error",
            title: "No se pudo registrar el pago",
            text: "El colegio no tiene suscripcion registrada",
        });
        await waitFor(() => expect(result.current.pagandoId).toBeNull());
    });
});
