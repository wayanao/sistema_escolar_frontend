import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SelectorAnioLectivoView from "./SelectorAnioLectivoView";

const OPCIONES = [
  { valor: 2, etiqueta: "2027 · En preparación" },
  { valor: 1, etiqueta: "2026 · Activo" },
];

describe("SelectorAnioLectivoView", () => {
  it("muestra cada año con su etiqueta y deja elegido el que recibe", () => {
    render(
      <SelectorAnioLectivoView opciones={OPCIONES} anioSeleccionadoId={1} onCambiar={vi.fn()} />,
    );

    expect(screen.getByRole("combobox", { name: "Año lectivo" })).toHaveValue("1");
    expect(screen.getAllByRole("option").map((opcion) => opcion.textContent)).toEqual([
      "2027 · En preparación",
      "2026 · Activo",
    ]);
  });

  it("avisa el año elegido como número", async () => {
    const user = userEvent.setup();
    const onCambiar = vi.fn();
    render(
      <SelectorAnioLectivoView opciones={OPCIONES} anioSeleccionadoId={1} onCambiar={onCambiar} />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Año lectivo" }), "2");

    expect(onCambiar).toHaveBeenCalledWith(2);
  });
});
