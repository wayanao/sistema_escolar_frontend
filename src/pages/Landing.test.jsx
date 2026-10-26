import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing rutaIngreso="/login" />
    </MemoryRouter>,
  );

describe("Landing", () => {
  it("presenta la portada con su título y la ventana de ejemplo", () => {
    renderLanding();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Todo tu colegio, en un solo lugar.",
    );
    expect(
      screen.getByRole("img", {
        name: "Ejemplo de la planilla de notas de Auligo, con datos inventados",
      }),
    ).toBeInTheDocument();
  });

  it("lleva al login desde cada botón de ingreso", () => {
    renderLanding();

    const ingresos = screen.getAllByRole("link", { name: /^Ingresar/ });
    expect(ingresos).toHaveLength(3);
    ingresos.forEach((enlace) => expect(enlace).toHaveAttribute("href", "/login"));
  });

  it("enlaza el menú con secciones que existen", () => {
    const { container } = renderLanding();

    const menu = screen.getByRole("navigation", { name: "Navegación de la página" });
    const anclas = within(menu)
      .getAllByRole("link")
      .map((enlace) => enlace.getAttribute("href"))
      .filter((href) => href.startsWith("#"));

    expect(anclas).toEqual(["#inicio", "#funciones", "#un-dia", "#como-empezar", "#preguntas"]);
    anclas.forEach((ancla) => expect(container.querySelector(ancla)).not.toBeNull());
  });

  it("cambia de rol con clic y con las flechas del teclado", () => {
    renderLanding();

    const rectoria = screen.getByRole("tab", { name: "Rectoría y administración" });
    const profesores = screen.getByRole("tab", { name: "Profesores" });
    expect(rectoria).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Pagos y cartera");

    fireEvent.click(profesores);
    expect(profesores).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Planilla de notas");

    fireEvent.keyDown(profesores, { key: "ArrowRight" });
    expect(rectoria).toHaveAttribute("aria-selected", "true");
    expect(rectoria).toHaveFocus();
  });

  it("muestra las preguntas frecuentes", () => {
    renderLanding();

    expect(screen.getByText("¿Hay que instalar algo?")).toBeInTheDocument();
    expect(screen.getByText("¿Quién puede ver la información?")).toBeInTheDocument();
  });

  it("no ofrece contacto por WhatsApp todavía", () => {
    const { container } = renderLanding();

    expect(container.querySelector('a[href*="wa.me"], a[href*="whatsapp"]')).toBeNull();
  });

  it("activa el desplazamiento suave solo mientras está abierta", () => {
    const { unmount } = renderLanding();

    expect(document.documentElement).toHaveClass("motion-safe:scroll-smooth");
    unmount();
    expect(document.documentElement).not.toHaveClass("motion-safe:scroll-smooth");
  });
});
