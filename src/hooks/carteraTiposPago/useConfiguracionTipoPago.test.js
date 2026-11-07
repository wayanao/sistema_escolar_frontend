import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useConfiguracionTipoPago from "./useConfiguracionTipoPago";
import { opcionesVentanaExito } from "../ventanaExito";

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
    mes_final: "11",
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
            mes_final: 11,
            frecuencia_meses: 1,
            generacion_automatica: true,
            activo: true,
        };
        expect(actualizarConfiguracionMock).toHaveBeenCalledWith(1, payload);
        expect(actualizarDetalle).toHaveBeenCalledWith(payload);
        expect(cargarTiposPagos).toHaveBeenCalledTimes(1);
        expect(swalFireMock).toHaveBeenCalledWith(opcionesVentanaExito({ title: "Guardado", text: "Configuración actualizada" }));
        expect(result.current.guardandoConfig).toBe(false);
    });

    it("marca los cambios sin guardar y los limpia al guardar o al volver a cargar el concepto", async () => {
        const { result } = renderHook(() =>
            useConfiguracionTipoPago({
                selectedTipoId: 1,
                detalle,
                cargarTiposPagos,
                actualizarDetalle,
            })
        );
        act(() => result.current.inicializarConfiguracion(detalle));
        expect(result.current.configSinGuardar).toBe(false);

        act(() => result.current.handleConfigChange("dias_gracia", "5"));
        expect(result.current.configSinGuardar).toBe(true);

        await act(async () => result.current.guardarConfiguracion());
        expect(result.current.configSinGuardar).toBe(false);

        act(() => result.current.handleConfigChange("dias_gracia", "7"));
        act(() => result.current.inicializarConfiguracion(detalle));
        expect(result.current.configSinGuardar).toBe(false);
    });

    it("si falla el guardado, los cambios siguen marcados como sin guardar", async () => {
        actualizarConfiguracionMock.mockRejectedValueOnce({ response: { status: 500, data: {} } });
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
        act(() => result.current.handleConfigChange("dias_gracia", "5"));

        await act(async () => result.current.guardarConfiguracion());

        expect(result.current.configSinGuardar).toBe(true);
        consoleError.mockRestore();
    });

    it("no envía un mes final anterior al mes inicial", async () => {
        const { result } = renderHook(() =>
            useConfiguracionTipoPago({
                selectedTipoId: 1,
                detalle,
                cargarTiposPagos,
                actualizarDetalle,
            })
        );
        act(() => result.current.inicializarConfiguracion(detalle));
        act(() => result.current.handleConfigChange("mes_final", "1"));

        await act(async () => result.current.guardarConfiguracion());

        expect(actualizarConfiguracionMock).not.toHaveBeenCalled();
        expect(swalFireMock).toHaveBeenCalledWith(
            "Configuración inválida",
            "El mes final no puede ser anterior al mes inicial.",
            "warning"
        );
    });

    it("no amplía el calendario al mover el mes inicial después del mes final", async () => {
        const { result } = renderHook(() =>
            useConfiguracionTipoPago({
                selectedTipoId: 1,
                detalle,
                cargarTiposPagos,
                actualizarDetalle,
            })
        );
        act(() => result.current.inicializarConfiguracion(detalle));
        act(() => result.current.handleConfigChange("mes_inicial", "12"));

        expect(result.current.config.mes_final).toBe(11);

        await act(async () => result.current.guardarConfiguracion());

        expect(actualizarConfiguracionMock).not.toHaveBeenCalled();
        expect(swalFireMock).toHaveBeenCalledWith(
            "Configuración inválida",
            "El mes final no puede ser anterior al mes inicial.",
            "warning"
        );
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

    it("el 409 de año cerrado sale con su título y sin comando de consola (año lectivo, paso 6.9)", async () => {
        const mensaje = "El año lectivo 2026 está cerrado. Solo se puede consultar.";
        actualizarConfiguracionMock.mockRejectedValue({
            response: { status: 409, data: { detail: mensaje } },
        });
        vi.spyOn(console, "error").mockImplementation(() => {});
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

        expect(swalFireMock).toHaveBeenLastCalledWith("Año cerrado", mensaje, "warning");
        expect(swalFireMock).not.toHaveBeenCalledWith(
            expect.objectContaining({ title: "Migración pendiente" })
        );
        expect(result.current.guardandoConfig).toBe(false);
    });
});
