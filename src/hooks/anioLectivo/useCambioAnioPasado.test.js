import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cerrarAnioLectivo: vi.fn(),
  reabrirAnioLectivo: vi.fn(),
}));

vi.mock("../../services/aniosLectivosApi", () => ({
  cerrarAnioLectivo: mocks.cerrarAnioLectivo,
  reabrirAnioLectivo: mocks.reabrirAnioLectivo,
}));

import useCambioAnioPasado from "./useCambioAnioPasado";

const CERRADO = { id: 2, anio: 2026, estado: "cerrado" };
const REABIERTO = { id: 2, anio: 2026, estado: "reabierto" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.reabrirAnioLectivo.mockResolvedValue({ anio_lectivo: REABIERTO });
  mocks.cerrarAnioLectivo.mockResolvedValue({ anio_lectivo: CERRADO });
});

async function confirmar(result) {
  let respuesta;
  await act(async () => {
    respuesta = await result.current.confirmar();
  });
  return respuesta;
}

describe("useCambioAnioPasado", () => {
  it("abre la confirmación de un año y la cancela sin llamar al backend", () => {
    const { result } = renderHook(() => useCambioAnioPasado());

    act(() => result.current.iniciar(CERRADO));
    expect(result.current.anioEnCambio).toEqual(CERRADO);

    act(() => result.current.setConfirmacion("2026"));
    act(() => result.current.cancelar());

    expect(result.current.anioEnCambio).toBe(null);
    expect(result.current.confirmacion).toBe("");
    expect(mocks.reabrirAnioLectivo).not.toHaveBeenCalled();
  });

  it("no confirma si el año escrito no coincide", async () => {
    const { result } = renderHook(() => useCambioAnioPasado());
    act(() => result.current.iniciar(CERRADO));
    act(() => result.current.setConfirmacion("2027"));

    const respuesta = await confirmar(result);

    expect(respuesta.estado).toBe("validacion");
    expect(mocks.reabrirAnioLectivo).not.toHaveBeenCalled();
  });

  it("reabre un año cerrado, avisa para recargar los años y deja un mensaje", async () => {
    const onCambiado = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useCambioAnioPasado({ onCambiado }));
    act(() => result.current.iniciar(CERRADO));
    act(() => result.current.setConfirmacion("2026"));

    const respuesta = await confirmar(result);

    expect(respuesta.estado).toBe("exito");
    expect(mocks.reabrirAnioLectivo).toHaveBeenCalledWith(2, 2026);
    expect(mocks.cerrarAnioLectivo).not.toHaveBeenCalled();
    expect(onCambiado).toHaveBeenCalledWith({ anio_lectivo: REABIERTO });
    expect(result.current.mensaje).toBe(
      "2026 quedó reabierto. Para corregirlo, elígelo en el selector de año.",
    );
    expect(result.current.anioEnCambio).toBe(null);
    expect(result.current.confirmacion).toBe("");
  });

  it("vuelve a cerrar un año reabierto", async () => {
    const { result } = renderHook(() => useCambioAnioPasado());
    act(() => result.current.iniciar(REABIERTO));
    act(() => result.current.setConfirmacion("2026"));

    await confirmar(result);

    expect(mocks.cerrarAnioLectivo).toHaveBeenCalledWith(2, 2026);
    expect(mocks.reabrirAnioLectivo).not.toHaveBeenCalled();
    expect(result.current.mensaje).toBe("2026 quedó cerrado otra vez.");
  });

  it("muestra tal cual el rechazo del backend y conserva la confirmación abierta", async () => {
    mocks.reabrirAnioLectivo.mockRejectedValue({
      response: { data: { detail: "Ya está reabierto el año 2025. Ciérralo antes de reabrir otro." } },
    });
    const { result } = renderHook(() => useCambioAnioPasado());
    act(() => result.current.iniciar(CERRADO));
    act(() => result.current.setConfirmacion("2026"));

    const respuesta = await confirmar(result);

    expect(respuesta.estado).toBe("error");
    expect(result.current.error).toBe(
      "Ya está reabierto el año 2025. Ciérralo antes de reabrir otro.",
    );
    expect(result.current.mensaje).toBe("");
    expect(result.current.anioEnCambio).toEqual(CERRADO);
    expect(result.current.guardando).toBe(false);
  });

  it("si el cambio salió bien pero falla la recarga de años, no lo presenta como fallido", async () => {
    const onCambiado = vi.fn().mockRejectedValue(new Error("red"));
    const { result } = renderHook(() => useCambioAnioPasado({ onCambiado }));
    act(() => result.current.iniciar(CERRADO));
    act(() => result.current.setConfirmacion("2026"));

    const respuesta = await confirmar(result);

    expect(respuesta.estado).toBe("exito");
    expect(result.current.mensaje).toBe(
      "2026 quedó reabierto. Para corregirlo, elígelo en el selector de año.",
    );
    expect(result.current.error).toBe(
      "No se pudo actualizar la lista de años. Recarga la página.",
    );
  });
});
