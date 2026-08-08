import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useComandosPrestamos from "./useComandosPrestamos";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: { actualizarEstadoPrestamo: vi.fn(), crearPrestamo: vi.fn() },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);

const profesores = [
    { id: 3, nombre: "Ana", apellido: "Pérez" },
    { id: 4, nombre: "Luis", apellido: "Gómez" },
];

const eventoFalso = { preventDefault: vi.fn() };

const montar = () => {
    const mostrarHistorialDe = vi.fn().mockResolvedValue(undefined);
    const recargarHistorial = vi.fn().mockResolvedValue(undefined);
    const hook = renderHook(() =>
        useComandosPrestamos({ profesores, mostrarHistorialDe, recargarHistorial })
    );
    return { ...hook, mostrarHistorialDe, recargarHistorial };
};

const escribir = (result, campos) => {
    Object.entries(campos).forEach(([campo, valor]) => {
        act(() => result.current.cambiarCampo(campo, valor));
    });
};

describe("useComandosPrestamos", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        window.confirm = vi.fn(() => true);
        serviceMock.crearPrestamo.mockResolvedValue({ id: 92 });
        serviceMock.actualizarEstadoPrestamo.mockResolvedValue({ mensaje: "ok" });
    });

    it("registra el préstamo, limpia el formulario y muestra su historial", async () => {
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

        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining("Profesor o trabajador: Pérez Ana")
        );
        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining("Una vez creado no se puede eliminar; solo se podrá saldar.")
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

        expect(window.alert).toHaveBeenCalledWith("El monto del préstamo debe ser mayor que 0.");
        expect(window.confirm).not.toHaveBeenCalled();
        expect(serviceMock.crearPrestamo).not.toHaveBeenCalled();
    });

    it("cancelar la confirmación no registra nada y conserva lo escrito", async () => {
        window.confirm = vi.fn(() => false);
        const { result, mostrarHistorialDe } = montar();
        escribir(result, { profesorId: "3", monto: "1000" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(serviceMock.crearPrestamo).not.toHaveBeenCalled();
        expect(mostrarHistorialDe).not.toHaveBeenCalled();
        expect(result.current.formulario.monto).toBe("1000");
    });

    it("conserva el detalle del backend cuando falla el registro", async () => {
        serviceMock.crearPrestamo.mockRejectedValueOnce({
            response: { data: { detail: "Monto no permitido" } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, mostrarHistorialDe } = montar();
        escribir(result, { profesorId: "3", monto: "1000" });

        await act(async () => {
            await result.current.crear(eventoFalso);
        });

        expect(window.alert).toHaveBeenCalledWith("Monto no permitido");
        expect(mostrarHistorialDe).not.toHaveBeenCalled();
        expect(result.current.formulario.monto).toBe("1000");
        consoleError.mockRestore();
    });

    it("salda un préstamo y recarga el historial del filtro", async () => {
        const { result, recargarHistorial } = montar();

        await act(async () => {
            await result.current.saldarPrestamo(90);
        });

        expect(window.confirm).toHaveBeenCalledWith("¿Marcar este préstamo como Pagado?");
        expect(serviceMock.actualizarEstadoPrestamo).toHaveBeenCalledWith(90, "Pagado");
        expect(recargarHistorial).toHaveBeenCalledTimes(1);
    });

    it("cancelar el saldado no llama al backend", async () => {
        window.confirm = vi.fn(() => false);
        const { result, recargarHistorial } = montar();

        await act(async () => {
            await result.current.saldarPrestamo(90);
        });

        expect(serviceMock.actualizarEstadoPrestamo).not.toHaveBeenCalled();
        expect(recargarHistorial).not.toHaveBeenCalled();
    });

    it("avisa con un mensaje fijo cuando falla el saldado", async () => {
        serviceMock.actualizarEstadoPrestamo.mockRejectedValueOnce(new Error("500"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result, recargarHistorial } = montar();

        await act(async () => {
            await result.current.saldarPrestamo(90);
        });

        expect(window.alert).toHaveBeenCalledWith("Error al actualizar el estado.");
        expect(recargarHistorial).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
