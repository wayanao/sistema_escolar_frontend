import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheMock, serviceMock } = vi.hoisted(() => ({
  cacheMock: vi.fn(),
  serviceMock: {
    deleteLogo: vi.fn(),
    getBranding: vi.fn(),
    updateBranding: vi.fn(),
    uploadLogo: vi.fn(),
  },
}));

vi.mock("../../services/printingService", () => serviceMock);
vi.mock("./usePrintConfig", () => ({ invalidatePrintCache: cacheMock }));

import useIdentidadInstitucional from "./useIdentidadInstitucional";

const branding = {
  nombre_institucion: "Colegio Central",
  codigo_dane: "123",
  logo_principal_url: "/principal.png",
};

beforeEach(() => {
  vi.clearAllMocks();
  serviceMock.getBranding.mockResolvedValue(branding);
  serviceMock.updateBranding.mockImplementation((payload) =>
    Promise.resolve(payload));
  serviceMock.uploadLogo.mockResolvedValue({ url: "/nuevo.png" });
  serviceMock.deleteLogo.mockResolvedValue({ ok: true });
  vi.stubGlobal("confirm", vi.fn(() => true));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useIdentidadInstitucional", () => {
  it("carga, normaliza el formulario y guarda el payload vigente", async () => {
    const { result } = renderHook(() => useIdentidadInstitucional());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.cambiarCampo("codigo_dane", "10a20-30"));
    expect(result.current.branding.codigo_dane).toBe("102030");

    await act(async () => {
      await result.current.guardar();
    });

    expect(serviceMock.updateBranding).toHaveBeenCalledWith({
      ...branding,
      codigo_dane: "102030",
    });
    expect(cacheMock).toHaveBeenCalledTimes(1);
    expect(result.current.mensaje).toEqual({
      tipo: "ok",
      texto: "Datos guardados correctamente.",
    });
  });

  it("conserva el detalle del backend cuando falla el guardado", async () => {
    const error = { response: { data: { detail: "Nombre requerido" } } };
    serviceMock.updateBranding.mockRejectedValue(error);
    const { result } = renderHook(() => useIdentidadInstitucional());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.guardar();
    });

    expect(result.current.guardando).toBe(false);
    expect(result.current.mensaje.texto).toBe("Error al guardar: Nombre requerido");
    expect(cacheMock).not.toHaveBeenCalled();
  });

  it("sube y elimina logos, respetando cancelación e invalidación", async () => {
    const { result } = renderHook(() => useIdentidadInstitucional());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const archivo = new File(["logo"], "logo.png", { type: "image/png" });

    await act(async () => {
      await result.current.subirLogo(archivo, "principal");
    });
    expect(serviceMock.uploadLogo).toHaveBeenCalledWith(archivo, "principal");
    expect(result.current.branding.logo_principal_url).toBe("/nuevo.png");

    confirm.mockReturnValueOnce(false);
    await act(async () => {
      await result.current.eliminarLogo("principal");
    });
    expect(serviceMock.deleteLogo).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    await act(async () => {
      await result.current.eliminarLogo("principal");
    });
    expect(serviceMock.deleteLogo).toHaveBeenCalledWith("principal");
    expect(result.current.branding.logo_principal_url).toBeNull();
    expect(cacheMock).toHaveBeenCalledTimes(2);
  });
});
