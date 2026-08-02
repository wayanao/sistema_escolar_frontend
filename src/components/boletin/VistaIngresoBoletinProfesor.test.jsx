import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import VistaIngresoBoletinProfesor from "./VistaIngresoBoletinProfesor";

describe("VistaIngresoBoletinProfesor", () => {
  it("presenta el formulario y comunica edición y acciones", async () => {
    const user = userEvent.setup();
    const onAplicarLogros = vi.fn();
    const onGuardarEstudiante = vi.fn();
    const onObservacionChange = vi.fn();
    render(
      <VistaIngresoBoletinProfesor
        asignacionId="55"
        cargando={false}
        clases={[{ id: 55, curso: "Quinto", materia: "Lenguaje" }]}
        datosBoletin={{
          101: {
            definitiva: "4.00",
            observaciones: [
              {
                referencia: "logro_oral",
                observacion: "",
                tipo_evaluacion: "numerica",
              },
            ],
          },
        }}
        estudiantes={[
          {
            estudiante_id: 101,
            nombre: "Ana",
            notas: [
              {
                tipo_nota: "logro_oral",
                tipo_evaluacion: "numerica",
                valor: 4,
              },
            ],
          },
        ]}
        guardandoTodos={false}
        periodo="1"
        onAplicarLogros={onAplicarLogros}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onGuardarEstudiante={onGuardarEstudiante}
        onGuardarTodos={vi.fn()}
        onObservacionChange={onObservacionChange}
        obtenerEstadoVisual={() => ({
          label: "Pendiente",
          detail: "Aún no se ha guardado",
          badgeClass: "badge",
          dotClass: "dot",
          buttonText: "Guardar resumen",
        })}
      />,
    );

    expect(screen.getByText("Logro Oral")).toHaveAttribute("translate", "no");
    await user.type(screen.getByRole("textbox"), "Avanza");
    await user.click(
      screen.getByRole("button", { name: "Aplicar logros del primer estudiante" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar resumen" }));

    expect(onObservacionChange).toHaveBeenLastCalledWith(101, 0, "a");
    expect(onAplicarLogros).toHaveBeenCalledTimes(1);
    expect(onGuardarEstudiante).toHaveBeenCalledWith(101);
  });

  it("espera la resincronización cuando cambian las notas de una clase", () => {
    const propiedades = {
      asignacionId: "55",
      cargando: false,
      clases: [{ id: 55, curso: "Primero A", materia: "Matemáticas" }],
      estudiantes: [
        {
          estudiante_id: 101,
          nombre: "Ana",
          notas: [
            {
              tipo_nota: "suma",
              tipo_evaluacion: "numerica",
              valor: 4,
            },
            {
              tipo_nota: "resta",
              tipo_evaluacion: "numerica",
              valor: 3,
            },
          ],
        },
      ],
      guardandoTodos: false,
      periodo: "1",
      onAplicarLogros: vi.fn(),
      onCambiarAsignacion: vi.fn(),
      onCambiarPeriodo: vi.fn(),
      onGuardarEstudiante: vi.fn(),
      onGuardarTodos: vi.fn(),
      onObservacionChange: vi.fn(),
      obtenerEstadoVisual: () => ({
        label: "Pendiente",
        detail: "Aún no se ha guardado",
        badgeClass: "badge",
        dotClass: "dot",
        buttonText: "Guardar resumen",
      }),
    };
    const { rerender } = render(
      <VistaIngresoBoletinProfesor
        {...propiedades}
        datosBoletin={{
          101: {
            definitiva: "4.00",
            observaciones: [
              {
                referencia: "ciencias",
                observacion: "Estado de la clase anterior",
                tipo_evaluacion: "numerica",
              },
            ],
          },
        }}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);

    rerender(
      <VistaIngresoBoletinProfesor
        {...propiedades}
        datosBoletin={{
          101: {
            definitiva: "3.50",
            observaciones: [
              {
                referencia: "suma",
                observacion: "",
                tipo_evaluacion: "numerica",
              },
              {
                referencia: "resta",
                observacion: "",
                tipo_evaluacion: "numerica",
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });
});
