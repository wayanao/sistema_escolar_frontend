import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import IdentidadInstitucionalView from "./IdentidadInstitucionalView";

describe("IdentidadInstitucionalView", () => {
  it("expone edición, carga de logo y guardado mediante props", async () => {
    const user = userEvent.setup();
    const onCambiarCampo = vi.fn();
    const onGuardar = vi.fn();
    const onSubirLogo = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <IdentidadInstitucionalView
        branding={{ nombre_institucion: "Colegio Central" }}
        guardando={false}
        loading={false}
        mensaje={null}
        onCambiarCampo={onCambiarCampo}
        onEliminarLogo={vi.fn()}
        onGuardar={onGuardar}
        onSubirLogo={onSubirLogo}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("Colegio Central"), {
      target: { value: "Colegio Central Norte" },
    });
    const archivo = new File(["logo"], "logo.png", { type: "image/png" });
    await user.upload(container.querySelector('input[type="file"]'), archivo);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onCambiarCampo).toHaveBeenLastCalledWith("nombre_institucion", "Colegio Central Norte");
    expect(onSubirLogo).toHaveBeenCalledWith(archivo, "principal");
    expect(onGuardar).toHaveBeenCalledTimes(1);
  });
});
