import { describe, expect, it } from "vitest";
import {
  agruparAlumnosPorCurso,
  filtrarAlumnosObservador,
  nombreCompletoAlumno,
  SIN_CURSO,
} from "./alumnos";

const ALUMNOS = [
  { estudiante_id: 11, nombre: "Ana", apellido: "Rojas", curso: "PRIMERO-A" },
  { estudiante_id: 12, nombre: "Luis", apellido: "Pardo", curso: "PRIMERO-A" },
  { estudiante_id: 21, nombre: "Sofía", apellido: "Ruiz", curso: "SEGUNDO" },
];

describe("agrupación por curso", () => {
  it("parte la lista en bloques sin reordenar nada", () => {
    // El servidor ya los manda ordenados por curso y apellido.
    const grupos = agruparAlumnosPorCurso(ALUMNOS);

    expect(grupos.map((grupo) => grupo.curso)).toStrictEqual([
      "PRIMERO-A",
      "SEGUNDO",
    ]);
    expect(grupos[0].alumnos.map((a) => a.estudiante_id)).toStrictEqual([11, 12]);
    expect(grupos[1].alumnos).toHaveLength(1);
  });

  it("junta a los que no tienen curso bajo un encabezado propio", () => {
    const grupos = agruparAlumnosPorCurso([
      { estudiante_id: 30, nombre: "Eva", apellido: "Sol", curso: null },
      { estudiante_id: 31, nombre: "Iván", apellido: "Paz", curso: "   " },
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].curso).toBe(SIN_CURSO);
    expect(grupos[0].alumnos).toHaveLength(2);
  });

  it("no crea dos bloques del mismo curso si vuelve a aparecer", () => {
    const grupos = agruparAlumnosPorCurso([
      ALUMNOS[0],
      ALUMNOS[2],
      ALUMNOS[1],
    ]);

    expect(grupos.map((grupo) => grupo.curso)).toStrictEqual([
      "PRIMERO-A",
      "SEGUNDO",
    ]);
    expect(grupos[0].alumnos).toHaveLength(2);
  });

  it("aguanta una lista vacía o ausente", () => {
    expect(agruparAlumnosPorCurso([])).toStrictEqual([]);
    expect(agruparAlumnosPorCurso(null)).toStrictEqual([]);
  });
});

describe("nombre y filtro", () => {
  it("compone el nombre completo sin espacios sobrantes", () => {
    expect(nombreCompletoAlumno(ALUMNOS[0])).toBe("Ana Rojas");
    expect(nombreCompletoAlumno({ nombre: "Eva", apellido: "" })).toBe("Eva");
    expect(nombreCompletoAlumno({})).toBe("");
  });

  it("filtra por nombre o apellido, sin distinguir mayúsculas", () => {
    expect(filtrarAlumnosObservador(ALUMNOS, "luis")).toHaveLength(1);
    expect(filtrarAlumnosObservador(ALUMNOS, "ROJAS")[0].estudiante_id).toBe(11);
    expect(filtrarAlumnosObservador(ALUMNOS, "zzz")).toStrictEqual([]);
  });

  it("sin búsqueda devuelve la lista entera", () => {
    expect(filtrarAlumnosObservador(ALUMNOS, "")).toHaveLength(3);
    expect(filtrarAlumnosObservador(ALUMNOS, "   ")).toHaveLength(3);
    expect(filtrarAlumnosObservador(ALUMNOS, undefined)).toHaveLength(3);
  });

  it("no revienta con un alumno al que le falte el apellido", () => {
    const sinApellido = [{ estudiante_id: 40, nombre: "Nino" }];

    expect(filtrarAlumnosObservador(sinApellido, "nino")).toHaveLength(1);
  });
});
