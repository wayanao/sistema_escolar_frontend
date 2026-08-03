import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FormularioObservacionEstudiante from "./FormularioObservacionEstudiante";

describe("FormularioObservacionEstudiante", () => {
  it("presenta estado y valores y comunica edición, guardado e impresión", async () => {
    const user = userEvent.setup();
    const props = {
      estudiante: { nombre: "Ana", apellido: "Rojas" },
      periodo: 2,
      conductual: "Base",
      cognitivo: "",
      lenguaje: "",
      onCambiarConductual: vi.fn(),
      onCambiarCognitivo: vi.fn(),
      onCambiarLenguaje: vi.fn(),
      guardando: false,
      cargando: false,
      estadoVisual: {
        label: "Guardado",
        detail: "Observador registrado",
        badgeClass: "badge",
        dotClass: "dot",
        buttonText: "Actualizar observación",
      },
      onGuardar: vi.fn(),
      onImprimir: vi.fn(),
    };
    render(<FormularioObservacionEstudiante {...props} />);

    expect(screen.getByText("Ana Rojas (Período 2)")).toBeInTheDocument();
    expect(screen.getByText("Guardado")).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(
        "Observaciones sobre el desarrollo cognitivo...",
      ),
      "A",
    );
    await user.click(
      screen.getByRole("button", { name: "Actualizar observación" }),
    );
    await user.click(screen.getByRole("button", { name: "Imprimir Reporte" }));

    expect(props.onCambiarCognitivo).toHaveBeenCalledWith("A");
    expect(props.onGuardar).toHaveBeenCalledTimes(1);
    expect(props.onImprimir).toHaveBeenCalledTimes(1);
  });

  it("muestra el error de carga, bloquea la edición y permite reintentar", async () => {
    const user = userEvent.setup();
    const onReintentar = vi.fn();
    render(
      <FormularioObservacionEstudiante
        estudiante={{ nombre: "Ana", apellido: "Rojas" }}
        periodo={2}
        conductual=""
        cognitivo=""
        lenguaje=""
        onCambiarConductual={vi.fn()}
        onCambiarCognitivo={vi.fn()}
        onCambiarLenguaje={vi.fn()}
        guardando={false}
        cargando={false}
        errorCarga={new Error("No disponible")}
        estadoVisual={{
          label: "No se pudo cargar",
          detail: "Reintenta la consulta",
          badgeClass: "badge",
          dotClass: "dot",
          buttonText: "Guardar observación",
        }}
        onGuardar={vi.fn()}
        onImprimir={vi.fn()}
        onReintentar={onReintentar}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos recuperar la observación guardada.",
    );
    expect(
      screen.getByPlaceholderText(
        "Observaciones sobre el comportamiento del estudiante...",
      ),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar observación" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Imprimir Reporte" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});
