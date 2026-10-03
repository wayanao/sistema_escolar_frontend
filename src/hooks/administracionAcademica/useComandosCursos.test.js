import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { actualizarMock, cambiarEstadoMock, crearMock } = vi.hoisted(() => ({
    actualizarMock: vi.fn(),
    cambiarEstadoMock: vi.fn(),
    crearMock: vi.fn(),
}));

vi.mock("../../services/cursosApi", () => ({
    actualizarCurso: actualizarMock,
    cambiarEstadoCurso: cambiarEstadoMock,
    crearCurso: crearMock,
}));

import useComandosCursos from "./useComandosCursos";

const CURSO = {
    id: 21,
    nombre: "6A",
    jornada: "Tarde",
    estado: "activo",
};

function crearHook({ estadoFiltro = "activo", cursos = [CURSO] } = {}) {
    let listaCursos = cursos;
    const recargar = vi.fn().mockResolvedValue(undefined);
    const setCursos = vi.fn((actualizar) => {
        listaCursos = typeof actualizar === "function"
            ? actualizar(listaCursos)
            : actualizar;
    });

    return {
        obtenerCursos: () => listaCursos,
        recargar,
        setCursos,
        ...renderHook(() => useComandosCursos({
            estadoFiltro,
            recargar,
            setCursos,
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

describe("useComandosCursos", () => {
    it("controla edición y cancelación con los valores actuales", () => {
        const { result } = crearHook();

        act(() => result.current.iniciarEdicion(CURSO));

        expect(result.current.editId).toBe(21);
        expect(result.current.nombre).toBe("6A");
        expect(result.current.jornada).toBe("Tarde");
        expect(result.current.estado).toBe("activo");
        expect(result.current.nivel).toBe("");

        act(() => result.current.cancelarEdicion());

        expect(result.current.editId).toBeNull();
        expect(result.current.nombre).toBe("");
        expect(result.current.jornada).toBe("Mañana");
        expect(result.current.estado).toBe("activo");
        expect(result.current.nivel).toBe("");
    });

    it("preselecciona el nivel del curso en edición cuando está definido", () => {
        const { result } = crearHook();

        act(() => result.current.iniciarEdicion({ ...CURSO, nivel: "preescolar" }));

        expect(result.current.nivel).toBe("preescolar");
    });

    it("preselecciona el director de grupo del curso en edición cuando está definido", () => {
        const { result } = crearHook();

        act(() => result.current.iniciarEdicion({ ...CURSO, director_grupo_id: 7 }));

        expect(result.current.director_grupo_id).toBe(7);
    });

    it("valida el nombre antes de crear", async () => {
        const { result, recargar } = crearHook();

        await act(async () => result.current.guardarCurso());

        expect(window.alert).toHaveBeenCalledWith("Falta nombre");
        expect(crearMock).not.toHaveBeenCalled();
        expect(actualizarMock).not.toHaveBeenCalled();
        expect(recargar).not.toHaveBeenCalled();
    });

    it("crea con el payload vigente, limpia y recarga", async () => {
        const { result, recargar } = crearHook();
        act(() => {
            result.current.actualizarCampo("nombre", "  6a  ");
            result.current.actualizarCampo("jornada", "Tarde");
        });

        await act(async () => result.current.guardarCurso());

        expect(crearMock).toHaveBeenCalledWith({
            nombre: "6A",
            jornada: "Tarde",
            estado: "activo",
            nivel: null,
            director_grupo_id: null,
        });
        expect(window.alert).toHaveBeenCalledWith("Curso creado 🔥");
        expect(recargar).toHaveBeenCalledTimes(1);
        expect(result.current.nombre).toBe("");
        expect(result.current.jornada).toBe("Mañana");
    });

    it("crea con el nivel seleccionado", async () => {
        const { result } = crearHook();
        act(() => {
            result.current.actualizarCampo("nombre", "Transición A");
            result.current.actualizarCampo("nivel", "preescolar");
        });

        await act(async () => result.current.guardarCurso());

        expect(crearMock).toHaveBeenCalledWith({
            nombre: "TRANSICIÓN A",
            jornada: "Mañana",
            estado: "activo",
            nivel: "preescolar",
            director_grupo_id: null,
        });
    });

    it("crea con el director de grupo seleccionado", async () => {
        const { result } = crearHook();
        act(() => {
            result.current.actualizarCampo("nombre", "Transición A");
            result.current.actualizarCampo("director_grupo_id", 7);
        });

        await act(async () => result.current.guardarCurso());

        expect(crearMock).toHaveBeenCalledWith({
            nombre: "TRANSICIÓN A",
            jornada: "Mañana",
            estado: "activo",
            nivel: null,
            director_grupo_id: 7,
        });
    });

    it("actualiza el curso en edición con el mismo contrato", async () => {
        const { result, recargar } = crearHook();
        act(() => result.current.iniciarEdicion(CURSO));

        await act(async () => result.current.guardarCurso());

        expect(actualizarMock).toHaveBeenCalledWith(21, {
            nombre: "6A",
            jornada: "Tarde",
            estado: "activo",
            nivel: null,
            director_grupo_id: null,
        });
        expect(crearMock).not.toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith("Curso actualizado 🔥");
        expect(recargar).toHaveBeenCalledTimes(1);
        expect(result.current.editId).toBeNull();
    });

    it("conserva los detalles del backend cuando falla el guardado", async () => {
        const error = {
            response: {
                data: {
                    detail: [
                        { msg: "El nombre ya existe" },
                        { message: "La jornada no es válida" },
                    ],
                },
            },
        };
        crearMock.mockRejectedValue(error);
        const { result, recargar } = crearHook();
        act(() => result.current.actualizarCampo("nombre", "6A"));

        await act(async () => result.current.guardarCurso());

        expect(console.error).toHaveBeenCalledWith(error);
        expect(window.alert).toHaveBeenCalledWith(
            "El nombre ya existe\nLa jornada no es válida",
        );
        expect(recargar).not.toHaveBeenCalled();
    });

    it("confirma el cambio de estado, actualiza la lista y sincroniza la edición", async () => {
        window.confirm.mockReturnValue(true);
        const { result, setCursos, obtenerCursos } = crearHook({ estadoFiltro: "todos" });
        act(() => result.current.iniciarEdicion(CURSO));

        await act(async () => result.current.cambiarEstado(CURSO, "inactivo"));

        expect(window.confirm).toHaveBeenCalledWith("¿Deseas desactivar el curso 6A?");
        expect(cambiarEstadoMock).toHaveBeenCalledWith(21, "inactivo");
        expect(setCursos).toHaveBeenCalledTimes(1);
        expect(obtenerCursos()).toEqual([{ ...CURSO, estado: "inactivo" }]);
        expect(result.current.estado).toBe("inactivo");
    });

    it("respeta cancelación y conserva el mensaje si falla el cambio de estado", async () => {
        const error = new Error("Sin conexión");
        const { result, setCursos } = crearHook();

        await act(async () => result.current.cambiarEstado(CURSO, "activo"));
        await act(async () => result.current.cambiarEstado(CURSO, "inactivo"));
        expect(cambiarEstadoMock).not.toHaveBeenCalled();

        window.confirm.mockReturnValue(true);
        cambiarEstadoMock.mockRejectedValue(error);
        await act(async () => result.current.cambiarEstado(CURSO, "inactivo"));

        expect(console.error).toHaveBeenCalledWith(
            "Error cambiando estado del curso:",
            error,
        );
        expect(window.alert).toHaveBeenCalledWith("No se pudo cambiar el estado del curso");
        expect(setCursos).not.toHaveBeenCalled();
    });
});

describe("useComandosCursos y el año lectivo", () => {
    it("si el backend rechaza el cambio de estado, muestra su mensaje tal cual", async () => {
        const detalle = "El año lectivo 2026 está cerrado. Solo se puede consultar.";
        window.confirm.mockReturnValue(true);
        cambiarEstadoMock.mockRejectedValue({ response: { status: 409, data: { detail: detalle } } });
        const { result, setCursos } = crearHook();

        await act(async () => result.current.cambiarEstado(CURSO, "inactivo"));

        expect(window.alert).toHaveBeenCalledWith(detalle);
        expect(setCursos).not.toHaveBeenCalled();
    });
});
