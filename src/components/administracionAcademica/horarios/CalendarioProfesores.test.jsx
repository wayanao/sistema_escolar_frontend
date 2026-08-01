import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CalendarioProfesores from "./CalendarioProfesores";

const HORARIOS = [
    {
        profesor: "Ana Torres",
        curso: "7B",
        materia: "MATEMÁTICAS",
        dia: "Lunes",
        hora_inicio: "13:00",
        hora_fin: "14:30",
    },
];

const PROPS_BASE = {
    horarios: HORARIOS,
    cargando: false,
    profesorSeleccionado: "Ana Torres",
    profesoresUnicos: ["Ana Torres", "Luis Pérez"],
    horariosDelProfesor: HORARIOS,
    onSeleccionarProfesor: vi.fn(),
};

describe("CalendarioProfesores", () => {
    it("presenta los estados de carga y vacío vigentes", () => {
        const { rerender } = render(
            <CalendarioProfesores {...PROPS_BASE} cargando />,
        );

        expect(screen.getByText("Cargando horarios...")).toBeInTheDocument();

        rerender(
            <CalendarioProfesores
                {...PROPS_BASE}
                horarios={[]}
                horariosDelProfesor={[]}
            />,
        );

        expect(screen.getByText(
            "No hay clases asignadas con horario todavía.",
        )).toBeInTheDocument();
    });

    it("presenta calendario y delega la selección del profesor", () => {
        const onSeleccionarProfesor = vi.fn();
        render(
            <CalendarioProfesores
                {...PROPS_BASE}
                onSeleccionarProfesor={onSeleccionarProfesor}
            />,
        );

        expect(screen.getByText("📅 Calendario Semanal")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveValue("Ana Torres");
        expect(screen.getByText(/1:00 PM - 2:30 PM/)).toBeInTheDocument();
        expect(screen.getByText("📚 MATEMÁTICAS")).toBeInTheDocument();
        expect(screen.getByText("🏫 Curso: 7B")).toBeInTheDocument();
        expect(screen.getAllByText("Día libre")).toHaveLength(4);

        fireEvent.change(screen.getByRole("combobox"), {
            target: { value: "Luis Pérez" },
        });

        expect(onSeleccionarProfesor).toHaveBeenCalledWith("Luis Pérez");
    });
});
