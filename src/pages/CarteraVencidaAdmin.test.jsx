import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CarteraVencidaAdmin from "./CarteraVencidaAdmin";

const { apiMock, navigateMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn() },
    navigateMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigateMock,
}));

vi.mock("../components/impresion/DocumentoImprimible", () => ({
    default: ({ tipo, className, titulo, subtitulo, children }) => (
        <div
            data-testid="documento-imprimible"
            data-tipo={tipo}
            data-classname={className}
        >
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
            {children}
        </div>
    ),
}));

const resumen = {
    total_deuda: 310000,
    total_estudiantes: 2,
    total_academico: 100000,
    total_inventario: 200000,
    total_mora: 10000,
    distribucion_cursos: [
        { curso_id: 10, curso_nombre: "5A", estudiantes: 1, total: 110000 },
        { curso_id: 20, curso_nombre: "6B", estudiantes: 1, total: 200000 },
    ],
};

const items = [
    {
        estudiante_id: 1,
        nombre: "Ana",
        apellido: "Pérez",
        curso_id: 10,
        curso_nombre: "5A",
        deuda_academica: 100000,
        deuda_inventario: 0,
        mora: 10000,
        total: 110000,
        cuotas_vencidas: 1,
        conceptos: [
            {
                concepto: "Pensión",
                tipo_cobro: "mensual",
                cuotas_vencidas: 1,
                pagado: 0,
                mora: 10000,
                deuda: 110000,
            },
        ],
        ventas_pendientes: [],
    },
    {
        estudiante_id: 2,
        nombre: "Luis",
        apellido: "Gómez",
        curso_id: 20,
        curso_nombre: "6B",
        deuda_academica: 0,
        deuda_inventario: 200000,
        mora: 0,
        total: 200000,
        cuotas_vencidas: 2,
        conceptos: [],
        ventas_pendientes: [
            { venta_id: 80, fecha: "2026-07-15T00:00:00Z", saldo: 200000 },
        ],
    },
];

describe("CarteraVencidaAdmin", () => {
    beforeEach(() => {
        apiMock.get.mockImplementation((url) => {
            if (url === "/cartera/mora/resumen") return Promise.resolve({ data: resumen });
            if (url === "/cartera/mora") return Promise.resolve({ data: items });
            throw new Error(`GET inesperado: ${url}`);
        });
    });

    it("consulta el resumen y el detalle y conserva los filtros de cartera", async () => {
        render(<CarteraVencidaAdmin />);

        expect(await screen.findByText("Pérez, Ana")).toBeInTheDocument();
        expect(screen.getByText("Gómez, Luis")).toBeInTheDocument();
        expect(apiMock.get).toHaveBeenCalledTimes(2);
        expect(apiMock.get).toHaveBeenCalledWith("/cartera/mora/resumen");
        expect(apiMock.get).toHaveBeenCalledWith("/cartera/mora");

        const [curso, tipoDeuda] = screen.getAllByRole("combobox");
        fireEvent.change(curso, { target: { value: "10" } });

        expect(screen.getByText("Pérez, Ana")).toBeInTheDocument();
        expect(screen.queryByText("Gómez, Luis")).not.toBeInTheDocument();

        fireEvent.change(tipoDeuda, { target: { value: "inventario" } });
        expect(screen.getByText("No hay estudiantes en mora con estos filtros.")).toBeInTheDocument();
    });

    it("mantiene el reporte imprimible por curso con desplazamiento móvil", async () => {
        render(<CarteraVencidaAdmin />);
        await screen.findByText("Pérez, Ana");

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "10" } });
        fireEvent.click(screen.getByRole("button", { name: "Imprimir curso" }));

        const documento = screen.getByTestId("documento-imprimible");
        expect(documento).toHaveAttribute("data-tipo", "reporte_estudiante");
        expect(documento).toHaveAttribute(
            "data-classname",
            "di-documento--cartera di-documento--cartera-curso"
        );
        expect(screen.getByText("Estado de cuenta")).toBeInTheDocument();
        expect(screen.getByText("Curso: 5A")).toBeInTheDocument();
        expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
    });

    it("conserva la navegación hacia pagos con el estudiante seleccionado", async () => {
        render(<CarteraVencidaAdmin />);
        await screen.findByText("Pérez, Ana");

        fireEvent.click(screen.getAllByRole("button", { name: /Cobrar/ })[0]);

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith("/admin/pagos", {
                state: { estudiante_id: 1 },
            });
        });
    });
});
