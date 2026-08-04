import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FacturaModerna from "./FacturaModerna";

describe("FacturaModerna", () => {
  it("conserva la identificación, estudiante, concepto y total del comprobante", () => {
    render(
      <FacturaModerna
        pago={{
          pago_id: 42,
          descripcion: "Pensión agosto",
          fecha: "2026-08-04",
          monto: 123456,
        }}
        estudiante={{
          nombre: "Ana",
          apellido: "Pérez",
          documento: "1007",
          direccion: "Calle 1",
          telefono: "3001234567",
        }}
      />
    );

    expect(screen.getByText("FAC-000042")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Documento: 1007")).toBeInTheDocument();
    expect(screen.getByText("Pensión agosto")).toBeInTheDocument();
    expect(screen.getByText("2026-08-04")).toBeInTheDocument();
    expect(screen.getAllByText("$123.456")).toHaveLength(4);
  });
});
