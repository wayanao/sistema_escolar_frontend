import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ComprobantePago from "./ComprobantePago";

vi.mock("../impresion/DocumentoImprimible", () => ({
  default: ({ tipo, titulo, subtitulo, children }) => (
    <section data-tipo={tipo}>
      <h1>{titulo}</h1>
      <p>{subtitulo}</p>
      {children}
    </section>
  ),
}));

describe("ComprobantePago", () => {
  it("no presenta contenido sin pago o estudiante", () => {
    const { container } = render(
      <ComprobantePago pago={null} estudiante={null} onCerrar={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("conserva el voucher y delega el cierre", () => {
    const onCerrar = vi.fn();
    render(
      <ComprobantePago
        pago={{ pago_id: 42, descripcion: "Pensión", fecha: "2026-08-04", monto: 100000 }}
        estudiante={{ nombre: "Ana", apellido: "Pérez", documento: "1007" }}
        onCerrar={onCerrar}
      />
    );

    expect(screen.getByText("Comprobante de Pago")).toBeInTheDocument();
    expect(screen.getByText("Factura #FAC-000042")).toBeInTheDocument();
    expect(screen.getByText("FAC-000042")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Volver" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
