import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AvisoRegistroAsistencia from "./AvisoRegistroAsistencia";

describe("AvisoRegistroAsistencia", () => {
  it("no ocupa espacio cuando todavía no existe un registro del día", () => {
    const { container } = render(
      <AvisoRegistroAsistencia
        visible={false}
        hayCambiosSinGuardar={false}
        cantidadGuardada={0}
        totalEstudiantes={2}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("alterna entre el estado guardado y la edición pendiente", () => {
    const { rerender } = render(
      <AvisoRegistroAsistencia
        visible
        hayCambiosSinGuardar={false}
        cantidadGuardada={2}
        totalEstudiantes={3}
      />,
    );

    expect(screen.getByText("Asistencia del día ya tomada")).toBeInTheDocument();
    expect(screen.getByText("Hay registro para 2 de 3 estudiantes en la fecha seleccionada.")).toBeInTheDocument();
    expect(screen.getByText("Guardado")).toBeInTheDocument();

    rerender(
      <AvisoRegistroAsistencia
        visible
        hayCambiosSinGuardar
        cantidadGuardada={2}
        totalEstudiantes={3}
      />,
    );

    expect(screen.getByText("Editando asistencia guardada")).toBeInTheDocument();
    expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();
  });
});
