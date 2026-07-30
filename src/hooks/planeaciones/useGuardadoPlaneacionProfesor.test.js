import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { guardarPlanMock, swalFireMock } = vi.hoisted(() => ({
  guardarPlanMock: vi.fn(),
  swalFireMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  guardarPlanProfesor: guardarPlanMock,
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: swalFireMock,
  },
}));

import useGuardadoPlaneacionProfesor from "./useGuardadoPlaneacionProfesor";

function crearPropiedades(overrides = {}) {
  return {
    asignacionId: 44,
    periodo: "2",
    fecha: "2026-07-28",
    form: {
      unidad: "Números",
      proposito: "",
      clase: "",
      estandar: "",
      dba: "",
      competencias: "",
      actividad_casa: "",
      tema: "Fracciones",
    },
    imagenes: { imagen1: null, imagen2: null },
    planActualId: null,
    versionRevision: null,
    recordarCampos: vi.fn(),
    marcarGuardado: vi.fn(),
    recargarPlaneacion: vi.fn().mockResolvedValue(undefined),
    onPlanIdActualizado: vi.fn(),
    onMensaje: vi.fn(),
    onConfirmacionGuardado: vi.fn(),
    onSubirInicio: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.alert = vi.fn();
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
});

describe("useGuardadoPlaneacionProfesor", () => {
  it("guarda, recarga y confirma el resultado exitoso", async () => {
    guardarPlanMock.mockResolvedValue({
      id: 92,
      mensaje: "Plan guardado.",
    });
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useGuardadoPlaneacionProfesor(props),
    );

    await act(async () => {
      await result.current.guardarPlan();
    });
    await waitFor(() =>
      expect(props.onConfirmacionGuardado).toHaveBeenCalledTimes(1),
    );

    const formData = guardarPlanMock.mock.calls[0][0];
    expect(formData.get("asignacion_id")).toBe("44");
    expect(formData.get("version_esperada")).toBe("0");
    expect(formData.get("tema")).toBe("Fracciones");
    expect(props.recordarCampos).toHaveBeenCalledTimes(1);
    expect(props.onPlanIdActualizado).toHaveBeenCalledWith(92);
    expect(props.recargarPlaneacion).toHaveBeenCalledTimes(1);
    expect(props.onMensaje).toHaveBeenLastCalledWith("Plan guardado.");
  });

  it("mantiene los cambios locales si el profesor rechaza recargar un conflicto", async () => {
    guardarPlanMock.mockRejectedValue({
      response: {
        status: 409,
        data: { detail: { mensaje: "Versión más reciente disponible." } },
      },
    });
    swalFireMock.mockResolvedValue({ isConfirmed: false });
    const props = crearPropiedades({
      planActualId: 91,
      versionRevision: 3,
    });
    const { result } = renderHook(() =>
      useGuardadoPlaneacionProfesor(props),
    );

    await act(async () => {
      await result.current.guardarPlan();
    });

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Este plan cambió en otra pestaña",
      }),
    );
    expect(props.recargarPlaneacion).not.toHaveBeenCalled();
    expect(props.onMensaje).toHaveBeenCalledWith(
      "Tus cambios siguen visibles, pero todavía no se han guardado.",
    );
  });

  it("recarga la versión vigente cuando el profesor acepta el conflicto", async () => {
    guardarPlanMock.mockRejectedValue({
      response: { status: 409, data: { detail: {} } },
    });
    swalFireMock.mockResolvedValue({ isConfirmed: true });
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useGuardadoPlaneacionProfesor(props),
    );

    await act(async () => {
      await result.current.guardarPlan();
    });

    expect(props.recargarPlaneacion).toHaveBeenCalledTimes(1);
    expect(props.onSubirInicio).toHaveBeenCalledTimes(1);
  });

  it("conserva el formulario cuando falla la conexión y se decide seguir editando", async () => {
    guardarPlanMock.mockRejectedValue({
      code: "ERR_NETWORK",
      request: {},
    });
    swalFireMock.mockResolvedValue({ isConfirmed: false });
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    const props = crearPropiedades();
    const { result } = renderHook(() =>
      useGuardadoPlaneacionProfesor(props),
    );

    await act(async () => {
      await result.current.guardarPlan();
    });

    expect(swalFireMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sin conexión a internet" }),
    );
    expect(props.onMensaje).toHaveBeenCalledWith(
      "El plan sigue sin guardar. Tus cambios continúan en pantalla.",
    );
    expect(props.marcarGuardado).not.toHaveBeenCalled();
  });
});
