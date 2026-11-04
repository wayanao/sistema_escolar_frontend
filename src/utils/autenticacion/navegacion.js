// `icono` es el nombre del dibujo en IconoMenu.jsx; solo lo lleva el primer
// nivel, porque en el menú lateral las páginas de un grupo van sin ícono.
export const ADMIN_DESKTOP_ITEMS = [
  { id: "dashboard", type: "link", label: "Dashboard", to: "/dashboard-admin", icono: "dashboard" },
  {
    id: "academica",
    type: "group",
    label: "Gestión Académica",
    icono: "academica",
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
    icono: "cartera",
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
    icono: "administracion",
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
  { id: "estudiantes", type: "link", label: "Estudiantes", to: "/admin/estudiantes", icono: "estudiantes" },
  { id: "reportes", type: "link", label: "Reportes", to: "/admin/reportes", icono: "reportes" },
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
      // «Observaciones» -el observador viejo, /Formulario- se quito el
      // 2026-09-10. Su codigo sigue entero y su direccion redirige al
      // observador nuevo; retirarlo del todo es la fase 4.
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
  // Suelto y no dentro de Control Académico: es una pantalla por estudiante,
  // no una tarea de la clase que el profesor tenga elegida. Decidido con el
  // usuario el 2026-09-09, el mismo día en que dejó de depender de la
  // asignación.
  { id: "observador", type: "link", label: "Observador", to: "/observador" },
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

// Lo que dice la barra de arriba: «Cartera › Gestión de Pagos», o solo
// «Estudiantes» para una entrada suelta. null si la ruta no está en el menú.
export function obtenerUbicacionNavegacion(items, pathname) {
  for (const item of items) {
    if (item.type === "group") {
      const hijo = item.children.find((child) => esRutaNavegacionActiva(child, pathname));
      if (hijo) return { seccion: item.label, pagina: hijo.label };
    } else if (esRutaNavegacionActiva(item, pathname)) {
      return { seccion: null, pagina: item.label };
    }
  }
  return null;
}
