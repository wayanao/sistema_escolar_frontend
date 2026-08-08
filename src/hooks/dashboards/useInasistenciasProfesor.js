import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerInasistenciasProfesor } from "../../services/dashboardsApi";
import {
    MENSAJE_ERROR_INASISTENCIAS,
    normalizarInasistencias,
} from "../../utils/dashboards/profesor";

// Sección independiente. Publica su error como estado para que un fallo de red
// no se confunda con la ausencia de inasistencias.
const useInasistenciasProfesor = (profesorId) => {
    const [inasistencias, setInasistencias] = useState([]);
    const [loadingInasistencias, setLoadingInasistencias] = useState(true);
    const [errorInasistencias, setErrorInasistencias] = useState("");
    // Hoy solo carga al montar, pero se numera igual que el resto del módulo.
    const peticionRef = useRef(0);

    const cargarInasistencias = useCallback(async () => {
        if (!profesorId) return;
        const peticion = (peticionRef.current += 1);
        const vigente = () => peticion === peticionRef.current;

        setLoadingInasistencias(true);
        setErrorInasistencias("");
        try {
            const data = await obtenerInasistenciasProfesor(profesorId);
            if (!vigente()) return;
            setInasistencias(normalizarInasistencias(data));
        } catch (error) {
            console.error("Error cargando inasistencias", error);
            if (!vigente()) return;
            setInasistencias([]);
            setErrorInasistencias(MENSAJE_ERROR_INASISTENCIAS);
        } finally {
            if (vigente()) setLoadingInasistencias(false);
        }
    }, [profesorId]);

    useEffect(() => {
        cargarInasistencias();
    }, [cargarInasistencias]);

    return { inasistencias, loadingInasistencias, errorInasistencias };
};

export default useInasistenciasProfesor;
