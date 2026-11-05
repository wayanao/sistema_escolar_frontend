import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FormularioMateria from "./FormularioMateria";

const PROPS_BASE = {
    editId: null,
    nombre: "",
    estado: "activo",
    onActualizarCampo: vi.fn(),
    onCancelarEdicion: vi.fn(),
    onGuardar: vi.fn(),
};

describe("FormularioMateria", () => {
    it("presenta la creación y delega campos y guardado", async () => {
        const onActualizarCampo = vi.fn();
        const onGuardar = vi.fn();
        const user = userEvent.setup();
        render(
            <FormularioMateria
                {...PROPS_BASE}
                onActualizarCampo={onActualizarCampo}
                onGuardar={onGuardar}
            />,
        );

        expect(screen.getByText("📚 Crear Materia")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Matemáticas, Biología..."), {
            target: { value: "Ciencias" },
        });
        await user.selectOptions(screen.getByDisplayValue("Activo"), "inactivo");
        await user.click(screen.getByRole("button", { name: "Crear Materia" }));

        expect(onActualizarCampo).toHaveBeenCalledWith("nombre", "Ciencias");
        expect(onActualizarCampo).toHaveBeenCalledWith("estado", "inactivo");
        expect(onGuardar).toHaveBeenCalledTimes(1);
    });

    it("presenta la edición y delega cancelación", async () => {
        const onCancelarEdicion = vi.fn();
        const user = userEvent.setup();
        render(
            <FormularioMateria
                {...PROPS_BASE}
                editId={31}
                nombre="MATEMÁTICAS"
                estado="inactivo"
                onCancelarEdicion={onCancelarEdicion}
            />,
        );

        expect(screen.getByText("📚 Editar Materia")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Matemáticas, Biología...")).toHaveValue("MATEMÁTICAS");
        expect(screen.getByRole("button", { name: "Actualizar Materia" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(onCancelarEdicion).toHaveBeenCalledTimes(1);
    });

    it("mientras guarda, el botón dice «Guardando...» y no se puede pulsar", async () => {
        const onGuardar = vi.fn();
        const user = userEvent.setup();
        render(<FormularioMateria {...PROPS_BASE} guardando onGuardar={onGuardar} />);

        expect(screen.queryByRole("button", { name: "Crear Materia" })).not.toBeInTheDocument();
        const boton = screen.getByRole("button", { name: "Guardando..." });
        expect(boton).toBeDisabled();
        await user.click(boton);
        expect(onGuardar).not.toHaveBeenCalled();
    });
});
