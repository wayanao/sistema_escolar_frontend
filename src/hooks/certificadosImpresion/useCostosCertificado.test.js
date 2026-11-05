import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import useCostosCertificado from "./useCostosCertificado";

const INICIALES = [
  { id: "concepto-1", concepto: "Matrícula", valor: "280000" },
  { id: "concepto-2", concepto: "Pensión", valor: "130000" },
];

describe("useCostosCertificado", () => {
  it("empieza con los costos del estudiante y los cambia, quita y agrega", () => {
    const { result } = renderHook(() => useCostosCertificado(INICIALES));
    expect(result.current.costos).toEqual(INICIALES);

    act(() => result.current.cambiarCosto("concepto-2", "valor", "150000"));
    act(() => result.current.cambiarCosto("concepto-2", "concepto", "Pensión mensual"));
    act(() => result.current.quitarCosto("concepto-1"));
    let id;
    act(() => {
      id = result.current.agregarCosto();
    });

    expect(result.current.costos).toEqual([
      { id: "concepto-2", concepto: "Pensión mensual", valor: "150000" },
      { id, concepto: "", valor: "" },
    ]);
    // Los de entrada no cambian: lo editado es solo para esta impresión.
    expect(INICIALES[1].valor).toBe("130000");
  });

  it("sin costos, empieza vacío y da ids distintos a cada fila nueva", () => {
    const { result } = renderHook(() => useCostosCertificado(undefined));
    expect(result.current.costos).toEqual([]);

    act(() => {
      result.current.agregarCosto();
      result.current.agregarCosto();
    });
    const [primero, segundo] = result.current.costos;
    expect(primero.id).not.toBe(segundo.id);
  });
});
