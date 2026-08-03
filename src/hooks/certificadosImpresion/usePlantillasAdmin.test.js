import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cacheMock, serviceMock } = vi.hoisted(() => ({
  cacheMock: vi.fn(),
  serviceMock: {
    activarPlantilla: vi.fn(),
    actualizarPlantilla: vi.fn(),
    duplicarPlantilla: vi.fn(),
    eliminarPlantilla: vi.fn(),
    listarPlantillas: vi.fn(),
  },
}));

vi.mock("../../services/printingService", () => serviceMock);
vi.mock("./usePrintConfig", () => ({ invalidatePrintCache: cacheMock }));

import usePlantillasAdmin from "./usePlantillasAdmin";

const personalizada = {
  id: 2,
  nombre: "Mi plantilla",
  activa: false,
  es_predefinida: false,
  config_json: { mostrar_pie: true },
};

beforeEach(() => {
  vi.clearAllMocks();
  serviceMock.listarPlantillas.mockResolvedValue([personalizada]);
  serviceMock.activarPlantilla.mockResolvedValue({ ok: true });
  serviceMock.actualizarPlantilla.mockResolvedValue({ ok: true });
  serviceMock.duplicarPlantilla.mockResolvedValue({ ok: true });
  serviceMock.eliminarPlantilla.mockResolvedValue({ ok: true });
  vi.stubGlobal("prompt", vi.fn(() => "Copia personalizada"));
  vi.stubGlobal("confirm", vi.fn(() => true));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("usePlantillasAdmin", () => {
  it("carga por tipo, selecciona y controla la configuración editable", async () => {
    const { result } = renderHook(() => usePlantillasAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(serviceMock.listarPlantillas).toHaveBeenCalledWith("boletin");
    act(() => result.current.seleccionarPlantilla(personalizada));
    act(() => result.current.actualizarCampoConfig("mostrar_pie", false));

    expect(result.current.seleccionada).toBe(personalizada);
    expect(result.current.config.mostrar_pie).toBe(false);
  });

  it("activa, invalida y recarga con el mensaje vigente", async () => {
    const { result } = renderHook(() => usePlantillasAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.activar(2);
    });

    expect(serviceMock.activarPlantilla).toHaveBeenCalledWith(2);
    expect(cacheMock).toHaveBeenCalledTimes(1);
    expect(serviceMock.listarPlantillas).toHaveBeenCalledTimes(2);
    expect(result.current.mensaje).toEqual({
      tipo: "ok",
      texto: "Plantilla activada.",
    });
  });

  it("respeta prompt y confirm al duplicar o eliminar", async () => {
    const { result } = renderHook(() => usePlantillasAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));

    prompt.mockReturnValueOnce("");
    await act(async () => {
      await result.current.duplicar(personalizada);
    });
    expect(serviceMock.duplicarPlantilla).not.toHaveBeenCalled();

    prompt.mockReturnValueOnce("Copia personalizada");
    await act(async () => {
      await result.current.duplicar(personalizada);
    });
    expect(serviceMock.duplicarPlantilla).toHaveBeenCalledWith(
      2,
      "Copia personalizada",
    );
    expect(cacheMock).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(false);
    await act(async () => {
      await result.current.eliminar(personalizada);
    });
    expect(serviceMock.eliminarPlantilla).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    await act(async () => {
      await result.current.eliminar(personalizada);
    });
    expect(serviceMock.eliminarPlantilla).toHaveBeenCalledWith(2);
    expect(cacheMock).toHaveBeenCalledTimes(1);
  });

  it("guarda el config controlado y conserva detalles de error", async () => {
    const { result } = renderHook(() => usePlantillasAdmin());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.seleccionarPlantilla(personalizada));
    act(() => result.current.actualizarCampoConfig("mostrar_pie", false));

    await act(async () => {
      await result.current.guardarConfig();
    });
    expect(serviceMock.actualizarPlantilla).toHaveBeenCalledWith(2, {
      config_json: { mostrar_pie: false },
    });
    expect(cacheMock).toHaveBeenCalledTimes(1);

    const error = { response: { data: { detail: "Conflicto de versión" } } };
    serviceMock.actualizarPlantilla.mockRejectedValueOnce(error);
    await act(async () => {
      await result.current.guardarConfig();
    });
    expect(result.current.mensaje.texto).toBe(
      "Error al guardar: Conflicto de versión",
    );
  });

  it("descarta la respuesta anterior al cambiar de tipo", async () => {
    let resolverBoletin;
    const boletinPendiente = new Promise((resolve) => {
      resolverBoletin = resolve;
    });
    serviceMock.listarPlantillas
      .mockReturnValueOnce(boletinPendiente)
      .mockResolvedValueOnce([{ ...personalizada, id: 3, nombre: "Voucher" }]);
    const { result } = renderHook(() => usePlantillasAdmin());
    await waitFor(() => expect(serviceMock.listarPlantillas).toHaveBeenCalledTimes(1));

    act(() => result.current.setTipoActivo("voucher_pago"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      resolverBoletin([personalizada]);
      await boletinPendiente;
    });

    expect(result.current.plantillas[0].nombre).toBe("Voucher");
  });
});
