import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VistaCarteraVencida from "./VistaCarteraVencida";

vi.mock("../impresion/DocumentoImprimible", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

const item = {
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
    conceptos: [],
    ventas_pendientes: [],
    deuda_anios_anteriores: [
        {
            anio_lectivo_id: 9,
            anio: 2025,
            curso_id: 8,
            total_deuda: 50000,
            deudas: [{ concepto: "Matrícula", deuda: 50000 }],
        },
    ],
};

const propsBase = {
    resumen: { total_deuda: 110000, total_anios_anteriores: 50000, total_estudiantes: 1 },
    cargando: false,
    busqueda: "",
    setBusqueda: vi.fn(),
    filtroCurso: "10",
    setFiltroCurso: vi.fn(),
    filtroTipo: "todos",
    setFiltroTipo: vi.fn(),
    cursosUnicos: [{ id: 10, nombre: "5A" }],
    itemsFiltrados: [item],
    totales: { total: 110000, academica: 100000, inventario: 0, mora: 10000, anteriores: 50000 },
    maxDeuda: 110000,
    cursoSeleccionado: { id: 10, nombre: "5A" },
    expandido: null,
    reporteImpresion: null,
    onCerrarReporte: vi.fn(),
    onActualizar: vi.fn(),
    onExportar: vi.fn(),
    onImprimirCurso: vi.fn(),
    onImprimirEstudiante: vi.fn(),
    onCobrar: vi.fn(),
    onToggleExpandido: vi.fn(),
};

describe("VistaCarteraVencida", () => {
    it("presenta el estado de carga existente", () => {
        render(<VistaCarteraVencida {...propsBase} cargando />);
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("presenta cartera y comunica filtros y acciones mediante callbacks", () => {
        const props = Object.fromEntries(
            Object.entries(propsBase).map(([key, value]) => [key, vi.isMockFunction(value) ? vi.fn() : value])
        );
        render(<VistaCarteraVencida {...props} />);

        expect(screen.getByText("Pérez, Ana")).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText("Nombre, apellido o curso..."), {
            target: { value: "Ana" },
        });
        fireEvent.change(screen.getAllByRole("combobox")[1], {
            target: { value: "mora" },
        });
        fireEvent.click(screen.getByRole("button", { name: "↻ Actualizar" }));
        fireEvent.click(screen.getByRole("button", { name: "⬇ Exportar CSV" }));
        fireEvent.click(screen.getByRole("button", { name: "Imprimir curso" }));
        fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));
        fireEvent.click(screen.getByRole("button", { name: /Cobrar/ }));

        expect(props.setBusqueda).toHaveBeenCalledWith("Ana");
        expect(props.setFiltroTipo).toHaveBeenCalledWith("mora");
        expect(props.onActualizar).toHaveBeenCalledTimes(1);
        expect(props.onExportar).toHaveBeenCalledTimes(1);
        expect(props.onImprimirCurso).toHaveBeenCalledTimes(1);
        expect(props.onImprimirEstudiante).toHaveBeenCalledWith(item);
        expect(props.onCobrar).toHaveBeenCalledWith(item);
    });

    it("sin poder cobrar (otro año), no aparece Cobrar y lo demás sigue", () => {
        render(<VistaCarteraVencida {...propsBase} puedeCobrar={false} />);

        expect(screen.getByText("Pérez, Ana")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Cobrar/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "↻ Actualizar" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "⬇ Exportar CSV" })).toBeInTheDocument();
    });

    it("muestra la deuda de años anteriores en una columna y en el detalle", () => {
        render(<VistaCarteraVencida {...propsBase} expandido={1} />);

        expect(screen.getByRole("columnheader", { name: "Años anteriores" })).toBeInTheDocument();
        expect(screen.getAllByText("$ 50.000").length).toBeGreaterThan(0);
        expect(screen.getByRole("heading", { name: "Deudas de años anteriores" })).toBeInTheDocument();
        expect(screen.getByText("Año 2025")).toBeInTheDocument();
        expect(screen.getByText("Matrícula")).toBeInTheDocument();
    });
});
