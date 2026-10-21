import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EstadoCuentaPersonal from "./EstadoCuentaPersonal";

const empleados = [
    { id: 1, nombre: "ana", apellido: "pérez", documento: "1001", saldo_prestamos: 400 },
    { id: 2, nombre: "luis", apellido: "gómez", documento: "1002", saldo_prestamos: 0 },
];

describe("EstadoCuentaPersonal", () => {
    it("muestra el indicador de carga en lugar de la tabla", () => {
        render(<EstadoCuentaPersonal empleados={[]} cargando onPagar={vi.fn()} />);

        expect(screen.getByText("Cargando datos...")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("muestra el estado vacío cuando no hay personal", () => {
        render(<EstadoCuentaPersonal empleados={[]} cargando={false} onPagar={vi.fn()} />);

        expect(screen.getByText("No se encontraron empleados registrados.")).toBeInTheDocument();
    });

    it("pinta el saldo en rojo con deuda y en verde sin ella", () => {
        render(<EstadoCuentaPersonal empleados={empleados} cargando={false} onPagar={vi.fn()} />);

        expect(screen.getByText("1001")).toBeInTheDocument();
        expect(screen.getByText("pérez ana")).toBeInTheDocument();
        expect(screen.getByText("$ 400")).toHaveClass("text-red-600");
        expect(screen.getByText("$ 0")).toHaveClass("text-green-600");
    });

    it("informa el empleado elegido al pedir el pago", () => {
        const onPagar = vi.fn();
        render(<EstadoCuentaPersonal empleados={empleados} cargando={false} onPagar={onPagar} />);

        fireEvent.click(screen.getAllByRole("button", { name: "Realizar Pago" })[1]);

        expect(onPagar).toHaveBeenCalledWith(empleados[1]);
    });

    it("muestra el círculo mientras carga la primera vez", () => {
        render(<EstadoCuentaPersonal empleados={[]} cargando onPagar={vi.fn()} />);

        expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("al actualizar conserva la tabla, avisa que actualiza y espera para pagar", () => {
        render(
            <EstadoCuentaPersonal
                empleados={empleados}
                cargando={false}
                actualizando
                onPagar={vi.fn()}
            />
        );

        expect(screen.getByRole("status")).toHaveTextContent("Actualizando...");
        expect(screen.getByText("pérez ana")).toBeInTheDocument();
        for (const boton of screen.getAllByRole("button", { name: "Realizar Pago" })) {
            expect(boton).toBeDisabled();
        }
    });

    it("marca a quien se le pagó en esta visita y resalta el último pago", () => {
        render(
            <EstadoCuentaPersonal
                empleados={empleados}
                cargando={false}
                pagosRegistrados={{ 1: 77, 2: null }}
                ultimoPagadoId={1}
                onPagar={vi.fn()}
            />
        );

        expect(screen.getByText("✓ Pago #N-77 registrado")).toBeInTheDocument();
        expect(screen.getByText("✓ Pago registrado")).toBeInTheDocument();
        const [filaAna, filaLuis] = screen.getAllByRole("row").slice(1);
        expect(filaAna).toHaveClass("bg-green-50");
        expect(filaLuis).not.toHaveClass("bg-green-50");
    });
});
