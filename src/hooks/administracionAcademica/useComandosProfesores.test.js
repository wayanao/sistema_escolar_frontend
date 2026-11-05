import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { actualizarMock, cambiarEstadoMock, crearMock } = vi.hoisted(() => ({
    actualizarMock: vi.fn(),
    cambiarEstadoMock: vi.fn(),
    crearMock: vi.fn(),
}));

vi.mock("../../services/profesoresApi", () => ({
    actualizarProfesor: actualizarMock,
    cambiarEstadoProfesor: cambiarEstadoMock,
    crearProfesor: crearMock,
}));

import useComandosProfesores from "./useComandosProfesores";

const PROFESOR = {
    id: 11,
    nombre: "ANA",
    apellido: "RUIZ",
    documento: "102030",
    email: "ana@ejemplo.com",
    telefono: "3001234567",
    sueldo: 1200.5,
    estado: "activo",
};

function crearHook({ estadoFiltro = "activo", profesores = [PROFESOR] } = {}) {
    let listaProfesores = profesores;
    const recargar = vi.fn().mockResolvedValue(undefined);
    const setProfesores = vi.fn((actualizar) => {
        listaProfesores = typeof actualizar === "function"
            ? actualizar(listaProfesores)
            : actualizar;
    });

    return {
        obtenerProfesores: () => listaProfesores,
        recargar,
        setProfesores,
        ...renderHook(() => useComandosProfesores({
            estadoFiltro,
            recargar,
            setProfesores,
        })),
    };
}

function completarFormulario(result) {
    act(() => {
        result.current.actualizarCampo("nombre", "  Ana   María  ");
        result.current.actualizarCampo("apellido", "  Ruiz  Pérez ");
        result.current.actualizarCampo("documentoIdentidad", "102030");
        result.current.actualizarCampo("email", " ANA@EJEMPLO.COM ");
        result.current.actualizarCampo("telefono", "3001234567");
        result.current.actualizarCampo("password", "secreto");
        result.current.actualizarCampo("sueldo", "1200.50");
    });
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

describe("useComandosProfesores", () => {
    it("controla edición y cancelación con los valores actuales", () => {
        const { result } = crearHook();

        act(() => result.current.iniciarEdicion(PROFESOR));

        expect(result.current.editId).toBe(11);
        expect(result.current.nombre).toBe("ANA");
        expect(result.current.apellido).toBe("RUIZ");
        expect(result.current.documentoIdentidad).toBe("102030");
        expect(result.current.password).toBe("");
        expect(result.current.sueldo).toBe(1200.5);
        expect(result.current.estado).toBe("activo");

        act(() => result.current.cancelarEdicion());

        expect(result.current.editId).toBeNull();
        expect(result.current.nombre).toBe("");
        expect(result.current.documentoIdentidad).toBe("");
        expect(result.current.estado).toBe("activo");
    });

    it("valida campos obligatorios antes de crear", async () => {
        const { result, recargar } = crearHook();

        await act(async () => result.current.guardarProfesor());

        expect(window.alert).toHaveBeenCalledWith("Completa todos los campos obligatorios");
        expect(crearMock).not.toHaveBeenCalled();
        expect(actualizarMock).not.toHaveBeenCalled();
        expect(recargar).not.toHaveBeenCalled();
    });

    it("crea con el payload vigente, limpia y recarga", async () => {
        const { result, recargar } = crearHook();
        completarFormulario(result);

        await act(async () => result.current.guardarProfesor());

        expect(crearMock).toHaveBeenCalledWith({
            nombre: "ANA MARÍA",
            apellido: "RUIZ PÉREZ",
            documento_identidad: "102030",
            email: "ana@ejemplo.com",
            telefono: "3001234567",
            password: "secreto",
            sueldo: 1200.5,
            estado: "activo",
        });
        expect(window.alert).toHaveBeenCalledWith("Profesor creado 🔥");
        expect(recargar).toHaveBeenCalledTimes(1);
        expect(result.current.nombre).toBe("");
        expect(result.current.editId).toBeNull();
    });

    it("con doble clic crea el profesor una sola vez y avisa que está guardando", async () => {
        let terminar;
        crearMock.mockImplementationOnce(() => new Promise((resolve) => {
            terminar = resolve;
        }));
        const { result } = crearHook();
        completarFormulario(result);
        expect(result.current.guardando).toBe(false);

        let primero;
        act(() => {
            primero = result.current.guardarProfesor();
            void result.current.guardarProfesor();
        });

        expect(crearMock).toHaveBeenCalledTimes(1);
        expect(result.current.guardando).toBe(true);

        await act(async () => {
            terminar({});
            await primero;
        });
        expect(result.current.guardando).toBe(false);
        expect(window.alert).toHaveBeenCalledTimes(1);
    });

    it("si falta un dato no frena el siguiente intento", async () => {
        const { result } = crearHook();

        await act(async () => result.current.guardarProfesor());
        completarFormulario(result);
        await act(async () => result.current.guardarProfesor());

        expect(crearMock).toHaveBeenCalledTimes(1);
        expect(result.current.guardando).toBe(false);
    });

    it("actualiza permitiendo contraseña vacía durante la edición", async () => {
        const { result, recargar } = crearHook();
        act(() => result.current.iniciarEdicion(PROFESOR));

        await act(async () => result.current.guardarProfesor());

        expect(actualizarMock).toHaveBeenCalledWith(11, {
            nombre: "ANA",
            apellido: "RUIZ",
            documento_identidad: "102030",
            email: "ana@ejemplo.com",
            telefono: "3001234567",
            password: "",
            sueldo: 1200.5,
            estado: "activo",
        });
        expect(crearMock).not.toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith("Profesor actualizado 🔥");
        expect(recargar).toHaveBeenCalledTimes(1);
    });

    it("conserva los detalles del backend cuando falla el guardado", async () => {
        const error = {
            response: {
                data: {
                    detail: [
                        { msg: "El documento ya existe" },
                        { message: "El correo ya existe" },
                    ],
                },
            },
        };
        crearMock.mockRejectedValue(error);
        const { result, recargar } = crearHook();
        completarFormulario(result);

        await act(async () => result.current.guardarProfesor());

        expect(console.error).toHaveBeenCalledWith("FETCH ERROR:", error);
        expect(window.alert).toHaveBeenCalledWith(
            "El documento ya existe\nEl correo ya existe",
        );
        expect(recargar).not.toHaveBeenCalled();
    });

    it("confirma el cambio de estado, actualiza la lista y sincroniza la edición", async () => {
        window.confirm.mockReturnValue(true);
        const { result, setProfesores, obtenerProfesores } = crearHook({
            estadoFiltro: "todos",
        });
        act(() => result.current.iniciarEdicion(PROFESOR));

        await act(async () => result.current.cambiarEstado(PROFESOR, "inactivo"));

        expect(window.confirm).toHaveBeenCalledWith("¿Deseas desactivar a ANA RUIZ?");
        expect(cambiarEstadoMock).toHaveBeenCalledWith(11, "inactivo");
        expect(setProfesores).toHaveBeenCalledTimes(1);
        expect(obtenerProfesores()).toEqual([{ ...PROFESOR, estado: "inactivo" }]);
        expect(result.current.estado).toBe("inactivo");
    });

    it("respeta cancelación y conserva el mensaje si falla el cambio de estado", async () => {
        const error = new Error("Sin conexión");
        const { result, setProfesores } = crearHook();

        await act(async () => result.current.cambiarEstado(PROFESOR, "activo"));
        await act(async () => result.current.cambiarEstado(PROFESOR, "inactivo"));
        expect(cambiarEstadoMock).not.toHaveBeenCalled();

        window.confirm.mockReturnValue(true);
        cambiarEstadoMock.mockRejectedValue(error);
        await act(async () => result.current.cambiarEstado(PROFESOR, "inactivo"));

        expect(console.error).toHaveBeenCalledWith(
            "Error cambiando estado del profesor:",
            error,
        );
        expect(window.alert).toHaveBeenCalledWith("No se pudo cambiar el estado del profesor");
        expect(setProfesores).not.toHaveBeenCalled();
    });
});
