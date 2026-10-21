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
    // Sin las flechitas de subir y bajar: la nota se escribe.
    expect(input).toHaveClass("[appearance:textfield]");
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

describe("PlanillaRow con subnotas", () => {
  const SUBNOTAS = { quiz: [{ id: 7, nombre: "Taller 1" }, { id: 8, nombre: "Parcial" }] };

  function renderConSubnotas(est, { tipoEvaluacion = "numerica", onAbrirSubnotas = vi.fn() } = {}) {
    render(
      <table>
        <tbody>
          <PlanillaRow
            est={est}
            numero={1}
            columnas={["quiz"]}
            guardarNota={vi.fn()}
            tipoEvaluacion={tipoEvaluacion}
            formatearEtiquetaColumna={formatearEtiquetaColumna}
            notasSinGuardar={{}}
            subnotasPorTipo={SUBNOTAS}
            onAbrirSubnotas={onAbrirSubnotas}
          />
        </tbody>
      </table>,
    );
    return onAbrirSubnotas;
  }

  it("una celda a mano conserva su campo y suma el botón de subnotas", async () => {
    const est = { estudiante_id: 301, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 4 }, subnotas: {}, promedio: "4.00" };
    const onAbrir = renderConSubnotas(est);

    expect(screen.getByRole("spinbutton")).toHaveValue(4);
    await userEvent.click(screen.getByRole("button", { name: "Subnotas de Quiz de Ruiz Ana" }));

    expect(onAbrir).toHaveBeenCalledWith(301, "quiz");
  });

  it("P1: una celda con subnotas calificadas muestra el promedio y no se escribe a mano", async () => {
    const est = { estudiante_id: 301, nombre: "Ana", apellido: "Ruiz", notas: { quiz: 3.8 }, subnotas: { 7: 4, 8: 3.6 }, promedio: "3.80" };
    const onAbrir = renderConSubnotas(est);

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    const celda = screen.getByRole("button", {
      name: "Quiz de Ruiz Ana: 3.80. Calculada con 2 subnotas. Abrir subnotas",
    });
    expect(celda).toHaveAttribute("title", "Calculada con 2 subnotas");
    await userEvent.click(celda);

    expect(onAbrir).toHaveBeenCalledWith(301, "quiz");
  });

  it("en preescolar la celda calculada muestra la carita", () => {
    const est = {
      estudiante_id: 302, nombre: "Luis", apellido: "Pérez",
      notas: {}, valoraciones: { quiz: "logrado" }, subnotas: { 7: "logrado" }, promedio: "4.00",
    };
    renderConSubnotas(est, { tipoEvaluacion: "desarrollo" });

    const celda = screen.getByRole("button", { name: /^Quiz de Pérez Luis: Logrado. Calculada con 1 subnota./ });
    expect(within(celda).getByText("😀")).toBeInTheDocument();
    // Las cuatro caritas a mano ya no están en esa celda.
    expect(screen.queryByRole("button", { name: "Logrado en Quiz" })).not.toBeInTheDocument();
  });
});
