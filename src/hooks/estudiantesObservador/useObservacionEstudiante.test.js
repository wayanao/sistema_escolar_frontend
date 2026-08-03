import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { guardarMock, obtenerMock } = vi.hoisted(() => ({
  guardarMock: vi.fn(),
  obtenerMock: vi.fn(),
}));

vi.mock("../../services/estudiantesObservadorApi", () => ({
  guardarObservacion: guardarMock,
  obtenerObservacion: obtenerMock,
}));

import useObservacionEstudiante from "./useObservacionEstudiante";

beforeEach(() => {
  vi.clearAllMocks();
});

function crearPropiedades(overrides = {}) {
  return {
    estudianteId: 11,
    asignacionId: "44",
    periodo: 2,
    ...overrides,
  };
}

describe("useObservacionEstudiante", () => {
  it("carga y normaliza las dimensiones del registro vigente", async () => {
    obtenerMock.mockResolvedValue({
      conductual: "Participa",
      cognitivo: null,
      lenguaje: "Expone",
    });
    const { result } = renderHook(() =>
      useObservacionEstudiante(crearPropiedades()),
    );

    await waitFor(() => expect(result.current.estadoGuardado.cargando).toBe(false));

    expect(obtenerMock).toHaveBeenCalledWith(11, "44", 2, {
      signal: expect.any(AbortSignal),
    });
    expect(result.current.conductual).toBe("Participa");
    expect(result.current.cognitivo).toBe("");
    expect(result.current.lenguaje).toBe("Expone");
    expect(result.current.estadoGuardado.guardado).toBe(true);
  });

  it("guarda una dimensión parcial y devuelve el conteo", async () => {
    obtenerMock.mockResolvedValue(null);
    guardarMock.mockResolvedValue({ id: 91 });
    const { result } = renderHook(() =>
      useObservacionEstudiante(crearPropiedades()),
    );
    await waitFor(() => expect(result.current.estadoGuardado.cargando).toBe(false));

    act(() => result.current.cambiarConductual("  Avance  "));
    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardar();
    });

    expect(guardarMock).toHaveBeenCalledWith({
      estudiante_id: 11,
      asignacion_id: 44,
      periodo: 2,
      conductual: "Avance",
      cognitivo: "",
      lenguaje: "",
    });
    expect(respuesta).toEqual({
      estado: "exito",
      dimensionesDiligenciadas: 1,
    });
    expect(result.current.estadoGuardado.guardado).toBe(true);
    expect(result.current.estadoGuardado.modificado).toBe(false);
  });

  it("no envía un formulario vacío", async () => {
    obtenerMock.mockResolvedValue(null);
    const { result } = renderHook(() =>
      useObservacionEstudiante(crearPropiedades()),
    );
    await waitFor(() => expect(result.current.estadoGuardado.cargando).toBe(false));

    await expect(result.current.guardar()).resolves.toEqual({ estado: "vacio" });
    expect(guardarMock).not.toHaveBeenCalled();
  });

  it("devuelve el detalle original cuando falla el guardado", async () => {
    const error = Object.assign(new Error("No disponible"), {
      response: { data: { detail: "Periodo cerrado" } },
    });
    obtenerMock.mockResolvedValue(null);
    guardarMock.mockRejectedValue(error);
    const { result } = renderHook(() =>
      useObservacionEstudiante(crearPropiedades()),
    );
    await waitFor(() => expect(result.current.estadoGuardado.cargando).toBe(false));
    act(() => result.current.cambiarCognitivo("Avance"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardar();
    });

    expect(respuesta).toEqual({
      estado: "error",
      error,
      detalle: "Periodo cerrado",
    });
    expect(result.current.guardando).toBe(false);
    expect(result.current.estadoGuardado.modificado).toBe(true);
  });
});
