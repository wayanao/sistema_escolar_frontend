import { describe, expect, it } from "vitest";
import {
  LIMITE_NOTA_SEGUIMIENTO,
  MARCA_VACIA,
  claveCelda,
  construirPayloadMarcas,
  normalizarListaSeguimiento,
  obtenerMarcaCelda,
} from "./marcas";

const RESPUESTA = {
  curso_id: 12,
  columnas: [{ id: 5, nombre: "Asistió a la cumbre" }],
  estudiantes: [
    {
      estudiante_id: 101,
      nombre: "Juan",
      apellido: "Pérez",
      marcas: { 5: { marcado: true, nota: "Llegó tarde" } },
    },
    { estudiante_id: 102, nombre: "Ana", apellido: "Rojas", marcas: {} },
  ],
};

describe("normalizarListaSeguimiento", () => {
  it("convierte la respuesta a la forma que usa la pantalla", () => {
    const lista = normalizarListaSeguimiento(RESPUESTA);

    expect(lista.cursoId).toBe(12);
    expect(lista.columnas).toEqual([{ id: 5, nombre: "Asistió a la cumbre" }]);
    expect(lista.estudiantes[0]).toMatchObject({
      estudianteId: 101,
      nombre: "Juan",
      apellido: "Pérez",
    });
  });

  it("un curso sin columnas no es un error, es la pantalla recién estrenada", () => {
    const lista = normalizarListaSeguimiento({
      curso_id: 12,
      columnas: [],
      estudiantes: [{ estudiante_id: 101, nombre: "Juan", apellido: "Pérez" }],
    });

    expect(lista.columnas).toEqual([]);
    expect(lista.estudiantes).toHaveLength(1);
    expect(lista.estudiantes[0].marcas).toEqual({});
  });

  it("aguanta una respuesta a medias sin romper la grilla", () => {
    for (const rota of [undefined, null, {}, { columnas: "no es lista" }]) {
      const lista = normalizarListaSeguimiento(rota);
      expect(lista.columnas).toEqual([]);
      expect(lista.estudiantes).toEqual([]);
    }
  });
});

describe("obtenerMarcaCelda", () => {
  it("devuelve la marca guardada", () => {
    const lista = normalizarListaSeguimiento(RESPUESTA);

    expect(obtenerMarcaCelda(lista.estudiantes[0], 5)).toEqual({
      marcado: true,
      nota: "Llegó tarde",
    });
  });

  it("una celda sin fila vale el default, no undefined", () => {
    const lista = normalizarListaSeguimiento(RESPUESTA);

    expect(obtenerMarcaCelda(lista.estudiantes[1], 5)).toEqual(MARCA_VACIA);
    expect(obtenerMarcaCelda(lista.estudiantes[0], 999)).toEqual(MARCA_VACIA);
  });

  it("da igual pedir la columna como número o como texto", () => {
    const lista = normalizarListaSeguimiento(RESPUESTA);

    expect(obtenerMarcaCelda(lista.estudiantes[0], "5")).toEqual(
      obtenerMarcaCelda(lista.estudiantes[0], 5),
    );
  });

  it("el default está congelado: nadie puede escribirle encima", () => {
    expect(Object.isFrozen(MARCA_VACIA)).toBe(true);
  });
});

describe("construirPayloadMarcas", () => {
  const cambio = (columnaId, estudianteId, marcado, nota = "") => ({
    columnaId,
    estudianteId,
    marcado,
    nota,
  });

  it("arma el cuerpo con las claves que espera el backend", () => {
    const cambios = new Map([
      [claveCelda(101, 5), cambio(5, 101, true, "Llegó tarde")],
    ]);

    expect(construirPayloadMarcas(cambios)).toEqual([
      { columna_id: 5, estudiante_id: 101, marcado: true, nota: "Llegó tarde" },
    ]);
  });

  it("acepta también un objeto plano, no solo un Map", () => {
    const cambios = { [claveCelda(101, 5)]: cambio(5, 101, false) };

    expect(construirPayloadMarcas(cambios)).toEqual([
      { columna_id: 5, estudiante_id: 101, marcado: false, nota: "" },
    ]);
  });

  it("no puede mandar la misma celda dos veces", () => {
    // La razón de que los cambios se guarden indexados por celda: el backend
    // rechaza el lote entero con 422 si una celda viene repetida, porque
    // escribe todo en una sentencia y PostgreSQL la aborta.
    const cambios = new Map();
    cambios.set(claveCelda(101, 5), cambio(5, 101, true, "Primera"));
    cambios.set(claveCelda(101, 5), cambio(5, 101, false, "Segunda"));

    const payload = construirPayloadMarcas(cambios);

    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ marcado: false, nota: "Segunda" });
  });

  it("el mismo alumno en otra columna sí son dos celdas", () => {
    const cambios = new Map([
      [claveCelda(101, 5), cambio(5, 101, true)],
      [claveCelda(101, 6), cambio(6, 101, true)],
    ]);

    expect(construirPayloadMarcas(cambios)).toHaveLength(2);
  });

  it("manda la nota recortada, que es como la guarda el backend", () => {
    const cambios = new Map([
      [claveCelda(101, 5), cambio(5, 101, true, "  Llegó tarde  ")],
    ]);

    expect(construirPayloadMarcas(cambios)[0].nota).toBe("Llegó tarde");
  });

  it("manda la nota con la primera letra en mayúscula", () => {
    // Paso 4 del pedido del 2026-11-05. Después de guardar, la grilla se
    // recarga del backend, así que se ve igual a como quedó.
    const cambios = new Map([
      [claveCelda(101, 5), cambio(5, 101, true, " pagó el 50% ")],
    ]);

    expect(construirPayloadMarcas(cambios)[0].nota).toBe("Pagó el 50%");
  });

  it("no corta la nota larga a la fuerza: de avisar se encarga la pantalla", () => {
    const larga = "N".repeat(LIMITE_NOTA_SEGUIMIENTO + 10);
    const cambios = new Map([[claveCelda(101, 5), cambio(5, 101, true, larga)]]);

    expect(construirPayloadMarcas(cambios)[0].nota).toHaveLength(larga.length);
  });

  it("descarta una celda sin columna o sin estudiante", () => {
    const cambios = new Map([
      [claveCelda(101, 5), cambio(5, 101, true)],
      ["rota-1", cambio(null, 101, true)],
      ["rota-2", cambio(5, undefined, true)],
    ]);

    expect(construirPayloadMarcas(cambios)).toHaveLength(1);
  });

  it("sin cambios pendientes el cuerpo va vacío", () => {
    expect(construirPayloadMarcas(new Map())).toEqual([]);
    expect(construirPayloadMarcas({})).toEqual([]);
    expect(construirPayloadMarcas(null)).toEqual([]);
  });
});

describe("claveCelda", () => {
  it("distingue alumno y columna sin ambigüedad", () => {
    expect(claveCelda(101, 5)).not.toBe(claveCelda(1015, ""));
    expect(claveCelda(101, 5)).toBe(claveCelda(101, 5));
  });
});
