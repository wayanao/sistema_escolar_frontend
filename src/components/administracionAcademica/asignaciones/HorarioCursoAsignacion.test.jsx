import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import HorarioCursoAsignacion from "./HorarioCursoAsignacion";

const ASIGNACION = {
    id: 41,
    dia: "Lunes",
    hora_inicio: "08:00",
    hora_fin: "09:00",
    materia_nombre: "MATEMÁTICAS",
    profesor_nombre: "ANA RUIZ",
};

describe("HorarioCursoAsignacion", () => {
    it("conserva el estado sin curso y delega edición y desactivación", async () => {
        const onEditar = vi.fn();
        const onDesactivar = vi.fn();
        const user = userEvent.setup();
        const { rerender } = render(
            <HorarioCursoAsignacion
                asignaciones={[]}
                cursoSeleccionado={undefined}
                editandoId={null}
                onEditar={onEditar}
                onDesactivar={onDesactivar}
                guardando={false}
            />,
        );
        expect(screen.getByText("Selecciona un curso para ver sus asignaciones.")).toBeInTheDocument();

        rerender(
            <HorarioCursoAsignacion
                asignaciones={[ASIGNACION]}
                cursoSeleccionado={{ id: 21, nombre: "5A" }}
                editandoId={41}
                onEditar={onEditar}
                onDesactivar={onDesactivar}
                guardando={false}
            />,
        );

        expect(screen.getByText("Horario asignado de 5A")).toBeInTheDocument();
        expect(screen.getByText("1 asignación(es) activa(s)")).toBeInTheDocument();
        expect(screen.getByText("8:00 AM - 9:00 AM")).toBeInTheDocument();
        expect(screen.getAllByText("Día libre")).toHaveLength(4);

        await user.click(screen.getByRole("button", { name: "Editar" }));
        await user.click(screen.getByRole("button", { name: "Desactivar" }));

        expect(onEditar).toHaveBeenCalledWith(ASIGNACION);
        expect(onDesactivar).toHaveBeenCalledWith(ASIGNACION);
    });
});

describe("HorarioCursoAsignacion en un año cerrado", () => {
    it("muestra las clases sin Editar ni Desactivar", () => {
        render(
            <HorarioCursoAsignacion
                asignaciones={[ASIGNACION]}
                cursoSeleccionado={{ id: 21, nombre: "5A" }}
                editandoId={null}
                puedeEditar={false}
                onEditar={vi.fn()}
                onDesactivar={vi.fn()}
                guardando={false}
            />,
        );

        expect(screen.getByText("MATEMÁTICAS")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
    });
});
