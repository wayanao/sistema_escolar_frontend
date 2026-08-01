import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
        patch: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

vi.mock("../utils/api", () => ({
    default: apiMock,
}));

import {
    actualizarProfesor,
    cambiarEstadoProfesor,
    crearProfesor,
    listarProfesores,
} from "./profesoresApi";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("contrato HTTP de profesores", () => {
    it("lista profesores conservando el filtro de estado", async () => {
        const profesores = [{ id: 11, estado: "activo" }];
        apiMock.get.mockResolvedValue({ data: profesores });

        await expect(listarProfesores("activo")).resolves.toBe(profesores);

        expect(apiMock.get).toHaveBeenCalledWith("/profesores", {
            params: { estado: "activo" },
        });
    });

    it("permite cancelar la consulta sin alterar sus parámetros", async () => {
        const controller = new AbortController();
        apiMock.get.mockResolvedValue({ data: [] });

        await listarProfesores("todos", { signal: controller.signal });

        expect(apiMock.get).toHaveBeenCalledWith("/profesores", {
            params: { estado: "todos" },
            signal: controller.signal,
        });
    });

    it("crea y actualiza conservando el payload exacto", async () => {
        const payload = {
            nombre: "ANA",
            apellido: "PEREZ",
            documento_identidad: "123",
            email: "ana@example.com",
            telefono: "3001234567",
            password: "secreto",
            sueldo: 1200,
            estado: "activo",
        };
        const creado = { id: 11 };
        const actualizado = { id: 11, nombre: "ANA" };
        apiMock.post.mockResolvedValue({ data: creado });
        apiMock.put.mockResolvedValue({ data: actualizado });

        await expect(crearProfesor(payload)).resolves.toBe(creado);
        await expect(actualizarProfesor(11, payload)).resolves.toBe(actualizado);

        expect(apiMock.post).toHaveBeenCalledWith("/profesores", payload);
        expect(apiMock.put).toHaveBeenCalledWith("/profesores/11", payload);
        expect(apiMock.post.mock.calls[0][1]).toBe(payload);
        expect(apiMock.put.mock.calls[0][1]).toBe(payload);
    });

    it("cambia el estado con PATCH y propaga errores sin reinterpretarlos", async () => {
        const respuesta = { id: 11, estado: "inactivo" };
        const error = { response: { status: 409, data: { detail: "Conflicto" } } };
        apiMock.patch.mockResolvedValue({ data: respuesta });
        apiMock.get.mockRejectedValue(error);

        await expect(cambiarEstadoProfesor(11, "inactivo")).resolves.toBe(respuesta);
        expect(apiMock.patch).toHaveBeenCalledWith("/profesores/11/estado", {
            estado: "inactivo",
        });
        await expect(listarProfesores("activo")).rejects.toBe(error);
    });
});
