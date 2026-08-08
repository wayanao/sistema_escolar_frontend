import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NominaAdmin from "./NominaAdmin";

const { apiMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

const empleados = [
    {
        id: 1,
        nombre: "ana",
        apellido: "pérez",
        documento: "1001",
        sueldo: 1500,
        saldo_prestamos: 400,
    },
    {
        id: 2,
        nombre: "luis",
        apellido: "gómez",
        documento: "1002",
        sueldo: 900,
        saldo_prestamos: 0,
    },
];

const historial = [
    {
        id: 55,
        fecha: "2026-07-31",
        profesor: "Pérez Ana",
        salario_base: 1500,
        deduccion_prestamos: 100,
        otros_descuentos: 0,
        bonificaciones: 50,
        total_pagado: 1450,
        notas: "Julio",
    },
];

const abrirPagoDelPrimero = async () => {
    await screen.findByText("pérez ana");
    fireEvent.click(screen.getAllByRole("button", { name: "Realizar Pago" })[0]);
};

describe("NominaAdmin", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        apiMock.get.mockImplementation((url) => {
            if (url === "/api/nomina/empleados") return Promise.resolve({ data: empleados });
            if (url === "/api/nomina/historial") return Promise.resolve({ data: historial });
            throw new Error(`GET inesperado: ${url}`);
        });
        apiMock.post.mockResolvedValue({ data: { nomina_id: 77 } });
    });

    it("carga empleados e historial en paralelo y oculta el historial hasta buscar", async () => {
        render(<NominaAdmin />);

        expect(await screen.findByText("pérez ana")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/api/nomina/empleados");
        expect(apiMock.get).toHaveBeenCalledWith("/api/nomina/historial");
        expect(apiMock.get).toHaveBeenCalledTimes(2);
        expect(screen.getByText("1001")).toBeInTheDocument();
        expect(screen.getByText("gómez luis")).toBeInTheDocument();
        expect(screen.getByText("$400.00")).toBeInTheDocument();
        expect(screen.getByText("$0.00")).toBeInTheDocument();
        expect(
            screen.getByText("🔍 Escriba el nombre de un empleado para ver su historial de pagos.")
        ).toBeInTheDocument();
        expect(screen.queryByText("#N-55")).not.toBeInTheDocument();
    });

    it("muestra el error de carga y el estado vacío cuando falla la consulta", async () => {
        apiMock.get.mockRejectedValue(new Error("sin conexión"));

        render(<NominaAdmin />);

        expect(
            await screen.findByText("No se pudo cargar la información de nómina.")
        ).toBeInTheDocument();
        expect(screen.getByText("No se encontraron empleados registrados.")).toBeInTheDocument();
    });

    it("precarga el sueldo como salario base y recalcula el neto a depositar", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        expect(screen.getByText("Procesar Pago Nómina")).toBeInTheDocument();
        expect(screen.getByDisplayValue("1500")).toBeInTheDocument();
        expect(screen.getByText("$1500.00")).toBeInTheDocument();
        expect(screen.getByText("Máx: 400")).toBeInTheDocument();

        const [, bonos, abono, otros] = screen.getAllByRole("spinbutton");
        fireEvent.change(bonos, { target: { value: "100" } });
        fireEvent.change(abono, { target: { value: "50" } });
        fireEvent.change(otros, { target: { value: "25" } });

        expect(screen.getByText("$1525.00")).toBeInTheDocument();
    });

    it("impide registrar un pago cuyo total neto es negativo", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        const [salario, , , otros] = screen.getAllByRole("spinbutton");
        fireEvent.change(salario, { target: { value: "100" } });
        fireEvent.change(otros, { target: { value: "500" } });
        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        expect(window.alert).toHaveBeenCalledWith("El total a pagar no puede ser negativo.");
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("impide abonar más de la deuda pendiente del empleado", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        const [, , abono] = screen.getAllByRole("spinbutton");
        fireEvent.change(abono, { target: { value: "500" } });
        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        expect(window.alert).toHaveBeenCalledWith(
            "El abono al préstamo ($500) no puede ser mayor que su deuda pendiente ($400)."
        );
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("registra el pago con el contrato del backend, cierra el modal y recarga", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        const [, bonos, abono, otros] = screen.getAllByRole("spinbutton");
        fireEvent.change(bonos, { target: { value: "100" } });
        fireEvent.change(abono, { target: { value: "50" } });
        fireEvent.change(otros, { target: { value: "25" } });
        fireEvent.change(screen.getByPlaceholderText("Mes de Marzo 2026..."), {
            target: { value: "Marzo 2026" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/nomina/pagar", {
                profesor_id: 1,
                salario_base: 1500,
                deduccion_prestamos: 50,
                otros_descuentos: 25,
                bonificaciones: 100,
                notas: "Marzo 2026",
            });
        });
        expect(window.alert).toHaveBeenCalledWith(
            "Pago de nómina registrado exitosamente y préstamos abonados."
        );
        await waitFor(() => {
            expect(screen.queryByText("Procesar Pago Nómina")).not.toBeInTheDocument();
        });
        expect(apiMock.get).toHaveBeenCalledTimes(4);
    });

    it("conserva el modal abierto y avisa cuando el backend rechaza el pago", async () => {
        apiMock.post.mockRejectedValue(new Error("500"));

        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(
                "Ocurrió un error al procesar el pago de nómina."
            );
        });
        expect(screen.getByText("Procesar Pago Nómina")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(2);
    });

    it("filtra el historial por el nombre del empleado buscado", async () => {
        render(<NominaAdmin />);
        await screen.findByText("pérez ana");

        const buscador = screen.getByPlaceholderText("Buscar por empleado...");
        fireEvent.change(buscador, { target: { value: "pérez" } });

        expect(screen.getByText("#N-55")).toBeInTheDocument();
        expect(screen.getByText("2026-07-31")).toBeInTheDocument();
        expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
        expect(screen.getByText("$1450.00")).toBeInTheDocument();

        fireEvent.change(buscador, { target: { value: "zzz" } });

        expect(screen.getByText("No hay pagos registrados para este empleado.")).toBeInTheDocument();
        expect(screen.queryByText("#N-55")).not.toBeInTheDocument();
    });

    it("deshabilita el abono cuando el empleado no tiene deuda", async () => {
        render(<NominaAdmin />);
        await screen.findByText("gómez luis");
        fireEvent.click(screen.getAllByRole("button", { name: "Realizar Pago" })[1]);

        const [, , abono] = screen.getAllByRole("spinbutton");
        expect(abono).toBeDisabled();
        expect(screen.queryByText(/^Máx:/)).not.toBeInTheDocument();
        expect(screen.getByDisplayValue("900")).toBeInTheDocument();
        expect(screen.getByText("$900.00")).toBeInTheDocument();
    });
});
