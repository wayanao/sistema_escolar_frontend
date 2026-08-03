import { describe, expect, it } from "vitest";
import {
  CANTIDAD_FILAS_PLANEADOR,
  construirPayloadPlaneadores,
  crearFilaVacia,
  crearFilasVacias,
  filaTieneContenido,
  mapearPlaneadoresPorSlot,
  validarFilasPlaneador,
} from "./planeadorAnual";

const planeadorGuardado = (overrides = {}) => ({
  slot: 1,
  unidad_tematica: "Ecosistemas",
  estandar_competencia: "Explica relaciones",
  contenido: "Cadenas tróficas",
  actividades_recursos: "Mapa conceptual",
  fecha: "2026-08-20T00:00:00.000Z",
  ...overrides,
});

describe("utilidades del planeador anual", () => {
  it("crea ocho filas independientes con el contrato inicial", () => {
    const filas = crearFilasVacias();

    expect(filas).toHaveLength(CANTIDAD_FILAS_PLANEADOR);
    expect(filas[0]).toEqual(crearFilaVacia());
    expect(filas[0]).not.toBe(filas[1]);
  });

  it("solo considera contenido los campos curriculares con texto visible", () => {
    expect(filaTieneContenido({ ...crearFilaVacia(), contenido: "  Tema  " })).toBe(true);
    expect(filaTieneContenido({ ...crearFilaVacia(), contenido: "   " })).toBe(false);
    expect(filaTieneContenido({ ...crearFilaVacia(), fecha: "2026-08-20" })).toBe(false);
  });

  it("conserva la posición indicada por slot aunque la respuesta llegue desordenada", () => {
    const filas = mapearPlaneadoresPorSlot([
      planeadorGuardado({ slot: 3, unidad_tematica: "Tercera" }),
      planeadorGuardado({ slot: 1, unidad_tematica: "Primera" }),
    ]);

    expect(filas).toHaveLength(CANTIDAD_FILAS_PLANEADOR);
    expect(filas[0].unidad_tematica).toBe("Primera");
    expect(filas[1]).toEqual(crearFilaVacia());
    expect(filas[2].unidad_tematica).toBe("Tercera");
    expect(filas[2].fecha).toBe("2026-08-20");
  });

  it("mantiene el respaldo histórico por índice cuando slot es inválido", () => {
    const filas = mapearPlaneadoresPorSlot([
      planeadorGuardado({ slot: null, unidad_tematica: "Primera por índice" }),
      planeadorGuardado({ slot: 12, unidad_tematica: "Segunda por índice" }),
    ]);

    expect(filas[0].unidad_tematica).toBe("Primera por índice");
    expect(filas[1].unidad_tematica).toBe("Segunda por índice");
  });

  it("normaliza el payload sin eliminar los ocho slots vacíos", () => {
    const filas = crearFilasVacias();
    filas[0] = {
      ...filas[0],
      unidad_tematica: "  Ecosistemas  ",
      contenido: "  Redes alimentarias ",
      fecha: "2026-08-20",
    };

    const payload = construirPayloadPlaneadores(filas);

    expect(payload).toHaveLength(CANTIDAD_FILAS_PLANEADOR);
    expect(payload[0]).toEqual({
      unidad_tematica: "Ecosistemas",
      estandar_competencia: "",
      contenido: "Redes alimentarias",
      actividades_recursos: "",
      fecha: "2026-08-20",
    });
    expect(payload[1]).toEqual({
      unidad_tematica: "",
      estandar_competencia: "",
      contenido: "",
      actividades_recursos: "",
      fecha: null,
    });
  });

  it("detecta contenido sin fecha y fecha sin contenido por separado", () => {
    const resultado = validarFilasPlaneador([
      { ...crearFilaVacia(), contenido: "Tema" },
      { ...crearFilaVacia(), fecha: "2026-08-20" },
      crearFilaVacia(),
    ]);

    expect(resultado).toEqual({
      filaSinFecha: 0,
      filaSoloConFecha: 1,
      filasDiligenciadas: 1,
    });
  });
});
