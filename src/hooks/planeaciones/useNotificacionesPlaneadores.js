import { useCallback, useEffect, useState } from "react";
import { listarNotificacionesPlaneadores } from "../../services/planeacionesApi";
import { EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES } from "../../utils/planeaciones/notificacionesContratos";

export default function useNotificacionesPlaneadores(rol) {
  const [total, setTotal] = useState(0);
  const [totalProfesores, setTotalProfesores] = useState(0);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true);
    try {
      const data = await listarNotificacionesPlaneadores(
        rol === "admin" ? 20 : 8,
      );
      setTotal(Number(data?.total_no_leidas) || 0);
      setTotalProfesores(Number(data?.total_profesores) || 0);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setError("");
    } catch (requestError) {
      console.error("Error cargando notificaciones de planeadores", requestError);
      if (!silencioso) setError("No pudimos actualizar las notificaciones.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [rol]);

  useEffect(() => {
    cargar();
    const interval = window.setInterval(
      () => cargar({ silencioso: true }),
      60_000,
    );
    const actualizar = () => cargar({ silencioso: true });
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") actualizar();
    };
    window.addEventListener("focus", actualizar);
    window.addEventListener(
      EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES,
      actualizar,
    );
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", actualizar);
      window.removeEventListener(
        EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES,
        actualizar,
      );
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [cargar]);

  return {
    total,
    totalProfesores,
    items,
    cargando,
    error,
    cargar,
  };
}
