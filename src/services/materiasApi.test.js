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
    actualizarMateria,
    cambiarEstadoMateria,
    crearMateria,
    listarMaterias,
} from "./materiasApi";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("contrato HTTP de materias", () => {
    it("lista materias conservando el filtro de estado", async () => {
        const materias = [{ id: 31, estado: "activo" }];
        apiMock.get.mockResolvedValue({ data: materias });

        await expect(listarMaterias("activo")).resolves.toBe(materias);

        expect(apiMock.get).toHaveBeenCalledWith("/materias", {
            params: { estado: "activo" },
        });
    });

    it("permite cancelar la consulta sin alterar sus parámetros", async () => {
        const controller = new AbortController();
        apiMock.get.mockResolvedValue({ data: [] });

        await listarMaterias("todos", { signal: controller.signal });

        expect(apiMock.get).toHaveBeenCalledWith("/materias", {
            params: { estado: "todos" },
            signal: controller.signal,
        });
    });

    it("crea por la ruta singular y actualiza por la plural con el payload exacto", async () => {
        const payload = { nombre: "MATEMÁTICAS", estado: "activo" };
        const creada = { id: 31 };
        const actualizada = { id: 31, estado: "inactivo" };
        apiMock.post.mockResolvedValue({ data: creada });
        apiMock.put.mockResolvedValue({ data: actualizada });

        await expect(crearMateria(payload)).resolves.toBe(creada);
        await expect(actualizarMateria(31, payload)).resolves.toBe(actualizada);

        expect(apiMock.post).toHaveBeenCalledWith("/materia", payload);
        expect(apiMock.put).toHaveBeenCalledWith("/materias/31", payload);
        expect(apiMock.post.mock.calls[0][1]).toBe(payload);
        expect(apiMock.put.mock.calls[0][1]).toBe(payload);
    });

    it("cambia el estado por la ruta plural y propaga errores sin reinterpretarlos", async () => {
        const respuesta = { id: 31, estado: "inactivo" };
        const error = { response: { status: 409, data: { detail: "Conflicto" } } };
        apiMock.patch.mockResolvedValue({ data: respuesta });
        apiMock.get.mockRejectedValue(error);

        await expect(cambiarEstadoMateria(31, "inactivo")).resolves.toBe(respuesta);
        expect(apiMock.patch).toHaveBeenCalledWith("/materias/31/estado", {
            estado: "inactivo",
        });
        await expect(listarMaterias("activo")).rejects.toBe(error);
    });
});
