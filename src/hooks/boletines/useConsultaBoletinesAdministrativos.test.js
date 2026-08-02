import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  generarBoletinMock,
  listarCursosMock,
  listarEstudiantesMock,
} = vi.hoisted(() => ({
  generarBoletinMock: vi.fn(),
  listarCursosMock: vi.fn(),
  listarEstudiantesMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  generarBoletinAdministrativo: generarBoletinMock,
  listarCursosBoletines: listarCursosMock,
  listarEstudiantesBoletines: listarEstudiantesMock,
}));

import useConsultaBoletinesAdministrativos from "./useConsultaBoletinesAdministrativos";

beforeEach(() => {
  vi.clearAllMocks();
  listarCursosMock.mockResolvedValue([{ id: 3, nombre: "Transición" }]);
  listarEstudiantesMock.mockResolvedValue([
    { id: 8, nombre: "Sara", apellido: "López", identificacion: "TI-123", curso_id: 3 },
    { id: 9, nombre: "Luis", apellido: "Díaz", documento: "TI-456", curso_id: 4 },
  ]);
});

describe("useConsultaBoletinesAdministrativos", () => {
  it("carga la base, filtra por curso y documento y conserva el periodo", async () => {
    const { result } = renderHook(() => useConsultaBoletinesAdministrativos());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(listarCursosMock).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
    expect(listarEstudiantesMock).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });

    act(() => {
      result.current.cambiarCurso("3");
      result.current.cambiarBusqueda("TI-123");
      result.current.cambiarPeriodo("2");
    });

    expect(result.current.estudiantesFiltrados).toHaveLength(1);
    expect(result.current.estudiantesFiltrados[0].id).toBe(8);
    expect(result.current.periodo).toBe("2");
  });

  it("descarta una generación anterior y conserva solo la respuesta vigente", async () => {
    const pendientes = [];
    generarBoletinMock.mockImplementation((_estudianteId, _periodo, { signal }) =>
      new Promise((resolve) => pendientes.push({ resolve, signal })),
    );
    const { result } = renderHook(() => useConsultaBoletinesAdministrativos());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    let primera;
    let segunda;
    act(() => {
      primera = result.current.consultarBoletin(8);
      segunda = result.current.consultarBoletin(9);
    });

    expect(pendientes[0].signal.aborted).toBe(true);
    expect(pendientes[1].signal.aborted).toBe(false);

    await act(async () => {
      pendientes[1].resolve({ estudiante_nombre: "Luis" });
      await segunda;
      pendientes[0].resolve({ estudiante_nombre: "Sara" });
      await primera;
    });

    expect(result.current.boletinData).toEqual({ estudiante_nombre: "Luis" });
    expect(result.current.cargandoBoletin).toBe(false);
  });

  it("devuelve el error de generación sin decidir el mensaje visual", async () => {
    const error = { response: { data: { detail: "No disponible" } } };
    generarBoletinMock.mockRejectedValue(error);
    const { result } = renderHook(() => useConsultaBoletinesAdministrativos());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    let respuesta;
    await act(async () => {
      respuesta = await result.current.consultarBoletin(8);
    });

    expect(respuesta).toEqual({ error });
    expect(result.current.errorBoletin).toBe(error);
    expect(result.current.boletinData).toBeNull();
  });
});
