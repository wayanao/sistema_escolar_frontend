import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerFirmaDirectorGrupoMock, obtenerFirmasParaImprimirMock } = vi.hoisted(() => ({
  obtenerFirmaDirectorGrupoMock: vi.fn(),
  obtenerFirmasParaImprimirMock: vi.fn(),
}));

vi.mock("../../services/observadorApi", () => ({
  obtenerFirmasParaImprimir: obtenerFirmasParaImprimirMock,
}));

vi.mock("../../services/firmasApi", () => ({
  obtenerFirmaDirectorGrupo: obtenerFirmaDirectorGrupoMock,
}));

import useFirmasImpresionObservador from "./useFirmasImpresionObservador";

const FIRMA_ACUDIENTE = { anotacion_id: 12, firmante_nombre: "Pedro Rojas", imagen: "data:image/png;base64,QQ==" };
const DIRECTOR = { director_grupo: "Marta Ruiz", imagen: "data:image/png;base64,RA==", actualizado_en: null };

beforeEach(() => {
  obtenerFirmasParaImprimirMock.mockReset().mockResolvedValue([FIRMA_ACUDIENTE]);
  obtenerFirmaDirectorGrupoMock.mockReset().mockResolvedValue(DIRECTOR);
});

describe("useFirmasImpresionObservador", () => {
  it("pide las del acudiente con el periodo y el año que se ven, y las ordena por anotación", async () => {
    const { result } = renderHook(() =>
      useFirmasImpresionObservador({
        estudianteId: 11,
        periodo: "2",
        parametrosAnio: { anio_lectivo_id: 3 },
      }),
    );

    expect(result.current.cargandoFirmas).toBe(true);
    await waitFor(() => expect(result.current.cargandoFirmas).toBe(false));

    expect(result.current.firmasAcudiente).toStrictEqual({ 12: FIRMA_ACUDIENTE });
    expect(result.current.errorFirmas).toBe(false);
    const [id, opciones] = obtenerFirmasParaImprimirMock.mock.calls[0];
    expect(id).toBe(11);
    expect(opciones.periodo).toBe(2);
    expect(opciones.parametrosAnio).toStrictEqual({ anio_lectivo_id: 3 });
    expect(opciones.signal).toBeInstanceOf(AbortSignal);
  });

  it("sin `conDirector` -el profesor- nunca pide la firma del director", async () => {
    const { result } = renderHook(() =>
      useFirmasImpresionObservador({ estudianteId: 11, periodo: "todos", parametrosAnio: {} }),
    );

    await waitFor(() => expect(result.current.cargandoFirmas).toBe(false));
    expect(obtenerFirmaDirectorGrupoMock).not.toHaveBeenCalled();
    expect(result.current.firmaDirector).toBeNull();
    // Año activo y año entero: sin parámetros de más.
    const [, opciones] = obtenerFirmasParaImprimirMock.mock.calls[0];
    expect(opciones.periodo).toBeNull();
    expect(opciones.parametrosAnio).toBeUndefined();
  });

  it("con `conDirector` -el admin- trae también la del director", async () => {
    const { result } = renderHook(() =>
      useFirmasImpresionObservador({ estudianteId: 11, periodo: "todos", conDirector: true }),
    );

    await waitFor(() => expect(result.current.cargandoFirmas).toBe(false));
    expect(result.current.firmaDirector).toStrictEqual(DIRECTOR);
    expect(obtenerFirmaDirectorGrupoMock.mock.calls[0][0]).toBe(11);
  });

  it("si falla una consulta, la otra sale igual y avisa del fallo", async () => {
    obtenerFirmaDirectorGrupoMock.mockRejectedValue(new Error("red"));

    const { result } = renderHook(() =>
      useFirmasImpresionObservador({ estudianteId: 11, periodo: "todos", conDirector: true }),
    );

    await waitFor(() => expect(result.current.cargandoFirmas).toBe(false));
    expect(result.current.errorFirmas).toBe(true);
    expect(result.current.firmaDirector).toBeNull();
    expect(result.current.firmasAcudiente).toStrictEqual({ 12: FIRMA_ACUDIENTE });
  });

  it("sin estudiante no pide nada", () => {
    const { result } = renderHook(() =>
      useFirmasImpresionObservador({ estudianteId: null, periodo: "todos", conDirector: true }),
    );

    expect(result.current.cargandoFirmas).toBe(false);
    expect(obtenerFirmasParaImprimirMock).not.toHaveBeenCalled();
    expect(obtenerFirmaDirectorGrupoMock).not.toHaveBeenCalled();
  });

  it("al desmontarse cancela lo que estaba pidiendo", () => {
    obtenerFirmasParaImprimirMock.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() =>
      useFirmasImpresionObservador({ estudianteId: 11, periodo: "todos" }),
    );

    const [, opciones] = obtenerFirmasParaImprimirMock.mock.calls[0];
    unmount();
    expect(opciones.signal.aborted).toBe(true);
  });
});
