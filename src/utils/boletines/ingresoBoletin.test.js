import { describe, expect, it } from "vitest";

import {
  aplicarLogrosEnGrupo,
  construirPayloadBoletin,
  correspondeFormularioAEstudiante,
  crearDatosBoletinInicial,
  crearEstadoGuardadoInicial,
  deduplicarClases,
  formatearEtiquetaNota,
  normalizarEstudiantesReferencia,
} from "./ingresoBoletin";

describe("utilidades de ingreso docente a boletines", () => {
  it("deduplica curso y materia prefiriendo la asignación seleccionada", () => {
    const anterior = { id: 1, curso: "Quinto", materia: "Lenguaje" };
    const actual = { id: 2, curso: "Quinto", materia: "Lenguaje" };
    const otra = { id: 3, curso: "Quinto", materia: "Ciencias" };

    expect(deduplicarClases([anterior, actual, otra], "2")).toEqual([actual, otra]);
  });

  it("oculta notas internas e inicializa formularios y estados guardados", () => {
    const visibles = normalizarEstudiantesReferencia([
      {
        estudiante_id: 7,
        notas: [
          {
            tipo_nota: "actividad_uno",
            tipo_evaluacion: "numerica",
            valor: 4,
            observacion_guardada: "Bien",
          },
          { tipo_nota: "mas_alto", valor: 5 },
        ],
      },
    ]);

    expect(visibles[0].notas).toHaveLength(1);
    expect(crearDatosBoletinInicial(visibles)).toEqual({
      7: {
        definitiva: "4.00",
        observaciones: [
          {
            nota: 4,
            observacion: "Bien",
            referencia: "actividad_uno",
            tipo_evaluacion: "numerica",
            valoracion: "",
          },
        ],
      },
    });
    expect(crearEstadoGuardadoInicial(visibles)).toEqual({
      7: { guardado: true, modificado: false, guardadoEn: null },
    });
    expect(formatearEtiquetaNota("actividad_uno-extra")).toBe("Actividad Uno Extra");
  });

  it("copia por referencia solo a vacíos y conserva casos individuales", () => {
    const datos = {
      1: {
        observaciones: [
          { referencia: "logro_1", tipo_evaluacion: "numerica", observacion: "Común" },
        ],
      },
      2: {
        observaciones: [
          { referencia: "logro_1", tipo_evaluacion: "numerica", observacion: "" },
        ],
      },
      3: {
        observaciones: [
          { referencia: "logro_1", tipo_evaluacion: "numerica", observacion: "Individual" },
        ],
      },
    };

    const resultado = aplicarLogrosEnGrupo(datos, 1, true);

    expect(resultado.estudiantesModificados).toEqual(["2"]);
    expect(resultado.datosBoletin[2].observaciones[0].observacion).toBe("Común");
    expect(resultado.datosBoletin[3]).toBe(datos[3]);
  });

  it("detecta formularios transitorios que pertenecen a otra carga", () => {
    const estudiante = {
      notas: [
        { tipo_nota: "suma", tipo_evaluacion: "numerica" },
        { tipo_nota: "resta", tipo_evaluacion: "numerica" },
      ],
    };

    expect(
      correspondeFormularioAEstudiante(
        {
          observaciones: [
            { referencia: "ciencias", tipo_evaluacion: "numerica" },
          ],
        },
        estudiante,
      ),
    ).toBe(false);
    expect(
      correspondeFormularioAEstudiante(
        {
          observaciones: [
            { referencia: "suma", tipo_evaluacion: "numerica" },
            { referencia: "resta", tipo_evaluacion: "numerica" },
          ],
        },
        estudiante,
      ),
    ).toBe(true);
  });

  it("permite sobrescribir todos usando el índice como respaldo", () => {
    const datos = {
      1: { observaciones: [{ referencia: "origen", observacion: "Común" }] },
      2: { observaciones: [{ referencia: "distinta", observacion: "Individual" }] },
    };

    const resultado = aplicarLogrosEnGrupo(datos, 1, false);

    expect(resultado.estudiantesModificados).toEqual(["2"]);
    expect(resultado.datosBoletin[2].observaciones[0].observacion).toBe("Común");
  });

  it("construye sin reinterpretar payloads numéricos y de desarrollo", () => {
    const numerico = construirPayloadBoletin({
      datosBoletin: {
        8: {
          definitiva: "3.50",
          observaciones: [
            {
              nota: "4",
              observacion: "Avanza",
              tipo_evaluacion: "numerica",
              valoracion: "",
            },
          ],
        },
      },
      estudianteId: 8,
      asignacionId: "55",
      periodo: "2",
    });
    expect(numerico).toEqual({
      estudiante_id: 8,
      asignacion_id: 55,
      periodo: 2,
      definitiva: 3.5,
      detalles: [
        {
          nota: 4,
          observacion: "Avanza",
          tipo_evaluacion: "numerica",
          valoracion: null,
        },
      ],
    });

    const desarrollo = construirPayloadBoletin({
      datosBoletin: {
        9: {
          definitiva: 0,
          observaciones: [
            {
              nota: 5,
              observacion: "Participa",
              tipo_evaluacion: "desarrollo",
              valoracion: "logrado",
            },
          ],
        },
      },
      estudianteId: 9,
      asignacionId: "55",
      periodo: "2",
    });
    expect(desarrollo.definitiva).toBeNull();
    expect(desarrollo.detalles[0]).toEqual({
      nota: null,
      observacion: "Participa",
      tipo_evaluacion: "desarrollo",
      valoracion: "logrado",
    });
  });
});
