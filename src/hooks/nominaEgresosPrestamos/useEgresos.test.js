import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import useEgresos from "./useEgresos";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { obtenerEgresos: vi.fn() },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const egresos = [
    { id: 10, concepto: "Papelería", monto: 150.5, origen: "manual" },
    { id: 11, concepto: "Pago de Nómina", monto: 1200, origen: "nomina" },
];

const montarCargado = async () => {
    const hook = renderHook(() => useEgresos());
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    return hook;
};

describe("useEgresos", () => {
    beforeEach(() => {
        serviceMock.obtenerEgresos.mockResolvedValue(egresos);
    });

    it("consulta solo el día actual al montar, con desde igual a hasta", async () => {
        const { result } = renderHook(() => useEgresos());

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.egresos).toEqual(egresos);
        expect(result.current.total).toBe(1350.5);
        expect(result.current.error).toBeNull();
        expect(serviceMock.obtenerEgresos).toHaveBeenCalledTimes(1);

        const params = serviceMock.obtenerEgresos.mock.calls[0][0];
        expect(params.fecha_desde).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(params.fecha_hasta).toBe(params.fecha_desde);
        expect(result.current.fechaDesde).toBe(params.fecha_desde);
        expect(result.current.fechaHasta).toBe(params.fecha_desde);
    });

    it("protege la lista cuando el backend no devuelve un arreglo", async () => {
        serviceMock.obtenerEgresos.mockResolvedValueOnce({ detail: "error" });

        const { result } = await montarCargado();

        expect(result.current.egresos).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it("consulta el rango vigente al buscar por fechas", async () => {
        const { result } = await montarCargado();

        act(() => {
            result.current.setFechaDesde("2026-08-01");
            result.current.setFechaHasta("2026-08-10");
        });
        await act(async () => {
            await result.current.buscarPorFechas();
        });

        expect(serviceMock.obtenerEgresos).toHaveBeenLastCalledWith({
            fecha_desde: "2026-08-01",
            fecha_hasta: "2026-08-10",
        });
        expect(serviceMock.obtenerEgresos).toHaveBeenCalledTimes(2);
    });

    it("rechaza un rango invertido sin consultar al backend", async () => {
        const { result } = await montarCargado();

        act(() => {
            result.current.setFechaDesde("2026-08-10");
            result.current.setFechaHasta("2026-08-01");
        });
        act(() => {
            result.current.buscarPorFechas();
        });

        expect(Swal.fire).toHaveBeenCalledWith({
            icon: "warning",
            title: "Revisa las fechas",
            text: "La fecha desde no puede ser mayor que la fecha hasta.",
        });
        expect(serviceMock.obtenerEgresos).toHaveBeenCalledTimes(1);
    });

    it("al recargar el mismo rango no esconde la tabla: avisa que actualiza", async () => {
        const { result } = await montarCargado();
        expect(result.current.actualizando).toBe(false);

        let terminar;
        serviceMock.obtenerEgresos.mockReturnValueOnce(
            new Promise((resolve) => {
                terminar = () => resolve(egresos);
            })
        );
        let recarga;
        act(() => {
            recarga = result.current.recargarRangoVigente();
        });

        expect(result.current.actualizando).toBe(true);
        expect(result.current.loading).toBe(false);
        expect(result.current.egresos).toEqual(egresos);

        await act(async () => {
            terminar();
            await recarga;
        });

        expect(result.current.actualizando).toBe(false);
    });

    it("al consultar otro rango sí muestra la carga, porque la lista es otra", async () => {
        const { result } = await montarCargado();

        let terminar;
        serviceMock.obtenerEgresos.mockReturnValueOnce(
            new Promise((resolve) => {
                terminar = () => resolve([]);
            })
        );
        let consulta;
        act(() => {
            consulta = result.current.mostrarRangoDeUnDia("2026-08-01");
        });

        expect(result.current.loading).toBe(true);
        expect(result.current.actualizando).toBe(false);

        await act(async () => {
            terminar();
            await consulta;
        });
    });

    it("mueve el filtro al día indicado y lo consulta", async () => {
        const { result } = await montarCargado();

        await act(async () => {
            await result.current.mostrarRangoDeUnDia("2026-08-01");
        });

        expect(result.current.fechaDesde).toBe("2026-08-01");
        expect(result.current.fechaHasta).toBe("2026-08-01");
        expect(serviceMock.obtenerEgresos).toHaveBeenLastCalledWith({
            fecha_desde: "2026-08-01",
            fecha_hasta: "2026-08-01",
        });
    });

    it("el botón Hoy vuelve al día actual", async () => {
        const { result } = await montarCargado();
        const paramsIniciales = serviceMock.obtenerEgresos.mock.calls[0][0];

        await act(async () => {
            await result.current.mostrarRangoDeUnDia("2026-08-01");
        });
        await act(async () => {
            await result.current.filtrarHoy();
        });

        expect(result.current.fechaDesde).toBe(paramsIniciales.fecha_desde);
        expect(serviceMock.obtenerEgresos).toHaveBeenLastCalledWith(paramsIniciales);
        expect(serviceMock.obtenerEgresos).toHaveBeenCalledTimes(3);
    });

    it("recarga el rango vigente sin cambiarlo", async () => {
        const { result } = await montarCargado();

        act(() => {
            result.current.setFechaDesde("2026-08-01");
            result.current.setFechaHasta("2026-08-10");
        });
        await act(async () => {
            await result.current.recargarRangoVigente();
        });

        expect(result.current.fechaDesde).toBe("2026-08-01");
        expect(result.current.fechaHasta).toBe("2026-08-10");
        expect(serviceMock.obtenerEgresos).toHaveBeenLastCalledWith({
            fecha_desde: "2026-08-01",
            fecha_hasta: "2026-08-10",
        });
    });

    it("publica el error de carga y deja de mostrar el indicador", async () => {
        const error = new Error("fallo");
        serviceMock.obtenerEgresos.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useEgresos());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe("Error al cargar los egresos.");
        expect(result.current.egresos).toEqual([]);
        expect(consoleError).toHaveBeenCalledWith(error);
        consoleError.mockRestore();
    });
});
