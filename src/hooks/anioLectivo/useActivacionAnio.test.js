import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activarAnioLectivo: vi.fn(),
  listarEstudiantes: vi.fn(),
  obtenerVistaPreviaActivacion: vi.fn(),
}));

vi.mock("../../services/aniosLectivosApi", () => ({
  activarAnioLectivo: mocks.activarAnioLectivo,
  obtenerVistaPreviaActivacion: mocks.obtenerVistaPreviaActivacion,
}));
vi.mock("../../services/estudiantesObservadorApi", () => ({
  listarEstudiantes: mocks.listarEstudiantes,
}));

import useActivacionAnio from "./useActivacionAnio";

const PREPARACION = { id: 3, anio: 2027, estado: "preparacion" };
const PENDIENTE = {
  id: 8,
  nombre: "Esteban",
  apellido: "Castro",
  curso_id: 3,
  curso_nombre: "1B",
  curso_jornada: "Mañana",
};
const VISTA_LISTA = {
  anio_origen: { id: 2, anio: 2026 },
  anio_destino: { id: 3, anio: 2027 },
  resumen: { continuan: 6, nuevos: 0, retirados: 3, egresados: 1, sin_decidir: 0 },
  puede_activar: true,
  sin_decidir: [],
};
const MATRICULADOS = [
  { id: 587, nombre: "Katrina", apellido: "Romo", curso_id: 43, estado: "activo" },
];
const ACTIVADO = {
  anio_cerrado: { id: 2, anio: 2026, estado: "cerrado" },
  anio_activo: { id: 3, anio: 2027, estado: "activo" },
  resumen: { continuan: 6, nuevos: 0, retirados: 3, egresados: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.obtenerVistaPreviaActivacion.mockResolvedValue(VISTA_LISTA);
  mocks.listarEstudiantes.mockResolvedValue(MATRICULADOS);
  mocks.activarAnioLectivo.mockResolvedValue(ACTIVADO);
});

async function conVistaPrevia(opciones) {
  const hook = renderHook(() => useActivacionAnio(PREPARACION, opciones));
  await waitFor(() => expect(hook.result.current.vistaPrevia).toEqual(VISTA_LISTA));
  return hook;
}

describe("useActivacionAnio", () => {
  it("pide la vista previa del año en preparación al montar", async () => {
    await conVistaPrevia();

    expect(mocks.obtenerVistaPreviaActivacion).toHaveBeenCalledWith(3, {
      signal: expect.any(AbortSignal),
    });
  });

  it("junto con la vista previa pide los matriculados del año en preparación, de todo estado", async () => {
    const { result } = await conVistaPrevia();

    expect(mocks.listarEstudiantes).toHaveBeenCalledWith("todos", {
      parametrosAnio: { anio_lectivo_id: 3 },
      signal: expect.any(AbortSignal),
    });
    expect(result.current.matriculados).toEqual(MATRICULADOS);
  });

  it("si no se pueden leer los matriculados, avisa como con la vista previa", async () => {
    mocks.listarEstudiantes.mockRejectedValue(new Error("red"));
    const { result } = renderHook(() => useActivacionAnio(PREPARACION));

    await waitFor(() =>
      expect(result.current.error).toBe("No se pudo cargar la vista previa de la activación."),
    );
    expect(result.current.cargandoVistaPrevia).toBe(false);
  });

  it("sin año en preparación no pide nada", () => {
    const { result } = renderHook(() => useActivacionAnio(null));

    expect(result.current.vistaPrevia).toBe(null);
    expect(result.current.matriculados).toBe(null);
    expect(mocks.obtenerVistaPreviaActivacion).not.toHaveBeenCalled();
    expect(mocks.listarEstudiantes).not.toHaveBeenCalled();
  });

  it("no activa si el año escrito no coincide", async () => {
    const { result } = await conVistaPrevia();
    act(() => result.current.setConfirmacion("2026"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.activar();
    });

    expect(respuesta.estado).toBe("validacion");
    expect(mocks.activarAnioLectivo).not.toHaveBeenCalled();
  });

  it("activa con el año escrito, guarda el resultado y avisa para recargar los años", async () => {
    const onActivado = vi.fn().mockResolvedValue(undefined);
    const { result } = await conVistaPrevia({ onActivado });
    act(() => result.current.setConfirmacion(" 2027 "));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.activar();
    });

    expect(respuesta.estado).toBe("exito");
    expect(mocks.activarAnioLectivo).toHaveBeenCalledWith(3, 2027);
    expect(onActivado).toHaveBeenCalledWith(ACTIVADO);
    expect(result.current.resultado).toEqual(ACTIVADO);
    expect(result.current.confirmacion).toBe("");
    expect(result.current.error).toBe("");
  });

  it("si la activación salió bien pero falla la recarga de años, no la presenta como fallida", async () => {
    const onActivado = vi.fn().mockRejectedValue(new Error("red"));
    const { result } = await conVistaPrevia({ onActivado });
    act(() => result.current.setConfirmacion("2027"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.activar();
    });

    expect(respuesta.estado).toBe("exito");
    expect(result.current.resultado).toEqual(ACTIVADO);
    expect(result.current.error).toBe(
      "2027 quedó activo, pero no se pudo actualizar la lista de años. Recarga la página.",
    );
  });

  it("si el backend rechaza por pendientes, muestra su mensaje y su lista", async () => {
    mocks.activarAnioLectivo.mockRejectedValue({
      response: {
        status: 409,
        data: {
          detail: {
            codigo: "activacion_con_pendientes",
            mensaje: "No se puede activar 2027: faltan 1 estudiantes por decidir.",
            sin_decidir: [PENDIENTE],
          },
        },
      },
    });
    const onActivado = vi.fn();
    const { result } = await conVistaPrevia({ onActivado });
    act(() => result.current.setConfirmacion("2027"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.activar();
    });

    expect(respuesta.estado).toBe("error");
    expect(onActivado).not.toHaveBeenCalled();
    expect(result.current.resultado).toBe(null);
    expect(result.current.error).toBe(
      "No se puede activar 2027: faltan 1 estudiantes por decidir.",
    );
    expect(result.current.vistaPrevia.puede_activar).toBe(false);
    expect(result.current.vistaPrevia.sin_decidir).toEqual([PENDIENTE]);
    expect(result.current.vistaPrevia.resumen.sin_decidir).toBe(1);
  });

  it("muestra tal cual cualquier otro rechazo del backend", async () => {
    mocks.activarAnioLectivo.mockRejectedValue({
      response: { data: { detail: "Para activar, escribe el año 2027." } },
    });
    const { result } = await conVistaPrevia();
    act(() => result.current.setConfirmacion("2027"));

    await act(async () => {
      await result.current.activar();
    });

    expect(result.current.error).toBe("Para activar, escribe el año 2027.");
    expect(result.current.vistaPrevia).toEqual(VISTA_LISTA);
  });

  it("vuelve a pedir la vista previa cuando se le pide", async () => {
    const { result } = await conVistaPrevia();

    await act(async () => {
      await result.current.recargarVistaPrevia();
    });

    expect(mocks.obtenerVistaPreviaActivacion).toHaveBeenCalledTimes(2);
    expect(mocks.listarEstudiantes).toHaveBeenCalledTimes(2);
  });
});
