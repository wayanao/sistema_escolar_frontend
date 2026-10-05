import { useCallback, useEffect, useRef, useState } from "react";
import {
  obtenerDetalleEstudiante,
  obtenerDeudasEstudiante,
} from "../../services/estudiantesObservadorApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import { normalizarDetalleEstudiante } from "../../utils/estudiantesObservador/estudiantes";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// El resumen y las deudas de la ficha son los de ese año.
export default function useDetalleEstudianteAdmin({ parametrosAnio } = {}) {
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [detallesEstudiante, setDetallesEstudiante] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  const solicitudRef = useRef(0);

  useEffect(
    () => () => {
      solicitudRef.current += 1;
    },
    [],
  );

  const verDetalles = useCallback(async (estudiante) => {
    const solicitudId = ++solicitudRef.current;
    setSelectedEstudiante(estudiante);
    setDetallesEstudiante(null);
    setLoadingDetalles(true);
    setErrorDetalle(null);

    try {
      const opciones = opcionesConAnio({}, parametrosAnio);
      const [detallesRes, deudasRes] = await Promise.allSettled([
        obtenerDetalleEstudiante(estudiante.id, opciones),
        obtenerDeudasEstudiante(estudiante.id, opciones),
      ]);

      if (solicitudRef.current !== solicitudId) return;

      if (detallesRes.status === "rejected" && deudasRes.status === "rejected") {
        throw detallesRes.reason;
      }

      if (detallesRes.status === "rejected") {
        console.error(
          "Error al cargar resumen academico del estudiante",
          detallesRes.reason,
        );
      }
      if (deudasRes.status === "rejected") {
        console.error("Error al cargar deudas del estudiante", deudasRes.reason);
      }

      const detallesBase =
        detallesRes.status === "fulfilled" ? detallesRes.value : {};
      const deudasData = deudasRes.status === "fulfilled" ? deudasRes.value : {};
      setDetallesEstudiante(
        normalizarDetalleEstudiante(detallesBase, deudasData),
      );
    } catch (requestError) {
      if (solicitudRef.current !== solicitudId) return;
      console.error("Error al cargar detalles", requestError);
      setErrorDetalle(requestError);
    } finally {
      if (solicitudRef.current === solicitudId) setLoadingDetalles(false);
    }
  }, [parametrosAnio]);

  const cerrarModal = useCallback(() => {
    solicitudRef.current += 1;
    setSelectedEstudiante(null);
    setDetallesEstudiante(null);
    setLoadingDetalles(false);
    setErrorDetalle(null);
  }, []);

  return {
    selectedEstudiante,
    setSelectedEstudiante,
    detallesEstudiante,
    loadingDetalles,
    errorDetalle,
    verDetalles,
    cerrarModal,
  };
}
