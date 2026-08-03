import { useCallback } from "react";
import { cambiarEstadoEstudiante } from "../../services/estudiantesObservadorApi";
import { obtenerEtiquetaEstadoEstudiante } from "../../utils/estudiantesObservador/estudiantes";

export default function useCambioEstadoEstudianteAdmin({
  estadoFiltro,
  setEstudiantes,
  selectedEstudiante,
  setSelectedEstudiante,
  confirmar = (mensaje) => window.confirm(mensaje),
}) {
  const cambiarEstado = useCallback(
    async (estudiante, nuevoEstado) => {
      const estadoActual = estudiante.estado || "activo";
      if (nuevoEstado === estadoActual) return { estado: "sin_cambios" };

      const accion =
        nuevoEstado === "activo"
          ? "reactivar"
          : `marcar como ${obtenerEtiquetaEstadoEstudiante(nuevoEstado).toLowerCase()}`;
      const confirmado = confirmar(
        `¿Deseas ${accion} a ${estudiante.nombre} ${estudiante.apellido}?`,
      );
      if (!confirmado) return { estado: "cancelado" };

      try {
        const respuesta = await cambiarEstadoEstudiante(
          estudiante.id,
          nuevoEstado,
        );
        const estadoActualizado = respuesta?.estado || nuevoEstado;

        setEstudiantes((actuales) =>
          actuales
            .map((item) =>
              item.id === estudiante.id
                ? { ...item, estado: estadoActualizado }
                : item,
            )
            .filter((item) =>
              estadoFiltro === "todos"
                ? true
                : (item.estado || "activo") === estadoFiltro,
            ),
        );
        if (selectedEstudiante?.id === estudiante.id) {
          setSelectedEstudiante((actual) => ({
            ...actual,
            estado: estadoActualizado,
          }));
        }

        return { estado: "exito", estadoActualizado };
      } catch (error) {
        return { estado: "error", error };
      }
    },
    [
      confirmar,
      estadoFiltro,
      selectedEstudiante?.id,
      setEstudiantes,
      setSelectedEstudiante,
    ],
  );

  return { cambiarEstado };
}
