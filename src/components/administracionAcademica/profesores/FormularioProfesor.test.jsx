import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FormularioProfesor from "./FormularioProfesor";

const PROPS_BASE = {
    editId: null,
    nombre: "",
    apellido: "",
    documentoIdentidad: "",
    email: "",
    telefono: "",
    password: "",
    sueldo: "",
    estado: "activo",
    onActualizarCampo: vi.fn(),
    onCancelarEdicion: vi.fn(),
    onGuardar: vi.fn(),
};

describe("FormularioProfesor", () => {
    it("presenta la creación y delega campos y guardado", () => {
        const onActualizarCampo = vi.fn();
        const onGuardar = vi.fn();
        render(
            <FormularioProfesor
                {...PROPS_BASE}
                onActualizarCampo={onActualizarCampo}
                onGuardar={onGuardar}
            />,
        );

        expect(screen.getByText("👨‍🏫 Crear Profesor")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText("Nombre"), {
            target: { value: "Ana" },
        });
        fireEvent.change(screen.getByPlaceholderText("Ej. 1200.50"), {
            target: { value: "1200.50" },
        });
        fireEvent.submit(screen.getByRole("button", { name: "Crear Profesor" }).closest("form"));

        expect(onActualizarCampo).toHaveBeenCalledWith("nombre", "Ana");
        expect(onActualizarCampo).toHaveBeenCalledWith("sueldo", "1200.50");
        expect(onGuardar).toHaveBeenCalledTimes(1);
    });

    it("presenta la edición y delega estado y cancelación", async () => {
        const onActualizarCampo = vi.fn();
        const onCancelarEdicion = vi.fn();
        const user = userEvent.setup();
        render(
            <FormularioProfesor
                {...PROPS_BASE}
                editId={11}
                nombre="ANA"
                estado="inactivo"
                onActualizarCampo={onActualizarCampo}
                onCancelarEdicion={onCancelarEdicion}
            />,
        );

        expect(screen.getByText("👨‍🏫 Editar Profesor")).toBeInTheDocument();
        expect(screen.getByText(/dejar vacío para no cambiar/)).toBeInTheDocument();

        await user.selectOptions(screen.getByDisplayValue("Inactivo"), "activo");
        await user.click(screen.getByRole("button", { name: "Cancelar" }));

        expect(onActualizarCampo).toHaveBeenCalledWith("estado", "activo");
        expect(onCancelarEdicion).toHaveBeenCalledTimes(1);
    });

    it("mientras guarda, el botón dice «Guardando...» y no se puede pulsar", async () => {
        const onGuardar = vi.fn();
        const user = userEvent.setup();
        render(<FormularioProfesor {...PROPS_BASE} guardando onGuardar={onGuardar} />);

        expect(screen.queryByRole("button", { name: "Crear Profesor" })).not.toBeInTheDocument();
        const boton = screen.getByRole("button", { name: "Guardando..." });
        expect(boton).toBeDisabled();
        await user.click(boton);
        expect(onGuardar).not.toHaveBeenCalled();
    });
});
