export const ADMIN_DESKTOP_ITEMS = [
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
];

export const PROFESOR_DESKTOP_ITEMS = [
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
];

export function esRutaNavegacionActiva(item, pathname) {
  if (item.type === "group") {
    return item.children.some((child) => esRutaNavegacionActiva(child, pathname));
  }

  if (item.end || item.to === "/") {
    return pathname === item.to;
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function obtenerIdItemNavegacionActivo(items, pathname) {
  return items.find((item) => esRutaNavegacionActiva(item, pathname))?.id || null;
}
