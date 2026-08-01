import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        delete: vi.fn(),
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

vi.mock("../../../utils/api", () => ({
    default: apiMock,
}));

import AsignarClase from "./AsignarClase";

const PROFESORES = [
    { id: 11, nombre: "ANA", apellido: "RUIZ" },
    { id: 12, nombre: "LUIS", apellido: "PEREZ" },
];
const CURSOS = [{ id: 21, nombre: "5A", jornada: "Mañana" }];
const MATERIAS = [{ id: 31, nombre: "MATEMÁTICAS" }];
const DISPONIBILIDAD = {
    jornadas: [
        {
            jornada: "Mañana",
            inicio: "06:30",
            fin: "12:30",
            rangos: [{ inicio: "08:00", fin: "10:00" }],
        },
    ],
};

function prepararApi({ asignaciones = [] } = {}) {
    apiMock.get.mockImplementation((url) => {
        if (url === "/profesores") return Promise.resolve({ data: PROFESORES });
        if (url === "/cursos") return Promise.resolve({ data: CURSOS });
        if (url === "/materias") return Promise.resolve({ data: MATERIAS });
        if (url === "/asignaciones/lista") return Promise.resolve({ data: asignaciones });
        if (url === "/profesores/11/disponibilidad") {
            return Promise.resolve({ data: DISPONIBILIDAD });
        }

        return Promise.reject(new Error(`Consulta no simulada: ${url}`));
    });
    apiMock.post.mockResolvedValue({ data: {} });
    apiMock.put.mockResolvedValue({ data: {} });
    apiMock.delete.mockResolvedValue({ data: {} });
}

async function abrirAsignador() {
    render(<AsignarClase />);
    await screen.findByRole("option", { name: "5A (Mañana)" });
}

async function seleccionarOpcion(user, nombre, valor) {
    const opcion = screen.getByRole("option", { name: nombre });
    await user.selectOptions(opcion.parentElement, valor);
}

async function completarFormulario(user) {
    await seleccionarOpcion(user, "5A (Mañana)", "21");
    await seleccionarOpcion(user, "ANA RUIZ", "11");
    await seleccionarOpcion(user, "MATEMÁTICAS", "31");
    await seleccionarOpcion(user, "Lunes", "Lunes");
    const [horaInicio, horaFin] = document.querySelectorAll('input[type="time"]');
    fireEvent.change(horaInicio, { target: { value: "08:00" } });
    fireEvent.change(horaFin, { target: { value: "09:00" } });
}

beforeEach(() => {
    apiMock.delete.mockReset();
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    apiMock.put.mockReset();
    window.confirm = vi.fn();
    window.scrollTo = vi.fn();
});

describe("flujo de asignaciones académicas", () => {
    it("carga los catálogos y la lista mediante los contratos vigentes", async () => {
        prepararApi();

        await abrirAsignador();

        expect(apiMock.get).toHaveBeenCalledWith("/profesores", {
            signal: expect.any(AbortSignal),
        });
        expect(apiMock.get).toHaveBeenCalledWith("/cursos", {
            signal: expect.any(AbortSignal),
        });
        expect(apiMock.get).toHaveBeenCalledWith("/materias", {
            signal: expect.any(AbortSignal),
        });
        expect(apiMock.get).toHaveBeenCalledWith("/asignaciones/lista", {
            signal: expect.any(AbortSignal),
        });
        expect(screen.getByText("Selecciona un curso para ver sus asignaciones.")).toBeInTheDocument();
    });

    it("consulta disponibilidad y crea una asignación con el payload actual", async () => {
        prepararApi();
        const user = userEvent.setup();
        await abrirAsignador();

        await completarFormulario(user);

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith(
                "/profesores/11/disponibilidad",
                {
                    params: { dia: "Lunes" },
                    signal: expect.any(AbortSignal),
                },
            );
        });
        expect(await screen.findByText("8:00 AM - 10:00 AM")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Asignar clase" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/asignaciones", {
                profesor_id: 11,
                curso_id: 21,
                materia_id: 31,
                dia: "Lunes",
                hora_inicio: "08:00",
                hora_fin: "09:00",
            });
        });
        expect(screen.getByText("Asignación creada correctamente.")).toBeInTheDocument();
    });

    it("edita la asignación y excluye su id al consultar disponibilidad", async () => {
        prepararApi({
            asignaciones: [
                {
                    id: 41,
                    curso_id: 21,
                    profesor_id: 11,
                    materia_id: 31,
                    dia: "Lunes",
                    hora_inicio: "08:00",
                    hora_fin: "09:00",
                    profesor_nombre: "ANA RUIZ",
                    materia_nombre: "MATEMÁTICAS",
                },
            ],
        });
        const user = userEvent.setup();
        await abrirAsignador();
        await seleccionarOpcion(user, "5A (Mañana)", "21");

        await user.click(screen.getByRole("button", { name: "Editar" }));

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith(
                "/profesores/11/disponibilidad",
                {
                    params: { dia: "Lunes", excluir_asignacion_id: 41 },
                    signal: expect.any(AbortSignal),
                },
            );
        });
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/asignaciones/41", {
                profesor_id: 11,
                curso_id: 21,
                materia_id: 31,
                dia: "Lunes",
                hora_inicio: "08:00",
                hora_fin: "09:00",
            });
        });
        expect(screen.getByText("Asignación actualizada correctamente.")).toBeInTheDocument();
    });

    it("conserva la confirmación y el contrato de desactivación", async () => {
        prepararApi({
            asignaciones: [
                {
                    id: 41,
                    curso_id: 21,
                    profesor_id: 11,
                    materia_id: 31,
                    dia: "Lunes",
                    hora_inicio: "08:00",
                    hora_fin: "09:00",
                    profesor_nombre: "ANA RUIZ",
                    materia_nombre: "MATEMÁTICAS",
                },
            ],
        });
        window.confirm.mockReturnValue(true);
        const user = userEvent.setup();
        await abrirAsignador();
        await seleccionarOpcion(user, "5A (Mañana)", "21");

        await user.click(screen.getByRole("button", { name: "Desactivar" }));

        expect(window.confirm).toHaveBeenCalledWith(
            "¿Desactivar esta asignación? No se borrarán planes de clase, notas, asistencia ni boletines históricos.",
        );
        await waitFor(() => expect(apiMock.delete).toHaveBeenCalledWith("/asignaciones/41"));
        expect(screen.getByText("Asignación desactivada correctamente.")).toBeInTheDocument();
    });
});
