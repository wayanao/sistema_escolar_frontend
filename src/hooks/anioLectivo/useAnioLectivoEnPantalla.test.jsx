import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnioLectivoProvider from "./AnioLectivoProvider";
import useAnioLectivoEnPantalla from "./useAnioLectivoEnPantalla";

const mocks = vi.hoisted(() => ({
  listarAniosLectivos: vi.fn(),
}));

vi.mock("../../services/aniosLectivosApi", () => ({
  listarAniosLectivos: mocks.listarAniosLectivos,
}));

// En el paso 4.1 ninguna pantalla sigue el año todavía (la lista real está
// vacía); aquí se prueba la regla con una pantalla inventada.
vi.mock("../../utils/anioLectivo", async (importOriginal) => ({
  ...(await importOriginal()),
  RUTAS_POR_ANIO: [{ ruta: "/admin/pantalla-del-anio" }],
}));

const ANIO_2027 = { id: 2, anio: 2027, estado: "preparacion" };
const ANIO_2026 = { id: 1, anio: 2026, estado: "activo" };

async function renderEnRuta(ruta, anios) {
  mocks.listarAniosLectivos.mockResolvedValue(anios);

  function Envoltorio({ children }) {
    return (
      <MemoryRouter initialEntries={[ruta]}>
        <AnioLectivoProvider>{children}</AnioLectivoProvider>
      </MemoryRouter>
    );
  }

  const resultado = renderHook(
    () => ({ pantalla: useAnioLectivoEnPantalla(), navegar: useNavigate() }),
    { wrapper: Envoltorio },
  );
  await waitFor(() => expect(mocks.listarAniosLectivos).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(resultado.result.current.pantalla.opciones).toHaveLength(anios.length));
  return resultado;
}

describe("useAnioLectivoEnPantalla", () => {
  beforeEach(() => {
    mocks.listarAniosLectivos.mockReset();
  });

  it("en una pantalla del año, con dos años, muestra el selector con el activo elegido", async () => {
    const { result } = await renderEnRuta("/admin/pantalla-del-anio", [ANIO_2027, ANIO_2026]);

    expect(result.current.pantalla.mostrarSelector).toBe(true);
    expect(result.current.pantalla.opciones).toEqual([
      { valor: 2, etiqueta: "2027 · En preparación" },
      { valor: 1, etiqueta: "2026 · Activo" },
    ]);
    expect(result.current.pantalla.anioSeleccionadoId).toBe(1);
    expect(result.current.pantalla.aviso).toBeNull();
  });

  it("con un solo año no hay selector ni aviso", async () => {
    const { result } = await renderEnRuta("/admin/pantalla-del-anio", [ANIO_2026]);

    expect(result.current.pantalla.mostrarSelector).toBe(false);
    expect(result.current.pantalla.aviso).toBeNull();
  });

  it("mirando otro año muestra el aviso, y al volver lo quita", async () => {
    const { result } = await renderEnRuta("/admin/pantalla-del-anio", [ANIO_2027, ANIO_2026]);

    act(() => result.current.pantalla.seleccionarAnio(2));

    expect(result.current.pantalla.anioSeleccionadoId).toBe(2);
    expect(result.current.pantalla.aviso).toEqual({
      mensaje: "Estás preparando el año 2027.",
      textoVolver: "Volver a 2026",
    });

    act(() => result.current.pantalla.volverAlActivo());

    expect(result.current.pantalla.anioSeleccionadoId).toBe(1);
    expect(result.current.pantalla.aviso).toBeNull();
  });

  it("en una pantalla que no sigue el año no hay selector ni aviso, y al volver el año sigue elegido", async () => {
    const { result } = await renderEnRuta("/admin/pantalla-del-anio", [ANIO_2027, ANIO_2026]);
    act(() => result.current.pantalla.seleccionarAnio(2));

    act(() => result.current.navegar("/admin/pagos"));

    expect(result.current.pantalla.mostrarSelector).toBe(false);
    expect(result.current.pantalla.aviso).toBeNull();

    act(() => result.current.navegar("/admin/pantalla-del-anio"));

    expect(result.current.pantalla.mostrarSelector).toBe(true);
    expect(result.current.pantalla.anioSeleccionadoId).toBe(2);
    expect(result.current.pantalla.aviso?.mensaje).toBe("Estás preparando el año 2027.");
  });
});
