import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EgresosAdmin from "./EgresosAdmin";

const { apiMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

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
    fireEvent.change(screen.getByPlaceholderText("Ej. 150.50"), {
        target: { value: monto },
    });
};

describe("EgresosAdmin", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        window.confirm = vi.fn(() => true);
        apiMock.get.mockResolvedValue({ data: egresos });
        apiMock.post.mockResolvedValue({ data: { id: 12 } });
        apiMock.put.mockResolvedValue({ data: { id: 10 } });
    });

    it("consulta solo el día actual al abrir y totaliza los montos listados", async () => {
        render(<EgresosAdmin />);

        expect(await screen.findByText("Papelería")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(1);

        const [ruta, config] = apiMock.get.mock.calls[0];
        expect(ruta).toBe("/api/egresos/");
        expect(config.params.fecha_desde).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(config.params.fecha_hasta).toBe(config.params.fecha_desde);

        expect(screen.getByText("$150.50")).toBeInTheDocument();
        expect(screen.getByText("$1200.00")).toBeInTheDocument();
        expect(screen.getByText("Total: $1350.50")).toBeInTheDocument();
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
        expect(screen.getByDisplayValue("Papelería")).toBeInTheDocument();
        expect(screen.getByDisplayValue("150.5")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Factura 12")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancelar edición" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Actualizar Egreso" }));

        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining("¿Seguro que deseas actualizar este egreso?")
        );
        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/api/egresos/10", {
                concepto: "Papelería",
                monto: 150.5,
                fecha: "2026-08-05",
                categoria: "Compras Institucionales",
                notas: "Factura 12",
            });
        });
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledTimes(2);
        });
        expect(apiMock.get.mock.calls[1][1]).toEqual(apiMock.get.mock.calls[0][1]);
        await waitFor(() => {
            expect(screen.getByText("Registrar Nuevo Egreso")).toBeInTheDocument();
        });
    });

    it("registra un egreso nuevo, recorta los textos y mueve el filtro a la fecha registrada", async () => {
        const { container } = render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "  Aseo general  ", monto: "80000" });
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "Mantenimiento" } });
        fireEvent.change(camposDeFecha(container)[0], { target: { value: "2026-08-01" } });

        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        const montoEsperado = (80000).toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining("¿Seguro que deseas registrar este egreso?")
        );
        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining(`Monto: $${montoEsperado}`)
        );

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/egresos/", {
                concepto: "Aseo general",
                monto: 80000,
                fecha: "2026-08-01",
                categoria: "Mantenimiento",
                notas: "",
            });
        });
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenLastCalledWith("/api/egresos/", {
                params: { fecha_desde: "2026-08-01", fecha_hasta: "2026-08-01" },
            });
        });

        const fechas = camposDeFecha(container);
        expect(fechas[1]).toHaveValue("2026-08-01");
        expect(fechas[2]).toHaveValue("2026-08-01");
        expect(screen.getByPlaceholderText("Ej. Compra de papelería")).toHaveValue("");
    });

    it("no envía nada cuando se cancela la confirmación", async () => {
        window.confirm = vi.fn(() => false);
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "Aseo", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        expect(window.confirm).toHaveBeenCalled();
        expect(apiMock.post).not.toHaveBeenCalled();
        expect(apiMock.get).toHaveBeenCalledTimes(1);
    });

    it("valida concepto y monto antes de pedir confirmación", async () => {
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "   ", monto: "100" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        expect(window.alert).toHaveBeenCalledWith("Debes escribir el concepto del egreso.");
        expect(window.confirm).not.toHaveBeenCalled();

        escribirEgreso({ concepto: "Aseo", monto: "0" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        expect(window.alert).toHaveBeenCalledWith("El monto del egreso debe ser mayor que 0.");
        expect(window.confirm).not.toHaveBeenCalled();
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("rechaza un rango invertido sin consultar al backend", async () => {
        const { container } = render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        const fechas = camposDeFecha(container);
        fireEvent.change(fechas[1], { target: { value: "2026-08-10" } });
        fireEvent.change(fechas[2], { target: { value: "2026-08-01" } });
        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

        expect(window.alert).toHaveBeenCalledWith(
            "La fecha desde no puede ser mayor que la fecha hasta."
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

    it("conserva el detalle del backend cuando falla el guardado", async () => {
        apiMock.post.mockRejectedValue({ response: { data: { detail: "Concepto duplicado" } } });
        render(<EgresosAdmin />);
        await screen.findByText("Papelería");

        escribirEgreso({ concepto: "Aseo", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Egreso" }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Concepto duplicado");
        });
    });

    it("muestra el error y el estado vacío cuando falla la carga", async () => {
        apiMock.get.mockRejectedValue(new Error("sin conexión"));

        render(<EgresosAdmin />);

        expect(await screen.findByText("Error al cargar los egresos.")).toBeInTheDocument();
        expect(
            screen.getByText("No hay egresos registrados para las fechas seleccionadas.")
        ).toBeInTheDocument();
    });
});
