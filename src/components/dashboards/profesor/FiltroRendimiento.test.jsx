import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FiltroRendimiento from "./FiltroRendimiento";

const cursos = [
    { id: 100, nombre: "5A", jornada: "Mañana" },
    { id: 200, nombre: "6B", jornada: "Tarde" },
];

const materias = [
    { id: 11, materia: "Español" },
    { id: 10, materia: "Matemáticas" },
];

const propiedades = (extra = {}) => ({
    loadingClases: false,
    cursosProfesor: cursos,
    cursoFiltro: "100",
    onCambiarCurso: vi.fn(),
    materiasDelCurso: materias,
    materiaFiltro: "todas",
    onCambiarMateria: vi.fn(),
    ...extra,
});

const selectCurso = () => within(screen.getByText("Curso").closest("div")).getByRole("combobox");
const selectMateria = () =>
    within(screen.getByText("Materia").closest("div")).getByRole("combobox");

describe("FiltroRendimiento", () => {
    it("lista los cursos con su jornada y las materias del curso", () => {
        render(<FiltroRendimiento {...propiedades()} />);

        expect(
            within(selectCurso())
                .getAllByRole("option")
                .map((opcion) => opcion.textContent),
        ).toEqual(["Selecciona un curso", "5A - Mañana", "6B - Tarde"]);
        expect(
            within(selectMateria())
                .getAllByRole("option")
                .map((opcion) => opcion.textContent),
        ).toEqual(["Todas las materias del curso", "Español", "Matemáticas"]);
    });

    it("informa el cambio de curso y de materia", () => {
        const onCambiarCurso = vi.fn();
        const onCambiarMateria = vi.fn();
        render(<FiltroRendimiento {...propiedades({ onCambiarCurso, onCambiarMateria })} />);

        fireEvent.change(selectCurso(), { target: { value: "200" } });
        expect(onCambiarCurso).toHaveBeenCalledWith("200");

        fireEvent.change(selectMateria(), { target: { value: "10" } });
        expect(onCambiarMateria).toHaveBeenCalledWith("10");
    });

    it("avisa y deshabilita mientras cargan las clases", () => {
        render(<FiltroRendimiento {...propiedades({ loadingClases: true })} />);

        expect(selectCurso()).toBeDisabled();
        expect(selectMateria()).toBeDisabled();
        expect(screen.getByRole("option", { name: "Cargando cursos..." })).toBeInTheDocument();
    });

    it("avisa cuando el profesor no tiene cursos y bloquea la materia", () => {
        render(
            <FiltroRendimiento
                {...propiedades({ cursosProfesor: [], cursoFiltro: "", materiasDelCurso: [] })}
            />,
        );

        expect(screen.getByRole("option", { name: "Sin cursos asignados" })).toBeInTheDocument();
        expect(selectCurso()).toBeDisabled();
        expect(selectMateria()).toBeDisabled();
    });
});
