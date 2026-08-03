export const obtenerEstadoVisualMallaCurricular = ({ estadoGuardado, loading }) => {
  if (estadoGuardado.cargando || loading) {
    return {
      label: "Verificando",
      detail: "Consultando malla del periodo",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
      dotClass: "bg-slate-400",
      buttonText: "Guardar Planeador",
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
        : "Malla registrada",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
      dotClass: "bg-emerald-500",
      buttonText: "Actualizar malla",
    };
  }

  return {
    label: "Pendiente",
    detail: "Aún no se ha guardado",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    dotClass: "bg-slate-400",
    buttonText: "Guardar Planeador",
  };
};
