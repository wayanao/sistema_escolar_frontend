import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FormularioEgreso from "./FormularioEgreso";

const formulario = {
    concepto: "Papelería",
    monto: "150.5",
    fecha: "2026-08-05",
    categoria: "Compras Institucionales",
    notas: "Factura 12",
};

const render_ = (props) =>
    render(
        <FormularioEgreso
            formulario={formulario}
            editando={false}
            onCambiarCampo={vi.fn()}
            onEnviar={vi.fn()}
            onCancelarEdicion={vi.fn()}
            {...props}
        />
    );

describe("FormularioEgreso", () => {
    it("ofrece las cuatro categorías y el modo registro", () => {
        render_();

        expect(screen.getByText("Registrar Nuevo Egreso")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Registrar Egreso" })).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Cancelar edición" })
        ).not.toBeInTheDocument();
        expect(screen.getAllByRole("option")).toHaveLength(4);
        expect(screen.getByRole("option", { name: "Mantenimiento" })).toBeInTheDocument();
    });

    it("cambia encabezado y botones en modo edición", () => {
        render_({ editando: true });

        expect(screen.getByText("Editar Egreso")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Actualizar Egreso" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar edición" })).toBeInTheDocument();
    });

    it("refleja los valores del formulario recibido", () => {
        render_();

        expect(screen.getByDisplayValue("Papelería")).toBeInTheDocument();
        expect(screen.getByDisplayValue("150.5")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Factura 12")).toBeInTheDocument();
        expect(screen.getByDisplayValue("2026-08-05")).toBeInTheDocument();
    });

    it("informa cada campo modificado y la cancelación de la edición", () => {
        const onCambiarCampo = vi.fn();
        const onCancelarEdicion = vi.fn();
        render_({ editando: true, onCambiarCampo, onCancelarEdicion });

        fireEvent.change(screen.getByPlaceholderText("Ej. Compra de papelería"), {
            target: { value: "Aseo" },
        });
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "Otros" } });
        fireEvent.click(screen.getByRole("button", { name: "Cancelar edición" }));

        expect(onCambiarCampo).toHaveBeenCalledWith("concepto", "Aseo");
        expect(onCambiarCampo).toHaveBeenCalledWith("categoria", "Otros");
        expect(onCancelarEdicion).toHaveBeenCalledTimes(1);
    });
});
