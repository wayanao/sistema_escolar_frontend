import { describe, expect, it } from "vitest";
import {
  crearEstudianteInicial,
  filtrarEstudiantesAdmin,
  filtrarEstudiantesObservador,
  limpiarPayloadEstudiante,
  normalizarDetalleEstudiante,
  normalizarEstudianteParaEdicion,
  obtenerEtiquetaEstadoEstudiante,
} from "./estudiantes";

describe("contratos puros de estudiantes", () => {
  it("crea estados iniciales independientes con los valores vigentes", () => {
    const primero = crearEstudianteInicial();
    const segundo = crearEstudianteInicial();

    primero.nombre = "Ana";

    expect(segundo).toMatchObject({
      nombre: "",
      apellido: "",
      curso_id: "",
      descuento_matricula: 0,
      descuento_mensualidad: 0,
      contacto_emergencia: "",
    });
  });

  it("convierte solo strings vacíos en null para crear o actualizar", () => {
    const origen = {
      nombre: "Ana",
      email: "",
      descuento_matricula: 0,
      estrato: null,
    };

    expect(limpiarPayloadEstudiante(origen)).toEqual({
      nombre: "Ana",
      email: null,
      descuento_matricula: 0,
      estrato: null,
    });
    expect(origen.email).toBe("");
  });

  it("adapta la respuesta de edición sin campos propios de base de datos", () => {
    expect(
      normalizarEstudianteParaEdicion({
        id: 12,
        estado: "activo",
        anio_escolar: 2026,
        nombre: "Luis",
        email: null,
        descuento_matricula: 0,
      }),
    ).toEqual({
      nombre: "Luis",
      email: "",
      descuento_matricula: 0,
    });
  });

  it("conserva las coincidencias administrativas por nombre, email y documento", () => {
    const estudiantes = [
      { nombre: "Ana", apellido: "Rojas", email: "ana@colegio.test" },
      { nombre: "Luis", apellido: "Pardo", documento: "DOC-92" },
      { nombre: "Sara", apellido: "Díaz" },
    ];

    expect(filtrarEstudiantesAdmin(estudiantes, "ROJAS")).toEqual([
      estudiantes[0],
    ]);
    expect(filtrarEstudiantesAdmin(estudiantes, "colegio")).toEqual([
      estudiantes[0],
    ]);
    expect(filtrarEstudiantesAdmin(estudiantes, "doc-92")).toEqual([
      estudiantes[1],
    ]);
  });

  it("filtra el observador por el nombre completo recortado", () => {
    const estudiantes = [
      { nombre: " Ana ", apellido: " Rojas " },
      { nombre: "Luis", apellido: "Pardo" },
    ];

    expect(filtrarEstudiantesObservador(estudiantes, "ana ro")).toEqual([
      estudiantes[0],
    ]);
  });

  it("normaliza el detalle y prioriza deudas y total del endpoint financiero", () => {
    const deudaAniosAnteriores = [{ anio: 2025, total_deuda: 40 }];
    expect(
      normalizarDetalleEstudiante(
        {
          promedio_general: 4.2,
          deudas: [{ deuda: 20 }],
          total_deuda: 20,
        },
        {
          deudas: [{ deuda: 35 }, { deuda: "15" }],
          total_deuda: 50,
          deuda_anios_anteriores: deudaAniosAnteriores,
        },
      ),
    ).toMatchObject({
      promedio_general: 4.2,
      notas: [],
      observaciones: [],
      deudas: [{ deuda: 35 }, { deuda: "15" }],
      total_deuda: 50,
      deuda_anios_anteriores: deudaAniosAnteriores,
    });
  });

  it("calcula el total cuando las respuestas no lo incluyen", () => {
    expect(
      normalizarDetalleEstudiante(
        { observaciones: [{ periodo: 2 }] },
        { deudas: [{ deuda: "25" }, { deuda: null }] },
      ),
    ).toMatchObject({
      promedio_general: 0,
      inasistencias: 0,
      observaciones: [{ periodo: 2 }],
      deudas: [{ deuda: "25" }, { deuda: null }],
      total_deuda: 25,
    });
  });

  it("conserva las etiquetas y el respaldo de estado vigentes", () => {
    expect(obtenerEtiquetaEstadoEstudiante("retirado")).toBe("Retirado");
    expect(obtenerEtiquetaEstadoEstudiante("desconocido")).toBe("Activo");
  });
});
