import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HistorialNomina from "./HistorialNomina";

const pagos = [
    {
        id: 55,
        fecha: "2026-07-31",
        profesor: "Pérez Ana",
        salario_base: 1500,
        deduccion_prestamos: 100,
        bonificaciones: 50,
        total_pagado: 1450,
    },
];

const render_ = (props) =>
    render(
        <HistorialNomina
            pagos={pagos}
            cargando={false}
            hayBusqueda
            busqueda="pérez"
            onCambiarBusqueda={vi.fn()}
            {...props}
        />
    );

describe("HistorialNomina", () => {
    it("pide escribir un nombre mientras no hay búsqueda", () => {
        render_({ hayBusqueda: false, busqueda: "", pagos: [] });

        expect(
            screen.getByText("🔍 Escriba el nombre de un empleado para ver su historial de pagos.")
        ).toBeInTheDocument();
        expect(screen.queryByText("#N-55")).not.toBeInTheDocument();
    });

    it("avisa cuando la búsqueda no encuentra pagos", () => {
        render_({ pagos: [] });

        expect(screen.getByText("No hay pagos registrados para este empleado.")).toBeInTheDocument();
    });

    it("muestra la fila del pago con sus cuatro montos", () => {
        render_();

        expect(screen.getByText("#N-55")).toBeInTheDocument();
        expect(screen.getByText("2026-07-31")).toBeInTheDocument();
        expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
        expect(screen.getByText("$1500.00")).toBeInTheDocument();
        expect(screen.getByText("$100.00")).toBeInTheDocument();
        expect(screen.getByText("$50.00")).toBeInTheDocument();
        expect(screen.getByText("$1450.00")).toBeInTheDocument();
    });

    it("informa cada cambio del buscador y conserva su indicador de carga", () => {
        const onCambiarBusqueda = vi.fn();
        render_({ onCambiarBusqueda, cargando: true });

        expect(screen.getByText("Cargando historial...")).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText("Buscar por empleado..."), {
            target: { value: "gómez" },
        });

        expect(onCambiarBusqueda).toHaveBeenCalledWith("gómez");
    });
});
