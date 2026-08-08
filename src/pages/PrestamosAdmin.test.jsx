import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrestamosAdmin from "./PrestamosAdmin";

const { apiMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

const profesores = [
    { id: 3, nombre: "Ana", apellido: "Pérez", documento_identidad: "1001" },
    { id: 4, nombre: "Luis", apellido: "Gómez", documento_identidad: "1002" },
];

const prestamos = [
    {
        id: 90,
        profesor_id: 3,
        profesor_nombre: "Pérez Ana",
        monto: 500000,
        fecha: "2026-07-10",
        estado: "Pendiente",
        notas: "",
    },
    {
        id: 91,
        profesor_id: 3,
        profesor_nombre: "Pérez Ana",
        monto: 200000,
        fecha: "2026-06-05",
        estado: "Pagado",
        notas: "",
    },
];

const esperarProfesores = () => screen.findByRole("option", { name: "Pérez Ana - 1001" });

const elegirEnFiltro = (valor) => {
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: valor } });
};

describe("PrestamosAdmin", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        window.confirm = vi.fn(() => true);
        apiMock.get.mockImplementation((url) => {
            if (url === "/profesores") return Promise.resolve({ data: profesores });
            if (url === "/api/prestamos/") return Promise.resolve({ data: prestamos });
            throw new Error(`GET inesperado: ${url}`);
        });
        apiMock.post.mockResolvedValue({ data: { id: 92 } });
        apiMock.put.mockResolvedValue({ data: { mensaje: "Estado actualizado a Pagado" } });
    });

    it("solo carga profesores al abrir y no consulta el historial", async () => {
        render(<PrestamosAdmin />);

        expect(await esperarProfesores()).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/profesores");
        expect(apiMock.get).toHaveBeenCalledTimes(1);
        expect(
            screen.getByText("Selecciona un profesor o trabajador para ver su historial de préstamos.")
        ).toBeInTheDocument();
        expect(
            screen.getByText("El historial no se carga automáticamente al abrir la página.")
        ).toBeInTheDocument();
    });

    it("consulta el historial al elegir un profesor y suma solo lo pendiente", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();

        elegirEnFiltro("3");

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/api/prestamos/", {
                params: { profesor_id: "3" },
            });
        });
        expect(await screen.findByText("$500000.00")).toBeInTheDocument();
        expect(screen.getByText("$200000.00")).toBeInTheDocument();
        expect(screen.getByText("Total por Cobrar: $500000.00")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Saldar" })).toHaveLength(1);
        expect(screen.getByText("Saldado")).toBeInTheDocument();
    });

    it("avisa cuando se busca sin haber elegido profesor", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();

        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

        expect(window.alert).toHaveBeenCalledWith(
            "Selecciona un profesor o trabajador para ver su historial."
        );
        expect(apiMock.get).toHaveBeenCalledTimes(1);
    });

    it("limpia el filtro y vuelve al estado sin historial consultado", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();
        elegirEnFiltro("3");
        await screen.findByText("$500000.00");

        fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));

        expect(
            screen.getByText("Selecciona un profesor o trabajador para ver su historial de préstamos.")
        ).toBeInTheDocument();
        expect(screen.getByText("Total por Cobrar: $0.00")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Saldar" })).not.toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(2);
    });

    it("registra el préstamo con el contrato del backend y consulta su historial", async () => {
        const { container } = render(<PrestamosAdmin />);
        await esperarProfesores();

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "3" } });
        fireEvent.change(screen.getByPlaceholderText("Ej. 1000.00"), {
            target: { value: "500000" },
        });
        fireEvent.change(container.querySelector('input[type="date"]'), {
            target: { value: "2026-08-01" },
        });
        fireEvent.change(
            screen.getByPlaceholderText("Ej. Descuento programado para la siguiente quincena..."),
            { target: { value: "  Quincena de agosto  " } }
        );

        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        const montoEsperado = (500000).toLocaleString("es-CO", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining("Profesor o trabajador: Pérez Ana")
        );
        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining(`Monto: $${montoEsperado}`)
        );
        expect(window.confirm).toHaveBeenCalledWith(
            expect.stringContaining("Una vez creado no se puede eliminar; solo se podrá saldar.")
        );

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/prestamos/", {
                profesor_id: 3,
                monto: 500000,
                fecha: "2026-08-01",
                estado: "Pendiente",
                notas: "Quincena de agosto",
            });
        });
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/api/prestamos/", {
                params: { profesor_id: "3" },
            });
        });
        expect(screen.getAllByRole("combobox")[0]).toHaveValue("");
        expect(screen.getAllByRole("combobox")[1]).toHaveValue("3");
        expect(screen.getByPlaceholderText("Ej. 1000.00")).toHaveValue(null);
    });

    it("usa una fecha del día cuando el formulario no la especifica", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "4" } });
        fireEvent.change(screen.getByPlaceholderText("Ej. 1000.00"), {
            target: { value: "1000" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/prestamos/", {
                profesor_id: 4,
                monto: 1000,
                fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                estado: "Pendiente",
                notas: "",
            });
        });
    });

    it("rechaza montos que no son mayores que cero", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "3" } });
        fireEvent.change(screen.getByPlaceholderText("Ej. 1000.00"), { target: { value: "0" } });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        expect(window.alert).toHaveBeenCalledWith("El monto del préstamo debe ser mayor que 0.");
        expect(window.confirm).not.toHaveBeenCalled();
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("no registra nada cuando se cancela la confirmación", async () => {
        window.confirm = vi.fn(() => false);
        render(<PrestamosAdmin />);
        await esperarProfesores();

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "3" } });
        fireEvent.change(screen.getByPlaceholderText("Ej. 1000.00"), {
            target: { value: "1000" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        expect(window.confirm).toHaveBeenCalled();
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("salda un préstamo pendiente y recarga el historial del filtro", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();
        elegirEnFiltro("3");
        await screen.findByText("$500000.00");

        fireEvent.click(screen.getByRole("button", { name: "Saldar" }));

        expect(window.confirm).toHaveBeenCalledWith("¿Marcar este préstamo como Pagado?");
        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/api/prestamos/90/estado", {
                estado: "Pagado",
            });
        });
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledTimes(3);
        });
    });

    it("conserva el detalle del backend cuando falla el registro", async () => {
        apiMock.post.mockRejectedValue({ response: { data: { detail: "Monto no permitido" } } });
        render(<PrestamosAdmin />);
        await esperarProfesores();

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "3" } });
        fireEvent.change(screen.getByPlaceholderText("Ej. 1000.00"), {
            target: { value: "1000" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Monto no permitido");
        });
    });

    it("muestra el error cuando falla la carga de profesores", async () => {
        apiMock.get.mockRejectedValue(new Error("sin conexión"));

        render(<PrestamosAdmin />);

        expect(
            await screen.findByText("Error al cargar los profesores o trabajadores.")
        ).toBeInTheDocument();
    });

    it("muestra el error cuando falla el historial de préstamos", async () => {
        apiMock.get.mockImplementation((url) => {
            if (url === "/profesores") return Promise.resolve({ data: profesores });
            return Promise.reject(new Error("sin conexión"));
        });

        render(<PrestamosAdmin />);
        await esperarProfesores();

        elegirEnFiltro("3");

        expect(
            await screen.findByText("Error al cargar el historial de préstamos.")
        ).toBeInTheDocument();
    });
});
