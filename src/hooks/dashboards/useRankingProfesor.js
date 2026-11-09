import { useEffect, useState } from "react";
import {
    obtenerRankingBajoRendimiento,
    obtenerRankingMejorRendimiento,
} from "../../services/dashboardsApi";
import { MENSAJE_ERROR_RANKING } from "../../utils/dashboards/profesor";

// Las dos páginas de ranking comparten estado de carga y manejo del error;
// solo cambia la consulta. `consultarRanking` debe ser una referencia
// estable, como las funciones del servicio.
//
// La clase y el período los elige la propia página (useClaseRankingProfesor,
// desde el 2026-11-09). Sin clase no se consulta nada: la página pide
// elegirla en vez de devolver al panel.
const useRankingProfesor = (consultarRanking, { asignacionId, periodo }) => {
    // `clave` dice de qué clase y período es lo que hay en pantalla: mientras
    // no coincida con la elegida, el ranking está cargando. Así no se ve un
    // ranking vacío (ni el de la clase anterior) antes de que llegue el nuevo.
    const [resultado, setResultado] = useState({ clave: null, ranking: [], error: "" });

    const profesorStorage = localStorage.getItem("profesor");
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    const sesionInvalida = !profesor;

    const clave = !sesionInvalida && asignacionId && periodo ? `${asignacionId}|${periodo}` : null;

    useEffect(() => {
        // Sin sesión no se consulta nada; el redirect lo resuelve la página con
        // el router.
        if (!clave) return undefined;

        let vigente = true;
        const cargarRanking = async () => {
            try {
                const datos = await consultarRanking(asignacionId, periodo);
                if (vigente) setResultado({ clave, ranking: datos, error: "" });
            } catch (err) {
                if (!vigente) return;
                console.error("Error cargando el ranking", err);
                setResultado({ clave, ranking: [], error: MENSAJE_ERROR_RANKING });
            }
        };

        cargarRanking();
        // Una respuesta tardía de la clase o el período anterior se descarta.
        return () => {
            vigente = false;
        };
    }, [asignacionId, clave, consultarRanking, periodo]);

    const loading = Boolean(clave) && resultado.clave !== clave;

    return {
        ranking: loading ? [] : resultado.ranking,
        loading,
        error: loading ? "" : resultado.error,
        sesionInvalida,
    };
};

// Cada pantalla usa el suyo, así que las páginas no necesitan conocer el
// servicio: solo cuál de los dos rankings componen.
export const useRankingBajoRendimiento = (seleccion) =>
    useRankingProfesor(obtenerRankingBajoRendimiento, seleccion);

export const useRankingMejorRendimiento = (seleccion) =>
    useRankingProfesor(obtenerRankingMejorRendimiento, seleccion);

export default useRankingProfesor;
