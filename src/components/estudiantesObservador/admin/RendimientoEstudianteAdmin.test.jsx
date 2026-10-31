import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { normalizarDetalleEstudiante } from "../../../utils/estudiantesObservador/estudiantes";
import RendimientoEstudianteAdmin from "./RendimientoEstudianteAdmin";

const sinNota = { 1: null, 2: null, 3: null, 4: null };

const PRIMARIA = normalizarDetalleEstudiante(
  {
    notas_por_periodo: {
      materias: [
        {
          materia: "MATEMÁTICAS",
          tipo_evaluacion: "numerica",
          periodos: { ...sinNota, 1: { nota: 4.67, valoracion: null }, 2: { nota: 2.5, valoracion: null } },
          anio: { nota: 3.59, valoracion: null },
        },
        {
          materia: "SOCIALES",
          tipo_evaluacion: "numerica",
          periodos: { ...sinNota, 1: { nota: 3.25, valoracion: null } },
          anio: { nota: 3.25, valoracion: null },
        },
      ],
      promedio: { 1: 3.96, 2: 2.5, 3: null, 4: null, anio: 3.42 },
    },
    inasistencias_por_periodo: { 1: 4, 2: 1, 3: 0, 4: 0, anio: 5 },
  },
  {},
);

const PREESCOLAR = normalizarDetalleEstudiante(
  {
    notas_por_periodo: {
      materias: [
        {
          materia: "DIMENSIÓN COGNITIVA",
          tipo_evaluacion: "desarrollo",
          periodos: { ...sinNota, 1: { nota: 4.5, valoracion: "destacado" } },
          anio: { nota: 4.5, valoracion: "destacado" },
        },
      ],
      promedio: { 1: null, 2: null, 3: null, 4: null, anio: null },
    },
    inasistencias_por_periodo: { 1: 2, 2: 0, 3: 0, 4: 0, anio: 2 },
  },
  {},
);

const fila = (materia) => screen.getByText(materia).closest("li");

describe("RendimientoEstudianteAdmin", () => {
  it("muestra los cinco botones con el periodo marcado", () => {
    render(<RendimientoEstudianteAdmin detalles={PRIMARIA} periodo="2" />);

    const grupo = screen.getByRole("group", { name: "Periodo de las notas" });
    const botones = within(grupo).getAllByRole("button");
    expect(botones.map((boton) => boton.textContent)).toEqual([
      "Periodo 1", "Periodo 2", "Periodo 3", "Periodo 4", "Todo el año",
    ]);
    expect(within(grupo).getByRole("button", { name: "Periodo 2" })).toHaveAttribute("aria-pressed", "true");
    expect(within(grupo).getByRole("button", { name: "Periodo 1" })).toHaveAttribute("aria-pressed", "false");
  });

  it("en un periodo: promedio, inasistencias y la nota de cada materia con su color", () => {
    render(<RendimientoEstudianteAdmin detalles={PRIMARIA} periodo="2" />);

    expect(screen.getByText("Promedio General:").parentElement).toHaveTextContent("Promedio General: 2.5");
    expect(screen.getByText("Inasistencias:").parentElement).toHaveTextContent("Inasistencias: 1");
    expect(within(fila("MATEMÁTICAS")).getByText("2.5")).toHaveClass("text-red-600");
    expect(within(fila("SOCIALES")).getByText("Sin nota")).toBeInTheDocument();
  });

  it("Todo el año usa la nota del año y el total de inasistencias", () => {
    render(<RendimientoEstudianteAdmin detalles={PRIMARIA} periodo="anio" />);

    expect(within(fila("MATEMÁTICAS")).getByText("3.6")).toHaveClass("text-green-600");
    expect(screen.getByText("Inasistencias:").parentElement).toHaveTextContent("Inasistencias: 5");
  });

  it("preescolar muestra la carita, sin promedio general", () => {
    render(<RendimientoEstudianteAdmin detalles={PREESCOLAR} periodo="1" />);

    expect(within(fila("DIMENSIÓN COGNITIVA")).getByText("⭐ Destacado")).toBeInTheDocument();
    expect(screen.queryByText("Promedio General:")).not.toBeInTheDocument();
    expect(screen.getByText("Inasistencias:").parentElement).toHaveTextContent("Inasistencias: 2");
  });

  it("un periodo sin notas lo dice", () => {
    render(<RendimientoEstudianteAdmin detalles={PRIMARIA} periodo="4" />);

    expect(screen.getByText("No hay notas en este periodo.")).toBeInTheDocument();
  });

  it("escoger otro periodo avisa cuál", () => {
    const onCambiarPeriodo = vi.fn();
    render(
      <RendimientoEstudianteAdmin detalles={PRIMARIA} periodo="2" onCambiarPeriodo={onCambiarPeriodo} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Todo el año" }));

    expect(onCambiarPeriodo).toHaveBeenCalledWith("anio");
  });

  it("con un backend anterior, sin periodos, se ve como antes", () => {
    render(
      <RendimientoEstudianteAdmin
        detalles={normalizarDetalleEstudiante(
          { notas: [{ materia: "MATEMÁTICAS", promedio: 4.2 }], promedio_general: 4.2, inasistencias: 3 },
          {},
        )}
        periodo="1"
      />,
    );

    expect(screen.queryByRole("group", { name: "Periodo de las notas" })).not.toBeInTheDocument();
    expect(screen.getByText("Promedio de Notas por Materia:")).toBeInTheDocument();
    expect(screen.getByText("Inasistencias Acumuladas:").parentElement).toHaveTextContent("3");
  });
});
