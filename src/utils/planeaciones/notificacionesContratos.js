// Contratos y transformaciones puras de notificaciones de planeadores.
export const EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES =
  "planeadores:notificaciones-actualizar";

export function formatearMomentoNotificacion(value) {
  if (!value) return "";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

export function agruparNotificacionesAdmin(items) {
  const grupos = new Map();

  items.forEach((item) => {
    const profesor = item.profesor?.trim() || "Profesor sin nombre";
    const profesorId = item.profesor_id ? String(item.profesor_id) : "";
    const clave = profesorId || profesor.toLocaleLowerCase("es-CO");
    const grupo = grupos.get(clave) || {
      id: `profesor-${clave}`,
      profesor,
      profesorId,
      cantidad: 0,
      ultimaFecha: null,
    };
    grupo.cantidad += Math.max(1, Number(item.cantidad) || 1);
    if (!grupo.ultimaFecha || new Date(item.creada_at) > new Date(grupo.ultimaFecha)) {
      grupo.ultimaFecha = item.creada_at;
    }
    grupos.set(clave, grupo);
  });

  return Array.from(grupos.values());
}

export function crearRutaNotificacionProfesor(item) {
  const query = new URLSearchParams({
    asignacion_id: String(item.asignacion_id),
    fecha: String(item.fecha),
    plan_id: String(item.plan_id),
    observaciones: "1",
  });
  return `/plan-de-clases?${query.toString()}`;
}

export function crearRutaPlaneacionesProfesor(grupo) {
  const query = new URLSearchParams({
    vista: "todas",
    estado: "pendiente",
  });
  if (grupo.profesorId) query.set("profesor_id", grupo.profesorId);
  else query.set("busqueda", grupo.profesor);
  return `/admin/planeadores-clases?${query.toString()}`;
}
