import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import EncabezadoMallaCurricular from "./EncabezadoMallaCurricular";

it("presenta asignación, estado y selector conservando el callback de periodo", () => {
  const onPeriodoChange = vi.fn();
  render(
    <EncabezadoMallaCurricular
      asignacion={{ curso: "6A", materia: "Ciencias" }}
      estadoVisual={{
        badgeClass: "badge",
        dotClass: "dot",
        label: "Cambios sin guardar",
        detail: "Hay ediciones pendientes",
      }}
      onPeriodoChange={onPeriodoChange}
      periodo="2"
    />
  );

  expect(screen.getByRole("heading", { name: "Planeador Anual de Clases" })).toBeInTheDocument();
  expect(screen.getByText("6A")).toBeInTheDocument();
  expect(screen.getByText("Ciencias")).toBeInTheDocument();
  expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveValue("2");

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "3" } });
  expect(onPeriodoChange).toHaveBeenCalledWith("3");
});
