import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NominaAdmin from "./NominaAdmin";

const { apiMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn() },
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

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

const consultasNormales = (url) => {
    if (url === "/api/nomina/empleados") return Promise.resolve({ data: empleados });
    if (url === "/api/nomina/historial") return Promise.resolve({ data: historial });
    throw new Error(`GET inesperado: ${url}`);
};

const abrirPagoDelPrimero = async () => {
    await screen.findByText("pérez ana");
    fireEvent.click(screen.getAllByRole("button", { name: "Realizar Pago" })[0]);
};

const avisoCon = (campos) => expect.objectContaining(campos);

describe("NominaAdmin", () => {
    beforeEach(() => {
        apiMock.get.mockImplementation(consultasNormales);
        apiMock.post.mockResolvedValue({ data: { nomina_id: 77 } });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
    });

    it("carga empleados e historial en paralelo y oculta el historial hasta buscar", async () => {
        render(<NominaAdmin />);

        expect(await screen.findByText("pérez ana")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/api/nomina/empleados");
        expect(apiMock.get).toHaveBeenCalledWith("/api/nomina/historial");
        expect(apiMock.get).toHaveBeenCalledTimes(2);
        expect(screen.getByText("1001")).toBeInTheDocument();
        expect(screen.getByText("gómez luis")).toBeInTheDocument();
        expect(screen.getByText("$ 400")).toBeInTheDocument();
        expect(screen.getByText("$ 0")).toBeInTheDocument();
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

    it("Reintentar vuelve a consultar y quita el error", async () => {
        apiMock.get.mockRejectedValueOnce(new Error("sin conexión"));

        render(<NominaAdmin />);

        fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));

        expect(await screen.findByText("pérez ana")).toBeInTheDocument();
        expect(
            screen.queryByText("No se pudo cargar la información de nómina.")
        ).not.toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(4);
    });

    it("precarga el sueldo como salario base y recalcula el neto a depositar", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        expect(screen.getByText("Procesar Pago Nómina")).toBeInTheDocument();
        expect(screen.getByDisplayValue("1500")).toBeInTheDocument();
        expect(screen.getByText("$ 1.500")).toBeInTheDocument();
        expect(screen.getByText("Máx: $ 400")).toBeInTheDocument();

        const [, bonos, abono, otros] = screen.getAllByRole("spinbutton");
        fireEvent.change(bonos, { target: { value: "100" } });
        fireEvent.change(abono, { target: { value: "50" } });
        fireEvent.change(otros, { target: { value: "25" } });

        expect(screen.getByText("$ 1.525")).toBeInTheDocument();
    });

    // Desde el paso 4 (2026-10-21) el aviso sale mientras se escribe y el
    // botón espera; antes salía en una ventana al pulsar «Confirmar Pago».
    it("impide registrar un pago cuyo total neto es negativo y lo dice mientras se escribe", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        const [salario, , , otros] = screen.getAllByRole("spinbutton");
        fireEvent.change(salario, { target: { value: "100" } });
        fireEvent.change(otros, { target: { value: "500" } });

        expect(screen.getByText("El total a pagar no puede ser negativo.")).toBeInTheDocument();
        const confirmar = screen.getByRole("button", { name: "Confirmar Pago" });
        expect(confirmar).toBeDisabled();
        fireEvent.click(confirmar);

        expect(swalFireMock).not.toHaveBeenCalled();
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("impide abonar más de la deuda pendiente del empleado y lo dice junto al abono", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        const [, , abono] = screen.getAllByRole("spinbutton");
        fireEvent.change(abono, { target: { value: "500" } });

        expect(screen.getByText("No puede ser mayor que la deuda ($ 400).")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirmar Pago" })).toBeDisabled();

        fireEvent.change(abono, { target: { value: "400" } });

        expect(screen.queryByText(/No puede ser mayor que la deuda/)).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirmar Pago" })).toBeEnabled();
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("Esc cierra el pago sin registrar nada", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

        expect(screen.queryByText("Procesar Pago Nómina")).not.toBeInTheDocument();
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("confirma, registra con el contrato del backend, avisa con el número y marca la fila", async () => {
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
        expect(swalFireMock).toHaveBeenNthCalledWith(
            1,
            avisoCon({ icon: "question", title: "¿Registrar este pago de nómina?" })
        );
        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith(
                avisoCon({
                    icon: "success",
                    title: "Pago registrado",
                    text: expect.stringContaining("Pago #N-77 a Ana Pérez"),
                })
            );
        });
        await waitFor(() => {
            expect(screen.queryByText("Procesar Pago Nómina")).not.toBeInTheDocument();
        });
        expect(await screen.findByText("✓ Pago #N-77 registrado")).toBeInTheDocument();
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledTimes(4);
        });
    });

    it("si se elige Revisar en la confirmación, no registra nada", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledTimes(1);
        });
        expect(apiMock.post).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Confirmar Pago" })).toBeEnabled();
    });

    it("mientras registra, el botón dice Registrando pago... y no deja cerrar", async () => {
        let responder;
        apiMock.post.mockReturnValueOnce(
            new Promise((resolve) => {
                responder = () => resolve({ data: { nomina_id: 77 } });
            })
        );
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        expect(
            await screen.findByRole("button", { name: "Registrando pago..." })
        ).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Registrando pago..." }));
        expect(apiMock.post).toHaveBeenCalledTimes(1);

        responder();

        await waitFor(() => {
            expect(screen.queryByText("Procesar Pago Nómina")).not.toBeInTheDocument();
        });
    });

    it("después de pagar recarga sin esconder la tabla y avisa que actualiza", async () => {
        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        let terminarRecarga;
        const recargaPendiente = new Promise((resolve) => {
            terminarRecarga = resolve;
        });
        apiMock.get.mockImplementation((url) => recargaPendiente.then(() => consultasNormales(url)));

        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        expect(await screen.findByText("Actualizando...")).toBeInTheDocument();
        expect(screen.getByText("pérez ana")).toBeInTheDocument();
        expect(screen.queryByText("Cargando datos...")).not.toBeInTheDocument();

        terminarRecarga();

        await waitFor(() => {
            expect(screen.queryByText("Actualizando...")).not.toBeInTheDocument();
        });
    });

    it("si el servidor rechaza el pago, avisa que no se guardó nada y conserva el modal", async () => {
        apiMock.post.mockRejectedValue({
            response: { status: 500, data: { detail: "Error al procesar pago: boom" } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        render(<NominaAdmin />);
        await abrirPagoDelPrimero();

        fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith(
                avisoCon({ icon: "error", title: "No se registró el pago" })
            );
        });
        expect(screen.getByText("Procesar Pago Nómina")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Confirmar Pago" })).toBeEnabled();
        expect(apiMock.get).toHaveBeenCalledTimes(2);
        consoleError.mockRestore();
    });

    describe("si se pierde la conexión al pagar", () => {
        beforeEach(() => {
            // JSDOM no trae matchMedia ni scrollIntoView; se simulan solo aquí.
            window.matchMedia = vi.fn(() => ({ matches: false }));
            Element.prototype.scrollIntoView = vi.fn();
        });

        afterEach(() => {
            delete window.matchMedia;
            delete Element.prototype.scrollIntoView;
        });

        it("ofrece revisar el historial: cierra el modal, busca a la persona y baja hasta él", async () => {
            apiMock.post.mockRejectedValue(new Error("Network Error"));
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

            render(<NominaAdmin />);
            await abrirPagoDelPrimero();

            fireEvent.click(screen.getByRole("button", { name: "Confirmar Pago" }));

            await waitFor(() => {
                expect(screen.queryByText("Procesar Pago Nómina")).not.toBeInTheDocument();
            });
            expect(swalFireMock).toHaveBeenCalledWith(
                avisoCon({
                    icon: "warning",
                    title: "No sabemos si el pago quedó registrado",
                    confirmButtonText: "Revisar el historial",
                })
            );
            // Se baja cuando la ventana de aviso termina de cerrarse.
            expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
            const { didClose } = swalFireMock.mock.calls.at(-1)[0];
            act(() => didClose());

            expect(screen.getByPlaceholderText("Buscar por empleado...")).toHaveValue("pérez ana");
            expect(await screen.findByText("#N-55")).toBeInTheDocument();
            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            const [seccion] = Element.prototype.scrollIntoView.mock.contexts;
            expect(seccion).toContainElement(
                screen.getByRole("heading", { name: "Historial de Pagos de Nómina" })
            );
            await waitFor(() => {
                expect(apiMock.get).toHaveBeenCalledTimes(4);
            });
            consoleError.mockRestore();
        });
    });

    it("filtra el historial por el nombre del empleado buscado", async () => {
        render(<NominaAdmin />);
        await screen.findByText("pérez ana");

        const buscador = screen.getByPlaceholderText("Buscar por empleado...");
        fireEvent.change(buscador, { target: { value: "pérez" } });

        expect(screen.getByText("#N-55")).toBeInTheDocument();
        expect(screen.getByText("2026-07-31")).toBeInTheDocument();
        expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
        expect(screen.getByText("$ 1.450")).toBeInTheDocument();

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
        expect(screen.getByText("$ 900")).toBeInTheDocument();
    });
});
