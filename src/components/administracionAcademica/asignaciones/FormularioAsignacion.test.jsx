import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FormularioAsignacion from "./FormularioAsignacion";

const PROPS_BASE = {
    cursoId: "",
    profesorId: "",
    materiaId: "",
    dia: "",
    horaInicio: "",
    horaFin: "",
    editandoId: null,
    guardando: false,
    mensajeEstado: "",
    profesores: [{ id: 11, nombre: "ANA", apellido: "RUIZ" }],
    materias: [{ id: 31, nombre: "MATEMÁTICAS" }],
    disponibilidad: null,
    cargandoDisponibilidad: false,
    onActualizarCampo: vi.fn(),
    onCancelarEdicion: vi.fn(),
    onGuardar: vi.fn(),
};

describe("FormularioAsignacion", () => {
    it("conserva controles deshabilitados mientras no haya curso", () => {
        render(<FormularioAsignacion {...PROPS_BASE} />);

        expect(screen.getByText("Nueva asignación")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Asignar clase" })).toBeDisabled();
        screen.getAllByRole("combobox").forEach((control) => expect(control).toBeDisabled());
        document.querySelectorAll('input[type="time"]').forEach((control) => {
            expect(control).toBeDisabled();
        });
    });

    it("presenta edición y delega campos, cancelación y guardado", async () => {
        const onActualizarCampo = vi.fn();
        const onCancelarEdicion = vi.fn();
        const onGuardar = vi.fn();
        const user = userEvent.setup();
        render(
            <FormularioAsignacion
                {...PROPS_BASE}
                cursoId="21"
                editandoId={41}
                mensajeEstado="Asignación actualizada correctamente."
                onActualizarCampo={onActualizarCampo}
                onCancelarEdicion={onCancelarEdicion}
                onGuardar={onGuardar}
            />,
        );

        expect(screen.getByText("Editar asignación")).toBeInTheDocument();
        expect(screen.getByText("Asignación actualizada correctamente.")).toBeInTheDocument();

        const profesor = screen.getByRole("option", { name: "ANA RUIZ" });
        await user.selectOptions(profesor.parentElement, "11");
        const [horaInicio] = document.querySelectorAll('input[type="time"]');
        fireEvent.change(horaInicio, { target: { value: "08:00" } });
        await user.click(screen.getByRole("button", { name: "Cancelar edición" }));
        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

        expect(onActualizarCampo).toHaveBeenCalledWith("profesorId", "11");
        expect(onActualizarCampo).toHaveBeenCalledWith("horaInicio", "08:00");
        expect(onCancelarEdicion).toHaveBeenCalledTimes(1);
        expect(onGuardar).toHaveBeenCalledTimes(1);
    });
});
