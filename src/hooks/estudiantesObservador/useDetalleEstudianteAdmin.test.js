import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerDetalleMock, obtenerDeudasMock } = vi.hoisted(() => ({
  obtenerDetalleMock: vi.fn(),
  obtenerDeudasMock: vi.fn(),
}));

vi.mock("../../services/estudiantesObservadorApi", () => ({
  obtenerDetalleEstudiante: obtenerDetalleMock,
  obtenerDeudasEstudiante: obtenerDeudasMock,
}));

import useDetalleEstudianteAdmin from "./useDetalleEstudianteAdmin";

function crearPendiente() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useDetalleEstudianteAdmin", () => {
  it("conserva el detalle cuando solo responde el endpoint financiero", async () => {
    obtenerDetalleMock.mockRejectedValue(new Error("Sin resumen"));
    obtenerDeudasMock.mockResolvedValue({
      deudas: [{ deuda: 25 }],
      total_deuda: 25,
    });
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    await act(async () => {
      await result.current.verDetalles({ id: 11, nombre: "Ana" });
    });

    expect(result.current.selectedEstudiante).toEqual({ id: 11, nombre: "Ana" });
    expect(result.current.detallesEstudiante).toMatchObject({
      notas: [],
      observaciones: [],
      deudas: [{ deuda: 25 }],
      total_deuda: 25,
    });
    expect(result.current.errorDetalle).toBeNull();
  });

  it("impide que un detalle anterior sobrescriba al estudiante abierto", async () => {
    const detalleAna = crearPendiente();
    const deudasAna = crearPendiente();
    const detalleLuis = crearPendiente();
    const deudasLuis = crearPendiente();
    obtenerDetalleMock
      .mockImplementationOnce(() => detalleAna.promise)
      .mockImplementationOnce(() => detalleLuis.promise);
    obtenerDeudasMock
      .mockImplementationOnce(() => deudasAna.promise)
      .mockImplementationOnce(() => deudasLuis.promise);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    act(() => {
      void result.current.verDetalles({ id: 11, nombre: "Ana" });
    });
    act(() => {
      void result.current.verDetalles({ id: 12, nombre: "Luis" });
    });

    await act(async () => {
      detalleLuis.resolve({ promedio_general: 4.5 });
      deudasLuis.resolve({ deudas: [] });
      await Promise.all([detalleLuis.promise, deudasLuis.promise]);
    });
    await waitFor(() => expect(result.current.loadingDetalles).toBe(false));

    await act(async () => {
      detalleAna.resolve({ promedio_general: 2.5 });
      deudasAna.resolve({ deudas: [{ deuda: 90 }] });
      await Promise.all([detalleAna.promise, deudasAna.promise]);
    });

    expect(result.current.selectedEstudiante).toEqual({ id: 12, nombre: "Luis" });
    expect(result.current.detallesEstudiante).toMatchObject({
      promedio_general: 4.5,
      deudas: [],
    });
  });

  it("invalida la consulta pendiente al cerrar el modal", async () => {
    const detalle = crearPendiente();
    const deudas = crearPendiente();
    obtenerDetalleMock.mockReturnValue(detalle.promise);
    obtenerDeudasMock.mockReturnValue(deudas.promise);
    const { result } = renderHook(() => useDetalleEstudianteAdmin());

    act(() => {
      void result.current.verDetalles({ id: 11, nombre: "Ana" });
      result.current.cerrarModal();
    });

    await act(async () => {
      detalle.resolve({ promedio_general: 5 });
      deudas.resolve({ deudas: [] });
      await Promise.all([detalle.promise, deudas.promise]);
    });

    expect(result.current.selectedEstudiante).toBeNull();
    expect(result.current.detallesEstudiante).toBeNull();
    expect(result.current.loadingDetalles).toBe(false);
  });
});
