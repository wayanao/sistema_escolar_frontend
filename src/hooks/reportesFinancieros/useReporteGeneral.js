import { useCallback, useEffect, useMemo, useState } from "react";
import { obtenerReporteGeneral } from "../../services/reportesFinancierosApi";
import { construirMesesFinancieros } from "../../utils/reportesFinancieros/derivaciones";

export default function useReporteGeneral() {
  const [reporteGeneral, setReporteGeneral] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarDatosIniciales = useCallback(async () => {
    try {
      setLoading(true);
      const reporte = await obtenerReporteGeneral();
      setReporteGeneral(reporte);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar datos del reporte");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  useEffect(() => {
    const refrescarAlVolver = () => {
      if (document.visibilityState === "visible") {
        cargarDatosIniciales();
      }
    };

    document.addEventListener("visibilitychange", refrescarAlVolver);
    return () => document.removeEventListener("visibilitychange", refrescarAlVolver);
  }, [cargarDatosIniciales]);

  const stats = reporteGeneral?.estadisticas_generales || {};
  const estudiantesPorCurso = reporteGeneral?.estudiantes_por_curso || [];
  const mesesFinancieros = useMemo(
    () => construirMesesFinancieros(reporteGeneral?.ingresos_mensuales || [], reporteGeneral?.egresos_mensuales || []),
    [reporteGeneral]
  );

  return { reporteGeneral, loading, cargarDatosIniciales, stats, estudiantesPorCurso, mesesFinancieros };
}
