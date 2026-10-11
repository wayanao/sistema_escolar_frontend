import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import {
  listarPlanesAnioAnterior,
  obtenerPlanAnioAnterior,
} from "../../services/planeacionesApi";
import {
  crearClaveSinPlanesAnioAnterior,
  mensajePlanBaseUsado,
} from "../../utils/planeaciones/profesor";
import usePlanesAnioAnteriorProfesor from "./usePlanesAnioAnteriorProfesor";

// Año lectivo, fase 7, paso 7.4: "Usar un plan del año pasado". Decisión del
// usuario del 2026-10-10: se pregunta una vez por clase y, si no hay planes,
// el navegador lo anota y no vuelve a preguntar por esa clase.

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

vi.mock("../../services/planeacionesApi", () => ({
  listarPlanesAnioAnterior: vi.fn(),
  obtenerPlanAnioAnterior: vi.fn(),
}));

const PLANES = [
  { id: 1, fecha: "2026-02-10", periodo: 1, unidad: "Números", tema: "Conteo" },
  { id: 3, fecha: "2026-03-03", periodo: 1, unidad: "Sumas", tema: "Sumar" },
];
const TEXTO = {
  id: 1,
  unidad: "Números",
  proposito: "Contar",
  clase: "Conteo con fichas",
  estandar: "E1",
  dba: "D1",
  competencias: "C1",
  actividad_casa: "Contar en casa",
  tema: "Conteo",
};
const TEXTO_FORMULARIO = {
  unidad: "Números",
  proposito: "Contar",
  clase: "Conteo con fichas",
  estandar: "E1",
  dba: "D1",
  competencias: "C1",
  actividad_casa: "Contar en casa",
  tema: "Conteo",
};

function renderPlanes(props = {}) {
  const onUsarTexto = vi.fn();
  const onMensaje = vi.fn();
  const inicial = {
    profesorId: 8,
    asignacionId: 200,
    creando: true,
    hayCambios: false,
    onUsarTexto,
    onMensaje,
    ...props,
  };
  const hook = renderHook((actuales) => usePlanesAnioAnteriorProfesor(actuales), {
    initialProps: inicial,
  });
  return { ...hook, onUsarTexto, onMensaje, inicial };
}

async function conPlanes(props) {
  const hook = renderPlanes(props);
  await waitFor(() => expect(hook.result.current.planes).toHaveLength(2));
  return hook;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  listarPlanesAnioAnterior.mockResolvedValue(PLANES);
  obtenerPlanAnioAnterior.mockResolvedValue(TEXTO);
});

describe("cuándo pregunta", () => {
  it("sin crear un plan no pregunta nada", () => {
    const { result } = renderPlanes({ creando: false });

    expect(listarPlanesAnioAnterior).not.toHaveBeenCalled();
    expect(result.current.planes).toEqual([]);
  });

  it("al crear un plan pregunta una vez por clase y trae la lista", async () => {
    const { result, rerender, inicial } = await conPlanes();

    expect(listarPlanesAnioAnterior).toHaveBeenCalledWith(200);
    expect(result.current.planes).toEqual(PLANES);

    rerender({ ...inicial, creando: false });
    rerender({ ...inicial, creando: true });

    expect(listarPlanesAnioAnterior).toHaveBeenCalledTimes(1);
    expect(result.current.planes).toEqual(PLANES);
  });

  it("si no hay planes, lo anota y en otra visita no vuelve a preguntar", async () => {
    listarPlanesAnioAnterior.mockResolvedValue([]);
    const primera = renderPlanes();
    await waitFor(() => {
      expect(localStorage.getItem(crearClaveSinPlanesAnioAnterior(8, 200))).toBe("1");
    });
    primera.unmount();

    const segunda = renderPlanes();

    expect(listarPlanesAnioAnterior).toHaveBeenCalledTimes(1);
    expect(segunda.result.current.planes).toEqual([]);
  });

  it("lo anotado es por profesor: otro profesor en el mismo equipo sí pregunta", async () => {
    localStorage.setItem(crearClaveSinPlanesAnioAnterior(8, 200), "1");

    renderPlanes({ profesorId: 9 });

    await waitFor(() => expect(listarPlanesAnioAnterior).toHaveBeenCalledWith(200));
  });

  it("si hay planes no anota nada", async () => {
    await conPlanes();

    expect(localStorage.getItem(crearClaveSinPlanesAnioAnterior(8, 200))).toBeNull();
  });

  it("si la consulta falla no anota nada y vuelve a preguntar después", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("sin conexión");
    listarPlanesAnioAnterior.mockRejectedValueOnce(error);
    const { result, rerender, inicial } = renderPlanes();

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Error consultando los planes del año pasado", error);
    });
    expect(localStorage.getItem(crearClaveSinPlanesAnioAnterior(8, 200))).toBeNull();

    rerender({ ...inicial, creando: false });
    rerender({ ...inicial, creando: true });

    await waitFor(() => expect(result.current.planes).toEqual(PLANES));
    expect(listarPlanesAnioAnterior).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });

  it("cada clase tiene su lista, aunque una respuesta llegue tarde", async () => {
    let responderPrimera;
    listarPlanesAnioAnterior.mockImplementationOnce(
      () => new Promise((resolve) => { responderPrimera = resolve; }),
    );
    listarPlanesAnioAnterior.mockResolvedValueOnce([]);
    const { result, rerender, inicial } = renderPlanes();

    rerender({ ...inicial, asignacionId: 210 });
    await waitFor(() => expect(listarPlanesAnioAnterior).toHaveBeenCalledWith(210));
    await act(async () => {
      responderPrimera(PLANES);
    });

    expect(result.current.planes).toEqual([]);
    rerender({ ...inicial, asignacionId: 200 });
    expect(result.current.planes).toEqual(PLANES);
    expect(listarPlanesAnioAnterior).toHaveBeenCalledTimes(2);
  });
});

describe("la lista", () => {
  it("se abre y se cierra", async () => {
    const { result } = await conPlanes();
    expect(result.current.abierto).toBe(false);

    act(() => result.current.abrir());
    expect(result.current.abierto).toBe(true);

    act(() => result.current.cerrar());
    expect(result.current.abierto).toBe(false);
  });

  it("se cierra al cambiar de clase o al dejar de crear", async () => {
    const { result, rerender, inicial } = await conPlanes();

    act(() => result.current.abrir());
    rerender({ ...inicial, creando: false });
    expect(result.current.abierto).toBe(false);

    rerender(inicial);
    act(() => result.current.abrir());
    rerender({ ...inicial, asignacionId: 210 });
    expect(result.current.abierto).toBe(false);
  });
});

describe("usar un plan", () => {
  it("llena el formulario con su texto, avisa y cierra la lista", async () => {
    const { result, onUsarTexto, onMensaje } = await conPlanes();
    act(() => result.current.abrir());

    await act(async () => {
      await result.current.usar(PLANES[0]);
    });

    expect(obtenerPlanAnioAnterior).toHaveBeenCalledWith(200, 1);
    expect(onUsarTexto).toHaveBeenCalledWith(TEXTO_FORMULARIO);
    expect(onMensaje).toHaveBeenCalledWith(mensajePlanBaseUsado("2026-02-10"));
    expect(result.current.abierto).toBe(false);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it("con cambios sin guardar pregunta antes, y si cancela no pide nada", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: false });
    const { result, onUsarTexto } = await conPlanes({ hayCambios: true });

    await act(async () => {
      await result.current.usar(PLANES[0]);
    });

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: "¿Reemplazar lo que escribiste?",
      showCancelButton: true,
      confirmButtonText: "Sí, usar este plan",
    }));
    expect(obtenerPlanAnioAnterior).not.toHaveBeenCalled();
    expect(onUsarTexto).not.toHaveBeenCalled();
  });

  it("con cambios sin guardar y la confirmación, lo usa", async () => {
    const { result, onUsarTexto } = await conPlanes({ hayCambios: true });

    await act(async () => {
      await result.current.usar(PLANES[1]);
    });

    expect(obtenerPlanAnioAnterior).toHaveBeenCalledWith(200, 3);
    expect(onUsarTexto).toHaveBeenCalledTimes(1);
  });

  it("si el backend lo rechaza, muestra su mensaje y no toca el formulario", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    obtenerPlanAnioAnterior.mockRejectedValue({
      response: { status: 403, data: { detail: "Ese plan no es del año pasado de esta clase." } },
    });
    const { result, onUsarTexto, onMensaje } = await conPlanes();

    await act(async () => {
      await result.current.usar(PLANES[0]);
    });

    expect(onUsarTexto).not.toHaveBeenCalled();
    expect(onMensaje).toHaveBeenCalledWith("Ese plan no es del año pasado de esta clase.");
    consoleError.mockRestore();
  });

  it("marca cuál se está usando mientras llega el texto", async () => {
    let responder;
    obtenerPlanAnioAnterior.mockImplementation(
      () => new Promise((resolve) => { responder = resolve; }),
    );
    const { result } = await conPlanes();

    let uso;
    act(() => {
      uso = result.current.usar(PLANES[1]);
    });
    await waitFor(() => expect(result.current.usandoId).toBe(3));

    await act(async () => {
      responder(TEXTO);
      await uso;
    });
    expect(result.current.usandoId).toBeNull();
  });

  it("descarta el texto si mientras llegaba se cambió de clase", async () => {
    let responder;
    obtenerPlanAnioAnterior.mockImplementation(
      () => new Promise((resolve) => { responder = resolve; }),
    );
    const { result, rerender, inicial, onUsarTexto } = await conPlanes();

    let uso;
    act(() => {
      uso = result.current.usar(PLANES[0]);
    });
    rerender({ ...inicial, asignacionId: 210 });
    await act(async () => {
      responder(TEXTO);
      await uso;
    });

    expect(onUsarTexto).not.toHaveBeenCalled();
  });
});
