import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PlanillaRow from "./PlanillaRow";

const formatearEtiquetaColumna = (valor) => (valor === "quiz" ? "Quiz" : valor);

function renderFila({
  est,
  tipoEvaluacion = "numerica",
  guardarNota = vi.fn(),
  notasSinGuardar = {},
} = {}) {
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
          notasSinGuardar={notasSinGuardar}
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

    // Sin ninguna carita puesta el promedio queda vacio y la celda muestra el
    // guion, en el gris neutro que usa el modo desarrollo.
    expect(screen.getByText("—").closest("span.text-sm")).toHaveClass(
      "text-gray-900",
    );
  });

  it("marca la celda cuyo guardado falló, sin borrar lo que escribió el profesor", () => {
    const est = {
      estudiante_id: 305,
      nombre: "Eva",
      apellido: "Mora",
      notas: { quiz: 4 },
      promedio: "4.00",
    };
    renderFila({ est, notasSinGuardar: { "305|quiz": true } });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(4);
    expect(input).toHaveClass("border-red-500");
    expect(input).toHaveAttribute(
      "title",
      "Sin guardar. Vuelve a salir de la celda para reintentar.",
    );
  });

  it("no marca las celdas que sí se guardaron", () => {
    const est = {
      estudiante_id: 306,
      nombre: "Noa",
      apellido: "Lara",
      notas: { quiz: 4 },
      promedio: "4.00",
    };
    renderFila({ est, notasSinGuardar: { "999|quiz": true } });

    expect(screen.getByRole("spinbutton")).not.toHaveClass("border-red-500");
  });

  it("muestra la carita del promedio y nunca su equivalencia numérica", () => {
    const est = {
      estudiante_id: 304,
      nombre: "Iván",
      apellido: "Soto",
      notas: {},
      valoraciones: { quiz: "destacado" },
      promedio: "5.00",
    };
    renderFila({ est, tipoEvaluacion: "desarrollo" });

    // Se acota a la ultima celda: el emoji tambien vive en los botones de
    // calificar, y lo que se comprueba aqui es la columna de promedio.
    const celdaPromedio = screen.getAllByRole("cell").at(-1);
    expect(within(celdaPromedio).getByTitle("Destacado")).toBeInTheDocument();
    expect(screen.queryByText("5.00")).not.toBeInTheDocument();
  });
});
