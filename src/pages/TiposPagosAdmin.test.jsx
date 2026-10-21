import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TiposPagosAdmin from "./TiposPagosAdmin";

const { apiMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

const tiposPagos = [
    {
        id: 1,
        nombre: "Matrícula",
        valor: 350000,
        tipo_cobro: "mensual",
        activo: true,
        cursos: [{ curso_id: 10, curso_nombre: "5A", valor: 350000, activo: true }],
    },
    {
        id: 2,
        nombre: "Salida pedagógica",
        valor: 80000,
        tipo_cobro: "opcional",
        activo: true,
        cursos: [],
    },
    {
        id: 3,
        nombre: "Concepto histórico",
        valor: 10000,
        tipo_cobro: "unico",
        activo: false,
        cursos: [{ curso_id: 10, curso_nombre: "5A", valor: 10000, activo: true }],
    },
];

const cursos = [
    { id: 10, nombre: "5A", estado: "activo" },
    { id: 20, nombre: "6B", estado: "activo" },
];

const detalle = {
    ...tiposPagos[0],
    descripcion: "  Cobro ordinario  ",
    fecha_limite: "",
    dia_limite_mes: "10",
    dias_gracia: "3",
    mora_tipo: "porcentaje",
    mora_valor: "2.5",
    mes_inicial: "2",
    mes_final: "11",
    frecuencia_meses: "1",
    generacion_automatica: 1,
};

const configurarGetExitoso = () => {
    apiMock.get.mockImplementation((url) => {
        if (url === "/tipos-pagos/detallado") return Promise.resolve({ data: tiposPagos });
        if (url === "/cursos") return Promise.resolve({ data: cursos });
        if (url === "/tipos-pagos/1/detalle") return Promise.resolve({ data: detalle });
        throw new Error(`GET inesperado: ${url}`);
    });
};

const controlDe = (texto) => {
    const label = screen.getByText(texto, { selector: "label" });
    return label.parentElement.querySelector("input, select, textarea");
};

describe("TiposPagosAdmin", () => {
    beforeEach(() => {
        configurarGetExitoso();
        apiMock.post.mockResolvedValue({ status: 201, data: {} });
        apiMock.put.mockResolvedValue({ status: 200, data: {} });
        swalFireMock.mockResolvedValue({ isConfirmed: true });
    });

    it("distingue conceptos publicados, borradores e inactivos", async () => {
        render(<TiposPagosAdmin />);

        expect(await screen.findByText("Matrícula")).toBeInTheDocument();
        expect(screen.getByText("✓ Publicado")).toBeInTheDocument();
        expect(screen.getByText(/Falta: es opcional .* no tiene cursos asignados/)).toBeInTheDocument();
        expect(screen.queryByText("Concepto histórico")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Inactivos (1)" }));
        expect(screen.getByText("Concepto histórico")).toBeInTheDocument();
        expect(screen.getByText(/Falta: está inactivo/)).toBeInTheDocument();
    });

    it("conserva el fallback del listado detallado al contrato básico", async () => {
        apiMock.get.mockImplementation((url) => {
            if (url === "/tipos-pagos/detallado") return Promise.reject(new Error("No disponible"));
            if (url === "/tipos-pagos") return Promise.resolve({ data: [tiposPagos[0]] });
            if (url === "/cursos") return Promise.resolve({ data: cursos });
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<TiposPagosAdmin />);

        expect(await screen.findByText("Matrícula")).toBeInTheDocument();
        await waitFor(() => expect(apiMock.get).toHaveBeenCalledWith("/tipos-pagos"));
    });

    it("mantiene el payload de creación de conceptos", async () => {
        render(<TiposPagosAdmin />);
        await screen.findByText("Matrícula");

        fireEvent.change(controlDe("Concepto de Pago"), {
            target: { value: "  Transporte  " },
        });
        fireEvent.change(controlDe("Valor base / Costo"), {
            target: { value: "125000.50" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Guardar Concepto" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/tipos-pagos", {
                nombre: "Transporte",
                valor: 125000.5,
            });
        });
    });

    it("normaliza la configuración y la asignación por cursos sin cambiar sus contratos", async () => {
        render(<TiposPagosAdmin />);
        await screen.findByText("Matrícula");

        fireEvent.click(screen.getAllByRole("button", { name: "⚙️ Configurar" })[0]);
        expect(await screen.findByText("Configuración de recurrencia")).toBeInTheDocument();
        expect(controlDe("Mes final")).toHaveValue("11");
        expect(controlDe("Mes final").querySelector('option[value="1"]')).toBeDisabled();
        expect(controlDe("Mes final").querySelector('option[value="2"]')).not.toBeDisabled();
        expect(screen.getByText(
            "Último mes que genera mensualidades y permite adelantos."
        )).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Guardar configuración" }));

        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/tipos-pagos/1/configuracion", {
                descripcion: "Cobro ordinario",
                tipo_cobro: "mensual",
                fecha_limite: null,
                dia_limite_mes: 10,
                dias_gracia: 3,
                mora_tipo: "porcentaje",
                mora_valor: 2.5,
                mes_inicial: 2,
                mes_final: 11,
                frecuencia_meses: 1,
                generacion_automatica: true,
                activo: true,
            });
        });

        fireEvent.change(controlDe("Curso"), { target: { value: "20" } });
        fireEvent.change(controlDe("Valor"), { target: { value: "420000" } });
        fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
        fireEvent.click(screen.getByRole("button", { name: "Guardar asignación de cursos" }));

        await waitFor(() => {
            expect(apiMock.put).toHaveBeenCalledWith("/tipos-pagos/1/cursos", {
                cursos: [
                    { curso_id: 10, valor: 350000, activo: true },
                    { curso_id: 20, valor: 420000, activo: true },
                ],
            });
        });
    });

    it("si no se puede cargar la lista, lo dice y Reintentar la vuelve a pedir", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        apiMock.get.mockImplementation((url) => {
            if (url === "/tipos-pagos/detallado") return Promise.reject(new Error("No disponible"));
            if (url === "/tipos-pagos") return Promise.reject(new Error("Sin conexión"));
            if (url === "/cursos") return Promise.resolve({ data: cursos });
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<TiposPagosAdmin />);

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "No se pudieron cargar los conceptos de pago."
        );
        expect(screen.queryByText("No hay conceptos registrados")).not.toBeInTheDocument();

        configurarGetExitoso();
        fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

        expect(await screen.findByText("Matrícula")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    it("al crear un concepto avisa qué sigue y resalta el concepto nuevo en la lista", async () => {
        const transporte = { id: 9, nombre: "Transporte", valor: 125000, activo: true, cursos: [] };
        apiMock.post.mockResolvedValue({ status: 201, data: transporte });
        render(<TiposPagosAdmin />);
        await screen.findByText("Matrícula");
        apiMock.get.mockImplementation((url) => {
            if (url === "/tipos-pagos/detallado") {
                return Promise.resolve({ data: [...tiposPagos, transporte] });
            }
            if (url === "/cursos") return Promise.resolve({ data: cursos });
            throw new Error(`GET inesperado: ${url}`);
        });

        fireEvent.change(controlDe("Concepto de Pago"), { target: { value: "Transporte" } });
        fireEvent.change(controlDe("Valor base / Costo"), { target: { value: "125000" } });
        fireEvent.click(screen.getByRole("button", { name: "Guardar Concepto" }));

        expect(await screen.findByText("Transporte")).toBeInTheDocument();
        expect(swalFireMock).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Concepto creado",
                text: expect.stringContaining("ábrelo con ⚙️ Configurar"),
            })
        );
        expect(
            screen.getByText("Transporte").closest("[data-concepto-id]")
        ).toHaveClass("bg-green-50");
    });

    it("si falla el detalle al configurar, avisa y no deja el panel abierto", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        apiMock.get.mockImplementation((url) => {
            if (url === "/tipos-pagos/detallado") return Promise.resolve({ data: tiposPagos });
            if (url === "/cursos") return Promise.resolve({ data: cursos });
            if (url === "/tipos-pagos/1/detalle") return Promise.reject(new Error("Sin conexión"));
            throw new Error(`GET inesperado: ${url}`);
        });
        render(<TiposPagosAdmin />);
        await screen.findByText("Matrícula");

        fireEvent.click(screen.getAllByRole("button", { name: "⚙️ Configurar" })[0]);

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith(
                expect.objectContaining({ icon: "error", title: "No se pudo abrir «Matrícula»" })
            );
        });
        expect(screen.queryByText("Configuración financiera")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Guardar configuración" })).not.toBeInTheDocument();
        consoleError.mockRestore();
    });

    describe("lleva la pantalla a lo que cambió y no pierde cambios sin avisar", () => {
        beforeEach(() => {
            // JSDOM no trae matchMedia ni scrollIntoView; se simulan solo aquí.
            window.matchMedia = vi.fn(() => ({ matches: false }));
            Element.prototype.scrollIntoView = vi.fn();
        });

        afterEach(() => {
            delete window.matchMedia;
            delete Element.prototype.scrollIntoView;
        });

        it("Configurar baja al panel de configuración", async () => {
            render(<TiposPagosAdmin />);
            await screen.findByText("Matrícula");

            fireEvent.click(screen.getAllByRole("button", { name: "⚙️ Configurar" })[0]);

            await screen.findByText("Configuración de recurrencia");
            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            const [panel] = Element.prototype.scrollIntoView.mock.contexts;
            expect(panel).toHaveTextContent("Configuración financiera");
        });

        it("✏️ sube al formulario y le pasa el foco a su título", async () => {
            render(<TiposPagosAdmin />);
            await screen.findByText("Matrícula");

            fireEvent.click(screen.getAllByTitle("Editar nombre/valor")[0]);

            const titulo = screen.getByRole("heading", { name: "Editar concepto" });
            expect(titulo).toHaveFocus();
            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            const [formulario] = Element.prototype.scrollIntoView.mock.contexts;
            expect(formulario).toContainElement(titulo);
        });

        it("con cambios sin guardar, Cerrar pregunta y Seguir editando conserva el panel", async () => {
            render(<TiposPagosAdmin />);
            await screen.findByText("Matrícula");
            fireEvent.click(screen.getAllByRole("button", { name: "⚙️ Configurar" })[0]);
            await screen.findByText("Configuración de recurrencia");

            fireEvent.change(controlDe("Días de gracia"), { target: { value: "8" } });
            expect(screen.getByText("Hay cambios de configuración sin guardar.")).toBeInTheDocument();

            swalFireMock.mockResolvedValueOnce({ isConfirmed: false });
            fireEvent.click(screen.getByRole("button", { name: "✕ Cerrar" }));

            await waitFor(() => {
                expect(swalFireMock).toHaveBeenCalledWith(
                    expect.objectContaining({ title: "Hay cambios sin guardar" })
                );
            });
            expect(screen.getByText("Configuración financiera")).toBeInTheDocument();
            expect(controlDe("Días de gracia")).toHaveValue(8);
        });

        it("con cambios sin guardar, Descartar cambios abre el otro concepto y baja al panel al cerrar el aviso", async () => {
            apiMock.get.mockImplementation((url) => {
                if (url === "/tipos-pagos/detallado") return Promise.resolve({ data: tiposPagos });
                if (url === "/cursos") return Promise.resolve({ data: cursos });
                if (url === "/tipos-pagos/1/detalle") return Promise.resolve({ data: detalle });
                if (url === "/tipos-pagos/2/detalle") return Promise.resolve({ data: tiposPagos[1] });
                throw new Error(`GET inesperado: ${url}`);
            });
            render(<TiposPagosAdmin />);
            await screen.findByText("Matrícula");
            fireEvent.click(screen.getAllByRole("button", { name: "⚙️ Configurar" })[0]);
            await screen.findByText("Configuración de recurrencia");
            fireEvent.change(controlDe("Días de gracia"), { target: { value: "8" } });
            Element.prototype.scrollIntoView.mockClear();

            fireEvent.click(screen.getAllByRole("button", { name: "⚙️ Configurar" })[1]);

            await waitFor(() => {
                expect(apiMock.get).toHaveBeenCalledWith("/tipos-pagos/2/detalle");
            });
            expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

            const { didClose } = swalFireMock.mock.calls.at(-1)[0];
            await act(async () => {
                didClose();
            });

            expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            expect(
                screen.getByRole("heading", { name: /Salida pedagógica/ })
            ).toBeInTheDocument();
        });
    });
});
