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
