import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    obtenerRankingBajoRendimiento,
    obtenerRankingMejorRendimiento,
} from "../../services/dashboardsApi";
import { obtenerPeriodoProfesor } from "../../utils/periodoProfesor";
import {
    MENSAJE_ERROR_RANKING,
    MENSAJE_RANKING_SIN_ASIGNACION,
} from "../../utils/dashboards/profesor";

// Las dos páginas de ranking comparten guardián, origen del contexto, estado de
// carga y manejo del error; solo cambia la consulta. `consultarRanking` debe ser
// una referencia estable, como las funciones del servicio.
const useRankingProfesor = (consultarRanking) => {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Se leen una sola vez, en el render, igual que antes de la migración.
    const asignacionId = localStorage.getItem("asignacionId");
    const periodo = obtenerPeriodoProfesor();
    const profesorStorage = localStorage.getItem("profesor");

    useEffect(() => {
        const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
        if (!profesor) {
            window.location.href = "/login";
            return;
        }

        if (!asignacionId) {
            alert(MENSAJE_RANKING_SIN_ASIGNACION);
            navigate("/");
            return;
        }

        const cargarRanking = async () => {
            setLoading(true);
            setError("");
            try {
                setRanking(await consultarRanking(asignacionId, periodo));
            } catch (err) {
                console.error("Error cargando el ranking", err);
                setRanking([]);
                setError(MENSAJE_ERROR_RANKING);
            } finally {
                setLoading(false);
            }
        };

        cargarRanking();
    }, [asignacionId, consultarRanking, navigate, periodo, profesorStorage]);

    return { ranking, loading, error, periodo };
};

// Cada pantalla usa el suyo, así que las páginas no necesitan conocer el
// servicio: solo cuál de los dos rankings componen.
export const useRankingBajoRendimiento = () =>
    useRankingProfesor(obtenerRankingBajoRendimiento);

export const useRankingMejorRendimiento = () =>
    useRankingProfesor(obtenerRankingMejorRendimiento);

export default useRankingProfesor;
