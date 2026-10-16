import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../impresion/DocumentoImprimible", () => ({
  default: ({ children, titulo, subtitulo, firmas = [] }) => (
    <div data-testid="documento" data-titulo={titulo} data-subtitulo={subtitulo}>
      {children}
      {firmas.map((f) => (
        <div key={f.cargo} data-testid="firma">{f.cargo}</div>
      ))}
    </div>
  ),
}));

import CertificadoMatriculaPreview from "./CertificadoMatriculaPreview";
import CertificadoNotasPreview from "./CertificadoNotasPreview";
import ReporteParcialPreview from "./ReporteParcialPreview";

describe("vistas imprimibles de certificados", () => {
  it("presenta notas y conserva el comando para volver", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <CertificadoNotasPreview
        certificado={{
          estudiante_nombre_completo: "Sara López",
          documento_identidad: "TI-123",
          curso: "Quinto",
          periodo: 1,
          materias: [],
        }}
        onBack={onBack}
      />,
    );

    expect(screen.getByTestId("documento")).toHaveAttribute("data-titulo", "Certificado de Notas");
    expect(screen.getByText("No hay notas registradas para la seleccion actual.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "← Atrás" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("presenta matrícula con los datos y el año recibidos", () => {
    render(
      <CertificadoMatriculaPreview
        certificado={{
          estudiante_nombre_completo: "Sara López",
          documento_identidad: "TI-123",
          curso: "Quinto",
          jornada: "Mañana",
          estado: "activo",
          anio_lectivo: 2027,
        }}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByTestId("documento")).toHaveAttribute("data-titulo", "Certificado de Matrícula");
    expect(screen.getByTestId("documento")).toHaveAttribute("data-subtitulo", "Año Lectivo 2027");
    expect(screen.getByText("Sara López")).toBeInTheDocument();
  });

  it("firma la matrícula solo dirección, sin secretaría académica", () => {
    render(
      <CertificadoMatriculaPreview
        certificado={{ estudiante_nombre_completo: "Sara López", curso: "Quinto" }}
        onBack={vi.fn()}
      />,
    );

    const firmas = screen.getAllByTestId("firma").map((f) => f.textContent);
    expect(firmas).toEqual(["Director(a)"]);
  });

  it("presenta el estado vacío del reporte parcial individual", () => {
    render(
      <ReporteParcialPreview
        reporte={{
          alcance: "estudiante",
          curso: "Quinto",
          periodo: 1,
          materia: "Todas las materias",
          estudiantes: [],
          errores: 0,
        }}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByTestId("documento")).toHaveAttribute("data-titulo", "Reporte Académico Parcial");
    expect(screen.getByText("No hay datos para mostrar.")).toBeInTheDocument();
  });
});
