import { useCallback, useEffect, useRef, useState } from "react";
import {
  obtenerAsignacionesProfesor,
  obtenerPlaneadoresAnuales,
} from "../../services/mallaCurricularApi";
import {
  filaTieneContenido,
  mapearPlaneadoresPorSlot,
} from "../../utils/mallaCurricular/planeadorAnual";
import {
  guardarPeriodoProfesor,
  obtenerPeriodoProfesor,
} from "../../utils/periodoProfesor";

export function useConsultasMallaCurricular({
  asignacionId,
  profesorId,
  onErrorPlaneadores,
  onInicioPlaneadores,
  onPlaneadoresCargados,
}) {
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoProfesor());
  const [asignacion, setAsignacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const solicitudPlaneadoresRef = useRef(0);

  const cargarAsignacion = useCallback(async () => {
    if (!profesorId) return;

    try {
      const asignaciones = await obtenerAsignacionesProfesor(profesorId);
      const asignacionActual = asignaciones.find(
        (item) => item.id.toString() === asignacionId
      );
      setAsignacion(asignacionActual);
    } catch (error) {
      console.error("Error cargando asignación", error);
    }
  }, [asignacionId, profesorId]);

  const cargarPlaneadores = useCallback(async () => {
    if (!asignacionId || !periodo) return;

    const solicitudId = solicitudPlaneadoresRef.current + 1;
    solicitudPlaneadoresRef.current = solicitudId;
    onInicioPlaneadores();
    try {
      const data = await obtenerPlaneadoresAnuales(asignacionId, periodo);
      if (solicitudId !== solicitudPlaneadoresRef.current) return;

      const planeadoresData = data.planeadores || [];
      onPlaneadoresCargados({
        guardado: planeadoresData.some(
          (fila) => filaTieneContenido(fila) && Boolean(fila.fecha)
        ),
        // Año lectivo, paso 7.3: con alguna fila guardada, el planeador no
        // está vacío y no hace falta preguntar si se puede traer el anterior.
        conFilas: planeadoresData.length > 0,
        planeadores: mapearPlaneadoresPorSlot(planeadoresData),
      });
    } catch (error) {
      if (solicitudId !== solicitudPlaneadoresRef.current) return;

      console.error("Error cargando planeadores", error);
      onErrorPlaneadores();
    } finally {
      if (solicitudId === solicitudPlaneadoresRef.current) {
        setLoading(false);
      }
    }
  }, [asignacionId, onErrorPlaneadores, onInicioPlaneadores, onPlaneadoresCargados, periodo]);

  const cambiarPeriodo = useCallback((nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    guardarPeriodoProfesor(nuevoPeriodo);
  }, []);

  useEffect(() => {
    cargarAsignacion();
  }, [cargarAsignacion]);

  useEffect(() => {
    cargarPlaneadores();
  }, [cargarPlaneadores]);

  useEffect(() => () => {
    solicitudPlaneadoresRef.current += 1;
  }, []);

  return {
    asignacion,
    cambiarPeriodo,
    cargarPlaneadores,
    loading,
    periodo,
  };
}
