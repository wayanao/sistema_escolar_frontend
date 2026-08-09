import { describe, expect, it } from "vitest";
import {
  ADMIN_DESKTOP_ITEMS,
  PROFESOR_DESKTOP_ITEMS,
  esRutaNavegacionActiva,
  obtenerIdItemNavegacionActivo,
} from "./navegacion";

function resumirItems(items) {
  return items.map((item) => {
    const resumen = { id: item.id, type: item.type, label: item.label };
    if (item.to !== undefined) resumen.to = item.to;
    if (item.end !== undefined) resumen.end = item.end;
    if (item.children) {
      resumen.children = item.children.map((child) => {
        const hijo = { id: child.id, label: child.label, to: child.to };
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
      { id: "administracion", type: "link", label: "Administración", to: "/admin", end: true },
      { id: "estudiantes", type: "link", label: "Estudiantes", to: "/admin/estudiantes" },
      { id: "reportes", type: "link", label: "Reportes", to: "/admin/reportes" },
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
          { id: "observaciones", label: "Observaciones", to: "/Formulario" },
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
      { id: "boletin", type: "link", label: "Boletín Final", to: "/ingreso-boletin" },
    ]);
  });

  it.each([
    [ADMIN_DESKTOP_ITEMS, "/dashboard-admin", "dashboard"],
    [ADMIN_DESKTOP_ITEMS, "/dashboard-admin/detalle", "dashboard"],
    [ADMIN_DESKTOP_ITEMS, "/admin/planeadores-clases/18", "academica"],
    [ADMIN_DESKTOP_ITEMS, "/admin/pagos/18", "cartera"],
    [ADMIN_DESKTOP_ITEMS, "/admin", "administracion"],
    [ADMIN_DESKTOP_ITEMS, "/admin/desconocida", null],
    [PROFESOR_DESKTOP_ITEMS, "/", "dashboard"],
    [PROFESOR_DESKTOP_ITEMS, "/planilla/18", "control"],
    [PROFESOR_DESKTOP_ITEMS, "/Formulario", "control"],
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
});
