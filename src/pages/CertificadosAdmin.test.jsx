import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { certificadosApiMock } = vi.hoisted(() => ({
  certificadosApiMock: {
    generarBoletinCertificado: vi.fn(),
    listarCursosCertificados: vi.fn(),
    listarEstudiantesCertificados: vi.fn(),
    listarHistorialAsistenciaCertificados: vi.fn(),
    listarMateriasCertificados: vi.fn(),
  },
}));

vi.mock("../services/certificadosImpresionApi", () => certificadosApiMock);

vi.mock("../components/impresion/DocumentoImprimible", () => ({
  default: ({ children, tipo, className, titulo, subtitulo }) => (
    <div
      data-testid="documento-imprimible"
      data-tipo={tipo}
      data-class-name={className}
      data-titulo={titulo}
      data-subtitulo={subtitulo}
    >
      {children}
    </div>
  ),
}));

import CertificadosAdmin from "./CertificadosAdmin";

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

describe("CertificadosAdmin", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });

    vi.clearAllMocks();
    certificadosApiMock.listarCursosCertificados.mockResolvedValue([
      { id: 3, nombre: "Quinto", jornada: "Mañana" },
    ]);
    certificadosApiMock.listarEstudiantesCertificados.mockResolvedValue([
      estudiante,
    ]);
    certificadosApiMock.listarMateriasCertificados.mockResolvedValue([
      { id: 12, nombre: "Historia" },
    ]);
    certificadosApiMock.generarBoletinCertificado.mockImplementation(
      (_estudianteId, periodo) => Promise.resolve(boletin(periodo)),
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
    await user.click(
      screen.getByRole("button", { name: "Reporte académico parcial" }),
    );
    await user.selectOptions(
      screen.getByDisplayValue("Todas las materias"),
      "12",
    );
    await user.click(screen.getByRole("button", { name: "Ver reporte" }));

    expect(await screen.findByText("Evaluación oral")).toBeInTheDocument();
    expect(certificadosApiMock.generarBoletinCertificado).toHaveBeenCalledWith(
      8,
      1,
      { signal: expect.any(AbortSignal) },
    );
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

  it("conserva el certificado de matrícula local sin consultas académicas adicionales", async () => {
    const user = userEvent.setup();
    render(<CertificadosAdmin />);

    expect(await screen.findByText("TI-123")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Certificado de matrícula" }),
    );
    const anio = screen.getByRole("spinbutton");
    await user.clear(anio);
    await user.type(anio, "2027");
    await user.click(screen.getByRole("button", { name: "Generar matrícula" }));

    const documento = screen.getByTestId("documento-imprimible");
    expect(documento).toHaveAttribute("data-titulo", "Certificado de Matrícula");
    expect(documento).toHaveAttribute("data-subtitulo", "Año Lectivo 2027");
    expect(screen.getByText("Sara López")).toBeInTheDocument();
    expect(screen.getAllByText("Mañana")).toHaveLength(2);
    expect(screen.getByText("2027")).toBeInTheDocument();
    expect(certificadosApiMock.listarCursosCertificados).toHaveBeenCalledTimes(1);
    expect(
      certificadosApiMock.listarEstudiantesCertificados,
    ).toHaveBeenCalledTimes(1);
    expect(certificadosApiMock.listarMateriasCertificados).toHaveBeenCalledTimes(1);
    expect(certificadosApiMock.generarBoletinCertificado).not.toHaveBeenCalled();
  });
});
