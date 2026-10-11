import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { formatearFechaPlan } from "../../../utils/planeaciones/profesor";
import PlanesAnioAnteriorProfesor from "./PlanesAnioAnteriorProfesor";

const PLANES = [
  { id: 1, fecha: "2026-02-10", periodo: 1, unidad: "Números", tema: "Conteo" },
  { id: 2, fecha: "2026-05-12", periodo: 2, unidad: "Restas", tema: "" },
];

function renderVista(props = {}) {
  const funciones = { onAbrir: vi.fn(), onCerrar: vi.fn(), onUsar: vi.fn() };
  render(
    <PlanesAnioAnteriorProfesor
      planes={PLANES}
      abierto={false}
      usandoId={null}
      {...funciones}
      {...props}
    />,
  );
  return funciones;
}

it("cerrada, ofrece el botón y explica qué se copia", () => {
  const { onAbrir } = renderVista();

  expect(screen.getByRole("region", { name: "Planes del año pasado" })).toBeInTheDocument();
  expect(screen.getByText(/Se copia solo el texto/)).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Usar un plan del año pasado" }));
  expect(onAbrir).toHaveBeenCalledTimes(1);
});

it("abierta, muestra fecha, periodo, unidad y tema de cada plan y entrega el elegido", () => {
  const { onUsar } = renderVista({ abierto: true });

  const items = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(items).toHaveLength(2);
  expect(within(items[0]).getByText(formatearFechaPlan("2026-02-10"))).toBeInTheDocument();
  expect(within(items[0]).getByText("Periodo 1")).toBeInTheDocument();
  expect(within(items[0]).getByText("Números")).toBeInTheDocument();
  expect(within(items[0]).getByText("Conteo")).toBeInTheDocument();
  expect(within(items[1]).getByText("Sin tema")).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: `Usar el plan del ${formatearFechaPlan("2026-05-12")}` }),
  );
  expect(onUsar).toHaveBeenCalledWith(PLANES[1]);
});

it("abierta, se puede cerrar", () => {
  const { onCerrar } = renderVista({ abierto: true });

  fireEvent.click(screen.getByRole("button", { name: "Cerrar la lista" }));

  expect(onCerrar).toHaveBeenCalledTimes(1);
});

it("mientras llega un texto, bloquea la lista y marca el elegido", () => {
  const { onUsar } = renderVista({ abierto: true, usandoId: 2 });

  const botones = within(screen.getByRole("list")).getAllByRole("button");
  expect(botones.every((boton) => boton.disabled)).toBe(true);
  expect(within(screen.getAllByRole("listitem")[1]).getByText("Usando...")).toBeInTheDocument();
  fireEvent.click(botones[0]);
  expect(onUsar).not.toHaveBeenCalled();
});
