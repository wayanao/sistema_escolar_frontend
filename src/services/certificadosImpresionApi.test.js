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
  listarVentasPendientesCertificado,
  obtenerDeudasCertificado,
  obtenerFichaEstudianteCertificado,
  obtenerValoresPagoCertificado,
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
    // Año lectivo, paso 6.10 (decisión del 2026-10-08): Certificados pide
    // todos los estados, para poder certificar a retirados y egresados. La
    // pantalla sigue empezando en "Activos". Boletines no cambia.
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/estudiantes", {
      params: { estado: "todos" },
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(3, "/materias");
  });

  it("pide la ficha del estudiante sin año, con o sin señal", async () => {
    const ficha = { id: 8, tipo_documento: "Registro Civil" };
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: ficha });

    await expect(obtenerFichaEstudianteCertificado(8)).resolves.toBe(ficha);
    await expect(
      obtenerFichaEstudianteCertificado(8, { signal: controller.signal }),
    ).resolves.toBe(ficha);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/estudiantes/8");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/estudiantes/8", {
      signal: controller.signal,
    });
  });

  it("pide deudas y ventas pendientes del paz y salvo; las deudas, con año solo si llega", async () => {
    const deudas = { total_deuda: 0, deudas: [] };
    const ventas = [];
    const controller = new AbortController();
    apiMock.get
      .mockResolvedValueOnce({ data: deudas })
      .mockResolvedValueOnce({ data: deudas })
      .mockResolvedValueOnce({ data: ventas });

    await expect(obtenerDeudasCertificado(8)).resolves.toBe(deudas);
    await expect(obtenerDeudasCertificado(8, {
      signal: controller.signal,
      parametrosAnio: { anio_lectivo_id: 3 },
    })).resolves.toBe(deudas);
    await expect(
      listarVentasPendientesCertificado(8, { signal: controller.signal }),
    ).resolves.toBe(ventas);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/estudiantes/8/deudas");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/estudiantes/8/deudas", {
      params: { anio_lectivo_id: 3 },
      signal: controller.signal,
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(3, "/api/ventas/pendientes/8", {
      signal: controller.signal,
    });
  });

  it("pide los costos del estudiante, con año solo si llega", async () => {
    const valores = { conceptos: [] };
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: valores });

    await expect(obtenerValoresPagoCertificado(8)).resolves.toBe(valores);
    await expect(obtenerValoresPagoCertificado(8, {
      signal: controller.signal,
      parametrosAnio: { anio_lectivo_id: 3 },
    })).resolves.toBe(valores);

    expect(apiMock.get).toHaveBeenNthCalledWith(1, "/estudiantes/8/valores-pago");
    expect(apiMock.get).toHaveBeenNthCalledWith(2, "/estudiantes/8/valores-pago", {
      params: { anio_lectivo_id: 3 },
      signal: controller.signal,
    });
  });

  it("pide todos los estados también con señal (paso 6.10)", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: [] });

    await listarEstudiantesCertificados({ signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/estudiantes", {
      params: { estado: "todos" },
      signal: controller.signal,
    });
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

describe("contrato HTTP de certificados y el año lectivo (paso 4.5)", () => {
  it("mirando otro año, el reporte parcial y las consultas base llevan anio_lectivo_id", async () => {
    const controller = new AbortController();
    const parametrosAnio = { anio_lectivo_id: 2 };
    apiMock.get.mockResolvedValue({ data: [] });

    await generarReporteParcialCertificado(8, 3, { signal: controller.signal, parametrosAnio });
    await generarReporteParcialCertificado(8, 4, { parametrosAnio });
    await listarCursosCertificados({ parametrosAnio });
    await listarEstudiantesCertificados({ parametrosAnio });
    await generarBoletinCertificado(8, 1, { parametrosAnio });

    const conAnio = { params: { anio_lectivo_id: 2 } };
    expect(apiMock.get.mock.calls).toEqual([
      ["/boletines/admin/reporte-parcial/8/3", { ...conAnio, signal: controller.signal }],
      ["/boletines/admin/reporte-parcial/8/4", conAnio],
      ["/cursos", conAnio],
      ["/estudiantes", { params: { estado: "todos", anio_lectivo_id: 2 } }],
      ["/boletines/admin/generar/8/1", conAnio],
    ]);
  });

  it("las materias y el historial de asistencia no llevan año", async () => {
    apiMock.get.mockResolvedValue({ data: [] });

    await listarMateriasCertificados();
    await listarHistorialAsistenciaCertificados(44, 2);

    expect(apiMock.get.mock.calls).toEqual([["/materias"], ["/asistencia/historial/44/2"]]);
  });
});
