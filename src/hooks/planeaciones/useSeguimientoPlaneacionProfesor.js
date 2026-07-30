import { useCallback, useEffect, useRef, useState } from "react";
import { normalizarSeguimientoPlanProfesor } from "../../utils/planeaciones/profesor";
import useObservacionesPlaneacionProfesor from "./useObservacionesPlaneacionProfesor";

export default function useSeguimientoPlaneacionProfesor({
  planActualId,
  actualizarPlanHistorial,
  searchParams,
  setSearchParams,
}) {
  const [seguimiento, setSeguimiento] = useState(null);
  const enlaceObservacionAbiertoRef = useRef("");

  const actualizarLecturasObservaciones = useCallback(
    ({ planId, pendientes }) => {
      setSeguimiento((actual) =>
        actual
          ? { ...actual, observaciones_no_vistas: pendientes }
          : actual,
      );
      actualizarPlanHistorial(planId, {
        observaciones_no_vistas: pendientes,
      });
    },
    [actualizarPlanHistorial],
  );

  const {
    observaciones,
    abiertas: observacionesAbiertas,
    cargando: cargandoObservaciones,
    error: errorObservaciones,
    alternarObservaciones,
    reiniciarObservaciones,
  } = useObservacionesPlaneacionProfesor({
    planId: planActualId,
    onLecturasActualizadas: actualizarLecturasObservaciones,
  });

  const actualizarSeguimientoDesdePlan = useCallback(
    (plan) => {
      reiniciarObservaciones();
      setSeguimiento(normalizarSeguimientoPlanProfesor(plan));
    },
    [reiniciarObservaciones],
  );

  useEffect(() => {
    const planSolicitado = searchParams.get("plan_id");
    const abrirObservaciones = searchParams.get("observaciones") === "1";
    if (
      !abrirObservaciones ||
      !planSolicitado ||
      String(planActualId) !== planSolicitado
    ) {
      return;
    }

    const clave = `${planSolicitado}:${seguimiento?.version_revision || ""}`;
    if (enlaceObservacionAbiertoRef.current === clave) return;
    enlaceObservacionAbiertoRef.current = clave;
    if (!observacionesAbiertas) alternarObservaciones();

    const siguientes = new URLSearchParams(searchParams);
    siguientes.delete("observaciones");
    setSearchParams(siguientes, { replace: true });
  }, [
    alternarObservaciones,
    observacionesAbiertas,
    planActualId,
    searchParams,
    seguimiento?.version_revision,
    setSearchParams,
  ]);

  return {
    seguimiento,
    observaciones,
    observacionesAbiertas,
    cargandoObservaciones,
    errorObservaciones,
    alternarObservaciones,
    actualizarSeguimientoDesdePlan,
  };
}
