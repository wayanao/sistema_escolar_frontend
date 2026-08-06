import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VentasAdmin from "./VentasAdmin";

const { apiMock, swalFireMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn() },
    swalFireMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

vi.mock("../components/impresion/DocumentoImprimible", () => ({
    default: ({ tipo, titulo, subtitulo, children }) => (
        <div data-testid="documento-imprimible" data-tipo={tipo}>
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
            {children}
        </div>
    ),
}));

const inventario = [
    { id: 1, nombre: "Sudadera", stock_actual: 3, precio_venta: 25000 },
    { id: 2, nombre: "Cuaderno agotado", stock_actual: 0, precio_venta: 5000 },
];

const estudiantes = [
    { id: 7, nombre: "Ana", apellido: "Pérez" },
    { id: 8, nombre: "Luis", apellido: "Gómez" },
];

const ventas = [
    {
        id: 501,
        estudiante_id: 7,
        fecha: "2026-07-20T10:30:00",
        estado: "Pendiente",
        total: 50000,
        detalles: [{ cantidad: 2, producto: "Sudadera", subtotal: 50000 }],
    },
    {
        id: 502,
        estudiante_id: 8,
        fecha: "2026-07-21T09:00:00",
        estado: "Anulada",
        total: 5000,
        motivo_anulacion: "Error de registro",
        detalles: [],
    },
];

const seleccionarEstudiante = (texto, opcion) => {
    const buscador = screen.getByPlaceholderText("Buscar por nombre...");
    fireEvent.focus(buscador);
    fireEvent.change(buscador, { target: { value: texto } });
    fireEvent.mouseDown(screen.getByText(opcion));
};

describe("VentasAdmin", () => {
    beforeEach(() => {
        window.alert = vi.fn();
        swalFireMock.mockResolvedValue({ isConfirmed: true, value: "  Cargo equivocado  " });
        apiMock.get.mockImplementation((url) => {
            if (url === "/api/ventas/") return Promise.resolve({ data: ventas });
            if (url === "/inventario") return Promise.resolve({ data: inventario });
            if (url === "/estudiantes") return Promise.resolve({ data: estudiantes });
            throw new Error(`GET inesperado: ${url}`);
        });
        apiMock.post.mockResolvedValue({ data: { id: 901 } });
    });

    it("carga ventas, inventario activo y estudiantes, y solo ofrece productos con stock", async () => {
        render(<VentasAdmin />);

        expect(await screen.findByText("Sudadera")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledWith("/api/ventas/");
        expect(apiMock.get).toHaveBeenCalledWith("/inventario", {
            params: { estado: "activo" },
        });
        expect(apiMock.get).toHaveBeenCalledWith("/estudiantes");
        expect(screen.queryByText("Cuaderno agotado")).not.toBeInTheDocument();
        expect(screen.getByText("Stock: 3 unid.")).toBeInTheDocument();
    });

    it("acumula el carrito hasta el stock disponible y calcula el total", async () => {
        render(<VentasAdmin />);
        await screen.findByText("Sudadera");

        const anadir = screen.getByRole("button", { name: "+ Añadir" });
        fireEvent.click(anadir);
        fireEvent.click(anadir);
        fireEvent.click(anadir);
        fireEvent.click(anadir);

        expect(swalFireMock).toHaveBeenCalledWith(
            "Atención",
            "No hay más stock disponible de este producto.",
            "warning"
        );
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(
            screen.getAllByText(`$${(75000).toLocaleString()}`)
        ).toHaveLength(2);
    });

    it("bloquea el cargo cuando no hay un estudiante seleccionado", async () => {
        render(<VentasAdmin />);
        await screen.findByText("Sudadera");

        fireEvent.click(screen.getByRole("button", { name: "+ Añadir" }));
        fireEvent.click(screen.getByRole("button", { name: /Cargar al Estudiante/ }));

        expect(swalFireMock).toHaveBeenCalledWith(
            "Atención",
            "Por favor selecciona un estudiante válido. Ya no se permiten cargos a Público General.",
            "warning"
        );
        expect(apiMock.post).not.toHaveBeenCalled();
    });

    it("registra la venta como crédito con el detalle del carrito y refresca los datos", async () => {
        render(<VentasAdmin />);
        await screen.findByText("Sudadera");

        const anadir = screen.getByRole("button", { name: "+ Añadir" });
        fireEvent.click(anadir);
        fireEvent.click(anadir);
        seleccionarEstudiante("Pérez", "Pérez Ana - Cód: 7");

        fireEvent.click(screen.getByRole("button", { name: /Cargar al Estudiante/ }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/ventas/", {
                estudiante_id: 7,
                tipo_venta: "Credito",
                total: 50000,
                notas: "",
                detalles: [
                    {
                        inventario_id: 1,
                        cantidad: 2,
                        precio_unitario: 25000,
                        subtotal: 50000,
                    },
                ],
            });
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            "Éxito",
            "Productos cargados a la cuenta del estudiante exitosamente",
            "success"
        );
        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledTimes(6);
        });
        expect(
            await screen.findByRole("button", {
                name: "🖨️ Imprimir Volante de Pago #901",
            })
        ).toBeInTheDocument();
    });

    it("anula una venta enviando el motivo recortado y conserva el historial del estudiante", async () => {
        render(<VentasAdmin />);
        await screen.findByText("Sudadera");

        seleccionarEstudiante("Pérez", "Pérez Ana - Cód: 7");

        expect(screen.getByText("2026-07-20T10:30")).toBeInTheDocument();
        expect(screen.getByText("501")).toBeInTheDocument();
        expect(screen.getByText("2x")).toBeInTheDocument();
        expect(screen.getByText("Pendiente")).toBeInTheDocument();
        expect(screen.queryByText("502")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Anular" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/api/ventas/501/anular", {
                motivo: "Cargo equivocado",
            });
        });
        expect(swalFireMock).toHaveBeenCalledWith(
            "Venta anulada",
            "El stock, la cartera y los pagos asociados fueron actualizados.",
            "success"
        );
    });

    it("presenta el volante imprimible de la última venta con el documento compartido", async () => {
        render(<VentasAdmin />);
        await screen.findByText("Sudadera");

        fireEvent.click(screen.getByRole("button", { name: "+ Añadir" }));
        seleccionarEstudiante("Pérez", "Pérez Ana - Cód: 7");
        fireEvent.click(screen.getByRole("button", { name: /Cargar al Estudiante/ }));

        fireEvent.click(
            await screen.findByRole("button", {
                name: "🖨️ Imprimir Volante de Pago #901",
            })
        );

        const documento = screen.getByTestId("documento-imprimible");
        expect(documento).toHaveAttribute("data-tipo", "volante_venta");
        expect(screen.getByText("Volante de Pago")).toBeInTheDocument();
        expect(screen.getByText("Cargo Pendiente")).toBeInTheDocument();
        expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
        expect(screen.getByText("TOTAL A PAGAR:")).toBeInTheDocument();
    });
});
