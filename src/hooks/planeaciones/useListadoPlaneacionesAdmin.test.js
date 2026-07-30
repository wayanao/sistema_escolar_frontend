import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarPlaneacionesMock, listarProfesoresMock } = vi.hoisted(() => ({
  listarPlaneacionesMock: vi.fn(),
  listarProfesoresMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  listarPlaneacionesAdmin: listarPlaneacionesMock,
  listarProfesoresPlaneaciones: listarProfesoresMock,
}));

import useListadoPlaneacionesAdmin from "./useListadoPlaneacionesAdmin";

beforeEach(() => {
  vi.clearAllMocks();
  listarProfesoresMock.mockResolvedValue([
    { id: 7, nombre: "Ana", apellido: "Ruiz" },
  ]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function crearPropiedades(query = "") {
  return {
    searchParams: new URLSearchParams(query),
    setSearchParams: vi.fn(),
  };
}

describe("useListadoPlaneacionesAdmin", () => {
  it("carga la página solicitada, profesores y contador pendiente", async () => {
    listarPlaneacionesMock.mockImplementation((params) =>
      Promise.resolve(
        params.limit === 1
          ? { items: [], total: 4 }
          : { items: [{ id: 91 }], total: 25 },
      ),
    );
    const props = crearPropiedades(
      "vista=programadas&estado=pendiente&pagina=2&profesor_id=7&busqueda=mate",
    );

    const { result } = renderHook(() =>
      useListadoPlaneacionesAdmin(props),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));
    await waitFor(() => expect(result.current.conteoPendientes).toBe(4));

    expect(listarProfesoresMock).toHaveBeenCalledTimes(1);
    expect(result.current.profesores).toHaveLength(1);
    expect(listarPlaneacionesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 12,
        offset: 12,
        profesor_id: "7",
        busqueda: "mate",
        estado_revision: "pendiente",
        fecha_desde: expect.any(String),
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.planes).toEqual([{ id: 91 }]);
    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.desde).toBe(13);
    expect(result.current.hasta).toBe(24);
  });

  it("controla selección, filtros y reinicio de la bandeja", async () => {
    listarPlaneacionesMock.mockResolvedValue({ items: [], total: 0 });
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useListadoPlaneacionesAdmin(props),
    );

    expect(result.current.seleccionCompleta).toBe(false);

    act(() => {
      result.current.cambiarVista("todas");
      result.current.cambiarEstado("revisado");
      result.current.cambiarProfesor("9");
    });

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.seleccionCompleta).toBe(true);
    expect(result.current.filtros.profesor_id).toBe("9");
    expect(result.current.filtrosAplicados.profesor_id).toBe("9");
    expect(result.current.pagina).toBe(1);

    act(() => result.current.limpiarFiltros());

    expect(result.current.vista).toBe("");
    expect(result.current.estado).toBe("");
    expect(result.current.filtros).toEqual({
      profesor_id: "",
      busqueda: "",
    });
  });

  it("aplica la búsqueda solo desde dos caracteres y después del debounce", async () => {
    listarPlaneacionesMock.mockResolvedValue({ items: [], total: 0 });
    const props = crearPropiedades("vista=todas&estado=revisado");
    const { result } = renderHook(() =>
      useListadoPlaneacionesAdmin(props),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));
    vi.useFakeTimers();

    act(() => result.current.cambiarBusqueda("m"));
    expect(result.current.filtros.busqueda).toBe("m");
    expect(result.current.filtrosAplicados.busqueda).toBe("");

    act(() => result.current.cambiarBusqueda("mate"));
    act(() => vi.advanceTimersByTime(119));
    expect(result.current.filtrosAplicados.busqueda).toBe("");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.filtrosAplicados.busqueda).toBe("mate");
  });

  it("expone un error controlado cuando falla la consulta principal", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    listarPlaneacionesMock.mockRejectedValue(new Error("sin conexión"));
    const props = crearPropiedades("vista=todas&estado=revisado");

    const { result } = renderHook(() =>
      useListadoPlaneacionesAdmin(props),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.error).toBe(
      "No fue posible cargar las planeaciones. Intenta nuevamente.",
    );
    expect(result.current.planes).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});
