import { describe, expect, it } from "vitest";
import {
  crearParametrosPlanes,
  detalleError,
  fechaAnteriorISO,
  fechaLocalISO,
  formatearTextoVisual,
  normalizarRespuestaPlanes,
} from "./admin";

describe("utilidades de planeaciones administrativas", () => {
  it("normaliza respuestas paginadas y respuestas legacy", () => {
    const planes = [{ id: 1 }, { id: 2 }];

    expect(normalizarRespuestaPlanes(planes)).toEqual({ items: planes, total: 2 });
    expect(normalizarRespuestaPlanes({ items: planes, total: 18 })).toEqual({
      items: planes,
      total: 18,
    });
    expect(normalizarRespuestaPlanes({ items: planes, total: "invalido" })).toEqual({
      items: planes,
      total: 2,
    });
    expect(normalizarRespuestaPlanes(null)).toEqual({ items: [], total: 0 });
  });

  it("construye fechas ISO usando la fecha local y no UTC", () => {
    const referencia = new Date(2026, 6, 28, 23, 30);

    expect(fechaLocalISO(referencia)).toBe("2026-07-28");
    expect(fechaAnteriorISO(referencia)).toBe("2026-07-27");
  });

  it("construye los parámetros de la bandeja sin enviar filtros vacíos", () => {
    const referencia = new Date(2026, 6, 28, 12, 0);

    expect(crearParametrosPlanes({
      vista: "programadas",
      estado: "pendiente",
      filtros: { profesor_id: "7", busqueda: "" },
      limit: 12,
      offset: 24,
      fechaReferencia: referencia,
    })).toEqual({
      limit: 12,
      offset: 24,
      profesor_id: "7",
      estado_revision: "pendiente",
      fecha_desde: "2026-07-28",
    });

    expect(crearParametrosPlanes({
      vista: "realizadas",
      estado: "todos",
      fechaReferencia: referencia,
    })).toEqual({
      limit: 12,
      offset: 0,
      fecha_hasta: "2026-07-27",
    });
  });

  it("normaliza textos completamente escritos en mayúsculas", () => {
    expect(formatearTextoVisual("  MATEMÁTICAS AVANZADAS  ")).toBe("Matemáticas Avanzadas");
    expect(formatearTextoVisual("Matemáticas avanzadas")).toBe("Matemáticas avanzadas");
    expect(formatearTextoVisual(null)).toBe("");
  });

  it("prioriza el detalle de error del backend y conserva un fallback", () => {
    expect(detalleError({ response: { data: { detail: "No autorizado" } } }, "Error")).toBe("No autorizado");
    expect(detalleError({ response: { data: { detail: { mensaje: "Versión desactualizada" } } } }, "Error")).toBe(
      "Versión desactualizada",
    );
    expect(detalleError({}, "Error controlado")).toBe("Error controlado");
  });
});
