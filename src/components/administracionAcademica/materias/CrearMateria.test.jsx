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

import CrearMateria from "./CrearMateria";

function prepararApi({ materias = [] } = {}) {
    apiMock.get.mockResolvedValue({ data: materias, status: 200 });
    apiMock.post.mockResolvedValue({ data: {}, status: 201 });
    apiMock.put.mockResolvedValue({ data: {}, status: 200 });
    apiMock.patch.mockResolvedValue({ data: { estado: "inactivo" }, status: 200 });
}

beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn();
});

describe("flujo de materias de administración académica", () => {
    it("carga inicialmente materias activas", async () => {
        prepararApi({
            materias: [{ id: 31, nombre: "MATEMÁTICAS", estado: "activo" }],
        });

        render(<CrearMateria />);

        expect(await screen.findByRole("cell", { name: "MATEMÁTICAS" })).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/materias", {
            params: { estado: "activo" },
            signal: expect.any(AbortSignal),
        });
    });

    it("crea por la ruta singular con la normalización y payload vigentes", async () => {
        prepararApi();
        const user = userEvent.setup();
        render(<CrearMateria />);

        await user.type(
            screen.getByPlaceholderText("Matemáticas, Biología..."),
            "  ciencias   naturales  ",
        );
        await user.click(screen.getByRole("button", { name: "Crear Materia" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/materia", {
                nombre: "CIENCIAS NATURALES",
                estado: "activo",
            });
        });
        expect(window.alert).toHaveBeenCalledWith("Materia creada 🔥");
        expect(apiMock.get).toHaveBeenCalledTimes(2);
    });

    it("carga edición y restaura los valores iniciales al cancelar", async () => {
        prepararApi({
            materias: [{ id: 31, nombre: "MATEMÁTICAS", estado: "inactivo" }],
        });
        const user = userEvent.setup();
        render(<CrearMateria />);

        await user.click(await screen.findByRole("button", { name: "Editar" }));

        expect(screen.getByText("📚 Editar Materia")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Matemáticas, Biología...")).toHaveValue("MATEMÁTICAS");
        expect(screen.getByRole("button", { name: "Actualizar Materia" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(screen.getByText("📚 Crear Materia")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Matemáticas, Biología...")).toHaveValue("");
        expect(screen.getAllByDisplayValue("Activo").length).toBeGreaterThan(0);
    });

    it("confirma la desactivación y retira la materia del filtro activo", async () => {
        const materia = { id: 31, nombre: "MATEMÁTICAS", estado: "activo" };
        prepararApi({ materias: [materia] });
        window.confirm.mockReturnValue(true);
        const user = userEvent.setup();
        render(<CrearMateria />);

        const fila = await screen.findByRole("row", { name: /MATEMÁTICAS/ });
        await user.selectOptions(within(fila).getByRole("combobox"), "inactivo");

        expect(window.confirm).toHaveBeenCalledWith(
            "¿Deseas desactivar la materia MATEMÁTICAS?",
        );
        await waitFor(() => {
            expect(apiMock.patch).toHaveBeenCalledWith("/materias/31/estado", {
                estado: "inactivo",
            });
        });
        await waitFor(() => expect(
            screen.queryByRole("row", { name: /MATEMÁTICAS/ }),
        ).not.toBeInTheDocument());
    });

    it("conserva los detalles de validación devueltos por el backend", async () => {
        prepararApi();
        apiMock.post.mockRejectedValue({
            response: {
                data: {
                    detail: [
                        { msg: "El nombre ya existe" },
                        { message: "El estado no es válido" },
                    ],
                },
            },
        });
        const user = userEvent.setup();
        render(<CrearMateria />);
        await user.type(screen.getByPlaceholderText("Matemáticas, Biología..."), "Matemáticas");

        await user.click(screen.getByRole("button", { name: "Crear Materia" }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                "El nombre ya existe\nEl estado no es válido",
            );
        });
    });
});
