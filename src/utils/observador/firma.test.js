import { describe, expect, it } from "vitest";
import { TIPOS_DOCUMENTO_ACUDIENTE } from "../../constants/documentosEstudiante";
import {
  construirPayloadFirma,
  construirPayloadFirmaPeriodo,
  esConflictoDeFirma,
  faltaParaFirmar,
  FIRMANTE_VACIO,
  firmanteDesdeSugerido,
  formatearFechaHoraFirma,
  MENSAJE_FIRMA_DATOS,
  MENSAJE_FIRMA_FALLO,
  mensajeErrorFirma,
  opcionesTipoDocumento,
  pendientesDelPeriodo,
  periodoParaFirmar,
  periodosConPendientes,
  siguientePendiente,
  textoSelloFirma,
  TIPOS_DOCUMENTO_FIRMANTE,
} from "./firma";

const COMPLETO = {
  firmante: {
    nombre: "Maria Lopez",
    tipoDocumento: "Cédula",
    documento: "52123456",
    parentesco: "Madre",
  },
  imagen: "data:image/png;base64,AAAA",
  leida: true,
};

// Las 10:05 de la hora local, sea cual sea la zona del equipo que corre esto.
const A_LAS_10_05 = new Date(2026, 9, 27, 10, 5).toISOString();

describe("quién firma", () => {
  it("los tipos de documento empiezan por los de la ficha, para que el papá y la mamá encajen", () => {
    expect(TIPOS_DOCUMENTO_FIRMANTE.slice(0, TIPOS_DOCUMENTO_ACUDIENTE.length)).toStrictEqual(
      TIPOS_DOCUMENTO_ACUDIENTE,
    );
    expect(FIRMANTE_VACIO.tipoDocumento).toBe(TIPOS_DOCUMENTO_ACUDIENTE[0]);
  });

  it("un sugerido de la ficha llena el formulario", () => {
    expect(
      firmanteDesdeSugerido({
        parentesco: "Madre",
        nombre: "Maria Lopez",
        tipo_documento: "Cédula Extranjera",
        documento: "E123",
      }),
    ).toStrictEqual({
      nombre: "Maria Lopez",
      tipoDocumento: "Cédula Extranjera",
      documento: "E123",
      parentesco: "Madre",
    });
  });

  it("si la ficha no tiene el tipo de documento, queda el primero", () => {
    expect(firmanteDesdeSugerido({ parentesco: "Padre", nombre: "Jose", tipo_documento: "" }))
      .toMatchObject({ tipoDocumento: TIPOS_DOCUMENTO_ACUDIENTE[0], documento: "" });
  });

  it("un tipo de documento que no está en la lista se añade, nunca se pierde", () => {
    expect(opcionesTipoDocumento("Cédula")).toBe(TIPOS_DOCUMENTO_FIRMANTE);
    expect(opcionesTipoDocumento("Carné diplomático")).toStrictEqual([
      ...TIPOS_DOCUMENTO_FIRMANTE,
      "Carné diplomático",
    ]);
  });
});

describe("qué falta para guardar", () => {
  it("con todo completo no falta nada", () => {
    expect(faltaParaFirmar(COMPLETO)).toBeNull();
  });

  it.each([
    ["nombre", "Escribe el nombre de quien firma."],
    ["tipoDocumento", "Elige el tipo de documento."],
    ["documento", "Escribe el número de documento."],
    ["parentesco", "Escribe el parentesco."],
  ])("dice que falta %s, y un campo de solo espacios cuenta como vacío", (campo, mensaje) => {
    expect(
      faltaParaFirmar({ ...COMPLETO, firmante: { ...COMPLETO.firmante, [campo]: "   " } }),
    ).toBe(mensaje);
  });

  it("sin trazo no se guarda una firma en blanco", () => {
    expect(faltaParaFirmar({ ...COMPLETO, imagen: null })).toBe("Falta la firma en el recuadro.");
  });

  it("sin la casilla de lectura no se guarda", () => {
    expect(faltaParaFirmar({ ...COMPLETO, leida: false })).toBe(
      "Confirma que el acudiente leyó lo que va a firmar.",
    );
  });
});

describe("firmar un periodo de una vez", () => {
  const p1Pendiente = { id: 1, periodo: 1, version: "v1", puede_firmar: true, firma: null };
  const p1Firmada = { id: 2, periodo: 1, puede_firmar: false, firma: { firmante_nombre: "X" } };
  const p1Ajena = { id: 3, periodo: 1, puede_firmar: false, firma: null };
  const p2Pendiente = { id: 4, periodo: 2, version: "v4", puede_firmar: true, firma: null };
  const p2Otra = { id: 5, periodo: "2", version: "v5", puede_firmar: true, firma: null };
  const BITACORA = [p2Otra, p1Pendiente, p1Firmada, p1Ajena, p2Pendiente];

  it("entran solo las del periodo que se pueden firmar y no están firmadas", () => {
    expect(pendientesDelPeriodo(BITACORA, 1)).toStrictEqual([p1Pendiente]);
    expect(pendientesDelPeriodo(BITACORA, "2")).toStrictEqual([p2Otra, p2Pendiente]);
    expect(pendientesDelPeriodo(BITACORA, 3)).toStrictEqual([]);
  });

  it("cuenta cuántas hay por periodo, del primero al último", () => {
    expect(periodosConPendientes(BITACORA)).toStrictEqual([
      { periodo: 1, cantidad: 1 },
      { periodo: 2, cantidad: 2 },
    ]);
    expect(periodosConPendientes([p1Firmada, p1Ajena])).toStrictEqual([]);
  });

  it("abre con el periodo del selector si tiene pendientes; si no, con el primero", () => {
    expect(periodoParaFirmar(BITACORA, "2")).toBe(2);
    expect(periodoParaFirmar(BITACORA, "todos")).toBe(1);
    expect(periodoParaFirmar(BITACORA, "3")).toBe(1);
    expect(periodoParaFirmar([p1Firmada], "1")).toBeNull();
  });

  it("manda la lista exacta que se mostró, con sus versiones, y no el número del periodo", () => {
    const payload = construirPayloadFirmaPeriodo({
      firmante: COMPLETO.firmante,
      imagen: COMPLETO.imagen,
      anotaciones: [p2Otra, p2Pendiente],
    });

    expect(payload).toStrictEqual({
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: "data:image/png;base64,AAAA",
      anotaciones: [{ id: 5, version: "v5" }, { id: 4, version: "v4" }],
    });
    expect(payload).not.toHaveProperty("periodo");
  });
});

describe("lo que se envía", () => {
  it("limpia los espacios y lleva la versión que trajo la bitácora", () => {
    const payload = construirPayloadFirma({
      firmante: { ...COMPLETO.firmante, nombre: "  Maria   Lopez " },
      imagen: COMPLETO.imagen,
      version: "a1b2c3",
    });

    expect(payload).toStrictEqual({
      firmante_nombre: "Maria Lopez",
      firmante_tipo_documento: "Cédula",
      firmante_documento: "52123456",
      firmante_parentesco: "Madre",
      imagen: "data:image/png;base64,AAAA",
      version: "a1b2c3",
    });
  });

  it("no manda quién toma la firma ni la hora: los pone el servidor", () => {
    const payload = construirPayloadFirma({ ...COMPLETO, version: "v" });
    expect(payload).not.toHaveProperty("tomada_por_profesor_id");
    expect(payload).not.toHaveProperty("firmada_en");
  });
});

describe("la siguiente pendiente", () => {
  const firmada = { id: 1, puede_firmar: false, firma: { firmante_nombre: "X" } };
  const ajena = { id: 2, puede_firmar: false, firma: null };
  const pendiente = { id: 3, puede_firmar: true, firma: null };
  const otraPendiente = { id: 4, puede_firmar: true, firma: null };

  it("es la primera que se puede firmar, en el orden de la bitácora", () => {
    expect(siguientePendiente([firmada, ajena, pendiente, otraPendiente], 99)).toBe(pendiente);
  });

  it("no cuenta la que se acaba de firmar, aunque la lista todavía no se haya recargado", () => {
    expect(siguientePendiente([pendiente, otraPendiente], 3)).toBe(otraPendiente);
  });

  it("sin pendientes no hay siguiente", () => {
    expect(siguientePendiente([firmada, ajena], 99)).toBeNull();
    expect(siguientePendiente(undefined, 1)).toBeNull();
  });
});

describe("el sello", () => {
  it("dice quién firmó, con qué documento, cuándo y ante quién", () => {
    expect(
      textoSelloFirma({
        firmante_nombre: "Maria Lopez",
        firmante_parentesco: "Madre",
        firmante_tipo_documento: "Cédula",
        firmante_documento_enmascarado: "****3456",
        firmada_en: A_LAS_10_05,
        tomada_por_nombre: "Ana Gómez",
        integra: true,
      }),
    ).toBe("Firmada por Maria Lopez (Madre) · Cédula ****3456 · 27/oct/2026, 10:05 · ante Ana Gómez");
  });

  it("la fecha lleva año y hora", () => {
    expect(formatearFechaHoraFirma(A_LAS_10_05)).toBe("27/oct/2026, 10:05");
    expect(formatearFechaHoraFirma(null)).toBe("Sin fecha");
  });

  it("sin firma no hay sello", () => {
    expect(textoSelloFirma(null)).toBe("");
  });
});

describe("los errores al firmar", () => {
  it("enseña el texto del servidor cuando lo hay", () => {
    const error = {
      response: { status: 409, data: { detail: "Esta anotacion ya tiene la firma del acudiente." } },
    };
    expect(mensajeErrorFirma(error)).toBe("Esta anotacion ya tiene la firma del acudiente.");
    expect(esConflictoDeFirma(error)).toBe(true);
  });

  it("un 422 de validación no se le enseña a nadie tal cual", () => {
    const error = { response: { status: 422, data: { detail: [{ msg: "Value error" }] } } };
    expect(mensajeErrorFirma(error)).toBe(MENSAJE_FIRMA_DATOS);
    expect(esConflictoDeFirma(error)).toBe(false);
  });

  it("sin respuesta del servidor, pide revisar la conexión", () => {
    expect(mensajeErrorFirma(new Error("Network Error"))).toBe(MENSAJE_FIRMA_FALLO);
  });
});
