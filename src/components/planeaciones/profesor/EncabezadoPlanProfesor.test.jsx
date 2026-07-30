import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EncabezadoPlanProfesor from "./EncabezadoPlanProfesor";

const estadoVisual = {
  label: "Cambios sin guardar",
  detail: "Hay ediciones pendientes",
  badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  dotClass: "bg-amber-500",
};

describe("EncabezadoPlanProfesor", () => {
  it("presenta el título y el estado actual sin un plan persistido", () => {
    render(
      <EncabezadoPlanProfesor
        estadoVisual={estadoVisual}
        avisoGuardadoId={0}
        planActualId={null}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Plan de clases" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Cambios sin guardar",
    );
    expect(screen.getByText("Hay ediciones pendientes")).toBeInTheDocument();
    expect(screen.queryByText(/Plan #/)).not.toBeInTheDocument();
  });

  it("identifica el plan guardado y activa su confirmación visual", () => {
    render(
      <EncabezadoPlanProfesor
        estadoVisual={{
          ...estadoVisual,
          label: "Guardado",
          detail: "Actualizado 10:30",
        }}
        avisoGuardadoId={2}
        planActualId={91}
      />,
    );

    expect(screen.getByText("Plan #91")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveClass(
      "estado-guardado-campana",
    );
  });
});
