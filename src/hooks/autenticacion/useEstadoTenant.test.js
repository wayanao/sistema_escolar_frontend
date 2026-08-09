import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEstadoTenant } from "./useEstadoTenant";

const mocks = vi.hoisted(() => ({
  obtenerEstadoTenant: vi.fn(),
}));

vi.mock("../../services/autenticacionApi", () => ({
  obtenerEstadoTenant: mocks.obtenerEstadoTenant,
}));

describe("useEstadoTenant", () => {
  beforeEach(() => {
    mocks.obtenerEstadoTenant.mockReset();
  });

  it("carga una sola vez y conserva el objeto de aviso del backend", async () => {
    const aviso = {
      mostrar_aviso: true,
      mensaje: "El pago vence hoy.",
      estado: "en_mora",
    };
    mocks.obtenerEstadoTenant.mockResolvedValue(aviso);

    const { result, rerender } = renderHook(() => useEstadoTenant());

    expect(result.current).toBeNull();
    expect(mocks.obtenerEstadoTenant).toHaveBeenCalledWith();
    await waitFor(() => expect(result.current).toBe(aviso));

    rerender();
    expect(mocks.obtenerEstadoTenant).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["respuesta sin aviso", () => Promise.resolve({ mostrar_aviso: false })],
    ["error de red", () => Promise.reject(new Error("sin red"))],
  ])("permanece oculto ante %s", async (_caso, crearResultado) => {
    mocks.obtenerEstadoTenant.mockReturnValue(crearResultado());

    const { result } = renderHook(() => useEstadoTenant());

    await waitFor(() => expect(mocks.obtenerEstadoTenant).toHaveBeenCalledWith());
    expect(result.current).toBeNull();
  });

  it("descarta una respuesta que llega despues de desmontar", async () => {
    let resolver;
    const consulta = new Promise((resolve) => {
      resolver = resolve;
    });
    mocks.obtenerEstadoTenant.mockReturnValue(consulta);

    const { result, unmount } = renderHook(() => useEstadoTenant());
    unmount();

    await act(async () => {
      resolver({ mostrar_aviso: true, estado: "en_mora" });
      await consulta;
    });

    expect(result.current).toBeNull();
  });
});
