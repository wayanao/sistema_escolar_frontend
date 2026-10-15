import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerObservadorMock } = vi.hoisted(() => ({
  obtenerObservadorMock: vi.fn(),
}));

// La seccion «Observador» ya no sale de `detalles.observaciones`: monta la
// misma vista que ve la profesora, que pide la bitacora al servidor.
vi.mock("../../../services/observadorApi", () => ({
  obtenerObservador: obtenerObservadorMock,
}));

import DetalleEstudianteAdmin from "./DetalleEstudianteAdmin";

beforeEach(() => {
  obtenerObservadorMock.mockReset().mockResolvedValue({
    nivel: "primaria",
    anotaciones: [
      {
        id: 12,
        profesor_id: 7,
        profesor: "Sara Díaz",
        periodo: 2,
        conductual: "Participa",
        cognitivo: "Avanza",
        lenguaje: "Expone",
        creada_en: "2026-08-02T12:00:00Z",
        editada_en: null,
        editada_por: null,
      },
    ],
  });
});

const estudiante = {
  id: 11,
  nombre: "Ana",
  apellido: "Rojas",
  curso_id: 4,
};

describe("DetalleEstudianteAdmin", () => {
  it("presenta resumen parcial, chips y dimensiones y permite cerrar", async () => {
    const user = userEvent.setup();
    const onCerrar = vi.fn();
    render(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[{ id: 4, nombre: "5A" }]}
        cargando={false}
        onCerrar={onCerrar}
        detalles={{
          promedio_general: 4.2,
          inasistencias: 1,
          notas: [],
          deudas: [],
          total_deuda: 0,
          productos_inventario: [],
        }}
      />,
    );

    expect(screen.getByText("Resumen de Rojas Ana")).toBeInTheDocument();
    expect(screen.getByText("Sin deudas pendientes.")).toBeInTheDocument();

    // La bitacora, con la misma forma que ve la profesora: agrupada por
    // dimension y con el nombre del profesor a color.
    // Sale una vez bajo cada dimension que tiene texto, que son las tres.
    expect(await screen.findAllByText("Sara Díaz")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Conductual" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cognitivo" })).toBeInTheDocument();
    expect(screen.getByText("Participa")).toBeInTheDocument();
    expect(obtenerObservadorMock.mock.calls[0][0]).toBe(11);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("conserva estados de carga y fallo total", () => {
    const { rerender, container } = render(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[]}
        detalles={null}
        cargando
        onCerrar={vi.fn()}
      />,
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    rerender(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[]}
        detalles={null}
        cargando={false}
        onCerrar={vi.fn()}
      />,
    );
    expect(screen.getByText("No se pudo cargar la información.")).toBeInTheDocument();
  });

  it("muestra aparte la deuda de años anteriores aunque el año consultado esté al día", async () => {
    render(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[{ id: 4, nombre: "5A" }]}
        cargando={false}
        onCerrar={vi.fn()}
        detalles={{
          promedio_general: 4.2,
          inasistencias: 1,
          notas: [],
          deudas: [],
          total_deuda: 0,
          deuda_anios_anteriores: [{
            anio_lectivo_id: 9,
            anio: 2025,
            total_deuda: 75000,
            deudas: [{ concepto: "Pensión", deuda: 75000 }],
          }],
          productos_inventario: [],
        }}
      />,
    );

    expect(screen.getByText("Sin deudas pendientes en el año consultado.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Deudas de años anteriores" })).toBeInTheDocument();
    expect(screen.getByText("Año 2025")).toBeInTheDocument();
    expect(screen.getAllByText("$75.000")).toHaveLength(2);
  });
});

// Paso E6 de la entrevista de admisión.
describe("Datos de admisión en la ficha (paso E6)", () => {
  const DETALLES = { notas: [], deudas: [], productos_inventario: [], promedio_general: 0 };
  const DATOS = [
    { campo: "colegio_anterior", etiqueta: "Colegio anterior", valor: "Colegio Uno" },
    { campo: "ocupacion_padre", etiqueta: "Ocupación del padre", valor: null },
  ];

  function pintar(props = {}) {
    const propiedades = {
      estudiante,
      cursos: [],
      detalles: DETALLES,
      cargando: false,
      onCerrar: vi.fn(),
      datosAdmision: null,
      cargandoDatosAdmision: false,
      errorDatosAdmision: null,
      onVerDatosAdmision: vi.fn(),
      ...props,
    };
    render(<DetalleEstudianteAdmin {...propiedades} />);
    return propiedades;
  }

  it("se piden con un botón, no al abrir la ficha", async () => {
    const user = userEvent.setup();
    const props = pintar();

    expect(screen.getByRole("heading", { name: /Datos de admisión/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver datos de admisión" }));

    expect(props.onVerDatosAdmision).toHaveBeenCalledTimes(1);
  });

  it("muestra cada dato, con una raya si está vacío", () => {
    pintar({ datosAdmision: DATOS });

    expect(screen.getByText("Colegio anterior")).toBeInTheDocument();
    expect(screen.getByText("Colegio Uno")).toBeInTheDocument();
    expect(screen.getByText("Ocupación del padre").nextSibling).toHaveTextContent("—");
    expect(screen.queryByRole("button", { name: "Ver datos de admisión" })).not.toBeInTheDocument();
  });

  it("si no hay ninguno guardado, lo dice", () => {
    pintar({ datosAdmision: DATOS.map((dato) => ({ ...dato, valor: null })) });

    expect(screen.getByText("Sin datos de admisión guardados.")).toBeInTheDocument();
  });

  it("mientras cargan, lo dice", () => {
    pintar({ cargandoDatosAdmision: true });
    expect(screen.getByText("Cargando datos de admisión...")).toBeInTheDocument();
  });

  it("si fallan, deja volver a intentar", () => {
    pintar({ errorDatosAdmision: new Error("red") });

    expect(screen.getByText("No se pudieron cargar los datos de admisión.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver datos de admisión" })).toBeInTheDocument();
  });

  it("sin quien los pida, la sección no aparece", () => {
    pintar({ onVerDatosAdmision: undefined });

    expect(screen.queryByRole("heading", { name: /Datos de admisión/ })).not.toBeInTheDocument();
  });
});

// Paso E11b de la entrevista de admisión.
describe("Respuestas de la entrevista en la ficha (paso E11b)", () => {
  const DETALLES = { notas: [], deudas: [], productos_inventario: [], promedio_general: 0 };
  const DATOS = [{ campo: "colegio_anterior", etiqueta: "Colegio anterior", valor: "Colegio Uno" }];
  const CON_RESPUESTAS = {
    admisionId: 7,
    anio: 2027,
    secciones: [
      {
        clave: "salud",
        titulo: "Salud",
        respuestas: [
          { clave: "usa_panal", pregunta: "18. ¿Usa pañal desechable?", respuesta: "No" },
          {
            clave: "dificultad_motora",
            pregunta: "19. ¿Tiene alguna dificultad motora?",
            respuesta: "Sí — Usa plantillas",
          },
        ],
      },
    ],
  };

  function pintar(props = {}) {
    render(
      <DetalleEstudianteAdmin
        estudiante={estudiante}
        cursos={[]}
        detalles={DETALLES}
        cargando={false}
        onCerrar={vi.fn()}
        datosAdmision={DATOS}
        cargandoDatosAdmision={false}
        errorDatosAdmision={null}
        onVerDatosAdmision={vi.fn()}
        respuestasAdmision={null}
        errorRespuestasAdmision={null}
        {...props}
      />,
    );
  }

  it("muestra las respuestas por sección, con la pregunta y lo que se respondió", () => {
    pintar({ respuestasAdmision: CON_RESPUESTAS });

    expect(
      screen.getByRole("heading", { name: "Respuestas de la entrevista (admisión 2027)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Salud" })).toBeInTheDocument();
    expect(screen.getByText("18. ¿Usa pañal desechable?").nextSibling).toHaveTextContent("No");
    expect(screen.getByText("Sí — Usa plantillas")).toBeInTheDocument();
    // Los datos de siempre siguen ahí.
    expect(screen.getByText("Colegio Uno")).toBeInTheDocument();
  });

  it("una admisión sin respuestas del anexo lo dice", () => {
    pintar({ respuestasAdmision: { admisionId: 7, anio: 2027, secciones: [] } });

    expect(screen.getByText("La entrevista no tiene respuestas del anexo.")).toBeInTheDocument();
  });

  it("un estudiante sin admisión lo dice", () => {
    pintar({ respuestasAdmision: { admisionId: null, anio: null, secciones: [] } });

    expect(screen.getByText("Sin entrevista de admisión.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Respuestas de la entrevista/ })).toBeInTheDocument();
  });

  it("si las respuestas no llegaron, lo dice sin esconder los datos de siempre", () => {
    pintar({ errorRespuestasAdmision: new Error("404") });

    expect(
      screen.getByText("No se pudieron cargar las respuestas de la entrevista."),
    ).toBeInTheDocument();
    expect(screen.getByText("Colegio Uno")).toBeInTheDocument();
  });

  it("antes de pedir los datos no hay respuestas", () => {
    pintar({ datosAdmision: null });

    expect(screen.queryByRole("heading", { name: /Respuestas de la entrevista/ })).not.toBeInTheDocument();
  });
});
