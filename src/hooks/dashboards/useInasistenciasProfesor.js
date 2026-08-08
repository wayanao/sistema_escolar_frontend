import { useCallback, useEffect, useState } from "react";
import { obtenerInasistenciasProfesor } from "../../services/dashboardsApi";
import { normalizarInasistencias } from "../../utils/dashboards/profesor";

// Sección independiente. El error solo llega a la consola: la tarjeta muestra
// el mismo estado vacío que cuando de verdad no hay datos. Es comportamiento
// vigente y está registrado como defecto preexistente en el documento.
const useInasistenciasProfesor = (profesorId) => {
    const [inasistencias, setInasistencias] = useState([]);
    const [loadingInasistencias, setLoadingInasistencias] = useState(true);

    const cargarInasistencias = useCallback(async () => {
        if (!profesorId) return;
        setLoadingInasistencias(true);
        try {
            const data = await obtenerInasistenciasProfesor(profesorId);
            setInasistencias(normalizarInasistencias(data));
        } catch (error) {
            console.error("Error cargando inasistencias", error);
        } finally {
            setLoadingInasistencias(false);
        }
    }, [profesorId]);

    useEffect(() => {
        cargarInasistencias();
    }, [cargarInasistencias]);

    return { inasistencias, loadingInasistencias };
};

export default useInasistenciasProfesor;
