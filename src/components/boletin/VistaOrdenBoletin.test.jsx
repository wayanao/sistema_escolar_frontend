import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import VistaOrdenBoletin from "./VistaOrdenBoletin";

describe("VistaOrdenBoletin", () => {
  it("presenta el orden y comunica controles sin conocer comandos", async () => {
    const user = userEvent.setup();
    const onGuardarOrden = vi.fn();
    const onMoverMateria = vi.fn();
    const onOrdenarAlfabetico = vi.fn();
    render(
      <VistaOrdenBoletin
        cargandoCursos={false}
        cargandoOrden={false}
        cursoId="4"
        cursos={[{ id: 4, nombre: "Sexto", jornada: "Tarde" }]}
        cursoSeleccionado={{ id: 4, nombre: "Sexto", jornada: "Tarde" }}
        guardando={false}
        materias={[
          {
            curso_id: 4,
            materia_id: 10,
            materia_nombre: "Biología",
            profesor_nombre: "Carlos",
            horarios: 3,
          },
          {
            curso_id: 4,
            materia_id: 20,
            materia_nombre: "Matemáticas",
            profesor_nombre: "Marta",
            horarios: 4,
          },
        ]}
        mensaje=""
        onCambiarCurso={vi.fn()}
        onGuardarOrden={onGuardarOrden}
        onMoverAPosicion={vi.fn()}
        onMoverMateria={onMoverMateria}
        onOrdenarAlfabetico={onOrdenarAlfabetico}
      />,
    );

    expect(screen.getByText("Biología")).toHaveAttribute("translate", "no");
    await user.click(screen.getByRole("button", { name: "A-Z" }));
    await user.click(screen.getByRole("button", { name: "Guardar orden" }));
    await user.click(screen.getByRole("button", { name: "Bajar Biología" }));

    expect(onOrdenarAlfabetico).toHaveBeenCalledTimes(1);
    expect(onGuardarOrden).toHaveBeenCalledTimes(1);
    expect(onMoverMateria).toHaveBeenCalledWith(0, 1);
  });
});
