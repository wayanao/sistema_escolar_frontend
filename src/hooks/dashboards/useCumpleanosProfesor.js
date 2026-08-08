import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerCumpleanosProfesor } from "../../services/dashboardsApi";
import {
    DIAS_RANGO_CUMPLEANOS,
    MENSAJE_ERROR_CUMPLEANOS,
    construirParametrosCumpleanos,
    normalizarCumpleanos,
} from "../../utils/dashboards/cumpleanos";

// A diferencia de inasistencias y rendimiento, esta sección sí publica su error
// como estado visible.
const useCumpleanosProfesor = (profesorId) => {
    const [cumpleanos, setCumpleanos] = useState([]);
    const [loadingCumpleanos, setLoadingCumpleanos] = useState(true);
    const [errorCumpleanos, setErrorCumpleanos] = useState("");
    // Hoy solo carga al montar, pero se numera igual que el resto del módulo.
    const peticionRef = useRef(0);

    const cargarCumpleanos = useCallback(async () => {
        if (!profesorId) return;
        const peticion = (peticionRef.current += 1);
        const vigente = () => peticion === peticionRef.current;

        setLoadingCumpleanos(true);
        setErrorCumpleanos("");

        try {
            const data = await obtenerCumpleanosProfesor(
                profesorId,
                construirParametrosCumpleanos(DIAS_RANGO_CUMPLEANOS),
            );
            if (!vigente()) return;
            setCumpleanos(normalizarCumpleanos(data));
        } catch (error) {
            console.error("Error cargando cumpleaños", error);
            if (!vigente()) return;
            setErrorCumpleanos(MENSAJE_ERROR_CUMPLEANOS);
        } finally {
            if (vigente()) setLoadingCumpleanos(false);
        }
    }, [profesorId]);

    useEffect(() => {
        cargarCumpleanos();
    }, [cargarCumpleanos]);

    return {
        cumpleanos,
        loadingCumpleanos,
        errorCumpleanos,
        // El rango consultado y el que se pinta no pueden divergir.
        diasRangoCumpleanos: DIAS_RANGO_CUMPLEANOS,
    };
};

export default useCumpleanosProfesor;
