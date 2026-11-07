import { describe, expect, it } from "vitest";

import {
  aplicarLogrosEnGrupo,
  clasesDelMismoCurso,
  construirMateriaVistaPrevia,
  construirOtraMateriaVistaPrevia,
  construirPayloadBoletin,
  correspondeFormularioAEstudiante,
  crearDatosBoletinInicial,
  crearEstadoGuardadoInicial,
  deduplicarClases,
  formatearEtiquetaNota,
  hayPorcentajesIncompletos,
  MENSAJE_PORCENTAJES_INCOMPLETOS,
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
    // Antes se enviaba `null` y el curso quedaba sin puesto, porque el ranking
    // promedia las definitivas guardadas y descarta las nulas. Ahora viaja la
    // equivalencia numerica de las caritas; la interfaz sigue mostrando carita.
    expect(desarrollo.definitiva).toBe(4);
    expect(desarrollo.detalles[0]).toEqual({
      nota: null,
      observacion: "Participa",
      tipo_evaluacion: "desarrollo",
      valoracion: "logrado",
    });
  });

  it("promedia varias caritas y conserva null cuando ninguna esta calificada", () => {
    const construir = (observaciones) =>
      construirPayloadBoletin({
        datosBoletin: { 9: { definitiva: 0, observaciones } },
        estudianteId: 9,
        asignacionId: "55",
        periodo: "2",
      });

    const mezcla = construir([
      { nota: null, observacion: "", tipo_evaluacion: "desarrollo", valoracion: "destacado" },
      { nota: null, observacion: "", tipo_evaluacion: "desarrollo", valoracion: "logrado" },
      { nota: null, observacion: "", tipo_evaluacion: "desarrollo", valoracion: "logrado" },
    ]);
    expect(mezcla.definitiva).toBeCloseTo(4.33, 2);

    const sinCalificar = construir([
      { nota: null, observacion: "", tipo_evaluacion: "desarrollo", valoracion: "" },
    ]);
    expect(sinCalificar.definitiva).toBeNull();
  });

  it("calcula la definitiva inicial de una materia de desarrollo", () => {
    const estado = crearDatosBoletinInicial([
      {
        estudiante_id: 9,
        notas: [
          { valor: null, tipo_evaluacion: "desarrollo", valoracion: "destacado" },
          { valor: null, tipo_evaluacion: "desarrollo", valoracion: "logrado" },
        ],
      },
    ]);

    expect(estado[9].definitiva).toBe("4.50");
  });

  // Porcentajes por tipo de nota, paso B1: hoy la definitiva la calcula esta
  // pantalla y el servidor la guarda tal como llega. Sin porcentajes activos
  // tiene que seguir así (PB5 y QB4 en docs/funcionalidades/SUBNOTAS_PLANILLA.md
  // del backend).
  it("calcula la definitiva numérica con dos decimales y la envía así", () => {
    const estado = crearDatosBoletinInicial([
      {
        estudiante_id: 9,
        notas: [
          { tipo_nota: "Cognitivo", valor: 3.25, tipo_evaluacion: "numerica" },
          { tipo_nota: "Procedimental", valor: 4, tipo_evaluacion: "numerica" },
        ],
      },
    ]);

    expect(estado[9].definitiva).toBe("3.63");
    expect(
      construirPayloadBoletin({
        datosBoletin: estado,
        estudianteId: 9,
        asignacionId: "55",
        periodo: "2",
      }).definitiva,
    ).toBe(3.63);
  });

  it("envía sin redondear la definitiva de las caritas", () => {
    const payload = construirPayloadBoletin({
      datosBoletin: {
        9: {
          definitiva: 0,
          observaciones: [
            { nota: null, observacion: "", tipo_evaluacion: "desarrollo", valoracion: "destacado" },
            { nota: null, observacion: "", tipo_evaluacion: "desarrollo", valoracion: "logrado" },
            { nota: null, observacion: "", tipo_evaluacion: "desarrollo", valoracion: "logrado" },
          ],
        },
      },
      estudianteId: 9,
      asignacionId: "55",
      periodo: "2",
    });

    expect(payload.definitiva).toBe(13 / 3);
  });

  // Porcentajes por tipo de nota, paso B4a (PB5): con los porcentajes de la
  // clase activos, el servidor manda la definitiva que va a guardar, y la
  // pantalla muestra esa. Sin ella, la cuenta de siempre.
  it("usa la definitiva del servidor cuando viene, también en caritas", () => {
    const estado = crearDatosBoletinInicial([
      {
        estudiante_id: 9,
        definitiva: 3.9,
        notas: [
          { tipo_nota: "Cognitivo", valor: 4, tipo_evaluacion: "numerica" },
          { tipo_nota: "Procedimental", valor: 3, tipo_evaluacion: "numerica" },
          { tipo_nota: "Actitudinal", valor: 5, tipo_evaluacion: "numerica" },
        ],
      },
      {
        estudiante_id: 10,
        definitiva: 4.5,
        notas: [
          { valor: null, tipo_evaluacion: "desarrollo", valoracion: "destacado" },
          { valor: null, tipo_evaluacion: "desarrollo", valoracion: "proceso" },
        ],
      },
      {
        estudiante_id: 11,
        notas: [{ tipo_nota: "Cognitivo", valor: 4, tipo_evaluacion: "numerica" }],
      },
    ]);

    // Simple serían 4.00 y 4.00; el servidor manda las ponderadas.
    expect(estado[9].definitiva).toBe("3.90");
    expect(estado[10].definitiva).toBe("4.50");
    expect(estado[11].definitiva).toBe("4.00");
  });

  // Porcentajes por tipo de nota, paso B4c (PB11): el aviso al guardar con
  // porcentajes incompletos.
  it("los porcentajes están incompletos si hay alguno pero no están activos", () => {
    expect(hayPorcentajesIncompletos({ porcentajes: { quiz: 50 }, porcentajes_activos: false })).toBe(true);
    expect(hayPorcentajesIncompletos({ porcentajes: {}, porcentajes_activos: false })).toBe(false);
    expect(hayPorcentajesIncompletos({ porcentajes: { quiz: 100 }, porcentajes_activos: true })).toBe(false);
    expect(hayPorcentajesIncompletos(undefined)).toBe(false);
    expect(MENSAJE_PORCENTAJES_INCOMPLETOS).toBe(
      "Los porcentajes de esta clase están incompletos: la definitiva es el promedio simple. ¿Guardar igual?",
    );
  });

  describe("vista previa de la materia del profesor", () => {
    it("arma la materia numérica con lo escrito, sin guardar, en el periodo actual", () => {
      const materia = construirMateriaVistaPrevia({
        datosBoletin: {
          7: {
            definitiva: "4.25",
            observaciones: [
              { nota: 4.5, observacion: "Lee con fluidez", referencia: "lectura", tipo_evaluacion: "numerica", valoracion: "" },
              { nota: 0, observacion: "", referencia: "taller", tipo_evaluacion: "numerica", valoracion: "" },
            ],
          },
        },
        estudianteId: 7,
        asignacionId: "55",
        periodo: "2",
        materia: "LENGUAJE",
        docente: "Ana Ruiz",
      });

      expect(materia).toEqual({
        materia_id: 55,
        materia: "LENGUAJE",
        profesor_nombre: "Ana Ruiz",
        profesor_apellido: "",
        definitiva: 4.25,
        detalles: [
          {
            observacion: "Lee con fluidez",
            tipo_evaluacion: "numerica",
            notas_por_periodo: { 2: 4.5 },
            valoraciones_por_periodo: {},
          },
          // La nota en cero no se imprime, igual que en el boletín del admin.
          {
            observacion: "",
            tipo_evaluacion: "numerica",
            notas_por_periodo: {},
            valoraciones_por_periodo: {},
          },
        ],
      });
    });

    it("en desarrollo pone la carita del periodo y deja la definitiva sin calificar si no hay ninguna", () => {
      const conCarita = construirMateriaVistaPrevia({
        datosBoletin: {
          8: {
            definitiva: 0,
            observaciones: [
              { nota: null, observacion: "Comparte", referencia: "social", tipo_evaluacion: "desarrollo", valoracion: "logrado" },
            ],
          },
        },
        estudianteId: 8,
        asignacionId: 9,
        periodo: 1,
        materia: "DIMENSIÓN SOCIAL",
        docente: "Lina",
      });
      const sinCarita = construirMateriaVistaPrevia({
        datosBoletin: {
          8: {
            definitiva: 0,
            observaciones: [
              { nota: null, observacion: "", referencia: "social", tipo_evaluacion: "desarrollo", valoracion: "" },
            ],
          },
        },
        estudianteId: 8,
        asignacionId: 9,
        periodo: 1,
      });

      expect(conCarita.detalles[0]).toEqual({
        observacion: "Comparte",
        tipo_evaluacion: "desarrollo",
        notas_por_periodo: {},
        valoraciones_por_periodo: { 1: "logrado" },
      });
      expect(conCarita.definitiva).toEqual(expect.any(Number));
      expect(sinCarita.definitiva).toBeNull();
      expect(sinCarita.materia).toBe("");
      expect(sinCarita.profesor_nombre).toBe("");
    });

    it("sin formulario del estudiante no arma nada", () => {
      expect(
        construirMateriaVistaPrevia({ datosBoletin: {}, estudianteId: 1, asignacionId: 2, periodo: 1 }),
      ).toBeNull();
    });
  });

  describe("otras materias del profesor en el mismo curso", () => {
    it("toma las del mismo curso, sin la actual, en orden alfabético", () => {
      const clases = [
        { id: 55, curso: "QUINTO A", curso_id: 5, materia: "LENGUAJE" },
        { id: 58, curso: "QUINTO A", curso_id: 5, materia: "INGLÉS" },
        { id: 60, curso: "SEXTO A", curso_id: 6, materia: "CIENCIAS" },
        { id: 56, curso: "QUINTO A", curso_id: 5, materia: "CIENCIAS" },
      ];

      expect(clasesDelMismoCurso(clases, "55").map((clase) => clase.id)).toEqual([56, 58]);
      expect(clasesDelMismoCurso(clases, 60)).toEqual([]);
      expect(clasesDelMismoCurso(clases, 999)).toEqual([]);
      expect(clasesDelMismoCurso(undefined, 55)).toEqual([]);
    });

    it("sin curso_id compara por el nombre del curso", () => {
      const clases = [
        { id: 1, curso: "QUINTO A", materia: "LENGUAJE" },
        { id: 2, curso: "QUINTO A", materia: "ARTES" },
        { id: 3, curso: "QUINTO B", materia: "ARTES" },
      ];
      expect(clasesDelMismoCurso(clases, 1).map((clase) => clase.id)).toEqual([2]);
    });

    it("arma la otra materia con lo guardado y dice si está guardada", () => {
      const clase = { id: 56, curso: "QUINTO A", materia: "CIENCIAS" };
      const estudiantes = [
        {
          estudiante_id: 7,
          definitiva: 3.6,
          notas: [
            { tipo_nota: "experimento", tipo_evaluacion: "numerica", valor: 3.6, observacion_guardada: "Formula hipótesis" },
          ],
        },
        {
          estudiante_id: 8,
          notas: [
            { tipo_nota: "experimento", tipo_evaluacion: "numerica", valor: 4, observacion_guardada: "" },
          ],
        },
      ];

      const guardada = construirOtraMateriaVistaPrevia({
        clase, estudiantes, estudianteId: 7, periodo: "2", docente: "Lina",
      });
      expect(guardada.guardada).toBe(true);
      expect(guardada.materia).toMatchObject({
        materia_id: 56,
        materia: "CIENCIAS",
        profesor_nombre: "Lina",
        definitiva: 3.6,
        detalles: [
          { observacion: "Formula hipótesis", notas_por_periodo: { 2: 3.6 } },
        ],
      });

      const sinGuardar = construirOtraMateriaVistaPrevia({
        clase, estudiantes, estudianteId: "8", periodo: "2", docente: "Lina",
      });
      expect(sinGuardar.guardada).toBe(false);
      expect(sinGuardar.materia.detalles[0].observacion).toBe("");
    });

    it("si el estudiante no está en esa clase, la materia queda pendiente", () => {
      expect(
        construirOtraMateriaVistaPrevia({
          clase: { id: "56", materia: "CIENCIAS" },
          estudiantes: [],
          estudianteId: 7,
          periodo: 2,
          docente: "Lina",
        }),
      ).toEqual({
        guardada: false,
        materia: {
          materia_id: 56,
          materia: "CIENCIAS",
          profesor_nombre: "Lina",
          profesor_apellido: "",
          definitiva: null,
          detalles: [],
        },
      });
    });
  });
});
