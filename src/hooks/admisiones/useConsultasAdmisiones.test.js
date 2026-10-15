import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listarAdmisiones: vi.fn(),
  listarCursos: vi.fn(),
  obtenerCuestionarioAdmision: vi.fn(),
}));

vi.mock("../../services/admisionesApi", () => ({
  listarAdmisiones: mocks.listarAdmisiones,
  obtenerCuestionarioAdmision: mocks.obtenerCuestionarioAdmision,
}));
vi.mock("../../services/cursosApi", () => ({
  listarCursos: mocks.listarCursos,
}));

import useConsultasAdmisiones from "./useConsultasAdmisiones";

const RESPUESTA = {
  anio_lectivo: { id: 3, anio: 2027, estado: "preparacion" },
  editable: true,
  conteos: { pendiente: 1, aprobado: 1, no_aprobado: 0, matriculado: 0, total: 2 },
  admisiones: [
    { id: 7, nombre: "Lina", resultado: "pendiente", estudiante_id: null },
    { id: 8, nombre: "Juan", resultado: "aprobado", estudiante_id: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listarAdmisiones.mockResolvedValue(RESPUESTA);
  mocks.listarCursos.mockResolvedValue([{ id: 20, nombre: "PRIMERO A" }]);
});

describe("useConsultasAdmisiones", () => {
  it("carga la lista del año con sus conteos", async () => {
    const { result } = renderHook(() => useConsultasAdmisiones(3));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(mocks.listarAdmisiones).toHaveBeenCalledWith(3, {
      signal: expect.any(AbortSignal),
    });
    expect(result.current.conteos.total).toBe(2);
    expect(result.current.editable).toBe(true);
    expect(result.current.visibles).toHaveLength(2);
    expect(result.current.error).toBe("");
  });

  it("sin año no pide nada", () => {
    const { result } = renderHook(() => useConsultasAdmisiones(null));

    expect(mocks.listarAdmisiones).not.toHaveBeenCalled();
    expect(result.current.visibles).toEqual([]);
  });

  it("filtrar no vuelve a pedir la lista", async () => {
    const { result } = renderHook(() => useConsultasAdmisiones(3));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => result.current.setFiltro("aprobado"));

    expect(result.current.visibles.map((admision) => admision.id)).toEqual([8]);
    expect(mocks.listarAdmisiones).toHaveBeenCalledTimes(1);
  });

  it("los cursos del año solo se piden si se piden", async () => {
    const { result } = renderHook(() => useConsultasAdmisiones(3));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(mocks.listarCursos).not.toHaveBeenCalled();

    const conCursos = renderHook(() => useConsultasAdmisiones(3, { cargarCursos: true }));
    await waitFor(() => expect(conCursos.result.current.cursos).toHaveLength(1));
    expect(mocks.listarCursos).toHaveBeenCalledWith("activo", {
      signal: expect.any(AbortSignal),
      parametrosAnio: { anio_lectivo_id: 3 },
    });
  });

  it("muestra el mensaje del backend si la lista no llega", async () => {
    mocks.listarAdmisiones.mockRejectedValue({
      response: { data: { detail: "El año lectivo seleccionado no existe." } },
    });

    const { result } = renderHook(() => useConsultasAdmisiones(3));

    await waitFor(() =>
      expect(result.current.error).toBe("El año lectivo seleccionado no existe."),
    );
    expect(result.current.visibles).toEqual([]);
  });

  it("descarta la respuesta de un año que ya se dejó atrás", async () => {
    let resolverViejo;
    mocks.listarAdmisiones
      .mockImplementationOnce(() => new Promise((resolver) => { resolverViejo = resolver; }))
      .mockResolvedValueOnce({ ...RESPUESTA, conteos: { ...RESPUESTA.conteos, total: 9 } });

    const { result, rerender } = renderHook(({ anio }) => useConsultasAdmisiones(anio), {
      initialProps: { anio: 3 },
    });
    rerender({ anio: 4 });
    await waitFor(() => expect(result.current.conteos.total).toBe(9));

    await act(async () => resolverViejo(RESPUESTA));

    expect(result.current.conteos.total).toBe(9);
  });

  it("recargar vuelve a pedir la lista", async () => {
    const { result } = renderHook(() => useConsultasAdmisiones(3));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(() => result.current.recargar());

    expect(mocks.listarAdmisiones).toHaveBeenCalledTimes(2);
  });
});

describe("las preguntas del anexo (paso E11)", () => {
  const SECCIONES = [{ clave: "salud", titulo: "Salud", preguntas: [] }];

  it("solo se piden si se piden: la tarjeta de Años lectivos no las necesita", async () => {
    const { result } = renderHook(() => useConsultasAdmisiones(3));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(mocks.obtenerCuestionarioAdmision).not.toHaveBeenCalled();
    expect(result.current.cuestionario).toEqual([]);
  });

  it("se piden una sola vez, aunque cambie el año", async () => {
    mocks.obtenerCuestionarioAdmision.mockResolvedValue({ secciones: SECCIONES });

    const { result, rerender } = renderHook(
      ({ anio }) => useConsultasAdmisiones(anio, { cargarCuestionario: true }),
      { initialProps: { anio: 3 } },
    );
    await waitFor(() => expect(result.current.cuestionario).toEqual(SECCIONES));
    rerender({ anio: 4 });
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(mocks.obtenerCuestionarioAdmision).toHaveBeenCalledTimes(1);
    expect(mocks.obtenerCuestionarioAdmision).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
    expect(result.current.errorCuestionario).toBe("");
  });

  it("si no llegan, lo dice sin tapar la lista", async () => {
    mocks.obtenerCuestionarioAdmision.mockRejectedValue(new Error("red"));

    const { result } = renderHook(() =>
      useConsultasAdmisiones(3, { cargarCuestionario: true }),
    );

    await waitFor(() =>
      expect(result.current.errorCuestionario).toBe(
        "No se pudieron cargar las preguntas del anexo. Lo demás de la entrevista sí se puede guardar.",
      ),
    );
    expect(result.current.cuestionario).toEqual([]);
    expect(result.current.error).toBe("");
  });
});
