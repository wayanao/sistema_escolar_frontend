import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HistorialEgresos from "./HistorialEgresos";

const egresos = [
    {
        id: 10,
        concepto: "Papelería",
        monto: 150.5,
        fecha: "2026-08-05",
        categoria: "Compras Institucionales",
        origen: "manual",
        editable: true,
    },
    {
        id: 11,
        concepto: "Pago de Nómina",
        monto: 1200,
        fecha: "2026-08-05",
        categoria: "Pago Nomina",
        origen: "nomina",
        editable: false,
    },
];

const render_ = (props) => {
    const { container } = render(
        <HistorialEgresos
            egresos={egresos}
            cargando={false}
            total={1350.5}
            fechaDesde="2026-08-01"
            fechaHasta="2026-08-10"
            onCambiarDesde={vi.fn()}
            onCambiarHasta={vi.fn()}
            onBuscar={vi.fn()}
            onFiltrarHoy={vi.fn()}
            onEditar={vi.fn()}
            {...props}
        />
    );
    return container;
};

describe("HistorialEgresos", () => {
    it("muestra el total del rango y las filas con su monto", () => {
        render_();

        expect(screen.getByText("Total: $1350.50")).toBeInTheDocument();
        expect(screen.getByText("$150.50")).toBeInTheDocument();
        expect(screen.getByText("$1200.00")).toBeInTheDocument();
    });

    it("solo ofrece editar los egresos manuales", () => {
        const onEditar = vi.fn();
        render_({ onEditar });

        expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1);
        expect(screen.getByText("Automático")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Editar" }));
        expect(onEditar).toHaveBeenCalledWith(egresos[0]);
    });

    it("muestra la carga y el estado vacío", () => {
        render_({ cargando: true });
        expect(screen.getByText("Cargando egresos...")).toBeInTheDocument();

        render_({ egresos: [], total: 0 });
        expect(
            screen.getByText("No hay egresos registrados para las fechas seleccionadas.")
        ).toBeInTheDocument();
    });

    it("informa los cambios del rango y las dos acciones del filtro", () => {
        const onCambiarDesde = vi.fn();
        const onCambiarHasta = vi.fn();
        const onBuscar = vi.fn();
        const onFiltrarHoy = vi.fn();
        const container = render_({ onCambiarDesde, onCambiarHasta, onBuscar, onFiltrarHoy });

        const fechas = container.querySelectorAll('input[type="date"]');
        expect(fechas[0]).toHaveValue("2026-08-01");
        expect(fechas[1]).toHaveValue("2026-08-10");

        fireEvent.change(fechas[0], { target: { value: "2026-08-02" } });
        fireEvent.change(fechas[1], { target: { value: "2026-08-09" } });
        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
        fireEvent.click(screen.getByRole("button", { name: "Hoy" }));

        expect(onCambiarDesde).toHaveBeenCalledWith("2026-08-02");
        expect(onCambiarHasta).toHaveBeenCalledWith("2026-08-09");
        expect(onBuscar).toHaveBeenCalledTimes(1);
        expect(onFiltrarHoy).toHaveBeenCalledTimes(1);
    });
});
