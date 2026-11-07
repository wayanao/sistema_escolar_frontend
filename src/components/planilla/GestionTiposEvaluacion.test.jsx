import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GestionTiposEvaluacion from "./GestionTiposEvaluacion";

const formatearEtiquetaColumna = (valor) => (valor === "quiz" ? "Quiz" : valor);

function renderComponente(overrides = {}) {
    const props = {
        nuevoTipo: "",
        onCambiarNuevoTipo: vi.fn(),
        onAgregarTipo: vi.fn(),
        tipoEliminar: "",
        onCambiarTipoEliminar: vi.fn(),
        onEliminarTipo: vi.fn(),
        columnas: ["quiz"],
        accionTipoEnCurso: null,
        formatearEtiquetaColumna,
        ...overrides,
    };
    render(<GestionTiposEvaluacion {...props} />);
    return props;
}

describe("GestionTiposEvaluacion", () => {
    it("notifica el nuevo tipo escrito y dispara el alta al hacer clic en Agregar Tipo", async () => {
        const user = userEvent.setup();
        const props = renderComponente();

        fireEvent.change(screen.getByPlaceholderText("Ej: Quiz, Taller..."), {
            target: { value: "Cuaderno" },
        });
        expect(props.onCambiarNuevoTipo).toHaveBeenCalledWith("Cuaderno");

        await user.click(screen.getByRole("button", { name: "Agregar Tipo" }));
        expect(props.onAgregarTipo).toHaveBeenCalledTimes(1);
    });

    it("lista las columnas para eliminar y notifica la selección elegida", async () => {
        const user = userEvent.setup();
        const props = renderComponente({ columnas: ["quiz", "trabajo grupal"] });

        const select = screen.getByRole("combobox");
        expect(screen.getByRole("option", { name: "Seleccionar tipo" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Quiz" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "trabajo grupal" })).toBeInTheDocument();

        await user.selectOptions(select, "quiz");
        expect(props.onCambiarTipoEliminar).toHaveBeenCalledWith("quiz");

        await user.click(screen.getByRole("button", { name: "Eliminar Tipo" }));
        expect(props.onEliminarTipo).toHaveBeenCalledTimes(1);
    });

    it("deshabilita ambos controles mientras una acción está en curso; la espera va en la tarjeta", () => {
        renderComponente({ accionTipoEnCurso: "agregar" });

        // Una sola espera (2026-11-07): el botón ya no dice «Agregando...».
        expect(screen.getByPlaceholderText("Ej: Quiz, Taller...")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Agregar Tipo" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Agregar Tipo" })).toHaveAttribute("aria-busy", "true");
        expect(screen.queryByText("Agregando...")).not.toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Eliminar Tipo" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Eliminar Tipo" })).toHaveAttribute("aria-busy", "false");
    });

    // Porcentajes por tipo de nota, paso B4b (PB9): un campo opcional al crear.
    it("sin el manejador del porcentaje no muestra el campo, como antes", () => {
        renderComponente();
        expect(screen.queryByLabelText("Porcentaje (%)")).not.toBeInTheDocument();
    });

    it("con el manejador muestra el campo opcional y avisa lo que se escribe", () => {
        const onCambiarNuevoPorcentaje = vi.fn();
        renderComponente({ nuevoPorcentaje: "", onCambiarNuevoPorcentaje });

        const campo = screen.getByLabelText("Porcentaje (%)");
        expect(campo).toHaveAttribute("placeholder", "Opcional");
        fireEvent.change(campo, { target: { value: "40" } });
        expect(onCambiarNuevoPorcentaje).toHaveBeenCalledWith("40");
    });

    it("el campo del porcentaje también se bloquea mientras una acción está en curso", () => {
        renderComponente({
            nuevoPorcentaje: "40",
            onCambiarNuevoPorcentaje: vi.fn(),
            accionTipoEnCurso: "agregar",
        });
        expect(screen.getByLabelText("Porcentaje (%)")).toBeDisabled();
    });
});
