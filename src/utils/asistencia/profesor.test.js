import { describe, expect, it } from "vitest";
import {
  construirPayloadAsistencia,
  crearMarcacionTodosPresentes,
  indexarHistorialPorEstudiante,
  normalizarFechaAsistencia,
  obtenerAsistenciaGuardadaEnFecha,
  resumirAsistencia,
  tieneCambiosDeAsistencia,
} from "./profesor";

const estudiantes = [
  { estudiante_id: 101, nombre: "Ana" },
  { estudiante_id: 102, nombre: "Luis" },
  { estudiante_id: 103, nombre: "Sara" },
];

describe("contratos puros de asistencia del profesor", () => {
  it("normaliza fechas ISO, valores parseables y respaldos inválidos", () => {
    expect(normalizarFechaAsistencia("")).toBe("");
    expect(normalizarFechaAsistencia("2026-07-31T08:30:00-05:00")).toBe("2026-07-31");
    expect(normalizarFechaAsistencia("July 30, 2026 12:00:00 UTC")).toBe("2026-07-30");
    expect(normalizarFechaAsistencia("no-es-fecha-completa")).toBe("no-es-fech");
  });

  it("indexa el historial por identificador numérico y descarta historiales inválidos", () => {
    const historialAna = [{ fecha: "2026-07-30", estado: "ausente" }];

    const resultado = indexarHistorialPorEstudiante([
      { estudiante_id: "101", historial: historialAna },
      { estudiante_id: 102, historial: null },
    ]);

    expect(resultado).toEqual(new Map([
      [101, historialAna],
      [102, []],
    ]));
  });

  it("obtiene únicamente la marcación guardada para la fecha elegida", () => {
    const historial = indexarHistorialPorEstudiante([
      {
        estudiante_id: 101,
        historial: [
          { fecha: "2026-07-30", estado: "ausente" },
          { fecha: "2026-07-31T08:00:00", estado: "presente" },
        ],
      },
      {
        estudiante_id: 102,
        historial: [{ fecha: "2026-07-31", estado: "ausente" }],
      },
      {
        estudiante_id: 103,
        historial: [{ fecha: "2026-07-31", estado: "" }],
      },
    ]);

    expect(obtenerAsistenciaGuardadaEnFecha(historial, "2026-07-31")).toEqual(
      new Map([
        [101, "presente"],
        [102, "ausente"],
      ]),
    );
    expect(obtenerAsistenciaGuardadaEnFecha(historial, "")).toEqual(new Map());
  });

  it("resume presentes, ausentes y estudiantes todavía pendientes", () => {
    expect(resumirAsistencia(estudiantes, {
      101: "presente",
      102: "ausente",
    })).toEqual({
      presentes: 1,
      ausentes: 1,
      pendientes: 1,
    });
  });

  it("detecta cambios comparando solo los estudiantes de la clase", () => {
    const guardada = { 101: "presente", 102: "ausente" };

    expect(tieneCambiosDeAsistencia(estudiantes, guardada, guardada)).toBe(false);
    expect(tieneCambiosDeAsistencia(
      estudiantes,
      { ...guardada, 101: "ausente" },
      guardada,
    )).toBe(true);
    expect(tieneCambiosDeAsistencia(
      estudiantes,
      { ...guardada, 999: "presente" },
      guardada,
    )).toBe(false);
  });

  it("crea la marcación masiva sin modificar la lista de estudiantes", () => {
    const copia = estudiantes.map((estudiante) => ({ ...estudiante }));

    expect(crearMarcacionTodosPresentes(estudiantes)).toEqual({
      101: "presente",
      102: "presente",
      103: "presente",
    });
    expect(estudiantes).toEqual(copia);
  });

  it("construye el payload masivo conservando orden, estados y tipos del backend", () => {
    expect(construirPayloadAsistencia({
      estudiantes: estudiantes.slice(0, 2),
      asistencia: { 101: "presente", 102: "ausente" },
      asignacionId: "44",
      fecha: "2026-07-31",
      periodo: "2",
    })).toEqual([
      {
        estudiante_id: 101,
        asignacion_id: 44,
        fecha: "2026-07-31",
        estado: "presente",
        periodo: 2,
      },
      {
        estudiante_id: 102,
        asignacion_id: 44,
        fecha: "2026-07-31",
        estado: "ausente",
        periodo: 2,
      },
    ]);
  });
});
