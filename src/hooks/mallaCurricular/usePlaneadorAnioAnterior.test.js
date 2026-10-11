import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import {
  consultarPlaneadorAnioAnterior,
  traerPlaneadorAnioAnterior,
} from "../../services/mallaCurricularApi";
import { usePlaneadorAnioAnterior } from "./usePlaneadorAnioAnterior";

// Año lectivo, fase 7, paso 7.3: el botón "Traer el planeador del año
// pasado". El backend decide si se puede (`puede_traer`); el hook solo
// pregunta cuando el periodo cargado llegó vacío, y una sola vez.

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

vi.mock("../../services/mallaCurricularApi", () => ({
  consultarPlaneadorAnioAnterior: vi.fn(),
  traerPlaneadorAnioAnterior: vi.fn(),
}));

const MENSAJE_TRAIDO =
  "Se trajo el planeador del año pasado. Las fechas quedaron vacías: pon las de este año al guardar cada periodo.";

const renderAnioAnterior = (asignacionId = "42") => renderHook(
  () => usePlaneadorAnioAnterior({ asignacionId })
);

const conPuedeTraer = async () => {
  const hook = renderAnioAnterior();
  await act(async () => {
    await hook.result.current.alCargarPeriodo(false);
  });
  expect(hook.result.current.puedeTraer).toBe(true);
  return hook;
};

describe("usePlaneadorAnioAnterior", () => {
  beforeEach(() => {
    Swal.fire.mockReset();
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    consultarPlaneadorAnioAnterior.mockReset();
    traerPlaneadorAnioAnterior.mockReset();
    consultarPlaneadorAnioAnterior.mockResolvedValue({
      hay_origen: true,
      planeador_vacio: true,
      puede_traer: true,
    });
    traerPlaneadorAnioAnterior.mockResolvedValue({ message: MENSAJE_TRAIDO, filas_copiadas: 5 });
  });

  it("empieza sin ofrecer nada y sin preguntar", () => {
    const { result } = renderAnioAnterior();

    expect(result.current.puedeTraer).toBe(false);
    expect(result.current.trayendo).toBe(false);
    expect(consultarPlaneadorAnioAnterior).not.toHaveBeenCalled();
  });

  it("con un periodo con filas no pregunta: el planeador no está vacío", async () => {
    const { result } = renderAnioAnterior();

    await act(async () => {
      await result.current.alCargarPeriodo(true);
      await result.current.alCargarPeriodo(false);
    });

    expect(consultarPlaneadorAnioAnterior).not.toHaveBeenCalled();
    expect(result.current.puedeTraer).toBe(false);
  });

  it("con un periodo vacío pregunta una sola vez y usa lo que dice el backend", async () => {
    const { result } = await conPuedeTraer();

    await act(async () => {
      await result.current.alCargarPeriodo(false);
    });

    expect(consultarPlaneadorAnioAnterior).toHaveBeenCalledTimes(1);
    expect(consultarPlaneadorAnioAnterior).toHaveBeenCalledWith("42");
    expect(result.current.puedeTraer).toBe(true);
  });

  it("si el backend dice que no, no ofrece nada", async () => {
    consultarPlaneadorAnioAnterior.mockResolvedValue({
      hay_origen: true,
      planeador_vacio: true,
      puede_traer: false,
    });
    const { result } = renderAnioAnterior();

    await act(async () => {
      await result.current.alCargarPeriodo(false);
    });

    expect(result.current.puedeTraer).toBe(false);
  });

  it("deja de ofrecerlo en cuanto un periodo llega con filas", async () => {
    const { result } = await conPuedeTraer();

    await act(async () => {
      await result.current.alCargarPeriodo(true);
    });

    expect(result.current.puedeTraer).toBe(false);
  });

  it("descarta la respuesta si mientras tanto llegó un periodo con filas", async () => {
    let responder;
    consultarPlaneadorAnioAnterior.mockImplementation(
      () => new Promise((resolve) => { responder = resolve; })
    );
    const { result } = renderAnioAnterior();

    let consulta;
    act(() => {
      consulta = result.current.alCargarPeriodo(false);
    });
    await act(async () => {
      await result.current.alCargarPeriodo(true);
    });
    await act(async () => {
      responder({ puede_traer: true });
      await consulta;
    });

    expect(result.current.puedeTraer).toBe(false);
  });

  it("si la consulta falla no ofrece nada y vuelve a preguntar con el siguiente periodo vacío", async () => {
    const error = new Error("sin conexión");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    consultarPlaneadorAnioAnterior.mockRejectedValueOnce(error);
    const { result } = renderAnioAnterior();

    await act(async () => {
      await result.current.alCargarPeriodo(false);
    });
    expect(result.current.puedeTraer).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("Error consultando el planeador del año pasado", error);

    await act(async () => {
      await result.current.alCargarPeriodo(false);
    });
    expect(consultarPlaneadorAnioAnterior).toHaveBeenCalledTimes(2);
    expect(result.current.puedeTraer).toBe(true);
    consoleError.mockRestore();
  });

  it("sin clase no pregunta", async () => {
    const { result } = renderAnioAnterior(null);

    await act(async () => {
      await result.current.alCargarPeriodo(false);
    });

    expect(consultarPlaneadorAnioAnterior).not.toHaveBeenCalled();
  });

  it("al traer, recarga el periodo, muestra el mensaje del backend y deja de ofrecerlo", async () => {
    const { result } = await conPuedeTraer();
    const recargarPlaneadores = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.traer({ recargarPlaneadores });
    });

    expect(traerPlaneadorAnioAnterior).toHaveBeenCalledWith("42");
    expect(recargarPlaneadores).toHaveBeenCalledTimes(1);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: "success",
      title: "Planeador traído",
      text: MENSAJE_TRAIDO,
    }));
    expect(result.current.puedeTraer).toBe(false);
    expect(result.current.trayendo).toBe(false);
  });

  it("mientras trae, avisa que está trayendo", async () => {
    let responder;
    traerPlaneadorAnioAnterior.mockImplementation(
      () => new Promise((resolve) => { responder = resolve; })
    );
    const { result } = await conPuedeTraer();

    let trayendo;
    act(() => {
      trayendo = result.current.traer({ recargarPlaneadores: vi.fn() });
    });
    await waitFor(() => expect(result.current.trayendo).toBe(true));

    await act(async () => {
      responder({ message: MENSAJE_TRAIDO, filas_copiadas: 1 });
      await trayendo;
    });
    expect(result.current.trayendo).toBe(false);
  });

  it("si el backend rechaza, muestra su mensaje, no recarga y deja de ofrecerlo", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    traerPlaneadorAnioAnterior.mockRejectedValue({
      response: {
        status: 409,
        data: {
          detail: "Este planeador ya tiene contenido. No se trajo nada, para no reemplazar lo que ya está escrito.",
        },
      },
    });
    const { result } = await conPuedeTraer();
    const recargarPlaneadores = vi.fn();

    await act(async () => {
      await result.current.traer({ recargarPlaneadores });
    });

    expect(recargarPlaneadores).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: "error",
      title: "No se pudo traer el planeador",
      text: "Este planeador ya tiene contenido. No se trajo nada, para no reemplazar lo que ya está escrito.",
    }));
    expect(result.current.puedeTraer).toBe(false);
    consoleError.mockRestore();
  });

  it("sin respuesta del servidor, sigue ofreciéndolo para reintentar", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    traerPlaneadorAnioAnterior.mockRejectedValue(new Error("Network Error"));
    const { result } = await conPuedeTraer();

    await act(async () => {
      await result.current.traer({ recargarPlaneadores: vi.fn() });
    });

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: "error",
      text: "No se pudo conectar. Intenta nuevamente.",
    }));
    expect(result.current.puedeTraer).toBe(true);
    consoleError.mockRestore();
  });
});
