import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import usePrestamos from "./usePrestamos";

const { serviceMock } = vi.hoisted(() => ({
    serviceMock: {
        obtenerPrestamos: vi.fn(),
        obtenerProfesoresParaPrestamos: vi.fn(),
    },
}));

vi.mock("../../services/nominaEgresosPrestamosApi", () => serviceMock);
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const profesores = [
    { id: 3, nombre: "Ana", apellido: "Pérez" },
    { id: 4, nombre: "Luis", apellido: "Gómez" },
];

const prestamos = [
    { id: 90, monto: 500000, estado: "Pendiente" },
    { id: 91, monto: 200000, estado: "Pagado" },
];

const montarCargado = async () => {
    const hook = renderHook(() => usePrestamos());
    await waitFor(() => expect(hook.result.current.loadingProfesores).toBe(false));
    return hook;
};

describe("usePrestamos", () => {
    beforeEach(() => {
        serviceMock.obtenerProfesoresParaPrestamos.mockResolvedValue(profesores);
        serviceMock.obtenerPrestamos.mockResolvedValue(prestamos);
    });

    it("solo carga profesores al montar y deja el historial sin consultar", async () => {
        const { result } = renderHook(() => usePrestamos());

        expect(result.current.loadingProfesores).toBe(true);
        expect(result.current.loadingPrestamos).toBe(false);

        await waitFor(() => expect(result.current.loadingProfesores).toBe(false));

        expect(result.current.profesores).toEqual(profesores);
        expect(result.current.prestamos).toEqual([]);
        expect(result.current.historialConsultado).toBe(false);
        expect(result.current.profesorFiltro).toBe("");
        expect(serviceMock.obtenerPrestamos).not.toHaveBeenCalled();
    });

    it("consulta el historial del profesor elegido y fija el filtro", async () => {
        const { result } = await montarCargado();

        await act(async () => {
            await result.current.mostrarHistorialDe("3");
        });

        expect(result.current.profesorFiltro).toBe("3");
        expect(result.current.historialConsultado).toBe(true);
        expect(result.current.prestamos).toEqual(prestamos);
        expect(result.current.totalPendiente).toBe(500000);
        expect(serviceMock.obtenerPrestamos).toHaveBeenCalledWith({ profesor_id: "3" });
    });

    it("limpiar el filtro vacía el historial sin consultar al backend", async () => {
        const { result } = await montarCargado();
        await act(async () => {
            await result.current.mostrarHistorialDe("3");
        });

        await act(async () => {
            await result.current.limpiarFiltro();
        });

        expect(result.current.profesorFiltro).toBe("");
        expect(result.current.prestamos).toEqual([]);
        expect(result.current.totalPendiente).toBe(0);
        expect(result.current.historialConsultado).toBe(false);
        expect(serviceMock.obtenerPrestamos).toHaveBeenCalledTimes(1);
    });

    it("avisa al buscar sin profesor elegido y no consulta", async () => {
        const { result } = await montarCargado();

        act(() => {
            result.current.buscarHistorial();
        });

        expect(Swal.fire).toHaveBeenCalledWith({
            icon: "warning",
            title: "Falta elegir a la persona",
            text: "Selecciona un profesor o trabajador para ver su historial.",
        });
        expect(serviceMock.obtenerPrestamos).not.toHaveBeenCalled();
    });

    it("al recargar el historial que ya se ve no lo esconde: avisa que actualiza", async () => {
        const { result } = await montarCargado();
        await act(async () => {
            await result.current.mostrarHistorialDe("3");
        });

        let terminar;
        serviceMock.obtenerPrestamos.mockReturnValueOnce(
            new Promise((resolve) => {
                terminar = () => resolve(prestamos);
            })
        );
        let recarga;
        act(() => {
            recarga = result.current.recargarHistorial();
        });

        expect(result.current.actualizando).toBe(true);
        expect(result.current.loadingPrestamos).toBe(false);
        expect(result.current.prestamos).toEqual(prestamos);

        await act(async () => {
            terminar();
            await recarga;
        });

        expect(result.current.actualizando).toBe(false);
    });

    it("al cambiar de persona sí muestra la carga, porque el historial es otro", async () => {
        const { result } = await montarCargado();
        await act(async () => {
            await result.current.mostrarHistorialDe("3");
        });

        let terminar;
        serviceMock.obtenerPrestamos.mockReturnValueOnce(
            new Promise((resolve) => {
                terminar = () => resolve([]);
            })
        );
        let consulta;
        act(() => {
            consulta = result.current.mostrarHistorialDe("4");
        });

        expect(result.current.loadingPrestamos).toBe(true);
        expect(result.current.actualizando).toBe(false);

        await act(async () => {
            terminar();
            await consulta;
        });
    });

    it("Reintentar vuelve a pedir lo que falló: primero los profesores", async () => {
        serviceMock.obtenerProfesoresParaPrestamos.mockRejectedValueOnce(new Error("fallo"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = renderHook(() => usePrestamos());
        await waitFor(() => expect(result.current.error).not.toBeNull());

        await act(async () => {
            await result.current.reintentar();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.profesores).toEqual(profesores);
        expect(serviceMock.obtenerProfesoresParaPrestamos).toHaveBeenCalledTimes(2);
        consoleError.mockRestore();
    });

    it("Reintentar vuelve a pedir el historial cuando lo que falló fue el historial", async () => {
        serviceMock.obtenerPrestamos.mockRejectedValueOnce(new Error("fallo"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = await montarCargado();
        await act(async () => {
            await result.current.mostrarHistorialDe("3");
        });
        expect(result.current.error).toBe("Error al cargar el historial de préstamos.");

        await act(async () => {
            await result.current.reintentar();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.prestamos).toEqual(prestamos);
        expect(serviceMock.obtenerPrestamos).toHaveBeenLastCalledWith({ profesor_id: "3" });
        expect(serviceMock.obtenerProfesoresParaPrestamos).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("busca y recarga el historial del filtro vigente", async () => {
        const { result } = await montarCargado();
        await act(async () => {
            await result.current.mostrarHistorialDe("4");
        });

        await act(async () => {
            await result.current.buscarHistorial();
        });
        await act(async () => {
            await result.current.recargarHistorial();
        });

        expect(serviceMock.obtenerPrestamos).toHaveBeenCalledTimes(3);
        expect(serviceMock.obtenerPrestamos).toHaveBeenLastCalledWith({ profesor_id: "4" });
    });

    it("protege la lista cuando el backend no devuelve un arreglo", async () => {
        serviceMock.obtenerPrestamos.mockResolvedValueOnce({ detail: "error" });
        const { result } = await montarCargado();

        await act(async () => {
            await result.current.mostrarHistorialDe("3");
        });

        expect(result.current.prestamos).toEqual([]);
        expect(result.current.historialConsultado).toBe(true);
    });

    it("publica el error de carga de profesores", async () => {
        const error = new Error("fallo");
        serviceMock.obtenerProfesoresParaPrestamos.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => usePrestamos());

        await waitFor(() => expect(result.current.loadingProfesores).toBe(false));
        expect(result.current.error).toBe("Error al cargar los profesores o trabajadores.");
        expect(consoleError).toHaveBeenCalledWith(error);
        consoleError.mockRestore();
    });

    it("publica el error del historial y deja de mostrar su indicador", async () => {
        const error = new Error("fallo");
        serviceMock.obtenerPrestamos.mockRejectedValueOnce(error);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const { result } = await montarCargado();

        await act(async () => {
            await result.current.mostrarHistorialDe("3");
        });

        expect(result.current.error).toBe("Error al cargar el historial de préstamos.");
        expect(result.current.loadingPrestamos).toBe(false);
        expect(result.current.historialConsultado).toBe(true);
        consoleError.mockRestore();
    });
});
