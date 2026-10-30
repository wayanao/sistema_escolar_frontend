import { describe, expect, it } from "vitest";
import {
  CONTEOS_VACIOS,
  FILTRO_TODOS,
  FILTROS_RESULTADO,
  LISTA_ADMISIONES_VACIA,
  conteoDeFiltro,
  etiquetaResultado,
  filtrarAdmisiones,
  leerUsoEntrevista,
  mensajeDeErrorAdmision,
  normalizarListaAdmisiones,
} from "./admisiones";

// 2026-10-30: la entrevista solo en los colegios que la usan.
describe("leerUsoEntrevista", () => {
  it("lee lo que dice el backend en GET /tenant/status", () => {
    expect(leerUsoEntrevista({ estado: "activo", usa_entrevista_admision: true })).toBe(true);
    expect(leerUsoEntrevista({ estado: "activo", usa_entrevista_admision: false })).toBe(false);
  });

  it("sin el dato (un backend anterior) sigue con la entrevista, como siempre", () => {
    expect(leerUsoEntrevista({ estado: "activo" })).toBe(true);
    expect(leerUsoEntrevista(null)).toBe(true);
    expect(leerUsoEntrevista(undefined)).toBe(true);
  });
});

describe("contrato de la lista de admisiones", () => {
  it("lee la respuesta del backend tal cual la manda", () => {
    const respuesta = {
      anio_lectivo: { id: 3, anio: 2027, estado: "preparacion" },
      editable: true,
      conteos: { pendiente: 2, aprobado: 1, no_aprobado: 0, matriculado: 1, total: 3 },
      admisiones: [{ id: 7, resultado: "pendiente" }],
    };

    expect(normalizarListaAdmisiones(respuesta)).toEqual({
      anioLectivo: respuesta.anio_lectivo,
      editable: true,
      conteos: respuesta.conteos,
      admisiones: respuesta.admisiones,
    });
  });

  it("sin respuesta, o con una incompleta, no inventa permisos ni conteos", () => {
    expect(normalizarListaAdmisiones(null)).toEqual({
      anioLectivo: null,
      editable: false,
      conteos: CONTEOS_VACIOS,
      admisiones: [],
    });
    expect(normalizarListaAdmisiones({ editable: "true", conteos: { total: 4 } })).toEqual({
      anioLectivo: null,
      editable: false,
      conteos: { ...CONTEOS_VACIOS, total: 4 },
      admisiones: [],
    });
    expect(LISTA_ADMISIONES_VACIA).toEqual(normalizarListaAdmisiones(null));
  });

  it("nombra cada resultado como lo lee el colegio", () => {
    expect(etiquetaResultado("pendiente")).toBe("Pendiente");
    expect(etiquetaResultado("aprobado")).toBe("Aprobado");
    expect(etiquetaResultado("no_aprobado")).toBe("No aprobado");
    expect(etiquetaResultado("otro")).toBe("otro");
  });

  it("ofrece los filtros de los tres resultados más todos", () => {
    expect(FILTROS_RESULTADO.map((filtro) => filtro.valor)).toEqual([
      FILTRO_TODOS,
      "pendiente",
      "aprobado",
      "no_aprobado",
    ]);
  });

  it("filtra en el navegador, sin volver a pedir la lista", () => {
    const admisiones = [
      { id: 1, resultado: "pendiente" },
      { id: 2, resultado: "aprobado" },
      { id: 3, resultado: "no_aprobado" },
    ];

    expect(filtrarAdmisiones(admisiones, FILTRO_TODOS)).toBe(admisiones);
    expect(filtrarAdmisiones(admisiones, "aprobado")).toEqual([{ id: 2, resultado: "aprobado" }]);
  });

  it("el número de cada filtro sale de los conteos del backend", () => {
    const conteos = { pendiente: 2, aprobado: 1, no_aprobado: 4, matriculado: 1, total: 7 };

    expect(conteoDeFiltro(conteos, FILTRO_TODOS)).toBe(7);
    expect(conteoDeFiltro(conteos, "no_aprobado")).toBe(4);
  });
});

describe("mensajes de error de admisiones", () => {
  it("muestra el texto del backend tal cual", () => {
    const error = { response: { data: { detail: "El año lectivo 2026 no está en preparación." } } };

    expect(mensajeDeErrorAdmision(error, "respaldo")).toBe(
      "El año lectivo 2026 no está en preparación.",
    );
  });

  it("une los errores de validación (422) sin el prefijo técnico", () => {
    const error = {
      response: {
        data: {
          detail: [
            { msg: "Value error, La autorización de datos es obligatoria." },
            { msg: "Field required" },
          ],
        },
      },
    };

    expect(mensajeDeErrorAdmision(error, "respaldo")).toBe(
      "La autorización de datos es obligatoria.\nField required",
    );
  });

  it("sin detalle usa el mensaje de respaldo", () => {
    expect(mensajeDeErrorAdmision(new Error("red"), "No se pudo guardar.")).toBe(
      "No se pudo guardar.",
    );
    expect(mensajeDeErrorAdmision({ response: { data: { detail: "  " } } }, "Respaldo")).toBe(
      "Respaldo",
    );
  });
});
