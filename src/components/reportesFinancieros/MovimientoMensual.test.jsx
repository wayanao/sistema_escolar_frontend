import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatoMoneda, nombreMes } from "../../utils/reportesFinancieros/formatos";
import MovimientoMensual from "./MovimientoMensual";

const dinero = (valor) => formatoMoneda(valor).replace(/\s+/g, " ");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("MovimientoMensual", () => {
  it("presenta el estado vacío cuando no hay meses", () => {
    render(<MovimientoMensual mesesFinancieros={[]} onVerIngresosMes={vi.fn()} onVerEgresosMes={vi.fn()} />);

    expect(screen.getByText("No hay movimientos registrados.")).toBeInTheDocument();
  });

  it("presenta un mes con sus montos formateados", () => {
    vi.stubEnv("TZ", "UTC");
    const meses = [{ mes: "2026-08", ingreso: 4000000, egreso: 900000, balance: 3100000, maximo: 4000000 }];

    render(<MovimientoMensual mesesFinancieros={meses} onVerIngresosMes={vi.fn()} onVerEgresosMes={vi.fn()} />);

    expect(screen.getByText(nombreMes("2026-08"))).toBeInTheDocument();
    expect(screen.getByText(dinero(4000000))).toBeInTheDocument();
    expect(screen.getByText(dinero(900000))).toBeInTheDocument();
    expect(screen.getByText(dinero(3100000))).toHaveClass("bg-blue-100");
  });

  it("marca en rojo un balance mensual negativo", () => {
    vi.stubEnv("TZ", "UTC");
    const meses = [{ mes: "2026-08", ingreso: 100000, egreso: 400000, balance: -300000, maximo: 400000 }];

    render(<MovimientoMensual mesesFinancieros={meses} onVerIngresosMes={vi.fn()} onVerEgresosMes={vi.fn()} />);

    expect(screen.getByText(dinero(-300000))).toHaveClass("bg-red-50", "text-red-700");
  });

  it("delega la consulta de ingresos y egresos del mes seleccionado", () => {
    vi.stubEnv("TZ", "UTC");
    const onVerIngresosMes = vi.fn();
    const onVerEgresosMes = vi.fn();
    const meses = [{ mes: "2026-08", ingreso: 100000, egreso: 40000, balance: 60000, maximo: 100000 }];

    render(
      <MovimientoMensual mesesFinancieros={meses} onVerIngresosMes={onVerIngresosMes} onVerEgresosMes={onVerEgresosMes} />
    );

    fireEvent.click(screen.getByText(nombreMes("2026-08")));
    fireEvent.click(screen.getByText(dinero(40000)));

    expect(onVerIngresosMes).toHaveBeenCalledWith("2026-08");
    expect(onVerEgresosMes).toHaveBeenCalledWith("2026-08");
  });
});
