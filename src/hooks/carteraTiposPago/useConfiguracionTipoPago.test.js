import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useConfiguracionTipoPago from "./useConfiguracionTipoPago";

const { actualizarConfiguracionMock, swalFireMock } = vi.hoisted(() => ({
    actualizarConfiguracionMock: vi.fn(),
    swalFireMock: vi.fn(),
}));

vi.mock("../../services/carteraTiposPagoApi", () => ({
    actualizarConfiguracionTipoPago: actualizarConfiguracionMock,
}));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const detalle = {
    id: 1,
    activo: true,
    descripcion: "  Cobro ordinario  ",
    tipo_cobro: "mensual",
    fecha_limite: "",
    dia_limite_mes: "10",
    dias_gracia: "3",
    mora_tipo: "porcentaje",
    mora_valor: "2.5",
    mes_inicial: "2",
    frecuencia_meses: "1",
    generacion_automatica: 1,
};

describe("useConfiguracionTipoPago", () => {
    const cargarTiposPagos = vi.fn();
    const actualizarDetalle = vi.fn();

    beforeEach(() => {
        actualizarConfiguracionMock.mockResolvedValue({ ok: true });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
        cargarTiposPagos.mockReset();
        actualizarDetalle.mockReset();
    });

    it("inicializa, normaliza y guarda la configuración financiera", async () => {
        const { result } = renderHook(() =>
            useConfiguracionTipoPago({
                selectedTipoId: 1,
                detalle,
                cargarTiposPagos,
                actualizarDetalle,
            })
        );

        act(() => result.current.inicializarConfiguracion(detalle));
        await act(async () => result.current.guardarConfiguracion());

        const payload = {
            descripcion: "Cobro ordinario",
            tipo_cobro: "mensual",
            fecha_limite: null,
            dia_limite_mes: 10,
            dias_gracia: 3,
            mora_tipo: "porcentaje",
            mora_valor: 2.5,
            mes_inicial: 2,
            frecuencia_meses: 1,
            generacion_automatica: true,
            activo: true,
        };
        expect(actualizarConfiguracionMock).toHaveBeenCalledWith(1, payload);
        expect(actualizarDetalle).toHaveBeenCalledWith(payload);
        expect(cargarTiposPagos).toHaveBeenCalledTimes(1);
        expect(swalFireMock).toHaveBeenCalledWith(
            "Guardado",
            "Configuración actualizada",
            "success"
        );
        expect(result.current.guardandoConfig).toBe(false);
    });

    it("respeta la cancelación al desactivar un concepto", async () => {
        swalFireMock.mockResolvedValue({ isConfirmed: false });
        const { result } = renderHook(() =>
            useConfiguracionTipoPago({
                selectedTipoId: 1,
                detalle,
                cargarTiposPagos,
                actualizarDetalle,
            })
        );
        act(() => {
            result.current.inicializarConfiguracion(detalle);
            result.current.handleConfigChange("activo", false);
        });

        await act(async () => result.current.guardarConfiguracion());

        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Desactivar concepto",
                confirmButtonText: "Desactivar",
            })
        );
        expect(actualizarConfiguracionMock).not.toHaveBeenCalled();
    });

    it("conserva el aviso de migración pendiente para conflictos", async () => {
        const error = { response: { status: 409, data: { detail: "Falta una columna" } } };
        actualizarConfiguracionMock.mockRejectedValue(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderHook(() =>
            useConfiguracionTipoPago({
                selectedTipoId: 1,
                detalle,
                cargarTiposPagos,
                actualizarDetalle,
            })
        );
        act(() => result.current.inicializarConfiguracion(detalle));

        await act(async () => result.current.guardarConfiguracion());

        expect(consoleError).toHaveBeenCalledWith(error);
        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "warning",
                title: "Migración pendiente",
                html: expect.stringContaining("Falta una columna"),
            })
        );
        expect(result.current.guardandoConfig).toBe(false);
    });
});
