import { fireEvent, render, screen, within } from "@testing-library/react";
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
        branding={{
          nombre_institucion: "Colegio Central",
          configuracion_extra: {
            membrete: "Membrete inicial",
            aprobacion_resolucion: "Aprobación inicial",
          },
        }}
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
    const membrete = screen.getByRole("textbox", { name: "Membrete" });
    expect(membrete).toHaveValue("Membrete inicial");
    fireEvent.change(membrete, { target: { value: "Educación integral\nSede principal" } });
    const aprobacion = screen.getByRole("textbox", { name: "Aprobación de resolución" });
    expect(aprobacion).toHaveValue("Aprobación inicial");
    fireEvent.change(aprobacion, { target: { value: "Resolución de aprobación\nTexto institucional" } });
    const cajaColorTexto = screen.getByText("Color del texto").closest("div");
    const [, colorTextoInput] = within(cajaColorTexto).getAllByDisplayValue("#0f314f");
    fireEvent.change(colorTextoInput, { target: { value: "#ff0000" } });
    const archivo = new File(["logo"], "logo.png", { type: "image/png" });
    await user.upload(container.querySelector('input[type="file"]'), archivo);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onCambiarCampo).toHaveBeenCalledWith("nombre_institucion", "Colegio Central Norte");
    expect(onCambiarCampo).toHaveBeenCalledWith("membrete", "Educación integral\nSede principal");
    expect(onCambiarCampo).toHaveBeenCalledWith("aprobacion_resolucion", "Resolución de aprobación\nTexto institucional");
    expect(onCambiarCampo).toHaveBeenCalledWith("color_texto", "#ff0000");
    expect(onSubirLogo).toHaveBeenCalledWith(archivo, "principal");
    expect(onGuardar).toHaveBeenCalledTimes(1);
  });

  it("muestra y edita la firma y la ciudad de los certificados", () => {
    const onCambiarCampo = vi.fn();
    render(
      <IdentidadInstitucionalView
        branding={{
          nombre_institucion: "Colegio Central",
          configuracion_extra: {
            certificado_encabezado: "LA SUSCRITA DIRECTORA",
            firmante_nombre: "María Pérez",
            firmante_cargo: "Directora",
            firmante_documento: "C.C. 123 de Galapa",
            ciudad_expedicion: "Galapa",
          },
        }}
        guardando={false}
        loading={false}
        mensaje={null}
        onCambiarCampo={onCambiarCampo}
        onEliminarLogo={vi.fn()}
        onGuardar={vi.fn()}
        onSubirLogo={vi.fn()}
      />,
    );

    const campos = [
      ["Frase antes de «CERTIFICA:»", "certificado_encabezado", "LA SUSCRITA DIRECTORA"],
      ["Nombre de quien firma", "firmante_nombre", "María Pérez"],
      ["Cargo de quien firma", "firmante_cargo", "Directora"],
      ["Documento de quien firma", "firmante_documento", "C.C. 123 de Galapa"],
      ["Ciudad donde se expiden", "ciudad_expedicion", "Galapa"],
    ];
    for (const [etiqueta, clave, valor] of campos) {
      const campo = screen.getByRole("textbox", { name: etiqueta });
      expect(campo).toHaveValue(valor);
      fireEvent.change(campo, { target: { value: `${valor} nuevo` } });
      expect(onCambiarCampo).toHaveBeenLastCalledWith(clave, `${valor} nuevo`);
    }
  });
});
