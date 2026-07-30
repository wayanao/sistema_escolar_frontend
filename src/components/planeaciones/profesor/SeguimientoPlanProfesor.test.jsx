import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SeguimientoPlanProfesor from "./SeguimientoPlanProfesor";

const seguimiento = {
  estado_revision: "revisado",
  version_revision: 3,
  total_observaciones: 2,
  observaciones_no_vistas: 1,
  revisado_at: "2026-07-28T15:00:00Z",
};

describe("SeguimientoPlanProfesor", () => {
  it("muestra estado, versión y comentarios pendientes", async () => {
    const onAlternar = vi.fn();
    const user = userEvent.setup();

    render(
      <SeguimientoPlanProfesor
        seguimiento={seguimiento}
        observaciones={[]}
        abierto={false}
        cargando={false}
        error=""
        onAlternar={onAlternar}
      />,
    );

    expect(screen.getByText("Revisado con observación")).toBeInTheDocument();
    expect(screen.getByText("Versión 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver 1 nuevo" }));
    expect(onAlternar).toHaveBeenCalledTimes(1);
  });

  it("renderiza el historial abierto y señala lecturas no confirmadas", () => {
    render(
      <SeguimientoPlanProfesor
        seguimiento={seguimiento}
        observaciones={[
          {
            id: 10,
            admin: "Coordinación",
            plan_version: 3,
            observacion: "Muy buena estructura.",
            creada_at: "2026-07-28T15:00:00Z",
            vista_por_profesor_at: null,
          },
        ]}
        abierto
        cargando={false}
        error=""
        onAlternar={vi.fn()}
      />,
    );

    expect(screen.getByText("Muy buena estructura.")).toBeInTheDocument();
    expect(
      screen.getByText("No fue posible confirmar la lectura."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ocultar comentarios" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
