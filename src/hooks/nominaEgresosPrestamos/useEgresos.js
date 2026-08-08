import { useCallback, useEffect, useState } from "react";
import { obtenerEgresos } from "../../services/nominaEgresosPrestamosApi";
import {
    construirParametrosEgresos,
    normalizarListaEgresos,
    obtenerFechaLocal,
    rangoDeFechasInvertido,
    totalEgresos,
} from "../../utils/nominaEgresosPrestamos/egresos";

const useEgresos = () => {
    const [egresos, setEgresos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fechaDesde, setFechaDesde] = useState(() => obtenerFechaLocal(new Date()));
    const [fechaHasta, setFechaHasta] = useState(() => obtenerFechaLocal(new Date()));

    const cargarEgresos = useCallback(async (filtros = null) => {
        try {
            setLoading(true);
            setError(null);
            const hoy = obtenerFechaLocal(new Date());
            const params = filtros || construirParametrosEgresos(hoy, hoy);
            const datos = await obtenerEgresos(params);
            setEgresos(normalizarListaEgresos(datos));
        } catch (err) {
            console.error(err);
            setError("Error al cargar los egresos.");
        } finally {
            setLoading(false);
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
            alert("La fecha desde no puede ser mayor que la fecha hasta.");
            return;
        }
        recargarRangoVigente();
    }, [fechaDesde, fechaHasta, recargarRangoVigente]);

    return {
        egresos,
        total: totalEgresos(egresos),
        loading,
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
