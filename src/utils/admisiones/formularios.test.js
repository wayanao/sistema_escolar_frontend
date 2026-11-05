import { describe, expect, it } from "vitest";
import {
  CAMPOS_ASPIRANTE,
  CAMPOS_ENTREVISTA,
  CAMPOS_ESTUDIOS_ANTERIORES,
  CAMPOS_FAMILIA_ENTREVISTA,
  LIMITES_TEXTO,
  construirCuerpoAdmision,
  construirCuerpoAspirante,
  construirCuerpoResultado,
  contarLlenos,
  datosParaMatricular,
  crearFormularioAdmision,
  formularioDesdeAdmision,
  resultadoDesdeAdmision,
  validarAspirante,
  validarResultado,
} from "./formularios";

const lleno = (cambios = {}) => ({
  ...crearFormularioAdmision(),
  nombre: "Lina",
  apellido: "Díaz",
  autoriza_datos: true,
  autoriza_nombre: "Marta Díaz",
  ...cambios,
});

describe("formulario de la admisión", () => {
  it("empieza vacío y sin la autorización marcada", () => {
    const formulario = crearFormularioAdmision();

    expect(Object.keys(formulario)).toEqual([...CAMPOS_ASPIRANTE, ...CAMPOS_ENTREVISTA]);
    expect(formulario.autoriza_datos).toBe(false);
    expect(formulario.nombre).toBe("");
    expect(formulario.curso_id).toBe("");
  });

  it("se llena desde una admisión del backend sin dejar null en los campos", () => {
    const formulario = formularioDesdeAdmision({
      id: 7,
      nombre: "Lina",
      apellido: "Díaz",
      documento_identidad: null,
      curso_id: 20,
      autoriza_datos: true,
      autoriza_nombre: "Marta",
      observaciones: null,
      resultado: "aprobado",
    });

    expect(formulario.nombre).toBe("Lina");
    expect(formulario.documento_identidad).toBe("");
    expect(formulario.curso_id).toBe("20");
    expect(formulario.autoriza_datos).toBe(true);
    expect(formulario.observaciones).toBe("");
    expect(formulario).not.toHaveProperty("resultado");
  });
});

describe("cuerpos que viajan al backend", () => {
  it("registrar manda solo los datos del aspirante, recortados y con vacíos como null", () => {
    const cuerpo = construirCuerpoAspirante(
      lleno({
        nombre: "  Lina ",
        documento_identidad: "   ",
        curso_id: "20",
        fecha_nacimiento: "2019-03-04",
        observaciones: "No viaja al registrar",
      }),
    );

    expect(Object.keys(cuerpo)).toEqual(CAMPOS_ASPIRANTE);
    expect(cuerpo.nombre).toBe("Lina");
    expect(cuerpo.documento_identidad).toBeNull();
    expect(cuerpo.curso_id).toBe(20);
    expect(cuerpo.fecha_nacimiento).toBe("2019-03-04");
    expect(cuerpo.autoriza_datos).toBe(true);
  });

  it("sin curso elegido manda null", () => {
    expect(construirCuerpoAspirante(lleno()).curso_id).toBeNull();
  });

  it("guarda los nombres de personas con mayúscula inicial, y lo demás como se escribió", () => {
    // Pedido del usuario el 2026-11-05: que los nombres lleven las mayúsculas.
    const cuerpo = construirCuerpoAdmision(
      lleno({
        nombre: "  maría   josé ",
        apellido: "GÓMEZ ruiz",
        acudiente_nombre: "carlos gómez",
        autoriza_nombre: "marta díaz",
        entrevistador: "psicóloga ruiz",
        acudiente_parentesco: "papá",
        documento_identidad: "abc-123",
        asistentes: "mamá y abuela",
        observaciones: "llegó tarde",
      }),
    );

    expect(cuerpo.nombre).toBe("María José");
    expect(cuerpo.apellido).toBe("Gómez Ruiz");
    expect(cuerpo.acudiente_nombre).toBe("Carlos Gómez");
    expect(cuerpo.autoriza_nombre).toBe("Marta Díaz");
    expect(cuerpo.entrevistador).toBe("Psicóloga Ruiz");
    expect(cuerpo.acudiente_parentesco).toBe("papá");
    expect(cuerpo.documento_identidad).toBe("abc-123");
    expect(cuerpo.asistentes).toBe("mamá y abuela");
    expect(cuerpo.observaciones).toBe("llegó tarde");
    expect(construirCuerpoAspirante(lleno({ acudiente_nombre: "   " })).acudiente_nombre).toBeNull();
  });

  it("editar manda el aspirante y la entrevista", () => {
    const cuerpo = construirCuerpoAdmision(
      lleno({ entrevistador: " Psicóloga Ruiz ", expectativas: "", paz_salvo_anterior: "SI" }),
    );

    expect(Object.keys(cuerpo)).toEqual([...CAMPOS_ASPIRANTE, ...CAMPOS_ENTREVISTA]);
    expect(cuerpo.entrevistador).toBe("Psicóloga Ruiz");
    expect(cuerpo.expectativas).toBeNull();
    expect(cuerpo.paz_salvo_anterior).toBe("SI");
    expect(cuerpo).not.toHaveProperty("resultado");
  });

  it("el resultado manda el motivo recortado o null", () => {
    expect(construirCuerpoResultado({ resultado: "no_aprobado", motivo_resultado: " Cupo " })).toEqual({
      resultado: "no_aprobado",
      motivo_resultado: "Cupo",
    });
    expect(construirCuerpoResultado({ resultado: "aprobado", motivo_resultado: "" })).toEqual({
      resultado: "aprobado",
      motivo_resultado: null,
    });
  });

  it("el resultado se llena desde la admisión", () => {
    expect(resultadoDesdeAdmision({ resultado: "no_aprobado", motivo_resultado: "Cupo" })).toEqual({
      resultado: "no_aprobado",
      motivo_resultado: "Cupo",
    });
    expect(resultadoDesdeAdmision(null)).toEqual({ resultado: "pendiente", motivo_resultado: "" });
  });
});

describe("validación antes de enviar (el backend vuelve a validar)", () => {
  it("un aspirante completo no tiene errores", () => {
    expect(validarAspirante(lleno())).toEqual({});
  });

  it("pide nombre, apellidos, la autorización y quién autoriza", () => {
    expect(validarAspirante(crearFormularioAdmision())).toEqual({
      nombre: "Escribe el nombre.",
      apellido: "Escribe los apellidos.",
      autoriza_datos: "Sin la autorización de datos no se puede registrar al aspirante.",
      autoriza_nombre: "Escribe quién autoriza.",
    });
    expect(validarAspirante(lleno({ nombre: "   " }))).toEqual({ nombre: "Escribe el nombre." });
  });

  it("no aprobado exige el motivo; aprobado y pendiente no", () => {
    expect(validarResultado({ resultado: "no_aprobado", motivo_resultado: "  " })).toEqual({
      motivo_resultado: 'Para marcar "No aprobado" escribe el motivo.',
    });
    expect(validarResultado({ resultado: "no_aprobado", motivo_resultado: "Cupo" })).toEqual({});
    expect(validarResultado({ resultado: "aprobado", motivo_resultado: "" })).toEqual({});
  });

  it("los límites de texto son los de la base", () => {
    expect(LIMITES_TEXTO).toMatchObject({
      nombre: 100,
      documento_identidad: 20,
      autoriza_nombre: 150,
      entrevistador: 150,
      asistentes: 250,
      paz_salvo_anterior: 10,
      vive_con: 250,
    });
    expect(LIMITES_TEXTO).not.toHaveProperty("observaciones");
  });
});

describe("la ficha del estudiante al matricular (paso E5)", () => {
  it("lleva los datos del aspirante y lo de la entrevista, sin vacíos", () => {
    const datos = datosParaMatricular({
      id: 7,
      nombre: "Lina",
      apellido: "Díaz",
      tipo_documento: "Registro Civil",
      documento_identidad: "2001",
      fecha_nacimiento: "2019-03-04",
      curso_id: 20,
      acudiente_nombre: "Marta Díaz",
      colegio_anterior: "Colegio Uno",
      paz_salvo_anterior: "SI",
      ocupacion_madre: null,
      observaciones: "No va a la ficha",
      resultado: "aprobado",
    });

    expect(datos).toEqual({
      nombre: "Lina",
      apellido: "Díaz",
      tipo_documento: "Registro Civil",
      documento_identidad: "2001",
      fecha_nacimiento: "2019-03-04",
      curso_id: "20",
      colegio_anterior: "Colegio Uno",
      paz_salvo_anterior: "SI",
    });
  });

  it("el curso siempre viaja: sin curso elegido, vacío (y no el de otro año)", () => {
    expect(datosParaMatricular({ nombre: "Lina", curso_id: null })).toEqual({
      nombre: "Lina",
      curso_id: "",
    });
  });
});

// 2026-10-20, a pedido del usuario: "Estudios anteriores" y la familia de la
// entrevista van en las secciones que se abren y se cierran, con su conteo.
describe("las secciones de la entrevista que se abren y se cierran", () => {
  it("Estudios anteriores y Familia reparten lo de la entrevista, menos quién y cuándo", () => {
    expect(CAMPOS_ESTUDIOS_ANTERIORES).toEqual([
      "colegio_anterior",
      "anio_cursado_anterior",
      "pre_escolar_anterior",
      "ebp_anterior",
      "paz_salvo_anterior",
      "motivo_retiro_anterior",
    ]);
    expect(CAMPOS_FAMILIA_ENTREVISTA).toEqual([
      "ocupacion_padre",
      "ocupacion_madre",
      "vive_con",
      "expectativas",
      "observaciones",
    ]);
    const repartidos = [...CAMPOS_ESTUDIOS_ANTERIORES, ...CAMPOS_FAMILIA_ENTREVISTA];
    expect(CAMPOS_ENTREVISTA.filter((campo) => !repartidos.includes(campo))).toEqual([
      "fecha_entrevista",
      "entrevistador",
      "asistentes",
    ]);
  });

  it("cuenta los campos llenos; los espacios solos no cuentan", () => {
    const formulario = {
      ...crearFormularioAdmision(),
      colegio_anterior: "Colegio Uno",
      anio_cursado_anterior: "   ",
      paz_salvo_anterior: "SI",
    };

    expect(contarLlenos(formulario, CAMPOS_ESTUDIOS_ANTERIORES)).toEqual({
      respondidas: 2,
      total: 6,
    });
    expect(contarLlenos(formulario, CAMPOS_FAMILIA_ENTREVISTA)).toEqual({
      respondidas: 0,
      total: 5,
    });
  });
});
