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
  OPCIONES_PERIODO_RESUMEN,
  rendimientoDelPeriodo,
  ultimoPeriodoConNotas,
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

  it("guarda los nombres de personas con mayúscula inicial, y lo demás como se escribió", () => {
    // Pedido del usuario el 2026-11-05: que los nombres lleven las mayúsculas.
    const payload = limpiarPayloadEstudiante({
      nombre: "  maría   del pilar ",
      apellido: "GÓMEZ ruiz",
      nombre_padre: "carlos gómez",
      nombre_madre: "",
      lugar_expedicion: "bogotá D.C.",
      direccion: "calle 10 # 5-20",
      email: "Ana.Gomez@Correo.com",
      documento_identidad: "abc-123",
      ocupacion_padre: "conductor",
    });

    expect(payload).toMatchObject({
      nombre: "María Del Pilar",
      apellido: "Gómez Ruiz",
      nombre_padre: "Carlos Gómez",
      nombre_madre: null,
      lugar_expedicion: "bogotá D.C.",
      direccion: "calle 10 # 5-20",
      email: "Ana.Gomez@Correo.com",
      documento_identidad: "abc-123",
      ocupacion_padre: "conductor",
    });
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

describe("notas por periodo en el resumen (NOTAS_RESUMEN_ESTUDIANTE.md)", () => {
  const sinNota = { 1: null, 2: null, 3: null, 4: null };
  const RESPUESTA = {
    notas_por_periodo: {
      materias: [
        {
          materia: "MATEMÁTICAS",
          tipo_evaluacion: "numerica",
          periodos: { ...sinNota, 1: { nota: 4.67, valoracion: null }, 2: { nota: 2.95, valoracion: null } },
          anio: { nota: 3.81, valoracion: null },
        },
        {
          materia: "SOCIALES",
          tipo_evaluacion: "numerica",
          periodos: { ...sinNota, 1: { nota: 3.5, valoracion: null } },
          anio: { nota: 3.5, valoracion: null },
        },
      ],
      promedio: { 1: 4.085, 2: 2.95, 3: null, 4: null, anio: 3.655 },
    },
    inasistencias_por_periodo: { 1: 4, 2: 1, 3: 0, 4: 0, anio: 5 },
  };
  const PREESCOLAR = {
    notas_por_periodo: {
      materias: [
        {
          materia: "DIMENSIÓN COGNITIVA",
          tipo_evaluacion: "desarrollo",
          periodos: { ...sinNota, 1: { nota: 3.5, valoracion: "logrado" } },
          anio: { nota: 3.5, valoracion: "logrado" },
        },
      ],
      promedio: { 1: null, 2: null, 3: null, 4: null, anio: null },
    },
    inasistencias_por_periodo: { 1: 0, 2: 0, 3: 0, 4: 0, anio: 0 },
  };
  const normalizar = (base) => normalizarDetalleEstudiante(base, {});

  it("ofrece los cuatro periodos y Todo el año", () => {
    expect(OPCIONES_PERIODO_RESUMEN.map(({ value }) => value)).toEqual(["1", "2", "3", "4", "anio"]);
    expect(OPCIONES_PERIODO_RESUMEN.at(-1).label).toBe("Todo el año");
  });

  it("sin los campos nuevos (backend anterior) quedan en null", () => {
    const detalles = normalizar({ notas: [], promedio_general: 0 });

    expect(detalles.notas_por_periodo).toBeNull();
    expect(detalles.inasistencias_por_periodo).toBeNull();
  });

  it("abre en el último periodo con notas, o en el 1 sin ninguna", () => {
    expect(ultimoPeriodoConNotas(normalizar(RESPUESTA).notas_por_periodo)).toBe("2");
    expect(ultimoPeriodoConNotas(normalizar(PREESCOLAR).notas_por_periodo)).toBe("1");
    expect(ultimoPeriodoConNotas({ materias: [] })).toBe("1");
    expect(ultimoPeriodoConNotas(null)).toBe("1");
  });

  it("un periodo: promedio, inasistencias y cada materia con un decimal y su color", () => {
    expect(rendimientoDelPeriodo(normalizar(RESPUESTA), "2")).toEqual({
      promedio: { texto: "3.0", aprobado: false },
      inasistencias: 1,
      materias: [
        { materia: "MATEMÁTICAS", texto: "3.0", tono: "reprobada" },
        { materia: "SOCIALES", texto: "Sin nota", tono: "sin_nota" },
      ],
      hayNotas: true,
    });
  });

  it("Todo el año usa la nota del año y el total de inasistencias", () => {
    const anio = rendimientoDelPeriodo(normalizar(RESPUESTA), "anio");

    expect(anio.promedio).toEqual({ texto: "3.7", aprobado: true });
    expect(anio.inasistencias).toBe(5);
    expect(anio.materias[0]).toEqual({ materia: "MATEMÁTICAS", texto: "3.8", tono: "aprobada" });
  });

  it("preescolar muestra la carita y no tiene promedio general", () => {
    const periodo = rendimientoDelPeriodo(normalizar(PREESCOLAR), "1");

    expect(periodo.promedio).toBeNull();
    expect(periodo.materias).toEqual([
      { materia: "DIMENSIÓN COGNITIVA", texto: "😀 Logrado", tono: "carita" },
    ]);
  });

  it("un periodo sin ninguna nota lo dice", () => {
    expect(rendimientoDelPeriodo(normalizar(RESPUESTA), "4").hayNotas).toBe(false);
  });
});
