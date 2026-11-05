import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useMenuLateral } from "./useMenuLateral";

// matchMedia de mentira: responde según un ancho y un alto que la prueba puede
// cambiar, y avisa a quien escucha, como el navegador al girar una tablet.
function simularPantalla(anchoInicial, altoInicial = 900) {
  const medidas = { width: anchoInicial, height: altoInicial };
  const oyentes = new Set();
  window.matchMedia = (consulta) => {
    const [, lado, minimo] = consulta.match(/min-(width|height):\s*(\d+)px/);
    return {
      get matches() {
        return medidas[lado] >= Number(minimo);
      },
      addEventListener: (_evento, oyente) => oyentes.add(oyente),
      removeEventListener: (_evento, oyente) => oyentes.delete(oyente),
    };
  };
  return {
    cambiar(ancho, alto = medidas.height) {
      medidas.width = ancho;
      medidas.height = alto;
      oyentes.forEach((oyente) => oyente());
    },
    oyentes,
  };
}

describe("useMenuLateral", () => {
  const matchMediaOriginal = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    window.matchMedia = matchMediaOriginal;
  });

  it.each([
    [390, 844, "celular", false],
    [844, 390, "celular", false],
    [599, 960, "celular", false],
    // Tablets Android en vertical: miden menos que un iPad (2026-11-05).
    [600, 960, "riel", false],
    [720, 1152, "riel", false],
    [820, 1180, "riel", false],
    [1180, 820, "riel", true],
    [1440, 900, "abierto", true],
  ])("con %i x %i px muestra el menú %s", (ancho, alto, modo, puedeAlternar) => {
    simularPantalla(ancho, alto);

    const { result } = renderHook(() => useMenuLateral());

    expect(result.current.modo).toBe(modo);
    expect(result.current.puedeAlternar).toBe(puedeAlternar);
  });

  it("el riel que se desplaza (el del profesor) pide menos alto: una tablet acostada baja lo usa", () => {
    simularPantalla(1000, 510);

    const admin = renderHook(() => useMenuLateral());
    const profesor = renderHook(() => useMenuLateral({ rielDesplazable: true }));

    expect(admin.result.current.modo).toBe("celular");
    expect(profesor.result.current.modo).toBe("riel");
  });

  it("un celular acostado sigue siendo celular, también para el profesor", () => {
    simularPantalla(844, 390);

    const { result } = renderHook(() => useMenuLateral({ rielDesplazable: true }));

    expect(result.current.modo).toBe("celular");
  });

  it("sin matchMedia se comporta como en un PC", () => {
    window.matchMedia = undefined;

    const { result } = renderHook(() => useMenuLateral());

    expect(result.current.modo).toBe("abierto");
    expect(result.current.puedeAlternar).toBe(true);
  });

  it("al encoger guarda la preferencia, y al abrir otra vez la cambia", () => {
    simularPantalla(1440);
    const { result } = renderHook(() => useMenuLateral());

    act(() => result.current.alternarMenu());
    expect(result.current.modo).toBe("riel");
    expect(localStorage.getItem("menuLateral")).toBe("riel");

    act(() => result.current.alternarMenu());
    expect(result.current.modo).toBe("abierto");
    expect(localStorage.getItem("menuLateral")).toBe("abierto");
  });

  it("respeta la preferencia guardada desde portátil, pero no en tablet ni celular", () => {
    localStorage.setItem("menuLateral", "abierto");
    const pantalla = simularPantalla(1180, 820);
    const { result } = renderHook(() => useMenuLateral());

    expect(result.current.modo).toBe("abierto");

    act(() => pantalla.cambiar(820, 1180));
    expect(result.current.modo).toBe("riel");

    act(() => pantalla.cambiar(390, 844));
    expect(result.current.modo).toBe("celular");
  });

  it("ignora una preferencia guardada que no existe", () => {
    localStorage.setItem("menuLateral", "flotante");
    simularPantalla(1440);

    const { result } = renderHook(() => useMenuLateral());

    expect(result.current.modo).toBe("abierto");
  });

  it("deja de escuchar la pantalla al desmontarse", () => {
    const pantalla = simularPantalla(1440);
    const { unmount } = renderHook(() => useMenuLateral());
    expect(pantalla.oyentes.size).toBeGreaterThan(0);

    unmount();

    expect(pantalla.oyentes.size).toBe(0);
  });
});
