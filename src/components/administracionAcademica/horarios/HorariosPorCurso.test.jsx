import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
    },
}));

vi.mock("../../../utils/api", () => ({
    default: apiMock,
}));

import HorariosPorCurso from "./HorariosPorCurso";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("horarios semanales por curso", () => {
    it("ordena opciones y clases sin cambiar el primer curso de la respuesta", async () => {
        apiMock.get.mockResolvedValue({
            data: [
                {
                    profesor: "Ana Torres",
                    curso: "7B",
                    materia: "QUÍMICA",
                    dia: "Lunes",
                    hora_inicio: "10:00",
                    hora_fin: "11:00",
                },
                {
                    profesor: "Luis Pérez",
                    curso: "7B",
                    materia: "BIOLOGÍA",
                    dia: "Lunes",
                    hora_inicio: "08:00",
                    hora_fin: "09:00",
                },
                {
                    profesor: "Marta Ruiz",
                    curso: "6A",
                    materia: "ESPAÑOL",
                    dia: "Martes",
                    hora_inicio: "06:30",
                    hora_fin: "07:30",
                },
            ],
        });

        render(<HorariosPorCurso />);

        expect(screen.getByText("Cargando horarios por curso...")).toBeInTheDocument();
        expect(await screen.findByText("📚 BIOLOGÍA")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/hora/horarios-admin", {
            signal: expect.any(AbortSignal),
        });

        const selector = screen.getByRole("combobox");
        expect(selector).toHaveValue("7B");
        expect(Array.from(selector.options).map((option) => option.value)).toEqual(["6A", "7B"]);

        const materias = screen.getAllByText(/📚 (BIOLOGÍA|QUÍMICA)/);
        expect(materias.map((element) => element.textContent)).toEqual([
            "📚 BIOLOGÍA",
            "📚 QUÍMICA",
        ]);
        expect(screen.getAllByText("Día libre")).toHaveLength(4);
    });

    it("filtra cursos, selecciona la primera coincidencia y conserva el estado sin resultados", async () => {
        apiMock.get.mockResolvedValue({
            data: [
                {
                    profesor: "Ana Torres",
                    curso: "7B",
                    materia: "QUÍMICA",
                    dia: "Lunes",
                    hora_inicio: "10:00",
                    hora_fin: "11:00",
                },
                {
                    profesor: "Marta Ruiz",
                    curso: "6A",
                    materia: "ESPAÑOL",
                    dia: "Martes",
                    hora_inicio: "06:30",
                    hora_fin: "07:30",
                },
            ],
        });
        const user = userEvent.setup();

        render(<HorariosPorCurso />);
        await screen.findByText("📚 QUÍMICA");

        await user.type(screen.getByPlaceholderText("Ej: 5A, Primero..."), "6");

        expect(await screen.findByText("📚 ESPAÑOL")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveValue("6A");

        await user.clear(screen.getByPlaceholderText("Ej: 5A, Primero..."));
        await user.type(screen.getByPlaceholderText("Ej: 5A, Primero..."), "sin curso");

        expect(screen.getByRole("option", { name: "— Sin coincidencias —" })).toBeInTheDocument();
        expect(screen.getByText("📚 ESPAÑOL")).toBeInTheDocument();
    });

    it("conserva el estado vacío después de una respuesta sin horarios", async () => {
        apiMock.get.mockResolvedValue({ data: [] });

        render(<HorariosPorCurso />);

        expect(await screen.findByText(
            "No hay clases asignadas con horario todavía.",
        )).toBeInTheDocument();
        await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(1));
    });
});
