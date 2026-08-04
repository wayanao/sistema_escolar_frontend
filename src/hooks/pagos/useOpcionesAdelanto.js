import { useCallback, useState } from "react";
import pagosApi from "../../services/pagosApi";
import { normalizarOpcionesAdelanto } from "../../utils/pagos/contratos";

export default function useOpcionesAdelanto() {
  const [opcionesAdelanto, setOpcionesAdelanto] = useState([]);
  const [loadingOpcionesAdelanto, setLoadingOpcionesAdelanto] = useState(false);
  const [errorOpcionesAdelanto, setErrorOpcionesAdelanto] = useState("");

  const cargarOpcionesAdelanto = useCallback(async (estudianteId) => {
    if (!estudianteId) return;
    setLoadingOpcionesAdelanto(true);
    setErrorOpcionesAdelanto("");
    try {
      const data = await pagosApi.obtenerOpcionesAdelanto(estudianteId);
      setOpcionesAdelanto(normalizarOpcionesAdelanto(data?.opciones));
    } catch (error) {
      console.error("Error cargando opciones de adelanto:", error);
      setOpcionesAdelanto([]);
      setErrorOpcionesAdelanto(
        error.response?.data?.detail || "No se pudieron consultar los meses disponibles."
      );
    } finally {
      setLoadingOpcionesAdelanto(false);
    }
  }, []);

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
