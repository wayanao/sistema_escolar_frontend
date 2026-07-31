import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BarraGuardadoAsistencia from "./BarraGuardadoAsistencia";

describe("BarraGuardadoAsistencia", () => {
  it("informa pendientes y conserva el guardado deshabilitado", () => {
    render(
      <BarraGuardadoAsistencia
        resumenAsistencia={{ presentes: 1, ausentes: 0, pendientes: 1 }}
        hayCambiosSinGuardar
        asistenciaDelDiaTomada={false}
        puedeGuardar={false}
        guardando={false}
        onGuardar={vi.fn()}
      />,
    );

    expect(screen.getByText("Falta marcar 1 estudiante.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar asistencia" })).toBeDisabled();
  });

  it("presenta la edición guardada y comunica el guardado habilitado", async () => {
    const onGuardar = vi.fn();
    const user = userEvent.setup();

    render(
      <BarraGuardadoAsistencia
        resumenAsistencia={{ presentes: 1, ausentes: 1, pendientes: 0 }}
        hayCambiosSinGuardar
        asistenciaDelDiaTomada
        puedeGuardar
        guardando={false}
        onGuardar={onGuardar}
      />,
    );

    expect(screen.getByText("1 presentes · 1 ausentes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onGuardar).toHaveBeenCalledTimes(1);
  });
});
