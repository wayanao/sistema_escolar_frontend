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
    actualizarCurso,
    cambiarEstadoCurso,
    crearCurso,
    listarCursos,
} from "./cursosApi";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("contrato HTTP de cursos", () => {
    it("lista cursos conservando el filtro de estado", async () => {
        const cursos = [{ id: 21, estado: "activo" }];
        apiMock.get.mockResolvedValue({ data: cursos });

        await expect(listarCursos("activo")).resolves.toBe(cursos);

        expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
            params: { estado: "activo" },
        });
    });

    it("permite cancelar la consulta sin alterar sus parámetros", async () => {
        const controller = new AbortController();
        apiMock.get.mockResolvedValue({ data: [] });

        await listarCursos("todos", { signal: controller.signal });

        expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
            params: { estado: "todos" },
            signal: controller.signal,
        });
    });

    it("crea y actualiza conservando el payload exacto", async () => {
        const payload = {
            nombre: "6A",
            jornada: "Mañana",
            estado: "activo",
        };
        const creado = { id: 21 };
        const actualizado = { id: 21, jornada: "Tarde" };
        apiMock.post.mockResolvedValue({ data: creado });
        apiMock.put.mockResolvedValue({ data: actualizado });

        await expect(crearCurso(payload)).resolves.toBe(creado);
        await expect(actualizarCurso(21, payload)).resolves.toBe(actualizado);

        expect(apiMock.post).toHaveBeenCalledWith("/cursos", payload);
        expect(apiMock.put).toHaveBeenCalledWith("/cursos/21", payload);
        expect(apiMock.post.mock.calls[0][1]).toBe(payload);
        expect(apiMock.put.mock.calls[0][1]).toBe(payload);
    });

    it("cambia el estado con PATCH y propaga errores sin reinterpretarlos", async () => {
        const respuesta = { id: 21, estado: "inactivo" };
        const error = { response: { status: 409, data: { detail: "Conflicto" } } };
        apiMock.patch.mockResolvedValue({ data: respuesta });
        apiMock.get.mockRejectedValue(error);

        await expect(cambiarEstadoCurso(21, "inactivo")).resolves.toBe(respuesta);
        expect(apiMock.patch).toHaveBeenCalledWith("/cursos/21/estado", {
            estado: "inactivo",
        });
        await expect(listarCursos("activo")).rejects.toBe(error);
    });
});
