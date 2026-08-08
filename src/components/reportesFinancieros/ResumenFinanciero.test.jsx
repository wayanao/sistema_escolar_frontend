import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { formatoMoneda } from "../../utils/reportesFinancieros/formatos";
import ResumenFinanciero from "./ResumenFinanciero";

const dinero = (valor) => formatoMoneda(valor).replace(/\s+/g, " ");

const stats = {
  ingresos_hoy: 200000,
  egresos_hoy: 50000,
  balance_hoy: 150000,
  balance_general: 3800000,
  total_estudiantes: 120,
  total_profesores: 15,
  total_ingresos: 5000000,
  total_egresos: 1200000,
};

describe("ResumenFinanciero", () => {
  it("presenta las ocho estadísticas formateadas", () => {
    render(
      <ResumenFinanciero
        stats={stats}
        onVerIngresosHoy={vi.fn()}
        onVerEgresosHoy={vi.fn()}
        onVerEgresosAcumulados={vi.fn()}
      />
    );

    expect(screen.getByText(dinero(200000))).toBeInTheDocument();
    expect(screen.getByText(dinero(50000))).toBeInTheDocument();
    expect(screen.getByText(dinero(150000))).toBeInTheDocument();
    expect(screen.getByText(dinero(3800000))).toBeInTheDocument();
    expect(screen.getByText(dinero(5000000))).toBeInTheDocument();
    expect(screen.getByText(dinero(1200000))).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("muestra en rojo un balance negativo", () => {
    render(
      <ResumenFinanciero
        stats={{ ...stats, balance_hoy: -5000 }}
        onVerIngresosHoy={vi.fn()}
        onVerEgresosHoy={vi.fn()}
        onVerEgresosAcumulados={vi.fn()}
      />
    );

    expect(screen.getByText(dinero(-5000))).toHaveClass("text-red-700");
  });

  it("delega los tres callbacks de navegación al detalle", () => {
    const onVerIngresosHoy = vi.fn();
    const onVerEgresosHoy = vi.fn();
    const onVerEgresosAcumulados = vi.fn();
    render(
      <ResumenFinanciero
        stats={stats}
        onVerIngresosHoy={onVerIngresosHoy}
        onVerEgresosHoy={onVerEgresosHoy}
        onVerEgresosAcumulados={onVerEgresosAcumulados}
      />
    );

    fireEvent.click(screen.getByText("Ingresos hoy"));
    fireEvent.click(screen.getByText("Egresos hoy"));
    fireEvent.click(screen.getByText("Egresos acumulados"));

    expect(onVerIngresosHoy).toHaveBeenCalledTimes(1);
    expect(onVerEgresosHoy).toHaveBeenCalledTimes(1);
    expect(onVerEgresosAcumulados).toHaveBeenCalledTimes(1);
  });
});
