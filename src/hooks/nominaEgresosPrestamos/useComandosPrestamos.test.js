import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import useComandosPrestamos from "./useComandosPrestamos";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { actualizarEstadoPrestamo: vi.fn(), crearPrestamo: vi.fn() },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const profesores = [
    { id: 3, nombre: "Ana", apellido: "Pérez" },
    { id: 4, nombre: "Luis", apellido: "Gómez" },
];

const prestamoDeAna = {
    id: 90,
    profesor_nombre: "Pérez Ana",
    monto: 500000,
    fecha: "2026-07-10",
    estado: "Pendiente",
};

const eventoFalso = { preventDefault: vi.fn() };

const montar = () => {
    const mostrarHistorialDe = vi.fn().mockResolvedValue(undefined);
    const recargarHistorial = vi.fn().mockResolvedValue(undefined);
    const irAlHistorial = vi.fn();
    const hook = renderHook(() =>
        useComandosPrestamos({ profesores, mostrarHistorialDe, recargarHistorial, irAlHistorial })
    );
    return { ...hook, mostrarHistorialDe, recargarHistorial, irAlHistorial };
};

const escribir = (result, campos) => {
    Object.entries(campos).forEach(([campo, valor]) => {
        act(() => result.current.cambiarCampo(campo, valor));
    });
};

// Una respuesta del backend que todavía no llega.
const respuestaPendiente = () => {
    let resolver;
    const promesa = new Promise((resolve) => {
        resolver = resolve;
    });
    return { promesa, resolver };
};

// Simula que el usuario cerró la última ventana de aviso.
const cerrarUltimaVentana = async () => {
    const { didClose } = Swal.fire.mock.calls.at(-1)[0];
    await act(async () => {
        didClose();
    });
};

describe("useComandosPrestamos", () => {
    beforeEach(() => {
        Swal.fire.mockResolvedValue({ isConfirmed: true });
        serviceMock.crearPrestamo.mockResolvedValue({ id: 92 });
        serviceMock.actualizarEstadoPrestamo.mockResolvedValue({ mensaje: "ok" });
    });

    it("registra tras confirmar, limpia, muestra el historial de la persona y resalta el préstamo nuevo", async () => {
        const { result, mostrarHistorialDe } = montar();
        escribir(result, {
            profesorId: "3",
            monto: "500000",
            fecha: "2026-08-01",
            notas: "  Quincena de agosto  ",
        });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                icon: "question",
                title: "¿Registrar este préstamo?",
                text: expect.stringContaining("Profesor o trabajador: Pérez Ana"),
                confirmButtonText: "Sí, registrar préstamo",
                cancelButtonText: "Revisar",
            })
        );
        expect(Swal.fire.mock.calls[0][0].text).toContain(
            "Una vez creado no se puede eliminar; solo se podrá saldar."
        );
        expect(serviceMock.crearPrestamo).toHaveBeenCalledWith({
            profesor_id: 3,
            monto: 500000,
            fecha: "2026-08-01",
            estado: "Pendiente",
            notas: "Quincena de agosto",
        });
        expect(mostrarHistorialDe).toHaveBeenCalledWith("3");
        expect(result.current.formulario).toEqual({
            profesorId: "",
            monto: "",
            fecha: "",
            notas: "",
        });
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Préstamo registrado",
                text: expect.stringContaining("a Pérez Ana, con fecha 2026-08-01"),
            })
        );
        expect(result.current.prestamoResaltadoId).toBe(92);
        expect(result.current.registrando).toBe(false);
        // Se lleva el préstamo a la vista solo cuando la ventana termina de cerrarse.
        expect(result.current.prestamoPorMostrar).toBeNull();

        await cerrarUltimaVentana();

        expect(result.current.prestamoPorMostrar).toEqual({ id: 92, vez: 1 });
    });

    it("usa una fecha del día cuando el formulario no la especifica", async () => {
        const { result } = montar();
        escribir(result, { profesorId: "4", monto: "1000" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(serviceMock.crearPrestamo).toHaveBeenCalledWith(
            expect.objectContaining({
                profesor_id: 4,
                fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                notas: "",
            })
        );
    });

    it("rechaza montos que no son mayores que cero antes de confirmar", async () => {
        const { result } = montar();
        escribir(result, { profesorId: "3", monto: "0" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenCalledTimes(1);
        expect(Swal.fire).toHaveBeenCalledWith({
            icon: "warning",
            title: "Revisa el préstamo",
            text: "El monto del préstamo debe ser mayor que 0.",
        });
        expect(serviceMock.crearPrestamo).not.toHaveBeenCalled();
    });

    it("Revisar en la confirmación no registra nada y conserva lo escrito", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
        const { result, mostrarHistorialDe } = montar();
        escribir(result, { profesorId: "3", monto: "1000" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(serviceMock.crearPrestamo).not.toHaveBeenCalled();
        expect(mostrarHistorialDe).not.toHaveBeenCalled();
        expect(result.current.formulario.monto).toBe("1000");
        expect(result.current.registrando).toBe(false);
    });

    it("mientras registra lo avisa e ignora un segundo envío", async () => {
        const { promesa, resolver } = respuestaPendiente();
        serviceMock.crearPrestamo.mockReturnValueOnce(promesa);
        const { result } = montar();
        escribir(result, { profesorId: "3", monto: "1000" });

        let primerEnvio;
        await act(async () => {
            primerEnvio = result.current.crear(eventoFalso);
        });

        expect(result.current.registrando).toBe(true);

        await act(async () => {
            await result.current.crear(eventoFalso);
            await result.current.saldarPrestamo(prestamoDeAna);
        });

        expect(serviceMock.crearPrestamo).toHaveBeenCalledTimes(1);
        expect(serviceMock.actualizarEstadoPrestamo).not.toHaveBeenCalled();

        await act(async () => {
            resolver({ id: 93 });
            await primerEnvio;
        });

        expect(result.current.registrando).toBe(false);
    });

    it("si el backend rechaza el registro, lo explica, conserva lo escrito y no cambia el historial", async () => {
        serviceMock.crearPrestamo.mockRejectedValueOnce({
            response: { status: 400, data: { detail: "Monto no permitido" } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, mostrarHistorialDe } = montar();
        escribir(result, { profesorId: "3", monto: "1000" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "error",
                title: "No se registró el préstamo",
                text: "Monto no permitido\n\nNo se guardó nada.",
            })
        );
        expect(mostrarHistorialDe).not.toHaveBeenCalled();
        expect(result.current.formulario.monto).toBe("1000");
        expect(result.current.registrando).toBe(false);
        consoleError.mockRestore();
    });

    it("sin respuesta al registrar, carga el historial de la persona y lleva a él si se pide", async () => {
        serviceMock.crearPrestamo.mockRejectedValueOnce(new Error("Network Error"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, mostrarHistorialDe, irAlHistorial } = montar();
        escribir(result, { profesorId: "3", monto: "1000" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(mostrarHistorialDe).toHaveBeenCalledWith("3");
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "warning",
                title: "No sabemos si el préstamo quedó registrado",
                showCancelButton: true,
                confirmButtonText: "Revisar el historial",
                cancelButtonText: "Seguir aquí",
            })
        );
        expect(result.current.formulario.monto).toBe("1000");
        expect(irAlHistorial).not.toHaveBeenCalled();

        await cerrarUltimaVentana();

        expect(irAlHistorial).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("sin respuesta al registrar, Seguir aquí no mueve la pantalla", async () => {
        serviceMock.crearPrestamo.mockRejectedValueOnce(new Error("Network Error"));
        Swal.fire
            .mockResolvedValueOnce({ isConfirmed: true })
            .mockResolvedValueOnce({ isConfirmed: false });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, irAlHistorial } = montar();
        escribir(result, { profesorId: "3", monto: "1000" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });
        await cerrarUltimaVentana();

        expect(irAlHistorial).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it("salda tras confirmar con la persona y el monto, avisa, resalta y recarga", async () => {
        const { result, recargarHistorial } = montar();

        await act(async () => {
            await result.current.saldarPrestamo(prestamoDeAna);
        });

        expect(Swal.fire).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                icon: "warning",
                title: "¿Saldar este préstamo?",
                text: expect.stringContaining("a Pérez Ana, del 2026-07-10"),
                confirmButtonText: "Sí, saldar",
                cancelButtonText: "Cancelar",
            })
        );
        expect(Swal.fire.mock.calls[0][0].text).toContain("No se puede deshacer.");
        expect(serviceMock.actualizarEstadoPrestamo).toHaveBeenCalledWith(90, "Pagado");
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Préstamo saldado",
                text: expect.stringContaining("quedó como Pagado"),
            })
        );
        expect(recargarHistorial).toHaveBeenCalledTimes(1);
        expect(result.current.prestamoResaltadoId).toBe(90);
        expect(result.current.saldandoId).toBeNull();
    });

    it("mientras salda marca cuál préstamo trabaja e ignora otro saldado", async () => {
        const { promesa, resolver } = respuestaPendiente();
        serviceMock.actualizarEstadoPrestamo.mockReturnValueOnce(promesa);
        const { result } = montar();

        let primerSaldado;
        await act(async () => {
            primerSaldado = result.current.saldarPrestamo(prestamoDeAna);
        });

        expect(result.current.saldandoId).toBe(90);

        await act(async () => {
            await result.current.saldarPrestamo({ ...prestamoDeAna, id: 95 });
        });
        expect(serviceMock.actualizarEstadoPrestamo).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolver({ mensaje: "ok" });
            await primerSaldado;
        });

        expect(result.current.saldandoId).toBeNull();
    });

    it("cancelar el saldado no llama al backend", async () => {
        Swal.fire.mockResolvedValueOnce({ isConfirmed: false });
        const { result, recargarHistorial } = montar();

        await act(async () => {
            await result.current.saldarPrestamo(prestamoDeAna);
        });

        expect(serviceMock.actualizarEstadoPrestamo).not.toHaveBeenCalled();
        expect(recargarHistorial).not.toHaveBeenCalled();
        expect(result.current.saldandoId).toBeNull();
    });

    it("si el backend rechaza el saldado, lo explica y no recarga", async () => {
        serviceMock.actualizarEstadoPrestamo.mockRejectedValueOnce({
            response: { status: 404, data: { detail: "Prestamo no encontrado." } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, recargarHistorial } = montar();

        await act(async () => {
            await result.current.saldarPrestamo(prestamoDeAna);
        });

        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "error",
                title: "No se saldó el préstamo",
                text: "Prestamo no encontrado.\n\nNo cambió nada.",
            })
        );
        expect(recargarHistorial).not.toHaveBeenCalled();
        expect(result.current.saldandoId).toBeNull();
        consoleError.mockRestore();
    });

    it("sin respuesta al saldar, recarga el historial y pide revisarlo", async () => {
        serviceMock.actualizarEstadoPrestamo.mockRejectedValueOnce(new Error("Network Error"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, recargarHistorial } = montar();

        await act(async () => {
            await result.current.saldarPrestamo(prestamoDeAna);
        });

        expect(recargarHistorial).toHaveBeenCalledTimes(1);
        expect(Swal.fire).toHaveBeenLastCalledWith(
            expect.objectContaining({
                icon: "warning",
                title: "No sabemos si el préstamo quedó saldado",
            })
        );
        consoleError.mockRestore();
    });
});
