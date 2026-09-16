import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PlantillasAdminView from "./PlantillasAdminView";

describe("PlantillasAdminView", () => {
  it("mantiene selección, comandos y edición como contratos controlados", async () => {
    const user = userEvent.setup();
    const plantilla = {
      id: 2,
      nombre: "Mi plantilla",
      activa: false,
      es_predefinida: false,
      config_json: { posicion_logo: "izquierda" },
    };
    const callbacks = {
      onActivar: vi.fn(),
      onActualizarCampoConfig: vi.fn(),
      onCambiarTipoActivo: vi.fn(),
      onDuplicar: vi.fn(),
      onEliminar: vi.fn(),
      onGuardarConfig: vi.fn(),
      onSeleccionarPlantilla: vi.fn(),
    };
    render(
      <PlantillasAdminView
        config={{ posicion_logo: "izquierda", mostrar_pie: true }}
        loading={false}
        mensaje={null}
        plantillas={[plantilla]}
        seleccionada={plantilla}
        tipoActivo="boletin"
        {...callbacks}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Voucher de pago" }));
    await user.click(screen.getByRole("button", { name: "Activar" }));
    await user.click(screen.getByRole("button", { name: "Duplicar" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await user.click(screen.getByRole("button", { name: "Centro" }));
    const tamanoEscudo = screen.getByRole("slider", { name: /Tamaño del escudo/ });
    expect(tamanoEscudo).toHaveValue("70");
    fireEvent.change(tamanoEscudo, { target: { value: "100" } });
    const tamanoNombre = screen.getByRole("slider", { name: /Tamaño del nombre del colegio/ });
    expect(tamanoNombre).toHaveValue("16.8");
    fireEvent.change(tamanoNombre, { target: { value: "28" } });
    expect(screen.queryByRole("textbox", { name: "Membrete" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Mostrar membrete" }));
    await user.click(screen.getByRole("checkbox", { name: "Mostrar aprobación de resolución" }));
    await user.click(screen.getByRole("checkbox", { name: "Mostrar pie de página" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(callbacks.onCambiarTipoActivo).toHaveBeenCalledWith("voucher_pago");
    expect(callbacks.onActivar).toHaveBeenCalledWith(2);
    expect(callbacks.onDuplicar).toHaveBeenCalledWith(plantilla);
    expect(callbacks.onEliminar).toHaveBeenCalledWith(plantilla);
    expect(callbacks.onActualizarCampoConfig).toHaveBeenCalledWith("posicion_logo", "centro");
    expect(callbacks.onActualizarCampoConfig).toHaveBeenCalledWith("tamano_escudo", 100);
    expect(callbacks.onActualizarCampoConfig).toHaveBeenCalledWith("tamano_nombre_colegio", 28);
    expect(callbacks.onActualizarCampoConfig).toHaveBeenCalledWith("mostrar_membrete", false);
    expect(callbacks.onActualizarCampoConfig).toHaveBeenCalledWith("mostrar_aprobacion_resolucion", false);
    expect(callbacks.onActualizarCampoConfig).toHaveBeenCalledWith("mostrar_pie", false);
    expect(callbacks.onGuardarConfig).toHaveBeenCalledTimes(1);
  });
});
