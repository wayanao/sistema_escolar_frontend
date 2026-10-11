import { describe, expect, it } from "vitest";
import {
  crearClaveCamposRecordados,
  crearClaveSinPlanesAnioAnterior,
  crearFormDataPlanProfesor,
  ESTADO_INICIAL_PLAN,
  formatearFechaPlan,
  formatearFechaSeguimiento,
  mensajePlanBaseUsado,
  normalizarPlanesAnioAnterior,
  normalizarSeguimientoPlanProfesor,
  obtenerEstadoGuardadoVisual,
  obtenerEstadoRevisionVisual,
  textoDePlanBase,
} from "./profesor";

describe("utilidades de planeaciones del profesor", () => {
  it("resuelve el estado visual sin alterar los estados internos compatibles", () => {
    expect(obtenerEstadoRevisionVisual("pendiente", 0)).toBe("pendiente");
    expect(obtenerEstadoRevisionVisual("visto", 0)).toBe("visto");
    expect(obtenerEstadoRevisionVisual("revisado", 0)).toBe("revisado");
    expect(obtenerEstadoRevisionVisual("con_observaciones", 2)).toBe("revisado_con_observacion");
    expect(obtenerEstadoRevisionVisual("revisado", 1)).toBe("revisado_con_observacion");
  });

  it("resuelve los estados visuales de carga y guardado", () => {
    expect(obtenerEstadoGuardadoVisual({}, true)).toMatchObject({
      label: "Verificando",
      buttonText: "Guardar y enviar",
    });
    expect(
      obtenerEstadoGuardadoVisual({ modificado: true }),
    ).toMatchObject({
      label: "Cambios sin guardar",
      buttonText: "Guardar cambios",
    });
    expect(
      obtenerEstadoGuardadoVisual({
        guardado: true,
        guardadoEn: "10:30",
      }),
    ).toMatchObject({
      label: "Guardado",
      detail: "Actualizado 10:30",
      buttonText: "Actualizar plan",
    });
    expect(obtenerEstadoGuardadoVisual()).toMatchObject({
      label: "Pendiente",
      detail: "Aún no se ha guardado",
    });
  });

  it("normaliza el seguimiento recibido desde un plan", () => {
    expect(normalizarSeguimientoPlanProfesor(null)).toBeNull();
    expect(
      normalizarSeguimientoPlanProfesor({
        id: 91,
        estado_revision: "",
        version_revision: "3",
        total_observaciones: "2",
        observaciones_no_vistas: "1",
      }),
    ).toEqual({
      estado_revision: "pendiente",
      version_revision: 3,
      enviado_at: null,
      admin_visto_at: null,
      revisado_at: null,
      total_observaciones: 2,
      observaciones_no_vistas: 1,
      ultima_observacion_at: null,
    });
  });

  it("construye una clave aislada por profesor y asignación", () => {
    expect(crearClaveCamposRecordados(7, 44)).toBe("plan_clases_defaults_7_44");
    expect(crearClaveCamposRecordados(null, 44)).toBe("");
    expect(crearClaveCamposRecordados(7, "")).toBe("");
  });

  it("mantiene un estado inicial completo y sin valores heredados", () => {
    expect(ESTADO_INICIAL_PLAN).toEqual({
      unidad: "",
      proposito: "",
      clase: "",
      estandar: "",
      dba: "",
      competencias: "",
      actividad_casa: "",
      tema: "",
    });
  });

  it("construye el multipart con versión e imágenes opcionales", () => {
    const imagen1 = new File(["imagen"], "evidencia.webp", {
      type: "image/webp",
    });
    const formData = crearFormDataPlanProfesor({
      asignacionId: 44,
      planActualId: 91,
      versionRevision: 3,
      periodo: "2",
      fecha: "2026-07-28",
      form: { tema: "Fracciones", unidad: "Números" },
      imagenes: { imagen1, imagen2: null },
    });

    expect(formData.get("asignacion_id")).toBe("44");
    expect(formData.get("version_esperada")).toBe("3");
    expect(formData.get("periodo")).toBe("2");
    expect(formData.get("fecha")).toBe("2026-07-28");
    expect(formData.get("tema")).toBe("Fracciones");
    expect(formData.get("imagen1")).toBe(imagen1);
    expect(formData.has("imagen2")).toBe(false);
  });

  it("protege la interfaz frente a fechas vacías o inválidas", () => {
    expect(formatearFechaPlan("")).toBe("Sin fecha");
    expect(formatearFechaPlan("fecha-invalida")).toBe("fecha-invalida");
    expect(formatearFechaSeguimiento("")).toBe("");
    expect(formatearFechaSeguimiento("fecha-invalida")).toBe("");
  });
});

describe("planes del año pasado (año lectivo, paso 7.4)", () => {
  it("anota por profesor y clase que una clase no tiene planes del año pasado", () => {
    expect(crearClaveSinPlanesAnioAnterior(7, 44)).toBe("plan_clases_sin_anio_anterior_7_44");
    expect(crearClaveSinPlanesAnioAnterior(7, "")).toBe("");
    expect(crearClaveSinPlanesAnioAnterior(null, 44)).toBe("");
    expect(crearClaveSinPlanesAnioAnterior(7, 44)).not.toBe(crearClaveCamposRecordados(7, 44));
  });

  it("normaliza la lista del backend y descarta filas sin id", () => {
    expect(normalizarPlanesAnioAnterior([
      { id: 1, fecha: "2026-02-10", periodo: 1, unidad: "Números", tema: "Conteo" },
      { id: 2, fecha: "2026-05-12", periodo: "2", unidad: null, tema: undefined },
      { fecha: "2026-06-01", unidad: "Sin id" },
      null,
    ])).toEqual([
      { id: 1, fecha: "2026-02-10", periodo: 1, unidad: "Números", tema: "Conteo" },
      { id: 2, fecha: "2026-05-12", periodo: 2, unidad: "", tema: "" },
    ]);
    expect(normalizarPlanesAnioAnterior(null)).toEqual([]);
    expect(normalizarPlanesAnioAnterior({ detail: "x" })).toEqual([]);
  });

  it("toma solo los ocho textos del formulario: ni fecha, ni periodo, ni evidencias", () => {
    expect(textoDePlanBase({
      id: 1,
      unidad: "Números",
      proposito: "Contar",
      clase: "Conteo con fichas",
      estandar: "E1",
      dba: "D1",
      competencias: "C1",
      actividad_casa: "Contar en casa",
      tema: "Conteo",
      fecha: "2026-02-10",
      periodo: 3,
      imagen1: "planes/a.png",
    })).toEqual({
      unidad: "Números",
      proposito: "Contar",
      clase: "Conteo con fichas",
      estandar: "E1",
      dba: "D1",
      competencias: "C1",
      actividad_casa: "Contar en casa",
      tema: "Conteo",
    });
    expect(Object.keys(textoDePlanBase({}))).toEqual(Object.keys(ESTADO_INICIAL_PLAN));
    expect(textoDePlanBase({ unidad: null, tema: 5 })).toEqual(ESTADO_INICIAL_PLAN);
  });

  it("arma el mensaje con la fecha del plan usado", () => {
    expect(mensajePlanBaseUsado("2026-02-10")).toBe(
      `Se llenó el formulario con el plan del ${formatearFechaPlan("2026-02-10")}. `
        + "Revisa el texto, ajústalo y guárdalo como un plan nuevo.",
    );
  });
});
