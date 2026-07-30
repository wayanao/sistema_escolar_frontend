import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { eliminarImagenMock } = vi.hoisted(() => ({
  eliminarImagenMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  eliminarImagenPlaneacionAdmin: eliminarImagenMock,
}));

import useEliminacionImagenPlaneacionAdmin from "./useEliminacionImagenPlaneacionAdmin";

function crearPropiedades() {
  return {
    onImagenEliminada: vi.fn(),
    onMensaje: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.confirm = vi.fn(() => true);
});

describe("useEliminacionImagenPlaneacionAdmin", () => {
  it("respeta la cancelación del administrador", async () => {
    window.confirm.mockReturnValue(false);
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useEliminacionImagenPlaneacionAdmin(props),
    );

    await act(async () => {
      await result.current.eliminarImagen(91, "imagen1");
    });

    expect(window.confirm).toHaveBeenCalledWith(
      "¿Quieres borrar la evidencia de desarrollo cognitivo de esta planeación?",
    );
    expect(eliminarImagenMock).not.toHaveBeenCalled();
  });

  it("notifica la eliminación y limpia el estado de progreso", async () => {
    eliminarImagenMock.mockResolvedValue({});
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useEliminacionImagenPlaneacionAdmin(props),
    );

    await act(async () => {
      await result.current.eliminarImagen(91, "imagen2");
    });

    expect(eliminarImagenMock).toHaveBeenCalledWith(91, "imagen2");
    expect(props.onImagenEliminada).toHaveBeenCalledWith("imagen2");
    expect(props.onMensaje).toHaveBeenNthCalledWith(1, null);
    expect(props.onMensaje).toHaveBeenLastCalledWith({
      tono: "exito",
      texto: "La evidencia fue eliminada.",
    });
    expect(result.current.eliminandoImagen).toBe("");
  });

  it("conserva el detalle de error enviado por el backend", async () => {
    eliminarImagenMock.mockRejectedValue({
      response: { data: { detail: "La imagen ya fue eliminada." } },
    });
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useEliminacionImagenPlaneacionAdmin(props),
    );

    await act(async () => {
      await result.current.eliminarImagen(91, "imagen1");
    });

    expect(props.onImagenEliminada).not.toHaveBeenCalled();
    expect(props.onMensaje).toHaveBeenLastCalledWith({
      tono: "error",
      texto: "La imagen ya fue eliminada.",
    });
  });
});
