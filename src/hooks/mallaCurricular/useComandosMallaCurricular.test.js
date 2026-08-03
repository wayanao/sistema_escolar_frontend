import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import { guardarPlaneadoresAnuales } from "../../services/mallaCurricularApi";
import { crearFilasVacias } from "../../utils/mallaCurricular/planeadorAnual";
import { useComandosMallaCurricular } from "./useComandosMallaCurricular";

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

vi.mock("../../services/mallaCurricularApi", () => ({
  guardarPlaneadoresAnuales: vi.fn(),
}));

const renderComandos = () => renderHook(() => useComandosMallaCurricular({
  asignacionId: "42",
}));

const diligenciarFilaValida = (result) => {
  act(() => {
    result.current.cambiarCampoPlaneador(0, "unidad_tematica", "  Ecosistemas  ");
    result.current.cambiarCampoPlaneador(0, "fecha", "2026-08-20");
  });
};

describe("useComandosMallaCurricular", () => {
  beforeEach(() => {
    Swal.fire.mockReset();
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    guardarPlaneadoresAnuales.mockReset();
  });

  it("recibe las filas consultadas y actualiza su estado de guardado", () => {
    const { result } = renderComandos();
    const filas = crearFilasVacias();
    filas[2] = { ...filas[2], contenido: "Ecosistemas", fecha: "2026-08-20" };

    act(() => {
      result.current.manejarPlaneadoresCargados({ guardado: true, planeadores: filas });
    });

    expect(result.current.planeadores).toBe(filas);
    expect(result.current.estadoGuardado).toEqual({
      cargando: false,
      guardado: true,
      modificado: false,
      guardadoEn: null,
    });
  });

  it("edita una fila sin mutar las demás y marca cambios pendientes", () => {
    const { result } = renderComandos();
    const segundaFilaInicial = result.current.planeadores[1];

    act(() => {
      result.current.cambiarCampoPlaneador(0, "contenido", "Cadenas tróficas");
    });

    expect(result.current.planeadores[0].contenido).toBe("Cadenas tróficas");
    expect(result.current.planeadores[1]).toBe(segundaFilaInicial);
    expect(result.current.estadoGuardado.modificado).toBe(true);
  });

  it("impide guardar contenido sin fecha", async () => {
    const { result } = renderComandos();
    act(() => {
      result.current.cambiarCampoPlaneador(0, "contenido", "Cadenas tróficas");
    });

    await act(async () => {
      await result.current.guardarPlaneadores({
        periodo: "2",
        recargarPlaneadores: vi.fn(),
      });
    });

    expect(guardarPlaneadoresAnuales).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: "warning",
      title: "Falta la fecha en la fila 1",
    }));
  });

  it("impide guardar una fecha sin contenido", async () => {
    const { result } = renderComandos();
    act(() => {
      result.current.cambiarCampoPlaneador(0, "fecha", "2026-08-20");
    });

    await act(async () => {
      await result.current.guardarPlaneadores({
        periodo: "2",
        recargarPlaneadores: vi.fn(),
      });
    });

    expect(guardarPlaneadoresAnuales).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: "warning",
      title: "Falta contenido en la fila 1",
    }));
  });

  it("expone progreso, envía ocho filas, recarga y confirma el guardado", async () => {
    const { result } = renderComandos();
    const recargarPlaneadores = vi.fn().mockResolvedValue();
    let resolverGuardado;
    guardarPlaneadoresAnuales.mockReturnValue(new Promise((resolve) => {
      resolverGuardado = resolve;
    }));
    diligenciarFilaValida(result);

    let promesaGuardado;
    act(() => {
      promesaGuardado = result.current.guardarPlaneadores({
        periodo: "2",
        recargarPlaneadores,
      });
    });
    expect(result.current.guardando).toBe(true);

    await act(async () => {
      resolverGuardado({ status: 200 });
      await promesaGuardado;
    });

    const [asignacionId, periodo, payload] = guardarPlaneadoresAnuales.mock.calls[0];
    expect(asignacionId).toBe("42");
    expect(periodo).toBe("2");
    expect(payload).toHaveLength(8);
    expect(payload[0]).toEqual(expect.objectContaining({
      unidad_tematica: "Ecosistemas",
      fecha: "2026-08-20",
    }));
    expect(recargarPlaneadores).toHaveBeenCalledTimes(1);
    expect(result.current.guardando).toBe(false);
    expect(result.current.estadoGuardado).toEqual(expect.objectContaining({
      cargando: false,
      guardado: true,
      modificado: false,
      guardadoEn: expect.any(String),
    }));
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: "success",
      title: "Malla curricular guardada",
    }));
  });

  it("conserva el detalle del backend al informar un error de guardado", async () => {
    const { result } = renderComandos();
    const error = { response: { data: { detail: "El período está cerrado" } } };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    guardarPlaneadoresAnuales.mockRejectedValue(error);
    diligenciarFilaValida(result);

    await act(async () => {
      await result.current.guardarPlaneadores({
        periodo: "2",
        recargarPlaneadores: vi.fn(),
      });
    });

    expect(result.current.guardando).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: "error",
      title: "No se pudo guardar la malla",
      text: "El período está cerrado",
    }));
    consoleError.mockRestore();
  });
});
