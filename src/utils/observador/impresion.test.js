import { describe, expect, it } from "vitest";
import { PERIODO_TODOS } from "./anotaciones";
import {
  anotacionesParaImprimir,
  avisoSinFirmaDirector,
  etiquetaPeriodoImpreso,
  firmasObservador,
  firmasPorAnotacion,
  IMPRIMIR_MIAS,
  IMPRIMIR_TODO,
  OPCIONES_IMPRESION,
  subtituloImpresion,
  textoFirmaImpresa,
  tituloImpresion,
} from "./impresion";

const ANOTACIONES = [
  { id: 12, profesor_id: 7, profesor: "Ana Gómez", conductual: "Mía." },
  { id: 13, profesor_id: 8, profesor: "Luis Díaz", conductual: "De otro." },
  { id: 14, profesor_id: 7, profesor: "Ana Gómez", cognitivo: "Mía también." },
];

describe("qué anotaciones entran en el impreso", () => {
  it("ofrece las dos opciones que decidió el usuario", () => {
    expect(OPCIONES_IMPRESION).toStrictEqual([
      { value: IMPRIMIR_TODO, label: "Todo el observador" },
      { value: IMPRIMIR_MIAS, label: "Solo mis anotaciones" },
    ]);
  });

  it("«Todo el observador» lleva las de todos los profesores", () => {
    // Es el documento oficial que va a la carpeta del alumno.
    expect(anotacionesParaImprimir(ANOTACIONES, IMPRIMIR_TODO, 7)).toHaveLength(3);
  });

  it("«Solo mis anotaciones» lleva únicamente las de quien imprime", () => {
    const mias = anotacionesParaImprimir(ANOTACIONES, IMPRIMIR_MIAS, 7);

    expect(mias.map((a) => a.id)).toStrictEqual([12, 14]);
  });

  it("no decide de cuándo, solo de quién", () => {
    // Recibe las que ya estan en pantalla, o sea las del periodo elegido: el
    // filtro del periodo lo aplica el servidor, no esto.
    const recortadas = [ANOTACIONES[0]];

    expect(anotacionesParaImprimir(recortadas, IMPRIMIR_TODO, 7)).toStrictEqual(recortadas);
  });

  it("sin anotaciones propias devuelve una lista vacía, no todas", () => {
    expect(anotacionesParaImprimir(ANOTACIONES, IMPRIMIR_MIAS, 99)).toStrictEqual([]);
  });

  it("aguanta que no llegue lista", () => {
    expect(anotacionesParaImprimir(null, IMPRIMIR_TODO, 7)).toStrictEqual([]);
    expect(anotacionesParaImprimir(undefined, IMPRIMIR_MIAS, 7)).toStrictEqual([]);
  });
});

describe("firmas del pie", () => {
  const profesor = { nombre: "Ana", apellido: "Gómez" };

  it("el reporte general lo firma el director de grupo", () => {
    expect(firmasObservador(IMPRIMIR_TODO, profesor)).toStrictEqual([
      { nombre: "Director de grupo", cargo: "Firma del Director de Grupo" },
      { nombre: "Acudiente", cargo: "Firma del Acudiente" },
    ]);
  });

  it("el reporte propio lo firma ese profesor, con su nombre", () => {
    expect(firmasObservador(IMPRIMIR_MIAS, profesor)[0]).toStrictEqual({
      nombre: "Ana Gómez",
      cargo: "Firma del Profesor",
    });
  });

  it("el acudiente firma los dos", () => {
    const acudiente = { nombre: "Acudiente", cargo: "Firma del Acudiente" };

    expect(firmasObservador(IMPRIMIR_TODO, profesor)).toContainEqual(acudiente);
    expect(firmasObservador(IMPRIMIR_MIAS, profesor)).toContainEqual(acudiente);
  });

  it("sin nombre en la sesión deja la raya con una etiqueta genérica", () => {
    expect(firmasObservador(IMPRIMIR_MIAS, null)[0].nombre).toBe("Profesor");
    expect(firmasObservador(IMPRIMIR_MIAS, {})[0].nombre).toBe("Profesor");
  });
});

describe("títulos del impreso", () => {
  it("dice en el título si es el reporte de un solo docente", () => {
    expect(tituloImpresion(IMPRIMIR_TODO)).toBe("Observador del Estudiante");
    expect(tituloImpresion(IMPRIMIR_MIAS))
      .toBe("Observador del Estudiante — Anotaciones del docente");
  });

  it("escribe qué trozo del año sale", () => {
    // El impreso se archiva y se ensena meses despues: sin esto nadie sabria
    // si tiene delante el ano entero o un trozo.
    expect(etiquetaPeriodoImpreso(PERIODO_TODOS)).toBe("Año completo");
    expect(etiquetaPeriodoImpreso("2")).toBe("Periodo 2");
  });

  it("el subtítulo lleva alumno y periodo", () => {
    expect(subtituloImpresion({ alumno: "Ana Rojas · Primaria", periodo: "2" }))
      .toBe("Estudiante: Ana Rojas · Primaria · Periodo 2");
    expect(subtituloImpresion({ alumno: "Ana Rojas", periodo: PERIODO_TODOS }))
      .toBe("Estudiante: Ana Rojas · Año completo");
  });

  it("aguanta que no llegue nada", () => {
    expect(subtituloImpresion()).toContain("Año completo");
  });
});

describe("firmas guardadas en el impreso (2026-11-18)", () => {
  const FIRMA = "data:image/png;base64,RElSRUNUT1I=";
  const acudiente = {
    anotacion_id: 12,
    firmante_nombre: "Pedro Rojas",
    firmante_tipo_documento: "Cédula",
    firmante_documento: "1234567",
    firmante_parentesco: "padre",
    firmada_en: "2026-10-27T15:15:00Z",
    tomada_por_nombre: "Sara Díaz",
    integra: true,
    imagen: FIRMA,
  };

  it("con la firma guardada del director, su raya lleva su nombre y su firma", () => {
    expect(
      firmasObservador(IMPRIMIR_TODO, null, { director_grupo: "Marta Ruiz", imagen: FIRMA })[0],
    ).toStrictEqual({ nombre: "Marta Ruiz", cargo: "Firma del Director de Grupo", imagen: FIRMA });
  });

  it("sin firma guardada, la raya lleva el nombre del director y queda para firmar a mano", () => {
    expect(
      firmasObservador(IMPRIMIR_TODO, null, { director_grupo: "Marta Ruiz", imagen: null })[0],
    ).toStrictEqual({ nombre: "Marta Ruiz", cargo: "Firma del Director de Grupo", imagen: null });
  });

  it("sin director asignado, o sin consultarlo, la raya de siempre", () => {
    const deSiempre = { nombre: "Director de grupo", cargo: "Firma del Director de Grupo" };
    expect(firmasObservador(IMPRIMIR_TODO, null, { director_grupo: null, imagen: null })[0]).toStrictEqual(deSiempre);
    expect(firmasObservador(IMPRIMIR_TODO, null)[0]).toStrictEqual(deSiempre);
  });

  it("el reporte propio del profesor no usa la firma del director", () => {
    expect(
      firmasObservador(IMPRIMIR_MIAS, { nombre: "Ana" }, { director_grupo: "Marta Ruiz", imagen: FIRMA }),
    ).toStrictEqual([
      { nombre: "Ana", cargo: "Firma del Profesor" },
      { nombre: "Acudiente", cargo: "Firma del Acudiente" },
    ]);
  });

  it("la raya del acudiente se queda aunque haya firmado en pantalla", () => {
    expect(
      firmasObservador(IMPRIMIR_TODO, null, { director_grupo: "Marta Ruiz", imagen: FIRMA })[1],
    ).toStrictEqual({ nombre: "Acudiente", cargo: "Firma del Acudiente" });
  });

  it("ordena las firmas del acudiente por anotación y tolera lo que no es lista", () => {
    expect(firmasPorAnotacion([acudiente, { anotacion_id: 14 }, {}])).toStrictEqual({
      12: acudiente,
      14: { anotacion_id: 14 },
    });
    expect(firmasPorAnotacion(null)).toStrictEqual({});
    expect(firmasPorAnotacion({ anotacion_id: 12 })).toStrictEqual({});
  });

  it("en papel la firma del acudiente lleva el documento completo, cuándo y ante quién", () => {
    expect(textoFirmaImpresa(acudiente)).toMatch(
      /^Firmó Pedro Rojas \(padre\) · Cédula 1234567 · \d{1,2}\/\w+\/2026, \d{2}:\d{2} · ante Sara Díaz$/,
    );
    expect(textoFirmaImpresa({ ...acudiente, tomada_por_nombre: "" })).not.toContain("ante");
    expect(textoFirmaImpresa(null)).toBe("");
  });

  it("avisa solo cuando hay director y le falta guardar su firma", () => {
    expect(avisoSinFirmaDirector({ director_grupo: "Marta Ruiz", imagen: null })).toBe(
      "Sale sin la firma del director de grupo (Marta Ruiz). Cada director de grupo pone la suya desde «Mi curso».",
    );
    expect(avisoSinFirmaDirector({ director_grupo: "Marta Ruiz", imagen: FIRMA })).toBe("");
    expect(avisoSinFirmaDirector({ director_grupo: null, imagen: null })).toBe("");
    expect(avisoSinFirmaDirector(null)).toBe("");
  });
});
