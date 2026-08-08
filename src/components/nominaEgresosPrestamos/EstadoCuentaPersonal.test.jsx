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
        expect(screen.getByText("$400.00")).toHaveClass("text-red-600");
        expect(screen.getByText("$0.00")).toHaveClass("text-green-600");
    });

    it("informa el empleado elegido al pedir el pago", () => {
        const onPagar = vi.fn();
        render(<EstadoCuentaPersonal empleados={empleados} cargando={false} onPagar={onPagar} />);

        fireEvent.click(screen.getAllByRole("button", { name: "Realizar Pago" })[1]);

        expect(onPagar).toHaveBeenCalledWith(empleados[1]);
    });
});
