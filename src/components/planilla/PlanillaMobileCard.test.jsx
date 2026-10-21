import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PlanillaMobileCard from "./PlanillaMobileCard";

const formatearEtiquetaColumna = (valor) => (valor === "quiz" ? "Quiz" : valor);

describe("PlanillaMobileCard", () => {
    it("la rueda del mouse no cambia la nota: el campo suelta el foco", () => {
        const guardarNota = vi.fn().mockResolvedValue(true);
        render(
            <PlanillaMobileCard
                est={{ estudiante_id: 301, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4 }, promedio: "4.00" }}
                numero={1}
                columnas={["quiz"]}
                guardarNota={guardarNota}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
            />,
        );
        const input = screen.getByRole("spinbutton");
        input.focus();
        expect(input).toHaveFocus();

        fireEvent.wheel(input, { deltaY: -100 });

        expect(input).not.toHaveFocus();
        expect(input).toHaveValue(4);
        // Al soltar el foco se guarda lo escrito, como al hacer clic afuera.
        expect(guardarNota).toHaveBeenCalledWith(301, "quiz", "4");
    });

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
        // Sin las flechitas de subir y bajar: la nota se escribe.
        expect(input).toHaveClass("[appearance:textfield]");

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

    it("avisa en la tarjeta cuando una nota quedó sin guardar", () => {
        const est = {
            estudiante_id: 305,
            nombre: "Eva",
            apellido: "Mora",
            notas: { quiz: 4 },
            promedio: "4.00",
        };
        render(
            <PlanillaMobileCard
                est={est}
                numero={5}
                columnas={["quiz"]}
                guardarNota={vi.fn()}
                tipoEvaluacion="numerica"
                formatearEtiquetaColumna={formatearEtiquetaColumna}
                notasSinGuardar={{ "305|quiz": true }}
            />,
        );

        const input = screen.getByRole("spinbutton");
        expect(input).toHaveValue(4);
        expect(input).toHaveClass("border-red-500");
        expect(screen.getByText("Sin guardar")).toBeInTheDocument();
    });
});

describe("PlanillaMobileCard con subnotas", () => {
    const SUBNOTAS = { quiz: [{ id: 7, nombre: "Taller 1" }] };

    function renderConSubnotas(est, tipoEvaluacion = "numerica") {
        const onAbrirSubnotas = vi.fn();
        render(
            <PlanillaMobileCard
                est={est}
                numero={1}
                columnas={["quiz"]}
                guardarNota={vi.fn()}
                tipoEvaluacion={tipoEvaluacion}
                formatearEtiquetaColumna={formatearEtiquetaColumna}
                subnotasPorTipo={SUBNOTAS}
                onAbrirSubnotas={onAbrirSubnotas}
            />,
        );
        return onAbrirSubnotas;
    }

    it("a mano: campo de siempre y botón de subnotas junto al tipo", async () => {
        const onAbrir = renderConSubnotas({ estudiante_id: 301, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4 }, subnotas: {}, promedio: "4.00" });

        expect(screen.getByRole("spinbutton")).toHaveValue(4);
        expect(screen.getByText("1.0 a 5.0")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Subnotas de Quiz de Ruiz Ana" }));

        expect(onAbrir).toHaveBeenCalledWith(301, "quiz");
    });

    it("calculada: el promedio ocupa el lugar del campo y abre las subnotas", async () => {
        const onAbrir = renderConSubnotas({ estudiante_id: 301, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4.5 }, subnotas: { 7: 4.5 }, promedio: "4.50" });

        expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
        expect(screen.getByText("Calculada")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: /^Quiz de Ruiz Ana: 4.50. Calculada con 1 subnota./ }));

        expect(onAbrir).toHaveBeenCalledWith(301, "quiz");
    });

    it("calculada en preescolar: la carita con su nombre", () => {
        renderConSubnotas(
            { estudiante_id: 302, nombre: "Luis", apellido: "Pérez", notas: {}, valoraciones: { quiz: "destacado" }, subnotas: { 7: "destacado" }, promedio: "5.00" },
            "desarrollo",
        );

        const celda = screen.getByRole("button", { name: /^Quiz de Pérez Luis: Destacado./ });
        expect(celda).toHaveTextContent("⭐");
        expect(celda).toHaveTextContent("Destacado");
    });
});
