import { describe, expect, it } from "vitest";
import {
  CAMPOS_ASPIRANTE,
  CAMPOS_ENTREVISTA,
  LIMITES_TEXTO,
  construirCuerpoAdmision,
  construirCuerpoAspirante,
  construirCuerpoResultado,
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
