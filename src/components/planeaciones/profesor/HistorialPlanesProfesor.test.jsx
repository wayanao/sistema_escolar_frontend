import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HistorialPlanesProfesor from "./HistorialPlanesProfesor";

const planes = [
  {
    id: 91,
    fecha: "2026-07-28",
    periodo: 2,
    tema: "Fracciones",
    unidad: "Números",
    estado_revision: "revisado",
    total_observaciones: 0,
    observaciones_no_vistas: 0,
  },
  {
    id: 90,
    fecha: "2026-07-27",
    periodo: 2,
    tema: "División",
    unidad: "Números",
    estado_revision: "revisado",
    total_observaciones: 1,
    observaciones_no_vistas: 1,
  },
];

describe("HistorialPlanesProfesor", () => {
  it("identifica el plan activo y entrega la fecha del plan seleccionado", async () => {
    const onAbrirPlan = vi.fn();
    const user = userEvent.setup();

    render(
      <HistorialPlanesProfesor
        asignacionId="44"
        fechaActiva="2026-07-28"
        planes={planes}
        pagina={0}
        hayMas={false}
        cargando={false}
        error=""
        pageSize={3}
        onCargarPagina={vi.fn()}
        onAbrirPlan={onAbrirPlan}
      />,
    );

    expect(
      screen.getByRole("button", { name: "En edición" }),
    ).toBeDisabled();
    expect(screen.getByText("1 nueva")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir plan" }));
    expect(onAbrirPlan).toHaveBeenCalledWith("2026-07-27");
  });

  it("permite reintentar la página que falló", async () => {
    const onCargarPagina = vi.fn();
    const user = userEvent.setup();

    render(
      <HistorialPlanesProfesor
        asignacionId="44"
        fechaActiva="2026-07-28"
        planes={[]}
        pagina={2}
        hayMas={false}
        cargando={false}
        error="No se pudo cargar el historial."
        pageSize={3}
        onCargarPagina={onCargarPagina}
        onAbrirPlan={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onCargarPagina).toHaveBeenCalledWith(2);
  });
});
