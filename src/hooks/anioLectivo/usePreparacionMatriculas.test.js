import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listarCandidatosMatricula: vi.fn(),
  listarCursos: vi.fn(),
  obtenerResumenAnio: vi.fn(),
  promoverEstudiantes: vi.fn(),
}));

vi.mock("../../services/aniosLectivosApi", () => ({
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
