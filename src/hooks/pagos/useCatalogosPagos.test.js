import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pagosApi from "../../services/pagosApi";
import useCatalogosPagos from "./useCatalogosPagos";

vi.mock("../../services/pagosApi", () => ({
  default: {
    obtenerEstudiantes: vi.fn(),
    obtenerCursos: vi.fn(),
    obtenerTiposPagos: vi.fn(),
  },
}));

describe("useCatalogosPagos", () => {
  beforeEach(() => {
    pagosApi.obtenerEstudiantes.mockReset();
    pagosApi.obtenerCursos.mockReset();
    pagosApi.obtenerTiposPagos.mockReset();
  });

  it("carga estudiantes, cursos y tipos activos al montarse", async () => {
    pagosApi.obtenerEstudiantes.mockResolvedValue([{ id: 7, nombre: "Ana" }]);
    pagosApi.obtenerCursos.mockResolvedValue([{ id: 5, nombre: "Quinto" }]);
    pagosApi.obtenerTiposPagos.mockResolvedValue([
      { id: 11, activo: true },
      { id: 12, activo: false },
      { id: 13 },
    ]);

    const { result } = renderHook(() => useCatalogosPagos());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.estudiantes).toEqual([{ id: 7, nombre: "Ana" }]);
    expect(result.current.cursos).toEqual([{ id: 5, nombre: "Quinto" }]);
    expect(result.current.tiposPagos).toEqual([
      { id: 11, activo: true },
      { id: 13 },
    ]);
    expect(pagosApi.obtenerEstudiantes).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerCursos).toHaveBeenCalledTimes(1);
    expect(pagosApi.obtenerTiposPagos).toHaveBeenCalledTimes(1);
  });

  it("conserva fallbacks y notifica el error de estudiantes", async () => {
    const error = new Error("sin conexión");
    const alErrorEstudiantes = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    pagosApi.obtenerEstudiantes.mockRejectedValue(error);
    pagosApi.obtenerCursos.mockRejectedValue(error);
    pagosApi.obtenerTiposPagos.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useCatalogosPagos({ alErrorEstudiantes })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.estudiantes).toEqual([]);
    expect(result.current.cursos).toEqual([]);
    expect(result.current.tiposPagos).toEqual([]);
    expect(alErrorEstudiantes).toHaveBeenCalledWith(error);
    expect(consoleError).toHaveBeenCalledTimes(3);
    consoleError.mockRestore();
  });
});
