import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    generarBoletinCertificado: vi.fn(),
    generarReporteParcialCertificado: vi.fn(),
    listarCursosCertificados: vi.fn(),
    listarEstudiantesCertificados: vi.fn(),
    listarHistorialAsistenciaCertificados: vi.fn(),
    listarMateriasCertificados: vi.fn(),
  },
}));

vi.mock("../../services/certificadosImpresionApi", () => apiMock);

import useConsultasCertificadosAdmin from "./useConsultasCertificadosAdmin";

const estudiante = {
  id: 8,
  nombre: "Sara",
  apellido: "López",
  documento_identidad: "TI-123",
  curso_id: 3,
  estado: "activo",
};

function crearBoletin(periodo, curso = "Quinto") {
  return {
    estudiante_nombre: "Sara",
    estudiante_apellido: "López",
    curso,
    periodo,
    materias: [
      {
        materia_id: 12,
        asignacion_id: 44,
        materia: "Historia",
        profesor_nombre: "Ana",
        profesor_apellido: "Ruiz",
        definitiva: 4.2,
        detalles: [
          { observacion: "Evaluación oral", notas_por_periodo: { [periodo]: 4.2 } },
        ],
      },
    ],
  };
}

function crearReportePlanilla(periodo, curso = "Quinto") {
  return {
    ...crearBoletin(periodo, curso),
    materias: [
      {
        ...crearBoletin(periodo, curso).materias[0],
        detalles: [
          {
            descripcion: "Evaluación oral",
            nota: 4.2,
            tipo_evaluacion: "numerica",
          },
        ],
      },
    ],
  };
}

function crearPendiente() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  apiMock.listarCursosCertificados.mockResolvedValue([
    { id: 3, nombre: "Quinto", jornada: "Mañana" },
    { id: 4, nombre: "Sexto", jornada: "Tarde" },
  ]);
  apiMock.listarEstudiantesCertificados.mockResolvedValue([
    estudiante,
    {
      id: 9,
      nombre: "Luis",
      apellido: "Pérez",
      documento_identidad: "TI-999",
      curso_id: 4,
      estado: "retirado",
    },
  ]);
  apiMock.listarMateriasCertificados.mockResolvedValue([
    { id: 12, nombre: "Historia" },
  ]);
  apiMock.generarBoletinCertificado.mockImplementation(
    (_estudianteId, periodo) => Promise.resolve(crearBoletin(periodo)),
  );
  apiMock.generarReporteParcialCertificado.mockImplementation(
    (_estudianteId, periodo) => Promise.resolve(crearReportePlanilla(periodo)),
  );
  apiMock.listarHistorialAsistenciaCertificados.mockResolvedValue([
    {
      estudiante_id: 8,
      historial: [{ estado: "ausente" }, { estado: "presente" }],
    },
  ]);
});

describe("useConsultasCertificadosAdmin", () => {
  it("carga catálogos con señal y aplica filtros derivados", async () => {
    const { result } = renderHook(() => useConsultasCertificadosAdmin());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiMock.listarCursosCertificados).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
    expect(apiMock.listarEstudiantesCertificados).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
    expect(apiMock.listarMateriasCertificados).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });

    act(() => {
      result.current.setCursoSeleccionado("3");
      result.current.setEstadoFiltro("activo");
      result.current.setBusqueda("ti-123");
    });

    expect(result.current.estudiantesFiltrados).toEqual([estudiante]);
  });

  it("consulta los cuatro periodos y construye el certificado vigente", async () => {
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setPeriodo("todos"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.generarCertificado(8);
    });

    expect(respuesta.data.todos_los_periodos).toBe(true);
    expect(result.current.certificado.periodos_data).toHaveLength(4);
    for (const periodo of [1, 2, 3, 4]) {
      expect(apiMock.generarBoletinCertificado).toHaveBeenCalledWith(
        8,
        periodo,
        { signal: expect.any(AbortSignal) },
      );
    }
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("cancela la generación anterior y descarta su respuesta tardía", async () => {
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const primeraPendiente = crearPendiente();
    const segundaPendiente = crearPendiente();
    const solicitudes = [];
    apiMock.generarBoletinCertificado
      .mockImplementationOnce((_id, _periodo, { signal }) => {
        solicitudes.push(signal);
        return primeraPendiente.promise;
      })
      .mockImplementationOnce((_id, _periodo, { signal }) => {
        solicitudes.push(signal);
        return segundaPendiente.promise;
      });

    let primera;
    let segunda;
    act(() => {
      primera = result.current.generarCertificado(8);
      segunda = result.current.generarCertificado(8);
    });

    expect(solicitudes[0].aborted).toBe(true);
    expect(solicitudes[1].aborted).toBe(false);

    await act(async () => {
      segundaPendiente.resolve(crearBoletin(1, "Respuesta vigente"));
      await segunda;
      primeraPendiente.resolve(crearBoletin(1, "Respuesta antigua"));
      await primera;
    });

    expect(result.current.certificado.curso).toBe("Respuesta vigente");
    expect(result.current.generandoId).toBeNull();
  });

  it("construye el reporte individual consultando asistencia con la misma señal", async () => {
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.generarReporteParcialEstudiante(8);
    });

    expect(respuesta.data.alcance).toBe("estudiante");
    expect(respuesta.data.estudiantes[0]).toMatchObject({
      id: 8,
      promedio: 4.2,
      inasistencias: 1,
    });
    expect(apiMock.generarReporteParcialCertificado).toHaveBeenCalledWith(
      8,
      1,
      { signal: expect.any(AbortSignal) },
    );
    expect(apiMock.generarBoletinCertificado).not.toHaveBeenCalled();
    expect(respuesta.data.estudiantes[0].materias[0].detalles).toEqual([
      { descripcion: "Evaluación oral", valor: "4.2" },
    ]);
    expect(
      apiMock.listarHistorialAsistenciaCertificados,
    ).toHaveBeenCalledWith(44, 1, { signal: expect.any(AbortSignal) });
  });

  it("aborta la carga inicial al desmontar sin publicar resultados", () => {
    const pendiente = crearPendiente();
    apiMock.listarCursosCertificados.mockReturnValue(pendiente.promise);
    const { unmount } = renderHook(() => useConsultasCertificadosAdmin());
    const signal = apiMock.listarCursosCertificados.mock.calls[0][0].signal;

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it("aborta una generación activa al desmontar", async () => {
    const { result, unmount } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const pendiente = crearPendiente();
    let signal;
    apiMock.generarBoletinCertificado.mockImplementation(
      (_id, _periodo, opciones) => {
        signal = opciones.signal;
        return pendiente.promise;
      },
    );

    act(() => {
      void result.current.generarCertificado(8);
    });
    unmount();

    expect(signal.aborted).toBe(true);
  });
});
