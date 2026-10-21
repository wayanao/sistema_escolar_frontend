import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// De qué año es la lista que se ve: el activo no lleva parámetros.
const claveDelAnio = (parametrosAnio) => parametrosAnio?.anio_lectivo_id ?? "activo";
const SIN_LISTA = Symbol("sin lista");

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
    // La primera carga de la lista (o la de otro año) dice que carga; volver a
    // pedirla después de guardar la deja a la vista y dice que actualiza.
    const [cargandoConceptos, setCargandoConceptos] = useState(true);
    const [actualizandoConceptos, setActualizandoConceptos] = useState(false);
    const [errorConceptos, setErrorConceptos] = useState(null);
    const [cargandoCursos, setCargandoCursos] = useState(true);
    const [errorCursos, setErrorCursos] = useState(null);
    const anioDeLaLista = useRef(SIN_LISTA);

    const cargarTiposPagos = useCallback(async () => {
        const anio = claveDelAnio(parametrosAnio);
        const opciones = opcionesConAnio({}, parametrosAnio);
        if (anioDeLaLista.current === anio) {
            setActualizandoConceptos(true);
        } else {
            // Otro año: no se deja a la vista la lista del anterior.
            setCargandoConceptos(true);
            setTiposPagos([]);
        }
        setErrorConceptos(null);
        try {
            try {
                const data = await obtenerTiposPagoDetallados(opciones);
                setTiposPagos(data || []);
            } catch (error) {
                console.error("Error cargando tipos de pagos detallado, fallback a básico", error);
                const data = await obtenerTiposPago(opciones);
                setTiposPagos(data || []);
            }
            anioDeLaLista.current = anio;
        } catch (fallbackError) {
            console.error("Error cargando tipos de pagos:", fallbackError);
            setErrorConceptos("No se pudieron cargar los conceptos de pago.");
        } finally {
            setCargandoConceptos(false);
            setActualizandoConceptos(false);
        }
    }, [parametrosAnio]);

    const cargarCursos = useCallback(async () => {
        setCargandoCursos(true);
        setErrorCursos(null);
        try {
            const data = await obtenerCursosParaTiposPago(opcionesConAnio({}, parametrosAnio));
            setCursos(data || []);
        } catch (error) {
            console.error("Error cargando cursos:", error);
            setErrorCursos("No se pudieron cargar los cursos.");
        } finally {
            setCargandoCursos(false);
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
        cargandoConceptos,
        actualizandoConceptos,
        errorConceptos,
        cargandoCursos,
        errorCursos,
        cargarTiposPagos,
        cargarCursos,
        seleccionarTipo,
        cerrarDetalle,
        actualizarDetalle,
        resumenEstados,
        tiposPagosFiltrados,
        mensajeConceptosVacios,
    };
}
