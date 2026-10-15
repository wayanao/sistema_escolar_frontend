import { describe, expect, it } from "vitest";
import {
  TITULO_ENTREVISTA,
  datosEntrevistaParaImprimir,
  fechaLegible,
  firmasEntrevista,
  subtituloEntrevista,
} from "./impresion";

const ADMISION = {
  id: 7,
  anio: 2027,
  nombre: "Lina",
  apellido: "Díaz",
  tipo_documento: "Registro Civil",
  documento_identidad: "2001",
  fecha_nacimiento: "2019-03-04",
  curso_nombre: "PRIMERO A",
  curso_jornada: "Mañana",
  acudiente_nombre: "Marta Díaz",
  acudiente_parentesco: "Madre",
  acudiente_telefono: "300 111 2222",
  autoriza_datos: true,
  autoriza_nombre: "Marta Díaz",
  fecha_entrevista: "2026-10-20",
  entrevistador: "Psicóloga Ruiz",
  asistentes: "Madre y abuela",
  colegio_anterior: "Jardín Pequeños",
  anio_cursado_anterior: "Transición",
  pre_escolar_anterior: null,
  ebp_anterior: null,
  motivo_retiro_anterior: "Cambio de casa",
  paz_salvo_anterior: "SI",
  ocupacion_padre: null,
  ocupacion_madre: "Docente",
  vive_con: "Madre y abuela",
  expectativas: "Formación en valores",
  observaciones: "Familia puntual",
  resultado: "aprobado",
  motivo_resultado: null,
};

const valorDe = (secciones, etiqueta) =>
  secciones.flatMap((s) => s.filas).find((fila) => fila.etiqueta === etiqueta)?.valor;

describe("impresión de la entrevista", () => {
  it("título y subtítulo", () => {
    expect(TITULO_ENTREVISTA).toBe("Entrevista de admisión");
    expect(subtituloEntrevista(ADMISION)).toBe("Lina Díaz · Admisión 2027");
  });

  it("las fechas como se leen en papel; vacío o raro, en blanco", () => {
    expect(fechaLegible("2026-10-20")).toBe("20/10/2026");
    expect(fechaLegible(null)).toBe("");
    expect(fechaLegible("ayer")).toBe("");
  });

  it("los datos del aspirante, el acudiente, la autorización y la entrevista, en su orden", () => {
    const { secciones } = datosEntrevistaParaImprimir(ADMISION);

    expect(secciones.map((s) => s.titulo)).toEqual([
      "Aspirante",
      "Acudiente",
      "Autorización de datos",
      "Entrevista",
      "Estudios anteriores",
      "Familia",
    ]);
    expect(valorDe(secciones, "Nombre y apellidos")).toBe("Lina Díaz");
    expect(valorDe(secciones, "Documento")).toBe("Registro Civil 2001");
    expect(valorDe(secciones, "Fecha de nacimiento")).toBe("04/03/2019");
    expect(valorDe(secciones, "Curso al que aspira")).toBe("PRIMERO A · Mañana");
    expect(valorDe(secciones, "Parentesco")).toBe("Madre");
    expect(valorDe(secciones, "Autorización de datos personales (Ley 1581 de 2012)")).toBe(
      "Sí, autorizó Marta Díaz",
    );
    expect(valorDe(secciones, "Fecha de la entrevista")).toBe("20/10/2026");
    expect(valorDe(secciones, "Quién entrevistó")).toBe("Psicóloga Ruiz");
    expect(valorDe(secciones, "Paz y salvo")).toBe("SI");
    expect(valorDe(secciones, "Ocupación de la madre")).toBe("Docente");
    expect(valorDe(secciones, "Por qué eligen el colegio y qué esperan")).toBe(
      "Formación en valores",
    );
  });

  it("lo vacío queda en blanco, para escribirlo a mano", () => {
    const { secciones } = datosEntrevistaParaImprimir(ADMISION);

    expect(valorDe(secciones, "Preescolar")).toBe("");
    expect(valorDe(secciones, "Ocupación del padre")).toBe("");
  });

  it("los textos largos se marcan como largos", () => {
    const { secciones } = datosEntrevistaParaImprimir(ADMISION);
    const fila = (etiqueta) => secciones.flatMap((s) => s.filas).find((f) => f.etiqueta === etiqueta);

    expect(fila("Motivo del retiro").largo).toBe(true);
    expect(fila("Por qué eligen el colegio y qué esperan").largo).toBe(true);
    expect(fila("Colegio anterior").largo).toBe(false);
  });

  it("las observaciones van aparte, al final, como en el anexo", () => {
    expect(datosEntrevistaParaImprimir(ADMISION).observaciones).toBe("Familia puntual");
    expect(datosEntrevistaParaImprimir({ ...ADMISION, observaciones: null }).observaciones).toBe("");
  });

  it("el resultado no sale: es un papel que firma la familia", () => {
    const texto = JSON.stringify(datosEntrevistaParaImprimir(ADMISION));

    expect(texto).not.toMatch(/aprobado|Resultado/i);
  });

  it("sin curso ni documento, quedan en blanco", () => {
    const { secciones } = datosEntrevistaParaImprimir({
      ...ADMISION,
      curso_nombre: null,
      tipo_documento: null,
      documento_identidad: null,
    });

    expect(valorDe(secciones, "Curso al que aspira")).toBe("");
    expect(valorDe(secciones, "Documento")).toBe("");
  });

  it("firman la familia y quien entrevistó, con sus nombres si los hay", () => {
    expect(firmasEntrevista(ADMISION)).toEqual([
      { nombre: "Marta Díaz", cargo: "Padre, madre o acudiente" },
      { nombre: "Psicóloga Ruiz", cargo: "Quien entrevistó" },
    ]);
    expect(firmasEntrevista({ ...ADMISION, autoriza_nombre: null, entrevistador: null })).toEqual([
      { nombre: "Marta Díaz", cargo: "Padre, madre o acudiente" },
      { nombre: "", cargo: "Quien entrevistó" },
    ]);
  });
});
