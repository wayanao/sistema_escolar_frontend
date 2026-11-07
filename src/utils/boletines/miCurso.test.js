import { describe, expect, it } from "vitest";

import {
  aplicarBorradorObservaciones,
  construirBorradorObservaciones,
  crearClaveBorradorObservaciones,
  LARGO_MAXIMO_OBSERVACION,
  limpiarObservacion,
  materiasPendientes,
  nombreDelEstudiante,
  normalizarCursosDirigidos,
  normalizarMiCurso,
  presentarNota,
  textoMateriaPendiente,
} from "./miCurso";

const RESPUESTA = {
  curso: { id: 5, nombre: "QUINTO A", jornada: "Mañana", nivel: "primaria" },
  periodo: 2,
  total_rankeados: 2,
  materias: [
    { asignacion_id: 55, materia: "LENGUAJE", profesor: "Lina Torres", tipo_evaluacion: "numerica", guardados: 2, total: 3 },
    { asignacion_id: 60, materia: "INGLÉS", profesor: "Raúl", tipo_evaluacion: "numerica", guardados: 3, total: 3 },
  ],
  estudiantes: [
    {
      estudiante_id: 101, nombre: "ana sofía", apellido: "PÉREZ", puesto: 1, promedio: 4.65,
      notas: { 55: { definitiva: 4.8, guardada: true }, 60: { definitiva: 4.5, guardada: true } },
      inasistencias: { periodo: 0, anio: 2 },
    },
    {
      estudiante_id: 103, nombre: "Carla", apellido: "Ruiz", puesto: null, promedio: null,
      notas: { 55: { definitiva: 2.95, guardada: false } },
      inasistencias: { periodo: 3, anio: 7 },
    },
  ],
};

describe("«Mi curso» del director de grupo", () => {
  it("normaliza los cursos que dirige", () => {
    expect(
      normalizarCursosDirigidos([{ id: 5, nombre: "QUINTO A", jornada: "Tarde" }, null, { nombre: "sin id" }]),
    ).toEqual([{ id: 5, nombre: "QUINTO A", jornada: "Tarde", nivel: null }]);
    expect(normalizarCursosDirigidos(undefined)).toEqual([]);
  });

  it("normaliza el ranking: nombres con apellido primero y una celda por materia", () => {
    const datos = normalizarMiCurso(RESPUESTA);

    expect(datos.curso).toEqual({ id: 5, nombre: "QUINTO A", jornada: "Mañana" });
    expect(datos.totalRankeados).toBe(2);
    expect(datos.usaCaritas).toBe(false);
    expect(datos.materias.map((m) => m.asignacionId)).toEqual(["55", "60"]);

    const [ana, carla] = datos.estudiantes;
    expect(ana.nombre).toBe("Pérez Ana Sofía");
    expect(ana.puesto).toBe(1);
    expect(ana.notas).toEqual({
      55: { definitiva: 4.8, guardada: true },
      60: { definitiva: 4.5, guardada: true },
    });
    // La materia sin dato sale vacía, no se pierde la columna.
    expect(carla.notas["60"]).toEqual({ definitiva: null, guardada: false });
    expect(carla.puesto).toBeNull();
    expect(carla.inasistencias).toEqual({ periodo: 3, anio: 7 });
  });

  it("con alguna materia de caritas, el promedio también es carita", () => {
    const datos = normalizarMiCurso({
      ...RESPUESTA,
      materias: [{ ...RESPUESTA.materias[0], tipo_evaluacion: "desarrollo" }],
    });
    expect(datos.usaCaritas).toBe(true);
    expect(datos.materias[0].tipoEvaluacion).toBe("desarrollo");
  });

  it("una respuesta vacía no rompe nada", () => {
    expect(normalizarMiCurso(null)).toMatchObject({ materias: [], estudiantes: [], totalRankeados: 0 });
  });

  it("presenta cada nota con los colores del boletín", () => {
    expect(presentarNota(4.25)).toEqual({ texto: "4.3", carita: null, tono: "alta", guardada: true });
    expect(presentarNota(3)).toMatchObject({ texto: "3.0", tono: "media" });
    expect(presentarNota(2.95)).toMatchObject({ texto: "3.0", tono: "baja" });
    expect(presentarNota(null)).toMatchObject({ texto: "—", tono: "vacia" });
    expect(presentarNota(4.8, { guardada: false })).toMatchObject({ guardada: false });
    expect(presentarNota(5, { caritas: true })).toMatchObject({ tono: "caritas", carita: expect.any(String) });
  });

  it("dice qué materias faltan por guardar, en singular y plural", () => {
    const pendientes = materiasPendientes(normalizarMiCurso(RESPUESTA).materias);
    expect(pendientes.map((m) => [m.materia, m.faltan])).toEqual([["LENGUAJE", 1]]);
    expect(textoMateriaPendiente(pendientes[0])).toBe("LENGUAJE: falta 1 por guardar");
    expect(textoMateriaPendiente({ materia: "INGLÉS", faltan: 12 })).toBe("INGLÉS: faltan 12 por guardar");
  });

  it("arma el nombre aunque falte una parte", () => {
    expect(nombreDelEstudiante({ nombre: "ana" })).toBe("Ana");
    expect(nombreDelEstudiante({})).toBe("");
  });
});

describe("observación general del boletín", () => {
  it("cada estudiante trae su observación, vacía si no hay", () => {
    const datos = normalizarMiCurso({
      ...RESPUESTA,
      estudiantes: [
        { ...RESPUESTA.estudiantes[0], observacion_general: "Muy bien." },
        RESPUESTA.estudiantes[1],
      ],
    });
    expect(datos.estudiantes.map((e) => e.observacionGeneral)).toEqual(["Muy bien.", ""]);
  });

  it("limpia como el servidor y el límite es 500", () => {
    expect(limpiarObservacion("  Hola\r\nmundo  ")).toBe("Hola\nmundo");
    expect(limpiarObservacion(null)).toBe("");
    expect(LARGO_MAXIMO_OBSERVACION).toBe(500);
  });

  it("el borrador lleva el prefijo que borra Cerrar sesión", () => {
    expect(
      crearClaveBorradorObservaciones({ tenant: "t", profesorId: 7, cursoId: 5, periodo: 2 }),
    ).toBe("borrador_boletin:observaciones:t:7:5:2");
    expect(crearClaveBorradorObservaciones({ tenant: "t", profesorId: null, cursoId: 5, periodo: 2 })).toBeNull();
  });

  it("el borrador guarda solo lo que cambió y se recupera solo para quien sigue en el curso", () => {
    expect(construirBorradorObservaciones({ 1: "a", 2: "b" }, { 1: "a", 2: "" }, "x")).toEqual({
      actualizado: "x",
      textos: { 2: "b" },
    });
    expect(construirBorradorObservaciones({ 1: "a" }, { 1: "a" }, "x")).toBeNull();

    expect(
      aplicarBorradorObservaciones({ 1: "", 2: "guardada" }, { textos: { 1: "nueva", 2: "guardada", 9: "otro curso" } }),
    ).toEqual({ textos: { 1: "nueva", 2: "guardada" }, recuperadas: 1 });
    expect(aplicarBorradorObservaciones({ 1: "" }, null)).toEqual({ textos: { 1: "" }, recuperadas: 0 });
  });
});
