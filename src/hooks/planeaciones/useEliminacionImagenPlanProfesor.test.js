import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { eliminarImagenMock } = vi.hoisted(() => ({
  eliminarImagenMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  eliminarImagenPlanProfesor: eliminarImagenMock,
}));

import useEliminacionImagenPlanProfesor from "./useEliminacionImagenPlanProfesor";

function crearPropiedades(overrides = {}) {
  return {
    planActualId: 91,
    actualizarImagenGuardada: vi.fn(),
    actualizarPlanHistorial: vi.fn(),
    recargarPlaneacion: vi.fn().mockResolvedValue([]),
    marcarGuardado: vi.fn(),
    onMensaje: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.confirm = vi.fn(() => true);
  window.alert = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEliminacionImagenPlanProfesor", () => {
  it("respeta la cancelación antes de llamar al servicio", async () => {
    window.confirm.mockReturnValue(false);
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useEliminacionImagenPlanProfesor(props),
    );

    await act(async () => {
      await result.current("imagen1");
    });

    expect(window.confirm).toHaveBeenCalledWith(
      "¿Quieres borrar la evidencia de desarrollo cognitivo de este plan?",
    );
    expect(eliminarImagenMock).not.toHaveBeenCalled();
  });

  it("actualiza el formulario y el historial después de eliminar", async () => {
    eliminarImagenMock.mockResolvedValue({});
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useEliminacionImagenPlanProfesor(props),
    );

    await act(async () => {
      await result.current("imagen2");
    });

    expect(eliminarImagenMock).toHaveBeenCalledWith(91, "imagen2");
    expect(props.actualizarImagenGuardada).toHaveBeenCalledWith(
      "imagen2",
      null,
    );
    expect(props.actualizarPlanHistorial).toHaveBeenCalledWith(91, {
      imagen2: null,
    });
    expect(props.recargarPlaneacion).toHaveBeenCalledTimes(1);
    expect(props.marcarGuardado).toHaveBeenCalledWith(expect.any(String));
    expect(props.onMensaje).toHaveBeenCalledWith(
      "Imagen eliminada correctamente.",
    );
  });

  it("muestra el detalle del backend cuando la eliminación falla", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    eliminarImagenMock.mockRejectedValue({
      response: { data: { detail: "La evidencia ya no existe." } },
    });
    const { result } = renderHook(() =>
      useEliminacionImagenPlanProfesor(crearPropiedades()),
    );

    await act(async () => {
      await result.current("imagen1");
    });

    expect(window.alert).toHaveBeenCalledWith(
      "La evidencia ya no existe.",
    );
  });
});
