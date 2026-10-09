import { describe, expect, it } from "vitest";

import {
  CODIGO_ACTIVACION_CON_PENDIENTES,
  ESTADO_ACTIVO,
  ESTADO_CERRADO,
  ESTADO_PREPARACION,
  ESTADO_REABIERTO,
  RUTAS_POR_ANIO,
  SALIDA_EGRESADO,
  SALIDA_RETIRADO,
  SIN_PARAMETROS_DE_ANIO,
  accionDeAnioPasado,
  agruparPendientesPorCurso,
  aniosPasados,
  confirmacionCoincide,
  construirAvisoAnio,
  encontrarAnioActivo,
  esAvisoAnioCerrado,
  esRutaPorAnio,
  etiquetaAnioLectivo,
  etiquetaSalida,
  leerPendientesDeActivacion,
  mensajeDeErrorAnio,
  puedeMatricularseEnDestino,
  normalizarAniosLectivos,
  opcionesConAnio,
  parametrosAnio,
  permisosAnio,
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
  const enRuta = (pathname, search = "") => esRutaPorAnio({ pathname, search }, RUTAS_POR_ANIO);

  it("desde el paso 4.2 siguen el año las pestañas del año de Administración y Horarios", () => {
    expect(enRuta("/admin", "?modulo=cursos")).toBe(true);
    expect(enRuta("/admin", "?modulo=asignar-clases")).toBe(true);
    expect(enRuta("/admin", "?modulo=orden-boletin")).toBe(true);
    expect(enRuta("/admin/horarios")).toBe(true);
  });

  it("Profesores, Materias y la pestaña por defecto de Administración no tienen año", () => {
    expect(enRuta("/admin")).toBe(false);
    expect(enRuta("/admin", "?modulo=profesores")).toBe(false);
    expect(enRuta("/admin", "?modulo=materias")).toBe(false);
    expect(enRuta("/admin", "?modulo=inventada")).toBe(false);
  });

  it("desde el paso 4.3 siguen el año Tipos de pago y Cartera vencida", () => {
    expect(enRuta("/admin/tipos-pagos")).toBe(true);
    expect(enRuta("/admin/cartera-vencida")).toBe(true);
  });

  it("desde el paso 4.4 sigue el año Estudiantes", () => {
    expect(enRuta("/admin/estudiantes")).toBe(true);
  });

  it("desde el paso 4.5 siguen el año Boletines y Certificados", () => {
    expect(enRuta("/boletin")).toBe(true);
    expect(enRuta("/admin/certificados")).toBe(true);
    // El ingreso de boletines del profesor es otra pantalla: no sigue el año.
    expect(enRuta("/ingreso-boletin")).toBe(false);
  });

  it("desde el paso 4.6 siguen el año Listas de seguimiento y la bandeja de planes, con su detalle", () => {
    expect(enRuta("/admin/listas-seguimiento")).toBe(true);
    expect(enRuta("/admin/planeadores-clases")).toBe(true);
    expect(enRuta("/admin/planeadores-clases/91")).toBe(true);
  });

  it("las pantallas que todavía no siguen el año, o que no dependen de él, quedan fuera", () => {
    for (const ruta of [
      // Pagos cobra siempre en el año activo; tendrá su propio selector en la
      // fase 5.
      "/admin/pagos",
      "/dashboard-admin",
      "/admin/nomina",
      "/admin/reportes",
      // Lo del profesor (sus planes, sus listas) no tiene selector.
      "/plan-de-clases",
    ]) {
      expect(enRuta(ruta)).toBe(false);
    }
  });

  it("una ruta exacta no alcanza a las que empiezan igual", () => {
    const rutas = [{ ruta: "/admin", exacta: true }];

    expect(esRutaPorAnio({ pathname: "/admin" }, rutas)).toBe(true);
    expect(esRutaPorAnio({ pathname: "/admin/pagos" }, rutas)).toBe(false);
  });

  it("una ruta con subrutas incluye las suyas y no otras parecidas", () => {
    const rutas = [{ ruta: "/admin/planeadores-clases" }];

    expect(esRutaPorAnio({ pathname: "/admin/planeadores-clases" }, rutas)).toBe(true);
    expect(esRutaPorAnio({ pathname: "/admin/planeadores-clases/15" }, rutas)).toBe(true);
    expect(esRutaPorAnio({ pathname: "/admin/planeadores-clases-viejos" }, rutas)).toBe(false);
  });

  it("con parámetro, solo cuentan los valores de la lista", () => {
    const rutas = [{ ruta: "/pantalla", exacta: true, parametro: "pestana", valores: ["a"] }];

    expect(esRutaPorAnio({ pathname: "/pantalla", search: "?pestana=a" }, rutas)).toBe(true);
    expect(esRutaPorAnio({ pathname: "/pantalla", search: "?otra=1&pestana=a" }, rutas)).toBe(true);
    expect(esRutaPorAnio({ pathname: "/pantalla", search: "?pestana=b" }, rutas)).toBe(false);
    expect(esRutaPorAnio({ pathname: "/pantalla" }, rutas)).toBe(false);
  });
});

describe("opcionesConAnio", () => {
  it("mirando el año activo devuelve las mismas opciones, sin tocarlas", () => {
    const opciones = { signal: "señal" };

    expect(opcionesConAnio(opciones, SIN_PARAMETROS_DE_ANIO)).toBe(opciones);
    expect(opcionesConAnio(opciones, undefined)).toBe(opciones);
  });

  it("mirando otro año agrega solo parametrosAnio", () => {
    expect(opcionesConAnio({ signal: "señal" }, { anio_lectivo_id: 1 })).toEqual({
      signal: "señal",
      parametrosAnio: { anio_lectivo_id: 1 },
    });
  });
});

describe("permisosAnio", () => {
  it("en el año activo, o sin años cargados, todo como siempre", () => {
    expect(permisosAnio(anio2026, anio2026)).toEqual({ esAnioActivo: true, puedeEditar: true });
    expect(permisosAnio(null, null)).toEqual({ esAnioActivo: true, puedeEditar: true });
  });

  it("en preparación se edita lo que existe, pero no se crea", () => {
    expect(permisosAnio(anio2027, anio2026)).toEqual({ esAnioActivo: false, puedeEditar: true });
  });

  it("reabierto, igual que en preparación", () => {
    expect(permisosAnio({ id: 1, anio: 2025, estado: ESTADO_REABIERTO }, anio2026)).toEqual({
      esAnioActivo: false,
      puedeEditar: true,
    });
  });

  it("un año cerrado, o en un estado desconocido, es de solo consulta", () => {
    expect(permisosAnio(anio2025, anio2026)).toEqual({ esAnioActivo: false, puedeEditar: false });
    expect(permisosAnio({ id: 1, anio: 2025, estado: "otro" }, anio2026)).toEqual({
      esAnioActivo: false,
      puedeEditar: false,
    });
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

describe("marca de salida (paso 6.6)", () => {
  it("usa los mismos valores que el backend y los nombra para la pantalla", () => {
    expect(SALIDA_RETIRADO).toBe("retirado");
    expect(SALIDA_EGRESADO).toBe("egresado");
    expect(etiquetaSalida(SALIDA_RETIRADO)).toBe("Retirado");
    expect(etiquetaSalida(SALIDA_EGRESADO)).toBe("Egresado");
    expect(etiquetaSalida(null)).toBe("");
  });

  it("solo se matricula quien no tiene matrícula siguiente ni marca de salida", () => {
    const base = { id: 1, matriculado_en_destino: false, estado_salida: null };

    expect(puedeMatricularseEnDestino(base)).toBe(true);
    expect(puedeMatricularseEnDestino({ id: 1, matriculado_en_destino: false })).toBe(true);
    expect(
      puedeMatricularseEnDestino({ ...base, matriculado_en_destino: true }),
    ).toBe(false);
    expect(
      puedeMatricularseEnDestino({ ...base, estado_salida: SALIDA_EGRESADO }),
    ).toBe(false);
  });
});

describe("activación del año (paso 6.7)", () => {
  const PENDIENTES = [
    { id: 8, nombre: "Esteban", apellido: "Castro", curso_id: 3, curso_nombre: "1B", curso_jornada: "Mañana" },
    { id: 7, nombre: "Camilo", apellido: "Rodríguez", curso_id: 3, curso_nombre: "1B", curso_jornada: "Mañana" },
    { id: 9, nombre: "Carolina", apellido: "Pérez", curso_id: 4, curso_nombre: "PARVULO", curso_jornada: "Mañana" },
    { id: 5, nombre: "Ana", apellido: "Gil", curso_id: null, curso_nombre: null, curso_jornada: null },
  ];

  it("agrupa los pendientes por curso, en el orden en que llegan", () => {
    expect(agruparPendientesPorCurso(PENDIENTES)).toEqual([
      { clave: "3", curso: "1B · Mañana", estudiantes: [PENDIENTES[0], PENDIENTES[1]] },
      { clave: "4", curso: "PARVULO · Mañana", estudiantes: [PENDIENTES[2]] },
      { clave: "sin-curso", curso: "Sin curso", estudiantes: [PENDIENTES[3]] },
    ]);
    expect(agruparPendientesPorCurso(undefined)).toEqual([]);
  });

  it("la confirmación coincide solo con el año exacto, sin espacios de más", () => {
    expect(confirmacionCoincide("2027", 2027)).toBe(true);
    expect(confirmacionCoincide(" 2027 ", 2027)).toBe(true);
    expect(confirmacionCoincide("2026", 2027)).toBe(false);
    expect(confirmacionCoincide("", 2027)).toBe(false);
    expect(confirmacionCoincide(undefined, 2027)).toBe(false);
  });

  it("reconoce el 409 de pendientes por su código y devuelve su lista", () => {
    const error = {
      response: {
        status: 409,
        data: {
          detail: {
            codigo: CODIGO_ACTIVACION_CON_PENDIENTES,
            mensaje: "No se puede activar 2027: faltan 1 estudiantes por decidir.",
            sin_decidir: [PENDIENTES[0]],
          },
        },
      },
    };

    expect(CODIGO_ACTIVACION_CON_PENDIENTES).toBe("activacion_con_pendientes");
    expect(leerPendientesDeActivacion(error)).toEqual([PENDIENTES[0]]);
    expect(leerPendientesDeActivacion({ response: { data: { detail: "Otro" } } })).toBe(null);
    expect(
      leerPendientesDeActivacion({ response: { data: { detail: { codigo: "otro", sin_decidir: [] } } } }),
    ).toBe(null);
  });

  it("toma el mensaje del backend, sea texto u objeto, o usa el de respaldo", () => {
    expect(
      mensajeDeErrorAnio({ response: { data: { detail: "Para activar, escribe el año 2027." } } }, "x"),
    ).toBe("Para activar, escribe el año 2027.");
    expect(
      mensajeDeErrorAnio({ response: { data: { detail: { mensaje: "Faltan 2." } } } }, "x"),
    ).toBe("Faltan 2.");
    expect(mensajeDeErrorAnio({ response: { data: { detail: [{ msg: "x" }] } } }, "Respaldo")).toBe("Respaldo");
    expect(mensajeDeErrorAnio(new Error("red"), "Respaldo")).toBe("Respaldo");
  });
});

describe("años pasados: reabrir y volver a cerrar (paso 6.8)", () => {
  const preparacion = { id: 4, anio: 2028, estado: ESTADO_PREPARACION };
  const activo = { id: 3, anio: 2027, estado: ESTADO_ACTIVO };
  const reabierto = { id: 2, anio: 2026, estado: ESTADO_REABIERTO };
  const cerrado = { id: 1, anio: 2025, estado: ESTADO_CERRADO };

  it("deja solo los cerrados y reabiertos, en el orden en que llegan", () => {
    expect(aniosPasados([preparacion, activo, reabierto, cerrado])).toEqual([
      reabierto,
      cerrado,
    ]);
    expect(aniosPasados(undefined)).toEqual([]);
  });

  it("ofrece reabrir un año cerrado y volver a cerrar uno reabierto", () => {
    expect(accionDeAnioPasado(cerrado)).toEqual({
      accion: "reabrir",
      etiqueta: "Reabrir 2025",
      verbo: "reabrir",
    });
    expect(accionDeAnioPasado(reabierto)).toEqual({
      accion: "cerrar",
      etiqueta: "Volver a cerrar 2026",
      verbo: "volver a cerrar",
    });
    expect(accionDeAnioPasado(activo)).toBe(null);
    expect(accionDeAnioPasado(preparacion)).toBe(null);
  });
});

describe("aviso de año cerrado (paso 6.9)", () => {
  it("reconoce el texto exacto de la guardia del backend, para cualquier año", () => {
    expect(esAvisoAnioCerrado("El año lectivo 2026 está cerrado. Solo se puede consultar.")).toBe(true);
    expect(esAvisoAnioCerrado("El año lectivo 2031 está cerrado. Solo se puede consultar.")).toBe(true);
  });

  it("no confunde otros mensajes ni valores que no son texto", () => {
    expect(esAvisoAnioCerrado("Ya existe un tipo de pago con ese nombre.")).toBe(false);
    expect(esAvisoAnioCerrado("Falta una columna")).toBe(false);
    expect(esAvisoAnioCerrado({ mensaje: "x" })).toBe(false);
    expect(esAvisoAnioCerrado(undefined)).toBe(false);
  });
});
