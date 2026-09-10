import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
