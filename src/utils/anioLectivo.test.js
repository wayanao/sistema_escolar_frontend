import { describe, expect, it } from "vitest";

import {
  ESTADO_ACTIVO,
  ESTADO_CERRADO,
  ESTADO_PREPARACION,
  ESTADO_REABIERTO,
  RUTAS_POR_ANIO,
  SIN_PARAMETROS_DE_ANIO,
  construirAvisoAnio,
  encontrarAnioActivo,
  esRutaPorAnio,
  etiquetaAnioLectivo,
  normalizarAniosLectivos,
  parametrosAnio,
} from "./anioLectivo";

const anio2027 = { id: 3, anio: 2027, estado: ESTADO_PREPARACION };
const anio2026 = { id: 2, anio: 2026, estado: ESTADO_ACTIVO };
const anio2025 = { id: 1, anio: 2025, estado: ESTADO_CERRADO };

describe("normalizarAniosLectivos", () => {
  it("conserva las filas válidas en el orden en que llegan del backend", () => {
    expect(normalizarAniosLectivos([anio2027, anio2026, anio2025])).toEqual([
      anio2027,
      anio2026,
      anio2025,
    ]);
  });

  it("convierte a número los ids y años que llegan como texto", () => {
    expect(normalizarAniosLectivos([{ id: "2", anio: "2026", estado: "activo" }])).toEqual([
      anio2026,
    ]);
  });

  it("descarta las filas incompletas en vez de romper la barra", () => {
    expect(
      normalizarAniosLectivos([
        anio2026,
        { anio: 2025, estado: "cerrado" },
        { id: 4, anio: 0, estado: "cerrado" },
        { id: 5, anio: 2024, estado: "" },
        null,
      ]),
    ).toEqual([anio2026]);
  });

  it.each([undefined, null, {}, "texto"])(
    "devuelve una lista vacía si la respuesta no es una lista (%s)",
    (respuesta) => {
      expect(normalizarAniosLectivos(respuesta)).toEqual([]);
    },
  );
});

describe("año activo y etiquetas", () => {
  it("encuentra el año activo, o null si no hay", () => {
    expect(encontrarAnioActivo([anio2027, anio2026, anio2025])).toBe(anio2026);
    expect(encontrarAnioActivo([anio2025])).toBeNull();
    expect(encontrarAnioActivo([])).toBeNull();
  });

  it.each([
    [ESTADO_PREPARACION, "2027 · En preparación"],
    [ESTADO_ACTIVO, "2027 · Activo"],
    [ESTADO_CERRADO, "2027 · Cerrado"],
    [ESTADO_REABIERTO, "2027 · Reabierto"],
    ["otro", "2027 · otro"],
  ])("etiqueta un año %s como «%s»", (estado, etiqueta) => {
    expect(etiquetaAnioLectivo({ id: 9, anio: 2027, estado })).toBe(etiqueta);
  });
});

describe("parametrosAnio", () => {
  it("mirando el año activo no manda ningún parámetro: la petición queda como la de hoy", () => {
    expect(parametrosAnio(null, 2)).toBe(SIN_PARAMETROS_DE_ANIO);
    expect(parametrosAnio(2, 2)).toBe(SIN_PARAMETROS_DE_ANIO);
    expect(parametrosAnio(null, null)).toBe(SIN_PARAMETROS_DE_ANIO);
    expect(SIN_PARAMETROS_DE_ANIO).toEqual({});
    expect(Object.isFrozen(SIN_PARAMETROS_DE_ANIO)).toBe(true);
  });

  it("mirando otro año manda solo anio_lectivo_id", () => {
    expect(parametrosAnio(1, 2)).toEqual({ anio_lectivo_id: 1 });
    expect(parametrosAnio(1, null)).toEqual({ anio_lectivo_id: 1 });
  });
});

describe("pantallas que siguen el año", () => {
  it("en el paso 4.1 ninguna pantalla sigue el año todavía", () => {
    expect(RUTAS_POR_ANIO).toEqual([]);
    for (const ruta of ["/admin", "/admin/estudiantes", "/admin/pagos", "/dashboard-admin"]) {
      expect(esRutaPorAnio(ruta, RUTAS_POR_ANIO)).toBe(false);
    }
  });

  it("una ruta exacta no alcanza a las que empiezan igual", () => {
    const rutas = [{ ruta: "/admin", exacta: true }];

    expect(esRutaPorAnio("/admin", rutas)).toBe(true);
    expect(esRutaPorAnio("/admin/pagos", rutas)).toBe(false);
  });

  it("una ruta con subrutas incluye las suyas y no otras parecidas", () => {
    const rutas = [{ ruta: "/admin/planeadores-clases" }];

    expect(esRutaPorAnio("/admin/planeadores-clases", rutas)).toBe(true);
    expect(esRutaPorAnio("/admin/planeadores-clases/15", rutas)).toBe(true);
    expect(esRutaPorAnio("/admin/planeadores-clases-viejos", rutas)).toBe(false);
  });
});

describe("construirAvisoAnio", () => {
  it("mirando el año activo, o sin años cargados, no hay aviso", () => {
    expect(construirAvisoAnio(anio2026, anio2026)).toBeNull();
    expect(construirAvisoAnio(null, anio2026)).toBeNull();
    expect(construirAvisoAnio(anio2025, null)).toBeNull();
  });

  it("un año cerrado es de solo consulta", () => {
    expect(construirAvisoAnio(anio2025, anio2026)).toEqual({
      mensaje: "Estás viendo el año 2025 (cerrado). Solo consulta.",
      textoVolver: "Volver a 2026",
    });
  });

  it("un año en preparación se está preparando", () => {
    expect(construirAvisoAnio(anio2027, anio2026)).toEqual({
      mensaje: "Estás preparando el año 2027.",
      textoVolver: "Volver a 2026",
    });
  });

  it("un año reabierto dice su estado", () => {
    expect(
      construirAvisoAnio({ id: 1, anio: 2025, estado: ESTADO_REABIERTO }, anio2026).mensaje,
    ).toBe("Estás viendo el año 2025 (reabierto).");
  });
});
