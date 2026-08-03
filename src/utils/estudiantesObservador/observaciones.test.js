import { describe, expect, it } from "vitest";
import {
  construirGuardadoObservacion,
  crearEstadoGuardadoObservacion,
  normalizarObservacionGuardada,
} from "./observaciones";

describe("contratos puros del observador", () => {
  it("crea el estado visual inicial y permite representar un registro pendiente", () => {
    expect(crearEstadoGuardadoObservacion()).toEqual({
      cargando: true,
      guardado: false,
      modificado: false,
      guardadoEn: null,
    });
    expect(crearEstadoGuardadoObservacion({ cargando: false })).toEqual({
      cargando: false,
      guardado: false,
      modificado: false,
      guardadoEn: null,
    });
  });

  it("normaliza dimensiones ausentes y detecta contenido real", () => {
    expect(
      normalizarObservacionGuardada({
        conductual: " Participa ",
        cognitivo: null,
      }),
    ).toEqual({
      conductual: " Participa ",
      cognitivo: "",
      lenguaje: "",
      tieneObservacion: true,
    });

    expect(
      normalizarObservacionGuardada({
        conductual: "   ",
        cognitivo: "",
        lenguaje: null,
      }).tieneObservacion,
    ).toBe(false);
  });

  it("recorta dimensiones y construye el payload parcial vigente", () => {
    expect(
      construirGuardadoObservacion({
        estudianteId: 12,
        asignacionId: "44",
        periodo: 3,
        conductual: " Avance ",
        cognitivo: "",
        lenguaje: "  ",
      }),
    ).toEqual({
      valores: {
        conductual: "Avance",
        cognitivo: "",
        lenguaje: "",
      },
      dimensionesDiligenciadas: 1,
      payload: {
        estudiante_id: 12,
        asignacion_id: 44,
        periodo: 3,
        conductual: "Avance",
        cognitivo: "",
        lenguaje: "",
      },
    });
  });
});
