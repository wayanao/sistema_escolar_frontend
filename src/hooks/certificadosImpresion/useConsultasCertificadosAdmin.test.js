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
    listarVentasPendientesCertificado: vi.fn(),
    obtenerDeudasCertificado: vi.fn(),
    obtenerFichaEstudianteCertificado: vi.fn(),
    obtenerValoresPagoCertificado: vi.fn(),
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

describe("useConsultasCertificadosAdmin: certificados con el formato de los modelos", () => {
  it("arma conducta con la ficha y el año que se mira; con el año cerrado, en pasado", async () => {
    apiMock.obtenerFichaEstudianteCertificado.mockResolvedValue({
      tipo_documento: "Tarjeta de Identidad",
      documento_identidad: "TI-123",
    });
    const { result } = renderHook(() =>
      useConsultasCertificadosAdmin({ anioLectivoPropuesto: 2025, anioCerrado: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // El año editable es solo de la matrícula: conducta usa el que se mira.
    act(() => result.current.setAnioLectivo("2030"));
    await act(async () => {
      result.current.generarSegunTab("conducta", 8);
    });

    await waitFor(() => expect(result.current.certificadoFormal).not.toBeNull());
    expect(apiMock.obtenerFichaEstudianteCertificado).toHaveBeenCalledWith(8, {
      signal: expect.any(AbortSignal),
    });
    expect(result.current.certificadoFormal).toMatchObject({
      tipo: "conducta",
      estudiante_nombre_completo: "Sara López",
      tipo_documento: "Tarjeta de Identidad",
      anio_lectivo: "2025",
      en_pasado: true,
    });
    expect(result.current.generandoId).toBeNull();

    act(() => result.current.limpiarCertificadoFormal());
    expect(result.current.certificadoFormal).toBeNull();
  });

  it("la matrícula usa el año editado", async () => {
    apiMock.obtenerFichaEstudianteCertificado.mockResolvedValue({});
    const { result } = renderHook(() =>
      useConsultasCertificadosAdmin({ anioLectivoPropuesto: 2025 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setAnioLectivo("2027"));
    await act(async () => {
      await result.current.generarCertificadoFormal("matricula", 8);
    });

    expect(result.current.certificadoFormal).toMatchObject({
      tipo: "matricula",
      anio_lectivo: "2027",
      en_pasado: false,
    });
  });

  it("si falla la ficha, muestra el error y no abre el certificado", async () => {
    apiMock.obtenerFichaEstudianteCertificado.mockRejectedValue({
      response: { data: { detail: "Estudiante no encontrado" } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificadoFormal("aprobado", 8);
    });

    expect(result.current.certificadoFormal).toBeNull();
    expect(result.current.error).toBe("Estudiante no encontrado");
    expect(result.current.generandoId).toBeNull();
  });
});

describe("useConsultasCertificadosAdmin: paz y salvo", () => {
  const SIN_DEUDA = { deudas: [], total_deuda: 0, deuda_anios_anteriores: [] };

  beforeEach(() => {
    apiMock.obtenerFichaEstudianteCertificado.mockResolvedValue({ tipo_documento: "Registro Civil" });
    apiMock.obtenerDeudasCertificado.mockResolvedValue(SIN_DEUDA);
    apiMock.listarVentasPendientesCertificado.mockResolvedValue([]);
  });

  it("si no debe nada, abre el paz y salvo", async () => {
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificadoFormal("paz-salvo", 8);
    });

    expect(apiMock.obtenerDeudasCertificado).toHaveBeenCalledWith(8, {
      signal: expect.any(AbortSignal),
    });
    expect(apiMock.listarVentasPendientesCertificado).toHaveBeenCalledWith(8, {
      signal: expect.any(AbortSignal),
    });
    expect(result.current.certificadoFormal).toMatchObject({ tipo: "paz-salvo" });
    expect(result.current.deudaPazSalvo).toBeNull();
  });

  it("si debe, no lo abre y deja lo que debe, también por ventas", async () => {
    apiMock.obtenerDeudasCertificado.mockResolvedValue({
      ...SIN_DEUDA,
      deudas: [{ concepto: "Pensión", deuda: 130000 }],
      total_deuda: 130000,
    });
    apiMock.listarVentasPendientesCertificado.mockResolvedValue([
      { id: 4, total: 45000, descripcion: "Cargo de Inventario #4: 1x Camiseta" },
    ]);
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.generarCertificadoFormal("paz-salvo", 8);
    });

    expect(respuesta.bloqueado).toBe(true);
    expect(result.current.certificadoFormal).toBeNull();
    expect(result.current.deudaPazSalvo).toEqual({
      estudiante: "Sara López",
      items: [
        { etiqueta: "Pensión", valor: 130000 },
        { etiqueta: "Cargo de Inventario #4: 1x Camiseta", valor: 45000 },
      ],
      total: 175000,
    });
    expect(result.current.generandoId).toBeNull();

    act(() => result.current.limpiarDeudaPazSalvo());
    expect(result.current.deudaPazSalvo).toBeNull();
  });

  it("mirando otro año, revisa primero el activo; sin matrícula en el activo, el que se mira", async () => {
    const parametrosAnio = { anio_lectivo_id: 2 };
    apiMock.obtenerDeudasCertificado
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce(SIN_DEUDA);
    const { result } = renderHook(() => useConsultasCertificadosAdmin({ parametrosAnio }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificadoFormal("paz-salvo", 8);
    });

    expect(apiMock.obtenerDeudasCertificado).toHaveBeenNthCalledWith(1, 8, {
      signal: expect.any(AbortSignal),
    });
    expect(apiMock.obtenerDeudasCertificado).toHaveBeenNthCalledWith(2, 8, {
      signal: expect.any(AbortSignal),
      parametrosAnio,
    });
    expect(result.current.certificadoFormal).toMatchObject({ tipo: "paz-salvo" });
  });

  it("si no puede revisar la deuda, no lo abre", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiMock.obtenerDeudasCertificado.mockRejectedValue(new Error("red"));
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificadoFormal("paz-salvo", 8);
    });

    expect(result.current.certificadoFormal).toBeNull();
    expect(result.current.error).toBe("No se pudo revisar si el estudiante está a paz y salvo.");
  });
});

describe("useConsultasCertificadosAdmin: costos educativos", () => {
  it("trae lo que paga en el año que se mira y lo deja listo para editar", async () => {
    const parametrosAnio = { anio_lectivo_id: 2 };
    apiMock.obtenerFichaEstudianteCertificado.mockResolvedValue({ tipo_documento: "Registro Civil" });
    apiMock.obtenerValoresPagoCertificado.mockResolvedValue({
      conceptos: [{ tipo_pago_id: 1, nombre: "Matrícula", valor_a_pagar: 280000 }],
    });
    const { result } = renderHook(() =>
      useConsultasCertificadosAdmin({ parametrosAnio, anioLectivoPropuesto: 2025 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificadoFormal("costos", 8);
    });

    expect(apiMock.obtenerValoresPagoCertificado).toHaveBeenCalledWith(8, {
      signal: expect.any(AbortSignal),
      parametrosAnio,
    });
    expect(result.current.certificadoFormal).toMatchObject({
      tipo: "costos",
      anio_lectivo: "2025",
      costos: [{ id: "concepto-1", concepto: "Matrícula", valor: "280000" }],
    });
  });

  it("si no hay costos de ese año, avisa con el mensaje del backend", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiMock.obtenerFichaEstudianteCertificado.mockResolvedValue({});
    apiMock.obtenerValoresPagoCertificado.mockRejectedValue({
      response: { status: 404, data: { detail: "El estudiante no tiene matrícula en ese año." } },
    });
    const { result } = renderHook(() => useConsultasCertificadosAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificadoFormal("costos", 8);
    });

    expect(result.current.certificadoFormal).toBeNull();
    expect(result.current.error).toBe("El estudiante no tiene matrícula en ese año.");
  });
});

describe("useConsultasCertificadosAdmin con un año elegido", () => {
  const parametrosAnio = { anio_lectivo_id: 2 };
  const conAnio = { signal: expect.any(AbortSignal), parametrosAnio };

  it("pide cursos y estudiantes de ese año; las materias, sin año", async () => {
    const { result } = renderHook(() => useConsultasCertificadosAdmin({ parametrosAnio }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiMock.listarCursosCertificados).toHaveBeenCalledWith(conAnio);
    expect(apiMock.listarEstudiantesCertificados).toHaveBeenCalledWith(conAnio);
    expect(apiMock.listarMateriasCertificados).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it("usa el año consultado como propuesta editable de la matrícula", async () => {
    const { result } = renderHook(() =>
      useConsultasCertificadosAdmin({
        parametrosAnio,
        anioLectivoPropuesto: 2027,
      })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.anioLectivo).toBe("2027");
    act(() => result.current.setAnioLectivo("2028"));
    expect(result.current.anioLectivo).toBe("2028");
  });

  it("el certificado de notas y el reporte parcial son de ese año; la asistencia parte de la clase", async () => {
    const { result } = renderHook(() => useConsultasCertificadosAdmin({ parametrosAnio }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificado(8);
    });
    expect(apiMock.generarBoletinCertificado).toHaveBeenCalledWith(8, 1, conAnio);

    await act(async () => {
      await result.current.generarReporteParcialEstudiante(8);
    });
    expect(apiMock.generarReporteParcialCertificado).toHaveBeenCalledWith(8, 1, conAnio);
    expect(apiMock.listarHistorialAsistenciaCertificados).toHaveBeenCalledWith(44, 1, {
      signal: expect.any(AbortSignal),
    });
  });

  it("si cambia el año, vuelve a pedir la base y genera con el año nuevo", async () => {
    const { result, rerender } = renderHook(
      ({ anio }) => useConsultasCertificadosAdmin({ parametrosAnio: anio }),
      { initialProps: { anio: parametrosAnio } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const otroAnio = { anio_lectivo_id: 3 };
    const conOtroAnio = { signal: expect.any(AbortSignal), parametrosAnio: otroAnio };
    rerender({ anio: otroAnio });

    await waitFor(() =>
      expect(apiMock.listarEstudiantesCertificados).toHaveBeenLastCalledWith(conOtroAnio),
    );
    expect(apiMock.listarCursosCertificados).toHaveBeenLastCalledWith(conOtroAnio);
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.generarCertificado(8);
    });
    expect(apiMock.generarBoletinCertificado).toHaveBeenLastCalledWith(8, 1, conOtroAnio);

    await act(async () => {
      await result.current.generarReporteParcialEstudiante(8);
    });
    expect(apiMock.generarReporteParcialCertificado).toHaveBeenLastCalledWith(8, 1, conOtroAnio);
  });
});
