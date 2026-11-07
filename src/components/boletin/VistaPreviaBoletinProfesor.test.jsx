import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../impresion/DocumentoImprimible", () => ({
  default: ({ children, tipo, className, titulo, subtitulo, mostrarBarra }) => (
    <div
      data-testid="documento-imprimible"
      data-tipo={tipo}
      data-class-name={className}
      data-titulo={titulo}
      data-subtitulo={subtitulo}
      data-mostrar-barra={String(mostrarBarra)}
    >
      {children}
    </div>
  ),
}));

import VistaPreviaBoletinProfesor from "./VistaPreviaBoletinProfesor";

const vistaPrevia = (cambios = {}) => ({
  estudianteId: 101,
  nombre: "Ana Pérez",
  curso: "QUINTO",
  periodo: "2",
  posicion: 1,
  total: 3,
  hayAnterior: false,
  haySiguiente: true,
  pendienteDeGuardar: true,
  materia: {
    materia_id: 55,
    materia: "LENGUAJE",
    profesor_nombre: "Lina Torres",
    profesor_apellido: "",
    definitiva: 4.5,
    detalles: [
      {
        observacion: "Lee con fluidez",
        tipo_evaluacion: "numerica",
        notas_por_periodo: { 2: 4.5 },
        valoraciones_por_periodo: {},
      },
      {
        observacion: "",
        tipo_evaluacion: "numerica",
        notas_por_periodo: {},
        valoraciones_por_periodo: {},
      },
    ],
  },
  ...cambios,
});

const estadoVisual = {
  label: "Cambios sin guardar",
  badgeClass: "badge",
  dotClass: "dot",
};

const renderizar = (props = {}) => {
  const callbacks = {
    onAnterior: vi.fn(),
    onSiguiente: vi.fn(),
    onCerrar: vi.fn(),
  };
  render(
    <VistaPreviaBoletinProfesor
      vistaPrevia={vistaPrevia()}
      estadoVisual={estadoVisual}
      {...callbacks}
      {...props}
    />,
  );
  return callbacks;
};

describe("VistaPreviaBoletinProfesor", () => {
  it("muestra la materia con el formato del boletín, sin botones de imprimir", () => {
    renderizar();

    expect(screen.getByRole("dialog", { name: "Vista previa del boletín de Ana Pérez" })).toBeInTheDocument();
    const documento = screen.getByTestId("documento-imprimible");
    expect(documento).toHaveAttribute("data-tipo", "boletin");
    expect(documento).toHaveAttribute("data-class-name", "di-documento--boletin");
    expect(documento).toHaveAttribute("data-titulo", "Boletín Académico Informativo");
    expect(documento.getAttribute("data-subtitulo")).toMatch(/^Periodo 2 · Año Lectivo \d{4}$/);
    expect(documento).toHaveAttribute("data-mostrar-barra", "false");

    expect(screen.getByText("LENGUAJE")).toBeInTheDocument();
    expect(screen.getByText(/Docente: Lina Torres/)).toBeInTheDocument();
    expect(screen.getByText("Lee con fluidez")).toBeInTheDocument();
    expect(screen.getAllByText("4.5").length).toBeGreaterThan(0);
    // El logro vacío se ve como en el boletín real: así el profesor nota que falta.
    expect(screen.getByText("Sin observación")).toBeInTheDocument();
    expect(screen.getByText("QUINTO")).toBeInTheDocument();
    expect(screen.getByText("Cambios sin guardar")).toBeInTheDocument();
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
    expect(screen.getByText(/todavía no está guardado/)).toBeInTheDocument();
    expect(screen.getByText("Vista previa · solo tu materia")).toBeInTheDocument();
    expect(screen.queryByText("La que estás llenando")).not.toBeInTheDocument();
  });

  it("si ya está guardado no pide guardar", () => {
    renderizar({ vistaPrevia: vistaPrevia({ pendienteDeGuardar: false }) });
    expect(screen.queryByText(/todavía no está guardado/)).not.toBeInTheDocument();
    expect(screen.getByText(/Así se verá en el boletín\./)).toBeInTheDocument();
  });

  it("navega y cierra con sus botones", async () => {
    const user = userEvent.setup();
    const callbacks = renderizar();

    expect(screen.getByRole("button", { name: "← Anterior" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Siguiente →" }));
    expect(callbacks.onSiguiente).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(callbacks.onCerrar).toHaveBeenCalledTimes(1);
  });

  describe("con otras materias del profesor en el curso", () => {
    const otra = (clave, nombre, cambios = {}) => ({
      clave,
      nombre,
      error: false,
      guardada: true,
      materia: {
        materia_id: Number(clave),
        materia: nombre,
        profesor_nombre: "Lina Torres",
        profesor_apellido: "",
        definitiva: 3.8,
        detalles: [
          {
            observacion: `Logro de ${nombre}`,
            tipo_evaluacion: "numerica",
            notas_por_periodo: { 2: 3.8 },
            valoraciones_por_periodo: {},
          },
        ],
      },
      ...cambios,
    });

    it("muestra primero la que llena y debajo las otras, avisando cuál no está guardada", () => {
      renderizar({
        vistaPrevia: vistaPrevia({
          tieneOtrasMaterias: true,
          otrasMaterias: [
            otra("56", "CIENCIAS"),
            otra("57", "INGLÉS", { guardada: false }),
          ],
        }),
      });

      expect(screen.getByText("Vista previa · tus materias de este curso")).toBeInTheDocument();
      expect(screen.getByText("La que estás llenando")).toBeInTheDocument();
      const nombres = screen
        .getAllByRole("heading", { level: 3 })
        .map((titulo) => titulo.textContent);
      expect(nombres).toEqual(["LENGUAJE", "CIENCIAS", "INGLÉS"]);
      expect(screen.getByText("Logro de CIENCIAS")).toBeInTheDocument();
      expect(screen.getByText("INGLÉS: aún no la guardas para este estudiante")).toBeInTheDocument();
      expect(screen.queryByText("CIENCIAS: aún no la guardas para este estudiante")).not.toBeInTheDocument();
    });

    it("mientras carga lo dice, y si una falla lo avisa sin tapar las demás", () => {
      const { unmount } = render(
        <VistaPreviaBoletinProfesor
          vistaPrevia={vistaPrevia({ tieneOtrasMaterias: true, cargandoOtrasMaterias: true })}
          estadoVisual={estadoVisual}
          onAnterior={vi.fn()}
          onSiguiente={vi.fn()}
          onCerrar={vi.fn()}
        />,
      );
      expect(screen.getByText("Cargando tus otras materias de este curso…")).toBeInTheDocument();
      expect(screen.getByText("LENGUAJE")).toBeInTheDocument();
      unmount();

      renderizar({
        vistaPrevia: vistaPrevia({
          tieneOtrasMaterias: true,
          otrasMaterias: [
            otra("56", "CIENCIAS"),
            { clave: "57", nombre: "INGLÉS", error: true, guardada: false, materia: null },
          ],
        }),
      });
      expect(screen.getByText("Logro de CIENCIAS")).toBeInTheDocument();
      expect(
        screen.getByText("No se pudo cargar INGLÉS. Cierra y vuelve a abrir para intentarlo de nuevo."),
      ).toBeInTheDocument();
      expect(screen.queryByText("Cargando tus otras materias de este curso…")).not.toBeInTheDocument();
    });
  });
});
