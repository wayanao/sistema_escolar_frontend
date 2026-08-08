import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalPagoNomina from "./ModalPagoNomina";

const empleado = { id: 1, nombre: "ana", apellido: "pérez", saldo_prestamos: 400 };

const formulario = {
    salarioBase: "1500",
    bonificaciones: "100",
    abonoPrestamo: "50",
    otrosDescuentos: "25",
    notas: "Marzo 2026",
};

const render_ = (props) =>
    render(
        <ModalPagoNomina
            empleado={empleado}
            formulario={formulario}
            totalNeto={1525}
            onCambiarCampo={vi.fn()}
            onCerrar={vi.fn()}
            onEnviar={vi.fn()}
            {...props}
        />
    );

describe("ModalPagoNomina", () => {
    it("muestra el empleado, su deuda y el neto calculado", () => {
        render_();

        expect(screen.getByText("Procesar Pago Nómina")).toBeInTheDocument();
        expect(screen.getByText("ana pérez")).toBeInTheDocument();
        expect(screen.getByText("$400.00")).toHaveClass("text-red-500");
        expect(screen.getByText("$1525.00")).toBeInTheDocument();
        expect(screen.getByText("Máx: 400")).toBeInTheDocument();
    });

    it("deshabilita el abono y oculta la ayuda cuando no hay deuda", () => {
        render_({ empleado: { ...empleado, saldo_prestamos: 0 } });

        const [, , abono] = screen.getAllByRole("spinbutton");
        expect(abono).toBeDisabled();
        expect(screen.queryByText(/^Máx:/)).not.toBeInTheDocument();
        expect(screen.getByText("$0.00")).toHaveClass("text-green-500");
    });

    it("informa el campo modificado", () => {
        const onCambiarCampo = vi.fn();
        render_({ onCambiarCampo });

        const [, bonos] = screen.getAllByRole("spinbutton");
        fireEvent.change(bonos, { target: { value: "300" } });

        expect(onCambiarCampo).toHaveBeenCalledWith("bonificaciones", "300");
    });

    it("cierra desde la equis y desde Cancelar, y envía el formulario", () => {
        const onCerrar = vi.fn();
        const onEnviar = vi.fn((e) => e.preventDefault());
        render_({ onCerrar, onEnviar });

        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        expect(onCerrar).toHaveBeenCalledTimes(1);
        expect(onEnviar).toHaveBeenCalledTimes(1);
    });
});
