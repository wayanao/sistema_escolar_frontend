// Contratos y transformaciones puras del flujo de planeaciones del profesor.
export const ESTADOS_REVISION_PROFESOR = {
  pendiente: {
    label: "Pendiente de revisión",
    title: "Enviado a administración",
    detail: "Tu planeación está disponible para que administración la revise.",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    iconClass: "bg-amber-100 text-amber-700",
  },
  visto: {
    label: "Visto por administración",
    title: "Administración ya vio tu planeación",
    detail: "Quedó registrada como vista; la revisión con comentarios llega después.",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    iconClass: "bg-sky-100 text-sky-700",
  },
  revisado_con_observacion: {
    label: "Revisado con observación",
    title: "Planeación revisada con observación",
    detail: "Administración revisó esta planeación y dejó comentarios para que los tengas en cuenta.",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-800",
    iconClass: "bg-rose-100 text-rose-700",
  },
  revisado: {
    label: "Revisado",
    title: "Planeación revisada",
    detail: "Administración terminó la revisión de esta versión.",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconClass: "bg-emerald-100 text-emerald-700",
  },
};

export const ESTADO_INICIAL_PLAN = {
  unidad: "",
  proposito: "",
  clase: "",
  estandar: "",
  dba: "",
  competencias: "",
  actividad_casa: "",
  tema: "",
};

const PREFIJO_CAMPOS_RECORDADOS = "plan_clases_defaults";

export function obtenerEstadoRevisionVisual(estado, totalObservaciones = 0) {
  if (!["revisado", "con_observaciones"].includes(estado)) {
    return estado === "visto" ? "visto" : "pendiente";
  }
  return Number(totalObservaciones) > 0 ? "revisado_con_observacion" : "revisado";
}

export function normalizarSeguimientoPlanProfesor(plan) {
  if (!plan?.id) return null;

  return {
    estado_revision: plan.estado_revision || "pendiente",
    version_revision: Number(plan.version_revision) || 1,
    enviado_at: plan.enviado_at || null,
    admin_visto_at: plan.admin_visto_at || null,
    revisado_at: plan.revisado_at || null,
    total_observaciones: Number(plan.total_observaciones) || 0,
    observaciones_no_vistas: Number(plan.observaciones_no_vistas) || 0,
    ultima_observacion_at: plan.ultima_observacion_at || null,
  };
}

export function obtenerEstadoGuardadoVisual(
  estadoGuardado = {},
  cargandoPlan = false,
) {
  if (estadoGuardado.cargando || cargandoPlan) {
    return {
      label: "Verificando",
      detail: "Consultando plan de la fecha",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
      dotClass: "bg-slate-400",
      buttonText: "Guardar y enviar",
    };
  }

  if (estadoGuardado.modificado) {
    return {
      label: "Cambios sin guardar",
      detail: "Hay ediciones pendientes",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
      dotClass: "bg-amber-500",
      buttonText: "Guardar cambios",
    };
  }

  if (estadoGuardado.guardado) {
    return {
      label: "Guardado",
      detail: estadoGuardado.guardadoEn
        ? `Actualizado ${estadoGuardado.guardadoEn}`
        : "Plan registrado",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
      dotClass: "bg-emerald-500",
      buttonText: "Actualizar plan",
    };
  }

  return {
    label: "Pendiente",
    detail: "Aún no se ha guardado",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    dotClass: "bg-slate-400",
    buttonText: "Guardar y enviar",
  };
}

export function crearClaveCamposRecordados(profesorId, asignacionId) {
  if (!profesorId || !asignacionId) return "";
  return `${PREFIJO_CAMPOS_RECORDADOS}_${profesorId}_${asignacionId}`;
}

export function crearFormDataPlanProfesor({
  asignacionId,
  planActualId,
  versionRevision,
  periodo,
  fecha,
  form,
  imagenes,
}) {
  const formData = new FormData();
  formData.append("asignacion_id", asignacionId);
  formData.append(
    "version_esperada",
    String(planActualId ? Number(versionRevision) || 1 : 0),
  );
  formData.append("periodo", periodo);
  formData.append("fecha", fecha);
  Object.entries(form).forEach(([campo, valor]) =>
    formData.append(campo, valor),
  );
  if (imagenes.imagen1) formData.append("imagen1", imagenes.imagen1);
  if (imagenes.imagen2) formData.append("imagen2", imagenes.imagen2);
  return formData;
}

export function formatearFechaSeguimiento(value) {
  if (!value) return "";
  const fechaValue = new Date(value);
  if (Number.isNaN(fechaValue.getTime())) return "";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fechaValue);
}

export function formatearFechaPlan(value) {
  if (!value) return "Sin fecha";
  const fechaValue = new Date(String(value).includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(fechaValue.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fechaValue);
}
