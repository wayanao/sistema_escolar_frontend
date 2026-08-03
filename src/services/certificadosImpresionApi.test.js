import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  generarBoletinCertificado,
  generarReporteParcialCertificado,
  listarCursosCertificados,
  listarEstudiantesCertificados,
  listarHistorialAsistenciaCertificados,
  listarMateriasCertificados,
} from "./certificadosImpresionApi";

beforeEach(() => {
  apiMock.get.mockReset();
});

describe("contrato HTTP de certificados", () => {
  it("conserva las consultas base sin parámetros implícitos", async () => {
    const cursos = [{ id: 3 }];
    const estudiantes = [{ id: 8 }];
    const materias = [{ id: 12 }];
    apiMock.get
      .mockResolvedValueOnce({ data: cursos })
      .mockResolvedValueOnce({ data: estudiantes })
      .mockResolvedValueOnce({ data: materias });

    await expect(listarCursosCertificados()).resolves.toBe(cursos);
    await expect(listarEstudiantesCertificados()).resolves.toBe(estudiantes);
    await expect(listarMateriasCertificados()).resolves.toBe(materias);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/cursos");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/estudiantes");
    expect(apiMock.get).toHaveBeenNthCalledWith(3, "/materias");
  });

  it("conserva las rutas de boletines e historial y devuelve solo los datos", async () => {
    const boletin = { estudiante_nombre: "Sara", periodo: 2 };
    const reporteParcial = { estudiante_nombre: "Sara", periodo: 2 };
    const historial = [{ estudiante_id: 8, historial: [] }];
    apiMock.get
      .mockResolvedValueOnce({ data: boletin })
      .mockResolvedValueOnce({ data: reporteParcial })
      .mockResolvedValueOnce({ data: historial });

    await expect(generarBoletinCertificado(8, 2)).resolves.toBe(boletin);
    await expect(
      generarReporteParcialCertificado(8, 2),
    ).resolves.toBe(reporteParcial);
    await expect(
      listarHistorialAsistenciaCertificados(44, 2),
    ).resolves.toBe(historial);

    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      "/boletines/admin/generar/8/2",
    );
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      "/boletines/admin/reporte-parcial/8/2",
    );
    expect(apiMock.get).toHaveBeenNthCalledWith(
      3,
      "/asistencia/historial/44/2",
    );
  });

  it("propaga la señal al reporte parcial en tiempo real", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValueOnce({ data: { materias: [] } });

    await generarReporteParcialCertificado(8, 3, {
      signal: controller.signal,
    });

    expect(apiMock.get).toHaveBeenCalledWith(
      "/boletines/admin/reporte-parcial/8/3",
      { signal: controller.signal },
    );
  });

  it("propaga señales y errores sin decidir mensajes visuales", async () => {
    const controller = new AbortController();
    const error = new Error("Materias no disponibles");
    apiMock.get
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(error);

    await listarMateriasCertificados({ signal: controller.signal });
    await expect(listarMateriasCertificados()).rejects.toBe(error);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/materias", {
      signal: controller.signal,
    });
  });
});
