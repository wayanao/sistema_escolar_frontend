import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HistorialPagos from "./HistorialPagos";

const pagoAgosto = {
  pago_id: 42,
  descripcion: "Pensión agosto",
  fecha: "2026-08-04",
  monto: 100000,
  tipo_pago: "efectivo",
  anulado: false,
};

const pagoJulio = {
  pago_id: 41,
  descripcion: "Pensión julio",
  fecha: "2026-07-04",
  monto: 100000,
  tipo_pago: "transferencia",
  anulado: false,
};

const boton = () => screen.getByRole("button", { name: /historial/ });

describe("HistorialPagos", () => {
  it("presenta el estado vacío, sin botón", () => {
    render(<HistorialPagos pagos={[]} onImprimir={vi.fn()} onAnular={vi.fn()} />);

    expect(screen.getByText("No hay pagos registrados para este estudiante.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /historial/ })).not.toBeInTheDocument();
  });

  it("empieza cerrado: solo el botón, con cuántos pagos hay", () => {
    render(
      <HistorialPagos pagos={[pagoAgosto, pagoJulio]} onImprimir={vi.fn()} onAnular={vi.fn()} />
    );

    expect(boton()).toHaveAttribute("aria-expanded", "false");
    expect(boton()).toHaveTextContent("Ver historial de pagos");
    expect(boton()).toHaveTextContent("2 pagos registrados");
    expect(screen.queryByText("Pensión agosto")).not.toBeInTheDocument();
  });

  it("el botón abre y cierra el historial completo", () => {
    render(
      <HistorialPagos pagos={[pagoAgosto, pagoJulio]} onImprimir={vi.fn()} onAnular={vi.fn()} />
    );

    fireEvent.click(boton());
    expect(boton()).toHaveAttribute("aria-expanded", "true");
    expect(boton()).toHaveTextContent("Ocultar historial");
    expect(screen.getByText("Pensión agosto")).toBeInTheDocument();
    expect(screen.getByText("Pensión julio")).toBeInTheDocument();

    fireEvent.click(boton());
    expect(screen.queryByText("Pensión julio")).not.toBeInTheDocument();
  });

  it("después de registrar muestra solo ese pago, con todas sus filas", () => {
    // Dos métodos de pago: el backend crea una fila por cada uno.
    const efectivo = {
      ...pagoAgosto,
      pago_id: 50,
      descripcion: "Pensión · Cuotas: Septiembre",
      monto: 60000,
    };
    const transferencia = { ...efectivo, pago_id: 51, tipo_pago: "transferencia", monto: 40000 };
    render(
      <HistorialPagos
        pagos={[transferencia, efectivo, pagoAgosto]}
        idsRecientes={[50, 51]}
        onImprimir={vi.fn()}
        onAnular={vi.fn()}
      />
    );

    expect(screen.getByText(/Pago recién registrado/)).toBeInTheDocument();
    expect(screen.getAllByText("Pensión · Cuotas: Septiembre")).toHaveLength(2);
    expect(screen.queryByText("Pensión agosto")).not.toBeInTheDocument();
    expect(boton()).toHaveTextContent("3 pagos registrados");
  });

  it("delega impresión y anulación para un pago vigente", () => {
    const onImprimir = vi.fn();
    const onAnular = vi.fn();
    render(<HistorialPagos pagos={[pagoAgosto]} onImprimir={onImprimir} onAnular={onAnular} />);
    fireEvent.click(boton());

    fireEvent.click(screen.getByRole("button", { name: /Imprimir Recibo/ }));
    fireEvent.click(screen.getByRole("button", { name: "Anular pago" }));

    expect(onImprimir).toHaveBeenCalledWith(pagoAgosto);
    expect(onAnular).toHaveBeenCalledWith(pagoAgosto);
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
    fireEvent.click(boton());

    expect(screen.getByText("Anulado")).toBeInTheDocument();
    expect(screen.getByText("Motivo: Registro duplicado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Imprimir Recibo/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Anular pago" })).not.toBeInTheDocument();
  });
});
