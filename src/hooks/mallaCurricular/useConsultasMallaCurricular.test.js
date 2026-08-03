import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  obtenerAsignacionesProfesor,
  obtenerPlaneadoresAnuales,
} from "../../services/mallaCurricularApi";
import { useConsultasMallaCurricular } from "./useConsultasMallaCurricular";

vi.mock("../../services/mallaCurricularApi", () => ({
  obtenerAsignacionesProfesor: vi.fn(),
  obtenerPlaneadoresAnuales: vi.fn(),
}));

const asignacion = { id: 42, curso: "6A", materia: "Ciencias" };

const crearCallbacks = () => ({
  onErrorPlaneadores: vi.fn(),
  onInicioPlaneadores: vi.fn(),
  onPlaneadoresCargados: vi.fn(),
});

const renderConsultas = (callbacks = crearCallbacks()) => ({
  callbacks,
  ...renderHook(() => useConsultasMallaCurricular({
    asignacionId: "42",
    profesorId: 7,
    ...callbacks,
  })),
});

describe("useConsultasMallaCurricular", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
    localStorage.setItem("periodo_profesor_7", "2");
    obtenerAsignacionesProfesor.mockReset();
    obtenerPlaneadoresAnuales.mockReset();
    obtenerAsignacionesProfesor.mockResolvedValue([asignacion]);
    obtenerPlaneadoresAnuales.mockResolvedValue({ planeadores: [] });
  });

  it("carga la asignación y entrega las filas normalizadas del periodo persistido", async () => {
    obtenerPlaneadoresAnuales.mockResolvedValue({
      planeadores: [{
        slot: 3,
        unidad_tematica: "Ecosistemas",
        estandar_competencia: "",
        contenido: "",
        actividades_recursos: "",
        fecha: "2026-08-20T00:00:00.000Z",
      }],
    });
    const { callbacks, result } = renderConsultas();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(obtenerAsignacionesProfesor).toHaveBeenCalledWith(7);
    expect(obtenerPlaneadoresAnuales).toHaveBeenCalledWith("42", "2");
    expect(result.current.asignacion).toEqual(asignacion);
    expect(callbacks.onInicioPlaneadores).toHaveBeenCalledTimes(1);
    expect(callbacks.onPlaneadoresCargados).toHaveBeenCalledWith(expect.objectContaining({
      guardado: true,
      planeadores: expect.arrayContaining([
        expect.objectContaining({ unidad_tematica: "Ecosistemas" }),
      ]),
    }));
    const [{ planeadores }] = callbacks.onPlaneadoresCargados.mock.calls[0];
    expect(planeadores).toHaveLength(8);
    expect(planeadores[2].fecha).toBe("2026-08-20");
  });

  it("persiste un cambio de periodo y consulta sus filas", async () => {
    const { result } = renderConsultas();
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.cambiarPeriodo("3");
    });

    await waitFor(() => {
      expect(obtenerPlaneadoresAnuales).toHaveBeenCalledWith("42", "3");
    });
    expect(result.current.periodo).toBe("3");
    expect(localStorage.getItem("periodo")).toBe("3");
    expect(localStorage.getItem("periodo_profesor_7")).toBe("3");
  });

  it("expone una recarga para consultar nuevamente el periodo actual", async () => {
    const { result } = renderConsultas();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.cargarPlaneadores();
    });

    expect(obtenerPlaneadoresAnuales).toHaveBeenCalledTimes(2);
    expect(obtenerPlaneadoresAnuales).toHaveBeenLastCalledWith("42", "2");
  });

  it("descarta una respuesta anterior cuando el periodo cambia", async () => {
    let resolverPeriodoDos;
    let resolverPeriodoTres;
    obtenerPlaneadoresAnuales.mockImplementation((...argumentos) => new Promise((resolve) => {
      const periodo = argumentos[1];
      if (periodo === "2") resolverPeriodoDos = resolve;
      if (periodo === "3") resolverPeriodoTres = resolve;
    }));
    const { callbacks, result } = renderConsultas();

    await waitFor(() => {
      expect(obtenerPlaneadoresAnuales).toHaveBeenCalledWith("42", "2");
    });
    act(() => {
      result.current.cambiarPeriodo("3");
    });
    await waitFor(() => {
      expect(obtenerPlaneadoresAnuales).toHaveBeenCalledWith("42", "3");
    });

    await act(async () => {
      resolverPeriodoTres({
        planeadores: [{ ...asignacion, slot: 1, contenido: "Periodo nuevo", fecha: "2026-08-20" }],
      });
    });
    await waitFor(() => {
      expect(callbacks.onPlaneadoresCargados).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      resolverPeriodoDos({
        planeadores: [{ ...asignacion, slot: 1, contenido: "Periodo anterior", fecha: "2026-08-10" }],
      });
    });

    const [{ planeadores }] = callbacks.onPlaneadoresCargados.mock.calls[0];
    expect(planeadores[0].contenido).toBe("Periodo nuevo");
    expect(callbacks.onPlaneadoresCargados).toHaveBeenCalledTimes(1);
  });

  it("notifica el error de consulta sin decidir su presentación", async () => {
    const error = new Error("sin conexión");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    obtenerPlaneadoresAnuales.mockRejectedValue(error);
    const { callbacks, result } = renderConsultas();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(callbacks.onErrorPlaneadores).toHaveBeenCalledTimes(1);
    expect(callbacks.onPlaneadoresCargados).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith("Error cargando planeadores", error);
    consoleError.mockRestore();
  });
});
