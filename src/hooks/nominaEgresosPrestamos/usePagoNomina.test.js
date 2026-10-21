import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import usePagoNomina from "./usePagoNomina";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { registrarPagoNomina: vi.fn() },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const empleado = { id: 1, nombre: "ana", apellido: "pérez", sueldo: 1500, saldo_prestamos: 400 };
const eventoFalso = { preventDefault: vi.fn() };

const montarConModalAbierto = ({ cargarDatos = vi.fn(), revisarHistorialDe = vi.fn() } = {}) => {
    const hook = renderHook(() => usePagoNomina({ cargarDatos, revisarHistorialDe }));
    act(() => {
        hook.result.current.abrirPago(empleado);
    });
    return hook;
};

// Una respuesta del backend que todavía no llega: así se ve el pago "en vuelo".
const respuestaPendiente = () => {
    let resolver;
    const promesa = new Promise((resolve) => {
        resolver = resolve;
    });
    return { promesa, resolver };
};

describe("usePagoNomina", () => {
    beforeEach(() => {
        Swal.fire.mockResolvedValue({ isConfirmed: true });
        serviceMock.registrarPagoNomina.mockResolvedValue({ nomina_id: 77 });
    });

    it("abre el modal precargando el sueldo del empleado como salario base", () => {
        const { result } = montarConModalAbierto();

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
        expect(result.current.registrando).toBe(false);
    });

    it("recalcula el neto al cambiar cada campo", () => {
        const { result } = montarConModalAbierto();

        act(() => result.current.cambiarCampo("bonificaciones", "100"));
        act(() => result.current.cambiarCampo("abonoPrestamo", "50"));
        act(() => result.current.cambiarCampo("otrosDescuentos", "25"));

        expect(result.current.totalNeto).toBe(1525);
    });

    it("dice mientras se escribe lo que impide pagar", () => {
        const { result } = montarConModalAbierto();

        expect(result.current.problemas).toEqual({ abono: null, total: null });

        act(() => result.current.cambiarCampo("abonoPrestamo", "500"));

        expect(result.current.problemas.abono).toBe(
            "No puede ser mayor que la deuda ($ 400)."
        );
        expect(result.current.problemas.total).toBeNull();
    });

    it("cierra el modal sin registrar nada", () => {
        const { result } = montarConModalAbierto();

        act(() => result.current.cerrarPago());

        expect(result.current.modalAbierto).toBe(false);
        expect(serviceMock.registrarPagoNomina).not.toHaveBeenCalled();
    });

    it("bloquea un neto negativo antes de enviar, con la ventana del sistema", async () => {
        const { result } = montarConModalAbierto();
        act(() => result.current.cambiarCampo("salarioBase", "100"));
        act(() => result.current.cambiarCampo("otrosDescuentos", "500"));

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenCalledTimes(1);
        expect(Swal.fire).toHaveBeenCalledWith({
            icon: "warning",
            title: "Revisa el pago",
            text: "El total a pagar no puede ser negativo.",
        });
        expect(serviceMock.registrarPagoNomina).not.toHaveBeenCalled();
        expect(result.current.modalAbierto).toBe(true);
    });

    it("bloquea un abono mayor que la deuda pendiente", async () => {
        const { result } = montarConModalAbierto();
        act(() => result.current.cambiarCampo("abonoPrestamo", "500"));

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenCalledWith({
            icon: "warning",
            title: "Revisa el pago",
            text: "El abono al préstamo ($ 500) no puede ser mayor que su deuda pendiente ($ 400).",
        });
        expect(serviceMock.registrarPagoNomina).not.toHaveBeenCalled();
    });

    it("pide confirmar con el resumen del pago y, si se elige Revisar, no envía nada", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
        const { result } = montarConModalAbierto();

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "question",
                title: "¿Registrar este pago de nómina?",
                text: expect.stringContaining("Total neto a depositar:"),
                showCancelButton: true,
                confirmButtonText: "Sí, registrar pago",
                cancelButtonText: "Revisar",
            })
        );
        expect(serviceMock.registrarPagoNomina).not.toHaveBeenCalled();
        expect(result.current.modalAbierto).toBe(true);
        expect(result.current.registrando).toBe(false);
    });

    it("registra tras confirmar, avisa con el número del pago, lo marca en la tabla y recarga", async () => {
        const cargarDatos = vi.fn();
        const { result } = montarConModalAbierto({ cargarDatos });
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
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Pago registrado",
                text: expect.stringContaining("Pago #N-77 a Ana Pérez"),
            })
        );
        expect(result.current.modalAbierto).toBe(false);
        expect(result.current.registrando).toBe(false);
        expect(result.current.pagosRegistrados).toEqual({ 1: 77 });
        expect(result.current.ultimoPagadoId).toBe(1);
        expect(cargarDatos).toHaveBeenCalledTimes(1);
    });

    it("mientras registra, avisa que trabaja, ignora un segundo envío y no deja cerrar", async () => {
        const { promesa, resolver } = respuestaPendiente();
        serviceMock.registrarPagoNomina.mockReturnValueOnce(promesa);
        const { result } = montarConModalAbierto();

        let primerEnvio;
        await act(async () => {
            primerEnvio = result.current.registrarPago(eventoFalso);
        });

        expect(result.current.registrando).toBe(true);

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });
        act(() => result.current.cerrarPago());

        expect(serviceMock.registrarPagoNomina).toHaveBeenCalledTimes(1);
        expect(result.current.modalAbierto).toBe(true);

        await act(async () => {
            resolver({ nomina_id: 78 });
            await primerEnvio;
        });

        expect(result.current.registrando).toBe(false);
        expect(result.current.modalAbierto).toBe(false);
    });

    it("si el servidor rechaza el pago, dice que no se guardó nada, conserva lo escrito y no recarga", async () => {
        const cargarDatos = vi.fn();
        const error = {
            response: { status: 500, data: { detail: "Error al procesar pago: boom" } },
        };
        serviceMock.registrarPagoNomina.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = montarConModalAbierto({ cargarDatos });
        act(() => result.current.cambiarCampo("notas", "Marzo 2026"));

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "error",
                title: "No se registró el pago",
                text: "El servidor no pudo registrar el pago. No se guardó nada; puedes intentarlo de nuevo.",
            })
        );
        expect(result.current.modalAbierto).toBe(true);
        expect(result.current.registrando).toBe(false);
        expect(result.current.formulario.notas).toBe("Marzo 2026");
        expect(cargarDatos).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith("Error registrando pago:", error);
        consoleError.mockRestore();
    });

    it("sin respuesta del servidor, recarga, avisa que no se sabe y lleva al historial si se pide", async () => {
        const cargarDatos = vi.fn();
        const revisarHistorialDe = vi.fn();
        serviceMock.registrarPagoNomina.mockRejectedValueOnce(new Error("Network Error"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = montarConModalAbierto({ cargarDatos, revisarHistorialDe });

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "warning",
                title: "No sabemos si el pago quedó registrado",
                showCancelButton: true,
                confirmButtonText: "Revisar el historial",
                cancelButtonText: "Seguir aquí",
            })
        );
        expect(cargarDatos).toHaveBeenCalledTimes(1);
        expect(result.current.modalAbierto).toBe(false);
        // Mientras la ventana se cierra todavía no se baja al historial.
        expect(revisarHistorialDe).not.toHaveBeenCalled();

        const { didClose } = Swal.fire.mock.calls.at(-1)[0];
        act(() => didClose());

        expect(revisarHistorialDe).toHaveBeenCalledWith(empleado);
        consoleError.mockRestore();
    });

    it("sin respuesta del servidor, Seguir aquí conserva el modal para revisar antes de reintentar", async () => {
        const revisarHistorialDe = vi.fn();
        serviceMock.registrarPagoNomina.mockRejectedValueOnce(new Error("Network Error"));
        Swal.fire
            .mockResolvedValueOnce({ isConfirmed: true })
            .mockResolvedValueOnce({ isConfirmed: false });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = montarConModalAbierto({ revisarHistorialDe });

        await act(async () => {
            await result.current.registrarPago(eventoFalso);
        });
        const { didClose } = Swal.fire.mock.calls.at(-1)[0];
        act(() => didClose());

        expect(result.current.modalAbierto).toBe(true);
        expect(result.current.registrando).toBe(false);
        expect(revisarHistorialDe).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
