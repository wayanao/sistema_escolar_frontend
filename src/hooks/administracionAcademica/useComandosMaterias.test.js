import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { actualizarMock, cambiarEstadoMock, crearMock } = vi.hoisted(() => ({
    actualizarMock: vi.fn(),
    cambiarEstadoMock: vi.fn(),
    crearMock: vi.fn(),
}));

vi.mock("../../services/materiasApi", () => ({
    actualizarMateria: actualizarMock,
    cambiarEstadoMateria: cambiarEstadoMock,
    crearMateria: crearMock,
}));

import useComandosMaterias from "./useComandosMaterias";

const MATERIA = { id: 31, nombre: "MATEMÁTICAS", estado: "activo" };

function crearHook({ estadoFiltro = "activo", materias = [MATERIA] } = {}) {
    let listaMaterias = materias;
    const recargar = vi.fn().mockResolvedValue(undefined);
    const setMaterias = vi.fn((actualizar) => {
        listaMaterias = typeof actualizar === "function"
            ? actualizar(listaMaterias)
            : actualizar;
    });

    return {
        obtenerMaterias: () => listaMaterias,
        recargar,
        setMaterias,
        ...renderHook(() => useComandosMaterias({
            estadoFiltro,
            recargar,
            setMaterias,
        })),
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    actualizarMock.mockResolvedValue({});
    cambiarEstadoMock.mockResolvedValue({ estado: "inactivo" });
    crearMock.mockResolvedValue({});
    window.alert = vi.fn();
    window.confirm = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useComandosMaterias", () => {
    it("controla edición y cancelación con los valores actuales", () => {
        const { result } = crearHook();

        act(() => result.current.iniciarEdicion(MATERIA));
        expect(result.current.editId).toBe(31);
        expect(result.current.nombre).toBe("MATEMÁTICAS");
        expect(result.current.estado).toBe("activo");

        act(() => result.current.cancelarEdicion());
        expect(result.current.editId).toBeNull();
        expect(result.current.nombre).toBe("");
        expect(result.current.estado).toBe("activo");
    });

    it("valida el nombre antes de crear", async () => {
        const { result, recargar } = crearHook();

        await act(async () => result.current.guardarMateria());

        expect(window.alert).toHaveBeenCalledWith("Falta nombre");
        expect(crearMock).not.toHaveBeenCalled();
        expect(actualizarMock).not.toHaveBeenCalled();
        expect(recargar).not.toHaveBeenCalled();
    });

    it("crea con el payload vigente, limpia y recarga", async () => {
        const { result, recargar } = crearHook();
        act(() => result.current.actualizarCampo("nombre", "  ciencias   naturales  "));

        await act(async () => result.current.guardarMateria());

        expect(crearMock).toHaveBeenCalledWith({
            nombre: "CIENCIAS NATURALES",
            estado: "activo",
        });
        expect(window.alert).toHaveBeenCalledWith("Materia creada 🔥");
        expect(recargar).toHaveBeenCalledTimes(1);
        expect(result.current.nombre).toBe("");
    });

    it("actualiza la materia en edición con el mismo contrato", async () => {
        const { result, recargar } = crearHook();
        act(() => result.current.iniciarEdicion(MATERIA));

        await act(async () => result.current.guardarMateria());

        expect(actualizarMock).toHaveBeenCalledWith(31, {
            nombre: "MATEMÁTICAS",
            estado: "activo",
        });
        expect(crearMock).not.toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith("Materia actualizada 🔥");
        expect(recargar).toHaveBeenCalledTimes(1);
        expect(result.current.editId).toBeNull();
    });

    it("conserva los detalles del backend cuando falla el guardado", async () => {
        const error = {
            response: {
                data: {
                    detail: [
                        { msg: "El nombre ya existe" },
                        { message: "El estado no es válido" },
                    ],
                },
            },
        };
        crearMock.mockRejectedValue(error);
        const { result, recargar } = crearHook();
        act(() => result.current.actualizarCampo("nombre", "Matemáticas"));

        await act(async () => result.current.guardarMateria());

        expect(console.error).toHaveBeenCalledWith(error);
        expect(window.alert).toHaveBeenCalledWith(
            "El nombre ya existe\nEl estado no es válido",
        );
        expect(recargar).not.toHaveBeenCalled();
    });

    it("ofrece confirmar el cambio de nombre y solo entonces reenvía el campo explícito", async () => {
        const error = {
            response: {
                status: 409,
                data: {
                    detail: {
                        codigo: "materia_usada_en_otro_anio",
                        mensaje: "Esta materia se usa en 2026.",
                    },
                },
            },
        };
        actualizarMock.mockRejectedValueOnce(error);
        const { result, recargar } = crearHook();
        act(() => {
            result.current.iniciarEdicion(MATERIA);
            result.current.actualizarCampo("nombre", "  matemáticas avanzadas  ");
        });

        await act(async () => result.current.guardarMateria());

        expect(actualizarMock).toHaveBeenNthCalledWith(1, 31, {
            nombre: "MATEMÁTICAS AVANZADAS",
            estado: "activo",
        });
        expect(result.current.avisoCambioNombre).toEqual({
            mensaje: "Esta materia se usa en 2026.",
        });
        expect(window.alert).not.toHaveBeenCalled();
        expect(recargar).not.toHaveBeenCalled();

        await act(async () => result.current.confirmarCambioNombre());

        expect(actualizarMock).toHaveBeenNthCalledWith(2, 31, {
            nombre: "MATEMÁTICAS AVANZADAS",
            estado: "activo",
            confirmar_cambio_nombre: true,
        });
        expect(window.alert).toHaveBeenCalledWith("Materia actualizada 🔥");
        expect(recargar).toHaveBeenCalledTimes(1);
        expect(result.current.avisoCambioNombre).toBeNull();
        expect(result.current.editId).toBeNull();
    });

    it("pasa a creación con el nombre propuesto sin crear hasta que el usuario guarde", async () => {
        actualizarMock.mockRejectedValueOnce({
            response: {
                status: 409,
                data: {
                    detail: {
                        codigo: "materia_usada_en_otro_anio",
                        mensaje: "Esta materia se usa en 2026.",
                    },
                },
            },
        });
        const { result } = crearHook();
        act(() => {
            result.current.iniciarEdicion(MATERIA);
            result.current.actualizarCampo("nombre", "Matemáticas avanzadas");
        });
        await act(async () => result.current.guardarMateria());

        act(() => result.current.crearMateriaNuevaDesdeAviso());

        expect(result.current.avisoCambioNombre).toBeNull();
        expect(result.current.editId).toBeNull();
        expect(result.current.nombre).toBe("MATEMÁTICAS AVANZADAS");
        expect(crearMock).not.toHaveBeenCalled();

        await act(async () => result.current.guardarMateria());

        expect(crearMock).toHaveBeenCalledWith({
            nombre: "MATEMÁTICAS AVANZADAS",
            estado: "activo",
        });
    });

    it("confirma el cambio de estado, actualiza la lista y sincroniza la edición", async () => {
        window.confirm.mockReturnValue(true);
        const { result, setMaterias, obtenerMaterias } = crearHook({
            estadoFiltro: "todos",
        });
        act(() => result.current.iniciarEdicion(MATERIA));

        await act(async () => result.current.cambiarEstado(MATERIA, "inactivo"));

        expect(window.confirm).toHaveBeenCalledWith(
            "¿Deseas desactivar la materia MATEMÁTICAS?",
        );
        expect(cambiarEstadoMock).toHaveBeenCalledWith(31, "inactivo");
        expect(setMaterias).toHaveBeenCalledTimes(1);
        expect(obtenerMaterias()).toEqual([{ ...MATERIA, estado: "inactivo" }]);
        expect(result.current.estado).toBe("inactivo");
    });

    it("respeta cancelación y conserva el mensaje si falla el cambio de estado", async () => {
        const error = new Error("Sin conexión");
        const { result, setMaterias } = crearHook();

        await act(async () => result.current.cambiarEstado(MATERIA, "activo"));
        await act(async () => result.current.cambiarEstado(MATERIA, "inactivo"));
        expect(cambiarEstadoMock).not.toHaveBeenCalled();

        window.confirm.mockReturnValue(true);
        cambiarEstadoMock.mockRejectedValue(error);
        await act(async () => result.current.cambiarEstado(MATERIA, "inactivo"));

        expect(console.error).toHaveBeenCalledWith(
            "Error cambiando estado de la materia:",
            error,
        );
        expect(window.alert).toHaveBeenCalledWith(
            "No se pudo cambiar el estado de la materia",
        );
        expect(setMaterias).not.toHaveBeenCalled();
    });
});
