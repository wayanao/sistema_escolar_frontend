import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { actualizarMock, crearMock, obtenerMock } = vi.hoisted(() => ({
  actualizarMock: vi.fn(),
  crearMock: vi.fn(),
  obtenerMock: vi.fn(),
}));

vi.mock("../../services/estudiantesObservadorApi", () => ({
  actualizarEstudiante: actualizarMock,
  crearEstudiante: crearMock,
  obtenerEstudiante: obtenerMock,
}));

import useFormularioEstudianteAdmin from "./useFormularioEstudianteAdmin";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useFormularioEstudianteAdmin", () => {
  it("valida los campos obligatorios antes de enviar", async () => {
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    await expect(result.current.guardarEstudiante()).resolves.toEqual({
      estado: "validacion",
    });
    expect(crearMock).not.toHaveBeenCalled();
  });

  it("crea con strings vacíos normalizados, reinicia y solicita recarga", async () => {
    const recargar = vi.fn();
    crearMock.mockResolvedValue({ id: 11 });
    const { result } = renderHook(() =>
      useFormularioEstudianteAdmin({ recargar }),
    );

    act(() => {
      result.current.alternarFormulario();
      result.current.setEstudianteData((actual) => ({
        ...actual,
        nombre: "Ana",
        apellido: "Rojas",
        curso_id: "4",
        email: "",
      }));
    });

    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardarEstudiante();
    });

    expect(respuesta).toEqual({ estado: "exito", modo: "creacion" });
    expect(crearMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: "Ana",
        apellido: "Rojas",
        curso_id: "4",
        email: null,
      }),
    );
    expect(result.current.showForm).toBe(false);
    expect(result.current.estudianteData.nombre).toBe("");
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it("permite dirigir únicamente el alta a otro contrato", async () => {
    const crearEnPreparacion = vi.fn().mockResolvedValue({ id: 30 });
    const { result } = renderHook(() =>
      useFormularioEstudianteAdmin({ crearEstudianteFn: crearEnPreparacion }),
    );

    act(() => {
      result.current.setEstudianteData((actual) => ({
        ...actual,
        nombre: "Carla",
        apellido: "Gómez",
        curso_id: "50",
      }));
    });

    await act(async () => result.current.guardarEstudiante());

    expect(crearEnPreparacion).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Carla", curso_id: "50" }),
    );
    expect(crearMock).not.toHaveBeenCalled();
  });

  it("carga la edición, adapta nulls y actualiza el identificador vigente", async () => {
    obtenerMock.mockResolvedValue({
      id: 12,
      estado: "activo",
      anio_escolar: 2026,
      nombre: "Luis",
      apellido: "Pardo",
      curso_id: 4,
      email: null,
    });
    actualizarMock.mockResolvedValue({ id: 12 });
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    await act(async () => {
      await result.current.cargarEstudianteAEditar(12);
    });

    expect(result.current.estudianteData.email).toBe("");
    expect(result.current.estudianteData.id).toBeUndefined();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardarEstudiante();
    });

    expect(respuesta).toEqual({ estado: "exito", modo: "edicion" });
    expect(actualizarMock).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ email: null }),
    );
  });

  it("conserva el borrador nuevo al ocultar con el botón superior", () => {
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    act(() => result.current.alternarFormulario());
    act(() => {
      result.current.setEstudianteData((actual) => ({
        ...actual,
        nombre: "Borrador",
      }));
    });
    act(() => result.current.alternarFormulario());
    act(() => result.current.alternarFormulario());

    expect(result.current.estudianteData.nombre).toBe("Borrador");
  });

  it("propaga errores de carga y guardado como resultados", async () => {
    const errorCarga = new Error("No disponible");
    obtenerMock.mockRejectedValue(errorCarga);
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    await expect(result.current.cargarEstudianteAEditar(12)).resolves.toEqual({
      estado: "error",
      error: errorCarga,
    });
  });
});

describe("useFormularioEstudianteAdmin: guardando", () => {
  function conDatosCompletos(result) {
    act(() => {
      result.current.alternarFormulario();
      result.current.setEstudianteData((actual) => ({
        ...actual,
        nombre: "Ana",
        apellido: "Rojas",
        curso_id: "4",
      }));
    });
  }

  it("avisa que está guardando mientras espera al servidor", async () => {
    let resolver;
    crearMock.mockReturnValue(new Promise((resolve) => {
      resolver = resolve;
    }));
    const { result } = renderHook(() => useFormularioEstudianteAdmin());
    conDatosCompletos(result);
    expect(result.current.guardando).toBe(false);

    let guardado;
    act(() => {
      guardado = result.current.guardarEstudiante();
    });
    expect(result.current.guardando).toBe(true);

    await act(async () => {
      resolver({ id: 11 });
      await guardado;
    });
    expect(result.current.guardando).toBe(false);
  });

  it("deja de guardar también si el servidor rechaza", async () => {
    crearMock.mockRejectedValue(new Error("sin red"));
    const { result } = renderHook(() => useFormularioEstudianteAdmin());
    conDatosCompletos(result);

    await act(async () => {
      await result.current.guardarEstudiante();
    });

    expect(result.current.guardando).toBe(false);
  });

  it("la validación no marca que está guardando", async () => {
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    await act(async () => {
      await result.current.guardarEstudiante();
    });

    expect(result.current.guardando).toBe(false);
  });
});
