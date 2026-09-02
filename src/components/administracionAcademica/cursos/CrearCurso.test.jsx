import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
        patch: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

vi.mock("../../../utils/api", () => ({
    default: apiMock,
}));

import CrearCurso from "./CrearCurso";

function prepararApi({ cursos = [] } = {}) {
    apiMock.get.mockResolvedValue({ data: cursos, status: 200 });
    apiMock.post.mockResolvedValue({ data: {}, status: 201 });
    apiMock.put.mockResolvedValue({ data: {}, status: 200 });
    apiMock.patch.mockResolvedValue({ data: { estado: "inactivo" }, status: 200 });
}

beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn();
});

describe("flujo de cursos de administración académica", () => {
    it("carga inicialmente cursos activos", async () => {
        prepararApi({
            cursos: [{ id: 21, nombre: "6A", jornada: "Mañana", estado: "activo" }],
        });

        render(<CrearCurso />);

        expect(await screen.findByRole("cell", { name: "6A" })).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
            params: { estado: "activo" },
            signal: expect.any(AbortSignal),
        });
    });

    it("crea un curso con la normalización y el payload vigentes", async () => {
        prepararApi();
        const user = userEvent.setup();
        render(<CrearCurso />);

        await user.type(screen.getByPlaceholderText("Nombre (6A, 7B...)"), "  6a   ");
        await user.click(screen.getByRole("button", { name: "Crear Curso" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/cursos", {
                nombre: "6A",
                jornada: "Mañana",
                estado: "activo",
                nivel: null,
            });
        });
        expect(window.alert).toHaveBeenCalledWith("Curso creado 🔥");
        expect(apiMock.get).toHaveBeenCalledTimes(2);
    });

    it("crea un curso de preescolar con el nivel seleccionado", async () => {
        prepararApi();
        const user = userEvent.setup();
        render(<CrearCurso />);

        await user.type(screen.getByPlaceholderText("Nombre (6A, 7B...)"), "Transición A");
        await user.selectOptions(screen.getByDisplayValue("Sin definir"), "preescolar");
        await user.click(screen.getByRole("button", { name: "Crear Curso" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/cursos", {
                nombre: "TRANSICIÓN A",
                jornada: "Mañana",
                estado: "activo",
                nivel: "preescolar",
            });
        });
    });

    it("carga edición y restaura los valores iniciales al cancelar", async () => {
        prepararApi({
            cursos: [{ id: 21, nombre: "6A", jornada: "Tarde", estado: "inactivo" }],
        });
        const user = userEvent.setup();
        render(<CrearCurso />);

        await user.click(await screen.findByRole("button", { name: "Editar" }));

        expect(screen.getByText("🏫 Editar Curso")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Nombre (6A, 7B...)")).toHaveValue("6A");
        expect(screen.getByDisplayValue("🌇 Tarde")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Actualizar Curso" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.getByText("🏫 Crear Curso")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Nombre (6A, 7B...)")).toHaveValue("");
        expect(screen.getByDisplayValue("🌅 Mañana")).toBeInTheDocument();
    });

    it("confirma la desactivación y retira el curso del filtro activo", async () => {
        const curso = { id: 21, nombre: "6A", jornada: "Mañana", estado: "activo" };
        prepararApi({ cursos: [curso] });
        window.confirm.mockReturnValue(true);
        const user = userEvent.setup();
        render(<CrearCurso />);

        const fila = await screen.findByRole("row", { name: /6A/ });
        await user.selectOptions(within(fila).getByRole("combobox"), "inactivo");

        expect(window.confirm).toHaveBeenCalledWith("¿Deseas desactivar el curso 6A?");
        await waitFor(() => {
            expect(apiMock.patch).toHaveBeenCalledWith("/cursos/21/estado", {
                estado: "inactivo",
            });
        });
        await waitFor(() => expect(
            screen.queryByRole("row", { name: /6A/ }),
        ).not.toBeInTheDocument());
    });

    it("conserva los detalles de validación devueltos por el backend", async () => {
        prepararApi();
        apiMock.post.mockRejectedValue({
            response: {
                data: {
                    detail: [
                        { msg: "El nombre ya existe" },
                        { message: "La jornada no es válida" },
                    ],
                },
            },
        });
        const user = userEvent.setup();
        render(<CrearCurso />);
        await user.type(screen.getByPlaceholderText("Nombre (6A, 7B...)"), "6A");

        await user.click(screen.getByRole("button", { name: "Crear Curso" }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                "El nombre ya existe\nLa jornada no es válida",
            );
        });
    });
});
