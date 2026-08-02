import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SeleccionBoletinAdministrativo from "./SeleccionBoletinAdministrativo";

describe("SeleccionBoletinAdministrativo", () => {
  it("presenta filtros y estudiantes y comunica todas las acciones", async () => {
    const user = userEvent.setup();
    const onCambiarBusqueda = vi.fn();
    const onCambiarCurso = vi.fn();
    const onCambiarPeriodo = vi.fn();
    const onGenerarBoletin = vi.fn();
    render(
      <SeleccionBoletinAdministrativo
        busqueda=""
        cargando={false}
        cargandoBoletin={false}
        cursoSeleccionado=""
        cursos={[{ id: 3, nombre: "Transición", jornada: "Mañana" }]}
        estudiantes={[
          {
            id: 8,
            nombre: "Sara",
            apellido: "López",
            identificacion: "TI-123",
            curso_id: 3,
          },
        ]}
        periodo={1}
        onCambiarBusqueda={onCambiarBusqueda}
        onCambiarCurso={onCambiarCurso}
        onCambiarPeriodo={onCambiarPeriodo}
        onGenerarBoletin={onGenerarBoletin}
      />,
    );

    expect(screen.getByText("TI-123")).toBeInTheDocument();
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "3");
    await user.selectOptions(selects[1], "2");
    await user.type(
      screen.getByPlaceholderText("Buscar alumno por nombre, apellido o documento..."),
      "Sara",
    );
    await user.click(screen.getByRole("button", { name: "📄 Generar Boletín" }));

    expect(onCambiarCurso).toHaveBeenCalledWith("3");
    expect(onCambiarPeriodo).toHaveBeenCalledWith("2");
    expect(onCambiarBusqueda).toHaveBeenLastCalledWith("a");
    expect(onGenerarBoletin).toHaveBeenCalledWith(8);
  });
});
