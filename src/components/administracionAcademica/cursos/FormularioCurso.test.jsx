import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FormularioCurso from "./FormularioCurso";

const PROPS_BASE = {
    editId: null,
    nombre: "",
    jornada: "Mañana",
    estado: "activo",
    onActualizarCampo: vi.fn(),
    onCancelarEdicion: vi.fn(),
    onGuardar: vi.fn(),
};

describe("FormularioCurso", () => {
    it("presenta la creación y delega campos y guardado", async () => {
        const onActualizarCampo = vi.fn();
        const onGuardar = vi.fn();
        const user = userEvent.setup();
        render(
            <FormularioCurso
                {...PROPS_BASE}
                onActualizarCampo={onActualizarCampo}
                onGuardar={onGuardar}
            />,
        );

        expect(screen.getByText("🏫 Crear Curso")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Nombre (6A, 7B...)"), {
            target: { value: "6A" },
        });
        await user.selectOptions(screen.getByDisplayValue("🌅 Mañana"), "Tarde");
        await user.click(screen.getByRole("button", { name: "Crear Curso" }));

        expect(onActualizarCampo).toHaveBeenCalledWith("nombre", "6A");
        expect(onActualizarCampo).toHaveBeenCalledWith("jornada", "Tarde");
        expect(onGuardar).toHaveBeenCalledTimes(1);
    });

    it("presenta la edición y delega estado y cancelación", async () => {
        const onActualizarCampo = vi.fn();
        const onCancelarEdicion = vi.fn();
        const user = userEvent.setup();
        render(
            <FormularioCurso
                {...PROPS_BASE}
                editId={21}
                nombre="6A"
                jornada="Tarde"
                estado="inactivo"
                onActualizarCampo={onActualizarCampo}
                onCancelarEdicion={onCancelarEdicion}
            />,
        );

        expect(screen.getByText("🏫 Editar Curso")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Actualizar Curso" })).toBeInTheDocument();

        await user.selectOptions(screen.getByDisplayValue("Inactivo"), "activo");
        await user.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(onActualizarCampo).toHaveBeenCalledWith("estado", "activo");
        expect(onCancelarEdicion).toHaveBeenCalledTimes(1);
    });

    it("presenta el nivel y delega su cambio, con 'Sin definir' cuando no llega", async () => {
        const onActualizarCampo = vi.fn();
        const user = userEvent.setup();
        render(
            <FormularioCurso
                {...PROPS_BASE}
                onActualizarCampo={onActualizarCampo}
            />,
        );

        expect(screen.getByDisplayValue("Sin definir")).toBeInTheDocument();

        await user.selectOptions(screen.getByDisplayValue("Sin definir"), "preescolar");

        expect(onActualizarCampo).toHaveBeenCalledWith("nivel", "preescolar");
    });

    it("preselecciona el nivel recibido al editar", () => {
        render(<FormularioCurso {...PROPS_BASE} editId={21} nivel="preescolar" />);

        expect(screen.getByDisplayValue("Preescolar")).toBeInTheDocument();
    });
});
