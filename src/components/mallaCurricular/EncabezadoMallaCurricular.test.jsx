import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import EncabezadoMallaCurricular from "./EncabezadoMallaCurricular";

it("presenta el selector de la clase, el estado y la nota de las fechas", () => {
  render(
    <EncabezadoMallaCurricular
      selector={<p>Selector de clase</p>}
      estadoVisual={{
        badgeClass: "badge",
        dotClass: "dot",
        label: "Cambios sin guardar",
        detail: "Hay ediciones pendientes",
      }}
    />
  );

  expect(screen.getByRole("heading", { name: "Planeador Anual de Clases" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "¿Qué clase vas a planear?" })).toBeInTheDocument();
  expect(screen.getByText("Selector de clase")).toBeInTheDocument();
  expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();
  expect(screen.getByText("Hay ediciones pendientes")).toBeInTheDocument();
  expect(screen.getByText(/su fecha límite es obligatoria/)).toBeInTheDocument();
});

it("sin clase abierta solo presenta el selector", () => {
  render(<EncabezadoMallaCurricular selector={<p>Selector de clase</p>} />);

  expect(screen.getByText("Selector de clase")).toBeInTheDocument();
  expect(screen.queryByText(/su fecha límite es obligatoria/)).not.toBeInTheDocument();
});
