import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrestamosAdmin from "./PrestamosAdmin";

const { apiMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

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

const consultasNormales = (url) => {
    if (url === "/profesores") return Promise.resolve({ data: profesores });
    if (url === "/api/prestamos/") return Promise.resolve({ data: prestamos });
    throw new Error(`GET inesperado: ${url}`);
};

const esperarProfesores = () => screen.findByRole("option", { name: "Pérez Ana - 1001" });

const elegirEnFiltro = (valor) => {
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: valor } });
};

const escribirPrestamo = ({ profesorId, monto }) => {
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: profesorId } });
    fireEvent.change(screen.getByPlaceholderText("Ej. 500000"), { target: { value: monto } });
};

const avisoCon = (campos) => expect.objectContaining(campos);

describe("PrestamosAdmin", () => {
    beforeEach(() => {
        apiMock.get.mockImplementation(consultasNormales);
        apiMock.post.mockResolvedValue({ data: { id: 92 } });
        apiMock.put.mockResolvedValue({ data: { mensaje: "Estado actualizado a Pagado" } });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
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
        expect(await screen.findByText("$ 500.000")).toBeInTheDocument();
        expect(screen.getByText("$ 200.000")).toBeInTheDocument();
        expect(screen.getByText("Total por Cobrar: $ 500.000")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Saldar" })).toHaveLength(1);
        expect(screen.getByText("Saldado")).toBeInTheDocument();
    });

    it("avisa cuando se busca sin haber elegido profesor", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();

        fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

        expect(swalFireMock).toHaveBeenCalledWith(
            avisoCon({ text: "Selecciona un profesor o trabajador para ver su historial." })
        );
        expect(apiMock.get).toHaveBeenCalledTimes(1);
    });

    it("limpia el filtro y vuelve al estado sin historial consultado", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();
        elegirEnFiltro("3");
        await screen.findByText("$ 500.000");

        fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));

        expect(
            screen.getByText("Selecciona un profesor o trabajador para ver su historial de préstamos.")
        ).toBeInTheDocument();
        expect(screen.getByText("Total por Cobrar: $ 0")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Saldar" })).not.toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(2);
    });

    it("confirma, registra con el contrato del backend, avisa y consulta el historial", async () => {
        const { container } = render(<PrestamosAdmin />);
        await esperarProfesores();

        escribirPrestamo({ profesorId: "3", monto: "500000" });
        fireEvent.change(container.querySelector('input[type="date"]'), {
            target: { value: "2026-08-01" },
        });
        fireEvent.change(
            screen.getByPlaceholderText("Ej. Descuento programado para la siguiente quincena..."),
            { target: { value: "  Quincena de agosto  " } }
        );

        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/prestamos/", {
                profesor_id: 3,
                monto: 500000,
                fecha: "2026-08-01",
                estado: "Pendiente",
                notas: "Quincena de agosto",
            });
        });
        const confirmacion = swalFireMock.mock.calls[0][0];
        expect(confirmacion.title).toBe("¿Registrar este préstamo?");
        expect(confirmacion.text).toContain("Profesor o trabajador: Pérez Ana");
        expect(confirmacion.text).toContain(
            "Una vez creado no se puede eliminar; solo se podrá saldar."
        );
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/api/prestamos/", {
                params: { profesor_id: "3" },
            });
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            avisoCon({ icon: "success", title: "Préstamo registrado" })
        );
        expect(screen.getAllByRole("combobox")[0]).toHaveValue("");
        expect(screen.getAllByRole("combobox")[1]).toHaveValue("3");
        expect(screen.getByPlaceholderText("Ej. 500000")).toHaveValue(null);
    });

    it("usa una fecha del día cuando el formulario no la especifica", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();

        escribirPrestamo({ profesorId: "4", monto: "1000" });
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

        escribirPrestamo({ profesorId: "3", monto: "0" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith(
                avisoCon({ icon: "warning", text: "El monto del préstamo debe ser mayor que 0." })
            );
        });
        expect(swalFireMock).toHaveBeenCalledTimes(1);
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("no registra nada cuando se elige Revisar en la confirmación", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
        render(<PrestamosAdmin />);
        await esperarProfesores();

        escribirPrestamo({ profesorId: "3", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledTimes(1);
        });
        expect(apiMock.post).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Registrar Préstamo" })).toBeEnabled();
    });

    it("mientras registra, el botón dice Registrando préstamo... y espera", async () => {
        let responder;
        apiMock.post.mockReturnValueOnce(
            new Promise((resolve) => {
                responder = () => resolve({ data: { id: 92 } });
            })
        );
        render(<PrestamosAdmin />);
        await esperarProfesores();

        escribirPrestamo({ profesorId: "3", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        expect(
            await screen.findByRole("button", { name: "Registrando préstamo..." })
        ).toBeDisabled();

        responder();

        expect(
            await screen.findByRole("button", { name: "Registrar Préstamo" })
        ).toBeEnabled();
    });

    it("salda tras confirmar con la persona y el monto, avisa y recarga el historial", async () => {
        render(<PrestamosAdmin />);
        await esperarProfesores();
        elegirEnFiltro("3");
        await screen.findByText("$ 500.000");

        fireEvent.click(screen.getByRole("button", { name: "Saldar" }));

        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/api/prestamos/90/estado", {
                estado: "Pagado",
            });
        });
        const confirmacion = swalFireMock.mock.calls[0][0];
        expect(confirmacion.title).toBe("¿Saldar este préstamo?");
        expect(confirmacion.text).toContain("a Pérez Ana, del 2026-07-10");
        expect(confirmacion.text).toContain("No se puede deshacer.");
        expect(swalFireMock).toHaveBeenCalledWith(
            avisoCon({ icon: "success", title: "Préstamo saldado" })
        );
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledTimes(3);
        });
    });

    it("explica el rechazo del backend al registrar y conserva lo escrito", async () => {
        apiMock.post.mockRejectedValue({
            response: { status: 400, data: { detail: "Monto no permitido" } },
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        render(<PrestamosAdmin />);
        await esperarProfesores();

        escribirPrestamo({ profesorId: "3", monto: "1000" });
        fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith(
                avisoCon({
                    icon: "error",
                    title: "No se registró el préstamo",
                    text: "Monto no permitido\n\nNo se guardó nada.",
                })
            );
        });
        expect(screen.getByPlaceholderText("Ej. 500000")).toHaveValue(1000);
        consoleError.mockRestore();
    });

    it("muestra el error cuando falla la carga de profesores y Reintentar los vuelve a pedir", async () => {
        apiMock.get.mockRejectedValueOnce(new Error("sin conexión"));
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        render(<PrestamosAdmin />);

        expect(
            await screen.findByText("Error al cargar los profesores o trabajadores.")
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

        expect(await esperarProfesores()).toBeInTheDocument();
        expect(
            screen.queryByText("Error al cargar los profesores o trabajadores.")
        ).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    it("muestra el error cuando falla el historial de préstamos", async () => {
        apiMock.get.mockImplementation((url) => {
            if (url === "/profesores") return Promise.resolve({ data: profesores });
            return Promise.reject(new Error("sin conexión"));
        });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

        render(<PrestamosAdmin />);
        await esperarProfesores();

        elegirEnFiltro("3");

        expect(
            await screen.findByText("Error al cargar el historial de préstamos.")
        ).toBeInTheDocument();
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

        it("después de registrar, al cerrar el aviso baja al préstamo nuevo y lo resalta", async () => {
            const nuevo = { ...prestamos[0], id: 92, monto: 1000, fecha: "2026-08-01" };
            apiMock.get.mockImplementation((url) => {
                if (url === "/api/prestamos/") return Promise.resolve({ data: [nuevo, ...prestamos] });
                return consultasNormales(url);
            });
            const { container } = render(<PrestamosAdmin />);
            await esperarProfesores();

            escribirPrestamo({ profesorId: "3", monto: "1000" });
            fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

            await screen.findByText("$ 1.000");
            expect(container.querySelector('[data-prestamo-id="92"]')).toHaveClass("bg-green-50");
            expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

            const { didClose } = swalFireMock.mock.calls.at(-1)[0];
            await act(async () => {
                didClose();
            });

            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "nearest",
            });
            const [fila] = Element.prototype.scrollIntoView.mock.contexts;
            expect(fila).toBe(container.querySelector('[data-prestamo-id="92"]'));
        });

        it("si se pierde la conexión al registrar, ofrece bajar al historial de esa persona", async () => {
            apiMock.post.mockRejectedValue(new Error("Network Error"));
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
            render(<PrestamosAdmin />);
            await esperarProfesores();

            escribirPrestamo({ profesorId: "3", monto: "1000" });
            fireEvent.click(screen.getByRole("button", { name: "Registrar Préstamo" }));

            await screen.findByText("$ 500.000");
            expect(swalFireMock).toHaveBeenLastCalledWith(
                avisoCon({
                    icon: "warning",
                    title: "No sabemos si el préstamo quedó registrado",
                    confirmButtonText: "Revisar el historial",
                })
            );
            expect(screen.getByPlaceholderText("Ej. 500000")).toHaveValue(1000);

            const { didClose } = swalFireMock.mock.calls.at(-1)[0];
            act(() => didClose());

            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            const [seccion] = Element.prototype.scrollIntoView.mock.contexts;
            expect(seccion).toContainElement(
                screen.getByRole("heading", { name: "Historial de Préstamos" })
            );
            consoleError.mockRestore();
        });
    });
});
