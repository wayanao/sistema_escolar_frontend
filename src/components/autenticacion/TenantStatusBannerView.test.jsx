import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TenantStatusBannerView from "./TenantStatusBannerView";

describe("TenantStatusBannerView", () => {
  it("no agrega contenido cuando no recibe aviso", () => {
    const { container } = render(<TenantStatusBannerView aviso={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("presenta el mensaje y estado recibidos", () => {
    render(
      <TenantStatusBannerView
        aviso={{ mensaje: "El pago vence hoy.", estado: "en_mora" }}
      />,
    );

    expect(screen.getByText("Servicio en mora")).toBeInTheDocument();
    expect(screen.getByText("El pago vence hoy.")).toBeInTheDocument();
    expect(screen.getByText("en_mora")).toBeInTheDocument();
  });

  it.each([undefined, ""])("conserva el fallback para mensaje %s", (mensaje) => {
    render(<TenantStatusBannerView aviso={{ mensaje, estado: "en_mora" }} />);

    expect(
      screen.getByText(
        "Tu servicio se encuentra en mora. Por favor realiza el pago para evitar suspensión.",
      ),
    ).toBeInTheDocument();
  });
});
