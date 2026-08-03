import { useCallback, useEffect, useRef, useState } from "react";
import {
  obtenerDetalleEstudiante,
  obtenerDeudasEstudiante,
} from "../../services/estudiantesObservadorApi";
import { normalizarDetalleEstudiante } from "../../utils/estudiantesObservador/estudiantes";

export default function useDetalleEstudianteAdmin() {
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
      const [detallesRes, deudasRes] = await Promise.allSettled([
        obtenerDetalleEstudiante(estudiante.id),
        obtenerDeudasEstudiante(estudiante.id),
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
  }, []);

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
