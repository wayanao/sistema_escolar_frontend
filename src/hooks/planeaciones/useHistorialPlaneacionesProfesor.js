import { useCallback, useEffect, useRef, useState } from "react";
import { listarHistorialPlanesProfesor } from "../../services/planeacionesApi";

const PAGE_SIZE = 3;

export default function useHistorialPlaneacionesProfesor(asignacionId) {
  const [historial, setHistorial] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const solicitudActualRef = useRef(0);

  const cargarHistorial = useCallback(async (paginaSolicitada = 0) => {
    if (!asignacionId) return;

    const solicitudId = solicitudActualRef.current + 1;
    solicitudActualRef.current = solicitudId;
    setCargando(true);
    setError("");

    try {
      const data = await listarHistorialPlanesProfesor(asignacionId, {
        limit: PAGE_SIZE + 1,
        offset: paginaSolicitada * PAGE_SIZE,
      });
      if (solicitudActualRef.current !== solicitudId) return;

      const items = Array.isArray(data) ? data : [];
      setHistorial(items.slice(0, PAGE_SIZE));
      setHayMas(items.length > PAGE_SIZE);
      setPagina(paginaSolicitada);
    } catch (requestError) {
      if (solicitudActualRef.current !== solicitudId) return;
      console.error("Error cargando historial", requestError);
      setError("No se pudo cargar el historial de esta clase.");
    } finally {
      if (solicitudActualRef.current === solicitudId) setCargando(false);
    }
  }, [asignacionId]);

  const actualizarPlanHistorial = useCallback((planId, cambios) => {
    setHistorial((actual) =>
      actual.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              ...(typeof cambios === "function" ? cambios(plan) : cambios),
            }
          : plan,
      ),
    );
  }, []);

  useEffect(() => {
    solicitudActualRef.current += 1;
    setHistorial([]);
    setPagina(0);
    setHayMas(false);
    setError("");
    setCargando(Boolean(asignacionId));

    if (asignacionId) void cargarHistorial(0);

    return () => {
      solicitudActualRef.current += 1;
    };
  }, [asignacionId, cargarHistorial]);

  return {
    historial,
    pagina,
    hayMas,
    cargando,
    error,
    pageSize: PAGE_SIZE,
    cargarHistorial,
    actualizarPlanHistorial,
  };
}
