import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./VistaPreviaBoletinProfesor", () => ({
  default: ({ vistaPrevia, estadoVisual, onCerrar }) => (
    <div role="dialog" aria-label={`Vista previa de ${vistaPrevia.nombre}`}>
      <span>{estadoVisual.label}</span>
      <button type="button" onClick={onCerrar}>Cerrar vista previa</button>
    </div>
  ),
}));

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

  it("cada estudiante tiene Ver cómo queda y la vista previa abierta se muestra con su estado", async () => {
    const user = userEvent.setup();
    const onVerVistaPrevia = vi.fn();
    const onCerrarVistaPrevia = vi.fn();
    const propiedades = {
      asignacionId: "55",
      cargando: false,
      clases: [{ id: 55, curso: "Quinto", materia: "Lenguaje" }],
      datosBoletin: {
        101: {
          definitiva: "4.00",
          observaciones: [
            { referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" },
          ],
        },
      },
      estudiantes: [
        {
          estudiante_id: 101,
          nombre: "Ana",
          notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 4 }],
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
      obtenerEstadoVisual: (estudianteId) => ({
        label: `Estado de ${estudianteId}`,
        detail: "",
        badgeClass: "badge",
        dotClass: "dot",
        buttonText: "Guardar resumen",
      }),
      onVerVistaPrevia,
      onCerrarVistaPrevia,
      onVistaPreviaAnterior: vi.fn(),
      onVistaPreviaSiguiente: vi.fn(),
    };
    const { rerender } = render(<VistaIngresoBoletinProfesor {...propiedades} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver cómo queda" }));
    expect(onVerVistaPrevia).toHaveBeenCalledWith(101);

    rerender(
      <VistaIngresoBoletinProfesor
        {...propiedades}
        vistaPrevia={{ estudianteId: 101, nombre: "Ana" }}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Vista previa de Ana" })).toBeInTheDocument();
    // El estado que muestra es el del estudiante de la vista previa (dos veces:
    // en su tarjeta y en la ventana).
    expect(screen.getAllByText("Estado de 101")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Cerrar vista previa" }));
    expect(onCerrarVistaPrevia).toHaveBeenCalledTimes(1);
  });

  it("sin la vista previa conectada no muestra el botón", () => {
    render(
      <VistaIngresoBoletinProfesor
        asignacionId="55"
        cargando={false}
        clases={[]}
        datosBoletin={{
          101: {
            definitiva: "4.00",
            observaciones: [
              { referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" },
            ],
          },
        }}
        estudiantes={[
          {
            estudiante_id: 101,
            nombre: "Ana",
            notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 4 }],
          },
        ]}
        guardandoTodos={false}
        periodo="1"
        onAplicarLogros={vi.fn()}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onGuardarEstudiante={vi.fn()}
        onGuardarTodos={vi.fn()}
        onObservacionChange={vi.fn()}
        obtenerEstadoVisual={() => ({
          label: "Pendiente",
          detail: "",
          badgeClass: "badge",
          dotClass: "dot",
          buttonText: "Guardar resumen",
        })}
      />,
    );
    expect(screen.queryByRole("button", { name: "Ver cómo queda" })).not.toBeInTheDocument();
  });
});
