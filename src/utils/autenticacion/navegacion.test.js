import { describe, expect, it } from "vitest";
import {
  ADMIN_DESKTOP_ITEMS,
  PROFESOR_BARRA_INFERIOR,
  PROFESOR_DESKTOP_ITEMS,
  esRutaNavegacionActiva,
  listarDestinosNavegacion,
  obtenerIdItemNavegacionActivo,
  obtenerUbicacionNavegacion,
  repartirBarraInferior,
  tienePanelesLaterales,
} from "./navegacion";

function resumirItems(items) {
  return items.map((item) => {
    const resumen = { id: item.id, type: item.type, label: item.label };
    if (item.to !== undefined) resumen.to = item.to;
    if (item.end !== undefined) resumen.end = item.end;
    if (item.children) {
      resumen.children = item.children.map((child) => {
        const hijo = { id: child.id, label: child.label, to: child.to };
        if (child.end !== undefined) hijo.end = child.end;
        if (child.translate !== undefined) hijo.translate = child.translate;
        return hijo;
      });
    }
    return resumen;
  });
}

describe("contratos puros de navegacion", () => {
  it("conserva el arbol, orden, textos y rutas de admin", () => {
    expect(resumirItems(ADMIN_DESKTOP_ITEMS)).toStrictEqual([
      { id: "dashboard", type: "link", label: "Dashboard", to: "/dashboard-admin" },
      {
        id: "academica",
        type: "group",
        label: "Gestión Académica",
        children: [
          { id: "horarios", label: "Horarios Asignados", to: "/admin/horarios" },
          { id: "planeadores", label: "Planeadores de Clases", to: "/admin/planeadores-clases" },
          { id: "certificados", label: "Certificados", to: "/admin/certificados" },
          { id: "boletines", label: "Gestión Boletines", to: "/boletin" },
          { id: "diseno-impresos", label: "Diseño de impresos", to: "/admin/diseno-impresos" },
          { id: "listas-seguimiento", label: "Listas de Seguimiento", to: "/admin/listas-seguimiento" },
        ],
      },
      {
        id: "cartera",
        type: "group",
        label: "Cartera",
        children: [
          { id: "pagos", label: "Gestión de Pagos", to: "/admin/pagos" },
          { id: "tipos-pagos", label: "Tipos de Pago", to: "/admin/tipos-pagos" },
          { id: "cartera-vencida", label: "Cartera Vencida", to: "/admin/cartera-vencida" },
          { id: "inventario", label: "Inventario", to: "/admin/inventario" },
          { id: "ventas", label: "Punto de Venta", to: "/admin/ventas" },
          { id: "egresos", label: "Egresos", to: "/admin/egresos" },
          { id: "prestamos", label: "Préstamos", to: "/admin/prestamos" },
          { id: "nomina", label: "Nómina", to: "/admin/nomina", translate: "no" },
        ],
      },
      {
        id: "administracion",
        type: "group",
        label: "Administración",
        children: [
          {
            id: "estructura-academica",
            label: "Estructura académica",
            to: "/admin",
            end: true,
          },
          {
            id: "anios-lectivos",
            label: "Años lectivos",
            to: "/admin/anios-lectivos",
          },
        ],
      },
      { id: "estudiantes", type: "link", label: "Estudiantes", to: "/admin/estudiantes" },
      { id: "reportes", type: "link", label: "Reportes", to: "/admin/reportes" },
    ]);
  });

  it("lleva al admin a 19 pantallas distintas, cada una con su ruta", () => {
    // Prueba de conteo escrita antes de pasar el admin al menú lateral: el
    // menú nuevo se arma con esta misma lista y no puede perder ningún destino.
    const destinos = ADMIN_DESKTOP_ITEMS.flatMap((item) =>
      item.type === "group" ? item.children : [item],
    ).map((destino) => destino.to);

    expect(destinos).toHaveLength(19);
    expect(new Set(destinos).size).toBe(19);
  });

  it("lleva al profesor a 7 pantallas distintas, cada una con su ruta", () => {
    // Prueba de conteo escrita antes de pasar al profesor al menú lateral.
    const destinos = PROFESOR_DESKTOP_ITEMS.flatMap((item) =>
      item.type === "group" ? item.children : [item],
    ).map((destino) => destino.to);

    expect(destinos).toStrictEqual([
      "/",
      "/planilla",
      "/asistencia",
      "/plan-de-clases",
      "/planeador-anual",
      "/observador",
      "/ingreso-boletin",
    ]);
  });

  it("conserva el arbol, orden, mayusculas y rutas de profesor", () => {
    expect(resumirItems(PROFESOR_DESKTOP_ITEMS)).toStrictEqual([
      { id: "dashboard", type: "link", label: "Dashboard", to: "/", end: true },
      {
        id: "control",
        type: "group",
        label: "Control Académico",
        children: [
          { id: "planilla", label: "Planilla", to: "/planilla" },
          { id: "asistencia", label: "Asistencia", to: "/asistencia" },
        ],
      },
      {
        id: "planeacion",
        type: "group",
        label: "Planeación Académica",
        children: [
          { id: "plan-clases", label: "Plan de Clases", to: "/plan-de-clases" },
          { id: "malla", label: "Malla Curricular", to: "/planeador-anual" },
        ],
      },
      { id: "observador", type: "link", label: "Observador", to: "/observador" },
      { id: "boletin", type: "link", label: "Boletín Final", to: "/ingreso-boletin" },
    ]);
  });

  it.each([
    [ADMIN_DESKTOP_ITEMS, "/dashboard-admin", "dashboard"],
    [ADMIN_DESKTOP_ITEMS, "/dashboard-admin/detalle", "dashboard"],
    [ADMIN_DESKTOP_ITEMS, "/admin/anios-lectivos", "administracion"],
    [ADMIN_DESKTOP_ITEMS, "/admin/planeadores-clases/18", "academica"],
    [ADMIN_DESKTOP_ITEMS, "/admin/pagos/18", "cartera"],
    [ADMIN_DESKTOP_ITEMS, "/admin", "administracion"],
    [ADMIN_DESKTOP_ITEMS, "/admin/desconocida", null],
    [PROFESOR_DESKTOP_ITEMS, "/", "dashboard"],
    [PROFESOR_DESKTOP_ITEMS, "/planilla/18", "control"],
    // El observador viejo se quito del menu el 2026-09-10: su direccion ya no
    // marca ningun grupo como activo.
    [PROFESOR_DESKTOP_ITEMS, "/Formulario", null],
    [PROFESOR_DESKTOP_ITEMS, "/observador", "observador"],
    [PROFESOR_DESKTOP_ITEMS, "/formulario", null],
    [PROFESOR_DESKTOP_ITEMS, "/ruta-desconocida", null],
    [[], "/", null],
  ])("obtiene el item activo para %s", (items, pathname, esperado) => {
    expect(obtenerIdItemNavegacionActivo(items, pathname)).toBe(esperado);
  });

  it("no confunde prefijos parciales ni descendientes de items end", () => {
    expect(esRutaNavegacionActiva({ to: "/admin/pagos" }, "/admin/pagos-extra")).toBe(false);
    expect(esRutaNavegacionActiva({ to: "/admin", end: true }, "/admin/hijos")).toBe(false);
  });

  it("da un ícono a cada entrada del primer nivel del admin, y ninguno a las páginas de un grupo", () => {
    expect(ADMIN_DESKTOP_ITEMS.map((item) => item.icono)).toStrictEqual([
      "dashboard",
      "academica",
      "cartera",
      "administracion",
      "estudiantes",
      "reportes",
    ]);
    ADMIN_DESKTOP_ITEMS.filter((item) => item.type === "group").forEach((grupo) => {
      grupo.children.forEach((hijo) => expect(hijo).not.toHaveProperty("icono"));
    });
  });

  it.each([
    ["/admin/pagos", { seccion: "Cartera", pagina: "Gestión de Pagos" }],
    ["/admin/pagos/18", { seccion: "Cartera", pagina: "Gestión de Pagos" }],
    ["/dashboard-admin", { seccion: null, pagina: "Dashboard" }],
    ["/admin", { seccion: "Administración", pagina: "Estructura académica" }],
    ["/admin/anios-lectivos/admisiones", { seccion: "Administración", pagina: "Años lectivos" }],
    ["/admin/planeadores-clases/7", { seccion: "Gestión Académica", pagina: "Planeadores de Clases" }],
    ["/admin/estudiantes", { seccion: null, pagina: "Estudiantes" }],
    ["/admin/desconocida", null],
  ])("ubica %s en la barra de arriba", (pathname, esperado) => {
    expect(obtenerUbicacionNavegacion(ADMIN_DESKTOP_ITEMS, pathname)).toStrictEqual(esperado);
  });

  it("da un ícono a cada pantalla del profesor y muestra sus dos grupos como títulos", () => {
    expect(
      listarDestinosNavegacion(PROFESOR_DESKTOP_ITEMS).map((destino) => [destino.id, destino.icono]),
    ).toStrictEqual([
      ["dashboard", "dashboard"],
      ["planilla", "planilla"],
      ["asistencia", "asistencia"],
      ["plan-clases", "planClases"],
      ["malla", "malla"],
      ["observador", "observador"],
      ["boletin", "boletin"],
    ]);
    PROFESOR_DESKTOP_ITEMS.filter((item) => item.type === "group").forEach((grupo) => {
      expect(grupo.siempreAbierto).toBe(true);
    });
    // Los grupos del admin sí se abren y se cierran.
    ADMIN_DESKTOP_ITEMS.filter((item) => item.type === "group").forEach((grupo) => {
      expect(grupo).not.toHaveProperty("siempreAbierto");
    });
  });

  it("pone abajo en el celular las cuatro pantallas de todos los días y lo demás en «Más»", () => {
    const { abajo, resto } = repartirBarraInferior(PROFESOR_DESKTOP_ITEMS, PROFESOR_BARRA_INFERIOR);

    expect(abajo.map((destino) => destino.to)).toStrictEqual([
      "/",
      "/planilla",
      "/asistencia",
      "/observador",
    ]);
    expect(resto.map((destino) => destino.to)).toStrictEqual([
      "/plan-de-clases",
      "/planeador-anual",
      "/ingreso-boletin",
    ]);
  });

  it("sabe qué menú abre paneles al lado del riel: el del admin sí, el del profesor no", () => {
    expect(tienePanelesLaterales(ADMIN_DESKTOP_ITEMS)).toBe(true);
    expect(tienePanelesLaterales(PROFESOR_DESKTOP_ITEMS)).toBe(false);
  });

  it("ignora en la barra de abajo un id que no está en el menú", () => {
    const { abajo, resto } = repartirBarraInferior(PROFESOR_DESKTOP_ITEMS, ["planilla", "no-existe"]);

    expect(abajo.map((destino) => destino.id)).toStrictEqual(["planilla"]);
    expect(resto).toHaveLength(6);
  });

  it.each([
    ["/planilla", { seccion: "Control Académico", pagina: "Planilla" }],
    ["/", { seccion: null, pagina: "Dashboard" }],
    ["/observador", { seccion: null, pagina: "Observador" }],
    ["/planeador-anual", { seccion: "Planeación Académica", pagina: "Malla Curricular" }],
  ])("ubica %s del profesor en la barra de arriba", (pathname, esperado) => {
    expect(obtenerUbicacionNavegacion(PROFESOR_DESKTOP_ITEMS, pathname)).toStrictEqual(esperado);
  });
});
