import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  obtenerAdmisionMock,
  obtenerCuestionarioMock,
  obtenerDetalleMock,
  obtenerDeudasMock,
  obtenerEstudianteMock,
} = vi.hoisted(() => ({
  obtenerAdmisionMock: vi.fn(),
  obtenerCuestionarioMock: vi.fn(),
  obtenerDetalleMock: vi.fn(),
  obtenerDeudasMock: vi.fn(),
  obtenerEstudianteMock: vi.fn(),
}));

vi.mock("../../services/estudiantesObservadorApi", () => ({
  obtenerAdmisionDeEstudiante: obtenerAdmisionMock,
  obtenerDetalleEstudiante: obtenerDetalleMock,
  obtenerDeudasEstudiante: obtenerDeudasMock,
  obtenerEstudiante: obtenerEstudianteMock,
}));
vi.mock("../../services/admisionesApi", () => ({
  obtenerCuestionarioAdmision: obtenerCuestionarioMock,
}));

import useDetalleEstudianteAdmin from "./useDetalleEstudianteAdmin";

function crearPendiente() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useDetalleEstudianteAdmin", () => {
  it("conserva el detalle cuando solo responde el endpoint financiero", async () => {
    obtenerDetalleMock.mockRejectedValue(new Error("Sin resumen"));
    obtenerDeudasMock.mockResolvedValue({
      deudas: [{ deuda: 25 }],
      total_deuda: 25,
    });
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await act(async () => {
      await result.current.verDetalles({ id: 11, nombre: "Ana" });
    });

    expect(result.current.selectedEstudiante).toEqual({ id: 11, nombre: "Ana" });
    expect(result.current.detallesEstudiante).toMatchObject({
      notas: [],
      observaciones: [],
      deudas: [{ deuda: 25 }],
      total_deuda: 25,
    });
    expect(result.current.errorDetalle).toBeNull();
  });

  it("impide que un detalle anterior sobrescriba al estudiante abierto", async () => {
    const detalleAna = crearPendiente();
    const deudasAna = crearPendiente();
    const detalleLuis = crearPendiente();
    const deudasLuis = crearPendiente();
    obtenerDetalleMock
      .mockImplementationOnce(() => detalleAna.promise)
      .mockImplementationOnce(() => detalleLuis.promise);
    obtenerDeudasMock
      .mockImplementationOnce(() => deudasAna.promise)
      .mockImplementationOnce(() => deudasLuis.promise);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    act(() => {
      void result.current.verDetalles({ id: 11, nombre: "Ana" });
    });
    act(() => {
      void result.current.verDetalles({ id: 12, nombre: "Luis" });
    });

    await act(async () => {
      detalleLuis.resolve({ promedio_general: 4.5 });
      deudasLuis.resolve({ deudas: [] });
      await Promise.all([detalleLuis.promise, deudasLuis.promise]);
    });
    await waitFor(() => expect(result.current.loadingDetalles).toBe(false));

    await act(async () => {
      detalleAna.resolve({ promedio_general: 2.5 });
      deudasAna.resolve({ deudas: [{ deuda: 90 }] });
      await Promise.all([detalleAna.promise, deudasAna.promise]);
    });

    expect(result.current.selectedEstudiante).toEqual({ id: 12, nombre: "Luis" });
    expect(result.current.detallesEstudiante).toMatchObject({
      promedio_general: 4.5,
      deudas: [],
    });
  });

  it("invalida la consulta pendiente al cerrar el modal", async () => {
    const detalle = crearPendiente();
    const deudas = crearPendiente();
    obtenerDetalleMock.mockReturnValue(detalle.promise);
    obtenerDeudasMock.mockReturnValue(deudas.promise);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    act(() => {
      void result.current.verDetalles({ id: 11, nombre: "Ana" });
      result.current.cerrarModal();
    });

    await act(async () => {
      detalle.resolve({ promedio_general: 5 });
      deudas.resolve({ deudas: [] });
      await Promise.all([detalle.promise, deudas.promise]);
    });

    expect(result.current.selectedEstudiante).toBeNull();
    expect(result.current.detallesEstudiante).toBeNull();
    expect(result.current.loadingDetalles).toBe(false);
  });
});

describe("useDetalleEstudianteAdmin y el año que mira el admin", () => {
  beforeEach(() => {
    obtenerDetalleMock.mockResolvedValue({ promedio_general: 4 });
    obtenerDeudasMock.mockResolvedValue({ deudas: [{ deuda: 300000 }], total_deuda: 300000 });
  });

  it("sin año elegido, la ficha se pide sin año", async () => {
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await act(async () => {
      await result.current.verDetalles({ id: 11, nombre: "Ana" });
    });

    expect(obtenerDetalleMock).toHaveBeenCalledWith(11, {});
    expect(obtenerDeudasMock).toHaveBeenCalledWith(11, {});
  });

  it("con un año elegido, el resumen y las deudas son de ese año", async () => {
    const parametrosAnio = { anio_lectivo_id: 2 };
    const { result } = renderHook(() => useDetalleEstudianteAdmin({ parametrosAnio }));

    await act(async () => {
      await result.current.verDetalles({ id: 11, nombre: "Ana" });
    });

    expect(obtenerDetalleMock).toHaveBeenCalledWith(11, { parametrosAnio });
    expect(obtenerDeudasMock).toHaveBeenCalledWith(11, { parametrosAnio });
    expect(result.current.detallesEstudiante).toMatchObject({
      promedio_general: 4,
      total_deuda: 300000,
    });
  });

  it("si cambia el año, la ficha siguiente se pide con el año nuevo", async () => {
    const { result, rerender } = renderHook(
      ({ anio }) => useDetalleEstudianteAdmin({ parametrosAnio: anio }),
      { initialProps: { anio: { anio_lectivo_id: 2 } } },
    );
    const otroAnio = { anio_lectivo_id: 3 };
    rerender({ anio: otroAnio });

    await act(async () => {
      await result.current.verDetalles({ id: 11, nombre: "Ana" });
    });

    expect(obtenerDetalleMock).toHaveBeenCalledWith(11, { parametrosAnio: otroAnio });
    expect(obtenerDeudasMock).toHaveBeenCalledWith(11, { parametrosAnio: otroAnio });
  });
});

// Paso E6 de la entrevista de admisión: "Datos de admisión" se pide solo si
// el admin lo abre, para no sumar una petición cada vez que abre una ficha.
describe("datos de admisión, a pedido (paso E6)", () => {
  beforeEach(() => {
    obtenerDetalleMock.mockResolvedValue({});
    obtenerDeudasMock.mockResolvedValue({});
  });

  it("abrir la ficha no los pide; verlos sí, una vez", async () => {
    obtenerEstudianteMock.mockResolvedValue({ id: 11, colegio_anterior: "Colegio Uno" });
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await act(async () => {
      await result.current.verDetalles({ id: 11, nombre: "Ana" });
    });
    expect(obtenerEstudianteMock).not.toHaveBeenCalled();
    expect(result.current.datosAdmision).toBeNull();

    await act(async () => {
      await result.current.verDatosAdmision();
    });

    expect(obtenerEstudianteMock).toHaveBeenCalledTimes(1);
    expect(obtenerEstudianteMock).toHaveBeenCalledWith(11);
    expect(result.current.datosAdmision[0]).toMatchObject({
      etiqueta: "Colegio anterior",
      valor: "Colegio Uno",
    });
    expect(result.current.cargandoDatosAdmision).toBe(false);
  });

  it("al cerrar o abrir otra ficha se olvidan", async () => {
    obtenerEstudianteMock.mockResolvedValue({ id: 11, colegio_anterior: "Colegio Uno" });
    const { result } = renderHook(() => useDetalleEstudianteAdmin());
    await act(async () => {
      await result.current.verDetalles({ id: 11 });
    });
    await act(async () => {
      await result.current.verDatosAdmision();
    });
    expect(result.current.datosAdmision).not.toBeNull();

    await act(async () => {
      await result.current.verDetalles({ id: 12 });
    });
    expect(result.current.datosAdmision).toBeNull();

    await act(async () => {
      await result.current.verDatosAdmision();
    });
    expect(result.current.datosAdmision).not.toBeNull();

    act(() => result.current.cerrarModal());
    expect(result.current.datosAdmision).toBeNull();
  });

  it("descarta la respuesta de una ficha que ya se cerró", async () => {
    const pendiente = crearPendiente();
    obtenerEstudianteMock.mockReturnValue(pendiente.promise);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());
    await act(async () => {
      await result.current.verDetalles({ id: 11 });
    });

    let pedido;
    act(() => {
      pedido = result.current.verDatosAdmision();
    });
    act(() => result.current.cerrarModal());
    await act(async () => {
      pendiente.resolve({ id: 11, colegio_anterior: "Colegio Uno" });
      await pedido;
    });

    expect(result.current.datosAdmision).toBeNull();
    expect(result.current.cargandoDatosAdmision).toBe(false);
  });

  it("si no llegan, guarda el error y deja volver a intentar", async () => {
    obtenerEstudianteMock.mockRejectedValue(new Error("red"));
    const { result } = renderHook(() => useDetalleEstudianteAdmin());
    await act(async () => {
      await result.current.verDetalles({ id: 11 });
    });
    await act(async () => {
      await result.current.verDatosAdmision();
    });

    await waitFor(() => expect(result.current.errorDatosAdmision).toBeTruthy());
    expect(result.current.datosAdmision).toBeNull();
  });
});

describe("respuestas de la entrevista de admisión (paso E11b)", () => {
  const CATALOGO = {
    secciones: [
      {
        clave: "salud",
        titulo: "Salud",
        preguntas: [
          {
            numero: 18,
            clave: "usa_panal",
            texto: "¿Usa pañal desechable?",
            tipo: "si_no",
            opciones: [
              { valor: "si", etiqueta: "Sí" },
              { valor: "no", etiqueta: "No" },
            ],
          },
        ],
      },
    ],
  };
  const SIN_ADMISION = { admision_id: null, anio: null, fecha_entrevista: null, cuestionario: {} };
  const CON_RESPUESTAS = {
    admision_id: 7,
    anio: 2027,
    fecha_entrevista: "2026-10-20",
    cuestionario: { usa_panal: { respuesta: "no" } },
  };

  beforeEach(() => {
    obtenerDetalleMock.mockResolvedValue({});
    obtenerDeudasMock.mockResolvedValue({});
    obtenerEstudianteMock.mockResolvedValue({ id: 11, colegio_anterior: "Colegio Uno" });
    obtenerAdmisionMock.mockResolvedValue(SIN_ADMISION);
    obtenerCuestionarioMock.mockResolvedValue(CATALOGO);
  });

  async function verDatos(result, estudiante = { id: 11 }) {
    await act(async () => {
      await result.current.verDetalles(estudiante);
    });
    await act(async () => {
      await result.current.verDatosAdmision();
    });
  }

  it("pide los datos y la admisión a la vez; sin respuestas no pide la lista de preguntas", async () => {
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await verDatos(result);

    expect(obtenerEstudianteMock).toHaveBeenCalledWith(11);
    expect(obtenerAdmisionMock).toHaveBeenCalledWith(11);
    expect(obtenerCuestionarioMock).not.toHaveBeenCalled();
    expect(result.current.respuestasAdmision).toEqual({
      admisionId: null,
      anio: null,
      secciones: [],
    });
    expect(result.current.errorRespuestasAdmision).toBeNull();
  });

  it("con respuestas, las deja en texto con la lista de preguntas", async () => {
    obtenerAdmisionMock.mockResolvedValue(CON_RESPUESTAS);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await verDatos(result);

    expect(obtenerCuestionarioMock).toHaveBeenCalledTimes(1);
    expect(result.current.respuestasAdmision).toEqual({
      admisionId: 7,
      anio: 2027,
      secciones: [
        {
          clave: "salud",
          titulo: "Salud",
          respuestas: [
            { clave: "usa_panal", pregunta: "18. ¿Usa pañal desechable?", respuesta: "No" },
          ],
        },
      ],
    });
    expect(result.current.datosAdmision).not.toBeNull();
  });

  it("la lista de preguntas se pide una sola vez mientras la página está abierta", async () => {
    obtenerAdmisionMock.mockResolvedValue(CON_RESPUESTAS);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await verDatos(result, { id: 11 });
    await verDatos(result, { id: 12 });

    expect(obtenerAdmisionMock).toHaveBeenCalledTimes(2);
    expect(obtenerCuestionarioMock).toHaveBeenCalledTimes(1);
  });

  it("si las respuestas no llegan, los datos de siempre se ven igual", async () => {
    obtenerAdmisionMock.mockRejectedValue(new Error("404"));
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await verDatos(result);

    expect(result.current.datosAdmision[0]).toMatchObject({ valor: "Colegio Uno" });
    expect(result.current.respuestasAdmision).toBeNull();
    expect(result.current.errorRespuestasAdmision).toBeTruthy();
    expect(result.current.errorDatosAdmision).toBeNull();
  });

  it("si la lista de preguntas no llega, también es un error de las respuestas", async () => {
    obtenerAdmisionMock.mockResolvedValue(CON_RESPUESTAS);
    obtenerCuestionarioMock.mockRejectedValue(new Error("red"));
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await verDatos(result);

    expect(result.current.respuestasAdmision).toBeNull();
    expect(result.current.errorRespuestasAdmision).toBeTruthy();
    expect(result.current.datosAdmision).not.toBeNull();
  });

  it("al cerrar o abrir otra ficha se olvidan", async () => {
    obtenerAdmisionMock.mockResolvedValue(CON_RESPUESTAS);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());
    await verDatos(result);
    expect(result.current.respuestasAdmision).not.toBeNull();

    await act(async () => {
      await result.current.verDetalles({ id: 12 });
    });
    expect(result.current.respuestasAdmision).toBeNull();

    await act(async () => {
      await result.current.verDatosAdmision();
    });
    act(() => result.current.cerrarModal());
    expect(result.current.respuestasAdmision).toBeNull();
    expect(result.current.errorRespuestasAdmision).toBeNull();
  });
});
