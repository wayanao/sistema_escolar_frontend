import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  guardarDecisionSalida: vi.fn(),
  listarCandidatosMatricula: vi.fn(),
  listarCursos: vi.fn(),
  obtenerResumenAnio: vi.fn(),
  promoverEstudiantes: vi.fn(),
}));

vi.mock("../../services/aniosLectivosApi", () => ({
  guardarDecisionSalida: mocks.guardarDecisionSalida,
  listarCandidatosMatricula: mocks.listarCandidatosMatricula,
  obtenerResumenAnio: mocks.obtenerResumenAnio,
  promoverEstudiantes: mocks.promoverEstudiantes,
}));
vi.mock("../../services/cursosApi", () => ({
  listarCursos: mocks.listarCursos,
}));

import usePreparacionMatriculas from "./usePreparacionMatriculas";

const PREPARACION = { id: 3, anio: 2027, estado: "preparacion" };
const RESUMEN = {
  anio_lectivo: PREPARACION,
  resumen: { estudiantes_matriculados: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listarCursos.mockResolvedValue([{ id: 10, nombre: "PRIMERO A" }]);
  mocks.listarCandidatosMatricula.mockResolvedValue({
    candidatos: [
      {
        id: 1,
        nombre: "Ana",
        apellido: "Rojas",
        matriculado_en_destino: false,
      },
    ],
  });
  mocks.promoverEstudiantes.mockResolvedValue({
    cantidad_matriculados: 1,
    matriculados: [1],
    valores_especiales_copiados: [],
  });
});

describe("usePreparacionMatriculas", () => {
  it("detiene la carga de candidatos si se limpia el curso de origen", async () => {
    let resolverCandidatos;
    mocks.obtenerResumenAnio.mockResolvedValue(RESUMEN);
    mocks.listarCandidatosMatricula.mockImplementation(
      () => new Promise((resolve) => {
        resolverCandidatos = resolve;
      }),
    );
    const { result } = renderHook(() => usePreparacionMatriculas(PREPARACION));

    await waitFor(() => expect(result.current.cursosOrigen).toHaveLength(1));
    act(() => result.current.cambiarCursoOrigen("10"));
    await waitFor(() => expect(result.current.cargandoCandidatos).toBe(true));

    act(() => result.current.cambiarCursoOrigen(""));

    expect(result.current.cargandoCandidatos).toBe(false);
    resolverCandidatos({ candidatos: [] });
  });

  it("no presenta como fallida una matrícula guardada si solo falla el resumen", async () => {
    mocks.obtenerResumenAnio
      .mockResolvedValueOnce(RESUMEN)
      .mockRejectedValueOnce(new Error("Resumen no disponible"));
    const { result } = renderHook(() => usePreparacionMatriculas(PREPARACION));

    await waitFor(() => expect(result.current.cursosOrigen).toHaveLength(1));
    act(() => result.current.cambiarCursoOrigen("10"));
    await waitFor(() => expect(result.current.seleccionados).toEqual([1]));
    act(() => result.current.setCursoDestinoId("20"));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.promover();
    });

    expect(respuesta.estado).toBe("exito");
    expect(result.current.resultadoPromocion.cantidad_matriculados).toBe(1);
    expect(result.current.error).toBe(
      "La matrícula se completó, pero no se pudo actualizar el resumen.",
    );
  });
});

describe("usePreparacionMatriculas: marca de salida (paso 6.6)", () => {
  const CANDIDATOS = [
    { id: 1, nombre: "Ana", apellido: "Rojas", matriculado_en_destino: false, estado_salida: null },
    { id: 2, nombre: "Luis", apellido: "Pardo", matriculado_en_destino: false, estado_salida: "retirado" },
    { id: 3, nombre: "Sara", apellido: "Díaz", matriculado_en_destino: true, estado_salida: null },
  ];

  async function conCandidatos() {
    mocks.obtenerResumenAnio.mockResolvedValue(RESUMEN);
    mocks.listarCandidatosMatricula.mockResolvedValue({ candidatos: CANDIDATOS });
    const hook = renderHook(() => usePreparacionMatriculas(PREPARACION));
    await waitFor(() => expect(hook.result.current.cursosOrigen).toHaveLength(1));
    act(() => hook.result.current.cambiarCursoOrigen("10"));
    await waitFor(() => expect(hook.result.current.candidatos).toHaveLength(3));
    return hook;
  }

  it("no preselecciona a quien ya está marcado ni a quien ya está matriculado", async () => {
    const { result } = await conCandidatos();

    expect(result.current.seleccionados).toEqual([1]);
  });

  it("marca la salida, actualiza la tarjeta y lo saca de la selección", async () => {
    mocks.guardarDecisionSalida.mockResolvedValue({ cantidad: 1 });
    const { result } = await conCandidatos();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.marcarSalida(1, "egresado");
    });

    expect(respuesta.estado).toBe("exito");
    expect(mocks.guardarDecisionSalida).toHaveBeenCalledWith(3, {
      estudiante_ids: [1],
      estado_salida: "egresado",
    });
    expect(result.current.candidatos[0].estado_salida).toBe("egresado");
    expect(result.current.seleccionados).toEqual([]);
    expect(result.current.guardandoSalidaId).toBe(null);
  });

  it("quitar la marca no lo vuelve a seleccionar solo", async () => {
    mocks.guardarDecisionSalida.mockResolvedValue({ cantidad: 1 });
    const { result } = await conCandidatos();

    await act(async () => {
      await result.current.marcarSalida(2, null);
    });

    expect(mocks.guardarDecisionSalida).toHaveBeenCalledWith(3, {
      estudiante_ids: [2],
      estado_salida: null,
    });
    expect(result.current.candidatos[1].estado_salida).toBe(null);
    expect(result.current.seleccionados).toEqual([1]);
  });

  it("muestra el rechazo del backend tal cual y no cambia la tarjeta", async () => {
    mocks.guardarDecisionSalida.mockRejectedValue({
      response: {
        data: { detail: "Los estudiantes 1 ya tienen matrícula en 2027; no se pueden marcar como que no siguen." },
      },
    });
    const { result } = await conCandidatos();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.marcarSalida(1, "retirado");
    });

    expect(respuesta.estado).toBe("error");
    expect(result.current.error).toBe(
      "Los estudiantes 1 ya tienen matrícula en 2027; no se pueden marcar como que no siguen.",
    );
    expect(result.current.candidatos[0].estado_salida).toBe(null);
    expect(result.current.seleccionados).toEqual([1]);
    expect(result.current.guardandoSalidaId).toBe(null);
  });
});
