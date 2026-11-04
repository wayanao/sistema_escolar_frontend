import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TablaNotasPlanilla from "./TablaNotasPlanilla";

const formatearEtiquetaColumna = (valor) => (valor === "quiz" ? "Quiz" : valor);

describe("TablaNotasPlanilla", () => {
    it("renderiza el título, la tabla de escritorio y la tarjeta móvil para cada estudiante", () => {
        const estudiantes = [
            { estudiante_id: 501, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4 }, promedio: "4.00" },
        ];
        render(
            <TablaNotasPlanilla
                estudiantes={estudiantes}
                columnas={["quiz"]}
                guardarNota={vi.fn()}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );

        expect(screen.getByText("Notas de Estudiantes")).toBeInTheDocument();

        const tabla = screen.getByRole("table");
        expect(within(tabla).getByText("Quiz")).toBeInTheDocument();
        expect(within(tabla).getByText("Estudiante")).toBeInTheDocument();
        expect(within(tabla).getByText("Promedio")).toBeInTheDocument();

        // Tarjeta móvil y fila de escritorio conviven en el DOM (invariante ya
        // protegido en la página); ambas muestran el mismo estudiante.
        expect(screen.getAllByText("Ruiz Ana")).toHaveLength(2);
    });

    it("con porcentajes, cada encabezado muestra el suyo; sin ellos, ninguno", () => {
        const { rerender } = render(
            <TablaNotasPlanilla
                estudiantes={[]}
                columnas={["quiz", "taller"]}
                guardarNota={vi.fn()}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
                porcentajesPorTipo={{ quiz: 40 }}
            />,
        );
        const tabla = screen.getByRole("table");
        expect(within(tabla).getByText("40 %")).toBeInTheDocument();
        expect(within(tabla).getAllByText(/%/)).toHaveLength(1);

        rerender(
            <TablaNotasPlanilla
                estudiantes={[]}
                columnas={["quiz", "taller"]}
                guardarNota={vi.fn()}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );
        expect(within(screen.getByRole("table")).queryByText(/%/)).not.toBeInTheDocument();
    });

    it("en tablet angosta las columnas fijas y en PC las deja como antes", () => {
        // Pedido del usuario el 2026-11-04: con el riel del menú, en tablet
        // el espacio para las notas quedaba muy pequeño. Desde xl (PC), igual.
        const estudiantes = [
            { estudiante_id: 501, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4 }, promedio: "4.00" },
        ];
        render(
            <TablaNotasPlanilla
                estudiantes={estudiantes}
                columnas={["quiz"]}
                guardarNota={vi.fn()}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );
        const tabla = screen.getByRole("table");
        const [numero, estudiante, quiz, promedio] = within(tabla).getAllByRole("columnheader");

        expect(numero).toHaveClass("w-10", "px-1", "xl:w-16", "xl:px-3");
        expect(estudiante).toHaveClass("left-10", "px-3", "xl:left-16", "xl:px-6");
        expect(quiz).toHaveClass("min-w-[104px]", "px-2", "xl:min-w-[120px]", "xl:px-4");
        expect(promedio).toHaveClass("w-24", "px-2", "xl:w-36", "xl:px-5");

        // El nombre largo baja a dos líneas en tablet; en PC va en una.
        const nombre = within(tabla).getByText("Ruiz Ana");
        expect(nombre).toHaveClass("max-w-[150px]", "xl:max-w-none");
        expect(nombre.closest("td")).toHaveClass("left-10", "xl:left-16", "xl:truncate");
        expect(within(tabla).getByRole("spinbutton")).toHaveClass("max-w-[56px]", "xl:max-w-[70px]");
    });

    it("muestra el estado vacío cuando no hay estudiantes", () => {
        render(
            <TablaNotasPlanilla
                estudiantes={[]}
                columnas={["quiz"]}
                guardarNota={vi.fn()}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );

        expect(screen.getByText("No hay estudiantes para mostrar.")).toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
    });
});
