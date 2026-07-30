// Contratos y transformaciones puras del flujo administrativo de planeaciones.
export const PAGE_SIZE = 12;

export const ESTADOS_PLANEACION_ADMIN = {
  pendiente: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  visto: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  con_observaciones: {
    label: "Revisado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  revisado: {
    label: "Revisado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

export const ESTADOS_FILTRABLES = ["pendiente", "revisado"];

export const VISTAS_FECHA = {
  realizadas: {
    label: "Anteriores",
    descripcion: "Clases con fecha anterior a hoy que ya debieron impartirse.",
  },
  programadas: {
    label: "Hoy y próximas",
    descripcion: "Clases de hoy y futuras que todavía están por impartirse.",
  },
  todas: {
    label: "Todas",
    descripcion: "Consulta el historial completo junto con la programación futura.",
  },
};

export function normalizarRespuestaPlanes(data) {
  if (Array.isArray(data)) return { items: data, total: data.length };

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = Number(data?.total);
  return { items, total: Number.isFinite(total) ? total : items.length };
}

export function fechaLocalISO(fecha = new Date()) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fechaAnteriorISO(fecha = new Date()) {
  const anterior = new Date(fecha);
  anterior.setDate(anterior.getDate() - 1);
  return fechaLocalISO(anterior);
}

export function crearParametrosPlanes({
  vista,
  filtros = {},
  estado,
  limit = PAGE_SIZE,
  offset = 0,
  fechaReferencia = new Date(),
}) {
  const params = { limit, offset };

  Object.entries(filtros).forEach(([key, value]) => {
    if (value) params[key] = value;
  });

  if (estado && estado !== "todos") params.estado_revision = estado;
  if (vista === "realizadas") params.fecha_hasta = fechaAnteriorISO(fechaReferencia);
  if (vista === "programadas") params.fecha_desde = fechaLocalISO(fechaReferencia);

  return params;
}

export function formatearFecha(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatearTextoVisual(value) {
  const texto = String(value || "").trim();
  if (!texto || texto !== texto.toLocaleUpperCase("es-CO") || !/[A-ZÁÉÍÓÚÑ]{2}/.test(texto)) {
    return texto;
  }

  return texto
    .toLocaleLowerCase("es-CO")
    .replace(/(^|[\s-])(\p{L})/gu, (_, separador, letra) => `${separador}${letra.toLocaleUpperCase("es-CO")}`);
}

export function detalleError(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.mensaje) return detail.mensaje;
  return fallback;
}
