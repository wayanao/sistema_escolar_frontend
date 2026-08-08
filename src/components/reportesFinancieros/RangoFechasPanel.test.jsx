import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RangoFechasPanel from "./RangoFechasPanel";

describe("RangoFechasPanel", () => {
  it("presenta las fechas controladas y los estudiantes por curso", () => {
    render(
      <RangoFechasPanel
        fechaInicio="2026-08-01"
        fechaFin="2026-08-08"
        onCambiarFechaInicio={vi.fn()}
        onCambiarFechaFin={vi.fn()}
        onConsultarIngresos={vi.fn()}
        onConsultarEgresos={vi.fn()}
        loadingDetalle={false}
        estudiantesPorCurso={[{ curso: "5A", cantidad: 30 }]}
      />
    );

    // Nota: la etiqueta no está asociada al input (sin htmlFor/id) en el
    // JSX original; se conserva tal cual, sin agregarla en esta migración.
    expect(screen.getByDisplayValue("2026-08-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-08-08")).toBeInTheDocument();
    expect(screen.getByText("5A")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("delega los cambios de fecha con el valor del input", () => {
    const onCambiarFechaInicio = vi.fn();
    const onCambiarFechaFin = vi.fn();
    render(
      <RangoFechasPanel
        fechaInicio="2026-08-01"
        fechaFin="2026-08-08"
        onCambiarFechaInicio={onCambiarFechaInicio}
        onCambiarFechaFin={onCambiarFechaFin}
        onConsultarIngresos={vi.fn()}
        onConsultarEgresos={vi.fn()}
        loadingDetalle={false}
        estudiantesPorCurso={[]}
      />
    );

    const [inputDesde, inputHasta] = screen.getAllByDisplayValue(/2026-08-0[18]/);
    fireEvent.change(inputDesde, { target: { value: "2026-08-02" } });
    fireEvent.change(inputHasta, { target: { value: "2026-08-09" } });

    expect(onCambiarFechaInicio).toHaveBeenCalledWith("2026-08-02");
    expect(onCambiarFechaFin).toHaveBeenCalledWith("2026-08-09");
  });

  it("delega la consulta de ingresos y egresos, y deshabilita los botones mientras carga", () => {
    const onConsultarIngresos = vi.fn();
    const onConsultarEgresos = vi.fn();
    render(
      <RangoFechasPanel
        fechaInicio="2026-08-01"
        fechaFin="2026-08-08"
        onCambiarFechaInicio={vi.fn()}
        onCambiarFechaFin={vi.fn()}
        onConsultarIngresos={onConsultarIngresos}
        onConsultarEgresos={onConsultarEgresos}
        loadingDetalle={true}
        estudiantesPorCurso={[]}
      />
    );

    const botonIngresos = screen.getByRole("button", { name: "Ingresos" });
    const botonEgresos = screen.getByRole("button", { name: "Egresos" });
    expect(botonIngresos).toBeDisabled();
    expect(botonEgresos).toBeDisabled();

    fireEvent.click(botonIngresos);
    fireEvent.click(botonEgresos);

    expect(onConsultarIngresos).not.toHaveBeenCalled();
    expect(onConsultarEgresos).not.toHaveBeenCalled();
  });
});
