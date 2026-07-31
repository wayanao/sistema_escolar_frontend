import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AsistenciaRow from "./AsistenciaRow";

const estudiante = {
  estudiante_id: 101,
  nombre: "Ana",
  apellido: "Ruiz",
  historial: [
    { fecha: "2026-07-28", estado: "ausente" },
    { fecha: "2026-07-29", estado: "presente" },
    { fecha: "2026-07-30", estado: "ausente" },
  ],
};

describe("AsistenciaRow", () => {
  it("muestra el conteo histórico y comunica la marcación elegida", async () => {
    const marcar = vi.fn();
    const user = userEvent.setup();

    render(
      <AsistenciaRow
        est={estudiante}
        estado="presente"
        marcar={marcar}
        cargandoHistorial={false}
      />,
    );

    expect(screen.getByText("Ruiz Ana")).toBeInTheDocument();
    expect(screen.getByText("Inasistencias: 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar presente a Ruiz Ana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Marcar ausente a Ruiz Ana" }));
    expect(marcar).toHaveBeenCalledWith(101, "ausente");
  });

  it("conserva ambos controles deshabilitados durante una carga", () => {
    render(
      <AsistenciaRow
        est={estudiante}
        estado=""
        marcar={vi.fn()}
        cargandoHistorial
        disabled
      />,
    );

    expect(screen.getByText("Cargando historial...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar presente a Ruiz Ana" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Marcar ausente a Ruiz Ana" })).toBeDisabled();
  });
});
