import { describe, expect, it } from "vitest";
import {
  agruparNotificacionesAdmin,
  crearRutaNotificacionProfesor,
  crearRutaPlaneacionesProfesor,
  EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES,
  formatearMomentoNotificacion,
} from "./notificacionesContratos";

describe("contratos puros de notificaciones de planeadores", () => {
  it("conserva el nombre del evento local", () => {
    expect(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES).toBe(
      "planeadores:notificaciones-actualizar",
    );
  });

  it("formatea momentos válidos y protege valores vacíos o inválidos", () => {
    const value = "2026-08-09T10:00:00Z";
    const esperado = new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

    expect(formatearMomentoNotificacion(value)).toBe(esperado);
    expect(formatearMomentoNotificacion("")).toBe("");
    expect(formatearMomentoNotificacion("fecha-invalida")).toBe("");
  });

  it("agrupa por profesor, suma cantidades y conserva la fecha más reciente", () => {
    const items = [
      {
        profesor: " Ana Torres ",
        profesor_id: 7,
        cantidad: 2,
        creada_at: "2026-08-08T10:00:00Z",
      },
      {
        profesor: "Nombre posterior",
        profesor_id: 7,
        cantidad: "3",
        creada_at: "2026-08-09T10:00:00Z",
      },
    ];

    expect(agruparNotificacionesAdmin(items)).toEqual([
      {
        id: "profesor-7",
        profesor: "Ana Torres",
        profesorId: "7",
        cantidad: 5,
        ultimaFecha: "2026-08-09T10:00:00Z",
      },
    ]);
  });

  it("agrupa por nombre cuando falta el id y aplica los fallbacks actuales", () => {
    expect(agruparNotificacionesAdmin([
      { profesor: "  ", cantidad: 0, creada_at: null },
      { profesor: "Profesor sin nombre", cantidad: -4, creada_at: null },
    ])).toEqual([
      {
        id: "profesor-profesor sin nombre",
        profesor: "Profesor sin nombre",
        profesorId: "",
        cantidad: 2,
        ultimaFecha: null,
      },
    ]);
  });

  it("construye la ruta exacta de la observación para profesor", () => {
    expect(crearRutaNotificacionProfesor({
      asignacion_id: 44,
      fecha: "2026-08-09",
      plan_id: 91,
    })).toBe(
      "/plan-de-clases?asignacion_id=44&fecha=2026-08-09&plan_id=91&observaciones=1",
    );
  });

  it("prioriza el id y usa el nombre como fallback en la bandeja administrativa", () => {
    expect(crearRutaPlaneacionesProfesor({
      profesorId: "7",
      profesor: "Ana Torres",
    })).toBe(
      "/admin/planeadores-clases?vista=todas&estado=pendiente&profesor_id=7",
    );
    expect(crearRutaPlaneacionesProfesor({
      profesorId: "",
      profesor: "Ana Torres",
    })).toBe(
      "/admin/planeadores-clases?vista=todas&estado=pendiente&busqueda=Ana+Torres",
    );
  });
});
