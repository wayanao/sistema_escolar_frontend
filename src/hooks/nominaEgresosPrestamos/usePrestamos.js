import { useCallback, useEffect, useState } from "react";
import {
    obtenerPrestamos,
    obtenerProfesoresParaPrestamos,
} from "../../services/nominaEgresosPrestamosApi";
import {
    construirParametrosPrestamos,
    normalizarListaPrestamos,
    totalPrestamosPendientes,
} from "../../utils/nominaEgresosPrestamos/prestamos";

const usePrestamos = () => {
    const [prestamos, setPrestamos] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [loadingProfesores, setLoadingProfesores] = useState(true);
    const [loadingPrestamos, setLoadingPrestamos] = useState(false);
    const [historialConsultado, setHistorialConsultado] = useState(false);
    const [error, setError] = useState(null);
    const [profesorFiltro, setProfesorFiltro] = useState("");

    const cargarProfesores = useCallback(async () => {
        try {
            setLoadingProfesores(true);
            setError(null);
            const datosProfesores = await obtenerProfesoresParaPrestamos();
            setProfesores(datosProfesores);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los profesores o trabajadores.");
        } finally {
            setLoadingProfesores(false);
        }
    }, []);

    // Sin profesor elegido no se consulta el backend: el historial vuelve a su
    // estado inicial.
    const cargarPrestamos = useCallback(async (filtroProfesor) => {
        if (!filtroProfesor) {
            setPrestamos([]);
            setHistorialConsultado(false);
            return;
        }

        try {
            setLoadingPrestamos(true);
            setError(null);
            setHistorialConsultado(true);
            const datosPrestamos = await obtenerPrestamos(
                construirParametrosPrestamos(filtroProfesor)
            );
            setPrestamos(normalizarListaPrestamos(datosPrestamos));
        } catch (err) {
            console.error(err);
            setError("Error al cargar el historial de préstamos.");
        } finally {
            setLoadingPrestamos(false);
        }
    }, []);

    useEffect(() => {
        cargarProfesores();
    }, [cargarProfesores]);

    const mostrarHistorialDe = useCallback(
        (profesorId) => {
            setProfesorFiltro(profesorId);
            return cargarPrestamos(profesorId);
        },
        [cargarPrestamos]
    );

    const limpiarFiltro = useCallback(
        () => mostrarHistorialDe(""),
        [mostrarHistorialDe]
    );

    const buscarHistorial = useCallback(() => {
        if (!profesorFiltro) {
            alert("Selecciona un profesor o trabajador para ver su historial.");
            return;
        }
        cargarPrestamos(profesorFiltro);
    }, [cargarPrestamos, profesorFiltro]);

    const recargarHistorial = useCallback(
        () => cargarPrestamos(profesorFiltro),
        [cargarPrestamos, profesorFiltro]
    );

    return {
        prestamos,
        totalPendiente: totalPrestamosPendientes(prestamos),
        profesores,
        loadingProfesores,
        loadingPrestamos,
        historialConsultado,
        error,
        profesorFiltro,
        mostrarHistorialDe,
        limpiarFiltro,
        buscarHistorial,
        recargarHistorial,
    };
};

export default usePrestamos;
