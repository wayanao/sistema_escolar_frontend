import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DisponibilidadProfesorAsignacion from "./DisponibilidadProfesorAsignacion";

describe("DisponibilidadProfesorAsignacion", () => {
    it("conserva los estados previo, carga, error y rangos disponibles", () => {
        const { rerender } = render(
            <DisponibilidadProfesorAsignacion
                disponibilidad={null}
                cargando={false}
                profesorId=""
                dia=""
            />,
        );
        expect(screen.getByText("Selecciona profesor y día para ver rangos disponibles.")).toBeInTheDocument();

        rerender(
            <DisponibilidadProfesorAsignacion
                disponibilidad={null}
                cargando
                profesorId="11"
                dia="Lunes"
            />,
        );
        expect(screen.getByText("Calculando disponibilidad...")).toBeInTheDocument();

        rerender(
            <DisponibilidadProfesorAsignacion
                disponibilidad={null}
                cargando={false}
                profesorId="11"
                dia="Lunes"
            />,
        );
        expect(screen.getByText("No se pudo calcular la disponibilidad.")).toBeInTheDocument();

        rerender(
            <DisponibilidadProfesorAsignacion
                disponibilidad={{
                    jornadas: [
                        {
                            jornada: "Mañana",
                            inicio: "06:30",
                            fin: "12:30",
                            rangos: [{ inicio: "08:00", fin: "09:00" }],
                        },
                        {
                            jornada: "Tarde",
                            inicio: "12:30",
                            fin: "18:30",
                            rangos: [],
                        },
                    ],
                }}
                cargando={false}
                profesorId="11"
                dia="Lunes"
            />,
        );
        expect(screen.getByText("Disponibilidad del profesor para Lunes")).toBeInTheDocument();
        expect(screen.getByText("8:00 AM - 9:00 AM")).toBeInTheDocument();
        expect(screen.getByText("Sin rangos libres.")).toBeInTheDocument();
    });
});
