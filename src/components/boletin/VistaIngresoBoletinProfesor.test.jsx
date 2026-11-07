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

  it("si falla la carga lo dice con Reintentar, en vez de decir que no hay estudiantes", async () => {
    const user = userEvent.setup();
    const onReintentarAlumnos = vi.fn();
    const onReintentarClases = vi.fn();
    render(
      <VistaIngresoBoletinProfesor
        asignacionId="55"
        cargando={false}
        clases={[]}
        datosBoletin={{}}
        errorAlumnos={new Error("sin red")}
        errorClases={new Error("sin red")}
        estudiantes={[]}
        guardandoTodos={false}
        periodo="1"
        onAplicarLogros={vi.fn()}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onGuardarEstudiante={vi.fn()}
        onGuardarTodos={vi.fn()}
        onObservacionChange={vi.fn()}
        onReintentarAlumnos={onReintentarAlumnos}
        onReintentarClases={onReintentarClases}
        obtenerEstadoVisual={() => ({})}
      />,
    );

    const avisos = screen.getAllByRole("alert");
    expect(avisos.map((aviso) => aviso.textContent)).toEqual([
      expect.stringContaining("No se pudieron cargar tus clases"),
      expect.stringContaining("No se pudieron cargar los estudiantes de esta clase"),
    ]);
    expect(screen.queryByText(/No hay estudiantes en este curso/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar todo" })).not.toBeInTheDocument();

    const [reintentarClases, reintentarAlumnos] = screen.getAllByRole("button", { name: "Reintentar" });
    await user.click(reintentarClases);
    await user.click(reintentarAlumnos);
    expect(onReintentarClases).toHaveBeenCalledTimes(1);
    expect(onReintentarAlumnos).toHaveBeenCalledTimes(1);
  });

  it("avisa del borrador recuperado y deja descartarlo", async () => {
    const user = userEvent.setup();
    const onDescartarBorrador = vi.fn();
    render(
      <VistaIngresoBoletinProfesor
        asignacionId="55"
        borradorRecuperado={{ cantidad: 2, actualizado: "2026-11-07T15:30:00.000Z" }}
        cargando={false}
        clases={[]}
        datosBoletin={{
          101: {
            definitiva: "4.00",
            observaciones: [{ referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" }],
          },
        }}
        estudiantes={[
          { estudiante_id: 101, nombre: "Ana", notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 4 }] },
        ]}
        guardandoTodos={false}
        periodo="1"
        onAplicarLogros={vi.fn()}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onDescartarBorrador={onDescartarBorrador}
        onGuardarEstudiante={vi.fn()}
        onGuardarTodos={vi.fn()}
        onObservacionChange={vi.fn()}
        obtenerEstadoVisual={() => ({ label: "", detail: "", badgeClass: "", dotClass: "", buttonText: "Guardar" })}
      />,
    );

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent("Recuperamos lo que no habías guardado de 2 estudiantes");
    expect(aviso).toHaveTextContent(/escrito el \d{1,2}\/\d{1,2}\/2026 a las/);
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(onDescartarBorrador).toHaveBeenCalledTimes(1);
  });
});
