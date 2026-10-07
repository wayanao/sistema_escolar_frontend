import { useCallback, useRef, useState } from "react";
import pagosApi from "../../services/pagosApi";
import { normalizarOpcionesVencidas } from "../../utils/pagos/contratos";

export default function useConsultasEstudiantePagos({ parametrosAnio } = {}) {
  const anioLectivoId = parametrosAnio?.anio_lectivo_id;
  const anioLectivoIdRef = useRef(anioLectivoId);
  anioLectivoIdRef.current = anioLectivoId;
  const [pagos, setPagos] = useState([]);
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [deudasEstudiante, setDeudasEstudiante] = useState([]);
  const [deudaAniosAnteriores, setDeudaAniosAnteriores] = useState([]);
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
    const anioSolicitud = anioLectivoId;
    try {
      const data = anioSolicitud
        ? await pagosApi.obtenerDeudasEstudiante(estudianteId, { parametrosAnio })
        : await pagosApi.obtenerDeudasEstudiante(estudianteId);
      if (anioLectivoIdRef.current !== anioSolicitud) return;
      setDeudasEstudiante(data.deudas || []);
      setDeudaAniosAnteriores(data.deuda_anios_anteriores || []);
    } catch (error) {
      if (anioLectivoIdRef.current !== anioSolicitud) return;
      console.error("Error cargando deudas del estudiante:", error);
      setDeudasEstudiante([]);
      setDeudaAniosAnteriores([]);
    }
  }, [anioLectivoId, parametrosAnio]);

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
      const anioSolicitud = anioLectivoId;
      setLoadingOpcionesVencidas(true);
      setErrorOpcionesVencidas("");
      try {
        const data = anioSolicitud
          ? await pagosApi.obtenerOpcionesVencidas(estudianteId, { parametrosAnio })
          : await pagosApi.obtenerOpcionesVencidas(estudianteId);
        if (anioLectivoIdRef.current !== anioSolicitud) return;
        setOpcionesVencidas(normalizarOpcionesVencidas(data?.opciones));
      } catch (error) {
        if (anioLectivoIdRef.current !== anioSolicitud) return;
        console.error("Error cargando cuotas vencidas:", error);
        setOpcionesVencidas([]);
        setErrorOpcionesVencidas(
          error.response?.data?.detail || "No se pudieron consultar los meses vencidos."
        );
      } finally {
        if (anioLectivoIdRef.current === anioSolicitud) {
          setLoadingOpcionesVencidas(false);
        }
      }
    },
    [anioLectivoId, parametrosAnio, selectedEstudiante?.id]
  );

  const cargarValoresPersonalizados = useCallback(async (estudianteId) => {
    const anioSolicitud = anioLectivoId;
    try {
      const data = anioSolicitud
        ? await pagosApi.obtenerValoresPersonalizados(estudianteId, { parametrosAnio })
        : await pagosApi.obtenerValoresPersonalizados(estudianteId);
      if (anioLectivoIdRef.current !== anioSolicitud) return;
      setValoresPersonalizados(Array.isArray(data) ? data : []);
    } catch (error) {
      if (anioLectivoIdRef.current !== anioSolicitud) return;
      console.error("Error cargando valores personalizados:", error);
      setValoresPersonalizados([]);
    }
  }, [anioLectivoId, parametrosAnio]);

  const recargarDatosDelAnio = useCallback((estudianteId) => {
    if (!estudianteId) return Promise.resolve();
    setDeudasEstudiante([]);
    setDeudaAniosAnteriores([]);
    setOpcionesVencidas([]);
    setErrorOpcionesVencidas("");
    setValoresPersonalizados([]);
    return Promise.all([
      cargarDeudasEstudiante(estudianteId),
      cargarOpcionesVencidas(estudianteId),
      cargarValoresPersonalizados(estudianteId),
    ]);
  }, [
    cargarDeudasEstudiante,
    cargarOpcionesVencidas,
    cargarValoresPersonalizados,
  ]);

  const seleccionarEstudiante = useCallback(
    (estudiante) => {
      setSelectedEstudiante(estudiante);
      setOpcionesVencidas([]);
      setErrorOpcionesVencidas("");
      cargarHistorialPagos(estudiante.id);
      cargarVentasPendientes(estudiante.id);
      recargarDatosDelAnio(estudiante.id);
    },
    [
      cargarHistorialPagos,
      cargarVentasPendientes,
      recargarDatosDelAnio,
    ]
  );

  return {
    pagos,
    ventasPendientes,
    deudasEstudiante,
    deudaAniosAnteriores,
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
    recargarDatosDelAnio,
    actualizarValoresPersonalizados: setValoresPersonalizados,
  };
}
