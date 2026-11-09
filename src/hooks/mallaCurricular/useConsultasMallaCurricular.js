import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerPlaneadoresAnuales } from "../../services/mallaCurricularApi";
import {
  filaTieneContenido,
  mapearPlaneadoresPorSlot,
} from "../../utils/mallaCurricular/planeadorAnual";

// La clase y el período llegan de la pantalla (useClasePlaneadorProfesor),
// que también carga la lista de clases y recuerda el período elegido.
export function useConsultasMallaCurricular({
  asignacionId,
  periodo,
  onErrorPlaneadores,
  onInicioPlaneadores,
  onPlaneadoresCargados,
}) {
  const [loading, setLoading] = useState(true);
  const solicitudPlaneadoresRef = useRef(0);

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

  useEffect(() => {
    cargarPlaneadores();
  }, [cargarPlaneadores]);

  useEffect(() => () => {
    solicitudPlaneadoresRef.current += 1;
  }, []);

  return {
    cargarPlaneadores,
    loading,
  };
}
