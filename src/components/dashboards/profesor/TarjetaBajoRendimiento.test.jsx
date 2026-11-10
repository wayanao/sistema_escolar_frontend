import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TarjetaBajoRendimiento from "./TarjetaBajoRendimiento";

const notasBajas = [
    { nombre: "Ana Arias", promedio: 2.345, curso: "5A", materia: "Matemáticas", color: "red" },
    { nombre: "Beto Bravo", promedio: 2.9, curso: "5A", color: "yellow" },
];

const propiedades = (extra = {}) => ({
    notasBajas,
    loading: false,
    cursoFiltroNombre: "5A - Mañana",
    materiaFiltroNombre: "Todas las materias",
    onVerRanking: vi.fn(),
    ...extra,
});

describe("TarjetaBajoRendimiento", () => {
    it("pinta las insignias de curso y materia", () => {
        render(<TarjetaBajoRendimiento {...propiedades()} />);

        expect(screen.getByText("5A - Mañana")).toBeInTheDocument();
        expect(screen.getAllByText("Todas las materias").length).toBeGreaterThan(0);
    });

    it("colorea el promedio según el campo que envía el backend", () => {
        render(<TarjetaBajoRendimiento {...propiedades()} />);

        expect(screen.getByText("2.35")).toHaveClass("text-red-500");
        expect(screen.getByText("2.90")).toHaveClass("text-yellow-500");
    });

    it("usa el nombre del filtro cuando la fila no trae materia", () => {
        render(<TarjetaBajoRendimiento {...propiedades()} />);

        expect(
            screen.getByText("Curso: 5A · Materia: Matemáticas"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Curso: 5A · Materia: Todas las materias"),
        ).toBeInTheDocument();
    });

    it("muestra el indicador de carga sin la lista", () => {
        render(<TarjetaBajoRendimiento {...propiedades({ loading: true })} />);

        expect(screen.getByText("Cargando rendimiento...")).toBeInTheDocument();
        expect(screen.queryByText("2.35")).not.toBeInTheDocument();
    });

    it("distingue el fallo de carga del estado vacío", () => {
        render(
            <TarjetaBajoRendimiento
                {...propiedades({
                    notasBajas: [],
                    error: "No se pudo cargar el rendimiento del curso.",
                })}
            />,
        );

        expect(
            screen.getByText("No se pudo cargar el rendimiento del curso."),
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Nadie está por debajo de 3.0 en este curso."),
        ).not.toBeInTheDocument();
    });

    it("muestra el estado vacío y conserva el acceso al ranking", () => {
        const onVerRanking = vi.fn();
        render(<TarjetaBajoRendimiento {...propiedades({ notasBajas: [], onVerRanking })} />);

        expect(screen.getByText("Nadie está por debajo de 3.0 en este curso.")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Ver ranking por clase" }));
        expect(onVerRanking).toHaveBeenCalled();
    });
});
