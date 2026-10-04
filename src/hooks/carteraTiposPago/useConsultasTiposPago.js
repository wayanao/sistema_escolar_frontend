import { useCallback, useEffect, useMemo, useState } from "react";
import {
    obtenerCursosParaTiposPago,
    obtenerDetalleTipoPago,
    obtenerTiposPago,
    obtenerTiposPagoDetallados,
} from "../../services/carteraTiposPagoApi";
import { opcionesConAnio } from "../../utils/anioLectivo";
import {
    calcularResumenEstados,
    filtrarTiposPagoPorEstado,
    obtenerMensajeConceptosVacios,
} from "../../utils/carteraTiposPago/tiposPago";

// `parametrosAnio`: el año que mira el admin (`useAnioLectivo().parametros`).
// Conceptos y cursos son los de ese año, también al recargar después de
// guardar. El detalle de un concepto parte de su id y no lo necesita.
export default function useConsultasTiposPago({ parametrosAnio } = {}) {
    const [tiposPagos, setTiposPagos] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [estadoFiltro, setEstadoFiltro] = useState("activo");
    const [selectedTipoId, setSelectedTipoId] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    const cargarTiposPagos = useCallback(async () => {
        const opciones = opcionesConAnio({}, parametrosAnio);
        try {
            const data = await obtenerTiposPagoDetallados(opciones);
            setTiposPagos(data || []);
        } catch (error) {
            console.error("Error cargando tipos de pagos detallado, fallback a básico", error);
            try {
                const data = await obtenerTiposPago(opciones);
                setTiposPagos(data || []);
            } catch (fallbackError) {
                console.error("Error cargando tipos de pagos:", fallbackError);
            }
        }
    }, [parametrosAnio]);

    const cargarCursos = useCallback(async () => {
        try {
            const data = await obtenerCursosParaTiposPago(opcionesConAnio({}, parametrosAnio));
            setCursos(data || []);
        } catch (error) {
            console.error("Error cargando cursos:", error);
        }
    }, [parametrosAnio]);

    useEffect(() => {
        cargarTiposPagos();
        cargarCursos();
    }, [cargarTiposPagos, cargarCursos]);

    const seleccionarTipo = useCallback(async (tipo) => {
        setSelectedTipoId(tipo.id);
        setLoadingDetalle(true);
        setDetalle({ ...tipo });
        try {
            const detalleRemoto = await obtenerDetalleTipoPago(tipo.id);
            const data = { ...tipo, ...(detalleRemoto || {}) };
            setDetalle(data);
            return data;
        } finally {
            setLoadingDetalle(false);
        }
    }, []);

    const cerrarDetalle = useCallback(() => {
        setSelectedTipoId(null);
        setDetalle(null);
    }, []);

    const actualizarDetalle = useCallback((cambios) => {
        setDetalle((prev) => (prev ? { ...prev, ...cambios } : prev));
    }, []);

    const resumenEstados = useMemo(
        () => calcularResumenEstados(tiposPagos),
        [tiposPagos]
    );

    const tiposPagosFiltrados = useMemo(
        () => filtrarTiposPagoPorEstado(tiposPagos, estadoFiltro),
        [tiposPagos, estadoFiltro]
    );

    const mensajeConceptosVacios = obtenerMensajeConceptosVacios(estadoFiltro);

    return {
        tiposPagos,
        cursos,
        estadoFiltro,
        setEstadoFiltro,
        selectedTipoId,
        detalle,
        loadingDetalle,
        cargarTiposPagos,
        seleccionarTipo,
        cerrarDetalle,
        actualizarDetalle,
        resumenEstados,
        tiposPagosFiltrados,
        mensajeConceptosVacios,
    };
}
