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

import CrearProfesor from "./CrearProfesor";

function prepararApi({ profesores = [] } = {}) {
    apiMock.get.mockResolvedValue({ data: profesores, status: 200 });
    apiMock.post.mockResolvedValue({ data: {}, status: 201 });
    apiMock.put.mockResolvedValue({ data: {}, status: 200 });
    apiMock.patch.mockResolvedValue({ data: { estado: "inactivo" }, status: 200 });
}

async function llenarFormulario(user) {
    await user.type(screen.getByPlaceholderText("Nombre"), "  Ana   María  ");
    await user.type(screen.getByPlaceholderText("Apellidos"), "  Ruiz  Pérez ");
    await user.type(screen.getByPlaceholderText("Documento"), "102030");
    await user.type(screen.getByPlaceholderText("Email"), " ANA@EJEMPLO.COM ");
    await user.type(screen.getByPlaceholderText("Teléfono"), "3001234567");
    await user.type(screen.getByPlaceholderText("Contraseña"), "secreto");
    await user.type(screen.getByPlaceholderText("Ej. 1200.50"), "1200.50");
}

beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn();
});

describe("flujo de profesores de administración académica", () => {
    it("carga inicialmente profesores activos", async () => {
        prepararApi({
            profesores: [
                {
                    id: 11,
                    nombre: "ANA",
                    apellido: "RUIZ",
                    documento: "102030",
                    email: "ana@ejemplo.com",
                    estado: "activo",
                },
            ],
        });

        render(<CrearProfesor />);

        expect(await screen.findByText("ANA RUIZ")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/profesores", {
            params: { estado: "activo" },
            signal: expect.any(AbortSignal),
        });
    });

    it("crea un profesor con las normalizaciones y el payload vigentes", async () => {
        prepararApi();
        const user = userEvent.setup();
        render(<CrearProfesor />);
        await screen.findByText("Lista de Profesores");
        await llenarFormulario(user);

        await user.click(screen.getByRole("button", { name: "Crear Profesor" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/profesores", {
                nombre: "ANA MARÍA",
                apellido: "RUIZ PÉREZ",
                documento_identidad: "102030",
                email: "ana@ejemplo.com",
                telefono: "3001234567",
                password: "secreto",
                sueldo: 1200.5,
                estado: "activo",
            });
        });
        expect(window.alert).toHaveBeenCalledWith("Profesor creado 🔥");
        expect(apiMock.get).toHaveBeenCalledTimes(2);
    });

    it("confirma la desactivación y retira el profesor del filtro activo", async () => {
        const profesor = {
            id: 11,
            nombre: "ANA",
            apellido: "RUIZ",
            documento: "102030",
            email: "ana@ejemplo.com",
            estado: "activo",
        };
        prepararApi({ profesores: [profesor] });
        window.confirm.mockReturnValue(true);
        const user = userEvent.setup();
        render(<CrearProfesor />);

        const fila = await screen.findByRole("row", { name: /ANA RUIZ/ });
        await user.selectOptions(within(fila).getByRole("combobox"), "inactivo");

        expect(window.confirm).toHaveBeenCalledWith("¿Deseas desactivar a ANA RUIZ?");
        await waitFor(() => {
            expect(apiMock.patch).toHaveBeenCalledWith("/profesores/11/estado", {
                estado: "inactivo",
            });
        });
        await waitFor(() => expect(
            screen.queryByRole("row", { name: /ANA RUIZ/ }),
        ).not.toBeInTheDocument());
    });

    it("conserva los detalles de validación devueltos por el backend", async () => {
        prepararApi();
        apiMock.post.mockRejectedValue({
            response: {
                data: {
                    detail: [
                        { msg: "El documento ya existe" },
                        { message: "El correo ya existe" },
                    ],
                },
            },
        });
        const user = userEvent.setup();
        render(<CrearProfesor />);
        await llenarFormulario(user);

        await user.click(screen.getByRole("button", { name: "Crear Profesor" }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                "El documento ya existe\nEl correo ya existe",
            );
        });
    });
});
