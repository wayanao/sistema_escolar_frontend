import { describe, expect, it } from "vitest";
import { GRUPOS_SISBEN, SUBGRUPOS_SISBEN } from "../../constants/sisben";
import {
  actualizarCampoEstudiante,
  datosDeAdmisionEstudiante,
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

describe("datos de admisión en la ficha (entrevista de admisión, paso E6)", () => {
  it("lista los ocho datos que pasaron a la entrevista, con vacío como null", () => {
    const datos = datosDeAdmisionEstudiante({
      id: 11,
      colegio_anterior: "Colegio Uno",
      paz_salvo_anterior: "SI",
      ocupacion_madre: "  ",
      ocupacion_padre: null,
      direccion: "No es de admisión",
    });

    expect(datos.map((dato) => dato.campo)).toEqual([
      "colegio_anterior",
      "anio_cursado_anterior",
      "pre_escolar_anterior",
      "ebp_anterior",
      "motivo_retiro_anterior",
      "paz_salvo_anterior",
      "ocupacion_padre",
      "ocupacion_madre",
    ]);
    expect(datos[0]).toEqual({
      campo: "colegio_anterior",
      etiqueta: "Colegio anterior",
      valor: "Colegio Uno",
    });
    expect(datos[5].valor).toBe("SI");
    expect(datos[6].valor).toBeNull();
    expect(datos[7].valor).toBeNull();
  });
});

// SISBÉN y lugar de residencia, paso S3 (docs/funcionalidades/SISBEN_RESIDENCIA.md).
// El formulario guarda "si", "no" o "" (sin dato); el backend, true, false o
// null. El cuerpo siempre lleva los ocho, para que el backend los reemplace
// juntos.
describe("SISBÉN y lugar de residencia", () => {
  const OCHO = [
    "sisben",
    "sisben_grupo",
    "sisben_subgrupo",
    "sisben_nivel",
    "barrio",
    "municipio",
    "zona_residencia",
    "punto_referencia",
  ];

  it("el estado inicial trae los ocho vacíos", () => {
    const inicial = crearEstudianteInicial();

    for (const campo of OCHO) expect(inicial[campo]).toBe("");
    // Al crear, el cuerpo los lleva todos, en null.
    const payload = limpiarPayloadEstudiante(inicial);
    for (const campo of OCHO) expect(payload).toHaveProperty(campo, null);
  });

  it("los subgrupos del SISBÉN IV van de A1 a A5, B1 a B7, C1 a C18 y D1 a D21", () => {
    expect(SUBGRUPOS_SISBEN.A).toEqual(["A1", "A2", "A3", "A4", "A5"]);
    expect(SUBGRUPOS_SISBEN.B).toHaveLength(7);
    expect(SUBGRUPOS_SISBEN.C.at(-1)).toBe("C18");
    expect(SUBGRUPOS_SISBEN.D).toHaveLength(21);
    expect(SUBGRUPOS_SISBEN.D[0]).toBe("D1");
    expect(GRUPOS_SISBEN.map((grupo) => grupo.valor)).toEqual(["A", "B", "C", "D"]);
  });

  it.each([
    ["si", true],
    ["no", false],
    ["", null],
    [true, true],
    [false, false],
  ])("al enviar, el SISBÉN %j viaja como %j", (enFormulario, enCuerpo) => {
    expect(limpiarPayloadEstudiante({ sisben: enFormulario }).sisben).toBe(enCuerpo);
  });

  it("al enviar, el nivel viaja como número y vacío como null", () => {
    expect(limpiarPayloadEstudiante({ sisben_nivel: "2" }).sisben_nivel).toBe(2);
    expect(limpiarPayloadEstudiante({ sisben_nivel: "" }).sisben_nivel).toBeNull();
  });

  it("sin los campos del SISBÉN, el cuerpo no los inventa", () => {
    expect(limpiarPayloadEstudiante({ nombre: "Ana" })).toEqual({ nombre: "Ana" });
  });

  it("al editar, lo que trae el backend se vuelve a poner en el formulario", () => {
    const enFormulario = normalizarEstudianteParaEdicion({
      id: 12,
      nombre: "Luis",
      sisben: true,
      sisben_grupo: "B",
      sisben_subgrupo: "B4",
      sisben_nivel: 2,
      barrio: null,
      zona_residencia: "rural",
    });

    expect(enFormulario).toEqual({
      nombre: "Luis",
      sisben: "si",
      sisben_grupo: "B",
      sisben_subgrupo: "B4",
      sisben_nivel: "2",
      barrio: "",
      zona_residencia: "rural",
    });
    // Y vuelve igual al guardar.
    expect(limpiarPayloadEstudiante(enFormulario)).toMatchObject({
      sisben: true,
      sisben_grupo: "B",
      sisben_subgrupo: "B4",
      sisben_nivel: 2,
      barrio: null,
      zona_residencia: "rural",
    });
  });

  it("al editar, sin SISBÉN queda en no y sin dato queda vacío", () => {
    expect(normalizarEstudianteParaEdicion({ sisben: false }).sisben).toBe("no");
    expect(normalizarEstudianteParaEdicion({ sisben: null }).sisben).toBe("");
  });

  describe("al cambiar un campo", () => {
    const conSisben = {
      ...crearEstudianteInicial(),
      sisben: "si",
      sisben_grupo: "B",
      sisben_subgrupo: "B4",
      sisben_nivel: "2",
    };

    it.each(["no", ""])("si el SISBÉN pasa a %j, se vacían grupo, subgrupo y nivel", (valor) => {
      expect(actualizarCampoEstudiante(conSisben, "sisben", valor)).toMatchObject({
        sisben: valor,
        sisben_grupo: "",
        sisben_subgrupo: "",
        sisben_nivel: "",
      });
    });

    it("si cambia el grupo, se vacía el subgrupo que ya no es suyo", () => {
      expect(actualizarCampoEstudiante(conSisben, "sisben_grupo", "C")).toMatchObject({
        sisben_grupo: "C",
        sisben_subgrupo: "",
        sisben_nivel: "2",
      });
    });

    it("si vuelve a elegir el mismo grupo, el subgrupo se queda", () => {
      expect(
        actualizarCampoEstudiante(conSisben, "sisben_grupo", "B").sisben_subgrupo,
      ).toBe("B4");
    });

    it("cualquier otro campo cambia solo él, sin tocar el original", () => {
      const siguiente = actualizarCampoEstudiante(conSisben, "barrio", "El Carmen");

      expect(siguiente).toEqual({ ...conSisben, barrio: "El Carmen" });
      expect(conSisben.barrio).toBe("");
    });
  });
});
