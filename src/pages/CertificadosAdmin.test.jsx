import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { certificadosApiMock } = vi.hoisted(() => ({
  certificadosApiMock: {
    generarBoletinCertificado: vi.fn(),
    generarReporteParcialCertificado: vi.fn(),
    listarCursosCertificados: vi.fn(),
    listarEstudiantesCertificados: vi.fn(),
    listarHistorialAsistenciaCertificados: vi.fn(),
    listarMateriasCertificados: vi.fn(),
    listarVentasPendientesCertificado: vi.fn(),
    obtenerDeudasCertificado: vi.fn(),
    obtenerFichaEstudianteCertificado: vi.fn(),
  },
}));

vi.mock("../services/certificadosImpresionApi", () => certificadosApiMock);

// `children` puede ser una función del branding (certificados con el formato
// de los modelos); aquí, sin branding.
vi.mock("../components/impresion/DocumentoImprimible", () => ({
  default: ({ children, tipo, className, titulo, subtitulo }) => (
    <div
      data-testid="documento-imprimible"
      data-tipo={tipo}
      data-class-name={className}
      data-titulo={titulo}
      data-subtitulo={subtitulo}
    >
      {typeof children === "function" ? children(null) : children}
    </div>
  ),
}));

import CertificadosAdmin from "./CertificadosAdmin";

function parrafoCertificado() {
  return screen.getByText((_, elemento) =>
    elemento?.tagName === "P" && elemento.textContent.startsWith("Que ")).textContent;
}

const estudiante = {
  id: 8,
  nombre: "Sara",
  apellido: "López",
  documento_identidad: "TI-123",
  curso_id: 3,
  estado: "activo",
};

const notasPorPeriodo = {
  1: 4.2,
  2: 3.8,
  3: 4.6,
  4: 2.9,
};

function boletin(periodo) {
  return {
    estudiante_nombre: "Sara",
    estudiante_apellido: "López",
    curso: "Quinto",
    periodo,
    materias: [
      {
        materia_id: 12,
        asignacion_id: 44,
        materia: "Historia",
        profesor_nombre: "Ana",
        profesor_apellido: "Ruiz",
        definitiva: notasPorPeriodo[periodo],
        detalles: [
          {
            observacion: "Evaluación oral",
            notas_por_periodo: { [periodo]: notasPorPeriodo[periodo] },
          },
        ],
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
      detalles: [
        {
          descripcion: "Evaluación oral",
          nota: notasPorPeriodo[periodo],
          tipo_evaluacion: "numerica",
        },
      ],
    })),
  };
}

describe("CertificadosAdmin", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });

    vi.clearAllMocks();
    certificadosApiMock.listarCursosCertificados.mockResolvedValue([
      { id: 3, nombre: "Quinto", jornada: "Mañana", nivel: "primaria" },
    ]);
    certificadosApiMock.obtenerFichaEstudianteCertificado.mockResolvedValue({
      ...estudiante,
      tipo_documento: "Tarjeta de Identidad",
    });
    certificadosApiMock.obtenerDeudasCertificado.mockResolvedValue({
      deudas: [],
      total_deuda: 0,
      deuda_anios_anteriores: [],
    });
    certificadosApiMock.listarVentasPendientesCertificado.mockResolvedValue([]);
    certificadosApiMock.listarEstudiantesCertificados.mockResolvedValue([
      estudiante,
    ]);
    certificadosApiMock.listarMateriasCertificados.mockResolvedValue([
      { id: 12, nombre: "Historia" },
    ]);
    certificadosApiMock.generarBoletinCertificado.mockImplementation(
      (_estudianteId, periodo) => Promise.resolve(boletin(periodo)),
    );
    certificadosApiMock.generarReporteParcialCertificado.mockImplementation(
      (_estudianteId, periodo) => Promise.resolve(reportePlanilla(periodo)),
    );
    certificadosApiMock.listarHistorialAsistenciaCertificados.mockResolvedValue([
      {
        estudiante_id: 8,
        historial: [
          { estado: "ausente" },
          { estado: "presente" },
          { estado: "AUSENTE" },
        ],
      },
    ]);
  });

  it("conserva la consolidación de los cuatro periodos en el certificado de notas", async () => {
    const user = userEvent.setup();
    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(screen.getByDisplayValue("Periodo 1"), "todos");
    await user.click(screen.getByRole("button", { name: "Generar notas" }));

    const documento = await screen.findByTestId("documento-imprimible");
    expect(documento).toHaveAttribute("data-tipo", "reporte_estudiante");
    expect(documento).toHaveAttribute("data-class-name", "di-documento--certificado");
    expect(documento).toHaveAttribute("data-titulo", "Certificado de Notas");
    expect(documento).toHaveAttribute(
      "data-subtitulo",
      expect.stringContaining("Todos los periodos"),
    );

    for (const periodo of [1, 2, 3, 4]) {
      expect(certificadosApiMock.generarBoletinCertificado).toHaveBeenCalledWith(
        8,
        periodo,
        { signal: expect.any(AbortSignal) },
      );
    }
    expect(screen.getAllByText("Historia")).toHaveLength(1);
    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText("3.8")).toBeInTheDocument();
    expect(screen.getByText("4.6")).toBeInTheDocument();
    expect(screen.getByText("2.9")).toBeInTheDocument();
    expect(screen.getAllByText("3.9")).toHaveLength(2);
    expect(screen.getByText("Basico")).toBeInTheDocument();
  });

  it("conserva materia, detalle, desempeño e inasistencias del reporte parcial individual", async () => {
    const user = userEvent.setup();
    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "reporte-parcial",
    );
    await user.selectOptions(
      screen.getByDisplayValue("Todas las materias"),
      "12",
    );
    await user.click(screen.getByRole("button", { name: "Ver reporte" }));

    expect(await screen.findByText("Evaluación oral")).toBeInTheDocument();
    expect(
      certificadosApiMock.generarReporteParcialCertificado,
    ).toHaveBeenCalledWith(
      8,
      1,
      { signal: expect.any(AbortSignal) },
    );
    expect(certificadosApiMock.generarBoletinCertificado).not.toHaveBeenCalled();
    expect(
      certificadosApiMock.listarHistorialAsistenciaCertificados,
    ).toHaveBeenCalledWith(44, 1, { signal: expect.any(AbortSignal) });
    expect(screen.getByTestId("documento-imprimible")).toHaveAttribute(
      "data-titulo",
      "Reporte Académico Parcial",
    );
    expect(screen.getAllByText("Historia")).toHaveLength(2);
    expect(screen.getByText("Inas. 2")).toBeInTheDocument();
    expect(screen.getByText("Al dia")).toBeInTheDocument();
    expect(screen.getByText("Alto")).toBeInTheDocument();
  });

  it("arma la matrícula con el formato de los modelos: pide solo la ficha, por el tipo de documento", async () => {
    const user = userEvent.setup();
    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "matricula",
    );
    const anio = screen.getByRole("spinbutton");
    await user.clear(anio);
    await user.type(anio, "2027");
    await user.click(screen.getByRole("button", { name: "Generar matrícula" }));

    expect(await screen.findByText("CERTIFICA:")).toBeInTheDocument();
    expect(parrafoCertificado()).toBe(
      "Que el(la) estudiante SARA LÓPEZ, identificado(a) con T.I. No. TI-123, se encuentra "
        + "matriculado(a) en esta institución en el grado QUINTO del nivel de Educación Básica "
        + "Primaria del año lectivo 2027.",
    );
    expect(
      certificadosApiMock.obtenerFichaEstudianteCertificado,
    ).toHaveBeenCalledWith(8, { signal: expect.any(AbortSignal) });
    expect(certificadosApiMock.listarCursosCertificados).toHaveBeenCalledTimes(1);
    expect(
      certificadosApiMock.listarEstudiantesCertificados,
    ).toHaveBeenCalledTimes(1);
    expect(certificadosApiMock.listarMateriasCertificados).toHaveBeenCalledTimes(1);
    expect(certificadosApiMock.generarBoletinCertificado).not.toHaveBeenCalled();
  });

  it("genera la conducta con el año que se mira, elige el desempeño y vuelve a la lista", async () => {
    const user = userEvent.setup();
    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "conducta",
    );
    await user.click(screen.getByRole("button", { name: "Generar conducta" }));

    expect(await screen.findByText("CERTIFICA:")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "En el texto decir" }), "nina");
    await user.selectOptions(screen.getByRole("combobox", { name: "Desempeño" }), "SUPERIOR");
    expect(parrafoCertificado()).toBe(
      "Que la niña SARA LÓPEZ, identificada con T.I. No. TI-123, cursa en esta institución "
        + `el grado QUINTO del nivel de Educación Básica Primaria del año lectivo ${new Date().getFullYear()}, `
        + "con una conducta descriptiva en DESEMPEÑO SUPERIOR.",
    );

    await user.click(screen.getByRole("button", { name: "← Atrás" }));
    expect(screen.getByRole("combobox", { name: "Tipo de documento" })).toHaveValue("conducta");
  });

  it("si no carga la ficha, avisa y no abre el certificado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    certificadosApiMock.obtenerFichaEstudianteCertificado.mockRejectedValue(new Error("red"));
    const user = userEvent.setup();
    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "aprobado",
    );
    await user.click(screen.getByRole("button", { name: "Generar aprobado" }));

    expect(await screen.findByText("No se pudo cargar la ficha del estudiante.")).toBeInTheDocument();
    expect(screen.queryByText("CERTIFICA:")).not.toBeInTheDocument();
  });

  it("no expide el paz y salvo a quien debe: muestra lo que debe; pagado, lo expide", async () => {
    certificadosApiMock.obtenerDeudasCertificado.mockResolvedValueOnce({
      deudas: [{ concepto: "Pensión", deuda: 130000 }],
      total_deuda: 130000,
      deuda_anios_anteriores: [],
    });
    const user = userEvent.setup();
    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
      "paz-salvo",
    );
    await user.click(screen.getByRole("button", { name: "Generar paz y salvo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se puede expedir el paz y salvo: Sara López debe $ 130.000.",
    );
    expect(screen.queryByText("CERTIFICA:")).not.toBeInTheDocument();

    // Ya pagó: la segunda vez el backend no trae deuda.
    await user.click(screen.getByRole("button", { name: "Generar paz y salvo" }));
    expect(await screen.findByText("CERTIFICA:")).toBeInTheDocument();
    expect(parrafoCertificado()).toContain("se encuentra a paz y salvo con nuestra institución.");
  });
});
