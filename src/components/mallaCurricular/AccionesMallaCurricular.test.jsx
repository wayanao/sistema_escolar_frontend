import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import AccionesMallaCurricular from "./AccionesMallaCurricular";

it("presenta las acciones actuales y entrega ambos callbacks", () => {
  const onGuardar = vi.fn();
  const onImprimir = vi.fn();
  render(
    <AccionesMallaCurricular
      cargando={false}
      estadoVisual={{ buttonText: "Guardar cambios" }}
      guardando={false}
      onGuardar={onGuardar}
      onImprimir={onImprimir}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));
  fireEvent.click(screen.getByRole("button", { name: /Imprimir Período/ }));

  expect(onGuardar).toHaveBeenCalledTimes(1);
  expect(onImprimir).toHaveBeenCalledTimes(1);
});

it("bloquea el guardado y conserva el spinner mientras está en progreso", () => {
  render(
    <AccionesMallaCurricular
      cargando={false}
      estadoVisual={{ buttonText: "Actualizar malla" }}
      guardando
      onGuardar={vi.fn()}
      onImprimir={vi.fn()}
    />
  );

  expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
});
