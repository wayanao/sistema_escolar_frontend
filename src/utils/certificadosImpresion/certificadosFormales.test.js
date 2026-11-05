import { describe, expect, it } from "vitest";

import {
  concordar,
  construirCertificadoFormal,
  costosDesdeValoresPago,
  datosInstitucionalesCertificado,
  fraseExpedicion,
  hablaEnPasado,
  parrafoCertificado,
  resumirDeudaPazSalvo,
  textoCosto,
  textoDocumento,
  textoNivel,
} from "./certificadosFormales";

const unir = (partes) => partes.map((parte) => parte.texto).join("");

const CERTIFICADO = {
  estudiante_nombre_completo: "Wilkis Junior Acosta",
  tipo_documento: "Registro Civil",
  documento_identidad: "1,041,853,132",
  curso: "Jardín",
  nivel: "preescolar",
  anio_lectivo: "2025",
  en_pasado: true,
};

describe("certificados con el formato de los modelos", () => {
  it("abrevia el tipo de documento como en los modelos", () => {
    expect(textoDocumento("Registro Civil", "1,041,853,132")).toBe("R.C. No. 1,041,853,132");
    expect(textoDocumento("Tarjeta de Identidad", "1.042")).toBe("T.I. No. 1.042");
    expect(textoDocumento("Cédula de Ciudadanía", "9")).toBe("C.C. No. 9");
    expect(textoDocumento("Cédula de Extranjería", "9")).toBe("C.E. No. 9");
    expect(textoDocumento("Pasaporte", "AB1")).toBe("Pasaporte No. AB1");
    expect(textoDocumento("Otro", "77")).toBe("documento No. 77");
    expect(textoDocumento(null, "")).toBe("documento No. ________");
  });

  it("escribe el nivel y concuerda las palabras con lo elegido", () => {
    expect(textoNivel("preescolar")).toBe("Educación Preescolar");
    expect(textoNivel("primaria")).toBe("Educación Básica Primaria");
    expect(textoNivel(null)).toBe("");
    expect(concordar("identificad", "masculino")).toBe("identificado");
    expect(concordar("identificad", "femenino")).toBe("identificada");
    expect(concordar("identificad", "neutro")).toBe("identificado(a)");
  });

  it("dice «cursó» con el año cerrado o el estudiante retirado o egresado", () => {
    expect(hablaEnPasado({ anioCerrado: true, estadoEstudiante: "activo" })).toBe(true);
    expect(hablaEnPasado({ anioCerrado: false, estadoEstudiante: "Retirado" })).toBe(true);
    expect(hablaEnPasado({ anioCerrado: false, estadoEstudiante: "egresado" })).toBe(true);
    expect(hablaEnPasado({ anioCerrado: false, estadoEstudiante: "activo" })).toBe(false);
  });

  it("escribe el día en letras y con dos cifras, como en los modelos", () => {
    expect(fraseExpedicion({ ciudad: "Galapa", fecha: new Date(2026, 0, 20) })).toBe(
      "Se expide la presente certificación a solicitud del interesado en Galapa, "
        + "a los veinte (20) días del mes de enero de 2026.",
    );
    expect(fraseExpedicion({ ciudad: "Galapa", fecha: new Date(2025, 7, 4) })).toContain(
      "a los cuatro (04) días del mes de agosto de 2025.",
    );
    expect(fraseExpedicion({ ciudad: "", fecha: new Date(2025, 0, 21) })).toBe(
      "Se expide la presente certificación a solicitud del interesado, "
        + "a los veintiún (21) días del mes de enero de 2025.",
    );
    expect(fraseExpedicion({ ciudad: "Galapa", fecha: new Date(2025, 2, 1) })).toContain(
      "al primer (01) día del mes de marzo de 2025.",
    );
  });

  it("lee la firma y la ciudad de la identidad; sin cargo, «Director(a)»", () => {
    expect(datosInstitucionalesCertificado(null)).toEqual({
      encabezado: "",
      ciudad: "",
      firma: { nombre: "", documento: "", cargo: "Director(a)" },
    });
    expect(datosInstitucionalesCertificado({
      configuracion_extra: {
        certificado_encabezado: "  LA SUSCRITA  ",
        firmante_nombre: "Ana",
        firmante_documento: "C.C. 1",
        firmante_cargo: "Rectora",
        ciudad_expedicion: "Galapa",
      },
    })).toEqual({
      encabezado: "LA SUSCRITA",
      ciudad: "Galapa",
      firma: { nombre: "Ana", documento: "C.C. 1", cargo: "Rectora" },
    });
  });

  it("arma los datos con el curso del año y el tipo de documento de la ficha", () => {
    expect(construirCertificadoFormal({
      tipo: "conducta",
      estudiante: { nombre: "Sara", apellido: "López", documento: "TI-1", estado: "activo" },
      ficha: { tipo_documento: "Tarjeta de Identidad", documento_identidad: "TI-123" },
      curso: { nombre: "Quinto", nivel: "primaria" },
      anioLectivo: 2026,
      anioCerrado: false,
    })).toEqual({
      tipo: "conducta",
      estudiante_nombre_completo: "Sara López",
      tipo_documento: "Tarjeta de Identidad",
      documento_identidad: "TI-123",
      curso: "Quinto",
      nivel: "primaria",
      anio_lectivo: "2026",
      en_pasado: false,
    });
  });

  it("escribe el párrafo de cada certificado, con nombre y grado resaltados", () => {
    const aprobado = parrafoCertificado({ tipo: "aprobado", certificado: CERTIFICADO, tratamiento: "nino" });
    expect(unir(aprobado)).toBe(
      "Que el niño WILKIS JUNIOR ACOSTA, identificado con R.C. No. 1,041,853,132, cursó y aprobó "
        + "en esta institución el grado JARDÍN del nivel de Educación Preescolar del año lectivo 2025.",
    );
    expect(aprobado.filter((parte) => parte.negrita).map((parte) => parte.texto)).toEqual([
      "WILKIS JUNIOR ACOSTA",
      "JARDÍN",
    ]);

    expect(unir(parrafoCertificado({
      tipo: "conducta",
      certificado: { ...CERTIFICADO, nivel: null },
      tratamiento: "estudiante_f",
      desempeno: "BÁSICO",
    }))).toBe(
      "Que la estudiante WILKIS JUNIOR ACOSTA, identificada con R.C. No. 1,041,853,132, cursó en "
        + "esta institución el grado JARDÍN del año lectivo 2025, con una conducta descriptiva en "
        + "DESEMPEÑO BÁSICO.",
    );

    expect(unir(parrafoCertificado({
      tipo: "matricula",
      certificado: { ...CERTIFICADO, en_pasado: false },
      tratamiento: "nina",
    }))).toContain("identificada con R.C. No. 1,041,853,132, se encuentra matriculada en esta institución en el grado JARDÍN");
  });

  it("escribe el paz y salvo como el modelo", () => {
    expect(unir(parrafoCertificado({ tipo: "paz-salvo", certificado: CERTIFICADO, tratamiento: "nino" }))).toBe(
      "Que el niño WILKIS JUNIOR ACOSTA, identificado con R.C. No. 1,041,853,132, quien cursó el "
        + "grado JARDÍN del nivel de Educación Preescolar del año lectivo 2025, se encuentra a paz y "
        + "salvo con nuestra institución.",
    );
    expect(unir(parrafoCertificado({
      tipo: "paz-salvo",
      certificado: { ...CERTIFICADO, en_pasado: false },
    }))).toContain("quien cursa el grado JARDÍN");
  });

  it("lista y suma lo que impide el paz y salvo: el año, los anteriores y las ventas", () => {
    expect(resumirDeudaPazSalvo({
      deudas: {
        deudas: [
          { concepto: "Pensión", deuda: 260000 },
          { concepto: "Matrícula", deuda: 0 },
        ],
        total_deuda: 260000,
        deuda_anios_anteriores: [{ anio: 2025, total_deuda: 130000 }, { anio: 2024, total_deuda: 0 }],
      },
      ventas: [
        { id: 4, total: 45000, descripcion: "Cargo de Inventario #4: 1x Camiseta" },
        { id: 5, total: 0, descripcion: "Pagada" },
      ],
    })).toEqual({
      items: [
        { etiqueta: "Pensión", valor: 260000 },
        { etiqueta: "Año 2025", valor: 130000 },
        { etiqueta: "Cargo de Inventario #4: 1x Camiseta", valor: 45000 },
      ],
      total: 435000,
    });
    expect(resumirDeudaPazSalvo({ deudas: { deudas: [], deuda_anios_anteriores: [] }, ventas: [] }))
      .toEqual({ items: [], total: 0 });
  });

  it("llena los costos con lo que paga el estudiante y los escribe como el modelo", () => {
    expect(costosDesdeValoresPago({
      conceptos: [
        { tipo_pago_id: 1, nombre: "Matrícula", valor_a_pagar: 280000 },
        { tipo_pago_id: 2, nombre: "Pensión", valor_a_pagar: 130000.4 },
      ],
    })).toEqual([
      { id: "concepto-1", concepto: "Matrícula", valor: "280000" },
      { id: "concepto-2", concepto: "Pensión", valor: "130000" },
    ]);
    expect(costosDesdeValoresPago(null)).toEqual([]);

    expect(textoCosto({ concepto: "Matrícula", valor: "280000" })).toBe("Matrícula: $\u00a0280.000");
    expect(textoCosto({ concepto: "Uniforme", valor: "" })).toBe("Uniforme");
    expect(textoCosto({ concepto: "  ", valor: "5000" })).toBe("");
  });

  it("la carta de costos dice que está matriculado, como el modelo", () => {
    expect(unir(parrafoCertificado({
      tipo: "costos",
      certificado: { ...CERTIFICADO, en_pasado: false },
      tratamiento: "nina",
    }))).toContain("se encuentra matriculada en esta institución en el grado JARDÍN");
  });
});
