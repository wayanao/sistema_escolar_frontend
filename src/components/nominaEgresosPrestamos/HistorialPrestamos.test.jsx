import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HistorialPrestamos from "./HistorialPrestamos";

const profesores = [
    { id: 3, nombre: "Ana", apellido: "Pérez" },
    { id: 4, nombre: "Luis", apellido: "Gómez" },
];

const prestamos = [
    {
        id: 90,
        profesor_nombre: "Pérez Ana",
        monto: 500000,
        fecha: "2026-07-10",
        estado: "Pendiente",
    },
    {
        id: 91,
        profesor_nombre: "Pérez Ana",
        monto: 200000,
        fecha: "2026-06-05",
        estado: "Pagado",
    },
];

const render_ = (props) =>
    render(
        <HistorialPrestamos
            prestamos={prestamos}
            profesores={profesores}
            cargando={false}
            cargandoProfesores={false}
            historialConsultado
            total={500000}
            profesorFiltro="3"
            onCambiarFiltro={vi.fn()}
            onBuscar={vi.fn()}
            onLimpiar={vi.fn()}
            onSaldar={vi.fn()}
            {...props}
        />
    );

describe("HistorialPrestamos", () => {
    it("muestra el recuadro inicial mientras no se ha consultado", () => {
        render_({ historialConsultado: false, prestamos: [], total: 0, profesorFiltro: "" });

        expect(
            screen.getByText("Selecciona un profesor o trabajador para ver su historial de préstamos.")
        ).toBeInTheDocument();
        expect(
            screen.getByText("El historial no se carga automáticamente al abrir la página.")
        ).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("muestra el total por cobrar y distingue pendiente de saldado", () => {
        render_();

        expect(screen.getByText("Total por Cobrar: $ 500.000")).toBeInTheDocument();
        expect(screen.getByText("Pendiente")).toHaveClass("bg-yellow-100");
        expect(screen.getByText("Pagado")).toHaveClass("bg-green-100");
        expect(screen.getAllByRole("button", { name: "Saldar" })).toHaveLength(1);
        expect(screen.getByText("Saldado")).toBeInTheDocument();
    });

    it("avisa cuando el profesor consultado no tiene préstamos", () => {
        render_({ prestamos: [], total: 0 });

        expect(screen.getByText("No hay préstamos registrados.")).toBeInTheDocument();
    });

    it("informa el préstamo a saldar y las acciones del filtro", () => {
        const onSaldar = vi.fn();
        const onCambiarFiltro = vi.fn();
        const onBuscar = vi.fn();
        const onLimpiar = vi.fn();
        render_({ onSaldar, onCambiarFiltro, onBuscar, onLimpiar });

        fireEvent.click(screen.getByRole("button", { name: "Saldar" }));
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "4" } });
        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
        fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));

        expect(onSaldar).toHaveBeenCalledWith(prestamos[0]);
        expect(onCambiarFiltro).toHaveBeenCalledWith("4");
        expect(onBuscar).toHaveBeenCalledTimes(1);
        expect(onLimpiar).toHaveBeenCalledTimes(1);
    });

    it("muestra su indicador de carga con el círculo", () => {
        render_({ cargando: true });

        expect(screen.getByText("Cargando préstamos...")).toBeInTheDocument();
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("mientras salda un préstamo, su botón lo dice y los demás esperan", () => {
        const otroPendiente = { ...prestamos[0], id: 92, fecha: "2026-08-01" };
        render_({ prestamos: [prestamos[0], otroPendiente], saldandoId: 90, bloqueado: true });

        expect(screen.getByRole("button", { name: "Saldando..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Saldar" })).toBeDisabled();
    });

    it("resalta el préstamo indicado y marca cada fila con su número", () => {
        const container = render_({ resaltadoId: 91 }).container;

        expect(container.querySelector('[data-prestamo-id="91"]')).toHaveClass("bg-green-50");
        expect(container.querySelector('[data-prestamo-id="90"]')).not.toHaveClass("bg-green-50");
    });

    it("al actualizar conserva la tabla y lo avisa", () => {
        render_({ actualizando: true });

        expect(screen.getByRole("status")).toHaveTextContent("Actualizando...");
        expect(screen.getByRole("table")).toBeInTheDocument();
    });
});
