import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ContextoTrabajoProfesor from "./ContextoTrabajoProfesor";

const clasesUnicas = [
    { id: 10, materia: "Matemáticas", curso: "5A", curso_id: 100, jornada: "Mañana" },
    { id: 12, materia: "Sociales", curso: "6B", curso_id: 200, jornada: "Tarde" },
];

const planeaciones = [
    { id: 900, tema: "Fracciones", fecha: "2026-08-05" },
    { id: 901, tema: "", fecha: "2026-08-03" },
];

const propiedades = (extra = {}) => ({
    asignacionId: "",
    onCambiarAsignacion: vi.fn(),
    loadingClases: false,
    clasesUnicas,
    claseSeleccionada: null,
    planeacionesRecientes: [],
    loadingPlaneacionesRecientes: false,
    errorPlaneacionesRecientes: "",
    onAbrirPlaneacion: vi.fn(),
    periodo: "1",
    onCambiarPeriodo: vi.fn(),
    fecha: "",
    onCambiarFecha: vi.fn(),
    ...extra,
});

const selectClase = () => screen.getByLabelText("Clase / grupo");

describe("ContextoTrabajoProfesor", () => {
    it("rotula cada clase con su curso y el icono de su jornada", () => {
        render(<ContextoTrabajoProfesor {...propiedades()} />);

        expect(
            within(selectClase())
                .getAllByRole("option")
                .map((opcion) => opcion.textContent),
        ).toEqual([
            "Vista general de clases",
            "Matemáticas - 5A - ☀ Mañana",
            "Sociales - 6B - ◐ Tarde",
        ]);
    });

    it("deshabilita el selector y avisa mientras cargan las clases", () => {
        render(<ContextoTrabajoProfesor {...propiedades({ loadingClases: true })} />);

        expect(selectClase()).toBeDisabled();
        expect(screen.getByRole("option", { name: "Cargando clases..." })).toBeInTheDocument();
    });

    it("avisa cuando el profesor no tiene clases asignadas", () => {
        render(<ContextoTrabajoProfesor {...propiedades({ clasesUnicas: [] })} />);

        expect(screen.getByRole("option", { name: "Sin clases asignadas" })).toBeInTheDocument();
    });

    it("distingue el fallo de carga de la ausencia de clases", () => {
        render(
            <ContextoTrabajoProfesor
                {...propiedades({
                    clasesUnicas: [],
                    errorClases: "No se pudieron cargar tus clases.",
                })}
            />,
        );

        expect(
            screen.getByRole("option", { name: "No se pudieron cargar las clases" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("option", { name: "Sin clases asignadas" }),
        ).not.toBeInTheDocument();
    });

    it("informa los tres cambios del contexto de trabajo", () => {
        const onCambiarAsignacion = vi.fn();
        const onCambiarPeriodo = vi.fn();
        const onCambiarFecha = vi.fn();
        render(
            <ContextoTrabajoProfesor
                {...propiedades({ onCambiarAsignacion, onCambiarPeriodo, onCambiarFecha })}
            />,
        );

        fireEvent.change(selectClase(), { target: { value: "10" } });
        expect(onCambiarAsignacion).toHaveBeenCalledWith("10");

        fireEvent.change(screen.getByLabelText("Período"), { target: { value: "3" } });
        expect(onCambiarPeriodo).toHaveBeenCalledWith("3");

        fireEvent.change(screen.getByLabelText("Fecha de trabajo"), {
            target: { value: "2026-08-07" },
        });
        expect(onCambiarFecha).toHaveBeenCalledWith("2026-08-07");
    });

    it("oculta las planeaciones recientes sin clase elegida", () => {
        render(<ContextoTrabajoProfesor {...propiedades()} />);

        expect(screen.queryByLabelText(/Planeaciones recientes/)).not.toBeInTheDocument();
    });

    it("lista las planeaciones de la clase elegida con su fecha", () => {
        render(
            <ContextoTrabajoProfesor
                {...propiedades({
                    asignacionId: "10",
                    claseSeleccionada: clasesUnicas[0],
                    planeacionesRecientes: planeaciones,
                })}
            />,
        );

        expect(
            screen.getByLabelText("Planeaciones recientes de Matemáticas"),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("option", { name: "Fracciones — 5 de ago de 2026" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("option", { name: "Sin tema registrado — 3 de ago de 2026" }),
        ).toBeInTheDocument();
    });

    it("deshabilita el selector de planeaciones mientras carga y cuando no hay", () => {
        const { rerender } = render(
            <ContextoTrabajoProfesor
                {...propiedades({
                    asignacionId: "10",
                    claseSeleccionada: clasesUnicas[0],
                    loadingPlaneacionesRecientes: true,
                })}
            />,
        );

        const selector = screen.getByLabelText(/Planeaciones recientes/);
        expect(selector).toBeDisabled();
        expect(selector).toHaveAttribute("aria-busy", "true");
        expect(
            screen.getByRole("option", { name: "Cargando planeaciones recientes..." }),
        ).toBeInTheDocument();

        rerender(
            <ContextoTrabajoProfesor
                {...propiedades({ asignacionId: "10", claseSeleccionada: clasesUnicas[0] })}
            />,
        );
        expect(screen.getByLabelText(/Planeaciones recientes/)).toBeDisabled();
        expect(
            screen.getByRole("option", { name: "Sin planeaciones recientes" }),
        ).toBeInTheDocument();
    });

    it("muestra el error de las planeaciones recientes", () => {
        render(
            <ContextoTrabajoProfesor
                {...propiedades({
                    asignacionId: "10",
                    claseSeleccionada: clasesUnicas[0],
                    errorPlaneacionesRecientes: "No se pudieron cargar las planeaciones recientes.",
                })}
            />,
        );

        expect(
            screen.getByText("No se pudieron cargar las planeaciones recientes."),
        ).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "No se pudieron cargar" })).toBeInTheDocument();
    });

    it("informa la planeación elegida", () => {
        const onAbrirPlaneacion = vi.fn();
        render(
            <ContextoTrabajoProfesor
                {...propiedades({
                    asignacionId: "10",
                    claseSeleccionada: clasesUnicas[0],
                    planeacionesRecientes: planeaciones,
                    onAbrirPlaneacion,
                })}
            />,
        );

        fireEvent.change(screen.getByLabelText(/Planeaciones recientes/), {
            target: { value: "900" },
        });

        expect(onAbrirPlaneacion).toHaveBeenCalledWith("900");
    });
});
