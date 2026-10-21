import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listarCursosMock, listarEstudiantesMock } = vi.hoisted(() => ({
  listarCursosMock: vi.fn(),
  listarEstudiantesMock: vi.fn(),
}));

vi.mock("../../services/estudiantesObservadorApi", () => ({
  listarCursosEstudiantes: listarCursosMock,
  listarEstudiantes: listarEstudiantesMock,
}));

import useListadoEstudiantesAdmin from "./useListadoEstudiantesAdmin";

function crearPendiente() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  listarCursosMock.mockResolvedValue([{ id: 4, nombre: "5A" }]);
});

describe("useListadoEstudiantesAdmin", () => {
  it("carga estudiantes activos y cursos, y aplica la búsqueda local", async () => {
    listarEstudiantesMock.mockResolvedValue([
      { id: 11, nombre: "Ana", apellido: "Rojas" },
      { id: 12, nombre: "Luis", apellido: "Pardo" },
    ]);

    const { result } = renderHook(() => useListadoEstudiantesAdmin());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Sin año elegido, las opciones van vacías: la petición es la de siempre
    // (lo prueban el servicio y la página).
    expect(listarEstudiantesMock).toHaveBeenCalledWith("activo", {});
    expect(listarCursosMock).toHaveBeenCalledWith({});
    expect(result.current.cursos).toEqual([{ id: 4, nombre: "5A" }]);

    act(() => result.current.setSearchTerm("pardo"));
    expect(result.current.estudiantesFiltrados).toEqual([
      { id: 12, nombre: "Luis", apellido: "Pardo" },
    ]);
  });

  it("una recarga silenciosa (después de guardar) no esconde la lista: avisa que actualiza", async () => {
    listarEstudiantesMock.mockResolvedValue([{ id: 11, nombre: "Ana", apellido: "Rojas" }]);
    const { result } = renderHook(() => useListadoEstudiantesAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.actualizando).toBe(false);

    const pendiente = crearPendiente();
    listarEstudiantesMock.mockReturnValueOnce(pendiente.promise);
    let recarga;
    act(() => {
      recarga = result.current.recargar({ silencioso: true });
    });

    expect(result.current.actualizando).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.estudiantes).toEqual([{ id: 11, nombre: "Ana", apellido: "Rojas" }]);

    await act(async () => {
      pendiente.resolve([
        { id: 11, nombre: "Ana", apellido: "Rojas" },
        { id: 30, nombre: "Carla", apellido: "Gómez" },
      ]);
      await recarga;
    });

    expect(result.current.actualizando).toBe(false);
    expect(result.current.estudiantes).toHaveLength(2);
  });

  it("recarga al cambiar el estado y descarta la respuesta anterior tardía", async () => {
    const activos = crearPendiente();
    const retirados = crearPendiente();
    listarEstudiantesMock
      .mockImplementationOnce(() => activos.promise)
      .mockImplementationOnce(() => retirados.promise);

    const { result } = renderHook(() => useListadoEstudiantesAdmin());
    await waitFor(() => expect(listarEstudiantesMock).toHaveBeenCalledTimes(1));

    act(() => result.current.setEstadoFiltro("retirado"));
    await waitFor(() => expect(listarEstudiantesMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      retirados.resolve([{ id: 20, nombre: "Sara", apellido: "Díaz" }]);
      await retirados.promise;
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      activos.resolve([{ id: 11, nombre: "Ana", apellido: "Rojas" }]);
      await activos.promise;
    });

    expect(result.current.estudiantes).toEqual([
      { id: 20, nombre: "Sara", apellido: "Díaz" },
    ]);
  });

  it("expone el error original y permite recargar", async () => {
    const error = new Error("Sin conexión");
    listarEstudiantesMock
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() => useListadoEstudiantesAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(error);

    await act(async () => {
      await result.current.recargar();
    });

    expect(result.current.error).toBeNull();
  });
});

describe("useListadoEstudiantesAdmin con un año elegido", () => {
  const parametrosAnio = { anio_lectivo_id: 2 };

  it("pide estudiantes y cursos de ese año, también al cambiar el estado", async () => {
    listarEstudiantesMock.mockResolvedValue([]);
    const { result } = renderHook(() => useListadoEstudiantesAdmin({ parametrosAnio }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(listarEstudiantesMock).toHaveBeenCalledWith("activo", { parametrosAnio });
    expect(listarCursosMock).toHaveBeenCalledWith({ parametrosAnio });

    act(() => result.current.setEstadoFiltro("todos"));
    await waitFor(() =>
      expect(listarEstudiantesMock).toHaveBeenLastCalledWith("todos", { parametrosAnio }),
    );
  });

  it("si cambia el año, vuelve a pedir con el año nuevo", async () => {
    listarEstudiantesMock.mockResolvedValue([]);
    const { result, rerender } = renderHook(
      ({ anio }) => useListadoEstudiantesAdmin({ parametrosAnio: anio }),
      { initialProps: { anio: parametrosAnio } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const otroAnio = { anio_lectivo_id: 3 };
    rerender({ anio: otroAnio });

    await waitFor(() =>
      expect(listarEstudiantesMock).toHaveBeenLastCalledWith("activo", {
        parametrosAnio: otroAnio,
      }),
    );
    expect(listarCursosMock).toHaveBeenLastCalledWith({ parametrosAnio: otroAnio });
  });
});
