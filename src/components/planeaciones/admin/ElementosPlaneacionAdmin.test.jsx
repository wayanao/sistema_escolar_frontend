import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  EstadoPlaneacionAdminBadge,
  MensajeEstadoPlaneacionAdmin,
  SpinnerPlaneacionAdmin,
} from "./ElementosPlaneacionAdmin";

describe("ElementosPlaneacionAdmin", () => {
  it("traduce estados internos y usa pendiente como alternativa segura", () => {
    const { rerender } = render(
      <EstadoPlaneacionAdminBadge estado="con_observaciones" />,
    );

    expect(screen.getByText("Revisado")).toHaveClass("text-emerald-800");

    rerender(<EstadoPlaneacionAdminBadge estado="desconocido" />);

    expect(screen.getByText("Sin abrir")).toHaveClass("text-amber-800");
  });

  it("diferencia mensajes exitosos de errores mediante roles accesibles", () => {
    const { rerender } = render(
      <MensajeEstadoPlaneacionAdmin
        tono="exito"
        mensaje="La planeación fue aprobada."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Actualización nueva");
    expect(screen.getByRole("status")).toHaveTextContent(
      "La planeación fue aprobada.",
    );

    rerender(
      <MensajeEstadoPlaneacionAdmin
        tono="error"
        mensaje="No fue posible actualizar."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No fue posible actualizar.",
    );
  });

  it("permite ajustar el tamaño visual del indicador de carga", () => {
    const { container } = render(
      <SpinnerPlaneacionAdmin className="h-8 w-8 border-4" />,
    );

    expect(container.firstChild).toHaveClass(
      "h-8",
      "w-8",
      "border-4",
      "animate-spin",
    );
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
