import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    const sesionInvalida = !profesor;

    useEffect(() => {
        // Sin sesión no se consulta nada; el redirect lo resuelve la página con
        // el router.
        if (sesionInvalida) return;

        if (!asignacionId) {
            // Se espera a que el usuario lea el aviso antes de moverlo, igual que
            // hacía el diálogo nativo que bloqueaba la pantalla.
            Swal.fire({
                icon: "warning",
                title: "Elige una clase",
                text: MENSAJE_RANKING_SIN_ASIGNACION,
                confirmButtonColor: "#059669",
            }).then(() => navigate("/"));
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
    }, [asignacionId, consultarRanking, navigate, periodo, sesionInvalida]);

    return { ranking, loading, error, periodo, sesionInvalida };
};

// Cada pantalla usa el suyo, así que las páginas no necesitan conocer el
// servicio: solo cuál de los dos rankings componen.
export const useRankingBajoRendimiento = () =>
    useRankingProfesor(obtenerRankingBajoRendimiento);

export const useRankingMejorRendimiento = () =>
    useRankingProfesor(obtenerRankingMejorRendimiento);

export default useRankingProfesor;
