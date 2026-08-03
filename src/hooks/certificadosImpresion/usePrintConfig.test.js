import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBrandingMock, getPlantillaActivaMock } = vi.hoisted(() => ({
  getBrandingMock: vi.fn(),
  getPlantillaActivaMock: vi.fn(),
}));

vi.mock("../../services/printingService", () => ({
  getBranding: getBrandingMock,
  getPlantillaActiva: getPlantillaActivaMock,
}));

import usePrintConfig, { invalidatePrintCache } from "./usePrintConfig";

function crearPendiente() {
  let resolve;
  let reject;
  const promise = new Promise((resolver, rechazar) => {
    resolve = resolver;
    reject = rechazar;
  });
  return { promise, reject, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  invalidatePrintCache();
  getBrandingMock.mockResolvedValue({ nombre_institucion: "Colegio Central" });
  getPlantillaActivaMock.mockImplementation((tipo) =>
    Promise.resolve({ id: tipo, config_json: {} }));
});

describe("usePrintConfig", () => {
  it("deduplica solicitudes concurrentes y comparte caché por tipo", async () => {
    const primero = renderHook(() => usePrintConfig("reporte_estudiante"));
    const segundo = renderHook(() => usePrintConfig("reporte_estudiante"));

    await waitFor(() => expect(primero.result.current.loading).toBe(false));
    await waitFor(() => expect(segundo.result.current.loading).toBe(false));

    expect(getBrandingMock).toHaveBeenCalledTimes(1);
    expect(getPlantillaActivaMock).toHaveBeenCalledTimes(1);
    expect(segundo.result.current.branding.nombre_institucion).toBe(
      "Colegio Central",
    );
    expect(segundo.result.current.plantilla.id).toBe("reporte_estudiante");

    const tercero = renderHook(() => usePrintConfig("reporte_estudiante"));
    expect(tercero.result.current.loading).toBe(false);
    expect(getBrandingMock).toHaveBeenCalledTimes(1);
    expect(getPlantillaActivaMock).toHaveBeenCalledTimes(1);
  });

  it("comparte branding pero mantiene una plantilla independiente por tipo", async () => {
    const primero = renderHook(() => usePrintConfig("reporte_estudiante"));
    await waitFor(() => expect(primero.result.current.loading).toBe(false));

    const segundo = renderHook(() => usePrintConfig("boletin"));
    await waitFor(() => expect(segundo.result.current.loading).toBe(false));

    expect(getBrandingMock).toHaveBeenCalledTimes(1);
    expect(getPlantillaActivaMock).toHaveBeenNthCalledWith(
      1,
      "reporte_estudiante",
    );
    expect(getPlantillaActivaMock).toHaveBeenNthCalledWith(2, "boletin");
    expect(segundo.result.current.plantilla.id).toBe("boletin");
  });

  it("invalida branding y todas las plantillas para la consulta siguiente", async () => {
    const primero = renderHook(() => usePrintConfig("reporte_estudiante"));
    await waitFor(() => expect(primero.result.current.loading).toBe(false));
    primero.unmount();

    invalidatePrintCache();
    const segundo = renderHook(() => usePrintConfig("reporte_estudiante"));
    await waitFor(() => expect(segundo.result.current.loading).toBe(false));

    expect(getBrandingMock).toHaveBeenCalledTimes(2);
    expect(getPlantillaActivaMock).toHaveBeenCalledTimes(2);
  });

  it("descarta la plantilla anterior si cambia el tipo durante la consulta", async () => {
    const reportePendiente = crearPendiente();
    const boletinPendiente = crearPendiente();
    getPlantillaActivaMock
      .mockReturnValueOnce(reportePendiente.promise)
      .mockReturnValueOnce(boletinPendiente.promise);
    const { result, rerender } = renderHook(
      ({ tipo }) => usePrintConfig(tipo),
      { initialProps: { tipo: "reporte_estudiante" } },
    );

    rerender({ tipo: "boletin" });
    await act(async () => {
      reportePendiente.resolve({ id: "anterior", config_json: {} });
      await reportePendiente.promise;
      boletinPendiente.resolve({ id: "vigente", config_json: {} });
      await boletinPendiente.promise;
    });

    expect(result.current.plantilla.id).toBe("vigente");
  });

  it("expone el error y permite reintentar una promesa fallida", async () => {
    const error = new Error("Branding no disponible");
    getBrandingMock
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ nombre_institucion: "Colegio Central" });

    const primero = renderHook(() => usePrintConfig("reporte_estudiante"));
    await waitFor(() => expect(primero.result.current.loading).toBe(false));
    expect(primero.result.current.error).toBe(error);
    primero.unmount();

    const segundo = renderHook(() => usePrintConfig("reporte_estudiante"));
    await waitFor(() => expect(segundo.result.current.loading).toBe(false));
    expect(segundo.result.current.error).toBeNull();
    expect(getBrandingMock).toHaveBeenCalledTimes(2);
    expect(getPlantillaActivaMock).toHaveBeenCalledTimes(1);
  });

  it("descarta resultados que se resuelven después del desmontaje", async () => {
    const plantillaPendiente = crearPendiente();
    getPlantillaActivaMock.mockReturnValue(plantillaPendiente.promise);
    const { result, unmount } = renderHook(() =>
      usePrintConfig("reporte_estudiante"));

    expect(result.current.loading).toBe(true);
    unmount();
    await act(async () => {
      plantillaPendiente.resolve({ id: "tardia", config_json: {} });
      await plantillaPendiente.promise;
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.plantilla).toBeNull();
  });
});
