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
        expect(screen.getByText("$ 400")).toHaveClass("text-red-500");
        expect(screen.getByText("$ 1.525")).toBeInTheDocument();
        expect(screen.getByText("Máx: $ 400")).toBeInTheDocument();
    });

    it("deshabilita el abono cuando no hay deuda y explica por qué", () => {
        render_({ empleado: { ...empleado, saldo_prestamos: 0 } });

        const [, , abono] = screen.getAllByRole("spinbutton");
        expect(abono).toBeDisabled();
        expect(screen.queryByText(/^Máx:/)).not.toBeInTheDocument();
        expect(screen.getByText("Sin préstamos pendientes")).toBeInTheDocument();
        expect(screen.getByText("$ 0")).toHaveClass("text-green-500");
    });

    it("avisa mientras se escribe lo que impide pagar y el botón espera", () => {
        render_({
            problemas: {
                abono: "No puede ser mayor que la deuda ($ 400).",
                total: "El total a pagar no puede ser negativo.",
            },
        });

        expect(screen.getByText("No puede ser mayor que la deuda ($ 400).")).toBeInTheDocument();
        expect(screen.getByText("El total a pagar no puede ser negativo.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirmar Pago" })).toBeDisabled();
    });

    it("es un diálogo con nombre que recibe el foco al abrir", () => {
        render_();

        expect(screen.getByRole("dialog", { name: "Procesar Pago Nómina" })).toHaveFocus();
    });

    it("Esc cierra, salvo mientras registra", () => {
        const onCerrar = vi.fn();
        const { rerender } = render_({ onCerrar });

        fireEvent.keyDown(document, { key: "Escape" });
        expect(onCerrar).toHaveBeenCalledTimes(1);

        rerender(
            <ModalPagoNomina
                empleado={empleado}
                formulario={formulario}
                totalNeto={1525}
                registrando
                onCambiarCampo={vi.fn()}
                onCerrar={onCerrar}
                onEnviar={vi.fn()}
            />
        );
        fireEvent.keyDown(document, { key: "Escape" });
        expect(onCerrar).toHaveBeenCalledTimes(1);
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

        fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        expect(onCerrar).toHaveBeenCalledTimes(2);
        expect(onEnviar).toHaveBeenCalledTimes(1);
    });

    it("mientras registra, dice Registrando pago... y bloquea los campos y los tres botones", () => {
        render_({ registrando: true });

        const enviar = screen.getByRole("button", { name: "Registrando pago..." });
        expect(enviar).toBeDisabled();
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
        for (const campo of screen.getAllByRole("spinbutton")) {
            expect(campo).toBeDisabled();
        }
        expect(screen.getByPlaceholderText("Mes de Marzo 2026...")).toBeDisabled();
        expect(screen.queryByRole("button", { name: "Confirmar Pago" })).not.toBeInTheDocument();
    });
});
