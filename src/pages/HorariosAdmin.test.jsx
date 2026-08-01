import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../components/administracionAcademica/horarios/HorariosProfesores", () => ({
    default: () => <div>Contenido de horarios por profesor</div>,
}));
vi.mock("../components/administracionAcademica/horarios/HorariosPorCurso", () => ({
    default: () => <div>Contenido de horarios por curso</div>,
}));

import HorariosAdmin from "./HorariosAdmin";

beforeEach(() => {
    localStorage.clear();
});

describe("composición de horarios administrativos", () => {
    it("conserva título, saludo y ambas vistas", () => {
        localStorage.setItem("usuario", JSON.stringify({ nombre: "David" }));

        render(<HorariosAdmin />);

        expect(screen.getByRole("heading", { name: "📅 Horarios Asignados" })).toBeInTheDocument();
        expect(screen.getByText(
            "Revisa el calendario semanal por profesor y por curso, David.",
        )).toBeInTheDocument();
        expect(screen.getByText("Contenido de horarios por profesor")).toBeInTheDocument();
        expect(screen.getByText("Contenido de horarios por curso")).toBeInTheDocument();
    });

    it("conserva el saludo alternativo cuando no existe usuario", () => {
        render(<HorariosAdmin />);

        expect(screen.getByText(
            "Revisa el calendario semanal por profesor y por curso, Admin.",
        )).toBeInTheDocument();
    });
});
