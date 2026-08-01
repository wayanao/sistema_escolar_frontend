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

import HorariosProfesores from "./HorariosProfesores";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("horarios semanales por profesor", () => {
    it("consulta, selecciona el primer profesor y conserva calendario y formato", async () => {
        apiMock.get.mockResolvedValue({
            data: [
                {
                    profesor: "Ana Torres",
                    curso: "7B",
                    materia: "MATEMÁTICAS",
                    dia: "Lunes",
                    hora_inicio: "13:00",
                    hora_fin: "14:30",
                },
                {
                    profesor: "Luis Pérez",
                    curso: "6A",
                    materia: "BIOLOGÍA",
                    dia: "Martes",
                    hora_inicio: "06:30",
                    hora_fin: "08:00",
                },
            ],
        });
        const user = userEvent.setup();

        render(<HorariosProfesores />);

        expect(screen.getByText("Cargando horarios...")).toBeInTheDocument();
        expect(await screen.findByText("📚 MATEMÁTICAS")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/hora/horarios-admin", {
            signal: expect.any(AbortSignal),
        });
        expect(screen.getByRole("combobox")).toHaveValue("Ana Torres");
        expect(screen.getByText(/1:00 PM - 2:30 PM/)).toBeInTheDocument();
        expect(screen.getAllByText("Día libre")).toHaveLength(4);

        await user.selectOptions(screen.getByRole("combobox"), "Luis Pérez");

        expect(screen.getByText("📚 BIOLOGÍA")).toBeInTheDocument();
        expect(screen.getByText(/6:30 AM - 8:00 AM/)).toBeInTheDocument();
        expect(screen.queryByText("📚 MATEMÁTICAS")).not.toBeInTheDocument();
    });

    it("conserva el estado vacío después de una respuesta sin horarios", async () => {
        apiMock.get.mockResolvedValue({ data: [] });

        render(<HorariosProfesores />);

        expect(await screen.findByText(
            "No hay clases asignadas con horario todavía.",
        )).toBeInTheDocument();
        await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(1));
    });
});
