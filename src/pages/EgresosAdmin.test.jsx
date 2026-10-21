import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EgresosAdmin from "./EgresosAdmin";

const { apiMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const egresos = [
    {
        id: 10,
        concepto: "Papelería",
        monto: 150.5,
        fecha: "2026-08-05",
        categoria: "Compras Institucionales",
        notas: "Factura 12",
        origen: "manual",
        editable: true,
    },
    {
        id: 11,
        concepto: "Pago de Nómina - Profesor ID 3",
        monto: 1200,
        fecha: "2026-08-05",
        categoria: "Pago Nomina",
        notas: "Recibo de Nomina",
        origen: "nomina",
        editable: false,
    },
];

const camposDeFecha = (container) => container.querySelectorAll('input[type="date"]');

const escribirEgreso = ({ concepto, monto }) => {
    fireEvent.change(screen.getByPlaceholderText("Ej. Compra de papelería"), {
        target: { value: concepto },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. 150000"), {
        target: { value: monto },
    });
};

const avisoCon = (campos) => expect.objectContaining(campos);

describe("EgresosAdmin", () => {
    beforeEach(() => {
        apiMock.get.mockResolvedValue({ data: egresos });
        apiMock.post.mockResolvedValue({ data: { id: 12 } });
        apiMock.put.mockResolvedValue({ data: { id: 10 } });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
    });

    it("consulta solo el día actual al abrir y totaliza los montos listados", async () => {
        render(<EgresosAdmin />);

        expect(await screen.findByText("Papelería")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(1);

        const [ruta, config] = apiMock.get.mock.calls[0];
        expect(ruta).toBe("/api/egresos/");
        expect(config.params.fecha_desde).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(config.params.fecha_hasta).toBe(config.params.fecha_desde);

        expect(screen.getByText("$ 151")).toBeInTheDocument();
        expect(screen.getByText("$ 1.200")).toBeInTheDocument();
        expect(screen.getByText("Total: $ 1.351")).toBeInTheDocument();
    });

    it("solo ofrece editar los egresos de origen manual", async () => {
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(1);
        expect(screen.getByText("Automático")).toBeInTheDocument();
    });

    it("carga el egreso manual en el formulario y lo actualiza conservando el rango vigente", async () => {
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        fireEvent.click(screen.getByRole("button", { name: "Editar" }));

        expect(screen.getByText("Editar Egreso")).toBeInTheDocument();
        expect(screen.getByText("Editando")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Papelería")).toBeInTheDocument();
        expect(screen.getByDisplayValue("150.5")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Factura 12")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar edición" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Actualizar Egreso" }));

        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/api/egresos/10", {
                concepto: "Papelería",
                monto: 150.5,
                fecha: "2026-08-05",
                categoria: "Compras Institucionales",
                notas: "Factura 12",
            });
        });
        expect(swalFireMock).toHaveBeenNthCalledWith(
            1,
            avisoCon({ icon: "question", title: "¿Actualizar este egreso?" })
        );
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledTimes(2);
        });
        expect(apiMock.get.mock.calls[1][1]).toEqual(apiMock.get.mock.calls[0][1]);
        await waitFor(() => {
            expect(screen.getByText("Registrar Nuevo Egreso")).toBeInTheDocument();
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            avisoCon({ icon: "success", title: "Egreso actualizado" })
        );
    });

    it("registra un egreso nuevo, recorta los textos y mueve el filtro a la fecha registrada", async () => {
        const { container } = render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "  Aseo general  ", monto: "80000" });
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "Mantenimiento" } });
        fireEvent.change(camposDeFecha(container)[0], { target: { value: "2026-08-01" } });

        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/egresos/", {
                concepto: "Aseo general",
                monto: 80000,
                fecha: "2026-08-01",
                categoria: "Mantenimiento",
                notas: "",
            });
        });
        const confirmacion = swalFireMock.mock.calls[0][0];
        expect(confirmacion.title).toBe("¿Registrar este egreso?");
        expect(confirmacion.text).toContain("Concepto: Aseo general");
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenLastCalledWith("/api/egresos/", {
                params: { fecha_desde: "2026-08-01", fecha_hasta: "2026-08-01" },
            });
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            avisoCon({ icon: "success", title: "Egreso registrado" })
        );

        const fechas = camposDeFecha(container);
        expect(fechas[1]).toHaveValue("2026-08-01");
        expect(fechas[2]).toHaveValue("2026-08-01");
        expect(screen.getByPlaceholderText("Ej. Compra de papelería")).toHaveValue("");
    });

    it("no envía nada cuando se elige Revisar en la confirmación", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "Aseo", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledTimes(1);
        });
        expect(apiMock.post).not.toHaveBeenCalled();
        expect(apiMock.get).toHaveBeenCalledTimes(1);
    });

    it("valida concepto y monto antes de pedir confirmación", async () => {
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "   ", monto: "100" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        expect(swalFireMock).toHaveBeenLastCalledWith(
            avisoCon({ icon: "warning", text: "Debes escribir el concepto del egreso." })
        );

        escribirEgreso({ concepto: "Aseo", monto: "0" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        expect(swalFireMock).toHaveBeenLastCalledWith(
            avisoCon({ icon: "warning", text: "El monto del egreso debe ser mayor que 0." })
        );
        expect(swalFireMock).toHaveBeenCalledTimes(2);
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("mientras registra, el botón dice Registrando egreso... y espera", async () => {
        let responder;
        apiMock.post.mockReturnValueOnce(
            new Promise((resolve) => {
                responder = () => resolve({ data: { id: 12 } });
            })
        );
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "Aseo", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        expect(
            await screen.findByRole("button", { name: "Registrando egreso..." })
        ).toBeDisabled();
        expect(screen.getByRole("button", { name: "Editar" })).toBeDisabled();

        responder();

        expect(await screen.findByRole("button", { name: "Registrar Egreso" })).toBeEnabled();
    });

    it("rechaza un rango invertido sin consultar al backend", async () => {
        const { container } = render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        const fechas = camposDeFecha(container);
        fireEvent.change(fechas[1], { target: { value: "2026-08-10" } });
        fireEvent.change(fechas[2], { target: { value: "2026-08-01" } });
        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

        expect(swalFireMock).toHaveBeenCalledWith(
            avisoCon({ text: "La fecha desde no puede ser mayor que la fecha hasta." })
        );
        expect(apiMock.get).toHaveBeenCalledTimes(1);
    });

    it("consulta el rango elegido y el botón Hoy vuelve al día actual", async () => {
        const { container } = render(<EgresosAdmin />);
        await screen.findByText("Papelería");
        const paramsIniciales = apiMock.get.mock.calls[0][1].params;

        const fechas = camposDeFecha(container);
        fireEvent.change(fechas[1], { target: { value: "2026-08-01" } });
        fireEvent.change(fechas[2], { target: { value: "2026-08-10" } });
        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenLastCalledWith("/api/egresos/", {
                params: { fecha_desde: "2026-08-01", fecha_hasta: "2026-08-10" },
            });
        });

        fireEvent.click(screen.getByRole("button", { name: "Hoy" }));

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenLastCalledWith("/api/egresos/", {
                params: paramsIniciales,
            });
        });
        expect(camposDeFecha(container)[1]).toHaveValue(paramsIniciales.fecha_desde);
    });

    it("explica el rechazo del backend al guardar y conserva lo escrito", async () => {
        apiMock.post.mockRejectedValue({
            response: { status: 400, data: { detail: "Concepto duplicado" } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "Aseo", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith(
                avisoCon({
                    icon: "error",
                    title: "No se registró el egreso",
                    text: "Concepto duplicado\n\nNo se guardó nada.",
                })
            );
        });
        expect(screen.getByPlaceholderText("Ej. Compra de papelería")).toHaveValue("Aseo");
        consoleError.mockRestore();
    });

    it("muestra el error y el estado vacío cuando falla la carga, y Reintentar vuelve a consultar", async () => {
        apiMock.get.mockRejectedValueOnce(new Error("sin conexión"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        render(<EgresosAdmin />);

        expect(await screen.findByText("Error al cargar los egresos.")).toBeInTheDocument();
        expect(
            screen.getByText("No hay egresos registrados para las fechas seleccionadas.")
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

        expect(await screen.findByText("Papelería")).toBeInTheDocument();
        expect(screen.queryByText("Error al cargar los egresos.")).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    describe("lleva la pantalla a lo que cambió", () => {
        beforeEach(() => {
            // JSDOM no trae matchMedia ni scrollIntoView; se simulan solo aquí.
            window.matchMedia = vi.fn(() => ({ matches: false }));
            Element.prototype.scrollIntoView = vi.fn();
        });

        afterEach(() => {
            delete window.matchMedia;
            delete Element.prototype.scrollIntoView;
        });

        it("Editar sube al formulario y le pasa el foco a su título", async () => {
            render(<EgresosAdmin />);
            await screen.findByText("Papelería");

            fireEvent.click(screen.getByRole("button", { name: "Editar" }));

            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            const [seccion] = Element.prototype.scrollIntoView.mock.contexts;
            const titulo = screen.getByRole("heading", { name: "Editar Egreso" });
            expect(seccion).toContainElement(titulo);
            expect(titulo).toHaveFocus();
        });

        it("después de actualizar, al cerrar el aviso vuelve a la fila editada", async () => {
            const { container } = render(<EgresosAdmin />);
            await screen.findByText("Papelería");

            fireEvent.click(screen.getByRole("button", { name: "Editar" }));
            fireEvent.click(screen.getByRole("button", { name: "Actualizar Egreso" }));

            await waitFor(() => {
                expect(swalFireMock).toHaveBeenCalledWith(
                    avisoCon({ icon: "success", title: "Egreso actualizado" })
                );
            });
            await waitFor(() => {
                expect(container.querySelector('[data-egreso-id="10"]')).toHaveClass("bg-green-50");
            });
            Element.prototype.scrollIntoView.mockClear();

            const { didClose } = swalFireMock.mock.calls.at(-1)[0];
            await act(async () => {
                didClose();
            });

            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "nearest",
            });
            const [fila] = Element.prototype.scrollIntoView.mock.contexts;
            expect(fila).toBe(container.querySelector('[data-egreso-id="10"]'));
        });

        it("si se pierde la conexión al registrar, ofrece bajar al historial de ese día", async () => {
            apiMock.post.mockRejectedValue(new Error("Network Error"));
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
            const { container } = render(<EgresosAdmin />);
            await screen.findByText("Papelería");

            escribirEgreso({ concepto: "Aseo", monto: "1000" });
            fireEvent.change(camposDeFecha(container)[0], { target: { value: "2026-08-03" } });
            fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

            await waitFor(() => {
                expect(apiMock.get).toHaveBeenLastCalledWith("/api/egresos/", {
                    params: { fecha_desde: "2026-08-03", fecha_hasta: "2026-08-03" },
                });
            });
            expect(swalFireMock).toHaveBeenLastCalledWith(
                avisoCon({
                    icon: "warning",
                    title: "No sabemos si el egreso quedó registrado",
                    confirmButtonText: "Revisar el historial",
                })
            );
            expect(screen.getByPlaceholderText("Ej. Compra de papelería")).toHaveValue("Aseo");

            const { didClose } = swalFireMock.mock.calls.at(-1)[0];
            act(() => didClose());

            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            const [seccion] = Element.prototype.scrollIntoView.mock.contexts;
            expect(seccion).toContainElement(
                screen.getByRole("heading", { name: "Historial de Egresos" })
            );
            consoleError.mockRestore();
        });
    });
});
