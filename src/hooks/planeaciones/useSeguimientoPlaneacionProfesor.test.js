import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  alternarObservacionesMock,
  reiniciarObservacionesMock,
  propiedadesObservaciones,
} = vi.hoisted(() => ({
  alternarObservacionesMock: vi.fn(),
  reiniciarObservacionesMock: vi.fn(),
  propiedadesObservaciones: { current: null },
}));

vi.mock("./useObservacionesPlaneacionProfesor", () => ({
  default: vi.fn((props) => {
    propiedadesObservaciones.current = props;
    return {
      observaciones: [],
      abiertas: false,
      cargando: false,
      error: "",
      alternarObservaciones: alternarObservacionesMock,
      reiniciarObservaciones: reiniciarObservacionesMock,
    };
  }),
}));

import useSeguimientoPlaneacionProfesor from "./useSeguimientoPlaneacionProfesor";

beforeEach(() => {
  vi.clearAllMocks();
  propiedadesObservaciones.current = null;
});

function crearPropiedades(overrides = {}) {
  return {
    planActualId: 91,
    actualizarPlanHistorial: vi.fn(),
    searchParams: new URLSearchParams(),
    setSearchParams: vi.fn(),
    ...overrides,
  };
}

describe("useSeguimientoPlaneacionProfesor", () => {
  it("normaliza el seguimiento y reinicia observaciones al cambiar de plan", () => {
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useSeguimientoPlaneacionProfesor(props),
    );

    act(() => {
      result.current.actualizarSeguimientoDesdePlan({
        id: 91,
        estado_revision: "revisado",
        version_revision: "3",
        observaciones_no_vistas: "2",
      });
    });

    expect(reiniciarObservacionesMock).toHaveBeenCalledTimes(1);
    expect(result.current.seguimiento).toMatchObject({
      estado_revision: "revisado",
      version_revision: 3,
      observaciones_no_vistas: 2,
    });
  });

  it("sincroniza las lecturas con el seguimiento y el historial", () => {
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useSeguimientoPlaneacionProfesor(props),
    );

    act(() => {
      result.current.actualizarSeguimientoDesdePlan({
        id: 91,
        observaciones_no_vistas: 2,
      });
    });
    act(() => {
      propiedadesObservaciones.current.onLecturasActualizadas({
        planId: 91,
        pendientes: 0,
      });
    });

    expect(result.current.seguimiento.observaciones_no_vistas).toBe(0);
    expect(props.actualizarPlanHistorial).toHaveBeenCalledWith(91, {
      observaciones_no_vistas: 0,
    });
  });

  it("abre una observación solicitada por URL y consume el parámetro", async () => {
    const props = crearPropiedades({
      searchParams: new URLSearchParams(
        "plan_id=91&observaciones=1&fecha=2026-07-29",
      ),
    });

    renderHook(() => useSeguimientoPlaneacionProfesor(props));

    await waitFor(() =>
      expect(alternarObservacionesMock).toHaveBeenCalledTimes(1),
    );
    expect(props.setSearchParams).toHaveBeenCalledTimes(1);
    const [siguientes, opciones] = props.setSearchParams.mock.calls[0];
    expect(siguientes.get("observaciones")).toBeNull();
    expect(siguientes.get("fecha")).toBe("2026-07-29");
    expect(opciones).toEqual({ replace: true });
  });
});
