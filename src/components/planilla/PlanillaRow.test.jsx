import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PlanillaRow from "./PlanillaRow";

const formatearEtiquetaColumna = (valor) => (valor === "quiz" ? "Quiz" : valor);

function renderFila({ est, tipoEvaluacion = "numerica", guardarNota = vi.fn() } = {}) {
  render(
    <table>
      <tbody>
        <PlanillaRow
          est={est}
          numero={1}
          columnas={["quiz"]}
          guardarNota={guardarNota}
          tipoEvaluacion={tipoEvaluacion}
          formatearEtiquetaColumna={formatearEtiquetaColumna}
        />
      </tbody>
    </table>,
  );
}

describe("PlanillaRow", () => {
  it("muestra la nota numérica actual, sus límites y guarda un valor nuevo al perder el foco", () => {
    const guardarNota = vi.fn().mockResolvedValue(true);
    const est = {
      estudiante_id: 301,
      nombre: "Ana",
      apellido: "Ruiz",
      notas: { quiz: 4 },
      promedio: "4.00",
    };
    renderFila({ est, guardarNota });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(4);
    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "5");
    expect(input).toHaveAttribute("step", "0.1");
    expect(screen.getByText("4.00")).toHaveClass("text-emerald-600");

    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);

    expect(guardarNota).toHaveBeenCalledWith(301, "quiz", "5");
  });

  it("marca el promedio bajo un rojo y restaura el valor anterior cuando el guardado es rechazado", async () => {
    const guardarNota = vi.fn().mockResolvedValue(false);
    const est = {
      estudiante_id: 302,
      nombre: "Luis",
      apellido: "Pérez",
      notas: { quiz: 2 },
      promedio: "2.00",
    };
    renderFila({ est, guardarNota });

    expect(screen.getByText("2.00")).toHaveClass("text-red-600");

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
    renderFila({ est, guardarNota, tipoEvaluacion: "desarrollo" });

    const activo = screen.getByRole("button", { name: "Logrado en Quiz" });
    expect(activo).toHaveClass("border-emerald-500");

    const otro = screen.getByRole("button", { name: "Destacado en Quiz" });
    expect(otro).not.toHaveClass("border-emerald-500");

    await user.click(otro);
    expect(guardarNota).toHaveBeenCalledWith(303, "quiz", "destacado");

    expect(screen.getByText("—")).toHaveClass("text-gray-900");
  });
});
