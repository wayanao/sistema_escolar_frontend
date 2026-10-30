import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerEstadoTenant: vi.fn(),
}));

vi.mock("../../services/autenticacionApi", () => ({
  obtenerEstadoTenant: mocks.obtenerEstadoTenant,
}));

import useUsoEntrevistaAdmision from "./useUsoEntrevistaAdmision";

const ESTADO = { estado: "activo", mostrar_aviso: false, mensaje: "" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUsoEntrevistaAdmision", () => {
  it("mientras no sabe responde null, y después lo que dice el backend", async () => {
    mocks.obtenerEstadoTenant.mockResolvedValue({ ...ESTADO, usa_entrevista_admision: false });

    const { result } = renderHook(() => useUsoEntrevistaAdmision());

    expect(result.current).toBe(null);
    await waitFor(() => expect(result.current).toBe(false));
    expect(mocks.obtenerEstadoTenant).toHaveBeenCalledTimes(1);
  });

  it("con un colegio que usa la entrevista responde true", async () => {
    mocks.obtenerEstadoTenant.mockResolvedValue({ ...ESTADO, usa_entrevista_admision: true });

    const { result } = renderHook(() => useUsoEntrevistaAdmision());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("si la consulta falla, sigue con la entrevista: lo de siempre", async () => {
    mocks.obtenerEstadoTenant.mockRejectedValue(new Error("red"));

    const { result } = renderHook(() => useUsoEntrevistaAdmision());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("deshabilitado no pide nada", () => {
    const { result } = renderHook(() => useUsoEntrevistaAdmision({ habilitado: false }));

    expect(result.current).toBe(null);
    expect(mocks.obtenerEstadoTenant).not.toHaveBeenCalled();
  });

  it("pide al habilitarse y vuelve a null al deshabilitarse", async () => {
    mocks.obtenerEstadoTenant.mockResolvedValue({ ...ESTADO, usa_entrevista_admision: false });

    const { result, rerender } = renderHook(
      ({ habilitado }) => useUsoEntrevistaAdmision({ habilitado }),
      { initialProps: { habilitado: false } },
    );
    rerender({ habilitado: true });
    await waitFor(() => expect(result.current).toBe(false));

    rerender({ habilitado: false });
    expect(result.current).toBe(null);
  });
});
