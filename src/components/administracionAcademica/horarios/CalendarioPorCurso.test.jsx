import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CalendarioPorCurso from "./CalendarioPorCurso";

const HORARIOS = [
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
];

const PROPS_BASE = {
    horarios: HORARIOS,
    cargando: false,
    cursoSeleccionado: "7B",
    busqueda: "",
    cursosFiltrados: ["6A", "7B"],
    horariosDelCurso: HORARIOS,
    onCambiarBusqueda: vi.fn(),
    onSeleccionarCurso: vi.fn(),
};

describe("CalendarioPorCurso", () => {
    it("presenta los estados de carga y vacío vigentes", () => {
        const { rerender } = render(
            <CalendarioPorCurso {...PROPS_BASE} cargando />,
        );

        expect(screen.getByText("Cargando horarios por curso...")).toBeInTheDocument();

        rerender(
            <CalendarioPorCurso
                {...PROPS_BASE}
                horarios={[]}
                horariosDelCurso={[]}
            />,
        );

        expect(screen.getByText(
            "No hay clases asignadas con horario todavía.",
        )).toBeInTheDocument();
    });

    it("presenta el calendario ordenado y delega búsqueda y selección", () => {
        const onCambiarBusqueda = vi.fn();
        const onSeleccionarCurso = vi.fn();
        const { rerender } = render(
            <CalendarioPorCurso
                {...PROPS_BASE}
                onCambiarBusqueda={onCambiarBusqueda}
                onSeleccionarCurso={onSeleccionarCurso}
            />,
        );

        expect(screen.getByText("🏫 Horario por Curso")).toBeInTheDocument();
        const materias = screen.getAllByText(/📚 (BIOLOGÍA|QUÍMICA)/);
        expect(materias.map((element) => element.textContent)).toEqual([
            "📚 BIOLOGÍA",
            "📚 QUÍMICA",
        ]);
        expect(screen.getAllByText("Día libre")).toHaveLength(4);

        fireEvent.change(screen.getByPlaceholderText("Ej: 5A, Primero..."), {
            target: { value: "6" },
        });
        fireEvent.change(screen.getByRole("combobox"), {
            target: { value: "6A" },
        });

        expect(onCambiarBusqueda).toHaveBeenCalledWith("6");
        expect(onSeleccionarCurso).toHaveBeenCalledWith("6A");

        rerender(
            <CalendarioPorCurso
                {...PROPS_BASE}
                cursosFiltrados={[]}
                onCambiarBusqueda={onCambiarBusqueda}
                onSeleccionarCurso={onSeleccionarCurso}
            />,
        );
        expect(screen.getByRole("option", { name: "— Sin coincidencias —" })).toBeInTheDocument();
        expect(screen.getByText("📚 BIOLOGÍA")).toBeInTheDocument();
    });
});
