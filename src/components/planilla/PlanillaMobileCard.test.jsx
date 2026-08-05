import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PlanillaMobileCard from "./PlanillaMobileCard";

const formatearEtiquetaColumna = (valor) => (valor === "quiz" ? "Quiz" : valor);

describe("PlanillaMobileCard", () => {
    it("muestra el promedio, los límites del input numérico y guarda un valor nuevo al perder el foco", () => {
        const guardarNota = vi.fn().mockResolvedValue(true);
        const est = {
            estudiante_id: 301,
            nombre: "Ana",
            apellido: "Ruiz",
            notas: { quiz: 4 },
            promedio: "4.00",
        };
        render(
            <PlanillaMobileCard
                est={est}
                numero={1}
                columnas={["quiz"]}
                guardarNota={guardarNota}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );

        expect(screen.getByText("Ruiz Ana")).toBeInTheDocument();
        expect(screen.getByText("Promedio: 4.00")).toHaveClass("text-emerald-600");

        const input = screen.getByRole("spinbutton");
        expect(input).toHaveValue(4);
        expect(input).toHaveAttribute("min", "1");
        expect(input).toHaveAttribute("max", "5");
        expect(input).toHaveAttribute("step", "0.1");

        fireEvent.change(input, { target: { value: "5" } });
        fireEvent.blur(input);

        expect(guardarNota).toHaveBeenCalledWith(301, "quiz", "5");
    });

    it("marca el promedio bajo en rojo y restaura el valor anterior cuando el guardado es rechazado", async () => {
        const guardarNota = vi.fn().mockResolvedValue(false);
        const est = {
            estudiante_id: 302,
            nombre: "Luis",
            apellido: "Pérez",
            notas: { quiz: 2 },
            promedio: "2.00",
        };
        render(
            <PlanillaMobileCard
                est={est}
                numero={2}
                columnas={["quiz"]}
                guardarNota={guardarNota}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );

        expect(screen.getByText("Promedio: 2.00")).toHaveClass("text-red-600");

        const input = screen.getByRole("spinbutton");
        fireEvent.change(input, { target: { value: "9" } });
        fireEvent.blur(input);

        await waitFor(() => expect(input).toHaveValue(2));
        expect(document.activeElement).toBe(input);
    });

    it("resalta la valoración de desarrollo activa y notifica la selección elegida", async () => {
        const user = userEvent.setup();
        const guardarNota = vi.fn().mockResolvedValue(true);
        const est = {
            estudiante_id: 303,
            nombre: "Zoe",
            apellido: "Vera",
            notas: {},
            valoraciones: { quiz: "logrado" },
            promedio: "",
        };
        render(
            <PlanillaMobileCard
                est={est}
                numero={3}
                columnas={["quiz"]}
                guardarNota={guardarNota}
                tipoEvaluacion="desarrollo"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );

        expect(screen.getByText("Promedio: —")).toBeInTheDocument();

        const activo = screen.getByRole("button", { name: "Logrado en Quiz" });
        expect(activo).toHaveClass("border-emerald-500");
        const otro = screen.getByRole("button", { name: "Destacado en Quiz" });
        expect(otro).not.toHaveClass("border-emerald-500");

        await user.click(otro);
        expect(guardarNota).toHaveBeenCalledWith(303, "quiz", "destacado");
    });

    it("muestra el estado vacío cuando no hay tipos de evaluación registrados", () => {
        const est = {
            estudiante_id: 304,
            nombre: "Iris",
            apellido: "Gómez",
            notas: {},
            promedio: "",
        };
        render(
            <PlanillaMobileCard
                est={est}
                numero={4}
                columnas={[]}
                guardarNota={vi.fn()}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );

        expect(screen.getByText("No hay tipos de evaluación registrados.")).toBeInTheDocument();
    });
});
