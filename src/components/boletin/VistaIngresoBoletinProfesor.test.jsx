import { render, screen, within } from "@testing-library/react";
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
    const onCopiarLogrosYGuardar = vi.fn();
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
        idPrimerEstudiante={101}
        periodo="1"
        onCopiarLogrosYGuardar={onCopiarLogrosYGuardar}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onGuardarEstudiante={onGuardarEstudiante}
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
      screen.getByRole("button", { name: "Copiar a todos y guardar" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar solo a Ana" }));

    expect(onObservacionChange).toHaveBeenLastCalledWith(101, 0, "a");
    expect(onCopiarLogrosYGuardar).toHaveBeenCalledTimes(1);
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
      onCopiarLogrosYGuardar: vi.fn(),
      onCambiarAsignacion: vi.fn(),
      onCambiarPeriodo: vi.fn(),
      onGuardarEstudiante: vi.fn(),
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
      onCopiarLogrosYGuardar: vi.fn(),
      onCambiarAsignacion: vi.fn(),
      onCambiarPeriodo: vi.fn(),
      onGuardarEstudiante: vi.fn(),
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
        onCopiarLogrosYGuardar={vi.fn()}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onGuardarEstudiante={vi.fn()}
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
        onCopiarLogrosYGuardar={vi.fn()}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onGuardarEstudiante={vi.fn()}
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
    expect(screen.queryByRole("button", { name: "Copiar a todos y guardar" })).not.toBeInTheDocument();

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
        onCopiarLogrosYGuardar={vi.fn()}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onDescartarBorrador={onDescartarBorrador}
        onGuardarEstudiante={vi.fn()}
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

  it("avisa cuando la planilla cambió después de guardar (2026-11-23)", () => {
    const propiedades = {
      asignacionId: "55",
      cargando: false,
      clases: [],
      datosBoletin: {
        101: {
          definitiva: "4.00",
          observaciones: [{ referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" }],
        },
      },
      estudiantes: [
        { estudiante_id: 101, nombre: "Ana", notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 4 }] },
      ],
      guardandoTodos: false,
      periodo: "1",
      onCambiarAsignacion: vi.fn(),
      onCambiarPeriodo: vi.fn(),
      onGuardarEstudiante: vi.fn(),
      onObservacionChange: vi.fn(),
      obtenerEstadoVisual: () => ({ label: "", detail: "", badgeClass: "", dotClass: "", buttonText: "Guardar" }),
    };
    const { rerender } = render(
      <VistaIngresoBoletinProfesor {...propiedades} cantidadPlanillaCambiada={3} />,
    );

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent("La planilla cambió después de guardar el boletín en 3 estudiantes");
    expect(aviso).toHaveTextContent("vuelve a guardar");

    rerender(<VistaIngresoBoletinProfesor {...propiedades} cantidadPlanillaCambiada={1} />);
    expect(screen.getByRole("status")).toHaveTextContent("en un estudiante");

    rerender(<VistaIngresoBoletinProfesor {...propiedades} cantidadPlanillaCambiada={0} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  describe("plantilla del grupo en la tarjeta del primer estudiante", () => {
    const propiedades = (cambios = {}) => ({
      asignacionId: "55",
      cargando: false,
      clases: [],
      datosBoletin: {
        101: { definitiva: "4.00", observaciones: [{ referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" }] },
        102: { definitiva: "3.00", observaciones: [{ referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" }] },
      },
      estudiantes: [
        { estudiante_id: 101, nombre: "Ana", notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 4 }] },
        { estudiante_id: 102, nombre: "Bruno", notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 3 }] },
      ],
      guardandoTodos: false,
      idPrimerEstudiante: 101,
      periodo: "1",
      onCopiarLogrosYGuardar: vi.fn(),
      onCambiarAsignacion: vi.fn(),
      onCambiarPeriodo: vi.fn(),
      onGuardarEstudiante: vi.fn(),
      onObservacionChange: vi.fn(),
      obtenerEstadoVisual: () => ({ label: "", detail: "", badgeClass: "", dotClass: "", buttonText: "Guardar resumen" }),
      ...cambios,
    });

    it("solo la tarjeta del primero explica el proceso y lleva Copiar a todos y guardar", () => {
      render(<VistaIngresoBoletinProfesor {...propiedades()} />);

      const tarjetaAna = screen.getByRole("heading", { name: "Ana" }).closest(".rounded-lg");
      const tarjetaBruno = screen.getByRole("heading", { name: "Bruno" }).closest(".rounded-lg");

      expect(within(tarjetaAna).getByText("Plantilla del grupo")).toBeInTheDocument();
      expect(within(tarjetaAna).getByRole("heading", { name: "Escribe aquí los logros de todo el grupo" })).toBeInTheDocument();
      expect(within(tarjetaAna).getAllByRole("listitem").map((paso) => [paso.firstChild.textContent, paso.lastChild.textContent])).toEqual([
        ["1", "Escribe aquí los logros de Ana."],
        ["2", "Oprime «Copiar a todos y guardar», abajo: se copian a los demás y se guarda todo el grupo."],
        ["3", "¿Alguien necesita algo distinto? Cámbialo en su tarjeta y guárdalo con su botón."],
      ]);
      expect(within(tarjetaAna).getByRole("button", { name: "Copiar a todos y guardar" })).toBeEnabled();

      expect(within(tarjetaBruno).queryByText("Plantilla del grupo")).not.toBeInTheDocument();
      expect(within(tarjetaBruno).queryByRole("button", { name: "Copiar a todos y guardar" })).not.toBeInTheDocument();
      // No queda la caja aparte ni "Guardar todo".
      expect(screen.getAllByRole("button", { name: "Copiar a todos y guardar" })).toHaveLength(1);
      expect(screen.queryByRole("button", { name: /Guardar todo/ })).not.toBeInTheDocument();
    });

    it("el botón del grupo va después de los logros del primero y antes de su guardar", () => {
      render(<VistaIngresoBoletinProfesor {...propiedades()} />);
      const tarjetaAna = screen.getByRole("heading", { name: "Ana" }).closest(".rounded-lg");
      const despues = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

      const logro = within(tarjetaAna).getByRole("textbox");
      const copiar = within(tarjetaAna).getByRole("button", { name: "Copiar a todos y guardar" });
      const guardarAna = within(tarjetaAna).getByRole("button", { name: "Guardar solo a Ana" });
      expect(despues(logro, copiar)).toBe(true);
      expect(despues(copiar, guardarAna)).toBe(true);
      // En la plantilla hay un solo botón grande: el de guardar normal no está.
      expect(within(tarjetaAna).queryByRole("button", { name: "Guardar resumen" })).not.toBeInTheDocument();
      // En las demás tarjetas, el de siempre.
      const tarjetaBruno = screen.getByRole("heading", { name: "Bruno" }).closest(".rounded-lg");
      expect(within(tarjetaBruno).getByRole("button", { name: "Guardar resumen" })).toHaveAccessibleDescription(
        "Solo guarda a Bruno",
      );
    });

    it("Guardar solo a Ana guarda solo a Ana, y se bloquea mientras guarda el grupo", async () => {
      const user = userEvent.setup();
      const onGuardarEstudiante = vi.fn();
      const { rerender } = render(<VistaIngresoBoletinProfesor {...propiedades({ onGuardarEstudiante })} />);

      await user.click(screen.getByRole("button", { name: "Guardar solo a Ana" }));
      expect(onGuardarEstudiante).toHaveBeenCalledWith(101);
      expect(screen.getByText(/¿Solo cambiaste algo de Ana\?/)).toBeInTheDocument();

      rerender(<VistaIngresoBoletinProfesor {...propiedades({ onGuardarEstudiante, guardandoTodos: true })} />);
      expect(screen.getByRole("button", { name: "Guardar solo a Ana" })).toBeDisabled();
    });

    it("mientras guarda el grupo, una ventana dice cuántos van y por qué tarda", () => {
      render(
        <VistaIngresoBoletinProfesor
          {...propiedades({ guardandoTodos: true, progresoGrupo: { guardados: 12, total: 30 } })}
        />,
      );

      const ventana = screen.getByRole("dialog", { name: "Guardando el grupo…" });
      expect(within(ventana).getByText("Van 12 de 30 estudiantes")).toBeInTheDocument();
      const barra = within(ventana).getByRole("progressbar", { name: "Estudiantes guardados" });
      expect(barra).toHaveAttribute("aria-valuenow", "12");
      expect(barra).toHaveAttribute("aria-valuemax", "30");
      expect(barra.firstChild).toHaveStyle({ width: "40%" });
      expect(within(ventana).getByText(/tarda un poco porque es un proceso pesado/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Guardando grupo..." })).toBeDisabled();
    });

    it("sin guardado en curso no hay ventana de avance", () => {
      render(<VistaIngresoBoletinProfesor {...propiedades()} />);
      expect(screen.queryByRole("dialog", { name: "Guardando el grupo…" })).not.toBeInTheDocument();
    });
  });

  it("arriba la definitiva y Ver cómo queda; guardar va al final de la tarjeta", () => {
    render(
      <VistaIngresoBoletinProfesor
        asignacionId="55"
        cargando={false}
        clases={[]}
        datosBoletin={{
          101: {
            definitiva: "4.20",
            observaciones: [{ referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" }],
          },
        }}
        estudiantes={[
          { estudiante_id: 101, nombre: "Ana", notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 4.2 }] },
        ]}
        guardandoTodos={false}
        periodo="1"
        onCopiarLogrosYGuardar={vi.fn()}
        onCambiarAsignacion={vi.fn()}
        onCambiarPeriodo={vi.fn()}
        onGuardarEstudiante={vi.fn()}
        onObservacionChange={vi.fn()}
        onVerVistaPrevia={vi.fn()}
        obtenerEstadoVisual={() => ({ label: "", detail: "", badgeClass: "", dotClass: "", buttonText: "Guardar resumen" })}
      />,
    );

    const despues = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const definitiva = screen.getByText("4.2");
    const verComoQueda = screen.getByRole("button", { name: "Ver cómo queda" });
    const logro = screen.getByRole("textbox");
    const guardar = screen.getByRole("button", { name: "Guardar resumen" });

    expect(despues(definitiva, verComoQueda)).toBe(true);
    expect(despues(verComoQueda, logro)).toBe(true);
    expect(despues(logro, guardar)).toBe(true);
    // Una nota sutil aclara que ese botón guarda solo a ese estudiante.
    expect(guardar).toHaveAccessibleDescription("Solo guarda a Ana");
  });

  describe("pestañas de Mis materias y Mi curso", () => {
    const base = {
      asignacionId: "55",
      cargando: false,
      clases: [{ id: 55, curso: "Quinto", materia: "Lenguaje" }],
      datosBoletin: {
        101: { definitiva: "4.00", observaciones: [{ referencia: "lectura", observacion: "", tipo_evaluacion: "numerica" }] },
      },
      estudiantes: [
        { estudiante_id: 101, nombre: "Ana", notas: [{ tipo_nota: "lectura", tipo_evaluacion: "numerica", valor: 4 }] },
      ],
      guardandoTodos: false,
      periodo: "1",
      onCambiarAsignacion: vi.fn(),
      onCambiarPeriodo: vi.fn(),
      onGuardarEstudiante: vi.fn(),
      onObservacionChange: vi.fn(),
      obtenerEstadoVisual: () => ({ label: "", detail: "", badgeClass: "", dotClass: "", buttonText: "Guardar resumen" }),
    };
    const miCurso = (cambios = {}) => ({
      disponible: true,
      vistaMiCurso: false,
      cursos: [{ id: 5, nombre: "QUINTO A" }],
      cursoId: 5,
      datos: null,
      cargando: false,
      error: null,
      onCambiarCurso: vi.fn(),
      onMostrarMiCurso: vi.fn(),
      onMostrarMisMaterias: vi.fn(),
      onReintentar: vi.fn(),
      ...cambios,
    });

    it("quien no dirige un curso no ve pestañas", () => {
      render(<VistaIngresoBoletinProfesor {...base} miCurso={miCurso({ disponible: false })} />);
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
    });

    it("el director ve las dos pestañas y puede cambiar", async () => {
      const user = userEvent.setup();
      const valores = miCurso();
      render(<VistaIngresoBoletinProfesor {...base} miCurso={valores} />);

      expect(screen.getByRole("tab", { name: "Mis materias" })).toHaveAttribute("aria-selected", "true");
      await user.click(screen.getByRole("tab", { name: "Mi curso (director de grupo)" }));
      expect(valores.onMostrarMiCurso).toHaveBeenCalledTimes(1);
    });

    it("en Mi curso, el curso y el periodo van en el encabezado del curso, aun mientras carga", async () => {
      const user = userEvent.setup();
      const valores = miCurso({
        vistaMiCurso: true,
        cargando: true,
        cursos: [{ id: 5, nombre: "QUINTO A" }, { id: 8, nombre: "SEXTO B" }],
      });
      const onCambiarPeriodo = vi.fn();
      render(<VistaIngresoBoletinProfesor {...base} onCambiarPeriodo={onCambiarPeriodo} miCurso={valores} />);

      const encabezado = screen.getByRole("heading", { name: "QUINTO A · Periodo 1" }).closest(".border-b");
      const curso = within(encabezado).getByLabelText("Curso");
      const periodo = within(encabezado).getByLabelText("Periodo");
      expect(screen.getAllByLabelText("Periodo")).toHaveLength(1);

      await user.selectOptions(curso, "8");
      await user.selectOptions(periodo, "3");
      expect(valores.onCambiarCurso).toHaveBeenCalledWith("8");
      expect(onCambiarPeriodo).toHaveBeenCalledWith("3");
    });

    it("con un solo curso no hay selector de curso, pero sí de periodo", () => {
      render(<VistaIngresoBoletinProfesor {...base} miCurso={miCurso({ vistaMiCurso: true, cargando: true })} />);
      expect(screen.queryByLabelText("Curso")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Periodo")).toBeInTheDocument();
    });

    it("en Mi curso se ve el ranking, sin el selector de clase ni las tarjetas de sus materias", () => {
      render(
        <VistaIngresoBoletinProfesor
          {...base}
          miCurso={miCurso({ vistaMiCurso: true, cargando: true })}
        />,
      );

      expect(screen.getByRole("tab", { name: "Mi curso (director de grupo)" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("Cargando tu curso…")).toBeInTheDocument();
      expect(screen.queryByText("Clase (Curso / Materia)")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Periodo")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Ana" })).not.toBeInTheDocument();
    });
  });
});
