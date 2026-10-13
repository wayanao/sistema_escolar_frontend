import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SIN_PARAMETROS_DE_ANIO } from "../../utils/anioLectivo";
import AnioLectivoProvider from "./AnioLectivoProvider";
import useAnioLectivo from "./useAnioLectivo";

const mocks = vi.hoisted(() => ({
  listarAniosLectivos: vi.fn(),
}));

vi.mock("../../services/aniosLectivosApi", () => ({
  listarAniosLectivos: mocks.listarAniosLectivos,
}));

const ANIO_2027 = { id: 2, anio: 2027, estado: "preparacion" };
const ANIO_2026 = { id: 1, anio: 2026, estado: "activo" };

function renderConProveedor() {
  return renderHook(() => useAnioLectivo(), { wrapper: AnioLectivoProvider });
}

async function renderConDosAnios() {
  mocks.listarAniosLectivos.mockResolvedValue([ANIO_2027, ANIO_2026]);
  const resultado = renderConProveedor();
  await waitFor(() => expect(resultado.result.current.anios).toHaveLength(2));
  return resultado;
}

describe("AnioLectivoProvider y useAnioLectivo", () => {
  beforeEach(() => {
    mocks.listarAniosLectivos.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carga los años una sola vez y mira el activo por defecto, sin parámetros", async () => {
    mocks.listarAniosLectivos.mockResolvedValue([ANIO_2027, ANIO_2026]);

    const { result, rerender } = renderConProveedor();

    // Antes de la respuesta, el comportamiento de hoy.
    expect(result.current.anios).toEqual([]);
    expect(result.current.hayVariosAnios).toBe(false);
    expect(result.current.parametros).toBe(SIN_PARAMETROS_DE_ANIO);

    await waitFor(() => expect(result.current.anios).toEqual([ANIO_2027, ANIO_2026]));
    expect(result.current.anioActivo).toEqual(ANIO_2026);
    expect(result.current.anioSeleccionado).toEqual(ANIO_2026);
    expect(result.current.anioSeleccionadoId).toBeNull();
    expect(result.current.hayVariosAnios).toBe(true);
    expect(result.current.parametros).toBe(SIN_PARAMETROS_DE_ANIO);

    rerender();
    expect(mocks.listarAniosLectivos).toHaveBeenCalledTimes(1);
    expect(mocks.listarAniosLectivos).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  });

  it("al elegir otro año manda solo anio_lectivo_id, y al volver no manda nada", async () => {
    const { result } = await renderConDosAnios();

    act(() => result.current.seleccionarAnio(2));

    expect(result.current.anioSeleccionadoId).toBe(2);
    expect(result.current.anioSeleccionado).toEqual(ANIO_2027);
    expect(result.current.parametros).toEqual({ anio_lectivo_id: 2 });

    act(() => result.current.volverAlActivo());

    expect(result.current.anioSeleccionadoId).toBeNull();
    expect(result.current.anioSeleccionado).toEqual(ANIO_2026);
    expect(result.current.parametros).toBe(SIN_PARAMETROS_DE_ANIO);
  });

  it("elegir el año activo es lo mismo que no elegir", async () => {
    const { result } = await renderConDosAnios();

    act(() => result.current.seleccionarAnio(2));
    act(() => result.current.seleccionarAnio(1));

    expect(result.current.anioSeleccionadoId).toBeNull();
    expect(result.current.parametros).toBe(SIN_PARAMETROS_DE_ANIO);
  });

  it("acepta el id como texto e ignora un año que no está en la lista", async () => {
    const { result } = await renderConDosAnios();

    act(() => result.current.seleccionarAnio("2"));
    expect(result.current.anioSeleccionadoId).toBe(2);

    act(() => result.current.seleccionarAnio(99));
    expect(result.current.anioSeleccionadoId).toBe(2);
  });

  it("recarga la lista y puede dejar seleccionado el año recién creado", async () => {
    mocks.listarAniosLectivos
      .mockResolvedValueOnce([ANIO_2026])
      .mockResolvedValueOnce([ANIO_2027, ANIO_2026]);
    const { result } = renderConProveedor();
    await waitFor(() => expect(result.current.anios).toEqual([ANIO_2026]));

    await act(async () => {
      await result.current.recargarAnios({ seleccionarId: ANIO_2027.id });
    });

    expect(mocks.listarAniosLectivos).toHaveBeenNthCalledWith(2);
    expect(result.current.anios).toEqual([ANIO_2027, ANIO_2026]);
    expect(result.current.anioSeleccionado).toEqual(ANIO_2027);
    expect(result.current.anioSeleccionadoId).toBe(ANIO_2027.id);
    expect(result.current.parametros).toEqual({ anio_lectivo_id: ANIO_2027.id });
  });

  it("comparte qué se puede hacer en el año que se mira", async () => {
    mocks.listarAniosLectivos.mockResolvedValue([
      ANIO_2027,
      ANIO_2026,
      { id: 3, anio: 2025, estado: "cerrado" },
    ]);
    const { result } = renderConProveedor();
    await waitFor(() => expect(result.current.anios).toHaveLength(3));

    expect(result.current.permisos).toEqual({ esAnioActivo: true, puedeEditar: true });

    act(() => result.current.seleccionarAnio(2));
    expect(result.current.permisos).toEqual({ esAnioActivo: false, puedeEditar: true });

    act(() => result.current.seleccionarAnio(3));
    expect(result.current.permisos).toEqual({ esAnioActivo: false, puedeEditar: false });
  });

  it("los parámetros conservan su identidad mientras no cambia el año", async () => {
    const { result, rerender } = await renderConDosAnios();

    act(() => result.current.seleccionarAnio(2));
    const parametros = result.current.parametros;
    rerender();

    expect(result.current.parametros).toBe(parametros);
  });

  it("avisa que está cargando hasta que llega la lista", async () => {
    mocks.listarAniosLectivos.mockResolvedValue([ANIO_2027, ANIO_2026]);

    const { result } = renderConProveedor();

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.anios).toHaveLength(2);
  });

  it("si la lista no llega, todo sigue como hoy", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.listarAniosLectivos.mockRejectedValue(new Error("sin red"));

    const { result } = renderConProveedor();

    await waitFor(() => expect(console.error).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.anios).toEqual([]);
    expect(result.current.anioActivo).toBeNull();
    expect(result.current.hayVariosAnios).toBe(false);
    expect(result.current.parametros).toBe(SIN_PARAMETROS_DE_ANIO);
  });

  it("al desmontarse corta la petición y descarta una respuesta tardía", async () => {
    let resolver;
    mocks.listarAniosLectivos.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );

    const { result, unmount } = renderConProveedor();
    const { signal } = mocks.listarAniosLectivos.mock.calls[0][0];
    unmount();

    expect(signal.aborted).toBe(true);
    await act(async () => resolver([ANIO_2027, ANIO_2026]));
    expect(result.current.anios).toEqual([]);
  });

  it("fuera del proveedor devuelve el comportamiento de hoy, sin pedir nada", () => {
    const { result } = renderHook(() => useAnioLectivo());

    expect(result.current.anios).toEqual([]);
    expect(result.current.anioActivo).toBeNull();
    expect(result.current.anioSeleccionadoId).toBeNull();
    expect(result.current.hayVariosAnios).toBe(false);
    expect(result.current.cargando).toBe(false);
    expect(result.current.parametros).toBe(SIN_PARAMETROS_DE_ANIO);
    expect(result.current.permisos).toEqual({ esAnioActivo: true, puedeEditar: true });
    expect(() => result.current.seleccionarAnio(1)).not.toThrow();
    expect(() => result.current.volverAlActivo()).not.toThrow();
    expect(result.current.recargarAnios).toEqual(expect.any(Function));
    expect(mocks.listarAniosLectivos).not.toHaveBeenCalled();
  });
});
