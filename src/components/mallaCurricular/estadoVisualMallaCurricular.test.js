import { describe, expect, it } from "vitest";
import { obtenerEstadoVisualMallaCurricular } from "./estadoVisualMallaCurricular";

const estado = (overrides = {}) => ({
  cargando: false,
  guardado: false,
  modificado: false,
  guardadoEn: null,
  ...overrides,
});

describe("obtenerEstadoVisualMallaCurricular", () => {
  it("prioriza la verificación mientras carga la consulta", () => {
    expect(obtenerEstadoVisualMallaCurricular({
      estadoGuardado: estado({ guardado: true, modificado: true }),
      loading: true,
    })).toEqual(expect.objectContaining({
      label: "Verificando",
      detail: "Consultando malla del periodo",
      buttonText: "Guardar Planeador",
    }));
  });

  it("presenta los cambios pendientes antes del estado guardado", () => {
    expect(obtenerEstadoVisualMallaCurricular({
      estadoGuardado: estado({ guardado: true, modificado: true }),
      loading: false,
    })).toEqual(expect.objectContaining({
      label: "Cambios sin guardar",
      detail: "Hay ediciones pendientes",
      buttonText: "Guardar cambios",
    }));
  });

  it("conserva la hora de actualización cuando la malla está guardada", () => {
    expect(obtenerEstadoVisualMallaCurricular({
      estadoGuardado: estado({ guardado: true, guardadoEn: "03:45 p. m." }),
      loading: false,
    })).toEqual(expect.objectContaining({
      label: "Guardado",
      detail: "Actualizado 03:45 p. m.",
      buttonText: "Actualizar malla",
    }));
  });

  it("mantiene el estado pendiente cuando no existen filas guardadas", () => {
    expect(obtenerEstadoVisualMallaCurricular({
      estadoGuardado: estado(),
      loading: false,
    })).toEqual(expect.objectContaining({
      label: "Pendiente",
      detail: "Aún no se ha guardado",
      buttonText: "Guardar Planeador",
    }));
  });
});
