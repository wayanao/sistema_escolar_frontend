import { describe, expect, it } from "vitest";

import {
  aplicarBorrador,
  aplicarLogrosEnGrupo,
  clasesDelMismoCurso,
  construirBorrador,
  construirMateriaVistaPrevia,
  construirOtraMateriaVistaPrevia,
  construirPayloadBoletin,
  correspondeFormularioAEstudiante,
  crearClaveBorradorBoletin,
  crearDatosBoletinInicial,
  contarPlanillaCambiada,
  crearEstadoGuardadoInicial,
  deduplicarClases,
  estudiantesConCambiosSinGuardar,
  formatearEtiquetaNota,
  hayPorcentajesIncompletos,
  MENSAJE_PORCENTAJES_INCOMPLETOS,
  mensajeCambiosSinGuardar,
  mensajeCopiarLogros,
  mensajeGuardadoGrupoIncompleto,
  normalizarEstudiantesReferencia,
  planillaCambioDespuesDeGuardar,
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
      7: { guardado: true, modificado: false, guardadoEn: null, desactualizado: false },
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

    const resultado = aplicarLogrosEnGrupo(datos, 1);

    expect(resultado.estudiantesModificados).toEqual(["2"]);
    expect(resultado.estudiantesConTextoPropio).toEqual(["3"]);
    expect(resultado.datosBoletin[2].observaciones[0].observacion).toBe("Común");
    expect(resultado.datosBoletin[3]).toBe(datos[3]);
    expect(resultado.datosBoletin[1]).toBe(datos[1]);
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

  it("usa la posición como respaldo cuando el tipo de nota no coincide", () => {
    const datos = {
      1: { observaciones: [{ referencia: "origen", observacion: "Común" }] },
      2: { observaciones: [{ referencia: "distinta", observacion: "" }] },
    };

    const resultado = aplicarLogrosEnGrupo(datos, 1);

    expect(resultado.estudiantesModificados).toEqual(["2"]);
    expect(resultado.datosBoletin[2].observaciones[0].observacion).toBe("Común");
  });

  it("una corrección en el primero llega a las copias, no a lo escrito a mano", () => {
    const logro = (texto) => [{ referencia: "lectura", tipo_evaluacion: "numerica", observacion: texto }];
    const datos = {
      1: { observaciones: logro("Lee con fluidez y entonación") }, // corregido, sin guardar
      2: { observaciones: logro("Lee con fluides") },              // copia de lo guardado antes
      3: { observaciones: logro("Lee despacio pero comprende") },  // escrito a mano
      4: { observaciones: logro("") },
    };
    const guardadoDelPrimero = logro("Lee con fluides");

    const resultado = aplicarLogrosEnGrupo(datos, 1, guardadoDelPrimero);

    expect(resultado.estudiantesModificados).toEqual(["2", "4"]);
    expect(resultado.estudiantesConTextoPropio).toEqual(["3"]);
    expect(resultado.datosBoletin[2].observaciones[0].observacion).toBe("Lee con fluidez y entonación");
    expect(resultado.datosBoletin[3]).toBe(datos[3]);
    expect(resultado.datosBoletin[4].observaciones[0].observacion).toBe("Lee con fluidez y entonación");
  });

  it("un campo vacío en el primero no borra nada en los demás", () => {
    const datos = {
      1: { observaciones: [{ referencia: "a", observacion: "" }, { referencia: "b", observacion: "Logro B" }] },
      2: { observaciones: [{ referencia: "a", observacion: "Propio A" }, { referencia: "b", observacion: "" }] },
    };

    const resultado = aplicarLogrosEnGrupo(datos, 1, datos[1].observaciones);

    expect(resultado.datosBoletin[2].observaciones.map((o) => o.observacion)).toEqual(["Propio A", "Logro B"]);
    expect(resultado.estudiantesConTextoPropio).toEqual([]);
  });

  it("explica con números lo que hará Copiar a todos y guardar", () => {
    expect(mensajeCopiarLogros({ nombreOrigen: "Ana", copiados: 27, conTextoPropio: 3, total: 30 })).toBe(
      "Los logros de Ana se copiarán a 27 estudiantes. Lo que escribiste a mano para 3 estudiantes no se toca. Después se guarda todo el grupo (30 estudiantes).",
    );
    expect(mensajeCopiarLogros({ nombreOrigen: "Ana", copiados: 1, conTextoPropio: 0, total: 2 })).toBe(
      "Los logros de Ana se copiarán a un estudiante. Después se guarda todo el grupo (2 estudiantes).",
    );
    expect(mensajeCopiarLogros({ nombreOrigen: "Ana", copiados: 0, conTextoPropio: 1, total: 2 })).toBe(
      "Los demás ya tienen los logros de Ana o los escribiste a mano. Después se guarda todo el grupo (2 estudiantes).",
    );
    expect(mensajeCopiarLogros({ nombreOrigen: "Ana", copiados: 0, conTextoPropio: 0, total: 1 })).toBe(
      "Los demás ya tienen los logros de Ana. Después se guarda todo el grupo (un estudiante).",
    );
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

  describe("avisos para no perder lo escrito", () => {
    it("cuenta solo los estudiantes con cambios sin guardar", () => {
      expect(
        estudiantesConCambiosSinGuardar({
          101: { guardado: true, modificado: false },
          102: { guardado: false, modificado: true },
          103: { modificado: true },
        }),
      ).toEqual(["102", "103"]);
      expect(estudiantesConCambiosSinGuardar(undefined)).toEqual([]);
    });

    it("dice cuántos estudiantes pierden sus cambios", () => {
      expect(mensajeCambiosSinGuardar(1)).toBe(
        "Un estudiante tiene cambios sin guardar. Si cambias de clase o de periodo, se pierden.",
      );
      expect(mensajeCambiosSinGuardar(3)).toBe(
        "3 estudiantes tienen cambios sin guardar. Si cambias de clase o de periodo, se pierden.",
      );
    });

    it("explica un guardado del grupo incompleto, con la razón del servidor si la da", () => {
      expect(
        mensajeGuardadoGrupoIncompleto({ guardados: 0, total: 30, nombreFallido: "Ana", error: new Error("x") }),
      ).toBe("No se pudo guardar el grupo. Revisa la conexión e intenta nuevamente.");
      expect(
        mensajeGuardadoGrupoIncompleto({ guardados: 14, total: 30, nombreFallido: "Ana Pérez" }),
      ).toBe(
        "Se guardaron 14 de 30 estudiantes. Faltan 16, desde Ana Pérez: siguen marcados como no guardados. Revisa la conexión y vuelve a oprimir «Copiar a todos y guardar».",
      );
      expect(
        mensajeGuardadoGrupoIncompleto({
          guardados: 2,
          total: 3,
          nombreFallido: "Carla",
          error: { response: { data: { detail: "El año lectivo está cerrado." } } },
        }),
      ).toBe("Se guardaron 2 de 3 estudiantes. Falta Carla: sigue marcado como no guardado. El año lectivo está cerrado.");
      expect(
        mensajeGuardadoGrupoIncompleto({
          guardados: 0,
          total: 3,
          nombreFallido: "Ana",
          error: { response: { data: { detail: "El año lectivo está cerrado." } } },
        }),
      ).toBe("No se pudo guardar el grupo. El año lectivo está cerrado.");
    });
  });

  describe("borrador del boletín", () => {
    const form = (textos) => ({
      definitiva: "4.00",
      observaciones: textos.map(([referencia, observacion]) => ({
        nota: 4,
        observacion,
        referencia,
        tipo_evaluacion: "numerica",
        valoracion: "",
      })),
    });

    it("tiene un nombre por colegio, profesor, clase y periodo", () => {
      expect(
        crearClaveBorradorBoletin({ tenant: "tenant_2005", profesorId: 7, asignacionId: "55", periodo: "2" }),
      ).toBe("borrador_boletin:tenant_2005:7:55:2");
      expect(crearClaveBorradorBoletin({ profesorId: 7, asignacionId: 55, periodo: 1 })).toBe(
        "borrador_boletin::7:55:1",
      );
      expect(crearClaveBorradorBoletin({ tenant: "t", profesorId: null, asignacionId: 55, periodo: 1 })).toBeNull();
      expect(crearClaveBorradorBoletin({ tenant: "t", profesorId: 7, asignacionId: "", periodo: 1 })).toBeNull();
    });

    it("guarda solo los textos de quienes tienen cambios sin guardar", () => {
      const datos = { 101: form([["lectura", "Nuevo"]]), 102: form([["lectura", "Guardado"]]) };
      const estado = { 101: { modificado: true }, 102: { guardado: true, modificado: false } };

      expect(construirBorrador(datos, estado, "2026-11-07T10:00:00.000Z")).toEqual({
        actualizado: "2026-11-07T10:00:00.000Z",
        estudiantes: {
          101: {
            observaciones: [{ referencia: "lectura", tipo_evaluacion: "numerica", observacion: "Nuevo" }],
          },
        },
      });
      expect(construirBorrador(datos, { 101: { modificado: false } }, "x")).toBeNull();
    });

    it("pone el borrador encima de lo guardado y marca a quien recupera", () => {
      const datos = {
        101: form([["lectura", "Del servidor"], ["escritura", ""]]),
        102: form([["lectura", "Igual"]]),
      };
      const estado = { 101: { guardado: true, modificado: false }, 102: { guardado: true, modificado: false } };
      const borrador = {
        actualizado: "2026-11-07T10:00:00.000Z",
        estudiantes: {
          101: {
            observaciones: [
              { referencia: "lectura", tipo_evaluacion: "numerica", observacion: "Del borrador" },
              { referencia: "escritura", tipo_evaluacion: "numerica", observacion: "Escribe bien" },
            ],
          },
          // Igual a lo guardado: no cuenta como recuperado.
          102: { observaciones: [{ referencia: "lectura", tipo_evaluacion: "numerica", observacion: "Igual" }] },
          // Ya no está en la clase: se ignora.
          999: { observaciones: [{ referencia: "lectura", tipo_evaluacion: "numerica", observacion: "X" }] },
        },
      };

      const resultado = aplicarBorrador({ datosBoletin: datos, estadoGuardado: estado, borrador });

      expect(resultado.recuperados).toEqual(["101"]);
      expect(resultado.datosBoletin[101].observaciones.map((o) => o.observacion)).toEqual([
        "Del borrador",
        "Escribe bien",
      ]);
      expect(resultado.datosBoletin[101].observaciones[0].nota).toBe(4);
      expect(resultado.estadoGuardado[101]).toEqual({ guardado: true, modificado: true });
      expect(resultado.datosBoletin[102]).toBe(datos[102]);
      expect(resultado.estadoGuardado[102]).toBe(estado[102]);
    });

    it("si la planilla cambió, solo recupera los tipos de nota que siguen", () => {
      const datos = { 101: form([["exposicion", ""], ["lectura", ""]]) };
      const borrador = {
        estudiantes: {
          101: {
            observaciones: [
              { referencia: "lectura", tipo_evaluacion: "numerica", observacion: "Lee" },
              { referencia: "quiz_borrado", tipo_evaluacion: "numerica", observacion: "Ya no existe" },
            ],
          },
        },
      };

      const resultado = aplicarBorrador({ datosBoletin: datos, estadoGuardado: {}, borrador });
      expect(resultado.datosBoletin[101].observaciones.map((o) => o.observacion)).toEqual(["", "Lee"]);
      expect(resultado.recuperados).toEqual(["101"]);
    });

    it("sin borrador, o con uno dañado, deja todo como llegó", () => {
      const datos = { 101: form([["lectura", "A"]]) };
      const estado = { 101: { guardado: true } };
      for (const borrador of [null, undefined, {}, { estudiantes: "x" }, { estudiantes: { 101: { observaciones: "x" } } }]) {
        const resultado = aplicarBorrador({ datosBoletin: datos, estadoGuardado: estado, borrador });
        expect(resultado.datosBoletin).toBe(datos);
        expect(resultado.estadoGuardado).toBe(estado);
        expect(resultado.recuperados).toEqual([]);
      }
    });
  });
});

describe("la planilla cambió después de guardar el boletín (2026-11-23)", () => {
  const carita = (tipo_nota, valoracion, observacion_guardada = "Texto") => ({
    tipo_nota, valor: null, tipo_evaluacion: "desarrollo", valoracion, observacion_guardada,
  });
  const guardadas = (...valoraciones) => ({
    definitiva: 4.8,
    detalles: valoraciones.map((valoracion) => ({ valor: null, valoracion })),
  });

  it("avisa cuando una carita guardada ya no es la de la planilla (Jardín A)", () => {
    // La planilla ya dice ⭐ en Fam 10; el boletín guardó 😀.
    const moises = {
      estudiante_id: 608,
      notas: [carita("Del 1al9", "destacado"), carita("Fam 10", "destacado")],
      guardado: guardadas("destacado", "logrado"),
    };

    expect(planillaCambioDespuesDeGuardar(moises)).toBe(true);
    expect(crearEstadoGuardadoInicial([moises])[608]).toEqual({
      guardado: true, modificado: false, guardadoEn: null, desactualizado: true,
    });
  });

  it("no avisa si lo guardado coincide con la planilla", () => {
    const estudiante = {
      notas: [carita("Del 1al9", "destacado"), carita("Fam 10", "logrado")],
      guardado: guardadas("destacado", "logrado"),
    };

    expect(planillaCambioDespuesDeGuardar(estudiante)).toBe(false);
  });

  it("avisa si la planilla tiene otra cantidad de notas", () => {
    const estudiante = {
      notas: [carita("Del 1al9", "destacado"), carita("Fam 10", "logrado"), carita("Sumas", "destacado")],
      guardado: guardadas("destacado", "logrado"),
    };

    expect(planillaCambioDespuesDeGuardar(estudiante)).toBe(true);
  });

  it("en notas numéricas compara el número, sin ruido de decimales", () => {
    const numerica = (valor) => ({ tipo_nota: "Parcial", valor, tipo_evaluacion: "numerica", valoracion: null });
    const guardado = { definitiva: 4.2, detalles: [{ valor: 4.2, valoracion: null }] };

    expect(planillaCambioDespuesDeGuardar({ notas: [numerica(4.2000001)], guardado })).toBe(false);
    expect(planillaCambioDespuesDeGuardar({ notas: [numerica(3.8)], guardado })).toBe(true);
  });

  it("sin nada guardado, o con un servidor viejo que no manda `guardado`, no avisa", () => {
    const notas = [carita("Del 1al9", "destacado")];

    expect(planillaCambioDespuesDeGuardar({ notas, guardado: null })).toBe(false);
    expect(planillaCambioDespuesDeGuardar({ notas })).toBe(false);
    expect(planillaCambioDespuesDeGuardar({ notas, guardado: { definitiva: null, detalles: [] } })).toBe(false);
  });

  it("solo marca a quien tiene textos guardados: el resto sigue Pendiente", () => {
    const sinTextos = {
      estudiante_id: 9,
      notas: [carita("Del 1al9", "destacado", "")],
      guardado: guardadas("logrado"),
    };

    expect(crearEstadoGuardadoInicial([sinTextos])[9].desactualizado).toBe(false);
  });

  it("cuenta los estudiantes con la planilla cambiada", () => {
    expect(contarPlanillaCambiada({
      1: { desactualizado: true },
      2: { desactualizado: false },
      3: { guardado: true },
      4: { desactualizado: true, modificado: true },
    })).toBe(2);
    expect(contarPlanillaCambiada(undefined)).toBe(0);
  });
});
