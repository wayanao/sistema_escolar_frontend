import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerPlaneacionesRecientes } from "../../services/dashboardsApi";
import {
    MENSAJE_ERROR_PLANEACIONES_RECIENTES,
    PARAMETROS_PLANEACIONES_RECIENTES,
    buscarPlaneacion,
    construirRutaPlaneacion,
    normalizarPlaneacionesRecientes,
} from "../../utils/dashboards/profesor";

// Últimas planeaciones de la clase elegida. La caché vive mientras vive la
// página: una planeación creada en otra pantalla no aparece hasta recargar el
// dashboard. Es comportamiento vigente y está registrado como defecto
// preexistente en el documento del módulo.
const usePlaneacionesRecientes = (asignacionId, claseSeleccionada, loadingClases) => {
    const [planeacionesRecientes, setPlaneacionesRecientes] = useState([]);
    const [loadingPlaneacionesRecientes, setLoadingPlaneacionesRecientes] = useState(false);
    const [errorPlaneacionesRecientes, setErrorPlaneacionesRecientes] = useState("");
    const cachePlaneacionesRecientesRef = useRef(new Map());

    useEffect(() => {
        let activo = true;

        if (loadingClases) return () => {
            activo = false;
        };

        if (!asignacionId || !claseSeleccionada) {
            setPlaneacionesRecientes([]);
            setLoadingPlaneacionesRecientes(false);
            setErrorPlaneacionesRecientes("");
            return () => {
                activo = false;
            };
        }

        const cacheKey = String(asignacionId);
        const planeacionesEnCache = cachePlaneacionesRecientesRef.current.get(cacheKey);
        if (planeacionesEnCache) {
            setPlaneacionesRecientes(planeacionesEnCache);
            setLoadingPlaneacionesRecientes(false);
            setErrorPlaneacionesRecientes("");
            return () => {
                activo = false;
            };
        }

        const cargarPlaneacionesRecientes = async () => {
            setLoadingPlaneacionesRecientes(true);
            setErrorPlaneacionesRecientes("");
            setPlaneacionesRecientes([]);

            try {
                const data = await obtenerPlaneacionesRecientes(
                    asignacionId,
                    PARAMETROS_PLANEACIONES_RECIENTES,
                );
                const recientes = normalizarPlaneacionesRecientes(data);
                cachePlaneacionesRecientesRef.current.set(cacheKey, recientes);
                if (activo) setPlaneacionesRecientes(recientes);
            } catch (error) {
                console.error("Error cargando planeaciones recientes", error);
                if (activo) setErrorPlaneacionesRecientes(MENSAJE_ERROR_PLANEACIONES_RECIENTES);
            } finally {
                if (activo) setLoadingPlaneacionesRecientes(false);
            }
        };

        cargarPlaneacionesRecientes();

        return () => {
            activo = false;
        };
    }, [asignacionId, claseSeleccionada, loadingClases]);

    // Ruta en modo presentación de una planeación de la lista, o cadena vacía si
    // no existe o no tiene fecha. La navegación la ejecuta la página.
    const rutaDePlaneacion = useCallback(
        (planId) =>
            construirRutaPlaneacion(
                asignacionId,
                buscarPlaneacion(planeacionesRecientes, planId),
            ),
        [asignacionId, planeacionesRecientes],
    );

    return {
        planeacionesRecientes,
        loadingPlaneacionesRecientes,
        errorPlaneacionesRecientes,
        rutaDePlaneacion,
    };
};

export default usePlaneacionesRecientes;
