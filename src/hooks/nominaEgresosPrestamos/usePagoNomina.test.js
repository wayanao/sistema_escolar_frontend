import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import usePagoNomina from "./usePagoNomina";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { registrarPagoNomina: vi.fn() },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);

const empleado = { id: 1, nombre: "ana", apellido: "pérez", sueldo: 1500, saldo_prestamos: 400 };
const eventoFalso = { preventDefault: vi.fn() };

const montarConModalAbierto = (cargarDatos) => {
    const hook = renderHook(() => usePagoNomina({ cargarDatos }));
    act(() => {
        hook.result.current.abrirPago(empleado);
    });
    return hook;
};

describe("usePagoNomina", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        serviceMock.registrarPagoNomina.mockResolvedValue({ nomina_id: 77 });
    });

    it("abre el modal precargando el sueldo del empleado como salario base", () => {
        const { result } = montarConModalAbierto(vi.fn());

        expect(result.current.modalAbierto).toBe(true);
        expect(result.current.empleadoSeleccionado).toBe(empleado);
        expect(result.current.formulario).toEqual({
            salarioBase: "1500",
            bonificaciones: "0",
            abonoPrestamo: "0",
            otrosDescuentos: "0",
            notas: "",
        });
        expect(result.current.totalNeto).toBe(1500);
    });

    it("recalcula el neto al cambiar cada campo", () => {
        const { result } = montarConModalAbierto(vi.fn());

        act(() => result.current.cambiarCampo("bonificaciones", "100"));
        act(() => result.current.cambiarCampo("abonoPrestamo", "50"));
        act(() => result.current.cambiarCampo("otrosDescuentos", "25"));

        expect(result.current.totalNeto).toBe(1525);
    });

    it("cierra el modal sin registrar nada", () => {
        const { result } = montarConModalAbierto(vi.fn());

        act(() => result.current.cerrarPago());

        expect(result.current.modalAbierto).toBe(false);
        expect(serviceMock.registrarPagoNomina).not.toHaveBeenCalled();
    });

    it("bloquea un neto negativo antes de enviar", async () => {
        const { result } = montarConModalAbierto(vi.fn());
        act(() => result.current.cambiarCampo("salarioBase", "100"));
        act(() => result.current.cambiarCampo("otrosDescuentos", "500"));

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(window.alert).toHaveBeenCalledWith("El total a pagar no puede ser negativo.");
        expect(serviceMock.registrarPagoNomina).not.toHaveBeenCalled();
        expect(result.current.modalAbierto).toBe(true);
    });

    it("bloquea un abono mayor que la deuda pendiente", async () => {
        const { result } = montarConModalAbierto(vi.fn());
        act(() => result.current.cambiarCampo("abonoPrestamo", "500"));

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(window.alert).toHaveBeenCalledWith(
            "El abono al préstamo ($500) no puede ser mayor que su deuda pendiente ($400)."
        );
        expect(serviceMock.registrarPagoNomina).not.toHaveBeenCalled();
    });

    it("registra el pago, cierra el modal y recarga las tablas", async () => {
        const cargarDatos = vi.fn();
        const { result } = montarConModalAbierto(cargarDatos);
        act(() => result.current.cambiarCampo("bonificaciones", "100"));
        act(() => result.current.cambiarCampo("abonoPrestamo", "50"));
        act(() => result.current.cambiarCampo("otrosDescuentos", "25"));
        act(() => result.current.cambiarCampo("notas", "Marzo 2026"));

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(serviceMock.registrarPagoNomina).toHaveBeenCalledWith({
            profesor_id: 1,
            salario_base: 1500,
            deduccion_prestamos: 50,
            otros_descuentos: 25,
            bonificaciones: 100,
            notas: "Marzo 2026",
        });
        expect(window.alert).toHaveBeenCalledWith(
            "Pago de nómina registrado exitosamente y préstamos abonados."
        );
        expect(result.current.modalAbierto).toBe(false);
        expect(cargarDatos).toHaveBeenCalledTimes(1);
    });

    it("un error conserva el modal abierto con lo escrito y no recarga", async () => {
        const cargarDatos = vi.fn();
        const error = new Error("500");
        serviceMock.registrarPagoNomina.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = montarConModalAbierto(cargarDatos);
        act(() => result.current.cambiarCampo("notas", "Marzo 2026"));

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(window.alert).toHaveBeenCalledWith(
            "Ocurrió un error al procesar el pago de nómina."
        );
        expect(result.current.modalAbierto).toBe(true);
        expect(result.current.formulario.notas).toBe("Marzo 2026");
        expect(cargarDatos).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith("Error registrando pago:", error);
        consoleError.mockRestore();
    });
});
