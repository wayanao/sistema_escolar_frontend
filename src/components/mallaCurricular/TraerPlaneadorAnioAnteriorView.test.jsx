import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import TraerPlaneadorAnioAnteriorView from "./TraerPlaneadorAnioAnteriorView";

it("explica qué se trae y entrega el clic", () => {
  const onTraer = vi.fn();
  render(<TraerPlaneadorAnioAnteriorView onTraer={onTraer} trayendo={false} />);

  expect(screen.getByRole("region", { name: "Planeador del año pasado" })).toBeInTheDocument();
  expect(screen.getByText(/se copian los textos de los cuatro periodos, sin las fechas/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Traer el planeador del año pasado" }));

  expect(onTraer).toHaveBeenCalledTimes(1);
});

it("bloquea el botón mientras trae", () => {
  const onTraer = vi.fn();
  render(<TraerPlaneadorAnioAnteriorView onTraer={onTraer} trayendo />);

  const boton = screen.getByRole("button", { name: "Trayendo..." });
  expect(boton).toBeDisabled();
  fireEvent.click(boton);
  expect(onTraer).not.toHaveBeenCalled();
});
