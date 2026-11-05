import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Certificados mirando un año que no es el activo (paso 4.5 del año lectivo).
// Con el año activo, `CertificadosAdmin.test.jsx` sigue igual: fuera del
// proveedor, `useAnioLectivo` devuelve el año activo.
const mocks = vi.hoisted(() => ({
  apiMock: { get: vi.fn() },
  anioLectivo: null,
}));

vi.mock("../utils/api", () => ({ default: mocks.apiMock }));
vi.mock("../hooks/anioLectivo/useAnioLectivo", () => ({
  default: () => mocks.anioLectivo,
}));
vi.mock("../components/impresion/DocumentoImprimible", () => ({
  default: ({ children }) => (
    <div data-testid="documento-imprimible">
      {typeof children === "function" ? children(null) : children}
    </div>
  ),
}));

import CertificadosAdmin from "./CertificadosAdmin";

const { apiMock } = mocks;
const CERRADO = {
  anioActivo: { id: 1, anio: 2026, estado: "activo" },
  anioSeleccionado: { id: 3, anio: 2025, estado: "cerrado" },
  parametros: { anio_lectivo_id: 3 },
  permisos: { esAnioActivo: false, puedeEditar: false },
};
const CON_ANIO = { params: { anio_lectivo_id: 3 }, signal: expect.any(AbortSignal) };
const SIN_ANIO = { signal: expect.any(AbortSignal) };

function boletin(periodo) {
  return {
    estudiante_nombre: "Sara",
    estudiante_apellido: "López",
    curso: "PRIMERO A",
    periodo,
    materias: [
      {
        materia_id: 12,
        asignacion_id: 44,
        materia: "Historia",
        profesor_nombre: "Ana",
        profesor_apellido: "Ruiz",
        definitiva: 4.2,
        detalles: [{ observacion: "Evaluación oral", notas_por_periodo: { [periodo]: 4.2 } }],
      },
    ],
  };
}

function reportePlanilla(periodo) {
  const data = boletin(periodo);
  return {
    ...data,
    materias: data.materias.map((materia) => ({
      ...materia,
      detalles: [{ descripcion: "Evaluación oral", nota: 4.2, tipo_evaluacion: "numerica" }],
    })),
  };
}

beforeEach(() => {
  Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
  apiMock.get.mockReset();
  apiMock.get.mockImplementation((url) => {
    if (url === "/cursos") {
      return Promise.resolve({ data: [{ id: 50, nombre: "PRIMERO A", jornada: "Mañana" }] });
    }
    if (url === "/estudiantes") {
      return Promise.resolve({
        data: [
          {
            id: 8,
            nombre: "Sara",
            apellido: "López",
            documento_identidad: "TI-123",
            curso_id: 50,
            estado: "activo",
          },
        ],
      });
    }
    if (url === "/materias") return Promise.resolve({ data: [{ id: 12, nombre: "Historia" }] });
    if (url === "/estudiantes/8") {
      return Promise.resolve({ data: { id: 8, tipo_documento: "Registro Civil", documento_identidad: "TI-123" } });
    }
    if (url === "/boletines/admin/generar/8/1") return Promise.resolve({ data: boletin(1) });
    if (url === "/boletines/admin/reporte-parcial/8/1") {
      return Promise.resolve({ data: reportePlanilla(1) });
    }
    if (url === "/asistencia/historial/44/1") {
      return Promise.resolve({ data: [{ estudiante_id: 8, historial: [{ estado: "presente" }] }] });
    }
    return Promise.reject(new Error(`GET inesperado: ${url}`));
  });
});

describe("Certificados mirando otro año", () => {
  it("pide cursos y estudiantes de ese año, las materias sin año, y el certificado de notas de ese año", async () => {
    mocks.anioLectivo = CERRADO;
    const user = userEvent.setup();

    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    expect(apiMock.get.mock.calls).toEqual([
      ["/cursos", CON_ANIO],
      // Paso 6.10: Certificados pide todos los estados.
      [
        "/estudiantes",
        { params: { estado: "todos", anio_lectivo_id: 3 }, signal: expect.any(AbortSignal) },
      ],
      ["/materias", SIN_ANIO],
    ]);

    await user.click(screen.getByRole("button", { name: "Generar notas" }));

    expect(await screen.findByTestId("documento-imprimible")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/boletines/admin/generar/8/1", CON_ANIO);
  });

  it("el reporte parcial es de ese año; la asistencia parte de la clase, sin año", async () => {
    mocks.anioLectivo = CERRADO;
    const user = userEvent.setup();

    render(<CertificadosAdmin />);
    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "reporte-parcial",
    );
    await user.click(screen.getByRole("button", { name: "Ver reporte" }));

    expect(await screen.findByText("Evaluación oral")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/boletines/admin/reporte-parcial/8/1", CON_ANIO);
    expect(apiMock.get).toHaveBeenCalledWith("/asistencia/historial/44/1", SIN_ANIO);
  });

  it("propone el año consultado en el certificado de matrícula y permite editarlo", async () => {
    mocks.anioLectivo = CERRADO;
    const user = userEvent.setup();

    render(<CertificadosAdmin />);
    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "matricula",
    );

    const anio = screen.getByRole("spinbutton");
    expect(anio).toHaveValue(2025);
    await user.clear(anio);
    await user.type(anio, "2024");
    expect(anio).toHaveValue(2024);
  });
});

describe("Certificados con todos los estados (paso 6.10)", () => {
  const ACTIVO = {
    anioActivo: { id: 1, anio: 2026, estado: "activo" },
    anioSeleccionado: { id: 1, anio: 2026, estado: "activo" },
    parametros: {},
    permisos: { esAnioActivo: true, puedeEditar: true },
  };

  it("pide todos los estados, empieza mostrando los activos y deja ver a un retirado", async () => {
    mocks.anioLectivo = ACTIVO;
    const responderBase = apiMock.get.getMockImplementation();
    apiMock.get.mockImplementation((url, opciones) => {
      if (url === "/estudiantes") {
        return Promise.resolve({
          data: [
            { id: 8, nombre: "Sara", apellido: "López", documento_identidad: "TI-123", curso_id: 50, estado: "activo" },
            { id: 9, nombre: "Luis", apellido: "Pardo", documento_identidad: "TI-999", curso_id: 50, estado: "retirado" },
          ],
        });
      }
      return responderBase(url, opciones);
    });
    const user = userEvent.setup();

    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    expect(screen.queryByText("TI-999")).not.toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes", {
      params: { estado: "todos" },
      signal: expect.any(AbortSignal),
    });

    await user.selectOptions(screen.getByDisplayValue("Activos"), "retirado");

    expect(await screen.findByText("TI-999")).toBeInTheDocument();
    expect(screen.queryByText("TI-123")).not.toBeInTheDocument();
  });

  it("con el año cerrado, la conducta dice «cursó» y la matrícula «estuvo matriculado»; la ficha va sin año", async () => {
    mocks.anioLectivo = CERRADO;
    const user = userEvent.setup();
    const parrafo = () => screen.getByText((_, elemento) =>
      elemento?.tagName === "P" && elemento.textContent.startsWith("Que ")).textContent;

    render(<CertificadosAdmin />);
    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    const tipo = () => screen.getByRole("combobox", { name: "Tipo de documento" });

    await user.selectOptions(tipo(), "conducta");
    await user.click(screen.getByRole("button", { name: "Generar conducta" }));
    expect(await screen.findByText("CERTIFICA:")).toBeInTheDocument();
    expect(parrafo()).toContain(
      "identificado(a) con R.C. No. TI-123, cursó en esta institución el grado PRIMERO A del año lectivo 2025",
    );
    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes/8", SIN_ANIO);

    await user.click(screen.getByRole("button", { name: "← Atrás" }));
    await user.selectOptions(tipo(), "matricula");
    await user.click(screen.getByRole("button", { name: "Generar matrícula" }));
    expect(await screen.findByText("CERTIFICA:")).toBeInTheDocument();
    expect(parrafo()).toContain("estuvo matriculado(a) en esta institución en el grado PRIMERO A");
  });

  it("paz y salvo de un año pasado: revisa el año activo y, sin matrícula en él, el que se mira", async () => {
    mocks.anioLectivo = CERRADO;
    const rutasBase = apiMock.get.getMockImplementation();
    apiMock.get.mockImplementation((url, opciones) => {
      if (url === "/estudiantes/8/deudas") {
        // Sin año (el activo): no está matriculado, como un egresado.
        if (!opciones?.params) return Promise.reject({ response: { status: 404 } });
        return Promise.resolve({ data: { deudas: [], total_deuda: 0, deuda_anios_anteriores: [] } });
      }
      if (url === "/api/ventas/pendientes/8") return Promise.resolve({ data: [] });
      return rutasBase(url, opciones);
    });
    const user = userEvent.setup();

    render(<CertificadosAdmin />);
    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "paz-salvo",
    );
    await user.click(screen.getByRole("button", { name: "Generar paz y salvo" }));

    expect(await screen.findByText("CERTIFICA:")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes/8/deudas", SIN_ANIO);
    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes/8/deudas", CON_ANIO);
    expect(apiMock.get).toHaveBeenCalledWith("/api/ventas/pendientes/8", SIN_ANIO);
    expect(screen.getByText((_, elemento) =>
      elemento?.tagName === "P" && elemento.textContent.startsWith("Que ")))
      .toHaveTextContent("quien cursó el grado PRIMERO A del año lectivo 2025, se encuentra a paz y salvo");
  });
});
