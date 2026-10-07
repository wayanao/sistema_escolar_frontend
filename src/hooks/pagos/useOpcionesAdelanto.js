import { useCallback, useRef, useState } from "react";
import pagosApi from "../../services/pagosApi";
import { normalizarOpcionesAdelanto } from "../../utils/pagos/contratos";

export default function useOpcionesAdelanto({ parametrosAnio } = {}) {
  const anioLectivoId = parametrosAnio?.anio_lectivo_id;
  const anioLectivoIdRef = useRef(anioLectivoId);
  anioLectivoIdRef.current = anioLectivoId;
  const [opcionesAdelanto, setOpcionesAdelanto] = useState([]);
  const [loadingOpcionesAdelanto, setLoadingOpcionesAdelanto] = useState(false);
  const [errorOpcionesAdelanto, setErrorOpcionesAdelanto] = useState("");

  const cargarOpcionesAdelanto = useCallback(async (estudianteId) => {
    if (!estudianteId) return;
    const anioSolicitud = anioLectivoId;
    setLoadingOpcionesAdelanto(true);
    setErrorOpcionesAdelanto("");
    try {
      const data = anioSolicitud
        ? await pagosApi.obtenerOpcionesAdelanto(estudianteId, { parametrosAnio })
        : await pagosApi.obtenerOpcionesAdelanto(estudianteId);
      if (anioLectivoIdRef.current !== anioSolicitud) return;
      setOpcionesAdelanto(normalizarOpcionesAdelanto(data?.opciones));
    } catch (error) {
      if (anioLectivoIdRef.current !== anioSolicitud) return;
      console.error("Error cargando opciones de adelanto:", error);
      setOpcionesAdelanto([]);
      setErrorOpcionesAdelanto(
        error.response?.data?.detail || "No se pudieron consultar los meses disponibles."
      );
    } finally {
      if (anioLectivoIdRef.current === anioSolicitud) {
        setLoadingOpcionesAdelanto(false);
      }
    }
  }, [anioLectivoId, parametrosAnio]);

  const reiniciarOpcionesAdelanto = useCallback(() => {
    setOpcionesAdelanto([]);
    setErrorOpcionesAdelanto("");
  }, []);

  const limpiarOpcionesAdelanto = useCallback(() => {
    setOpcionesAdelanto([]);
  }, []);

  return {
    opcionesAdelanto,
    loadingOpcionesAdelanto,
    errorOpcionesAdelanto,
    cargarOpcionesAdelanto,
    reiniciarOpcionesAdelanto,
    limpiarOpcionesAdelanto,
  };
}
