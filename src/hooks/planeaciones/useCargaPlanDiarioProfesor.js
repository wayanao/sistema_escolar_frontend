import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerPlanProfesor } from "../../services/planeacionesApi";

export default function useCargaPlanDiarioProfesor({
  asignacionId,
  fecha,
  onInicio,
  onCargado,
  onError,
}) {
  const [cargando, setCargando] = useState(Boolean(asignacionId && fecha));
  const solicitudActualRef = useRef(0);

  const cargarPlanDelDia = useCallback(async () => {
    if (!asignacionId || !fecha) return null;

    const solicitudId = solicitudActualRef.current + 1;
    solicitudActualRef.current = solicitudId;
    setCargando(true);
    onInicio();

    try {
      const plan = await obtenerPlanProfesor(asignacionId, fecha);
      if (solicitudActualRef.current !== solicitudId) return null;
      onCargado(plan);
      return plan;
    } catch (requestError) {
      if (solicitudActualRef.current !== solicitudId) return null;
      onError(requestError);
      return null;
    } finally {
      if (solicitudActualRef.current === solicitudId) setCargando(false);
    }
  }, [asignacionId, fecha, onCargado, onError, onInicio]);

  useEffect(() => {
    if (!asignacionId || !fecha) {
      solicitudActualRef.current += 1;
      setCargando(false);
      return undefined;
    }

    void cargarPlanDelDia();
    return () => {
      solicitudActualRef.current += 1;
    };
  }, [asignacionId, cargarPlanDelDia, fecha]);

  return {
    cargando,
    cargarPlanDelDia,
  };
}
