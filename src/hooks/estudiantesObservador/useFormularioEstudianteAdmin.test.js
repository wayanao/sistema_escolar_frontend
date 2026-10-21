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

    // Desde el 2026-10-21 devuelve también el número del estudiante, para
    // que la página baje hasta él.
    expect(respuesta).toEqual({ estado: "exito", modo: "creacion", id: 11 });
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

    expect(respuesta).toEqual({ estado: "exito", modo: "edicion", id: 12 });
    expect(actualizarMock).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ email: null }),
    );
  });

  // SISBÉN y lugar de residencia, paso S3: lo guardado va y vuelve igual, y
  // el cuerpo lleva siempre los ocho para que el backend los reemplace juntos.
  it("al editar, el SISBÉN y la residencia guardados vuelven iguales", async () => {
    obtenerMock.mockResolvedValue({
      id: 12,
      nombre: "Luis",
      apellido: "Pardo",
      curso_id: 4,
      sisben: true,
      sisben_grupo: "C",
      sisben_subgrupo: "C12",
      sisben_nivel: 1,
      barrio: "El Carmen",
      municipio: "Galapa",
      zona_residencia: "urbana",
      punto_referencia: null,
    });
    actualizarMock.mockResolvedValue({ id: 12 });
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    await act(async () => {
      await result.current.cargarEstudianteAEditar(12);
    });
    expect(result.current.estudianteData.sisben).toBe("si");

    await act(async () => {
      await result.current.guardarEstudiante();
    });

    expect(actualizarMock).toHaveBeenCalledWith(
      12,
      expect.objectContaining({
        sisben: true,
        sisben_grupo: "C",
        sisben_subgrupo: "C12",
        sisben_nivel: 1,
        barrio: "El Carmen",
        municipio: "Galapa",
        zona_residencia: "urbana",
        punto_referencia: null,
      }),
    );
  });

  it("al crear, el cuerpo lleva los ocho datos nuevos aunque estén vacíos", async () => {
    crearMock.mockResolvedValue({ id: 11 });
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    act(() => {
      result.current.setEstudianteData((actual) => ({
        ...actual,
        nombre: "Ana",
        apellido: "Rojas",
        curso_id: "4",
        sisben: "no",
        municipio: "Galapa",
      }));
    });
    await act(async () => {
      await result.current.guardarEstudiante();
    });

    expect(crearMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sisben: false,
        sisben_grupo: null,
        sisben_subgrupo: null,
        sisben_nivel: null,
        barrio: null,
        municipio: "Galapa",
        zona_residencia: null,
        punto_referencia: null,
      }),
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

// Entrevista de admisión, paso E5: matricular desde una admisión abre esta
// misma ficha con los datos del aspirante, y para un exalumno parte de lo que
// ya tiene. Guardar pasa siempre por `crearEstudianteFn` (matricular), nunca
// por editar.
describe("abrir la ficha con datos ya puestos (paso E5)", () => {
  it("abre en modo alta con los datos encima de la ficha vacía", async () => {
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    let respuesta;
    await act(async () => {
      respuesta = await result.current.abrirConDatos({ nombre: "Lina", curso_id: "20" });
    });

    expect(respuesta).toEqual({ estado: "exito" });
    expect(result.current.showForm).toBe(true);
    expect(result.current.editingId).toBeNull();
    expect(result.current.estudianteData.nombre).toBe("Lina");
    expect(result.current.estudianteData.curso_id).toBe("20");
    expect(result.current.estudianteData.direccion).toBe("");
    expect(obtenerMock).not.toHaveBeenCalled();
  });

  it("para un exalumno parte de su ficha y guarda por el alta indicada, no editando", async () => {
    obtenerMock.mockResolvedValue({
      id: 40,
      estado: "retirado",
      nombre: "Lina",
      apellido: "Díaz",
      direccion: "Calle 1",
      condicion_diagnostico: "TDAH",
      curso_id: 4,
      email: null,
    });
    const matricular = vi.fn().mockResolvedValue({ estudiante_id: 40 });
    const { result } = renderHook(() =>
      useFormularioEstudianteAdmin({ crearEstudianteFn: matricular }),
    );

    await act(async () => {
      await result.current.abrirConDatos({ curso_id: "20" }, { desdeEstudianteId: 40 });
    });

    expect(obtenerMock).toHaveBeenCalledWith(40);
    expect(result.current.editingId).toBeNull();
    expect(result.current.estudianteData.direccion).toBe("Calle 1");
    expect(result.current.estudianteData.condicion_diagnostico).toBe("TDAH");
    expect(result.current.estudianteData.curso_id).toBe("20");
    expect(result.current.estudianteData.id).toBeUndefined();
    expect(result.current.estudianteData.estado).toBeUndefined();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.guardarEstudiante();
    });

    expect(respuesta).toEqual({ estado: "exito", modo: "creacion" });
    expect(matricular).toHaveBeenCalledWith(
      expect.objectContaining({ direccion: "Calle 1", curso_id: "20", email: null }),
    );
    expect(actualizarMock).not.toHaveBeenCalled();
  });

  it("si no se puede leer la ficha del exalumno, no abre nada", async () => {
    const error = new Error("red");
    obtenerMock.mockRejectedValue(error);
    const { result } = renderHook(() => useFormularioEstudianteAdmin());

    let respuesta;
    await act(async () => {
      respuesta = await result.current.abrirConDatos({}, { desdeEstudianteId: 40 });
    });

    expect(respuesta).toEqual({ estado: "error", error });
    expect(result.current.showForm).toBe(false);
  });
});
