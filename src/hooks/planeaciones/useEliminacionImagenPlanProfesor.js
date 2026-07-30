import { useCallback } from "react";
import { eliminarImagenPlanProfesor } from "../../services/planeacionesApi";

export default function useEliminacionImagenPlanProfesor({
  planActualId,
  actualizarImagenGuardada,
  actualizarPlanHistorial,
  recargarPlaneacion,
  marcarGuardado,
  onMensaje,
}) {
  const eliminarImagenGuardada = useCallback(
    async (slot) => {
      if (!planActualId) return;

      const nombreImagen =
        slot === "imagen1"
          ? "evidencia de desarrollo cognitivo"
          : "evidencia de actividad en casa";
      const confirmar = window.confirm(
        `¿Quieres borrar la ${nombreImagen} de este plan?`,
      );
      if (!confirmar) return;

      try {
        await eliminarImagenPlanProfesor(planActualId, slot);
        actualizarImagenGuardada(slot, null);
        actualizarPlanHistorial(planActualId, { [slot]: null });
        await recargarPlaneacion();
        marcarGuardado(
          new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        onMensaje("Imagen eliminada correctamente.");
      } catch (requestError) {
        console.error("Error eliminando imagen", requestError);
        window.alert(
          requestError.response?.data?.detail ||
            "No se pudo eliminar la imagen.",
        );
      }
    },
    [
      actualizarImagenGuardada,
      actualizarPlanHistorial,
      marcarGuardado,
      onMensaje,
      planActualId,
      recargarPlaneacion,
    ],
  );

  return eliminarImagenGuardada;
}
