import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TarjetaMejorRendimiento from "./TarjetaMejorRendimiento";

const notasAltas = [
    { nombre: "Zoe Zapata", promedio: 4.876, curso: "5A", materia: "Matemáticas" },
    { nombre: "Iván Ibáñez", promedio: 4.1, curso: "5A" },
];

const propiedades = (extra = {}) => ({
    notasAltas,
    loading: false,
    cursoFiltroNombre: "5A - Mañana",
    materiaFiltroNombre: "Todas las materias",
    onVerRanking: vi.fn(),
    ...extra,
});

describe("TarjetaMejorRendimiento", () => {
    it("lista los mejores promedios con color fijo", () => {
        render(<TarjetaMejorRendimiento {...propiedades()} />);

        expect(screen.getByRole("heading", { name: "Mejores Estudiantes" })).toBeInTheDocument();
        expect(screen.getByText("4.88")).toHaveClass("text-green-600");
        expect(screen.getByText("4.10")).toHaveClass("text-green-600");
    });

    it("usa el nombre del filtro cuando la fila no trae materia", () => {
        render(<TarjetaMejorRendimiento {...propiedades()} />);

        expect(screen.getByText("Curso: 5A · Materia: Matemáticas")).toBeInTheDocument();
        expect(screen.getByText("Curso: 5A · Materia: Todas las materias")).toBeInTheDocument();
    });

    it("muestra el indicador de carga sin la lista", () => {
        render(<TarjetaMejorRendimiento {...propiedades({ loading: true })} />);

        expect(screen.getByText("Cargando rendimiento...")).toBeInTheDocument();
        expect(screen.queryByText("4.88")).not.toBeInTheDocument();
    });

    it("distingue el fallo de carga del estado vacío", () => {
        render(
            <TarjetaMejorRendimiento
                {...propiedades({
                    notasAltas: [],
                    error: "No se pudo cargar el rendimiento del curso.",
                })}
            />,
        );

        expect(
            screen.getByText("No se pudo cargar el rendimiento del curso."),
        ).toBeInTheDocument();
        expect(
            screen.queryByText("No hay estudiantes con notas altas aún"),
        ).not.toBeInTheDocument();
    });

    it("muestra el estado vacío y conserva el acceso al ranking", () => {
        const onVerRanking = vi.fn();
        render(<TarjetaMejorRendimiento {...propiedades({ notasAltas: [], onVerRanking })} />);

        expect(screen.getByText("No hay estudiantes con notas altas aún")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Ver ranking por materia" }));
        expect(onVerRanking).toHaveBeenCalled();
    });
});
