import { useCallback, useState } from "react";
import pagosApi from "../../services/pagosApi";
import { normalizarOpcionesVencidas } from "../../utils/pagos/contratos";

export default function useConsultasEstudiantePagos() {
  const [pagos, setPagos] = useState([]);
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [deudasEstudiante, setDeudasEstudiante] = useState([]);
  const [valoresPersonalizados, setValoresPersonalizados] = useState([]);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [opcionesVencidas, setOpcionesVencidas] = useState([]);
  const [loadingOpcionesVencidas, setLoadingOpcionesVencidas] = useState(false);
  const [errorOpcionesVencidas, setErrorOpcionesVencidas] = useState("");

  const cargarHistorialPagos = useCallback(async (estudianteId) => {
    try {
      const data = await pagosApi.obtenerHistorialPagos(estudianteId);
      setPagos(data);
    } catch (error) {
      console.error("Error cargando pagos:", error);
      setPagos([]);
    }
  }, []);

  const cargarDeudasEstudiante = useCallback(async (estudianteId) => {
    try {
      const data = await pagosApi.obtenerDeudasEstudiante(estudianteId);
      setDeudasEstudiante(data.deudas || []);
    } catch (error) {
      console.error("Error cargando deudas del estudiante:", error);
      setDeudasEstudiante([]);
    }
  }, []);

  const cargarVentasPendientes = useCallback(async (estudianteId) => {
    try {
      const data = await pagosApi.obtenerVentasPendientes(estudianteId);
      setVentasPendientes(data);
    } catch (error) {
      console.error("Error cargando ventas pendientes:", error);
      setVentasPendientes([]);
    }
  }, []);

  const cargarOpcionesVencidas = useCallback(
    async (estudianteId = selectedEstudiante?.id) => {
      if (!estudianteId) return;
      setLoadingOpcionesVencidas(true);
      setErrorOpcionesVencidas("");
      try {
        const data = await pagosApi.obtenerOpcionesVencidas(estudianteId);
        setOpcionesVencidas(normalizarOpcionesVencidas(data?.opciones));
      } catch (error) {
        console.error("Error cargando cuotas vencidas:", error);
        setOpcionesVencidas([]);
        setErrorOpcionesVencidas(
          error.response?.data?.detail || "No se pudieron consultar los meses vencidos."
        );
      } finally {
        setLoadingOpcionesVencidas(false);
      }
    },
    [selectedEstudiante?.id]
  );

  const cargarValoresPersonalizados = useCallback(async (estudianteId) => {
    try {
      const data = await pagosApi.obtenerValoresPersonalizados(estudianteId);
      setValoresPersonalizados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando valores personalizados:", error);
      setValoresPersonalizados([]);
    }
  }, []);

  const seleccionarEstudiante = useCallback(
    (estudiante) => {
      setSelectedEstudiante(estudiante);
      setOpcionesVencidas([]);
      setErrorOpcionesVencidas("");
      cargarHistorialPagos(estudiante.id);
      cargarVentasPendientes(estudiante.id);
      cargarDeudasEstudiante(estudiante.id);
      cargarOpcionesVencidas(estudiante.id);
      cargarValoresPersonalizados(estudiante.id);
    },
    [
      cargarDeudasEstudiante,
      cargarHistorialPagos,
      cargarOpcionesVencidas,
      cargarValoresPersonalizados,
      cargarVentasPendientes,
    ]
  );

  return {
    pagos,
    ventasPendientes,
    deudasEstudiante,
    valoresPersonalizados,
    selectedEstudiante,
    opcionesVencidas,
    loadingOpcionesVencidas,
    errorOpcionesVencidas,
    seleccionarEstudiante,
    cargarHistorialPagos,
    cargarDeudasEstudiante,
    cargarVentasPendientes,
    cargarOpcionesVencidas,
    cargarValoresPersonalizados,
    actualizarValoresPersonalizados: setValoresPersonalizados,
  };
}
