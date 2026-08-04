import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HistorialPagos from "./HistorialPagos";

describe("HistorialPagos", () => {
  it("presenta el estado vacío", () => {
    render(<HistorialPagos pagos={[]} onImprimir={vi.fn()} onAnular={vi.fn()} />);

    expect(screen.getByText("No hay pagos registrados para este estudiante.")).toBeInTheDocument();
  });

  it("delega impresión y anulación para un pago vigente", () => {
    const onImprimir = vi.fn();
    const onAnular = vi.fn();
    const pago = {
      pago_id: 42,
      descripcion: "Pensión agosto",
      fecha: "2026-08-04",
      monto: 100000,
      tipo_pago: "efectivo",
      anulado: false,
    };
    render(<HistorialPagos pagos={[pago]} onImprimir={onImprimir} onAnular={onAnular} />);

    fireEvent.click(screen.getByRole("button", { name: /Imprimir Recibo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Anular pago" }));

    expect(onImprimir).toHaveBeenCalledWith(pago);
    expect(onAnular).toHaveBeenCalledWith(pago);
  });

  it("conserva el estado anulado y bloquea sus acciones", () => {
    render(
      <HistorialPagos
        pagos={[{
          pago_id: 43,
          descripcion: "Matrícula",
          fecha: "2026-08-03",
          monto: 90000,
          anulado: true,
          motivo_anulacion: "Registro duplicado",
        }]}
        onImprimir={vi.fn()}
        onAnular={vi.fn()}
      />
    );

    expect(screen.getByText("Anulado")).toBeInTheDocument();
    expect(screen.getByText("Motivo: Registro duplicado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Imprimir Recibo/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Anular pago" })).not.toBeInTheDocument();
  });
});
