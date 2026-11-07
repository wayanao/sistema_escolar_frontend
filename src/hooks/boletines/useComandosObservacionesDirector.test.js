import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { guardarObservacionMock } = vi.hoisted(() => ({
  guardarObservacionMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  guardarObservacionGeneral: guardarObservacionMock,
}));

import useComandosObservacionesDirector from "./useComandosObservacionesDirector";

const CLAVE = "borrador_boletin:observaciones:tenant_demo:7:5:2";
const datosDe = (observaciones = {}) => ({
  curso: { id: 5, nombre: "QUINTO A" },
  periodo: 2,
  estudiantes: [
    { estudianteId: 101, nombre: "Pérez Ana", observacionGeneral: observaciones[101] ?? "" },
    { estudianteId: 102, nombre: "Gil Bruno", observacionGeneral: observaciones[102] ?? "" },
  ],
});
const leerBorrador = () => JSON.parse(localStorage.getItem(CLAVE) || "null");

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("profesor", JSON.stringify({ id: 7, tenant: "tenant_demo" }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  guardarObservacionMock.mockImplementation(async (_curso, _periodo, estudianteId, texto) => ({
    estudiante_id: estudianteId,
    texto,
  }));
});

describe("useComandosObservacionesDirector", () => {
  it("muestra lo guardado y marca lo que cambia como sin guardar, en el borrador", () => {
    const datos = datosDe({ 101: "Buen periodo." });
    const { result } = renderHook(() => useComandosObservacionesDirector({ datos }));

    expect(result.current.estadoDe(101)).toMatchObject({ texto: "Buen periodo.", sinGuardar: false });
    expect(result.current.estadoDe(102)).toMatchObject({ texto: "", sinGuardar: false });
    expect(leerBorrador()).toBeNull();

    act(() => result.current.cambiarObservacion(102, "Debe repasar las tablas."));
    expect(result.current.estadoDe(102)).toMatchObject({ texto: "Debe repasar las tablas.", sinGuardar: true });
    expect(leerBorrador()).toMatchObject({ textos: { 102: "Debe repasar las tablas." } });
  });

  it("no deja pasar de 500 caracteres", () => {
    const datos = datosDe();
    const { result } = renderHook(() => useComandosObservacionesDirector({ datos }));
    act(() => result.current.cambiarObservacion(101, "a".repeat(600)));
    expect(result.current.estadoDe(101).texto).toHaveLength(500);
  });

  it("guardar envía el texto limpio, queda guardada y sale del borrador", async () => {
    const datos = datosDe();
    const { result } = renderHook(() => useComandosObservacionesDirector({ datos }));
    act(() => result.current.cambiarObservacion(101, "  Excelente.\r\nSigue así.  "));

    await act(async () => {
      await result.current.guardarObservacion(101);
    });

    expect(guardarObservacionMock).toHaveBeenCalledWith(5, 2, 101, "Excelente.\nSigue así.");
    expect(result.current.estadoDe(101)).toMatchObject({
      texto: "Excelente.\nSigue así.",
      sinGuardar: false,
      guardadaEn: expect.any(String),
    });
    expect(leerBorrador()).toBeNull();
  });

  it("si falla, lo dice y lo escrito sigue ahí, sin guardar", async () => {
    guardarObservacionMock.mockRejectedValueOnce(new Error("sin red"));
    const datos = datosDe();
    const { result } = renderHook(() => useComandosObservacionesDirector({ datos }));
    act(() => result.current.cambiarObservacion(101, "Texto"));

    await act(async () => {
      await result.current.guardarObservacion(101);
    });

    expect(result.current.estadoDe(101)).toMatchObject({ texto: "Texto", sinGuardar: true, error: true });
    expect(leerBorrador()).toMatchObject({ textos: { 101: "Texto" } });
  });

  it("al volver, recupera lo que no se había guardado y lo cuenta", () => {
    localStorage.setItem(CLAVE, JSON.stringify({ actualizado: "x", textos: { 102: "Lo de antes", 999: "No está" } }));
    const datos = datosDe();
    const { result } = renderHook(() => useComandosObservacionesDirector({ datos }));

    expect(result.current.estadoDe(102)).toMatchObject({ texto: "Lo de antes", sinGuardar: true });
    expect(result.current.recuperadas).toBe(1);
  });

  it("con otro curso o periodo, otro borrador: no se cruzan", async () => {
    const { result, rerender } = renderHook((props) => useComandosObservacionesDirector(props), {
      initialProps: { datos: datosDe() },
    });
    act(() => result.current.cambiarObservacion(101, "Del periodo 2"));

    rerender({ datos: { ...datosDe(), periodo: 3 } });
    await waitFor(() => expect(result.current.estadoDe(101).texto).toBe(""));
    expect(leerBorrador()).toMatchObject({ textos: { 101: "Del periodo 2" } });
  });

  it("sin ranking no hace nada", async () => {
    const { result } = renderHook(() => useComandosObservacionesDirector({ datos: null }));
    await act(async () => {
      await result.current.guardarObservacion(101);
    });
    expect(guardarObservacionMock).not.toHaveBeenCalled();
    expect(result.current.estadoDe(101).texto).toBe("");
  });
});
