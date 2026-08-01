import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SelectorCursoAsignacion from "./SelectorCursoAsignacion";

describe("SelectorCursoAsignacion", () => {
    it("presenta cursos, jornada y delega la selección", async () => {
        const onSeleccionarCurso = vi.fn();
        const user = userEvent.setup();
        render(
            <SelectorCursoAsignacion
                cursoId="21"
                cursos={[
                    { id: 21, nombre: "5A", jornada: "Mañana" },
                    { id: 22, nombre: "6B", jornada: "Tarde" },
                ]}
                cursoSeleccionado={{ id: 21, nombre: "5A", jornada: "Mañana" }}
                onSeleccionarCurso={onSeleccionarCurso}
            />,
        );

        expect(screen.getByText("Asignando para")).toBeInTheDocument();
        expect(screen.getByText("5A")).toBeInTheDocument();
        expect(screen.getByText("· Jornada Mañana")).toBeInTheDocument();

        const opcion = screen.getByRole("option", { name: "6B (Tarde)" });
        await user.selectOptions(opcion.parentElement, "22");

        expect(onSeleccionarCurso).toHaveBeenCalledWith("22");
    });
});
