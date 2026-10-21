import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FormularioPrestamo from "./FormularioPrestamo";

const profesores = [
    { id: 3, nombre: "Ana", apellido: "Pérez", documento_identidad: "1001" },
    { id: 4, nombre: "Luis", apellido: "Gómez", documento_identidad: "1002" },
];

const formulario = { profesorId: "3", monto: "500000", fecha: "2026-08-01", notas: "Quincena" };

const render_ = (props) =>
    render(
        <FormularioPrestamo
            formulario={formulario}
            profesores={profesores}
            cargandoProfesores={false}
            onCambiarCampo={vi.fn()}
            onEnviar={vi.fn()}
            {...props}
        />
    );

describe("FormularioPrestamo", () => {
    it("lista los profesores con su documento y refleja el formulario", () => {
        render_();

        expect(screen.getByRole("option", { name: "Pérez Ana - 1001" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Gómez Luis - 1002" })).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveValue("3");
        expect(screen.getByDisplayValue("500000")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Quincena")).toBeInTheDocument();
    });

    it("deshabilita el selector mientras cargan los profesores y lo dice", () => {
        render_({ cargandoProfesores: true });

        expect(screen.getByRole("combobox")).toBeDisabled();
        expect(screen.getByRole("option", { name: "Cargando profesores..." })).toBeInTheDocument();
    });

    it("mientras registra dice Registrando préstamo... y bloquea campos y botón", () => {
        render_({ registrando: true });

        const boton = screen.getByRole("button", { name: "Registrando préstamo..." });
        expect(boton).toBeDisabled();
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeDisabled();
        expect(screen.getByPlaceholderText("Ej. 500000")).toBeDisabled();
    });

    it("con otra operación en curso, el botón espera", () => {
        render_({ bloqueado: true });

        expect(screen.getByRole("button", { name: "Registrar Préstamo" })).toBeDisabled();
    });

    it("informa cada campo modificado", () => {
        const onCambiarCampo = vi.fn();
        render_({ onCambiarCampo });

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "4" } });
        fireEvent.change(screen.getByPlaceholderText("Ej. 500000"), {
            target: { value: "1000" },
        });

        expect(onCambiarCampo).toHaveBeenCalledWith("profesorId", "4");
        expect(onCambiarCampo).toHaveBeenCalledWith("monto", "1000");
    });

    it("envía el formulario al registrar", () => {
        const onEnviar = vi.fn((e) => e.preventDefault());
        render_({ onEnviar });

        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        expect(onEnviar).toHaveBeenCalledTimes(1);
    });
});
