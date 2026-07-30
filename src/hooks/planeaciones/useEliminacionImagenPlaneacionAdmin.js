import { useCallback, useState } from "react";
import { eliminarImagenPlaneacionAdmin } from "../../services/planeacionesApi";
import { detalleError } from "../../utils/planeaciones/admin";

export default function useEliminacionImagenPlaneacionAdmin({
  onImagenEliminada,
  onMensaje,
}) {
  const [eliminandoImagen, setEliminandoImagen] = useState("");

  const eliminarImagen = useCallback(
    async (planId, slot) => {
      const etiqueta =
        slot === "imagen1"
          ? "evidencia de desarrollo cognitivo"
          : "evidencia de actividad en casa";
      if (
        !window.confirm(
          `¿Quieres borrar la ${etiqueta} de esta planeación?`,
        )
      ) {
        return;
      }

      setEliminandoImagen(slot);
      onMensaje(null);

      try {
        await eliminarImagenPlaneacionAdmin(planId, slot);
        onImagenEliminada(slot);
        onMensaje({ tono: "exito", texto: "La evidencia fue eliminada." });
      } catch (requestError) {
        onMensaje({
          tono: "error",
          texto: detalleError(
            requestError,
            "No se pudo eliminar la imagen.",
          ),
        });
      } finally {
        setEliminandoImagen("");
      }
    },
    [onImagenEliminada, onMensaje],
  );

  return {
    eliminandoImagen,
    eliminarImagen,
  };
}
