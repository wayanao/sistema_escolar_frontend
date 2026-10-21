import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { obtenerEgresos } from "../../services/nominaEgresosPrestamosApi";
import {
    construirParametrosEgresos,
    normalizarListaEgresos,
    obtenerFechaLocal,
    rangoDeFechasInvertido,
    totalEgresos,
} from "../../utils/nominaEgresosPrestamos/egresos";

const claveDelRango = ({ fecha_desde, fecha_hasta }) => `${fecha_desde}|${fecha_hasta}`;

const useEgresos = () => {
    const [egresos, setEgresos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState(null);
    const [fechaDesde, setFechaDesde] = useState(() => obtenerFechaLocal(new Date()));
    const [fechaHasta, setFechaHasta] = useState(() => obtenerFechaLocal(new Date()));
    // El rango de la lista que se ve: recargarlo no la esconde, solo avisa que
    // actualiza; otro rango sí muestra la carga.
    const rangoMostrado = useRef(null);

    const cargarEgresos = useCallback(async (filtros = null) => {
        const hoy = obtenerFechaLocal(new Date());
        const params = filtros || construirParametrosEgresos(hoy, hoy);
        const mismoRango = rangoMostrado.current === claveDelRango(params);
        try {
            if (mismoRango) {
                setActualizando(true);
            } else {
                setLoading(true);
            }
            setError(null);
            const datos = await obtenerEgresos(params);
            setEgresos(normalizarListaEgresos(datos));
            rangoMostrado.current = claveDelRango(params);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los egresos.");
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    }, []);

    useEffect(() => {
        cargarEgresos();
    }, [cargarEgresos]);

    const recargarRangoVigente = useCallback(
        () => cargarEgresos(construirParametrosEgresos(fechaDesde, fechaHasta)),
        [cargarEgresos, fechaDesde, fechaHasta]
    );

    // Registrar un egreso mueve el filtro al día registrado.
    const mostrarRangoDeUnDia = useCallback(
        (fecha) => {
            setFechaDesde(fecha);
            setFechaHasta(fecha);
            return cargarEgresos(construirParametrosEgresos(fecha, fecha));
        },
        [cargarEgresos]
    );

    const filtrarHoy = useCallback(
        () => mostrarRangoDeUnDia(obtenerFechaLocal(new Date())),
        [mostrarRangoDeUnDia]
    );

    const buscarPorFechas = useCallback(() => {
        if (rangoDeFechasInvertido(fechaDesde, fechaHasta)) {
            Swal.fire({
                icon: "warning",
                title: "Revisa las fechas",
                text: "La fecha desde no puede ser mayor que la fecha hasta.",
            });
            return;
        }
        recargarRangoVigente();
    }, [fechaDesde, fechaHasta, recargarRangoVigente]);

    return {
        egresos,
        total: totalEgresos(egresos),
        loading,
        actualizando,
        error,
        fechaDesde,
        setFechaDesde,
        fechaHasta,
        setFechaHasta,
        buscarPorFechas,
        filtrarHoy,
        recargarRangoVigente,
        mostrarRangoDeUnDia,
    };
};

export default useEgresos;
