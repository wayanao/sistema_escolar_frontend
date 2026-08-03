import { describe, expect, it } from "vitest";

import {
  construirBoletinesValidos,
  construirCertificadoNotas,
  construirEstudiantesReporte,
  construirMateriaReporte,
  construirResumenReporteParcial,
  crearMapaCursos,
  documentoEstudiante,
  filtrarEstudiantesCertificados,
  filtrarEstudiantesCurso,
  formatoNota,
  getDefinitiva,
  getDesempeno,
  nombreEstudiante,
  normalizarTexto,
  obtenerAsignacionIds,
  obtenerFilasMaterias,
  promedioMaterias,
  totalInasistencias,
} from "./certificados";

describe("utilidades puras de certificados", () => {
  it("normaliza texto, nombre y variantes del documento sin alterar contratos", () => {
    expect(normalizarTexto("  texto  ")).toBe("texto");
    expect(normalizarTexto("", "Sin dato")).toBe("Sin dato");
    expect(nombreEstudiante({ nombre: "  Sara ", apellido: " López  " })).toBe(
      "Sara López",
    );
    expect(documentoEstudiante({ identificacion: "TI-123" })).toBe("TI-123");
    expect(documentoEstudiante({ cedula: "CC-456" })).toBe("CC-456");
  });

  it("conserva prioridad, promedio de detalles y tratamiento actual del cero", () => {
    expect(getDefinitiva({ definitiva: 4.6, promedio: 3.2 })).toBe(4.6);
    expect(getDefinitiva({
      periodo: 2,
      detalles: [
        { notas_por_periodo: { 2: 3.5 } },
        { notas_por_periodo: { 2: 4.5 } },
      ],
    })).toBe(4);
    expect(getDefinitiva({ definitiva: 0, detalles: [{ nota: 0 }] })).toBeNull();
    expect(formatoNota(null)).toBe("---");
    expect(formatoNota(3)).toBe("3.0");
  });

  it("filtra estudiantes con los mismos criterios de curso, estado y búsqueda", () => {
    const estudiantes = [
      {
        id: 8,
        nombre: "Sara",
        apellido: "López",
        documento_identidad: "TI-123",
        curso_id: 3,
        estado: "activo",
      },
      {
        id: 9,
        nombre: "Luis",
        apellido: "Pérez",
        documento_identidad: "TI-999",
        curso_id: 3,
        estado: "retirado",
      },
      {
        id: 10,
        nombre: "Marta",
        apellido: "Díaz",
        documento_identidad: "TI-555",
        curso_id: 4,
      },
    ];

    expect(filtrarEstudiantesCertificados(estudiantes, {
      busqueda: "ti-123",
      cursoSeleccionado: "3",
      estadoFiltro: "activo",
    })).toEqual([estudiantes[0]]);
    expect(filtrarEstudiantesCurso(estudiantes, "3", "todos")).toEqual(
      estudiantes.slice(0, 2),
    );
  });

  it("construye el certificado sin alterar respuestas y anota cada periodo", () => {
    const boletines = [
      { periodo: 1, curso: "Quinto", materias: [{ materia_id: 12 }] },
      { periodo: 2, curso: "Quinto", materias: [{ materia_id: 12 }] },
    ];

    const certificado = construirCertificadoNotas({
      boletines,
      periodosConsultar: [1, 2],
      periodo: "todos",
      estudiante: {
        nombre: "Sara",
        apellido: "López",
        documento_identidad: "TI-123",
      },
      curso: { nombre: "Quinto" },
    });

    expect(certificado).toMatchObject({
      periodo: "Todos",
      todos_los_periodos: true,
      documento_identidad: "TI-123",
      estudiante_nombre_completo: "Sara López",
      curso: "Quinto",
    });
    expect(certificado.periodos_data.map((item) => item.periodo)).toEqual([1, 2]);
    expect(certificado.periodos_data[1].materias[0].periodo).toBe(2);
    expect(boletines[1].materias[0]).not.toHaveProperty("periodo");
  });

  it("mantiene los umbrales de desempeño", () => {
    expect([
      getDesempeno(null),
      getDesempeno(4.6),
      getDesempeno(4),
      getDesempeno(3),
      getDesempeno(2.9),
    ]).toEqual(["Pendiente", "Superior", "Alto", "Basico", "Bajo"]);
  });

  it("consolida materias por identificador y calcula el promedio entre periodos", () => {
    const filas = obtenerFilasMaterias({
      todos_los_periodos: true,
      periodos_data: [
        {
          periodo: 1,
          materias: [{
            materia_id: 12,
            materia: "Historia",
            profesor_nombre: "Ana",
            profesor_apellido: "Ruiz",
            definitiva: 4.2,
          }],
        },
        {
          periodo: 2,
          materias: [{
            materia_id: 12,
            materia: "Historia",
            profesor_nombre: "Ana",
            profesor_apellido: "Ruiz",
            definitiva: 3.8,
          }],
        },
      ],
    });

    expect(filas).toEqual([
      {
        key: 12,
        nombre: "Historia",
        docente: "Ana Ruiz",
        notasPorPeriodo: { 1: 4.2, 2: 3.8 },
        promedio: 4,
      },
    ]);
  });

  it("construye el contrato de materia del reporte con detalles e inasistencias", () => {
    const asistencia = new Map([
      [44, [{
        estudiante_id: 8,
        historial: [
          { estado: "ausente" },
          { estado: "presente" },
          { estado: "AUSENTE" },
        ],
      }]],
    ]);

    const materia = construirMateriaReporte({
      materia_id: 12,
      asignacion_id: 44,
      materia: "Historia",
      profesor_nombre: "Ana",
      profesor_apellido: "Ruiz",
      definitiva: 4.2,
      detalles: [
        {
          descripcion: "Evaluación oral",
          observacion: "Logro escrito para el boletín",
          notas_por_periodo: { 1: 4.2 },
        },
      ],
    }, 1, asistencia, 8);

    expect(materia).toEqual({
      asignacion_id: 44,
      materia_id: 12,
      nombre: "Historia",
      docente: "Ana Ruiz",
      definitiva: 4.2,
      desempeno: "Alto",
      estado: "Al dia",
      inasistencias: 2,
      detalles: [{ descripcion: "Evaluación oral", valor: "4.2" }],
    });
    expect(promedioMaterias([materia, { definitiva: null }])).toBe(4.2);
    expect(totalInasistencias([materia, { inasistencias: "3" }])).toBe(5);
  });

  it("omite boletines fallidos y consolida el contrato final del reporte", () => {
    const estudiante = {
      id: 8,
      nombre: "Sara",
      apellido: "López",
      documento_identidad: "TI-123",
      curso_id: 3,
      estado: "activo",
    };
    const respuestas = [
      {
        status: "fulfilled",
        value: {
          curso: "Quinto",
          materias: [
            {
              materia_id: 12,
              asignacion_id: 44,
              materia: "Historia",
              definitiva: 4.2,
            },
            {
              materia_id: 13,
              asignacion_id: 45,
              materia: "Ciencias",
              definitiva: 3.5,
            },
          ],
        },
      },
      { status: "rejected", reason: new Error("sin boletín") },
    ];
    const boletinesValidos = construirBoletinesValidos(
      respuestas,
      [estudiante, { id: 9 }],
      1,
      12,
    );

    expect(boletinesValidos).toHaveLength(1);
    expect(boletinesValidos[0].materiasFiltradas).toHaveLength(1);
    expect(boletinesValidos[0].materiasFiltradas[0].periodo).toBe(1);
    expect(obtenerAsignacionIds(boletinesValidos)).toEqual([44]);

    const cursosPorId = crearMapaCursos([
      { id: 3, nombre: "Quinto", jornada: "Mañana" },
    ]);
    const estudiantesReporte = construirEstudiantesReporte({
      boletinesValidos,
      cursosPorId,
      asistenciaPorAsignacion: new Map(),
      periodoNumero: 1,
    });
    expect(estudiantesReporte[0]).toMatchObject({
      id: 8,
      nombre: "Sara López",
      documento: "TI-123",
      curso: "Quinto",
      promedio: 4.2,
      inasistencias: 0,
    });

    expect(construirResumenReporteParcial({
      alcance: "curso",
      periodoNumero: 1,
      materiaIdFiltro: 12,
      materias: [{ id: 12, nombre: "Historia" }],
      cursosPorId,
      cursoSeleccionado: "3",
      estudiantesReporte,
      errores: 1,
      fecha: "3 de agosto de 2026",
    })).toEqual({
      alcance: "curso",
      periodo: 1,
      materia: "Historia",
      curso: "Quinto - Mañana",
      fecha: "3 de agosto de 2026",
      estudiantes: estudiantesReporte,
      errores: 1,
    });
  });
});
