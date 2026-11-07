import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerReferenciaMock } = vi.hoisted(() => ({
  obtenerReferenciaMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  obtenerReferenciaBoletin: obtenerReferenciaMock,
}));

import useConsultaOtrasMateriasBoletin from "./useConsultaOtrasMateriasBoletin";

const ciencias = { id: 56, curso: "QUINTO A", curso_id: 5, materia: "CIENCIAS" };
const ingles = { id: 58, curso: "QUINTO A", curso_id: 5, materia: "INGLÉS" };
const dosClases = [ciencias, ingles];
const sinClases = [];

const referencia = (materia) => [
  {
    estudiante_id: 7,
    nombre: "Ana",
    notas: [
      { tipo_nota: materia, tipo_evaluacion: "numerica", valor: 4, observacion_guardada: "" },
      // Las notas técnicas se ocultan igual que en la pantalla.
      { tipo_nota: "mas_alto", tipo_evaluacion: "numerica", valor: 5, observacion_guardada: "" },
    ],
  },
];

describe("useConsultaOtrasMateriasBoletin", () => {
  beforeEach(() => {
    obtenerReferenciaMock.mockReset();
    obtenerReferenciaMock.mockImplementation((id) =>
      Promise.resolve(referencia(id === 56 ? "experimento" : "speaking")),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("con la vista previa cerrada no consulta nada", () => {
    const { result } = renderHook(() =>
      useConsultaOtrasMateriasBoletin({ otrasClases: dosClases, periodo: "2", activa: false }),
    );
    expect(obtenerReferenciaMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({ materias: [], cargando: false });
  });

  it("sin otras materias en el curso no consulta ni muestra cargando", () => {
    const { result } = renderHook(() =>
      useConsultaOtrasMateriasBoletin({ otrasClases: sinClases, periodo: "2", activa: true }),
    );
    expect(obtenerReferenciaMock).not.toHaveBeenCalled();
    expect(result.current.cargando).toBe(false);
  });

  it("al abrir consulta cada otra materia una sola vez por clase y periodo", async () => {
    const { result, rerender } = renderHook((props) => useConsultaOtrasMateriasBoletin(props), {
      initialProps: { otrasClases: dosClases, periodo: "2", activa: true },
    });

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerReferenciaMock).toHaveBeenCalledTimes(2);
    expect(obtenerReferenciaMock).toHaveBeenCalledWith(56, "2", { signal: expect.any(AbortSignal) });
    expect(obtenerReferenciaMock).toHaveBeenCalledWith(58, "2", { signal: expect.any(AbortSignal) });
    expect(result.current.materias.map((m) => [m.clase.materia, m.error])).toEqual([
      ["CIENCIAS", false],
      ["INGLÉS", false],
    ]);
    expect(result.current.materias[0].estudiantes[0].notas.map((n) => n.tipo_nota)).toEqual([
      "experimento",
    ]);

    // Cerrar y volver a abrir no vuelve a consultar.
    rerender({ otrasClases: dosClases, periodo: "2", activa: false });
    rerender({ otrasClases: dosClases, periodo: "2", activa: true });
    expect(result.current.cargando).toBe(false);
    expect(obtenerReferenciaMock).toHaveBeenCalledTimes(2);

    // Otro periodo sí.
    rerender({ otrasClases: dosClases, periodo: "3", activa: true });
    expect(result.current.materias).toEqual([]);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerReferenciaMock).toHaveBeenCalledTimes(4);
    expect(obtenerReferenciaMock).toHaveBeenLastCalledWith(58, "3", { signal: expect.any(AbortSignal) });
  });

  it("si una falla, deja las demás y lo reintenta al volver a abrir", async () => {
    obtenerReferenciaMock.mockImplementation((id) =>
      id === 58 ? Promise.reject(new Error("sin red")) : Promise.resolve(referencia("experimento")),
    );
    const { result, rerender } = renderHook((props) => useConsultaOtrasMateriasBoletin(props), {
      initialProps: { otrasClases: dosClases, periodo: "2", activa: true },
    });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.materias.map((m) => m.error)).toEqual([false, true]);

    obtenerReferenciaMock.mockImplementation((id) =>
      Promise.resolve(referencia(id === 56 ? "experimento" : "speaking")),
    );
    rerender({ otrasClases: dosClases, periodo: "2", activa: false });
    rerender({ otrasClases: dosClases, periodo: "2", activa: true });

    await waitFor(() => expect(result.current.materias.map((m) => m.error)).toEqual([false, false]));
    expect(obtenerReferenciaMock).toHaveBeenCalledTimes(4);
  });

  it("al cerrar mientras carga, cancela y no deja la respuesta vieja", async () => {
    let resolver;
    obtenerReferenciaMock.mockImplementation(
      (_id, _periodo, { signal }) =>
        new Promise((resolve, reject) => {
          resolver = resolve;
          signal.addEventListener("abort", () => reject(new Error("cancelada")));
        }),
    );
    const { result, rerender } = renderHook((props) => useConsultaOtrasMateriasBoletin(props), {
      initialProps: { otrasClases: [ciencias], periodo: "2", activa: true },
    });
    expect(result.current.cargando).toBe(true);

    rerender({ otrasClases: [ciencias], periodo: "2", activa: false });
    resolver(referencia("experimento"));
    await Promise.resolve();
    expect(result.current).toEqual({ materias: [], cargando: false });
  });
});
