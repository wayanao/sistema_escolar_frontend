import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  actualizarRevisionMock,
  crearObservacionMock,
  eliminarImagenCompuestoMock,
  listarObservacionesMock,
  notificarMock,
  obtenerPlaneacionMock,
} = vi.hoisted(() => ({
  actualizarRevisionMock: vi.fn(),
  crearObservacionMock: vi.fn(),
  eliminarImagenCompuestoMock: vi.fn(),
  listarObservacionesMock: vi.fn(),
  notificarMock: vi.fn(),
  obtenerPlaneacionMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  actualizarRevisionPlaneacionAdmin: actualizarRevisionMock,
  crearObservacionPlaneacionAdmin: crearObservacionMock,
  listarObservacionesPlan: listarObservacionesMock,
  obtenerPlaneacionAdmin: obtenerPlaneacionMock,
}));

vi.mock("../../utils/planeaciones/notificaciones", () => ({
  actualizarNotificacionesPlaneadores: notificarMock,
}));

vi.mock("./useEliminacionImagenPlaneacionAdmin", () => ({
  default: vi.fn(() => ({
    eliminandoImagen: "",
    eliminarImagen: eliminarImagenCompuestoMock,
  })),
}));

import useDetallePlaneacionAdmin from "./useDetallePlaneacionAdmin";

const planInicial = {
  id: 91,
  estado_revision: "pendiente",
  version_revision: 2,
  total_observaciones: 0,
  imagen1: "evidencia.webp",
};

beforeEach(() => {
  vi.clearAllMocks();
  obtenerPlaneacionMock.mockResolvedValue(planInicial);
  listarObservacionesMock.mockResolvedValue([{ id: 5, observacion: "Base" }]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function abrirDetalle(overrides = {}) {
  const props = {
    planId: 91,
    onSubirInicio: vi.fn(),
    ...overrides,
  };
  const hook = renderHook(() => useDetallePlaneacionAdmin(props));
  await waitFor(() => expect(hook.result.current.cargando).toBe(false));
  return { ...hook, props };
}

describe("useDetallePlaneacionAdmin", () => {
  it("carga en paralelo el plan y su historial de comentarios", async () => {
    const { result } = await abrirDetalle();

    expect(obtenerPlaneacionMock).toHaveBeenCalledWith(91);
    expect(listarObservacionesMock).toHaveBeenCalledWith(91);
    expect(result.current.plan).toEqual(planInicial);
    expect(result.current.observaciones).toEqual([
      { id: 5, observacion: "Base" },
    ]);
  });

  it("aprueba la planeación y agrega el comentario retornado", async () => {
    actualizarRevisionMock.mockResolvedValue({
      estado_revision: "revisado",
      version_revision: 2,
      observacion: { id: 8, observacion: "Muy buen trabajo" },
    });
    const { result, props } = await abrirDetalle();

    act(() => result.current.setObservacion("  Muy buen trabajo  "));
    await act(async () => {
      await result.current.marcarRevisado();
    });

    expect(actualizarRevisionMock).toHaveBeenCalledWith(91, {
      estado: "revisado",
      version: 2,
      comentario: "Muy buen trabajo",
    });
    expect(result.current.plan).toMatchObject({
      estado_revision: "revisado",
      total_observaciones: 1,
    });
    expect(result.current.observaciones[0]).toMatchObject({
      id: 8,
      admin: "Administración",
    });
    expect(result.current.observacion).toBe("");
    expect(notificarMock).toHaveBeenCalledTimes(1);
    expect(props.onSubirInicio).toHaveBeenCalledTimes(1);
  });

  it("envía una solicitud de ajuste y actualiza el detalle local", async () => {
    crearObservacionMock.mockResolvedValue({
      estado_revision: "con_observaciones",
      observacion: { id: 9, observacion: "Amplía la actividad" },
    });
    const { result } = await abrirDetalle();

    act(() => result.current.setObservacion("Amplía la actividad"));
    await act(async () => {
      await result.current.guardarObservacion();
    });

    expect(crearObservacionMock).toHaveBeenCalledWith(91, {
      observacion: "Amplía la actividad",
      version: 2,
    });
    expect(result.current.plan).toMatchObject({
      estado_revision: "con_observaciones",
      total_observaciones: 1,
    });
    expect(result.current.mensaje).toEqual({
      tono: "exito",
      texto: "La solicitud de ajuste fue enviada al profesor.",
    });
  });

  it("recarga la versión reciente cuando detecta un conflicto", async () => {
    obtenerPlaneacionMock
      .mockResolvedValueOnce(planInicial)
      .mockResolvedValueOnce({
        ...planInicial,
        version_revision: 3,
        tema: "Versión reciente",
      });
    listarObservacionesMock.mockResolvedValue([]);
    actualizarRevisionMock.mockRejectedValue({
      response: {
        status: 409,
        data: { detail: { mensaje: "El plan cambió en otra pestaña." } },
      },
    });
    const { result } = await abrirDetalle();

    await act(async () => {
      await result.current.marcarRevisado();
    });

    expect(obtenerPlaneacionMock).toHaveBeenCalledTimes(2);
    expect(result.current.plan.version_revision).toBe(3);
    expect(result.current.mensaje).toEqual({
      tono: "aviso",
      texto: "El plan cambió en otra pestaña.",
    });
    expect(result.current.accionRevision).toBe("");
  });

  it("expone un error controlado cuando el detalle no puede abrirse", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    obtenerPlaneacionMock.mockRejectedValue({
      response: { data: { detail: "Planeación no encontrada." } },
    });

    const { result } = await abrirDetalle();

    expect(result.current.plan).toBeNull();
    expect(result.current.mensaje).toEqual({
      tono: "error",
      texto: "Planeación no encontrada.",
    });
  });
});
