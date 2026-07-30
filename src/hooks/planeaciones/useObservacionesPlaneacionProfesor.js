import { useCallback, useEffect, useRef, useState } from "react";
import {
  listarObservacionesPlan,
  marcarObservacionVista,
} from "../../services/planeacionesApi";
import { actualizarNotificacionesPlaneadores } from "../../utils/notificacionesPlaneadores";

export default function useObservacionesPlaneacionProfesor({
  planId,
  onLecturasActualizadas,
}) {
  const [observaciones, setObservaciones] = useState([]);
  const [abiertas, setAbiertas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const versionPlanRef = useRef(0);

  const reiniciarObservaciones = useCallback(() => {
    versionPlanRef.current += 1;
    setObservaciones([]);
    setAbiertas(false);
    setCargando(false);
    setError("");
  }, []);

  useEffect(() => {
    reiniciarObservaciones();
  }, [planId, reiniciarObservaciones]);

  const alternarObservaciones = useCallback(async () => {
    if (abiertas) {
      setAbiertas(false);
      return;
    }
    if (!planId || cargando) return;

    const versionPlan = versionPlanRef.current;
    setAbiertas(true);
    setCargando(true);
    setError("");

    try {
      const data = await listarObservacionesPlan(planId);
      const items = Array.isArray(data) ? data : [];
      const resultados = await Promise.all(
        items.map(async (item) => {
          if (item.vista_por_profesor_at) return { item, confirmada: true };

          try {
            const vista = await marcarObservacionVista(planId, item.id);
            return {
              item: {
                ...item,
                vista_por_profesor_at: vista.vista_por_profesor_at,
              },
              confirmada: true,
            };
          } catch (requestError) {
            console.error("Error confirmando lectura de observacion", requestError);
            return { item, confirmada: false };
          }
        }),
      );

      if (versionPlanRef.current !== versionPlan) return;

      const pendientes = resultados.filter((resultado) => !resultado.confirmada).length;
      setObservaciones(resultados.map((resultado) => resultado.item));
      onLecturasActualizadas?.({ planId, pendientes });
      actualizarNotificacionesPlaneadores();

      if (pendientes) {
        setError("Pudimos mostrar los comentarios, pero alguna lectura no logró confirmarse.");
      }
    } catch (requestError) {
      if (versionPlanRef.current !== versionPlan) return;
      console.error("Error cargando observaciones del plan", requestError);
      setObservaciones([]);
      setError(
        requestError.response?.data?.detail ||
          "No se pudieron cargar los comentarios.",
      );
    } finally {
      if (versionPlanRef.current === versionPlan) setCargando(false);
    }
  }, [abiertas, cargando, onLecturasActualizadas, planId]);

  return {
    observaciones,
    abiertas,
    cargando,
    error,
    alternarObservaciones,
    reiniciarObservaciones,
  };
}
